import * as T from 'three';
import {Builder,canvasTexture,facadeTexture,material,vec} from '../../geometry.ts';
import {registerGlow,glowMaterial} from '../../lighting.ts';
import {surfaceMaterial} from '../../nature.ts';

const silver=material('#becbd0',.36,.5),limestone=material('#d8d6c7'),dark=material('#274653',.3,.4);
let curtain:T.MeshStandardMaterial|undefined;
const glazing=()=>curtain??=(facadeTexture('glass','#6b929f'));
function slab(b:Builder,points:{x:number;z:number}[],y:number,h:number,mat:T.Material,facadeHeight=h) {
  const shape=new T.Shape(points.map(p=>new T.Vector2(p.x,-p.z)));shape.closePath();
  const geo=new T.ExtrudeGeometry(shape,{depth:h,bevelEnabled:false});geo.rotateX(-Math.PI/2);
  const uv=geo.getAttribute('uv'),p=geo.getAttribute('position');for(let i=0;i<uv.count;i++){uv.setX(i,(Math.atan2(p.getZ(i),p.getX(i))+Math.PI)/(Math.PI*2));uv.setY(i,(y+p.getY(i))/facadeHeight);}
  b.add(geo,mat,0,y,0);geo.dispose();
}
function burjPlan(tier:number,w:number) {
  const points:{x:number;z:number}[]=[],scale=w/11,r=1.3*(1-tier*.037)*scale;
  for(let wing=0;wing<3;wing++){
    const a=wing*Math.PI*2/3+Math.PI/6,len=3.9*(1-Math.floor((tier+wing)/3)*.13)*scale;
    points.push({x:Math.cos(a-Math.PI/3)*r*.92,z:Math.sin(a-Math.PI/3)*r*.92});
    for(let i=0;i<=10;i++){const angle=a-Math.PI/2+i*Math.PI/10;points.push({x:Math.cos(a)*len+Math.cos(angle)*r,z:Math.sin(a)*len+Math.sin(angle)*r});}
    points.push({x:Math.cos(a+Math.PI/3)*r*.92,z:Math.sin(a+Math.PI/3)*r*.92});
  }return points;
}
/** SOM's three-wing plan and spiralling setbacks, with a telescoping steel spire. */
export function burjKhalifa(w:number,h:number) {
  const b=new Builder(),body=h*.78,step=(body-2.5)/18;
  slab(b,burjPlan(0,w).map(p=>({x:p.x*1.08,z:p.z*1.08})),0,1.2,limestone);
  for(let tier=0;tier<18;tier++){
    const points=burjPlan(tier,w),y=2.5+tier*step;
    slab(b,points,y,step,glazing(),body);
    const ledge=points.map(p=>{const r=Math.hypot(p.x,p.z);return {x:p.x*(1+.025/r),z:p.z*(1+.025/r)};});
    for(let floor=0;floor<step;floor+=.62)slab(b,ledge,y+floor,.045,silver);
    slab(b,ledge,y+step,.12,silver);
    // Slender vertical fins emphasize the clustered rounded wings.
    for(let i=2;i<points.length;i+=3)b.beam(vec(points[i].x,y,points[i].z),vec(points[i].x,y+step,points[i].z),.025,silver,5);
  }
  const remaining=h-body;
  for(let i=0;i<5;i++)b.cylinder(0,body+remaining*(i+.5)/5,0,.7*(1-i*.19),remaining/5,silver,.7*(1-i*.19)*.75,16);
  b.cylinder(0,1.8,0,1.3,1.3,glowMaterial('#e8d6b8',1.6),1.3,24);
  const root=b.finish();root.name='Burj Khalifa';root.userData.architecture='burj';root.userData.wings=3;root.userData.setbacks=18;return root;
}
/** Identical floor plates rotate a complete quarter turn: the defining Cayan form. */
export function cayanTower(w:number,d:number,h:number) {
  const b=new Builder(),floors=60,width=w*.68,depth=d*.68,body=h-2.5,twist=Math.PI/2;
  b.box(0,.4,0,w+.4,.8,d+.4,limestone);
  b.box(0,1.65,0,width*.96,1.7,depth*.96,glazing(),-Math.PI/4);
  const geo=new T.BoxGeometry(width,body,depth,1,floors,1),p=geo.getAttribute('position');
  for(let i=0;i<p.count;i++){const a=(p.getY(i)/body+.5)*twist-Math.PI/4,x=p.getX(i),z=p.getZ(i);p.setX(i,x*Math.cos(a)+z*Math.sin(a));p.setZ(i,-x*Math.sin(a)+z*Math.cos(a));}geo.computeVertexNormals();b.add(geo,glazing(),0,2.5+body/2,0);geo.dispose();
  for(let floor=0;floor<=floors;floor++)b.box(0,2.5+floor/floors*body,0,width+.10,.065,depth+.10,limestone,floor/floors*twist-Math.PI/4);
  for(const side of [-1,1])for(let i=0;i<=6;i++)for(const axis of [0,1]){
    const points=Array.from({length:61},(_,level)=>{const a=level/60*twist-Math.PI/4,x=axis?side*width/2:(i/6-.5)*width,z=axis?(i/6-.5)*depth:side*depth/2;return vec(x*Math.cos(a)+z*Math.sin(a),2.5+level/60*body,-x*Math.sin(a)+z*Math.cos(a));});b.tube(points,.037,limestone,60);
  }
  const root=b.finish();root.name='Cayan Tower';root.userData.architecture='cayan';root.userData.twist=twist;return root;
}
/** Triangular plans, diagonal silver crowns and slender aerials of the Emirates pair. */
export function emiratesTower(w:number,d:number,h:number) {
  const b=new Builder(),points=[{x:-w*.48,z:-d*.35},{x:w*.48,z:-d*.35},{x:0,z:d*.55}],top=(z:number)=>h*.84+(z+d*.35)/(d*.9)*h*.16;
  slab(b,points.map(p=>({x:p.x*1.1,z:p.z*1.1})),0,1.2,limestone);
  slab(b,points,1.2,h*.81-1.2,glazing(),h);
  for(let y=2;y<h*.81;y+=.75)slab(b,points.map(p=>({x:p.x*1.018,z:p.z*1.018})),y,.07,silver);
  const positions:number[]=[],uv:number[]=[];
  for(let i=0;i<3;i++){const a=points[i],c=points[(i+1)%3];for(const [p,y,u,v]of [[a,h*.81,0,0],[c,h*.81,1,0],[c,top(c.z),1,1],[a,h*.81,0,0],[c,top(c.z),1,1],[a,top(a.z),0,1]] as const){positions.push(p.x,y,p.z);uv.push(u,v);}}
  const crown=new T.BufferGeometry();crown.setAttribute('position',new T.Float32BufferAttribute(positions,3));crown.setAttribute('uv',new T.Float32BufferAttribute(uv,2));crown.computeVertexNormals();const crownMat=silver.clone();crownMat.side=T.DoubleSide;b.add(crown,crownMat);crown.dispose();
  const roof=new T.BufferGeometry().setFromPoints(points.map(p=>vec(p.x,top(p.z),p.z)));roof.computeVertexNormals();b.add(roof,crownMat);roof.dispose();
  for(let i=0;i<3;i++){const p=points[i],q=points[(i+1)%3];b.beam(vec(p.x,1.2,p.z),vec(p.x,top(p.z),p.z),.13,silver);b.beam(vec(p.x,top(p.z),p.z),vec(q.x,top(q.z),q.z),.14,silver);}
  b.box(0,h*.86,-d*.355,w*.56,h*.055,.04,dark);b.cylinder(0,h+1.8,d*.55,.055,3.6,silver,.025,8);
  const root=b.finish();root.name='Emirates Tower';root.userData.architecture='emirates';return root;
}
export function indexTower(w:number,d:number,h:number) {
  const b=new Builder();b.box(0,.4,0,w+.5,.8,d+.5,limestone);
  // Broad slab, exposed concrete buttresses, recessed glazing and a sky-lobby band.
  for(const [start,end]of [[1,h*.51],[h*.56,h*.92]])b.box(0,(start+end)/2,0,w*.86,end-start,d*.7,glazing());
  for(const x of [-.47,-.17,.17,.47])b.box(x*w,h*.48,0,w*.075,h*.96,d*.88,limestone);
  for(let y=2;y<h*.92;y+=1)b.box(0,y,d*.355,w*.86,.055,.035,silver);
  b.box(0,h*.535,0,w*.8,h*.025,d*.7,dark);b.box(0,h*.94,0,w*.99,h*.035,d*.86,limestone);
  b.box(0,h*.98,0,w*.7,h*.035,d*.64,silver);
  const root=b.finish();root.name='Index Tower';root.userData.architecture='index';return root;
}

