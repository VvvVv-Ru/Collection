# WebGPU Performance Guide for Three.js

Migration considerations, performance advantages, and optimization strategies
for Three.js WebGPURenderer.

---

## WebGPU vs WebGL: When to Migrate

### WebGPU Advantages

| Area | Benefit |
|------|---------|
| Draw call overhead | Significantly reduced per-call CPU cost via command buffers |
| Compute shaders | Native GPU compute (particle systems, physics, terrain generation) |
| Render bundles | Pre-encode render commands for repeated identical draws |
| Better pipeline state | Less state change overhead between draw calls |
| Modern shader model | WGSL shaders with proper compute support |
| Async compilation | Non-blocking shader compilation |
| Memory management | More explicit GPU memory control |

### When NOT to Migrate

- Your scene is simple (<50 draw calls, no compute needs) -- WebGL overhead is negligible
- Your target audience uses older iOS devices (WebGPU requires iOS 17+/Safari 17+)
- You rely heavily on `ShaderMaterial`/`RawShaderMaterial`/`onBeforeCompile` -- these don't work in WebGPU
- Your project uses EffectComposer -- replaced by new pipeline (RenderPipeline + TSL)

### iOS WebGPU Support Status

| Browser / Platform | WebGPU Support |
|-------------------|----------------|
| Safari 17+ (iOS 17+) | Yes (with limitations) |
| WKWebView (iOS 17+) | Yes (inherits Safari support) |
| Capacitor (iOS 17+) | Yes (uses WKWebView) |
| Safari 16 and below | No -- falls back to WebGL 2 |
| Chrome iOS | No (all iOS browsers use WebKit engine) |

**Important**: `WebGPURenderer` in Three.js auto-falls back to WebGL 2 when WebGPU
is unavailable. You don't need to maintain two code paths for the renderer itself.
But TSL-based materials work on both backends, while GLSL ShaderMaterials only work on WebGL.

---

## Migration Checklist

### Step 1: Change Imports

```diff
- import * as THREE from 'three';
+ import * as THREE from 'three/webgpu';
```

If using TSL (Three.js Shading Language):
```js
import { texture, uv, uniform, color, mix, vec3, float } from 'three/tsl';
```

### Step 2: Renderer Initialization

```diff
- const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
+ const renderer = new THREE.WebGPURenderer({ canvas, antialias: true });
+ // IMPORTANT: WebGPU init is async
+ await renderer.init();
```

Or use `setAnimationLoop` which handles async init internally:

```js
const renderer = new THREE.WebGPURenderer({ canvas });
renderer.setAnimationLoop(animate);
// animate() will be called after renderer is ready
```

### Step 3: Migrate Custom Shaders to TSL

This is the hardest part. `ShaderMaterial` and `onBeforeCompile` do NOT work with WebGPU.

GLSL → TSL conversion examples:

**Simple color shader:**
```glsl
// GLSL (old)
varying vec2 vUv;
void main() {
  gl_FragColor = vec4(vUv.x, vUv.y, 0.0, 1.0);
}
```
```js
// TSL (new)
import { uv, vec4 } from 'three/tsl';
material.colorNode = vec4(uv().x, uv().y, 0.0, 1.0);
```

**Fresnel effect:**
```js
// TSL
import { positionView, normalView, normalize, dot, pow, float } from 'three/tsl';
const viewDir = normalize(positionView.negate());
const fresnel = pow(float(1.0).sub(dot(normalView, viewDir)), 3.0);
material.colorNode = mix(baseColor, rimColor, fresnel);
```

### Step 4: Migrate Post-Processing

EffectComposer → new RenderPipeline approach:

```js
// New WebGPU post-processing
import { bloom, dotScreen, rgbShift } from 'three/tsl';

const scenePass = renderer.renderPass(scene, camera);
const bloomPass = bloom(scenePass, { strength: 1.5, radius: 0.4, threshold: 0.85 });
const output = renderOutput(bloomPass);
renderer.outputNode = output;
```

### Step 5: Update Bundler Config

For Vite:
```js
// vite.config.js -- no special config needed for three/webgpu
// It's just a different entry point in the three.js package
```

For TypeScript/tsconfig:
```json
{
  "compilerOptions": {
    "paths": {
      "three/webgpu": ["node_modules/three/build/three.webgpu.d.ts"],
      "three/tsl": ["node_modules/three/build/three.tsl.d.ts"]
    }
  }
}
```

---

## WebGPU Performance Optimization

### Render Bundles

Pre-record render commands for objects that don't change between frames:

```js
// Create a render bundle for static objects
const staticGroup = new THREE.Group();
staticGroup.add(terrain, buildings, decorations);

// Mark as bundle-able (Three.js handles this internally with BatchedMesh)
// For manual control, use render bundle API through renderer
```

### Compute Shaders for GPGPU

Move expensive per-frame computation to GPU.

