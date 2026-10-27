import * as T from 'three';
import {Builder,material,vec} from '../../geometry.ts';
import {riverMaterial,surfaceMaterial} from '../../nature.ts';
import {createTerrainBase} from '../../terrainBase.ts';
import {WorldObjects} from '../../interactables.ts';
import {createTraffic} from '../../traffic.ts';
import {BoatWakes} from '../../boatWakes.ts';
import {WATER_HEIGHT,type Obstacle} from '../../layout.ts';
import {ROAD_ASPHALT,roadDash} from '../../roadSurfaces.ts';
import {roadClearance,plotTouchesRoad} from '../../cityPlan.ts';
import {glowMaterial,lightHalo,lightPool,registerThemeColor} from '../../lighting.ts';
import {LocalNightLighting,localNightLight,createRooftopBeacon,updateRooftopBeacons} from '../../localNightLighting.ts';
import {NightGroundGlows} from '../../nightGroundGlows.ts';
import type {CityAssets} from '../../importedAssets.ts';
import type {Destructible} from '../../sandbox.ts';
import {strokeGeometry} from '../shared/surfaces.ts';
import {PLAN,CUT_HALF,NORTH_BANK,SOUTH_BANK,LAND,landHeight,heightAt,lisbonLand,lisbonBridge,lisbonRoads,LANDMARKS,SPAWN,GARDENS,TRAFFIC_LOOPS,shoreAt} from './plan.ts';
import {belemTower,jeronimos,padrao,cristoRei,maat,centralTejo,terraceRow,tagusBoat} from './architecture.ts';
import {ponte25DeAbril} from './bridge.ts';

