import type {Rendered,PixelMetrics} from './environment.js';
export function compare(a:Rendered,b:Rendered):{identical:boolean;metrics:PixelMetrics}{
 if(a.width!==b.width||a.height!==b.height)throw new Error('TYPE_INVALID: frame dimensions differ');
 const x=Buffer.from(a.base64,'base64'),y=Buffer.from(b.base64,'base64');
 if(x.length!==a.width*a.height*4||y.length!==x.length)throw new Error('TYPE_INVALID: invalid RGBA');
 let eq=0,max=0,se=0,x0=a.width,y0=a.height,x1=-1,y1=-1;
 for(let i=0;i<x.length;i+=4){let same=true;for(let c=0;c<4;c++){const d=Math.abs(x[i+c]-y[i+c]);same&&=d===0;max=Math.max(max,d);se+=d*d;}
 if(same)eq++;else{const px=i/4%a.width,py=Math.floor(i/4/a.width);x0=Math.min(x0,px);x1=Math.max(x1,px);y0=Math.min(y0,py);y1=Math.max(y1,py);}}
 return {identical:max===0,metrics:{pct_pixels_equal:100*eq/(a.width*a.height),max_channel_delta:max,psnr_db:se?10*Math.log10(255*255/(se/x.length)):null,diff_bbox:max?[x0,y0,x1+1,y1+1]:null}};
}
