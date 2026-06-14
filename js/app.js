/**
 * app.js - 五区之门3D场景主应用逻辑
 * 整合所有模块，实现完整的五区沉浸式3D体验
 * 严格按照需求文档v2.1（§5.2）实现
 */

// 主应用类
class App3D {
  constructor() {
    this.sceneManager = null;
    this.controller = null;
    this.doorInteraction = null;
    this.particleEffects = null;
    this.currentZone = null;
    this.config = {
      buildingDistance: 20,
      loadingDuration: 3000
    };
  }

  async init() {
    console.log('[App3D] 初始化五区之门3D场景...');
    this.showLoading();

    // 1. WebGL检测（需求文档§5.2.6）
    const webglInfo = window.SceneLoader.checkWebGLSupport();
    if (!webglInfo.supported) {
      console.warn('[App3D] WebGL不支持，降级到2D界面');
      this.showFallback2D();
      return;
    }

    // 2. 场景加载器（需求文档§5.2.6第4模块）
    this.sceneLoader = new window.SceneLoader();

    // 3. 预加载主场景（门模型优先）
    this.sceneLoader.preloadMainScene(
      (progress) => {
        // 更新加载进度条
        document.getElementById('loading-progress').style.width = `${progress * 100}%`;
        document.getElementById('loading-text').textContent = `正在加载五区之门... ${Math.round(progress * 100)}%`;
      },
      () => {
        // 主场景加载完成，初始化3D场景
        this.init3DScene();
      },
      () => {
        // 加载超时，降级到2D
        this.showFallback2D();
      }
    );

    this.initUIEvents();
  }

  /**
   * 初始化3D场景（主场景加载完成后调用）
   */
  init3DScene() {
    console.log('[App3D] 初始化3D场景...');

    this.sceneManager = window.sceneManager;
    this.sceneManager.init();

    this.particleEffects = new window.ParticleEffects(this.sceneManager.getScene());
    this.particleEffects.init();

    this.controller = new window.FirstPersonController(this.sceneManager.getCamera());

    this.doorInteraction = new window.DoorInteraction(
      this.sceneManager.getCamera(),
      this.sceneManager.getScene()
    );

    // 3D过渡场景管理器（需求文档§5.2.5）
    this.zoneScenes = new window.ZoneScenes(
      this.sceneManager.getScene(),
      this.sceneManager.getCamera()
    );

    this.createFiveZones();

    setTimeout(() => this.hideLoading(), 500);
    this.startRenderLoop();

    console.log('[App3D] 3D场景初始化完成！');
  }

