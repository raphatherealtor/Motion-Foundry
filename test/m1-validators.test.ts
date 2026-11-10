import test from 'node:test';
import assert from 'node:assert/strict';
import {revealViolations} from '../src/adapters/motion-suite/word-check.js';
import {protectedViolations,tearViolations,anchorViolations} from '../src/adapters/motion-suite/contract-checks.js';
const k=(property:string,frame:number,value:number)=>({property,time:{value:frame,timescale:30},value});
const fixture=():any=>({project:{activeDocumentId:'d',assets:{},motionDocuments:{d:{objects:{w:{kind:'text',text:'Whole',keyframes:[k('opacity',0,0),k('opacity',6,1),k('y',0,10),k('y',6,0)],masks:[],behaviors:[]},bar:{keyframes:[k('y',42,100)]}},rootObjectIds:['w','bar']}}},meta:{words:[{id:'w',text:'Whole',start:6,end:10}],edges:[],anchors:[{object:'bar',frame:42,word_frame:45}]}});
const rows=():any=>[{frame:6,words:[{object:'w',text:'Whole',displayed:true,opacity:1}],objects:[],word_level:{status:'PASS',unsupported_objects:[]}}];
test('whole-word reveal rejects half opacity, unsplit evidence, masks, presets, and excessive rise',()=>{
 assert.deepEqual(revealViolations(fixture(),rows()),[]);
 for(const field of ['opacity','mask','rise','scale','preset','unsplit']){const c=fixture(),r=rows(),w=c.project.motionDocuments.d.objects.w;
 if(field==='opacity')r[0].words[0].opacity=.999;
 if(field==='mask')w.masks=[{id:'clip'}];
 if(field==='rise')w.keyframes[2].value=13;
 if(field==='scale')w.keyframes.push(k('scaleX',0,0));
 if(field==='preset')w.tags=['typewriter'];
 if(field==='unsplit')r[0].word_level.status='UNSUPPORTED';
 assert.ok(revealViolations(c,r).length,field);}
});
test('covered objects cannot change, even if their masks retain an ID',()=>{
 const base=fixture(),candidate=structuredClone(base),scene:any={protected:['w']};
 assert.deepEqual(protectedViolations(scene,candidate,base),[]);
 candidate.project.motionDocuments.d.objects.w.masks=[{id:'changed'}];assert.ok(protectedViolations(scene,candidate,base).length);
});
test('tear seeds and geometry cannot repeat consecutively',()=>{
 const c=fixture();c.meta.edges=[{id:'a',seed:'one',path:'M0'},{id:'b',seed:'two',path:'M1'}];
 c.project.motionDocuments.d.objects.a={masks:[{pathData:'M0'}]};c.project.motionDocuments.d.objects.b={masks:[{pathData:'M1'}]};
 assert.deepEqual(tearViolations(c),[]);c.meta.edges[1].seed='one';assert.ok(tearViolations(c).length);
});
test('anchors inspect actual product keyframes and accept0.1s early, reject0.6s early or late',()=>{
 const c=fixture();assert.deepEqual(anchorViolations(c),[]);
 c.meta.anchors[0].word_frame=60;assert.ok(anchorViolations(c).length);
 c.meta.anchors[0].word_frame=40;assert.ok(anchorViolations(c).length);
 c.meta.anchors[0].word_frame=45;c.project.motionDocuments.d.objects.bar.keyframes[0].time.value=50;assert.ok(anchorViolations(c).length);
});
