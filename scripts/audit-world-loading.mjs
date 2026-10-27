import {readFile,writeFile,mkdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const base=process.argv[2];
const manifest=process.env.WORLD_MANIFEST?JSON.parse(await readFile(process.env.WORLD_MANIFEST,'utf8')):base?await (await fetch(new URL('/.vite/manifest.json',base))).json():JSON.parse(await readFile('dist/.vite/manifest.json','utf8'));
const worlds=Object.keys(manifest).filter(k=>/^src\/worlds\/[^/]+\/plan\.ts$/.test(k)).map(k=>k.split('/')[2]);
assert.deepEqual([...worlds].sort(),['agra','bengaluru','dubai','lisbon','london','moon'],'All six chapter plans must exist in the build');
const graph=(key,seen=new Set())=>{if(seen.has(key))return seen;seen.add(key);for(const dep of manifest[key]?.imports??[])graph(dep,seen);return seen;};
const worldEntry=id=>id==='london'?'src/world.ts':`src/worlds/${id}/world.ts`;
const report={static:[],network:[]};
for(const id of worlds){
  const selected=new Set([...graph('index.html'),...graph(`src/worlds/${id}/plan.ts`),...graph(worldEntry(id))]);
  for(const other of worlds)if(other!==id){
    assert.ok(!selected.has(`src/worlds/${other}/plan.ts`),`${id} statically imports ${other} plan`);
    assert.ok(!selected.has(worldEntry(other)),`${id} statically imports ${other} geometry`);
  }
  if(id!=='london')assert.ok(!selected.has('src/importedAssets.ts'),`${id} includes London's optional asset loader`);
  report.static.push({world:id,isolated:true,chunks:selected.size});
}
const subset=process.argv[3]?.split(',')??worlds;
if(base){
  assert.ok(base.startsWith('https://'),'Use an HTTPS deployment');
  const browser=await chromium.launch({channel:'chrome',headless:true});
  try{
    for(const id of subset){
      const context=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'reduce'}),page=await context.newPage(),requests=[],errors=[];
      page.on('request',r=>requests.push(r.url()));page.on('pageerror',e=>errors.push(e.message));
      await page.goto(new URL(`/?world=${id}`,base).href);
      await page.waitForFunction(()=>window.__littleLondon&&!document.querySelector('#loading'),{timeout:180000});
      await page.waitForTimeout(1500);
      const requested=file=>requests.some(url=>new URL(url).pathname===`/${file}`);
      assert.ok(requested(manifest[`src/worlds/${id}/plan.ts`].file),`${id} plan was requested`);
      assert.ok(requested(manifest[worldEntry(id)].file),`${id} geometry was requested`);
      for(const other of worlds)if(other!==id)for(const key of [`src/worlds/${other}/plan.ts`,worldEntry(other)])assert.ok(!requested(manifest[key].file),`${id} fetched inactive ${other}: ${key}`);
      if(id!=='london')assert.ok(!requested(manifest['src/importedAssets.ts'].file));
      if(id!=='london')assert.ok(!requests.some(url=>url.includes('/assets/nvidia/')),`${id} fetched London-specific assets`);
      if(id!=='dubai')assert.ok(!requests.some(url=>url.includes('/assets/fonts/aref-ruqaa.ttf')),`${id} fetched Dubai lettering`);
      if(id==='moon')assert.ok(!requests.some(url=>url.includes('/assets/moon/')));
      if(process.env.PRODUCTION_CHECK==='1')assert.equal(await page.evaluate(()=>typeof window.__capture),'undefined','Production must omit the capture API');
      assert.deepEqual(errors,[]);
      report.network.push({world:id,isolated:true,state:await page.evaluate(()=>window.__littleLondon.getState()),requests:requests.map(url=>new URL(url).pathname)});
      await context.close();console.log(`${id}: selected plan/world only; no page errors`);
    }
  }finally{await browser.close();}
}
await mkdir('artifacts',{recursive:true});await writeFile(base?'artifacts/world-loading-audit.json':'artifacts/world-loading-static.json',JSON.stringify(report,null,2));
console.log(`${report.static.length} static import graphs passed; ${report.network.length} cold browser loads passed`);
