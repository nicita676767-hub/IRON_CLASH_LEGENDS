const canvas = document.querySelector("#gameCanvas");
let ctx = canvas.getContext("2d");
const mainCtx = ctx;
const handEl = document.querySelector("#hand");
const energyText = document.querySelector("#energyText");
const energyFill = document.querySelector("#energyFill");
const enemyBaseText = document.querySelector("#enemyBaseText");
const playerBaseText = document.querySelector("#playerBaseText");
const enemyBaseFill = document.querySelector("#enemyBaseFill");
const playerBaseFill = document.querySelector("#playerBaseFill");
const timerText = document.querySelector("#timerText");
const enemyBaseLabel = document.querySelector(".base-card.enemy span");
const surrenderBtn = document.querySelector("#surrenderBtn");
const modePanel = document.querySelector("#modePanel");
const startCopy = document.querySelector("#startCopy");
const deckGrid = document.querySelector("#deckGrid");
const deckCount = document.querySelector("#deckCount");
const coinText = document.querySelector("#coinText");
const progressLevel = document.querySelector("#progressLevel");
const progressStats = document.querySelector("#progressStats");
const dailyBonusBtn = document.querySelector("#dailyBonusBtn");
const difficultyButtons = [...document.querySelectorAll("#difficultyOptions button")];
const trainingBtn = document.querySelector("#trainingBtn");
const quickBtn = document.querySelector("#quickBtn");
const endlessBtn = document.querySelector("#endlessBtn");
const campaignBtn = document.querySelector("#campaignBtn");
const campaignPanel = document.querySelector("#campaignPanel");
const campaignMap = document.querySelector("#campaignMap");
const campaignBackBtn = document.querySelector("#campaignBackBtn");
const soundToggle = document.querySelector("#soundToggle");
const toastEl = document.querySelector("#toast");
const resultPanel = document.querySelector("#resultPanel");
const resultTitle = document.querySelector("#resultTitle");
const resultCopy = document.querySelector("#resultCopy");
const restartBtn = document.querySelector("#restartBtn");
const lobbyBtn = document.querySelector("#lobbyBtn");
const laneButtons = [...document.querySelectorAll(".lane-tabs button")];

const W = canvas.width;
const H = canvas.height;
const LOW_POWER_VIEW = window.matchMedia?.("(max-width: 700px)")?.matches || false;
function syncMobileViewClass() {
  const mobileLike = window.innerHeight > window.innerWidth && Math.min(window.innerWidth, window.screen?.width || window.innerWidth) <= 900;
  document.documentElement.classList.toggle("mobile-view", mobileLike);
  if (window.__ironClashStateReady) invalidateArenaCache();
}
syncMobileViewClass();
window.addEventListener("resize", syncMobileViewClass);
function isLowPowerMode() {
  return LOW_POWER_VIEW || document.documentElement.classList.contains("mobile-view") || Boolean(window.matchMedia?.("(pointer: coarse) and (orientation: portrait)")?.matches);
}
function renderScale() {
  return isLowPowerMode() ? 0.62 : 1;
}

function applyRenderScale() {
  const scale = renderScale();
  const targetWidth = Math.max(1, Math.round(W * scale));
  const targetHeight = Math.max(1, Math.round(H * scale));
  if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    invalidateArenaCache();
  }
  ctx = mainCtx;
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
}

const unitSpriteCache = new Map();
const SAVE_KEY = "iron-clash-legends-save-v1";
const RESET_PROGRESS_KEY = "iron-clash-legends-progress-reset-2026-05-27";
const STARTER_CARDS = ["tank", "ranger", "swordsman", "mage", "catgirl", "fireball", "freeze", "heal", "haste"];
const lanes = [
  { name: "Лево", x: 520 },
  { name: "Центр", x: 700 },
  { name: "Право", x: 880 },
];
const BASE_TOP_Y = 96;
const BASE_BOTTOM_Y = 724;
const ROAD_TOP_Y = BASE_TOP_Y + 58;
const ROAD_BOTTOM_Y = BASE_BOTTOM_Y - 58;

const palette = {
  player: "#44a8ff",
  enemy: "#ff5c5c",
  gold: "#ffd36b",
  green: "#6ee7a3",
  violet: "#a88cff",
  ice: "#91e8ff",
  dark: "#4b301d",
  soil: "#9a6a3d",
  grass: "#71b85b",
  grassDark: "#3e7a45",
  stone: "#aeb7b5",
  wood: "#8a5b35",
  ink: "#f8fbff",
};

function laneX(lane) {
  return lanes[lane].x;
}

function basePoint(team) {
  return team === "player" ? { x: W / 2, y: BASE_BOTTOM_Y } : { x: W / 2, y: BASE_TOP_Y };
}

function baseFrontPoint(team, lane = 1) {
  const base = basePoint(team);
  const sideOffset = (lane - 1) * 78;
  return { x: base.x + sideOffset, y: team === "enemy" ? ROAD_TOP_Y : ROAD_BOTTOM_Y };
}

function baseHitPoint(team, lane = 1) {
  const base = basePoint(team);
  const sideOffset = (lane - 1) * 58;
  return { x: base.x + sideOffset, y: team === "enemy" ? base.y + 70 : base.y - 70 };
}

function laneRoadPoints(lane, team = "enemy") {
  const top = baseFrontPoint("enemy", lane);
  const bottom = baseFrontPoint("player", lane);
  const verticalX = laneX(lane);
  const points =
        lane === 1
      ? [top, bottom]
      : [
          top,
          { x: verticalX, y: ROAD_TOP_Y + 104 },
          { x: verticalX, y: ROAD_BOTTOM_Y - 104 },
          bottom,
        ];
  return team === "enemy" ? points : [...points].reverse();
}

function forwardCoord(unit) {
  return unit.y;
}

function distanceOnLane(a, b) {
  return Math.abs(a.y - b.y);
}

const deck = [
  {
    id: "tank",
    kind: "unit",
    name: "Рыцарь",
    short: "Щ",
    cost: 4,
    tone: "#44a8ff",
    desc: "Держит линию щитом",
    stats: { hp: 500, damage: 18, range: 44, speed: 34, cooldown: 1.18, size: 28, role: "tank" },
  },
  {
    id: "ranger",
    kind: "unit",
    name: "Лучник",
    short: "Л",
    cost: 3,
    tone: "#6ee7a3",
    desc: "Бьет издалека",
    stats: { hp: 150, damage: 24, range: 170, speed: 46, cooldown: 0.86, size: 21, role: "ranger" },
  },
  {
    id: "swordsman",
    kind: "unit",
    name: "Мечник",
    short: "М",
    cost: 3,
    tone: "#ffd36b",
    desc: "Баланс атаки",
    stats: { hp: 275, damage: 32, range: 48, speed: 58, cooldown: 0.9, size: 23, role: "swordsman" },
  },
  {
    id: "assassin",
    kind: "unit",
    name: "Разбойник",
    short: "К",
    cost: 3,
    tone: "#a88cff",
    desc: "Добивает открытый тыл",
    stats: { hp: 155, damage: 48, range: 40, speed: 120, cooldown: 0.72, size: 20, role: "assassin", leap: true },
  },
  {
    id: "mage",
    kind: "unit",
    name: "Чародей",
    short: "*",
    cost: 5,
    tone: "#ff8a55",
    desc: "Урон по области",
    stats: { hp: 180, damage: 40, range: 165, speed: 38, cooldown: 1.22, size: 22, role: "mage", splash: 105, slowOnHit: 2.2 },
  },
  {
    id: "necromancer",
    kind: "unit",
    name: "Некромант",
    short: "N",
    cost: 5,
    tone: "#5f4b8b",
    desc: "Призывает скелетов",
    stats: { hp: 165, damage: 17, range: 120, speed: 32, cooldown: 1.38, size: 22, role: "necromancer", summon: true },
  },
  {
    id: "priest",
    kind: "unit",
    name: "Священник",
    short: "P",
    cost: 4,
    tone: "#fff0bd",
    desc: "Лечит союзника лучом",
    stats: { hp: 165, damage: 10, range: 155, speed: 42, cooldown: 1.05, size: 21, role: "priest", healPower: 36 },
  },
  {
    id: "catgirl",
    kind: "unit",
    name: "Кошка-девочка",
    short: "K",
    cost: 4,
    tone: "#ff9bd5",
    desc: "Очарование и аура",
    stats: { hp: 190, damage: 14, range: 135, speed: 48, cooldown: 1.05, size: 22, role: "catgirl", aura: true },
  },
  {
    id: "catapult",
    kind: "unit",
    name: "Катапульта",
    short: "C",
    cost: 6,
    tone: "#b5793e",
    desc: "Стреляет по замку",
    stats: { hp: 460, damage: 95, range: 360, speed: 24, cooldown: 2.6, size: 26, role: "catapult", siege: true },
  },
  {
    id: "dragon",
    kind: "unit",
    name: "Дракон",
    short: "D",
    cost: 7,
    tone: "#ff5f43",
    desc: "Летает над ближним боем",
    stats: { hp: 450, damage: 67, range: 185, speed: 44, cooldown: 1.34, size: 30, role: "dragon", splash: 85, flying: true },
  },
  { id: "fireball", kind: "spell", name: "Огненный шар", short: "O", cost: 3, tone: "#ff774d", desc: "Взрыв по линии" },
  { id: "freeze", kind: "spell", name: "Ледяная печать", short: "Л", cost: 2, tone: "#91e8ff", desc: "Остановить рывок" },
  { id: "heal", kind: "spell", name: "Свет жизни", short: "+", cost: 3, tone: "#6ee7a3", desc: "Спасти отряд" },
  { id: "lightning", kind: "spell", name: "Гром", short: "!", cost: 3, tone: "#f8f1dd", desc: "Добить сильного" },
  { id: "repair", kind: "spell", name: "Починка", short: "R", cost: 2, tone: "#79d7ff", desc: "Чинит базу" },
  { id: "haste", kind: "spell", name: "Боевой клич", short: ">", cost: 2, tone: "#ffd36b", desc: "Ускорить атаку" },
];

const campaignLevels = [
  {
    id: "border",
    title: "Пограничная стычка",
    subtitle: "Разбей первую заставу",
    difficulty: "normal",
    enemyDeck: ["swordsman", "ranger", "tank", "fireball", "heal"],
    enemyBase: 900,
    playerBase: 1000,
    time: 170,
    reward: "Открыт путь к осадному лагерю",
  },
  {
    id: "siege",
    title: "Осадный лагерь",
    subtitle: "Выживи против катапульты",
    difficulty: "hard",
    enemyDeck: ["tank", "ranger", "catapult", "freeze", "lightning"],
    enemyBase: 1000,
    playerBase: 1100,
    time: 180,
    reward: "Разбит осадный обоз",
  },
  {
    id: "frost",
    title: "Ледяная засада",
    subtitle: "Враг часто замораживает линии",
    difficulty: "hard",
    enemyDeck: ["tank", "mage", "assassin", "freeze", "fireball"],
    enemyBase: 1050,
    playerBase: 1000,
    time: 160,
    reward: "Снята ледяная блокада",
  },
  {
    id: "rush",
    title: "Бой на время",
    subtitle: "Уничтожь базу за 2 минуты",
    difficulty: "hard",
    enemyDeck: ["swordsman", "ranger", "priest", "haste", "heal"],
    enemyBase: 850,
    playerBase: 950,
    time: 120,
    reward: "Открыт финальный замок",
  },
  {
    id: "king",
    title: "Железный король",
    subtitle: "Финальный бой против элитного штурма",
    difficulty: "impossible",
    enemyDeck: ["swordsman", "ranger", "assassin", "catapult", "lightning"],
    openingEnemies: [
      { card: "swordsman", lane: 0 },
      { card: "ranger", lane: 1 },
      { card: "assassin", lane: 2 },
    ],
    enemyBase: 1300,
    playerBase: 950,
    time: 170,
    reward: "Кампания пройдена",
  },
];

const state = {
  started: false,
  gameOver: false,
  selectedLane: 1,
  selectedCard: "swordsman",
  aimX: W / 2,
  aimY: H / 2,
  difficulty: "easy",
  matchMode: "quick",
  botStyle: "balanced",
  activeCampaignId: null,
  campaignProgress: 1,
  coins: 0,
  trophies: 0,
  level: 1,
  xp: 0,
  wins: 0,
  losses: 0,
  unlockedCards: [...STARTER_CARDS],
  lastDaily: "",
  battleDeck: ["tank", "ranger", "swordsman", "mage", "fireball"],
  enemyDeck: [],
  playerSpellCooldowns: {},
  enemySpellCooldowns: {},
  energy: 4,
  enemyEnergy: 4,
  playerBase: 1000,
  enemyBase: 1000,
  playerBaseMax: 1000,
  enemyBaseMax: 1000,
  timeLeft: 180,
  lastTime: 0,
  units: [],
  projectiles: [],
  towerShots: [],
  effects: [],
  arenaCache: null,
  arenaCacheKey: "",
  shake: 0,
  hitStop: 0,
  nextUnitId: 1,
  botDelay: 1.2,
  playerTowerCooldown: 0,
  enemyTowerCooldown: 0,
  toastTimer: 0,
  endlessElapsed: 0,
  endlessTier: 0,
  endlessNextScale: 20,
  soundOn: true,
  audio: null,
};
window.__ironClashStateReady = true;

function loadSave() {
  try {
    if (!localStorage.getItem(RESET_PROGRESS_KEY)) {
      localStorage.removeItem(SAVE_KEY);
      localStorage.setItem(RESET_PROGRESS_KEY, "done");
    }
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return;
    const save = JSON.parse(raw);
    const validCardIds = new Set(deck.map((card) => card.id));
    if (Array.isArray(save.battleDeck)) {
      const savedDeck = save.battleDeck.filter((id) => validCardIds.has(id)).slice(0, 5);
      if (savedDeck.length === 5) {
        state.battleDeck = savedDeck;
        state.selectedCard = savedDeck[0];
      }
    }
    if (["easy", "normal", "hard", "impossible"].includes(save.difficulty)) {
      state.difficulty = save.difficulty;
    }
    if (typeof save.soundOn === "boolean") {
      state.soundOn = save.soundOn;
      soundToggle.textContent = state.soundOn ? "Звук: вкл" : "Звук: выкл";
    }
    if (Number.isInteger(save.campaignProgress)) {
      state.campaignProgress = Math.max(1, Math.min(campaignLevels.length + 1, save.campaignProgress));
    }
    if (Number.isFinite(save.coins)) {
      state.coins = Math.max(0, Math.floor(save.coins));
    }
    if (Number.isFinite(save.trophies)) {
      state.trophies = Math.max(0, Math.floor(save.trophies));
    }
    if (Number.isFinite(save.level)) state.level = Math.max(1, Math.floor(save.level));
    if (Number.isFinite(save.xp)) state.xp = Math.max(0, Math.floor(save.xp));
    if (Number.isFinite(save.wins)) state.wins = Math.max(0, Math.floor(save.wins));
    if (Number.isFinite(save.losses)) state.losses = Math.max(0, Math.floor(save.losses));
    if (typeof save.lastDaily === "string") state.lastDaily = save.lastDaily;
    if (Array.isArray(save.unlockedCards)) {
      const unlocked = save.unlockedCards.filter((id) => validCardIds.has(id));
      state.unlockedCards = [...new Set([...STARTER_CARDS, ...unlocked])];
    }
  } catch (error) {
    console.warn("Save load failed", error);
  }
}

function saveSettings() {
  try {
    localStorage.setItem(
      SAVE_KEY,
      JSON.stringify({
        battleDeck: state.battleDeck,
        difficulty: state.difficulty,
        soundOn: state.soundOn,
        campaignProgress: state.campaignProgress,
        coins: state.coins,
        trophies: state.trophies,
        level: state.level,
        xp: state.xp,
        wins: state.wins,
        losses: state.losses,
        unlockedCards: state.unlockedCards,
        lastDaily: state.lastDaily,
      }),
    );
  } catch (error) {
    console.warn("Save failed", error);
  }
}

function xpForNextLevel() {
  return 80 + (state.level - 1) * 35;
}

function addProgressXp(amount) {
  state.xp += amount;
  while (state.xp >= xpForNextLevel()) {
    state.xp -= xpForNextLevel();
    state.level += 1;
    unlockCardsForLevel();
    showToast(`Новый уровень: ${state.level}`);
  }
}

function unlockCardsForLevel() {
  const unlocks = [
    { level: 2, cards: ["assassin", "priest", "lightning"] },
    { level: 3, cards: ["necromancer", "repair"] },
    { level: 4, cards: ["catapult"] },
    { level: 5, cards: ["dragon"] },
  ];
  unlocks.forEach((entry) => {
    if (state.level >= entry.level) entry.cards.forEach((id) => {
      if (!state.unlockedCards.includes(id)) state.unlockedCards.push(id);
    });
  });
}

function isCardUnlocked(cardId) {
  return state.unlockedCards.includes(cardId);
}

function getBattleCards() {
  return state.battleDeck.map((id) => deck.find((card) => card.id === id)).filter(Boolean);
}

function makeEnemyDeck() {
  const campaign = activeCampaignLevel();
  if (campaign?.enemyDeck) return [...campaign.enemyDeck];
  if (state.matchMode === "endless") return deck.map((card) => card.id);
  if (state.matchMode === "ranked") return makeRankedEnemyDeck();
  const config = difficultyConfig();
  const byId = (id) => deck.find((card) => card.id === id);
  if (config.smart) {
    const frontline = shuffle(["tank", "swordsman"]).map(byId).find(Boolean);
    const support = shuffle(["ranger", "mage", "priest", "catgirl", "necromancer"]).map(byId).find(Boolean);
    const pressure = shuffle(["catapult", "dragon", "assassin", "ranger"]).map(byId).find((card) => card && card.id !== support?.id);
    const spellPool = state.difficulty === "impossible" ? ["fireball", "freeze", "lightning", "haste"] : ["fireball", "freeze", "heal", "haste", "lightning"];
    const spells = shuffle(spellPool).map(byId).filter(Boolean).slice(0, 2);
    return shuffle([frontline, support, pressure, ...spells].filter(Boolean)).slice(0, 5).map((card) => card.id);
  }
  const coreFighters = shuffle(deck.filter((card) => ["swordsman", "ranger", "assassin"].includes(card.id)));
  const requiredFighter = coreFighters[0] || deck.find((card) => card.id === "swordsman");
  const units = shuffle(deck.filter((card) => card.kind === "unit" && card.id !== requiredFighter.id));
  const spells = shuffle(deck.filter((card) => card.kind === "spell"));
  const picked = [requiredFighter, ...units.slice(0, 2), ...spells.slice(0, 2)];
  return shuffle(picked).map((card) => card.id);
}

