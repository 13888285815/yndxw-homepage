/**
 * YNDXW 公共区首页 - 3D自然山水全景（v1.5）
 * 新增：建筑点击L2交互 + 萤火虫粒子 + 悬停高亮
 */
(function(){
'use strict';

// 全局错误捕获
window.addEventListener('error', function(e){
  var msg = '[YNDXW ERROR] ' + (e.message || 'unknown');
  if(e.lineno) msg += ' (line:' + e.lineno + ' col:' + (e.colno||'?') + ')';
  console.error(msg);
  var el = document.getElementById('loadBar');
  if(el) el.style.background = '#e33';
});

/* ============ Simplex Noise ============ */
class SimplexNoise{
  constructor(){
    this.grad3=[[1,1,0],[-1,1,0],[1,-1,0],[-1,-1,0],[1,0,1],[-1,0,1],[1,0,-1],[-1,0,-1],[0,1,1],[0,-1,1],[0,1,-1],[0,-1,-1]];
    this.p=[];for(let i=0;i<256;i++)this.p[i]=i;
    for(let i=255;i>0;i--){const j=Math.floor(Math.random()*(i+1));const t=this.p[i];this.p[i]=this.p[j];this.p[j]=t;}
    this.perm=[];for(let i=0;i<512;i++)this.perm[i]=this.p[i&255];
  }
  dot(g,x,y){return g[0]*x+g[1]*y}
  noise2D(xin,yin){
    const F2=.5*(Math.sqrt(3)-1),G2=(3-Math.sqrt(3))/6;
    let s=(xin+yin)*F2,i=Math.floor(xin+s),j=Math.floor(yin+s);
    let t=(i+j)*G2,x0=xin-(i-t),y0=yin-(j-t);
    let i1,j1;if(x0>y0){i1=1;j1=0}else{i1=0;j1=1}
    let x1=x0-i1+G2,y1=y0-j1+G2,x2=x0-1+2*G2,y2=y0-1+2*G2;
    let ii=i&255,jj=j&255;
    let gi0=this.perm[ii+this.perm[jj]]%12;
    let gi1=this.perm[ii+i1+this.perm[jj+j1]]%12;
    let gi2=this.perm[ii+1+this.perm[jj+1]]%12;
    let n0,n1,n2;
    let t0=.5-x0*x0-y0*y0;if(t0<0)n0=0;else{t0*=t0;n0=t0*t0*this.dot(this.grad3[gi0],x0,y0)}
    let t1=.5-x1*x1-y1*y1;if(t1<0)n1=0;else{t1*=t1;n1=t1*t1*this.dot(this.grad3[gi1],x1,y1)}
    let t2=.5-x2*x2-y2*y2;if(t2<0)n2=0;else{t2*=t2;n2=t2*t2*this.dot(this.grad3[gi2],x2,y2)}
    return 70*(n0+n1+n2);
  }
}

/* ============ 全局变量 ============ */
let scene,camera,renderer,clock;
let waterMesh,clouds=[],buildingMeshes=[];
let raycaster,mouseVec;
const simplex=new SimplexNoise();
const cfg = WORLD_CONFIG;

// 第一人称视角
let camYaw=0, camPitch=0;
let camPos = new THREE.Vector3(0, 5, 80); // 初始位置（会在init里调整）
let currentLayer='L1';
let hoveredBuilding=null;

// 鼠标/触摸状态
let mouseDown=false, lastX=0, lastY=0;

// ===== 新增：交互与粒子系统 =====
let fireflyMeshes=[];
let fireflyData=[];
let isPanelOpen=false;
let activeBuildingId=null;

// ===== 新增：场景过渡 + 导航 + 管理员面板 =====
let currentSceneName='公共区';
let isTransitioning=false;
let adminPanelVisible=false;
let hudVisible=true;
let fpsFrames=0, fpsLastTime=0, fpsValue=0;
let transitionEl=null;

// 高亮用的边缘光材质（按building id存储）
const buildingOutlineMaterials={};

// L2面板内容渲染器
const L2PanelRenderer = {
  // 渲染核心区面板
  renderCore: function(buildingData) {
    const config = cfg.L2.core;
    let html = '<div class="l2-panel-content core-panel">';
    
    // 头部信息
    html += '<div class="l2-header">';
    html += '<span class="l2-icon">' + config.icon + '</span>';
    html += '<div class="l2-title">' + config.title + '</div>';
    html += '<div class="l2-desc">' + config.description + '</div>';
    html += '</div>';
    
    // 模块卡片网格
    html += '<div class="l2-modules-grid">';
    config.sections.forEach(function(section) {
      html += '<div class="l2-module-card" data-action="' + section.action + '" data-target="' + section.target + '" style="border-color: ' + section.color + ';">';
      html += '<div class="l2-card-icon">' + section.icon + '</div>';
      html += '<div class="l2-card-title">' + section.title + '</div>';
      html += '<div class="l2-card-desc">' + section.description + '</div>';
      html += '<div class="l2-card-hover" style="background: ' + hexToRgba(section.color, 0.1) + ';"></div>';
      html += '</div>';
    });
    html += '</div>';
    html += '</div>';
    
    return html;
  },
  
  // 渲染市场大厅面板
  renderMarket: function(buildingData) {
    const config = cfg.L2.market;
    let html = '<div class="l2-panel-content market-panel">';
    
    // 头部信息
    html += '<div class="l2-header">';
    html += '<span class="l2-icon">' + config.icon + '</span>';
    html += '<div class="l2-title">' + config.title + '</div>';
    html += '<div class="l2-desc">' + config.description + '</div>';
    html += '</div>';
    
    // 分类标签
    html += '<div class="l2-tabs">';
    config.categories.forEach(function(cat, idx) {
      html += '<button class="l2-tab ' + (idx === 0 ? 'active' : '') + '" data-category="' + cat.id + '">';
      html += '<span class="tab-icon">' + cat.icon + '</span>';
      html += '<span class="tab-name">' + cat.name + '</span>';
      html += '</button>';
    });
    html += '</div>';
    
    // 商品网格（默认显示第一个分类）
    html += '<div class="l2-products-grid" id="products-grid">';
    html += '<div class="l2-loading">加载中...</div>';
    html += '</div>';
    
    html += '</div>';
    return html;
  },
  
  // 渲染博物馆面板
  renderMuseum: function(buildingData) {
    const config = cfg.L2.museum;
    let html = '<div class="l2-panel-content museum-panel">';
    
    // 头部信息
    html += '<div class="l2-header">';
    html += '<span class="l2-icon">' + config.icon + '</span>';
    html += '<div class="l2-title">' + config.title + '</div>';
    html += '<div class="l2-desc">' + config.description + '</div>';
    html += '</div>';
    
    // 展览板块
    html += '<div class="l2-exhibits">';
    config.exhibits.forEach(function(exhibit, idx) {
      html += '<div class="l2-exhibit-card" data-exhibit="' + exhibit.id + '">';
      html += '<div class="exhibit-header">';
      html += '<span class="exhibit-icon">' + exhibit.icon + '</span>';
      html += '<div class="exhibit-title">' + exhibit.title + '</div>';
      html += '</div>';
      html += '<div class="exhibit-desc">' + exhibit.description + '</div>';
      html += '<div class="exhibit-content" id="exhibit-content-' + exhibit.id + '">';
      html += '<div class="exhibit-placeholder">点击查看详情</div>';
      html += '</div>';
      html += '</div>';
    });
    html += '</div>';
    
    // 时间线
    html += '<div class="l2-timeline">';
    html += '<div class="timeline-title">发展历程</div>';
    html += '<div class="timeline-track">';
    html += '<div class="timeline-item"><div class="timeline-dot"></div><div class="timeline-date">2024 Q1</div><div class="timeline-text">项目启动</div></div>';
    html += '<div class="timeline-item"><div class="timeline-dot"></div><div class="timeline-date">2024 Q2</div><div class="timeline-text">原型发布</div></div>';
    html += '<div class="timeline-item"><div class="timeline-dot"></div><div class="timeline-date">2024 Q3</div><div class="timeline-text">内测上线</div></div>';
    html += '<div class="timeline-item"><div class="timeline-dot"></div><div class="timeline-date">2024 Q4</div><div class="timeline-text">正式发布</div></div>';
    html += '</div>';
    html += '</div>';
    
    html += '</div>';
    return html;
  },
  
  // 渲染未来学校面板
  renderSchool: function(buildingData) {
    const config = cfg.L2.school;
    let html = '<div class="l2-panel-content school-panel">';
    
    // 头部信息
    html += '<div class="l2-header">';
    html += '<span class="l2-icon">' + config.icon + '</span>';
    html += '<div class="l2-title">' + config.title + '</div>';
    html += '<div class="l2-desc">' + config.description + '</div>';
    html += '</div>';
    
    // 课程卡片
    html += '<div class="l2-courses-grid">';
    config.courses.forEach(function(course) {
      const levelClass = course.level === '高级' ? 'level-advanced' : (course.level === '中级' ? 'level-intermediate' : 'level-beginner');
      html += '<div class="l2-course-card" data-course="' + course.id + '">';
      html += '<div class="course-icon">' + course.icon + '</div>';
      html += '<div class="course-info">';
      html += '<div class="course-title">' + course.title + '</div>';
      html += '<div class="course-desc">' + course.description + '</div>';
      html += '<div class="course-meta">';
      html += '<span class="course-level ' + levelClass + '">' + course.level + '</span>';
      html += '<span class="course-duration">⏱️ ' + course.duration + '</span>';
      html += '<span class="course-students">👥 ' + course.students + ' 人在学</span>';
      html += '</div>';
      html += '</div>';
      html += '<button class="course-enroll-btn">立即报名</button>';
      html += '</div>';
    });
    html += '</div>';
    
    html += '</div>';
    return html;
  },
  
  // 根据建筑ID渲染对应面板
  render: function(buildingId) {
    switch(buildingId) {
      case 'pavilion': return this.renderCore();
      case 'market': return this.renderMarket();
      case 'museum': return this.renderMuseum();
      case 'school': return this.renderSchool();
      default: return '<div class="l2-empty">暂无内容</div>';
    }
  }
};

/* ============ 初始化 ============ */
function init(){
  try {
  clock = new THREE.Clock();
  
  // 场景
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87CEEB);
  scene.fog = new THREE.FogExp2(0x88bbdd, 0.002);
  
  // 相机
  camera = new THREE.PerspectiveCamera(55, innerWidth/innerHeight, 0.5, 2000);
  
  // Raycaster（交互检测）
  raycaster = new THREE.Raycaster();
  mouseVec = new THREE.Vector3();
  
  // 渲染器
  const canvas = document.getElementById('scene');
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setSize(innerWidth, innerHeight);
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  
  // 光照（确保场景有足够亮度）
  scene.add(new THREE.AmbientLight(0xffffff, 0.6)); // 环境光调亮
  const sun = new THREE.DirectionalLight(0xfff4e0, 1.5); // 方向光调亮
  sun.position.set(100, 200, 50);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.left = -200;
  sun.shadow.camera.right = 200;
  sun.shadow.camera.top = 200;
  sun.shadow.camera.bottom = -200;
  scene.add(sun);
  
  // 创建场景内容
  buildTerrain();
  buildWater();
  buildTrees();
  buildBuildings();
  buildClouds();
  buildFireflies();
  injectPanelHTML();
  
  // 调整相机位置（确保在地形上方）
  const groundH = getHeight(camPos.x, camPos.z);
  camPos.y = groundH + 5;
  
  // 事件
  setupEvents();
  setupPanelEvents();
  setupKeyboard();
  setupNavButtons();
  updateNavUI();
  
  // 开始动画
  animate();
  window.__3DRendered = true;
  if(window.__fallbackTimer) clearTimeout(window.__fallbackTimer);
  } catch(e) {
    console.error('[YNDXW INIT ERROR]', e.message, e.stack);
    // 降级到2D
    var sceneEl = document.getElementById('scene');
    var loadingEl = document.getElementById('loading');
    var uiEl = document.getElementById('ui');
    var fallbackEl = document.getElementById('fallback-2d');
    if(sceneEl) sceneEl.style.display = 'none';
    if(loadingEl) loadingEl.style.display = 'none';
    if(uiEl) uiEl.style.display = 'none';
    if(fallbackEl) fallbackEl.style.display = 'block';
  }
}

/* ============ 地形 ============ */
function getHeight(x, z){
  let h = 0;
  h += simplex.noise2D(x*0.003, z*0.003) * 40;
  h += simplex.noise2D(x*0.008, z*0.008) * 20;
  h += simplex.noise2D(x*0.025, z*0.025) * 6;
  return h;
}

function buildTerrain(){
  const size = 400;
  const seg = 150;
  const geo = new THREE.PlaneGeometry(size, size, seg, seg);
  geo.rotateX(-Math.PI/2);
  const pos = geo.attributes.position;
  
  for(let i=0; i<pos.count; i++){
    const x = pos.getX(i), z = pos.getZ(i);
    pos.setY(i, getHeight(x, z));
  }
  geo.computeVertexNormals();
  
  const mat = new THREE.MeshLambertMaterial({ color: 0x3a7d3a });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.receiveShadow = true;
  scene.add(mesh);
}

/* ============ 水面 ============ */
function buildWater(){
  const geo = new THREE.PlaneGeometry(120, 120, 32, 32);
  geo.rotateX(-Math.PI/2);
  const mat = new THREE.MeshPhongMaterial({
    color: 0x3388aa, transparent: true, opacity: 0.7,
    shininess: 100, specular: 0x88ccff
  });
  waterMesh = new THREE.Mesh(geo, mat);
  waterMesh.position.y = -2;
  waterMesh.receiveShadow = true;
  scene.add(waterMesh);
}

function animateWater(t){
  if(!waterMesh) return;
  const pos = waterMesh.geometry.attributes.position;
  for(let i=0; i<pos.count; i++){
    const x = pos.getX(i), z = pos.getZ(i);
    pos.setY(i, Math.sin(x*0.08+t)*0.6 + Math.cos(z*0.06+t*0.7)*0.4);
  }
  pos.needsUpdate = true;
}

/* ============ 树木 ============ */
function buildTrees(){
  const trunkMat = new THREE.MeshLambertMaterial({ color: 0x5c3a1e });
  const leafMat = new THREE.MeshLambertMaterial({ color: 0x2d6b2e });
  
  for(let i=0; i<60; i++){
    const x = (Math.random()-0.5)*350;
    const z = (Math.random()-0.5)*350;
    const h = getHeight(x, z);
    if(h < -3 || h > 30) continue;
    
    const group = new THREE.Group();
    const s = 0.6 + Math.random()*0.8;
    
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.3*s, 0.5*s, 4*s, 6), trunkMat);
    trunk.position.y = 2*s;
    trunk.castShadow = true;
    group.add(trunk);
    
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(3*s, 7, 5), leafMat);
    leaf.position.y = 5*s;
    leaf.castShadow = true;
    group.add(leaf);
    
    group.position.set(x, h, z);
    scene.add(group);
  }
}

