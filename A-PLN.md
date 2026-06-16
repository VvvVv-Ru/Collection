# A-PLN 记录

## 项目文档现状
- 项目路径：`/Users/vvvvv/Desktop/个人项目/Collection`
- 已存在：`B-COD.md`、`B-FIX.md`
- 当前缺失：`A-PLN.md`（本轮新建）、`A-SRC.md`、`A-ASK.md`、`C-EYE.md`、`C-EDU.md`

## NotebookLM 前置结论
- 已询问 NotebookLM：希望获取“把小花格子从单张图改为 `tile-empty.png + flower_01.png` 双层叠加、且不改玩法/数据结构”的项目级建议。
- 结果：当前 notebook 只有通用 HTML5 UI 资料，回答持续偏题，未能提供可靠项目结论。
- 已继续追问缺失资料；NotebookLM 仍未返回有效、贴合当前项目的资料清单。
- 因此本轮计划以**项目内现有代码与文档**为准，不把 notebook 回答当作实施依据。

## 本轮任务定义
- 任务 ID：`A-PLN-ART-TILE-FLOWER-01`
- 目标：将当前 `flower` 格子的显示资源从单张 `tile-flower.png` 改为双层拼装：
  - 底图：`assets/tiles/tile-empty.png`
  - 前景：`assets/tiles/flower_01.png`
- 边界：
  - 不改玩法逻辑
  - 不改 `tileState.type` / `tileTypeCounts` / 随机分布
  - 不改交互判定、路径、数值、音效链路
  - 只改资源呈现方式与相关最小样式

## 已确认的项目内现状
- `app.js:35-40`
  - 当前 `tileAssetMap.flower = "./assets/tiles/tile-flower.png"`
- `app.js:1400-1402`
  - `getTileAsset()` 仍按单张图返回资源路径
- `app.js:1493-1575`
  - `createTileElement()` 当前通过单个 `<img class="tile__image">` 渲染格子图
- `style.css:398-405`
  - `.tile__image` 已是统一图片节点入口，适合扩展为“底图 + 前景”双图层
- 资源目录现状：
  - 已存在 `assets/tiles/tile-empty.png`
  - 已存在 `assets/tiles/tile-flower.png`
  - 已存在 `assets/tiles/flower_01.png`
- 结论：
  - 当前 `flower_01.png` 已入库但未接入显示
  - 本次最小改法应集中在 `createTileElement()` + 对应 CSS，不必改数据结构

## 主框架任务（先做）
### 模块 M1：小花格子显示改为双层拼装
- 负责人类型：`@B-COD`
- 主导权：仅 `@B-COD`
- 依赖：无
- 实施建议：
  1. 保留 `flower` 作为逻辑类型，不改 `tileAssetMap` 的其它类型
  2. 在 `createTileElement()` 中，对 `revealed && state.type === "flower"` 走单独渲染分支
  3. 输出结构建议：
     - `<img class="tile__image tile__image--base" src="./assets/tiles/tile-empty.png">`
     - `<img class="tile__image tile__image--flower" src="./assets/tiles/flower_01.png">`
  4. 非 `flower` 类型继续沿用当前单图渲染链路
- 完成判定：
  - 花格只在显示层改为双图叠加
  - `empty / hidden / enemy` 显示不回归
  - `flower` 的逻辑行为与当前一致
- 是否需要人工检查：是

## 跟进模块（M1 后做）
### 模块 M2：视觉回归与最小样式校正
- 负责人类型：`@B-FIX`
- 主导权：仅 `@B-FIX`
- 依赖：M1 完成后再接
- 检查点：
  - `flower_01.png` 是否居中
  - 是否因透明留白导致视觉偏上/偏下
  - 与 `tile-empty.png` 叠加后是否出现白边、拉伸、锯齿
  - 翻牌态 `tile--flipping` 前后两面是否都正确显示花层
- 完成判定：
  - 人眼对比下，小花格子稳定显示为“草地 + 花”
  - 不出现 hover/path/start/fail 等状态把花层遮掉的情况
- 是否需要人工检查：是

## 不在本轮范围内
- 删除 `tile-flower.png`
- 改动地图布局、镜头留白、危险数字样式
- 新增动画、粒子、额外反馈
- 改 atlas / 改资源打包策略

## 建议实现口径
- 优先最小改动，不新增新的逻辑 type
- 若要避免硬编码，可新增常量：
  - `const flowerOverlayAsset = "./assets/tiles/flower_01.png";`
- 若翻牌正反面都需要支持双层，建议把“花格 inner HTML”抽成小函数，避免正面/背面模板重复改漏

## 验收标准
1. 调试模式或正常游玩时，所有 `flower` 格都显示为：草地底图 + 小花前景
2. `empty` 格仍只显示 `tile-empty.png`
3. 进入 `flower` 格仍正常加花蜜、触发现有飞花/Combo/音效
4. `node --check app.js` 通过
5. 浏览器人工检查通过以下场景：
   - 普通 revealed 花格
   - 翻牌中的花格前后面
   - 路径高亮中的花格
   - 调试模式下多花格并列显示

## 当前阶段 handoff
- 任务 ID：`A-PLN-ART-TILE-FLOWER-01`
- 目标：把 `flower` 格从单张 `tile-flower.png` 改为 `tile-empty.png + flower_01.png` 双层显示
- 当前状态：已完成项目内定位与拆解，等待 `@B-COD` 实施
- 下一步：
  1. `@B-COD` 先改 `app.js` / `style.css`
  2. 自检 `node --check app.js`
  3. 回流 `@B-FIX` 做视觉回归
- 阻塞：
  - NotebookLM 当前无项目专属资料，无法给出 notebook-grounded 建议
  - 仍需浏览器人工查看 `flower_01.png` 的最终叠放位置是否符合预期

---

## 新增需求草案（资源命名 + 地块定义）
- 任务 ID：`A-PLN-TILE-TYPES-EXPAND-01`
- 目标：在现有 `enemy / flower / empty` 基础上，规划新增地块资源与规则定义
- 注意：这一轮已超出“仅替换小花显示资源”的范围，属于**新增地块类型与收益规则**

