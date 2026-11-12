import struct,zlib,json
from pathlib import Path
def png(p):
 b=p.read_bytes();i=8;data=b''
 while i<len(b):
  n=struct.unpack('>I',b[i:i+4])[0];t=b[i+4:i+8];v=b[i+8:i+8+n];i+=n+12
  if t==b'IHDR':w,h,depth,color=struct.unpack('>IIBB',v[:10])
  if t==b'IDAT':data+=v
 assert depth==8 and color in (2,6),(depth,color)
 c=3 if color==2 else 4;s=w*c;raw=zlib.decompress(data);rows=[];prev=bytearray(s)
 for y in range(h):
  f=raw[y*(s+1)];r=bytearray(raw[y*(s+1)+1:(y+1)*(s+1)])
  for x in range(s):
   a=r[x-c] if x>=c else 0;b=prev[x];cc=prev[x-c] if x>=c else 0
   if f==1:v=a
   elif f==2:v=b
   elif f==3:v=(a+b)//2
   elif f==4:
    q=a+b-cc;ds=[abs(q-a),abs(q-b),abs(q-cc)];v=[a,b,cc][ds.index(min(ds))]
   else:v=0
   r[x]=(r[x]+v)&255
  rows.append(r);prev=r
 return w,h,c,rows
base=Path('docs/fm2_2/tagged-acceptance-failure-13');w,h,c,a=png(base/'a-f0210.png');ww,hh,cc,b=png(base/'b-f0210.png');assert (w,h,c)==(ww,hh,cc)
pixels=[]
for y in range(h):
 for x in range(w):
  aa=list(a[y][x*c:x*c+c]);bb=list(b[y][x*c:x*c+c])
  if aa!=bb:pixels.append({'x':x,'y':y,'a':aa,'b':bb,'delta':[v-u for u,v in zip(aa,bb)]})
r={'width':w,'height':h,'channels':c,'changedPixels':len(pixels),'changedChannels':sum(sum(v!=0 for v in p['delta']) for p in pixels),'maxDelta':max(abs(v) for p in pixels for v in p['delta']),'bbox':[min(p['x'] for p in pixels),min(p['y'] for p in pixels),max(p['x'] for p in pixels),max(p['y'] for p in pixels)],'pixels':pixels}
Path('docs/fm2_2/frame210/pixel-diff.json').write_text(json.dumps(r,indent=2)+'\n');print(json.dumps(r))
