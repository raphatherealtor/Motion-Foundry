import {compare} from './metrics.js';
import type {RenderSession} from './session.js';
export function sampledFrames(start:number,end:number):number[]{return [...new Set([0,.25,.5,.75,1].map(t=>start+Math.floor((end-start-1)*t)))];}
export async function measureParity(project:unknown,frames:number[],foundry:RenderSession,golden:RenderSession){
 const results=[];
 for(const frame of frames){
  const preview=await foundry.render(project,frame,'preview');
  for(const [b,mode,session] of [['ms_export_gif_prequant','export',foundry],['ms_worker','worker',foundry],['golden_runner_env','preview',golden]] as const){
   const rendered=await session.render(project,frame,mode),result=compare(preview,rendered);
   const repeat=result.identical?undefined:await session.render(project,frame,mode);
   const unstable=repeat&&!compare(rendered,repeat).identical;
   results.push({frame,a:'ms_preview',b,status:unstable?'BLOCKED':result.identical?'PASS':b==='golden_runner_env'?'WARN':'FAIL',...(unstable?{reason_code:'NONDETERMINISTIC'}:{}),...result});
  }
 }
 results.push({a:'ms_preview',b:'studio_compositor',status:'NOT_RUN',detail:'Private Studio renderer follows a separate path; Studio integration is outside M1.'} as any);
 return results;
}
