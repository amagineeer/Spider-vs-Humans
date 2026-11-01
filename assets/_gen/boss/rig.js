// Derived from the supplied boss_combat.html; original preserved.
import {BOSS_ANIMATION} from "../../../src/data/balance.js";
const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n));
const mix=(a,b,p)=>a+(b-a)*p;
const smooth=p=>{p=clamp(p);return p*p*(3-2*p);};
const V=(x,y)=>({x,y});
const lerp=(a,b,p)=>V(mix(a.x,b.x,p),mix(a.y,b.y,p));
function path(c,points,fill,stroke='#302b30',width=3){c.beginPath();points.forEach((p,i)=>i?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1]));c.closePath();if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.stroke();}}
function line(c,points,color,width){c.beginPath();points.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.strokeStyle=color;c.lineWidth=width;c.lineCap='round';c.lineJoin='round';c.stroke();}
function oval(c,x,y,rx,ry,color,stroke=null,width=2){c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fillStyle=color;c.fill();if(stroke){c.lineWidth=width;c.strokeStyle=stroke;c.stroke();}}
function roundBox(c,x,y,w,h,r,fill,stroke='#302b30',width=3){c.beginPath();c.roundRect(x,y,w,h,r);c.fillStyle=fill;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.stroke();}}
function gradient(c,x,y,w,h,a,b){const g=c.createLinearGradient(x,y,x+w,y+h);g.addColorStop(0,a);g.addColorStop(1,b);return g;}
function knee(hip,foot,l1,l2,bend=-1){const dx=foot.x-hip.x,dy=foot.y-hip.y,d=Math.max(1,Math.hypot(dx,dy));const a=(l1*l1-l2*l2+d*d)/(2*d),h=Math.sqrt(Math.max(0,l1*l1-a*a));return V(hip.x+dx*a/d-dy*h*bend/d,hip.y+dy*a/d+dx*h*bend/d);}
function legPose(phase,side,walking){
 const p=((phase+side*.5)%1+1)%1;let x,y,angle;
 // Stance: planted foot slides backwards relative to the advancing body.
 // Swing: lifted heel, flexed knee, then toe extension for the next contact.
 if(p<.62){const q=p/.62;x=mix(-29,27,q);y=-3;angle=mix(-.08,.15,q);}
 else{const q=(p-.62)/.38;x=mix(27,-29,smooth(q));y=-3-Math.sin(Math.PI*q)*20;angle=-Math.sin(Math.PI*q)*.27;}
 return {foot:V((side?22:-19)+walking*x,-3+walking*(y+3)),angle:walking*angle};
}
function drawLeg(c,phase,side,walking){const pose=legPose(phase,side,walking),hip=V(side?24:-20,-132),joint=knee(hip,pose.foot,66,67,1);const color=side?'#4f5264':'#606173';line(c,[hip,joint,pose.foot],'#302d35',35);line(c,[hip,joint,pose.foot],color,28);line(c,[V(hip.x-7,hip.y+5),V(joint.x-7,joint.y),V(pose.foot.x-7,pose.foot.y-8)],'#81818d',3);c.save();c.translate(pose.foot.x,pose.foot.y);c.rotate(pose.angle);path(c,[[-43,-2],[-37,-14],[-12,-21],[15,-19],[23,-7],[20,7],[-41,7]],side?'#786987':'#98809d');line(c,[V(-37,2),V(17,2)],'#b6a0b3',3);line(c,[V(-41,8),V(19,8)],'#3b323b',4);c.restore();}
const ARM_ORDER=[0,2,1,3];
const ARM_ANCHORS=[V(70,-328),V(90,-307),V(95,-242),V(73,-205)];
const ARM_REST=[V(-227,-376),V(186,-442),V(231,-246),V(-215,-122)];
// One shared timing definition keeps visible contacts and damage in sync.
const ATTACK_TIMING=BOSS_ANIMATION.attack;
function armMotion(index,combatTime,target){
 const a=ATTACK_TIMING,rank=ARM_ORDER.indexOf(index),first=rank*a.interval,cycle=ARM_ORDER.length*a.interval,elapsed=combatTime-first;
 const rest=ARM_REST[index];if(elapsed<0)return {point:rest,activity:0,phase:'idle',angle:0};
 const impact=a.windup+a.strike,recover=impact+a.contact,end=recover+a.recovery;
 const t=elapsed%cycle;if(t>end)return {point:rest,activity:0,phase:'idle',angle:0};
 const wind=V(rest.x+62,rest.y-58),contact=V(target.x+(index%2?12:-8),target.y+(index<2?-14:2));
 let point,activity,phase,angle;
 if(t<a.windup){activity=smooth(t/a.windup);point=lerp(rest,wind,activity);phase='windup';angle=activity*.45;}
 else if(t<impact){activity=smooth((t-a.windup)/a.strike);point=lerp(wind,contact,activity);phase='strike';angle=mix(.45,-.8,activity);}
 else if(t<recover){point=lerp(contact,V(contact.x-6,contact.y+6),Math.sin((t-impact)/a.contact*Math.PI));activity=1;phase='contact';angle=-.8;}
 else{activity=1-smooth((t-recover)/a.recovery);point=lerp(rest,contact,activity);phase='recover';angle=-.8*activity;}
 return {point,activity,phase,angle};
}
function bezier(a,b,c,d,t){const s=1-t;return V(s*s*s*a.x+3*s*s*t*b.x+3*s*t*t*c.x+t*t*t*d.x,s*s*s*a.y+3*s*s*t*b.y+3*s*t*t*c.y+t*t*t*d.y);}
function tube(c,a,d,index,activity){
 const b=V(a.x+105+activity*20,a.y-(index<2?80:-65));
 const e=V(mix(a.x,d.x,.64)+(index%2?60:0),d.y-(index<2?28:-45));
 const pts=Array.from({length:31},(_,i)=>bezier(a,b,e,d,i/30));
 line(c,pts,'#302b31',24);line(c,pts,'#666d7b',18);line(c,pts.map(p=>V(p.x-2,p.y-2)),'#92949c',8);
 for(let i=1;i<30;i++){const p=pts[i],prev=pts[i-1],next=pts[i+1],angle=Math.atan2(next.y-prev.y,next.x-prev.x)+Math.PI/2;const dx=Math.cos(angle)*9,dy=Math.sin(angle)*9;line(c,[V(p.x-dx,p.y-dy),V(p.x+dx,p.y+dy)],i%5===0?'#82d1c1':'#3b3b45',i%5===0?3.3:2);}
 oval(c,a.x,a.y,16,17,'#777d89','#302d33',4);oval(c,a.x,a.y,7,8,'#31363d');
}
function slipper(c,index,angle){c.save();c.rotate(angle);roundBox(c,-16,-7,22,14,4,'#adb1b7');oval(c,0,0,16,17,'#606975','#302b31',4);oval(c,0,0,7,7,'#82d7c4','#30383e',2);
 c.translate(-14,0);const color=['#b27e9e','#647994','#a07a56','#7d91a4'][index];path(c,[[-66,2],[-61,-13],[-47,-24],[-27,-25],[-8,-9],[0,3],[-66,5]],color);path(c,[[-67,3],[-1,1],[0,10],[-67,12]],'#ccc0b6');line(c,[V(-59,-8),V(-47,-17),V(-30,-17),V(-15,-8)],'#dac0c0',2);if(index===0)oval(c,-46,-23,7,7,'#eee0d9','#3d3338');if(index===1||index===2){c.save();c.beginPath();c.moveTo(-65,1);c.lineTo(-52,-18);c.lineTo(-29,-24);c.lineTo(-6,1);c.clip();for(let n=-60;n<0;n+=9){line(c,[V(n,-30),V(n+15,8)],'#b89491',1.5);line(c,[V(-70,n+58),V(0,n+58)],'#48586b',1.5);}c.restore();}c.restore();}
