import * as T from 'three';
import { Builder, material, vec } from './geometry.ts';
import { glowMaterial, lightPool } from './lighting.ts';
import type { ExploreFlightFrame } from './exploreFlight.ts';

/** A jointed, layered artificer: each rigid section is batched, each limb animates. */
export function createCharacter() {
  const root=new T.Group(),body=new T.Group();root.add(body);
  root.name='RPG artificer';
  const brass='#c5a268',steel='#75898a',leather='#654b36',cloth='#415d58',red='#a24b3c',skin='#d4a479';
  const smooth=new T.SphereGeometry(1,20,14);
  const ball=(b:Builder,x:number,y:number,z:number,sx:number,sy:number,sz:number,color:string)=>b.add(smooth,material(color),x,y,z,sx,sy,sz);
  const section=(build:(b:Builder)=>void,parent=body,x=0,y=0,z=0)=>{
    const b=new Builder();build(b);const group=b.finish();group.position.set(x,y,z);parent.add(group);return group;
  };
  const torso=section(b=>{
    // Fitted tunic, overlapping leather vest, seam, reinforced shoulder yoke.
    ball(b,0,1.38,0,.36,.47,.235,cloth);
    b.box(0,1.38,.175,.52,.59,.16,leather);
    b.box(0,1.41,.263,.035,.55,.025,brass);
    for(const side of [-1,1]) {
      b.box(side*.245,1.38,.24,.055,.6,.045,'#9b7851');
      for(const y of [1.15,1.35,1.55])ball(b,side*.245,y,.275,.021,.021,.014,brass);
      b.box(side*.12,1.51,.275,.15,.17,.035,'#7c5a3c');
      b.box(side*.12,1.58,.3,.05,.035,.025,brass);
      b.box(side*.2,1.04,.21,.19,.23,.13,leather);
      b.box(side*.2,1.09,.285,.16,.07,.025,'#99774f');
      b.box(side*.2,1.08,.305,.038,.06,.015,brass);
    }
    b.box(0,1.02,0,.66,.105,.46,leather);
    b.box(0,1.02,.26,.14,.13,.04,brass);b.box(0,1.02,.29,.085,.075,.02,'#544638');
    b.cylinder(0,1.84,0,.13,.17,skin,.14,12);
    // Crimson scarf and a tiny enamel badge.
    ball(b,0,1.77,0,.29,.12,.235,red);
    b.box(-.19,1.58,.29,.12,.33,.065,red,.15);
    ball(b,.14,1.66,.28,.05,.05,.025,'#76b6a5');
    // Backpack, rolled bedroll, brass fasteners, tool sheath and seed vials.
    b.box(0,1.42,-.29,.51,.58,.25,'#8f7650');
    b.box(0,1.68,-.33,.55,.15,.27,leather);
    for(const side of [-1,1])b.box(side*.16,1.42,-.43,.055,.54,.025,brass);
    b.add(new T.CylinderGeometry(.13,.13,.66,12),material('#a39d77'),0,1.86,-.32,1,1,1,0,0,Math.PI/2);
    for(const x of [-.2,.2])b.add(new T.TorusGeometry(.135,.025,6,14),material(leather),x,1.86,-.32,1,1,1,0,Math.PI/2);
    for(let i=0;i<3;i++) {
      ball(b,-.22+i*.22,1.19,-.47,.095,.095,.095,'#374b50');
      b.cylinder(-.22+i*.22,1.29,-.47,.03,.06,brass,.03,8);
    }
    b.cylinder(-.4,1.16,-.05,.07,.27,'#89a178',.07,10);
    b.cylinder(-.4,1.31,-.05,.075,.04,brass,.075,10);
  });
  torso.name='Leather vest, scarf, belt and backpack';
  const head=section(b=>{
    ball(b,0,.12,.01,.235,.28,.21,skin);
    ball(b,0,.015,.12,.17,.12,.13,skin);
    ball(b,0,.12,.222,.052,.065,.063,'#c99068');
    for(const side of [-1,1]) {
      ball(b,side*.225,.115,0,.055,.085,.055,skin);
      ball(b,side*.083,.17,.192,.058,.04,.028,'#eee3cd');
      ball(b,side*.083,.17,.218,.024,.027,.012,'#365e57');
      ball(b,side*.083,.17,.229,.012,.019,.005,'#223d3c');
      ball(b,side*.077,.181,.235,.006,.008,.004,'#fff4d8');
      b.box(side*.087,.226,.21,.095,.018,.028,'#45372c',side*.12);
    }
    b.box(0,.01,.233,.09,.012,.012,'#805541');
    // Sculpted hair cap, side locks and swept fringe.
    b.add(new T.SphereGeometry(1,20,12,0,Math.PI*2,0,Math.PI*.57),material('#463b30'),0,.225,-.018,.244,.21,.228);
    for(let i=0;i<7;i++)ball(b,-.18+i*.06,.31-Math.sin(i)*.018,.14,.064,.11,.075,i%2?'#554337':'#3f352e');
    for(const s of [-1,1])ball(b,s*.208,.18,-.025,.04,.15,.12,'#483a2e');
    // Goggles sit above the brows: leather band, brass rims and blue lenses.
    b.box(0,.315,.172,.47,.075,.055,leather);
    for(const s of [-1,1]) {
      b.add(new T.TorusGeometry(.078,.016,8,20),material(brass),s*.103,.325,.215);
      ball(b,s*.103,.325,.21,.064,.064,.018,'#74a7b0');
      b.box(s*.11,.347,.23,.045,.01,.006,'#c1e0dc');
    }
    b.box(0,.325,.218,.055,.025,.025,brass);
  },body,0,1.94,0);head.name='Face, sculpted hair and brass goggles';

  const legs:T.Group[]=[],knees:T.Group[]=[],arms:T.Group[]=[],forearms:T.Group[]=[];
  for(const side of [-1,1]) {
    const leg=section(b=>{
      ball(b,0,-.19,0,.145,.26,.15,'#344749');
      b.box(side*.1,-.2,.02,.06,.3,.16,leather);
    },body,side*.18,.99,0);legs.push(leg);
    const knee=section(b=>{
      ball(b,0,-.15,0,.12,.22,.13,'#3d5150');
      ball(b,0,0,.125,.125,.13,.07,steel);
      b.box(0,0,.195,.045,.1,.018,brass);
      b.box(0,-.245,.005,.25,.25,.28,leather);
      ball(b,0,-.35,.09,.15,.115,.26,leather);
      b.box(0,-.43,.09,.3,.08,.43,'#303b38');
      for(const y of [-.19,-.29]){b.box(0,y,.159,.24,.045,.035,'#ad8a58');b.box(side*.08,y,.183,.05,.06,.02,brass);}
    },leg,0,-.43,0);knees.push(knee);
    const arm=section(b=>{
      ball(b,0,-.15,0,.13,.25,.13,cloth);
      ball(b,side*.015,.015,0,.2,.14,.23,steel);
      b.box(0,.065,.18,.23,.04,.025,brass);
      for(const z of [-.1,.09])ball(b,side*.17,0,z,.027,.027,.027,brass);
      b.box(side*.1,-.19,.02,.045,.19,.16,leather);
    },body,side*.4,1.68,0);arms.push(arm);
    const forearm=section(b=>{
      ball(b,0,-.14,0,.11,.21,.11,cloth);
      b.box(0,-.16,.025,.21,.23,.2,leather);
      b.box(0,-.14,.13,.15,.18,.035,steel);
      for(const y of [-.06,-.24])b.box(0,y,.03,.23,.04,.2,brass);
      ball(b,0,-.34,.025,.105,.11,.09,leather);
      for(let i=0;i<3;i++)b.box(-.065+i*.06,-.36,.105,.036,.08,.02,'#8a6749');
    },arm,0,-.36,0);forearms.push(forearm);
  }
  const cape=section(b=>{
    const g=new T.CylinderGeometry(.27,.43,.85,12,1,true,Math.PI*.5,Math.PI);
    b.add(g,new T.MeshStandardMaterial({color:red,roughness:.94,side:T.DoubleSide}),0,-.42,-.04);
    for(const s of [-1,1])b.beam(vec(s*.24,-.08,-.09),vec(s*.39,-.8,-.16),.017,brass);
  },body,0,1.68,-.17);cape.name='Short travelling cape';
  const launcher=section(b=>{
    b.box(0,0,0,.25,.29,.46,'#3e5054');
    b.box(0,-.2,-.12,.12,.29,.15,leather);
    b.box(0,.01,-.34,.2,.24,.3,leather);
    // A wide, open barrel with reinforcing rings and a clearly visible bore.
    b.add(new T.CylinderGeometry(.14,.18,.78,20,1,true),new T.MeshStandardMaterial({color:'#738b8c',metalness:.65,roughness:.33,side:T.DoubleSide}),0,.03,.46,1,1,1,Math.PI/2);
    for(const z of [.14,.4,.79])b.add(new T.TorusGeometry(z===.14?.18:.15,.032,8,24),material(brass),0,.03,z);
    b.add(new T.CircleGeometry(.115,20),material('#263739'),0,.03,.72);
    b.box(0,.22,.25,.05,.07,.08,brass);
    b.cylinder(.22,-.03,.08,.16,.29,'#405559',.16,12);
    for(const y of [-.17,.11])b.cylinder(.22,y,.08,.17,.035,brass,.17,12);
    b.box(-.155,.01,.01,.04,.12,.18,brass);
    b.box(-.18,.02,.01,.025,.07,.1,'#cead68');
  },body,.36,1.3,.42);launcher.name='Brass bomb launcher';
  launcher.visible=false;
  launcher.rotation.x=-.12;
  const muzzle=new T.Object3D();muzzle.position.set(0,.03,.91);launcher.add(muzzle);
  const lantern=new T.Mesh(new T.SphereGeometry(.09,12,8),glowMaterial('#ffd18a',4));lantern.position.set(-.34,1.06,.21);body.add(lantern);
  const lanternLight=new T.PointLight('#ffce8a',0,10,2);lanternLight.position.copy(lantern.position);body.add(lanternLight);
  const pool=lightPool(2.6);root.add(pool);
  for(const side of [-1,1]) {
    const lens=new T.Mesh(new T.CircleGeometry(.055,16),glowMaterial('#8edeea',2.2));lens.position.set(side*.103,.325,.233);head.add(lens);
  }
  const ring=new T.Mesh(new T.RingGeometry(.65,.72,48),new T.MeshBasicMaterial({color:'#fff1c5',transparent:true,opacity:.75,depthWrite:false}));
  ring.rotation.x=-Math.PI/2;ring.position.y=.025;root.add(ring);
  let shotAt=-100,plantAt=-100,equipped=false,nightEnabled=false;
  return {root,body,ring,muzzle,
    setTool:(tool:'explore'|'bomb'|'tree')=>{equipped=tool==='bomb';launcher.visible=equipped;},
    setNight:(night:boolean)=>{nightEnabled=night;lanternLight.intensity=night?2.4:0;},
    fire:(time:number)=>{shotAt=time;}, plant:(time:number)=>{plantAt=time;},
    animate:(time:number,moving:boolean,running:boolean,ambient=true,flight?:ExploreFlightFrame|null)=>{
      const cycle=time*(running?14:9),recoil=Math.max(0,1-(time-shotAt)/.32),plant=Math.sin(Math.min(1,Math.max(0,(time-plantAt)/.7))*Math.PI);
      legs.forEach((l,i)=>{l.rotation.x=moving?Math.sin(cycle+i*Math.PI)*.56:0;});
      knees.forEach((l,i)=>{l.rotation.x=moving?Math.max(0,-Math.sin(cycle+i*Math.PI))*.55:plant*.4;});
      arms[0].rotation.set(equipped?-1.05+(moving?Math.sin(cycle)*.08:0)-plant*.35:moving?Math.sin(cycle)*.4:-plant*.7,0,equipped?.85:.08);
      arms[1].rotation.set(equipped?-.4-recoil*.22:moving?-Math.sin(cycle)*.4:0,0,-.04);
      forearms[0].rotation.set(equipped?-.5:-.15,0,equipped?.2:0);forearms[1].rotation.set(equipped?-1.1:-.15,0,0);
      body.rotation.x=0;
      body.position.y=(moving?Math.abs(Math.sin(cycle))*.055:ambient?Math.sin(time*2)*.012:0)-plant*.18;
      torso.rotation.x=plant*.16;head.rotation.x=plant*.2;
      cape.rotation.x=.13+(running?.16:0)+(moving||ambient?Math.sin(time*(moving?9:2))*(moving?.07:.025):0);
      launcher.position.z=.42-recoil*.13;launcher.rotation.x=-.12-recoil*.17;
      launcher.visible=equipped&&!flight;ring.visible=!flight?.airborne;pool.visible=nightEnabled&&!flight?.airborne;
      if(flight) {
        const {lean,impact}=flight;body.rotation.x=lean*Math.PI*.44;
        body.position.y=-impact*.24;torso.rotation.x=impact*.18;head.rotation.x=-lean*.2;
        arms[0].rotation.set(-Math.PI*lean-impact*.55,0,.08);arms[1].rotation.set(-Math.PI*lean-impact*.55,0,-.08);
        for(const arm of forearms)arm.rotation.set(-.08- impact*.25,0,0);
        legs.forEach((leg,i)=>leg.rotation.x=impact*-.38+(i?-.09:.09)*lean);
        knees.forEach(knee=>knee.rotation.x=impact*.8);
        cape.rotation.x=.13+lean*.2;
      }
    },
  };
}
