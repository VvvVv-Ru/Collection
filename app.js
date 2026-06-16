const lockedDangerPreviewCount = 3;
const tileTypeOrder = ["enemy", "flower", "flower_yellow", "flower_red", "apple_tree", "tulip", "tulip_white", "bee", "caterpillar", "empty"];

// ====== 关卡体系（A-PLN-LEVEL-DESIGN-16）======
// 三章 × 4 关 + 2 个真 rest + 1 伪 rest + 1 climax = 共 16 关。
// 每关都标注 4C Hooks 与 Kishōtenketsu 阶段。
// 详见 A-PLN.md "A-PLN-LEVEL-DESIGN-16" 章节。

// 7 / 9 / 11 / 13 / 16 / 19 / 22 盘面拓扑。
// 邻接规则要求相邻行 slot parity 必须相反（hex-like 行交错），且起点行至少有 3 个邻居。
const LAYOUT_7 = {
  layoutRows: [2, 3, 2],
  rowTileIds: [
    ["T01", "T02"],
    ["T03", "T04", "T05"],
    ["T07", "T06"],
  ],
  rowSlots: [[2, 4], [1, 3, 5], [2, 4]],
  startTileId: "T07",
};
const LAYOUT_9 = {
  layoutRows: [2, 3, 2, 2],
  rowTileIds: [
    ["T01", "T02"],
    ["T03", "T04", "T05"],
    ["T06", "T07"],
    ["T08", "T09"],
  ],
  rowSlots: [[2, 4], [1, 3, 5], [2, 4], [1, 3]],
  startTileId: "T09",
};
const LAYOUT_11 = {
  layoutRows: [2, 3, 3, 3],
  rowTileIds: [
    ["T01", "T02"],
    ["T03", "T04", "T05"],
    ["T06", "T07", "T08"],
    ["T09", "T10", "T11"],
  ],
  rowSlots: [[2, 4], [1, 3, 5], [2, 4, 6], [1, 3, 5]],
  startTileId: "T10",
};
const LAYOUT_13 = {
  layoutRows: [2, 3, 3, 3, 2],
  rowTileIds: [
    ["T01", "T02"],
    ["T03", "T04", "T05"],
    ["T06", "T07", "T08"],
    ["T09", "T10", "T11"],
    ["T13", "T12"],
  ],
  rowSlots: [[2, 4], [1, 3, 5], [2, 4, 6], [1, 3, 5], [2, 4]],
  startTileId: "T13",
};
const LAYOUT_16 = {
  layoutRows: [2, 3, 3, 3, 3, 2],
  rowTileIds: [
    ["T01", "T02"],
    ["T03", "T04", "T05"],
    ["T06", "T07", "T08"],
    ["T09", "T10", "T11"],
    ["T12", "T13", "T14"],
    ["T16", "T15"],
  ],
  rowSlots: [[2, 4], [1, 3, 5], [2, 4, 6], [1, 3, 5], [2, 4, 6], [3, 5]],
  startTileId: "T16",
};
const LAYOUT_19 = {
  layoutRows: [2, 2, 3, 3, 3, 3, 2, 1],
  rowTileIds: [
    ["T01", "T02"],
    ["T03", "T04"],
    ["T05", "T06", "T07"],
    ["T08", "T09", "T10"],
    ["T11", "T12", "T13"],
    ["T14", "T15", "T16"],
    ["T18", "T17"],
    ["T19"],
  ],
  rowSlots: [[2, 4], [1, 3], [2, 4, 6], [1, 3, 5], [2, 4, 6], [1, 3, 5], [2, 4], [3]],
  startTileId: "T18",
};
const LAYOUT_22 = {
  layoutRows: [2, 3, 3, 3, 3, 3, 3, 2],
  rowTileIds: [
    ["T01", "T02"],
    ["T03", "T04", "T05"],
    ["T06", "T07", "T08"],
    ["T09", "T10", "T11"],
    ["T12", "T13", "T14"],
    ["T15", "T16", "T17"],
    ["T18", "T19", "T20"],
    ["T22", "T21"],
  ],
  rowSlots: [
    [2, 4],
    [1, 3, 5],
    [2, 4, 6],
    [1, 3, 5],
    [2, 4, 6],
    [1, 3, 5],
    [2, 4, 6],
    [3, 5],
  ],
  startTileId: "T22",
};

const levelConfigs = [
  // ===== 第 1 章：拖动 → 鸟 → 苹果 → 综合 =====
  {
    // L1：7 格 mini 盘，零敌人零压力，纯拖动学习。
    id: "L1", name: "第 1 关 · 拖动起步", chapter: 1, layout: LAYOUT_7,
    tileTypeRatioBaseCounts: { enemy: 0, flower: 5, flower_yellow: 0, flower_red: 0, apple_tree: 0, tulip: 0, tulip_white: 0, bee: 0, caterpillar: 0, empty: 2 },
    initialBeeCount: 6,
    goalTargets: { flower: 4, flower_yellow: 0, flower_red: 0, apple: 0, appleFruit: 0, tulip: 0, tulip_white: 0 },
    enemyPlacementRule: "default",
    hooks: "学习：按住一朵花，拖向相邻的另一朵",
    intro: "盘面只有花，没有敌人；按住起点，向相邻格滑动，松手结算。",
    designerNotes: { expectedRunsToWin: 2, expectedFailRate: 0.0, kishoStage: "Introduce", rhythm: "valley" },
  },
  {
    // L2：9 格 mini 盘，首次出现 1 只鸟，安全路径外才会出现。
    id: "L2", name: "第 2 关 · 鸟来了", chapter: 1, layout: LAYOUT_9,
    tileTypeRatioBaseCounts: { enemy: 1, flower: 6, flower_yellow: 0, flower_red: 0, apple_tree: 0, tulip: 0, tulip_white: 0, bee: 0, caterpillar: 0, empty: 2 },
    initialBeeCount: 6,
    goalTargets: { flower: 4, flower_yellow: 0, flower_red: 0, apple: 0, appleFruit: 0, tulip: 0, tulip_white: 0 },
    enemyPlacementRule: "exclude-shortest-safe-path",
    hooks: "认识：撞鸟会让本轮收益清零、扣 1 只蜜蜂",
    intro: "盘上多了一只鸟。隔壁格的数字提醒你它在哪边——绕开它。",
    designerNotes: { expectedRunsToWin: 3, expectedFailRate: 0.1, kishoStage: "Introduce-Bird", rhythm: "valley→rise" },
  },
  {
    // L3：11 格，苹果树登场，1 棵 apple 学三态切换。
    id: "L3", name: "第 3 关 · 苹果开花了", chapter: 1, layout: LAYOUT_11,
    tileTypeRatioBaseCounts: { enemy: 1, flower: 7, flower_yellow: 0, flower_red: 0, apple_tree: 1, tulip: 0, tulip_white: 0, bee: 0, caterpillar: 0, empty: 2 },
    initialBeeCount: 6,
    goalTargets: { flower: 5, flower_yellow: 0, flower_red: 0, apple: 1, appleFruit: 0, tulip: 0, tulip_white: 0 },
    enemyPlacementRule: "exclude-shortest-safe-path",
    hooks: "认识：苹果树会换装（开花→结果→采空）",
    intro: "粉色花是苹果树。只有开花期能收，采过会变成果实，再下一轮才回到花期。",
    designerNotes: { expectedRunsToWin: 3, expectedFailRate: 0.15, kishoStage: "Twist", rhythm: "rise" },
  },
  {
    // L4：第 1 章 Conclude。鸟密度跳到 3，配 2 棵 apple。
    id: "L4", name: "第 4 关 · 第一章考核", chapter: 1, layout: LAYOUT_16,
    tileTypeRatioBaseCounts: { enemy: 3, flower: 9, flower_yellow: 0, flower_red: 0, apple_tree: 2, tulip: 0, tulip_white: 0, bee: 0, caterpillar: 0, empty: 2 },
    initialBeeCount: 6,
    goalTargets: { flower: 10, flower_yellow: 0, flower_red: 0, apple: 1, appleFruit: 0, tulip: 0, tulip_white: 0 },
    enemyPlacementRule: "default",
    hooks: "综合：花 + 苹果 + 3 只鸟",
    intro: "鸟更多了；记得用边界数字提前判断敌人位置。",
    designerNotes: { expectedRunsToWin: 6, expectedFailRate: 0.35, kishoStage: "Conclude", rhythm: "peak" },
  },

  // ===== 中场息期 1 =====
  {
    // L5 rest1：零敌人 + 蜂巢首次引入。纯白花海回血。
    id: "L5", name: "第 5 关 · 休息日 · 蜂巢初识", chapter: 0, layout: LAYOUT_13,
    tileTypeRatioBaseCounts: { enemy: 0, flower: 9, flower_yellow: 0, flower_red: 0, apple_tree: 0, tulip: 0, tulip_white: 0, bee: 1, caterpillar: 0, empty: 3 },
    initialBeeCount: 8,
    goalTargets: { flower: 8, flower_yellow: 0, flower_red: 0, apple: 0, appleFruit: 0, tulip: 0, tulip_white: 0 },
    enemyPlacementRule: "default",
    hooks: "回血：纯白花海 + 首次见到蜂巢",
    intro: "没有鸟。盘上多了一个蜂巢——同一格经过两次会送你 1 只蜜蜂。",
    designerNotes: { expectedRunsToWin: 3, expectedFailRate: 0, kishoStage: "Rest", rhythm: "rest" },
  },

  // ===== 第 2 章：紫郁 → 蜂巢主线 → 黄红颜色变奏 → appleFruit 首启用 =====
  {
    // L6：紫郁金香登场。1 只鸟 + 教学关 exclude-shortest。
    id: "L6", name: "第 6 关 · 郁金香登场", chapter: 2, layout: LAYOUT_16,
    tileTypeRatioBaseCounts: { enemy: 1, flower: 10, flower_yellow: 0, flower_red: 0, apple_tree: 0, tulip: 2, tulip_white: 0, bee: 0, caterpillar: 0, empty: 3 },
    initialBeeCount: 7,
    goalTargets: { flower: 8, flower_yellow: 0, flower_red: 0, apple: 0, appleFruit: 0, tulip: 2, tulip_white: 0 },
    enemyPlacementRule: "exclude-shortest-safe-path",
    hooks: "认识：紫色郁金香一朵 +2 花蜜",
    intro: "紫色花是郁金香，价值是小白花的 2 倍。",
    designerNotes: { expectedRunsToWin: 4, expectedFailRate: 0.1, kishoStage: "Introduce", rhythm: "valley" },
  },
  {
    // L7：Kishō Train——蜂巢上主线，13 格小盘低压力学储蓄。
    id: "L7", name: "第 7 关 · 蜂巢主线", chapter: 2, layout: LAYOUT_13,
    tileTypeRatioBaseCounts: { enemy: 1, flower: 7, flower_yellow: 0, flower_red: 0, apple_tree: 0, tulip: 0, tulip_white: 0, bee: 1, caterpillar: 0, empty: 4 },
    initialBeeCount: 7,
    goalTargets: { flower: 6, flower_yellow: 0, flower_red: 0, apple: 0, appleFruit: 0, tulip: 0, tulip_white: 0 },
    enemyPlacementRule: "exclude-shortest-safe-path",
    hooks: "训练：蜂巢成为主线资源",
    intro: "盘面更小，鸟只 1 只。多绕路 2 次经过蜂巢，把蜜蜂数攒起来。",
    designerNotes: { expectedRunsToWin: 4, expectedFailRate: 0.15, kishoStage: "Train", rhythm: "rise" },
  },
  {
    // L8：Twist——黄花 + 红花颜色变奏，与紫郁同台。
    id: "L8", name: "第 8 关 · 黄红颜色变奏", chapter: 2, layout: LAYOUT_16,
    tileTypeRatioBaseCounts: { enemy: 2, flower: 4, flower_yellow: 3, flower_red: 3, apple_tree: 0, tulip: 2, tulip_white: 0, bee: 0, caterpillar: 0, empty: 2 },
    initialBeeCount: 6,
    goalTargets: { flower: 4, flower_yellow: 3, flower_red: 3, apple: 0, appleFruit: 0, tulip: 2, tulip_white: 0 },
    enemyPlacementRule: "default",
    hooks: "转折：黄花、红花和紫郁金香混合",
    intro: "颜色更多了——但机制和小白花一模一样，只是看上去花。",
    designerNotes: { expectedRunsToWin: 5, expectedFailRate: 0.25, kishoStage: "Twist", rhythm: "rise" },
  },
  {
    // L9：第 2 章 Conclude——appleFruit 桶首次启用。
    id: "L9", name: "第 9 关 · 第二章考核 · 果实初采", chapter: 2, layout: LAYOUT_19,
    tileTypeRatioBaseCounts: { enemy: 3, flower: 9, flower_yellow: 0, flower_red: 0, apple_tree: 2, tulip: 3, tulip_white: 0, bee: 0, caterpillar: 0, empty: 2 },
    initialBeeCount: 5,
    goalTargets: { flower: 10, flower_yellow: 0, flower_red: 0, apple: 1, appleFruit: 1, tulip: 3, tulip_white: 0 },
    enemyPlacementRule: "default",
    hooks: "综合：第 2 章压轴 + 第一次果实采集",
    intro: "第 2 章压轴。本轮的苹果在下一轮会变成果实，记得再回来。",
    designerNotes: { expectedRunsToWin: 6, expectedFailRate: 0.3, kishoStage: "Conclude", rhythm: "peak" },
  },

  // ===== 中场息期 2 =====
  {
    // L10 rest2：郁金香循环演示，零敌人。
    id: "L10", name: "第 10 关 · 休息日 · 郁金香田", chapter: 0, layout: LAYOUT_16,
    tileTypeRatioBaseCounts: { enemy: 0, flower: 7, flower_yellow: 0, flower_red: 0, apple_tree: 0, tulip: 6, tulip_white: 0, bee: 1, caterpillar: 0, empty: 2 },
    initialBeeCount: 8,
    goalTargets: { flower: 5, flower_yellow: 0, flower_red: 0, apple: 0, appleFruit: 0, tulip: 4, tulip_white: 0 },
    enemyPlacementRule: "default",
    hooks: "回血：郁金香 sprout→bloom 循环演示",
    intro: "整片紫色，没有鸟。再放 1 个蜂巢，绕回去经过它第 2 次。",
    designerNotes: { expectedRunsToWin: 3, expectedFailRate: 0, kishoStage: "Rest", rhythm: "rest" },
  },

  // ===== 第 3 章：青虫 → 白郁 → 22 格综合 → 远端 Conclude =====
  {
    // L11：青虫首引。13 格小盘看清吃花机制。
    id: "L11", name: "第 11 关 · 青虫登场", chapter: 3, layout: LAYOUT_13,
    tileTypeRatioBaseCounts: { enemy: 1, flower: 7, flower_yellow: 0, flower_red: 0, apple_tree: 0, tulip: 0, tulip_white: 0, bee: 0, caterpillar: 1, empty: 4 },
    initialBeeCount: 7,
    goalTargets: { flower: 6, flower_yellow: 0, flower_red: 0, apple: 0, appleFruit: 0, tulip: 0, tulip_white: 0 },
    enemyPlacementRule: "exclude-shortest-safe-path",
    hooks: "认识：青虫每回合会吃相邻植被",
    intro: "青虫不会扣你蜜蜂，但每回合会跳到相邻已翻开的花上把它吃光。",
    designerNotes: { expectedRunsToWin: 4, expectedFailRate: 0.15, kishoStage: "Introduce", rhythm: "valley→rise" },
  },
  {
    // L12：白郁金香登场，与青虫同台。
    id: "L12", name: "第 12 关 · 白色郁金香", chapter: 3, layout: LAYOUT_16,
    tileTypeRatioBaseCounts: { enemy: 2, flower: 8, flower_yellow: 0, flower_red: 0, apple_tree: 0, tulip: 0, tulip_white: 1, bee: 0, caterpillar: 1, empty: 4 },
    initialBeeCount: 6,
    goalTargets: { flower: 6, flower_yellow: 0, flower_red: 0, apple: 0, appleFruit: 0, tulip: 0, tulip_white: 2 },
    enemyPlacementRule: "exclude-shortest-safe-path",
    hooks: "认识：白色郁金香也 +2 花蜜",
    intro: "白色的郁金香——价值和紫色一样，只是花色不同。",
    designerNotes: { expectedRunsToWin: 5, expectedFailRate: 0.25, kishoStage: "Twist", rhythm: "rise" },
  },
  {
    // L13：22 格大盘首秀 + 多机制综合（青虫 + 白郁 + 紫郁 + 苹果）。
    id: "L13", name: "第 13 关 · 大盘综合", chapter: 3, layout: LAYOUT_22,
    tileTypeRatioBaseCounts: { enemy: 3, flower: 11, flower_yellow: 0, flower_red: 0, apple_tree: 1, tulip: 2, tulip_white: 1, bee: 0, caterpillar: 1, empty: 3 },
    initialBeeCount: 6,
    goalTargets: { flower: 10, flower_yellow: 0, flower_red: 0, apple: 1, appleFruit: 0, tulip: 2, tulip_white: 1 },
    enemyPlacementRule: "default",
    hooks: "大盘登场：22 格 + 多机制综合",
    intro: "盘面变大了；青虫、白郁、紫郁、苹果同台，规划路线。",
    designerNotes: { expectedRunsToWin: 7, expectedFailRate: 0.35, kishoStage: "Train", rhythm: "rise" },
  },
  {
    // L14：第 3 章 Conclude——远端鸟群聚集 + appleFruit 加码。
    id: "L14", name: "第 14 关 · 第三章考核 · 远端鸟群", chapter: 3, layout: LAYOUT_22,
    tileTypeRatioBaseCounts: { enemy: 4, flower: 10, flower_yellow: 0, flower_red: 0, apple_tree: 2, tulip: 3, tulip_white: 1, bee: 0, caterpillar: 1, empty: 1 },
    initialBeeCount: 5,
    goalTargets: { flower: 10, flower_yellow: 0, flower_red: 0, apple: 2, appleFruit: 1, tulip: 3, tulip_white: 1 },
    enemyPlacementRule: "far-from-start-then-cluster",
    hooks: "转折：远端鸟群聚集 + 果实再采",
    intro: "起点附近是安全的——但深处藏着 4 只鸟。本轮采过的苹果，下一轮会变成果实再 +1。",
    designerNotes: { expectedRunsToWin: 8, expectedFailRate: 0.4, kishoStage: "Conclude", rhythm: "peak" },
  },

  // ===== 伪 rest =====
  {
    // L15 伪 rest：鸟 2 + 蜂 7 + 多花密集，制造"以为通关了"心流陷阱。
    id: "L15", name: "第 15 关 · 伪休息日", chapter: 0, layout: LAYOUT_22,
    tileTypeRatioBaseCounts: { enemy: 2, flower: 8, flower_yellow: 2, flower_red: 2, apple_tree: 1, tulip: 2, tulip_white: 1, bee: 1, caterpillar: 0, empty: 3 },
    initialBeeCount: 7,
    goalTargets: { flower: 6, flower_yellow: 2, flower_red: 2, apple: 1, appleFruit: 0, tulip: 2, tulip_white: 1 },
    enemyPlacementRule: "default",
    hooks: "伪休息：花海多但鸟还在",
    intro: "看起来花多鸟少——别松懈，还有 2 只鸟和 1 棵苹果在远处。",
    designerNotes: { expectedRunsToWin: 5, expectedFailRate: 0.25, kishoStage: "Pseudo-Rest", rhythm: "valley→rise" },
  },

  // ===== 终局 =====
  {
    // L16 climax：8 鸟 + 全机制聚合 + far-cluster。
    id: "L16", name: "第 16 关 · 终局", chapter: 3, layout: LAYOUT_22,
    tileTypeRatioBaseCounts: { enemy: 8, flower: 3, flower_yellow: 2, flower_red: 2, apple_tree: 2, tulip: 1, tulip_white: 1, bee: 1, caterpillar: 1, empty: 1 },
    initialBeeCount: 5,
    goalTargets: { flower: 3, flower_yellow: 2, flower_red: 2, apple: 2, appleFruit: 2, tulip: 1, tulip_white: 1 },
    enemyPlacementRule: "far-from-start-then-cluster",
    hooks: "终局：8 只鸟 + 全机制",
    intro: "这是最后一关。起点附近还安全，深处藏着 8 只鸟。决定要走多远。",
    designerNotes: { expectedRunsToWin: 12, expectedFailRate: 0.55, kishoStage: "Climax", rhythm: "climax" },
  },
];

