import fs from 'node:fs';import {spawnSync} from 'node:child_process';import {createHash} from 'node:crypto';
const root=process.cwd(),out=root+'/runs/fm2-2/serial-validation-tagged';fs.mkdirSync(out,{recursive:true});
const digest=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const results={policy:'test-file concurrency=1; renderer/schema/test bodies unchanged',runs:[],status:'IN_PROGRESS'};let reference;
const save=()=>fs.writeFileSync(out+'/results.json',JSON.stringify(results,null,2));save();
for(let i=0;i<5;i++){
 const before=new Set(fs.readdirSync(root+'/runs').filter(n=>n.startsWith('determinism-')));
 const run=spawnSync(process.execPath,['--import='+root+'/tooling/capture-observer/observer.mjs','--test','--test-concurrency=1','--test-reporter=tap','--test-reporter='+root+'/docs/fm2_2/run14-diagnostics/root-reporter.mjs','--test-reporter-destination=stdout','--test-reporter-destination='+out+'/'+i+'-roots.json','dist/test/render.test.js'],{cwd:root,encoding:'utf8',timeout:300000,maxBuffer:10*1024**2});fs.writeFileSync(`${out}/${i}.log`,(run.stdout??'')+(run.stderr??''));
 const events=fs.readdirSync(root+'/runs').filter(n=>n.startsWith('determinism-')&&!before.has(n)).map(n=>JSON.parse(fs.readFileSync(root+'/runs/'+n,'utf8')));
 const manifests=events.flatMap(e=>[e.a,e.b]).map(p=>JSON.parse(fs.readFileSync(p+'/manifest.json','utf8')));
 const fingerprints=manifests.map(m=>digest({frames:m.frames,boxes:m.object_boxes.sha256,sheet:m.contact_sheet.sha256}));reference??=fingerprints[0];
 const pass=run.status===0&&events.length===1&&fingerprints.length===2&&fingerprints.every(s=>s===reference);
 results.runs.push({index:i,exitCode:run.status,error:run.error?.message??null,events,fingerprints,pass});save();console.log(JSON.stringify({index:i,pass}));
 if(!pass){results.status='FAIL';save();process.exit(1);}
}
const suite=spawnSync('npm',['test'],{cwd:root,encoding:'utf8',timeout:900000,maxBuffer:20*1024**2});const text=(suite.stdout??'')+(suite.stderr??'');fs.writeFileSync(out+'/full-suite.log',text);
const pass=suite.status===0&&/# tests 98\b/.test(text)&&/# pass 98\b/.test(text)&&/# fail 0\b/.test(text)&&/# skipped 0\b/.test(text)&&/# cancelled 0\b/.test(text);
results.suite={exitCode:suite.status,error:suite.error?.message??null,pass};results.status=pass?'PASS':'FAIL';save();console.log('SERIAL VALIDATION',results.status);process.exitCode=pass?0:1;
