import * as T from 'three';
import {Builder,material,vec} from '../../geometry.ts';
import {registerGlow} from '../../lighting.ts';
import {boatCabinGlass} from '../../boatLighting.ts';
const stone='#d8cfad',trim='#eee4c8',shadow='#4d6467',roof='#b86642';
const windows=[0,1,2].map(i=>registerGlow(new T.MeshStandardMaterial({color:['#405b61','#556a67','#435258'][i],emissive:['#eac697','#efdbb2','#b4c6cc'][i],roughness:.48}),[.62,.48,.26][i]));
const rowWindows=windows.map(m=>{const glass=registerGlow(new T.MeshStandardMaterial({color:m.color,emissive:m.emissive,roughness:.48}),.38);glass.userData.glowStrength=.38;return glass;});
function glass(b:Builder,x:number,y:number,z:number,w:number,h:number,lit=0){b.box(x,y,z,w+.13,h+.14,.075,trim);b.box(x,y,z+.045,w,h,.035,lit<0?shadow:windows[lit%3]);b.box(x,y,z+.08,.035,h,.025,'#d4d1ba');}
function arch(b:Builder,x:number,y:number,z:number,w:number,h:number,depth=.25,color=trim,segments=w<1.3?6:10){
 const s=new T.Shape();s.moveTo(-w/2,0);s.lineTo(-w/2,h-w/2);s.absarc(0,h-w/2,w/2,Math.PI,0,true);s.lineTo(w/2,0);s.lineTo(w/2-.15,0);s.lineTo(w/2-.15,h-w/2);s.absarc(0,h-w/2,w/2-.15,0,Math.PI,false);s.lineTo(-w/2+.15,0);s.closePath();const g=new T.ExtrudeGeometry(s,{depth,steps:1,bevelEnabled:false,curveSegments:segments});b.add(g,material(color),x,y,z);g.dispose();
}
function pitchedRoof(b:Builder,x:number,y:number,z:number,w:number,d:number,h:number,color=roof){const s=new T.Shape();s.moveTo(-w/2,0);s.lineTo(0,h);s.lineTo(w/2,0);s.closePath();const g=new T.ExtrudeGeometry(s,{depth:d,bevelEnabled:false});b.add(g,material(color),x,y,z-d/2);g.dispose();for(let v=-d/2;v<=d/2;v+=.3){b.beam(vec(x-w/2,y+.02,z+v),vec(x,y+h+.02,z+v),.018,color==='#6b716b'?'#81877d':color==='#b79370'?'#c0ac91':color==='#a8967d'?'#bbb09d':'#bd7b59',4);b.beam(vec(x,y+h+.02,z+v),vec(x+w/2,y+.02,z+v),.018,color==='#6b716b'?'#81877d':color==='#b79370'?'#c0ac91':color==='#a8967d'?'#bbb09d':'#bd7b59',4);}}
function dome(b:Builder,x:number,y:number,z:number,r:number,h:number,color=trim){const points=[vec(0,0,0),vec(r,0,0),vec(r*.98,h*.2,0),vec(r*.73,h*.65,0),vec(r*.22,h*.95,0),vec(.025,h*1.12,0)].map(p=>new T.Vector2(p.x,p.y));const g=new T.LatheGeometry(points,16);b.add(g,material(color),x,y,z);g.dispose();}
function turret(b:Builder,x:number,z:number,base:number,r=.52){b.cylinder(x,base+1,z,r,2,stone,r*.95,12);b.cylinder(x,base+1.85,z,r*1.12,.13,trim,r*1.12,12);dome(b,x,base+2,z,r*1.05,.8);b.cylinder(x,base+2.95,z,.045,.4,'#c9b986',.02,8);for(const dx of [-.18,.18])b.box(x+dx,base+1.2,z+r,.1,.65,.035,shadow);}
function battlements(b:Builder,x:number,y:number,z:number,w:number,d:number){b.box(x,y,z,w,.22,d,trim);for(let a=-w/2+.2;a<w/2;a+=.62)for(const side of [-1,1])b.box(x+a,y+.4,z+side*(d/2-.13),.35,.65,.3,stone);for(let a=-d/2+.7;a<d/2-.3;a+=.62)for(const side of [-1,1])b.box(x+side*(w/2-.14),y+.4,z+a,.3,.65,.35,stone);}
export function belemTower(){
 const b=new Builder();
 // The low polygonal gun platform projects toward the river (south / +z).
 const s=new T.Shape();s.moveTo(-3.8,2.1);s.lineTo(3.8,2.1);s.lineTo(4.4,-3.2);s.lineTo(1.8,-5.6);s.lineTo(-1.8,-5.6);s.lineTo(-4.4,-3.2);s.closePath();const g=new T.ExtrudeGeometry(s,{depth:1.65,bevelEnabled:false});g.rotateX(-Math.PI/2);b.add(g,material(stone));g.dispose();
 b.box(0,4.7,-.9,4.5,7.8,4.35,stone);for(const y of [1.6,3.3,5.3,7.4,8.6])b.box(0,y,-.9,4.68,.18,4.53,trim);
 for(const y of [2.4,4.2,6.2])for(const x of [-1.35,0,1.35]){glass(b,x,y,1.31,.65,.98,-1);arch(b,x,y-.5,1.33,.83,1.25,.1);}
 // South loggia: projecting balcony with its finely spaced arcade.
 b.box(0,5.55,1.9,4.9,.2,1.5,trim);b.box(0,6.9,1.88,4.9,.16,1.5,trim);for(let x=-2.15;x<=2.2;x+=.86){b.cylinder(x,6.2,2.55,.075,1.2,trim,.075,8);arch(b,x+.43,5.65,2.5,.86,1.2,.1);}
 for(let x=-2.2;x<2.3;x+=.25)b.box(x,5.86,2.59,.045,.45,.07,trim);b.box(0,6.08,2.59,4.7,.09,.12,trim);
 battlements(b,0,8.72,-.9,4.7,4.55);for(const x of [-2.2,2.2])for(const z of [-3.1,1.3])turret(b,x,z,7.9,.53);
 for(const [x,z] of [[-3.55,-.7],[3.55,-.7],[-3.75,3.9],[3.75,3.9],[-1.5,5.35],[1.5,5.35]])turret(b,x,z,1.3,.45);
 for(let x=-2.8;x<=2.8;x+=.7)b.box(x,2.05,5.5,.35,.7,.28,stone);for(const x of [-1.3,0,1.3])b.box(x,.7,5.62,.42,.28,.05,shadow);
 const root=b.finish();root.name='Torre de Belém · tower, loggia and river bastion';return root;
}
export function jeronimos(){
 const b=new Builder();
 // The west monastery range is substantially longer and lower than the
 // church. Two tiers of deeply framed bays run under one long hipped ridge.
 b.box(-8.2,2.45,0,27.4,4.7,6.8,stone);b.box(-8.2,4.82,0,27.7,.23,7.1,trim);
 for(let x=-21.1;x<5.1;x+=1.35){
  for(const y of [.5,2.6]){glass(b,x,y+.68,3.44,.58,1.2,-1);arch(b,x,y,3.48,.9,1.65,.15);}
  b.box(x+.65,2.5,3.65,.17,4.8,.36,trim);b.cylinder(x+.65,5.35,3.65,.13,1,trim,0,6);
  b.box(x,2.4,3.6,1.2,.14,.3,trim);b.box(x,4.38,3.6,1.2,.13,.26,trim);
 }
 hipRoof(b,-8.2,4.93,0,27.6,6.95,1.05,'#a79375');
 // Broad open cloister behind the western range: two arcaded storeys,
 // an uncluttered courtyard and low perimeter roofs, rather than a solid box.
 const cx=-8.2,cz=-6;for(const side of [-1,1]){b.box(cx+side*11.75,2.3,cz,1.4,4.5,6.5,stone);b.box(cx,2.3,cz+side*3.1,24.9,4.5,1.3,stone);b.box(cx+side*11.75,4.62,cz,1.7,.22,6.8,trim);b.box(cx,4.62,cz+side*3.1,25.1,.22,1.6,trim);}
 b.box(cx,.08,cz,22.1,.16,4.9,'#86985e');b.box(cx,.18,cz,21.7,.04,.65,'#d4cfb6');b.box(cx,.18,cz,.65,.04,4.8,'#d4cfb6');
 for(let x=-19.3;x<3;x+=1.2)for(const y of [.4,2.5])for(const side of [-1,1]){b.box(x,y+.65,cz+side*2.38,.8,1.2,.045,shadow);arch(b,x,y,cz+side*2.35,1.05,1.55,.13);}
 // Tall church nave, transept, west bell tower and ornate south portal.
 b.box(7.1,4.1,-.8,5.1,8.2,11.2,stone);pitchedRoof(b,7.1,8.2,-.8,5.3,11.4,2.2,'#a8967d');
 for(const z of [-5.7,-3.3,-.9,1.5,3.9])for(const side of [-1,1]){b.box(7.1+side*2.7,3.6,z,.55,7.2,.55,trim);b.cylinder(7.1+side*2.7,7.7,z,.21,1.2,trim,0,6);}
 for(const x of [5.6,7.1,8.6]){glass(b,x,5.3,4.83,.65,2.3,-1);arch(b,x,4.12,4.86,.88,2.8,.13);}
 // The tall south portal has nested ribs, canopied figure niches and a
 // central upper window, echoing the real Manueline sculptural screen.
 b.box(7.1,3.45,5,3.7,6.9,.42,stone);
 for(const [w,z]of[[3.35,5.24],[2.8,5.39],[2.2,5.54],[1.7,5.66]]as const)arch(b,7.1,.24,z,w,4.7,.11);
 b.box(7.1,1.65,5.26,1.35,3.15,.05,shadow);glass(b,7.1,5.8,5.3,.58,1.25,-1);arch(b,7.1,5.1,5.36,1,1.8,.13);
 for(const x of [5.35,6.03,8.17,8.85]){b.cylinder(x,3.65,5.42,.11,7.3,trim,.075,8);b.cylinder(x,7.6,5.42,.18,.9,trim,0,6);for(const y of [2.8,4.2,5.6]){b.box(x,y-.45,5.5,.36,.12,.38,trim);b.cylinder(x,y,5.53,.12,.65,trim,.09,7);b.sphere(x,y+.46,5.53,.12,.15,.12,trim);b.cylinder(x,y+.85,5.53,.23,.35,trim,0,6);}}
 for(let x=5.4;x<8.9;x+=.32)b.cylinder(x,7.05,5.35,.065,.55,trim,0,6);
 b.box(7.1,10.15,-5.4,3.3,3.9,3.4,stone);for(const x of [6.25,7.95])glass(b,x,10.45,-3.67,.55,1.4,-1);dome(b,7.1,12.15,-5.4,1.8,2.5,'#a9aca0');b.cylinder(7.1,15.1,-5.4,.075,.8,'#b8bda9',.03,8);
 const root=b.finish();root.name='Jerónimos · Manueline church and open cloister';return root;
}
export function padrao(){const b=new Builder();b.box(0,.2,0,5.2,.4,7.3,trim);const s=new T.Shape();s.moveTo(-3.3,0);s.lineTo(-3.3,10.7);s.lineTo(-2.25,10.7);s.lineTo(3.2,1.4);s.lineTo(3.2,0);s.closePath();const g=new T.ExtrudeGeometry(s,{depth:1.2,bevelEnabled:false});g.rotateY(Math.PI/2);b.add(g,material(stone),-.6,.45,0);g.dispose();b.box(0,8.25,2.7,.35,4.3,.22,'#9f967b');b.box(0,9.25,2.7,2.2,.35,.22,'#9f967b');for(const side of [-1,1])for(let i=0;i<11;i++){const z=-2.4+i*.48,y=.55+(10-i)*.42;b.cylinder(side*.82,y+.56,z,.16,1.12,trim,.23,8);b.sphere(side*.82,y+1.25,z,.21,.24,.21,trim);}return b.finish();}
export function cristoRei(){const b=new Builder();b.box(0,.24,0,8.2,.48,7.2,'#d3c6aa');for(const x of [-1.35,1.35])for(const z of [-1.35,1.35]){const g=new T.CylinderGeometry(.58,.88,15.3,4);b.add(g,material('#c5bdac'),x,8,z,1,1,1,0,Math.PI/4);g.dispose();}b.box(0,15.25,0,4,.7,4,trim);for(const x of [-1,1])b.beam(vec(x*1.35,13.7,-1.35),vec(0,15.5,-1.35),.52,stone,4);b.box(0,16.1,0,3.35,1,3.35,stone);b.cylinder(0,18.85,0,.72,4.7,trim,.45,12);b.sphere(0,21.7,0,.5,.68,.48,trim);b.beam(vec(-.3,20.15,0),vec(-3.45,20.25,0),.24,trim,10);b.beam(vec(.3,20.15,0),vec(3.45,20.25,0),.24,trim,10);for(const side of [-1,1])b.sphere(side*3.65,20.25,0,.3,.16,.2,trim);const r=b.finish();r.name='Cristo Rei · four-pier pedestal and open-armed statue';return r;}
export function maat(){const b=new Builder();
 // Closed, walk-over low shell; front edge cantilevers over a recessed glass wall.
 const nx=48,nz=20,p:number[]=[],uv:number[]=[],ind:number[]=[];for(let j=0;j<=nz;j++)for(let i=0;i<=nx;i++){const u=i/nx*2-1,v=j/nz*2-1,x=u*9,z=v*4.1*Math.sqrt(Math.max(.03,1-u*u)),h=.32+3.5*Math.pow(Math.max(0,1-u*u),.7)*(.68+.32*Math.sin(v*Math.PI*.7));p.push(x,h,z);uv.push(i/nx*8,j/nz*4);if(i<nx&&j<nz){const a=j*(nx+1)+i;ind.push(a,a+nx+1,a+1,a+1,a+nx+1,a+nx+2);}}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ind);g.computeVertexNormals();const ceramic=material('#e8e6d9',.6);b.add(g,ceramic);
 const soffit=g.clone();soffit.translate(0,-.18,0);const underside=ind.slice();for(let i=0;i<underside.length;i+=3)[underside[i+1],underside[i+2]]=[underside[i+2],underside[i+1]];soffit.setIndex(underside);soffit.computeVertexNormals();b.add(soffit,ceramic);soffit.dispose();
 const perimeter=[...Array.from({length:nx+1},(_,i)=>i),...Array.from({length:nz},(_,j)=>(j+1)*(nx+1)+nx),...Array.from({length:nx},(_,i)=>nz*(nx+1)+nx-i-1),...Array.from({length:nz-1},(_,j)=>(nz-j-1)*(nx+1))],edgePos:number[]=[],edgeIndices:number[]=[];perimeter.push(perimeter[0]);for(let i=0;i<perimeter.length;i++){const k=perimeter[i]*3;edgePos.push(p[k],p[k+1],p[k+2],p[k],p[k+1]-.18,p[k+2]);if(i<perimeter.length-1){const a=i*2;edgeIndices.push(a,a+2,a+1,a+1,a+2,a+3);}}const edge=new T.BufferGeometry();edge.setAttribute('position',new T.Float32BufferAttribute(edgePos,3));edge.setIndex(edgeIndices);edge.computeVertexNormals();b.add(edge,ceramic);edge.dispose();g.dispose();
 for(const side of [-1,1]){const pos:number[]=[],ids:number[]=[];for(let i=0;i<=56;i++){const u=i/56*2-1,edge=4.1*Math.sqrt(Math.max(.03,1-u*u)),top=.32+3.5*Math.pow(Math.max(0,1-u*u),.7)*(.68+.32*Math.sin(side*Math.PI*.7));pos.push(u*9,.1,side*edge*(side===1?.84:1),u*9,Math.max(.15,top-(side===1?.28:0)),side*edge*(side===1?.84:1));if(i<56){const a=i*2;ids.push(a,a+1,a+2,a+1,a+3,a+2);}}const skin=new T.BufferGeometry();skin.setAttribute('position',new T.Float32BufferAttribute(pos,3));skin.setIndex(ids);skin.computeVertexNormals();const finish=side===1?material('#385963',.3,.15):material('#e1dfd1');finish.side=T.DoubleSide;b.add(skin,finish);skin.dispose();}
 for(let i=1;i<28;i++){const u=i/28*2-1,edge=4.1*Math.sqrt(1-u*u),top=.32+3.5*Math.pow(1-u*u,.7)*(.68+.32*Math.sin(Math.PI*.7));b.beam(vec(u*9,.1,edge*.84),vec(u*9,top-.27,edge*.84),.022,'#cdd5d1',4);}for(let i=0;i<5;i++)b.box(0,.08+i*.11,4.4-i*.26,16-i*.6,.16,.62,'#d5d5c5');
 // Fine ceramic joints are etched surface ribbons, not cylindrical tubes.
 // They retain the wave curve while avoiding invisible underside segments.
 for(let i=0;i<28;i++){const x=(i/27*1.94-.97)*9,pos:number[]=[],indices:number[]=[];for(let j=0;j<=14;j++)for(const side of[-1,1]){const xx=x+side*.016,u=xx/9,v=j/14*2-1;pos.push(xx,.345+3.5*Math.pow(1-u*u,.7)*(.68+.32*Math.sin(v*Math.PI*.7)),v*4.1*Math.sqrt(1-u*u));}for(let j=0;j<14;j++){const a=j*2;indices.push(a,a+2,a+1,a+1,a+2,a+3);}const seam=new T.BufferGeometry();seam.setAttribute('position',new T.Float32BufferAttribute(pos,3));seam.setIndex(indices);seam.computeVertexNormals();b.add(seam,material('#c6cdc7'));seam.dispose();}
 const r=b.finish();r.name='MAAT · ceramic waterfront wave';return r;}
