import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
const context=new Proxy({},{get:()=>()=>{},set:()=>true});
globalThis.document={createElement:()=>({width:256,height:256,getContext:()=>context})} as unknown as Document;
globalThis.window={location:{href:'https://rpg-isomaptric.vercel.app/?world=agra'},localStorage:{getItem:()=>null}} as unknown as Window&typeof globalThis;
const {createAgraWorld}=await import('../src/worlds/agra/world.ts');
const {PLAN,TAJ,TAJ_SCALE,GATE,SOUTH_BANK,NORTH_BANK,agraLand,agraHeight}=await import('../src/worlds/agra/plan.ts');
const {canWalk,LANDMARKS,PLAYER_SPAWN,surfaceHeight,WATER_HEIGHT,resolveTeleport}=await import('../src/layout.ts');
const {plotTouchesRoad,roadClearance}=await import('../src/cityPlan.ts');
const scene=new T.Scene(),world=createAgraWorld(scene);
const moving=new Set(world.traffic.cars.flatMap(c=>world.objects.models.get(c.object.id)!.obstacles));
const fixed=world.obstacles.filter(o=>!moving.has(o));
test('Agra keeps one Taj, opposite-bank Mehtab and the actual north–south precinct hierarchy',()=>{
 assert.equal(LANDMARKS,PLAN.landmarks);assert.equal(LANDMARKS.length,8);
 const names=world.objects.state.objects.filter(o=>o.kind==='building').map(o=>o.name);
 assert.equal(names.filter(n=>n==='Taj Mahal').length,1);
 assert.ok(LANDMARKS.find(l=>l.id==='taj-mosque')!.x<TAJ.x);
 assert.ok(LANDMARKS.find(l=>l.id==='jawab')!.x>TAJ.x);
 assert.ok(LANDMARKS.find(l=>l.id==='great-gate')!.z>LANDMARKS.find(l=>l.id==='charbagh')!.z);
 assert.equal(agraLand(0,-35),false);assert.equal(agraLand(0,-78),true);assert.equal(PLAN.bridgeAt(0,-35),false);
 assert.equal(surfaceHeight(0,-35),WATER_HEIGHT);assert.equal(resolveTeleport(0,-35,world.obstacles).valid,false);
 assert.equal(SOUTH_BANK[0].x,-108);assert.equal(NORTH_BANK.at(-1)!.x,108);
});
test('Agra arrivals and the Great Gate connect through the walkable public approach',()=>{
 assert.ok(canWalk(PLAYER_SPAWN.x,PLAYER_SPAWN.z,world.obstacles));
 for(const l of LANDMARKS)assert.ok(canWalk(l.visitX,l.visitZ,world.obstacles),`${l.id} arrival occupied`);
 assert.ok(canWalk(0,GATE.z,fixed),'Great Gate portal collision is blocked');
 const origin={x:Math.round(PLAYER_SPAWN.x),z:Math.round(PLAYER_SPAWN.z)},queue=[origin],seen=new Set([`${origin.x},${origin.z}`]);
 for(let i=0;i<queue.length;i++)for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){
  const p={x:queue[i].x+dx,z:queue[i].z+dz},key=`${p.x},${p.z}`;
  if(!seen.has(key)&&canWalk(p.x,p.z,fixed)){seen.add(key);queue.push(p);}
 }
 for(const l of LANDMARKS)assert.ok(queue.some(p=>Math.hypot(p.x-l.visitX,p.z-l.visitZ)<1.5),`${l.id} is disconnected`);
 const gate=scene.getObjectByName('Darwaza-i Rauza')!;scene.updateMatrixWorld(true);
 assert.equal(new T.Raycaster(new T.Vector3(0,2.6,GATE.z+6),new T.Vector3(0,0,-1),0,12).intersectObject(gate,true).length,0,'Great Gate opening is visually filled');
 assert.equal(agraHeight(6,TAJ.z),1.35+1.23*TAJ_SCALE);assert.ok(agraHeight(0,TAJ.z+10*TAJ_SCALE)>1.35&&agraHeight(0,TAJ.z+10*TAJ_SCALE)<1.35+1.23*TAJ_SCALE);
});
test('Agra roads and vehicles stay outside the pedestrian monument and clear static obstacles',()=>{
 const conflicts=world.objects.state.objects.filter(o=>o.kind==='building'&&plotTouchesRoad(o,world.roads,.1));assert.deepEqual(conflicts.map(o=>o.name),[]);
 for(const route of world.traffic.routes)for(let d=0;d<route.length;d+=.7){const p=route.sample(d).point;assert.ok(canWalk(p.x,p.z,fixed,.65),`Traffic blocked at ${p.x}, ${p.z}`);assert.ok(Math.abs(p.x)>36.5||p.z>91,'Traffic entered the pedestrian heritage precinct');}
 for(const car of world.traffic.cars)assert.notEqual(car.kind,'bus');
});
test('Agra geometry and night resources remain bounded with sufficient neighbourhood density',()=>{
 let meshes=0,triangles=0;const maps=new Set<T.Texture>();
 scene.traverse(o=>{if(o instanceof T.Mesh){meshes++;const p=o.geometry.getAttribute('position');for(const v of p.array)assert.ok(Number.isFinite(v));triangles+=(o.geometry.index?.count??p.count)/3;for(const mat of Array.isArray(o.material)?o.material:[o.material]){const m=mat as T.MeshStandardMaterial;if(m.map)maps.add(m.map);}}});
 assert.ok(world.housingUnits>=180,`${world.housingUnits} homes`);assert.ok(world.homes.some(h=>h.userData.houseCount>=4),'Attached Taj Ganj frontage missing');assert.ok(world.objects.trees.size>=600);assert.ok(world.shrubs.count>=1500);assert.equal(world.localLighting.slots.length,12);
 assert.ok(meshes<1000,`${meshes} meshes`);assert.ok(triangles<420000,`${triangles} triangles`);assert.ok(maps.size<30,`${maps.size} maps`);
 const taj=scene.getObjectByName('Taj Mahal')!;taj.traverse(o=>{if(o instanceof T.Mesh)for(const mat of Array.isArray(o.material)?o.material:[o.material]){const m=mat as T.MeshStandardMaterial;assert.ok(!m.emissiveMap,'Taj must not be an office-window grid');assert.ok(!m.userData.glowStrength,'Taj marble is moonlit, not emissive');}});
 console.log(`Agra: ${world.homes.length} residences, ${world.objects.trees.size} trees, ${world.shrubs.count} shrubs, ${meshes} meshes, ${Math.round(triangles)} unique triangles, ${maps.size} maps.`);
});
test('Yamuna boats stay on the actual river through their complete routes',()=>{
 for(let i=0;i<200;i++){world.update(i*6);for(const boat of world.boats){const p=boat.group.position;assert.ok(!agraLand(p.x,p.z),`Boat left the Yamuna at ${p.x}, ${p.z}`);}}
});