/* ============ 建筑 ============ */
function buildBuildings(){
  buildingMeshes = [];
  cfg.L1.buildings.forEach(b => {
    const h = getHeight(b.position.x, b.position.z);
    const group = new THREE.Group();
    group.userData = { id: b.id, name: b.name };
    
    // 地基
    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(8, 10, 3, 8),
      new THREE.MeshPhongMaterial({ color: 0xe8d5b0 })
    );
    base.position.y = 1.5;
    base.castShadow = true;
    group.add(base);
    
    // 柱子
    for(let i=0; i<6; i++){
      const a = i/6*Math.PI*2;
      const pillar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.4, 0.4, 8, 8),
        new THREE.MeshPhongMaterial({ color: 0xd4442a })
      );
      pillar.position.set(Math.cos(a)*7, 5, Math.sin(a)*7);
      pillar.castShadow = true;
      group.add(pillar);
    }
    
    // 屋顶
    const roof = new THREE.Mesh(
      new THREE.ConeGeometry(12, 4, 8),
      new THREE.MeshPhongMaterial({ color: 0x2a2a2a })
    );
    roof.position.y = 11;
    roof.castShadow = true;
    group.add(roof);
    
    // 顶饰
    const top = new THREE.Mesh(
      new THREE.SphereGeometry(0.8, 8, 8),
      new THREE.MeshPhongMaterial({ color: 0xdaa520 })
    );
    top.position.y = 14;
    group.add(top);
    
    group.position.set(b.position.x, h, b.position.z);
    scene.add(group);
    buildingMeshes.push(group);
  });
}

