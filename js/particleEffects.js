/**
 * particleEffects.js - 粒子效果管理器（支持多主题切换）
 * 包含：萤火虫、飘云、樱花飘落、星星闪烁
 */

class ParticleEffects {
  constructor(scene) {
    this.scene = scene;
    this.particles = {};   // 按主题存储粒子系统 { firefly: ..., cherry: ..., star: ..., cloud: [...] }
    this.activeTheme = 'firefly'; // 当前激活的主题
  }

  /**
   * 初始化所有粒子效果
   */
  init() {
    console.log('[ParticleEffects] 初始化粒子效果...');
    this.createFireflies();
    this.createFloatingClouds();
    this.createCherryBlossoms();
    this.createStars();
    this.createLeaves();  // 落叶系统
    this.setTheme('firefly'); // 默认主题
    console.log('[ParticleEffects] 粒子效果初始化完成');
  }

  /* ========== 萤火虫（发光精灵球，真实光晕效果） ========== */
  createFireflies() {
    const count = this.getParticleCount(50, 25);
    // 用小圆球代替点（模拟真实萤火虫发光体）
    const fireflyGroup = new THREE.Group();
    fireflyGroup.name = 'fireflies';
    fireflyGroup.visible = false;
    this.scene.add(fireflyGroup);

    // 创建发光球几何体（外层光晕）
    const glowGeo = new THREE.SphereGeometry(0.5, 8, 8);
    // 创建萤火虫颜色变化列表
    const ffColors = [0xffff88, 0xaaff66, 0x88ffaa, 0xffee44, 0x66ffaa];

    for (let i = 0; i < count; i++) {
      const group = new THREE.Group();
      group.position.set(
        (Math.random() - 0.5) * 100,
        Math.random() * 8 + 0.5,
        (Math.random() - 0.5) * 100
      );

      // 内核（亮核）
      const coreGeo = new THREE.SphereGeometry(0.12, 6, 6);
      const coreMat = new THREE.MeshBasicMaterial({ color: 0xffffaa });
      const core = new THREE.Mesh(coreGeo, coreMat);
      group.add(core);

      // 外层光晕（半透明大球）
      const glowMat = new THREE.MeshBasicMaterial({
        color: ffColors[i % ffColors.length],
        transparent: true,
        opacity: 0.25,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.BackSide
      });
      const glow = new THREE.Mesh(new THREE.SphereGeometry(0.45, 8, 8), glowMat);
      group.add(glow);

      // 随机飞行数据
      group.userData = {
        origin: group.position.clone(),
        phase: Math.random() * Math.PI * 2,
        speedX: (Math.random() - 0.5) * 0.008,
        speedY: (Math.random() - 0.5) * 0.005,
        speedZ: (Math.random() - 0.5) * 0.008,
        pulseSpeed: 1.5 + Math.random() * 1.5,
        driftRange: 4 + Math.random() * 6,
        glowMat: glowMat,
        coreMat: coreMat
      };

      fireflyGroup.add(group);
    }
    this.particles.firefly = fireflyGroup;

    // 同时保留旧版点云（性能模式降级用）
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new THREE.Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 100;
      positions[i * 3 + 1] = Math.random() * 10 + 1;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 100;
      colors[i * 3] = 1; colors[i * 3 + 1] = 1; colors[i * 3 + 2] = 0.3;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const ptsMat = new THREE.PointsMaterial({
      size: 0.3, vertexColors: true, transparent: true,
      opacity: 0.7, blending: THREE.AdditiveBlending, depthWrite: false
    });
    const pts = new THREE.Points(geo, ptsMat);
    pts.visible = false; pts.name = 'fireflyPoints';
    this.scene.add(pts);
    this.particles.fireflyPoints = pts;
  }

