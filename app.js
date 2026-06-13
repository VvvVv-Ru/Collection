const lockedDangerPreviewCount = 3;
const tileTypeRatioBaseCounts = {
  enemy: 3,
  flower: 10,
  empty: 6,
};
const tileTypeOrder = ["enemy", "flower", "empty"];

const layoutRows = [2, 2, 3, 3, 3, 3, 2, 1];
const rowTileIds = [
  ["T01", "T02"],
  ["T03", "T04"],
  ["T05", "T06", "T07"],
  ["T08", "T09", "T10"],
  ["T11", "T12", "T13"],
  ["T14", "T15", "T16"],
  // 为了让固定起点 T18 落在底部偏中间，最后两格的视觉顺序单独调整。
  ["T18", "T17"],
  ["T19"],
];
const rowSlots = [
  [2, 4],
  [1, 3],
  [2, 4, 6],
  [1, 3, 5],
  [2, 4, 6],
  [1, 3, 5],
  [2, 4],
  [3],
];
const startTileId = "T18";
const initialBeeCount = 5;
const honeyGoalTarget = 15;
const initialStatusText = "选择任意已翻开的格子（天敌除外）作为起点，按住滑动。";
const animationDurations = {
  failFlash: 420,
  shake: 420,
  startPulse: 800,
  honeyPulse: 480,
  toast: 1400,
  tileFlip: 260,
};
const defaultTileAppearConfig = Object.freeze({
  durationMs: 300,
  staggerMs: 40,
  startScale: 0.7,
  overshootScale: 1.1,
  easing: "cubic-bezier(0.22, 1, 0.36, 1)",
});
const tileAppearConfig = { ...defaultTileAppearConfig };
const tileAssetMap = {
  hidden: "./assets/tiles/tile-unknown.png",
  empty: "./assets/tiles/tile-empty.png",
  enemy: "./assets/tiles/tile-enemy.png?v=enemy-20260613-1",
  flower: "./assets/tiles/tile-flower.png",
};
const threatEdgeAssetMap = {
  left: "./assets/tiles/tile-edge-left.png",
  right: "./assets/tiles/tile-edge-right.png",
  "upper-left": "./assets/tiles/tile-edge-upper-left.png",
  "upper-right": "./assets/tiles/tile-edge-upper-right.png",
  "lower-left": "./assets/tiles/tile-edge-lower-left.png",
  "lower-right": "./assets/tiles/tile-edge-lower-right.png",
};
const flowerOverlayAsset = "./assets/tiles/flower_01.png";
const enemyOverlayAsset = "./assets/tiles/Bird_01.png?v=enemy-20260613-1";
let enemyOverlayDisplayAsset = enemyOverlayAsset;
const collectFeedbackConfig = {
  flyDuration: 1000,
  launchInterval: 140,
  hudRollDuration: 180,
  hudResetDelay: 120,
};
const comboConfig = {
  timeoutMs: 2500,
  visibleMs: 400,
  fadeOutMs: 600,
  followDurationMs: 320,
  followEasing: "cubic-bezier(0.22, 1, 0.36, 1)",
  offsetY: -8,
  soundThrottleMs: 90,
};
const flowerFlyAsset = "./assets/effects/flower-fly.svg";
const tileRevealSoundAsset = "./assets/audio/sfx/tile-reveal.wav";
const tileEnemyHitSoundAsset = "./assets/audio/sfx/tile-enemy-hit.wav";
const comboSoundAsset = "./assets/audio/sfx/sfx-combo.mp3";
const customCursorAsset = "./assets/ui/cursor/cursor-default.png";
const audioAssetMap = {
  bgmMain: "./assets/audio/bgm/bgm-main.mp3",
};
const bgmConfig = {
  defaultVolume: 0.3,
  storageKey: "honey-demo:bgm-muted",
};
const boardMetrics = {
  leftPadding: 36,
  topPadding: 62,
  xUnit: 66,
  yUnit: 99,
};
const boardDisplayScale = 1.3;

const hasDom = typeof document !== "undefined";

function generateSeed() {
  return Math.floor(Math.random() * 0xffffffff);
}

function normalizeSeed(seed) {
  const numericSeed = Number(seed);
  if (!Number.isFinite(numericSeed)) {
    return generateSeed();
  }

  return (Math.abs(Math.trunc(numericSeed)) || 1) >>> 0;
}

function createSeededRandom(seed) {
  let state = normalizeSeed(seed);

  return function seededRandom() {
    state += 0x6d2b79f5;
    let next = state;
    next = Math.imul(next ^ (next >>> 15), next | 1);
    next ^= next + Math.imul(next ^ (next >>> 7), next | 61);
    return ((next ^ (next >>> 14)) >>> 0) / 4294967296;
  };
}

function logEvent(label, payload = {}) {
  console.info(`[HoneyDemo] ${label}`, payload);
}

function calculateTileTypeCounts(totalTiles) {
  if (!Number.isInteger(totalTiles) || totalTiles <= 0) {
    throw new Error("格子总数非法，无法计算类型分配");
  }

  const baseTotal = Object.values(tileTypeRatioBaseCounts).reduce((sum, count) => sum + count, 0);
  const counts = { enemy: 0, flower: 0, empty: 0 };
  const allocations = tileTypeOrder.map((type) => {
    const rawCount = (tileTypeRatioBaseCounts[type] / baseTotal) * totalTiles;
    const flooredCount = Math.floor(rawCount);
    counts[type] = flooredCount;

    return {
      type,
      flooredCount,
      remainder: rawCount - flooredCount,
      baseWeight: tileTypeRatioBaseCounts[type],
    };
  });

  let remainingTiles = totalTiles - Object.values(counts).reduce((sum, count) => sum + count, 0);
  const sortedAllocations = [...allocations].sort((left, right) => {
    if (right.remainder !== left.remainder) {
      return right.remainder - left.remainder;
    }

    if (right.baseWeight !== left.baseWeight) {
      return right.baseWeight - left.baseWeight;
    }

    return tileTypeOrder.indexOf(left.type) - tileTypeOrder.indexOf(right.type);
  });

  for (let index = 0; index < sortedAllocations.length && remainingTiles > 0; index += 1) {
    counts[sortedAllocations[index].type] += 1;
    remainingTiles -= 1;
  }

  const maxEnemyCount = Math.max(totalTiles - 1, 0);
  if (counts.enemy > maxEnemyCount) {
    const overflowEnemyCount = counts.enemy - maxEnemyCount;
    counts.enemy = maxEnemyCount;
    const safeTypePriority = sortedAllocations.filter((allocation) => allocation.type !== "enemy");

    for (let index = 0; index < overflowEnemyCount; index += 1) {
      counts[safeTypePriority[index % safeTypePriority.length].type] += 1;
    }
  }

  return counts;
}

function validateLayoutConfig() {
  const rowCountMatches =
    layoutRows.length === rowTileIds.length && layoutRows.length === rowSlots.length;
  const everyRowMatches = layoutRows.every(
    (count, index) => rowTileIds[index].length === count && rowSlots[index].length === count
  );
  const allTileIds = rowTileIds.flat();
  const totalTiles = layoutRows.reduce((sum, count) => sum + count, 0);
  const uniqueTileCount = new Set(allTileIds).size;

  if (!rowCountMatches || !everyRowMatches || totalTiles !== uniqueTileCount) {
    throw new Error("固定盘面配置非法，请检查 layoutRows / rowTileIds / rowSlots");
  }

  if (!allTileIds.includes(startTileId)) {
    throw new Error("固定起点不存在于盘面配置中");
  }
}

const tiles = rowTileIds.flatMap((ids, rowIndex) =>
  ids.map((id, colIndex) => ({
    id,
    row: rowIndex,
    col: colIndex,
    slotX: rowSlots[rowIndex][colIndex],
  }))
);

const totalTileCount = tiles.length;
const tileTypeCounts = calculateTileTypeCounts(totalTileCount);

const tilesById = Object.fromEntries(tiles.map((tile) => [tile.id, tile]));

const adjacencyMap = Object.fromEntries(
  tiles.map((tile) => {
    const neighbors = tiles
      .filter((candidate) => candidate.id !== tile.id)
      .filter((candidate) => {
        const dx = Math.abs(candidate.slotX - tile.slotX);
        const dy = Math.abs(candidate.row - tile.row);
        return (dy === 0 && dx === 2) || (dy === 1 && dx === 1);
      })
      .map((candidate) => candidate.id)
      .sort();

    return [tile.id, neighbors];
  })
);

function shuffleArray(items, randomFn = Math.random) {
  const next = [...items];

  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(randomFn() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }

  return next;
}

function assignRandomTileTypes(randomFn = Math.random) {
  const allTileIds = tiles.map((tile) => tile.id);
  const enemyCandidates = allTileIds.filter((id) => id !== startTileId);
  const enemyIds = new Set(shuffleArray(enemyCandidates, randomFn).slice(0, tileTypeCounts.enemy));
  const flowerCandidates = allTileIds.filter((id) => !enemyIds.has(id));
  const flowerIds = new Set(
    shuffleArray(flowerCandidates, randomFn).slice(0, tileTypeCounts.flower)
  );

  return Object.fromEntries(
    allTileIds.map((id) => {
      if (enemyIds.has(id)) {
        return [id, "enemy"];
      }

      if (flowerIds.has(id)) {
        return [id, "flower"];
      }

      return [id, "empty"];
    })
  );
}

function validateTypeMap(typeMap) {
  const tileIds = tiles.map((tile) => tile.id);
  const typeKeys = Object.keys(typeMap).sort();
  const expectedKeys = [...tileIds].sort();

  if (JSON.stringify(typeKeys) !== JSON.stringify(expectedKeys)) {
    throw new Error("自定义 typeMap 缺少格子或包含非法格子");
  }

  const summary = Object.values(typeMap).reduce(
    (result, type) => {
      if (!(type in result)) {
        throw new Error(`非法格子类型：${type}`);
      }

      result[type] += 1;
      return result;
    },
    { enemy: 0, flower: 0, empty: 0 }
  );

  if (
    summary.enemy !== tileTypeCounts.enemy ||
    summary.flower !== tileTypeCounts.flower ||
    summary.empty !== tileTypeCounts.empty
  ) {
    throw new Error(
      `自定义 typeMap 不满足当前数量约束：enemy ${tileTypeCounts.enemy} / flower ${tileTypeCounts.flower} / empty ${tileTypeCounts.empty}`
    );
  }

  if (typeMap[startTileId] === "enemy") {
    throw new Error("T18 不能生成为 enemy");
  }

  return summary;
}

