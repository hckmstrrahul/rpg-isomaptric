import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {roadNetworkGeometry} from '../src/worlds/shared/roadNetwork.ts';
import type {Road} from '../src/cityPlan.ts';
const road=(id:string,p:number[][]):Road=>({id,points:p.map(([x,z])=>({x,z})),width:4,size:'main'});
const hits=(mesh:T.Mesh,x:number,z:number)=>new T.Raycaster(new T.Vector3(x,50,z),new T.Vector3(0,-1,0)).intersectObject(mesh);
test('independent road ends form a closed, upward-facing junction without duplicate surfaces',()=>{
 const g=roadNetworkGeometry([road('west',[[-20,0],[0,0]]),road('north',[[0,0],[0,20]]),road('east',[[0,0],[20,0]])],1.35),mesh=new T.Mesh(g,new T.MeshBasicMaterial());mesh.updateMatrixWorld();
 for(const [x,z]of[[-10,.7],[10,.7],[.7,10],[-1.2,1.1],[1.2,1.1],[.43,.62]])assert.equal(hits(mesh,x,z).length,1,`Unjoined/overlapping surface at ${x},${z}`);
 assert.equal(hits(mesh,4,4).length,0);
});
test('a closed road retains its inner island and ends clip exactly to the landscape',()=>{
 const roads=[road('loop',[[-10,-10],[10,-10],[10,10],[-10,10],[-10,-10]]),road('edge',[[10,0],[35,0]])],g=roadNetworkGeometry(roads,1.35,{bounds:30}),mesh=new T.Mesh(g,new T.MeshBasicMaterial());mesh.updateMatrixWorld();
 assert.equal(hits(mesh,0,0).length,0);assert.equal(hits(mesh,29.9,.7).length,1);assert.equal(hits(mesh,30.1,.7).length,0);
 const p=g.getAttribute('position');for(let i=0;i<p.count;i++)assert.ok(Math.abs(p.getX(i))<=30&&Math.abs(p.getZ(i))<=30);
});
test('joined road ramps are tessellated against the actual height field',()=>{
 const height=(x:number,z:number)=>1.35+x*.05+Math.sin(z*.15),g=roadNetworkGeometry([road('ramp',[[-30,-20],[0,0],[30,20]])],height,{maxSegment:3}),mesh=new T.Mesh(g,new T.MeshBasicMaterial());mesh.updateMatrixWorld();
 for(let x=-25;x<=25;x+=2.5){const z=x*2/3,hit=hits(mesh,x+.03,z)[0];assert.ok(hit);assert.ok(Math.abs(hit.point.y-height(x+.03,z))<.035,'Ramp bridge mismatch');}
});

test('curved hill roads keep curbs outside asphalt and adapt to their vertical curvature',()=>{
 const roads=[road('hill',[[-24,0],[0,0],[24,0]]),road('join',[[0,0],[0,20]])],height=(x:number,z:number)=>1.35+7*Math.exp(-(x*x+z*z)/100);
 const asphalt=new T.Mesh(roadNetworkGeometry(roads,height,{maxSegment:12,maxHeightError:.01}),new T.MeshBasicMaterial());
 const curb=new T.Mesh(roadNetworkGeometry(roads,height,{padding:1.5,excludePadding:0,maxSegment:12,maxHeightError:.01}),new T.MeshBasicMaterial());
 asphalt.updateMatrixWorld();curb.updateMatrixWorld();
 for(let x=-23;x<24;x+=.8)for(const z of [-1.7,.3,1.7]){const hit=hits(asphalt,x,z)[0];assert.ok(hit);assert.ok(Math.abs(hit.point.y-height(x,z))<.025,'Hill interpolation exceeds clearance');assert.equal(hits(curb,x,z).length,0,'Pavement overlaps the asphalt');}
 for(const x of [-20,-12,12,20])assert.ok(hits(curb,x,2.4).length>0,'Missing outer curb');
});

test('adaptive hill triangles share every interior edge without T-junction cracks',()=>{
 const height=(x:number,z:number)=>1.35+8*Math.exp(-((x+13)**2+(z-1)**2)/45),g=roadNetworkGeometry([road('hill',[[-24,0],[24,0]])],height,{maxSegment:16,maxHeightError:.03}),p=g.getAttribute('position'),edges=new Map<string,{count:number;x:number;z:number}>();
 for(let i=0;i<p.count;i+=3)for(let j=0;j<3;j++){const a=i+j,b=i+(j+1)%3,ka=`${p.getX(a)},${p.getZ(a)}`,kb=`${p.getX(b)},${p.getZ(b)}`,key=ka<kb?`${ka}|${kb}`:`${kb}|${ka}`,edge=edges.get(key)??{count:0,x:(p.getX(a)+p.getX(b))/2,z:(p.getZ(a)+p.getZ(b))/2};edge.count++;edges.set(key,edge);}
 for(const edge of edges.values())if(Math.abs(edge.x)<23.99999&&Math.abs(edge.z)<1.99999)assert.equal(edge.count,2,`Open interior seam at ${edge.x},${edge.z}`);
});
