# B-COD 记录

## Claim
- 任务 ID：B-COD-APPLE-PASSBY-01
- 当前 claim：模块《苹果树"一次经过即推进"机制改造》
- 范围：
  - 苹果树状态推进改为完全由"玩家经过"驱动，每次成功结算瞬间推进一档
  - 循环规则：`blossom → fruit → harvested → blossom`
  - `extendRun()` 中三态分支重写：blossom +3 + `advance-to-fruit`；fruit +0 + `advance-to-harvested`；harvested +0 + `advance-to-blossom`
  - `commitPendingSideEffects()` 改为直推 `growthStage`，不再使用 `pendingFruit / pendingReBloom / fruitRoundCount`
  - `advanceAppleTreeStatesForNextRound()` 退役为空壳（保留函数签名以兼容旧调用点）
  - `getAppleTreeStageCountdown()` 统一返回 `null`，不再显示三态倒计时角标
  - 撞天敌失败仍走"作废 pending"，被路过的苹果树不推进
  - 同轮重复经过同一棵苹果树：`alreadyInPendingScore` 去重，仅推进一档
  - `index.html` 资源版本号升级为 `apple-passby-20260615-1`
- 历史 claim 已闭环：`B-COD-SETTLE-SEQUENCE-01`（结算延迟 + 飞币序列）

## 旧 claim：B-COD-SETTLE-SEQUENCE-01
- 当前 claim：模块《结算延迟到松手 + 飞币归集序列》
- 范围：
  - 拖动期"只记账不入账"：`pendingScoreList` 收集 flower / apple_tree blossom / apple_tree harvested 三类条目
  - 松手成功结算：按路径顺序逐格跳 + 飞花，全部落地后提交副作用与花蜜
  - HUD 暂存拖动中恒为 0；statusText 统一显示 `"采集中：已走 N 格"`
  - 失败链路一律作废 pending（含苹果状态副作用）
  - 序列期间 `pointerdown / beginRun` 静默拦截
- 历史 claim 已闭环：`B-COD-APPLE-TREE-01`（苹果果树三态 + 循环流转 + 视觉位置微调）、`UI-BEE-STAMINA-01`（蜜蜂体力环）
- 历史 claim 已闭环：`ART-TILE-ENEMY-01`（天敌格子双层资源叠加显示）
- 历史 claim 已闭环：`B-COD-DEMO-FEEDBACK-001`（花朵采集反馈）、`B-COD-DEMO-FEEDBACK-002`（自定义光标）、`B-COD-DEMO-FEEDBACK-002-A`（光标资源接入）、`SFX-01`（翻格音效）、`SFX-02`（撞天敌音效）、`FX-01`（采集范围高亮）、`B-COD-DEMO-AUDIO-001`（主背景 BGM 接入）、`FX-02`（起点格子强化标识）、`RULE-01`（取消起点继承 + 自由选择起点）、`RULE-02`（蜜蜂消耗保护机制）、`RULE-03 / FX-03`（删除固定起点 UI + 非法点击反馈）

## 实现记录
- 本轮（`B-COD-SETTLE-SEQUENCE-01`）核心改造：把"采集即结算"改为"松手后按路径顺序播放飞币归集 + 得分格小跳"
  - 新增常量 `settlementSequenceConfig = { staggerMs:160, intraTileGapMs:80, bounceDurationMs:220, bounceHeightPx:8, waitFlightsTailMs:120 }`
  - `gameState` 新增三个字段：
    - `pendingScoreList: Array<{ tileId, type, amount, sideEffect }>`
    - `isSettling: boolean`
    - `scoreBounceTileIds: string[]`
  - `extendRun()` 重写收益分支：
    - flower 首访 → push `{type:"flower", amount:1, sideEffect:null}`
    - apple_tree blossom 首访 → push `{type:"apple_tree_blossom", amount:3, sideEffect:"set-pending-fruit"}`
    - apple_tree harvested 首访 → push `{type:"apple_tree_harvested", amount:0, sideEffect:"set-pending-rebloom"}`
    - 不再立即写 `currentRunHoney / pendingFruit / pendingReBloom`
    - 不再立即 `spawnFlowerFlyEffect / enqueueTempHoneyIncrement`
    - statusText 统一为 `"采集中：已走 N 格"`
    - Combo 仍即时弹（仅在 flower / apple_tree blossom 首访触发）
  - 新增函数 `playRunSettlementSequence(list, onComplete)`：
    - 跳过 `amount===0` 条目（不消耗 stagger）
    - 每个得分条目：`triggerScoreBounce(tileId)` + 按 `intraTileGapMs` 错峰发 N 朵飞花
    - 序列收尾用 `waitForAllFlightsToLand` 等所有飞花落地 + `waitFlightsTailMs` 兜底缓冲
  - 新增函数 `commitPendingSideEffects(list)`：序列尾统一提交 `pendingFruit / pendingReBloom`
  - 新增函数 `finalizeSuccessRun(context)`：副作用提交 + `totalHoney +=` + `triggerSuccessFeedback` + 通关/`game-over` 判定
  - `completeRun("success")` 重写：
    - 同步操作（蜜蜂扣费、清 path、设 nextStartTileId、退出 isDragging）保持松手即时
    - 0 收益 + 0 条目 → 直接走"未采集"分支
    - 0 收益 + 仅 harvested 条目 → 静默 commitPendingSideEffects，不进序列
    - 有收益 → 进入 `playRunSettlementSequence`
  - `completeRun("failure")` 重写：
    - `pendingScoreList = []`、不提交任何副作用
    - 其余失败反馈链路维持
  - `beginRun()` 与 `handlePointerDown()` 顶部新增 `if (gameState.isSettling) return`，静默拦截
  - `createTileElement()` 新增 `tile--score-bounce` class 判定
  - `style.css` 新增 keyframes `tile-score-bounce`：220ms 内 `translateY(0 → -8px → 0)`，作用于 `.tile__inner`
  - `index.html` 资源版本号升级为 `settle-sequence-20260616-1`
- 上一轮（`B-COD-APPLE-TREE-01` 完结）：新增 `apple_tree` 地块类型，并把默认随机分布调整为 `enemy:3 / flower:9 / apple_tree:1 / empty:6`，确保正常开局即可生成苹果果树地块
- 新增 `appleTreeStateAssetMap` 与 `tileState.growthStage`；苹果果树统一走 `blossom / fruit / harvested` 三态，初始化默认 `blossom`
- `getTileVisualMarkup()` 现对 `apple_tree` 复用安全格双层结构：底图固定 `tile-empty.png`，前景按 `growthStage` 切到 `apple_tree_blossom_01.png / apple_tree_fruit_01.png / apple_tree_harvested_01.png`
- `isSafeTileType()` / `isValidStartCandidate()` 已纳入 `apple_tree`，保证苹果果树在解锁后仍可作为安全路径格与起点候选
- `extendRun()` 已接入苹果果树收益：仅 `blossom` 被采集时 `+3` 花蜜，并立即把 `growthStage` 切到 `fruit`；`fruit / harvested` 只路过不再重复给收益
- 新增 `advanceAppleTreeStatesForNextRound()`，并在 `beginRun()` 这个“下一回合开始”的统一入口调用：所有 `fruit` 苹果果树会在新一轮开始时自动切到 `harvested`
- 视觉规则修正：苹果果树被翻开的瞬间必须永远显示 `blossom`，不能直接显示 `fruit / harvested`
  - 新增 `tileState.pendingFruit` 标志位，初始为 `false`
  - `extendRun()` 采集 `blossom` 时 `+3` 花蜜，但 `growthStage` 不再立即切到 `fruit`，改为把 `pendingFruit = true`，视觉本轮保持 `blossom`
  - `advanceAppleTreeStatesForNextRound()` 现在同时处理：`fruit -> harvested`，以及 `blossom + pendingFruit -> fruit`（并清 `pendingFruit`）
  - 同回合再次踩到已采苹果果树：视觉仍是 `blossom`，但不会再次 `+3`
- 苹果果树循环规则：`fruit` 阶段持续两个回合后变 `harvested`；`harvested` 被路过后下一回合重新开花
  - 新增 `tileState.fruitRoundCount` 与 `tileState.pendingReBloom`，初始均为 `0 / false`
  - `extendRun()` 中踩到 `harvested` 不再单纯路过，会把 `pendingReBloom = true`，视觉本轮仍是 `harvested`
  - `advanceAppleTreeStatesForNextRound()` 阶段推进规则：
    - `harvested + pendingReBloom` → `blossom`（并清 `pendingReBloom / pendingFruit / fruitRoundCount`）
    - `fruit` 第 1 回合 → 继续 `fruit`，`fruitRoundCount` 加到 2
    - `fruit` 第 2 回合 → `harvested`
    - `blossom + pendingFruit` → `fruit`，`fruitRoundCount = 1`
