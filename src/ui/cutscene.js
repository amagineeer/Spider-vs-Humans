// Cutscene playback: a DOM-free controller (unit-tested with a fake <video>) and a thin DOM view.
// Flow: loading -> playing <-> paused -> done. Autoplay refusal -> 'blocked' (tap to play).
// Decode error / stall -> next source -> image slideshow fallback -> done. Skip works in every state.
export const CUTSCENE={stallMs:8000,startMs:12000,fadeMs:450,idleMs:2500};

/** Order sources for this device: small screens and data-saver get the lighter file first. */
export function orderSources(sources,{pixels=1920,saveData=false,canPlay=()=> 'maybe'}={}){
 const playable=sources.filter(s=>!s.type||canPlay(s.type)!=='');
 const light=saveData||pixels<1500;
 return [...playable].sort((a,b)=>light?a.height-b.height:b.height-a.height);
}

export class CutsceneController {
 constructor({video,timers={set:(fn,ms)=>setTimeout(fn,ms),clear:id=>clearTimeout(id)},onChange=()=>{}}){
  this.video=video;this.timers=timers;this.onChange=onChange;this.state='idle';this.done=true;this.slide=-1;this.attempt=0;
 }
 /** Start a cutscene; resolves exactly once with {reason:'ended'|'skipped'|'fallback'|'failed'}. */
 play(def,{sources=def.sources,muted=false,volume=1}={}){
  if(!this.done)this.finish('skipped');
  this.def=def;this.queue=[...sources];this.muted=muted;this.volume=volume;this.done=false;this.slide=-1;this.wasPlaying=false;this.slidePaused=false;
  this.promise=new Promise(resolve=>{this.resolve=resolve;});
  this.listen();this.nextSource();
  return this.promise;
 }
 set(state){this.state=state;this.onChange(state,this);}
 listen(){
  const v=this.video;this.unlisten();
  const on={
   playing:()=>{if(this.done)return;this.armStall(CUTSCENE.stallMs);this.set('playing');},
   pause:()=>{if(!this.done&&this.state==='playing'&&!v.ended){this.clearStall();this.set('paused');}},
   ended:()=>this.finish('ended'),
   error:()=>this.fail(this.attempt),
   waiting:()=>{if(this.state==='playing'||this.state==='loading')this.armStall(CUTSCENE.stallMs);},
   timeupdate:()=>{if(this.done)return;if(v.currentTime!==this.lastTime){this.lastTime=v.currentTime;if(this.state==='playing')this.armStall(CUTSCENE.stallMs);}this.onChange(this.state,this);},
  };
  for(const [name,fn] of Object.entries(on))v.addEventListener(name,fn);
  this.handlers=on;
 }
 unlisten(){if(!this.handlers)return;for(const [name,fn] of Object.entries(this.handlers))this.video.removeEventListener(name,fn);this.handlers=null;}
 armStall(ms){this.clearStall();const attempt=this.attempt;this.stallTimer=this.timers.set(()=>{if(attempt===this.attempt&&!this.done&&(this.state==='playing'||this.state==='loading'))this.fail(attempt);},ms);}
 clearStall(){if(this.stallTimer!==undefined){this.timers.clear(this.stallTimer);this.stallTimer=undefined;}}
 nextSource(){
  if(!this.queue.length)return this.fallback();
  const source=this.queue.shift(),v=this.video;this.attempt++;this.lastTime=-1;
  if(!String(v.src||'').endsWith(source.src)){v.src=source.src;v.load?.();}
  v.muted=this.muted;v.volume=this.volume;
  this.source=source;this.set('loading');this.armStall(CUTSCENE.startMs);this.attemptPlay();
 }
 attemptPlay(){
  const attempt=this.attempt;let result;
  try{result=this.video.play();}catch(error){return this.refused(error,attempt);}
  if(result&&typeof result.then==='function')result.then(()=>{},error=>this.refused(error,attempt));
 }
 refused(error,attempt){
  if(this.done||attempt!==this.attempt)return;
  if(error?.name==='NotAllowedError'){this.clearStall();this.set('blocked');}
  else if(error?.name!=='AbortError')this.fail(attempt);
 }
 fail(attempt){if(this.done||attempt!==this.attempt||this.state==='fallback')return;this.clearStall();this.nextSource();}
 fallback(){
  this.clearStall();this.attempt++;
  try{this.video.pause();}catch{}
  if(!this.def.fallback?.length)return this.finish('failed');
  this.set('fallback');this.slide=-1;this.nextSlide();
 }
 nextSlide(){
  if(this.done)return;this.slide++;
  if(this.slide>=this.def.fallback.length)return this.finish('fallback');
  this.slideStart=Date.now();this.onChange(this.state,this);this.armSlide();
 }
 armSlide(){this.timers.clear(this.slideTimer);this.slideTimer=this.timers.set(()=>this.nextSlide(),this.def.fallback[this.slide].duration*1000);}
 /** Pause/resume in any playable state; also the tap target when autoplay was refused. */
 togglePause(){
  if(this.done)return;
  if(this.state==='fallback'){this.slidePaused=!this.slidePaused;if(this.slidePaused)this.timers.clear(this.slideTimer);else this.armSlide();this.onChange(this.state,this);return;}
  if(this.state==='playing'){this.video.pause();return;}
  if(this.state==='paused'||this.state==='blocked'||this.state==='loading'){this.armStall(CUTSCENE.startMs);this.attemptPlay();}
 }
 setMuted(muted){this.muted=!!muted;this.video.muted=this.muted;this.onChange(this.state,this);}
 /** Tab hidden: pause; visible again: resume what was playing (may become 'blocked'). */
 visibility(hidden){
  if(this.done)return;
  if(hidden){
   if(this.state==='playing'){this.wasPlaying=true;this.video.pause();}
   if(this.state==='fallback'&&!this.slidePaused){this.timers.clear(this.slideTimer);this.hiddenSlide=true;}
  }else{
   if(this.wasPlaying){this.wasPlaying=false;this.attemptPlay();}
   if(this.hiddenSlide){this.hiddenSlide=false;this.armSlide();}
  }
 }
 skip(){this.finish('skipped');}
 /** 0..1 progress for the progress bar. */
 progress(){
  if(this.state==='fallback'){const n=this.def.fallback.length;return Math.min(1,(Math.max(0,this.slide))/n);}
  const d=this.video.duration;return Number.isFinite(d)&&d>0?Math.min(1,this.video.currentTime/d):0;
 }
 finish(reason){
  if(this.done)return;this.done=true;this.clearStall();this.timers.clear(this.slideTimer);this.unlisten();this.attempt++;
  const v=this.video;try{v.pause();}catch{}
  // Release the decoder and network connection.
  try{v.removeAttribute?.('src');v.load?.();}catch{}
  this.set('done');this.resolve?.({reason});
 }
}

