# 中国医学发展史 3D Cylinder Gallery

## 项目介绍

本项目是一个以"中国医学发展史"为主题的 Three.js 沉浸式 3D 滚动展示网页。使用 WebGLRenderer 渲染暗色水墨氛围背景和粒子系统，使用 CSS3DRenderer 渲染 20 张独立图片资料，并通过 GSAP ScrollTrigger 将页面滚动进度映射为圆柱时间轴的旋转和上下移动。

项目内容围绕四个历史阶段展开：上古时期（2 张）、古代医学（11 张）、近代转型（3 张）、现代发展（4 张）。20 张资料图片沿圆柱螺旋结构独立排列，用户滚动页面时图片随螺旋旋转并依次进入中心视口。每张图片配有独立详细描述文字（150–200 字），点击后以流式打字机效果呈现。

**视觉风格**：水墨风（暖墨色背景 + 宣纸白文字 + 暖色谱系粒子 + 松烟发光雾效）

## 技术栈

- HTML + CSS + Vanilla JavaScript (ES Modules)
- Three.js R185（WebGLRenderer + CSS3DRenderer）
- GSAP 3.12 + ScrollTrigger

## 项目结构

```text
chinese-medicine-gallery/
├── index.html                  # 入口：容器、全部 CSS、importmap、CDN
├── README.md
├── PROJECT_RULES.md
├── DESIGN.md                   # Cylinder Mode 设计文档
├── assets/images/
│   ├── shanggu/                # 上古时期 2 张
│   ├── gudai/                  # 古代医学 11 张
│   ├── jindai/                 # 近代转型 3 张
│   └── xiandai/                # 现代发展 4 张
└── src/
    ├── main.js                 # 入口：模块初始化 + 动画循环
    ├── data/
    │   ├── historyData.js      # 原始数据（每张图片独立描述）
    │   └── imageItems.js       # 20 张独立图片项（派生）
    ├── ui/
    │   ├── ImageFilter.js      # 时期筛选标签栏
    │   └── DetailView.js       # 图片详情浮层（缩放动画 + 流式文字）
    └── webgl/
        ├── SceneSetup.js       # 相机、场景、WebGL/CSS3D 渲染器、雾效
        ├── CylinderSpiral.js   # 图片螺旋布局、粒子系统、时间线
        └── ScrollEngine.js     # GSAP ScrollTrigger 滚动→旋转/位移映射
```

## 本地运行

```bash
python -m http.server 5173
```

Chrome 桌面端打开 `http://localhost:5173`，缩放保持 100%。

## 功能列表

- **Cylinder Spiral** — 20 张图片独立圆柱螺旋排列，~2.8 圈旋转
- **Scroll-Driven** — 滚动驱动圆柱旋转 + 垂直位移，lerp 平滑阻尼
- **有机粒子流时间线** — 8,000 颗暖色粒子绕 Y 轴引力约束流动，形成可见螺旋线
- **粒子文字标签** — 上古/古代/近代/现代竖排，Canvas 渲染采样，每 8px 大亮粒子拼字
- **背景墨雾** — 3,000 颗暖白发光的松烟墨粒子，AdditiveBlending 叠加柔光
- **图片淡化 + Hover 还原** — 默认 58% 透明度，hover 恢复 100% + 5% 放大 + 印章红光晕
- **图片始终朝向相机** — 每帧 `lookAt(camera.position)`
- **容器贴合图片尺寸** — 无多余空白/边框，仅图片可见
- **图片漂浮动画** — CSS `@keyframes ink-float` 5s 循环，每张错相
- **时期筛选标签** — 5 按钮（全部/上古/古代/近代/现代），抽出动画 + 自动居中
- **详情浮层** — 点击图片 → 左半侧放大 ×1.35 + 顶部标题 + 右侧流式专属描述文字
- **流式文字** — 时期→简介→详细描述，4–8ms/字符打字机效果
- **图片容错** — 缺失图片显示"资料图片待补充"占位

## 设计系统

### 色彩

| CSS 变量 | 色值 | 用途 |
|----------|------|------|
| `--ink-deep` | `#0b0a07` | 最深底色 |
| `--ink-dark` | `#110f0b` | 暗色表面 |
| `--ink-surface` | `#181510` | 浮层表面 |
| `--paper-primary` | `#ede4d0` | 主要文字 |
| `--paper-secondary` | `rgba(237,228,208,0.66)` | 次级文字 |
| `--seal-red` | `#b8453a` | 交互强调 |

### 粒子色谱（暖墨系）

| 时期 | 色值 |
|------|------|
| 上古 | `#c48a62` 暖赭石 |
| 古代 | `#d4b88c` 暖蜜色 |
| 近代 | `#cca87a` 暖茶色 |
| 现代 | `#e8dcc4` 暖象牙白 |

### 螺旋参数

| 参数 | 值 |
|------|-----|
| RADIUS | 680 |
| HEIGHT_STEP | 145 |
| ANGLE_STEP | π × 0.28 |
| 滚动高度 | 520vh |
| 总旋转圈数 | ~2.8 圈 |

### 字体

- 标题/标签：`Noto Serif SC`, `Ma Shan Zheng`, serif
- 正文/详情：`FangSong`（仿宋）, `Noto Serif SC`, serif
