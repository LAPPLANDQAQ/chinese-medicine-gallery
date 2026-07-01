# DESIGN.md

# Cylinder Mode 设计文档

## 1. 设计目标

本项目需要实现一个以 **Cylinder Mode** 为核心的 3D 滚动展示页面。

页面主题为：

```text
中国医学发展史 / History of Chinese Medicine
```

本项目只实现：

```text
圆柱螺旋式 3D 图文资料画廊
```

不实现：

```text
sphere 模式
普通纵向时间轴
横向轮播
瀑布流图片墙
3D 博物馆漫游
```

目标效果是：

```text
资料卡片围绕垂直 Y 轴形成圆柱螺旋结构。
用户滚动页面时，圆柱整体旋转并上下移动。
四个历史时期依次进入屏幕中心视口。
```

------

## 2. Cylinder Mode 核心特征

Cylinder Mode 的核心不是普通页面滚动，而是：

```text
内容固定在 3D 圆柱空间中，
滚动只负责驱动圆柱结构运动。
```

本项目中的 cylinder 模式必须具备以下特征：

```text
1. 所有资料卡片围绕 Y 轴排列。
2. 每张卡片拥有不同的旋转角度。
3. 每张卡片拥有不同的垂直高度。
4. 卡片整体形成螺旋式圆柱结构。
5. 用户滚动时，圆柱整体旋转。
6. 用户滚动时，圆柱整体上下移动。
7. 当前卡片进入屏幕中心后高亮。
8. 远离中心的卡片弱化，形成空间深度。
```

------

## 3. 页面空间结构

Cylinder Mode 使用三层空间结构：

```text
第一层：WebGL 背景空间
第二层：CSS3D 圆柱卡片空间
第三层：页面固定标题与滚动提示
```

对应容器：

```html
<div id="app">
  <div id="webgl-container"></div>
  <div id="css3d-container"></div>
  <header class="hero-copy"></header>
  <main id="scroll-stage"></main>
</div>
```

各容器职责：

```text
#webgl-container
负责 WebGLRenderer 背景、粒子、雾效。

#css3d-container
负责 CSS3DRenderer 图文资料卡片。

#scroll-stage
只提供滚动高度，不直接显示内容。
```

------

## 4. Cylinder 坐标布局规则

每张资料卡片根据索引 `index` 放置在圆柱面上。

核心公式：

```js
const theta = index * ANGLE_STEP;

const x = RADIUS * Math.sin(theta);
const z = RADIUS * Math.cos(theta);
const y = index * HEIGHT_STEP - centerOffset;
```

参数含义：

```text
RADIUS
圆柱半径，控制卡片距离中心轴的远近。

HEIGHT_STEP
卡片之间的垂直间距。

ANGLE_STEP
卡片之间的角度差。

centerOffset
用于让整个卡片组在 Y 轴方向居中。
```

推荐初始参数：

```js
const RADIUS = 760;
const HEIGHT_STEP = 460;
const ANGLE_STEP = Math.PI * 0.62;
```

中心偏移：

```js
const centerOffset = ((data.length - 1) * HEIGHT_STEP) / 2;
```

------

## 5. 卡片朝向规则

每张 CSS3D 卡片必须面向圆柱中心或相机方向，避免背面朝向用户。

推荐实现：

```js
object.position.set(x, y, z);
object.lookAt(0, y, 0);
object.rotateY(Math.PI);
```

如果卡片显示为背面，允许只调整：

```js
object.rotateY(Math.PI);
```

或根据实际情况改为：

```js
object.lookAt(camera.position);
```

禁止为了修复朝向问题推翻圆柱布局公式。

------

## 6. 滚动映射规则

滚动进度范围：

```text
0 ~ 1
```

将滚动进度映射为当前时代索引：

```js
const targetIndex = progress * (totalItems - 1);
```

将索引映射为圆柱旋转：

```js
const rotationY = -targetIndex * ANGLE_STEP;
```

将索引映射为圆柱垂直位移：

```js
const positionY = -targetIndex * HEIGHT_STEP;
```

最终应用到两个组：

```js
cssGroup.rotation.y = rotationY;
cssGroup.position.y = positionY;

webglGroup.rotation.y = rotationY;
webglGroup.position.y = positionY;
```

重要边界：

```text
必须移动整个圆柱组。
不得给每张卡片单独写滚动动画。
不得为每张卡片创建独立 ScrollTrigger。
```

------

## 7. 滚动阻尼规则

Cylinder Mode 的滚动不能生硬跳动，必须有平滑阻尼。

推荐使用：

```js
currentProgress += (targetProgress - currentProgress) * lerpFactor;
```

推荐参数：

```js
const lerpFactor = 0.08;
```

允许范围：

```text
0.05 ~ 0.12
```

