import {checkBudget} from './budget.js';
import {existsSync,mkdirSync,readdirSync,statSync} from 'node:fs';
import {resolve} from 'node:path';
import {randomUUID} from 'node:crypto';
import {read,write,fileHash} from '../../io.js';
import {hash} from '../../hash.js';
import {root} from '../../scene.js';
import type {RunResult,ValidationResult} from '../../contracts.js';
import {verifiedCanary} from '../../kimi-proof.js';
import type {MotionScene} from '../../recipes/types.js';
import {MotionSuiteRenderer} from './renderer.js';
import {options} from './defaults.js';
import {materialize,projectHash,Candidate} from './materialize.js';
import {gateProposal} from './gate.js';
import {History,checkHistory,remember} from './history.js';
import {validateM1,passing} from './validate.js';
import {requestReview} from './review.js';
const bytes=(p:string):number=>readdirSync(p).reduce((n,name)=>{const path=resolve(p,name),s=statSync(path);return n+(s.isDirectory()?bytes(path):s.size);},0);
export async function motionLoop(scene:MotionScene,out:string,mock=false,canaryDir?:string){
 mkdirSync(out,{recursive:true});if(existsSync(resolve(out,'run-result.json')))throw new Error('FORBIDDEN_OP: run directory already finalized');
 const started=Date.now(),run_id=randomUUID(),renderer=new MotionSuiteRenderer(options(out));
 const limits={...read(resolve(root,'config/foundry.config.json'))},events:any[]=[],decisions:any[]=[],attempts:any[]=[];
 let renders=0,current:Candidate={scene:structuredClone(scene),ops:[]},currentDir='',baseDir='',last_passing:string|null=null,liveCalled=false;
 let proof:ReturnType<typeof verifiedCanary>|undefined;
 const checkpoint=(state:string,data:any={})=>{const e={state,...structuredClone(data)};events.push(e);write(resolve(out,'checkpoints/'+String(events.length).padStart(3,'0')+'.json'),e);};
 const budget=()=>checkBudget(limits,{renders,wall_s:(Date.now()-started)/1000,bytes:bytes(out)},true);
 const refs=(dir:string)=>['frames.json','parity.json','manifest.json','renderer-config.json','intent.json','policy.json'].map(p=>({path:resolve(dir,p),sha256:fileHash(resolve(dir,p))}));
 const finish=(status:RunResult['status'],reason_code?:string)=>{
  if(status==='PASS'&&(Date.now()-started>limits.run_wall_clock_s*1000||renders>limits.max_renders_per_run||bytes(out)>limits.max_output_mb*1024*1024)){status='BLOCKED';reason_code='BUDGET_EXHAUSTED';}
  write(resolve(out,'run-config.json'),limits);
  write(resolve(out,'decision-log.json'),{schema:'foundry.decision_log/0.1',decisions,events,config:{path:'run-config.json',sha256:fileHash(resolve(out,'run-config.json'))}});
  const r:RunResult={schema:'foundry.run_result/0.1',run_id,status,closed_loop:mock?'MOCK':liveCalled?'LIVE':'UNREVIEWED',reviewer:{adapter:mock?'mock':liveCalled?'kimi-acp':'none',vision_transport:proof?'VERIFIED_ATTACHMENT':'UNVERIFIED',mock},attempts,last_passing,budgets_used:{renders,wall_s:(Date.now()-started)/1000},decision_log_sha256:fileHash(resolve(out,'decision-log.json')),...(reason_code?{reason_code}:{})};
  if(currentDir&&existsSync(resolve(currentDir,'validation-index.json'))&&existsSync(resolve(baseDir,'validation-index.json')))Object.assign(r,{final_dir:currentDir,base_dir:baseDir,manifest_sha256:fileHash(resolve(currentDir,'manifest.json')),validation_index_sha256:fileHash(resolve(currentDir,'validation-index.json')),baseline_manifest_sha256:fileHash(resolve(baseDir,'manifest.json')),baseline_validation_index_sha256:fileHash(resolve(baseDir,'validation-index.json'))});
  write(resolve(out,'run-result.json'),r);return r;
 };
 const render=async(c:any,candidate:Candidate,candidate_id:string|null)=>{
  budget();renders++;const timeout_s=Math.min(960,limits.run_wall_clock_s-(Date.now()-started)/1000);
  return renderer.render(c.project,{start:0,end:scene.frames},{intent:candidate,candidate_id,timeout_s});
 };
 checkpoint('INIT',{limits});write(resolve(out,'ms_scene.json'),scene);write(resolve(out,'base-candidate.json'),current);
 try{
  if(mock&&canaryDir)throw new Error('FORBIDDEN_OP: mock cannot use live proof');
  if(!mock&&(!canaryDir||process.env.FOUNDRY_VISION==='off'))throw new Error('NO_VISION_TRANSPORT');
  const initial=await materialize(renderer,current);let compiled=initial;
  const baseStart=Date.now(),baseRender=await render(initial,current,null);currentDir=baseDir=baseRender.dir;
  const forecast=(Date.now()-baseStart)/1000*4+limits.reviewer_timeout_s*3;
  if(forecast>900){limits.run_wall_clock_s=1800;checkpoint('BUDGET_SCALED',{detail:'Measured full-frame render plus worst-case review forecast exceeds900s',forecast_s:forecast});}
  let results=validateM1(scene,compiled,currentDir,initial,baseDir);
  decisions.push({base_failure:results.filter(v=>v.status==='FAIL'),reviewer_proposal:null,gate_decision:null,candidate_revision:null,new_validation_result:null});
  checkpoint('BASE_VALIDATED',{dir:currentDir,artifacts:refs(currentDir)});
  if(passing(results)){last_passing=baseRender.revision_id;return finish('PASS');}
  if(!mock){if(!canaryDir)throw new Error('NO_VISION_TRANSPORT');proof=verifiedCanary(canaryDir);checkpoint('REVIEW_PROOF',{reviewer_proof:proof});}
  const history:History={projects:[projectHash(initial)],values:{}},prior:any[]=[];
  for(let n=1;n<=Math.min(3,limits.max_attempts);n++){
   budget();const failures=results.filter(v=>v.status==='FAIL'),base=read(resolve(currentDir,'manifest.json')),reviewDir=resolve(out,'reviews',String(n));
   const request={schema:'foundry.review_request/0.2',run_id,base_revision_id:base.revision_id,base_render_id:base.render_id,attachments:[],failures:failures.map(v=>resolve(currentDir,'validation',v.validator+'.json')),window:{start:0,end:180},allowed_ops:'repair-allowlist.motion-suite.v2',budget:{attempt:n,max:Math.min(3,limits.max_attempts)}};
   let proposal:any,evidence:any;
   if(mock){const id=scene.blocks[0].id;proposal={schema:'foundry.repair_proposal/0.2',base_revision_id:base.revision_id,base_render_id:base.render_id,rationale:'Mock only: fit the headline and align the counter with its bar.',ops:[{op:'set',target:'objects.'+id+'_headline.transform.scale',value:.55},{op:'set',target:'objects.'+id+'_value_2.transform.x',value:280}]};write(resolve(reviewDir,'request.json'),request);write(resolve(reviewDir,'proposal.json'),proposal);}
   else{const call=await requestReview(renderer,compiled,currentDir,failures,request,reviewDir,canaryDir!,prior);proposal=call.proposal;evidence=call.evidence;liveCalled=true;}
   const decision:any={base_failure:failures,reviewer_proposal:proposal,gate_decision:null,candidate_revision:null,new_validation_result:null,...(evidence?{review_evidence:evidence}:{})};decisions.push(decision);
   let next:Candidate,nextCompiled:any;
   try{gateProposal(scene,compiled.project,proposal,base.revision_id,base.render_id);next={scene:structuredClone(scene),ops:[...current.ops,...proposal.ops]};nextCompiled=await materialize(renderer,next);checkHistory(history,compiled,nextCompiled,proposal.ops);decision.gate_decision={status:'PASS'};}
   catch(e){decision.gate_decision={status:'ERROR',detail:(e as Error).message};prior.push({proposal,gate:decision.gate_decision});attempts.push({n,gate:decision.gate_decision,limits});if((e as Error).message.startsWith('OSCILLATION'))throw e;continue;}
   const candidate_id='c_'+String(n).padStart(2,'0'),path=resolve(out,'candidates',candidate_id,'candidate.json');write(path,next!);
   remember(history,compiled,nextCompiled,proposal.ops);
   const rendered=await render(nextCompiled,next!,candidate_id),validated=validateM1(scene,nextCompiled,rendered.dir,initial,baseDir);
   const regressions=results.filter(v=>v.kind!=='heuristic'&&v.status==='PASS'&&validated.some(x=>x.validator===v.validator&&x.status!=='PASS')).map(v=>v.validator);
   decision.candidate_revision={candidate_id,revision_id:rendered.revision_id,parent_revision_id:base.revision_id,path,sha256:fileHash(path),project_hash:projectHash(nextCompiled),dir:rendered.dir};decision.new_validation_result=validated;
   attempts.push({n,candidate_id,render_id:rendered.render_id,validation:passing(validated)?'PASS':'FAIL',regressions,limits});checkpoint('REVALIDATED',{candidate_id,dir:rendered.dir,regressions,artifacts:refs(rendered.dir)});prior.push({proposal,failures:validated.filter(v=>v.status==='FAIL')});
   if(regressions.length){checkpoint('CANDIDATE_REJECTED',{detail:'Regression',regressions});continue;}
   current=next!;compiled=nextCompiled;currentDir=rendered.dir;results=validated;
   if(passing(results)){last_passing=candidate_id;checkpoint('DONE');return finish('PASS');}
  }
  return finish('BLOCKED','BUDGET_EXHAUSTED');
 }catch(e){
  const detail=(e as Error).message,code=detail.split(':')[0],known=['TYPE_INVALID','FORBIDDEN_OP','OUT_OF_BOUNDS','REQUIRED_CONTENT_LOST','STALE_BASE','OSCILLATION','BUDGET_EXHAUSTED','NONDETERMINISTIC','NO_VISION_TRANSPORT','SPEND_RISK','EVIDENCE_HASH_MISMATCH'];
  const reason_code=known.includes(code)?code:'TYPE_INVALID';checkpoint('STOP',{reason_code,detail});return finish(['OSCILLATION','BUDGET_EXHAUSTED','NONDETERMINISTIC','NO_VISION_TRANSPORT','SPEND_RISK'].includes(reason_code)?'BLOCKED':'ERROR',reason_code);
 }
}