- `createTileElement()` 新增 `data-growth-stage`（仅 revealed 时写入），便于人工检查三态切换且不泄露未解锁真实类型
- 按最新视觉要求，`.tile__image--apple-tree` 已累计统一上移 `22px`（本轮追加上移 `10px`），三态切图共用同一定位规则
- 按最新视觉要求，苹果树三态前景图尺寸最终调整为 `88%`，`.tile__image--apple-tree` 当前为 `width/height = 88%`
- 按最新视觉要求，苹果树三态切图在累计上移 `22px` 的基础上回调下移 `6px`，当前等效为整体上移 `16px`
- `index.html` 中 `app.js / style.css` 资源版本号已升级到 `apple-tree-20260614-1`，避免浏览器缓存旧脚本/样式
- 本轮新增 `beeStaminaConfig = { maxPerRun: 8, countStartTile: true }`，单点维护“一只蜜蜂单轮采集格数上限”与“起点是否算 1 格”
- `gameState` 新增 `beeStamina / beeStaminaExhausted`，按轮维护当前蜜蜂体力与耗尽态
- 新增 `setBeeStaminaDisplay(ratio, exhausted)` / `syncBeeStaminaFromState()`：把游戏态投射到 `#custom-cursor` 的 `--bee-stamina` 与 `.custom-cursor--exhausted` 类
- `beginRun()` 内重置体力：`beeStamina = maxPerRun`，若 `countStartTile` 则同步扣 1（表示按下起点也算 1 格）
- `extendRun()` 安全分支结尾扣 1 格体力；体力归 0 时立即调用 `completeRun("success")` 自动结算本轮，标志位 `beeStaminaExhausted = true`
- `completeRun()` 不重置体力环，保留耗尽态直到下一轮 `beginRun()` 触发回满；避免松手瞬间出现“环回满”的视觉跳变
- `restartGame()` 收尾增加一次 `syncBeeStaminaFromState()`，开局体力环显示与状态一致
- DOM 改造：`#custom-cursor` 内追加 `svg.custom-cursor__ring`，含底圆 `.custom-cursor__ring-track` 与进度圆 `.custom-cursor__ring-progress`；内层 `.custom-cursor__inner` 仍负责蜜蜂图与 pop / fade 动画，不受体力环影响
- 样式接入：`.custom-cursor__ring-progress` 使用 `stroke-dasharray = var(--bee-ring-circumference)` 与 `stroke-dashoffset = calc(circumference * (1 - var(--bee-stamina)))`，配合 220ms 缓动实现平滑减少
- 12 点起笔：`.custom-cursor__ring` 整体 `transform: rotate(-90deg)`；端点圆角 `stroke-linecap: round`
- 耗尽态：`.custom-cursor--exhausted` 切换青弧为深灰描边，并对整圈施加 1Hz `bee-ring-pulse` 缩放动画
- 缓存：`index.html` 中 `app.js / style.css` 引用版本号升级为 `bee-stamina-20260614-1`
- 本轮新增 `tileTypeRatioBaseCounts = { enemy: 3, flower: 10, empty: 6 }`，作为动态分配的比例基准
- 本轮新增 `calculateTileTypeCounts(totalTiles)`：按当前比例基准与实际格子总数动态换算 `enemy / flower / empty` 数量，并保证 `T18` 不会落入 enemy
- `tileTypeCounts` 不再写死 19 格固定数量，现改为基于 `tiles.length` 自动计算
- 本轮新增 `enemyOverlayAsset` 常量，指向 `./assets/tiles/Bird_01.png`，作为 enemy 格前景资源入口
- `getTileVisualMarkup(tileState, fallbackAsset)` 新增 `revealed && type === "enemy"` 分支：底图继续使用 `tile-enemy.png`，前景叠加 `Bird_01.png`
- 本轮新增样式 `.tile__image--enemy`，单独控制天敌前景图的尺寸与锚点，避免沿用整格拉伸导致形变
- 本轮新增 `flowerOverlayAsset` 常量，指向 `./assets/tiles/flower_01.png`，作为 flower 格前景资源入口
- 本轮新增 `getTileVisualMarkup(tileState, fallbackAsset)`：仅对 `revealed && type === "flower"` 输出双层结构，其它格保持原单图渲染
- `createTileElement()` 的静态态与翻牌背面态，现统一复用 `getTileVisualMarkup()`；普通花格与翻牌中的花格都会显示为 `tile-empty.png + flower_01.png`
- 本轮新增样式 `.tile__image-stack / .tile__image--layer / .tile__image--flower`，用于双层图片叠放；未改路径高亮、起点、失败等状态 class 逻辑
- 新建最小静态前端文件：`index.html`、`style.css`、`app.js`
- 页面包含 HUD 占位：总花蜜、本轮暂存花蜜、剩余蜜蜂数
- 当前盘面按 `2 / 2 / 3 / 3 / 3 / 3 / 2 / 1` 行结构由配置生成，格子总数由布局自动汇总，不再额外写死 `19`
- 建立基础布局配置：`layoutRows`、`rowTileIds`、`rowSlots`
- 建立基础数据映射：每格包含 `id / row / col / slotX / neighbors`
- 建立最小状态结构：`currentStartTileId`、`revealedTiles`、`tileStateMap`、`totalHoney`、`roundHoney`、`remainingBees`
- 初始状态：仅 `T18` 为已解锁起点，其他格保持未解锁深棕色
- 为后续玩法预留：`type`、`dangerCount`、`neighbors`、`tilesById`、`adjacencyMap`
- 调试挂载：`window.demoBoard`
- 本轮新增随机开局初始化：每次加载按当前比例基准 `3 / 10 / 6` 随实际格子总数动态换算 `enemy / flower / empty`
- 加入约束：`T18` 永远不会生成为 `enemy`
- 状态字段升级：统一为 `type / revealed / unlocked / dangerCount / neighbors`
- 已实现全盘 `dangerCount` 计算，含未解锁格周边天敌计数
- 已实现未解锁边界数字逻辑：仅当格子邻接至少一个已解锁格时，在未解锁格中心显示数字
- 未解锁敌格仍保持普通未解锁外观，不暴露身份；DOM 中 `data-type` 也仅写入 `hidden`
- 新增调试能力：`window.demoBoard.contentSummary`、`window.demoBoard.getVisibleDangerCount()`、`window.demoBoard.resetGame()`
- 本轮新增运行时状态：`isDragging`、`dragPointerId`、`currentPath`、`currentRunHoney`、`lastSafeTileId`、`lastOutcome`
- 接入 `pointerdown / pointermove / pointerup / pointercancel` 采集流程
- 仅允许从当前起点开始；每次开始新一轮时消耗 1 只蜜蜂
- 仅允许滑入相邻格；同一轮已走过的格不可再次进入；非法滑动会被忽略
- 路径效果：进入 `flower` 时本轮暂存花蜜 `+1`，进入 `empty` 仅推进路径，进入 `enemy` 立即失败
- 失败结算：本轮暂存花蜜清零、敌格翻开并永久可见、下一轮起点回退到本轮最后一个非敌格
- 成功结算：松手后把本轮暂存花蜜并入总花蜜，并将本轮最后一个非敌格设为下一轮起点
- 已增加状态文案区 `status-text`，用于提示当前轮结果与下一轮起点
- 已增加路径高亮与敌格翻开样式，便于人工拖拽验收
- 本轮新增失败反馈：棋盘红闪、路径/敌格抖动、底部 toast 显示“采集失败”
- 本轮新增成功反馈：总花蜜数字跳动、新起点脉冲高亮、toast 显示结算成功
- 当前起点高亮升级为稳定黄色发光边框；起点切换时旧起点自动移除，新起点接管
- HUD 调整为顶部居中纵向布局：总花蜜在上、本轮暂存在下；右下角固定显示剩余蜜蜂数
- 新增最小结束状态：蜜蜂耗尽后显示“游戏结束 / 总花蜜”，阻止继续开始新一轮
- 新增最小收尾 UI：游戏结束卡片与“重新开始”按钮
- 本轮新增顶部常驻“重新开始”按钮，可随时生成新一局
- 重开时会完整重置：总花蜜 / 本轮暂存 / 剩余蜜蜂 / 当前起点 / revealed 状态 / 路径状态
- 新增调试模式开关：打开后每个格子直接显示真实类型 `enemy / flower / empty`
- 新增调试面板：显示当前起点、剩余蜜蜂、总花蜜、本轮暂存、是否结束、当前路径、当前局 seed 与完整格子配置
- 新增可复现能力：支持 `seed` 生成局；可通过 `window.demoBoard.resetGame({ seed })` 或调试面板中的 seed / roundConfig 复现当前局
- 新增关键日志输出：初始化地图、新一轮开始、路径加入格子、踩到天敌、成功/失败结算、游戏结束、重新开始、调试开关切换
- 本轮新增地块资源映射表 `tileAssetMap`，按 `hidden / empty / enemy / flower` 映射到四张 PNG
- 地块渲染改为通过 CSS 变量 `--tile-image` 给 `.tile__inner` 挂背景图，不改已有状态与玩法逻辑
- 未解锁格改用 `tile-unknown.png`；已解锁安全/天敌/花格分别使用 `tile-empty.png / tile-enemy.png / tile-flower.png`
- 移除旧的草地/花朵/敌人格纯 CSS 占位层，避免与正式资源叠加冲突
- 为保证未解锁数字可读性，给中央危险数字补了半透明底色
- 本轮新增飞花资源：`assets/effects/flower-fly.svg`，作为独立小花素材，不复用地块大图
- 给 `本轮暂存` 卡片补充稳定锚点 `#round-honey-card`，并新增 `#fx-overlay` 作为全局飞花层，保证飞花不被地块遮挡
- 新增飞花反馈主流程：`spawnFlowerFlyEffect()` 负责按 0.08 秒错峰排队，`animateFlowerToHud()` 负责 0.5 秒二次 Bezier 弧线飞行与出生 pop
- 飞花命中 HUD 后触发 `playHudCollectFeedback()`：卡片轻微弹跳、中心吸附 burst、合成收集音效
- 本轮暂存数字改为队列式递增：`enqueueTempHoneyIncrement()` 按朵推进，使用滚动翻数字 DOM 结构连续衔接多个到达事件
- 为避免影响原有结算逻辑：运行态仍以 `currentRunHoney` 作为真实值；HUD 显示值独立滚动，成功结算后等待飞花与滚动收尾再回落到 0
- 失败结算时会立即清空未落地飞花、HUD 队列与显示值，避免失败轮残留反馈串到下一轮
- 收集音效未额外引入外部文件，改为 Web Audio 运行时合成单个短促 `pupu` 音，以满足当前 demo 资源缺口
- 按最新调参要求更新飞花手感：飞行总时长改为 `1000ms`，多朵错峰发射间隔改为 `140ms`
- 按最新调参要求增强视觉反馈：飞花尺寸从 `32px` 提升到 `50px`，`本轮暂存` HUD 弹跳峰值改为 `scale(1.5)`
- 新增翻格音效：在 `setTileRevealed()` 内首次解锁时播放 `assets/audio/sfx/tile-reveal.wav`；使用 `HTMLAudioElement` clone 播放支持快速连翻，失败静默；`beginRun()` 中通过 `primeCollectAudio()` 链路顺带预热 Audio 对象降低首响延迟
- 新增撞天敌音效：`extendRun()` 的 enemy 分支在 `setTileRevealed(tileId, { silent: true })` 之后立即调用 `playTileEnemyHitSound()`；采用方案 A 在 enemy 分支抑制 reveal 音效、单独播 enemy-hit 音，避免叠音；其它路径 reveal 行为不变
- 新增采集范围高亮：`.board` 增加状态 class `board--collecting`，仅在 `gameState.isDragging===true` 时挂上；在 `renderBoard()` 内紧挨 `board--fail-flash` 切换处由 `classList.toggle("board--collecting", gameState.isDragging)` 单点维护
- 配套 CSS：`.board .tile { transition: filter 0.28s ease, opacity 0.28s ease; }`；`.board--collecting .tile:not(.tile--path):not(.tile--start) { filter: brightness(0.55) saturate(0.75); }`；起点与路径自动豁免
- 与既有反馈隔离：`tile--shake` / `tile--start-pulse` 使用 transform，与 filter 不冲突；`.board--fail-flash` 走 box-shadow 关键帧，亦不动 filter；飞花 `#fx-overlay` 在 board 外不受影响
- 注意：现版 `renderBoard()` 每次都会 `innerHTML = ""` 全量重建 tile DOM，CSS transition 在新挂载节点上不会播过渡；上述 dim 规则当前会以"瞬切"形态生效。如需严格走 0.28s 过渡，需要后续改为 diff 渲染或在 dim 触发时延后挂 `board--collecting`，留给 B-FIX 视觉回归阶段评估
- 新增主背景 BGM：常量 `audioAssetMap.bgmMain` 指向 `assets/audio/bgm/bgm-main.mp3`；`bgmConfig.defaultVolume = 0.45`；`initBgm()` 在 `init()` 末尾启动
- BGM 启动策略：先尝试 `audio.play()`；自动播放被拦截时挂 `pointerdown / keydown / touchstart` 一次性首手势监听，由 `handleBgmFirstGesture()` 接管启动
- 静音按钮：常驻 `#bgm-toggle`（右上），用 `data-bgm="on|off"` 控制图标，状态写入 `localStorage["honey-demo:bgm-muted"]`，刷新后保留
- 新增长按自定义光标：常驻 DOM `#custom-cursor`，外层用 `transform: translate3d` 跟随鼠标位置，内层 `.custom-cursor__inner` 独立做 pop / fade 动画，避免与位置 transform 冲突
- 自定义光标只在 `pointerType==='mouse'` 且 `button===0` 时启用，桌面端长按生效，触控不介入
- 按下时给 `body` 加 `is-dragging-cursor` class 强制 `cursor: none !important`；松手时移除并播放淡出动画
- 跟随逻辑只在 `pointermove` 内更新 transform，并用 `requestAnimationFrame` 合并多次坐标更新，避免布局抖动
- 监听挂在 `window` 上，与现有 `board` 上的滑动采集事件解耦，不影响 `beginRun / extendRun / endRun` 流程
- 本轮 claim：`FX-02` 起点强化标识——曾为起点加入常驻金色外描边与常驻跟随物，并保留 `tile--start-pulse` 作为瞬时动画层
- FX-03 已删除起点描边与常驻蜜蜂浮层：固定“起点”文案、常驻金色高亮、常驻跟随物已从界面移除，只保留候选弱描边与按下瞬时脉冲
- 本轮 claim：`RULE-01` 自由起点——取消 success / failure 后的自动起点继承，新增 `lastEndedTileId` 作为空闲态视觉锚点；`currentStartTileId` 仅在首局引导或拖动中的当前轮起点时有意义
- 新增 `isValidStartCandidate(tileId)` 与 `getDisplayStartTileId()`：空闲态允许任意已翻开的安全格直接按下起手；起点描边与 FX-02 蜜蜂统一改由 `currentStartTileId ?? lastEndedTileId` 决定
- 空闲态新增合法起点候选描边：`.tile--start-candidate` 使用弱描边 + 呼吸动画提示；拖动中与游戏结束时自动移除，避免与 FX-01 dim 抢戏
- 新增 `playStartSelectSound()` 预留空函数，并在合法起点按下时调用一次；资源路径建议后续接入 `assets/audio/sfx/select-start.wav`
- 文案调整：初始提示改为“按住已翻开的安全格作为起点，滑动采集。”；成功/失败结算均改为“请选择本轮起点。”
- 本轮 claim：`RULE-02` 蜜蜂消耗保护——删除 `beginRun()` 预扣蜜蜂，改为在 `completeRun()` 顶部按 `path.length >= 2` 才扣 1 只蜜蜂；仅“按下起点立即松手”属于未消耗
- 新增 `gameState.lastConsumedBee`：记录上一轮是否真实扣费，并在 `getStateSnapshot()` 中导出，供 toast / 日志 / 调试使用
- 成功/失败文案与 toast 口径同步重写：成功未消耗显示“本轮未采集，蜜蜂未消耗。”并走 `info` tone；成功已消耗显示“本轮成功，获得 N 花蜜。”；失败已消耗显示“踩到天敌，本轮失败。”；理论兜底未消耗失败显示“本轮失败，蜜蜂未消耗。”
- 日志补充：成功/失败结算日志均追加 `consumedBee / pathLength`；未消耗轮次单独记录 `logEvent("本轮蜜蜂未消耗")`
- 本轮 claim：`RULE-03 / FX-03` 固定起点 UI 移除——初始文案改为“选择任意已翻开的格子（天敌除外）作为起点，按住滑动。”；保留 RULE-01 候选呼吸和合法按下瞬时脉冲
- 新增非法点击反馈：空闲态按下未翻开格 / 已翻开的天敌格 / 蜜蜂为 0 时，会触发 `tile--invalid-flash` 红闪、toast 提示与 `playInvalidStartSound()` 预留音效，不扣蜜蜂、不进入 `beginRun()`
- 补充微调：移除 `.tile--start-candidate` 的金色描边，仅保留轻微呼吸动画，避免棋盘上残留固定色框
- 本轮 claim：`B-COD-DEMO-FEEDBACK-003` 连击反馈——新增常驻全局 `#combo-ui` 浮层，位置锚定最新采集到花朵的格子上方；后续继续采花时用减速曲线平滑跟随
- 新增 `comboState` / `comboConfig`：维护 `count / lastTriggerAt / timeoutHandle / hideTimer / isVisible / lastTileId`，2.5 秒未继续采集新花自动结束并上浮渐隐
- 触发链路修正：Combo 现改为在 `extendRun()` 的 `flower` 分支内每采到一朵花就执行 `incrementCombo(tileId)`；`empty`、`enemy`、是否首次 reveal 均不再触发 Combo
- 新增 Combo 视觉层级：普通档（1~4）与强化档（≥5）分开样式；数字使用回弹 `combo-number-pop`，强化档更亮、更大、更弹
- 新增 Combo 升级音效：资源入口预留为 `comboSoundAsset=./assets/audio/sfx/sfx-combo.mp3`；当前实现优先尝试文件播放，失败时降级到 Web Audio 合成短音，避免资源未落地时功能失效
- 收尾规则：`restartGame()` 立即清空 Combo；其余情况按“2.5 秒未再采花”自然结束；窗口缩放时若 Combo 仍存活，会重新对齐到当前最新采花格
- 本轮 claim：`COMBO-02` 去除底框 + 修正出场位置——浮层结构改为 `#combo-overlay > .combo-popup`，子节点 `.combo-popup__label`（文本 `Combo x `）+ `.combo-popup__count`（数字），整体渲染为单行 `Combo x1`
- 去掉底框：删除 `.combo-ui*` 旧规则，新 `.combo-popup` 仅保留 `position: absolute / display: inline-block / white-space: nowrap / transform: translate(-50%, -100%) / pointer-events: none / will-change`，无 background / border / box-shadow / border-radius / padding
- 跟随过渡改为作用在 `left / top`（320ms `cubic-bezier(0.22, 1, 0.36, 1)`），缩放动画作用在子 `span`，避免与定位 `translate(-50%, -100%)` 互相打架
- 出场修正：首次 bump（0→1）走"临时关 transition → 写入 left/top → 强制 reflow → 恢复 transition → unhide → 重触发 `--enter` + `--pop`"，彻底解决"从左上角飞过来"
- 第二次起 bump 仅更新 `left/top` 并重触发 `--pop`，由 CSS transition 平滑跟随；exit 状态被新 bump 打断时会先清掉 `--exit`
- 退场：600ms `transform: translate(-50%, -180%) + opacity 0`，到时清掉 tier / `--enter` / `--pop` / `--exit`、`hidden = true`、清空 inline `left / top` 和 `transition`，下一次再首次出现重新走预设流程
- tier 分级：`combo-popup--tier-1`（1~5）、`--tier-2`（6~10）、`--tier-3`（11+），仅控制 `color / font-size / text-shadow`，不再有 background / border / padding；旧 `combo-ui--boost` 已废弃
- 入场动画 `combo-enter` 240ms 作用在子 `span` 的 `opacity + scale`；持续 pop 动画 `combo-pop` 280ms 作用在 `.combo-popup__count` 的 `scale`
- 坐标计算抽出 `computeComboAnchor(tileId)`：相对 `#combo-overlay.getBoundingClientRect()` 算出 `left = rect.left - overlay.left + rect.width/2`、`top = rect.top - overlay.top + offsetY`，`comboConfig.offsetY` 默认 `-8`
- `comboConfig.fadeOutMs` 由 520 改为 600，对齐 `--exit` transition 时长
- 删除 `.combo-popup__times` 节点（COMBO-01 残留命名）与对应 CSS；index.html 不再有 `combo-ui*` 相关 id / class

