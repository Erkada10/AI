'use strict';

// ============================================================
// R-EVOLUTION — script.js
// ============================================================

class RNG {
  constructor(s){ this.s = s >>> 0; }
  next(){
    this.s |= 0;
    this.s = this.s + 0x6D2B79F5 | 0;
    let t = this.s;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
  range(a,b){ return a + this.next() * (b - a); }
  int(a,b){ return Math.floor(this.range(a,b+1)); }
  pick(a){ return a[Math.floor(this.next() * a.length)]; }
  chance(p){ return this.next() < p; }
}

const clamp = (v,a,b) => v < a ? a : v > b ? b : v;
const dist2 = (ax,ay,bx,by) => { const dx = ax-bx, dy = ay-by; return dx*dx + dy*dy; };
const lerp  = (a,b,t) => a + (b-a) * t;

const ROLE_NAMES = {
  core:'Ядро', weapon:'Оружие', defense:'Защита', structure:'Структура',
  sense:'Сенсор', move:'Движение', meta:'Метаболизм', digest:'Пищеварение'
};

// ============================================================
// R-МОДУЛИ
// ============================================================
const RC = {
'R-Membrane':{nameRu:'R-Мембрана',descRu:'Внешняя оболочка клетки.',role:'core',hp:100,radius:10,cost:0.5,color:'#4a7fb5',shape:'circle',effects:{armor:0.1,leakBase:0.15,longevity:0.05}},
'R-Nucleus':{nameRu:'R-Ядро',descRu:'Управляющий центр, хранит ДНК.',role:'core',hp:120,radius:9,cost:0.8,color:'#b54a9a',shape:'circle',effects:{longevity:0.1}},
'Razor':{nameRu:'R-Бритва',descRu:'Острый шип. Высокое пробивание.',role:'weapon',hp:40,radius:6,cost:0.3,color:'#e8e8e8',shape:'spike',effects:{pierce:1.5,dmg:14}},
'Rake':{nameRu:'R-Грабли',descRu:'Пучок мелких шипов.',role:'weapon',hp:35,radius:5,cost:0.3,color:'#ddd',shape:'spike',effects:{pierce:1.3,dmg:10}},
'Rust':{nameRu:'R-Ржавчина',descRu:'Кислота, разъедающая врага.',role:'weapon',hp:30,radius:5,cost:0.2,color:'#a06020',shape:'blob',effects:{corrosion:1,dmg:4}},
'Rime':{nameRu:'R-Иней',descRu:'Холодная слизь, замедляет.',role:'weapon',hp:30,radius:5,cost:0.25,color:'#a0d8f0',shape:'blob',effects:{slow:1,dmg:3}},
'Resin':{nameRu:'R-Смола',descRu:'Липкое вещество.',role:'weapon',hp:30,radius:6,cost:0.25,color:'#d4a040',shape:'blob',effects:{slow:0.7,dmg:3}},
'Reap':{nameRu:'R-Жнец',descRu:'Крюк, высасывающий энергию.',role:'weapon',hp:45,radius:7,cost:0.4,color:'#802020',shape:'spike',effects:{lifesteal:0.4,dmg:12}},
'Ripplestorm':{nameRu:'R-Волношторм',descRu:'Электрический разряд.',role:'weapon',hp:50,radius:8,cost:0.6,color:'#6080ff',shape:'star',effects:{electric:true,dmg:8}},
'Reactor Surge':{nameRu:'R-Выброс реактора',descRu:'Энергетический взрыв.',role:'weapon',hp:55,radius:7,cost:0.5,color:'#ff8040',shape:'star',effects:{dmg:18}},
'Razor Shock':{nameRu:'R-Шок-бритва',descRu:'Электрошип, оглушает.',role:'weapon',hp:40,radius:6,cost:0.4,color:'#ffff60',shape:'spike',effects:{electric:true,stun:0.3,dmg:10}},
'Rim':{nameRu:'R-Обод',descRu:'Защитное кольцо, блокирует.',role:'defense',hp:80,radius:8,cost:0.2,color:'#a0a0a0',shape:'ring',effects:{block:0.5}},
'Rind':{nameRu:'R-Кора',descRu:'Толстая оболочка, снижает урон.',role:'defense',hp:70,radius:9,cost:0.2,color:'#8a7040',shape:'circle',effects:{armor:0.3}},
'Ridge':{nameRu:'R-Гребень',descRu:'Ребристая пластина.',role:'defense',hp:65,radius:7,cost:0.15,color:'#909090',shape:'curve',effects:{armor:0.2}},
'Reflector':{nameRu:'R-Отражатель',descRu:'Отражает часть урона.',role:'defense',hp:45,radius:6,cost:0.3,color:'#c0f0ff',shape:'circle',effects:{reflect:0.3,block:0.3}},
'Resist':{nameRu:'R-Сопротивление',descRu:'Хрящ, гасит удары.',role:'defense',hp:70,radius:6,cost:0.2,color:'#6a8ac0',shape:'circle',effects:{armor:0.25}},
'Reef':{nameRu:'R-Риф',descRu:'Тяжёлая броня.',role:'defense',hp:100,radius:12,cost:0.3,color:'#3a7060',shape:'circle',effects:{armor:0.4}},
'Runestone':{nameRu:'R-Рунный камень',descRu:'Броня и блок.',role:'defense',hp:85,radius:8,cost:0.2,color:'#a080c0',shape:'circle',effects:{armor:0.2,block:0.2}},
'Rib':{nameRu:'R-Ребро',descRu:'Несущий элемент.',role:'structure',hp:90,radius:10,cost:0.15,color:'#c8b090',shape:'curve',effects:{loadbearing:true}},
'Rivet':{nameRu:'R-Заклёпка',descRu:'Мелкий несущий модуль.',role:'structure',hp:80,radius:5,cost:0.1,color:'#707070',shape:'circle',effects:{loadbearing:true}},
'Relay':{nameRu:'R-Реле',descRu:'Соединяет модули.',role:'structure',hp:40,radius:4,cost:0.1,color:'#80c080',shape:'circle',effects:{assembly:true}},
'Resonator':{nameRu:'R-Резонатор',descRu:'Простой сенсор.',role:'sense',hp:30,radius:5,cost:0.15,color:'#c070d0',shape:'circle',effects:{sense:1}},
'Ramp':{nameRu:'R-Пандус',descRu:'Чуть больше скорости и обзора.',role:'sense',hp:25,radius:4,cost:0.1,color:'#70a0c0',shape:'tri',effects:{sense:0.5,speed:0.05}},
'Reveal':{nameRu:'R-Раскрытие',descRu:'Улучшенный сенсор.',role:'sense',hp:30,radius:5,cost:0.2,color:'#a0e0f0',shape:'circle',effects:{sense:1.5}},
'Ripple':{nameRu:'R-Рябь',descRu:'Эхолокация.',role:'sense',hp:35,radius:6,cost:0.2,color:'#80c0e0',shape:'ring',effects:{sense:1.2}},
'Ray':{nameRu:'R-Луч',descRu:'Направленный сканер.',role:'sense',hp:25,radius:4,cost:0.15,color:'#e0e080',shape:'tri',effects:{sense:1.8}},
'Radiate':{nameRu:'R-Излучение',descRu:'Слабые сигналы.',role:'sense',hp:30,radius:5,cost:0.15,color:'#f0c060',shape:'star',effects:{sense:1}},
'Refract':{nameRu:'R-Преломление',descRu:'Малый сенсор.',role:'sense',hp:20,radius:4,cost:0.1,color:'#d0f0ff',shape:'tri',effects:{sense:0.8}},
'Resonate':{nameRu:'R-Резонанс',descRu:'Огромная дальность.',role:'sense',hp:35,radius:5,cost:0.2,color:'#d080e0',shape:'ring',effects:{sense:2}},
'Rotor':{nameRu:'R-Ротор',descRu:'Примитивный жгутик.',role:'move',hp:45,radius:6,cost:0.3,color:'#e0b060',shape:'blade',effects:{speed:0.8}},
'Rudder':{nameRu:'R-Руль',descRu:'Улучшает поворотливость.',role:'move',hp:35,radius:5,cost:0.2,color:'#c08060',shape:'tri',effects:{turn:0.5,speed:0.1}},
'Roll':{nameRu:'R-Каток',descRu:'Вращающееся колесо.',role:'move',hp:40,radius:6,cost:0.25,color:'#a0a060',shape:'circle',effects:{speed:0.4}},
'Rush':{nameRu:'R-Рывок',descRu:'Высокая скорость.',role:'move',hp:35,radius:5,cost:0.35,color:'#ff6040',shape:'blade',effects:{speed:1.2}},
'Rebound':{nameRu:'R-Отскок',descRu:'Пружинящий элемент.',role:'move',hp:40,radius:5,cost:0.2,color:'#60c0a0',shape:'circle',effects:{speed:0.2}},
'Recoil':{nameRu:'R-Отдача',descRu:'Реактивная насадка.',role:'move',hp:30,radius:5,cost:0.2,color:'#a06080',shape:'tri',effects:{speed:0.3}},
'Realign':{nameRu:'R-Выравнивание',descRu:'Гироскоп.',role:'move',hp:30,radius:4,cost:0.15,color:'#80a0a0',shape:'circle',effects:{turn:0.8}},
'Reactor':{nameRu:'R-Реактор',descRu:'Производит энергию.',role:'meta',hp:60,radius:8,cost:0,color:'#40d060',shape:'circle',effects:{energyProd:1.2,longevity:0.06}},
'Root':{nameRu:'R-Корень',descRu:'Фильтрует питание.',role:'digest',hp:50,radius:6,cost:0.2,color:'#60a040',shape:'root',effects:{filter:true,energyProd:0.4,longevity:0.05}},
'Roost':{nameRu:'R-Насест',descRu:'Утолщение для засады.',role:'meta',hp:55,radius:7,cost:0.15,color:'#806040',shape:'circle',effects:{}},
'Rill':{nameRu:'R-Ручей',descRu:'Циркуляция жидкости.',role:'meta',hp:30,radius:4,cost:0.1,color:'#80a0c0',shape:'curve',effects:{energyProd:0.15,longevity:0.03}},
'Rope':{nameRu:'R-Канат',descRu:'Гибкая нить.',role:'meta',hp:35,radius:4,cost:0.1,color:'#a08060',shape:'curve',effects:{}},
'Rattle':{nameRu:'R-Трещотка',descRu:'Вибрационный орган.',role:'meta',hp:25,radius:4,cost:0.15,color:'#c0a080',shape:'circle',effects:{}},
'Reflux':{nameRu:'R-Рефлюкс',descRu:'Ускоряет переваривание.',role:'digest',hp:40,radius:6,cost:0.2,color:'#80c080',shape:'blob',effects:{digest:0.4}},
'Regen':{nameRu:'R-Регенерация',descRu:'Ускоряет ремонт, жизнь.',role:'meta',hp:50,radius:6,cost:0.4,color:'#40ff80',shape:'circle',effects:{healRate:1.2,longevity:0.15}},
'Reform':{nameRu:'R-Перестройка',descRu:'Пластичный модуль.',role:'meta',hp:45,radius:6,cost:0.3,color:'#80ff40',shape:'circle',effects:{healRate:0.5,longevity:0.1}},
'Recharge':{nameRu:'R-Перезарядка',descRu:'Аккумулятор.',role:'meta',hp:40,radius:5,cost:0.1,color:'#60e0a0',shape:'circle',effects:{energyProd:0.5,longevity:0.03}},
'Ripcord':{nameRu:'R-Вытяжной трос',descRu:'Помогает выживать.',role:'meta',hp:30,radius:4,cost:0.15,color:'#a0a0c0',shape:'curve',effects:{longevity:0.05}},
'Revive':{nameRu:'R-Возрождение',descRu:'Стволовые клетки.',role:'meta',hp:55,radius:6,cost:0.5,color:'#40ffe0',shape:'star',effects:{healRate:0.3,longevity:0.2}},
'Reel':{nameRu:'R-Ворот',descRu:'Спиральный кишечник.',role:'digest',hp:45,radius:6,cost:0.2,color:'#60a080',shape:'circle',effects:{digest:0.5}},
'Root Conductor':{nameRu:'R-Корневой проводник',descRu:'Мощная фильтрация.',role:'digest',hp:55,radius:7,cost:0.2,color:'#40a060',shape:'root',effects:{filter:true,energyProd:0.8,longevity:0.1}},
'R-Miasma':{nameRu:'R-Миазма',descRu:'Ядовитый туман вокруг организма. Травит врагов.',role:'weapon',hp:45,radius:7,cost:0.5,color:'#70d050',shape:'blob',effects:{poison:1,dmg:3},aura:'poison'},
'R-Lumen':{nameRu:'R-Люмен',descRu:'Биолюминесцентный орган. Светится.',role:'sense',hp:25,radius:5,cost:0.2,color:'#ffff80',shape:'circle',effects:{sense:0.5},aura:'glow'},
'R-Crystal':{nameRu:'R-Кристалл',descRu:'Минеральный кристалл с искрами. Броня и отражение.',role:'defense',hp:90,radius:7,cost:0.35,color:'#a0f0ff',shape:'tri',effects:{armor:0.4,reflect:0.2},aura:'sparkle'},
'R-Bulwark':{nameRu:'R-Оплот',descRu:'Массивная плита. Блокирует атаки.',role:'defense',hp:110,radius:9,cost:0.3,color:'#7080a0',shape:'circle',effects:{block:0.6,armor:0.2}},
'R-Parasite':{nameRu:'R-Паразит',descRu:'Высасывает энергию.',role:'weapon',hp:25,radius:5,cost:0.3,color:'#800060',shape:'blob',effects:{lifesteal:0.8,dmg:5}},
'R-Toxin':{nameRu:'R-Токсин',descRu:'Ядовитая слизь.',role:'weapon',hp:30,radius:5,cost:0.25,color:'#a0e050',shape:'blob',effects:{poison:1,dmg:4}},
'R-Spore':{nameRu:'R-Спора',descRu:'Регенеративные споры.',role:'meta',hp:40,radius:6,cost:0.3,color:'#90c070',shape:'circle',effects:{healRate:1.5,longevity:0.1},aura:'spore'},
'R-Vortex':{nameRu:'R-Воронка',descRu:'Затягивает врагов.',role:'weapon',hp:50,radius:8,cost:0.4,color:'#6080c0',shape:'ring',effects:{dmg:2},aura:'vortex'},
'R-Frost':{nameRu:'R-Мороз',descRu:'Ледяная аура, замедляет.',role:'weapon',hp:35,radius:6,cost:0.3,color:'#b0e0ff',shape:'star',effects:{slow:1.5,dmg:2},aura:'frost'},
'R-Bomber':{nameRu:'R-Бомбардир',descRu:'Взрывается при смерти.',role:'weapon',hp:45,radius:6,cost:0.4,color:'#ff6020',shape:'circle',effects:{dmg:8},aura:'ember',explodesOnDeath:true},
'R-Halo':{nameRu:'R-Гало',descRu:'Аура жизни. Лечит родственников.',role:'meta',hp:35,radius:6,cost:0.3,color:'#ffffa0',shape:'ring',effects:{healRate:0.5,longevity:0.08},aura:'halo'},
'R-Mirror':{nameRu:'R-Зеркало',descRu:'Полированная поверхность.',role:'defense',hp:55,radius:6,cost:0.3,color:'#e0f0ff',shape:'circle',effects:{reflect:0.5,block:0.2},aura:'sparkle'}
};

const ALL_MODULES = Object.keys(RC);
const NONCORE_MODULES = ALL_MODULES.filter(n => RC[n].role !== 'core');

const FAMILY_BONUSES = {
  carnivore:{dmg:0.10, energyProd:-0.05},
  herbivore:{digest:0.10, dmg:-0.10},
  omnivore:{dmg:0.05, energyProd:0.05, armor:-0.03},
  filter:{energyProd:0.15, speed:-0.15}
};
const SPECIES_BONUSES = {
  'Остроклыкий':{dmg:0.10},
  'Бронированный':{armor:0.10},
  'Стремительный':{speed:0.10},
  'Прозорливый':{sense:0.10},
  'Пищеварительный':{digest:0.10},
  'Живучий':{energyProd:0.10},
  'Обыкновенный':{}
};
const FAMILY_PREF = ['Vor','Rapt','Dent','Sangu','Herb','Foli','Verd','Gram','Omni','Vers','Poly','Filt','Sorb','Col','Lum','Nec','Chro','Psy','Cryo','Therm'];
const FAMILY_SUF  = ['idae','inae','aceae','ellidae','omorpha','opsidae','iformes','ellata'];
function makeFamilyName(rng){ return rng.pick(FAMILY_PREF) + rng.pick(FAMILY_SUF); }

// ============================================================
// МОДУЛЬ
// ============================================================
class Module {
  constructor(t){
    this.type = t;
    this.def = RC[t];
    this.hp = this.def.hp;
    this.maxHp = this.def.hp;
    this.stage = 'ok';
    this.functional = 1;
    this.offsetX = 0;
    this.offsetY = 0;
    this.angle = 0;
    this.radius = this.def.radius;
    this.worldX = 0;
    this.worldY = 0;
  }
  updateStage(){
    const r = this.hp / this.maxHp;
    this.stage = this.hp <= 0 ? 'broken' : r < 0.6 ? 'damaged' : 'ok';
    this.functional = this.stage === 'broken' ? 0 : this.stage === 'damaged' ? 0.55 : 1;
  }
  damage(a){ this.hp = Math.max(0, this.hp - a); this.updateStage(); return this.stage === 'broken'; }
  repair(a){ this.hp = Math.min(this.maxHp, this.hp + a); this.updateStage(); }
}

// ============================================================
// ГЕНОМ
// ============================================================
class Genome {
  constructor(a='nucleus'){
    this.anchorType = a;
    this.moduleNames = [];
    this.organs = { meatStomach:false, plantStomach:false, intestine:0, liver:0 };
    this.bodyLimit = 25;
    this.familyName = 'Incognitidae';
  }
  clone(){
    const g = new Genome(this.anchorType);
    g.moduleNames = this.moduleNames.slice();
    g.organs = { ...this.organs };
    g.bodyLimit = this.bodyLimit;
    g.familyName = this.familyName;
    return g;
  }
  getDiet(){
    const m = this.organs.meatStomach, p = this.organs.plantStomach;
    if (m && p) return 'omnivore';
    if (m) return 'carnivore';
    if (p) return 'herbivore';
    if (this.moduleNames.some(n => n === 'Root' || n === 'Root Conductor')) return 'filter';
    return 'herbivore';
  }
}

function determineSpecies(mods){
  let w=0,d=0,mv=0,se=0,dg=0,mt=0;
  for (const m of mods){
    if (m.stage === 'broken') continue;
    const r = m.def.role;
    if (r === 'weapon') w++;
    else if (r === 'defense') d++;
    else if (r === 'move') mv++;
    else if (r === 'sense') se++;
    else if (r === 'digest') dg++;
    else if (r === 'meta') mt++;
  }
  const counts = {'Остроклыкий':w,'Бронированный':d,'Стремительный':mv,'Прозорливый':se,'Пищеварительный':dg,'Живучий':mt};
  let best = 'Обыкновенный', bv = 1;
  for (const [n,v] of Object.entries(counts)) if (v > bv){ bv = v; best = n; }
  return best;
}

// ============================================================
// ЕДА
// ============================================================
class Food {
  constructor(x,y,t,e){
    this.x = x; this.y = y;
    this.type = t;
    this.energy = e;
    this.radius = t === 'plant' ? 4 : 6;
    this.eaten = false;
    this.life = 45;
    this.srcGenome = null;
  }
}

// ============================================================
// ОРГАНИЗМ
// ============================================================
let ORG_ID = 0;
class Organism {
  constructor(g,x,y){
    this.id = ++ORG_ID;
    this.genome = g;
    this.familyName = g.familyName || 'Incognitidae';
    this.x = x; this.y = y;
    this.angle = Math.random() * Math.PI * 2;
    this.targetAngle = this.angle;
    this.energy = 60;
    this.maxEnergy = 100;
    this.fat = 0;
    this.age = 0;
    this.generation = 0;
    this.states = { stun:0, slow:0, bleed:0, corrosion:0, poison:0, shock:0 };
    this.reproduceCd = 6;
    this.digestTimer = 0;
    this.aiTimer = 0;
    this.improveTimer = 3 + Math.random() * 8;
    this.dead = false;
    this.deathReason = '';
    this.corpseDropped = false;
    this.lastAttacker = null;
    this.parentId = null;
    this.children = new Set();
    this.siblings = new Set();
    this.diet = g.getDiet();
    this.modules = [];
    this.boundingRadius = 10;
    this.species = 'Обыкновенный';
    this.rebuildBody();
    this.longevity = this.getStat('longevity');
    this.maxAge = 40 + this.longevity * 100;
  }

