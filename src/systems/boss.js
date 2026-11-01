import {BALANCE,BOSS_ANIMATION as A,GRID,WAVES} from '../data/balance.js';
import {HUMANS} from '../data/humans.js';
import {applyDamage,KIND} from './damage.js';
/** Create all animation and combat clocks afresh for the final level. */
export function createBoss(){return {hp:HUMANS.boss.hp,x:A.entryX,row:BALANCE.bossRow,timer:HUMANS.boss.firstSummon??HUMANS.boss.summonPeriod,age:0,distance:0,phase:'entering',combatTime:null,hits:0,target:null,lastImpact:null};}
/** Advance the supplied rig and apply each contact exactly once to its live target. */
export function updateBoss(s,dt){
 const b=s.boss;if(!b||b.hp<=0)return;
 b.age+=dt;
 b.timer-=dt;
 if(b.timer<=0){b.timer+=HUMANS.boss.summonPeriod;for(let i=0;i<HUMANS.boss.summonCount;i++){
  if(s.humans.filter(h=>h.hp>0).length>=WAVES.maxAlive)break;
  const row=s.level.lanes[Math.floor(s.random()*s.level.lanes.length)],d=HUMANS.agent;
  s.humans.push({type:'agent',row,lane:row,x:b.x,hp:d.hp,armor:0,speedMul:1,walkTime:0,born:s.time,wave:-1});
 }}
 if(b.phase==='entering'){
  const distance=Math.min(b.x-BALANCE.bossX,A.walkSpeed*dt);b.x-=distance;b.distance+=distance;
  if(b.x<=BALANCE.bossX){b.x=BALANCE.bossX;b.phase='idle';}return;
 }
 // Choose the rightmost defender within reach (columns >= reachCol); keep it locked for the complete four-arm cycle.
 if(!b.target||b.target.hp<=0||!s.spiders.includes(b.target)){
  b.target=s.spiders.filter(p=>p.hp>0&&p.col>=A.reachCol).sort((a,c)=>c.x-a.x||a.row-c.row)[0]||null;
  b.combatTime=b.target?0:null;b.hits=0;
 }
 if(!b.target){b.phase='idle';return;}
 b.phase='attacking';b.combatTime+=dt;
 const first=A.attack.windup+A.attack.strike;
 while(b.combatTime+1e-9>=first+b.hits*A.attack.interval&&b.target.hp>0){
  applyDamage(s,{source:b,sourceSide:'boss',target:b.target,targetSide:'spider',kind:KIND.MELEE,amount:HUMANS.boss.damage,key:'arm'+b.hits,x:b.target.x+30,y:b.target.y});
  b.lastImpact={x:b.target.x,y:b.target.y,time:b.age,damage:HUMANS.boss.damage,arm:[0,2,1,3][b.hits%4]};
  b.hits++;s.audioEvents.push(b.target.id==='spitter'?'spitterHurt':'spiderHurt');
 }
}
