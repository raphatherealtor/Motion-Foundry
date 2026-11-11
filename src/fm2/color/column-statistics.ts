import {familyWiseMultiplier} from './normal-quantile.js';
/** Population standard deviation of measured oracle quantization residuals. */
export class ResidualMoments {
 count=0;mean=0;m2=0;
 add(value:number){this.count++;const d=value-this.mean;this.mean+=d/this.count;this.m2+=d*(value-this.mean);}
 get sigma(){return this.count?Math.sqrt(Math.max(0,this.m2/this.count)):0;}
}
export function columnStatistics(moments:ResidualMoments,columns:Float64Array,lines:number,familyColumns=columns.length){
 const sigma=moments.sigma,k=familyWiseMultiplier(familyColumns),bound=k*sigma/Math.sqrt(lines);let positive=0,negative=0,zero=0,min=Infinity,max=-Infinity,maxZ=0;let worstColumn=-1;const exceeding=[];
 for(let x=0;x<columns.length;x++){const value=columns[x];if(value>0)positive++;else if(value<0)negative++;else zero++;min=Math.min(min,value);max=Math.max(max,value);const z=sigma?Math.abs(value)*Math.sqrt(lines)/sigma:(value===0?0:Infinity);if(z>maxZ){maxZ=z;worstColumn=x;}if(Math.abs(value)>bound)exceeding.push({column:x,mean:value,z});}
 const globalMeanZ=sigma?moments.mean*Math.sqrt(moments.count)/sigma:0;
 const oneDirection=(positive>0&&negative===0)||(negative>0&&positive===0);
 return {count:moments.count,globalMean:moments.mean,sigma,N:lines,familyColumns,familyAlpha:.001,k,bound,maxZ,worstColumn,positive,negative,zero,min,max,globalMeanZ,classification:oneDirection||Math.abs(globalMeanZ)>4?'systematic_bias_suspected':'centered_sampling_noise',exceeding};
}