export function centralTejo(){
 const b=new Builder(),halls=[{x:-4,w:5,h:7},{x:1,w:4.4,h:5.6},{x:5,w:3.5,h:8}];
 // Central Tejo's industrial brick elevations wrap around the halls. Build
 // one bounded bay vocabulary for the riverfront, rear and exposed ends.
 const elevation=(x:number,z:number,width:number,height:number,yaw=0,base=0)=>{
  const e=new Builder(),columns=Math.max(2,Math.round(width/1.08)),bay=width/columns;
  for(let i=0;i<columns;i++){
   const xx=-width/2+bay*(i+.5);
   for(let y=base+.95;y<height-.65;y+=1.9){
    const pane=new T.PlaneGeometry(Math.min(.64,bay-.3),1.25);e.add(pane,material(shadow),xx,y,.045);pane.dispose();
    const mullion=new T.PlaneGeometry(.035,1.25);e.add(mullion,material('#d4d1ba'),xx,y,.08);mullion.dispose();
    arch(e,xx,y-.65,.055,Math.min(.81,bay-.13),1.5,.09,'#c29170',4);
   }
  }
  for(let i=0;i<=columns;i++){const xx=-width/2+bay*i;e.box(xx,(base+height)/2,.08,.16,height-base,.18,'#c38b65');e.box(xx,height+.04,.09,.24,.17,.24,'#c18a68');}
  for(let y=base+.24;y<height;y+=1.9)e.box(0,y,.06,width+.12,.1,.14,'#b77f5e');
  e.box(0,height-.08,.07,width+.18,.2,.22,'#c29170');
  const face=e.finish();face.position.set(x,0,z);face.rotation.y=yaw;b.absorb(face);
 };
 halls.forEach(({x,w,h},i)=>{
  b.box(x,h/2,0,w,h,5.4,'#a66b4f');pitchedRoof(b,x,h,0,w+.15,5.6,.85,'#6b716b');
  elevation(x,2.73,w,h);elevation(x,-2.73,w,h,Math.PI);
  if(i===0){elevation(x-w/2-.03,0,5.4,h,-Math.PI/2);elevation(x+w/2+.03,0,5.4,h,Math.PI/2,5.6);}
  if(i===2){elevation(x+w/2+.03,0,5.4,h,Math.PI/2);elevation(x-w/2-.03,0,5.4,h,-Math.PI/2,5.6);}
 });
 for(const x of [-5,-2]){b.cylinder(x,10.3,-1.1,.43,9.7,'#a46449',.31,12);b.cylinder(x,15.1,-1.1,.45,.27,'#c59070',.45,12);}
 const root=b.finish();root.name='Central Tejo · brick industrial halls and arched bays';return root;
}
export function tagusBoat(sail=false){const b=new Builder();b.sphere(0,.12,0,.62,.25,1.65,'#eee7d2');b.box(0,.29,0,1,.13,2.4,'#c4ad84');if(sail){b.cylinder(0,2.1,0,.035,3.8,'#d1d5c6',.02,6);const p=new T.BufferGeometry();p.setAttribute('position',new T.Float32BufferAttribute([0,.45,.07,0,3.9,.07,0,.45,1.38],3));p.computeVertexNormals();const m=material('#e8e7d6');m.side=T.DoubleSide;b.add(p,m);p.dispose();}else{b.box(0,.64,-.25,.9,.6,1.65,'#e7dfc9');b.box(0,.73,.59,.8,.35,.025,boatCabinGlass('#3b6972',.3));b.box(0,.98,-.25,1.03,.1,1.8,'#e1e2d5');}return b.finish();}

