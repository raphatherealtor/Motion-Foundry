import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {Scene} from './scene.js';
import {Boxes,Word,verifyHashes} from './render.js';
import {ValidationResult} from './contracts.js';
import {read,write,fileHash} from './io.js';
export const safe={x0:90,y0:200,x1:990,y1:1720};
export const inside=(w:Word)=>w.bbox[0]>=90&&w.bbox[1]>=200&&w.bbox[2]<=990&&w.bbox[3]<=1720;
const full=(w:Word)=>w.displayed&&w.opacity>=0.999&&w.visible;
export const loadBoxes=(dir:string):Boxes[]=>readFileSync(resolve(dir,'boxes.jsonl'),'utf8').trim().split('\n').map(l=>JSON.parse(l));
export function validate(scene:Scene,rows:Boxes[],original:Scene,baseline:Boxes[],render_id:string):ValidationResult[]{
 const result=(validator:string,kind:ValidationResult['kind'],params:Record<string,unknown>,violations:Record<string,unknown>[]):ValidationResult=>({schema:'foundry.validation/0.1',render_id,validator,kind,status:violations.length?'FAIL':'PASS',params,violations});
 const geometry:Record<string,unknown>[]=[],minimum:Record<string,unknown>[]=[];
 for(const row of rows)for(const w of row.words){
 if(!w.visible)continue;
 const entrance=scene.annotations.some(a=>a.type==='offscreen_entrance'&&a.object===w.object&&row.frame>=a.range[0]&&row.frame<a.range[1]);
 if(!inside(w)&&!entrance)geometry.push({object:w.object,word:w.word,frames:{start:row.frame,end:row.frame+1},bbox:w.bbox,overflow_px:{left:Math.max(0,90-w.bbox[0]),right:Math.max(0,w.bbox[2]-990),top:Math.max(0,200-w.bbox[1]),bottom:Math.max(0,w.bbox[3]-1720)}});
 if(w.fontSize<40)minimum.push({word:w.word,frame:row.frame,fontSize:w.fontSize});
 }
 const content:Record<string,unknown>[]=[];
 for(const [id,o] of Object.entries(original.objects))o.text.split(' ').forEach((text,i)=>{
 const word=id+':'+i;
 const required=baseline.filter(r=>r.words.some(w=>w.word===word&&w.text===text&&w.displayed&&w.opacity>=0.999)).length;
 const actual=rows.filter(r=>r.words.some(w=>w.word===word&&w.text===text&&full(w)&&inside(w))).length;
 if(scene.objects[id]?.text!==o.text||actual<required)content.push({object:id,word,text,required_frames:required,actual_frames:actual});
 });
 const explicit:Record<string,unknown>[]=[],warnings:Record<string,unknown>[]=[],flashes:Record<string,unknown>[]=[];
 const visibleItems=(r:Boxes)=>[...r.words.filter(w=>w.visible),...r.objects.filter(w=>w.visible&&!scene.objects[w.object])];
 const present=(r:Boxes,id:string)=>r.words.some(w=>w.object===id&&w.visible);
 for(let i=0;i<rows.length;i++){
 const r=rows[i];
 if(!visibleItems(r).length&&!scene.annotations.some(a=>a.type==='intentional_flash'&&r.frame>=a.range[0]&&r.frame<a.range[1]))warnings.push({frame:r.frame,note:'Potential blank frame; heuristic only.'});
 for(const c of scene.contracts.must_contain_visible_content){
 const [x0,y0,x1,y1]=c.region;
 if(r.frame>=c.range[0]&&r.frame<c.range[1]&&!visibleItems(r).some(w=>w.bbox[0]<x1&&w.bbox[2]>x0&&w.bbox[1]<y1&&w.bbox[3]>y0))explicit.push({contract:c.id,frame:r.frame,region:c.region,reason:'REQUIRED_REGION_BLANK'});
 }
 if(i>0&&i+1<rows.length&&!scene.annotations.some(a=>a.type==='intentional_flash'&&r.frame>=a.range[0]&&r.frame<a.range[1]))for(const id of Object.keys(scene.objects)){if(present(rows[i-1],id)===present(rows[i+1],id)&&present(r,id)!==present(rows[i-1],id))flashes.push({object:id,frame:r.frame,note:'Potential one-frame visibility flash; heuristic only.'})}
 if(i>0&&i+1<rows.length)for(const id of scene.contracts.forbid_one_frame_discontinuity)if(present(rows[i-1],id)&&!present(r,id)&&present(rows[i+1],id))explicit.push({object:id,frame:r.frame,reason:'FORBIDDEN_ONE_FRAME_DISCONTINUITY'});
 }
 const flash=result('visibility_flash.v1','heuristic',{},flashes);flash.status=flashes.length?'WARN':'NOT_RUN';
 const heuristic=result('blank_frames.v1','heuristic',{},warnings);heuristic.status=warnings.length?'WARN':'NOT_RUN';
 return [result('safe_area.v1','hard_geometry',{safe},geometry),result('min_font_size.v1','hard_geometry',{minimum:40},minimum),result('required_content.v1','hard_contract',{fixture_only:true,baseline:'original fully visible frame counts; safe-area constraint applies to candidates'},content),result('scene_visibility_contract.v1','hard_contract',{},explicit),heuristic,flash];
}
export function validateRender(dir:string,baselineDir=dir,persist=true){
 const manifest=verifyHashes(dir);verifyHashes(baselineDir);
 const results=validate(read(resolve(dir,'scene.json')),loadBoxes(dir),read(resolve(baselineDir,'scene.json')),loadBoxes(baselineDir),manifest.render_id);
 if(persist){const files=results.map(v=>{const path=`validation/${v.validator}.json`;write(resolve(dir,path),v);return {path,sha256:fileHash(resolve(dir,path))}});write(resolve(dir,'validation-index.json'),{schema:'foundry.validation_index/0.1',files});}
 return results;
}
export const passing=(results:ValidationResult[])=>['safe_area.v1','min_font_size.v1','required_content.v1','scene_visibility_contract.v1'].every(id=>results.filter(r=>r.validator===id&&r.kind!=='heuristic').length===1&&results.find(r=>r.validator===id)?.status==='PASS');
export const quantize=(start:number,end:number,num=30,den=1)=>({start:Math.floor(start*num/den),end:Math.ceil(end*num/den),rounding:{start:'floor',end:'ceil'}});
export const logicalPoint=(x:number,y:number,t:{scale_x:number;scale_y:number;offset_x:number;offset_y:number})=>[(x-t.offset_x)/t.scale_x,(y-t.offset_y)/t.scale_y];
