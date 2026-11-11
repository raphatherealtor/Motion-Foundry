import{build}from'/root/projects/motion-suite-m2/node_modules/vite/dist/node/index.js';
import{chromium}from'../../tooling/m1-browser/node_modules/playwright/index.mjs';
import{serveBundle}from'../../dist/src/adapters/motion-suite/harness.js';
import{shell,legacy}from'../fm2_step0/probe-config.mjs';
import fs from'node:fs';import path from'node:path';import{fileURLToPath}from'node:url';import assert from'node:assert/strict';
const foundry=fileURLToPath(new URL('../../',import.meta.url)),root='/root/projects/motion-suite-m2',work=path.join(foundry,'runs/fm2-2/stress'),pageDir=path.join(work,'page'),outDir=path.join(work,'bundle');fs.mkdirSync(pageDir,{recursive:true});
fs.writeFileSync(path.join(pageDir,'index.html'),'<html><script type="module" src="./main.ts"></script></html>');
fs.writeFileSync(path.join(pageDir,'main.ts'),`import{colorStress}from'${root}/tests/golden-gpu/color-stress';import{stressWorker}from'${root}/tests/golden-gpu/color-stress-hosts';window.colorTest={colorStress,stressWorker};`);
await build({root:pageDir,configFile:false,logLevel:'warn',resolve:{alias:{'@':root+'/src'}},css:{postcss:{plugins:[]}},build:{outDir,emptyOutDir:true,minify:false,target:'es2022'}});
const server=await serveBundle(outDir),runs=[];
try{for(let repeat=0;repeat<Number(process.argv[2]??5);repeat++){
 const browser=await chromium.launch({executablePath:shell,args:['--no-sandbox',...legacy,'--use-gl=angle','--use-angle=swiftshader']});
 try{assert.equal(browser.version(),'153.0.8010.12');const context=await browser.newContext({serviceWorkers:'block'});
 await context.route('**/*',r=>new URL(r.request().url()).origin===new URL(server.url).origin?r.continue():r.abort());const page=await context.newPage();await page.goto(server.url);
 const hosts=await page.evaluate(async capture=>({html:await window.colorTest.colorStress(document.createElement('canvas'),capture),offscreen:await window.colorTest.colorStress(new OffscreenCanvas(1,1)),worker:await window.colorTest.stressWorker()}),repeat===0);
 if(hosts.html.payload){fs.writeFileSync(path.join(work,'linear.f32'),Buffer.from(hosts.html.payload.linear,'base64'));for(const[mode,data]of Object.entries(hosts.html.payload.frames))fs.writeFileSync(path.join(work,mode+'.rgba'),Buffer.from(data,'base64'));delete hosts.html.payload;}
 runs.push({repeat,version:browser.version(),hosts});fs.writeFileSync(path.join(work,'results.json'),JSON.stringify({runs},null,2));console.log('completed launch',repeat);
 }finally{await browser.close();}
}}finally{await server.close();}
const baseline=runs[0].hosts.html;
for(const run of runs)for(const [host,result]of Object.entries(run.hosts)){assert.deepEqual(result,baseline,`${host}: float/byte foundation differs across hosts or launches`);}
console.log('PASS: '+runs.length+' fresh launches; color stress and lab float/byte hashes identical across three hosts');
