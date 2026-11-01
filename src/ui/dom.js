// Write-on-change helpers for UI updated every frame: unchanged values never touch the DOM,
// so the HUD does not invalidate style/layout 60 times a second.
const styles=new WeakMap();
export function setText(el,value){value=String(value);if(el.textContent!==value)el.textContent=value;}
export function setHidden(el,hidden){hidden=!!hidden;if(el.hidden!==hidden)el.hidden=hidden;}
export function setDisabled(el,disabled){disabled=!!disabled;if(el.disabled!==disabled)el.disabled=disabled;}
/** Inline style property (CSS name, e.g. 'translate', '--cd'); only this helper may write it. */
export function setStyle(el,prop,value){let cache=styles.get(el);if(!cache)styles.set(el,cache={});if(cache[prop]!==value){cache[prop]=value;el.style.setProperty(prop,value);}}
