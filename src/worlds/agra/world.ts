import * as T from 'three';
import {Builder,material,vec} from '../../geometry.ts';
import {riverMaterial,surfaceMaterial} from '../../nature.ts';
import {createTerrainBase} from '../../terrainBase.ts';
import {WorldObjects} from '../../interactables.ts';
import {createTraffic} from '../../traffic.ts';
import {GROUND,WATER_HEIGHT,type Obstacle} from '../../layout.ts';
import {roadClearance,plotTouchesRoad,type PlanPoint} from '../../cityPlan.ts';
import {ROAD_ASPHALT,roadDash} from '../../roadSurfaces.ts';
import {glowMaterial,lightHalo,lightPool} from '../../lighting.ts';
import {LocalNightLighting,localNightLight} from '../../localNightLighting.ts';
import {NightGroundGlows} from '../../nightGroundGlows.ts';
import {BoatWakes} from '../../boatWakes.ts';
import type {Destructible} from '../../sandbox.ts';
import type {CityAssets} from '../../importedAssets.ts';
import {strokeGeometry} from '../shared/surfaces.ts';
import {PLAN,TAJ,GATE,MEHTAB,SOUTH_BANK,NORTH_BANK,SOUTH_LAND,NORTH_LAND,AGRA_PATHS,AGRA_LANDMARKS,TRAFFIC_LOOPS,agraLand,agraHeight,agraRoads,southBankAt,northBankAt} from './plan.ts';
import {tajMahal,terrace,mosque,greatGate,arcade,tajGanjHouse,tajGanjRow,cypressResources} from './architecture.ts';

/** No imported city assets. All façades and vegetation resources belong to this
 * selected chapter, and all real point lighting comes from the existing 12-light pool. */
