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
const initialBeeCount = 10;
const initialStatusText = "按住当前起点并滑动，松手后结算本轮。";
const animationDurations = {
  failFlash: 420,
  shake: 420,
  startPulse: 800,
  honeyPulse: 480,
  toast: 1400,
};
const tileAssetMap = {
  hidden: "./assets/tiles/tile-unknown.png",
  empty: "./assets/tiles/tile-empty.png",
  enemy: "./assets/tiles/tile-enemy.png",
  flower: "./assets/tiles/tile-flower.png",
};
const tileTypeCounts = {
  enemy: 3,
  flower: 8,
  empty: 8,
};

const boardMetrics = {
  leftPadding: 36,
  topPadding: 62,
  xUnit: 66,
  yUnit: 99,
};

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

function validateLayoutConfig() {
  const rowCountMatches =
    layoutRows.length === rowTileIds.length && layoutRows.length === rowSlots.length;
  const everyRowMatches = layoutRows.every(
    (count, index) => rowTileIds[index].length === count && rowSlots[index].length === count
  );
  const allTileIds = rowTileIds.flat();
  const totalTiles = layoutRows.reduce((sum, count) => sum + count, 0);
  const uniqueTileCount = new Set(allTileIds).size;
  const expectedTotal = Object.values(tileTypeCounts).reduce((sum, count) => sum + count, 0);

  if (!rowCountMatches || !everyRowMatches || totalTiles !== 19 || uniqueTileCount !== 19) {
    throw new Error("固定盘面配置非法，请检查 layoutRows / rowTileIds / rowSlots");
  }

  if (!allTileIds.includes(startTileId)) {
    throw new Error("固定起点不存在于盘面配置中");
  }

  if (expectedTotal !== 19) {
    throw new Error("格子内容数量配置非法，请检查 enemy / flower / empty 总数");
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
    throw new Error("自定义 typeMap 不满足 3 / 8 / 8 数量约束");
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
    currentRunHoney: 0,
    lastSafeTileId: startTileId,
    hasHitEnemy: false,
    statusText: initialStatusText,
    lastOutcome: null,
    isFailFlash: false,
    shakeTileIds: [],
    toastMessage: "",
    toastTone: "",
    totalHoneyPulse: false,
    startPulseTileId: null,
    isGameOver: false,
    tileStateMap,
  };
}

let gameState = createInitialGameState();
let feedbackTimers = [];

const dom = hasDom
  ? {
      board: document.getElementById("board"),
      totalHoney: document.getElementById("total-honey"),
      roundHoney: document.getElementById("round-honey"),
      beesLeft: document.getElementById("bees-left"),
      statusText: document.getElementById("status-text"),
      toast: document.getElementById("toast"),
      gameOver: document.getElementById("game-over"),
      gameOverSummary: document.getElementById("game-over-summary"),
      restartButton: document.getElementById("restart-button"),
    }
  : null;

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

function triggerSuccessFeedback(tileId, gainedHoney) {
  if (gainedHoney > 0) {
    gameState.totalHoneyPulse = true;
  }

  gameState.startPulseTileId = tileId;
  showToast(gainedHoney > 0 ? `结算成功 +${gainedHoney}` : "采集成功", "success");
  triggerRenderOnly();

  if (gainedHoney > 0) {
    scheduleFeedback(() => {
      gameState.totalHoneyPulse = false;
      triggerRenderOnly();
    }, animationDurations.honeyPulse);
  }

  scheduleFeedback(() => {
    if (gameState.startPulseTileId === tileId) {
      gameState.startPulseTileId = null;
      triggerRenderOnly();
    }
  }, animationDurations.startPulse);
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
    remainingBees: gameState.remainingBees,
    totalHoney: gameState.totalHoney,
    roundHoney: gameState.roundHoney,
    isGameOver: gameState.isGameOver,
    currentPath: [...gameState.currentPath],
    lastOutcome: gameState.lastOutcome,
  };
}

function syncRoundHoney() {
  gameState.roundHoney = gameState.currentRunHoney;
}

function setTileRevealed(tileId) {
  const tileState = gameState.tileStateMap[tileId];
  tileState.revealed = true;
  tileState.unlocked = true;
  gameState.revealedTiles.add(tileId);
}

function isSafeTileType(type) {
  return type === "flower" || type === "empty";
}

function hasRevealedNeighbor(tileId) {
  return adjacencyMap[tileId].some((neighborId) => gameState.tileStateMap[neighborId].revealed);
}

function getVisibleDangerCount(tileId) {
  const state = gameState.tileStateMap[tileId];

  if (state.revealed || !hasRevealedNeighbor(tileId)) {
    return null;
  }

  return state.dangerCount;
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

function getCurrentTileId() {
  if (gameState.currentPath.length === 0) {
    return gameState.currentStartTileId;
  }

  return gameState.currentPath[gameState.currentPath.length - 1];
}

function canEnterTile(tileId) {
  if (!gameState.isDragging || !tileId) {
    return false;
  }

  const currentTileId = getCurrentTileId();

  if (tileId === currentTileId) {
    return false;
  }

  if (gameState.currentPath.includes(tileId)) {
    return false;
  }

  return adjacencyMap[currentTileId].includes(tileId);
}

function renderHud() {
  if (!dom) {
    return;
  }

  dom.totalHoney.textContent = String(gameState.totalHoney);
  dom.roundHoney.textContent = String(gameState.roundHoney);
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
    dom.gameOver.hidden = !gameState.isGameOver;
    dom.gameOverSummary.textContent = `总花蜜：${gameState.totalHoney}`;
  }
}

