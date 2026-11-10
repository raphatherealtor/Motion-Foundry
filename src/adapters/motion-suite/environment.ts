export const MS_SHA='25cb5454d1f14f889d36c79dec3965a95f7b2c99';
export const goldenArgs=['--force-color-profile=srgb','--disable-gpu','--disable-gpu-compositing','--disable-accelerated-2d-canvas','--disable-lcd-text','--font-render-hinting=none','--disable-font-subpixel-positioning','--disable-skia-runtime-opts','--hide-scrollbars','--mute-audio','--disable-background-timer-throttling','--disable-renderer-backgrounding'];
export const foundryArgs=[...goldenArgs,'--num-raster-threads=1','--disable-features=PaintHolding'];
export const browserContext={viewport:{width:1280,height:720},deviceScaleFactor:1,locale:'en-US',timezoneId:'UTC',colorScheme:'light' as const,reducedMotion:'reduce' as const};
export interface HarnessOptions {checkout:string;browserPath:string;workDir:string;playwrightModule?:string}
export type Mode='preview'|'export'|'worker';
export interface Rendered {width:number;height:number;base64:string;alphaBelow255:number}
export interface PixelMetrics {pct_pixels_equal:number;max_channel_delta:number;psnr_db:number|null;diff_bbox:number[]|null}
