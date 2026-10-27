import * as T from 'three';
import {Builder,vec} from '../../geometry.ts';
import {BRIDGE,bridgeX,bridgeHeight} from './plan.ts';
/** Road deck is supplied by the common road pass; this is the red steel structure. */
export function ponte25DeAbril(){
 const b=new Builder(),red='#a64f39',light='#ba664b',dark='#813f32',deck=BRIDGE.deck;
 for(const z of [BRIDGE.towerNorth,BRIDGE.towerSouth]){
  const x=bridgeX(z);for(const side of [-1,1]){b.box(x+side*3.55,-.7,z,2.1,1.4,3.1,'#b9b9a5');b.box(x+side*3.55,BRIDGE.top/2-.25,z,.8,BRIDGE.top+.5,1.05,red);b.box(x+side*3.55,BRIDGE.top+.12,z,1,.3,1.2,light);}
  for(const y of [3.6,8.5,17.7,24.6])b.box(x,y,z,7.8,.52,.85,red);
  for(const [a,c]of[[.3,3.3],[3.9,8.1],[11.2,17.3],[18.2,24.2]]as const){b.beam(vec(x-3.2,a,z),vec(x+3.2,c,z),.18,red,6);b.beam(vec(x+3.2,a,z),vec(x-3.2,c,z),.18,red,6);}
 }
 const cableHeight=(z:number)=>z<BRIDGE.towerNorth?deck+.6+(BRIDGE.top-deck-.6)*((z+50)/(BRIDGE.towerNorth+50))**.7:z>BRIDGE.towerSouth?deck+.6+(BRIDGE.top-deck-.6)*((48-z)/(48-BRIDGE.towerSouth))**.7:13.2+(BRIDGE.top-13.2)*((z-(BRIDGE.towerNorth+BRIDGE.towerSouth)/2)/((BRIDGE.towerSouth-BRIDGE.towerNorth)/2))**2;
 for(const side of [-1,1]){
  const cable=Array.from({length:99},(_,i)=>{const z=-50+i;return vec(bridgeX(z)+side*3.05,cableHeight(z),z);});b.tube(cable,.13,red,110);
  for(let z=-48;z<=47;z+=2){const x=bridgeX(z)+side*3.05;b.beam(vec(x,deck+.32,z),vec(x,cableHeight(z),z),.038,light,5);}
  for(let z=-77;z<90;z+=2){const end=Math.min(z+2,91),x=bridgeX(z)+side*2.77,xx=bridgeX(end)+side*2.77,y=bridgeHeight(z),yy=bridgeHeight(end);
   b.beam(vec(x,y-.27,z),vec(xx,yy-.27,end),.09,dark,5);b.beam(vec(x,y-1.3,z),vec(xx,yy-1.3,end),.09,dark,5);b.beam(vec(x,y-.27,z),vec(xx,yy-1.3,end),.048,red,5);b.beam(vec(x,y-1.3,z),vec(xx,yy-.27,end),.048,red,5);
   b.beam(vec(x,y+.1,z),vec(x,y+.7,z),.032,'#aa9583',5);b.beam(vec(x,y+.7,z),vec(xx,yy+.7,end),.035,'#ad9a85',5);
  }
 }
 for(let z=-73;z<88;z+=5){const y=bridgeHeight(z);b.beam(vec(bridgeX(z)-2.75,y-1.1,z),vec(bridgeX(z)+2.75,y-1.1,z),.07,dark,5);}
 for(const side of [-1,1])for(const rail of [-.35,.35]){const p=Array.from({length:84},(_,i)=>{const z=-77+i*2;return vec(bridgeX(z)+side*.95+rail,bridgeHeight(z)-.92,z);});b.tube(p,.035,'#6e736b',85);}
 for(const z of [-68,-56,57,69,81]){const y=bridgeHeight(z)-1.4;for(const side of [-1,1])b.box(bridgeX(z)+side*1.9,y/2,z,.55,y,1,'#c4c1af');}
 const root=b.finish();root.name='Ponte 25 de Abril · suspension cables, hangers, two-deck truss';return root;
}
