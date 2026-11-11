import fs from 'node:fs';import {createHash} from 'node:crypto';
import {chromium} from '../../../node_modules/playwright/index.mjs';
import {html} from '../../../dist/src/scene.js';import {config} from '../../../dist/src/render.js';import {browserExecutable} from '../../../dist/src/adapters/motion-suite/browser.js';
const out='runs/fm2-2/capture-readiness';fs.mkdirSync(out,{recursive:true});
const scene=JSON.parse(fs.readFileSync('fixtures/m0-overflow/scene.json','utf8')),results=[];
for(let launch=0;launch<3;launch++){
 const browser=await chromium.launch({executablePath:browserExecutable(),args:config.args});
 try{const page=await browser.newPage({viewport:config.viewport,deviceScaleFactor:config.deviceScaleFactor});let network=0;await page.route('**/*',r=>{network++;return r.abort();});
 await page.setContent(html(scene),{waitUntil:'load'});await page.waitForFunction('window.__foundryReady===true && document.fonts.status==="loaded"');
 for(let frame=0;frame<270;frame++){
 await page.evaluate(i=>window.seekFrame(i),frame);const samples=[];
 for(let repeat=0;repeat<([81,95,121].includes(frame)?3:1);repeat++){
 if(![81,95,121].includes(frame)){await page.screenshot();continue;}
 // This diagnostic reads layout before capture; baseline matrix has no such instrumentation.
 const state=await page.evaluate(()=>({ready:window.__foundryReady,fontStatus:document.fonts.status,fonts:[...document.fonts].map(f=>({family:f.family,status:f.status})),images:[...document.images].map(i=>({complete:i.complete,width:i.naturalWidth,decoding:i.decoding})),clock:window.foundry,gsapFrame:gsap.ticker.frame,objects:['shape1','shape2'].map(id=>{const e=document.getElementById(id),s=getComputedStyle(e),r=e.getBoundingClientRect();return {id,transform:s.transform,opacity:s.opacity,bbox:[r.x,r.y,r.width,r.height]};})}));
 const png=await page.screenshot();const after=await page.evaluate(()=>({frame:window.foundry.frame,time:window.foundry.time,fontStatus:document.fonts.status,gsapFrame:gsap.ticker.frame}));
 samples.push({repeat,before:state,after,sha256:createHash('sha256').update(png).digest('hex')});fs.writeFileSync(`${out}/${launch}-${frame}-${repeat}.png`,png);
 }
 if(samples.length)results.push({launch,frame,network,samples});
 }
 }finally{await browser.close();}
 fs.writeFileSync(`${out}/results.json`,JSON.stringify(results,null,2));
}