  rebuildBody(){
    this.modules = [];
    const cores = [], others = [];
    for (const name of this.genome.moduleNames){
      if (!RC[name]) continue;
      if (RC[name].role === 'core') cores.push(name);
      else others.push(name);
    }
    if (cores.length === 0){ this.genome.moduleNames.unshift('R-Membrane'); cores.push('R-Membrane'); }
    const cm = new Module(cores[0]);
    cm.offsetX = 0; cm.offsetY = 0;
    this.modules.push(cm);
    for (let i = 1; i < cores.length; i++){
      const m = new Module(cores[i]);
      const a = (i / cores.length) * Math.PI * 2;
      m.offsetX = Math.cos(a) * 6; m.offsetY = Math.sin(a) * 6;
      m.angle = a;
      this.modules.push(m);
    }
    const ringOrder = { structure:0, digest:0, meta:0, sense:1, move:1, weapon:2, defense:2 };
    others.sort((a,b) => {
      const ra = ringOrder[RC[a].role] ?? 0;
      const rb = ringOrder[RC[b].role] ?? 0;
      return ra - rb;
    });
    let ring = 0, idxInRing = 0, perRing = 5, ringRadius = 13;
    for (const name of others){
      const m = new Module(name);
      const ang = (idxInRing / perRing) * Math.PI * 2 + ring * 0.4;
      m.offsetX = Math.cos(ang) * ringRadius;
      m.offsetY = Math.sin(ang) * ringRadius;
      m.angle = ang;
      this.modules.push(m);
      idxInRing++;
      if (idxInRing >= perRing){ idxInRing = 0; ring++; perRing = 5 + ring * 2; ringRadius += 10; }
    }
    this.computeBounds();
    this.species = determineSpecies(this.modules);
    this.diet = this.genome.getDiet();
    this._auras = null;
  }

