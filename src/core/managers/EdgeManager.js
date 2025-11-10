// ============================================================================
// FILE: src/core/managers/EdgeManager.js
// ============================================================================
import { EdgeModel } from "../models/EdgeModel.js";
import { EdgeView } from "../views/EdgeView.js";
import { EdgeController } from "../controllers/EdgeController.js";

export class EdgeManager {
  constructor(editor, nodeManager, eventBus) {
    this.editor = editor;
    this.nodeManager = nodeManager;
    this.eventBus = eventBus;
    this.edges = new Map();
    this.views = new Map();
    this.controllers = new Map();
  }

  createEdge(sourceId, targetId, options = {}) {
    const sourceNode = this.nodeManager.getNode(sourceId);
    const targetNode = this.nodeManager.getNode(targetId);

    if (!sourceNode || !targetNode) {
      throw new Error("Source or target node not found");
    }

    const edgeData = {
      sourceId,
      targetId,
      type: options.type || "bezier",
      label: options.label || "",
      style: options.style || {},
      ...options,
    };

    const model = new EdgeModel(edgeData);
    const view = new EdgeView(model, this.nodeManager);
    const controller = new EdgeController(view, this, this.eventBus);

    this.edges.set(model.id, model);
    this.views.set(model.id, view);
    this.controllers.set(model.id, controller);

    const element = view.render();
    this.editor.addEdge(element);

    this.eventBus.emit("edge:created", model);
    return model;
  }

  getEdge(edgeId) {
    return this.edges.get(edgeId);
  }

  removeEdge(edgeId) {
    const model = this.edges.get(edgeId);
    if (!model) return;

    const view = this.views.get(edgeId);
    const controller = this.controllers.get(edgeId);

    if (view) view.destroy();
    if (controller) controller.destroy();

    this.edges.delete(edgeId);
    this.views.delete(edgeId);
    this.controllers.delete(edgeId);

    this.eventBus.emit("edge:removed", model);
  }

  updateEdge(edgeId, updates) {
    const model = this.edges.get(edgeId);
    if (!model) return;

    Object.assign(model, updates);

    const view = this.views.get(edgeId);
    if (view) view.update();

    this.eventBus.emit("edge:updated", model);
  }

  getAllEdges() {
    return Array.from(this.edges.values());
  }

  getEdgesForNode(nodeId) {
    return Array.from(this.edges.values()).filter(
      (edge) => edge.sourceId === nodeId || edge.targetId === nodeId
    );
  }

  clear() {
    this.edges.forEach((_, edgeId) => this.removeEdge(edgeId));
  }

  updateEdgesForNode(nodeId) {
    const edges = this.getEdgesForNode(nodeId);
    edges.forEach((edge) => {
      const view = this.views.get(edge.id);
      if (view) view.update();
    });
  }
}
