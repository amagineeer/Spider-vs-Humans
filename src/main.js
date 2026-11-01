import {ASSETS} from './data/assets_manifest.js';
import {SPIDERS} from './data/spiders.js';
import {HUMANS} from './data/humans.js';
import {BALANCE,OUTCOME,FLOW,PRESENTATION} from './data/balance.js';
import {place,catchFly,removeSpider} from './game/state.js';
import {cellAt} from './game/grid.js';
import {startLoop} from './game/loop.js';
import {render} from './render/renderer.js';
import {GameAudio} from './audio/audio.js';
import {createEvents} from './core/events.js';
import {createMachine} from './core/state.js';
import {LevelManager} from './core/levelManager.js';
import {loadSave,writeSave,defaults,storagePersistent} from './storage/save.js';
import {CUTSCENES} from './data/cutscenes.js';
import {createCutsceneView} from './ui/cutscene.js';
import {settingsScreen} from './ui/settings.js';
import {almanac,cardTitle} from './ui/almanac.js';
import {createFeedback} from './render/feedback.js';
import {VIEW} from './render/people.js';
import {formatTime} from './ui/results.js';
import {levelSelect} from './ui/levelSelect.js';
import {results} from './ui/results.js';
import {bindMenu,startLevel} from './ui/menu.js';
import {hud} from './ui/hud.js';
import {bindBanner} from './ui/banner.js';
import {progressBar} from './ui/progressBar.js';
import {setText,setHidden,setStyle} from './ui/dom.js';
import {LEVELS,LEVEL_COUNT,CAMPAIGN_LAST,BONUS_ID} from './data/levels.js';
const $=id=>document.getElementById(id),images={},audio=new GameAudio(),bus=createEvents(),machine=createMachine(bus);
const query=new URLSearchParams(location.search),debug=query.get('debug')==='1';
let loop,drag=null,preview=null,simSpeed=1,hitboxes=false;
if(debug){const tools=document.createElement('div');tools.id='debugTools';for(const [key,text] of [['n','N · Победа'],['l','L · Прорыв'],['w','W · Волна'],['b','B · Толпа'],['k','K · Убить людей'],['u','U · Открыть уровни'],['+','+ · Скорость'],['f','F · Хитбоксы']]){const b=document.createElement('button');b.textContent=text;b.onclick=()=>handleKey({key,target:b,preventDefault(){}});tools.append(b);}document.body.append(tools);}
const progress=progressBar($('waveProgress')),banner=bindBanner(bus,$('banner'));
window.setLoadingProgress=value=>{const percent=Math.round(Math.max(0,Math.min(1,value))*100);$('loadingProgress').value=percent;$('loadingProgress').textContent=percent+'%';$('loadingArtPercent').textContent=percent+'%';$('loading').style.setProperty('--loading-progress',percent+'%');$('loadingText').textContent=percent+'%';};
function loadImage(id,item){if(images[id])return Promise.resolve();return new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>{images[id]=img;resolve();};img.onerror=()=>reject(Error(item.path));img.src=item.path;});}
const loadingFailures=[],tasks=[...Object.entries(ASSETS).map(([id,item])=>()=>loadImage(id,item)),()=>document.fonts.load('24px GoldBubble','SvH Пауза 0123456789'),()=>document.fonts.load('24px "GoldBubble Mono"','Шёлк 0123456789')];
let loaded=0;
await Promise.all(tasks.map(async task=>{let timer;try{await Promise.race([Promise.resolve().then(task),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('Ресурс недоступен')),15000);})]);}catch(error){loadingFailures.push(error.message);}finally{clearTimeout(timer);window.setLoadingProgress(++loaded/tasks.length);}}));
function withAudio(save){save.volume=audio.settings.volume;save.muted=audio.settings.muted;save.settings={...save.settings,music:audio.settings.music,sfx:audio.settings.sfx};return save;}
const manager=new LevelManager({bus,machine,save:loadSave(),debug,persist:save=>{writeSave(withAudio(save));},resetClock:()=>loop?.reset(),cleanup:()=>{audio.stopAll();preview=null;drag=null;progress.reset();feedback.reset();$('enemyCard').hidden=true;$('reward').hidden=true;$('banner').hidden=true;$('brief').hidden=true;setStyle($('game'),'transform','');setStyle($('canvas'),'translate','');},assets:async level=>{window.setLoadingProgress(0);if(!images[level.background])await loadImage(level.background,ASSETS[level.background]);window.setLoadingProgress(1);}});
const world=()=>manager.world,playing=()=>machine.current==='PLAYING';
function command(fn){bus.emit('world:command',fn);}
function cancel(){if(drag)drag.button.classList.remove('dragging');drag=null;preview=null;if(world())world().selected=null;}
function point(e){const r=$('canvas').getBoundingClientRect();return {x:(e.clientX-r.left)*1600/r.width,y:(e.clientY-r.top)*900/r.height};}
function updatePreview(e,id){const p=point(e),cell=cellAt(p.x,p.y),s=world(),d=SPIDERS[id];preview=cell?{id,...cell,valid:playing()&&s.level.lanes.includes(cell.row)&&!s.grid[cell.row][cell.col]&&s.silk>=d.cost&&!(s.cooldowns[id]>0)}:null;}
for(const [id,d] of Object.entries(SPIDERS)){
 const b=document.createElement('button');b.dataset.id=id;b.className='spider-card';b.title=cardTitle(id);b.setAttribute('aria-label',`${d.name}, ${d.cost} шёлка`);
 const key=document.createElement('span');key.className='card-key';
 const img=document.createElement('img');img.className='card-art';img.src=ASSETS[d.asset].path;img.alt='';img.draggable=false;
 const label=document.createElement('span');label.className='card-label';const name=document.createElement('span');name.className='card-name';name.textContent=d.name;
 const cost=document.createElement('span');cost.className='card-cost';const value=document.createElement('span');value.className='card-cost-value';value.textContent=d.cost;
 const web=document.createElement('img');web.className='silk-icon';web.src=ASSETS.silkWeb.path;web.alt='шёлка';web.draggable=false;
 const cooldown=document.createElement('span');cooldown.className='card-cooldown';cost.append(value,web);label.append(name,cost);b.append(key,img,label,cooldown);
 b.onpointerdown=e=>{if(e.button!==0||!playing())return;drag={id,button:b,pointer:e.pointerId,x:e.clientX,y:e.clientY,moved:false};b.setPointerCapture(e.pointerId);};
 b.onpointermove=e=>{if(!drag||drag.pointer!==e.pointerId)return;if(Math.hypot(e.clientX-drag.x,e.clientY-drag.y)>5)drag.moved=true;if(drag.moved){b.classList.add('dragging');updatePreview(e,id);}};
 b.onpointerup=e=>{if(!drag||drag.pointer!==e.pointerId)return;const moved=drag.moved,was=world()?.selected;cancel();if(!playing())return;if(moved){const p=point(e),cell=cellAt(p.x,p.y);if(cell)command(s=>place(s,cell.row,cell.col,id));}else command(s=>{s.selected=was===id?null:id;});};b.onpointercancel=cancel;$('cards').append(b);
}
$('canvas').onpointermove=e=>{if(playing()&&world().selected&&world().selected!=='net')updatePreview(e,world().selected);};$('canvas').onpointerleave=()=>{if(!drag)preview=null;};$('canvas').oncontextmenu=e=>{e.preventDefault();cancel();};
$('canvas').onclick=e=>{if(!['PLAYING','WIN_REWARD'].includes(machine.current))return;const p=point(e);command(s=>{const fly=s.flies.find(f=>Math.hypot(f.x-p.x,f.y-p.y)<45);if(fly){catchFly(s,fly);return;}if(!playing())return;const cell=cellAt(p.x,p.y);if(cell&&s.selected){if(s.selected==='net')removeSpider(s,cell.row,cell.col);else place(s,cell.row,cell.col,s.selected);}});};
bindMenu(manager,machine);
// ?debug=1 exposes the live objects for QA scripts (tools/qa/smoke.mjs); never in normal play.
if(debug)globalThis.svh={manager,machine,audio,bus};
const feedback=createFeedback({audio,settings:()=>manager.save.settings});
const cutscene=createCutsceneView({root:$('cutscene'),audio,onMuteChange:muted=>{audio.setMuted(muted);audioControls();}});
/** Play a cutscene, mark it seen, then continue with `then` (level id, 'menu' or 'finale'). */
async function playCutscene(id,then){if(!machine.go('CUTSCENE'))return;const def=query.get('cutscene')==='fallback'?{...CUTSCENES[id],sources:[]}:CUTSCENES[id];const result=await cutscene.play(def);bus.emit('cutscene:done',{id,reason:result.reason});if(id==='intro'&&!manager.save.introSeen){manager.save.introSeen=true;manager.persist(manager.save);}if(then==='menu')machine.go('MENU');else if(then==='finale')machine.go('FINALE');else manager.load(then);}
$('start').onclick=()=>{const id=startLevel(manager.save);if(id===1&&!manager.save.introSeen&&!manager.save.done[1])playCutscene('intro',1);else manager.load(id);};
$('prologue').onclick=()=>playCutscene('intro','menu');$('settingsButton').onclick=()=>machine.go('SETTINGS');$('almanacButton').onclick=()=>machine.go('ALMANAC');
$('finalBonus').onclick=()=>manager.load(BONUS_ID);$('finalPrologue').onclick=()=>playCutscene('intro','finale');
function applySettings(next){Object.assign(manager.save.settings,next);VIEW.flashes=manager.save.settings.flashes;manager.persist(manager.save);}
VIEW.flashes=manager.save.settings.flashes;
function drawFinale(){if(!manager.save.finaleSeen){manager.save.finaleSeen=true;manager.persist(manager.save);}const box=$('finaleStats');box.replaceChildren();const done=LEVELS.filter(l=>l.id<=CAMPAIGN_LAST&&manager.save.done[l.id]);const total=done.reduce((n,l)=>n+manager.save.done[l.id].bestTime,0),tries=Object.values(manager.save.attempts).reduce((n,v)=>n+v,0);for(const [value,label] of [[`${done.length} / ${CAMPAIGN_LAST}`,'комнат отстояно'],[formatTime(total),'сумма лучших времён'],[String(tries),'поражений по пути'],[String(manager.save.rewards?.silk||0),'шёлка в коконах']]){const d=document.createElement('div');d.className='stat';const b=document.createElement('b');b.textContent=value;const span=document.createElement('span');span.textContent=label;d.append(b,span);box.append(d);}$('finalBonus').hidden=manager.save.unlocked<BONUS_ID;document.querySelector('.finale-bonus').hidden=manager.save.unlocked<BONUS_ID||!!manager.save.done[BONUS_ID];}
$('pause').onclick=()=>{cancel();manager.pause();};$('resume').onclick=()=>manager.resume();$('pauseRestart').onclick=()=>manager.restart();$('pauseMenu').onclick=()=>manager.exitToMenu();$('pauseLevels').onclick=()=>{manager.unload();machine.go('LEVEL_SELECT');};$('menuButton').onclick=()=>manager.exitToMenu();$('net').onclick=()=>{if(playing())command(s=>{s.selected=s.selected==='net'?null:'net';});};
$('reward').onclick=()=>manager.collectReward();$('enemyCard').onclick=()=>{manager.acceptEnemy();$('enemyCard').hidden=true;};$('finalMenu').onclick=()=>manager.exitToMenu();
function drawSelect(){levelSelect($('levelSelect'),manager.save,id=>manager.load(id),()=>{const old=manager.save;manager.save=withAudio({...defaults(),settings:old.settings,introSeen:old.introSeen});writeSave(manager.save);drawSelect();},()=>machine.go('MENU'));}
bus.on('state:change',({current})=>{
 cancel();document.body.dataset.state=current;const inGame=['INTRO','PLAYING','PAUSED','WIN_REWARD','LOSING'].includes(current);
 (current==='PAUSED'?$('pauseAudio'):$('topbar')).append($('audioControls'));
 if(current==='MENU'){const next=startLevel(manager.save),level=LEVELS.find(l=>l.id===next);$('start').textContent=next>1||manager.save.done[1]?`Продолжить · ${level.title}`:'Играть';setHidden($('storageNotice'),storagePersistent());}
 for(const [id,visible] of Object.entries({menu:current==='MENU',levelSelect:current==='LEVEL_SELECT',game:inGame,result:current.startsWith('RESULTS'),finale:current==='FINALE',settings:current==='SETTINGS',almanac:current==='ALMANAC'}))$(id).hidden=!visible;
 if(current==='MENU'&&!manager.save.introSeen&&!query.has('level'))cutscene.prime(CUTSCENES.intro);
 if(current==='SETTINGS')settingsScreen($('settings'),{audio,save:manager.save,apply:applySettings,back:()=>machine.go('MENU')});
 if(current==='ALMANAC')almanac($('almanac'),manager.save,()=>machine.go('MENU'));
 if(current==='FINALE')drawFinale();
 $('pausePanel').hidden=current!=='PAUSED';$('levelLoading').hidden=current!=='LOADING';
 if(current==='LEVEL_SELECT')drawSelect();
 if(current==='INTRO'&&manager.enemyCard){const d=HUMANS[manager.enemyCard],card=$('enemyCard');card.replaceChildren();const panel=document.createElement('span');panel.className='panel';const art=document.createElement('img');art.src=ASSETS[d.asset]?.path||'';art.alt='';const text=document.createElement('span');text.innerHTML='<span class="eyebrow">Новый враг</span><h2></h2><p></p><span class="tap">Нажмите, чтобы продолжить</span>';text.querySelector('h2').textContent=d.name;text.querySelector('p').textContent=d.description;panel.append(art,text);card.append(panel);card.setAttribute('aria-label',`Новый враг: ${d.name}. ${d.description}`);card.hidden=false;}
 if(current==='RESULTS_WIN'||current==='RESULTS_LOSE'){results($('result'),manager,current==='RESULTS_WIN');audio.effect(current==='RESULTS_WIN'?'win':'loss');}
 if(!['PLAYING','WIN_REWARD'].includes(current))audio.stopAll();
});
bus.on('level:loaded',s=>{if(debug&&query.has('wave'))s.director.seek(Math.max(0,Number(query.get('wave'))-1),s);});bus.on('level:error',text=>{$('status').textContent='Не удалось загрузить уровень: '+text;});
function audioControls(){$('volume').value=Math.round(audio.settings.volume*100);$('volumeValue').textContent=$('volume').value+'%';$('mute').querySelector('.sr-only').textContent=audio.settings.muted?'Звук: выкл.':'Звук: вкл.';$('mute').title=audio.settings.muted?'Включить звук':'Выключить звук';$('mute').setAttribute('aria-pressed',String(audio.settings.muted));}
$('mute').onclick=()=>{audio.setMuted(!audio.settings.muted);audioControls();};$('volume').oninput=e=>{audio.setVolume(Number(e.target.value)/100);audioControls();};document.addEventListener('pointerdown',()=>{void audio.unlock();},{capture:true});document.addEventListener('keydown',()=>{void audio.unlock();},{capture:true});audioControls();
document.addEventListener('visibilitychange',()=>{if(document.hidden){manager.pause();cancel();}});
let briefLevel=null;
/** Level goal card: during the intro and the first seconds of play (setting "Подсказки уровней"). */
function updateBrief(s,state){const el=$('brief'),lead=s.level.id<=2?12:8,show=manager.save.settings.hints&&(state==='INTRO'&&!manager.enemyCard||(state==='PLAYING'&&s.time<lead));
 if(show&&briefLevel!==s){briefLevel=s;el.querySelector('.eyebrow').textContent=s.level.title;el.querySelector('h3').textContent=s.level.goal;el.querySelector('.brief-story').textContent=s.level.story;el.querySelector('.brief-goal').textContent=s.level.boss?'Победа — когда основатель уснёт.':s.level.bonus?'Бонусная ночь: 15 волн.':`Волн: ${s.level.waves}. Награда: ${s.level.reward.kind==='spider'?'новый паук':s.level.reward.kind==='trophy'?'трофей':'кокон шёлка'}.`;el.querySelector('.brief-keys').textContent=s.level.id>2?'':matchMedia('(hover:none) and (pointer:coarse)').matches?'Коснитесь карточки, затем клетки. Касайтесь мух — это шёлк.':'Перетащите карточку на клетку (или цифра + клик). Ловите мух — это шёлк. Q — сачок, Esc — пауза.';}
 setHidden(el,!show);}
