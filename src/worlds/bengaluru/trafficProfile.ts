import type {VehicleType} from '../../roadVehicles.ts';

// Keep the original mixed fleet, then add mostly white cabs and autos, with
// plenty of two-wheelers and just two city buses in each direction.
const original:VehicleType[]=['van','car','car','van','bike','motorbike','truck','car','van','car','car','van'];
const local:VehicleType[]=['dzire','auto','motorbike','dzire','auto','bike','dzire','auto','motorbike','dzire','auto','dzire','auto','motorbike','dzire','auto','bike','dzire','auto','motorbike'];
export const BENGALURU_FLEET:readonly VehicleType[]=[...original,...Array.from({length:60},(_,i)=>i===0||i===30?'citybus':local[i%local.length]),'electric-auto','electric-auto'];
export const BENGALURU_NIGHT_DENSITY=.28;
