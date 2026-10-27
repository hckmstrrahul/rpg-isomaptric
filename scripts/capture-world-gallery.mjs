import {chromium} from 'playwright';
import {mkdir} from 'node:fs/promises';

const base=process.argv[2];
if(!base?.startsWith('https://'))throw new Error('Pass an HTTPS preview built with VITE_CAPTURE=1');
const chapters=[
  ['bengaluru',[0,3,0],1.05,{focus:[-45,7,-43],zoom:4,offset:[260,100,20]}],
  ['agra',[0,2,7],1.05,{focus:[0,10,-5],zoom:3.5,offset:[100,100,260]}],
  ['lisbon',[0,3,0],.95,{focus:[-30,5,-25],zoom:2.5,offset:[80,100,260]}],
  ['moon',[0,3,0],1.05,{focus:[0,10,0],zoom:3.5,offset:[120,110,240]}],
];
await mkdir('docs/media',{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
  for(const [id,focus,zoom,detail] of chapters.filter(([id])=>!process.argv[3]||process.argv[3].split(',').includes(id))){
    const page=await browser.newPage({viewport:{width:1600,height:900},deviceScaleFactor:1,reducedMotion:'reduce'});
    const errors=[];page.on('pageerror',error=>errors.push(error.message));
    await page.goto(`${base}/?world=${id}`);
    await page.waitForFunction(()=>window.__capture,{timeout:180000});
    for(const night of [false,true]){
      await page.evaluate(options=>window.__capture.render(options),{focus,zoom,offset:[215,185,235],...(night?detail:{}),night,time:20,ui:'none'});
      await page.screenshot({path:`docs/media/${id}-${night?'night':'day'}.jpg`,type:'jpeg',quality:86});
    }
    if(errors.length)throw new Error(`${id}: ${errors.join('; ')}`);
    await page.close();console.log(`${id}: day and night gallery captured`);
  }
}finally{await browser.close();}
