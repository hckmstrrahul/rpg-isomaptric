import {chromium} from 'playwright';
import {writeFile,mkdir} from 'node:fs/promises';
const base=process.argv[2],ids=(process.argv[3]??'london,dubai,bengaluru,agra,hyderabad,lisbon,moon').split(',');
if(!base?.startsWith('https://'))throw new Error('Pass HTTPS deployment');
const browser=await chromium.launch({channel:'chrome',headless:true}),report=[];
await mkdir('artifacts',{recursive:true});
try{
 for(const id of ids){
  const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1,colorScheme:'light'}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));await page.goto(`${base}/?world=${id}`);await page.waitForFunction(()=>window.__littleLondon&&!document.querySelector('#loading'),{timeout:180000});
  await page.locator('#overview').click();await page.waitForTimeout(1500);
  for(const night of [false,true]){
   if((await page.evaluate(()=>window.__littleLondon.getState().night))!==night)await page.locator('#theme-button').click();
   await page.waitForTimeout(2000);
   const sample=await page.evaluate(async()=>{
    const deltas=[],start=performance.now();let last=start;
    await new Promise(resolve=>{const frame=now=>{deltas.push(now-last);last=now;if(now-start<6000)requestAnimationFrame(frame);else resolve();};requestAnimationFrame(frame);});
    const sorted=deltas.slice(2).sort((a,b)=>a-b),state=window.__littleLondon.getState(),gl=document.querySelector('#scene').getContext('webgl2'),ext=gl.getExtension('WEBGL_debug_renderer_info');
    return {frames:sorted.length,fps:1000*sorted.length/sorted.reduce((a,b)=>a+b,0),medianMs:sorted[Math.floor(sorted.length*.5)],p95Ms:sorted[Math.floor(sorted.length*.95)],renderer:ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER),drawCalls:state.drawCalls,triangles:state.triangles,world:state.world,zoom:state.zoom};
   });
   report.push({world:id,night,...sample,errors});console.log(`${id} ${night?'night':'day'}: ${sample.fps.toFixed(1)}fps, p95 ${sample.p95Ms.toFixed(1)}ms, ${sample.drawCalls}calls`);
   await writeFile('artifacts/world-frame-profile.json',JSON.stringify({viewport:[1440,900],dpr:1,secondsPerSample:6,report},null,2));
  }
  await page.close();
 }
}finally{await browser.close();}