let currentLevelIndex = 0;

// 以下变量原为顶层 const，现降级为 let，由 applyLevelConfig 派生
let tileTypeRatioBaseCounts = { enemy: 0, flower: 0, flower_yellow: 0, flower_red: 0, apple_tree: 0, tulip: 0, tulip_white: 0, bee: 0, caterpillar: 0, empty: 0 };
let layoutRows = [];
let rowTileIds = [];
let rowSlots = [];
let startTileId = "";
let initialBeeCount = 0;
let goalTargets = { flower: 0, flower_yellow: 0, flower_red: 0, apple: 0, appleFruit: 0, tulip: 0, tulip_white: 0 };
let honeyGoalTarget = 0;
let enemyPlacementRule = "default";
const initialStatusText = "选择任意已翻开的格子（天敌除外）作为起点，按住滑动。";
const animationDurations = {
  failFlash: 420,
  shake: 420,
  startPulse: 800,
  honeyPulse: 480,
  toast: 1400,
  tileFlip: 260,
  trailFade: 260,
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
  flower_yellow: "./assets/tiles/tile-flower.png",
  flower_red: "./assets/tiles/tile-flower.png",
  apple_tree: "./assets/tiles/tile-empty.png",
  tulip: "./assets/tiles/tile-empty.png",
  tulip_white: "./assets/tiles/tile-empty.png",
  bee: "./assets/tiles/bee_01.png?v=bee-20260616-1",
  caterpillar: "./assets/tiles/tile-empty.png",
};
const threatEdgeAssetMap = {
  left: "./assets/tiles/tile-edge-left.png",
  right: "./assets/tiles/tile-edge-right.png",
  "upper-left": "./assets/tiles/tile-edge-upper-left.png",
  "upper-right": "./assets/tiles/tile-edge-upper-right.png",
  "lower-left": "./assets/tiles/tile-edge-lower-left.png",
  "lower-right": "./assets/tiles/tile-edge-lower-right.png",
};
const flowerStageAssetMap = {
  bloom: "./assets/tiles/flower_bloom_01.png?v=flora-20260616-1",
  sprout: "./assets/tiles/flower_sprout_01.png?v=flora-20260616-1",
};
// A-PLN-FLOWER-COLORS-01：小黄花、小红花阶段图（逻辑与小白花完全一致，仅图与桶不同）
const flowerYellowStageAssetMap = {
  bloom: "./assets/tiles/flower_bloom_02.png?v=flora-20260616-1",
  sprout: "./assets/tiles/flower_sprout_02.png?v=flora-20260616-1",
};
const flowerRedStageAssetMap = {
  bloom: "./assets/tiles/flower_bloom_03.png?v=flora-20260616-1",
  sprout: "./assets/tiles/flower_sprout_03.png?v=flora-20260616-1",
};
const tulipStageAssetMap = {
  bloom: "./assets/tiles/tulip_bloom_01.png",
  sprout: "./assets/tiles/tulip_sprout_01.png?v=tulip-20260616-1",
};
// A-PLN-TULIP-WHITE-01：白色郁金香阶段图，逻辑完全复用现有郁金香
const tulipWhiteStageAssetMap = {
  bloom: "./assets/tiles/tulip_bloom_03.png?v=tulip-20260616-1",
  sprout: "./assets/tiles/tulip_sprout_03.png?v=tulip-20260616-1",
};
const appleTreeStateAssetMap = {
  blossom: "./assets/tiles/apple_tree_blossom_01.png",
  fruit: "./assets/tiles/apple_tree_fruit_01.png",
  harvested: "./assets/tiles/apple_tree_harvested_01.png",
};
// A-PLN-BEE-01：蜜蜂地块 3 张切图（未采集 / 已采集 1 次 / 第 2 次结算"出蜂"态）
const beeStageAssetMap = {
  stage0: "./assets/tiles/bee_01.png?v=bee-20260616-1",
  stage1: "./assets/tiles/bee_02.png?v=bee-20260616-1",
  stage2: "./assets/tiles/bee_03.png?v=bee-20260616-1",
};
// 飞蜜蜂动画素材：复用 HUD 蜜蜂图标的 cursor-default.png
const flyBeeAsset = "./assets/ui/cursor/cursor-default.png";
// A-PLN-CATERPILLAR-01：青虫地块前景资源（双层结构，与 flower / tulip 同套路）
const caterpillarOverlayAsset = "./assets/tiles/insects_01.png";
const enemyOverlayAsset = "./assets/tiles/Bird_01.png?v=enemy-20260613-1";
let enemyOverlayDisplayAsset = enemyOverlayAsset;
const collectFeedbackConfig = {
  flyDuration: 510,
  launchInterval: 102,
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
const flowerYellowFlyAsset = "./assets/ui/icon_flower_02.png?v=flora-20260616-1";
const flowerRedFlyAsset = "./assets/ui/icon_flower_03.png?v=flora-20260616-1";
const tulipWhiteFlyAsset = "./assets/ui/icon_tulip_03.png?v=tulip-20260616-1";
const appleBlossomFlyAsset = "./assets/ui/icon_apple_01.png";
const appleFruitFlyAsset = "./assets/ui/icon_apple_02.png";

function getFlightAssetForType(type) {
  if (type === "apple_tree_blossom") return appleBlossomFlyAsset;
  if (type === "apple_tree_fruit") return appleFruitFlyAsset;
  if (type === "bee_reward") return flyBeeAsset;
  if (type === "caterpillar_jump") return caterpillarOverlayAsset;
  if (type === "flower_yellow") return flowerYellowFlyAsset;
  if (type === "flower_red") return flowerRedFlyAsset;
  if (type === "tulip_white") return tulipWhiteFlyAsset;
  return flowerFlyAsset;
}
const tileRevealSoundAsset = "./assets/audio/sfx/tile-reveal.wav";
const tileEnemyHitSoundAsset = "./assets/audio/sfx/tile-enemy-hit.wav";
const comboSoundAsset = "./assets/audio/sfx/sfx-combo.mp3";
const customCursorAsset = "./assets/ui/cursor/cursor-default.png";
const beeStaminaConfig = {
  // 体力限制总开关：false 时不再扣体力、不再自动结算本轮、不再显示体力环
  // 需要恢复体力限制时，把 enabled 改回 true 即可
  enabled: false,
  maxPerRun: 8,
  // 是否把“按下起点的那一格”也算作消耗 1 格
  countStartTile: true,
};
const settlementSequenceConfig = {
  staggerMs: 175,        // 相邻得分格之间的间隔（在 206 基础上再快 15%）
  intraTileGapMs: 88,    // 同一格内多朵飞花的微错峰（苹果 +3）
  bounceDurationMs: 204, // 得分格小跳总时长（与下方 CSS keyframes 同步）
  bounceHeightPx: 12,    // 得分格跳跃峰值
  waitFlightsTailMs: 88, // 最后一朵飞花落地后的兜底缓冲
};
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
  yUnit: 110,
};
const boardDisplayScale = 1.7;

// 全局棋盘基准：取最大关卡 LAYOUT_22 的尺寸，所有关卡共用同一 scale，
// 保证手机上每关的 tile 视觉大小一致（小关会有更多留白，这是预期取舍）。
const MAX_BOARD_SLOT = 6; // LAYOUT_22 rowSlots 最大列 = 6
const MAX_BOARD_ROW = 7; // LAYOUT_22 layoutRows 8 行 → row 索引 0..7
const STAGE_VERTICAL_OVERHEAD = 220; // HUD + gap + padding-bottom 的固定纵向估算

const hasDom = typeof document !== "undefined";

function createTileTypeSummary() {
  return {
    enemy: 0,
    flower: 0,
    flower_yellow: 0,
    flower_red: 0,
    apple_tree: 0,
    tulip: 0,
    tulip_white: 0,
    bee: 0,
    caterpillar: 0,
    empty: 0,
  };
}

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
  const counts = createTileTypeSummary();
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
    throw new Error(`L${currentLevelIndex + 1} 盘面配置非法，请检查 layoutRows / rowTileIds / rowSlots`);
  }

  if (!allTileIds.includes(startTileId)) {
    throw new Error("固定起点不存在于盘面配置中");
  }
}

