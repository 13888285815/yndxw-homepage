/**
 * zoneScenes.js - 各区3D过渡场景（需求文档§5.2.5）
 * 进入各区后播放5秒3D过渡场景，然后自动切换到2D界面
 */

class ZoneScenes {
  constructor(scene, camera) {
    this.scene = scene;
    this.camera = camera;
    this.currentZoneScene = null;
    this.transitionDuration = 5000; // 5秒过渡（需求文档§5.2.5）
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

    // 根据区域创建不同的3D场景
    switch (zoneId) {
      case 'adult':
        this.currentZoneScene = this.createOfficeScene();
        break;
      case 'teen':
        this.currentZoneScene = this.createCampusScene();
        break;
      case 'children':
        this.currentZoneScene = this.createPlaygroundScene();
        break;
      case 'elderly':
        this.currentZoneScene = this.createCourtyardScene();
        break;
      case 'accessible':
        this.currentZoneScene = this.createAccessibleScene();
        break;
      default:
        this.currentZoneScene = this.createGenericScene();
    }

    // 5秒后自动切换到2D界面（需求文档§5.2.5）
    setTimeout(() => {
      console.log(`[ZoneScenes] 3D过渡完成，切换到2D界面`);
      if (onComplete) onComplete();
    }, this.transitionDuration);
  }

