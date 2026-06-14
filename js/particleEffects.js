/**
 * particleEffects.js - 粒子效果管理器
 * 添加萤火虫、飘云等粒子效果
 */

class ParticleEffects {
  constructor(scene) {
    this.scene = scene;
    this.particles = [];
  }

  /**
   * 初始化所有粒子效果
   */
  init() {
    console.log('[ParticleEffects] 初始化粒子效果...');
    
    // 添加萤火虫
    this.createFireflies();
    
    // 添加飘云
    this.createFloatingClouds();
    
    console.log('[ParticleEffects] 粒子效果初始化完成');
  }

  /**
   * 创建萤火虫粒子效果
   */
  createFireflies() {
    const particleCount = 100;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    
    // 初始化位置和颜色
    for (let i = 0; i < particleCount; i++) {
      // 随机位置（在场景周围）
      positions[i * 3] = (Math.random() - 0.5) * 100;
      positions[i * 3 + 1] = Math.random() * 10 + 1; // 距离地面1-11米
      positions[i * 3 + 2] = (Math.random() - 0.5) * 100;
      
      // 萤火虫颜色（黄绿色）
      colors[i * 3] = 0.8; // R
      colors[i * 3 + 1] = 1.0; // G
      colors[i * 3 + 2] = 0.2; // B
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    const material = new THREE.PointsMaterial({
      size: 0.3,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending
    });
    
    const particles = new THREE.Points(geometry, material);
    particles.name = 'fireflies';
    this.scene.add(particles);
    this.particles.push(particles);
  }

  /**
   * 创建飘云粒子效果
   */
  createFloatingClouds() {
    const cloudCount = 10;
    
    for (let i = 0; i < cloudCount; i++) {
      const cloudGeometry = new THREE.SphereGeometry(Math.random() * 3 + 2, 8, 8);
      const cloudMaterial = new THREE.MeshLambertMaterial({
        color: 0xFFFFFF,
        transparent: true,
        opacity: 0.3
      });
      
      const cloud = new THREE.Mesh(cloudGeometry, cloudMaterial);
      cloud.position.set(
        (Math.random() - 0.5) * 150,
        Math.random() * 30 + 20, // 高空20-50米
        (Math.random() - 0.5) * 150
      );
      cloud.name = `cloud_${i}`;
      cloud.userData = {
        speed: Math.random() * 0.02 + 0.01, // 飘动速度
        direction: new THREE.Vector3(
          Math.random() - 0.5,
          0,
          Math.random() - 0.5
        ).normalize()
      };
      
      this.scene.add(cloud);
      this.particles.push(cloud);
    }
  }

  /**
   * 更新粒子效果（在渲染循环中调用）
   */
  update() {
    // 更新萤火虫
    this.particles.forEach(particle => {
      if (particle.name === 'fireflies') {
        // 萤火虫随机飘动
        const positions = particle.geometry.attributes.position.array;
        for (let i = 0; i < positions.length; i += 3) {
          positions[i] += (Math.random() - 0.5) * 0.05;
          positions[i + 1] += (Math.random() - 0.5) * 0.02;
          positions[i + 2] += (Math.random() - 0.5) * 0.05;
          
          // 限制高度
          if (positions[i + 1] < 0.5) positions[i + 1] = 0.5;
          if (positions[i + 1] > 15) positions[i + 1] = 15;
        }
        particle.geometry.attributes.position.needsUpdate = true;
        
        // 萤火虫闪烁效果
        particle.material.opacity = 0.5 + Math.sin(Date.now() * 0.001) * 0.3;
      } else if (particle.name.startsWith('cloud_')) {
        // 飘云移动
        const direction = particle.userData.direction;
        particle.position.x += direction.x * particle.userData.speed;
        particle.position.z += direction.z * particle.userData.speed;
        
        // 边界检查（如果飘出场景，重新定位）
        if (Math.abs(particle.position.x) > 100 || Math.abs(particle.position.z) > 100) {
          particle.position.set(
            (Math.random() - 0.5) * 150,
            Math.random() * 30 + 20,
            (Math.random() - 0.5) * 150
          );
        }
      }
    });
  }
}

// 导出
window.ParticleEffects = ParticleEffects;
