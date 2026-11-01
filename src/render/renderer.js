import {GRID,BALANCE,OUTCOME,QUEEN_HOME} from '../data/balance.js';
import {drawRoom} from './background.js';
import {drawQueenHome,drawQueenShell} from './queenHome.js';
import {drawHumans,VIEW} from './people.js';
import './polyfills.js';
import {SPIDERS} from '../data/spiders.js';
import {ASSETS} from '../data/assets_manifest.js';
import {drawGameBoss} from './boss.js';
import {SPIDER_SPRITES} from '../data/spiderSprites.js';
import {SPIDER_GROUND} from '../systems/effects.js';
import {spiderPose,drawSpiderFrame,drawFx,fxFrame,effectFrame} from './spiderAnim.js';
const SHOT_Y={spitter:4,weaver:-6};
/** Hit reaction of a defender on top of its hit clip (the clip itself already fades out of a white flash): a short recoil towards the house. */
export const SPIDER_HIT={time:.12,recoil:4};
const vignettes=new WeakMap();
/** The vignette gradient is built once per context instead of every frame. */
function vignette(ctx){let v=vignettes.get(ctx);if(!v){v=ctx.createRadialGradient(800,520,380,800,520,1050);v.addColorStop(0,'rgba(10,6,14,0)');v.addColorStop(1,'rgba(10,6,14,.42)');vignettes.set(ctx,v);}return v;}
function layerCanvas(){if(typeof OffscreenCanvas!=='undefined')return new OffscreenCanvas(1600,900);if(typeof document!=='undefined')return Object.assign(document.createElement('canvas'),{width:1600,height:900});return null;}
let roomLayer=null,roomKey='',vignetteLayer;
/** Static room (artwork, grid, queen house shell) is drawn once per background + mode, then blitted:
 *  one unscaled copy per frame instead of a scaled photo, 90 grid strokes and a blurred shadow. */
