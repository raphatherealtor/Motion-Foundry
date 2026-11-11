/** Invert Gaussian survival probability without subtracting small tails from one. */
const cache=new Map<number,number>();
function survival(x:number){
 const n=4096,end=12,h=(end-x)/n,f=(t:number)=>Math.exp(-t*t/2)/Math.sqrt(2*Math.PI);
 let sum=f(x)+f(end);for(let i=1;i<n;i++)sum+=(i%2?4:2)*f(x+i*h);return sum*h/3;
}
export function familyWiseMultiplier(columns:number){
 if(!Number.isSafeInteger(columns)||columns<1)throw Error('TYPE_INVALID: family column count');
 const old=cache.get(columns);if(old!==undefined)return old;
 const tail=.001/(2*columns);let lo=0,hi=12;
 for(let i=0;i<60;i++){const mid=(lo+hi)/2;if(survival(mid)>tail)lo=mid;else hi=mid;}
 const k=(lo+hi)/2;cache.set(columns,k);return k;
}
