import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const base=process.argv[2];if(!base?.startsWith('https://'))throw new Error('Pass an HTTPS deployment URL.');
const browser=await chromium.launch({channel:'chrome',headless:true}),report={checks:[],errors:[]};
const ready=p=>p.waitForFunction(()=>window.__littleLondon&&!document.querySelector('#loading'),{timeout:120000});
const state=p=>p.evaluate(()=>window.__littleLondon.getState());
try{
 const page=await browser.newPage({viewport:{width:1440,height:900},reducedMotion:'reduce'});page.on('pageerror',e=>report.errors.push(e.message));
 await page.goto(new URL('/?world=london',base).href);await ready(page);
 await page.locator('#theme-button').click();assert.equal((await state(page)).night,true);
 await page.locator('[data-world="dubai"]').click();await ready(page);assert.equal((await state(page)).world,'dubai');assert.equal((await state(page)).night,true);
 assert.equal(await page.locator('[data-world="dubai"]').getAttribute('aria-selected'),'true');
 const alignment=await page.evaluate(()=>{const brand=document.querySelector('.brand').getBoundingClientRect(),tabs=document.querySelector('.world-switcher').getBoundingClientRect();return {top:tabs.top,headerTop:brand.top,center:(tabs.left+tabs.right)/2,viewport:innerWidth};});
 assert.ok(Math.abs(alignment.top-alignment.headerTop)<1);assert.ok(Math.abs(alignment.center-alignment.viewport/2)<1);report.checks.push({name:'centred chapter pill aligned to header',...alignment});
 await page.locator('#scene').focus();await page.keyboard.press('KeyB');await page.keyboard.down('Space');await page.waitForTimeout(2500);await page.keyboard.up('Space');
 const bombed=await state(page);assert.ok(bombed.shots>1);report.checks.push({name:'Dubai bomb tool',shots:bombed.shots,cleared:bombed.cleared});
 await page.keyboard.press('KeyT');await page.waitForTimeout(150);
 // Rotate by walking a few steps on the promenade and plant on nearby open ground.
 for(const key of ['KeyD','KeyS','KeyA','KeyW','KeyD','KeyD','KeyS','KeyS']){
   if((await state(page)).planted>0)break;
   await page.keyboard.down(key);await page.waitForTimeout(260);await page.keyboard.up(key);await page.keyboard.press('KeyT');await page.waitForTimeout(120);
 }
 const planted=await state(page);assert.ok(planted.planted>0,'Planting succeeds on Dubai open ground');report.checks.push({name:'Dubai planting',planted:planted.planted});
 await page.locator('[data-world="dubai"]').focus();await page.keyboard.press('ArrowLeft');assert.equal(await page.locator('[data-world="london"]').evaluate(e=>e===document.activeElement),true);await page.keyboard.press('Space');await ready(page);
 assert.equal((await state(page)).world,'london');assert.equal((await state(page)).night,true);assert.equal((await state(page)).tool,'explore');
 assert.equal(await page.evaluate(()=>localStorage.getItem('rpg-isomaptric-world')),'london');
 report.checks.push({name:'keyboard chapter navigation preserves night and resets sandbox'});
 assert.deepEqual(report.errors,[]);
 await mkdir('artifacts',{recursive:true});await writeFile('artifacts/world-switching.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
}finally{await browser.close();}
