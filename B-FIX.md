# B-FIX 记录

## 本轮目标
- 任务：检查并修复“四张切图替换后，游戏内效果与目标效果图不一致”的主要样式问题
- 范围：先修资源接入层的显示 bug，不改玩法逻辑与随机内容分布

## 文档前置检查
- 已在项目根目录检查：仅发现 `B-COD.md`
- 未发现：`A-PLN.md`、`A-SRC.md`、`A-ASK.md`
- 本文件为本轮新增排错记录

## 复现条件
- 运行方式：直接打开 `index.html`
- 资源目录：`assets/tiles/`
- 当前接入资源：
  - `tile-unknown.png`
  - `tile-empty.png`
  - `tile-flower.png`
  - `tile-enemy.png`
- 代码入口：`app.js` 中 `tileAssetMap`
- 样式入口：`style.css` 中 `.tile` / `.tile__inner` / `.tile--revealed` / `.tile--enemy`

## 资源检查结果
- 四张图尺寸一致：`201 x 221`
- 四张图都带 alpha 通道
- 资源本身已经包含完整地块造型与描边，不是单纯贴图碎片

## 根因判断
### 根因 1：新资源被旧占位六边形样式二次裁切
- `style.css` 中 `.tile__inner` / `.tile__ring` 仍使用固定 `clip-path` 六边形
- 新切图本身已经带完整六边形轮廓与圆角
- 结果：资源被旧轮廓强行再次裁切，导致游戏内看起来比效果图更尖、更硬，外形失真

### 根因 2：旧的程序描边/发光还在覆盖正式资源
- `.tile__inner`、`.tile--revealed .tile__inner`、`.tile--start .tile__inner`、`.tile--path .tile__inner` 仍在用 `box-shadow` 画边框/高亮
- 新资源本身已经有描边颜色
- 结果：实际显示变成“资源自带边框 + CSS 再画一层边框”，所以当前截图里边缘颜色、起点外框、路径描边都偏厚，和效果图不一致

### 根因 3：敌人格样式会把资源图直接抹掉
- `.tile--enemy .tile__inner` 使用了 `background: #ff996c;`
- `background` 是简写，会把前面通过 `--tile-image` 设置的 `background-image` 一起重置掉
- 结果：一旦翻开敌人格，鸡的图片会消失，只剩纯色橙块；当前截图没踩到敌人，所以这个问题暂时没暴露完全，但代码上已经存在

### 根因 4：当前盘面布局与效果图不是同一套排布目标
- `app.js` 里的布局仍是 B-COD 固定写死的 `2 / 2 / 3 / 3 / 3 / 3 / 2 / 1`
- 你给的效果图在格子疏密、相对位置、选中高亮位置上都不是这一版布局观感
- 结果：即使图片资源正确接入，整体观感仍不会自动接近目标效果图

## 本轮检查过的文件
- `B-COD.md`
- `app.js`
- `style.css`
- `assets/tiles/tile-unknown.png`
- `assets/tiles/tile-empty.png`
- `assets/tiles/tile-flower.png`
- `assets/tiles/tile-enemy.png`

## 已执行修复
- 修改 `style.css`
  - 移除 `.tile__inner` / `.tile__ring` 对新资源的旧 `clip-path` 裁切
  - 移除锁定格、揭示格、路径格、起点格叠加在资源上的旧 `box-shadow` 描边
  - 把资源铺法统一为 `background-size: 100% 100%`，避免 `cover` 带来的额外裁切
  - 起点高亮改为 `.tile__ring` 基于当前资源图做 mask 外扩，不再直接压坏 tile 本体描边
  - 修复 `.tile--enemy .tile__inner`，不再用 `background` 简写覆盖 `background-image`
- 第二轮补修
  - 根据复现截图，发现未解锁格没有正常显示，实际页面只剩文字与数字悬空
  - 为避免继续依赖空 `span` 的 `background-image` 渲染，本轮把地块本体改为显式 `<img class="tile__image">` 渲染
  - 这样未解锁 / 草地 / 小花 / 天敌四种状态都走同一套图片节点，避免某些状态只剩背景层、不出图的问题
