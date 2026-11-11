/** Averaged periodogram of quantization error; avoids treating the intended gradient as banding. */
export function stepSpectrum(errors:number[][],slope:number){
 const n=errors[0]?.length??0;if(n<16||errors.some(e=>e.length!==n))throw Error('TYPE_INVALID: spectrum window');
 const powers=new Float64Array(n/2),cos=new Float64Array(n),sin=new Float64Array(n);
 for(let k=1;k<n/2;k++){
  for(let x=0;x<n;x++){const a=2*Math.PI*k*x/n;cos[x]=Math.cos(a);sin[x]=Math.sin(a);}
  for(const line of errors){const mean=line.reduce((a,b)=>a+b,0)/n;let re=0,im=0;for(let x=0;x<n;x++){const e=line[x]-mean;re+=e*cos[x];im-=e*sin[x];}powers[k]+=(re*re+im*im)/(n*n*errors.length);}
 }
 const f=Math.abs(slope)%1,frequency=Math.min(f,1-f),bin=Math.max(1,Math.min(n/2-2,Math.round(frequency*n)));
 const floor=Array.from(powers).filter((_,k)=>k>2&&Math.abs(k-bin)>2).sort((a,b)=>a-b),noise=floor[Math.floor(floor.length/2)]??0;
 const peak=Math.max(powers[bin-1],powers[bin],powers[bin+1]);
 return {frequency,bin,peakPower:peak,noisePower:noise,peakDb:10*Math.log10((peak+1e-20)/(noise+1e-20))};
}
