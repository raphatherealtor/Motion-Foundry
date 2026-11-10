// 3-repeat determinism check on the two recipes with AA-edge residual
import{build}from'/root/projects/motion-suite-m2/node_modules/vite/dist/node/index.js';
import{chromium}from'../../tooling/m1-browser/node_modules/playwright/index.mjs';
import{pageSource}from'../../dist/src/adapters/motion-suite/page-source.js';
import{describe}from'../../dist/src/recipes/compiler.js';
import{shell,legacy}from'../m2_step0/probe-config.mjs';
import fs from'node:fs';
import{serveBundle}from'../../dist/src/adapters/motion-suite/harness.js';
const root='/root/projects/motion-suite-m2',pageDir='/root/projects/motion-foundry/runs/m2-1/page',outDir='/root/projects/motion-foundry/runs/m2-1/bundle';
fs.mkdirSync(pageDir,{recursive:true});fs.writeFileSync(pageDir+'/index.html','<html><script type="module" src="./main.ts"></script></html>');
fs.writeFileSync(pageDir+'/main.ts',pageSource(root)+`\nimport{WebGL2Backend}from'${root}/src/motion/render/gpu/webgl2';import{renderCompat}from'${root}/src/motion/render/gpu/compat';window.foundryGPU={WebGL2Backend,renderCompat};`);
await build({root:pageDir,configFile:false,plugins:[{name:'retain-golden',enforce:'pre',transform(code,id){if(id===root+'/tests/golden/page/main.ts')return{code,map:null,moduleSideEffects:true};}}],resolve:{alias:{'@':root+'/src'}},css:{postcss:{plugins:[]}},build:{outDir,emptyOutDir:true,minify:false,target:'es2022',assetsInlineLimit:0}});
const server=await serveBundle(outDir),url=server.url;
const browser=await chromium.launch({executablePath:shell,args:['--no-sandbox',...legacy,'--use-gl=angle','--use-angle=swiftshader']});
const hashes={};
try{for(let rep=0;rep<3;rep++){
 const context=await browser.newContext({serviceWorkers:'block'});await context.route('**/*',r=>new URL(r.request().url()).origin===new URL(url).origin?r.continue():r.abort());
 const page=await context.newPage();page.on('pageerror',e=>console.log('PAGEERROR',String(e)));
 await page.goto(url);await page.evaluate(async()=>{await window.golden.ready;});
 for(const recipe of ['paper-collage.build_tear','editorial.cutout_pop']){
  const descriptor=describe(JSON.parse(fs.readFileSync(`../../fixtures/m1/${recipe}/ms_scene.json`,'utf8')));
  const frames=await page.evaluate(async descriptor=>{
   const compiled=await window.foundryMS.compile(descriptor);await window.foundryMS.prepare(compiled.project);
   const doc=compiled.project.motionDocuments[compiled.project.activeDocumentId];
   const{WebGL2Backend,renderCompat}=window.foundryGPU;const rows=[];
   const backend=new WebGL2Backend(document.createElement('canvas'),1024**3,true);
   try{for(const frame of [90]){const rendered=renderCompat(backend,compiled.project,doc,frame/30);
    const h=await crypto.subtle.digest('SHA-256',rendered.pixels.slice().buffer);
    rows.push(Array.from(new Uint8Array(h)).map(v=>v.toString(16).padStart(2,'0')).join(''));}}finally{backend.dispose();}
   return rows;
  },descriptor);
  hashes[recipe]=hashes[recipe]||[];hashes[recipe].push(frames[0]);
 }
 await context.close();
}}finally{await browser.close();await server.close();}
console.log(JSON.stringify(hashes,null,1));
const ok=Object.values(hashes).every(v=>new Set(v).size===1);
console.log(ok?'DETERMINISTIC':'NON-DETERMINISTIC');
if(!ok)process.exitCode=1;
