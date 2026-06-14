/**
 * app.js - 五区之门3D场景主应用逻辑
 * 整合所有模块，实现完整的五区沉浸式3D体验
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

    this.sceneManager = window.sceneManager;
    this.sceneManager.init();

    this.particleEffects = new window.ParticleEffects(this.sceneManager.getScene());
    this.particleEffects.init();

    this.controller = new window.FirstPersonController(this.sceneManager.getCamera());

    this.doorInteraction = new window.DoorInteraction(
      this.sceneManager.getCamera(),
      this.sceneManager.getScene()
    );

    this.createFiveZones();

    setTimeout(() => this.hideLoading(), this.config.loadingDuration);
    this.startRenderLoop();
    this.initUIEvents();

    console.log('[App3D] 初始化完成！');
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
   * 进入区域：切换粒子主题，儿童区加载内部场景
   */
  enterZone(zoneId, zoneName) {
    console.log(`[App3D] 进入区域: ${zoneName} (${zoneId})`);
    this.currentZone = zoneId;

    // 切换粒子主题
    this.switchParticleTheme(zoneId);

    document.getElementById('back-button').classList.remove('hidden');

    if (zoneId === 'children') {
      this.loadChildrenScene();
    } else {
      alert(`欢迎来到${zoneName}！\n\n（内部场景开发中...）`);
    }
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
   * 儿童区内部场景（简易室内游乐场）
   */
  loadChildrenScene() {
    console.log('[App3D] 加载儿童区内部场景...');
    alert('🎠 欢迎来到儿童区！\n\n这是一个五彩缤纷的室内游乐场！\n（完整3D内部场景下一步开发）');
    // TODO: 实际实现：
    // 1. 摄像机动画移向门然后切换场景
    // 2. 加载儿童区内部（彩色球体+滑梯+蹦床）
    // 3. 更新返回按钮逻辑
  }

  /**
   * 返回主场景：重置粒子主题
   */
  returnToMainScene() {
    console.log('[App3D] 返回主场景');
    this.currentZone = null;
    document.getElementById('back-button').classList.add('hidden');

    // 返回主场景时重置为萤火虫主题
    if (this.particleEffects) {
      this.particleEffects.setTheme('firefly');
    }
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
