import fs from 'node:fs';import path from 'node:path';import {spawnSync} from 'node:child_process';
const root=process.cwd(),out=root+'/runs/fm2-2/frame210-bounded',hook=root+'/docs/fm2_2/frame210/bounded/hook.mjs';fs.mkdirSync(out,{recursive:true});const stateFile=out+'/results.json';if(fs.existsSync(stateFile))throw Error('Do not restart bounded campaign');
const state={status:'IN_PROGRESS',started:new Date().toISOString(),deadline:new Date(Date.now()+6900000).toISOString(),budgetNote:'115 minutes driver budget reserves setup/report time within two-hour total',trials:[],classification:'UNVERIFIED'};const save=()=>fs.writeFileSync(stateFile,JSON.stringify(state,null,2));save();
for(const flag of ['', '--disable-gpu-rasterization','--disable-partial-raster','--disable-zero-copy'])for(let i=0;i<40;i++){
 const remaining=Date.parse(state.deadline)-Date.now();if(remaining<300000){state.status='TIMEBOX_STOP';save();process.exit(0);}
 const phase=flag?flag.slice(2):'baseline',dir=out+'/'+phase+'/'+i;fs.mkdirSync(dir,{recursive:true});
 const args=['-c',`npm run build && node --import=./tooling/capture-observer/observer.mjs --import=${hook} --test --test-concurrency=1 --test-reporter=tap --test-reporter=./docs/fm2_2/run14-diagnostics/root-reporter.mjs --test-reporter-destination=${dir}/tests.tap --test-reporter-destination=${dir}/roots.json dist/test/*.test.js`];
 const start=new Date().toISOString();const run=spawnSync('bash',args,{cwd:root,env:{...process.env,FRAME210_DIR:dir,FRAME210_FLAG:flag,FRAME210_TRACE:state.trials.length===0?'1':'0',FOUNDRY_CAPTURE_FAILURE_DIR:dir+'/exceptions',FOUNDRY_CAPTURE_RUN_ID:'frame210-'+phase+'-'+i},encoding:'utf8',timeout:Math.min(900000,remaining),maxBuffer:20*1024**2});fs.writeFileSync(dir+'/process.log',(run.stdout??'')+(run.stderr??''));
 const pairs=fs.readdirSync(dir).filter(n=>n.startsWith('events-')).flatMap(n=>fs.readFileSync(dir+'/'+n,'utf8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l))).filter(e=>e.event==='pair_complete');
 const trial={phase,index:i,start,end:new Date().toISOString(),exitCode:run.status,error:run.error?.message??null,traced:state.trials.length===0,pairs};state.trials.push(trial);save();console.log(JSON.stringify({phase,index:i,pairs:pairs.length,withinPairMismatch:pairs.some(p=>!p.equal),exitCode:run.status}));
 if(run.error){state.status='STOP_PROCESS_ERROR_OR_DEADLINE';save();process.exit(1);}
}
state.status='COMPLETE';save();
