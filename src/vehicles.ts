import * as T from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { Builder, material, vec } from './geometry.ts';
import { glowMaterial, lightPool } from './lighting.ts';

const chrome=new T.MeshStandardMaterial({color:'#b9c9ca',roughness:.26,metalness:.8});
const windowGlass=new T.MeshPhysicalMaterial({color:'#294e5e',roughness:.12,metalness:.28,clearcoat:1});
const rubber=material('#263033',.96);
function rounded(b:Builder,x:number,y:number,z:number,w:number,h:number,d:number,mat:T.Material,r=.05) {
  const g=new RoundedBoxGeometry(w,h,d,2,r);b.add(g,mat,x,y,z);g.dispose();
}
export function createVehicle(bus=false,color='#a6533e') {
  const b=new Builder(),width=bus?1.05:.94,length=bus?3.5:2.05,height=bus?1.83:.98;
  const paint=new T.MeshPhysicalMaterial({color:bus?'#ad3028':color,roughness:.3,metalness:.35,clearcoat:.7});
  rounded(b,0,bus?.96:.43,0,width,bus?1.56:.43,length,paint,.08);
  if(bus) {
    for(const y of [.78,1.43])for(const side of [-1,1])for(let z=-1.28;z<1.5;z+=.48)
      b.box(side*(width/2+.006),y,z,.025,.37,.37,windowGlass);
    for(const y of [.83,1.46])b.box(0,y,length/2+.01,.83,.35,.025,windowGlass);
    b.box(0,1.12,length/2+.025,.62,.13,.025,glowMaterial('#ffe8bc',1.8));
    for(const y of [.3,1.12,1.77])b.box(0,y,0,width+.025,.04,length-.1,'#e9c79d');
    for(const z of [-1.2,1.08])b.box(-width/2-.02,.62,z,.03,.96,.37,windowGlass);
    rounded(b,0,1.77,0,1.06,.13,3.45,paint,.06);
  } else {
    // A tapered greenhouse gives the car a windscreen, bonnet and separate boot.
    const profile=new T.Shape();profile.moveTo(-.68,.56);profile.lineTo(-.43,.91);profile.lineTo(.36,.94);profile.lineTo(.7,.56);profile.closePath();
    const cabin=new T.ExtrudeGeometry(profile,{depth:.76,bevelEnabled:false});cabin.rotateY(-Math.PI/2);cabin.translate(.38,0,0);b.add(cabin,windowGlass);cabin.dispose();
    rounded(b,0,.94,-.025,.77,.075,.78,paint,.025);
    for(const side of [-1,1]) {
      for(const z of [-.46,.04,.49])b.beam(vec(side*.39,.57,z),vec(side*.37,.93,z*.75),.023,paint);
      b.box(side*.475,.48,-.16,.02,.025,.18,chrome);
      rounded(b,side*.54,.67,.48,.13,.085,.14,paint,.02);
      b.box(side*.473,.44,.04,.013,.27,.018,'#463f37');
    }
    for(const z of [-.89,.93])b.box(0,.29,z,.84,.065,.12,chrome);
    b.box(0,.42,length/2+.012,.39,.13,.02,'#26393b');
    for(let x=-.16;x<=.17;x+=.06)b.box(x,.42,length/2+.027,.012,.1,.012,chrome);
  }
  for(const side of [-1,1]) {
    b.box(side*width*.32,.48,length/2+.025,.18,.105,.045,glowMaterial('#e5f1ff',4));
    b.box(side*width*.33,.48,-length/2-.02,.15,.12,.04,glowMaterial('#ff352a',3));
  }
  for(const z of [-length/2-.03,length/2+.04])b.box(0,.25,z,.29,.07,.018,z<0?'#e9c457':'#eee6c6');
  const root=b.finish(),r=bus?.24:.205,wheels:T.InstancedMesh[]=[];
  const tire=new T.CylinderGeometry(r,r,.14,16),hub=new T.CylinderGeometry(r*.58,r*.58,.151,12);tire.rotateZ(Math.PI/2);hub.rotateZ(Math.PI/2);
  for(const [geometry,mat]of [[tire,rubber],[hub,chrome]] as const) {
    const mesh=new T.InstancedMesh(geometry,mat,4);mesh.castShadow=true;mesh.receiveShadow=true;
    mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);mesh.boundingSphere=new T.Sphere(vec(0,r,0),length);root.add(mesh);wheels.push(mesh);
  }
  const wheelPlaces=[-1,1].flatMap(side=>[-(bus?1.12:.66),bus?1.1:.65].map(z=>vec(side*(width/2-.015),r,z)));
  const matrix=new T.Matrix4(),rotation=new T.Quaternion(),unit=vec(1,1,1),axis=vec(1,0,0);
  const steerRotation=new T.Quaternion(),wheelRotation=new T.Quaternion(),up=vec(0,1,0);
  const animate=(distance:number,steering=0)=>{
    rotation.setFromAxisAngle(axis,distance/r);
    wheelPlaces.forEach((p,i)=>{
      steerRotation.setFromAxisAngle(up,p.z>0?steering:0);wheelRotation.copy(steerRotation).multiply(rotation);
      matrix.compose(p,wheelRotation,unit);for(const mesh of wheels)mesh.setMatrixAt(i,matrix);
    });
    for(const mesh of wheels)mesh.instanceMatrix.needsUpdate=true;
  };animate(0);
  const pool=lightPool(1.7);pool.position.z=length/2+1.1;pool.scale.x=.6;root.add(pool);
  root.name=bus?'Moving London double-decker':'Moving city car';
  return {root,wheels,width,length,height,animate};
}

