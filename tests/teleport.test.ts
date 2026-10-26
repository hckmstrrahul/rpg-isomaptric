import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CityMap } from '../src/map.ts';
import { BRIDGES, GROUND, BRIDGE_LIFT, HALF, canWalk, resolveTeleport, riverCenter, type Obstacle } from '../src/layout.ts';

test('teleport keeps exact chosen coordinates, even beside a landmark',()=>{
  const destination=resolveTeleport(50.125,81.375,[]);
  assert.deepEqual(destination,{valid:true,position:{x:50.125,y:GROUND+.13,z:81.375}});
  for(const [x,z] of [[-103,-103],[103,103],[-103,103],[103,-103]])
    assert.equal(resolveTeleport(x,z,[]).valid,true,'Teleport has no distance restriction');
});

test('all three bridges are valid teleport surfaces at deck height',()=>{
  for(const z of BRIDGES) {
    const result=resolveTeleport(riverCenter(z),z,[]);
    assert.ok(result.valid);assert.equal(result.position.y,GROUND+BRIDGE_LIFT+.13);
  }
});

test('invalid locations are rejected rather than snapped onto nearby land',()=>{
  const obstacles:Obstacle[]=[{x:-60,z:0,w:6,d:6}];
  for(const [x,z] of [[-60,0],[riverCenter(0),0],[HALF,0],[NaN,0],[0,Infinity]]) {
    const result=resolveTeleport(x,z,obstacles);
    assert.equal(result.valid,false);assert.ok('reason' in result);
    assert.equal('position' in result,false);
  }
});

test('teleport uses live collisions after demolition and planting',()=>{
  const obstacles:Obstacle[]=[{x:-60,z:0,w:6,d:6}];
  assert.equal(resolveTeleport(-60,0,obstacles).valid,false);
  obstacles.splice(0,1);
  assert.equal(resolveTeleport(-60,0,obstacles).valid,true);
  obstacles.push({x:-60,z:0,w:.28,d:.28});
  assert.equal(resolveTeleport(-60,0,obstacles).valid,false);
  assert.equal(resolveTeleport(-58,0,obstacles).valid,true);
});

test('map pointer coordinates remain exact across display sizes and offsets',()=>{
  for(const [left,top,width,height] of [[50,90,472,472],[12,180,300,250]]) {
    const canvas={getContext:()=>({}),getBoundingClientRect:()=>({left,top,width,height})} as unknown as HTMLCanvasElement;
    const map=new CityMap(canvas,[],[],true),x=-60.125,z=54.875;
    const point=map.toWorld(left+(x/236+.5)*width,top+(z/236+.5)*height);
    assert.ok(Math.abs(point.x-x)<1e-10);assert.ok(Math.abs(point.z-z)<1e-10);
  }
});

test('teleport eligibility agrees with walking across the map',()=>{
  const obstacles=[{x:-60,z:0,w:10,d:14},{x:50,z:65,w:.3,d:.3}];
  for(let x=-110;x<=110;x+=2)for(let z=-110;z<=110;z+=2)
    assert.equal(resolveTeleport(x,z,obstacles).valid,canWalk(x,z,obstacles));
});