> **Deep reference**: For complete compute shader patterns including storage buffers,
> workgroups, atomics, barriers, and full particle system examples, load the
> `webgpu-threejs-tsl` sub-skill and read `docs/compute-shaders.md`.

Basic pattern:

```js
import { compute, storage, instanceIndex, float } from 'three/tsl';

// Define storage buffer
const positionBuffer = new THREE.StorageBufferAttribute(positionArray, 3);

// Define compute function
const computeFn = compute(() => {
  const i = instanceIndex;
  const pos = storage(positionBuffer, 'vec3', count).element(i);
  // Update position on GPU
  pos.x = pos.x.add(float(0.01));
}, count);

// Run compute before render
renderer.compute(computeFn);
```

Use cases for compute shaders:
- Particle systems (>10K particles)
- Physics simulation
- Terrain generation / modification
- Skinning for crowds (many animated characters)
- Frustum culling on GPU

> **Critical TSL gotcha** (documented extensively in `webgpu-threejs-tsl` skill):
> TSL intercepts property assignment on nodes (`pos.y = limit`) but NOT JavaScript
> variable reassignment (`value = value.add(1)`). This is the most common source of
> broken compute shaders. Use `.assign()` or `.addAssign()` instead.

### Async Shader Compilation

WebGPU supports non-blocking shader compilation:

```js
// Shaders compile asynchronously -- no frame spike
// Three.js handles this automatically with WebGPURenderer
// Objects render once their shaders are ready

// To pre-compile materials before they're needed:
await renderer.compileAsync(scene, camera);
```

### BatchedMesh (Works on Both WebGL & WebGPU)

Combine multiple geometries into a single draw call:

```js
const batchedMesh = new THREE.BatchedMesh(100, 50000, 100000, material);

// Add geometries
const geoId1 = batchedMesh.addGeometry(boxGeo);
const geoId2 = batchedMesh.addGeometry(sphereGeo);

// Add instances
const inst1 = batchedMesh.addInstance(geoId1);
const inst2 = batchedMesh.addInstance(geoId2);

// Set transforms
batchedMesh.setMatrixAt(inst1, matrix1);
batchedMesh.setMatrixAt(inst2, matrix2);
```

### Occlusion Culling

WebGPU supports efficient GPU-based occlusion queries:

```js
// Three.js WebGPU renderer can leverage occlusion queries
// to skip rendering of fully hidden objects
// Check webgpu_occlusion example for implementation
```

---

## Performance Comparison: WebGL vs WebGPU

Typical measurements (varies by device and scene):

| Metric | WebGL | WebGPU | Notes |
|--------|-------|--------|-------|
| 1000 unique draw calls | ~16ms CPU | ~4ms CPU | WebGPU's command buffer model wins |
| 50K instanced objects | ~8ms | ~6ms | Similar (instancing already efficient) |
| 10 post-process passes | ~12ms GPU | ~8ms GPU | WebGPU auto-combines compatible passes |
| Shader compilation | Synchronous (frame spike) | Async (no spike) | Major UX improvement |
| Compute (100K particles) | CPU fallback | ~2ms GPU | WebGPU compute is transformative |

### When WebGPU Doesn't Help

- Simple scenes with few draw calls (overhead reduction irrelevant)
- Already GPU-bound (same GPU hardware, same workload)
- iOS Safari on older devices (falls back to WebGL anyway)
- Heavy custom GLSL shaders (need complete rewrite to TSL)

---

## Debugging WebGPU Performance

### Chrome DevTools

1. Enable WebGPU in `chrome://flags`
2. Performance tab → record a frame
3. Look for `GPUQueue.submit()` durations
4. Check for excessive buffer uploads (indicates CPU→GPU data transfer bottleneck)

### Safari Web Inspector

1. Safari → Develop → Show Web Inspector
2. Graphics tab shows WebGPU command buffer timeline
3. Monitor GPU utilization percentage

### Three.js Debugging

```js
// Same as WebGL -- renderer.info still works
console.log(renderer.info.render.calls);   // Draw calls
console.log(renderer.info.render.triangles); // Triangles
console.log(renderer.info.memory.textures);  // Texture count
console.log(renderer.info.memory.geometries); // Geometry count
```

---

## WebGPU Device Loss Handling

GPU device loss is more common and more complex than WebGL context loss.
The `webgpu-threejs-tsl` sub-skill covers this topic in depth at `docs/device-loss.md`.

Key points:
- **Causes**: GPU watchdog timeout (shaders >~10s), driver crashes, resource pressure, driver updates
- **Detection**: `device.lost.then(info => ...)` -- never `await` it directly
- **Recovery strategies**: Page reload (minimal) → recreate renderer (recommended) → full state save/restore
- **Testing**: `device.destroy()` for simulated loss, Chrome `about:gpucrash` for real GPU crash
- **iOS specifics**: WKWebView may trigger device loss under thermal throttling (Serious/Critical state)

For complete recovery code examples and best practices, load the `webgpu-threejs-tsl` skill.
