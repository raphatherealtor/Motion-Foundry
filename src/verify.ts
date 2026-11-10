import {resolve} from 'node:path';
import {read,fileHash,fail} from './io.js';
import {verifyHashes} from './render.js';
import {validateRender,passing} from './validate.js';
import {canonical,hash} from './hash.js';
import {RunResult} from './contracts.js';
export function verifyRun(out:string){
 const r=read<RunResult>(resolve(out,'run-result.json'));
 if(fileHash(resolve(out,'decision-log.json'))!==r.decision_log_sha256)fail('EVIDENCE_HASH_MISMATCH');
 if(!r.final_dir||!r.base_dir)return {status:'BLOCKED',reason_code:r.reason_code||'UNREVIEWED'};
 verifyHashes(r.final_dir);verifyHashes(r.base_dir);
 if(fileHash(resolve(r.final_dir,'manifest.json'))!==r.manifest_sha256||fileHash(resolve(r.base_dir,'manifest.json'))!==r.baseline_manifest_sha256||fileHash(resolve(r.final_dir,'validation-index.json'))!==r.validation_index_sha256)fail('EVIDENCE_HASH_MISMATCH');
 if(fileHash(resolve(r.base_dir,'validation-index.json'))!==r.baseline_validation_index_sha256)fail('EVIDENCE_HASH_MISMATCH');
 const log=read(resolve(out,'decision-log.json'));
 for(const d of log.decisions)if(d.candidate_revision&&hash(read(d.candidate_revision.path))!==d.candidate_revision.revision_id)fail('EVIDENCE_HASH_MISMATCH');
 const index=read(resolve(r.final_dir,'validation-index.json'));
 for(const f of index.files)if(fileHash(resolve(r.final_dir,f.path))!==f.sha256)fail('EVIDENCE_HASH_MISMATCH');
 const actual=validateRender(r.final_dir,r.base_dir,false);
 for(const v of actual)if(canonical(read(resolve(r.final_dir,`validation/${v.validator}.json`)))!==canonical(v))fail('EVIDENCE_HASH_MISMATCH');
 if(r.closed_loop==='LIVE'&&(r.reviewer.mock||r.reviewer.vision_transport!=='VERIFIED_ATTACHMENT'))fail('FORBIDDEN_OP');
 return {status:passing(actual)?'PASS':'FAIL',closed_loop:r.closed_loop,render_id:verifyHashes(r.final_dir).render_id,validation:actual.map(v=>({validator:v.validator,status:v.status})),audio:'NOT_RUN'};
}
