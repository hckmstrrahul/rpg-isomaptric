import * as T from 'three';
import {Builder,material,vec} from '../../geometry.ts';
import {riverMaterial} from '../../nature.ts';
import {WorldObjects} from '../../interactables.ts';
import {createTraffic} from '../../traffic.ts';
import {GROUND,WATER_HEIGHT,type Obstacle} from '../../layout.ts';
import {glowMaterial,lightPool,registerGlow} from '../../lighting.ts';
import {LocalNightLighting,localNightLight} from '../../localNightLighting.ts';
import {NightGroundGlows} from '../../nightGroundGlows.ts';
import type {CityAssets} from '../../importedAssets.ts';
import {strokeGeometry} from '../shared/surfaces.ts';
import {PLAN,MOON_LANDMARKS,SERVICE_PATHS,PADS,CRATERS,lunarHeight,pathDistance,siteDistance} from './plan.ts';
import {METAL,PALE,DARK,habitat,rocket,observatory,greenhouse,lander,solarFarm,communications,roverWorkshop,rover,astronaut,goldSatellite,greenhouseTreeResources} from './architecture.ts';

function regolith(){
 const n=256,color=new Uint8Array(n*n*4),bump=new Uint8Array(n*n*4);
 const hash=(x:number,y:number)=>{let v=Math.imul(x+37,374761393)^Math.imul(y+97,668265263);v=Math.imul(v^(v>>>13),1274126177);return((v^(v>>>16))>>>0)/4294967295;};
 const noise=(x:number,y:number,cells:number)=>{const px=x/n*cells,py=y/n*cells,ix=Math.floor(px),iy=Math.floor(py),sx=(px-ix)**2*(3-2*(px-ix)),sy=(py-iy)**2*(3-2*(py-iy));const h=(a:number,b:number)=>hash((a+cells)%cells,(b+cells)%cells);return T.MathUtils.lerp(T.MathUtils.lerp(h(ix,iy),h(ix+1,iy),sx),T.MathUtils.lerp(h(ix,iy+1),h(ix+1,iy+1),sx),sy);};
 for(let y=0;y<n;y++)for(let x=0;x<n;x++){const i=(y*n+x)*4,r=hash(x+381,y+197),s=127+noise(x,y,8)*20+noise(x,y,31)*10+r*13;for(let j=0;j<3;j++){color[i+j]=s+(j===2?3:0);bump[i+j]=100+r*28+noise(x,y,31)*16;}color[i+3]=bump[i+3]=255;}
 const map=new T.DataTexture(color,n,n),height=new T.DataTexture(bump,n,n);for(const tex of [map,height]){tex.wrapS=tex.wrapT=T.RepeatWrapping;tex.repeat.set(12,12);tex.magFilter=T.LinearFilter;tex.minFilter=T.LinearMipmapLinearFilter;tex.generateMipmaps=true;tex.needsUpdate=true;}map.colorSpace=T.SRGBColorSpace;
 return new T.MeshStandardMaterial({map,bumpMap:height,bumpScale:.035,roughness:.98,vertexColors:true});
}
export function createMoonWorld(scene:T.Scene,_assets:CityAssets={loaded:[]}){
 let seed=710073;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};const range=(a:number,b:number)=>a+(b-a)*random();
 const obstacles:Obstacle[]=[],objects=new WorldObjects(scene,obstacles),roads=SERVICE_PATHS,terrain=new Builder(),details=new Builder();
 const groundGeo=new T.PlaneGeometry(212,212,192,192);groundGeo.rotateX(-Math.PI/2);const pos=groundGeo.getAttribute('position');for(let i=0;i<pos.count;i++)pos.setY(i,lunarHeight(pos.getX(i),pos.getZ(i)));groundGeo.computeVertexNormals();
 const colors=new Float32Array(pos.count*3);
 for(let i=0;i<pos.count;i++){
  const x=pos.getX(i),z=pos.getZ(i);let shade=.94;
  for(const c of CRATERS){const t=Math.hypot(x-c.x,z-c.z)/c.r;if(t<1)shade-=.33*(1-t*t);else if(t<1.34)shade+=.12*Math.sin((t-1)/.34*Math.PI);}
  for(let j=0;j<3;j++)colors[i*3+j]=Math.max(.55,shade);
 }
 groundGeo.setAttribute('color',new T.BufferAttribute(colors,3));
 const ground=new T.Mesh(groundGeo,regolith());ground.name='Fictional lunar outpost · continuous cratered regolith';ground.receiveShadow=true;ground.castShadow=true;scene.add(ground);
 terrain.box(0,-17.75,0,212,.5,212,material('#545a5f'));
 // Slab walls share exactly the heightfield boundary; no hovering crater shell.
 for(const axis of ['x','z'] as const)for(const side of [-1,1]){
  const vertices:number[]=[],indices:number[]=[];
  for(let i=0;i<=106;i++){const t=-106+i*2,x=axis==='x'?106*side:t,z=axis==='z'?106*side:t;vertices.push(x,lunarHeight(x,z),z,x,-18,z);if(i<106){const a=i*2;indices.push(a,a+1,a+2,a+1,a+3,a+2);}}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(vertices,3));g.setIndex(side===(axis==='x'?-1:1)?indices:indices.flatMap((_,i,a)=>i%3===0?[a[i],a[i+2],a[i+1]]:[]));g.computeVertexNormals();terrain.add(g,material('#777b7d'));g.dispose();
 }
 const base=terrain.finish();base.name='Moon bonus · exposed gray regolith cutaway';scene.add(base);
 const river=riverMaterial(),water=new T.Mesh(new T.PlaneGeometry(1,1),river.material);water.visible=false;water.position.y=WATER_HEIGHT;water.name='Moon · inactive water surface';scene.add(water);
 const paving=material('#687279'),edge=material('#aab0ae');
 const guidance=registerGlow(new T.MeshStandardMaterial({color:'#d9e3e5',emissive:'#e3f4ff',roughness:.45}),1.5);guidance.name='Lunar white guidance markers';guidance.userData.noShadow=true;
 for(const path of SERVICE_PATHS){const g=strokeGeometry(path.points,path.width,lunarHeight(0,0)+.025);details.add(g,paving);g.dispose();
  let distance=0,next=2.5;for(let i=1;i<path.points.length;i++){const a=path.points[i-1],b=path.points[i],dx=b.x-a.x,dz=b.z-a.z,len=Math.hypot(dx,dz);while(next<distance+len){const t=(next-distance)/len,x=a.x+dx*t,z=a.z+dz*t;for(const side of [-1,1])details.box(x-dz/len*path.width*.43*side,GROUND+.048,z+dx/len*path.width*.43*side,.18,.035,.5,guidance,Math.atan2(dx,dz));next+=4;}distance+=len;}
 }
 for(const [index,pad] of PADS.entries()){
  details.cylinder(pad.x,GROUND+.07,pad.z,pad.r,.14,material('#7f878b'),pad.r,64);details.ring(pad.x,GROUND+.15,pad.z,pad.r-1,.18,'#cbd1ce');details.ring(pad.x,GROUND+.153,pad.z,pad.r-4,.12,'#a9b4b7');
  for(let i=0;i<12;i++){const a=i*Math.PI/6;details.box(pad.x+Math.sin(a)*(pad.r-.4),GROUND+.17,pad.z+Math.cos(a)*(pad.r-.4),.4,.1,.4,glowMaterial(index?'#d7dfcd':'#afd0df',1.2));}
  details.box(pad.x,GROUND+.155,pad.z,3.5,.03,.25,edge);for(const side of [-1,1])details.box(pad.x+side*1.6,GROUND+.155,pad.z,.25,.03,4,edge);
 }
 const blocked=(x:number,z:number,w:number,d:number,pad=.5)=>obstacles.some(o=>Math.abs(x-o.x)<(w+o.w)/2+pad&&Math.abs(z-o.z)<(d+o.d)/2+pad);
 const clearArrival=(x:number,z:number,r:number)=>MOON_LANDMARKS.every(l=>Math.hypot(x-l.visitX,z-l.visitZ)>r+2);
 const place=(root:T.Object3D,x:number,z:number,name:string,kind:'building'|'prop'='building',id?:string)=>{root.position.set(x,lunarHeight(x,z),z);scene.add(root);root.updateMatrixWorld(true);const bounds=new T.Box3().setFromObject(root),s=bounds.getSize(vec(0,0,0)),c=bounds.getCenter(vec(0,0,0)),box={x:c.x,z:c.z,w:s.x,d:s.z};obstacles.push(box);objects.registerModel(root,name,kind,[box],id);return root;};
 const factories=[habitat,rocket,observatory,greenhouse,lander,solarFarm,communications,roverWorkshop];
 const landmarkRoots=MOON_LANDMARKS.map((l,i)=>{const root=factories[i]();if(i===0)root.scale.set(1.25,1.2,1.25);return place(root,l.x,l.z,l.name,'building',l.id);});
 // Only eight physical lights can become active; all guidance stripes are batched emission.
 const pools:T.Mesh<T.PlaneGeometry,T.MeshBasicMaterial>[]=[];
 const streetLamps:{x:number;z:number}[]=[];
 for(const l of MOON_LANDMARKS){const x=l.visitX+3,z=l.visitZ+2;if(blocked(x,z,.4,.4,.2))continue;const b=new Builder();b.cylinder(0,1.3,0,.055,2.6,METAL,.045,8);b.box(0,2.62,0,.6,.12,.6,PALE);b.box(0,2.54,0,.37,.05,.37,glowMaterial('#c1d9e2',1.8));const root=place(b.finish(),x,z,'Lunar service light','prop');const source=localNightLight('#c0d9e5',6,10,1.8);source.position.y=2.5;root.add(source);const pool=lightPool(4.8,'#b9d6e1',.055);pool.position.y=.09;root.add(pool);pools.push(pool);streetLamps.push({x,z});}
 // Cable ducts are routed alongside the engineered corridors, never across walking axes.
 for(const [x,z,w,d] of [[-22,-39,.3,19],[37,-42,.3,17],[19,25,12,.3],[-40,39,.3,5]])details.box(x,lunarHeight(x,z)+.15,z,w,.3,d,DARK);
 for(const [x,z,yaw] of [[-21,65,Math.PI/2],[13,64,-.4],[68,68,.8],[-43,-38,1.4]]){const root=rover();root.rotation.y=yaw;place(root,x,z,'Six-wheel lunar rover','prop');}
 for(const [x,z,yaw] of [[9,23,-.4],[40,58,1.7],[-37,38,.7]]){const root=astronaut();root.rotation.y=yaw;place(root,x,z,'Fictional expedition astronaut','prop');}
 const satellites:T.Object3D[]=[];
 for(const [x,z,yaw] of [[-56,-53,.28],[55,13,-.3]]){const root=goldSatellite();root.rotation.y=yaw;satellites.push(place(root,x,z,'Gold-foil satellite service module','prop'));}
 // Low-height cyan/amber service markers and pad arcs share static emission
 // batches. They add futuristic wayfinding without adding dynamic light sources.
 for(const [i,pad] of PADS.entries())for(let j=0;j<32;j++){
  const a=j*Math.PI/16,r=pad.r-.8,x=pad.x+Math.cos(a)*r,z=pad.z+Math.sin(a)*r;
  details.box(x,GROUND+.19,z,.5,.08,.16,glowMaterial(i?'#e1b877':'#7bcbdc',1.65),-a);
 }
 for(const side of [-1,1])for(const z of [-15,-5,5,15]){const x=side*25.5;details.box(x,GROUND+.38,z,.18,.66,.3,METAL);details.box(x,GROUND+.72,z,.22,.08,.34,glowMaterial('#8bdbdf',1.8));}
 // Sealed trees use the existing planting and destruction lifecycle. The first
 // instance bank holds tree/planter/ribs; its second bank is one transparent dome.
 const tree=greenhouseTreeResources();objects.registerTreeSpecies('default',tree.trunk,tree.foliage,tree.bark,tree.leaves,'Sealed greenhouse tree',3.4,3.2);objects.treePreviewGeometry=tree.preview;
 for(const [x,z] of [[-30,48],[-29,55],[-33,63],[26,8],[26,-9],[15,20],[-14,21]])if(!blocked(x,z,3.6,3.6,.4)&&pathDistance(x,z)>1.8&&clearArrival(x,z,2))objects.addTree(x,z,.85,false,0);
 // All loose regolith fragments are instanced. Larger boulders stay away from
 // service paths and arrivals; they are traversable decoration, not hidden walls.
 const rockGeo=new T.IcosahedronGeometry(1,1),rocks=new T.InstancedMesh(rockGeo,material('#888d90'),2400),matrix=new T.Matrix4(),q=new T.Quaternion();let rockCount=0;
 for(let i=0;i<12000&&rockCount<2100;i++){const x=range(-104,104),z=range(-104,104),r=range(.12,.66);if(pathDistance(x,z)<r+1||siteDistance(x,z)<r+1||blocked(x,z,r*2,r*2,.4)||!clearArrival(x,z,r+1))continue;q.setFromEuler(new T.Euler(random(),random()*Math.PI,random()));matrix.compose(vec(x,lunarHeight(x,z)+r*.25,z),q,vec(r,r*.55,r*.8));rocks.setMatrixAt(rockCount,matrix);rocks.setColorAt(rockCount,new T.Color().setScalar(.62+random()*.32));rockCount++;}
 rocks.count=rockCount;rocks.name='Lunar regolith · instanced rock fragments';rocks.castShadow=true;rocks.receiveShadow=true;rocks.userData.nonSolid=true;rocks.raycast=()=>{};scene.add(rocks);
 // Rover tread impressions sit flush to the heightfield and stop before structures.
 for(const side of [-1,1])for(let i=0;i<45;i++){const z=66+i*.68,x=-28+side*.65+Math.sin(i*.035)*4;if(siteDistance(x,z)<0||pathDistance(x,z)<1)continue;details.box(x,lunarHeight(x,z)+.02,z,.32,.025,.18,'#70777b',Math.sin(i*.035)*.2);}
 const detailRoot=details.finish();detailRoot.name='Fictional lunar outpost · landing aprons and guidance paths';scene.add(detailRoot);
 const traffic=createTraffic(scene,objects,{loops:[],junctions:[],laneSign:1,carsPerRoute:0,city:'Moon Base'});
 const localLighting=new LocalNightLighting(scene),groundGlows=new NightGroundGlows(scene,pools);
 const update=(_time:number,_player?:{x:number;z:number},_night=false)=>{};
 const updateLights=(dt:number,focus:T.Vector3,_time:number,night:boolean,_reduced=false)=>{groundGlows.update();localLighting.update(dt,focus,night);};
 return {obstacles,roads,objects,water,river,traffic,update,updateLights,updateClock:(_date=new Date())=>{},landmarks:MOON_LANDMARKS,landmarkRoots,localLighting,groundGlows,streetLamps,rocks,craters:CRATERS,ground,satellites,fictional:true};
}
