/**
 * plaza.js — 共享广场功能模块（需求文档§5.3）
 * 
 * 功能：搜索/发现/排行榜/社区/活动/推荐/登录入口
 * 设计原则：开放(零门槛) → 直观(一眼看懂) → 吸引(视觉震撼) → 快速(加载≤1秒)
 */

class Plaza {
  constructor(container) {
    this.container = container || document.body;
    this.isVisible = false;
    this.data = {
      hotAgents: [],
      newAgents: [],
      announcements: []
    };
    this.init();
  }

  init() {
    this.createStyles();
    this.createPlazaUI();
    this.loadMockData();
    console.log('[Plaza] 共享广场模块初始化完成');
  }

  createStyles() {
    if (document.getElementById('plaza-styles')) return;
    const style = document.createElement('style');
    style.id = 'plaza-styles';
    style.textContent = `
      .plaza-container {
        position: fixed;
        top: 0; left: 0;
        width: 100%; height: 100%;
        background: linear-gradient(135deg, rgba(15,23,42,0.97), rgba(30,41,59,0.95));
        backdrop-filter: blur(20px);
        z-index: 1000;
        display: none;
        overflow-y: auto;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }
      .plaza-container.visible { display: block; }
      .plaza-header {
        position: sticky;
        top: 0;
        background: rgba(15,23,42,0.9);
        backdrop-filter: blur(10px);
        border-bottom: 1px solid rgba(255,255,255,0.1);
        padding: 12px 24px;
        display: flex;
        align-items: center;
        gap: 20px;
        z-index: 10;
      }
      .plaza-logo {
        font-size: 24px;
        font-weight: 700;
        background: linear-gradient(135deg, #60a5fa, #a78bfa);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
      }
      .plaza-search {
        flex: 1;
        max-width: 500px;
        position: relative;
      }
      .plaza-search input {
        width: 100%;
        padding: 10px 16px 10px 40px;
        border-radius: 24px;
        border: 1px solid rgba(255,255,255,0.2);
        background: rgba(255,255,255,0.05);
        color: #fff;
        font-size: 14px;
        outline: none;
        transition: all 0.3s;
      }
      .plaza-search input:focus {
        border-color: #60a5fa;
        background: rgba(255,255,255,0.08);
      }
      .plaza-search::before {
        content: "🔍";
        position: absolute;
        left: 14px;
        top: 50%;
        transform: translateY(-50%);
        font-size: 16px;
      }
      .plaza-btn {
        padding: 8px 20px;
        border-radius: 20px;
        font-size: 14px;
        border: none;
        cursor: pointer;
        transition: all 0.2s;
      }
      .plaza-login-btn {
        background: linear-gradient(135deg, #3b82f6, #8b5cf6);
        color: #fff;
        font-weight: 500;
      }
      .plaza-login-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(59,130,246,0.4);
      }
      .plaza-close-btn {
        background: rgba(255,255,255,0.1);
        color: #fff;
      }
      .plaza-close-btn:hover { background: rgba(255,255,255,0.15); }
      .plaza-main {
        padding: 24px;
        max-width: 1400px;
        margin: 0 auto;
      }
      .plaza-welcome {
        background: linear-gradient(135deg, rgba(59,130,246,0.2), rgba(139,92,246,0.2));
        border-radius: 16px;
        padding: 32px;
        margin-bottom: 32px;
        text-align: center;
        border: 1px solid rgba(255,255,255,0.1);
      }
      .plaza-welcome h1 {
        font-size: 32px;
        margin: 0 0 12px;
        background: linear-gradient(135deg, #fff, #a5b4fc);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
      }
      .plaza-welcome p {
        color: rgba(255,255,255,0.7);
        margin: 0;
        font-size: 16px;
      }
      .plaza-section {
        margin-bottom: 32px;
      }
      .plaza-section-title {
        font-size: 20px;
        font-weight: 600;
        color: #fff;
        margin-bottom: 16px;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .plaza-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: 16px;
      }
      .agent-card {
        background: rgba(255,255,255,0.05);
        border-radius: 12px;
        padding: 16px;
        border: 1px solid rgba(255,255,255,0.1);
        transition: all 0.3s;
        cursor: pointer;
      }
      .agent-card:hover {
        transform: translateY(-4px);
        background: rgba(255,255,255,0.08);
        border-color: rgba(96,165,250,0.3);
      }
      .agent-card-header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 12px;
      }
      .agent-card-icon {
        width: 48px;
        height: 48px;
        border-radius: 12px;
        background: linear-gradient(135deg, #3b82f6, #8b5cf6);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
      }
      .agent-card-title {
        font-size: 16px;
        font-weight: 600;
        color: #fff;
        margin: 0 0 4px;
      }
      .agent-card-author {
        font-size: 12px;
        color: rgba(255,255,255,0.5);
      }
      .agent-card-desc {
        font-size: 13px;
        color: rgba(255,255,255,0.6);
        line-height: 1.5;
        margin-bottom: 12px;
      }
      .agent-card-stats {
        display: flex;
        gap: 16px;
        font-size: 12px;
        color: rgba(255,255,255,0.5);
      }
      .announcement-card {
        background: linear-gradient(135deg, rgba(251,191,36,0.1), rgba(245,158,11,0.05));
        border: 1px solid rgba(251,191,36,0.3);
        border-radius: 12px;
        padding: 16px;
        margin-bottom: 12px;
      }
      .announcement-badge {
        display: inline-block;
        padding: 4px 10px;
        border-radius: 12px;
        background: rgba(251,191,36,0.2);
        color: #fbbf24;
        font-size: 11px;
        font-weight: 600;
        margin-bottom: 8px;
      }
      .announcement-title {
        font-size: 15px;
        font-weight: 600;
        color: #fff;
        margin-bottom: 4px;
      }
      .announcement-desc {
        font-size: 13px;
        color: rgba(255,255,255,0.6);
      }
      .new-badge {
        color: #10b981;
        font-size: 11px;
        margin-left: 6px;
      }
      @media (max-width: 768px) {
        .plaza-header { flex-wrap: wrap; gap: 12px; }
        .plaza-search { order: 3; max-width: 100%; width: 100%; }
        .plaza-welcome h1 { font-size: 24px; }
        .plaza-grid { grid-template-columns: 1fr; }
      }
    `;
    document.head.appendChild(style);
  }

