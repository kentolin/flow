/**
 * EdgeManager - Manages edge creation, updates, deletion, and lifecycle
 * Coordinates connections between nodes
 */

import { EdgeModel } from "../models/EdgeModel.js";
import { EdgeView } from "../views/EdgeView.js";
import { EdgeController } from "../controllers/EdgeController.js";

class EdgeManager {
  constructor(editor, stateManager, eventBus, validationManager) {
    this.editor = editor;
    this.stateManager = stateManager;
    this.eventBus = eventBus;
    this.validationManager = validationManager;

    this.edges = new Map(); // edgeId -> EdgeModel
    this.views = new Map(); // edgeId -> EdgeView
    this.controllers = new Map(); // edgeId -> EdgeController

    this._edgeIdCounter = 0;

    // Track edges by node for quick lookup
    this.nodeEdges = new Map(); // nodeId -> Set of edgeIds
  }

  /**
   * Create a new edge
   * @param {string} sourceId - Source node ID
   * @param {string} targetId - Target node ID
   * @param {Object} options - Additional options
   */
  createEdge(sourceId, targetId, options = {}) {
    // Validate connection
    if (!this.validationManager.validateConnection(sourceId, targetId)) {
      console.warn(`Connection from ${sourceId} to ${targetId} is not allowed`);
      return null;
    }

    const edgeId = `edge_${++this._edgeIdCounter}`;

    // Create model
    const edgeModel = new EdgeModel({
      id: edgeId,
      sourceId,
      targetId,
      type: options.type || "straight", // 'straight', 'bezier', 'orthogonal'
      label: options.label || "",
      style: options.style || {},
    });

    // Create view
    const edgeView = new EdgeView(edgeModel, this.eventBus);

    // Create controller
    const edgeController = new EdgeController(
      edgeModel,
      edgeView,
      this.editor,
      this.eventBus,
      this.stateManager
    );

    // Store references
    this.edges.set(edgeId, edgeModel);
    this.views.set(edgeId, edgeView);
    this.controllers.set(edgeId, edgeController);

    // Track node edges
    if (!this.nodeEdges.has(sourceId)) {
      this.nodeEdges.set(sourceId, new Set());
    }
    if (!this.nodeEdges.has(targetId)) {
      this.nodeEdges.set(targetId, new Set());
    }

    this.nodeEdges.get(sourceId).add(edgeId);
    this.nodeEdges.get(targetId).add(edgeId);

    // Add to state
    this.stateManager.getState().edges.set(edgeId, edgeModel);

    // Render to canvas
    const svgElement = edgeView.render();
    this.editor.addEdgeElement(edgeId, svgElement);

    // Emit event
    this.eventBus.emit("edge:created", edgeModel);

    return edgeModel;
  }

  /**
   * Get an edge by ID
   */
  getEdge(edgeId) {
    return this.edges.get(edgeId);
  }

  /**
   * Get all edges
   */
  getAllEdges() {
    return new Map(this.edges);
  }

  /**
   * Update an edge
   */
  updateEdge(edgeId, updates) {
    const edge = this.edges.get(edgeId);
    if (!edge) return null;

    // Check if connection is still valid
    if (updates.sourceId || updates.targetId) {
      const sourceId = updates.sourceId || edge.sourceId;
      const targetId = updates.targetId || edge.targetId;

      if (!this.validationManager.validateConnection(sourceId, targetId)) {
        console.warn(`Invalid connection update`);
        return null;
      }
    }

    // Update model
    Object.assign(edge, updates);
    edge.updatedAt = new Date();

    // Update view
    const view = this.views.get(edgeId);
    if (view) {
      view.update(updates);
    }

    // Emit event
    this.eventBus.emit("edge:updated", edge);

    return edge;
  }

  /**
   * Remove an edge
   */
  removeEdge(edgeId) {
    const edge = this.edges.get(edgeId);
    if (!edge) return false;

    // Remove from editor
    this.editor.removeEdgeElement(edgeId);

    // Clean up resources
    const view = this.views.get(edgeId);
    if (view) {
      view.destroy();
    }

    const controller = this.controllers.get(edgeId);
    if (controller) {
      controller.destroy();
    }

    // Update node edges tracking
    if (this.nodeEdges.has(edge.sourceId)) {
      this.nodeEdges.get(edge.sourceId).delete(edgeId);
    }
    if (this.nodeEdges.has(edge.targetId)) {
      this.nodeEdges.get(edge.targetId).delete(edgeId);
    }

    // Remove from collections
    this.edges.delete(edgeId);
    this.views.delete(edgeId);
    this.controllers.delete(edgeId);

    // Emit event
    this.eventBus.emit("edge:deleted", edge);

    return true;
  }

  /**
   * Remove multiple edges
   */
  removeEdges(edgeIds) {
    edgeIds.forEach((id) => this.removeEdge(id));
  }

  /**
   * Get all edges connected to a node
   */
  getEdgesForNode(nodeId) {
    const edgeIds = this.nodeEdges.get(nodeId) || new Set();
    return Array.from(edgeIds).map((id) => this.edges.get(id));
  }

  /**
   * Get incoming edges to a node
   */
  getIncomingEdges(nodeId) {
    return Array.from(this.edges.values()).filter((e) => e.targetId === nodeId);
  }

  /**
   * Get outgoing edges from a node
   */
  getOutgoingEdges(nodeId) {
    return Array.from(this.edges.values()).filter((e) => e.sourceId === nodeId);
  }

  /**
   * Remove all edges connected to a node
   */
  removeNodeEdges(nodeId) {
    const edges = this.getEdgesForNode(nodeId);
    edges.forEach((edge) => this.removeEdge(edge.id));
  }

  /**
   * Change edge routing type
   */
  changeEdgeType(edgeId, routingType) {
    const edge = this.edges.get(edgeId);
    if (!edge) return null;

    edge.type = routingType;

    const view = this.views.get(edgeId);
    if (view) {
      view.updateRouting(routingType);
    }

    this.eventBus.emit("edge:typeChanged", { edgeId, type: routingType });
    return edge;
  }

  /**
   * Get all edges of a specific type
   */
  getEdgesByType(type) {
    return Array.from(this.edges.values()).filter((e) => e.type === type);
  }

  /**
   * Clear all edges
   */
  clear() {
    const edgeIds = Array.from(this.edges.keys());
    edgeIds.forEach((id) => this.removeEdge(id));
  }

  /**
   * Get cycles in the diagram (for validation)
   */
  detectCycles() {
    const visited = new Set();
    const cycles = [];

    const dfs = (nodeId, path) => {
      if (path.includes(nodeId)) {
        cycles.push([...path, nodeId]);
        return;
      }

      if (visited.has(nodeId)) return;

      visited.add(nodeId);
      const outgoing = this.getOutgoingEdges(nodeId);

      outgoing.forEach((edge) => {
        dfs(edge.targetId, [...path, nodeId]);
      });
    };

    this.nodeEdges.forEach((_, nodeId) => {
      dfs(nodeId, []);
    });

    return cycles;
  }
}

export { EdgeManager };
