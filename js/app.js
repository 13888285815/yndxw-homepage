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

// 高亮用的边缘光材质（按building id存储）
const buildingOutlineMaterials={};

// L2导航面板模块定义（对应 config.js L2.core.sections）
const L2_NAV_ITEMS=[
  { id:"market", name:"市场", icon:"🏪", color:"#6366f1", target:"/market" },
  { id:"agents", name:"Agent", icon:"🤖", color:"#8b5cf6", target:"/agents" },
  { id:"skills", name:"Skills", icon:"🛠️", color:"#10b981", target:"/skills" },
  { id:"docs",   name:"文档", icon:"📚", color:"#f59e0b", target:"/docs" },
  { id:"tools",  name:"工具箱",icon:"🔧", color:"#3b82f6", target:"https://tools.yndxw.com" },
  { id:"vault",  name:"核心区",icon:"🔐", color:"#ef4444", target:"/vault" }
];

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
      openL2Panel(obj.userData.id, obj.userData.name);
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
  
  // L2面板
  var panel = document.createElement('div');
  panel.id = 'l2-panel';
  panel.style.cssText = (
    'position:fixed;bottom:0;left:0;right:0;z-index:200;'+
    'transform:translateY(100%);transition:transform .4s cubic-bezier(.22,.61,.36,1);'+
    'background:rgba(10,16,30,0.88);backdrop-filter:blur(20px);'+
    '-webkit-backdrop-filter:blur(20px);'+
    'border-top:1px solid rgba(255,255,255,0.12);'+
    'border-radius:20px 20px 0 0;padding:16px 12px 24px;'+
    'max-height:75vh;overflow-y:auto;'
  );
  
  // 面板头部
  panel.innerHTML = '<div id="panel-header" style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;padding:0 8px;">'+
    '<div style="display:flex;align-items:center;gap:10px;">'+
    '<span id="panel-bld-icon" style="font-size:22px;">🏛️</span>'+
    '<div><div id="panel-bld-name" style="font-size:16px;font-weight:600;color:#fff;"></div>'+
    '<div style="font-size:11px;color:rgba(255,255,255,0.45);margin-top:2px;">点击模块进入相应区域</div></div></div>'+
    '<button id="panel-close" style="'+
    'background:rgba(255,255,255,0.08);border:none;border-radius:50%;'+
    'width:32px;height:32px;display:flex;align-items:center;justify-content:center;'+
    'color:#fff;font-size:16px;cursor:pointer;transition:background .2s;'+
    '">✕</button></div>'+
    '<div id="panel-modules" style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;"></div>';
  
  document.body.appendChild(panel);
  
  // 填充6个模块
  var modules = document.getElementById('panel-modules');
  L2_NAV_ITEMS.forEach(function(item){
    var card = document.createElement('a');
    card.href = item.target;
    card.target = item.target.startsWith('http') ? '_blank' : '_self';
    card.style.cssText = (
      'display:flex;flex-direction:column;align-items:center;justify-content:center;'+
      'gap:6px;padding:14px 8px;border-radius:14px;text-decoration:none;'+
      'background:' + hexToRgba(item.color, 0.15) + ';'+
      'border:1px solid ' + hexToRgba(item.color, 0.3) + ';'+
      'transition:transform .2s,background .2s,box-shadow .2s;cursor:pointer;'+
      'color:#fff;'
    );
    card.innerHTML = '<span style="font-size:26px;">' + item.icon + '</span>'+
      '<span style="font-size:12px;font-weight:500;">' + item.name + '</span>';
    card.addEventListener('mouseenter', function(){
      card.style.transform='scale(1.06)';
      card.style.background = hexToRgba(item.color, 0.28);
      card.style.boxShadow = '0 4px 20px ' + hexToRgba(item.color, 0.4);
    });
    card.addEventListener('mouseleave', function(){
      card.style.transform='';
      card.style.background = hexToRgba(item.color, 0.15);
      card.style.boxShadow='';
    });
    modules.appendChild(card);
  });
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
  if(panelName) panelName.textContent = buildingName || buildingId;
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

/* ============ 启动 ============ */
window.addEventListener('DOMContentLoaded', init);

})();