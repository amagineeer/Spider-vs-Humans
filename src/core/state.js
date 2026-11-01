export const TRANSITIONS={BOOT:['MENU'],MENU:['LEVEL_SELECT','LOADING','CUTSCENE','SETTINGS','ALMANAC'],CUTSCENE:['MENU','LOADING','FINALE'],SETTINGS:['MENU'],ALMANAC:['MENU'],LEVEL_SELECT:['MENU','LOADING'],LOADING:['INTRO','MENU'],INTRO:['PLAYING','PAUSED','LOADING','MENU'],PLAYING:['PAUSED','WIN_REWARD','LOSING','LOADING','MENU'],PAUSED:['PLAYING','INTRO','LOADING','MENU','LEVEL_SELECT'],WIN_REWARD:['RESULTS_WIN','MENU'],LOSING:['RESULTS_LOSE','MENU'],RESULTS_WIN:['LOADING','MENU','FINALE'],RESULTS_LOSE:['LOADING','MENU'],FINALE:['MENU','LOADING','CUTSCENE']};
/** Explicit screen state machine, independent of the DOM. */
export function createMachine(bus){
 let current='BOOT';const enter=new Map(),exit=new Map();
 const subscribe=(map,state,fn)=>{if(!map.has(state))map.set(state,new Set());map.get(state).add(fn);return ()=>map.get(state).delete(fn);};
 return {
  get current(){return current;},
  /** Transition only along an allowed edge. */
  go(next,payload){if(!TRANSITIONS[current]?.includes(next)){console.warn(`Ignored transition ${current} → ${next}`);return false;}for(const fn of exit.get(current)||[])fn(payload);const previous=current;current=next;bus.emit('state:change',{previous,current,payload});for(const fn of enter.get(next)||[])fn(payload);return true;},
  /** Subscribe to entry. */
  onEnter(state,fn){return subscribe(enter,state,fn);},
  /** Subscribe to exit. */
  onExit(state,fn){return subscribe(exit,state,fn);},
 };
}
