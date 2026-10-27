import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
const base=process.argv[2],label=process.argv[3]??'world-details';
if(!base?.startsWith('https://'))throw new Error('Pass HTTPS capture preview');
const shots={
 agra:[['taj-side',{focus:[0,10,-5],zoom:3.6,offset:[260,85,30]}],['taj-rear',{focus:[0,10,-5],zoom:3.6,offset:[-180,100,-180]}]],
 bengaluru:[['vidhana-front',{focus:[-45,7,-43],zoom:4.5,offset:[260,100,20]}],['attara-front',{focus:[15,4,-34],zoom:5,offset:[-260,90,15]}]],
 lisbon:[['maat-waterfront',{focus:[2,3,-22],zoom:10,offset:[30,65,260]}],['maat-above',{focus:[2,3,-22],zoom:9,offset:[50,250,50]}],['belem-south',{focus:[-80,5,-3],zoom:7,offset:[120,70,260]}],['jeronimos',{focus:[-45,5,-34],zoom:5,offset:[30,80,260]}],['tejo-rear',{focus:[-14,9,-18],zoom:8,offset:[-180,80,-220]}],['tejo-side',{focus:[-14,9,-18],zoom:8,offset:[260,70,30]}]],
 moon:[['crater-low',{focus:[-74,-1,-72],zoom:5,offset:[160,70,200]}],['habitat-low',{focus:[0,10,0],zoom:5,offset:[120,65,240]}],['habitat-rear',{focus:[0,10,0],zoom:4,offset:[-200,100,-220]}]],
};
const browser=await chromium.launch({channel:'chrome',headless:true}),report=[];await mkdir(`artifacts/${label}`,{recursive:true});
try{for(const [world,frames]of Object.entries(shots)){
 const page=await browser.newPage({viewport:{width:1600,height:1000},deviceScaleFactor:1,reducedMotion:'reduce'});await page.goto(`${base}/?world=${world}`);await page.waitForFunction(()=>window.__capture,{timeout:180000});
 for(const [name,options]of frames){const stats=await page.evaluate(o=>window.__capture.render({...o,time:20,ui:'none',night:false}),options);report.push({world,name,...stats});await page.screenshot({path:`artifacts/${label}/${world}-${name}.png`});}
 await page.close();console.log(`${world} detail views captured`);
}await writeFile(`artifacts/${label}/render.json`,JSON.stringify(report,null,2));}finally{await browser.close();}