## 接口登记
- 无外部接口
- 运行方式：直接打开 `index.html`
- 苹果果树状态字段：`tileState.growthStage`（`blossom | fruit | harvested | null`）
- 苹果果树状态推进入口：`advanceAppleTreeStatesForNextRound()`（位于 `app.js`，在 `beginRun()` 开始时统一调用）
- 苹果果树资源入口：`appleTreeStateAssetMap`（位于 `app.js`）
- 苹果果树前景样式入口：`.tile__image--apple-tree`（位于 `style.css`）
- 调试观察：revealed 苹果果树 DOM 会写入 `data-growth-stage`，可直接检查当前三态
- 结算序列配置入口：`settlementSequenceConfig`（位于 `app.js`，含 `staggerMs / intraTileGapMs / bounceDurationMs / bounceHeightPx / waitFlightsTailMs`）
- 结算序列运行态：`gameState.pendingScoreList` / `gameState.isSettling` / `gameState.scoreBounceTileIds`
- 结算序列函数：`playRunSettlementSequence(list, onComplete)` / `triggerScoreBounce(tileId)` / `commitPendingSideEffects(list)` / `finalizeSuccessRun(context)` / `waitForAllFlightsToLand(cb)` / `computePendingHoneyTotal()`（均位于 `app.js`）
- 得分格小跳样式入口：`.tile--score-bounce`、keyframes `tile-score-bounce`（位于 `style.css`）
- 调试观察：`window.demoBoard.gameState.pendingScoreList` 拖动期可见所有"将得"条目；`isSettling` 真值代表序列播放中
- 后续可直接复用的数据入口：`window.demoBoard.tiles`、`window.demoBoard.adjacencyMap`、`window.demoBoard.gameState`
- 内容调试入口：`window.demoBoard.contentSummary`、`window.demoBoard.tileStateMap`
- 交互调试入口：`window.demoBoard.beginRun(tileId)`、`window.demoBoard.extendRun(tileId)`、`window.demoBoard.endRun()`、`window.demoBoard.resetGame({ typeMap })`
- 飞花调试入口：`window.demoBoard.spawnFlowerFlyEffect(tileId)`
- 飞花状态观测：`window.demoBoard.feedbackState`
- Combo 状态观测：`window.demoBoard.comboState`
- 反馈相关状态：`window.demoBoard.gameState.isFailFlash`、`toastMessage`、`startPulseTileId`、`invalidFlashTileIds`、`isGameOver`
- 起点状态字段：`gameState.currentStartTileId`（拖动中真起点 / 首局 T18 引导）、`gameState.lastEndedTileId`（空闲态视觉锚点）
- 蜜蜂扣费状态字段：`gameState.lastConsumedBee`（上一轮是否真实消耗蜜蜂）
- 局配置与状态导出：`window.demoBoard.getRoundConfigSnapshot()`、`window.demoBoard.getStateSnapshot()`
- 可复现方式：`window.demoBoard.resetGame({ seed: 123456 })`
- 地块资源入口：`tileAssetMap`（位于 `app.js`）
- 飞花资源入口：`flowerFlyAsset`（位于 `app.js`，默认指向 `assets/effects/flower-fly.svg`）
- 翻格音效资源入口：`tileRevealSoundAsset`（位于 `app.js`，默认指向 `assets/audio/sfx/tile-reveal.wav`）
- 翻格音效函数：`playTileRevealSound()` / `primeTileRevealSound()`（位于 `app.js`），每次 `cloneNode` 播放支持快速连翻
- SFX-03 扩展：翻格音效触发位置已从 `setTileRevealed()` 内部上移到 `extendRun()` 安全分支结尾；走入已 reveal 的 `flower / empty` 也会播一次同音；`setTileRevealed()` 恢复为纯状态写入函数，不再附带音效；enemy 分支沿用 SFX-02 方案 A，仅播 enemy-hit 音，不叠加 reveal 音
- Combo 浮层 DOM：`#combo-overlay > #combo-popup(.combo-popup) > .combo-popup__label + #combo-popup-count(.combo-popup__count)`（位于 `index.html`）
- Combo 资源入口：`comboSoundAsset`（位于 `app.js`，默认指向 `./assets/audio/sfx/sfx-combo.mp3`）
- Combo 核心函数：`incrementCombo(tileId)` / `computeComboAnchor(tileId)` / `updateComboPopupPosition(tileId)` / `applyComboPopupTier()` / `resetComboPopupDom()` / `resetComboTimer()` / `endCombo()` / `playComboSound()` / `primeComboSound()`（位于 `app.js`）
- Combo 触发口：`extendRun()` 的 `flower` 分支每次采到花都会累加 Combo；不再绑定“首次翻格”
- 撞天敌音效资源入口：`tileEnemyHitSoundAsset`（位于 `app.js`，默认指向 `assets/audio/sfx/tile-enemy-hit.wav`）
- 撞天敌音效函数：`playTileEnemyHitSound()` / `primeTileEnemyHitSound()`（位于 `app.js`），在 `extendRun()` 的 enemy 分支内 `setTileRevealed(tileId, { silent: true })` 之后立即调用，确保一次失败仅一声
- `setTileRevealed(tileId)` 现已恢复为纯状态写入（SFX-03 调整后），音效改由 `extendRun()` 的安全分支结尾统一触发；enemy 分支不再依赖 `silent` 参数，仅靠不调用 `playTileRevealSound()` 来避免叠音
- 自定义光标 DOM 锚点：`#custom-cursor`（位于 `index.html`，内嵌 `.custom-cursor__inner > img`）
- 自定义光标资源入口：`customCursorAsset`（位于 `app.js`，默认指向 `assets/ui/cursor/cursor-default.png`），由 `attachCustomCursorListeners()` 在初始化时单点写入 `#custom-cursor-image.src`，HTML 不再写死路径
- BGM 资源入口：`audioAssetMap.bgmMain`（位于 `app.js`，默认指向 `assets/audio/bgm/bgm-main.mp3`），HTML 不写死路径
- BGM 控制函数：`initBgm()` / `tryStartBgm()` / `setBgmMuted(muted)` / `handleBgmFirstGesture()`；运行态：`bgmState.audio / muted / hasStarted / pendingStart`
- BGM 静音偏好：`localStorage["honey-demo:bgm-muted"]`（`"1"` 静音，`"0"` 非静音）；常量 `bgmConfig.storageKey` 单点维护
- 自定义光标控制函数：`showCustomCursor(event)` / `hideCustomCursor()` / `attachCustomCursorListeners()`（位于 `app.js`）
- 自定义光标运行态：`customCursorState`（位于 `app.js`，含 `isActive / pointerId / pendingX / pendingY / rafId / hideTimer`）

