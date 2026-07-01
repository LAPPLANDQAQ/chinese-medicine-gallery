import * as THREE from "three";
import { CSS3DObject } from "three/addons/renderers/CSS3DRenderer.js";

const RADIUS = 760;
const HEIGHT_STEP = 460;
const ANGLE_STEP = Math.PI * 0.62;
const MAX_DEFAULT_IMAGES = 3;
const PARTICLE_COUNT = 3000;

// 20-item spiral parameters
const IMAGE_RADIUS = 680;
const IMAGE_HEIGHT_STEP = 145;
const IMAGE_ANGLE_STEP = Math.PI * 0.28;

export class CylinderSpiral {
  constructor({
    data,
    cssScene,
    webglScene,
    imageItems,
    spiralRadius,
    spiralHeightStep,
    spiralAngleStep
  }) {
    if ((!Array.isArray(data) && !Array.isArray(imageItems)) || !cssScene || !webglScene) {
      throw new Error("CylinderSpiral requires data or imageItems, cssScene, and webglScene.");
    }

    this.data = data;
    this.cssScene = cssScene;
    this.webglScene = webglScene;
    this.cssGroup = new THREE.Group();
    this.webglGroup = new THREE.Group();
    this.cardObjects = [];
    this.cardElements = [];
    this.expandedIndex = null;

    // Image item mode (20 individual images)
    this.imageData = imageItems || null;
    this.onImageClick = null;
    this.currentFilter = null;

    this.cssScene.add(this.cssGroup);
    this.webglScene.add(this.webglGroup);

    if (this.imageData && this.imageData.length > 0) {
      this._spiralRadius = spiralRadius || IMAGE_RADIUS;
      this._spiralHeightStep = spiralHeightStep || IMAGE_HEIGHT_STEP;
      this._spiralAngleStep = spiralAngleStep || IMAGE_ANGLE_STEP;
      this.createImageItems();
    } else if (this.data && this.data.length > 0) {
      this.createCards();
    }

    this.createParticleMist();
    this.createAttractorTimeline();
  }

  createCards() {
    const centerOffset = ((this.data.length - 1) * HEIGHT_STEP) / 2;

    this.data.forEach((item, index) => {
      const element = this.createCardElement(item, index);
      const object = new CSS3DObject(element);
      // Cylinder helix layout: cards orbit the Y axis while stepping vertically.
      const theta = index * ANGLE_STEP;
      const x = RADIUS * Math.sin(theta);
      const z = RADIUS * Math.cos(theta);
      const y = index * HEIGHT_STEP - centerOffset;

      object.position.set(x, y, z);
      object.lookAt(0, y, 0);
      object.rotateY(Math.PI);

      this.cssGroup.add(object);
      this.cardObjects.push(object);
      this.cardElements.push(element);
    });
  }

  /* ---- 20-image spiral methods ---- */

  createImageItems() {
    const r = this._spiralRadius;
    const hStep = this._spiralHeightStep;
    const aStep = this._spiralAngleStep;
    const centerOffset = ((this.imageData.length - 1) * hStep) / 2;

    this.imageData.forEach((item, index) => {
      // Create DOM structure
      const container = document.createElement("div");
      container.className = "image-item";

      const inner = document.createElement("div");
      inner.className = "image-item__inner";

      const img = document.createElement("img");
      img.className = "image-item__img is-loading";
      img.src = item.src;
      img.alt = item.title;
      img.loading = "lazy";
      img.draggable = false;

      img.onerror = () => {
        img.onerror = null;
        img.alt = "资料图片待补充";
        inner.style.background =
          "linear-gradient(135deg, rgba(148,130,100,0.12), rgba(7,10,16,0.6))";
        inner.style.display = "flex";
        inner.style.alignItems = "center";
        inner.style.justifyContent = "center";
        inner.style.color = "rgba(237,228,208,0.5)";
        inner.style.fontSize = "12px";
        inner.textContent = "资料图片待补充";
      };

      img.onload = () => {
        img.classList.remove("is-loading");
        img.classList.add("is-loaded");
        // Staggered float animation — each image breathes at its own phase
        img.style.animationDelay = `${index * 0.22}s`;

        // Container matches image actual size — no extra space around image
        const maxW = 340;
        const maxH = 260;
        const scale = Math.min(maxW / img.naturalWidth, maxH / img.naturalHeight, 1);
        inner.style.width = `${img.naturalWidth * scale}px`;
        inner.style.height = `${img.naturalHeight * scale}px`;
      };

      inner.appendChild(img);
      container.appendChild(inner);

      // Click → detail overlay
      inner.addEventListener("click", (e) => {
        e.stopPropagation();
        this.handleImageClick(index);
      });

      // CSS3DObject
      const object = new CSS3DObject(container);
      const theta = index * aStep;
      const x = r * Math.sin(theta);
      const z = r * Math.cos(theta);
      const y = index * hStep - centerOffset;

      object.position.set(x, y, z);
      object.lookAt(0, y, 0);
      object.rotateY(Math.PI);
      object.userData = {
        imageId: item.imageId,
        eraId: item.eraId,
        index,
        item
      };

      this.cssGroup.add(object);
      this.cardObjects.push(object);
      this.cardElements.push(inner);
    });
  }