/* ============ 云朵 ============ */
function buildClouds(){
  const cloudMat = new THREE.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: 0.8 });
  for(let i=0; i<12; i++){
    const group = new THREE.Group();
    const n = 3 + Math.floor(Math.random()*3);
    for(let j=0; j<n; j++){
      const s = 5 + Math.random()*8;
      const ball = new THREE.Mesh(new THREE.SphereGeometry(s, 7, 5), cloudMat);
      ball.position.set(j*s*0.7 - n*s*0.35, Math.random()*3, Math.random()*6-3);
      group.add(ball);
    }
    group.position.set((Math.random()-0.5)*600, 80+Math.random()*60, (Math.random()-0.5)*600);
    group.userData.speed = 0.1 + Math.random()*0.3;
    scene.add(group);
    clouds.push(group);
  }
}

/* ============ 事件 ============ */
function setupEvents(){
  const cvs = renderer.domElement;
  
  // 鼠标
  cvs.addEventListener('mousedown', e => { mouseDown=true; lastX=e.clientX; lastY=e.clientY; });
  cvs.addEventListener('mousemove', e => {
    if(!mouseDown) return;
    camYaw -= (e.clientX-lastX)*0.004;
    camPitch -= (e.clientY-lastY)*0.004;
    camPitch = Math.max(-0.7, Math.min(0.7, camPitch));
    lastX=e.clientX; lastY=e.clientY;
  });
  cvs.addEventListener('mouseup', () => mouseDown=false);
  cvs.addEventListener('mouseleave', () => mouseDown=false);
  
  // ===== 新增：鼠标悬停检测（非拖拽时） =====
  cvs.addEventListener('mousemove', function onMove(e){
    if(isPanelOpen) return; // 面板打开时禁用悬停检测
    if(mouseDown) return;   // 拖拽时不检测
    handleHoverCheck(e);
  });
  
  // ===== 新增：点击建筑 =====
  cvs.addEventListener('click', function onClick(e){
    if(isPanelOpen) return;
    handleBuildingClick(e);
  });
  
  // 触摸
  cvs.addEventListener('touchstart', e => {
    if(e.touches.length===1){ mouseDown=true; lastX=e.touches[0].clientX; lastY=e.touches[0].clientY; }
  }, {passive:true});
  cvs.addEventListener('touchmove', e => {
    if(!mouseDown || e.touches.length!==1) return;
    const t = e.touches[0];
    camYaw -= (t.clientX-lastX)*0.004;
    camPitch -= (t.clientY-lastY)*0.004;
    camPitch = Math.max(-0.7, Math.min(0.7, camPitch));
    lastX=t.clientX; lastY=t.clientY;
  }, {passive:true});
  cvs.addEventListener('touchend', () => mouseDown=false);
  
  // 窗口大小
  window.addEventListener('resize', () => {
    camera.aspect = innerWidth/innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
  });
}

