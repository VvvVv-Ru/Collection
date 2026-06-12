# B-COD 记录

## Claim
- 任务 ID：B-COD-DEMO-FEEDBACK-001
- 当前 claim：模块《花朵采集反馈》
- 范围：仅接入飞花采集反馈、HUD 吸附/弹跳/音效、本轮暂存数值平滑递增；不改现有主玩法规则与结算口径
- 说明：当前目录仅发现 `B-COD.md`，未找到 `A-PLN.md`、`A-SRC.md`、`A-ASK.md`，本次按任务卡直接实现；现有 `本轮暂存` UI 需要补稳定锚点与反馈动画类

## 实现记录
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

## 接口登记
- 无外部接口
- 运行方式：直接打开 `index.html`
- 后续可直接复用的数据入口：`window.demoBoard.tiles`、`window.demoBoard.adjacencyMap`、`window.demoBoard.gameState`
- 内容调试入口：`window.demoBoard.contentSummary`、`window.demoBoard.tileStateMap`
- 交互调试入口：`window.demoBoard.beginRun(tileId)`、`window.demoBoard.extendRun(tileId)`、`window.demoBoard.endRun()`、`window.demoBoard.resetGame({ typeMap })`
- 飞花调试入口：`window.demoBoard.spawnFlowerFlyEffect(tileId)`
- 飞花状态观测：`window.demoBoard.feedbackState`
- 反馈相关状态：`window.demoBoard.gameState.isFailFlash`、`toastMessage`、`startPulseTileId`、`isGameOver`
- 局配置与状态导出：`window.demoBoard.getRoundConfigSnapshot()`、`window.demoBoard.getStateSnapshot()`
- 可复现方式：`window.demoBoard.resetGame({ seed: 123456 })`
- 地块资源入口：`tileAssetMap`（位于 `app.js`）
- 飞花资源入口：`flowerFlyAsset`（位于 `app.js`，默认指向 `assets/effects/flower-fly.svg`）
- 翻格音效资源入口：`tileRevealSoundAsset`（位于 `app.js`，默认指向 `assets/audio/sfx/tile-reveal.wav`）
- 翻格音效函数：`playTileRevealSound()` / `primeTileRevealSound()`（位于 `app.js`），在 `setTileRevealed()` 内首次解锁时触发一次，每次 `cloneNode` 播放支持快速连翻

## 验证记录
- 已做：
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
- 未做：浏览器人工打开验收
- 未验证原因：当前会话未启动浏览器进行视觉检查，也无法在此直接录屏；尚未人工确认飞花轨迹、HUD 吸附弹跳、音效触发时机、移动端缩放后的锚点精度
- 建议验证步骤：
  1. 直接打开 `index.html`
  2. 连续滑过 3~5 个花朵格，确认飞花按约 0.08 秒错峰发射，形成连续 `Pupupu` 节奏
  3. 观察飞花是否从格子中心偏上位置出生、先轻微 pop，再沿弧线吸附到 `本轮暂存` 整体卡片
  4. 确认每朵到达时 `本轮暂存` 卡片都会弹一下、出现中心吸附 burst，并播放一次短促收集音
  5. 确认 `本轮暂存` 数字按到达节奏连续滚动递增，多朵衔接时不抖碎、不回退
  6. 成功松手后确认总花蜜结算、起点继承、飞花/数字收尾没有破坏原有主流程
  7. 失败踩敌后确认未到达飞花不会残留到下一轮

## 协作需求
- 默认可交给 `B-FIX` 做浏览器实机回归：飞花层级、Bezier 弧线观感、HUD 锚点精度、音效时机与移动端缩放适配
- 若当前阶段先做人眼验收，也可先交 `A-ASK` / 用户按上方步骤检查，再决定是否补第二轮爽感优化
