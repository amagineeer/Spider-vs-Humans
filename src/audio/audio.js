import {AUDIO,AUDIO_MIX,AUDIO_LOOPS} from '../data/audio.js';
import {waveWarning} from '../systems/waves.js';
import {readAudioSettings,writeAudioSettings} from '../storage/save.js';
import {SYNTH,playSynth} from './synth.js';
// Events without a recording are synthesised (see synth.js).
const SYNTH_ALIAS={catch:'catch',win:'win',loss:'loss',warning:'horn'};
const LOOP_BUS={music:'music',buzz:'sfx',footsteps:'sfx'};
/** Web Audio mixer: master -> {music, sfx} buses. Settings are persisted through save.js. */
export class GameAudio {
 constructor(){this.settings=readAudioSettings();this.buffers=new Map();this.loops=new Map();this.voices=new Set();this.lastEffect=new Map();this.failures=[];this.state=null;this.screen='menu';this.warning=false;this.ready=false;this.synthVoices=0;}
 async unlock(){
  try{
   if(!this.context){
    const Context=globalThis.AudioContext||globalThis.webkitAudioContext;if(!Context)return;
    this.context=new Context();this.master=this.context.createGain();this.master.connect(this.context.destination);
    this.music=this.context.createGain();this.sfx=this.context.createGain();this.music.connect(this.master);this.sfx.connect(this.master);this.applyVolume();
   }
   if(this.context.state!=='running')await this.context.resume();
   if(!this.loading)this.loading=this.load();
   await this.loading;this.ready=true;this.sync(this.state,this.screen);
  }catch(e){this.failures.push(String(e));}
 }
 async load(){
  await Promise.all(Object.entries(AUDIO).map(async([id,path])=>{
   try{const response=await fetch(new URL('../../'+path,import.meta.url));if(!response.ok)throw Error('HTTP '+response.status);const data=await response.arrayBuffer();this.buffers.set(id,await this.decode(data));}
   catch(e){this.failures.push(id+': '+e.message);}
  }));
 }
 /** decodeAudioData with the callback form too (older Safari returns no promise). */
 decode(data){return new Promise((resolve,reject)=>{const result=this.context.decodeAudioData(data,resolve,reject);result?.then?.(resolve,reject);});}
 applyVolume(){
  if(!this.master)return;const t=this.context.currentTime,s=this.settings;
  this.master.gain.setTargetAtTime(s.muted?0:s.volume,t,.025);this.music.gain.setTargetAtTime(s.music??.8,t,.025);this.sfx.gain.setTargetAtTime(s.sfx??.9,t,.025);
 }
 persist(){writeAudioSettings(this.settings);this.applyVolume();this.sync(this.state,this.screen);}
 setVolume(value){this.settings.volume=Math.max(0,Math.min(1,Number(value)||0));this.persist();}
 setMuted(value){this.settings.muted=!!value;this.persist();}
 setMusic(value){this.settings.music=Math.max(0,Math.min(1,Number(value)||0));this.persist();}
 setSfx(value){this.settings.sfx=Math.max(0,Math.min(1,Number(value)||0));this.persist();}
 get audible(){return this.ready&&!this.settings.muted&&this.settings.volume>0&&this.context?.state==='running';}
 stopVoice(source){try{source.stop();}catch{}source.disconnect();}
 stopAll(){for(const id of [...this.loops.keys()])this.stopLoop(id);for(const source of this.voices)this.stopVoice(source);this.voices.clear();}
 /** Stop a loop; the music remembers its position, so pause/resume continues the track. */
 stopLoop(id){
  const source=this.loops.get(id);if(!source)return;
  if(id==='music'){const length=AUDIO_LOOPS.music?.length||source.buffer.duration;this.musicAt=((this.context.currentTime-this.musicStart)%length+length)%length;}
  this.stopVoice(source);this.loops.delete(id);
 }
 loop(id,enabled){
  if(!enabled){this.stopLoop(id);return;}
  if(this.loops.has(id)||!this.buffers.has(id))return;
  const source=this.context.createBufferSource(),gain=this.context.createGain(),span=AUDIO_LOOPS[id],at=id==='music'?this.musicAt||0:0;
  source.buffer=this.buffers.get(id);source.loop=true;if(span){source.loopStart=span.start;source.loopEnd=span.start+span.length;}
  gain.gain.value=AUDIO_MIX[id]??.2;source.connect(gain);gain.connect(this[LOOP_BUS[id]||'sfx']);source.onended=()=>gain.disconnect();
  source.start(0,(span?.start||0)+at);if(id==='music')this.musicStart=this.context.currentTime-at;this.loops.set(id,source);
 }
 /** Recorded effect (or its synthesised stand-in), throttled per id. */
 effect(id){
  if(!this.audible)return;
  const now=this.context.currentTime;if(now-(this.lastEffect.get(id)??-Infinity)<.18||this.voices.size>=AUDIO_MIX.maxVoices)return;this.lastEffect.set(id,now);
  const buffer=this.buffers.get(id);
  if(!buffer){this.synth(SYNTH_ALIAS[id]||id,0);return;}
  const gain=this.context.createGain(),source=this.context.createBufferSource();source.buffer=buffer;gain.gain.value=AUDIO_MIX.effect;
  source.connect(gain);gain.connect(this.sfx);this.voices.add(source);source.onended=()=>{source.disconnect();gain.disconnect();this.voices.delete(source);};source.start();
 }
 /** Procedural effect with its own throttle (gap in seconds) and a global voice budget. */
 synth(name,gap=.05,pitch=1){
  if(!this.audible||!SYNTH[name])return false;
  const now=this.context.currentTime,key='synth:'+name;if(now-(this.lastEffect.get(key)??-Infinity)<gap||this.synthVoices>=AUDIO_MIX.maxSynth)return false;
  this.lastEffect.set(key,now);this.synthVoices++;setTimeout(()=>{this.synthVoices--;},450);
  return playSynth(this.context,this.sfx,name,undefined,pitch);
 }
 sync(state,screen){
  if(state!==this.state){this.stopAll();this.musicAt=0;this.lastEffect.clear();this.warning=false;}this.state=state;this.screen=screen;
  const events=state?.audioEvents?.splice(0)??[];
  const active=screen==='game'&&state&&!state.paused&&!state.result&&!document.hidden;
  if(!active||this.settings.muted||!this.settings.volume){this.stopAll();return;}
  if(!this.ready||this.context.state!=='running')return;
  this.loop('music',true);this.loop('buzz',state.flies.length>0);
  this.loop('footsteps',state.humans.some(h=>h.hp>0&&!state.spiders.some(p=>p.hp>0&&p.row===h.row&&Math.abs(h.x-p.x)<64)));
  const warning=waveWarning(state);if(warning&&!this.warning)this.effect('warning');this.warning=warning;
  for(const event of events)this.effect(event);
 }
}
