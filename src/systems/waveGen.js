import {HUMANS} from '../data/humans.js';
const lerp=(a,b,t)=>a+(b-a)*t;
/** Deterministically generate immutable spawn plans; indices are zero based. */
export function generateWaves(level,rng,B){
 let lastLane=null,repeat=0;
 return Array.from({length:level.waves},(_,index)=>{
  const big=level.bigWaves.includes(index),final=index===level.waves-1;
  const cfg={...B,...level.budget};
  // At least one basic per wave, so gentle early levels never produce an empty wave.
  const budget=Math.max(HUMANS.basic.cost,Math.floor((cfg.base+cfg.perWave*index)*(level.difficulty??(1+B.levelDiffStep*(level.id-1)))*(big?cfg.bigMul:1)));
  let types=[];
  if(level.manualWaves)types=level.manualWaves[index].map(x=>({...x}));
  else{
   let remaining=budget;
   const pool=level.pool.filter(x=>x.minWave<=index&&x.type!=='agent');
   while(remaining>=HUMANS.basic.cost){
    const eligible=pool.filter(x=>HUMANS[x.type].cost<=remaining&&x.weight>0);
    let type='basic';
    if(eligible.length){let value=rng()*eligible.reduce((n,x)=>n+x.weight,0);type=eligible[eligible.length-1].type;for(const item of eligible){value-=item.weight;if(value<0){type=item.type;break;}}}
    types.push({type});remaining-=HUMANS[type].cost;
   }
  }
  if(big){if(!types.length)types.push({type:'basic'});types[0].type='basic';while(types.length<level.lanes.length)types.push({type:'basic'});}
  const coverage=big?[...level.lanes]:[];
  // Seeded shuffle guarantees coverage without relying on sort comparator randomness.
  for(let j=coverage.length-1;j>0;j--){const k=Math.floor(rng()*(j+1));[coverage[j],coverage[k]]=[coverage[k],coverage[j]];}
  let delay=0;
  const units=types.map((item,k)=>{
   let available=level.lanes.filter(l=>repeat<2||l!==lastLane);
   if(!available.length)available=level.lanes;
   let lane;
   if(coverage.length){let at=coverage.findIndex(l=>available.includes(l));if(at<0)at=0;lane=coverage.splice(at,1)[0];}
   else{lane=item.lane;if(!available.includes(lane))lane=available[Math.floor(rng()*available.length)];}
   repeat=lane===lastLane?repeat+1:1;lastLane=lane;
   const t=types.length<=1?0:k/(types.length-1);
   if(k)delay+=lerp(big?B.bigIntervalStart:B.intervalStart,big?B.bigIntervalEnd:B.intervalEnd,t);
   const isFlag=big&&k===0;
   const speedMul=level.scaleSpeed===false?1:Math.min(B.totalSpeedMax,(level.speed??(1+B.levelSpeedStep*(level.id-1)))*Math.min(B.speedMulMax,1+B.speedGrowth*index)*lerp(1,B.intraSpeedMax,t)*(isFlag?B.flagSpeedMul:1));
   return {type:item.type,lane,delay,speedMul,isFlag};
  });
  return {index,big,final,budget,units};
 });
}
