import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
import {MotionSuiteRenderer} from '../../../dist/src/adapters/motion-suite/renderer.js';
import {options} from '../../../dist/src/adapters/motion-suite/defaults.js';
import {materialize} from '../../../dist/src/adapters/motion-suite/materialize.js';
import {verifyEvidence} from '../../../dist/src/adapters/motion-suite/evidence.js';
import {hash} from '../../../dist/src/hash.js';
const run=resolve(process.argv[2]||'runs/m1-live'),r=JSON.parse(readFileSync(resolve(run,'run-result.json'),'utf8'));
if(r.status!=='PASS'||r.closed_loop!=='LIVE')throw Error('FORBIDDEN_OP: a passing live candidate is required');
const log=JSON.parse(readFileSync(resolve(run,'decision-log.json'),'utf8')),decision=log.decisions.find(d=>d.candidate_revision?.candidate_id===r.last_passing),candidate=JSON.parse(readFileSync(decision.candidate_revision.path,'utf8'));
const out=resolve('runs/m1-determinism');mkdirSync(out,{recursive:true});
const renderer=new MotionSuiteRenderer(options(out)),compiled=await materialize(renderer,candidate),runs=[];
const digest=m=>hash({frames:m.frames,boxes:m.object_boxes,sheet:m.contact_sheet}),expected=digest(verifyEvidence(r.final_dir));
const save=()=>writeFileSync(resolve(out,'repeats.json'),JSON.stringify({status:runs.some(x=>x.status!=='PASS')?'BLOCKED':runs.length===5?'PASS':'NOT_RUN',complete:runs.length===5,expected,runs:[...runs].sort((a,b)=>a.i-b.i),uncached:true,fresh_browser_per_run:true,concurrency:2,seek_order:[120,10,120,75]},null,2));
async function once(i){try{const captured=await renderer.render(compiled.project,{start:0,end:180},{intent:candidate,candidate_id:r.last_passing}),m=verifyEvidence(captured.dir),sum=digest(m);runs.push({i,dir:captured.dir,render_id:m.render_id,hash:sum,status:sum===expected&&captured.parity.status==='PASS'?'PASS':'BLOCKED'});}catch(e){runs.push({i,status:'BLOCKED',detail:e.message});}save();console.log('repeat',i,runs.find(x=>x.i===i));}
for(let i=1;i<=5;i+=2)await Promise.all([once(i),...(i+1<=5?[once(i+1)]:[])]);
if(runs.some(x=>x.status!=='PASS'))process.exitCode=1;
