import {GRID,BALANCE,WAVES,OUTCOME} from '../data/balance.js';
import {SPIDERS} from '../data/spiders.js';
import {HUMANS,HUMAN_ATTACK} from '../data/humans.js';
import {mulberry32} from '../systems/rng.js';
import {center} from './grid.js';
import {createBoss,updateBoss} from '../systems/boss.js';
import {updateFlies} from '../systems/flies.js';
import {updateEconomy} from '../systems/economy.js';
import {generateWaves} from '../systems/waveGen.js';
import {WaveDirector} from '../systems/waves.js';
import {checkOutcome,updateTapes} from '../systems/outcome.js';
import {addEffect,updateEffects,spiderPoint} from '../systems/effects.js';
import {applyDamage,emit,KIND} from '../systems/damage.js';
import {createPool,compact} from '../core/pool.js';
const rowY=row=>GRID.y+(row+.5)*GRID.size;
/** Pooled projectiles: one fixed shape, every field reassigned on reuse. */
export const SHOT_POOL=createPool(()=>({uid:0,owner:0,row:0,x:0,from:0,kind:'',damage:0,slowFactor:0,slowDuration:0,dead:false}));
function shot(uid,p,from,d){const o=SHOT_POOL.acquire();o.uid=uid;o.owner=p.uid;o.row=p.row;o.x=from;o.from=from;o.kind=p.id;o.damage=d.damage;o.slowFactor=d.slowFactor||0;o.slowDuration=d.slowDuration||0;o.dead=false;return o;}
/** Stable unsigned FNV-1a hash of the level identifier. */
export function levelSeed(id){let hash=2166136261;for(const c of `level-${id}`)hash=Math.imul(hash^c.charCodeAt(0),16777619);return hash>>>0;}
/** Create an isolated world and consume a single seeded RNG for all randomness. */
export function createState(level,bus){const random=mulberry32(levelSeed(level.id)),waves=generateWaves(level,random,WAVES);return {level,random,time:0,silk:level.startSilk,grid:Array.from({length:GRID.rows},()=>Array(GRID.cols).fill(null)),spiders:[],humans:[],shots:[],flies:[],particles:[],nextFly:BALANCE.flyFirstMin+random()*(BALANCE.flyFirstMax-BALANCE.flyFirstMin),cooldowns:{},audioEvents:[],selected:null,paused:false,result:null,director:new WaveDirector(waves,bus,level.firstWave?{...WAVES,firstWaveDelay:level.firstWave}:WAVES),tapes:OUTCOME.lastDefense?level.lanes.map(row=>({row,x:OUTCOME.TAPE_X,status:'ready'})):[],boss:level.boss?createBoss():null,stats:{time:0,kills:0,silk:0,planted:0,tapes:0},events:[],step:0,uidSeq:0,lastKill:{x:BALANCE.rewardX,y:BALANCE.rewardY}};}
/** Plant exactly once only on an available active cell. */
export function place(s,row,col,id){const def=SPIDERS[id];if(s.paused||s.result||!def||!s.level.spiders.includes(id)||!s.level.lanes.includes(row)||!s.grid[row]||col<0||col>=GRID.cols||s.grid[row][col]||s.silk<def.cost||(s.cooldowns[id]||0)>0)return false;const spider={uid:++s.uidSeq,id,row,col,hp:def.hp,maxHp:def.hp,timer:def.initial??0,age:0,...center(row,col)};s.grid[row][col]=spider;s.spiders.push(spider);s.silk-=def.cost;s.cooldowns[id]=def.cooldown;s.stats.planted++;emit(s,{type:'plant',id,row,col,x:spider.x,y:spider.y});return true;}
/** Collect a live fly once, including during reward collection. */
export function catchFly(s,fly){if(s.paused||!fly||fly.life<=0||!s.flies.includes(fly))return false;s.flies.splice(s.flies.indexOf(fly),1);s.silk+=BALANCE.flyReward;s.stats.silk+=BALANCE.flyReward;s.audioEvents.push('catch');emit(s,{type:'catch',x:fly.x,y:fly.y,amount:BALANCE.flyReward});return true;}
/** Living human whose hurtbox the segment [a,b] crosses, nearest to the shooter. */
function firstHumanOn(s,row,a,b){let best=null;for(const h of s.humans){if(!(h.hp>0)||h.row!==row||h.sleeping)continue;const front=h.x+BALANCE.hurtFront-BALANCE.shotRadius,back=h.x+BALANCE.hurtBack+BALANCE.shotRadius;if(b>=front&&a<=back&&(!best||h.x<best.x))best=h;}return best;}
/** Shooters only open fire on humans that have entered the visible room ahead of them. */
export function shooterHasTarget(s,p){return s.humans.some(h=>h.hp>0&&!h.sleeping&&h.row===p.row&&h.x+BALANCE.hurtBack>p.x+20&&h.x+BALANCE.hurtFront<BALANCE.targetEdge)||(s.boss?.hp>0&&s.boss.x<BALANCE.targetEdge+200);}
/** Spider a walking human is blocked by (same rule drives the attack animation). */
export function blockerOf(s,h){return s.spiders.find(p=>p.hp>0&&p.row===h.row&&Math.abs(h.x-p.x)<BALANCE.attackReach)||null;}
/** Advance only reward-stage collectible flies; combat remains frozen. */
export function updateReward(s,dt){if(!s.paused){updateFlies(s,dt);for(const h of s.humans)if(h.sleeping)h.fallTime=(h.fallTime||0)+dt;}}
function spiders(s,dt){
 for(const p of s.spiders){if(p.hp<=0)continue;const d=SPIDERS[p.id];p.timer-=dt;p.age+=dt;
  if(d.production&&p.timer<=0){s.silk+=d.production;s.stats.silk+=d.production;p.timer+=d.period;p.producedAt=s.time;addEffect(s,{fx:'silk_ball_collect',...spiderPoint(p.id,p.x,p.y,'silk_spawn')});s.audioEvents.push('spinnerWeave');emit(s,{type:'produce',x:p.x,y:p.y,amount:d.production});}
  if(d.damage&&d.period&&p.timer<=0&&shooterHasTarget(s,p)){const from=spiderPoint(p.id,p.x,p.y,'spawn_projectile','attack').x;s.shots.push(shot(++s.uidSeq,p,from,d));p.timer=d.period;p.lastShot=s.time;s.audioEvents.push(p.id==='weaver'?'netthrowerAttack':'spitterAttack');emit(s,{type:'shoot',kind:p.id,x:from,y:p.y,row:p.row});}
  if(d.armTime&&p.age>=d.armTime){const targets=s.humans.filter(h=>h.hp>0&&!h.sleeping&&h.row===p.row&&Math.abs(h.x-p.x)<=d.range);if(targets.length){for(const h of targets)applyDamage(s,{source:p,sourceSide:'spider',target:h,targetSide:'human',kind:KIND.AOE,amount:d.damage,x:h.x+BALANCE.hurtFront,y:p.y});p.hp=0;p.exploded=true;addEffect(s,{spider:p.id,anim:'bite',from:4,x:p.x,y:p.y});s.audioEvents.push('karakurtAttack');emit(s,{type:'explode',x:p.x,y:p.y,row:p.row,targets:targets.length});}}
 }
}
function shots(s,dt){
 for(const shot of s.shots){const old=shot.x;shot.x+=BALANCE.projectileSpeed*GRID.size*dt;
  const hit=firstHumanOn(s,shot.row,old,shot.x),effects=shot.slowFactor?{slow:{factor:shot.slowFactor,duration:shot.slowDuration}}:undefined;
  if(hit){const x=Math.max(old,hit.x+BALANCE.hurtFront);applyDamage(s,{source:{uid:shot.uid},sourceSide:'spider',target:hit,targetSide:'human',kind:KIND.RANGED,amount:shot.damage,effects,x,y:rowY(shot.row)});addEffect(s,{fx:shot.slowFactor?'net_hit':'venom_splat',x,y:rowY(shot.row)+(shot.slowFactor?-6:4),size:shot.slowFactor?1.8:1.4});shot.dead=true;}
  else if(s.boss?.hp>0&&shot.x>=s.boss.x){applyDamage(s,{source:{uid:shot.uid},sourceSide:'spider',target:s.boss,targetSide:'boss',kind:KIND.RANGED,amount:shot.damage,x:s.boss.x,y:rowY(shot.row)});addEffect(s,{fx:shot.slowFactor?'net_hit':'venom_splat',x:s.boss.x,y:rowY(shot.row),size:1.6});shot.dead=true;}
 }
 if(s.shots.some(p=>p.dead||p.x>=BALANCE.shotLimit))compact(s.shots,p=>!p.dead&&p.x<BALANCE.shotLimit,SHOT_POOL);
}
/** Walk, or swing at the blocking spider: windup -> contact (damage) -> recover, on one clock with the attack sheet. */
function humans(s,dt){
 for(const h of s.humans){if(h.hp<=0||h.sleeping)continue;const d=HUMANS[h.type],slow=s.time<(h.slowUntil||0)?h.slowFactor:1,p=blockerOf(s,h);
  if(p){
   if(h.attackTarget!==p){h.attackTarget=p;h.attackT=0;h.swing=(h.swing||0);}
   const period=d.attackPeriod||1,before=h.attackT;h.attackT+=dt*slow;
   const contact=HUMAN_ATTACK.contact*period;
   if(before<contact&&h.attackT>=contact){h.swing++;const r=applyDamage(s,{source:h,sourceSide:'human',target:p,targetSide:'spider',kind:KIND.MELEE,amount:d.damage,key:'swing'+h.swing,x:p.x+30,y:p.y});if(r){s.audioEvents.push(p.id==='spitter'?'spitterHurt':p.id==='tarantula'?'tarantulaHurt':p.id==='karakurt'?'karakurtHurt':p.id==='weaver'?'netthrowerHurt':'spiderHurt');if(p.id==='tarantula')addEffect(s,{fx:'hairs_burst',...spiderPoint(p.id,p.x,p.y,'head')});}}
   if(h.attackT>=period)h.attackT-=period;
  }else{
   if(h.attackTarget){h.attackTarget=null;h.attackT=0;}
   h.x-=Math.max(0,d.speed*GRID.size*h.speedMul*slow)*dt;h.walkTime=(h.walkTime||0)+dt*h.speedMul*slow;
  }
 }
}
/** One fixed simulation step, with loss evaluated before victory. */
export function update(s,dt){
 if(s.paused||s.result)return;s.audioEvents.length=0;s.time+=dt;s.step=(s.step||0)+1;s.stats.time=s.time;
 for(const id in s.cooldowns)s.cooldowns[id]=Math.max(0,s.cooldowns[id]-dt);
 s.director.update(dt,s);
 for(const h of s.humans)if(!h.uid){h.uid=++s.uidSeq;h.maxHp=HUMANS[h.type]?.hp??h.hp;h.maxArmor=h.armor||0;}
 updateEconomy(s,dt);
 updateBoss(s,dt);
 spiders(s,dt);
 shots(s,dt);
 humans(s,dt);
 updateTapes(s,dt);
 for(const h of s.humans)if(h.hp<=0&&!h.sleeping&&!h.dead){h.dead=true;s.stats.kills++;s.lastKill={x:Math.max(GRID.x,Math.min(h.x,GRID.x+GRID.cols*GRID.size)),y:GRID.y+(h.row+.5)*GRID.size};emit(s,{type:'death',targetSide:'human',targetType:h.type,cause:h.killedBy||'melee',x:h.x+BALANCE.humanWidth/2,y:GRID.y+(h.row+1)*GRID.size,row:h.row});}
 for(const p of s.spiders)if(p.hp<=0){s.grid[p.row][p.col]=null;if(!p.exploded){addEffect(s,{spider:p.id,anim:'death',x:p.x,y:p.y});emit(s,{type:'death',targetSide:'spider',targetType:p.id,x:p.x,y:p.y,row:p.row});}}
 updateEffects(s);
 if(s.spiders.some(p=>p.hp<=0))s.spiders=s.spiders.filter(p=>p.hp>0);
 const outcome=checkOutcome(s);if(outcome!=='none'){s.result=outcome;if(outcome==='won'&&s.boss){s.lastKill={x:s.boss.x-BALANCE.humanWidth,y:GRID.y+(s.boss.row+.5)*GRID.size};for(const h of s.humans){h.sleeping=true;h.hp=0;}}}
 if(s.humans.some(h=>h.hp<=0&&!h.sleeping))s.humans=s.humans.filter(h=>h.hp>0||h.sleeping);
}
/** Remove a planted spider without a refund. */
export function removeSpider(s,row,col){if(s.paused||s.result)return false;const p=s.grid[row]?.[col];if(!p)return false;s.grid[row][col]=null;s.spiders=s.spiders.filter(x=>x!==p);addEffect(s,{fx:'dust_puff',x:p.x,y:p.y+20,size:1.6});emit(s,{type:'remove',id:p.id,x:p.x,y:p.y});return true;}
/** Release every entity and pool held by an unloaded level. */
export function disposeWorld(s){for(const key of ['spiders','humans','shots','flies','particles','tapes','events'])s[key].length=0;for(const row of s.grid)row.fill(null);s.director.pending.length=0;s.boss=null;s.audioEvents.length=0;s.selected=null;}