function hipRoof(b:Builder,x:number,y:number,z:number,w:number,d:number,h:number,color:string){
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute([-w/2,0,-d/2,w/2,0,-d/2,w/2,0,d/2,-w/2,0,d/2,-w*.31,h,0,w*.31,h,0],3));g.setIndex([0,4,5,0,5,1,2,5,4,2,4,3,0,3,4,1,5,2]);g.computeVertexNormals();b.add(g,material(color),x,y,z);g.dispose();b.beam(vec(x-w*.31,y+h+.02,z),vec(x+w*.31,y+h+.02,z),.045,color,4);
}
/** Twelve bounded shared row archetypes, each assembled from attached party-wall lots. */
export function terraceRow(type:number){
 const variants=[{widths:[3.15,3.8,2.9,3.5],floors:[2,4,3,3]}, {widths:[4.2,3.2,4.1],floors:[4,3,5]}, {widths:[2.7,3.2,2.85,3.05,2.6],floors:[2,2,3,2,2]}, {widths:[3.5,4.1,3.35,3.8],floors:[3,5,4,3]}, {widths:[2.7,3.05,3.3,2.8],floors:[1,2,3,2]}, {widths:[3.2,3.5,3.15],floors:[3,4,3]}, {widths:[4.8,4.6,4.9],floors:[5,7,6]}, {widths:[4.3,4.8,4.2],floors:[6,8,5]}, {widths:[2.1,2.2,2.15,2.1],floors:[2,3,2,3]}, {widths:[2.2,2.1,2.15,2.25],floors:[3,2,4,3]}, {widths:[2.55,2.7],floors:[3,5]}, {widths:[2.65,2.5],floors:[2,4]}];
 const v=variants[type%12],b=new Builder(),face=new T.PlaneGeometry(1,1),panel=(x:number,y:number,z:number,w:number,h:number,color:string|T.Material,yaw=0)=>b.add(face,typeof color==='string'?material(color):color,x,y,z,w,h,1,0,yaw),depth=type>=8?3.5:type===1?5.7:4.9,total=v.widths.reduce((a,w)=>a+w,0),colors=['#e3ddcc','#d7c49e','#caa89d','#c7cec1','#dde0d6','#aebfc3','#e6dbc5','#bfd0cb'];let cursor=-total/2;
 v.widths.forEach((w,i)=>{const x=cursor+w/2,h=v.floors[i]*1.38+.35,index=type*5+i,color=colors[index%colors.length],d=depth;cursor+=w;
  // Roofs and attached neighbours conceal top/bottom/party walls. Keep only
  // exposed masonry faces, saving geometry without changing the silhouette.
  panel(x,h/2,d/2,w,h,color);panel(x,h/2,-d/2,w,h,color,Math.PI);
  if(i===0)panel(x-w/2,h/2,0,d,h,color,-Math.PI/2);
  if(i===v.widths.length-1)panel(x+w/2,h/2,0,d,h,color,Math.PI/2);
  if(i&&v.floors[i]>v.floors[i-1])panel(x-w/2,(h+v.floors[i-1]*1.38+.35)/2,0,d,h-(v.floors[i-1]*1.38+.35),color,-Math.PI/2);
  if(i<v.widths.length-1&&v.floors[i]>v.floors[i+1])panel(x+w/2,(h+v.floors[i+1]*1.38+.35)/2,0,d,h-(v.floors[i+1]*1.38+.35),color,Math.PI/2);
  b.box(x,.18,0,w,.36,d+.12,'#c4c1af');b.box(x,h-.06,0,w,.16,d+.2,trim);
  // Parallel terracotta roof ridges dominate; occasional cross-gable breaks the roofline.
  const rc=['#88402c','#9c4b32','#773a2c','#a65336'][index%4];
  if(type===6||type===7){b.box(x,h+.1,0,w-.04,.2,d+.1,'#c4c1b0');b.box(x,h+.47,-.5,w*.5,.55,d*.4,'#b3b8ae');}
  else if(type===2&&i===2)pitchedRoof(b,x,h,0,w-.04,d+.16,.85,rc);else hipRoof(b,x,h,0,w-.04,d+.18,.65+(i%2)*.25,rc);
  if((type<6||type>=8)&&index%3===0)b.box(x+w*.22,h+.9,-d*.16,.32,.95,.44,'#d6b49a');
  const cols=w>3.8?3:2;
  for(let floor=0;floor<v.floors[i];floor++)for(let col=0;col<cols;col++){
   const wx=x-w/2+(col+1)*w/(cols+1),wy=.95+floor*1.38;
   for(const side of [-1,1]){const zz=side*(d/2+.03),ww=cols===3?.51:.6;
    panel(wx,wy,zz,ww+.13,1.04,trim,side<0?Math.PI:0);panel(wx,wy,zz+side*.045,ww,.87,(index+floor+col)%4===0?rowWindows[(index+floor)%3]:shadow,side<0?Math.PI:0);
    if(side===1){panel(wx-ww/2-.13,wy,zz+.055,.16,.98,index%2?'#537567':'#4e6872');panel(wx+ww/2+.13,wy,zz+.055,.16,.98,index%2?'#537567':'#4e6872');
     if(floor>0&&(floor+index)%2===0){b.box(wx,wy-.6,zz+.17,ww+.35,.08,.4,trim);for(const dx of [-.36,0,.36])panel(wx+dx,wy-.36,zz+.36,.025,.4,'#3f504d');panel(wx,wy-.16,zz+.36,ww+.35,.035,'#3f504d');}
    }
   }
  }
  // Exposed end elevations have windows rather than blank party-wall slabs.
  for(const side of [-1,1])if((side<0&&i===0)||(side>0&&i===v.widths.length-1))for(let floor=0;floor<v.floors[i];floor++)for(const z of [-d*.27,d*.27]){panel(x+side*(w/2+.025),.95+floor*1.38,z,.68,.97,trim,side*Math.PI/2);panel(x+side*(w/2+.052),.95+floor*1.38,z,.52,.81,(floor+index)%4===0?rowWindows[index%3]:shadow,side*Math.PI/2);}
  panel(x,.65,d/2+.1,.55,1.3,index%2?'#4f665c':'#416779');
  // A few blue-and-cream azulejo friezes are geometry, not per-house textures.
  if(index%4===0)for(let k=0;k<Math.floor(w/.24);k++){panel(x-w/2+.12+k*.24,1.58,d/2+.065,.22,.16,k%2?'#577c8d':'#e2dfc5');panel(x-w/2+.12+k*.24,h-.33,d/2+.065,.22,.16,k%2?'#e2dfc5':'#577c8d');}
  if(type===6||type===7){for(let floor=1;floor<v.floors[i];floor++){const y=.95+floor*1.38;b.box(x,y-.55,d/2+.28,w-.18,.1,.62,trim);b.box(x,y-.17,d/2+.58,w-.18,.44,.04,'#9daea8');}}
  if(type===1&&i===0){b.box(x,.66,d/2+.12,w-.45,1.15,.05,material('#466669',.48));b.box(x,1.36,d/2+.3,w-.3,.12,.6,'#9b7562');}
 });
 face.dispose();const root=b.finish();root.name='Lisbon · attached terrace row';root.userData.dwellings=v.widths.length;root.userData.rowType=type;root.userData.rowWidth=total;root.userData.rowDepth=depth+.9;return root;
}

