import type {Page,CDPSession} from 'playwright';
import {writeFileSync} from 'node:fs';
const sessions=new WeakMap<Page,CDPSession>();
/** Set the view/surface mapping once; screenshots never request a clip or scale. */
export async function prepareCapture(page:Page,viewport:{width:number;height:number},deviceScaleFactor:number){
 const session=await page.context().newCDPSession(page);
 const {windowId}=await session.send('Browser.getWindowForTarget');
 await session.send('Browser.setWindowBounds',{windowId,bounds:{width:Math.round(viewport.width*deviceScaleFactor),height:Math.round(viewport.height*deviceScaleFactor)}});
 await session.send('Emulation.setDeviceMetricsOverride',{width:viewport.width,height:viewport.height,screenWidth:viewport.width,screenHeight:viewport.height,deviceScaleFactor,mobile:false,scale:deviceScaleFactor});
 sessions.set(page,session);
}
export async function capturePng(page:Page,path?:string):Promise<Buffer>{
 const session=sessions.get(page);if(!session)throw new Error('CAPTURE_NOT_PREPARED');
 const result=await session.send('Page.captureScreenshot',{format:'png',fromSurface:true,captureBeyondViewport:false});
 const png=Buffer.from(result.data,'base64');if(path)writeFileSync(path,png);return png;
}
