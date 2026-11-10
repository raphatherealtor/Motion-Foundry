import {browserExecutable} from './adapters/motion-suite/browser.js';
import {spawnSync} from 'node:child_process';
import {resolve} from 'node:path';
import {write} from './io.js';
import {kimiAuth} from './kimi-auth.js';
import {verifiedCanary} from './kimi-proof.js';
export interface Capability {command:string;installed:boolean;version_string:string;auth_mode:'subscription'|'api_key'|'unknown';may_incur_spend:boolean;text_io:string;model_modality_claimed:string;cli_image_transport:'VERIFIED_ATTACHMENT'|'UNVERIFIED'|'UNSUPPORTED';evidence:Record<string,string>}
export function probe(out:string,commands=['kimi','gemini','vibe','codex','claude'],canaryDir?:string):Capability[]{
 const providers=commands.map(command=>{
 if(!/^[a-zA-Z0-9_./-]+$/.test(command))throw new Error('FORBIDDEN_OP: command name');
 const locate=spawnSync('which',[command],{encoding:'utf8',timeout:5000});
 const installed=locate.status===0;
 let help='Not installed in container PATH.',version='UNVERIFIED';
 if(installed){const p=spawnSync(command,['--help'],{encoding:'utf8',timeout:10000,maxBuffer:512*1024});help=(p.stdout||'')+(p.stderr||'');if(p.error)help+='\n'+p.error.message;
 if(help.includes('--version')){const v=spawnSync(command,['--version'],{encoding:'utf8',timeout:10000});version=((v.stdout||'')+(v.stderr||'')).trim()||'UNVERIFIED'}
 }
 const cap:Capability={command,installed,version_string:version,auth_mode:'unknown' as const,may_incur_spend:true,text_io:installed?'UNVERIFIED':'UNSUPPORTED',model_modality_claimed:'UNVERIFIED',cli_image_transport:installed?'UNVERIFIED' as const:'UNSUPPORTED' as const,evidence:{installation:installed?locate.stdout.trim():'which returned '+locate.status,help,auth:'No verified subscription authentication evidence.',spend:'Unknown counts as spend risk; model calls blocked.',transport:'No verified attachment canary. A path in a prompt is insufficient.',vision:process.env.FOUNDRY_VISION==='off'?'Disabled by FOUNDRY_VISION=off.':'No verified transport.'}};
 if(command==='kimi'&&installed){try{const auth=kimiAuth();cap.auth_mode='subscription';cap.may_incur_spend=false;cap.evidence.auth=JSON.stringify(auth);cap.evidence.spend=auth.spend_basis;cap.model_modality_claimed='image_in (configured managed model)';if(canaryDir){try{const proof=verifiedCanary(canaryDir);cap.cli_image_transport='VERIFIED_ATTACHMENT';cap.text_io='TESTED';cap.evidence.transport=JSON.stringify(proof)}catch{cap.evidence.transport='Canary proof invalid, stale, disabled, or unavailable.'}}}catch{cap.evidence.auth='Managed subscription authentication not verified; calls blocked.'}}
 return cap;
 });
 const ready=providers.some(p=>p.cli_image_transport==='VERIFIED_ATTACHMENT'&&p.auth_mode==='subscription'&&!p.may_incur_spend);
 write(resolve(out,'capabilities.json'),{schema:'foundry.capabilities/0.1',allow_spend:false,providers,review_available:ready,perceptual_review:ready?'NOT_RUN':'BLOCKED',closed_loop:'UNREVIEWED',...(!ready?{reason_code:providers.some(p=>p.installed&&p.may_incur_spend)?'SPEND_RISK':'NO_VISION_TRANSPORT'}:{}),spend_incurred:0});return providers;
}
export async function failingWindowSheet(dir:string,window:{start:number;end:number},out:string){
 const {chromium}=await import('playwright');const {readFileSync,mkdirSync}=await import('node:fs');const {dirname}=await import('node:path');
 const {assets}=await import('./scene.js');
 const browser=await chromium.launch({executablePath:browserExecutable(),args:['--no-sandbox']});
 try{const frames=Array.from({length:window.end-window.start},(_,i)=>i+window.start);
 const page=await browser.newPage({viewport:{width:640,height:Math.ceil(frames.length/8)*165},deviceScaleFactor:1});await page.route('**/*',r=>r.abort());
 await page.setContent('<style>@font-face{font-family:Fixture;src:url(data:font/woff2;base64,'+assets().font+')}body{margin:0;display:grid;grid-template-columns:repeat(8,80px);background:white}div{height:165px;font:11px Fixture}img{width:80px;height:142px}</style>'+frames.map(i=>`<div>f${i}<img src="data:image/png;base64,${readFileSync(resolve(dir,'frames/f'+String(i).padStart(4,'0')+'.png')).toString('base64')}"></div>`).join(''));
 await page.waitForFunction('document.fonts.status==="loaded" && [...document.images].every(i=>i.complete)');mkdirSync(dirname(out),{recursive:true});await page.screenshot({path:out});return frames;
 }finally{await browser.close()}
}