- 第三轮调整
  - 先按用户要求，将棋盘布局参数改为：`xUnit = 88`、`yUnit = 128`
  - 随后再次按用户要求调整为：`xUnit = 66`、`yUnit = 88`
  - 本轮继续按用户要求调整为：`xUnit = 66`、`yUnit = 99`
  - 目的：回收过大的间距，继续人工对比新版排布观感

## 本轮改了哪些文件
- `app.js`
- `style.css`
- `B-FIX.md`

## 最小验证
- `node --check app.js` 通过
- 静态复核确认：
  - 敌人格样式已不再覆盖 `background-image`
  - 新资源不再被旧六边形裁切规则强行二次裁切
  - 起点/路径高亮已从“压在资源上”改为“资源外层高亮”
  - 地块本体已统一改为 `<img>` 渲染，未解锁与天敌不再依赖背景图层显示
  - 当前布局参数已更新为 `xUnit = 66`、`yUnit = 99`

## 建议修改方向
1. 当前已先修资源接入层显示问题
2. 如果目标是继续贴近第二张效果图，下一步应调整盘面布局参数与镜头留白
3. 若你后续希望完全对齐效果图，还要继续统一：起点外框厚度、路径抬升幅度、危险数字样式

## 本轮未修问题
- 未调整 `app.js` 中棋盘布局参数
- 未改变随机分布与玩法逻辑
- 天敌格需要在实际踩中或打开调试时再做一次人工确认
- 原因：这些不属于本次资源替换显示 bug 的根因修复，继续修改会扩大范围

## 新增排查：起点跟随浮层未跟随起点
### 复现条件
- 正常开局后完成若干次移动与结算，观察起点文本提示与独立浮层位置
- 当前截图中，起点文本已落在新起点格上，但独立浮层仍停在上方旧位置附近

### 根因判断
- 起点文本提示与起点格本体属于同一个 tile DOM，在 `renderBoard()` 重绘时会直接跟随 `gameState.currentStartTileId`
- 漂浮物不是 tile 子元素，而是独立 overlay 浮层
- 它的位置完全依赖手动计算 `getBoundingClientRect()` 后再写入 `transform`
- 当前触发点过少：按 B-COD 记录，重定位只放在 `applyResponsiveGameScale()`、`restartGame()`、`completeRun()`，不在每次 `renderAll()` 后更新
- 同时该浮层还带有 `280ms` 的 `transform` transition，因此当起点格立即切换时，文本会先到位，而漂浮物会滞后动画移动，视觉上就是“没有跟随起点”

### 涉及文件
- `app.js`
  - 起点浮层重定位函数
  - `completeRun()`
  - `renderAll()`
- `style.css`
  - 起点浮层样式

### 结论
- 当前问题不在起点状态值本身，`gameState.currentStartTileId` 与起点文本逻辑大概率是对的
- 真正的问题在于：漂浮物采用独立 overlay 手动定位，并且定位刷新时机少、还叠加了过渡动画，所以会和起点 tile 脱节

## 本轮新增修复：移除起点金色描边
### 复现条件
- 当前盘面在起点格与可选起点候选格周围出现明显金色描边
- 用户确认当前版本不再需要起点描边效果

### 根因判断
- `style.css` 中 `.tile--start` 仍保留常驻金色 `box-shadow`
- `.tile--start-candidate:not(.tile--start)` 仍保留候选起点描边和呼吸动画
- `.tile--start-pulse .tile__ring` 仍会在某些结算场景下打出额外金色高亮

### 已执行修复
- 移除 `.tile--start` 的常驻金色描边
- 移除 `.tile--start-candidate:not(.tile--start)` 的候选描边与呼吸动画
- 关闭 `.tile--start-pulse .tile__ring` 的金色脉冲效果

### 本轮改了哪些文件
- `style.css`
- `B-FIX.md`