### 建议命名规则
- 延续当前项目的“小写 + 下划线 + 序号”风格
- 底图继续统一复用：`tile-empty.png`
- 前景切图统一建议：`<主体>_<阶段可选>_<序号>.png`
- 若后续存在阶段态（开花 / 结果 / 采空），优先把“阶段”写进文件名，避免未来重命名

### 本轮建议切图命名
1. 蜜蜂地块
   - 建议前景名：`bee_01.png`
   - 若后续会出现更多样式：`bee_02.png`、`bee_03.png`

2. 苹果果树地块（当前默认开花阶段）
   - 建议前景名：`apple_tree_blossom_01.png`
   - 若未来有结果阶段：`apple_tree_fruit_01.png`
   - 若未来有采空/枯萎阶段：`apple_tree_empty_01.png` 或 `apple_tree_harvested_01.png`

3. 橘子果树地块（当前默认开花阶段）
   - 建议前景名：`orange_tree_blossom_01.png`
   - 若未来有结果阶段：`orange_tree_fruit_01.png`
   - 若未来有采空/枯萎阶段：`orange_tree_empty_01.png` 或 `orange_tree_harvested_01.png`

4. 郁金香地块
   - 建议前景名：`tulip_01.png`
   - 若未来需要颜色区分：`tulip_red_01.png`、`tulip_yellow_01.png`

### 本轮需求整理
#### R1：蜜蜂地块
- 说明：玩家经过同一个蜜蜂地块累计 3 次后，获得 1 只蜜蜂
- 已确认：
  - “经过三次”为跨回合累计
  - 领奖后该地块计数清零，且可再次累计
  - 是否需要可视化计数状态（1/3、2/3、3/3）暂未确认

#### R2：苹果果树地块
- 说明：未解锁地块在被解锁后，若其类型为苹果果树，则默认处于“开花阶段”
- 采集收益：获得 3 朵花蜜
- 状态循环（passby-20260615 修订）：`blossom → fruit → harvested → blossom`，每次玩家"经过一次"即推进一档，与回合数无关
- 收益规则：仅 `blossom` 被经过时给 +3 花蜜；`fruit / harvested` 经过不得分但仍推进状态
- 资源建议：底图 `tile-empty.png` + 前景 `apple_tree_blossom_01.png`

#### R3：橘子果树地块
- 说明：未解锁地块在被解锁后，若其类型为橘子果树，则默认处于“开花阶段”
- 采集收益：获得 4 朵花蜜
- 资源建议：底图 `tile-empty.png` + 前景 `orange_tree_blossom_01.png`

#### R4：郁金香地块
- 说明：采集即可获得 2 朵花蜜
- 资源建议：底图 `tile-empty.png` + 前景 `tulip_01.png`

### 对当前代码的影响边界（预判）
- 不再只是资源替换，后续会涉及：
  1. `tileState.type` 扩容
  2. `tileTypeCounts` / 随机分布策略调整
  3. 各类型收益表与触发规则拆分
  4. 调试面板、文案、可视化映射同步更新
- 因此本轮先把**命名规范 + 需求定义**定下来，再交 `@B-COD` 进入正式开发拆解更稳妥

### 当前阶段 handoff（新增需求）
- 任务 ID：`A-PLN-TILE-TYPES-EXPAND-01`
- 目标：确定新增地块的命名与规则口径
- 当前状态：需求已收口；蜜蜂地块规则已确认为“跨回合累计 3 次后奖励 1 只蜜蜂，奖励后计数清零并可再次累计”
- 下一步：
  1. `@A-PLN` 输出正式开发任务卡
  2. `@B-COD` 按确认后的规则扩展类型与收益逻辑
  3. `@B-FIX` 做规则与显示回归
- 阻塞：
  - 苹果/橘子果树后续是否存在“开花 -> 结果 -> 采空”多阶段，当前尚未锁定

## 正式需求口径（已确认）
- 任务 ID：`A-PLN-TILE-TYPES-EXPAND-01`
- 总目标：在现有棋盘中新增 4 类地块，并统一资源命名与收益规则

### 已确认规则
1. 蜜蜂地块
   - 类型建议：`bee`
   - 前景切图：`bee_01.png`
   - 规则：玩家累计经过同一个蜜蜂地块 3 次（跨回合累计）后，奖励 1 只蜜蜂
   - 已确认：奖励发放后该地块计数清零，并可再次累计

2. 苹果果树地块
   - 类型建议：`apple_tree`
   - 前景切图：`apple_tree_blossom_01.png`
   - 状态切图：`apple_tree_blossom_01.png` / `apple_tree_fruit_01.png` / `apple_tree_harvested_01.png`
   - 规则（passby-20260615 修订）：未解锁时不暴露；解锁后默认 `blossom`；每次玩家"经过一次"即在松手成功结算瞬间推进一档，循环 `blossom → fruit → harvested → blossom`；仅 `blossom` 经过时获得 3 朵花蜜，`fruit / harvested` 经过不得分；同一轮重复经过同一棵仅推进一档；本轮撞天敌失败则被路过的苹果树不推进；底图始终复用 `tile-empty.png`

3. 橘子果树地块
   - 类型建议：`orange_tree`
   - 前景切图：`orange_tree_blossom_01.png`
   - 规则：未解锁时不暴露；解锁后默认处于开花阶段；采集可获得 4 朵花蜜

4. 郁金香地块
   - 类型建议：`tulip`
   - 前景切图：`tulip_01.png`
   - 规则：采集可获得 2 朵花蜜

### 建议实现阶段
#### 模块 N1：类型与资源映射扩容
- 负责人类型：`@B-COD`
- 依赖：无
- 内容：
  - 扩展地块类型枚举与资源映射
  - 保持底图统一复用 `tile-empty.png`
  - 按类型挂接前景图：`bee_01 / apple_tree_blossom_01 / orange_tree_blossom_01 / tulip_01`
- 验收：调试模式下能稳定显示 4 类新地块

