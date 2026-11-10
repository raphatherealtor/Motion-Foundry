export async function capabilities(canvas){
 const attrs={antialias:false,premultipliedAlpha:true,preserveDrawingBuffer:false,powerPreference:'default'};
 let gl=canvas.getContext('webgl2',attrs);if(!gl)return {webgl2:false};
 const extensions={};for(const n of ['WEBGL_debug_renderer_info','EXT_color_buffer_float','EXT_float_blend','OES_texture_float_linear','EXT_color_buffer_half_float','EXT_texture_norm16','WEBGL_lose_context'])extensions[n]=!!gl.getExtension(n);
 const d=gl.getExtension('WEBGL_debug_renderer_info');const out={webgl2:true,attributes:gl.getContextAttributes(),extensions,renderer:d?gl.getParameter(d.UNMASKED_RENDERER_WEBGL):null,vendor:d?gl.getParameter(d.UNMASKED_VENDOR_WEBGL):null,limits:{},precision:{},targets:{}};
 for(const n of ['MAX_TEXTURE_SIZE','MAX_RENDERBUFFER_SIZE','MAX_DRAW_BUFFERS','MAX_COLOR_ATTACHMENTS','MAX_TEXTURE_IMAGE_UNITS','MAX_FRAGMENT_UNIFORM_VECTORS','MAX_VIEWPORT_DIMS']){const v=gl.getParameter(gl[n]);out.limits[n]=ArrayBuffer.isView(v)?Array.from(v):v;}
 for(const n of ['HIGH_FLOAT','HIGH_INT']){const p=gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER,gl[n]);out.precision[n]={precision:p.precision,rangeMin:p.rangeMin,rangeMax:p.rangeMax};}
 for(const n of ['RGBA16F','RGBA32F','RGBA8']){
 const t=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,t);gl.texStorage2D(gl.TEXTURE_2D,1,gl[n],4,4);const f=gl.createFramebuffer();gl.bindFramebuffer(gl.FRAMEBUFFER,f);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,t,0);
 const r={complete:gl.checkFramebufferStatus(gl.FRAMEBUFFER)===gl.FRAMEBUFFER_COMPLETE,readFormat:gl.getParameter(gl.IMPLEMENTATION_COLOR_READ_FORMAT),readType:gl.getParameter(gl.IMPLEMENTATION_COLOR_READ_TYPE),reads:{}};
 gl.clearColor(.25,.5,.75,1);gl.clear(gl.COLOR_BUFFER_BIT);
 for(const [type,data]of n==='RGBA8'?[['UNSIGNED_BYTE',new Uint8Array(64)]]:[['FLOAT',new Float32Array(64)],['HALF_FLOAT',new Uint16Array(64)]]){while(gl.getError()!==gl.NO_ERROR){}gl.readPixels(0,0,4,4,gl.RGBA,gl[type],data);r.reads[type]={error:gl.getError(),sample:Array.from(data.slice(0,4))};}
 out.targets[n]=r;gl.deleteFramebuffer(f);gl.deleteTexture(t);
 }
 const loss=gl.getExtension('WEBGL_lose_context');out.contextLoss={lost:false,restored:false,reinitialized:false};
 if(loss){await new Promise(resolve=>{const timer=setTimeout(resolve,3000);canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();out.contextLoss.lost=true;setTimeout(()=>loss.restoreContext(),50);},{once:true});canvas.addEventListener('webglcontextrestored',()=>{out.contextLoss.restored=true;gl=canvas.getContext('webgl2',attrs);gl.getExtension('EXT_color_buffer_float');const t=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,t);gl.texStorage2D(gl.TEXTURE_2D,1,gl.RGBA16F,4,4);const f=gl.createFramebuffer();gl.bindFramebuffer(gl.FRAMEBUFFER,f);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,t,0);out.contextLoss.reinitialized=gl.checkFramebufferStatus(gl.FRAMEBUFFER)===gl.FRAMEBUFFER_COMPLETE;clearTimeout(timer);resolve();},{once:true});loss.loseContext();});}
 return out;
}
