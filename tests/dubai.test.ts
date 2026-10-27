import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
const context=new Proxy({}, {get:()=>()=>{},set:()=>true});
globalThis.document={createElement:()=>({width:256,height:256,getContext:()=>context})} as unknown as Document;
globalThis.window={location:{href:'https://rpg-isomaptric.vercel.app/?world=dubai'},localStorage:{getItem:()=>null}} as unknown as Window & typeof globalThis;
const {createDubaiWorld}=await import('../src/worlds/dubai/world.ts');
const {canWalk,PLAYER_SPAWN,LANDMARKS,resolveTeleport,surfaceHeight,GROUND,WATER_HEIGHT}=await import('../src/layout.ts');
const {plotTouchesRoad}=await import('../src/cityPlan.ts');
const {dubaiLand,dubaiBridge,DUBAI_BRIDGES}=await import('../src/worlds/dubai/plan.ts');
const {plantingIssue}=await import('../src/sandbox.ts');
const scene=new T.Scene(),world=createDubaiWorld(scene);
const moving=new Set(world.traffic.cars.flatMap(c=>world.objects.models.get(c.object.id)!.obstacles));
const staticObstacles=world.obstacles.filter(o=>!moving.has(o));
console.log(`Dubai: ${world.towers.length} towers, ${world.homes.length} residences, ${world.objects.trees.size} trees, ${world.shrubs.count} shrubs, ${world.streetLamps.length} street lights, ${world.traffic.cars.length} vehicles.`);
test('Dubai shares a navigable shoreline between walking, teleport, planting and water impacts',()=>{
 assert.ok(canWalk(PLAYER_SPAWN.x,PLAYER_SPAWN.z,world.obstacles));
 for(const l of LANDMARKS)assert.ok(canWalk(l.visitX,l.visitZ,world.obstacles),`${l.id} arrival is occupied`);
 for(const [x,z] of [[-23,20],[104,10],[50,32]]){assert.equal(resolveTeleport(x,z,[]).valid,false);assert.equal(surfaceHeight(x,z),WATER_HEIGHT);assert.match(plantingIssue({x,z},{x:x-10,z},[],[])!,/dry ground/);}
 for(const [x,z] of [[0,120],[-120,0],[0,-120],[120,0]])assert.equal(surfaceHeight(x,z),WATER_HEIGHT,'Outer sea impacts use the water plane');
 for(const x of DUBAI_BRIDGES){assert.ok(resolveTeleport(x,32,[]).valid);assert.ok(surfaceHeight(x,32)>GROUND);assert.match(plantingIssue({x,z:32},{x:x-10,z:32},[],[])!,/bridge/);}
});
test('Dubai towers and sculptural waterfront buildings leave every road clear',()=>{
 assert.ok(world.towers.length>=25);assert.ok(world.homes.length>=25);
 assert.deepEqual([...new Set(world.roads.map(r=>r.width))].sort(),[3.2,4,4.7]);
 const conflicts=world.objects.state.objects.filter(o=>o.kind==='building'&&plotTouchesRoad(o,world.roads,.1));
 assert.deepEqual(conflicts.map(o=>`${o.name} at ${o.x}, ${o.z}`),[]);
 for(const route of world.traffic.routes)for(let d=0;d<route.length;d+=1){const p=route.sample(d).point;assert.ok(canWalk(p.x,p.z,staticObstacles,.65),`Traffic blocked at ${p.x}, ${p.z}`);}
});
test('Dubai geometry is finite and foliage / dynamic lighting remain batched',()=>{
 let meshes=0,uniqueTriangles=0;scene.traverse(o=>{if(o instanceof T.Mesh){meshes++;const p=o.geometry.getAttribute('position');for(const v of p.array)assert.ok(Number.isFinite(v));uniqueTriangles+=(o.geometry.index?.count??p.count)/3;}});
 assert.ok(world.objects.trees.size>=800);assert.ok(world.shrubs.count>=1200);assert.ok(world.streetLamps.length>=140);assert.equal(world.localLighting.slots.length,12);
 assert.ok(meshes<1500,`${meshes} meshes exceeds the London-scale budget`);assert.ok(uniqueTriangles<650000,`${uniqueTriangles} unique triangles`);
 console.log(`Dubai geometry: ${meshes} meshes, ${Math.round(uniqueTriangles)} unique triangles`);
});
test('Dubai shipping stays on water and clears all three actual bridge decks',()=>{
 scene.updateMatrixWorld(true);const triangles:T.Triangle[]=[];
 for(const root of world.bridgeRoots)root.traverse(o=>{if(!(o instanceof T.Mesh))return;const p=o.geometry.getAttribute('position'),idx=o.geometry.index;for(let i=0;i<(idx?.count??p.count);i+=3){const points=[0,1,2].map(j=>new T.Vector3().fromBufferAttribute(p,idx?idx.getX(i+j):i+j).applyMatrix4(o.matrixWorld));triangles.push(new T.Triangle(points[0],points[1],points[2]));}});
 const crossed=new Set<number>();
 for(let i=0;i<200;i++){world.update(i*1.1);for(const boat of world.boats){const p=boat.group.position;assert.ok(!dubaiLand(p.x,p.z),`Boat on land at ${p.x},${p.z}`);if(dubaiBridge(p.x,p.z)){const box=world.objects.models.get(boat.object.id)!.localBounds.clone().applyMatrix4(boat.group.matrixWorld);assert.ok(triangles.every(t=>!box.intersectsTriangle(t)),`Boat hits a bridge at ${p.x},${p.z}`);for(const x of DUBAI_BRIDGES)if(Math.abs(x-p.x)<3.4)crossed.add(x);}}}
 assert.equal(crossed.size,3);
});
test('Dubai traffic keeps moving with the character at the starting point',()=>{
 const start=world.traffic.cars.map(c=>c.distance);for(let frame=1;frame<=6000;frame++)world.update(300+frame*.1,PLAYER_SPAWN);
 world.traffic.cars.forEach((car,i)=>assert.ok(car.distance-start[i]>car.route.length*.7,`Car ${i} advanced ${car.distance-start[i]} of ${car.route.length}`));
});
test('destroyed palms release collision and reuse their own instance slots',()=>{
 const palm=[...world.objects.trees.values()].find(t=>t.species==='palm')!;const old=palm.index;
 world.objects.damage(palm.object,palm.object.maxHp,1000);assert.ok(!world.obstacles.includes(palm.obstacles[0]));
 const next=world.objects.addTree(palm.object.x,palm.object.z,.7,false,0,'palm')!;assert.equal(world.objects.trees.get(next.id)!.index,old);assert.ok(palm.object.destroyed);
});
test('all eight Dubai arrivals connect through the shared walking map',()=>{
 const origin={x:Math.round(PLAYER_SPAWN.x),z:Math.round(PLAYER_SPAWN.z)},queue=[origin],seen=new Set([`${origin.x},${origin.z}`]);
 for(let i=0;i<queue.length;i++)for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){
   const p={x:queue[i].x+dx,z:queue[i].z+dz},key=`${p.x},${p.z}`;
   if(!seen.has(key)&&canWalk(p.x,p.z,staticObstacles)){seen.add(key);queue.push(p);}
 }
 for(const l of LANDMARKS)assert.ok(queue.some(p=>Math.hypot(p.x-l.visitX,p.z-l.visitZ)<1.5),`${l.id} is disconnected`);
});
