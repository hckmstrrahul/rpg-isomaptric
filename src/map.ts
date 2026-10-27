import {ACTIVE_PLAN} from './worldPlan.ts';
import { LANDMARKS, resolveTeleport, type Obstacle } from './layout.ts';
import type { Destructible } from './sandbox.ts';
import { ROAD_COLOR, ROAD_NIGHT_COLOR } from './roadSurfaces.ts';

export class CityMap {
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
  size = 240;
  full: boolean;
  night=false;
  obstacles: Obstacle[];
  roads: { points: {x: number; z: number}[]; width: number }[];
  objects: Destructible[];
  teleportPreview: { x: number; z: number } | null = null;
  constructor(canvas: HTMLCanvasElement, obstacles: Obstacle[], roads: {points:{x:number;z:number}[];width:number}[], full=false, objects:Destructible[]=[]) {
    this.canvas=canvas;this.context=canvas.getContext('2d')!;this.obstacles=obstacles;this.roads=roads;this.full=full;this.objects=objects;
  }
  toWorld(clientX:number,clientY:number) {
    const r=this.canvas.getBoundingClientRect();
    const extent=ACTIVE_PLAN.londonRiver&&this.full?236:ACTIVE_PLAN.map.extent;
    return {x:((clientX-r.left)/r.width-.5)*extent,z:((clientY-r.top)/r.height-.5)*extent};
  }
  draw(px:number,pz:number,heading:number,visited:Set<string>) {
    const dpr=Math.min(devicePixelRatio,2),rect=this.canvas.getBoundingClientRect();
    if(!rect.width||!rect.height)return;
    const size=rect.width;
    if(this.canvas.width!==Math.round(size*dpr)){this.canvas.width=Math.round(size*dpr);this.canvas.height=Math.round(size*dpr);}
    const ctx=this.context;ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,size,size);
    const extent=ACTIVE_PLAN.londonRiver&&this.full?236:ACTIVE_PLAN.map.extent,k=size/extent,map=(v:number)=>(v+extent/2)*k;
    const palette=this.night?{
      background:'#222a30',land:'#394541',water:'#354852',bank:'#65716f',road:ROAD_NIGHT_COLOR,building:'#879195',tree:'#465a4b',path:'#778070',
    }:{background:this.full?'#e7eadc':'#e6e9d9',land:'#c4d0a6',water:'#56aeb1',bank:'#f2e9cf',road:ROAD_COLOR,building:'#a6ac98',tree:'#95ad7c',path:'#eae3c5'};
    if(ACTIVE_PLAN.moonVisible===false){palette.land=this.night?'#303c48':'#b4bec6';palette.background=this.night?'#202a35':'#c6cfd4';palette.bank=palette.land;palette.tree=this.night?'#749a9b':'#91aaaa';palette.building=this.night?'#849da9':'#7a929f';palette.road=this.night?'#5b7b8d':'#778e9c';}
    if(this.full){ctx.fillStyle=palette.background;ctx.fillRect(0,0,size,size);}
    const polygon=(points:{x:number;z:number}[],color:string)=>{
      ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(map(p.x),map(p.z)):ctx.moveTo(map(p.x),map(p.z)));ctx.closePath();ctx.fillStyle=color;ctx.fill();
    };
    ctx.fillStyle=ACTIVE_PLAN.waterVisible===false||ACTIVE_PLAN.londonRiver?palette.background:palette.water;ctx.fillRect(0,0,size,size);
    for(const land of ACTIVE_PLAN.map.land)polygon(land,palette.land);
    for(const water of ACTIVE_PLAN.map.water??[])polygon(water,palette.water);
    if(ACTIVE_PLAN.map.craters){
      // The same crater coordinates drive the terrain and this quiet relief map.
      ctx.save();
      for(const crater of ACTIVE_PLAN.map.craters){
        const x=map(crater.x),z=map(crater.z),r=crater.r*k;
        const shade=ctx.createRadialGradient(x+r*.15,z+r*.16,r*.08,x,z,r*1.22);
        shade.addColorStop(0,this.night?'#07111d55':'#3b4f6133');shade.addColorStop(.72,this.night?'#101b2638':'#52657526');shade.addColorStop(1,'#596b7c00');
        ctx.fillStyle=shade;ctx.beginPath();ctx.arc(x,z,r*1.22,0,Math.PI*2);ctx.fill();
        ctx.lineWidth=Math.max(.65,r*.07);ctx.strokeStyle=this.night?'#a9c8d43a':'#f0f7fa60';ctx.beginPath();ctx.arc(x,z,r,Math.PI*.88,Math.PI*1.91);ctx.stroke();
        ctx.lineWidth=.6;ctx.strokeStyle=this.night?'#14233155':'#5d718e33';ctx.beginPath();ctx.arc(x,z,r*.83,Math.PI*.02,Math.PI*.83);ctx.stroke();
      }
      ctx.restore();
    }
    // Road fills only: borders belong to the 3D scene. Square caps retain the
    // continuous corner joins without outlining each block on this small map.
    ctx.save();ctx.lineCap='square';
    for(const road of this.roads){
      ctx.beginPath();road.points.forEach((p,i)=>i===0?ctx.moveTo(map(p.x),map(p.z)):ctx.lineTo(map(p.x),map(p.z)));
      ctx.strokeStyle=palette.road;ctx.lineWidth=road.width*k;ctx.stroke();
    }
    ctx.restore();
    ctx.fillStyle=palette.building;
    for(const b of this.obstacles) {if(b.w<1&&b.d<1)continue;ctx.fillRect(map(b.x-b.w/2)+.5,map(b.z-b.d/2)+.5,Math.max(.5,b.w*k-1),Math.max(.5,b.d*k-1));}
    for(const tree of this.objects) {
      if(tree.kind!=='tree'||tree.destroyed||(!this.full&&!tree.planted))continue;
      ctx.fillStyle=tree.planted?'#4c8051':palette.tree;ctx.beginPath();ctx.arc(map(tree.x),map(tree.z),tree.planted?Math.max(2,1.2*k):Math.max(.5,.9*k),0,Math.PI*2);ctx.fill();
    }
    ctx.strokeStyle=palette.path;ctx.lineWidth=k;
    for(const p of ACTIVE_PLAN.map.gardens)for(const scale of [.33,.66,.95]){ctx.beginPath();ctx.arc(map(p.x),map(p.z),p.r*scale*k,0,Math.PI*2);ctx.stroke();}
    if(this.full) {
      LANDMARKS.forEach((l,i)=>{
        const x=map(l.x),z=map(l.z);
        const cleared=this.objects.some(o=>o.landmarkId===l.id&&o.destroyed);
        ctx.fillStyle=cleared?'#ae9372':visited.has(l.id)?'#506f53':'#284f48';ctx.beginPath();ctx.arc(x,z,10,0,Math.PI*2);ctx.fill();
        ctx.strokeStyle='#f1ebd6';ctx.lineWidth=2;ctx.stroke();
        ctx.fillStyle='#fff8e6';ctx.font='600 10px "Inter Variable", Inter, sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(cleared?'×':`${i+1}`,x,z+.5);
      });
    }
    // Heading wedge and high-contrast explorer dot, kept readable at any display size.
    ctx.save();ctx.translate(map(px),map(pz));ctx.rotate(-heading);
    ctx.fillStyle='#cf633e33';ctx.beginPath();ctx.moveTo(0,0);ctx.arc(0,0,this.full?21:13,-Math.PI*.15,Math.PI*1.15);ctx.closePath();ctx.fill();ctx.restore();
    ctx.beginPath();ctx.arc(map(px),map(pz),this.full?6:4.5,0,Math.PI*2);ctx.fillStyle='#d3613d';ctx.fill();ctx.strokeStyle='#fff9e6';ctx.lineWidth=2;ctx.stroke();
    if(this.full&&this.teleportPreview) {
      const p=this.teleportPreview,valid=resolveTeleport(p.x,p.z,this.obstacles).valid,x=map(p.x),z=map(p.z);
      ctx.save();ctx.strokeStyle=valid?'#367b51':'#b55342';ctx.fillStyle=valid?'#5e9f6d33':'#bc6c5133';ctx.lineWidth=2;
      ctx.beginPath();ctx.arc(x,z,11,0,Math.PI*2);ctx.fill();ctx.stroke();
      ctx.beginPath();
      if(valid){ctx.moveTo(x-5,z);ctx.lineTo(x-1,z+4);ctx.lineTo(x+6,z-5);}
      else{ctx.moveTo(x-4,z-4);ctx.lineTo(x+4,z+4);ctx.moveTo(x+4,z-4);ctx.lineTo(x-4,z+4);}
      ctx.stroke();ctx.restore();
    }
    if(this.full) {ctx.font='500 11px "Inter Variable", Inter, sans-serif';ctx.textAlign='left';ctx.fillStyle='#6a7864';ctx.fillText('N',map(-105),map(-103));}
  }
}