/* ============ 动画 ============ */
function animate(){
  requestAnimationFrame(animate);
  const t = clock.getElapsedTime();
  
  // 更新相机（第一人称）
  camera.position.copy(camPos);
  camera.rotation.order = 'YXZ';
  camera.rotation.y = camYaw;
  camera.rotation.x = camPitch;
  
  // 水面动画
  animateWater(t);
  
  // 云朵飘动
  clouds.forEach(c => {
    c.position.x += c.userData.speed;
    if(c.position.x > 350) c.position.x = -350;
  });
  
  // ===== 萤火虫闪烁动画 =====
  animateFireflies(t);
  
  // ===== 管理员面板 + 小地图实时更新 =====
  updateAdminPanel(t);
  updateMinimap();
  
  renderer.render(scene, camera);
}

/* ============ 萤火虫粒子系统 ============ */
function buildFireflies(){
  fireflyMeshes=[];
  fireflyData=[];
  const count = 50 + Math.floor(Math.random()*31); // 50-80
  const color = new THREE.Color();
  
  for(let i=0; i<count; i++){
    const x = (Math.random()-0.5)*280;
    const z = (Math.random()-0.5)*280;
    const y = getHeight(x, z) + 1 + Math.random()*8;
    if(y < -1) continue;
    
    const geo = new THREE.SphereGeometry(0.12 + Math.random()*0.1, 5, 5);
    const mat = new THREE.MeshBasicMaterial({
      color: 0xffff88,
      transparent: true,
      opacity: 0.7
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    
    scene.add(mesh);
    fireflyMeshes.push(mesh);
    fireflyData.push({
      baseY: y,
      speed: 0.3 + Math.random()*0.5,
      phase: Math.random()*Math.PI*2,
      blinkSpeed: 1.5 + Math.random()*2.5,
      blinkPhase: Math.random()*Math.PI*2,
      driftX: (Math.random()-0.5)*0.3,
      driftZ: (Math.random()-0.5)*0.3
    });
  }
}

function animateFireflies(t){
  fireflyMeshes.forEach(function(mesh, i){
    const d = fireflyData[i];
    // 上下漂浮
    mesh.position.y = d.baseY + Math.sin(t*d.speed + d.phase)*0.5;
    mesh.position.x += d.driftX*0.01;
    mesh.position.z += d.driftZ*0.01;
    // 随机漂移范围约束
    if(mesh.position.y > d.baseY + 2) d.baseY += 0.02;
    if(mesh.position.y < d.baseY - 2) d.baseY -= 0.02;
    
    // 闪烁：忽明忽暗
    const blink = 0.3 + 0.7*(0.5 + 0.5*Math.sin(t*d.blinkSpeed + d.blinkPhase));
    mesh.material.opacity = blink;
    // 颜色偏黄绿
    mesh.material.color.setRGB(blink*1.0, blink*1.0, blink*0.4);
  });
}

/* ============ 悬停检测 ============ */
function handleHoverCheck(e){
  const rect = renderer.domElement.getBoundingClientRect();
  const nx = ((e.clientX - rect.left) / rect.width)*2 - 1;
  const ny = -((e.clientY - rect.top) / rect.height)*2 + 1;
  
  mouseVec.set(nx, ny, 0.5).unproject(camera);
  const dir = mouseVec.clone().sub(camera.position).normalize();
  const ray = new THREE.Ray(camera.position, dir);
  
  // 收集所有建筑子网格进行检测
  const targets=[];
  buildingMeshes.forEach(function(g){
    g.traverse(function(child){
      if(child.isMesh) targets.push(child);
    });
  });
  
  const hits = ray.intersectObjects(targets, false);
  const hud = document.getElementById('bld-hud');
  
  if(hits.length > 0){
    // 找到所属building group
    let obj = hits[0].object;
    while(obj && !obj.userData.id){
      obj = obj.parent;
    }
    if(obj && obj.userData.id && hoveredBuilding !== obj){
      // 清除旧高亮
      if(hoveredBuilding && buildingOutlineMaterials[hoveredBuilding.userData.id]){
        restoreHighlight(hoveredBuilding);
      }
      hoveredBuilding = obj;
      applyHighlight(hoveredBuilding);
    }
    // 显示HUD
    if(hud && hoveredBuilding){
      hud.textContent = hoveredBuilding.userData.name || hoveredBuilding.userData.id;
      hud.style.opacity='1';
      hud.style.pointerEvents='none';
    }
  } else {
    if(hoveredBuilding){
      restoreHighlight(hoveredBuilding);
      hoveredBuilding = null;
    }
    if(hud) hud.style.opacity='0';
  }
}

/* ============ 建筑点击 ============ */
function handleBuildingClick(e){
  const rect = renderer.domElement.getBoundingClientRect();
  const nx = ((e.clientX - rect.left) / rect.width)*2 - 1;
  const ny = -((e.clientY - rect.top) / rect.height)*2 + 1;
  
  mouseVec.set(nx, ny, 0.5).unproject(camera);
  const dir = mouseVec.clone().sub(camera.position).normalize();
  const ray = new THREE.Ray(camera.position, dir);
  
  const targets=[];
  buildingMeshes.forEach(function(g){
    g.traverse(function(child){
      if(child.isMesh) targets.push(child);
    });
  });
  
  const hits = ray.intersectObjects(targets, false);
  if(hits.length > 0){
    let obj = hits[0].object;
    while(obj && !obj.userData.id){
      obj = obj.parent;
    }
    if(obj && obj.userData.id){
      switchScene(obj.userData.name, function(){
        openL2Panel(obj.userData.id, obj.userData.name);
      });
    }
  }
}

/* ============ 高亮效果 ============ */
function applyHighlight(group){
  const id = group.userData.id;
  if(buildingOutlineMaterials[id]) return;
  
  buildingOutlineMaterials[id]=[];
  group.traverse(function(child){
    if(child.isMesh){
      buildingOutlineMaterials[id].push({ mesh: child, material: child.material });
      // 叠加发光材质
      child.material = new THREE.MeshPhongMaterial({
        color: 0xffffff,
        emissive: 0xffdd44,
        emissiveIntensity: 0.5,
        transparent: true,
        opacity: child.material.opacity !== undefined ? child.material.opacity : 1.0,
        depthWrite: true
      });
    }
  });
}

function restoreHighlight(group){
  const id = group.userData.id;
  const saved = buildingOutlineMaterials[id];
  if(!saved) return;
  saved.forEach(function(entry){
    entry.mesh.material = entry.material;
  });
  delete buildingOutlineMaterials[id];
}

/* ============ L2导航面板 ============ */
function injectPanelHTML(){
  // 建筑名称HUD
  var hud = document.createElement('div');
  hud.id = 'bld-hud';
  hud.style.cssText = (
    'position:fixed;top:80px;left:20px;z-index:60;'+
    'background:rgba(0,0,0,0.6);backdrop-filter:blur(8px);'+
    '-webkit-backdrop-filter:blur(8px);'+
    'color:#fff;font-size:14px;padding:8px 16px;'+
    'border-radius:12px;border:1px solid rgba(255,255,255,0.15);'+
    'opacity:0;transition:opacity .25s;pointer-events:none;'+
    'font-family:inherit;white-space:nowrap;'
  );
  document.body.appendChild(hud);
  
  // L2面板（重构：更灵活的结构）
  var panel = document.createElement('div');
  panel.id = 'l2-panel';
  panel.className = 'l2-panel';
  panel.style.cssText = (
    'position:fixed;bottom:0;left:0;right:0;z-index:200;'+
    'transform:translateY(100%);transition:transform .4s cubic-bezier(.22,.61,.36,1);'+
    'background:rgba(10,16,30,0.95);backdrop-filter:blur(20px);'+
    '-webkit-backdrop-filter:blur(20px);'+
    'border-top:1px solid rgba(255,255,255,0.12);'+
    'border-radius:20px 20px 0 0;'+
    'max-height:85vh;overflow-y:auto;'+
    'box-shadow:0 -10px 50px rgba(0,0,0,0.5);'
  );
  
  // 面板头部（通用）
  panel.innerHTML = '<div class="l2-panel-header" style="'+
    'position:sticky;top:0;z-index:10;'+
    'display:flex;align-items:center;justify-content:space-between;'+
    'padding:16px 20px;'+
    'background:rgba(10,16,30,0.95);backdrop-filter:blur(20px);'+
    '-webkit-backdrop-filter:blur(20px);'+
    'border-bottom:1px solid rgba(255,255,255,0.08);'+
    '">'+
    '<div style="display:flex;align-items:center;gap:12px;">'+
    '<span id="panel-bld-icon" style="font-size:28px;">🏛️</span>'+
    '<div>'+
    '<div id="panel-bld-name" style="font-size:18px;font-weight:600;color:#fff;margin-bottom:2px;"></div>'+
    '<div id="panel-bld-desc" style="font-size:12px;color:rgba(255,255,255,0.5);"></div>'+
    '</div>'+
    '</div>'+
    '<button id="panel-close" style="'+
    'background:rgba(255,255,255,0.08);border:none;border-radius:50%;'+
    'width:36px;height:36px;display:flex;align-items:center;justify-content:center;'+
    'color:#fff;font-size:18px;cursor:pointer;transition:all .2s;'+
    '">✕</button>'+
    '</div>'+
    '<div id="panel-body" style="padding:20px;padding-bottom:40px;"></div>';
  
  document.body.appendChild(panel);
}

function hexToRgba(hex, alpha){
  var r = parseInt(hex.slice(1,3),16);
  var g = parseInt(hex.slice(3,5),16);
  var b = parseInt(hex.slice(5,7),16);
  return 'rgba('+r+','+g+','+b+','+alpha+')';
}

function openL2Panel(buildingId, buildingName){
  isPanelOpen = true;
  activeBuildingId = buildingId;
  
  var panel = document.getElementById('l2-panel');
  var panelName = document.getElementById('panel-bld-name');
  var panelDesc = document.getElementById('panel-bld-desc');
  var panelIcon = document.getElementById('panel-bld-icon');
  var panelBody = document.getElementById('panel-body');
  
  // 获取建筑配置
  var buildingConfig;
  switch(buildingId) {
    case 'pavilion': buildingConfig = cfg.L2.core; break;
    case 'market': buildingConfig = cfg.L2.market; break;
    case 'museum': buildingConfig = cfg.L2.museum; break;
    case 'school': buildingConfig = cfg.L2.school; break;
  }
  
  if(panelName && buildingConfig) panelName.textContent = buildingConfig.title || buildingName;
  if(panelDesc && buildingConfig) panelDesc.textContent = buildingConfig.description || '';
  if(panelIcon && buildingConfig) panelIcon.textContent = buildingConfig.icon || '🏛️';
  
  // 渲染面板内容
  if(panelBody) {
    panelBody.innerHTML = L2PanelRenderer.render(buildingId);
    
    // 绑定事件
    setupL2PanelEvents(buildingId);
    
    // 如果是市场大厅，加载商品数据
    if(buildingId === 'market') {
      loadMarketProducts('agents'); // 默认加载Agent分类
    }
    
    // 如果是博物馆，加载展览详情
    if(buildingId === 'museum') {
      loadMuseumExhibits();
    }
  }
  
  if(panel) panel.style.transform='translateY(0)';
}

function closeL2Panel(){
  isPanelOpen = false;
  activeBuildingId = null;
  var panel = document.getElementById('l2-panel');
  if(panel) panel.style.transform='translateY(100%)';
}

function setupPanelEvents(){
  // X按钮关闭
  var closeBtn = document.getElementById('panel-close');
  if(closeBtn){
    closeBtn.addEventListener('click', function(e){
      e.stopPropagation();
      closeL2Panel();
    });
  }
  
  // 点击面板外区域关闭
  document.addEventListener('click', function(e){
    var panel = document.getElementById('l2-panel');
    if(!panel) return;
    if(isPanelOpen && !panel.contains(e.target)){
      closeL2Panel();
    }
  });
}

/* ============ L2面板事件绑定 ============ */
function setupL2PanelEvents(buildingId){
  switch(buildingId) {
    case 'pavilion':
      setupCoreEvents();
      break;
    case 'market':
      setupMarketEvents();
      break;
    case 'museum':
      setupMuseumEvents();
      break;
    case 'school':
      setupSchoolEvents();
      break;
  }
}

function setupCoreEvents(){
  // 核心区模块卡片点击
  var cards = document.querySelectorAll('.l2-module-card');
  cards.forEach(function(card) {
    card.addEventListener('click', function() {
      var action = this.getAttribute('data-action');
      var target = this.getAttribute('data-target');
      
      if(action === 'link') {
        window.location.href = target;
      } else if(action === 'panel') {
        // 显示子面板（可以后续实现）
        console.log('Open sub-panel:', target);
      }
    });
    
    // Hover效果
    card.addEventListener('mouseenter', function() {
      this.style.transform = 'translateY(-4px)';
      this.style.boxShadow = '0 8px 24px rgba(0,0,0,0.3)';
    });
    card.addEventListener('mouseleave', function() {
      this.style.transform = '';
      this.style.boxShadow = '';
    });
  });
}

function setupMarketEvents(){
  // 分类标签切换
  var tabs = document.querySelectorAll('.l2-tab');
  tabs.forEach(function(tab) {
    tab.addEventListener('click', function() {
      // 更新active状态
      tabs.forEach(function(t) { t.classList.remove('active'); });
      this.classList.add('active');
      
      // 加载对应分类的商品
      var category = this.getAttribute('data-category');
      loadMarketProducts(category);
    });
  });
}

function setupMuseumEvents(){
  // 展览卡片点击
  var exhibits = document.querySelectorAll('.l2-exhibit-card');
  exhibits.forEach(function(exhibit) {
    exhibit.addEventListener('click', function() {
      var exhibitId = this.getAttribute('data-exhibit');
      toggleExhibitContent(exhibitId);
    });
  });
}

function setupSchoolEvents(){
  // 课程报名按钮
  var buttons = document.querySelectorAll('.course-enroll-btn');
  buttons.forEach(function(btn) {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      alert('报名功能即将上线，敬请期待！');
    });
  });
  
  // 课程卡片点击
  var courses = document.querySelectorAll('.l2-course-card');
  courses.forEach(function(course) {
    course.addEventListener('click', function() {
      var courseId = this.getAttribute('data-course');
      console.log('View course:', courseId);
    });
  });
}

