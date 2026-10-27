import {chromium} from 'playwright';
import {mkdir} from 'node:fs/promises';
const base=process.argv[2];if(!base?.startsWith('https://'))throw new Error('Pass an HTTPS preview built with VITE_CAPTURE=1.');
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1600,height:900},deviceScaleFactor:1,reducedMotion:'reduce'}),errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 await page.goto(new URL('/?world=dubai',base).href,{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window.__capture&&window.__littleLondon,{timeout:180000});
 await mkdir('docs/media',{recursive:true});
 for(const [name,options] of [
  ['day',{night:false,zoom:.9,focus:[0,22,0]}],
  ['night',{night:true,zoom:.9,focus:[0,22,0]}],
  ['waterfront',{night:true,zoom:2.6,focus:[-40,5,60]}],
  ['explorer',{night:false,zoom:16,focus:[20,2,0],character:{x:20,z:0,yaw:Math.PI/3}}],
  ['marina',{night:false,zoom:5.5,focus:[-32,0,-13]}],
  ['museum-night',{night:true,zoom:6.8,focus:[52,10,62],offset:[160,90,277]}],
  ['burj-al-arab',{night:false,zoom:4.5,focus:[-78,22,25],offset:[250,110,160]}],
  ['skyline',{night:false,zoom:1.5,focus:[0,42,-56],offset:[170,110,250]}],
 ]){
  const stats=await page.evaluate(o=>window.__capture.render({...o,ui:'none'}),options);
  await page.screenshot({path:`docs/media/dubai-${name}.jpg`,type:'jpeg',quality:87});console.log(name,stats);
 }
 if(errors.length)throw new Error(errors.join('\n'));
}finally{await browser.close();}