#### 模块 N2：收益与计数规则接入
- 负责人类型：`@B-COD`
- 依赖：N1 完成后
- 内容：
  - 郁金香：+2 花蜜
  - 苹果果树：+3 花蜜
  - 橘子果树：+4 花蜜
  - 蜜蜂地块：为每个 tile 维护跨回合经过计数，满 3 次奖励 1 蜜蜂，随后该 tile 计数清零并可再次累计
- 验收：各类型结算值正确；蜜蜂计数跨回合生效；奖励后重置正确

#### 模块 N3：回归与人工检查
- 负责人类型：`@B-FIX`
- 依赖：N2 完成后
- 内容：
  - 检查解锁前隐藏、解锁后显示、采集后收益、计数重置/保留是否符合规则
  - 检查新前景图与路径高亮、翻牌动画、失败态不冲突
- 验收：规则与视觉均通过人工回归

## 给 @B-COD 的单独任务卡（苹果果树地块）
- 任务 ID：`B-COD-APPLE-TREE-01`
- 目标：先单独接入“苹果果树地块”，不一次性展开其它新地块

### 目标规则
1. 苹果果树地块类型：`apple_tree`
2. 地块显示结构固定为两层：
   - 底图：`tile-empty.png`
   - 前景状态图：
     - `apple_tree_blossom_01.png`
     - `apple_tree_fruit_01.png`
     - `apple_tree_harvested_01.png`
3. 默认初始状态：`blossom`
4. 在 `blossom` 状态被采集时：
   - 获得 `+3 花蜜`
   - 立即切换到 `fruit`
5. 在**下一回合开始时**：
   - `fruit` 自动切换到 `harvested`

### 范围边界
- 本轮只做 `apple_tree`
- 不同步接入 `bee / orange_tree / tulip`
- 不改敌人逻辑
- 不改基础拖拽路径规则
- 不做新的美术动效，只做状态图切换

### 建议实现拆解
#### A1：类型与状态字段接入
- 在现有 tile type 体系中加入 `apple_tree`
- 为苹果果树地块补充状态字段，至少支持：`blossom / fruit / harvested`
- 保持未解锁时不暴露真实类型

#### A2：显示层接入
- 苹果果树地块显示为：`tile-empty.png + apple_tree_xxx_01.png`
- 根据状态切换前景图：
  - `blossom -> apple_tree_blossom_01.png`
  - `fruit -> apple_tree_fruit_01.png`
  - `harvested -> apple_tree_harvested_01.png`
- 其它已有地块显示逻辑不回归

#### A3：采集收益接入
- 仅当苹果果树处于 `blossom` 状态并被采集时：
  - 增加 `3` 点花蜜收益
  - 状态改为 `fruit`
- 不要把这 3 点收益错误加到 `fruit` 或 `harvested`

#### A4：回合切换状态流转
- 在“下一回合开始”的统一入口处理：
  - 所有处于 `fruit` 的苹果果树自动变为 `harvested`
- 注意只在“下一回合开始”时处理，不要在同回合内提前切换

### 验收标准
1. 调试或正常游玩中可以生成/显示 `apple_tree` 地块
2. 解锁后默认显示 `apple_tree_blossom_01.png`
3. 采集 `blossom` 时获得 `+3 花蜜`
4. 采集后立即显示 `apple_tree_fruit_01.png`
5. 到下一回合开始时，自动显示 `apple_tree_harvested_01.png`
6. `fruit` 与 `harvested` 状态不会重复给 3 花蜜
7. `node --check app.js` 通过

### 人工检查点
- `blossom / fruit / harvested` 三种图是否都居中
- 翻牌、路径高亮、失败态下前景图是否被遮挡
- 下一回合开始的切换时机是否准确

### Handoff 摘要
- 任务 ID：`B-COD-APPLE-TREE-01`
- 目标：单独接入苹果果树地块与三态流转
- 当前状态：规则已锁定，可开发
- 下一步：`@B-COD` 实现 -> 自检 -> 回流 `@B-FIX`
- 阻塞：暂无；若后续要加入“结果态收益”或“采空后再生长”，再开新卡

---

## 任务卡：结算延迟到松手 + 飞币归集序列

- 任务 ID：`A-PLN-SETTLE-SEQUENCE-01`
- 目标：把“拖动到得分格立即结算花蜜”改为“松手后按路径顺序逐格触发飞币归集 + 小跳”

### 规则口径（已与用户拍板）
1. 拖动期：
   - 进入花格 / 苹果 blossom / 苹果 harvested 时只“记账”，写入 `pendingScoreList`
   - 不立即加 `currentRunHoney`，不放飞花，不改 `pendingFruit / pendingReBloom`
   - HUD `本轮暂存` 拖动中恒为 `0`
   - `statusText` 统一显示 `"采集中：已走 N 格"`
   - Combo 拖动中仍即时累加（不动现状）
2. 松手成功结算：
   - 按 `pendingScoreList` 的顺序（= 玩家拖动路径顺序）逐个触发：
     - 该格 `-8px / 220ms` 小跳
     - 飞花从该格弧线到 HUD（flower 1 朵，苹果 blossom 同格连发 3 朵，错峰 80ms）
     - 每朵飞花落地时 HUD `本轮暂存` `+1`
   - 相邻条目之间间隔 `160ms`
   - 全部飞花落地后再统一：
     - 提交 `pendingFruit / pendingReBloom` 副作用
     - `totalHoney` 入账
     - `totalHoneyPulse / startPulse / toast` 走原成功反馈链路
     - 判定通关 / `game-over`
3. `harvested` 单独路过：
   - 不跳、不发飞花，但仍 `pendingReBloom = true`（用于下一回合重新开花）
   - 若整轮只采到 harvested（无花蜜），直接走“静默提交副作用”分支，不播序列
4. 失败链路：
   - 撞天敌 / 任何 outcome=failure
   - 一律 `pendingScoreList = []`、所有 pending 副作用作废
5. 锁定态：
   - 序列播放期间任何 `pointerdown / beginRun` 静默忽略
   - 不弹 toast、不闪格子
