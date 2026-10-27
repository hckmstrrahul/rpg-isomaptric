import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
const base=process.argv[2],ids=(process.argv[3]??'agra,lisbon').split(','),label=process.argv[4]??'world-review';
if(!base?.startsWith('https://'))throw new Error('Pass HTTPS preview URL');
const specs={
 agra:{focus:[0,2,7],hero:[0,10,-5],zoom:3.6,offset:[40,90,280]},
 lisbon:{focus:[0,3,0],hero:[65,12,0],zoom:1.8,offset:[-200,120,220]},
 bengaluru:{focus:[0,3,0],hero:[-35,9,-45],zoom:3.5,offset:[170,130,220]},
 moon:{focus:[0,3,0],hero:[0,8,0],zoom:3,offset:[180,140,220]},
 london:{focus:[0,2,0],hero:[-44,12,16],zoom:4,offset:[180,120,240]},
 dubai:{focus:[0,22,0],hero:[52,10,62],zoom:7,offset:[160,90,277]},
};
const browser=await chromium.launch({channel:'chrome',headless:true}),report=[];await mkdir(`artifacts/${label}`,{recursive:true});
try{
 for(const id of ids){
  const page=await browser.newPage({viewport:{width:1600,height:1000},deviceScaleFactor:1,reducedMotion:'reduce'}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));await page.goto(`${base}/?world=${id}`);await page.waitForFunction(()=>window.__capture,{timeout:180000});
  const spec=specs[id];
  await page.screenshot({path:`artifacts/${label}/${id}-initial-ui.png`});
  for(const [name,options] of [
   ['overview-day',{focus:spec.focus,zoom:1.05,night:false}],
   ['overview-night',{focus:spec.focus,zoom:1.05,night:true}],
   ['topdown',{focus:[0,0,0],zoom:1.05,offset:[0,300,.01],night:false}],
   ['hero-day',{focus:spec.hero,zoom:spec.zoom,offset:spec.offset,night:false}],
   ['hero-night',{focus:spec.hero,zoom:spec.zoom,offset:spec.offset,night:true}],
  ]){
   const stats=await page.evaluate(o=>window.__capture.render({...o,time:20,ui:'none'}),options);report.push({world:id,view:name,...stats});await page.screenshot({path:`artifacts/${label}/${id}-${name}.png`});
  }
  report.push({world:id,errors});await page.close();console.log(`${id} captured`);
 }
 await writeFile(`artifacts/${label}/render.json`,JSON.stringify(report,null,2));
}finally{await browser.close();}
