# 密码交换协议可视化演示（DHKE和ECDH）

本项目为 Diffie-Hellman 密钥交换（DHKE）和椭圆曲线 Diffie-Hellman（ECDH）协议的可视化演示，配备丰富动画效果，适合教学、演示和学习密码学原理。

---

## ? 功能亮点

- **粒子系统**：模拟数据流动，展示公钥交换过程
- **进度指示器**：实时显示协议执行进度和状态
- **3D 动画**：节点、密钥、参数等均有炫酷动画
- **高亮与脉冲**：当前节点高亮，协议完成有反馈动画
- **流畅过渡**：基于 GSAP 动画库，体验丝滑
- **响应式设计**：兼容桌面与移动端，自动适配性能

---

## ? 项目结构

```
├── index.html              # DHKE 演示页面
├── ecdh.html               # ECDH 演示页面
├── demo.html               # 动画效果演示页面
├── visualizer.js           # DHKE 可视化主逻辑
├── ecdh-visualizer.js      # ECDH 可视化主逻辑
├── styles-dhke.css         # DHKE 样式
├── styles-ecdh.css         # ECDH 样式
├── styles.css              # 通用样式
├── dhke.js                 # DHKE 算法实现
├── ecdh.js                 # ECDH 算法实现
├── LICENSE                 # 开源许可证
└── README.md               # 项目说明
```

---

## ? 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/你的用户名/your-repo-name.git
cd your-repo-name
```

### 2. 安装依赖（可选，仅本地开发/GSAP本地引用时）

```bash
npm install
```

### 3. 启动本地服务器

你可以用任意 HTTP 服务器（如 Python、Node.js serve）：

```bash
# Python 3
python -m http.server 8000
# 或 Node.js
npx serve .
```

### 4. 打开浏览器访问

- DHKE 演示：[http://localhost:8000/index.html](http://localhost:8000/index.html)
- ECDH 演示：[http://localhost:8000/ecdh.html](http://localhost:8000/ecdh.html)
- 动画演示：[http://localhost:8000/demo.html](http://localhost:8000/demo.html)

---

## ?? 技术实现

- **核心动画**：GSAP（[CDN](https://cdnjs.com/libraries/gsap) 或本地依赖均可）
- **主要类**：
  - `ParticleSystem`：粒子动画
  - `ProgressBar`：进度条动画
- **自定义配置**：粒子数量、动画时长、颜色等均可在 JS/CSS 中调整

---

## ? 国际化与兼容性

- **界面语言**：当前为中文，欢迎贡献英文/多语言支持
- **浏览器兼容**：
  - Chrome 60+
  - Firefox 55+
  - Safari 12+
  - Edge 79+
  - IE 11（部分功能受限）

---

## ? 性能优化

- 移动端自动降级动画复杂度
- 动画节流与内存管理
- 粒子数量自适应屏幕

---

## ? 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建功能分支
3. 提交更改
4. 创建 Pull Request

---

## ? 致谢

- [GSAP](https://greensock.com/gsap/) - JavaScript 动画库
- [MDN Web Docs](https://developer.mozilla.org/) - Web 开发文档
- 密码学社区 - 算法实现参考

---

> **仅供学习和教学用途，请勿用于生产环境或安全敏感场景。**

Enjoy this enhanced cryptographic protocol visualization! ?