import {LEVELS,LEVEL_COUNT} from '../data/levels.js';
import {FLOW,OUTCOME,GRID} from '../data/balance.js';
import {createState,disposeWorld,update,updateReward} from '../game/state.js';
import {recordWin} from '../storage/save.js';
/** Single owner of level lifetime; adapters isolate browser resources from core. */
export class LevelManager {
 constructor({bus,machine,save,persist=()=>{},assets=async()=>{},cleanup=()=>{},resetClock=()=>{},debug=false}){Object.assign(this,{bus,machine,save,persist,assets,cleanup,resetClock,debug});this.world=null;this.scope=null;this.current=null;this.attempt=0;this.localAttempts={};this.timer=0;this.stage='';this.token=0;}
 /** Validate access and begin simulation-timed fade-out. */
 load(id){const level=LEVELS.find(l=>l.id===Number(id));if(!level||(!this.debug&&level.id>this.save.unlocked))return false;if(!this.machine.go('LOADING',{id:level.id}))return false;this.target=level;this.stage='out';this.timer=0;this.token++;return true;}
 /** Dispose the previous level and all its owned resources. */
 unload(){this.token++;this.resetClock();this.scope?.dispose();this.scope=null;if(this.world)disposeWorld(this.world);this.world=null;this.cleanup();this.bus.emit('level:unloaded');}
 /** Recreate the same seed and advance local attempt number. */
 restart(){return this.current?this.load(this.current):false;}
 /** Advance; the boss level leads to the finale, the last (bonus) level back to the menu. */
 next(){const level=LEVELS.find(l=>l.id===this.current);if(level?.boss){this.unload();this.stage='';return this.machine.go('FINALE');}if(!level||level.id>=LEVEL_COUNT){this.exitToMenu();return true;}return this.load(this.current+1);}
 /** Leaving never records a defeat. */
 exitToMenu(){this.unload();this.stage='';this.machine.go('MENU');}
 /** Dismiss an enemy introduction card. */
 acceptEnemy(){if(!this.enemyCard)return;const id=this.enemyCard;this.enemyCard=null;if(!this.save.seenEnemies.includes(id))this.save.seenEnemies.push(id);this.persist(this.save);}
 /** Collect once, then delay results until the reward flash completes. */
 collectReward(){if(this.machine.current!=='WIN_REWARD'||this.rewardCollected)return false;this.rewardCollected=true;if(this.world.level.reward.kind==='silk')this.world.silk+=this.world.level.reward.amount;this.timer=0;this.bus.emit('reward:collected');return true;}
 /** Pause both combat and intro time. */
 pause(){if(!['PLAYING','INTRO'].includes(this.machine.current))return;this.resumeState=this.machine.current;this.world.paused=true;this.machine.go('PAUSED');this.resetClock();}
 /** Resume without catching up hidden time. */
 resume(){if(this.machine.current!=='PAUSED')return;this.world.paused=false;this.machine.go(this.resumeState||'PLAYING');this.resetClock();}
 /** Advance level transitions and gameplay in fixed simulation steps. */
 update(dt){
  const state=this.machine.current;
  if(state==='LOADING'){
   if(this.stage==='assets')return;this.timer+=dt;if(this.timer<FLOW.fade)return;
   if(this.stage==='out'){
    const level=this.target;this.unload();const token=this.token;this.stage='assets';
    Promise.resolve().then(()=>this.assets(level)).then(()=>{if(token!==this.token)return;this.current=level.id;this.attempt=Math.max(this.localAttempts[level.id]||0,this.save.attempts[level.id]||0)+1;this.localAttempts[level.id]=this.attempt;this.world=createState(level,this.bus);this.scope=this.bus.scope();this.scope.on('world:command',fn=>fn(this.world));this.stage='in';this.timer=0;this.introWord=null;this.bus.emit('level:loaded',this.world);}).catch(error=>{if(token!==this.token)return;this.bus.emit('level:error',String(error));this.exitToMenu();});
   }else if(this.stage==='in'){this.timer=0;this.enemyCard=this.world.level.intro?.newEnemy;if(this.save.seenEnemies.includes(this.enemyCard))this.enemyCard=null;this.machine.go('INTRO');}
   return;
  }
  if(!this.world)return;
  if(state==='INTRO'){if(this.enemyCard)return;this.timer+=dt;const words=['Готовься…','Ставь…','Плети!'];const word=words[Math.floor(this.timer/FLOW.introWord)];if(word!==this.introWord){this.introWord=word;this.bus.emit('intro:word',word);}if(this.timer>=FLOW.introWord*words.length){this.timer=0;this.machine.go('PLAYING');}return;}
  if(state==='PLAYING'){
   update(this.world,dt);if(!this.world.result)return;
   this.timer=0;
   if(this.world.result==='lost'){this.breacher=this.world.humans.find(h=>h.hp>0&&h.x<=OUTCOME.LOSE_X);this.save.attempts[this.current]=(this.save.attempts[this.current]||0)+1;this.persist(this.save);this.machine.go('LOSING');}
   else{this.rewardCollected=false;this.reward={...this.world.lastKill,kind:this.world.level.reward.kind};this.machine.go('WIN_REWARD');}return;
  }
  if(state==='LOSING'){this.timer+=dt;if(this.timer<=OUTCOME.loseWalk&&this.breacher)this.breacher.x-=dt*GRID.size;if(this.timer>=OUTCOME.loseWalk+OUTCOME.shake+OUTCOME.fade)this.machine.go('RESULTS_LOSE');}
  if(state==='WIN_REWARD'){this.timer+=dt;updateReward(this.world,dt);if(!this.rewardCollected&&this.timer>=OUTCOME.rewardAutoCollect)this.collectReward();else if(this.rewardCollected&&this.timer>=OUTCOME.rewardFlash){recordWin(this.save,this.world.level,this.world.stats);this.persist(this.save);this.machine.go('RESULTS_WIN');}}
 }
}