  /**
   * 显示2D降级界面（WebGL不支持或加载超时）
   */
  showFallback2D() {
    console.log('[App3D] 显示2D降级界面');
    const loadingScreen = document.getElementById('loading-screen');
    loadingScreen.style.display = 'none';

    // 创建2D降级界面
    const fallback = document.createElement('div');
    fallback.id = 'fallback-2d';
    fallback.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: linear-gradient(135deg, #87CEEB 0%, #E0F7FA 100%);
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      font-family: 'PingFang SC', sans-serif; padding: 20px;
    `;
    fallback.innerHTML = `
      <h1 style="font-size: 32px; color: #333;">五区之门</h1>
      <p style="font-size: 16px; color: #666; margin: 20px 0;">您的设备不支持3D场景，已自动切换到2D导航模式</p>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; max-width: 800px;">
        <div style="background: #fff; border-radius: 10px; padding: 20px; text-align: center; cursor: pointer; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <div style="font-size: 40px;">🌆</div><h3>成人区</h3><p>商业中心</p>
        </div>
        <div style="background: #fff; border-radius: 10px; padding: 20px; text-align: center; cursor: pointer; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <div style="font-size: 40px;">🎒</div><h3>青少年区</h3><p>学习中心</p>
        </div>
        <div style="background: #fff; border-radius: 10px; padding: 20px; text-align: center; cursor: pointer; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <div style="font-size: 40px;">🧸</div><h3>儿童区</h3><p>游乐中心</p>
        </div>
        <div style="background: #fff; border-radius: 10px; padding: 20px; text-align: center; cursor: pointer; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <div style="font-size: 40px;">🏯</div><h3>老年区</h3><p>养生中心</p>
        </div>
        <div style="background: #fff; border-radius: 10px; padding: 20px; text-align: center; cursor: pointer; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <div style="font-size: 40px;">♿</div><h3>残障友好区</h3><p>无障碍中心</p>
        </div>
      </div>
    `;
    document.body.appendChild(fallback);
  }

  createFiveZones() {
    console.log('[App3D] 创建五区建筑...');
    const zones = [
      { id: 'adult',     name: '成人区',     angle: 0,                    modelFunction: window.createAdultBuilding },
      { id: 'teen',       name: '青少年区',   angle: (2 * Math.PI) / 5, modelFunction: window.createTeenBuilding },
      { id: 'children',   name: '儿童区',     angle: (4 * Math.PI) / 5, modelFunction: window.createChildrenBuilding },
      { id: 'elderly',   name: '老年区',     angle: (6 * Math.PI) / 5, modelFunction: window.createElderlyBuilding },
      { id: 'accessible', name: '残障友好区', angle: (8 * Math.PI) / 5, modelFunction: window.createAccessibleBuilding }
    ];

    zones.forEach(zone => {
      const x = this.config.buildingDistance * Math.cos(zone.angle);
      const z = this.config.buildingDistance * Math.sin(zone.angle);
      const building = zone.modelFunction();
      building.position.set(x, 0, z);
      this.sceneManager.addBuilding(building);

      const door = this.createDoor(zone.id);
      door.position.set(x, 1.5, z + 3);
      door.lookAt(x, 1.5, z);

      this.doorInteraction.addDoor({
        mesh: door,
        zoneName: zone.name,
        zoneId: zone.id,
        onEnter: () => this.enterZone(zone.id, zone.name)
      });
    });

    console.log('[App3D] 五区建筑创建完成');
  }

  createDoor(zoneId) {
    const geometry = new THREE.BoxGeometry(3, 5, 0.5);
    const doorColors = {
      'adult': 0x87CEEB,
      'teen': 0x90EE90,
      'children': 0xFFD700,
      'elderly': 0xFFB6C1,
      'accessible': 0xFF6347
    };
    const material = new THREE.MeshLambertMaterial({
      color: doorColors[zoneId] || 0xFFFFFF,
      emissive: 0x000000
    });
    const door = new THREE.Mesh(geometry, material);
    door.castShadow = true;
    return door;
  }

  /**
   * 进入区域：开门动画→镜头推进→内部场景（需求文档§5.2.4）
   */
  enterZone(zoneId, zoneName) {
    console.log(`[App3D] 进入区域: ${zoneName} (${zoneId})`);
    
    // 计算门的位置（根据五区环形布局）
    const angle = this.getZoneAngle(zoneId);
    const doorX = this.config.buildingDistance * Math.cos(angle);
    const doorZ = this.config.buildingDistance * Math.sin(angle) + 3;
    const doorPos = new THREE.Vector3(doorX, 1.5, doorZ);
    
    // 计算镜头推进目标位置（门后2米）
    const direction = new THREE.Vector3(-doorX, 0, -doorZ).normalize();
    const targetPos = doorPos.clone().add(direction.multiplyScalar(2));
    targetPos.y = this.config.cameraHeight;
    
    console.log(`[App3D] 镜头推进: ${doorPos} → ${targetPos}`);
    
    // 隐藏门交互提示
    document.getElementById('zone-prompt').classList.add('hidden');
    
    // 播放镜头推进动画（3秒）
    this.sceneManager.pushCamera(targetPos, 3000, () => {
      // 镜头推进完成后，显示内部场景
      this.showInternalScene(zoneId, zoneName);
    });
  }

  /**
   * 隐藏主场景的建筑和门（显示3D过渡场景时）
   */
  hideMainSceneObjects() {
    this.sceneManager.buildings.forEach(b => b.visible = false);
    this.doorInteraction.doors.forEach(d => d.visible = false);
    // 隐藏水面和天空
    if (this.sceneManager.waterMesh) this.sceneManager.waterMesh.visible = false;
  }

  /**
   * 显示主场景的建筑和门（返回主场景时）
   */
  showMainSceneObjects() {
    this.sceneManager.buildings.forEach(b => b.visible = true);
    this.doorInteraction.doors.forEach(d => { d.visible = true; d.userData.isOpen = false; });
    if (this.sceneManager.waterMesh) this.sceneManager.waterMesh.visible = true;
  }

  /**
   * 根据区域ID获取角度
   */
  getZoneAngle(zoneId) {
    const angles = {
      'adult': 0,
      'teen': (2 * Math.PI) / 5,
      'children': (4 * Math.PI) / 5,
      'elderly': (6 * Math.PI) / 5,
      'accessible': (8 * Math.PI) / 5
    };
    return angles[zoneId] || 0;
  }

  /**
   * 显示内部场景（3D过渡→2D界面，需求文档§5.2.5）
   */
  showInternalScene(zoneId, zoneName) {
    console.log(`[App3D] 显示内部场景: ${zoneName}`);
    this.currentZone = zoneId;

    // 切换粒子主题
    this.switchParticleTheme(zoneId);

    // 显示返回按钮
    document.getElementById('back-button').classList.remove('hidden');

    // 显示3D过渡场景（5秒）
    this.showTransitionScene(zoneId, () => {
      // 3D过渡后，显示2D界面
      this.show2DInterface(zoneId, zoneName);
    });
  }

  /**
   * 显示3D过渡场景（5秒）
   */
  showTransitionScene(zoneId, callback) {
    console.log(`[App3D] 3D过渡场景: ${zoneId}`);
    
    // 隐藏主场景的建筑和门，显示3D过渡场景
    this.hideMainSceneObjects();
    
    // 使用ZoneScenes显示各区3D过渡场景（5秒，需求文档§5.2.5）
    this.zoneScenes.showZoneScene(zoneId, () => {
      // 5秒3D过渡完成，切换到2D界面
      this.zoneScenes.clearCurrentScene();
      callback();
    });
  }

  /**
   * 显示2D界面（需求文档§5.2.5）
   */
  show2DInterface(zoneId, zoneName) {
    console.log(`[App3D] 显示2D界面: ${zoneName}`);
    
    // 创建2D界面叠加层
    let overlay = document.getElementById('zone-2d-interface');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'zone-2d-interface';
      overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(255, 255, 255, 0.95);
        z-index: 1000;
        overflow-y: auto;
        padding: 20px;
      `;
      document.body.appendChild(overlay);
    }
    
    // 根据区域显示不同内容
    const content = this.getZone2DContent(zoneId, zoneName);
    overlay.innerHTML = content;
    overlay.style.display = 'block';
    
    // 隐藏3D场景的canvas
    const canvas = document.querySelector('canvas');
    if (canvas) canvas.style.display = 'none';
  }