function makeRankedEnemyDeck() {
  const tier = Math.floor(state.trophies / 20);
  const byId = (id) => deck.find((card) => card.id === id);
  const frontlinePool = tier >= 4 ? ["tank", "swordsman", "tank"] : ["swordsman", "tank"];
  const damagePool = tier >= 6 ? ["ranger", "mage", "assassin", "dragon", "mage"] : tier >= 3 ? ["ranger", "mage", "assassin", "dragon"] : ["ranger", "swordsman", "mage", "assassin"];
  const supportPool = tier >= 5 ? ["priest", "catgirl", "necromancer", "catapult", "ranger", "catapult"] : tier >= 2 ? ["priest", "catgirl", "necromancer", "ranger", "catapult"] : ["priest", "ranger", "catgirl", "necromancer"];
  const spellPool = tier >= 5 ? ["fireball", "freeze", "lightning", "heal", "repair", "haste", "freeze"] : tier >= 2 ? ["fireball", "freeze", "lightning", "heal", "repair", "haste"] : ["fireball", "freeze", "heal", "haste", "repair"];
  const frontline = shuffle(frontlinePool).map(byId).find(Boolean);
  const damage = shuffle(damagePool).map(byId).find((card) => card && card.id !== frontline?.id);
  const support = shuffle(supportPool).map(byId).find((card) => card && ![frontline?.id, damage?.id].includes(card.id));
  const spells = shuffle(spellPool).map(byId).filter(Boolean).slice(0, 2);
  return shuffle([frontline, damage, support, ...spells].filter(Boolean)).slice(0, 5).map((card) => card.id);
}

function getEnemyCards() {
  return state.enemyDeck.map((id) => deck.find((card) => card.id === id)).filter(Boolean);
}

function isEndlessMode() {
  return state.matchMode === "endless";
}

function hasBase(team) {
  return !(isEndlessMode() && team === "enemy");
}

function activeCampaignLevel() {
  return campaignLevels.find((level) => level.id === state.activeCampaignId) || null;
}

function spellCooldownDuration(spell) {
  const cooldowns = {
    fireball: 6.24,
    freeze: 6,
    heal: 5.4,
    lightning: 9.1,
    repair: 20,
    haste: 4.4,
  };
  return cooldowns[spell] || 5;
}

function spellCooldownsFor(team) {
  return team === "player" ? state.playerSpellCooldowns : state.enemySpellCooldowns;
}

function spellReady(team, spell) {
  return (spellCooldownsFor(team)[spell] || 0) <= 0;
}

function startSpellCooldown(team, spell) {
  spellCooldownsFor(team)[spell] = spellCooldownDuration(spell);
}

function shuffle(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function difficultyConfig() {
  if (state.matchMode === "endless") return endlessDifficultyConfig();
  if (state.matchMode === "ranked") return rankedDifficultyConfig();
  const configs = {
    easy: { label: "Легко", energyRate: 0.58, startEnergy: 4, minThink: 1.08, maxThink: 1.35, spellChance: 0.24, comboChance: 0.08, smart: true },
    normal: { label: "Нормально", energyRate: 0.78, startEnergy: 4.5, minThink: 0.65, maxThink: 0.88, spellChance: 0.5, comboChance: 0.3, smart: true },
    hard: { label: "Сложно", energyRate: 1.08, startEnergy: 6, minThink: 0.3, maxThink: 0.48, spellChance: 0.82, comboChance: 0.68, smart: true, strict: true },
    impossible: { label: "Невозможно", energyRate: 1.35, startEnergy: 7.2, minThink: 0.16, maxThink: 0.28, spellChance: 0.96, comboChance: 0.92, smart: true, strict: true },
  };
  return configs[state.difficulty] || configs.easy;
}

function endlessDifficultyConfig() {
  const tier = Math.max(0, state.endlessTier || 0);
  const energyBoost = Math.pow(1.1, tier);
  return {
    label: `Осада ${tier + 1}`,
    tier,
    energyRate: 0.78 * energyBoost,
    startEnergy: Math.min(10, 4.5 + tier * 0.16),
    minThink: Math.max(0.12, 0.78 - tier * 0.035),
    maxThink: Math.max(0.22, 1.02 - tier * 0.04),
    spellChance: Math.min(0.98, 0.46 + tier * 0.035),
    comboChance: Math.min(0.96, 0.24 + tier * 0.04),
    counterChance: Math.min(0.94, 0.3 + tier * 0.045),
    protectChance: Math.min(0.94, 0.28 + tier * 0.045),
    smart: true,
    strict: tier >= 1,
    elite: tier >= 3,
    endless: true,
  };
}

function endlessSurvivedWaves() {
  return Math.max(0, Math.floor((state.endlessElapsed || 0) / 20));
}

function endlessCoinReward() {
  let total = 0;
  let waveReward = 10;
  for (let wave = 0; wave < endlessSurvivedWaves(); wave += 1) {
    total += Math.round(waveReward);
    waveReward *= 1.2;
  }
  return total;
}

function rankedDifficultyConfig() {
  const tier = Math.floor(state.trophies / 20);
  return {
    label: `Рейтинг ${state.trophies}`,
    tier,
    energyRate: Math.min(1.34, 0.76 + tier * 0.04),
    startEnergy: Math.min(7.2, 4 + tier * 0.22),
    minThink: Math.max(0.18, 0.88 - tier * 0.035),
    maxThink: Math.max(0.3, 1.12 - tier * 0.04),
    spellChance: Math.min(0.94, 0.38 + tier * 0.035),
    comboChance: Math.min(0.9, 0.18 + tier * 0.035),
    counterChance: Math.min(0.88, 0.25 + tier * 0.05),
    protectChance: Math.min(0.86, 0.22 + tier * 0.045),
    smart: true,
    strict: tier >= 4,
    elite: tier >= 6,
  };
}

function resetMatch() {
  if (state.battleDeck.length !== 5) {
    showToast("В колоде должно быть ровно 5 карт");
    sound("deny");
    return;
  }
  unlockAudio();
  sound("start");
  const campaign = activeCampaignLevel();
  state.started = true;
  state.gameOver = false;
  state.selectedLane = 1;
  state.botStyle = chooseBotStyle();
  state.selectedCard = state.battleDeck.includes(state.selectedCard) ? state.selectedCard : state.battleDeck[0];
  state.enemyDeck = makeEnemyDeck();
  state.playerSpellCooldowns = {};
  state.enemySpellCooldowns = {};
  state.energy = 4;
  state.endlessElapsed = 0;
  state.endlessTier = 0;
  state.endlessNextScale = 20;
  state.enemyEnergy = difficultyConfig().startEnergy;
  state.playerBaseMax = campaign?.playerBase || 1000;
  state.enemyBaseMax = campaign?.enemyBase || 1000;
  state.playerBase = state.playerBaseMax;
  state.enemyBase = state.enemyBaseMax;
  state.timeLeft = isEndlessMode() ? 0 : campaign?.time || 180;
  state.lastTime = 0;
  state.units = [];
  state.projectiles = [];
  state.towerShots = [];
  state.effects = [];
  state.nextUnitId = 1;
  state.botDelay = difficultyConfig().maxThink;
  state.playerTowerCooldown = 0.35;
  state.enemyTowerCooldown = 0.35;
  spawnCampaignOpening(campaign);
  resultPanel.classList.add("hidden");
  modePanel.classList.add("hidden");
  campaignPanel.classList.add("hidden");
  surrenderBtn?.classList.remove("hidden");
  setLane(1);
  renderHand();
  showToast(campaign ? campaign.title : state.matchMode === "ranked" ? `Рейтинг: ${state.trophies} кубков` : `Сложность: ${difficultyConfig().label}`);
  requestAnimationFrame(loop);
}

function renderHand() {
  handEl.innerHTML = "";
  getBattleCards().forEach((card) => {
    const button = document.createElement("button");
    button.className = `card ${card.kind}`;
    button.dataset.card = card.id;
    button.style.setProperty("--tone", card.tone);
    button.innerHTML = `
      <div class="card-head">
        ${cardPortrait(card)}
        <span class="cost">${card.cost}</span>
      </div>
      <strong>${card.name}</strong>
      <small>${card.desc}<br>${cardStatsLabel(card)}</small>
      <span class="cooldown-badge"></span>
    `;
    button.addEventListener("click", () => selectOrPlay(card.id));
    handEl.appendChild(button);
  });
  updateUi(true);
}

startCopy.textContent = "Мультяшные средневековые дуэли: выбери карту, линию и разрушь вражеский замок за 3 минуты.";

function cardPortrait(card, compact = false) {
  const sizeClass = compact ? "mini compact" : "mini";
  if (card.kind === "spell") {
    return `<span class="portrait spell-art ${card.id}"><i></i></span>`;
  }
  return `
    <span class="portrait unit-art ${card.stats.role}">
      <i class="${sizeClass}">
        <em class="head"></em>
        <em class="body"></em>
        <em class="gear"></em>
        <em class="weapon"></em>
      </i>
    </span>
  `;
}

function cardStatsLabel(card) {
  if (card.kind === "unit") {
    if (card.stats.role === "tank") return `${card.stats.hp} HP · прикрывает тыл`;
    if (card.stats.role === "necromancer") return `${card.stats.hp} HP · скелеты`;
    if (card.stats.role === "priest") return `${card.stats.hp} HP · лечит ${card.stats.healPower}`;
    if (card.stats.role === "catgirl") return `${card.stats.hp} HP · +20% урон · 15 HP/2 сек`;
    if (card.stats.role === "mage") return `${card.stats.damage} урон · сплэш/замедление`;
    if (card.stats.role === "catapult") return `${card.stats.damage} урон по замку`;
    if (card.stats.role === "dragon") return `${card.stats.damage} урон · только дальний бой`;
    return `${card.stats.hp} HP · ${card.stats.damage} урон`;
  }
  const labels = {
    fireball: "100 урона + горение",
    freeze: "10 урона + заморозка",
    heal: "200 HP за 4 сек + щит",
    lightning: "350 урона по самому живучему",
    repair: "+110 HP базе · 20 сек",
    haste: "ускорение + малое лечение",
  };
  return labels[card.id] || "Тактический эффект";
}

function renderDeckEditor() {
  deckGrid.innerHTML = "";
  deck.forEach((card) => {
    const selected = state.battleDeck.includes(card.id);
    const lockedByLevel = !isCardUnlocked(card.id);
    const locked = lockedByLevel || (!selected && state.battleDeck.length >= 5);
    const button = document.createElement("button");
    button.className = `deck-option ${selected ? "active" : ""} ${locked ? "locked" : ""}`;
    button.dataset.card = card.id;
    button.style.setProperty("--tone", card.tone);
    button.innerHTML = `
      ${cardPortrait(card, true)}
      <b>${card.name}</b>
      <span>${lockedByLevel ? "Откроется с уровнем" : `${card.cost} энергии · ${cardStatsLabel(card)}`}</span>
    `;
    button.addEventListener("click", () => toggleDeckCard(card.id));
    deckGrid.appendChild(button);
  });
  deckCount.textContent = `${state.battleDeck.length} / 5`;
  const ready = state.battleDeck.length === 5;
  trainingBtn.disabled = !ready;
  quickBtn.disabled = !ready;
  endlessBtn.disabled = !ready;
  campaignBtn.disabled = !ready;
  renderWallet();
  renderProgress();
}

function renderWallet() {
  coinText.textContent = `${state.coins} монет · ${state.trophies} кубков`;
}

function renderProgress() {
  if (!progressLevel || !progressStats || !dailyBonusBtn) return;
  progressLevel.textContent = `Уровень ${state.level}`;
  progressStats.textContent = `${state.xp}/${xpForNextLevel()} XP · ${state.wins} побед · ${state.losses} поражений`;
  const today = todayKey();
  dailyBonusBtn.disabled = state.lastDaily === today;
  dailyBonusBtn.textContent = state.lastDaily === today ? "Бонус получен" : "Дневной бонус +25";
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function claimDailyBonus() {
  const today = todayKey();
  if (state.lastDaily === today) {
    showToast("Дневной бонус уже получен");
    sound("deny");
    return;
  }
  state.lastDaily = today;
  state.coins += 25;
  addProgressXp(15);
  saveSettings();
  renderWallet();
  renderProgress();
  showToast("+25 монет за вход");
  sound("select");
}

function renderDifficulty() {
  difficultyButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.difficulty === state.difficulty);
  });
}

function renderCampaignMap() {
  campaignMap.innerHTML = "";
  campaignLevels.forEach((level, index) => {
    const unlocked = index < state.campaignProgress;
    const completed = index + 1 < state.campaignProgress;
    const node = document.createElement("button");
    node.className = `campaign-node ${unlocked ? "unlocked" : "locked"} ${completed ? "completed" : ""}`;
    node.disabled = !unlocked;
    node.innerHTML = `
      <span class="campaign-badge">${completed ? "✓" : unlocked ? index + 1 : "×"}</span>
      <strong>${level.title}</strong>
      <small>${level.subtitle}</small>
      <em>${difficultyConfigFor(level.difficulty).label}</em>
    `;
    node.addEventListener("click", () => startCampaignLevel(level.id));
    campaignMap.appendChild(node);
  });
}

function difficultyConfigFor(difficulty) {
  const current = state.difficulty;
  const currentMode = state.matchMode;
  state.difficulty = difficulty;
  state.matchMode = "quick";
  const config = difficultyConfig();
  state.difficulty = current;
  state.matchMode = currentMode;
  return config;
}

function chooseBotStyle() {
  if (state.matchMode === "ranked") {
    const tier = Math.floor(state.trophies / 20);
    if (tier >= 6) return shuffle(["aggressive", "balanced", "defensive"])[0];
    if (tier >= 3) return shuffle(["balanced", "aggressive", "defensive"])[0];
    return shuffle(["balanced", "defensive"])[0];
  }
  if (state.matchMode === "endless") return shuffle(["aggressive", "balanced", "defensive"])[0];
  if (state.difficulty === "hard" || state.difficulty === "impossible") return shuffle(["balanced", "aggressive"])[0];
  return shuffle(["balanced", "defensive"])[0];
}

function openCampaignMap() {
  if (state.started) return;
  modePanel.classList.add("hidden");
  resultPanel.classList.add("hidden");
  campaignPanel.classList.remove("hidden");
  renderCampaignMap();
  sound("select");
}

function startCampaignLevel(levelId) {
  const levelIndex = campaignLevels.findIndex((level) => level.id === levelId);
  if (levelIndex < 0 || levelIndex >= state.campaignProgress) {
    showToast("Этот уровень пока закрыт");
    sound("deny");
    return;
  }
  const level = campaignLevels[levelIndex];
  state.activeCampaignId = level.id;
  state.matchMode = "campaign";
  state.difficulty = level.difficulty;
  renderDifficulty();
  resetMatch();
}

function spawnCampaignOpening(campaign) {
  if (!campaign?.openingEnemies?.length) return;
  campaign.openingEnemies.forEach((entry) => {
    const card = deck.find((item) => item.id === entry.card);
    if (!card) return;
    spawnUnit("enemy", card, entry.lane);
  });
}

function toggleDeckCard(cardId) {
  unlockAudio();
  if (state.started) return;
  if (!isCardUnlocked(cardId)) {
    showToast("Карта пока закрыта");
    sound("deny");
    return;
  }
  if (state.battleDeck.includes(cardId)) {
    state.battleDeck = state.battleDeck.filter((id) => id !== cardId);
    if (state.selectedCard === cardId) state.selectedCard = state.battleDeck[0] || "";
    sound("tap");
  } else if (state.battleDeck.length < 5) {
    state.battleDeck.push(cardId);
    state.selectedCard = cardId;
    sound("select");
  } else {
    showToast("В колоде максимум 5 карт");
    sound("deny");
  }
  saveSettings();
  renderDeckEditor();
  renderHand();
}

function selectOrPlay(cardId) {
  if (!state.started) {
    showToast("Сначала начни матч");
    sound("deny");
    return;
  }
  const card = deck.find((item) => item.id === cardId);
  if (!card) return;
  if (state.selectedCard !== cardId) {
    state.selectedCard = cardId;
    showToast(card.kind === "spell" ? `${card.name}: кликни место на поле` : `${card.name}: нажми линию`);
    sound("select");
    updateUi(true);
    return;
  }
  playSelected();
}

function playSelected(targetX = null, targetY = null) {
  if (state.gameOver || !state.started) return;
  const card = deck.find((item) => item.id === state.selectedCard);
  if (!card) return;
  if (state.energy < card.cost) {
    showToast("Не хватает энергии");
    sound("deny");
    return;
  }
  if (card.kind === "spell" && !spellReady("player", card.id)) {
    showToast(`Перезарядка: ${Math.ceil(state.playerSpellCooldowns[card.id])} сек`);
    sound("deny");
    return;
  }
  state.energy -= card.cost;
  if (card.kind === "unit") {
    spawnUnit("player", card, state.selectedLane);
    ripple(laneX(state.selectedLane), H - 188, palette.player, 42);
  } else {
    const x = targetX ?? state.aimX;
    const y = targetY ?? H / 2;
    castSpell("player", card.id, state.selectedLane, x, y);
    startSpellCooldown("player", card.id);
    ripple(x, y, card.tone, 42);
  }
  sound(card.kind === "unit" ? "summon" : card.id);
  updateUi();
}

function setLane(lane) {
  state.selectedLane = lane;
  state.aimX = laneX(lane);
  laneButtons.forEach((button) => button.classList.toggle("active", Number(button.dataset.lane) === lane));
  showToast(`Линия: ${lanes[lane].name}`);
  sound("tap");
}

function spawnUnit(team, card, lane) {
  const stats = card.stats;
  const path = laneRoadPoints(lane, team);
  const start = path[0];
  const x = start.x + (Math.random() - 0.5) * 18;
  const y = start.y;
  const unit = {
    id: state.nextUnitId++,
    team,
    lane,
    x,
    y,
    homeY: y,
    homeX: laneX(lane),
    dir: team === "player" ? -1 : 1,
    name: card.name,
    role: stats.role,
    hp: stats.hp,
    maxHp: stats.hp,
    damage: stats.damage,
    healPower: stats.healPower || 0,
    flying: Boolean(stats.flying),
    range: stats.range,
    speed: stats.speed,
    cooldownMax: stats.cooldown,
    cooldown: 0.25,
    size: stats.size,
    splash: stats.splash || 0,
    leap: Boolean(stats.leap),
    freeze: 0,
    haste: 0,
    slow: 0,
    burn: 0,
    regen: 0,
    regenRate: 0,
    stun: 0,
    shield: 0,
    auraTick: stats.aura ? 2 : 0,
    summonCooldown: stats.summon ? 1.4 : 0,
    baseRun: false,
    pathStep: 1,
    spawnEase: 0,
    shootAnim: 0,
    attackAnim: 0,
    flash: 0,
    walk: Math.random() * 10,
  };
  state.units.push(unit);
  burst(x, y, team === "player" ? palette.player : palette.enemy, 34);
  if (unit.role === "catgirl") charmOnSpawn(unit);
  if (team === "enemy") sound("enemy");
}

