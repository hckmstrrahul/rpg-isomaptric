import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
const context=new Proxy({}, {get:()=>()=>{},set:()=>true});
globalThis.document={createElement:()=>({width:256,height:256,getContext:()=>context})} as unknown as Document;
globalThis.window={location:{href:'https://rpg-isomaptric.vercel.app/?world=moon'},localStorage:{getItem:()=>null}} as unknown as Window & typeof globalThis;
const {createMoonWorld}=await import('../src/worlds/moon/world.ts');
const {PLAN,FICTIONAL,CRATERS,SERVICE_PATHS,lunarHeight}=await import('../src/worlds/moon/plan.ts');
const {canWalk,surfaceHeight,resolveTeleport}=await import('../src/layout.ts');
const scene=new T.Scene(),world=createMoonWorld(scene);
test('White lunar road guidance is brighter only at night and stays a single batch',async()=>{
 const {setNightMaterials}=await import('../src/lighting.ts');const matches:T.Mesh[]=[];
 scene.traverse(o=>{if(o instanceof T.Mesh&&!Array.isArray(o.material)&&o.material.name==='Lunar white guidance markers')matches.push(o);});
 assert.equal(matches.length,1);const mat=matches[0].material as T.MeshStandardMaterial;
 setNightMaterials(true);assert.equal(mat.emissiveIntensity,1.5);assert.ok(mat.emissive.r>.7&&mat.emissive.g>.8);
 setNightMaterials(false);assert.equal(mat.emissiveIntensity,0);assert.equal(matches[0].castShadow,false);
});
test('Moon Base is explicitly fictional, dry, and has eight connected engineering sites',()=>{
 assert.equal(FICTIONAL,true);assert.equal(world.fictional,true);assert.equal(PLAN.waterVisible,false);assert.equal(PLAN.moonVisible,false);assert.equal(world.water.visible,false);
 assert.equal(PLAN.landmarks.length,8);assert.ok(PLAN.landmarks.every(l=>/fictional/i.test(l.description)));assert.equal(world.traffic.cars.length,0);
});
test('Moon crater geometry and walking heights agree without floating service decks',()=>{
 const p=world.ground.geometry.getAttribute('position');for(let i=0;i<p.count;i+=137)assert.ok(Math.abs(p.getY(i)-lunarHeight(p.getX(i),p.getZ(i)))<1e-5);
 for(const crater of CRATERS.slice(0,5))assert.ok(lunarHeight(crater.x,crater.z)<1.35-1,'Major craters need a visible bowl');
 for(const path of SERVICE_PATHS)for(const p of path.points){assert.ok(Math.abs(lunarHeight(p.x,p.z)-1.35)<1e-9);assert.equal(surfaceHeight(p.x,p.z),1.35);}
 assert.ok(canWalk(PLAN.spawn.x,PLAN.spawn.z,world.obstacles));
 for(const l of PLAN.landmarks){assert.ok(canWalk(l.visitX,l.visitZ,world.obstacles),`${l.id} arrival blocked`);assert.equal(resolveTeleport(l.visitX,l.visitZ,world.obstacles).valid,true);}
});
test('Moon visits connect through the shared walking map',()=>{
 const start={x:PLAN.spawn.x,z:PLAN.spawn.z},queue=[start],seen=new Set([`${start.x},${start.z}`]);for(let i=0;i<queue.length;i++){const p=queue[i];for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){const x=p.x+dx,z=p.z+dz,k=`${x},${z}`;if(seen.has(k)||Math.abs(x)>105||Math.abs(z)>105||!canWalk(x,z,world.obstacles,.35))continue;seen.add(k);queue.push({x,z});}}
 for(const l of PLAN.landmarks)assert.ok(seen.has(`${l.visitX},${l.visitZ}`),`${l.id} is isolated`);
});
test('Planted lunar trees remain inside their instanced sealed greenhouse and preview',()=>{
 const tree=world.objects.addTree(-90,30,1,false,0)!;assert.equal(tree.name,'Sealed greenhouse tree');assert.ok(Math.abs(tree.baseY-lunarHeight(-90,30))<.15);
 const preview=world.objects.treePreviewGeometry;preview.computeBoundingBox();const bounds=preview.boundingBox!,size=bounds.getSize(new T.Vector3());assert.ok(size.x<=3.21&&size.z<=3.21);assert.ok(size.y>2.7&&bounds.min.y>=.47);
 const bank=scene.getObjectByName('Sealed greenhouse tree · crowns') as T.InstancedMesh;assert.ok(bank);assert.equal((bank.material as T.Material).transparent,true);assert.ok((bank.material as T.MeshPhysicalMaterial).opacity<=.25);
});
test('Moon detail preserves the geometry, instances, and restrained light budgets',()=>{
 let meshes=0,triangles=0;const geometries=new Set<T.BufferGeometry>();scene.traverse(o=>{if(o instanceof T.Mesh){meshes++;if(!geometries.has(o.geometry)){geometries.add(o.geometry);triangles+=(o.geometry.index?.count??o.geometry.getAttribute('position').count)/3;}}});
 assert.ok(meshes<900,`${meshes} meshes`);assert.ok(triangles<500000,`${triangles} unique triangles`);assert.equal(world.localLighting.slots.length,12);assert.ok(world.localLighting.sources.length>=6&&world.localLighting.sources.length<=8);assert.ok(world.rocks.count>=1800);
 console.log(`Moon Base: ${meshes} meshes, ${triangles} unique triangles, ${world.rocks.count} instanced rocks, ${world.localLighting.sources.length} local sources.`);
});

