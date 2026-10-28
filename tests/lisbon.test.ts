import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
const context=new Proxy({}, {get:()=>()=>{},set:()=>true});
globalThis.document={createElement:()=>({width:256,height:256,getContext:()=>context})} as unknown as Document;
globalThis.window={location:{href:'https://rpg-isomaptric.vercel.app/?world=lisbon'},localStorage:{getItem:()=>null}} as unknown as Window & typeof globalThis;
const {createLisbonWorld}=await import('../src/worlds/lisbon/world.ts');
const {PLAN,NORTH_BANK,SOUTH_BANK,shoreAt,BRIDGE,bridgeX,lisbonLand,lisbonBridge,PENA,landHeight,bridgeHeight,hillStreetZ,hillRoadGrade,PALACE_PATH_LENGTH,PALACE_TREADS,palaceStepHeight}=await import('../src/worlds/lisbon/plan.ts');
const {canWalk,surfaceHeight}=await import('../src/layout.ts');
const {plotTouchesRoad,roadClearance}=await import('../src/cityPlan.ts');
const scene=new T.Scene(),world=createLisbonWorld(scene),moving=new Set(world.traffic.cars.flatMap(c=>world.objects.models.get(c.object.id)!.obstacles)),staticObstacles=world.obstacles.filter(o=>!moving.has(o));
console.log(`Lisbon: ${world.homes.length} terrace rows (${world.terraceDwellings} dwellings), ${world.objects.trees.size} trees, ${world.shrubs.count} shrubs, ${world.streetLamps.length} lamps, ${world.traffic.cars.length} vehicles`);
test('Lisbon represents two geographic banks and correct landmark ordering',()=>{const byId=Object.fromEntries(PLAN.landmarks.map(l=>[l.id,l]));assert.ok(byId['belem-tower'].x<byId.jeronimos.x&&byId.jeronimos.x<byId.maat.x&&byId.maat.x<byId['ponte-25-abril'].x);assert.ok(byId['cristo-rei'].z>byId['ponte-25-abril'].z);for(let x=-100;x<100;x+=4){const n=shoreAt(x,NORTH_BANK),s=shoreAt(x,SOUTH_BANK);assert.ok(n<s-40);assert.ok(lisbonLand(x,n-2));assert.ok(lisbonLand(x,s+2));assert.equal(lisbonLand(x,(n+s)/2),false);}assert.equal(PLAN.map.land.length,2);});
test('spawn and landmark arrivals are clear and linked by the actual bridge',()=>{assert.ok(canWalk(PLAN.spawn.x,PLAN.spawn.z,world.obstacles),'spawn blocked');for(const l of PLAN.landmarks)assert.ok(canWalk(l.visitX,l.visitZ,world.obstacles),`${l.id} arrival blocked`);for(let z=BRIDGE.north.z;z<BRIDGE.south.z;z+=.5)assert.ok(canWalk(bridgeX(z),z,staticObstacles),`Bridge blocked at ${z}`);const origin={x:Math.round(PLAN.spawn.x),z:Math.round(PLAN.spawn.z)},queue=[origin],seen=new Set([`${origin.x},${origin.z}`]);for(let i=0;i<queue.length;i++)for(const[dx,dz]of[[1,0],[-1,0],[0,1],[0,-1]]){const p={x:queue[i].x+dx,z:queue[i].z+dz},key=`${p.x},${p.z}`;if(!seen.has(key)&&canWalk(p.x,p.z,staticObstacles)){seen.add(key);queue.push(p);}}for(const l of PLAN.landmarks)assert.ok(queue.some(p=>Math.hypot(p.x-l.visitX,p.z-l.visitZ)<1.5),`${l.id} disconnected`);});
test('buildings do not overlap roads and traffic follows clear routes',()=>{const conflicts=world.objects.state.objects.filter(o=>o.kind==='building'&&world.objects.models.get(o.id)!.obstacles.some(box=>plotTouchesRoad(box,world.roads,.1)));assert.deepEqual(conflicts.map(o=>`${o.name}: ${o.x},${o.z}, ${o.w}×${o.d}`),[]);for(const route of world.traffic.routes)for(let d=0;d<route.length;d+=1){const p=route.sample(d).point;assert.ok(canWalk(p.x,p.z,staticObstacles,.65),`Traffic blocked at ${p.x}, ${p.z}`);}});
test('terrain heights and instanced trees match walking elevation',()=>{for(const tree of world.objects.trees.values()){const matrix=new T.Matrix4();world.objects.forest.getMatrixAt(tree.index,matrix);const p=new T.Vector3().setFromMatrixPosition(matrix);assert.ok(Math.abs(p.y-surfaceHeight(tree.object.x,tree.object.z)-.08)<1e-5);}for(const l of PLAN.landmarks)assert.ok(Number.isFinite(PLAN.heightAt(l.visitX,l.visitZ)));});
test('Lisbon geometry is finite and uses bounded drawing and shared light pools',()=>{let meshes=0,triangles=0;scene.traverse(o=>{if(o instanceof T.Mesh){meshes++;const p=o.geometry.getAttribute('position');for(const v of p.array)assert.ok(Number.isFinite(v));triangles+=(o.geometry.index?.count??p.count)/3;}});console.log(`Lisbon geometry: ${meshes} meshes, ${Math.round(triangles)} triangles`);assert.ok(world.homes.length>=35);assert.ok(world.terraceDwellings>=140);assert.ok(world.objects.trees.size>=600);assert.ok(world.shrubs.count>=900);assert.equal(world.localLighting.slots.length,12);assert.ok(meshes<1500,`${meshes} meshes`);assert.ok(triangles<650000,`${triangles} triangles`);});
test('Tagus boats stay on the estuary and fit below the bridge',()=>{scene.updateMatrixWorld(true);for(let i=0;i<300;i++){world.update(i*2);for(const boat of world.boats){const p=boat.group.position;assert.ok(!lisbonLand(p.x,p.z),`Boat beached at ${p.x},${p.z}`);if(lisbonBridge(p.x,p.z)){const box=world.objects.models.get(boat.object.id)!.localBounds.clone().applyMatrix4(boat.group.matrixWorld);assert.ok(box.max.y<PLAN.heightAt(p.x,p.z)-1.5);}}}});
test('Lisbon traffic runs for ten simulated minutes around the starting player',()=>{const start=world.traffic.cars.map(c=>c.distance);let recent:number[]=[];for(let i=1;i<=6000;i++){world.update(600+i*.1,PLAN.spawn);if(i===5000)recent=world.traffic.cars.map(c=>c.distance);}world.traffic.cars.forEach((c,i)=>{assert.ok(c.distance-start[i]>c.route.length*.7,`Vehicle ${i} advanced only ${c.distance-start[i]} / ${c.route.length}`);assert.ok(c.distance-recent[i]>20,`Vehicle ${i} stopped flowing in the final 100 seconds`);});});
test('Lisbon water is clipped to the Tagus and both banks reach the cutaway edges',()=>{assert.ok(lisbonLand(120,-110));assert.ok(lisbonLand(-120,110));for(const [x,z]of[[0,-120],[0,120],[120,-90],[-120,-90],[-120,110],[120,110]]){const ray=new T.Raycaster(new T.Vector3(x,30,z),new T.Vector3(0,-1,0));assert.equal(ray.intersectObject(world.water).length,0,`False ocean behind a bank at ${x},${z}`);}const p=world.water.geometry.getAttribute('position');for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i);assert.ok(z>=shoreAt(x,NORTH_BANK)-.001&&z<=shoreAt(x,SOUTH_BANK)+.001);}});
test('MAAT has an opaque upward-facing ceramic roof across the glazed enclosure',()=>{const root=world.towers.find(r=>r.name==='MAAT · Belém waterfront')!;scene.updateMatrixWorld(true);const shells:T.Mesh[]=[];root.traverse(o=>{if(o instanceof T.Mesh&&!Array.isArray(o.material)&&o.material instanceof T.MeshStandardMaterial&&o.material.color.getHexString()==='e8e6d9')shells.push(o);});assert.ok(shells.length);for(const u of [-.7,0,.7])for(const v of [-.7,0,.7]){const p=root.localToWorld(new T.Vector3(u*9,10,v*4.1*Math.sqrt(1-u*u))),ray=new T.Raycaster(p,new T.Vector3(0,-1,0));assert.ok(ray.intersectObjects(shells).length,`Missing roof at ${u},${v}`);}});
test('Lisbon street fabric has dense low and tall housing, including both cut margins',()=>{assert.ok(new Set(world.homes.map(r=>r.userData.rowType)).size>=8);assert.ok(world.terraceDwellings>=800);assert.ok(world.homes.filter(r=>r.position.z< -100).length>=10);assert.ok(world.homes.filter(r=>r.position.z>100).length>=15);assert.ok(world.homes.some(r=>r.userData.rowType===6||r.userData.rowType===7));assert.ok(world.homes.every(r=>r.userData.dwellings>=2));assert.ok(world.homes.some(r=>Math.abs(r.rotation.y)>.1));});


