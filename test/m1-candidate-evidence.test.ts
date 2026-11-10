import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,readFileSync,writeFileSync,readdirSync,statSync} from 'node:fs';
import {resolve} from 'node:path';
import {root} from '../src/scene.js';
import {MotionSuiteRenderer} from '../src/adapters/motion-suite/renderer.js';
import {compileScene} from '../src/adapters/motion-suite/compile.js';
import {options} from '../src/adapters/motion-suite/defaults.js';
import {verifyEvidence} from '../src/adapters/motion-suite/evidence.js';
import {revisionId} from '../src/adapters/motion-suite/identity.js';
test('candidate evidence binds scene intent, ordered repairs, adapter and policy snapshots',{timeout:180000},async()=>{
 const scene=JSON.parse(readFileSync(resolve(root,'fixtures/m1/vox-doc.chart_explainer/ms_scene.json'),'utf8')),intent={scene,ops:[]};
 const r=new MotionSuiteRenderer(options(mkdtempSync(resolve(root,'runs/m1-resume/candidate-')))),c=await compileScene(r,scene);
 const output=await r.render(c.project,{start:0,end:1},{intent,candidate_id:'c_01'}),m=verifyEvidence(output.dir);
 assert.equal(m.candidate_id,'c_01');assert.equal(m.revision_id,revisionId(intent,JSON.parse(readFileSync(resolve(output.dir,'project.json'),'utf8'))));
 const first=(dir:string):string=>{for(const n of readdirSync(dir)){const p=resolve(dir,n);if(statSync(p).isFile())return p;return first(p);}throw Error('empty');};
 for(const file of [resolve(output.dir,'policy.json'),first(resolve(output.dir,'adapter'))]){const b=readFileSync(file);try{writeFileSync(file,Buffer.concat([b,Buffer.from(' ')]));if(file.endsWith('policy.json'))writeFileSync(file,JSON.stringify({tampered:true}));assert.throws(()=>verifyEvidence(output.dir),/EVIDENCE_HASH_MISMATCH/);}finally{writeFileSync(file,b);}}
});
