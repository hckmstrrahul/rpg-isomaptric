import * as T from 'three';
import {Builder,material,vec} from '../../geometry.ts';
import {registerGlow} from '../../lighting.ts';
const stone='#d8cfad',trim='#eee4c8',shadow='#4d6467',roof='#b86642';
const windows=[0,1,2].map(i=>registerGlow(new T.MeshStandardMaterial({color:['#405b61','#556a67','#435258'][i],emissive:['#eac697','#efdbb2','#b4c6cc'][i],roughness:.48}),[.62,.48,.26][i]));
function glass(b:Builder,x:number,y:number,z:number,w:number,h:number,lit=0){b.box(x,y,z,w+.13,h+.14,.075,trim);b.box(x,y,z+.045,w,h,.035,lit<0?shadow:windows[lit%3]);b.box(x,y,z+.08,.035,h,.025,'#d4d1ba');}
function arch(b:Builder,x:number,y:number,z:number,w:number,h:number,depth=.25,color=trim){
 const s=new T.Shape();s.moveTo(-w/2,0);s.lineTo(-w/2,h-w/2);s.absarc(0,h-w/2,w/2,Math.PI,0,true);s.lineTo(w/2,0);s.lineTo(w/2-.15,0);s.lineTo(w/2-.15,h-w/2);s.absarc(0,h-w/2,w/2-.15,0,Math.PI,false);s.lineTo(-w/2+.15,0);s.closePath();const g=new T.ExtrudeGeometry(s,{depth,steps:1,bevelEnabled:false,curveSegments:10});b.add(g,material(color),x,y,z);g.dispose();
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
 const nx=56,nz=24,p:number[]=[],uv:number[]=[],ind:number[]=[];for(let j=0;j<=nz;j++)for(let i=0;i<=nx;i++){const u=i/nx*2-1,v=j/nz*2-1,x=u*9,z=v*4.1*Math.sqrt(Math.max(.03,1-u*u)),h=.32+3.5*Math.pow(Math.max(0,1-u*u),.7)*(.68+.32*Math.sin(v*Math.PI*.7));p.push(x,h,z);uv.push(i/nx*8,j/nz*4);if(i<nx&&j<nz){const a=j*(nx+1)+i;ind.push(a,a+nx+1,a+1,a+1,a+nx+1,a+nx+2);}}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ind);g.computeVertexNormals();const ceramic=material('#e8e6d9',.6);b.add(g,ceramic);
 const soffit=g.clone();soffit.translate(0,-.18,0);const underside=ind.slice();for(let i=0;i<underside.length;i+=3)[underside[i+1],underside[i+2]]=[underside[i+2],underside[i+1]];soffit.setIndex(underside);soffit.computeVertexNormals();b.add(soffit,ceramic);soffit.dispose();
 const perimeter=[...Array.from({length:nx+1},(_,i)=>i),...Array.from({length:nz},(_,j)=>(j+1)*(nx+1)+nx),...Array.from({length:nx},(_,i)=>nz*(nx+1)+nx-i-1),...Array.from({length:nz-1},(_,j)=>(nz-j-1)*(nx+1))],edgePos:number[]=[],edgeIndices:number[]=[];perimeter.push(perimeter[0]);for(let i=0;i<perimeter.length;i++){const k=perimeter[i]*3;edgePos.push(p[k],p[k+1],p[k+2],p[k],p[k+1]-.18,p[k+2]);if(i<perimeter.length-1){const a=i*2;edgeIndices.push(a,a+2,a+1,a+1,a+2,a+3);}}const edge=new T.BufferGeometry();edge.setAttribute('position',new T.Float32BufferAttribute(edgePos,3));edge.setIndex(edgeIndices);edge.computeVertexNormals();b.add(edge,ceramic);edge.dispose();g.dispose();
 for(const side of [-1,1]){const pos:number[]=[],ids:number[]=[];for(let i=0;i<=56;i++){const u=i/56*2-1,edge=4.1*Math.sqrt(Math.max(.03,1-u*u)),top=.32+3.5*Math.pow(Math.max(0,1-u*u),.7)*(.68+.32*Math.sin(side*Math.PI*.7));pos.push(u*9,.1,side*edge*(side===1?.84:1),u*9,Math.max(.15,top-(side===1?.28:0)),side*edge*(side===1?.84:1));if(i<56){const a=i*2;ids.push(a,a+1,a+2,a+1,a+3,a+2);}}const skin=new T.BufferGeometry();skin.setAttribute('position',new T.Float32BufferAttribute(pos,3));skin.setIndex(ids);skin.computeVertexNormals();const finish=side===1?material('#385963',.3,.15):material('#e1dfd1');finish.side=T.DoubleSide;b.add(skin,finish);skin.dispose();}
 for(let i=1;i<28;i++){const u=i/28*2-1,edge=4.1*Math.sqrt(1-u*u),top=.32+3.5*Math.pow(1-u*u,.7)*(.68+.32*Math.sin(Math.PI*.7));b.beam(vec(u*9,.1,edge*.84),vec(u*9,top-.27,edge*.84),.022,'#cdd5d1',4);}for(let i=0;i<5;i++)b.box(0,.08+i*.11,4.4-i*.26,16-i*.6,.16,.62,'#d5d5c5');
 for(let i=0;i<28;i++){const u=i/27*1.94-.97,x=u*9,depth=4.1*Math.sqrt(1-u*u);const points=Array.from({length:15},(_,j)=>{const v=j/14*2-1;return vec(x,.345+3.5*Math.pow(1-u*u,.7)*(.68+.32*Math.sin(v*Math.PI*.7)),v*depth);});b.tube(points,.018,'#c6cdc7',14);}
 const r=b.finish();r.name='MAAT · ceramic waterfront wave';return r;}
