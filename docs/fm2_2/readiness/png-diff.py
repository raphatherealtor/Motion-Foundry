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
import hashlib,shutil
base=Path('docs/fm2_2/readiness');record=json.load(open('runs/fm2-2/serial-acceptance-tagged/12.json'));ref=Path(record['events'][0]['b'])/'frames/f0000.png';shutil.copyfile(ref,base/'retained-frame0.png')
a=png(ref);b=png(base/'begin-frame0.png');assert a[:2]==b[:2];w,h=a[:2];diff=[]
for y in range(h):
 for x in range(w):
  aa=list(a[3][y][x*a[2]:(x+1)*a[2]]);bb=list(b[3][y][x*b[2]:(x+1)*b[2]])
  if len(aa)==3:aa+=[255]
  if len(bb)==3:bb+=[255]
  if aa!=bb:diff.append({'x':x,'y':y,'a':aa,'b':bb,'delta':[v-u for u,v in zip(aa,bb)]})
def meta(p):
 data=p.read_bytes();i=8;chunks=[]
 while i<len(data):
  n=struct.unpack('>I',data[i:i+4])[0];t=data[i+4:i+8].decode();v=data[i+8:i+8+n];chunks.append({'type':t,'bytes':n,'header':v[:13].hex() if t=='IHDR' else None});i+=n+12
 return {'sha256':hashlib.sha256(data).hexdigest(),'bytes':len(data),'chunks':chunks}
r={'reference':meta(ref),'beginFrame':meta(base/'begin-frame0.png'),'size':[w,h],'referenceChannels':a[2],'beginFrameChannels':b[2],'changedPixels':len(diff),'changedChannels':sum(sum(v!=0 for v in p['delta']) for p in diff),'maxDelta':max((abs(v) for p in diff for v in p['delta']),default=0),'bbox':[min(p['x'] for p in diff),min(p['y'] for p in diff),max(p['x'] for p in diff),max(p['y'] for p in diff)] if diff else None,'first100':diff[:100]}
(base/'frame0-diff.json').write_text(json.dumps(r,indent=2)+'\n');print(json.dumps({k:v for k,v in r.items() if k!='first100'},indent=2))