function monitor(c,x,y,w,h,text,angle=0){c.save();c.translate(x,y);c.rotate(angle);roundBox(c,-w/2,-h/2,w,h,5,'#74727d','#29282b',4);roundBox(c,-w/2+6,-h/2+6,w-12,h-12,2,'#133f3b','#24302f',2);for(let yy=-h/2+8;yy<h/2-6;yy+=4)line(c,[V(-w/2+7,yy),V(w/2-7,yy)],'#75bbaa22',1);c.fillStyle='#85e5cf';c.font=`bold ${Math.min(14,h/3)}px GoldBubble, "GoldBubble Mono"`;c.textAlign='center';c.fillText(text,0,3);oval(c,w/2-7,h/2-6,2.2,2.2,'#df7164');c.restore();}
function drawCup(c,point,tilt=0){c.save();c.translate(point.x,point.y);c.rotate(tilt);oval(c,12,-4,11,13,'#d3c6ad','#423f3c',3);oval(c,12,-4,6,8,'#807c71');path(c,[[-24,-24],[7,-24],[5,15],[-21,15]],'#e6dbbf','#453b39',3);oval(c,-8,-24,16,5,'#b8a88d','#53483e',2);oval(c,-8,-24,11.5,2.3,'#674c36');line(c,[V(-17,-16),V(-16,7)],'#fff4d9',2);c.restore();}
// The cup reaches the mouth before the full silhouette clears the right edge.
const DRINK_TIMING=BOSS_ANIMATION.drink;
function drinkPose(time){
 // Cup and hand share the body's walking bob, staying attached to the handle.
 const a=DRINK_TIMING,rest=V(45,-202),holder=V(122,-226),mouth=V(-33,-328);let hand=rest,cup=holder,tilt=0,holding=false,phase='idle';
 if(time>=a.reach&&time<a.lift){hand=lerp(rest,holder,smooth((time-a.reach)/(a.lift-a.reach)));phase='reach';}
 else if(time>=a.lift&&time<a.sip){const p=smooth((time-a.lift)/(a.sip-a.lift));hand=lerp(holder,mouth,p);cup=hand;holding=true;tilt=-.52*p;phase='lift';}
 else if(time>=a.sip&&time<a.return){const q=(time-a.sip)/(a.return-a.sip),envelope=Math.sin(Math.PI*q)**2;hand=V(mouth.x,mouth.y+Math.sin(q*Math.PI*4)*.8*envelope);cup=hand;holding=true;tilt=-.52-Math.sin(q*Math.PI*4)*.035*envelope;phase='sip';}
 else if(time>=a.return&&time<a.release){const p=smooth((time-a.return)/(a.release-a.return));hand=lerp(mouth,holder,p);cup=hand;holding=true;tilt=-.52*(1-p);phase='return';}
 else if(time>=a.release&&time<a.end){hand=lerp(holder,rest,smooth((time-a.release)/(a.end-a.release)));phase='release';}
 return {hand,cup,tilt,holding,phase};
}
function drawHumanArm(c,hand,near=true){const shoulder=near?V(47,-300):V(-61,-303),joint=knee(shoulder,hand,79,78,near?-1:1);line(c,[shoulder,joint,hand],'#292e31',33);line(c,[shoulder,joint,hand],near?'#416f71':'#355c62',25);line(c,[V(joint.x-6,joint.y+2),V(hand.x-5,hand.y-9)],'#57868a',4);roundBox(c,hand.x-18,hand.y-17,34,19,4,'#354b52');oval(c,hand.x,hand.y+2,15,18,'#deb79b','#3c3432',3);for(let n=0;n<3;n++)line(c,[V(hand.x-9,hand.y-8+n*7),V(hand.x-1,hand.y-5+n*7)],'#9a7263',1.6);}
function drawBoss(c,images,state){const {x,y,scale,time,walking,combatTime,target}=state,phase=state.walkPhase;const walkWeight=state.walkBlend??(walking?1:0),bob=mix(Math.sin(time*2)*.7,Math.cos(phase*Math.PI*4)*2.3,walkWeight);const drink=drinkPose(state.drinkTime??-1);c.save();c.translate(x,y);c.scale(scale,scale);
 const gait=state.walkBlend??(walking?1:0);drawLeg(c,phase,1,gait);drawLeg(c,phase,0,gait);c.save();c.translate(0,bob);
 roundBox(c,22,-350,91,200,15,gradient(c,22,-350,90,180,'#999aa0','#646a79'));roundBox(c,39,-326,59,160,12,'#777d88');for(let i=0;i<6;i++)line(c,[V(56,-290+i*21),V(94,-290+i*21)],'#51545c',4);roundBox(c,94,-215,54,9,3,'#898b8c');
 // Four independent tentacles: even arms behind, odd arms over the body.
 const motions=ARM_REST.map((p,i)=>combatTime==null?{point:V(p.x+Math.sin(time*1.3+i)*3,p.y+Math.sin(time+i)*4),activity:0,angle:0}:armMotion(i,combatTime,target));
 const drawArm=i=>{const m=motions[i];tube(c,ARM_ANCHORS[i],m.point,i,m.activity);c.save();c.translate(m.point.x,m.point.y);slipper(c,i,m.angle);c.restore();};
 [0,1,2].forEach(drawArm);if(!drink.holding)drawCup(c,drink.cup);
 // Hood, dark outline, ribbed hem, straps and lanyard retain the prototype.
 path(c,[[-83,-315],[-58,-342],[12,-346],[58,-328],[78,-280],[87,-168],[70,-130],[25,-116],[-52,-119],[-87,-137],[-100,-197],[-92,-276]],gradient(c,-95,-330,175,210,'#4e7979','#2c565b'),'#302c2f',5);
 oval(c,-18,-333,59,32,'#2c4147','#302c2f',4);line(c,[V(-57,-326),V(-20,-312),V(20,-328)],'#718285',5);
 for(const xx of [-59,45]){line(c,[V(xx,-307),V(xx-8,-160)],'#28373f',14);line(c,[V(xx+1,-302),V(xx-5,-171)],'#657383',2);roundBox(c,xx-12,-287,22,12,2,'#a8a8b0');}
 line(c,[V(-26,-306),V(-27,-252)],'#d9cbbb',3);line(c,[V(10,-306),V(15,-253)],'#d9cbbb',3);line(c,[V(-23,-300),V(2,-252),V(32,-300)],'#f2a856',3);roundBox(c,-14,-249,31,24,3,'#e5dec9');c.fillStyle='#4a403a';c.font='8px GoldBubble, "GoldBubble Mono"';c.textAlign='center';c.fillText('CEO',1,-234);
 line(c,[V(-81,-146),V(-39,-135),V(27,-131),V(70,-144)],'#70928d',3);
 drawHumanArm(c,V(-84+Math.sin(phase*Math.PI*2)*8*(walking?1:0),-205),false);
 c.save();c.translate(-16,-333);c.rotate(mix(walking?Math.sin(phase*Math.PI*2)*.015:0,-.04,clamp(-drink.tilt/.52)));c.drawImage(images.portrait,-87,-125,128,170);
 path(c,[[-62,-75],[-64,-104],[-55,-121],[-36,-129],[-11,-126],[10,-113],[25,-94],[20,-77],[4,-86],[-19,-100],[-41,-88]],gradient(c,-60,-130,80,42,'#715341','#45362f'),'#342c2b',3);line(c,[V(-54,-111),V(-36,-120),V(-15,-117),V(4,-106)],'#96765d',2);c.restore();
 monitor(c,75,-355,88,40,'БОСС');monitor(c,39,-386,45,33,'404',-.24);monitor(c,154,-315,50,35,'↗',.14);
 line(c,[V(60,-379),V(60,-395)],'#555c66',4);oval(c,60,-397,5,5,'#e7685e','#343039');
 c.drawImage(images.screen,-83,-229,144,108);
 drawHumanArm(c,drink.hand,true);if(drink.holding)drawCup(c,drink.cup,drink.tilt);
 // Finger curls stay over the handle while holding the mug.
 if(drink.holding){c.save();c.translate(drink.hand.x,drink.hand.y);c.rotate(drink.tilt);oval(c,12,0,6,11,'#d8ae91','#694e43',1.5);c.restore();}
 drawArm(3);c.restore();c.restore();
}

/** Draw the supplied rig from a read-only simulation pose. */
export {drawBoss};