function staticRoom(level,images){
 const key=`${level.background}|${level.mode}`;if(roomKey===key&&roomLayer)return roomLayer;
 if(!images[level.background])return null;const layer=layerCanvas();if(!layer)return null;
 const c=layer.getContext('2d');drawRoom(c,level,images);drawQueenShell(c,level.mode);roomLayer=layer;roomKey=key;return layer;
}
/** Pre-rendered vignette overlay (same gradient), shared by every frame. */
function vignetteImage(){if(vignetteLayer===undefined){const layer=layerCanvas();if(layer){const c=layer.getContext('2d');c.fillStyle=vignette(c);c.fillRect(0,0,1600,900);}vignetteLayer=layer;}return vignetteLayer;}
const trails=new WeakMap();
/** Small health bar over a damaged spider; the light trail drains shortly after each bite. */
function spiderBar(ctx,p,now){const max=p.maxHp||SPIDERS[p.id].hp,w=56,h=6,x=p.x-w/2,y=p.y-62;let t=trails.get(p);if(!t){t={v:max,at:now};trails.set(p,t);}if(t.v<p.hp)t.v=p.hp;if(now-(p.hitAt??-9)>.3)t.v=Math.max(p.hp,t.v-max*1.2*Math.max(0,now-t.at));t.at=now;const k=p.hp/max;ctx.fillStyle='rgba(20,12,18,.78)';ctx.beginPath();ctx.roundRect(x-2,y-2,w+4,h+4,4);ctx.fill();ctx.fillStyle='rgba(255,246,220,.85)';ctx.fillRect(x,y,w*t.v/max,h);ctx.fillStyle=k>.5?'#8fd14f':k>.25?'#f2c66d':'#ec6f5f';ctx.fillRect(x,y,w*k,h);}
/** 0..1 closeness of the nearest living human to the queen's refuge. */
function queenAlarm(s){let near=Infinity;for(const h of s.humans)if(h.hp>0)near=Math.min(near,h.x);const edge=GRID.x+QUEEN_HOME.alarmCells*GRID.size;return near<edge?Math.min(1,(edge-near)/(QUEEN_HOME.alarmCells*GRID.size)):0;}
/** Read-only world rendering, including procedural tape and flag overlays. */
export function render(ctx,s,images,preview=null,options={}){
 const room=staticRoom(s.level,images);ctx.clearRect(0,0,1600,900);if(room)ctx.drawImage(room,0,0);else drawRoom(ctx,s.level,images);drawQueenHome(ctx,images.queen,s.level.mode,{time:s.time,alarm:queenAlarm(s),shell:!room});
 for(let row=0;row<GRID.rows;row++)if(!s.level.lanes.includes(row)){ctx.fillStyle='#120e18b0';ctx.beginPath();ctx.roundRect(GRID.x+4,GRID.y+row*GRID.size+4,GRID.size*GRID.cols-8,GRID.size-8,12);ctx.fill();}
 if(preview&&!s.paused){const x=GRID.x+preview.col*GRID.size,y=GRID.y+preview.row*GRID.size;ctx.save();ctx.fillStyle=preview.valid?'#9bd25040':'#ec6f5f40';ctx.strokeStyle=preview.valid?'#c8f08acc':'#ff9a8ccc';ctx.lineWidth=3;ctx.setLineDash([10,8]);ctx.beginPath();ctx.roundRect(x+5,y+5,118,118,14);ctx.fill();ctx.stroke();ctx.restore();ctx.save();ctx.globalAlpha=.5;const idle=SPIDER_SPRITES[preview.id]?.idle;if(!drawSpiderFrame(ctx,images,preview.id,idle,0,x+64,y+64)&&images[preview.id])ctx.drawImage(images[preview.id],x+6,y+22,116,80);ctx.restore();}
 // Contact shadows ground every unit on the parquet.
 ctx.fillStyle='rgba(30,16,10,.28)';for(const p of s.spiders){ctx.beginPath();ctx.ellipse(p.x,p.y+SPIDER_GROUND-2,46,11,0,0,Math.PI*2);ctx.fill();}
 for(const h of s.humans)if(!h.sleeping&&h.hp>0){ctx.beginPath();ctx.ellipse(h.x+BALANCE.humanWidth/2,GRID.y+(h.row+1)*128-4,40,9,0,0,Math.PI*2);ctx.fill();}
 for(const p of s.spiders){const pose=spiderPose(s,p),since=s.time-(p.hitAt??-9),x=p.x-(since>=0&&since<SPIDER_HIT.time?SPIDER_HIT.recoil*(1-since/SPIDER_HIT.time):0);if(!(pose&&drawSpiderFrame(ctx,images,p.id,pose.name,pose.frame,x,p.y))&&images[p.id])ctx.drawImage(images[p.id],x-58,p.y-42,116,80);}
 if(VIEW.bars)for(const p of s.spiders)if(p.hp>0&&p.hp<(p.maxHp||SPIDERS[p.id].hp))spiderBar(ctx,p,s.time);
 for(const e of s.particles)if(e.spider){const f=effectFrame(e,s.time);if(f>=0)drawSpiderFrame(ctx,images,e.spider,e.anim,f,e.x,e.y);}
 ctx.font='22px GoldBubble, "GoldBubble Mono"';
 drawHumans(ctx,s,images);
 for(const h of s.humans){
  if(!h.sleeping&&s.time<(h.slowUntil||0))drawFx(ctx,images,'net_stuck',fxFrame('net_stuck',s.time+h.row*.3),h.x+60,GRID.y+(h.row+1)*128-80,2.4);
  if(h.isFlag){ctx.fillStyle='#f6dfab';ctx.fillRect(h.x-20,GRID.y+h.row*128-50,180,30);ctx.fillStyle='#2a1d1f';ctx.fillText('ЗА ЧИСТОТУ!',h.x-14,GRID.y+h.row*128-27);}
  if(options.hitboxes){ctx.strokeStyle='#ff6565';ctx.strokeRect(h.x,GRID.y+h.row*128,120,128);}
 }
 drawGameBoss(ctx,s,images);
 for(const tape of s.tapes)if(tape.status!=='spent'){const y=GRID.y+(tape.row+.5)*128;ctx.fillStyle='#e3c987';ctx.strokeStyle='#2a1d1f';ctx.lineWidth=5;ctx.beginPath();ctx.ellipse(tape.x,y,25,38,tape.status==='rolling'?s.time*8:0,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.fillStyle='#6a5136';ctx.beginPath();ctx.arc(tape.x,y,10,0,Math.PI*2);ctx.fill();}
 for(const p of s.shots){if(p.from!=null&&p.x<p.from)continue;const y=GRID.y+(p.row+.5)*128+(SHOT_Y[p.kind]??0),name=p.slowFactor?'net_fly':'venom_glob_fly';if(!drawFx(ctx,images,name,fxFrame(name,s.time),p.x,y,p.slowFactor?1.3:1.5)){ctx.fillStyle=p.slowFactor?'#94e0ed':'#eef6d4';ctx.beginPath();ctx.arc(p.x,y,10,0,Math.PI*2);ctx.fill();}}
 for(const e of s.particles)if(e.fx){const f=effectFrame(e,s.time);if(f>=0)drawFx(ctx,images,e.fx,f,e.x,e.y,e.size||1);}
 for(const f of s.flies){ctx.save();if(f.life<2&&Math.floor(f.life*6)%2===0)ctx.globalAlpha=.35;if(images.fly)ctx.drawImage(images.fly,f.x-34,f.y-28,68,56);ctx.restore();}
 // Soft vignette focuses the lanes.
 const shade=vignetteImage();if(shade)ctx.drawImage(shade,0,0);else{ctx.fillStyle=vignette(ctx);ctx.fillRect(0,0,1600,900);}
 if(s.paused){ctx.fillStyle='#0006';ctx.fillRect(0,0,1600,900);}
}
