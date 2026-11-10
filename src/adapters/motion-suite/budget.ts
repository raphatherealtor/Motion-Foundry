export function checkBudget(limits:any,used:{renders:number;wall_s:number;bytes:number},reserveRender=false){
 if(limits.allow_spend!==false)throw new Error('SPEND_RISK');
 if(limits.max_attempts>3||limits.max_renders_per_run>5||limits.run_wall_clock_s>1800||limits.reviewer_timeout_s>180||used.renders+(reserveRender?1:0)>limits.max_renders_per_run||used.wall_s>limits.run_wall_clock_s||used.bytes>limits.max_output_mb*1024*1024)throw new Error('BUDGET_EXHAUSTED');
}
