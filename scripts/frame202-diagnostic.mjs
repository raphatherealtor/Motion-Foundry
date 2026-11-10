import {chromium} from 'playwright';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {config,boxes} from '../dist/src/render.js';
import {html,assets} from '../dist/src/scene.js';
import {read,write} from '../dist/src/io.js';
import {sha256,hash,canonical} from '../dist/src/hash.js';
const stage=process.argv[2];if(!stage||!/^[a-z0-9-]+$/.test(stage))throw Error('stage required');
const out=resolve('runs/capture-race',stage);mkdirSync(out,{recursive:true});const scene=read('fixtures/m0-overflow/scene.json'),sessions=[];
for(let launch=1;launch<=2;launch++){
 const browser=await chromium.launch({executablePath:'/usr/local/bin/chromium',args:config.args});
 try{const page=await browser.newPage({viewport:config.viewport,deviceScaleFactor:config.deviceScaleFactor});await page.route('**/*',r=>r.abort());await page.setContent(html(scene));await page.waitForFunction('window.__foundryReady && document.fonts.status === "loaded"');
 for(let frame=0;frame<202;frame++){await page.evaluate(i=>window.seekFrame(i),frame);await page.screenshot()}
 await page.evaluate(()=>window.seekFrame(202));const hashes=[],bounds=[];
 for(let n=1;n<=3;n++){const png=await page.screenshot();const path=`launch-${launch}-capture-${n}.png`;writeFileSync(resolve(out,path),png,{flag:'wx'});hashes.push(sha256(png));bounds.push(await boxes(page,202))}
 sessions.push({launch,hashes,bounds,within_session_identical:new Set(hashes).size===1,bounds_identical:bounds.every(b=>canonical(b)===canonical(bounds[0]))});console.log(JSON.stringify({launch,hashes}));
 }finally{await browser.close()}
}
const within=sessions.every(s=>s.within_session_identical),across=sessions[0].hashes[0]===sessions[1].hashes[0];
write(resolve(out,'result.json'),{schema:'foundry.capture_diagnostic/0.1',frame:202,config,source_hash:hash(scene),assets_hash:hash(assets()),sessions,within_sessions_identical:within,across_sessions_identical:across,finding:!within?'CAPTURE_TIMING':!across?'PER_LAUNCH_STATE':'NOT_REPRODUCED',pixel_tolerance:0});
