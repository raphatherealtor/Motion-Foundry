import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {dirname} from 'node:path';
import {canonical,sha256} from './hash.js';
export const read=<T=any>(p:string):T=>JSON.parse(readFileSync(p,'utf8'));
export function write(p:string,v:unknown){mkdirSync(dirname(p),{recursive:true});writeFileSync(p,canonical(v)+'\n',{flag:'wx'})}
export const fileHash=(p:string)=>sha256(readFileSync(p));
export function fail(code:string):never{throw new Error(code)}
