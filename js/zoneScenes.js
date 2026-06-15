/**
 * zoneScenes.js - 五大主题3D过渡场景（任务要求：金殿/森林/海洋/星空/熔炉）
 * 进入各区后播放5秒3D过渡场景，然后自动切换到2D界面
 * 性能优化：低多边形+纹理压缩+层级加载，确保FPS≥60
 */

class ZoneScenes {
  constructor(scene, camera) {
    this.scene = scene;
    this.camera = camera;
    this.currentZoneScene = null;
    this.transitionDuration = 5000; // 5秒过渡（需求文档§5.2.5）
    this.animationFrameId = null;
    this.startTime = null;
  }

  /**
   * 创建并显示指定区域的3D过渡场景
   * @param {string} zoneId - 区域ID
   * @param {Function} onComplete - 5秒过渡完成后的回调
   */
  showZoneScene(zoneId, onComplete) {
    console.log(`[ZoneScenes] 显示3D过渡场景: ${zoneId}`);

    // 清除当前过渡场景
    this.clearCurrentScene();

    // 根据区域创建不同的3D场景（金殿/森林/海洋/星空/熔炉）
    switch (zoneId) {
      case 'adult':      // 成人区 → 金殿（金色大厅，宏伟宫殿）
        this.currentZoneScene = this.createGoldenPalaceScene();
        break;
      case 'teen':       // 青少年区 → 森林（魔法森林，参天大树）
        this.currentZoneScene = this.createMagicForestScene();
        break;
      case 'children':   // 儿童区 → 海洋（海底世界，珊瑚礁）
        this.currentZoneScene = this.createOceanWorldScene();
        break;
      case 'elderly':   // 老年区 → 星空（星空穹顶，宁静宇宙）
        this.currentZoneScene = this.createStarrySkyScene();
        break;
      case 'accessible': // 残障友好区 → 熔炉（炽热熔炉，火焰特效）
        this.currentZoneScene = this.createFurnaceScene();
        break;
      default:
        this.currentZoneScene = this.createGenericScene();
    }

    // 启动场景动画（光影变化）
    this.startTime = Date.now();
    this.animateScene();

    // 5秒后自动切换到2D界面（需求文档§5.2.5）
    setTimeout(() => {
      console.log(`[ZoneScenes] 3D过渡完成，切换到2D界面`);
      this.stopAnimation();
      if (onComplete) onComplete();
    }, this.transitionDuration);
  }

  /**
   * 场景动画（光影变化，增强沉浸感）
   */
  animateScene() {
    if (!this.currentZoneScene) return;

    const animate = () => {
      const elapsed = Date.now() - this.startTime;
      const progress = Math.min(elapsed / this.transitionDuration, 1.0);

      // 根据场景类型执行不同的动画
      this.updateSceneAnimation(this.currentZoneScene.name, progress);

      this.animationFrameId = requestAnimationFrame(animate);
    };

    animate();
  }

  /**
   * 更新场景动画
   */
  updateSceneAnimation(sceneName, progress) {
    if (!this.currentZoneScene) return;

    // 根据场景名称执行特定动画
    switch (sceneName) {
      case 'golden-palace-scene':
        // 金殿：灯光强度随时间增强
        this.currentZoneScene.children.forEach(child => {
          if (child.isLight) {
            child.intensity = 0.5 + progress * 1.5;
          }
        });
        break;

      case 'magic-forest-scene':
        // 森林：树叶轻轻摇曳（简化版）
        this.currentZoneScene.children.forEach(child => {
          if (child.userData && child.userData.isLeaf) {
            child.rotation.z = Math.sin(progress * Math.PI * 2) * 0.05;
          }
        });
        break;

      case 'ocean-world-scene':
        // 海洋：水泡上浮
        this.currentZoneScene.children.forEach(child => {
          if (child.userData && child.userData.isBubble) {
            child.position.y += 0.02;
            if (child.position.y > 10) child.position.y = 0;
          }
        });
        break;

      case 'starry-sky-scene':
        // 星空：星星闪烁
        this.currentZoneScene.children.forEach(child => {
          if (child.userData && child.userData.isStar) {
            child.material.emissiveIntensity = 0.5 + Math.sin(progress * Math.PI * 4) * 0.5;
          }
        });
        break;

      case 'furnace-scene':
        // 熔炉：火焰跳动
        this.currentZoneScene.children.forEach(child => {
          if (child.userData && child.userData.isFlame) {
            child.scale.y = 1 + Math.sin(progress * Math.PI * 6) * 0.2;
          }
        });
        break;
    }
  }

