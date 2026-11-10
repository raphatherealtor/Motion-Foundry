import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,readFileSync,writeFileSync,readdirSync,statSync} from 'node:fs';
import {resolve} from 'node:path';
import {MotionSuiteRenderer} from '../src/adapters/motion-suite/renderer.js';
import {RenderSession} from '../src/adapters/motion-suite/session.js';
import {foundryArgs} from '../src/adapters/motion-suite/environment.js';
import {verifyEvidence,assertManifest} from '../src/adapters/motion-suite/evidence.js';
import {root} from '../src/scene.js';
const options=()=>({checkout:process.env.MOTION_SUITE_CHECKOUT||'/root/projects/motion-suite-m1',browserPath:resolve(root,'tooling/m1-browser/browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell'),playwrightModule:resolve(root,'tooling/m1-browser/node_modules/playwright/index.mjs'),workDir:mkdtempSync(resolve(root,'runs/m1-resume/evidence-'))});
test('M1 projected word evidence follows camera, distinguishes unsplit text, and rejects failed asset decode',{timeout:180000},async()=>{
 const opts=options(),renderer=new MotionSuiteRenderer(opts),project=await renderer.synthetic(true),before=JSON.stringify(project),bundle=await renderer.prepare();
 const s=await new RenderSession().open(opts,bundle.outDir,foundryArgs);
 try{
  const first=await s.boxes(project,0),last=await s.boxes(project,179);
  assert.equal(first.word_level.status,'PASS');assert.equal(first.words.length,2);
  assert.deepEqual(first.words.map(w=>w.word),['headline:0','headline:1']);
  assert.notDeepEqual(first.words[0].bbox,last.words[0].bbox);
  const width=(box:number[])=>box[2]-box[0];assert.ok(width(last.words[0].bbox)>width(first.words[0].bbox));
  const sequential=new Map<number,string>();for(const i of [10,75,120])sequential.set(i,JSON.stringify(await s.boxes(project,i)));
  for(const i of [120,10,120,75])assert.equal(JSON.stringify(await s.boxes(project,i)),sequential.get(i));
  const unsplit=structuredClone(project);unsplit.motionDocuments[unsplit.activeDocumentId].objects.headline.text='Two words';
  const row=await s.boxes(unsplit,0);assert.equal(row.word_level.status,'UNSUPPORTED');assert.ok(row.word_level.unsupported_objects.includes('headline'));assert.ok(row.objects.some(o=>o.object==='headline'));assert.ok(!row.words.some(w=>w.object==='headline'));
  const faded=structuredClone(project);faded.motionDocuments[faded.activeDocumentId].objects.headline.transform.opacity=.5;assert.equal((await s.boxes(faded,0)).words[0].opacity,.5);
  const hidden=structuredClone(project);hidden.motionDocuments[hidden.activeDocumentId].objects.headline.transform.z=1e8;
  assert.equal((await s.boxes(hidden,0)).word_level.status,'UNSUPPORTED');
  const parented=structuredClone(project),pd=parented.motionDocuments[parented.activeDocumentId];
  pd.objects.parent={...structuredClone(pd.objects.headline),id:'parent',kind:'group',text:undefined,childIds:['headline']};
  pd.objects.parent.transform.opacity=.5;pd.objects.headline.parentId='parent';pd.rootObjectIds=pd.rootObjectIds.map((id:string)=>id==='headline'?'parent':id);
  assert.equal((await s.boxes(parented,0)).words.find((w:any)=>w.object==='headline')!.opacity,.5);
  const broken=structuredClone(project);broken.assets.bad={id:'bad',kind:'image',name:'bad',mime:'image/png',bytes:1,width:1,height:1,dataUrl:'data:image/png;base64,AA=='};
  await assert.rejects(s.render(broken,0,'preview'),/TYPE_INVALID: ASSET_DECODE bad/);
  assert.equal(JSON.stringify(project),before);
 }finally{await s.close();}
 const output=await renderer.render(project,{start:14,end:17});
 assertManifest(output.manifest);assert.deepEqual(output.manifest.frames.map(f=>f.i),[14,15,16]);assert.deepEqual(output.manifest.contact_sheet.cells,[{cell:0,frame:14}]);assert.equal(verifyEvidence(output.dir).render_id,output.render_id);
 const rows=readFileSync(resolve(output.dir,'boxes.jsonl'),'utf8').trim().split('\n').map(l=>JSON.parse(l));assert.deepEqual(rows.map(r=>r.frame),[14,15,16]);assert.ok(rows.every(r=>r.word_level.status==='PASS'));
 function tamper(file:string,change:(b:Buffer)=>Buffer){const original=readFileSync(file);try{writeFileSync(file,change(original));assert.throws(()=>verifyEvidence(output.dir),/EVIDENCE_HASH_MISMATCH/);}finally{writeFileSync(file,original);}}
 for(const path of ['boxes.jsonl','contact_sheet.png',output.manifest.frames[0].path])tamper(resolve(output.dir,path),b=>Buffer.concat([b,Buffer.from('x')]));
 for(const path of ['project.json','renderer-config.json'])tamper(resolve(output.dir,path),b=>{const value=JSON.parse(b.toString());value.tampered=true;return Buffer.from(JSON.stringify(value));});
 const firstFile=(dir:string):string=>{for(const name of readdirSync(dir)){const path=resolve(dir,name);if(statSync(path).isFile())return path;const nested=firstFile(path);if(nested)return nested;}throw new Error('Empty bundle');};
 tamper(firstFile(resolve(output.dir,'harness')),b=>Buffer.concat([b,Buffer.from('x')]));
 tamper(resolve(output.dir,'manifest.json'),b=>{const value=JSON.parse(b.toString());value.contact_sheet.cells[0].frame=15;return Buffer.from(JSON.stringify(value));});
 const external=resolve(opts.workDir,'external-boxes.jsonl');writeFileSync(external,readFileSync(resolve(output.dir,'boxes.jsonl')));
 tamper(resolve(output.dir,'manifest.json'),b=>{const value=JSON.parse(b.toString());value.object_boxes.path=external;return Buffer.from(JSON.stringify(value));});
 assert.equal(verifyEvidence(output.dir).render_id,output.render_id);
 writeFileSync(resolve(root,'runs/m1-resume/evidence-proof.json'),JSON.stringify({status:'PASS',dir:output.dir,render_id:output.render_id,manifest:output.manifest,parity:output.parity,word_bounds_camera_frames:[0,179],word_bounds_seek:[120,10,120,75],tampering:'REJECTED',unsplit_text:'UNSUPPORTED',asset_decode:'REJECTED'},null,2));
});
test('M1 word geometry uses parent opacity and labels unavailable camera projection',{timeout:90000},async()=>{
 const opts=options(),r=new MotionSuiteRenderer(opts),project=await r.synthetic(true),bundle=await r.prepare(),s=await new RenderSession().open(opts,bundle.outDir,foundryArgs);
 try{
  const grouped=structuredClone(project),d=grouped.motionDocuments[grouped.activeDocumentId];
  d.objects.group={...structuredClone(d.objects.bar),id:'group',kind:'group',transform:{...d.objects.headline.transform,x:0,y:0,opacity:.5},keyframes:[],childIds:['headline','headline_1']};
  d.objects.headline.parentId='group';d.objects.headline_1.parentId='group';d.rootObjectIds=['bar','group'];
  const parsed=await s.page.evaluate(p=>(window as any).foundryMS.parse(p),grouped);
  const faded=await s.boxes(parsed,0);assert.ok(faded.words.every(w=>w.opacity===.5));
  parsed.motionDocuments[parsed.activeDocumentId].objects.group.visible=false;
  assert.ok((await s.boxes(parsed,0)).words.every(w=>!w.displayed&&!w.visible));
  const behind=structuredClone(project);behind.motionDocuments[behind.activeDocumentId].objects.headline.transform.z=10000;
  const clipped=await s.boxes(behind,0);assert.equal(clipped.word_level.status,'UNSUPPORTED');assert.ok(clipped.word_level.unsupported_objects.includes('headline'));assert.equal(clipped.words.find(w=>w.object==='headline')?.visible,false);
 }finally{await s.close();}
});
