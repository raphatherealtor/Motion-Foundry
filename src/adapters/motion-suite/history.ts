import {canonical} from '../../hash.js';
import type {Compiled} from './compile.js';
import {projectHash} from './materialize.js';
import type {OperationV2} from './v2.js';
export interface History {projects:string[];values:Record<string,string[]>}
function currentValue(c:Compiled,target:string){
 const doc=c.project.motionDocuments[c.project.activeDocumentId],parts=target.split('.');
 if(parts[0]==='lighting')return doc.lighting?.[parts[1]]??null;
 const o=doc.objects[parts[1]],group=parts[2],key=parts[3];
 if(!o)return null;
 if(group==='transform')return o.transform[key==='scale'?'scaleX':key==='rotation'?'rotationZ':key]??null;
 return group==='text'?o[key]??null:group==='layout'?o.textAlign??null:group==='surface'?o.surface?.[key]??null:null;
}
export function checkHistory(history:History,before:Compiled,after:Compiled,ops:OperationV2[]){
 if(history.projects.includes(projectHash(after)))throw new Error('OSCILLATION: repeated project');
 for(const op of ops){const value=canonical(op.value),previous=canonical(currentValue(before,op.target)),seen=history.values[op.target]||[previous];if(value!==previous&&seen.includes(value))throw new Error('OSCILLATION: property reversal');}
}
export function remember(history:History,before:Compiled,after:Compiled,ops:OperationV2[]){
 history.projects.push(projectHash(after));
 for(const op of ops){history.values[op.target]??=[canonical(currentValue(before,op.target))];history.values[op.target].push(canonical(op.value));}
}