6. 配置参数（首版）：
   - `staggerMs = 160`
   - `intraTileGapMs = 80`
   - `bounceHeightPx = 8`
   - `bounceDurationMs = 220`
   - `waitFlightsTailMs = 120`

### 范围边界
- 不接入新地块类型
- 不动失败反馈（红闪 / 抖动 / 失败 toast）
- 不动 BGM / 自定义光标
- Combo 暂不改造（先体验）

### 验收标准
1. 拖动过 2 花 + 1 苹果 blossom：HUD 暂存全程显示 0；松手后按"花 → 苹果"顺序逐格跳；2 朵 + 3 朵共 5 朵飞花到达 HUD 后总花蜜 `+5`
2. 拖动中撞天敌：花蜜不入账；下一回合苹果 blossom 仍是 blossom（未消耗）
3. 单独路过 harvested：松手不播序列；下一回合该苹果变 blossom
4. 序列播放期间反复点击其它格：完全无反馈
5. `node --check app.js` 通过

### Handoff
- 任务 ID：`A-PLN-SETTLE-SEQUENCE-01`
- 当前状态：规则已锁定，已交 `@B-COD` 落地
- 下一步：`@B-COD` 实现 -> 实机回归 -> 必要时由 `@B-FIX` 微调手感参数

---

## 任务卡：一笔画路径轨迹（A-PLN-PATH-TRAIL-01）

- 任务 ID：`A-PLN-PATH-TRAIL-01`
- 目标：在棋盘上叠加白色一笔画轨迹，让玩家清楚看到本轮走过的路径与方向

### 已确认口径
- 主色：白色 + 半透明（柔光 + 主笔触 + 流光虚线 + 笔尖呼吸圆）
- 形态：直线段 polyline 连接（不做曲线平滑）
- 退场：成功结算飞币全部归集后再淡出（接 `A-PLN-SETTLE-SEQUENCE-01` 尾巴）
- 失败：撞天敌时轨迹变红 + 与棋盘红闪同步淡出
- 单格（仅起点未拖动）：只显示笔尖呼吸圆，不画连接线
- SVG 层 `pointer-events: none`、位于 tile 之下，不遮挡花/树/敌人/危险数字

### 实施摘要（已交 @B-COD 完成）
- 见 `B-COD.md` 中 `B-COD-PATH-TRAIL-01`

### 验收
1. 拖动 ≥2 格：起点→当前格出现白色一笔画，流光动画 + 笔尖呼吸圆在当前格
2. 仅按下起点未拖动：只显示笔尖呼吸圆
3. 成功结算：飞币序列正常，轨迹保留到最后一朵归集后淡出
4. 撞天敌：轨迹变红 + 与棋盘红闪同步消失
5. 轨迹始终在 tile 之下
6. `node --check app.js` 通过

### Handoff
- 当前状态：已落地，等 `@B-FIX` 实机回归
- 下一步：浏览器人工检查上述 5 个验收点

---

## 任务卡：小白花两阶段（A-PLN-FLOWER-STAGES-01）

- 任务 ID：`A-PLN-FLOWER-STAGES-01`
- 目标：小白花地块新增 `bloom / sprout` 两阶段流转，模仿苹果树状态机

### 已确认口径
- 命名规范：方案 2（统一前缀 + 阶段名）
  - `assets/tiles/flower_bloom_01.png`（开花，原 `flower_01.png` 改名）
  - `assets/tiles/flower_sprout_01.png`（嫩芽，新增）
- 默认初始阶段：新解锁的 flower 默认 `bloom`
- 收益：
  - `bloom` 被采集 → +1 花蜜（沿用旧值），触发 Combo + 小跳 + 1 朵飞花
  - `sprout` 被采集 → +0 花蜜，不触发 Combo / 小跳 / 飞花
- 阶段切换时机：和苹果树一致 —— 在结算动画结束（`commitPendingSideEffects`）时统一推进
  - 被采集的 `bloom` → 结算后变 `sprout`
  - 被采集的 `sprout` → 结算后变 `bloom`
- 失败（撞天敌）：本轮所有 `pendingScoreList` 作废，阶段不推进
- 同一格在同一次拖动中重复经过：沿用 `alreadyInPendingScore` 去重，不重复加分也不重复推进

### 实施摘要（已交 @B-COD 完成）
- 见 `B-COD.md` 中 `B-COD-FLOWER-STAGES-01`

### 验收
1. 新游戏开局所有 flower 都显示 `flower_bloom_01.png`
2. 采集一朵 bloom → 飞币序列结束后该格显示 `flower_sprout_01.png`
3. 第二轮再采集同一格 sprout → 不出飞币、不计 Combo、结算后该格回到 `flower_bloom_01.png`
4. 撞天敌：当轮所有路过的 flower 阶段保持不变
5. `node --check app.js` 通过

---

## 任务卡：结算节奏与阶段切换同步（A-PLN-SETTLE-STAGE-SYNC-01）

- 任务 ID：`A-PLN-SETTLE-STAGE-SYNC-01`
- 目标：让格子小跳与该格阶段图切换在视觉上同步，而不是所有阶段最后一次性切

### 已确认口径
- 视觉时机：A2 —— 小跳到最高点（约 `bounceDurationMs / 2 ≈ 110ms`）瞬间切换该格阶段图
- amount=0 条目（sprout / harvested 路过）：C1 —— 在 `tick()` 跳过它们时同步即时 commit 阶段，不出小跳、不出飞花
- sprout 不补孤立空跳，保持序列只跳"有花蜜的格"
- harvested-only 早返回分支（不进飞币序列）保持原 `commitPendingSideEffects` 一把推进
- 失败分支不变：`pendingScoreList = []`，阶段不推进

### 实施摘要
- 见 `B-COD.md` `B-COD-SETTLE-STAGE-SYNC-01`

### 验收
1. bloom 花：飞币离开同时该格跳到顶点变 sprout
2. 苹果 blossom（amount=3）：跳到顶点变 fruit，剩余 2 朵飞花继续从该格飞出
3. 拖动序列里夹一格 sprout：无跳无飞花，但视觉上仍按序列顺序变回 bloom
4. 撞天敌：阶段保持不变
5. 仅 harvested 路过：捷径分支正常切换
6. `node --check app.js` 通过

