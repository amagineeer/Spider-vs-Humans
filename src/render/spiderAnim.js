import {SPIDER_SPRITES,FX_SPRITES} from '../data/spiderSprites.js';
import {SPIDERS} from '../data/spiders.js';
import {SPIDER_GROUND} from '../systems/effects.js';
const length=a=>a.frames/a.fps;
const hold=(A,name,time)=>({name,frame:Math.min(A[name].frames-1,Math.max(0,Math.floor(time*A[name].fps)))});
const cycle=(A,name,time)=>({name,frame:((Math.floor(time*A[name].fps)%A[name].frames)+A[name].frames)%A[name].frames});
/** Same target rule as the simulation uses for shooters. */
export function hasTarget(s,p){return s.humans.some(h=>h.hp>0&&h.row===p.row&&h.x>p.x)||s.boss?.hp>0;}
/** Action clip whose event frame coincides with the simulation event at `last`/timer zero. */
function action(A,name,event,p,t,last,ready){const a=A[name];if(!a)return null;const e=a.events[event]??0,since=t-(last??-1e9);if(since>=0&&since<(a.frames-e)/a.fps)return {name,frame:e+Math.floor(since*a.fps)};if(ready&&p.timer>0&&p.timer<=e/a.fps)return {name,frame:Math.floor((e/a.fps-p.timer)*a.fps)};return null;}
/** Choose clip and frame from world state only; never mutates the world. */
export function spiderPose(s,p){
 const sp=SPIDER_SPRITES[p.id];if(!sp)return null;const A=sp.animations,d=SPIDERS[p.id]||{},t=s.time;
 const spawning=A.spawn&&p.age<length(A.spawn);
 const act=d.production?action(A,'produce','spawn_silk',p,t,p.producedAt,!spawning):d.damage&&d.period?action(A,'attack','spawn_projectile',p,t,p.lastShot,!spawning&&hasTarget(s,p)):null;
 // A real shot/production during the landing still shows its release; otherwise landing finishes first.
 if(act)return act;
 if(spawning)return hold(A,'spawn',p.age);
 if(d.production||(d.damage&&d.period))return hit(A,p,t)||cycle(A,sp.idle,t+p.row*.37+p.col*.23);
 if(d.armTime&&A.arming){const start=d.armTime-length(A.arming);if(p.age>=d.armTime)return hit(A,p,t)||cycle(A,'idle_armed',p.age-d.armTime);if(p.age>=start)return hold(A,'arming',p.age-start);return hit(A,p,t)||cycle(A,'idle_unarmed',p.age);}
 return hit(A,p,t)||cycle(A,sp.idle,t+p.row*.37+p.col*.23);
}
function hit(A,p,t){return A.hit&&p.hitAt!=null&&t-p.hitAt>=0&&t-p.hitAt<length(A.hit)?hold(A,'hit',t-p.hitAt):null;}
/** Draw one spider frame with its ground pivot at (x, y+SPIDER_GROUND). Returns false if the sheet is not loaded. */
export function drawSpiderFrame(ctx,images,id,name,frame,x,y){const sp=SPIDER_SPRITES[id],a=sp?.animations[name],img=images[`${id}@${name}`];if(!a||!img)return false;const fw=sp.frameWidth,fh=sp.frameHeight,k=sp.scale;ctx.drawImage(img,(frame%a.columns)*fw,Math.floor(frame/a.columns)*fh,fw,fh,x-sp.pivot.x*k,y+SPIDER_GROUND-sp.pivot.y*k,fw*k,fh*k);return true;}
/** Draw an effect frame centred on its pivot; `size` enlarges effects placed over humans. */
export function drawFx(ctx,images,name,frame,x,y,size=1){const a=FX_SPRITES[name],img=images[`fx@${name}`];if(!a||!img)return false;const fw=a.frameWidth,fh=a.frameHeight,k=a.scale*size;ctx.drawImage(img,(frame%a.columns)*fw,Math.floor(frame/a.columns)*fh,fw,fh,x-a.pivot.x*k,y-a.pivot.y*k,fw*k,fh*k);return true;}
/** Looping effect frame at simulation time t. */
export function fxFrame(name,t){const a=FX_SPRITES[name];return a?((Math.floor(t*a.fps)%a.frames)+a.frames)%a.frames:0;}
/** Frame of a queued one-shot effect, or -1 once finished. */
export function effectFrame(e,t){const a=e.spider?SPIDER_SPRITES[e.spider]?.animations[e.anim]:FX_SPRITES[e.fx];if(!a)return -1;const f=e.from+Math.floor((t-e.t0)*a.fps);return f>=0&&f<a.frames?f:-1;}
