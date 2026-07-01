# 中国医学发展史 3D Cylinder Gallery

## 项目介绍

本项目是一个以"中国医学发展史"为主题的 Three.js R185 沉浸式 3D 滚动展示网页。使用 WebGLRenderer 渲染暗色水墨氛围背景和粒子系统，使用 CSS3DRenderer 渲染 20 张独立图片资料，并通过 GSAP ScrollTrigger 将页面滚动进度映射为圆柱时间轴的旋转和上下移动。

项目内容围绕四个历史阶段展开：上古时期（2 张）、古代医学（11 张）、近代转型（3 张）、现代发展（4 张）。20 张资料图片沿圆柱螺旋结构独立排列，用户滚动页面时图片随螺旋旋转并依次进入中心视口。

**视觉风格**：水墨风（墨色五色 + 宣纸白 + 印章红 + 松烟墨雾）

## 技术栈

- HTML
- CSS
- Vanilla JavaScript
- Native ES Modules
- Three.js R185（WebGLRenderer + CSS3DRenderer）
- GSAP + ScrollTrigger

## 项目结构

```text
chinese-medicine-gallery/
├── index.html                  # 入口：容器、CSS、importmap、CDN
├── README.md
├── PROJECT_RULES.md
├── DESIGN.md
├── assets/
│   └── images/
│       ├── shanggu/            # 上古时期 2 张
│       ├── gudai/              # 古代医学 11 张
│       ├── jindai/             # 近代转型 3 张
│       └── xiandai/            # 现代发展 4 张
└── src/
    ├── main.js                 # 入口：模块初始化 + 动画循环
    ├── data/
    │   ├── historyData.js      # 原始 4 时期数据
    │   └── imageItems.js       # 20 张独立图片项（派生）
    ├── ui/
    │   ├── ImageFilter.js      # 时期筛选标签栏
    │   └── DetailView.js       # 图片详情浮层（缩放动画 + 流式文字）
    └── webgl/
        ├── SceneSetup.js       # 相机、场景、渲染器、雾效
        ├── CylinderSpiral.js   # 图片螺旋布局、粒子系统
        └── ScrollEngine.js     # GSAP ScrollTrigger 滚动映射
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
- 重点检查桌面视口：1920×1080、1600×900、1366×768

## 功能列表

- **Cylinder Spiral** — 20 张图片独立圆柱螺旋排列，2.8 圈完整旋转
- **Scroll-Driven** — 滚动驱动圆柱旋转 + 垂直位移，lerp 平滑阻尼
- **水墨风视觉** — 墨色五色背景、宣纸白文字、印章红交互点缀
- **图片淡化 + Hover 还原** — 默认 58% 透明度淡化，hover 恢复 100% + 5% 放大
- **图片始终朝向相机** — 每帧 `lookAt(camera.position)`，无论螺旋如何旋转
- **图片容器贴合** — 容器尺寸由图片实际宽高决定，无多余空白/边框
- **图片漂浮动画** — CSS `@keyframes ink-float` 5s 循环，每张错相 0.22s
- **时期筛选标签** — 顶部 5 按钮（全部/上古/古代/近代/现代），筛选显隐 + 抽出动画
- **筛选自动居中** — 选中时期后 GSAP 动画平滑滚动到匹配图片中间位置
- **引力粒子时间线** — 10000 颗发光粒子围绕中央 Y 轴轨道运动，受向心力约束
- **背景墨雾粒子** — 1200 颗暖白发光的松烟墨雾，AdditiveBlending 叠加柔光
- **详情浮层** — 点击图片 → 左半侧放大展示 + 顶部标题 + 右侧流式文字（~1s 完成）
- **关闭详情** — 关闭按钮 / 背景点击 / Escape 键，图片缩回原位
- **图片容错** — 缺失图片显示"资料图片待补充"占位
- **WebGL 雾效** — FogExp2 暗色空间氛围

## 设计系统

### 色彩

| CSS 变量 | 色值 | 用途 |
|----------|------|------|
| `--ink-deep` | `#070a10` | 最深底色（焦墨） |
| `--ink-dark` | `#0d1119` | 暗色表面（浓墨） |
| `--ink-surface` | `#131822` | 浮层表面（重墨） |
| `--paper-primary` | `#ede4d0` | 宣纸白（主要文字） |
| `--paper-secondary` | `rgba(237,228,208,0.66)` | 次级文字 |
| `--seal-red` | `#b8453a` | 印章红（交互强调） |
| `--seal-gold` | `#b8945c` | 金粉点缀 |

### 螺旋参数（20 图片项）

| 参数 | 值 |
|------|-----|
| RADIUS | 680 |
| HEIGHT_STEP | 145 |
| ANGLE_STEP | π × 0.28 |
| 总旋转圈数 | ~2.8 圈 |
| 滚动高度 | 520vh |

### 字体

- 标题/标签：`"Noto Serif SC", "Ma Shan Zheng", serif`
- 正文/详情：`"FangSong", "仿宋", "Noto Serif SC", serif`

### 动效

| 场景 | 时长 | 缓动 |
|------|------|------|
| hover 交互 | 320ms | `cubic-bezier(0.25,0.46,0.45,0.94)` |
| 筛选显隐 | 500–560ms | CSS transition |
| 详情入场 | 400–520ms | `cubic-bezier(0.22,0.61,0.36,1)` |
| 详情出场 | 250–540ms | `cubic-bezier(0.55,0.06,0.68,0.19)` |
| 流式文字 | ~10ms/字符 | ~1s 完成全部内容 |
