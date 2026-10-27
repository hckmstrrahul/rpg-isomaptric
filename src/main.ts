import * as T from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { createCityComposer } from './rendering.ts';
import {disposeWorld} from './disposeWorld.ts';
import { createAppearance } from './appearance.ts';
import { icon } from './icons.ts';
import { setNightMaterials } from './lighting.ts';
import { createRiverReflections } from './reflections.ts';
import { installResponsivePinch } from './zoomInput.ts';
import { createCharacter } from './character.ts';
import { CityMap } from './map.ts';
import { DamageBars } from './damageBars.ts';
import { LANDMARKS, GROUND, WATER_HEIGHT, PLAYER_SPAWN, surfaceHeight, walkStep } from './layout.ts';
import { GameEffects } from './effects.ts';
import { BOMB_RANGE, FIRE_INTERVAL, type Destructible } from './sandbox.ts';
import { pickSceneTeleport, projectTerrainRay } from './teleport3d.ts';
import { SOIL_DEPTH, insideTerrain } from './boundary.ts';
import { WORLD_ID, WORLD_NAME, WORLD_DISTRICT, worldUrl, type WorldId } from './worldLocation.ts';
import {ACTIVE_PLAN} from './worldPlan.ts';
import './style.css';

import { createCityMotion } from './motion.ts';
import type { CityAssets } from './importedAssets.ts';
import { hud } from './hud.ts';
import { renderCharacterPortrait } from './characterPortrait.ts';
import { installInputFocus } from './inputFocus.ts';
import { createMoon, loadMoonTextures } from './moon.ts';
import { createHeldPointers, bindHoldButton } from './touchControls.ts';
import { createArrivalZoom } from './arrivalZoom.ts';
import { cameraPanFactor, BIRDVIEW_ZOOM } from './cameraGlide.ts';
import { createExploreFlight, type ExploreFlightFrame } from './exploreFlight.ts';

