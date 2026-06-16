# Three.js Performance Doctor 使用指南

## 安装

将zip路径给Claude 然后输入：安装这个skill并加载


---

## 使用方式

在你的 Three.js 项目目录下打开 Claude Code，直接用自然语言描述问题即可。
Skill 会根据关键词自动激活，无需手动加载。

### 一句话全项目优化

```
分析这个项目，解决 iOS 上发热卡顿掉帧的问题
```

Claude Code 会自动执行完整的 5 阶段工作流：

```
Phase 1  侦察    → 扫描项目结构、渲染器、框架、打包器、Three.js 版本
Phase 2  诊断    → 按 50+ 项检查清单逐项排查
Phase 3  修复    → 按优先级逐个改代码（自动加载子 Skill 获取实现方案）
Phase 4  iOS专项  → Capacitor 配置、WKWebView 内存/热节流、Device Loss 处理
Phase 5  验证    → 对比 before/after 指标，输出诊断报告
```

### 更多触发示例

#### 全局性能诊断

```
帮我检查一下这个 Three.js 项目的性能问题
```

```
review this project for performance best practices
```

```
优化整个项目的渲染性能
```

#### iOS / 移动端问题

```
手机跑这个 3D 场景特别烫，怎么解决？
```

```
打包到 iOS 后耗电严重，帮我优化
```

```
Capacitor 应用在 iPhone 上白屏崩溃了
```

```
iOS 上 FPS 很低，只有 15 帧
```

#### 具体性能瓶颈

```
draw calls 太多了，有 500 多个，帮我减少
```

```
内存泄漏导致用了一段时间后越来越卡
```

```
后处理 pass 太多，移动端帧率很低
```

```
纹理太大了，加载慢而且占内存
```

#### WebGPU 迁移

```
帮我把这个 WebGL 项目迁移到 WebGPU
```

```
ShaderMaterial 怎么改成 TSL 写法？
```

```
WebGPU 的 compute shader 怎么做粒子系统？
```

#### 新项目最佳实践

```
我要新建一个 Three.js + Capacitor 项目，帮我从性能角度搭好基础架构
```

```
移动端 Three.js 项目应该怎么设置渲染器？
```

---

## 工作流详解

### Phase 1：侦察

Skill 会自动扫描你的项目，识别以下信息：

| 识别项 | 示例结果 |
|-------|---------|
| 渲染器 | WebGLRenderer (Three.js r168) |
| 框架 | react-three-fiber v8 |
| 打包器 | Vite 5 |
| iOS 打包 | Capacitor 6 |
| Draw Calls | ~450（目标: 移动端 <100） |
| 纹理 | 23 张加载（12 张 4096x4096 — 移动端过大） |
| 灯光 | 5 盏实时灯（2 盏开阴影） |
| 后处理 | UnrealBloomPass + SSAOPass + FXAAShaderPass |
| 资产格式 | .glb（无 Draco）、.png 纹理（无 KTX2） |

### Phase 2：诊断

按 9 大类 50+ 项逐一排查：

1. **渲染器配置** — 像素比、抗锯齿、power preference
2. **Draw Calls** — 实例化、合并、BatchedMesh 机会
3. **几何体** — 面数、分段数、索引化
4. **材质/着色器** — 复杂度、透明度、编译循环
5. **纹理/内存** — 尺寸、压缩、dispose、泄漏
6. **灯光/阴影** — 灯光数量、阴影图大小、视锥体
7. **动画** — mixer 数量、骨骼复杂度、morph targets
8. **后处理** — pass 数量、分辨率、移动端适配
9. **加载/打包** — Draco、KTX2、tree-shaking、懒加载

### Phase 3：修复

按影响力分 4 个优先级，逐个修复：

