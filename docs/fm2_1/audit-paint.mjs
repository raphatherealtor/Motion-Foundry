import{build}from'/root/projects/motion-suite-m2/node_modules/vite/dist/node/index.js';
import{chromium}from'../../tooling/m1-browser/node_modules/playwright/index.mjs';
import{pageSource}from'../../dist/src/adapters/motion-suite/page-source.js';
import{describe}from'../../dist/src/recipes/compiler.js';
import{shell,legacy}from'../m2_step0/probe-config.mjs';
import fs from'node:fs';
import{serveBundle}from'../../dist/src/adapters/motion-suite/harness.js';
const root='/root/projects/motion-suite-m2',pageDir='/root/projects/motion-foundry/runs/fm2-1/page',outDir='/root/projects/motion-foundry/runs/fm2-1/bundle';
fs.mkdirSync(pageDir,{recursive:true});fs.writeFileSync(pageDir+'/index.html','<html><script type="module" src="./main.ts"></script></html>');
fs.writeFileSync(pageDir+'/main.ts',pageSource(root)+`\nimport{WebGL2Backend}from'${root}/src/motion/render/gpu/webgl2';import{renderCompat}from'${root}/src/motion/render/gpu/compat';import{auditPainting}from'${root}/tests/golden-gpu/audit';window.foundryGPU={WebGL2Backend,renderCompat,auditPainting};`);
await build({root:pageDir,configFile:false,plugins:[{name:'retain-golden',enforce:'pre',transform(code,id){if(id===root+'/tests/golden/page/main.ts')return{code,map:null,moduleSideEffects:true};}}],resolve:{alias:{'@':root+'/src'}},css:{postcss:{plugins:[]}},build:{outDir,emptyOutDir:true,minify:false,target:'es2022',assetsInlineLimit:0}});
const server=await serveBundle(outDir),url=server.url;
const rows=[];
try{const browser=await chromium.launch({executablePath:shell,args:['--no-sandbox',...legacy,'--use-gl=angle','--use-angle=swiftshader']});
try{const context=await browser.newContext({serviceWorkers:'block'});await context.route('**/*',r=>new URL(r.request().url()).origin===new URL(url).origin?r.continue():r.abort());const page=await context.newPage();page.on('console',m=>console.log('PAGE',m.text()));page.on('pageerror',e=>console.log('PAGEERROR',String(e)));setTimeout(()=>browser.close(),600000).unref();await page.goto(url);await page.evaluate(async()=>{await window.golden.ready;});console.log('harness ready');
for(const recipe of ['vox-doc.chart_explainer']){
 const descriptor=describe(JSON.parse(fs.readFileSync(`../../fixtures/m1/${recipe}/ms_scene.json`,'utf8')));
 const result=await page.evaluate(async descriptor=>{
 const compiled=await window.foundryMS.compile(descriptor);await window.foundryMS.prepare(compiled.project);
 return window.foundryGPU.auditPainting(compiled.project,90,14,13);
 },descriptor);rows.push({recipe,frames:result});console.log(JSON.stringify(rows.at(-1)));
}
}finally{await browser.close();}}finally{await server.close();}
fs.writeFileSync('/root/projects/motion-foundry/runs/fm2-1/paint-audit.json',JSON.stringify(rows,null,2));
