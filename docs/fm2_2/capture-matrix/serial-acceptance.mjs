import fs from 'node:fs';import path from 'node:path';import {spawnSync} from 'node:child_process';import {createHash} from 'node:crypto';
const root=process.cwd(),out=root+'/runs/fm2-2/serial-acceptance';fs.mkdirSync(out,{recursive:true});
const hash=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const sourceFiles=['package.json','tsconfig.json','config/foundry.config.json','fixtures/m0-overflow/scene.json','docs/fm2_2/capture-matrix/serial-acceptance.mjs','docs/fm2_2/capture-matrix/serial-validation.mjs',...['src','test'].flatMap(dir=>fs.readdirSync(root+'/'+dir,{recursive:true}).filter(p=>typeof p==='string'&&p.endsWith('.ts')).map(p=>dir+'/'+p))].sort();
const identity=()=>Object.fromEntries(sourceFiles.map(p=>[p,hash(root+'/'+p)]));
const statePath=out+'/results.json';let state=fs.existsSync(statePath)?JSON.parse(fs.readFileSync(statePath,'utf8')):{phase:'WAITING_PRELIMINARY',requestedSuites:60,suites:[],status:'IN_PROGRESS'};
const save=()=>fs.writeFileSync(statePath,JSON.stringify(state,null,2));
const stop=detail=>{state.status='FAIL';state.detail=detail;save();throw Error(detail);};
if(state.status==='FAIL')throw Error('Prior failure retained; a new cohort requires an explicit new intervention.');save();
while(spawnSync('systemctl',['is-active','--quiet','jh-bg-48caafcf3918']).status===0)await new Promise(r=>setTimeout(r,5000));
if(!state.sourceIdentity){
 const preliminary=JSON.parse(fs.readFileSync(root+'/runs/fm2-2/serial-validation/results.json','utf8'));
 if(preliminary.status!=='PASS')stop('PRELIMINARY_VALIDATION_FAILED');
 const archived=root+'/runs/fm2-2/serial-preliminary';
 if(!fs.existsSync(archived))fs.cpSync(root+'/runs/fm2-2/serial-validation',archived,{recursive:true});
 else if(hash(archived+'/results.json')!==hash(root+'/runs/fm2-2/serial-validation/results.json'))stop('PRELIMINARY_ARCHIVE_CONFLICT');
 state.sourceIdentity=identity();state.phase='SIXTY_FULL_SUITES';save();
}
for(let i=state.suites.length;i<60;i++){
 if(JSON.stringify(identity())!==JSON.stringify(state.sourceIdentity))stop('SOURCE_CHANGED_DURING_COHORT');
 const before=new Set(fs.readdirSync(root+'/runs').filter(n=>n.startsWith('determinism-'))),start=Date.now();
 const run=spawnSync('npm',['test'],{cwd:root,encoding:'utf8',timeout:900000,maxBuffer:20*1024**2});const text=(run.stdout??'')+(run.stderr??'');fs.writeFileSync(`${out}/${i}.log`,text);
 const totals={};for(const line of text.split('\n')){const m=line.match(/^# (tests|pass|fail|skipped|cancelled) ([0-9]+)$/);if(m)totals[m[1]]=Number(m[2]);}
 const events=fs.readdirSync(root+'/runs').filter(n=>n.startsWith('determinism-')&&!before.has(n)).map(n=>JSON.parse(fs.readFileSync(root+'/runs/'+n,'utf8')));
 const manifests=events.flatMap(e=>[e.a,e.b]).map(p=>JSON.parse(fs.readFileSync(p+'/manifest.json','utf8')));
 const fingerprints=manifests.map(m=>createHash('sha256').update(JSON.stringify({frames:m.frames,boxes:m.object_boxes.sha256,sheet:m.contact_sheet.sha256})).digest('hex'));state.fingerprint??=fingerprints[0];
 const pass=run.status===0&&totals.tests===98&&totals.pass===98&&totals.fail===0&&totals.skipped===0&&totals.cancelled===0&&events.length===1&&events[0].status==='PASS'&&fingerprints.length===2&&fingerprints.every(s=>s===state.fingerprint);
 const record={index:i,elapsedMs:Date.now()-start,exitCode:run.status,error:run.error?.message??null,totals,events,fingerprints,pass};
 fs.writeFileSync(`${out}/${i}.json`,JSON.stringify(record,null,2));state.suites.push(record);save();console.log(JSON.stringify({suite:i+1,total:60,pass,elapsedMs:record.elapsedMs}));
 if(!pass)stop('FULL_SUITE_FAILURE_RETAINED');
}
state.phase='FINAL_FIVE_UNCACHED_AND_98';save();
const final=spawnSync(process.execPath,['docs/fm2_2/capture-matrix/serial-validation.mjs'],{cwd:root,encoding:'utf8',timeout:1800000,maxBuffer:20*1024**2});fs.writeFileSync(out+'/final-proof.log',(final.stdout??'')+(final.stderr??''));
const proof=JSON.parse(fs.readFileSync(root+'/runs/fm2-2/serial-validation/results.json','utf8'));
const pass=final.status===0&&proof.status==='PASS'&&proof.runs.length===5&&proof.runs.every(r=>r.pass&&r.fingerprints.every(s=>s===state.fingerprint))&&proof.suite.pass;
state.finalProof=proof;if(!pass)stop('FINAL_FIVE_OR_98_FAILED');
state.status='PASS';state.phase='COMPLETE';state.failures=0;state.completedSuites=60;state.oneSided95UpperFailureRate=1-Math.pow(.05,1/60);save();console.log('SERIAL ACCEPTANCE PASS:0/60 plus final five uncached tests and98/98');
