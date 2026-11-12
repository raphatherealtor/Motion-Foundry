from pathlib import Path
import json,collections
exec(Path('docs/fm2_2/frame210/diff.py').read_text().split('base=Path')[0])
b=Path('runs/fm2-2/stable-cdp/traced');rec=json.load(open('runs/fm2-2/serial-acceptance-tagged/12.json'));ref=Path(rec['events'][0]['b']);results=[]
for i in range(1): # Stop exact-identity check at the first differing frame.
 name=f'frames/f{i:04}.png';w,h,c,a=png(ref/name);ww,hh,cc,d=png(b/name);assert (w,h)==(ww,hh)
 pixels=[];channels=0;mx=0
 for y in range(h):
  for x in range(w):
   aa=list(a[y][x*c:(x+1)*c]);bb=list(d[y][x*cc:(x+1)*cc])
   if len(aa)==3:aa.append(255)
   if len(bb)==3:bb.append(255)
   if aa!=bb:
    ds=[v-u for u,v in zip(aa,bb)];channels+=sum(v!=0 for v in ds);mx=max(mx,max(abs(v) for v in ds));pixels.append({'x':x,'y':y,'reference':aa,'candidate':bb,'delta':ds})
 r={'frame':i,'pixels':len(pixels),'channels':channels,'maxDelta':mx,'bbox':[min(p['x'] for p in pixels),min(p['y'] for p in pixels),max(p['x'] for p in pixels),max(p['y'] for p in pixels)] if pixels else None};results.append(r)
 if i==0:Path('docs/fm2_2/stable-cdp/frame0-pixels.json').write_text(json.dumps({'summary':r,'pixels':pixels},indent=2)+'\n')
Path('docs/fm2_2/stable-cdp/pixel-comparison.json').write_text(json.dumps(results,indent=2)+'\n');print('frame0',results[0]);print('differentFrames',sum(r['pixels']>0 for r in results),'totalPixels',sum(r['pixels'] for r in results),'maxDelta',max(r['maxDelta'] for r in results))