### 资源入口
- 起点候选校验函数：`isValidStartCandidate(tileId)`（位于 `app.js`，并暴露到 `window.demoBoard`）
- 起点显示决策函数：`getDisplayStartTileId()`（位于 `app.js`，并暴露到 `window.demoBoard`）
- 起点选择音效预留函数：`playStartSelectSound()`（位于 `app.js`，当前为空实现）
- 非法起点音效预留函数：`playInvalidStartSound()`（位于 `app.js`，当前为空实现）
- 蜜蜂扣费时机：`completeRun()` 顶部按 `path.length >= 2` 判定并扣费；`beginRun()` 不再预扣
- 中性 toast 样式：`.toast--info`（位于 `style.css`）
- 非法点击样式：`.tile--invalid-flash`（位于 `style.css`）
- Combo 配置入口：`comboConfig`（位于 `app.js`，当前含 `timeoutMs / fadeOutMs / followDurationMs / followEasing / offsetY / soundThrottleMs`）
- Combo 样式入口：`.combo-overlay`、`.combo-popup`、`.combo-popup__label`、`.combo-popup__count`、`.combo-popup--enter`、`.combo-popup--pop`、`.combo-popup--exit`、`.combo-popup--tier-1/2/3`、keyframes `combo-enter` / `combo-pop`（位于 `style.css`）
- 蜜蜂体力上限配置入口：`beeStaminaConfig`（位于 `app.js`，含 `maxPerRun / countStartTile`）
- 蜜蜂体力运行态：`gameState.beeStamina` / `gameState.beeStaminaExhausted`
- 蜜蜂体力显示更新函数：`setBeeStaminaDisplay(ratio, exhausted)` / `syncBeeStaminaFromState()`（位于 `app.js`）
- 蜜蜂体力环 DOM：`#custom-cursor > svg.custom-cursor__ring > .custom-cursor__ring-track + .custom-cursor__ring-progress`（位于 `index.html`）
- 蜜蜂体力环样式入口：`.custom-cursor__ring` / `.custom-cursor__ring-track` / `.custom-cursor__ring-progress` / `.custom-cursor--exhausted`、keyframes `bee-ring-pulse`、CSS 变量 `--bee-stamina / --bee-ring-circumference`（位于 `style.css`）

## 验证记录
- 已做:
  0. 结算序列接入后执行 `node --check app.js`，语法通过
  0. 无 DOM headless 模拟：拖动经过 T17(flower) → T19(apple_tree blossom)
     - 拖动期 `pendingScoreList` 正确累加，`currentRunHoney` 全程 0，`tileState.pendingFruit` 全程 false
     - `endRun` 即时 `isSettling=true / totalHoney=0`，约 1500ms 后 `isSettling=false / totalHoney=4`，T19 `pendingFruit=true`、`growthStage` 仍 `blossom`
  0. 无 DOM headless 模拟：单独路过 harvested 苹果
     - 松手不进序列、`isSettling` 即时归 `false`
     - 副作用静默提交：`pendingReBloom=true`
     - `totalHoney` 不变
  0. 无 DOM headless 模拟：序列守门
     - 松手即时 `isSettling=true`
     - 序列中 `beginRun(...)` 返回 `{ok:false, reason:"settling"}`
     - 约 3000ms 后 `isSettling` 归 `false`
  0. 苹果果树接入后执行 `node --check app.js`，语法通过
  0. 代码级确认：默认随机分布现包含 1 个 `apple_tree`，满足“可生成并显示 apple_tree 地块”
  0. 代码级确认：`apple_tree` 初始化 `growthStage="blossom"`，revealed 后显示 `tile-empty + apple_tree_blossom_01`
  0. 代码级确认：`extendRun()` 中仅 `blossom` 分支会 `+3` 花蜜并切到 `fruit`；`fruit / harvested` 分支不会重复加蜜
  0. 代码级确认：`beginRun()` 开头统一调用 `advanceAppleTreeStatesForNextRound()`，保证 `fruit -> harvested` 只发生在下一回合开始时
  0. 接入体力环 + 单轮采集格数上限后再次执行 `node --check app.js`，语法通过
  0. 代码级确认：`beginRun()` 重置 `beeStamina = 8`，若 `countStartTile=true` 同步扣 1
  0. 代码级确认：`extendRun()` 的安全分支每次推进路径都会扣 1 格体力，且体力归 0 时立即触发 `completeRun("success")`
  0. 代码级确认：天敌分支不动体力，仍走原 enemy 失败结算链路
  0. 代码级确认：`completeRun()` 不再写体力，保留耗尽态直到下一轮 `beginRun()` 重置，避免视觉跳变
  0. 改为动态数量分配后再次执行 `node --check app.js`，语法通过
  0. 代码级确认：`tileTypeCounts` 现基于 `tiles.length` 自动计算，不再要求布局总格子固定等于 `19`
  0. 针对 enemy 双层显示改动执行 `node --check app.js`，语法通过
  0. 代码级确认：enemy 格在普通 revealed 与 `tile--flipping` 背面态都会走双层渲染分支
  0. 静态复核确认：`Bird_01.png` 不再沿用整格 `object-fit: fill`，前景鸟图按比例显示
  0. 针对 flower 显示层改动执行 `node --check app.js`，语法通过
  0. 代码级确认：非 flower 类型仍走原单图 `<img class="tile__image">` 渲染分支
  0. 代码级确认：flower 格在普通 revealed 与 `tile--flipping` 背面态均走双层渲染分支
  1. `node --check app.js` 通过语法检查
  2. Node 循环 200 次验证：每局始终满足当前布局下动态计算出的 `enemy / flower / empty` 数量约束
  3. Node 循环验证：`T18` 从不生成 `enemy`
  4. Node 循环验证：开局始终只有 `T18` 为已解锁
  5. Node 循环验证：仅 `T18` 邻接的未解锁格显示数字，且数字与周边天敌数一致
  6. 使用自定义 `typeMap` 做交互逻辑验证：
      - 开始新一轮会扣除 1 只蜜蜂
      - 进入花格会累加本轮暂存花蜜
      - 非相邻格与同轮重复格不会加入路径
      - 成功松手后总花蜜正确增加，下一轮起点正确继承
      - 进入敌格会立刻失败、清空本轮暂存花蜜、翻开敌格并把起点回退到上一安全格
  7. 使用自定义 `typeMap` 验证反馈与收尾状态：
      - 成功结算后 `totalHoneyPulse` 生效，新起点 `startPulseTileId` 正确
      - 失败后 `isFailFlash`、`shakeTileIds`、`toastMessage=采集失败` 正确生效
      - 蜜蜂耗尽后 `isGameOver=true`，且后续 `beginRun()` 被正确阻止
  8. 验证 seed 可复现：同一 seed 重建两次，格子分布完全一致
  9. 验证重开重置：重开后总花蜜 / 本轮暂存 / 蜜蜂数 / 起点 / revealed 状态全部恢复开局值
  10. 验证状态导出：`getRoundConfigSnapshot()` 与 `getStateSnapshot()` 返回当前局关键信息
  11. 资源接入后已再次执行 `node --check app.js`，确保资源映射改动未破坏脚本语法
  12. 接入飞花反馈后再次执行 `node --check app.js`，语法通过
  13. 无 DOM headless 校验：自定义 `typeMap` 下进入 `flower` 时，`currentRunHoney` 与 `roundHoney` 会正确累加，保证原有逻辑测试不被动画改造破坏
  14. 无 DOM headless 校验：进入 `empty`、成功结算、重新开局流程仍可正常执行，未出现反馈状态串轮
  15. 最新调参后再次执行 `node --check app.js`，语法通过
  16. 飞花总时长改为 `1000ms` 后再次执行 `node --check app.js`，语法通过
  17. 接入翻格音效后再次执行 `node --check app.js`，语法通过；初始 `T18` 已 revealed，初始化不会重复触发；同格不会重复触发；重开后再次解锁可再触发
  18. 接入自定义光标后再次执行 `node --check app.js`，语法通过；事件挂在 `window` 上，与 `board` 上的采集事件互不干扰
  19. 接入撞天敌音效后再次执行 `node --check app.js`，语法通过；enemy 分支用 `setTileRevealed(tileId, { silent: true })` 静音 reveal、再单独播放 enemy-hit，避免叠音；安全/花格 reveal 音效不被抑制
  20. 切换自定义光标资源到 `assets/ui/cursor/cursor-default.png` 后再次执行 `node --check app.js`，语法通过；路径仅在 `customCursorAsset` 常量出现一次，HTML 中 `src` 由 JS 初始化时写入
   21. 接入采集范围高亮后再次执行 `node --check app.js`，语法通过；`board--collecting` 仅在 `renderBoard()` 内 `gameState.isDragging` 真值时挂上；未新增逐格 JS 样式写入；未改动 `createTileElement` 的 class 列表
   22. 接入主背景 BGM 后再次执行 `node --check app.js`，语法通过；路径仅在 `audioAssetMap.bgmMain` 一处出现；自动播放被拦截时降级到首手势启动，不阻塞其它流程
   23. SFX-03 上移翻格音效触发点后再次执行 `node --check app.js`，语法通过；安全分支无论是否首次 reveal 都播一次；enemy 分支不叠音；一次 `extendRun(tileId)` 仅触发一次音效
   24. 接入 FX-02 起点描边与常驻蜜蜂浮层后再次执行 `node --check app.js`，语法通过；`updateStartBeePosition()` 未挂进 `renderAll()`，仅在起点变化与缩放链路后调用
   25. 接入 RULE-01 自由起点后再次执行 `node --check app.js`，语法通过；`currentStartTileId / lastEndedTileId` 已拆分，成功/失败分支不再自动继承起点，FX-02 蜜蜂定位同步改走 `getDisplayStartTileId()`
   26. 接入 RULE-02 蜜蜂消耗保护后再次执行 `node --check app.js`，语法通过；`beginRun()` 不再预扣蜜蜂，`completeRun()` 按 `path.length >= 2` 决定是否扣费，并导出 `lastConsumedBee`
   27. 接入 RULE-03 / FX-03 后再次执行 `node --check app.js`，语法通过；固定起点文案/描边/常驻跟随物已移除，新增非法点击红闪与预留音效接口
   28. 接入 `B-COD-DEMO-FEEDBACK-003` Combo System 后再次执行 `node --check app.js`，语法通过；Combo 现按“每采到一朵花 +1”触发，`empty` / `enemy` 不会误加；重开会立即清空，其余由 2.5 秒超时自然结束
