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

## 给 B-COD 的提醒
- 不要继续在 `.tile__inner` 上叠加旧占位风格描边
- 不要再用 `background` 简写覆盖贴图
- 如果后续要对齐第二张效果图，资源替换和盘面布局应拆成两个改动，避免重复返工
