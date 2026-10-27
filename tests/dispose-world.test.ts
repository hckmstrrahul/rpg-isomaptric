import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {disposeWorld} from '../src/disposeWorld.ts';

test('chapter teardown releases shared geometry, maps and shader resources once',()=>{
 const scene=new T.Scene(),geometry=new T.BoxGeometry(),map=new T.Texture(),env=new T.Texture(),material=new T.MeshStandardMaterial({map});
 const shader=new T.ShaderMaterial({uniforms:{reflection:{value:map}}});
 const spriteMap=new T.DataTexture(new Uint8Array(64),4,4),spriteMaterial=new T.SpriteMaterial({map:spriteMap});
 scene.add(new T.Mesh(geometry,material),new T.Mesh(geometry,material),new T.Mesh(geometry,shader),new T.Sprite(spriteMaterial));scene.environment=env;
 const counts={geometry:0,map:0,env:0,material:0,shader:0,spriteMap:0,spriteMaterial:0};
 for(const [key,resource] of Object.entries({geometry,map,env,material,shader,spriteMap,spriteMaterial}))resource.addEventListener('dispose',()=>counts[key as keyof typeof counts]++);
 disposeWorld(scene);
 assert.deepEqual(counts,{geometry:1,map:1,env:1,material:1,shader:1,spriteMap:1,spriteMaterial:1});
 assert.equal(scene.children.length,0);assert.equal(scene.environment,null);
 assert.deepEqual(Object.keys(geometry.attributes),[]);assert.equal(geometry.index,null);
 assert.equal(map.source.data,null);assert.equal(spriteMap.source.data,null);assert.deepEqual(shader.uniforms,{});
});

test('cached chapter roots and instance banks retain no vertex or instance arrays',()=>{
 const scene=new T.Scene(),root=new T.Group(),geometry=new T.BoxGeometry(),bank=new T.InstancedMesh(geometry,new T.MeshBasicMaterial(),4096);
 root.add(bank);scene.add(root);disposeWorld(scene);
 assert.equal(root.children.length,0);assert.equal(bank.count,0);assert.equal(bank.instanceMatrix.array.byteLength,0);
 assert.equal(geometry.index,null);assert.deepEqual(Object.keys(geometry.attributes),[]);
});