test('every road ends at a cut edge or another road, with continuous bridge approach grades',()=>{
 const distance=(p:{x:number;z:number},a:{x:number;z:number},b:{x:number;z:number})=>{const dx=b.x-a.x,dz=b.z-a.z,t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.z-a.z)*dz)/(dx*dx+dz*dz)));return Math.hypot(p.x-a.x-t*dx,p.z-a.z-t*dz);};
 for(const road of world.roads)for(const end of [road.points[0],road.points.at(-1)!]){
  if(Math.abs(Math.max(Math.abs(end.x),Math.abs(end.z))-126)<.01)continue;
  assert.ok(world.roads.some(other=>other!==road&&other.points.some((p,i)=>i>0&&distance(end,other.points[i-1],p)<.01)),`${road.id} disconnected end at ${end.x},${end.z}`);
 }
 for(const p of [BRIDGE.north,BRIDGE.south])assert.ok(Math.abs(bridgeHeight(p.z)-landHeight(p.x,p.z))<.001,'Bridge curb jumps at land connection');
 assert.ok(world.traffic.routes.some(route=>Array.from({length:Math.ceil(route.length)},(_,i)=>route.sample(i).point).some(p=>!lisbonLand(p.x,p.z)&&lisbonBridge(p.x,p.z))),'No traffic crosses the bridge');
});
test('Pena is a labelled Sintra excursion with a grounded hill and clear arrival',()=>{
 const l=PLAN.landmarks.find(l=>l.id==='pena-palace')!,palace=world.towers.find(r=>r.name===l.name)!;assert.ok(l.name.includes('Sintra')&&l.description.includes('outside'));assert.ok(palace);assert.ok(landHeight(PENA.x,PENA.z)-landHeight(PENA.x+40,PENA.z)>9);assert.ok(canWalk(l.visitX,l.visitZ,staticObstacles));
 const box=new T.Box3().setFromObject(palace);assert.ok(box.max.y-box.min.y>20);assert.ok(box.min.x>-124&&box.min.z>-124);assert.ok(box.max.x< -65&&box.max.z< -82);
});
test('the mixed Tagus fleet includes one large ship and its full hull remains on water',()=>{
 assert.equal(world.boats.length,25);assert.equal(new Set(world.boats.map(b=>b.object.name)).size,6);assert.equal(world.boats.filter(b=>b.length>=14).length,1);
 for(let sample=0;sample<120;sample++){world.update(sample*5);for(const boat of world.boats){boat.group.updateMatrixWorld(true);const bounds=world.objects.models.get(boat.object.id)!.localBounds;for(const x of [bounds.min.x,bounds.max.x])for(const z of [bounds.min.z,bounds.max.z]){const p=boat.group.localToWorld(new T.Vector3(x,0,z));assert.ok(!lisbonLand(p.x,p.z),`${boat.object.name} hull clips shore at ${p.x},${p.z}`);}}}
});


