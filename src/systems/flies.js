import {GRID,BALANCE} from '../data/balance.js';
// Eight equal-probability directions: horizontal, vertical and diagonal.
const directions=[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];
function turn(s,f){
 const [x,y]=directions[Math.floor(s.random()*directions.length)];
 const speed=BALANCE.flySpeed/Math.hypot(x,y);
 f.vx=x*speed;f.vy=y*speed;
 f.turnIn=BALANCE.flyTurnMin+s.random()*(BALANCE.flyTurnMax-BALANCE.flyTurnMin);
}
export function spawnFly(s){
 const margin=BALANCE.flyMargin;
 const f={x:GRID.x+margin+s.random()*(GRID.cols*GRID.size-margin*2),y:GRID.y+margin+s.random()*(GRID.rows*GRID.size-margin*2),life:BALANCE.flyLife};
 turn(s,f);s.flies.push(f);return f;
}
export function updateFlies(s,dt){
 for(const f of s.flies){
  f.life-=dt;f.turnIn-=dt;if(f.turnIn<=0)turn(s,f);
  f.x+=f.vx*dt;f.y+=f.vy*dt;
  const left=GRID.x+BALANCE.flyMargin,right=GRID.x+GRID.cols*GRID.size-BALANCE.flyMargin,top=GRID.y+BALANCE.flyMargin,bottom=GRID.y+GRID.rows*GRID.size-BALANCE.flyMargin;
  if(f.x<left||f.x>right){f.x=Math.max(left,Math.min(right,f.x));f.vx*=-1;}
  if(f.y<top||f.y>bottom){f.y=Math.max(top,Math.min(bottom,f.y));f.vy*=-1;}
 }
 s.flies=s.flies.filter(f=>f.life>0);
}
