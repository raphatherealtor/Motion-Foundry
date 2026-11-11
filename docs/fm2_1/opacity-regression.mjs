import{build}from'/root/projects/motion-suite-m2/node_modules/vite/dist/node/index.js';
import{chromium}from'../../tooling/m1-browser/node_modules/playwright/index.mjs';
import{pageSource}from'../../dist/src/adapters/motion-suite/page-source.js';
import{shell,legacy}from'../m2_step0/probe-config.mjs';
import fs from'node:fs';
import{serveBundle}from'../../dist/src/adapters/motion-suite/harness.js';
const root='/root/projects/motion-suite-m2',pageDir='/root/projects/motion-foundry/runs/fm2-1/page',outDir='/root/projects/motion-foundry/runs/fm2-1/bundle';
fs.mkdirSync(pageDir,{recursive:true});fs.writeFileSync(pageDir+'/index.html','<html><script type="module" src="./main.ts"></script></html>');
fs.writeFileSync(pageDir+'/main.ts',pageSource(root)+`\nimport{WebGL2Backend}from'${root}/src/motion/render/gpu/webgl2';import{renderCompat}from'${root}/src/motion/render/gpu/compat';import{opacityRegression}from'${root}/tests/golden-gpu/opacity';window.foundryGPU={WebGL2Backend,renderCompat,opacityRegression};`);
await build({root:pageDir,configFile:false,plugins:[{name:'retain-golden',enforce:'pre',transform(code,id){if(id===root+'/tests/golden/page/main.ts')return{code,map:null,moduleSideEffects:true};}}],resolve:{alias:{'@':root+'/src'}},css:{postcss:{plugins:[]}},build:{outDir,emptyOutDir:true,minify:false,target:'es2022',assetsInlineLimit:0}});
const server=await serveBundle(outDir),url=server.url;
const launches=Number(process.argv[2]||5);
const all=[];
const browser=await chromium.launch({executablePath:shell,args:['--no-sandbox',...legacy,'--use-gl=angle','--use-angle=swiftshader']});
try{
for(let r=0;r<launches;r++){
 const context=await browser.newContext({serviceWorkers:'block'});await context.route('**/*',req=>new URL(req.request().url()).origin===new URL(url).origin?req.continue():req.abort());
 const page=await context.newPage();page.on('pageerror',e=>console.log('PAGEERROR',String(e)));
 await page.goto(url);await page.evaluate(async()=>{await window.golden.ready;});
 const result=await page.evaluate(async()=>window.foundryGPU.opacityRegression());
 all.push({repeat:r,cases:result});
 let pass=true;
 for(const c of result){if(c.changedChannels!==0||JSON.stringify(c.gpuPixel)!==JSON.stringify(c.legacyPixel)||JSON.stringify(c.gpuPixel)!==JSON.stringify([...c.expected]))pass=false;}
 console.log(`launch ${r}: ${pass?'PASS':'FAIL'} ${JSON.stringify(result.map(c=>({opacity:c.opacity,stroke:c.stroke,legacy:c.legacyPixel,gpu:c.gpuPixel,changed:c.changedChannels,maxDelta:c.maxDelta})))}`);
 await context.close();
}
}finally{await browser.close();await server.close();}
fs.writeFileSync('/root/projects/motion-foundry/runs/fm2-1/opacity-regression.json',JSON.stringify(all,null,2));
const ok=all.every(r=>r.cases.every(c=>c.changedChannels===0&&JSON.stringify(c.gpuPixel)===JSON.stringify(c.legacyPixel)));
console.log(ok?'PASS: exact legacy overlap pixels and full-frame parity across '+launches+' fresh launches':'FAIL');
if(!ok)process.exitCode=1;
