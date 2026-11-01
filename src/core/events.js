/** Create an isolated synchronous event bus. */
export function createEvents(){
 const listeners=new Map();
 const bus={
  /** Subscribe; returns an unsubscribe function. */
  on(type,fn){if(!listeners.has(type))listeners.set(type,new Set());listeners.get(type).add(fn);return ()=>bus.off(type,fn);},
  /** Remove a subscription. */
  off(type,fn){const set=listeners.get(type);set?.delete(fn);if(!set?.size)listeners.delete(type);},
  /** Dispatch against a stable snapshot. */
  emit(type,payload){for(const fn of [...(listeners.get(type)||[])])fn(payload);},
  /** Count all listeners, or listeners of one type. */
  listenerCount(type){return type===undefined?[...listeners.values()].reduce((n,s)=>n+s.size,0):listeners.get(type)?.size||0;},
  /** Own subscriptions as one disposable group. */
  scope(){const disposers=new Set();let disposed=false;return {on(type,fn){if(disposed)throw Error('Disposed event scope');const off=bus.on(type,fn);disposers.add(off);return off;},dispose(){for(const off of disposers)off();disposers.clear();disposed=true;}};},
 };return bus;
}
export const events=createEvents();
