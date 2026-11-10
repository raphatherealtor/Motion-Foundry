import test from 'node:test';
import assert from 'node:assert/strict';
import {Scene,root} from '../src/scene.js';
import {read} from '../src/io.js';
import {Word,Boxes} from '../src/render.js';
import {validate,quantize,logicalPoint} from '../src/validate.js';
const scene=read<Scene>(root+'/fixtures/m0-overflow/scene.json');
const word:Word={object:'title_text',word:'title_text:0',text:'MOTION',bbox:[80,880,300,960],opacity:1,displayed:true,visible:true,fontSize:72};
const row=(w:Word,frame=0):Boxes=>({frame,words:[w],objects:[]});
const check=(s:Scene,rows:Boxes[])=>validate(s,rows,s,rows,'render');
test('safe area uses visible transformed words, not container bounds',()=>{
 assert.equal(check(scene,[row(word)])[0].status,'FAIL');
 assert.equal(check(scene,[row({...word,opacity:0,visible:false})])[0].status,'PASS');
 const entrance={...scene,annotations:[{type:'offscreen_entrance',object:'title_text',range:[0,1] as [number,number]}]};
 assert.equal(check(entrance,[row(word)])[0].status,'PASS');
 assert.equal(check(entrance,[row(word,1)])[0].status,'FAIL');
});
test('full-frame scan catches an event outside contact-sheet stride',()=>{
 const rows=Array.from({length:30},(_,i)=>row({...word,bbox:i===7?word.bbox:[100,880,300,960]},i));
 const failure=check(scene,rows)[0];assert.equal(failure.violations.length,1);assert.deepEqual(failure.violations[0].frames,{start:7,end:8});
});
test('blank heuristics WARN; explicit region and discontinuity contracts FAIL',()=>{
 const empty:Boxes={frame:0,words:[],objects:[]};assert.equal(check(scene,[empty])[4].status,'WARN');
 const s=structuredClone(scene);s.contracts.must_contain_visible_content=[{id:'title-region',region:[90,200,990,1720],range:[0,3]}];s.contracts.forbid_one_frame_discontinuity=['title_text'];
 const r=check(s,[row(word,0),{...empty,frame:1},row(word,2)])[3];
 assert.equal(r.status,'FAIL');assert.ok(r.violations.some(v=>v.reason==='REQUIRED_REGION_BLANK'));assert.ok(r.violations.some(v=>v.reason==='FORBIDDEN_ONE_FRAME_DISCONTINUITY'));
});
test('fixture-only required content preserves words and fully visible duration',()=>{
 const original=structuredClone(scene);original.objects.title_text.text='MOTION';
 const baseline=[row({...word,bbox:[100,880,300,960]})];
 assert.equal(validate(original,baseline,original,baseline,'r')[2].status,'PASS');
 for(const w of [{...word,visible:false,opacity:0},word,{...word,text:'ALTERED'}])assert.equal(validate(original,[row(w)],original,baseline,'r')[2].status,'FAIL');
});
test('half-open quantization and coordinate roundtrip',()=>{
 assert.deepEqual(quantize(0.01,0.04),{start:0,end:2,rounding:{start:'floor',end:'ceil'}});
 assert.equal(quantize(0,9).end,270);
 assert.deepEqual(logicalPoint(55,95,{scale_x:0.5,scale_y:0.5,offset_x:5,offset_y:-5}),[100,200]);
});
test('offscreen words cannot satisfy required content; ordinary flashes only WARN',()=>{
 const one=structuredClone(scene);one.objects.title_text.text='MOTION';
 const base=[row({...word,bbox:[100,880,300,960]})];
 const off=[row({...word,bbox:[1080,880,1300,960],visible:false})];
 assert.equal(validate(one,off,one,base,'r')[2].status,'FAIL');
 const gap=[row(word,0),{frame:1,words:[],objects:[]},row(word,2)];
 const results=check(one,gap);assert.equal(results[3].status,'PASS');assert.equal(results[5].status,'WARN');
});