export function createAgraWorld(scene:T.Scene,_assets:CityAssets={loaded:[]}) {
  let seed=1631;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  const range=(a:number,b:number)=>a+(b-a)*random();
  const ground=new Builder(),detail=new Builder(),streets=new Builder(),obstacles:Obstacle[]=[],roads=agraRoads();
  const objects=new WorldObjects(scene,obstacles),pools:T.Mesh<T.PlaneGeometry,T.MeshBasicMaterial>[]=[],streetLamps:PlanPoint[]=[],homes:T.Object3D[]=[],landmarkRoots:T.Object3D[]=[];
  const pale=material('#d5c6a8'),redPaving=material('#b77e66'),gardenLawn=surfaceMaterial('grass'),sand=surfaceMaterial('sand');
  const base=createTerrainBase();ground.add(base,surfaceMaterial('cutsoil'));base.dispose();
  for(const [index,polygon] of [SOUTH_LAND,NORTH_LAND].entries()) {
    const shape=new T.Shape(polygon.map(p=>new T.Vector2(p.x,-p.z)));shape.closePath();
    const geo=new T.ExtrudeGeometry(shape,{depth:GROUND+2.8,bevelEnabled:false});geo.rotateX(-Math.PI/2);geo.translate(0,-2.8,0);ground.add(geo,material('#9e957b'));geo.dispose();
    const top=new T.ShapeGeometry(shape);top.rotateX(-Math.PI/2);top.translate(0,GROUND+.005,0);
    const p=top.getAttribute('position'),uv=top.getAttribute('uv');for(let i=0;i<uv.count;i++)uv.setXY(i,p.getX(i)/8,p.getZ(i)/8);
    ground.add(top,gardenLawn);top.dispose();
    // The Yamuna is a river between two visible banks, not an island coastline.
    const bank=index===0?SOUTH_BANK:NORTH_BANK;
    ground.ribbon(bank,3.2,WATER_HEIGHT+.04,sand);
    ground.ribbon(bank,.75,GROUND+.013,material('#b4ab8d'));
  }
  const river=riverMaterial(false),waterGeo=new T.PlaneGeometry(216,216);waterGeo.rotateX(-Math.PI/2);
  const water=new T.Mesh(waterGeo,river.material);water.position.y=WATER_HEIGHT;water.name='Yamuna · continuous river between south and north banks';water.receiveShadow=true;scene.add(water);
  // Borders are assembled first, asphalt second: no stray pavement tongues at junctions.
  for(const road of roads){const geo=strokeGeometry(road.points,road.width+1.5,GROUND+.025);streets.add(geo,pale);geo.dispose();}
  for(const road of roads){
    const geo=strokeGeometry(road.points,road.width,GROUND+.065);streets.add(geo,ROAD_ASPHALT);geo.dispose();
    let distance=0,next=1;
    for(let i=1;i<road.points.length;i++){
      const a=road.points[i-1],b=road.points[i],dx=b.x-a.x,dz=b.z-a.z,len=Math.hypot(dx,dz);
      while(next<distance+len){const t=(next-distance)/len,x=a.x+dx*t,z=a.z+dz*t;if(roadClearance({x,z},roads.filter(r=>r!==road))>.5)roadDash(streets,x,GROUND+.071,z,.09,.9,Math.atan2(dx,dz));next+=3.5;}distance+=len;
    }
  }
  for(const path of AGRA_PATHS){const geo=strokeGeometry(path.points,path.width,GROUND+.035);detail.add(geo,pale);geo.dispose();}
  const staticRoot=(root:T.Object3D,x:number,z:number,name:string)=>{root.position.set(x,GROUND,z);root.name=name;scene.add(root);return root;};
  const place=(root:T.Object3D,x:number,z:number,name:string,id?:string,boxes?:Obstacle[],kind:'building'|'prop'='building')=>{
    root.position.set(x,GROUND,z);root.name=name;scene.add(root);
    const bounds=new T.Box3().setFromObject(root),size=bounds.getSize(vec(0,0,0)),center=bounds.getCenter(vec(0,0,0));
    const owned=boxes??[{x:center.x,z:center.z,w:size.x,d:size.z}];obstacles.push(...owned);
    const object=objects.registerModel(root,name,kind,owned,id);return {root,object};
  };
  staticRoot(terrace(),TAJ.x,TAJ.z,'Taj Mahal · marble riverfront podium and south stair');
  const tajBoxes:Obstacle[]=[{x:0,z:TAJ.z,w:10.36,d:10.36},...[-1,1].flatMap(x=>[-1,1].map(z=>({x:x*7.88,z:TAJ.z+z*7.88,w:1.44,d:1.44})))];
  landmarkRoots.push(place(tajMahal(),0,TAJ.z,'Taj Mahal','taj',tajBoxes).root);
  landmarkRoots.push(place(mosque(),-23,TAJ.z,'Taj Mahal Mosque','taj-mosque').root);
  landmarkRoots.push(place(mosque(true),23,TAJ.z,'Jawab Guesthouse','jawab').root);
  const gate=place(greatGate(),GATE.x,GATE.z,'Darwaza-i Rauza','great-gate',[{x:-3.35,z:GATE.z,w:3.5,d:4.6},{x:3.35,z:GATE.z,w:3.5,d:4.6}]);landmarkRoots.push(gate.root);
  // Broad red-sandstone terrace joins the mosque and guesthouse without putting a
  // traversable model on top of a giant rectangular collision obstacle.
  detail.box(0,GROUND+.015,-9,54.7,.03,24.8,redPaving);
  for(const x of [-15,15])detail.box(x,GROUND+.04,-8.5,6.2,.035,14.8,pale);
  for(const x of [-18.6,18.6]){
    detail.box(x,GROUND+.05,-9,2.4,.04,4.2,material('#c8b89a'));
    detail.box(x,GROUND+.076,-9,1.9,.015,3.7,material('#5e8f85',.32,.18));
    obstacles.push({x,z:-9,w:1.9,d:3.7});
  }
  // Charbagh garden geometry is axis-aligned with the real north–south site plan.
  detail.box(0,GROUND+.018,23.5,54.7,.018,51.4,pale);
  for(const x of [-13.7,13.7])for(const z of [11,36.6]){
    detail.box(x,GROUND+.04,z,22.1,.035,21.7,gardenLawn);
    for(const dx of [-5.7,5.7])for(const dz of [-5.7,5.7]){
      detail.box(x+dx,GROUND+.061,z+dz,10.2,.025,9.9,material('#78944d'));
      detail.box(x+dx,GROUND+.072,z+dz,9.65,.018,9.35,gardenLawn);
    }
    detail.box(x,GROUND+.066,z,1,.04,22.2,pale);detail.box(x,GROUND+.067,z,22.2,.04,1,pale);
  }
  for(const z of [12.8,36.8]){
    detail.box(0,GROUND+.085,z,.95,.1,19.5,material('#ece1c5'));detail.box(0,GROUND+.145,z,.64,.02,19.2,material('#619c91',.3,.18));
    obstacles.push({x:0,z,w:.65,d:19.2});
    for(let i=-4;i<=4;i++)detail.cylinder(0,GROUND+.2,z+i*2,.07,.12,'#d5c8ab',.045,6);
  }
  detail.box(0,GROUND+.11,23,6.4,.16,6.4,pale);detail.box(0,GROUND+.21,23,4.9,.08,4.9,material('#e7dfca'));detail.box(0,GROUND+.26,23,4.35,.015,4.35,material('#619b93',.28,.16));obstacles.push({x:0,z:23,w:4.5,d:4.5});
  // Historic enclosure: continuous west/east walls, an open forecourt and real gate.
  for(const x of [-27.4,27.4]){
    detail.box(x,GROUND+1.05,23,.42,2.1,52,'#a45e45');detail.box(x,GROUND+2.1,23,.56,.12,52,'#c79172');
    for(const z of [-19,49.3]){const tower=new Builder();tower.cylinder(0,1.6,0,1.15,3.2,'#a9664c',1.15,8);tower.cylinder(0,3.28,0,1.3,.16,'#d8b695',1.3,8);staticRoot(tower.finish(),x,z,'Taj precinct corner pavilion');obstacles.push({x,z,w:2.6,d:2.6});}
    obstacles.push({x,z:23,w:.42,d:52});
  }
  for(const x of [-16.5,16.5]){staticRoot(arcade(22.7),x,51.3,'Garden side arcade');obstacles.push({x,z:51.3,w:22.7,d:.5});}
  detail.box(0,GROUND+.03,66,54.6,.05,19.3,redPaving);
  for(const x of [-24,24])for(const z of [60,72]){
    const root=arcade(6,1.8);root.rotation.y=Math.PI/2;staticRoot(root,x,z,'Jilaukhana courtyard arcade');obstacles.push({x,z,w:.8,d:6});
  }
  for(const x of [-16.7,16.7]){staticRoot(arcade(21,2.1),x,75.5,'Taj Ganj forecourt frontage');obstacles.push({x,z:75.5,w:21,d:.8});}
  // Opposite-bank Mehtab Bagh is a garden, not a second mausoleum or an invented bridge.
  detail.box(MEHTAB.x,GROUND+.025,MEHTAB.z,51,.025,51,pale);
  for(const x of [-13,13])for(const z of [-91,-65])detail.box(x,GROUND+.045,z,23.7,.035,23.7,gardenLawn);
  detail.box(0,GROUND+.07,-78,1.5,.045,51,pale);detail.box(0,GROUND+.07,-78,51,.045,1.5,pale);
  detail.cylinder(0,GROUND+.09,-58,4.1,.10,material('#ba8a6c'),4.1,8);detail.cylinder(0,GROUND+.15,-58,3.55,.025,material('#749388',.48),3.55,8);
  for(const x of [-25.6,25.6])detail.box(x,GROUND+.3,-78,.28,.6,51,'#a27b5e');
  detail.box(0,GROUND+.3,-103.5,51,.6,.28,'#a27b5e');
  const blocked=(x:number,z:number,w:number,d:number,pad=.5)=>obstacles.some(o=>Math.abs(x-o.x)<(w+o.w)/2+pad&&Math.abs(z-o.z)<(d+o.d)/2+pad);
  const arrivalClear=(x:number,z:number,r:number)=>Math.hypot(x-PLAN.spawn.x,z-PLAN.spawn.z)>r+2&&AGRA_LANDMARKS.every(p=>Math.hypot(x-p.visitX,z-p.visitZ)>r+1.5);
  const precinct=(x:number,z:number,pad=0)=>Math.abs(x)<29+pad&&z>-23-pad&&z<77+pad;
  // The inhabited quarter has paved lanes and attached terraces; the protected
  // garden grounds remain green. Three footprints replace the suburban lawn grid.
  detail.box(-66,GROUND+.019,66,72,.026,80,material('#b8ab91'));
  detail.box(0,GROUND+.019,91,60,.026,28,material('#b8ab91'));
  detail.box(65,GROUND+.019,82,68,.026,46,material('#c2b69b'));
  const rows=[{x:-50,z:64,n:6},{x:-50,z:81,n:5},{x:-50,z:88,n:5},{x:-75.5,z:81,n:3},{x:-75.5,z:88,n:3},{x:-76,z:63,n:3},{x:-49,z:47,n:6},{x:-48,z:55,n:5}];
  for(const [i,row] of rows.entries()){
    const model=tajGanjRow(i,row.n);homes.push(place(model,row.x,row.z,'Taj Ganj attached bazaar terrace').root);
    detail.box(row.x,GROUND+.042,row.z+3.7,row.n*4.2+1,.022,1.4,material('#a7987e'));
  }
  // Taj Ganj has dense irregular low-rise roof terraces. These are intentionally
  // generalized blocks, not fabricated named landmarks or a second set of palaces.
  for(let row=0;row<18;row++)for(let col=0;col<24;col++){
    const x=-100+col*8.6+range(-1.1,1.1),z=-4+row*6+range(-.75,.75),w=range(4.4,6.4),d=range(3.8,4.7),h=range(2.6,5.1);
    if(z<45&&x>0||z<10&&x>-60||precinct(x,z,4)||!agraLand(x,z,6)||plotTouchesRoad({x,z,w:w+1.2,d:d+1.5},roads,1.2)||blocked(x,z,w,d,1)||!arrivalClear(x,z,5))continue;
    const home=place(tajGanjHouse(homes.length,w,d,h),x,z,'Taj Ganj courtyard residence');homes.push(home.root);
    // Small local pools belong only to the inhabited streets, never the white marble.
    if(homes.length%8===0){const source=localNightLight('#f1d4a8',3.5,8,2);source.position.set(0,1.5,d/2+.1);home.root.add(source);const pool=lightPool(3.5,'#ebc494',.035);pool.position.set(0,.09,d/2+.4);home.root.add(pool);pools.push(pool);}
  }
  // Path lamps use warm dim bulbs and the shared bounded source pool. No giant halos.
  const lamp=(x:number,z:number,heritage=false)=>{
    if(!agraLand(x,z,1)||blocked(x,z,.22,.22,.35)||!arrivalClear(x,z,.4)||streetLamps.some(p=>Math.hypot(x-p.x,z-p.z)<6))return;
    const b=new Builder(),h=heritage?1.45:2.8;b.cylinder(0,h/2,0,.04,h,'#77735e',.035,7);b.box(0,h,0,.24,.22,.24,'#7c765e');b.box(0,h,0,.17,.15,.17,glowMaterial('#f8dfb8',1.8));
    const {root}=place(b.finish(),x,z,'Agra path light',undefined,undefined,'prop');
    const halo=lightHalo('#efd8b6',heritage?.7:1.2,.045);halo.position.set(0,h,0);root.add(halo);
    const source=localNightLight('#f2d8b0',heritage?2.2:5,heritage?6:10,2);source.position.copy(halo.position);root.add(source);
    const pool=lightPool(heritage?3:5,'#ecd5aa',heritage?.028:.048);pool.position.set(0,.12,0);root.add(pool);pools.push(pool);streetLamps.push({x,z});
  };
  for(const road of roads)for(let i=1;i<road.points.length;i++){
    const a=road.points[i-1],b=road.points[i],dx=b.x-a.x,dz=b.z-a.z,len=Math.hypot(dx,dz),nx=-dz/len,nz=dx/len;
    for(let d=4;d<len;d+=13){const x=a.x+dx*d/len,z=a.z+dz*d/len;for(const side of [-1,1])lamp(x+nx*(road.width/2+.7)*side,z+nz*(road.width/2+.7)*side);}
  }
  for(const x of [-23.8,23.8])for(const z of [7,23,40])lamp(x,z,true);
  for(const x of [-12,12])for(const z of [62,71])lamp(x,z,true);
  // Formal cypress rows and natural groves share instanced geometry, collision and
  // the game's existing wind/destruction paths. No individual foliage meshes.
  const cypress=cypressResources();objects.registerTreeSpecies('agra-cypress',cypress.trunk,cypress.foliage,cypress.bark,cypress.leaves,'Cypress',4.7,.85);
  const tree=(x:number,z:number,scale:number,formal=false)=>{
    const radius=(formal?.42:1.25)*scale;
    if(!agraLand(x,z,radius+.5)||blocked(x,z,radius*2,radius*2,.3)||roadClearance({x,z},roads)<radius+1||roadClearance({x,z},AGRA_PATHS)<radius+.15||!arrivalClear(x,z,radius))return false;
    if(objects.state.objects.some(o=>!o.destroyed&&o.kind==='tree'&&Math.hypot(x-o.x,z-o.z)<(formal?1.6:2.25)*scale))return false;
    objects.addTree(x,z,scale,false,0,formal?'agra-cypress':'default');return true;
  };
  for(const x of [-3.35,3.35])for(let z=5;z<49;z+=4)if(Math.abs(z-23)>4)tree(x,z,.7,true);
  for(const x of [-23.8,23.8])for(let z=4;z<49;z+=5.5)tree(x,z,.78,true);
  for(const x of [-13.6,13.6])for(const z of [10.8,36.5])for(const dx of [-8.1,8.1])for(const dz of [-8,8])tree(x+dx,z+dz,.62);
  for(let x=-21;x<=21;x+=7)for(let z=-99;z<=-54;z+=7)if(Math.abs(x)>3&&Math.abs(z+78)>3)tree(x,z,.64);
  for(let i=0;i<15000&&objects.trees.size<750;i++){
    const x=range(-104,104),z=range(-104,104);
    if(precinct(x,z,2)||Math.abs(x)<28&&z<-49||z>77&&Math.abs(x)<34)continue;
    tree(x,z,range(.44,.8));
  }
  // Low hedges and shrub drifts are one instanced batch. Formal rows read from above.
  const shrubGeo=new T.IcosahedronGeometry(1,1),shrubs=new T.InstancedMesh(shrubGeo,material('#557d3a'),2300),matrix=new T.Matrix4(),quaternion=new T.Quaternion();let shrubCount=0;
  const shrub=(x:number,z:number,r=.35,formal=false)=>{
    if(shrubCount>=2300||!agraLand(x,z,r+.4)||blocked(x,z,r*2,r*2,.15)||roadClearance({x,z},roads)<r+1||!arrivalClear(x,z,r))return;
    matrix.compose(vec(x,GROUND+r*.38,z),quaternion,vec(r,r*.6,r*.85));shrubs.setMatrixAt(shrubCount,matrix);shrubs.setColorAt(shrubCount,new T.Color(formal?'#4e7337':new T.Color().setHSL(.2+random()*.08,.33,.28+random()*.15)));shrubCount++;
  };
  for(const x of [-13.7,13.7])for(const z of [11,36.6])for(const dx of [-5.7,5.7])for(const dz of [-5.7,5.7]){
    for(let i=-4.5;i<=4.5;i+=.75){shrub(x+dx+i,z+dz-4.6,.27,true);shrub(x+dx+i,z+dz+4.6,.27,true);shrub(x+dx-4.6,z+dz+i,.27,true);shrub(x+dx+4.6,z+dz+i,.27,true);}
  }
  for(let i=0;i<6000&&shrubCount<1850;i++){const x=range(-105,105),z=range(-105,105);if(precinct(x,z,1)||Math.abs(x)<27&&z<-49||roadClearance({x,z},AGRA_PATHS)<1)continue;shrub(x,z,range(.23,.52));}
  shrubs.count=shrubCount;shrubs.name='Agra · instanced charbagh hedges and shrub drifts';shrubs.castShadow=true;shrubs.receiveShadow=true;shrubs.userData.nonSolid=true;shrubs.raycast=()=>{};scene.add(shrubs);
  // Low riverfront parapet belongs to the monument terrace, not a circular marina.
  const rail=new Builder();rail.box(0,GROUND+.48,-21.6,55,.96,.35,'#ad795f');rail.box(0,GROUND+.98,-21.6,55,.1,.48,'#d4b499');
  for(let x=-27;x<=27;x+=.65)rail.box(x,GROUND+.59,-21.39,.4,.38,.035,'#805a45');
  const railings=rail.finish();railings.name='Taj river terrace parapet';scene.add(railings);obstacles.push({x:0,z:-21.6,w:55,d:.4});
  const groundRoot=ground.finish();groundRoot.name='Agra · two Yamuna banks';scene.add(groundRoot);
  const streetRoot=streets.finish();streetRoot.name='Agra · outer approach roads';scene.add(streetRoot);
  const detailRoot=detail.finish();detailRoot.name='Agra · charbagh, forecourt and Mehtab garden';scene.add(detailRoot);
  const traffic=createTraffic(scene,objects,{loops:TRAFFIC_LOOPS,junctions:[{x:-66,z:73},{x:-37,z:73},{x:-37,z:94},{x:38,z:66},{x:71,z:66},{x:71,z:94}],laneSign:1,carsPerRoute:4,city:'Agra'});
  // A few modest rowboats carry the river's motion; no invented yacht marina.
  const wakes=new BoatWakes(scene),boats:{group:T.Group;object:Destructible;length:number;phase:number;curve:T.CatmullRomCurve3}[]=[];
  const center=(x:number)=>(southBankAt(x)+northBankAt(x))/2;
  const curve=new T.CatmullRomCurve3([-94,-65,-30,0,35,65,94].map(x=>vec(x,0,center(x))),false,'centripetal');
  for(let i=0;i<4;i++){
    const b=new Builder();b.sphere(0,.08,0,.45,.16,1.15,'#8d6d4f');b.box(0,.18,0,.64,.12,1.65,'#c2a979');for(const z of [-.6,0,.6])b.box(0,.28,z,.7,.08,.15,'#775943');
    const root=b.finish();root.name='Yamuna wooden riverboat';scene.add(root);const object=objects.registerModel(root,root.name,'boat');boats.push({group:root,object,length:2.3,phase:.12+i*.23,curve});
  }
  const localLighting=new LocalNightLighting(scene),groundGlows=new NightGroundGlows(scene,pools);
  const update=(time:number,player?:{x:number;z:number},_night=false)=>{
    river.time.value=time;objects.updateWind(time);traffic.update(time,player);
    for(const boat of boats){if(boat.object.destroyed)continue;const cycle=(boat.phase+time*.0015)%2,forward=cycle<1,t=forward?cycle:2-cycle,p=boat.curve.getPointAt(t),tangent=boat.curve.getTangentAt(t);boat.group.position.set(p.x,WATER_HEIGHT+.04+Math.sin(time+boat.phase)*.012,p.z);boat.group.rotation.y=Math.atan2(tangent.x,tangent.z)+(forward?0:Math.PI);objects.syncModelPose(boat.object);wakes.emit(boat.object.id,boat.group.position,boat.group.rotation.y,boat.length,time);}
    wakes.update(time);
  };
  const updateLights=(dt:number,focus:T.Vector3,_time:number,night:boolean,_reduced=false)=>{groundGlows.update();localLighting.update(dt,focus,night);};update(0);
  return {obstacles,roads,objects,water,river,traffic,boats,wakes,update,updateLights,updateClock:(_date=new Date())=>{},landmarks:AGRA_LANDMARKS,localLighting,groundGlows,beacons:[],streetLamps,railings,furniture:[],bins:[],hydrants:[],gardens:PLAN.map.gardens,circularSites:[],towers:landmarkRoots,homes,housingUnits:homes.reduce((n,h)=>n+(h.userData.houseCount??1),0),bridgeRoots:[],shrubs};
}
