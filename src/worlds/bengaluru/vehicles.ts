import * as T from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {Builder,material,vec} from '../../geometry.ts';
import {glowMaterial} from '../../lighting.ts';

export type BengaluruVehicle='dzire'|'auto'|'electric-auto'|'citybus';
const bodies=new Map<BengaluruVehicle,T.Group>();
const glass=material('#28464b',.3,.2),rubber=material('#20282a'),chrome=material('#b5c2c0');
const tireGeometry=new T.CylinderGeometry(1,1,1,12),hubGeometry=new T.CylinderGeometry(.53,.53,1.06,8);
tireGeometry.rotateZ(Math.PI/2);hubGeometry.rotateZ(Math.PI/2);

function rounded(b:Builder,x:number,y:number,z:number,w:number,h:number,d:number,color:string,r=.035) {
  const g=new RoundedBoxGeometry(w,h,d,2,r);b.add(g,material(color),x,y,z);g.dispose();
}
function panel(w:number,h:number,r:number) {
  const s=new T.Shape();s.moveTo(-w/2+r,0);s.lineTo(w/2-r,0);s.quadraticCurveTo(w/2,0,w/2,r);s.lineTo(w/2,h-r);s.quadraticCurveTo(w/2,h,w/2-r,h);s.lineTo(-w/2+r,h);s.quadraticCurveTo(-w/2,h,-w/2,h-r);s.lineTo(-w/2,r);s.quadraticCurveTo(-w/2,0,-w/2+r,0);return s;
}

