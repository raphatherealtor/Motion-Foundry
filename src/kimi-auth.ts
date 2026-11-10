import {spawnSync} from 'node:child_process';
import {homedir} from 'node:os';
import {resolve} from 'node:path';
import {fileHash} from './io.js';
export const kimiModel='kimi-code/kimi-for-coding';
export function kimiEnvironment(){const env:NodeJS.ProcessEnv={...process.env,KIMI_CODE_HOME:resolve(homedir(),'.kimi-code')};for(const k of Object.keys(env))if(/^(KIMI|MOONSHOT)_.*(KEY|TOKEN|BASE_URL)$/.test(k))delete env[k as keyof typeof env];return env}
export function kimiAuth(){
 const r=spawnSync('kimi',['provider','list','--json'],{encoding:'utf8',timeout:10000,env:kimiEnvironment(),maxBuffer:1024*1024});
 if(r.status!==0)throw new Error('SPEND_RISK');
 let config:any;try{config=JSON.parse(r.stdout)}catch{throw new Error('SPEND_RISK')}
 const provider=config.providers?.['managed:kimi-code'],model=config.models?.[kimiModel];
 if(!provider||provider.type!=='kimi'||provider.apiKey||!provider.oauth||provider.baseUrl!=='https://api.kimi.ai/coding/v1'||model?.provider!=='managed:kimi-code')throw new Error('SPEND_RISK');
 const version=spawnSync('kimi',['--version'],{encoding:'utf8',timeout:10000}).stdout.trim();
 const executable=spawnSync('which',['kimi'],{encoding:'utf8',timeout:5000}).stdout.trim();
 return {executable_sha256:fileHash(executable),auth_mode:'subscription' as const,may_incur_spend:false,provider:'managed:kimi-code',endpoint:provider.baseUrl as string,model:kimiModel,version,oauth:true,api_key:false,spend_basis:'Managed OAuth on Kimi Code membership endpoint; no PAYG key or endpoint fallback.'};
}
