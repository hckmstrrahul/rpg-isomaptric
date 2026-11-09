import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {cp,mkdir,mkdtemp,readFile,writeFile} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {tmpdir} from 'node:os';

// Prove the copyable folder works with no Vite, app source, node_modules or CDN.
const copied=await mkdtemp(resolve(tmpdir(),'smoked-glass-'));
await cp('styles/glass-ui',copied,{recursive:true});await mkdir('artifacts',{recursive:true});
const mime={'.html':'text/html','.css':'text/css','.js':'text/javascript','.jpg':'image/jpeg','.woff2':'font/woff2','.md':'text/plain'};
const server=createServer(async(req,res)=>{
 try{
  const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname),file=resolve(copied,`.${pathname==='/'?'/spec.html':pathname}`);
  if(!file.startsWith(copied+sep)){res.writeHead(403).end();return;}
  const data=await readFile(file);res.writeHead(200,{'Content-Type':mime[extname(file)]??'text/plain'});res.end(data);
 }catch{res.writeHead(404).end();}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base=`http://127.0.0.1:${server.address().port}`;
const browser=await chromium.launch({channel:'chrome',headless:true}),errors=[],report=[];
try{
 const context=await browser.newContext({viewport:{width:1440,height:1000},deviceScaleFactor:1});
 const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));
 page.on('request',req=>assert.ok(req.url().startsWith(base),'Portable kit must not request app files or remote dependencies'));
 await page.goto(`${base}/spec.html`);await page.evaluate(()=>document.fonts.ready);
 await page.waitForFunction(()=>document.querySelector('[data-token] code').textContent);
 assert.equal(await page.locator('[data-glass-theme="light"] .swatch[data-token="color"] code').innerText(),'#18261dc2');
 assert.equal(await page.locator('[data-glass-theme="dark"] .swatch[data-token="color"] code').innerText(),'#16232bc2');
 await page.screenshot({path:'artifacts/glass-spec-desktop.png',fullPage:true});
 await page.screenshot({path:'artifacts/glass-spec-overview.png'});
 await page.locator('#theme-toggle').click();assert.equal(await page.locator('#lab').getAttribute('data-glass-theme'),'dark');
 await page.waitForFunction(()=>!document.querySelector('#lab').hasAttribute('data-glass-changing'));
 await page.locator('#help-toggle').hover();await page.waitForSelector('.glass-tooltip:not([hidden])');
 assert.equal(await page.locator('.glass-tooltip').innerText(),'Close controls');assert.equal(await page.locator('.glass-tooltip').getAttribute('data-glass-theme'),'dark');
 await page.keyboard.press('Escape');assert.equal(await page.locator('.glass-tooltip').isVisible(),false);assert.equal(await page.locator('#lab-help').isVisible(),true);
 await page.locator('#help-toggle').click();assert.equal(await page.locator('#lab-help').isVisible(),false);assert.equal(await page.locator('#help-toggle').getAttribute('aria-expanded'),'false');
 await page.locator('#help-toggle').click();assert.equal(await page.locator('#lab-help').isVisible(),true);
 await page.keyboard.press('Tab');assert.equal(await page.locator('#scroll-demo').evaluate(e=>e===document.activeElement),true);
 await page.waitForFunction(()=>document.querySelector('#scroll-demo').dataset.glassMore==='true');
 await page.locator('#scroll-demo').evaluate(e=>{e.scrollTop=e.scrollHeight;});
 await page.waitForFunction(()=>document.querySelector('#scroll-demo').dataset.glassMore==='false');
 // Content changes and resizing should restore the overflow cue.
 await page.locator('#scroll-demo > div').evaluate(e=>{const row=document.createElement('p');row.textContent='Another control';row.style.height='150px';e.append(row);});
 await page.waitForFunction(()=>document.querySelector('#scroll-demo').dataset.glassMore==='true');
 await page.locator('#help-toggle').focus();await page.keyboard.press('Tab');await page.keyboard.press('Shift+Tab');
 await page.waitForSelector('.glass-tooltip:not([hidden])');assert.equal(await page.locator('#help-toggle').evaluate(e=>e.getAttribute('aria-describedby')),await page.locator('.glass-tooltip').getAttribute('id'));
 await page.keyboard.press('Escape');assert.equal(await page.locator('#help-toggle').getAttribute('aria-describedby'),null);
 // Semantics, actual minimum target sizes, and the shared 6px group spacing.
 const dimensions=await page.locator('.hero-rail').first().evaluate(e=>{
  const groups=[...e.children].map(n=>n.getBoundingClientRect()),buttons=[...e.querySelectorAll('button')].map(n=>n.getBoundingClientRect());
  return {gap:groups[1].top-groups[0].bottom,rail:groups[0].width,minTarget:Math.min(...buttons.flatMap(r=>[r.width,r.height]))};
 });
 assert.deepEqual(dimensions,{gap:6,rail:54,minTarget:44});
 await page.emulateMedia({reducedMotion:'reduce'});
 assert.equal(await page.locator('#theme-toggle').evaluate(e=>getComputedStyle(e).transitionDuration),'0s');
 await page.emulateMedia({forcedColors:'active'});
 assert.equal(await page.locator('.hero-panel').first().evaluate(e=>getComputedStyle(e).backdropFilter),'none');
 await page.emulateMedia({forcedColors:'none'});
 for(const width of [768,390,320]){
  await page.setViewportSize({width,height:900});
  await page.waitForFunction(w=>innerWidth===w,width);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Spec must fit narrow viewports');
  const targets=await page.locator('.hero-rail button').evaluateAll(nodes=>nodes.every(n=>n.getBoundingClientRect().width>=44&&n.getBoundingClientRect().height>=44));assert.ok(targets);
  await page.screenshot({path:`artifacts/glass-spec-${width}.png`,fullPage:true});
 }
 report.push({portable:true,dimensions,themes:true,tooltipPointerAndKeyboard:true,escape:true,scrollFade:true,reducedMotion:true,forcedColors:true,widths:[1440,768,390,320]});
 await context.close();
 // Exercise the same extracted tooltip behavior in the real app.
 const app=await browser.newPage({viewport:{width:1440,height:900},reducedMotion:'reduce'});app.on('pageerror',e=>errors.push(e.message));
 await app.goto('http://127.0.0.1:5186/?world=bengaluru');await app.waitForFunction(()=>window.__littleLondon&&!document.querySelector('#loading'),{timeout:120000});
 await app.locator('#theme-button').click();
 const themeState=await app.evaluate(()=>({game:document.documentElement.dataset.theme,glass:document.documentElement.dataset.glassTheme}));assert.equal(themeState.glass,themeState.game==='night'?'dark':'light');
 await app.locator('#help-button').click();assert.equal(await app.locator('#help-panel').isVisible(),true);
 await app.keyboard.press('Shift+Tab');await app.waitForSelector('.glass-tooltip:not([hidden])');
 await app.keyboard.press('Escape');assert.equal(await app.locator('.glass-tooltip').isVisible(),false);assert.equal(await app.locator('#help-panel').isVisible(),true);
 await app.keyboard.press('Escape');assert.equal(await app.locator('#help-panel').isVisible(),false);
 await app.close();report.push({appTheme:themeState,appTooltipAndHelp:true});
 for(const touch of [true,false]){
  const context=await browser.newContext({hasTouch:touch,isMobile:touch,reducedMotion:'reduce',viewport:{width:touch?390:1440,height:900}});
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:5186/?world=bengaluru');await page.waitForFunction(()=>window.__littleLondon&&!document.querySelector('#loading'),{timeout:120000});
  const sizes=touch?[[320,740],[390,844],[640,900],[641,900],[768,1024],[820,1180],[1024,768],[1194,834],[1366,1024],[844,390],[568,320]]:[[1100,800],[1280,900],[1440,900]];
  for(const [width,height] of sizes){
   await page.setViewportSize({width,height});await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
   const compact=width<=1100||touch&&width<=1366,mobile=width<=640;
   const layout=await page.evaluate(()=>{
    const rect=selector=>{const e=document.querySelector(selector),r=e.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom,visible:getComputedStyle(e).display!=='none'&&r.width>0&&r.height>0};};
    return {width:innerWidth,scroll:document.documentElement.scrollWidth,brand:rect('.brand'),title:rect('.brand h1'),subtitle:rect('.brand-meta'),tabs:rect('.world-switcher'),theme:rect('.view-actions'),tools:rect('#toolbelt'),arrows:rect('#touch-pad'),actions:rect('.touch-actions'),run:rect('#run-tool'),camera:rect('.camera-dock'),map:rect('.mini-map'),zoom:rect('.zoom-tools')};
   });
   assert.equal(layout.map.visible,!compact,`${width}: minimap visibility`);assert.equal(layout.zoom.visible,!compact,`${width}: zoom visibility`);
   assert.ok(layout.scroll<=width+1,`${width}: page overflow: ${JSON.stringify(layout)}`);
   for(const name of ['brand','tabs','theme','tools','arrows','actions','camera']){
    const r=layout[name];if(!r.visible)continue;
    assert.ok(r.x>=-1&&r.right<=width+1&&r.y>=-1&&r.bottom<=height+1,`${width}x${height}: ${name} outside viewport: ${JSON.stringify(r)}`);
   }
   if(compact){
    const cameraFits=await page.locator('.camera-dock').evaluate(e=>{const r=e.getBoundingClientRect();return [...e.querySelectorAll('.tools:not(.zoom-tools) button,.help-button')].every(b=>{const q=b.getBoundingClientRect();return q.top>=r.top&&q.bottom<=r.bottom&&q.left>=r.left&&q.right<=r.right;});});
    assert.ok(cameraFits,`${width}x${height}: camera buttons must remain visible`);
    assert.ok(Math.abs(layout.actions.y-layout.camera.bottom-6)<1,`${width}x${height}: 6px between camera toolbar and Run actions`);
    assert.ok(Math.abs(layout.camera.right-layout.run.right)<1,`${width}: camera controls align with Run on the right`);
    await page.locator('#help-button').click();
    const help=await page.locator('#help-panel').boundingBox();
    assert.ok(help.x>=0&&Math.abs(help.x+help.width-layout.run.right)<1,`${width}: Help opens on the right within the screen`);
    await page.locator('#help-button').click();
    assert.ok(Math.abs(layout.run.bottom-layout.arrows.bottom)<1,`${width}: Run bottom alignment`);
    if(mobile){assert.ok(layout.tools.y>=layout.arrows.bottom+10,`${width}: tools below arrows`);assert.ok(Math.abs(layout.subtitle.y-layout.title.bottom-8)<1,`${width}: title/subtitle gap`);}
    else{
     assert.ok(Math.abs(layout.tools.bottom-layout.arrows.bottom)<1,`${width}: tablet toolbar baseline`);
     const centers=[layout.brand,layout.tabs,layout.theme].map(r=>r.y+r.height/2);assert.ok(Math.max(...centers)-Math.min(...centers)<1,`${width}: tablet header row`);
     assert.ok(layout.brand.right<layout.tabs.x&&layout.tabs.right<layout.theme.x,`${width}: tablet header overlap`);
    }
    await page.locator('#bomb-tool').click();
    assert.equal(await page.locator('#use-tool').isVisible(),true);
    const active=await page.evaluate(()=>({run:document.querySelector('#run-tool').getBoundingClientRect().bottom,arrows:document.querySelector('#touch-pad').getBoundingClientRect().bottom,use:document.querySelector('#use-tool').getBoundingClientRect().bottom,runTop:document.querySelector('#run-tool').getBoundingClientRect().top}));
    assert.ok(Math.abs(active.run-active.arrows)<1,`${width}: Run stays aligned with Fire visible`);
    if(mobile&&height<=500)assert.ok(Math.abs(active.use-active.run)<1,`${width}: Fire and Run share the short landscape row`);
    else assert.ok(active.use<=active.runTop,`${width}: Fire above Run`);
    const activeGap=await page.evaluate(()=>document.querySelector('.touch-actions').getBoundingClientRect().top-document.querySelector('.camera-dock').getBoundingClientRect().bottom);
    assert.ok(Math.abs(activeGap-6)<1,`${width}: toolbar stays 6px above Fire/Plant actions`);
    await page.locator('#explore-tool').click();
   }
   await page.screenshot({path:`artifacts/responsive-${width}x${height}-${touch?'touch':'mouse'}.png`});
   report.push({viewport:[width,height],touch,compact,mobile,layout});
  }
  await context.close();
 }
 assert.deepEqual(errors,[]);
 await writeFile('artifacts/glass-ui-check.json',JSON.stringify({report,errors},null,2));console.log(JSON.stringify({portableKit:report[0],app:report[1],responsiveSizes:report.filter(r=>r.viewport).map(r=>({viewport:r.viewport,touch:r.touch})),errors},null,2));
}finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
