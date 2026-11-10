import {resolve} from 'node:path';
import {readFileSync} from 'node:fs';
import {kimiImagePrompt} from './kimi-acp.js';
import {verifiedCanary} from './kimi-proof.js';
import {RepairProposal,ReviewRequest,ValidationResult} from './contracts.js';
import {Scene} from './scene.js';
import {schemas} from './schemas.js';
import {allowlist} from './gate.js';
import {write,fileHash,fail} from './io.js';
export async function liveProposal(request:ReviewRequest,failures:ValidationResult[],scene:Scene,prior:RepairProposal[],canaryDir:string,out:string){
 const proof=verifiedCanary(canaryDir);
 for(const image of request.attachments)if(fileHash(image.path)!==image.sha256)fail('EVIDENCE_HASH_MISMATCH');
 const windowFailures=failures.map(v=>({...v,violations:v.violations.filter((x:any)=>!x.frames||(x.frames.start<request.window.end&&x.frames.end>request.window.start))}));
 const prompt='Inspect the attached contact sheet for the failing frame window and return ONLY one JSON RepairProposal. The response must have EXACTLY these five top-level keys: schema, base_revision_id, base_render_id, rationale, ops. Additional properties are forbidden. Do not echo window, failures, objects, allowlist, prior_proposals, or this review context into the response. No markdown, no tools, no file edits. Your rationale must describe visible evidence. Do not claim PASS. Preserve the full text and fully visible duration. Propose only allowlisted operations; shrinking, repositioning and wrapping are permitted. Never hide or move required content offscreen. All coordinates and font sizes are logical pixels on a 1080x1920 canvas.\n'+JSON.stringify({schema:'foundry.repair_proposal/0.1',base_revision_id:request.base_revision_id,base_render_id:request.base_render_id,response_json_schema:schemas.RepairProposal,required_output:{schema:'foundry.repair_proposal/0.1',base_revision_id:request.base_revision_id,base_render_id:request.base_render_id,rationale:'Explain the observed issue and proposed repair.',ops:[{op:'set',target:'objects.<id>.<group>.<property>',value:'use the correct allowed type'}]},window:request.window,failures:windowFailures,objects:scene.objects,allowlist,prior_proposals:prior});
 write(resolve(out,'prompt.json'),{schema:'foundry.reviewer_prompt/0.1',text:prompt});
 const call=await kimiImagePrompt(prompt,request.attachments.map(a=>a.path),resolve(out,'call'));
 let proposal:RepairProposal;try{proposal=JSON.parse(call.answer.trim())}catch{fail('TYPE_INVALID')}
 return {proposal,proof,evidence:{transport_path:resolve(out,'call/transport-evidence.json'),transport_sha256:fileHash(resolve(out,'call/transport-evidence.json')),response_path:resolve(out,'call/response.json'),response_sha256:fileHash(resolve(out,'call/response.json')),prompt_path:resolve(out,'prompt.json'),prompt_sha256:fileHash(resolve(out,'prompt.json'))}};
}
