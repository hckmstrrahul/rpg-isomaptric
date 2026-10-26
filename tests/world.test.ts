import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { LANDMARKS, BRIDGES, HALF, RIVER_END, GROUND, PLAYER_SPAWN, bank, riverCenter, riverWidth, canWalk, walkStep } from '../src/layout.ts';
import { roadClearance, plotTouchesRoad, pointSegmentDistance, FLOWER_BEDS, ROAD_WIDTHS } from '../src/cityPlan.ts';
import { SOIL_DEPTH, TERRAIN_OUTLINE, insideTerrain } from '../src/boundary.ts';
import { setNightMaterials } from '../src/lighting.ts';
import { auditRoadSurfaces } from '../scripts/road-surface-checks.ts';

// Canvas is only used to paint facade textures during construction. A no-op drawing
// surface allows genuine Three.js geometry and navigation tests without a browser.
const context=new Proxy({}, { get:()=>()=>{}, set:()=>true });
globalThis.document={createElement:()=>({width:256,height:256,getContext:()=>context})} as unknown as Document;
const {createWorld,createCharacter}=await import('../src/world.ts');
const binBytes=readFileSync(new URL('../public/assets/nvidia/wheelie-bin.glb',import.meta.url));
const bin=(await new GLTFLoader().parseAsync(binBytes.buffer.slice(binBytes.byteOffset,binBytes.byteOffset+binBytes.byteLength),'' )).scene;
const scene=new THREE.Scene(),world=createWorld(scene,{bin,loaded:['wheelie-bin']});

test('landmark wall light comes from a visible attached lantern and switches off by day',()=>{
  const lanterns:THREE.Object3D[]=[];
  scene.traverse(object=>{if(object.name==='Wall-mounted lantern')lanterns.push(object);});
  assert.equal(lanterns.length,2);
  setNightMaterials(false);
  for(const lantern of lanterns){
    const light=lantern.children.find(child=>child instanceof THREE.PointLight) as THREE.PointLight;
    assert.ok(light&&lantern.children.some(child=>child instanceof THREE.Mesh));
    assert.equal(light.intensity,0);assert.ok(light.position.length()<1.1);
    assert.ok(lantern.parent?.parent===scene,'Fixture stays attached to its building');
  }
  setNightMaterials(true);
  for(const lantern of lanterns)assert.ok((lantern.children.find(child=>child instanceof THREE.PointLight) as THREE.PointLight).intensity>0);
  setNightMaterials(false);
});

test('night lighting covers neighborhood streets and ties house spill and rooftop beacons to their buildings',()=>{
  assert.ok(world.streetLamps.length>=180);
  assert.ok(world.streetLamps.filter(p=>p.x< -30).length>=50);
  assert.ok(world.streetLamps.filter(p=>p.x>40).length>=50);
  const lamps=world.objects.state.objects.filter(o=>o.name==='Street lantern');
  assert.equal(lamps.length,world.streetLamps.length);
  for(const lamp of lamps) {
    const model=world.objects.models.get(lamp.id)!.model;
    assert.ok(model.getObjectByName('Soft fixture halo'));
    const source=model.getObjectByName('Local night light source')!;
    assert.ok(source&&source.position.y>2.5&&source.position.y<2.8,'The light originates inside the lantern');
  }
  const houses=world.objects.state.objects.filter(o=>o.name==='Townhouse');
  for(const house of houses)assert.ok(world.objects.models.get(house.id)!.model.getObjectByName('Local night light source'));
  assert.equal(world.localLighting.slots.length,12);
  assert.equal(world.groundGlows.mesh.parent,scene);assert.equal(world.groundGlows.mesh.userData.nonSolid,true);
  assert.ok(world.beacons.length>=6);
  for(const beacon of world.beacons)assert.ok(beacon.parent?.userData.destructibleId&&beacon.position.y>=24);
});

test('every street endpoint joins another street, including all bridge approaches',()=>{
  for(const road of world.roads)for(const end of [road.points[0],road.points.at(-1)!])
    assert.ok(world.roads.some(other=>other!==road&&other.points.some((p,i)=>i&&pointSegmentDistance(end,other.points[i-1],p)<.01)),`Disconnected end of ${road.id}`);
});

