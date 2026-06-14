/**
 * YNDXW 公共区首页 - 3D自然山水全景（简化版 v1.4）
 * 修复：背景全黑问题
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
    for(let i=255;i>0;i--){const j=Math.floor(Math.random()*(i+1));[this.p[i],this.p[j]]=[this.p[j],this.p[i]]]}
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
  
  // 调整相机位置（确保在地形上方）
  const groundH = getHeight(camPos.x, camPos.z);
  camPos.y = groundH + 5;
  
  // 事件
  setupEvents();
  
  // 开始动画
  animate();
  window.__3DRendered = true;
  } catch(e) {
    console.error('[YNDXW INIT ERROR]', e.message, e.stack);
    var el = document.getElementById('loadBar');
    if(el) { el.style.width='100%'; el.style.background='#e33'; }
    var loading = document.getElementById('loading');
    if(loading) loading.querySelector('h2').textContent = '加载失败：' + e.message;
  }
}

// 标记渲染成功
window.__3DRendered = true;

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
  
  renderer.render(scene, camera);
}

/* ============ 启动 ============ */
window.addEventListener('DOMContentLoaded', init);

})();