function spawnSkeleton(team, lane, y, xHint = null, pathStepHint = 1) {
  const dir = team === "player" ? -1 : 1;
  const x = (xHint ?? laneX(lane)) + (Math.random() - 0.5) * 22;
  state.units.push({
    id: state.nextUnitId++,
    team,
    lane,
    x,
    y: Math.max(150, Math.min(H - 150, y)),
    homeY: Math.max(150, Math.min(H - 150, y)),
    homeX: laneX(lane),
    dir,
    name: "Скелет",
    role: "skeleton",
    hp: 74,
    maxHp: 74,
    damage: 15,
    flying: false,
    range: 42,
    speed: 68,
    cooldownMax: 1.02,
    cooldown: 0.18,
    size: 17,
    splash: 0,
    leap: false,
    freeze: 0,
    haste: 0,
    slow: 0,
    burn: 0,
    regen: 0,
    regenRate: 0,
    stun: 0,
    shield: 0,
    auraTick: 0,
    summonCooldown: 0,
    baseRun: false,
    pathStep: pathStepHint,
    spawnEase: 1,
    shootAnim: 0,
    attackAnim: 0,
    flash: 0,
    walk: Math.random() * 10,
  });
  burst(x, y, "#d8e0d8", 24);
}

function charmOnSpawn(unit) {
  state.units
    .filter((other) => other.team !== unit.team && Math.hypot(other.x - unit.x, other.y - unit.y) <= 231)
    .forEach((enemy) => {
      enemy.stun = Math.max(enemy.stun || 0, 2);
      enemy.flash = 0.3;
      charm(enemy.x, enemy.y - enemy.size);
    });
  burst(unit.x, unit.y, "#ff9bd5", 92);
  charm(unit.x, unit.y - unit.size * 1.5);
}

function castSpell(team, spell, lane, targetX = null, targetY = null) {
  const foe = team === "player" ? "enemy" : "player";
  const friend = team;
  const aimedY = targetY ?? (team === "player" ? 330 : H - 330);
  const x = laneX(lane);
  const offensiveY = Math.max(150, Math.min(H - 150, aimedY));
  const supportY = Math.max(150, Math.min(H - 150, aimedY));
  const y = offensiveY;
  if (spell === "fireball") {
    unitsNear(foe, lane, offensiveY, 160).forEach((unit) => {
      hitUnit(unit, 100);
      unit.burn = Math.max(unit.burn, 2.1);
    });
    burst(x, y, "#ff774d", 126);
    ember(x, y, 18);
    shakeLine(lane);
  }
  if (spell === "freeze") {
    unitsNear(foe, lane, offensiveY, 190).forEach((unit) => {
      hitUnit(unit, 10);
      unit.freeze = Math.max(unit.freeze, 1.75);
      unit.slow = Math.max(unit.slow || 0, 1.4);
      unit.haste = Math.min(unit.haste, 0);
    });
    burst(x, y, palette.ice, 122);
    frost(x, y, 16);
  }
  if (spell === "heal") {
    unitsNear(friend, lane, supportY, 205).forEach((unit) => {
      unit.regen = Math.max(unit.regen || 0, 4);
      unit.regenRate = Math.max(unit.regenRate || 0, 50);
      unit.shield = Math.max(unit.shield, 65);
      unit.flash = 0.22;
    });
    burst(x, supportY, palette.green, 118);
  }
  if (spell === "repair") {
    const base = basePoint(friend);
    if (friend === "player") {
      state.playerBase = Math.min(state.playerBaseMax || 1000, state.playerBase + 110);
    } else {
      state.enemyBase = Math.min(state.enemyBaseMax || 1000, state.enemyBase + 110);
    }
    burst(base.x, base.y, "#79d7ff", 112);
    beam(base.x - 34, base.y - 20, base.x + 34, base.y - 20, "#d9fbff");
    sparks(base.x, base.y, 14);
  }
  if (spell === "lightning") {
    const target = state.units
      .filter((unit) => unit.team === foe && unit.lane === lane)
      .sort((a, b) => b.hp - a.hp || Math.abs(a.y - offensiveY) - Math.abs(b.y - offensiveY))[0];
    if (target) {
      hitUnit(target, 350);
      bolt(target.x, target.y - (target.flying ? 42 : 0));
    } else {
      hitBase(foe, 60);
      const base = basePoint(foe);
      bolt(base.x, base.y);
    }
  }
  if (spell === "haste") {
    unitsNear(friend, lane, supportY, 190).forEach((unit) => {
      unit.haste = Math.max(unit.haste, 2.6);
      unit.hp = Math.min(unit.maxHp, unit.hp + 25);
      unit.flash = 0.22;
    });
    burst(x, supportY, palette.gold, 98);
  }
}

function unitsNear(team, lane, y, radius) {
  return state.units.filter((unit) => unit.team === team && unit.lane === lane && Math.abs(unit.y - y) <= radius);
}

function damageArea(team, lane, y, radius, amount) {
  unitsNear(team, lane, y, radius).forEach((unit) => hitUnit(unit, amount));
}

function hitUnit(unit, amount) {
  const guardedAmount = applyGuard(unit, amount);
  amount = guardedAmount.amount;
  if (guardedAmount.guarded) unit.shield = Math.max(unit.shield || 0, 8);
  const blocked = Math.min(unit.shield || 0, amount);
  unit.shield = Math.max(0, (unit.shield || 0) - blocked);
  unit.hp -= amount - blocked;
  unit.flash = 0.16;
  hitFlash(unit.x, unit.y - unit.size * 0.4, amount > 100 ? palette.gold : "#fff8df", amount > 100 ? 34 : 22);
  sparks(unit.x, unit.y, amount > 100 ? 15 : 8);
  if (amount >= 90) screenShake(4);
  sound("hit");
}

function applyGuard(unit, amount) {
  if (unit.role === "tank" || unit.role === "catapult") return { amount, guarded: false };
  const guard = state.units.find((ally) => {
    if (ally.team !== unit.team || ally.lane !== unit.lane || ally.role !== "tank" || ally.hp <= 0) return false;
    const inFront = unit.team === "player" ? ally.y < unit.y + 8 : ally.y > unit.y - 8;
    return inFront && Math.abs(ally.y - unit.y) <= 150;
  });
  return guard ? { amount: amount * 0.78, guarded: true } : { amount, guarded: false };
}

function hitBase(team, amount, impactX = null, impactY = null) {
  if (!hasBase(team)) return;
  if (team === "enemy") state.enemyBase -= amount;
  if (team === "player") state.playerBase -= amount;
  const base = basePoint(team);
  burst(impactX ?? base.x, impactY ?? base.y, team === "enemy" ? palette.enemy : palette.player, 42);
  sparks(impactX ?? base.x, impactY ?? base.y, 12);
  screenShake(Math.min(12, 4 + amount / 18));
  sound("base");
}

function update(dt) {
  if (!state.started || state.gameOver) return;
  state.shake = Math.max(0, state.shake - dt * 18);
  if (state.hitStop > 0) {
    state.hitStop = Math.max(0, state.hitStop - dt);
    dt *= 0.35;
  }
  state.energy = Math.min(10, state.energy + dt * 0.78);
  state.enemyEnergy = Math.min(10, state.enemyEnergy + dt * difficultyConfig().energyRate);
  tickSpellCooldowns(state.playerSpellCooldowns, dt);
  tickSpellCooldowns(state.enemySpellCooldowns, dt);
  if (isEndlessMode()) {
    state.endlessElapsed += dt;
    state.timeLeft = state.endlessElapsed;
    if (state.endlessElapsed >= state.endlessNextScale) {
      state.endlessTier += 1;
      state.endlessNextScale += 20;
      state.botStyle = chooseBotStyle();
      state.botDelay = Math.min(state.botDelay, difficultyConfig().minThink);
      showToast(`Осада усилилась: ${state.endlessTier + 1}`);
      burst(W / 2, ROAD_TOP_Y, palette.enemy, 78);
      sound("select");
    }
  } else {
    state.timeLeft = Math.max(0, state.timeLeft - dt);
  }
  state.toastTimer = Math.max(0, state.toastTimer - dt);
  if (state.toastTimer <= 0) toastEl.classList.add("hidden");

  state.botDelay -= dt;
  if (state.botDelay <= 0) botMove();

  state.units.forEach((unit) => updateUnit(unit, dt));
  updateTowers(dt);
  state.projectiles.forEach((projectile) => updateProjectile(projectile, dt));
  state.towerShots.forEach((shot) => updateTowerShot(shot, dt));
  state.units.forEach((unit) => {
    if (unit.hp <= 0 && !unit.deadEffect) {
      unit.deadEffect = true;
      deathPoof(unit.x, unit.y, unit.team === "player" ? palette.player : palette.enemy);
      screenShake(unit.maxHp > 250 ? 5 : 2.5);
      sound("death");
    }
  });
  state.units = state.units.filter((unit) => unit.hp > 0);
  state.projectiles = state.projectiles.filter((projectile) => projectile.life > 0);
  state.towerShots = state.towerShots.filter((shot) => shot.life > 0);
  state.effects.forEach((effect) => (effect.life -= dt));
  state.effects = state.effects.filter((effect) => effect.life > 0);

  if (!isEndlessMode() && state.enemyBase <= 0) finish("Победа", "База противника разрушена.");
  if (state.playerBase <= 0) finish("Поражение", "Твоя база разрушена.");
  if (!isEndlessMode() && state.timeLeft <= 0) {
    if (state.enemyBase === state.playerBase) finish("Ничья", "Обе базы выстояли.");
    else if (state.enemyBase < state.playerBase) finish("Победа", "Ты нанес больше урона базе.");
    else finish("Поражение", "Враг нанес больше урона базе.");
  }
}

function tickSpellCooldowns(cooldowns, dt) {
  Object.keys(cooldowns).forEach((spell) => {
    cooldowns[spell] = Math.max(0, cooldowns[spell] - dt);
  });
}

function updateUnit(unit, dt) {
  unit.spawnEase = Math.min(1, (unit.spawnEase || 0) + dt * 2.8);
  unit.cooldown -= dt * (unit.haste > 0 ? 1.65 : 1);
  unit.freeze = Math.max(0, unit.freeze - dt);
  unit.stun = Math.max(0, (unit.stun || 0) - dt);
  unit.haste = Math.max(0, unit.haste - dt);
  unit.slow = Math.max(0, unit.slow - dt);
  unit.shootAnim = Math.max(0, (unit.shootAnim || 0) - dt);
  unit.attackAnim = Math.max(0, (unit.attackAnim || 0) - dt);
  unit.flash = Math.max(0, unit.flash - dt);
  if (unit.role === "necromancer") {
    unit.summonCooldown = Math.max(0, unit.summonCooldown - dt);
    if (unit.summonCooldown <= 0) {
      unit.summonCooldown = 5.2;
      const offset = unit.team === "player" ? 34 : -34;
      spawnSkeleton(unit.team, unit.lane, unit.y + offset, unit.x, unit.pathStep);
      soul(unit.x, unit.y, unit.team === "player" ? palette.player : palette.enemy);
      sound("summon");
    }
  }
  if (unit.role === "catgirl") {
    unit.auraTick = Math.max(0, (unit.auraTick || 0) - dt);
    if (unit.auraTick <= 0) {
      unit.auraTick = 2;
      nearbyAllies(unit, 135).forEach((ally) => {
        ally.hp = Math.min(ally.maxHp, ally.hp + 15);
        ally.flash = 0.18;
        hitFlash(ally.x, ally.y - ally.size, palette.green, 10);
      });
      auraPulse(unit.x, unit.y, unit.team === "player" ? palette.player : "#ff9bd5");
    }
  }
  if (unit.burn > 0) {
    unit.burn = Math.max(0, unit.burn - dt);
    unit.hp -= 16 * dt;
    if (Math.random() < dt * 8) sparks(unit.x, unit.y, 3);
  }
  if (unit.regen > 0) {
    const healed = Math.min(unit.maxHp - unit.hp, (unit.regenRate || 0) * dt);
    unit.hp += Math.max(0, healed);
    unit.regen = Math.max(0, unit.regen - dt);
    if (Math.random() < dt * 6) hitFlash(unit.x, unit.y - unit.size * 0.8, palette.green, 12);
  }
  unit.walk += dt * 8;
  if (unit.freeze > 0 || unit.stun > 0) return;

  if (unit.role === "priest") {
    const ally = findHealTarget(unit);
    if (ally && unit.cooldown <= 0) {
      healUnit(ally, unit.healPower);
      beam(unit.x, unit.y - unit.size, ally.x, ally.y - ally.size, unit.team === "player" ? palette.green : palette.gold);
      unit.cooldown = unit.cooldownMax;
      unit.attackAnim = 0.28;
      sound("heal");
      return;
    }
    if (ally) return;
  }

  const target = findTarget(unit);
  const targetTeam = unit.team === "player" ? "enemy" : "player";
  const baseAttackPoint = baseHitPoint(targetTeam, unit.lane);
  const baseDistance = Math.hypot(baseAttackPoint.x - unit.x, baseAttackPoint.y - unit.y);
  const baseAttackRange = Math.max(78, unit.range + 14);
  const speedScale = 0.45 + 0.55 * (unit.spawnEase ?? 1);
  const targetBaseExists = hasBase(targetTeam);

  const roadPath = laneRoadPoints(unit.lane, unit.team);
  const roadEnd = roadPath[roadPath.length - 1];
  const reachedEmptyEnd = Math.hypot(roadEnd.x - unit.x, roadEnd.y - unit.y) <= 18 || unit.pathStep >= roadPath.length;
  if (!targetBaseExists && !target && reachedEmptyEnd) {
    unit.hp = 0;
    deathPoof(unit.x, unit.y, unit.team === "player" ? palette.player : palette.enemy);
    return;
  }

  if (unit.role === "catapult") {
    const flyingTarget = state.units
      .filter((other) => other.team !== unit.team && other.lane === unit.lane && other.flying)
      .sort((a, b) => Math.abs(a.y - unit.y) - Math.abs(b.y - unit.y))[0];
    if (flyingTarget && Math.abs(flyingTarget.y - unit.y) <= unit.range) {
      if (unit.cooldown <= 0) {
        launchAntiAir(unit, flyingTarget);
        unit.cooldown = unit.cooldownMax;
        unit.attackAnim = 0.35;
      }
      return;
    }
    if (targetBaseExists && baseDistance <= unit.range && unit.cooldown <= 0) {
      launchSiege(unit, unit.team === "player" ? "enemy" : "player");
      unit.cooldown = unit.cooldownMax;
      unit.attackAnim = 0.35;
      return;
    }
    if (!targetBaseExists) {
      moveAlongRoad(unit, unit.speed * speedScale * (unit.slow > 0 ? 0.58 : 1) * dt);
      return;
    }
    if (baseDistance > unit.range) moveAlongRoad(unit, unit.speed * speedScale * (unit.slow > 0 ? 0.58 : 1) * dt);
    return;
  }

  if (target && Math.hypot(target.x - unit.x, target.y - unit.y) <= unit.range) {
    if (unit.cooldown <= 0) {
      attack(unit, target);
      unit.cooldown = unit.cooldownMax;
      unit.attackAnim = 0.28;
    }
    return;
  }

  if (targetBaseExists && !target && baseDistance <= baseAttackRange) {
    if (unit.cooldown <= 0) {
      hitBase(targetTeam, unitDamage(unit) * 1.38, baseAttackPoint.x, baseAttackPoint.y);
      sound("base");
      unit.cooldown = unit.cooldownMax;
      unit.attackAnim = 0.28;
    }
    return;
  }

  const slowFactor = unit.slow > 0 ? 0.58 : 1;
  if (target) {
    unit.baseRun = false;
    moveAlongRoad(unit, unit.speed * speedScale * slowFactor * dt);
  } else {
    moveAlongRoad(unit, unit.speed * speedScale * slowFactor * dt);
  }
  unit.y = Math.max(ROAD_TOP_Y, Math.min(ROAD_BOTTOM_Y, unit.y));
}

function basePathPoint(unit) {
  return baseFrontPoint(unit.team === "player" ? "enemy" : "player", unit.lane);
}

function moveToward(unit, point, distance) {
  const dx = point.x - unit.x;
  const dy = point.y - unit.y;
  const length = Math.hypot(dx, dy) || 1;
  const step = Math.min(distance, length);
  unit.x += (dx / length) * step;
  unit.y += (dy / length) * step;
}

function moveAlongRoad(unit, distance) {
  const path = laneRoadPoints(unit.lane, unit.team);
  unit.pathStep = Math.max(1, Math.min(unit.pathStep || 1, path.length - 1));
  let remaining = distance;
  while (remaining > 0 && unit.pathStep < path.length) {
    const target = path[unit.pathStep];
    const dx = target.x - unit.x;
    const dy = target.y - unit.y;
    const length = Math.hypot(dx, dy) || 1;
    const step = Math.min(remaining, length);
    unit.x += (dx / length) * step;
    unit.y += (dy / length) * step;
    remaining -= step;
    if (length <= step + 0.1) unit.pathStep += 1;
    else break;
  }
}

function launchSiege(unit, targetBaseTeam) {
  const base = baseHitPoint(targetBaseTeam, unit.lane);
  unit.shootAnim = 0.55;
  state.projectiles.push({
    team: unit.team,
    x: unit.x + unit.dir * 16,
    y: unit.y - 30,
    startX: unit.x + unit.dir * 16,
    startY: unit.y - 30,
    tx: base.x,
    ty: base.y,
    targetId: null,
    targetBase: targetBaseTeam,
    damage: unitDamage(unit),
    splash: 0,
    slow: 0,
    color: "#5b3b27",
    life: 1.55,
    maxLife: 1.55,
    siege: true,
  });
  sound("base");
}

function launchAntiAir(unit, target) {
  unit.shootAnim = 0.55;
  state.projectiles.push({
    team: unit.team,
    x: unit.x + unit.dir * 16,
    y: unit.y - 30,
    startX: unit.x + unit.dir * 16,
    startY: unit.y - 30,
    tx: target.x,
    ty: target.y - 52,
    targetId: target.id,
    damage: unitDamage(unit) * 0.82,
    splash: 0,
    slow: 0,
    color: "#5b3b27",
    life: 1.15,
    maxLife: 1.15,
  });
  sound("base");
}

function findHealTarget(unit) {
  const allies = state.units
    .filter((other) => other.team === unit.team && other.lane === unit.lane && other.id !== unit.id && other.hp < other.maxHp && Math.abs(other.y - unit.y) <= unit.range)
    .sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp);
  return allies[0] || null;
}

function healUnit(unit, amount) {
  unit.hp = Math.min(unit.maxHp, unit.hp + amount);
  unit.flash = 0.22;
}