// 以下原为 const，现降级为 let，由 applyLevelConfig 重建
let tiles = [];
let totalTileCount = 0;
let tileTypeCounts = createTileTypeSummary();
let tilesById = {};
let adjacencyMap = {};

function applyLevelConfig(levelIndex) {
  if (!Number.isInteger(levelIndex) || levelIndex < 0 || levelIndex >= levelConfigs.length) {
    throw new Error(`非法关卡索引：${levelIndex}`);
  }
  const cfg = levelConfigs[levelIndex];
  currentLevelIndex = levelIndex;

  layoutRows = cfg.layout.layoutRows.slice();
  rowTileIds = cfg.layout.rowTileIds.map((row) => row.slice());
  rowSlots = cfg.layout.rowSlots.map((row) => row.slice());
  startTileId = cfg.layout.startTileId;

  tileTypeRatioBaseCounts = { ...cfg.tileTypeRatioBaseCounts };
  initialBeeCount = cfg.initialBeeCount;
  goalTargets = { ...cfg.goalTargets };
  honeyGoalTarget = goalTargets.flower + goalTargets.flower_yellow + goalTargets.flower_red + goalTargets.apple + goalTargets.appleFruit + goalTargets.tulip + goalTargets.tulip_white;
  enemyPlacementRule = cfg.enemyPlacementRule || "default";

  validateLayoutConfig();

  tiles = rowTileIds.flatMap((ids, rowIndex) =>
    ids.map((id, colIndex) => ({
      id,
      row: rowIndex,
      col: colIndex,
      slotX: rowSlots[rowIndex][colIndex],
    }))
  );
  totalTileCount = tiles.length;
  tileTypeCounts = calculateTileTypeCounts(totalTileCount);
  tilesById = Object.fromEntries(tiles.map((tile) => [tile.id, tile]));
  adjacencyMap = Object.fromEntries(
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
}

function bfsDistancesFromStart() {
  const dist = { [startTileId]: 0 };
  const queue = [startTileId];
  while (queue.length) {
    const cur = queue.shift();
    for (const n of adjacencyMap[cur] || []) {
      if (dist[n] === undefined) {
        dist[n] = dist[cur] + 1;
        queue.push(n);
      }
    }
  }
  return dist;
}

function pickEnemyTileIds(baseCandidates, randomFn) {
  const need = tileTypeCounts.enemy;
  if (need <= 0) return new Set();

  if (enemyPlacementRule === "exclude-shortest-safe-path") {
    const dist = bfsDistancesFromStart();
    const SAFE_RADIUS = 2;
    const restricted = baseCandidates.filter((id) => (dist[id] ?? Infinity) > SAFE_RADIUS);
    if (restricted.length >= need) {
      return new Set(shuffleArray(restricted, randomFn).slice(0, need));
    }
    console.warn(
      `[Collection] L${currentLevelIndex + 1} exclude-shortest-safe-path 候选不足(${restricted.length} < ${need})，回退 default`
    );
  } else if (enemyPlacementRule === "far-from-start-then-cluster") {
    const dist = bfsDistancesFromStart();
    const far = shuffleArray(
      baseCandidates.filter((id) => (dist[id] ?? 0) >= 3),
      randomFn
    );
    const near = shuffleArray(
      baseCandidates.filter((id) => (dist[id] ?? 0) < 3),
      randomFn
    );
    return new Set([...far, ...near].slice(0, need));
  }
  return new Set(shuffleArray(baseCandidates, randomFn).slice(0, need));
}

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
  const enemyIds = pickEnemyTileIds(enemyCandidates, randomFn);
  const safeCandidates = allTileIds.filter((id) => !enemyIds.has(id));
  const appleTreeIds = new Set(
    shuffleArray(safeCandidates, randomFn).slice(0, tileTypeCounts.apple_tree)
  );
  const tulipCandidates = safeCandidates.filter((id) => !appleTreeIds.has(id));
  const tulipIds = new Set(
    shuffleArray(tulipCandidates, randomFn).slice(0, tileTypeCounts.tulip)
  );
  // A-PLN-TULIP-WHITE-01：白色郁金香从剩余 safe 池中抽
  const tulipWhiteCandidates = tulipCandidates.filter((id) => !tulipIds.has(id));
  const tulipWhiteIds = new Set(
    shuffleArray(tulipWhiteCandidates, randomFn).slice(0, tileTypeCounts.tulip_white)
  );
  const beeCandidates = tulipWhiteCandidates.filter((id) => !tulipWhiteIds.has(id));
  const beeIds = new Set(
    shuffleArray(beeCandidates, randomFn).slice(0, tileTypeCounts.bee)
  );
  const caterpillarCandidates = beeCandidates.filter((id) => !beeIds.has(id));
  const caterpillarIds = new Set(
    shuffleArray(caterpillarCandidates, randomFn).slice(0, tileTypeCounts.caterpillar)
  );
  // A-PLN-FLOWER-COLORS-01：黄花、红花从剩余 safe 池中抽
  const flowerYellowCandidates = caterpillarCandidates.filter((id) => !caterpillarIds.has(id));
  const flowerYellowIds = new Set(
    shuffleArray(flowerYellowCandidates, randomFn).slice(0, tileTypeCounts.flower_yellow)
  );
  const flowerRedCandidates = flowerYellowCandidates.filter((id) => !flowerYellowIds.has(id));
  const flowerRedIds = new Set(
    shuffleArray(flowerRedCandidates, randomFn).slice(0, tileTypeCounts.flower_red)
  );
  const flowerCandidates = flowerRedCandidates.filter((id) => !flowerRedIds.has(id));
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

      if (flowerYellowIds.has(id)) {
        return [id, "flower_yellow"];
      }

      if (flowerRedIds.has(id)) {
        return [id, "flower_red"];
      }

      if (appleTreeIds.has(id)) {
        return [id, "apple_tree"];
      }

      if (tulipIds.has(id)) {
        return [id, "tulip"];
      }

      if (tulipWhiteIds.has(id)) {
        return [id, "tulip_white"];
      }

      if (beeIds.has(id)) {
        return [id, "bee"];
      }

      if (caterpillarIds.has(id)) {
        return [id, "caterpillar"];
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
    createTileTypeSummary()
  );

  if (
    summary.enemy !== tileTypeCounts.enemy ||
    summary.flower !== tileTypeCounts.flower ||
    summary.flower_yellow !== tileTypeCounts.flower_yellow ||
    summary.flower_red !== tileTypeCounts.flower_red ||
    summary.apple_tree !== tileTypeCounts.apple_tree ||
    summary.tulip !== tileTypeCounts.tulip ||
    summary.tulip_white !== tileTypeCounts.tulip_white ||
    summary.bee !== tileTypeCounts.bee ||
    summary.caterpillar !== tileTypeCounts.caterpillar ||
    summary.empty !== tileTypeCounts.empty
  ) {
    throw new Error(
      `自定义 typeMap 不满足当前数量约束：enemy ${tileTypeCounts.enemy} / flower ${tileTypeCounts.flower} / flower_yellow ${tileTypeCounts.flower_yellow} / flower_red ${tileTypeCounts.flower_red} / apple_tree ${tileTypeCounts.apple_tree} / tulip ${tileTypeCounts.tulip} / tulip_white ${tileTypeCounts.tulip_white} / bee ${tileTypeCounts.bee} / caterpillar ${tileTypeCounts.caterpillar} / empty ${tileTypeCounts.empty}`
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
    createTileTypeSummary()
  );
}

function getInitialGrowthStage(type) {
  if (type === "apple_tree") return "blossom";
  if (type === "flower") return "bloom";
  if (type === "flower_yellow") return "bloom";
  if (type === "flower_red") return "bloom";
  if (type === "tulip") return "bloom";
  if (type === "tulip_white") return "bloom";
  if (type === "bee") return "stage0";
  return null;
}

function getFlowerStage(tileState) {
  if (!tileState || tileState.type !== "flower") return null;
  return flowerStageAssetMap[tileState.growthStage] ? tileState.growthStage : "bloom";
}

function getFlowerYellowStage(tileState) {
  if (!tileState || tileState.type !== "flower_yellow") return null;
  return flowerYellowStageAssetMap[tileState.growthStage] ? tileState.growthStage : "bloom";
}

function getFlowerRedStage(tileState) {
  if (!tileState || tileState.type !== "flower_red") return null;
  return flowerRedStageAssetMap[tileState.growthStage] ? tileState.growthStage : "bloom";
}

function getTulipStage(tileState) {
  if (!tileState || tileState.type !== "tulip") return null;
  return tulipStageAssetMap[tileState.growthStage] ? tileState.growthStage : "bloom";
}

function getTulipWhiteStage(tileState) {
  if (!tileState || tileState.type !== "tulip_white") return null;
  return tulipWhiteStageAssetMap[tileState.growthStage] ? tileState.growthStage : "bloom";
}

function getBeeStage(tileState) {
  if (!tileState || tileState.type !== "bee") return null;
  return beeStageAssetMap[tileState.growthStage] ? tileState.growthStage : "stage0";
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
          growthStage: getInitialGrowthStage(type),
          pendingFruit: false,
          fruitRoundCount: 0,
          pendingReBloom: false,
          beePassCount: 0,
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
    flowerHoney: 0,
    flowerYellowHoney: 0,
    flowerRedHoney: 0,
    appleHoney: 0,
    appleFruitHoney: 0,
    tulipHoney: 0,
    tulipWhiteHoney: 0,
    remainingBees: initialBeeCount,
    isDragging: false,
    dragPointerId: null,
    currentPath: [],
    currentRunVisitedTileIds: new Set(),
    currentRunHarvestedTileIds: new Set(),
    pendingScoreList: [],
    isSettling: false,
    scoreBounceTileIds: [],
    scoreBounceStartedAt: {},
    beeStamina: beeStaminaConfig.maxPerRun,
    beeStaminaExhausted: false,
    lastSafeTileId: startTileId,
    lastConsumedBee: false,
    hasHitEnemy: false,
    statusText: initialStatusText,
    lastOutcome: null,
    isFailFlash: false,
    trailPath: [],
    trailFading: false,
    trailFail: false,
    invalidFlashTileIds: [],
    shakeTileIds: [],
    flipTileIds: [],
    toastMessage: "",
    toastTone: "",
    startPulseTileId: null,
    isGameOver: false,
    isGameWin: false,
    tileStateMap,
    seenVisibleTileIds: new Set(),
    tileAppearances: {},
  };
}

// 模块初始化：先应用关卡 0 数据，再创建初始 gameState
applyLevelConfig(0);
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
      goalCard: document.getElementById("goal-card"),
      goalFlower: document.getElementById("goal-flower"),
      goalFlowerYellow: document.getElementById("goal-flower-yellow"),
      goalFlowerRed: document.getElementById("goal-flower-red"),
      goalApple: document.getElementById("goal-apple"),
      goalAppleFruit: document.getElementById("goal-apple-fruit"),
      goalTulip: document.getElementById("goal-tulip"),
      goalTulipWhite: document.getElementById("goal-tulip-white"),
      goalFlowerItem: document.querySelector('.goal-item[data-goal="flower"]'),
      goalFlowerYellowItem: document.querySelector('.goal-item[data-goal="flower-yellow"]'),
      goalFlowerRedItem: document.querySelector('.goal-item[data-goal="flower-red"]'),
      goalAppleItem: document.querySelector('.goal-item[data-goal="apple"]'),
      goalAppleFruitItem: document.querySelector('.goal-item[data-goal="apple-fruit"]'),
      goalTulipItem: document.querySelector('.goal-item[data-goal="tulip"]'),
      goalTulipWhiteItem: document.querySelector('.goal-item[data-goal="tulip-white"]'),
      beesLeft: document.getElementById("bees-left"),
      beeCounterIcon: document.getElementById("bee-counter-icon"),
      statusText: document.getElementById("status-text"),
      toast: document.getElementById("toast"),
      gameOver: document.getElementById("game-over"),
      gameOverSummary: document.getElementById("game-over-summary"),
      restartButton: document.getElementById("restart-button"),
      gameWin: document.getElementById("game-win"),
      gameWinSummary: document.getElementById("game-win-summary"),
      restartWinButton: document.getElementById("restart-win-button"),
      levelSelectToggle: document.getElementById("level-select-toggle"),
      levelSelectOverlay: document.getElementById("level-select-overlay"),
      levelSelectClose: document.getElementById("level-select-close"),
      levelSelectGrid: document.getElementById("level-select-grid"),
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

function scheduleTrailFadeOut(delayMs = 0) {
  scheduleFeedback(() => {
    gameState.trailFading = true;
    triggerRenderOnly();
    scheduleFeedback(() => {
      gameState.trailPath = [];
      gameState.trailFading = false;
      gameState.trailFail = false;
      triggerRenderOnly();
    }, animationDurations.trailFade);
  }, delayMs);
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

  triggerStartPulse(tileId);
  showToast(message, tone);
}

