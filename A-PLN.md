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
   - 规则：未解锁时不暴露；解锁后默认处于开花阶段；采集可获得 3 朵花蜜

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