  computeBounds(){
    let r = 0;
    for (const m of this.modules){
      const d = Math.sqrt(m.offsetX * m.offsetX + m.offsetY * m.offsetY) + m.radius;
      if (d > r) r = d;
    }
    this.boundingRadius = r + 2;
  }

  computeWorldPositions(){
    for (const m of this.modules){ m.worldX = this.x + m.offsetX; m.worldY = this.y + m.offsetY; }
  }

  getAuras(){
    if (this._auras !== null && this._auras !== undefined) return this._auras;
    const s = new Set();
    for (const m of this.modules){ if (m.stage === 'broken') continue; if (m.def.aura) s.add(m.def.aura); }
    this._auras = s;
    return s;
  }

  getStat(name){
    let v = 0;
    for (const m of this.modules){
      if (m.stage === 'broken') continue;
      const eff = m.def.effects[name];
      if (eff) v += eff * m.functional;
    }
    if (this.genome.anchorType === 'nucleus'){ if (name === 'healRate') v += 0.3; }
    else if (this.genome.anchorType === 'membrane'){ if (name === 'armor') v += 0.15; }
    else if (this.genome.anchorType === 'sensor'){ if (name === 'sense') v += 0.5; }
    const fb = FAMILY_BONUSES[this.diet];
    if (fb && fb[name]) v *= (1 + fb[name]);
    const sb = SPECIES_BONUSES[this.species];
    if (sb && sb[name]) v *= (1 + sb[name]);
    return v;
  }

  die(r){ if (this.dead) return; this.dead = true; this.deathReason = r; }

  isFamily(other){
    if (this === other) return true;
    return this.parentId === other.id || other.parentId === this.id ||
           this.children.has(other.id) || other.children.has(this.id) ||
           this.siblings.has(other.id) || other.siblings.has(this.id);
  }

  update(dt, world){
    if (this.dead) return;
    this.age += dt;
    this._auras = null;
    for (const k in this.states) if (this.states[k] > 0) this.states[k] = Math.max(0, this.states[k] - dt);

    const nuc = this.modules.find(m => m.type === 'R-Nucleus');
    const mem = this.modules.find(m => m.type === 'R-Membrane');
    if (nuc && nuc.stage === 'broken'){ this.die('ядро разрушено'); return; }
    if (mem && mem.stage === 'broken'){ this.die('мембрана разорвана'); return; }

    const loadB = this.modules.filter(m => m.def.effects.loadbearing);
    if (loadB.length > 0 && loadB.every(m => m.stage === 'broken')){ this.die('распад тела'); return; }

    const prod = this.getStat('energyProd') + 0.4;
    const bodyCost = 0.015 * this.modules.length;
    let consume = (0.9 + bodyCost) * world.metabolismMul;
    if (this.genome.anchorType === 'nucleus') consume *= 0.9;
    if (mem && mem.stage !== 'ok') consume += (1 - mem.functional) * 2;
    if (this.states.bleed > 0) consume += 1.8;
    if (this.states.corrosion > 0){
      for (const m of this.modules) if (Math.random() < dt * 1.5) m.damage(1);
    }
    if (this.states.poison > 0) consume += 1.2;

    const speedStat = this.getStat('speed');
    const baseSpeed = 18 + speedStat * 22;
    const slowMul = this.states.slow > 0 ? 0.5 : 1;
    const stunMul = (this.states.stun > 0 || this.states.shock > 0) ? 0 : 1;
    const fatBoost = this.fat > 0 ? 1 : 0;
    const lowEnergyMul = (this.energy < 20 && !fatBoost) ? 0.55 : 1;
    const speed = baseSpeed * slowMul * stunMul * lowEnergyMul;

    let da = this.targetAngle - this.angle;
    while (da > Math.PI) da -= Math.PI * 2;
    while (da < -Math.PI) da += Math.PI * 2;
    const turn = 3 + this.getStat('turn') * 2.5;
    this.angle += clamp(da, -turn * dt, turn * dt);

    consume += speed * 0.025;
    this.x += Math.cos(this.angle) * speed * dt;
    this.y += Math.sin(this.angle) * speed * dt;
    const br = this.boundingRadius;
    this.x = clamp(this.x, br, world.width - br);
    this.y = clamp(this.y, br, world.height - br);

    this.energy = clamp(this.energy + (prod - consume) * dt, 0, this.maxEnergy);

    const fatCap = 30 + this.modules.length * 2;
    if (this.energy > this.maxEnergy * 0.92 && this.fat < fatCap){
      const t = Math.min(2.5 * dt, fatCap - this.fat, this.energy - this.maxEnergy * 0.92);
      this.fat += t;
      this.energy -= t;
    }
    if (this.energy <= 0.1 && this.fat > 0){
      const need = this.maxEnergy * 0.5 - this.energy;
      const t = Math.min(this.fat, need, 5 * dt);
      this.fat -= t;
      this.energy += t * 0.9;
    }
    if (this.energy <= 0 && this.fat <= 0){ this.die('голод'); return; }

    const hr = this.getStat('healRate');
    if (hr > 0 && this.energy > 25){
      for (const m of this.modules){
        if (m.stage !== 'ok' && m.hp < m.maxHp){ m.repair(hr * dt * 4); this.energy -= 0.15 * dt; }
      }
    }

    if (this.reproduceCd > 0) this.reproduceCd -= dt;
    if (this.digestTimer > 0) this.digestTimer -= dt;
    if (this.aiTimer > 0) this.aiTimer -= dt;
    if (this.improveTimer > 0) this.improveTimer -= dt;
    if (this.improveTimer <= 0){ this.improveTimer = 5 + Math.random() * 6; this.improveBody(world); }
    if (this.aiTimer <= 0){ this.aiTimer = 0.25; this.updateAI(world); }
  }

  improveBody(world){
    if (this.energy < this.maxEnergy * 0.55) return;
    const bodyCost = this.modules.length;
    if (bodyCost >= this.genome.bodyLimit){ this.pruneBody(); return; }
    const roleCount = {};
    for (const m of this.modules){ roleCount[m.def.role] = (roleCount[m.def.role] || 0) + 1; }
    const weaponCount = roleCount['weapon'] || 0;
    const defenseCount = roleCount['defense'] || 0;
    const diet = this.diet;
    const wants = [];
    if (weaponCount > defenseCount + 2) wants.push('Rim','Rind','Resist','Ridge','Reflector','Reef','R-Crystal','R-Bulwark');
    if (defenseCount > weaponCount + 2 && diet !== 'herbivore') wants.push('Razor','Rake','Reap','Razor Shock','R-Miasma','R-Frost');
    if (diet === 'carnivore' || diet === 'omnivore'){
      if (this.getStat('dmg') < 18) wants.push('Razor','Rake','Reap','Razor Shock','Reactor Surge','Ripplestorm');
    }
    if (diet === 'herbivore' || diet === 'filter'){
      if (this.getStat('energyProd') < 2.2) wants.push('Reactor','Root','Root Conductor','Recharge','Rill');
    }
    if (this.getStat('speed') < 1.2) wants.push('Rotor','Roll','Rush','Rudder','Rebound');
    if (this.getStat('sense') < 1.2) wants.push('Ray','Resonate','Reveal','Ripple','R-Lumen');
    if (this.getStat('armor') < 0.2) wants.push('Rim','Rind','Resist','Reef','Rivet');
    if (this.getStat('healRate') < 0.4) wants.push('Regen','Reform','Revive','R-Spore');
    if (this.getStat('longevity') < 0.4) wants.push('Regen','Revive','Reform','Reactor','Ripcord');
    if (this.getStat('digest') < 0.4) wants.push('Reflux','Reel');
    let pick;
    if (wants.length > 0) pick = wants[Math.floor(Math.random() * wants.length)];
    else pick = NONCORE_MODULES[Math.floor(Math.random() * NONCORE_MODULES.length)];
    if (RC[pick] && RC[pick].role !== 'core'){
      this.genome.moduleNames.push(pick);
      this.rebuildBody();
      this.longevity = this.getStat('longevity');
      this.maxAge = 40 + this.longevity * 100;
      this.energy -= 8;
      world.mutationsCount++;
      if (Math.random() < 0.03 && this.genome.bodyLimit < 60) this.genome.bodyLimit++;
    }
  }

  pruneBody(){
    if (this.genome.moduleNames.length <= 4) return;
    const counts = {};
    for (const n of this.genome.moduleNames){
      if (RC[n] && RC[n].role !== 'core') counts[n] = (counts[n] || 0) + 1;
    }
    const dups = Object.entries(counts).filter(([n,c]) => c >= 6);
    if (dups.length === 0) return;
    const [name] = dups[Math.floor(Math.random() * dups.length)];
    const idx = this.genome.moduleNames.lastIndexOf(name);
    if (idx >= 0){
      this.genome.moduleNames.splice(idx, 1);
      this.rebuildBody();
      this.longevity = this.getStat('longevity');
      this.maxAge = 40 + this.longevity * 100;
      this.energy += 3;
    }
  }

