# Three.js Performance Diagnostic Checklist

A systematic checklist for diagnosing Three.js performance issues.
Work through each section. Skip categories that are clearly not relevant to the project.

---

## 1. Renderer Configuration

### 1.1 Pixel Ratio
- **Check**: `renderer.setPixelRatio()` value
- **Detection**: `grep -r "setPixelRatio" src/`
- **Problem**: Using raw `devicePixelRatio` on high-DPI devices (3x iPhone = 9x pixel count)
- **Fix**: `renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))`
- **Impact**: HIGH on mobile (can double FPS on iPhone)

### 1.2 Canvas Size
- **Check**: Is canvas sized to actual CSS pixel size or larger?
- **Detection**: Compare `renderer.getSize()` with CSS layout dimensions
- **Problem**: Rendering at higher resolution than displayed
- **Fix**: Match canvas drawingBuffer to CSS layout size, accounting for pixel ratio cap

### 1.3 Anti-aliasing
- **Check**: `antialias: true` in WebGLRenderer constructor
- **Detection**: `grep -r "antialias" src/`
- **Problem**: MSAA is expensive; on mobile often not worth it at high DPI
- **Fix**: Disable on mobile or use FXAA post-processing instead (cheaper)

### 1.4 Power Preference
- **Check**: `powerPreference` setting
- **Detection**: `grep -r "powerPreference" src/`
- **Problem**: Default may select integrated GPU on laptops
- **Fix**: `powerPreference: 'high-performance'` for desktop, consider 'low-power' for mobile battery

### 1.5 Tone Mapping & Color Space
- **Check**: Tone mapping function complexity
- **Problem**: ACESFilmicToneMapping is more expensive than LinearToneMapping
- **Fix**: Use simpler tone mapping on mobile if visual quality allows

---

## 2. Draw Calls

### 2.1 Total Draw Call Count
- **Check**: `renderer.info.render.calls`
- **Threshold**: <50 ideal for mobile, <200 for desktop
- **Problem**: Each Mesh + Material combination = 1 draw call minimum
- **Fix Strategy**:
  - Merge static geometry: `BufferGeometryUtils.mergeGeometries()`
  - InstancedMesh for repeated objects
  - BatchedMesh (r160+) for mixed geometries
  - Texture atlases to share materials

### 2.2 Material Count
- **Check**: How many unique materials are in the scene?
- **Detection**: Count unique Material instances across all meshes
- **Problem**: Different materials prevent batching
- **Fix**: Share materials between meshes where possible; use vertex colors for variation

### 2.3 Transparent Objects
- **Check**: Any materials with `transparent: true`?
- **Detection**: `grep -r "transparent.*true" src/`
- **Problem**: Transparent objects require depth sorting (CPU cost) and prevent early-Z rejection
- **Fix**: Use `alphaTest` instead of `transparent` where possible; minimize transparent object count

---

## 3. Geometry & Mesh

### 3.1 Polygon Count
- **Check**: `renderer.info.render.triangles`
- **Threshold**: <500K for mobile, <2M for desktop
- **Problem**: Too many triangles = vertex shader bottleneck
- **Fix**: LOD, mesh simplification, lower-poly models

### 3.2 Geometry Segment Counts
- **Check**: Sphere/cylinder/etc. segment parameters
- **Detection**: `grep -r "SphereGeometry\|CylinderGeometry\|PlaneGeometry" src/`
- **Problem**: Default segments may be too high (e.g., SphereGeometry(1, 64, 64) has 8K triangles)
- **Fix**: Use 16-32 segments for objects below 10% of screen size

### 3.3 Indexed vs Non-Indexed Geometry
- **Check**: `geometry.index` existence
- **Problem**: Non-indexed geometry duplicates vertices
- **Fix**: Use indexed geometry; call `mergeVertices()` on loaded geometry

### 3.4 Unused Geometry
- **Check**: Geometry loaded but not in scene, or mesh not visible
- **Problem**: Wastes GPU memory even if not rendered
- **Fix**: Dispose unused geometry; use `visible = false` only if temporary

---

## 4. Materials & Shaders

