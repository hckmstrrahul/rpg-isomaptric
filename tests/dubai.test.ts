import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
const context=new Proxy({}, {get:()=>()=>{},set:()=>true});
globalThis.document={createElement:()=>({width:256,height:256,getContext:()=>context})} as unknown as Document;
globalThis.window={location:{href:'https://rpg-isomaptric.vercel.app/?world=dubai'},localStorage:{getItem:()=>null}} as unknown as Window & typeof globalThis;
const {createDubaiWorld}=await import('../src/worlds/dubai/world.ts');
const {canWalk,PLAYER_SPAWN,LANDMARKS,resolveTeleport,surfaceHeight,GROUND,WATER_HEIGHT}=await import('../src/layout.ts');
const {plotTouchesRoad}=await import('../src/cityPlan.ts');
const {dubaiLand,dubaiBridge,dubaiBridgeLift,DUBAI_BRIDGES,BAY,BAY_OUTLINE,MARINA_CRESCENT,MARINA_ROAD_RADIUS,DUBAI_PATHS}=await import('../src/worlds/dubai/plan.ts');
const {strokeSections,strokeGeometry,streetWidthAt}=await import('../src/worlds/dubai/surfaces.ts');
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
test('named Dubai landmarks survive placement and the museum has a genuine open void',()=>{
 const names=world.objects.state.objects.filter(o=>o.kind==='building').map(o=>o.name);
 for(const name of ['Burj Khalifa','Cayan Tower','Emirates Office Tower','Jumeirah Emirates Tower','Index Tower','Museum of the Future','Burj Al Arab'])assert.ok(names.includes(name),`${name} was rejected during placement`);
 const burj=world.towers.find(t=>t.userData.architecture==='burj')!,cayan=world.towers.find(t=>t.userData.architecture==='cayan')!;
 assert.equal(cayan.userData.twist,Math.PI/2);
 const height=(o:T.Object3D)=>new T.Box3().setFromObject(o).getSize(new T.Vector3()).y;
 assert.ok(world.towers.filter(t=>t!==burj).every(t=>height(burj)>height(t)*1.8));
 const shell=scene.getObjectByName('Continuous silver torus and elliptical void')!;scene.updateMatrixWorld(true);
 const origin=new T.Vector3(4.2,10.1,12).applyAxisAngle(new T.Vector3(0,1,0),shell.userData.elevationYaw).applyMatrix4(shell.matrixWorld),direction=new T.Vector3(0,0,-1).applyAxisAngle(new T.Vector3(0,1,0),shell.userData.elevationYaw).transformDirection(shell.matrixWorld);
 assert.equal(new T.Raycaster(origin,direction).intersectObject(shell,true).length,0,'The elliptical void is filled');
 const shellBounds=new T.Box3().setFromObject(shell);assert.ok(shellBounds.min.y<GROUND+1.8,'The shell floats above its mound');
 assert.ok(shellBounds.max.y-shellBounds.min.y>19,'The museum needs its enlarged silhouette');
});
test('Dubai tower finishes and night profiles vary within a bounded material palette',()=>{
 const finishes=new Set<string>(),profiles=new Set<string>(),maps=new Set<T.Texture>();
 for(const tower of world.towers)tower.traverse(child=>{
  if(!(child instanceof T.Mesh))return;
  for(const mat of (Array.isArray(child.material)?child.material:[child.material])){
   if(!mat.userData.dubaiFinish)continue;
   const facade=mat as T.MeshStandardMaterial;finishes.add(mat.userData.dubaiFinish);profiles.add(JSON.stringify(mat.userData.nightProfile));
   assert.ok(mat.userData.nightProfile.strength<=.58,'Window emission exceeds the restrained night palette');
   for(const map of [facade.map,facade.emissiveMap])if(map)maps.add(map);
  }
 });
 assert.equal(finishes.size,7);assert.ok(profiles.size>=10);assert.ok(maps.size<=28,`${maps.size} maps exceeds the shared texture budget`);
 console.log(`Dubai facade palette: ${finishes.size} finishes, ${profiles.size} profiles, ${maps.size} maps`);
});
test('marina shoreline, circular road and connected promenade share one centre',()=>{
 for(const p of BAY_OUTLINE)assert.ok(Math.abs(Math.hypot(p.x-BAY.x,p.z-BAY.z)-BAY.rx)<1e-8);
 for(const p of MARINA_CRESCENT.slice(24,146))assert.ok(Math.abs(Math.hypot(p.x-BAY.x,p.z-BAY.z)-MARINA_ROAD_RADIUS)<1e-8);
 for(const path of DUBAI_PATHS)for(const s of strokeSections(path.points,path.width))for(const p of [s.left,s.center,s.right])assert.ok(dubaiLand(p.x,p.z),`Promenade leaves dry land at ${p.x}, ${p.z}`);
 const quay=DUBAI_PATHS[0],arrival=DUBAI_PATHS[1];
 assert.ok(Math.abs(Math.hypot(arrival.points[0].x-BAY.x,arrival.points[0].z-BAY.z)-(BAY.rx+2.5))<1e-8);
 assert.equal(quay.points[0].x,89);assert.equal(quay.points.at(-1)!.x,89);assert.equal(arrival.points.at(-1)!.x,36);
 for(const path of DUBAI_PATHS)for(const p of path.points)assert.ok(canWalk(p.x,p.z,staticObstacles,.3),`Path is blocked at ${p.x}, ${p.z}`);
});
test('road joins use butt ends and continuous miters; bridge ramps carry the road surface',()=>{
 const sections=strokeSections([{x:0,z:0},{x:10,z:0},{x:10,z:10}],4);
 assert.equal(sections[0].left.x,0);assert.equal(sections[0].right.x,0);
 assert.equal(sections[2].left.z,10);assert.equal(sections[2].right.z,10);
 assert.deepEqual(sections[1].left,{x:12,z:-2});assert.deepEqual(sections[1].right,{x:8,z:2});
 const loop=strokeSections([{x:0,z:0},{x:10,z:0},{x:10,z:10},{x:0,z:10},{x:0,z:0}],4);assert.deepEqual(loop[0],loop.at(-1));
 const coast=world.roads.find(r=>r.id==='coastal-boulevard')!,road=strokeGeometry(coast.points,p=>streetWidthAt(coast,p),(x,z)=>GROUND+.07+dubaiBridgeLift(x,z)),p=road.getAttribute('position');
 let deckVertices=0;for(let i=0;i<p.count;i++)if(p.getX(i)>86&&p.getZ(i)>24&&p.getZ(i)<40){deckVertices++;assert.ok(Math.abs(p.getY(i)-(GROUND+.47))<1e-5);assert.ok(Math.abs(Math.abs(p.getX(i)-89)-2.35)<1e-5);}
 assert.ok(deckVertices>20,'Long straight bridge segment has no ramp/deck samples');road.dispose();
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
test('all Dubai arrivals connect through the shared walking map',()=>{
 const origin={x:Math.round(PLAYER_SPAWN.x),z:Math.round(PLAYER_SPAWN.z)},queue=[origin],seen=new Set([`${origin.x},${origin.z}`]);
 for(let i=0;i<queue.length;i++)for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){
   const p={x:queue[i].x+dx,z:queue[i].z+dz},key=`${p.x},${p.z}`;
   if(!seen.has(key)&&canWalk(p.x,p.z,staticObstacles)){seen.add(key);queue.push(p);}
 }
 for(const l of LANDMARKS)assert.ok(queue.some(p=>Math.hypot(p.x-l.visitX,p.z-l.visitZ)<1.5),`${l.id} is disconnected`);
});
test('twenty moored yachts remain in their berths while passing boats stay clear',()=>{
 assert.equal(world.mooredBoats.length,20);assert.equal(world.boats.filter(b=>b.group.userData.sailing).length,6);
 const moored=world.mooredBoats.map(b=>({boat:b,x:b.group.position.x,z:b.group.position.z}));
 for(let i=0;i<160;i++){
   world.update(1000+i*2);scene.updateMatrixWorld(true);
   const boxes=moored.map(({boat,x,z})=>{assert.equal(boat.group.position.x,x);assert.equal(boat.group.position.z,z);assert.ok(!dubaiLand(x,z));return world.objects.models.get(boat.object.id)!.localBounds.clone().applyMatrix4(boat.group.matrixWorld);});
   for(const boat of world.boats){const p=boat.group.position;if(boat.group.userData.sailing)assert.ok(!dubaiBridge(p.x,p.z));const box=world.objects.models.get(boat.object.id)!.localBounds.clone().applyMatrix4(boat.group.matrixWorld);assert.ok(boxes.every(berth=>!box.intersectsBox(berth)),'Passing boat clips a berth');assert.ok(world.marina.bounds.every(pier=>!box.intersectsBox(pier)),'Passing boat clips a pier');}
 }
});