function getDangerCount(tileId, typeMap) {
  return adjacencyMap[tileId].filter((neighborId) => typeMap[neighborId] === "enemy").length;
}

function summarizeTileTypes(tileStateMap) {
  return Object.values(tileStateMap).reduce(
    (summary, tileState) => {
      summary[tileState.type] += 1;
      return summary;
    },
    { enemy: 0, flower: 0, empty: 0 }
  );
}

function buildTypeMap(options = {}) {
  if (options.typeMap) {
    validateTypeMap(options.typeMap);
    return {
      typeMap: { ...options.typeMap },
      seed: options.seed ?? null,
      roundConfigSource: options.seed ? "seed+typeMap" : "typeMap",
    };
  }

  const seed = normalizeSeed(options.seed ?? generateSeed());
  const randomFn = options.randomFn ?? createSeededRandom(seed);

  return {
    typeMap: assignRandomTileTypes(randomFn),
    seed,
    roundConfigSource: options.randomFn ? "custom-random" : "seed",
  };
}

function createInitialGameState(options = {}) {
  const { typeMap, seed, roundConfigSource } = buildTypeMap(options);
  const revealedTiles = new Set([startTileId]);
  const tileStateMap = Object.fromEntries(
    tiles.map((tile) => {
      const revealed = revealedTiles.has(tile.id);
      const type = typeMap[tile.id];

      return [
        tile.id,
        {
          id: tile.id,
          row: tile.row,
          col: tile.col,
          slotX: tile.slotX,
          type,
          revealed,
          unlocked: revealed,
          dangerCount: getDangerCount(tile.id, typeMap),
          neighbors: adjacencyMap[tile.id],
        },
      ];
    })
  );

  return {
    currentStartTileId: startTileId,
    lastEndedTileId: startTileId,
    currentSeed: seed,
    roundConfigSource,
    roundConfig: { ...typeMap },
    revealedTiles,
    totalHoney: 0,
    roundHoney: 0,
    remainingBees: initialBeeCount,
    isDragging: false,
    dragPointerId: null,
    currentPath: [],
    currentRunVisitedTileIds: new Set(),
    currentRunHoney: 0,
    lastSafeTileId: startTileId,
    lastConsumedBee: false,
    hasHitEnemy: false,
    statusText: initialStatusText,
    lastOutcome: null,
    isFailFlash: false,
    invalidFlashTileIds: [],
    shakeTileIds: [],
    flipTileIds: [],
    toastMessage: "",
    toastTone: "",
    totalHoneyPulse: false,
    startPulseTileId: null,
    isGameOver: false,
    isGameWin: false,
    tileStateMap,
    seenVisibleTileIds: new Set(),
    tileAppearances: {},
  };
}

let gameState = createInitialGameState();
let feedbackTimers = [];

const dom = hasDom
  ? {
      gameStageViewport: document.getElementById("game-stage-viewport"),
      gameStage: document.getElementById("game-stage"),
      boardViewport: document.getElementById("board-viewport"),
      board: document.getElementById("board"),
      fxOverlay: document.getElementById("fx-overlay"),
      comboOverlay: document.getElementById("combo-overlay"),
      comboPopup: document.getElementById("combo-popup"),
      comboPopupCount: document.getElementById("combo-popup-count"),
      totalHoney: document.getElementById("total-honey"),
      roundHoney: document.getElementById("round-honey"),
      roundHoneyCard: document.getElementById("round-honey-card"),
      beesLeft: document.getElementById("bees-left"),
      statusText: document.getElementById("status-text"),
      toast: document.getElementById("toast"),
      gameOver: document.getElementById("game-over"),
      gameOverSummary: document.getElementById("game-over-summary"),
      restartButton: document.getElementById("restart-button"),
      gameWin: document.getElementById("game-win"),
      gameWinSummary: document.getElementById("game-win-summary"),
      restartWinButton: document.getElementById("restart-win-button"),
    }
  : null;

let collectionTimers = [];
const feedbackState = {
  currentRunToken: 0,
  nextLaunchAt: 0,
  pendingLaunchCount: 0,
  activeFlights: new Map(),
  flightRafId: null,
  flightCounter: 0,
  hudDisplayedValue: 0,
  hudTargetValue: 0,
  isHudRolling: false,
  hudRollingFrom: 0,
  hudRollingTo: 0,
  shouldResetRoundHoney: false,
  audioContext: null,
};

const comboState = {
  count: 0,
  lastTriggerAt: 0,
  timeoutHandle: null,
  hideTimer: null,
  visibleHideTimer: null,
  isVisible: false,
  isExiting: false,
  lastTileId: null,
  lastSoundAt: 0,
};

const comboTierClasses = ["combo-popup--tier-1", "combo-popup--tier-2", "combo-popup--tier-3"];

function getComboTierClass(count) {
  if (count >= 11) return "combo-popup--tier-3";
  if (count >= 6) return "combo-popup--tier-2";
  return "combo-popup--tier-1";
}

function getNow() {
  if (typeof performance !== "undefined" && typeof performance.now === "function") {
    return performance.now();
  }

  return Date.now();
}

function scheduleCollectionTask(callback, delay = 0) {
  const timerId = setTimeout(() => {
    collectionTimers = collectionTimers.filter((id) => id !== timerId);
    callback();
  }, delay);

  collectionTimers.push(timerId);
  return timerId;
}

function clearCollectionTasks() {
  collectionTimers.forEach((timerId) => clearTimeout(timerId));
  collectionTimers = [];
}

function scheduleFeedback(callback, delay) {
  const timerId = setTimeout(() => {
    feedbackTimers = feedbackTimers.filter((id) => id !== timerId);
    callback();
  }, delay);

  feedbackTimers.push(timerId);
  return timerId;
}

function clearFeedbackTimers() {
  feedbackTimers.forEach((timerId) => clearTimeout(timerId));
  feedbackTimers = [];
}

function clearComboTimeout() {
  if (comboState.timeoutHandle !== null) {
    clearTimeout(comboState.timeoutHandle);
    comboState.timeoutHandle = null;
  }
}

function clearComboHideTimer() {
  if (comboState.hideTimer !== null) {
    clearTimeout(comboState.hideTimer);
    comboState.hideTimer = null;
  }
}

function clearComboVisibleHideTimer() {
  if (comboState.visibleHideTimer !== null) {
    clearTimeout(comboState.visibleHideTimer);
    comboState.visibleHideTimer = null;
  }
}

// 软隐藏：只让浮层渐隐离场，但保留 comboState.count / timeoutHandle，
// 这样在 timeoutMs 内再采到花仍按累计 Combo 继续，不会出现浮层长时间挂在画面上。
function softHideComboPopup() {
  comboState.visibleHideTimer = null;

  if (!dom?.comboPopup || !comboState.isVisible || comboState.isExiting) {
    return;
  }

  comboState.isVisible = false;
  comboState.isExiting = true;
  dom.comboPopup.classList.remove("combo-popup--enter", "combo-popup--pop");
  dom.comboPopup.style.transition = "";
  void dom.comboPopup.offsetWidth;
  dom.comboPopup.classList.add("combo-popup--exit");

  clearComboHideTimer();
  comboState.hideTimer = setTimeout(() => {
    if (dom?.comboPopup) {
      dom.comboPopup.hidden = true;
      dom.comboPopup.classList.remove("combo-popup--exit");
      dom.comboPopup.style.left = "";
      dom.comboPopup.style.top = "";
      dom.comboPopup.style.transition = "";
    }
    comboState.hideTimer = null;
    comboState.isExiting = false;
  }, comboConfig.fadeOutMs);
}

function scheduleComboVisibleHide() {
  clearComboVisibleHideTimer();
  comboState.visibleHideTimer = setTimeout(() => {
    softHideComboPopup();
  }, comboConfig.visibleMs);
}

function triggerRenderOnly() {
  if (hasDom) {
    renderAll();
  }
}

function showToast(message, tone = "") {
  gameState.toastMessage = message;
  gameState.toastTone = tone;
  triggerRenderOnly();

  scheduleFeedback(() => {
    if (gameState.toastMessage === message) {
      gameState.toastMessage = "";
      gameState.toastTone = "";
      triggerRenderOnly();
    }
  }, animationDurations.toast);
}

function triggerStartPulse(tileId) {
  gameState.startPulseTileId = tileId;

  scheduleFeedback(() => {
    if (gameState.startPulseTileId === tileId) {
      gameState.startPulseTileId = null;
      triggerRenderOnly();
    }
  }, animationDurations.startPulse);
}

function triggerFailFeedback(tileIds = []) {
  gameState.isFailFlash = true;
  gameState.shakeTileIds = [...tileIds];
  showToast("采集失败", "fail");
  triggerRenderOnly();

  scheduleFeedback(() => {
    gameState.isFailFlash = false;
    triggerRenderOnly();
  }, animationDurations.failFlash);

  scheduleFeedback(() => {
    gameState.shakeTileIds = [];
    triggerRenderOnly();
  }, animationDurations.shake);
}

function computeComboAnchor(tileId) {
  if (!dom?.comboOverlay || !tileId) {
    return null;
  }

  const tileElement = dom.board?.querySelector(`[data-tile-id="${tileId}"]`);
  if (!tileElement) {
    return null;
  }

  const tileRect = tileElement.getBoundingClientRect();
  const overlayRect = dom.comboOverlay.getBoundingClientRect();
  return {
    left: tileRect.left - overlayRect.left + tileRect.width / 2,
    top: tileRect.top - overlayRect.top + comboConfig.offsetY,
  };
}

function applyComboPopupTier() {
  if (!dom?.comboPopup) {
    return;
  }

  comboTierClasses.forEach((cls) => dom.comboPopup.classList.remove(cls));
  dom.comboPopup.classList.add(getComboTierClass(comboState.count));
}

function clearComboPopupClasses() {
  if (!dom?.comboPopup) {
    return;
  }

  dom.comboPopup.classList.remove(
    "combo-popup--enter",
    "combo-popup--pop",
    "combo-popup--exit",
    ...comboTierClasses
  );
}

function resetComboPopupDom() {
  if (!dom?.comboPopup) {
    return;
  }

  clearComboPopupClasses();
  dom.comboPopup.hidden = true;
  dom.comboPopup.style.left = "";
  dom.comboPopup.style.top = "";
  dom.comboPopup.style.transition = "";
}

