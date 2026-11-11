import fs from 'node:fs';import path from 'node:path';import os from 'node:os';
import {chromium} from '../../../node_modules/playwright/index.mjs';
export function systemLoad(){const cgroup={};for(const name of ['cpu.pressure','cpu.stat','memory.events','memory.current','pids.current','io.pressure']){try{cgroup[name]=fs.readFileSync('/sys/fs/cgroup/'+name,'utf8');}catch{}}
 return {loadavg:os.loadavg(),freeMemoryBytes:os.freemem(),processCpu:process.cpuUsage(),cgroup};}
export async function observeScreenshot(take,options,record,context={}){
 const start=Date.now(),monotonicStart=process.hrtime.bigint();record({event:'capture_start',at:new Date(start).toISOString(),monotonicNs:String(monotonicStart),load:systemLoad(),...context});
 try{const result=await take(options);record({event:'capture_end',at:new Date().toISOString(),elapsedMs:Date.now()-start,monotonicElapsedNs:String(process.hrtime.bigint()-monotonicStart),load:systemLoad(),...context});return result;}
 catch(error){record({event:'capture_error',at:new Date().toISOString(),elapsedMs:Date.now()-start,monotonicElapsedNs:String(process.hrtime.bigint()-monotonicStart),load:systemLoad(),name:error?.name??null,message:String(error),stack:error?.stack??null,...context});throw error;}
}
const target=process.env.FOUNDRY_CAPTURE_DIAGNOSTIC_DIR;
if(target){
 const dir=path.join(target,'captures',String(process.pid));fs.mkdirSync(dir,{recursive:true});
 const record=e=>{fs.appendFileSync(dir+'/events.jsonl',JSON.stringify({pid:process.pid,argv:process.argv,...e})+'\n');if(e.event==='capture_error')fs.writeFileSync(dir+'/exception-'+Date.now()+'.json',JSON.stringify(e,null,2));};
 const launch=chromium.launch.bind(chromium);let browserId=0,pageId=0;
 chromium.launch=async options=>{const browser=await launch(options),bid=browserId++;record({event:'browser_open',at:new Date().toISOString(),browser:bid,version:browser.version(),load:systemLoad()});
 browser.on('disconnected',()=>record({event:'browser_disconnected',at:new Date().toISOString(),browser:bid,load:systemLoad()}));
 const newPage=browser.newPage.bind(browser);browser.newPage=async settings=>{const page=await newPage(settings),pid=pageId++;page.on('crash',()=>record({event:'page_crash',at:new Date().toISOString(),page:pid,browser:bid,load:systemLoad()}));
 const screenshot=page.screenshot.bind(page);page.screenshot=options=>observeScreenshot(screenshot,options,record,{browser:bid,page:pid,file:options?.path??null,requestedTimeout:options?.timeout??null});return page;};return browser;};
}
