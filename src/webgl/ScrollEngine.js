export class ScrollEngine {
  constructor({
    cssGroup,
    webglGroup,
    totalItems,
    heightStep,
    angleStep,
    onActiveChange
  }) {
    if (!cssGroup || !webglGroup) {
      throw new Error("ScrollEngine requires cssGroup and webglGroup.");
    }

    this.cssGroup = cssGroup;
    this.webglGroup = webglGroup;
    this.totalItems = totalItems;
    this.heightStep = heightStep;
    this.angleStep = angleStep;
    this.onActiveChange = onActiveChange;

    this.targetProgress = 0;
    this.currentProgress = 0;
    this.lerpFactor = 0.09;
    this.activeIndex = 0;

    this.gsap = window.gsap;
    this.ScrollTrigger = window.ScrollTrigger;

    if (!this.gsap || !this.ScrollTrigger) {
      throw new Error("GSAP and ScrollTrigger must be loaded before ScrollEngine.");
    }

    this.gsap.registerPlugin(this.ScrollTrigger);

    this.scrollTrigger = this.ScrollTrigger.create({
      trigger: "#scroll-stage",
      start: "top top",
      end: "bottom bottom",
      scrub: 1,
      onUpdate: (self) => {
        this.targetProgress = self.progress;
      }
    });
  }

  update() {
    // Map normalized scroll progress to shared group transforms, not per-card tweens.
    this.currentProgress +=
      (this.targetProgress - this.currentProgress) * this.lerpFactor;

    const maxIndex = Math.max(this.totalItems - 1, 0);
    const targetIndex = this.currentProgress * maxIndex;
    const rotationY = -targetIndex * this.angleStep;
    const positionY = -targetIndex * this.heightStep;

    this.cssGroup.rotation.y = rotationY;
    this.cssGroup.position.y = positionY;
    this.webglGroup.rotation.y = rotationY;
    this.webglGroup.position.y = positionY;

    const nextActiveIndex = this.clampIndex(
      Math.round(this.currentProgress * maxIndex)
    );

    if (nextActiveIndex !== this.activeIndex) {
      this.activeIndex = nextActiveIndex;
      this.onActiveChange?.(this.activeIndex);
    }
  }

  clampIndex(index) {
    return Math.min(Math.max(index, 0), Math.max(this.totalItems - 1, 0));
  }

  destroy() {
    this.scrollTrigger?.kill();
  }
}
