import{chromium}from '../../tooling/m1-browser/node_modules/playwright/index.mjs';import fs from'node:fs';import http from'node:http';import{shell,legacy,candidates}from'./probe-config.mjs';import{glTools}from'./gl-tools.mjs';import{shaderSuite}from'./shader-suite.mjs';
const base='/root/projects/motion-suite-m2/';const routes={'/font':base+'node_modules/@fontsource/ibm-plex-sans/files/ibm-plex-sans-latin-400-normal.woff2','/png':base+'tests/golden/assets/checker.png'};
const server=http.createServer((req,res)=>res.end(routes[req.url]?fs.readFileSync(routes[req.url]):'<html></html>'));await new Promise(r=>server.listen(0,'127.0.0.1',r));const url=`http://127.0.0.1:${server.address().port}`;const results=[];
try{for(const mode of ['preview','export','worker'])for(let repeat=0;repeat<5;repeat++){
 const browser=await chromium.launch({executablePath:shell,args:['--no-sandbox',...legacy,...candidates[1]]});const context=await browser.newContext({serviceWorkers:"block"});await context.route("**/*",route=>new URL(route.request().url()).hostname==="127.0.0.1"?route.continue():route.abort("blockedbyclient"));const page=await context.newPage();await page.goto(url);
 try{const rows=await page.evaluate(async({fn,tools,mode,assets})=>{
 if(mode!=='worker')return await (0,eval)(`(${fn})`)(document.createElement('canvas'),(0,eval)(`(${tools})`),assets);
 return await new Promise((resolve,reject)=>{const script=`onmessage=async()=>{try{postMessage({rows:await (${fn})(new OffscreenCanvas(1080,1920),(${tools}),${JSON.stringify(assets)})})}catch(e){postMessage({error:String(e)})}}`;const w=new Worker(URL.createObjectURL(new Blob([script],{type:'text/javascript'})));w.onmessage=e=>{w.terminate();e.data.error?reject(Error(e.data.error)):resolve(e.data.rows);};w.onerror=reject;w.postMessage(0);});
 },{fn:shaderSuite.toString(),tools:glTools.toString(),mode,assets:{font:url+'/font',png:url+'/png'}});results.push({mode,repeat,version:browser.version(),rows});console.log(mode,repeat,'complete');}
 finally{await browser.close();fs.writeFileSync('docs/m2_step0/shader-repeats.json',JSON.stringify(results,null,2));}
 }}finally{server.close();}
