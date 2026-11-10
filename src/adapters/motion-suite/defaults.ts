import {resolve} from 'node:path';
import {root} from '../../scene.js';
import {browserExecutable} from './browser.js';
export const options=(workDir=resolve(root,'runs/m1-proof'))=>({checkout:'/root/projects/motion-suite-m1',browserPath:browserExecutable(),playwrightModule:resolve(root,'tooling/m1-browser/node_modules/playwright/index.mjs'),workDir});
