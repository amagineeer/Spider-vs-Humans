// Existing assets are kept intact; dimensions are their source canvas sizes. Large images load as
// WebP delivery copies of untouched masters (tools/assets/optimize_images.py).
import {BACKGROUNDS} from './backgrounds.js';
import {SPIDERS} from './spiders.js';
import {SPIDER_SPRITES,FX_SPRITES} from './spiderSprites.js';
import {PEOPLE_SPRITES,PEOPLE_FRAME} from './peopleSprites.js';
// Effects drawn in combat; the remaining sheets in FX_SPRITES are ready for future spiders.
const COMBAT_FX=['venom_glob_fly','venom_splat','net_fly','net_hit','net_stuck','silk_ball_collect','hairs_burst','dust_puff'];
export const ASSETS = {
 ...BACKGROUNDS,
 // Card icons and placement ghosts use idle frame 0 of the v2 sheets.
 ...Object.fromEntries(Object.keys(SPIDERS).map(id=>[id,{path:SPIDER_SPRITES[id].icon,role:SPIDERS[id].name}])),
 // Every animation sheet of in-game spiders, keyed `${id}@${clip}`.
 ...Object.fromEntries(Object.keys(SPIDERS).flatMap(id=>Object.entries(SPIDER_SPRITES[id].animations).map(([clip,a])=>[`${id}@${clip}`,{path:a.path,frames:a.frames,role:`анимация ${clip}`}]))),
 ...Object.fromEntries(COMBAT_FX.map(name=>[`fx@${name}`,{path:FX_SPRITES[name].path,frames:FX_SPRITES[name].frames,role:'эффект'}])),
 // People v2: static portrait (enemy card) + walk / attack sheets (+ bucket-less variants).
 ...Object.fromEntries(Object.entries(PEOPLE_SPRITES).flatMap(([id,p])=>{const dir=`assets/people/${p.file}`,sheet=(name,frames,period)=>({path:`${dir}/${name}.webp`,frames,rows:2,frameWidth:PEOPLE_FRAME.w,frameHeight:PEOPLE_FRAME.h,period,role:'человек: '+name});return [[id,{path:`people/models_right/${p.file}.svg`,width:320,height:460,role:'человек'}],[id+'Walk',sheet('walk',PEOPLE_FRAME.walkFrames,p.period)],[id+'Attack',sheet('attack',PEOPLE_FRAME.attackFrames,p.attackPeriod)],...(p.bare?[[id+'WalkBare',sheet('walk_bare',PEOPLE_FRAME.walkFrames,p.period)],[id+'AttackBare',sheet('attack_bare',PEOPLE_FRAME.attackFrames,p.attackPeriod)]]:[])];})),
 loading:{path:'assets/_gen/loading-no-mascot.webp',role:'экран загрузки без маленького паука'},
 silkWeb:{path:'assets/_gen/silk-web.png',width:232,height:224,role:'значок шёлка'},
 queen:{path:'assets/queen/queen_v2.webp',width:693,height:1185,role:'защищаемая матка (v2)'},
 bossPortrait:{path:'assets/_gen/boss/portrait.png',role:'лицо анимированного босса'},
 bossScreen:{path:'assets/_gen/boss/screen.png',role:'экран анимированного босса'},
 boss:{path:'assets/boss/boss_osnovatel.webp',width:1900,height:1650,role:'босс — Основатель Sharrowkin'},
 fly:{path:'assets/fly/fly.png',width:384,height:320,role:'муха'}
};
