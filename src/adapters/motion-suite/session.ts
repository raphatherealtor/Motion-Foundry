import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
import type {Browser,Page} from 'playwright';
import {serveBundle} from './harness.js';
import {browserContext} from './environment.js';
import {pinnedBrowserVersion} from './browser.js';
import type {MotionSuiteBoxes} from './boxes-types.js';
import type {Rendered,Mode,HarnessOptions} from './environment.js';
export class RenderSession {
 private browser?:Browser;private server?:Awaited<ReturnType<typeof serveBundle>>;
 page!:Page;readonly errors:string[]=[];
 async open(opts:HarnessOptions,bundle:string,args:string[]){
  this.server=await serveBundle(bundle);
  try{
   const pw=await import(pathToFileURL(opts.playwrightModule||resolve(opts.checkout,'node_modules/playwright/index.mjs')).href);
   this.browser=await pw.chromium.launch({executablePath:opts.browserPath,args});
   if(this.browser!.version()!==pinnedBrowserVersion)throw new Error('TYPE_INVALID: Chromium153 pin required');
   this.page=await this.browser!.newPage(browserContext);
   this.page.on('pageerror',e=>this.errors.push(e.message));
   const origin=new URL(this.server.url).origin;
   await this.page.route('**/*',route=>new URL(route.request().url()).origin===origin?route.continue():route.abort());
   await this.page.goto(this.server.url);await this.page.evaluate(()=>(window as any).golden.ready);
   return this;
  }catch(e){await this.close();throw e;}
 }
 async render(project:unknown,frame:number,mode:Mode):Promise<Rendered>{
  const result=await this.page.evaluate(async({project,frame,mode})=>{await (window as any).foundryMS.prepare(project);return (window as any).golden.renderProject(project,frame,mode);},{project,frame,mode});
  if(this.errors.length)throw new Error('FORBIDDEN_OP: harness error '+this.errors.join('; '));return result;
 }
 async boxes(project:unknown,frame:number):Promise<MotionSuiteBoxes>{return this.page.evaluate(({project,frame})=>(window as any).foundryMS.boxes(project,frame),{project,frame});}
 version(){return this.browser!.version();}
 async close(){const browser=this.browser,server=this.server;this.browser=undefined;this.server=undefined;await browser?.close();await server?.close();}
}
