export function meanLuma(rgba:Uint8Array){
 let sum=0,count=0;for(let i=0;i<rgba.length;i+=64){sum+=(.2126*rgba[i]+.7152*rgba[i+1]+.0722*rgba[i+2])/255;count++;}
 return count?sum/count:0;
}