/* ============ 数据加载函数 ============ */
function loadMarketProducts(category) {
  // 从JSON文件加载商品数据
  fetch('data/content-market.json')
    .then(function(res) { return res.json(); })
    .then(function(data) {
      var grid = document.getElementById('products-grid');
      if(!grid) return;
      
      // 这里可以根据category过滤，现在先显示featured
      var products = data.featured || [];
      
      var html = '';
      products.forEach(function(product) {
        html += '<div class="l2-product-card">';
        html += '<div class="product-icon">' + (product.icon || '📦') + '</div>';
        html += '<div class="product-info">';
        html += '<div class="product-title">' + product.title + '</div>';
        html += '<div class="product-desc">' + product.description + '</div>';
        html += '<div class="product-footer">';
        html += '<span class="product-price">¥' + product.price + '</span>';
        html += '<span class="product-rating">⭐ ' + product.rating + '</span>';
        html += '</div>';
        html += '</div>';
        html += '<button class="product-buy-btn">购买</button>';
        html += '</div>';
      });
      
      grid.innerHTML = html || '<div class="l2-empty">该分类暂无商品</div>';
      
      // 绑定购买按钮事件
      var buyButtons = grid.querySelectorAll('.product-buy-btn');
      buyButtons.forEach(function(btn) {
        btn.addEventListener('click', function(e) {
          e.stopPropagation();
          alert('购买功能即将上线！');
        });
      });
    })
    .catch(function(err) {
      console.error('Failed to load market data:', err);
      var grid = document.getElementById('products-grid');
      if(grid) grid.innerHTML = '<div class="l2-error">加载失败，请刷新重试</div>';
    });
}

