# Vibe Coding 实战指南

> 来源：姜学长AI学习圈《2026年自学Vibe Coding，先看这5个视频》  
> 整理：QClaw Agent | 2026-06-14

---

## 什么是 Vibe Coding？

**Vibe Coding** = 人和 AI 聊天 + AI 帮你写代码 + 一起迭代优化

核心：用自然语言描述意图，让 AI 写代码，人负责审查和方向把控。

| 传统方式 | Vibe Coding |
|---------|------------|
| 需求→架构→手写→调试→部署 | 需求→传递 Vibe→AI 执行→验证→部署 |

---

## 学习路线（4 阶段）

| 阶段 | 目标 | 重点 |
|------|------|------|
| Stage 1 | 语境感知 | 如何与 AI Agent 高效对话 |
| Stage 2 | 架构编排 | 拆解为 AI 可理解的原子任务 |
| Stage 3 | 自动化执行 | Vite/Cursor 工具链实时预览 |
| Stage 4 | 部署上线 | 一键云端发布 |

---

## 工具选型（2026）

### 国内主流 IDE
- **Trae**（字节）— 首个 AI 原生 IDE，中文适配，目前免费
- **Qoder**（阿里）— 支持 MCP 扩展
- **秒哒**（百度）— 零代码 AI 助手，中文友好
- **NoCode**（美团）— 低代码 + AI 生成后端

### 国外主流 IDE
- **Cursor** — AI 原生编辑器，Agent 模式多文件编辑，$20/月
- **Claude Code** — 复杂逻辑强，命令行操作
- **Kiro**（Amazon）— 规范驱动开发，$25/月
- **Bolt** — 轻量快速原型，免费/Pro $15
- **Antigravity**（Google）— 云端免安装，1M Token，$30/月

### 命令行工具
- **Claude Code** — Anthropic 出品
- **Gemini CLI** — Google 出品
- **Codex CLI** — OpenAI 出品，GPT-5-Codex 模型可独立工作 7h+

### 零代码平台（最适合零基础）
- 百度秒哒：https://www.miaoda.cn/
- Bolt：https://bolt.new/
- Youware：https://www.youware.com/create

---

## AI 模型选型

| 模型 | 优势 | 推荐场景 |
|------|------|---------|
| Claude 4.6 | 编程能力最强 | 主力编程 |
| Gemini 3.0 | 1M Token 超长上下文 | 大型项目 |
| GPT-5/o3 | 推理能力强 | 逻辑数学编程 |
| DeepSeek | 性价比高，国内可用 | 成本敏感 |
| 智谱GLM/通义/Kimi | 国产优秀 | 国内环境 |

---

## 实战全流程

1. **需求梳理** → PRD、功能清单、优先级
2. **产品设计** → 原型图、UI 设计稿、交互流程
3. **技术开发** → 前后端代码、接口文档
4. **测试验收** → 测试报告、Bug 清单
5. **上线部署** → 正式版本
6. **运营迭代** → 数据监控、用户反馈

---

## 部署平台

| 平台 | 特色 | 费用 |
|------|------|------|
| Vercel | 前端最流行，自动 HTTPS+CDN | 免费 |
| Netlify | 表单处理 + 无服务器函数 | 免费额度大 |
| EdgeOne Pages | 腾讯云国产平台 | 免费额度 |
| GitHub Pages | 完全免费，无限流量 | 完全免费 |
| Cloudflare | 全球 CDN 加速 | 免费 |

---

## Prompt 工程黄金法则

把 AI 当"技术很强但对你项目一无所知的资深工程师"：

- ❌ 坏的 Prompt：帮我写一个登录功能
- ✅ 好的 Prompt：在 `src/auth/` 目录下新建 `login.ts`，使用项目现有的 axios 封装...

---

## 进阶概念

- **MCP**（Model Context Protocol）— AI 与外部系统连接的通用标准
- **Agent Skills** — AI 特定领域能力扩展包
- **Spec-kit/OpenSpec** — 规范驱动开发，先写规范再让 AI 生成
- **Rules 文件** — `.cursorrules` / `CLAUDE.md` 定义项目规则和编码风格

---

## 推荐资源

- 鱼皮 Vibe Coding 零基础入门：https://ai.codefather.cn/
- Vibe Coding 指南 + 提示词库：https://github.com/tukuaiai/vibe-coding-cn
- 通往 AGI 之路（必学知识库）：https://waytoagi.feishu.cn/
- B 站视频：https://www.bilibili.com/video/BV1aPZRBHEXL/

---

## OPC 一人公司概念

OPC（One Person Company）= 个人 + AI 为核心的轻量创业模式

- 决策高效：单人 100% 掌控
- 成本极低：主要成本为 AI 工具订阅
- 能力放大：AI 补齐个人短板
- 风险可控：有限责任保护

---

## 本项目当前配置

- **OpenClaw** — 我们的 AI Agent 平台
- **Codex CLI** — 已配置（QClaw 代理，modelroute 模型）
- **Cursor / Trae** — 用户手动 IDE

**建议下一步：**
1. 学习 Prompt 工程，提升 Vibe Coding 效率
2. 尝试零代码平台（秒哒 / Bolt）快速原型
3. 用 Codex CLI 做自动化编程任务
