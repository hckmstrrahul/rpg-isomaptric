import * as T from 'three';
import {Builder,material,vec,canvasTexture} from '../../geometry.ts';
import {registerGlow} from '../../lighting.ts';

/** Original procedural geometry; the hero ensemble is uniformly enlarged by its world.
 * Architectural references: tajmahal.gov.in/the-taj-exteriors.aspx and
 * tajmahal.gov.in/outlying-building.aspx. No photographic textures or pseudo-script. */
const ivory='#eee9db',edge='#ded8c9',sandstone='#a75c45',sandEdge='#c48868',inlay='#756c63';
const marbleMap=canvasTexture(256,256,c=>{
  c.fillStyle='#eeeade';c.fillRect(0,0,256,256);
  for(let y=0;y<256;y+=2)for(let x=0;x<256;x+=2){const v=232+Math.floor(6*(Math.sin(x*1.37+y*.83)*.5+.5));c.fillStyle=`rgba(${v},${v-2},${v-9},.32)`;c.fillRect(x,y,2,2);}
  c.strokeStyle='rgba(130,122,112,.07)';c.lineWidth=.6;
  for(let i=0;i<7;i++){c.beginPath();for(let x=0;x<=256;x+=8){const y=i*43+Math.sin(x*.027+i)*5;x?c.lineTo(x,y):c.moveTo(x,y);}c.stroke();}
});marbleMap.wrapS=marbleMap.wrapT=T.RepeatWrapping;
// A small ambient moon bounce lifts the stone without filling its dark recesses.
// Reuse the stone map, so there is no extra texture or window-style illumination.
const marble=registerGlow(new T.MeshStandardMaterial({color:'#ffffff',map:marbleMap,emissiveMap:marbleMap,emissive:'#d3e0ea',roughness:.68,metalness:0}),0);marble.userData.worldTile=2.6;marble.userData.agraMarble=true;
const domeMarble=registerGlow(marble.clone(),0);domeMarble.userData.agraPolishedDome=true;
export function updateAgraMarble(night:boolean,reveal=night?1:0) {
  // Smooth curved stone catches a localized moon highlight; walls stay softly matte.
  // The original daytime material is restored exactly when changing theme.
  const strength=night?T.MathUtils.clamp(reveal,0,1):0;
  marble.emissiveIntensity=strength*.26;domeMarble.emissiveIntensity=strength*.32;
  marble.roughness=.68-strength*.18;domeMarble.roughness=.68-strength*.34;
}
const shadow=material('#464845'),red=material(sandstone),gold=material('#b99a5c',.36,.55);
const inlayLine=new T.MeshStandardMaterial({color:inlay,roughness:.81,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1});inlayLine.userData.noShadow=true;

