import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync,statSync} from 'node:fs';
import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {citySurface} from '../src/importedAssets.ts';
import {Builder} from '../src/geometry.ts';

const root=new URL('../public/assets/nvidia/',import.meta.url);
const bytes=readFileSync(new URL('wheelie-bin.glb',root));
export const bin=(await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'' )).scene;

test('the shipped bin is self-contained, grounded, simplified and miniature scale',()=>{
 const box=new T.Box3().setFromObject(bin),size=box.getSize(new T.Vector3());
 assert.ok(Math.abs(box.min.y)<1e-6);assert.ok(Math.abs(size.y-1.15)<1e-6);
 assert.ok(size.x>.5&&size.x<1.05);assert.ok(size.z>.5&&size.z<1.05);
 let triangles=0,meshes=0;
 bin.traverse(o=>{if(o instanceof T.Mesh){meshes++;triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3;assert.equal(o.material.map,null);}});
 assert.equal(meshes,2);assert.ok(triangles<4000);assert.ok(triangles>1000);
 const manifest=JSON.parse(readFileSync(new URL('manifest.json',root),'utf8'));
 assert.equal(manifest.creator,'NVIDIA');assert.equal(manifest.license,'CC BY 4.0');assert.equal(manifest.sources.length,3);
 const total=readdirSync(root).reduce((n,file)=>n+statSync(new URL(file,root)).size,0);
 assert.ok(total<1_000_000,`Trial assets must stay below 1 MB; got ${total}`);
});

test('source texture channels use the correct color spaces and repeat at world scale',()=>{
 for(const kind of ['concrete','metal'] as const){
  const maps={albedo:new T.Texture(),normal:new T.Texture(),orm:new T.Texture()};
  const material=citySurface(kind,maps);
  assert.equal(maps.albedo.colorSpace,T.SRGBColorSpace);assert.equal(maps.normal.colorSpace,T.NoColorSpace);assert.equal(maps.orm.colorSpace,T.NoColorSpace);
  assert.equal(material.roughnessMap,maps.orm);assert.equal(material.aoMap,maps.orm);
  assert.ok(material.normalScale.x<.2);assert.equal(maps.albedo.wrapS,T.RepeatWrapping);
  const b=new Builder();b.ribbon([{x:0,z:0},{x:30,z:0}],2,1.4,material);
  const mesh=b.finish().children[0] as T.Mesh,uv=mesh.geometry.attributes.uv;
  assert.ok(Math.max(...uv.array)>=30/material.userData.worldTile,'Pavement must repeat rather than stretch a single texture');
 }
});
