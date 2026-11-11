export interface ColorGrade {exposureEV:number;colorTemperature:number;vignette:number;vignetteFeather:number;toneMap:'clamp'|'reinhard'|'aces'}
export const neutral:ColorGrade={exposureEV:0,colorTemperature:0,vignette:0,vignetteFeather:.5,toneMap:'clamp'};
const decode=(x:number)=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4;
const encode=(x:number)=>x<=.0031308?12.92*x:1.055*x**(1/2.4)-.055;
const clamp=(v:number)=>Math.max(0,Math.min(1,v));
const tone=(x:number,mode:ColorGrade['toneMap'])=>x<=0?0:mode==='reinhard'?x/(1+x):mode==='aces'?clamp(x*(2.51*x+.03)/(x*(2.43*x+.59)+.14)):Math.min(1,x);
/** Independent float64 oracle and perception data; histogram axes are normalized Rec.709 Y. */
export function colorPerception(linear:Float32Array,output:Uint8Array,width:number,height:number,grade:ColorGrade=neutral){
 const n=width*height;if(!Number.isInteger(width)||!Number.isInteger(height)||width<1||height<1||linear.length!==n*4||output.length!==n*4)throw Error('TYPE_INVALID: color frame dimensions');
 if(![grade.exposureEV,grade.colorTemperature,grade.vignette,grade.vignetteFeather].every(Number.isFinite)||Math.abs(grade.exposureEV)>16||Math.abs(grade.colorTemperature)>1||grade.vignette<0||grade.vignette>1||grade.vignetteFeather<0||grade.vignetteFeather>1||!['clamp','reinhard','aces'].includes(grade.toneMap))throw Error('TYPE_INVALID: grade');
 const histLinear=Array(256).fill(0)as number[],histOutput=Array(256).fill(0)as number[],mask=new Uint8Array(n),expected=new Float64Array(n*4);
 const t=grade.colorTemperature,r=1+.15*t,b=1-.15*t,luma=.2126*r+.7152+.0722*b,gains=[r/luma,1/luma,b/luma],scale=2**grade.exposureEV;
 const cx=(width-1)/2,cy=(height-1)/2,radius=Math.hypot(cx,cy)||1,r0=Math.max(0,Math.min(.99,1-grade.vignetteFeather));
 let coveredPixels=0,negativePixels=0,negativeComponents=0,aboveOnePixels=0,outputBlackPixels=0,outputWhitePixels=0;
 for(let p=0;p<n;p++){
  const i=p*4,a=linear[i+3];if(!Number.isFinite(a)||a<0||a>1)throw Error('TYPE_INVALID: linear alpha');if(a===0)continue;
  coveredPixels++;const u=clamp((Math.hypot(p%width-cx,Math.floor(p/width)-cy)/radius-r0)/(1-r0)),v=1-grade.vignette*u*u*(3-2*u);const rgb=[];
  let negative=false,above=false,black=false,white=false;
  for(let c=0;c<3;c++){
   const value=linear[i+c]/a*scale*gains[c]*v;if(!Number.isFinite(value))throw Error('TYPE_INVALID: nonfinite linear color');rgb.push(value);
   if(value<0){negative=true;negativeComponents++;}if(value>1)above=true;
   black ||= output[i+c]===0;white ||= output[i+c]===255;expected[i+c]=255*clamp(encode(tone(value,grade.toneMap)));
  }
  expected[i+3]=255*a;
  if(negative){negativePixels++;mask[p]|=8;}if(above){aboveOnePixels++;mask[p]|=1;}
  if(black){outputBlackPixels++;mask[p]|=2;}if(white){outputWhitePixels++;mask[p]|=4;}
  const y=.2126*rgb[0]+.7152*rgb[1]+.0722*rgb[2],yo=.2126*decode(output[i]/255)+.7152*decode(output[i+1]/255)+.0722*decode(output[i+2]/255);
  histLinear[Math.floor(clamp(y)*255)]++;histOutput[Math.floor(clamp(yo)*255)]++;
 }
 return {histograms:{axis:'normalized Rec.709 Y; pre-tone linear scene and decoded output',linear:histLinear,output:histOutput},counts:{coveredPixels,negativePixels,negativeComponents,aboveOnePixels,outputBlackPixels,outputWhitePixels},mask,expected,maskLegend:{aboveOne:1,outputZero:2,output255:4,negative:8}};
}