function createTileElement(tile) {
  const state = gameState.tileStateMap[tile.id];
  const isRevealed = state.revealed;
  const isStart = tile.id === gameState.currentStartTileId;
  const isInPath = gameState.currentPath.includes(tile.id);
  const isEnemy = isRevealed && state.type === "enemy";
  const isShaking = gameState.shakeTileIds.includes(tile.id);
  const isStartPulse = tile.id === gameState.startPulseTileId;
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
    isStartPulse ? "tile--start-pulse" : "",
    isInPath ? "tile--path" : "",
    isEnemy ? "tile--enemy" : "",
    isShaking ? "tile--shake" : "",
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
    `${tile.id}，${isStart ? "当前起点，" : ""}${ariaState}${isInPath ? "，已在当前路径中" : ""}`
  );

  button.innerHTML = `
    <span class="tile__ring" aria-hidden="true"></span>
    <span class="tile__inner" aria-hidden="true">
      <img class="tile__image" src="${tileAsset}" alt="" />
    </span>
    <span class="tile__label">${tile.id}</span>
    ${
      visibleDangerCount === null
        ? ""
        : `<span class="tile__danger" aria-hidden="true">${visibleDangerCount}</span>`
    }
    <span class="tile__meta">r${tile.row + 1} · c${tile.col + 1}</span>
    ${isStart ? '<span class="tile__badge">起点</span>' : ""}
  `;

  return button;
}

function renderBoard() {
  if (!dom?.board) {
    return;
  }

  dom.board.classList.toggle("board--fail-flash", gameState.isFailFlash);
  dom.board.innerHTML = "";
  const fragment = document.createDocumentFragment();

  tiles.forEach((tile) => {
    fragment.appendChild(createTileElement(tile));
  });

  dom.board.appendChild(fragment);
}

function renderAll() {
  renderHud();
  renderBoard();
}

function restartGame(options = {}) {
  clearFeedbackTimers();
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

  if (tileId !== gameState.currentStartTileId) {
    gameState.statusText = `请从当前起点 ${gameState.currentStartTileId} 开始。`;
    renderHud();
    return { ok: false, reason: "invalid-start" };
  }

  gameState.remainingBees -= 1;
  gameState.isDragging = true;
  gameState.dragPointerId = pointerId;
  gameState.currentPath = [tileId];
  gameState.currentRunHoney = 0;
  syncRoundHoney();
  gameState.lastSafeTileId = tileId;
  gameState.hasHitEnemy = false;
  gameState.lastOutcome = null;
  gameState.startPulseTileId = null;
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
  const nextStartTileId = gameState.lastSafeTileId;

  if (outcome === "failure") {
    gameState.currentStartTileId = nextStartTileId;
    gameState.currentRunHoney = 0;
    syncRoundHoney();
    gameState.statusText = `踩到天敌，本轮失败；下一轮从 ${nextStartTileId} 继续。`;
    logEvent("本轮失败结算", {
      path,
      nextStartTileId,
      totalHoney: gameState.totalHoney,
    });
  } else {
    const gainedHoney = gameState.currentRunHoney;
    gameState.totalHoney += gainedHoney;
    gameState.currentStartTileId = nextStartTileId;
    gameState.currentRunHoney = 0;
    syncRoundHoney();
    gameState.statusText =
      gainedHoney > 0
        ? `本轮成功，获得 ${gainedHoney} 花蜜；下一轮起点 ${nextStartTileId}。`
        : `本轮成功，未采到花蜜；下一轮起点 ${nextStartTileId}。`;
    triggerSuccessFeedback(nextStartTileId, gainedHoney);
    logEvent("本轮成功结算", {
      path,
      gainedHoney,
      totalHoney: gameState.totalHoney,
      nextStartTileId,
    });
  }

  gameState.isDragging = false;
  gameState.dragPointerId = null;
  gameState.currentPath = [];
  gameState.hasHitEnemy = false;
  gameState.lastOutcome = outcome;
  if (outcome === "failure") {
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
  gameState.currentPath.push(tileId);

  if (tileState.type === "enemy") {
    setTileRevealed(tileId);
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

  if (tileState.type === "flower") {
    gameState.currentRunHoney += 1;
    syncRoundHoney();
    gameState.statusText = `采到小白花：本轮暂存花蜜 ${gameState.currentRunHoney}。`;
  } else {
    gameState.statusText = `进入安全格 ${tileId}。`;
  }

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

  const result = beginRun(tileElement.dataset.tileId, event.pointerId);

  if (!result.ok) {
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

function attachEventListeners() {
  if (!dom?.board) {
    return;
  }

  dom.board.addEventListener("pointerdown", handlePointerDown);
  dom.board.addEventListener("pointermove", handlePointerMove);
  dom.board.addEventListener("pointerup", handlePointerUp);
  dom.board.addEventListener("pointercancel", handlePointerCancel);
  const restartHandler = () => {
    const previousSeed = gameState.currentSeed;
    restartGame();
    logEvent("重新开始", {
      previousSeed,
      nextSeed: gameState.currentSeed,
    });
  };
  dom.restartButton?.addEventListener("click", restartHandler);
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
    get contentSummary() {
      return summarizeTileTypes(gameState.tileStateMap);
    },
    createInitialGameState,
    hasRevealedNeighbor,
    getVisibleDangerCount,
    beginRun,
    extendRun,
    endRun,
    getRoundConfigSnapshot,
    getStateSnapshot,
    resetGame(options = {}) {
      return restartGame(options);
    },
  };
}

function init() {
  validateLayoutConfig();
  computeBoardSize();
  attachEventListeners();
  restartGame();
}

init();