function loadMuseumExhibits() {
  // 从JSON文件加载展览数据
  fetch('data/content-museum.json')
    .then(function(res) { return res.json(); })
    .then(function(data) {
      var exhibits = data.exhibits || [];
      
      exhibits.forEach(function(exhibit) {
        var contentEl = document.getElementById('exhibit-content-' + exhibit.id);
        if(!contentEl) return;
        
        var html = '<div class="exhibit-sections">';
        (exhibit.sections || []).forEach(function(section) {
          html += '<div class="exhibit-section">';
          html += '<h4>' + section.title + '</h4>';
          html += '<p>' + section.content + '</p>';
          html += '</div>';
        });
        html += '</div>';
        
        contentEl.innerHTML = html;
      });
    })
    .catch(function(err) {
      console.error('Failed to load museum data:', err);
    });
}

function toggleExhibitContent(exhibitId) {
  var contentEl = document.getElementById('exhibit-content-' + exhibitId);
  if(!contentEl) return;
  
  if(contentEl.classList.contains('expanded')) {
    contentEl.classList.remove('expanded');
    contentEl.style.maxHeight = '0';
  } else {
    contentEl.classList.add('expanded');
    contentEl.style.maxHeight = '500px';
  }
}

/* ============ 场景过渡动画 ============ */
function switchScene(sceneName, onReady){
  if(isTransitioning) return;
  isTransitioning=true;
  if(!transitionEl) transitionEl=document.getElementById('scene-transition');
  transitionEl.classList.remove('fade-in','fade-out');
  transitionEl.style.opacity='0';
  // force reflow
  void transitionEl.offsetWidth;
  transitionEl.classList.add('fade-in');
  setTimeout(function(){
    currentSceneName=sceneName;
    currentLayer=sceneName==='公共区'?'L1':'L2';
    updateNavUI();
    if(onReady) onReady();
    transitionEl.classList.remove('fade-in');
    void transitionEl.offsetWidth;
    transitionEl.classList.add('fade-out');
    setTimeout(function(){
      transitionEl.classList.remove('fade-out');
      transitionEl.style.opacity='0';
      isTransitioning=false;
    },500);
  },500);
}

