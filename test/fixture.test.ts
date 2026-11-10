import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {chromium} from 'playwright';
import {html,checkScene,root,Scene} from '../src/scene.js';
export const scene=JSON.parse(readFileSync(root+'/fixtures/m0-overflow/scene.json','utf8')) as Scene;
test('fixture loads offline with seeded clock and visible overflow',async()=>{
 const browser=await chromium.launch({executablePath:'/usr/local/bin/chromium',args:['--no-sandbox']});
 try {const page=await browser.newPage({viewport:{width:1080,height:1920}});const requests:string[]=[];
 await page.route('**/*',r=>{requests.push(r.request().url());return r.abort()});
 await page.setContent(html(scene));await page.waitForFunction('window.__foundryReady===true');
 await page.evaluate('window.seekFrame(120)');
 const result=await page.evaluate(()=>({words:[...document.querySelectorAll('.word')].map(w=>({right:w.getBoundingClientRect().right,opacity:getComputedStyle(w).opacity})),ready:document.fonts.check('150px Fixture')}));
 assert.equal(result.ready,true);assert.ok(result.words.some(w=>w.right>990&&w.opacity==='1'));assert.deepEqual(requests,[]);
 }finally{await browser.close()}
});
test('scene rejects remote assets and wall clock',()=>{
 for(const text of ['https://example.com','Date.now()','new Date()','performance.now()','Math.random()','setTimeout()']) assert.throws(()=>checkScene({...scene,objects:{...scene.objects,title_text:{...scene.objects.title_text,text}}}),/FORBIDDEN_OP/);
});
