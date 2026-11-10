import {browserExecutable} from './adapters/motion-suite/browser.js';
import {chromium} from 'playwright';
import {randomInt} from 'node:crypto';
import {mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
import {assets} from './scene.js';
import {sha256} from './hash.js';
import {write} from './io.js';
import {kimiAuth} from './kimi-auth.js';
import {kimiImagePrompt} from './kimi-acp.js';
import {sealCanary} from './kimi-proof.js';
export async function canary(out:string){
 if(process.env.FOUNDRY_VISION==='off')throw new Error('NO_VISION_TRANSPORT');kimiAuth();mkdirSync(out,{recursive:true});
 const alphabet='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
 const token=Array.from({length:3},()=>Array.from({length:4},()=>alphabet[randomInt(alphabet.length)]).join('')).join('-');
 write(resolve(out,'expected.json'),{schema:'foundry.canary_expected/0.1',sha256:sha256(token),token_in_prompt:false});
 const browser=await chromium.launch({executablePath:browserExecutable(),args:['--no-sandbox']});
 try{const page=await browser.newPage({viewport:{width:1100,height:260},deviceScaleFactor:1});await page.setContent('<style>@font-face{font-family:Fixture;src:url(data:font/woff2;base64,'+assets().font+')}body{margin:0;background:white;color:black;display:grid;place-items:center;height:260px;font:96px Fixture}</style><div></div>');await page.locator('div').evaluate((el,t)=>el.textContent=t,token);await page.evaluate(()=>document.fonts.ready);await page.screenshot({path:resolve(out,'canary.png')})}finally{await browser.close()}
 const text='Read the attached image. Return ONLY the exact printed token, with no quotation marks or explanation. Do not use tools.';write(resolve(out,'prompt.json'),{schema:'foundry.canary_prompt/0.1',text});
 const call=await kimiImagePrompt(text,[resolve(out,'canary.png')],resolve(out,'call'));
 const match=sha256(call.answer.trim())===sha256(token);
 const result={schema:'foundry.canary/0.1',status:match?'PASS':'BLOCKED',cli_image_transport:match?'VERIFIED_ATTACHMENT':'UNVERIFIED',auth:call.auth,session_id:call.session_id,token_in_text:false,tools_used:false};
 write(resolve(out,'canary-result.json'),result);if(match)sealCanary(out);return result;
}
