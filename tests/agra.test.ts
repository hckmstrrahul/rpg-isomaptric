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
const {setNightMaterials}=await import('../src/lighting.ts');
const {TajVisitors}=await import('../src/worlds/agra/visitors.ts');
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
 const taj=scene.getObjectByName('Taj Mahal')!;taj.traverse(o=>{if(o instanceof T.Mesh)for(const mat of Array.isArray(o.material)?o.material:[o.material]){const m=mat as T.MeshStandardMaterial;if(m.emissiveMap)assert.ok(m.userData.agraMarble&&m.emissiveMap===m.map,'Taj must retain stone detail, not an office-window grid');assert.ok(!m.userData.glowStrength,'Taj must not use bright bulb materials');}});
 console.log(`Agra: ${world.homes.length} residences, ${world.objects.trees.size} trees, ${world.shrubs.count} shrubs, ${meshes} meshes, ${Math.round(triangles)} unique triangles, ${maps.size} maps, ${world.streetLamps.length} lamps.`);
});
test('night marble preserves carved contrast and restores its daytime finish without new lights',()=>{
 const stones=new Set<T.MeshStandardMaterial>();scene.getObjectByName('Taj Mahal')!.traverse(o=>{if(o instanceof T.Mesh)for(const mat of Array.isArray(o.material)?o.material:[o.material])if(mat.userData.agraMarble)stones.add(mat);});
 assert.equal(stones.size,2);const focus=new T.Vector3(0,2,0);
 setNightMaterials(false);world.updateLights(1,focus,0,false);
 const original=[...stones].map(m=>({material:m,color:m.color.getHex(),map:m.map}));
 for(const m of stones){assert.equal(m.emissiveIntensity,0);assert.equal(m.roughness,.68);assert.equal(m.metalness,0);}
 setNightMaterials(true);world.updateLights(1,focus,0,true);
 for(const m of stones){assert.ok(m.emissiveIntensity>.2&&m.emissiveIntensity<=.33);assert.ok(m.roughness>=.32&&m.roughness<.6);assert.equal(m.emissiveMap,m.map);}
 assert.ok([...stones].find(m=>m.userData.agraPolishedDome)!.roughness<[...stones].find(m=>!m.userData.agraPolishedDome)!.roughness);
 const lights:T.PointLight[]=[];scene.traverse(o=>{if(o instanceof T.PointLight)lights.push(o);});assert.equal(lights.length,12);
 setNightMaterials(false);world.updateLights(1,focus,0,false);
 for(const {material:m,color,map} of original){assert.equal(m.emissiveIntensity,0);assert.equal(m.roughness,.68);assert.equal(m.color.getHex(),color);assert.equal(m.map,map);}
 assert.ok(lights.every(light=>light.intensity===0));
});
test('moon reveal drives a gradual local Taj aura without brightening the dark portals',()=>{
 const focus=new T.Vector3(0,2,0),aura=world.moonAura;
 setNightMaterials(false);world.updateLights(1,focus,0,false);assert.equal(aura.mesh.visible,false);
 setNightMaterials(true);world.updateLights(.1,focus,0,true,false,0);assert.equal(aura.strength.value,0);
 world.updateLights(.1,focus,0,true,false,1);assert.ok(aura.strength.value>.1&&aura.strength.value<.4);
 const partial=aura.strength.value;for(let i=0;i<60;i++)world.updateLights(1/60,focus,i/60,true,false,1);assert.ok(aura.strength.value>partial&&aura.strength.value>.95);
 assert.equal(aura.mesh.material.depthWrite,false);assert.equal(aura.mesh.material.depthTest,true);assert.equal(aura.mesh.material.side,T.BackSide);
 scene.getObjectByName('Taj Mahal')!.traverse(o=>{if(o instanceof T.Mesh&&o.material instanceof T.MeshStandardMaterial&&!o.material.userData.agraMarble)assert.equal(o.material.emissiveIntensity===undefined?0:o.material.emissive.getHex(),0,'Doorways and carved recesses must not become luminous');});
 setNightMaterials(false);world.updateLights(.01,focus,0,false);assert.equal(aura.strength.value,0);assert.equal(aura.mesh.visible,false);
});
test('visitor paths connect real home doors to the gardens without cutting through buildings or water',()=>{
 const visitors=world.visitors;assert.equal(visitors.people.length,72);assert.equal(visitors.batches.length,4);assert.ok(visitors.plan.doors.length>=6);
 for(const {door,route} of visitors.plan.routes){
  assert.ok(world.homes.includes(door.home));assert.ok(new T.Box3().setFromObject(door.home).containsPoint(new T.Vector3(door.x,2,door.insideZ)));
  for(let distance=1.4;distance<route.length;distance+=.3)for(const side of [-.34,.34]){
    const p=route.sample(distance),x=p.x+Math.cos(p.yaw)*side,z=p.z-Math.sin(p.yaw)*side;
    assert.ok(agraLand(x,z,.15));assert.ok(canWalk(x,z,fixed,.14),`Visitor route crosses an obstacle at ${x.toFixed(2)},${z.toFixed(2)}`);
  }
 }
});
test('tourists walk all the way home at dusk, emerge gradually and handle repeated theme changes',()=>{
 const visitors=world.visitors;visitors.update(0,false,true);
 const groups=new Map<number,number>();for(const p of visitors.people)groups.set(p.group,(groups.get(p.group)??0)+1);assert.ok(new Set(groups.values()).size>=4,'Visitor groups must have varied sizes');
 for(const group of groups.keys()){const members=visitors.people.filter(p=>p.group===group);assert.equal(new Set(members.map(p=>p.station)).size,members.length,'Each visitor needs a separate viewing station');}
 for(let i=0;i<20;i++){
  const previous=visitors.people.map(p=>p.distance);visitors.update(.1,i%2===0,true);
  visitors.people.forEach((p,j)=>assert.ok(Math.abs(p.distance-previous[j])<=p.speed*.11,'Theme changes must never teleport a visitor'));
 }
 for(let i=0;i<7000;i++)visitors.update(.05,true,true);
 assert.equal(visitors.indoorCount,72);assert.ok(visitors.people.every(p=>p.distance===0&&Math.abs(p.point.z-p.door.insideZ)<.01));
 visitors.update(.1,false,true);assert.equal(visitors.indoorCount,72,'Dawn must not instantly repopulate the gardens');
 for(let i=0;i<40;i++)visitors.update(.1,false,true);
 assert.ok(visitors.indoorCount>0&&visitors.indoorCount<72,'Dawn departures should be staggered');
 for(let frame=0;frame<120;frame++){
  visitors.update(.1,false,true);
  for(const door of visitors.plan.doors){const entering=visitors.people.filter(p=>p.visible&&p.door===door&&p.distance<3.5);for(let i=0;i<entering.length;i++)for(let j=i+1;j<entering.length;j++)assert.ok(Math.hypot(entering[i].point.x-entering[j].point.x,entering[i].point.z-entering[j].point.z)>.27,'Visitors overlap while emerging through a shared home door');}
 }
 for(let i=0;i<3500;i++){
  visitors.update(.1,false,true);
  if(i%20===0)for(const p of visitors.people)if(p.visible&&p.distance>1.4)assert.ok(canWalk(p.point.x,p.point.z,fixed,.12),`A passing visitor left the clear route at ${p.point.x.toFixed(2)},${p.point.z.toFixed(2)}`);
 }
 assert.equal(visitors.indoorCount,0);
 assert.ok(visitors.people.every(p=>p.station-p.distance<3),'Returning day visitors must reach their viewing areas instead of queuing behind resting groups');
 for(const batch of visitors.batches){const stride=batch.geometry.getAttribute('visitorMotion');for(let i=0;i<stride.count;i++)assert.equal(stride.getY(i),0,'Reduced motion disables the gait animation');}
});
test('direct night loading starts residents indoors while subsequent theme changes remain gradual',()=>{
 const visitors=new TajVisitors(new T.Scene(),world.visitors.plan,[],[]);
 visitors.update(1/60,true,true);assert.equal(visitors.indoorCount,72);assert.ok(visitors.people.every(p=>p.distance===0));
 visitors.update(.1,false,true);assert.equal(visitors.indoorCount,72);
 for(let i=0;i<500;i++)visitors.update(.1,false,true);assert.ok(visitors.people.some(p=>p.visible));
 const positions=visitors.people.map(p=>p.distance);visitors.update(.1,true,true);
 visitors.people.forEach((p,i)=>assert.ok(Math.abs(p.distance-positions[i])<.08,'A later night toggle must not reinitialize visible tourists'));
});
test('additional street lights stay on clear sidewalks and keep their spill modest',()=>{
 const lamps=world.objects.state.objects.filter(o=>o.name==='Agra sidewalk light');assert.ok(lamps.length>=70,`${lamps.length} sidewalk lamps`);
 for(const lamp of lamps){const clearance=roadClearance(lamp,world.roads);assert.ok(clearance>=.45&&clearance<=.71,`Light entered a road or left its sidewalk at ${lamp.x},${lamp.z}`);assert.ok(agraLand(lamp.x,lamp.z,1));}
 for(const source of world.localLighting.sources)if(source.anchor.parent?.name==='Agra sidewalk light'){assert.ok(source.settings.power<=6.5);assert.ok(source.settings.range<=13);}
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
