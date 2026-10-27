import {WORLD_ID} from './worldLocation.ts';
import type {WorldPlan} from './worlds/types.ts';

// Only the selected branch is fetched/evaluated. Metadata never imports a plan.
const plans={london:()=>import('./worlds/london/plan.ts'),dubai:()=>import('./worlds/dubai/plan.ts'),agra:()=>import('./worlds/agra/plan.ts'),lisbon:()=>import('./worlds/lisbon/plan.ts'),bengaluru:()=>import('./worlds/bengaluru/plan.ts'),hyderabad:()=>import('./worlds/hyderabad/plan.ts'),moon:()=>import('./worlds/moon/plan.ts')};
export const ACTIVE_PLAN:WorldPlan=(await plans[WORLD_ID]()).PLAN;
