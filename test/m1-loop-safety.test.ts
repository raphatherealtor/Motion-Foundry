import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,mkdtempSync} from 'node:fs';
import {resolve} from 'node:path';
import {root} from '../src/scene.js';
import {motionLoop} from '../src/adapters/motion-suite/loop.js';
import {checkBudget,scaledRenderTimeout} from '../src/adapters/motion-suite/budget.js';
import {checkHistory,remember} from '../src/adapters/motion-suite/history.js';
import {projectHash} from '../src/adapters/motion-suite/materialize.js';
const scene=JSON.parse(readFileSync(resolve(root,'fixtures/m1/vox-doc.chart_explainer/ms_scene.json'),'utf8'));
const dir=()=>mkdtempSync(resolve(root,'runs/m1-resume/safety-'));
test('disabled vision and mock/live confusion stop before rendering',async()=>{
 const old=process.env.FOUNDRY_VISION;process.env.FOUNDRY_VISION='off';
 try{const r=await motionLoop(scene,dir(),false,'unused');assert.equal(r.status,'BLOCKED');assert.equal(r.reason_code,'NO_VISION_TRANSPORT');assert.equal(r.closed_loop,'UNREVIEWED');assert.equal(r.budgets_used.renders,0);}finally{if(old===undefined)delete process.env.FOUNDRY_VISION;else process.env.FOUNDRY_VISION=old;}
 const r=await motionLoop(scene,dir(),true,'unused');assert.equal(r.status,'ERROR');assert.equal(r.reason_code,'FORBIDDEN_OP');assert.equal(r.budgets_used.renders,0);
});
test('budgets cap attempts, renders, time and spend',()=>{
 assert.equal(scaledRenderTimeout(180,120),960);assert.throws(()=>scaledRenderTimeout(1.5,120),/TYPE_INVALID/);
 const limits={max_attempts:3,max_renders_per_run:5,run_wall_clock_s:900,reviewer_timeout_s:180,max_output_mb:500,allow_spend:false},used={renders:5,wall_s:1,bytes:0};
 assert.doesNotThrow(()=>checkBudget(limits,used));assert.throws(()=>checkBudget(limits,used,true),/BUDGET_EXHAUSTED/);assert.throws(()=>checkBudget(limits,{...used,wall_s:901}),/BUDGET_EXHAUSTED/);assert.throws(()=>checkBudget({...limits,allow_spend:true},used),/SPEND_RISK/);assert.throws(()=>checkBudget({...limits,max_attempts:4},used),/BUDGET_EXHAUSTED/);
});
test('history rejects no-op projects and per-property reversals',()=>{
 const before:any={project:{activeDocumentId:'d',motionDocuments:{d:{objects:{w:{transform:{scaleX:1,scaleY:1,y:0}}}}}}},after=structuredClone(before);after.project.motionDocuments.d.objects.w.transform.scaleX=.5;
 const history={projects:[projectHash(before)],values:{}},ops:any=[{op:'set',target:'objects.w.transform.scale',value:.5}];
 assert.throws(()=>checkHistory(history,before,before,ops),/OSCILLATION/);checkHistory(history,before,after,ops);remember(history,before,after,ops);
 const back=structuredClone(before);back.project.motionDocuments.d.objects.w.transform.y=20;assert.throws(()=>checkHistory(history,after,back,[{op:'set',target:'objects.w.transform.scale',value:1}]),/OSCILLATION/);
});