/* ============ 导航UI更新 ============ */
function updateNavUI(){
  var nameEl=document.getElementById('nav-scene-name');
  var layerEl=document.getElementById('nav-layer-label');
  var backBtn=document.getElementById('btn-back');
  if(nameEl) nameEl.textContent=currentSceneName;
  if(layerEl) layerEl.textContent=currentLayer;
  if(backBtn){
    if(currentLayer==='L2') backBtn.classList.add('visible');
    else backBtn.classList.remove('visible');
  }
}

/* ============ 管理员面板 ============ */
function toggleAdminPanel(){
  adminPanelVisible=!adminPanelVisible;
  var el=document.getElementById('admin-panel');
  if(el){
    if(adminPanelVisible) el.classList.add('visible');
    else el.classList.remove('visible');
  }
}

function updateAdminPanel(t){
  if(!adminPanelVisible) return;
  fpsFrames++;
  if(t-fpsLastTime>=1){
    fpsValue=fpsFrames;
    fpsFrames=0;
    fpsLastTime=t;
  }
  var set=function(id,v){var e=document.getElementById(id);if(e)e.textContent=v};
  set('ap-fps',fpsValue);
  set('ap-scene',currentSceneName);
  set('ap-cx',camPos.x.toFixed(1));
  set('ap-cy',camPos.y.toFixed(1));
  set('ap-cz',camPos.z.toFixed(1));
  set('ap-yaw',(camYaw*180/Math.PI).toFixed(0)+'°');
  set('ap-hotspots',buildingMeshes.length);
  set('ap-webgl',window.__webglOK?'OK':'FAIL');
}

