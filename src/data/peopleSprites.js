// People v2 sheets (people/v2/build_people.py -> rasterize.mjs -> to_webp.py).
// Each sheet: frames left to right, row 0 eyes open, row 1 blink. Frames 160x230, feet at y=215.
export const PEOPLE_FRAME = {w:160,h:230,walkFrames:16,attackFrames:8};
// Gait periods are matched to HUMANS speeds so planted feet do not slide.
export const PEOPLE_SPRITES = {
 basic:{file:'sleepy_resident',period:1.35,attackPeriod:.8},
 runner:{file:'jar_boy',period:.95,attackPeriod:.6},
 armored:{file:'bucket_gardener',period:1.4,attackPeriod:.95,bare:true},
 sprayer:{file:'newspaper_granny',period:.85,attackPeriod:.7},
 sweeper:{file:'broom_keeper',period:1.3,attackPeriod:.85},
 agent:{file:'electrician',period:.93,attackPeriod:.75}
};
