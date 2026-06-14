# YNDSW 虚拟世界 - 架构设计文档

> 版本：v0.1 | 2026-06-14

---

## 一、项目概述

### 1.1 是什么
一个基于Web的3D虚拟世界平台，用户通过鼠标/手指点击导航，探索不同区域，访问Agent市场、Skill生态、教育内容等。

### 1.2 核心特征
- **3D全景导航**：360°可旋转的3D场景，点击热点切换区域
- **三层导航深度**：全景 → 建筑/房间 → 内容（不超过3层）
- **分区视觉风格**：
  - 公共区/成人区/核心区/扩展区：3D写实
  - 儿童区：3D卡通
  - 老残区：简洁2D
- **纯静态部署**：GitHub Pages，零后端
- **配置驱动**：JSON配置文件定义所有区域、建筑、内容

### 1.3 交互模式
- 鼠标拖拽/手指滑动：旋转视角
- 鼠标点击/手指点击：进入建筑/房间/内容
- 不使用WASD键盘移动
- 移动端：单指滑动转视角，单指点击进入

---

## 二、世界结构

```
┌──────────────────────────────────────────────┐
│              公共区（360°全景）                │
│           山水自然风光，可旋转浏览             │
│                                              │
│   ┌── 核心区（中心地标）────────────┐         │
│   │  🏯 主楼阁                     │         │
│   │  （导航中心，快速入口）         │         │
│   │  风格：3D写实                   │         │
│   └────────────────────────────────┘         │
│                                              │
│   ┌── 扩展区 ──────────────────────┐         │
│   │                                  │         │
│   │  【成人区 - 3D写实】             │         │
│   │  🏢 写字楼/办公楼               │         │
│   │  🏯 古风阁楼                    │         │
│   │  🏞️ 公园                        │         │
│   │  🏪 市场（Agent/Skill商店）     │         │
│   │  🏛️ 博物馆（展示/展览）         │         │
│   │                                  │         │
│   │  【儿童区 - 3D卡通】             │         │
│   │  🏫 学校（课程/学习）            │         │
│   │  📚 图书馆（书籍/阅读）          │         │
│   │  🎡 乐园（游戏/互动）            │         │
│   │                                  │         │
│   │  【老残区 - 简洁2D】             │         │
│   │  ⭕ 活动广场（社区活动）         │         │
│   │  🎭 娱乐广场（娱乐项目）         │         │
│   │  🎓 老年大学（终身学习）         │         │
│   │                                  │         │
│   └──────────────────────────────────┘         │
└──────────────────────────────────────────────┘
```

---

## 三、三层导航结构

```
第1层（L1）：全景场景
  - 用户看到360°山水/建筑全景
  - 可拖拽旋转视角
  - 点击建筑热点进入L2

第2层（L2）：建筑/区域内部
  - 室内场景或区域概览
  - 展示该区域的分类/房间/展品
  - 点击具体项目进入L3

第3层（L3）：内容详情
  - Agent详情页
  - 文档/书籍内容
  - 商品/课程信息
  - 超级链接跳转（外部）
  - "返回上一级"按钮
```

**导航约束**：最多3层，点击超过3层则显示完整页面（不再有3D场景）。

---

## 四、技术架构

### 4.1 技术栈
| 层 | 技术 | 说明 |
|----|------|------|
| 渲染 | Three.js (r168+) | 打包进项目，不引用外部CDN |
| 样式 | 原生CSS + CSS变量 | 响应式，按区域切换主题 |
| 逻辑 | 原生JavaScript (ES6+) | 模块化，按功能拆分 |
| 数据 | JSON配置文件 | 区域/建筑/内容全部JSON定义 |
| 部署 | GitHub Pages | 静态文件，全球CDN |
| 构建 | 无（直接部署源码） | 开发期零构建工具 |