function nearbyAllies(unit, radius) {
  return state.units.filter((ally) => ally.team === unit.team && ally.id !== unit.id && ally.hp > 0 && Math.hypot(ally.x - unit.x, ally.y - unit.y) <= radius);
}

function hasCatgirlAura(unit) {
  return state.units.some((ally) => ally.team === unit.team && ally.id !== unit.id && ally.role === "catgirl" && ally.hp > 0 && Math.hypot(ally.x - unit.x, ally.y - unit.y) <= 135);
}

function unitDamage(unit) {
  return unit.damage * (hasCatgirlAura(unit) ? 1.2 : 1);
}

function findTarget(unit) {
  const enemies = state.units.filter((other) => other.team !== unit.team && other.lane === unit.lane && canTargetUnit(unit, other));
  if (!enemies.length) return null;
  if (unit.leap) {
    const fragile = enemies
      .filter((other) => other.maxHp <= 200)
      .sort((a, b) => Math.abs(a.y - unit.y) - Math.abs(b.y - unit.y));
    const openTarget = fragile.find((target) => !isFrontBlocked(unit, target) || Math.abs(target.y - unit.y) <= unit.range + 70);
    if (openTarget) return openTarget;
  }
  return enemies.sort((a, b) => Math.abs(a.y - unit.y) - Math.abs(b.y - unit.y))[0];
}

function canTargetUnit(attacker, target) {
  if (!target.flying) return true;
  return ["ranger", "mage", "necromancer", "priest", "catgirl", "dragon", "catapult"].includes(attacker.role);
}

function isFrontBlocked(unit, target) {
  return state.units.some((other) => {
    if (other.team === unit.team || other.lane !== unit.lane || other.id === target.id || other.hp <= 0) return false;
    const between = unit.team === "player" ? other.y < unit.y && other.y > target.y : other.y > unit.y && other.y < target.y;
    const isFrontline = other.maxHp > 200 || ["tank", "swordsman", "skeleton", "catapult"].includes(other.role);
    return between && isFrontline;
  });
}

function attack(attacker, target) {
  const damage = unitDamage(attacker);
  if (["ranger", "mage", "necromancer", "catgirl", "dragon"].includes(attacker.role)) {
    state.projectiles.push({
      team: attacker.team,
      x: attacker.x + attacker.dir * 18,
      y: attacker.y - (attacker.flying ? 46 : 12),
      tx: target.x,
      ty: target.y - (target.flying ? 42 : 0),
      targetId: target.id,
      damage,
      splash: attacker.splash,
      slow: attacker.role === "mage" ? attacker.slowOnHit || 2 : 0,
      color: attacker.role === "dragon" ? "#ff774d" : attacker.role === "catgirl" ? "#ff9bd5" : attacker.role === "mage" || attacker.role === "necromancer" ? palette.violet : palette.gold,
      life: 1,
    });
    sound(attacker.role === "dragon" ? "fireball" : "hit");
    return;
  }
  hitUnit(target, damage);
  slash(target.x, target.y, attacker.team === "player" ? palette.player : palette.enemy);
  sound("hit");
}

function updateProjectile(projectile, dt) {
  if (projectile.siege) {
    projectile.life -= dt;
    const total = projectile.maxLife || 1.55;
    const progress = Math.max(0, Math.min(1, 1 - projectile.life / total));
    projectile.x = projectile.startX + (projectile.tx - projectile.startX) * progress;
    projectile.y = projectile.startY + (projectile.ty - projectile.startY) * progress - Math.sin(progress * Math.PI) * 150;
    if (progress >= 1 || projectile.life <= 0) {
      projectile.life = 0;
      if (projectile.targetBase) {
        hitBase(projectile.targetBase, projectile.damage, projectile.tx, projectile.ty);
        sparks(projectile.tx, projectile.ty, 12);
      }
    }
    return;
  }
  const target = state.units.find((unit) => unit.id === projectile.targetId);
  if (target) {
    projectile.tx = target.x;
    projectile.ty = target.y - (target.flying ? 42 : 0);
  }
  const dx = projectile.tx - projectile.x;
  const dy = projectile.ty - projectile.y;
  const distance = Math.hypot(dx, dy) || 1;
  const speed = 520;
  projectile.x += (dx / distance) * speed * dt;
  projectile.y += (dy / distance) * speed * dt;
  projectile.life -= dt;
  if (distance < 18 || projectile.life <= 0) {
    projectile.life = 0;
    if (target) {
      hitUnit(target, projectile.damage);
      if (projectile.slow) target.slow = Math.max(target.slow || 0, projectile.slow);
      if (projectile.splash) {
        state.units
          .filter((unit) => unit.team !== projectile.team && unit.lane === target.lane && unit.id !== target.id && Math.abs(unit.y - target.y) < projectile.splash)
          .forEach((unit) => {
            hitUnit(unit, projectile.damage * 0.55);
            if (projectile.slow) unit.slow = Math.max(unit.slow || 0, projectile.slow * 0.75);
          });
        burst(target.x, target.y, palette.violet, 46);
        frost(target.x, target.y, 8);
      }
    }
  }
}

function updateTowers(dt) {
  state.playerTowerCooldown = Math.max(0, state.playerTowerCooldown - dt);
  state.enemyTowerCooldown = Math.max(0, state.enemyTowerCooldown - dt);
  tryTowerFire("player");
  tryTowerFire("enemy");
}

function tryTowerFire(team) {
  if (!hasBase(team)) return;
  const base = basePoint(team);
  const foe = team === "player" ? "enemy" : "player";
  const cooldownKey = team === "player" ? "playerTowerCooldown" : "enemyTowerCooldown";
  if (state[cooldownKey] > 0) return;

  const target = state.units
    .filter((unit) => unit.team === foe && Math.abs(unit.y - base.y) < 330)
    .sort((a, b) => {
      if (a.flying && !b.flying) return -1;
      if (b.flying && !a.flying) return 1;
      if (a.role === "catapult" && b.role !== "catapult") return -1;
      if (b.role === "catapult" && a.role !== "catapult") return 1;
      return Math.abs(a.y - base.y) - Math.abs(b.y - base.y);
    })[0];
  if (!target) return;

  state[cooldownKey] = 1.05;
  state.towerShots.push({
    team,
    x: base.x,
    y: base.y,
    tx: target.x,
    ty: target.y - (target.flying ? 42 : 10),
    targetId: target.id,
    damage: 46,
    color: team === "player" ? palette.player : palette.enemy,
    life: 1.2,
  });
  sound("tower");
}

function updateTowerShot(shot, dt) {
  const target = state.units.find((unit) => unit.id === shot.targetId);
  if (target) {
    shot.tx = target.x;
    shot.ty = target.y - (target.flying ? 42 : 10);
  }
  const dx = shot.tx - shot.x;
  const dy = shot.ty - shot.y;
  const distance = Math.hypot(dx, dy) || 1;
  const speed = 640;
  shot.x += (dx / distance) * speed * dt;
  shot.y += (dy / distance) * speed * dt;
  shot.life -= dt;
  if (distance < 20 || shot.life <= 0) {
    shot.life = 0;
    if (target) {
      hitUnit(target, shot.damage);
      burst(target.x, target.y, shot.color, 28);
      sound("towerHit");
    }
  }
}

function botMove() {
  const config = difficultyConfig();
  state.botDelay = config.minThink + Math.random() * (config.maxThink - config.minThink);
  const pressure = lanes.map((_, lane) => {
    const player = state.units.filter((u) => u.team === "player" && u.lane === lane).reduce((sum, u) => sum + u.hp + u.damage * 6, 0);
    const enemy = state.units.filter((u) => u.team === "enemy" && u.lane === lane).reduce((sum, u) => sum + u.hp + u.damage * 6, 0);
    return player - enemy;
  });
  const threatLane = findBotThreatLane();
  const defenseLane = pressure.indexOf(Math.max(...pressure));
  const attackLane = pressure.indexOf(Math.min(...pressure));
  const style = state.botStyle || "balanced";
  let lane = threatLane >= 0 ? threatLane : pressure[defenseLane] > 180 || !config.smart ? defenseLane : attackLane;
  if (config.smart && threatLane < 0) {
    if (style === "defensive" && pressure[defenseLane] > 70) lane = defenseLane;
    if (style === "aggressive" && pressure[defenseLane] < 330) lane = attackLane;
  }
  const enemyCards = getEnemyCards();
  const affordableUnits = enemyCards.filter((card) => card.kind === "unit" && card.cost <= state.enemyEnergy && (card.id !== "catapult" || shouldBotUseCatapult(pressure, attackLane, config)));
  const affordableSpells = enemyCards.filter((card) => card.kind === "spell" && card.cost <= state.enemyEnergy && spellReady("enemy", card.id) && (card.id !== "repair" || state.enemyBase < (state.enemyBaseMax || 1000) - 70));
  if (!affordableUnits.length && !affordableSpells.length) {
    state.botDelay = Math.min(state.botDelay, 0.35);
    return;
  }

  let card;
  let castX = config.smart ? targetSpellX("player", lane) : H / 2;
  let castLane = lane;
  if (config.smart && threatLane >= 0) {
    const siegeTarget = state.units.find((unit) => unit.team === "player" && unit.lane === threatLane && unit.role === "catapult");
    card = affordableSpells.find((item) => item.id === "lightning") || affordableSpells.find((item) => item.id === "fireball") || affordableSpells.find((item) => item.id === "freeze");
    if (card) {
      castLane = threatLane;
      castX = siegeTarget ? siegeTarget.y : targetSpellX("player", threatLane);
    }
  }
  const woundedLane = lanes
    .map((_, index) => ({
      lane: index,
      wounded: state.units.filter((u) => u.team === "enemy" && u.lane === index && u.hp < u.maxHp * 0.65).length,
    }))
    .sort((a, b) => b.wounded - a.wounded)[0];
  if (!card && config.smart && woundedLane.wounded >= 2 && state.enemyEnergy >= 3 && Math.random() < config.spellChance) {
    card = enemyCards.find((item) => item.id === "heal");
    if (card && card.cost <= state.enemyEnergy && spellReady("enemy", card.id)) {
      state.enemyEnergy -= card.cost;
      startSpellCooldown("enemy", card.id);
      castSpell("enemy", card.id, woundedLane.lane, laneX(woundedLane.lane), targetSpellX("enemy", woundedLane.lane));
      return;
    }
  }
  if (!card && config.smart && state.enemyBase < (state.enemyBaseMax || 1000) - 130 && Math.random() < config.spellChance) {
    card = affordableSpells.find((item) => item.id === "repair");
    if (card) {
      state.enemyEnergy -= card.cost;
      startSpellCooldown("enemy", card.id);
      castSpell("enemy", card.id, 1, laneX(1), ROAD_TOP_Y);
      return;
    }
  }
  if (!card && shouldBotBankEnergy(pressure, defenseLane, attackLane, affordableUnits, config)) {
    state.botDelay = Math.min(state.botDelay, 0.26);
    return;
  }
  if (!card && affordableSpells.length && Math.random() < config.spellChance) {
    if (pressure[defenseLane] > 520) {
      card = affordableSpells.find((item) => item.id === "fireball");
      castLane = defenseLane;
    }
    if (!card && pressure[defenseLane] > 340) {
      card = affordableSpells.find((item) => item.id === "freeze");
      castLane = defenseLane;
    }
    if (!card && config.smart && pressure[defenseLane] > 260) {
      card = affordableSpells.find((item) => item.id === "lightning");
      castLane = defenseLane;
    }
    if (!card && pressure[attackLane] < -180) {
      card = affordableSpells.find((item) => item.id === "haste");
      castLane = attackLane;
      castX = targetSpellX("enemy", attackLane);
    }
  }
  if (!card && config.strict && affordableSpells.length && pressure[defenseLane] > 260) {
    card = affordableSpells.find((item) => item.id === "freeze") || affordableSpells.find((item) => item.id === "lightning") || affordableSpells.find((item) => item.id === "fireball");
    castLane = defenseLane;
    castX = targetSpellX("player", defenseLane);
  }
  if (!card && affordableUnits.length) {
    const preferred = chooseBotUnit(affordableUnits, pressure, defenseLane, attackLane, config);
    card = preferred || affordableUnits[Math.floor(Math.random() * affordableUnits.length)];
    castLane = chooseBotLane(card, pressure, defenseLane, attackLane, config);
  }
  if (!card && affordableSpells.length) {
    card = affordableSpells[Math.floor(Math.random() * affordableSpells.length)];
    castLane = card.id === "haste" || card.id === "heal" ? attackLane : defenseLane;
    castX = card.id === "haste" || card.id === "heal" ? targetSpellX("enemy", castLane) : targetSpellX("player", castLane);
  }

  if (!card) return;
  if (card.cost > state.enemyEnergy) return;
  state.enemyEnergy -= card.cost;
  if (card.kind === "unit") {
    spawnUnit("enemy", card, castLane);
    tryBotFollowUp(card, castLane, pressure, config);
  } else {
    startSpellCooldown("enemy", card.id);
    castSpell("enemy", card.id, castLane, laneX(castLane), castX);
    tryBotSpellFollowUp(card, castLane, pressure, config);
  }
}

function findBotThreatLane() {
  const catapult = state.units
    .filter((unit) => unit.team === "player" && unit.role === "catapult")
    .sort((a, b) => a.y - b.y)[0];
  if (catapult) return catapult.lane;
  const nearBase = state.units
    .filter((unit) => unit.team === "player" && unit.y < 470)
    .sort((a, b) => a.y - b.y)[0];
  return nearBase ? nearBase.lane : -1;
}

function shouldBotBankEnergy(pressure, defenseLane, attackLane, affordableUnits, config) {
  if (!config.smart || state.enemyEnergy >= 7.6 || pressure[defenseLane] > 260) return false;
  const cards = getEnemyCards();
  const hasFrontline = cards.some((card) => ["tank", "swordsman"].includes(card.id));
  const hasSupport = cards.some((card) => ["ranger", "mage", "priest", "catgirl", "necromancer"].includes(card.id));
  const hasSiegeChance = pressure[attackLane] < -180 && cards.some((card) => card.id === "catapult");
  if ((!hasFrontline || !hasSupport) && !hasSiegeChance) return false;
  const cheapSpam = affordableUnits.some((card) => card.cost <= 3);
  if (config.strict && cheapSpam && state.enemyEnergy < 6.5 && pressure[defenseLane] < 170) return true;
  return cheapSpam && Math.random() < config.comboChance;
}

function shouldBotUseCatapult(pressure, attackLane, config) {
  const activeCatapults = state.units.filter((unit) => unit.team === "enemy" && unit.role === "catapult").length;
  if (activeCatapults >= 1) return false;
  const strongestPlayerLane = Math.max(...pressure);
  if (strongestPlayerLane > (config.strict ? 180 : 260)) return false;
  const bossFinal = state.activeCampaignId === "king";
  if (pressure[attackLane] > (bossFinal ? -40 : -120)) return false;
  const escort = state.units.some((unit) => unit.team === "enemy" && unit.lane === attackLane && ["tank", "swordsman", "skeleton", "ranger"].includes(unit.role));
  return escort || state.enemyEnergy >= (bossFinal ? 7 : config.strict ? 8.5 : 9.5);
}

function chooseBotUnit(units, pressure, defenseLane, attackLane, config) {
  const enemyOnDefense = state.units.filter((unit) => unit.team === "enemy" && unit.lane === defenseLane);
  const hasFront = enemyOnDefense.some((unit) => unit.role === "tank" || unit.role === "swordsman" || unit.role === "skeleton");
  const enemyOnAttack = state.units.filter((unit) => unit.team === "enemy" && unit.lane === attackLane);
  const playerBackline = state.units.some((unit) => unit.team === "player" && unit.lane === defenseLane && ["ranger", "mage", "priest", "catgirl", "necromancer"].includes(unit.role));
  const playerHeavy = state.units.some((unit) => unit.team === "player" && unit.lane === defenseLane && ["tank", "catapult", "dragon"].includes(unit.role));
  const alliedCatapultLane = lanes.findIndex((_, lane) => state.units.some((unit) => unit.team === "enemy" && unit.lane === lane && unit.role === "catapult"));
  if (state.botStyle === "defensive" && pressure[defenseLane] > 120) return units.find((item) => ["tank", "swordsman", "priest"].includes(item.id));
  if (state.botStyle === "aggressive" && pressure[attackLane] < -120) return units.find((item) => ["assassin", "ranger", "mage", "catapult"].includes(item.id));
  if (alliedCatapultLane >= 0) {
    const catapultProtected = state.units.some((unit) => unit.team === "enemy" && unit.lane === alliedCatapultLane && unit.role !== "catapult" && unit.y < 650);
    if (!catapultProtected) return units.find((item) => ["tank", "swordsman", "ranger"].includes(item.id));
  }
  if (config.elite && playerHeavy && Math.random() < (config.counterChance || 0.5)) return units.find((item) => ["mage", "dragon", "ranger"].includes(item.id));
  if (pressure[defenseLane] > 430) return units.find((item) => item.id === "tank") || units.find((item) => item.id === "swordsman");
  if (playerBackline) return units.find((item) => item.id === "assassin");
  if (pressure[attackLane] < -260 && enemyOnAttack.length >= 1 && shouldBotUseCatapult(pressure, attackLane, config)) return units.find((item) => item.id === "catapult");
  if (config.smart && hasFront) return units.find((item) => (config.elite ? ["mage", "catgirl", "ranger", "priest", "necromancer"] : ["ranger", "catgirl", "priest", "mage"]).includes(item.id));
  if (pressure[defenseLane] > 180) return units.find((item) => item.id === "swordsman") || units.find((item) => item.id === "tank");
  if (config.strict && Math.random() < (config.protectChance || 0.4)) return units.find((item) => ["tank", "swordsman"].includes(item.id));
  return units.find((item) => item.id === "swordsman") || units.find((item) => item.id === "ranger") || units.find((item) => item.id === "necromancer");
}

function chooseBotLane(card, pressure, defenseLane, attackLane, config) {
  if (!card) return defenseLane;
  if (card.id === "catapult") return bestBotSiegeLane(pressure, attackLane);
  if (card.id === "assassin" && config.smart) {
    const backlineLane = lanes.findIndex((_, lane) =>
      state.units.some((unit) => unit.team === "player" && unit.lane === lane && ["ranger", "mage", "priest", "catgirl", "necromancer"].includes(unit.role)),
    );
    if (backlineLane >= 0) return backlineLane;
  }
  if (pressure[defenseLane] > 180) return defenseLane;
  return attackLane;
}

function bestBotSiegeLane(pressure, fallbackLane) {
  const ranked = lanes
    .map((_, lane) => {
      const escortCount = state.units.filter((unit) => unit.team === "enemy" && unit.lane === lane && ["tank", "swordsman", "skeleton", "ranger"].includes(unit.role)).length;
      const hasCatapult = state.units.some((unit) => unit.team === "enemy" && unit.lane === lane && unit.role === "catapult");
      return { lane, score: -pressure[lane] + escortCount * 170 - (hasCatapult ? 999 : 0) };
    })
    .sort((a, b) => b.score - a.score);
  return ranked[0]?.lane ?? fallbackLane;
}