test('Pena hill road, bridge landings and palace path stay above terrain without pavement overlap',async()=>{
 const {ROAD_ASPHALT}=await import('../src/roadSurfaces.ts');scene.updateMatrixWorld(true);
 for(const road of world.roads.filter(r=>r.id==='ajuda-hills'||r.bridge)){
 for(let i=1;i<road.points.length;i++){const a=road.points[i-1],b=road.points[i],dx=b.x-a.x,dz=b.z-a.z,len=Math.hypot(dx,dz);if(road.bridge?!lisbonLand(a.x,a.z):Math.hypot(a.x-PENA.x,a.z-PENA.z)>42)continue;
  const steps=road.bridge?[.15,.5,.85]:Array.from({length:Math.ceil(len/.15)},(_,j)=>(j+.5)/Math.ceil(len/.15));
  for(const t of steps)for(const offset of [-.49,-.25,0,.25,.49]){const x=a.x+dx*t-dz/len*road.width*offset,z=a.z+dz*t+dx/len*road.width*offset,ray=new T.Raycaster(new T.Vector3(x,70,z),new T.Vector3(0,-1,0)),asphalt=ray.intersectObject(world.streetRoot,true).filter(h=>(h.object as T.Mesh).material===ROAD_ASPHALT)[0],ground=ray.intersectObject(world.ground,true)[0];assert.ok(asphalt,`Missing hill asphalt at ${x},${z}`);assert.ok(asphalt.point.y>ground.point.y+.005,`Grass penetrates road by ${ground.point.y-asphalt.point.y} at ${x},${z}`);const pavement=ray.intersectObject(world.streetRoot,true).filter(h=>(h.object as T.Mesh).material instanceof T.MeshStandardMaterial&&(h.object as T.Mesh).material!==ROAD_ASPHALT);assert.ok(!pavement.some(h=>(h.object as T.Mesh).material.name.includes('calçada')),`Pavement covers asphalt at ${x},${z}`);}
  if(!road.bridge)for(const t of steps)for(const offset of [-.4,-.15,.15,.4]){const side=Math.sign(offset),distance=side*(road.width/2+Math.abs(offset)),x=a.x+dx*t-dz/len*distance,z=a.z+dz*t+dx/len*distance,ray=new T.Raycaster(new T.Vector3(x,70,z),new T.Vector3(0,-1,0)),curb=ray.intersectObject(world.streetRoot,true).find(h=>(h.object as T.Mesh).material.name.includes('calçada')||(h.object as T.Mesh).material===ROAD_ASPHALT),ground=ray.intersectObject(world.ground,true)[0];assert.ok(curb&&curb.point.y>ground.point.y+.001,`Curb penetrates terrain at ${x},${z}: ${curb?curb.point.y-ground.point.y:'missing'}`);}
 }
 }
 for(let i=1;i<world.palaceApproach.points.length;i++){const a=world.palaceApproach.points[i-1],b=world.palaceApproach.points[i],dx=b.x-a.x,dz=b.z-a.z,len=Math.hypot(dx,dz);for(let t=.05;t<1;t+=.1)for(const offset of [-.72,0,.72]){const x=a.x+dx*t-dz/len*offset,z=a.z+dz*t+dx/len*offset,ray=new T.Raycaster(new T.Vector3(x,70,z),new T.Vector3(0,-1,0)),walk=ray.intersectObject(world.palaceWalk)[0],ground=ray.intersectObject(world.ground,true)[0];assert.ok(walk&&walk.point.y>ground.point.y+.01,`Palace path buried at ${x},${z}`);}}
});


