import{build}from'/root/projects/motion-suite-m2/node_modules/vite/dist/node/index.js';
import{chromium}from'../../tooling/m1-browser/node_modules/playwright/index.mjs';
import{pageSource}from'../../dist/src/adapters/motion-suite/page-source.js';
import{describe}from'../../dist/src/recipes/compiler.js';
import{shell,legacy}from'../m2_step0/probe-config.mjs';
import fs from'node:fs';
import{serveBundle}from'../../dist/src/adapters/motion-suite/harness.js';
const root='/root/projects/motion-suite-m2',pageDir='/root/projects/motion-foundry/runs/fm2-1/page',outDir='/root/projects/motion-foundry/runs/fm2-1/bundle';
fs.mkdirSync(pageDir,{recursive:true});fs.writeFileSync(pageDir+'/index.html','<html><script type="module" src="./main.ts"></script></html>');
fs.writeFileSync(pageDir+'/main.ts',pageSource(root)+`\nimport{WebGL2Backend}from'${root}/src/motion/render/gpu/webgl2';import{renderCompat}from'${root}/src/motion/render/gpu/compat';import* as sp from'${root}/src/motion/render/spatialProjection';import* as lm from'${root}/src/motion/render/layerMask';window.foundryGPU={WebGL2Backend,renderCompat};window.__dbg={sp,lm};`);
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
  const sp=window.__dbg.sp, lm=window.__dbg.lm;
 const frameData=sp.buildSpatialFrame(doc,3);
 const coverCanvas=document.createElement('canvas');coverCanvas.width=doc.width;coverCanvas.height=doc.height;
 const coverCtx=coverCanvas.getContext('2d',{willReadFrequently:true});
 const rows=[];
 for(const object of Object.values(doc.objects)){
  if(!object.masks.length)continue;
  const plane=frameData.byId.get(object.id);if(!plane)continue;
  const t=sp.affineProjection(frameData,plane);if(!t)continue;
  coverCtx.setTransform(...t);
  const cov=lm.buildCoverage(object.masks,new DOMMatrix(),doc.width,doc.height);
  coverCtx.setTransform(1,0,0,1,0,0);
  coverCtx.drawImage(cov,0,0);
  rows.push({id:object.id,masks:object.masks.length});
 }
 const data=coverCtx.getImageData(505,792,6,6).data;
 return {rows,window:Array.from(data).filter((_,i)=>i%4===3)};
},descriptor);
console.log(JSON.stringify(out));
}catch(e){console.log('ERR',String(e));}finally{await browser.close();await server.close();}
