// Campaign: 8 days (tutorial -> full board), 7 nights (harder mixes), boss on 15, bonus survival night 16.
// Every room artwork in assets/backgrounds is used by at least one level (see BACKGROUNDS / tests).
export const CAMPAIGN_LAST=15; // Boss level; winning it plays the finale.
export const BONUS_ID=16;      // Unlocked after the finale.
const all=[0,1,2,3,4];
const manual1=[1,1,2,4].map(n=>Array.from({length:n},()=>({type:'basic',lane:2})));
const manual2=[1,2,2,3,4,7].map(n=>Array.from({length:n},(_,k)=>({type:'basic',lane:[1,2,3][k%3]})));
// difficulty scales every wave budget; speed scales walking speed for the whole level.
const TABLE=[
 {room:'Кухня',bg:'roomDay1',lanes:[2],waves:4,big:[3],spiders:['spitter'],reward:{kind:'spider',id:'spinner'},newEnemy:'basic',manual:manual1,startSilk:100,difficulty:1,speed:1,
  story:'Утро. Человек заметил паутину на кухне.',goal:'Ловите мух и сажайте Плевунов на дорожку.'},
 {room:'Спальня',bg:'roomDay2',lanes:[1,2,3],waves:6,big:[5],spiders:['spitter','spinner'],reward:{kind:'spider',id:'tarantula'},manual:manual2,difficulty:1,speed:1,
  story:'Шум разбудил всю квартиру.',goal:'Прядильщицы дают шёлк — посадите их у матки.'},
 {room:'Детская',bg:'roomDay3',lanes:[1,2,3],waves:7,big:[6],spiders:['spitter','spinner','tarantula'],reward:{kind:'spider',id:'karakurt'},newEnemy:'runner',difficulty:.8,speed:1,
  story:'Мальчик с банкой хочет поймать паука в коллекцию.',goal:'Тарантул держит удар — ставьте его перед стрелками.'},
 {room:'Кабинет',bg:'roomDay4',lanes:all,waves:8,big:[3,7],spiders:['spitter','spinner','tarantula','karakurt'],reward:{kind:'spider',id:'weaver'},difficulty:.72,speed:1,
  story:'Теперь люди идут по всем пяти дорожкам.',goal:'Каракурту нужно время, чтобы взвестись. Сажайте заранее.'},
 {room:'Веранда',bg:'roomDay5',lanes:all,waves:9,big:[4,8],spiders:['spitter','spinner','tarantula','karakurt','weaver'],reward:{kind:'silk',amount:100},newEnemy:'armored',difficulty:.82,speed:1,
  story:'Дачник надел ведро — так паутина не страшна.',goal:'Сетеметатель замедляет людей и их удары.'},
 {room:'Кухня',bg:'roomDay1',lanes:all,waves:10,big:[4,9],reward:{kind:'silk',amount:100},difficulty:.9,speed:1,
  story:'Люди вернулись на кухню с подкреплением.',goal:'Две большие волны. Держите все пять дорожек.'},
 {room:'Спальня',bg:'roomDay2',lanes:all,waves:10,big:[4,9],reward:{kind:'silk',amount:100},newEnemy:'sprayer',difficulty:.96,speed:1,
  story:'Бабушка с газетой знает, как гонять пауков.',goal:'Крепких противников встречайте двумя-тремя стрелками.'},
 {room:'Детская',bg:'roomDay3',lanes:all,waves:12,big:[5,11],reward:{kind:'silk',amount:100},difficulty:1,speed:1,
  story:'Последний день. Дальше люди придут ночью.',goal:'Смешанные волны: стройте экономику и стены.'},
 {room:'Библиотека',bg:'roomNight1',lanes:all,waves:10,big:[4,9],reward:{kind:'silk',amount:100},difficulty:.75,startSilk:125,speed:1,
  story:'Ночь. Люди крадутся между книжных полок.',goal:'Ночью шёлка на старте больше. Не тратьте его зря.'},
 {room:'Чердак',bg:'roomNight2',lanes:all,waves:12,big:[5,11],reward:{kind:'silk',amount:100},difficulty:.78,speed:1,
  story:'На чердаке пыльно и тесно.',goal:'Держите по два стрелка на дорожку.'},
 {room:'Погреб',bg:'roomNight3',lanes:all,waves:12,big:[5,11],reward:{kind:'silk',amount:100},newEnemy:'sweeper',difficulty:.95,speed:1,
  story:'Хозяйка с веником спускается в погреб.',goal:'Броня веника — работа для каракурта.'},
 {room:'Гараж',bg:'roomNight4',lanes:all,waves:14,big:[6,13],reward:{kind:'silk',amount:100},difficulty:.97,speed:1,
  story:'Гараж гудит — люди собирают силы.',goal:'Длинная ночь: следите за всеми дорожками.'},
 {room:'Прачечная',bg:'roomNight5',lanes:all,waves:14,big:[6,13],reward:{kind:'silk',amount:100},difficulty:.98,speed:1,
  story:'Стиральные машины грохочут, но пауки не спят.',goal:'Ставьте тарантулов перед сильными волнами.'},
 {room:'Мастерская',bg:'roomNight6',lanes:all,waves:16,big:[7,15],reward:{kind:'silk',amount:100},difficulty:1.08,speed:1,
  story:'Мастерская — последний рубеж перед столовой.',goal:'Самая долгая ночь перед финалом.'},
 {room:'Столовая',bg:'roomNight7',lanes:all,waves:10,big:[4,9],reward:{kind:'trophy'},newEnemy:'boss',boss:{type:'boss'},startSilk:250,difficulty:.6,speed:1,
  story:'Основатель сам пришёл в столовую и призывает ИИ-агентов.',goal:'Его руки достают до правых колонок (6–9). Плевуны бьют его с любой дорожки.'},
 {room:'Прихожая',bg:'roomNight8',lanes:all,waves:15,big:[4,9,14],reward:{kind:'trophy',id:'bonus'},bonus:true,startSilk:150,difficulty:1.35,speed:1.05,
  story:'Бессонная ночь: люди ломятся через входную дверь.',goal:'Бонус: три большие волны всех типов людей.'},
];
export const LEVELS=TABLE.map((t,i)=>{
 const id=i+1,day=id<=8,night=id-8;
 const pool=[{type:'basic',weight:6,minWave:0}];
 if(id>=3)pool.push({type:'runner',weight:3,minWave:1});
 if(id>=5)pool.push({type:'armored',weight:2,minWave:2});
 if(id>=7)pool.push({type:'sprayer',weight:2,minWave:2});
 if(id>=11)pool.push({type:'sweeper',weight:2,minWave:3});
 const name=t.bonus?'Бонус':day?`День ${id}`:`Ночь ${night}`;
 return {id,name,room:t.room,title:`${name} · ${t.room}`,mode:day?'day':'night',day,bonus:!!t.bonus,background:t.bg,lanes:t.lanes,
  startSilk:t.startSilk??(day?50:100),spiders:t.spiders||['spitter','spinner','tarantula','karakurt','weaver'],reward:t.reward,
  intro:t.newEnemy?{newEnemy:t.newEnemy}:undefined,story:t.story,goal:t.goal,waves:t.waves,bigWaves:t.big,pool,difficulty:t.difficulty,speed:t.speed,
  ...(t.manual?{manualWaves:t.manual}:{}),...(t.boss?{boss:t.boss}:{})};
});
export const LEVEL_COUNT=LEVELS.length;
