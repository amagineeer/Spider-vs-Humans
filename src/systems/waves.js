import {WAVES,GRID} from '../data/balance.js';
import {HUMANS} from '../data/humans.js';
/** Stateful scheduler; all clocks advance only through update(). */
export class WaveDirector {
 constructor(waves,bus,config=WAVES){this.waves=waves;this.bus=bus;this.B=config;this.index=-1;this.elapsed=0;this.phase='WAIT';this.phaseTime=0;this.pending=[];this.released=0;this.serial=0;this.lastSpeedMul=1;this.allReleased=false;}
 /** Current wave remaining health / original health. */
 hpRatio(world){const own=world.humans.filter(h=>h.wave===this.index&&h.hp>0);return this.startHp?own.reduce((n,h)=>n+h.hp+h.armor,0)/this.startHp:0;}
 /** Request a warning or begin the next normal wave. */
 request(world){if(this.index+1>=this.waves.length)return;const wave=this.waves[this.index+1];if(wave.big||wave.final){this.phase='WARNING';this.phaseTime=0;}else this.begin(world);}
 /** Start release of the next wave. */
 begin(world){const wave=this.waves[++this.index];this.phase='RELEASE';this.phaseTime=0;this.waveStart=this.elapsed;this.startHp=wave.units.reduce((n,u)=>n+HUMANS[u.type].hp+(HUMANS[u.type].armor||0),0);this.pending.push(...wave.units.map(u=>({...u,wave:this.index,due:this.elapsed+u.delay})));this.pending.sort((a,b)=>a.due-b.due||a.wave-b.wave);this.bus?.emit('wave:start',{index:this.index,total:this.waves.length,big:wave.big,final:wave.final});}
 /** Advance warnings, wave clock and spawn backlog without discarding delays. */
 update(dt,world){
  if(world.paused||world.result)return;
  this.elapsed+=dt;this.phaseTime+=dt;
  if(this.phase==='WAIT'&&this.elapsed+Number.EPSILON>=this.B.firstWaveDelay)this.request(world);
  else if(this.phase==='RELEASE'&&this.index+1<this.waves.length){const age=this.elapsed-this.waveStart,done=!this.pending.some(u=>u.wave===this.index);if(age>=this.B.waveDuration||(done&&age>=this.B.minGap&&this.hpRatio(world)<=this.B.earlyNextHpRatio))this.request(world);}
  else if(this.phase==='WARNING'&&(!world.humans.some(h=>h.hp>0)||this.phaseTime>=this.B.bigWaveMaxWait)){this.phase='BIG_BANNER';this.phaseTime=0;this.bus?.emit('wave:big',{index:this.index+1});}
  else if(this.phase==='BIG_BANNER'&&this.phaseTime>=this.B.bigWaveWarn){if(this.waves[this.index+1].final){this.phase='FINAL_BANNER';this.phaseTime=0;this.bus?.emit('wave:final',{index:this.index+1});}else this.begin(world);}
  else if(this.phase==='FINAL_BANNER'&&this.phaseTime>=this.B.bigWaveWarn)this.begin(world);
  while(this.pending.length&&this.pending[0].due<=this.elapsed){
   if(world.humans.filter(h=>h.hp>0).length>=this.B.maxAlive)break;
   const u=this.pending.shift(),def=HUMANS[u.type];
   world.humans.push({id:++this.serial,type:u.type,row:u.lane,lane:u.lane,x:this.B.spawnX+world.random()*this.B.spawnJitter,y:GRID.y+(u.lane+.5)*GRID.size,hp:def.hp,armor:def.armor||0,speedMul:u.speedMul,isFlag:u.isFlag,wave:u.wave,born:world.time,walkTime:0});this.lastSpeedMul=u.speedMul;this.released++;
  }
  if(!this.allReleased&&this.index===this.waves.length-1&&!this.pending.length){this.allReleased=true;this.phase='CLEANUP';this.bus?.emit('wave:allReleased');}
 }
 /** Fraction of all waves released, including partial current release. */
 getProgress(){if(this.allReleased)return 1;if(this.index<0)return 0;const n=this.waves[this.index].units.length,remaining=this.pending.filter(u=>u.wave===this.index).length;return (this.index+(n-remaining)/Math.max(1,n))/this.waves.length;}
 /** Debug-only deterministic seek to a wave (zero based). */
 seek(index,world){this.pending.length=0;world.humans.length=0;this.index=Math.max(0,Math.min(this.waves.length-1,index))-1;this.allReleased=false;this.begin(world);}
}
/** Compatibility adapter used by existing audio playback. */
export function waveWarning(s){return !s.result&&['WARNING','BIG_BANNER','FINAL_BANNER'].includes(s.director?.phase);}
