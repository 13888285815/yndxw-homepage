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
    this.doors = [];
    
    // 配置
    this.config = {
      cameraHeight: 3, // 相机高度（模拟人眼高度）
      cameraFov: 75,
      cameraNear: 0.1,
      cameraFar: 1000,
      moveSpeed: 0.5,
      mouseSensitivity: 0.002
    };
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

    // 添加简单天空盒
    this.addSky();

    // 监听窗口大小变化
    window.addEventListener('resize', () => this.onResize());

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
   * 添加石头装饰
   */
  addRocks() {
    const rockGeometry = new THREE.DodecahedronGeometry(0.5, 0);
    const rockMaterial = new THREE.MeshLambertMaterial({ color: 0x808080 });
    
    for (let i = 0; i < 50; i++) {
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
   * 添加草丛装饰
   */
  addGrass() {
    const grassGeometry = new THREE.ConeGeometry(0.1, 0.5, 4);
    const grassMaterial = new THREE.MeshLambertMaterial({ color: 0x00AA00 });
    
    for (let i = 0; i < 200; i++) {
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
   * 获取渲染器
   */
  getRenderer() {
    return this.renderer;
  }
}

// 导出全局实例
window.sceneManager = new SceneManager();