export function createBoat(length=4,color='#a84d36',ferry=false) {
  const b=new Builder(),beam=ferry?1.55:1.25;
  const paint=new T.MeshStandardMaterial({color,roughness:.44,metalness:.12});
  const outline=[[-.0,1],[-.7,.73],[-1,.1],[-.86,-.9],[.86,-.9],[1,.1],[.7,.73]];
  const positions:number[]=[],indices:number[]=[];
  for(const [y,scale]of [[-.2,.53],[.14,.85],[.43,1]])for(const [x,z]of outline)positions.push(x*beam*.5*scale,y,z*length*.5);
  for(let level=0;level<2;level++)for(let i=0;i<outline.length;i++) {
    const j=(i+1)%outline.length,a=level*outline.length+i,c=level*outline.length+j;
    indices.push(a,a+outline.length,c,c,a+outline.length,c+outline.length);
  }
  const hull=new T.BufferGeometry();hull.setAttribute('position',new T.Float32BufferAttribute(positions,3));hull.setIndex(indices);hull.computeVertexNormals();
  b.add(hull,paint);hull.dispose();
  const deck=new T.Shape();outline.forEach(([x,z],i)=>i?deck.lineTo(x*beam*.5,-z*length*.5):deck.moveTo(x*beam*.5,-z*length*.5));deck.closePath();
  const deckGeo=new T.ShapeGeometry(deck);deckGeo.rotateX(-Math.PI/2);b.add(deckGeo,material('#bdac87'),0,.435,0);deckGeo.dispose();
  // Deck planking, white gunwales, curved safety rails and mooring bollards.
  for(let x=-beam*.3;x<=beam*.3;x+=.13)b.box(x,.445,-.05,.012,.012,length*.74,'#8f8063');
  const edge=outline.map(([x,z])=>vec(x*beam*.5,.48,z*length*.5));edge.push(edge[0]);
  for(let i=1;i<edge.length;i++)b.beam(edge[i-1],edge[i],.035,'#eee5ca');
  for(const side of [-1,1]) {
    const rail=[vec(side*beam*.43,.72,-length*.42),vec(side*beam*.49,.72,.05),vec(side*beam*.33,.72,length*.35),vec(0,.72,length*.49)];
    b.tube(rail,.018,'#d4d8cb',12);
    for(const z of [-length*.36,-.12,length*.22])b.beam(vec(side*beam*.45,.46,z),vec(side*beam*.45,.72,z),.015,'#e2ddc7');
  }
  rounded(b,0,.7,-length*.12,beam*.72,.48,length*(ferry?.6:.38),material('#e6e2d0'),.06);
  for(const side of [-1,1])for(let z=-length*.33;z<length*.07;z+=.32)
    b.box(side*beam*.365,.79,z,.022,.2,.23,windowGlass);
  b.box(0,.82,length*.07,beam*.58,.22,.025,windowGlass);
  rounded(b,0,.99,-length*.12,beam*.81,.13,length*(ferry?.62:.4),material('#f0ebd7'),.035);
  b.beam(vec(0,1,-.2),vec(0,1.72,-.2),.022,'#b3c2bd');
  b.beam(vec(-.25,1.5,-.2),vec(.25,1.5,-.2),.017,'#c3cec6');
  b.sphere(0,1.74,-.2,.04,.04,.04,glowMaterial('#fff4ca',3));
  for(const side of [-1,1]) {
    b.sphere(side*beam*.37,1.02,0,.05,.045,.045,glowMaterial(side<0?'#ff4b36':'#5bef89',2.8));
    const ring=new T.TorusGeometry(.12,.035,6,16);b.add(ring,material('#d46738'),side*beam*.4,.68,-length*.25,1,1,1,0,Math.PI/2);ring.dispose();
    for(const z of [-length*.4,length*.35])b.cylinder(side*.22,.51,z,.035,.09,'#657777',.035,8);
  }
  b.box(0,.99,-length*.15,beam*.55,.035,.07,glowMaterial('#ffe2a3',1.8));
  const root=b.finish();root.name=ferry?'Thames passenger launch':'River motor launch';
  return {root,length};
}
