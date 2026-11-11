import{build}from'/root/projects/motion-suite-m2/node_modules/vite/dist/node/index.js';
import{chromium}from'../../tooling/m1-browser/node_modules/playwright/index.mjs';
import{pageSource}from'../../dist/src/adapters/motion-suite/page-source.js';
import{describe}from'../../dist/src/recipes/compiler.js';
import{shell,legacy}from'../m2_step0/probe-config.mjs';
import fs from'node:fs';
import{serveBundle}from'../../dist/src/adapters/motion-suite/harness.js';
const root='/root/projects/motion-suite-m2',pageDir='/root/projects/motion-foundry/runs/fm2-1/page',outDir='/root/projects/motion-foundry/runs/fm2-1/bundle';
fs.mkdirSync(pageDir,{recursive:true});fs.writeFileSync(pageDir+'/index.html','<html><script type="module" src="./main.ts"></script></html>');
fs.writeFileSync(pageDir+'/main.ts',pageSource(root)+`\nimport{WebGL2Backend}from'${root}/src/motion/render/gpu/webgl2';import{renderCompat}from'${root}/src/motion/render/gpu/compat';import{compatParity}from'${root}/tests/golden-gpu/parity';window.foundryGPU={WebGL2Backend,renderCompat,compatParity};`);
await build({root:pageDir,configFile:false,plugins:[{name:'retain-golden',enforce:'pre',transform(code,id){if(id===root+'/tests/golden/page/main.ts')return{code,map:null,moduleSideEffects:true};}}],resolve:{alias:{'@':root+'/src'}},css:{postcss:{plugins:[]}},build:{outDir,emptyOutDir:true,minify:false,target:'es2022',assetsInlineLimit:0}});
const server=await serveBundle(outDir),url=server.url;
const recipes=['vox-doc.chart_explainer','paper-collage.build_tear','editorial.cutout_pop'];
const descriptors=recipes.map(recipe=>({id:recipe,descriptor:describe(JSON.parse(fs.readFileSync(`../../fixtures/m1/${recipe}/ms_scene.json`,'utf8')))}));
const renders={};
const runs=[];const diffHashes={};
try{for(let repeat=0;repeat<Number(process.argv[2]||5);repeat++){
 const browser=await chromium.launch({executablePath:shell,args:['--no-sandbox',...legacy,'--use-gl=angle','--use-angle=swiftshader']});
 try{
  assert_153(browser);
  const context=await browser.newContext({serviceWorkers:'block'});await context.route('**/*',r=>new URL(r.request().url()).origin===new URL(url).origin?r.continue():r.abort());
  const page=await context.newPage();page.on('pageerror',e=>console.log('PAGEERROR',String(e)));
  await page.goto(url);await page.evaluate(async()=>{await window.golden.ready;});
  const result=await page.evaluate(async recipes=>{
   const renders={};
   for(const recipe of recipes){
    const compiled=await window.foundryMS.compile(recipe.descriptor);
    await window.foundryMS.prepare(compiled.project);
    const legacy=await window.golden.renderProject(compiled.project,90,'preview');
    renders[recipe.id]={project:compiled.project,legacy:Uint8Array.from(atob(legacy.base64),c=>c.charCodeAt(0)),frame:90};
   }
   return window.foundryGPU.compatParity(renders);
  },descriptors);
  for(const [recipe,r] of Object.entries(result)){
   runs.push(r);(diffHashes[recipe]=diffHashes[recipe]||[]).push(r.diff_sha256);
  }
  console.log(JSON.stringify({repeat,results:result}));
 }finally{await browser.close();}
}}finally{await server.close();}
function assert_153(browser){if(browser.version()!=='153.0.8010.12')throw new Error('BACKEND_MISMATCH: '+browser.version());}
fs.mkdirSync('/root/projects/motion-foundry/runs/fm2-1',{recursive:true});
fs.writeFileSync('/root/projects/motion-foundry/runs/fm2-1/parity-gate.json',JSON.stringify({runs},null,2));
// Gate evaluation
const MAX_DELTA=1,MAX_FRACTION=0.0002;
const exact=['vox-doc.chart_explainer'],deviation=['paper-collage.build_tear','editorial.cutout_pop'];
let ok=true;
for(const recipe of exact){
 const rs=runs.filter(r=>r.recipe===recipe);
 for(const r of rs)if(r.changedChannels!==0||r.maxDelta!==0){ok=false;console.log(`FAIL EXACT: ${recipe} changed=${r.changedChannels} maxDelta=${r.maxDelta}`);}
 if(ok)console.log(`EXACT: ${recipe} — 0 differing channels in ${rs.length} launches`);
}
for(const recipe of deviation){
 const rs=runs.filter(r=>r.recipe===recipe);
 for(const r of rs){
  if(r.maxDelta>MAX_DELTA){ok=false;console.log(`FAIL: ${recipe} maxDelta=${r.maxDelta}`);}
  if(r.fraction>MAX_FRACTION){ok=false;console.log(`FAIL: ${recipe} channelFraction=${r.fraction} (pixels ${r.changedPixels})`);}
  if(r.outsideClipEdges!==0){ok=false;console.log(`FAIL: ${recipe} ${r.outsideClipEdges} differing pixels off clip edges`);}
  if(r.deltaGte2!==0){ok=false;console.log(`FAIL: ${recipe} ${r.deltaGte2} deltas >= 2`);}
 }
 if(new Set(diffHashes[recipe]).size!==1){ok=false;console.log(`FAIL: ${recipe} diff map not byte-identical across launches`);}
 else console.log(`DEVIATION OK: ${recipe} — diff_sha256=${diffHashes[recipe][0]}`);
}
console.log(ok?'PASS: compat parity gate':'FAIL: compat parity gate');
if(!ok)process.exitCode=1;
