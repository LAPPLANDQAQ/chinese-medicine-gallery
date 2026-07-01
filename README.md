# 中国医学发展史 3D Cylinder Gallery

## 项目介绍

本项目是一个以“中国医学发展史”为主题的 Three.js R185 沉浸式 3D 滚动展示网页。页面使用 WebGLRenderer 渲染暗色雾效和粒子背景，使用 CSS3DRenderer 渲染多图资料卡片，并通过 GSAP ScrollTrigger 将页面滚动进度映射为圆柱时间轴的旋转和上下移动。

项目内容围绕四个历史阶段展开：上古时期、古代医学、近代转型、现代发展。用户滚动页面时，不同时期的资料卡片会沿圆柱螺旋结构依次进入中心视口。

## 技术栈

- HTML
- CSS
- Vanilla JavaScript
- Native ES Modules
- Three.js R185
- WebGLRenderer
- CSS3DRenderer
- GSAP
- ScrollTrigger

## 项目结构

```text
chinese-medicine-gallery/
├── index.html
├── README.md
├── PROJECT_RULES.md
├── assets/
│   └── images/
│       ├── shanggu/
│       ├── gudai/
│       ├── jindai/
│       └── xiandai/
└── src/
    ├── main.js
    ├── data/
    │   └── historyData.js
    └── webgl/
        ├── SceneSetup.js
        ├── CylinderSpiral.js
        └── ScrollEngine.js
```

## 本地运行

在项目根目录执行：

```bash
python -m http.server 5173
```

然后在最新版 Google Chrome 桌面浏览器中打开：

```text
http://localhost:5173
```

## Chrome 标准

- 使用最新版 Google Chrome 桌面浏览器
- 浏览器缩放保持 100%
- 重点检查桌面视口：1920x1080、1600x900、1366x768

## 图片素材结构

- 上古时期: 2 images
- 古代医学: 11 images
- 近代转型: 3 images
- 现代发展: 4 images

图片文件需要手动放入对应目录。项目不会从互联网抓取图片，不会内置版权不明图片，也不会把图片 base64 写入代码。缺失图片会显示“资料图片待补充”的占位效果。

## 功能列表

- cylinder spiral timeline 圆柱螺旋时间轴
- scroll-driven rotation 滚动驱动圆柱旋转
- scroll-driven vertical movement 滚动驱动圆柱上下移动
- CSS3D multi-image cards 多图片资料卡片
- expanded card interaction 卡片点击展开，显示完整图片资料
- WebGL particle mist WebGL 药香雾气 / 历史尘埃粒子
- FogExp2 dark atmosphere 暗色雾化空间氛围
- active card highlight 当前卡片高亮与景深弱化
- image fallback 图片缺失容错占位

## 手动验收清单

1. 启动本地静态服务后，Chrome 能打开 `http://localhost:5173`。
2. 控制台没有红色 JavaScript 报错。
3. 页面背景为暗色博物馆式氛围。
4. WebGL 粒子雾气可见，滚动时与圆柱整体同步运动。
5. 四个历史阶段卡片围绕 Y 轴形成圆柱螺旋结构。
6. 滚动页面时，圆柱会旋转并上下移动。
7. 第一张卡片在页面顶部附近可见，第四张卡片在页面底部附近可见。
8. 当前进入中心区域的卡片有明显高亮，非当前卡片更暗。
9. 卡片 hover 效果可用。
10. 点击卡片可展开，再次点击可收起。
11. 同一时间只有一张卡片展开。
12. 古代医学默认显示 3 张图，展开后显示 11 张图。
13. 现代发展默认显示 3 张图，展开后显示 4 张图。
14. 缺失图片不显示破图图标，而是显示“资料图片待补充”占位。
15. 项目不包含后端、数据库、登录、路由或智能生成能力。
