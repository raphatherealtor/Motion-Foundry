import type {ValidationResult} from '../../contracts.js';
import {stepSpectrum} from './spectrum.js';
export interface GradientRegion {id:string;x:number;y:number;width:number;height:number;channel:0|1|2}
export interface BandingParams {lines:number;runFactor:number;maxStepLsb:number;peakDb:number;window:number}
export const bandingDefaults:BandingParams={lines:64,runFactor:1.5,maxStepLsb:1,peakDb:6,window:256};
/** Literal FM2 §6.4: raw per-scanline runs/steps; averaged error periodograms. */
export function banding(bytes:Uint8Array,expected:Float64Array,width:number,height:number,regions:GradientRegion[],renderId:string,fixture=true,params=bandingDefaults){
 if(!Number.isInteger(width)||!Number.isInteger(height)||width<1||height<1||!Number.isInteger(params.lines)||params.lines<1||!Number.isInteger(params.window)||params.window<16||params.window%2!==0||!Number.isFinite(params.runFactor)||params.runFactor<=0||!Number.isFinite(params.maxStepLsb)||params.maxStepLsb<0||!Number.isFinite(params.peakDb))throw Error('TYPE_INVALID: banding parameters');
 if(bytes.length!==width*height*4||expected.length!==bytes.length||!regions.length)throw Error('TYPE_INVALID: banding input');
 const violations:Record<string,unknown>[]=[],metrics=[];
 for(const r of regions){
  if(![r.x,r.y,r.width,r.height].every(Number.isInteger)||r.x<0||r.y<0||r.x+r.width>width||r.y+r.height>height||r.width<params.window||r.height<params.lines||![0,1,2].includes(r.channel))throw Error('TYPE_INVALID: banding region');
  let maxStep=0,stepCount=0,longRuns=0,meanMaxRun=0,maxRunRatio=0;const profile=new Float64Array(r.width),oracle=new Float64Array(r.width),sampleRows=[];
  for(let line=0;line<params.lines;line++){
   const y=r.y+Math.floor((line+.5)*r.height/params.lines);sampleRows.push(y);let start=0,maximum=1;
   const at=(x:number)=>bytes[4*(y*width+r.x+x)+r.channel],ref=(x:number)=>expected[4*(y*width+r.x+x)+r.channel];
   const run=(end:number)=>{const length=end-start,span=Math.max(1,length-1),slope=Math.abs(ref(Math.min(r.width-1,start+span))-ref(start))/span,theory=slope>1e-12?Math.max(1,1/slope):Infinity,ratio=length/theory;maximum=Math.max(maximum,length);maxRunRatio=Math.max(maxRunRatio,ratio);if(ratio>params.runFactor)longRuns++;start=end;};
   for(let x=0;x<r.width;x++){profile[x]+=at(x)/params.lines;oracle[x]+=ref(x)/params.lines;if(x){const step=Math.abs(at(x)-at(x-1));maxStep=Math.max(maxStep,step);if(step>params.maxStepLsb)stepCount++;if(at(x)!==at(x-1))run(x);}}
   run(r.width);meanMaxRun+=maximum/params.lines;
  }
  let maxMeanResidualStep=0,expectedMaxStep=0;
  for(let x=1;x<r.width;x++){const truth=oracle[x]-oracle[x-1];expectedMaxStep=Math.max(expectedMaxStep,Math.abs(truth));maxMeanResidualStep=Math.max(maxMeanResidualStep,Math.abs((profile[x]-profile[x-1])-truth));}
  const spectra=[];for(const fraction of [0,.5,1]){
   const start=Math.floor((r.width-params.window)*fraction),errors=sampleRows.map(y=>Array.from({length:params.window},(_,k)=>{const i=4*(y*width+r.x+start+k)+r.channel;return bytes[i]-expected[i];}));
   const slope=(oracle[start+params.window-1]-oracle[start])/(params.window-1);spectra.push(stepSpectrum(errors,slope));
  }
  const maxPeakDb=Math.max(...spectra.map(s=>s.peakDb));
  const row={region:r.id,channel:r.channel,maxStep,stepCount,meanMaxRun,maxRunRatio,longRuns,maxPeakDb,expectedMaxStep,maxMeanResidualStep,spectra};metrics.push(row);
  if(stepCount)violations.push({region:r.id,detail:'ADJACENT_RUN_STEP_EXCEEDS_ONE_LSB',count:stepCount,maxStep});
  if(longRuns)violations.push({region:r.id,detail:'CONSTANT_RUN_TOO_LONG',count:longRuns,maxRunRatio});
  if(maxPeakDb>params.peakDb)violations.push({region:r.id,detail:'STEP_FREQUENCY_PEAK',peakDb:maxPeakDb});
 }
 const validation:ValidationResult={schema:'foundry.validation/0.1',render_id:renderId,validator:'banding.v1',kind:fixture?'hard_contract':'heuristic',status:violations.length?(fixture?'FAIL':'WARN'):'PASS',params:{...params,metric:'raw scanline run steps; averaged quantization-error spectrum',metrics},violations};
 return validation;
}
export function negativeControl(positive:ValidationResult,negative:ValidationResult){
 if(negative.status!=='FAIL')return {status:'ERROR',detail:'NEGATIVE_CONTROL_NOT_REJECTED',positive,negative};
 return {status:positive.status==='PASS'?'PASS':'BLOCKED',detail:positive.status==='PASS'?'CONTROL_DISCRIMINATES':'POSITIVE_CARD_FAILS_LITERAL_BANDING_GATE',positive,negative};
}
