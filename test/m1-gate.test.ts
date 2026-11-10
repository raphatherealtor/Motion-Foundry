import test from 'node:test';
import assert from 'node:assert/strict';
import {gateOperation,gateProposal,staggerFrames} from '../src/adapters/motion-suite/gate.js';
import {allowlist} from '../src/adapters/motion-suite/v2.js';
const scene:any={blocks:[{id:'vox',recipe:'vox-doc.chart_explainer',params:{headline:'Words stay',caption:'Always'}}],protected:[]};
const project:any={activeDocumentId:'d',motionDocuments:{d:{objects:{vox_thing:{id:'vox_thing',kind:'text',transform:{},masks:[]}}}}};
for(const [pattern,rule] of Object.entries(allowlist.rules) as [string,any][]){test('M1 bounds and types: '+pattern,()=>{
 const target=pattern.replace('*','vox_thing'),run=(value:any)=>gateOperation(scene,project,{op:'set',target,value});
 if(rule.type==='enum'){assert.doesNotThrow(()=>run(rule.values[0]));assert.throws(()=>run('diagonal'),/TYPE_INVALID/);}
 else{assert.doesNotThrow(()=>run(rule.min));assert.doesNotThrow(()=>run(rule.max));assert.throws(()=>run(rule.min-1),/OUT_OF_BOUNDS/);assert.throws(()=>run(rule.max+1),/OUT_OF_BOUNDS/);assert.throws(()=>run(String(rule.min)),/TYPE_INVALID/);}
});}
test('M1 forbids content edits, opacity, raw fields, FPS and unmapped targets',()=>{
 for(const target of ['fps','objects.vox_thing.text.text','objects.vox_thing.transform.opacity','validators.safe','objects.vox_thing.layout.wrap','objects.vox_thing.layout.maxWidth','objects.__proto__.transform.x'])assert.throws(()=>gateOperation(scene,project,{op:'set',target,value:0}),/FORBIDDEN_OP/);
 assert.throws(()=>gateProposal(scene,project,{schema:'foundry.repair_proposal/0.2',base_revision_id:'a',base_render_id:'b',rationale:'x',ops:[{op:'motion_apply_transaction',target:'x',value:{}}]},'a','b'),/FORBIDDEN_OP/);
 assert.throws(()=>gateProposal(scene,project,{schema:'foundry.repair_proposal/0.2',base_revision_id:'stale',base_render_id:'b',rationale:'x',ops:[{op:'set',target:'objects.vox_thing.transform.x',value:1}]},'a','b'),/STALE_BASE/);
});
test('M1 protects covered content and rejects unregistered recipes or generated assets',()=>{
 assert.throws(()=>gateOperation({...scene,protected:['vox_thing']},project,{op:'set',target:'objects.vox_thing.transform.x',value:1}),/FORBIDDEN_OP/);
 for(const value of [{recipe:'missing',params:{}},{recipe:'vox-doc.chart_explainer',params:{headline:'Words stay',caption:'Always',asset:'new.png'}}])assert.throws(()=>gateOperation(scene,project,{op:'apply_recipe',target:'blocks.vox',value}),/FORBIDDEN_OP/);
});
test('M1 stagger and frame shifts are exact and bounded',()=>{
 assert.equal(staggerFrames(.2),6);assert.equal(staggerFrames(.3),9);assert.throws(()=>staggerFrames(.15),/TYPE_INVALID.*NON_INTEGER_FRAME/);assert.throws(()=>staggerFrames(.4),/OUT_OF_BOUNDS/);
 assert.throws(()=>gateOperation(scene,project,{op:'shift_keyframes',target:'objects.vox_thing.entrance',value:.5}),/TYPE_INVALID/);
 assert.throws(()=>gateOperation(scene,project,{op:'shift_keyframes',target:'objects.vox_thing.entrance',value:31}),/OUT_OF_BOUNDS/);
});
