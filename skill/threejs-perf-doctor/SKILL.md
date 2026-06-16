---
name: threejs-perf-doctor
description: >
  Diagnose and fix Three.js WebGL/WebGPU performance problems -- draw call reduction, memory leaks,
  shader bottlenecks, mobile overheating, frame drops, and iOS/Capacitor thermal throttling.
  Use this skill whenever the user mentions Three.js performance, WebGL/WebGPU optimization,
  mobile 3D rendering issues, iOS overheating or battery drain from 3D content, frame rate problems,
  jank or stutter in Three.js scenes, GPU memory issues, or wants to audit/improve an existing
  Three.js project's rendering performance. Also activate when users mention keywords like:
  performance, FPS, lag, stutter, jank, hot, heat, thermal, battery, slow, freeze, memory leak,
  draw calls, overdraw, shader complexity, LOD, instancing, batching, dispose, or bundle size
  in the context of Three.js, WebGL, or WebGPU projects. Chinese triggers include:
  性能, 卡顿, 发热, 发烫, 掉帧, 内存泄漏, 优化, 帧率, 耗电, 白屏, 崩溃, 打包优化.
---

# Three.js Performance Doctor

A comprehensive diagnostic and optimization skill for Three.js WebGL/WebGPU projects,
with deep expertise in iOS/Capacitor mobile deployment.

## Prerequisites: Sub-Skills Installation

This skill depends on three sub-skills that provide domain knowledge. Before running any
diagnosis, verify they are installed. If not, install them:

### Sub-Skill 1: Three.js Skills (API & Pattern Knowledge)

Check if the directory `~/.claude/skills/threejs-skills/` exists and contains skill files.
If not, install:

```bash
git clone https://github.com/CloudAI-X/threejs-skills.git /tmp/threejs-skills-repo
cp -r /tmp/threejs-skills-repo/skills/* ~/.claude/skills/
rm -rf /tmp/threejs-skills-repo
```

This installs 10 Three.js skills covering: fundamentals, geometry, materials, lighting,
textures, animation, loaders, shaders, postprocessing, and interaction. Each contains
performance tips relevant to its domain.

### Sub-Skill 2: Three.js Official Repository (Reference Docs)

Check if `~/.claude/skills/threejs-perf-doctor/references/threejs-repo/` exists.
If not, do a sparse checkout of only the docs and manual:

```bash
git clone --depth 1 --filter=blob:none --sparse \
  https://github.com/mrdoob/three.js.git \
  ~/.claude/skills/threejs-perf-doctor/references/threejs-repo
cd ~/.claude/skills/threejs-perf-doctor/references/threejs-repo
git sparse-checkout set manual/en docs
```

Key reference paths within the repo:
- `manual/en/optimize-lots-of-objects.html` -- geometry merging guide
- `manual/en/optimize-lots-of-objects-animated.html` -- animated merged objects
- `manual/en/how-to-dispose-of-objects.html` -- disposal patterns
- `manual/en/cleanup.html` -- ResourceTracker pattern
- `manual/en/rendering-on-demand.html` -- render-on-demand for battery savings
- `manual/en/how-to-update-things.html` -- efficient buffer updates
- `manual/en/offscreencanvas.html` -- OffscreenCanvas for multithreading
- `manual/en/webgpurenderer.html` -- WebGPU migration guide
- `docs/TSL.md` -- Three.js Shading Language specification

### Sub-Skill 3: WebGPU + TSL Deep Reference (dgreenheck/webgpu-claude-skill)

Check if `~/.claude/skills/webgpu-threejs-tsl/SKILL.md` exists.
If not, install:

```bash
git clone --depth 1 https://github.com/dgreenheck/webgpu-claude-skill.git /tmp/webgpu-skill-repo
cp -r /tmp/webgpu-skill-repo/skills/webgpu-threejs-tsl ~/.claude/skills/webgpu-threejs-tsl
rm -rf /tmp/webgpu-skill-repo
```

