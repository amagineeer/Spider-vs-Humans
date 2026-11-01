export const GRID = {x:240,y:200,size:128,rows:5,cols:9};
export const BALANCE = {startSilk:50,flyReward:25,flyMin:9,flyMax:12,flyNightMin:10,flyNightMax:13,flyFirstMin:4,flyFirstMax:6,flyLife:8,flySpeed:24,flyTurnMin:1.2,flyTurnMax:2.8,flyMargin:36,waveWarning:3,spiderWidth:.9,humanHeight:1.45,fixedStep:1/60,maxFrame:.1,projectileSpeed:6,hitRadius:40,attackReach:64,hurtFront:24,hurtBack:96,shotRadius:12,targetEdge:1560,shotLimit:1720,hurtSoundGap:.7,worldWidth:1600,worldHeight:900,humanWidth:120,bossX:1470,bossRow:2,rewardX:1000,rewardY:500,rewardRadius:80,debugMin:.5,debugMax:4,debugStep:.5};
export const WAVES = {
 firstWaveDelay:20, // Seconds before the first wave.
 waveDuration:30, // Maximum time before requesting another wave.
 minGap:8, // Earliest accelerated next wave.
 earlyNextHpRatio:.4, // Remaining health threshold.
 bigWaveMaxWait:20, // Maximum wait for field clearance.
 bigWaveWarn:3, // Duration of each warning banner.
 base:1, // Initial budget.
 perWave:.5, // Budget increase per wave.
 bigMul:2.5, // Large-wave budget multiplier.
 levelDiffStep:.08, // Budget growth per level.
 intervalStart:1.6, // Initial normal spawn interval.
 intervalEnd:.6, // Final normal spawn interval.
 bigIntervalStart:.8, // Initial large-wave interval.
 bigIntervalEnd:.3, // Final large-wave interval.
 speedGrowth:.015, // Speed growth per wave.
 speedMulMax:1.15, // Inter-wave speed cap.
 levelSpeedStep:.02, // Speed growth per level.
 intraSpeedMax:1.05, // Intra-wave acceleration.
 totalSpeedMax:1.25, // Absolute speed multiplier cap.
 flagSpeedMul:1.1, // Flag bearer multiplier, still capped.
 maxAlive:40, // Maximum living regular enemies.
 spawnX:1650, // Left edge at spawn.
 spawnJitter:40, // Seeded horizontal jitter.
};
export const OUTCOME = {
 lastDefense:true, // Enable one tape per active lane.
 TAPE_X:232, // Trigger threshold.
 LOSE_X:150, // Defeat threshold, inclusive.
 tapeSpeed:6, // Cells per second.
 sleepFall:.6, // Boss defeat falling duration.
 loseWalk:1.5, // Breacher walks alone.
 shake:.3, // Camera shake duration.
 fade:1, // Defeat fade duration.
 rewardAutoCollect:8, // Seconds before reward collection.
 rewardFlash:1.2, // Collection flash before results.
};
// Queen refuge stays left of both the tape and the first plantable column.
export const QUEEN_HOME = {x:0,y:200,width:210,height:640,roofHeight:92,inset:16,queenWidth:198,queenHeight:339, // queen_v2.png keeps its 693:1185 aspect
 breath:.012,breathRate:1.6,sway:.01,swayRate:.7, // idle motion, radians and scale
 alarmCells:2.5,alarmShake:1.6}; // humans this many cells from the grid edge make her tremble
// Supplied boss rig timing; all values are in simulation seconds or logical pixels.
export const BOSS_ANIMATION = {
 scale:1.15, // Uniform scale preserves the supplied silhouette.
 entryX:1810, // Start outside the room, walk to BALANCE.bossX.
 walkSpeed:23.04, // Entry speed in px/s; arrives after returning the cup.
 stride:103.87, // Distance for one complete gait cycle.
 attack:{interval:.55,windup:.25,strike:.15,contact:.08,recovery:.44}, // Contact and damage share timing.
 drink:{reach:5.8,lift:6.9,sip:8.4,return:12,release:13.5,end:14.4}, // Cup choreography.
 targetOffsetX:43, // Slipper sole meets the target rather than its wrist.
 targetOffsetY:-30, // Contact height relative to spider anchor.
 impactDuration:.45, // Visible contact rays and damage flash.
 reachCol:5, // Arms reach spiders in columns 5..8 only; the back of the room is safe.
 healthX:1320,healthY:75,healthWidth:250,healthHeight:14, // Boss health strip.
};
export const FLOW = {fade:.3,introWord:.6};
export const PRESENTATION = {bannerFade:.3,bannerScale:1.4,bannerSettle:4,rewardBounce:12,rewardBounceRate:4,rewardGlow:.2,rewardGlowRate:5,shakeRate:100,shakeDistance:8,progressSmooth:8};
