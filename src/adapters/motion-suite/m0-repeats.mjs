import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {render,verifyHashes} from '../../../dist/src/render.js';
import {hash} from '../../../dist/src/hash.js';
const root=process.cwd(),out=resolve(root,'runs/m1-resume/m0-153');
mkdirSync(out,{recursive:true});
const scene=JSON.parse(readFileSync(resolve(root,'fixtures/m0-overflow/scene.json'),'utf8'));
const repeats=[];
for(let i=0;i<5;i++){
 const dir=await render(scene,out,true),m=verifyHashes(dir);
 repeats.push({dir,render_id:m.render_id,hash:hash({frames:m.frames,boxes:m.object_boxes,sheet:m.contact_sheet})});
 writeFileSync(resolve(out,'repeats.json'),JSON.stringify({status:repeats.some(x=>x.hash!==repeats[0].hash)?'BLOCKED':repeats.length===5?'PASS':'NOT_RUN',complete:repeats.length===5,repeats},null,2));
 console.log(`M0 Chromium153 repeat ${i+1}: ${repeats[i].hash}`);
}
if(repeats.some(x=>x.hash!==repeats[0].hash))throw Error('NONDETERMINISTIC');
