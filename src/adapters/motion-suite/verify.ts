import {realpathSync} from 'node:fs';
import {resolve,sep} from 'node:path';
import AjvImport from 'ajv';
import {read,fileHash} from '../../io.js';
import {canonical,hash} from '../../hash.js';
import {schemas} from '../../schemas.js';
import {verifyLive} from '../../kimi-verify.js';
import {MotionSuiteRenderer} from './renderer.js';
import {options} from './defaults.js';
import {materialize,projectHash,Candidate} from './materialize.js';
import {verifyEvidence} from './evidence.js';
import {gateProposal} from './gate.js';
import {History,checkHistory,remember} from './history.js';
import {validateM1,passing} from './validate.js';
import {durable} from './identity.js';
const Ajv=AjvImport as unknown as typeof AjvImport.default;
const runCheck=new Ajv({strict:true}).compile(schemas.RunResult);
const fail=(detail:string):never=>{throw new Error('EVIDENCE_HASH_MISMATCH: '+detail);};
export async function verifyMotionRun(out:string){
 const base=realpathSync(out),r=read(resolve(base,'run-result.json'));
 if(!runCheck(r))fail('RunResult schema');
 const inside=(p:string)=>{const file=realpathSync(resolve(base,p));if(!file.startsWith(base+sep))fail('Artifact escaped run root');return file;};
 const log=read(resolve(base,'decision-log.json'));
 if(fileHash(resolve(base,'decision-log.json'))!==r.decision_log_sha256)fail('Decision log');
 if(fileHash(inside(log.config.path))!==log.config.sha256)fail('Budget config');
 const limits=read(inside(log.config.path));
 for(const e of log.events)for(const f of e.artifacts||[])if(fileHash(inside(f.path))!==f.sha256)fail('Sealed render artifact');
 if(!r.base_dir||!r.final_dir){if(r.status==='PASS')fail('Missing evidence');return {status:r.status,reason_code:r.reason_code,closed_loop:r.closed_loop};}
 for(const [file,expected] of [[resolve(r.base_dir,'manifest.json'),r.baseline_manifest_sha256],[resolve(r.final_dir,'manifest.json'),r.manifest_sha256],[resolve(r.base_dir,'validation-index.json'),r.baseline_validation_index_sha256],[resolve(r.final_dir,'validation-index.json'),r.validation_index_sha256]])if(fileHash(inside(file))!==expected)fail('Root artifact digest');
 const renderer=new MotionSuiteRenderer(options(resolve('/tmp','foundry-ms-verify-'+process.pid+'-'+Date.now()))),scene=read(resolve(base,'ms_scene.json'));
 let candidate:Candidate=read(resolve(base,'base-candidate.json'));
 if(hash(candidate.scene)!==hash(scene)||candidate.ops.length)fail('Base candidate');
 const original=await materialize(renderer,candidate);let current=original,currentDir=inside(r.base_dir);
 const baseManifest=verifyEvidence(currentDir);
 if(hash(durable(read(resolve(currentDir,'project.json'))))!==projectHash(original))fail('Recompiled base');
 if(canonical(read(resolve(currentDir,'intent.json')))!==canonical(candidate))fail('Base intent');
 const checkResults=(dir:string,c:any)=>{
  const actual=validateM1(scene,c,dir,original,r.base_dir,false),index=read(resolve(dir,'validation-index.json'));
  if(index.files.length!==actual.length)fail('Validation coverage');
  for(const f of index.files)if(fileHash(inside(resolve(dir,f.path)))!==f.sha256)fail('Validation file');
  for(const v of actual)if(canonical(read(resolve(dir,'validation',v.validator+'.json')))!==canonical(v))fail('Validation recomputation');
  return actual;
 };
 let results=checkResults(currentDir,current);const history:History={projects:[projectHash(current)],values:{}};
 if(!log.decisions[0]||canonical(log.decisions[0].base_failure)!==canonical(results.filter(v=>v.status==='FAIL')))fail('Base failure record');
 for(const d of log.decisions.filter((d:any)=>d.candidate_revision)){
  const rev=d.candidate_revision,path=inside(rev.path);if(fileHash(path)!==rev.sha256)fail('Candidate file');
  const previousManifest=verifyEvidence(currentDir);gateProposal(scene,current.project,d.reviewer_proposal,previousManifest.revision_id,previousManifest.render_id);
  const next:Candidate=read(path);
  if(hash(next.scene)!==hash(scene)||canonical(next.ops)!==canonical([...candidate.ops,...d.reviewer_proposal.ops]))fail('Candidate chain');
  const compiled=await materialize(renderer,next),dir=inside(rev.dir),m=verifyEvidence(dir);
  if(m.revision_id!==rev.revision_id||m.candidate_id!==rev.candidate_id||previousManifest.revision_id!==rev.parent_revision_id||projectHash(compiled)!==rev.project_hash||projectHash(compiled)!==hash(durable(read(resolve(dir,'project.json')))))fail('Candidate replay');
  if(canonical(read(resolve(dir,'intent.json')))!==canonical(next))fail('Candidate intent');
  checkHistory(history,current,compiled,d.reviewer_proposal.ops);remember(history,current,compiled,d.reviewer_proposal.ops);
  const actual=checkResults(dir,compiled);
  if(canonical(actual)!==canonical(d.new_validation_result))fail('Candidate validation record');
  const regressions=results.filter(v=>v.kind!=='heuristic'&&v.status==='PASS'&&actual.some(x=>x.validator===v.validator&&x.status!=='PASS'));
  if(!regressions.length){candidate=next;current=compiled;currentDir=dir;results=actual;}
 }
 if(currentDir!==inside(r.final_dir))fail('Final candidate promotion');
 if(r.attempts.length>3||r.attempts.length!==log.decisions.filter((d:any)=>d.reviewer_proposal).length||r.budgets_used.renders>5||limits.max_attempts>3||limits.max_renders_per_run>5||limits.run_wall_clock_s>1800||limits.reviewer_timeout_s>180||limits.allow_spend!==false)throw new Error('BUDGET_EXHAUSTED');
 if(r.status==='PASS'&&(r.budgets_used.wall_s>limits.run_wall_clock_s||r.budgets_used.renders>limits.max_renders_per_run))throw new Error('BUDGET_EXHAUSTED');
 const hasLive=log.decisions.some((d:any)=>d.review_evidence);
 if(r.closed_loop==='LIVE'){
  if(r.reviewer.mock||r.reviewer.adapter!=='kimi-acp'||r.reviewer.vision_transport!=='VERIFIED_ATTACHMENT'||!hasLive||!candidate.ops.length||!log.decisions[0].base_failure.length)throw new Error('FORBIDDEN_OP: invalid LIVE provenance');
  verifyLive(log);
 }else if(hasLive)throw new Error('FORBIDDEN_OP: live review mislabeled');
 if(r.closed_loop==='MOCK'&&(!r.reviewer.mock||r.reviewer.adapter!=='mock'))throw new Error('FORBIDDEN_OP: mock provenance');
 if(r.status==='PASS'&&r.closed_loop!=='UNREVIEWED'&&r.last_passing!==verifyEvidence(currentDir).candidate_id)fail('Last passing candidate');
 return {status:r.status==='PASS'?passing(results)?'PASS':'FAIL':r.status,closed_loop:r.closed_loop,render_id:verifyEvidence(currentDir).render_id,validation:results.map(v=>({validator:v.validator,status:v.status})),audio:'NOT_RUN',reason_code:r.reason_code};
}
