import {resolve} from 'node:path';
import {randomUUID} from 'node:crypto';
import {mkdirSync} from 'node:fs';
import {Scene,root} from './scene.js';
import {RepairProposal,RunResult} from './contracts.js';
import {hash} from './hash.js';
import {write,read,fileHash} from './io.js';
import {render,verifyHashes} from './render.js';
import {validateRender,passing} from './validate.js';
import {gate,remember,History,allowlist} from './gate.js';
import {probe,failingWindowSheet} from './review.js';
export const budgets=read(resolve(root,'config/foundry.config.json'));
export async function repairLoop(original:Scene,out:string,mock=false,maxAttempts=3){
 mkdirSync(out,{recursive:true});const started=Date.now(),run_id=randomUUID();
 const events:Record<string,unknown>[]=[],decisions:Record<string,unknown>[]=[],attempts:Record<string,unknown>[]=[];
 let renders=0,last_passing:string|null=null,seq=0,dir='',baseDir='';
 const checkpoint=(state:string,data:Record<string,unknown>={})=>{const e={state,...data};events.push(e);write(resolve(out,`checkpoints/${String(seq++).padStart(3,'0')}.json`),e)};
 const budget=()=>{if(Date.now()-started>budgets.run_wall_clock_s*1000||renders>=budgets.max_renders_per_run)throw new Error('BUDGET_EXHAUSTED')};
 const finish=(status:RunResult['status'],closed_loop:RunResult['closed_loop'],reason_code?:string)=>{
 const result:RunResult={schema:'foundry.run_result/0.1',run_id,status,closed_loop,reviewer:{adapter:mock?'mock':'none',vision_transport:'UNVERIFIED',mock},attempts,last_passing,budgets_used:{renders,wall_s:(Date.now()-started)/1000},...(reason_code?{reason_code}:{}),...(dir?{manifest_sha256:fileHash(resolve(dir,'manifest.json'))}:{})};
 write(resolve(out,'decision-log.json'),{schema:'foundry.decision_log/0.1',decisions,events});
 Object.assign(result,{base_dir:baseDir,final_dir:dir,decision_log_sha256:fileHash(resolve(out,'decision-log.json')),...(baseDir?{baseline_manifest_sha256:fileHash(resolve(baseDir,'manifest.json'))}:{}),...(dir?{validation_index_sha256:fileHash(resolve(dir,'validation-index.json'))}:{})});
 write(resolve(out,'run-result.json'),result);return result;
 };
 checkpoint('INIT');
 try{
 if(!Number.isInteger(maxAttempts)||maxAttempts<1||maxAttempts>3)throw new Error('BUDGET_EXHAUSTED');
 budget();renders++;baseDir=dir=await render(original,out);checkpoint('RENDERED',{dir});
 let current=original,results=validateRender(dir);checkpoint('VALIDATED',{results});
 const baseFailure=results.filter(r=>r.status==='FAIL');
 decisions.push({base_failure:baseFailure,reviewer_proposal:null,gate_decision:null,candidate_revision:null,new_validation_result:null});
 if(passing(results)){last_passing=verifyHashes(dir).revision_id;checkpoint('DONE');return finish('PASS',mock?'MOCK':'UNREVIEWED')}
 checkpoint('REVIEW');
 if(!mock){probe(resolve(out,'probe'));checkpoint('STOP',{reason_code:'NO_VISION_TRANSPORT'});return finish('BLOCKED','UNREVIEWED','NO_VISION_TRANSPORT')}
 const history:History={hashes:[hash(original)],values:{}};
 for(let n=1;n<=maxAttempts;n++){
 budget();const base=verifyHashes(dir);
 const failures=results.filter(r=>r.status==='FAIL');
 const first=failures[0]?.violations[0] as any;
 const frame=first?.frames?.start??120,window={start:Math.max(0,frame-15),end:Math.min(270,frame+16)};
 const reviewDir=resolve(out,`reviews/${n}`);
 const sheetPath=resolve(reviewDir,'failing-window.png');
 const frameMap=await failingWindowSheet(dir,window,sheetPath);write(resolve(reviewDir,'frame-map.json'),frameMap);
 const request={schema:'foundry.review_request/0.1',run_id,base_revision_id:hash(current),base_render_id:base.render_id,attachments:[{path:sheetPath,sha256:fileHash(sheetPath)}],failures:failures.map(r=>resolve(dir,`validation/${r.validator}.json`)),window,allowed_ops:'repair-allowlist.v1',budget:{attempt:n,max:maxAttempts}};
 write(resolve(reviewDir,'request.json'),request);write(resolve(reviewDir,'allowlist.json'),allowlist);
 // Mock is explicit, deterministic and never represented as a live reviewer.
 const proposal:RepairProposal={schema:'foundry.repair_proposal/0.1',base_revision_id:hash(current),base_render_id:base.render_id,rationale:'Fit the unchanged title inside the safe area.',ops:[{op:'set',target:'objects.title_text.style.fontSize',value:72},{op:'set',target:'objects.title_text.layout.x',value:110},{op:'set',target:'objects.title_text.layout.maxWidth',value:860},{op:'set',target:'objects.title_text.layout.wrap',value:true}]};
 write(resolve(reviewDir,'proposal.json'),proposal);checkpoint('PROPOSED',{proposal});
 const decision:Record<string,unknown>={base_failure:failures,reviewer_proposal:proposal,gate_decision:null,candidate_revision:null,new_validation_result:null};decisions.push(decision);
 let candidate:Scene;
 try{candidate=gate(current,base.render_id,proposal,history);decision.gate_decision={status:'PASS'};checkpoint('GATED',{status:'PASS'})}catch(e){decision.gate_decision={status:'ERROR',reason_code:(e as Error).message};throw e}
 const candidate_id=`c_${String(n).padStart(2,'0')}`,candidatePath=resolve(out,'candidates',candidate_id,'scene.json');
 write(candidatePath,candidate);decision.candidate_revision={candidate_id,revision_id:hash(candidate),parent_revision_id:hash(current),path:candidatePath};checkpoint('CANDIDATE_APPLIED',{candidate_id});
 remember(current,candidate,proposal,history);budget();renders++;dir=await render(candidate,out,false,candidate_id);checkpoint('RERENDERED',{dir});
 const next=validateRender(dir,baseDir);decision.new_validation_result=next;
 const regressions=results.filter(r=>r.status==='PASS'&&next.some(v=>v.validator===r.validator&&v.status==='FAIL')).map(r=>r.validator);
 attempts.push({n,candidate_id,render_id:verifyHashes(dir).render_id,validation:passing(next)?'PASS':'FAIL',regressions});checkpoint('REVALIDATED',{results:next,regressions});
 if(passing(next)&&!regressions.length){last_passing=candidate_id;checkpoint('DONE');return finish('PASS','MOCK')}
 if(next.some(v=>v.validator==='required_content.v1'&&v.status==='FAIL'))throw new Error('REQUIRED_CONTENT_LOST');
 current=candidate;results=next;checkpoint('REVIEW');
 }
 checkpoint('STOP',{reason_code:'BUDGET_EXHAUSTED'});return finish('BLOCKED',mock?'MOCK':'UNREVIEWED','BUDGET_EXHAUSTED');
 }catch(e){const reason_code=(e as Error).message.split(':')[0];checkpoint('STOP',{reason_code});return finish(['OSCILLATION','BUDGET_EXHAUSTED','NONDETERMINISTIC'].includes(reason_code)?'BLOCKED':'ERROR',mock?'MOCK':'UNREVIEWED',reason_code)}
}