This provides deep WebGPU/TSL expertise with:
- **TSL complete syntax & type system** -- types, operators, uniforms, control flow,
  custom functions, method chaining, and the critical property-assignment-vs-JS-reassignment
  gotcha that trips up both humans and AI
- **Node materials** -- all 12 NodeMaterial types, PBR property nodes, vertex/fragment overrides
- **Compute shaders** -- storage buffers, workgroups, atomics, barriers, GPU particle systems
- **WebGPU post-processing** -- RenderPipeline (formerly PostProcessing, renamed r183),
  MRT, 15+ built-in effects, custom TSL effects, scene transitions
- **WGSL integration** -- `wgslFn()` for raw WGSL, noise functions, hybrid TSL/WGSL patterns
- **Device loss handling** -- GPU watchdog, recovery strategies, context restoration patterns
- **Version-specific breaking changes** -- r171 through r183 tracked

Key paths within the skill:
- `SKILL.md` -- entry point with quick start and overview
- `REFERENCE.md` -- dense single-file cheatsheet (types, operators, all node properties)
- `docs/core-concepts.md` -- TSL type system, uniforms, control flow, custom functions
- `docs/compute-shaders.md` -- GPU compute patterns, storage buffers, atomic operations
- `docs/post-processing.md` -- RenderPipeline, MRT, 15+ effects, custom effects
- `docs/device-loss.md` -- GPU device loss detection, recovery, and testing strategies
- `examples/` -- 5 runnable examples (basic setup, custom material, particles, post-processing, earth shader)

---

## Workflow

When triggered, follow this phased approach. Adapt depth based on whether the user
wants a quick check, a full audit, or help fixing a specific issue.

### Phase 1: Project Reconnaissance

Scan the project to understand what you're working with:

1. **Identify the renderer**: WebGLRenderer or WebGPURenderer?
2. **Framework**: vanilla JS, React Three Fiber, Vue Three, Svelte Threlte, etc.?
3. **Bundler**: Vite, Webpack, Rollup, esbuild?
4. **Three.js version**: check package.json. Is it current? (r160+ recommended)
5. **Deployment target**: web-only, or iOS/Android via Capacitor/Cordova/PWA?
6. **Scene complexity**: rough estimate of meshes, lights, materials, textures

Search patterns for reconnaissance:
```
# Find renderer setup
grep -r "WebGLRenderer\|WebGPURenderer\|createRenderer" src/
# Find scene statistics
grep -r "new THREE.Mesh\|new Mesh\|useGLTF\|loadGLTF\|GLTFLoader" src/
# Find potential leaks (no dispose calls)
grep -r "\.dispose()" src/
# Find Capacitor config
cat capacitor.config.ts 2>/dev/null || cat capacitor.config.json 2>/dev/null
```

### Phase 2: Performance Diagnosis

Run through the diagnostic checklist. Read `references/performance-checklist.md` for the
full checklist with detection patterns and fix strategies.

**Critical checks (do these first):**

| Category | What to Check | Why It Matters |
|----------|--------------|----------------|
| Draw Calls | Are there >100 individual Mesh objects rendering per frame? | Each draw call = CPU overhead. On iOS WKWebView, the threshold is ~50-80 before jank |
| Memory Leaks | Are geometries/materials/textures properly disposed on scene changes? | WKWebView has ~1-1.5GB memory ceiling; leaks cause crashes |
| Texture Sizes | Any textures >2048x2048? Any non-power-of-2 textures? | iOS GPU has strict VRAM limits; oversized textures cause thermal throttling |
| Shader Complexity | Custom ShaderMaterial with expensive fragment shaders? | Fragment shaders run per-pixel; on Retina displays that's 3-4x the pixels |
| Animation Loop | Using continuous `requestAnimationFrame` when scene is static? | Continuous rendering at 60fps drains battery and heats iOS devices even when nothing moves |
| Pixel Ratio | Is `renderer.setPixelRatio(window.devicePixelRatio)` uncapped? | iPhone 15 Pro has 3x ratio = 9x pixels to shade. Cap at 2.0 max |
| Post-Processing | How many EffectComposer passes? | Each pass = full-screen re-render. 5+ passes can halve FPS on mobile |
| Lights & Shadows | How many real-time lights with shadows enabled? | Each shadow light = extra render pass. More than 2-3 shadow lights kills mobile |