  /**
   * 清除当前3D过渡场景
   */
  clearCurrentScene() {
    if (this.currentZoneScene) {
      // 从主场景中移除所有过渡场景的子对象
      while (this.currentZoneScene.children.length > 0) {
        const child = this.currentZoneScene.children[0];
        this.currentZoneScene.remove(child);
        // 释放几何体和材质
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

  /**
   * 成人区：3D现代办公室场景（需求文档§5.4.1）
   * 科技感、深色玻璃、霓虹灯
   */
  createOfficeScene() {
    const group = new THREE.Group();
    group.name = 'office-scene';

    // 地板（深色大理石）
    const floorGeo = new THREE.PlaneGeometry(30, 30);
    const floorMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    group.add(floor);

    // 玻璃办公桌（3个）
    for (let i = 0; i < 3; i++) {
      const deskGeo = new THREE.BoxGeometry(3, 0.1, 1.5);
      const deskMat = new THREE.MeshLambertMaterial({
        color: 0x87CEEB,
        transparent: true,
        opacity: 0.6
      });
      const desk = new THREE.Mesh(deskGeo, deskMat);
      desk.position.set(-5 + i * 5, 1, -8);
      group.add(desk);

      // 桌上的显示器
      const screenGeo = new THREE.BoxGeometry(1.5, 1, 0.1);
      const screenMat = new THREE.MeshLambertMaterial({
        color: 0x1a1a2e,
        emissive: 0x4361ee,
        emissiveIntensity: 0.3
      });
      const screen = new THREE.Mesh(screenGeo, screenMat);
      screen.position.set(-5 + i * 5, 1.6, -8);
      group.add(screen);
    }

    // 霓虹灯装饰（需求文档§5.4.1强调科技感+霓虹灯）
    const neonColors = [0x4361ee, 0xf72585, 0x4cc9f0];
    for (let i = 0; i < 3; i++) {
      const neonGeo = new THREE.BoxGeometry(8, 0.2, 0.2);
      const neonMat = new THREE.MeshLambertMaterial({
        color: neonColors[i],
        emissive: neonColors[i],
        emissiveIntensity: 0.8
      });
      const neon = new THREE.Mesh(neonGeo, neonMat);
      neon.position.set(0, 4 + i * 1.5, -12);
      group.add(neon);
    }

    // 大玻璃窗
    const windowGeo = new THREE.PlaneGeometry(20, 5);
    const windowMat = new THREE.MeshLambertMaterial({
      color: 0x87CEEB,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide
    });
    const windowMesh = new THREE.Mesh(windowGeo, windowMat);
    windowMesh.position.set(0, 3, -14);
    group.add(windowMesh);

    // 灯光
    const officeLight = new THREE.PointLight(0x4361ee, 1, 30);
    officeLight.position.set(0, 5, 0);
    group.add(officeLight);

    const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
    group.add(ambientLight);

    this.scene.add(group);
    return group;
  }

  /**
   * 青少年区：3D校园场景（需求文档§5.4.2）
   * 清新、蓝色主题、运动场
   */
  createCampusScene() {
    const group = new THREE.Group();
    group.name = 'campus-scene';

    // 操场（绿色草地）
    const fieldGeo = new THREE.PlaneGeometry(30, 30);
    const fieldMat = new THREE.MeshLambertMaterial({ color: 0x4CAF50 });
    const field = new THREE.Mesh(fieldGeo, fieldMat);
    field.rotation.x = -Math.PI / 2;
    group.add(field);

    // 跑道（椭圆形）
    const trackGeo = new THREE.RingGeometry(8, 10, 32);
    const trackMat = new THREE.MeshLambertMaterial({ color: 0xFF6F00 });
    const track = new THREE.Mesh(trackGeo, trackMat);
    track.rotation.x = -Math.PI / 2;
    track.position.y = 0.01;
    group.add(track);

    // 教学楼（蓝色主题，需求文档§5.4.2）
    const buildingGeo = new THREE.BoxGeometry(8, 6, 4);
    const buildingMat = new THREE.MeshLambertMaterial({ color: 0x2196F3 });
    const building = new THREE.Mesh(buildingGeo, buildingMat);
    building.position.set(0, 3, -10);
    group.add(building);

    // 窗户
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 4; col++) {
        const winGeo = new THREE.PlaneGeometry(1, 1);
        const winMat = new THREE.MeshLambertMaterial({
          color: 0xBBDEFB,
          emissive: 0xBBDEFB,
          emissiveIntensity: 0.2,
          side: THREE.DoubleSide
        });
        const win = new THREE.Mesh(winGeo, winMat);
        win.position.set(-3 + col * 2, 2 + row * 1.5, -8);
        group.add(win);
      }
    }

    // 篮球架
    const poleGeo = new THREE.CylinderGeometry(0.1, 0.1, 4);
    const poleMat = new THREE.MeshLambertMaterial({ color: 0x757575 });
    const pole = new THREE.Mesh(poleGeo, poleMat);
    pole.position.set(8, 2, 2);
    group.add(pole);

    const boardGeo = new THREE.BoxGeometry(2, 1.5, 0.1);
    const boardMat = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
    const board = new THREE.Mesh(boardGeo, boardMat);
    board.position.set(8, 4, 2);
    group.add(board);

    // 灯光
    const campusLight = new THREE.PointLight(0x2196F3, 1, 30);
    campusLight.position.set(0, 8, 0);
    group.add(campusLight);

    const ambientLight = new THREE.AmbientLight(0x87CEEB, 0.6);
    group.add(ambientLight);

    this.scene.add(group);
    return group;
  }

  /**
   * 儿童区：3D游乐场场景（需求文档§5.4.3）
   * 彩色、圆润、卡通风格
   */
  createPlaygroundScene() {
    const group = new THREE.Group();
    group.name = 'playground-scene';

    // 彩色地面（需求文档§5.4.3：彩色、圆润）
    const groundGeo = new THREE.PlaneGeometry(30, 30);
    const groundMat = new THREE.MeshLambertMaterial({ color: 0xFFEB3B });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    group.add(ground);

    // 滑梯（彩色管道）
    const slideGeo = new THREE.CylinderGeometry(1.5, 1.5, 6, 16, 8, true);
    const slideMat = new THREE.MeshLambertMaterial({
      color: 0xFF4081,
      side: THREE.DoubleSide
    });
    const slide = new THREE.Mesh(slideGeo, slideMat);
    slide.position.set(-5, 3, -5);
    slide.rotation.z = Math.PI / 4;
    group.add(slide);

    // 蹦床（圆形）
    const trampolineGeo = new THREE.CylinderGeometry(2, 2, 0.3, 32);
    const trampolineMat = new THREE.MeshLambertMaterial({
      color: 0x00BCD4,
      emissive: 0x00BCD4,
      emissiveIntensity: 0.1
    });
    const trampoline = new THREE.Mesh(trampolineGeo, trampolineMat);
    trampoline.position.set(5, 0.2, -3);
    group.add(trampoline);

    // 彩色气球（需求文档§5.4.3：卡通风格）
    const balloonColors = [0xFF4081, 0xFFEB3B, 0x00BCD4, 0x4CAF50, 0xFF6F00];
    for (let i = 0; i < 5; i++) {
      const balloonGeo = new THREE.SphereGeometry(0.8, 16, 16);
      const balloonMat = new THREE.MeshLambertMaterial({
        color: balloonColors[i],
        emissive: balloonColors[i],
        emissiveIntensity: 0.2
      });
      const balloon = new THREE.Mesh(balloonGeo, balloonMat);
      balloon.position.set(-4 + i * 2, 5 + Math.sin(i) * 2, -6);
      group.add(balloon);

      // 气球线
      const lineGeo = new THREE.CylinderGeometry(0.02, 0.02, 3);
      const lineMat = new THREE.MeshLambertMaterial({ color: 0x999999 });
      const line = new THREE.Mesh(lineGeo, lineMat);
      line.position.set(-4 + i * 2, 3.5, -6);
      group.add(line);
    }

    // 旋转木马（简化版）
    const carouselGeo = new THREE.CylinderGeometry(3, 3, 0.5, 32);
    const carouselMat = new THREE.MeshLambertMaterial({
      color: 0xE91E63,
      emissive: 0xE91E63,
      emissiveIntensity: 0.2
    });
    const carousel = new THREE.Mesh(carouselGeo, carouselMat);
    carousel.position.set(0, 0.3, -8);
    group.add(carousel);

    // 灯光
    const playgroundLight = new THREE.PointLight(0xFFEB3B, 1.2, 30);
    playgroundLight.position.set(0, 8, 0);
    group.add(playgroundLight);

    const ambientLight = new THREE.AmbientLight(0xFFF9C4, 0.7);
    group.add(ambientLight);

    this.scene.add(group);
    return group;
  }

  /**
   * 老年区：3D中式庭院场景（需求文档§5.4.4）
   * 古典、米色、园林风格
   */
  createCourtyardScene() {
    const group = new THREE.Group();
    group.name = 'courtyard-scene';

    // 石板地面（米色，需求文档§5.4.4）
    const groundGeo = new THREE.PlaneGeometry(30, 30);
    const groundMat = new THREE.MeshLambertMaterial({ color: 0xF5F0E0 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    group.add(ground);

    // 中式假山（需求文档§5.4.4：园林风格）
    const rockGeo = new THREE.DodecahedronGeometry(2, 0);
    const rockMat = new THREE.MeshLambertMaterial({ color: 0x808080 });
    const rock = new THREE.Mesh(rockGeo, rockMat);
    rock.position.set(-5, 1, -6);
    rock.scale.set(1.5, 1, 1);
    group.add(rock);

    // 小池塘
    const pondGeo = new THREE.CircleGeometry(3, 32);
    const pondMat = new THREE.MeshLambertMaterial({
      color: 0x6BB5E0,
      transparent: true,
      opacity: 0.7
    });
    const pond = new THREE.Mesh(pondGeo, pondMat);
    pond.rotation.x = -Math.PI / 2;
    pond.position.set(5, 0.02, -5);
    group.add(pond);

    // 中式廊柱（4根）
    for (let i = 0; i < 4; i++) {
      const pillarGeo = new THREE.CylinderGeometry(0.3, 0.3, 5, 16);
      const pillarMat = new THREE.MeshLambertMaterial({ color: 0xCC0000 });
      const pillar = new THREE.Mesh(pillarGeo, pillarMat);
      pillar.position.set(-3 + i * 2, 2.5, -10);
      group.add(pillar);
    }

    // 翘角屋顶（需求文档§5.4.4：中式庭院）
    const roofGeo = new THREE.BoxGeometry(10, 0.3, 5);
    const roofMat = new THREE.MeshLambertMaterial({ color: 0x654321 });
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.set(0, 5, -10);
    roof.rotation.x = -0.3;
    group.add(roof);

    // 竹子
    for (let i = 0; i < 5; i++) {
      const bambooGeo = new THREE.CylinderGeometry(0.05, 0.05, 6, 8);
      const bambooMat = new THREE.MeshLambertMaterial({ color: 0x4CAF50 });
      const bamboo = new THREE.Mesh(bambooGeo, bambooMat);
      bamboo.position.set(8 + i * 0.3, 3, -7 + i * 0.5);
      group.add(bamboo);
    }

    // 灯光（温暖色调，需求文档§5.4.4：古典风格）
    const courtyardLight = new THREE.PointLight(0xFFB74D, 0.8, 30);
    courtyardLight.position.set(0, 6, 0);
    group.add(courtyardLight);

    const ambientLight = new THREE.AmbientLight(0xFFF3E0, 0.5);
    group.add(ambientLight);

    this.scene.add(group);
    return group;
  }

  /**
   * 残障友好区：3D无障碍建筑场景（需求文档§5.4.5）
   * 宽敞、坡道、高对比度标识
   */
  createAccessibleScene() {
    const group = new THREE.Group();
    group.name = 'accessible-scene';

    // 地板（高对比度黑白，需求文档§5.4.5）
    const groundGeo = new THREE.PlaneGeometry(30, 30);
    const groundMat = new THREE.MeshLambertMaterial({ color: 0xFAFAFA });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    group.add(ground);

    // 坡道（需求文档§5.4.5：坡道入口）
    const rampGeo = new THREE.BoxGeometry(4, 0.2, 8);
    const rampMat = new THREE.MeshLambertMaterial({ color: 0xFFEB3B });
    const ramp = new THREE.Mesh(rampGeo, rampMat);
    ramp.rotation.x = -0.2;
    ramp.position.set(0, 0.5, -2);
    group.add(ramp);

    // 扶手（需求文档§5.4.5：扶手）
    const railGeo = new THREE.CylinderGeometry(0.05, 0.05, 8, 8);
    const railMat = new THREE.MeshLambertMaterial({ color: 0xFF6347 });
    const rail = new THREE.Mesh(railGeo, railMat);
    rail.position.set(2, 1, -2);
    rail.rotation.x = -0.2;
    group.add(rail);

    // 宽敞门框（需求文档§5.4.5：宽敞）
    const doorFrameGeo = new THREE.BoxGeometry(4, 5, 0.3);
    const doorFrameMat = new THREE.MeshLambertMaterial({
      color: 0x333333,
      emissive: 0xFF6347,
      emissiveIntensity: 0.3
    });
    const doorFrame = new THREE.Mesh(doorFrameGeo, doorFrameMat);
    doorFrame.position.set(0, 2.5, -10);
    group.add(doorFrame);

    // 盲道（黄色凸起条纹）
    for (let i = 0; i < 20; i++) {
      const stripGeo = new THREE.BoxGeometry(0.5, 0.1, 0.5);
      const stripMat = new THREE.MeshLambertMaterial({
        color: 0xFFEB3B,
        emissive: 0xFFEB3B,
        emissiveIntensity: 0.2
      });
      const strip = new THREE.Mesh(stripGeo, stripMat);
      strip.position.set(0, 0.05, -i * 0.5);
      group.add(strip);
    }

    // 高对比度标识（需求文档§5.4.5）
    const signGeo = new THREE.PlaneGeometry(3, 1.5);
    const signMat = new THREE.MeshLambertMaterial({
      color: 0xFFFFFF,
      emissive: 0xFF6347,
      emissiveIntensity: 0.5,
      side: THREE.DoubleSide
    });
    const sign = new THREE.Mesh(signGeo, signMat);
    sign.position.set(0, 4, -9);
    group.add(sign);

    // 灯光（明亮，需求文档§5.4.5：高对比度）
    const accessibleLight = new THREE.PointLight(0xFFFFFF, 1.5, 30);
    accessibleLight.position.set(0, 8, 0);
    group.add(accessibleLight);

    const ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.8);
    group.add(ambientLight);

    this.scene.add(group);
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