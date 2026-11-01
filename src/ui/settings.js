/** Settings screen: master / music / effects volume, mute, screen shake, flashes, hints. */
export function settingsScreen(root,{audio,save,apply,back}){
 root.replaceChildren();const wrap=document.createElement('div');wrap.className='panel settings-card';
 const head=document.createElement('div');head.className='levels-head';head.innerHTML='<div><p class="eyebrow">Игра</p><h2>Настройки</h2></div>';const close=document.createElement('button');close.className='btn btn-ghost';close.textContent='Готово';close.onclick=back;head.append(close);wrap.append(head);
 const slider=(id,label,hint,value,onInput)=>{const row=document.createElement('div');row.className='setting';const l=document.createElement('label');l.htmlFor=id;l.textContent=label;if(hint){const s=document.createElement('small');s.textContent=hint;l.append(s);}
  const box=document.createElement('div');box.className='setting-row';const input=document.createElement('input');input.type='range';input.id=id;input.min='0';input.max='100';input.step='1';input.value=String(Math.round(value*100));const out=document.createElement('output');out.htmlFor=id;out.textContent=input.value+'%';
  input.oninput=()=>{out.textContent=input.value+'%';onInput(Number(input.value)/100);};box.append(input,out);row.append(l,box);return row;};
 const toggle=(label,hint,value,onChange)=>{const row=document.createElement('div');row.className='setting';const l=document.createElement('span');l.textContent=label;if(hint){const s=document.createElement('small');s.textContent=hint;l.append(s);}
  const b=document.createElement('button');b.className='toggle';b.setAttribute('role','switch');b.setAttribute('aria-checked',String(value));b.setAttribute('aria-label',label);b.onclick=()=>{const v=b.getAttribute('aria-checked')!=='true';b.setAttribute('aria-checked',String(v));onChange(v);};row.append(l,b);return row;};
 const s=audio.settings,set=save.settings;
 wrap.append(
  slider('setMaster','Общая громкость','',s.volume,v=>audio.setVolume(v)),
  slider('setMusic','Музыка','',s.music??.8,v=>audio.setMusic(v)),
  slider('setSfx','Звуки боя','Удары, броня, клубки шёлка',s.sfx??.9,v=>audio.setSfx(v)),
  toggle('Звук включён','',!s.muted,v=>audio.setMuted(!v)),
  toggle('Тряска экрана','Взрывы каракурта, сломанная броня, лента',set.shake,v=>apply({shake:v})),
  toggle('Вспышки','Яркие вспышки при попаданиях и наградах',set.flashes,v=>apply({flashes:v})),
  toggle('Подсказки уровней','Цель и совет в начале каждой комнаты',set.hints,v=>apply({hints:v})),
 );
 const keys=document.createElement('p');keys.className='keys';keys.textContent='Клавиши в бою: 1–5 — карточки, Q — сачок, Esc/P — пауза, правый клик — отмена.';wrap.append(keys);
 root.append(wrap);
}