### 4.1 Material Complexity
- **Check**: Material type distribution
- **Grade**: Basic(1) < Lambert(2) < Phong(3) < Standard(4) < Physical(5)
- **Problem**: Using MeshPhysicalMaterial where MeshStandardMaterial suffices
- **Fix**: Downgrade materials for distant/small objects; use simpler materials on mobile

### 4.2 Shader Recompilation
- **Check**: Setting `material.needsUpdate = true` at runtime?
- **Detection**: `grep -r "needsUpdate.*=.*true" src/`
- **Problem**: Each `needsUpdate` triggers full shader recompilation (expensive, causes frame spike)
- **Fix**: Pre-configure material features; use "dummy" values (zero-intensity lights, white textures)

### 4.3 Custom Shader Performance
- **Check**: ShaderMaterial / RawShaderMaterial fragment shaders
- **Problems**:
  - `if/else` branching (causes warp divergence on GPU)
  - `pow()`, `sin()`, `cos()` in per-pixel loops
  - Texture sampling in loops
  - Too many varying interpolants
- **Fix**: Replace `if/else` with `step()`/`mix()`/`smoothstep()`; precompute on CPU; use lookup textures

### 4.4 Material Disposal
- **Check**: Are materials disposed when no longer needed?
- **Problem**: Undisposed materials keep shader programs in GPU memory
- **Fix**: `material.dispose()` + dispose all textures referenced by the material

---

## 5. Textures

### 5.1 Texture Dimensions
- **Check**: All loaded texture sizes
- **Threshold**: Max 2048x2048 for mobile, 4096x4096 desktop
- **Problem**: Large textures consume VRAM exponentially (4096x4096 RGBA = 64MB uncompressed)
- **Fix**: Resize to appropriate size; use mipmaps; compress with KTX2/Basis

### 5.2 Power of Two
- **Check**: Are texture dimensions powers of 2? (256, 512, 1024, 2048)
- **Problem**: Non-POT textures can't use mipmaps efficiently; some GPUs pad them
- **Fix**: Resize to nearest POT; or use `texture.generateMipmaps = false` with nearest filtering

### 5.3 Texture Format & Compression
- **Check**: Using PNG/JPG or compressed formats (KTX2/Basis)?
- **Detection**: `grep -r "KTX2Loader\|BasisLoader" src/` (absence = uncompressed)
- **Problem**: Uncompressed textures use 4-8x more VRAM than GPU-compressed formats
- **Fix**: Convert to KTX2/Basis using `toktx` or `basisu` CLI tools

### 5.4 Texture Disposal
- **Check**: `texture.dispose()` called when textures are no longer needed?
- **Problem**: Textures are the #1 VRAM consumer; undisposed textures cause OOM on iOS
- **Fix**: Track and dispose all textures; use a ResourceTracker pattern

### 5.5 Duplicate Textures
- **Check**: Same image file loaded multiple times as separate Texture instances?
- **Problem**: Wastes VRAM with duplicate data
- **Fix**: Cache textures; use THREE.Cache.enabled = true; share texture references

---

## 6. Lights & Shadows

### 6.1 Light Count
- **Check**: Number of lights in scene (excluding AmbientLight/HemisphereLight)
- **Threshold**: <4 real-time lights for mobile, <8 for desktop
- **Problem**: Each light adds shader complexity; Standard/Physical materials cost grows linearly with light count
- **Fix**: Bake lighting; use fewer lights + environment map; merge lights

### 6.2 Shadow Map Count
- **Check**: How many lights have `castShadow = true`?
- **Threshold**: 1-2 shadow lights max for mobile
- **Problem**: Each shadow light requires an extra render pass for the shadow map
- **Fix**: Use 1 directional shadow + baked ambient occlusion; use contact shadows for small objects

### 6.3 Shadow Map Resolution
- **Check**: `light.shadow.mapSize`
- **Threshold**: 512-1024 for mobile, 1024-2048 desktop
- **Problem**: 4096x4096 shadow map = 64MB VRAM
- **Fix**: Use 512 or 1024; tighten shadow camera frustum for better shadow texel density

### 6.4 Shadow Frustum
- **Check**: `light.shadow.camera` near/far/left/right/top/bottom
- **Problem**: Default shadow frustum is usually too large, wasting shadow map resolution
- **Fix**: Tighten frustum to fit the visible scene; use `CameraHelper` to visualize

