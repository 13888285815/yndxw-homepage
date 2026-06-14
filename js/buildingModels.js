/**
 * buildingModels.js - 创建五大区的建筑3D模型
 * 参考Three.js官方示例，创建更真实的建筑模型
 */

/**
 * 创建成人区建筑（现代玻璃大厦）
 * @returns {THREE.Group} 建筑3D对象组
 */
function createAdultBuilding() {
  const building = new THREE.Group();
  
  // 主楼体（玻璃幕墙效果）
  const bodyGeometry = new THREE.BoxGeometry(6, 12, 6);
  const bodyMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x2196F3,
    metalness: 0.8,
    roughness: 0.2,
    transparent: true,
    opacity: 0.7
  });
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
  body.position.y = 6;
  building.add(body);
  
  // 玻璃窗户（网格）
  const windowGeometry = new THREE.PlaneGeometry(5.8, 11.8);
  const windowMaterial = new THREE.MeshBasicMaterial({
    color: 0x87CEEB,
    transparent: true,
    opacity: 0.3,
    side: THREE.DoubleSide
  });
  
  // 四面墙都添加窗户
  for (let i = 0; i < 4; i++) {
    const windowMesh = new THREE.Mesh(windowGeometry, windowMaterial);
    windowMesh.rotation.y = (Math.PI / 2) * i;
    windowMesh.position.y = 6;
    windowMesh.position.x = Math.cos((Math.PI / 2) * i) * 2.9;
    windowMesh.position.z = Math.sin((Math.PI / 2) * i) * 2.9;
    building.add(windowMesh);
  }
  
  // 顶部天线
  const antennaGeometry = new THREE.CylinderGeometry(0.1, 0.1, 3);
  const antennaMaterial = new THREE.MeshBasicMaterial({ color: 0x333333 });
  const antenna = new THREE.Mesh(antennaGeometry, antennaMaterial);
  antenna.position.y = 13.5;
  building.add(antenna);
  
  // 入口门（玻璃门）
  const doorGeometry = new THREE.BoxGeometry(2, 4, 0.2);
  const doorMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xFFFFFF,
    transparent: true,
    opacity: 0.6
  });
  const door = new THREE.Mesh(doorGeometry, doorMaterial);
  door.position.set(0, 2, 3);
  building.add(door);
  
  return building;
}

/**
 * 创建青少年区建筑（校园风格建筑）
 * @returns {THREE.Group} 建筑3D对象组
 */
function createTeenBuilding() {
  const building = new THREE.Group();
  
  // 主楼体（教学楼）
  const bodyGeometry = new THREE.BoxGeometry(8, 6, 6);
  const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0x4CAF50 });
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
  body.position.y = 3;
  building.add(body);
  
  // 屋顶（三角形）
  const roofGeometry = new THREE.ConeGeometry(6, 3, 4);
  const roofMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
  const roof = new THREE.Mesh(roofGeometry, roofMaterial);
  roof.position.y = 7.5;
  roof.rotation.y = Math.PI / 4;
  building.add(roof);
  
  // 窗户（多个小窗户）
  const windowGeometry = new THREE.PlaneGeometry(0.8, 1.2);
  const windowMaterial = new THREE.MeshBasicMaterial({ color: 0xFFFF99 });
  
  for (let floor = 0; floor < 2; floor++) {
    for (let i = 0; i < 3; i++) {
      const windowMesh = new THREE.Mesh(windowGeometry, windowMaterial);
      windowMesh.position.set(-2.5 + i * 2.5, 2 + floor * 2.5, 3.1);
      building.add(windowMesh);
    }
  }
  
  // 运动场（旁边的篮球场）
  const courtGeometry = new THREE.PlaneGeometry(10, 6);
  const courtMaterial = new THREE.MeshLambertMaterial({ color: 0xFF8C00 });
  const court = new THREE.Mesh(courtGeometry, courtMaterial);
  court.rotation.x = -Math.PI / 2;
  court.position.set(8, 0.01, 0);
  building.add(court);
  
  return building;
}

/**
 * 创建儿童区建筑（童话小屋）
 * @returns {THREE.Group} 建筑3D对象组
 */
function createChildrenBuilding() {
  const building = new THREE.Group();
  
  // 主屋体（圆形）
  const bodyGeometry = new THREE.CylinderGeometry(4, 5, 5, 16);
  const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0xFF9800 });
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
  body.position.y = 2.5;
  building.add(body);
  
  // 屋顶（圆锥形）
  const roofGeometry = new THREE.ConeGeometry(5, 4, 16);
  const roofMaterial = new THREE.MeshLambertMaterial({ color: 0xFF4444 });
  const roof = new THREE.Mesh(roofGeometry, roofMaterial);
  roof.position.y = 7;
  building.add(roof);
  
  // 彩色气球装饰
  const balloonGeometry = new THREE.SphereGeometry(0.3, 8, 8);
  const balloonColors = [0xFF0000, 0x00FF00, 0x0000FF, 0xFFFF00];
  
  balloonColors.forEach((color, index) => {
    const balloonMaterial = new THREE.MeshBasicMaterial({ color });
    const balloon = new THREE.Mesh(balloonGeometry, balloonMaterial);
    balloon.position.set(
      Math.cos(index * Math.PI / 2) * 3,
      8 + index * 0.5,
      Math.sin(index * Math.PI / 2) * 3
    );
    building.add(balloon);
  });
  
  // 入口门（拱形）
  const doorGeometry = new THREE.CircleGeometry(1, 16, 0, Math.PI);
  const doorMaterial = new THREE.MeshBasicMaterial({ color: 0x8B4513 });
  const door = new THREE.Mesh(doorGeometry, doorMaterial);
  door.position.set(0, 1, 5);
  building.add(door);
  
  return building;
}

