import {BOSS_ANIMATION as A,GRID} from '../data/balance.js';
import {HUMANS} from '../data/humans.js';
import {drawBoss} from '../../assets/_gen/boss/rig.js';
/** Draw the supplied boss choreography using simulation clocks, without mutating the world. */
export function drawGameBoss(ctx,s,images){
 const b=s.boss;if(!b||b.hp<=0)return;
 const y=GRID.y+(b.row+1)*GRID.size,target=b.target;
 if(images.bossPortrait&&images.bossScreen){
  drawBoss(ctx,{portrait:images.bossPortrait,screen:images.bossScreen},{
   x:b.x,y,scale:A.scale,time:b.age,walking:b.phase==='entering',
   walkPhase:b.distance/A.stride,drinkTime:b.phase==='entering'?b.age:-1,
   combatTime:b.phase==='attacking'?b.combatTime:null,
   target:target?{x:(target.x+A.targetOffsetX-b.x)/A.scale,y:(target.y+A.targetOffsetY-y)/A.scale}:null,
  });
 }else if(images.boss)ctx.drawImage(images.boss,b.x-170,y-530,340,530);
 ctx.fillStyle='#302b31';ctx.fillRect(A.healthX,A.healthY,A.healthWidth,A.healthHeight);
 ctx.fillStyle='#d45679';ctx.fillRect(A.healthX,A.healthY,A.healthWidth*Math.max(0,b.hp/HUMANS.boss.hp),A.healthHeight);
 const hit=b.lastImpact,age=hit?b.age-hit.time:Infinity;
 if(age<A.impactDuration){const t=age/A.impactDuration;ctx.save();ctx.globalAlpha=1-t;ctx.strokeStyle='#f7df9c';ctx.lineWidth=3;
  for(let i=0;i<8;i++){const a=i*Math.PI/4;ctx.beginPath();ctx.moveTo(hit.x+Math.cos(a)*(8+t*10),hit.y+Math.sin(a)*(8+t*10));ctx.lineTo(hit.x+Math.cos(a)*(17+t*21),hit.y+Math.sin(a)*(17+t*21));ctx.stroke();}
  ctx.font='22px GoldBubble, "GoldBubble Mono"';ctx.fillStyle='#ffe0a5';ctx.fillText('−'+hit.damage,hit.x-25,hit.y-40-t*24);ctx.restore();
 }
}
