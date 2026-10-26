import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const url=process.argv[2];
if(!url?.startsWith('https://'))throw new Error('Pass the HTTPS URL of a VITE_CAPTURE=1 preview deployment.');
const output=resolve('docs/media'),frames=resolve('artifacts/reveal-frames');
await mkdir(output,{recursive:true});await mkdir(frames,{recursive:true});await mkdir('public/social',{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
const failures=[];page.on('pageerror',error=>failures.push(error.message));
await page.goto(url,{waitUntil:'domcontentloaded'});
await page.waitForFunction(()=>window.__capture&&window.__littleLondon,{timeout:120000});
await page.waitForFunction(()=>!document.querySelector('#loading'));
const render=async options=>{await page.evaluate(options=>window.__capture.render(options),options);};
const shots=[
  ['london-day.jpg',{night:false,zoom:.94,focus:[0,4,0],ui:'all'}],
  ['london-night.jpg',{night:true,zoom:.94,focus:[0,4,0],ui:'all'}],
  ['westminster.jpg',{night:false,zoom:3.5,focus:[-43,21,15]}],
  ['london-eye-night.jpg',{night:true,zoom:4.3,focus:[-55,24,-68]}],
  ['gherkin-night.jpg',{night:true,zoom:4.5,focus:[76,24,-34]}],
  ['explorer.jpg',{night:false,zoom:26,focus:[0,2.5,8],character:{x:0,z:8,yaw:.5}}],
];
for(const [filename,options]of shots){await render(options);await page.screenshot({path:resolve(output,filename),type:'jpeg',quality:84});console.log(filename);}
await page.setViewportSize({width:1200,height:630});
await render({night:false,zoom:24,focus:[-.9,2.3,8],character:{x:0,z:8,yaw:.5},ui:'brand'});
await page.screenshot({path:resolve('public/social/og-london.jpg'),type:'jpeg',quality:88});
for(const [name,size]of [['favicon-32.png',32],['favicon-192.png',192],['apple-touch-icon.png',180],['character-head.png',512]]) {
  const data=await page.evaluate(size=>window.__capture.head(size),size);await writeFile(resolve('public',name),Buffer.from(data.split(',')[1],'base64'));
}
if(process.argv.includes('--stills-only')){await browser.close();if(failures.length)throw new Error(failures.join('\n'));process.exit(0);}
await page.setViewportSize({width:960,height:540});
const fps=24,count=144;
for(let frame=0;frame<count;frame++) {
  const u=frame/count,angle=u*Math.PI*2,x=4*Math.sin(angle),z=8+.5*(1-Math.cos(angle));
  const reveal=Math.sin(Math.PI*u)**2,zoom=12-9.7*reveal;
  await render({night:false,time:20+frame/fps,zoom,focus:[x,2.2,z],character:{x,z,yaw:Math.atan2(4*Math.cos(angle),.5*Math.sin(angle)),running:true},ui:'none'});
  await page.screenshot({path:resolve(frames,`${String(frame).padStart(4,'0')}.jpg`),type:'jpeg',quality:90});
  if(frame%24===0)console.log(`Reveal ${frame}/${count}`);
}
await writeFile(resolve('artifacts/capture-report.json'),JSON.stringify({url,frames:count,fps,errors:failures},null,2));
await browser.close();if(failures.length)throw new Error(failures.join('\n'));
