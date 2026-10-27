import * as T from 'three';
import {Builder,material,vec} from '../../geometry.ts';
import {surfaceMaterial,riverMaterial} from '../../nature.ts';
import {createTerrainBase} from '../../terrainBase.ts';
import {WorldObjects} from '../../interactables.ts';
import {createTraffic} from '../../traffic.ts';
import {GROUND,WATER_HEIGHT,type Obstacle} from '../../layout.ts';
import {roadClearance,plotTouchesRoad,type PlanPoint} from '../../cityPlan.ts';
import {ROAD_ASPHALT,roadDash} from '../../roadSurfaces.ts';
import {glowMaterial,lightHalo,lightPool} from '../../lighting.ts';
import {localNightLight,LocalNightLighting} from '../../localNightLighting.ts';
import {NightGroundGlows} from '../../nightGroundGlows.ts';
import {strokeGeometry} from '../shared/surfaces.ts';
import type {CityAssets} from '../../importedAssets.ts';
import {PLAN,CHARMINAR,GULZAR,MOSQUE,KAMANS,HYDERABAD_LANDMARKS,PATHS,TRAFFIC_LOOPS,hyderabadRoads} from './plan.ts';
import {charminar,meccaMasjid,kaman,khilwatMubarak,palaceWing,palaceClockGate,oldCityHouse,bazaarTerrace} from './architecture.ts';

