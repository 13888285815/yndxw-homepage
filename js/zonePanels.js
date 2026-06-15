/**
 * zonePanels.js — 高级区域面板（需求文档§5.4）
 * 
 * 为各区域提供深度交互功能：
 * - 老年区：语音助手、紧急呼叫、大字版设置
 * - 成人区：Agent市场数据、Token余额、API管理
 * - 儿童区：互动游戏、安全知识问答
 * - 青少年区：学习进度跟踪、家长监控
 * - 残障区：高对比度模式、屏幕朗读
 */

class ZonePanels {
  constructor() {
    this.currentZone = null;
    this.voiceRecognition = null;
    this.settings = this.loadSettings();
    console.log('[ZonePanels] 高级区域面板加载完成');
  }

  // ========== 老年区：语音助手 ==========
  initVoiceAssistant(container) {
    if (!container || container.dataset.voiceInit) return;
    container.dataset.voiceInit = 'true';
    
    // 语音识别（Web Speech API）
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      this.voiceRecognition = new SpeechRecognition();
      this.voiceRecognition.lang = 'zh-CN';
      this.voiceRecognition.continuous = false;
      this.voiceRecognition.interimResults = true;
      
      this.voiceRecognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        container.querySelector('.voice-input').value = transcript;
        this.handleVoiceCommand(transcript, container);
      };
      