### 本轮未修问题
- 起点 badge 与蜜蜂跟随逻辑尚未修
- 原因：本轮只按用户要求移除金色描边，不扩大到起点浮层定位逻辑

## 本轮新增修复：删除漂浮蜜蜂
### 复现条件
- 当前盘面顶部/起点附近仍出现独立漂浮蜜蜂图标
- 用户确认该图标当前版本不需要保留

### 根因判断
- 漂浮蜜蜂不是起点 tile 自带内容，而是单独的 overlay 浮层
- `app.js` 中仍会初始化并尝试定位这套 UI
- `style.css` 中仍允许该浮层显示

### 已执行修复
- 在 `style.css` 中关闭该浮层显示
- 在 `app.js` 中把起点漂浮物初始化与重定位逻辑改为收起/隐藏，不再加载图片、不再跟随起点
- 调试入口改为空操作，避免继续把该 UI 拉起

### 本轮改了哪些文件
- `app.js`
- `style.css`
- `B-FIX.md`

### 本轮未修问题
- 未删除 `index.html` 中对应 DOM 结构
- 原因：当前只做最小移除，优先保证功能链路不受影响；现阶段已不会显示，也不会再参与定位

## 本轮新增修复：移除“起点”文本与底框
### 复现条件
- 当前起点格右上仍显示“起点”文本及白色圆角底框
- 用户确认当前版本不需要该文案提示

### 根因判断
- `app.js` 的 `createTileElement()` 在 `isStart` 时仍会拼接起点文本节点
- 因此即使已经移除金色描边和漂浮蜜蜂，起点格仍会保留文字 badge

### 已执行修复
- 删除 `createTileElement()` 中的起点文本 DOM 输出

### 本轮改了哪些文件
- `app.js`
- `B-FIX.md`

### 本轮未修问题
- `style.css` 中对应文本徽标样式定义仍保留，但当前已无起点文本 DOM 引用
- 原因：本轮先做最小移除，避免连带影响其他潜在 badge 用途

## 本轮新增修复：按参考图重调花层位置与大小，并消除形变
### 复现条件
- 当前 flower 格已切到“双层资源叠加”，但前景花看起来被拉长、位置偏满，和参考图中的花大小与锚点不一致

### 根因判断
- 通用 `.tile__image` 规则对所有图片统一使用 `width: 100%`、`height: 100%`、`object-fit: fill`
- 该规则适合完整地块底图，不适合 `flower_01.png` 这种独立前景素材
- `flower_01.png` 实际尺寸为 `165 x 160`，被强行拉伸到 tile 的 `112 x 124` 比例后，会产生非等比形变

### 已执行修复
- 保持底图 `tile-empty.png` 继续铺满整格
- 单独覆盖 `.tile__image--flower`：
  - 改为按素材比例显示，使用 `height: auto` + `object-fit: contain`
  - 缩小到约 `82%` 宽度，避免花层占满整格
  - 调整到格子上半部居中偏上的锚点，贴近参考图观感

### 本轮改了哪些文件
- `style.css`
- `B-FIX.md`

### 最小验证
- `node --check app.js` 通过
- 静态复核确认：flower 前景层不再沿用整格拉伸规则，底图与前景已分离使用不同缩放策略

### 本轮未修问题
- 浏览器人工对照参考图的最终位置与大小尚未逐帧确认
- 原因：当前会话未直接打开浏览器做视觉验收；本轮先完成样式层修正与静态校验

## 本轮新增修复：天敌前景图缩放后出现重影
### 复现条件
- enemy 格接入 `tile-enemy.png + Bird_01.png` 双层显示后，鸟图边缘出现一圈偏深紫的“重影/脏边”

### 根因判断
- 当前问题不是代码把鸟绘制了两次
- `Bird_01.png` 虽然带 alpha，但透明边的 RGB 底色仍是深紫色
- 浏览器在缩放前景图时，会把这些透明边底色一并参与插值，最终在橙色地块上表现为紫色重影