---

## 任务卡：sprout / harvested 静默小跳（A-PLN-SPROUT-BOUNCE-01）

- 任务 ID：`A-PLN-SPROUT-BOUNCE-01`
- 目标：sprout 采集与苹果 harvested 路过时仍走"小跳 + 顶点切图"反馈，但不出飞花、不入花蜜

### 已确认口径
- 适用范围：sprout 采集（flower）、苹果 fruit 路过、苹果 harvested 路过——所有 amount=0 且引发阶段切换的条目统一标记 `silentBounce: true`
- 视觉：跳起 → 顶点切换阶段图，节奏与 amount>0 条目一致，消耗一个 `staggerMs` 槽位
- 不出 +0 浮字
- 不出飞花
- harvested-only 早返回分支：若包含 silentBounce 条目，改为走 `playRunSettlementSequence`（保留小跳节奏），否则继续走原即时 commit 捷径
- 失败分支不变

### 实施摘要
- 见 `B-COD.md` `B-COD-SPROUT-BOUNCE-01`

### 验收
1. 拖动 = bloom A → sprout B → 苹果 blossom C：A 跳变 sprout、B 跳变 bloom（无飞花、无 +0）、C 跳变 fruit + 3 朵飞花
2. 单独拖一条全是 sprout / harvested：全程节奏均匀小跳，每格切下一阶段，不出花蜜
3. 撞天敌：阶段不变、不跳
4. `node --check app.js` 通过

---

## 任务卡：新增郁金香地块（A-PLN-TULIP-01）

- 任务 ID：`A-PLN-TULIP-01`
- 目标：在棋盘上新增 `tulip` 类型地块，采集即 +2 花蜜

### 已确认口径
- 类型：`tulip`，前景图 `assets/tiles/tulip_01.png`，底图复用 `tile-empty.png`
- 收益：采集 +2 花蜜，参与 Combo / 小跳 / 飞花序列（2 朵）
- 无阶段流转（不像 flower 或 apple_tree）
- 花蜜分桶：仅累加到 `totalHoney`，不进 `flowerHoney` 也不进 `appleHoney`（与小白花 / 苹果花的通关目标解耦）
- 棋盘分布：`tileTypeRatioBaseCounts` 调整为 `{ enemy:3, flower:9, apple_tree:1, tulip:2, empty:4 }`，总数 19 不变（empty 9→4）
- 起点 T18 仍不允许是 enemy；tulip 与其它 safe 类型共享 safe 候选池

### 实施摘要
- 见 `B-COD.md` `B-COD-TULIP-01`

### 验收
1. 调试开局可看到 2 个郁金香地块（资源 `tulip_01.png`）
2. 拖动到郁金香格：小跳 + 顶点不切图（无阶段流转）+ 2 朵飞花飞向 HUD
3. 撞天敌：郁金香 amount 作废
4. 通关条件未改（仍需小白花 12 + 苹果花 2），郁金香花蜜仅记入 totalHoney
5. `node --check app.js` 通过

---

## 任务卡：通关条件加入郁金香（A-PLN-WIN-TULIP-01）

- 任务 ID：`A-PLN-WIN-TULIP-01`
- 目标：通关条件由"小白花 12 + 苹果花 2"扩展为"小白花 12 + 苹果花 2 + 郁金香 4"

### 已确认口径
- `goalTargets = { flower: 12, apple: 2, tulip: 4 }`
- `gameState` 新增 `tulipHoney`，结算时郁金香条目 (`entry.type === "tulip"`) 累加进 `tulipHoney`，仍同时计入 `totalHoney`
- 胜负判定：三桶都达标才通关
- HUD / 结束面板 / 通关面板 / game-over 状态文本统一新增 `· 郁金香 X/4`

### 验收
1. HUD 显示 `小白花 X/12 · 苹果花 Y/2 · 郁金香 Z/4`
2. 只达成 flower+apple 但 tulip 不足：不算通关
3. 三桶都达成：通关、win 面板含 `郁金香 X/4`
4. 蜜蜂耗尽未通关：game-over 文案三桶齐显
5. `node --check app.js` 通过

---

## 任务卡：郁金香两阶段（A-PLN-TULIP-STAGES-01）

- 任务 ID：`A-PLN-TULIP-STAGES-01`
- 目标：郁金香新增 bloom / sprout 两阶段流转，参照小白花机制

### 已确认口径
- 资源：`tulip_bloom_01.png` / `tulip_sprout_01.png`，旧 `tulip_01.png` 保留不再引用
- 默认初始阶段：bloom
- bloom 采集：+2 花蜜、Combo + 小跳 + 2 朵飞花、计入 `tulipHoney`，副作用 `advance-tulip-to-sprout`
- sprout 采集：0 花蜜、不 Combo、silentBounce 小跳 + 顶点切图、副作用 `advance-tulip-to-bloom`
- 撞天敌：pendingScoreList 作废，阶段不变
- 通关条件不变：`flowerHoney≥12 && appleHoney≥2 && tulipHoney≥4`
- 通关 `tulipHoney` 累计仅来自 bloom 阶段采集
- CSS：首版 sprout 复用 bloom 位置，实机若不对再加 `.tile__image--tulip-sprout` 微调

### 验收
1. 开局所有 tulip 显示 `tulip_bloom_01.png`
2. 采集 bloom：跳 + 顶点切 sprout 图 + 2 朵飞花，`tulipHoney += 2`
3. 下一轮采该格 sprout：silentBounce 跳 + 顶点切回 bloom，无花蜜、无 Combo、无飞花
4. 撞天敌：阶段不变
5. `node --check app.js` 通过

---

## 任务卡：关卡体系（A-PLN-LEVEL-DESIGN-FINAL）

- 任务 ID：`A-PLN-LEVEL-DESIGN-FINAL`
- 目标：把单关游戏改造为 12 关曲线（三章 × 4 关 + 2 个 rest 关），数据驱动 + Kishōtenketsu × 过山车节奏。
- 来源：NotebookLM 关卡设计理论（4C / Kishōtenketsu / 过山车曲线 / 显隐性变量 / "压力下学不会" / "估 8 实际 24"）+ 当前代码现状。

