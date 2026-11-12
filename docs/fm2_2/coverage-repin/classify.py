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
def circle(x,y,objects):
 for o in objects:
  if o['object'] not in ['shape1','shape2']:continue
  l,t,r,b=[v*.5 for v in o['bbox']];cx=(l+r)/2;cy=(t+b)/2;rr=(r-l)/2
  if max(x-cx,0,cx-x-1)**2+max(y-cy,0,cy-y-1)**2<rr*rr<max((px-cx)**2+(py-cy)**2 for px in [x,x+1] for py in [y,y+1]):return cx,cy,rr
 return None
exec(Path('docs/fm2_2/coverage-repin/coverage_fit.py').read_text())
def flanks(x,y,geom,a,b,c,w,h):
 cx,cy,r=geom;inside=[];outside=[]
 for yy in range(max(0,y-8),min(h,y+9)):
  for xx in range(max(0,x-8),min(w,x+9)):
   aa=list(a[yy][xx*c:(xx+1)*c]);bb=list(b[yy][xx*c:(xx+1)*c])
   if aa!=bb:continue
   near=math.hypot(max(xx-cx,0,cx-xx-1),max(yy-cy,0,cy-yy-1));far=max(math.hypot(px-cx,py-cy) for px in [xx,xx+1] for py in [yy,yy+1]);entry=((xx-x)**2+(yy-y)**2,xx,yy,aa)
   if far<r:inside.append(entry)
   if near>r:outside.append(entry)
 if not inside or not outside:return None
 f=min(inside);bg=min(outside);return {'F':f[3],'B':bg[3],'fillNeighbor':[f[1],f[2]],'backgroundNeighbor':[bg[1],bg[2]]}
for frame in range(211):
 name=f'frames/f{frame:04}.png';w,h,c,a=png(ref/name);ww,hh,cc,b=png(base/'m0-a'/name);assert (w,h,c)==(ww,hh,cc);changes=[];bad=[]
 for y in range(h):
  if a[y]==b[y]:continue
  for x in range(w):
   aa=list(a[y][x*c:(x+1)*c]);bb=list(b[y][x*c:(x+1)*c])
   if aa==bb:continue
   geom=circle(x,y,caps[frame]['boxes']['objects']);ends=flanks(x,y,geom,a,b,c,w,h) if geom else None;r=fit(aa,ends['B'],ends['F']) if ends else None;s=fit(bb,ends['B'],ends['F']) if ends else None;feasible=joint(r,s);shift=abs(s['t']-r['t']) if r and s and r.get('t') is not None and s.get('t') is not None else None
   p={'x':x,'y':y,'reference':aa,'candidate':bb,'maxDelta':max(abs(u-v) for u,v in zip(aa,bb)),'boundary':boundary(x,y),'aaEdgeCertified':bool(geom),'flanks':ends,'referenceFit':r,'candidateFit':s,'coverageShift':shift};changes.append(p)
   if not(p['boundary'] and geom and r and s and feasible and shift<=.0625):bad.append(p)
 row={'frame':frame,'changedPixels':len(changes),'maxDelta':max((p['maxDelta'] for p in changes),default=0),'maxCoverageShift':max((p['coverageShift'] for p in changes if p['coverageShift'] is not None),default=0),'eligible':not bad,'violations':bad};rows.append(row)
 Path('docs/fm2_2/coverage-repin/classification.json').write_text(json.dumps({'rows':rows,'repinned':[]},indent=2)+'\n');print(json.dumps(row),flush=True)
 if bad:
  Path('docs/fm2_2/coverage-repin/stop-pixels.json').write_text(json.dumps({'frame':frame,'pixels':changes,'violations':bad},indent=2)+'\n');raise SystemExit(2)
print('ALL211 ELIGIBLE; no pin changes yet')