  /* ========== 落叶系统（秋日氛围） ========== */
  createLeaves() {
    const count = this.getParticleCount(40, 15);
    const leafGroup = new THREE.Group();
    leafGroup.name = 'leaves';
    leafGroup.visible = false;
    this.scene.add(leafGroup);

    const leafColors = [0xcc4422, 0xdd6633, 0xffaa44, 0x88aa44, 0xdd9955];
    const leafShapes = [
      new THREE.PlaneGeometry(0.4, 0.3),
      new THREE.PlaneGeometry(0.3, 0.4),
      new THREE.PlaneGeometry(0.35, 0.25),
    ];

    for (let i = 0; i < count; i++) {
      const geo = leafShapes[i % leafShapes.length];
      const mat = new THREE.MeshLambertMaterial({
        color: leafColors[i % leafColors.length],
        transparent: true,
        opacity: 0.8,
        side: THREE.DoubleSide,
        depthWrite: false
      });
      const leaf = new THREE.Mesh(geo, mat);
      leaf.position.set(
        (Math.random() - 0.5) * 80,
        Math.random() * 25 + 5,
        (Math.random() - 0.5) * 80
      );
      leaf.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );
      leaf.userData = {
        fallSpeed: 0.01 + Math.random() * 0.015,
        wobbleFreq: 1 + Math.random() * 2,
        rotSpeed: (Math.random() - 0.5) * 2,
        rotSpeedX: (Math.random() - 0.5) * 1.5,
        phase: Math.random() * Math.PI * 2
      };
      leafGroup.add(leaf);
    }
    this.particles.leaves = leafGroup;
  }

  /* ========== 飘云 ========== */
  createFloatingClouds() {
    const cloudCount = 8;
    this.particles.cloud = [];
    for (let i = 0; i < cloudCount; i++) {
      const cloudGeometry = new THREE.SphereGeometry(Math.random() * 2.5 + 1.5, 8, 8);
      const cloudMaterial = new THREE.MeshLambertMaterial({
        color: 0xFFFFFF,
        transparent: true,
        opacity: 0.35
      });
      const cloud = new THREE.Mesh(cloudGeometry, cloudMaterial);
      cloud.position.set(
        (Math.random() - 0.5) * 160,
        Math.random() * 25 + 25,
        (Math.random() - 0.5) * 160
      );
      cloud.userData = {
        speed: Math.random() * 0.015 + 0.005,
        dir: new THREE.Vector3(Math.random() - 0.5, 0, Math.random() - 0.5).normalize()
      };
      cloud.visible = true; // 云始终显示
      this.scene.add(cloud);
      this.particles.cloud.push(cloud);
    }
  }

  /* ========== 樱花飘落 ========== */
  createCherryBlossoms() {
    const count = this.getParticleCount(80, 30);
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3); // 存储速度
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 120;
      positions[i * 3 + 1] = Math.random() * 40 + 10; // 从高空开始飘落
      positions[i * 3 + 2] = (Math.random() - 0.5) * 120;
      velocities[i * 3] = (Math.random() - 0.5) * 0.02; // 微风X
      velocities[i * 3 + 1] = -(Math.random() * 0.03 + 0.01); // 下落Y
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.02; // 微风Z
    }
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({
      color: 0xFFB7C5, // 樱花粉
      size: 0.25,
      transparent: true,
      opacity: 0.85,
      depthWrite: false
    });
    const points = new THREE.Points(geometry, material);
    points.name = 'cherry';
    points.userData = { velocities };
    points.visible = false;
    this.scene.add(points);
    this.particles.cherry = points;
    points.matrixAutoUpdate = false; points.updateMatrix();
  }

  /* ========== 星星闪烁 ========== */
  createStars() {
    const count = this.getParticleCount(150, 60);
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const alphas = new Float32Array(count); // 存储每个星星的闪烁相位
    for (let i = 0; i < count; i++) {
      // 在天空球体上随机分布星星
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 0.8 + 0.2); // 偏上方
      const r = 470;
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.cos(phi);
      positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
      alphas[i] = Math.random() * Math.PI * 2; // 随机闪烁相位
    }
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({
      color: 0xFFFFFF,
      size: 0.4,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
      sizeAttenuation: true
    });
    const points = new THREE.Points(geometry, material);
    points.name = 'stars';
    points.userData = { alphas };
    points.visible = false;
    this.scene.add(points);
    this.particles.stars = points;
    points.matrixAutoUpdate = false; points.updateMatrix();
  }

  /**
   * 切换粒子主题
   * @param {string} theme - 'firefly' | 'cherry' | 'star' | 'none'
   */
  setTheme(theme) {
    this.activeTheme = theme;
    // 隐藏所有
    if (this.particles.firefly) this.particles.firefly.visible = false;
    if (this.particles.cherry) this.particles.cherry.visible = false;
    if (this.particles.stars) this.particles.stars.visible = false;
    // 显示当前主题（云始终显示）
    if (theme === 'firefly' && this.particles.firefly) {
      this.particles.firefly.visible = true;
    } else if (theme === 'cherry' && this.particles.cherry) {
      this.particles.cherry.visible = true;
    } else if (theme === 'star' && this.particles.stars) {
      this.particles.stars.visible = true;
    } else if (theme === 'autumn' && this.particles.leaves) {
      this.particles.leaves.visible = true;
    }
    console.log(`[ParticleEffects] 切换主题: ${theme}`);
  }

  /**
   * 根据设备性能获取粒子数量
   */
  getParticleCount(high, low) {
    const cores = navigator.hardwareConcurrency || 4;
    return cores >= 8 ? high : low;
  }

  /**
   * 更新粒子效果（每帧调用）
   */
  update(delta) {
    const time = Date.now() * 0.001;

    // 更新萤火虫
    if (this.particles.firefly && this.particles.firefly.visible) {
      const pos = this.particles.firefly.geometry.attributes.position.array;
      for (let i = 0; i < pos.length; i += 3) {
        pos[i] += (Math.random() - 0.5) * 0.04;
        pos[i + 1] += (Math.random() - 0.5) * 0.015;
        pos[i + 2] += (Math.random() - 0.5) * 0.04;
        if (pos[i + 1] < 0.5) pos[i + 1] = 0.5;
        if (pos[i + 1] > 15) pos[i + 1] = 15;
      }
      this.particles.firefly.geometry.attributes.position.needsUpdate = true;
      this.particles.firefly.material.opacity = 0.5 + Math.sin(time * 3) * 0.3;
    }

    // 更新樱花
    if (this.particles.cherry && this.particles.cherry.visible) {
      const pos = this.particles.cherry.geometry.attributes.position.array;
      const vel = this.particles.cherry.userData.velocities;
      for (let i = 0; i < pos.length; i += 3) {
        pos[i] += vel[i * 3] + Math.sin(time + i) * 0.005;
        pos[i + 1] += vel[i * 3 + 1];
        pos[i + 2] += vel[i * 3 + 2] + Math.cos(time + i) * 0.005;
        // 落到地面后重置到高空
        if (pos[i + 1] < 0) {
          pos[i] = (Math.random() - 0.5) * 120;
          pos[i + 1] = Math.random() * 20 + 20;
          pos[i + 2] = (Math.random() - 0.5) * 120;
        }
      }
      this.particles.cherry.geometry.attributes.position.needsUpdate = true;
    }

    // 更新星星闪烁
    if (this.particles.stars && this.particles.stars.visible) {
      const alphas = this.particles.stars.userData.alphas;
      // 通过材质的opacity实现整体闪烁
      this.particles.stars.material.opacity = 0.6 + Math.sin(time * 2) * 0.4;
    }

    // 更新飘云（始终更新）
    if (this.particles.cloud) {
      this.particles.cloud.forEach(cloud => {
        const d = cloud.userData.dir;
        cloud.position.x += d.x * cloud.userData.speed;
        cloud.position.z += d.z * cloud.userData.speed;
        if (Math.abs(cloud.position.x) > 100 || Math.abs(cloud.position.z) > 100) {
          cloud.position.set(
            (Math.random() - 0.5) * 160,
            Math.random() * 25 + 25,
            (Math.random() - 0.5) * 160
          );
        }
      });
    }
  }
}

// 导出
window.ParticleEffects = ParticleEffects;
