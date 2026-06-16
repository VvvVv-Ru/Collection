# iOS Capacitor Optimization Guide for Three.js

This guide covers iOS-specific performance constraints and Capacitor configuration
for Three.js 3D web applications running inside WKWebView.

---

## iOS Hardware & WKWebView Constraints

### Memory Limits

| Device Generation | Approximate WKWebView Memory Limit |
|------------------|-------------------------------------|
| iPhone 12/13     | ~1.2 - 1.5 GB                     |
| iPhone 14/15     | ~1.5 - 2.0 GB                     |
| iPhone SE (3rd)  | ~1.0 GB                            |
| iPad Air/Pro     | ~2.0 - 3.0 GB                     |

When the limit is exceeded, iOS terminates the WKWebView process **without warning**.
The web content goes blank (white screen), and `window.onerror` or try/catch cannot catch it.
The only signal is the WKWebView delegate callback `webViewWebContentProcessDidTerminate`.

### GPU Constraints

- **Max texture size**: 4096x4096 on most iPhones (8192x8192 on recent iPad Pro)
- **VRAM**: Shared with system RAM; no dedicated VRAM
- **Half-float precision**: Fragment shaders use `mediump` by default on some GPU tiers;
  custom shaders must handle precision carefully
- **WebGL extensions**: Some extensions (e.g., `EXT_color_buffer_float`) may be missing
- **Pixel ratio**: Up to 3.0 (iPhone Pro); never use raw devicePixelRatio

### Thermal Throttling Behavior

iOS thermal management is aggressive:

1. **Normal** (ThermalState.nominal): Full GPU clock
2. **Fair** (ThermalState.fair): GPU clock reduced ~10-20%
3. **Serious** (ThermalState.serious): GPU clock reduced ~30-50%; system may kill background processes
4. **Critical** (ThermalState.critical): Extreme throttling; device may shut down

Sustained GPU load (>70% for >2 minutes) typically triggers the Fair→Serious transition.
Three.js scenes that run smoothly for the first minute may degrade severely after 2-3 minutes
of continuous rendering. This is the most common cause of "it works fine at first then gets laggy"
reports from iOS users.

### Context Loss

iOS Safari and WKWebView may terminate the WebGL context when:
- Memory pressure from other apps
- Thermal throttling reaches Serious/Critical
- App enters background and returns foreground

Always handle context loss:

```js
const canvas = renderer.domElement;
canvas.addEventListener('webglcontextlost', (event) => {
  event.preventDefault();
  // Stop animation loop
  cancelAnimationFrame(animationId);
  // Notify user
  showReloadPrompt();
}, false);

canvas.addEventListener('webglcontextrestored', () => {
  // Re-initialize renderer state
  initScene();
}, false);
```

---

## Capacitor Configuration

### capacitor.config.ts

```ts
import { CapacitorConfig } from '@anthropic-ai/capacitor-core';

const config: CapacitorConfig = {
  appId: 'com.example.app',
  appName: 'MyApp',
  webDir: 'dist',
  ios: {
    preferredContentMode: 'mobile',
    allowsLinkPreview: false,
    scrollEnabled: false,              // Prevent scroll bounce interfering with 3D interaction
    limitsNavigationsToAppBoundDomains: true,
    webContentsDebuggingEnabled: process.env.NODE_ENV !== 'production',
  },
  server: {
    iosScheme: 'capacitor',            // capacitor:// scheme avoids CORS issues
    allowNavigation: [],               // Lock down navigation
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: false,           // Manually hide after scene is loaded
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#000000',
    },
    Keyboard: {
      resize: 'none',                 // Prevent keyboard resize from triggering re-render
    },
  },
};

export default config;
```

### Native iOS Configuration (ios/App/App/Info.plist)

Add these keys to optimize WKWebView for 3D rendering:

```xml
<!-- Prevent the system from reducing frame rate in low-power mode -->
<key>CADisableMinimumFrameDurationOnPhone</key>
<true/>

<!-- Request higher GPU priority (advisory, not guaranteed) -->
<key>UIApplicationSupportsIndirectInputEvents</key>
<true/>
```

### WKWebView Configuration (Advanced -- Native Plugin)

For maximum control, create a Capacitor plugin that configures WKWebView:

```swift
// In a custom Capacitor plugin
override func webViewConfiguration() -> WKWebViewConfiguration {
    let config = WKWebViewConfiguration()
    let prefs = WKWebpagePreferences()
    prefs.allowsContentJavaScript = true
    config.defaultWebpagePreferences = prefs
    
    // Allow inline media playback (for video textures)
    config.allowsInlineMediaPlayback = true
    config.mediaTypesRequiringUserActionForPlayback = []
    
    // Process pool (share across views if using multiple WebViews)
    config.processPool = WKProcessPool()
    
    return config
}
```

---

## Performance Optimization Strategies for iOS

### 1. Adaptive Quality System

Implement a quality tier system that auto-adjusts based on device capability:

```js
function getDeviceTier() {
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
  if (!gl) return 'low';
  
  const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
  const renderer = debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : '';
  
  // iOS device detection
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const gpuTier = renderer.toLowerCase();
  
  if (isIOS) {
    // A17 Pro (iPhone 15 Pro) and later
    if (gpuTier.includes('a17') || gpuTier.includes('a18') || gpuTier.includes('m')) return 'high';
    // A15/A16 (iPhone 13-15)
    if (gpuTier.includes('a15') || gpuTier.includes('a16')) return 'medium';
    // Older
    return 'low';
  }
  
  return 'high'; // Desktop default
}

const QUALITY_PRESETS = {
  low: {
    pixelRatio: 1.0,
    shadowMapSize: 512,
    maxLights: 2,
    shadowsEnabled: false,
    postProcessing: false,
    textureMaxSize: 1024,
    antialias: false,
    maxDrawCalls: 50,
  },
  medium: {
    pixelRatio: 1.5,
    shadowMapSize: 1024,
    maxLights: 3,
    shadowsEnabled: true,
    postProcessing: false, // or minimal
    textureMaxSize: 2048,
    antialias: false,
    maxDrawCalls: 100,
  },
  high: {
    pixelRatio: 2.0,
    shadowMapSize: 2048,
    maxLights: 6,
    shadowsEnabled: true,
    postProcessing: true,
    textureMaxSize: 4096,
    antialias: true,
    maxDrawCalls: 300,
  },
};
```

### 2. Thermal-Aware Rendering

Monitor and respond to thermal state (requires a Capacitor plugin):

```swift
// Native side: ThermalStatePlugin.swift
import Capacitor

@objc(ThermalStatePlugin)
public class ThermalStatePlugin: CAPPlugin {
    override public func load() {
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(thermalStateChanged),
            name: ProcessInfo.thermalStateDidChangeNotification,
            object: nil
        )
    }
    
    @objc func thermalStateChanged() {
        let state = ProcessInfo.processInfo.thermalState
        let stateName: String
        switch state {
        case .nominal: stateName = "nominal"
        case .fair: stateName = "fair"
        case .serious: stateName = "serious"
        case .critical: stateName = "critical"
        @unknown default: stateName = "unknown"
        }
        notifyListeners("thermalStateChange", data: ["state": stateName])
    }
}
```

```js
// Web side: respond to thermal state
import { ThermalState } from './plugins/ThermalStatePlugin';

ThermalState.addListener('thermalStateChange', ({ state }) => {
  switch (state) {
    case 'nominal':
      applyQualityPreset('high');
      break;
    case 'fair':
      applyQualityPreset('medium');
      break;
    case 'serious':
      applyQualityPreset('low');
      // Also reduce frame rate
      renderer.setAnimationLoop(null);
      setInterval(() => renderer.render(scene, camera), 33); // 30fps cap
      break;
    case 'critical':
      // Minimal rendering -- stop animation, render on demand only
      applyQualityPreset('low');
      renderer.setAnimationLoop(null);
      break;
  }
});
```

### 3. Memory Monitoring

