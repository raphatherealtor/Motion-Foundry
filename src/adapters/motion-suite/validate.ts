import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {validate as m0Validate} from '../../validate.js';
import type {Scene} from '../../scene.js';
import type {ValidationResult} from '../../contracts.js';
import type {MotionScene} from '../../recipes/types.js';
import {write,fileHash,read} from '../../io.js';
import {hash} from '../../hash.js';
import {durable} from './identity.js';
import type {Compiled} from './compile.js';
import {checkTextLock} from './compile.js';
import {verifyEvidence} from './evidence.js';
import {revealViolations} from './word-check.js';
import {protectedViolations,tearViolations,anchorViolations} from './contract-checks.js';
import type {MotionSuiteBoxes} from './boxes-types.js';
const rows=(dir:string):MotionSuiteBoxes[]=>readFileSync(resolve(dir,'boxes.jsonl'),'utf8').trim().split('\n').map(l=>JSON.parse(l));
function view(scene:MotionScene,c:Compiled):Scene {
 const doc=c.project.motionDocuments[c.project.activeDocumentId];
 return {schema:'foundry.scene/0.1',seed:scene.seed,width:1080,height:1920,fps:{num:30,den:1},frames:scene.frames,objects:Object.fromEntries(c.meta.words.map(w=>[w.id,{text:doc.objects[w.id]?.text||'',style:{fontSize:doc.objects[w.id]?.fontSize||0,letterSpacing:0,lineHeight:1.2},layout:{x:0,y:0,maxWidth:900,align:'center' as const,wrap:false},timing:{in:w.start,out:w.end}}])),annotations:[],contracts:{required_content:scene.text_lock.sha256,fixture_only:true,must_contain_visible_content:[],forbid_one_frame_discontinuity:[]}};
}
export function validateM1(scene:MotionScene,c:Compiled,dir:string,base:Compiled=c,baseDir=dir,persist=true):ValidationResult[]{
 const manifest=verifyEvidence(dir);verifyEvidence(baseDir);
 const currentRows=rows(dir),baseRows=rows(baseDir),render_id=manifest.render_id;
 const results=m0Validate(view(scene,c),currentRows,view(scene,base),baseRows,render_id);
 const result=(id:string,bad:Record<string,unknown>[],reason_code='FORBIDDEN_OP'):ValidationResult=>({schema:'foundry.validation/0.1',render_id,validator:id,kind:'hard_contract',status:bad.length?'FAIL':'PASS',params:{},violations:bad,...(bad.length?{reason_code}:{})});
 const unsupported=currentRows.filter(r=>r.word_level.status!=='PASS');
 if(unsupported.length){const geometry=results.find(r=>r.validator==='safe_area.v1')!;geometry.status='FAIL';geometry.violations.push(...unsupported.map(r=>({frame:r.frame,detail:'Word-level checks require split/projectable words'})));}
 try{checkTextLock(scene,c.meta);}catch(e){const required=results.find(r=>r.validator==='required_content.v1')!;required.status='FAIL';required.reason_code='REQUIRED_CONTENT_LOST';required.violations.push({detail:(e as Error).message});}
 if(hash(durable(read(resolve(dir,'project.json'))))!==hash(durable(c.project)))throw new Error('EVIDENCE_HASH_MISMATCH: compiled project');
 results.push(result('word_reveal.v1',revealViolations(c,currentRows)),result('occlusion_preserved.v1',protectedViolations(scene,c,base)),result('tear_seed_unique.v1',tearViolations(c)));
 const anchor=result('anchor_timing.v1',anchorViolations(c),'OUT_OF_BOUNDS');anchor.params={target_early_s:.2,max_early_s:.5};if(!c.meta.anchors.length)anchor.status='NOT_RUN';results.push(anchor);
 const parity=read(resolve(dir,'parity.json'));const p=result('render_parity.v1',parity.status==='PASS'?[]:[{detail:'Product mode parity did not pass'}],'NONDETERMINISTIC');p.status=parity.status;p.params={report_sha256:fileHash(resolve(dir,'parity.json')),studio:'NOT_RUN'};results.push(p);
 const collisions:Record<string,unknown>[]=[];
 for(const r of currentRows)for(let i=0;i<r.words.length;i++)for(let j=i+1;j<r.words.length;j++){const a=r.words[i],b=r.words[j];if(a.visible&&b.visible&&a.opacity>=.999&&b.opacity>=.999&&Math.min(a.bbox[2],b.bbox[2])>Math.max(a.bbox[0],b.bbox[0])&&Math.min(a.bbox[3],b.bbox[3])>Math.max(a.bbox[1],b.bbox[1]))collisions.push({frame:r.frame,objects:[a.object,b.object]});}
 results.push({schema:'foundry.validation/0.1',render_id,validator:'collision.heuristic',kind:'heuristic',status:collisions.length?'WARN':'NOT_RUN',params:{max_status:'WARN'},violations:collisions});
 if(persist){const files=results.map(v=>{const path='validation/'+v.validator+'.json';write(resolve(dir,path),v);return {path,sha256:fileHash(resolve(dir,path))};});write(resolve(dir,'validation-index.json'),{schema:'foundry.validation_index/0.1',files});}
 return results;
}
export const passing=(results:ValidationResult[])=>['safe_area.v1','min_font_size.v1','required_content.v1','word_reveal.v1','occlusion_preserved.v1','tear_seed_unique.v1','anchor_timing.v1','render_parity.v1'].every(id=>results.filter(r=>r.validator===id).length===1&&results.find(r=>r.validator===id)?.status==='PASS');