  handleImageClick(index) {
    if (this.onImageClick && this.imageData && this.imageData[index]) {
      const sourceImg = this.cardElements[index]?.querySelector("img");
      this.onImageClick(this.imageData[index], sourceImg);
    }
  }

  setFilter(eraId) {
    this.currentFilter = eraId;

    this.cardObjects.forEach((obj, i) => {
      const inner = obj.element?.querySelector(".image-item__inner");
      if (!inner) return;

      const matches = !eraId || obj.userData?.eraId === eraId;
      inner.classList.toggle("is-filter-visible", matches);
      inner.classList.toggle("is-filter-hidden", !matches);

      // Remove any lingering pull animation, re-add for matched items
      inner.classList.remove("is-filter-pulled");
      if (matches && eraId) {
        // Stagger the pull-in effect
        const eraImages = this.cardObjects.filter(
          (o) => !eraId || o.userData?.eraId === eraId
        );
        const localIndex = eraImages.indexOf(obj);
        setTimeout(() => {
          inner.classList.add("is-filter-pulled");
        }, localIndex * 30);
      }
    });
  }

  /**
   * Returns scroll progress [0–1] that centers on the filtered images.
   * Returns null when filter is "all".
   */
  getFilterCenterProgress(eraId) {
    if (!eraId || !this.imageData) return null;

    const matchingIndices = [];
    this.imageData.forEach((item, i) => {
      if (item.eraId === eraId) {
        matchingIndices.push(i);
      }
    });

    if (matchingIndices.length === 0) return null;

    const centerIndex =
      matchingIndices[Math.floor(matchingIndices.length / 2)];
    const maxIndex = Math.max(this.imageData.length - 1, 0);
    return centerIndex / maxIndex;
  }

  /**
   * Makes every image CSS3DObject face the camera each frame.
   * Call in the animation loop.
   */
  updateImageFacing(camera) {
    if (!this.imageData) return;
    this.cardObjects.forEach((obj) => {
      obj.lookAt(camera.position);
    });
  }

  setOnImageClick(callback) {
    this.onImageClick = callback;
  }

  /* ---- end 20-image methods ---- */