test('the rear hill cut wall follows the terrain edge continuously without stepped gaps',()=>{
 scene.updateMatrixWorld(true);
 world.cutWalls.traverse(object=>{if(!(object instanceof T.Mesh))return;const p=object.geometry.getAttribute('position');for(let i=0;i<p.count;i++)if(p.getY(i)>-2.7)assert.ok(Math.abs(p.getY(i)-landHeight(p.getX(i),p.getZ(i)))<.00002,'Cut-wall top does not meet a terrain boundary vertex');});
 for(let x=-117.3;x<-64;x+=.47){const x0=-126+Math.floor((x+126)/2)*2,t=(x-x0)/2,y=landHeight(x0,-126)*(1-t)+landHeight(x0+2,-126)*t;
  const below=new T.Raycaster(new T.Vector3(x,y-.015,-130),new T.Vector3(0,0,1),0,4.1),above=new T.Raycaster(new T.Vector3(x,y+.015,-130),new T.Vector3(0,0,1),0,4.1);
  assert.ok(below.intersectObject(world.cutWalls,true).length,`Missing wall immediately below the rear hill at ${x}`);assert.equal(above.intersectObject(world.cutWalls,true).length,0,`Wall protrudes above rear hill at ${x}`);
 }
});


test('the Sintra approach is gently graded and compact streets retain architectural variety',()=>{
 for(let x=-120;x<-55;x+=.25){const z=hillStreetZ(x),next=landHeight(x+.25,hillStreetZ(x+.25));assert.ok(Math.abs(next-landHeight(x,z))/.25<.03,'Hill street exceeds a gentle three-percent grade');for(const offset of [-1.8,0,1.8])assert.ok(Math.abs(landHeight(x,z+offset)-hillRoadGrade(x))<.035,'Graded road bench has a cross-slope bump');}
 assert.ok(world.roads.filter(r=>r.size==='small'&&r.id!=='ajuda-hills').every(r=>r.width===2.6));assert.ok(world.roads.filter(r=>r.size==='main').every(r=>r.width===3.2));assert.equal(world.civicRoots.length,2);assert.ok(world.civicRoots.every(r=>r.userData.architecturalStudy));assert.ok(world.hillRetaining.children.length);assert.ok(world.palaceSteps.children.length);
});