export function createLisbonWorld(scene:T.Scene,_assets:CityAssets={loaded:[]}){
 let seed=59168;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;},range=(a:number,b:number)=>a+(b-a)*random();
 const terrain=new Builder(),streets=new Builder(),details=new Builder(),obstacles:Obstacle[]=[],roads=lisbonRoads(),objects=new WorldObjects(scene,obstacles),pools:T.Mesh<T.PlaneGeometry,T.MeshBasicMaterial>[]=[],beacons:T.Object3D[]=[],streetLamps:{x:number;z:number}[]=[],furniture:Obstacle[]=[];
 const pavement=registerThemeColor(new T.MeshStandardMaterial({roughness:.95}),'#c9c8b4','#737d7c');pavement.name='Lisbon · pale limestone calçada';
 const belem=LANDMARKS[0],onBelemApron=(x:number,z:number,margin=0)=>Math.abs(x-belem.x)<6.2+margin&&z>belem.z-4-margin&&z<shoreAt(x,NORTH_BANK)+margin;
 const base=createTerrainBase();base.scale(7/6,1,7/6);terrain.add(base,surfaceMaterial('cutsoil'));base.dispose();
 // Both banks are continuous sampled surfaces. The identical height function
 // controls walking, traffic, foliage, roads and light-wash projection.
 for(const [bank,north]of[[NORTH_BANK,true],[SOUTH_BANK,false]]as const){const p:number[]=[],uv:number[]=[],ind:number[]=[],nx=126,nz=64;
  for(let j=0;j<=nz;j++)for(let i=0;i<=nx;i++){const x=-CUT_HALF+i*2,edge=shoreAt(x,bank),z=edge+((north?-CUT_HALF:CUT_HALF)-edge)*j/nz;p.push(x,landHeight(x,z),z);uv.push(x/8,z/8);if(i<nx&&j<nz){const a=j*(nx+1)+i;ind.push(...(north?[a,a+1,a+nx+1,a+1,a+nx+2,a+nx+1]:[a,a+nx+1,a+1,a+1,a+nx+1,a+nx+2]));}}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ind);g.computeVertexNormals();terrain.add(g,surfaceMaterial('grass'));g.dispose();
  // Riverfront retaining wall has its real open estuary edge, no artificial island.
  const strip=new T.BufferGeometry(),v:number[]=[],idx:number[]=[];for(let i=0;i<=nx;i++){const x=-CUT_HALF+i*2,z=shoreAt(x,bank);v.push(x,-2.8,z,x,landHeight(x,z),z);if(i<nx){const a=i*2;idx.push(a,a+1,a+2,a+1,a+3,a+2);}}strip.setAttribute('position',new T.Float32BufferAttribute(v,3));strip.setIndex(idx);strip.computeVertexNormals();const wall=material('#b5aa8d');wall.side=T.DoubleSide;terrain.add(strip,wall);strip.dispose();
  const promenade=bank.map(q=>({x:q.x,z:q.z+(north?-1.35:1.35)})),geo=strokeGeometry(promenade,2.1,(x,z)=>landHeight(x,z)+.04);details.add(geo,pavement);geo.dispose();
 }
 // Close exposed terrain at the miniature's cut edges, including sloping hills.
 for(const polygon of LAND)for(let i=0;i<polygon.length;i++){const a=polygon[i],b=polygon[(i+1)%polygon.length];if(!((a.x===b.x&&Math.abs(a.x)===CUT_HALF)||(a.z===b.z&&Math.abs(a.z)===CUT_HALF)))continue;const n=Math.ceil(Math.hypot(b.x-a.x,b.z-a.z)/2);for(let j=0;j<n;j++){const x=a.x+(b.x-a.x)*(j+.5)/n,z=a.z+(b.z-a.z)*(j+.5)/n,h=landHeight(x,z)+2.8;terrain.box(x,h/2-2.8,z,Math.abs(b.x-a.x)/n+.02,h,Math.abs(b.z-a.z)/n+.02,'#999b7d');}}
 const ground=terrain.finish();ground.name='Lisbon and Almada · north/south Tagus banks';scene.add(ground);
 const river=riverMaterial(true),waterShape=new T.Shape([...NORTH_BANK,...SOUTH_BANK.slice().reverse()].map(p=>new T.Vector2(p.x,-p.z))),geo=new T.ShapeGeometry(waterShape);geo.rotateX(-Math.PI/2);const water=new T.Mesh(geo,river.material);water.position.y=WATER_HEIGHT;water.name='Lisbon · broad Tagus estuary';water.receiveShadow=true;scene.add(water);
 for(const road of roads){const y=(x:number,z:number)=>heightAt(x,z)+.065;
  const border=strokeGeometry(road.points,road.width+1.5,(x,z)=>y(x,z)-.026),asphalt=strokeGeometry(road.points,road.width,y);streets.add(border,pavement);streets.add(asphalt,ROAD_ASPHALT);border.dispose();asphalt.dispose();
  let distance=0,next=1.2;for(let i=1;i<road.points.length;i++){const a=road.points[i-1],b=road.points[i],dx=b.x-a.x,dz=b.z-a.z,len=Math.hypot(dx,dz);while(next<distance+len){const t=(next-distance)/len,x=a.x+dx*t,z=a.z+dz*t;if(roadClearance({x,z},roads.filter(r=>r!==road))>.45)roadDash(streets,x,y(x,z)+.006,z,.095,1.1,Math.atan2(dx,dz));next+=3.4;}distance+=len;}
 }
 scene.add(streets.finish());const bridge=ponte25DeAbril();scene.add(bridge);const bridgeRoots=[bridge];
 for(const z of [-26,23]){const beacon=createRooftopBeacon(z*.1);beacon.position.set(60+12*(z+78)/169,26.9,z);scene.add(beacon);beacons.push(beacon);}
 const blocked=(x:number,z:number,w:number,d:number,margin=0)=>obstacles.some(o=>Math.abs(o.x-x)<(o.w+w)/2+margin&&Math.abs(o.z-z)<(o.d+d)/2+margin);
 const arrivalClear=(x:number,z:number,r:number)=>[SPAWN,...LANDMARKS.map(l=>({x:l.visitX,z:l.visitZ}))].every(p=>Math.hypot(x-p.x,z-p.z)>r+2.7);
 const dry=(x:number,z:number,w:number,d:number,margin=.2)=>[-.5,0,.5].every(a=>[-.5,0,.5].every(b=>lisbonLand(x+a*w,z+b*d,margin)));
 const place=(root:T.Group,x:number,z:number,name:string,id?:string,kind:'building'|'prop'='building')=>{
  root.updateMatrixWorld(true);const local=new T.Box3().setFromObject(root),size=local.getSize(vec(0,0,0));const heights=[landHeight(x,z),...[-.5,.5].flatMap(a=>[-.5,.5].map(b=>landHeight(x+a*size.x,z+b*size.z)))],high=Math.max(...heights),low=Math.min(...heights);
  if(kind==='building'&&high-low>.08){const rotation=root.rotation.clone();root.rotation.set(0,0,0);root.updateMatrixWorld(true);const localBase=new T.Box3().setFromObject(root),ls=localBase.getSize(vec(0,0,0)),lc=localBase.getCenter(vec(0,0,0));root.rotation.copy(rotation);const f=new Builder();f.box(lc.x/root.scale.x,-(high-low)/(2*root.scale.y),lc.z/root.scale.z,ls.x/root.scale.x,(high-low+.1)/root.scale.y,ls.z/root.scale.z,'#c1baa7');root.add(f.finish());}
  root.position.set(x,high+.025,z);root.name=name;scene.add(root);root.updateMatrixWorld(true);const bounds=new T.Box3().setFromObject(root),s=bounds.getSize(vec(0,0,0)),c=bounds.getCenter(vec(0,0,0)),box={x:c.x,z:c.z,w:s.x,d:s.z};obstacles.push(box);const object=objects.registerModel(root,name,kind,[box],id);return {root,object,box};
 };
 const groundWash=(owner:T.Object3D,x:number,z:number,r:number,color:string,opacity=.06)=>{const pool=lightPool(r,color,opacity);pool.position.set(x,.1,z);pool.geometry.dispose();pool.geometry=new T.PlaneGeometry(r*2,r*2,8,8);pool.geometry.rotateX(-Math.PI/2);pool.rotation.x=0;owner.updateMatrixWorld(true);const p=pool.geometry.getAttribute('position'),idx=pool.geometry.index!,ok:boolean[]=[],point=new T.Vector3();for(let i=0;i<p.count;i++){point.set(x+p.getX(i),0,z+p.getZ(i));owner.localToWorld(point);ok.push(lisbonLand(point.x,point.z)||lisbonBridge(point.x,point.z));point.y=heightAt(point.x,point.z)+.11;owner.worldToLocal(point);p.setY(i,point.y-pool.position.y);}const triangles:number[]=[];for(let i=0;i<idx.count;i+=3)if([0,1,2].every(j=>ok[idx.getX(i+j)]))triangles.push(idx.getX(i),idx.getX(i+1),idx.getX(i+2));pool.geometry.setIndex(triangles);owner.add(pool);pools.push(pool);};
 const landmarkRoots:T.Group[]=[];const factories=[belemTower,jeronimos,padrao,maat,()=>new T.Group(),cristoRei];
 LANDMARKS.forEach((l,i)=>{if(i===4)return;const model=factories[i]();if(i===1)model.scale.set(.84,.84,.82);if(i===3)model.scale.set(.82,.82,.82);const root=place(model,l.x,l.z,l.name,l.id).root;landmarkRoots.push(root);for(const side of [-1,1]){const light=localNightLight('#f4d3a5',7,13,1.7);light.position.set(side*2,2,4.2);root.add(light);groundWash(root,side*2,4.6,5,'#f0c99b',.045);}});
 const power=place(centralTejo(),-14,-18,'Central Tejo · brick power station');landmarkRoots.push(power.root);
 // A stone quay joins the fortress footing to the existing river wall.
 // Keep the geographic landmark centre and bank outline unchanged.
 const apronPoints=[new T.Vector2(belem.x-6.2,-(belem.z-4)),new T.Vector2(belem.x+6.2,-(belem.z-4)),...Array.from({length:13},(_,i)=>{const x=belem.x+6.2-i*12.4/12;return new T.Vector2(x,-shoreAt(x,NORTH_BANK));})];
 const apron=new T.ShapeGeometry(new T.Shape(apronPoints));apron.rotateX(-Math.PI/2);const apronPosition=apron.getAttribute('position');for(let i=0;i<apronPosition.count;i++)apronPosition.setY(i,landHeight(apronPosition.getX(i),apronPosition.getZ(i))+.055);apron.computeVertexNormals();details.add(apron,pavement);apron.dispose();
 const apronNorth=belem.z-4,apronSouth=shoreAt(belem.x-6.2,NORTH_BANK);objects.plantingBlockers.push({x:belem.x,z:(apronNorth+apronSouth)/2,w:12.4,d:apronSouth-apronNorth});
 // Praça do Império's formal parterres and fountain remain an open forecourt.
 for(const [gx,gz,r]of GARDENS.map(p=>[p.x,p.z,p.r])){const g=new T.CircleGeometry(r,48);g.rotateX(-Math.PI/2);g.translate(gx,0,gz);const gp=g.getAttribute('position');for(let i=0;i<gp.count;i++)gp.setY(i,landHeight(gp.getX(i),gp.getZ(i))+.035);g.computeVertexNormals();details.add(g,pavement);g.dispose();details.ring(gx,landHeight(gx,gz)+.055,gz,r-.5,.35,'#e5dcc3');}
 const fountainX=-50,fountainZ=-13;details.cylinder(fountainX,landHeight(fountainX,fountainZ)+.2,fountainZ,2.5,.4,'#bebaa5',2.5,32);details.cylinder(fountainX,landHeight(fountainX,fountainZ)+.43,fountainZ,2.15,.05,material('#5d9f9b',.3),2.15,32);details.cylinder(fountainX,landHeight(fountainX,fountainZ)+.8,fountainZ,.18,1.1,'#d6d3be',.12,10);
 // Attached street walls sit parallel to real road corridors. Reuse four
 // complete row geometries; shared party walls remove the detached lawn grid.
 const rowCache=Array.from({length:4},(_,i)=>terraceRow(i)),homes:T.Object3D[]=[];
 const streetRows=roads.filter(r=>!r.bridge&&r.id!=='bridge-north-access');
 let rowIndex=0,terraceDwellings=0;
 for(const road of streetRows){
  const lengths:number[]=[0];for(let i=1;i<road.points.length;i++)lengths.push(lengths.at(-1)!+Math.hypot(road.points[i].x-road.points[i-1].x,road.points[i].z-road.points[i-1].z));
  const sample=(distance:number)=>{const i=Math.max(1,lengths.findIndex(d=>d>=distance)),a=road.points[i-1],b=road.points[i],t=(distance-lengths[i-1])/(lengths[i]-lengths[i-1]);return {x:a.x+(b.x-a.x)*t,z:a.z+(b.z-a.z)*t,dx:b.x-a.x,dz:b.z-a.z};};
  for(const side of [-1,1])for(let along=9;along<lengths.at(-1)!-8;){
   const type=(rowIndex+++(side>0?1:0))%4,source=rowCache[type],w=source.userData.rowWidth as number,d=source.userData.rowDepth as number,p=sample(along),len=Math.hypot(p.dx,p.dz),yaw=-Math.atan2(p.dz,p.dx)+(side>0?Math.PI:0),offset=road.width/2+d/2+Math.abs(p.dx*p.dz/(len*len))*w+1.4;
   const x=p.x-p.dz/len*offset*side,z=p.z+p.dx/len*offset*side,model=source.clone(true);model.rotation.y=yaw;model.updateMatrixWorld(true);const bounds=new T.Box3().setFromObject(model),size=bounds.getSize(vec(0,0,0)),box={x,z,w:size.x,d:size.z};along+=w+1.5;
   if(!dry(x,z,box.w,box.d,.4)||plotTouchesRoad(box,roads,.75)||blocked(x,z,box.w,box.d,.35)||!arrivalClear(x,z,Math.hypot(box.w,box.d)/2)||GARDENS.some(g=>Math.hypot(x-g.x,z-g.z)<g.r+Math.hypot(box.w,box.d)/2+.5))continue;
   const row=place(model,x,z,'Lisbon attached terrace row').root;homes.push(row);terraceDwellings+=source.userData.dwellings as number;
   const footpath=strokeGeometry([{x:x-Math.cos(yaw)*(w/2+.15),z:z+Math.sin(yaw)*(w/2+.15)},{x:x+Math.cos(yaw)*(w/2+.15),z:z-Math.sin(yaw)*(w/2+.15)}],d+.9,(xx,zz)=>landHeight(xx,zz)+.035);details.add(footpath,pavement);footpath.dispose();
  }
 }
 // Warm Portuguese street lanterns: proxy sources share the existing 12 lights.
 const lamp=(x:number,z:number)=>{if(!lisbonLand(x,z,.35)||lisbonBridge(x,z)||roadClearance({x,z},roads)<.75||blocked(x,z,.35,.35,.45)||!arrivalClear(x,z,.3)||streetLamps.some(p=>Math.hypot(x-p.x,z-p.z)<7))return;const b=new Builder();b.cylinder(0,1.65,0,.045,3.3,'#4c615a',.03,8);b.box(0,3.4,0,.32,.5,.32,'#50635a');b.box(0,3.4,.17,.24,.34,.035,glowMaterial('#f2d3a0',3));b.box(0,3.4,-.17,.24,.34,.035,glowMaterial('#f2d3a0',3));b.cylinder(0,3.75,0,.25,.25,'#4c615a',0,6);const root=place(b.finish(),x,z,'Lisbon street lantern',undefined,'prop').root;const light=localNightLight('#f4d1a0',7,14,1.8);light.position.set(0,3.4,0);root.add(light);const halo=lightHalo('#f0d2a0',2.2,.09);halo.position.set(0,3.4,0);root.add(halo);groundWash(root,0,0,5.5,'#f0cf9e',.065);streetLamps.push({x,z});};
 for(const road of roads.filter(r=>!r.bridge))for(let i=2;i<road.points.length-2;i+=7){const a=road.points[i],b=road.points[i+1],dx=b.x-a.x,dz=b.z-a.z,len=Math.hypot(dx,dz)||1,side=(i%2?1:-1),offset=road.width/2+1.1;lamp(a.x-dz/len*offset*side,a.z+dx/len*offset*side);}
 const tree=(x:number,z:number,scale:number)=>{const r=scale*1.45;if(!dry(x,z,r*2,r*2,.35)||onBelemApron(x,z,r)||roadClearance({x,z},roads)<r+1.1||blocked(x,z,r*2,r*2,.15)||!arrivalClear(x,z,r)||GARDENS.some(g=>Math.hypot(x-g.x,z-g.z)<g.r*.8))return false;if(objects.state.objects.some(o=>o.kind==='tree'&&Math.hypot(x-o.x,z-o.z)<1.8*scale))return false;objects.addTree(x,z,scale);return true;};
 for(let i=0;i<15000&&objects.trees.size<820;i++)tree(range(-104,104),range(-104,104),range(.48,.95));
 // Continue the same planted landscape across both cut-bank margins. These
 // clusters share the existing forest banks; they add no mesh/material bank.
 const edgeClusters=[[-114,-18],[-115,-57],[-111,-96],[-72,-115],[-24,-115],[25,-115],[73,-115],[114,-91],[114,-64],[-113,110],[-78,116],[-36,114],[7,116],[54,114],[98,115],[116,69]];
 let marginTrees=0;
 for(let i=0;i<7000&&marginTrees<340;i++){const center=edgeClusters[i%edgeClusters.length],angle=range(0,Math.PI*2),radius=Math.sqrt(random())*13,x=center[0]+Math.cos(angle)*radius,z=center[1]+Math.sin(angle)*radius;
  if(Math.max(Math.abs(x),Math.abs(z))<103||Math.max(Math.abs(x),Math.abs(z))>123)continue;
  if(tree(x,z,range(.58,1.05)))marginTrees++;
 }
 const shrubGeo=new T.IcosahedronGeometry(1,1),shrubs=new T.InstancedMesh(shrubGeo,material('#617847'),2000),matrix=new T.Matrix4(),q=new T.Quaternion();let shrubCount=0;
 const shrub=(x:number,z:number)=>{const r=range(.25,.6);if(!lisbonLand(x,z,r+.5)||onBelemApron(x,z,r)||roadClearance({x,z},roads)<r+1.05||blocked(x,z,r*2,r*2,.2)||!arrivalClear(x,z,r)||GARDENS.some(g=>Math.hypot(x-g.x,z-g.z)<g.r*.8))return false;matrix.compose(vec(x,landHeight(x,z)+r*.3,z),q,vec(r,r*.5,r*.85));shrubs.setMatrixAt(shrubCount,matrix);shrubs.setColorAt(shrubCount,new T.Color().setHSL(.19+random()*.07,.27+random()*.15,.34+random()*.13));shrubCount++;return true;};
 for(let i=0;i<16000&&shrubCount<1250;i++)shrub(range(-104,104),range(-104,104));
 for(let i=0;i<12000&&shrubCount<1800;i++){const x=range(-123.5,123.5),z=range(-123.5,123.5);if(Math.max(Math.abs(x),Math.abs(z))>104)shrub(x,z);}
 shrubs.count=shrubCount;shrubs.castShadow=true;shrubs.receiveShadow=true;shrubs.userData.nonSolid=true;shrubs.raycast=()=>{};shrubs.name='Lisbon · instanced Mediterranean groundcover';scene.add(shrubs);
 const rail=new Builder();for(const bank of [NORTH_BANK,SOUTH_BANK])for(let i=1;i<bank.length;i++){const a=bank[i-1],b=bank[i],n=Math.ceil(Math.hypot(b.x-a.x,b.z-a.z)/2.3);for(let j=0;j<n;j++){const p={x:a.x+(b.x-a.x)*j/n,z:a.z+(b.z-a.z)*j/n},p2={x:a.x+(b.x-a.x)*(j+1)/n,z:a.z+(b.z-a.z)*(j+1)/n},y=landHeight(p.x,p.z);rail.beam(vec(p.x,y,p.z),vec(p.x,y+.65,p.z),.035,'#5f7875',5);for(const h of [.35,.65])rail.beam(vec(p.x,y+h,p.z),vec(p2.x,landHeight(p2.x,p2.z)+h,p2.z),.025,'#85958a',5);}}
 const railings=rail.finish();scene.add(railings);scene.add(details.finish());
 const traffic=createTraffic(scene,objects,{loops:TRAFFIC_LOOPS,junctions:[{x:-80,z:-44},{x:-33,z:-49},{x:-8,z:-53},{x:39,z:-65},{x:43,z:81}],laneSign:-1,carsPerRoute:4,city:'Lisbon'});
 const wakes=new BoatWakes(scene),boats:{group:T.Group;object:Destructible;length:number;phase:number;speed:number;curve:T.CatmullRomCurve3}[]=[];
 // Open estuary routes stay clear of both banks and the two tower foundations.
 const boatPath=[[-99,39],[-72,29],[-36,17],[0,6],[39,-6],[92,-15],[98,0],[60,10],[20,24],[-19,37],[-57,49],[-92,58]];
 const curve=new T.CatmullRomCurve3(boatPath.map(([x,z])=>vec(x,WATER_HEIGHT,z)),true,'centripetal');
 for(let i=0;i<10;i++){const sail=i>5,group=tagusBoat(sail);scene.add(group);const object=objects.registerModel(group,sail?'Tagus sailing boat':'Tagus motor boat','boat');boats.push({group,object,length:3.3,phase:i/10,speed:sail?.0018:.0032,curve});}
 const localLighting=new LocalNightLighting(scene),groundGlows=new NightGroundGlows(scene,pools);
 const update=(time:number,player?:{x:number;z:number},_night=false)=>{river.time.value=time;objects.updateWind(time);traffic.update(time,player);for(const boat of boats){if(boat.object.destroyed)continue;const t=T.MathUtils.euclideanModulo(boat.phase+time*boat.speed,1),p=boat.curve.getPointAt(t),d=boat.curve.getTangentAt(t);boat.group.position.set(p.x,WATER_HEIGHT+.03+Math.sin(time+boat.phase*17)*.018,p.z);boat.group.rotation.y=Math.atan2(d.x,d.z);objects.syncModelPose(boat.object);wakes.emit(boat.object.id,boat.group.position,boat.group.rotation.y,boat.length,time);}wakes.update(time);};
 const updateLights=(dt:number,focus:T.Vector3,time:number,night:boolean,reduced=false)=>{groundGlows.update();localLighting.update(dt,focus,night);updateRooftopBeacons(beacons,time,night,reduced);};update(0);
 return {objects,roads,obstacles,water,river,traffic,boats,wakes,update,updateLights,updateClock:(_date=new Date())=>{},landmarks:LANDMARKS,localLighting,groundGlows,beacons,streetLamps,railings,furniture,bins:[],hydrants:[],gardens:GARDENS,circularSites:[],towers:landmarkRoots,homes,terraceDwellings,bridgeRoots,shrubs,plan:PLAN};
}
