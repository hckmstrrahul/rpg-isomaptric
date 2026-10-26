import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {createCameraGlide,cameraPanFactor,BIRDVIEW_ZOOM} from '../src/cameraGlide.ts';

test('teleport camera glides smoothly between positions while retaining orientation and zoom',()=>{
 const from=new T.Vector3(-20,2,30),to=new T.Vector3(50,2,-50),camera=new T.OrthographicCamera(-100,100,100,-100,.1,1000);
 const offset=new T.Vector3(215,185,235),target=from.clone();camera.position.copy(from).add(offset);camera.zoom=4.2;
 const glide=createCameraGlide(from,to);let firstStep=0,lastStep=0,maxStep=0;
 for(let i=0;i<150;i++){
  const next=glide.tick(1/60);if(!next)continue;
  const delta=next.clone().sub(target);if(i===0)firstStep=delta.length();lastStep=delta.length();maxStep=Math.max(maxStep,lastStep);
  camera.position.add(delta);target.copy(next);
  assert.equal(camera.zoom,4.2);assert.ok(camera.position.clone().sub(target).distanceTo(offset)<1e-9);
  assert.ok(target.distanceTo(to)<=from.distanceTo(to));
 }
 assert.ok(target.distanceTo(to)<1e-9);assert.ok(firstStep<maxStep*.03&&lastStep<maxStep*.03);
 assert.equal(glide.active,false);assert.equal(glide.tick(.1),null);
});

test('camera input cancels a glide and reduced motion goes straight to the destination',()=>{
 const from=new T.Vector3(),to=new T.Vector3(15,2,20),glide=createCameraGlide(from,to);
 glide.tick(.05);glide.cancel();assert.equal(glide.tick(.05),null);
 const reduced=createCameraGlide(from,to,true);assert.deepEqual(reduced.tick(0),to);assert.equal(reduced.active,false);
});

test('Birdview smoothly tracks a running explorer and settles after stopping at different frame rates',()=>{
 const finishes:T.Vector3[]=[];
 for(const fps of [30,60,120]){
  const target=new T.Vector3(),player=new T.Vector3(),offset=new T.Vector3(0,360,.0001),camera=offset.clone();let firstStep=0;
  for(let frame=1;frame<=fps*3;frame++){
   player.set(11*frame/fps,2,4*frame/fps);
   const delta=player.clone().sub(target).multiplyScalar(cameraPanFactor(1/fps,true,true));
   if(frame===1)firstStep=delta.x;
   camera.add(delta);target.add(delta);
   assert.ok(target.x<player.x&&player.x-target.x<2,'Follow has a small, bounded lag without snapping');
   assert.ok(camera.clone().sub(target).distanceTo(offset)<1e-9,'Panning preserves the top-down orientation');
  }
  assert.ok(firstStep<11/fps*.25,'Movement eases into the camera pan');finishes.push(target.clone());
  for(let frame=0;frame<fps;frame++)target.lerp(player,cameraPanFactor(1/fps,false,true));
  assert.ok(target.distanceTo(player)<.006,'Camera gently catches up once the explorer stops');
 }
 assert.ok(finishes[0].distanceTo(finishes[2])<.2,'Follow remains consistent across frame rates');
 assert.ok(8/BIRDVIEW_ZOOM>2.5,'Birdview shows substantially more of the city than before');
});

test('Birdview can resume from a manual pan without jumping, while reduced motion follows immediately',()=>{
 const target=new T.Vector3(-50,2,10),player=new T.Vector3(15,2,20),before=target.distanceTo(player);
 target.lerp(player,cameraPanFactor(1/60,true,true));
 assert.ok(target.distanceTo(player)>before*.8&&target.distanceTo(player)<before);
 target.lerp(player,cameraPanFactor(1/60,true,true,true));assert.deepEqual(target,player);
 assert.equal(cameraPanFactor(1/60,true,false),1,'Existing isometric walking follow stays immediate');
});
