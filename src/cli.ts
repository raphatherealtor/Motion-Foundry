#!/usr/bin/env node
import {resolve} from 'node:path';
import {read} from './io.js';
import {render} from './render.js';
import {probe} from './review.js';
import {validateRender} from './validate.js';
import {repairLoop} from './repair.js';
import {verifyRun} from './verify.js';
const [command,input,...flags]=process.argv.slice(2);
const option=(name:string,fallback:string)=>{const i=flags.indexOf(name);return i<0?fallback:flags[i+1]};
function report(v:any){console.log(JSON.stringify(v,null,2));if(v.status&&v.status!=='PASS')process.exitCode=1;if(Array.isArray(v)&&v.some(r=>r.kind&&r.kind!=='heuristic'&&r.status!=='PASS'))process.exitCode=1}
try {
 if(command==='render'&&input) console.log(await render(read(input),resolve(option('--out','runs/manual')),flags.includes('--no-cache')));
 else if(command==='validate'&&input) report(validateRender(resolve(input)));
 else if(command==='probe-reviewer') report(probe(resolve(input||'runs/probe')));
 else if(command==='repair-loop'&&input) report(await repairLoop(read(input),resolve(option('--out','runs/loop')),flags.includes('--mock'),Number(option('--max-attempts','3'))));
 else if(command==='verify'&&input) report(verifyRun(resolve(input)));
 else {console.log('foundry render <scene> --out <dir> [--no-cache]\nfoundry validate <render_dir>\nfoundry probe-reviewer [output_dir]\nfoundry repair-loop <scene> --out <dir> [--mock] [--max-attempts 3]\nfoundry verify <run_dir>');if(command!=='--help')process.exitCode=2}
}catch(e){const reason_code=(e as Error).message.split(':')[0];console.error(JSON.stringify({status:['NONDETERMINISTIC','BUDGET_EXHAUSTED'].includes(reason_code)?'BLOCKED':'ERROR',reason_code,detail:(e as Error).message}));process.exitCode=1}
