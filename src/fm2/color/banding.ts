import {ResidualMoments,columnStatistics} from './column-statistics.js';
import type {ValidationResult} from '../../contracts.js';
import {stepSpectrum} from './spectrum.js';import {oracleBytes,type DitherSettings} from './oracle.js';
export interface GradientRegion {id:string;x:number;y:number;width:number;height:number;channel:0|1|2}
export interface BandingParams {lines:number;oracleLsb:number;residualLsb:number;oracleColumnMatchLsb:number;profileSlackLsb:number;peakDb:number;window:number}
export const bandingDefaults:BandingParams={lines:64,oracleLsb:1,residualLsb:1.5,oracleColumnMatchLsb:.02,profileSlackLsb:.25,peakDb:6,window:256};
/** Raphael-approved replacement contract, 2026-11-11. No raw-neighbor/run-length caps. */
export function banding(bytes:Uint8Array,expected:Float64Array,width:number,height:number,regions:GradientRegion[],renderId:string,fixture=true,params=bandingDefaults,settings:DitherSettings={mode:'off',seed:0,frame:0}){
 if(!Number.isInteger(width)||!Number.isInteger(height)||width<1||height<1||!Number.isInteger(params.lines)||params.lines<1||!Number.isInteger(params.window)||params.window<16||params.window%2!==0||Object.values(params).some(n=>!Number.isFinite(n)||n<0))throw Error('TYPE_INVALID: banding parameters');
 if(bytes.length!==width*height*4||expected.length!==bytes.length||!regions.length)throw Error('TYPE_INVALID: banding input');
 const reference=oracleBytes(expected,width,height,settings),violations:Record<string,unknown>[]=[],metrics=[];
 let maxOracleDelta=0,channelsGte2=0,maxResidual=0,maxSignalResidual=0;
 for(let i=0;i<bytes.length;i++){
 const delta=Math.abs(bytes[i]-reference.bytes[i]);maxOracleDelta=Math.max(maxOracleDelta,delta);if(delta>=2)channelsGte2++;
 if(i%4!==3){maxSignalResidual=Math.max(maxSignalResidual,Math.abs(bytes[i]-expected[i]));maxResidual=Math.max(maxResidual,Math.abs(bytes[i]-reference.dithered[i]));}
 }
 if(maxOracleDelta>params.oracleLsb||channelsGte2)violations.push({detail:'ORACLE_MISMATCH',maxOracleDelta,channelsGte2});
 if(maxResidual>params.residualLsb)violations.push({detail:'PIXEL_RESIDUAL_EXCEEDED',maxResidual});
 for(const r of regions){
 if(![r.x,r.y,r.width,r.height].every(Number.isInteger)||r.x<0||r.y<0||r.x+r.width>width||r.y+r.height>height||r.width<params.window||r.height<params.lines||![0,1,2].includes(r.channel))throw Error('TYPE_INVALID: banding region');
 const rows=Array.from({length:params.lines},(_,line)=>r.y+Math.floor((line+.5)*r.height/params.lines));
 const moments=new ResidualMoments(),oracleResidual=new Float64Array(r.width);
 const profile=new Float64Array(r.width),oracleProfile=new Float64Array(r.width),signal=new Float64Array(r.width),residual=new Float64Array(r.width),signalResidual=new Float64Array(r.width);
 const histogram:Record<string,number>={},oracleHistogram:Record<string,number>={};
 for(const y of rows){
 for(const [data,hist]of [[bytes,histogram],[reference.bytes,oracleHistogram]]as const){let start=0;for(let x=1;x<=r.width;x++)if(x===r.width||data[4*(y*width+r.x+x)+r.channel]!==data[4*(y*width+r.x+x-1)+r.channel]){const length=x-start;hist[length]=(hist[length]??0)+1;start=x;}}
 for(let x=0;x<r.width;x++){const i=4*(y*width+r.x+x)+r.channel;moments.add(reference.bytes[i]-reference.dithered[i]);oracleResidual[x]+=(reference.bytes[i]-reference.dithered[i])/params.lines;profile[x]+=bytes[i]/params.lines;oracleProfile[x]+=reference.bytes[i]/params.lines;signal[x]+=expected[i]/params.lines;residual[x]+=(bytes[i]-reference.dithered[i])/params.lines;signalResidual[x]+=(bytes[i]-expected[i])/params.lines;}
 }
 const statistics=columnStatistics(moments,oracleResidual,params.lines);
 let maxColumnOracleDelta=0,maxOracleMeanResidual=0,maxMeanResidual=0,maxSignalMeanResidual=0,maxStepExcess=0,monotonicViolations=0;
 for(let x=0;x<r.width;x++){
 maxColumnOracleDelta=Math.max(maxColumnOracleDelta,Math.abs(residual[x]-oracleResidual[x]));maxOracleMeanResidual=Math.max(maxOracleMeanResidual,Math.abs(oracleResidual[x]));maxMeanResidual=Math.max(maxMeanResidual,Math.abs(residual[x]));maxSignalMeanResidual=Math.max(maxSignalMeanResidual,Math.abs(signalResidual[x]));
 if(x){const actual=profile[x]-profile[x-1],ref=oracleProfile[x]-oracleProfile[x-1];maxStepExcess=Math.max(maxStepExcess,Math.abs(actual)-Math.abs(ref));if((ref>=0&&actual<0)||(ref<=0&&actual>0))monotonicViolations++;}
 }
 let histogramDelta=0;for(const key of new Set([...Object.keys(histogram),...Object.keys(oracleHistogram)]))histogramDelta+=Math.abs((histogram[key]??0)-(oracleHistogram[key]??0));
 const spectra=[];for(const fraction of [0,.5,1]){
 const start=Math.floor((r.width-params.window)*fraction),errors=rows.map(y=>Array.from({length:params.window},(_,k)=>{const i=4*(y*width+r.x+start+k)+r.channel;return bytes[i]-expected[i];}));
 spectra.push(stepSpectrum(errors,(signal[start+params.window-1]-signal[start])/(params.window-1)));
 }
 const maxPeakDb=Math.max(...spectra.map(s=>s.peakDb));
 metrics.push({region:r.id,channel:r.channel,statistics,maxColumnOracleDelta,maxOracleMeanResidual,maxMeanResidual,maxSignalMeanResidual,maxStepExcess,monotonicViolations,histogramDelta,histogram,oracleHistogram,maxPeakDb,spectra});
 if(statistics.classification==='systematic_bias_suspected')violations.push({region:r.id,detail:'ORACLE_SYSTEMATIC_BIAS_SUSPECTED',statistics});
 if(statistics.exceeding.length)violations.push({region:r.id,detail:'ORACLE_STATISTICAL_COLUMN_BOUND_EXCEEDED',bound:statistics.bound,count:statistics.exceeding.length});
 if(maxColumnOracleDelta>params.oracleColumnMatchLsb)violations.push({region:r.id,detail:'GPU_COLUMN_ORACLE_MISMATCH',maxColumnOracleDelta});
 if(maxStepExcess>params.profileSlackLsb||monotonicViolations)violations.push({region:r.id,detail:'AGGREGATED_PROFILE_MISMATCH',maxStepExcess,monotonicViolations});
 if(histogramDelta)violations.push({region:r.id,detail:'RUN_HISTOGRAM_MISMATCH',histogramDelta});
 if(maxPeakDb>=params.peakDb)violations.push({region:r.id,detail:'STEP_FREQUENCY_PEAK',maxPeakDb});
 }
 return {schema:'foundry.validation/0.1',render_id:renderId,validator:'banding.v1',kind:fixture?'hard_contract':'heuristic',status:violations.length?(fixture?'FAIL':'WARN'):'PASS',params:{contract:'Raphael-approved-statistical-2026-11-11',...params,settings,maxOracleDelta,channelsGte2,maxResidual,maxSignalResidual,metrics,residualReference:'float64 dithered continuous code before rounding; undithered diagnostic also retained',runHistogramPolicy:'exact match; no invented near-match tolerance'},violations}as ValidationResult;
}
export function negativeControl(positive:ValidationResult,negative:ValidationResult){
 if(negative.status!=='FAIL')return {status:'ERROR',detail:'NEGATIVE_CONTROL_NOT_REJECTED',positive,negative};
 return {status:positive.status==='PASS'?'PASS':'BLOCKED',detail:positive.status==='PASS'?'CONTROL_DISCRIMINATES':'POSITIVE_CARD_FAILS_BANDING_GATE',positive,negative};
}