function updateGameOverState() {
  const shouldGameOver = !gameState.isDragging && gameState.remainingBees <= 0;
  gameState.isGameOver = shouldGameOver;

  if (shouldGameOver) {
    gameState.statusText = `游戏结束 · ${formatGoalsLine()}`;
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
    flowerHoney: gameState.flowerHoney,
    flowerYellowHoney: gameState.flowerYellowHoney,
    flowerRedHoney: gameState.flowerRedHoney,
    appleHoney: gameState.appleHoney,
    appleFruitHoney: gameState.appleFruitHoney,
    tulipHoney: gameState.tulipHoney,
    tulipWhiteHoney: gameState.tulipWhiteHoney,
    isGameOver: gameState.isGameOver,
    comboCount: comboState.count,
    currentPath: [...gameState.currentPath],
    lastOutcome: gameState.lastOutcome,
  };
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
  const { resetRunToken = false, clearFlights = true } = options;

  clearCollectionTasks();
  feedbackState.nextLaunchAt = 0;
  feedbackState.pendingLaunchCount = 0;

  if (resetRunToken) {
    feedbackState.currentRunToken += 1;
  }

  if (clearFlights) {
    clearActiveFlowerFlights();
  }

  if (dom?.goalCard) {
    dom.goalCard.querySelectorAll(".goal-item.is-collecting").forEach((el) => {
      el.classList.remove("is-collecting");
    });
  }
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

function getGoalIconElement(type) {
  if (!dom) return null;
  if (type === "flower") return dom.goalFlower?.parentElement || null;
  if (type === "flower_yellow") return dom.goalFlowerYellow?.parentElement || null;
  if (type === "flower_red") return dom.goalFlowerRed?.parentElement || null;
  if (type === "apple_tree_blossom") return dom.goalApple?.parentElement || null;
  if (type === "apple_tree_fruit") return dom.goalAppleFruit?.parentElement || null;
  if (type === "tulip") return dom.goalTulip?.parentElement || null;
  if (type === "tulip_white") return dom.goalTulipWhite?.parentElement || null;
  return null;
}

function getGoalIconTargetPoint(type) {
  const el = getGoalIconElement(type);
  if (!el) {
    return null;
  }

  return getOverlayRelativePointFromRect(el.getBoundingClientRect(), 0.5);
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

function createFlowerFlightElement(type) {
  const element = document.createElement("div");
  element.className = "flower-fly";
  const src = getFlightAssetForType(type);
  element.innerHTML = `<img class="flower-fly__image" src="${src}" alt="" />`;
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

function playGoalCollectFeedback(type) {
  const el = getGoalIconElement(type);
  if (!el) {
    return;
  }

  el.classList.remove("is-collecting");
  void el.offsetWidth;
  el.classList.add("is-collecting");
  scheduleCollectionTask(() => {
    el.classList.remove("is-collecting");
  }, 360);
}

function commitGoalArrival(type) {
  if (type === "flower") {
    gameState.flowerHoney += 1;
  } else if (type === "flower_yellow") {
    gameState.flowerYellowHoney += 1;
  } else if (type === "flower_red") {
    gameState.flowerRedHoney += 1;
  } else if (type === "apple_tree_blossom") {
    gameState.appleHoney += 1;
  } else if (type === "apple_tree_fruit") {
    gameState.appleFruitHoney += 1;
  } else if (type === "tulip") {
    gameState.tulipHoney += 1;
  } else if (type === "tulip_white") {
    gameState.tulipWhiteHoney += 1;
  } else {
    return;
  }
  gameState.totalHoney =
    gameState.flowerHoney +
    gameState.flowerYellowHoney +
    gameState.flowerRedHoney +
    gameState.appleHoney +
    gameState.appleFruitHoney +
    gameState.tulipHoney +
    gameState.tulipWhiteHoney;
  renderGoalHUD();
}

function finishFlowerFlight(flightId) {
  const flight = feedbackState.activeFlights.get(flightId);

  if (!flight) {
    return;
  }

  flight.element.remove();
  feedbackState.activeFlights.delete(flightId);

  if (flight.type === "bee_reward") {
    // A-PLN-BEE-01：飞蜜蜂落地，复位地块 + 蜜蜂 +1 + 计数器跳动
    finalizeBeeReward(flight.sourceTileId);
    playCollectSound();
    return;
  }

  if (flight.type === "caterpillar_jump") {
    // A-PLN-CATERPILLAR-01：青虫落地，触发目标格类型切换 + 压扁动效
    flight.onLand?.();
    return;
  }

  commitGoalArrival(flight.type);
  playGoalCollectFeedback(flight.type);
  playCollectSound();
}

function animateFlowerToGoal(startPoint, runToken, type) {
  if (!dom?.fxOverlay) {
    commitGoalArrival(type);
    return;
  }

  if (runToken !== feedbackState.currentRunToken) {
    return;
  }

  const endPoint = getGoalIconTargetPoint(type);

  if (!startPoint || !endPoint) {
    commitGoalArrival(type);
    playGoalCollectFeedback(type);
    playCollectSound();
    return;
  }

  const dx = endPoint.x - startPoint.x;
  const midX = startPoint.x + dx * 0.5;
  const arcHeight = Math.min(180, Math.max(88, Math.abs(dx) * 0.16 + Math.abs(endPoint.y - startPoint.y) * 0.22));
  const controlPoint = {
    x: midX + dx * 0.12,
    y: Math.min(startPoint.y, endPoint.y) - arcHeight,
  };
  const element = createFlowerFlightElement(type);
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
    type,
  });
  ensureFlightLoop();
}

// A-PLN-BEE-01：飞蜜蜂动画。复用现有飞行管线（feedbackState.activeFlights + flightRafId），
// 但终点是 HUD 蜜蜂计数器图标 dom.beeCounterIcon。
// 落地后由 finishFlowerFlight -> commitGoalArrival("bee_reward") 处理 +1 蜜蜂、地块复位与计数器跳动。
function spawnBeeRewardFlight(tileId) {
  if (!hasDom || !dom?.fxOverlay || !dom?.beeCounterIcon) {
    // 无 DOM 兜底：直接复位状态、+1 蜜蜂
    finalizeBeeReward(tileId);
    return;
  }

  let startPoint = getTileFlightOrigin(tileId);
  if (!startPoint) {
    renderBoard();
    startPoint = getTileFlightOrigin(tileId);
  }

  const endPoint = getOverlayRelativePointFromRect(
    dom.beeCounterIcon.getBoundingClientRect(),
    0.5
  );

  if (!startPoint || !endPoint) {
    finalizeBeeReward(tileId);
    return;
  }

  const runToken = feedbackState.currentRunToken;
  const dx = endPoint.x - startPoint.x;
  const midX = startPoint.x + dx * 0.5;
  const arcHeight = Math.min(
    180,
    Math.max(88, Math.abs(dx) * 0.16 + Math.abs(endPoint.y - startPoint.y) * 0.22)
  );
  const controlPoint = {
    x: midX + dx * 0.12,
    y: Math.min(startPoint.y, endPoint.y) - arcHeight,
  };
  const element = createFlowerFlightElement("bee_reward");
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
    type: "bee_reward",
    sourceTileId: tileId,
    runToken,
  });
  ensureFlightLoop();
}

// 飞蜜蜂落地：+1 蜜蜂、地块复位回 stage0、计数器跳动。
function finalizeBeeReward(tileId) {
  const tileState = gameState.tileStateMap[tileId];
  if (tileState && tileState.type === "bee") {
    tileState.beePassCount = 0;
    tileState.growthStage = "stage0";
  }
  gameState.remainingBees += 1;
  triggerBeeCounterPulse();
  if (hasDom) {
    renderHud();
    renderBoard();
  }
}

// 主动触发 HUD 蜜蜂计数器跳动（renderHud 的内置 pulse 只在 bees 减少时触发）。
function triggerBeeCounterPulse() {
  if (!dom?.beeCounterIcon) return;
  const icon = dom.beeCounterIcon;
  icon.classList.remove("bee-counter__icon--jump");
  void icon.offsetWidth;
  icon.classList.add("bee-counter__icon--jump");
}

function spawnFlowerFlyEffect(tileId, type) {
  if (!hasDom || !dom?.fxOverlay || !dom?.goalCard) {
    commitGoalArrival(type);
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
      return;
    }

    animateFlowerToGoal(startPoint, runToken, type);
  }, delay);
}

function spawnTilePopupText(tileId, amount) {
  if (!hasDom || !dom?.fxOverlay || !(amount > 0)) {
    return;
  }

  const tileElement = dom?.board?.querySelector(`[data-tile-id="${tileId}"]`);
  if (!tileElement) {
    return;
  }

  const anchor = getOverlayRelativePointFromRect(tileElement.getBoundingClientRect(), 0);
  if (!anchor) {
    return;
  }

  const element = document.createElement("div");
  element.className = "tile-popup";
  element.textContent = `+${amount}`;
  element.style.left = `${anchor.x}px`;
  element.style.top = `${anchor.y}px`;
  dom.fxOverlay.appendChild(element);

  const remove = () => {
    if (element.parentNode) {
      element.parentNode.removeChild(element);
    }
  };
  element.addEventListener("animationend", remove, { once: true });
  scheduleFeedback(remove, 900);

  spawnTileConfettiBurst(anchor);
}

function spawnTileConfettiBurst(anchor) {
  if (!hasDom || !dom?.fxOverlay || !anchor) {
    return;
  }

  const container = document.createElement("div");
  container.className = "tile-confetti";
  container.style.left = `${anchor.x}px`;
  container.style.top = `${anchor.y}px`;

  const palette = ["#ffd54a", "#ff8a3c", "#ff6f91", "#5ad6ff", "#ffffff"];
  const shapes = [
    "square", "square", "square", "square",
    "triangle", "triangle", "triangle", "triangle",
    "circle", "circle", "circle", "circle",
  ];
  // Fisher-Yates 洗牌，让形状分布不固定
  for (let i = shapes.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = shapes[i];
    shapes[i] = shapes[j];
    shapes[j] = tmp;
  }

  const total = 12;
  const baseAngle = Math.random() * 360;

  for (let i = 0; i < total; i += 1) {
    const shape = shapes[i];
    const jitter = (Math.random() - 0.5) * 24; // ±12°
    const angleDeg = baseAngle + (i / total) * 360 + jitter;
    const angleRad = (angleDeg * Math.PI) / 180;
    const distance = 40 + Math.random() * 24; // 40~64
    const dx = Math.cos(angleRad) * distance;
    const dy = Math.sin(angleRad) * distance;
    const rot = (Math.random() * 720 - 360).toFixed(1);
    const delay = Math.floor(Math.random() * 60);
    const color = palette[Math.floor(Math.random() * palette.length)];
    const size = shape === "circle" ? 7 + Math.random() * 2 : 8;

    const particle = document.createElement("span");
    particle.className = `tile-confetti__particle tile-confetti__particle--${shape}`;
    particle.style.setProperty("--dx", `${dx.toFixed(2)}px`);
    particle.style.setProperty("--dy", `${dy.toFixed(2)}px`);
    particle.style.setProperty("--rot", `${rot}deg`);
    particle.style.setProperty("--delay", `${delay}ms`);
    particle.style.setProperty("--bg", color);
    particle.style.setProperty("--size", `${size.toFixed(1)}px`);
    container.appendChild(particle);
  }

  dom.fxOverlay.appendChild(container);

  const remove = () => {
    if (container.parentNode) {
      container.parentNode.removeChild(container);
    }
  };
  scheduleFeedback(remove, 1200);
}

function queueRoundHoneyReset() {
  // 旧的"本轮暂存"已移除，飞花直达目标 icon 后即时提交，
  // 此处保留空壳以兼容历史调用点，必要时再扩展。
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
  return (
    type === "flower" ||
    type === "flower_yellow" ||
    type === "flower_red" ||
    type === "apple_tree" ||
    type === "tulip" ||
    type === "tulip_white" ||
    type === "bee" ||
    type === "caterpillar" ||
    type === "empty"
  );
}

function getAppleTreeGrowthStage(tileState) {
  if (tileState?.type !== "apple_tree") {
    return null;
  }

  return appleTreeStateAssetMap[tileState.growthStage] ? tileState.growthStage : "blossom";
}

function getAppleTreeStageCountdown(tileState) {
  // 新机制（passby-20260615）：苹果树每次"经过"即刻推进一档，
  // 不再有"剩 N 回合切换"的概念，统一不显示回合倒计时角标。
  if (!tileState || tileState.type !== "apple_tree" || !tileState.revealed) {
    return null;
  }
  return null;
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

  // 方案 A：所有关卡共用 LAYOUT_22 的参考尺寸作为 board-viewport，
  // 小关给 board 加等量 margin-top，让 tile 全部出现完成后整体上下居中。
  const refNativeWidth =
    boardMetrics.leftPadding * 2 + MAX_BOARD_SLOT * boardMetrics.xUnit + 56;
  const refNativeHeight =
    boardMetrics.topPadding * 2 + MAX_BOARD_ROW * boardMetrics.yUnit + 96;
  const verticalSlack = Math.max(0, (refNativeHeight - height) / 2);

  dom.board.style.width = `${width}px`;
  dom.board.style.height = `${height}px`;
  dom.board.style.marginTop = `${verticalSlack}px`;
  dom.board.style.transform = `scale(${boardDisplayScale})`;
  if (dom.boardViewport) {
    dom.boardViewport.style.width = `${refNativeWidth * boardDisplayScale}px`;
    dom.boardViewport.style.height = `${refNativeHeight * boardDisplayScale}px`;
  }
  applyResponsiveGameScale();
}

