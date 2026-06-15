/**
 * sceneManager.js - 3D场景管理器
 * 负责管理Three.js场景的创建、渲染、更新
 */

class SceneManager {
  constructor() {
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.buildings = [];
    this.highlightedBuilding = null;  // 当前高亮的建筑
    this.highlightRing = null;      // 高亮光环
    this._initialCameraPos = null;  // 保存初始相机位置
    this.doors = [];
    
    // 配置
    this.config = {
      cameraHeight: 3,
      cameraFov: 75,
      cameraNear: 0.1,
      cameraFar: 1000,
      moveSpeed: 0.5,
      mouseSensitivity: 0.002
    };
    
    // 性能：根据CPU核心数判断设备等级
    this.performanceLevel = (navigator.hardwareConcurrency || 4) >= 8 ? 'high' : 'low';
    console.log('[SceneManager] 设备性能等级:', this.performanceLevel);
  }

  /**
   * 初始化场景
   */
  init() {
    console.log('[SceneManager] 初始化3D场景...');
    
    // 创建场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87CEEB); // 天蓝色背景
    this.scene.fog = new THREE.Fog(0x87CEEB, 50, 200); // 雾效

    // 创建相机（第一人称）
    this.camera = new THREE.PerspectiveCamera(
      this.config.cameraFov,
      window.innerWidth / window.innerHeight,
      this.config.cameraNear,
      this.config.cameraFar
    );
    this.camera.position.set(0, this.config.cameraHeight, 30);
    this._initialCameraPos = this.camera.position.clone();
    this.camera.lookAt(0, this.config.cameraHeight, 0);

    // 创建渲染器
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    // 初始化高亮光环
    this._initHighlightRing();
    
    // 初始化共享广场导航柱（需求文档§5.3）
    this._initPlazaPillars();
    document.getElementById('container').appendChild(this.renderer.domElement);

    // 添加光照
    this.addLights();

    // 添加地面
    this.addGround();

    // 添加天空盒（大型球体）
    this.addSkybox();

    // 添加水面效果
    this.addWater();

    // 监听窗口大小变化
    window.addEventListener('resize', () => this.onResize());
    
    // WebGL上下文丢失处理
    this.renderer.domElement.addEventListener('webglcontextlost', (event) => {
      event.preventDefault();
      console.warn('[SceneManager] WebGL上下文丢失，尝试恢复...');
    });
    this.renderer.domElement.addEventListener('webglcontextrestored', () => {
      console.log('[SceneManager] WebGL上下文已恢复，重新初始化场景...');
      this.init();
    });

    console.log('[SceneManager] 场景初始化完成');
  }

  /**
   * 添加光照
   */
  addLights() {
    // 环境光
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    // 方向光（模拟太阳）
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(50, 100, 50);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    this.scene.add(directionalLight);

    // 半球光（模拟天空和地面反射）
    const hemisphereLight = new THREE.HemisphereLight(0x87CEEB, 0x3a7d44, 0.3);
    this.scene.add(hemisphereLight);
  }