function updateComboPopupPosition(tileId) {
  if (!dom?.comboPopup) {
    return;
  }

  const anchor = computeComboAnchor(tileId);
  if (!anchor) {
    return;
  }

  dom.comboPopup.style.left = `${anchor.left}px`;
  dom.comboPopup.style.top = `${anchor.top}px`;
}

function endCombo(options = {}) {
  const { immediate = false } = options;

  clearComboTimeout();
  clearComboHideTimer();
  clearComboVisibleHideTimer();

  const wasVisible = comboState.isVisible;
  comboState.count = 0;
  comboState.lastTriggerAt = 0;
  comboState.lastTileId = null;
  comboState.isVisible = false;
  comboState.isExiting = false;

  if (!dom?.comboPopup || !dom.comboPopupCount) {
    return;
  }

  if (immediate || !wasVisible) {
    resetComboPopupDom();
    return;
  }

  comboState.isExiting = true;
  dom.comboPopup.classList.remove("combo-popup--enter", "combo-popup--pop");
  // 退场使用 transform 动画，需要关闭 left/top 的位置过渡，避免抢夺 transform
  dom.comboPopup.style.transition = "";
  void dom.comboPopup.offsetWidth;
  dom.comboPopup.classList.add("combo-popup--exit");

  comboState.hideTimer = setTimeout(() => {
    resetComboPopupDom();
    comboState.hideTimer = null;
    comboState.isExiting = false;
  }, comboConfig.fadeOutMs);
}

function resetComboTimer() {
  clearComboTimeout();
  comboState.timeoutHandle = setTimeout(() => {
    endCombo();
  }, comboConfig.timeoutMs);
}

let comboSoundTemplate = null;

function primeComboSound() {
  if (typeof Audio === "undefined") {
    return;
  }

  if (!comboSoundTemplate) {
    try {
      comboSoundTemplate = new Audio(comboSoundAsset);
      comboSoundTemplate.preload = "auto";
    } catch (_error) {
      comboSoundTemplate = null;
    }
  }
}

function playComboSoundSynth() {
  const audioContext = ensureCollectAudioContext();
  if (!audioContext) {
    return;
  }

  if (audioContext.state === "suspended") {
    audioContext.resume().catch(() => {});
  }

  const startedAt = audioContext.currentTime;
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  oscillator.type = "triangle";
  oscillator.frequency.setValueAtTime(880, startedAt);
  oscillator.frequency.exponentialRampToValueAtTime(1320, startedAt + 0.09);
  gainNode.gain.setValueAtTime(0.0001, startedAt);
  gainNode.gain.exponentialRampToValueAtTime(0.06, startedAt + 0.02);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, startedAt + 0.16);
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  oscillator.start(startedAt);
  oscillator.stop(startedAt + 0.18);
}

function playComboSound() {
  const now = getNow();
  if (now - comboState.lastSoundAt < comboConfig.soundThrottleMs) {
    return;
  }
  comboState.lastSoundAt = now;

  if (typeof Audio !== "undefined") {
    try {
      const instance = comboSoundTemplate ? comboSoundTemplate.cloneNode(true) : new Audio(comboSoundAsset);
      const playResult = instance.play();
      if (playResult && typeof playResult.catch === "function") {
        playResult.catch(() => playComboSoundSynth());
      }
      return;
    } catch (_error) {
      // fallback below
    }
  }

  playComboSoundSynth();
}

function incrementCombo(tileId) {
  if (!dom?.comboPopup || !dom.comboPopupCount) {
    return;
  }

  const isFirstBump = !comboState.isVisible || comboState.count === 0 || comboState.isExiting;

  comboState.count += 1;
  comboState.lastTriggerAt = getNow();
  comboState.lastTileId = tileId;
  dom.comboPopupCount.textContent = String(comboState.count);

  clearComboHideTimer();
  comboState.isExiting = false;

  const anchor = computeComboAnchor(tileId);

  if (isFirstBump) {
    // 第一次 bump：临时关闭 left/top 过渡，预设到目标坐标后再恢复
    dom.comboPopup.classList.remove("combo-popup--exit");
    dom.comboPopup.style.transition = "none";
    if (anchor) {
      dom.comboPopup.style.left = `${anchor.left}px`;
      dom.comboPopup.style.top = `${anchor.top}px`;
    }
    void dom.comboPopup.offsetWidth;
    dom.comboPopup.style.transition = "";
    dom.comboPopup.hidden = false;

    applyComboPopupTier();

    dom.comboPopup.classList.remove("combo-popup--enter", "combo-popup--pop");
    void dom.comboPopup.offsetWidth;
    dom.comboPopup.classList.add("combo-popup--enter", "combo-popup--pop");
  } else {
    // 第二次起：让 left/top 平滑过渡跟随，并重触发 pop
    if (anchor) {
      dom.comboPopup.style.left = `${anchor.left}px`;
      dom.comboPopup.style.top = `${anchor.top}px`;
    }
    applyComboPopupTier();

    dom.comboPopup.classList.remove("combo-popup--pop");
    void dom.comboPopup.offsetWidth;
    dom.comboPopup.classList.add("combo-popup--pop");
  }

  comboState.isVisible = true;
  playComboSound();
  resetComboTimer();
  scheduleComboVisibleHide();
}

function playInvalidStartSound() {
  // RULE-03 预留：后续可接入 assets/audio/sfx/invalid-start.wav
}

function triggerInvalidStartFeedback(tileId, options = {}) {
  const {
    message = "不能从这里出发，请选择已翻开的非天敌格",
    tone = "fail",
  } = options;

  playInvalidStartSound();
  showToast(message, tone);

  if (!tileId) {
    return;
  }

  gameState.invalidFlashTileIds = Array.from(new Set([...gameState.invalidFlashTileIds, tileId]));
  triggerRenderOnly();

  scheduleFeedback(() => {
    gameState.invalidFlashTileIds = gameState.invalidFlashTileIds.filter((id) => id !== tileId);
    triggerRenderOnly();
  }, 360);
}

function triggerSuccessFeedback(tileId, gainedHoney, options = {}) {
  const { message = gainedHoney > 0 ? `结算成功 +${gainedHoney}` : "采集成功", tone = "success" } = options;

  if (gainedHoney > 0) {
    gameState.totalHoneyPulse = true;
  }

  triggerStartPulse(tileId);
  showToast(message, tone);

  if (gainedHoney > 0) {
    scheduleFeedback(() => {
      gameState.totalHoneyPulse = false;
      triggerRenderOnly();
    }, animationDurations.honeyPulse);
  }

}

function updateGameOverState() {
  const shouldGameOver = !gameState.isDragging && gameState.remainingBees <= 0;
  gameState.isGameOver = shouldGameOver;

  if (shouldGameOver) {
    gameState.statusText = `游戏结束 · 总花蜜：${gameState.totalHoney}`;
    showToast("游戏结束", "game-over");
    logEvent("游戏结束", getStateSnapshot());
  }
}

function getRoundConfigSnapshot() {
  return {
    seed: gameState.currentSeed,
    source: gameState.roundConfigSource,
    tiles: { ...gameState.roundConfig },
  };
}

function getStateSnapshot() {
  return {
    currentStartTileId: gameState.currentStartTileId,
    lastEndedTileId: gameState.lastEndedTileId,
    lastConsumedBee: gameState.lastConsumedBee,
    remainingBees: gameState.remainingBees,
    totalHoney: gameState.totalHoney,
    roundHoney: gameState.roundHoney,
    isGameOver: gameState.isGameOver,
    comboCount: comboState.count,
    currentPath: [...gameState.currentPath],
    lastOutcome: gameState.lastOutcome,
  };
}

function syncRoundHoney(value = gameState.roundHoney) {
  const nextValue = Math.max(0, Math.trunc(value));
  feedbackState.hudDisplayedValue = nextValue;
  feedbackState.hudTargetValue = nextValue;
  feedbackState.isHudRolling = false;
  feedbackState.hudRollingFrom = nextValue;
  feedbackState.hudRollingTo = nextValue;
  feedbackState.shouldResetRoundHoney = false;
  gameState.roundHoney = nextValue;
}

function renderRoundHoneyValue(value, nextValue = null) {
  if (!dom?.roundHoney) {
    return;
  }

  if (nextValue === null || nextValue === undefined || nextValue === value) {
    dom.roundHoney.className = "hud-roll";
    dom.roundHoney.textContent = String(value);
    return;
  }

  dom.roundHoney.className = "hud-roll hud-roll--animating";
  dom.roundHoney.innerHTML = `
    <span class="hud-roll__track" aria-hidden="true">
      <span class="hud-roll__digit">${value}</span>
      <span class="hud-roll__digit">${nextValue}</span>
    </span>
  `;
  dom.roundHoney.setAttribute("aria-label", `本轮暂存 ${nextValue}`);
}

function stopFlowerFlightLoop() {
  if (feedbackState.flightRafId !== null) {
    cancelAnimationFrame(feedbackState.flightRafId);
    feedbackState.flightRafId = null;
  }
}

function clearActiveFlowerFlights() {
  feedbackState.activeFlights.forEach((flight) => {
    flight.element.remove();
  });
  feedbackState.activeFlights.clear();
  stopFlowerFlightLoop();
}

function resetCollectionFeedback(options = {}) {
  const { resetRunToken = false, clearFlights = true, resetDisplay = true } = options;

  clearCollectionTasks();
  feedbackState.nextLaunchAt = 0;
  feedbackState.pendingLaunchCount = 0;
  feedbackState.shouldResetRoundHoney = false;

  if (resetRunToken) {
    feedbackState.currentRunToken += 1;
  }

  if (clearFlights) {
    clearActiveFlowerFlights();
  }

  if (resetDisplay) {
    syncRoundHoney(0);
    renderRoundHoneyValue(0);
  }

  dom?.roundHoneyCard?.classList.remove("hud-card--collect");
}

function getOverlayRelativePointFromRect(rect, anchorY = 0.5) {
  if (!dom?.fxOverlay) {
    return null;
  }

  const overlayRect = dom.fxOverlay.getBoundingClientRect();
  return {
    x: rect.left + rect.width / 2 - overlayRect.left,
    y: rect.top + rect.height * anchorY - overlayRect.top,
  };
}

function getTileFlightOrigin(tileId) {
  const tileElement = dom?.board?.querySelector(`[data-tile-id="${tileId}"]`);

  if (!tileElement) {
    return null;
  }

  return getOverlayRelativePointFromRect(tileElement.getBoundingClientRect(), 0.42);
}