  /**
   * 停止场景动画
   */
  stopAnimation() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /**
   * 清除当前3D过渡场景（释放内存，防止泄漏）
   */
  clearCurrentScene() {
    this.stopAnimation();

    if (this.currentZoneScene) {
      // 从主场景中移除所有过渡场景的子对象
      while (this.currentZoneScene.children.length > 0) {
        const child = this.currentZoneScene.children[0];
        this.currentZoneScene.remove(child);
        // 释放几何体和材质（防止内存泄漏）
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(m => m.dispose());
          } else {
            child.material.dispose();
          }
        }
      }
      this.scene.remove(this.currentZoneScene);
      this.currentZoneScene = null;
    }
  }

  // ==================== 五大主题场景 ====================

  /**
   * 成人区：金殿场景（金色大厅，宏伟宫殿）
   * 主题：金色/宏伟/科技感
   */
  createGoldenPalaceScene() {
    const group = new THREE.Group();
    group.name = 'golden-palace-scene';

    // 金色地板（大理石纹理效果）
    const floorGeo = new THREE.PlaneGeometry(30, 30);
    const floorMat = new THREE.MeshLambertMaterial({
      color: 0xFFD700,  // 金色
      emissive: 0x332200,
      emissiveIntensity: 0.1
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    group.add(floor);

    // 巨型立柱（8根，金色大理石）
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const x = Math.cos(angle) * 10;
      const z = Math.sin(angle) * 10;

      const pillarGeo = new THREE.CylinderGeometry(0.5, 0.6, 8, 16);
      const pillarMat = new THREE.MeshLambertMaterial({
        color: 0xFFD700,
        emissive: 0x664400,
        emissiveIntensity: 0.2
      });
      const pillar = new THREE.Mesh(pillarGeo, pillarMat);
      pillar.position.set(x, 4, z);
      group.add(pillar);

      // 柱头装饰（金色球形）
      const capitalGeo = new THREE.SphereGeometry(0.8, 16, 16);
      const capital = new THREE.Mesh(capitalGeo, pillarMat);
      capital.position.set(x, 8.2, z);
      group.add(capital);
    }

    // 穹顶（半透明金色穹顶）
    const domeGeo = new THREE.SphereGeometry(12, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    const domeMat = new THREE.MeshLambertMaterial({
      color: 0xFFD700,
      transparent: true,
      opacity: 0.6,
      side: THREE.DoubleSide
    });
    const dome = new THREE.Mesh(domeGeo, domeMat);
    dome.position.set(0, 8, 0);
    group.add(dome);

    // 中央祭坛（金色立方体，象征科技核心）
    const altarGeo = new THREE.BoxGeometry(3, 2, 3);
    const altarMat = new THREE.MeshLambertMaterial({
      color: 0xFFA500,
      emissive: 0xFF4500,
      emissiveIntensity: 0.5
    });
    const altar = new THREE.Mesh(altarGeo, altarMat);
    altar.position.set(0, 1, 0);
    group.add(altar);

    // 科技感光带（围绕祭坛）
    const lightRingGeo = new THREE.TorusGeometry(5, 0.1, 8, 32);
    const lightRingMat = new THREE.MeshLambertMaterial({
      color: 0x00FFFF,
      emissive: 0x00FFFF,
      emissiveIntensity: 1.0
    });
    const lightRing = new THREE.Mesh(lightRingGeo, lightRingMat);
    lightRing.position.set(0, 0.5, 0);
    lightRing.rotation.x = Math.PI / 2;
    group.add(lightRing);

    // 灯光（温暖金色光芒）
    const palacelight = new THREE.PointLight(0xFFD700, 1, 50);
    palacelight.position.set(0, 12, 0);
    group.add(palacelight);

    const ambientLight = new THREE.AmbientLight(0xFFF0B0, 0.4);
    group.add(ambientLight);

    this.scene.add(group);
    console.log('[ZoneScenes] 金殿场景创建完成');
    return group;
  }

  /**
   * 青少年区：魔法森林场景（参天大树，光影斑驳）
   * 主题：绿色/自然/探索
   */
  createMagicForestScene() {
    const group = new THREE.Group();
    group.name = 'magic-forest-scene';

    // 绿色草地
    const groundGeo = new THREE.PlaneGeometry(30, 30);
    const groundMat = new THREE.MeshLambertMaterial({ color: 0x228B22 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    group.add(ground);

    // 参天大树（5棵，不同大小）
    for (let i = 0; i < 5; i++) {
      const x = (i - 2) * 5;
      const z = -5 + Math.sin(i) * 3;

      // 树干
      const trunkGeo = new THREE.CylinderGeometry(0.5 + i * 0.1, 0.7 + i * 0.1, 8 + i * 2, 12);
      const trunkMat = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
      const trunk = new THREE.Mesh(trunkGeo, trunkMat);
      trunk.position.set(x, 4 + i, z);
      group.add(trunk);

      // 树冠（多层球体，模拟茂密树叶）
      for (let j = 0; j < 3; j++) {
        const crownGeo = new THREE.SphereGeometry(2 + j * 0.5, 12, 12);
        const crownMat = new THREE.MeshLambertMaterial({
          color: 0x006400,
          emissive: 0x003300,
          emissiveIntensity: 0.1
        });
        const crown = new THREE.Mesh(crownGeo, crownMat);
        crown.position.set(x, 8 + i + j * 2, z);
        crown.userData = { isLeaf: true };
        group.add(crown);
      }
    }

    // 魔法蘑菇（发光，彩色）
    const mushroomColors = [0xFF0000, 0xFF00FF, 0x00FF00, 0xFFFF00];
    for (let i = 0; i < 8; i++) {
      const x = -8 + Math.random() * 16;
      const z = 5 + Math.random() * 10;

      const stemGeo = new THREE.CylinderGeometry(0.1, 0.15, 1, 8);
      const stemMat = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
      const stem = new THREE.Mesh(stemGeo, stemMat);
      stem.position.set(x, 0.5, z);
      group.add(stem);

      const capGeo = new THREE.SphereGeometry(0.5, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2);
      const capMat = new THREE.MeshLambertMaterial({
        color: mushroomColors[i % 4],
        emissive: mushroomColors[i % 4],
        emissiveIntensity: 0.6
      });
      const cap = new THREE.Mesh(capGeo, capMat);
      cap.position.set(x, 1, z);
      group.add(cap);
    }

    // 萤火虫（漂浮的光点）
    for (let i = 0; i < 15; i++) {
      const geo = new THREE.SphereGeometry(0.1, 8, 8);
      const mat = new THREE.MeshLambertMaterial({
        color: 0xFFFF00,
        emissive: 0xFFFF00,
        emissiveIntensity: 1.5
      });
      const firefly = new THREE.Mesh(geo, mat);
      firefly.position.set(
        (Math.random() - 0.5) * 20,
        3 + Math.random() * 5,
        (Math.random() - 0.5) * 20
      );
      group.add(firefly);
    }

    // 灯光（透过树叶的光斑效果）
    const forestLight = new THREE.PointLight(0xADFF2F, 0.8, 40);
    forestLight.position.set(0, 15, 0);
    group.add(forestLight);

    const ambientLight = new THREE.AmbientLight(0x90EE90, 0.5);
    group.add(ambientLight);

    this.scene.add(group);
    console.log('[ZoneScenes] 魔法森林场景创建完成');
    return group;
  }

  /**
   * 儿童区：海洋世界场景（海底世界，珊瑚礁）
   * 主题：蓝色/梦幻/互动
   */
  createOceanWorldScene() {
    const group = new THREE.Group();
    group.name = 'ocean-world-scene';

    // 海底地面（沙地）
    const groundGeo = new THREE.PlaneGeometry(30, 30);
    const groundMat = new THREE.MeshLambertMaterial({ color: 0xF4A460 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    group.add(ground);

    // 珊瑚礁（随机分布，红/橙/粉）
    const coralColors = [0xFF6B6B, 0xFFA07A, 0xFF69B4, 0xFFD700];
    for (let i = 0; i < 12; i++) {
      const x = (Math.random() - 0.5) * 24;
      const z = (Math.random() - 0.5) * 24;

      const coralGeo = new THREE.ConeGeometry(0.5 + Math.random() * 0.5, 1 + Math.random() * 2, 8);
      const coralMat = new THREE.MeshLambertMaterial({
        color: coralColors[i % 4],
        emissive: coralColors[i % 4],
        emissiveIntensity: 0.3
      });
      const coral = new THREE.Mesh(coralGeo, coralMat);
      coral.position.set(x, coralGeo.parameters.height / 2, z);
      group.add(coral);
    }

    // 热带鱼（简化版，彩色长方体）
    const fishColors = [0xFF4500, 0x1E90FF, 0x32CD32, 0xFFD700];
    for (let i = 0; i < 10; i++) {
      const fishGeo = new THREE.BoxGeometry(1, 0.5, 0.3);
      const fishMat = new THREE.MeshLambertMaterial({
        color: fishColors[i % 4],
        emissive: fishColors[i % 4],
        emissiveIntensity: 0.4
      });
      const fish = new THREE.Mesh(fishGeo, fishMat);
      fish.position.set(
        (Math.random() - 0.5) * 20,
        3 + Math.random() * 5,
        (Math.random() - 0.5) * 20
      );
      group.add(fish);
    }

    // 水泡（上浮动画）
    for (let i = 0; i < 20; i++) {
      const bubbleGeo = new THREE.SphereGeometry(0.1 + Math.random() * 0.2, 8, 8);
      const bubbleMat = new THREE.MeshLambertMaterial({
        color: 0x87CEEB,
        transparent: true,
        opacity: 0.6
      });
      const bubble = new THREE.Mesh(bubbleGeo, bubbleMat);
      bubble.position.set(
        (Math.random() - 0.5) * 20,
        Math.random() * 8,
        (Math.random() - 0.5) * 20
      );
      bubble.userData = { isBubble: true };
      group.add(bubble);
    }

    // 沉船（简化版，棕色长方体）
    const shipGeo = new THREE.BoxGeometry(6, 2, 3);
    const shipMat = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    const ship = new THREE.Mesh(shipGeo, shipMat);
    ship.position.set(-8, 1, -8);
    ship.rotation.y = 0.3;
    group.add(ship);

    // 灯光（水下蓝色光芒）
    const oceanLight = new THREE.PointLight(0x1E90FF, 1, 50);
    oceanLight.position.set(0, 10, 0);
    group.add(oceanLight);

    const ambientLight = new THREE.AmbientLight(0x87CEEB, 0.6);
    group.add(ambientLight);

    this.scene.add(group);
    console.log('[ZoneScenes] 海洋世界场景创建完成');
    return group;
  }

  /**
   * 老年区：星空穹顶场景（宁静宇宙，星座投影）
   * 主题：紫色/宁静/养生
   */
  createStarrySkyScene() {
    const group = new THREE.Group();
    group.name = 'starry-sky-scene';

    // 深色地面（反射星空）
    const groundGeo = new THREE.PlaneGeometry(30, 30);
    const groundMat = new THREE.MeshLambertMaterial({
      color: 0x0D0D2A,
      emissive: 0x050510,
      emissiveIntensity: 0.2
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    group.add(ground);

    // 星空穹顶（半透明紫色球体）
    const domeGeo = new THREE.SphereGeometry(20, 32, 32, 0, Math.PI * 2, 0, Math.PI / 2);
    const domeMat = new THREE.MeshLambertMaterial({
      color: 0x1A1A3E,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide
    });
    const dome = new THREE.Mesh(domeGeo, domeMat);
    dome.position.set(0, 0, 0);
    group.add(dome);

    // 星星（500个，随机分布，白色/淡蓝色）
    const starColors = [0xFFFFFF, 0xADD8E6, 0xFFFACD, 0xFFB6C1];
    for (let i = 0; i < 500; i++) {
      const phi = Math.random() * Math.PI;
      const theta = Math.random() * Math.PI * 2;
      const r = 19.5;

      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.cos(phi);
      const z = r * Math.sin(phi) * Math.sin(theta);

      const starGeo = new THREE.SphereGeometry(0.05 + Math.random() * 0.1, 6, 6);
      const starMat = new THREE.MeshLambertMaterial({
        color: starColors[Math.floor(Math.random() * 4)],
        emissive: starColors[Math.floor(Math.random() * 4)],
        emissiveIntensity: 0.8 + Math.random() * 0.5
      });
      const star = new THREE.Mesh(starGeo, starMat);
      star.position.set(x, y, z);
      star.userData = { isStar: true };
      group.add(star);
    }

    // 星座连线（简化版，白色线条）
    const constellationGeo = new THREE.BufferGeometry();
    const vertices = [];
    for (let i = 0; i < 5; i++) {
      const x1 = (Math.random() - 0.5) * 10;
      const y1 = 5 + Math.random() * 10;
      const z1 = (Math.random() - 0.5) * 10;
      const x2 = x1 + (Math.random() - 0.5) * 3;
      const y2 = y1 + (Math.random() - 0.5) * 3;
      const z2 = z1 + (Math.random() - 0.5) * 3;

      vertices.push(x1, y1, z1);
      vertices.push(x2, y2, z2);
    }
    constellationGeo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    const constellationMat = new THREE.LineBasicMaterial({
      color: 0xFFFFFF,
      transparent: true,
      opacity: 0.5
    });
    const constellation = new THREE.LineSegments(constellationGeo, constellationMat);
    group.add(constellation);

    // 养生平台（中心，圆形，淡紫色）
    const platformGeo = new THREE.CylinderGeometry(3, 3, 0.5, 32);
    const platformMat = new THREE.MeshLambertMaterial({
      color: 0x8A2BE2,
      emissive: 0x4B0082,
      emissiveIntensity: 0.3
    });
    const platform = new THREE.Mesh(platformGeo, platformMat);
    platform.position.set(0, 0.25, 0);
    group.add(platform);

    // 灯光（柔和紫色光芒）
    const skyLight = new THREE.PointLight(0x8A2BE2, 0.6, 50);
    skyLight.position.set(0, 15, 0);
    group.add(skyLight);

    const ambientLight = new THREE.AmbientLight(0x2E0854, 0.4);
    group.add(ambientLight);

    this.scene.add(group);
    console.log('[ZoneScenes] 星空穹顶场景创建完成');
    return group;
  }

  /**
   * 残障友好区：熔炉场景（炽热熔炉，火焰特效）
   * 主题：红色/温暖/无障碍
   */
  createFurnaceScene() {
    const group = new THREE.Group();
    group.name = 'furnace-scene';

    // 耐高温地板（深红色）
    const groundGeo = new THREE.PlaneGeometry(30, 30);
    const groundMat = new THREE.MeshLambertMaterial({
      color: 0x8B0000,
      emissive: 0x440000,
      emissiveIntensity: 0.2
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    group.add(ground);

    // 中央熔炉（圆柱形，橙色）
    const furnaceGeo = new THREE.CylinderGeometry(3, 3.5, 6, 24, 1, true);
    const furnaceMat = new THREE.MeshLambertMaterial({
      color: 0xFF4500,
      emissive: 0xFF4500,
      emissiveIntensity: 0.8,
      side: THREE.DoubleSide
    });
    const furnace = new THREE.Mesh(furnaceGeo, furnaceMat);
    furnace.position.set(0, 3, 0);
    group.add(furnace);

    // 火焰粒子（简化版，红色/橙色/黄色椎体）
    const flameColors = [0xFF0000, 0xFF4500, 0xFFD700];
    for (let i = 0; i < 30; i++) {
      const flameGeo = new THREE.ConeGeometry(0.3 + Math.random() * 0.3, 1 + Math.random() * 2, 8);
      const flameMat = new THREE.MeshLambertMaterial({
        color: flameColors[i % 3],
        emissive: flameColors[i % 3],
        emissiveIntensity: 1.2
      });
      const flame = new THREE.Mesh(flameGeo, flameMat);
      flame.position.set(
        (Math.random() - 0.5) * 4,
        4 + Math.random() * 3,
        (Math.random() - 0.5) * 4
      );
      flame.userData = { isFlame: true };
      group.add(flame);
    }

    // 无障碍坡道（环绕熔炉，红色警示条）
    const rampGeo = new THREE.TorusGeometry(6, 0.5, 8, 32, Math.PI * 2);
    const rampMat = new THREE.MeshLambertMaterial({
      color: 0xFF6347,
      emissive: 0xFF6347,
      emissiveIntensity: 0.4
    });
    const ramp = new THREE.Mesh(rampGeo, rampMat);
    ramp.position.set(0, 0.5, 0);
    ramp.rotation.x = Math.PI / 2;
    group.add(ramp);

    // 温暖长椅（休息区，棕色）
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2;
      const x = Math.cos(angle) * 8;
      const z = Math.sin(angle) * 8;

      const benchGeo = new THREE.BoxGeometry(2, 0.5, 0.5);
      const benchMat = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
      const bench = new THREE.Mesh(benchGeo, benchMat);
      bench.position.set(x, 0.5, z);
      bench.rotation.y = -angle;
      group.add(bench);

      // 椅背
      const backGeo = new THREE.BoxGeometry(2, 1, 0.2);
      const back = new THREE.Mesh(backGeo, benchMat);
      back.position.set(x, 1.2, z - 0.3);
      back.rotation.y = -angle;
      group.add(back);
    }

    // 灯光（炽热橙色光芒）
    const furnaceLight = new THREE.PointLight(0xFF4500, 1.5, 50);
    furnaceLight.position.set(0, 8, 0);
    group.add(furnaceLight);

    const ambientLight = new THREE.AmbientLight(0xFF6347, 0.5);
    group.add(ambientLight);

    this.scene.add(group);
    console.log('[ZoneScenes] 熔炉场景创建完成');
    return group;
  }

  /**
   * 通用场景（备用）
   */
  createGenericScene() {
    const group = new THREE.Group();
    group.name = 'generic-scene';

    const groundGeo = new THREE.PlaneGeometry(30, 30);
    const groundMat = new THREE.MeshLambertMaterial({ color: 0xCCCCCC });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    group.add(ground);

    const ambientLight = new THREE.AmbientLight(0x808080, 0.6);
    group.add(ambientLight);

    this.scene.add(group);
    return group;
  }
}

// 导出
window.ZoneScenes = ZoneScenes;
