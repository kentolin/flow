// ============================================================================
// FILE: src/core/managers/SelectionManager.js
// ============================================================================
export class SelectionManager {
  constructor(eventBus) {
    this.eventBus = eventBus;
    this.selectedNodes = new Set();
    this.selectedEdges = new Set();
  }

  selectNode(nodeId, multiSelect = false) {
    if (!multiSelect) {
      this.clearSelection();
    }
    this.selectedNodes.add(nodeId);
    this.eventBus.emit("selection:changed", this.getSelection());
  }

  selectEdge(edgeId, multiSelect = false) {
    if (!multiSelect) {
      this.clearSelection();
    }
    this.selectedEdges.add(edgeId);
    this.eventBus.emit("selection:changed", this.getSelection());
  }

  deselectNode(nodeId) {
    this.selectedNodes.delete(nodeId);
    this.eventBus.emit("selection:changed", this.getSelection());
  }

  deselectEdge(edgeId) {
    this.selectedEdges.delete(edgeId);
    this.eventBus.emit("selection:changed", this.getSelection());
  }

  clearSelection() {
    this.selectedNodes.clear();
    this.selectedEdges.clear();
    this.eventBus.emit("selection:changed", this.getSelection());
  }

  isNodeSelected(nodeId) {
    return this.selectedNodes.has(nodeId);
  }

  isEdgeSelected(edgeId) {
    return this.selectedEdges.has(edgeId);
  }

  getSelection() {
    return {
      nodes: Array.from(this.selectedNodes),
      edges: Array.from(this.selectedEdges),
    };
  }

  selectAll(nodes, edges) {
    this.selectedNodes = new Set(nodes.map((n) => n.id));
    this.selectedEdges = new Set(edges.map((e) => e.id));
    this.eventBus.emit("selection:changed", this.getSelection());
  }

  selectArea(x1, y1, x2, y2, nodes) {
    const minX = Math.min(x1, x2);
    const minY = Math.min(y1, y2);
    const maxX = Math.max(x1, x2);
    const maxY = Math.max(y1, y2);

    this.clearSelection();

    nodes.forEach((node) => {
      if (this.isNodeInArea(node, minX, minY, maxX, maxY)) {
        this.selectedNodes.add(node.id);
      }
    });

    this.eventBus.emit("selection:changed", this.getSelection());
  }

  isNodeInArea(node, x1, y1, x2, y2) {
    return (
      node.x >= x1 &&
      node.x + node.width <= x2 &&
      node.y >= y1 &&
      node.y + node.height <= y2
    );
  }
}
