import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
const base=new URL(process.argv[2]??'http://127.0.0.1:5194');
if(base.protocol!=='https:'&&!['127.0.0.1','localhost'].includes(base.hostname))throw new Error('Use HTTPS or a localhost capture preview.');
const frames=[
 ['bengaluru',{focus:[-12,4,-12],zoom:4.3,night:false}],
 ['dubai',{focus:[-8,9,-8],zoom:2.4,night:false}],
 ['london',{focus:[-24,9,-15],zoom:2.3,night:true}],
 ['agra',{focus:[0,6,0],zoom:2.8,night:false}],
 ['lisbon',{focus:[-34,6,-18],zoom:2.8,night:false}],
 ['moon',{focus:[0,7,0],zoom:3.1,night:true}],
];
await mkdir('docs/media',{recursive:true});await mkdir('styles/glass-ui/assets',{recursive:true});await mkdir('artifacts',{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true}),report=[];
try{
 for(const [world,options] of frames.filter(([id])=>!process.argv[3]||process.argv[3].split(',').includes(id))){
  const context=await browser.newContext({viewport:{width:1440,height:960},deviceScaleFactor:1,reducedMotion:'reduce',colorScheme:'light'}),page=await context.newPage();
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto(new URL(`/?world=${world}`,base).href);
  await page.waitForFunction(()=>window.__capture&&!document.querySelector('#loading'),{timeout:180000});
  await page.evaluate(()=>document.fonts.ready);
  const render=async settings=>{
   await page.evaluate(o=>window.__capture.render(o),settings);
   await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
   return page.evaluate(o=>window.__capture.render(o),settings);
  };
  const settings={...options,offset:[215,185,235],time:20,ui:'all'};
  const stats=await render(settings);
  await page.screenshot({path:`docs/media/${world}-ui.jpg`,type:'jpeg',quality:88});
  if(world==='bengaluru'){
   await page.setViewportSize({width:1440,height:960});
   for(const night of [false,true]){
    await render({...settings,night,ui:'none'});
    await page.screenshot({path:`styles/glass-ui/assets/${night?'night':'day'}.jpg`,type:'jpeg',quality:84});
   }
  }
  report.push({world,...settings,...stats,errors});
  if(errors.length)throw new Error(`${world}: ${errors.join('; ')}`);
  await context.close();console.log(`${world}: screenshot saved`);
 }
 await writeFile('artifacts/readme-capture.json',JSON.stringify(report,null,2));
}finally{await browser.close();}
