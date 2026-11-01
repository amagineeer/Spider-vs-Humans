// Free-list object pool for short-lived combat objects (projectiles, one-shot visuals).
// Objects keep one fixed shape (every field is assigned on reuse), so V8 keeps them fast and the
// garbage collector has nothing to sweep in the middle of a fight.
export function createPool(make,limit=512){
 const free=[];
 return {
  acquire(){return free.pop()||make();},
  release(item){if(free.length<limit)free.push(item);},
  get free(){return free.length;},
 };
}
/** Remove items failing `keep` in place (no new array) and hand them back to `pool`. */
export function compact(list,keep,pool){let n=0;for(let i=0;i<list.length;i++){const item=list[i];if(keep(item))list[n++]=item;else pool?.release(item);}list.length=n;return list;}
