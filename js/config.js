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
      title: "智能中心",
      description: "平台核心功能导航，快速访问各个模块",
      icon: "🏛️",
      color: "var(--accent)",
      background: "linear-gradient(180deg, #1a2a3a 0%, #0d1820 100%)",
      sections: [
        { 
          id: "chat", 
          name: "智能对话", 
          title: "智能对话",
          icon: "🤖", 
          color: "#6366f1",
          description: "与AI助手自然交流，获取即时帮助",
          action: "panel",
          target: "#chat-panel" 
        },
        { 
          id: "tasks", 
          name: "任务管理", 
          title: "任务管理",
          icon: "📋", 
          color: "#8b5cf6",
          description: "创建、跟踪和管理您的任务清单",
          action: "panel",
          target: "#tasks-panel" 
        },
        { 
          id: "files", 
          name: "文件管理", 
          title: "文件管理",
          icon: "📁", 
          color: "#10b981",
          description: "存储、组织和分享您的文件",
          action: "panel",
          target: "#files-panel" 
        },
        { 
          id: "memory", 
          name: "记忆系统", 
          title: "记忆系统",
          icon: "🧠", 
          color: "#f59e0b",
          description: "查看和管理AI的记忆与学习历史",
          action: "panel",
          target: "#memory-panel" 
        },
        { 
          id: "skills", 
          name: "技能中心", 
          title: "技能中心",
          icon: "🛠️", 
          color: "#3b82f6",
          description: "浏览和安装扩展AI能力的技能包",
          action: "link",
          target: "/skills" 
        },
        { 
          id: "settings", 
          name: "系统设置", 
          title: "系统设置",
          icon: "⚙️", 
          color: "#6b7280",
          description: "配置系统参数和个性化选项",
          action: "panel",
          target: "#settings-panel" 
        }
      ]
    },

    // 市场大厅内部
    market: {
      name: "市场大厅",
      title: "市场大厅",
      description: "发现和获取优质的AI Agent、技能包与数字资源",
      icon: "🏪",
      color: "var(--accent2)",
      categories: [
        { 
          id: "agents", 
          name: "Agent市场", 
          icon: "🤖",
          title: "Agent市场",
          description: "发现并部署强大的AI Agent"
        },
        { 
          id: "skills", 
          name: "Skills市场", 
          icon: "🛠️",
          title: "Skills市场",
          description: "扩展Agent能力的技能包"
        },
        { 
          id: "templates", 
          name: "模板市场", 
          icon: "📝",
          title: "模板市场",
          description: "快速启动项目的专业模板"
        },
        { 
          id: "themes", 
          name: "主题市场", 
          icon: "🎨",
          title: "主题市场",
          description: "个性化你的数字空间"
        }
      ]
    },

    // 博物馆内部
    museum: {
      name: "博物馆",
      title: "数字博物馆",
      description: "探索YNDXW平台的发展历程、技术架构与创新应用",
      icon: "🏛️",
      color: "var(--accent3)",
      exhibits: [
        { 
          id: "history", 
          name: "平台历史展", 
          icon: "📜",
          title: "平台历史展",
          description: "探索YNDXW从概念到现实的演进历程"
        },
        { 
          id: "tech", 
          name: "技术架构展", 
          icon: "🏗️",
          title: "技术架构展",
          description: "深入了解支撑虚拟世界的底层技术"
        },
        { 
          id: "future", 
          name: "未来愿景展", 
          icon: "🔮",
          title: "未来愿景展",
          description: "展望YNDXW的未来发展方向"
        }
      ]
    },

    // 未来学校内部
    school: {
      name: "未来学校",
      title: "未来学校",
      description: "互动学习空间，提升您的AI应用能力",
      icon: "🎓",
      color: "var(--accent)",
      courses: [
        { 
          id: "vibe", 
          name: "Vibe Coding入门", 
          icon: "💡",
          title: "Vibe Coding入门",
          description: "掌握AI辅助编程的精髓，让代码自己写代码",
          level: "中级",
          duration: "6周",
          students: 1234
        },
        { 
          id: "agent", 
          name: "Agent开发实战", 
          icon: "🤖",
          title: "Agent开发实战",
          description: "从零开始构建智能Agent，掌握下一代人机交互",
          level: "高级",
          duration: "8周",
          students: 856
        },
        { 
          id: "deploy", 
          name: "部署与运维", 
          icon: "🚀",
          title: "部署与运维",
          description: "让您的AI应用稳定运行，服务百万用户",
          level: "中级",
          duration: "4周",
          students: 645
        }
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