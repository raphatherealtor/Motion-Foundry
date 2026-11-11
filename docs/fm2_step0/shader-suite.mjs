export async function shaderSuite(canvas,glTools,assets){
 canvas.width=1080;canvas.height=1920;
 const gl=canvas.getContext('webgl2',{antialias:false,premultipliedAlpha:true,preserveDrawingBuffer:false,powerPreference:'default'});
 for(const n of ['EXT_color_buffer_float','EXT_float_blend','OES_texture_float_linear'])gl.getExtension(n);
 const {program,target,draw}=glTools(gl);const rows=[];
 const pcg='uint hash(uint v){uint s=v*747796405u+2891336453u;uint w=((s>>((s>>28u)+4u))^s)*277803737u;return(w>>22u)^w;}';
 const bodies={a:'void main(){uint i=uint(gl_FragCoord.x)+1080u*uint(gl_FragCoord.y);float x=unpackHalf2x16(i%15361u).x;o=vec4(x,x,x,1.);}',b:pcg+'void main(){uint i=uint(gl_FragCoord.x)+1080u*uint(gl_FragCoord.y);o=vec4(float(hash(i)&65535u)/65535.,float(hash(i+1u)&65535u)/65535.,float(hash(i+2u)&65535u)/65535.,1.);}',c:'void main(){float x=.001+gl_FragCoord.x/1080.;o=vec4(pow(x,2.4),exp(x)*.2,log(x)*.1+sin(x)*.1+sqrt(x)*.5,1.);}',d:'void main(){o=texture(tex,(gl_FragCoord.xy+vec2(.375,.625))/vec2(1080.,1920.));}',e:'void main(){o=vec4(.0031,.0063,.0127,.0625);}',f:'void main(){float x=gl_FragCoord.x/1080.;o=vec4(x,x*x,1.-x,1.);}',g:'void main(){vec2 p=gl_FragCoord.xy/vec2(1080.,1920.);o=texture(tex,p);}'};
 const encode=program(pcg+'void main(){vec4 v=texelFetch(tex,ivec2(gl_FragCoord.xy),0);vec3 x=max(v.rgb,vec3(0));vec3 y=mix(1.055*pow(x,vec3(1./2.4))-.055,12.92*x,lessThanEqual(x,vec3(.0031308)));uint i=uint(gl_FragCoord.x)+1080u*uint(gl_FragCoord.y);float d=(float(hash(i)&65535u)/65535.-.5)/255.;o=vec4(y+d,v.a);}');
 const hash=async data=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',data))).map(x=>x.toString(16).padStart(2,'0')).join('');
 const font=new FontFace('IBM Plex Sans',await(await fetch(assets.font)).arrayBuffer());await font.load();(globalThis.fonts??document.fonts).add(font);
 const art=typeof document==='undefined'?new OffscreenCanvas(256,256):document.createElement('canvas');art.width=256;art.height=256;
 const ctx=art.getContext('2d');ctx.fillStyle='#d5ac73';ctx.fillRect(0,0,256,256);ctx.font='32px "IBM Plex Sans"';ctx.fillStyle='#102e44';ctx.fillText('Foundry 153',8,48);
 const image=await createImageBitmap(await(await fetch(assets.png)).blob());ctx.drawImage(image,0,80,256,176);image.close();
 const upload=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,upload);gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,false);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,art);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
 const box=program('void main(){ivec2 p=ivec2(gl_FragCoord.xy)*2;o=(texelFetch(tex,p,0)+texelFetch(tex,p+ivec2(1,0),0)+texelFetch(tex,p+ivec2(0,1),0)+texelFetch(tex,p+ivec2(1,1),0))*.25;}');
 for(const format of ['RGBA16F','RGBA32F'])for(const [test,body]of Object.entries(bodies)){
 const start=performance.now();const dest=target(gl[format],1080,1920);const p=program(body);let source;
 if(test==='d'){source=target(gl.RGBA16F,1080,1920);const init=program(bodies.b);draw(init,source);gl.deleteProgram(init);let prev=source;for(let i=0;i<4;i++){const next=target(gl.RGBA16F,Math.floor(prev.w/2),Math.floor(prev.h/2));draw(box,next,prev);if(prev!==source){gl.deleteFramebuffer(prev.f);gl.deleteTexture(prev.t);}prev=next;}gl.deleteFramebuffer(source.f);gl.deleteTexture(source.t);source=prev;}
 if(test==='g')source={t:upload};
 if(test==='e'){gl.bindFramebuffer(gl.FRAMEBUFFER,dest.f);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE);for(let i=0;i<16;i++)draw(p,dest);gl.disable(gl.BLEND);}else draw(p,dest,source);
 gl.bindFramebuffer(gl.FRAMEBUFFER,dest.f);const floats=new Float32Array(1080*1920*4);gl.readPixels(0,0,1080,1920,gl.RGBA,gl.FLOAT,floats);if(gl.getError())throw Error('float read failed');const floatHash=await hash(floats.buffer);
 const encoded=target(gl.RGBA8,1080,1920);draw(encode,encoded,dest);const bytes=new Uint8Array(1080*1920*4);gl.readPixels(0,0,1080,1920,gl.RGBA,gl.UNSIGNED_BYTE,bytes);if(gl.getError())throw Error('byte read failed');rows.push({test,format,floatHash,byteHash:await hash(bytes.buffer),ms:performance.now()-start,floatSample:Array.from(floats.slice(0,4)),byteSample:Array.from(bytes.slice(0,4))});
 for(const t of [dest,encoded,...(test==='d'?[source]:[])]){gl.deleteFramebuffer(t.f);gl.deleteTexture(t.t);}gl.deleteProgram(p);
 }
 return rows;
}
