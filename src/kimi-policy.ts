import {mkdirSync,readFileSync,writeFileSync,readdirSync,existsSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {homedir} from 'node:os';
import {resolve} from 'node:path';
import {sha256} from './hash.js';
import {fileHash,fail} from './io.js';
export function isolateReviewer(cwd:string,profile:string){
 mkdirSync(cwd,{recursive:true});if(spawnSync('git',['init','-q',cwd]).status!==0)fail('FORBIDDEN_OP');
 const path=resolve(cwd,'.kimi-code/agents/agent.md');mkdirSync(resolve(cwd,'.kimi-code/agents'),{recursive:true});
 const source=readFileSync(profile,'utf8').replace('name: foundry-reviewer','name: agent\noverride: true');writeFileSync(path,source,{flag:'wx'});return path;
}
export function reviewerBinding(sessionId:string){
 if(!/^[A-Za-z0-9_-]+$/.test(sessionId))fail('FORBIDDEN_OP');
 const base=resolve(homedir(),'.kimi-code/sessions');let path='';
 for(const d of readdirSync(base,{withFileTypes:true})){if(!d.isDirectory())continue;const p=resolve(base,d.name,sessionId,'agents/main/wire.jsonl');if(existsSync(p)){path=p;break}}
 if(!path)fail('FORBIDDEN_OP');
 const rows=readFileSync(path,'utf8').trim().split('\n').flatMap(l=>{try{return [JSON.parse(l)]}catch{return []}});
 return bindingFromRows(rows);
}
export function bindingFromRows(rows:any[]){
 const request=rows.filter(r=>r.type==='llm.request').at(-1);
 const bind=rows.filter(r=>r.type==='profile.bind').at(-1),tools=rows.filter(r=>r.type==='llm.tools_snapshot').at(-1);
 if(!request||request.modelAlias!=='kimi-code/kimi-for-coding'||request.toolsHash!==tools?.hash||!bind||!Array.isArray(bind.activeToolNames)||bind.activeToolNames.length||!tools||!Array.isArray(tools.tools)||tools.tools.length||!bind.systemPrompt.startsWith('You inspect only supplied text and attached image pixels.'))fail('FORBIDDEN_OP');
 return {profile_name:bind.profileName,active_tools:bind.activeToolNames,tool_schema_count:tools.tools.length,thinking_effort:request.thinkingEffort,custom_prompt:true,system_prompt_sha256:sha256(bind.systemPrompt)};
}
