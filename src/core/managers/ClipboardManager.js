// ============================================================================
// FILE: src/core/managers/ClipboardManager.js
// ============================================================================
export class ClipboardManager {
  constructor(selectionManager) {
    this.selectionManager = selectionManager;
    this.clipboard = null;
  }

  copy(nodes, edges) {
    const selection = this.selectionManager.getSelection();

    const selectedNodes = nodes.filter((n) => selection.nodes.includes(n.id));
    const selectedEdges = edges.filter((e) => selection.edges.includes(e.id));

    this.clipboard = {
      nodes: selectedNodes.map((n) => n.toJSON()),
      edges: selectedEdges.map((e) => e.toJSON()),
    };

    return this.clipboard;
  }

  cut(nodes, edges, nodeManager, edgeManager) {
    this.copy(nodes, edges);

    const selection = this.selectionManager.getSelection();
    selection.edges.forEach((id) => edgeManager.removeEdge(id));
    selection.nodes.forEach((id) => nodeManager.removeNode(id));
  }

  paste(nodeManager, edgeManager, offsetX = 20, offsetY = 20) {
    if (!this.clipboard) return;

    const idMap = new Map();
    const newNodes = [];
    const newEdges = [];

    // Create new nodes
    this.clipboard.nodes.forEach((nodeData) => {
      const newNode = nodeManager.createNode(
        nodeData.type,
        nodeData.x + offsetX,
        nodeData.y + offsetY,
        {
          ...nodeData,
          id: undefined, // Let system generate new ID
        }
      );
      idMap.set(nodeData.id, newNode.id);
      newNodes.push(newNode);
    });

    // Create new edges
    this.clipboard.edges.forEach((edgeData) => {
      const newSourceId = idMap.get(edgeData.sourceId);
      const newTargetId = idMap.get(edgeData.targetId);

      if (newSourceId && newTargetId) {
        const newEdge = edgeManager.createEdge(newSourceId, newTargetId, {
          ...edgeData,
          id: undefined,
        });
        newEdges.push(newEdge);
      }
    });

    return { nodes: newNodes, edges: newEdges };
  }

  hasClipboard() {
    return this.clipboard !== null;
  }
}
