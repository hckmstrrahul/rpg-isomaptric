import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
const base=process.argv[2];
if(!base?.startsWith('https://'))throw new Error('Pass an HTTPS capture preview');
const folder='artifacts/refinement-details';await mkdir(folder,{recursive:true});
const details={
 london:[],dubai:[],
 bengaluru:[
  ['vidhana-front',{focus:[-45,7,-43],zoom:3.8,offset:[260,95,20]}],
  ['attara-roof',{focus:[15,4,-34],zoom:5,offset:[-260,90,15]}],
  ['fountain',{focus:[25,2,13],zoom:12,offset:[80,95,240]}],
  ['west-roads',{focus:[-64,2,-20],zoom:2.6,offset:[0,300,.01]}],
 ],
 agra:[
  ['taj-front',{focus:[0,10,-5],zoom:3.6,offset:[40,90,280]}],
  ['taj-rear',{focus:[0,10,-5],zoom:3.6,offset:[-180,100,-180]}],
  ['taj-side',{focus:[0,10,-5],zoom:3.6,offset:[260,85,30]}],
  ['housing',{focus:[-76,5,54],zoom:5,offset:[160,100,220]}],
 ],
 lisbon:[
  ['pena-front',{focus:[-89,28,-101],zoom:5,offset:[120,80,240]}],
  ['pena-night',{focus:[-89,28,-101],zoom:5,offset:[120,80,240],night:true}],
  ['pena-rear',{focus:[-89,28,-101],zoom:5,offset:[-160,95,-180]}],
  ['hill-road-top',{focus:[-91,13,-76],zoom:10,offset:[0,300,.01]}],
  ['hill-road-low',{focus:[-91,13,-76],zoom:10,offset:[0,90,280]}],
  ['bridge-north',{focus:[60,7,-94],zoom:4,offset:[0,300,.01]}],
  ['bridge-south',{focus:[72,9,91],zoom:4,offset:[0,300,.01]}],
  ['north-housing',{focus:[-12,10,-109],zoom:3,offset:[180,150,260]}],
  ['south-housing',{focus:[-10,12,106],zoom:3,offset:[180,150,260]}],
  ['fountain',{focus:[-50,2,-13],zoom:12,offset:[80,95,240]}],
  ['shipping',{focus:[0,1,28],zoom:2,offset:[180,140,240]}],
 ],
 moon:[
  ['gold-satellite',{focus:[-56,4,-53],zoom:8,offset:[140,100,200]}],
  ['minimap-ui',{focus:[0,3,0],zoom:1.05,ui:'all'}],
 ],
};
const browser=await chromium.launch({channel:'chrome',headless:true}),report=[];
try{for(const [world,frames] of Object.entries(details).filter(([id])=>!process.argv[3]||process.argv[3].split(',').includes(id))){
 const errors=[],page=await browser.newPage({viewport:{width:1600,height:1000},deviceScaleFactor:1,reducedMotion:'reduce'});
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.goto(`${base}/?world=${world}`);await page.waitForFunction(()=>window.__capture,{timeout:180000});
 const shots=[...frames,...[false,true].map(night=>[`background-low-${night?'night':'day'}`,{focus:[0,14,60],zoom:.62,offset:[0,18,320],night}])];
 const selectedShots=shots.filter(([name])=>!process.argv[4]||process.argv[4].split(',').includes(name));
 for(const [name,options]of selectedShots){
  const stats=await page.evaluate(o=>window.__capture.render({time:20,ui:'none',night:false,...o}),options);
  await page.screenshot({path:`${folder}/${world}-${name}.png`});report.push({world,name,...stats});
  if(world==='lisbon'&&name==='pena-front')await page.screenshot({path:'docs/media/lisbon-pena-palace.jpg',type:'jpeg',quality:86});
 }
 report.push({world,errors});await page.close();console.log(`${world}: ${selectedShots.length} details, ${errors.length} errors`);
}
await writeFile(`${folder}/render.json`,JSON.stringify(report,null,2));
if(report.some(r=>r.errors?.length))throw new Error('Browser errors; inspect render.json');
}finally{await browser.close();}
