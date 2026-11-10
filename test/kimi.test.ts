import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,chmodSync,mkdirSync,readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {resolve} from 'node:path';
import {kimiAuth,kimiEnvironment} from '../src/kimi-auth.js';
import {checkCanary} from '../src/kimi-proof.js';
import {sha256} from '../src/hash.js';
import {root} from '../src/scene.js';
import {fileHash} from '../src/io.js';
test('subscription guard rejects API keys, PAYG endpoints and model provider swaps',()=>{
 const dir=mkdtempSync(tmpdir()+'/foundry-cli-unit-'),script=resolve(dir,'kimi');
 writeFileSync(script,'#!/usr/bin/env node\nconsole.log(process.argv.includes("--version")?"2.5.2":process.env.FOUNDRY_TEST_CONFIG)');chmodSync(script,0o700);
 const priorPath=process.env.PATH,priorConfig=process.env.FOUNDRY_TEST_CONFIG;
 process.env.PATH=dir+':'+priorPath;
 const provider={type:'kimi',baseUrl:'https://api.kimi.ai/coding/v1',apiKey:'',oauth:{storage:'file'}};
 const set=(p:any,modelProvider='managed:kimi-code')=>process.env.FOUNDRY_TEST_CONFIG=JSON.stringify({providers:{'managed:kimi-code':p},models:{'kimi-code/kimi-for-coding':{provider:modelProvider}}});
 try{set(provider);assert.equal(kimiAuth().auth_mode,'subscription');
 for(const p of [{...provider,apiKey:'unit-test-key'},{...provider,baseUrl:'https://api.moonshot.ai/v1'},{...provider,oauth:null}]){set(p);assert.throws(()=>kimiAuth(),/SPEND_RISK/)}
 set(provider,'other');assert.throws(()=>kimiAuth(),/SPEND_RISK/);
 }finally{process.env.PATH=priorPath;if(priorConfig===undefined)delete process.env.FOUNDRY_TEST_CONFIG;else process.env.FOUNDRY_TEST_CONFIG=priorConfig}
});
test('CLI subprocess environment excludes API key and endpoint overrides',()=>{const prev=process.env.KIMI_API_KEY;process.env.KIMI_API_KEY='unit-test';try{assert.equal(kimiEnvironment().KIMI_API_KEY,undefined)}finally{if(prev===undefined)delete process.env.KIMI_API_KEY;else process.env.KIMI_API_KEY=prev}});
function proofFixture(){
 const dir=mkdtempSync(tmpdir()+'/foundry-proof-unit-');mkdirSync(dir+'/call');
 const auth={auth_mode:'subscription' as const,may_incur_spend:false,provider:'managed:kimi-code',endpoint:'https://api.kimi.ai/coding/v1',model:'kimi-code/kimi-for-coding',version:'UNIT-MOCK',oauth:true,api_key:false,spend_basis:'unit fixture only',executable_sha256:'unit'};
 const token='UNIT-TEST-ONLY',save=(p:string,v:any)=>writeFileSync(dir+'/'+p,JSON.stringify(v));writeFileSync(dir+'/canary.png','unit-image-bytes');
 save('expected.json',{sha256:sha256(token)});save('prompt.json',{text:'Read the attached image.'});save('canary-result.json',{status:'PASS',cli_image_transport:'VERIFIED_ATTACHMENT',auth});save('call/response.json',{text:token});
 mkdirSync(dir+'/call/workspace/.kimi-code/agents',{recursive:true});const ep=dir+'/call/workspace/.kimi-code/agents/agent.md';writeFileSync(ep,readFileSync(root+'/config/kimi-reviewer.md','utf8').replace('name: foundry-reviewer','name: agent\noverride: true'));
 save('call/transport-evidence.json',{used_tool:false,effective_profile_path:ep,effective_profile_sha256:fileHash(ep),binding:{active_tools:[],tool_schema_count:0,thinking_effort:'low',custom_prompt:true},profile_sha256:fileHash(root+'/config/kimi-reviewer.md'),audit:[{method:'session/prompt'},{attachments:[{sha256:fileHash(dir+'/canary.png')}]}]});
 return {dir,auth,save};
}
test('canary proof rejects changed pixels, guessed/changed answers, tool use and model swaps',()=>{
 const ok=proofFixture();assert.equal(checkCanary(ok.dir,ok.auth).length,7);
 for(const name of ['image','answer','tool','model','leak']){
 const f=proofFixture();
 if(name==='image')writeFileSync(f.dir+'/canary.png','changed');
 if(name==='answer')f.save('call/response.json',{text:'WRONG'});
 if(name==='tool'){const t=JSON.parse(readFileSync(f.dir+'/call/transport-evidence.json','utf8'));t.used_tool=true;f.save('call/transport-evidence.json',t)}
 if(name==='model')f.auth.model='different';
 if(name==='leak')f.save('prompt.json',{text:'The token is UNIT-TEST-ONLY'});
 assert.throws(()=>checkCanary(f.dir,f.auth),/NO_VISION_TRANSPORT|EVIDENCE_HASH_MISMATCH/);
 }
});
test('disabled vision blocks even a previously correct canary',()=>{const f=proofFixture();process.env.FOUNDRY_VISION='off';try{assert.throws(()=>checkCanary(f.dir,f.auth),/NO_VISION_TRANSPORT/)}finally{delete process.env.FOUNDRY_VISION}});
test('native audit uses actual request settings and rejects an enabled toolset',async()=>{
 const {bindingFromRows}=await import('../src/kimi-policy.js');
 const rows=[{type:'profile.bind',profileName:'agent',thinkingEffort:'max',activeToolNames:[],systemPrompt:'You inspect only supplied text and attached image pixels.'},{type:'llm.tools_snapshot',hash:'empty',tools:[]},{type:'llm.request',thinkingEffort:'low',modelAlias:'kimi-code/kimi-for-coding',toolsHash:'empty'}];
 assert.equal(bindingFromRows(rows).thinking_effort,'low');
 const unsafe=structuredClone(rows);unsafe[0].activeToolNames=['Bash'] as never[];assert.throws(()=>bindingFromRows(unsafe),/FORBIDDEN_OP/);
});
