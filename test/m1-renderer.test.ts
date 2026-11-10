import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {resolve} from 'node:path';
import {revisionId,renderId} from '../src/adapters/motion-suite/identity.js';
import {compare} from '../src/adapters/motion-suite/metrics.js';
import {MotionSuiteRenderer} from '../src/adapters/motion-suite/renderer.js';
import {RenderSession} from '../src/adapters/motion-suite/session.js';
import {measureParity} from '../src/adapters/motion-suite/parity.js';
import {foundryArgs,goldenArgs} from '../src/adapters/motion-suite/environment.js';
import {root} from '../src/scene.js';
test('M1 identity excludes volatile timestamps and binds renderer inputs',()=>{
 const a=revisionId({seed:1},{createdAt:1,updatedAt:1,doc:{updatedAt:2,x:1}});
 assert.equal(a,revisionId({seed:1},{createdAt:9,updatedAt:3,doc:{updatedAt:9,x:1}}));
 assert.notEqual(a,revisionId({seed:2},{doc:{x:1}}));
 const config={ms_sha:'a',harness_hash:'b',mode:'preview',flags:foundryArgs};
 for(const patch of [{ms_sha:'c'},{harness_hash:'d'},{mode:'worker'},{flags:goldenArgs}])assert.notEqual(renderId(a,config,{start:0,end:5}),renderId(a,{...config,...patch},{start:0,end:5}));
});
test('M1 parity metrics keep zero tolerance including alpha',()=>{
 const a={width:1,height:1,base64:Buffer.from([10,20,30,255]).toString('base64'),alphaBelow255:0};
 assert.equal(compare(a,a).identical,true);
 const b={...a,base64:Buffer.from([10,20,30,254]).toString('base64')};
 assert.deepEqual(compare(a,b).metrics.diff_bbox,[0,0,1,1]);assert.equal(compare(a,b).identical,false);
});
test('M1 product preview, export, worker and golden environment match at five motion stages',{timeout:180000},async()=>{
 const checkout=process.env.MOTION_SUITE_CHECKOUT||'/root/projects/motion-suite-m1';
 const opts={checkout,browserPath:resolve(root,'tooling/m1-browser/browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell'),playwrightModule:resolve(root,'tooling/m1-browser/node_modules/playwright/index.mjs'),workDir:mkdtempSync(resolve(tmpdir(),'foundry-m1-'))};
 const renderer=new MotionSuiteRenderer(opts),bundle=await renderer.prepare(),project=await renderer.synthetic();
 const a=await new RenderSession().open(opts,bundle.outDir,foundryArgs);let b:RenderSession|undefined;
 try{
  b=await new RenderSession().open(opts,bundle.outDir,goldenArgs);
  const frames=[0,45,90,135,179],pairs=await measureParity(project,frames,a,b);
  assert.ok(pairs.every(p=>p.status==='PASS'||p.status==='NOT_RUN'));
  const sequential=new Map<number,string>();for(const i of [10,75,120])sequential.set(i,(await a.render(project,i,'preview')).base64);
  for(const i of [120,10,120,75])assert.equal((await a.render(project,i,'preview')).base64,sequential.get(i));
  writeFileSync(resolve(root,'runs/m1-resume/renderer-parity.json'),JSON.stringify({schema:'foundry.render_parity/0.1',render_id:renderId(revisionId(null,project),{ms_sha:bundle.sha,harness_hash:bundle.bundle_hash,mode:'preview',flags:foundryArgs,browser:a.version()},{start:0,end:180}),ms_sha:bundle.sha,frames,pairs,seek_order:[120,10,120,75],seek_status:'PASS'},null,2));
 }finally{await b?.close();await a.close();}
});
test('M1 parity distinguishes a stable mode mismatch from changing captures',async()=>{
 const pixel=(n:number)=>({width:1,height:1,base64:Buffer.from([n,0,0,255]).toString('base64'),alphaBelow255:0});
 for(const unstable of [false,true]){
  const calls:Record<string,number>={};
  const fake={async render(_project:unknown,_frame:number,mode:string){calls[mode]=(calls[mode]||0)+1;return pixel(mode==='preview'?0:unstable&&calls[mode]>1?0:1);}} as unknown as RenderSession;
  const pairs=await measureParity({},[0],fake,fake);
  assert.equal(pairs[0].status,unstable?'BLOCKED':'FAIL');
  if(unstable)assert.equal(pairs[0].reason_code,'NONDETERMINISTIC');
 }
});
