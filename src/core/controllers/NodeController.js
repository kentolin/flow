// ============================================================================
// FILE: src/core/controllers/NodeController.js
// ============================================================================
import { DragController } from "./DragController.js";
import { ResizeController } from "./ResizeController.js";

export class NodeController {
  constructor(nodeView, nodeManager, eventBus) {
    this.view = nodeView;
    this.model = nodeView.model;
    this.nodeManager = nodeManager;
    this.eventBus = eventBus;
    this.dragController = null;
    this.resizeController = null;
    this.attachEventListeners();
  }

  attachEventListeners() {
    const element = this.view.element;
    if (!element) return;

    element.addEventListener("mousedown", this.handleMouseDown.bind(this));
    element.addEventListener("dblclick", this.handleDoubleClick.bind(this));
    element.addEventListener("contextmenu", this.handleContextMenu.bind(this));
  }

  handleMouseDown(e) {
    e.stopPropagation();

    // Check if clicking on handle or port
    if (e.target.classList.contains("handle")) {
      this.startResize(e);
    } else if (e.target.classList.contains("port")) {
      this.startConnection(e);
    } else {
      this.startDrag(e);
    }
  }

  startDrag(e) {
    this.dragController = new DragController(
      this.view,
      this.nodeManager,
      this.eventBus
    );
    this.dragController.start(e);
  }

  startResize(e) {
    const handle = e.target.getAttribute("data-handle");
    this.resizeController = new ResizeController(
      this.view,
      handle,
      this.eventBus
    );
    this.resizeController.start(e);
  }

  startConnection(e) {
    const portId = e.target.getAttribute("data-port-id");
    this.eventBus.emit("port:connection:start", {
      nodeId: this.model.id,
      portId: portId,
      position: { x: e.clientX, y: e.clientY },
    });
  }

  handleDoubleClick(e) {
    e.stopPropagation();
    this.eventBus.emit("node:edit", this.model);
  }

  handleContextMenu(e) {
    e.preventDefault();
    e.stopPropagation();
    this.eventBus.emit("node:contextmenu", {
      node: this.model,
      position: { x: e.clientX, y: e.clientY },
    });
  }

  destroy() {
    if (this.dragController) {
      this.dragController.destroy();
    }
    if (this.resizeController) {
      this.resizeController.destroy();
    }
  }
}
