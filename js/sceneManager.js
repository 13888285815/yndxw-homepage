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
