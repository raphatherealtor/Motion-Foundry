import{chromium}from '../../tooling/m1-browser/node_modules/playwright/index.mjs';
import fs from'node:fs';import{capabilities}from'./capabilities.mjs';import{shell,legacy,candidates}from'./probe-config.mjs';
const results=[];
for(const removeDisable of [false,true])for(const candidate of candidates){
 const args=['--no-sandbox',...legacy.filter(x=>!removeDisable||x!=='--disable-gpu'),...candidate];
 const browser=await chromium.launch({executablePath:process.env.M2_BROWSER??shell,args});const page=await browser.newPage();
 const modes={};for(const mode of ['preview','export','worker'])modes[mode]=await page.evaluate(async({fn,mode})=>{
 if(mode!=='worker')return await (0,eval)(`(${fn})`)(document.createElement('canvas'));
 return await new Promise((resolve,reject)=>{const w=new Worker(URL.createObjectURL(new Blob([`onmessage=async()=>{try{postMessage(await (${fn})(new OffscreenCanvas(4,4)))}catch(e){postMessage({error:String(e)})}}`],{type:'text/javascript'})));w.onmessage=e=>{resolve(e.data);w.terminate();};w.onerror=reject;w.postMessage(0);});
 },{fn:capabilities.toString(),mode});
 results.push({version:browser.version(),channel:process.env.M2_BROWSER?'new-headless':'headless-shell',args,modes});await browser.close();
}
fs.writeFileSync(process.env.M2_BROWSER?'docs/m2_step0/capability-sweep.new-headless.json':'docs/m2_step0/capability-sweep.json',JSON.stringify(results,null,2));console.log(JSON.stringify(results.map(r=>({args:r.args.slice(-3),modes:r.modes}))));
