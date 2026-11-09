import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';

const base=process.argv[2]??'http://127.0.0.1:5186';
const record=process.argv.includes('--record');
const built=process.argv.includes('--build');
const manifest=built?JSON.parse(await readFile('dist/.vite/manifest.json','utf8')):null;
const mainPattern=built?`**/${manifest['index.html'].file}`:'**/src/main.ts*';
const worldPattern=built?`**/${manifest['src/worlds/bengaluru/world.ts'].file}`:'**/src/worlds/bengaluru/world.ts*';
// Fonts.ready waits on the app bundle we deliberately pause below. Use the
// installed Playwright capture option while retaining its mobile viewport handling.
process.env.PW_TEST_SCREENSHOT_NO_FONTS_READY='1';
await mkdir('artifacts/loading',{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
const report=[],errors=[];
const snapshotLoader=()=>{
 const loader=document.querySelector('#loading,.boot-loading'),title=loader.querySelector('h2'),spinner=loader.querySelector('.spinner');
 const rect=e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height};};
 const css=getComputedStyle(loader),text=getComputedStyle(title);
 const circle=spinner?.getBoundingClientRect();
 return {surface:rect(loader),title:rect(title),spinner:spinner?{x:Math.round(circle.x+circle.width/2),y:Math.round(circle.y+circle.height/2),width:spinner.offsetWidth,height:spinner.offsetHeight}:null,opacity:css.opacity,background:css.backgroundColor,font:text.fontFamily,size:text.fontSize,weight:text.fontWeight,lineHeight:text.lineHeight,text:title.innerText};
};
const snapshot=page=>page.evaluate(snapshotLoader);
const ready=page=>page.waitForFunction(()=>window.__littleLondon&&!document.querySelector('#loading'),{timeout:120000});
const observeReveal=page=>page.evaluate(()=>{
 window.__loadingFrames=[];
 const sample=()=>{
  const loader=document.querySelector('#loading');if(!loader)return;
  window.__loadingFrames.push({opacity:Number(getComputedStyle(loader).opacity),draws:window.__littleLondon?.getState().drawCalls??0,inert:document.querySelector('#app').inert});
  requestAnimationFrame(sample);
 };requestAnimationFrame(sample);
});
const checkReveal=async page=>{
 const frames=await page.evaluate(()=>window.__loadingFrames),fading=frames.filter(f=>f.opacity<1);
 assert.ok(fading.length,'The reveal includes intermediate opacity frames');
 assert.ok(fading.every(f=>f.draws>0&&f.inert),'Render the scene before fading; keep controls inert until the fade finishes');
 assert.equal(await page.locator('#app').getAttribute('aria-busy'),'false');
 assert.equal(await page.locator('#app').evaluate(e=>e.inert),false);
 return {frames:frames.length,fadeFrames:fading.length,renderedBeforeReveal:true};
};
try{
 for(const night of [false,true]){
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'no-preference',colorScheme:night?'dark':'light'});
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  const cdp=await context.newCDPSession(page);await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
  let releaseMain,releaseWorld;
  let mainGate=new Promise(r=>releaseMain=r);const worldGate=new Promise(r=>releaseWorld=r);
  await page.route(mainPattern,async route=>{await mainGate;await route.continue();});
  await page.route(worldPattern,async route=>{await worldGate;await route.continue();});
  await page.goto(`${base}/?world=bengaluru`,{waitUntil:'commit'});
  await page.locator('.boot-loading').waitFor({state:'visible'});
  const boot=await snapshot(page);
  await page.evaluate(()=>window.__bootLoader=document.querySelector('.boot-loading'));
  // Capture first paint without waiting for fonts or the deliberately gated bundle.
  await page.screenshot({path:`artifacts/loading/${record?'before':'after'}-${night?'night':'day'}-boot.png`});
  releaseMain();await page.locator('#scene').waitFor({state:'attached'});
  await page.waitForFunction(()=>document.querySelector('#loading .spinner'));
  const runtime=await snapshot(page),sameNode=await page.evaluate(()=>window.__bootLoader===document.querySelector('#loading'));
  await page.screenshot({path:`artifacts/loading/${record?'before':'after'}-${night?'night':'day'}-runtime.png`});
  report.push({night,boot,runtime,sameNode});
  if(!record)await observeReveal(page);
  releaseWorld();
  await ready(page);
  if(!record){
   assert.deepEqual(runtime,boot,'Loader must not change layout, font or background when the app bundle arrives');assert.equal(sameNode,true,'Keep the original loader until the world is rendered');
   report.push({night,initialReveal:await checkReveal(page)});
   // Capture departure synchronously before unload. An evaluation against an
   // outgoing document can wait indefinitely once Chrome swaps renderer contexts.
   await page.evaluate(`window.__readLoadingSnapshot=${snapshotLoader.toString()};addEventListener('beforeunload',()=>sessionStorage.setItem('loading-departure',JSON.stringify(window.__readLoadingSnapshot())),{once:true});`);
   mainGate=new Promise(r=>releaseMain=r);
   // A second synchronous activation cannot replace the chosen destination.
   await page.locator('[data-world="moon"]').evaluate(tab=>tab.addEventListener('click',()=>document.querySelector('[data-world="lisbon"]').click(),{once:true}));
   await page.locator('[data-world="moon"]').click({noWaitAfter:true});
   await page.waitForURL('**/?world=moon',{waitUntil:'commit'});
   await page.locator('.boot-loading').waitFor({state:'visible'});
   const departing=await page.evaluate(()=>JSON.parse(sessionStorage.getItem('loading-departure')));
   assert.equal(departing.text,'To the moon...');assert.equal(departing.opacity,'1','Departure must cover GPU teardown');
   const arriving=await snapshot(page);assert.deepEqual(arriving,departing,'No visual change across document navigation');
   await observeReveal(page);releaseMain();await ready(page);
   assert.equal(await page.evaluate(()=>window.__littleLondon.getState().world),'moon');
   report.push({night,navigation:'bengaluru → moon',matchingDocumentHandoff:true,reveal:await checkReveal(page)});
   await page.goBack({waitUntil:'commit'});await ready(page);
   assert.equal(await page.evaluate(()=>window.__littleLondon.getState().world),'bengaluru');
  }
  await context.close();
 }
 if(!record){
  const page=await browser.newPage({viewport:{width:1440,height:900},reducedMotion:'reduce'});page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{
   window.__loadingAnimations=[];const animate=Element.prototype.animate;
   Element.prototype.animate=function(...args){if(this.id==='loading')window.__loadingAnimations.push(args);return animate.apply(this,args);};
  });
  await page.goto(`${base}/?world=agra`);await ready(page);
  assert.equal(await page.evaluate(()=>window.__loadingAnimations.length),0);
  await page.locator('[data-world="lisbon"]').click();await page.waitForURL('**/?world=lisbon');await ready(page);
  assert.equal(await page.evaluate(()=>window.__loadingAnimations.length),0);
  assert.equal(await page.evaluate(()=>window.__littleLondon.getState().world),'lisbon');
  for(const world of ['london','dubai']){
   await page.locator(`[data-world="${world}"]`).click();await page.waitForURL(`**/?world=${world}`);await ready(page);
   assert.equal(await page.evaluate(()=>window.__littleLondon.getState().world),world);
  }
  report.push({reducedMotion:true,navigation:'agra → lisbon → london → dubai',opacityAnimations:0});await page.close();
  const retry=await browser.newPage({reducedMotion:'reduce'});
  await retry.route(worldPattern,route=>route.abort());
  await retry.goto(`${base}/?world=bengaluru`);await retry.locator('#retry').waitFor({state:'visible'});
  assert.equal(await retry.locator('#loading').getAttribute('role'),'alert');
  assert.equal(await retry.locator('#retry').evaluate(e=>e===document.activeElement),true);
  await retry.unroute(worldPattern);await retry.locator('#retry').click();await ready(retry);
  report.push({loadError:true,retryRecovered:true});await retry.close();
 }
 assert.deepEqual(errors,[]);
 await writeFile(`artifacts/loading/${record?'before':built?'built':'after'}.json`,JSON.stringify({report,errors},null,2));
 console.log(JSON.stringify({report,errors},null,2));
}finally{await browser.close();}