function handleKey(e){
 if(machine.current==='CUTSCENE'){cutscene.handleKey(e);return;}
 if(e.target instanceof Element&&e.target.matches('input'))return;const key=e.key.toLowerCase(),s=world();
 if(['SETTINGS','ALMANAC'].includes(machine.current)&&key==='escape'){machine.go('MENU');return;}
 if(debug&&s){if(key==='n'&&playing()){s.humans.length=0;s.director.pending.length=0;s.director.allReleased=true;s.director.phase='CLEANUP';s.director.index=s.level.waves-1;if(s.boss)s.boss.hp=0;}if(key==='l'&&playing()){s.tapes.length=0;s.humans.push({type:'basic',row:s.level.lanes[0],x:OUTCOME.LOSE_X,hp:HUMANS.basic.hp,armor:0,speedMul:1});}if(key==='k')for(const h of s.humans)h.hp=0;if(key==='w')s.director.seek(s.director.index+1,s);if(key==='b')s.director.seek(s.level.bigWaves.find(i=>i>s.director.index)??s.level.waves-1,s);if(key==='u'){manager.save.unlocked=LEVEL_COUNT;writeSave(manager.save);}if(key==='f')hitboxes=!hitboxes;if(['+','=','-'].includes(key)){simSpeed=Math.max(BALANCE.debugMin,Math.min(BALANCE.debugMax,simSpeed+(key==='-'?-BALANCE.debugStep:BALANCE.debugStep)));loop.setSpeed(simSpeed);}}
 if(playing()&&s){if(/^[1-9]$/.test(key)){const visible=[...$('cards').children].filter(b=>!b.hidden),b=visible[Number(key)-1];if(b){cancel();command(w=>{w.selected=w.selected===b.dataset.id?null:b.dataset.id;});}return;}if(key==='q'){cancel();command(w=>{w.selected=w.selected==='net'?null:'net';});return;}}
 if(['PLAYING','INTRO'].includes(machine.current)&&['escape','p'].includes(key)){e.preventDefault();manager.pause();cancel();return;}if(machine.current==='PAUSED'&&['escape','p'].includes(key)){manager.resume();return;}
 if(machine.current==='RESULTS_WIN'){if(key==='enter')manager.next();if(key==='r')manager.restart();if(key==='escape')manager.exitToMenu();}else if(machine.current==='RESULTS_LOSE'){if(key==='enter'||key==='r')manager.restart();if(key==='escape')manager.exitToMenu();}
}
document.addEventListener('keydown',handleKey);
$('loadingTitle').textContent='Комната готова';$('loadingText').textContent=loadingFailures.length?`Недоступно ресурсов: ${loadingFailures.length}`:'Загрузка завершена · 100%';$('loadingContinue').disabled=false;globalThis.__svhBooted?.();$('loadingContinue').onclick=()=>{$('loading').hidden=true;document.body.classList.remove('loading-active');machine.go('MENU');const id=Number(query.get('level'));if(id)manager.load(id);};
loop=startLoop(dt=>{const active=machine.current;if(active==='PLAYING'&&feedback.holding(dt))return;manager.update(dt);if(!['PAUSED','MENU','LEVEL_SELECT'].includes(active))banner.update(dt);},dt=>{
 const s=world(),state=machine.current;if(!s)return;setText($('status'),`${s.level.title} · Попытка ${manager.attempt}`);hud(s,playing());audio.sync(s,state==='PLAYING'?'game':state==='PAUSED'?'pause':'menu');
 feedback.consume(s);const shake=feedback.update(dt);setStyle($('canvas'),'translate',shake.x||shake.y?`${(shake.x/16).toFixed(3)}% ${(shake.y/9).toFixed(3)}%`:'');
 if(['INTRO','PLAYING','PAUSED','WIN_REWARD','LOSING'].includes(state))render($('canvas').getContext('2d'),s,images,preview,{hitboxes,rewardTime:state==='WIN_REWARD'?manager.timer:null});progress.draw(s,dt);
 updateBrief(s,state);setHidden($('reward'),state!=='WIN_REWARD'||manager.rewardCollected);if(!$('reward').hidden){const r=manager.reward;$('reward').style.translate=`0 ${-Math.abs(Math.sin(manager.timer*PRESENTATION.rewardBounceRate))*PRESENTATION.rewardBounce}px`;$('reward').style.filter=`brightness(${1+PRESENTATION.rewardGlow*Math.sin(manager.timer*PRESENTATION.rewardGlowRate)})`;$('reward').style.left=`${r.x/1600*100}%`;$('reward').style.top=`${r.y/900*100}%`;setText($('reward'),s.level.reward.kind==='spider'?'Новый паук!':s.level.reward.kind==='trophy'?'Трофей':'Кокон шёлка');}
 const flash=state==='WIN_REWARD'&&manager.rewardCollected?Math.max(0,1-manager.timer/OUTCOME.rewardFlash):0,fade=state==='LOSING'?Math.max(0,(manager.timer-OUTCOME.loseWalk-OUTCOME.shake)/OUTCOME.fade):0;
 const flowFade=state==='LOADING'?(manager.stage==='out'?manager.timer/FLOW.fade:manager.stage==='in'?1-manager.timer/FLOW.fade:1):0;setStyle($('screenFade'),'opacity',Math.min(1,Math.max(flash,fade,flowFade)).toFixed(3));setStyle($('screenFade'),'background',flash&&manager.save.settings.flashes?'#fff5ca':'#100d19');setStyle($('game'),'transform',state==='LOSING'&&manager.save.settings.shake&&manager.timer>OUTCOME.loseWalk&&manager.timer<OUTCOME.loseWalk+OUTCOME.shake?`translateX(${Math.sin(manager.timer*PRESENTATION.shakeRate)*PRESENTATION.shakeDistance}px)`:'');
 setHidden($('debug'),!debug);if(debug){const d=s.director,w=d.waves[d.index];$('debug').textContent=`${state} · L${manager.current} · ×${simSpeed}\nwave ${d.index+1}/${s.level.waves} ${w?.big?'big':''} ${w?.final?'final':''} · ${d.phase}\nnext ${Math.max(0,d.B.waveDuration-(d.elapsed-(d.waveStart||0))).toFixed(1)} · budget ${w?.budget||0}\nspeedMul ${d.lastSpeedMul.toFixed(3)} · alive ${s.humans.filter(h=>h.hp>0).length} · hpRatio ${d.hpRatio(s).toFixed(2)} · tapes ${s.tapes.filter(t=>t.status==='ready').length}`;}
},{onError:error=>{try{manager.pause();audio.stopAll();}catch{}globalThis.__svhFail?.('Ошибка в игровом цикле: '+(error?.message||error));}});
