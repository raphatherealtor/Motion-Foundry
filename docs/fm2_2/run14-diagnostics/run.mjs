import fs from 'node:fs';import path from 'node:path';import {spawnSync} from 'node:child_process';import {createHash} from 'node:crypto';import {systemLoad} from './observer.mjs';
const root=process.cwd(),out=root+'/runs/fm2-2/run14-diagnostics';fs.mkdirSync(out,{recursive:true});
const hook=root+'/docs/fm2_2/run14-diagnostics/observer.mjs',reporter=root+'/docs/fm2_2/run14-diagnostics/root-reporter.mjs';
const statePath=out+'/results.json';let state=fs.existsSync(statePath)?JSON.parse(fs.readFileSync(statePath,'utf8')):{scope:'DIAGNOSTICS ONLY: failed acceptance14 retained, no restart',status:'IN_PROGRESS',classification:null,trials:[]};
const save=()=>fs.writeFileSync(statePath,JSON.stringify(state,null,2));save();
while(spawnSync('systemctl',['is-active','--quiet','jh-bg-fa1d70226f63']).status===0)await new Promise(r=>setTimeout(r,5000));
if(!state.sourceIdentity){
 const check=spawnSync(process.execPath,['docs/fm2_2/run14-diagnostics/selftest.mjs'],{encoding:'utf8'});fs.writeFileSync(out+'/instrumentation-selftest.log',(check.stdout??'')+(check.stderr??''));if(check.status!==0)throw Error('Instrumentation self-test failed');
 const build=spawnSync('npm',['run','build'],{encoding:'utf8',maxBuffer:1024**2});fs.writeFileSync(out+'/initial-build.log',(build.stdout??'')+(build.stderr??''));if(build.status!==0)throw Error('Build failed');
 const files=['package.json','config/foundry.config.json',hook,reporter,...['src','test'].flatMap(d=>fs.readdirSync(root+'/'+d,{recursive:true}).filter(p=>p.endsWith('.ts')).map(p=>d+'/'+p))];
 state.sourceIdentity=Object.fromEntries(files.map(p=>[p,createHash('sha256').update(fs.readFileSync(path.resolve(root,p))).digest('hex')]));save();
}
for(const mode of ['isolated','suite'])for(let index=0;index<20;index++){
 if(state.trials.some(t=>t.mode===mode&&t.index===index))continue;
 if(fs.existsSync(out+'/STOP_DIAGNOSTICS.json')){state.status='STOPPED_FOR_REVIEW';save();process.exit(1);}
 for(const[p,hash]of Object.entries(state.sourceIdentity))if(createHash('sha256').update(fs.readFileSync(path.resolve(root,p))).digest('hex')!==hash)throw Error('Diagnostic source changed: '+p);
 const dir=path.join(out,mode,String(index).padStart(2,'0'));fs.mkdirSync(dir,{recursive:true});const start=new Date().toISOString(),loadStart=systemLoad();
 if(mode==='suite'){const build=spawnSync('npm',['run','build'],{encoding:'utf8',maxBuffer:1024**2});fs.writeFileSync(dir+'/build.log',(build.stdout??'')+(build.stderr??''));if(build.status!==0)throw Error('Diagnostic build failed');}
 const files=mode==='isolated'?['dist/test/negative.test.js']:fs.readdirSync(root+'/dist/test').filter(n=>n.endsWith('.test.js')).map(n=>'dist/test/'+n);
 const args=['--import='+hook,'--test','--test-concurrency=1','--test-reporter=tap','--test-reporter='+reporter,'--test-reporter-destination='+dir+'/tests.tap','--test-reporter-destination='+dir+'/roots.json',...files];
 const run=spawnSync(process.execPath,args,{cwd:root,env:{...process.env,FOUNDRY_CAPTURE_DIAGNOSTIC_DIR:dir},encoding:'utf8',timeout:mode==='isolated'?360000:900000,maxBuffer:10*1024**2});fs.writeFileSync(dir+'/process.log',(run.stdout??'')+(run.stderr??''));
 const text=fs.existsSync(dir+'/tests.tap')?fs.readFileSync(dir+'/tests.tap','utf8'):'';const totals={};for(const line of text.split('\n')){const m=line.match(/^# (tests|pass|fail|skipped|cancelled) ([0-9]+)$/);if(m)totals[m[1]]=Number(m[2]);}
 const roots=fs.existsSync(dir+'/roots.json')?JSON.parse(fs.readFileSync(dir+'/roots.json','utf8')):null;
 const captures=fs.existsSync(dir+'/captures')?fs.readdirSync(dir+'/captures',{recursive:true}).filter(p=>p.endsWith('events.jsonl')).map(p=>'captures/'+p):[];
 const record={mode,index,start,end:new Date().toISOString(),loadStart,loadEnd:systemLoad(),exitCode:run.status,error:run.error?.message??null,totals,roots,captureLogs:captures};
 fs.writeFileSync(dir+'/result.json',JSON.stringify(record,null,2));state.trials.push(record);save();console.log(JSON.stringify({mode,index,exitCode:run.status,rootFailures:roots?.rootFailureCount,dependents:roots?.dependentFailureCount}));
 if(run.error||!roots||!captures.length){state.status='STOPPED_INSTRUMENTATION_OR_PROCESS_ERROR';save();process.exit(1);}
}
state.status='COMPLETE_UNCLASSIFIED';save();console.log('40 DIAGNOSTIC TRIALS COMPLETE; classification requires evidence review. Acceptance remains HOLD.');