function getHudCollectTargetPoint() {
  if (!dom?.roundHoneyCard) {
    return null;
  }

  return getOverlayRelativePointFromRect(dom.roundHoneyCard.getBoundingClientRect(), 0.5);
}

function easeOutCubic(value) {
  return 1 - Math.pow(1 - value, 3);
}

function easeOutBack(value) {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(value - 1, 3) + c1 * Math.pow(value - 1, 2);
}

function getQuadraticBezierPoint(start, control, end, progress) {
  const inverse = 1 - progress;
  return {
    x: inverse * inverse * start.x + 2 * inverse * progress * control.x + progress * progress * end.x,
    y: inverse * inverse * start.y + 2 * inverse * progress * control.y + progress * progress * end.y,
  };
}

function createFlowerFlightElement() {
  const element = document.createElement("div");
  element.className = "flower-fly";
  element.innerHTML = `<img class="flower-fly__image" src="${flowerFlyAsset}" alt="" />`;
  return element;
}

function ensureFlightLoop() {
  if (feedbackState.flightRafId !== null || feedbackState.activeFlights.size === 0) {
    return;
  }

  const tick = (now) => {
    const completedIds = [];

    feedbackState.activeFlights.forEach((flight, flightId) => {
      const rawProgress = Math.min(1, (now - flight.startTime) / flight.duration);
      const progress = easeOutCubic(rawProgress);
      const point = getQuadraticBezierPoint(flight.start, flight.control, flight.end, progress);
      const popWindow = rawProgress < 0.2 ? rawProgress / 0.2 : 1;
      const popScale = rawProgress < 0.2 ? easeOutBack(popWindow) : 1;
      const scale = Math.max(0.86, 1.04 - rawProgress * 0.14) * popScale;
      const opacity = rawProgress > 0.82 ? Math.max(0, 1 - (rawProgress - 0.82) / 0.18) : 1;
      const rotation = flight.rotationStart + flight.rotationDelta * progress;

      flight.element.style.opacity = String(opacity);
      flight.element.style.transform = `translate(${point.x}px, ${point.y}px) translate(-50%, -50%) scale(${scale}) rotate(${rotation}deg)`;

      if (rawProgress >= 1) {
        completedIds.push(flightId);
      }
    });

    completedIds.forEach((flightId) => finishFlowerFlight(flightId));

    if (feedbackState.activeFlights.size === 0) {
      feedbackState.flightRafId = null;
      return;
    }

    feedbackState.flightRafId = requestAnimationFrame(tick);
  };

  feedbackState.flightRafId = requestAnimationFrame(tick);
}

function ensureCollectAudioContext() {
  if (!hasDom) {
    return null;
  }

  const AudioContextClass = window.AudioContext || window.webkitAudioContext;

  if (!AudioContextClass) {
    return null;
  }

  if (!feedbackState.audioContext) {
    feedbackState.audioContext = new AudioContextClass();
  }

  return feedbackState.audioContext;
}

function primeCollectAudio() {
  const audioContext = ensureCollectAudioContext();
  if (audioContext?.state === "suspended") {
    audioContext.resume().catch(() => {});
  }
  primeTileRevealSound();
  primeTileEnemyHitSound();
  primeComboSound();
}

let tileRevealSoundTemplate = null;

function primeTileRevealSound() {
  if (typeof Audio === "undefined") {
    return;
  }

  if (!tileRevealSoundTemplate) {
    try {
      tileRevealSoundTemplate = new Audio(tileRevealSoundAsset);
      tileRevealSoundTemplate.preload = "auto";
    } catch (_error) {
      tileRevealSoundTemplate = null;
    }
  }
}

function playTileRevealSound() {
  if (typeof Audio === "undefined") {
    return;
  }

  try {
    const instance = tileRevealSoundTemplate
      ? tileRevealSoundTemplate.cloneNode(true)
      : new Audio(tileRevealSoundAsset);
    const playResult = instance.play();
    if (playResult && typeof playResult.catch === "function") {
      playResult.catch(() => {});
    }
  } catch (_error) {
    // 失败静默，不影响主流程
  }
}

let tileEnemyHitSoundTemplate = null;

function primeTileEnemyHitSound() {
  if (typeof Audio === "undefined") {
    return;
  }

  if (!tileEnemyHitSoundTemplate) {
    try {
      tileEnemyHitSoundTemplate = new Audio(tileEnemyHitSoundAsset);
      tileEnemyHitSoundTemplate.preload = "auto";
    } catch (_error) {
      tileEnemyHitSoundTemplate = null;
    }
  }
}

function playTileEnemyHitSound() {
  if (typeof Audio === "undefined") {
    return;
  }

  try {
    const instance = tileEnemyHitSoundTemplate
      ? tileEnemyHitSoundTemplate.cloneNode(true)
      : new Audio(tileEnemyHitSoundAsset);
    const playResult = instance.play();
    if (playResult && typeof playResult.catch === "function") {
      playResult.catch(() => {});
    }
  } catch (_error) {
    // 失败静默，不影响主流程
  }
}

function playCollectSound() {
  const audioContext = ensureCollectAudioContext();

  if (!audioContext) {
    return;
  }

  if (audioContext.state === "suspended") {
    audioContext.resume().catch(() => {});
  }

  const startedAt = audioContext.currentTime;
  const frequencies = [880, 1320];

  frequencies.forEach((frequency, index) => {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    oscillator.type = index === 0 ? "triangle" : "sine";
    oscillator.frequency.setValueAtTime(frequency, startedAt);
    gainNode.gain.setValueAtTime(0.0001, startedAt);
    gainNode.gain.exponentialRampToValueAtTime(0.08 / (index + 1), startedAt + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, startedAt + 0.16 + index * 0.02);
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.start(startedAt + index * 0.012);
    oscillator.stop(startedAt + 0.19 + index * 0.03);
  });
}

function playHudCollectFeedback() {
  if (!dom?.roundHoneyCard) {
    return;
  }

  dom.roundHoneyCard.classList.remove("hud-card--collect");
  void dom.roundHoneyCard.offsetWidth;
  dom.roundHoneyCard.classList.add("hud-card--collect");
  scheduleCollectionTask(() => {
    dom.roundHoneyCard?.classList.remove("hud-card--collect");
  }, 360);
}

function maybeResetRoundHoneyAfterArrival() {
  const hasPendingVisuals =
    feedbackState.pendingLaunchCount > 0 ||
    feedbackState.activeFlights.size > 0 ||
    feedbackState.isHudRolling ||
    feedbackState.hudDisplayedValue < feedbackState.hudTargetValue;

  if (!feedbackState.shouldResetRoundHoney || hasPendingVisuals) {
    return;
  }

  feedbackState.shouldResetRoundHoney = false;
  scheduleCollectionTask(() => {
    if (gameState.isDragging) {
      return;
    }

    syncRoundHoney(0);
    renderRoundHoneyValue(0);
  }, collectFeedbackConfig.hudResetDelay);
}

function runNextHudIncrement() {
  if (feedbackState.hudDisplayedValue >= feedbackState.hudTargetValue) {
    feedbackState.isHudRolling = false;
    feedbackState.hudRollingFrom = feedbackState.hudDisplayedValue;
    feedbackState.hudRollingTo = feedbackState.hudDisplayedValue;
    renderRoundHoneyValue(feedbackState.hudDisplayedValue);
    maybeResetRoundHoneyAfterArrival();
    return;
  }

  feedbackState.isHudRolling = true;
  const currentValue = feedbackState.hudDisplayedValue;
  const nextValue = currentValue + 1;
  feedbackState.hudRollingFrom = currentValue;
  feedbackState.hudRollingTo = nextValue;
  renderRoundHoneyValue(currentValue, nextValue);

  scheduleCollectionTask(() => {
    feedbackState.hudDisplayedValue = nextValue;
    gameState.roundHoney = nextValue;
    renderRoundHoneyValue(nextValue);
    runNextHudIncrement();
  }, collectFeedbackConfig.hudRollDuration);
}

function enqueueTempHoneyIncrement(amount = 1) {
  feedbackState.hudTargetValue += amount;

  if (!feedbackState.isHudRolling) {
    runNextHudIncrement();
  }
}

function finishFlowerFlight(flightId) {
  const flight = feedbackState.activeFlights.get(flightId);

  if (!flight) {
    return;
  }

  flight.element.remove();
  feedbackState.activeFlights.delete(flightId);
  playHudCollectFeedback();
  playCollectSound();
  enqueueTempHoneyIncrement(1);
  maybeResetRoundHoneyAfterArrival();
}

function animateFlowerToHud(startPoint, runToken) {
  if (!dom?.fxOverlay) {
    enqueueTempHoneyIncrement(1);
    return;
  }

  if (runToken !== feedbackState.currentRunToken) {
    return;
  }

  const endPoint = getHudCollectTargetPoint();

  if (!startPoint || !endPoint) {
    playHudCollectFeedback();
    playCollectSound();
    enqueueTempHoneyIncrement(1);
    return;
  }

  const dx = endPoint.x - startPoint.x;
  const midX = startPoint.x + dx * 0.5;
  const arcHeight = Math.min(180, Math.max(88, Math.abs(dx) * 0.16 + Math.abs(endPoint.y - startPoint.y) * 0.22));
  const controlPoint = {
    x: midX + dx * 0.12,
    y: Math.min(startPoint.y, endPoint.y) - arcHeight,
  };
  const element = createFlowerFlightElement();
  const flightId = ++feedbackState.flightCounter;

  element.style.transform = `translate(${startPoint.x}px, ${startPoint.y}px) translate(-50%, -50%) scale(0.45)`;
  dom.fxOverlay.appendChild(element);
  feedbackState.activeFlights.set(flightId, {
    element,
    start: startPoint,
    control: controlPoint,
    end: endPoint,
    startTime: getNow(),
    duration: collectFeedbackConfig.flyDuration,
    rotationStart: -18 + Math.random() * 14,
    rotationDelta: 22 + Math.random() * 26,
  });
  ensureFlightLoop();
}

