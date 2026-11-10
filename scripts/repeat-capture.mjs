import {spawnSync} from 'node:child_process';
import {mkdirSync,readdirSync,readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {verifyHashes} from '../dist/src/render.js';
import {canonical} from '../dist/src/hash.js';
const stage=process.argv[2];if(!stage||!/^[a-z0-9-]+$/.test(stage))throw Error('stage required');
const out=resolve('runs/capture-race',stage);mkdirSync(out,{recursive:true});
let baseline,all=true;const pairs=[];
for(let n=1;n<=5;n++){
 const before=new Set(readdirSync('runs'));
 const result=spawnSync(process.execPath,['--test','dist/test/render.test.js'],{encoding:'utf8',timeout:250000,maxBuffer:8*1024*1024});
 writeFileSync(resolve(out,`pair-${n}.tap`),(result.stdout||'')+(result.stderr||''),{flag:'wx'});
 const created=readdirSync('runs').filter(f=>f.startsWith('determinism-')&&!before.has(f));
 const evidence=created.map(f=>({path:resolve('runs',f),data:JSON.parse(readFileSync(resolve('runs',f),'utf8'))}));
 const pair={n,exit_code:result.status,evidence,cross_pair_identical:true};
 for(const e of evidence)for(const dir of [e.data.a,e.data.b]){
 const m=verifyHashes(dir),fingerprint=canonical({render_id:m.render_id,frames:m.frames,boxes:m.object_boxes,sheet:m.contact_sheet});
 baseline??=fingerprint;if(fingerprint!==baseline)pair.cross_pair_identical=false;
 }
 if(result.status!==0||evidence.length!==1||!pair.cross_pair_identical)all=false;
 pairs.push(pair);writeFileSync(resolve(out,`pair-${n}.json`),JSON.stringify(pair,null,2),{flag:'wx'});
 console.log(JSON.stringify({stage,pair:n,status:all?'PASS':'BLOCKED'}));
 if(!all)break;
}
writeFileSync(resolve(out,'result.json'),JSON.stringify({stage,status:all&&pairs.length===5?'PASS':'BLOCKED',pairs_completed:pairs.length,uncached_renders:pairs.length*2,pixel_tolerance:0,pairs},null,2),{flag:'wx'});
if(!all)process.exitCode=1;
