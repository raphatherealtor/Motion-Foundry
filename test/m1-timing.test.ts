import test from 'node:test';
import assert from 'node:assert/strict';
import {rationalToFrame,frameTime,normalizeProjectTiming,compositionFrames,assertFrameRange,assertNoFpsChange,TimingError} from '../src/adapters/motion-suite/timing.js';
import {MotionSuiteRenderer} from '../src/adapters/motion-suite/renderer.js';
const time=(value:number,timescale=30000)=>({value,timescale});
const fixture=()=>({fps:30,duration:time(180000),activeDocumentId:'d',motionDocuments:{d:{fps:30,duration:time(180000),objects:{word:{keyframes:[{time:time(15000)}],behaviors:[{startTime:time(0),duration:time(6000)}],textSegments:[{startTime:time(0),endTime:time(15000),keyframes:[{time:time(3000)}]}]}},cameras:{camera:{keyframes:[{time:time(120000)}]}},lights:{light:{keyframes:[{time:time(90000)}]}}}}});
const error=(reason_code:string,detail?:string)=>(e:unknown)=>e instanceof TimingError&&e.reason_code===reason_code&&(!detail||e.detail.includes(detail));
test('M1 rational conversion uses exact integer arithmetic without rounding',()=>{
 assert.equal(rationalToFrame(time(15000)),15);assert.equal(rationalToFrame(time(0)),0);
 assert.equal(rationalToFrame(time(Number.MAX_SAFE_INTEGER,30)),Number.MAX_SAFE_INTEGER);
 assert.deepEqual(frameTime(15),{value:15,timescale:30});
 assert.throws(()=>rationalToFrame(time(1001),'word.time'),error('TYPE_INVALID','NON_INTEGER_FRAME word.time'));
});
test('M1 rational conversion rejects unsafe, negative, fractional and invalid-scale times',()=>{
 for(const t of [time(-1),time(.5),time(1,0),time(1,-30),time(30,1.5),time(Infinity),time(Number.MAX_SAFE_INTEGER+1,30),time(Number.MAX_SAFE_INTEGER,1)])assert.throws(()=>rationalToFrame(t),error('TYPE_INVALID'));
 assert.throws(()=>rationalToFrame({...time(15000),extra:true}),error('TYPE_INVALID','Unexpected rational property'));
 assert.throws(()=>frameTime(.5),error('TYPE_INVALID'));assert.throws(()=>frameTime(-1),error('TYPE_INVALID'));
});
test('M1 normalizes every nested clock on a candidate copy',()=>{
 const input=fixture(),before=JSON.stringify(input),normalized=normalizeProjectTiming(input);
 assert.equal(JSON.stringify(input),before);assert.notEqual(normalized,input);assert.equal(compositionFrames(normalized),180);
 const check=(value:unknown)=>{if(!value||typeof value!=='object')return;if('timescale' in value)assert.equal((value as any).timescale,30);for(const v of Object.values(value))check(v);};check(normalized);
 assert.equal(normalized.motionDocuments.d.objects.word.keyframes[0].time.value,15);
});
test('M1 rejects off-grid nested camera, light, behavior and text-segment clocks with paths',()=>{
 const paths=[['objects','word','keyframes',0,'time'],['cameras','camera','keyframes',0,'time'],['lights','light','keyframes',0,'time'],['objects','word','behaviors',0,'duration'],['objects','word','textSegments',0,'endTime']];
 for(const path of paths){const input=fixture();let item:any=input.motionDocuments.d;for(const k of path.slice(0,-1))item=item[k];item[path.at(-1)!]=time(1001);
 assert.throws(()=>normalizeProjectTiming(input),error('TYPE_INVALID','NON_INTEGER_FRAME project.motionDocuments.d.'+path[0]));}
 const input=fixture();delete (input.motionDocuments.d.objects.word.keyframes[0] as any).time;assert.throws(()=>normalizeProjectTiming(input),error('TYPE_INVALID'));
});
test('M1 pins all document FPS and forbids FPS writes',()=>{
 for(const fps of [24,29.97]){
  const a=fixture();a.fps=fps;assert.throws(()=>normalizeProjectTiming(a),error('TYPE_INVALID','project.fps'));
  const b=fixture();b.motionDocuments.d.fps=fps;assert.throws(()=>normalizeProjectTiming(b),error('TYPE_INVALID','motionDocuments.d.fps'));
 }
 for(const target of ['fps','composition.fps','motionDocuments.d.fps'])assert.throws(()=>assertNoFpsChange({target}),error('FORBIDDEN_OP'));
 assert.doesNotThrow(()=>assertNoFpsChange({target:'objects.word.transform.x'}));
});
test('M1 frame ranges are half-open and cannot silently round',()=>{
 assert.doesNotThrow(()=>assertFrameRange({start:179,end:180},180));
 assert.throws(()=>assertFrameRange({start:180,end:181},180),error('OUT_OF_BOUNDS'));
 assert.throws(()=>assertFrameRange({start:0,end:180.5},180),error('TYPE_INVALID','NON_INTEGER_FRAME range.end'));
 assert.throws(()=>assertFrameRange({start:0,end:0},180),error('OUT_OF_BOUNDS'));
});
test('M1 renderer validates timing before loading the product or launching a browser',async()=>{
 const renderer=new MotionSuiteRenderer({checkout:'/does-not-exist',browserPath:'/does-not-exist',workDir:'/does-not-exist'});
 const p=fixture();p.motionDocuments.d.fps=24;
 await assert.rejects(renderer.render(p,{start:0,end:1}),error('TYPE_INVALID','fps'));
 const q=fixture();q.motionDocuments.d.objects.word.keyframes[0].time=time(1001);
 await assert.rejects(renderer.render(q,{start:0,end:1}),error('TYPE_INVALID','NON_INTEGER_FRAME'));
});