function spawnFlowerFlyEffect(tileId) {
  if (!hasDom || !dom?.fxOverlay || !dom.roundHoneyCard) {
    syncRoundHoney(gameState.currentRunHoney);
    return;
  }

  let startPoint = getTileFlightOrigin(tileId);

  // 新翻开的花格在按需渲染模式下，当前 tick 里可能尚未进入 DOM；先补一次棋盘渲染再取飞花起点。
  if (!startPoint) {
    renderBoard();
    startPoint = getTileFlightOrigin(tileId);
  }

  const runToken = feedbackState.currentRunToken;
  const now = getNow();
  const launchAt = Math.max(now, feedbackState.nextLaunchAt);
  const delay = Math.max(0, launchAt - now);

  feedbackState.nextLaunchAt = launchAt + collectFeedbackConfig.launchInterval;
  feedbackState.pendingLaunchCount += 1;

  scheduleCollectionTask(() => {
    feedbackState.pendingLaunchCount = Math.max(0, feedbackState.pendingLaunchCount - 1);

    if (runToken !== feedbackState.currentRunToken) {
      maybeResetRoundHoneyAfterArrival();
      return;
    }

    animateFlowerToHud(startPoint, runToken);
  }, delay);
}

function queueRoundHoneyReset() {
  if (!hasDom) {
    syncRoundHoney(0);
    return;
  }

  feedbackState.shouldResetRoundHoney = true;
  maybeResetRoundHoneyAfterArrival();
}

function setTileRevealed(tileId) {
  const tileState = gameState.tileStateMap[tileId];
  const wasRevealed = tileState.revealed;
  tileState.revealed = true;
  tileState.unlocked = true;
  gameState.revealedTiles.add(tileId);
  if (!wasRevealed) {
    triggerTileFlip(tileId);
  }
  return !wasRevealed;
}

function triggerTileFlip(tileId) {
  if (!gameState.flipTileIds.includes(tileId)) {
    gameState.flipTileIds = [...gameState.flipTileIds, tileId];
  }
  scheduleFeedback(() => {
    gameState.flipTileIds = gameState.flipTileIds.filter((id) => id !== tileId);
    triggerRenderOnly();
  }, animationDurations.tileFlip);
}

function isSafeTileType(type) {
  return type === "flower" || type === "empty";
}

function hasRevealedNeighbor(tileId) {
  return adjacencyMap[tileId].some((neighborId) => gameState.tileStateMap[neighborId].revealed);
}

function getRevealedNeighborCount(tileId) {
  return adjacencyMap[tileId].filter((neighborId) => gameState.tileStateMap[neighborId].revealed).length;
}

function getTileDistance(fromTileId, toTileId) {
  if (!fromTileId || !toTileId) {
    return Number.POSITIVE_INFINITY;
  }

  if (fromTileId === toTileId) {
    return 0;
  }

  const queue = [[fromTileId, 0]];
  const visited = new Set([fromTileId]);

  while (queue.length > 0) {
    const [currentTileId, distance] = queue.shift();

    for (const neighborId of adjacencyMap[currentTileId]) {
      if (visited.has(neighborId)) {
        continue;
      }

      const nextDistance = distance + 1;
      if (neighborId === toTileId) {
        return nextDistance;
      }

      visited.add(neighborId);
      queue.push([neighborId, nextDistance]);
    }
  }

  return Number.POSITIVE_INFINITY;
}

function getLockedDangerPreviewTileIds() {
  const focusTileId = gameState.isDragging ? getCurrentTileId() : getDisplayStartTileId();

  return tiles
    .map((tile) => gameState.tileStateMap[tile.id])
    .filter((tileState) => !tileState.revealed && hasRevealedNeighbor(tileState.id))
    .sort((left, right) => {
      const distanceDelta =
        getTileDistance(focusTileId, left.id) - getTileDistance(focusTileId, right.id);

      if (distanceDelta !== 0) {
        return distanceDelta;
      }

      const revealedNeighborDelta =
        getRevealedNeighborCount(right.id) - getRevealedNeighborCount(left.id);

      if (revealedNeighborDelta !== 0) {
        return revealedNeighborDelta;
      }

      return left.id.localeCompare(right.id);
    })
    .slice(0, lockedDangerPreviewCount)
    .map((tileState) => tileState.id);
}

function getVisibleTileIds() {
  return new Set([...gameState.revealedTiles, ...getLockedDangerPreviewTileIds()]);
}

function getVisibleDangerCount(tileId) {
  const state = gameState.tileStateMap[tileId];

  if (state.revealed) {
    return null;
  }

  return getLockedDangerPreviewTileIds().includes(tileId) ? state.dangerCount : null;
}

function getTileAppearConfigSnapshot() {
  return { ...tileAppearConfig };
}

function applyTileAppearConfig(nextConfig = {}) {
  if (!nextConfig || typeof nextConfig !== "object") {
    return getTileAppearConfigSnapshot();
  }

  const maybeAssignNumber = (key, min = 0) => {
    if (!(key in nextConfig)) {
      return;
    }

    const value = Number(nextConfig[key]);
    if (Number.isFinite(value) && value >= min) {
      tileAppearConfig[key] = value;
    }
  };

  maybeAssignNumber("durationMs", 0);
  maybeAssignNumber("staggerMs", 0);
  maybeAssignNumber("startScale", 0);
  maybeAssignNumber("overshootScale", 0);

  if (typeof nextConfig.easing === "string" && nextConfig.easing.trim()) {
    tileAppearConfig.easing = nextConfig.easing.trim();
  }

  triggerRenderOnly();
  return getTileAppearConfigSnapshot();
}

function buildTileAppearanceFrameMap(visibleTileIds) {
  const now = getNow();
  const newlyVisibleTileIds = tiles
    .filter((tile) => visibleTileIds.has(tile.id) && !gameState.seenVisibleTileIds.has(tile.id))
    .map((tile) => tile.id);

  newlyVisibleTileIds.forEach((tileId, index) => {
    gameState.tileAppearances[tileId] = {
      startedAt: now,
      delayMs: index * tileAppearConfig.staggerMs,
    };
    gameState.seenVisibleTileIds.add(tileId);
  });

  const nextAppearances = {};
  const frameMap = {};

  Object.entries(gameState.tileAppearances).forEach(([tileId, appearance]) => {
    const elapsed = now - appearance.startedAt;
    const totalDuration = appearance.delayMs + tileAppearConfig.durationMs;

    if (elapsed >= totalDuration) {
      return;
    }

    nextAppearances[tileId] = appearance;
    frameMap[tileId] = {
      delayMs: appearance.delayMs - elapsed,
    };
  });

  gameState.tileAppearances = nextAppearances;
  return frameMap;
}

function computeBoardSize() {
  if (!dom?.board) {
    return;
  }

  const maxSlot = Math.max(...tiles.map((tile) => tile.slotX));
  const maxRow = Math.max(...tiles.map((tile) => tile.row));
  const width = boardMetrics.leftPadding * 2 + maxSlot * boardMetrics.xUnit + 56;
  const height = boardMetrics.topPadding * 2 + maxRow * boardMetrics.yUnit + 96;

  dom.board.style.width = `${width}px`;
  dom.board.style.height = `${height}px`;
  dom.board.style.transform = `scale(${boardDisplayScale})`;
  if (dom.boardViewport) {
    dom.boardViewport.style.width = `${width * boardDisplayScale}px`;
    dom.boardViewport.style.height = `${height * boardDisplayScale}px`;
  }
  applyResponsiveGameScale();
}

function applyResponsiveGameScale() {
  if (!dom?.gameStage || !dom.gameStageViewport) {
    return;
  }

  const stageWidth = dom.gameStage.offsetWidth;
  const stageHeight = dom.gameStage.offsetHeight;
  const availableWidth = dom.gameStageViewport.clientWidth;
  const availableHeight = dom.gameStageViewport.clientHeight;

  if (!stageWidth || !stageHeight || !availableWidth || !availableHeight) {
    return;
  }

  const scale = Math.min(1, availableWidth / stageWidth, availableHeight / stageHeight);
  const isMobileViewport = window.matchMedia("(max-width: 560px)").matches;
  const topOffset = isMobileViewport ? 0 : Math.max(0, (availableHeight - stageHeight * scale) / 2);
  dom.gameStage.style.top = `${topOffset}px`;
  dom.gameStage.style.transform = `translateX(-50%) scale(${scale})`;

  if (comboState.count > 0 && comboState.lastTileId) {
    updateComboPopupPosition(comboState.lastTileId);
  }
}

function getTileTypeLabel(type) {
  if (type === "flower") {
    return "小白花";
  }

  if (type === "empty") {
    return "安全空格";
  }

  return "天敌格";
}

function getTileVisualType(tileState) {
  return tileState.revealed ? tileState.type : "hidden";
}

function getTileAsset(tileState) {
  return tileAssetMap[getTileVisualType(tileState)] ?? tileAssetMap.hidden;
}

function clampColorChannel(value) {
  return Math.max(0, Math.min(255, Math.round(value)));
}

function buildSanitizedEnemyOverlayAsset(image) {
  if (!hasDom) {
    return null;
  }

  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const context = canvas.getContext("2d", { willReadFrequently: true });

  if (!context) {
    return null;
  }

  context.drawImage(image, 0, 0);
  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  const { data, width, height } = imageData;
  let matteRed = 0;
  let matteGreen = 0;
  let matteBlue = 0;
  let matteCount = 0;

  const sampleTransparentPixel = (x, y) => {
    const index = (y * width + x) * 4;
    if (data[index + 3] !== 0) {
      return;
    }

    matteRed += data[index];
    matteGreen += data[index + 1];
    matteBlue += data[index + 2];
    matteCount += 1;
  };

  for (let x = 0; x < width; x += 1) {
    sampleTransparentPixel(x, 0);
    sampleTransparentPixel(x, height - 1);
  }

  for (let y = 1; y < height - 1; y += 1) {
    sampleTransparentPixel(0, y);
    sampleTransparentPixel(width - 1, y);
  }

  if (matteCount === 0) {
    return null;
  }

  const matteColor = {
    red: matteRed / matteCount,
    green: matteGreen / matteCount,
    blue: matteBlue / matteCount,
  };

  for (let index = 0; index < data.length; index += 4) {
    const alpha = data[index + 3] / 255;

    if (alpha <= 0 || alpha >= 1) {
      continue;
    }

    const inverseAlpha = 1 - alpha;
    data[index] = clampColorChannel((data[index] - matteColor.red * inverseAlpha) / alpha);
    data[index + 1] = clampColorChannel(
      (data[index + 1] - matteColor.green * inverseAlpha) / alpha
    );
    data[index + 2] = clampColorChannel(
      (data[index + 2] - matteColor.blue * inverseAlpha) / alpha
    );
  }

  context.putImageData(imageData, 0, 0);
  return canvas.toDataURL("image/png");
}

