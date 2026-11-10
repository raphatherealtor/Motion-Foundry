#!/usr/bin/env node
import {resolve} from 'node:path';
import {read} from './io.js';
import {render} from './render.js';
const [command,input,...flags]=process.argv.slice(2);
const option=(name:string,fallback:string)=>{const i=flags.indexOf(name);return i<0?fallback:flags[i+1]};
try {
 if(command==='render'&&input) console.log(await render(read(input),resolve(option('--out','runs/manual')),flags.includes('--no-cache')));
 else {console.error('Usage: foundry render <scene> --out <dir> [--no-cache]');process.exitCode=2}
}catch(e){const reason_code=(e as Error).message.split(':')[0];console.error(JSON.stringify({status:['NONDETERMINISTIC','BUDGET_EXHAUSTED'].includes(reason_code)?'BLOCKED':'ERROR',reason_code,detail:(e as Error).message}));process.exitCode=1}