test('Pena stairs ascend monotonically with level treads and matching walking heights',()=>{
 scene.updateMatrixWorld(true);const a=world.palaceApproach.points[0],b=world.palaceApproach.points[1],ux=(b.x-a.x)/PALACE_PATH_LENGTH,uz=(b.z-a.z)/PALACE_PATH_LENGTH;let previous=-Infinity;
 for(const tread of PALACE_TREADS){assert.ok(tread.height>=previous-1e-7);assert.ok(previous===-Infinity||tread.height-previous<=.161);previous=tread.height;const s=(tread.start+tread.end)/2;
  for(const offset of[-.7,0,.7]){const x=a.x+ux*s-uz*offset,z=a.z+uz*s+ux*offset,ray=new T.Raycaster(new T.Vector3(x,60,z),new T.Vector3(0,-1,0)),hit=ray.intersectObject(world.palaceWalk)[0];assert.ok(hit,'Missing stair tread');assert.ok(Math.abs(hit.point.y-PLAN.heightAt(x,z))<.0001,'Rendered stair differs from walking height');assert.ok(Math.abs(hit.point.y-tread.height)<.0001,'Stair tread has transverse slope');}
 }
});


test('all outer stair edges clear the sampled support terrain',()=>{
 scene.updateMatrixWorld(true);const a=world.palaceApproach.points[0],b=world.palaceApproach.points[1],ux=(b.x-a.x)/PALACE_PATH_LENGTH,uz=(b.z-a.z)/PALACE_PATH_LENGTH,points=[{x:-58.515012,z:-81.620282},{x:-65.037136,z:-83.072937}];
 for(let s=.05;s<PALACE_PATH_LENGTH;s+=.1)for(const offset of[-.7,0,.7])points.push({x:a.x+ux*s-uz*offset,z:a.z+uz*s+ux*offset});
 for(const p of points){const ray=new T.Raycaster(new T.Vector3(p.x,60,p.z),new T.Vector3(0,-1,0)),tread=ray.intersectObject(world.palaceWalk)[0],ground=ray.intersectObject(world.ground,true)[0];assert.ok(tread&&ground);assert.ok(tread.point.y>ground.point.y+.005,`Terrain intersects stair edge at ${p.x},${p.z}: ${tread.point.y-ground.point.y}`);assert.ok(Math.abs(tread.point.y-PLAN.heightAt(p.x,p.z))<.0001);}
});

test('the waterfront campus follows the bank and leaves its promenade open',()=>{
 scene.updateMatrixWorld(true);const sites=world.towers.filter(r=>/MAAT|Central Tejo/.test(r.name));assert.equal(sites.length,2);
 for(const root of sites){const x=root.position.x,angle=-Math.atan2(shoreAt(x+4,NORTH_BANK)-shoreAt(x-4,NORTH_BANK),8);assert.ok(Math.abs(root.rotation.y-angle)<1e-8);root.traverse(o=>{if(!(o instanceof T.Mesh)||o.userData.nonSolid)return;const p=o.geometry.getAttribute('position');for(let i=0;i<p.count;i++){const v=o.localToWorld(new T.Vector3().fromBufferAttribute(p,i));assert.ok(shoreAt(v.x,NORTH_BANK)-v.z>2.4,`${root.name} interrupts the river path`);}});}
 for(let x=-23;x<12;x+=.25)assert.ok(canWalk(x,shoreAt(x,NORTH_BANK)-1.2,staticObstacles,.3),`Promenade blocked at ${x}`);
});

