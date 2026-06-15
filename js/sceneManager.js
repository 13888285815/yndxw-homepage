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

    // ── 真实感系统 ──
    this.timeOfDay = 0.35;     // 0~1，白天的fraction（0.35=约8:30AM）
    this.sunAngle = 0;         // 太阳弧度角（0=正东，π/2=正南）
    this._sunLight = null;    // 太阳定向光引用
    this._moonLight = null;   // 月光引用
    this._skyMesh = null;      // 天空穹引用
    this._fogColor = new THREE.Color(0x87CEEB);
    this.windTime = 0;         // 风向时间计数器;
    
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
    this.scene.fog = new THREE.FogExp2(0x87CEEB, 0.006); // 指数雾效
    this._fogColor = new THREE.Color(0x87CEEB);
    this.scene.background = this._fogColor;

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
   * 添加光照（真实感：太阳+天空+地面反射）
   */
  addLights() {
    // 环境光（随时间变化）
    const ambientLight = new THREE.AmbientLight(0xfff8e7, 0.5);
    this.scene.add(ambientLight);
    this._ambientLight = ambientLight;

    // 太阳定向光
    const sunLight = new THREE.DirectionalLight(0xfff5d0, 1.2);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 500;
    sunLight.shadow.camera.left = -100;
    sunLight.shadow.camera.right = 100;
    sunLight.shadow.camera.top = 100;
    sunLight.shadow.camera.bottom = -100;
    sunLight.shadow.bias = -0.0001;
    this.scene.add(sunLight);
    this._sunLight = sunLight;

    // 月光（夜间补光，极弱）
    const moonLight = new THREE.DirectionalLight(0x4466aa, 0.15);
    moonLight.position.set(-50, 80, -50);
    this.scene.add(moonLight);
    this._moonLight = moonLight;

    // 半球光（天空蓝→地面绿，反射环境光）
    const hemisphereLight = new THREE.HemisphereLight(0x87CEEB, 0x3a7d44, 0.4);
    this.scene.add(hemisphereLight);
    this._hemisphereLight = hemisphereLight;

    // 根据时间更新光照
    this._updateTimeOfDay(0);
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
      grass.userData.type = 'grass';
      this.scene.add(grass);
    }
  }

  /**
   * 添加天空穹（渐变着色器：地平线→天顶）
   * 模拟大气散射效果（头顶蓝→地平线浅色）
   */
  addSkybox() {
    console.log('[SceneManager] 添加天空穹...');
    const skyGeo = new THREE.SphereGeometry(450, 32, 32);
    skyGeo.scale(-1, 1, 1); // 内翻（内侧渲染）

    // 顶点颜色属性（渐变：顶部深蓝，底部浅色）
    const colors = [];
    const posArr = skyGeo.attributes.position.array;
    for (let i = 0; i < posArr.length; i += 3) {
      const y = posArr[i + 1];
      const t = Math.max(0, Math.min(1, (y + 450) / 900)); // 0=地平线，1=天顶
      // 地平线: 浅橙/浅蓝 | 天顶: 深蓝
      const horizonR = 0.85, horizonG = 0.92, horizonB = 1.0;
      const zenithR = 0.30, zenithG = 0.55, zenithB = 0.95;
      colors.push(zenithR + (horizonR - zenithR) * (1 - t),
                  zenithG + (horizonG - zenithG) * (1 - t),
                  zenithB + (horizonB - zenithB) * (1 - t));
    }
    skyGeo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    const skyMat = new THREE.MeshBasicMaterial({
      vertexColors: true,
      side: THREE.BackSide,
      fog: false  // 天空不受雾影响
    });
    const sky = new THREE.Mesh(skyGeo, skyMat);
    this.scene.add(sky);
    this._skyMesh = sky;
    this._skyMat = skyMat;

    // 添加太阳球体
    this._addSunSphere();

    // 添加地平线雾霾层
    this._addHorizonHaze();

    // 添加远景山脉轮廓
    this._addDistantMountains();

    console.log('[SceneManager] 天空穹添加完成');
  }

  /**
   * 添加太阳球体（可见太阳圆盘 + 光晕）
   */
  _addSunSphere() {
    // 太阳本体
    const sunGeo = new THREE.SphereGeometry(6, 16, 16);
    const sunMat = new THREE.MeshBasicMaterial({ color: 0xfff5a0 });
    const sunMesh = new THREE.Mesh(sunGeo, sunMat);
    sunMesh.name = 'sunMesh';
    this.scene.add(sunMesh);
    this._sunMesh = sunMesh;

    // 太阳外晕（Billboard光晕）
    const haloGeo = new THREE.SphereGeometry(10, 12, 12);
    const haloMat = new THREE.MeshBasicMaterial({
      color: 0xffee88,
      transparent: true,
      opacity: 0.15,
      side: THREE.BackSide,
      fog: false
    });
    const haloMesh = new THREE.Mesh(haloGeo, haloMat);
    haloMesh.name = 'sunHalo';
    this.scene.add(haloMesh);
    this._sunHalo = haloMesh;
  }

  /**
   * 添加地平线雾霾层（远处朦胧感）
   */
  _addHorizonHaze() {
    const hazeGeo = new THREE.CylinderGeometry(440, 450, 20, 32, 1, true);
    const hazeMat = new THREE.MeshBasicMaterial({
      color: 0xd4e8f7,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide,
      fog: false
    });
    const haze = new THREE.Mesh(hazeGeo, hazeMat);
    haze.position.y = -20;
    haze.name = 'horizonHaze';
    this.scene.add(haze);
    this._horizonHaze = haze;
  }

  /**
   * 添加远景山脉轮廓（增加场景深度）
   */
  _addDistantMountains() {
    const mtColors = [0x6b8fa3, 0x5c7e91, 0x7a9db0, 0x4d6b7a];
    const mtPositions = [
      { x: -200, z: -250, ry: 0.3, count: 8 },
      { x: 200, z: -220, ry: -0.4, count: 6 },
      { x: 0, z: -300, ry: 0, count: 10 },
      { x: -280, z: -150, ry: 0.5, count: 5 },
      { x: 280, z: -180, ry: -0.3, count: 7 },
    ];

    mtPositions.forEach(({ x, z, ry, count }) => {
      for (let i = 0; i < count; i++) {
        const h = 30 + Math.random() * 50;
        const w = 15 + Math.random() * 25;
        const geo = new THREE.ConeGeometry(w, h, 6 + Math.floor(Math.random() * 3));
        const mat = new THREE.MeshLambertMaterial({
          color: mtColors[i % mtColors.length],
          fog: true
        });
        const mt = new THREE.Mesh(geo, mat);
        mt.position.set(
          x + (Math.random() - 0.5) * 150,
          h / 2 - 5,
          z + (Math.random() - 0.5) * 80
        );
        mt.rotation.y = Math.random() * Math.PI * 2;
        this.scene.add(mt);
      }
    });
  }

  /**
   * 更新时间/光照系统
   * @param {number} delta — 时间增量（秒）
   */
  _updateTimeOfDay(delta) {
    this.timeOfDay = (this.timeOfDay + delta * 0.01) % 1;
    const t = this.timeOfDay; // 0=午夜, 0.25=日出, 0.5=正午, 0.75=日落

    // 太阳仰角（弧度）：日出0→正午π/2→日落π→午夜-π/2
    const sunElevation = Math.sin((t - 0.25) * Math.PI * 2) * (Math.PI / 2);
    const sunVisible = sunElevation > -0.2;

    // 太阳位置（半径200的球面上）
    const sunX = Math.cos((t - 0.25) * Math.PI * 2) * 200;
    const sunY = Math.sin((t - 0.25) * Math.PI * 2) * 200;
    if (this._sunMesh) {
      this._sunMesh.position.set(sunX, Math.max(-20, sunY), -180);
      this._sunMesh.visible = sunVisible;
      this._sunMesh.material.opacity = sunVisible ? Math.max(0, sunElevation + 0.2) : 0;
    }
    if (this._sunHalo) {
      this._sunHalo.position.copy(this._sunMesh ? this._sunMesh.position : new THREE.Vector3(0, 0, 0));
      this._sunHalo.visible = sunVisible;
    }

    // 光照颜色与强度（白天的动态变化）
    let skyColor, sunColor, ambientIntensity, sunIntensity;

    if (t < 0.2 || t > 0.8) {
      // 🌙 夜晚：深蓝黑
      skyColor = new THREE.Color(0x0a0a20);
      sunColor = new THREE.Color(0x223366);
      ambientIntensity = 0.08;
      sunIntensity = 0;
    } else if (t < 0.25) {
      // 🌅 日出：橙红渐变
      const r = (t - 0.2) / 0.05;
      skyColor = new THREE.Color(0xff6633).lerp(new THREE.Color(0xff9966), r);
      sunColor = new THREE.Color(0xffaa44);
      ambientIntensity = 0.2 + r * 0.2;
      sunIntensity = 0.4 * r;
    } else if (t < 0.35) {
      // 🌄 早晨：金黄光
      const r = (t - 0.25) / 0.1;
      skyColor = new THREE.Color(0xff9966).lerp(new THREE.Color(0x87CEEB), r);
      sunColor = new THREE.Color(0xffdd88);
      ambientIntensity = 0.4;
      sunIntensity = 0.6 + r * 0.4;
    } else if (t < 0.7) {
      // ☀️ 白天：蓝天白云
      skyColor = new THREE.Color(0x87CEEB);
      sunColor = new THREE.Color(0xfff5d0);
      ambientIntensity = 0.5;
      sunIntensity = 1.2;
    } else if (t < 0.8) {
      // 🌆 黄昏：紫橙
      const r = (t - 0.7) / 0.1;
      skyColor = new THREE.Color(0x87CEEB).lerp(new THREE.Color(0xff5533), r);
      sunColor = new THREE.Color(0xff8844);
      ambientIntensity = 0.5 - r * 0.3;
      sunIntensity = 1.2 - r * 0.8;
    } else {
      // 🌃 入夜：深紫
      skyColor = new THREE.Color(0xff5533).lerp(new THREE.Color(0x0a0a20), (t - 0.8) / 0.2);
      sunColor = new THREE.Color(0x332244);
      ambientIntensity = 0.2;
      sunIntensity = 0.1;
    }

    // 应用颜色
    if (this._skyMesh && this._skyMat) {
      this._skyMat.color = skyColor;
    }
    this.scene.background = skyColor;
    this.scene.fog.color = skyColor;
    this._fogColor = skyColor;

    if (this._ambientLight) this._ambientLight.intensity = ambientIntensity;
    if (this._hemisphereLight) {
      this._hemisphereLight.color = skyColor;
      this._hemisphereLight.groundColor = skyColor.clone().multiplyScalar(0.3);
    }
    if (this._sunLight) {
      this._sunLight.color = sunColor;
      this._sunLight.intensity = sunIntensity;
      if (sunVisible) {
        this._sunLight.position.set(sunX, Math.max(5, sunY), -100);
        this._sunLight.target.position.set(0, 0, 0);
      }
    }
    if (this._moonLight) {
      this._moonLight.intensity = sunVisible ? 0 : 0.12;
    }
    if (this._horizonHaze) {
      this._horizonHaze.material.opacity = sunVisible ? 0.25 : 0.1;
    }
  }

  /**
   * 添加真实感水面（波浪动画 + 天空反射 + 焦散模拟）
   */
  addWater() {
    console.log('[SceneManager] 添加水面...');
    const W = 200, H = 200, seg = 96;
    const waterGeo = new THREE.PlaneGeometry(W, H, seg, seg);

    // 预存原始水面顶点
    const origY = [];
    waterGeo.attributes.position.array.forEach((v, i) => {
      if (i % 3 === 1) origY.push(v);
    });
    this._waterOrigY = origY;

    const waterMat = new THREE.MeshPhysicalMaterial({
      color: 0x1a6b8a,
      transparent: true,
      opacity: 0.78,
      roughness: 0.05,
      metalness: 0.1,
      envMapIntensity: 1.2,
      reflectivity: 0.9,
      clearcoat: 0.8,
      clearcoatRoughness: 0.1,
      side: THREE.DoubleSide
    });
    const water = new THREE.Mesh(waterGeo, waterMat);
    water.rotation.x = -Math.PI / 2;
    water.position.y = -0.2;
    water.position.z = 80;
    water.receiveShadow = true;
    water.name = 'water';
    this.scene.add(water);
    this.waterMesh = water;

    // 水面波光粒子（模拟阳光在水面的闪烁）
    this._addWaterSparkles();

    console.log('[SceneManager] 水面添加完成');
  }

  _waterSparkles = [];
  _addWaterSparkles() {
    const count = this.performanceLevel === 'high' ? 80 : 30;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 180;
      pos[i * 3 + 1] = -0.1;
      pos[i * 3 + 2] = 80 + (Math.random() - 0.5) * 180;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({
      color: 0xffffaa, size: 0.4,
      transparent: true, opacity: 0.7,
      blending: THREE.AdditiveBlending, depthWrite: false
    });
    const pts = new THREE.Points(geo, mat);
    pts.name = 'waterSparkles';
    this.scene.add(pts);
    this._waterSparkles = pts;
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
  _lastRenderTime = 0;
  render() {
    requestAnimationFrame(() => this.render());
    const now = performance.now();
    const delta = Math.min((now - this._lastRenderTime) / 1000, 0.05);
    this._lastRenderTime = now;

    // 更新时间/光照系统
    this._updateTimeOfDay(delta);
    // 更新水面动画
    this.updateWater();
    // 更新共享广场导航柱动画
    this._updatePlazaPillars();
    // 更新风向草动
    this._updateGrassWind(delta);
    this.renderer.render(this.scene, this.camera);
  }

  /**
   * 更新草丛/植被风向动画
   */
  _grassMeshes = [];
  _windDir = new THREE.Vector3(1, 0, 0.3).normalize();
  _updateGrassWind(delta) {
    if (!this._grassMeshes.length) {
      // 缓存草丛mesh
      this.scene.traverse(obj => {
        if (obj.isMesh && obj.userData.type === 'grass') this._grassMeshes.push(obj);
      });
    }
    this.windTime += delta;
    const windStrength = Math.sin(this.windTime * 1.5) * 0.15 + 0.1;
    this._grassMeshes.forEach((g, i) => {
      const sway = Math.sin(this.windTime * 2 + i * 0.7) * windStrength;
      g.rotation.z = sway;
      g.rotation.x = Math.sin(this.windTime * 1.3 + i) * windStrength * 0.5;
    });
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
   * 更新水面动画（Gerstner波模拟 + 波光粒子）
   */
  updateWater() {
    if (!this.waterMesh) return;
    const time = Date.now() * 0.001;
    const pos = this.waterMesh.geometry.attributes.position.array;
    const origY = this._waterOrigY;
    let vi = 1;
    for (let i = 0; i < pos.length / 3; i++) {
      const ox = pos[i * 3];
      const oz = pos[i * 3 + 2];
      // 叠加多个方向波（Gerstner波简化版）
      pos[vi] = origY[i]
        + Math.sin(ox * 0.05 + time * 1.8) * 0.35
        + Math.cos(oz * 0.04 + time * 1.3) * 0.25
        + Math.sin((ox + oz) * 0.03 + time * 2.1) * 0.15;
      vi += 3;
    }
    this.waterMesh.geometry.attributes.position.needsUpdate = true;
    this.waterMesh.geometry.computeVertexNormals();

    // 更新水面波光
    if (this._waterSparkles) {
      const sPos = this._waterSparkles.geometry.attributes.position.array;
      const sparkleTime = time * 3;
      for (let i = 0; i < sPos.length / 3; i++) {
        const flicker = Math.sin(sparkleTime + i * 2.3);
        sPos[i * 3 + 1] = -0.15 + Math.abs(flicker) * 0.25;
      }
      this._waterSparkles.geometry.attributes.position.needsUpdate = true;
      this._waterSparkles.material.opacity = 0.4 + Math.abs(Math.sin(time * 2)) * 0.5;
    }
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
