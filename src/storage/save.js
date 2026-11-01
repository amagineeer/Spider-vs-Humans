import {SPIDERS} from '../data/spiders.js';
import {HUMANS} from '../data/humans.js';
import {LEVEL_COUNT} from '../data/levels.js';
// The storage key keeps its historical name so old saves are found; the data version lives in `v`.
export const KEY='spider_defense_v1';
export const SAVE_VERSION=2;
const clamp=(n,a,b,d=a)=>Number.isFinite(n)?Math.max(a,Math.min(b,n)):d;
/** Presentation settings (v2). Volumes are 0..1 multipliers under the master volume. */
/** OS-level "reduce motion" turns screen shake and flashes off by default (the player can re-enable them). */
export function prefersReducedMotion(){try{return typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches;}catch{return false;}}
export function defaultSettings(){const calm=prefersReducedMotion();return {music:.8,sfx:.9,shake:!calm,flashes:!calm,hints:true};}
/** Fresh progress. Level 1 teaches the Spitter; the Spinner is its reward. */
export function defaults(){return {v:SAVE_VERSION,unlocked:1,done:{},spiders:['spitter'],seenEnemies:[],last:1,attempts:{},rewards:{silk:0,trophy:false,bonus:false},volume:.65,muted:false,introSeen:false,finaleSeen:false,settings:defaultSettings()};}
/** Migrate v0 (audio-only), v1 (no settings) and v2 data without mutating the input. Unknown future versions reset. */
export function migrate(raw){
 if(!raw||typeof raw!=='object'||Array.isArray(raw))return defaults();
 if(raw.v!==undefined&&![0,1,2].includes(raw.v))return defaults();
 const out={...defaults(),...raw,v:SAVE_VERSION,unlocked:raw.unlocked??raw.unlockedLevels??1};
 // v1 players who already started keep the Spinner they were given for free.
 if((raw.v===0||raw.v===1||raw.v===undefined)&&Array.isArray(raw.spiders))out.spiders=raw.spiders;
 out.settings={...defaultSettings(),...(raw.settings&&typeof raw.settings==='object'?raw.settings:{})};
 return out;
}
/** Validate data at the storage trust boundary. */
export function validate(raw){
 const r=migrate(raw),s=defaults();
 s.unlocked=Math.floor(clamp(r.unlocked,1,LEVEL_COUNT));s.last=Math.floor(clamp(r.last,1,s.unlocked));
 s.spiders=[...new Set([...s.spiders,...(Array.isArray(r.spiders)?r.spiders:[]).filter(id=>Object.prototype.hasOwnProperty.call(SPIDERS,id))])];
 s.seenEnemies=[...new Set((Array.isArray(r.seenEnemies)?r.seenEnemies:[]).filter(id=>Object.prototype.hasOwnProperty.call(HUMANS,id)))];
 for(let id=1;id<=LEVEL_COUNT;id++){const d=r.done?.[id];if(d&&typeof d==='object')s.done[id]={wins:Math.floor(clamp(d.wins,0,1e6)),bestTime:clamp(d.bestTime,0,1e7)};if(Number.isFinite(r.attempts?.[id]))s.attempts[id]=Math.floor(clamp(r.attempts[id],0,1e6));}
 s.rewards={silk:Math.floor(clamp(r.rewards?.silk,0,1e9)),trophy:r.rewards?.trophy===true,bonus:r.rewards?.bonus===true};
 s.volume=clamp(r.volume,0,1,.65);s.muted=r.muted===true;s.introSeen=r.introSeen===true;s.finaleSeen=r.finaleSeen===true;
 const t=r.settings||{},d=defaultSettings();
 s.settings={music:clamp(t.music,0,1,d.music),sfx:clamp(t.sfx,0,1,d.sfx),shake:typeof t.shake==='boolean'?t.shake:d.shake,flashes:typeof t.flashes==='boolean'?t.flashes:d.flashes,hints:t.hints!==false};
 return s;
}
/* Storage fallback: localStorage when a probe write succeeds, otherwise (blocked cookies, sandboxed iframe,
   quota) an in-memory stand-in, so progress and settings still survive screen changes for this session. */
const memory=new Map();
export const memoryStorage={getItem:k=>memory.has(k)?memory.get(k):null,setItem:(k,v)=>{memory.set(k,String(v));},removeItem:k=>{memory.delete(k);}};
let active=null;
/** `candidate` if a probe write works, otherwise the in-memory store. */
export function pickStorage(candidate){try{const probe='__svh_probe';candidate.setItem(probe,'1');candidate.removeItem?.(probe);return candidate;}catch{return memoryStorage;}}
export function defaultStorage(){if(!active){try{active=pickStorage(globalThis.localStorage);}catch{active=memoryStorage;}}return active;} // the getter itself may throw
/** False when the game runs on the in-memory fallback (progress is lost when the tab closes). */
export const storagePersistent=()=>defaultStorage()!==memoryStorage;
/** Safe read, backing up corrupt JSON when possible. */
export function loadSave(storage){try{storage??=defaultStorage();const text=storage.getItem(KEY);if(!text)return defaults();try{return validate(JSON.parse(text));}catch{try{storage.setItem(KEY+'_corrupt',text);}catch{}return defaults();}}catch{return defaults();}}
/** Persist validated progress; storage failure is non-fatal. */
export function writeSave(save,storage){const own=storage===undefined;let text='';try{storage??=defaultStorage();text=JSON.stringify(validate(save));storage.setItem(KEY,text);return storage!==memoryStorage;}
 catch{if(own&&text&&storage!==memoryStorage){active=memoryStorage;memoryStorage.setItem(KEY,text);}return false;}}
/** Apply a collected victory reward before displaying results. */
export function recordWin(save,level,stats){
 const old=save.done[level.id];save.done[level.id]={wins:(old?.wins||0)+1,bestTime:Math.min(old?.bestTime??Infinity,stats.time)};
 save.unlocked=Math.min(LEVEL_COUNT,Math.max(save.unlocked,level.id+1));save.last=Math.min(LEVEL_COUNT,level.id+1);
 const reward=level.reward;
 if(reward.kind==='spider'&&!save.spiders.includes(reward.id))save.spiders.push(reward.id);
 if(reward.kind==='silk')save.rewards.silk+=reward.amount;
 if(reward.kind==='trophy'){if(reward.id==='bonus')save.rewards.bonus=true;else save.rewards.trophy=true;}
 return save;
}
/** Compatibility audio settings reader (master volume, mute and the v2 mix). */
export function readAudioSettings(storage){const s=loadSave(storage);return {volume:s.volume,muted:s.muted,music:s.settings.music,sfx:s.settings.sfx};}
/** Preserve progression while changing audio settings. */
export function writeAudioSettings(settings,storage){const s=loadSave(storage);writeSave({...s,volume:settings.volume,muted:settings.muted,settings:{...s.settings,music:settings.music??s.settings.music,sfx:settings.sfx??s.settings.sfx}},storage);}
/** Persist presentation settings without touching progression. */
export function writeSettings(settings,storage){const s=loadSave(storage);writeSave({...s,settings:{...s.settings,...settings}},storage);}
