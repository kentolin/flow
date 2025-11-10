// ============================================================================
// FILE: src/ui/bars/StatusBar.js
// ============================================================================
export class StatusBar {
  constructor(eventBus) {
    this.eventBus = eventBus;
    this.element = null;
  }

  render() {
    this.element = document.createElement("div");
    this.element.className = "status-bar";

    this.element.innerHTML = `
      <div class="status-item" id="cursor-position">X: 0, Y: 0</div>
      <div class="status-item" id="zoom-level">Zoom: 100%</div>
      <div class="status-item" id="selection-count">Selected: 0</div>
    `;

    this.attachEventListeners();
    return this.element;
  }

  attachEventListeners() {
    this.eventBus.on("viewport:changed", (viewport) => {
      const zoomEl = this.element.querySelector("#zoom-level");
      if (zoomEl) {
        zoomEl.textContent = `Zoom: ${Math.round(viewport.zoom * 100)}%`;
      }
    });

    this.eventBus.on("selection:changed", (selection) => {
      const countEl = this.element.querySelector("#selection-count");
      if (countEl) {
        const total = selection.nodes.length + selection.edges.length;
        countEl.textContent = `Selected: ${total}`;
      }
    });
  }

  updateCursorPosition(x, y) {
    const posEl = this.element.querySelector("#cursor-position");
    if (posEl) {
      posEl.textContent = `X: ${Math.round(x)}, Y: ${Math.round(y)}`;
    }
  }
}
