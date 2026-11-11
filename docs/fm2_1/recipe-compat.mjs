import{build}from'/root/projects/motion-suite-m2/node_modules/vite/dist/node/index.js';
import{chromium}from'../../tooling/m1-browser/node_modules/playwright/index.mjs';
import{pageSource}from'../../dist/src/adapters/motion-suite/page-source.js';
import{describe}from'../../dist/src/recipes/compiler.js';
import{shell,legacy}from'../m2_step0/probe-config.mjs';
import fs from'node:fs';
import{serveBundle}from'../../dist/src/adapters/motion-suite/harness.js';
const root='/root/projects/motion-suite-m2',pageDir='/root/projects/motion-foundry/runs/fm2-1/page',outDir='/root/projects/motion-foundry/runs/fm2-1/bundle';
fs.mkdirSync(pageDir,{recursive:true});fs.writeFileSync(pageDir+'/index.html','<html><script type="module" src="./main.ts"></script></html>');
fs.writeFileSync(pageDir+'/main.ts',pageSource(root)+`\nimport{WebGL2Backend}from'${root}/src/motion/render/gpu/webgl2';import{renderCompat}from'${root}/src/motion/render/gpu/compat';window.foundryGPU={WebGL2Backend,renderCompat};`);
await build({root:pageDir,configFile:false,plugins:[{name:'retain-golden',enforce:'pre',transform(code,id){if(id===root+'/tests/golden/page/main.ts')return{code,map:null,moduleSideEffects:true};}}],resolve:{alias:{'@':root+'/src'}},css:{postcss:{plugins:[]}},build:{outDir,emptyOutDir:true,minify:false,target:'es2022',assetsInlineLimit:0}});
const server=await serveBundle(outDir),url=server.url;
const rows=[];
try{const browser=await chromium.launch({executablePath:shell,args:['--no-sandbox',...legacy,'--use-gl=angle','--use-angle=swiftshader']});
try{const context=await browser.newContext({serviceWorkers:'block'});await context.route('**/*',r=>new URL(r.request().url()).origin===new URL(url).origin?r.continue():r.abort());const page=await context.newPage();page.on('console',m=>console.log('PAGE',m.text()));page.on('pageerror',e=>console.log('PAGEERROR',String(e)));setTimeout(()=>browser.close(),600000).unref();await page.goto(url);await page.evaluate(async()=>{await window.golden.ready;});console.log('harness ready');
for(const recipe of ['vox-doc.chart_explainer','paper-collage.build_tear','editorial.cutout_pop']){
 const descriptor=describe(JSON.parse(fs.readFileSync(`../../fixtures/m1/${recipe}/ms_scene.json`,'utf8')));
 const result=await page.evaluate(async descriptor=>{
 console.log('compile begin');const compiled=await window.foundryMS.compile(descriptor);console.log('compile done');const project=compiled.project;await window.foundryMS.prepare(project);console.log('prepare done');const doc=project.motionDocuments[project.activeDocumentId];
 const{WebGL2Backend,renderCompat}=window.foundryGPU;const rows=[];
 const backend=new WebGL2Backend(document.createElement('canvas'),1024**3,true);
 try{for(const frame of [90]){console.log('frame begin',frame);
 const legacy=await window.golden.renderProject(project,frame,'preview');const bytes=Uint8Array.from(atob(legacy.base64),c=>c.charCodeAt(0));
 console.log('legacy done');const rendered=renderCompat(backend,project,doc,frame/30);console.log('gpu done');let changed=0,maxDelta=0;const first=[];const diag={reachTie:0,reachNonTie:0,unreachTie:0,unreachNonTie:0,samples:[]};
 for(let i=0;i<bytes.length;i++){const delta=Math.abs(bytes[i]-rendered.pixels[i]);if(delta){changed++;maxDelta=Math.max(maxDelta,delta);if(first.length<8)first.push({x:Math.floor(i/4)%1080,y:Math.floor(i/4320),channel:i%4,legacy:bytes[i],gpu:rendered.pixels[i]});
  const ch=i%4;if(ch!==3&&diag.samples.length<60){const a=rendered.premul[i+3],pp=rendered.premul[i];const reach=(pp*255+127)%255===0||pp===0||pp===a;const tie=(2*pp*255)%(2*a)===a;diag[reach?'reach':'unreach'+(tie?'Tie':'NonTie')]+=0;diag.samples.push({pp,a,legacy:bytes[i],gpu:rendered.pixels[i]});}}}
 rows.push({frame,changedChannels:changed,maxDelta,first,diag,drawCalls:rendered.graph.length,highWaterBytes:backend.highWaterBytes});
 }}finally{backend.dispose();}return rows;
 },descriptor);rows.push({recipe,frames:result});console.log(JSON.stringify(rows.at(-1)));
}
}finally{await browser.close();}}finally{await server.close();}
fs.writeFileSync('/root/projects/motion-foundry/runs/fm2-1/recipe-compat.json',JSON.stringify(rows,null,2));
if(rows.some(r=>r.frames.some(f=>f.changedChannels)))process.exitCode=1;
