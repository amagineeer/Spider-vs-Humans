import {QUEEN_HOME as HOME,GRID} from '../data/balance.js';
const TAU=Math.PI*2;
/** Fine radial cobweb used as the alcove backdrop. */
function cobweb(ctx,cx,cy,r,color){ctx.save();ctx.strokeStyle=color;ctx.lineWidth=1.2;const spokes=12;for(let i=0;i<spokes;i++){const a=i/spokes*TAU;ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(cx+Math.cos(a)*r,cy+Math.sin(a)*r);ctx.stroke();}for(let ring=1;ring<=6;ring++){const rr=r*ring/6;ctx.beginPath();for(let i=0;i<=spokes;i++){const a=i/spokes*TAU,sag=i%2?.94:1;const x=cx+Math.cos(a)*rr*sag,y=cy+Math.sin(a)*rr*sag;i?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.stroke();}ctx.restore();}
/** Queen refuge left of the grid: opaque backing, carved house, cobweb alcove, glowing queen. Read-only. */
/** Static shell (backing wall, house body with its blurred drop shadow, wood face). The renderer
 *  bakes it into the cached room layer; drawQueenHome draws it itself when `shell` is true. */
export function drawQueenShell(ctx,mode='day'){
 const {x,y,width:w,height:h,roofHeight:roof,inset}=HOME,night=mode==='night';
 ctx.save();ctx.translate(x,y);
 // Opaque backing replaces the queen baked into room artwork, never the source.
 const wall=ctx.createLinearGradient(0,0,0,h);wall.addColorStop(0,night?'#2b2a3d':'#b99a78');wall.addColorStop(1,night?'#1f1e2d':'#9c7d5f');ctx.fillStyle=wall;ctx.fillRect(0,0,GRID.x-x,h);
 // House body with soft drop shadow toward the lanes.
 ctx.save();ctx.shadowColor='#0007';ctx.shadowBlur=22;ctx.shadowOffsetX=6;ctx.fillStyle=night?'#3a2a2e':'#6e4a36';ctx.beginPath();ctx.roundRect(inset*.5,roof-6,w-inset,h-roof+6-inset*.5,[6,6,10,10]);ctx.fill();ctx.restore();
 const wood=ctx.createLinearGradient(0,0,w,0);wood.addColorStop(0,night?'#4a3437':'#8a5d40');wood.addColorStop(.5,night?'#5a4043':'#a27050');wood.addColorStop(1,night?'#3e2b2e':'#7a5038');ctx.fillStyle=wood;ctx.beginPath();ctx.roundRect(inset*.5,roof-6,w-inset,h-roof+6-inset*.5,[6,6,10,10]);ctx.fill();
 // Arched alcove: deep plum depth with a cobweb (the warm aura on top of it is animated).
 const ax=inset*1.6,ay=roof+10,aw=w-inset*3.2,ah=h-roof-inset*3.4;
 ctx.save();ctx.beginPath();ctx.roundRect(ax,ay,aw,ah,[aw/2,aw/2,8,8]);ctx.clip();
 const depth=ctx.createLinearGradient(0,ay,0,ay+ah);depth.addColorStop(0,night?'#140f1f':'#2a1b2c');depth.addColorStop(1,night?'#2a1d36':'#4a3047');ctx.fillStyle=depth;ctx.fillRect(ax,ay,aw,ah);
 cobweb(ctx,w/2,ay+aw*.55,aw*.62,night?'#cfc6ff2e':'#f3e6cf33');
 ctx.restore();
 ctx.restore();
}
export function drawQueenHome(ctx,queen,mode='day',{time=0,alarm=0,shell=true}={}){
 const {x,y,width:w,height:h,roofHeight:roof,inset}=HOME,night=mode==='night';
 if(shell)drawQueenShell(ctx,mode);
 ctx.save();ctx.translate(x,y);
 // Warm aura behind the queen, over the alcove drawn by the shell.
 const ax=inset*1.6,ay=roof+10,aw=w-inset*3.2,ah=h-roof-inset*3.4;
 ctx.save();ctx.beginPath();ctx.roundRect(ax,ay,aw,ah,[aw/2,aw/2,8,8]);ctx.clip();
 const pulse=.5+.5*Math.sin(time*1.3),qy=h-inset*2-HOME.queenHeight*.52;
 const aura=ctx.createRadialGradient(w/2,qy,10,w/2,qy,aw*.95);aura.addColorStop(0,alarm>0?`rgba(255,110,90,${.32+.18*pulse})`:`rgba(255,214,140,${(night?.34:.24)+.08*pulse})`);aura.addColorStop(1,'rgba(255,200,120,0)');ctx.fillStyle=aura;ctx.fillRect(ax,ay,aw,ah);
 // Inner shading keeps the arch readable at small sizes.
 const vignette=ctx.createLinearGradient(ax,0,ax+aw,0);vignette.addColorStop(0,'#0006');vignette.addColorStop(.2,'#0000');vignette.addColorStop(.8,'#0000');vignette.addColorStop(1,'#0006');ctx.fillStyle=vignette;ctx.fillRect(ax,ay,aw,ah);
 ctx.restore();
 ctx.strokeStyle=night?'#c9a77a88':'#e7c58fcc';ctx.lineWidth=3;ctx.beginPath();ctx.roundRect(ax,ay,aw,ah,[aw/2,aw/2,8,8]);ctx.stroke();
 // Pitched roof with gold trim.
 ctx.fillStyle=night?'#3b2629':'#5f3b2c';ctx.strokeStyle='#22161a';ctx.lineWidth=5;ctx.lineJoin='round';ctx.beginPath();ctx.moveTo(2,roof+8);ctx.lineTo(w/2,8);ctx.lineTo(w-2,roof+8);ctx.lineTo(w-14,roof+22);ctx.lineTo(w/2,34);ctx.lineTo(14,roof+22);ctx.closePath();ctx.fill();ctx.stroke();
 ctx.strokeStyle=night?'#c9a77a':'#f0cf8f';ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(16,roof+6);ctx.lineTo(w/2,22);ctx.lineTo(w-16,roof+6);ctx.stroke();
 ctx.fillStyle=night?'#c9a77a':'#f0cf8f';ctx.beginPath();ctx.arc(w/2,22,5,0,TAU);ctx.fill();
 // Silk threads hanging from the roof ridge.
 ctx.strokeStyle='#f6efe255';ctx.lineWidth=1.3;for(const [tx,len] of [[w*.3,110],[w*.5,70],[w*.7,130]]){const sway=Math.sin(time*.9+tx)*3;ctx.beginPath();ctx.moveTo(tx,ay+18);ctx.quadraticCurveTo(tx+sway,ay+18+len/2,tx+sway*1.6,ay+18+len);ctx.stroke();}
 // Queen: breathing, slow sway, trembling when humans are close.
 if(queen){const qw=HOME.queenWidth,qh=HOME.queenHeight,base=h-inset*2+4,shake=alarm>0?Math.sin(time*42)*HOME.alarmShake*alarm:0;
  ctx.save();ctx.fillStyle='#0008';ctx.beginPath();ctx.ellipse(w/2,base-4,qw*.42,10,0,0,TAU);ctx.fill();ctx.restore();
  ctx.save();ctx.translate(w/2+shake,base);ctx.rotate(Math.sin(time*HOME.swayRate)*HOME.sway);const b=1+HOME.breath*Math.sin(time*HOME.breathRate);ctx.scale(1/Math.sqrt(b),b);ctx.drawImage(queen,-qw/2,-qh,qw,qh);ctx.restore();}
 // Sill.
 const sill=ctx.createLinearGradient(0,h-inset*2,0,h-inset);sill.addColorStop(0,night?'#7d6450':'#c79a6a');sill.addColorStop(1,night?'#4d3b30':'#8f6845');ctx.fillStyle=sill;ctx.strokeStyle='#22161a';ctx.lineWidth=3;ctx.beginPath();ctx.roundRect(6,h-inset*2,w-12,inset,5);ctx.fill();ctx.stroke();
 if(night){ctx.fillStyle='#18213a30';ctx.fillRect(0,0,w,h);}
 ctx.restore();
}
