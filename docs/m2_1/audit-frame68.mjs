import{build}from'/root/projects/motion-suite-m2/node_modules/vite/dist/node/index.js';
import{chromium}from'../../tooling/m1-browser/node_modules/playwright/index.mjs';
import{pageSource}from'../../dist/src/adapters/motion-suite/page-source.js';
import{describe}from'../../dist/src/recipes/compiler.js';
import{shell,legacy}from'../m2_step0/probe-config.mjs';
import fs from'node:fs';
import{serveBundle}from'../../dist/src/adapters/motion-suite/harness.js';
const root='/root/projects/motion-suite-m2',pageDir='/root/projects/motion-foundry/runs/m2-1/page',outDir='/root/projects/motion-foundry/runs/m2-1/bundle';
fs.mkdirSync(pageDir,{recursive:true});fs.writeFileSync(pageDir+'/index.html','<html><script type="module" src="./main.ts"></script></html>');
fs.writeFileSync(pageDir+'/main.ts',pageSource(root)+`\nimport{WebGL2Backend}from'${root}/src/motion/render/gpu/webgl2';import{renderCompat}from'${root}/src/motion/render/gpu/compat';import{auditPainting}from'${root}/tests/golden-gpu/audit';window.foundryGPU={WebGL2Backend,renderCompat,auditPainting};`);
await build({root:pageDir,configFile:false,plugins:[{name:'retain-golden',enforce:'pre',transform(code,id){if(id===root+'/tests/golden/page/main.ts')return{code,map:null,moduleSideEffects:true};}}],resolve:{alias:{'@':root+'/src'}},css:{postcss:{plugins:[]}},build:{outDir,emptyOutDir:true,minify:false,target:'es2022',assetsInlineLimit:0}});
const server=await serveBundle(outDir),url=server.url;
const browser=await chromium.launch({executablePath:shell,args:['--no-sandbox',...legacy,'--use-gl=angle','--use-angle=swiftshader']});
try{const context=await browser.newContext({serviceWorkers:'block'});await context.route('**/*',r=>new URL(r.request().url()).origin===new URL(url).origin?r.continue():r.abort());const page=await context.newPage();page.on('pageerror',e=>console.log('PAGEERROR',String(e)));
await page.goto(url);await page.evaluate(async()=>{await window.golden.ready;});
const recipe='paper-collage.build_tear';
const descriptor=describe(JSON.parse(fs.readFileSync(`../../fixtures/m1/${recipe}/ms_scene.json`,'utf8')));
const result=await page.evaluate(async descriptor=>{
 const compiled=await window.foundryMS.compile(descriptor);await window.foundryMS.prepare(compiled.project);
 return window.foundryGPU.auditPainting(compiled.project,90,507,794);
},descriptor);
// analyze draw 68 over a window
const row68=result.rows.find(r=>r.index===68);
const before=row68.refBefore; // Uint8ClampedArray
const scr=row68.source; // only 4 bytes (sample pixel)
// Get full-frame comparison at several pixels: we only have the one pixel. Output the row's ops and data.
console.log('SCRATCH:');console.log(JSON.stringify(result.win68.scratch));
console.log('FIRST DIVERGENCE:');console.log(JSON.stringify(result.diverged));
const r68=result.rows.find(r=>r.index===68);console.log('STATE68:',JSON.stringify(r68.state));
fs.writeFileSync('/root/projects/motion-foundry/runs/m2-1/frame68.json',JSON.stringify({ops:row68.ops,source:row68.source,legacy:row68.legacy,gpu:row68.gpu,win:result.win68.scratch,diverged:result.diverged}));
}catch(e){console.log('ERR',String(e));}finally{await browser.close();await server.close();}