- 未做：浏览器人工打开验收
- 未验证原因：当前会话未启动浏览器；尚未人工确认结算序列在真实 DOM 下的飞花轨迹、得分格 -8px 小跳是否流畅、本轮暂存 HUD 滚动节奏是否对齐、序列期间手势屏蔽是否完全无反馈，以及 Combo 与新序列叠加观感
- 建议验证步骤（结算序列专项）：
   - 序列专项 1：直接打开 `index.html`，强刷确认已加载 `settle-sequence-20260616-1` 版本资源
   - 序列专项 2：从 T18 拖动经过 2 朵花 + 1 棵苹果 blossom，松手 → 本轮暂存 HUD 全程显示 0；松手后按"花、花、苹果"顺序逐格 -8px 小跳；苹果格连发 3 朵飞花，错峰约 80ms；HUD 一颗颗 +1 滚到 5
   - 序列专项 3：拖动经过 1 棵 harvested 苹果（无花蜜得分）→ 松手不播跳/飞花；下一回合开始时该苹果变 blossom
   - 序列专项 4：拖动经过 1 棵 blossom 苹果后撞天敌失败 → 总花蜜不变；下一回合该苹果仍是 blossom（pendingFruit 没被错误提交）
   - 序列专项 5：序列播放期间疯狂点击棋盘 → 完全无反馈、无 toast
   - 序列专项 6：序列结束后总花蜜恰好达标 → 应在序列尾再弹通关面板
   - 序列专项 7：体力归 0 触发自动结算 → 序列正常播完后再判定 game-over
- 建议验证步骤（苹果三态历史专项）：
   - 苹果专项 1：直接打开 `index.html`，强刷确认已加载 `apple-tree-20260614-1` 版本资源
   - 苹果专项 2：通过正常开局或 `window.demoBoard.resetGame({ typeMap })` 确认盘面可出现 `apple_tree`
   - 苹果专项 3：进入 `apple_tree blossom` 时确认本轮暂存立即 `+3`，且前景图立刻切成 `apple_tree_fruit_01.png`
   - 苹果专项 4：结束本轮后，再次按下开始下一轮，确认所有 `fruit` 苹果果树会在这一刻切成 `apple_tree_harvested_01.png`
   - 苹果专项 5：再次经过 `fruit / harvested` 苹果果树，确认不会重复增加 3 花蜜
   - 苹果专项 6：观察三态图在普通 revealed、翻牌、路径高亮、失败闪烁下是否都居中且未被遮挡
   1. 直接打开 `index.html`
   2. 连续滑过 3~5 个花朵格，确认飞花按约 0.08 秒错峰发射，形成连续 `Pupupu` 节奏
  3. 观察飞花是否从格子中心偏上位置出生、先轻微 pop，再沿弧线吸附到 `本轮暂存` 整体卡片
  4. 确认每朵到达时 `本轮暂存` 卡片都会弹一下、出现中心吸附 burst，并播放一次短促收集音
  5. 确认 `本轮暂存` 数字按到达节奏连续滚动递增，多朵衔接时不抖碎、不回退
  6. 成功松手后确认总花蜜结算、起点继承、飞花/数字收尾没有破坏原有主流程
  7. 失败踩敌后确认未到达飞花不会残留到下一轮
  8. 长按任意位置后系统指针应立即消失，自定义光标出现并做缩放弹出
   9. 长按移动鼠标，确认自定义光标稳定跟随、中心点对齐判定点
   10. 松手后自定义光标应淡出而非瞬间消失，系统指针恢复
   11. 快速 down/up/down 切换时光标状态切换不卡，不残留
   12. 确认棋盘上不再出现固定“起点”字样、固定金色描边与常驻跟随物
   13. 空闲态合法候选仍保留弱描边呼吸；按下合法候选时应出现短脉冲 + 轻微弹跳
   14. 点击“重新开始”后确认仍按首局规则只能从 `T18` 起手，但界面不显示固定起点标识
   15. 第一轮仅允许从 `T18` 起手；首轮结束后确认空闲态任意已翻开的安全格都可直接按下开始新一轮
   16. 点击未翻开格 / enemy 格 / 蜜蜂耗尽后的任意格时，确认会弹正确 toast、不会扣蜜蜂、不会错误进入拖动态
   17. 空闲态观察 `tile--start-candidate` 呼吸描边；开始拖动后应立即消失，游戏结束后也不再显示
   18. 按下起点立即松手，确认 `remainingBees` 不变，toast/status 显示“本轮未采集，蜜蜂未消耗。”
   19. 拖入至少 1 个相邻格再松手，确认无论采到花或踩到 enemy，`remainingBees` 只减少 1 次
   20. 将 `remainingBees` 打到 0 时确认仅在真实扣费后的结算点弹出 game-over；连续空按起点不会把蜜蜂扣空
   21. 点击未翻开格或已翻开的天敌格时，确认地块出现红色闪烁 + fail toast，且不进入 `beginRun()`
   22. 连续采集 6~8 朵花，确认 `#combo-ui` 会持续跟随最新采花格移动，且 `Combo ≥ 5` 时明显更亮、更大、更弹
   23. 采到花后等待约 3 秒，确认 Combo 上浮渐隐消失，不会卡在旧位置
   24. 反复进入/结束 Combo，并切换标签页再回来，确认状态不残留、位置不乱跳

## 协作需求
- 本模块 `B-COD-APPLE-TREE-01` 默认可交给 `B-FIX` 做苹果果树专项回归：重点确认三态资源居中、`blossom -> fruit -> harvested` 切换时机、以及 `fruit / harvested` 无重复收益
- 本模块 M1 已可交给 `B-FIX` 做视觉回归，重点检查：花层居中、透明边、翻牌前后、路径高亮 / 起点 / 失败状态是否遮挡前景花层
- 默认可交给 `B-FIX` 做浏览器实机回归：Combo 浮层跟随最新采花格、强化档视觉、2.5 秒结束渐隐、音效节流，以及与飞花 / 自定义光标 / BGM 的并存观感
- 本模块完成后建议回流 `@A-PLN` 做阶段收口；若先做人眼验收，也可先交 `A-ASK` / 用户按上方步骤检查，再决定是否补第二轮爽感优化

---

## 任务卡：一笔画路径轨迹（B-COD-PATH-TRAIL-01）

- 任务 ID：`B-COD-PATH-TRAIL-01`
- 目标：在棋盘上叠加 SVG 白色一笔画轨迹，让玩家清楚看到本轮路径

### 已实施改动
- `app.js`
  - `gameState` 新增 `trailPath / trailFading / trailFail` 三个视觉态字段
  - `beginRun` 写入 `trailPath = [tileId]`，并清掉 fading/fail
  - `extendRun` 每次 push 后同步 `trailPath = [...currentPath]`
  - 新增 `scheduleTrailFadeOut(delayMs)`：先打 `--fading` 等过渡 260ms 再清空轨迹
  - `completeRun` 失败分支：保留 `trailPath = [...path]`，立刻打 `--fail` + `--fading`，跟随 failFlash 一起淡出
  - `completeRun` 三个成功分支（纯路过 / 仅 harvested / 进入飞币序列）：都在合适时机调用 `scheduleTrailFadeOut(0)`；飞币序列分支在 `playRunSettlementSequence` 的 `onComplete` 里调用，确保飞币全部归集后才开始淡出
  - 新增 `renderBoardTrail()`，在 `renderBoard()` 末尾调用；用 `boardMetrics + tilesById` 计算节点中心，复用同一个 `<svg class="board__trail">` 节点，DOM 顺序保证 tile 始终覆盖在轨迹之上
- `style.css`
  - 新增 `.board__trail`、`.board__trail-glow`、`.board__trail-stroke`、`.board__trail-flow`、`.board__trail-head`
  - `--fading` 控制 opacity 过渡；`--fail` 把所有笔触换成红色系
  - `--single`（路径只有 1 格）时隐藏线条只保留笔尖呼吸圆
  - 新增 `@keyframes board-trail-flow`（流光虚线）与 `@keyframes board-trail-head-pulse`（笔尖呼吸）
- `animationDurations` 新增 `trailFade: 260`

### 自检
- `node --check app.js` 已通过
- 待 `@B-FIX` 实机回归：路径连续性、笔尖位置、撞天敌染红、飞币归集后淡出时机、SVG 不遮挡花/树/敌人/危险数字

---

## 任务卡：小白花两阶段（B-COD-FLOWER-STAGES-01）

- 任务 ID：`B-COD-FLOWER-STAGES-01`
- 目标：实现 flower 地块 bloom / sprout 两阶段流转