  createPlazaUI() {
    this.container = document.createElement('div');
    this.container.className = 'plaza-container';
    this.container.id = 'plaza-container';
    this.container.innerHTML = `
      <div class="plaza-header">
        <div class="plaza-logo">未来平台</div>
        <div class="plaza-search">
          <input type="text" placeholder="搜索 Agent、Skill、教程..." id="plaza-search-input">
        </div>
        <button class="plaza-btn plaza-login-btn" id="plaza-login-btn">登录 / 注册</button>
        <button class="plaza-btn plaza-close-btn" id="plaza-close-btn">返回</button>
      </div>
      <div class="plaza-main">
        <div class="plaza-welcome">
          <h1>🌐 欢迎来到未来平台</h1>
          <p>探索、发现、创造 — 一站式 AI Agent 管理与数字产品交易平台</p>
        </div>
        <div class="plaza-section">
          <h2 class="plaza-section-title"><span>🔥</span> 热门推荐</h2>
          <div class="plaza-grid" id="plaza-hot-grid"></div>
        </div>
        <div class="plaza-section">
          <h2 class="plaza-section-title"><span>✨</span> 最新发布</h2>
          <div class="plaza-grid" id="plaza-new-grid"></div>
        </div>
        <div class="plaza-section">
          <h2 class="plaza-section-title"><span>📢</span> 活动公告</h2>
          <div id="plaza-announcements"></div>
        </div>
        <div class="plaza-section">
          <h2 class="plaza-section-title"><span>🏆</span> 排行榜</h2>
          <div class="plaza-grid">
            <div class="agent-card" data-action="leaderboard-hot">
              <div class="agent-card-header">
                <div class="agent-card-icon">🔥</div>
                <div>
                  <h3 class="agent-card-title">热销榜</h3>
                  <p class="agent-card-author">最受欢迎的 Agent</p>
                </div>
              </div>
            </div>
            <div class="agent-card" data-action="leaderboard-rated">
              <div class="agent-card-header">
                <div class="agent-card-icon">⭐</div>
                <div>
                  <h3 class="agent-card-title">好评榜</h3>
                  <p class="agent-card-author">用户评分最高</p>
                </div>
              </div>
            </div>
            <div class="agent-card" data-action="leaderboard-trending">
              <div class="agent-card-header">
                <div class="agent-card-icon">📈</div>
                <div>
                  <h3 class="agent-card-title">热门趋势</h3>
                  <p class="agent-card-author">本周增长最快</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(this.container);
    this.bindEvents();
  }

  bindEvents() {
    document.getElementById('plaza-close-btn').addEventListener('click', () => this.hide());
    document.getElementById('plaza-login-btn').addEventListener('click', () => this.showLogin());
    document.getElementById('plaza-search-input').addEventListener('input', (e) => this.handleSearch(e.target.value));
    
    // 卡片点击
    this.container.querySelectorAll('.agent-card[data-action]').forEach(card => {
      card.addEventListener('click', () => {
        const action = card.dataset.action;
        if (action.startsWith('leaderboard-')) {
          this.showLeaderboard(action.replace('leaderboard-', ''));
        }
      });
    });
  }

  loadMockData() {
    this.data.hotAgents = [
      { id: 1, name: '智能写作助手', icon: '✍️', author: 'AI Labs', desc: '一键生成高质量文章，支持多种风格和语言', downloads: 12800, rating: 4.9 },
      { id: 2, name: '代码审查专家', icon: '🤖', author: 'DevTools', desc: '自动审查代码质量，发现潜在漏洞', downloads: 8500, rating: 4.8 },
      { id: 3, name: '数据分析大师', icon: '📊', author: 'DataGenius', desc: '一键生成可视化报告，洞察数据价值', downloads: 6200, rating: 4.7 },
      { id: 4, name: '翻译精灵', icon: '🌐', author: 'LangBot', desc: '支持100+语言实时翻译，保留原文风格', downloads: 15000, rating: 4.9 }
    ];
    this.data.newAgents = [
      { id: 5, name: '视频剪辑助手', icon: '🎬', author: 'MediaPro', desc: 'AI驱动的视频剪辑，一键生成精彩片段', downloads: 320, rating: 4.6, isNew: true },
      { id: 6, name: '财务分析师', icon: '💰', author: 'FinanceAI', desc: '智能分析财务报表，生成投资建议', downloads: 180, rating: 4.5, isNew: true },
      { id: 7, name: '健身教练', icon: '💪', author: 'FitBot', desc: '个性化健身计划，实时动作指导', downloads: 450, rating: 4.7, isNew: true }
    ];
    this.data.announcements = [
      { badge: '新功能', title: '五区之门3D场景上线', desc: '沉浸式第一人称体验，点击门进入各区' },
      { badge: '活动', title: '新用户注册送100 Token', desc: '限时活动，新用户注册即可获得100 Token体验额度' }
    ];
    this.renderAgents('plaza-hot-grid', this.data.hotAgents);
    this.renderAgents('plaza-new-grid', this.data.newAgents);
    this.renderAnnouncements();
  }

  renderAgents(containerId, agents) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = agents.map(a => `
      <div class="agent-card" data-agent-id="${a.id}">
        <div class="agent-card-header">
          <div class="agent-card-icon">${a.icon}</div>
          <div>
            <h3 class="agent-card-title">${a.name}${a.isNew ? '<span class="new-badge">NEW</span>' : ''}</h3>
            <p class="agent-card-author">by ${a.author}</p>
          </div>
        </div>
        <p class="agent-card-desc">${a.desc}</p>
        <div class="agent-card-stats">
          <span>📥 ${a.downloads.toLocaleString()}</span>
          <span>⭐ ${a.rating}</span>
        </div>
      </div>
    `).join('');
    
    container.querySelectorAll('.agent-card[data-agent-id]').forEach(card => {
      card.addEventListener('click', () => this.showAgentDetail(parseInt(card.dataset.agentId)));
    });
  }

  renderAnnouncements() {
    const container = document.getElementById('plaza-announcements');
    if (!container) return;
    container.innerHTML = this.data.announcements.map(a => `
      <div class="announcement-card">
        <span class="announcement-badge">${a.badge}</span>
        <h4 class="announcement-title">${a.title}</h4>
        <p class="announcement-desc">${a.desc}</p>
      </div>
    `).join('');
  }

  show() {
    this.isVisible = true;
    this.container.classList.add('visible');
  }

  hide() {
    this.isVisible = false;
    this.container.classList.remove('visible');
  }

  toggle() {
    this.isVisible ? this.hide() : this.show();
  }

  handleSearch(query) {
    if (!query || query.length < 2) return;
    console.log('[Plaza] 搜索:', query);
  }

  showAgentDetail(id) {
    console.log('[Plaza] 查看Agent详情:', id);
  }

  showLeaderboard(type) {
    console.log('[Plaza] 查看排行榜:', type);
  }

  showLogin() {
    console.log('[Plaza] 显示登录界面');
  }

  destroy() {
    this.container.remove();
    document.getElementById('plaza-styles')?.remove();
  }
}

window.Plaza = Plaza;
console.log('[Plaza] 共享广场模块加载完成');
