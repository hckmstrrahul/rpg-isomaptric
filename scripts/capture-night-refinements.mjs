import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
const base=process.argv[2],label=process.argv[3]??'night-refinement',folder=`artifacts/${label}`;
if(!base?.startsWith('https://'))throw new Error('Pass an HTTPS capture preview');
const frames={
 london:[['river',{focus:[2,1,-10],zoom:4,offset:[180,130,220]}],['launch-lights',{focus:[3.94,-.4,-90.98],zoom:18,offset:[180,100,220]}]],
 dubai:[['marina',{focus:[-32,2,-7],zoom:6,offset:[180,130,220]}],['yacht-lights',{focus:[-12.72,-.4,-1.66],zoom:18,offset:[180,100,220]}]],
 bengaluru:[['street',{focus:[-38,3,4],zoom:4,offset:[180,130,220]}]],
 agra:[['taj',{focus:[0,10,-5],zoom:3.6,offset:[40,90,280]}],['street',{focus:[-63,3,51],zoom:4,offset:[180,130,220]}],['boat-lantern',{focus:[-67.49,-.9,-54.72],zoom:24,offset:[180,100,220]}]],
 lisbon:[['hill-road',{focus:[-91,7,-76],zoom:7,offset:[0,90,280]}],['hill-top',{focus:[-91,10,-89],zoom:4.6,offset:[0,300,.01]}],['stair-foot',{focus:[-58.5,7,-81.62],zoom:16,offset:[120,90,160]}],['neighborhood',{focus:[-12,9,-106],zoom:3.2,offset:[180,150,260]}],['white-church',{focus:[-111,9,-57],zoom:8,offset:[140,90,260]}],['shipping',{focus:[0,1,28],zoom:2,offset:[180,140,240]}],['yacht-lights',{focus:[-45.74,-.1,20.14],zoom:18,offset:[180,100,220]}]],
 moon:[['guidance',{focus:[0,3,17],zoom:3,offset:[180,140,220]}]],
};
await mkdir(folder,{recursive:true});const browser=await chromium.launch({channel:'chrome',headless:true}),report=[];
try{for(const [world,shots]of Object.entries(frames).filter(([id])=>!process.argv[4]||process.argv[4].split(',').includes(id))){
 const page=await browser.newPage({viewport:{width:1600,height:1000},deviceScaleFactor:1,reducedMotion:'reduce'}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));await page.goto(`${base}/?world=${world}`);await page.waitForFunction(()=>window.__capture,{timeout:180000});
 const selected=shots.filter(([name])=>!process.argv[5]||process.argv[5].split(',').includes(name));
 for(const [name,options]of selected)for(const night of [false,true]){
  const stats=await page.evaluate(o=>window.__capture.render(o),{time:20,ui:'none',...options,night});
  await page.screenshot({path:`${folder}/${world}-${name}-${night?'night':'day'}.png`});report.push({world,name,night,...stats});
 }
 report.push({world,errors});await page.close();console.log(`${world}: ${selected.length*2} frames; ${errors.length} errors`);
}await writeFile(`${folder}/render.json`,JSON.stringify(report,null,2));if(report.some(r=>r.errors?.length))throw new Error('Browser errors');}finally{await browser.close();}