### Phase 3: Apply Fixes

Based on diagnosis, apply fixes in priority order (highest impact first).
Load relevant sub-skills as needed for implementation details.

**Fix Priority Ladder:**

#### Tier 1 -- Quick Wins (Minutes, Major Impact)

1. **Cap pixel ratio**
   ```js
   renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
   ```

2. **Render on demand** (for non-continuously-animated scenes)
   ```js
   let needsRender = true;
   controls.addEventListener('change', () => { needsRender = true; });
   function loop() {
     requestAnimationFrame(loop);
     if (!needsRender) return;
     needsRender = false;
     renderer.render(scene, camera);
   }
   ```

3. **Dispose on unmount / route change**
   ```js
   function disposeScene(scene) {
     scene.traverse((obj) => {
       if (obj.geometry) obj.geometry.dispose();
       if (obj.material) {
         if (Array.isArray(obj.material)) obj.material.forEach(m => disposeMaterial(m));
         else disposeMaterial(obj.material);
       }
     });
   }
   function disposeMaterial(mat) {
     for (const key of Object.keys(mat)) {
       if (mat[key]?.isTexture) mat[key].dispose();
     }
     mat.dispose();
   }
   ```

4. **Texture compression**: switch to KTX2/Basis for all textures >512px
   Load `threejs-loaders` skill for KTX2Loader setup details.

#### Tier 2 -- Architecture Changes (Hours, Large Impact)

5. **InstancedMesh** for repeated objects (trees, particles, buildings)
   Load `threejs-geometry` skill for instancing patterns.

6. **BatchedMesh** (r160+) for mixed geometries that share materials
   ```js
   const batch = new THREE.BatchedMesh(maxGeometries, maxVertices, maxIndices, material);
   ```

7. **Geometry merging** for static objects using `BufferGeometryUtils.mergeGeometries()`

8. **LOD (Level of Detail)** for objects at varying distances
   ```js
   const lod = new THREE.LOD();
   lod.addLevel(highDetailMesh, 0);
   lod.addLevel(medDetailMesh, 50);
   lod.addLevel(lowDetailMesh, 200);
   ```

9. **Reduce post-processing passes**: combine effects, lower resolution for blur
   Load `threejs-postprocessing` skill for optimization patterns.

10. **Shadow optimization**: reduce shadow map size (512-1024), tighten frustums,
    use baked shadows for static objects. Load `threejs-lighting` skill.

#### Tier 3 -- Advanced Optimization (Days, Specialized)

11. **WebGPU migration**: for compute-heavy scenes, consider WebGPURenderer
    Read `references/webgpu-performance.md` for migration checklist.
    Load `webgpu-threejs-tsl` skill for TSL syntax, compute shaders, and device loss handling.

12. **OffscreenCanvas + Web Worker**: move rendering off main thread

13. **Custom shader optimization**: replace branching with `step()`/`mix()`,
    use lookup textures, minimize varyings. Load `threejs-shaders` skill.

14. **Frustum culling tuning + occlusion culling** for large open scenes

### Phase 4: iOS / Capacitor Specific

Read `references/ios-capacitor-optimization.md` for the complete iOS guide.

**Critical iOS/WKWebView constraints:**

- **Memory ceiling**: WKWebView process gets ~1-1.5GB before system kills it. No warning.
  Monitor with: `renderer.info.memory` (textures, geometries counts)
- **Thermal throttling**: iOS aggressively throttles GPU when device heats up.
  A scene running fine at room temp may drop to 15fps after 2 minutes in hand.
