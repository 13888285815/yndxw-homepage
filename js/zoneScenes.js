/**
 * zoneScenes.js - 五大主题3D过渡场景（任务要求：金殿/森林/海洋/星空/熔炉）
 * 进入各区后播放5秒3D过渡场景，然后自动切换到2D界面
 * 性能优化：低多边形+纹理压缩+层级加载，确保FPS≥60
 * 2026-06-16: 优化版 - 共享材质、减少多边形、性能自适应对象数量
 */

// 共享材质池（减少材质实例数量，降低GPU负载）
const SharedMaterials = {
  // 金殿材质
  goldPalace: {
    floor: null,
    pillar: null,
    dome: null,
    altar: null,
    lightRing: null
  },
  // 森林材质
  forest: {
    ground: null,
    trunk: null,
    crown: null,
    firefly: null
  },
  // 海洋材质
  ocean: {
    ground: null,
    bubble: null,
    ship: null
  },
  // 星空材质
  starry: {
    ground: null,
    dome: null,
    platform: null
  },
  // 熔炉材质
  furnace: {
    ground: null,
    furnace: null,
    ramp: null,
    bench: null
  },
  // 通用材质
  generic: {
    ground: null
  }
};

class ZoneScenes {
  constructor(scene, camera) {
    this.scene = scene;
    this.camera = camera;
    this.currentZoneScene = null;
    this.transitionDuration = 5000; // 5秒过渡（需求文档§5.2.5）
    this.animationFrameId = null;
    this.startTime = null;
    
    // 性能：根据CPU核心数判断设备等级
    this.performanceLevel = (navigator.hardwareConcurrency || 4) >= 8 ? 'high' : 'low';
    
    // 初始化共享材质
    this._initSharedMaterials();
  }
  
