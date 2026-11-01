import {LEVELS,CAMPAIGN_LAST} from '../data/levels.js';
import {BACKGROUNDS} from '../data/backgrounds.js';
import {formatTime} from './results.js';
const ICONS={
 day:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M5.3 18.7l1.8-1.8M16.9 7.1l1.8-1.8"/></svg>',
 night:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19.5 14.6A8 8 0 0 1 9.4 4.5a8 8 0 1 0 10.1 10.1z"/></svg>',
 bonus:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.4 6.7 19.4l1.2-6L3.4 9.3l6-.7z"/></svg>'
};
const SECTIONS=[
 {key:'day',title:'День 1–8',filter:l=>l.mode==='day'},
 {key:'night',title:'Ночь 1–7',filter:l=>l.mode==='night'&&!l.bonus},
 {key:'bonus',title:'Бонусная ночь',filter:l=>l.bonus},
];
/** Build accessible campaign cards using only validated save data. */
export function levelSelect(root,save,load,reset,back){root.replaceChildren();const wrap=document.createElement('div');wrap.className='panel levels';
 const head=document.createElement('div');head.className='levels-head';head.innerHTML='<div><p class="eyebrow">Кампания</p><h2>Выберите комнату</h2></div>';const menu=document.createElement('button');menu.className='btn btn-ghost';menu.textContent='В меню';menu.onclick=back;head.append(menu);wrap.append(head);
 for(const section of SECTIONS){const h=document.createElement('h3');h.innerHTML=ICONS[section.key]+`<span>${section.title}</span>`;const grid=document.createElement('div');grid.className='level-grid';
  for(const level of LEVELS.filter(section.filter)){const b=document.createElement('button'),done=save.done[level.id],locked=level.id>save.unlocked,current=level.id===save.unlocked&&!done;
   b.className='level-card'+(done?' done':'')+(current?' current':'')+(level.boss?' boss':'')+(level.bonus?' bonus':'');b.disabled=locked;b.style.setProperty('--thumb',`url('${BACKGROUNDS[level.background]?.path||''}')`);
   const badge=document.createElement('span');badge.className='badge';badge.textContent=locked?'🔒':done?'✓ пройдено':current?'Сейчас':'';if(badge.textContent)b.append(badge);
   const name=document.createElement('span');name.className='name';name.textContent=level.name;
   const room=document.createElement('span');room.className='room';room.textContent=level.room+(level.boss?' · босс':'');
   const meta=document.createElement('span');meta.className='meta';
   meta.textContent=locked?(level.bonus?'Откроется после финала':`Пройдите ${LEVELS[level.id-2].name}`):done?`Лучшее время ${formatTime(done.bestTime)}`:`${level.waves} волн · ${level.lanes.length===1?'1 дорожка':level.lanes.length+' дорожек'}`;
   b.append(name,room,meta);
   b.setAttribute('aria-label',`${level.name}, ${level.room}. ${meta.textContent}`);b.onclick=()=>load(level.id);grid.append(b);}
  wrap.append(h,grid);}
 const foot=document.createElement('div');foot.className='levels-foot';const keys=document.createElement('p');keys.className='keys';const campaignDone=LEVELS.filter(l=>l.id<=CAMPAIGN_LAST&&save.done[l.id]).length;keys.textContent=`Кампания: ${campaignDone} из ${CAMPAIGN_LAST}${save.done[CAMPAIGN_LAST+1]?' · бонус пройден':''}`;const clear=document.createElement('button');clear.className='link-btn';clear.textContent='Сбросить прогресс';clear.onclick=()=>{if(confirm('Сбросить прохождение всех уровней?'))reset();};foot.append(keys,clear);wrap.append(foot);root.append(wrap);
}