function tryBotFollowUp(opening, lane, pressure, config) {
  if (!config.smart || (!config.strict && Math.random() > config.comboChance)) return;
  const cards = getEnemyCards();
  const units = cards.filter((card) => card.kind === "unit" && card.cost <= state.enemyEnergy);
  const spells = cards.filter((card) => card.kind === "spell" && card.cost <= state.enemyEnergy && spellReady("enemy", card.id));
  let follow = null;
  if (["tank", "swordsman"].includes(opening.id)) {
    follow = units.find((card) => (config.elite ? ["mage", "catgirl", "ranger", "priest", "necromancer"] : ["ranger", "mage", "catgirl", "priest", "necromancer"]).includes(card.id));
  } else if (["ranger", "mage", "priest", "catgirl", "necromancer"].includes(opening.id)) {
    follow = units.find((card) => ["tank", "swordsman"].includes(card.id));
  } else if (opening.id === "assassin") {
    follow = spells.find((card) => card.id === "freeze");
  } else if (opening.id === "catapult") {
    follow = units.find((card) => ["tank", "swordsman", "ranger"].includes(card.id));
  }
  if (!follow && state.units.some((unit) => unit.team === "enemy" && unit.lane === lane && unit.role === "catapult")) {
    follow = units.find((card) => ["tank", "swordsman", "ranger", "priest"].includes(card.id));
  }
  if (!follow && pressure[lane] < -160) follow = spells.find((card) => card.id === "haste");
  if (!follow) return;
  state.enemyEnergy -= follow.cost;
  if (follow.kind === "unit") {
    spawnUnit("enemy", follow, lane);
    return;
  }
  startSpellCooldown("enemy", follow.id);
  const targetTeam = follow.id === "haste" || follow.id === "heal" ? "enemy" : "player";
  castSpell("enemy", follow.id, lane, laneX(lane), targetSpellX(targetTeam, lane));
}

function tryBotSpellFollowUp(opening, lane, pressure, config) {
  if (!config.smart || (!config.strict && Math.random() > config.comboChance) || state.enemyEnergy < 3) return;
  const units = getEnemyCards().filter((card) => card.kind === "unit" && card.cost <= state.enemyEnergy);
  let follow = null;
  if (["fireball", "freeze", "lightning"].includes(opening.id)) {
    follow = units.find((card) => (config.elite ? ["assassin", "dragon", "swordsman", "ranger"] : ["assassin", "swordsman", "ranger"]).includes(card.id));
  }
  if (opening.id === "haste") {
    follow = units.find((card) => ["tank", "swordsman"].includes(card.id));
  }
  if (!follow || pressure[lane] > 520) return;
  state.enemyEnergy -= follow.cost;
  spawnUnit("enemy", follow, lane);
}

function targetSpellX(team, lane) {
  const units = state.units.filter((unit) => unit.team === team && unit.lane === lane);
  if (!units.length) return team === "player" ? H - 330 : 330;
  const total = units.reduce((sum, unit) => sum + unit.y, 0);
  return Math.max(150, Math.min(H - 150, total / units.length));
}

function finish(title, copy) {
  if (state.gameOver) return;
  state.gameOver = true;
  state.shake = 0;
  state.hitStop = 0;
  const campaign = activeCampaignLevel();
  let reward = isEndlessMode() ? endlessCoinReward() : title === "Победа" ? 50 : 10;
  state.coins += reward;
  if (title === "Победа") {
    state.wins += 1;
    addProgressXp(50);
  } else if (title === "Поражение") {
    state.losses += 1;
    addProgressXp(20);
  } else {
    addProgressXp(30);
  }
  unlockCardsForLevel();
  let trophyCopy = "";
  if (state.matchMode === "ranked") {
    const trophyDelta = title === "Победа" ? 10 : title === "Поражение" ? -10 : 0;
    state.trophies = Math.max(0, state.trophies + trophyDelta);
    trophyCopy = trophyDelta === 0 ? " Кубки: без изменений." : ` Кубки: ${trophyDelta > 0 ? "+" : ""}${trophyDelta}. Сейчас: ${state.trophies}.`;
  }
  if (campaign && title === "Победа") {
    const levelIndex = campaignLevels.findIndex((level) => level.id === campaign.id);
    state.campaignProgress = Math.max(state.campaignProgress, levelIndex + 2);
    copy = `${copy} ${campaign.reward}.`;
  }
  if (isEndlessMode()) {
    const seconds = Math.floor(state.endlessElapsed || state.timeLeft || 0);
    const waves = endlessSurvivedWaves();
    copy = `${copy} Ты продержался ${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}. Прожито волн: ${waves}. Уровень осады: ${state.endlessTier + 1}.`;
  }
  copy = `${copy} Награда: +${reward} монет.${trophyCopy}`;
  saveSettings();
  renderWallet();
  renderProgress();
  renderDeckEditor();
  resultTitle.textContent = title;
  resultCopy.textContent = copy;
  resultTitle.style.color = title === "Победа" ? palette.green : title === "Ничья" ? palette.gold : palette.enemy;
  resultPanel.classList.remove("hidden");
  surrenderBtn?.classList.add("hidden");
  sound(title === "Победа" ? "win" : title === "Поражение" ? "lose" : "start");
}

function openLobby() {
  state.started = false;
  state.gameOver = false;
  state.shake = 0;
  state.hitStop = 0;
  state.activeCampaignId = null;
  state.matchMode = "quick";
  state.units = [];
  state.projectiles = [];
  state.towerShots = [];
  state.effects = [];
  state.energy = 4;
  state.enemyEnergy = 4;
  state.playerBase = 1000;
  state.enemyBase = 1000;
  state.playerBaseMax = 1000;
  state.enemyBaseMax = 1000;
  state.timeLeft = 180;
  state.endlessElapsed = 0;
  state.endlessTier = 0;
  state.endlessNextScale = 20;
  resultPanel.classList.add("hidden");
  campaignPanel.classList.add("hidden");
  surrenderBtn?.classList.add("hidden");
  modePanel.classList.remove("hidden");
  renderDeckEditor();
  renderHand();
  sound("tap");
  requestAnimationFrame(loop);
}

function invalidateArenaCache() {
  if (!window.__ironClashStateReady) return;
  state.arenaCache = null;
  state.arenaCacheKey = "";
}

function arenaCacheKey() {
  return `${renderScale()}:${state.selectedLane}:${W}x${H}`;
}

function drawCachedArena() {
  const key = arenaCacheKey();
  if (!state.arenaCache || state.arenaCacheKey !== key) {
    const scale = renderScale();
    const cache = document.createElement("canvas");
    cache.width = Math.max(1, Math.round(W * scale));
    cache.height = Math.max(1, Math.round(H * scale));
    const previousCtx = ctx;
    ctx = cache.getContext("2d");
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    drawArena();
    ctx = previousCtx;
    state.arenaCache = cache;
    state.arenaCacheKey = key;
  }
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.drawImage(state.arenaCache, 0, 0);
  ctx.restore();
}

function draw() {
  applyRenderScale();
  ctx.clearRect(0, 0, W, H);
  ctx.save();
  if (state.shake > 0) {
    const power = state.shake;
    ctx.translate((Math.random() - 0.5) * power, (Math.random() - 0.5) * power);
  }
  drawCachedArena();
  drawLaneHighlights();
  drawBases();
  state.units.sort((a, b) => a.y - b.y || a.x - b.x).forEach(drawUnit);
  state.projectiles.forEach(drawProjectile);
  state.towerShots.forEach(drawTowerShot);
  const visibleEffects = isLowPowerMode() ? state.effects.slice(-10) : state.effects;
  visibleEffects.forEach(drawEffect);
  drawAimingReticle();
  if (!state.started) drawAttract();
  ctx.restore();
  updateUi();
}

function drawArena() {
  if (isLowPowerMode()) {
    ctx.fillStyle = "#62bd48";
  } else {
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, "#2f9860");
    bg.addColorStop(0.18, "#72c947");
    bg.addColorStop(0.5, "#65b943");
    bg.addColorStop(0.82, "#79c957");
    bg.addColorStop(1, "#248b58");
    ctx.fillStyle = bg;
  }
  ctx.fillRect(0, 0, W, H);

  drawBackdropDetails();
  drawGrass();

  const topY = ROAD_TOP_Y;
  const bottomY = ROAD_BOTTOM_Y;
  const roadWidth = 78;
  lanes.forEach((_, lane) => drawRoadPath(laneRoadPoints(lane, "enemy"), roadWidth, lane === 1 ? 0 : 96));

  lanes.forEach((lane, index) => {
    if (index !== state.selectedLane) return;
    ctx.strokeStyle = "rgba(255, 216, 106, 0.5)";
    ctx.lineWidth = 6;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(lane.x, topY + 34);
    ctx.lineTo(lane.x, bottomY - 34);
    ctx.stroke();
  });

  if (!isLowPowerMode()) {
    drawLaneLabels(topY, bottomY);
    drawBanners();
  }
}

function drawRoadPath(points, width, radius = 86) {
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  [["#806326", width + 18], ["#bd8a35", width + 8], ["#f3cb65", width], ["#f8db80", width - 18]].forEach(([color, lineWidth]) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.beginPath();
    drawRoundedPolyline(points, radius);
    ctx.stroke();
  });
  ctx.strokeStyle = "rgba(255, 248, 210, 0.28)";
  ctx.lineWidth = 8;
  ctx.beginPath();
  drawRoundedPolyline(points, radius);
  ctx.stroke();
  ctx.restore();
}

function drawRoundedPolyline(points, radius) {
  if (points.length < 2 || radius <= 0) {
    points.forEach((point, index) => (index ? ctx.lineTo(point.x, point.y) : ctx.moveTo(point.x, point.y)));
    return;
  }
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length - 1; i += 1) {
    const { x: x0, y: y0 } = points[i - 1];
    const { x: x1, y: y1 } = points[i];
    const { x: x2, y: y2 } = points[i + 1];
    const d1 = Math.hypot(x1 - x0, y1 - y0) || 1;
    const d2 = Math.hypot(x2 - x1, y2 - y1) || 1;
    const r = Math.min(radius, d1 * 0.48, d2 * 0.48);
    const beforeX = x1 - ((x1 - x0) / d1) * r;
    const beforeY = y1 - ((y1 - y0) / d1) * r;
    const afterX = x1 + ((x2 - x1) / d2) * r;
    const afterY = y1 + ((y2 - y1) / d2) * r;
    ctx.lineTo(beforeX, beforeY);
    ctx.quadraticCurveTo(x1, y1, afterX, afterY);
  }
  const last = points[points.length - 1];
  ctx.lineTo(last.x, last.y);
}

function drawLaneLabels(topY, bottomY) {
  ctx.save();
  ctx.fillStyle = "rgba(87,56,31,0.42)";
  ctx.font = "900 16px system-ui";
  ctx.textAlign = "center";
  lanes.forEach((lane) => {
    ctx.fillText(lane.name, lane.x, H / 2 + 34);
  });
  ctx.restore();
}

