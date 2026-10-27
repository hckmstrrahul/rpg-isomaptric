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
import {roadNetworkGeometry} from '../shared/roadNetwork.ts';
import {PLAN,TAJ,TAJ_SCALE,GARDEN,GATE,MEHTAB,SOUTH_BANK,NORTH_BANK,SOUTH_LAND,NORTH_LAND,AGRA_PATHS,AGRA_LANDMARKS,TRAFFIC_LOOPS,agraLand,agraHeight,agraRoads,southBankAt,northBankAt} from './plan.ts';
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
  // One union per layer: the pavement cannot cut across a crossing or elbow.
  for(const [padding,y,mat] of [[1.5,GROUND+.025,pale],[0,GROUND+.065,ROAD_ASPHALT]] as const){const geo=roadNetworkGeometry(roads,y,{padding,bounds:108});streets.add(geo,mat);geo.dispose();}
  for(const road of roads){
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
  const podium=terrace();podium.scale.setScalar(TAJ_SCALE);staticRoot(podium,TAJ.x,TAJ.z,'Taj Mahal · marble riverfront podium and south stair');
  const tajBoxes:Obstacle[]=[{x:0,z:TAJ.z,w:10.36*TAJ_SCALE,d:10.36*TAJ_SCALE},...[-1,1].flatMap(x=>[-1,1].map(z=>({x:x*7.88*TAJ_SCALE,z:TAJ.z+z*7.88*TAJ_SCALE,w:1.44*TAJ_SCALE,d:1.44*TAJ_SCALE})))];
  const taj=tajMahal();taj.scale.setScalar(TAJ_SCALE);landmarkRoots.push(place(taj,0,TAJ.z,'Taj Mahal','taj',tajBoxes).root);
  for(const side of [-1,1]){const model=mosque(side===1);model.scale.setScalar(1.2);landmarkRoots.push(place(model,side*29,TAJ.z,side<0?'Taj Mahal Mosque':'Jawab Guesthouse',side<0?'taj-mosque':'jawab').root);}
  const gate=place(greatGate(),GATE.x,GATE.z,'Darwaza-i Rauza','great-gate',[{x:-3.35,z:GATE.z,w:3.5,d:4.6},{x:3.35,z:GATE.z,w:3.5,d:4.6}]);landmarkRoots.push(gate.root);
  // The enlarged ensemble preserves bilateral symmetry and stands entirely on
  // dry terrace. Its rear apron follows the actual south-bank outline.
  const terraceOutline=[...Array.from({length:15},(_,i)=>{const x=-34.8+i*69.6/14;return new T.Vector2(x,-southBankAt(x)-.22);}),new T.Vector2(34.8,-14.4),new T.Vector2(-34.8,-14.4)];
  const terraceGeo=new T.ShapeGeometry(new T.Shape(terraceOutline));terraceGeo.rotateX(-Math.PI/2);detail.add(terraceGeo,redPaving,0,GROUND+.03,0);terraceGeo.dispose();
  for(const x of [-21,21])detail.box(x,GROUND+.055,-3.6,7.2,.035,25,pale);
  for(const x of [-23.2,23.2]){
    detail.box(x,GROUND+.08,-5,2.4,.04,4.2,material('#c8b89a'));
    detail.box(x,GROUND+.106,-5,1.9,.015,3.7,material('#5e8f85',.32,.18));obstacles.push({x,z:-5,w:1.9,d:3.7});
  }
  // Four larger garden quarters keep the grand mausoleum's unobstructed axis.
  detail.box(0,GROUND+.018,38,69.7,.018,48,pale);
  for(const x of [-17.5,17.5])for(const z of [25,50.5]){
    detail.box(x,GROUND+.04,z,29,.035,20.5,gardenLawn);
    for(const dx of [-7.4,7.4])for(const dz of [-5.3,5.3]){
      detail.box(x+dx,GROUND+.061,z+dz,13.7,.025,9.5,material('#78944d'));
      detail.box(x+dx,GROUND+.072,z+dz,13.15,.018,8.95,gardenLawn);
    }
    detail.box(x,GROUND+.066,z,1,.04,21,pale);detail.box(x,GROUND+.067,z,29.5,.04,1,pale);
  }
  for(const z of [26.3,49.9]){
    detail.box(0,GROUND+.085,z,.95,.1,19.5,material('#ece1c5'));detail.box(0,GROUND+.145,z,.64,.02,19.2,material('#619c91',.3,.18));obstacles.push({x:0,z,w:.65,d:19.2});
    for(let i=-4;i<=4;i++)detail.cylinder(0,GROUND+.2,z+i*2,.07,.12,'#d5c8ab',.045,6);
  }
  detail.box(0,GROUND+.11,38,6.4,.16,6.4,pale);detail.box(0,GROUND+.21,38,4.9,.08,4.9,material('#e7dfca'));detail.box(0,GROUND+.26,38,4.35,.015,4.35,material('#619b93',.28,.16));obstacles.push({x:0,z:38,w:4.5,d:4.5});
  for(const x of [-35,35]){
    detail.box(x,GROUND+1.05,38,.42,2.1,48,'#a45e45');detail.box(x,GROUND+2.1,38,.56,.12,48,'#c79172');
    for(const z of [-17,61.3]){const tower=new Builder();tower.cylinder(0,1.6,0,1.15,3.2,'#a9664c',1.15,8);tower.cylinder(0,3.28,0,1.3,.16,'#d8b695',1.3,8);staticRoot(tower.finish(),x,z,'Taj precinct corner pavilion');obstacles.push({x,z,w:2.6,d:2.6});}
    obstacles.push({x,z:38,w:.42,d:48});
  }
  for(const x of [-20.3,20.3]){staticRoot(arcade(29.4),x,63,'Garden side arcade');obstacles.push({x,z:63,w:29.4,d:.5});}
  detail.box(0,GROUND+.03,78,69.7,.05,20.5,redPaving);
  for(const x of [-31.3,31.3])for(const z of [74.5,84.5]){const root=arcade(6,1.8);root.rotation.y=Math.PI/2;staticRoot(root,x,z,'Jilaukhana courtyard arcade');obstacles.push({x,z,w:.8,d:6});}
  for(const x of [-20.3,20.3]){staticRoot(arcade(29.4,2.1),x,89.5,'Taj Ganj forecourt frontage');obstacles.push({x,z:89.5,w:29.4,d:.8});}
  // Opposite-bank Mehtab Bagh is a garden, not a second mausoleum or an invented bridge.
  detail.box(MEHTAB.x,GROUND+.025,MEHTAB.z,51,.025,51,pale);
  for(const x of [-13,13])for(const z of [-91,-65])detail.box(x,GROUND+.045,z,23.7,.035,23.7,gardenLawn);
  detail.box(0,GROUND+.07,-78,1.5,.045,51,pale);detail.box(0,GROUND+.07,-78,51,.045,1.5,pale);
  detail.cylinder(0,GROUND+.09,-58,4.1,.10,material('#ba8a6c'),4.1,8);detail.cylinder(0,GROUND+.15,-58,3.55,.025,material('#749388',.48),3.55,8);
  for(const x of [-25.6,25.6])detail.box(x,GROUND+.3,-78,.28,.6,51,'#a27b5e');
  detail.box(0,GROUND+.3,-103.5,51,.6,.28,'#a27b5e');
  const blocked=(x:number,z:number,w:number,d:number,pad=.5)=>obstacles.some(o=>Math.abs(x-o.x)<(w+o.w)/2+pad&&Math.abs(z-o.z)<(d+o.d)/2+pad);
  const arrivalClear=(x:number,z:number,r:number)=>Math.hypot(x-PLAN.spawn.x,z-PLAN.spawn.z)>r+2&&AGRA_LANDMARKS.every(p=>Math.hypot(x-p.visitX,z-p.visitZ)>r+1.5);
  const precinct=(x:number,z:number,pad=0)=>Math.abs(x)<36.5+pad&&z>-23-pad&&z<91+pad;
  // The inhabited quarter has paved lanes and attached terraces; the protected
  // garden grounds remain green. Three footprints replace the suburban lawn grid.
  detail.box(-66,GROUND+.019,66,72,.026,80,material('#b8ab91'));
  detail.box(0,GROUND+.019,91,60,.026,28,material('#b8ab91'));
  detail.box(65,GROUND+.019,82,68,.026,46,material('#c2b69b'));
  // Dense attached rows occupy the inhabited western/eastern corridors. Every
  // actual model bound is checked against the road and existing architecture.
  const rowCandidates=[];
  for(const x of [-98,-76.5,-54])for(const z of [12,19,26,33,47,54,61,67,80,86,101])rowCandidates.push({x,z,n:x===-98?3:4});
  for(const x of [53,83,98])for(const z of [73,80,86,101])rowCandidates.push({x,z,n:x===98?3:4});
  for(const x of [-24,-8,8,24])rowCandidates.push({x,z:102,n:4});
  for(const [i,row] of rowCandidates.entries()){
    const model=tajGanjRow(i,row.n),bounds=new T.Box3().setFromObject(model),size=bounds.getSize(vec(0,0,0));
    if(precinct(row.x,row.z,Math.max(size.x,size.z)/2)||!agraLand(row.x,row.z,Math.max(size.x,size.z)/2+.8)||plotTouchesRoad({x:row.x,z:row.z,w:size.x,d:size.z},roads,.8)||blocked(row.x,row.z,size.x,size.z,.55)||!arrivalClear(row.x,row.z,Math.max(size.x,size.z)/2))continue;
    homes.push(place(model,row.x,row.z,'Taj Ganj attached bazaar terrace').root);
    detail.box(row.x,GROUND+.042,row.z+3.7,row.n*3.65+.5,.022,1.2,material('#a7987e'));
  }
  // Irregular infill: modest heights, shared party-wall rows, varied parapets,
  // service rooms and small roof tanks instead of identical suburban cubes.
  for(let row=0;row<20;row++)for(let col=0;col<32;col++){
    const x=-103+col*6.55+range(-.45,.45),z=-10+row*6.1+range(-.35,.35),w=range(3.7,5.6),d=range(3.9,4.9),h=range(2.4,4.6);
    if(z<45&&x>0||z<10&&x>-60||precinct(x,z,4)||!agraLand(x,z,5)||plotTouchesRoad({x,z,w:w+.6,d:d+1.25},roads,.8)||blocked(x,z,w+.3,d+1,.45)||!arrivalClear(x,z,4.7))continue;
    const home=place(tajGanjHouse(homes.length,w,d,h),x,z,'Taj Ganj courtyard residence');homes.push(home.root);
    if(homes.length%12===0){const source=localNightLight('#f1d4a8',3.5,8,2);source.position.set(0,1.5,d/2+.1);home.root.add(source);const pool=lightPool(3.5,'#ebc494',.035);pool.position.set(0,.09,d/2+.4);home.root.add(pool);pools.push(pool);}
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
  for(const x of [-31.3,31.3])for(const z of [19,38,57])lamp(x,z,true);
  for(const x of [-14,14])for(const z of [74,85])lamp(x,z,true);
  // Formal cypress rows and natural groves share instanced geometry, collision and
  // the game's existing wind/destruction paths. No individual foliage meshes.
  const cypress=cypressResources();objects.registerTreeSpecies('agra-cypress',cypress.trunk,cypress.foliage,cypress.bark,cypress.leaves,'Cypress',4.7,.85);
  const tree=(x:number,z:number,scale:number,formal=false)=>{
    const radius=(formal?.42:1.25)*scale;
    if(!agraLand(x,z,radius+.5)||blocked(x,z,radius*2,radius*2,.3)||roadClearance({x,z},roads)<radius+1||roadClearance({x,z},AGRA_PATHS)<radius+.15||!arrivalClear(x,z,radius))return false;
    if(objects.state.objects.some(o=>!o.destroyed&&o.kind==='tree'&&Math.hypot(x-o.x,z-o.z)<(formal?1.6:2.25)*scale))return false;
    objects.addTree(x,z,scale,false,0,formal?'agra-cypress':'default');return true;
  };
  for(const x of [-3.35,3.35])for(let z=17;z<61;z+=4)if(Math.abs(z-38)>4)tree(x,z,.75,true);
  for(const x of [-31.3,31.3])for(let z=17;z<61;z+=5.5)tree(x,z,.82,true);
  for(const x of [-17.5,17.5])for(const z of [25,50.5])for(const dx of [-10.5,10.5])for(const dz of [-7.1,7.1])tree(x+dx,z+dz,.62);
  for(let x=-21;x<=21;x+=7)for(let z=-99;z<=-54;z+=7)if(Math.abs(x)>3&&Math.abs(z+78)>3)tree(x,z,.64);
  for(let i=0;i<15000&&objects.trees.size<750;i++){
    const x=range(-104,104),z=range(-104,104);
    if(precinct(x,z,2)||Math.abs(x)<28&&z<-49||z>91&&Math.abs(x)<38)continue;
    tree(x,z,range(.44,.8));
  }
  // Low hedges and shrub drifts are one instanced batch. Formal rows read from above.
  const shrubGeo=new T.IcosahedronGeometry(1,1),shrubs=new T.InstancedMesh(shrubGeo,material('#557d3a'),2300),matrix=new T.Matrix4(),quaternion=new T.Quaternion();let shrubCount=0;
  const shrub=(x:number,z:number,r=.35,formal=false)=>{
    if(shrubCount>=2300||!agraLand(x,z,r+.4)||blocked(x,z,r*2,r*2,.15)||roadClearance({x,z},roads)<r+1||!arrivalClear(x,z,r))return;
    matrix.compose(vec(x,GROUND+r*.38,z),quaternion,vec(r,r*.6,r*.85));shrubs.setMatrixAt(shrubCount,matrix);shrubs.setColorAt(shrubCount,new T.Color(formal?'#4e7337':new T.Color().setHSL(.2+random()*.08,.33,.28+random()*.15)));shrubCount++;
  };
  for(const x of [-17.5,17.5])for(const z of [25,50.5])for(const dx of [-7.4,7.4])for(const dz of [-5.3,5.3]){
    for(let i=-6.3;i<=6.3;i+=.75){shrub(x+dx+i,z+dz-4.3,.27,true);shrub(x+dx+i,z+dz+4.3,.27,true);}for(let i=-4.3;i<=4.3;i+=.75){shrub(x+dx-6.3,z+dz+i,.27,true);shrub(x+dx+6.3,z+dz+i,.27,true);}
  }
  for(let i=0;i<6000&&shrubCount<1850;i++){const x=range(-105,105),z=range(-105,105);if(precinct(x,z,1)||Math.abs(x)<27&&z<-49||roadClearance({x,z},AGRA_PATHS)<1)continue;shrub(x,z,range(.23,.52));}
  shrubs.count=shrubCount;shrubs.name='Agra · instanced charbagh hedges and shrub drifts';shrubs.castShadow=true;shrubs.receiveShadow=true;shrubs.userData.nonSolid=true;shrubs.raycast=()=>{};scene.add(shrubs);
  // Low riverfront parapet belongs to the monument terrace, not a circular marina.
  const rail=new Builder(),railPath=Array.from({length:29},(_,i)=>{const x=-35+i*2.5;return {x,z:southBankAt(x)+.32};});
  for(let i=1;i<railPath.length;i++){const a=railPath[i-1],b=railPath[i],dx=b.x-a.x,dz=b.z-a.z,len=Math.hypot(dx,dz),yaw=Math.atan2(-dz,dx),x=(a.x+b.x)/2,z=(a.z+b.z)/2;rail.box(x,GROUND+.48,z,len,.96,.35,'#ad795f',yaw);rail.box(x,GROUND+.98,z,len,.1,.48,'#d4b499',yaw);obstacles.push({x,z,w:Math.abs(dx)+.35,d:Math.abs(dz)+.35});}
  const railings=rail.finish();railings.name='Taj river terrace parapet';scene.add(railings);
  const groundRoot=ground.finish();groundRoot.name='Agra · two Yamuna banks';scene.add(groundRoot);
  const streetRoot=streets.finish();streetRoot.name='Agra · outer approach roads';scene.add(streetRoot);
  const detailRoot=detail.finish();detailRoot.name='Agra · charbagh, forecourt and Mehtab garden';scene.add(detailRoot);
  const traffic=createTraffic(scene,objects,{loops:TRAFFIC_LOOPS,junctions:[{x:-87,z:73},{x:-66,z:73},{x:-42,z:73},{x:-66,z:94},{x:42,z:94},{x:71,z:94}],roads,laneSign:1,carsPerRoute:5,city:'Agra'});
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