function applyResponsiveGameScale() {
  if (!dom?.gameStage || !dom.gameStageViewport) {
    return;
  }

  // 用最大关卡 LAYOUT_22 的棋盘尺寸作为统一基准，所有关卡共用同一 scale，
  // 保证手机上每关的 tile 视觉大小完全一致。
  const refBoardNativeWidth =
    boardMetrics.leftPadding * 2 + MAX_BOARD_SLOT * boardMetrics.xUnit + 56;
  const refBoardNativeHeight =
    boardMetrics.topPadding * 2 + MAX_BOARD_ROW * boardMetrics.yUnit + 96;
  const refBoardWidth = refBoardNativeWidth * boardDisplayScale; // ≈ 891
  const refBoardHeight = refBoardNativeHeight * boardDisplayScale; // ≈ 1683

  const refStageWidth = Math.max(dom.gameStage.offsetWidth, refBoardWidth);
  const refStageHeight = refBoardHeight + STAGE_VERTICAL_OVERHEAD;

  const availableWidth = dom.gameStageViewport.clientWidth;
  const availableHeight = dom.gameStageViewport.clientHeight;

  if (!refStageWidth || !refStageHeight || !availableWidth || !availableHeight) {
    return;
  }

  const scale = Math.min(1, availableWidth / refStageWidth, availableHeight / refStageHeight);
  const isMobileViewport = window.matchMedia("(max-width: 560px)").matches;
  // 手机端：把舞台略偏上居中；桌面端保持竖向居中。
  let topOffset;
  if (isMobileViewport) {
    const slack = Math.max(0, availableHeight - refStageHeight * scale);
    topOffset = Math.max(0, slack * 0.45);
  } else {
    topOffset = Math.max(0, (availableHeight - refStageHeight * scale) / 2);
  }
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

  if (type === "flower_yellow") {
    return "小黄花";
  }

  if (type === "flower_red") {
    return "小红花";
  }

  if (type === "apple_tree") {
    return "苹果果树";
  }

  if (type === "tulip") {
    return "郁金香";
  }

  if (type === "tulip_white") {
    return "白色郁金香";
  }

  if (type === "bee") {
    return "蜜蜂巢";
  }

  if (type === "caterpillar") {
    return "青虫";
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

function getSafeTileOverlayMarkup(tileState) {
  if (tileState.type === "flower") {
    const stage = getFlowerStage(tileState);
    return `<img class="tile__image tile__image--layer tile__image--flower tile__image--flower-${stage}" src="${flowerStageAssetMap[stage]}" alt="" />`;
  }

  if (tileState.type === "flower_yellow") {
    const stage = getFlowerYellowStage(tileState);
    return `<img class="tile__image tile__image--layer tile__image--flower tile__image--flower-yellow tile__image--flower-${stage}" src="${flowerYellowStageAssetMap[stage]}" alt="" />`;
  }

  if (tileState.type === "flower_red") {
    const stage = getFlowerRedStage(tileState);
    return `<img class="tile__image tile__image--layer tile__image--flower tile__image--flower-red tile__image--flower-${stage}" src="${flowerRedStageAssetMap[stage]}" alt="" />`;
  }

  if (tileState.type === "apple_tree") {
    const growthStage = getAppleTreeGrowthStage(tileState);
    return `<img class="tile__image tile__image--layer tile__image--apple-tree" src="${appleTreeStateAssetMap[growthStage]}" alt="" />`;
  }

  if (tileState.type === "tulip") {
    const stage = getTulipStage(tileState);
    return `<img class="tile__image tile__image--layer tile__image--tulip tile__image--tulip-${stage}" src="${tulipStageAssetMap[stage]}" alt="" />`;
  }

  if (tileState.type === "tulip_white") {
    const stage = getTulipWhiteStage(tileState);
    return `<img class="tile__image tile__image--layer tile__image--tulip tile__image--tulip-white tile__image--tulip-${stage}" src="${tulipWhiteStageAssetMap[stage]}" alt="" />`;
  }

  if (tileState.type === "caterpillar") {
    return `<img class="tile__image tile__image--layer tile__image--caterpillar" src="${caterpillarOverlayAsset}" alt="" />`;
  }

  return "";
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
  // A-PLN-BEE-01：蜜蜂地块整图替换（bee_0X.png 自带蜂巢底，不走 safe-stack 的绿底 + overlay）
  if (tileState?.revealed && tileState.type === "bee") {
    const stage = getBeeStage(tileState);
    const threatEdges = getThreatEdgeDirections(tileState);
    return `
      <span class="tile__image-stack tile__image-stack--bee">
        <img class="tile__image tile__image--base" src="${beeStageAssetMap[stage]}" alt="" />
        ${threatEdges
          .map(
            (edge) =>
              `<img class="tile__image tile__image--layer tile__image--threat-edge" src="${threatEdgeAssetMap[edge]}" alt="" />`
          )
          .join("")}
      </span>
    `;
  }

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
        ${getSafeTileOverlayMarkup(tileState)}
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
  return !!tileState && tileState.revealed && isSafeTileType(tileState.type);
}

function advanceAppleTreeStatesForNextRound() {
  // 新机制（passby-20260615）：苹果树状态推进完全由“玩家经过”驱动，
  // 在 commitPendingSideEffects() 中同步完成。这里保留空壳是为了向后兼容旧调用点。
  return {
    blossomToFruit: [],
    fruitContinue: [],
    fruitToHarvested: [],
    harvestedToBlossom: [],
  };
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

  // 禁止走回头路：本轮 currentPath 已包含的格子（含起点）不能再次进入
  if (gameState.currentPath.includes(tileId)) {
    return false;
  }

  return adjacencyMap[currentTileId].includes(tileId);
}

function renderGoalHUD() {
  if (!dom || !dom.goalCard) {
    return;
  }
  const fRemain = Math.max(0, goalTargets.flower - gameState.flowerHoney);
  const fyRemain = Math.max(0, goalTargets.flower_yellow - gameState.flowerYellowHoney);
  const frRemain = Math.max(0, goalTargets.flower_red - gameState.flowerRedHoney);
  const aRemain = Math.max(0, goalTargets.apple - gameState.appleHoney);
  const afRemain = Math.max(0, goalTargets.appleFruit - gameState.appleFruitHoney);
  const tRemain = Math.max(0, goalTargets.tulip - gameState.tulipHoney);
  const twRemain = Math.max(0, goalTargets.tulip_white - gameState.tulipWhiteHoney);
  if (dom.goalFlower) dom.goalFlower.textContent = String(fRemain);
  if (dom.goalFlowerYellow) dom.goalFlowerYellow.textContent = String(fyRemain);
  if (dom.goalFlowerRed) dom.goalFlowerRed.textContent = String(frRemain);
  if (dom.goalApple) dom.goalApple.textContent = String(aRemain);
  if (dom.goalAppleFruit) dom.goalAppleFruit.textContent = String(afRemain);
  if (dom.goalTulip) dom.goalTulip.textContent = String(tRemain);
  if (dom.goalTulipWhite) dom.goalTulipWhite.textContent = String(twRemain);
  dom.goalCard.setAttribute("aria-label", buildGoalCardAriaLabel());
  dom.goalFlower?.parentElement?.classList.toggle("is-done", fRemain === 0);
  dom.goalFlowerYellow?.parentElement?.classList.toggle("is-done", fyRemain === 0);
  dom.goalFlowerRed?.parentElement?.classList.toggle("is-done", frRemain === 0);
  dom.goalApple?.parentElement?.classList.toggle("is-done", aRemain === 0);
  dom.goalAppleFruit?.parentElement?.classList.toggle("is-done", afRemain === 0);
  dom.goalTulip?.parentElement?.classList.toggle("is-done", tRemain === 0);
  dom.goalTulipWhite?.parentElement?.classList.toggle("is-done", twRemain === 0);
}

// ====== A-PLN-GOAL-DYNAMIC-01：按关目标按需显示 ======
const GOAL_LABEL_MAP = { flower: "小白花", flower_yellow: "小黄花", flower_red: "小红花", apple: "苹果花", appleFruit: "苹果", tulip: "郁金香", tulip_white: "白色郁金香" };
const GOAL_STATE_KEY = { flower: "flowerHoney", flower_yellow: "flowerYellowHoney", flower_red: "flowerRedHoney", apple: "appleHoney", appleFruit: "appleFruitHoney", tulip: "tulipHoney", tulip_white: "tulipWhiteHoney" };

function getActiveGoalKeys() {
  const keys = [];
  if (goalTargets.flower > 0) keys.push("flower");
  if (goalTargets.flower_yellow > 0) keys.push("flower_yellow");
  if (goalTargets.flower_red > 0) keys.push("flower_red");
  if (goalTargets.apple > 0) keys.push("apple");
  if (goalTargets.appleFruit > 0) keys.push("appleFruit");
  if (goalTargets.tulip > 0) keys.push("tulip");
  if (goalTargets.tulip_white > 0) keys.push("tulip_white");
  return keys;
}

function formatGoalsLine(separator = " · ") {
  return getActiveGoalKeys()
    .map((k) => `${GOAL_LABEL_MAP[k]} ${gameState[GOAL_STATE_KEY[k]]}/${goalTargets[k]}`)
    .join(separator);
}

function formatGoalsAchieved(separator = "，") {
  return getActiveGoalKeys()
    .map((k) => `${GOAL_LABEL_MAP[k]} ${gameState[GOAL_STATE_KEY[k]]}/${goalTargets[k]}`)
    .join(separator);
}

function formatGoalsBareCounts(separator = " · ") {
  return getActiveGoalKeys()
    .map((k) => `${GOAL_LABEL_MAP[k]} ${gameState[GOAL_STATE_KEY[k]]}`)
    .join(separator);
}

function buildGoalCardAriaLabel() {
  const parts = getActiveGoalKeys().map((k) => `${GOAL_LABEL_MAP[k]} ${goalTargets[k]}`);
  return `目标剩余：${parts.join("、")}`;
}

function applyGoalVisibility() {
  if (!dom) return;
  if (dom.goalFlowerItem) dom.goalFlowerItem.hidden = goalTargets.flower === 0;
  if (dom.goalFlowerYellowItem) dom.goalFlowerYellowItem.hidden = goalTargets.flower_yellow === 0;
  if (dom.goalFlowerRedItem) dom.goalFlowerRedItem.hidden = goalTargets.flower_red === 0;
  if (dom.goalAppleItem) dom.goalAppleItem.hidden = goalTargets.apple === 0;
  if (dom.goalAppleFruitItem) dom.goalAppleFruitItem.hidden = goalTargets.appleFruit === 0;
  if (dom.goalTulipItem) dom.goalTulipItem.hidden = goalTargets.tulip === 0;
  if (dom.goalTulipWhiteItem) dom.goalTulipWhiteItem.hidden = goalTargets.tulip_white === 0;
  if (dom.goalCard) dom.goalCard.setAttribute("aria-label", buildGoalCardAriaLabel());
}

function renderHud() {
  if (!dom) {
    return;
  }

  applyGoalVisibility();
  renderGoalHUD();
  const prevDisplayedBees = Number(dom.beesLeft.dataset.value);
  const nextBees = gameState.remainingBees;
  dom.beesLeft.textContent = String(nextBees);
  dom.beesLeft.dataset.value = String(nextBees);
  if (Number.isFinite(prevDisplayedBees) && nextBees < prevDisplayedBees && dom.beeCounterIcon) {
    const icon = dom.beeCounterIcon;
    icon.classList.remove("bee-counter__icon--jump");
    // 强制重排以重启动画
    void icon.offsetWidth;
    icon.classList.add("bee-counter__icon--jump");
  }


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
    dom.gameOverSummary.textContent = formatGoalsLine();
  }

  if (dom.gameWin && dom.gameWinSummary) {
    dom.gameWin.hidden = !gameState.isGameWin;
    const isFinalLevel = currentLevelIndex >= levelConfigs.length - 1;
    dom.gameWinSummary.textContent =
      `${levelConfigs[currentLevelIndex].name} 已达成：${formatGoalsAchieved()}`;
    if (dom.restartWinButton) {
      dom.restartWinButton.textContent = isFinalLevel ? "再来一遍" : "下一关";
    }
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
  const isScoreBouncing = gameState.scoreBounceTileIds.includes(tile.id);
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
    isScoreBouncing ? "tile--score-bounce" : "",
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
  if (isScoreBouncing) {
    // 用 negative animation-delay 让动画从已播放的进度继续，避免 renderBoard 重建 DOM 时跳跃从 0 重新开始
    const startedAt = gameState.scoreBounceStartedAt[tile.id];
    if (typeof startedAt === "number") {
      const elapsed = Math.max(0, getNow() - startedAt);
      button.style.setProperty("--bounce-delay", `${-elapsed}ms`);
    } else {
      button.style.setProperty("--bounce-delay", "0ms");
    }
  }
  button.dataset.tileId = tile.id;
  button.dataset.row = String(tile.row);
  button.dataset.col = String(tile.col);
  button.dataset.slotX = String(tile.slotX);
  button.dataset.type = isRevealed ? state.type : "hidden";
  button.dataset.growthStage = isRevealed ? state.growthStage ?? "" : "";
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

  const stageCountdown = getAppleTreeStageCountdown(state);
  button.innerHTML = `
    <span class="tile__ring" aria-hidden="true"></span>
    <span class="tile__inner" aria-hidden="true">${innerInnerHtml}</span>
    <span class="tile__label">${tile.id}</span>
    ${
      visibleDangerCount === null
        ? ""
        : `<span class="tile__danger" aria-hidden="true">${visibleDangerCount}</span>`
    }
    ${
      stageCountdown === null
        ? ""
        : `<span class="tile__stage-countdown" aria-hidden="true"><img class="tile__stage-countdown__bg" src="assets/ui/tree_countdown_01.png" alt="" /><span class="tile__stage-countdown__num">${stageCountdown}</span></span>`
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
  renderBoardTrail();
}

const trailSvgNs = "http://www.w3.org/2000/svg";

function getTileCenter(tileId) {
  const tile = tilesById[tileId];
  if (!tile) return null;
  return {
    x: boardMetrics.leftPadding + tile.slotX * boardMetrics.xUnit,
    y: boardMetrics.topPadding + tile.row * boardMetrics.yUnit,
  };
}

function renderBoardTrail() {
  if (!dom?.board) return;

  const sourcePath =
    gameState.currentPath && gameState.currentPath.length > 0
      ? gameState.currentPath
      : gameState.trailPath || [];

  let svg = dom.board.querySelector(":scope > svg.board__trail");

  if (!sourcePath || sourcePath.length === 0) {
    if (svg) svg.remove();
    return;
  }

  const points = sourcePath
    .map((id) => getTileCenter(id))
    .filter((p) => p);

  if (points.length === 0) {
    if (svg) svg.remove();
    return;
  }

  const boardWidth = parseFloat(dom.board.style.width) || dom.board.clientWidth;
  const boardHeight = parseFloat(dom.board.style.height) || dom.board.clientHeight;

  if (!svg) {
    svg = document.createElementNS(trailSvgNs, "svg");
    svg.classList.add("board__trail");
    svg.setAttribute("aria-hidden", "true");
    const glow = document.createElementNS(trailSvgNs, "path");
    glow.setAttribute("class", "board__trail-glow");
    const stroke = document.createElementNS(trailSvgNs, "path");
    stroke.setAttribute("class", "board__trail-stroke");
    const flow = document.createElementNS(trailSvgNs, "path");
    flow.setAttribute("class", "board__trail-flow");
    const head = document.createElementNS(trailSvgNs, "circle");
    head.setAttribute("class", "board__trail-head");
    head.setAttribute("r", "10");
    svg.appendChild(glow);
    svg.appendChild(stroke);
    svg.appendChild(flow);
    svg.appendChild(head);
    // 插入到棋盘最前面，确保 tile 覆盖在轨迹之上
    dom.board.insertBefore(svg, dom.board.firstChild);
  }

  svg.setAttribute("width", String(boardWidth));
  svg.setAttribute("height", String(boardHeight));
  svg.setAttribute("viewBox", `0 0 ${boardWidth} ${boardHeight}`);

  svg.classList.toggle("board__trail--fading", !!gameState.trailFading);
  svg.classList.toggle("board__trail--fail", !!gameState.trailFail);
  svg.classList.toggle("board__trail--single", points.length < 2);

  const d =
    points.length >= 2
      ? points
          .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
          .join(" ")
      : "";

  const glow = svg.querySelector(".board__trail-glow");
  const stroke = svg.querySelector(".board__trail-stroke");
  const flow = svg.querySelector(".board__trail-flow");
  const head = svg.querySelector(".board__trail-head");

  if (d) {
    glow.setAttribute("d", d);
    stroke.setAttribute("d", d);
    flow.setAttribute("d", d);
  } else {
    glow.removeAttribute("d");
    stroke.removeAttribute("d");
    flow.removeAttribute("d");
  }

  const headPoint = points[points.length - 1];
  head.setAttribute("cx", String(headPoint.x));
  head.setAttribute("cy", String(headPoint.y));
}

function renderAll() {
  renderHud();
  renderBoard();
}

function restartGame(options = {}) {
  clearFeedbackTimers();
  endCombo({ immediate: true });
  resetCollectionFeedback({ resetRunToken: true, clearFlights: true, resetDisplay: true });

  // 支持显式切关：options.levelIndex 优先；否则沿用当前关
  if (Number.isInteger(options.levelIndex)) {
    applyLevelConfig(options.levelIndex);
    // 关卡几何变化时，重算 board 尺寸
    computeBoardSize();
  }

  const nextOptions = {
    ...options,
    previousState: gameState,
  };
  gameState = createInitialGameState(nextOptions);
  const levelCfg = levelConfigs[currentLevelIndex];
  logEvent("初始化地图完成", {
    seed: gameState.currentSeed,
    source: gameState.roundConfigSource,
    summary: summarizeTileTypes(gameState.tileStateMap),
    roundConfig: getRoundConfigSnapshot(),
    levelId: levelCfg.id,
    levelIndex: currentLevelIndex,
  });
  renderAll();
  syncDebugHandle();
  syncBeeStaminaFromState();
  showLevelIntroToast();
  return gameState;
}

function showLevelIntroToast() {
  const cfg = levelConfigs[currentLevelIndex];
  if (!cfg) return;
  // 节奏 rest 关使用 info-rest 色调（沿用 info），普通关使用 info
  const tone = cfg.designerNotes?.kishoStage === "Rest" ? "info" : "info";
  showToast(`${cfg.name} · ${cfg.intro}`, tone);
}

function renderLevelSelectGrid() {
  if (!dom?.levelSelectGrid) return;
  const grid = dom.levelSelectGrid;
  grid.innerHTML = "";
  levelConfigs.forEach((cfg, idx) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "level-select-card";
    if (cfg.designerNotes?.kishoStage === "Rest") {
      card.classList.add("level-select-card--rest");
    }
    if (idx === currentLevelIndex) {
      card.classList.add("level-select-card--current");
    }
    card.dataset.levelIndex = String(idx);
    card.innerHTML =
      `<span class="level-select-card__id">${cfg.name}</span>` +
      `<span class="level-select-card__hook">${cfg.hooks}</span>`;
    grid.appendChild(card);
  });
}

function openLevelSelect() {
  if (!dom?.levelSelectOverlay) return;
  renderLevelSelectGrid();
  dom.levelSelectOverlay.hidden = false;
}

function closeLevelSelect() {
  if (!dom?.levelSelectOverlay) return;
  dom.levelSelectOverlay.hidden = true;
}

function attachLevelSelectListeners(restartHandler) {
  if (!dom?.levelSelectToggle) return;
  dom.levelSelectToggle.addEventListener("click", () => openLevelSelect());
  dom.levelSelectClose?.addEventListener("click", () => closeLevelSelect());
  dom.levelSelectOverlay?.addEventListener("click", (event) => {
    // 点击遮罩外层关闭；点击 panel 内部不关
    if (event.target === dom.levelSelectOverlay) {
      closeLevelSelect();
    }
  });
  dom.levelSelectGrid?.addEventListener("click", (event) => {
    const card = event.target.closest(".level-select-card");
    if (!card) return;
    const idx = Number(card.dataset.levelIndex);
    if (!Number.isInteger(idx) || idx < 0 || idx >= levelConfigs.length) return;
    closeLevelSelect();
    restartHandler({ levelIndex: idx });
  });
  // ESC 关闭
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && dom.levelSelectOverlay && !dom.levelSelectOverlay.hidden) {
      closeLevelSelect();
    }
  });
}

function beginRun(tileId, pointerId = null) {
  if (gameState.isSettling) {
    return { ok: false, reason: "settling" };
  }

  if (gameState.isDragging) {
    return { ok: false, reason: "already-dragging" };
  }

  if (gameState.isGameOver || gameState.remainingBees <= 0) {
    gameState.isGameOver = true;
    gameState.statusText = `游戏结束 · ${formatGoalsLine()}`;
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

  advanceAppleTreeStatesForNextRound();
  resetCollectionFeedback({ resetRunToken: true, clearFlights: true, resetDisplay: true });
  primeCollectAudio();
  gameState.currentStartTileId = tileId;
  gameState.isDragging = true;
  gameState.dragPointerId = pointerId;
  gameState.currentPath = [tileId];
  gameState.trailPath = [tileId];
  gameState.trailFading = false;
  gameState.trailFail = false;
  gameState.currentRunVisitedTileIds = new Set([tileId]);
  gameState.currentRunHarvestedTileIds = new Set();
  gameState.lastSafeTileId = tileId;
  gameState.hasHitEnemy = false;
  gameState.lastOutcome = null;
  gameState.beeStamina = beeStaminaConfig.maxPerRun;
  gameState.beeStaminaExhausted = false;
  if (beeStaminaConfig.countStartTile) {
    gameState.beeStamina = Math.max(0, gameState.beeStamina - 1);
  }
  syncBeeStaminaFromState();
  // 起点格也算被采集：把它压入 pendingScoreList（与 extendRun 共用同一份逻辑）
  enqueueTileCollection(tileId);
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

function computePendingHoneyTotal() {
  return gameState.pendingScoreList.reduce((sum, entry) => sum + (entry.amount || 0), 0);
}

function commitOneSideEffect(entry, options = {}) {
  const tileState = gameState.tileStateMap[entry.tileId];
  if (!tileState) return;
  // 新机制：经过一次即刻推进一档（blossom -> fruit -> harvested -> blossom）
  if (entry.sideEffect === "advance-to-fruit") {
    tileState.growthStage = "fruit";
    tileState.pendingFruit = false;
    tileState.pendingReBloom = false;
    tileState.fruitRoundCount = 0;
  } else if (entry.sideEffect === "advance-to-harvested") {
    tileState.growthStage = "harvested";
    tileState.pendingFruit = false;
    tileState.pendingReBloom = false;
    tileState.fruitRoundCount = 0;
  } else if (entry.sideEffect === "advance-to-blossom") {
    tileState.growthStage = "blossom";
    tileState.pendingFruit = false;
    tileState.pendingReBloom = false;
    tileState.fruitRoundCount = 0;
  } else if (entry.sideEffect === "advance-flower-to-sprout") {
    tileState.growthStage = "sprout";
  } else if (entry.sideEffect === "advance-flower-to-bloom") {
    tileState.growthStage = "bloom";
  } else if (entry.sideEffect === "advance-flower-yellow-to-sprout") {
    tileState.growthStage = "sprout";
  } else if (entry.sideEffect === "advance-flower-yellow-to-bloom") {
    tileState.growthStage = "bloom";
  } else if (entry.sideEffect === "advance-flower-red-to-sprout") {
    tileState.growthStage = "sprout";
  } else if (entry.sideEffect === "advance-flower-red-to-bloom") {
    tileState.growthStage = "bloom";
  } else if (entry.sideEffect === "advance-tulip-to-sprout") {
    tileState.growthStage = "sprout";
  } else if (entry.sideEffect === "advance-tulip-to-bloom") {
    tileState.growthStage = "bloom";
  } else if (entry.sideEffect === "advance-tulip-white-to-sprout") {
    tileState.growthStage = "sprout";
  } else if (entry.sideEffect === "advance-tulip-white-to-bloom") {
    tileState.growthStage = "bloom";
  } else if (entry.sideEffect === "advance-bee-pass") {
    // A-PLN-BEE-01：经过蜜蜂地块的副作用提交。
    // 顶点切图时机：tick() 会在 bounceDurationMs/2 调用本函数。
    if (entry.willReward) {
      // 第 2 次松手结算：顶点切到 bee_03，发射飞蜜蜂（落地后再切回 bee_01 并 +1 蜜蜂）
      tileState.growthStage = "stage2";
      spawnBeeRewardFlight(entry.tileId);
    } else {
      // 第 1 次松手结算：顶点切到 bee_02，passCount = 1
      tileState.growthStage = "stage1";
      tileState.beePassCount = 1;
    }
  }

  if (options.render) {
    triggerRenderOnly();
  }
}

function commitPendingSideEffects(list) {
  list.forEach((entry) => commitOneSideEffect(entry));
}

// ====== A-PLN-CATERPILLAR-01：青虫吃作物 + 跳跃位移 ======
// 触发时机：本轮结算尾，优先于小鸡群移动（先青虫，后小鸡）
// 规则：
//  - 触发对象：revealed && type === "caterpillar" 的所有 tile
//  - 候选目标：邻居中已翻开 + type ∈ {flower, apple_tree, tulip}
//  - 选择策略：随机一个
//  - 冲突处理：按 caterpillarId 升序结算；若 target 已被其它青虫吃过（不再是植被）则跳过
//  - 效果：源格变 empty；目标格变 caterpillar（作物消失，growthStage 清零）
//  - 视觉：贝塞尔弧线跳跃（insects_01.png 作飞行素材）+ 落地压扁 + 双方各一次翻牌闪现
function runCaterpillarMovementsAfterRound() {
  const VEGETATION_TYPES = new Set(["flower", "flower_yellow", "flower_red", "apple_tree", "tulip", "tulip_white"]);
  const moves = [];
  const skippedNoTarget = [];

  tiles.forEach((tile) => {
    const state = gameState.tileStateMap[tile.id];
    if (!state || !state.revealed || state.type !== "caterpillar") return;

    const vegNeighbors = adjacencyMap[tile.id].filter((nid) => {
      const ns = gameState.tileStateMap[nid];
      return ns && ns.revealed && VEGETATION_TYPES.has(ns.type);
    });

    if (vegNeighbors.length === 0) {
      skippedNoTarget.push(tile.id);
      return;
    }

    const targetId = vegNeighbors[Math.floor(Math.random() * vegNeighbors.length)];
    moves.push({ caterpillarId: tile.id, targetId });
  });

  if (moves.length === 0 && skippedNoTarget.length === 0) {
    return;
  }

  // 按 caterpillarId 升序，保证多只青虫冲突结算的确定性
  moves.sort((a, b) => a.caterpillarId.localeCompare(b.caterpillarId));

  const appliedMoves = [];
  const skippedConflict = [];

  // 同步状态推进：源格立即变 empty（视觉上源格"青虫消失"），目标格延迟到飞行落地时再变
  moves.forEach(({ caterpillarId, targetId }) => {
    const sourceState = gameState.tileStateMap[caterpillarId];
    const targetState = gameState.tileStateMap[targetId];
    if (!sourceState || !targetState) return;

    // 冲突复查：若该目标已被其它先动青虫"占用"（变成 caterpillar）或在结算中变化，跳过
    if (!targetState.revealed || !VEGETATION_TYPES.has(targetState.type)) {
      skippedConflict.push({ caterpillarId, targetId });
      return;
    }

    // 源格立即变 empty（青虫已起跳）
    sourceState.type = "empty";
    sourceState.growthStage = null;
    sourceState.pendingFruit = false;
    sourceState.fruitRoundCount = 0;
    sourceState.pendingReBloom = false;

    appliedMoves.push({ from: caterpillarId, to: targetId });

    // 发射跳跃飞行；落地回调中切目标 tile 类型 + 翻牌闪现 + 压扁
    spawnCaterpillarJump(caterpillarId, targetId, () => {
      const target = gameState.tileStateMap[targetId];
      if (!target) return;
      // 落地：目标格被青虫吃掉，变成 caterpillar，作物 growthStage 清空
      target.type = "caterpillar";
      target.growthStage = null;
      target.pendingFruit = false;
      target.fruitRoundCount = 0;
      target.pendingReBloom = false;

      // 全盘重算 dangerCount（青虫不算 enemy，但邻居 dangerCount 可能受 type 重排影响，统一重算）
      tiles.forEach((t) => {
        const ts = gameState.tileStateMap[t.id];
        if (!ts) return;
        ts.dangerCount = adjacencyMap[t.id].filter(
          (nid) => gameState.tileStateMap[nid]?.type === "enemy"
        ).length;
        if (gameState.roundConfig) {
          gameState.roundConfig[t.id] = ts.type;
        }
      });

      triggerTileFlip(targetId);
      triggerCaterpillarSquash(targetId);
      triggerRenderOnly();
    });

    // 源格翻牌闪现
    triggerTileFlip(caterpillarId);
  });

  // 立即重算一次 dangerCount（源格已变 empty），并触发渲染
  tiles.forEach((tile) => {
    const state = gameState.tileStateMap[tile.id];
    if (!state) return;
    state.dangerCount = adjacencyMap[tile.id].filter(
      (nid) => gameState.tileStateMap[nid]?.type === "enemy"
    ).length;
    if (gameState.roundConfig) {
      gameState.roundConfig[tile.id] = state.type;
    }
  });
  triggerRenderOnly();

  logEvent("青虫吃作物", {
    moves: appliedMoves,
    skippedNoTarget,
    skippedConflict,
  });
}

// 飞行素材 = insects_01.png，复用 feedbackState.activeFlights 管线
// 与飞花/飞蜜蜂的不同：轨迹更"贴地"（arcHeight 较低），不旋转或轻微摆动
function spawnCaterpillarJump(sourceTileId, targetTileId, onLand) {
  if (!hasDom || !dom?.fxOverlay) {
    onLand?.();
    return;
  }

  let startPoint = getTileFlightOrigin(sourceTileId);
  let endPoint = getTileFlightOrigin(targetTileId);

  if (!startPoint || !endPoint) {
    renderBoard();
    startPoint = startPoint || getTileFlightOrigin(sourceTileId);
    endPoint = endPoint || getTileFlightOrigin(targetTileId);
  }

  if (!startPoint || !endPoint) {
    onLand?.();
    return;
  }

  const dx = endPoint.x - startPoint.x;
  const dy = endPoint.y - startPoint.y;
  const midX = startPoint.x + dx * 0.5;
  // 跳跃弧线：比飞花/飞蜜蜂更低（地面感），约 60–80px
  const arcHeight = Math.min(90, Math.max(56, Math.abs(dx) * 0.18 + Math.abs(dy) * 0.18));
  const controlPoint = {
    x: midX,
    y: Math.min(startPoint.y, endPoint.y) - arcHeight,
  };

  const element = createFlowerFlightElement("caterpillar_jump");
  // 自定义初始尺寸偏大，让青虫看起来比飞花"实"一些
  element.style.transform = `translate(${startPoint.x}px, ${startPoint.y}px) translate(-50%, -50%) scale(0.85)`;
  dom.fxOverlay.appendChild(element);

  const flightId = ++feedbackState.flightCounter;
  feedbackState.activeFlights.set(flightId, {
    element,
    start: startPoint,
    control: controlPoint,
    end: endPoint,
    startTime: getNow(),
    duration: 560,
    // 轻微摆动：-8° → +8°
    rotationStart: -8,
    rotationDelta: 16,
    type: "caterpillar_jump",
    onLand,
  });
  ensureFlightLoop();
}

// 触发目标 tile 的着陆压扁动效
function triggerCaterpillarSquash(tileId) {
  if (!hasDom || !dom?.board) return;
  scheduleFeedback(() => {
    const el = dom.board.querySelector(`[data-tile-id="${tileId}"]`);
    if (!el) return;
    el.classList.remove("tile--caterpillar-squash");
    void el.offsetWidth;
    el.classList.add("tile--caterpillar-squash");
    scheduleFeedback(() => {
      el.classList.remove("tile--caterpillar-squash");
    }, 220);
  }, 0);
}

// 回合结束钩子：每只已揭示的小鸡与一个相邻植被地块互换位置。
// 规则：
//  - 触发对象：revealed && type === "enemy" 的所有 tile
//  - 候选目标：isSafeTileType(type) 的相邻 tile（不论 revealed），即 empty/flower/tulip/apple_tree
//  - 选择策略：随机一个
//  - 冲突处理：同步快照所有 (enemy, target)；按 enemyId 升序结算；
//             若 target 在结算时已变为 enemy（被其它鸡抢占），该只本回合跳过
//  - 状态语义：地块的 revealed/unlocked 不动，只换 type 与 growthStage；
//             其余生长相关字段（pendingFruit / fruitRoundCount / pendingReBloom）
//             随 type 一起带过去，确保苹果树阶段不丢失
//  - dangerCount：交换后统一全盘重算
//  - 视觉：复用 triggerTileFlip 给两个互换格各做一次翻牌闪现
function runEnemyMovementsAfterRound() {
  // —— 1. 同步快照 ——
  const moves = []; // { enemyId, targetId }
  const skippedNoNeighbor = [];

  tiles.forEach((tile) => {
    const state = gameState.tileStateMap[tile.id];
    if (!state || !state.revealed || state.type !== "enemy") return;

    const vegNeighbors = adjacencyMap[tile.id].filter((nid) => {
      const ns = gameState.tileStateMap[nid];
      // 小鸡只能跟"已经翻开的"安全植被格交换
      return ns && ns.revealed && isSafeTileType(ns.type);
    });

    if (vegNeighbors.length === 0) {
      skippedNoNeighbor.push(tile.id);
      return;
    }

    const targetId = vegNeighbors[Math.floor(Math.random() * vegNeighbors.length)];
    moves.push({ enemyId: tile.id, targetId });
  });

  if (moves.length === 0 && skippedNoNeighbor.length === 0) {
    return;
  }

  // 按 enemyId 升序，保证结算顺序确定
  moves.sort((a, b) => a.enemyId.localeCompare(b.enemyId));

  const flipTileSet = new Set();
  const appliedMoves = [];
  const skippedConflict = [];

  // —— 2. 逐只结算 ——
  moves.forEach(({ enemyId, targetId }) => {
    const enemyState = gameState.tileStateMap[enemyId];
    const targetState = gameState.tileStateMap[targetId];
    if (!enemyState || !targetState) return;

    // 复查：目标格此刻是否仍是"已揭示的植被"？若被先动的小鸡抢占（已变 enemy）
    // 或后续机制把 revealed 翻回 false，都跳过
    if (!targetState.revealed || !isSafeTileType(targetState.type)) {
      skippedConflict.push({ enemyId, targetId });
      return;
    }

    // 交换 type
    const enemyType = enemyState.type;
    const vegType = targetState.type;
    enemyState.type = vegType;
    targetState.type = enemyType;

    // 交换 growthStage 与相关阶段字段（让"植物身份"完整带走）
    const enemyGrowthStage = enemyState.growthStage;
    const enemyPendingFruit = enemyState.pendingFruit;
    const enemyFruitRoundCount = enemyState.fruitRoundCount;
    const enemyPendingReBloom = enemyState.pendingReBloom;

    enemyState.growthStage = targetState.growthStage;
    enemyState.pendingFruit = targetState.pendingFruit;
    enemyState.fruitRoundCount = targetState.fruitRoundCount;
    enemyState.pendingReBloom = targetState.pendingReBloom;

    // 小鸡处原本没有有意义的植物状态，按新 type 的初始值兜底
    targetState.growthStage = enemyGrowthStage ?? getInitialGrowthStage(enemyType);
    targetState.pendingFruit = enemyPendingFruit ?? false;
    targetState.fruitRoundCount = enemyFruitRoundCount ?? 0;
    targetState.pendingReBloom = enemyPendingReBloom ?? false;

    // revealed / unlocked / id / row / col / slotX / neighbors 一律不动

    flipTileSet.add(enemyId);
    flipTileSet.add(targetId);
    appliedMoves.push({ from: enemyId, to: targetId });
  });

  // —— 3. 全盘重算 dangerCount + 同步 roundConfig（仅供日志快照） ——
  tiles.forEach((tile) => {
    const state = gameState.tileStateMap[tile.id];
    if (!state) return;
    state.dangerCount = adjacencyMap[tile.id].filter(
      (nid) => gameState.tileStateMap[nid]?.type === "enemy"
    ).length;
    if (gameState.roundConfig) {
      gameState.roundConfig[tile.id] = state.type;
    }
  });

  // —— 4. 视觉反馈 ——
  flipTileSet.forEach((tileId) => triggerTileFlip(tileId));
  triggerRenderOnly();

  // —— 5. 日志 ——
  logEvent("小鸡回合移动", {
    moves: appliedMoves,
    skippedNoNeighbor,
    skippedConflict,
  });
}

function triggerScoreBounce(tileId) {
  const startedAt = getNow();
  if (!gameState.scoreBounceTileIds.includes(tileId)) {
    gameState.scoreBounceTileIds = [...gameState.scoreBounceTileIds, tileId];
  }
  gameState.scoreBounceStartedAt = {
    ...gameState.scoreBounceStartedAt,
    [tileId]: startedAt,
  };
  scheduleFeedback(() => {
    gameState.scoreBounceTileIds = gameState.scoreBounceTileIds.filter((id) => id !== tileId);
    const nextStartedAt = { ...gameState.scoreBounceStartedAt };
    delete nextStartedAt[tileId];
    gameState.scoreBounceStartedAt = nextStartedAt;
    triggerRenderOnly();
  }, settlementSequenceConfig.bounceDurationMs + 20);
  triggerRenderOnly();
}

function waitForAllFlightsToLand(callback) {
  const checkInterval = 40;
  const maxWaitMs = 4000;
  const startedAt = getNow();

  function check() {
    const noActive = feedbackState.activeFlights.size === 0;
    const noPending = feedbackState.pendingLaunchCount === 0;
    if ((noActive && noPending) || getNow() - startedAt > maxWaitMs) {
      scheduleCollectionTask(callback, settlementSequenceConfig.waitFlightsTailMs);
      return;
    }
    scheduleCollectionTask(check, checkInterval);
  }

  check();
}

function playRunSettlementSequence(list, onComplete) {
  gameState.isSettling = true;
  renderAll();

  let cursor = 0;

  function tick() {
    // 仅“非 silentBounce 的 amount=0”条目走原即时 commit 通道（无视觉节奏）
    while (
      cursor < list.length &&
      list[cursor].amount === 0 &&
      !list[cursor].silentBounce
    ) {
      commitOneSideEffect(list[cursor], { render: true });
      cursor += 1;
    }

    if (cursor >= list.length) {
      waitForAllFlightsToLand(() => {
        onComplete?.();
      });
      return;
    }

    const item = list[cursor];
    cursor += 1;

    // 小跳：amount>0 或 silentBounce 都要跳
    triggerScoreBounce(item.tileId);

    // +N 浮字：仅 amount>0 显示，silentBounce 不显示（避免 “+0”）
    if (item.amount > 0) {
      spawnTilePopupText(item.tileId, item.amount);
    }

    // A2：小跳顶点切换阶段图
    scheduleCollectionTask(
      () => commitOneSideEffect(item, { render: true }),
      Math.floor(settlementSequenceConfig.bounceDurationMs / 2)
    );

    // 飞花：仅 amount>0 触发
    const flowerCount = item.amount;
    for (let i = 0; i < flowerCount; i += 1) {
      scheduleCollectionTask(
        () => spawnFlowerFlyEffect(item.tileId, item.type),
        i * settlementSequenceConfig.intraTileGapMs
      );
    }

    scheduleCollectionTask(tick, settlementSequenceConfig.staggerMs);
  }

  tick();
}

function finalizeSuccessRun(context) {
  const {
    path,
    pathLength,
    consumedBee,
    nextStartTileId,
    pendingList,
  } = context;

  // 副作用已在 playRunSettlementSequence 的 tick() 中按节奏逐条 commit
  // 这里不再重复 commit，避免破坏“跳到顶点切换阶段图”的视觉
  // 三桶花蜜（flowerHoney / appleHoney / tulipHoney）改由飞花落地时
  // 在 commitGoalArrival 内逐朵提交；totalHoney 同步派生为三桶之和。

  const gainedHoney = pendingList.reduce((sum, entry) => sum + (entry.amount || 0), 0);
  // 分项汇总（仅用于 logEvent / statusText，不再写入 gameState）
  let gainedFlower = 0;
  let gainedFlowerYellow = 0;
  let gainedFlowerRed = 0;
  let gainedApple = 0;
  let gainedAppleFruit = 0;
  let gainedTulip = 0;
  let gainedTulipWhite = 0;
  pendingList.forEach((entry) => {
    const amount = entry.amount || 0;
    if (amount <= 0) return;
    if (entry.type === "flower") {
      gainedFlower += amount;
    } else if (entry.type === "flower_yellow") {
      gainedFlowerYellow += amount;
    } else if (entry.type === "flower_red") {
      gainedFlowerRed += amount;
    } else if (entry.type === "apple_tree_blossom") {
      gainedApple += amount;
    } else if (entry.type === "apple_tree_fruit") {
      gainedAppleFruit += amount;
    } else if (entry.type === "tulip") {
      gainedTulip += amount;
    } else if (entry.type === "tulip_white") {
      gainedTulipWhite += amount;
    }
  });
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
    gainedFlower,
    gainedFlowerYellow,
    gainedFlowerRed,
    gainedApple,
    gainedAppleFruit,
    gainedTulip,
    gainedTulipWhite,
    totalHoney: gameState.totalHoney,
    flowerHoney: gameState.flowerHoney,
    flowerYellowHoney: gameState.flowerYellowHoney,
    flowerRedHoney: gameState.flowerRedHoney,
    appleHoney: gameState.appleHoney,
    appleFruitHoney: gameState.appleFruitHoney,
    tulipHoney: gameState.tulipHoney,
    tulipWhiteHoney: gameState.tulipWhiteHoney,
    nextStartTileId,
    sideEffects: pendingList.map((entry) => ({ tileId: entry.tileId, sideEffect: entry.sideEffect })),
  });

  // 通关 / game-over 判定推迟到序列尾
  if (
    gameState.flowerHoney >= goalTargets.flower &&
    gameState.flowerYellowHoney >= goalTargets.flower_yellow &&
    gameState.flowerRedHoney >= goalTargets.flower_red &&
    gameState.appleHoney >= goalTargets.apple &&
    gameState.appleFruitHoney >= goalTargets.appleFruit &&
    gameState.tulipHoney >= goalTargets.tulip &&
    gameState.tulipWhiteHoney >= goalTargets.tulip_white
  ) {
    gameState.isGameWin = true;
    gameState.isGameOver = true;
    const isFinalLevel = currentLevelIndex >= levelConfigs.length - 1;
    const winTitle = isFinalLevel ? "全部通关！" : `第 ${currentLevelIndex + 1} 关通关！`;
    gameState.statusText = `${winTitle} ${formatGoalsBareCounts()}`;
    showToast(winTitle, "success");
    logEvent("level-result", {
      levelId: levelConfigs[currentLevelIndex].id,
      levelIndex: currentLevelIndex,
      win: true,
      isFinalLevel,
      beesLeft: gameState.remainingBees,
      flowerHoney: gameState.flowerHoney,
      flowerYellowHoney: gameState.flowerYellowHoney,
      flowerRedHoney: gameState.flowerRedHoney,
      appleHoney: gameState.appleHoney,
      appleFruitHoney: gameState.appleFruitHoney,
      tulipHoney: gameState.tulipHoney,
      tulipWhiteHoney: gameState.tulipWhiteHoney,
    });
    logEvent("通关", getStateSnapshot());
  } else if (gameState.remainingBees <= 0) {
    updateGameOverState();
    logEvent("level-result", {
      levelId: levelConfigs[currentLevelIndex].id,
      levelIndex: currentLevelIndex,
      win: false,
      isFinalLevel: currentLevelIndex >= levelConfigs.length - 1,
      beesLeft: gameState.remainingBees,
      flowerHoney: gameState.flowerHoney,
      flowerYellowHoney: gameState.flowerYellowHoney,
      flowerRedHoney: gameState.flowerRedHoney,
      appleHoney: gameState.appleHoney,
      appleFruitHoney: gameState.appleFruitHoney,
      tulipHoney: gameState.tulipHoney,
      tulipWhiteHoney: gameState.tulipWhiteHoney,
    });
  }

  gameState.pendingScoreList = [];
  gameState.isSettling = false;
  queueRoundHoneyReset();
  renderAll();
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
    // 失败：所有 pending 副作用与得分一律作废
    gameState.pendingScoreList = [];
    gameState.lastEndedTileId = nextStartTileId;
    gameState.currentStartTileId = null;
    resetCollectionFeedback({ resetRunToken: true, clearFlights: true });
    gameState.statusText = consumedBee ? "踩到天敌，本轮失败。" : "本轮失败，蜜蜂未消耗。";
    showToast(gameState.statusText, consumedBee ? "fail" : "info");
    logEvent("本轮失败结算", {
      path,
      pathLength,
      consumedBee,
      nextStartTileId,
      totalHoney: gameState.totalHoney,
    });
    gameState.isDragging = false;
    gameState.dragPointerId = null;
    gameState.currentPath = [];
    gameState.trailPath = [...path];
    gameState.trailFail = true;
    gameState.trailFading = true;
    scheduleFeedback(() => {
      gameState.trailPath = [];
      gameState.trailFading = false;
      gameState.trailFail = false;
      triggerRenderOnly();
      // 先青虫吃作物，再小鸡群移动
      runCaterpillarMovementsAfterRound();
      runEnemyMovementsAfterRound();
    }, animationDurations.failFlash + animationDurations.trailFade);
    gameState.currentRunVisitedTileIds = new Set();
    gameState.currentRunHarvestedTileIds = new Set();
    gameState.hasHitEnemy = false;
    gameState.lastOutcome = outcome;
    updateGameOverState();
    renderAll();
    return { ok: true, reason: outcome, path, nextStartTileId };
  }

  // 成功：先把同步状态写完，把序列要用的快照拿出来
  const pendingListSnapshot = gameState.pendingScoreList.slice();
  gameState.lastEndedTileId = nextStartTileId;
  gameState.currentStartTileId = null;
  gameState.isDragging = false;
  gameState.dragPointerId = null;
  gameState.currentPath = [];
  gameState.trailPath = [...path];
  gameState.trailFading = false;
  gameState.trailFail = false;
  gameState.currentRunVisitedTileIds = new Set();
  gameState.currentRunHarvestedTileIds = new Set();
  gameState.hasHitEnemy = false;
  gameState.lastOutcome = outcome;
  // 体力环不在本轮收尾时回满，保留当前残量直到下一轮 beginRun 再统一重置

  const totalAmount = pendingListSnapshot.reduce((sum, entry) => sum + (entry.amount || 0), 0);
  const hasAnyEntries = pendingListSnapshot.length > 0;

  if (totalAmount === 0 && !hasAnyEntries) {
    // 纯路过，没有任何 pending：直接走原“未采集”分支
    gameState.statusText = consumedBee
      ? "本轮成功，获得 0 花蜜。"
      : "本轮未采集，蜜蜂未消耗。";
    triggerSuccessFeedback(nextStartTileId, 0, {
      message: gameState.statusText,
      tone: consumedBee ? "success" : "info",
    });
    if (gameState.remainingBees <= 0) {
      updateGameOverState();
    }
    queueRoundHoneyReset();
    scheduleTrailFadeOut(0);
    // 先青虫吃作物，再小鸡群移动
    runCaterpillarMovementsAfterRound();
    runEnemyMovementsAfterRound();
    renderAll();
    return { ok: true, reason: outcome, path, nextStartTileId };
  }

  const hasSilentBounce = pendingListSnapshot.some((entry) => entry.silentBounce);

  if (totalAmount === 0 && hasAnyEntries && !hasSilentBounce) {
    // 无花蜜、无 silentBounce：原即时 commit 捷径
    commitPendingSideEffects(pendingListSnapshot);
    gameState.pendingScoreList = [];
    gameState.statusText = consumedBee
      ? "本轮成功，获得 0 花蜜。"
      : "本轮未采集，蜜蜂未消耗。";
    triggerSuccessFeedback(nextStartTileId, 0, {
      message: gameState.statusText,
      tone: consumedBee ? "success" : "info",
    });
    if (gameState.remainingBees <= 0) {
      updateGameOverState();
    }
    queueRoundHoneyReset();
    scheduleTrailFadeOut(0);
    // 先青虫吃作物，再小鸡群移动
    runCaterpillarMovementsAfterRound();
    runEnemyMovementsAfterRound();
    renderAll();
    return { ok: true, reason: outcome, path, nextStartTileId };
  }

  // 有花蜜要入账：进入结算序列
  playRunSettlementSequence(pendingListSnapshot, () => {
    finalizeSuccessRun({
      path,
      pathLength,
      consumedBee,
      nextStartTileId,
      pendingList: pendingListSnapshot,
    });
    scheduleTrailFadeOut(0);
    // 先青虫吃作物，再小鸡群移动
    runCaterpillarMovementsAfterRound();
    runEnemyMovementsAfterRound();
  });

  renderAll();
  return { ok: true, reason: outcome, path, nextStartTileId };
}

// 把一格的“采集/副作用”压入 pendingScoreList。
// 起点格（beginRun）与滑入的新格（extendRun）都会调用，保证起点同样被采集。
function enqueueTileCollection(tileId) {
  const tileState = gameState.tileStateMap[tileId];
  if (!tileState) return;

  const alreadyInPendingScore = gameState.pendingScoreList.some(
    (entry) => entry.tileId === tileId
  );
  if (alreadyInPendingScore) return;

  if (tileState.type === "flower") {
    const flowerStage = getFlowerStage(tileState);
    if (flowerStage === "bloom") {
      gameState.pendingScoreList.push({
        tileId,
        type: "flower",
        amount: 1,
        sideEffect: "advance-flower-to-sprout",
      });
      incrementCombo(tileId);
    } else {
      // sprout：采集 0 花蜜、不触发 Combo / 不出飞花，
      // 但走一次"silentBounce 小跳 + 顶点切图"作为视觉反馈
      gameState.pendingScoreList.push({
        tileId,
        type: "flower_sprout",
        amount: 0,
        sideEffect: "advance-flower-to-bloom",
        silentBounce: true,
      });
    }
  } else if (tileState.type === "flower_yellow") {
    // A-PLN-FLOWER-COLORS-01：小黄花，逻辑与白花一致，独立桶
    const stage = getFlowerYellowStage(tileState);
    if (stage === "bloom") {
      gameState.pendingScoreList.push({
        tileId,
        type: "flower_yellow",
        amount: 1,
        sideEffect: "advance-flower-yellow-to-sprout",
      });
      incrementCombo(tileId);
    } else {
      gameState.pendingScoreList.push({
        tileId,
        type: "flower_yellow_sprout",
        amount: 0,
        sideEffect: "advance-flower-yellow-to-bloom",
        silentBounce: true,
      });
    }
  } else if (tileState.type === "flower_red") {
    // A-PLN-FLOWER-COLORS-01：小红花，逻辑与白花一致，独立桶
    const stage = getFlowerRedStage(tileState);
    if (stage === "bloom") {
      gameState.pendingScoreList.push({
        tileId,
        type: "flower_red",
        amount: 1,
        sideEffect: "advance-flower-red-to-sprout",
      });
      incrementCombo(tileId);
    } else {
      gameState.pendingScoreList.push({
        tileId,
        type: "flower_red_sprout",
        amount: 0,
        sideEffect: "advance-flower-red-to-bloom",
        silentBounce: true,
      });
    }
  } else if (tileState.type === "tulip") {
    const tulipStage = getTulipStage(tileState);
    if (tulipStage === "bloom") {
      gameState.pendingScoreList.push({
        tileId,
        type: "tulip",
        amount: 2,
        sideEffect: "advance-tulip-to-sprout",
      });
      incrementCombo(tileId);
    } else {
      // sprout：0 花蜜，不触发 Combo / 不出飞花，
      // silentBounce 小跳 + 顶点切回 bloom
      gameState.pendingScoreList.push({
        tileId,
        type: "tulip_sprout",
        amount: 0,
        sideEffect: "advance-tulip-to-bloom",
        silentBounce: true,
      });
    }
  } else if (tileState.type === "tulip_white") {
    // A-PLN-TULIP-WHITE-01：白色郁金香，逻辑与紫色郁金香完全一致
    const stage = getTulipWhiteStage(tileState);
    if (stage === "bloom") {
      gameState.pendingScoreList.push({
        tileId,
        type: "tulip_white",
        amount: 2,
        sideEffect: "advance-tulip-white-to-sprout",
      });
      incrementCombo(tileId);
    } else {
      gameState.pendingScoreList.push({
        tileId,
        type: "tulip_white_sprout",
        amount: 0,
        sideEffect: "advance-tulip-white-to-bloom",
        silentBounce: true,
      });
    }
  } else if (
    tileState.type === "apple_tree" &&
    getAppleTreeGrowthStage(tileState) === "blossom"
  ) {
    // 开花期：采两朵苹果花
    gameState.pendingScoreList.push({
      tileId,
      type: "apple_tree_blossom",
      amount: 2,
      sideEffect: "advance-to-fruit",
    });
    incrementCombo(tileId);
  } else if (
    tileState.type === "apple_tree" &&
    getAppleTreeGrowthStage(tileState) === "fruit"
  ) {
    // 结果期：采一个苹果
    gameState.pendingScoreList.push({
      tileId,
      type: "apple_tree_fruit",
      amount: 1,
      sideEffect: "advance-to-harvested",
    });
    incrementCombo(tileId);
  } else if (
    tileState.type === "apple_tree" &&
    getAppleTreeGrowthStage(tileState) === "harvested"
  ) {
    gameState.pendingScoreList.push({
      tileId,
      type: "apple_tree_harvested",
      amount: 0,
      sideEffect: "advance-to-blossom",
      silentBounce: true,
    });
  } else if (tileState.type === "bee") {
    // A-PLN-BEE-01：蜜蜂地块累计经过 2 次 → +1 蜜蜂
    // 每次经过都走 silentBounce：amount=0，不计 Combo、不进花蜜桶
    // 第 2 次（passCount 当前为 1）触发奖励：顶点切到 bee_03，并发射飞蜜蜂
    const willReward = (tileState.beePassCount || 0) + 1 >= 2;
    gameState.pendingScoreList.push({
      tileId,
      type: "bee",
      amount: 0,
      sideEffect: "advance-bee-pass",
      silentBounce: true,
      willReward,
    });
  }
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
  // 本轮“首访”判定：在写入 currentRunVisitedTileIds 之前抓，用来闸住体力扣减
  const isFirstVisitThisRun = !gameState.currentRunVisitedTileIds.has(tileId);
  gameState.currentPath.push(tileId);
  gameState.trailPath = [...gameState.currentPath];
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

  // 拖动期：所有“收益 / 副作用”都不立即生效，仅 push 到 pendingScoreList，
  // 等松手成功结算播完序列后再统一入账与提交副作用。
  enqueueTileCollection(tileId);

  // 拖动期 statusText 统一口径（口径 C）：只显示路径长度，不再透露具体得分
  gameState.statusText = `采集中：已走 ${gameState.currentPath.length} 格`;

  playTileRevealSound();

  // 体力消耗：仅在“本轮第一次踩到这个地块”时扣 1 格体力；同轮复访免费
  // beeStaminaConfig.enabled = false 时完全跳过体力扣减与自动结算
  let justExhausted = false;
  if (beeStaminaConfig.enabled && isFirstVisitThisRun) {
    gameState.beeStamina = Math.max(0, gameState.beeStamina - 1);
    justExhausted = gameState.beeStamina === 0 && !gameState.beeStaminaExhausted;
    if (gameState.beeStamina === 0) {
      gameState.beeStaminaExhausted = true;
    }
    syncBeeStaminaFromState();
  }

  logEvent("路径加入格子", {
    tileId,
    tileType: tileState.type,
    path: [...gameState.currentPath],
    pendingHoneyTotal: computePendingHoneyTotal(),
    beeStamina: gameState.beeStamina,
    isFirstVisitThisRun,
  });

  renderAll();

  if (justExhausted) {
    logEvent("蜜蜂体力耗尽，自动结算本轮", {
      tileId,
      path: [...gameState.currentPath],
      pendingHoneyTotal: computePendingHoneyTotal(),
    });
    return completeRun("success");
  }

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
  if (gameState.isSettling) {
    // 结算序列播放中：静默忽略所有手势
    return;
  }

  const tileElement = event.target.closest?.(".tile");

  if (!tileElement) {
    return;
  }

  const tileId = tileElement.dataset.tileId;

  if (gameState.isGameOver || gameState.remainingBees <= 0) {
    gameState.isGameOver = true;
    gameState.statusText = `游戏结束 · ${formatGoalsLine()}`;
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

function setBeeStaminaDisplay(ratio, exhausted) {
  if (!hasDom) {
    return;
  }

  const cursorEl = getCustomCursorElement();
  if (!cursorEl) {
    return;
  }

  const clamped = Math.max(0, Math.min(1, Number.isFinite(ratio) ? ratio : 1));
  cursorEl.style.setProperty("--bee-stamina", String(clamped));
  cursorEl.classList.toggle("custom-cursor--exhausted", !!exhausted);
}

function syncBeeStaminaFromState() {
  if (!beeStaminaConfig.enabled) {
    // 体力总开关关闭：显示 100%（满环）但不应被看见，配合 CSS 隐藏体力环
    setBeeStaminaDisplay(1, false);
    return;
  }
  const max = beeStaminaConfig.maxPerRun || 1;
  const ratio = Math.max(0, Math.min(1, gameState.beeStamina / max));
  setBeeStaminaDisplay(ratio, gameState.beeStaminaExhausted);
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
  const restartHandler = (options = {}) => {
    const previousSeed = gameState.currentSeed;
    restartGame(options);
    logEvent("重新开始", {
      previousSeed,
      nextSeed: gameState.currentSeed,
      levelIndex: currentLevelIndex,
    });
  };
  // game-over 面板：本关重来（不切关）
  dom.restartButton?.addEventListener("click", () => restartHandler());
  // win 面板：非末关→下一关；末关→回到 L1
  dom.restartWinButton?.addEventListener("click", () => {
    const isFinalLevel = currentLevelIndex >= levelConfigs.length - 1;
    const nextLevelIndex = isFinalLevel ? 0 : currentLevelIndex + 1;
    restartHandler({ levelIndex: nextLevelIndex });
  });

  // 选关界面
  attachLevelSelectListeners(restartHandler);
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
    levelConfigs,
    get currentLevelIndex() {
      return currentLevelIndex;
    },
    get currentLevel() {
      return levelConfigs[currentLevelIndex];
    },
    gotoLevel(idx) {
      return restartGame({ levelIndex: idx });
    },
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
  // 顶层模块已经 applyLevelConfig(0) 过；这里仅再校验，确保 DOM ready 后盘面尺寸正确
  validateLayoutConfig();
  computeBoardSize();
  attachEventListeners();
  restartGame();
  prepareEnemyOverlayAsset();
  initBgm();
}

init();
