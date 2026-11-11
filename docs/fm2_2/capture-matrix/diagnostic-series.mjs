// Bounded root-cause diagnostics, not a restarted acceptance cohort.
import fs from 'node:fs';import {spawnSync} from 'node:child_process';
const out='runs/fm2-2/screenshot-diagnostic-series';fs.mkdirSync(out,{recursive:false});const records=[];
for(let i=2;i<=21;i++){
 const label=String(i).padStart(3,'0');const run=spawnSync(process.execPath,['docs/fm2_2/capture-matrix/focused-loop-diagnostic.mjs',label],{encoding:'utf8',timeout:360000,maxBuffer:1024**2});fs.writeFileSync(out+'/'+label+'.log',(run.stdout??'')+(run.stderr??''));
 const dir='runs/fm2-2/focused-loop-diagnostic-'+label;const file=dir+'/full-error.json';const fullError=fs.existsSync(file)?JSON.parse(fs.readFileSync(file,'utf8')):null;
 records.push({label,exitCode:run.status,error:run.error?.message??null,fullError});const status=run.status!==0?'STOPPED_ON_DIAGNOSTIC_FAILURE':i===21?'NO_FAILURE_REPRODUCED':'IN_PROGRESS';
 fs.writeFileSync(out+'/results.json',JSON.stringify({scope:'Focused mock repair-loop diagnostics only; acceptance remains FAILED at suite14 and is not restarted',status,records},null,2));console.log(JSON.stringify({label,status,exitCode:run.status}));
 if(run.status!==0){process.exitCode=1;break;}
}
