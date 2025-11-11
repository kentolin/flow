/**
 * EditorState - Centralized state store
 * Holds all editor state: nodes, edges, selection, viewport, mode, tool
 */

class EditorState {
  constructor(eventBus) {
    this.eventBus = eventBus;

    this.state = {
      // Node and edge collections
      nodes: new Map(), // id -> NodeModel
      edges: new Map(), // id -> EdgeModel

      // Selection state
      selection: {
        nodes: new Set(), // Selected node IDs
        edges: new Set(), // Selected edge IDs
      },

      // Viewport and transform
      viewport: {
        x: 0,
        y: 0,
        zoom: 1,
      },

      // Editor mode and tool
      mode: "select", // 'select', 'draw', 'connect', 'edit'
      tool: null, // Current shape type when drawing

      // Clipboard state
      clipboard: {
        data: null,
        type: null, // 'copy', 'cut'
      },

      // History state
      history: {
        undoStack: [],
        redoStack: [],
      },

      // Layers and ordering
      layers: [],

      // Theme
      theme: "light",

      // Grid and snap settings
      grid: {
        enabled: true,
        size: 20,
        visible: false,
      },

      // Additional metadata
      metadata: {
        createdAt: new Date(),
        modifiedAt: new Date(),
        title: "Untitled Diagram",
        description: "",
      },
    };
  }

  /**
   * Get current state
   */
  getState() {
    return this.state;
  }

  /**
   * Get a specific state property
   */
  getStateProperty(path) {
    const keys = path.split(".");
    let value = this.state;

    for (const key of keys) {
      value = value?.[key];
    }

    return value;
  }

  /**
   * Set entire state (merges)
   */
  setState(newState) {
    this.state = {
      ...this.state,
      ...newState,
    };

    this.eventBus.emit("state:changed", this.state);
  }

  /**
   * Update a specific property
   */
  setProperty(path, value) {
    const keys = path.split(".");
    const lastKey = keys.pop();
    let target = this.state;

    for (const key of keys) {
      if (!(key in target)) {
        target[key] = {};
      }
      target = target[key];
    }

    target[lastKey] = value;
    this.eventBus.emit("state:changed", this.state);
  }

  /**
   * Add or update a node
   */
  addNode(nodeId, nodeModel) {
    this.state.nodes.set(nodeId, nodeModel);
    this.state.metadata.modifiedAt = new Date();
    this.eventBus.emit("state:changed", this.state);
  }

  /**
   * Remove a node
   */
  removeNode(nodeId) {
    this.state.nodes.delete(nodeId);
    this.state.metadata.modifiedAt = new Date();
    this.eventBus.emit("state:changed", this.state);
  }

  /**
   * Add or update an edge
   */
  addEdge(edgeId, edgeModel) {
    this.state.edges.set(edgeId, edgeModel);
    this.state.metadata.modifiedAt = new Date();
    this.eventBus.emit("state:changed", this.state);
  }

  /**
   * Remove an edge
   */
  removeEdge(edgeId) {
    this.state.edges.delete(edgeId);
    this.state.metadata.modifiedAt = new Date();
    this.eventBus.emit("state:changed", this.state);
  }

  /**
   * Update selection
   */
  setSelection(nodes = new Set(), edges = new Set()) {
    this.state.selection = { nodes, edges };
    this.eventBus.emit("state:changed", this.state);
  }

  /**
   * Clear selection
   */
  clearSelection() {
    this.state.selection = { nodes: new Set(), edges: new Set() };
    this.eventBus.emit("state:changed", this.state);
  }

  /**
   * Update viewport
   */
  setViewport(viewport) {
    this.state.viewport = { ...this.state.viewport, ...viewport };
    this.eventBus.emit("state:changed", this.state);
  }

  /**
   * Get node from state
   */
  getNode(nodeId) {
    return this.state.nodes.get(nodeId);
  }

  /**
   * Get edge from state
   */
  getEdge(edgeId) {
    return this.state.edges.get(edgeId);
  }

  /**
   * Get all nodes
   */
  getAllNodes() {
    return new Map(this.state.nodes);
  }

  /**
   * Get all edges
   */
  getAllEdges() {
    return new Map(this.state.edges);
  }

  /**
   * Export state as JSON
   */
  toJSON() {
    return {
      nodes: Array.from(this.state.nodes.values()).map((n) => n.toJSON()),
      edges: Array.from(this.state.edges.values()).map((e) => e.toJSON()),
      metadata: this.state.metadata,
      viewport: this.state.viewport,
      theme: this.state.theme,
    };
  }

  /**
   * Import state from JSON
   */
  fromJSON(json) {
    this.state.metadata = json.metadata || {};
    this.state.viewport = json.viewport || { x: 0, y: 0, zoom: 1 };
    this.state.theme = json.theme || "light";
  }
}
export { EditorState };