| 优先级 | 耗时 | 典型修复 |
|-------|------|---------|
| **P0 关键** | 分钟级 | 限制 pixel ratio、添加 dispose、缩小纹理 |
| **P1 高** | 分钟级 | InstancedMesh、render-on-demand、阴影优化 |
| **P2 中** | 小时级 | geometry 合并、LOD、资产压缩(Draco/KTX2) |
| **P3 低** | 天级 | WebGPU 迁移、OffscreenCanvas、自定义 shader 优化 |

修复过程中会按需加载子 Skill：

| 修什么 | 自动加载 |
|-------|---------|
| 合并/实例化 | `threejs-geometry` |
| 材质降级 | `threejs-materials` |
| 阴影优化 | `threejs-lighting` |
| 纹理压缩 | `threejs-textures` + `threejs-loaders` |
| 后处理精简 | `threejs-postprocessing` |
| Shader 优化 | `threejs-shaders` |
| WebGPU/TSL | `webgpu-threejs-tsl` |

### Phase 4：iOS / Capacitor 专项

针对 iOS 的核心约束逐项处理：

- **WKWebView 内存上限** (~1.5GB) — 超出直接白屏，无任何警告
- **热节流** — GPU 持续高负载 2-3 分钟后时钟频率断崖下降
- **像素比** — iPhone 3x Retina = 9 倍像素量，必须限制到 2x
- **WebGL/WebGPU Context/Device Loss** — iOS 可能随时回收 GPU 资源
- **前后台生命周期** — 后台必须停止渲染，否则持续耗电
- **Capacitor 配置** — scrollEnabled、webContentsDebuggingEnabled 等

### Phase 5：验证

输出标准化诊断报告：

```markdown
# Performance Diagnosis Report

## Environment
- Three.js version: r168
- Renderer: WebGLRenderer
- Framework: react-three-fiber v8
- Target: Web + iOS (Capacitor 6)

## Findings (by severity)

### Critical
- 12 张 4096x4096 纹理导致 iOS 内存溢出 (src/textures/loader.ts:45)
- 缺少 dispose 调用，切换路由后 GPU 内存持续增长 (src/Scene.tsx:120)

### Warning
- 450 draw calls，移动端目标应 <100 (src/world/Trees.tsx:30)
- pixel ratio 未限制，iPhone 上渲染 3x 分辨率 (src/renderer.ts:12)

### Info
- 可考虑对静态场景使用 render-on-demand 节省电量

## Recommended Fixes (priority order)
1. 限制 pixel ratio 到 2.0 — 预计 FPS +40%
2. 添加全局 dispose 管理 — 防止 iOS 白屏崩溃
3. 纹理降至 1024x1024 + KTX2 压缩 — 内存减少 ~80%
4. 树木改用 InstancedMesh — draw calls 从 450 降至 ~50

## Metrics Before / After
| Metric | Before | After |
|--------|--------|-------|
| Draw calls | 450 | 52 |
| Triangles | 1.8M | 600K |
| Textures in VRAM | ~780MB | ~120MB |
| Estimated FPS (iPhone) | 12-15 | 45-55 |
```

---

## 性能预算参考

| 指标 | 桌面端 | 移动端 / iOS |
|------|-------|-------------|
| Draw calls | <200 | <100 |
| 三角面 | <2M | <500K |
| 纹理显存 | <512MB | <200MB |
| 单张纹理最大 | 4096x4096 | 1024x1024 |
| 目标帧率 | 60fps | 30-60fps |
| Pixel ratio | 原生 | 最高 2.0 |
| Shadow map | 2048 | 512-1024 |
| 阴影灯光数 | 3-4 | 1-2 |
| 后处理 pass | 4-5 | 1-2 |
| JS bundle (3D) | <500KB gzip | <300KB gzip |

---

## 可选：项目级配置

在项目根目录创建 `.claude/CLAUDE.md`，可以让 Skill 更主动地介入：

```markdown
# 项目级指令
本项目是 Three.js + Capacitor iOS 应用。
遇到性能相关问题时，优先使用 threejs-perf-doctor skill。
```
