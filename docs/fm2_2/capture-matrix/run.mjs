import fs from 'node:fs';import path from 'node:path';import {spawnSync} from 'node:child_process';import {createHash} from 'node:crypto';
const out='/root/projects/motion-foundry/runs/fm2-2/capture-matrix';fs.mkdirSync(out,{recursive:true});
const phases=[['m1','isolated'],['fm21','isolated'],['fm22','isolated'],['fm22','suite']];
const digest=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex');
for(const [revision,mode]of phases){
 const root='/root/projects/foundry-probes/'+revision,phase=revision+'-'+mode,dir=path.join(out,phase);fs.mkdirSync(dir,{recursive:true});
 fs.mkdirSync(path.join(root,'runs'),{recursive:true});
 const browser=path.join(root,'tooling/m1-browser/browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell');
 const version=spawnSync(browser,['--version'],{encoding:'utf8'});if(version.status!==0||!version.stdout.includes('153.0.8010.12'))throw Error('Probe environment invalid: '+version.stderr);
 const sha=spawnSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).stdout.trim();
 const harness=Object.fromEntries(['dist/src/render.js','dist/src/scene.js','dist/test/render.test.js'].map(p=>[p,digest(path.join(root,p))]));
 for(let i=0;i<20;i++){
 const destination=path.join(dir,String(i).padStart(2,'0')+'.json');if(fs.existsSync(destination))continue;
 const before=new Set(fs.readdirSync(path.join(root,'runs')).filter(n=>n.startsWith('determinism-'))),start=Date.now();
 const files=mode==='isolated'?['dist/test/render.test.js']:fs.readdirSync(root+'/dist/test').filter(n=>n.endsWith('.test.js')).map(n=>'dist/test/'+n);
 const run=spawnSync(process.execPath,['--test',...files],{cwd:root,encoding:'utf8',timeout:900000,maxBuffer:10*1024**2});
 fs.writeFileSync(path.join(dir,i+'.log'),(run.stdout??'')+(run.stderr??''));
 const events=fs.readdirSync(path.join(root,'runs')).filter(n=>n.startsWith('determinism-')&&!before.has(n)).map(n=>JSON.parse(fs.readFileSync(path.join(root,'runs',n),'utf8')));
 const text=(run.stdout??'')+(run.stderr??'');if(/not installed|ENOENT|Cannot find module/.test(text))throw Error('Setup failure, not a capture sample: '+text);const renderFailed=/not ok .*repeat no-cache rendering/.test(text);
 const record={revision,sha,mode,index:i,elapsedMs:Date.now()-start,harness,exitCode:run.status,signal:run.signal,error:run.error?.message??null,renderFailed,events};
 fs.writeFileSync(destination,JSON.stringify(record,null,2));console.log(JSON.stringify({phase,index:i,exitCode:run.status,renderFailed,events:events.map(e=>e.status)}));
 }
}
console.log('CAPTURE MATRIX COMPLETE');