### 已执行修复
- 在 `app.js` 中新增运行时显示修正：
  - 先加载原始 `Bird_01.png`
  - 读取边界透明像素，估算透明底色
  - 对 `0 < alpha < 1` 的半透明边缘像素做去底色反算
  - 生成清理后的 data URL，仅用于 enemy 前景显示
- enemy 格渲染时，前景图改为优先使用清理后的 `enemyOverlayDisplayAsset`
- 该修正只作用于显示层，不改玩法、判定、数据结构与资源文件名

### 本轮改了哪些文件
- `app.js`
- `B-FIX.md`

### 最小验证
- `node --check app.js` 通过
- 静态复核确认：enemy 前景图已不再直接使用原始 `Bird_01.png` 作为最终显示源，而是先经过透明边去底色处理

### 本轮未修问题
- 仍需浏览器人工确认去底色后的鸟图边缘是否已满足最终观感
- 原因：当前会话只能完成代码与资源链路修复，无法替代最终人眼验收

## 本轮新增修复：采花飞花归集动画消失
### 复现条件
- 进入新翻开的 flower 格时，本轮暂存花蜜数值仍会增长，但从格子飞向 `本轮暂存` HUD 的飞花动画不再出现

### 根因判断
- 当前棋盘已改为按需渲染，只把 `revealedTiles + locked danger preview` 挂进 DOM
- `spawnFlowerFlyEffect(tileId)` 在 `setTileRevealed(tileId)` 之后、`renderAll()` 之前执行
- 对于刚翻开的 flower 格，如果它上一帧还不在 DOM，`getTileFlightOrigin(tileId)` 会拿不到起点元素
- `animateFlowerToHud()` 因 `startPoint === null` 直接走兜底分支：只累计 HUD 数值，不创建飞花元素

### 已执行修复
- 在 `spawnFlowerFlyEffect(tileId)` 内增加一次最小补渲染：
  - 先尝试读取飞花起点
  - 若当前格子尚未进 DOM，则先执行 `renderBoard()`
  - 再次读取起点后再进入飞花调度
- 这样只修时序问题，不改飞花动效参数、不改玩法链路

### 本轮改了哪些文件
- `app.js`
- `B-FIX.md`

### 最小验证
- `node --check app.js` 通过
- 代码级确认：新翻开的 flower 格在起点缺失时，现会先补一次棋盘渲染，再创建飞花动画，不再直接落入“只加数字”的兜底分支

## 本轮新增修复：已采集花格二次进入不再加花蜜
### 复现条件
- 某个 flower 格在前一轮已经被翻开并采集过
- 后续轮次再次滑入该 flower 格时，提示文案变成“经过已采集花格”，本轮暂存花蜜不增长

### 根因判断
- `extendRun(tileId)` 内把 flower 的收益绑定在 `tileState.type === "flower" && !wasRevealed`
- 这意味着只有“第一次翻开”的花格才会执行：
  - `currentRunHoney += 1`
  - `incrementCombo(tileId)`
  - `spawnFlowerFlyEffect(tileId)`
- 一旦花格已在之前轮次被 reveal，后续再次进入只会走状态文案分支，不再给花蜜

### 已执行修复
- 将 flower 的收益逻辑恢复为“进入 flower 格就加 1”，不再依赖 `!wasRevealed`
- 已 reveal 的 flower 格再次进入时，也会正常触发：
  - 花蜜累加
  - Combo
  - 飞花归集动画
- 文案同步改为区分“首次采到”和“再次采到”

### 本轮改了哪些文件
- `app.js`
- `B-FIX.md`

### 最小验证
- `node --check app.js` 通过
- 代码级确认：`flower` 分支不再受 `!wasRevealed` 限制，跨轮次再次进入已翻开的花格也会增加本轮暂存花蜜

## 给 B-COD 的提醒
- 不要继续在 `.tile__inner` 上叠加旧占位风格描边
- 不要再用 `background` 简写覆盖贴图
- 如果后续要对齐第二张效果图，资源替换和盘面布局应拆成两个改动，避免重复返工
