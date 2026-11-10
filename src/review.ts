import {spawnSync} from 'node:child_process';
import {resolve} from 'node:path';
import {write} from './io.js';
export interface Capability {command:string;installed:boolean;version_string:string;auth_mode:'subscription'|'api_key'|'unknown';may_incur_spend:boolean;text_io:string;model_modality_claimed:string;cli_image_transport:'VERIFIED_ATTACHMENT'|'UNVERIFIED'|'UNSUPPORTED';evidence:Record<string,string>}
export function probe(out:string,commands=['kimi','gemini','vibe','codex','claude']):Capability[]{
 const providers=commands.map(command=>{
 if(!/^[a-zA-Z0-9_./-]+$/.test(command))throw new Error('FORBIDDEN_OP: command name');
 const locate=spawnSync('which',[command],{encoding:'utf8',timeout:5000});
 const installed=locate.status===0;
 let help='Not installed in container PATH.',version='UNVERIFIED';
 if(installed){const p=spawnSync(command,['--help'],{encoding:'utf8',timeout:10000,maxBuffer:512*1024});help=(p.stdout||'')+(p.stderr||'');if(p.error)help+='\n'+p.error.message;
 if(help.includes('--version')){const v=spawnSync(command,['--version'],{encoding:'utf8',timeout:10000});version=((v.stdout||'')+(v.stderr||'')).trim()||'UNVERIFIED'}
 }
 return {command,installed,version_string:version,auth_mode:'unknown' as const,may_incur_spend:true,text_io:installed?'UNVERIFIED':'UNSUPPORTED',model_modality_claimed:'UNVERIFIED',cli_image_transport:installed?'UNVERIFIED' as const:'UNSUPPORTED' as const,evidence:{installation:installed?locate.stdout.trim():'which returned '+locate.status,help,auth:'No verified subscription authentication evidence.',spend:'Unknown counts as spend risk; model calls blocked.',transport:'No verified attachment canary. A path in a prompt is insufficient.',vision:process.env.FOUNDRY_VISION==='off'?'Disabled by FOUNDRY_VISION=off.':'No verified transport.'}};
 });
 write(resolve(out,'capabilities.json'),{schema:'foundry.capabilities/0.1',allow_spend:false,providers,perceptual_review:'BLOCKED',closed_loop:'UNREVIEWED',reason_code:providers.some(p=>p.installed)?'SPEND_RISK':'NO_VISION_TRANSPORT',spend_incurred:0});return providers;
}
