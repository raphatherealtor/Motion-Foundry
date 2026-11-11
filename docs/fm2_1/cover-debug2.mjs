import{build}from'/root/projects/motion-suite-m2/node_modules/vite/dist/node/index.js';
import{chromium}from'../../tooling/m1-browser/node_modules/playwright/index.mjs';
import{pageSource}from'../../dist/src/adapters/motion-suite/page-source.js';
import{describe}from'../../dist/src/recipes/compiler.js';
import{shell,legacy}from'../m2_step0/probe-config.mjs';
import fs from'node:fs';
import{serveBundle}from'../../dist/src/adapters/motion-suite/harness.js';
const root='/root/projects/motion-suite-m2',pageDir='/root/projects/motion-foundry/runs/fm2-1/page',outDir='/root/projects/motion-foundry/runs/fm2-1/bundle';
fs.mkdirSync(pageDir,{recursive:true});fs.writeFileSync(pageDir+'/index.html','<html><script type="module" src="./main.ts"></script></html>');
fs.writeFileSync(pageDir+'/main.ts',pageSource(root)+`\nimport{WebGL2Backend}from'${root}/src/motion/render/gpu/webgl2';import{renderCompat}from'${root}/src/motion/render/gpu/compat';import{capturePaint}from'${root}/src/motion/render/gpu/paintCapture';import{drawPlanes}from'${root}/src/motion/render/drawDocument';import* as sp2 from'${root}/src/motion/render/spatialProjection';window.foundryGPU={WebGL2Backend,renderCompat,capturePaint,drawPlanes,bsf:sp2.buildSpatialFrame};`);
await build({root:pageDir,configFile:false,plugins:[{name:'retain-golden',enforce:'pre',transform(code,id){if(id===root+'/tests/golden/page/main.ts')return{code,map:null,moduleSideEffects:true};}}],resolve:{alias:{'@':root+'/src'}},css:{postcss:{plugins:[]}},build:{outDir,emptyOutDir:true,minify:false,target:'es2022',assetsInlineLimit:0}});
const server=await serveBundle(outDir),url=server.url;
const browser=await chromium.launch({executablePath:shell,args:['--no-sandbox',...legacy,'--use-gl=angle','--use-angle=swiftshader']});
try{const page=await (await browser.newContext()).newPage();
await page.goto(url);await page.evaluate(async()=>{await window.golden.ready;});
const descriptor=describe(JSON.parse(fs.readFileSync('../../fixtures/m1/paper-collage.build_tear/ms_scene.json','utf8')));
const out=await page.evaluate(async desc=>{
 const compiled=await window.foundryMS.compile(desc);
 await window.foundryMS.prepare(compiled.project);
 const doc=compiled.project.motionDocuments[compiled.project.activeDocumentId];
 const frameData=window.foundryGPU.bsf(doc,3);
 const scratch=document.createElement('canvas');scratch.width=doc.width;scratch.height=doc.height;
 const perDraw=[];let idx=0;
 const capture=window.foundryGPU.capturePaint(scratch,draw=>{
  if([66,67,68].includes(draw.index)){
   const pts=[[585,884],[397,975],[507,794]];
   perDraw.push({index:draw.index,call:draw.call,alphas:pts.map(([x,y])=>draw.pixels.data[4*(y*doc.width+x)+3])});
  }
 });
 window.foundryGPU.drawPlanes(capture,doc,compiled.project,frameData,frameData.planes,true);
 return perDraw;
},descriptor);
console.log(JSON.stringify(out,null,1));
}catch(e){console.log('ERR',String(e));}finally{await browser.close();await server.close();}
