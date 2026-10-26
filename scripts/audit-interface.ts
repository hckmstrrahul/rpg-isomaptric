import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {hud} from '../src/hud.ts';

// Source-token checks, not a substitute for computed browser styles or a screen reader.
const css=readFileSync(new URL('../src/style.css',import.meta.url),'utf8');
const blocks=[css.match(/:root \{([\s\S]*?)\n\}/)![1],css.match(/:root\[data-theme=night\] \{([\s\S]*?)\n\}/)![1]];
function luminance(hex:string){
 const c=hex.match(/[a-f\d]{2}/gi)!.map(x=>parseInt(x,16)/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4);
 return c[0]*.2126+c[1]*.7152+c[2]*.0722;
}
function contrast(a:string,b:string){const [x,y]=[luminance(a),luminance(b)].sort((x,y)=>y-x);return (x+.05)/(y+.05);}
function composite(glass:string,background:number){
 const alpha=parseInt(glass.slice(7,9)||'ff',16)/255;
 return '#'+glass.slice(1,7).match(/../g)!.map(channel=>Math.round(parseInt(channel,16)*alpha+background*(1-alpha)).toString(16).padStart(2,'0')).join('');
}
const pairs:[string,string,number][]=[['ink','surface',4.5],['muted','surface',4.5],['muted','subtle',4.5],['on-accent','accent',4.5],['success','surface',4.5],['danger','surface',4.5],['focus','surface',3],['focus','subtle',3]];
for(const [i,block]of blocks.entries()){
 const tokens=Object.fromEntries([...block.matchAll(/--([\w-]+):\s*(#[a-f0-9]{6}(?:[a-f0-9]{2})?)/g)].map(m=>[m[1],m[2]]));
 for(const [fg,bg,min]of pairs){const ratio=contrast(tokens[fg],tokens[bg]);assert.ok(ratio>=min,`${i?'Night':'Day'} ${fg}/${bg}: ${ratio}`);console.log(`${i?'Night':'Day'} ${fg}/${bg}: ${ratio.toFixed(2)}:1 (required ${min}:1)`);}
 // The restored glass panels blend with the scene. Check both channel extrema,
 // which bound their possible background luminance, without claiming a render test.
 for(const fg of ['ink','muted','success','danger','focus']){
  const min=fg==='focus'?3:4.5;
  const ratio=Math.min(...[0,255].map(bg=>contrast(tokens[fg],composite(tokens.glass,bg))));
  assert.ok(ratio>=min,`${i?'Night':'Day'} ${fg}/glass: ${ratio}`);
  console.log(`${i?'Night':'Day'} ${fg}/glass worst-case: ${ratio.toFixed(2)}:1 (required ${min}:1)`);
 }
}
const ids=[...hud.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(new Set(ids).size,ids.length,'IDs must be unique');
const plain=(html:string)=>html.replace(/<svg\b[\s\S]*?<\/svg>/g,'').replace(/<[^>]*>/g,'').replace(/\s+/g,' ').trim();
let controls=0;
for(const button of hud.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/g)){
 const label=button[1].match(/aria-label="([^"]+)"/)?.[1],visible=plain(button[2]);
 assert.ok(label||visible,`Button missing accessible name: ${button[0]}`);
 if(label&&visible)assert.ok(label.toLowerCase().includes(visible.toLowerCase()),`Accessible name should include visible label: ${label} / ${visible}`);
 controls++;
}
for(const match of hud.matchAll(/aria-(?:controls|labelledby)="([^"]+)"/g))for(const id of match[1].split(' '))assert.ok(ids.includes(id),`Missing ARIA target: ${id}`);
console.log(`${controls} buttons have source-level accessible names; label/name matches and ARIA references pass.`);
console.log('Not verified: rendered reflow, heading-panel contrast, hit areas, focus visibility, browser input and assistive technology.');