function prepareEnemyOverlayAsset() {
  if (!hasDom) {
    return;
  }

  const image = new Image();
  image.addEventListener(
    "load",
    () => {
      const sanitizedAsset = buildSanitizedEnemyOverlayAsset(image);

      if (!sanitizedAsset) {
        return;
      }

      enemyOverlayDisplayAsset = sanitizedAsset;
      renderAll();
    },
    { once: true }
  );
  image.src = enemyOverlayAsset;
}

function getTileVisualMarkup(tileState, fallbackAsset) {
  if (tileState?.revealed && isSafeTileType(tileState.type)) {
    const threatEdges = getThreatEdgeDirections(tileState);

    return `
      <span class="tile__image-stack tile__image-stack--safe">
        <img class="tile__image tile__image--base" src="${tileAssetMap.empty}" alt="" />
        ${threatEdges
          .map(
            (edge) =>
              `<img class="tile__image tile__image--layer tile__image--threat-edge" src="${threatEdgeAssetMap[edge]}" alt="" />`
          )
          .join("")}
        ${
          tileState.type === "flower"
            ? `<img class="tile__image tile__image--layer tile__image--flower" src="${flowerOverlayAsset}" alt="" />`
            : ""
        }
      </span>
    `;
  }

  if (tileState?.revealed && tileState.type === "enemy") {
    return `
      <span class="tile__image-stack tile__image-stack--enemy">
        <img class="tile__image tile__image--base" src="${tileAssetMap.enemy}" alt="" />
        <img class="tile__image tile__image--layer tile__image--enemy" src="${enemyOverlayDisplayAsset}" alt="" />
      </span>
    `;
  }

  return `<img class="tile__image" src="${fallbackAsset}" alt="" />`;
}

function getThreatEdgeDirection(tileId, neighborId) {
  const tile = tilesById[tileId];
  const neighbor = tilesById[neighborId];

  if (!tile || !neighbor) {
    return null;
  }

  const dx = neighbor.slotX - tile.slotX;
  const dy = neighbor.row - tile.row;

  if (dy === 0 && dx === -2) {
    return "left";
  }

  if (dy === 0 && dx === 2) {
    return "right";
  }

  if (dy === -1 && dx === -1) {
    return "upper-left";
  }

  if (dy === -1 && dx === 1) {
    return "upper-right";
  }

  if (dy === 1 && dx === -1) {
    return "lower-left";
  }

  if (dy === 1 && dx === 1) {
    return "lower-right";
  }

  return null;
}

function getThreatEdgeDirections(tileState) {
  if (!tileState?.revealed || !isSafeTileType(tileState.type)) {
    return [];
  }

  return tileState.neighbors
    .filter((neighborId) => {
      const neighborState = gameState.tileStateMap[neighborId];
      return neighborState?.type === "enemy" && !neighborState.revealed;
    })
    .map((neighborId) => getThreatEdgeDirection(tileState.id, neighborId))
    .filter(Boolean);
}

function getCurrentTileId() {
  if (gameState.currentPath.length === 0) {
    return gameState.currentStartTileId;
  }

  return gameState.currentPath[gameState.currentPath.length - 1];
}

function isValidStartCandidate(tileId) {
  const tileState = gameState.tileStateMap[tileId];
  return !!tileState && tileState.revealed && (tileState.type === "flower" || tileState.type === "empty");
}

function getDisplayStartTileId() {
  return gameState.currentStartTileId ?? gameState.lastEndedTileId ?? null;
}

function playStartSelectSound() {
  // RULE-01 预留：后续可接入 assets/audio/sfx/select-start.wav
}

function canEnterTile(tileId) {
  if (!gameState.isDragging || !tileId) {
    return false;
  }

  const currentTileId = getCurrentTileId();

  if (tileId === currentTileId) {
    return false;
  }

  return adjacencyMap[currentTileId].includes(tileId);
}

function renderHud() {
  if (!dom) {
    return;
  }

  dom.totalHoney.textContent = `${gameState.totalHoney} / ${honeyGoalTarget}`;
  if (feedbackState.isHudRolling) {
    renderRoundHoneyValue(feedbackState.hudRollingFrom, feedbackState.hudRollingTo);
  } else {
    renderRoundHoneyValue(gameState.roundHoney);
  }
  dom.beesLeft.textContent = String(gameState.remainingBees);

  dom.totalHoney.closest(".hud-card")?.classList.toggle("hud-card--pulse", gameState.totalHoneyPulse);

  if (dom.statusText) {
    dom.statusText.textContent = gameState.statusText;
    dom.statusText.className = [
      "status-text",
      gameState.lastOutcome === "failure" ? "status-text--fail" : "",
      gameState.lastOutcome === "success" ? "status-text--success" : "",
      gameState.isGameOver ? "status-text--game-over" : "",
    ]
      .filter(Boolean)
      .join(" ");
  }

  if (dom.toast) {
    dom.toast.textContent = gameState.toastMessage;
    dom.toast.className = [
      "toast",
      gameState.toastMessage ? "toast--visible" : "",
      gameState.toastTone ? `toast--${gameState.toastTone}` : "",
    ]
      .filter(Boolean)
      .join(" ");
  }

  if (dom.gameOver && dom.gameOverSummary) {
    // 通关时优先显示 win 面板，game-over 面板隐藏
    dom.gameOver.hidden = gameState.isGameWin || !gameState.isGameOver;
    dom.gameOverSummary.textContent = `总花蜜：${gameState.totalHoney}`;
  }

  if (dom.gameWin && dom.gameWinSummary) {
    dom.gameWin.hidden = !gameState.isGameWin;
    dom.gameWinSummary.textContent = `已达成目标 ${honeyGoalTarget}，实际花蜜 ${gameState.totalHoney}`;
  }
}

function createTileElement(tile, appearanceFrameMap = {}) {
  const state = gameState.tileStateMap[tile.id];
  const isRevealed = state.revealed;
  const displayStartTileId = getDisplayStartTileId();
  const isStart = tile.id === displayStartTileId;
  const isInPath = gameState.currentPath.includes(tile.id);
  const isEnemy = isRevealed && state.type === "enemy";
  const isShaking = gameState.shakeTileIds.includes(tile.id);
  const isInvalidFlashing = gameState.invalidFlashTileIds.includes(tile.id);
  const isStartPulse = tile.id === gameState.startPulseTileId;
  const isFlipping = gameState.flipTileIds.includes(tile.id);
  const isStartCandidate = !gameState.isDragging && !gameState.isGameOver && isValidStartCandidate(tile.id);
  const appearanceMeta = appearanceFrameMap[tile.id] ?? null;
  const visibleDangerCount = getVisibleDangerCount(tile.id);
  const tileAsset = getTileAsset(state);
  const ariaState = isRevealed
    ? `已解锁，${getTileTypeLabel(state.type)}，周围天敌 ${state.dangerCount}`
    : visibleDangerCount === null
      ? "未解锁"
      : `未解锁，边界数字 ${visibleDangerCount}`;

  const button = document.createElement("button");
  button.type = "button";
  button.className = [
    "tile",
    isRevealed ? "tile--revealed" : "tile--locked",
    isStart ? "tile--start" : "",
    isStartCandidate ? "tile--start-candidate" : "",
    isStartPulse ? "tile--start-pulse" : "",
    isInvalidFlashing ? "tile--invalid-flash" : "",
    isInPath ? "tile--path" : "",
    isEnemy ? "tile--enemy" : "",
    isShaking ? "tile--shake" : "",
    isFlipping ? "tile--flipping" : "",
    appearanceMeta ? "tile--appearing" : "",
  ]
    .filter(Boolean)
    .join(" ");
  button.style.setProperty(
    "--left",
    `${boardMetrics.leftPadding + tile.slotX * boardMetrics.xUnit}px`
  );
  button.style.setProperty(
    "--top",
    `${boardMetrics.topPadding + tile.row * boardMetrics.yUnit}px`
  );
  if (appearanceMeta) {
    button.style.setProperty("--tile-appear-delay", `${appearanceMeta.delayMs}ms`);
    button.style.setProperty("--tile-appear-duration", `${tileAppearConfig.durationMs}ms`);
    button.style.setProperty("--tile-appear-start-scale", String(tileAppearConfig.startScale));
    button.style.setProperty(
      "--tile-appear-overshoot-scale",
      String(tileAppearConfig.overshootScale)
    );
    button.style.setProperty("--tile-appear-easing", tileAppearConfig.easing);
  }
  button.style.setProperty("--tile-image", `url("${tileAsset}")`);
  button.dataset.tileId = tile.id;
  button.dataset.row = String(tile.row);
  button.dataset.col = String(tile.col);
  button.dataset.slotX = String(tile.slotX);
  button.dataset.type = isRevealed ? state.type : "hidden";
  button.dataset.revealed = String(isRevealed);
  button.dataset.dangerCount = String(state.dangerCount);
  button.dataset.visibleDangerCount = visibleDangerCount === null ? "" : String(visibleDangerCount);
  button.dataset.neighbors = state.neighbors.join(",");
  button.setAttribute(
    "aria-label",
    `${tile.id}，${isStartCandidate ? "可作为起点，" : ""}${ariaState}${isInPath ? "，已在当前路径中" : ""}`
  );

  const innerInnerHtml = isFlipping
    ? `
      <span class="tile__face tile__face--front" aria-hidden="true">
        <img class="tile__image" src="${tileAssetMap.hidden}" alt="" />
      </span>
      <span class="tile__face tile__face--back" aria-hidden="true">
        ${getTileVisualMarkup(state, tileAsset)}
      </span>
    `
    : getTileVisualMarkup(state, tileAsset);

  button.innerHTML = `
    <span class="tile__ring" aria-hidden="true"></span>
    <span class="tile__inner" aria-hidden="true">${innerInnerHtml}</span>
    <span class="tile__label">${tile.id}</span>
    ${
      visibleDangerCount === null
        ? ""
        : `<span class="tile__danger" aria-hidden="true">${visibleDangerCount}</span>`
    }
    <span class="tile__meta">r${tile.row + 1} · c${tile.col + 1}</span>
  `;

  return button;
}

function renderBoard() {
  if (!dom?.board) {
    return;
  }

  const visibleTileIds = getVisibleTileIds();
  const appearanceFrameMap = buildTileAppearanceFrameMap(visibleTileIds);
  dom.board.classList.toggle("board--fail-flash", gameState.isFailFlash);
  dom.board.classList.toggle("board--collecting", gameState.isDragging);
  dom.board.innerHTML = "";
  const fragment = document.createDocumentFragment();

  tiles.forEach((tile) => {
    if (!visibleTileIds.has(tile.id)) {
      return;
    }

    fragment.appendChild(createTileElement(tile, appearanceFrameMap));
  });

  dom.board.appendChild(fragment);
}