- **WebGL/WebGPU context/device loss**: iOS may kill WebGL context or WebGPU device under
  memory pressure. Always register context loss handlers. For WebGPU device loss recovery
  patterns, load `webgpu-threejs-tsl` skill and read `docs/device-loss.md`.
- **No SharedArrayBuffer**: Limits OffscreenCanvas worker communication patterns
- **Viewport meta tag**: Required for proper DPI handling
  ```html
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  ```

**Capacitor-specific config optimizations:**

```ts
// capacitor.config.ts
const config: CapacitorConfig = {
  ios: {
    preferredContentMode: 'mobile',     // Don't render as desktop
    allowsLinkPreview: false,
    scrollEnabled: false,               // Prevent scroll interference
    webContentsDebuggingEnabled: false,  // Disable in production
  },
  server: {
    iosScheme: 'capacitor',             // Use capacitor:// scheme
  }
};
```

### Phase 5: Verification

After applying fixes, verify improvements:

1. **renderer.info** -- check draw calls, triangles, textures, geometries
   ```js
   console.log('Draw calls:', renderer.info.render.calls);
   console.log('Triangles:', renderer.info.render.triangles);
   console.log('Textures:', renderer.info.memory.textures);
   console.log('Geometries:', renderer.info.memory.geometries);
   ```

2. **FPS monitoring** -- add Stats.js or a custom FPS counter
   ```js
   import Stats from 'three/examples/jsm/libs/stats.module.js';
   const stats = new Stats();
   document.body.appendChild(stats.dom);
   ```

3. **Memory trending** -- log `renderer.info.memory` over time to detect leaks

4. **iOS device test** -- use `npx cap run ios` and monitor in Xcode Instruments:
   - GPU utilization (aim for <70% sustained)
   - Memory footprint (aim for <800MB)
   - Thermal state (NSProcessInfo.thermalState)

---

## When to Load Sub-Skills

Load these existing Three.js skills on-demand based on the specific issue:

| Problem Domain | Load Skill |
|----------------|------------|
| Draw call reduction via instancing/batching | `threejs-geometry` |
| Material simplification, PBR optimization | `threejs-materials` |
| Shadow, light count optimization | `threejs-lighting` |
| Texture compression, atlas, mipmap issues | `threejs-textures` |
| Animation mixer performance, bone count | `threejs-animation` |
| Asset loading (Draco, KTX2 compression) | `threejs-loaders` |
| Post-processing pass reduction (WebGL EffectComposer) | `threejs-postprocessing` |
| Custom shader GLSL optimization | `threejs-shaders` |
| Raycaster throttling, interaction perf | `threejs-interaction` |
| Scene setup, renderer config, dispose | `threejs-fundamentals` |
| **WebGPU TSL syntax, types, method chaining** | `webgpu-threejs-tsl` |
| **WebGPU compute shaders (particles, physics, GPGPU)** | `webgpu-threejs-tsl` |
| **WebGPU post-processing (RenderPipeline, MRT, effects)** | `webgpu-threejs-tsl` |
| **WebGPU device loss detection & recovery** | `webgpu-threejs-tsl` |
| **GLSL → TSL migration, WGSL integration** | `webgpu-threejs-tsl` |
| **NodeMaterial property nodes (colorNode, roughnessNode)** | `webgpu-threejs-tsl` |

---

## Output Format

Always structure your diagnosis output as:

```markdown
# Performance Diagnosis Report

## Environment
- Three.js version: rXXX
- Renderer: WebGL / WebGPU
- Framework: ...
- Target: Web + iOS (Capacitor)

## Findings (by severity)

### Critical
- [issue description + file:line reference]

### Warning
- [issue description + file:line reference]

### Info
- [optimization opportunity]

## Recommended Fixes (priority order)
1. [fix + estimated impact]
2. ...

## Metrics Before / After (if fixes applied)
| Metric | Before | After |
|--------|--------|-------|
| Draw calls | ... | ... |
| Triangles | ... | ... |
| Textures in VRAM | ... | ... |
| Estimated FPS (mobile) | ... | ... |
```