test('grand Taj podium remains dry, with four separate minarets and a safe central arrival',()=>{
 const taj=scene.getObjectByName('Taj Mahal')!,bounds=new T.Box3().setFromObject(taj);assert.ok(bounds.max.y-bounds.min.y>20,'Hero monument should dominate the district');
 for(const x of [-7.88,7.88])for(const z of [-7.88,7.88]){const hits=new T.Raycaster(new T.Vector3(x*TAJ_SCALE,40,TAJ.z+z*TAJ_SCALE),new T.Vector3(0,-1,0)).intersectObject(taj,true);assert.ok(hits.some(hit=>hit.point.y>13),'A minaret is missing');}
 for(const x of [-9,0,9])for(const z of [-9,0,9])assert.ok(agraLand(x*TAJ_SCALE,TAJ.z+z*TAJ_SCALE),'Enlarged podium crosses the river');
 assert.ok(Math.hypot(PLAYER_SPAWN.x,PLAYER_SPAWN.z)<22);assert.equal(surfaceHeight(PLAYER_SPAWN.x,PLAYER_SPAWN.z),1.35);assert.ok(canWalk(PLAYER_SPAWN.x,PLAYER_SPAWN.z,fixed));
});
test('every approach-road end reaches the cut edge or joins another road',()=>{
 for(const road of world.roads)for(const end of [road.points[0],road.points.at(-1)!]){
  if(Math.max(Math.abs(end.x),Math.abs(end.z))>=107.9)continue;
  assert.ok(roadClearance(end,world.roads.filter(other=>other!==road))<-.5,`${road.id} has a disconnected end`);
 }
});
test('Agra traffic keeps circulating through ten minutes of signals near the central explorer',()=>{
 const traffic=world.traffic,begin=traffic.cars.map(c=>c.distance);let recent:number[]=[];
 for(let frame=1;frame<=12000;frame++){traffic.update(2000+frame*.05,PLAN.spawn);if(frame===9600)recent=traffic.cars.map(c=>c.distance);}
 traffic.cars.forEach((car,i)=>{assert.ok(car.distance-begin[i]>250,`${car.kind} ${i} made no useful circulation`);assert.ok(car.distance-recent[i]>10,`${car.kind} ${i} became permanently queued`);});
});