test('the hill parapet has a grounded, capped end before the stair bed',()=>{
 scene.updateMatrixWorld(true);const bounds=new T.Box3().setFromObject(world.hillRetaining);assert.ok(bounds.max.x< -70.7,'Parapet must stop before the stair support cut');
 for(let x=-118.75;x< -71.25;x+=.5){const z=hillStreetZ(x)-2.65,ray=new T.Raycaster(new T.Vector3(x,40,z),new T.Vector3(0,-1,0)),top=ray.intersectObject(world.hillRetaining)[0],floor=ray.intersectObject(world.ground).filter(h=>h.face!.normal.y>.5)[0];assert.ok(top&&floor,`Missing parapet or grounding at ${x}`);assert.ok(top.point.y-floor.point.y>.4&&top.point.y-floor.point.y<.85,`Floating or buried coping at ${x}`);}
});

test('residential relief has gentle shared road and walking heights',()=>{
 scene.updateMatrixWorld(true);const roadMeshes:T.Mesh[]=[];world.streetRoot.traverse(o=>{if(o instanceof T.Mesh)roadMeshes.push(o);});let variation=0;
 for(const road of world.roads.filter(r=>!r.bridge&&r.id!=='ajuda-hills'))for(let i=1;i<road.points.length;i+=2){const p=road.points[i],previous=road.points[i-1],length=Math.hypot(p.x-previous.x,p.z-previous.z);variation=Math.max(variation,Math.abs(landHeight(p.x,p.z)-landHeight(previous.x,previous.z)));assert.ok(Math.abs(landHeight(p.x,p.z)-landHeight(previous.x,previous.z))/length<.48,'Residential street is too steep');const ray=new T.Raycaster(new T.Vector3(p.x,40,p.z),new T.Vector3(0,-1,0)),hit=ray.intersectObjects(roadMeshes)[0];assert.ok(hit,'Missing residential street');assert.ok(Math.abs(hit.point.y-PLAN.heightAt(p.x,p.z))<.23,'Road disagrees with movement height');}
 assert.ok(variation>.2,'Residential terrain has no visible relief');assert.ok(world.traffic.routes.every(r=>r.laneOffset===.75));assert.equal(world.traffic.signals.junctions.length,13);
});

test('corner aprons contain swept wheels without growing the straight streets',async()=>{
 const network=[...world.roads,...world.cornerAprons],{ROAD_ASPHALT}=await import('../src/roadSurfaces.ts');scene.updateMatrixWorld(true);
 for(const route of world.traffic.routes)for(let d=0;d<route.length;d+=.5){const pose=route.sample(d),s=Math.sin(pose.yaw),c=Math.cos(pose.yaw);for(const side of[-1,1])for(const end of[-1,1]){const x=pose.point.x+c*.47*side+s*1.025*end,z=pose.point.z-s*.47*side+c*1.025*end;assert.ok(roadClearance({x,z},network)<.006,`Wheel envelope leaves asphalt at ${x},${z}`);}}
 for(const arc of world.cornerAprons){assert.ok(!world.objects.state.objects.some(o=>o.kind==='building'&&world.objects.models.get(o.id)!.obstacles.some(box=>plotTouchesRoad(box,[arc],.01))),'Turn apron clips a facade');for(let i=1;i<arc.points.length-1;i++){const p=arc.points[i],a=arc.points[i-1],b=arc.points[i+1],dx=b.x-a.x,dz=b.z-a.z,len=Math.hypot(dx,dz);for(const offset of[-.4,0,.4]){const width=world.cornerWidths.get(arc)![i],x=p.x-dz/len*width*offset,z=p.z+dx/len*width*offset,ray=new T.Raycaster(new T.Vector3(x,60,z),new T.Vector3(0,-1,0)),hit=ray.intersectObject(world.streetRoot).find(h=>(h.object as T.Mesh).material===ROAD_ASPHALT),floor=ray.intersectObject(world.ground)[0];assert.ok(hit,'Missing turn apron');if(floor)assert.ok(hit.point.y>floor.point.y+.003,'Turn apron intersects terrain');}
  for(const lane of[-.75,.75])for(const side of[-.47,.47])for(const end of[-1.025,1.025]){const x=p.x-dz/len*(lane+side)+dx/len*end,z=p.z+dx/len*(lane+side)+dz/len*end,ray=new T.Raycaster(new T.Vector3(x,60,z),new T.Vector3(0,-1,0));assert.ok(ray.intersectObject(world.streetRoot).some(h=>(h.object as T.Mesh).material===ROAD_ASPHALT),`Actual wheel corner misses tapered asphalt at ${x},${z}`);}
 }}
});
