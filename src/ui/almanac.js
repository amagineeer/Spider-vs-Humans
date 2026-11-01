import {SPIDERS} from '../data/spiders.js';
import {HUMANS} from '../data/humans.js';
import {ASSETS} from '../data/assets_manifest.js';
import {SPIDER_INFO,HUMAN_INFO} from '../data/almanac.js';
import {LEVELS} from '../data/levels.js';
const fmt=n=>Number.isInteger(n)?String(n):n.toFixed(1).replace('.',',');
function spiderStats(id){const d=SPIDERS[id],rows=[['Цена',`${d.cost} шёлка`],['Перезарядка',`${fmt(d.cooldown)} с`],['Здоровье',fmt(d.hp)]];
 if(d.damage&&d.period)rows.push(['Урон',`${d.damage} за ${fmt(d.period)} с (${fmt(d.damage/d.period)}/с)`]);
 if(d.production)rows.push(['Шёлк',`+${d.production} каждые ${d.period} с`]);
 if(d.slowFactor)rows.push(['Замедление',`×${fmt(d.slowFactor)} на ${fmt(d.slowDuration)} с`]);
 if(d.armTime)rows.push(['Укус',`${d.damage} урона, взвод ${d.armTime} с`]);return rows;}
function humanStats(id){const d=HUMANS[id],rows=[['Здоровье',fmt(d.hp)]];if(d.armor)rows.push(['Броня',fmt(d.armor)]);
 if(d.speed)rows.push(['Скорость',`${fmt(d.speed)} клетки/с`]);rows.push(['Удар',`${d.damage} каждые ${fmt(d.attackPeriod||d.summonPeriod||1)} с`]);
 if(d.summonPeriod)rows.push(['Призыв',`${d.summonCount} агента каждые ${d.summonPeriod} с`]);return rows;}
/** Spiders unlock with the campaign roster; humans once they have been met (enemy card shown). */
export function almanac(root,save,back){
 let tab='spiders',selected=null;
 const known={spiders:id=>save.spiders.includes(id)||LEVELS.some(l=>l.id<=save.unlocked&&l.spiders.includes(id)),humans:id=>id==='basic'||save.seenEnemies.includes(id)||(id==='agent'&&save.seenEnemies.includes('boss'))};
 function draw(){
  root.replaceChildren();const wrap=document.createElement('div');wrap.className='panel almanac-card';
  const head=document.createElement('div');head.className='levels-head';head.innerHTML='<div><p class="eyebrow">Справочник</p><h2>Альманах</h2></div>';const close=document.createElement('button');close.className='btn btn-ghost';close.textContent='В меню';close.onclick=back;head.append(close);wrap.append(head);
  const tabs=document.createElement('div');tabs.className='almanac-tabs';tabs.setAttribute('role','tablist');
  for(const [key,label] of [['spiders','Пауки'],['humans','Люди']]){const b=document.createElement('button');b.className='btn btn-small';b.textContent=label;b.setAttribute('role','tab');b.setAttribute('aria-selected',String(tab===key));b.onclick=()=>{tab=key;selected=null;draw();};tabs.append(b);}
  wrap.append(tabs);
  const ids=tab==='spiders'?Object.keys(SPIDER_INFO):Object.keys(HUMAN_INFO),grid=document.createElement('div');grid.className='almanac-grid';
  selected??=ids.find(id=>known[tab](id));
  for(const id of ids){const open=known[tab](id),d=tab==='spiders'?SPIDERS[id]:HUMANS[id],b=document.createElement('button');b.className='almanac-item'+(open?'':' locked');b.setAttribute('aria-pressed',String(selected===id));b.disabled=!open;
   const img=document.createElement('img');img.alt='';img.src=(tab==='humans'&&id==='boss'?ASSETS.bossPortrait?.path:ASSETS[d.asset||id]?.path)||'';img.loading='lazy';
   const name=document.createElement('span');name.textContent=open?d.name:'???';b.append(img,name);b.onclick=()=>{selected=id;draw();};grid.append(b);}
  wrap.append(grid);
  if(selected){const d=tab==='spiders'?SPIDERS[selected]:HUMANS[selected],info=tab==='spiders'?SPIDER_INFO[selected]:HUMAN_INFO[selected],box=document.createElement('div');box.className='almanac-detail';
   const h=document.createElement('h3');h.textContent=d.name+(info.role?` · ${info.role}`:'');const p=document.createElement('p');p.textContent=info.text||d.description||'';const tip=document.createElement('p');tip.textContent='Совет: '+info.tip;
   const dl=document.createElement('dl');for(const [k,v] of (tab==='spiders'?spiderStats(selected):humanStats(selected))){const dt=document.createElement('dt');dt.textContent=k;const dd=document.createElement('dd');dd.textContent=v;dl.append(dt,dd);}
   if(info.first){const dt=document.createElement('dt');dt.textContent='Впервые';const dd=document.createElement('dd');dd.textContent=LEVELS[info.first-1].title;dl.append(dt,dd);}
   box.append(h,p,dl,tip);wrap.append(box);}
  root.append(wrap);
 }
 draw();
}
/** Short tooltip for a spider card. */
export function cardTitle(id){const d=SPIDERS[id],i=SPIDER_INFO[id];return `${d.name} — ${i?.text||''} Цена ${d.cost}, перезарядка ${fmt(d.cooldown)} с.`;}
