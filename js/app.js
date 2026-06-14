/**
 * app-3d.js - 五区之门3D场景主应用逻辑
 * 整合所有模块，实现完整的五区沉浸式3D体验
 */

// 主应用类
class App3D {
  constructor() {
    this.sceneManager = null;
    this.controller = null;
    this.doorInteraction = null;
    this.currentZone = null; // 当前所在区域（null表示在主场景）
    
    // 配置
    this.config = {
      buildingDistance: 20, // 建筑距离中心的距离
      loadingDuration: 3000 // 加载画面显示时长（毫秒）
    };
  }

  /**
   * 初始化应用
   */
  async init() {
    console.log('[App3D] 初始化五区之门3D场景...');
    
    // 显示加载画面
    this.showLoading();
    
    // 初始化场景管理器
    this.sceneManager = window.sceneManager;
    this.sceneManager.init();
    
    // 初始化粒子效果
    this.particleEffects = new window.ParticleEffects(this.sceneManager.getScene());
    this.particleEffects.init();
    
    // 初始化第一人称控制器
    this.controller = new window.FirstPersonController(this.sceneManager.getCamera());
    
    // 初始化门交互管理器
    this.doorInteraction = new window.DoorInteraction(
      this.sceneManager.getCamera(),
      this.sceneManager.getScene()
    );
    
    // 创建五区建筑
    this.createFiveZones();
    
    // 隐藏加载画面
    setTimeout(() => this.hideLoading(), this.config.loadingDuration);
    
    // 开始渲染循环
    this.startRenderLoop();
    
    // 初始化UI事件
    this.initUIEvents();
    
    console.log('[App3D] 初始化完成！');
  }

  /**
   * 创建五区建筑
   */
  createFiveZones() {
    console.log('[App3D] 创建五区建筑...');
    
    const zones = [
      {
        id: 'adult',
        name: '成人区',
        angle: 0, // 角度（弧度）
        modelFunction: window.createAdultBuilding
      },
      {
        id: 'teen',
        name: '青少年区',
        angle: (2 * Math.PI) / 5, // 72度
        modelFunction: window.createTeenBuilding
      },
      {
        id: 'children',
        name: '儿童区',
        angle: (4 * Math.PI) / 5, // 144度
        modelFunction: window.createChildrenBuilding
      },
      {
        id: 'elderly',
        name: '老年区',
        angle: (6 * Math.PI) / 5, // 216度
        modelFunction: window.createElderlyBuilding
      },
      {
        id: 'accessible',
        name: '残障友好区',
        angle: (8 * Math.PI) / 5, // 288度
        modelFunction: window.createAccessibleBuilding
      }
    ];

    zones.forEach(zone => {
      // 计算建筑位置（环形布局）
      const x = this.config.buildingDistance * Math.cos(zone.angle);
      const z = this.config.buildingDistance * Math.sin(zone.angle);
      
      // 创建建筑（使用详细模型）
      const building = zone.modelFunction();
      building.position.set(x, 0, z);
      this.sceneManager.addBuilding(building);
      
      // 创建门（简化版：用扁平立方体放在建筑前面）
      const door = this.createDoor(zone.id);
      door.position.set(x, 1.5, z + 3); // 放在建筑前面
      door.lookAt(x, 1.5, z); // 门朝向中心
      
      // 添加门交互
      this.doorInteraction.addDoor({
        mesh: door,
        zoneName: zone.name,
        zoneId: zone.id,
        onEnter: () => this.enterZone(zone.id, zone.name)
      });
    });
    
    console.log('[App3D] 五区建筑创建完成');
  }

  /**
   * 创建建筑（简化版）
   * @param {number} color - 建筑颜色
   * @returns {THREE.Mesh} 建筑3D对象
   */
  /**
   * 创建门（简化版）
   * @param {string} zoneId - 区域ID（用于不同颜色）
   * @returns {THREE.Mesh} 门3D对象
   */
  createDoor(zoneId) {
    const geometry = new THREE.BoxGeometry(3, 5, 0.5);
    
    // 不同区域不同门颜色
    const doorColors = {
      'adult': 0x87CEEB, // 浅蓝色
      'teen': 0x90EE90, // 浅绿色
      'children': 0xFFD700, // 金色
      'elderly': 0xFFB6C1, // 浅粉色
      'accessible': 0xFF6347 // 番茄红
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
   * 进入区域
   * @param {string} zoneId - 区域ID
   * @param {string} zoneName - 区域名称
   */
  enterZone(zoneId, zoneName) {
    console.log(`[App3D] 进入区域: ${zoneName} (${zoneId})`);
    
    this.currentZone = zoneId;
    
    // 显示返回按钮
    document.getElementById('back-button').classList.remove('hidden');
    
    // 这里应该切换到该区的内部场景
    // TODO: 实现内部场景切换
    alert(`欢迎来到${zoneName}！\n\n（内部场景开发中...）`);
  }

  /**
   * 返回主场景
   */
  returnToMainScene() {
    console.log('[App3D] 返回主场景');
    
    this.currentZone = null;
    
    // 隐藏返回按钮
    document.getElementById('back-button').classList.add('hidden');
  }

  /**
   * 开始渲染循环
   */
  startRenderLoop() {
    const loop = () => {
      requestAnimationFrame(loop);
      
      // 更新门交互
      if (this.doorInteraction) {
        this.doorInteraction.update();
      }
      
      // 更新粒子效果
      if (this.particleEffects) {
        this.particleEffects.update();
      }
      
      // 渲染场景
      this.sceneManager.render();
    };
    
    loop();
  }

  /**
   * 初始化UI事件
   */
  initUIEvents() {
    // 返回按钮
    document.getElementById('back-button').addEventListener('click', () => {
      this.returnToMainScene();
    });
  }

  /**
   * 显示加载画面
   */
  showLoading() {
    const loadingScreen = document.getElementById('loading-screen');
    loadingScreen.classList.remove('fade-out');
    
    // 模拟加载进度
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      document.getElementById('loading-progress').style.width = `${progress}%`;
      
      if (progress >= 100) {
        clearInterval(interval);
      }
    }, 200);
  }

  /**
   * 隐藏加载画面
   */
  hideLoading() {
    const loadingScreen = document.getElementById('loading-screen');
    loadingScreen.classList.add('fade-out');
    
    // 动画结束后移除
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
  
  // 导出全局实例（方便调试）
  window.app3d = app;
});
