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
const {Builder}=await import('../src/geometry.ts');
const {pitchedRoof}=await import('../src/worlds/bengaluru/architecture.ts');
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
 assert.ok(size.x>35&&size.z>60,'The enlarged civic building must retain both wings and courts');
 assert.equal(root.userData.entranceSteps,45);
});
test('Bengaluru roofs have visible outer slopes, gables and a seated underside',()=>{
 const builder=new Builder();pitchedRoof(builder,0,3,0,8,10,2);const roof=builder.finish();roof.updateMatrixWorld(true);
 for(const x of [-2,2]){
  const hit=new T.Raycaster(new T.Vector3(x,8,0),new T.Vector3(0,-1,0)).intersectObject(roof,true)[0];
  assert.ok(hit&&Math.abs(hit.point.y-4)<.001,'An exterior slope must be visible from above');assert.ok(hit.face!.normal.y>0);
 }
 for(const side of [-1,1]){
  const hit=new T.Raycaster(new T.Vector3(0,4,side*10),new T.Vector3(0,0,-side)).intersectObject(roof,true)[0];
  assert.ok(hit&&Math.abs(hit.point.z-side*5)<.001,'Both gables must close the roof');assert.ok(hit.face!.normal.z*side>0);
 }
 const underside=new T.Raycaster(new T.Vector3(0,0,0),new T.Vector3(0,1,0)).intersectObject(roof,true)[0];
 assert.ok(underside&&underside.point.y<=3&&underside.face!.normal.y<0,'The eave must close against the wall below');
});
test('Every Bengaluru street joins another street or reaches the land cut',()=>{
 const edge=(p:{x:number;z:number})=>Math.abs(p.x)===108||Math.abs(p.z)===108;
 for(const road of world.roads)for(const endpoint of [road.points[0],road.points.at(-1)!]){
  assert.ok(edge(endpoint)||roadClearance(endpoint,world.roads.filter(other=>other!==road))<-.5,`${road.id} ends in grass at ${endpoint.x},${endpoint.z}`);
 }
 for(const [axis,sign] of [['x',-1],['x',1],['z',-1],['z',1]] as const)assert.ok(world.roads.some(road=>road.points.some(p=>p[axis]===sign*108)),`No road reaches the ${axis} ${sign} cut edge`);
});
test('Bengaluru roads, arrivals and traffic leave building and tree footprints clear',()=>{
 assert.ok(canWalk(PLAN.spawn.x,PLAN.spawn.z,world.obstacles),'Spawn is obstructed');
 assert.ok(Math.hypot(PLAN.spawn.x,PLAN.spawn.z)<10,'The default arrival belongs near the centre of the district');
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
 assert.equal(world.localLighting.slots.length,12);assert.ok(world.objects.trees.size>=900);assert.ok(world.shrubs.count>=1000);assert.ok(world.homes.length>=25);assert.ok(new Set(world.homes.map(r=>r.userData.urbanStyle)).size>=7);assert.ok(world.matureCanopies>=80,`${world.matureCanopies} mature canopy trees`);
 assert.ok(world.homes.filter(root=>root.userData.highRise&&new T.Box3().setFromObject(root).getSize(new T.Vector3()).y>18).length>=3,'The perimeter needs a modest mix of taller office buildings');
 const soil=scene.getObjectByName('Bengaluru · inland red-soil civic district')!;assert.ok(new T.Box3().setFromObject(soil).min.y<=-18,'The inland cutaway needs a substantial soil section');
 assert.ok(world.localLighting.sources.length>70);assert.ok(world.groundGlows.mesh);
 console.log(`Bengaluru: ${meshes} meshes, ${triangles} unique triangles, ${world.objects.trees.size} trees, ${world.shrubs.count} shrubs, ${world.homes.length} blocks, ${world.streetLamps.length} lamps, ${world.matureCanopies} mature canopy trees.`);
});
test('Bengaluru vehicles and cyclists keep circulating without overlap for ten minutes',()=>{
 const cars=world.traffic.cars,start=cars.map(car=>car.distance),half:number[]=[];
 assert.ok(cars.length>=24);assert.ok(cars.filter(car=>car.kind==='bike').length>=3);
 const corners=(car:typeof cars[number])=>{
  const a=car.model.root.rotation.y,c=Math.cos(a),s=Math.sin(a);
  return [-1,1].flatMap(x=>[-1,1].map(z=>({x:car.object.x+x*car.model.width*.5*c+z*car.model.length*.5*s,z:car.object.z-x*car.model.width*.5*s+z*car.model.length*.5*c})));
 };
 const overlaps=(a:typeof cars[number],b:typeof cars[number])=>{
  if(Math.hypot(a.object.x-b.object.x,a.object.z-b.object.z)>a.model.length+b.model.length)return false;
  const aa=corners(a),bb=corners(b);
  for(const angle of [a.model.root.rotation.y,b.model.root.rotation.y])for(const axis of [{x:Math.cos(angle),z:-Math.sin(angle)},{x:Math.sin(angle),z:Math.cos(angle)}]){
   const p=aa.map(v=>v.x*axis.x+v.z*axis.z),q=bb.map(v=>v.x*axis.x+v.z*axis.z);
   if(Math.max(...p)<=Math.min(...q)||Math.max(...q)<=Math.min(...p))return false;
  }
  return true;
 };
 for(let tick=1;tick<=6000;tick++){
  world.traffic.update(tick*.1,PLAN.spawn);
  if(tick===3000)half.push(...cars.map(car=>car.distance));
  if(tick%5===0)for(let i=0;i<cars.length;i++)for(let j=i+1;j<cars.length;j++)assert.ok(!overlaps(cars[i],cars[j]),`Vehicles ${i} and ${j} overlap at ${tick/10}s`);
 }
 cars.forEach((car,i)=>{assert.ok(car.distance-start[i]>.7*car.route.length,`Vehicle ${i} failed to circulate`);assert.ok(car.distance-half[i]>.3*car.route.length,`Vehicle ${i} became stuck during the second half`);});
});
