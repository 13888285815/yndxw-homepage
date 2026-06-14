/**
 * YNDXW 世界配置 - JSON驱动架构
 * 定义所有区域、建筑、内容
 */
const WORLD_CONFIG = {
  version: "1.0.0",
  author: "yndxw dev team",

  // ===== L1 公共区配置 =====
  L1: {
    name: "公共区",
    camera: { theta: Math.PI * 0.25, phi: Math.PI * 0.18, dist: 120 },
    center: { x: 0, y: 15, z: 0 },
    
    // 天空配置
    sky: {
      topColor: "#1a3a5c",
      midColor: "#4a90c2", 
      horizonColor: "#87CEEB",
      groundColor: "#f0d8a8"
    },

    // 地形配置
    terrain: {
      size: 500,
      segments: 200,
      noise: { freq1: 0.003, amp1: 40, freq2: 0.008, amp2: 20, freq3: 0.025, amp3: 6 }
    },

    // 水体配置
    water: {
      y: -2,
      color: 0x3388aa,
      opacity: 0.7
    },

    // 树木配置
    trees: {
      count: 80,
      minHeight: -3,
      maxHeight: 30
    },

    // 云朵配置
    clouds: {
      count: 15,
      heightMin: 80,
      heightMax: 140,
      speedMin: 0.1,
      speedMax: 0.4
    },

    // 建筑热点（L1可点击进入的建筑）
    buildings: [
      {
        id: "pavilion",
        name: "核心楼阁",
        nameEn: "Core Pavilion",
        position: { x: 0, z: 0 },
        type: "L2_entrance",  // 触发L2过渡
        target: "L2_core",
        description: "平台核心区域，导航中心"
      },
      {
        id: "market",
        name: "市场大厅",
        nameEn: "Market Hall", 
        position: { x: 80, z: 50 },
        type: "L2_entrance",
        target: "L2_market",
        description: "Agent/Skill交易市场"
      },
      {
        id: "museum",
        name: "博物馆",
        nameEn: "Museum",
        position: { x: -70, z: 60 },
        type: "L2_entrance",
        target: "L2_museum",
        description: "数字内容展示与展览"
      },
      {
        id: "school",
        name: "未来学校",
        nameEn: "Future School",
        position: { x: 60, z: -70 },
        type: "L2_entrance",
        target: "L2_school",
        description: "互动学习空间"
      }
    ]
  },

  // ===== L2 核心区配置 =====
  L2: {
    // 核心楼阁内部
    core: {
      name: "核心楼阁",
      background: "linear-gradient(180deg, #1a2a3a 0%, #0d1820 100%)",
      sections: [
        { id: "market", name: "市场", icon: "🏪", color: "#6366f1", target: "/market" },
        { id: "agents", name: "Agent", icon: "🤖", color: "#8b5cf6", target: "/agents" },
        { id: "skills", name: "Skills", icon: "🛠️", color: "#10b981", target: "/skills" },
        { id: "docs", name: "文档", icon: "📚", color: "#f59e0b", target: "/docs" },
        { id: "tools", name: "工具箱", icon: "🔧", color: "#3b82f6", target: "https://tools.yndxw.com" },
        { id: "vault", name: "核心区", icon: "🔐", color: "#ef4444", target: "/vault" }
      ]
    },

    // 市场大厅内部
    market: {
      name: "市场大厅",
      description: "浏览和购买Agent、Skill、数字产品",
      categories: [
        { id: "agents", name: "AI Agent", icon: "🤖" },
        { id: "skills", name: "Skills", icon: "🛠️" },
        { id: "templates", name: "模板", icon: "📝" },
        { id: "themes", name: "主题", icon: "🎨" }
      ]
    },

    // 博物馆内部
    museum: {
      name: "博物馆",
      description: "探索数字世界的历史与未来",
      exhibits: [
        { id: "history", name: "平台历史", icon: "📜" },
        { id: "tech", name: "技术架构", icon: "🏗️" },
        { id: "cases", name: "案例展示", icon: "🎯" }
      ]
    },

    // 未来学校内部
    school: {
      name: "未来学校",
      description: "互动学习，提升技能",
      courses: [
        { id: "vibe", name: "Vibe Coding", icon: "💡" },
        { id: "agent", name: "Agent开发", icon: "🤖" },
        { id: "deploy", name: "部署运维", icon: "🚀" }
      ]
    }
  },

  // ===== 主题配置 =====
  themes: {
    default: {
      primary: "#6366f1",
      secondary: "#8b5cf6",
      accent: "#10b981",
      background: "#0a0a1a",
      text: "#ffffff"
    },
    child: {
      primary: "#f472b6",
      secondary: "#fbbf24",
      accent: "#34d399",
      background: "#1a1a2e",
      text: "#fef3c7"
    },
    elder: {
      primary: "#60a5fa",
      secondary: "#a78bfa",
      accent: "#f472b6",
      background: "#1e1e2e",
      text: "#e0e7ff"
    }
  }
};