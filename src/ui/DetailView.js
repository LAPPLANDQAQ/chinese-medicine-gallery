export class DetailView {
  constructor() {
    this._isAnimating = false;
    this._isOpen = false;
    this._streamTimers = [];
    this._overlay = null;
    this._zoomImg = null;
    this._zoomTitle = null;
    this._closeBtn = null;
    this._textPanel = null;
    this._createDOM();
    this._bindEvents();
  }

  _createDOM() {
    const overlay = document.createElement("div");
    overlay.className = "detail-overlay";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-label", "图片资料详情");
    overlay.innerHTML = `<div class="detail-overlay__backdrop"></div>`;

    const zoomImg = document.createElement("img");
    zoomImg.className = "detail-zoom-image";
    zoomImg.alt = "";
    zoomImg.style.opacity = "0";

    // Title — centered above image, synced with image animation
    const zoomTitle = document.createElement("div");
    zoomTitle.className = "detail-zoom-title";

    const closeBtn = document.createElement("button");
    closeBtn.className = "detail-overlay__close";
    closeBtn.setAttribute("aria-label", "关闭详情");
    closeBtn.textContent = "✕";

    const textPanel = document.createElement("div");
    textPanel.className = "detail-text-panel";
    textPanel.innerHTML = `
      <p class="detail-text-panel__period"></p>
      <p class="detail-text-panel__caption"></p>
      <p class="detail-text-panel__description"></p>
      <hr class="detail-text-panel__divider" />
      <h3 class="detail-text-panel__era-title"></h3>
      <p class="detail-text-panel__era-summary"></p>
      <div class="detail-text-panel__sections"></div>
    `;

    document.body.appendChild(overlay);
    document.body.appendChild(zoomImg);
    document.body.appendChild(zoomTitle);
    document.body.appendChild(closeBtn);
    document.body.appendChild(textPanel);

    this._overlay = overlay;
    this._zoomImg = zoomImg;
    this._zoomTitle = zoomTitle;
    this._closeBtn = closeBtn;
    this._textPanel = textPanel;

    this._periodEl = textPanel.querySelector(".detail-text-panel__period");
    this._captionEl = textPanel.querySelector(".detail-text-panel__caption");
    this._descEl = textPanel.querySelector(".detail-text-panel__description");
    this._dividerEl = textPanel.querySelector(".detail-text-panel__divider");
    this._eraTitleEl = textPanel.querySelector(".detail-text-panel__era-title");
    this._eraSummaryEl = textPanel.querySelector(".detail-text-panel__era-summary");
    this._sectionsEl = textPanel.querySelector(".detail-text-panel__sections");
  }

  _bindEvents() {
    this._closeBtn.addEventListener("click", () => this.close());
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this._isOpen) this.close();
    });
  }

  _stopAllStreams() {
    this._streamTimers.forEach(clearInterval);
    this._streamTimers = [];
  }

  open(itemData, sourceImg) {
    if (this._isAnimating || this._isOpen) return;
    this._isAnimating = true;
    this._itemData = itemData;
    this._sourceImg = sourceImg;

    const srcRect = sourceImg.getBoundingClientRect();
    const viewW = window.innerWidth;
    const viewH = window.innerHeight;

    // Image = 70% of left half width
    const maxW = viewW * 0.48 * 0.7;
    const maxH = viewH * 0.74;
    const scale = Math.min(maxW / srcRect.width, maxH / srcRect.height, 1.3);
    const finalW = srcRect.width * scale;
    const finalH = srcRect.height * scale;

    const leftMargin = (viewW * 0.48 - finalW) / 2;
    const targetLeft = Math.max(viewW * 0.04, leftMargin);
    const targetTop = (viewH - finalH) / 2;

    // Phase A: image from source → left-half position
    this._zoomImg.src = sourceImg.src;
    this._zoomImg.alt = sourceImg.alt;
    this._zoomImg.style.opacity = "1";
    this._zoomImg.style.width = `${srcRect.width}px`;
    this._zoomImg.style.height = `${srcRect.height}px`;
    this._zoomImg.style.left = `${srcRect.left}px`;
    this._zoomImg.style.top = `${srcRect.top}px`;
    this._zoomImg.style.borderRadius = "2px";

    // Title synced with image
    this._zoomTitle.textContent = itemData.title;
    this._zoomTitle.classList.remove("is-visible");

    this._overlay.classList.add("is-open");
    this._isOpen = true;

    this._zoomImg.offsetHeight;
    requestAnimationFrame(() => {
      this._zoomImg.style.width = `${finalW}px`;
      this._zoomImg.style.height = `${finalH}px`;
      this._zoomImg.style.left = `${targetLeft}px`;
      this._zoomImg.style.top = `${targetTop}px`;
      // Title fades in with image
      this._zoomTitle.classList.add("is-visible");
    });

    // Phase B: after transition, show close + stream text
    setTimeout(() => {
      this._closeBtn.classList.add("is-visible");
      this._startTextStream();
      this._isAnimating = false;
    }, 540);
  }

  _startTextStream() {
    this._stopAllStreams();
    const item = this._itemData;
    const speed = 8;
    const descSpeed = 4; // faster for long description text

    [this._periodEl, this._captionEl, this._descEl,
     this._eraTitleEl, this._eraSummaryEl].forEach(el => { if (el) el.textContent = ""; });
    this._sectionsEl.innerHTML = "";
    this._dividerEl.classList.remove("is-visible");
    this._textPanel.classList.add("is-visible");

    const stream = (el, text, onDone, charSpeed) => {
      const spd = charSpeed || speed;
      if (!el || !text) { if (onDone) onDone(); return; }
      let i = 0;
      el.textContent = "";
      const timer = setInterval(() => {
        el.textContent += text[i]; i++;
        if (i >= text.length) { clearInterval(timer); if (onDone) onDone(); }
      }, spd);
      this._streamTimers.push(timer);
    };

    stream(this._periodEl, item.period, () => {
      stream(this._captionEl, item.caption, () => {
        stream(this._descEl, item.description || "", () => {}, descSpeed);
      });
    });
  }

  _streamSections(sections) {
    if (!sections?.length) return;
    let idx = 0;
    const next = () => {
      if (idx >= sections.length) return;
      const sec = sections[idx];
      const el = document.createElement("div");
      el.className = "detail-text-panel__section";
      el.innerHTML = "<h3></h3><p></p>";
      this._sectionsEl.appendChild(el);
      requestAnimationFrame(() => el.classList.add("is-visible"));
      const h3 = el.querySelector("h3");
      const p = el.querySelector("p");
      let i = 0;
      const t1 = setInterval(() => {
        h3.textContent += sec.heading[i]; i++;
        if (i >= sec.heading.length) {
          clearInterval(t1);
          let j = 0;
          const t2 = setInterval(() => {
            p.textContent += sec.content[j]; j++;
            if (j >= sec.content.length) { clearInterval(t2); idx++; setTimeout(next, 40); }
          }, 10);
        }
      }, 10);
      this._streamTimers.push(t1);
    };
    setTimeout(next, 20);
  }

  close() {
    if (this._isAnimating || !this._isOpen) return;
    this._isAnimating = true;
    this._stopAllStreams();

    this._textPanel.classList.remove("is-visible");
    this._closeBtn.classList.remove("is-visible");
    this._zoomTitle.classList.remove("is-visible");
    this._overlay.classList.remove("is-open");

    if (this._sourceImg) {
      const r = this._sourceImg.getBoundingClientRect();
      this._zoomImg.style.width = `${r.width}px`;
      this._zoomImg.style.height = `${r.height}px`;
      this._zoomImg.style.left = `${r.left}px`;
      this._zoomImg.style.top = `${r.top}px`;
    }

    setTimeout(() => {
      this._zoomImg.style.opacity = "0";
      this._zoomImg.src = "";
      this._zoomTitle.textContent = "";
      this._sectionsEl.innerHTML = "";
      this._isOpen = false;
      this._isAnimating = false;
    }, 540);
  }
}
