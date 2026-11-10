// Test-only loader: exercise unchanged M0 code on the isolated M1 browser.
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const fingerprint=createHash('sha256').update(readFileSync(new URL(import.meta.url))).digest('hex');
export async function load(url,context,nextLoad){
 const loaded=await nextLoad(url,context);
 if(url.endsWith('/dist/src/render.js')){
  const browser=process.env.FOUNDRY_M1_BROWSER;
  if(!browser)throw Error('FOUNDRY_M1_BROWSER required');
  const source=String(loaded.source);
  if(!source.includes("'/usr/local/bin/chromium'"))throw Error('M0 launch path changed');
  return {...loaded,source:source.replace("'/usr/local/bin/chromium'",JSON.stringify(browser)).replace('...config, browser:',`...config, m1_test_loader: '${fingerprint}', browser:`)};
 }
 return loaded;
}