function body(kind:BengaluruVehicle) {
  const cached=bodies.get(kind);if(cached)return cached.clone(true);
  const b=new Builder(),white='#f4f2e9',green='#2c8652',yellow='#e2bd42';
  if(kind==='dzire') {
    // Tour S reference: a rounded compact sedan, open wheel arches, swept lamps,
    // a broad lower grille and black taxi trim, rather than a stack of boxes.
    const side=new T.Shape();side.moveTo(-1.17,.25);side.lineTo(-1,.25);side.absarc(-.75,.21,.25,Math.PI,0,true);side.lineTo(.5,.21);side.absarc(.75,.21,.25,Math.PI,0,true);
    side.lineTo(1.17,.25);side.lineTo(1.17,.57);side.quadraticCurveTo(1.14,.63,.77,.64);side.lineTo(.54,.65);side.lineTo(-.64,.64);side.quadraticCurveTo(-1.15,.63,-1.17,.55);side.closePath();
    const shell=new T.ExtrudeGeometry(side,{depth:1,bevelEnabled:true,bevelSize:.015,bevelThickness:.015,bevelSegments:2,curveSegments:8});shell.rotateY(-Math.PI/2);shell.translate(.5,0,0);b.add(shell,material(white));shell.dispose();
    const profile=new T.Shape();profile.moveTo(-.76,.62);profile.quadraticCurveTo(-.57,.91,-.4,.96);profile.quadraticCurveTo(-.04,1.015,.29,.98);profile.lineTo(.69,.62);profile.closePath();
    const cabin=new T.ExtrudeGeometry(profile,{depth:.78,bevelEnabled:true,bevelSize:.012,bevelThickness:.012,bevelSegments:2,curveSegments:6});cabin.rotateY(-Math.PI/2);cabin.translate(.39,0,0);b.add(cabin,glass);cabin.dispose();
    rounded(b,0,.99,-.045,.8,.055,.74,white,.024);
    for(const side of [-1,1]) {
      b.beam(vec(side*.4,.64,.66),vec(side*.39,.98,.29),.025,white);b.beam(vec(side*.4,.64,-.72),vec(side*.39,.96,-.4),.032,white);
      b.beam(vec(side*.404,.65,-.08),vec(side*.404,.98,-.07),.026,'#293538');
      for(const z of [-.4,.29])rounded(b,side*.52,.6,z,.018,.025,.12,'#353c3c',.006);
      rounded(b,side*.55,.73,.45,.09,.075,.14,'#303a3b',.025);b.box(side*.52,.47,-.04,.008,.28,.014,'#bbc0b8');
      b.box(side*.52,.34,0,.018,.035,.86,'#c3c8bd');
      for(const z of [-.75,.75]){const arch=new T.TorusGeometry(.249,.012,4,20,Math.PI);arch.rotateY(Math.PI/2);b.add(arch,material('#d7dad1'),side*.519,.21,z);arch.dispose();}
      const lamp=new T.Shape();lamp.moveTo(side*.25,.54);lamp.lineTo(side*.49,.57);lamp.lineTo(side*.5,.49);lamp.lineTo(side*.34,.47);lamp.closePath();
      const lens=new T.ExtrudeGeometry(lamp,{depth:.018,bevelEnabled:false});b.add(lens,glowMaterial('#e8f1ed',3),0,0,1.177);lens.dispose();
      rounded(b,side*.39,.34,1.18,.15,.11,.026,'#273537',.04);
      b.box(side*.4,.48,-1.184,.21,.11,.035,glowMaterial('#ef4335',3));
    }
    rounded(b,0,.43,1.19,.58,.28,.025,'#263537',.08);
    for(const yy of [.43,.51])b.box(0,yy,1.207,.52,.018,.008,'#c2cdca');
    b.beam(vec(.025,.54,1.216),vec(-.028,.51,1.216),.009,'#d2d9d4');b.beam(vec(-.028,.51,1.216),vec(.028,.48,1.216),.009,'#d2d9d4');
    for(const z of [-1.202,1.21])b.box(0,.32,z,.28,.075,.014,yellow);
    b.box(0,.51,-1.19,.67,.024,.015,'#bfc8c3');b.beam(vec(0,1.015,-.27),vec(0,1.1,-.32),.008,'#293538');
  } else if(kind==='auto'||kind==='electric-auto') {
    const electric=kind==='electric-auto',paint=electric?'#e6eee9':green,canopy=electric?'#54b7df':yellow;
    rounded(b,0,.31,-.06,1,.16,1.77,paint,.035);rounded(b,0,.6,-.8,1.02,.58,.18,paint,.075);
    for(const side of [-1,1]){
      rounded(b,side*.475,.56,-.52,.095,.45,.53,paint,.035);b.box(side*.48,.97,-.83,.045,.71,.055,canopy);
      b.beam(vec(side*.47,.84,.76),vec(side*.47,1.3,.52),.035,canopy);
      b.box(side*.48,.39,-.03,.085,.08,.58,'#454b41');
      b.beam(vec(side*.47,.7,-.28),vec(side*.47,.78,.08),.018,'#35453b');
      b.beam(vec(side*.43,1.02,.68),vec(side*.51,1.09,.7),.015,'#2d3835');rounded(b,side*.51,1.12,.7,.075,.1,.045,'#2c3634',.02);
      rounded(b,side*.4,.5,.65,.25,.45,.4,paint,.095);
      b.box(side*.36,.48,-.902,.1,.12,.024,glowMaterial('#ef4335',3));
    }
    const roof=new T.Shape();roof.moveTo(-.52,1.23);roof.quadraticCurveTo(-.51,1.43,-.32,1.44);roof.lineTo(.32,1.44);roof.quadraticCurveTo(.51,1.43,.52,1.23);roof.lineTo(.475,1.23);roof.quadraticCurveTo(.46,1.38,.3,1.39);roof.lineTo(-.3,1.39);roof.quadraticCurveTo(-.46,1.38,-.475,1.23);roof.closePath();
    const top=new T.ExtrudeGeometry(roof,{depth:1.48,bevelEnabled:false,curveSegments:8});b.add(top,material(canopy),0,0,-.9);top.dispose();
    rounded(b,0,1.355,.565,.99,.1,.06,canopy,.025);
    for(const [w,h,r,yy,zz,mat] of [[1.01,.57,.1,.83,.80,material(canopy)],[.94,.5,.09,.87,.81,material('#263733')],[.86,.43,.075,.9,.82,glass]] as const){const face=new T.ShapeGeometry(panel(w,h,r),8);b.add(face,mat,0,yy,zz,1,1,1,-.5);face.dispose();}
    rounded(b,0,.73,.83,.81,.34,.09,electric?'#e6eee9':'#303d36',.085);
    rounded(b,0,.46,.77,.32,.12,.43,paint,.055);
    for(const side of [-1,1]){
      const bezel=new T.TorusGeometry(.083,.014,6,16);b.add(bezel,material(electric?canopy:'#9faeaa'),side*.29,.74,.884);bezel.dispose();
      b.sphere(side*.29,.74,.888,.07,.07,.025,glowMaterial('#ffe6ba',3));
      b.box(side*.41,.91,.822,.07,.04,.018,glowMaterial('#eeb74b',3));
      b.beam(vec(side*.07,.46,.66),vec(side*.07,.21,.77),.018,'#596761');
    }
    b.box(0,.91,.826,.24,.065,.015,electric?'#398c68':yellow);
    b.box(0,.75,.888,.07,.06,.012,'#aebeb3');
    for(const yy of [.61,.64,.67])b.box(0,yy,.884,.19,.012,.012,'#1d2924');
    b.beam(vec(0,.92,.833),vec(.23,1.21,.675),.009,'#293631');
    rounded(b,0,.61,-.49,.83,.14,.4,'#28322b',.04);rounded(b,0,.84,-.72,.83,.35,.08,'#28322b',.03);
    rounded(b,0,.58,.06,.35,.13,.32,'#29332b',.03);rounded(b,0,.86,.48,.75,.1,.14,'#2d3932',.03);
    b.sphere(0,.86,.03,.15,.22,.11,'#b6a281');b.sphere(0,1.12,.05,.105,.12,.105,'#9f7658');
    for(const side of [-1,1]){b.beam(vec(side*.1,.96,.08),vec(side*.17,.84,.36),.035,'#9f7658');b.beam(vec(side*.1,.7,.04),vec(side*.12,.4,.33),.045,'#384339');}
    b.beam(vec(-.21,.84,.36),vec(.21,.84,.36),.02,'#27332d');
  } else {
    // A few blue-and-white single-deck city buses among the smaller vehicles.
    b.box(0,.83,0,1.22,1.22,4.3,'#cedcd6');b.box(0,.51,0,1.24,.55,4.32,'#3d8da9');b.box(0,1.49,0,1.24,.1,4.32,'#dfe6df');
    for(const side of [-1,1])for(let z=-1.72;z<1.9;z+=.55)b.box(side*.617,1.12,z,.02,.43,.45,glass);
    for(const z of [-2.16,2.16])b.box(0,1.12,z,1.03,.46,.025,glass);
    b.box(0,1.43,2.18,.73,.12,.025,'#273b37');b.box(0,1.44,2.199,.44,.035,.008,'#e7c966');
    b.box(-.625,.79,1.51,.02,.92,.45,glass);b.box(-.638,.79,1.51,.01,.91,.025,'#b6c7c5');
    for(const side of [-1,1]){b.box(side*.43,.48,2.18,.21,.13,.035,glowMaterial('#e8f1ed',3));b.box(side*.45,.48,-2.18,.13,.17,.035,glowMaterial('#ef4335',3));}
    for(const z of [-2.19,2.19])b.box(0,.33,z,.32,.09,.018,yellow);
  }
  const template=b.finish();bodies.set(kind,template);return template.clone(true);
}