test('every street corner is paved and the removed outer path exposes normal green terrain',()=>{
  const audit=auditRoadSurfaces(scene,world.roads);
  assert.ok(audit.cornerSamples>250&&audit.edgeSamples>80);
  assert.deepEqual(audit.failures,[]);
});

test('the city uses three consistent street widths and bridge approaches match their crossings',()=>{
  assert.deepEqual([...new Set(world.roads.map(road=>road.width))].sort((a,b)=>a-b),[3.2,4,4.7]);
  for(const road of world.roads)assert.equal(road.width,ROAD_WIDTHS[road.size]);
  for(const crossing of world.roads.filter(road=>road.bridge)){
    const z=crossing.points[0].z;
    const approaches=world.roads.filter(road=>road.id.startsWith('cross-')&&road.points.every(point=>point.z===z));
    for(const approach of approaches)assert.equal(approach.width,crossing.width,'A straight bridge approach must not pinch at the bank junction');
  }
});

test('gardens, circular structures, flower beds and buildings leave pavement clear',()=>{
  for(const site of [...world.gardens,...world.circularSites])
    assert.ok(roadClearance(site,world.roads,.85)>=site.r,`${site.id} overlaps a road or pavement`);
  for(const p of FLOWER_BEDS)assert.ok(!plotTouchesRoad({...p,w:7,d:4},world.roads,.85));
  for(const object of world.objects.state.objects.filter(o=>o.kind==='building')) {
    for(const plot of world.objects.models.get(object.id)!.obstacles)
      assert.ok(!plotTouchesRoad(plot,world.roads,.5),`${object.name} ground footprint blocks a street`);
    // The elevated wheel can overhang a road; its ground-level supports cannot.
    if(object.landmarkId!=='eye')assert.ok(!plotTouchesRoad(object,world.roads,.5),`${object.name} roof or trim overhangs a street`);
  }
});

test('lamps, benches and booths stay separate from roads and other static objects',()=>{
  const props=world.objects.state.objects.filter(o=>['Street lantern','Park bench','Telephone box','Wheelie bin','Fire hydrant'].includes(o.name));
  for(const p of props) {
    assert.ok(!plotTouchesRoad(p,world.roads,.15),`${p.name} blocks a street`);
    for(const o of world.objects.state.objects) {
      if(o===p||o.active===false||world.traffic.cars.some(car=>car.object===o))continue;
      const base=o.baseY??GROUND,propBase=p.baseY??GROUND;
      if(base+o.height<=propBase||propBase+p.height<=base)continue;
      assert.ok(Math.abs(o.x-p.x)>=(o.w+p.w)/2+.15||Math.abs(o.z-p.z)>=(o.d+p.d)/2+.15,`${p.name} ${p.id} touches ${o.name} ${o.id}`);
    }
  }
});

test('hydrants are distributed on both sides of the city clear of roads and arrivals',()=>{
  assert.ok(world.hydrants.length>=12);
  for(const side of [-1,1])assert.ok(world.hydrants.filter(p=>Math.sign(p.x)===side).length>=6);
  for(const p of world.hydrants){
    assert.ok(!plotTouchesRoad({...p,w:.9,d:.9},world.roads,.15));
    assert.ok(LANDMARKS.every(l=>Math.hypot(p.x-l.visitX,p.z-l.visitZ)>2.5));
  }
});

test('bridge-corner promenades cover the former grass wedges continuously',()=>{
  const ground=scene.getObjectByName('Terrain, streets and promenades')!,bridges=scene.children.filter(child=>['Tower Bridge','River arch bridge','City street surfaces'].includes(child.name));
  scene.updateMatrixWorld(true);
  const ray=new THREE.Raycaster();
  for(const bz of BRIDGES)for(const side of [-1,1])for(const direction of [-1,1]){
    for(let distance=2.4;distance<=5;distance+=.1)for(const margin of [.4,.95,1.5]){
      const z=bz+direction*distance,x=bank(z,side,margin);
      ray.set(new THREE.Vector3(x,GROUND+1,z),new THREE.Vector3(0,-1,0));
      const hit=ray.intersectObjects([ground,...bridges],true)[0];
      assert.ok(hit&&hit.point.y>GROUND+.08,`Unpaved bridge corner at ${x}, ${z}`);
    }
  }
});

