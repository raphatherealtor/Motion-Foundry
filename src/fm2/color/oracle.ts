/** Float64 oracle: integer wrapping matches GLSL uint PCG3d exactly. */
export function pcg3d(x:number,y:number,z:number){
 let a=(Math.imul(x,1664525)+1013904223)>>>0,b=(Math.imul(y,1664525)+1013904223)>>>0,c=(Math.imul(z,1664525)+1013904223)>>>0;
 const mix=()=>{a=(a+Math.imul(b,c))>>>0;b=(b+Math.imul(c,a))>>>0;c=(c+Math.imul(a,b))>>>0;};
 mix();a=(a^(a>>>16))>>>0;b=(b^(b>>>16))>>>0;c=(c^(c>>>16))>>>0;mix();return [a,b,c];
}
export interface DitherSettings {mode:'off'|'static'|'temporal';seed:number;frame:number}
export function oracleBytes(codes:Float64Array,width:number,height:number,settings:DitherSettings){
 const {mode,seed,frame}=settings;if(codes.length!==width*height*4||!['off','static','temporal'].includes(mode)||![seed,frame].every(n=>Number.isInteger(n)&&n>=0&&n<=0xffffffff))throw Error('TYPE_INVALID: oracle settings');
 const bytes=new Uint8Array(codes.length),dithered=new Float64Array(codes.length),tick=((mode==='temporal'?frame:0)^seed)>>>0;
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
 const i=4*(y*width+x),a=pcg3d(x,y,tick),b=pcg3d((x+0x9e3779b9)>>>0,(y+0x85ebca6b)>>>0,(tick^0xc2b2ae35)>>>0);
 for(let c=0;c<4;c++){const v=codes[i+c],noise=c<3&&mode!=='off'&&v>0&&v<255?((a[c]&0xffffff)-(b[c]&0xffffff))/16777215:0;
 dithered[i+c]=Math.max(0,Math.min(255,v+noise));bytes[i+c]=Math.floor(dithered[i+c]+.5);}
 }return {bytes,dithered};
}
