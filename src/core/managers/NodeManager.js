// ============================================================================
// FILE: src/core/managers/NodeManager.js
// ============================================================================
import { NodeModel } from "../models/NodeModel.js";
import { NodeView } from "../views/NodeView.js";
import { NodeController } from "../controllers/NodeController.js";

export class NodeManager {
  constructor(editor, shapeRegistry, eventBus) {
    this.editor = editor;
    this.shapeRegistry = shapeRegistry;
    this.eventBus = eventBus;
    this.nodes = new Map();
    this.views = new Map();
    this.controllers = new Map();
  }

  createNode(type, x, y, options = {}) {
    const shape = this.shapeRegistry.getShape(type);
    if (!shape) {
      throw new Error(`Shape type ${type} not found`);
    }

    const nodeData = {
      type,
      x,
      y,
      width: options.width || shape.defaultWidth || 100,
      height: options.height || shape.defaultHeight || 60,
      label: options.label || "",
      style: options.style || {},
      ports: options.ports || shape.defaultPorts || [],
      ...options,
    };

    const model = new NodeModel(nodeData);
    const shapeRenderer = shape.createRenderer();
    const view = new NodeView(model, shapeRenderer);
    const controller = new NodeController(view, this, this.eventBus);

    this.nodes.set(model.id, model);
    this.views.set(model.id, view);
    this.controllers.set(model.id, controller);

    const element = view.render();
    this.editor.addNode(element);

    this.eventBus.emit("node:created", model);
    return model;
  }

  getNode(nodeId) {
    return this.nodes.get(nodeId);
  }

  getView(nodeId) {
    return this.views.get(nodeId);
  }

  removeNode(nodeId) {
    const model = this.nodes.get(nodeId);
    if (!model) return;

    const view = this.views.get(nodeId);
    const controller = this.controllers.get(nodeId);

    if (view) view.destroy();
    if (controller) controller.destroy();

    this.nodes.delete(nodeId);
    this.views.delete(nodeId);
    this.controllers.delete(nodeId);

    this.eventBus.emit("node:removed", model);
  }

  updateNode(nodeId, updates) {
    const model = this.nodes.get(nodeId);
    if (!model) return;

    Object.assign(model, updates);

    const view = this.views.get(nodeId);
    if (view) view.update();

    this.eventBus.emit("node:updated", model);
  }

  getAllNodes() {
    return Array.from(this.nodes.values());
  }

  clear() {
    this.nodes.forEach((_, nodeId) => this.removeNode(nodeId));
  }

  getNodeAt(x, y) {
    for (const node of this.nodes.values()) {
      if (node.contains(x, y)) {
        return node;
      }
    }
    return null;
  }
}