function archPath(w:number,h:number,bottom=0) {
  const path=new T.Shape();path.moveTo(-w/2,bottom);path.lineTo(w/2,bottom);path.lineTo(w/2,bottom+h*.52);
  path.bezierCurveTo(w/2,bottom+h*.72,w*.23,bottom+h*.9,0,bottom+h);
  path.bezierCurveTo(-w*.23,bottom+h*.9,-w/2,bottom+h*.72,-w/2,bottom+h*.52);path.closePath();return path;
}
/** A recessed pointed portal with a real projecting frame, not a window grid. */
function arch(b:Builder,x:number,y:number,z:number,w:number,h:number,face:T.Material=marble,yaw=0,trim=inlay,recess=0) {
  const nx=Math.sin(yaw),nz=Math.cos(yaw);
  const g=new T.ShapeGeometry(archPath(w,h),10);b.add(g,shadow,x-nx*recess,y,z-nz*recess,1,1,1,0,yaw);g.dispose();
  const outer=archPath(w+.15,h+.12);outer.holes.push(new T.Path(archPath(w,h).getPoints(14)));
  const frame=new T.ExtrudeGeometry(outer,{depth:.075,bevelEnabled:false,curveSegments:10});
  b.add(frame,face,x+nx*.008,y,z+nz*.008,1,1,1,0,yaw);frame.dispose();
  const small=new T.ShapeGeometry(archPath(w*.7,h*.78),9);b.add(small,material('#77776d'),x+nx*(.01-recess),y+.04,z+nz*(.01-recess),1,1,1,0,yaw);small.dispose();
  const outlineShape=archPath(w+.21,h+.16);outlineShape.holes.push(new T.Path(archPath(w+.15,h+.12).getPoints(14)));
  const outline=new T.ShapeGeometry(outlineShape,10);b.add(outline,trim===inlay?inlayLine:material(trim),x+nx*.04,y,z+nz*.04,1,1,1,0,yaw);outline.dispose();
}
function onion(b:Builder,x:number,y:number,z:number,r:number,h:number,mat:T.Material=marble,fluted=false) {
  const profile=[[.75,0],[.79,.09],[.94,.22],[1,.36],[.98,.50],[.88,.65],[.68,.79],[.41,.89],[.16,.95],[.04,1]];
  const geo=new T.LatheGeometry(profile.map(([a,c])=>new T.Vector2(a*r,c*h)),40);b.add(geo,mat===marble?domeMarble:mat,x,y,z);geo.dispose();
  b.cylinder(x,y+.025,z,r*.82,.1,edge,r*.82,40);
  if(fluted)for(let i=0;i<16;i++){const a=i*Math.PI/8;const points=profile.slice(1,-1).map(([v,c])=>vec(x+Math.cos(a)*v*r,y+c*h,z+Math.sin(a)*v*r));b.tube(points,.018,edge,12);}
  b.cylinder(x,y+h+.18,z,.035,.42,gold,.018,8);b.sphere(x,y+h+.37,z,.06,.08,.06,gold);
}
function chhatri(b:Builder,x:number,y:number,z:number,r=.58,mat:T.Material=marble) {
  b.cylinder(x,y+.1,z,r*1.12,.2,mat,r*1.12,16);
  for(let i=0;i<8;i++){const a=i*Math.PI/4;b.cylinder(x+Math.cos(a)*r*.76,y+.5,z+Math.sin(a)*r*.76,.035,.8,mat,.035,6);}
  b.cylinder(x,y+.88,z,r*1.18,.13,mat,r*1.18,16);onion(b,x,y+.95,z,r, r*1.06,mat);
}
function minaret(b:Builder,x:number,z:number) {
  b.cylinder(x,1.34,z,.62,.22,marble,.62,16);
  b.cylinder(x,3.38,z,.43,6.5,marble,.31,24);
  for(const y of [2.35,4.65,6.55]){
    b.cylinder(x,y,z,.57,.12,edge,.57,24);b.cylinder(x,y+.16,z,.54,.11,marble,.54,24);
    for(let i=0;i<16;i++){const a=i*Math.PI/8;b.cylinder(x+Math.cos(a)*.5,y+.28,z+Math.sin(a)*.5,.018,.2,edge,.018,5);}
  }
  for(let i=0;i<8;i++){const a=i*Math.PI/4;b.cylinder(x+Math.cos(a)*.35,3.35,z+Math.sin(a)*.35,.012,6.2,edge,.012,5);}
  chhatri(b,x,6.7,z,.43);
}
function chamferBlock(b:Builder,w:number,h:number,d:number,cut:number,y:number,mat:T.Material) {
  const points=[[-w/2+cut,-d/2],[w/2-cut,-d/2],[w/2,-d/2+cut],[w/2,d/2-cut],[w/2-cut,d/2],[-w/2+cut,d/2],[-w/2,d/2-cut],[-w/2,-d/2+cut]];
  const shape=new T.Shape(points.map(([x,z])=>new T.Vector2(x,-z)));shape.closePath();
  const geo=new T.ExtrudeGeometry(shape,{depth:h,bevelEnabled:false});geo.rotateX(-Math.PI/2);b.add(geo,mat,0,y,0);geo.dispose();
}
export function tajMahal() {
  const b=new Builder(),base=1.23;
  chamferBlock(b,9.65,5.25,9.65,1.18,base,marble);
  chamferBlock(b,10.55,.16,10.55,1.49,base+5.2,marble);
  chamferBlock(b,10.48,.13,10.48,1.46,base+.12,material(edge));
  for(let side=0;side<4;side++){
    const yaw=side*Math.PI/2,forward=vec(Math.sin(yaw),0,Math.cos(yaw)),right=vec(Math.cos(yaw),0,-Math.sin(yaw));
    const point=(x:number,y:number,depth=5.23)=>right.clone().multiplyScalar(x).addScaledVector(forward,depth).setY(y);
    // Four thick walls with an actual cut-out iwan, backed by the recessed core.
    const wall=new T.Shape([new T.Vector2(-3.73,0),new T.Vector2(3.73,0),new T.Vector2(3.73,5.25),new T.Vector2(-3.73,5.25)]);
    wall.holes.push(new T.Path(archPath(2.9,4.65,.18).getPoints(14)));
    const wallGeo=new T.ExtrudeGeometry(wall,{depth:.35,bevelEnabled:false,curveSegments:10});
    const wallPoint=point(0,base,4.84);b.add(wallGeo,marble,wallPoint.x,wallPoint.y,wallPoint.z,1,1,1,0,yaw);wallGeo.dispose();
    const p=point(0,base+.18);arch(b,p.x,p.y,p.z,2.9,4.65,marble,yaw,inlay,.33);
    // Pietra-dura border panels and small double-height recesses frame each iwan.
    for(const s of [-1,1])for(const row of [0,1]){const a=point(s*3,base+.24+row*2.35);arch(b,a.x,a.y,a.z,1.05,2.03,marble,yaw);}
    for(const s of [-1,1]){
      const a=point(s*1.72,base+2.55,5.23);b.box(a.x,a.y,a.z,.055,4.85,.055,inlay,yaw);
      for(let j=0;j<10;j++){const q=point(s*1.86,base+.43+j*.45,5.235);b.box(q.x,q.y,q.z,.052,.12,.025,'#8e7f64',yaw);}
    }
    const a=point(0,base+5.07,5.23);b.box(a.x,a.y,a.z,3.5,.045,.045,inlay,yaw);
    // Marble dado panels, recessed lattice and small floral stone inlays sit below
    // the subsidiary arches. No invented calligraphic lettering is painted here.
    for(const sign of [-1,1]){
      for(const y of [.15,2.55,5.19]){const q=point(sign*3.0,base+y,5.245);b.box(q.x,q.y,q.z,1.36,.026,.025,edge,yaw);}
      for(const x of [-.48,.48]){const q=point(sign*3+x,base+1.25,5.24);b.box(q.x,q.y,q.z,.024,2.1,.025,edge,yaw);}
      for(const j of [-1,0,1]){const q=point(sign*3+j*.2,base+.62,5.255);b.box(q.x,q.y,q.z,.015,.55,.025,'#998d78',yaw);}
      for(const j of [-1,1]){const q=point(sign*3+j*.2,base+.91,5.26);b.sphere(q.x,q.y,q.z,.058,.075,.025,material('#a77c69'));}
      for(let row=0;row<4;row++)for(let col=0;col<4;col++){const q=point(sign*3+(col-1.5)*.17,base+2.8+row*.25,5.25);b.box(q.x,q.y,q.z,.025,.25,.025,edge,yaw);}
    }
    // Low pierced parapet: short posts only, merged into the architecture batch.
    for(let j=-8;j<=8;j++){const q=point(j*.4,base+5.42,5.22);b.box(q.x,q.y,q.z,.055,.26,.055,edge);}
    const q=point(0,base+5.57,5.22);b.box(q.x,q.y,q.z,7,.045,.055,edge,yaw);
  }
  for(const x of [-1,1])for(const z of [-1,1]){
    const yaw=Math.atan2(x,z),cx=x*4.45,cz=z*4.45;
    b.box(cx-Math.sin(yaw)*.16,base+2.625,cz-Math.cos(yaw)*.16,2.07,5.25,.32,marble,yaw);
    for(let j=0;j<2;j++)arch(b,cx+Math.sin(yaw)*.04,base+.3+j*2.34,cz+Math.cos(yaw)*.04,1.35,2,marble,yaw);
    for(const d of [-.13,.13])b.cylinder(cx+Math.sin(yaw)*.11+Math.cos(yaw)*d,base+2.69,cz+Math.cos(yaw)*.11-Math.sin(yaw)*d,.045,5.37,edge,.037,8);
    chhatri(b,x*3.4,base+5.36,z*3.4,.81);
    minaret(b,x*7.88,z*7.88);
  }
  b.cylinder(0,base+5.87,0,2.28,1.08,marble,2.28,48);
  b.cylinder(0,base+6.39,0,2.43,.14,edge,2.43,48);
  onion(b,0,base+6.48,0,2.8,3.93,marble);
  b.cylinder(0,base+10.92,0,.045,.8,gold,.02,10);
  // Lotus-petal neck, not ribs over the otherwise smooth main dome.
  for(let i=0;i<12;i++){const a=i*Math.PI/6;b.sphere(Math.cos(a)*.25,base+10.36,Math.sin(a)*.25,.10,.21,.10,material(edge));}
  const root=b.finish();root.name='Taj Mahal · one marble mausoleum, four detached minarets';root.userData.landmark='taj';return root;
}
export function terrace() {
  const b=new Builder();b.box(0,.29,0,18,.58,18,'#c8a291');b.box(0,.88,0,17.35,.62,17.35,marble);b.box(0,1.19,0,17.6,.08,17.6,edge);
  for(let side=0;side<4;side++)for(let i=-11;i<=11;i++){
    const yaw=side*Math.PI/2,x=Math.cos(yaw)*i*.7+Math.sin(yaw)*8.69,z=-Math.sin(yaw)*i*.7+Math.cos(yaw)*8.69;
    b.box(x,.85,z,.5,.36,.025,'#e7dfce',yaw);b.box(x,1.05,z,.56,.025,.035,inlay,yaw);
  }
  for(let j=0;j<8;j++)b.box(0,(j+1)*.147-.02,10.95-j*.29,3,.147,2.4-j*.2,marble);
  return b.finish();
}
export function mosque(jawab=false) {
  const b=new Builder();b.box(0,.16,0,6.6,.32,14.7,'#b97b61');b.box(0,1.85,0,5.8,3.4,13.65,red);
  b.box(0,3.62,0,6.1,.18,14,sandEdge);
  // Front faces the mausoleum. Mosque faces east, Jawab is mirrored by the caller.
  for(const z of [-4.3,0,4.3]){
    arch(b,2.93,.38,z,2.8,z===0?3.05:2.7,red,Math.PI/2,'#e0c5a2');
    b.cylinder(0,3.95,z,1.39,.55,marble,1.39,32);onion(b,0,4.2,z,z===0?1.55:1.4,1.45,marble);
  }
  for(const z of [-6.4,6.4])for(const x of [-2.4,2.4])chhatri(b,x,3.72,z,.43,red);
  for(const z of [-6.1,-5.3,-3.3,-2.4,-1.6,1.6,2.4,3.3,5.3,6.1])b.box(2.96,1.8,z,.035,2.55,.055,'#dcc7a6');
  for(const z of [-5.4,-3.6,-1.8,0,1.8,3.6,5.4])arch(b,-2.93,.45,z,1.15,2.65,red,-Math.PI/2,'#d1ac89');
  for(const side of [-1,1])for(const x of [-1.7,0,1.7])arch(b,x,.45,side*6.85,1.1,2.55,red,side>0?0:Math.PI,'#d1ac89');
  for(const side of [-1,1])b.box(0,3.38,side*6.86,5.9,.1,.1,'#d6b99a');
  const root=b.finish();root.name=jawab?'Jawab · red sandstone guesthouse':'Taj mosque · western prayer hall';if(jawab)root.rotation.y=Math.PI;return root;
}
export function greatGate() {
  const b=new Builder(),wall=new T.Shape([new T.Vector2(-4.9,0),new T.Vector2(4.9,0),new T.Vector2(4.9,5.5),new T.Vector2(-4.9,5.5)]);
  wall.holes.push(new T.Path(archPath(3.2,4.8).getPoints(14)));
  const body=new T.ExtrudeGeometry(wall,{depth:4.5,bevelEnabled:false,curveSegments:12});b.add(body,red,0,0,-2.25);body.dispose();
  for(const s of [-1,1]){
    const portal=archPath(3.38,4.93);portal.holes.push(new T.Path(archPath(3.2,4.8).getPoints(14)));
    const frame=new T.ExtrudeGeometry(portal,{depth:.05,bevelEnabled:false,curveSegments:12});b.add(frame,marble,0,0,s*2.3,1,1,1,0,s<0?Math.PI:0);frame.dispose();
    for(const x of [-3.3,3.3])for(const y of [.3,2.7])arch(b,x,y,s*2.31,1.1,1.95,red,s<0?Math.PI:0,'#e4cbb0');
    for(const x of [-1.9,1.9])b.box(x,2.5,s*2.3,.10,5,.07,ivory);
    b.box(0,5.02,s*2.3,3.9,.10,.07,ivory);
    // Eleven small cupolas in each of the two rows are characteristic of the Great Gate.
    for(let i=-5;i<=5;i++)chhatri(b,i*.68,5.55,s*1.72,.24,marble);
  }
  for(const x of [-4.5,4.5])for(const z of [-1.8,1.8]){
    b.cylinder(x,3,z,.6,6,red,.6,8);chhatri(b,x,6,z,.59,marble);
  }
  const root=b.finish();root.name='Darwaza-i Rauza · Great Gate';return root;
}
/** Repeatable courtyard arcade; deliberately small ornament density. */
export function arcade(length:number,height=2.15) {
  const b=new Builder();b.box(0,height-.18,0,length,.36,.5,red);b.box(0,.12,0,length,.24,.95,'#bd7a5d');
  const count=Math.max(1,Math.round(length/1.45)),pitch=length/count;
  for(let i=0;i<=count;i++)b.box(-length/2+i*pitch,height/2,0,.18,height,.48,red);
  for(let i=0;i<count;i++){
    const ring=archPath(pitch-.12,height-.22);ring.holes.push(new T.Path(archPath(pitch-.35,height-.49).getPoints(6)));
    const geo=new T.ExtrudeGeometry(ring,{depth:.3,bevelEnabled:false,curveSegments:6});b.add(geo,red,-length/2+(i+.5)*pitch,.15,-.15);geo.dispose();
  }
  return b.finish();
}
const houseMaterials=new Map<number,T.MeshStandardMaterial>();
const HOUSE_COLORS=['#c9b18c','#e6d4ae','#b6c7b3','#c58f7c','#d6bd94','#a9b6af','#d4c4b5','#b7bfbd'];
function houseFacade(style:number) {
  if(houseMaterials.has(style))return houseMaterials.get(style)!;
  const color=HOUSE_COLORS[style%8];
  const map=canvasTexture(192,192,c=>{
    c.fillStyle=color;c.fillRect(0,0,192,192);
    // Fine, uneven plaster courses and bounded weathering, shared by whole rows.
    for(let i=0;i<80;i++){const x=(i*73+style*11)%192,y=(i*41+style*37)%192;c.fillStyle=i%2?'rgba(99,75,53,.04)':'rgba(255,244,218,.12)';c.fillRect(x,y,4+i%9,1+i%3);}
    if(style%4===3){c.strokeStyle='rgba(130,99,72,.16)';c.lineWidth=1;for(let y=0;y<192;y+=12){c.beginPath();c.moveTo(0,y);c.lineTo(192,y);c.stroke();for(let x=(y%24?0:12);x<192;x+=24){c.beginPath();c.moveTo(x,y);c.lineTo(x,y+12);c.stroke();}}}
    for(let y=0;y<3;y++)for(let x=0;x<3;x++){
      const xx=x*64+21,yy=y*64+18;c.fillStyle='#e2d1ad';c.fillRect(xx-3,yy-3,28,35);c.fillStyle='#48514b';c.fillRect(xx,yy,22,29);
      c.fillStyle=style%2?'#797f64':'#777263';c.fillRect(xx+1,yy+1,style%3===0?9:3,27);
      c.fillStyle='#e5d8bd';c.fillRect(xx-4,yy+31,30,3);c.fillStyle='rgba(70,61,44,.21)';c.fillRect(xx-4,yy+34,30,2);
    }
    c.fillStyle='rgba(236,224,198,.45)';c.fillRect(0,63,192,3);c.fillRect(0,127,192,3);
  });
  const emission=canvasTexture(192,192,c=>{c.fillStyle='#000';c.fillRect(0,0,192,192);for(let y=0;y<3;y++)for(let x=0;x<3;x++){if((x*3+y+style)%3===0)continue;c.fillStyle=(x+y+style)%4===0?'#9ba8a1':'#cbb17f';c.fillRect(x*64+23,y*64+20,17,23);}});
  const mat=registerGlow(new T.MeshStandardMaterial({map,emissiveMap:emission,emissive:'#ffffff',roughness:.95}),.32);mat.userData.facadeCap=material(color);houseMaterials.set(style,mat);return mat;
}
export function tajGanjHouse(index:number,w:number,d:number,h:number) {
  const b=new Builder(),color=HOUSE_COLORS[index%8],front=d/2;
  b.box(0,h/2,0,w,h,d,houseFacade(index%8));b.box(0,h+.04,0,w+.12,.12,d+.12,color);
  for(const x of [-1,1])b.box(x*(w-.12)/2,h+.21,0,.12,.31,d,color);
  for(const z of [-1,1])b.box(0,h+.21,z*(d-.12)/2,w,.31,.12,color);
  if(index%3!==0){b.box(w*.22,h+.16,-d*.25,.86,.22,.86,'#aaa18d');b.cylinder(w*.22,h+.57,-d*.25,.32,.64,'#48524d',.32,10);}
  if(index%4===0){b.box(-w*.23,h+.51,-d*.15,w*.4,.9,d*.45,color);b.box(-w*.23,h+1.01,-d*.15,w*.44,.1,d*.49,'#b9a68d');}
  if(index%4===1){b.box(w*.18,h+.32,0,w*.32,.5,d*.48,'#968b78');b.box(w*.18,h+.59,0,w*.38,.07,d*.54,color);}
  b.box(0,.56,front+.025,.72,1.12,.045,'#554b3e');b.box(0,1.18,front+.055,.88,.09,.12,'#ded0b4');
  if(index%2===0){
    b.box(0,1.42,front+.35,w*.8,.09,.7,index%4===0?'#9b6955':'#7e9079');
    for(const x of [-1,1])b.box(x*w*.33,.69,front+.6,.045,1.38,.045,'#716c59');
    // Leave the central residential doorway open between the shop shutters.
    for(let i=0;i<5;i++)if(i!==2)b.box((i-2)*w*.13,.65,front+.05,w*.12,1.15,.05,index%4===0?'#7d6152':'#778677');
  }
  if(index%3===1){
    b.box(0,h*.59,front+.25,w*.65,.1,.54,'#b8aa8c');
    b.box(0,h*.59+.29,front+.48,w*.65,.04,.035,'#645b4b');
    for(let i=-3;i<=3;i++)b.box(i*w*.1,h*.59+.16,front+.48,.025,.29,.025,'#645b4b');
    for(const x of [-1,1])b.box(x*w*.25,h*.59-.18,front+.14,.08,.36,.28,color);
  }
  const root=b.finish();root.name='Taj Ganj · courtyard house';root.userData.roofHeight=h;root.userData.doorway={x:0,z:front+.045,insideZ:front-.45};return root;
}
/** An attached row shares party walls and two cached facade families. Roofline,
 * courtyards, shutters, balconies and service roofs change from lot to lot. */
export function tajGanjRow(index:number,count:number,width=3.65,depth=4.8) {
  const b=new Builder();
  for(let i=0;i<count;i++){
    const home=tajGanjHouse((index%4)*2+i%2,width,depth,2.5+((index*3+i*7)%6)*.34);
    home.position.x=(i-(count-1)/2)*width;b.absorb(home);
  }
  const root=b.finish();root.name='Taj Ganj · attached bazaar terrace';root.userData.houseCount=count;return root;
}
export function cypressResources() {
  const trunk=new T.CylinderGeometry(.09,.14,2.3,6),foliage=new T.LatheGeometry([[.18,1],[.38,1.4],[.42,2.4],[.33,3.4],[.18,4.2],[.015,4.7]].map(([r,y])=>new T.Vector2(r,y)),10);
  trunk.translate(0,1.15,0);return {trunk,foliage,bark:material('#716648'),leaves:material('#3d653b')};
}
