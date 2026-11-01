import {BALANCE} from '../data/balance.js';
import {spawnFly,updateFlies} from './flies.js';
/** Advance seeded resource arrivals; callers own pause/outcome gating. */
/** Seconds until the next fly. Days are fly-rich (like falling sun); nights rely on start silk and Spinners. */
export function flyInterval(world){const night=world.level.mode==='night',min=night?BALANCE.flyNightMin:BALANCE.flyMin,max=night?BALANCE.flyNightMax:BALANCE.flyMax;return min+world.random()*(max-min);}
export function updateEconomy(world,dt){world.nextFly-=dt;if(world.nextFly<=0){spawnFly(world);world.nextFly=flyInterval(world);}updateFlies(world,dt);}
