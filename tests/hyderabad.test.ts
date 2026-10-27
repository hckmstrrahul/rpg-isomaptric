import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
const context=new Proxy({},{get:()=>()=>{},set:()=>true});
globalThis.document={createElement:()=>({width:256,height:256,getContext:()=>context})} as unknown as Document;
globalThis.window={location:{href:'https://rpg-isomaptric.vercel.app/?world=hyderabad'},localStorage:{getItem:()=>null}} as unknown as Window&typeof globalThis;
const {createHyderabadWorld}=await import('../src/worlds/hyderabad/world.ts');
const {PLAN,CHARMINAR,MOSQUE,PALACE}=await import('../src/worlds/hyderabad/plan.ts');
const {canWalk,LANDMARKS,PLAYER_SPAWN,isWater}=await import('../src/layout.ts');
const {plotTouchesRoad}=await import('../src/cityPlan.ts');
const scene=new T.Scene(),world=createHyderabadWorld(scene);
const moving=new Set(world.traffic.cars.flatMap(c=>world.objects.models.get(c.object.id)!.obstacles));
const fixed=world.obstacles.filter(o=>!moving.has(o));
test('Hyderabad is one inland Old City district with correct landmark relationships',()=>{
 assert.equal(LANDMARKS,PLAN.landmarks);assert.equal(world.water.visible,false);assert.equal(PLAN.waterVisible,false);assert.equal(isWater(0,0),false);
 assert.ok(MOSQUE.x<CHARMINAR.x&&MOSQUE.z>CHARMINAR.z);assert.ok(PALACE.x<CHARMINAR.x&&PALACE.z>CHARMINAR.z);
 const named=world.objects.state.objects.filter(o=>o.kind==='building').map(o=>o.name);assert.equal(named.filter(n=>n==='Charminar').length,1);assert.ok(named.includes('Mecca Masjid'));assert.ok(named.includes('Khilwat Mubarak'));assert.ok(named.every(n=>!n.includes('Taj')));
});
test('Charminar has four connected visually open arches and no central tower',()=>{
 const root=scene.getObjectByName('Charminar')!;scene.updateMatrixWorld(true);
 for(const [x,z] of [[0,1],[1,0],[0,-1],[-1,0]]){
  const origin=new T.Vector3(x*7,2.65,CHARMINAR.z+z*7),direction=new T.Vector3(-x,0,-z);
  assert.equal(new T.Raycaster(origin,direction,0,14).intersectObject(root,true).length,0,'Arch portal filled');
  for(let d=-5;d<=5;d+=.25)assert.ok(canWalk(x*d,CHARMINAR.z+z*d,fixed,.46),`Arch path blocked ${x*d}, ${CHARMINAR.z+z*d}`);
 }
 const topRay=new T.Raycaster(new T.Vector3(0,20,CHARMINAR.z),new T.Vector3(0,-1,0));
 const hits=topRay.intersectObject(root,true);assert.ok(hits.length>0);assert.ok(hits[0].point.y<8,'A central dome or tower replaced the flat mosque roof');
});
test('Hyderabad connects all eight discoveries and leaves vehicles clear of static geometry',()=>{
 assert.ok(canWalk(PLAYER_SPAWN.x,PLAYER_SPAWN.z,world.obstacles));for(const l of LANDMARKS)assert.ok(canWalk(l.visitX,l.visitZ,world.obstacles),`${l.id} arrival blocked`);
 const origin={x:Math.round(PLAYER_SPAWN.x),z:Math.round(PLAYER_SPAWN.z)},queue=[origin],seen=new Set([`${origin.x},${origin.z}`]);
 for(let i=0;i<queue.length;i++)for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){const p={x:queue[i].x+dx,z:queue[i].z+dz},key=`${p.x},${p.z}`;if(!seen.has(key)&&canWalk(p.x,p.z,fixed)){seen.add(key);queue.push(p);}}
 for(const l of LANDMARKS)assert.ok(queue.some(p=>Math.hypot(p.x-l.visitX,p.z-l.visitZ)<1.5),`${l.id} disconnected`);
 const conflicts=world.objects.state.objects.filter(o=>o.kind==='building'&&plotTouchesRoad(o,world.roads,.1));assert.deepEqual(conflicts.map(o=>o.name),[]);
 for(const route of world.traffic.routes)for(let d=0;d<route.length;d+=.7){const p=route.sample(d).point;assert.ok(canWalk(p.x,p.z,fixed,.7),`Vehicle route blocked at ${p.x}, ${p.z}`);}
});
test('Hyderabad dense terrace housing and night lighting stay within a bounded scene',()=>{
 let meshes=0,triangles=0;const maps=new Set<T.Texture>();scene.traverse(o=>{if(o instanceof T.Mesh){meshes++;const p=o.geometry.getAttribute('position');for(const v of p.array)assert.ok(Number.isFinite(v));triangles+=(o.geometry.index?.count??p.count)/3;for(const mat of Array.isArray(o.material)?o.material:[o.material]){const m=mat as T.MeshStandardMaterial;if(m.map)maps.add(m.map);}}});
 assert.ok(world.homes.length>=200,`${world.homes.length} houses`);assert.ok(world.objects.trees.size>=200);assert.ok(world.shrubs.count>=700);assert.equal(world.localLighting.slots.length,12);assert.ok(meshes<1400,`${meshes} meshes`);assert.ok(triangles<400000,`${triangles} triangles`);assert.ok(maps.size<30,`${maps.size} maps`);
 console.log(`Hyderabad: ${world.homes.length} houses, ${world.objects.trees.size} trees, ${world.shrubs.count} shrubs, ${meshes} meshes, ${Math.round(triangles)} unique triangles, ${maps.size} maps.`);
});
test('Hyderabad domestic rooflines stay subordinate to Charminar and courtyards remain open',()=>{
 scene.updateMatrixWorld(true);
 const height=(o:T.Object3D)=>new T.Box3().setFromObject(o).getSize(new T.Vector3()).y;
 const landmarkHeight=height(scene.getObjectByName('Charminar')!),heights=world.homes.map(height);
 assert.ok(heights.filter(h=>h<landmarkHeight*.4).length/world.homes.length>.9,'Typical rooflines compete with Charminar');
 assert.ok(heights.every(h=>h<landmarkHeight*.5),'A domestic stair room became a competing tower');
 const courtyards=world.homes.filter(h=>h.userData.roofStyle==='courtyard');assert.ok(courtyards.length>20);
 for(const house of courtyards.slice(0,8)){
  const ray=new T.Raycaster(new T.Vector3(house.position.x,20,house.position.z),new T.Vector3(0,-1,0)),hits=ray.intersectObject(house,true);
  assert.ok(hits.length&&hits[0].point.y<house.position.y+.15,'Courtyard was covered by a full roof');
 }
 assert.equal(new Set(world.homes.map(h=>h.userData.facadeFamily).filter(Number.isInteger)).size,6);
});
