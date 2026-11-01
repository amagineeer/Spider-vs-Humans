import {SPIDERS} from '../data/spiders.js';
import {setText,setHidden,setDisabled,setStyle} from './dom.js';
/** Synchronize card affordability, cooldown sweep and key badges without changing the world (write-on-change). */
export function hud(world,playing){setText(document.getElementById('silkValue'),world.silk);let n=0;
 for(const b of document.getElementById('cards').children){const id=b.dataset.id,d=SPIDERS[id],cd=world.cooldowns[id]||0;setHidden(b,!world.level.spiders.includes(id));if(!b.hidden)n++;
  setDisabled(b,!playing||world.silk<d.cost||cd>0);b.classList.toggle('selected',world.selected===id);b.classList.toggle('poor',world.silk<d.cost);b.classList.toggle('cooling',cd>0);
  setStyle(b,'--cd',cd>0?Math.min(1,cd/d.cooldown).toFixed(3):'0');setText(b.querySelector('.card-cooldown'),cd>0?Math.ceil(cd)+'с':'');setText(b.querySelector('.card-key'),b.hidden?'':String(n));}
 document.getElementById('net').classList.toggle('selected',world.selected==='net');}
