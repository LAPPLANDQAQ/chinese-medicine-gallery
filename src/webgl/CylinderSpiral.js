import * as THREE from "three";
import { CSS3DObject } from "three/addons/renderers/CSS3DRenderer.js";

const RADIUS = 760;
const HEIGHT_STEP = 460;
const ANGLE_STEP = Math.PI * 0.62;
const MAX_DEFAULT_IMAGES = 3;
const PARTICLE_COUNT = 1200;

export class CylinderSpiral {
  constructor({ data, cssScene, webglScene }) {
    if (!Array.isArray(data) || !cssScene || !webglScene) {
      throw new Error("CylinderSpiral requires data, cssScene, and webglScene.");
    }

    this.data = data;
    this.cssScene = cssScene;
    this.webglScene = webglScene;
    this.cssGroup = new THREE.Group();
    this.webglGroup = new THREE.Group();
    this.cardObjects = [];
    this.cardElements = [];
    this.expandedIndex = null;

    this.cssScene.add(this.cssGroup);
    this.webglScene.add(this.webglGroup);

    this.createCards();
    this.createParticleMist();
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

  createParticleMist() {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(PARTICLE_COUNT * 3);

    for (let index = 0; index < PARTICLE_COUNT; index += 1) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 160 + Math.random() * 820;
      const y = -1000 + Math.random() * 2000;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const offset = index * 3;

      positions[offset] = x;
      positions[offset + 1] = y;
      positions[offset + 2] = z;
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: 0xd8aa5b,
      size: 4,
      transparent: true,
      opacity: 0.42,
      depthWrite: false
    });

    this.particleMist = new THREE.Points(geometry, material);
    this.webglGroup.add(this.particleMist);
  }

  update(elapsedTime) {
    if (!this.particleMist) {
      return;
    }

    this.particleMist.rotation.y = elapsedTime * 0.035;
    this.particleMist.position.y = Math.sin(elapsedTime * 0.45) * 18;
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