export function createHyderabadWorld(scene:T.Scene,_assets:CityAssets={loaded:[]}) {
 let seed=1591;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;},range=(a:number,b:number)=>a+(b-a)*random();
 const obstacles:Obstacle[]=[],roads=hyderabadRoads(),objects=new WorldObjects(scene,obstacles),ground=new Builder(),detail=new Builder(),street=new Builder();
 const pools:T.Mesh<T.PlaneGeometry,T.MeshBasicMaterial>[]=[],homes:T.Object3D[]=[],towers:T.Object3D[]=[],streetLamps:PlanPoint[]=[];
 const paving=material('#c6bda7'),cream=material('#ded1ae'),lawn=surfaceMaterial('grass');
 const base=createTerrainBase();ground.add(base,surfaceMaterial('cutsoil'));base.dispose();
 // This is a terrestrial city crop. Soil and stone continue to its cut edges;
 // there is no surrounding ocean, decorative canal, island or misplaced Musi.
 ground.box(0,-.73,0,216,4.16,216,'#9b9685');ground.box(0,GROUND+.008,0,216,.016,216,material('#b3af97'));
 const river=riverMaterial(false),water=new T.Mesh(new T.PlaneGeometry(1,1),river.material);water.rotation.x=-Math.PI/2;water.position.y=WATER_HEIGHT;water.visible=false;water.name='Unused dry-world water contract';scene.add(water);
 for(const road of roads){const g=strokeGeometry(road.points,road.width+1.5,GROUND+.025);street.add(g,paving);g.dispose();}
 for(const road of roads){
  const g=strokeGeometry(road.points,road.width,GROUND+.07);street.add(g,ROAD_ASPHALT);g.dispose();let distance=0,next=1.5;
  for(let i=1;i<road.points.length;i++){const a=road.points[i-1],b=road.points[i],dx=b.x-a.x,dz=b.z-a.z,len=Math.hypot(dx,dz);while(next<distance+len){const t=(next-distance)/len,x=a.x+dx*t,z=a.z+dz*t;if(roadClearance({x,z},roads.filter(r=>r!==road))>.5)roadDash(street,x,GROUND+.076,z,.085,.85,Math.atan2(dx,dz));next+=3.8;}distance+=len;}
 }
 for(const path of PATHS){const g=strokeGeometry(path.points,path.width,GROUND+.075);detail.add(g,paving);g.dispose();}
 const place=(root:T.Object3D,x:number,z:number,name:string,id?:string,boxes?:Obstacle[],kind:'building'|'prop'='building')=>{
  root.position.set(x,GROUND,z);root.name=name;scene.add(root);const bounds=new T.Box3().setFromObject(root),size=bounds.getSize(vec(0,0,0)),center=bounds.getCenter(vec(0,0,0)),owned=boxes??[{x:center.x,z:center.z,w:size.x,d:size.z}];obstacles.push(...owned);const object=objects.registerModel(root,name,kind,owned,id);return {root,object};
 };
 const staticRoot=(root:T.Object3D,x:number,z:number,name:string)=>{root.position.set(x,GROUND,z);root.name=name;scene.add(root);return root;};
 const charBoxes=[-1,1].flatMap(x=>[-1,1].map(z=>({x:x*2.04,z:CHARMINAR.z+z*2.04,w:1.55,d:1.55})));
 const char=place(charminar(),0,CHARMINAR.z,'Charminar','charminar',charBoxes);towers.push(char.root);
 // The public square approaches all four open arches. No traffic is routed
 // through the monument or pedestrian bangle market.
 detail.box(0,GROUND+.043,CHARMINAR.z,14,.07,14,paving);
 for(const side of [-1,1])for(let i=-4;i<=4;i++)detail.box(side*5.5,GROUND+.085,CHARMINAR.z+i,.12,.06,.12,'#8e907e');
 const mosque=place(meccaMasjid(),MOSQUE.x,MOSQUE.z,'Mecca Masjid','mecca-masjid');towers.push(mosque.root);
 detail.box(-9,GROUND+.04,12,18,.07,19.4,cream);
 detail.box(-5,GROUND+.09,13,4.9,.1,6.6,'#b6ae93');detail.box(-5,GROUND+.151,13,4.2,.015,5.9,material('#6a9a8e',.36,.1));obstacles.push({x:-5,z:13,w:4.4,d:6.1});
 // North and south side cloisters frame the granite mosque court.
 for(const z of [2,22]){const wing=palaceWing(19,2.1,1);wing.scale.y=.55;staticRoot(wing,-14,z,'Mecca Masjid courtyard gallery');obstacles.push({x:-14,z,w:19,d:2.1});}
 for(const [i,p] of KAMANS.entries()){
  const root=kaman();root.rotation.y=p.yaw;const alongX=p.yaw===0;
  const boxes=[-1,1].map(side=>({x:p.x+(alongX?side*2.05:0),z:p.z+(alongX?0:side*2.05),w:alongX?1.05:.8,d:alongX?.8:1.05}));
  const gate=place(root,p.x,p.z,['Machli Kaman','Charminar Kaman','Sher-e-Batil Kaman','Kali Kaman'][i],i===0?'char-kaman':undefined,boxes);towers.push(gate.root);
 }
 const fountain=new Builder();fountain.cylinder(0,.14,0,3.15,.28,'#c6c1a6',3.15,48);fountain.cylinder(0,.3,0,2.79,.10,material('#71998b',.4),2.79,48);fountain.cylinder(0,.55,0,.35,.65,'#c6cdb8',.19,16);fountain.cylinder(0,.91,0,.85,.13,'#cad1bd',.85,24);fountain.cylinder(0,1.12,0,.10,.32,'#c6cdb8',.05,12);
 const fountainRoot=place(fountain.finish(),GULZAR.x,GULZAR.z,'Gulzar Houz','gulzar-houz',undefined,'prop');
 // Chowmahalla: northern clock gate, long cistern court, Khilwat and four
 // southern palace ranges. No duplicated Charminar or Taj-like central dome.
 detail.box(-60,GROUND+.025,63,44,.035,68,cream);
 detail.box(-60,GROUND+.05,40,33,.04,17,lawn);detail.box(-60,GROUND+.075,40,2.4,.025,19,paving);
 detail.box(-60,GROUND+.06,40,4.6,.1,12.5,'#d2c9ae');detail.box(-60,GROUND+.12,40,3.8,.025,11.8,material('#749d8e',.35,.12));obstacles.push({x:-60,z:40,w:4,d:12});
 for(const x of [-72,-48])detail.box(x,GROUND+.075,40,1.4,.05,18,paving);
 const clock=place(palaceClockGate(),-60,30,'Chowmahalla Clock Gate','palace-clock',[{x:-62.35,z:30,w:2,d:2.3},{x:-57.65,z:30,w:2,d:2.3}]);towers.push(clock.root);
 const khilwat=place(khilwatMubarak(),-60,57,'Khilwat Mubarak','khilwat');towers.push(khilwat.root);
 const wingPlots=[{x:-60,z:91,w:26,d:5,id:'chowmahalla',name:'Afzal Mahal'},{x:-60,z:67,w:26,d:4,name:'Mehtab Mahal'},{x:-76,z:79,w:5,d:19,name:'Aftab Mahal'},{x:-44,z:79,w:5,d:19,name:'Tahniyat Mahal'}];
 for(const [i,p] of wingPlots.entries()){const passage=i===1,root=palaceWing(p.w,p.d,i,passage),boxes=passage?[-1,1].map(s=>({x:p.x+s*7.15,z:p.z,w:11.7,d:p.d})):undefined;towers.push(place(root,p.x,p.z,p.name,p.id,boxes).root);}
 detail.box(-60,GROUND+.07,79,25,.035,16.5,lawn);detail.box(-60,GROUND+.1,79,12,.08,3.4,'#d0c7ad');detail.box(-60,GROUND+.15,79,11.3,.025,2.75,material('#699888',.4,.1));obstacles.push({x:-60,z:79,w:11.5,d:2.9});
 for(const x of [-81.5,-38.5])detail.box(x,GROUND+.6,63,.3,1.2,67,'#c1b597');
 // Low return walls leave the real north entrance and court circulation open.
 for(const x of [-73,-47])detail.box(x,GROUND+.6,29,17,1.2,.3,'#c1b597');
 const blocked=(x:number,z:number,w:number,d:number,pad=.4)=>obstacles.some(o=>Math.abs(x-o.x)<(w+o.w)/2+pad&&Math.abs(z-o.z)<(d+o.d)/2+pad);
 const arrivalClear=(x:number,z:number,r:number)=>Math.hypot(x-PLAN.spawn.x,z-PLAN.spawn.z)>r+2&&HYDERABAD_LANDMARKS.every(p=>Math.hypot(x-p.visitX,z-p.visitZ)>r+1.5);
 const protectedPlot=(x:number,z:number,pad=0)=>
  x>-84-pad&&x<-36+pad&&z>26-pad&&z<99+pad||
  x>-31-pad&&x<2+pad&&z>-1-pad&&z<25+pad||
  Math.abs(x)<8+pad&&Math.abs(z+15)<8+pad||
  Math.abs(x)<6+pad&&Math.abs(z+51)<6+pad;
 // Attached shopfronts follow the bazaar axis. Each frontage is one batched
 // destructible; all windows use just six shared material/texture families.
 for(const [index,side] of [-1,1].entries()){
  const root=bazaarTerrace(index);if(side>0)root.rotation.y=Math.PI;
  homes.push(place(root,-49.5,-15+side*6.3,'Laad Bazaar attached shop terrace').root);
 }
 for(let row=0;row<29;row++)for(let col=0;col<28;col++){
  const x=-101+col*7.35+range(-.6,.6),z=-101+row*7.05+range(-.65,.65),w=range(4.7,5.8),d=range(4.4,5.8),h=(row*28+col)%23===0?range(3.45,3.85):range(1.8,3.2);
  if(protectedPlot(x,z,4)||plotTouchesRoad({x,z,w:w+1.3,d:d+1.3},roads,1)||plotTouchesRoad({x,z,w:w+1.2,d:d+1.2},PATHS,.9)||blocked(x,z,w,d,.65)||!arrivalClear(x,z,4.8)||Math.abs(x)+w/2>105||Math.abs(z)+d/2>105)continue;
  const root=oldCityHouse(homes.length,w,d,h,homes.length%5===0);homes.push(place(root,x,z,'Hyderabad Old City terrace house').root);
 }
 const addWash=(root:T.Object3D,x:number,z:number,r:number,opacity:number)=>{const pool=lightPool(r,'#eed4a3',opacity);pool.position.set(x,.11,z);root.add(pool);pools.push(pool);};
 // Charminar receives restrained warm architectural light from the same pool,
 // not an emissive plaster material or a full-scene bloom pass.
 for(const [x,z] of [[-3.5,-3.5],[3.5,-3.5],[-3.5,3.5],[3.5,3.5]]){const source=localNightLight('#f1d3a2',3.2,8,1.8);source.position.set(x,.65,z);char.root.add(source);addWash(char.root,x,z,3.8,.032);}
 for(const root of [khilwat.root,clock.root]){const source=localNightLight('#eed8ae',3.2,10,2);source.position.set(0,2,-4);root.add(source);addWash(root,0,-4.5,4.2,.035);}
 const lamp=(x:number,z:number)=>{
  if(!PLAN.landAt(x,z,1)||blocked(x,z,.25,.25,.45)||!arrivalClear(x,z,.5)||streetLamps.some(p=>Math.hypot(x-p.x,z-p.z)<8)||TRAFFIC_LOOPS.some(loop=>loop.some(p=>Math.hypot(p.x-x,p.z-z)<5.4)))return;
  const b=new Builder();b.cylinder(0,1.35,0,.045,2.7,'#747967',.032,7);b.box(0,2.7,0,.28,.22,.28,'#6f7868');b.box(0,2.68,0,.2,.13,.2,glowMaterial('#efd9ac',2));
  const {root}=place(b.finish(),x,z,'Old City street lantern',undefined,undefined,'prop');const halo=lightHalo('#f2d9ab',1.2,.055);halo.position.set(0,2.7,0);root.add(halo);const source=localNightLight('#edd4aa',4.5,10,2);source.position.copy(halo.position);root.add(source);addWash(root,0,0,4.7,.045);streetLamps.push({x,z});
 };
 for(const road of roads)for(let i=1;i<road.points.length;i++){const a=road.points[i-1],b=road.points[i],dx=b.x-a.x,dz=b.z-a.z,len=Math.hypot(dx,dz);for(let d=5;d<len;d+=14){const side=Math.floor(d/14)%2?1:-1,x=a.x+dx*d/len,z=a.z+dz*d/len;lamp(x-dz/len*(road.width/2+.6)*side,z+dx/len*(road.width/2+.6)*side);}}
 for(let x=-80;x<-8;x+=12)for(const side of [-1,1])lamp(x,-15+side*3.7);
 for(const x of [-73,-47])for(const z of [34,45,72,87])lamp(x,z);
 for(const x of [-5,5])for(const z of [-69,-40,-24])lamp(x,z);
 // Trees remain in genuine courtyard/roadside pockets instead of turning this
 // tightly built inland quarter into a forest-covered island.
 const tree=(x:number,z:number,scale:number)=>{const r=scale*1.25;if(!PLAN.landAt(x,z,r+.7)||blocked(x,z,r*2,r*2,.3)||roadClearance({x,z},roads)<r+.8||roadClearance({x,z},PATHS)<r+.2||!arrivalClear(x,z,r))return false;if(objects.state.objects.some(o=>o.kind==='tree'&&Math.hypot(x-o.x,z-o.z)<2*scale))return false;objects.addTree(x,z,scale);return true;};
 for(const x of [-75,-69,-51,-45])for(const z of [34,39,45])tree(x,z,.62);
 for(const x of [-69,-51])for(const z of [72,86])tree(x,z,.6);
 for(let i=0;i<15000&&objects.trees.size<270;i++){const x=range(-104,104),z=range(-104,104);if(protectedPlot(x,z,0))continue;tree(x,z,range(.4,.67));}
 const shrubs=new T.InstancedMesh(new T.IcosahedronGeometry(1,1),material('#688146'),1100),matrix=new T.Matrix4(),quaternion=new T.Quaternion();let shrubCount=0;
 const shrub=(x:number,z:number,r=.3)=>{if(shrubCount>=1100||blocked(x,z,r*2,r*2,.2)||!arrivalClear(x,z,r)||roadClearance({x,z},roads)<r+.85||roadClearance({x,z},PATHS)<r+.2)return;matrix.compose(vec(x,GROUND+r*.3,z),quaternion,vec(r,r*.48,r*.85));shrubs.setMatrixAt(shrubCount,matrix);shrubs.setColorAt(shrubCount,new T.Color().setHSL(.2+random()*.06,.31,.32+random()*.1));shrubCount++;};
 for(const x of [-76,-44])for(let z=32;z<48;z+=.6)shrub(x,z,.28);
 for(let x=-74;x<-45;x+=.6)for(const z of [32,48])shrub(x,z,.28);
 for(let i=0;i<12000&&shrubCount<850;i++){const x=range(-104,104),z=range(-104,104);if(protectedPlot(x,z,1))continue;shrub(x,z,range(.24,.42));}
 shrubs.count=shrubCount;shrubs.name='Hyderabad · instanced courtyard hedges';shrubs.castShadow=true;shrubs.receiveShadow=true;shrubs.userData.nonSolid=true;shrubs.raycast=()=>{};scene.add(shrubs);
 const groundRoot=ground.finish();groundRoot.name='Hyderabad · inland Old City terrain';scene.add(groundRoot);const streetRoot=street.finish();streetRoot.name='Hyderabad · connected street corridors';scene.add(streetRoot);const detailRoot=detail.finish();detailRoot.name='Hyderabad · palace gardens and pedestrian squares';scene.add(detailRoot);
 const traffic=createTraffic(scene,objects,{loops:TRAFFIC_LOOPS,junctions:[{x:0,z:28},{x:58,z:28},{x:58,z:72},{x:0,z:72}],laneSign:1,carsPerRoute:5,city:'Hyderabad'});
 const localLighting=new LocalNightLighting(scene),groundGlows=new NightGroundGlows(scene,pools);
 const update=(time:number,player?:{x:number;z:number},_night=false)=>{objects.updateWind(time);traffic.update(time,player);};
 const updateLights=(dt:number,focus:T.Vector3,_time:number,night:boolean,_reduced=false)=>{groundGlows.update();localLighting.update(dt,focus,night);};update(0);
 return {obstacles,roads,objects,water,river,traffic,boats:[],update,updateLights,updateClock:(_date=new Date())=>{},landmarks:HYDERABAD_LANDMARKS,localLighting,groundGlows,beacons:[],streetLamps,railings:detailRoot,furniture:[],bins:[],hydrants:[],gardens:PLAN.map.gardens,circularSites:[],towers,homes,bridgeRoots:[],shrubs,fountain:fountainRoot.root};
}
