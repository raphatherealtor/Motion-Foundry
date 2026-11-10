export function checkBudget(limits:any,used:{renders:number;wall_s:number;bytes:number},reserveRender=false){
 if(limits.allow_spend!==false)throw new Error('SPEND_RISK');
 if(limits.max_attempts>3||limits.max_renders_per_run>5||limits.run_wall_clock_s>1800||limits.reviewer_timeout_s>180||used.renders+(reserveRender?1:0)>limits.max_renders_per_run||used.wall_s>limits.run_wall_clock_s||used.bytes>limits.max_output_mb*1024*1024)throw new Error('BUDGET_EXHAUSTED');
}
// Record the same frame-scaled deadline already enforced by the renderer.
export function scaledRenderTimeout(frames:number,base:number){
 if(!Number.isSafeInteger(frames)||frames<1||!Number.isFinite(base)||base<=0)throw new Error('TYPE_INVALID: render deadline inputs');
 return Math.max(base,frames*5+60);
}