表现要求：

```text
1. 快速滚动后，圆柱应平滑追上。
2. 不允许瞬间跳到目标位置。
3. 不允许旋转方向突然反转。
4. 不允许出现明显抖动。
```

------

## 8. ScrollTrigger 配置规则

ScrollTrigger 只负责提供滚动进度。

推荐配置：

```js
gsap.registerPlugin(ScrollTrigger);

ScrollTrigger.create({
  trigger: "#scroll-stage",
  start: "top top",
  end: "bottom bottom",
  scrub: 1,
  onUpdate: (self) => {
    targetProgress = self.progress;
  }
});
```

`#scroll-stage` 推荐高度：

```css
#scroll-stage {
  height: 520vh;
}
```

------

## 9. 四个时代的 Cylinder 节点

本项目固定有 4 个 cylinder 节点：

```text
1. 上古时期
2. 古代医学
3. 近代转型
4. 现代发展
```

滚动对应关系：

```text
progress = 0
上古时期进入中心

progress ≈ 0.33
古代医学进入中心

progress ≈ 0.66
近代转型进入中心

progress = 1
现代发展进入中心
```

activeIndex 计算方式：

```js
const activeIndex = Math.round(currentProgress * (totalItems - 1));
```

activeIndex 必须限制在：

```js
0 <= activeIndex <= totalItems - 1
```

------

## 10. CSS3D 卡片内容规则

每个时代卡片必须展示：

```text
1. 时期名称
2. 时间范围
3. 标题
4. 概述文字
5. 图片资料
6. 文字资料段落
```

卡片 DOM 推荐结构：

```html
<article class="timeline-card">
  <div class="timeline-card__media-strip">
    <figure class="timeline-card__image-item">
      <img src="" alt="" loading="lazy" draggable="false" />
      <figcaption>图片说明</figcaption>
    </figure>
  </div>

  <div class="timeline-card__body">
    <p class="timeline-card__period"></p>
    <p class="timeline-card__time"></p>
    <h2 class="timeline-card__title"></h2>
    <p class="timeline-card__summary"></p>

    <div class="timeline-card__sections">
      <section class="timeline-card__section">
        <h3></h3>
        <p></p>
      </section>
    </div>
  </div>
</article>
```

------

## 11. 多图展示规则

本项目每个时代不是单封面图，而是多图资料。

图片数量固定：

```text
上古时期：2 张
古代医学：11 张
近代转型：3 张
现代发展：4 张
```

默认显示规则：

```text
图片数量 <= 3：
默认显示全部图片。

图片数量 > 3：
默认只显示前 3 张图片，并显示剩余数量提示。
```

展开显示规则：

```text
点击卡片后显示该时代全部图片。
```

具体规则：

```text
上古时期：
默认显示 2 张，展开仍显示 2 张。

古代医学：
默认显示 3 张，展开显示 11 张。

近代转型：
默认显示 3 张，展开仍显示 3 张。

现代发展：
默认显示 3 张，展开显示 4 张。
```

禁止：

```text
不得重新使用 coverImage 单图模型。
不得把 11 张古代图片默认一次性全部铺满卡片。
不得把图片写死在 HTML 中。
```

------

## 12. 卡片状态设计

### 12.1 默认状态

默认卡片：

```text
opacity 较低
饱和度略低
边框较弱
光晕较弱
```

建议 CSS：

```css
.timeline-card {
  opacity: 0.68;
  filter: saturate(0.78);
}
```

------

### 12.2 Active 状态

当前进入中心视口的卡片添加：

```text
.is-active
aria-current="step"
```

视觉表现：

```text
1. opacity 提升到 1
2. 饱和度提升
3. 边框更亮
4. 光晕更强
5. 文字更清晰
```

建议 CSS：

```css
.timeline-card.is-active {
  opacity: 1;
  filter: saturate(1.15);
  border-color: rgba(216, 170, 91, 0.78);
  box-shadow:
    0 30px 110px rgba(0, 0, 0, 0.55),
    0 0 70px rgba(216, 170, 91, 0.36);
}
```

------

### 12.3 Hover 状态

鼠标悬停卡片时：

```text
1. 轻微放大
2. 边框增强
3. 光晕增强
4. 图片轻微放大
```

建议 CSS：

```css
.timeline-card:hover {
  transform: scale(1.035);
  border-color: rgba(216, 170, 91, 0.82);
}
```

------

### 12.4 Expanded 状态

点击卡片后添加：

```text
.is-expanded
```

行为要求：

```text
1. 同时只能有一张卡片展开。
2. 点击同一张卡片可以收起。
3. 点击另一张卡片时，上一张自动收起。
4. 展开后显示全部图片资料。
```

禁止：

