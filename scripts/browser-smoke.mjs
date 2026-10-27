import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
const url=process.argv[2];
if(!url?.startsWith('https://'))throw new Error('Pass the public HTTPS deployment URL.');
const production=process.argv.includes('--production');
await mkdir('artifacts',{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
const report={url,production,checks:[],errors:[]};
const ready=async p=>{await p.waitForFunction(()=>window.__littleLondon,{timeout:120000});await p.waitForFunction(()=>!document.querySelector('#loading'),{timeout:120000});};
const state=p=>p.evaluate(()=>window.__littleLondon.getState());
try {
  for(const [saved,system] of [['night','light'],['day','dark']]) {
    const context=await browser.newContext({viewport:{width:1440,height:900},deviceScaleFactor:1,colorScheme:system,reducedMotion:'reduce'});
    await context.addInitScript(value=>localStorage.setItem('little-london-appearance',value),saved);
    const page=await context.newPage();page.on('pageerror',error=>report.errors.push(error.message));
    let release;const gate=new Promise(resolve=>release=resolve);
    await page.route('**/assets/index-*.js',async route=>{await gate;await route.continue();});
    await page.goto(url,{waitUntil:'commit'});await page.waitForSelector('.boot-loading');
    const boot=await page.evaluate(()=>({theme:document.documentElement.dataset.theme,color:getComputedStyle(document.documentElement).backgroundColor,scheme:document.documentElement.style.colorScheme}));
    assert.equal(boot.theme,saved);assert.equal(boot.scheme,saved==='night'?'dark':'light');
    report.checks.push({name:`${saved} first paint overrides ${system} system`,...boot});release();await ready(page);
    assert.equal((await state(page)).night,saved==='night');
    assert.equal(await page.locator('#explore-tool').getAttribute('aria-pressed'),'true');
    assert.match(await page.locator('#bomb-tool').innerText(),/Bomb objects/);
    assert.equal(await page.locator('.brand a').last().getAttribute('href'),'https://github.com/hckmstrrahul/rpg-isomaptric');
    if(production)assert.equal(await page.evaluate(()=>typeof window.__capture),'undefined');
    if(saved==='day') {
      const initial=await state(page);await page.locator('#scene').focus();await page.keyboard.down('KeyD');await page.waitForTimeout(450);await page.keyboard.up('KeyD');const moved=await state(page);
      assert.ok(Math.hypot(moved.position.x-initial.position.x,moved.position.z-initial.position.z)>.2);report.checks.push({name:'keyboard movement',from:initial.position,to:moved.position});
      assert.deepEqual(await page.locator('#toolbelt .equipment').evaluateAll(nodes=>nodes.map(node=>node.id)),['explore-tool','bomb-tool','tree-tool']);
      assert.equal(await page.locator('#teleport-button,#teleport-panel').count(),0);
      await page.keyboard.press('KeyM');assert.equal((await state(page)).tool,'explore');
      assert.equal(await page.locator('.brand-links').evaluate(node=>getComputedStyle(node).marginTop),'12px');
      report.checks.push({name:'three tools; Explore replaces Teleport; header link gap is 12px'});
      await page.locator('#birdview').click();await page.waitForTimeout(250);assert.equal(await page.locator('#birdview').getAttribute('aria-pressed'),'true');report.checks.push({name:'Birdview',zoom:(await state(page)).zoom});
      await page.locator('#theme-button').click();assert.equal((await state(page)).night,true);assert.equal(await page.evaluate(()=>localStorage.getItem('little-london-appearance')),'night');report.checks.push({name:'theme toggle persists'});
      await page.screenshot({path:'artifacts/browser-desktop.png'});
    }
    await context.close();
  }
  // Full-motion Explore travel: pick visible clear ground through the ordinary UI.
  const desktop=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1,colorScheme:'light'});
  desktop.on('pageerror',error=>report.errors.push(error.message));await desktop.goto(url);await ready(desktop);await desktop.waitForFunction(()=>Math.abs(window.__littleLondon.getState().zoom-6)<.01,{timeout:20000});
  const initialZoom=(await state(desktop)).zoom;assert.ok(Math.abs(initialZoom-6)<.1);
  let flightStart;
  const candidates=[[790,470],[700,490],[650,450],[800,400],[720,540],[580,450],[900,450],...Array.from({length:7},(_,row)=>Array.from({length:9},(_,col)=>[400+col*80,220+row*60])).flat()];
  for(const [x,y]of candidates) {
    // Click candidate ground through Explore itself; blocked picks remain harmless.
    await desktop.locator('#scene').focus();
    await desktop.mouse.click(x,y);await desktop.waitForTimeout(50);const value=await state(desktop);if(value.flying){flightStart=value;break;}
  }
  assert.ok(flightStart,'A visible ground click should start Explore flight');
  const samples=[];for(let i=0;i<14;i++){samples.push(await state(desktop));await desktop.waitForTimeout(100);}
  await desktop.waitForFunction(()=>!window.__littleLondon.getState().flying,{timeout:10000});const landed=await state(desktop);
  assert.ok(samples.some(s=>s.zoom<initialZoom-.01));assert.ok(Math.abs(landed.zoom-initialZoom)<.01);assert.ok(Number.isFinite(landed.position.y));
  report.checks.push({name:'Explore flight and zoom return',initialZoom,minZoom:Math.min(...samples.map(s=>s.zoom)),landedZoom:landed.zoom});await desktop.close();
  for(const viewport of [{width:390,height:844},{width:820,height:1180},{width:320,height:740}]) {
    const context=await browser.newContext({viewport,deviceScaleFactor:1,hasTouch:true,isMobile:true,reducedMotion:'reduce'});const p=await context.newPage();p.on('pageerror',error=>report.errors.push(error.message));await p.goto(url);await ready(p);
    assert.ok(await p.locator('#touch-pad').isVisible());assert.ok(await p.locator('#run-tool').isVisible());assert.ok(!(await p.locator('.controls').isVisible()));
    const layout=await p.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,controls:[...document.querySelectorAll('#toolbelt,.mini-map,.touch-pad,.touch-actions,.brand,.world-switcher')].map(e=>{const r=e.getBoundingClientRect();return {name:e.className,left:r.left,right:r.right,top:r.top,bottom:r.bottom};})}));
    assert.ok(layout.scroll<=layout.width+1);for(const box of layout.controls){assert.ok(box.left>=-1&&box.right<=viewport.width+1,`${box.name} stays in viewport`);assert.ok(box.bottom<=viewport.height+1);}
    assert.equal((await state(p)).zoom,8);await p.screenshot({path:`artifacts/browser-${viewport.width}.png`});report.checks.push({name:`${viewport.width}px touch layout`,...layout});await context.close();
  }
  assert.deepEqual(report.errors,[]);
  await writeFile('artifacts/browser-smoke.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
} finally {await browser.close();}
