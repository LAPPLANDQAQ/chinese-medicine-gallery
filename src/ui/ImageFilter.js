const FILTER_OPTIONS = [
  { label: "全部", eraId: null },
  { label: "上古", eraId: "era-1" },
  { label: "古代", eraId: "era-2" },
  { label: "近代", eraId: "era-3" },
  { label: "现代", eraId: "era-4" }
];

export class ImageFilter {
  constructor({ onFilterChange } = {}) {
    this.onFilterChange = onFilterChange || (() => {});
    this._activeEraId = null; // null means "all"
    this._buttons = [];
    this._createDOM();
  }

  _createDOM() {
    const nav = document.createElement("nav");
    nav.className = "filter-bar";
    nav.setAttribute("aria-label", "时期筛选");

    FILTER_OPTIONS.forEach((option, index) => {
      const btn = document.createElement("button");
      btn.className = "filter-tag";
      btn.textContent = option.label;
      btn.setAttribute("data-filter", option.eraId || "all");
      btn.setAttribute("type", "button");

      // "全部" is active by default
      if (option.eraId === null) {
        btn.classList.add("is-active");
      }

      btn.addEventListener("click", () => {
        this._handleClick(option.eraId, btn);
      });

      nav.appendChild(btn);
      this._buttons.push({ element: btn, eraId: option.eraId });
    });

    // Append to #app so it sits above the 3D scene
    const app = document.querySelector("#app");
    if (app) {
      app.appendChild(nav);
    } else {
      document.body.appendChild(nav);
    }
  }

  _handleClick(eraId, clickedBtn) {
    // Toggle: if clicking the already-active button, reset to "all"
    const nextEraId = this._activeEraId === eraId ? null : eraId;

    this._activeEraId = nextEraId;

    // Update button states
    this._buttons.forEach(({ element, eraId: optEraId }) => {
      element.classList.toggle("is-active", optEraId === this._activeEraId);
    });

    this.onFilterChange(this._activeEraId);
  }
}
