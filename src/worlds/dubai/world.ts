import * as T from 'three';
import { Builder, material, vec } from '../../geometry.ts';
import { riverMaterial, surfaceMaterial } from '../../nature.ts';
import { createTerrainBase } from '../../terrainBase.ts';
import { WorldObjects } from '../../interactables.ts';
import { createTraffic } from '../../traffic.ts';
import { createYacht, createMarinaDocks, DOCK_ANGLES } from './marina.ts';
import { BoatWakes } from '../../boatWakes.ts';
import { GROUND, WATER_HEIGHT, LANDMARKS, PLAYER_SPAWN, surfaceHeight, bridgeLiftAt, type Obstacle } from '../../layout.ts';
import { ROAD_ASPHALT, roadDash } from '../../roadSurfaces.ts';
import { roadClearance, plotTouchesRoad } from '../../cityPlan.ts';
import { glowMaterial, lightHalo, lightPool, registerThemeColor } from '../../lighting.ts';
import { LocalNightLighting, localNightLight, createRooftopBeacon, updateRooftopBeacons } from '../../localNightLighting.ts';
import { NightGroundGlows } from '../../nightGroundGlows.ts';
import type { CityAssets } from '../../importedAssets.ts';
import type { Destructible } from '../../sandbox.ts';
import { dubaiRoads, dubaiLand, dubaiBridge, dubaiBridgeLift, ISLAND, LAND_OUTLINE, BAY, DUBAI_BRIDGES, DUBAI_GARDENS, TOWER_PLOTS, DUBAI_TRAFFIC_LOOPS, ellipse, bayPoint, DUBAI_PATHS, MARINA_PROMENADE } from './plan.ts';
import { museumOfFuture, burjAlArab } from './landmarks.ts';
import { strokeGeometry, streetWidthAt } from './surfaces.ts';
import { marinaTower, pearlPavilion, conservatory, palmResources, courtyardHouse } from './architecture.ts';

