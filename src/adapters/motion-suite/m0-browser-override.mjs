// Historical migration loader retained for old command compatibility.
// Browser selection now lives in browser.ts; overrides and Chromium131 are retired.
export async function load(url,context,nextLoad){
 const result=await nextLoad(url,context);
 if(url.endsWith('/dist/src/render.js')&&String(result.source).includes("executablePath: '/usr/local/bin/chromium'"))throw Error('FORBIDDEN_OP: legacy browser launch');
 return result;
}