### 已实施改动
- `app.js`
  - 删除常量 `flowerOverlayAsset`，改为 `flowerStageAssetMap = { bloom, sprout }`
  - `getInitialGrowthStage("flower")` 返回 `"bloom"`，让新解锁 flower 自带阶段
  - 新增 `getFlowerStage(tileState)`，做 fallback 到 `bloom`
  - `getSafeTileOverlayMarkup` 中 flower 分支按 stage 取图，并附加 `tile__image--flower-bloom / -sprout` 钩子类
  - `extendRun` flower 分支按 stage 分流：
    - `bloom`：`amount=1`，`sideEffect="advance-flower-to-sprout"`，照旧 `incrementCombo`
    - `sprout`：`amount=0`，`sideEffect="advance-flower-to-bloom"`，不触发 Combo
  - `commitPendingSideEffects` 新增两条分支：`advance-flower-to-sprout` / `advance-flower-to-bloom`
  - 阶段推进时机沿用现有链路：飞币序列收尾 → `finalizeSuccessRun` → `commitPendingSideEffects`；harvested-only 分支也已调用 `commitPendingSideEffects`，sprout 0 花蜜路径会落到这里
  - `playRunSettlementSequence` 中 `amount === 0` 条目自动跳过小跳与飞花，sprout 行为不需要额外改

### 自检
- `node --check app.js` 已通过
- 待 `@B-FIX` 实机回归：bloom→sprout 切换时机、sprout 再被采集回 bloom、撞天敌阶段保持、同 drag 重复经过去重

---

## 任务卡：结算节奏与阶段切换同步（B-COD-SETTLE-STAGE-SYNC-01）

- 任务 ID：`B-COD-SETTLE-STAGE-SYNC-01`
- 目标：把阶段切换从"结算尾段一把 commit"改为"跟随每格小跳同步 commit"

### 已实施改动
- `app.js`
  - 抽出 `commitOneSideEffect(entry, { render })`，原 `commitPendingSideEffects` 改为对每条 entry 调用前者
  - `playRunSettlementSequence.tick()`：
    - 跳过 amount=0 条目时，对每条调用 `commitOneSideEffect(..., { render: true })`，按序列顺序即时推进
    - 对 amount>0 的当前条目：`triggerScoreBounce` 同时 `scheduleCollectionTask(commitOneSideEffect, bounceDurationMs/2)`，在小跳顶点切换阶段图
  - `finalizeSuccessRun`：去掉 `commitPendingSideEffects(pendingList)`，避免重复 commit
  - harvested-only 早返回分支（`completeRun` 内 `totalAmount === 0 && hasAnyEntries`）保持原 `commitPendingSideEffects` 不变

### 自检
- `node --check app.js` 已通过
- 待 `@B-FIX` 实机回归：
  - 苹果 blossom（amount=3）跳到顶点 fruit 图替换瞬间，剩余飞花仍从该格飞出
  - bloom→sprout 时机与小跳顶点是否对齐
  - sprout 夹在中间时序无空帧
  - 撞天敌阶段保持

---

## 任务卡：sprout / harvested 静默小跳（B-COD-SPROUT-BOUNCE-01）

- 任务 ID：`B-COD-SPROUT-BOUNCE-01`
- 目标：amount=0 且引发阶段切换的条目也走小跳 + 顶点切图

### 已实施改动
- `app.js` extendRun：sprout、苹果 fruit、苹果 harvested 三种 amount=0 条目入栈时新增 `silentBounce: true`
- `app.js` playRunSettlementSequence.tick()：
  - 即时 commit 通道改为只接受 `amount === 0 && !silentBounce` 条目
  - 主循环对当前条目无条件 `triggerScoreBounce` + 顶点 commit；amount>0 才出 `+N` 浮字与飞花
- `app.js` completeRun：harvested-only 早返回分支增加 `hasSilentBounce` 判定，存在 silentBounce 时改走 `playRunSettlementSequence`，保留小跳节奏

### 自检
- `node --check app.js` 通过
- 待 `@B-FIX` 实机回归：sprout 单跳无飞花、harvested 单跳无飞花、bloom/sprout/苹果混跳节奏均匀

---

## 任务卡：新增郁金香地块（B-COD-TULIP-01）

- 任务 ID：`B-COD-TULIP-01`
- 目标：让 `tulip` 类型作为新地块完整融入现有玩法

### 已实施改动
- `app.js`
  - `tileTypeRatioBaseCounts`：新增 `tulip:2`、`empty:6→4`
  - `tileTypeOrder`：扩展为 `[enemy, flower, apple_tree, tulip, empty]`
  - `createTileTypeSummary` 包含 `tulip:0`
  - `tileAssetMap.tulip = tile-empty.png`；新增 `tulipOverlayAsset = "./assets/tiles/tulip_01.png"`
  - `assignRandomTileTypes`：在 apple_tree 后、flower 前抽取 `tulip` 候选池
  - `validateTypeMap`：加入 `summary.tulip` 校验
  - `isSafeTileType` 包含 `tulip`
  - `getTileTypeLabel("tulip") = "郁金香"`
  - `getSafeTileOverlayMarkup` 新增 tulip 分支
  - `extendRun` 新增 tulip 分支：amount=2、sideEffect=null、`incrementCombo`
- `style.css`：新增 `.tile__image--tulip`（复用 flower 的位置规则）

### 自检
- `node --check app.js` 通过
- 待 `@B-FIX` 实机回归：分布数量正确、郁金香前景居中、小跳 + 飞花 2 朵、撞天敌作废、Combo 计入

---

## 任务卡：通关条件加入郁金香（B-COD-WIN-TULIP-01）

- 任务 ID：`B-COD-WIN-TULIP-01`

### 已实施改动
- `app.js`
  - `goalTargets` 新增 `tulip: 4`；`honeyGoalTarget` 同步累加
  - `createInitialGameState` 返回的 state 新增 `tulipHoney: 0`
  - `finalizeSuccessRun`：新增 `gainedTulip` 累计与 `tulipHoney` 入账；通关条件三桶都达标；通关 statusText 含郁金香
  - HUD 文本：`renderHud` 主 HUD / gameOverSummary / gameWinSummary 全部加 `· 郁金香 X/4`
  - 三处 `游戏结束 · 小白花...` 文本统一补 `· 郁金香 X/4`

### 自检
- `node --check app.js` 通过

## 模块：目标 HUD 改为 icon + 数字
- 任务 ID：`B-COD-HUD-GOAL-ICON-01`
- 目标：HUD"目标"卡片由一行文字改为参考图风格的 3 槽 icon + 当前值

### 已实施改动
- `index.html`
  - 替换原 `hud-card--primary` 内容：删 `hud-label`/`#total-honey`，改为 `#goal-card` 内 3 个 `.goal-item`（flower / apple / tulip），每个含 `.goal-item__icon` + `.goal-item__num`
  - icon 资源：`assets/ui/icon_flower_01.png`、`icon_apple_01.png`（苹果花）、`icon_tulip_01.png`
  - 卡片 `aria-label` 包含完整"已得/目标"文案
  - 样式版本号 bump：`style.css?v=goal-icon-20260615-1`
- `style.css`
  - 新增 `.hud-card--goals`（横排、gap 14、padding 10/18、width auto）
  - 新增 `.goal-item` / `.goal-item__icon`（28x28）/ `.goal-item__num`（18px 700）
  - `.goal-item.is-done .goal-item__num { color: #2f8a3e }` 达成态高亮
  - 窄屏断点：icon 22x22、字号 14px、gap 10、padding 7/12
- `app.js`
  - `dom` 新增 `goalCard / goalFlower / goalApple / goalTulip`
  - 新增 `renderGoalHUD()`：同步三槽数字、刷新 `aria-label`、按 `goalTargets` 比对切换 `is-done`
  - `renderHud()` 删除 `dom.totalHoney.textContent` 拼接，改为 `renderGoalHUD()`
  - HUD pulse 改为作用在 `dom.goalCard`

### 范围说明
- `Collection/` 子目录是历史拷贝，本次未同步修改

### 自检
- `node --check app.js` 通过

---

## 任务卡：郁金香两阶段（B-COD-TULIP-STAGES-01）

- 任务 ID：`B-COD-TULIP-STAGES-01`

### 已实施改动
- `app.js`
  - 删除常量 `tulipOverlayAsset`，改为 `tulipStageAssetMap = { bloom, sprout }`
  - `getInitialGrowthStage("tulip")` 返回 `"bloom"`
  - 新增 `getTulipStage(tileState)`，做 fallback 到 bloom
  - `getSafeTileOverlayMarkup`：tulip 分支按 stage 取图，并附加 `tile__image--tulip-bloom / -sprout` 钩子类
  - `extendRun`：tulip 分支按 stage 分流
    - bloom：`amount=2`、`sideEffect=advance-tulip-to-sprout`、`incrementCombo`
    - sprout：`amount=0`、`sideEffect=advance-tulip-to-bloom`、`silentBounce=true`、不 Combo
  - `commitOneSideEffect`：新增 `advance-tulip-to-sprout` / `advance-tulip-to-bloom` 两条分支
  - finalizeSuccessRun 的 `gainedTulip` 自然仅累加 `entry.type === "tulip"`（bloom 走这条），sprout 入 `tulip_sprout`，不计入 `tulipHoney`

### 自检
- `node --check app.js` 通过

---

## 模块：飞花直达目标 icon + 移除"本轮暂存"
- 任务 ID：`B-COD-HUD-GOAL-COLLECT-01`
- 目标：删除"本轮暂存"卡片，让飞花飞行终点按 tile 类型路由到对应目标 icon；落地即提交分项花蜜并播放 icon 弹跳 + burst

### 已实施改动
- `index.html`
  - 删除 `#round-honey-card` 整段
  - 每个 `.goal-item` 新增 `<span class="goal-item__burst" aria-hidden="true">` 用于到达爆点
  - 样式版本 bump 为 `style.css?v=goal-arrival-20260615-1`
- `style.css`
  - 删除 `.hud-card--secondary`、`.hud-card--secondary.hud-card--collect`、`.hud-roll*`、`.hud-collect-burst`、`.hud-card--primary strong`、`.hud-card--primary.hud-card--pulse strong` 及窄屏断点对应规则
  - 删除 `@keyframes hud-roll-up / hud-collect-bounce / hud-collect-burst / honey-pulse`
  - 新增 `.goal-item__icon` 默认 transform-origin / transition
  - 新增 `.goal-item.is-collecting .goal-item__icon` 播 `goal-collect-bounce`
  - 新增 `.goal-item__burst` 与 `.goal-item.is-collecting .goal-item__burst` 播 `goal-collect-burst`
  - 新增 `@keyframes goal-collect-bounce`（峰值 1.5）与 `goal-collect-burst`
