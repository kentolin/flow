// ============================================================================
// FILE: src/core/controllers/ResizeController.js
// ============================================================================
export class ResizeController {
  constructor(nodeView, handle, eventBus, snapManager = null) {
    this.view = nodeView;
    this.model = nodeView.model;
    this.handle = handle;
    this.eventBus = eventBus;
    this.snapManager = snapManager;
    this.isResizing = false;
    this.startX = 0;
    this.startY = 0;
    this.initialBounds = null;
    this.minWidth = 50;
    this.minHeight = 30;
    this.aspectRatio = null;
    this.maintainAspectRatio = false;
  }

  start(e) {
    this.isResizing = true;
    this.startX = e.clientX;
    this.startY = e.clientY;
    this.initialBounds = { ...this.model.getBounds() };
    this.aspectRatio = this.initialBounds.width / this.initialBounds.height;
    this.maintainAspectRatio = e.shiftKey;

    document.addEventListener("mousemove", this.handleMouseMove);
    document.addEventListener("mouseup", this.handleMouseUp);
    document.addEventListener("keydown", this.handleKeyDown);
    document.addEventListener("keyup", this.handleKeyUp);

    document.body.style.cursor = this.getCursor();
    this.eventBus.emit("node:resize:start", this.model);
  }

  handleMouseMove = (e) => {
    if (!this.isResizing) return;

    const dx = e.clientX - this.startX;
    const dy = e.clientY - this.startY;

    this.maintainAspectRatio = e.shiftKey;
    this.applyResize(dx, dy);

    this.view.update();
    this.eventBus.emit("node:resize:move", this.model);
  };

  handleKeyDown = (e) => {
    if (e.key === "Shift") {
      this.maintainAspectRatio = true;
      this.applyResize(
        this.model.x - this.initialBounds.x,
        this.model.y - this.initialBounds.y
      );
      this.view.update();
    }
  };

  handleKeyUp = (e) => {
    if (e.key === "Shift") {
      this.maintainAspectRatio = false;
    }
  };

  applyResize(dx, dy) {
    const bounds = { ...this.initialBounds };

    switch (this.handle) {
      case "se":
        this.resizeSouthEast(bounds, dx, dy);
        break;
      case "sw":
        this.resizeSouthWest(bounds, dx, dy);
        break;
      case "ne":
        this.resizeNorthEast(bounds, dx, dy);
        break;
      case "nw":
        this.resizeNorthWest(bounds, dx, dy);
        break;
      case "n":
        this.resizeNorth(bounds, dy);
        break;
      case "s":
        this.resizeSouth(bounds, dy);
        break;
      case "e":
        this.resizeEast(bounds, dx);
        break;
      case "w":
        this.resizeWest(bounds, dx);
        break;
    }

    this.applyConstraints();
    this.applySnapping();
  }

  resizeSouthEast(bounds, dx, dy) {
    if (this.maintainAspectRatio) {
      const maxDelta = Math.max(Math.abs(dx), Math.abs(dy));
      this.model.width = Math.max(this.minWidth, bounds.width + maxDelta);
      this.model.height = Math.max(
        this.minHeight,
        this.model.width / this.aspectRatio
      );
    } else {
      this.model.width = Math.max(this.minWidth, bounds.width + dx);
      this.model.height = Math.max(this.minHeight, bounds.height + dy);
    }
  }

  resizeSouthWest(bounds, dx, dy) {
    if (this.maintainAspectRatio) {
      const maxDelta = Math.max(Math.abs(dx), Math.abs(dy));
      this.model.width = Math.max(this.minWidth, bounds.width - maxDelta);
      this.model.height = Math.max(
        this.minHeight,
        this.model.width / this.aspectRatio
      );
      this.model.x = bounds.x + (bounds.width - this.model.width);
    } else {
      this.model.width = Math.max(this.minWidth, bounds.width - dx);
      this.model.height = Math.max(this.minHeight, bounds.height + dy);
      this.model.x = bounds.x + (bounds.width - this.model.width);
    }
  }

  resizeNorthEast(bounds, dx, dy) {
    if (this.maintainAspectRatio) {
      const maxDelta = Math.max(Math.abs(dx), Math.abs(dy));
      this.model.width = Math.max(this.minWidth, bounds.width + maxDelta);
      this.model.height = Math.max(
        this.minHeight,
        this.model.width / this.aspectRatio
      );
      this.model.y = bounds.y + (bounds.height - this.model.height);
    } else {
      this.model.width = Math.max(this.minWidth, bounds.width + dx);
      this.model.height = Math.max(this.minHeight, bounds.height - dy);
      this.model.y = bounds.y + (bounds.height - this.model.height);
    }
  }

  resizeNorthWest(bounds, dx, dy) {
    if (this.maintainAspectRatio) {
      const maxDelta = Math.max(Math.abs(dx), Math.abs(dy));
      this.model.width = Math.max(this.minWidth, bounds.width - maxDelta);
      this.model.height = Math.max(
        this.minHeight,
        this.model.width / this.aspectRatio
      );
      this.model.x = bounds.x + (bounds.width - this.model.width);
      this.model.y = bounds.y + (bounds.height - this.model.height);
    } else {
      this.model.width = Math.max(this.minWidth, bounds.width - dx);
      this.model.height = Math.max(this.minHeight, bounds.height - dy);
      this.model.x = bounds.x + (bounds.width - this.model.width);
      this.model.y = bounds.y + (bounds.height - this.model.height);
    }
  }

  resizeNorth(bounds, dy) {
    this.model.height = Math.max(this.minHeight, bounds.height - dy);
    this.model.y = bounds.y + (bounds.height - this.model.height);
  }

  resizeSouth(bounds, dy) {
    this.model.height = Math.max(this.minHeight, bounds.height + dy);
  }

  resizeEast(bounds, dx) {
    this.model.width = Math.max(this.minWidth, bounds.width + dx);
  }

  resizeWest(bounds, dx) {
    this.model.width = Math.max(this.minWidth, bounds.width - dx);
    this.model.x = bounds.x + (bounds.width - this.model.width);
  }

  applyConstraints() {
    this.model.width = Math.max(this.minWidth, this.model.width);
    this.model.height = Math.max(this.minHeight, this.model.height);
  }

  applySnapping() {
    if (this.snapManager && this.snapManager.enabled) {
      const snapped = this.snapManager.snapToGrid(
        this.model.width,
        this.model.height
      );
      this.model.width = snapped.x;
      this.model.height = snapped.y;
    }
  }

  getCursor() {
    const cursors = {
      n: "ns-resize",
      s: "ns-resize",
      e: "ew-resize",
      w: "ew-resize",
      ne: "nesw-resize",
      sw: "nesw-resize",
      nw: "nwse-resize",
      se: "nwse-resize",
    };
    return cursors[this.handle] || "default";
  }

  handleMouseUp = (e) => {
    if (!this.isResizing) return;

    this.isResizing = false;
    document.removeEventListener("mousemove", this.handleMouseMove);
    document.removeEventListener("mouseup", this.handleMouseUp);
    document.removeEventListener("keydown", this.handleKeyDown);
    document.removeEventListener("keyup", this.handleKeyUp);

    document.body.style.cursor = "default";
    this.eventBus.emit("node:resize:end", this.model);
  };

  destroy() {
    document.removeEventListener("mousemove", this.handleMouseMove);
    document.removeEventListener("mouseup", this.handleMouseUp);
    document.removeEventListener("keydown", this.handleKeyDown);
    document.removeEventListener("keyup", this.handleKeyUp);
  }
}