---

## 7. Animation

### 7.1 Active Mixer Count
- **Check**: How many AnimationMixers are active per frame?
- **Problem**: Each mixer.update() iterates all active actions and updates bone transforms
- **Fix**: Pause/disable mixers for offscreen or distant objects

### 7.2 Skeletal Complexity
- **Check**: Bone count per skinned mesh
- **Threshold**: <30 bones for mobile characters, <60 desktop
- **Problem**: Bone transforms are computed on CPU (or via skinning texture)
- **Fix**: LOD for rigs; simpler skeletons for distant characters

### 7.3 Morph Target Count
- **Check**: `mesh.morphTargetInfluences.length`
- **Problem**: Active morph targets increase vertex shader cost
- **Fix**: Limit active influences; use morphTargetsCount on material

---

## 8. Post-Processing

### 8.1 Pass Count
- **Check**: Number of passes in EffectComposer
- **Threshold**: <3 for mobile, <6 desktop
- **Problem**: Each pass = full-screen render
- **Fix**: Combine effects; remove unnecessary passes; disable on mobile

### 8.2 Pass Resolution
- **Check**: Are blur/bloom passes running at full resolution?
- **Problem**: Bloom at full res is extremely expensive
- **Fix**: Use half or quarter resolution for blur-based effects

### 8.3 Selective Bloom
- **Check**: Is bloom applied to entire scene or just emissive objects?
- **Problem**: Full-scene bloom wastes GPU on non-glowing objects
- **Fix**: Use layers-based selective bloom or threshold-based bloom

---

## 9. Loading & Bundling

### 9.1 Asset Compression
- **Check**: Using Draco for geometry? KTX2 for textures?
- **Detection**: `grep -r "DRACOLoader\|KTX2Loader" src/`
- **Problem**: Uncompressed assets = larger downloads + more memory during parse
- **Fix**: Enable Draco for GLTF; KTX2 for textures; gzip/brotli for transport

### 9.2 Tree Shaking
- **Check**: Importing `import * as THREE from 'three'` or specific imports?
- **Problem**: Star import may prevent tree shaking in some bundler configs
- **Fix**: Import specific classes: `import { Scene, Mesh } from 'three'`
  Note: Three.js ESM build is tree-shakeable in modern bundlers even with star imports

### 9.3 Bundle Size
- **Check**: Three.js contribution to final bundle
- **Detection**: `npx vite-bundle-visualizer` or `webpack-bundle-analyzer`
- **Problem**: Full Three.js + all addons can be >1MB
- **Fix**: Code split; lazy load Three.js and 3D scene; use dynamic imports

### 9.4 Lazy Loading Assets
- **Check**: Are all 3D assets loaded upfront or on-demand?
- **Problem**: Loading everything at startup = slow first paint + memory spike
- **Fix**: Progressive loading; placeholder → low-poly → full quality

---

## 10. Memory Management

### 10.1 Dispose Pattern
- **Check**: Is there a systematic dispose strategy?
- **Detection**: `grep -r "dispose" src/` -- if fewer than expected, likely leaking
- **Problem**: Three.js objects don't auto-dispose; must manually free GPU resources
- **Fix**: Implement ResourceTracker or manual traverse-and-dispose on scene transitions

### 10.2 Event Listener Cleanup
- **Check**: Are resize/mouse/touch listeners removed on unmount?
- **Problem**: Orphaned listeners prevent garbage collection of entire renderer + scene
- **Fix**: Always removeEventListener in cleanup; use AbortController for modern cleanup

### 10.3 Render Target Disposal
- **Check**: WebGLRenderTarget instances created and disposed properly?
- **Problem**: Each render target allocates a framebuffer; forgetting to dispose leaks GPU memory
- **Fix**: Track all render targets; dispose when no longer needed

### 10.4 renderer.info Monitoring
- **Check**: Is `renderer.info` being logged or monitored?
- **Recommended**: Add periodic logging in development:
  ```js
  setInterval(() => {
    const info = renderer.info;
    console.log(`Programs: ${info.programs.length}, Textures: ${info.memory.textures}, Geometries: ${info.memory.geometries}`);
  }, 5000);
  ```