export function createBengaluruVehicle(kind:BengaluruVehicle) {
  const root=body(kind),bus=kind==='citybus',auto=kind==='auto'||kind==='electric-auto',r=auto?.2:bus?.26:.21;
  const width=bus?1.28:auto?1.1:1.2,length=bus?4.4:auto?2.05:2.44,height=bus?1.55:auto?1.5:1.12;
  const positions=auto?[vec(-.47,r,-.61),vec(.47,r,-.61),vec(0,r,.77)]:[-1,1].flatMap(side=>[-1,1].map(end=>vec(side*(bus?.57:.49),r,end*(bus?1.45:.75))));
  const wheels=[new T.InstancedMesh(tireGeometry,rubber,positions.length),new T.InstancedMesh(hubGeometry,chrome,positions.length)];
  for(const wheel of wheels){wheel.castShadow=true;wheel.receiveShadow=true;wheel.instanceMatrix.setUsage(T.DynamicDrawUsage);wheel.boundingSphere=new T.Sphere(vec(0,r,0),length);root.add(wheel);}
  const matrix=new T.Matrix4(),spin=new T.Quaternion(),turn=new T.Quaternion(),rotation=new T.Quaternion(),scale=vec(.13,r,r),axle=vec(1,0,0),up=vec(0,1,0);
  const animate=(distance:number,steering=0)=>{
    spin.setFromAxisAngle(axle,distance/r);
    positions.forEach((p,i)=>{turn.setFromAxisAngle(up,p.z>0?steering:0);rotation.copy(turn).multiply(spin);matrix.compose(p,rotation,scale);for(const wheel of wheels)wheel.setMatrixAt(i,matrix);});
    for(const wheel of wheels)wheel.instanceMatrix.needsUpdate=true;
  };
  animate(0);root.name=kind==='electric-auto'?'Sky-blue electric auto rickshaw':auto?'Bengaluru green-and-yellow auto rickshaw':bus?'Bengaluru city bus':'White Suzuki Dzire cab';root.userData.vehicleAsset=kind;
  return {root,wheels,width,length,height,animate};
}