- `app.js`
  - 状态裁剪：删除 `gameState.roundHoney / currentRunHoney / totalHoneyPulse`、`feedbackState.hudDisplayedValue / hudTargetValue / isHudRolling / hudRollingFrom / hudRollingTo / shouldResetRoundHoney`、`collectFeedbackConfig.hudRollDuration / hudResetDelay`
  - dom 裁剪：删除 `dom.totalHoney / roundHoney / roundHoneyCard`
  - 函数裁剪：删除 `syncRoundHoney / renderRoundHoneyValue / runNextHudIncrement / enqueueTempHoneyIncrement / maybeResetRoundHoneyAfterArrival / playHudCollectFeedback / getHudCollectTargetPoint / animateFlowerToHud`
  - 新增 `commitGoalArrival(type)`：按类型 `flowerHoney/appleHoney/tulipHoney += 1`，并令 `gameState.totalHoney = 三桶之和`，最后 `renderGoalHUD()`
  - 新增 `getGoalIconElement(type) / getGoalIconTargetPoint(type)`：按 type 选 `#goal-flower / #goal-apple / #goal-tulip` 父节点取到达坐标
  - 新增 `playGoalCollectFeedback(type)`：对应 `.goal-item` 加 `is-collecting`，360ms 移除
  - `animateFlowerToGoal(start, runToken, type)` 替换 `animateFlowerToHud`，并把 `type` 写入 flight 元数据
  - `spawnFlowerFlyEffect(tileId, type)` 增加 type 参数；保底分支直接 `commitGoalArrival(type)`
  - `finishFlowerFlight` 改为：`commitGoalArrival(flight.type) + playGoalCollectFeedback(flight.type) + playCollectSound()`
  - `finalizeSuccessRun` 不再 bulk add 三桶与 totalHoney；保留 gainedHoney 用于 statusText / logEvent
  - 调用点 `spawnFlowerFlyEffect(item.tileId, item.type)`
  - `queueRoundHoneyReset` 保留为兼容空壳
  - `resetCollectionFeedback` 移除 resetDisplay 参数，转为清理任何 `.goal-item.is-collecting`
  - `triggerSuccessFeedback` 删除 `totalHoneyPulse` 相关代码
  - debug snapshot 同步清理（去掉 hudDisplayedValue / hudTargetValue / isHudRolling / shouldResetRoundHoney）

### 规则与时序
- 每朵飞花落地都即时 -1 对应目标剩余数（视觉与逻辑 1:1）
- 三桶花蜜由 commit 在每次落地时累加；通关检查仍在 finalizeSuccessRun（已在所有飞行结束后）
- 失败路径不进入 settlement 序列，无 flight 触发，自然不会提交

### 范围说明
- `Collection/` 子目录是历史拷贝，本次未同步修改

### 自检
- `node --check app.js` 通过


---

## B-COD-BEE-01：蜜蜂地块

任务来源：A-PLN.md `A-PLN-BEE-01`

### 改动清单

- `app.js`
  - `tileTypeOrder` 加 `"bee"`（tulip 后、empty 前）
  - 新增常量 `beeStageAssetMap`（stage0/1/2 → bee_01/02/03.png）和 `flyBeeAsset`（指向 `cursor-default.png`）
  - `tileAssetMap.bee = tile-empty.png`（底图）
  - `createTileTypeSummary()` 加 `bee: 0`
  - 默认全局 `tileTypeRatioBaseCounts` 加 `bee: 0`
  - 12 关 `levelConfigs` 全部加 `bee` 字段；L5 / L9 设 `bee: 1`，对应 `empty -1`；L5 / L9 intro/hooks 文案补蜜蜂巢
  - `assignRandomTileTypes` 新增 bee 候选池切分（在 tulip 之后、flower 之前）
  - `validateTypeMap` 加 bee 数量校验
  - `getInitialGrowthStage("bee") = "stage0"`
  - 新增 `getBeeStage(tileState)`
  - `tileState` 初始化加 `beePassCount: 0`
  - `isSafeTileType` 包含 `"bee"`
  - `getSafeTileOverlayMarkup` 加 bee 分支
  - `getTileTypeLabel("bee") = "蜜蜂巢"`
  - `getFlightAssetForType("bee_reward") = flyBeeAsset`
  - `enqueueTileCollection` 新增 bee 分支：push `{ type:"bee", amount:0, sideEffect:"advance-bee-pass", silentBounce:true, willReward:(passCount+1>=2) }`，不入 Combo
  - `commitOneSideEffect` 新增 `advance-bee-pass` 分支：willReward → 切 stage2 + 调用 `spawnBeeRewardFlight`；否则 → 切 stage1 + `beePassCount = 1`
  - 新增 `spawnBeeRewardFlight(tileId)`：复用现有飞行管线，目标 `dom.beeCounterIcon`，flight type=`bee_reward`，元数据带 `sourceTileId`
  - 新增 `finalizeBeeReward(tileId)`：`remainingBees += 1` + 复位 `beePassCount=0 / growthStage=stage0` + 触发计数器跳动 + 重渲染
  - 新增 `triggerBeeCounterPulse()`：手动添加 `bee-counter__icon--jump` 重启动画（用于增加蜜蜂时；renderHud 内置 pulse 仅在减少时触发）
  - `finishFlowerFlight` 加 bee_reward 分支：调 `finalizeBeeReward(flight.sourceTileId)` + `playCollectSound()`，不走 commitGoalArrival
- `style.css`
  - 新增 `.tile__image--bee` 主样式（参照 tulip）
  - `.tile__image--bee-stage1 / -stage2` 预留位（首版与 stage0 共用定位）

### 规则与时序

- 蜜蜂地块累计经过 2 次 → +1 蜜蜂；跨回合保留 `beePassCount`；棋盘重生成时归零（天然）
- 第 1 次松手成功结算：在飞币序列槽位 silentBounce 跳到顶点切 bee_02，无飞物
- 第 2 次松手成功结算：顶点切 bee_03 + 发射 `cursor-default.png` 飞蜜蜂走弧线 → HUD 蜜蜂图标，落地 `remainingBees += 1` + 计数器跳动 + 地块切回 bee_01 + `beePassCount = 0`
- 同轮重复经过：复用 `alreadyInPendingScore` 去重
- 撞鸟失败：pendingScoreList 整体作废，commit 不执行 → `beePassCount` 不推进
- bee 不参与 Combo / 不进 `goalTargets` / 不进任何花蜜桶
- `remainingBees` 不封顶
- `waitForAllFlightsToLand` 自动会等到飞蜜蜂落地后再调用 `finalizeSuccessRun`

### 自检

- `node --check app.js` 通过
- 节点级模拟（无 DOM 兜底分支）：
  - L5 / L9 / L1 棋盘类型汇总正确（L5/L9 各 1 bee，L1 0 bee）
  - 第 1 次 enqueue `willReward=false`；commit 后 `stage1 / passCount=1 / bees 不变`
  - 第 2 次 enqueue `willReward=true`；commit 后通过无 DOM 兜底立即 `finalizeBeeReward` → `stage0 / passCount=0 / bees +1`
  - 第 3 次 enqueue 又回到 `willReward=false`，循环正确
---

## B-COD-CATERPILLAR-01：青虫地块

任务来源：A-PLN.md `A-PLN-CATERPILLAR-01`

### 改动清单

- `app.js`
  - `tileTypeOrder` 加 `"caterpillar"`（bee 后、empty 前）
  - 新增常量 `caterpillarOverlayAsset = "./assets/tiles/insects_01.png"`
  - `tileAssetMap.caterpillar = "./assets/tiles/tile-empty.png"`（底图复用 empty）
  - `createTileTypeSummary()` 加 `caterpillar: 0`
  - 默认全局 `tileTypeRatioBaseCounts` 加 `caterpillar: 0`
  - 12 关 `levelConfigs` 全部加 `caterpillar` 字段；L5 设 1（empty: 2 → 1）；L5 hooks/intro 加青虫文案
  - `assignRandomTileTypes` 新增 caterpillar 候选池（bee 之后、flower 之前）
  - `validateTypeMap` 加 caterpillar 数量校验
  - `isSafeTileType` 包含 `"caterpillar"`
  - `getSafeTileOverlayMarkup` 加 caterpillar 分支（单层 `<img>` 叠在 tile-empty 底上）
  - `getTileTypeLabel("caterpillar") = "青虫"`
  - `getFlightAssetForType("caterpillar_jump") = caterpillarOverlayAsset`
  - 新增 `runCaterpillarMovementsAfterRound()`：候选 = revealed 且 type ∈ {flower, apple_tree, tulip}；按 caterpillarId 升序结算；冲突复查；源格立即 → empty + 翻牌；目标格 → 飞行落地回调中变 caterpillar + 翻牌 + 压扁；全盘重算 dangerCount
  - 新增 `spawnCaterpillarJump(sourceTileId, targetTileId, onLand)`：贝塞尔弧线 + arcHeight 56–90px + 560ms + 轻微摆动；type=`"caterpillar_jump"`；带 `onLand` 回调
  - 新增 `triggerCaterpillarSquash(tileId)`：给目标 tile 元素加 `tile--caterpillar-squash` class，220ms 后移除
  - `finishFlowerFlight` 加 caterpillar_jump 分支：调 `flight.onLand?.()`，不走 commitGoalArrival
  - `completeRun` 四处接入点（失败 / 纯路过 / 零花蜜捷径 / 有花蜜结算尾）：在 `runEnemyMovementsAfterRound()` 前各插一行 `runCaterpillarMovementsAfterRound()`（先青虫后小鸡）
- `style.css`
  - 新增 `.tile__image--caterpillar`（参照 tulip 尺寸，68% 宽，居中略上）
  - 新增 `.tile--caterpillar-squash .tile__inner` + `@keyframes tile-caterpillar-squash`（220ms 弹性压扁）

### 规则与时序

- 青虫地块路过：无副作用、无收益、无 silentBounce（默认 enqueue 不处理 = 等同 empty）
- 结算尾顺序：青虫（吃 + 跳） → 小鸡（换位）
- 青虫候选：邻居中 revealed && type ∈ {flower, apple_tree, tulip}（bee/empty/caterpillar 排除）
- 选中目标：随机一个；按 tileId 升序解决多只青虫冲突
- 视觉时序：
  1. 源格立即 type=empty + 翻牌
  2. 发射飞行 insects_01.png 走贝塞尔弧线
  3. 落地：目标 type=caterpillar、growthStage=null、翻牌 + 压扁
  4. 全盘重算 dangerCount
- 失败链路同样触发（路径 1）
- 不进 `goalTargets` / 不进任何花蜜桶 / 不入 combo

### 自检

- `node --check app.js` 通过
- 节点级模拟：
  - L5 棋盘类型汇总：`{flower:10, empty:1, bee:1, caterpillar:1}` 共 13 ✅
  - 青虫位移：T13(caterpillar) → T09(flower bloom)
    - 落地后 T13.type=empty、T09.type=caterpillar、growthStage=null ✅
  - 无植被邻居场景：青虫原地保留 type=caterpillar ✅
  - 日志输出 `青虫吃作物 { moves, skippedNoTarget, skippedConflict }` 正确

### 范围说明
- 本轮只做 caterpillar，不动 orange_tree
- 不做"被吃植被退还花蜜"
- 不做青虫专属 toast / 警告 / 起跳烟雾
- `Collection/` 子目录是历史拷贝，本次未同步修改
---

## B-COD-FLOWER-COLORS-01：小黄花 + 小红花

任务来源：A-PLN.md `A-PLN-FLOWER-COLORS-01`

### 改动清单

