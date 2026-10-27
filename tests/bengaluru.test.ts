import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
const context=new Proxy({}, {get:()=>()=>{},set:()=>true});
globalThis.document={createElement:()=>({width:256,height:256,getContext:()=>context})} as unknown as Document;
globalThis.window={location:{href:'https://rpg-isomaptric.vercel.app/?world=bengaluru'},localStorage:{getItem:()=>null}} as unknown as Window & typeof globalThis;
const {createBengaluruWorld}=await import('../src/worlds/bengaluru/world.ts');
const {PLAN,BENGALURU_LANDMARKS,PARK_PATHS}=await import('../src/worlds/bengaluru/plan.ts');
const {canWalk,resolveTeleport}=await import('../src/layout.ts');
const {plotTouchesRoad,roadClearance}=await import('../src/cityPlan.ts');
const scene=new T.Scene(),world=createBengaluruWorld(scene);
const moving=new Set(world.traffic.cars.flatMap(car=>world.objects.models.get(car.object.id)!.obstacles));
const fixed=world.obstacles.filter(o=>!moving.has(o));
const find=(id:string)=>BENGALURU_LANDMARKS.find(l=>l.id===id)!;
test('Bengaluru is an inland civic district with the correct landmark relationships',()=>{
 assert.equal(PLAN.waterVisible,false);assert.equal(world.water.visible,false);
 for(const [x,z] of [[0,0],[-90,90],[90,-90],[-100,-100]])assert.equal(PLAN.landAt(x,z),true);
 assert.equal(PLAN.landAt(108,0),false);assert.equal(PLAN.heightAt(0,0),1.35);
 assert.ok(find('vidhana-soudha').x<find('attara-kacheri').x);
 assert.ok(find('vikasa-soudha').z>find('vidhana-soudha').z);
 assert.ok(find('cubbon-park').z>find('attara-kacheri').z);
 assert.ok(find('government-museum').x>find('central-library').x);
 assert.ok(find('ub-city').z>find('government-museum').z);
 assert.equal(world.landmarkRoots.length,6);
});
test('Vidhana Soudha keeps its broad body and seven-dome hierarchy',()=>{
 const root=world.landmarkRoots.find(r=>r.userData.architecture==='neo-dravidian')!,size=new T.Box3().setFromObject(root).getSize(new T.Vector3());
 assert.equal(root.userData.smallDomes,6);assert.equal(root.userData.entranceColumns,12);
 assert.ok(size.z>size.y*3,'The broad legislature must not become a cathedral silhouette');
 assert.ok(size.x>25&&size.z>50,'The civic building must retain both wings and courts');
});
test('Bengaluru roads, arrivals and traffic leave building and tree footprints clear',()=>{
 assert.ok(canWalk(PLAN.spawn.x,PLAN.spawn.z,world.obstacles),'Spawn is obstructed');
 for(const l of BENGALURU_LANDMARKS){assert.ok(canWalk(l.visitX,l.visitZ,world.obstacles),`${l.id} arrival blocked`);assert.ok(resolveTeleport(l.visitX,l.visitZ,world.obstacles).valid);}
 const conflicts=world.objects.state.objects.filter(o=>o.kind==='building'&&plotTouchesRoad(o,world.roads,.05));
 assert.deepEqual(conflicts.map(o=>o.name),[]);
 for(const route of world.traffic.routes)for(let d=0;d<route.length;d+=.7){const p=route.sample(d).point;assert.ok(canWalk(p.x,p.z,fixed,.65),`Traffic blocked at ${p.x},${p.z}`);assert.ok(roadClearance(p,world.roads)<.7,`Traffic misses street at ${p.x},${p.z}`);}
 for(const tree of world.objects.state.objects.filter(o=>o.kind==='tree'))assert.ok(roadClearance(tree,PARK_PATHS)>.2,`Tree ${tree.id} blocks a park path`);
});
test('All Bengaluru landmark arrivals connect through the same walking map',()=>{
 const start={x:Math.round(PLAN.spawn.x),z:Math.round(PLAN.spawn.z)},queue=[start],seen=new Set([`${start.x},${start.z}`]);
 for(let i=0;i<queue.length;i++){const p=queue[i];for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){const x=p.x+dx,z=p.z+dz,key=`${x},${z}`;if(seen.has(key)||Math.abs(x)>105||Math.abs(z)>105||!canWalk(x,z,fixed,.35))continue;seen.add(key);queue.push({x,z});}}
 for(const l of BENGALURU_LANDMARKS)assert.ok(seen.has(`${Math.round(l.visitX)},${Math.round(l.visitZ)}`),`${l.id} is isolated`);
});
test('Bengaluru detail stays inside the bounded lighting and geometry budgets',()=>{
 let meshes=0,triangles=0;const geometries=new Set<T.BufferGeometry>();scene.traverse(o=>{if(o instanceof T.Mesh){meshes++;if(!geometries.has(o.geometry)){geometries.add(o.geometry);triangles+=(o.geometry.index?.count??o.geometry.getAttribute('position').count)/3;}}});
 assert.ok(meshes<1500,`${meshes} meshes`);assert.ok(triangles<650000,`${triangles} unique triangles`);
 assert.equal(world.localLighting.slots.length,12);assert.ok(world.objects.trees.size>=900);assert.ok(world.shrubs.count>=1000);assert.ok(world.homes.length>=25);assert.equal(new Set(world.homes.map(r=>r.userData.urbanStyle)).size,5);assert.ok(world.matureCanopies>=80,`${world.matureCanopies} mature canopy trees`);
 const soil=scene.getObjectByName('Bengaluru · inland red-soil civic district')!;assert.ok(new T.Box3().setFromObject(soil).min.y<=-18,'The inland cutaway needs a substantial soil section');
 assert.ok(world.localLighting.sources.length>70);assert.ok(world.groundGlows.mesh);
 console.log(`Bengaluru: ${meshes} meshes, ${triangles} unique triangles, ${world.objects.trees.size} trees, ${world.shrubs.count} shrubs, ${world.homes.length} blocks, ${world.streetLamps.length} lamps, ${world.matureCanopies} mature canopy trees.`);
});