      this.voiceRecognition.onerror = (event) => {
        console.log('[Voice] 识别错误:', event.error);
      };
    }
    
    // 添加语音按钮UI
    const voiceBtn = document.createElement('button');
    voiceBtn.className = 'voice-btn';
    voiceBtn.innerHTML = '🎤 点击说话';
    voiceBtn.style.cssText = `
      position: fixed;
      bottom: 30px;
      right: 30px;
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: linear-gradient(135deg, #4CAF50, #8BC34A);
      border: none;
      font-size: 36px;
      cursor: pointer;
      box-shadow: 0 4px 20px rgba(76,175,80,0.4);
      transition: transform 0.2s;
      z-index: 1001;
    `;
    voiceBtn.onclick = () => {
      if (this.voiceRecognition) {
        this.voiceRecognition.start();
        voiceBtn.innerHTML = '🔴 聆听中...';
        setTimeout(() => {
          if (voiceBtn.innerHTML.includes('聆听')) {
            this.voiceRecognition.stop();
            voiceBtn.innerHTML = '🎤 点击说话';
          }
        }, 5000);
      } else {
        alert('您的浏览器不支持语音识别，请使用Chrome浏览器');
      }
    };
    
    voiceBtn.onmouseenter = () => voiceBtn.style.transform = 'scale(1.1)';
    voiceBtn.onmouseleave = () => voiceBtn.style.transform = 'scale(1)';
    document.body.appendChild(voiceBtn);
    
    // 语音命令处理
    const commands = {
      '回去': 'window.app3d.returnToMainScene()',
      '返回': 'window.app3d.returnToMainScene()',
      '帮助': 'alert("可以说：回去、帮助、健康监测、紧急呼叫")',
      '健康': 'alert("请说出您想了解的健康知识")',
      '紧急': 'alert("紧急呼叫功能：拨打120或联系家人")',
      '声音': 'document.body.style.fontSize = "24px"',
    };
    
    this.handleVoiceCommand = (text, container) => {
      const cmd = text.trim().toLowerCase();
      for (const [keyword, action] of Object.entries(commands)) {
        if (cmd.includes(keyword)) {
          try { eval(action); } catch(e) {}
          return;
        }
      }
    };
    
    console.log('[ZonePanels] 语音助手初始化完成');
  }

  // ========== 老年区：紧急呼叫 ==========
  showEmergencyCall(container) {
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      top: 0; left: 0;
      width: 100%; height: 100%;
      background: rgba(0,0,0,0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 2000;
    `;
    modal.innerHTML = `
      <div style="
        background: #fff;
        border-radius: 20px;
        padding: 40px;
        text-align: center;
        max-width: 400px;
        font-size: 20px;
      ">
        <div style="font-size:80px;margin-bottom:20px">🆘</div>
        <h2 style="font-size:32px;color:#d32f2f;margin:0 0 20px">紧急呼叫</h2>
        <p style="color:#333;line-height:1.8">请选择呼叫对象：</p>
        <button onclick="alert('正在拨打 120...')" style="
          display:block;width:100%;padding:20px;margin:10px 0;
          font-size:24px;background:#d32f2f;color:#fff;border:none;border-radius:10px;cursor:pointer;
        ">📞 拨打120急救</button>
        <button onclick="alert('正在联系家人...')" style="
          display:block;width:100%;padding:20px;margin:10px 0;
          font-size:24px;background:#4CAF50;color:#fff;border:none;border-radius:10px;cursor:pointer;
        ">👨‍👩‍👧 联系家人</button>
        <button onclick="this.closest('[style]').remove()" style="
          display:block;width:100%;padding:15px;margin:10px 0;
          font-size:20px;background:#eee;color:#333;border:none;border-radius:10px;cursor:pointer;
        ">取消</button>
      </div>
    `;
    document.body.appendChild(modal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });
  }

  // ========== 成人区：Agent市场 ==========
  showAgentMarket(container, zone) {
    if (!container) return;
    
    // 模拟市场数据
    const agents = [
      { name: '智能写作助手', author: 'AI Labs', price: 50, rating: 4.9, downloads: 12800, desc: '一键生成高质量文章' },
      { name: '代码审查专家', author: 'DevTools', price: 80, rating: 4.8, downloads: 8500, desc: '自动审查代码质量' },
      { name: '数据分析大师', author: 'DataGenius', price: 100, rating: 4.7, downloads: 6200, desc: '一键生成可视化报告' },
      { name: '翻译精灵', author: 'LangBot', price: 30, rating: 4.9, downloads: 15000, desc: '支持100+语言翻译' },
      { name: '视频剪辑助手', author: 'MediaPro', price: 120, rating: 4.6, downloads: 3200, desc: 'AI驱动视频剪辑' },
    ];
    
    const marketGrid = document.createElement('div');
    marketGrid.className = 'module-grid';
    marketGrid.innerHTML = agents.map(a => `
      <div class="module-card" role="button" tabindex="0" aria-label="${a.name}，${a.author}开发，${a.price}Token">
        <div class="module-icon">🤖</div>
        <div class="module-name">${a.name}</div>
        <div class="module-desc">${a.desc}</div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-top:12px">
          <span style="color:#60a5fa;font-weight:600;font-size:18px">${a.price} Token</span>
          <span style="color:#ffd700">⭐ ${a.rating}</span>
        </div>
        <button style="
          width:100%;padding:10px;margin-top:12px;
          background:linear-gradient(135deg,#3b82f6,#8b5cf6);
          color:#fff;border:none;border-radius:8px;font-size:16px;cursor:pointer;
        ">立即购买</button>
      </div>
    `).join('');
    
    // 替换当前内容
    const grid = container.querySelector('.module-grid');
    if (grid) {
      grid.replaceWith(marketGrid);
    }
    
    // 添加键盘激活
    marketGrid.querySelectorAll('.module-card').forEach(card => {
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          card.querySelector('button').click();
        }
      });
    });
  }

  // ========== 成人区：Token余额 ==========
  showTokenWallet(container) {
    if (!container) return;
    
    const walletData = `
      <div style="
        background: linear-gradient(135deg, #1a1a2e, #16213e);
        border-radius: 16px;
        padding: 30px;
        margin: 20px;
        text-align: center;
        color: #fff;
      ">
        <div style="font-size:48px;margin-bottom:10px">💰</div>
        <div style="font-size:16px;color:rgba(255,255,255,0.6)">我的 Token 余额</div>
        <div style="font-size:48px;font-weight:700;color:#60a5fa;margin:10px 0">1,280</div>
        <div style="display:flex;gap:10px;justify-content:center;margin-top:20px">
          <button style="
            padding:12px 24px;border:none;border-radius:8px;
            background:#3b82f6;color:#fff;font-size:16px;cursor:pointer;
          ">充值 Token</button>
          <button style="
            padding:12px 24px;border:none;border-radius:8px;
            background:rgba(255,255,255,0.1);color:#fff;font-size:16px;cursor:pointer;
          ">历史记录</button>
        </div>
      </div>
    `;
    
    const grid = container.querySelector('.module-grid');
    if (grid) {
      grid.insertAdjacentHTML('beforebegin', walletData);
    }
  }

  // ========== 儿童区：安全知识问答 ==========
  showSafetyQuiz(container) {
    if (!container) return;
    
    const questions = [
      { q: '过马路时应该怎么做？', options: ['随便跑', '走人行道看红绿灯', '追逐打闹'], correct: 1 },
      { q: '遇到陌生人给你糖果怎么办？', options: ['接受', '拒绝并告诉家长', '和陌生人走'], correct: 1 },
      { q: '着火时应该怎么做？', options: ['躲起来', '拨打119并逃离', '乘电梯'], correct: 1 },
    ];
    
    let current = 0;
    let score = 0;
    
    const showQ = () => {
      if (current >= questions.length) {
        container.querySelector('.quiz-content').innerHTML = `
          <div style="text-align:center;padding:40px">
            <div style="font-size:80px">${score >= 2 ? '🏆' : '📚'}</div>
            <h2 style="color:#FF4081">答题完成！</h2>
            <p style="font-size:24px">得分：${score}/${questions.length}</p>
            <button onclick="location.reload()" style="
              padding:15px 30px;font-size:20px;background:#FF4081;color:#fff;border:none;border-radius:20px;cursor:pointer;margin-top:20px;
            ">再来一次</button>
          </div>
        `;
        return;
      }
      
      const q = questions[current];
      container.querySelector('.quiz-content').innerHTML = `
        <div style="padding:30px">
          <div style="font-size:20px;color:rgba(255,255,255,0.6);margin-bottom:10px">
            第 ${current + 1} / ${questions.length} 题
          </div>
          <h2 style="font-size:28px;margin:0 0 30px;color:#fff">${q.q}</h2>
          <div style="display:flex;flex-direction:column;gap:15px">
            ${q.options.map((opt, i) => `
              <button class="quiz-btn" data-index="${i}" style="
                padding:20px;font-size:22px;background:rgba(255,255,255,0.1);
                color:#fff;border:2px solid rgba(255,255,255,0.2);
                border-radius:16px;cursor:pointer;text-align:left;
                transition:all 0.2s;
              ">${opt}</button>
            `).join('')}
          </div>
        </div>
      `;
      
      container.querySelectorAll('.quiz-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const idx = parseInt(btn.dataset.index);
          if (idx === q.correct) {
            score++;
            btn.style.background = '#4CAF50';
            btn.style.borderColor = '#4CAF50';
          } else {
            btn.style.background = '#f44336';
            btn.style.borderColor = '#f44336';
          }
          setTimeout(() => { current++; showQ(); }, 1000);
        });
      });
    };
    
    const quizHTML = `
      <div class="quiz-content" style="padding:20px">
        <h2 style="font-size:28px;color:#FF4081;margin-bottom:20px">🚦 安全知识小测验</h2>
      </div>
    `;
    
    const grid = container.querySelector('.module-grid');
    if (grid) {
      grid.insertAdjacentHTML('beforebegin', quizHTML);
      showQ();
    }
  }

  // ========== 青少年区：学习进度 ==========
  showLearningProgress(container) {
    if (!container) return;
    
    const progressHTML = `
      <div style="
        background: linear-gradient(135deg, #E3F2FD, #BBDEFB);
        border-radius: 16px;
        padding: 30px;
        margin: 20px;
      ">
        <h2 style="font-size:24px;margin:0 0 20px;color:#1976D2">📊 我的学习进度</h2>
        <div style="display:flex;flex-direction:column;gap:20px">
          <div>
            <div style="display:flex;justify-content:space-between;margin-bottom:8px">
              <span>Python 编程</span><span>75%</span>
            </div>
            <div style="height:12px;background:#E3F2FD;border-radius:6px;overflow:hidden">
              <div style="width:75%;height:100%;background:linear-gradient(90deg,#2196F3,#4CAF50);border-radius:6px"></div>
            </div>
          </div>
          <div>
            <div style="display:flex;justify-content:space-between;margin-bottom:8px">
              <span>数学基础</span><span>60%</span>
            </div>
            <div style="height:12px;background:#E3F2FD;border-radius:6px;overflow:hidden">
              <div style="width:60%;height:100%;background:linear-gradient(90deg,#2196F3,#FF9800);border-radius:6px"></div>
            </div>
          </div>
          <div>
            <div style="display:flex;justify-content:space-between;margin-bottom:8px">
              <span>英语口语</span><span>40%</span>
            </div>
            <div style="height:12px;background:#E3F2FD;border-radius:6px;overflow:hidden">
              <div style="width:40%;height:100%;background:linear-gradient(90deg,#2196F3,#9C27B0);border-radius:6px"></div>
            </div>
          </div>
        </div>
        <div style="margin-top:20px;padding:15px;background:#fff;border-radius:12px;text-align:center">
          <div style="font-size:48px">🎯</div>
          <div style="font-size:20px;font-weight:600;color:#1976D2">本周学习 12 小时</div>
          <div style="color:#666;font-size:14px">超过 85% 的同学</div>
        </div>
      </div>
    `;
    
    const grid = container.querySelector('.module-grid');
    if (grid) {
      grid.insertAdjacentHTML('beforebegin', progressHTML);
    }
  }

  // ========== 残障区：无障碍设置 ==========
  showAccessibilitySettings(container) {
    if (!container) return;
    
    const settingsHTML = `
      <div style="
        background: #fff;
        border-radius: 16px;
        padding: 30px;
        margin: 20px;
        border: 3px solid #000;
      ">
        <h2 style="font-size:28px;margin:0 0 20px;color:#000">⚙️ 无障碍设置</h2>
        
        <div style="margin:20px 0">
          <label style="font-size:22px;display:flex;align-items:center;gap:15px;cursor:pointer">
            <input type="checkbox" id="high-contrast" onchange="window.zonePanels.toggleHighContrast(this.checked)"
              style="width:28px;height:28px">
            <span>高对比度模式</span>
          </label>
        </div>
        
        <div style="margin:20px 0">
          <label style="font-size:22px;margin-bottom:10px;display:block">字体大小：<span id="font-size-val">24px</span></label>
          <input type="range" min="18" max="36" value="24" id="font-slider"
            oninput="document.body.style.fontSize=this.value+'px';document.getElementById('font-size-val').textContent=this.value+'px'"
            style="width:100%;height:8px">
        </div>
        
        <div style="margin:20px 0">
          <label style="font-size:22px;display:flex;align-items:center;gap:15px;cursor:pointer">
            <input type="checkbox" id="voice-output" onchange="window.zonePanels.toggleVoiceOutput(this.checked)"
              style="width:28px;height:28px">
            <span>自动语音朗读</span>
          </label>
        </div>
        
        <button onclick="window.speechSynthesis.speak(new SpeechSynthesisUtterance('欢迎来到无障碍设置'))"
          style="
            padding:15px 30px;font-size:22px;background:#FF6347;color:#fff;
            border:3px solid #000;border-radius:10px;cursor:pointer;margin-top:10px;
          ">🔊 测试语音</button>
      </div>
    `;
    
    const grid = container.querySelector('.module-grid');
    if (grid) {
      grid.insertAdjacentHTML('beforebegin', settingsHTML);
    }
  }

  toggleHighContrast(enabled) {
    if (enabled) {
      document.body.style.filter = 'contrast(1.5)';
    } else {
      document.body.style.filter = 'none';
    }
  }

  toggleVoiceOutput(enabled) {
    if (enabled && 'speechSynthesis' in window) {
      const text = document.querySelector('.zone-page')?.textContent || '语音朗读已开启';
      const utterance = new SpeechSynthesisUtterance(text.substring(0, 200));
      utterance.lang = 'zh-CN';
      speechSynthesis.speak(utterance);
    }
  }

  loadSettings() {
    try {
      return JSON.parse(localStorage.getItem('zone-settings') || '{}');
    } catch { return {}; }
  }

  saveSettings() {
    localStorage.setItem('zone-settings', JSON.stringify(this.settings));
  }
}

window.ZonePanels = ZonePanels;
window.zonePanels = new ZonePanels();
console.log('[ZonePanels] 实例化完成');
