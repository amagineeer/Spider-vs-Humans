import {GRID,OUTCOME,BALANCE} from '../data/balance.js';
import {applyDamage,emit,KIND} from './damage.js';
/** Pure outcome query. A breach always takes precedence over victory. */
export function checkOutcome(world){
 if(world.humans.some(h=>h.hp>0&&h.x<=OUTCOME.LOSE_X))return 'lost';
 if(world.level.boss)return world.boss&&world.boss.hp<=0?'won':'none';
 return world.director.allReleased&&!world.director.pending.length&&!world.humans.some(h=>h.hp>0)?'won':'none';
}
/** Move/trigger each single-use tape; bosses are never targets. */
export function updateTapes(world,dt){
 for(const tape of world.tapes){
  if(tape.status==='ready'&&world.humans.some(h=>h.hp>0&&h.row===tape.row&&h.x<=OUTCOME.TAPE_X)){tape.status='rolling';world.stats.tapes++;emit(world,{type:'tape',row:tape.row,x:tape.x,y:GRID.y+(tape.row+.5)*GRID.size});}
  if(tape.status!=='rolling')continue;
  const old=tape.x;tape.x+=OUTCOME.tapeSpeed*GRID.size*dt;
  for(const h of world.humans)if(h.hp>0&&h.row===tape.row&&h.x<=tape.x+BALANCE.humanWidth&&h.x+BALANCE.humanWidth>=old){h.killedByTape=true;applyDamage(world,{source:tape,sourceSide:'tape',target:h,targetSide:'human',kind:KIND.CRUSH,amount:h.hp+1,x:h.x+BALANCE.hurtFront,y:GRID.y+(h.row+.5)*GRID.size});h.hp=0;}
  if(tape.x>BALANCE.worldWidth)tape.status='spent';
 }
}
