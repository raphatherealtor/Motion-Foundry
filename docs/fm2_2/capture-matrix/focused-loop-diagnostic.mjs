// One instrumented diagnostic, never an acceptance retry. No production source changes.
import fs from 'node:fs';import {chromium} from '../../../node_modules/playwright/index.mjs';
import {repairLoop} from '../../../dist/src/repair.js';
const label=process.argv[2]??'001';if(!/^[0-9]{3}$/.test(label))throw Error('Invalid diagnostic label');
const out='runs/fm2-2/focused-loop-diagnostic-'+label;fs.mkdirSync(out,{recursive:false});
const log=e=>fs.appendFileSync(out+'/capture-events.jsonl',JSON.stringify({at:new Date().toISOString(),...e})+'\n');
const launch=chromium.launch.bind(chromium);let pages=0;
chromium.launch=async options=>{
 const browser=await launch(options);browser.on('disconnected',()=>log({event:'browser_disconnected'}));const newPage=browser.newPage.bind(browser);
 browser.newPage=async settings=>{
 const page=await newPage(settings),id=pages++;page.on('crash',()=>log({event:'page_crash',page:id}));const screenshot=page.screenshot.bind(page);
 page.screenshot=async settings=>{
 const start=Date.now(),file=settings?.path??null;
 try{const result=await screenshot(settings);log({event:'screenshot',page:id,file,elapsedMs:Date.now()-start});return result;}
 catch(error){const host={};for(const name of ['cpu.pressure','cpu.stat','memory.events']){try{host[name]=fs.readFileSync('/sys/fs/cgroup/'+name,'utf8');}catch{}}
 const detail={host,event:'screenshot_error',page:id,file,elapsedMs:Date.now()-start,message:String(error),stack:error?.stack??null};log(detail);fs.writeFileSync(out+'/full-error.json',JSON.stringify(detail,null,2));throw error;}
 };return page;
 };return browser;
};
const scene=JSON.parse(fs.readFileSync('fixtures/m0-overflow/scene.json','utf8'));
const result=await repairLoop(scene,out+'/mock-run',true);fs.writeFileSync(out+'/diagnostic-result.json',JSON.stringify({scope:'One instrumented mock repair loop; not acceptance, failed cohort retained',result},null,2));console.log(result.status,result.reason_code??'');process.exitCode=result.status==='PASS'?0:1;
