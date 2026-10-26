import * as T from 'three';
import { Builder } from './geometry.ts';
import { registerThemeColor } from './lighting.ts';
export const ROAD_COLOR='#7e8d96';
export const ROAD_NIGHT_COLOR='#505d66';
export const ROAD_BORDER_COLOR='#605341';
export const ROAD_BORDER_NIGHT_COLOR='#717570';
export const ROAD_ASPHALT=registerThemeColor(new T.MeshStandardMaterial({roughness:.94}),ROAD_COLOR,ROAD_NIGHT_COLOR);
ROAD_ASPHALT.name='City asphalt';
export function createRoadBorder(source?:T.MeshStandardMaterial) {
  const mat=source?.clone()??new T.MeshStandardMaterial({roughness:1});
  // Preserve concrete relief without multiplying the theme color by dark albedo.
  mat.map=null;mat.name='City road borders';
  return registerThemeColor(mat,ROAD_BORDER_COLOR,ROAD_BORDER_NIGHT_COLOR);
}
export const ROAD_BORDER=createRoadBorder();
export const ROAD_PAINT=registerThemeColor(new T.MeshStandardMaterial({roughness:.95,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1}),'#dedbc5','#cbd0cf');
ROAD_PAINT.name='Road paint · no cast shadows';ROAD_PAINT.userData.noShadow=true;
export function roadDash(b:Builder,x:number,y:number,z:number,width:number,length:number,yaw=0) {
  const geo=new T.PlaneGeometry(width,length);geo.rotateX(-Math.PI/2);b.add(geo,ROAD_PAINT,x,y,z,1,1,1,0,yaw);geo.dispose();
}
