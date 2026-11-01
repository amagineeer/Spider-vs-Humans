// damage = per hit; attackPeriod = seconds per swing; the hit lands at HUMAN_ATTACK.contact of the swing
// (frame 5 of the 8-frame attack sheet), so damage and animation share one clock.
export const HUMAN_ATTACK = {contact:.6};
export const HUMANS = {
 basic:{name:'Сонный жилец',description:'Медленно идёт к комнате.',hp:200,armor:0,speed:.22,damage:32,attackPeriod:.8,cost:1,asset:'basic'},
 runner:{name:'Мальчик с банкой',description:'Быстрый, но без брони.',hp:150,armor:0,speed:.45,damage:18,attackPeriod:.6,cost:2,asset:'runner'},
 armored:{name:'Дачник в ведре',description:'Ведро принимает первые удары.',hp:200,armor:450,speed:.2,damage:38,attackPeriod:.95,cost:4,asset:'armored'},
 sprayer:{name:'Бабушка с газетой',description:'Крепкий и настойчивый противник.',hp:260,armor:0,speed:.25,damage:38,attackPeriod:.7,cost:3,asset:'sprayer'},
 sweeper:{name:'Хозяйка с веником',description:'Защищена и опасна в ближнем бою.',hp:220,armor:250,speed:.24,damage:55,attackPeriod:.85,cost:5,asset:'sweeper'},
 agent:{name:'ИИ-агент',description:'Призван основателем. Не входит в волны.',hp:120,armor:0,speed:.35,damage:26,attackPeriod:.75,cost:1,asset:'agent'},
 boss:{name:'Основатель Sharrowkin',description:'Призывает ИИ-агентов. Лента его не остановит.',hp:6000,armor:0,speed:0,damage:24,firstSummon:24,summonPeriod:18,summonCount:2,asset:'boss'},
};
