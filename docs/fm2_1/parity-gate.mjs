import {build} from '/root/projects/motion-suite-m2/node_modules/vite/dist/node/index.js';
import {chromium} from '../../tooling/m1-browser/node_modules/playwright/index.mjs';
import {pageSource} from '../../dist/src/adapters/motion-suite/page-source.js';
import {describe} from '../../dist/src/recipes/compiler.js';
import {shell,legacy} from '../fm2_step0/probe-config.mjs';
import {serveBundle} from '../../dist/src/adapters/motion-suite/harness.js';
import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';import {spawnSync} from 'node:child_process';import {createHash} from 'node:crypto';
const foundry=fileURLToPath(new URL('../../',import.meta.url)),root='/root/projects/motion-suite-m2';
const work=path.join(foundry,'runs/fm2-1/accepted-gate'),pageDir=path.join(work,'page'),outDir=path.join(work,'bundle');
fs.mkdirSync(pageDir,{recursive:true});fs.writeFileSync(path.join(pageDir,'index.html'),'<html><script type="module" src="./main.ts"></script></html>');
fs.writeFileSync(path.join(pageDir,'main.ts'),pageSource(root)+`\nimport{compatParity}from'${root}/tests/golden-gpu/parity';import{opacityRegression}from'${root}/tests/golden-gpu/opacity';window.foundryGPU={compatParity,opacityRegression};`);
await build({root:pageDir,configFile:false,logLevel:'warn',plugins:[{name:'retain-golden',enforce:'pre',transform(code,id){if(id===root+'/tests/golden/page/main.ts')return{code,map:null,moduleSideEffects:true};}}],resolve:{alias:{'@':root+'/src'}},css:{postcss:{plugins:[]}},build:{outDir,emptyOutDir:true,minify:false,target:'es2022',assetsInlineLimit:0}});
const descriptors=['vox-doc.chart_explainer','paper-collage.build_tear','editorial.cutout_pop'].map(id=>({id,descriptor:describe(JSON.parse(fs.readFileSync(path.join(foundry,'fixtures/m1',id,'ms_scene.json'),'utf8')))}));
const proofFile=path.join(foundry,'runs/m1-live/renders/c71c217f782e4e9e87bfc41796c91e5f7c614f29f55d72e0f466f24de138286a/89b3e03f-8dd7-4cd3-b731-ee3fdcb8d927/project.json');
const proofBytes=fs.readFileSync(proofFile),proofHash=createHash('sha256').update(proofBytes).digest('hex');
if(proofHash!=='feb870ba43231362883fdb0872d685dcfd9dad343518b792a09dfecf4d95b6b7')throw Error('M1 proof project changed');
const proof=JSON.parse(proofBytes),repeats=Number(process.argv[2]??5),evidence={proofProjectSha256:proofHash,launches:[]};
const server=await serveBundle(outDir),url=server.url;
try{for(let repeat=0;repeat<repeats;repeat++){
 const browser=await chromium.launch({executablePath:shell,args:['--no-sandbox',...legacy,'--use-gl=angle','--use-angle=swiftshader']});
 try{
  if(browser.version()!=='153.0.8010.12')throw Error('BACKEND_MISMATCH');
  const context=await browser.newContext({serviceWorkers:'block'});let external=null;
  await context.route('**/*',r=>{if(new URL(r.request().url()).origin===new URL(url).origin)return r.continue();external=r.request().url();return r.abort();});
  const page=await context.newPage();await page.goto(url);await page.evaluate(async()=>{await window.golden.ready;});
  const result=await page.evaluate(async({descriptors,proof})=>{
   const renders={};
   for(const recipe of descriptors){const compiled=await window.foundryMS.compile(recipe.descriptor);await window.foundryMS.prepare(compiled.project);const raw=await window.golden.renderProject(compiled.project,90,'preview');renders[recipe.id]={project:compiled.project,legacy:Uint8Array.from(atob(raw.base64),c=>c.charCodeAt(0)),frame:90};}
   await window.foundryMS.prepare(proof);const raw=await window.golden.renderProject(proof,90,'preview');renders['m1-proof-recipe']={project:proof,legacy:Uint8Array.from(atob(raw.base64),c=>c.charCodeAt(0)),frame:90};
   return {recipes:await window.foundryGPU.compatParity(renders),opacity:await window.foundryGPU.opacityRegression()};
  },{descriptors,proof});
  if(external)throw Error('External request blocked: '+external);
  evidence.launches.push({repeat,browser:browser.version(),...result});
  fs.writeFileSync(path.join(work,'parity-gate.json'),JSON.stringify(evidence,null,2));
  console.log(JSON.stringify({repeat,recipes:result.recipes,opacityExact:result.opacity.every(c=>c.changedChannels===0)}));
 }finally{await browser.close();}
}}finally{await server.close();}
const gate=spawnSync(path.join(root,'node_modules/.bin/tsx'),['tests/golden-gpu/parity-run.ts',path.join(work,'parity-gate.json')],{cwd:root,encoding:'utf8'});
console.log(gate.stdout);console.error(gate.stderr);process.exitCode=gate.status??1;
