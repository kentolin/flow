// ============================================================================
// FILE: src/core/controllers/DragController.js
// ============================================================================
export class DragController {
  constructor(nodeView, nodeManager, eventBus) {
    this.view = nodeView;
    this.model = nodeView.model;
    this.nodeManager = nodeManager;
    this.eventBus = eventBus;
    this.isDragging = false;
    this.startX = 0;
    this.startY = 0;
    this.initialX = 0;
    this.initialY = 0;
  }

  start(e) {
    this.isDragging = true;
    this.startX = e.clientX;
    this.startY = e.clientY;
    this.initialX = this.model.x;
    this.initialY = this.model.y;

    document.addEventListener("mousemove", this.handleMouseMove);
    document.addEventListener("mouseup", this.handleMouseUp);

    this.eventBus.emit("node:drag:start", this.model);
  }

  handleMouseMove = (e) => {
    if (!this.isDragging) return;

    const dx = e.clientX - this.startX;
    const dy = e.clientY - this.startY;

    this.model.x = this.initialX + dx;
    this.model.y = this.initialY + dy;

    this.view.update();
    this.eventBus.emit("node:drag:move", this.model);
  };

  handleMouseUp = (e) => {
    if (!this.isDragging) return;

    this.isDragging = false;
    document.removeEventListener("mousemove", this.handleMouseMove);
    document.removeEventListener("mouseup", this.handleMouseUp);

    this.eventBus.emit("node:drag:end", this.model);
  };

  destroy() {
    document.removeEventListener("mousemove", this.handleMouseMove);
    document.removeEventListener("mouseup", this.handleMouseUp);
  }
}
