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
