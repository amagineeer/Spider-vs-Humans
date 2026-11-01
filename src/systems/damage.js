// Single entry point for every hit in the game (spiders, humans, boss, tapes).
// Simulation-only: deterministic, no RNG, no DOM. Presentation reads `s.events`.
export const KIND={MELEE:'melee',RANGED:'ranged',AOE:'aoe',DOT:'dot',CRUSH:'crush'};
const MAX_EVENTS=512;
/** Queue a presentation event (sounds, shake, hitstop, floating feedback). Never read back by the simulation. */
export function emit(s,event){if(!s.events)s.events=[];s.events.push({time:s.time,...event});if(s.events.length>MAX_EVENTS)s.events.splice(0,s.events.length-MAX_EVENTS);return event;}
/**
 * Apply one hit. `hit` = {source, sourceSide:'spider'|'human'|'boss'|'tape', target, targetSide:'spider'|'human'|'boss',
 *   kind: KIND.*, amount, key?: dedupe key, effects?: {slow:{factor,duration}}, x?, y?}.
 * Armour (humans) absorbs first; overflow carries to health. The same source+key can hit a target once per step.
 * Returns {dealt, absorbed, armorBroken, killed} or null when ignored (dead target, duplicate, zero amount).
 */
export function applyDamage(s,hit){
 const t=hit.target;if(!t||!(t.hp>0)||!(hit.amount>0))return null;
 const step=s.step||0,key=`${hit.key??hit.kind}:${hit.source?.uid??hit.sourceSide??'?'}`;
 if(t._hitStep!==step){t._hitStep=step;t._hitKeys=new Set();}
 if(t._hitKeys.has(key))return null;t._hitKeys.add(key);
 let amount=hit.amount,absorbed=0,armorBroken=false;
 if(hit.kind!==KIND.CRUSH&&(t.armor||0)>0){absorbed=Math.min(t.armor,amount);t.armor-=absorbed;amount-=absorbed;if(t.armor<=1e-9){t.armor=0;armorBroken=true;}}
 t.hp-=amount;
 const killed=t.hp<=0;
 const slow=hit.effects?.slow;if(slow&&!killed){t.slowFactor=Math.min(slow.factor,s.time<(t.slowUntil||0)?t.slowFactor??1:1);t.slowUntil=Math.max(t.slowUntil||0,s.time+slow.duration);}
 t.hitAt=s.time;t.lastHit={kind:hit.kind,amount:hit.amount,absorbed,side:hit.sourceSide};
 if(killed){t.killedBy=hit.kind;t.deathAt=s.time;}
 emit(s,{type:'hit',kind:hit.kind,sourceSide:hit.sourceSide,targetSide:hit.targetSide,targetType:t.type||t.id,amount:hit.amount,dealt:amount,absorbed,armorBroken,killed,x:hit.x??t.x,y:hit.y??t.y,row:t.row,slow:!!slow});
 return {dealt:amount,absorbed,armorBroken,killed};
}
