import {test} from 'node:test';
import assert from 'node:assert/strict';
import {installInputFocus} from '../src/inputFocus.ts';

test('only Tab enables focus rings; pointer and canvas gameplay clear them',()=>{
  const attributes=new Set<string>();
  const handlers=new Map<string,(e:unknown)=>void>();
  const doc={documentElement:{setAttribute:(key:string)=>attributes.add(key),removeAttribute:(key:string)=>attributes.delete(key)},
    addEventListener:(type:string,fn:(e:unknown)=>void)=>handlers.set(type,fn),removeEventListener:(type:string)=>handlers.delete(type)};
  const dispose=installInputFocus(doc as unknown as Document);
  const keyboard=(key:string,id='scene')=>handlers.get('keydown')!({key,target:{id}});
  keyboard('w');assert.equal(attributes.size,0);
  keyboard('Tab');assert.ok(attributes.has('data-keyboard-navigation'));
  keyboard('Enter','help-button');assert.ok(attributes.has('data-keyboard-navigation'));
  handlers.get('pointerdown')!({});assert.equal(attributes.size,0);
  keyboard('Tab');keyboard('ArrowUp');assert.equal(attributes.size,0);
  dispose();assert.equal(handlers.size,0);
});
