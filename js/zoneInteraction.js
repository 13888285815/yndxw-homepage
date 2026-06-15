/**
 * zoneInteraction.js — 2D界面交互功能（需求文档§5.2.5）
 * 为各区域2D界面的功能模块卡片添加点击事件
 * 点击后显示该模块的详细列表（Agent/Skill/课程等）
 */

(function() {
  'use strict';

  /**
   * 模拟数据：成人区AI Agent列表
   */
  const adultAgents = [
    { name: '编程助手', desc: 'Python/JavaScript代码生成与调试', price: 10, rating: 4.8, icon: '💻' },
    { name: '设计大师', desc: 'UI/UX设计建议与素材生成', price: 15, rating: 4.9, icon: '🎨' },
    { name: '数据分析师', desc: 'Excel/CSV数据可视化分析', price: 20, rating: 4.7, icon: '📊' },
    { name: '文案策划', desc: '营销文案、广告语生成', price: 8, rating: 4.6, icon: '✍️' },
    { name: '翻译官', desc: '中英日韩多语言翻译', price: 5, rating: 4.8, icon: '🌐' },
  ];

  /**
   * 模拟数据：青少年区编程教育Agent列表
   */
  const teenAgents = [
    { name: 'Python入门', desc: '零基础Python编程入门', price: 0, rating: 4.9, icon: '🐍' },
    { name: 'JavaScript小游戏', desc: '用JS制作简单小游戏', price: 0, rating: 4.8, icon: '🎮' },
    { name: '数学辅导', desc: '中小学数学互动辅导', price: 0, rating: 4.7, icon: '📐' },
    { name: '英语学习', desc: 'AI对话练习英语口语', price: 0, rating: 4.6, icon: '🇬🇧' },
  ];

  /**
   * 显示Agent列表（纯前端交互，使用模拟数据）
   * @param {string} zoneId - 区域ID
   */
  function showAgentList(zoneId) {
    const overlay = document.getElementById('zone-2d-interface');
    if (!overlay) return;

    let agents = [];
    let zoneName = '';
    switch (zoneId) {
      case 'adult':
        agents = adultAgents;
        zoneName = '成人区';
        break;
      case 'teen':
        agents = teenAgents;
        zoneName = '青少年区';
        break;
      default:
        agents = adultAgents;
        zoneName = '未知区域';
    }

    let html = '<div class="zone-page" style="font-family: PingFang SC, sans-serif; padding: 20px;">';
    html += '<div style="display: flex; justify-content: space-between; align-items: center; padding: 15px 20px;">';
    html += '<div style="font-size: 28px; font-weight: 600;">🤖 ' + zoneName + ' · AI Agent 列表</div>';
    html += '<button onclick="window.location.reload()" style="padding: 10px 20px; border: none; border-radius: 8px; cursor: pointer; font-size: 16px; background: #4361ee; color: #fff;">← 返回</button>';
    html += '</div>';
    html += '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; padding: 20px;">';

    agents.forEach(agent => {
      html += '<div style="border-radius: 12px; padding: 20px; background: #fff; border: 1px solid #e0e0e0; transition: transform 0.2s, box-shadow 0.2s; cursor: pointer;" onmouseenter="this.style.transform=\'translateY(-2px)\'; this.style.boxShadow=\'0 8px 24px rgba(0,0,0,0.1)\';" onmouseleave="this.style.transform=\'none\'; this.style.boxShadow=\'none\';">';
      html += '<div style="font-size: 40px; margin-bottom: 10px;">' + agent.icon + '</div>';
      html += '<div style="font-size: 18px; font-weight: 600; margin-bottom: 8px;">' + agent.name + '</div>';
      html += '<div style="font-size: 14px; line-height: 1.5; color: #666;">' + agent.desc + '</div>';
      html += '<div style="margin-top: 10px; font-size: 14px;">';

      html += '<span style="color: #f72585; font-weight: 600;">💰 ' + agent.price + ' Token/次</span>';
      html += ' | <span style="color: #ffd700;">⭐ ' + agent.rating + '</span>';
      html += '</div>';
      html += '<button style="margin-top: 10px; padding: 8px 16px; background: #4361ee; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-size: 14px;">立即使用</button>';
      html += '</div>';
    });

    html += '</div></div>';
    overlay.innerHTML = html;
  }

  /**
   * 初始化2D界面交互（在页面加载完成后执行）
   */
  function initZoneInteraction() {
    console.log('[ZoneInteraction] 初始化2D界面交互...');

    // 监听自定义事件：2D界面已显示
    document.addEventListener('zone2d-shown', (e) => {
      const zoneId = e.detail.zoneId;
      const overlay = document.getElementById('zone-2d-interface');
      if (!overlay) return;

      // 为第一个功能模块卡片（AI Agent 市场）添加点击事件
      setTimeout(() => {
        const firstCard = overlay.querySelector('.module-card');
        if (firstCard) {
          firstCard.style.cursor = 'pointer';
          firstCard.addEventListener('click', () => {
            showAgentList(zoneId);
          });
          console.log('[ZoneInteraction] 已为AI Agent市场卡片添加点击事件');
        }
      }, 100);
    });

    console.log('[ZoneInteraction] 2D界面交互初始化完成');
  }

  // 导出全局函数
  window.showAgentList = showAgentList;

  // 页面加载完成后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initZoneInteraction);
  } else {
    initZoneInteraction();
  }
})();
