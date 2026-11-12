import test,{before} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,cpSync,appendFileSync,readFileSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {resolve} from 'node:path';
import {gate,remember,History} from '../src/gate.js';
import {Scene,root} from '../src/scene.js';
import {hash} from '../src/hash.js';
import {read} from '../src/io.js';
import {RepairProposal} from '../src/contracts.js';
import {verifyHashes} from '../src/render.js';
import {repairLoop,budgets} from '../src/repair.js';
import {verifyRun} from '../src/verify.js';
const s=read<Scene>(root+'/fixtures/m0-overflow/scene.json');
const proposal=(target='objects.title_text.style.fontSize',value:any=72):RepairProposal=>({schema:'foundry.repair_proposal/0.1',base_revision_id:hash(s),base_render_id:'render',rationale:'Test proposal.',ops:[{op:'set',target,value}]});
const history=():History=>({hashes:[hash(s)],values:{}});
test('stale revision and render bases are rejected',()=>{
 for(const field of ['base_revision_id','base_render_id'])assert.throws(()=>gate(s,'render',{...proposal(),[field]:'stale'},history()),/STALE_BASE/);
});
for(const target of ['validators.safe','budgets.max','objects.title_text.text','objects.title_text.style.opacity','objects.title_text.style.visibility','objects.title_text.style.display','../scene.json','objects.__proto__.layout.x'])test('forbidden edit: '+target,()=>assert.throws(()=>gate(s,'render',proposal(target,0),history()),/FORBIDDEN_OP/));
for(const [target,value] of [['style.fontSize','72'],['layout.wrap','yes'],['layout.align','diagonal'],['layout.x',1.5]])test('wrong type: '+target,()=>assert.throws(()=>gate(s,'render',proposal('objects.title_text.'+target,value),history()),/TYPE_INVALID/));
for(const [target,value] of [['style.fontSize',10],['style.letterSpacing',11],['layout.x',-1],['layout.maxWidth',901]])test('out of bounds: '+target,()=>assert.throws(()=>gate(s,'render',proposal('objects.title_text.'+target,value),history()),/OUT_OF_BOUNDS/));
test('invalid and shortened timing cannot cheat',()=>{
 assert.throws(()=>gate(s,'render',proposal('objects.title_text.timing.out',30),history()),/OUT_OF_BOUNDS/);
 assert.throws(()=>gate(s,'render',proposal('objects.title_text.timing.out',269),history()),/REQUIRED_CONTENT_LOST/);
});
test('candidate copies preserve original; repeat and property reversal stop oscillation',()=>{
 const before=hash(s),h=history(),p=proposal();const one=gate(s,'render',p,h);remember(s,one,p,h);assert.equal(hash(s),before);
 const back={...proposal(),base_revision_id:hash(one),ops:[{op:'set' as const,target:p.ops[0].target,value:150}]};assert.throws(()=>gate(one,'render',back,h),/OSCILLATION/);
 assert.throws(()=>gate(one,'render',{...p,base_revision_id:hash(one)},h),/OSCILLATION/);
});
test('attempt and render budgets stop the state machine',async()=>{
 const out=mkdtempSync(tmpdir()+'/foundry-budget-');const result=await repairLoop(s,out,true,4);assert.equal(result.status,'BLOCKED');assert.equal(result.reason_code,'BUDGET_EXHAUSTED');assert.equal(result.budgets_used.renders,0);
 const prior=budgets.max_renders_per_run;budgets.max_renders_per_run=0;
 try{const r=await repairLoop(s,mkdtempSync(tmpdir()+'/foundry-budget-'),true);assert.equal(r.reason_code,'BUDGET_EXHAUSTED')}finally{budgets.max_renders_per_run=prior}
});
const acceptance=mkdtempSync(tmpdir()+'/foundry-acceptance-');
before(async()=>{const r=await repairLoop(s,acceptance,true);assert.equal(r.status,'PASS','upstream failed: mock repair-loop setup returned '+r.status+(r.reason_code?' ('+r.reason_code+')':'')+'. Dependent test bodies did not run; inspect untruncated capture traces.');},{timeout:240000});
for(const file of ['frames/f0007.png','boxes.jsonl','contact_sheet.png'])test('independent verifier rejects tampering: '+file,()=>{
 const r=read(acceptance+'/run-result.json'),out=mkdtempSync(tmpdir()+'/foundry-tamper-');cpSync(r.final_dir,out,{recursive:true});appendFileSync(resolve(out,file),'tamper');assert.throws(()=>verifyHashes(out),/EVIDENCE_HASH_MISMATCH/);
});
test('mock PASS is independently verifiable and cannot be LIVE',()=>{const r=read(acceptance+'/run-result.json');assert.equal(r.closed_loop,'MOCK');assert.equal(r.reviewer.mock,true);assert.equal(verifyRun(acceptance).status,'PASS');});
test('run decision log records the complete review and repair chain',()=>{
 const log=read(acceptance+'/decision-log.json');const d=log.decisions.find((d:any)=>d.candidate_revision);
 assert.ok(d.base_failure.length);assert.equal(d.reviewer_proposal.schema,'foundry.repair_proposal/0.1');assert.equal(d.gate_decision.status,'PASS');assert.equal(d.candidate_revision.candidate_id,'c_01');assert.ok(d.new_validation_result.filter((v:any)=>v.kind!=='heuristic').every((v:any)=>v.status==='PASS'));
});
test('forged LIVE label on a mock is rejected by independent verification',()=>{
 const out=mkdtempSync(tmpdir()+'/foundry-forged-');cpSync(acceptance,out,{recursive:true});const r=read(out+'/run-result.json');r.closed_loop='LIVE';
 writeFileSync(out+'/run-result.json',JSON.stringify(r));assert.throws(()=>verifyRun(out),/FORBIDDEN_OP/);
});
test('actual evidence, review and run documents validate against published schemas',async()=>{
 const {default:Ajv}=await import('ajv');const {schemas}=await import('../src/schemas.js');const ajv=new (Ajv as any)({strict:true});ajv.addSchema({...schemas.ProposedOperation,$id:'urn:foundry:operation:0.1'});
 const r=read(acceptance+'/run-result.json');
 for(const [name,path] of [['RunResult',acceptance+'/run-result.json'],['EvidenceManifest',r.final_dir+'/manifest.json'],['ReviewRequest',acceptance+'/reviews/1/request.json'],['RepairProposal',acceptance+'/reviews/1/proposal.json'],['ValidationResult',r.final_dir+'/validation/safe_area.v1.json']]){
 const check=ajv.compile((schemas as any)[name]);const doc=read(path);assert.equal(check(JSON.parse(JSON.stringify(doc))),true,JSON.stringify(check.errors));
 }
});