/* ============ 小地图 ============ */
function updateMinimap(){
  var canvas=document.getElementById('minimap-canvas');
  var arrow=document.getElementById('minimap-arrow');
  if(!canvas||!arrow) return;
  var ctx=canvas.getContext('2d');
  if(!ctx) return;
  var w=40,h=40;
  if(canvas.width!==w*2) canvas.width=w*2;
  if(canvas.height!==h*2) canvas.height=h*2;
  ctx.setTransform(2,0,0,2,0,0);
  // 背景
  ctx.fillStyle='rgba(10,22,40,0.9)';
  ctx.fillRect(0,0,w,h);
  // 建筑点
  var scale=0.05; // 世界坐标→像素
  var cx=w/2,cy=h/2;
  buildingMeshes.forEach(function(g){
    var dx=(g.position.x-camPos.x)*scale;
    var dz=(g.position.z-camPos.z)*scale;
    var rx=Math.cos(camYaw)*dx-Math.sin(camYaw)*dz;
    var ry=Math.sin(camYaw)*dx+Math.cos(camYaw)*dz;
    var sx=cx+rx,sy=cy+ry;
    if(sx<0||sx>w||sy<0||sy>h) return;
    ctx.fillStyle='rgba(126,200,227,0.6)';
    ctx.beginPath();ctx.arc(sx,sy,2,0,Math.PI*2);ctx.fill();
  });
  // 相机箭头方向
  arrow.style.setProperty('--cam-yaw',((-camYaw*180/Math.PI)).toFixed(0)+'deg');
}

/* ============ 键盘快捷键 ============ */
function setupKeyboard(){
  document.addEventListener('keydown',function(e){
    // ~ 或 Ctrl+Shift+D → admin面板
    if(e.key==='`'||e.key==='~'||(e.ctrlKey&&e.shiftKey&&(e.key==='D'||e.key==='d'))){
      e.preventDefault();
      toggleAdminPanel();
      return;
    }
    // Escape → 关闭L2面板/返回L1
    if(e.key==='Escape'){
      if(isPanelOpen){closeL2Panel();return}
      if(currentLayer==='L2'){switchScene('公共区');return}
    }
    // H → HUD显隐
    if(e.key==='h'||e.key==='H'){
      if(document.activeElement&&document.activeElement.tagName==='INPUT') return;
      hudVisible=!hudVisible;
      document.body.classList.toggle('hud-hidden',!hudVisible);
    }
  });
}

/* ============ 导航按钮事件 ============ */
function setupNavButtons(){
  var backBtn=document.getElementById('btn-back');
  if(backBtn){
    backBtn.addEventListener('click',function(){
      closeL2Panel();
      switchScene('公共区');
    });
  }
  var settingsBtn=document.getElementById('btn-settings');
  if(settingsBtn){
    settingsBtn.addEventListener('click',function(){
      toggleAdminPanel();
    });
  }
}

/* ============ 启动 ============ */
window.addEventListener('DOMContentLoaded', init);

})();