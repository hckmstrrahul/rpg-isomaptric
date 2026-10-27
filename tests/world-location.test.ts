import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseWorld,worldUrl} from '../src/worldLocation.ts';
test('only known locations can be selected',()=>{
 assert.equal(parseWorld('london'),'london');assert.equal(parseWorld('dubai'),'dubai');
 for(const id of ['bengaluru','agra','lisbon','moon'])assert.equal(parseWorld(id),id);
 for(const value of [null,undefined,'','Dubai','paris','hyderabad','__proto__'])assert.equal(parseWorld(value),null);
});
test('chapter navigation preserves unrelated URL options and replaces the selected world',()=>{
 const next=new URL(worldUrl('dubai','https://rpg-isomaptric.vercel.app/?world=london&capture=1#scene'));
 assert.equal(next.searchParams.get('world'),'dubai');assert.equal(next.searchParams.get('capture'),'1');assert.equal(next.hash,'');
 assert.equal(new URL(worldUrl('london',next.href)).searchParams.get('world'),'london');
});
