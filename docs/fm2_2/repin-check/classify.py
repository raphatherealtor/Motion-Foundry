from pathlib import Path
import json,math
exec(Path('docs/fm2_2/frame210/diff.py').read_text().split('base=Path')[0])
base=Path('runs/fm2-2/repin-check');caps=json.load(open(base/'m0-a/captures.json'));rec=json.load(open('runs/fm2-2/serial-acceptance-tagged/12.json'));ref=Path(rec['events'][0]['b']);rows=[]
def boundary(x,y):return any(abs((v+.5)-b)<=1 for v in [x,y] for b in [255.5,509.5,763.5])
def aa_circle(x,y,objects):
 for o in objects:
  if o['object'] not in ['shape1','shape2']:continue
  l,t,r,b=[v*.5 for v in o['bbox']];cx=(l+r)/2;cy=(t+b)/2;radius=(r-l)/2
  dx=max(x-cx,0,cx-(x+1));dy=max(y-cy,0,cy-(y+1));near=math.hypot(dx,dy)
  far=max(math.hypot(px-cx,py-cy) for px in [x,x+1] for py in [y,y+1])
  if near<radius<far:return True
 return False
for frame in range(211):
 name=f'frames/f{frame:04}.png';w,h,c,a=png(ref/name);ww,hh,cc,b=png(base/'m0-a'/name);assert (w,h,c)==(ww,hh,cc)
 changes=[];mx=0;channels=0;bad=[]
 for y in range(h):
  if a[y]==b[y]:continue
  for x in range(w):
   aa=list(a[y][x*c:(x+1)*c]);bb=list(b[y][x*c:(x+1)*c])
   if aa!=bb:
    delta=max(abs(u-v) for u,v in zip(aa,bb));mx=max(mx,delta);channels+=sum(u!=v for u,v in zip(aa,bb));edge=aa_circle(x,y,caps[frame]['boxes']['objects']);bound=boundary(x,y);p={'x':x,'y':y,'reference':aa,'candidate':bb,'maxDelta':delta,'aaEdgeCertified':edge,'tileBoundary':bound};changes.append(p)
    if delta>6 or not edge or not bound:bad.append(p)
 r={'frame':frame,'changedPixels':len(changes),'changedChannels':channels,'maxDelta':mx,'eligible':not bad,'violations':bad};rows.append(r)
 Path('docs/fm2_2/repin-check/classification.json').write_text(json.dumps({'framesChecked':len(rows),'rows':rows,'repinned':[]},indent=2)+'\n')
 print(json.dumps(r),flush=True)
 if bad:
  Path('docs/fm2_2/repin-check/first-disallowed-pixels.json').write_text(json.dumps({'frame':frame,'allChangedPixels':changes,'violations':bad},indent=2)+'\n');raise SystemExit(2)
print('ALL211 FRAMES ELIGIBLE; pins not yet changed')