```js
class MemoryMonitor {
  constructor(renderer, warningThresholdMB = 800) {
    this.renderer = renderer;
    this.warningThresholdMB = warningThresholdMB;
    this.history = [];
  }

  check() {
    const info = this.renderer.info;
    const entry = {
      timestamp: Date.now(),
      textures: info.memory.textures,
      geometries: info.memory.geometries,
      programs: info.programs?.length || 0,
    };
    
    this.history.push(entry);
    
    // Keep last 60 entries (5 minutes at 5s interval)
    if (this.history.length > 60) this.history.shift();
    
    // Detect memory leak: continuous growth over 10 samples
    if (this.history.length >= 10) {
      const recent = this.history.slice(-10);
      const textureGrowth = recent[9].textures - recent[0].textures;
      const geometryGrowth = recent[9].geometries - recent[0].geometries;
      
      if (textureGrowth > 5 || geometryGrowth > 10) {
        console.warn('[MemoryMonitor] Possible memory leak detected!', {
          textureGrowth,
          geometryGrowth,
          period: '50 seconds',
        });
      }
    }
    
    // Use performance.memory if available (Chrome-based)
    if (performance.memory) {
      const usedMB = performance.memory.usedJSHeapSize / 1024 / 1024;
      if (usedMB > this.warningThresholdMB) {
        console.warn(`[MemoryMonitor] JS heap at ${usedMB.toFixed(0)}MB (threshold: ${this.warningThresholdMB}MB)`);
      }
    }
    
    return entry;
  }

  startMonitoring(intervalMs = 5000) {
    this.intervalId = setInterval(() => this.check(), intervalMs);
  }

  stopMonitoring() {
    clearInterval(this.intervalId);
  }
}
```

### 4. Touch Input Optimization

iOS touch events in WKWebView have quirks that affect 3D interaction:

```js
// Prevent default touch behaviors that interfere with 3D controls
document.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });

// Disable iOS rubber-banding on the 3D canvas
const canvas = renderer.domElement;
canvas.style.touchAction = 'none';        // Prevent pan/zoom gestures
canvas.style.webkitUserSelect = 'none';   // Prevent text selection
canvas.style.webkitTouchCallout = 'none'; // Prevent callout on long-press

// Use pointer events instead of mouse events for cross-platform
canvas.addEventListener('pointerdown', onPointerDown);
canvas.addEventListener('pointermove', onPointerMove);
canvas.addEventListener('pointerup', onPointerUp);
```

### 5. Splash Screen to Loading Transition

Use the Capacitor splash screen to hide the initial Three.js loading:

```js
import { SplashScreen } from '@capacitor/splash-screen';

async function init() {
  // SplashScreen is showing...
  
  // Load critical assets
  await loadEssentialAssets();
  
  // First render
  renderer.render(scene, camera);
  
  // Hide splash after first frame is ready
  await SplashScreen.hide({ fadeOutDuration: 300 });
  
  // Continue loading non-critical assets in background
  loadSecondaryAssets();
}
```

### 6. Background/Foreground Lifecycle

WKWebView behavior when app enters background:

```js
import { App } from '@capacitor/app';

let wasRendering = false;

App.addListener('appStateChange', ({ isActive }) => {
  if (!isActive) {
    // Entering background
    wasRendering = renderer.info.autoReset; // or check your own flag
    renderer.setAnimationLoop(null);        // STOP rendering completely
    // iOS may reclaim WebGL context in background
  } else {
    // Returning to foreground
    if (wasRendering) {
      // Check if context is still valid
      const gl = renderer.getContext();
      if (gl.isContextLost()) {
        // Context was lost -- need full re-initialization
        reinitializeRenderer();
      } else {
        // Context survived -- resume rendering
        renderer.setAnimationLoop(animate);
      }
    }
  }
});
```

---

## Common iOS-Specific Issues & Fixes

### Issue: White Screen After Loading
- **Cause**: WKWebView process killed due to memory pressure
- **Fix**: Reduce total memory footprint; implement `webViewWebContentProcessDidTerminate` delegate
  to auto-reload; add loading state management

### Issue: Gradual FPS Degradation
- **Cause**: Thermal throttling
- **Fix**: Implement adaptive quality; reduce sustained GPU load to <70%;
  consider 30fps cap on mobile

### Issue: Choppy Touch Rotation
- **Cause**: Main thread blocked by JavaScript; touch events delayed
- **Fix**: Ensure animation loop is lean; offload computation to workers;
  use `requestAnimationFrame` correctly; avoid synchronous I/O

### Issue: Black Screen on Wake from Background
- **Cause**: WebGL context lost while in background
- **Fix**: Implement context loss/restore handlers (see Context Loss section above)

### Issue: Audio Stuttering During 3D Rendering
- **Cause**: Web Audio and WebGL competing for resources on same thread
- **Fix**: Use Audio Worklet if available; reduce rendering load; consider AudioContext.suspend()
  during heavy 3D transitions

### Issue: App Store Rejection for Battery Drain
- **Cause**: Continuous 60fps rendering even when idle
- **Fix**: Render on demand; implement idle detection; reduce to 30fps after user inactivity;
  stop rendering when app is in background