test('Lunar cutaway has outward-facing continuous sides beneath crater relief',()=>{
 const base=scene.getObjectByName('Moon bonus · exposed gray regolith cutaway')!;
 for(const [x,z] of [[130,0],[-130,0],[0,130],[0,-130]]){
  const ray=new T.Raycaster(new T.Vector3(x,-8,z),new T.Vector3(-x,0,-z).normalize());
  assert.ok(ray.intersectObject(base,true).length>0,'The cutaway wall must be visible from outside');
 }
 const minY=Math.min(...CRATERS.map(c=>lunarHeight(c.x,c.z)));
 assert.ok(minY<-5&&minY>-17,'Crater bowls need readable relief above the closed slab floor');
});

test('Explore picking reaches the bottom of a deep lunar crater',async()=>{
 const {projectTerrainRay}=await import('../src/teleport3d.ts');
 const crater=CRATERS[0],point=projectTerrainRay(new T.Ray(new T.Vector3(crater.x,60,crater.z),new T.Vector3(0,-1,0)));
 assert.ok(point&&Math.abs(point.y-lunarHeight(crater.x,crater.z))<1e-8);
 assert.equal(resolveTeleport(point!.x,point!.z,world.obstacles).valid,true);
});

test('Lunar minimap craters match the terrain and gold satellites sit on level service pads',()=>{
 assert.deepEqual(PLAN.map.craters,CRATERS);
 assert.equal(world.satellites.length,2);
 for(const satellite of world.satellites){
  satellite.updateMatrixWorld(true);const bounds=new T.Box3().setFromObject(satellite);
  assert.ok(Math.abs(bounds.min.y-lunarHeight(satellite.position.x,satellite.position.z))<.15,'Satellite feet must contact the service pad');
  let gold=false;satellite.traverse(o=>{if(!(o instanceof T.Mesh))return;for(const m of Array.isArray(o.material)?o.material:[o.material])if(m instanceof T.MeshStandardMaterial&&m.metalness>.75&&m.color.r>m.color.g*1.3&&m.color.g>m.color.b*1.5)gold=true;});
  assert.ok(gold,'Satellite body needs its gold metallic material');
 }
});
