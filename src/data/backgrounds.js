// Original JPEGs are preserved. Crop removes the HUD baked into the artwork.
const room=(time,day,name)=>({path:`assets/backgrounds/photo_2026-10-31_${time}.jpg`,day,name,role:'фон комнаты',cropTop:90/775,includesQueen:true});
// 5 day rooms + 8 night rooms. Level -> room mapping lives in levels.js; tests check every room is used.
export const BACKGROUNDS={
 roomDay1:room('17-20-45',true,'Кухня'),roomDay2:room('17-20-53',true,'Спальня'),
 roomDay3:room('17-20-55',true,'Детская'),roomDay4:room('17-20-57',true,'Кабинет'),roomDay5:room('17-20-59',true,'Веранда'),
 roomNight1:room('17-21-02',false,'Библиотека'),roomNight2:room('17-21-03',false,'Чердак'),
 roomNight3:room('17-21-05',false,'Погреб'),roomNight4:room('17-21-06',false,'Гараж'),roomNight5:room('17-21-09',false,'Прачечная'),
 roomNight6:room('17-21-11',false,'Мастерская'),roomNight7:room('17-21-12',false,'Столовая'),roomNight8:room('17-21-14',false,'Прихожая')
};
