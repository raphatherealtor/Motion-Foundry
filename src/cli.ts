#!/usr/bin/env node
import {resolve} from 'node:path';
import {existsSync} from 'node:fs';
import {read} from './io.js';
import {render} from './render.js';
import {probe} from './review.js';
import {validateRender} from './validate.js';
import {repairLoop} from './repair.js';
import {verifyRun} from './verify.js';
import {canary} from './kimi-canary.js';
const [command,input,...flags]=process.argv.slice(2);
const option=(name:string,fallback:string)=>{const i=flags.indexOf(name);return i<0?fallback:flags[i+1]};
function report(v:any){console.log(JSON.stringify(v,null,2));if(v.status&&v.status!=='PASS')process.exitCode=1;if(Array.isArray(v)&&v.some(r=>r.kind&&r.kind!=='heuristic'&&r.status!=='PASS'))process.exitCode=1}
try {
 if(command==='render'&&input) console.log(await render(read(input),resolve(option('--out','runs/manual')),flags.includes('--no-cache')));
 else if(command==='validate'&&input) report(validateRender(resolve(input)));
 else if(command==='probe-reviewer') report(probe(resolve(input||'runs/probe'),undefined,option('--canary','')||undefined));
 else if(command==='repair-loop'&&input) report(await repairLoop(read(input),resolve(option('--out','runs/loop')),flags.includes('--mock'),Number(option('--max-attempts','3')),option('--canary','')||undefined));
 else if(command==='canary-reviewer'&&input) report(await canary(resolve(input)));
 else if(command==='motion-suite-loop'&&input) report(await (await import('./adapters/motion-suite/loop.js')).motionLoop(read(input),resolve(option('--out','runs/ms-loop')),flags.includes('--mock'),option('--canary','')||undefined));
 else if(command==='verify'&&input&&existsSync(resolve(input,'ms_scene.json'))) report(await (await import('./adapters/motion-suite/verify.js')).verifyMotionRun(resolve(input)));
 else if(command==='verify'&&input) report(verifyRun(resolve(input)));
 else {console.log('foundry render <scene> --out <dir> [--no-cache]\nfoundry validate <render_dir>\nfoundry probe-reviewer [output_dir] [--canary <proof_dir>]\nfoundry repair-loop <scene> --out <dir> [--mock] [--max-attempts 3] [--canary <proof_dir>]\nfoundry motion-suite-loop <ms_scene> --out <fresh_dir> [--mock | --canary <proof_dir>]\nfoundry canary-reviewer <fresh_output_dir>\nfoundry verify <run_dir>');if(command!=='--help')process.exitCode=2}
}catch(e){const reason_code=(e as Error).message.split(':')[0];console.error(JSON.stringify({status:['NONDETERMINISTIC','BUDGET_EXHAUSTED','NO_VISION_TRANSPORT','SPEND_RISK'].includes(reason_code)?'BLOCKED':'ERROR',reason_code,detail:(e as Error).message}));process.exitCode=1}
