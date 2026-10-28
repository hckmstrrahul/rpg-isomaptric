import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { createAppearance } from '../src/appearance.ts';

const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const script=html.match(/<script id="appearance-bootstrap">([\s\S]*?)<\/script>/)![1];
test('the first HTML paint uses the same saved or system theme as the fully loaded game',()=>{
  for(const saved of ['day','night','bad',null])for(const systemNight of [true,false]) {
    const element={dataset:{} as Record<string,string>,style:{} as Record<string,string>},meta={content:''},storage={getItem:()=>saved,setItem:()=>{}};
    runInNewContext(script,{window:{matchMedia:()=>({matches:systemNight})},localStorage:storage,document:{documentElement:element,querySelector:()=>meta}});
    const night=createAppearance(storage).isNight(systemNight);
    assert.equal(element.dataset.theme,night?'night':'day');assert.equal(element.style.colorScheme,night?'dark':'light');assert.equal(meta.content,night?'#171c22':'#a8c8bd');
  }
  assert.ok(html.indexOf('appearance-bootstrap')<html.indexOf('<body>'),'Theme must resolve before body paint or the game bundle');
  assert.match(html,/class="boot-loading"/);
});
test('blocked local storage still gives a dark loading screen when the operating system is dark',()=>{
  const element={dataset:{} as Record<string,string>,style:{}},storage={getItem:()=>{throw new Error('Blocked');}};
  runInNewContext(script,{window:{matchMedia:()=>({matches:true})},localStorage:storage,document:{documentElement:element,querySelector:()=>({})}});
  assert.equal(element.dataset.theme,'night');
});

const worldScript=html.match(/<script id="world-loading-bootstrap">([\s\S]*?)<\/script>/)![1];
test('Moon first paint uses its travel message for direct URLs and saved selection',()=>{
  for(const [search,saved,expected] of [
    ['?world=moon','london','To the moon...'],
    ['', 'moon','To the moon...'],
    ['?world=invalid','moon','To the moon...'],
    ['?world=agra','moon','A little world awaits'],
    ['',null,'A little world awaits'],
  ]){
    const title={textContent:'A little world awaits'};
    runInNewContext(worldScript,{URLSearchParams,location:{search},localStorage:{getItem:()=>saved},document:{querySelector:()=>title}});
    assert.equal(title.textContent,expected);
  }
  const title={textContent:'A little world awaits'};
  runInNewContext(worldScript,{URLSearchParams,location:{search:'?world=moon'},localStorage:{getItem:()=>{throw new Error('Blocked');}},document:{querySelector:()=>title}});
  assert.equal(title.textContent,'To the moon...');
  assert.ok(html.indexOf('world-loading-bootstrap')<html.indexOf('src="/src/main.ts"'));
});
