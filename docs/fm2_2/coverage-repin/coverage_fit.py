def fit(pixel,B,F):
 d=[f-b for f,b in zip(F,B)];den=sum(v*v for v in d)
 if not den:return None
 lo,hi=0.,1.
 for p,b,v in zip(pixel,B,d):
  if v:
   ends=sorted([(p-b-2)/v,(p-b+2)/v]);lo=max(lo,ends[0]);hi=min(hi,ends[1])
  elif abs(p-b)>2:return {'onSegment':False,'interval':None,'t':None}
 if lo>hi:return {'onSegment':False,'interval':None,'t':None}
 ls=max(0,min(1,sum((p-b)*v for p,b,v in zip(pixel,B,d))/den));t=max(lo,min(hi,ls));return {'t':t,'leastSquaresT':ls,'interval':[lo,hi],'onSegment':True}
def joint(r,s):
 if not(r and s and r['onSegment'] and s['onSegment']):return False
 if abs(s['t']-r['t'])<=.0625:return True
 sign=1 if s['t']>r['t'] else -1
 lo=max(r['interval'][0],s['interval'][0]-sign*.0625);hi=min(r['interval'][1],s['interval'][1]-sign*.0625)
 if lo>hi:return False
 t=max(lo,min(hi,(r['t']+s['t']-sign*.0625)/2));r['t']=t;s['t']=t+sign*.0625;return True