### 已锁口径
- Q1 = A：apple blossom `amount = 1`
- Q2 = A：盘面按关伸缩，`layoutRows / rowTileIds / rowSlots / startTileId` 降级为关字段
- Q3 = A：撞鸟惩罚保持现状（pendingScoreList 清空、蜜蜂 -1、阶段不回退）
- 关卡数：12 关；rest 关插入 L5 / L9（不在 L12 后再加 L13）
- LV-2：必做（BFS 排除）
- intro toast 时机：关卡载入即弹（沿用 `showToast`）
- NotebookLM：不再追问

### 12 关曲线（v3：前 3 关 mini 盘 + L1 零敌人 + 每关只引入一个新东西）
| 关 | 章 | Kishō | 节奏 | 唯一新东西 | 盘面 | 蜜蜂 | enemy/flower/apple/tulip/empty | 目标 F/A/T | enemy 密度 | enemyPlacementRule |
|---|---|---|---|---|---|---|---|---|---|---|
| L1 | 1 | Introduce | valley | 学拖动 | **7** | 6 | 0/5/0/0/2 | 4/0/0 | 0% | default |
| L2 | 1 | Train | valley→rise | 首次见鸟 | **9** | 6 | 1/6/0/0/2 | 4/0/0 | 11.1% | exclude-shortest-safe-path |
| L3 | 1 | Twist | rise | 苹果树三态 | **11** | 6 | 1/7/1/0/2 | 5/1/0 | 9.1% | exclude-shortest-safe-path |
| L4 | 1 | Conclude | peak | 第 1 章综合 | 16 | 6 | 3/9/2/0/2 | 10/1/0 | 18.8% | default |
| L5 | rest | Rest | rest | 回血关 | 13 | 8 | 0/10/0/0/3 | 6/0/0 | 0% | default |
| L6 | 2 | Introduce | valley | 郁金香 +2 | 16 | 7 | 1/10/0/2/3 | 8/0/2 | 6.3% | exclude-shortest-safe-path |
| L7 | 2 | Train | rise | 19 格大盘 + 郁金香田 | 19 | 6 | 2/10/0/4/3 | 10/0/3 | 10.5% | default |
| L8 | 2 | Twist+Conclude | rise→peak | 三花同台 | 19 | 5 | 3/9/2/3/2 | 11/1/3 | 15.8% | default |
| L9 | rest | Rest | rest | 郁金香 × 回血 | 16 | 8 | 0/7/0/6/3 | 5/0/4 | 0% | default |
| L10 | 3 | Introduce | valley→rise | 22 格大盘 | 22 | 7 | 3/11/1/3/4 | 11/1/3 | 13.6% | exclude-shortest-safe-path |
| L11 | 3 | Train+Twist | rise→peak | 苹果翻倍 + 鸟群加密 | 22 | 6 | 4/10/2/3/3 | 12/2/4 | 18.2% | default |
| L12 | 3 | Conclude | valley→peak | 心流打破 · 远端聚集 | 22 | 5 | 5/10/2/3/2 | 14/2/5 | 22.7% | far-from-start-then-cluster |

设计原则（v2 校准）：
1. **每关有且只有一个 "新东西"**（4C Hooks 强约束）：拖动 → 鸟 → 苹果 → 综合 → 回血 → 郁金香 → 大盘 → 三花 → 回血 → 22 格 → 翻倍 → 终局。
2. **L1 零敌人**：移除"学撞鸟"放到 L2，让 L1 唯一焦点是"按住—拖动—松手"的运动学习。
3. **敌人阶梯渐入**：每章鸟数从 0 / 1 / 2 / 3 起步，章节切换时回零（L5、L9），避免线性堆叠造成疲劳。
4. **教学关全部走 `exclude-shortest-safe-path`**：L2 / L3 / L6 / L10 起点周边 2 步内绝无敌人。
5. **rest 关蜜蜂回满（8）+ 0 敌人**：彻底"送爽"，对应宪法第 3 条波谷。

### 落地实现摘要（已完成）
- LV-1 `app.js`：顶层常量降级为 `let`，新增 `levelConfigs[]`、`currentLevelIndex`、`applyLevelConfig(idx)`；4 套盘面拓扑 `LAYOUT_13/16/19/22`（13/16/22 经 BFS 验证起点至少 3 邻居、所有 tile 从 start 可达）
- LV-2 新增 `bfsDistancesFromStart()` + `pickEnemyTileIds()`，支持 `default` / `exclude-shortest-safe-path`（SAFE_RADIUS=2）/ `far-from-start-then-cluster`
- LV-3 新增 `showLevelIntroToast()`，沿用 `showToast` 链路，在 `restartGame` 末尾触发
- LV-4 `dom.restartWinButton` 文案随关切换；末关 → "再来一遍"、非末关 → "下一关"；handler 区分 game-over（本关）vs win（下一关）
- LV-5 通关/失败时 `logEvent("level-result", {...})`
- LV-6 自检脚本：12 关全部 reachable === tiles.length、起点邻居 ≥ 3、起点非 enemy、L1/L2/L5/L9 enemy 不在 SAFE_RADIUS 内；L12 enemy 平均距离 ≥ 4.4

### Debug 入口
- `window.demoBoard.levelConfigs` 查看全部关卡
- `window.demoBoard.currentLevel` 当前关
- `window.demoBoard.gotoLevel(idx)` 强切关（0~11）

### 已知边界
- 关卡未做 localStorage 持久化，刷新即回 L1（本轮范围外）
- L12 "前 3 步无敌人" 的剧本化心流打破：当前仅用"远端聚集"实现，不动态等"第 4 步触发"
- 蜜蜂/橘子树等新地块未接入
- 上线后需用 `logEvent("level-result")` 数据校准 `designerNotes.expectedRunsToWin`，对应 notebook 第 6 条"估 8 实际 24"

