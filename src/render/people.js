// People v2 rendering: walk / attack / blink sheets, hit flash, falling "ghosts" and a dropped bucket.
// Purely presentational: reads simulation state, keeps its own bookkeeping per state object, never writes to it.
import {ASSETS} from '../data/assets_manifest.js';
import {PEOPLE_FRAME} from '../data/peopleSprites.js';
import {BALANCE,GRID,OUTCOME} from '../data/balance.js';
import {HUMANS} from '../data/humans.js';
import {drawFx,fxFrame} from './spiderAnim.js';

const books=new WeakMap();
const DH=185,DW=PEOPLE_FRAME.w*DH/PEOPLE_FRAME.h,DX=-64;
const GHOST_TIME=.75,BUCKET_TIME=.9,KNOCK=7,KNOCK_TIME=.15,TRAIL_DELAY=.3,TRAIL_RATE=1.6;
/** Presentation options shared by the renderers (set from the settings screen). */
export const VIEW={flashes:true,bars:true};
const seedOf=h=>((h.id||0)*0.618+h.row*0.37+(h.born||0)*0.11)%1;
function book(s){let b=books.get(s);if(!b){b={seen:new Map(),ghosts:[],buckets:[]};books.set(s,b);}return b;}
/** True when the simulation would make this human bite a spider this step (same rule as state.update). */
export function humanAttacking(s,h){return h.hp>0&&!h.sleeping&&s.spiders.some(p=>p.hp>0&&p.row===h.row&&Math.abs(h.x-p.x)<BALANCE.attackReach);}
/** Sheet key + frame + blink row for one human at simulation time. */
export function humanPose(s,h){
 const seed=seedOf(h),bare=h.type==='armored'&&!(h.armor>0)?'Bare':'';
 const attack=humanAttacking(s,h);
 let key=h.type+(attack?'Attack':'Walk')+bare;if(!ASSETS[key])key=h.type+(attack?'Attack':'Walk');if(!ASSETS[key])key=h.type+'Walk';
 const def=ASSETS[key];if(!def)return null;
 // Attack frames follow the simulation's swing clock, so the contact frame is drawn on the step that deals damage.
 const period=HUMANS[h.type]?.attackPeriod||def.period;
 const t=attack?((h.attackT||0)/period):((h.walkTime||0)/def.period+h.row*.17+seed*.5);
 const frame=((Math.floor(t*def.frames)%def.frames)+def.frames)%def.frames;
 const blink=((s.time+seed*7.3)%(3.6+seed*2.2))<.13?1:0;
 return {key,def,frame,row:blink,attack};
}
function blit(ctx,img,def,frame,row){ctx.drawImage(img,frame*def.frameWidth,row*def.frameHeight,def.frameWidth,def.frameHeight,DX,-DH,DW,DH);}
function drawBucket(ctx,x,y,a,alpha){ctx.save();ctx.globalAlpha=alpha;ctx.translate(x,y);ctx.rotate(a);const g=ctx.createLinearGradient(-20,0,20,0);g.addColorStop(0,'#7e8790');g.addColorStop(.4,'#d4dadf');g.addColorStop(1,'#9aa3ab');ctx.fillStyle=g;ctx.strokeStyle='#2a2026';ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(-19,10);ctx.lineTo(-14,-14);ctx.quadraticCurveTo(0,-18,14,-14);ctx.lineTo(19,10);ctx.closePath();ctx.fill();ctx.stroke();ctx.fillStyle='#8d969e';ctx.beginPath();ctx.ellipse(0,10,20,5,0,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.strokeStyle='#5d646b';ctx.beginPath();ctx.arc(0,2,20,Math.PI*1.05,Math.PI*1.95,true);ctx.stroke();ctx.restore();}

/** Draw every human (and leftovers of fallen ones). Returns nothing; the caller draws bars/labels afterwards. */
export function drawHumans(ctx,s,images){
 const b=book(s),now=s.time,alive=new Set(s.humans);
 // Humans removed by the simulation since the previous frame become falling ghosts.
 for(const [h,info] of b.seen)if(!alive.has(h)){b.seen.delete(h);if(info.pose)b.ghosts.push({...info,t0:now});}
 b.ghosts=b.ghosts.filter(g=>now-g.t0<GHOST_TIME+.45);b.buckets=b.buckets.filter(k=>now-k.t0<BUCKET_TIME);
 for(const g of b.ghosts){const e=now-g.t0,k=Math.min(1,e/GHOST_TIME),img=images[g.pose.key];if(!img)continue;
  ctx.save();ctx.translate(g.x,g.y);ctx.globalAlpha=k<.6?1:Math.max(0,1-(k-.6)/.4);
  ctx.rotate((Math.PI/2.3)*(k*k*(3-2*k)));ctx.scale(-1,1);blit(ctx,img,ASSETS[g.pose.key],g.pose.frame,1);ctx.restore();
  if(e>GHOST_TIME*.55&&e<GHOST_TIME+.45)drawFx(ctx,images,'dust_puff',Math.min(7,fxFrame('dust_puff',e-GHOST_TIME*.55)),g.x+44,g.y-6,1.6);}
 for(const k of b.buckets){const e=(now-k.t0)/BUCKET_TIME,x=k.x+60*e,y=k.y-150*e+260*e*e;drawBucket(ctx,x,Math.min(y,k.ground),e*7,e<.75?1:1-(e-.75)/.25);}
 for(const h of s.humans){
  const x=h.x+BALANCE.humanWidth/2,y=GRID.y+(h.row+1)*GRID.size,info=b.seen.get(h)||{hp:h.hp,armor:h.armor,hitAt:-9};
  if(h.hp<info.hp-1e-6||(h.armor||0)<(info.armor||0)-1e-6)info.hitAt=now;
  if(h.type==='armored'&&info.armor>0&&!(h.armor>0))b.buckets.push({x:x+6,y:y-170,ground:y-14,t0:now});
  info.hp=h.hp;info.armor=h.armor;
  const pose=humanPose(s,h),img=pose&&images[pose.key];
  info.x=x;info.y=y;info.pose=pose&&{key:pose.key,frame:pose.frame};b.seen.set(h,info);
  ctx.save();ctx.translate(x,y);
  if(h.sleeping){const t=Math.min(1,(h.fallTime||0)/OUTCOME.sleepFall);ctx.rotate(Math.PI/2*t);ctx.globalAlpha=1-t*.65;}
  const hit=now-info.hitAt;if(hit>=0&&hit<KNOCK_TIME&&!h.sleeping)ctx.translate(KNOCK*(1-hit/KNOCK_TIME),0);if(hit>=0&&hit<.12)ctx.scale(1.03,.97);
  ctx.scale(-1,1);
  if(img)blit(ctx,img,pose.def,pose.frame,h.sleeping?1:pose.row);
  else if(images[h.type])ctx.drawImage(images[h.type],-60,-185,120,185);
  if(img&&hit>=0&&hit<.14){ctx.globalCompositeOperation='lighter';ctx.globalAlpha*=(VIEW.flashes?.55:.2)*(1-hit/.14);blit(ctx,img,pose.def,pose.frame,pose.row);}
  ctx.restore();
  if(VIEW.bars&&!h.sleeping&&h.hp>0)drawHumanBar(ctx,h,info,x,y,now);
 }
}
/** Health (+armour) bar over a damaged human, with a white trail that drains after each hit. */
function drawHumanBar(ctx,h,info,x,y,now){
 const maxHp=h.maxHp||HUMANS[h.type]?.hp||h.hp,maxArmor=h.maxArmor||0,total=maxHp+maxArmor,current=h.hp+(h.armor||0);
 if(current>=total-1e-6)return;
 if(info.trail===undefined||info.trail<current)info.trail=current;
 if(now-info.hitAt>TRAIL_DELAY)info.trail=Math.max(current,info.trail-total*TRAIL_RATE*(now-(info.barTime??now)));info.barTime=now;
 const w=70,bh=8,bx=x-w/2+6,by=y-DH-8,hp=Math.max(0,h.hp)/total,ar=Math.max(0,h.armor||0)/total,tr=info.trail/total;
 ctx.save();ctx.fillStyle='rgba(20,12,18,.78)';ctx.beginPath();ctx.roundRect(bx-2,by-2,w+4,bh+4,4);ctx.fill();
 ctx.fillStyle='rgba(255,246,220,.85)';ctx.fillRect(bx,by,w*tr,bh);
 const k=h.hp/maxHp;ctx.fillStyle=k>.5?'#8fd14f':k>.25?'#f2c66d':'#ec6f5f';ctx.fillRect(bx,by,w*hp,bh);
 if(ar>0){ctx.fillStyle='#b9cad8';ctx.fillRect(bx+w*hp,by,w*ar,bh);}
 ctx.restore();
}