### 4.2 文件结构
```
/
├── index.html              # 入口（加载核心）
├── css/
│   ├── base.css            # 全局基础样式
│   ├── theme-realistic.css # 3D写实主题（公共/成人）
│   ├── theme-cartoon.css   # 3D卡通主题（儿童）
│   └── theme-simple.css    # 简洁2D主题（老残）
├── js/
│   ├── app.js              # 主入口，场景管理器
│   ├── scene-manager.js   # 场景加载/切换/缓存
│   ├── camera-controller.js # 鼠标/触摸视角控制
│   ├── hotspot-manager.js  # 热点（可点击区域）管理
│   ├── scene-renderer.js   # Three.js渲染封装
│   ├── world-builder.js    # 程序化世界构建（地形/建筑/天空）
│   ├── ui-manager.js       # UI层（导航栏/返回按钮/提示）
│   └── three.min.js        # Three.js库（本地打包）
├── data/
│   ├── world.json         # 世界配置（区域/建筑定义）
│   ├── content-market.json # 市场内容
│   ├── content-museum.json # 博物馆内容
│   ├── content-school.json # 学校内容
│   ├── content-library.json# 图书馆内容
│   ├── content-park.json   # 乐园内容
│   └── content-elderly.json# 老残区内容
├── assets/
│   ├── textures/           # 程序化纹理
│   ├── sounds/             # 环境音效（可选）
│   └── icons/              # UI图标（SVG）
└── scenes/
    ├── public-l1.json      # 公共区L1场景配置
    ├── core-l1.json        # 核心区L1
    ├── market-l2.json      # 市场L2
    ├── museum-l2.json      # 博物馆L2
    ├── school-l2.json      # 学校L2（卡通）
    ├── library-l2.json     # 图书馆L2（卡通）
    ├── park-l2.json        # 乐园L2（卡通）
    ├── plaza-l2.json       # 活动广场L2（简洁）
    ├── fun-l2.json         # 娱乐广场L2（简洁）
    └── university-l2.json  # 老年大学L2（简洁）
```

### 4.3 场景切换流程
```
用户点击热点
  → hotspot-manager.js 检测点击
  → 读取 scene config JSON
  → scene-manager.js 执行过渡动画
  → scene-renderer.js 加载新场景
  → 根据区域类型切换CSS主题
  → ui-manager.js 更新导航UI
```

### 4.4 程序化生成 vs 预制资产

| 元素 | 方式 | 说明 |
|------|------|------|
| 地形 | 程序化（噪声算法） | 山丘、平原、水面 |
| 水体 | Three.js Water | 反射+波浪效果 |
| 天空 | Three.js Sky | 渐变天空或天空盒 |
| 楼阁 | 程序化几何体 | 中式建筑基本结构 |
| 公园 | 程序化 | 树木、草地、小路 |
| 植物 | 程序化 | 低多边形树/灌木 |
| 建筑（卡通） | 程序化+圆角 | 儿童区建筑圆润可爱 |
| 2D区域 | Canvas 2D / CSS | 老残区用平面布局 |

---

## 五、配置系统

### 5.1 world.json 结构（管理员配置入口）
```json
{
  "version": "0.1",
  "global": {
    "siteName": "YNDSW",
    "language": "zh-CN",
    "backgroundColor": "#0a0e1a",
    "fogDensity": 0.02
  },
  "scenes": {
    "public": {
      "id": "public",
      "name": "公共区",
      "theme": "realistic",
      "type": "panorama",
      "hotspots": [
        { "id": "core", "name": "核心区", "position": [0, 0, 0], "target": "core-l1" },
        { "id": "market", "name": "市场", "position": [10, 0, 5], "target": "market-l2" }
      ],
      "environment": {
        "terrain": "mountains",
        "water": true,
        "sky": "day",
        "fog": true
      }
    }
  },
  "admin": {
    "enabled": true,
    "debug": true,
    "editMode": true,
    "showFPS": true
  }
}
```

