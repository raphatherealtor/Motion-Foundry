import{build}from'/root/projects/motion-suite-m2/node_modules/vite/dist/node/index.js';
import{chromium}from'../../tooling/m1-browser/node_modules/playwright/index.mjs';
import{serveBundle}from'../../dist/src/adapters/motion-suite/harness.js';
import{shell,legacy}from'../fm2_step0/probe-config.mjs';
import fs from'node:fs';import path from'node:path';import{fileURLToPath}from'node:url';import assert from'node:assert/strict';
const foundry=fileURLToPath(new URL('../../',import.meta.url)),root='/root/projects/motion-suite-m2',work=path.join(foundry,'runs/fm2-2/foundation'),pageDir=path.join(work,'page'),outDir=path.join(work,'bundle');fs.mkdirSync(pageDir,{recursive:true});
fs.writeFileSync(path.join(pageDir,'index.html'),'<html><script type="module" src="./main.ts"></script></html>');
fs.writeFileSync(path.join(pageDir,'main.ts'),`import{colorFoundation}from'${root}/tests/golden-gpu/color';import{colorWorker}from'${root}/tests/golden-gpu/color-hosts';window.colorTest={colorFoundation,colorWorker};`);
await build({root:pageDir,configFile:false,logLevel:'warn',resolve:{alias:{'@':root+'/src'}},css:{postcss:{plugins:[]}},build:{outDir,emptyOutDir:true,minify:false,target:'es2022'}});
const server=await serveBundle(outDir),runs=[];
try{for(let repeat=0;repeat<5;repeat++){
 const browser=await chromium.launch({executablePath:shell,args:['--no-sandbox',...legacy,'--use-gl=angle','--use-angle=swiftshader']});
 try{assert.equal(browser.version(),'153.0.8010.12');const context=await browser.newContext({serviceWorkers:'block'});
 await context.route('**/*',r=>new URL(r.request().url()).origin===new URL(server.url).origin?r.continue():r.abort());const page=await context.newPage();await page.goto(server.url);
 const hosts=await page.evaluate(async()=>({html:await window.colorTest.colorFoundation(document.createElement('canvas')),offscreen:await window.colorTest.colorFoundation(new OffscreenCanvas(1,1)),worker:await window.colorTest.colorWorker()}));
 runs.push({repeat,version:browser.version(),hosts});fs.writeFileSync(path.join(work,'results.json'),JSON.stringify({runs},null,2));console.log('completed launch',repeat);
 }finally{await browser.close();}
}}finally{await server.close();}
const baseline=runs[0].hosts.html;
for(const run of runs)for(const [host,result]of Object.entries(run.hosts)){assert.deepEqual(result,baseline,`${host}: float/byte foundation differs across hosts or launches`);}
console.log('PASS: 256 codes exact in 16F/32F, grade156, dither/alpha/endpoints, five launches across three hosts');
