# B-COD 记录

## Claim
- 任务 ID：A-PLN-ART-TILE-FLOWER-01
- 当前 claim：模块 M1《小花格子双层资源叠加显示》
- 范围：仅修改 flower 格显示层，将单张 `tile-flower.png` 改为 `tile-empty.png + flower_01.png` 双层渲染；不改玩法逻辑、数据结构、类型定义、判定与音效链路
- 历史 claim 已闭环：`B-COD-DEMO-FEEDBACK-001`（花朵采集反馈）、`B-COD-DEMO-FEEDBACK-002`（自定义光标）、`B-COD-DEMO-FEEDBACK-002-A`（光标资源接入）、`SFX-01`（翻格音效）、`SFX-02`（撞天敌音效）、`FX-01`（采集范围高亮）、`B-COD-DEMO-AUDIO-001`（主背景 BGM 接入）、`FX-02`（起点格子强化标识）、`RULE-01`（取消起点继承 + 自由选择起点）、`RULE-02`（蜜蜂消耗保护机制）、`RULE-03 / FX-03`（删除固定起点 UI + 非法点击反馈）

## 实现记录
- 本轮新增 `flowerOverlayAsset` 常量，指向 `./assets/tiles/flower_01.png`，作为 flower 格前景资源入口
- 本轮新增 `getTileVisualMarkup(tileState, fallbackAsset)`：仅对 `revealed && type === "flower"` 输出双层结构，其它格保持原单图渲染
- `createTileElement()` 的静态态与翻牌背面态，现统一复用 `getTileVisualMarkup()`；普通花格与翻牌中的花格都会显示为 `tile-empty.png + flower_01.png`
- 本轮新增样式 `.tile__image-stack / .tile__image--layer / .tile__image--flower`，用于双层图片叠放；未改路径高亮、起点、失败等状态 class 逻辑
- 新建最小静态前端文件：`index.html`、`style.css`、`app.js`
- 页面包含 HUD 占位：总花蜜、本轮暂存花蜜、剩余蜜蜂数
- 19 格盘面按 `2 / 2 / 3 / 3 / 3 / 3 / 2 / 1` 行结构由配置生成，不写死在 DOM
- 建立基础布局配置：`layoutRows`、`rowTileIds`、`rowSlots`
- 建立基础数据映射：每格包含 `id / row / col / slotX / neighbors`
- 建立最小状态结构：`currentStartTileId`、`revealedTiles`、`tileStateMap`、`totalHoney`、`roundHoney`、`remainingBees`
- 初始状态：仅 `T18` 为已解锁起点，其他格保持未解锁深棕色
- 为后续玩法预留：`type`、`dangerCount`、`neighbors`、`tilesById`、`adjacencyMap`
- 调试挂载：`window.demoBoard`
- 本轮新增随机开局初始化：每次加载按固定数量生成 `3 enemy / 8 flower / 8 empty`
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

## 验证记录
- 已做：
  0. 针对 flower 显示层改动执行 `node --check app.js`，语法通过
  0. 代码级确认：非 flower 类型仍走原单图 `<img class="tile__image">` 渲染分支
  0. 代码级确认：flower 格在普通 revealed 与 `tile--flipping` 背面态均走双层渲染分支
  1. `node --check app.js` 通过语法检查
  2. Node 循环 200 次验证：每局始终满足 `3 enemy / 8 flower / 8 empty`
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
- 未验证原因：当前会话未启动浏览器进行视觉检查，也无法在此直接录屏；尚未人工确认 Combo 浮层是否严格跟随“最新采花格”、强化档表现、2.5 秒上浮渐隐、音效节流，以及与飞花 / 光标 / BGM 的叠加观感
- 建议验证步骤：
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
- 本模块 M1 已可交给 `B-FIX` 做视觉回归，重点检查：花层居中、透明边、翻牌前后、路径高亮 / 起点 / 失败状态是否遮挡前景花层
- 默认可交给 `B-FIX` 做浏览器实机回归：Combo 浮层跟随最新采花格、强化档视觉、2.5 秒结束渐隐、音效节流，以及与飞花 / 自定义光标 / BGM 的并存观感
- 本模块完成后建议回流 `@A-PLN` 做阶段收口；若先做人眼验收，也可先交 `A-ASK` / 用户按上方步骤检查，再决定是否补第二轮爽感优化
