import {build} from '/root/projects/motion-suite-m2/node_modules/vite/dist/node/index.js';
import {chromium} from '../../tooling/m1-browser/node_modules/playwright/index.mjs';
import {pageSource} from '../../dist/src/adapters/motion-suite/page-source.js';
import {describe} from '../../dist/src/recipes/compiler.js';
import {shell,legacy} from '../fm2_step0/probe-config.mjs';
import {serveBundle} from '../../dist/src/adapters/motion-suite/harness.js';
import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';import {spawnSync} from 'node:child_process';import {createHash} from 'node:crypto';
const foundry=fileURLToPath(new URL('../../',import.meta.url)),root='/root/projects/motion-suite-m2';
const work=path.join(foundry,'runs/fm2-1/containment-control'),pageDir=path.join(work,'page'),outDir=path.join(work,'bundle');
fs.mkdirSync(pageDir,{recursive:true});fs.writeFileSync(path.join(pageDir,'index.html'),'<html><script type="module" src="./main.ts"></script></html>');
fs.writeFileSync(path.join(pageDir,'main.ts'),pageSource(root)+`\nimport{nativeClipControl}from'${root}/tests/golden-gpu/coverage';import{buildSpatialFrame as controlFrame}from'${root}/src/motion/render/spatialProjection';import{fillCoverageControl}from'${root}/tests/golden-gpu/coverage-control';window.foundryGPU={nativeClipControl,buildSpatialFrame:controlFrame,fillCoverageControl};`);
await build({root:pageDir,configFile:false,logLevel:'warn',plugins:[{name:'retain-golden',enforce:'pre',transform(code,id){if(id===root+'/tests/golden/page/main.ts')return{code,map:null,moduleSideEffects:true};}}],resolve:{alias:{'@':root+'/src'}},css:{postcss:{plugins:[]}},build:{outDir,emptyOutDir:true,minify:false,target:'es2022',assetsInlineLimit:0}});
const server=await serveBundle(outDir),browser=await chromium.launch({executablePath:shell,args:['--no-sandbox',...legacy]});const rows=[];
try{const page=await browser.newPage();await page.goto(server.url);await page.evaluate(async()=>{await window.golden.ready;});
for(const recipe of ['paper-collage.build_tear','editorial.cutout_pop']){
 const descriptor=describe(JSON.parse(fs.readFileSync(path.join(foundry,'fixtures/m1',recipe,'ms_scene.json'),'utf8')));
 const result=await page.evaluate(async descriptor=>{const compiled=await window.foundryMS.compile(descriptor);await window.foundryMS.prepare(compiled.project);const project=compiled.project;const frame=window.foundryGPU.buildSpatialFrame(project.motionDocuments[project.activeDocumentId],3);return {clips:window.foundryGPU.nativeClipControl(project,frame,[{x:351,y:1126},{x:400,y:1227},{x:585,y:884},{x:0,y:0}]),fills:window.foundryGPU.fillCoverageControl(project,frame,[{x:351,y:1126},{x:400,y:1227}])};},descriptor);
 rows.push({recipe,result});console.log(JSON.stringify(rows.at(-1)));
}}finally{await browser.close();await server.close();}
fs.writeFileSync(path.join(work,'control.json'),JSON.stringify(rows,null,2));
