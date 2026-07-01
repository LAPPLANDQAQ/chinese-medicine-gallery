# 项目规则

## 项目边界

本项目是一个静态前端 WebGL 展示项目，主题为“中国医学发展史 / History of Chinese Medicine”。核心目标是使用 Three.js R185、CSS3DRenderer 和 GSAP ScrollTrigger 实现 3D 圆柱滚动时间轴。

项目不是后台管理系统，不是数据库项目，不是普通静态长页面，也不是 React/Vue 应用。

## 技术边界

必须使用：

- HTML
- CSS
- Vanilla JavaScript
- Native ES Modules
- Three.js R185
- WebGLRenderer
- CSS3DRenderer
- GSAP
- ScrollTrigger

禁止使用：

- React
- Vue
- Angular
- Svelte
- TypeScript
- Vite
- Webpack
- npm package.json
- node_modules
- 后端框架
- 数据库
- 登录系统
- 路由系统
- Tailwind CSS
- 大型 UI 组件库
- Lenis
- 后处理框架

## Chrome 桌面端目标

项目验收浏览器为最新版 Google Chrome 桌面浏览器，浏览器缩放必须保持 100%。

重点检查视口：

- 1920x1080
- 1600x900
- 1366x768

不以手机端适配作为本项目完成标准。

## 数据模型规则

项目必须使用多图片数据模型，每个历史时期通过 `images` 数组保存图片资料。

禁止使用 `coverImage` 单图模型，禁止退化为每个时期一张封面图的结构。

导出的数据名称必须保持：

```js
historyTimelineData
```

## 历史阶段与图片数量

项目必须保持四个历史阶段：

- 上古时期
- 古代医学
- 近代转型
- 现代发展

图片数量必须保持：

- 上古时期: 2
- 古代医学: 11
- 近代转型: 3
- 现代发展: 4

不得删除图片对象，不得减少图片数量，不得改成旧的单封面模式。

## 文件职责边界

### `index.html`

负责页面基础结构、容器、基础 CSS、importmap、GSAP CDN 和入口脚本引用。

不得在 `index.html` 中堆放业务 JavaScript。

### `src/main.js`

负责项目入口、模块初始化、连接 SceneSetup / CylinderSpiral / ScrollEngine，以及启动 requestAnimationFrame 渲染循环。

不得把场景、卡片或滚动细节全部塞回 `main.js`。

### `src/data/historyData.js`

只负责导出 `historyTimelineData`，保存四个历史阶段的数据。

不得写 Three.js 代码、DOM 操作、滚动逻辑或样式逻辑。

### `src/webgl/SceneSetup.js`

负责 camera、WebGL scene、CSS3D scene、WebGLRenderer、CSS3DRenderer、FogExp2、resize、render 和 destroy。

不得创建历史卡片或绑定 ScrollTrigger。

### `src/webgl/CylinderSpiral.js`

负责根据数据创建 CSS3D 多图卡片、圆柱螺旋布局、active 状态、展开交互、图片缺失容错和 WebGL 粒子雾气。

不得绑定 ScrollTrigger，不得修改历史数据。

### `src/webgl/ScrollEngine.js`

负责绑定一个 GSAP ScrollTrigger，并把滚动进度映射为 `cssGroup` 和 `webglGroup` 的旋转、上下移动与 active index。

不得创建卡片、粒子或修改数据。

## 后续修改原则

未来修改必须按阶段进行，每次只完成当前阶段目标。

每个阶段完成后必须进行人工或本地检查：

- 页面能在 Chrome 桌面端打开
- 控制台没有红色报错
- 当前阶段功能达成
- 旧功能没有被破坏
- 文件结构仍符合边界
- 未引入禁止技术

不得在没有明确要求的情况下扩展后台、数据库、登录、路由、AI 或大型 UI 框架功能。
