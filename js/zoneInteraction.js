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
    { name: '法律顾问', desc: '合同审查、法律咨询', price: 30, rating: 4.9, icon: '⚖️' },
    { name: '产品经理', desc: '需求分析、PRD撰写', price: 25, rating: 4.7, icon: '📋' },
    { name: '财务助理', desc: '报表生成、税务咨询', price: 18, rating: 4.6, icon: '💹' },
  ];

  /**
   * 模拟数据：成人区Skill列表
   */
  const adultSkills = [
    { name: '高级爬虫工具', desc: '支持反爬对抗，自动代理轮换', price: 50, rating: 4.8, icon: '🕷️' },
    { name: 'PDF转换器', desc: 'Word/Excel/图片转PDF，无水印', price: 20, rating: 4.9, icon: '📄' },
    { name: 'API调试器', desc: 'REST/GraphQL请求模拟，参数校验', price: 30, rating: 4.7, icon: '🔌' },
    { name: '代码对比器', desc: 'Diff算法，支持30+语言', price: 10, rating: 4.6, icon: '🔍' },
  ];

  /**
   * 模拟数据：青少年区编程课程列表
   */
  const teenCourses = [
    { name: 'Python入门', desc: '零基础Python编程入门，闯关式学习', price: 0, rating: 4.9, icon: '🐍' },
    { name: 'JavaScript小游戏', desc: '用JS制作贪吃蛇、俄罗斯方块', price: 0, rating: 4.8, icon: '🎮' },
    { name: 'Scratch创意编程', desc: '拖拽式编程，培养逻辑思维', price: 0, rating: 4.9, icon: '🧩' },
    { name: 'HTML/CSS网页制作', desc: '从零开始做自己的网站', price: 0, rating: 4.7, icon: '🌐' },
  ];

  /**
   * 模拟数据：儿童区故事列表
   */
  const childrenStories = [
    { name: '小红帽', desc: '经典格林童话，AI互动结局', icon: '🌲' },
    { name: '三只小猪', desc: '建造不同的房子，结果会怎样？', icon: '🏠' },
    { name: '冰雪奇缘', desc: '艾莎公主的冒险故事', icon: '❄️' },
    { name: '海底两万里', desc: '探索神秘的海底世界', icon: '🐋' },
  ];

  /**
   * 模拟数据：儿童区益智游戏列表
   */
  const childrenGames = [
    { name: '数学大冒险', desc: '加减乘除闯关，锻炼计算能力', icon: '🔢' },
    { name: '记忆翻翻乐', desc: '翻牌配对，训练记忆力', icon: '🧠' },
    { name: '拼图世界', desc: '各种难度拼图，训练观察力', icon: '🖼️' },
    { name: '拼音小课堂', desc: '趣味拼音学习，打好语文基础', icon: '📝' },
  ];

  /**
   * 模拟数据：老年区养生知识列表
   */
  const elderlyHealthTips = [
    { name: '春季养生指南', desc: '多吃蔬菜水果，少吃辛辣油腻，适当运动如散步、太极拳', icon: '🌿', price: 0 },
    { name: '高血压自我管理', desc: '限制盐分摄入，每天不超过6克，定时测量血压', icon: '🩸', price: 0 },
    { name: '糖尿病饮食调理', desc: '控制碳水化合物摄入，少食多餐，定时定量', icon: '💉', price: 0 },
    { name: '睡眠健康指南', desc: '保持规律作息，每晚7-8小时睡眠', icon: '😴', price: 0 },
    { name: '骨骼保健知识', desc: '适量补钙，多晒太阳，预防骨质疏松', icon: '🦴', price: 0 },
    { name: '心理健康维护', desc: '保持乐观心态，多与家人朋友交流', icon: '🧘', price: 0 },
  ];

  /**
   * 模拟数据：老年区社区互助列表
   */
  const elderlyCommunityHelps = [
    { name: '李大爷', desc: '陪聊散步 · 500米内 · 每周一三可约', icon: '👴', price: 0 },
    { name: '王阿姨', desc: '代购代办 · 800米内 · 随时可约', icon: '👵', price: 0 },
    { name: '张师傅', desc: '家电维修 · 1.2千米内 · 提前预约', icon: '🔧', price: 0 },
  ];

  /**
   * 模拟数据：残障区无障碍设置列表
   */
  const accessibilitySettings = [
    { name: '高对比度模式', desc: '增强文字与背景对比度，方便视力不佳用户', icon: '👁️', price: 0 },
    { name: '大字体显示', desc: '字体放大至24px-36px可调', icon: '🔤', price: 0 },
    { name: '语音朗读', desc: '自动朗读页面内容', icon: '🔊', price: 0 },
    { name: '键盘导航', desc: '支持Tab/Enter等键盘操作', icon: '⌨️', price: 0 },
  ];

  /**
   * 通用的列表展示函数
   */
  function showList(zoneId, moduleType) {
    const overlay = document.getElementById('zone-2d-interface');
    if (!overlay) return;

    let items = [];
    let title = '';
    let theme = {};

    switch(zoneId) {
      case 'adult':
        if (moduleType === 'agent') { items = adultAgents; title = '🌆 成人区 · AI Agent 市场'; theme = adultTheme; }
        else if (moduleType === 'skill') { items = adultSkills; title = '🌆 成人区 · Skill 交易市场'; theme = adultTheme; }
        break;
      case 'teen':
        items = teenCourses; title = '🎒 青少年区 · 编程课程'; theme = teenTheme;
        break;
      case 'children':
        if (moduleType === 'story') { items = childrenStories; title = '🧸 儿童区 · 互动故事'; theme = childrenTheme; }
        else if (moduleType === 'game') { items = childrenGames; title = '🧸 儿童区 · 益智游戏'; theme = childrenTheme; }
        break;
      case 'elderly':
        if (moduleType === 'health') { items = elderlyHealthTips; title = '🏯 老年区 · 养生知识'; theme = elderlyTheme; }
        else if (moduleType === 'community') { items = elderlyCommunityHelps; title = '🏯 老年区 · 社区互助'; theme = elderlyTheme; }
        break;
      case 'accessible':
        if (moduleType === 'settings') { items = accessibilitySettings; title = '♿ 残障区 · 无障碍设置'; theme = accessibleTheme; }
        break;
    }

    const grid = overlay.querySelector('.module-grid');
    if (!grid) return;

    const listHTML = `
      <div class="list-page" style="padding:20px">
        <div style="display:flex;justify-content:space-between;align-items:center;padding:15px 20px;background:${theme.headerBg};border-radius:12px 12px 0 0">
          <div style="font-size:26px;font-weight:600">${title}</div>
          <button onclick="window.location.reload()" style="padding:10px 20px;border:none;border-radius:8px;background:${theme.btnBg};color:#fff;font-size:16px;cursor:pointer">← 返回</button>
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px;padding:20px">
          ${items.map(item => `
            <div style="border-radius:12px;padding:20px;background:${theme.cardBg};border:1px solid ${theme.cardBorder};transition:transform 0.2s,box-shadow 0.2s;cursor:pointer"
                 onmouseenter="this.style.transform='translateY(-3px)';this.style.boxShadow='0 12px 30px rgba(0,0,0,0.15)'"
                 onmouseleave="this.style.transform='none';this.style.boxShadow='none'">
              <div style="font-size:40px;margin-bottom:10px">${item.icon || '📦'}</div>
              <div style="font-size:18px;font-weight:600;margin-bottom:8px;color:${theme.nameColor}">${item.name}</div>
              <div style="font-size:14px;line-height:1.5;color:${theme.descColor}">${item.desc}</div>
              ${item.price !== undefined ? `
                <div style="margin-top:10px;display:flex;justify-content:space-between;align-items:center">
                  <span style="color:#f72585;font-weight:600">💰 ${item.price} Token${item.price === 0 ? '（免费）' : '/次'}</span>
                  ${item.rating ? `<span style="color:#ffd700">⭐ ${item.rating}</span>` : ''}
                </div>
              ` : ''}
              <button onclick="alert('即将跳转到使用页面')" style="margin-top:12px;width:100%;padding:10px;background:${theme.btnBg};color:#fff;border:none;border-radius:8px;font-size:15px;cursor:pointer">${item.price === 0 ? '免费使用' : '立即购买'}</button>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    overlay.innerHTML = listHTML;
  }

  /**
   * 主题配置
   */
  const adultTheme = {
    headerBg: 'rgba(67,97,238,0.3)',
    btnBg: '#4361ee',
    cardBg: 'rgba(255,255,255,0.08)',
    cardBorder: 'rgba(67,97,238,0.3)',
    nameColor: '#4cc9f0',
    descColor: 'rgba(255,255,255,0.7)',
  };

  const teenTheme = {
    headerBg: 'rgba(33,150,243,0.1)',
    btnBg: '#2196F3',
    cardBg: '#fff',
    cardBorder: '#E3F2FD',
    nameColor: '#1976D2',
    descColor: '#666',
  };

  const childrenTheme = {
    headerBg: 'rgba(255,64,129,0.1)',
    btnBg: '#FF4081',
    cardBg: '#fff',
    cardBorder: '#FF4081',
    nameColor: '#FF4081',
    descColor: '#666',
  };

  const elderlyTheme = {
    headerBg: 'rgba(141,110,99,0.2)',
    btnBg: '#8D6E63',
    cardBg: '#FFF8E1',
    cardBorder: '#FFB74D',
    nameColor: '#5D4037',
    descColor: '#666',
  };

  const accessibleTheme = {
    headerBg: 'rgba(255,99,71,0.2)',
    btnBg: '#FF6347',
    cardBg: '#fff',
    cardBorder: '#000',
    nameColor: '#000',
    descColor: '#333',
  };

  /**
   * 为2D界面的所有模块卡片绑定点击事件
   */
  function bindModuleCardEvents(zoneId) {
    const overlay = document.getElementById('zone-2d-interface');
    if (!overlay) return;

    const cards = overlay.querySelectorAll('.module-card');
    console.log(`[ZoneInteraction] 发现${cards.length}个模块卡片`);

    cards.forEach(card => {
      const icon = card.querySelector('.module-icon');
      if (!icon) return;
      const iconText = icon.textContent.trim();

      let handler = null;

      switch(zoneId) {
        case 'adult':
          if (iconText === '🤖') handler = () => showList(zoneId, 'agent');
          else if (iconText === '🔧') handler = () => showList(zoneId, 'skill');
          else if (iconText === '💰') handler = () => showTokenPurchase(overlay);
          else if (iconText === '📦') handler = () => showRepo(overlay);
          else if (iconText === '📊') handler = () => showAnalytics(overlay);
          else if (iconText === '🎯') handler = () => showCollab(overlay);
          break;
        case 'teen':
          if (iconText === '💻' || iconText === '📐' || iconText === '🎨') handler = () => showList(zoneId, 'course');
          else if (iconText === '📈') handler = () => showLearningProgress(overlay);
          else if (iconText === '👨‍👩‍👧') handler = () => showParentPanel(overlay);
          break;
        case 'children':
          if (iconText === '📖') handler = () => showList(zoneId, 'story');
          else if (iconText === '🧩') handler = () => showList(zoneId, 'game');
          else if (iconText === '🚦') handler = () => showSafetyQuiz(overlay);
          else if (iconText === '👨‍👩‍👧') handler = () => showParentMonitor(overlay);
          break;
        case 'elderly':
          if (iconText === '🎤') handler = () => initVoiceAssistant(overlay);
          else if (iconText === '❤️') handler = () => showHealthMonitor(overlay);
          else if (iconText === '🆘') handler = () => showEmergencyCall(overlay);
          else if (iconText === '🤝') handler = () => showList(zoneId, 'community');
          else if (iconText === '🌿') handler = () => showList(zoneId, 'health');
          break;
        case 'accessible':
          if (iconText === '🔊' || iconText === '🎙️') handler = () => showVoiceControl(overlay);
          else if (iconText === '🎨') handler = () => showAccessibilitySettings(overlay);
          else if (iconText === '👁️') handler = () => showHighContrastMode(overlay);
          else if (iconText === '⌨️') handler = () => showKeyboardNav(overlay);
          else if (iconText === '⚙️') handler = () => showList(zoneId, 'settings');
          break;
      }

      if (handler) {
        card.style.cursor = 'pointer';
        card.addEventListener('click', handler);
        // 键盘可访问
        card.setAttribute('tabindex', '0');
        card.addEventListener('keydown', e => {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handler(); }
        });
      }
    });

    // 初始化老年区的ZonePanels（语音助手需要）
    if (zoneId === 'elderly' && window.ZonePanels) {
      const zp = new window.ZonePanels();
      zp.initVoiceAssistant(overlay);
    }

    // 残障区初始化无障碍设置
    if (zoneId === 'accessible' && window.ZonePanels) {
      const zp = new window.ZonePanels();
      zp.showAccessibilitySettings(overlay);
    }

    console.log(`[ZoneInteraction] ${zoneId}卡片事件绑定完成`);
  }

  // ── 各区域专用面板 ──

  function showTokenPurchase(overlay) {
    const grid = overlay.querySelector('.module-grid');
    if (!grid) return;
    const html = `
      <div style="padding:20px;background:rgba(26,26,46,0.95);min-height:100vh">
        <div style="display:flex;justify-content:space-between;align-items:center;padding:15px 20px;background:rgba(67,97,238,0.3);border-radius:12px">
          <div style="font-size:26px;font-weight:600">💰 Token 购买中心</div>
          <button onclick="window.location.reload()" style="padding:10px 20px;border:none;border-radius:8px;background:#4361ee;color:#fff;cursor:pointer">← 返回</button>
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:20px;padding:20px;margin-top:10px">
          ${[
            {amount:100,price:10,bonus:0},{amount:500,price:50,bonus:50},
            {amount:1000,price:100,bonus:150},{amount:5000,price:500,bonus:1000}
          ].map(p => `
            <div style="background:rgba(255,255,255,0.08);border:1px solid rgba(67,97,238,0.3);border-radius:16px;padding:24px;text-align:center">
              <div style="font-size:48px">💎</div>
              <div style="font-size:32px;font-weight:700;color:#4cc9f0;margin:10px 0">${p.amount} Token</div>
              <div style="color:rgba(255,255,255,0.5);margin-bottom:10px">售价 ¥${p.price}</div>
              ${p.bonus ? `<div style="color:#4CAF50;font-size:14px;margin-bottom:15px">🎁 赠送 ${p.bonus} Token</div>` : '<div style="margin-bottom:15px"></div>'}
              <button style="width:100%;padding:14px;background:linear-gradient(135deg,#4361ee,#7b2ff7);color:#fff;border:none;border-radius:10px;font-size:16px;cursor:pointer">立即购买</button>
            </div>
          `).join('')}
        </div>
      </div>
    `;
    overlay.innerHTML = html;
  }

  function showRepo(overlay) {
    const repos = [
      {name:'智能爬虫工具',lang:'Python',stars:328,desc:'支持反爬对抗的通用爬虫框架'},
      {name:'Vue3组件库',lang:'Vue',stars:256,desc:'企业级Vue3组件库，含50+组件'},
      {name:'算法可视化',lang:'JavaScript',stars:189,desc:'常用算法的动态可视化演示'},
    ];
    const grid = overlay.querySelector('.module-grid');
    if (!grid) return;
    grid.insertAdjacentHTML('beforebegin', `
      <div style="padding:20px 0">
        <div style="font-size:24px;font-weight:600;margin-bottom:15px;color:#4cc9f0">📦 个人仓库</div>
        ${repos.map(r => `
          <div style="background:rgba(255,255,255,0.08);border-radius:12px;padding:20px;margin-bottom:12px;display:flex;justify-content:space-between;align-items:center">
            <div>
              <div style="font-size:18px;font-weight:600;color:#fff">${r.name}</div>
              <div style="font-size:14px;color:rgba(255,255,255,0.5);margin-top:4px">${r.desc}</div>
              <span style="font-size:12px;background:rgba(76,201,240,0.2);color:#4cc9f0;padding:2px 8px;border-radius:4px;margin-top:6px;display:inline-block">${r.lang}</span>
            </div>
            <div style="color:#ffd700;font-size:16px">⭐ ${r.stars}</div>
          </div>
        `).join('')}
      </div>
    `);
  }

  function showAnalytics(overlay) {
    const grid = overlay.querySelector('.module-grid');
    if (!grid) return;
    grid.insertAdjacentHTML('beforebegin', `
      <div style="padding:20px 0">
        <div style="font-size:24px;font-weight:600;margin-bottom:15px;color:#4cc9f0">📊 数据分析面板</div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:15px;margin-bottom:20px">
          ${[['今日活跃','3,421','#4cc9f0'],['Token消耗','128','#f72585'],['API调用','10.2K','#4CAF50']].map(m => `
            <div style="background:rgba(255,255,255,0.08);border-radius:12px;padding:20px;text-align:center">
              <div style="font-size:12px;color:rgba(255,255,255,0.5)">${m[0]}</div>
              <div style="font-size:28px;font-weight:700;color:${m[2]};margin-top:5px">${m[1]}</div>
            </div>
          `).join('')}
        </div>
        <div style="background:rgba(255,255,255,0.05);border-radius:12px;padding:20px;color:rgba(255,255,255,0.4);font-size:14px;text-align:center">
          📈 近7天趋势图（数据可视化区域）
        </div>
      </div>
    `);
  }

  function showCollab(overlay) {
    const grid = overlay.querySelector('.module-grid');
    if (!grid) return;
    grid.insertAdjacentHTML('beforebegin', `
      <div style="padding:20px 0;text-align:center">
        <div style="font-size:80px;margin-bottom:15px">🎯</div>
        <div style="font-size:24px;font-weight:600;color:#4cc9f0;margin-bottom:10px">实时协作空间</div>
        <div style="color:rgba(255,255,255,0.5);margin-bottom:20px">WebSocket多人实时协作、视频处理</div>
        <button style="padding:15px 40px;background:linear-gradient(135deg,#4361ee,#7b2ff7);color:#fff;border:none;border-radius:12px;font-size:18px;cursor:pointer">创建协作房间</button>
      </div>
    `);
  }

  function showLearningProgress(overlay) {
    const grid = overlay.querySelector('.module-grid');
    if (!grid) return;
    grid.insertAdjacentHTML('beforebegin', `
      <div style="padding:20px 0">
        <div style="font-size:24px;font-weight:600;margin-bottom:20px;color:#1976D2">📈 学习进度跟踪</div>
        ${[{name:'Python入门',progress:75,color:'#2196F3'},{name:'JavaScript基础',progress:60,color:'#FF9800'},{name:'算法与数据结构',progress:35,color:'#9C27B0'}].map(s => `
          <div style="margin-bottom:16px">
            <div style="display:flex;justify-content:space-between;margin-bottom:8px;font-size:16px">
              <span style="color:#333">${s.name}</span><span style="color:${s.color};font-weight:600">${s.progress}%</span>
            </div>
            <div style="height:10px;background:#E3F2FD;border-radius:5px;overflow:hidden">
              <div style="width:${s.progress}%;height:100%;background:${s.color};border-radius:5px"></div>
            </div>
          </div>
        `).join('')}
        <div style="background:#fff;padding:20px;border-radius:12px;margin-top:20px;text-align:center">
          <div style="font-size:48px">🎯</div>
          <div style="font-size:20px;font-weight:600;color:#1976D2">本周学习 12 小时</div>
          <div style="color:#666;font-size:14px;margin-top:5px">超过 85% 的同学</div>
        </div>
      </div>
    `);
  }

  function showParentPanel(overlay) {
    const grid = overlay.querySelector('.module-grid');
    if (!grid) return;
    grid.insertAdjacentHTML('beforebegin', `
      <div style="padding:20px 0;text-align:center">
        <div style="font-size:64px;margin-bottom:15px">👨‍👩‍👧</div>
        <div style="font-size:24px;font-weight:600;color:#1976D2;margin-bottom:10px">家长监控面板</div>
        <div style="color:#666;margin-bottom:20px">绑定家长账号后，可监控学习时长和内容</div>
        <button style="padding:14px 30px;background:#2196F3;color:#fff;border:none;border-radius:10px;font-size:16px;cursor:pointer">绑定家长账号</button>
      </div>
    `);
  }

  function showParentMonitor(overlay) {
    const grid = overlay.querySelector('.module-grid');
    if (!grid) return;
    grid.insertAdjacentHTML('beforebegin', `
      <div style="padding:20px 0;text-align:center">
        <div style="font-size:64px;margin-bottom:15px">👨‍👩‍👧</div>
        <div style="font-size:24px;font-weight:600;color:#FF4081;margin-bottom:10px">家长监控</div>
        <div style="background:#fff;border:2px solid #FF4081;border-radius:12px;padding:20px;margin-top:10px">
          <div style="font-size:16px;color:#333;margin-bottom:10px">今日使用时长：<strong>45分钟</strong> / 60分钟</div>
          <div style="height:8px;background:#f5f5f5;border-radius:4px;overflow:hidden">
            <div style="width:75%;height:100%;background:#FF4081"></div>
          </div>
          <div style="margin-top:15px;font-size:14px;color:#4CAF50">✅ 内容安全，无异常</div>
        </div>
      </div>
    `);
  }

  function showSafetyQuiz(overlay) {
    const questions = [
      {q:'过马路时应该怎么做？',opts:['随便跑','走人行道看红绿灯','追逐打闹'],correct:1},
      {q:'遇到陌生人给你糖果怎么办？',opts:['接受','拒绝并告诉家长','和陌生人走'],correct:1},
      {q:'着火时应该怎么做？',opts:['躲起来','拨打119并逃离','乘电梯'],correct:1},
      {q:'一个人在家有陌生人敲门怎么办？',opts:['开门','假装不在家','打电话给爸爸妈妈'],correct:1},
    ];
    let current = 0, score = 0;
    const grid = overlay.querySelector('.module-grid');
    if (!grid) return;
    const showQ = () => {
      if (current >= questions.length) {
        grid.innerHTML = `
          <div style="text-align:center;padding:40px">
            <div style="font-size:80px">${score >= 3 ? '🏆' : '📚'}</div>
            <h2 style="font-size:28px;color:#FF4081;margin:15px 0">答题完成！得分：${score}/${questions.length}</h2>
            <button onclick="window.location.reload()" style="padding:15px 30px;background:#FF4081;color:#fff;border:none;border-radius:20px;font-size:18px;cursor:pointer;margin-top:10px">再玩一次</button>
          </div>
        `;
        return;
      }
      const q = questions[current];
      grid.innerHTML = `
        <div style="padding:20px">
          <div style="font-size:16px;color:rgba(255,255,255,0.6);margin-bottom:10px">第 ${current+1} / ${questions.length} 题</div>
          <h2 style="font-size:26px;color:#fff;margin:0 0 25px">🚦 ${q.q}</h2>
          <div style="display:flex;flex-direction:column;gap:12px">
            ${q.opts.map((opt,i) => `
              <button class="quiz-btn" data-idx="${i}" data-correct="${q.correct}" style="
                padding:16px;font-size:20px;background:rgba(255,255,255,0.1);color:#fff;
                border:2px solid rgba(255,255,255,0.2);border-radius:14px;cursor:pointer;text-align:left;
              ">${opt}</button>
            `).join('')}
          </div>
        </div>
      `;
      grid.querySelectorAll('.quiz-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const idx = parseInt(btn.dataset.idx);
          const correct = parseInt(btn.dataset.correct);
          if (idx === correct) { score++; btn.style.background='#4CAF50'; btn.style.borderColor='#4CAF50'; }
          else { btn.style.background='#f44336'; btn.style.borderColor='#f44336'; }
          setTimeout(() => { current++; showQ(); }, 800);
        });
      });
    };
    showQ();
  }

  function initVoiceAssistant(container) {
    const grid = container.querySelector('.module-grid');
    if (!grid) return;
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      const sr = new SR();
      sr.lang = 'zh-CN';
      sr.continuous = false;
      sr.interimResults = true;
      let btn;
      grid.insertAdjacentHTML('beforebegin', `
        <div style="text-align:center;padding:20px">
          <button id="voice-btn" style="width:100px;height:100px;border-radius:50%;background:linear-gradient(135deg,#4CAF50,#8BC34A);border:none;font-size:48px;cursor:pointer;box-shadow:0 4px 20px rgba(76,175,80,0.4)">🎤</button>
          <div style="margin-top:10px;color:rgba(255,255,255,0.6)">点击说话，或直接说出指令</div>
          <div id="voice-result" style="margin-top:15px;padding:15px;background:rgba(255,255,255,0.1);border-radius:10px;font-size:18px;min-height:50px;color:#fff"></div>
        </div>
      `);
      btn = document.getElementById('voice-btn');
      const result = document.getElementById('voice-result');
      btn.addEventListener('click', () => {
        sr.start();
        btn.textContent = '🔴';
        btn.style.background = 'linear-gradient(135deg,#f44336,#e57373)';
      });
      sr.onresult = e => {
        const t = e.results[0][0].transcript;
        result.textContent = '您说：' + t;
        btn.textContent = '🎤';
        btn.style.background = 'linear-gradient(135deg,#4CAF50,#8BC34A)';
        if (t.includes('回去') || t.includes('返回')) window.app3d.returnToMainScene();
        else if (t.includes('紧急')) alert('紧急呼叫中...');
        else if (t.includes('健康')) alert('健康监测功能');
      };
      sr.onend = () => {
        btn.textContent = '🎤';
        btn.style.background = 'linear-gradient(135deg,#4CAF50,#8BC34A)';
      };
      sr.onerror = () => {
        btn.textContent = '🎤';
        btn.style.background = 'linear-gradient(135deg,#4CAF50,#8BC34A)';
      };
    }
    console.log('[ZoneInteraction] 老年区语音助手初始化');
  }

  function showHealthMonitor(overlay) {
    const grid = overlay.querySelector('.module-grid');
    if (!grid) return;
    grid.insertAdjacentHTML('beforebegin', `
      <div style="padding:20px 0">
        <div style="font-size:24px;font-weight:600;margin-bottom:20px;color:#8D6E63">❤️ 健康监测</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:15px">
          ${[['血压','120/80 mmHg','✅ 正常'],['血糖','5.6 mmol/L','✅ 正常'],['心率','72 bpm','✅ 正常'],['睡眠','7.5h','✅ 良好']].map(m => `
            <div style="background:#fff;border:2px solid #FFB74D;border-radius:12px;padding:20px;text-align:center">
              <div style="font-size:32px;margin-bottom:8px">${m[0]==='血压'?'🩸':m[0]==='血糖'?'💉':m[0]==='心率'?'💓':'😴'}</div>
              <div style="font-size:20px;font-weight:600;color:#333">${m[0]}</div>
              <div style="font-size:24px;font-weight:700;color:#8D6E63;margin:5px 0">${m[1]}</div>
              <div style="font-size:14px;color:#4CAF50">${m[2]}</div>
            </div>
          `).join('')}
        </div>
      </div>
    `);
  }

  function showEmergencyCall(overlay) {
    const modal = document.createElement('div');
    modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.8);display:flex;align-items:center;justify-content:center;z-index:2000';
    modal.innerHTML = `
      <div style="background:#fff;border-radius:20px;padding:40px;text-align:center;max-width:400px;font-size:20px">
        <div style="font-size:80px;margin-bottom:20px">🆘</div>
        <h2 style="font-size:32px;color:#d32f2f;margin:0 0 20px">紧急呼叫</h2>
        <p style="color:#333;line-height:1.8;margin-bottom:20px">请选择呼叫对象：</p>
        <button onclick="alert('正在拨打 120...')" style="display:block;width:100%;padding:18px;margin:10px 0;font-size:22px;background:#d32f2f;color:#fff;border:none;border-radius:10px;cursor:pointer">📞 拨打120急救</button>
        <button onclick="alert('正在联系家人...')" style="display:block;width:100%;padding:18px;margin:10px 0;font-size:22px;background:#4CAF50;color:#fff;border:none;border-radius:10px;cursor:pointer">👨‍👩‍👧 联系家人</button>
        <button onclick="this.closest('[style]').remove()" style="display:block;width:100%;padding:15px;margin:10px 0;font-size:18px;background:#eee;color:#333;border:none;border-radius:10px;cursor:pointer">取消</button>
      </div>
    `;
    document.body.appendChild(modal);
  }

  function showCommunityHelp(overlay) {
    const grid = overlay.querySelector('.module-grid');
    if (!grid) return;
    const helps = [
      {name:'李大爷',skill:'陪聊散步',time:'每周一、三',dist:'500m'},
      {name:'王阿姨',skill:'代购代办',time:'随时可约',dist:'800m'},
      {name:'张师傅',skill:'家电维修',time:'提前预约',dist:'1.2km'},
    ];
    grid.insertAdjacentHTML('beforebegin', `
      <div style="padding:20px 0">
        <div style="font-size:24px;font-weight:600;margin-bottom:15px;color:#8D6E63">🤝 社区互助</div>
        ${helps.map(h => `
          <div style="background:#fff;border:2px solid #FFB74D;border-radius:12px;padding:20px;margin-bottom:12px;display:flex;justify-content:space-between;align-items:center">
            <div>
              <div style="font-size:20px;font-weight:600;color:#333">${h.name}</div>
              <div style="font-size:16px;color:#666;margin-top:4px">${h.skill} · ${h.time}</div>
            </div>
            <div style="color:#8D6E63;font-size:14px">距${h.dist}</div>
          </div>
        `).join('')}
      </div>
    `);
  }

  function showHealthKnowledge(overlay) {
    const grid = overlay.querySelector('.module-grid');
    if (!grid) return;
    const tips = [
      {title:'春季养生',content:'多吃蔬菜水果，少吃辛辣油腻。适当运动，如散步、太极拳。'},
      {title:'高血压注意事项',content:'限制盐分摄入，每天不超过6克。定时测量血压，按时服药。'},
      {title:'睡眠健康',content:'保持规律作息，每晚7-8小时睡眠。睡前避免使用电子设备。'},
    ];
    grid.insertAdjacentHTML('beforebegin', `
      <div style="padding:20px 0">
        <div style="font-size:24px;font-weight:600;margin-bottom:15px;color:#8D6E63">🌿 养生知识</div>
        ${tips.map(t => `
          <div style="background:#fff;border:2px solid #FFB74D;border-radius:12px;padding:20px;margin-bottom:12px">
            <div style="font-size:20px;font-weight:600;color:#8D6E63;margin-bottom:8px">${t.title}</div>
            <div style="font-size:16px;line-height:1.8;color:#333">${t.content}</div>
          </div>
        `).join('')}
      </div>
    `);
  }

  function showVoiceControl(overlay) {
    const grid = overlay.querySelector('.module-grid');
    if (!grid) return;
    const commands = [
      {cmd:'返回',action:'window.app3d.returnToMainScene()'},
      {cmd:'帮助',action:'alert("可用指令：返回、帮助、返回主页")'},
      {cmd:'上一页',action:'history.back()'},
    ];
    grid.insertAdjacentHTML('beforebegin', `
      <div style="padding:20px 0;text-align:center">
        <div style="font-size:64px;margin-bottom:15px">🎙️</div>
        <div style="font-size:20px;color:#333;margin-bottom:20px">语音控制已开启</div>
        <div style="text-align:left;background:rgba(0,0,0,0.05);border-radius:12px;padding:20px">
          <div style="font-size:16px;color:#666;margin-bottom:10px">可用语音指令：</div>
          ${commands.map(c => `<div style="padding:8px 0;border-bottom:1px solid rgba(0,0,0,0.1);color:#333">🎤 "${c.cmd}"</div>`).join('')}
        </div>
        <button onclick="alert('请在麦克风权限授权后使用语音控制')" style="margin-top:20px;padding:14px 30px;background:#FF6347;color:#fff;border:3px solid #000;border-radius:10px;font-size:18px;cursor:pointer">🎤 开始语音控制</button>
      </div>
    `);
  }

  function showHighContrastMode(overlay) {
    const grid = overlay.querySelector('.module-grid');
    if (!grid) return;
    grid.insertAdjacentHTML('beforebegin', `
      <div style="padding:20px 0">
        <div style="font-size:24px;font-weight:700;margin-bottom:20px;color:#000">👁️ 高对比度模式</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:15px">
          ${[['默认高对比','contrast(1.5)'],['深色模式','invert(1) hue-rotate(180deg)'],['护眼模式','sepia(0.3) saturate(1.5)'],['白底黑字','contrast(2) brightness(1.1)']].map(m => `
            <button onclick="document.body.style.filter=m[1]" style="padding:20px;background:#fff;border:3px solid #000;border-radius:12px;font-size:16px;cursor:pointer;font-weight:600">
              ${m[0]}
            </button>
          `).join('')}
        </div>
        <button onclick="document.body.style.filter='none'" style="margin-top:15px;padding:12px;width:100%;background:#eee;color:#000;border:2px solid #000;border-radius:10px;font-size:16px;cursor:pointer">重置为默认</button>
      </div>
    `);
  }

  function showAccessibilitySettings(overlay) {
    const grid = overlay.querySelector('.module-grid');
    if (!grid) return;
    grid.insertAdjacentHTML('beforebegin', `
      <div style="padding:20px 0">
        <div style="font-size:24px;font-weight:700;margin-bottom:20px;color:#000">⚙️ 无障碍设置</div>
        <div style="margin:15px 0">
          <label style="font-size:20px;display:flex;align-items:center;gap:12px;cursor:pointer;color:#000">
            <input type="checkbox" id="high-contrast" onchange="document.body.style.filter=this.checked?'contrast(1.5)':'none'" style="width:24px;height:24px">
            高对比度模式
          </label>
        </div>
        <div style="margin:15px 0">
          <label style="font-size:20px;margin-bottom:8px;display:block;color:#000">字体大小：<span id="font-val">24px</span></label>
          <input type="range" min="18" max="36" value="24" id="font-slider" oninput="document.body.style.fontSize=this.value+'px';document.getElementById('font-val').textContent=this.value+'px'" style="width:100%;height:8px">
        </div>
        <button onclick="window.speechSynthesis.speak(new SpeechSynthesisUtterance('无障碍设置已开启'))" style="padding:14px 24px;background:#FF6347;color:#fff;border:3px solid #000;border-radius:10px;font-size:18px;cursor:pointer">🔊 测试语音</button>
      </div>
    `);
  }

  function showKeyboardNav(overlay) {
    const grid = overlay.querySelector('.module-grid');
    if (!grid) return;
    const shortcuts = [
      ['Tab / Shift+Tab', '在元素间移动'],
      ['Enter / Space', '激活当前元素'],
      ['方向键', '滚动页面'],
      ['Esc', '关闭弹窗'],
    ];
    grid.insertAdjacentHTML('beforebegin', `
      <div style="padding:20px 0">
        <div style="font-size:24px;font-weight:700;margin-bottom:15px;color:#000">⌨️ 键盘导航说明</div>
        <div style="background:#fff;border:3px solid #000;border-radius:12px;padding:20px">
          ${shortcuts.map(s => `
            <div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid #eee;color:#000">
              <kbd style="background:#f5f5f5;border:2px solid #ccc;border-radius:4px;padding:4px 10px;font-family:monospace;font-size:16px">${s[0]}</kbd>
              <span style="font-size:16px">${s[1]}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `);
  }

  /**
   * 初始化2D界面交互（在页面加载完成后执行）
   */
  function initZoneInteraction() {
    console.log('[ZoneInteraction] 初始化2D界面交互...');

    // 监听自定义事件：2D界面已显示
    document.addEventListener('zone2d-shown', (e) => {
      const zoneId = e.detail.zoneId;
      // 延迟确保DOM已完全渲染
      setTimeout(() => bindModuleCardEvents(zoneId), 50);
    });

    console.log('[ZoneInteraction] 2D界面交互初始化完成');
  }

  // 导出全局函数
  window.showAgentList = (zoneId) => showList(zoneId, 'agent');
  window.showSkillList = (zoneId) => showList(zoneId, 'skill');

  // 页面加载完成后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initZoneInteraction);
  } else {
    initZoneInteraction();
  }
})();