/** Pena's yellow New Palace, gray ribbed dome and red clock tower form a
 * deliberately labelled Sintra excursion, rather than a relocated Lisbon claim. */
export function penaPalace(){
 const b=new Builder(),yellow='#d9b433',red='#ac4c39',cream='#dfd6b9',dark='#435452';
 b.box(0,.65,0,28,1.3,21,'#9d967e');b.box(0,1.38,0,28.4,.18,21.4,cream);
 // Unequal terrace levels and retaining buttresses ground the hilltop group.
 b.box(1,2.45,3,23,2.2,14,yellow);b.box(1,3.6,3,23.4,.2,14.3,cream);
 for(const x of [-10,-5,0,5,10]){b.box(x,1.7,10.2,.65,3.3,.8,'#b3a56d');b.cylinder(x,4,10.2,.3,.7,cream,0,6);}
 const merlons=(x:number,y:number,z:number,w:number,d:number,color:string)=>{b.box(x,y,z,w,.22,d,color);for(let xx=-w/2+.15;xx<w/2;xx+=.72)for(const side of [-1,1])b.box(x+xx,y+.42,z+side*(d/2-.15),.34,.65,.32,color);for(let zz=-d/2+.8;zz<d/2-.5;zz+=.72)for(const side of [-1,1])b.box(x+side*(w/2-.15),y+.42,z+zz,.32,.65,.34,color);};
 b.box(6.3,6.8,-2.6,14.2,6.3,9.4,yellow);merlons(6.3,10.02,-2.6,14.55,9.7,red);
 // Rotate complete elevations outwards, so rear glazing is never buried
 // behind its stone frame. End elevations continue the same arched bays.
 const elevation=(x:number,z:number,yaw:number,columns:number[],levels:number[],width=.67)=>{const e=new Builder();for(const xx of columns)for(const y of levels){glass(e,xx,y,0,width,1.14,-1);arch(e,xx,y-.62,.08,width+.28,1.55,.12,cream);}const root=e.finish();root.position.set(x,0,z);root.rotation.y=yaw;b.absorb(root);};
 const wingColumns=Array.from({length:9},(_,i)=>-6+i*1.5);
 elevation(6.3,2.14,0,wingColumns,[5.05,7.55]);elevation(6.3,-7.34,Math.PI,wingColumns,[5.05,7.55]);
 elevation(13.44,-2.6,Math.PI/2,[-3,-1.5,0,1.5,3],[5.05,7.55]);
 elevation(-.84,-2.6,-Math.PI/2,[-2.8,-1.25,.3,1.85,3.4],[5.05,7.55]);
 // Yellow circular tower with a grounded, radially ribbed gray dome.
 b.cylinder(-8,7.7,1.3,4.35,12.2,yellow,4.35,40);for(const y of [3.1,7.1,11.2,13.85])b.cylinder(-8,y,1.3,4.48,.2,cream,4.48,40);
 for(let i=0;i<16;i++){const a=i/16*Math.PI*2,x=-8+Math.sin(a)*4.39,z=1.3+Math.cos(a)*4.39,e=new Builder();for(const y of [5.2,9.2,12.2]){glass(e,0,y,0,.53,.95,-1);arch(e,0,y-.52,.04,.74,1.28,.07,cream);}const face=e.finish();face.position.set(x,0,z);face.rotation.y=a;b.absorb(face);b.box(x,14.15,z,.22,.6,.22,yellow);}
 const domePoints=Array.from({length:13},(_,i)=>{const a=i/12*Math.PI/2;return new T.Vector2(4.4*Math.cos(a),4.65*Math.sin(a));});const domeGeo=new T.LatheGeometry(domePoints,40);b.add(domeGeo,material('#657274',.6,.1),-8,14,1.3);domeGeo.dispose();
 for(let i=0;i<20;i++){const a=i/20*Math.PI*2,points=Array.from({length:12},(_,j)=>{const t=j/11*Math.PI/2;return vec(-8+4.43*Math.cos(t)*Math.sin(a),14+4.68*Math.sin(t),1.3+4.43*Math.cos(t)*Math.cos(a));});b.tube(points,.035,'#a5aba2',12);}
 b.cylinder(-8,19.05,1.3,.11,.8,'#bca36b',.03,8);
 // Tall red crenellated clock tower behind the yellow ranges.
 b.box(1.4,11.3,-5,4.2,16,4.2,red);for(const y of [5.8,10.6,15.3,19.35])b.box(1.4,y,-5,4.55,.3,4.55,cream);merlons(1.4,19.6,-5,4.7,4.7,red);
 for(const [x,z,yaw]of[[1.4,-2.86,0],[1.4,-7.14,Math.PI],[-.74,-5,-Math.PI/2],[3.54,-5,Math.PI/2]])elevation(x,z,yaw,[0],[7.3,12.2,17.35],.9);
 for(const x of [-.7,3.5])for(const z of [-7.1,-2.9]){b.cylinder(x,19.3,z,.35,2.5,red,.28,8);b.cylinder(x,21,z,.5,.8,cream,0,6);}
 for(const side of [-1,1]){const disc=new T.CircleGeometry(.75,24);b.add(disc,material('#ece4ca'),1.4,15.95,-5+side*2.32,1,1,1,0,side===1?0:Math.PI);disc.dispose();b.box(1.4,16.13,-5+side*2.35,.055,.52,.035,dark);b.box(1.59,15.95,-5+side*2.35,.42,.055,.035,dark);}
 // Pale Manueline entrance and chapel, scalloped window/rope motifs.
 b.box(-1.3,7.5,3.5,4,8.1,4.8,cream);merlons(-1.3,11.6,3.5,4.4,5.1,cream);for(const x of [-2.9,.3]){b.cylinder(x,8.1,6,.21,8.7,'#b9b6a4',.16,10);b.cylinder(x,12.65,6,.36,.85,cream,0,8);}
 elevation(.74,3.5,Math.PI/2,[0],[8.8],.66);elevation(-3.34,3.5,-Math.PI/2,[0],[8.8],.66);
 for(const w of [3.3,2.8,2.25])arch(b,-1.3,3.65,6.07+(3.3-w)*.13,w,4.8,.13,cream);b.box(-1.3,5.5,6.12,1.55,3.6,.05,dark);glass(b,-1.3,9.6,6.15,1.05,1.55,-1);
 b.box(6.2,4.9,7.5,12.5,2.4,3.9,yellow);for(let x=.7;x<12;x+=1.15){b.box(x,4.7,9.49,.66,1.5,.045,dark);arch(b,x,3.92,9.53,.92,1.92,.12,cream);b.cylinder(x+.55,5.1,9.64,.08,2.2,cream,.08,8);}merlons(6.2,6.18,7.5,12.8,4.2,yellow);
 // The foreground is a stepped cluster of bastion, arcade and gateway,
 // rather than one unbroken terrace slab below the three main towers.
 b.cylinder(-6,3.3,8.2,3.05,3.8,yellow,3.05,24);b.cylinder(-6,5.28,8.2,3.2,.18,cream,3.2,24);
 for(let i=0;i<16;i++){const a=i/16*Math.PI*2,x=-6+3.1*Math.sin(a),z=8.2+3.1*Math.cos(a);b.box(x,5.66,z,.32,.6,.32,cream);}
 for(const a of [-.8,0,.8])elevation(-6+Math.sin(a)*3.08,8.2+Math.cos(a)*3.08,a,[0],[3.5],.55);
 b.box(-6,1.51,9.4,6.3,.18,4.2,cream);
 b.box(9.9,3.67,10,4.5,4.75,3.8,'#bdbcae');merlons(9.9,6.12,10,4.8,4.1,cream);
 b.box(9.9,2.98,11.93,2.75,3.05,.045,dark);for(const [w,z]of[[3.3,11.98],[2.9,12.08],[2.5,12.18]])arch(b,9.9,1.48,z,w,3.95,.1,cream);
 for(const x of [7.65,12.15]){b.cylinder(x,4.8,11.9,.21,3.25,cream,.18,8);b.cylinder(x,6.72,11.9,.35,.65,cream,0,6);}
 // Carved rope bands and small cupolas give the pale Manueline connector
 // relief while the large dome and red clock tower remain the focal masses.
 for(const x of [-2.9,.3]){for(let y=4.3;y<10.9;y+=.42)b.cylinder(x,y,6.02,.245,.09,cream,.245,8);b.cylinder(x,12.6,5.9,.34,.6,cream,.34,10);dome(b,x,12.9,5.9,.5,.6,yellow);}
 for(const y of [8.1,10.8])b.box(-1.3,y,6.24,3.1,.12,.18,'#b5b4a4');
 for(const x of [-2.35,-.25])for(const y of [8.6,9.2,9.8,10.4]){const jewel=new T.BoxGeometry(.21,.21,.1);b.add(jewel,material('#aaa999'),x,y,6.25,1,1,1,0,0,Math.PI/4);jewel.dispose();}
 // Entrance terrace and supported stair leading to the shared ground datum.
 for(let i=0;i<8;i++)b.box(10,.1+i*.18,12.4-i*.3,3.8,.22,3.6-i*.26,cream);
 for(const x of [8,12]){b.box(x,1.6,11.2,.5,3.1,1.1,red);b.cylinder(x,3.5,11.2,.45,1.05,cream,0,6);}
 const root=b.finish();root.name='Pena Palace · Sintra hilltop excursion';return root;
}

