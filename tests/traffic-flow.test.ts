import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {createTraffic} from '../src/traffic.ts';
import {WorldObjects} from '../src/interactables.ts';
import {PLAYER_SPAWN} from '../src/layout.ts';
import {OBB} from 'three/addons/math/OBB.js';

test('mixed traffic passes the central explorer, keeps separation and completes its routes',()=>{
 const scene=new T.Scene(),objects=new WorldObjects(scene,[]),traffic=createTraffic(scene,objects);
 assert.equal(traffic.cars.length,44);assert.equal(new Set(traffic.cars.map(c=>c.kind)).size,7);
 const start=traffic.cars.map(c=>c.distance),lastX=traffic.cars.map(c=>c.object.x);let passes=0;
 const boxes=traffic.cars.map(()=>new OBB());
 for(let frame=1;frame<=7000;frame++) {
  traffic.update(frame*.1,PLAYER_SPAWN);objects.update(frame*.1);
  traffic.cars.forEach((car,i)=>{
   const p=car.model.root.position,yaw=car.model.root.rotation.y,dx=PLAYER_SPAWN.x-p.x,dz=PLAYER_SPAWN.z-p.z;
   const across=Math.abs(dx*Math.cos(yaw)-dz*Math.sin(yaw)),along=Math.abs(dx*Math.sin(yaw)+dz*Math.cos(yaw));
   assert.ok(Math.hypot(Math.max(0,across-car.model.width/2),Math.max(0,along-car.model.length/2))>.5,`${car.kind} overlaps the explorer`);
   if(Math.sign(lastX[i]-PLAYER_SPAWN.x)!==Math.sign(p.x-PLAYER_SPAWN.x)&&Math.abs(p.z-PLAYER_SPAWN.z)<2.4)passes++;
   lastX[i]=p.x;
   if(frame%20===0)boxes[i].set(new T.Vector3(p.x,0,p.z),new T.Vector3(car.model.width/2,.5,car.model.length/2),new T.Matrix3().setFromMatrix4(new T.Matrix4().makeRotationY(yaw)));
  });
  if(frame%20===0)for(let i=0;i<boxes.length;i++)for(let j=i+1;j<boxes.length;j++)assert.ok(!boxes[i].intersectsOBB(boxes[j],1e-6),`Vehicles ${i} and ${j} collide`);
 }
 assert.ok(passes>6,`Only ${passes} vehicles passed the explorer`);
 traffic.cars.forEach((c,i)=>assert.ok(c.distance-start[i]>c.route.length,`${i} ${c.kind} is stuck`));
});
