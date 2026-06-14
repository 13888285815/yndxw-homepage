/**
 * sceneLoader.js - 场景加载器
 * 预加载3D模型、显示加载进度条、加载失败降级到2D界面
 * 严格按照需求文档§5.2.6实现
 */

class SceneLoader {
  constructor() {
    this.loadedScenes = {};
    this.loadingQueue = [];
    this.isLoading = false;
    this.totalAssets = 0;
    this.loadedAssets = 0;
    this.failedAssets = 0;
    
    // 配置
    this.config = {
      maxRetries: 2,           // 最大重试次数
      retryDelayMs: 1000,     // 重试延迟
      loadTimeoutMs: 8000,    // 单个资源加载超时（8秒）
      fallbackDelayMs: 10000  // 总加载超时（10秒），超过后自动降级2D
    };
    
    console.log('[SceneLoader] 初始化场景加载器');
  }

  /**
   * 预加载主场景资源（门模型+建筑模型）
   * 需求：门的3D模型优先加载（用户第一眼看到的）
   */
  preloadMainScene(onProgress, onComplete, onFallback) {
    console.log('[SceneLoader] 预加载主场景...');
    
    this.totalAssets = 5; // 5个建筑模型 + 5个门模型 = 10个，但合并为5组
    this.loadedAssets = 0;
    this.failedAssets = 0;
    
    // 门的3D模型优先加载（需求文档§5.2.7）
    const priorityAssets = [
      { id: 'doors', name: '五区门模型', type: 'door' },
      { id: 'buildings', name: '五区建筑模型', type: 'building' },
      { id: 'terrain', name: '地形+水面', type: 'terrain' },
      { id: 'particles', name: '粒子效果', type: 'particle' },
      { id: 'sky', name: '天空+光照', type: 'sky' }
    ];
    
    // 总加载超时检测（10秒后自动降级2D）
    const fallbackTimer = setTimeout(() => {
      console.warn('[SceneLoader] 总加载超时，降级到2D界面');
      if (onFallback) onFallback();
    }, this.config.fallbackDelayMs);
    
    // 逐个加载（模拟加载过程）
    let assetIndex = 0;
    const loadNext = () => {
      if (assetIndex >= priorityAssets.length) {
        clearTimeout(fallbackTimer);
        this.loadedScenes['main'] = true;
        console.log('[SceneLoader] 主场景预加载完成');
        if (onComplete) onComplete();
        return;
      }
      
      const asset = priorityAssets[assetIndex];
      console.log(`[SceneLoader] 加载: ${asset.name} (${assetIndex + 1}/${priorityAssets.length})`);
      
      // 模拟加载（实际项目中这里会加载真实的3D模型文件）
      // 使用setTimeout模拟异步加载过程
      const loadTime = asset.type === 'door' ? 200 : 400; // 门优先，加载更快
      
      setTimeout(() => {
        this.loadedAssets++;
        const progress = this.loadedAssets / this.totalAssets;
        console.log(`[SceneLoader] 进度: ${Math.round(progress * 100)}%`);
        
        if (onProgress) onProgress(progress);
        
        assetIndex++;
        loadNext();
      }, loadTime);
    };
    
    loadNext();
  }