let museumMaterial:T.MeshStandardMaterial|undefined;
export async function loadDubaiLettering() {
  const face=new FontFace('Dubai Calligraphy','url(/assets/fonts/aref-ruqaa.ttf)');
  try {document.fonts.add(await face.load());} catch { /* A system Arabic face keeps the world playable if the font request fails. */ }
}
function calligraphyCladding() {
  if(museumMaterial)return museumMaterial;
  const draw=(emission:boolean)=>canvasTexture(2048,1024,ctx=>{
    ctx.fillStyle=emission?'#000000':'#e1e5e7';ctx.fillRect(0,0,2048,1024);
    if(!emission){ctx.strokeStyle='#bbc3c8';ctx.lineWidth=.7;for(let x=0;x<=2048;x+=64){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,1024);ctx.stroke();}for(let y=0;y<=1024;y+=128){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(2048,y);ctx.stroke();}}
    ctx.textAlign='center';ctx.textBaseline='middle';ctx.direction='rtl';
    // 24 words excerpted from the actual inscriptions, continuously wrapped over
    // the steel skin. Source and calligrapher credit: museumofthefuture.ae/en/get-help.
    const bands=[
      'المستقبل سيكون لمن يستطيع',
      'تخيله وتصميمه وتنفيذه',
      'المستقبل لا ينتظر المستقبل يمكن تصميمه وبناؤه اليوم',
      'سر تجدد الحياة وتطور الحضارة',
      'في كلمة واحدة الابتكار',
    ];
    for(const [row,words]of bands.entries()){
      ctx.save();ctx.translate(1024,row*205+78);ctx.font='400 210px "Dubai Calligraphy", serif';ctx.scale(1970/(ctx.measureText(words)?.width||1970),1);ctx.fillStyle=emission?'#f3e5cd':'#12252e';ctx.fillText(words,0,0);ctx.restore();
    }
  });
  const facade=draw(false),windows=draw(true);
  // Two courses around the oval keep the lettering at architectural scale.
  for(const texture of [facade,windows]){texture.wrapS=T.RepeatWrapping;texture.repeat.x=2;}
  museumMaterial=registerGlow(new T.MeshPhysicalMaterial({map:facade,bumpMap:facade,bumpScale:.045,emissiveMap:windows,emissive:'#fff0d4',metalness:1,roughness:.18,envMapIntensity:2.5,clearcoat:.28,clearcoatRoughness:.16}),1.25);return museumMaterial;
}
/** Killa Design's asymmetric oval / void sits directly on a landscaped mound. */
export function museumOfFuture() {
  const b=new Builder(),group=new T.Group();
  const hill=new T.SphereGeometry(1,48,16,0,Math.PI*2,0,Math.PI/2),hillUV=hill.getAttribute('uv'),hillP=hill.getAttribute('position');
  for(let i=0;i<hillUV.count;i++)hillUV.setXY(i,hillP.getX(i)*11.5/6,hillP.getZ(i)*10/6);
  b.add(hill,surfaceMaterial('grass'),0,0,0,11.5,1.8,10);hill.dispose();
  b.box(0,.45,7,8,.9,3,limestone);b.box(0,.95,6.9,6.5,.1,2.4,'#b7b9aa');
  b.box(0,1.1,7.8,4.8,1.4,.25,dark);b.box(0,1.83,7.8,5.2,.14,.65,silver);
  for(let i=0;i<5;i++)b.box(0,.12+i*.16,8.7-i*.4,7,.16,.5,limestone);
  group.add(b.finish());
  const shell=new Builder(),positions:number[]=[],uv:number[]=[],indices:number[]=[],N=128,M=32;
  const point=(a:number,v:number)=>{
    const ox=10.5*Math.cos(a),oy=8.1+6.3*Math.sin(a),ix=2+5.3*Math.cos(a),iy=8.6+3.3*Math.sin(a);
    return vec((ox+ix)/2+(ox-ix)/2*Math.cos(v),(oy+iy)/2+(oy-iy)/2*Math.cos(v),(2.6+.45*Math.cos(a))*Math.sin(v));
  };
  for(let i=0;i<=N;i++)for(let j=0;j<=M;j++){positions.push(...point(i/N*Math.PI*2,j/M*Math.PI*2).toArray());uv.push(i/N,j/M);}
  for(let i=0;i<N;i++)for(let j=0;j<M;j++){const a=i*(M+1)+j,c=a+M+1;indices.push(a,c,a+1,a+1,c,c+1);}
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(positions,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.setIndex(indices);geo.computeVertexNormals();shell.add(geo,calligraphyCladding());geo.dispose();
  const root=shell.finish();root.rotation.y=Math.PI/5;root.scale.set(1.2,1.35,1.2);root.position.y=-1.35;root.name='Continuous silver torus and elliptical void';group.add(root);
  group.name='Museum of the Future';group.userData.architecture='museum';return group;
}

/** Tom Wright / Atkins' dhow-sail silhouette, exoskeleton and cantilevered helipad. */
export function burjAlArab() {
  const b=new Builder(),white=material('#e8ece7',.38,.16),blue=facadeTexture('glass','#63a0b6');
  const curve=new T.CubicBezierCurve3(vec(-3.5,38,0),vec(7.8,30,0),vec(7.4,12,0),vec(3.8,1.5,0)),edge=curve.getPoints(48);
  b.cylinder(0,.4,0,7,.8,limestone,7,48);b.cylinder(0,.88,0,5.8,.16,white,5.8,48);
  const shape=new T.Shape();shape.moveTo(-3.5,1.5);shape.lineTo(-3.5,38);for(const p of edge.slice(1))shape.lineTo(p.x,p.y);shape.closePath();
  const body=new T.ExtrudeGeometry(shape,{depth:4.7,bevelEnabled:false}),uv=body.getAttribute('uv'),p=body.getAttribute('position');
  for(let i=0;i<p.count;i++)uv.setXY(i,(p.getX(i)+3.5)/11,p.getY(i)/38);
  b.add(body,blue,0,0,-2.35);body.dispose();
  const edgeAt=(y:number)=>{for(let i=1;i<edge.length;i++)if(edge[i].y<=y){const a=edge[i-1],c=edge[i];return T.MathUtils.lerp(a.x,c.x,(a.y-y)/(a.y-c.y));}return edge.at(-1)!.x;};
  for(const z of [-2.45,2.45]){
    b.tube(edge.map(p=>vec(p.x,p.y,z)),.19,white,64);b.beam(vec(-3.5,1,z),vec(-3.5,43,z),.15,white);
    for(let y=2.8;y<37;y+=.95){const x=edgeAt(y);b.box((x-3.5)/2,y,z,x+3.5,.105,.09,white);}
    for(const [low,high]of [[3,14],[14,25],[25,36]]){b.beam(vec(-3.5,low,z+.12),vec(edgeAt(high),high,z+.12),.065,white);}
  }
  b.beam(vec(-3.5,43,0),vec(-3.5,46,0),.045,silver);b.beam(vec(-3.5,43,0),vec(edgeAt(30),30,0),.10,white);
  // The front helipad sits on exposed triangular brackets, not a floating disc.
  for(const x of [-1,1]){b.beam(vec(x,28,2.2),vec(x,32,6.1),.10,white);b.beam(vec(x,32,2.2),vec(x,32,6.1),.09,white);}
  b.cylinder(0,32.1,6.1,1.8,.22,white,1.8,40);b.cylinder(0,32.23,6.1,1.62,.025,'#78918a',1.62,40);
  b.ring(0,32.25,6.1,1.35,.035,'#e7e8d7');for(const x of [-.32,.32])b.box(x,32.26,6.1,.10,.02,.85,'#eee9d3');b.box(0,32.26,6.1,.64,.02,.1,'#eee9d3');
  b.box(-1.3,29,-4.1,5.7,1,3.6,blue);b.box(-1.3,29.6,-4.1,6,.18,3.8,white);b.beam(vec(-3,26,-2),vec(-1.3,28.5,-5.5),.13,white);
  b.box(0,1.5,3.2,5,1.2,2.2,blue);b.box(0,2.15,3.4,5.6,.18,2.8,white);
  for(const z of [-2.55,2.55])b.beam(vec(-3.55,2,z),vec(-3.55,37,z),.028,glowMaterial('#d1e9f6',1.4));
  const root=b.finish();root.name='Burj Al Arab';root.userData.architecture='burj-al-arab';return root;
}
