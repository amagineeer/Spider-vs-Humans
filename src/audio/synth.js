// Procedural one-shot sound effects (WebAudio). Used for events that have no recorded WAV:
// flesh / armour hits, armour break, human down, spider death, planting, fly catch, mine, tape, wave horn, jingles.
// Every voice is a few short-lived nodes routed to the caller's bus; nothing is allocated when muted.
let noiseBuffer=null;
function noise(ctx){
 if(noiseBuffer&&noiseBuffer.sampleRate===ctx.sampleRate)return noiseBuffer;
 const length=Math.floor(ctx.sampleRate*.6),buffer=ctx.createBuffer(1,length,ctx.sampleRate),data=buffer.getChannelData(0);
 let seed=1234567;for(let i=0;i<length;i++){seed=(seed*1103515245+12345)>>>0;data[i]=(seed/4294967296)*2-1;}
 noiseBuffer=buffer;return buffer;
}
function env(ctx,gain,t,peak,attack,decay){gain.gain.setValueAtTime(0.0001,t);gain.gain.exponentialRampToValueAtTime(peak,t+attack);gain.gain.exponentialRampToValueAtTime(0.0001,t+attack+decay);}
let pitchMul=1; // per-voice pitch (e.g. a different timbre per human type), set by playSynth for one recipe call
function tone(ctx,out,{type='sine',from,to=from,t,dur,peak=.3,attack=.005,detune=0}){
 from*=pitchMul;to*=pitchMul;
 const o=ctx.createOscillator(),g=ctx.createGain();o.type=type;o.detune.value=detune;o.frequency.setValueAtTime(from,t);if(to!==from)o.frequency.exponentialRampToValueAtTime(Math.max(1,to),t+dur);
 env(ctx,g,t,peak,attack,dur);o.connect(g);g.connect(out);o.start(t);o.stop(t+attack+dur+.02);o.onended=()=>{o.disconnect();g.disconnect();};
}
function hiss(ctx,out,{t,dur,peak=.3,filter='lowpass',freq=1200,to=freq,q=.8,attack=.003}){
 freq*=pitchMul;to*=pitchMul;
 const s=ctx.createBufferSource(),f=ctx.createBiquadFilter(),g=ctx.createGain();s.buffer=noise(ctx);f.type=filter;f.Q.value=q;f.frequency.setValueAtTime(freq,t);if(to!==freq)f.frequency.exponentialRampToValueAtTime(to,t+dur);
 env(ctx,g,t,peak,attack,dur);s.connect(f);f.connect(g);g.connect(out);s.start(t,Math.random()*.3);s.stop(t+attack+dur+.02);s.onended=()=>{s.disconnect();f.disconnect();g.disconnect();};
}
/** Recipes: name -> (ctx, out, t, variation 0..1). */
export const SYNTH={
 hitFlesh:(c,o,t,v)=>{hiss(c,o,{t,dur:.07,peak:.35,freq:900+v*300});tone(c,o,{from:150+v*30,to:85,t,dur:.09,peak:.35});},
 hitBoss:(c,o,t,v)=>{hiss(c,o,{t,dur:.09,peak:.3,freq:700});tone(c,o,{from:110+v*20,to:60,t,dur:.12,peak:.4});},
 hitArmor:(c,o,t,v)=>{tone(c,o,{type:'square',from:1180+v*120,to:900,t,dur:.08,peak:.08});tone(c,o,{type:'triangle',from:1640+v*90,to:1500,t,dur:.14,peak:.12});hiss(c,o,{t,dur:.05,peak:.18,filter:'bandpass',freq:3200,q:3});},
 armorBreak:(c,o,t)=>{tone(c,o,{type:'triangle',from:1500,to:420,t,dur:.32,peak:.2});tone(c,o,{type:'square',from:900,to:300,t:t+.03,dur:.25,peak:.06});hiss(c,o,{t,dur:.3,peak:.25,filter:'bandpass',freq:2500,to:800,q:2});},
 humanDown:(c,o,t,v)=>{tone(c,o,{from:240+v*40,to:70,t,dur:.28,peak:.32});hiss(c,o,{t:t+.12,dur:.22,peak:.2,freq:500});},
 spiderDeath:(c,o,t,v)=>{tone(c,o,{type:'triangle',from:950+v*150,to:280,t,dur:.18,peak:.18});hiss(c,o,{t,dur:.1,peak:.12,filter:'highpass',freq:2500});},
 plant:(c,o,t,v)=>{tone(c,o,{from:260+v*40,to:620,t,dur:.09,peak:.28});hiss(c,o,{t,dur:.05,peak:.12,freq:1800});},
 catch:(c,o,t,v)=>{tone(c,o,{from:880+v*60,to:1320,t,dur:.12,peak:.18});tone(c,o,{from:1760,to:1980,t:t+.05,dur:.14,peak:.1});},
 explode:(c,o,t)=>{hiss(c,o,{t,dur:.35,peak:.55,freq:600,to:120});tone(c,o,{from:120,to:40,t,dur:.4,peak:.5});},
 tape:(c,o,t)=>{hiss(c,o,{t,dur:.7,peak:.35,filter:'bandpass',freq:400,to:2400,q:1.2,attack:.05});tone(c,o,{type:'sawtooth',from:90,to:180,t,dur:.6,peak:.05});},
 horn:(c,o,t)=>{tone(c,o,{type:'sawtooth',from:196,t,dur:.55,peak:.08,attack:.04});tone(c,o,{type:'sawtooth',from:294,t:t+.02,dur:.55,peak:.06,attack:.04});hiss(c,o,{t,dur:.4,peak:.05,freq:600});},
 win:(c,o,t)=>{[523,659,784,1047].forEach((f,i)=>tone(c,o,{type:'triangle',from:f,t:t+i*.11,dur:.28,peak:.18}));},
 loss:(c,o,t)=>{[392,330,262,196].forEach((f,i)=>tone(c,o,{type:'triangle',from:f,to:f*.97,t:t+i*.16,dur:.32,peak:.16}));},
 click:(c,o,t)=>{tone(c,o,{from:1400,to:900,t,dur:.03,peak:.08});},
};
/** Play a recipe if it exists; returns true when something was scheduled. */
export function playSynth(ctx,out,name,variation=Math.random(),pitch=1){const recipe=SYNTH[name];if(!recipe||!ctx||!out)return false;pitchMul=Number.isFinite(pitch)&&pitch>0?pitch:1;try{recipe(ctx,out,ctx.currentTime+.005,variation);}finally{pitchMul=1;}return true;}