  /**
   * 添加地面（美化版）
   */
  addGround() {
    // 主地面
    const groundGeometry = new THREE.PlaneGeometry(200, 200);
    const groundMaterial = new THREE.MeshLambertMaterial({ 
      color: 0x3a7d44, // 绿色草地
      side: THREE.DoubleSide
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);

    // 添加石头装饰
    this.addRocks();

    // 添加草丛装饰
    this.addGrass();
  }

  /**
   * 添加石头装饰（性能自适应）
   */
  addRocks() {
    const count = this.performanceLevel === 'high' ? 50 : 20;
    console.log('[SceneManager] 添加石头:', count, '个');
    const rockGeometry = new THREE.DodecahedronGeometry(0.5, 0);
    const rockMaterial = new THREE.MeshLambertMaterial({ color: 0x808080 });
    
    for (let i = 0; i < count; i++) {
      const rock = new THREE.Mesh(rockGeometry, rockMaterial);
      rock.position.set(
        (Math.random() - 0.5) * 180,
        0.3,
        (Math.random() - 0.5) * 180
      );
      rock.scale.set(
        Math.random() * 0.5 + 0.5,
        Math.random() * 0.5 + 0.5,
        Math.random() * 0.5 + 0.5
      );
      rock.castShadow = true;
      this.scene.add(rock);
    }
  }

  /**
   * 添加草丛装饰（性能自适应）
   */
  addGrass() {
    const count = this.performanceLevel === 'high' ? 200 : 80;
    console.log('[SceneManager] 添加草丛:', count, '个');
    const grassGeometry = new THREE.ConeGeometry(0.1, 0.5, 4);
    const grassMaterial = new THREE.MeshLambertMaterial({ color: 0x00AA00 });
    
    for (let i = 0; i < count; i++) {
      const grass = new THREE.Mesh(grassGeometry, grassMaterial);
      grass.position.set(
        (Math.random() - 0.5) * 180,
        0.25,
        (Math.random() - 0.5) * 180
      );
      grass.rotation.y = Math.random() * Math.PI * 2;
      this.scene.add(grass);
    }
  }

  /**
   * 添加天空盒（大型球体，内侧渲染）
   */
  addSkybox() {
    console.log('[SceneManager] 添加天空盒...');
    const skyGeometry = new THREE.SphereGeometry(480, 32, 32);
    const skyMaterial = new THREE.MeshBasicMaterial({
      color: 0x87CEEB,
      side: THREE.BackSide
    });
    const sky = new THREE.Mesh(skyGeometry, skyMaterial);
    this.scene.add(sky);
    this.skyMesh = sky;
    console.log('[SceneManager] 天空盒添加完成');
  }

  /**
   * 添加水面效果（半透明平面，波浪动画在updateWater中处理）
   */
  addWater() {
    console.log('[SceneManager] 添加水面...');
    const waterGeometry = new THREE.PlaneGeometry(200, 200, 64, 64);
    const waterMaterial = new THREE.MeshStandardMaterial({
      color: 0x006994,
      transparent: true,
      opacity: 0.6,
      roughness: 0.1,
      metalness: 0.9
    });
    const water = new THREE.Mesh(waterGeometry, waterMaterial);
    water.rotation.x = -Math.PI / 2;
    water.position.y = -0.3;
    water.position.z = 80;
    water.name = 'water';
    this.scene.add(water);
    this.waterMesh = water;
    console.log('[SceneManager] 水面添加完成');
  }

  /**
   * 添加建筑
   * @param {THREE.Mesh} building - 建筑3D对象
   */
  addBuilding(building) {
    this.scene.add(building);
    this.buildings.push(building);
  }

  /**
   * 添加门
   * @param {THREE.Mesh} door - 门3D对象
   */
  addDoor(door) {
    this.scene.add(door);
    this.doors.push(door);
  }

  /**
   * 渲染循环
   */
  render() {
    requestAnimationFrame(() => this.render());
    // 更新水面动画
    this.updateWater();
    // 更新共享广场导航柱动画（呼吸+旋转）
    this._updatePlazaPillars();
    this.renderer.render(this.scene, this.camera);
  }

  /**
   * 窗口大小变化处理
   */
  onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  /**
   * 获取场景
   */
  getScene() {
    return this.scene;
  }

  /**
   * 获取相机
   */
  getCamera() {
    return this.camera;
  }

  /**
   * 更新水面动画（每帧调用）
   */
  updateWater() {
    if (!this.waterMesh) return;
    const time = Date.now() * 0.001;
    const pos = this.waterMesh.geometry.attributes.position.array;
    for (let i = 1; i < pos.length; i += 3) {
      const ox = pos[i - 1];
      const oz = (i + 1 < pos.length) ? pos[i + 1] : 0;
      pos[i] = Math.sin(ox * 0.03 + time * 2) * 0.4
               + Math.cos(oz * 0.03 + time * 1.5) * 0.3;
    }
    this.waterMesh.geometry.attributes.position.needsUpdate = true;
    this.waterMesh.geometry.computeVertexNormals();
  }

  /**
   * 获取渲染器
   */
  getRenderer() {
    return this.renderer;
  }

  /**
   * 初始化建筑高亮光环（需求文档§5.2.3）
   */
  _initHighlightRing() {
    const ringGeo = new THREE.RingGeometry(4.5, 5.5, 64);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x00ff88,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide
    });
    this.highlightRing = new THREE.Mesh(ringGeo, ringMat);
    this.highlightRing.rotation.x = -Math.PI / 2;
    this.highlightRing.position.y = 0.1;
    this.highlightRing.visible = false;
    this.scene.add(this.highlightRing);
  }

  /**
   * 初始化共享广场导航柱（需求文档§5.3 - 共享广场）
   * 5根发光柱子，均匀分布在建筑之间的外圈
   */
  _initPlazaPillars() {
    this.plazaPillars = [];
    const pillarCount = 5;
    const radius = 14;  // 略小于建筑距离
    const pillarNames = ['智能对话', '任务中心', '技能市场', '数字展览', '系统设置'];
    const pillarColors = [0x6366f1, 0x8b5cf6, 0x10b981, 0xf59e0b, 0x6b7280];
    
    // 偏移角度，使柱子位于建筑之间
    const offset = Math.PI / 5;
    
    for (let i = 0; i < pillarCount; i++) {
      const angle = offset + (2 * Math.PI * i) / pillarCount;
      const x = radius * Math.cos(angle);
      const z = radius * Math.sin(angle);
      
      // 发光柱体
      const pillarGeo = new THREE.CylinderGeometry(0.3, 0.5, 3, 8);
      const pillarMat = new THREE.MeshPhysicalMaterial({
        color: pillarColors[i % pillarColors.length],
        emissive: pillarColors[i % pillarColors.length],
        emissiveIntensity: 0.5,
        transparent: true,
        opacity: 0.8,
        metalness: 0.3,
        roughness: 0.7
      });
      const pillar = new THREE.Mesh(pillarGeo, pillarMat);
      pillar.position.set(x, 1.5, z);
      pillar.userData = { type: 'plaza_pillar', name: pillarNames[i], index: i };
      this.scene.add(pillar);
      this.plazaPillars.push(pillar);
      
      // 柱顶发光球
      const glowGeo = new THREE.SphereGeometry(0.5, 8, 8);
      const glowMat = new THREE.MeshBasicMaterial({
        color: pillarColors[i % pillarColors.length],
        transparent: true,
        opacity: 0.7
      });
      const glow = new THREE.Mesh(glowGeo, glowMat);
      glow.position.set(x, 3.5, z);
      glow.userData = { type: 'plaza_glow', pillarIndex: i };
      this.scene.add(glow);
    }
    
    console.log('[SceneManager] 共享广场导航柱初始化完成');
  }

  /**
   * 高亮指定建筑
   * @param {THREE.Group|null} building - 要高亮的建筑，null清除高亮
   */
  highlightBuilding(building) {
    // 恢复上次高亮的建筑
    if (this.highlightedBuilding && this.highlightedBuilding !== building) {
      this.highlightedBuilding.traverse(child => {
        if (child.isMesh && child._origEmissive !== undefined) {
          child.material.emissive.setHex(child._origEmissive);
          child.material.emissiveIntensity = 0;
        }
      });
    }
    
    if (building) {
      // 高亮新建筑
      building.traverse(child => {
        if (child.isMesh && child.material) {
          if (child._origEmissive === undefined) {
            child._origEmissive = child.material.emissive ? child.material.emissive.getHex() : 0;
          }
          child.material.emissive = child.material.emissive || new THREE.Color(0x00ff88);
          child.material.emissive.setHex(0x00ff88);
          child.material.emissiveIntensity = 0.3;
        }
      });
      
      // 显示高亮光环
      this.highlightRing.position.x = building.position.x;
      this.highlightRing.position.z = building.position.z;
      this.highlightRing.visible = true;
      this.highlightRing.material.opacity = 0.6;
    } else {
      // 清除高亮
      if (this.highlightRing) {
        this.highlightRing.visible = false;
        this.highlightRing.material.opacity = 0;
      }
    }
    
    this.highlightedBuilding = building;
  }

  /**
   * 更新导航柱动画效果（共享广场§5.3）
   * 呼吸光效 + 上下浮动
   */
  _updatePlazaPillars() {
    if (!this.plazaPillars || !this.plazaPillars.length) return;
    const time = Date.now() * 0.001;
    
    this.plazaPillars.forEach((pillar, i) => {
      const breathe = Math.sin(time * 2 + i * 1.256) * 0.3 + 0.5;
      pillar.material.emissiveIntensity = breathe;
      pillar.material.opacity = 0.5 + breathe * 0.3;
      pillar.position.y = 1.5 + Math.sin(time * 0.8 + i * 1.256) * 0.2;
    });
    
    this.scene.children.forEach(child => {
      if (child.userData && child.userData.type === 'plaza_glow') {
        const breathe = Math.sin(Date.now() * 0.002 + child.userData.pillarIndex * 1.256) * 0.3 + 0.5;
        child.material.opacity = breathe * 0.8;
        child.scale.setScalar(0.8 + breathe * 0.2);
      }
    });
  }

  /**
   * 镜头推进动画（开门后镜头穿门而入）
   * @param {THREE.Vector3} targetPos - 目标位置（门后位置）
   * @param {number} duration - 动画时长（毫秒）
   * @param {Function} callback - 动画完成后回调
   */
  pushCamera(targetPos, duration = 3000, callback) {
    console.log('[SceneManager] 镜头推进动画开始...');
    const startPos = this.camera.position.clone();
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // 缓动函数（easeInOutCubic）
      const eased = progress < 0.5
        ? 4 * progress * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;
      
      this.camera.position.lerpVectors(startPos, targetPos, eased);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        console.log('[SceneManager] 镜头推进动画完成');
        if (callback) callback();
      }
    };
    
    animate();
  }

  /**
   * 重置镜头到主场景位置
   * @param {Function} callback - 动画完成后回调
   */
  resetCamera(callback) {
    console.log('[SceneManager] 重置镜头到主场景...');
    const targetPos = this._initialCameraPos ? this._initialCameraPos.clone() : new THREE.Vector3(0, this.config.cameraHeight, 30);
    this.pushCamera(targetPos, 2000, callback);
  }
}

// 导出全局实例
window.sceneManager = new SceneManager();