export type TagusVessel='launch'|'sail'|'yacht'|'catamaran'|'ferry'|'ship';
export function tagusVessel(kind:TagusVessel){
 if(kind==='launch'||kind==='sail')return tagusBoat(kind==='sail');
 const b=new Builder(),ship=kind==='ship',ferry=kind==='ferry',cat=kind==='catamaran',length=ship?14:ferry?7.6:cat?5.2:5.5,width=ship?3.5:ferry?2.1:cat?2.2:1.6;
 const hull=(x:number,w:number)=>{const shape=new T.Shape();shape.moveTo(-w/2,-length/2);shape.lineTo(w/2,-length/2);shape.lineTo(w/2,length*.25);shape.quadraticCurveTo(w*.4,length*.46,0,length/2);shape.quadraticCurveTo(-w*.4,length*.46,-w/2,length*.25);shape.closePath();const geo=new T.ExtrudeGeometry(shape,{depth:ship?.8:.42,bevelEnabled:true,bevelSize:.08,bevelThickness:.08,bevelSegments:1,curveSegments:8});geo.rotateX(-Math.PI/2);b.add(geo,material(ship?'#344e60':ferry?'#d7d5c0':'#eae8db'),x,0,0);geo.dispose();};
 if(cat){hull(-.8,.45);hull(.8,.45);b.box(0,.5,0,2.1,.2,length*.8,'#eee9d6');}else hull(0,width);
 b.box(0,ship?.85:.48,0,width*.84,.12,length*.83,ship?'#cbb792':'#ccb695');
 const floors=ship?3:ferry?2:1;
 for(let floor=0;floor<floors;floor++){const y=(ship?1.1:.7)+floor*.66,w=width*(.78-floor*.07),l=length*(.68-floor*.1);b.box(0,y+.28,-length*.06,w,.56,l,'#e6e4d7');for(const side of [-1,1])for(let z=-l*.42;z<l*.45;z+=ship?.65:.48)b.box(side*(w/2+.025),y+.32,z,.035,.25,ship?.42:.3,boatCabinGlass('#315562',.4));b.box(0,y+.58,-length*.06,w+.12,.1,l+.15,'#eee9db');}
 if(ship){b.box(0,3.27,-2.6,1.05,.8,1.4,'#b57848');b.box(0,3.75,-2.6,1.15,.18,1.45,'#344f56');for(const side of [-1,1])for(const z of [-3,-1,1,3])b.sphere(side*1.53,1.75,z,.24,.21,.64,'#d89c50');}
 else if(!ferry){b.box(0,1.62,-.25,width*.73,.12,length*.44,'#eee7d5');b.cylinder(0,2.05,-.5,.035,.8,'#b7c6c3',.02,6);}
 for(const side of [-1,1]){const y=ship?1.25:.85;for(let z=-length*.4;z<length*.4;z+=.6)b.cylinder(side*width*.45,y,z,.022,.5,'#bec8c3',.022,5);b.beam(vec(side*width*.45,y+.25,-length*.42),vec(side*width*.45,y+.25,length*.35),.025,'#bec8c3',5);}
 const root=b.finish();root.name=`Tagus ${kind}`;root.userData.length=length;return root;
}