/** DOM view over #cutscene. `audio` bridges mute/volume with the game settings. */
export function createCutsceneView({root,audio,onMuteChange=()=>{}}){
 const $=sel=>root.querySelector(sel);
 const video=$('video'),slide=$('.cutscene-slide'),slideImg=slide.querySelector('img'),caption=slide.querySelector('figcaption');
 const tap=$('.cutscene-tap'),loading=$('.cutscene-loading'),bar=$('.cutscene-progress span'),playBtn=$('[data-action="play"]'),muteBtn=$('[data-action="mute"]'),skipBtn=$('[data-action="skip"]');
 let idleTimer=0,raf=0,lastFocus=null;
 const controller=new CutsceneController({video,onChange:state=>render(state)});
 function render(state){
  root.dataset.state=state;
  loading.hidden=state!=='loading';tap.hidden=state!=='blocked';
  const showSlide=state==='fallback'&&controller.slide>=0;slide.hidden=!showSlide;video.hidden=state==='fallback';
  if(showSlide){const s=controller.def.fallback[controller.slide];if(!slideImg.src.endsWith(s.src))slideImg.src=s.src;caption.textContent=s.caption;}
  const paused=state==='paused'||(state==='fallback'&&controller.slidePaused);
  playBtn.setAttribute('aria-label',paused||state==='blocked'?'Смотреть':'Пауза');playBtn.dataset.paused=String(paused||state==='blocked');
  muteBtn.setAttribute('aria-pressed',String(controller.muted));muteBtn.setAttribute('aria-label',controller.muted?'Включить звук':'Выключить звук');
 }
 function tick(){bar.style.width=(controller.progress()*100).toFixed(2)+'%';raf=requestAnimationFrame(tick);}
 function wake(){root.classList.remove('idle');clearTimeout(idleTimer);idleTimer=setTimeout(()=>{if(controller.state==='playing')root.classList.add('idle');},CUTSCENE.idleMs);}
 playBtn.onclick=e=>{e.stopPropagation();controller.togglePause();wake();};
 tap.onclick=e=>{e.stopPropagation();controller.togglePause();};
 muteBtn.onclick=e=>{e.stopPropagation();controller.setMuted(!controller.muted);onMuteChange(controller.muted);wake();};
 skipBtn.onclick=e=>{e.stopPropagation();controller.skip();};
 video.onclick=()=>{controller.togglePause();wake();};slide.onclick=()=>{controller.togglePause();wake();};
 root.addEventListener('pointermove',wake);
 const onVisibility=()=>controller.visibility(document.hidden);
 return {
  controller,
  /** Pre-buffer the preferred source (only for players who have not seen it yet). */
  prime(def){const [first]=orderSources(def.sources,env());if(first&&!video.getAttribute('src')){video.preload='auto';video.src=first.src;}},
  async play(def){
   lastFocus=document.activeElement;root.hidden=false;video.poster=def.poster||'';
   requestAnimationFrame(()=>root.classList.add('show'));root.focus({preventScroll:true});
   document.addEventListener('visibilitychange',onVisibility);raf=requestAnimationFrame(tick);wake();
   const result=await controller.play(def,{sources:orderSources(def.sources,env()),muted:audio.settings.muted,volume:audio.settings.volume});
   document.removeEventListener('visibilitychange',onVisibility);cancelAnimationFrame(raf);clearTimeout(idleTimer);
   root.classList.remove('show');await new Promise(r=>setTimeout(r,CUTSCENE.fadeMs));root.hidden=true;video.removeAttribute('poster');
   lastFocus?.focus?.({preventScroll:true});return result;
  },
  /** Keyboard while the cutscene is open: Esc/Enter skip, Space/K pause, M mute. */
  handleKey(e){const key=e.key.toLowerCase();if(key==='escape'||key==='enter'){e.preventDefault();controller.skip();return true;}if(key===' '||key==='k'){e.preventDefault();controller.togglePause();wake();return true;}if(key==='m'){controller.setMuted(!controller.muted);onMuteChange(controller.muted);return true;}return false;},
 };
 function env(){const c=navigator.connection;return {pixels:Math.max(innerWidth,innerHeight)*(devicePixelRatio||1),saveData:!!c?.saveData||/2g|3g/.test(c?.effectiveType||''),canPlay:type=>video.canPlayType(type)};}
}
