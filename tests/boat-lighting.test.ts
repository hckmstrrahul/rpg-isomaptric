import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {boatCabinGlass,lightBoat} from '../src/boatLighting.ts';
import {setNightMaterials} from '../src/lighting.ts';

test('Occupied cabins change theme without lighting unoccupied boats or hull paint',()=>{
 const glass=boatCabinGlass('#294e5e'),paint=new T.MeshStandardMaterial({color:'#eeeecc'}),template=new T.Group();
 template.add(new T.Mesh(new T.BoxGeometry(1,.4,2),glass),new T.Mesh(new T.BoxGeometry(1.4,.2,3),paint));
 const lit=template.clone(true),dark=template.clone(true);lightBoat(lit,{cabin:true});
 const litGlass=(lit.children[0] as T.Mesh).material as T.MeshStandardMaterial;
 assert.notEqual(litGlass,glass);assert.equal((dark.children[0] as T.Mesh).material,glass);
 assert.equal((lit.children[1] as T.Mesh).material,paint);
 setNightMaterials(true);assert.ok(litGlass.emissiveIntensity>.5&&litGlass.emissiveIntensity<1);assert.equal(glass.emissive.getHex(),0);
 setNightMaterials(false);assert.equal(litGlass.emissiveIntensity,0);assert.equal(litGlass.color.getHex(),glass.color.getHex());
});

test('Deck strings use two small batches, follow moving boats and do not affect collision picking',()=>{
 const root=new T.Group();root.add(new T.Mesh(new T.BoxGeometry(2,1,6),new T.MeshStandardMaterial()));
 lightBoat(root,{party:{beam:2,length:6,height:1}});
 const accents=root.getObjectByName('Boat night deck accents')!;
 setNightMaterials(false);assert.equal(accents.visible,false);setNightMaterials(true);assert.equal(accents.visible,true);
 let meshes=0,triangles=0,lights=0;accents.traverse(o=>{if(o instanceof T.Light)lights++;if(o instanceof T.Mesh){meshes++;triangles+=(o.geometry.index?.count??o.geometry.getAttribute('position').count)/3;assert.equal(o.userData.nonSolid,true);}});
 assert.equal(meshes,2);assert.ok(triangles<6000);assert.equal(lights,0);
 root.position.set(20,3,-10);root.updateMatrixWorld(true);assert.deepEqual(accents.getWorldPosition(new T.Vector3()).toArray(),[20,3,-10]);
 assert.equal(new T.Raycaster(new T.Vector3(20.78,10,-10),new T.Vector3(0,-1,0)).intersectObject(accents,true).length,0);
 setNightMaterials(false);
});