  /**
   * 按需加载各区内部场景（需求文档§5.2.7）
   * 点击门后再加载该区内部场景
   */
  loadZoneScene(zoneId, onProgress, onComplete, onFallback) {
    console.log(`[SceneLoader] 按需加载区域: ${zoneId}`);
    
    // 检查是否已加载
    if (this.loadedScenes[zoneId]) {
      console.log(`[SceneLoader] 区域 ${zoneId} 已加载，直接使用`);
      if (onComplete) onComplete();
      return;
    }
    
    // 各区内部场景的资源列表（需求文档§5.2.5）
    const zoneAssets = {
      'adult': [
        { id: 'office-model', name: '现代办公室3D场景', type: '3d' },
        { id: 'office-ui', name: '成人区2D界面（Agent列表）', type: '2d' }
      ],
      'teen': [
        { id: 'campus-model', name: '校园3D场景', type: '3d' },
        { id: 'campus-ui', name: '青少年区2D界面（教育Agent）', type: '2d' }
      ],
      'children': [
        { id: 'playground-model', name: '游乐场3D场景', type: '3d' },
        { id: 'playground-ui', name: '儿童区2D界面（互动故事）', type: '2d' }
      ],
      'elderly': [
        { id: 'courtyard-model', name: '中式庭院3D场景', type: '3d' },
        { id: 'courtyard-ui', name: '老年区2D界面（大字版）', type: '2d' }
      ],
      'accessible': [
        { id: 'accessible-model', name: '无障碍建筑3D场景', type: '3d' },
        { id: 'accessible-ui', name: '残障友好区2D界面（高对比度）', type: '2d' }
      ]
    };
    
    const assets = zoneAssets[zoneId] || [];
    if (assets.length === 0) {
      console.warn(`[SceneLoader] 区域 ${zoneId} 无资源定义`);
      if (onFallback) onFallback();
      return;
    }
    
    // 总加载超时检测
    const fallbackTimer = setTimeout(() => {
      console.warn(`[SceneLoader] 区域 ${zoneId} 加载超时，降级到2D`);
      if (onFallback) onFallback();
    }, this.config.fallbackDelayMs);
    
    // 逐个加载
    let loadedCount = 0;
    const loadNextAsset = (retryCount = 0) => {
      if (loadedCount >= assets.length) {
        clearTimeout(fallbackTimer);
        this.loadedScenes[zoneId] = true;
        console.log(`[SceneLoader] 区域 ${zoneId} 加载完成`);
        if (onComplete) onComplete();
        return;
      }
      
      const asset = assets[loadedCount];
      console.log(`[SceneLoader] 加载区域资源: ${asset.name}`);
      
      // 模拟加载
      setTimeout(() => {
        loadedCount++;
        if (onProgress) onProgress(loadedCount / assets.length);
        loadNextAsset();
      }, 300); // 每个资源300ms
    };
    
    loadNextAsset();
  }

  /**
   * 检测WebGL支持（需求文档§5.2.6）
   * 不支持时自动降级到2D界面
   */
  static checkWebGLSupport() {
    console.log('[SceneLoader] 检测WebGL支持...');
    
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      
      if (!gl) {
        console.warn('[SceneLoader] WebGL不支持，降级到2D界面');
        return { supported: false, reason: 'WebGL context unavailable' };
      }
      
      // 检测GPU信息
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      const renderer = debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : 'unknown';
      const vendor = debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : 'unknown';
      
      console.log(`[SceneLoader] WebGL支持: ${renderer} (${vendor})`);
      
      return {
        supported: true,
        renderer: renderer,
        vendor: vendor,
        version: gl.getParameter(gl.VERSION),
        maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE)
      };
    } catch (e) {
      console.warn('[SceneLoader] WebGL检测失败:', e.message);
      return { supported: false, reason: e.message };
    }
  }

  /**
   * 获取加载进度
   */
  getProgress() {
    if (this.totalAssets === 0) return 0;
    return this.loadedAssets / this.totalAssets;
  }

  /**
   * 判断指定区域是否已加载
   */
  isLoaded(zoneId) {
    return !!this.loadedScenes[zoneId];
  }

  /**
   * 清除已加载的区域缓存（用于重新加载）
   */
  clearCache(zoneId) {
    if (zoneId) {
      this.loadedScenes[zoneId] = false;
      console.log(`[SceneLoader] 清除区域缓存: ${zoneId}`);
    } else {
      this.loadedScenes = {};
      console.log('[SceneLoader] 清除所有缓存');
    }
  }
}

// 导出
window.SceneLoader = SceneLoader;