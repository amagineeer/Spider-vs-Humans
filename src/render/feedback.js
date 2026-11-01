// Presentation-only consumer of the simulation event queue (s.events, see systems/damage.js).
// Turns hits, deaths and explosions into sound, hitstop and screen shake. Never mutates gameplay state
// except draining the presentation queue it owns.
export const FEEDBACK={
 hitstop:{kill:2,armorBreak:3,explode:4,boss:2},  // frames at 60 Hz the simulation is held
 hitstopCooldown:.25,                              // seconds between two hitstops
 shake:{explode:9,armorBreak:3,tape:5,spiderDeath:2,bossHit:2},  // px on the 1600x900 canvas
 shakeDecay:.22,                                   // seconds for a shake to fade out
 maxShake:12,
 // pitch of hit / knock-down sounds per human type: light and fast voices higher, heavy ones lower
 voice:{basic:1,runner:1.3,armored:.82,sprayer:1.14,sweeper:.9,agent:1.22},
};
export function createFeedback({audio,settings=()=>({shake:true,flashes:true})}){
 let hold=0,cooldown=0,shake=0,shakeTime=0,phase=0;
 const freeze=frames=>{if(cooldown>0)return;hold=Math.max(hold,frames/60);cooldown=FEEDBACK.hitstopCooldown;};
 const kick=px=>{if(!settings().shake)return;shake=Math.min(FEEDBACK.maxShake,Math.max(shake*(1-shakeTime/FEEDBACK.shakeDecay),0)+px);shakeTime=0;};
 const sfx=(name,gap,pitch=1)=>audio?.synth?.(name,gap,pitch);
 function handle(e){
  switch(e.type){
   case 'hit':
    if(e.targetSide==='human'){
     const voice=FEEDBACK.voice[e.targetType]??1;
     if(e.killed){sfx('humanDown',.06,voice);freeze(FEEDBACK.hitstop.kill);}
     else if(e.armorBroken){sfx('armorBreak',.05);freeze(FEEDBACK.hitstop.armorBreak);kick(FEEDBACK.shake.armorBreak);}
     else if(e.absorbed>0&&e.dealt<=0)sfx('hitArmor',.07);
     else sfx('hitFlesh',.06,voice);
    }else if(e.targetSide==='boss'){sfx('hitBoss',.09);if(e.killed){freeze(6);kick(10);}}
    else if(e.targetSide==='spider'&&e.sourceSide==='boss')kick(FEEDBACK.shake.bossHit);
    break;
   case 'death':if(e.targetSide==='spider'){sfx('spiderDeath',.08);kick(FEEDBACK.shake.spiderDeath);}break;
   case 'explode':sfx('explode',.1);freeze(FEEDBACK.hitstop.explode);kick(FEEDBACK.shake.explode);break;
   case 'plant':sfx('plant',.04);break;
   case 'tape':sfx('tape',.2);kick(FEEDBACK.shake.tape);break;
   case 'remove':sfx('click',.05);break;
  }
 }
 return {
  /** Drain the presentation queue of a world. */
  consume(s){if(!s?.events?.length)return;const list=s.events.splice(0);for(const e of list)handle(e);},
  /** True while the simulation should be held for hitstop; call once per fixed step with its dt. */
  holding(dt){if(cooldown>0)cooldown-=dt;if(hold>0){hold-=dt;return true;}return false;},
  /** Advance real-time effects; returns the current shake offset in canvas pixels. */
  update(dt){shakeTime+=dt;phase+=dt;const k=Math.max(0,1-shakeTime/FEEDBACK.shakeDecay);const a=shake*k*k;if(a<.05){shake=0;return {x:0,y:0};}return {x:Math.sin(phase*91)*a,y:Math.cos(phase*73)*a*.6};},
  reset(){hold=0;cooldown=0;shake=0;shakeTime=0;},
 };
}
