import {SPIDER_SPRITES,FX_SPRITES} from '../data/spiderSprites.js';
import {createPool,compact} from '../core/pool.js';
/** Pooled one-shot visuals; every field is reassigned in addEffect. */
export const EFFECT_POOL=createPool(()=>({fx:null,spider:null,anim:null,from:0,x:0,y:0,size:1,t0:0,until:0}));
// Spider sprites stand on this many logical pixels below the cell centre.
export const SPIDER_GROUND=34;
/** Logical position of a named sprite point (or event point) for a spider standing at x,y. */
export function spiderPoint(id,x,y,name,anim){const sp=SPIDER_SPRITES[id];const pt=sp&&(sp.animations[anim]?.eventPoints?.[name]||sp.points[name]);if(!pt)return {x,y};return {x:x+(pt.x-sp.pivot.x)*sp.scale,y:y+SPIDER_GROUND+(pt.y-sp.pivot.y)*sp.scale};}
/** Queue a one-shot visual: {fx} effect sheet, or {spider,anim,from} spider sheet. Purely presentational, no RNG. */
export function addEffect(s,e){const a=e.spider?SPIDER_SPRITES[e.spider]?.animations[e.anim]:FX_SPRITES[e.fx];if(!a)return null;const from=e.from||0,effect=EFFECT_POOL.acquire();
 effect.fx=e.spider?null:e.fx;effect.spider=e.spider||null;effect.anim=e.spider?e.anim:null;effect.from=from;effect.x=e.x;effect.y=e.y;effect.size=e.size||1;effect.t0=s.time;effect.until=s.time+(a.frames-from)/a.fps;
 s.particles.push(effect);return effect;}
/** Drop finished visuals; simulation time drives them, so pause and victory freeze them. */
export function updateEffects(s){if(s.particles.length)compact(s.particles,p=>p.until>s.time,EFFECT_POOL);}