test('road markings lie flush on the asphalt and never cast shadows',()=>{
  const paint:THREE.Mesh[]=[];scene.updateMatrixWorld(true);
  scene.traverse(o=>{if(o instanceof THREE.Mesh&&o.material.name==='Road paint · no cast shadows')paint.push(o);});
  assert.equal(paint.length,4,'Each bridge plus the city street batch has its own paint mesh');
  for(const mesh of paint){
    assert.equal(mesh.castShadow,false);
    const p=mesh.geometry.getAttribute('position');
    // Ramp creases can split a dash; check every painted triangle against the deck.
    for(let i=0;i<p.count;i+=3){
      const center=new THREE.Vector3();for(let j=i;j<i+3;j++)center.add(new THREE.Vector3().fromBufferAttribute(p,j));center.multiplyScalar(1/3).applyMatrix4(mesh.matrixWorld);
      const otherMeshes=mesh.parent!.children.filter(child=>child!==mesh);
      const hit=new THREE.Raycaster(center,new THREE.Vector3(0,-1,0)).intersectObjects(otherMeshes,true)[0];
      assert.ok(hit&&center.y-hit.point.y<.006,`Raised road paint at ${center.toArray()}`);
    }
  }
});

test('every textured roof face has the same undistorted slate scale',()=>{
  let roofs=0,faces=0;
  scene.traverse(object=>{
    if(!(object instanceof THREE.Mesh)||object.material.name!=='Overlapping slate roof tiles')return;
    roofs++;const p=object.geometry.getAttribute('position'),uv=object.geometry.getAttribute('uv');
    for(let i=0;i<p.count;i+=3){
      const a=new THREE.Vector3().fromBufferAttribute(p,i),ab=new THREE.Vector3().fromBufferAttribute(p,i+1).sub(a),ac=new THREE.Vector3().fromBufferAttribute(p,i+2).sub(a);
      const area=ab.cross(ac).length();if(area<1e-6)continue;
      const u=uv.getX(i),v=uv.getY(i),uvArea=Math.abs((uv.getX(i+1)-u)*(uv.getY(i+2)-v)-(uv.getX(i+2)-u)*(uv.getY(i+1)-v));
      assert.ok(Math.abs(uvArea/area-1/14.4)<1e-4,`Roof face has missing or stretched tiles (${uvArea/area})`);faces++;
    }
  });
  assert.ok(roofs>25&&faces>100);
});

test('terrain has straight rectangular edges and a thick cutout with an unbroken grassy bank surface',()=>{
  assert.equal(SOIL_DEPTH,18);
  for(let i=0;i<TERRAIN_OUTLINE.length;i++){
    const a=TERRAIN_OUTLINE[i],b=TERRAIN_OUTLINE[(i+1)%TERRAIN_OUTLINE.length];
    assert.ok(Math.abs(a.x)===108||Math.abs(a.z)===108,'Every perimeter point lies on a straight cut');
    assert.ok(a.x===b.x||a.z===b.z,'Perimeter segments never bend or cut diagonally across a corner');
  }
  assert.ok(insideTerrain(0,0));assert.ok(!insideTerrain(108,108));
  let bottom=0;scene.traverse(o=>{if(o instanceof THREE.Mesh&&o.material.name==='Natural cutsoil'){o.geometry.computeBoundingBox();bottom=o.geometry.boundingBox!.min.y;}});
  assert.equal(bottom,-SOIL_DEPTH);
  const ray=new THREE.Raycaster();scene.updateMatrixWorld(true);
  for(const [x,z]of [[-107,0],[107,0],[-90,-106],[80,106]]) {
    ray.set(new THREE.Vector3(x,GROUND+.5,z),new THREE.Vector3(0,-1,0));
    const grass=ray.intersectObjects(scene.children,true).find(hit=>hit.object instanceof THREE.Mesh&&hit.object.material.name==='Natural grass');
    assert.ok(grass&&Math.abs(grass.point.y-GROUND)<.02,`Missing grass surface at ${x},${z}`);
  }
});