### Handoff
- 当前状态：已落地，等 `@B-FIX` 实机回归
- 下一步：浏览器人工跑 L1 → L12，确认 intro toast、盘面伸缩、win 面板"下一关"按钮、撞鸟反馈、tile 拓扑显示正常

---

## 任务卡：新增蜜蜂地块（A-PLN-BEE-01）

- 任务 ID：`A-PLN-BEE-01`
- 目标：在棋盘上新增 `bee` 类型地块，玩家累计经过 2 次即获得 1 只蜜蜂

### 已确认口径（与用户拍板）

#### 命名（由用户指定）
- 类型：`bee`
- 切图（用户提供，共 3 张）：
  - `assets/tiles/bee_01.png` — 未采集（默认态，`passCount = 0`）
  - `assets/tiles/bee_02.png` — 已采集 1 次（`passCount = 1`）
  - `assets/tiles/bee_03.png` — 第 2 次松手结算瞬间的"出蜂"态
- 飞蜜蜂动画素材：`assets/ui/cursor/cursor-default.png`（复用已有资源）
- 资源映射建议：
  ```js
  const beeStageAssetMap = {
    stage0: "./assets/tiles/bee_01.png",
    stage1: "./assets/tiles/bee_02.png",
    stage2: "./assets/tiles/bee_03.png",
  };
  const flyBeeAsset = "./assets/ui/cursor/cursor-default.png";
  ```

#### 规则
1. 累计阈值：同一块 bee 累计经过 2 次（跨回合累计）→ 奖励 1 只蜜蜂（`gameState.remainingBees += 1`）
2. 计数模型：每块 bee 独立 `passCount: 0 | 1`；同轮重复经过同一格去重（沿用 `alreadyInPendingScore`，只算 1 次）
3. 第 1 次松手成功结算：
   - 该格在飞币序列对应槽位 silentBounce 小跳 + 顶点切到 `bee_02`
   - 无飞物、`remainingBees` 不变、不进 combo
4. 第 2 次松手成功结算（视觉时序 = Q2 推荐 A）：
   - 该格 silentBounce 跳到顶点瞬间切到 `bee_03`
   - 同帧从该格发射飞蜜蜂图标（`cursor-default.png`）走飞币归集弧线 → HUD 蜜蜂计数器 `dom.beeCounterIcon`
   - 飞物飞行期间该格保持 `bee_03`
   - 飞物落地瞬间：`remainingBees += 1` + 计数器 pulse + 该格切回 `bee_01` + `passCount = 0`（可再次累计，Q1 = A）
5. 撞鸟失败：pendingScoreList 作废即可，`passCount` 不推进（与 apple_tree pendingFruit 同套 rollback；passCount 本就在 commit 阶段才推进）
6. 不进 `goalTargets` / `flowerHoney` / `appleHoney` / `tulipHoney` / `totalHoney`
7. 不参与 Combo
8. `isSafeTileType` 包含 bee（起点允许是 bee，enemy 不与之重叠）
9. `remainingBees` 不封顶（Q4 = B），可超 `initialBeeCount` 储蓄
10. 跨关重启：棋盘重生成天然归零

#### 关卡引入节奏（Q5 = A）
| 关 | bee 数 | 说明 |
|---|---|---|
| L1–L4 | 0 | 第 1 章不引入 |
| **L5（rest）** | **1** | 首次引入，rest 关"回血"主题契合 |
| L6–L8 | 0 | 本章核心是郁金香 |
| **L9（rest）** | **1** | 再放 1 个 |
| L10–L12 | 0（待定） | 默认 0；视实机难度可补 |

- 对应关卡 `tileTypeRatioBaseCounts`：`empty - 1`、`bee + 1`，总 tile 数不变

### 代码改动面（B-COD 参考）

| 触点 | 改动 |
|---|---|
| `tileTypeOrder`（app.js line 2） | 加 `"bee"`，建议放 `"tulip"` 后、`"empty"` 前 |
| `tileAssetMap`（line 281） | 加 `bee: "./assets/tiles/tile-empty.png"`（fallback 底图） |
| 新增 `beeStageAssetMap` | 见上 |
| 新增 `flyBeeAsset` 常量 | 见上 |
| 12 关 `levelConfigs` | 全部加 `bee:` 字段；L5 / L9 设 1，其余 0；L5 / L9 同步 `empty - 1` |
| 默认全局 `tileTypeRatioBaseCounts`（line 254） | 加 `bee: 0` |
| `applyTileTypes`（line 597 区段） | 加 bee 候选池分配（参考 tulipCandidates 段，从 safeCandidates 中再切出 beeIds） |
| `summary` 检查（line 654） | 加 bee 数量校验 |
| `isSafeTileType`（line 1837） | 加 `\|\| type === "bee"` |
| `tileState` 初始化 | bee 格初始 `passCount: 0` |
| `getTileVisualMarkup`（line 2061 区段） | 加 `type === "bee"` 双层结构分支：底图 `tile-empty.png` + 前景按 `passCount` 取 `bee_01 / bee_02`；`bee_03` 仅在 silentBounce 顶点切图时由序列层临时切换 |
| `evaluateRunResult` 入路径记账（line 3389 区段） | bee 条目入 `pendingScoreList`：`amount: 0`、`silentBounce: true`、`sideEffect: "advance-bee-pass"`、`willReward: (passCount + 1 >= 2)` |
| `commitPendingEntry`（line 2888 区段） | 处理 `advance-bee-pass`：<br>• `willReward = false`：`passCount = 1`，顶点切 `bee_02`<br>• `willReward = true`：顶点切 `bee_03` + 调用 `flyBee(srcEl, dom.beeCounterIcon)`，落地回调中 `remainingBees += 1` + `beeCounterPulse` + 该格切回 `bee_01` + `passCount = 0` |
| 新增 `flyBee()` | 复用 `flyFlower` / `flyTulip` 弧线管线，素材 `cursor-default.png`，终点 `dom.beeCounterIcon` |
| CSS | 新增 `.tile__image--bee` / `.tile__image--bee-stage0/1/2`；首版三态共用一套尺寸定位（参照 tulip / apple-tree），实机不对再微调 |

