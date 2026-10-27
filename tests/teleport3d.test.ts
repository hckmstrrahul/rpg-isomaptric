import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { pickSceneTeleport } from '../src/teleport3d.ts';
import { BRIDGES, GROUND, ROAD_HEIGHT, BRIDGE_HEIGHT, BRIDGE_LIFT, riverCenter } from '../src/layout.ts';

test('3D picking selects the visible ground coordinates at different camera angles and zooms',()=>{
  const wanted=new T.Vector3(-60.125,GROUND,40.375);
  for(const position of [[215,230,235],[-180,270,170],[150,300,-180]])for(const zoom of [.9,3,6]) {
    const camera=new T.OrthographicCamera(-200,200,126,-126,.1,1800);
    camera.position.fromArray(position);camera.zoom=zoom;camera.lookAt(wanted);camera.updateProjectionMatrix();camera.updateMatrixWorld();
    const projected=wanted.clone().project(camera),raycaster=new T.Raycaster();
    raycaster.setFromCamera(new T.Vector2(projected.x,projected.y),camera);
    const pick=pickSceneTeleport(raycaster.ray,[]);
    assert.ok(pick.destination.valid);
    assert.ok(Math.abs(pick.destination.position.x-wanted.x)<1e-8);
    assert.ok(Math.abs(pick.destination.position.z-wanted.z)<1e-8);
  }
});

test('3D selection uses the bridge surface aligned with the road deck',()=>{
  for(const z of BRIDGES) {
    const deck=new T.Vector3(riverCenter(z),BRIDGE_HEIGHT,z),origin=deck.clone().add(new T.Vector3(40,100,60));
    const pick=pickSceneTeleport(new T.Ray(origin,deck.clone().sub(origin).normalize()),[]);
    assert.ok(pick.destination.valid);
    assert.ok(pick.point!.distanceTo(deck)<1e-8);assert.equal(pick.destination.position.y,GROUND+BRIDGE_LIFT+.13);
  }
});

test('foreground objects cannot be clicked through to teleport onto hidden ground',()=>{
  const origin=new T.Vector3(-60,100,0),ray=new T.Ray(origin,new T.Vector3(0,-1,0));
  const pick=pickSceneTeleport(ray,[],{point:new T.Vector3(-60,20,0)});
  assert.equal(pick.destination.valid,false);
  assert.equal(pick.point!.y,20);
  // Once the object is demolished, the same visible plot becomes selectable.
  assert.equal(pickSceneTeleport(ray,[]).destination.valid,true);
});

test('objects beyond the selected surface do not block it',()=>{
  const ray=new T.Ray(new T.Vector3(-60,100,0),new T.Vector3(0,-1,0));
  assert.equal(pickSceneTeleport(ray,[],{point:new T.Vector3(-60,-5,0)}).destination.valid,true);
});

test('3D selection rejects water, occupied plots, and rays pointing away from the city',()=>{
  const down=new T.Vector3(0,-1,0);
  assert.equal(pickSceneTeleport(new T.Ray(new T.Vector3(riverCenter(0),100,0),down),[]).destination.valid,false);
  assert.equal(pickSceneTeleport(new T.Ray(new T.Vector3(-60,100,0),down),[{x:-60,z:0,w:4,d:4}]).destination.valid,false);
  const sky=pickSceneTeleport(new T.Ray(new T.Vector3(-60,100,0),new T.Vector3(0,1,0)),[]);
  assert.equal(sky.point,null);assert.equal(sky.destination.valid,false);
});
