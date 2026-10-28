import * as T from 'three';
import {Builder,material,vec} from '../../geometry.ts';
import {riverMaterial,surfaceMaterial} from '../../nature.ts';
import {createTerrainBase} from '../../terrainBase.ts';
import {WorldObjects} from '../../interactables.ts';
import {createTraffic} from '../../traffic.ts';
import {GROUND,WATER_HEIGHT,type Obstacle} from '../../layout.ts';
import {ROAD_ASPHALT,roadDash} from '../../roadSurfaces.ts';
import {roadClearance,plotTouchesRoad} from '../../cityPlan.ts';
import {glowMaterial,lightHalo,lightPool,registerThemeColor} from '../../lighting.ts';
import {LocalNightLighting,localNightLight} from '../../localNightLighting.ts';
import {NightGroundGlows} from '../../nightGroundGlows.ts';
import type {CityAssets} from '../../importedAssets.ts';
import {strokeGeometry} from '../shared/surfaces.ts';
import {roadNetworkGeometry} from '../shared/roadNetwork.ts';
import {createFountain} from '../shared/fountain.ts';
import {PLAN,BENGALURU_LANDMARKS,bengaluruRoads,bengaluruLand,PARK_PATHS,TRAFFIC_LOOPS,TRAFFIC_JUNCTIONS,GARDENS} from './plan.ts';
import {vidhanaSoudha,attaraKacheri,vikasaSoudha,library,governmentMuseum,ubCity,urbanBlock,officeTower,rainTreeResources,autorickshaw} from './architecture.ts';