export function centralTejo(){
 const b=new Builder(),halls=[{x:-4,w:5,h:7},{x:1,w:4.4,h:5.6},{x:5,w:3.5,h:8}];
 // Central Tejo's industrial brick elevations wrap around the halls. Build
 // one bounded bay vocabulary for the riverfront, rear and exposed ends.
 const elevation=(x:number,z:number,width:number,height:number,yaw=0,base=0)=>{
  const e=new Builder(),columns=Math.max(2,Math.round(width/1.08)),bay=width/columns;
  for(let i=0;i<columns;i++){
   const xx=-width/2+bay*(i+.5);
   for(let y=base+.95;y<height-.65;y+=1.9){glass(e,xx,y,0,Math.min(.64,bay-.3),1.25,-1);arch(e,xx,y-.65,.055,Math.min(.81,bay-.13),1.5,.09,'#c29170');}
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
export function tagusBoat(sail=false){const b=new Builder();b.sphere(0,.12,0,.62,.25,1.65,'#eee7d2');b.box(0,.29,0,1,.13,2.4,'#c4ad84');if(sail){b.cylinder(0,2.1,0,.035,3.8,'#d1d5c6',.02,6);const p=new T.BufferGeometry();p.setAttribute('position',new T.Float32BufferAttribute([0,.45,.07,0,3.9,.07,0,.45,1.38],3));p.computeVertexNormals();const m=material('#e8e7d6');m.side=T.DoubleSide;b.add(p,m);p.dispose();}else{b.box(0,.64,-.25,.9,.6,1.65,'#e7dfc9');b.box(0,.73,.59,.8,.35,.025,material('#3b6972',.3));b.box(0,.98,-.25,1.03,.1,1.8,'#e1e2d5');}return b.finish();}

function hipRoof(b:Builder,x:number,y:number,z:number,w:number,d:number,h:number,color:string){
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute([-w/2,0,-d/2,w/2,0,-d/2,w/2,0,d/2,-w/2,0,d/2,-w*.31,h,0,w*.31,h,0],3));g.setIndex([0,4,5,0,5,1,2,5,4,2,4,3,0,3,4,1,5,2]);g.computeVertexNormals();b.add(g,material(color),x,y,z);g.dispose();b.beam(vec(x-w*.31,y+h+.02,z),vec(x+w*.31,y+h+.02,z),.045,color,6);
}
/** Four bounded shared row archetypes, each assembled from attached party-wall lots. */
export function terraceRow(type:number){
 const variants=[{widths:[3.15,3.8,2.9,3.5],floors:[2,4,3,3]}, {widths:[4.2,3.2,4.1],floors:[4,3,5]}, {widths:[2.7,3.2,2.85,3.05,2.6],floors:[2,2,3,2,2]}, {widths:[3.5,4.1,3.35,3.8],floors:[3,5,4,3]}];
 const v=variants[type%4],b=new Builder(),depth=type===1?5.7:4.9,total=v.widths.reduce((a,w)=>a+w,0),colors=['#e6d8b7','#d7bc87','#d4aaa1','#c2cfbf','#d7e1dc','#aebfca','#e8d7b5','#b8ced0'];let cursor=-total/2;
 v.widths.forEach((w,i)=>{const x=cursor+w/2,h=v.floors[i]*1.38+.35,index=type*5+i,color=colors[index%colors.length],d=depth+(i%3===0?.35:0);cursor+=w;
  b.box(x,h/2,0,w,h,d,color);b.box(x,.18,0,w,.36,d+.12,'#c4c1af');b.box(x,h-.06,0,w,.16,d+.2,trim);
  // Parallel terracotta roof ridges dominate; occasional cross-gable breaks the roofline.
  const rc=['#ad6041','#bd7450','#9f563e','#c28157'][index%4];
  if(type===2&&i===2)pitchedRoof(b,x,h,0,w-.04,d+.16,.85,rc);else hipRoof(b,x,h,0,w-.04,d+.18,.65+(i%2)*.25,rc);
  if(index%3===0)b.box(x+w*.22,h+.9,-d*.16,.32,.95,.44,'#d6b49a');
  const cols=w>3.8?3:2;
  for(let floor=0;floor<v.floors[i];floor++)for(let col=0;col<cols;col++){
   const wx=x-w/2+(col+1)*w/(cols+1),wy=.95+floor*1.38;
   for(const side of [-1,1]){const zz=side*(d/2+.03),ww=cols===3?.51:.6;
    b.box(wx,wy,zz,ww+.13,1.04,.06,trim);b.box(wx,wy,zz+side*.045,ww,.87,.025,(index+floor+col)%4===0?windows[(index+floor)%3]:shadow);
    if(side===1){b.box(wx-ww/2-.13,wy,zz+.055,.16,.98,.035,index%2?'#537567':'#4e6872');b.box(wx+ww/2+.13,wy,zz+.055,.16,.98,.035,index%2?'#537567':'#4e6872');
     if(floor>0&&(floor+index)%2===0){b.box(wx,wy-.6,zz+.17,ww+.35,.08,.4,trim);for(const dx of [-.36,0,.36])b.box(wx+dx,wy-.36,zz+.36,.025,.4,.025,'#3f504d');b.box(wx,wy-.16,zz+.36,ww+.35,.035,.035,'#3f504d');}
    }
   }
  }
  b.box(x,.65,d/2+.1,.55,1.3,.035,index%2?'#4f665c':'#416779');
  // A few blue-and-cream azulejo friezes are geometry, not per-house textures.
  if(index%4===0)for(let k=0;k<Math.floor(w/.24);k++){b.box(x-w/2+.12+k*.24,1.58,d/2+.065,.22,.16,.025,k%2?'#577c8d':'#e2dfc5');b.box(x-w/2+.12+k*.24,h-.33,d/2+.065,.22,.16,.025,k%2?'#e2dfc5':'#577c8d');}
  if(type===1&&i===0){b.box(x,.66,d/2+.12,w-.45,1.15,.05,material('#466669',.48));b.box(x,1.36,d/2+.3,w-.3,.12,.6,'#9b7562');}
 });
 const root=b.finish();root.name='Lisbon · attached terrace row';root.userData.dwellings=v.widths.length;root.userData.rowType=type;root.userData.rowWidth=total;root.userData.rowDepth=depth+.9;return root;
}