document.querySelector<HTMLElement>('#app')!.innerHTML=hud;
installInputFocus();
document.title=`rpg isomaptric · ${WORLD_NAME}${WORLD_ID==='moon'?' · Fictional bonus':''}`;
if(WORLD_ID==='moon'){
  document.querySelector('.help-intro')!.textContent='This is a fictional lunar outpost. In Explore, click or tap open ground to fly there. Trees grow inside sealed greenhouses.';
  document.querySelector('#tree-tool')!.setAttribute('title','Plant a tree in a sealed greenhouse');
  document.querySelector('#world-moon')!.setAttribute('aria-label','Moon Base — fictional bonus world');
  document.querySelector('.brand p')!.textContent='A fictional lunar outpost';
}
document.querySelector('#scene')!.setAttribute('aria-label',`Interactive three-dimensional ${WORLD_NAME}. Use WASD or arrow keys to walk. Click open ground to fly, drag to orbit and scroll to zoom.`);
const worldTabs=[...document.querySelectorAll<HTMLAnchorElement>('[data-world]')];
for(const tab of worldTabs){
  const id=tab.dataset.world as WorldId,selected=id===WORLD_ID;
  tab.href=worldUrl(id,location.href);tab.setAttribute('aria-selected',String(selected));tab.tabIndex=selected?0:-1;
  if(selected)requestAnimationFrame(()=>tab.parentElement!.scrollLeft=Math.max(0,tab.offsetLeft-(tab.parentElement!.clientWidth-tab.clientWidth)/2));
  tab.addEventListener('click',event=>{
    if(event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;
    if(selected){event.preventDefault();return;}
    try{localStorage.setItem('rpg-isomaptric-world',id);}catch{/* URL remains the source of truth. */}
    document.documentElement.classList.add('world-changing');
  });
  tab.addEventListener('keydown',event=>{
    if(event.code==='Space'){event.preventDefault();tab.click();return;}
    if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
    event.preventDefault();const next=event.key==='Home'?0:event.key==='End'?worldTabs.length-1:(worldTabs.indexOf(tab)+(event.key==='ArrowRight'?1:-1)+worldTabs.length)%worldTabs.length;
    worldTabs[next].focus();
  });
}
try{localStorage.setItem('rpg-isomaptric-world',WORLD_ID);}catch{/* Private mode is supported. */}
for(const node of document.querySelectorAll<HTMLElement>('.ui, #scene, .skip-link'))node.inert=true;

const $=<E extends HTMLElement=HTMLElement>(id:string)=>document.getElementById(id) as E;
const notifications=import('./notifications.ts').then(module=>module.mountNotifications());
let persistentMessage=false,messageVersion=0;
function dismissToast(){persistentMessage=false;messageVersion++;void notifications.then(api=>api.dismiss());}
function toast(message:string,persistent=false) {
  if(persistentMessage&&!persistent)return;
  persistentMessage=persistent;const version=++messageVersion;
  void notifications.then(api=>{if(version===messageVersion)api.show(message,persistent,()=>{if(version===messageVersion)persistentMessage=false;});});
}

async function init() {
  await new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve())));
  const canvas=$<HTMLCanvasElement>('scene');
  const renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.setSize(innerWidth,innerHeight);
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
  renderer.info.autoReset=false;
  renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.04;renderer.outputColorSpace=T.SRGBColorSpace;
  const scene=new T.Scene();scene.background=new T.Color('#a8c8bd');
  const pmrem=new T.PMREMGenerator(renderer);const env=new RoomEnvironment();
  scene.environment=pmrem.fromScene(env,.04).texture;scene.environmentIntensity=.28;env.dispose();pmrem.dispose();
  const skyLight=new T.HemisphereLight('#d6ecf3','#667349',1.25);scene.add(skyLight);
  const sun=new T.DirectionalLight('#fff1d2',3.2);sun.position.set(-90,170,60);sun.castShadow=true;
  sun.shadow.mapSize.set(4096,4096);sun.shadow.camera.left=-165;sun.shadow.camera.right=165;sun.shadow.camera.top=165;sun.shadow.camera.bottom=-165;
  sun.shadow.camera.near=1;sun.shadow.camera.far=450;sun.shadow.normalBias=.12;sun.shadow.bias=-.00008;sun.shadow.radius=2;scene.add(sun);
  const fill=new T.DirectionalLight('#c9e8f1',.4);fill.position.set(70,80,-110);scene.add(fill);
  const ground=new T.Mesh(new T.PlaneGeometry(2400,2400),new T.MeshStandardMaterial({color:'#a9c9b9',roughness:1}));ground.rotation.x=-Math.PI/2;ground.position.y=-SOIL_DEPTH-.1;ground.receiveShadow=true;scene.add(ground);
  const camera=new T.OrthographicCamera(-140,140,126,-126,.1,1800);
  const compactViewport=matchMedia('(max-width: 1100px), (max-width: 1366px) and (pointer: coarse)');
  const overviewZoom=()=>compactViewport.matches?1.8:ACTIVE_PLAN.camera.zoom;
  const characterZoom=()=>compactViewport.matches?8:6;
  let arrivalZoom:ReturnType<typeof createArrivalZoom>|null=null;
  let exploreFlight:ReturnType<typeof createExploreFlight>|null=null,flightFrame:ExploreFlightFrame|null=null;
  const flightViewOffset=new T.Vector3();
  let flightZoomBase:number|null=null;
  let capturePaused=false,resourcesReleased=false,animationId=0;
  let previousOverviewZoom=overviewZoom();camera.zoom=previousOverviewZoom;
  const initialOffset=new T.Vector3(...(ACTIVE_PLAN.camera.offset??[215,185,235]));
  camera.position.copy(initialOffset);camera.lookAt(0,0,0);
  const controls=new OrbitControls(camera,canvas);controls.enableDamping=true;controls.dampingFactor=.085;
  controls.minPolarAngle=0;controls.maxPolarAngle=1.3;controls.minZoom=.6;controls.maxZoom=12;controls.zoomSpeed=.85;controls.rotateSpeed=.65;controls.panSpeed=.7;
  controls.target.set(0,2,0);controls.update();
  const {composer,bloom}=createCityComposer(renderer,scene,camera,innerWidth,innerHeight);
  const resize=()=>{
    const nextOverviewZoom=overviewZoom();
    if(arrivalZoom?.active)arrivalZoom.cancel();
    else if(Math.abs(camera.zoom-previousOverviewZoom)<.001)camera.zoom=nextOverviewZoom;
    previousOverviewZoom=nextOverviewZoom;
    const aspect=innerWidth/innerHeight,vertical=Math.max(252,332/aspect);
    camera.left=-vertical*aspect/2;camera.right=vertical*aspect/2;camera.top=vertical/2;camera.bottom=-vertical/2;camera.updateProjectionMatrix();
    renderer.setSize(innerWidth,innerHeight);composer.setSize(innerWidth,innerHeight);
  };
  resize();addEventListener('resize',resize);compactViewport.addEventListener('change',resize);
  const [assets,moonTextures]=await Promise.all([WORLD_ID==='london'?(await import('./importedAssets.ts')).loadCityAssets():Promise.resolve({loaded:[]} as CityAssets),ACTIVE_PLAN.moonVisible===false?Promise.resolve(null):loadMoonTextures()]);
  if(WORLD_ID==='dubai')await (await import('./worlds/dubai/landmarks.ts')).loadDubaiLettering();
  const builders={
    london:async()=> (await import('./world.ts')).createWorld(scene,assets),
    dubai:async()=> (await import('./worlds/dubai/world.ts')).createDubaiWorld(scene,assets),
    agra:async()=> (await import('./worlds/agra/world.ts')).createAgraWorld(scene,assets),
    bengaluru:async()=> (await import('./worlds/bengaluru/world.ts')).createBengaluruWorld(scene,assets),
    hyderabad:async()=> (await import('./worlds/hyderabad/world.ts')).createHyderabadWorld(scene,assets),
    moon:async()=> (await import('./worlds/moon/world.ts')).createMoonWorld(scene,assets),
    lisbon:async()=> (await import('./worlds/lisbon/world.ts')).createLisbonWorld(scene,assets),
  };
  const world=await builders[WORLD_ID](),character=createCharacter();scene.add(character.root);
  character.root.position.set(PLAYER_SPAWN.x,surfaceHeight(PLAYER_SPAWN.x,PLAYER_SPAWN.z)+.13,PLAYER_SPAWN.z);
  controls.target.copy(character.root.position);camera.position.copy(character.root.position).add(initialOffset);controls.update();
  character.animate(0,false,false,false);
  renderCharacterPortrait(renderer,character.body,$<HTMLCanvasElement>('character-portrait'),scene.environment);
  const reflections=ACTIVE_PLAN.waterVisible===false?{update:(_renderer:T.WebGLRenderer,_now:number)=>{},dispose:()=>{}}:createRiverReflections(scene,world.water,camera,world.river);
  $('visited-count').textContent=`0 of ${LANDMARKS.length} places discovered`;
  const miniMap=new CityMap($<HTMLCanvasElement>('mini-map'),world.obstacles,world.roads,false,world.objects.state.objects);
  const motionPreference=matchMedia('(prefers-reduced-motion: reduce)');
  const lunar=ACTIVE_PLAN.moonVisible===false;
  const moon=moonTextures?createMoon(scene,sun,moonTextures,motionPreference.matches):{
    setNight:(night:boolean)=>{sun.intensity=night?.6:3.2;sun.color.set(night?'#b8c7d6':'#fff7e8');sun.position.set(-140,100,70);},
    setReduced:(_value:boolean)=>{},update:(_dt:number)=>{},
  };
  const theme=matchMedia('(prefers-color-scheme: dark)');
  let storage:Storage|undefined;try{storage=window.localStorage;}catch{ /* Preferences still work for this session. */ }
  const appearance=createAppearance(storage);let night=appearance.isNight(theme.matches);
  const applyTheme=()=>{
    document.documentElement.classList.add('theme-changing');
    night=appearance.isNight(theme.matches);document.documentElement.dataset.theme=night?'night':'day';document.documentElement.style.colorScheme=night?'dark':'light';
    document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')!.content=night?'#171c22':'#a8c8bd';
    const toggle=$('theme-button');toggle.innerHTML=`${icon(night?'moon':'sun',16)} <span>${night?'Night':'Day'}</span>`;
    toggle.setAttribute('aria-label',`${night?'Night':'Day'} mode. Switch to ${night?'day':'night'} mode.`);toggle.title=`Switch to ${night?'day':'night'} mode`;
    setNightMaterials(night);world.traffic.signals.setNight(night);character.setNight(night);bloom.enabled=night;moon.setNight(night);
    scene.background=new T.Color(lunar?'#07121c':night?'#171c22':'#a8c8bd');scene.environmentIntensity=night?.19:.28;
    skyLight.intensity=lunar?(night?.28:.65):night?.72:1.25;skyLight.color.set(night?'#a3afbd':'#d6ecf3');skyLight.groundColor.set(lunar?'#555b64':night?'#3b4846':'#667349');
    fill.intensity=night?.22:.4;fill.color.set(night?'#9baab8':'#c9e8f1');
    ground.material.color.set(lunar?'#07121c':night?'#252c31':'#a9c9b9');world.river.material.color.set(night?'#344854':ACTIVE_PLAN.waterColor);world.river.night.value=night?1:0;
    miniMap.night=night;
    renderer.toneMappingExposure=night?1.14:1.04;
    void document.documentElement.offsetHeight;
    requestAnimationFrame(()=>document.documentElement.classList.remove('theme-changing'));
  };
  applyTheme();theme.addEventListener('change',applyTheme);
  $('theme-button').onclick=event=>{appearance.toggle(theme.matches);applyTheme();if(event.detail>0)canvas.focus({preventScroll:true});};
  $('theme-button').addEventListener('keydown',event=>{if(event.code==='Space'||event.code==='Enter')event.stopPropagation();});
  const damageBars=new DamageBars($('damage-bars'));
  const keys=new Set<string>(),visited=new Set<string>(),touchInput=createHeldPointers();
  const clearTouch=()=>{touchInput.clear();document.querySelectorAll('.is-held').forEach(button=>button.classList.remove('is-held'));};
  const keyHeld=(key:string)=>keys.has(key)||touchInput.has(key);
  let exploring=true,following=true,birdview=false,helpOpen=false,zoomTarget:number|null=null;
  let cameraGoal:T.Vector3|null=null,orientationGoal:T.Vector3|null=null;
  let time=0,lastTime=performance.now(),lastMap=0,lastDiscovery=0;
  let lastClock=-Infinity;
  controls.addEventListener('start',()=>{arrivalZoom?.cancel();});
  installResponsivePinch(canvas,camera,controls,()=>{arrivalZoom?.cancel();zoomTarget=null;flightZoomBase=null;});
  for(const id of ['location','toolbelt','use-tool'])$(id).classList.remove('hidden');
  $('touch-pad').classList.add('visible');
  let helpReturnFocus:HTMLElement|null=null;
  const motion=createCityMotion(motionPreference.matches);
  const effects=new GameEffects(scene,world.objects.treePreviewGeometry,motion.reduced);
  const syncMotion=()=>{
    motion.setReduced(motionPreference.matches);effects.reducedMotion=motion.reduced;moon.setReduced(motion.reduced);
    arrivalZoom?.setReduced(motion.reduced);
    exploreFlight?.setReduced(motion.reduced);
    controls.enableDamping=!motion.reduced;
  };
  motionPreference.addEventListener('change',syncMotion);syncMotion();
  let tool:'explore'|'bomb'|'tree'='explore',heldFire=false,mouseAim=false,lastPlant=-100;
  const pointer=new T.Vector2(),aimRay=new T.Raycaster(),flightRay=new T.Ray(),flightDirection=new T.Vector3();
  const aimPoint=new T.Vector3(),muzzlePoint=new T.Vector3();
  let aimedObject:Destructible|null=null,aimValid=true,aimIssue:string|null=null;
  let pointerDown:{x:number;y:number;time:number;id:number;moved:boolean}|null=null;
  const scenePointers=new Set<number>();
  function clearOrbitInertia() {
    const damping=controls.enableDamping;controls.enableDamping=false;controls.update();controls.enableDamping=damping;
  }
  function syncToolButtons() {
    for(const [id,selected]of [['explore-tool',tool==='explore'],['bomb-tool',tool==='bomb'],['tree-tool',tool==='tree']] as const){$(id).classList.toggle('active',selected);$(id).setAttribute('aria-pressed',String(selected));}
    character.setTool(tool);
    $('use-tool').classList.toggle('hidden',tool==='explore');
    $('use-tool').setAttribute('aria-label',tool==='bomb'?'Fire grenade':'Plant a tree');
    $('use-tool').innerHTML=`${icon(tool==='bomb'?'bomb':'tree',20)} ${tool==='bomb'?'Fire':'Plant'}`;
  }
  function selectTool(value:'explore'|'bomb'|'tree') {
    tool=value;heldFire=false;
    if(!exploring)startExploring(false);
    syncToolButtons();
    canvas.focus({preventScroll:true});
  }
  function updateAim() {
    const p=character.root.position,heading=character.body.rotation.y;
    aimedObject=null;
    if(tool==='explore'||exploreFlight||flightFrame) {effects.aim(muzzlePoint,aimPoint,false,false,false);return;}
    if(mouseAim) {
      aimRay.setFromCamera(pointer,camera);
      const hit=tool==='bomb'?world.objects.pick(aimRay.ray):null;
      if(hit){aimedObject=hit.object;aimPoint.copy(hit.point);}
      else {
        const terrain=projectTerrainRay(aimRay.ray);
        if(terrain)aimPoint.copy(terrain);
        else {aimPoint.set(p.x+Math.sin(heading)*4,p.y,p.z+Math.cos(heading)*4);aimPoint.y=surfaceHeight(aimPoint.x,aimPoint.z)+.04;}
      }
    } else {
      if(tool==='bomb')aimedObject=world.objects.state.targetAhead(p,heading);
      if(aimedObject) {
        aimPoint.set(T.MathUtils.clamp(p.x,aimedObject.x-aimedObject.w/2,aimedObject.x+aimedObject.w/2),(aimedObject.baseY??GROUND)+Math.min(2,aimedObject.height*.45),T.MathUtils.clamp(p.z,aimedObject.z-aimedObject.d/2,aimedObject.z+aimedObject.d/2));
      } else {
        const range=tool==='tree'?3.4:BOMB_RANGE;
        aimPoint.set(p.x+Math.sin(heading)*range,GROUND+.15,p.z+Math.cos(heading)*range);
        aimPoint.y=surfaceHeight(aimPoint.x,aimPoint.z)+.04;
      }
    }
    aimIssue=tool==='tree'?world.objects.plantingIssue(aimPoint,p):Math.hypot(aimPoint.x-p.x,aimPoint.z-p.z)>BOMB_RANGE+1e-6?`Move closer · launcher range ${BOMB_RANGE} m`:null;
    aimValid=!aimIssue;
    character.root.updateMatrixWorld(true);character.muzzle.getWorldPosition(muzzlePoint);
    effects.aim(muzzlePoint,aimPoint,tool==='tree',aimValid,exploring&&!helpOpen);
  }
  let lastToolIssue='',lastToolNotice=-Infinity;
  const toolNotice=(message:string)=>{
    if(message===lastToolIssue&&time-lastToolNotice<6)return;
    lastToolIssue=message;lastToolNotice=time;toast(message);
  };
  function useTool(silent=false,canvasClick=false) {
    if(helpOpen||tool==='explore'||exploreFlight||flightFrame)return;
    if(!exploring)startExploring(false);
    updateAim();
    if(!aimValid){const landClick=canvasClick&&tool==='bomb'&&insideTerrain(aimPoint.x,aimPoint.z)&&surfaceHeight(aimPoint.x,aimPoint.z)!==WATER_HEIGHT;if(!silent||landClick)toolNotice(aimIssue!);return;}
    if(persistentMessage)dismissToast();
    const p=character.root.position;
    character.body.rotation.y=Math.atan2(aimPoint.x-p.x,aimPoint.z-p.z);
    if(tool==='tree') {
      if(time-lastPlant<.35)return;
      const result=world.objects.plant(aimPoint,p,time);
      if(result.issue){if(!silent)toolNotice(result.issue);return;}
      lastPlant=time;character.plant(time);effects.planted(aimPoint);if(!silent)toast('Tree planted.');
    } else if(world.objects.state.fire(time)) {
      character.root.updateMatrixWorld(true);character.muzzle.getWorldPosition(muzzlePoint);
      character.fire(time);effects.launch(muzzlePoint,aimPoint,aimedObject,time);
    }
  }
  const setFollowing=(value:boolean)=>{following=value;$('follow').classList.toggle('active',value);$('follow').setAttribute('aria-pressed',String(value));};
  const setBirdview=(value:boolean)=>{birdview=value;$('birdview').classList.toggle('active',value);$('birdview').setAttribute('aria-pressed',String(value));};
  setFollowing(true);
  function startExploring(showHint=true) {
    exploring=true;$('location').classList.remove('hidden');$('touch-pad').classList.add('visible');
    for(const id of ['toolbelt','use-tool'])$(id).classList.remove('hidden');
    syncToolButtons();
    setFollowing(true);zoomTarget=birdview?null:compactViewport.matches?overviewZoom():6;cameraGoal=character.root.position.clone();
    if(showHint)toast('WASD to walk · Click open ground to fly in Explore · B for bombs · T for trees');
  }
  function setHelp(open:boolean) {
    if(open===helpOpen)return;
    helpOpen=open;
    if(open){keys.clear();clearTouch();heldFire=false;helpReturnFocus=document.activeElement as HTMLElement;}
    $('help-panel').classList.toggle('open',open);$('help-panel').inert=!open;
    $('help-button').classList.toggle('active',open);$('help-button').setAttribute('aria-expanded',String(open));
    $('touch-help').classList.toggle('active',open);$('touch-help').setAttribute('aria-expanded',String(open));
    if(open)$('help-close').focus();else (helpReturnFocus||canvas).focus({preventScroll:true});
  }
  function flyToPointer() {
    if(tool!=='explore'||helpOpen)return;
    camera.updateMatrixWorld();aimRay.setFromCamera(pointer,camera);
    const pick=pickSceneTeleport(aimRay.ray,world.obstacles,world.objects.pick(aimRay.ray));
    if(!pick.destination.valid)return;
    const p=pick.destination.position,to=new T.Vector3(p.x,p.y,p.z);
    if(character.root.position.distanceTo(to)<.3)return;
    flightViewOffset.copy(controls.target).sub(character.root.position);
    flightZoomBase??=camera.zoom;
    exploreFlight=createExploreFlight(character.root.position,to,world.objects.state.objects,motion.reduced,flightFrame?.lean??0,camera.zoom/flightZoomBase);
    keys.clear();clearTouch();heldFire=false;mouseAim=false;cameraGoal=null;zoomTarget=null;
    arrivalZoom?.cancel();clearOrbitInertia();setFollowing(true);
    canvas.focus({preventScroll:true});
  }
  const overview=()=>{setBirdview(false);setFollowing(compactViewport.matches);zoomTarget=overviewZoom();cameraGoal=compactViewport.matches?character.root.position.clone():new T.Vector3(...ACTIVE_PLAN.camera.focus);orientationGoal=initialOffset.clone();};
  $('help-button').onclick=()=>setHelp(!helpOpen);$('help-close').onclick=()=>setHelp(false);
  $('touch-help').onclick=()=>setHelp(!helpOpen);
  $('zoom-in').onclick=()=>zoomTarget=Math.min(12,(zoomTarget??camera.zoom)*1.35);
  $('zoom-out').onclick=()=>zoomTarget=Math.max(.6,(zoomTarget??camera.zoom)/1.35);
  $('follow').onclick=()=>{startExploring(false);toast('Camera following your explorer.');};
  $('overview').onclick=overview;
  $('birdview').onclick=()=>{arrivalZoom?.cancel();clearOrbitInertia();setBirdview(true);setFollowing(true);zoomTarget=BIRDVIEW_ZOOM;cameraGoal=character.root.position.clone();orientationGoal=new T.Vector3(0,initialOffset.length(),.0001);};
  $('compass').onclick=()=>{setBirdview(false);orientationGoal=initialOffset.clone();};
  $('explore-tool').onclick=()=>selectTool('explore');$('bomb-tool').onclick=()=>selectTool('bomb');$('tree-tool').onclick=()=>selectTool('tree');syncToolButtons();
  // Mouse/touch camera actions return to gameplay; Tab/Enter activation keeps
  // focus on the button so keyboard users can continue navigating the toolbar.
  document.querySelectorAll<HTMLButtonElement>('.tools button').forEach(button=>{
    button.addEventListener('click',event=>{if(event.detail>0)canvas.focus({preventScroll:true});});
  });
  const adjustCamera=(azimuth:number,polar:number)=>{
    clearOrbitInertia();if(polar)setBirdview(false);cameraGoal=null;
    const spherical=new T.Spherical().setFromVector3(camera.position.clone().sub(controls.target));
    spherical.theta+=azimuth;spherical.phi=T.MathUtils.clamp(spherical.phi+polar,controls.minPolarAngle,controls.maxPolarAngle);
    orientationGoal=new T.Vector3().setFromSpherical(spherical);
  };
  $('rotate-left').onclick=()=>adjustCamera(-Math.PI/8,0);$('rotate-right').onclick=()=>adjustCamera(Math.PI/8,0);
  $('tilt-up').onclick=()=>adjustCamera(0,-.15);$('tilt-down').onclick=()=>adjustCamera(0,.15);
  const panCamera=(up:number,side:number)=>{
    clearOrbitInertia();setFollowing(false);orientationGoal=null;
    const forward=camera.getWorldDirection(new T.Vector3());forward.y=0;forward.normalize();
    const right=new T.Vector3().crossVectors(forward,new T.Vector3(0,1,0));
    cameraGoal=controls.target.clone().addScaledVector(forward,up*12/camera.zoom).addScaledVector(right,side*12/camera.zoom);
  };
  $('pan-left').onclick=()=>panCamera(0,-1);$('pan-right').onclick=()=>panCamera(0,1);
  $('pan-up').onclick=()=>panCamera(1,0);$('pan-down').onclick=()=>panCamera(-1,0);
  canvas.addEventListener('pointerdown',e=>{
    arrivalZoom?.cancel();
    scenePointers.add(e.pointerId);
    const dismissingHelp=helpOpen;if(dismissingHelp)setHelp(false);
    zoomTarget=null;cameraGoal=null;orientationGoal=null;if(e.button===2)setFollowing(false);
    if(scenePointers.size>1){setFollowing(false);pointerDown=null;return;}
    // Dismissing the help popover must not also launch a bomb into the scene.
    if(e.button===0)pointerDown=dismissingHelp?null:{x:e.clientX,y:e.clientY,time:performance.now(),id:e.pointerId,moved:false};
  });
  canvas.addEventListener('pointermove',e=>{
    if(pointerDown?.id===e.pointerId&&Math.hypot(e.clientX-pointerDown.x,e.clientY-pointerDown.y)>=6)pointerDown.moved=true;
    const rect=canvas.getBoundingClientRect();pointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);
    if(!e.buttons)mouseAim=true;
  });
  canvas.addEventListener('pointerleave',()=>{mouseAim=false;});
  canvas.addEventListener('pointercancel',event=>{scenePointers.delete(event.pointerId);pointerDown=null;});
  canvas.addEventListener('pointerup',e=>{
    scenePointers.delete(e.pointerId);
    if(e.button===0&&pointerDown?.id===e.pointerId&&!pointerDown.moved&&exploring&&Math.hypot(e.clientX-pointerDown.x,e.clientY-pointerDown.y)<6&&performance.now()-pointerDown.time<400) {
      const rect=canvas.getBoundingClientRect();pointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);
      if(tool==='explore')flyToPointer();
      else{mouseAim=true;if(!compactViewport.matches)useTool(true,true);}
    }
    pointerDown=null;
  });
  canvas.addEventListener('wheel',()=>{zoomTarget=null;flightZoomBase=null;},{passive:true});
  const moveKeys=['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowLeft','ArrowDown','ArrowRight'];
  addEventListener('keydown',e=>{
    if(e.metaKey||e.ctrlKey||e.altKey)return;
    if(e.code==='Escape'){setHelp(false);if(persistentMessage)dismissToast();return;}
    // Character shortcuts belong to the canvas, never focused buttons, links or settings.
    if(e.target!==canvas&&e.target!==document.body)return;
    if(helpOpen)return;
    if(e.code==='KeyE'&&!e.repeat){e.preventDefault();selectTool('explore');return;}
    if(e.code==='KeyB'&&!e.repeat){selectTool('bomb');return;}
    if(e.code==='KeyC'&&!e.repeat){startExploring(false);zoomTarget=12;return;}
    if(e.code==='KeyT'&&!e.repeat){e.preventDefault();selectTool('tree');useTool();return;}
    if(e.code==='Space') {e.preventDefault();if(!e.repeat){heldFire=tool==='bomb';useTool();}return;}
    if(e.code==='Slash'&&!e.repeat){e.preventDefault();setHelp(!helpOpen);return;}
    if(e.code==='KeyF'&&!e.repeat){startExploring(false);return;}
    if(e.code==='KeyR'&&!e.repeat){overview();return;}
    if(e.code==='Equal'||e.code==='NumpadAdd')zoomTarget=Math.min(12,(zoomTarget??camera.zoom)*1.12);
    if(e.code==='Minus'||e.code==='NumpadSubtract')zoomTarget=Math.max(.6,(zoomTarget??camera.zoom)/1.12);
    if(moveKeys.includes(e.code)){e.preventDefault();if(!exploring)startExploring(false);if(compactViewport.matches||birdview)setFollowing(true);keys.add(e.code);mouseAim=false;}
    if(e.code.startsWith('Shift'))keys.add(e.code);
  });
  addEventListener('keyup',e=>{keys.delete(e.code);if(e.code==='Space')heldFire=false;});
  addEventListener('blur',()=>{keys.clear();clearTouch();scenePointers.clear();heldFire=false;});
  canvas.addEventListener('blur',()=>{keys.clear();heldFire=false;});
  document.addEventListener('visibilitychange',()=>{keys.clear();clearTouch();scenePointers.clear();heldFire=false;lastTime=performance.now();});
  document.querySelectorAll<HTMLButtonElement>('[data-move]').forEach(button=>{
    const start=()=>{if(helpOpen)setHelp(false);setFollowing(true);mouseAim=false;};
    bindHoldButton(button,button.dataset.move!,touchInput,()=>true,start,()=>{
      start();keys.add(button.dataset.move!);setTimeout(()=>keys.delete(button.dataset.move!),140);
    });
  });
  bindHoldButton($<HTMLButtonElement>('run-tool'),'ShiftLeft',touchInput,()=>!helpOpen,()=>{},()=>{
    keys.add('ShiftLeft');setTimeout(()=>keys.delete('ShiftLeft'),500);
  });
  bindHoldButton($<HTMLButtonElement>('use-tool'),'use',touchInput,()=>!helpOpen,()=>useTool(),()=>useTool());
  const projected=new T.Vector3(),forward=new T.Vector3(),right=new T.Vector3(),movement=new T.Vector3();
  function screenPosition(el:HTMLElement,x:number,y:number,z:number) {
    projected.set(x,y,z).project(camera);el.style.left=`${(projected.x*.5+.5)*innerWidth}px`;el.style.top=`${(-projected.y*.5+.5)*innerHeight}px`;
    el.style.display=projected.z>1||projected.z< -1?'none':'';
  }
  let frameCount=0,frameMs=0;
  const animate=(now:number)=>{
    if(resourcesReleased)return;
    animationId=requestAnimationFrame(animate);
    if(capturePaused)return;
    if(document.hidden)return;
    const elapsed=Math.max(0,now-lastTime),dt=Math.min(elapsed/1000,.05);lastTime=now;time+=dt;
    if(elapsed>0){frameCount++;frameMs+=elapsed;}
    const up=Number(keyHeld('KeyW')||keyHeld('ArrowUp'))-Number(keyHeld('KeyS')||keyHeld('ArrowDown'));
    const sideways=Number(keyHeld('KeyD')||keyHeld('ArrowRight'))-Number(keyHeld('KeyA')||keyHeld('ArrowLeft'));
    const running=keyHeld('ShiftLeft')||keyHeld('ShiftRight');
    let moving=false;
    if((up||sideways)&&!helpOpen&&!exploreFlight) {
      camera.getWorldDirection(forward);forward.y=0;forward.normalize();right.crossVectors(forward,new T.Vector3(0,1,0)).normalize();
      movement.copy(forward).multiplyScalar(up).addScaledVector(right,sideways).normalize().multiplyScalar(dt*(running?11:5.4));
      const p=character.root.position,next=walkStep(p.x,p.z,movement.x,movement.z,world.obstacles);
      moving=Math.hypot(next.x-p.x,next.z-p.z)>.0001;
      if(moving){p.x=next.x;p.z=next.z;const heading=Math.atan2(movement.x,movement.z);character.body.rotation.y+=Math.atan2(Math.sin(heading-character.body.rotation.y),Math.cos(heading-character.body.rotation.y))*Math.min(1,dt*16);}
    }
    const p=character.root.position;flightFrame=exploreFlight?.tick(dt)??null;
    if(flightFrame) {
      p.copy(flightFrame.position);
      const turn=flightFrame.heading-character.body.rotation.y;
      character.body.rotation.y+=Math.atan2(Math.sin(turn),Math.cos(turn))*Math.min(1,dt*20);
      if(!exploreFlight!.active)exploreFlight=null;
    } else p.y=surfaceHeight(p.x,p.z)+.13;
    character.animate(time,moving,running,motion.playing,flightFrame);
    motion.tick(dt);if(motion.playing)world.update(motion.time,p,night);
    if(now-lastClock>100){world.updateClock(new Date());lastClock=now;}
    world.objects.update(time);
    effects.update(time,dt,(point,target)=>{
      const hits=world.objects.blast(point,target,time),cleared=hits.filter(hit=>hit.destroyed);
      effects.explosion(point,cleared.some(hit=>hit.object.kind==='building'));
      for(const hit of hits)if(hit.damage>0)damageBars.hit(hit.object,time);

    },(from,to)=>{
      flightDirection.copy(to).sub(from);const length=flightDirection.length();if(length<.0001)return null;
      flightRay.set(from,flightDirection.normalize());const hit=world.objects.pick(flightRay);
      return hit&&from.distanceTo(hit.point)<=length+1e-5?hit:null;
    });
    const ease=cameraPanFactor(dt,false,birdview,motion.reduced);
    if(zoomTarget!==null)flightZoomBase=null;
    if(zoomTarget!==null||orientationGoal!==null)arrivalZoom?.cancel();
    const arrivingZoom=arrivalZoom?.tick(dt);
    if(arrivingZoom!==null&&arrivingZoom!==undefined){camera.zoom=arrivingZoom;camera.updateProjectionMatrix();}
    if(zoomTarget!==null){camera.zoom=T.MathUtils.lerp(camera.zoom,zoomTarget,ease);if(Math.abs(camera.zoom-zoomTarget)<.002){camera.zoom=zoomTarget;zoomTarget=null;}camera.updateProjectionMatrix();}
    if(flightFrame&&flightZoomBase!==null){camera.zoom=flightZoomBase*flightFrame.zoomFactor;camera.updateProjectionMatrix();if(flightFrame.landed)flightZoomBase=null;}
    if(flightFrame&&following) {
      // The character path is already eased: tracking it directly avoids lagging offscreen.
      const focus=p.clone().addScaledVector(flightViewOffset,1-T.MathUtils.smoothstep(flightFrame.progress,0,.2));
      camera.position.add(focus.clone().sub(controls.target));controls.target.copy(focus);cameraGoal=null;
    }
    else {
      if(following&&!cameraGoal)cameraGoal=p.clone();
      if(cameraGoal) {
        if(following)cameraGoal.copy(p);
        const delta=cameraGoal.clone().sub(controls.target).multiplyScalar(cameraPanFactor(dt,following&&moving,birdview,motion.reduced));camera.position.add(delta);controls.target.add(delta);
        if(!following&&controls.target.distanceTo(cameraGoal)<.02)cameraGoal=null;
      }
    }
    if(orientationGoal) {
      const desired=controls.target.clone().add(orientationGoal);camera.position.lerp(desired,ease);
      if(camera.position.distanceTo(desired)<.05)orientationGoal=null;
    }
    controls.update();
    if(birdview&&!orientationGoal&&controls.getPolarAngle()>.01)setBirdview(false);
    camera.updateMatrixWorld();moon.update(dt);world.updateLights(dt,controls.target,time,night,motion.reduced||!motion.playing);
    updateAim();if((heldFire||touchInput.has('use'))&&!helpOpen&&time-world.objects.state.lastShot>=FIRE_INTERVAL)useTool(true);
    damageBars.update(camera,time,innerWidth,innerHeight);
    if(now-lastDiscovery>250) {
      let nearest=LANDMARKS[0],distance=Infinity;
      for(const l of LANDMARKS) {const d=Math.hypot(p.x-l.visitX,p.z-l.visitZ);if(d<distance){nearest=l;distance=d;}}
      $('location-name').textContent=distance<24?nearest.short:WORLD_DISTRICT;
      if(exploring&&!flightFrame?.airborne&&distance<11&&!visited.has(nearest.id)) {
        visited.add(nearest.id);toast(`${nearest.short} discovered · ${visited.size} of ${LANDMARKS.length}`);
        $('visited-count').textContent=`${visited.size} of ${LANDMARKS.length} places discovered`;
      }
      lastDiscovery=now;
    }
    if(now-lastMap>100){miniMap.draw(p.x,p.z,character.body.rotation.y,visited);lastMap=now;}
    screenPosition($('player-tag'),p.x,p.y+3.1,p.z);
    const angle=Math.atan2(camera.position.x-controls.target.x,camera.position.z-controls.target.z);
    $('compass').querySelector('svg')!.style.transform=`rotate(${angle-.74}rad)`;
    renderer.info.reset();reflections.update(renderer,now);composer.render();
  };
  animationId=requestAnimationFrame(animate);
  addEventListener('pagehide',()=>{
    resourcesReleased=true;cancelAnimationFrame(animationId);controls.dispose();reflections.dispose();
    for(const pass of composer.passes)pass.dispose();composer.dispose();disposeWorld(scene);
    world.objects.models.clear();world.objects.trees.clear();world.objects.state.objects.length=0;world.obstacles.length=0;
    renderer.dispose();renderer.forceContextLoss();
  },{once:true});
  addEventListener('pageshow',event=>{if(event.persisted)location.reload();});
  // A small read-only inspection surface supports repeatable browser verification.
  Object.defineProperty(window,'__littleLondon',{value:{
    getState:()=>({world:WORLD_ID,position:{x:character.root.position.x,y:character.root.position.y,z:character.root.position.z},zoom:camera.zoom,night,ambientMotion:motion.playing,assets:assets.loaded,exploring,following,helpOpen,visited:[...visited],drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,averageFps:frameMs>0?Math.round(frameCount/(frameMs/1000)):0,obstacles:world.obstacles.length,landmarks:LANDMARKS.length,tool,flying:!!exploreFlight,shots:world.objects.state.shots,cleared:world.objects.state.demolished,planted:world.objects.state.treesPlanted,projectiles:effects.projectiles.length,target:aimedObject?{name:aimedObject.name,hp:aimedObject.hp,maxHp:aimedObject.maxHp}:null}),
  }});
  if(import.meta.env.VITE_CAPTURE==='1') {
    const {installCaptureControls}=await import('./capture.ts');
    installCaptureControls({scene,renderer,composer,camera,controls,world,character,
      pause:()=>{capturePaused=true;arrivalZoom?.cancel();exploreFlight=null;flightZoomBase=null;setFollowing(false);controls.enableDamping=false;},
      setNight:value=>{if(value!==night){appearance.toggle(theme.matches);applyTheme();}},
      settleMoon:()=>{for(let i=0;i<180;i++)moon.update(1/60);},
      reflect:()=>{reflections.update(renderer,performance.now()+1000);},
      refreshHud:()=>{const p=character.root.position;miniMap.draw(p.x,p.z,character.body.rotation.y,visited);screenPosition($('player-tag'),p.x,p.y+3.1,p.z);},
    });
  }
  for(const node of document.querySelectorAll<HTMLElement>('.ui, #scene, .skip-link'))node.inert=node.id==='help-panel';
  arrivalZoom=createArrivalZoom(camera.zoom,characterZoom(),motion.reduced);lastTime=performance.now();
  $('loading').classList.add('hidden');setTimeout(()=>$('loading').remove(),700);
  canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();if(resourcesReleased)return;toast('Graphics paused. Reload the page to restore the city.',true);});
}

init().catch(error=>{
  console.error(error);
  $('loading').setAttribute('role','alert');
  $('loading').innerHTML=`<div class="error"><h2>The city couldn’t open</h2><p>Something prevented the city from loading. Try again. If it still won’t open, check that WebGL is enabled in your browser.</p><button class="primary" id="retry"><span>Try again</span>${icon('arrow')}</button></div>`;
  $('retry').onclick=()=>location.reload();$('retry').focus();
});