### 5.2 开发期管理员功能
- 📐 调试面板：显示FPS、当前场景、相机位置
- ✏️ 编辑模式：拖拽调整热点位置，实时修改配置
- 🔧 场景切换器：快速跳转到任意场景
- 📝 配置热重载：修改JSON后自动刷新

---

## 六、开发阶段计划

### 第一阶段：核心骨架（当前）
- [ ] Three.js渲染引擎初始化
- [ ] 鼠标/触摸视角控制（拖拽旋转）
- [ ] 公共区L1场景：山水全景 + 天空
- [ ] 核心区楼阁（程序化生成）
- [ ] 热点系统：点击建筑切换场景
- [ ] 场景过渡动画（淡入淡出）
- [ ] UI：导航栏 + 返回按钮 + 小地图
- [ ] 场景配置系统（JSON驱动）
- [ ] 管理员调试面板

### 第二阶段：扩展区（成人区）
- [ ] 市场L2场景 + 内容系统
- [ ] 博物馆L2场景 + 展示系统
- [ ] 写字楼/办公区场景
- [ ] 公园场景（树木、小路、长椅）
- [ ] L3内容页面（Agent详情/文档）
- [ ] 搜索功能

### 第三阶段：儿童区
- [ ] 卡通渲染风格（圆润、鲜艳）
- [ ] 学校L2场景
- [ ] 图书馆L2场景
- [ ] 乐园L2场景 + 互动小游戏

### 第四阶段：老残区
- [ ] 2D简洁界面
- [ ] 活动广场
- [ ] 娱乐广场
- [ ] 老年大学
- [ ] 无障碍优化（大字/高对比/语音导航）

### 第五阶段：上线准备
- [ ] 权限系统（从管理员→逐步放权）
- [ ] 内容审核流程
- [ ] 性能优化（懒加载/LOD）
- [ ] 多语言支持
- [ ] SEO优化

---

## 七、性能目标

| 指标 | 目标 |
|------|------|
| 首屏加载 | < 3秒（含Three.js） |
| 场景切换 | < 1秒过渡 |
| 帧率 | 60fps（桌面）/ 30fps（移动） |
| 包体积 | < 2MB（不含内容数据） |
| 兼容 | Chrome 90+ / Safari 15+ / Firefox 90+ |

---

---

## 十五、3D 虚拟世界架构（补充）

### 15.1 整体架构图（文字版）

```
┌─────────────────────────────────────────────────────────────┐
│                    应用层（HTML + CSS 主题）                  │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────────────┐  │
│  │ theme-realistic │ │ theme-cartoon │ │   theme-simple     │  │
│  │   公共/成人区  │ │    儿童区     │ │     老残区          │  │
│  └──────────────┘ └──────────────┘ └──────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│                   场景管理层（SceneManager）                  │
│  场景加载 / 切换 / 缓存 / 过渡动画                              │
├─────────────────────────────────────────────────────────────┤
│                    世界构建层（WorldBuilder）                 │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  程序化地形  │  水体系统  │  植被系统  │  建筑系统  │ 天空 │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌─────────┐  │
│  │ SimplexNoise│ │ Three.js   │ │ Instanced  │ │ Sky/    │  │
│  │ 地形生成    │ │  Water     │ │Mesh树木    │ │ Skybox  │  │
│  └────────────┘ └────────────┘ └────────────┘ └─────────┘  │
├─────────────────────────────────────────────────────────────┤
│                    渲染层（Three.js r160）                   │
│  WebGLRenderer / ShaderMaterial / 后期处理                    │
├─────────────────────────────────────────────────────────────┤
│                    交互层（CameraController）                 │
│  OrbitControls（鼠标拖拽） + 触摸适配 + 射线检测               │
└─────────────────────────────────────────────────────────────┘
```

### 15.2 L1 公共区设计