  /**
   * 获取区域2D界面内容
   */
  getZone2DContent(zoneId, zoneName) {
    const commonStyles = `
      body { font-family: 'PingFang SC', sans-serif; padding: 20px; }
      .header { display: flex; justify-content: space-between; align-items: center; }
      .back-btn { padding: 10px 20px; background: #87CEEB; border: none; border-radius: 5px; cursor: pointer; }
      .card { border: 1px solid #ddd; border-radius: 10px; padding: 20px; margin: 10px; }
    `;
    
    const contents = {
      'adult': `
        <style>${commonStyles}</style>
        <div class="header">
          <h1>🌆 成人区 - 商业中心</h1>
          <button class="back-btn" onclick="window.app3d.returnToMainScene()">返回</button>
        </div>
        <div class="card"><h3>Agent 列表</h3><p>专业工具、企业级应用...</p></div>
      `,
      'teen': `
        <style>${commonStyles}</style>
        <div class="header">
          <h1>🎒 青少年区 - 学习中心</h1>
          <button class="back-btn" onclick="window.app3d.returnToMainScene()">返回</button>
        </div>
        <div class="card"><h3>教育 Agent</h3><p>编程教育、学科辅导...</p></div>
      `,
      'children': `
        <style>${commonStyles}</style>
        <div class="header">
          <h1>🧸 儿童区 - 游乐中心</h1>
          <button class="back-btn" onclick="window.app3d.returnToMainScene()">返回</button>
        </div>
        <div class="card"><h3>互动故事</h3><p>童话世界、动画故事...</p></div>
      `,
      'elderly': `
        <style>${commonStyles}</style>
        <div class="header">
          <h1>🏯 老年区 - 养生中心</h1>
          <button class="back-btn" onclick="window.app3d.returnToMainScene()">返回</button>
        </div>
        <div class="card"><h3>大字版</h3><p>健康养生、家庭互动...</p></div>
      `,
      'accessible': `
        <style>${commonStyles}</style>
        <div class="header">
          <h1>♿ 残障友好区 - 无障碍中心</h1>
          <button class="back-btn" onclick="window.app3d.returnToMainScene()">返回</button>
        </div>
        <div class="card"><h3>高对比度</h3><p>屏幕阅读器、语音控制...</p></div>
      `
    };
    
    return contents[zoneId] || `<h1>${zoneName}</h1><button onclick="window.app3d.returnToMainScene()">返回</button>`;
  }

