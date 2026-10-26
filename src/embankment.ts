import { BRIDGES, bank } from './layout.ts';
export function bankSections(opening:number) {
  const sections:[number,number][]=[];let start=-106;
  for(const z of BRIDGES){sections.push([start,z-opening]);start=z+opening;}
  sections.push([start,106]);return sections;
}
export function bankPath(side:number,margin:number,start:number,end:number,step=.5) {
  const count=Math.ceil((end-start)/step);
  return Array.from({length:count+1},(_,i)=>{const z=start+(end-start)*i/count;return {x:bank(z,side,margin),z};});
}