function renderAll() {
  renderHud();
  renderBoard();
}

function restartGame(options = {}) {
  clearFeedbackTimers();
  endCombo({ immediate: true });
  resetCollectionFeedback({ resetRunToken: true, clearFlights: true, resetDisplay: true });
  const nextOptions = {
    ...options,
    previousState: gameState,
  };
  gameState = createInitialGameState(nextOptions);
  logEvent("初始化地图完成", {
    seed: gameState.currentSeed,
    source: gameState.roundConfigSource,
    summary: summarizeTileTypes(gameState.tileStateMap),
    roundConfig: getRoundConfigSnapshot(),
  });
  renderAll();
  syncDebugHandle();
  return gameState;
}

function beginRun(tileId, pointerId = null) {
  if (gameState.isDragging) {
    return { ok: false, reason: "already-dragging" };
  }

  if (gameState.isGameOver || gameState.remainingBees <= 0) {
    gameState.isGameOver = true;
    gameState.statusText = `游戏结束 · 总花蜜：${gameState.totalHoney}`;
    showToast("游戏结束", "game-over");
    renderHud();
    return { ok: false, reason: "no-bees" };
  }

  if (gameState.currentStartTileId === null) {
    if (!isValidStartCandidate(tileId)) {
      gameState.statusText = "不能从这里出发，请选择已翻开的非天敌格。";
      renderHud();
      return { ok: false, reason: "invalid-start" };
    }
  } else if (tileId !== gameState.currentStartTileId) {
    gameState.statusText = `请从当前起点 ${gameState.currentStartTileId} 开始。`;
    renderHud();
    return { ok: false, reason: "invalid-start" };
  }

  resetCollectionFeedback({ resetRunToken: true, clearFlights: true, resetDisplay: true });
  primeCollectAudio();
  gameState.currentStartTileId = tileId;
  gameState.isDragging = true;
  gameState.dragPointerId = pointerId;
  gameState.currentPath = [tileId];
  gameState.currentRunVisitedTileIds = new Set([tileId]);
  gameState.currentRunHoney = 0;
  syncRoundHoney(0);
  gameState.lastSafeTileId = tileId;
  gameState.hasHitEnemy = false;
  gameState.lastOutcome = null;
  playStartSelectSound();
  triggerStartPulse(tileId);
  gameState.statusText = "采集中：滑入相邻格，松手后结算。";
  logEvent("新一轮开始", {
    currentStartTileId: tileId,
    remainingBees: gameState.remainingBees,
  });
  renderAll();

  return { ok: true, reason: "started" };
}

function completeRun(outcome) {
  if (!gameState.isDragging && gameState.currentPath.length === 0 && outcome !== "failure") {
    return { ok: false, reason: "idle" };
  }

  const path = [...gameState.currentPath];
  const pathLength = path.length;
  const consumedBee = pathLength >= 2;
  const nextStartTileId = gameState.lastSafeTileId;

  gameState.lastConsumedBee = consumedBee;

  if (consumedBee) {
    gameState.remainingBees -= 1;
  } else {
    logEvent("本轮蜜蜂未消耗", {
      outcome,
      path,
      pathLength,
      remainingBees: gameState.remainingBees,
    });
  }

  if (outcome === "failure") {
    gameState.lastEndedTileId = nextStartTileId;
    gameState.currentStartTileId = null;
    gameState.currentRunHoney = 0;
    resetCollectionFeedback({ resetRunToken: true, clearFlights: true, resetDisplay: true });
    gameState.statusText = consumedBee ? "踩到天敌，本轮失败。" : "本轮失败，蜜蜂未消耗。";
    showToast(gameState.statusText, consumedBee ? "fail" : "info");
    logEvent("本轮失败结算", {
      path,
      pathLength,
      consumedBee,
      nextStartTileId,
      totalHoney: gameState.totalHoney,
    });
  } else {
    const gainedHoney = gameState.currentRunHoney;
    gameState.totalHoney += gainedHoney;
    gameState.lastEndedTileId = nextStartTileId;
    gameState.currentStartTileId = null;
    gameState.currentRunHoney = 0;
    queueRoundHoneyReset();
    gameState.statusText = consumedBee
      ? `本轮成功，获得 ${gainedHoney} 花蜜。`
      : "本轮未采集，蜜蜂未消耗。";
    triggerSuccessFeedback(nextStartTileId, gainedHoney, {
      message: gameState.statusText,
      tone: consumedBee ? "success" : "info",
    });
    logEvent("本轮成功结算", {
      path,
      pathLength,
      consumedBee,
      gainedHoney,
      totalHoney: gameState.totalHoney,
      nextStartTileId,
    });
  }

  gameState.isDragging = false;
  gameState.dragPointerId = null;
  gameState.currentPath = [];
  gameState.currentRunVisitedTileIds = new Set();
  gameState.hasHitEnemy = false;
  gameState.lastOutcome = outcome;
  if (outcome === "success" && gameState.totalHoney >= honeyGoalTarget) {
    gameState.isGameWin = true;
    gameState.isGameOver = true;
    gameState.statusText = `恭喜通关！总花蜜：${gameState.totalHoney}`;
    showToast("恭喜通关！", "success");
    logEvent("通关", getStateSnapshot());
  } else if (outcome === "failure") {
    updateGameOverState();
  } else if (gameState.remainingBees <= 0) {
    updateGameOverState();
  }
  renderAll();

  return {
    ok: true,
    reason: outcome,
    path,
    nextStartTileId,
  };
}

function extendRun(tileId) {
  if (!gameState.isDragging) {
    return { ok: false, reason: "not-dragging" };
  }

  if (!canEnterTile(tileId)) {
    return { ok: false, reason: "invalid-step" };
  }

  const tileState = gameState.tileStateMap[tileId];
  const wasRevealed = tileState.revealed;
  gameState.currentPath.push(tileId);
  gameState.currentRunVisitedTileIds.add(tileId);

  if (tileState.type === "enemy") {
    setTileRevealed(tileId);
    playTileEnemyHitSound();
    gameState.hasHitEnemy = true;
    gameState.statusText = `踩到天敌 ${tileId}，本轮花蜜清零。`;
    logEvent("踩到天敌", {
      tileId,
      path: [...gameState.currentPath],
      lastSafeTileId: gameState.lastSafeTileId,
    });
    triggerFailFeedback([tileId, ...gameState.currentPath]);
    renderAll();
    return completeRun("failure");
  }

  setTileRevealed(tileId);
  gameState.lastSafeTileId = tileId;

  if (tileState.type === "flower" && !wasRevealed) {
    gameState.currentRunHoney += 1;
    incrementCombo(tileId);
    spawnFlowerFlyEffect(tileId);
    gameState.statusText = `采到小白花：本轮暂存花蜜 ${gameState.currentRunHoney}。`;
  } else if (tileState.type === "flower") {
    gameState.statusText = `经过已采集花格 ${tileId}。`;
  } else if (!wasRevealed) {
    gameState.statusText = `进入新安全格 ${tileId}。`;
  } else {
    gameState.statusText = `经过已采集安全格 ${tileId}。`;
  }

  playTileRevealSound();

  logEvent("路径加入格子", {
    tileId,
    tileType: tileState.type,
    path: [...gameState.currentPath],
    currentRunHoney: gameState.currentRunHoney,
  });

  renderAll();
  return { ok: true, reason: "moved", tileId, tileType: tileState.type };
}

function endRun() {
  if (!gameState.isDragging) {
    return { ok: false, reason: "not-dragging" };
  }

  return completeRun("success");
}

function getTileIdFromPointerPosition(clientX, clientY) {
  if (!hasDom) {
    return null;
  }

  const tileElement = document.elementFromPoint(clientX, clientY)?.closest?.(".tile");
  return tileElement?.dataset?.tileId ?? null;
}

function releasePointer(pointerId) {
  if (!dom?.board || pointerId === null || pointerId === undefined) {
    return;
  }

  if (dom.board.hasPointerCapture?.(pointerId)) {
    dom.board.releasePointerCapture(pointerId);
  }
}

function handlePointerDown(event) {
  const tileElement = event.target.closest?.(".tile");

  if (!tileElement) {
    return;
  }

  const tileId = tileElement.dataset.tileId;

  if (gameState.isGameOver || gameState.remainingBees <= 0) {
    gameState.isGameOver = true;
    gameState.statusText = `游戏结束 · 总花蜜：${gameState.totalHoney}`;
    triggerInvalidStartFeedback(tileId, { message: "游戏结束", tone: "game-over" });
    return;
  }

  if (gameState.currentStartTileId === null && !isValidStartCandidate(tileId)) {
    gameState.statusText = "不能从这里出发，请选择已翻开的非天敌格。";
    triggerInvalidStartFeedback(tileId);
    return;
  }

  const result = beginRun(tileId, event.pointerId);

  if (!result.ok) {
    if (result.reason === "invalid-start") {
      triggerInvalidStartFeedback(tileId, {
        message:
          gameState.currentStartTileId === null
            ? "不能从这里出发，请选择已翻开的非天敌格"
            : `请从当前起点 ${gameState.currentStartTileId} 开始`,
      });
    }
    return;
  }

  dom.board?.setPointerCapture?.(event.pointerId);
  event.preventDefault();
}

function handlePointerMove(event) {
  if (!gameState.isDragging || gameState.dragPointerId !== event.pointerId) {
    return;
  }

  const hoveredTileId = getTileIdFromPointerPosition(event.clientX, event.clientY);

  if (!hoveredTileId) {
    return;
  }

  const result = extendRun(hoveredTileId);

  if (result.reason === "failure") {
    releasePointer(event.pointerId);
  }
}

function handlePointerUp(event) {
  if (gameState.dragPointerId !== event.pointerId) {
    return;
  }

  endRun();
  releasePointer(event.pointerId);
}

function handlePointerCancel(event) {
  if (gameState.dragPointerId !== event.pointerId) {
    return;
  }

  endRun();
  releasePointer(event.pointerId);
}

const customCursorState = {
  element: null,
  pointerId: null,
  isActive: false,
  pendingX: 0,
  pendingY: 0,
  rafId: null,
  hideTimer: null,
};

const CUSTOM_CURSOR_FADE_MS = 180;

function getCustomCursorElement() {
  if (!hasDom) {
    return null;
  }

  if (!customCursorState.element) {
    customCursorState.element = document.getElementById("custom-cursor");
  }

  return customCursorState.element;
}