test('the denser forest mixes saplings and mature trees without increasing its triangle budget',()=>{
  assert.ok(world.objects.trees.size>=900,'The initial scene should have roughly twice as many trees');
  const scales=[...world.objects.trees.values()].map(tree=>tree.scale.y);
  assert.ok(scales.filter(scale=>scale<.75).length>100);
  assert.ok(scales.filter(scale=>scale>1.2).length>30);
  const layers=[world.objects.forest,world.objects.foliage];
  const triangles=layers.reduce((sum,mesh)=>sum+(mesh.geometry.index?.count??mesh.geometry.attributes.position.count)/3,0);
  assert.ok(triangles<=1100);assert.ok(triangles*world.objects.trees.size<477*2456);
  const p=world.objects.foliage.geometry.attributes.position;
  for(let i=0;i<p.count;i++)assert.ok(Math.hypot(p.getX(i),p.getZ(i))<=1.40001,'Visible crowns stay inside their reserved footprint at every orientation');
});

test('the townhouses use varied roofs, wall palettes and building silhouettes',()=>{
  const homes=[...world.objects.models.values()].filter(binding=>binding.model.userData.houseStyle);
  const styles=homes.map(binding=>binding.model.userData.houseStyle);
  assert.ok(homes.length>25);
  assert.equal(new Set(styles.map(style=>style.roof)).size,4);
  assert.equal(new Set(styles.map(style=>style.palette)).size,6);
  assert.ok(new Set(styles.map(style=>style.roofColor)).size>=4);
  assert.ok(styles.filter(style=>style.split).length>=5);
  for(const {model} of homes){const bounds=new THREE.Box3().setFromObject(model);assert.ok(bounds.min.y>=GROUND-.001,'All parts sit on the plot');}
});

test('all city geometry is finite and the character spawns on accessible land', () => {
  let vertices=0,meshes=0;
  scene.traverse(object=>{
    if(object instanceof THREE.Mesh) {
      meshes++;
      const p=object.geometry.getAttribute('position');vertices+=p.count;
      for(const v of p.array)assert.ok(Number.isFinite(v),'Mesh must not contain invalid coordinates');
    }
  });
  assert.ok(vertices>100000,'City has detailed geometry');
  assert.ok(world.obstacles.length>75,'City includes neighborhoods as well as landmarks');
  assert.ok(canWalk(PLAYER_SPAWN.x,PLAYER_SPAWN.z,world.obstacles),'Spawn must be clear');
  assert.ok(Math.hypot(PLAYER_SPAWN.x,PLAYER_SPAWN.z)<12,'Spawn stays near the center of the world');
  assert.ok(roadClearance(PLAYER_SPAWN,world.roads)<0,'Spawn is on a road');
  console.log(`Scene: ${meshes} meshes, ${vertices.toLocaleString()} unique vertices, ${world.objects.state.objects.length} destructible objects.`);
});

test('each landmark has a valid arrival point', () => {
  for(const l of LANDMARKS)assert.ok(canWalk(l.visitX,l.visitZ,world.obstacles),`${l.name} arrival is obstructed`);
});

test('all three bridge centerlines remain open through static city geometry', () => {
  const moving=new Set(world.traffic.cars.flatMap(c=>world.objects.models.get(c.object.id)!.obstacles));
  const staticObstacles=world.obstacles.filter(o=>!moving.has(o));
  for(const z of BRIDGES) {
    const center=riverCenter(z),width=riverWidth(z);
    const start=center-width/2-6;
    const end=walkStep(start,z,width+12,0,staticObstacles);
    assert.ok(Math.abs(end.x-(center+width/2+6))<.1,`Bridge ${z} is blocked by city geometry`);
  }
});

test('no building footprint is placed inside the river', () => {
  const footprints=world.objects.state.objects.filter(o=>o.kind==='building').flatMap(o=>world.objects.models.get(o.id)?.obstacles??[]);
  for(const o of footprints)for(const z of [o.z-o.d/2,o.z,o.z+o.d/2]) {
    if(z>=RIVER_END)continue;
    const bankDistance=Math.abs(o.x-riverCenter(z))-o.w/2-riverWidth(z)/2;
    assert.ok(bankDistance>=-.5,`Building (${o.x}, ${o.z}) overlaps the river by ${-bankDistance}`);
  }
});

