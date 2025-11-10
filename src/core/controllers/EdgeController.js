// ============================================================================
// FILE: src/core/controllers/EdgeController.js
// ============================================================================
export class EdgeController {
  constructor(edgeView, edgeManager, eventBus) {
    this.view = edgeView;
    this.model = edgeView.model;
    this.edgeManager = edgeManager;
    this.eventBus = eventBus;
    this.attachEventListeners();
  }

  attachEventListeners() {
    const element = this.view.element;
    if (!element) return;

    element.addEventListener("click", this.handleClick.bind(this));
    element.addEventListener("contextmenu", this.handleContextMenu.bind(this));
  }

  handleClick(e) {
    e.stopPropagation();
    this.eventBus.emit("edge:selected", this.model);
  }

  handleContextMenu(e) {
    e.preventDefault();
    e.stopPropagation();
    this.eventBus.emit("edge:contextmenu", {
      edge: this.model,
      position: { x: e.clientX, y: e.clientY },
    });
  }

  destroy() {
    // Cleanup
  }
}