  /**
   * 根据区域切换粒子主题
   */
  switchParticleTheme(zoneId) {
    if (!this.particleEffects) return;
    const themeMap = {
      'adult': 'star',
      'teen': 'firefly',
      'children': 'cherry',
      'elderly': 'firefly',
      'accessible': 'firefly'
    };
    const theme = themeMap[zoneId] || 'firefly';
    this.particleEffects.setTheme(theme);
    console.log(`[App3D] 粒子主题切换为: ${theme}`);
  }

  /**
   * 返回主场景（需求文档§5.2.4）
   */
  returnToMainScene() {
    console.log('[App3D] 返回主场景');
    this.currentZone = null;
    
    // 隐藏2D界面
    const overlay = document.getElementById('zone-2d-interface');
    if (overlay) overlay.style.display = 'none';
    
    // 显示3D场景的canvas
    const canvas = document.querySelector('canvas');
    if (canvas) canvas.style.display = 'block';
    
    // 恢复主场景的建筑和门
    this.showMainSceneObjects();
    
    // 隐藏返回按钮
    document.getElementById('back-button').classList.add('hidden');
    
    // 重置镜头到主场景位置
    this.sceneManager.resetCamera(() => {
      // 镜头重置完成后，重置粒子主题
      if (this.particleEffects) {
        this.particleEffects.setTheme('firefly');
      }
      console.log('[App3D] 已返回主场景');
    });
  }

  startRenderLoop() {
    const loop = () => {
      requestAnimationFrame(loop);
      if (this.doorInteraction) this.doorInteraction.update();
      if (this.particleEffects) this.particleEffects.update();
      this.sceneManager.render();
    };
    loop();
  }

  initUIEvents() {
    document.getElementById('back-button').addEventListener('click', () => {
      this.returnToMainScene();
    });
  }

  showLoading() {
    const loadingScreen = document.getElementById('loading-screen');
    loadingScreen.classList.remove('fade-out');
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      document.getElementById('loading-progress').style.width = `${progress}%`;
      if (progress >= 100) clearInterval(interval);
    }, 200);
  }

  hideLoading() {
    const loadingScreen = document.getElementById('loading-screen');
    loadingScreen.classList.add('fade-out');
    setTimeout(() => {
      loadingScreen.style.display = 'none';
    }, 500);
  }
}

// 页面加载完成后初始化
window.addEventListener('DOMContentLoaded', () => {
  console.log('[App3D] 页面加载完成，开始初始化...');
  const app = new App3D();
  app.init();
  window.app3d = app; // 导出全局实例（方便调试）
});
