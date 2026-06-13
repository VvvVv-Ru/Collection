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