function applyCustomCursorPosition() {
  customCursorState.rafId = null;
  const element = getCustomCursorElement();
  if (!element || !customCursorState.isActive) {
    return;
  }

  element.style.transform = `translate3d(${customCursorState.pendingX}px, ${customCursorState.pendingY}px, 0)`;
}

function scheduleCustomCursorPosition(x, y) {
  customCursorState.pendingX = x;
  customCursorState.pendingY = y;

  if (customCursorState.rafId !== null) {
    return;
  }

  customCursorState.rafId = requestAnimationFrame(applyCustomCursorPosition);
}

function showCustomCursor(event) {
  const element = getCustomCursorElement();
  if (!element) {
    return;
  }

  if (customCursorState.hideTimer !== null) {
    clearTimeout(customCursorState.hideTimer);
    customCursorState.hideTimer = null;
  }

  customCursorState.isActive = true;
  customCursorState.pointerId = event.pointerId;
  document.body.classList.add("is-dragging-cursor");
  element.classList.remove("is-hiding");
  // 强制 reflow 让重启 pop 动画
  void element.offsetWidth;
  element.classList.add("is-active");

  customCursorState.pendingX = event.clientX;
  customCursorState.pendingY = event.clientY;
  element.style.transform = `translate3d(${event.clientX}px, ${event.clientY}px, 0)`;
}

function hideCustomCursor() {
  const element = getCustomCursorElement();
  if (!element || !customCursorState.isActive) {
    return;
  }

  customCursorState.isActive = false;
  customCursorState.pointerId = null;
  element.classList.remove("is-active");
  element.classList.add("is-hiding");
  document.body.classList.remove("is-dragging-cursor");

  if (customCursorState.rafId !== null) {
    cancelAnimationFrame(customCursorState.rafId);
    customCursorState.rafId = null;
  }

  if (customCursorState.hideTimer !== null) {
    clearTimeout(customCursorState.hideTimer);
  }

  customCursorState.hideTimer = setTimeout(() => {
    customCursorState.hideTimer = null;
    if (!customCursorState.isActive) {
      element.classList.remove("is-hiding");
    }
  }, CUSTOM_CURSOR_FADE_MS);
}

function handleCustomCursorPointerDown(event) {
  if (event.pointerType && event.pointerType !== "mouse") {
    return;
  }

  if (event.button !== undefined && event.button !== 0) {
    return;
  }

  showCustomCursor(event);
}

function handleCustomCursorPointerMove(event) {
  if (!customCursorState.isActive) {
    return;
  }

  if (
    customCursorState.pointerId !== null &&
    event.pointerId !== undefined &&
    event.pointerId !== customCursorState.pointerId
  ) {
    return;
  }

  scheduleCustomCursorPosition(event.clientX, event.clientY);
}

function handleCustomCursorPointerEnd(event) {
  if (!customCursorState.isActive) {
    return;
  }

  if (
    customCursorState.pointerId !== null &&
    event.pointerId !== undefined &&
    event.pointerId !== customCursorState.pointerId
  ) {
    return;
  }

  hideCustomCursor();
}

function attachCustomCursorListeners() {
  if (!hasDom) {
    return;
  }

  const cursorEl = getCustomCursorElement();
  if (!cursorEl) {
    return;
  }

  const cursorImage = document.getElementById("custom-cursor-image");
  if (cursorImage && cursorImage.getAttribute("src") !== customCursorAsset) {
    cursorImage.src = customCursorAsset;
  }

  window.addEventListener("pointerdown", handleCustomCursorPointerDown, { passive: true });
  window.addEventListener("pointermove", handleCustomCursorPointerMove, { passive: true });
  window.addEventListener("pointerup", handleCustomCursorPointerEnd, { passive: true });
  window.addEventListener("pointercancel", handleCustomCursorPointerEnd, { passive: true });
  window.addEventListener("blur", () => hideCustomCursor());
}

function attachEventListeners() {
  if (!dom?.board) {
    return;
  }

  dom.board.addEventListener("pointerdown", handlePointerDown);
  dom.board.addEventListener("pointermove", handlePointerMove);
  dom.board.addEventListener("pointerup", handlePointerUp);
  dom.board.addEventListener("pointercancel", handlePointerCancel);
  attachCustomCursorListeners();
  const restartHandler = () => {
    const previousSeed = gameState.currentSeed;
    restartGame();
    logEvent("重新开始", {
      previousSeed,
      nextSeed: gameState.currentSeed,
    });
  };
  dom.restartButton?.addEventListener("click", restartHandler);
  dom.restartWinButton?.addEventListener("click", restartHandler);
  window.addEventListener("resize", applyResponsiveGameScale);
}

function getSerializableTileStateMap() {
  return Object.fromEntries(
    Object.entries(gameState.tileStateMap).map(([tileId, tileState]) => [
      tileId,
      {
        ...tileState,
        neighbors: [...tileState.neighbors],
      },
    ])
  );
}

function syncDebugHandle() {
  const root = typeof window !== "undefined" ? window : globalThis;

  root.demoBoard = {
    layoutRows,
    rowTileIds,
    rowSlots,
    startTileId,
    tileTypeCounts,
    tiles,
    tilesById,
    adjacencyMap,
    get gameState() {
      return gameState;
    },
    get tileStateMap() {
      return getSerializableTileStateMap();
    },
    get feedbackState() {
      return {
        currentRunToken: feedbackState.currentRunToken,
        nextLaunchAt: feedbackState.nextLaunchAt,
        pendingLaunchCount: feedbackState.pendingLaunchCount,
        activeFlightCount: feedbackState.activeFlights.size,
        hudDisplayedValue: feedbackState.hudDisplayedValue,
        hudTargetValue: feedbackState.hudTargetValue,
        isHudRolling: feedbackState.isHudRolling,
        shouldResetRoundHoney: feedbackState.shouldResetRoundHoney,
      };
    },
    get contentSummary() {
      return summarizeTileTypes(gameState.tileStateMap);
    },
    get comboState() {
      return {
        count: comboState.count,
        lastTriggerAt: comboState.lastTriggerAt,
        isVisible: comboState.isVisible,
        lastTileId: comboState.lastTileId,
      };
    },
    get tileAppearConfig() {
      return getTileAppearConfigSnapshot();
    },
    createInitialGameState,
    hasRevealedNeighbor,
    getVisibleDangerCount,
    getThreatEdgeDirection,
    getThreatEdgeDirections,
    isValidStartCandidate,
    getDisplayStartTileId,
    playStartSelectSound,
    playInvalidStartSound,
    endCombo,
    beginRun,
    extendRun,
    endRun,
    spawnFlowerFlyEffect,
    getRoundConfigSnapshot,
    getStateSnapshot,
    setTileAppearConfig(nextConfig = {}) {
      return applyTileAppearConfig(nextConfig);
    },
    resetGame(options = {}) {
      return restartGame(options);
    },
  };
}

const bgmState = {
  audio: null,
  button: null,
  muted: false,
  hasStarted: false,
  pendingStart: false,
};

function readBgmMutedPref() {
  try {
    if (typeof localStorage === "undefined") {
      return false;
    }
    return localStorage.getItem(bgmConfig.storageKey) === "1";
  } catch (_error) {
    return false;
  }
}

function writeBgmMutedPref(muted) {
  try {
    if (typeof localStorage === "undefined") {
      return;
    }
    localStorage.setItem(bgmConfig.storageKey, muted ? "1" : "0");
  } catch (_error) {
    // 忽略写入失败
  }
}

function updateBgmButtonView() {
  if (!bgmState.button) {
    return;
  }
  bgmState.button.dataset.bgm = bgmState.muted ? "off" : "on";
  bgmState.button.setAttribute("aria-pressed", bgmState.muted ? "true" : "false");
}

function tryStartBgm() {
  if (!bgmState.audio || bgmState.hasStarted) {
    return;
  }

  const playResult = bgmState.audio.play();
  if (playResult && typeof playResult.then === "function") {
    playResult
      .then(() => {
        bgmState.hasStarted = true;
        bgmState.pendingStart = false;
      })
      .catch(() => {
        // 自动播放被拦截，等待首次用户交互
        bgmState.pendingStart = true;
        attachBgmFirstGestureListeners();
      });
  } else {
    bgmState.hasStarted = true;
  }
}

function handleBgmFirstGesture() {
  if (!bgmState.audio) {
    return;
  }
  detachBgmFirstGestureListeners();
  bgmState.pendingStart = false;
  bgmState.hasStarted = false;
  tryStartBgm();
}

function attachBgmFirstGestureListeners() {
  if (!hasDom) {
    return;
  }
  window.addEventListener("pointerdown", handleBgmFirstGesture, { once: true });
  window.addEventListener("keydown", handleBgmFirstGesture, { once: true });
  window.addEventListener("touchstart", handleBgmFirstGesture, { once: true, passive: true });
}

function detachBgmFirstGestureListeners() {
  if (!hasDom) {
    return;
  }
  window.removeEventListener("pointerdown", handleBgmFirstGesture);
  window.removeEventListener("keydown", handleBgmFirstGesture);
  window.removeEventListener("touchstart", handleBgmFirstGesture);
}

function setBgmMuted(muted) {
  bgmState.muted = !!muted;
  if (bgmState.audio) {
    bgmState.audio.muted = bgmState.muted;
    if (!bgmState.muted && !bgmState.hasStarted) {
      tryStartBgm();
    }
  }
  writeBgmMutedPref(bgmState.muted);
  updateBgmButtonView();
}

function initBgm() {
  if (!hasDom || typeof Audio === "undefined") {
    return;
  }

  try {
    const audio = new Audio(audioAssetMap.bgmMain);
    audio.loop = true;
    audio.preload = "auto";
    audio.volume = bgmConfig.defaultVolume;
    bgmState.audio = audio;
  } catch (_error) {
    bgmState.audio = null;
  }

  bgmState.button = document.getElementById("bgm-toggle");
  bgmState.muted = readBgmMutedPref();
  if (bgmState.audio) {
    bgmState.audio.muted = bgmState.muted;
  }
  updateBgmButtonView();

  if (bgmState.button) {
    bgmState.button.addEventListener("click", (event) => {
      event.preventDefault();
      setBgmMuted(!bgmState.muted);
    });
  }

  tryStartBgm();
}

function init() {
  validateLayoutConfig();
  computeBoardSize();
  attachEventListeners();
  restartGame();
  prepareEnemyOverlayAsset();
  initBgm();
}

init();