test('the visible river reaches the hard front cut without a land cap or floating trees',()=>{
  const geo=world.water.geometry;geo.computeBoundingBox();
  assert.equal(geo.boundingBox!.min.z,-HALF);assert.equal(geo.boundingBox!.max.z,HALF);
  const ray=new THREE.Raycaster();scene.updateMatrixWorld(true);
  for(const z of [98,100,104,106,107.5]) {
    const x=riverCenter(z);ray.set(new THREE.Vector3(x,15,z),new THREE.Vector3(0,-1,0));
    const hit=ray.intersectObjects(scene.children,true).find(hit=>hit.point.y<GROUND+1);
    assert.equal(hit?.object,world.water,`A terrain, road or footpath cap covers the river at ${z}`);
  }
  for(const tree of world.objects.state.objects.filter(o=>o.kind==='tree')) {
    assert.ok(Math.abs(tree.x-riverCenter(tree.z))>riverWidth(tree.z)/2,`Tree ${tree.id} is in the water`);
  }
});

test('all landmark arrivals can be reached from the starting area on foot', () => {
  // Flood-fill the actual collision map at one-unit spacing, including bridge widths.
  const queue:[number,number][]=[[PLAYER_SPAWN.x,PLAYER_SPAWN.z]],seen=new Set([`${PLAYER_SPAWN.x},${PLAYER_SPAWN.z}`]);
  for(let i=0;i<queue.length;i++) {
    const [x,z]=queue[i];
    for(const [dx,dz]of [[1,0],[-1,0],[0,1],[0,-1]]) {
      const nx=x+dx,nz=z+dz,key=`${nx},${nz}`;
      if(!seen.has(key)&&canWalk(nx,nz,world.obstacles)){seen.add(key);queue.push([nx,nz]);}
    }
  }
  for(const l of LANDMARKS){
    assert.ok(queue.some(([x,z])=>Math.hypot(x-l.visitX,z-l.visitZ)<1.5),`${l.name} cannot be reached on foot`);
  }
});

test('dynamic world updates and walking animation preserve finite transforms', () => {
  world.update(100);world.update(10000);
  const character=createCharacter();character.animate(200,true,true);
  for(const root of [scene,character.root])root.traverse(o=>{
    for(const v of [...o.position.toArray(),...o.quaternion.toArray()])assert.ok(Number.isFinite(v));
  });
});

test('the Eye rotates faster by day and theme changes keep its angle continuous',()=>{
  world.update(11000,undefined,false);const initial=world.eye.rotating.rotation.z;
  world.update(11001,undefined,false);const daylight=world.eye.rotating.rotation.z;
  world.update(11001,undefined,true);assert.equal(world.eye.rotating.rotation.z,daylight);
  world.update(11002,undefined,true);const night=world.eye.rotating.rotation.z;
  assert.ok(Math.abs(daylight-initial)>Math.abs(night-daylight)*2);
  assert.ok(Math.abs(daylight-initial)>Math.PI*2/60,'Daylight rotation takes less than a minute');
  assert.ok(Math.abs(night-daylight)>Math.PI*2/180,'Night rotation takes less than three minutes');
  for(const pod of world.eye.pods)assert.ok(Math.abs(pod.rotation.z+night)<1e-8,'Capsules stay level');
});

test('all traffic routes remain usable through the actual city and its landscaping',()=>{
  const start=world.traffic.cars.map(car=>car.distance);
  for(let frame=1;frame<=10000;frame++) {
    const time=10001+frame*.1;world.update(time,PLAYER_SPAWN);world.objects.update(time);
  }
  world.traffic.cars.forEach((car,i)=>assert.ok(car.distance-start[i]>car.route.length,`${car.object.name} ${i} must complete every corner of a full circuit`));
});

test('cars keep continuous position and direction through corners and the route seam',()=>{
  for(const route of world.traffic.routes) {
    let previous=route.sample(-.04);
    for(let distance=0;distance<route.length+.08;distance+=.04) {
      const next=route.sample(distance),step=next.point.distanceTo(previous.point);
      const turn=Math.abs(Math.atan2(Math.sin(next.yaw-previous.yaw),Math.cos(next.yaw-previous.yaw)));
      assert.ok(step>.038&&step<.042,'Lane sampling must not jump sideways or change travel speed at curve joins');
      assert.ok(turn<.065,'Heading must turn progressively, not snap to the next road segment');
      previous=next;
    }
  }
});

