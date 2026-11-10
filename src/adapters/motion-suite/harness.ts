import {mkdirSync,writeFileSync,readFileSync,existsSync,statSync} from 'node:fs';
import {resolve,join,extname,sep} from 'node:path';
import {pathToFileURL} from 'node:url';
import {execFileSync} from 'node:child_process';
import {createServer} from 'node:http';
import type {Server} from 'node:http';
import type {AddressInfo} from 'node:net';
import {pageSource} from './page-source.js';
import {MS_SHA} from './environment.js';
import {bundleHash} from './identity.js';
export async function buildHarness(checkout:string,work:string){
 const sha=execFileSync('git',['rev-parse','HEAD'],{cwd:checkout,encoding:'utf8'}).trim();
 if(sha!==MS_SHA)throw new Error('STALE_BASE: Motion Suite checkout differs from pin');
 if(execFileSync('git',['status','--porcelain'],{cwd:checkout,encoding:'utf8'}).trim())throw new Error('FORBIDDEN_OP: Motion Suite checkout is dirty');
 const pageDir=resolve(work,'page'),outDir=resolve(work,'bundle');mkdirSync(pageDir,{recursive:true});
 writeFileSync(join(pageDir,'index.html'),'<html><body><script type="module" src="./main.ts"></script></body></html>');
 writeFileSync(join(pageDir,'main.ts'),pageSource(resolve(checkout)));
 const {build}=await import(pathToFileURL(resolve(checkout,'node_modules/vite/dist/node/index.js')).href);
 await build({plugins:[{name:'retain-product-golden-entry',enforce:'pre',transform(code:string,id:string){if(id===resolve(checkout,'tests/golden/page/main.ts'))return {code,map:null,moduleSideEffects:true};}}],root:pageDir,configFile:false,logLevel:'warn',base:'./',resolve:{alias:{'@':resolve(checkout,'src')}},css:{postcss:{plugins:[]}},build:{outDir,emptyOutDir:true,minify:false,sourcemap:false,target:'es2022',assetsInlineLimit:0}});
 return {outDir,sha,bundle_hash:bundleHash(outDir)};
}
export async function serveBundle(dir:string):Promise<{url:string;close:()=>Promise<void>}>{
 const root=resolve(dir),types:Record<string,string>={'.html':'text/html','.js':'text/javascript','.woff2':'font/woff2','.png':'image/png','.svg':'image/svg+xml'};
 const server:Server=createServer((req,res)=>{
  let path:string;try{path=resolve(root,'.'+decodeURIComponent((req.url||'/').split('?')[0]==='/'?'/index.html':(req.url||'/').split('?')[0]));}catch{res.writeHead(400).end();return;}
  if(!path.startsWith(root+sep)||!existsSync(path)||!statSync(path).isFile()){res.writeHead(404).end();return;}
  res.writeHead(200,{'content-type':types[extname(path)]||'application/octet-stream'}).end(readFileSync(path));
 });
 await new Promise<void>((yes,no)=>{server.once('error',no);server.listen(0,'127.0.0.1',yes);});
 return {url:`http://127.0.0.1:${(server.address() as AddressInfo).port}/index.html`,close:()=>new Promise((yes,no)=>server.close(e=>e?no(e):yes()))};
}
