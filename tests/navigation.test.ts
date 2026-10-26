import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BRIDGES, HALF, riverCenter, riverWidth, bank, canWalk, walkStep, resolveTeleport } from '../src/layout.ts';
import { plantingIssue } from '../src/sandbox.ts';

test('river blocks walking while each bridge connects both banks', () => {
  assert.equal(canWalk(riverCenter(0), 0, []), false);
  for (const z of BRIDGES) {
    const center=riverCenter(z),width=riverWidth(z);
    const start=center-width/2-5;
    const end=walkStep(start,z,width+10,0,[]);
    assert.ok(Math.abs(end.x-(center+width/2+5))<.01, `Bridge at ${z} must be traversable`);
    assert.equal(canWalk(center,z+5,[]),false,'River alongside a bridge must remain blocked');
  }
});

test('the river stays open to the slab edge and blocks walking, teleporting and planting', () => {
  for(const z of [94,98,101,105,106]) {
    const x=riverCenter(z);
    assert.ok(riverWidth(z)>24,'River must retain its width at the front cut');
    assert.equal(canWalk(x,z,[]),false);
    assert.equal(resolveTeleport(x,z,[]).valid,false);
    if(z<105)assert.match(plantingIssue({x,z},{x:x-4,z},[],[])!,/dry ground/);
    for(const side of [-1,1])assert.equal(canWalk(bank(z,side,4),z,[]),true);
  }
});

test('large movement steps cannot tunnel through buildings or world boundaries', () => {
  const obstacles=[{x:-60,z:0,w:10,d:10}];
  const result=walkStep(-80,0,40,0,obstacles);
  assert.ok(result.x<-65&&result.x>-66);
  const edge=walkStep(-103,80,-50,0,[]);
  assert.ok(edge.x>=-HALF+2);
});

test('diagonal movement slides along a wall rather than entering it', () => {
  const obstacles=[{x:-60,z:0,w:10,d:20}];
  const result=walkStep(-66,0,5,5,obstacles);
  assert.ok(result.x<-65);
  assert.ok(result.z>4.9);
});

test('the river remains impermeable away from bridge crossings', () => {
  const z=26,edge=riverCenter(z)-riverWidth(z)/2;
  const result=walkStep(edge-3,z,20,0,[]);
  assert.ok(result.x<edge);
});
