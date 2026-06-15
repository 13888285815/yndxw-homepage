/**
 * app.js - 五区之门3D场景主应用逻辑
 * 整合所有模块，实现完整的五区沉浸式3D体验
 * 严格按照需求文档v2.1（§5.2）实现
 */

// 生产环境静默console.log（保留warn/error）
if (location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
  const _origLog = console.log;
  console.log = function() {
    // 仅保留[App3D]和[SceneManager]关键日志
    const msg = Array.from(arguments).join(' ');
    if (msg.includes('[ERROR]') || msg.includes('[CRITICAL]')) {
      _origLog.apply(console, arguments);
    }
  };
}

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
        building: building,
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
    
    // 隐藏3D场景的canvas并暂停渲染（节省GPU）
    this.pauseRendering();
    const canvas = document.querySelector('canvas');
    if (canvas) canvas.style.display = 'none';
  }

  /**
   * 获取区域2D界面内容
   */
  getZone2DContent(zoneId, zoneName) {
    const commonStyles = `
      .zone-page { font-family: 'PingFang SC', -apple-system, sans-serif; }
      .zone-header { display: flex; justify-content: space-between; align-items: center; padding: 15px 20px; }
      .zone-title { font-size: 28px; font-weight: 600; }
      .back-btn { padding: 10px 20px; border: none; border-radius: 8px; cursor: pointer; font-size: 16px; transition: all 0.2s; }
      .module-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; padding: 20px; }
      .module-card { border-radius: 12px; padding: 20px; transition: transform 0.2s, box-shadow 0.2s; cursor: pointer; }
      .module-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.1); }
      .module-icon { font-size: 40px; margin-bottom: 10px; }
      .module-name { font-size: 18px; font-weight: 600; margin-bottom: 8px; }
      .module-desc { font-size: 14px; line-height: 1.5; }
      .module-badge { font-size: 12px; padding: 2px 8px; border-radius: 4px; margin-top: 8px; display: inline-block; }
    `;
    const contents = {
      'adult': `<style>${commonStyles}.zone-page{background:linear-gradient(135deg,#1a1a2e,#16213e);color:#fff}.back-btn{background:#4361ee;color:#fff}.module-card{background:rgba(255,255,255,.1);border:1px solid rgba(67,97,238,.3)}.module-name{color:#4cc9f0}.module-badge{background:#f72585;color:#fff}.module-badge.free{background:#4cc9f0;color:#000}</style><div class="zone-page"><div class="zone-header"><div class="zone-title">🌆 成人区 · 商业中心</div><button class="back-btn" onclick="window.app3d.returnToMainScene()">← 返回五区之门</button></div><div class="module-grid"><div class="module-card"><div class="module-icon">🤖</div><div class="module-name">AI Agent 市场</div><div class="module-desc">专业AI助手，涵盖编程、设计、数据分析</div><span class="module-badge">付费</span></div><div class="module-card"><div class="module-icon">🔧</div><div class="module-name">Skill 交易市场</div><div class="module-desc">技能工具交易，订阅解锁高级功能</div><span class="module-badge">订阅制</span></div><div class="module-card"><div class="module-icon">💰</div><div class="module-name">Token 购买</div><div class="module-desc">购买Token使用平台工具，灵活计费</div><span class="module-badge free">基础免费</span></div><div class="module-card"><div class="module-icon">🔑</div><div class="module-name">API 密钥管理</div><div class="module-desc">管理API密钥，远程调用平台服务</div><span class="module-badge free">免费</span></div><div class="module-card"><div class="module-icon">📦</div><div class="module-name">个人仓库</div><div class="module-desc">类GitHub，管理数字仓库和项目</div><span class="module-badge free">免费</span></div><div class="module-card"><div class="module-icon">📊</div><div class="module-name">数据分析面板</div><div class="module-desc">实时数据可视化，智能分析报告</div><span class="module-badge">高级</span></div><div class="module-card"><div class="module-icon">💵</div><div class="module-name">收入结算</div><div class="module-desc">卖家收入查看、提现申请</div><span class="module-badge free">免费</span></div><div class="module-card"><div class="module-icon">🎯</div><div class="module-name">实时协作</div><div class="module-desc">WebSocket多人协作，视频处理</div><span class="module-badge">付费</span></div></div></div>`,
      'teen': `<style>${commonStyles}.zone-page{background:linear-gradient(135deg,#E3F2FD,#BBDEFB);color:#333}.back-btn{background:#2196F3;color:#fff}.module-card{background:#fff;border:1px solid #E3F2FD}.module-badge{background:#FF9800;color:#fff}.module-badge.free{background:#4CAF50;color:#fff}</style><div class="zone-page"><div class="zone-header"><div class="zone-title">🎒 青少年区 · 学习中心</div><button class="back-btn" onclick="window.app3d.returnToMainScene()">← 返回五区之门</button></div><div class="module-grid"><div class="module-card"><div class="module-icon">💻</div><div class="module-name">编程教育 Agent</div><div class="module-desc">Python/JavaScript入门，游戏化编程</div><span class="module-badge free">免费</span></div><div class="module-card"><div class="module-icon">📐</div><div class="module-name">学科辅导 Agent</div><div class="module-desc">数学/物理/化学/英语，互动式学习</div><span class="module-badge free">免费</span></div><div class="module-card"><div class="module-icon">🎨</div><div class="module-name">兴趣培养 Agent</div><div class="module-desc">音乐/绘画/摄影，AI辅助创意</div><span class="module-badge free">免费</span></div><div class="module-card"><div class="module-icon">📈</div><div class="module-name">学习进度跟踪</div><div class="module-desc">AI自动记录学习轨迹，可视化报告</div><span class="module-badge free">免费</span></div><div class="module-card"><div class="module-icon">👨‍👩‍👧</div><div class="module-name">家长监控面板</div><div class="module-desc">使用时间、内容过滤、成绩报告</div><span class="module-badge">需家长绑定</span></div></div></div>`,
      'children': `<style>${commonStyles}.zone-page{background:linear-gradient(135deg,#FFF9C4,#FFEB3B);color:#333}.back-btn{background:#FF4081;color:#fff;border-radius:20px;font-size:20px;padding:15px 30px}.module-card{background:#fff;border:3px solid #FF4081;border-radius:20px}.module-icon{font-size:60px}.module-name{font-size:24px;color:#FF4081}.module-desc{font-size:18px}.module-badge{background:#4CAF50;color:#fff;font-size:16px;padding:4px 12px;border-radius:10px}</style><div class="zone-page"><div class="zone-header"><div class="zone-title" style="font-size:36px">🧸 儿童区 · 游乐中心</div><button class="back-btn" onclick="window.app3d.returnToMainScene()">← 回去</button></div><div class="module-grid"><div class="module-card"><div class="module-icon">📖</div><div class="module-name">互动故事</div><div class="module-desc">AI语音讲故事，互动选择结局</div><span class="module-badge">免费</span></div><div class="module-card"><div class="module-icon">🧩</div><div class="module-name">益智游戏</div><div class="module-desc">数学游戏、拼图、记忆训练</div><span class="module-badge">免费</span></div><div class="module-card"><div class="module-icon">🚦</div><div class="module-name">安全教育</div><div class="module-desc">交通安全、消防安全、网络安全</div><span class="module-badge">免费</span></div><div class="module-card"><div class="module-icon">👨‍👩‍👧</div><div class="module-name">家长监控</div><div class="module-desc">使用时间、内容过滤、安全浏览</div><span class="module-badge">需家长绑定</span></div></div></div>`,
      'elderly': `<style>${commonStyles}.zone-page{background:linear-gradient(135deg,#FFF3E0,#FFB74D);color:#333}.back-btn{background:#8D6E63;color:#fff;font-size:22px;padding:15px 30px}.module-card{background:#fff;border:2px solid #FFB74D}.module-icon{font-size:50px}.module-name{font-size:24px;color:#8D6E63}.module-desc{font-size:20px;line-height:1.8}.module-badge{background:#4CAF50;color:#fff;font-size:18px}</style><div class="zone-page"><div class="zone-header"><div class="zone-title" style="font-size:36px">🏯 老年区 · 养生中心</div><button class="back-btn" onclick="window.app3d.returnToMainScene()">← 回去</button></div><div class="module-grid"><div class="module-card"><div class="module-icon">🎤</div><div class="module-name">语音助手</div><div class="module-desc">语音输入输出，不用打字也能用</div><span class="module-badge">免费</span></div><div class="module-card"><div class="module-icon">❤️</div><div class="module-name">健康监测</div><div class="module-desc">血压、血糖记录，用药提醒</div><span class="module-badge">免费</span></div><div class="module-card"><div class="module-icon">🆘</div><div class="module-name">紧急呼叫</div><div class="module-desc">一键呼叫家人或急救服务</div><span class="module-badge">免费</span></div><div class="module-card"><div class="module-icon">🤝</div><div class="module-name">社区互助</div><div class="module-desc">志愿服务、邻里帮助</div><span class="module-badge">免费</span></div><div class="module-card"><div class="module-icon">🌿</div><div class="module-name">养生知识</div><div class="module-desc">养生知识推送，健康生活指南</div><span class="module-badge">免费</span></div></div></div>`,
      'accessible': `<style>${commonStyles}.zone-page{background:#fff;color:#000}.back-btn{background:#FF6347;color:#fff;font-size:22px;padding:15px 30px;border:3px solid #000}.module-card{background:#fff;border:3px solid #000}.module-icon{font-size:50px}.module-name{font-size:26px;color:#000;font-weight:700}.module-desc{font-size:22px;line-height:2;color:#333}.module-badge{background:#000;color:#fff;font-size:18px;border:2px solid #FF6347}</style><div class="zone-page"><div class="zone-header"><div class="zone-title" style="font-size:38px;font-weight:700">♿ 残障友好区 · 无障碍中心</div><button class="back-btn" onclick="window.app3d.returnToMainScene()">← 回去</button></div><div class="module-grid"><div class="module-card"><div class="module-icon">🔊</div><div class="module-name">屏幕阅读器</div><div class="module-desc">ARIA标签、语音朗读全站内容</div><span class="module-badge">免费</span></div><div class="module-card"><div class="module-icon">⌨️</div><div class="module-name">键盘导航</div><div class="module-desc">2D界面支持完整键盘导航</div><span class="module-badge">免费</span></div><div class="module-card"><div class="module-icon">🎙️</div><div class="module-name">语音控制</div><div class="module-desc">语音命令替代鼠标点击</div><span class="module-badge">免费</span></div><div class="module-card"><div class="module-icon">🎨</div><div class="module-name">个性化设置</div><div class="module-desc">颜色方案、字体大小(≥24px)、语速</div><span class="module-badge">免费</span></div><div class="module-card"><div class="module-icon">👁️</div><div class="module-name">高对比度模式</div><div class="module-desc">黑白/护眼模式，WCAG 2.1 AA</div><span class="module-badge">免费</span></div></div></div>`
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
    
    // 显示3D场景的canvas并恢复渲染
    const canvas = document.querySelector('canvas');
    if (canvas) canvas.style.display = 'block';
    this.resumeRendering();
    
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
    this._animFrameId = null;
    this._isRendering = true;
    this._lastRenderTime = 0;
    this._targetFPS = 60;  // 目标帧率（可动态调整）
    this._frameInterval = 1000 / this._targetFPS;
    
    const loop = (timestamp) => {
      if (!this._isRendering) return;
      this._animFrameId = requestAnimationFrame(loop);
      
      // 帧率控制：仅在间隔足够时渲染
      const elapsed = timestamp - this._lastRenderTime;
      if (elapsed < this._frameInterval * 0.9) return;  // 允许10%波动
      
      this._lastRenderTime = timestamp;
      if (this.doorInteraction) {
        this.doorInteraction.update();
        // 建筑悬停高亮（需求文档§5.2.3）
        const nearestDoor = this.doorInteraction.getNearestDoor();
        if (nearestDoor && nearestDoor.building) {
          this.sceneManager.highlightBuilding(nearestDoor.building);
        } else {
          this.sceneManager.highlightBuilding(null);
        }
      }
      if (this.particleEffects) this.particleEffects.update();
      this.sceneManager.render();
    };
    this._animFrameId = requestAnimationFrame(loop);
  }

  /**
   * 暂停渲染（2D界面显示时节省GPU）
   */
  pauseRendering() {
    this._isRendering = false;
    if (this._animFrameId) {
      cancelAnimationFrame(this._animFrameId);
      this._animFrameId = null;
    }
  }

  /**
   * 恢复渲染
   */
  resumeRendering() {
    if (!this._isRendering) {
      this._isRendering = true;
      this.startRenderLoop();
    }
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
