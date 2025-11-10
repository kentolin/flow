// ============================================================================
// FILE: src/core/state/EditorState.js
// ============================================================================
export class EditorState {
  constructor(eventBus) {
    this.eventBus = eventBus;
    this.state = {
      nodes: new Map(),
      edges: new Map(),
      selection: new Set(),
      viewport: {
        x: 0,
        y: 0,
        zoom: 1,
      },
      mode: "select", // select, pan, draw
      tool: null,
      grid: {
        enabled: true,
        size: 20,
        snap: true,
      },
      theme: "light",
    };
  }

  getState() {
    return this.state;
  }

  setState(updates) {
    this.state = { ...this.state, ...updates };
    this.eventBus.emit("state:changed", this.state);
  }

  addNode(node) {
    this.state.nodes.set(node.id, node);
    this.eventBus.emit("node:added", node);
  }

  removeNode(nodeId) {
    const node = this.state.nodes.get(nodeId);
    this.state.nodes.delete(nodeId);
    this.eventBus.emit("node:removed", node);
  }

  getNode(nodeId) {
    return this.state.nodes.get(nodeId);
  }

  addEdge(edge) {
    this.state.edges.set(edge.id, edge);
    this.eventBus.emit("edge:added", edge);
  }

  removeEdge(edgeId) {
    const edge = this.state.edges.get(edgeId);
    this.state.edges.delete(edgeId);
    this.eventBus.emit("edge:removed", edge);
  }

  getEdge(edgeId) {
    return this.state.edges.get(edgeId);
  }

  setViewport(viewport) {
    this.state.viewport = { ...this.state.viewport, ...viewport };
    this.eventBus.emit("viewport:changed", this.state.viewport);
  }
}
