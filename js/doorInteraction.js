/**
 * doorInteraction.js - 门交互管理器
 * 处理门的3D模型、距离检测、点击事件、开门动画
 */

class DoorInteraction {
  constructor(camera, scene) {
    this.camera = camera;
    this.scene = scene;
    this.doors = [];
    this.currentHoveredDoor = null;
    this.raycaster = null;
    this.mouse = new THREE.Vector2();
    
    // 配置
    this.config = {
      interactDistance: 3, // 交互距离（米）
      doorOpenAngle: Math.PI / 2, // 门打开角度（90度）
      doorOpenDuration: 1500 // 开门动画时长（毫秒）
    };

    this.init();
  }

  /**
   * 初始化
   */
  init() {
    console.log('[DoorInteraction] 初始化门交互管理器...');
    
    // 添加点击事件监听
    this.initClickEvent();
    
    console.log('[DoorInteraction] 初始化完成');
  }

  /**
   * 添加门
   * @param {Object} doorConfig - 门配置
   * @param {THREE.Mesh} doorConfig.mesh - 门的3D网格
   * @param {string} doorConfig.zoneName - 区域名称
   * @param {string} doorConfig.zoneId - 区域ID
   * @param {Function} doorConfig.onEnter - 进入回调
   */
  addDoor(doorConfig) {
    const door = doorConfig.mesh;
    door.userData = {
      zoneName: doorConfig.zoneName,
      zoneId: doorConfig.zoneId,
      onEnter: doorConfig.onEnter,
      isOpen: false
    };
    
    this.doors.push(door);
    this.scene.add(door);
    
    console.log(`[DoorInteraction] 添加门: ${doorConfig.zoneName}`);
  }

  /**
   * 初始化点击事件
   */
  initClickEvent() {
    const container = document.getElementById('container');
    this.raycaster = new THREE.Raycaster();
    
    // PC端：鼠标点击 — 使用Raycaster精确检测
    container.addEventListener('click', (event) => {
      this.handleClick(event.clientX, event.clientY);
    });

    // 移动端：触摸点击 — 使用Raycaster精确检测
    container.addEventListener('touchend', (event) => {
      if (event.changedTouches.length > 0) {
        const touch = event.changedTouches[0];
        this.handleClick(touch.clientX, touch.clientY);
      }
    });
  }

  /**
   * 处理点击：Raycaster射线检测门对象
   */
  handleClick(clientX, clientY) {
    // 归一化鼠标坐标 (-1 到 +1)
    this.mouse.x = (clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(clientY / window.innerHeight) * 2 + 1;
    
    // 从相机发射射线
    this.raycaster.setFromCamera(this.mouse, this.camera);
    
    // 检测与门的交叉
    const intersects = this.raycaster.intersectObjects(this.doors, false);
    
    if (intersects.length > 0) {
      const clickedDoor = intersects[0].object;
      // 再次确认距离在交互范围内
      const distance = this.camera.position.distanceTo(clickedDoor.position);
      if (distance <= this.config.interactDistance && !clickedDoor.userData.isOpen) {
        this.openDoor(clickedDoor);
      }
    } else if (this.currentHoveredDoor && !this.currentHoveredDoor.userData.isOpen) {
      // 点击空白处无操作（保留当前悬停门的提示）
    }
  }

  /**
   * 更新（每帧调用）
   */
  update() {
    // 检测距离
    let nearestDoor = null;
    let nearestDistance = Infinity;

    for (const door of this.doors) {
      const distance = this.camera.position.distanceTo(door.position);
      
      if (distance <= this.config.interactDistance && distance < nearestDistance) {
        nearestDoor = door;
        nearestDistance = distance;
      }
    }

    // 更新UI提示
    if (nearestDoor && !nearestDoor.userData.isOpen) {
      this.showPrompt(nearestDoor.userData.zoneName);
      this.highlightDoor(nearestDoor);
      this.currentHoveredDoor = nearestDoor;
    } else {
      this.hidePrompt();
      if (this.currentHoveredDoor) {
        this.unhighlightDoor(this.currentHoveredDoor);
      }
      this.currentHoveredDoor = null;
    }
  }

  /**
   * 显示提示
   * @param {string} zoneName - 区域名称
   */
  showPrompt(zoneName) {
    const prompt = document.getElementById('zone-prompt');
    const zoneNameEl = document.getElementById('zone-name');
    
    zoneNameEl.textContent = zoneName;
    prompt.classList.remove('hidden');
  }

  /**
   * 隐藏提示
   */
  hidePrompt() {
    const prompt = document.getElementById('zone-prompt');
    prompt.classList.add('hidden');
  }

  /**
   * 高亮门
   * @param {THREE.Mesh} door - 门3D对象
   */
  highlightDoor(door) {
    // 简单高亮：改变材质颜色
    if (door.material && door.material.emissive) {
      door.material.emissive.setHex(0x444444);
    }
  }

  /**
   * 取消高亮
   * @param {THREE.Mesh} door - 门3D对象
   */
  unhighlightDoor(door) {
    if (door.material && door.material.emissive) {
      door.material.emissive.setHex(0x000000);
    }
  }

  /**
   * 开门
   * @param {THREE.Mesh} door - 门3D对象
   */
  openDoor(door) {
    if (door.userData.isOpen) return;
    
    console.log(`[DoorInteraction] 开门: ${door.userData.zoneName}`);
    
    door.userData.isOpen = true;
    
    // 播放开门动画
    this.playDoorAnimation(door);
    
    // 延迟执行进入回调（等开门动画播放完毕）
    setTimeout(() => {
      if (door.userData.onEnter) {
        door.userData.onEnter();
      }
    }, this.config.doorOpenDuration);
  }

  /**
   * 播放开门动画
   * @param {THREE.Mesh} door - 门3D对象
   */
  playDoorAnimation(door) {
    // 简单动画：绕Y轴旋转
    const startTime = Date.now();
    const startRotation = door.rotation.y;
    const targetRotation = startRotation + this.config.doorOpenAngle;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / this.config.doorOpenDuration, 1);
      
      // 缓动函数（easeOutCubic）
      const eased = 1 - Math.pow(1 - progress, 3);
      
      door.rotation.y = startRotation + (targetRotation - startRotation) * eased;
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    animate();
  }
  /**
   * 销毁门交互管理器，移除事件监听
   */
  dispose() {
    const container = document.getElementById('container');
    if (container) {
      container.removeEventListener('click', this._onClick);
      container.removeEventListener('touchend', this._onTouchEnd);
    }
    this.doors = [];
  }

  /**
   * 获取距离玩家最近的门的完整数据（含building引用）
   * @returns {Object|null} 最近的门数据对象
   */
  getNearestDoor() {
    if (!this.doors.length || !this.camera) return null;
    let nearestDoor = null;
    let minDist = this.config.highlightRadius;

    this.doors.forEach(doorData => {
      const dist = this.camera.position.distanceTo(doorData.mesh.position);
      if (dist < minDist) {
        minDist = dist;
        nearestDoor = doorData;
      }
    });

    return nearestDoor;
  }
}

// 导出
window.DoorInteraction = DoorInteraction;