- `app.js`
  - `tileTypeOrder` 加 `"flower_yellow"`, `"flower_red"`（放在 `flower` 之后）
  - `tileAssetMap` 加两类（fallback 用 `tile-flower.png`）
  - 新增 `flowerYellowStageAssetMap` / `flowerRedStageAssetMap`（带 `?v=flora-20260616-1` 缓存绕过）
  - 新增 `flowerYellowFlyAsset` / `flowerRedFlyAsset`（指向 icon_flower_02/03.png）
  - `createTileTypeSummary` / 默认全局 `tileTypeRatioBaseCounts` / 默认全局 `goalTargets` 加两个字段
  - `getInitialGrowthStage` 加两类 → "bloom"
  - 新增 `getFlowerYellowStage` / `getFlowerRedStage`
  - `isSafeTileType` 包含两类
  - `getTileTypeLabel` 加 "小黄花" / "小红花"
  - `getFlightAssetForType` 加 `flower_yellow` / `flower_red`
  - `assignRandomTileTypes` 新增 yellow / red 候选池（caterpillar 后、flower 前）
  - `validateTypeMap` 加两类校验
  - `getSafeTileOverlayMarkup` 加两类分支：复用 `.tile__image--flower` 主样式 + `.tile__image--flower-yellow/red` 标识 class + `.tile__image--flower-{stage}` 阶段定位
  - `enqueueTileCollection` 加两类分支：bloom → amount=1 + advance-flower-yellow/red-to-sprout + combo；sprout → amount=0 + silentBounce + advance-flower-yellow/red-to-bloom
  - `commitOneSideEffect` 加 4 个 sideEffect 分支
  - `getGoalIconElement` 加两个映射
  - `commitGoalArrival` 加两个分支；`totalHoney` 公式扩展到 6 桶
  - `createInitialGameState` 加 `flowerYellowHoney: 0` `flowerRedHoney: 0`
  - `dom` 加 6 个新引用（3 num + 3 item）
  - `renderGoalHUD` 渲染两个新数字与 is-done class
  - `GOAL_LABEL_MAP` / `GOAL_STATE_KEY` / `getActiveGoalKeys` / `applyGoalVisibility` 加两个 key
  - `getStateSnapshot` / `finalizeSuccessRun` gainedXxx 拆分 / level-result logEvent payload 加两个字段
  - `finalizeSuccessRun` 通关判定加 2 个 AND（黄 ≥ 目标 && 红 ≥ 目标）
  - 12 关 `levelConfigs` 全部加 `flower_yellow: 0, flower_red: 0` 到 `tileTypeRatioBaseCounts` 与 `goalTargets`；L5 设 4/3/3 + goal 10/10/10
  - `runCaterpillarMovementsAfterRound` 的 `VEGETATION_TYPES` 加两类
- `index.html`
  - `<section class="goal-card">` 加 2 个 `<div class="goal-item">`：data-goal="flower-yellow" / "flower-red"，对应 `#goal-flower-yellow` / `#goal-flower-red` num 节点
- `style.css`
  - 不新增规则；黄/红花复用 `.tile__image--flower` 主样式 + `.tile__image--flower-{stage}` 阶段定位

### 规则与时序
- 黄花 / 红花完全照搬白花机制（bloom→sprout, sprout→bloom, +1 蜜, Combo, silentBounce）
- 飞花到达 HUD 走对应颜色目标 icon，落地时累加对应 honey 桶
- 通关需 3 桶都达标
- 青虫吃黄/红花生效（VEGETATION_TYPES 已扩展）

### 自检
- `node --check app.js` 通过
- 节点级模拟（L5 + seed=77）：
  - 棋盘汇总：`{flower_yellow:3, flower_red:3, flower:4, empty:1, bee:1, caterpillar:1}` 共 13 ✅
  - goalTargets：`flower:10 / flower_yellow:10 / flower_red:10` ✅
  - 黄花 bloom enqueue → amount=1 + advance-flower-yellow-to-sprout ✅
  - commit → sprout ✅
  - 黄花 sprout enqueue → amount=0 silentBounce + advance-flower-yellow-to-bloom ✅
  - commit → bloom ✅

### 范围说明
- 本轮只做 yellow / red，沿用白花同套机制
- 不动 bee / apple_tree / tulip / caterpillar 自身逻辑
- icon_flower_04/05、icon_tulip_02/03 仍按"预留"对待
- 仅 L5 引入；其它 11 关字段补 0、目标不变
- `Collection/` 子目录历史拷贝未同步
---

## B-COD-TULIP-WHITE-01：白色郁金香

任务来源：A-PLN.md `A-PLN-TULIP-WHITE-01`

### 改动清单

- \`app.js\`
  - \`tileTypeOrder\` 加 \`"tulip_white"\`
  - 新增 \`tulipWhiteStageAssetMap\` / \`tulipWhiteFlyAsset\`（带缓存绕过 ?v=tulip-20260616-1）
  - \`tileAssetMap\` 加 fallback
  - \`createTileTypeSummary\` / 默认 \`tileTypeRatioBaseCounts\` / \`goalTargets\` 加字段
  - \`getInitialGrowthStage\` / \`getTulipWhiteStage\` / \`isSafeTileType\` / \`getTileTypeLabel\` / \`getFlightAssetForType\` 全部扩展
  - \`assignRandomTileTypes\` 加 tulip_white 候选池（在 tulip 之后）
  - \`validateTypeMap\` 加校验
  - \`getSafeTileOverlayMarkup\` 新增 tulip_white 分支（复用 .tile__image--tulip 主样式 + .tile__image--tulip-white 标识）
  - \`enqueueTileCollection\` 加分支：bloom amount=2 advance-tulip-white-to-sprout + combo；sprout amount=0 silentBounce advance-tulip-white-to-bloom
  - \`commitOneSideEffect\` 加 2 个新 sideEffect 分支
  - \`getGoalIconElement\` 加映射；\`commitGoalArrival\` 加分支；totalHoney 扩为 7 桶
  - \`createInitialGameState\` 加 \`tulipWhiteHoney: 0\`
  - \`dom\` 加 2 个新引用
  - \`renderGoalHUD\` 渲染新数字与 is-done
  - \`GOAL_LABEL_MAP\` / \`GOAL_STATE_KEY\` / \`getActiveGoalKeys\` / \`applyGoalVisibility\` 加 key
  - \`honeyGoalTarget\` 公式加 tulip_white
  - \`getStateSnapshot\` / \`finalizeSuccessRun\` gainedTulipWhite + payload 加字段
  - 通关判定加 \`tulipWhiteHoney >= goalTargets.tulip_white\`
  - 12 关 levelConfigs 全部加 \`tulip_white: 0\`；L5 设 1 + goal 4，并把白花从 4 → 3（让出 1 格）
  - \`runCaterpillarMovementsAfterRound\` 的 \`VEGETATION_TYPES\` 加 \`"tulip_white"\`
- \`index.html\`
  - 在 \`tulip\` goal-item 后加 \`data-goal="tulip-white"\` 项，指向 \`#goal-tulip-white\` + \`icon_tulip_03.png\`

### 自检
- \`node --check app.js\` 通过
- 节点级模拟 L5 (seed=88)：
  - 棋盘：\`{flower:3, flower_yellow:3, flower_red:3, tulip_white:1, bee:1, caterpillar:1, empty:1}\` 共 13 ✅
  - goalTargets：\`flower:10 / flower_yellow:10 / flower_red:10 / tulip_white:4\` ✅
  - 白郁 bloom enqueue → amount=2 + advance-tulip-white-to-sprout ✅
  - commit → sprout ✅
  - 白郁 sprout enqueue → amount=0 silentBounce + advance-tulip-white-to-bloom ✅
  - commit → bloom ✅

### 范围说明
- 本轮只做 \`tulip_white\`
- 其它 11 关只补 0 字段
- \`Collection/\` 子目录未同步
---

## B-COD-LEVEL-DESIGN-16

### 实施
- 来源：`A-PLN.md` `A-PLN-LEVEL-DESIGN-16` 任务卡
- 改动文件：`app.js` 仅 `levelConfigs[]` 数组与注释
- 改动范围：`app.js:4-7`（注释更新）+ `app.js:107-302`（`levelConfigs` 12 项 → 16 项）
- **零结构变更**：未动 layout 拓扑、tile 类型枚举、任何函数；未动 `style.css` / `index.html` / 资源文件

### 16 关字段落地（按 A-PLN.md v3 修订版表格逐字填入）
- L1 / L2 / L3 / L4 沿用旧 L1-L4 数值
- L5 改为 rest1 蜂巢初识：13 格 / 0 鸟 / `flower=9, bee=1, empty=3` / bees=8 / goal F=8
- L6 沿用旧 L6 紫郁登场
- L7 改为 Train 蜂巢主线：13 格 / 1 鸟 / `flower=7, bee=1, empty=4` / bees=7 / goal F=6
- L8 改为 Twist 黄红颜色变奏：16 格 / 2 鸟 / `flower=4, fy=3, fr=3, tulip=2, empty=2` / bees=6 / goal F=4,Fy=3,Fr=3,T=2
- L9 改为 Conclude appleFruit 首启用：19 格 / 3 鸟 / `flower=9, apple=2, tulip=3, empty=2` / bees=5 / goal F=10,A=1,Af=1,T=3
- L10 沿用旧 L9 rest2 郁金香田
- L11 新增青虫首引：13 格 / 1 鸟 / `flower=7, caterpillar=1, empty=4` / bees=7 / goal F=6
- L12 新增白郁登场：16 格 / 2 鸟 / `flower=8, tulip_white=1, caterpillar=1, empty=4` / bees=6 / goal F=6,Tw=2
- L13 新增 22 格综合：22 格 / 3 鸟 / `flower=11, apple=1, tulip=2, tulip_white=1, caterpillar=1, empty=3` / bees=6 / goal F=10,A=1,T=2,Tw=1
- L14 新增远端 Conclude：22 格 / 4 鸟 / `flower=10, apple=2, tulip=3, tulip_white=1, caterpillar=1, empty=1` / bees=5 / goal F=10,A=2,Af=1,T=3,Tw=1 / `far-from-start-then-cluster`
- L15 新增伪 rest：22 格 / 2 鸟 / `flower=8, fy=2, fr=2, apple=1, tulip=2, tulip_white=1, bee=1, empty=3` / bees=7 / goal F=6,Fy=2,Fr=2,A=1,T=2,Tw=1
- L16 新增 climax：22 格 / 8 鸟 / `flower=3, fy=2, fr=2, apple=2, tulip=1, tulip_white=1, bee=1, caterpillar=1, empty=1` / bees=5 / goal F=3,Fy=2,Fr=2,A=2,Af=2,T=1,Tw=1 / `far-from-start-then-cluster`

### 自检
- `node --check app.js` ✅
- `grep -c '^    id: "L' app.js` = 16 ✅
- 每行 tile 数 sum = layout 总格数（7/9/11/13/16/19/22）已逐行核对 ✅
- 引用 `levelConfigs.length` 的 13 处全部动态读取，无 hardcoded 12 ✅
- 唯一遗留字面"12 关"在 line 241——已是新 L12 entry name（白色郁金香），符合预期 ✅
- `gotoLevel(idx)` debug 入口范围检查 `idx < levelConfigs.length` 已自动适配 ✅

### 范围说明
- 本轮只动 levelConfigs 数据，不动任何代码逻辑
- L29/30+ 之前 32 关方案的素材（橘子树、蘑菇、河流）继续保持搁置
- `Collection/` 子目录未同步

### Handoff
- 下一步：浏览器跑 L1 → L16 实机回归（intro toast、盘面伸缩、far-cluster 远端聚集、伪 rest 心流陷阱、climax 8 鸟）
- 阻塞：`expectedRunsToWin` 全部待 `logEvent("level-result")` 真实数据校准
