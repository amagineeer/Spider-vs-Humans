import {BALANCE} from '../data/balance.js';
/** Fixed-step accumulator; speed changes the number of steps, never step size. */
export function startLoop(tick,draw,{onError}={}){let last=null,acc=0,speed=1,frameId,stopped=false,errors=0,logged=0;
 function reset(){last=null;acc=0;}
 /* The next frame is requested first, so one faulty frame is logged and skipped instead of freezing the game.
  Errors that keep repeating (score decays by 1 per ~50 clean frames) stop the loop and go to onError. */
 function frame(now){if(stopped)return;frameId=requestAnimationFrame(frame);try{const dt=last===null?0:Math.max(0,Math.min(BALANCE.maxFrame,(now-last)/1000));last=now;if(!document.hidden)acc+=dt*speed;while(acc>=BALANCE.fixedStep){acc-=BALANCE.fixedStep;tick(BALANCE.fixedStep);}draw(dt);errors=Math.max(0,errors-.02);}
  catch(error){acc=0;errors++;if(logged++<3)console.error(error);if(errors>=5){api.stop();onError?.(error);}}}
 document.addEventListener('visibilitychange',reset);frameId=requestAnimationFrame(frame);
 const api={reset,setSpeed(value){speed=Math.max(BALANCE.debugMin,Math.min(BALANCE.debugMax,value));},stop(){stopped=true;cancelAnimationFrame(frameId);document.removeEventListener('visibilitychange',reset);reset();}};
 return api;
}
