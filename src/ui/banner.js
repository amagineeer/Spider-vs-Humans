import {FLOW,WAVES,PRESENTATION} from '../data/balance.js';
/** Bind transient, simulation-timed banners to the level event bus. */
export function bindBanner(bus,node){const scope=bus.scope();let left=0,duration=0;
 const show=(text,time)=>{if(!text){left=0;node.hidden=true;return;}node.textContent=text;left=duration=time;node.hidden=false;};
 scope.on('intro:word',text=>show(text,FLOW.introWord));scope.on('wave:big',()=>show('Идёт толпа!',WAVES.bigWaveWarn));scope.on('wave:final',()=>show('Последняя волна!',WAVES.bigWaveWarn));scope.on('level:unloaded',()=>show(null));
 return {update(dt){if(left<=0)return;left=Math.max(0,left-dt);const t=1-left/duration;node.style.opacity=String(Math.min(1,left/PRESENTATION.bannerFade));node.style.transform=`translate(-50%,-50%) scale(${1+(PRESENTATION.bannerScale-1)*Math.max(0,1-t*PRESENTATION.bannerSettle)})`;node.hidden=left<=0;},dispose(){scope.dispose();show(null);}};
}