/**
 * 创建老年区建筑（中式庭院）
 * @returns {THREE.Group} 建筑3D对象组
 */
function createElderlyBuilding() {
  const building = new THREE.Group();
  
  // 主殿（中式屋顶）
  const bodyGeometry = new THREE.BoxGeometry(8, 5, 6);
  const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0xDAA520 });
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
  body.position.y = 2.5;
  building.add(body);
  
  // 中式屋顶（双层翘角）
  const roofShape = new THREE.Shape();
  roofShape.moveTo(-5, 0);
  roofShape.lineTo(-4, 2);
  roofShape.lineTo(0, 1.5);
  roofShape.lineTo(4, 2);
  roofShape.lineTo(5, 0);
  roofShape.lineTo(-5, 0);
  
  const roofGeometry = new THREE.ExtrudeGeometry(roofShape, {
    depth: 6,
    bevelEnabled: false
  });
  const roofMaterial = new THREE.MeshLambertMaterial({ color: 0x8B0000 });
  const roof = new THREE.Mesh(roofGeometry, roofMaterial);
  roof.position.y = 5;
  roof.rotation.y = Math.PI / 2;
  building.add(roof);
  
  // 柱子（4根）
  const pillarGeometry = new THREE.CylinderGeometry(0.3, 0.3, 4, 8);
  const pillarMaterial = new THREE.MeshLambertMaterial({ color: 0xDAA520 });
  
  [[-3, 2], [3, 2], [-3, -2], [3, -2]].forEach(([x, z]) => {
    const pillar = new THREE.Mesh(pillarGeometry, pillarMaterial);
    pillar.position.set(x, 2, z);
    building.add(pillar);
  });
  
  // 庭院地面（石板路）
  const floorGeometry = new THREE.PlaneGeometry(12, 10);
  const floorMaterial = new THREE.MeshLambertMaterial({ color: 0x808080 });
  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = 0.01;
  building.add(floor);
  
  return building;
}

/**
 * 创建残障友好区建筑（无障碍设计建筑）
 * @returns {THREE.Group} 建筑3D对象组
 */
function createAccessibleBuilding() {
  const building = new THREE.Group();
  
  // 主楼体（单层，宽敞）
  const bodyGeometry = new THREE.BoxGeometry(10, 4, 8);
  const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0xF44336 });
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
  body.position.y = 2;
  building.add(body);
  
  // 坡道（无障碍通道）
  const rampGeometry = new THREE.BoxGeometry(12, 0.3, 3);
  const rampMaterial = new THREE.MeshLambertMaterial({ color: 0x666666 });
  const ramp = new THREE.Mesh(rampGeometry, rampMaterial);
  ramp.position.set(0, 0.15, 5);
  building.add(ramp);
  
  // 扶手（坡道两侧）
  const railGeometry = new THREE.CylinderGeometry(0.05, 0.05, 12, 8);
  const railMaterial = new THREE.MeshBasicMaterial({ color: 0xFFFF00 });
  
  [-1.5, 1.5].forEach(z => {
    const rail = new THREE.Mesh(railGeometry, railMaterial);
    rail.position.set(0, 1, z);
    rail.rotation.z = Math.PI / 2;
    building.add(rail);
  });
  
  // 高对比度标识牌
  const signGeometry = new THREE.PlaneGeometry(3, 2);
  const signMaterial = new THREE.MeshBasicMaterial({ color: 0xFFFF00 });
  const sign = new THREE.Mesh(signGeometry, signMaterial);
  sign.position.set(0, 3, -4);
  building.add(sign);
  
  // 盲道（地面纹理）
  const pathGeometry = new THREE.PlaneGeometry(2, 8);
  const pathMaterial = new THREE.MeshLambertMaterial({ color: 0x000000 });
  const path = new THREE.Mesh(pathGeometry, pathMaterial);
  path.rotation.x = -Math.PI / 2;
  path.position.set(0, 0.02, 0);
  building.add(path);
  
  return building;
}

// 导出函数
window.createAdultBuilding = createAdultBuilding;
window.createTeenBuilding = createTeenBuilding;
window.createChildrenBuilding = createChildrenBuilding;
window.createElderlyBuilding = createElderlyBuilding;
window.createAccessibleBuilding = createAccessibleBuilding;
