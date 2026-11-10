import {spawn} from 'node:child_process';
import {createInterface} from 'node:readline';
import {mkdirSync,readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {root} from './scene.js';
import {isolateReviewer,reviewerBinding} from './kimi-policy.js';
import {kimiAuth,kimiEnvironment,kimiModel} from './kimi-auth.js';
import {sha256} from './hash.js';
import {fileHash,write} from './io.js';
export async function kimiImagePrompt(text:string,images:string[],out:string,timeoutMs=180000){
 if(process.env.FOUNDRY_VISION==='off')throw new Error('NO_VISION_TRANSPORT');
 const auth=kimiAuth(),profile=resolve(root,'config/kimi-reviewer.md');mkdirSync(out,{recursive:true});
 const cwd=resolve(out,'workspace'),effectiveProfile=isolateReviewer(cwd,profile);
 const argv=['acp'];let binding:ReturnType<typeof reviewerBinding>|null=null;
 const child=spawn('kimi',argv,{cwd,env:kimiEnvironment(),stdio:['pipe','pipe','pipe']});
 const pending=new Map<number,{resolve:(v:any)=>void;reject:(e:Error)=>void}>();let sequence=0,answer='',usedTool=false,outputBytes=0;
 const audit:any[]=[];let closed=false;
 const rejectAll=(e:Error)=>{for(const p of pending.values())p.reject(e);pending.clear()};
 child.on('error',()=>rejectAll(new Error('CLI_UNAVAILABLE')));child.on('exit',()=>{closed=true;rejectAll(new Error('CLI_EXITED'))});
 // Do not persist diagnostic stderr: it is not needed as evidence and may contain account data.
 child.stderr.on('data',()=>{});
 const lines=createInterface({input:child.stdout});
 lines.on('line',line=>{
 outputBytes+=line.length;if(outputBytes>2*1024*1024){rejectAll(new Error('BUDGET_EXHAUSTED'));child.kill();return}
 let m:any;try{m=JSON.parse(line)}catch{rejectAll(new Error('INVALID_ACP'));return}
 if(m.method&&m.id!==undefined){child.stdin.write(JSON.stringify({jsonrpc:'2.0',id:m.id,error:{code:-32601,message:'Client operations are disabled'}})+'\n');usedTool=true;rejectAll(new Error('FORBIDDEN_OP'));child.kill();return}
 if(m.method==='session/update'){
 const u=m.params?.update;if(u?.sessionUpdate==='agent_message_chunk'&&u.content?.type==='text')answer+=u.content.text;
 if(u?.sessionUpdate==='tool_call'){usedTool=true;rejectAll(new Error('FORBIDDEN_OP'));child.kill()}
 // User/thought chunks can contain image payloads or private reasoning. Do not record them.
 }
 else if(m.id!==undefined){const p=pending.get(m.id);if(!p)return;pending.delete(m.id);if(m.error)p.reject(new Error('ACP_ERROR: '+String(m.error.message).slice(0,300)));else p.resolve(m.result)}
 });
 const call=(method:string,params:unknown)=>new Promise<any>((resolve,reject)=>{if(closed){reject(new Error('CLI_EXITED'));return}const id=++sequence;pending.set(id,{resolve,reject});audit.push({method});child.stdin.write(JSON.stringify({jsonrpc:'2.0',id,method,params})+'\n')});
 const timer=setTimeout(()=>{rejectAll(new Error('BUDGET_EXHAUSTED'));child.kill()},timeoutMs);
 try{
 const init=await call('initialize',{protocolVersion:1,clientCapabilities:{},clientInfo:{name:'motion-foundry',version:'0.1.0'}});
 audit.push({agent:init.agentInfo,image:init.agentCapabilities?.promptCapabilities?.image});
 if(init.protocolVersion!==1||!init.agentCapabilities?.promptCapabilities?.image||init.agentInfo?.version!==auth.version)throw new Error('NO_VISION_TRANSPORT');
 await call('authenticate',{methodId:'login'});
 const session=await call('session/new',{cwd,mcpServers:[]});
 const selected=session.configOptions?.find((c:any)=>c.id==='model')?.currentValue;
 audit.push({session:session.sessionId,model:selected});if(selected!==kimiModel)throw new Error('SPEND_RISK');
 const thinking=session.configOptions?.find((c:any)=>c.id==='thinking');
 if(!thinking?.options.some((c:any)=>c.value==='low'))throw new Error('FORBIDDEN_OP');
 await call('session/set_config_option',{sessionId:session.sessionId,configId:'thinking',value:'low'});
 audit.push({thinking_effort:'low',policy:'project-scoped default-agent override; tools disabled'});
 const prompt=[{type:'text',text},...images.map(path=>({type:'image',mimeType:'image/png',data:readFileSync(path).toString('base64')}))];
 audit.push({attachments:images.map(path=>({sha256:fileHash(path),mimeType:'image/png'})),text_characters:text.length,text_sha256:sha256(text),tool_policy:'none'});
 const end=await call('session/prompt',{sessionId:session.sessionId,prompt});
 if(usedTool||end.stopReason!=='end_turn'||!answer.trim())throw new Error('INVALID_REVIEW');
 binding=reviewerBinding(session.sessionId);
 write(resolve(out,'response.json'),{text:answer,stop_reason:end.stopReason});return {answer,auth,session_id:session.sessionId};
 }finally{clearTimeout(timer);lines.close();child.kill();write(resolve(out,'transport-evidence.json'),{schema:'foundry.cli_transport/0.1',command:'kimi',argv,auth,profile_sha256:fileHash(profile),effective_profile_path:effectiveProfile,effective_profile_sha256:fileHash(effectiveProfile),binding,audit,used_tool:usedTool})}
}