  updateAI(world){
    const diet = this.diet;
    const senseRange = 60 + this.getStat('sense') * 55;
    const senseR2 = senseRange * senseRange;

    let bestFood = null, bestFoodD = senseR2;
    for (const f of world.foods){
      if (f.eaten) continue;
      const d = dist2(this.x, this.y, f.x, f.y);
      if (d >= bestFoodD) continue;
      if (diet === 'herbivore' && f.type !== 'plant') continue;
      if (diet === 'carnivore' && f.type !== 'meat') continue;
      if (diet === 'filter' && f.type !== 'plant') continue;
      bestFood = f; bestFoodD = d;
    }

    let threat = null, threatD = senseR2;
    for (const o of world.organisms){
      if (o === this || o.dead) continue;
      if (this.isFamily(o)) continue;
      if (o.diet === 'carnivore' && o.boundingRadius > this.boundingRadius * 1.25){
        const d = dist2(this.x, this.y, o.x, o.y);
        if (d < threatD){ threat = o; threatD = d; }
      }
    }

    let prey = null, preyD = senseR2;
    if (diet !== 'herbivore'){
      for (const o of world.organisms){
        if (o === this || o.dead) continue;
        if (this.isFamily(o)) continue;
        if (o.boundingRadius < this.boundingRadius * 0.95){
          const d = dist2(this.x, this.y, o.x, o.y);
          if (d < preyD){ prey = o; preyD = d; }
        }
      }
    }

    if (threat && this.energy < this.maxEnergy * 0.8){
      this.targetAngle = Math.atan2(this.y - threat.y, this.x - threat.x);
    } else if (bestFood){
      this.targetAngle = Math.atan2(bestFood.y - this.y, bestFood.x - this.x);
    } else if (prey && this.energy < this.maxEnergy * 0.7){
      this.targetAngle = Math.atan2(prey.y - this.y, prey.x - this.x);
    } else if (prey && diet === 'carnivore'){
      this.targetAngle = Math.atan2(prey.y - this.y, prey.x - this.x);
    } else {
      this.targetAngle += (Math.random() - 0.5) * 0.5;
    }
  }
}

// ============================================================
// ПРОСТРАНСТВЕННАЯ СЕТКА
// ============================================================
class SpatialGrid {
  constructor(w,h,c){
    this.cell = c;
    this.cols = Math.ceil(w / c);
    this.rows = Math.ceil(h / c);
    this.cells = new Array(this.cols * this.rows);
    for (let i = 0; i < this.cells.length; i++) this.cells[i] = [];
  }
  clear(){ for (let i = 0; i < this.cells.length; i++) this.cells[i].length = 0; }
  insert(obj){
    const cx = clamp(Math.floor(obj.x / this.cell), 0, this.cols - 1);
    const cy = clamp(Math.floor(obj.y / this.cell), 0, this.rows - 1);
    this.cells[cy * this.cols + cx].push(obj);
  }
  queryNeighbors(x,y,r,out){
    const cx = clamp(Math.floor(x / this.cell), 0, this.cols - 1);
    const cy = clamp(Math.floor(y / this.cell), 0, this.rows - 1);
    const cr = Math.ceil(r / this.cell);
    out.length = 0;
    for (let dy = -cr; dy <= cr; dy++){
      for (let dx = -cr; dx <= cr; dx++){
        const nx = cx + dx, ny = cy + dy;
        if (nx < 0 || ny < 0 || nx >= this.cols || ny >= this.rows) continue;
        const cell = this.cells[ny * this.cols + nx];
        for (let i = 0; i < cell.length; i++) out.push(cell[i]);
      }
    }
    return out;
  }
}

// ============================================================
// ЭФФЕКТ
// ============================================================
class Effect {
  constructor(x,y,vx,vy,c,l,s){
    this.x = x; this.y = y; this.vx = vx; this.vy = vy;
    this.color = c; this.life = l; this.maxLife = l; this.size = s;
  }
  update(dt){
    this.x += this.vx * dt; this.y += this.vy * dt;
    this.vx *= 0.94; this.vy *= 0.94;
    this.life -= dt;
  }
  draw(ctx){
    const a = Math.max(0, this.life / this.maxLife);
    ctx.globalAlpha = a;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}

// ============================================================
// МИР
// ============================================================
class World {
  constructor(opts){
    this.width = opts.width;
    this.height = opts.height;
    this.climate = opts.climate;
    this.resources = opts.resources;
    this.mutationRate = opts.mutationRate;
    this.difficulty = opts.difficulty;
    this.metabolismMul = opts.metabolismMul;
    this.maxPopulation = opts.maxPopulation;
    this.plantAmountMul = opts.plantAmountMul;
    this.meatAmountMul = opts.meatAmountMul;
    this.plantValueMul = opts.plantValueMul;
    this.meatValueMul = opts.meatValueMul;
    this.rng = new RNG(Date.now());
    this.foods = [];
    this.organisms = [];
    this.effects = [];
    this.mutationsCount = 0;
    this.time = 0;
    this.maxGeneration = 0;
    this.seasonTime = 0;
    this.season = 'spring';
    this.foodTimer = 0;
    this.populateInitial(opts.count);
    this.spawnInitialFood();
  }
  populateInitial(count){
    const rng = this.rng;
    for (let i = 0; i < count; i++){
      const g = this.makeStarterGenome(rng);
      const o = new Organism(g, rng.range(80, this.width - 80), rng.range(80, this.height - 80));
      o.generation = 0;
      o.age = rng.range(0, 10);
      this.organisms.push(o);
    }
  }
  makeStarterGenome(rng){
    const g = new Genome(rng.pick(['nucleus','membrane','sensor']));
    g.familyName = makeFamilyName(rng);
    g.moduleNames.push('R-Membrane');
    g.moduleNames.push('R-Nucleus');
    g.moduleNames.push('Rotor');
    if (rng.chance(0.35)) g.moduleNames.push('Rotor');
    if (rng.chance(0.3)) g.moduleNames.push('Rib');
    if (rng.chance(0.3)) g.moduleNames.push('Resonator');
    if (rng.chance(0.5)) g.organs.plantStomach = true;
    else g.organs.meatStomach = true;
    if (rng.chance(0.3)) g.organs.intestine = 1;
    if (rng.chance(0.2)) g.organs.liver = 1;
    return g;
  }
  spawnInitialFood(){
    const basePlant = this.resources === 'plants' ? 320 : this.resources === 'meat' ? 60 : 180;
    const baseMeat  = this.resources === 'meat'  ? 200 : this.resources === 'plants' ? 40 : 100;
    const plantCount = Math.floor(basePlant * this.plantAmountMul);
    const meatCount  = Math.floor(baseMeat  * this.meatAmountMul);
    for (let i = 0; i < plantCount; i++) this.spawnFood('plant');
    for (let i = 0; i < meatCount; i++)  this.spawnFood('meat');
  }
  spawnFood(type){
    if (this.foods.length >= 800) return;
    const baseE = type === 'plant' ? 12 : 20;
    const valMul = type === 'plant' ? this.plantValueMul : this.meatValueMul;
    const f = new Food(
      this.rng.range(20, this.width - 20),
      this.rng.range(20, this.height - 20),
      type, baseE * valMul
    );
    this.foods.push(f);
  }
  update(dt){
    this.time += dt;
    this.seasonTime += dt;
    const cycle = Math.floor(this.seasonTime / 60) % 4;
    this.season = ['spring','summer','autumn','winter'][cycle];

    for (const f of this.foods){
      if (f.eaten) continue;
      f.life -= dt;
      if (f.life <= 0) f.eaten = true;
    }

    let spawnRate = 1;
    if (this.climate === 'drought') spawnRate = 0.4;
    else if (this.climate === 'rainy') spawnRate = 1.6;
    else if (this.climate === 'cold') spawnRate = 0.7;
    if (this.season === 'winter') spawnRate *= 0.5;
    if (this.season === 'summer') spawnRate *= 1.3;

    const basePlantChance = this.resources === 'meat' ? 0.3 : this.resources === 'plants' ? 0.85 : 0.6;
    this.foodTimer += dt;
    if (this.foodTimer > 0.5){
      this.foodTimer = 0;
      if (this.foods.length < 700){
        if (Math.random() < spawnRate * this.plantAmountMul * basePlantChance * 0.8) this.spawnFood('plant');
        if (Math.random() < spawnRate * this.meatAmountMul * (1 - basePlantChance) * 0.8) this.spawnFood('meat');
      }
    }

    for (const e of this.effects) e.update(dt);
    if (this.effects.length > 200) this.effects.splice(0, this.effects.length - 200);
    this.effects = this.effects.filter(e => e.life > 0);
  }
  killOrganism(org){
    if (org.corpseDropped) return;
    org.corpseDropped = true;
    const meatCount = Math.min(5, Math.max(1, Math.floor(org.modules.length / 3)));
    for (let i = 0; i < meatCount; i++){
      const f = new Food(org.x + (Math.random()-0.5)*25, org.y + (Math.random()-0.5)*25, 'meat', 18 * this.meatValueMul);
      f.srcGenome = org.genome;
      this.foods.push(f);
    }
    if (org.lastAttacker && !org.lastAttacker.dead){
      const k = org.lastAttacker;
      k.energy = Math.min(k.maxEnergy, k.energy + 12);
      if (Math.random() < 0.35 && org.genome.moduleNames.length > 0){
        const srcMods = org.genome.moduleNames.filter(n => RC[n] && RC[n].role !== 'core');
        if (srcMods.length > 0 && k.genome.moduleNames.length < k.genome.bodyLimit){
          const learn = srcMods[Math.floor(Math.random() * srcMods.length)];
          k.genome.moduleNames.push(learn);
          k.rebuildBody();
          k.longevity = k.getStat('longevity');
          k.maxAge = 40 + k.longevity * 100;
          this.mutationsCount++;
        }
      }
      if (Math.random() < 0.15) k.energy = Math.min(k.maxEnergy, k.energy + 5);
    }
    const hasBomber = org.modules.some(m => m.def.explodesOnDeath && m.stage !== 'broken');
    if (hasBomber){
      for (const o of this.organisms){
        if (o === org || o.dead) continue;
        if (o.isFamily(org)) continue;
        const d2 = dist2(org.x, org.y, o.x, o.y);
        if (d2 < 70 * 70){
          const dmg = 25 * (1 - Math.sqrt(d2) / 70);
          o.energy -= dmg;
          for (const m of o.modules){
            if (m.stage !== 'broken' && Math.random() < 0.4) m.damage(dmg * 0.3);
          }
        }
      }
      for (let i = 0; i < 25; i++){
        this.effects.push(new Effect(org.x, org.y, (Math.random()-0.5)*180, (Math.random()-0.5)*180, '#ff6020', 1.2, 3));
      }
    }
    for (let i = 0; i < 6; i++){
      this.effects.push(new Effect(org.x, org.y, (Math.random()-0.5)*60, (Math.random()-0.5)*60, '#b04040', 0.8, 2));
    }
  }
}

// ============================================================
// СИМУЛЯЦИЯ
// ============================================================
class Simulation {
  constructor(world){
    this.world = world;
    this.timeScale = 1;
    this.paused = false;
    this.grid = new SpatialGrid(world.width, world.height, 80);
    this.tmpArr = [];
    this.hudTimer = 0;
    this.simTime = 0;
    this.auraTimer = 0;
  }
  update(dt){
    if (this.paused) return;
    const scaled = dt * this.timeScale;
    this.simTime += scaled;
    this.world.update(scaled);
    for (const o of this.world.organisms) o.update(scaled, this.world);
    for (const o of this.world.organisms) if (o.dead) this.world.killOrganism(o);
    this.world.organisms = this.world.organisms.filter(o => !o.dead);
    this.grid.clear();
    for (const o of this.world.organisms) this.grid.insert(o);
    for (const o of this.world.organisms) o.computeWorldPositions();

    // Ауры
    this.auraTimer += scaled;
    if (this.auraTimer > 0.2){
      const dtA = this.auraTimer;
      this.auraTimer = 0;
      for (const o of this.world.organisms){
        if (o.dead) continue;
        const auras = o.getAuras();
        if (auras.size === 0) continue;
        this.grid.queryNeighbors(o.x, o.y, o.boundingRadius + 55, this.tmpArr);
        for (const t of this.tmpArr){
          if (t === o || t.dead) continue;
          const d2 = dist2(o.x, o.y, t.x, t.y);
          const dr = o.boundingRadius + 40;
          if (auras.has('poison') && d2 < dr*dr && !o.isFamily(t)){
            t.states.poison = Math.max(t.states.poison, 1);
            t.energy -= 2 * dtA;
            if (Math.random() < 0.15) this.world.effects.push(new Effect(t.x + (Math.random()-0.5)*15, t.y + (Math.random()-0.5)*15, 0, -10, '#70d050', 0.5, 2));
          }
          if (auras.has('frost') && d2 < dr*dr && !o.isFamily(t)) t.states.slow = Math.max(t.states.slow, 1.5);
          if (auras.has('vortex') && d2 < dr*dr*1.5 && !o.isFamily(t)){
            const dx = o.x - t.x, dy = o.y - t.y;
            const len = Math.sqrt(dx*dx + dy*dy) || 1;
            t.x += dx/len * 25 * dtA; t.y += dy/len * 25 * dtA;
          }
          if (auras.has('halo') && d2 < dr*dr && o.isFamily(t)) t.energy = Math.min(t.maxEnergy, t.energy + 4 * dtA);
          if (auras.has('ember') && d2 < dr*dr*0.6 && !o.isFamily(t)) t.energy -= 1 * dtA;
        }
      }
    }

    // Еда
    for (const o of this.world.organisms){
      if (o.digestTimer > 0) continue;
      const diet = o.diet;
      for (const f of this.world.foods){
        if (f.eaten) continue;
        const rr = o.boundingRadius + f.radius + 6;
        if (dist2(o.x, o.y, f.x, f.y) < rr*rr){
          if (diet === 'herbivore' && f.type !== 'plant') continue;
          if (diet === 'carnivore' && f.type !== 'meat') continue;
          if (diet === 'filter' && f.type !== 'plant') continue;
          const dg = 1 + o.getStat('digest') * 0.6;
          const eff = f.type === 'plant' ? 1 : 1.3;
          o.energy = Math.min(o.maxEnergy, o.energy + f.energy * eff * dg);
          o.digestTimer = 1.2 / (1 + o.getStat('digest') * 0.6);
          f.eaten = true;
          this.world.effects.push(new Effect(f.x, f.y, 0, -20, f.type === 'plant' ? '#4f4' : '#f44', 0.5, 3));
          if (f.type === 'meat' && f.srcGenome && Math.random() < 0.2){
            const src = f.srcGenome.moduleNames.filter(n => RC[n] && RC[n].role !== 'core');
            if (src.length > 0 && o.genome.moduleNames.length < o.genome.bodyLimit){
              const learn = src[Math.floor(Math.random() * src.length)];
              o.genome.moduleNames.push(learn);
              o.rebuildBody();
              o.longevity = o.getStat('longevity');
              o.maxAge = 40 + o.longevity * 100;
              this.world.mutationsCount++;
            }
          }
          break;
        }
      }
    }

    // Бой
    for (const o of this.world.organisms){
      if (o.dead) continue;
      this.grid.queryNeighbors(o.x, o.y, o.boundingRadius + 40, this.tmpArr);
      for (const other of this.tmpArr){
        if (other === o || other.dead) continue;
        if (other.id < o.id) continue;
        const d2 = dist2(o.x, o.y, other.x, other.y);
        const reach = o.boundingRadius + other.boundingRadius;
        if (d2 > reach * reach) continue;
        this.processCombat(o, other);
      }
    }

    // Размножение
    const maxPop = this.world.maxPopulation;
    for (const o of this.world.organisms){
      if (o.dead) continue;
      if (o.age >= o.maxAge){ o.die('старость'); continue; }
      if (this.world.organisms.length >= maxPop) continue;
      if (o.reproduceCd <= 0 && o.age > 15 && o.energy >= o.maxEnergy * 0.75 && o.modules.length >= 4 && this.world.organisms.length < maxPop){
        this.reproduce(o);
      }
    }
    if (this.world.organisms.length > maxPop){
      this.world.organisms.sort((a,b) => (a.energy + a.age * 0.01) - (b.energy + b.age * 0.01));
      while (this.world.organisms.length > maxPop){
        const o = this.world.organisms.pop();
        o.dead = true;
        this.world.killOrganism(o);
      }
    }

    if (this.world.foods.length > 0 && Math.random() < 0.05){
      this.world.foods = this.world.foods.filter(f => !f.eaten);
    }
  }
  processCombat(a,b){
    const dx = a.x - b.x, dy = a.y - b.y;
    const d = Math.sqrt(dx*dx + dy*dy) || 1;
    const overlap = (a.boundingRadius + b.boundingRadius) - d;
    if (overlap > 0){
      const push = Math.min(overlap * 0.5, 2);
      const nx = dx/d * push, ny = dy/d * push;
      a.x += nx * 0.5; a.y += ny * 0.5;
      b.x -= nx * 0.5; b.y -= ny * 0.5;
    }
    if (a.isFamily(b)) return;
    for (const ma of a.modules){
      if (ma.stage === 'broken') continue;
      for (const mb of b.modules){
        if (mb.stage === 'broken') continue;
        const dd = dist2(ma.worldX, ma.worldY, mb.worldX, mb.worldY);
        const rr = ma.radius + mb.radius;
        if (dd > rr * rr) continue;
        this.applyModuleCollision(a, ma, b, mb);
      }
    }
  }
  applyModuleCollision(A, aMod, B, bMod){
    const aRole = aMod.def.role, bRole = bMod.def.role;
    if (aRole === 'weapon' && bRole === 'weapon'){
      aMod.damage(3 * (0.5 + Math.random() * 0.5));
      bMod.damage(3 * (0.5 + Math.random() * 0.5));
      this.spark((aMod.worldX + bMod.worldX) / 2, (aMod.worldY + bMod.worldY) / 2, '#ffcc00');
      return;
    }
    if (aRole === 'weapon' && bRole !== 'weapon'){ this.hitAsWeapon(A, aMod, B, bMod); return; }
    if (bRole === 'weapon' && aRole !== 'weapon'){ this.hitAsWeapon(B, bMod, A, aMod); return; }
    if (aMod.type === 'R-Membrane' && bMod.type === 'R-Membrane') return;
    if (aRole === 'move' && bRole !== 'weapon'){
      const dmg = 2 * aMod.functional;
      if (bMod.damage(dmg)) this.spark(bMod.worldX, bMod.worldY, '#ff8800');
      if (Math.random() < 0.05) B.states.stun = Math.max(B.states.stun, 0.4);
    }
  }
  hitAsWeapon(attacker, aMod, defender, dMod){
    const eff = aMod.def.effects;
    let dmg = eff.dmg || 5;
    const pierce = eff.pierce || 1;
    const armor = dMod.def.effects.armor || 0;
    const block = dMod.def.effects.block || 0;
    const dmgFinal = dmg * pierce * (1 - armor) * (1 - block) * (0.6 + aMod.functional * 0.4);
    const broke = dMod.damage(dmgFinal);
    if (broke) this.spark(dMod.worldX, dMod.worldY, '#ff4040');
    else this.spark(dMod.worldX, dMod.worldY, '#ffaa00');
    if (dMod.type === 'R-Membrane'){
      defender.states.bleed = Math.max(defender.states.bleed, 2);
      defender.energy -= 2;
      this.world.effects.push(new Effect(dMod.worldX, dMod.worldY, 0, -10, '#60c0ff', 0.6, 2));
    }
    if (eff.corrosion) defender.states.corrosion = Math.max(defender.states.corrosion, 2);
    if (eff.slow) defender.states.slow = Math.max(defender.states.slow, 1.5);
    if (eff.stun) defender.states.stun = Math.max(defender.states.stun, eff.stun);
    if (eff.poison) defender.states.poison = Math.max(defender.states.poison, 2);
    if (eff.electric){
      defender.states.shock = Math.max(defender.states.shock, 0.8);
      this.world.effects.push(new Effect(dMod.worldX, dMod.worldY, 0, -30, '#80d0ff', 0.4, 2));
    }
    if (eff.lifesteal) attacker.energy = Math.min(attacker.maxEnergy, attacker.energy + dmgFinal * eff.lifesteal * 0.5);
    defender.lastAttacker = attacker;
    if (dMod.def.effects.reflect && Math.random() < dMod.def.effects.reflect) aMod.damage(dmgFinal * 0.5);
  }
  spark(x, y, c){
    this.world.effects.push(new Effect(x, y, (Math.random()-0.5)*80, (Math.random()-0.5)*80, c, 0.35, 2));
  }
  reproduce(parent){
    parent.reproduceCd = 10;
    const childEnergy = parent.energy * 0.4;
    parent.energy *= 0.55;
    const baseGenome = this.selectBaseDNA(parent);
    const childGenome = this.applyMutations(baseGenome);
    const angle = Math.random() * Math.PI * 2;
    const offset = parent.boundingRadius + 14;
    const child = new Organism(childGenome, parent.x + Math.cos(angle) * offset, parent.y + Math.sin(angle) * offset);
    child.generation = parent.generation + 1;
    child.energy = childEnergy;
    child.parentId = parent.id;
    parent.children.add(child.id);
    this.world.organisms.push(child);
    if (child.generation > this.world.maxGeneration) this.world.maxGeneration = child.generation;
    for (let i = 0; i < 8; i++){
      this.world.effects.push(new Effect(parent.x, parent.y, Math.cos(i/8*Math.PI*2)*40, Math.sin(i/8*Math.PI*2)*40, '#60ff90', 0.7, 2));
    }
  }
  selectBaseDNA(parent){
    const g = new Genome(parent.genome.anchorType);
    g.familyName = parent.familyName;
    g.organs = { ...parent.genome.organs };
    g.bodyLimit = parent.genome.bodyLimit;
    const cores = [], nonCore = [];
    for (const m of parent.modules){
      if (m.def.role === 'core') cores.push(m.type);
      else nonCore.push(m);
    }
    g.moduleNames = cores.slice();
    const keepCount = Math.max(1, Math.round(nonCore.length * 0.9));
    const scored = nonCore.map(m => ({ type: m.type, score: (m.hp / m.maxHp) * (0.7 + Math.random() * 0.3) }));
    scored.sort((a,b) => b.score - a.score);
    for (let i = 0; i < keepCount && i < scored.length; i++) g.moduleNames.push(scored[i].type);
    return g;
  }
  applyMutations(g){
    const rate = this.world.mutationRate;
    if (Math.random() < rate * 0.7 && g.moduleNames.length < g.bodyLimit){
      g.moduleNames.push(NONCORE_MODULES[Math.floor(Math.random() * NONCORE_MODULES.length)]);
      this.world.mutationsCount++;
    }
    if (Math.random() < rate * 0.5 && g.moduleNames.length > 3){
      const nc = g.moduleNames.map((n,i) => ({n,i})).filter(x => RC[x.n] && RC[x.n].role !== 'core');
      if (nc.length > 1){
        const rm = nc[Math.floor(Math.random() * nc.length)];
        g.moduleNames.splice(rm.i, 1);
        this.world.mutationsCount++;
      }
    }
    if (Math.random() < rate * 0.4){
      const r = Math.random();
      if (r < 0.33) g.organs.plantStomach = !g.organs.plantStomach;
      else if (r < 0.66) g.organs.meatStomach = !g.organs.meatStomach;
      else g.organs.intestine = Math.min(3, g.organs.intestine + 1);
      this.world.mutationsCount++;
    }
    if (!g.organs.plantStomach && !g.organs.meatStomach) g.organs.plantStomach = true;
    if (Math.random() < rate * 0.15 && g.bodyLimit < 60) g.bodyLimit++;
    return g;
  }
  getStats(){
    const orgs = this.world.organisms;
    let sumHp = 0, modules = 0, carn = 0, herb = 0, omni = 0, filt = 0, champ = null, champScore = -1;
    for (const o of orgs){
      let hp = 0, cnt = 0;
      for (const m of o.modules){ if (m.stage !== 'broken') hp += m.hp / m.maxHp; cnt++; }
      sumHp += hp; modules += cnt;
      const diet = o.diet;
      if (diet === 'carnivore') carn++;
      else if (diet === 'omnivore') omni++;
      else if (diet === 'filter') filt++;
      else herb++;
      const score = cnt * (hp / Math.max(1,cnt)) + o.age * 0.15;
      if (score > champScore){ champScore = score; champ = o; }
    }
    return {
      pop: orgs.length,
      avgHp: modules > 0 ? Math.round(sumHp / modules * 100) : 0,
      carn, herb, omni, filt, champ,
      gen: this.world.maxGeneration,
      mutations: this.world.mutationsCount,
      time: this.world.time,
      season: this.world.season,
      food: this.world.foods.filter(f => !f.eaten).length,
      maxPop: this.world.maxPopulation
    };
  }
  getLeaders(n){
    const scored = [];
    for (const o of this.world.organisms){
      if (o.dead) continue;
      let hp = 0, cnt = 0;
      for (const m of o.modules){ if (m.stage !== 'broken') hp += m.hp / m.maxHp; cnt++; }
      const hpPct = cnt > 0 ? hp / cnt : 0;
      const score = cnt * (0.5 + hpPct) + o.age * 0.15 + o.children.size * 0.5 + (o.fat / 20);
      scored.push({ o, score, hpPct, modCnt: cnt });
    }
    scored.sort((a,b) => b.score - a.score);
    return scored.slice(0, n);
  }
}

// ============================================================
// РЕНДЕРЕР
// ============================================================
class Renderer {
  constructor(canvas, world){
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.world = world;
    this.camera = { x: world.width/2, y: world.height/2, zoom: 1 };
    this.drag = null;
    this.didDrag = false;
    this.followed = null;
    this.highlightedModule = null;
    this.touchStart = null;
    this.touchDist = 0;
    this.setupInput();
    this.resize();
  }
  resize(){ this.canvas.width = window.innerWidth; this.canvas.height = window.innerHeight; }
  screenToWorld(sx, sy){
    const c = this.camera;
    return { x: (sx - this.canvas.width/2) / c.zoom + c.x, y: (sy - this.canvas.height/2) / c.zoom + c.y };
  }
  pickOrganism(sx, sy){
    const wp = this.screenToWorld(sx, sy);
    let best = null, bd = Infinity;
    for (const o of this.world.organisms){
      if (o.dead) continue;
      const d = dist2(wp.x, wp.y, o.x, o.y);
      const rr = o.boundingRadius + 20;
      if (d < bd && d < rr*rr){ bd = d; best = o; }
    }
    return best;
  }
  setupInput(){
    const cv = this.canvas;
    cv.addEventListener('mousedown', e => {
      if (e.button !== 0) return;
      this.drag = { x: e.clientX, y: e.clientY, camX: this.camera.x, camY: this.camera.y };
      this.didDrag = false;
    });
    cv.addEventListener('mousemove', e => {
      if (!this.drag) return;
      const dx = e.clientX - this.drag.x;
      const dy = e.clientY - this.drag.y;
      if (Math.abs(dx) + Math.abs(dy) > 4) this.didDrag = true;
      this.camera.x = this.drag.camX - dx / this.camera.zoom;
      this.camera.y = this.drag.camY - dy / this.camera.zoom;
      this.camera.x = clamp(this.camera.x, 0, this.world.width);
      this.camera.y = clamp(this.camera.y, 0, this.world.height);
    });
    cv.addEventListener('mouseup', e => {
      if (e.button !== 0) return;
      if (!this.didDrag){
        const org = this.pickOrganism(e.clientX, e.clientY);
        this.followed = org;
        document.getElementById('follow-panel').style.display = org ? 'block' : 'none';
      }
      this.drag = null;
    });
    cv.addEventListener('wheel', e => {
      e.preventDefault();
      const factor = e.deltaY > 0 ? 0.9 : 1.1;
      const newZoom = clamp(this.camera.zoom * factor, 0.15, 5);
      const wp = this.screenToWorld(e.clientX, e.clientY);
      this.camera.zoom = newZoom;
      const wp2 = this.screenToWorld(e.clientX, e.clientY);
      this.camera.x += wp.x - wp2.x;
      this.camera.y += wp.y - wp2.y;
    }, { passive: false });
    cv.addEventListener('touchstart', e => {
      if (e.touches.length === 1){
        this.touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY, camX: this.camera.x, camY: this.camera.y };
        this.didDrag = false;
      } else if (e.touches.length === 2){
        this.touchStart = null;
        this.touchDist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
      }
    }, { passive: true });
    cv.addEventListener('touchmove', e => {
      e.preventDefault();
      if (e.touches.length === 1 && this.touchStart){
        const dx = e.touches[0].clientX - this.touchStart.x;
        const dy = e.touches[0].clientY - this.touchStart.y;
        if (Math.abs(dx) + Math.abs(dy) > 8) this.didDrag = true;
        this.camera.x = this.touchStart.camX - dx / this.camera.zoom;
        this.camera.y = this.touchStart.camY - dy / this.camera.zoom;
        this.camera.x = clamp(this.camera.x, 0, this.world.width);
        this.camera.y = clamp(this.camera.y, 0, this.world.height);
      } else if (e.touches.length === 2 && this.touchDist > 0){
        const d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
        const factor = d / this.touchDist;
        this.camera.zoom = clamp(this.camera.zoom * factor, 0.15, 5);
        this.touchDist = d;
      }
    }, { passive: false });
    cv.addEventListener('touchend', e => {
      if (e.touches.length === 0){
        if (this.touchStart && !this.didDrag){
          const org = this.pickOrganism(this.touchStart.x, this.touchStart.y);
          this.followed = org;
          document.getElementById('follow-panel').style.display = org ? 'block' : 'none';
        }
        this.touchStart = null;
        this.touchDist = 0;
      }
    }, { passive: true });
    window.addEventListener('resize', () => this.resize());
  }
  modulePath(ctx, m){
    const wx = m.worldX, wy = m.worldY, r = m.radius;
    ctx.beginPath();
    switch (m.def.shape){
      case 'circle': ctx.arc(wx, wy, r, 0, Math.PI * 2); break;
      case 'spike': {
        const a = m.angle;
        ctx.moveTo(wx + Math.cos(a) * r * 1.3, wy + Math.sin(a) * r * 1.3);
        ctx.lineTo(wx + Math.cos(a + 2.3) * r * 0.7, wy + Math.sin(a + 2.3) * r * 0.7);
        ctx.lineTo(wx + Math.cos(a - 2.3) * r * 0.7, wy + Math.sin(a - 2.3) * r * 0.7);
        ctx.closePath();
        break;
      }
      case 'blade': {
        const a = m.angle;
        ctx.moveTo(wx + Math.cos(a) * r, wy + Math.sin(a) * r);
        ctx.lineTo(wx + Math.cos(a + 1.2) * r * 0.6, wy + Math.sin(a + 1.2) * r * 0.6);
        ctx.lineTo(wx + Math.cos(a - 1.2) * r * 0.6, wy + Math.sin(a - 1.2) * r * 0.6);
        ctx.closePath();
        break;
      }
      case 'ring': ctx.arc(wx, wy, r, 0, Math.PI * 2); break;
      case 'tri': {
        const a = m.angle;
        for (let i = 0; i < 3; i++){
          const ang = a + i * Math.PI * 2 / 3;
          const px = wx + Math.cos(ang) * r;
          const py = wy + Math.sin(ang) * r;
          if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.closePath();
        break;
      }
      case 'star': {
        for (let i = 0; i < 10; i++){
          const ang = (i / 10) * Math.PI * 2;
          const rad = i % 2 === 0 ? r : r * 0.5;
          const px = wx + Math.cos(ang) * rad;
          const py = wy + Math.sin(ang) * rad;
          if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.closePath();
        break;
      }
      case 'blob': ctx.arc(wx, wy, r, 0, Math.PI * 2); break;
      case 'curve': {
        const a = m.angle;
        ctx.arc(wx, wy, r, a - 1, a + 1);
        ctx.lineTo(wx + Math.cos(a + 1) * r * 0.5, wy + Math.sin(a + 1) * r * 0.5);
        ctx.closePath();
        break;
      }
      case 'root': {
        const a = m.angle;
        ctx.moveTo(wx, wy);
        for (let i = 0; i < 4; i++){
          const ang = a + i * 1.2;
          ctx.lineTo(wx + Math.cos(ang) * r * (0.6 + i * 0.15), wy + Math.sin(ang) * r * (0.6 + i * 0.15));
        }
        ctx.closePath();
        break;
      }
      default: ctx.arc(wx, wy, r, 0, Math.PI * 2);
    }
  }
  drawModuleShape(ctx, m){ this.modulePath(ctx, m); ctx.fill(); ctx.stroke(); }
  drawModuleShapeOutline(ctx, m){ this.modulePath(ctx, m); ctx.stroke(); }

  render(dt){
    const ctx = this.ctx, c = this.camera;
    const W = this.canvas.width, H = this.canvas.height;
    ctx.fillStyle = '#05080d';
    ctx.fillRect(0, 0, W, H);
    if (this.followed && !this.followed.dead){
      this.camera.x = lerp(this.camera.x, this.followed.x, 0.08);
      this.camera.y = lerp(this.camera.y, this.followed.y, 0.08);
    }
    ctx.save();
    ctx.translate(W/2, H/2);
    ctx.scale(c.zoom, c.zoom);
    ctx.translate(-c.x, -c.y);
    const gridSize = 100;
    const x0 = Math.floor((c.x - W/(2*c.zoom)) / gridSize) * gridSize;
    const y0 = Math.floor((c.y - H/(2*c.zoom)) / gridSize) * gridSize;
    const x1 = c.x + W/(2*c.zoom);
    const y1 = c.y + H/(2*c.zoom);
    ctx.strokeStyle = 'rgba(30,60,100,0.35)';
    ctx.lineWidth = 1 / c.zoom;
    ctx.beginPath();
    for (let x = x0; x < x1; x += gridSize){ ctx.moveTo(x, y0); ctx.lineTo(x, y1); }
    for (let y = y0; y < y1; y += gridSize){ ctx.moveTo(x0, y); ctx.lineTo(x1, y); }
    ctx.stroke();
    ctx.strokeStyle = '#3a6a9a';
    ctx.lineWidth = 3 / c.zoom;
    ctx.strokeRect(0, 0, this.world.width, this.world.height);
    for (const f of this.world.foods){
      if (f.eaten) continue;
      if (f.x < x0-20 || f.x > x1+20 || f.y < y0-20 || f.y > y1+20) continue;
      ctx.fillStyle = f.type === 'plant' ? '#3a9a3a' : '#8a3a3a';
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    const now = Date.now();
    // Ауры
    for (const o of this.world.organisms){
      if (o.dead) continue;
      if (o.x < x0-150 || o.x > x1+150 || o.y < y0-150 || o.y > y1+150) continue;
      const auras = o.getAuras();
      if (auras.size === 0) continue;
      const r = o.boundingRadius;
      if (auras.has('poison')){ ctx.fillStyle = 'rgba(100,220,100,' + (0.10 + Math.sin(now/500)*0.03) + ')'; ctx.beginPath(); ctx.arc(o.x, o.y, r+30, 0, Math.PI*2); ctx.fill(); }
      if (auras.has('ember')){ ctx.fillStyle = 'rgba(255,100,30,0.14)'; ctx.beginPath(); ctx.arc(o.x, o.y, r+20, 0, Math.PI*2); ctx.fill(); }
      if (auras.has('spore')){ ctx.fillStyle = 'rgba(150,200,100,0.12)'; ctx.beginPath(); ctx.arc(o.x, o.y, r+25, 0, Math.PI*2); ctx.fill(); }
      if (auras.has('glow')){
        const g = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, r+40);
        g.addColorStop(0, 'rgba(255,255,150,0.30)');
        g.addColorStop(1, 'rgba(255,255,150,0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(o.x, o.y, r+40, 0, Math.PI*2); ctx.fill();
      }
      if (auras.has('frost')){ ctx.strokeStyle = 'rgba(180,230,255,0.4)'; ctx.lineWidth = 2/c.zoom; ctx.beginPath(); ctx.arc(o.x, o.y, r+35+Math.sin(now/400)*3, 0, Math.PI*2); ctx.stroke(); }
      if (auras.has('vortex')){ ctx.strokeStyle = 'rgba(100,140,220,0.35)'; ctx.lineWidth = 1.5/c.zoom; for (let i = 0; i < 3; i++){ const ang = now/1000 + i*2; ctx.beginPath(); ctx.arc(o.x, o.y, r+20+i*8, ang, ang+1.5); ctx.stroke(); } }
      if (auras.has('halo')){ ctx.strokeStyle = 'rgba(255,255,100,0.35)'; ctx.lineWidth = 2/c.zoom; ctx.beginPath(); ctx.arc(o.x, o.y, r+25+Math.sin(now/600)*3, 0, Math.PI*2); ctx.stroke(); }
      if (auras.has('sparkle')){ ctx.fillStyle = 'rgba(200,240,255,0.7)'; for (let i = 0; i < 4; i++){ const a = now/800 + i*Math.PI/2; const px = o.x + Math.cos(a)*(r+5); const py = o.y + Math.sin(a)*(r+5); ctx.beginPath(); ctx.arc(px, py, 1.5, 0, Math.PI*2); ctx.fill(); } }
    }
    const LOD = c.zoom < 0.45;
    for (const o of this.world.organisms){
      if (o.dead) continue;
      if (o.x < x0-120 || o.x > x1+120 || o.y < y0-120 || o.y > y1+120) continue;
      if (LOD){
        let hp = 0, cnt = 0;
        for (const m of o.modules){ if (m.stage !== 'broken') hp += m.hp; cnt++; }
        const r = hp / Math.max(1, cnt * 100);
        ctx.fillStyle = r > 0.6 ? '#4f4' : r > 0.3 ? '#fa4' : '#f44';
        ctx.beginPath(); ctx.arc(o.x, o.y, o.boundingRadius * 0.7, 0, Math.PI * 2); ctx.fill();
        continue;
      }
      for (const m of o.modules){
        const col = m.stage === 'broken' ? '#301010' : m.stage === 'damaged' ? '#e04040' : m.def.color;
        ctx.fillStyle = col;
        ctx.strokeStyle = m.stage === 'broken' ? '#200' : 'rgba(0,0,0,0.5)';
        ctx.lineWidth = 1 / c.zoom;
        this.drawModuleShape(ctx, m);
        if (this.highlightedModule === m){
          ctx.save();
          ctx.strokeStyle = '#ffff40';
          ctx.lineWidth = 3 / c.zoom;
          ctx.shadowColor = '#ffff00';
          ctx.shadowBlur = 12 / c.zoom;
          this.drawModuleShapeOutline(ctx, m);
          ctx.restore();
        }
      }
      const core = o.modules[0];
      if (core){
        let ac = '#f0f';
        if (o.genome.anchorType === 'membrane') ac = '#4ff';
        else if (o.genome.anchorType === 'sensor') ac = '#ff4';
        ctx.fillStyle = ac;
        ctx.beginPath(); ctx.arc(core.worldX, core.worldY, 3, 0, Math.PI * 2); ctx.fill();
      }
      if (o.fat > 5){
        ctx.strokeStyle = '#e0a030';
        ctx.lineWidth = 1.5 / c.zoom;
        ctx.beginPath(); ctx.arc(o.x, o.y, o.boundingRadius + 2, 0, Math.PI * 2); ctx.stroke();
      }
      if (this.followed === o){
        ctx.strokeStyle = '#ff0';
        ctx.lineWidth = 1.5 / c.zoom;
        ctx.beginPath(); ctx.arc(o.x, o.y, o.boundingRadius + 4, 0, Math.PI * 2); ctx.stroke();
      }
    }
    for (const e of this.world.effects) e.draw(ctx);
    ctx.restore();
  }
}

// ============================================================
// UI
// ============================================================
const EFFECT_LABELS = {
  dmg:'Урон', pierce:'Пробивание', armor:'Броня', block:'Блок', reflect:'Отражение',
  sense:'Сенсор', speed:'Скорость', turn:'Поворот', energyProd:'Энергия',
  healRate:'Лечение', digest:'Переваривание', longevity:'Долголетие',
  corrosion:'Коррозия', slow:'Замедление', stun:'Оглушение', electric:'Электро',
  lifesteal:'Вампиризм', poison:'Яд', filter:'Фильтрация', leakBase:'Утечка',
  loadbearing:'Несущий', assembly:'Сборка'
};
function moduleEffectsHtml(def){
  let html = '';
  for (const [k,v] of Object.entries(def.effects)){
    if (typeof v === 'boolean'){
      if (v) html += '<div class="stat"><span>' + EFFECT_LABELS[k] + '</span><span>да</span></div>';
      continue;
    }
    const label = EFFECT_LABELS[k] || k;
    const val = typeof v === 'number' ? (Number.isInteger(v) ? v : v.toFixed(2)) : v;
    html += '<div class="stat"><span>' + label + '</span><span>+' + val + '</span></div>';
  }
  if (def.aura) html += '<div class="stat"><span>Аура</span><span>' + def.aura + '</span></div>';
  if (def.explodesOnDeath) html += '<div class="stat"><span>Взрыв при смерти</span><span>да</span></div>';
  return html;
}

class UI {
  constructor(sim, renderer){
    this.sim = sim;
    this.renderer = renderer;
    this.hudTimer = 0;
    this.catalogBuilt = false;
    this.leaderTimer = 0;
    this.bind();
    this.updateHud();
  }
  bind(){
    const btnPause = document.getElementById('btn-pause');
    btnPause.onclick = () => {
      this.sim.paused = !this.sim.paused;
      btnPause.textContent = this.sim.paused ? '▶' : '⏸';
      btnPause.classList.toggle('active', this.sim.paused);
    };
    const setSpeed = s => {
      this.sim.timeScale = s;
      ['speed1','speed2','speed4'].forEach((id,i) => {
        document.getElementById('btn-' + id).classList.toggle('active', [1,2,4][i] === s);
      });
    };
    document.getElementById('btn-speed1').onclick = () => setSpeed(1);
    document.getElementById('btn-speed2').onclick = () => setSpeed(2);
    document.getElementById('btn-speed4').onclick = () => setSpeed(4);
    document.getElementById('btn-restart').onclick = () => location.reload();
    document.getElementById('btn-catalog').onclick = () => this.toggleCatalog();
    document.getElementById('btn-leaders').onclick = () => this.toggleLeaderboard();
    document.getElementById('follow-close').onclick = () => {
      this.renderer.followed = null;
      this.renderer.highlightedModule = null;
      document.getElementById('follow-panel').style.display = 'none';
    };
    document.querySelectorAll('.close-btn').forEach(btn => {
      btn.onclick = () => {
        const t = btn.dataset.close;
        document.getElementById(t + '-panel').classList.remove('open');
      };
    });
    this.buildCatalog();
  }
  toggleCatalog(){
    const p = document.getElementById('catalog-panel');
    p.classList.toggle('open');
    document.getElementById('leaderboard-panel').classList.remove('open');
  }
  toggleLeaderboard(){
    const p = document.getElementById('leaderboard-panel');
    p.classList.toggle('open');
    document.getElementById('catalog-panel').classList.remove('open');
    if (p.classList.contains('open')) this.renderLeaderboard();
  }
  buildCatalog(){
    const c = document.getElementById('catalog-content');
    const roleOrder = { core:0, weapon:1, defense:2, structure:3, move:4, sense:5, digest:6, meta:7 };
    const sorted = ALL_MODULES.slice().sort((a,b) => {
      const ra = roleOrder[RC[a].role] ?? 9;
      const rb = roleOrder[RC[b].role] ?? 9;
      if (ra !== rb) return ra - rb;
      return RC[a].nameRu.localeCompare(RC[b].nameRu);
    });
    let html = '<table class="catalog-table"><thead><tr><th>Название</th><th>R-имя</th><th>Тип</th><th>HP</th><th>Описание</th><th>Характеристики</th></tr></thead><tbody>';
    for (const key of sorted){
      const def = RC[key];
      const effectsStr = Object.entries(def.effects).map(([k,v]) => {
        const label = EFFECT_LABELS[k] || k;
        if (typeof v === 'boolean') return v ? label : null;
        const val = typeof v === 'number' ? (Number.isInteger(v) ? v : v.toFixed(2)) : v;
        return label + ':' + val;
      }).filter(Boolean).join(' · ');
      html += '<tr><td class="name-cell"><span class="color-dot" style="background:' + def.color + '"></span>' + def.nameRu + '</td>' +
              '<td class="r-name">' + key + '</td>' +
              '<td class="role-cell">' + (ROLE_NAMES[def.role] || def.role) + '</td>' +
              '<td class="stats-cell">' + def.hp + '</td>' +
              '<td class="desc-cell">' + def.descRu + '</td>' +
              '<td class="stats-cell">' + effectsStr + '</td></tr>';
    }
    html += '</tbody></table>';
    c.innerHTML = html;
    this.catalogBuilt = true;
  }
  renderLeaderboard(){
    const c = document.getElementById('leaderboard-content');
    const leaders = this.sim.getLeaders(20);
    const dietNames = { carnivore:'Хищник', herbivore:'Травоядное', omnivore:'Всеядное', filter:'Фильтратор' };
    const dietCls = { carnivore:'diet-carn', herbivore:'diet-herb', omnivore:'diet-omni', filter:'diet-filt' };
    let html = '<table class="leaderboard-table"><thead><tr><th>#</th><th>ID</th><th>Семейство</th><th>Вид</th><th>Пок.</th><th>Тип</th><th>Мод.</th><th>HP%</th><th>Энергия</th><th>Жир</th><th>Дети</th></tr></thead><tbody>';
    leaders.forEach((entry, i) => {
      const o = entry.o;
      const ePct = Math.round(o.energy / o.maxEnergy * 100);
      html += '<tr data-id="' + o.id + '">' +
        '<td class="rank">' + (i+1) + '</td>' +
        '<td class="id-cell">#' + o.id + '</td>' +
        '<td class="fam">' + o.familyName + '</td>' +
        '<td>' + o.species + '</td>' +
        '<td>' + o.generation + '</td>' +
        '<td class="' + (dietCls[o.diet] || '') + '">' + (dietNames[o.diet] || o.diet) + '</td>' +
        '<td>' + entry.modCnt + '</td>' +
        '<td class="hp-val" style="color:#4f4">' + Math.round(entry.hpPct * 100) + '%</td>' +
        '<td>' + ePct + '%</td>' +
        '<td>' + Math.round(o.fat) + '</td>' +
        '<td>' + o.children.size + '</td></tr>';
    });
    html += '</tbody></table>';
    if (leaders.length === 0) html = '<div style="padding:40px;text-align:center;color:#7ab">Нет живых организмов</div>';
    c.innerHTML = html;
    c.querySelectorAll('tr[data-id]').forEach(tr => {
      tr.onclick = () => {
        const id = parseInt(tr.dataset.id);
        const org = this.sim.world.organisms.find(o => o.id === id);
        if (org){
          this.renderer.followed = org;
          document.getElementById('follow-panel').style.display = 'block';
          document.getElementById('leaderboard-panel').classList.remove('open');
        }
      };
    });
  }
  updateHud(){
    const s = this.sim.getStats();
    document.getElementById('s-pop').textContent = s.pop;
    document.getElementById('s-popmax').textContent = '/' + s.maxPop;
    document.getElementById('s-gen').textContent = s.gen;
    document.getElementById('s-time').textContent = Math.floor(s.time) + 'с';
    document.getElementById('s-hp').textContent = s.avgHp + '%';
    document.getElementById('s-mut').textContent = s.mutations;
    document.getElementById('s-carn').textContent = s.carn;
    document.getElementById('s-herb').textContent = s.herb;
    document.getElementById('s-omni').textContent = s.omni + (s.filt ? ' (ф:' + s.filt + ')' : '');
    document.getElementById('s-food').textContent = s.food;
    if (s.champ) document.getElementById('s-champ').textContent = '#' + s.champ.id + ' (' + s.champ.species + ')';
    else document.getElementById('s-champ').textContent = '—';
    const sn = { spring:'Весна', summer:'Лето', autumn:'Осень', winter:'Зима' };
    document.getElementById('s-season').textContent = sn[s.season] || s.season;
  }
  showModuleTooltip(module, mouseX, mouseY){
    const tt = document.getElementById('mod-tooltip');
    const def = module.def;
    tt.innerHTML = '<h4>' + def.nameRu + ' <span style="color:#5a7fa0;font-size:10px;font-weight:normal">' + module.type + '</span></h4>' +
      '<div class="desc">' + def.descRu + '</div>' +
      '<div class="stat"><span>Тип</span><span>' + (ROLE_NAMES[def.role] || def.role) + '</span></div>' +
      '<div class="stat"><span>Прочность</span><span>' + Math.round(module.hp) + ' / ' + module.maxHp + '</span></div>' +
      '<div class="stat"><span>Состояние</span><span style="color:' +
        (module.stage === 'ok' ? '#4f4' : module.stage === 'damaged' ? '#fa4' : '#f44') + '">' +
        (module.stage === 'ok' ? 'целый' : module.stage === 'damaged' ? 'повреждён' : 'сломан') + '</span></div>' +
      '<div style="margin-top:6px;padding-top:6px;border-top:1px solid #2a4a7a"></div>' +
      moduleEffectsHtml(def);
    tt.style.display = 'block';
    const rect = tt.getBoundingClientRect();
    let x = mouseX + 15, y = mouseY + 15;
    if (x + rect.width > window.innerWidth) x = mouseX - rect.width - 15;
    if (y + rect.height > window.innerHeight) y = mouseY - rect.height - 15;
    tt.style.left = x + 'px';
    tt.style.top = y + 'px';
  }
  hideModuleTooltip(){ document.getElementById('mod-tooltip').style.display = 'none'; }
  updateFollowPanel(){
    const o = this.renderer.followed;
    const panel = document.getElementById('follow-panel');
    if (!o || o.dead){
      if (o && o.dead){
        document.getElementById('f-title').textContent = '#' + o.id + ' — погиб (' + o.deathReason + ')';
        this.renderer.highlightedModule = null;
      }
      return;
    }
    panel.style.display = 'block';
    const dietNames = { carnivore:'хищник', herbivore:'травоядный', omnivore:'всеядный', filter:'фильтратор' };
    document.getElementById('f-title').textContent = '#' + o.id + ' [' + o.familyName + ' · ' + o.species + '] ' + (dietNames[o.diet] || o.diet) + ' — пок.' + o.generation;
    const agePct = Math.round(o.age / o.maxAge * 100);
    const fatCap = 30 + o.modules.length * 2;
    document.getElementById('f-info').innerHTML =
      'Энергия: ' + Math.round(o.energy) + '/' + o.maxEnergy + '<br>' +
      'Жир: ' + Math.round(o.fat) + '/' + fatCap + '<br>' +
      'Возраст: ' + Math.round(o.age) + ' / ' + Math.round(o.maxAge) + 'с (' + agePct + '%)<br>' +
      'Модулей: ' + o.modules.length + ' / ' + o.genome.bodyLimit + '<br>' +
      'Anchor: ' + o.genome.anchorType + '<br>' +
      'Дети: ' + o.children.size;
    const modsDiv = document.getElementById('f-mods');
    let html = '';
    for (let i = 0; i < o.modules.length; i++){
      const m = o.modules[i];
      const pct = Math.round(m.hp / m.maxHp * 100);
      const col = m.stage === 'broken' ? '#f44' : m.stage === 'damaged' ? '#fa4' : '#4f4';
      html += '<div class="mod" data-midx="' + i + '"><span>' + m.def.nameRu + '</span><div class="hpbar"><div style="width:' + pct + '%;background:' + col + '"></div></div></div>';
    }
    modsDiv.innerHTML = html;
    modsDiv.querySelectorAll('.mod').forEach(el => {
      el.onmouseenter = e => {
        const idx = parseInt(el.dataset.midx);
        const m = o.modules[idx];
        if (m){ this.renderer.highlightedModule = m; this.showModuleTooltip(m, e.clientX, e.clientY); }
      };
      el.onmousemove = e => {
        const idx = parseInt(el.dataset.midx);
        const m = o.modules[idx];
        if (m) this.showModuleTooltip(m, e.clientX, e.clientY);
      };
      el.onmouseleave = () => {
        this.renderer.highlightedModule = null;
        this.hideModuleTooltip();
      };
      el.ontouchstart = e => {
        e.preventDefault();
        const idx = parseInt(el.dataset.midx);
        const m = o.modules[idx];
        if (m){
          this.renderer.highlightedModule = m;
          const t = e.touches[0];
          this.showModuleTooltip(m, t.clientX, t.clientY);
        }
      };
      el.ontouchend = () => {
        setTimeout(() => {
          this.renderer.highlightedModule = null;
          this.hideModuleTooltip();
        }, 1200);
      };
    });
  }
  tick(dt){
    this.hudTimer += dt;
    if (this.hudTimer > 0.4){
      this.hudTimer = 0;
      this.updateHud();
      this.updateFollowPanel();
    }
    if (document.getElementById('leaderboard-panel').classList.contains('open')){
      this.leaderTimer += dt;
      if (this.leaderTimer > 1){
        this.leaderTimer = 0;
        this.renderLeaderboard();
      }
    }
  }
}

// ============================================================
// ЗАПУСК
// ============================================================
let sim = null, renderer = null, ui = null, lastT = 0;

const SLIDER_BINDINGS = [
  ['in-org',        'in-org-val',        v => v],
  ['in-popmax',     'in-popmax-val',     v => v],
  ['in-plant-amt',  'in-plant-amt-val',  v => v.toFixed(1) + '×'],
  ['in-plant-val',  'in-plant-val-val',  v => v.toFixed(1) + '×'],
  ['in-meat-amt',   'in-meat-amt-val',   v => v.toFixed(1) + '×'],
  ['in-meat-val',   'in-meat-val-val',   v => v.toFixed(1) + '×'],
  ['in-mut',        'in-mut-val',        v => v.toFixed(2)],
  ['in-diff',       'in-diff-val',       v => v.toFixed(1) + '×'],
  ['in-metab',      'in-metab-val',      v => v.toFixed(1) + '×']
];
SLIDER_BINDINGS.forEach(([id, outId, fmt]) => {
  const el = document.getElementById(id);
  const out = document.getElementById(outId);
  if (!el || !out) return;
  const upd = () => { out.textContent = fmt(parseFloat(el.value)); };
  el.addEventListener('input', upd);
  upd();
});

function startSimulation(){
  const orgCount = parseInt(document.getElementById('in-org').value);
  const mapSel = document.getElementById('in-map').value;
  const maps = {
    small:  { width: 1200, height: 900 },
    medium: { width: 2000, height: 1500 },
    large:  { width: 3000, height: 2200 }
  };
  const size = maps[mapSel];
  const climate = document.getElementById('in-climate').value;
  const resources = document.getElementById('in-res').value;
  const plantAmountMul = parseFloat(document.getElementById('in-plant-amt').value);
  const meatAmountMul  = parseFloat(document.getElementById('in-meat-amt').value);
  const plantValueMul  = parseFloat(document.getElementById('in-plant-val').value);
  const meatValueMul   = parseFloat(document.getElementById('in-meat-val').value);
  const mutationRate   = parseFloat(document.getElementById('in-mut').value);
  const difficulty     = parseFloat(document.getElementById('in-diff').value);
  const metabolismMul  = parseFloat(document.getElementById('in-metab').value);
  const maxPopulation  = parseInt(document.getElementById('in-popmax').value);

  const world = new World({
    width: size.width, height: size.height,
    climate, resources, mutationRate, difficulty, metabolismMul, maxPopulation,
    plantAmountMul, meatAmountMul, plantValueMul, meatValueMul,
    count: orgCount
  });
  sim = new Simulation(world);
  const canvas = document.getElementById('world');
  renderer = new Renderer(canvas, world);
  ui = new UI(sim, renderer);
  document.getElementById('menu').style.display = 'none';
  lastT = performance.now();
  requestAnimationFrame(loop);
}

function loop(now){
  const dt = Math.min(0.05, (now - lastT) / 1000);
  lastT = now;
  try {
    sim.update(dt);
    renderer.render(dt);
    ui.tick(dt);
  } catch (err){
    console.error('sim error', err);
  }
  requestAnimationFrame(loop);
}

document.getElementById('btn-start').onclick = startSimulation;