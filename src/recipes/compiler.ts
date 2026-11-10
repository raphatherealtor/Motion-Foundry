import {checkScene} from './registry.js';
import {MotionScene,Descriptor,RecipeBlock} from './types.js';
import {shape,key,edge} from './primitives.js';
export function wordGroup(id:string,text:string,x:number,y:number,fontSize:number,start=0,extra:any={}){return {id,kind:'word_group',text,fontSize,start,stagger:6,entrance:6,end:180,transform:{x,y},...extra};}
export function describe(scene:MotionScene):Descriptor {
 checkScene(scene);
 const d:Descriptor={id:'foundry-recipe',frames:scene.frames,objects:[],cameras:[],materials:[{id:'ink',name:'Ink',type:'solid',color:'#20252c'}],words:[],edges:[],anchors:[],fonts:[]};
 d.objects.push(shape('paper',0,0,1100,1980,'#f0eadb'));
 for(let i=0;i<22;i++)d.objects.push(shape('rule_'+i,0,-900+i*85,1000,1,'#d6dce0'));
 for(const b of scene.blocks){
  d.objects.push(wordGroup(b.id+'_headline',b.params.headline,0,-590,scene.defects?.includes('headline_overflow')?142:72));
  d.objects.push(wordGroup(b.id+'_caption',b.params.caption,0,450,48,48));
  d.objects.push(wordGroup(b.id+'_source',b.params.source||'Source synthetic fixture',0,550,40,60));
  d.objects.push(wordGroup(b.id+'_lower',b.params.lower_third||'Motion Foundry',0,630,42,66));
  if(b.recipe==='vox-doc.chart_explainer')chart(d,b,scene);
  else collage(d,b,scene,b.recipe==='editorial.cutout_pop');
 }
 d.anchors=scene.timestamps||[];
 return d;
}
function chart(d:Descriptor,b:RecipeBlock,s:MotionScene){
 const values=b.params.values||[24,43,62],labels=b.params.labels||['A','B','C'];
 values.forEach((value,i)=>{
  const x=(i-1)*280,h=value*6,id=b.id+'_bar_'+i;
  const bar=shape(id,x,250-h/2,190,h,['#ec7047','#7cae9d','#678eaf'][i]);
  bar.keyframes=[key(id,'scaleY',24,0),key(id,'scaleY',42,h/60),key(id,'y',24,250),key(id,'y',42,250-h/2)];d.objects.push(bar);
  d.objects.push(wordGroup(b.id+'_label_'+i,labels[i],x,320,48,24+i*6));
  const group=b.id+'_value_'+i;
  d.objects.push({id:group,kind:'group',transform:{x:s.defects?.includes('label_clip')&&i===2?480:x,y:250-h-65}});
  [0,Math.round(value/2),value].forEach((n,j)=>d.objects.push(wordGroup(group+'_step_'+j,String(n),0,0,56,24+j*6,{parentId:group,entrance:2,end:j===2?180:30+j*6})));
 });
 d.cameras.push({id:'push',name:'Chart push',fov:60,near:1,far:20000,depthCue:0,active:true,transform:{z:-1662.768775},keyframes:[key('push','z',0,-1662.768775),key('push','z',179,-1500)]});
}
function collage(d:Descriptor,b:RecipeBlock,s:MotionScene,editorial:boolean){
 d.fonts.push({requested:editorial?'serif':'Special Elite',actual:'IBM Plex Sans'});
 for(let i=0;i<3;i++){
  const id=b.id+'_scrap_'+i,e=edge(s.seed,id),x=(i-1)*250,y=(i%2?50:-80);
  d.edges.push(e);
  const p=shape(id,x,y,360,460,['#c66b64','#cab59a','#86a5b3'][i]);
  p.masks=[{id:id+'_edge',shape:'path',pathData:e.path,x:-50,y:-30,width:100,height:60,feather:0,invert:false,rotation:0,opacity:1}];
  p.keyframes=[key(id,'y',12+i*6,y-60),key(id,'y',30+i*6,y),key(id,'x',120,x),key(id,'x',145,x+(i%2?900:-900))];
  d.objects.push(p);
 }
 const shadow=shape(b.id+'_shadow',20,140,300,390,'#564b48');shadow.shapeType='ellipse';shadow.transform={...shadow.transform,opacity:.2};shadow.keyframes=[key(shadow.id,'scaleX',20,2.5),key(shadow.id,'scaleX',45,4.2)];d.objects.push(shadow);
 const figure=shape(b.id+'_figure',0,50,260,440,'#272e35');figure.shapeType='path';(figure as any).shapePath='M -12 -30 L 12 -30 L 18 -18 L 10 -8 L 22 4 L 22 30 L -22 30 L -22 4 L -10 -8 L -18 -18 Z';figure.keyframes=[key(figure.id,'y',20,90),key(figure.id,'y',45,50)];d.objects.push(figure);
 const cover=shape(b.id+'_face_cover',0,-85,80,26,'#10151c');d.objects.push(cover);
 if(editorial)for(let i=0;i<12;i++){const dot=shape(b.id+'_dot_'+i,-390+(i%3)*35,-240+Math.floor(i/3)*35,8,8,'#3c5667');dot.shapeType='ellipse';d.objects.push(dot);}
}