#### 地形系统
- 使用 **SimplexNoise**（3D 连续噪声）生成高度图
- 山地参数：`amplitude=60, octaves=6, persistence=0.5, lacunarity=2.0`
- 平原参数：`amplitude=10, octaves=3`
- 地形网格：`PlaneGeometry(500, 500, 256, 256)`，CPU端计算顶点位移
- 纹理：根据高度分层（岩石/草地/雪地），通过 Shader 混合

#### 水体系统
- 使用 Three.js 内置 `Water` 类（平面反射 + 波浪折射）
- 水面参数：`textureWidth=512, waterNormals, sunDirection`
- 反射：`Mirror` 方式，限制反射面数量以节省性能
- 湖面位置：在山峦环抱的低洼处程序化放置

#### 植被系统
- **树木**：使用 `InstancedMesh`，单棵树三角面 < 500
  - 树干：`CylinderGeometry(0.3, 0.5, 4, 6)`
  - 树冠：两层 `ConeGeometry` 叠加，颜色 #2d5a27
- **草地**：使用 `InstancedMesh` + Billboard 公告板，密度可配置
- **灌木**：`SphereGeometry` 低多边形

#### 建筑系统（程序化）
- **楼阁**：程序化中式建筑
  - 基础：盒形主体 + 四角攒尖屋顶（`ExtrudeGeometry`）
  - 柱子：`CylinderGeometry` 环绕排列
  - 台阶：`BoxGeometry` 逐级堆叠
  - 颜色：朱红(#c0392b) + 金黄(#f39c12) + 黛青(#1a3a2a)
- **亭子**：六角攒尖亭，双层屋顶

#### 云朵系统
- 使用 **粒子系统**：`Points` + 自定义 Shader
- 云朵形状：球形分布的粒子群，半径 5-15 单位
- 动态效果：随时间缓慢飘移 + 轻微形变
- 参数：`particleCount=2000, size=8, opacity=0.7`

#### 粒子系统
- **萤火虫/蝴蝶**：季节性点缀，`PointsMaterial`
- **落叶**：秋季场景使用，随重力下落+水平漂移
- **雨/雪**：天气系统扩展，预留接口

### 15.3 L2 内部区域设计

#### 核心楼阁（Core Pavilion）
- **位置**：世界中心地标，高台基座
- **外观**：三层重檐楼阁，斗拱结构程序化生成
- **室内**：虚拟大厅，展示全局导航入口（热点卡片）
- **交互**：进入后显示 4 个象限入口（市场/博物馆/学校/广场）
- **特点**：发光金色轮廓线，夜间有灯笼光效

#### 市场大厅（Market Hall）
- **类型**：成人区 / 3D 写实
- **布局**：开放式商业街区，多栋小型建筑围合
- **内容**：Agent 商店 / Skill 商店 / 工具下载站
- **交互**：每栋建筑门口有悬浮标签，点击弹出内容面板
- **装饰**：灯笼、幌子、招幌（程序化生成 2D 精灵）

#### 博物馆（Museum）
- **类型**：成人区 / 3D 写实
- **布局**：长廊式展厅，两侧展柜
- **内容**：科技史展示 / AI 发展时间轴 / 作品陈列
- **交互**：长廊尽头大型屏幕，滚动展示内容
- **装饰**：聚光灯效果，展品有微光晕染

#### 未来学校（Future School）
- **类型**：儿童区 / 3D 卡通
- **布局**：圆形主楼 + 彩色附属教室
- **风格**：圆角几何体，明亮饱和色彩（红/黄/蓝/绿）
- **内容**：课程卡片墙、互动白板、学习乐园入口
- **交互**：卡片墙点击展开课程详情，语音解说

### 15.4 技术选型

| 类别 | 技术 | 版本 | 说明 |
|------|------|------|------|
| 3D 引擎 | Three.js | r160 | 本地打包，不依赖 CDN |
| 地形噪声 | SimplexNoise | 最新 | npm 引入，CPU 地形生成 |
| 渲染管线 | 自定义 WebGL | — | ShaderMaterial 精细控制 |
| 水体 | Three.js Water | 内置 | 平面反射 + 波浪 |
| 天空 | Three.js Sky | 内置 | 物理大气散射 |
| 粒子 | Three.js Points | 内置 | 配合自定义 Shader |
| 触摸交互 | Pointer Events | 原生 | 统一鼠标/触摸事件 |

**不引入的重量级依赖**：Physijs（物理引擎）、Ammo.js（刚体），仅在需要时通过简化的射线检测+速度模拟实现基本物理反馈。

### 15.5 性能优化策略

#### 自适应降级
```javascript
// 性能检测 + 降级策略
const qualityLevel = detectGPULevel(); // 'high' | 'medium' | 'low'
if (qualityLevel === 'low') {
  shadowMapSize = 512;   // 原 2048
  antialias = false;
  maxLights = 2;         // 原 4
  particleCount *= 0.3;
}
```

| 等级 | 目标设备 | 阴影 | 地形精度 | 实例数 |
|------|---------|------|---------|--------|
| High | 桌面独显 | 2048 | 256×256 | 5000+ |
| Medium | 笔记本 | 1024 | 128×128 | 2000 |
| Low | 手机 | 无 | 64×64 | 500 |

#### LOD（细节层次）
- 地形：远距离降低高度图采样率
- 树木：3 级 LOD（远距用 Billboard 公告板）
- 建筑：进入室内前用低模预览，切换时淡入高清模型

#### 实例化渲染（InstancedMesh）
- 所有重复元素（树、草、柱子）必须用 `InstancedMesh`
- 单个 Draw Call 渲染同类型所有实例
- 目标：场景总 Draw Call < 50（桌面）/ < 20（移动）

#### 其他优化
- **地形数据**：JSON 预计算（山峰坐标列表），避免运行时噪声计算
- **场景缓存**：`SceneManager` 缓存已加载场景，换回时直接恢复
- **帧率监控**：内置 FPS 显示（管理员模式），低于 20fps 自动提示降级
- **压缩纹理**：WebP 格式，提前压缩

### 15.6 交互设计

#### 视角控制
```javascript
// OrbitControls 配置
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;      // 惯性阻尼
controls.dampingFactor = 0.05;
controls.minDistance = 5;
controls.maxDistance = 200;
controls.maxPolarAngle = Math.PI * 0.85; // 防止穿地
controls.target.set(0, 10, 0);     // 默认注视中心点
```

#### 第一人称视角（可选扩展）
- 基础版使用 OrbitControls（第三人称绕点旋转）
- 未来可增加 FPS 模式：`camera.position.set(playerX, playerY, playerZ)`
- 碰撞检测：射线检测前方障碍物，防止穿墙

#### 射线检测（Raycasting）
```javascript
const raycaster = new Raycaster();
const mouse = new Vector2();

// 点击时检测
raycaster.setFromCamera(mouse, camera);
const intersects = raycaster.intersectObjects(scene.children, true);

// 命中热点对象时触发跳转
if (intersects.length > 0) {
  const hit = intersects[0].object;
  if (hit.userData.hotspotId) {
    navigateToScene(hit.userData.targetScene);
  }
}
```

#### 触摸适配
```javascript
// 统一鼠标/触摸事件
renderer.domElement.addEventListener('pointerdown', onPointerDown);
renderer.domElement.addEventListener('pointermove', onPointerMove);
renderer.domElement.addEventListener('pointerup', onPointerUp);

// 移动端：单指滑动=旋转，单指点击=进入
// 双指缩放：预留（通过 pinch 事件实现）
```

#### 触摸目标
- 热点碰撞体半径：移动端增大 20%，确保点击命中率
- UI 元素：`pointer-events: auto`，独立于 3D 场景
- 无障碍：大字体、高对比度模式切换，键盘导航支持


---

**文档状态**：设计阶段，待用户确认后开始第一阶段开发