```text
不使用 modal。
不使用 alert。
不跳转新页面。
不创建路由。
```

------

## 13. WebGL 背景规则

Cylinder Mode 的背景不承担资料展示，只负责空间氛围。

WebGL 层包含：

```text
1. 暗色背景
2. 粒子雾气
3. FogExp2 雾效
4. 与 CSS3D 圆柱同步的 webglGroup
```

背景色：

```js
0x0b0f19
```

雾效：

```js
webglScene.fog = new THREE.FogExp2(0x0b0f19, 0.00065);
```

粒子材质：

```js
new THREE.PointsMaterial({
  color: 0xd8aa5b,
  size: 4,
  transparent: true,
  opacity: 0.42,
  depthWrite: false
});
```

粒子数量：

```text
Chrome 桌面端：1200
```

粒子空间分布：

```js
const angle = Math.random() * Math.PI * 2;
const radius = randomBetween(160, 980);

const x = Math.cos(angle) * radius;
const z = Math.sin(angle) * radius;
const y = randomBetween(-1000, 1000);
```

------

## 14. Cylinder 模块职责

### 14.1 `SceneSetup.js`

只负责：

```text
1. camera
2. webglScene
3. cssScene
4. WebGLRenderer
5. CSS3DRenderer
6. FogExp2
7. resize
8. render
9. destroy
```

不得负责：

```text
1. 创建卡片
2. 创建滚动逻辑
3. 读取历史数据
```

------

### 14.2 `CylinderSpiral.js`

只负责：

```text
1. 根据 historyTimelineData 创建卡片
2. 使用 cylinder 公式摆放卡片
3. 创建 cssGroup
4. 创建 webglGroup
5. 管理 active 状态
6. 管理 expanded 状态
7. 创建粒子雾气
8. 暴露 getGroups()
```

不得负责：

```text
1. 注册 ScrollTrigger
2. 控制页面滚动
3. 修改数据源
```

------

### 14.3 `ScrollEngine.js`

只负责：

```text
1. 注册 ScrollTrigger
2. 获取滚动进度
3. 计算 rotationY
4. 计算 positionY
5. lerp 平滑
6. 控制 cssGroup
7. 控制 webglGroup
8. 计算 activeIndex
9. 触发 onActiveChange
```

不得负责：

```text
1. 创建 DOM 卡片
2. 创建粒子
3. 修改历史资料
```

------

## 15. Chrome 桌面端标准

只以 Chrome 桌面端作为主要标准。

测试视口：

```text
1920x1080
1600x900
1366x768
```

浏览器缩放：

```text
100%
```

不做专门手机端适配。

------

## 16. Cylinder Mode 验收标准

完成后必须满足：

```text
1. 页面存在 #webgl-container。
2. 页面存在 #css3d-container。
3. 页面存在 #scroll-stage。
4. 4 张时代卡片由 CSS3DRenderer 渲染。
5. 卡片围绕 Y 轴形成圆柱螺旋。
6. 滚动时圆柱整体旋转。
7. 滚动时圆柱整体上下移动。
8. 上古时期首先进入中心。
9. 古代医学随后进入中心。
10. 近代转型随后进入中心。
11. 现代发展最后进入中心。
12. 当前中心卡片有 .is-active。
13. 同时只有一张卡片 .is-active。
14. 点击卡片可以 .is-expanded。
15. 同时最多一张卡片 .is-expanded。
16. 古代医学默认显示 3 张图。
17. 古代医学展开显示 11 张图。
18. 背景有 WebGL 粒子雾气。
19. 场景有 FogExp2 暗色雾效。
20. 快速滚动后圆柱能平滑追上。
21. Chrome 控制台无红色报错。
22. 没有 sphere 模式相关代码。
```

------

## 17. Cylinder Mode 禁止事项

```text
1. 不实现 sphere 模式。
2. 不添加视图切换按钮。
3. 不添加 2D 普通时间轴。
4. 不添加横向轮播。
5. 不添加瀑布流布局。
6. 不给每张卡片单独绑定 ScrollTrigger。
7. 不把所有逻辑堆进 main.js。
8. 不使用 coverImage 单图模型。
9. 不使用 React/Vue/TypeScript/Vite。
10. 不添加后端、数据库、登录、路由。
```

------

## 18. 设计结论

本项目的 cylinder 模式可以概括为：

```text
CSS3DRenderer 负责图文卡片。
WebGLRenderer 负责背景氛围。
CylinderSpiral 负责圆柱螺旋布局。
ScrollEngine 负责滚动驱动旋转和上下移动。
```

最终效果应是：

```text
一个围绕中国医学发展史展开的 3D 圆柱螺旋资料展览。
用户通过滚动穿行于四个历史时期之间。
每个时期以多图资料卡片的形式进入屏幕中心。
```