export function createDubaiWorld(scene:T.Scene,_assets:CityAssets={loaded:[]}) {
  let seed=40129;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  const range=(a:number,b:number)=>a+(b-a)*random();
  const terrain=new Builder(),streets=new Builder(),details=new Builder(),obstacles:Obstacle[]=[];
  const roads=dubaiRoads(),objects=new WorldObjects(scene,obstacles),beacons:T.Object3D[]=[],streetLamps:{x:number;z:number}[]=[],furniture:Obstacle[]=[];
  const pools:T.Mesh<T.PlaneGeometry,T.MeshBasicMaterial>[]=[];
  const pavement=registerThemeColor(new T.MeshStandardMaterial({roughness:.9}),'#c5bdab','#788186');pavement.name='Dubai limestone promenade';
  const grass=surfaceMaterial('grass'),sand=surfaceMaterial('sand');
  const base=createTerrainBase();base.scale(7/6,1,7/6);terrain.add(base,surfaceMaterial('cutsoil'));base.dispose();
  const shape=new T.Shape(LAND_OUTLINE.map(p=>new T.Vector2(p.x,-p.z)));shape.closePath();
  const solid=new T.ExtrudeGeometry(shape,{depth:GROUND-WATER_HEIGHT+.2,bevelEnabled:false});solid.rotateX(-Math.PI/2);solid.translate(0,WATER_HEIGHT-.2,0);
  terrain.add(solid,material('#b6b5a2'));solid.dispose();
  const lawn=new T.ShapeGeometry(shape);lawn.rotateX(-Math.PI/2);lawn.translate(0,GROUND+.004,0);
  const uv=lawn.getAttribute('uv'),pos=lawn.getAttribute('position');for(let i=0;i<uv.count;i++)uv.setXY(i,pos.getX(i)/8,pos.getZ(i)/8);
  terrain.add(lawn,grass);lawn.dispose();
  terrain.ribbon(LAND_OUTLINE,2.1,WATER_HEIGHT+.08,sand);
  terrain.ribbon(LAND_OUTLINE,.55,GROUND+.025,pavement);
  // A single reflective water surface serves ocean, bay and the shipping channel.
  const river=riverMaterial(true),waterGeo=new T.PlaneGeometry(252,252,1,1);waterGeo.rotateX(-Math.PI/2);
  const water=new T.Mesh(waterGeo,river.material);water.position.y=WATER_HEIGHT;water.name='Dubai · turquoise sea and open marina';water.receiveShadow=true;scene.add(water);
  for(const side of [-1,1])for(const axis of ['x','z'] as const){const face=new T.PlaneGeometry(252,1.6),mesh=new T.Mesh(face,material('#377f87',.68));mesh.position.set(axis==='x'?side*126:0,-2,axis==='z'?side*126:0);mesh.rotation.y=axis==='x'?side*Math.PI/2:side===1?0:Math.PI;scene.add(mesh);}
  for(const road of roads.filter(r=>!r.bridge)) {
    const height=(x:number,z:number)=>GROUND+.07+dubaiBridgeLift(x,z);
    const border=strokeGeometry(road.points,p=>streetWidthAt(road,p)+1.5,(x,z)=>height(x,z)-.035);
    const asphalt=strokeGeometry(road.points,p=>streetWidthAt(road,p),height);
    streets.add(border,pavement);streets.add(asphalt,ROAD_ASPHALT);border.dispose();asphalt.dispose();
    // Sample markings in metres, independent of curve tessellation and without shadows.
    let distance=0,next=1.2;
    for(let i=1;i<road.points.length;i++){
      const a=road.points[i-1],b=road.points[i],dx=b.x-a.x,dz=b.z-a.z,len=Math.hypot(dx,dz);if(!len)continue;
      while(next<distance+len){const t=(next-distance)/len,x=a.x+dx*t,z=a.z+dz*t;
        if(!road.bridge&&roadClearance({x,z},roads.filter(r=>r!==road&&!r.bridge))>.35)roadDash(streets,x,height(x,z)+.006,z,.105,1.15,Math.atan2(dx,dz));next+=3.5;
      }distance+=len;
    }
  }
  const bridgeRoots:T.Group[]=[];
  for(const x of DUBAI_BRIDGES){
    const b=new Builder();b.box(x,GROUND+.17,32,6.2,.5,16.3,'#bfc5bc');
    // The navigation lane is 16 m wide. Abutments sit on the dry banks, never in it.
    for(const z of [23.4,40.6])for(const side of [-1,1])b.box(x+side*2.5,0,z,.65,2.7,1,'#a7b6ad');
    for(const side of [-1,1]){
      const line=Array.from({length:33},(_,i)=>{const z=19.8+i*24.4/32;return vec(x+side*3.05,GROUND+.7+dubaiBridgeLift(x,z),z);});
      b.tube(line,.055,'#b9cece',32);for(let i=0;i<line.length;i+=2)b.beam(line[i].clone().add(vec(0,-.55,0)),line[i],.035,'#81999a',6);
    }
    const root=b.finish();root.name='Dubai harbour bridge';scene.add(root);bridgeRoots.push(root);
  }
  const groundRoot=terrain.finish();groundRoot.name='Dubai island · open harbour coastline';scene.add(groundRoot);
  const streetRoot=streets.finish();streetRoot.name='Dubai streets · continuous steel grey surfaces';scene.add(streetRoot);
  const dryFootprint=(x:number,z:number,w:number,d:number,margin=0)=>[-.5,0,.5].every(a=>[-.5,0,.5].every(b=>dubaiLand(x+a*w,z+b*d,margin)));
  const blocked=(x:number,z:number,w:number,d:number,pad=.5)=>obstacles.some(o=>Math.abs(x-o.x)<(w+o.w)/2+pad&&Math.abs(z-o.z)<(d+o.d)/2+pad);
  const arrivalClear=(x:number,z:number,r:number)=>Math.hypot(x-PLAYER_SPAWN.x,z-PLAYER_SPAWN.z)>r+2&&LANDMARKS.every(l=>Math.hypot(x-l.visitX,z-l.visitZ)>r+1.6);
  const place=(root:T.Object3D,x:number,z:number,name:string,kind:'building'|'prop'='building',id?:string)=>{
    root.position.set(x,GROUND+bridgeLiftAt(x,z),z);scene.add(root);
    const bounds=new T.Box3().setFromObject(root),size=bounds.getSize(vec(0,0,0)),center=bounds.getCenter(vec(0,0,0));
    const box={x:center.x,z:center.z,w:size.x,d:size.z};obstacles.push(box);
    const object=objects.registerModel(root,name,kind,[box],id);return {root,object,box};
  };
  const groundWash=(owner:T.Object3D,x:number,z:number,r:number,color:string,opacity=.07)=>{
    const pool=lightPool(r,color,opacity);pool.position.set(x,.11,z);
    // Clip the soft footprint to actual dry ground, including curved marina banks.
    pool.geometry.dispose();pool.geometry=new T.PlaneGeometry(r*2,r*2,10,10);pool.geometry.rotateX(-Math.PI/2);pool.rotation.x=0;
    owner.updateMatrixWorld(true);
    const p=pool.geometry.getAttribute('position'),index=pool.geometry.index!,valid:boolean[]=[],point=new T.Vector3();
    for(let i=0;i<p.count;i++){
      point.set(x+p.getX(i),0,z+p.getZ(i));owner.localToWorld(point);
      valid.push(dubaiLand(point.x,point.z)||dubaiBridge(point.x,point.z));
      point.y=surfaceHeight(point.x,point.z)+.11;owner.worldToLocal(point);
      p.setY(i,point.y-pool.position.y);
    }
    const triangles:number[]=[];for(let i=0;i<index.count;i+=3)if([0,1,2].every(j=>valid[index.getX(i+j)]))triangles.push(index.getX(i),index.getX(i+1),index.getX(i+2));
    pool.geometry.setIndex(triangles);owner.add(pool);pools.push(pool);
  };
  const buildingLight=(root:T.Object3D,w:number,d:number,color='#ffd9a4')=>{
    for(const side of [-1,1]){const anchor=localNightLight(color,8,14,1.8);anchor.position.set(side*w/2,2,d/2);root.add(anchor);groundWash(root,side*w*.3,d/2+1.5,5.5,color,.06);}
  };
  const towers:T.Object3D[]=[];
  for(const plot of TOWER_PLOTS){
    if(blocked(plot.x,plot.z,plot.w+1.4,plot.d+1.4,.35)||!dryFootprint(plot.x,plot.z,plot.w+1.4,plot.d+1.4)||plotTouchesRoad({...plot,w:plot.w+1.4,d:plot.d+1.4},roads,.2))continue;
    const {root}=place(marinaTower(plot),plot.x,plot.z,plot.name??'Marina tower','building',plot.landmark);
    const beacon=createRooftopBeacon(towers.length*.37);beacon.position.y=plot.h+(plot.design==='burj'?.05:plot.design==='emirates'?3.6:plot.design?0:plot.style===3?5.5:2.2);root.add(beacon);beacons.push(beacon);towers.push(root);buildingLight(root,plot.w,plot.d);
  }
  const petalModel=pearlPavilion();petalModel.scale.setScalar(1.35);
  const petal=place(petalModel,-72,59,'Pearl Pavilion','building','petal');buildingLight(petal.root,17,17,'#c9e2ee');
  const domeModel=conservatory();domeModel.rotation.y=Math.PI/2;domeModel.scale.set(.9,1.25,1.15);
  const dome=place(domeModel,9,68,'Harbour Conservatory','building','conservatory');buildingLight(dome.root,19,27,'#a6d8de');
  const museum=place(museumOfFuture(),52,62,'Museum of the Future','building','sails');buildingLight(museum.root,20,15,'#f4d7ac');
  const hotel=place(burjAlArab(),-78,25,'Burj Al Arab','building','burj-al-arab');buildingLight(hotel.root,14,14,'#c7e4f3');
  const hotelBeacon=createRooftopBeacon(.8);hotelBeacon.position.set(-3.5,46,0);hotel.root.add(hotelBeacon);beacons.push(hotelBeacon);
  for(const path of DUBAI_PATHS){const geo=strokeGeometry(path.points,path.width,GROUND+.04);details.add(geo,pavement);geo.dispose();}
  const quay=MARINA_PROMENADE;
  const marina=createMarinaDocks();scene.add(marina.root);
  const mooredBoats=marina.berths.map((berth,index)=>{
    const yacht=createYacht(berth.length,berth.sailing,true);yacht.root.position.set(berth.x,WATER_HEIGHT+.025,berth.z);yacht.root.rotation.y=berth.yaw;scene.add(yacht.root);
    const object=objects.registerModel(yacht.root,berth.sailing?'Moored sailing yacht':'Moored motor yacht','boat');
    return {group:yacht.root,object,length:yacht.length,phase:index*.7};
  });
  // Low-rise neighbourhoods occupy coherent courtyards outside the skyline core.
  const homes:T.Object3D[]=[];
  for(const [x,z] of [
    ...[-81,-73].flatMap(x=>[-33,-23,-13,-3,10,20,30,39].map(z=>[x,z])),
    ...[76,80].flatMap(x=>[-30,-13,0,14,55,65,79].map(z=>[x,z])),
    ...[-52,-42,-33].flatMap(x=>[61,72,81].map(z=>[x,z])),
    ...[53,61].flatMap(x=>[-14,-4,7,17].map(z=>[x,z])),
    ...[42,50,58,66,74].map(x=>[x,81]),
    ...[-82,-72,-58,-45,-32,-18,-5,8,22,35,48,61,75].map(x=>[x,-83]),
  ]){
    const w=6.6,d=6;
    if(!dryFootprint(x,z,w,d,.5)||plotTouchesRoad({x,z,w,d},roads,.9)||blocked(x,z,w,d,1)||!arrivalClear(x,z,5))continue;
    const home=place(courtyardHouse(homes.length),x,z,'Marina courtyard residence');homes.push(home.root);buildingLight(home.root,w,d,'#ffdaaa');
  }
  // Walkable limestone forecourts give the special buildings their own setting.
  details.ring(-72,GROUND+.025,59,15.5,.7,'#e0d7be');
  const terrace=ellipse(9,68,22.5,13.5,96);details.ribbon(terrace,.8,GROUND+.028,pavement);
  // Modern slender lamps use the same 12-light pool and one batched wash as London.
  const lamp=(x:number,z:number)=>{
    if(!arrivalClear(x,z,.35)||(!dubaiLand(x,z,.35)&&!dubaiBridge(x,z))||roadClearance({x,z},roads)<.18||roadClearance({x,z},DUBAI_PATHS)<.15||blocked(x,z,.35,.35,.3)||streetLamps.some(p=>Math.hypot(x-p.x,z-p.z)<6.5))return;
    const b=new Builder();b.cylinder(0,1.65,0,.045,3.3,'#647b7d',.035,8);b.box(.23,3.3,0,.55,.075,.22,'#d7dcd1');b.box(.23,3.25,0,.4,.025,.16,glowMaterial('#ffe1b4',4.6));
    const {root}=place(b.finish(),x,z,'Marina street light','prop');
    const halo=lightHalo('#ffe4be',3,.13);halo.position.set(.23,3.25,0);root.add(halo);
    const source=localNightLight('#ffe4be',9,15,1.8);source.position.copy(halo.position);root.add(source);groundWash(root,0,0,7.2,'#ffdfb8',.085);streetLamps.push({x,z});
  };
  for(const road of roads.filter(r=>!r.bridge)){
    let distance=0,next=4,side=1;
    for(let i=1;i<road.points.length;i++){const a=road.points[i-1],b=road.points[i],dx=b.x-a.x,dz=b.z-a.z,len=Math.hypot(dx,dz);if(!len)continue;
      while(next<=distance+len){const t=(next-distance)/len,offset=road.width/2+.55,x=a.x+dx*t,z=a.z+dz*t;lamp(x-dz/len*offset*side,z+dx/len*offset*side);side*=-1;next+=12;}distance+=len;
    }
  }
  for(let i=1;i<quay.length-1;i+=5){const p=quay[i],length=Math.hypot(p.x-BAY.x,p.z-BAY.z);lamp(p.x+(p.x-BAY.x)/length*1.2,p.z+(p.z-BAY.z)/length*1.2);}
  // Palms and broadleaf trees are destructible, instanced and share live collision.
  const palms=palmResources();objects.registerTreeSpecies('palm',palms.trunk,palms.foliage,palms.bark,palms.leaves,'Date palm',5.25,4.4);
  const tree=(x:number,z:number,scale:number,palm=false)=>{
    const radius=(palm?2.2:1.4)*scale;
    if(!dubaiLand(x,z,radius+.4)||roadClearance({x,z},roads)<radius+.8||roadClearance({x,z},DUBAI_PATHS)<radius+.2||blocked(x,z,radius*2,radius*2,.3)||!arrivalClear(x,z,radius))return false;
    if(objects.state.objects.some(o=>!o.destroyed&&o.kind==='tree'&&Math.hypot(x-o.x,z-o.z)<(palm?2.5:1.8)*scale))return false;
    objects.addTree(x,z,scale,false,0,palm?'palm':'default');return true;
  };
  for(let i=0;i<ISLAND.length;i++){const p=ISLAND[i];tree(p.x*.958,p.z*.958,.78,i%2===0);}
  for(const road of roads.filter(r=>!r.bridge))for(let i=0;i<road.points.length;i+=4){const p=road.points[i],q=road.points[Math.min(i+1,road.points.length-1)],dx=q.x-p.x,dz=q.z-p.z,len=Math.hypot(dx,dz)||1;for(const side of [-1,1])tree(p.x-dz/len*5.6*side,p.z+dx/len*5.6*side,.7,true);}
  for(let i=0;i<18000&&objects.trees.size<1100;i++)tree(range(-96,96),range(-94,94),range(.5,1.1),i%7===0);
  // Shrub drifts share one instanced draw, never individual meshes or lights.
  const shrubGeo=new T.IcosahedronGeometry(1,1),shrubMat=material('#547d3e'),shrubs=new T.InstancedMesh(shrubGeo,shrubMat,2200),matrix=new T.Matrix4(),rotation=new T.Quaternion();let shrubCount=0;
  for(let i=0;i<13000&&shrubCount<1800;i++){
    const x=range(-96,96),z=range(-94,94),r=range(.25,.7);
    if(!dubaiLand(x,z,r+.25)||roadClearance({x,z},roads)<r+1.1||roadClearance({x,z},DUBAI_PATHS)<r+.2||blocked(x,z,r*2,r*2,.15)||!arrivalClear(x,z,r))continue;
    // Low groundcover remains traversable; tall trunks alone enter collision.
    matrix.compose(vec(x,GROUND+r*.3,z),rotation,vec(r,r*.5,r*.8));shrubs.setMatrixAt(shrubCount,matrix);shrubs.setColorAt(shrubCount,new T.Color().setHSL(.20+random()*.09,.26+random()*.25,.33+random()*.18));shrubCount++;
  }
  shrubs.count=shrubCount;shrubs.name='Dubai · instanced shrub drifts';shrubs.castShadow=true;shrubs.receiveShadow=true;shrubs.userData.nonSolid=true;shrubs.raycast=()=>{};scene.add(shrubs);
  // Simple continuous safety rails stop at every bridge approach.
  const rails=new Builder();
  for(let i=1;i<LAND_OUTLINE.length;i++){
    const a=LAND_OUTLINE[i-1],b=LAND_OUTLINE[i],len=Math.hypot(b.x-a.x,b.z-a.z),n=Math.max(1,Math.ceil(len/2.2));
    for(let j=0;j<n;j++){const t=j/n,u=(j+1)/n,x=a.x+(b.x-a.x)*t,z=a.z+(b.z-a.z)*t,cx=a.x+(b.x-a.x)*u,cz=a.z+(b.z-a.z)*u;
      if(DUBAI_BRIDGES.some(bx=>Math.min(Math.abs(x-bx),Math.abs(cx-bx))<3.6&&z>18&&z<46))continue;
      const radius=Math.hypot(x-BAY.x,z-BAY.z),angle=Math.atan2(z-BAY.z,x-BAY.x);
      if(Math.abs(radius-BAY.rx)<.5&&DOCK_ANGLES.some(a=>Math.abs(Math.atan2(Math.sin(angle-a),Math.cos(angle-a)))<.04))continue;
      rails.beam(vec(x,GROUND+.05,z),vec(x,GROUND+.75,z),.035,'#668181',6);for(const y of [.36,.74])rails.beam(vec(x,GROUND+y,z),vec(cx,GROUND+y,cz),.025,'#8da8a6',5);
    }
  }
  const railings=rails.finish();railings.name='Dubai · continuous waterfront railings';scene.add(railings);scene.add(details.finish());
  const traffic=createTraffic(scene,objects,{loops:DUBAI_TRAFFIC_LOOPS,junctions:[{x:-89,z:-67},{x:-89,z:-44},{x:89,z:-67},{x:89,z:-44},{x:36,z:-22},{x:68,z:-22},{x:68,z:47},{x:89,z:47}],laneSign:-1,carsPerRoute:6,city:'Dubai'});
  const wakes=new BoatWakes(scene),boats:{group:T.Group;object:Destructible;length:number;phase:number;speed:number;lane:number;curve:T.CatmullRomCurve3}[]=[];
  const harbourPath=[[-39,2],[-25,-7],[-10,1],[-5,16],[2,28],[40,30],[78,30],[103,29],[104,37],[77,35],[40,35],[3,35],[-13,27],[-28,27],[-40,20]];
  const outerPath=[[-104,-80],[-90,-104],[80,-104],[104,-80],[104,78],[79,104],[-78,104],[-104,80]];
  for(let i=0;i<18;i++){
    const sailing=i>=12,path=sailing?ellipse(BAY.x,BAY.z,10.5,11.5,32).slice(0,-1).map(p=>[p.x,p.z]):i<8?harbourPath:outerPath;
    const curve=new T.CatmullRomCurve3(path.map(([x,z])=>vec(x,0,z)),true,'centripetal');
    const boat=createYacht(sailing?3.4:3.8+(i%3)*.45,sailing);scene.add(boat.root);
    const object=objects.registerModel(boat.root,boat.root.name,'boat');boats.push({group:boat.root,object,length:boat.length,phase:sailing?(i-12)/6:i<8?i/8:(i-8)/4,speed:sailing?.004:i<8?.0045:.0016,lane:0,curve});
  }
  const localLighting=new LocalNightLighting(scene),groundGlows=new NightGroundGlows(scene,pools);
  const update=(time:number,player?:{x:number;z:number},night=false)=>{
    river.time.value=time;objects.updateWind(time);traffic.update(time,player);
    for(const boat of boats){if(boat.object.destroyed)continue;const t=T.MathUtils.euclideanModulo(boat.phase+time*boat.speed,1),p=boat.curve.getPointAt(t),tangent=boat.curve.getTangentAt(t);
      boat.group.position.set(p.x,WATER_HEIGHT+.025+Math.sin(time*1.1+boat.phase*20)*.018,p.z);boat.group.rotation.y=Math.atan2(tangent.x,tangent.z);boat.group.rotation.z=Math.sin(time*.7+boat.phase*10)*.012;objects.syncModelPose(boat.object);wakes.emit(boat.object.id,boat.group.position,boat.group.rotation.y,boat.length,time);
    }
    for(const boat of mooredBoats){if(boat.object.destroyed)continue;boat.group.position.y=WATER_HEIGHT+.025+Math.sin(time*.8+boat.phase)*.018;boat.group.rotation.z=Math.sin(time*.6+boat.phase)*.009;objects.syncModelPose(boat.object);}
    wakes.update(time);
  };
  const updateLights=(dt:number,focus:T.Vector3,time:number,night:boolean,reduced=false)=>{groundGlows.update();localLighting.update(dt,focus,night);updateRooftopBeacons(beacons,time,night,reduced);};
  update(0);
  return {obstacles,roads,objects,water,river,traffic,boats,wakes,update,updateLights,updateClock:(_date=new Date())=>{},landmarks:LANDMARKS,localLighting,groundGlows,beacons,streetLamps,railings,furniture,bins:[],hydrants:[],gardens:DUBAI_GARDENS,circularSites:[],towers,homes,bridgeRoots,shrubs,marina,mooredBoats};
}
