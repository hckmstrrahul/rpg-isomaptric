import type {Landmark} from '../layout.ts';
import type {Road,PlanPoint} from '../cityPlan.ts';

/** One selected chapter's spatial data. Type-only imports keep this boundary inert. */
export type WorldPlan={
  spawn:PlanPoint;
  landmarks:Landmark[];
  roads:()=>Road[];
  /** True only for actual dry ground; margin reserves the bank/coast edge. */
  landAt:(x:number,z:number,margin?:number)=>boolean;
  bridgeAt:(x:number,z:number)=>boolean;
  /** Absolute walkable surface elevation, including hills and bridge ramps. */
  heightAt:(x:number,z:number)=>number;
  map:{extent:number;land:PlanPoint[][];water?:PlanPoint[][];gardens:{x:number;z:number;r:number}[];craters?:{x:number;z:number;r:number;depth:number}[]};
  camera:{focus:[number,number,number];zoom:number;offset?:[number,number,number]};
  waterColor:string;
  /** The lunar bonus has no terrestrial water or lunar sky object. */
  waterVisible?:boolean;
  moonVisible?:boolean;
  circularSites?:{id:string;x:number;z:number;r:number}[];
  flowerBeds?:PlanPoint[];
  /** Compatibility data used only by London's existing geometry helpers. */
  londonRiver?:{end:number;bridges:number[];center:(z:number)=>number;width:(z:number)=>number};
};