  createCardElement(item, index) {
    const article = document.createElement("article");
    article.className = "timeline-card";
    article.setAttribute("aria-label", `${item.period}: ${item.title}`);
    article.setAttribute("role", "button");
    article.setAttribute("tabindex", "0");
    article.setAttribute("aria-expanded", "false");

    const mediaStrip = document.createElement("div");
    mediaStrip.className = "timeline-card__media-strip";
    this.renderCardImages(mediaStrip, item, false);

    const body = document.createElement("div");
    body.className = "timeline-card__body";

    const period = document.createElement("p");
    period.className = "timeline-card__period";
    period.textContent = item.period;

    const time = document.createElement("p");
    time.className = "timeline-card__time";
    time.textContent = item.timeSpan;

    const title = document.createElement("h2");
    title.className = "timeline-card__title";
    title.textContent = item.title;

    const summary = document.createElement("p");
    summary.className = "timeline-card__summary";
    summary.textContent = item.summary;

    const sections = document.createElement("div");
    sections.className = "timeline-card__sections";

    item.textSections.forEach((section) => {
      const sectionElement = document.createElement("section");
      sectionElement.className = "timeline-card__section";

      const heading = document.createElement("h3");
      heading.textContent = section.heading;

      const content = document.createElement("p");
      content.textContent = section.content;

      sectionElement.append(heading, content);
      sections.appendChild(sectionElement);
    });

    body.append(period, time, title, summary, sections);
    article.append(mediaStrip, body);
    article.addEventListener("click", () => {
      this.toggleExpandedCard(index);
    });

    article.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        this.toggleExpandedCard(index);
      }
    });

    return article;
  }

  renderCardImages(mediaStrip, item, isExpanded) {
    // Preview up to three images; expanded cards render the full era image set.
    const visibleImages = isExpanded
      ? item.images
      : item.images.slice(0, MAX_DEFAULT_IMAGES);
    const hiddenCount = isExpanded
      ? 0
      : Math.max(item.images.length - visibleImages.length, 0);

    const imageElements = visibleImages.map((image) => {
      const figure = document.createElement("figure");
      figure.className = "timeline-card__image-frame";
      figure.setAttribute("aria-label", image.title);
      figure.dataset.fallbackText = "资料图片待补充";

      const img = document.createElement("img");
      img.className = "timeline-card__image-item";
      img.src = image.src;
      img.alt = image.title;
      img.title = image.caption;
      img.loading = "lazy";
      img.draggable = false;
      img.onerror = () => {
        img.onerror = null;
        img.hidden = true;
        figure.classList.add("is-missing");
      };

      figure.appendChild(img);

      return figure;
    });

    if (hiddenCount > 0) {
      const countLabel = document.createElement("span");
      countLabel.className = "timeline-card__hidden-count";
      countLabel.textContent = `+${hiddenCount}`;
      countLabel.setAttribute("aria-label", `${hiddenCount} more images`);
      imageElements.push(countLabel);
    }

    mediaStrip.replaceChildren(...imageElements);
  }

  toggleExpandedCard(index) {
    const nextExpandedIndex = this.expandedIndex === index ? null : index;

    if (this.expandedIndex !== null && this.expandedIndex !== nextExpandedIndex) {
      this.setCardExpanded(this.expandedIndex, false);
    }

    this.expandedIndex = nextExpandedIndex;

    if (this.expandedIndex !== null) {
      this.setCardExpanded(this.expandedIndex, true);
    }
  }

  setCardExpanded(index, isExpanded) {
    const element = this.cardElements[index];
    const item = this.data[index];
    const mediaStrip = element?.querySelector(".timeline-card__media-strip");

    if (!element || !item || !mediaStrip) {
      return;
    }

    element.classList.toggle("is-expanded", isExpanded);
    element.setAttribute("aria-expanded", String(isExpanded));
    this.renderCardImages(mediaStrip, item, isExpanded);
  }

  _getGlowTexture() {
    if (this._glowTex) return this._glowTex;
    const size = 128;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    gradient.addColorStop(0, "rgba(255,255,255,1)");
    gradient.addColorStop(0.08, "rgba(255,255,255,0.92)");
    gradient.addColorStop(0.25, "rgba(255,255,255,0.55)");
    gradient.addColorStop(0.5, "rgba(255,255,255,0.12)");
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    this._glowTex = new THREE.CanvasTexture(canvas);
    this._glowTex.needsUpdate = true;
    return this._glowTex;
  }

  createParticleMist() {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(PARTICLE_COUNT * 3);

    for (let index = 0; index < PARTICLE_COUNT; index += 1) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 120 + Math.random() * 880;
      const y = -1800 + Math.random() * 3600;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const offset = index * 3;

      positions[offset] = x;
      positions[offset + 1] = y;
      positions[offset + 2] = z;
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    const sizes = new Float32Array(PARTICLE_COUNT);
    for (let i = 0; i < PARTICLE_COUNT; i += 1) {
      sizes[i] = 2 + Math.random() * 4;
    }
    geometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.PointsMaterial({
      color: 0xe0d4bc,
      size: 8,
      map: this._getGlowTexture(),
      blending: THREE.AdditiveBlending,
      transparent: true,
      opacity: 0.20,
      depthWrite: false,
      sizeAttenuation: false
    });

    this.particleMist = new THREE.Points(geometry, material);
    this.webglGroup.add(this.particleMist);
  }

  update(elapsedTime) {
    if (this.particleMist) {
      this.particleMist.rotation.y = elapsedTime * 0.015;
      this.particleMist.position.y = Math.sin(elapsedTime * 0.32) * 22;
    }

    // Animate helix: uniform Y-axis rotation + per-particle organic drift
    if (this._timelineParticles && this._tlAngles) {
      const pos = this._timelineGeometry.attributes.position.array;
      const dt = Math.min(elapsedTime - (this._lastTlTime || elapsedTime), 0.05);
      this._lastTlTime = elapsedTime;

      for (let i = 0; i < this._tlCount; i++) {
        // Base helix rotation — uniform spin around Y
        this._tlOrgA[i] += this._tlRotSpeed * dt;

        // Organic drift: small random acceleration, damped
        this._tlAVels[i] += (Math.random() - 0.5) * 0.8;
        this._tlAVels[i] *= 0.94;
        this._tlYVels[i] += (Math.random() - 0.5) * 2;
        this._tlYVels[i] *= 0.94;

        // Apply drift to angle, radius, height — clamped near original
        const a = this._tlOrgA[i] + this._tlAVels[i] * 0.3;
        const r = this._tlOrgR[i] + Math.sin(elapsedTime * 1.2 + i * 0.1) * 1.5;
        const y = this._tlOrgY[i] + this._tlYVels[i] * 0.4;
        const yClamped = Math.max(-this._tlHalfSpan, Math.min(this._tlHalfSpan, y));

        const off = i * 3;
        pos[off] = Math.cos(a) * r;
        pos[off + 1] = yClamped;
        pos[off + 2] = Math.sin(a) * r;
      }

      this._timelineGeometry.attributes.position.needsUpdate = true;
    }

    // Sync text label group Y with spiral (no rotation) + camera-responsive particle drift
    if (this._textLabelGroup && this._textLabelOrigPositions && this.webglGroup) {
      this._textLabelGroup.position.y = this.webglGroup.position.y;

      const cur = this._textLabelCurrent;
      const orig = this._textLabelOrigPositions;
      const count = cur.length;

      // Track rotation speed for inertia effect
      if (this._prevRotationY === undefined) this._prevRotationY = this.webglGroup.rotation.y;
      const rotSpeed = this.webglGroup.rotation.y - this._prevRotationY;
      this._prevRotationY = this.webglGroup.rotation.y;

      // Particles lag behind rotation with inertia, then smoothly reform
      const force = Math.abs(rotSpeed) * 40; // displacement proportional to rotation speed
      const maxDrift = 8;

      for (let i = 0; i < count; i += 3) {
        // Inertia drift: particles pushed opposite to rotation direction
        const driftX = -rotSpeed * (orig[i + 1] - orig[1]) * 1.5;
        const targetX = orig[i] + Math.max(-maxDrift, Math.min(maxDrift, driftX));
        const targetY = orig[i + 1] + Math.sin(elapsedTime * 1.8 + i * 0.05) * 0.8;
        const targetZ = orig[i + 2] + Math.cos(elapsedTime * 1.5 + i * 0.05) * 0.8;

        cur[i] += (targetX - cur[i]) * (0.06 + Math.abs(rotSpeed) * 2);
        cur[i + 1] += (targetY - cur[i + 1]) * 0.06;
        cur[i + 2] += (targetZ - cur[i + 2]) * 0.06;
      }

      this._textLabelParticles.geometry.attributes.position.array.set(cur);
      this._textLabelParticles.geometry.attributes.position.needsUpdate = true;
    }
  }

  _getEraColor(eraId) {
    // Unified warm ink palette — subtle transitions within the same family
    const eraColors = {
      "era-1": [0xc4, 0x8a, 0x62], // 上古 — 暖赭石
      "era-2": [0xd4, 0xb8, 0x8c], // 古代 — 暖蜜色
      "era-3": [0xcc, 0xa8, 0x7a], // 近代 — 暖茶色
      "era-4": [0xe8, 0xdc, 0xc4]  // 现代 — 暖象牙白
    };
    return eraColors[eraId] || [0xcc, 0xb8, 0x96];
  }

  _getEraIdForY(y, n, hStep) {
    // Map Y position to era based on image index ranges
    const centerOffset = ((n - 1) * hStep) / 2;
    const idx = Math.round((y + centerOffset) / hStep);
    const clamped = Math.max(0, Math.min(n - 1, idx));
    if (clamped <= 1) return "era-1";       // 上古: indices 0–1
    if (clamped <= 12) return "era-2";       // 古代: indices 2–12
    if (clamped <= 15) return "era-3";       // 近代: indices 13–15
    return "era-4";                           // 现代: indices 16–19
  }

  createAttractorTimeline() {
    const glowTex = this._getGlowTexture();
    const n = this.imageData ? this.imageData.length : this.data.length;
    const hStep = this._spiralHeightStep || IMAGE_HEIGHT_STEP;
    const halfSpan = ((n - 1) * hStep) / 2 + 200;

    // ── Layer 1: Visible helix strands with organic particle wobble ──
    const helixRadii = [6, 12, 19, 26, 34, 42, 50, 58];
    const turns = 4.5;
    const ptsPerTurn = 250;
    const totalSpan = halfSpan * 2;
    const particleCount = helixRadii.length * Math.floor(turns * ptsPerTurn);

    const oGeo = new THREE.BufferGeometry();
    const oPos = new Float32Array(particleCount * 3);
    const oCol = new Float32Array(particleCount * 3);

    // Per-particle state for organic motion
    this._tlAngles = new Float32Array(particleCount);
    this._tlRadii = new Float32Array(particleCount);
    this._tlHeights = new Float32Array(particleCount);
    this._tlAVels = new Float32Array(particleCount);
    this._tlYVels = new Float32Array(particleCount);
    this._tlOrgR = new Float32Array(particleCount);
    this._tlOrgA = new Float32Array(particleCount);
    this._tlOrgY = new Float32Array(particleCount);
    this._tlCount = particleCount;
    this._tlHalfSpan = halfSpan;
    this._tlRotSpeed = 1.1;

    let idx = 0;
    for (let s = 0; s < helixRadii.length; s++) {
      const r = helixRadii[s];
      const phase = (s / helixRadii.length) * Math.PI * 2;
      const strandPts = Math.floor(turns * ptsPerTurn);

      for (let i = 0; i < strandPts; i++) {
        const t = i / ptsPerTurn;
        const angle = t * Math.PI * 2 * turns + phase;
        const y = -halfSpan + (i / strandPts) * totalSpan;

        oPos[idx * 3] = Math.cos(angle) * r;
        oPos[idx * 3 + 1] = y;
        oPos[idx * 3 + 2] = Math.sin(angle) * r;

        const eraId = this._getEraIdForY(y, n, hStep);
        const [cr, cg, cb] = this._getEraColor(eraId);
        oCol[idx * 3] = cr / 255;
        oCol[idx * 3 + 1] = cg / 255;
        oCol[idx * 3 + 2] = cb / 255;

        this._tlAngles[idx] = angle;
        this._tlRadii[idx] = r;
        this._tlHeights[idx] = y;
        this._tlOrgR[idx] = r;
        this._tlOrgA[idx] = angle;
        this._tlOrgY[idx] = y;
        this._tlAVels[idx] = (Math.random() - 0.5) * 0.3;
        this._tlYVels[idx] = (Math.random() - 0.5) * 3;

        idx++;
      }
    }

    oGeo.setAttribute("position", new THREE.BufferAttribute(oPos, 3));
    oGeo.setAttribute("color", new THREE.BufferAttribute(oCol, 3));

    const orbMat = new THREE.PointsMaterial({
      size: 12,
      map: glowTex,
      blending: THREE.AdditiveBlending,
      vertexColors: true,
      transparent: true,
      opacity: 0.68,
      depthWrite: false
    });

    this._timelineParticles = new THREE.Points(oGeo, orbMat);
    this._timelineGeometry = oGeo;
    this.webglGroup.add(this._timelineParticles);

    // ── Layer 2: Particle-text era labels (large bright particles forming characters) ──
    const eraLabelDefs = [
      { text: "上古", y: (0 + 1) / 2 * hStep - ((n - 1) * hStep) / 2, color: [0xd4, 0x9a, 0x6e] },
      { text: "古代", y: (2 + 12) / 2 * hStep - ((n - 1) * hStep) / 2, color: [0xde, 0xc4, 0x96] },
      { text: "近代", y: (13 + 15) / 2 * hStep - ((n - 1) * hStep) / 2, color: [0xd6, 0xb4, 0x84] },
      { text: "现代", y: (16 + (n - 1)) / 2 * hStep - ((n - 1) * hStep) / 2, color: [0xee, 0xe4, 0xce] }
    ];

    const charCanvas = document.createElement("canvas");
    charCanvas.width = 128;
    charCanvas.height = 128;
    const charCtx = charCanvas.getContext("2d");
    charCtx.font = "bold 96px 'FangSong', '仿宋', 'Noto Serif SC', serif";
    charCtx.fillStyle = "#ffffff";
    charCtx.textAlign = "center";
    charCtx.textBaseline = "middle";

    // Collect all particle-text positions
    const allPtPositions = [];
    const allPtColors = [];

    eraLabelDefs.forEach(({ text, y: centerY, color }) => {
      const chars = text.split("");
      const charSpacing = 100;  // vertical spacing between characters
      const charScale = 0.55;   // world units per canvas pixel
      const startY = centerY + ((chars.length - 1) * charSpacing) / 2;

      chars.forEach((ch, ci) => {
        charCtx.clearRect(0, 0, 128, 128);
        charCtx.fillText(ch, 64, 64);

        const imageData = charCtx.getImageData(0, 0, 128, 128);
        const pixels = imageData.data;

        for (let py = 0; py < 128; py += 2) {
          for (let px = 0; px < 128; px += 2) {
            const alpha = pixels[(py * 128 + px) * 4 + 3];
            if (alpha > 80) {
              const wx = (px - 64) * charScale;
              const wy = startY - ci * charSpacing + (64 - py) * charScale;
              allPtPositions.push(wx, wy, 0);
              allPtColors.push(color[0] / 255, color[1] / 255, color[2] / 255);
            }
          }
        }
      });
    });

    const labelCount = allPtPositions.length / 3;
    const lGeo = new THREE.BufferGeometry();
    lGeo.setAttribute(
      "position",
      new THREE.BufferAttribute(new Float32Array(allPtPositions), 3)
    );
    lGeo.setAttribute(
      "color",
      new THREE.BufferAttribute(new Float32Array(allPtColors), 3)
    );

    const lMat = new THREE.PointsMaterial({
      size: 8,
      map: glowTex,
      blending: THREE.AdditiveBlending,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      depthWrite: false
    });

    this._textLabelParticles = new THREE.Points(lGeo, lMat);

    // Store original positions for scatter/reassemble animation
    this._textLabelOrigPositions = new Float32Array(allPtPositions);
    this._textLabelTargets = new Float32Array(allPtPositions);
    this._textLabelCurrent = new Float32Array(allPtPositions);

    // Independent group — not affected by spiral Y-rotation
    this._textLabelGroup = new THREE.Group();
    this._textLabelGroup.add(this._textLabelParticles);
    this.webglScene.add(this._textLabelGroup);
  }

  updateActiveState(activeIndex) {
    this.cardElements.forEach((element, index) => {
      const isActive = index === activeIndex;

      element.classList.toggle("is-active", isActive);

      if (isActive) {
        element.setAttribute("aria-current", "step");
      } else {
        element.removeAttribute("aria-current");
      }
    });

  }

  getGroups() {
    return {
      cssGroup: this.cssGroup,
      webglGroup: this.webglGroup
    };
  }
}
