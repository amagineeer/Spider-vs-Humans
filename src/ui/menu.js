import {LEVELS,LEVEL_COUNT} from '../data/levels.js';
/** First unlocked level that is not yet won; otherwise the furthest unlocked one. */
export function startLevel(save){const open=LEVELS.find(l=>l.id<=save.unlocked&&!save.done[l.id]);return open?open.id:Math.min(save.unlocked,LEVEL_COUNT);}
/** Connect menu actions to the single level owner. */
export function bindMenu(manager,machine){document.getElementById('start').onclick=()=>manager.load(startLevel(manager.save));document.getElementById('chooseLevels').onclick=()=>machine.go('LEVEL_SELECT');}