export function createBengaluruWorld(scene:T.Scene,_assets:CityAssets={loaded:[]}){
 let seed=560071;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};const range=(a:number,b:number)=>a+(b-a)*random();
 const roads=bengaluruRoads(),obstacles:Obstacle[]=[],objects=new WorldObjects(scene,obstacles),terrain=new Builder(),streets=new Builder(),details=new Builder();
 const pools:T.Mesh<T.PlaneGeometry,T.MeshBasicMaterial>[]=[];
 const pavement=registerThemeColor(new T.MeshStandardMaterial({roughness:.93}),'#c9c1a9','#737b7a');pavement.name='Bengaluru · warm granite paving';
 // An inland cutaway with visible soil. There is deliberately no invented sea.
 terrain.box(0,GROUND-2.45,0,216,4.5,216,surfaceMaterial('soil'));
 const lowerCut=createTerrainBase();terrain.add(lowerCut,surfaceMaterial('soil'));lowerCut.dispose();
 terrain.box(0,GROUND-.28,0,216,.48,216,material('#8c8969'));
 const lawn=new T.PlaneGeometry(216,216);lawn.rotateX(-Math.PI/2);const uv=lawn.getAttribute('uv');for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)*27,uv.getY(i)*27);terrain.add(lawn,surfaceMaterial('grass'),0,GROUND,0);lawn.dispose();
 const groundRoot=terrain.finish();groundRoot.name='Bengaluru · inland red-soil civic district';scene.add(groundRoot);
 const river=riverMaterial(),water=new T.Mesh(new T.PlaneGeometry(1,1),river.material);water.rotation.x=-Math.PI/2;water.position.y=WATER_HEIGHT;water.visible=false;water.name='Bengaluru · inactive water surface';scene.add(water);
 const border=roadNetworkGeometry(roads,GROUND+.035,{padding:1.5,bounds:108}),asphalt=roadNetworkGeometry(roads,GROUND+.07,{bounds:108});streets.add(border,pavement);streets.add(asphalt,ROAD_ASPHALT);border.dispose();asphalt.dispose();
 for(const road of roads){
  let distance=0,next=1.5;
  for(let i=1;i<road.points.length;i++){const a=road.points[i-1],b=road.points[i],dx=b.x-a.x,dz=b.z-a.z,len=Math.hypot(dx,dz);
   while(next<distance+len){const t=(next-distance)/len,x=a.x+dx*t,z=a.z+dz*t;if(roadClearance({x,z},roads.filter(r=>r!==road))>.7)roadDash(streets,x,GROUND+.078,z,.1,1.15,Math.atan2(dx,dz));next+=3.6;}distance+=len;
  }
 }
 const streetRoot=streets.finish();streetRoot.name='Bengaluru · connected civic roads';scene.add(streetRoot);
 for(const path of PARK_PATHS){const geo=strokeGeometry(path.points,path.width,GROUND+.03);details.add(geo,pavement);geo.dispose();}
 // The public paths join the library forecourt and civic gates, without roads
 // running through the park buildings or decorative cross-junction anchors.
 const groundRect=(x:number,z:number,w:number,d:number)=>details.box(x,GROUND+.017,z,w,.035,d,pavement);
 groundRect(-23,-43,13,19);groundRect(0,-34,7,13);groundRect(-31,13,8,16);groundRect(-4,55,18,5);groundRect(70,47,5,17);groundRect(63,81,6,7);
 const blocked=(x:number,z:number,w:number,d:number,pad=.5)=>obstacles.some(o=>Math.abs(x-o.x)<(w+o.w)/2+pad&&Math.abs(z-o.z)<(d+o.d)/2+pad);
 const arrivalClear=(x:number,z:number,r:number)=>Math.hypot(x-PLAN.spawn.x,z-PLAN.spawn.z)>r+2.2&&BENGALURU_LANDMARKS.every(l=>Math.hypot(x-l.visitX,z-l.visitZ)>r+1.8);
 const place=(root:T.Object3D,x:number,z:number,name:string,kind:'building'|'prop'='building',id?:string)=>{
  root.position.set(x,GROUND,z);scene.add(root);root.updateMatrixWorld(true);const box3=new T.Box3().setFromObject(root),size=box3.getSize(vec(0,0,0)),center=box3.getCenter(vec(0,0,0)),box={x:center.x,z:center.z,w:size.x,d:size.z};obstacles.push(box);objects.registerModel(root,name,kind,[box],id);return root;
 };
 const groundWash=(owner:T.Object3D,x:number,z:number,r:number,color='#ffe0b3',opacity=.065)=>{const pool=lightPool(r,color,opacity);pool.position.set(x,.095,z);owner.add(pool);pools.push(pool);};
 const buildingLight=(root:T.Object3D,w:number,d:number,color='#ffdfad')=>{
  for(const side of [-1,1]){const light=localNightLight(color,7,12,1.8);light.position.set(side*w*.32,2.1,d*.55);root.add(light);groundWash(root,side*w*.32,d*.56,4.8,color,.065);}
 };
 const landmarkRoots:T.Object3D[]=[];
 for(const [id,model,w,d] of [
  ['vidhana-soudha',vidhanaSoudha(),50,30],['attara-kacheri',attaraKacheri(),44,23],['vikasa-soudha',vikasaSoudha(),31,21],['central-library',library(),22,15],['government-museum',governmentMuseum(),22,15],['ub-city',ubCity(),24,20],
 ] as [string,T.Object3D,number,number][]){const l=BENGALURU_LANDMARKS.find(l=>l.id===id)!;place(model,l.x,l.z,l.name,'building',id);buildingLight(model,w,d);landmarkRoots.push(model);}
 const fountain=createFountain({radius:3.6,height:2.6});place(fountain.root,25,13,'Cubbon Park flowing fountain','prop');objects.plantingBlockers.push({x:25,z:13,w:8.2,d:8.2});
 // Small street blocks frame the actual park. The park itself remains forest and lawn.
 const homes:T.Object3D[]=[];
 const urbanSites=[...[-94,-81].flatMap(x=>[-69,-53,-37,-21,-4,13,30,45].map(z=>({x,z,w:8,d:10}))),...[-90,-75,-60,-45,-30,1,16,31,47,64,82,98].map(x=>({x,z:-97,w:9,d:9})),...[-65,-50,-35,-20,0,17].map(x=>({x,z:99,w:9,d:7})),...[[-95,81],[-78,88],[97,-58],[98,-36],[99,-14],[97,8],[99,40],[95,61],[91,79],[83,97]].map(([x,z])=>({x,z,w:8,d:10}))];
 for(const [index,site] of urbanSites.entries()){
  const plot={...site,w:site.w*[1,.9,1.06,1,.96][index%5],d:site.d*[1,.95,.9,1.04,1][index%5]};
  if(!bengaluruLand(plot.x,plot.z,6)||plotTouchesRoad(plot,roads,1.2)||blocked(plot.x,plot.z,plot.w,plot.d,1.2)||!arrivalClear(plot.x,plot.z,7))continue;
  const tall=index%7===2&&(Math.abs(plot.x)>80||plot.z<-90),model=tall?officeTower(index,plot.w,plot.d,18+(index%3)*5):urbanBlock(index,plot.w,plot.d,range(3.4,8.8));
  const root=place(model,plot.x,plot.z,tall?'Central Bengaluru office tower':'Central Bengaluru street block');homes.push(root);if(homes.length%3===0)buildingLight(root,plot.w,plot.d);
 }
 // Civic lawns and the central park keep their open views.
 const protectedLawns=[{x:-22,z:-43,w:15,d:28},{x:-34,z:13,w:11,d:23},{x:-4,z:62,w:23,d:12},{x:25,z:11,w:12,d:12},{x:70,z:47,w:8,d:25}];
 const onLawn=(x:number,z:number,r=0)=>protectedLawns.some(o=>Math.abs(x-o.x)<o.w/2+r&&Math.abs(z-o.z)<o.d/2+r);
 const streetLamps:{x:number;z:number}[]=[],furniture:Obstacle[]=[];
 const lamp=(x:number,z:number,park=false)=>{
  if(!bengaluruLand(x,z,2)||blocked(x,z,.5,.5,.5)||!arrivalClear(x,z,.5)||roadClearance({x,z},roads)<.18||roadClearance({x,z},PARK_PATHS)<.15||streetLamps.some(p=>Math.hypot(p.x-x,p.z-z)<6))return;
  const b=new Builder(),h=park?2.45:3.55;b.cylinder(0,h/2,0,.05,h,'#48554f',.038,8);b.cylinder(0,.12,0,.14,.24,'#646a58',.1,8);
  if(park){b.box(0,h,0,.42,.16,.42,'#57625b');b.box(0,h-.19,0,.28,.29,.28,glowMaterial('#ffe7b8',3.8));}else{b.box(.25,h,0,.64,.07,.22,'#b4b9a9');b.box(.3,h-.05,0,.44,.035,.17,glowMaterial('#ffe5b3',4));}
  const root=place(b.finish(),x,z,park?'Cubbon Park lantern':'Bengaluru street lamp','prop');const halo=lightHalo('#ffdfb4',2.5,.12);halo.position.set(park?0:.25,h-.1,0);root.add(halo);const light=localNightLight('#ffe0b5',park?7.5:10,park?12.5:17.5,1.8);light.position.copy(halo.position);root.add(light);groundWash(root,0,0,park?6.5:8,'#ffe3bb',.081);streetLamps.push({x,z});
 };
 for(const road of roads){let distance=0,next=5,side=1;for(let i=1;i<road.points.length;i++){const a=road.points[i-1],b=road.points[i],dx=b.x-a.x,dz=b.z-a.z,len=Math.hypot(dx,dz);while(next<distance+len){const t=(next-distance)/len;lamp(a.x+dx*t-dz/len*3.1*side,a.z+dz*t+dx/len*3.1*side);next+=12;side*=-1;}distance+=len;}}
 for(const path of PARK_PATHS){for(let i=1;i<path.points.length;i++){const a=path.points[i-1],b=path.points[i],dx=b.x-a.x,dz=b.z-a.z,len=Math.hypot(dx,dz),n=Math.max(1,Math.floor(len/12));for(let j=0;j<n;j++){const t=(j+.3)/n;lamp(a.x+dx*t-dz/len*1.5,a.z+dz*t+dx/len*1.5,true);}}}
 // Park benches are small merged destructible props, with their own collision.
 for(const [x,z,yaw] of [[7,25,0],[32,25,1.1],[-17,63,0],[56,19,0],[19,64,.7],[37,-67,1.5]]){
  const b=new Builder();for(let i=0;i<4;i++)b.box(0,.55,-.27+i*.18,1.75,.09,.14,'#806648');for(let i=0;i<3;i++)b.box(0,.85+i*.16,-.35,1.75,.1,.09,'#806648');for(const side of [-1,1]){b.box(side*.66,.28,0,.08,.55,.6,'#394941');b.box(side*.66,.8,-.35,.08,1.05,.08,'#394941');}const root=b.finish();root.rotation.y=yaw;place(root,x,z,'Cubbon Park bench','prop');furniture.push({x,z,w:2,d:1.1});
 }
 // The local green/yellow three-wheelers are parked off the shared traffic lanes.
 for(const [x,z,yaw] of [[-4,-77,Math.PI/2],[88,34,0],[-70,80,Math.PI/2]]){const root=autorickshaw();root.rotation.y=yaw;place(root,x,z,'Bengaluru auto rickshaw','prop');}
 const rain=rainTreeResources();objects.registerTreeSpecies('rain-tree',rain.trunk,rain.foliage,rain.bark,rain.leaves,'Cubbon Park canopy tree',4.2,4.8);
 const tree=(x:number,z:number,scale:number,broad=false)=>{
  const radius=(broad?2.4:1.4)*scale;if(!bengaluruLand(x,z,radius+.7)||roadClearance({x,z},roads)<radius+.7||roadClearance({x,z},PARK_PATHS)<(broad?1.25:radius+.25)||blocked(x,z,radius*2,radius*2,.35)||!arrivalClear(x,z,radius)||onLawn(x,z,radius))return false;
  if(objects.state.objects.some(o=>o.kind==='tree'&&Math.hypot(x-o.x,z-o.z)<(broad?2.6:1.9)*scale))return false;
  objects.addTree(x,z,scale,false,0,broad?'rain-tree':'default');return true;
 };
 // Mature rain-tree groves are clustered along the park's shaded walks.
 // Their high crowns can shelter footpaths; trunks and all road crowns stay clear.
 const groveCenters=[[-13,5],[-15,73],[22,51],[57,-44],[54,3],[31,39],[38,72],[14,-72]];
 for(const [cx,cz] of groveCenters)for(let i=0;i<80;i++){const angle=random()*Math.PI*2,r=Math.sqrt(random())*16;tree(cx+Math.cos(angle)*r,cz+Math.sin(angle)*r,[1.25,1.5,1.8][i%3],true);}
 const matureCanopies=[...objects.trees.values()].filter(t=>t.species==='rain-tree'&&t.scale.x>=1.25).length;
 for(let i=0;i<32000&&objects.trees.size<1120;i++){const x=range(-102,102),z=range(-103,102),park=x>-31&&x<81&&z>-70&&z<81;tree(x,z,range(.72,park?1.3:1.05),park&&i%3===0);}
 const shrubs=new T.InstancedMesh(new T.IcosahedronGeometry(1,1),material('#547d3e'),1800),matrix=new T.Matrix4(),q=new T.Quaternion();let shrubCount=0;
 for(let i=0;i<14000&&shrubCount<1500;i++){const x=range(-103,103),z=range(-103,103),r=range(.22,.65);if(!bengaluruLand(x,z,r+.3)||roadClearance({x,z},roads)<r+.8||roadClearance({x,z},PARK_PATHS)<r+.18||blocked(x,z,r*2,r*2,.18)||!arrivalClear(x,z,r)||onLawn(x,z,r))continue;matrix.compose(vec(x,GROUND+r*.37,z),q,vec(r,r*.55,r*.8));shrubs.setMatrixAt(shrubCount,matrix);shrubs.setColorAt(shrubCount,new T.Color().setHSL(.22+random()*.08,.24+random()*.2,.28+random()*.17));shrubCount++;}
 shrubs.count=shrubCount;shrubs.name='Cubbon Park · instanced shrub understory';shrubs.castShadow=true;shrubs.receiveShadow=true;shrubs.userData.nonSolid=true;shrubs.raycast=()=>{};scene.add(shrubs);
 // Four low formal hedges establish the library garden and civic forecourt.
 for(const [x,z,w,d] of [[-14,63,.55,8],[6,63,.55,8],[-20,-57,1,7],[-20,-29,1,7]])details.box(x,GROUND+.28,z,w,.5,d,'#49723c');
 const detailsRoot=details.finish();detailsRoot.name='Bengaluru · stone paths and civic forecourts';scene.add(detailsRoot);
 const traffic=createTraffic(scene,objects,{loops:TRAFFIC_LOOPS,junctions:TRAFFIC_JUNCTIONS,roads,laneSign:1,carsPerRoute:12,city:'Bengaluru'});
 const localLighting=new LocalNightLighting(scene),groundGlows=new NightGroundGlows(scene,pools);
 const update=(time:number,player?:{x:number;z:number},_night=false)=>{objects.updateWind(time);traffic.update(time,player);fountain.update(time);};
 const updateLights=(dt:number,focus:T.Vector3,_time:number,night:boolean,_reduced=false)=>{groundGlows.update();localLighting.update(dt,focus,night);};
 update(0);
 return {obstacles,roads,objects,water,river,traffic,update,updateLights,updateClock:(_date=new Date())=>{},landmarks:BENGALURU_LANDMARKS,landmarkRoots,localLighting,groundGlows,streetLamps,furniture,homes,shrubs,gardens:GARDENS,circularSites:[],matureCanopies,fountain};
}
