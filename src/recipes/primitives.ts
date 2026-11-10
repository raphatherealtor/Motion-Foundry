import {hash} from '../hash.js';
export const key=(id:string,property:string,frame:number,value:number,easing='linear')=>({id:id+'_'+property+'_'+frame,property,time:{value:frame,timescale:30},value,easing});
export function shape(id:string,x:number,y:number,w:number,h:number,color:string):any{return {id,kind:'shape',name:id,shapeType:'rectangle',shapeFillColor:color,transform:{x,y,scaleX:w/100,scaleY:h/60},keyframes:[],behaviors:[],masks:[]};}
export function edge(seed:number,id:string){
 const seedHash=hash({seed,id});let state=parseInt(seedHash.slice(0,8),16)>>>0;
 const rng=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};
 let path='M -50 -30';for(let x=-45;x<=50;x+=5)path+=' L '+x+' '+(-30+rng()*5).toFixed(3);
 path+=' L 50 30';for(let x=45;x>=-50;x-=5)path+=' L '+x+' '+(30-rng()*5).toFixed(3);
 return {id,seed:seedHash,path:path+' Z'};
}