/** Small original Portuguese parish/civic studies. The Alfama reference informs
 * the vocabulary; these are not relocated named monuments. */
export function neighbourhoodCivic(church=true){
 const b=new Builder(),white='#ece9dc',edge='#d4d1c3',recess='#506361',w=church?8.6:12.5,d=church?9.4:6.8,h=church?7:6.3;
 b.box(0,.14,0,w+.7,.28,d+.8,edge);b.box(0,h/2,0,w,h,d,white);
 for(const y of [.38,3.35,h-.15])b.box(0,y,0,w+.12,.18,d+.12,edge);
 hipRoof(b,0,h,0,w+.2,d+.25,church?1.8:1.2,'#b9704f');
 const elevation=(x:number,z:number,yaw:number,width:number,bays:number)=>{const e=new Builder();for(let col=0;col<bays;col++){const xx=-width/2+(col+.5)*width/bays;for(const y of [1.75,4.75]){glass(e,xx,y,0,.62,1.35,-1);if(church)arch(e,xx,y-.68,.06,.85,1.6,.09,edge);}e.box(xx+.62,h/2,.05,.13,h,.15,edge);}const face=e.finish();face.position.set(x,0,z);face.rotation.y=yaw;b.absorb(face);};
 elevation(0,d/2+.04,0,w,church?3:5);elevation(0,-d/2-.04,Math.PI,w,church?3:5);elevation(w/2+.04,0,Math.PI/2,d,church?4:3);elevation(-w/2-.04,0,-Math.PI/2,d,church?4:3);
 // A white classical pediment conceals the front roof end and frames an oculus.
 const pediment=new T.Shape();pediment.moveTo(-w/2,h-.05);pediment.lineTo(0,h+1.8);pediment.lineTo(w/2,h-.05);pediment.closePath();const pg=new T.ExtrudeGeometry(pediment,{depth:.22,bevelEnabled:false});b.add(pg,material(white),0,0,d/2+.1);pg.dispose();
 b.beam(vec(-w/2,h+.02,d/2+.36),vec(0,h+1.86,d/2+.36),.11,edge,4);b.beam(vec(0,h+1.86,d/2+.36),vec(w/2,h+.02,d/2+.36),.11,edge,4);
 const oculus=new T.CircleGeometry(.34,16);b.add(oculus,material(recess),0,h+.64,d/2+.34);oculus.dispose();b.box(0,1.2,d/2+.14,1.25,2.4,.07,recess);arch(b,0,.15,d/2+.2,1.9,3.1,.13,edge);
 for(let i=0;i<4;i++)b.box(0,.05+i*.08,d/2+.78-i*.14,2.7,.12,1.15-i*.2,edge);
 if(church){const x=3.55,z=3.35;b.box(x,9.15,z,2.1,5.4,2.35,white);for(const y of [7.3,8.5,11.5])b.box(x,y,z,2.3,.2,2.55,edge);
  for(const yaw of [0,Math.PI/2,Math.PI,-Math.PI/2]){const e=new Builder();glass(e,0,10,0,.64,1.52,-1);arch(e,0,9.2,.05,.88,1.95,.1,edge);const face=e.finish();face.position.set(x+Math.sin(yaw)*1.08,0,z+Math.cos(yaw)*1.2);face.rotation.y=yaw;b.absorb(face);}
  dome(b,x,11.6,z,1.1,1.45,'#b5b8b1');b.box(x,13.6,z,.08,1.1,.08,edge);b.box(x,13.78,z,.65,.08,.08,edge);
 }else{b.box(0,6.6,0,3.3,.45,2.8,white);for(const x of [-4.9,-2.45,0,2.45,4.9]){b.box(x,1.1,d/2+.14,1.3,2.2,.05,recess);arch(b,x,.05,d/2+.18,1.55,2.7,.12,edge);}}
 const root=b.finish();root.name=church?'Portuguese neighbourhood parish church':'Portuguese white civic hall';root.userData.architecturalStudy=true;return root;
}