test('additional phone booths stay off roads and clear of landmark arrivals',()=>{
  const booths=world.objects.state.objects.filter(object=>object.name==='Telephone box');
  assert.ok(booths.length>=12,'Distribute more booths throughout the neighborhoods');
  for(const booth of booths) {
    for(const landmark of LANDMARKS)assert.ok(Math.hypot(booth.x-landmark.visitX,booth.z-landmark.visitZ)>2.5);
    for(const road of world.roads)for(let i=1;i<road.points.length;i++) {
      const a=road.points[i-1],b=road.points[i],dx=b.x-a.x,dz=b.z-a.z;
      const t=Math.max(0,Math.min(1,((booth.x-a.x)*dx+(booth.z-a.z)*dz)/(dx*dx+dz*dz||1)));
      assert.ok(Math.hypot(booth.x-a.x-dx*t,booth.z-a.z-dz*t)>road.width/2+.65,'A booth must not obstruct traffic');
    }
  }
});

test('the wheelie-bin trial places six imported props clear of landmark arrivals',()=>{
 assert.equal(world.bins.length,6);
 for(const bin of world.bins)for(const landmark of LANDMARKS)assert.ok(Math.hypot(bin.x-landmark.visitX,bin.z-landmark.visitZ)>2.5);
});

test('moving ships clear the decks, arch masonry and piers of every bridge',()=>{
  const bridgeRoots=scene.children.filter(root=>root.name==='Tower Bridge'||root.name==='River arch bridge');
  const triangles:THREE.Triangle[]=[];
  for(const root of bridgeRoots)root.traverse(object=>{
    if(!(object instanceof THREE.Mesh))return;const p=object.geometry.getAttribute('position'),idx=object.geometry.index;
    for(let i=0;i<(idx?.count??p.count);i+=3){
      const vertices=[0,1,2].map(j=>new THREE.Vector3().fromBufferAttribute(p,idx?idx.getX(i+j):i+j));
      if(Math.min(...vertices.map(v=>v.y))<1)triangles.push(new THREE.Triangle(...vertices as [THREE.Vector3,THREE.Vector3,THREE.Vector3]));
    }
  });
  const crossed=new Set<number>();let samples=0;
  for(let i=0;i<320;i++){
    world.update(20000+i*.5);
    for(const boat of world.boats){
      const bz=BRIDGES.find(z=>Math.abs(z-boat.group.position.z)<5);if(bz===undefined||!boat.group.visible)continue;
      crossed.add(bz);samples++;
      const binding=world.objects.models.get(boat.object.id)!,bounds=binding.localBounds.clone().applyMatrix4(boat.group.matrixWorld);
      for(const triangle of triangles)assert.ok(!bounds.intersectsTriangle(triangle),`Ship intersects bridge ${bz} at ${boat.group.position.toArray()} bounds ${bounds.min.toArray()} ${bounds.max.toArray()} triangle ${triangle.a.toArray()} ${triangle.b.toArray()} ${triangle.c.toArray()}`);
    }
  }
  assert.equal(crossed.size,3);assert.ok(samples>100);
});

test('river ships have moving water-level targets and remain sunk after destruction',()=>{
  world.update(12000);
  assert.equal(world.boats.length,22);assert.ok(world.boats.every(boat=>boat.object.kind==='boat'));
  const boat=world.boats.find(boat=>boat.group.visible)!;
  const initial={x:boat.object.x,z:boat.object.z};world.update(12001);
  assert.ok(Math.hypot(boat.object.x-initial.x,boat.object.z-initial.z)>.1);
  assert.ok(boat.object.baseY!<GROUND);
  const before=boat.group.position.clone(),hp=boat.object.maxHp;
  while(!boat.object.destroyed)world.objects.blast({x:boat.object.x,y:boat.object.baseY!+.5,z:boat.object.z},boat.object,12001);
  assert.ok(hp>0);assert.equal(boat.object.hp,0);
  world.update(12002);world.objects.update(12002);
  assert.equal(boat.group.visible,false);assert.equal(boat.group.position.x,before.x);assert.equal(boat.group.position.z,before.z);
  world.update(13000);world.objects.update(13000);assert.equal(boat.group.visible,false,'The river animation must never respawn a sunken ship');
});
