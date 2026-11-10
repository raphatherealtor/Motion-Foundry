import {resolve} from 'node:path';
import {existsSync} from 'node:fs';
import {root} from '../../scene.js';
export const pinnedBrowserVersion='153.0.8010.12';
export function browserExecutable(){
 const path=resolve(root,'tooling/m1-browser/browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell');
 if(!existsSync(path))throw new Error('TYPE_INVALID: pinned Chromium153 is not installed; no browser fallback');
 return path;
}