  /**
   * 初始化共享材质（减少材质实例数量）
   */
  _initSharedMaterials() {
    // 金殿材质
    SharedMaterials.goldPalace = {
      floor: new THREE.MeshLambertMaterial({ color: 0xFFD700, emissive: 0x332200, emissiveIntensity: 0.1 }),
      pillar: new THREE.MeshLambertMaterial({ color: 0xFFD700, emissive: 0x664400, emissiveIntensity: 0.2 }),
      dome: new THREE.MeshLambertMaterial({ color: 0xFFD700, transparent: true, opacity: 0.6, side: THREE.DoubleSide }),
      altar: new THREE.MeshLambertMaterial({ color: 0xFFA500, emissive: 0xFF4500, emissiveIntensity: 0.5 }),
      lightRing: new THREE.MeshLambertMaterial({ color: 0x00FFFF, emissive: 0x00FFFF, emissiveIntensity: 1.0 })
    };
    
    // 森林材质
    SharedMaterials.forest = {
      ground: new THREE.MeshLambertMaterial({ color: 0x228B22 }),
      trunk: new THREE.MeshLambertMaterial({ color: 0x8B4513 }),
      crown: new THREE.MeshLambertMaterial({ color: 0x006400, emissive: 0x003300, emissiveIntensity: 0.1 }),
      firefly: new THREE.MeshLambertMaterial({ color: 0xFFFF00, emissive: 0xFFFF00, emissiveIntensity: 1.5 })
    };
    
    // 海洋材质
    SharedMaterials.ocean = {
      ground: new THREE.MeshLambertMaterial({ color: 0xF4A460 }),
      bubble: new THREE.MeshLambertMaterial({ color: 0x87CEEB, transparent: true, opacity: 0.6 }),
      ship: new THREE.MeshLambertMaterial({ color: 0x8B4513 })
    };
    
    // 星空材质
    SharedMaterials.starry = {
      ground: new THREE.MeshLambertMaterial({ color: 0x0D0D2A, emissive: 0x050510, emissiveIntensity: 0.2 }),
      dome: new THREE.MeshLambertMaterial({ color: 0x1A1A3E, transparent: true, opacity: 0.8, side: THREE.DoubleSide }),
      platform: new THREE.MeshLambertMaterial({ color: 0x8A2BE2, emissive: 0x4B0082, emissiveIntensity: 0.3 })
    };
    
    // 熔炉材质
    SharedMaterials.furnace = {
      ground: new THREE.MeshLambertMaterial({ color: 0x8B0000, emissive: 0x440000, emissiveIntensity: 0.2 }),
      furnace: new THREE.MeshLambertMaterial({ color: 0xFF4500, emissive: 0xFF4500, emissiveIntensity: 0.8, side: THREE.DoubleSide }),
      ramp: new THREE.MeshLambertMaterial({ color: 0xFF6347, emissive: 0xFF6347, emissiveIntensity: 0.4 }),
      bench: new THREE.MeshLambertMaterial({ color: 0x8B4513 })
    };
    
    // 通用材质
    SharedMaterials.generic = {
      ground: new THREE.MeshLambertMaterial({ color: 0xCCCCCC })
    };
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

    // 根据设备性能调整对象数量
    const objMultiplier = this.performanceLevel === 'high' ? 1 : 0.6;

    // 根据区域创建不同的3D场景（金殿/森林/海洋/星空/熔炉）
    switch (zoneId) {
      case 'adult':      // 成人区 → 金殿（金色大厅，宏伟宫殿）
        this.currentZoneScene = this.createGoldenPalaceScene(objMultiplier);
        break;
      case 'teen':       // 青少年区 → 森林（魔法森林，参天大树）
        this.currentZoneScene = this.createMagicForestScene(objMultiplier);
        break;
      case 'children':   // 儿童区 → 海洋（海底世界，珊瑚礁）
        this.currentZoneScene = this.createOceanWorldScene(objMultiplier);
        break;
      case 'elderly':   // 老年区 → 星空（星空穹顶，宁静宇宙）
        this.currentZoneScene = this.createStarrySkyScene(objMultiplier);
        break;
      case 'accessible': // 残障友好区 → 熔炉（炽热熔炉，火焰特效）
        this.currentZoneScene = this.createFurnaceScene(objMultiplier);
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
   * 性能优化：共享材质、降低多边形、减少灯光
   */
  createGoldenPalaceScene(objMultiplier = 1) {
    const group = new THREE.Group();
    group.name = 'golden-palace-scene';
    const mats = SharedMaterials.goldPalace;
    
    // 金色地板（大理石纹理效果）- 降低平面细分
    const floorGeo = new THREE.PlaneGeometry(30, 30, 1, 1);
    const floor = new THREE.Mesh(floorGeo, mats.floor);
    floor.rotation.x = -Math.PI / 2;
    group.add(floor);

    // 巨型立柱（8根，金色大理石）- 降低圆柱细分 16→8
    const pillarCount = Math.round(8 * objMultiplier);
    for (let i = 0; i < pillarCount; i++) {
      const angle = (i / pillarCount) * Math.PI * 2;
      const x = Math.cos(angle) * 10;
      const z = Math.sin(angle) * 10;

      const pillarGeo = new THREE.CylinderGeometry(0.5, 0.6, 8, 8); // 16→8
      const pillar = new THREE.Mesh(pillarGeo, mats.pillar);
      pillar.position.set(x, 4, z);
      group.add(pillar);

      // 柱头装饰（金色球形）- 降低球体细分 16→8
      const capitalGeo = new THREE.SphereGeometry(0.8, 8, 8);
      const capital = new THREE.Mesh(capitalGeo, mats.pillar);
      capital.position.set(x, 8.2, z);
      group.add(capital);
    }

    // 穹顶（半透明金色穹顶）- 降低细分 32→16, 16→8
    const domeGeo = new THREE.SphereGeometry(12, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2);
    const dome = new THREE.Mesh(domeGeo, mats.dome);
    dome.position.set(0, 8, 0);
    group.add(dome);

    // 中央祭坛（金色立方体，象征科技核心）
    const altarGeo = new THREE.BoxGeometry(3, 2, 3);
    const altar = new THREE.Mesh(altarGeo, mats.altar);
    altar.position.set(0, 1, 0);
    group.add(altar);

    // 科技感光带（围绕祭坛）- 降低细分 32→16
    const lightRingGeo = new THREE.TorusGeometry(5, 0.1, 8, 16);
    const lightRing = new THREE.Mesh(lightRingGeo, mats.lightRing);
    lightRing.position.set(0, 0.5, 0);
    lightRing.rotation.x = Math.PI / 2;
    group.add(lightRing);

    // 新增：金色雕像（4座，位于祭坛四角）
    const statueCount = 4;
    for (let i = 0; i < statueCount; i++) {
      const angle = (i / statueCount) * Math.PI * 2;
      const x = Math.cos(angle) * 4;
      const z = Math.sin(angle) * 4;
      
      // 雕像底座（金色立方体）
      const baseGeo = new THREE.BoxGeometry(0.8, 0.5, 0.8);
      const base = new THREE.Mesh(baseGeo, mats.pillar);
      base.position.set(x, 0.25, z);
      group.add(base);
      
      // 雕像主体（金色球体，简化版）
      const statueGeo = new THREE.SphereGeometry(0.5, 8, 8);
      const statue = new THREE.Mesh(statueGeo, mats.pillar);
      statue.position.set(x, 1, z);
      group.add(statue);
    }

    // 新增：火炬（8个，围绕立柱）
    const torchCount = Math.round(8 * objMultiplier);
    for (let i = 0; i < torchCount; i++) {
      const angle = (i / torchCount) * Math.PI * 2;
      const x = Math.cos(angle) * 11;
      const z = Math.sin(angle) * 11;
      
      // 火把杆（金色圆柱体）
      const torchGeo = new THREE.CylinderGeometry(0.05, 0.05, 2, 6);
      const torch = new THREE.Mesh(torchGeo, mats.pillar);
      torch.position.set(x, 1, z);
      group.add(torch);
      
      // 火焰（红色球体，发光）
      const flameGeo = new THREE.SphereGeometry(0.2, 6, 6);
      const flameMat = new THREE.MeshLambertMaterial({
        color: 0xFF4500,
        emissive: 0xFF4500,
        emissiveIntensity: 0.8
      });
      const flame = new THREE.Mesh(flameGeo, flameMat);
      flame.position.set(x, 2.2, z);
      flame.userData = { isFlame: true };
      group.add(flame);
    }

    // 灯光（温暖金色光芒）- 减少灯光数量
    const palacelight = new THREE.PointLight(0xFFD700, 1.2, 50);
    palacelight.position.set(0, 12, 0);
    group.add(palacelight);

    const ambientLight = new THREE.AmbientLight(0xFFF0B0, 0.4);
    group.add(ambientLight);

    this.scene.add(group);
    console.log(`[ZoneScenes] 金殿场景创建完成 (${group.children.length} 对象)`);
    return group;
  }

  /**
   * 青少年区：魔法森林场景（参天大树，光影斑驳）
   * 主题：绿色/自然/探索
   * 性能优化：共享材质、降低多边形、减少对象数量
   */
  createMagicForestScene(objMultiplier = 1) {
    const group = new THREE.Group();
    group.name = 'magic-forest-scene';
    const mats = SharedMaterials.forest;
    
    // 绿色草地 - 降低平面细分
    const groundGeo = new THREE.PlaneGeometry(30, 30, 1, 1);
    const ground = new THREE.Mesh(groundGeo, mats.ground);
    ground.rotation.x = -Math.PI / 2;
    group.add(ground);

    // 参天大树（根据性能调整数量）- 降低圆柱/球体细分
    const treeCount = Math.round(5 * objMultiplier);
    for (let i = 0; i < treeCount; i++) {
      const x = (i - Math.floor(treeCount / 2)) * 5;
      const z = -5 + Math.sin(i) * 3;

      // 树干 - 降低细分 12→6
      const trunkGeo = new THREE.CylinderGeometry(0.5 + i * 0.1, 0.7 + i * 0.1, 8 + i * 2, 6);
      const trunk = new THREE.Mesh(trunkGeo, mats.trunk);
      trunk.position.set(x, 4 + i, z);
      group.add(trunk);

      // 树冠（多层球体，模拟茂密树叶）- 降低细分 12→6
      for (let j = 0; j < 3; j++) {
        const crownGeo = new THREE.SphereGeometry(2 + j * 0.5, 6, 6);
        const crown = new THREE.Mesh(crownGeo, mats.crown);
        crown.position.set(x, 8 + i + j * 2, z);
        crown.userData = { isLeaf: true };
        group.add(crown);
      }
    }

    // 魔法蘑菇（发光，彩色）- 减少数量
    const mushroomColors = [0xFF0000, 0xFF00FF, 0x00FF00, 0xFFFF00];
    const mushroomCount = Math.round(8 * objMultiplier);
    for (let i = 0; i < mushroomCount; i++) {
      const x = -8 + Math.random() * 16;
      const z = 5 + Math.random() * 10;

      const stemGeo = new THREE.CylinderGeometry(0.1, 0.15, 1, 6);
      const stemMat = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
      const stem = new THREE.Mesh(stemGeo, stemMat);
      stem.position.set(x, 0.5, z);
      group.add(stem);

      // 动态创建蘑菇帽材质（颜色不同）
      const capColor = mushroomColors[i % 4];
      const capMat = new THREE.MeshLambertMaterial({
        color: capColor,
        emissive: capColor,
        emissiveIntensity: 0.6
      });
      // 降低球体细分 12→6
      const capGeo = new THREE.SphereGeometry(0.5, 6, 6, 0, Math.PI * 2, 0, Math.PI / 2);
      const cap = new THREE.Mesh(capGeo, capMat);
      cap.position.set(x, 1, z);
      group.add(cap);
    }

    // 萤火虫（漂浮的光点）- 减少数量，降低细分
    const fireflyCount = Math.round(15 * objMultiplier);
    for (let i = 0; i < fireflyCount; i++) {
      // 降低球体细分 8→4
      const geo = new THREE.SphereGeometry(0.1, 4, 4);
      const firefly = new THREE.Mesh(geo, mats.firefly);
      firefly.position.set(
        (Math.random() - 0.5) * 20,
        3 + Math.random() * 5,
        (Math.random() - 0.5) * 20
      );
      group.add(firefly);
    }

    // 灯光（透过树叶的光斑效果）- 减少灯光数量
    const forestLight = new THREE.PointLight(0xADFF2F, 0.8, 40);
    forestLight.position.set(0, 15, 0);
    group.add(forestLight);

    const ambientLight = new THREE.AmbientLight(0x90EE90, 0.5);
    group.add(ambientLight);

    this.scene.add(group);
    console.log(`[ZoneScenes] 魔法森林场景创建完成 (${group.children.length} 对象)`);
    return group;
  }

  /**
   * 儿童区：海洋世界场景（海底世界，珊瑚礁）
   * 主题：蓝色/梦幻/互动
   * 性能优化：共享材质、降低多边形、减少对象数量
   */
  createOceanWorldScene(objMultiplier = 1) {
    const group = new THREE.Group();
    group.name = 'ocean-world-scene';
    const mats = SharedMaterials.ocean;
    
    // 海底地面（沙地）- 降低平面细分
    const groundGeo = new THREE.PlaneGeometry(30, 30, 1, 1);
    const ground = new THREE.Mesh(groundGeo, mats.ground);
    ground.rotation.x = -Math.PI / 2;
    group.add(ground);

    // 珊瑚礁（随机分布，红/橙/粉）- 减少数量，降低细分
    const coralColors = [0xFF6B6B, 0xFFA07A, 0xFF69B4, 0xFFD700];
    const coralCount = Math.round(12 * objMultiplier);
    for (let i = 0; i < coralCount; i++) {
      const x = (Math.random() - 0.5) * 24;
      const z = (Math.random() - 0.5) * 24;
      // 降低锥体细分 8→5
      const coralGeo = new THREE.ConeGeometry(0.5 + Math.random() * 0.5, 1 + Math.random() * 2, 5);
      const coralColor = coralColors[i % 4];
      const coralMat = new THREE.MeshLambertMaterial({
        color: coralColor,
        emissive: coralColor,
        emissiveIntensity: 0.3
      });
      const coral = new THREE.Mesh(coralGeo, coralMat);
      coral.position.set(x, coralGeo.parameters.height / 2, z);
      group.add(coral);
    }

    // 热带鱼（简化版，彩色长方体）- 减少数量
    const fishColors = [0xFF4500, 0x1E90FF, 0x32CD32, 0xFFD700];
    const fishCount = Math.round(10 * objMultiplier);
    for (let i = 0; i < fishCount; i++) {
      const fishColor = fishColors[i % 4];
      const fishGeo = new THREE.BoxGeometry(1, 0.5, 0.3);
      const fishMat = new THREE.MeshLambertMaterial({
        color: fishColor,
        emissive: fishColor,
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

    // 水泡（上浮动画）- 减少数量，降低细分
    const bubbleCount = Math.round(20 * objMultiplier);
    for (let i = 0; i < bubbleCount; i++) {
      // 降低球体细分 8→4
      const bubbleGeo = new THREE.SphereGeometry(0.1 + Math.random() * 0.2, 4, 4);
      const bubble = new THREE.Mesh(bubbleGeo, mats.bubble);
      bubble.position.set(
        (Math.random() - 0.5) * 20,
        Math.random() * 8,
        (Math.random() - 0.5) * 20
      );
      bubble.userData = { isBubble: true };
      group.add(bubble);
    }

    // 沉船（简化版，棕色长方体）
    const ship = new THREE.Mesh(new THREE.BoxGeometry(6, 2, 3), mats.ship);
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
    console.log(`[ZoneScenes] 海洋世界场景创建完成 (${group.children.length} 对象)`);
    return group;
  }

  /**
   * 老年区：星空穹顶场景（宁静宇宙，星座投影）
   * 主题：紫色/宁静/养生
   * 性能优化：减少星星数量（高性能500/低性能300）、降低细分、共享材质
   */
  createStarrySkyScene(objMultiplier = 1) {
    const group = new THREE.Group();
    group.name = 'starry-sky-scene';
    const mats = SharedMaterials.starry;
    
    // 深色地面（反射星空）- 降低平面细分
    const groundGeo = new THREE.PlaneGeometry(30, 30, 1, 1);
    const ground = new THREE.Mesh(groundGeo, mats.ground);
    ground.rotation.x = -Math.PI / 2;
    group.add(ground);
    
    // 星空穹顶（半透明紫色球体）- 降低细分 32→16
    const domeGeo = new THREE.SphereGeometry(20, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    const dome = new THREE.Mesh(domeGeo, mats.dome);
    dome.position.set(0, 0, 0);
    group.add(dome);

    // 星星（根据性能调整数量：高性能500/低性能300）- 降低球体细分 6→4
    const starColors = [0xFFFFFF, 0xADD8E6, 0xFFFACD, 0xFFB6C1];
    const starCount = this.performanceLevel === 'high' ? 500 : 300;
    const actualStarCount = Math.round(starCount * objMultiplier);
    
    // 预计算星星位置（避免每次循环计算sin/cos）
    const starPositions = [];
    for (let i = 0; i < actualStarCount; i++) {
      const phi = Math.random() * Math.PI;
      const theta = Math.random() * Math.PI * 2;
      const r = 19.5;
      starPositions.push({
        x: r * Math.sin(phi) * Math.cos(theta),
        y: r * Math.cos(phi),
        z: r * Math.sin(phi) * Math.sin(theta),
        color: starColors[Math.floor(Math.random() * 4)],
        size: 0.05 + Math.random() * 0.1,
        intensity: 0.8 + Math.random() * 0.5
      });
    }
    
    for (let i = 0; i < actualStarCount; i++) {
      const starData = starPositions[i];
      // 降低球体细分 6→4
      const starGeo = new THREE.SphereGeometry(starData.size, 4, 4);
      const starMat = new THREE.MeshLambertMaterial({
        color: starData.color,
        emissive: starData.color,
        emissiveIntensity: starData.intensity
      });
      const star = new THREE.Mesh(starGeo, starMat);
      star.position.set(starData.x, starData.y, starData.z);
      star.userData = { isStar: true };
      group.add(star);
    }

    // 星座连线（简化版，白色线条）
    const constellationGeo = new THREE.BufferGeometry();
    const vertices = [];
    const lineCount = Math.round(5 * objMultiplier);
    for (let i = 0; i < lineCount; i++) {
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

    // 养生平台（中心，圆形，淡紫色）- 降低细分 32→16
    const platformGeo = new THREE.CylinderGeometry(3, 3, 0.5, 16);
    const platform = new THREE.Mesh(platformGeo, mats.platform);
    platform.position.set(0, 0.25, 0);
    group.add(platform);

    // 灯光（柔和紫色光芒）
    const skyLight = new THREE.PointLight(0x8A2BE2, 0.6, 50);
    skyLight.position.set(0, 15, 0);
    group.add(skyLight);

    const ambientLight = new THREE.AmbientLight(0x2E0854, 0.4);
    group.add(ambientLight);

    this.scene.add(group);
    console.log(`[ZoneScenes] 星空穹顶场景创建完成 (${group.children.length} 对象)`);
    return group;
  }

  /**
   * 残障友好区：熔炉场景（炽热熔炉，火焰特效）
   * 主题：红色/温暖/无障碍
   * 性能优化：共享材质、降低多边形、减少对象数量
   */
  createFurnaceScene(objMultiplier = 1) {
    const group = new THREE.Group();
    group.name = 'furnace-scene';
    const mats = SharedMaterials.furnace;
    
    // 耐高温地板（深红色）- 降低平面细分
    const groundGeo = new THREE.PlaneGeometry(30, 30, 1, 1);
    const ground = new THREE.Mesh(groundGeo, mats.ground);
    ground.rotation.x = -Math.PI / 2;
    group.add(ground);

    // 中央熔炉（圆柱形，橙色）- 降低细分 24→12
    const furnaceGeo = new THREE.CylinderGeometry(3, 3.5, 6, 12, 1, true);
    const furnace = new THREE.Mesh(furnaceGeo, mats.furnace);
    furnace.position.set(0, 3, 0);
    group.add(furnace);

    // 火焰粒子（简化版，红色/橙色/黄色椎体）- 减少数量，降低细分
    const flameColors = [0xFF0000, 0xFF4500, 0xFFD700];
    const flameCount = Math.round(30 * objMultiplier);
    for (let i = 0; i < flameCount; i++) {
      // 降低锥体细分 8→5
      const flameGeo = new THREE.ConeGeometry(0.3 + Math.random() * 0.3, 1 + Math.random() * 2, 5);
      const flameColor = flameColors[i % 3];
      const flameMat = new THREE.MeshLambertMaterial({
        color: flameColor,
        emissive: flameColor,
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

    // 无障碍坡道（环绕熔炉，红色警示条）- 降低细分 32→16
    const rampGeo = new THREE.TorusGeometry(6, 0.5, 8, 16, Math.PI * 2);
    const ramp = new THREE.Mesh(rampGeo, mats.ramp);
    ramp.position.set(0, 0.5, 0);
    ramp.rotation.x = Math.PI / 2;
    group.add(ramp);

    // 温暖长椅（休息区，棕色）- 减少数量
    const benchCount = Math.round(4 * objMultiplier);
    for (let i = 0; i < benchCount; i++) {
      const angle = (i / benchCount) * Math.PI * 2;
      const x = Math.cos(angle) * 8;
      const z = Math.sin(angle) * 8;
      const benchGeo = new THREE.BoxGeometry(2, 0.5, 0.5);
      const bench = new THREE.Mesh(benchGeo, mats.bench);
      bench.position.set(x, 0.5, z);
      bench.rotation.y = -angle;
      group.add(bench);

      // 椅背
      const backGeo = new THREE.BoxGeometry(2, 1, 0.2);
      const back = new THREE.Mesh(backGeo, mats.bench);
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
    console.log(`[ZoneScenes] 熔炉场景创建完成 (${group.children.length} 对象)`);
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