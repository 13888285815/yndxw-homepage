/**
 * firstPersonController.js - 第一人称控制器
 * 支持PC端（鼠标）和移动端（触摸），无键盘操作
 */

class FirstPersonController {
  constructor(camera) {
    this.camera = camera;
    this.enabled = true;
    
    // 旋转角度
    this.yaw = 0;   // 偏航角（左右）
    this.pitch = 0; // 俯仰角（上下）
    
    // 配置
    this.config = {
      mouseSensitivity: 0.002,
      touchSensitivity: 0.005,
      maxPitch: Math.PI / 3, // 最大俯仰角（60度）
      minPitch: -Math.PI / 3
    };

    // 触摸状态
    this.touchState = {
      isTouching: false,
      lastX: 0,
      lastY: 0
    };

    this.init();
  }

  /**
   * 初始化控制器
   */
  init() {
    console.log('[FirstPersonController] 初始化第一人称控制器...');
    
    // PC端：鼠标控制
    this.initMouseControl();
    
    // 移动端：触摸控制
    this.initTouchControl();
    
    console.log('[FirstPersonController] 控制器初始化完成');
  }

  /**
   * 初始化鼠标控制
   */
  initMouseControl() {
    const container = document.getElementById('container');
    
    // 鼠标按下
    container.addEventListener('mousedown', (event) => {
      if (!this.enabled) return;
      // 只处理左键
      if (event.button !== 0) return;
      
      this.isDragging = true;
      this.lastX = event.clientX;
      this.lastY = event.clientY;
    });

    // 鼠标移动
    container.addEventListener('mousemove', (event) => {
      if (!this.enabled || !this.isDragging) return;
      
      const deltaX = event.clientX - this.lastX;
      const deltaY = event.clientY - this.lastY;
      
      // 更新旋转角度
      this.yaw -= deltaX * this.config.mouseSensitivity;
      this.pitch -= deltaY * this.config.mouseSensitivity;
      
      // 限制俯仰角
      this.pitch = Math.max(this.config.minPitch, Math.min(this.config.maxPitch, this.pitch));
      
      // 应用旋转
      this.updateCameraRotation();
      
      this.lastX = event.clientX;
      this.lastY = event.clientY;
    });

    // 鼠标释放
    container.addEventListener('mouseup', () => {
      this.isDragging = false;
    });

    // 鼠标离开容器
    container.addEventListener('mouseleave', () => {
      this.isDragging = false;
    });
  }

  /**
   * 初始化触摸控制
   */
  initTouchControl() {
    const container = document.getElementById('container');
    
    // 触摸开始
    container.addEventListener('touchstart', (event) => {
      if (!this.enabled) return;
      if (event.touches.length !== 1) return; // 只处理单指
      
      this.touchState.isTouching = true;
      this.touchState.lastX = event.touches[0].clientX;
      this.touchState.lastY = event.touches[0].clientY;
    });

    // 触摸移动
    container.addEventListener('touchmove', (event) => {
      if (!this.enabled || !this.touchState.isTouching) return;
      if (event.touches.length !== 1) return;
      
      event.preventDefault(); // 阻止默认滚动行为
      
      const deltaX = event.touches[0].clientX - this.touchState.lastX;
      const deltaY = event.touches[0].clientY - this.touchState.lastY;
      
      // 更新旋转角度
      this.yaw -= deltaX * this.config.touchSensitivity;
      this.pitch -= deltaY * this.config.touchSensitivity;
      
      // 限制俯仰角
      this.pitch = Math.max(this.config.minPitch, Math.min(this.config.maxPitch, this.pitch));
      
      // 应用旋转
      this.updateCameraRotation();
      
      this.touchState.lastX = event.touches[0].clientX;
      this.touchState.lastY = event.touches[0].clientY;
    });

    // 触摸结束
    container.addEventListener('touchend', () => {
      this.touchState.isTouching = false;
    });
  }

  /**
   * 更新相机旋转
   */
  updateCameraRotation() {
    // 应用偏航角（Y轴旋转）
    this.camera.rotation.order = 'YXZ'; // 重要：设置旋转顺序
    this.camera.rotation.y = this.yaw;
    this.camera.rotation.x = this.pitch;
  }

  /**
   * 启用控制器
   */
  enable() {
    this.enabled = true;
  }

  /**
   * 禁用控制器
   */
  disable() {
    this.enabled = false;
  }
  /**
   * 销毁控制器，移除事件监听
   */
  dispose() {
    const container = document.getElementById('container');
    if (container) {
      container.removeEventListener('mousedown', this._onMouseDown);
      container.removeEventListener('mousemove', this._onMouseMove);
      container.removeEventListener('mouseup', this._onMouseUp);
      container.removeEventListener('touchstart', this._onTouchStart);
      container.removeEventListener('touchmove', this._onTouchMove);
      container.removeEventListener('touchend', this._onTouchEnd);
    }
    document.removeEventListener('mousemove', this._onDocMouseMove);
    document.removeEventListener('touchmove', this._onDocTouchMove);
  }
}

// 导出
window.FirstPersonController = FirstPersonController;
