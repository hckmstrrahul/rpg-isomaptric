import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {miniPersonResources,addRiverboatPeople} from '../src/miniPeople.ts';

test('miniature people reuse bounded, finite vertex-coloured geometry without textures',()=>{
 for(const pose of ['standing','seated'] as const)for(let style=0;style<4;style++){
  const a=miniPersonResources(pose,style),b=miniPersonResources(pose,style+4);
  assert.equal(a.geometry,b.geometry);assert.equal(a.material,b.material);
  const p=a.geometry.getAttribute('position');assert.ok(p.count/3<1800);assert.ok(a.geometry.getAttribute('color'));
  for(const value of p.array)assert.ok(Number.isFinite(value));
  assert.equal((a.material as T.MeshStandardMaterial).map,null);
  const box=a.geometry.boundingBox!;assert.ok(box.max.y<1.6&&box.min.y>-.15);assert.ok(box.max.x-box.min.x<.6);
 }
});

test('riverboat people are one non-colliding batch that follows the hull',()=>{
 const boat=new T.Group(),crew=addRiverboatPeople(boat,2),other=addRiverboatPeople(new T.Group(),6);
 assert.equal(crew.geometry,other.geometry);assert.equal(boat.children.length,1);assert.equal(crew.userData.nonSolid,true);
 boat.position.set(5,-1,8);boat.rotation.y=.7;boat.updateMatrixWorld(true);assert.deepEqual(crew.getWorldPosition(new T.Vector3()).toArray(),[5,-1,8]);
 assert.equal(new T.Raycaster(new T.Vector3(5,10,8),new T.Vector3(0,-1,0)).intersectObject(crew).length,0);
 const p=crew.geometry.getAttribute('position');assert.ok(p.count/3<4000);
});
