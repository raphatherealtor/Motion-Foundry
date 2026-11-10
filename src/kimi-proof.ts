import {resolve} from 'node:path';
import {readFileSync} from 'node:fs';
import {kimiAuth} from './kimi-auth.js';
import {fileHash,read,fail,write} from './io.js';
import {sha256,canonical} from './hash.js';
import {root} from './scene.js';
const files=['canary.png','expected.json','prompt.json','canary-result.json','call/response.json','call/transport-evidence.json','call/workspace/.kimi-code/agents/agent.md'];
export function checkCanary(dir:string,auth:ReturnType<typeof kimiAuth>){
 if(process.env.FOUNDRY_VISION==='off')fail('NO_VISION_TRANSPORT');
 const result=read(resolve(dir,'canary-result.json')),expected=read(resolve(dir,'expected.json')),response=read(resolve(dir,'call/response.json')).text.trim(),prompt=read(resolve(dir,'prompt.json')).text,transport=read(resolve(dir,'call/transport-evidence.json'));
 if(result.auth.auth_mode!=='subscription'||result.auth.may_incur_spend!==false||result.status!=='PASS'||result.cli_image_transport!=='VERIFIED_ATTACHMENT'||sha256(response)!==expected.sha256||prompt.includes(response)||transport.used_tool||transport.profile_sha256!==fileHash(resolve(root,'config/kimi-reviewer.md')))fail('NO_VISION_TRANSPORT');
 for(const k of ['version','model','provider','endpoint'])if(result.auth[k]!==auth[k as keyof typeof auth])fail('NO_VISION_TRANSPORT');
 const effectiveHash=sha256(readFileSync(resolve(root,'config/kimi-reviewer.md'),'utf8').replace('name: foundry-reviewer','name: agent\noverride: true'));
 if(!transport.binding||transport.binding.active_tools?.length!==0||transport.binding.tool_schema_count!==0||transport.binding.thinking_effort!=='low'||!transport.binding.custom_prompt||transport.effective_profile_sha256!==effectiveHash||fileHash(transport.effective_profile_path)!==effectiveHash)fail('FORBIDDEN_OP');
 const attachment=transport.audit.flatMap((v:any)=>v.attachments||[]);
 if(attachment.length!==1||attachment[0].sha256!==fileHash(resolve(dir,'canary.png'))||!transport.audit.some((v:any)=>v.method==='session/prompt'))fail('EVIDENCE_HASH_MISMATCH');
 return files.map(path=>({path,sha256:fileHash(resolve(dir,path))}));
}
export function sealCanary(dir:string){const auth=kimiAuth();const files=checkCanary(dir,auth);write(resolve(dir,'receipt.json'),{schema:'foundry.canary_receipt/0.1',auth,files,profile_sha256:fileHash(resolve(root,'config/kimi-reviewer.md')),effective_profile_sha256:read(resolve(dir,'call/transport-evidence.json')).effective_profile_sha256});}
export function verifiedCanary(dir:string){const auth=kimiAuth(),receipt=read(resolve(dir,'receipt.json'));if(receipt.auth.executable_sha256!==auth.executable_sha256||canonical(receipt.files)!==canonical(checkCanary(dir,auth)))fail('NO_VISION_TRANSPORT');return {auth,receipt_sha256:fileHash(resolve(dir,'receipt.json')),path:resolve(dir)};}
