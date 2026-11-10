import {readdirSync,readFileSync,statSync} from 'node:fs';
import {join,relative} from 'node:path';
import {hash,sha256} from '../../hash.js';
export function durable(value:unknown):unknown {
 if(Array.isArray(value))return value.map(durable);
 if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).filter(([k])=>!['createdAt','updatedAt','contributionTrace'].includes(k)).map(([k,v])=>[k,durable(v)]));
 return value;
}
export const revisionId=(intent:unknown,project:unknown)=>hash({intent:durable(intent),project:durable(project)});
export function bundleHash(dir:string):string {
 const files:Record<string,string>={};
 function visit(p:string){for(const name of readdirSync(p).sort()){const file=join(p,name);if(statSync(file).isDirectory())visit(file);else files[relative(dir,file)]=sha256(readFileSync(file));}}
 visit(dir);return hash(files);
}
export const renderId=(revision:string,config:unknown,range:unknown)=>hash({revision,config,range});