function drawBackdropDetails() {
  ctx.save();
  ctx.globalAlpha = 0.9;
  [
    { x: 84, y: 116, s: 1.15 },
    { x: 180, y: 246, s: 0.82 },
    { x: 78, y: 612, s: 1.05 },
    { x: 184, y: 736, s: 0.76 },
    { x: W - 86, y: 150, s: 1.08 },
    { x: W - 186, y: 280, s: 0.78 },
    { x: W - 70, y: 630, s: 1.2 },
    { x: W - 184, y: 736, s: 0.74 },
  ].forEach((tree) => drawTree(tree.x, tree.y, tree.s));
  [
    { x: 292, y: 180, s: 0.82 },
    { x: 1108, y: 508, s: 0.78 },
    { x: 292, y: 570, s: 0.66 },
    { x: 1100, y: 220, s: 0.66 },
  ].forEach((bush) => drawBush(bush.x, bush.y, bush.s));
  [
    { x: 420, y: 110, r: 20 },
    { x: 980, y: 720, r: 24 },
    { x: 1120, y: 140, r: 15 },
    { x: 300, y: 700, r: 18 },
  ].forEach((stone) => {
    ctx.fillStyle = "#8c9a8f";
    ctx.beginPath();
    ctx.ellipse(stone.x, stone.y, stone.r, stone.r * 0.64, 0.25, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.18)";
    ctx.beginPath();
    ctx.ellipse(stone.x - stone.r * 0.25, stone.y - stone.r * 0.18, stone.r * 0.32, stone.r * 0.16, 0.1, 0, Math.PI * 2);
    ctx.fill();
  });
  [
    { x: 540, y: 162, c: "#ffd36b" },
    { x: 880, y: 110, c: "#fff0bd" },
    { x: 1180, y: 640, c: "#ff8a8a" },
    { x: 250, y: 155, c: "#91e8ff" },
    { x: 650, y: 690, c: "#fff0bd" },
  ].forEach((flower) => {
    ctx.fillStyle = flower.c;
    for (let i = 0; i < 5; i += 1) {
      const angle = (Math.PI * 2 * i) / 5;
      ctx.beginPath();
      ctx.arc(flower.x + Math.cos(angle) * 6, flower.y + Math.sin(angle) * 6, 4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = "#6fb154";
    ctx.beginPath();
    ctx.arc(flower.x, flower.y, 3, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();
}

function drawLightBackdropDetails() {
  ctx.save();
  ctx.globalAlpha = 0.65;
  [
    { x: 84, y: 120, s: 0.78 },
    { x: W - 84, y: 156, s: 0.76 },
    { x: 96, y: 650, s: 0.7 },
    { x: W - 104, y: 660, s: 0.74 },
  ].forEach((tree) => drawBush(tree.x, tree.y, tree.s));
  ctx.fillStyle = "rgba(255, 248, 223, 0.36)";
  for (let i = 0; i < 8; i += 1) {
    const x = (i * 173 + 120) % W;
    const y = (i * 97 + 92) % H;
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawTree(x, y, scale = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.fillStyle = "rgba(40, 88, 40, 0.26)";
  ctx.beginPath();
  ctx.ellipse(0, 48, 58, 20, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#8b5a2b";
  rounded(-14, 34, 28, 42, 10);
  ctx.fill();
  [["#0f7d46", 0, 4, 44], ["#159356", -22, 20, 34], ["#1ca85e", 22, 20, 34], ["#26b86a", 0, -18, 38]].forEach(([color, ox, oy, r]) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(ox, oy, r, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();
}

function drawBush(x, y, scale = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.fillStyle = "rgba(40, 88, 40, 0.18)";
  ctx.beginPath();
  ctx.ellipse(0, 22, 42, 12, 0, 0, Math.PI * 2);
  ctx.fill();
  [["#38b64f", -18, 8, 24], ["#47c85d", 6, 2, 30], ["#2f9d48", 26, 12, 20]].forEach(([color, ox, oy, r]) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(ox, oy, r, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.fillStyle = "#ffe56b";
  ctx.beginPath();
  ctx.arc(8, -8, 4, 0, Math.PI * 2);
  ctx.arc(-12, 2, 3.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawGrass() {
  ctx.save();
  ctx.globalAlpha = 0.32;
  const grassCount = 190;
  for (let i = 0; i < grassCount; i += 1) {
    const x = (i * 97) % W;
    const y = (i * 53) % H;
    ctx.strokeStyle = i % 2 ? "#b7e17d" : "#346f40";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 8, y - 14);
    ctx.lineTo(x + 16, y);
    ctx.stroke();
  }
  ctx.restore();
}

function drawBanners() {
  [
    { x: W / 2 - 210, y: H - 180, color: palette.player, dir: 1 },
    { x: W / 2 + 210, y: 86, color: palette.enemy, dir: -1 },
  ].forEach((flag) => {
    ctx.fillStyle = palette.wood;
    rounded(flag.x - 5, flag.y, 10, 76, 4);
    ctx.fill();
    ctx.fillStyle = flag.color;
    ctx.beginPath();
    ctx.moveTo(flag.x + 4 * flag.dir, flag.y + 6);
    ctx.lineTo(flag.x + 58 * flag.dir, flag.y + 24);
    ctx.lineTo(flag.x + 4 * flag.dir, flag.y + 42);
    ctx.closePath();
    ctx.fill();
  });
}

function drawBases() {
  const player = basePoint("player");
  const enemy = basePoint("enemy");
  base(player.x, player.y, palette.player, state.playerBase, state.playerBaseMax, "ТВОЯ");
  if (hasBase("enemy")) base(enemy.x, enemy.y, palette.enemy, state.enemyBase, state.enemyBaseMax, "ВРАГ");
  else drawEndlessPortal(enemy.x, ROAD_TOP_Y - 12);
}

function drawEndlessPortal(x, y) {
  ctx.save();
  if (isLowPowerMode()) {
    ctx.fillStyle = "rgba(189,131,255,0.45)";
    ctx.beginPath();
    ctx.ellipse(x, y + 8, 82, 30, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#24132e";
    ctx.beginPath();
    ctx.ellipse(x, y, 48, 18, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#ff5c5c";
    ctx.lineWidth = 5;
    ctx.stroke();
    ctx.restore();
    return;
  }
  const time = performance.now() / 1000;
  const pulse = 1 + Math.sin(time * 4) * 0.08;
  ctx.shadowColor = "rgba(189,131,255,0.8)";
  ctx.shadowBlur = isLowPowerMode() ? 0 : 24;
  const outer = ctx.createRadialGradient(x, y, 16, x, y, 96);
  outer.addColorStop(0, "rgba(255,92,92,0.76)");
  outer.addColorStop(0.5, "rgba(189,131,255,0.38)");
  outer.addColorStop(1, "rgba(255,92,92,0)");
  ctx.fillStyle = outer;
  ctx.beginPath();
  ctx.ellipse(x, y + 8, 104 * pulse, 46, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.shadowBlur = 0;
  ctx.fillStyle = "#6e503e";
  rounded(x - 78, y - 40, 156, 80, 30);
  ctx.fill();
  ctx.fillStyle = palette.stone;
  rounded(x - 64, y - 30, 128, 60, 24);
  ctx.fill();

  const grad = ctx.createRadialGradient(x, y, 8, x, y, 54);
  grad.addColorStop(0, "#fff0bd");
  grad.addColorStop(0.28, "#ff5c5c");
  grad.addColorStop(0.72, "#6c39bd");
  grad.addColorStop(1, "#24132e");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.ellipse(x, y, 48, 22, 0, 0, Math.PI * 2);
  ctx.fill();
  for (let i = 0; i < 3; i += 1) {
    const a = time * 2.4 + i * 2.1;
    ctx.strokeStyle = i === 0 ? "#fff0bd" : i === 1 ? "#ff9bd5" : "#bd83ff";
    ctx.lineWidth = 4 - i;
    ctx.beginPath();
    ctx.ellipse(x, y, 18 + i * 12, 8 + i * 5, a, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.fillStyle = "#ff5c5c";
  ctx.font = "900 18px system-ui";
  ctx.textAlign = "center";
  ctx.fillText(`ОСАДА ${state.endlessTier + 1}`, x, y + 60);
  ctx.restore();
}

function drawLaneHighlights() {
  if (!state.started || state.gameOver) return;
  const card = deck.find((item) => item.id === state.selectedCard);
  const lane = state.selectedLane;
  const path = laneRoadPoints(lane, "player");
  ctx.save();
  ctx.globalAlpha = card?.kind === "spell" ? 0.32 : 0.42;
  ctx.strokeStyle = card?.tone || palette.gold;
  ctx.lineWidth = card?.kind === "spell" ? 10 : 16;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.shadowColor = card?.tone || palette.gold;
  ctx.shadowBlur = isLowPowerMode() ? 0 : 16;
  ctx.beginPath();
  path.forEach((point, index) => {
    if (index === 0) ctx.moveTo(point.x, point.y);
    else ctx.lineTo(point.x, point.y);
  });
  ctx.stroke();
  ctx.restore();
}

function base(x, y, color, hp, maxHp, label) {
  ctx.save();
  ctx.shadowColor = "rgba(46, 31, 21, 0.34)";
  ctx.shadowBlur = isLowPowerMode() ? 0 : 18;
  ctx.fillStyle = "rgba(54,34,21,0.22)";
  ctx.beginPath();
  ctx.ellipse(x, y + 82, 86, 24, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  ctx.fillStyle = "#6e503e";
  rounded(x - 70, y - 72, 140, 150, 18);
  ctx.fill();
  ctx.fillStyle = "rgba(255, 248, 223, 0.14)";
  rounded(x - 58, y - 62, 116, 20, 10);
  ctx.fill();
  ctx.fillStyle = "#4b3127";
  rounded(x - 78, y - 34, 26, 100, 10);
  rounded(x + 52, y - 34, 26, 100, 10);
  ctx.fill();
  ctx.fillStyle = palette.stone;
  rounded(x - 54, y - 88, 108, 160, 14);
  ctx.fill();
  const stoneGrad = ctx.createLinearGradient(x - 54, y - 88, x + 54, y + 72);
  stoneGrad.addColorStop(0, "rgba(255,255,255,0.24)");
  stoneGrad.addColorStop(0.52, "rgba(255,255,255,0.03)");
  stoneGrad.addColorStop(1, "rgba(59,37,22,0.18)");
  ctx.fillStyle = stoneGrad;
  rounded(x - 54, y - 88, 108, 160, 14);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.18)";
  for (let row = 0; row < 5; row += 1) {
    for (let col = 0; col < 3; col += 1) {
      ctx.fillRect(x - 40 + col * 30 + (row % 2) * 10, y - 62 + row * 24, 16, 4);
    }
  }
  ctx.fillStyle = "#51605c";
  rounded(x - 62, y - 60, 14, 42, 6);
  rounded(x + 48, y - 60, 14, 42, 6);
  ctx.fill();
  ctx.fillStyle = "#7e8986";
  for (let i = -2; i <= 2; i += 1) {
    ctx.fillRect(x + i * 19 - 6, y - 100, 12, 22);
  }
  ctx.strokeStyle = "#fff0bd";
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x - 42, y - 42);
  ctx.lineTo(x + 42, y - 42);
  ctx.lineTo(x + 50, y + 18);
  ctx.lineTo(x - 50, y + 18);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.22)";
  ctx.beginPath();
  ctx.moveTo(x - 34, y - 34);
  ctx.lineTo(x + 34, y - 34);
  ctx.lineTo(x + 26, y - 18);
  ctx.lineTo(x - 26, y - 18);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#5b3b27";
  rounded(x - 22, y + 16, 44, 54, 18);
  ctx.fill();
  ctx.strokeStyle = "rgba(255,240,189,0.75)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(x, y + 70, 28, Math.PI, 0);
  ctx.stroke();
  ctx.fillStyle = "#fff0bd";
  ctx.fillRect(x - 36, y - 10, 18, 22);
  ctx.fillRect(x + 18, y - 10, 18, 22);

  ctx.fillStyle = "#5b3b27";
  rounded(x - 15, y - 74, 30, 30, 8);
  ctx.fill();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x - 20, y - 74);
  ctx.lineTo(x, y - 100);
  ctx.lineTo(x + 20, y - 74);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#fff0bd";
  ctx.beginPath();
  ctx.arc(x, y - 56, 8, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(255,255,255,0.92)";
  ctx.font = "950 15px system-ui";
  ctx.textAlign = "center";
  ctx.fillText(label, x, y + 96);
  miniBar(x - 52, y - 104, 104, 10, Math.max(0, hp) / Math.max(1, maxHp || 1000), color);
  ctx.restore();
}

function drawUnit(unit) {
  const color = unit.team === "player" ? palette.player : palette.enemy;
  const bodyColor = unit.role === "catgirl" ? "#ff9bd5" : color;
  const leg = Math.sin(unit.walk) * 4;
  const attackPulse = Math.sin(Math.max(0, unit.attackAnim || 0) * Math.PI * 8) * Math.min(1, (unit.attackAnim || 0) * 4);
  const lunge = attackPulse * (unit.role === "catapult" ? -5 : unit.flying ? 9 : 12);
  ctx.save();
  ctx.translate(unit.x, unit.y + unit.dir * lunge + (unit.flying ? -34 + Math.sin(unit.walk * 1.6) * 7 : 0));
  ctx.scale(unit.team === "player" ? 1 : -1, 1);

  ctx.shadowColor = unit.flash > 0 ? palette.gold : "rgba(59,37,22,0.45)";
  ctx.shadowBlur = isLowPowerMode() ? 0 : unit.flash > 0 ? 20 : 8;
  ctx.fillStyle = "rgba(54,34,21,0.24)";
  ctx.beginPath();
  ctx.ellipse(0, unit.size + (unit.flying ? 46 : 14), unit.size * (unit.flying ? 1.7 : 1.2), unit.flying ? 12 : 9, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = unit.team === "player" ? "rgba(68,168,255,0.72)" : "rgba(255,92,92,0.72)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(0, unit.size + (unit.flying ? 46 : 14), unit.size * (unit.flying ? 1.8 : 1.28), unit.flying ? 14 : 11, 0, 0, Math.PI * 2);
  ctx.stroke();

  if (isLowPowerMode()) {
    drawCachedUnitSprite(unit);
    drawUnitStatusOverlays(unit);
    ctx.restore();
    miniBar(unit.x - 28, unit.y - unit.size - 30, 56, 8, unit.hp / unit.maxHp, unit.team === "player" ? palette.green : palette.enemy);
    return;
  }

  if (unit.role === "dragon") {
    drawDragonBody(unit, attackPulse);
  } else if (unit.role === "catapult") {
    drawCatapultBody(unit);
  } else if (unit.role === "skeleton") {
    drawSkeletonBody(unit, leg);
  } else {
    const bodyWidth = unit.role === "catgirl" ? unit.size * 1.45 : unit.size * 2;
    const bodyX = -bodyWidth / 2;
    if (isLowPowerMode()) {
      ctx.fillStyle = unit.freeze > 0 ? palette.ice : bodyColor;
    } else {
      const bodyGrad = ctx.createLinearGradient(-unit.size, -unit.size, unit.size, unit.size);
      bodyGrad.addColorStop(0, unit.freeze > 0 ? "#d9fbff" : "#fff0bd");
      bodyGrad.addColorStop(0.18, unit.freeze > 0 ? palette.ice : bodyColor);
      bodyGrad.addColorStop(1, shadeColor(unit.freeze > 0 ? palette.ice : bodyColor, -28));
      ctx.fillStyle = bodyGrad;
    }
    rounded(bodyX, -unit.size * 0.75, bodyWidth, unit.size * 1.65, 12);
    ctx.fill();
    ctx.strokeStyle = "rgba(54,34,21,0.35)";
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.shadowBlur = 0;
    if (isLowPowerMode()) {
      ctx.fillStyle = "#f0b879";
    } else {
      const skin = ctx.createRadialGradient(-4, -unit.size * 1.08, 2, 0, -unit.size, unit.size * 0.7);
      skin.addColorStop(0, "#fff0bd");
      skin.addColorStop(1, "#f0b879");
      ctx.fillStyle = skin;
    }
    ctx.beginPath();
    ctx.arc(0, -unit.size * 0.98, unit.size * 0.55, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#39261a";
    ctx.beginPath();
    ctx.arc(-unit.size * 0.18, -unit.size * 1.02, 2, 0, Math.PI * 2);
    ctx.arc(unit.size * 0.2, -unit.size * 1.02, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = unit.role === "catgirl" ? "#3f2d50" : unit.team === "player" ? "#cdeeff" : "#ffd1c5";
    rounded(-unit.size * 0.34, -unit.size * 0.2, unit.size * 0.68, unit.size * 0.42, 6);
    ctx.fill();

    ctx.fillStyle = "#4b301d";
    ctx.fillRect(-unit.size * 0.62, unit.size * 0.9, unit.size * 0.42, 12 + leg);
    ctx.fillRect(unit.size * 0.2, unit.size * 0.9, unit.size * 0.42, 12 - leg);
  }

  drawHeadgear(unit);
  drawWeapon(unit);

  if (unit.haste > 0) {
    ctx.strokeStyle = palette.gold;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, 0, unit.size + 10, 0, Math.PI * 2);
    ctx.stroke();
  }
  if (unit.slow > 0) {
    ctx.strokeStyle = palette.ice;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, unit.size * 0.2, unit.size + 8, 0, Math.PI * 2);
    ctx.stroke();
  }
  if (unit.shield > 0) {
    ctx.strokeStyle = "rgba(255,248,223,0.86)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, -2, unit.size + 15, 0, Math.PI * 2);
    ctx.stroke();
  }
  if (hasCatgirlAura(unit) || unit.role === "catgirl") {
    ctx.strokeStyle = "#ff9bd5";
    ctx.lineWidth = unit.role === "catgirl" ? 4 : 2;
    ctx.beginPath();
    ctx.arc(0, unit.size * 0.2, unit.size + (unit.role === "catgirl" ? 18 : 11), 0, Math.PI * 2);
    ctx.stroke();
  }
  if (unit.stun > 0) {
    ctx.fillStyle = "#ff9bd5";
    for (let i = 0; i < 3; i += 1) {
      const a = unit.walk * 0.5 + i * 2.1;
      ctx.beginPath();
      ctx.arc(Math.cos(a) * (unit.size + 12), -unit.size * 1.55 + Math.sin(a) * 5, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  if (unit.burn > 0) {
    ctx.fillStyle = "#ff774d";
    ctx.beginPath();
    ctx.arc(unit.size * 0.52, -unit.size * 1.35, 5 + Math.sin(unit.walk) * 2, 0, Math.PI * 2);
    ctx.fill();
  }
  if (unit.regen > 0) {
    ctx.strokeStyle = palette.green;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, -unit.size * 0.4, unit.size + 12 + Math.sin(unit.walk) * 2, 0, Math.PI * 2);
    ctx.stroke();
  }
  if (unit.freeze > 0) {
    ctx.strokeStyle = palette.ice;
    ctx.lineWidth = 4;
    ctx.strokeRect(-unit.size - 5, -unit.size - 12, unit.size * 2 + 10, unit.size * 2 + 18);
  }

  ctx.restore();
  miniBar(unit.x - 28, unit.y - unit.size - 30, 56, 8, unit.hp / unit.maxHp, unit.team === "player" ? palette.green : palette.enemy);
}

function drawCatapultBody(unit) {
  const recoil = Math.sin((unit.shootAnim || 0) * Math.PI * 5) * Math.min(1, (unit.shootAnim || 0) * 2);
  const armAngle = -0.58 - recoil * 0.55;
  ctx.shadowBlur = 0;
  const wood = ctx.createLinearGradient(-unit.size, -unit.size, unit.size, unit.size);
  wood.addColorStop(0, "#b5793e");
  wood.addColorStop(1, "#5b3b27");
  ctx.fillStyle = wood;
  rounded(-unit.size * 1.2, -unit.size * 0.35, unit.size * 2.4, unit.size * 1.1, 8);
  ctx.fill();
  ctx.strokeStyle = "#3a2418";
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.strokeStyle = "#3a2418";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(-unit.size * 0.9, unit.size * 0.65);
  ctx.lineTo(0, -unit.size * 0.55);
  ctx.lineTo(unit.size * 0.9, unit.size * 0.65);
  ctx.stroke();
  ctx.strokeStyle = "#5b3b27";
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(-unit.size * 0.1, -unit.size * 0.55);
  ctx.lineTo(unit.size * 1.45 * Math.cos(armAngle), -unit.size * 0.55 + unit.size * 1.45 * Math.sin(armAngle));
  ctx.stroke();
  ctx.fillStyle = "#2f241c";
  ctx.beginPath();
  ctx.arc(-unit.size * 0.78, unit.size * 0.82, 9, 0, Math.PI * 2);
  ctx.arc(unit.size * 0.78, unit.size * 0.82, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#8c9a8f";
  ctx.beginPath();
  ctx.arc(unit.size * 1.45 * Math.cos(armAngle), -unit.size * 0.55 + unit.size * 1.45 * Math.sin(armAngle), 10, 0, Math.PI * 2);
  ctx.fill();
}

function drawSkeletonBody(unit, leg) {
  ctx.shadowBlur = 0;
  ctx.strokeStyle = "#edf0df";
  ctx.fillStyle = "#edf0df";
  ctx.lineWidth = 4;
  ctx.lineCap = "round";

  ctx.beginPath();
  ctx.arc(0, -unit.size * 1.08, unit.size * 0.58, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#2f241c";
  ctx.beginPath();
  ctx.arc(-5, -unit.size * 1.12, 2.5, 0, Math.PI * 2);
  ctx.arc(5, -unit.size * 1.12, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(-3, -unit.size * 0.98, 6, 2);

  ctx.strokeStyle = "#edf0df";
  ctx.beginPath();
  ctx.moveTo(0, -unit.size * 0.55);
  ctx.lineTo(0, unit.size * 0.72);
  ctx.moveTo(-unit.size * 0.72, -unit.size * 0.28);
  ctx.lineTo(unit.size * 0.72, -unit.size * 0.28);
  ctx.moveTo(-unit.size * 0.52, 0);
  ctx.lineTo(unit.size * 0.52, 0);
  ctx.moveTo(-unit.size * 0.62, -unit.size * 0.22);
  ctx.lineTo(-unit.size * 0.95, unit.size * 0.38);
  ctx.moveTo(unit.size * 0.62, -unit.size * 0.22);
  ctx.lineTo(unit.size * 1.05, -unit.size * 0.78);
  ctx.moveTo(-unit.size * 0.22, unit.size * 0.72);
  ctx.lineTo(-unit.size * 0.48, unit.size * 1.38 + leg);
  ctx.moveTo(unit.size * 0.22, unit.size * 0.72);
  ctx.lineTo(unit.size * 0.55, unit.size * 1.38 - leg);
  ctx.stroke();
}

function drawDragonBody(unit, attackPulse) {
  const wing = Math.sin(unit.walk * 1.8) * 9 + attackPulse * 7;
  ctx.shadowBlur = 0;
  const dragonGrad = ctx.createLinearGradient(-unit.size, -unit.size, unit.size * 1.2, unit.size);
  dragonGrad.addColorStop(0, unit.freeze > 0 ? "#d9fbff" : "#ff9f43");
  dragonGrad.addColorStop(0.45, unit.freeze > 0 ? palette.ice : "#d94b3f");
  dragonGrad.addColorStop(1, "#7f2530");
  ctx.fillStyle = dragonGrad;
  ctx.beginPath();
  ctx.ellipse(0, 0, unit.size * 1.25, unit.size * 0.7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#7f2530";
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.fillStyle = "#a82f36";
  ctx.beginPath();
  ctx.moveTo(-unit.size * 0.2, -6);
  ctx.lineTo(-unit.size * 1.45, -34 - wing);
  ctx.lineTo(-unit.size * 1.22, 18);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(unit.size * 0.15, -6);
  ctx.lineTo(unit.size * 1.3, -32 + wing * 0.35);
  ctx.lineTo(unit.size * 1.1, 18);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#ff7a47";
  ctx.beginPath();
  ctx.ellipse(unit.size * 0.96, -12, unit.size * 0.52, unit.size * 0.42, 0.15, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#fff0bd";
  ctx.beginPath();
  ctx.arc(unit.size * 1.1, -18, 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#7f2530";
  ctx.lineWidth = 7;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-unit.size * 0.95, 4);
  ctx.lineTo(-unit.size * 1.62, 16 + Math.sin(unit.walk) * 6);
  ctx.stroke();

  if (attackPulse > 0.2) {
    ctx.fillStyle = "#ffd36b";
    ctx.beginPath();
    ctx.moveTo(unit.size * 1.42, -14);
    ctx.lineTo(unit.size * (1.9 + attackPulse), -28);
    ctx.lineTo(unit.size * (1.72 + attackPulse), -2);
    ctx.closePath();
    ctx.fill();
  }
}

function drawHeadgear(unit) {
  if (unit.role === "dragon") return;
  if (unit.role === "tank") {
    ctx.fillStyle = "#d8e0d8";
    rounded(-unit.size * 0.6, -unit.size * 1.42, unit.size * 1.2, unit.size * 0.42, 8);
    ctx.fill();
    ctx.fillStyle = "#68726f";
    ctx.fillRect(-unit.size * 0.5, -unit.size * 1.22, unit.size, 5);
  }
  if (unit.role === "ranger") {
    ctx.fillStyle = "#6fb154";
    ctx.beginPath();
    ctx.moveTo(-unit.size * 0.8, -unit.size * 1.12);
    ctx.lineTo(unit.size * 0.6, -unit.size * 1.5);
    ctx.lineTo(unit.size * 0.85, -unit.size * 0.98);
    ctx.closePath();
    ctx.fill();
  }
  if (unit.role === "assassin") {
    ctx.fillStyle = "#3f2d50";
    rounded(-unit.size * 0.72, -unit.size * 1.35, unit.size * 1.44, unit.size * 0.52, 8);
    ctx.fill();
  }
  if (unit.role === "mage") {
    ctx.fillStyle = palette.violet;
    ctx.beginPath();
    ctx.moveTo(0, -unit.size * 1.82);
    ctx.lineTo(unit.size * 0.78, -unit.size * 0.98);
    ctx.lineTo(-unit.size * 0.78, -unit.size * 0.98);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = palette.gold;
    ctx.beginPath();
    ctx.arc(0, -unit.size * 1.37, 4, 0, Math.PI * 2);
    ctx.fill();
  }
  if (unit.role === "necromancer") {
    ctx.fillStyle = "#26203a";
    ctx.beginPath();
    ctx.moveTo(0, -unit.size * 1.75);
    ctx.lineTo(unit.size * 0.85, -unit.size * 0.9);
    ctx.lineTo(-unit.size * 0.85, -unit.size * 0.9);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#8ef2c3";
    ctx.beginPath();
    ctx.arc(0, -unit.size * 1.28, 4, 0, Math.PI * 2);
    ctx.fill();
  }
  if (unit.role === "priest") {
    ctx.fillStyle = "#fff0bd";
    rounded(-unit.size * 0.68, -unit.size * 1.36, unit.size * 1.36, unit.size * 0.48, 9);
    ctx.fill();
    ctx.strokeStyle = palette.gold;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, -unit.size * 1.44, unit.size * 0.58, 0, Math.PI * 2);
    ctx.stroke();
  }
  if (unit.role === "catgirl") {
    ctx.fillStyle = "#3f2d50";
    ctx.beginPath();
    ctx.moveTo(-unit.size * 0.62, -unit.size * 1.18);
    ctx.lineTo(-unit.size * 0.22, -unit.size * 1.75);
    ctx.lineTo(unit.size * 0.08, -unit.size * 1.14);
    ctx.moveTo(unit.size * 0.62, -unit.size * 1.18);
    ctx.lineTo(unit.size * 0.22, -unit.size * 1.75);
    ctx.lineTo(-unit.size * 0.08, -unit.size * 1.14);
    ctx.fill();
    ctx.fillStyle = "#ff9bd5";
    ctx.beginPath();
    ctx.arc(0, -unit.size * 1.34, 5, 0, Math.PI * 2);
    ctx.fill();
  }
  if (unit.role === "catapult") {
    return;
  }
  if (unit.role === "skeleton") {
    return;
  }
}

function drawWeapon(unit) {
  if (unit.role === "dragon") return;
  const swing = Math.sin(Math.max(0, unit.attackAnim || 0) * Math.PI * 8) * Math.min(1, (unit.attackAnim || 0) * 4);
  ctx.save();
  ctx.translate(unit.size * 0.38 * swing, -unit.size * 0.18 * Math.abs(swing));
  ctx.rotate(-0.22 * swing);
  if (unit.role === "tank") {
    ctx.fillStyle = "#d8e0d8";
    rounded(-unit.size - 17, -10, 17, 38, 6);
    ctx.fill();
    ctx.strokeStyle = "#68726f";
    ctx.lineWidth = 3;
    ctx.stroke();
  }
  if (unit.role === "swordsman" || unit.role === "assassin") {
    ctx.strokeStyle = unit.role === "assassin" ? "#e7d7ff" : "#fff0bd";
    ctx.lineWidth = unit.role === "assassin" ? 4 : 5;
    ctx.beginPath();
    ctx.moveTo(unit.size * 0.55, -4);
    ctx.lineTo(unit.size * 1.35, -28);
    ctx.stroke();
  }
  if (unit.role === "ranger") {
    ctx.strokeStyle = "#5f3a22";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(unit.size * 0.7, -2, 16, -1.1, 1.1);
    ctx.stroke();
  }
  if (unit.role === "mage") {
    ctx.fillStyle = palette.violet;
    ctx.beginPath();
    ctx.arc(unit.size * 0.98, -20, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#5f3a22";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(unit.size * 0.7, -12);
    ctx.lineTo(unit.size * 0.95, 24);
    ctx.stroke();
  }
  if (unit.role === "necromancer") {
    ctx.strokeStyle = "#8ef2c3";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(unit.size * 0.72, -12);
    ctx.lineTo(unit.size * 0.98, 24);
    ctx.stroke();
    ctx.fillStyle = "#8ef2c3";
    ctx.beginPath();
    ctx.arc(unit.size * 0.72, -15, 7, 0, Math.PI * 2);
    ctx.fill();
  }
  if (unit.role === "catgirl") {
    ctx.strokeStyle = "#19151f";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(unit.size * 0.78, -8, 15, -1.4, 1.2);
    ctx.stroke();
    ctx.fillStyle = "#ffd36b";
    ctx.beginPath();
    ctx.arc(unit.size * 0.96, -20, 5, 0, Math.PI * 2);
    ctx.fill();
  }
  if (unit.role === "priest") {
    ctx.strokeStyle = "#fff8df";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(unit.size * 0.72, -12);
    ctx.lineTo(unit.size * 0.92, 24);
    ctx.stroke();
    ctx.fillStyle = palette.gold;
    ctx.beginPath();
    ctx.arc(unit.size * 0.72, -15, 7, 0, Math.PI * 2);
    ctx.fill();
  }
  if (unit.role === "catapult") {
    ctx.restore();
    return;
  }
  if (unit.role === "skeleton") {
    ctx.strokeStyle = "#d8e0d8";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(unit.size * 0.5, -2);
    ctx.lineTo(unit.size * 1.18, -18);
    ctx.stroke();
  }
  ctx.restore();
}

function drawProjectile(projectile) {
  ctx.save();
  if (projectile.siege) {
    const progress = Math.max(0, Math.min(1, 1 - projectile.life / (projectile.maxLife || 1.55)));
    const prevProgress = Math.max(0, progress - 0.06);
    const tailX = projectile.startX + (projectile.tx - projectile.startX) * prevProgress;
    const tailY = projectile.startY + (projectile.ty - projectile.startY) * prevProgress - Math.sin(prevProgress * Math.PI) * 150;
    ctx.strokeStyle = "rgba(255, 240, 189, 0.55)";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(tailX, tailY);
    ctx.lineTo(projectile.x, projectile.y);
    ctx.stroke();
  }
  ctx.fillStyle = projectile.color;
  ctx.shadowColor = projectile.color;
  ctx.shadowBlur = isLowPowerMode() ? 0 : 16;
  ctx.beginPath();
  ctx.arc(projectile.x, projectile.y, projectile.siege ? 13 : projectile.splash ? 9 : 6, 0, Math.PI * 2);
  ctx.fill();
  if (projectile.siege) {
    ctx.strokeStyle = "#fff0bd";
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  ctx.restore();
}

function drawTowerShot(shot) {
  ctx.save();
  ctx.strokeStyle = "rgba(255, 240, 189, 0.55)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(shot.x, shot.y + (shot.team === "player" ? 22 : -22));
  ctx.lineTo(shot.x, shot.y);
  ctx.stroke();
  ctx.fillStyle = shot.color;
  ctx.shadowColor = shot.color;
  ctx.shadowBlur = isLowPowerMode() ? 0 : 18;
  ctx.beginPath();
  ctx.arc(shot.x, shot.y, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawEffect(effect) {
  const t = effect.life / effect.maxLife;
  ctx.save();
  ctx.globalAlpha = Math.max(0, t);
  if (effect.type === "burst" || effect.type === "ripple") {
    ctx.fillStyle = `${effect.color}20`;
    ctx.beginPath();
    ctx.arc(effect.x, effect.y, effect.radius * (1.08 - t), 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = effect.color;
    ctx.lineWidth = effect.type === "burst" ? 8 : 4;
    ctx.beginPath();
    ctx.arc(effect.x, effect.y, effect.radius * (1.08 - t), 0, Math.PI * 2);
    ctx.stroke();
    if (effect.type === "burst") {
      ctx.strokeStyle = "#fff8df";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(effect.x, effect.y, effect.radius * (0.44 + (1 - t) * 0.36), 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  if (effect.type === "spark") {
    ctx.fillStyle = palette.gold;
    for (let i = 0; i < effect.count; i += 1) {
      const angle = effect.seed + (Math.PI * 2 * i) / effect.count;
      const d = (1 - t) * 46;
      ctx.beginPath();
      ctx.arc(effect.x + Math.cos(angle) * d, effect.y + Math.sin(angle) * d, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  if (effect.type === "hit") {
    ctx.fillStyle = effect.color;
    ctx.shadowColor = effect.color;
    ctx.shadowBlur = isLowPowerMode() ? 0 : 16;
    ctx.beginPath();
    ctx.arc(effect.x, effect.y, effect.radius * t, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#fff8df";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(effect.x, effect.y, effect.radius * (1.15 - t), 0, Math.PI * 2);
    ctx.stroke();
  }
  if (effect.type === "death") {
    ctx.fillStyle = "rgba(73, 49, 35, 0.55)";
    ctx.beginPath();
    ctx.arc(effect.x, effect.y, 30 * (1.08 - t), 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = effect.color;
    for (let i = 0; i < effect.count; i += 1) {
      const angle = effect.seed + (Math.PI * 2 * i) / effect.count;
      const d = (1 - t) * 54;
      ctx.beginPath();
      ctx.arc(effect.x + Math.cos(angle) * d, effect.y + Math.sin(angle) * d - (1 - t) * 14, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  if (effect.type === "ember") {
    ctx.strokeStyle = "rgba(255, 119, 77, 0.5)";
    ctx.lineWidth = 2;
    ctx.fillStyle = "#ffb25d";
    for (let i = 0; i < effect.count; i += 1) {
      const angle = effect.seed + (Math.PI * 2 * i) / effect.count;
      const d = (1 - t) * 76;
      ctx.beginPath();
      ctx.moveTo(effect.x, effect.y);
      ctx.lineTo(effect.x + Math.cos(angle) * d, effect.y + Math.sin(angle) * d - (1 - t) * 34);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(effect.x + Math.cos(angle) * d, effect.y + Math.sin(angle) * d - (1 - t) * 34, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  if (effect.type === "frost") {
    ctx.strokeStyle = palette.ice;
    ctx.lineWidth = 3;
    for (let i = 0; i < effect.count; i += 1) {
      const angle = effect.seed + (Math.PI * 2 * i) / effect.count;
      const d = (1 - t) * 66;
      const x = effect.x + Math.cos(angle) * d;
      const y = effect.y + Math.sin(angle) * d;
      ctx.beginPath();
      ctx.moveTo(x - 6, y);
      ctx.lineTo(x + 6, y);
      ctx.moveTo(x, y - 6);
      ctx.lineTo(x, y + 6);
      ctx.stroke();
    }
  }
  if (effect.type === "soul") {
    ctx.strokeStyle = "#8ef2c3";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(effect.x, effect.y, 28 * (1.1 - t), 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = effect.color;
    ctx.beginPath();
    ctx.arc(effect.x, effect.y - (1 - t) * 44, 8, 0, Math.PI * 2);
    ctx.fill();
  }
  if (effect.type === "aura") {
    ctx.strokeStyle = effect.color;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(effect.x, effect.y, effect.radius * (1.05 - t * 0.25), 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = "rgba(255,248,223,0.7)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(effect.x, effect.y, effect.radius * 0.62, 0, Math.PI * 2);
    ctx.stroke();
  }
  if (effect.type === "charm") {
    ctx.fillStyle = effect.color;
    ctx.shadowColor = effect.color;
    ctx.shadowBlur = isLowPowerMode() ? 0 : 12;
    const s = 16 * (1.05 - t * 0.2);
    ctx.beginPath();
    ctx.moveTo(effect.x, effect.y - s * 0.25 - (1 - t) * 28);
    ctx.bezierCurveTo(effect.x - s, effect.y - s - (1 - t) * 28, effect.x - s * 1.2, effect.y + s * 0.45 - (1 - t) * 28, effect.x, effect.y + s - (1 - t) * 28);
    ctx.bezierCurveTo(effect.x + s * 1.2, effect.y + s * 0.45 - (1 - t) * 28, effect.x + s, effect.y - s - (1 - t) * 28, effect.x, effect.y - s * 0.25 - (1 - t) * 28);
    ctx.fill();
  }
  if (effect.type === "beam") {
    ctx.strokeStyle = effect.color;
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.moveTo(effect.x1, effect.y1);
    ctx.lineTo(effect.x2, effect.y2);
    ctx.stroke();
    ctx.strokeStyle = "#fff8df";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(effect.x1, effect.y1);
    ctx.lineTo(effect.x2, effect.y2);
    ctx.stroke();
    ctx.fillStyle = effect.color;
    ctx.beginPath();
    ctx.arc(effect.x2, effect.y2, 12 * (1.1 - t), 0, Math.PI * 2);
    ctx.fill();
  }
  if (effect.type === "slash") {
    ctx.strokeStyle = effect.color;
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.arc(effect.x, effect.y, 36 * (1.1 - t), -0.8, 0.8);
    ctx.stroke();
  }
  if (effect.type === "bolt") {
    ctx.shadowColor = "#f8f1dd";
    ctx.shadowBlur = isLowPowerMode() ? 0 : 18;
    ctx.strokeStyle = "#f8f1dd";
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(effect.x - 18, effect.y - 110);
    ctx.lineTo(effect.x + 18, effect.y - 36);
    ctx.lineTo(effect.x - 6, effect.y - 30);
    ctx.lineTo(effect.x + 22, effect.y + 66);
    ctx.stroke();
    ctx.strokeStyle = "#79d7ff";
    ctx.lineWidth = 3;
    ctx.stroke();
  }
  ctx.restore();
}

function drawAimingReticle() {
  if (!state.started || state.gameOver) return;
  const card = deck.find((item) => item.id === state.selectedCard);
  if (!card || card.kind !== "spell") return;
  const radius = spellRadius(card.id);
  ctx.save();
  ctx.globalAlpha = 0.78;
  ctx.fillStyle = `${card.tone}2b`;
  ctx.strokeStyle = card.tone;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(state.aimX, state.aimY, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = "#fff8df";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(state.aimX - 16, state.aimY);
  ctx.lineTo(state.aimX + 16, state.aimY);
  ctx.moveTo(state.aimX, state.aimY - 16);
  ctx.lineTo(state.aimX, state.aimY + 16);
  ctx.stroke();
  ctx.restore();
}

function spellRadius(spell) {
  if (spell === "fireball") return 160;
  if (spell === "freeze") return 190;
  if (spell === "heal") return 205;
  if (spell === "repair") return 70;
  if (spell === "haste") return 190;
  return 54;
}

function drawAttract() {
  lanes.forEach((lane, index) => {
    const card = deck[index + 1];
    drawPreviewUnit(lane.x, H - 300 - index * 28, "player", card.stats.role, card.stats.size);
    drawPreviewUnit(lane.x, 300 + index * 28, "enemy", deck[index + 2].stats.role, deck[index + 2].stats.size);
  });
}

function drawPreviewUnit(x, y, team, role, size) {
  drawUnit({
    team,
    x,
    y,
    hp: 1,
    maxHp: 1,
    size,
    role,
    flash: 0,
    freeze: 0,
    haste: 0,
    slow: 0,
    burn: 0,
    regen: 0,
    regenRate: 0,
    stun: 0,
    shield: 0,
    summonCooldown: 0,
    shootAnim: 0,
    attackAnim: 0,
    flying: role === "dragon",
    lane: 1,
    dir: team === "player" ? -1 : 1,
    walk: 0,
  });
}

function drawCachedUnitSprite(unit) {
  const sprite = getUnitSprite(unit);
  ctx.drawImage(sprite.canvas, -sprite.anchorX, -sprite.anchorY, sprite.width, sprite.height);
}

function getUnitSprite(unit) {
  const key = `${unit.team}:${unit.role}:${Math.round(unit.size)}:${unit.freeze > 0 ? "ice" : "normal"}`;
  const cached = unitSpriteCache.get(key);
  if (cached) return cached;
  const size = unit.size;
  const width = Math.ceil(size * 5.6);
  const height = Math.ceil(size * 5.8);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const g = canvas.getContext("2d");
  const ox = width / 2;
  const oy = height / 2 + size * 0.35;
  const teamColor = unit.team === "player" ? palette.player : palette.enemy;
  const bodyColor = unit.role === "catgirl" ? "#ff9bd5" : unit.freeze > 0 ? palette.ice : teamColor;
  g.translate(ox, oy);
  g.lineJoin = "round";
  g.lineCap = "round";
  drawUnitSpriteShape(g, unit.role, size, bodyColor, unit.team, unit.freeze > 0);
  const sprite = { canvas, width, height, anchorX: ox, anchorY: oy };
  unitSpriteCache.set(key, sprite);
  return sprite;
}

function drawUnitSpriteShape(g, role, size, bodyColor, team, frozen) {
  const dark = "#39261a";
  const skin = "#f0b879";
  const stroke = "rgba(54,34,21,0.45)";
  if (role === "dragon") {
    g.fillStyle = frozen ? palette.ice : "#d94b3f";
    g.beginPath();
    g.ellipse(0, 0, size * 1.35, size * 0.72, 0, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = "#7f2530";
    g.lineWidth = 3;
    g.stroke();
    g.fillStyle = frozen ? "#d9fbff" : "#ff9f43";
    g.beginPath();
    g.moveTo(-size * 0.35, -size * 0.35);
    g.lineTo(-size * 1.65, -size * 1.2);
    g.lineTo(-size * 1.0, size * 0.05);
    g.closePath();
    g.moveTo(size * 0.35, -size * 0.35);
    g.lineTo(size * 1.65, -size * 1.2);
    g.lineTo(size * 1.0, size * 0.05);
    g.closePath();
    g.fill();
    g.fillStyle = "#fff0bd";
    g.beginPath();
    g.arc(size * 1.18, -size * 0.2, size * 0.42, 0, Math.PI * 2);
    g.fill();
    return;
  }
  if (role === "catapult") {
    g.fillStyle = "#8a5a32";
    spriteRounded(g, -size * 1.25, -size * 0.35, size * 2.5, size * 1.1, 8);
    g.fill();
    g.strokeStyle = "#3a2418";
    g.lineWidth = 5;
    g.beginPath();
    g.moveTo(-size * 0.9, size * 0.65);
    g.lineTo(0, -size * 0.7);
    g.lineTo(size * 1.15, -size * 1.05);
    g.stroke();
    g.fillStyle = "#2f241c";
    g.beginPath();
    g.arc(-size * 0.78, size * 0.82, 9, 0, Math.PI * 2);
    g.arc(size * 0.78, size * 0.82, 9, 0, Math.PI * 2);
    g.fill();
    return;
  }
  if (role === "skeleton") {
    g.strokeStyle = "#edf0df";
    g.fillStyle = "#edf0df";
    g.lineWidth = 4;
    g.beginPath();
    g.arc(0, -size * 1.08, size * 0.52, 0, Math.PI * 2);
    g.fill();
    g.beginPath();
    g.moveTo(0, -size * 0.55);
    g.lineTo(0, size * 0.55);
    g.moveTo(-size * 0.65, -size * 0.1);
    g.lineTo(size * 0.65, -size * 0.1);
    g.moveTo(0, size * 0.52);
    g.lineTo(-size * 0.55, size * 1.08);
    g.moveTo(0, size * 0.52);
    g.lineTo(size * 0.55, size * 1.08);
    g.stroke();
    return;
  }
  const bodyWidth = role === "catgirl" ? size * 1.45 : size * 2;
  g.fillStyle = bodyColor;
  spriteRounded(g, -bodyWidth / 2, -size * 0.75, bodyWidth, size * 1.65, 12);
  g.fill();
  g.strokeStyle = stroke;
  g.lineWidth = 3;
  g.stroke();
  g.fillStyle = skin;
  g.beginPath();
  g.arc(0, -size * 0.98, size * 0.55, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = dark;
  g.beginPath();
  g.arc(-size * 0.18, -size * 1.02, 2.2, 0, Math.PI * 2);
  g.arc(size * 0.2, -size * 1.02, 2.2, 0, Math.PI * 2);
  g.fill();
  if (role === "catgirl") {
    g.fillStyle = "#111111";
    g.beginPath();
    g.moveTo(-size * 0.32, -size * 1.42);
    g.lineTo(-size * 0.72, -size * 1.82);
    g.lineTo(-size * 0.02, -size * 1.56);
    g.moveTo(size * 0.32, -size * 1.42);
    g.lineTo(size * 0.72, -size * 1.82);
    g.lineTo(size * 0.02, -size * 1.56);
    g.fill();
    g.strokeStyle = "#111111";
    g.lineWidth = 5;
    g.beginPath();
    g.moveTo(size * 0.72, size * 0.2);
    g.quadraticCurveTo(size * 1.45, size * 0.35, size * 1.15, size * 1.1);
    g.stroke();
  } else if (role === "mage") {
    g.fillStyle = "#5a3ac8";
    g.beginPath();
    g.moveTo(-size * 0.75, -size * 1.28);
    g.lineTo(0, -size * 2.0);
    g.lineTo(size * 0.75, -size * 1.28);
    g.closePath();
    g.fill();
  } else if (role === "necromancer") {
    g.fillStyle = "#2b1b4b";
    g.beginPath();
    g.moveTo(-size * 0.7, -size * 1.25);
    g.lineTo(0, -size * 1.95);
    g.lineTo(size * 0.7, -size * 1.25);
    g.closePath();
    g.fill();
  } else if (role === "tank") {
    g.fillStyle = "#d8e0d8";
    spriteRounded(g, -size * 0.62, -size * 1.42, size * 1.24, size * 0.44, 8);
    g.fill();
  } else if (role === "priest") {
    g.fillStyle = "#fff0bd";
    g.beginPath();
    g.arc(size * 0.5, -size * 1.28, size * 0.18, 0, Math.PI * 2);
    g.fill();
  }
  g.strokeStyle = role === "ranger" ? "#4b301d" : role === "priest" ? "#fff0bd" : "#f8f1dd";
  g.lineWidth = role === "ranger" ? 4 : 6;
  g.beginPath();
  if (role === "ranger") {
    g.arc(size * 0.92, -size * 0.12, size * 0.58, -1.2, 1.2);
  } else {
    g.moveTo(size * 0.62, -size * 0.25);
    g.lineTo(size * 1.18, -size * 1.05);
  }
  g.stroke();
  g.fillStyle = "#4b301d";
  g.fillRect(-size * 0.62, size * 0.9, size * 0.42, 12);
  g.fillRect(size * 0.2, size * 0.9, size * 0.42, 12);
}

function drawUnitStatusOverlays(unit) {
  if (unit.haste > 0) {
    ctx.strokeStyle = palette.gold;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, 0, unit.size + 10, 0, Math.PI * 2);
    ctx.stroke();
  }
  if (unit.slow > 0) {
    ctx.strokeStyle = palette.ice;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, unit.size * 0.2, unit.size + 8, 0, Math.PI * 2);
    ctx.stroke();
  }
  if (unit.shield > 0) {
    ctx.strokeStyle = "rgba(255,248,223,0.86)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, -2, unit.size + 15, 0, Math.PI * 2);
    ctx.stroke();
  }
  if (hasCatgirlAura(unit) || unit.role === "catgirl") {
    ctx.strokeStyle = "#ff9bd5";
    ctx.lineWidth = unit.role === "catgirl" ? 4 : 2;
    ctx.beginPath();
    ctx.arc(0, unit.size * 0.2, unit.size + (unit.role === "catgirl" ? 18 : 11), 0, Math.PI * 2);
    ctx.stroke();
  }
  if (unit.stun > 0) {
    ctx.fillStyle = "#ff9bd5";
    for (let i = 0; i < 3; i += 1) {
      const a = unit.walk * 0.5 + i * 2.1;
      ctx.beginPath();
      ctx.arc(Math.cos(a) * (unit.size + 12), -unit.size * 1.55 + Math.sin(a) * 5, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  if (unit.burn > 0) {
    ctx.fillStyle = "#ff774d";
    ctx.beginPath();
    ctx.arc(unit.size * 0.52, -unit.size * 1.35, 5 + Math.sin(unit.walk) * 2, 0, Math.PI * 2);
    ctx.fill();
  }
  if (unit.regen > 0) {
    ctx.strokeStyle = palette.green;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, -unit.size * 0.4, unit.size + 12 + Math.sin(unit.walk) * 2, 0, Math.PI * 2);
    ctx.stroke();
  }
  if (unit.freeze > 0) {
    ctx.strokeStyle = palette.ice;
    ctx.lineWidth = 4;
    ctx.strokeRect(-unit.size - 5, -unit.size - 12, unit.size * 2 + 10, unit.size * 2 + 18);
  }
}

function spriteRounded(g, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + width, y, x + width, y + height, r);
  g.arcTo(x + width, y + height, x, y + height, r);
  g.arcTo(x, y + height, x, y, r);
  g.arcTo(x, y, x + width, y, r);
  g.closePath();
}

function miniBar(x, y, width, height, value, color) {
  ctx.fillStyle = "rgba(7,10,18,0.72)";
  rounded(x, y, width, height, height / 2);
  ctx.fill();
  ctx.fillStyle = color;
  rounded(x, y, Math.max(0, width * value), height, height / 2);
  ctx.fill();
}

function rounded(x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

function shadeColor(hex, amount) {
  const clean = hex.replace("#", "");
  const value = parseInt(clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean, 16);
  const r = Math.max(0, Math.min(255, (value >> 16) + amount));
  const g = Math.max(0, Math.min(255, ((value >> 8) & 255) + amount));
  const b = Math.max(0, Math.min(255, (value & 255) + amount));
  return `rgb(${r}, ${g}, ${b})`;
}

function canAddEffect() {
  return !isLowPowerMode() || state.effects.length < 10;
}

function burst(x, y, color, radius) {
  if (!canAddEffect()) return;
  state.effects.push({ type: "burst", x, y, color, radius, life: 0.5, maxLife: 0.5 });
}

function ripple(x, y, color, radius) {
  if (!canAddEffect()) return;
  state.effects.push({ type: "ripple", x, y, color, radius, life: 0.45, maxLife: 0.45 });
}

function sparks(x, y, count) {
  if (!canAddEffect()) return;
  state.effects.push({ type: "spark", x, y, count: isLowPowerMode() ? Math.min(count, 6) : count, seed: Math.random() * 6, life: 0.34, maxLife: 0.34 });
}

function hitFlash(x, y, color, radius) {
  if (!canAddEffect()) return;
  state.effects.push({ type: "hit", x, y, color, radius, life: 0.22, maxLife: 0.22 });
}

function deathPoof(x, y, color) {
  if (!canAddEffect()) return;
  state.effects.push({ type: "death", x, y, color, count: isLowPowerMode() ? 7 : 12, seed: Math.random() * 6, life: 0.5, maxLife: 0.5 });
}

function screenShake(amount) {
  state.shake = Math.max(state.shake, isLowPowerMode() ? amount * 0.55 : amount);
  state.hitStop = Math.max(state.hitStop, Math.min(0.045, amount / 240));
}

function ember(x, y, count) {
  if (!canAddEffect()) return;
  state.effects.push({ type: "ember", x, y, count: isLowPowerMode() ? Math.min(count, 7) : count, seed: Math.random() * 6, life: 0.7, maxLife: 0.7 });
}

function frost(x, y, count) {
  if (!canAddEffect()) return;
  state.effects.push({ type: "frost", x, y, count: isLowPowerMode() ? Math.min(count, 7) : count, seed: Math.random() * 6, life: 0.62, maxLife: 0.62 });
}

function soul(x, y, color) {
  if (!canAddEffect()) return;
  state.effects.push({ type: "soul", x, y, color, life: 0.62, maxLife: 0.62 });
}

function beam(x1, y1, x2, y2, color) {
  if (!canAddEffect()) return;
  state.effects.push({ type: "beam", x1, y1, x2, y2, color, life: 0.34, maxLife: 0.34 });
}

function auraPulse(x, y, color) {
  if (!canAddEffect()) return;
  state.effects.push({ type: "aura", x, y, color, radius: 135, life: 0.55, maxLife: 0.55 });
}

function charm(x, y) {
  if (!canAddEffect()) return;
  state.effects.push({ type: "charm", x, y, color: "#ff9bd5", life: 0.7, maxLife: 0.7 });
}

function slash(x, y, color) {
  if (!canAddEffect()) return;
  state.effects.push({ type: "slash", x, y, color, life: 0.28, maxLife: 0.28 });
}

function bolt(x, y) {
  if (!canAddEffect()) return;
  state.effects.push({ type: "bolt", x, y, life: 0.34, maxLife: 0.34 });
}

function shakeLine(lane) {
  ripple(laneX(lane), H / 2, "#ff774d", 120);
}

function showToast(text) {
  toastEl.textContent = text;
  toastEl.classList.remove("hidden");
  state.toastTimer = 1.25;
}

function unlockAudio() {
  if (!state.soundOn || state.audio) return;
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;
  state.audio = new AudioContext();
}

function sound(type) {
  if (!state.soundOn) return;
  unlockAudio();
  const audio = state.audio;
  if (!audio) return;
  if (audio.state === "suspended") audio.resume();

  const presets = {
    tap: [[420, 0.04, "sine", 0.035]],
    select: [[520, 0.06, "triangle", 0.045], [720, 0.07, "triangle", 0.035, 0.04]],
    deny: [[150, 0.09, "sawtooth", 0.035], [115, 0.12, "sawtooth", 0.03, 0.06]],
    start: [[330, 0.08, "triangle", 0.05], [500, 0.09, "triangle", 0.045, 0.07], [700, 0.12, "triangle", 0.04, 0.15]],
    summon: [[190, 0.08, "square", 0.035], [310, 0.13, "triangle", 0.04, 0.04]],
    enemy: [[180, 0.06, "sawtooth", 0.025]],
    hit: [[180, 0.045, "sine", 0.018], [95, 0.07, "triangle", 0.012, 0.01]],
    death: [[170, 0.06, "triangle", 0.022], [82, 0.12, "sine", 0.018, 0.04]],
    base: [[82, 0.12, "triangle", 0.026], [120, 0.08, "sine", 0.014, 0.03]],
    tower: [[320, 0.04, "triangle", 0.018], [460, 0.04, "sine", 0.012, 0.03]],
    towerHit: [[145, 0.055, "triangle", 0.016]],
    fireball: [[105, 0.08, "triangle", 0.028], [72, 0.16, "sine", 0.02, 0.04]],
    freeze: [[680, 0.08, "sine", 0.035], [920, 0.12, "sine", 0.026, 0.05]],
    heal: [[520, 0.08, "sine", 0.032], [650, 0.1, "sine", 0.03, 0.07], [820, 0.12, "sine", 0.026, 0.15]],
    lightning: [[760, 0.035, "triangle", 0.024], [160, 0.1, "sine", 0.025, 0.04]],
    repair: [[330, 0.08, "triangle", 0.035], [470, 0.09, "triangle", 0.033, 0.06], [620, 0.12, "sine", 0.028, 0.14]],
    haste: [[430, 0.05, "triangle", 0.035], [610, 0.05, "triangle", 0.033, 0.045], [790, 0.05, "triangle", 0.03, 0.09]],
    win: [[520, 0.09, "triangle", 0.05], [660, 0.09, "triangle", 0.045, 0.08], [880, 0.16, "triangle", 0.04, 0.17]],
    lose: [[240, 0.12, "sine", 0.04], [170, 0.18, "sine", 0.035, 0.1]],
  };

  (presets[type] || presets.tap).forEach(([freq, duration, wave, volume, delay = 0]) => {
    const start = audio.currentTime + delay;
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = wave;
    osc.frequency.setValueAtTime(freq, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    osc.connect(gain);
    gain.connect(audio.destination);
    osc.start(start);
    osc.stop(start + duration + 0.02);
  });
}

function updateUi(force = false) {
  const now = performance.now();
  const interval = isLowPowerMode() ? 140 : 80;
  if (!force && now - (updateUi.lastUpdate || 0) < interval) return;
  updateUi.lastUpdate = now;
  const energy = Math.floor(state.energy);
  energyText.textContent = `${energy} / 10`;
  energyFill.style.width = `${Math.max(0, Math.min(100, state.energy * 10))}%`;
  energyFill.parentElement.classList.toggle("full", state.energy >= 9.8);
  energyFill.parentElement.classList.toggle("low", state.energy < 2.5);
  if (isEndlessMode()) {
    if (enemyBaseLabel) enemyBaseLabel.textContent = "Осада";
    enemyBaseText.textContent = `ур. ${state.endlessTier + 1}`;
    enemyBaseFill.style.width = `${Math.max(0, Math.min(100, ((state.endlessElapsed % 20) / 20) * 100))}%`;
  } else {
    if (enemyBaseLabel) enemyBaseLabel.textContent = "База врага";
    enemyBaseText.textContent = Math.max(0, Math.ceil(state.enemyBase));
    enemyBaseFill.style.width = `${Math.max(0, Math.min(100, (state.enemyBase / Math.max(1, state.enemyBaseMax || 1000)) * 100))}%`;
  }
  playerBaseText.textContent = Math.max(0, Math.ceil(state.playerBase));
  playerBaseFill.style.width = `${Math.max(0, Math.min(100, (state.playerBase / Math.max(1, state.playerBaseMax || 1000)) * 100))}%`;
  const minutes = Math.floor(state.timeLeft / 60);
  const seconds = Math.floor(state.timeLeft % 60).toString().padStart(2, "0");
  timerText.textContent = `${minutes}:${seconds}`;
  [...handEl.children].forEach((button) => {
    const card = deck.find((item) => item.id === button.dataset.card);
    const cooldown = card?.kind === "spell" ? state.playerSpellCooldowns[card.id] || 0 : 0;
    button.classList.toggle("selected", state.selectedCard === card.id);
    button.classList.toggle("cooling", cooldown > 0);
    button.classList.toggle("disabled", !state.started || state.gameOver || card.cost > state.energy || cooldown > 0);
    const badge = button.querySelector(".cooldown-badge");
    if (badge) badge.textContent = cooldown > 0 ? `${Math.ceil(cooldown)} сек` : "";
  });
}

function loop(time) {
  const maxDt = isLowPowerMode() ? 0.12 : 0.04;
  const dt = state.lastTime ? Math.min(maxDt, (time - state.lastTime) / 1000) : 0;
  state.lastTime = time;
  update(dt);
  draw();
  if (!state.gameOver || !state.started) requestAnimationFrame(loop);
}

laneButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const lane = Number(button.dataset.lane);
    setLane(lane);
    const card = deck.find((item) => item.id === state.selectedCard);
    if (state.started && state.selectedCard && card?.kind === "unit") playSelected();
    if (state.started && card?.kind === "spell") showToast("Наведи заклинание кликом по полю");
  });
});

difficultyButtons.forEach((button) => {
  button.addEventListener("click", () => {
    if (state.started) return;
    state.difficulty = button.dataset.difficulty;
    saveSettings();
    renderDifficulty();
    showToast(`Сложность: ${difficultyConfig().label}`);
    sound("select");
  });
});

canvas.addEventListener("pointerdown", (event) => {
  const rect = canvas.getBoundingClientRect();
  const x = ((event.clientX - rect.left) / rect.width) * W;
  const y = ((event.clientY - rect.top) / rect.height) * H;
  const lane = lanes.reduce((best, item, index) => (Math.abs(item.x - x) < Math.abs(lanes[best].x - x) ? index : best), 0);
  setLane(lane);
  state.aimX = laneX(lane);
  state.aimY = Math.max(150, Math.min(H - 150, y));
  const card = deck.find((item) => item.id === state.selectedCard);
  if (state.started && state.selectedCard) {
    if (card?.kind === "spell") playSelected(state.aimX, state.aimY);
    else playSelected();
  }
});

canvas.addEventListener("pointermove", (event) => {
  if (!state.started) return;
  const card = deck.find((item) => item.id === state.selectedCard);
  if (!card || card.kind !== "spell") return;
  const rect = canvas.getBoundingClientRect();
  const x = ((event.clientX - rect.left) / rect.width) * W;
  const y = ((event.clientY - rect.top) / rect.height) * H;
  const lane = lanes.reduce((best, item, index) => (Math.abs(item.x - x) < Math.abs(lanes[best].x - x) ? index : best), 0);
  state.aimX = laneX(lane);
  state.aimY = Math.max(150, Math.min(H - 150, y));
});

trainingBtn.addEventListener("click", () => {
  state.activeCampaignId = null;
  state.matchMode = "ranked";
  showToast(`Рейтинг: ${state.trophies} кубков`);
  resetMatch();
});
quickBtn.addEventListener("click", () => {
  state.activeCampaignId = null;
  state.matchMode = "quick";
  showToast("Пока запускаю быстрый матч с ботом");
  resetMatch();
});
endlessBtn.addEventListener("click", () => {
  state.activeCampaignId = null;
  state.matchMode = "endless";
  showToast("Бесконечная осада");
  resetMatch();
});
restartBtn.addEventListener("click", resetMatch);
lobbyBtn.addEventListener("click", openLobby);
campaignBtn.addEventListener("click", openCampaignMap);
surrenderBtn?.addEventListener("click", () => {
  if (!state.started || state.gameOver) return;
  sound("deny");
  finish("Поражение", "Ты сдался.");
});
campaignBackBtn.addEventListener("click", () => {
  campaignPanel.classList.add("hidden");
  modePanel.classList.remove("hidden");
  sound("tap");
});
soundToggle.addEventListener("click", () => {
  state.soundOn = !state.soundOn;
  soundToggle.textContent = state.soundOn ? "Звук: вкл" : "Звук: выкл";
  saveSettings();
  if (state.soundOn) sound("select");
});
dailyBonusBtn?.addEventListener("click", claimDailyBonus);

loadSave();
unlockCardsForLevel();
renderWallet();
renderProgress();
renderHand();
renderDeckEditor();
renderDifficulty();
renderCampaignMap();
window.IronClashPlatform?.ready();
requestAnimationFrame(loop);

