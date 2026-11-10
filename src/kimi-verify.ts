import {resolve,dirname} from 'node:path';
import {read,fileHash,fail} from './io.js';
import {canonical,sha256} from './hash.js';
import {checkCanary} from './kimi-proof.js';
export function verifyLive(log:any){
 const proof=log.events.find((e:any)=>e.reviewer_proof)?.reviewer_proof;
 if(!proof||fileHash(resolve(proof.path,'receipt.json'))!==proof.receipt_sha256)fail('EVIDENCE_HASH_MISMATCH');
 const receipt=read(resolve(proof.path,'receipt.json'));
 if(canonical(receipt.files)!==canonical(checkCanary(proof.path,receipt.auth))||canonical(receipt.auth)!==canonical(proof.auth))fail('EVIDENCE_HASH_MISMATCH');
 const decisions=log.decisions.filter((d:any)=>d.reviewer_proposal);
 if(!decisions.length)fail('FORBIDDEN_OP');
 for(const d of decisions){
 const e=d.review_evidence;if(!e)fail('FORBIDDEN_OP');
 for(const name of ['transport','response','prompt','request'])if(fileHash(e[name+'_path'])!==e[name+'_sha256'])fail('EVIDENCE_HASH_MISMATCH');
 const transport=read(e.transport_path),response=read(e.response_path),request=read(e.request_path),prompt=read(e.prompt_path);
 if(transport.used_tool||transport.profile_sha256!==receipt.profile_sha256||response.stop_reason!=='end_turn'||canonical(transport.auth)!==canonical(receipt.auth))fail('FORBIDDEN_OP');
 if(canonical(JSON.parse(response.text.trim()))!==canonical(d.reviewer_proposal)||canonical(read(resolve(dirname(e.request_path),'proposal.json')))!==canonical(d.reviewer_proposal))fail('EVIDENCE_HASH_MISMATCH');
 const attachments=transport.audit.flatMap((v:any)=>v.attachments||[]),textHash=transport.audit.find((v:any)=>v.text_sha256)?.text_sha256;
 if(textHash!==sha256(prompt.text)||attachments.length!==request.attachments.length||!attachments.length)fail('EVIDENCE_HASH_MISMATCH');
 request.attachments.forEach((a:any,i:number)=>{if(a.sha256!==fileHash(a.path)||attachments[i].sha256!==a.sha256)fail('EVIDENCE_HASH_MISMATCH')});
 if(request.base_revision_id!==d.reviewer_proposal.base_revision_id||request.base_render_id!==d.reviewer_proposal.base_render_id)fail('STALE_BASE');
 }
}
