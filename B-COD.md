# B-COD 记录

## Claim
- 任务 ID：B-COD-ASSET-WIRE-001
- 当前 claim：模块《地块资源接入》
- 范围：仅把现有地块纯色/占位表现切换为 `assets/tiles/` 下四张图片资源，不改玩法逻辑
- 说明：当前目录仅发现 `B-COD.md`，未找到 `A-PLN.md`、`A-SRC.md`、`A-ASK.md`，本次按任务卡直接实现

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

## 接口登记
- 无外部接口
- 运行方式：直接打开 `index.html`
- 后续可直接复用的数据入口：`window.demoBoard.tiles`、`window.demoBoard.adjacencyMap`、`window.demoBoard.gameState`
- 内容调试入口：`window.demoBoard.contentSummary`、`window.demoBoard.tileStateMap`
- 交互调试入口：`window.demoBoard.beginRun(tileId)`、`window.demoBoard.extendRun(tileId)`、`window.demoBoard.endRun()`、`window.demoBoard.resetGame({ typeMap })`
- 反馈相关状态：`window.demoBoard.gameState.isFailFlash`、`toastMessage`、`startPulseTileId`、`isGameOver`
- 局配置与状态导出：`window.demoBoard.getRoundConfigSnapshot()`、`window.demoBoard.getStateSnapshot()`
- 可复现方式：`window.demoBoard.resetGame({ seed: 123456 })`
- 地块资源入口：`tileAssetMap`（位于 `app.js`）

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
- 未做：浏览器人工打开验收
- 未验证原因：当前会话未启动浏览器进行视觉检查，尚未人工确认图片拉伸、未解锁数字清晰度、起点高亮与拖动时是否闪烁
- 建议验证步骤：
  1. 直接打开 `index.html`
  2. 确认未解锁格显示 `tile-unknown.png`
  3. 开启调试模式，确认 `empty / enemy / flower` 分别对应三张资源图
  4. 检查图片是否被拉伸，未解锁格中央数字是否仍清楚
  5. 检查起点高亮是否仍正常包裹在新资源图外侧
  6. 拖动采集一轮，确认路径高亮存在且图片不闪烁

## 协作需求
- 默认可交给 `B-FIX` 做浏览器资源显示、数字可读性与拖动时闪烁回归
- 若当前仅需人工确认资源是否已正确接入，也可直接交 `A-ASK` / 用户验收
