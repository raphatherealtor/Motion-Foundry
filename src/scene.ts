import {readFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
export interface Scene {schema:string;seed:number;width:number;height:number;fps:{num:number;den:number};frames:number;objects:Record<string,{text:string;style:{fontSize:number;letterSpacing:number;lineHeight:number};layout:{x:number;y:number;maxWidth:number;align:'left'|'center'|'right';wrap:boolean};timing:{in:number;out:number}}>;annotations:{type:string;object?:string;range:[number,number]}[];contracts:{required_content:string;fixture_only:boolean;must_contain_visible_content:{id:string;region:[number,number,number,number];range:[number,number]}[];forbid_one_frame_discontinuity:string[]}}
export const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
export const assets=()=>({gsap:readFileSync(resolve(root,'node_modules/gsap/dist/gsap.min.js'),'utf8'),font:readFileSync(resolve(root,'assets/fonts/inter-latin-400-normal.woff2')).toString('base64')});
export function checkScene(s:Scene) {
 const raw=JSON.stringify(s);
 if(/https?:|Date\s*\.\s*now|new\s+Date|performance\s*\.\s*now|Math\s*\.\s*random|setTimeout|setInterval/.test(raw)) throw new Error('FORBIDDEN_OP: scene network or wall clock');
 if(s.schema!=='foundry.scene/0.1'||s.width!==1080||s.height!==1920||s.frames!==270||s.fps.num!==30||s.fps.den!==1) throw new Error('TYPE_INVALID: M0 fixture dimensions/timebase');
}
export function html(s:Scene) {
 checkScene(s); const a=assets();
 return `<!doctype html><style>@font-face{font-family:Fixture;src:url(data:font/woff2;base64,${a.font})}*{box-sizing:border-box;animation:none!important;transition:none!important}html,body{margin:0;width:1080px;height:1920px;overflow:hidden;background:#101421}body{font-family:Fixture;color:#f4efe4}.shape{position:absolute;width:320px;height:320px;border-radius:50%;background:#ed695b}.word{display:inline-block;white-space:nowrap}</style><div id="shape1" class="shape" style="left:140px;top:330px"></div><div id="shape2" class="shape" style="left:650px;top:1300px;background:#71bba4"></div><script>${a.gsap}</script><script>
 const scene=${JSON.stringify(s).replace(/</g,"\\u003c")};
 let seed=scene.seed>>>0;
 const rng=()=>{seed+=0x6D2B79F5;let t=seed;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296};
 window.foundry={frame:0,time:0,rng};
 const tl=gsap.timeline({paused:true});gsap.ticker.sleep();gsap.set('#shape1',{y:Math.floor(rng()*30)});gsap.set('#shape2',{y:-Math.floor(rng()*30)});
 for(const [id,o] of Object.entries(scene.objects)){
  const el=document.createElement('div');el.id=id;
  Object.assign(el.style,{position:'absolute',left:o.layout.x+'px',top:o.layout.y+'px',width:o.layout.maxWidth+'px',fontSize:o.style.fontSize+'px',letterSpacing:o.style.letterSpacing+'px',lineHeight:String(o.style.lineHeight),textAlign:o.layout.align,whiteSpace:o.layout.wrap?'normal':'nowrap'});
  o.text.split(' ').forEach((word,i)=>{if(i)el.append(' ');const w=document.createElement('span');w.className='word';w.dataset.object=id;w.dataset.word=id+':'+i;w.textContent=word;el.append(w)});
  document.body.append(el);
  el.querySelectorAll('.word').forEach((w,i)=>{gsap.set(w,{opacity:0,y:18});tl.fromTo(w,{opacity:0,y:18},{opacity:1,y:0,duration:0.4,ease:'power1.out',immediateRender:false},o.timing.in/30+i*0.1);if(o.timing.out<scene.frames)tl.set(w,{opacity:0},o.timing.out/30)});
 }
 tl.to('#shape1',{x:40,duration:9,ease:'none'},0);tl.to('#shape2',{x:-30,duration:9,ease:'none'},0);
 window.seekFrame=async(i)=>{window.foundry.frame=i;window.foundry.time=i/30;tl.seek(i/30,false);gsap.ticker.sleep();await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))};
 document.fonts.ready.then(()=>{window.__foundryReady=true});
 </script>`;
}