### 实施拆解（建议 9 模块）

- **B1 类型与资源映射**：`tileTypeOrder` / `tileAssetMap` / `beeStageAssetMap` / `flyBeeAsset` / `isSafeTileType`
- **B2 棋盘分布**：`applyTileTypes` 加 bee 候选池；`summary` 校验
- **B3 显示层**：`getTileVisualMarkup` 加 bee 分支
- **B4 经过记账**：`evaluateRunResult` 收集 bee 条目入 `pendingScoreList`
- **B5 序列副作用**：`commitPendingEntry` 处理 `advance-bee-pass`
- **B6 飞蜜蜂动画**：新增 `flyBee()`
- **B7 关卡接入**：12 关 `levelConfigs` 加 `bee` 字段；L5 / L9 intro toast 文案
- **B8 CSS**：`.tile__image--bee` 系列
- **B9 自检**：`node --check app.js` + debug `gotoLevel(4)` / `gotoLevel(8)` 实机走 1 局

### 验收标准

1. L5 / L9 开局可见 1 个 bee 地块，默认 `bee_01.png`
2. 第 1 次拖到 bee：松手序列中该格 silentBounce 跳 + 顶点切 `bee_02`，无飞物、`remainingBees` 不变、不进 combo
3. 第 2 次拖到同一 bee：松手序列中该格 silentBounce 跳 + 顶点切 `bee_03`，同帧发射 `cursor-default.png` 弧线 → HUD 蜜蜂计数器，落地瞬间 `remainingBees += 1` + 计数器 pulse + 该格切回 `bee_01`
4. 同轮重复经过同一 bee：去重，只算 1 次
5. 撞鸟：本轮所有 bee 的 `passCount` 不推进
6. bee 不进任何花蜜桶、不进 combo、不进 `goalTargets`
7. 切关 / 重开：所有 bee 重置为 `bee_01` + `passCount = 0`
8. `remainingBees` 超过 `initialBeeCount` 时仍正确显示与扣减
9. `node --check app.js` 通过

### 范围边界

- 本轮只做 bee，不动 `orange_tree`
- 不做出蜂瞬间额外 toast、不做棋盘整体特效、不动 BGM
- 不做数字徽章
- 不做计数跨关持久化

### Handoff

- 任务 ID：`A-PLN-BEE-01`
- 当前状态：✅ 规则已锁，可开发
- 下一步：`@B-COD` 按 B1–B9 拆模块实现 → 自检 → `@B-FIX` 实机回归
- 阻塞：无

---

## 任务卡：新增青虫地块（A-PLN-CATERPILLAR-01）

- 任务 ID：`A-PLN-CATERPILLAR-01`
- 目标：在棋盘上新增 `caterpillar` 类型地块，玩家路过无影响；每回合结束时青虫会跳到相邻已翻开植被上"吃掉作物 + 自身位移"

### 已确认口径（与用户拍板）

#### 命名
- 类型：`caterpillar`
- 前景切图：`assets/tiles/insects_01.png`（用户提供）
- 底图：`assets/tiles/tile-empty.png`（双层结构，与 flower / tulip 同套路）
- 视觉文本："青虫"

#### 规则
1. 拖动经过青虫格：无收益、不进 combo、无 silentBounce、不扣蜜蜂（等同 empty）
2. 触发时机：本轮结算尾，**先青虫后小鸡**（Q9=B）
3. 候选目标：邻居中**已翻开** + type ∈ {flower, apple_tree, tulip}（Q2/Q4）
4. 选择策略：随机一个
5. 吃法：整棵植被被吃 → 目标格变 caterpillar，growthStage 清空（Q3=A）
6. 源格 → 变 empty
7. 无合法目标：原地不动，下回合继续尝试（Q6=A）
8. 多只青虫冲突：按 tileId 升序结算（Q7=A）
9. 撞鸟失败本轮：青虫仍移动（Q8=A）
10. `isSafeTileType("caterpillar") = true`（起点可、enemy 不重叠）
11. 不进 `goalTargets` / 不进任何花蜜桶 / 不参与 combo

#### 移动视觉（Q5=B 新做跳跃动画）
- 复用 `feedbackState.activeFlights` 飞行管线，flight type = `"caterpillar_jump"`
- 飞行素材：`insects_01.png`
- 轨迹：贝塞尔曲线，`arcHeight` 约 56–90px（比飞花/飞蜜蜂更低，地面感）
- 时长：560ms
- 旋转：轻微摆动 -8° → +8°
- 着陆压扁：目标 tile 加 `tile--caterpillar-squash` class，220ms `scale` 弹性收缩

#### 关卡引入（Q10=L5、Q10.1=A 1 只）
- L5（rest 关）：caterpillar=1，`empty -1`（10/0/0/0/1/1/1 = 13 = LAYOUT_13 总数）
- 其余 11 关：caterpillar=0
- ⚠️ 备注：L5 同关引入 bee + caterpillar，违反"每关只引入一个"原则；按用户选择执行
- L5 intro/hooks 文案补"青虫每回合会吃相邻植被"

### 实施摘要
- 见 `B-COD.md` `B-COD-CATERPILLAR-01`

### 验收

1. L5 开局可见 1 个 caterpillar 格（tile-empty + insects_01 双层）
2. 拖过青虫格：无小跳、无飞物、无花蜜、无 combo、不扣蜜蜂
3. 翻开后结算尾：青虫先跳，邻居有已翻开植被 → 贝塞尔弧线跳到目标格 + 着陆压扁；源格 → empty；目标格 → caterpillar（作物消失）
4. 无合法目标：原地不动
5. 多只青虫指向同一格：升序结算
6. 撞鸟失败：青虫仍移动
7. caterpillar 不进任何花蜜桶 / 通关条件 / combo
8. `dangerCount` 重算正确
9. `node --check app.js` 通过

### Handoff
- 任务 ID：`A-PLN-CATERPILLAR-01`
- 当前状态：✅ 已落地，等 `@B-FIX` 实机回归
- 下一步：浏览器跑 L5，确认青虫跳跃动画、压扁、吃花、翻牌
- 阻塞：无