import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {cameraPanFactor,BIRDVIEW_ZOOM} from '../src/cameraGlide.ts';

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
