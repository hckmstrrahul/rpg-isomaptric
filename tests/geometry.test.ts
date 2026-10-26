import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { Builder } from '../src/geometry.ts';

test('road and promenade surfaces face upward and remain visible from the camera', () => {
  const b=new Builder();
  b.ribbon([{x:0,z:0},{x:0,z:10},{x:4,z:20}],4,1.4,'#888888');
  const root=b.finish();
  root.traverse(mesh=>{
    if(!(mesh instanceof THREE.Mesh))return;
    const normals=mesh.geometry.getAttribute('normal');
    for(let i=0;i<normals.count;i++)assert.ok(normals.getY(i)>.99);
  });
});

test('baking colours preserves paint differences while consolidating draw calls', () => {
  const b=new Builder();
  b.box(0,1,0,1,1,1,'#ff0000');b.box(2,1,0,1,1,1,'#00ff00');
  const root=b.finish();assert.equal(root.children.length,1);
  const mesh=root.children[0] as THREE.Mesh;
  const colors=mesh.geometry.getAttribute('color');
  assert.equal(colors.getX(0),1);assert.equal(colors.getY(0),0);
  assert.equal(colors.getX(36),0);assert.equal(colors.getY(36),1);
});

test('static-model batching preserves world-space transforms', () => {
  const childBuilder=new Builder();childBuilder.box(0,0,0,2,2,2,'#335577');
  const child=childBuilder.finish();child.position.set(10,3,5);
  const b=new Builder();b.absorb(child);const result=b.finish();
  const bounds=new THREE.Box3().setFromObject(result);
  assert.deepEqual(bounds.min.toArray(),[9,2,4]);assert.deepEqual(bounds.max.toArray(),[11,4,6]);
});
