/**
 * Manager Classes - Business Logic Layer
 * Each manager handles a specific domain of functionality
 */

import { NodeManager } from "./NodeManager.js";
import { EdgeManager } from "./EdgeManager.js";

// HistoryManager - Undo/Redo
class HistoryManager {
  constructor(eventBus) {
    this.eventBus = eventBus;
    this.undoStack = [];
    this.redoStack = [];
  }

  execute(command) {
    command.execute();
    this.undoStack.push(command);
    this.redoStack = [];
    this.eventBus.emit("history:changed", { canUndo: true, canRedo: false });
  }

  undo() {
    if (this.undoStack.length === 0) return false;
    const command = this.undoStack.pop();
    command.undo();
    this.redoStack.push(command);
    this.eventBus.emit("history:changed", {
      canUndo: this.undoStack.length > 0,
      canRedo: true,
    });
    return true;
  }

  redo() {
    if (this.redoStack.length === 0) return false;
    const command = this.redoStack.pop();
    command.execute();
    this.undoStack.push(command);
    this.eventBus.emit("history:changed", {
      canUndo: true,
      canRedo: this.redoStack.length > 0,
    });
    return true;
  }

  canUndo() {
    return this.undoStack.length > 0;
  }

  canRedo() {
    return this.redoStack.length > 0;
  }

  clear() {
    this.undoStack = [];
    this.redoStack = [];
  }
}

// ClipboardManager
class ClipboardManager {
  constructor(
    nodeManager,
    edgeManager,
    selectionManager,
    historyManager,
    eventBus
  ) {
    this.nodeManager = nodeManager;
    this.edgeManager = edgeManager;
    this.selectionManager = selectionManager;
    this.historyManager = historyManager;
    this.eventBus = eventBus;
    this.clipboard = null;
  }

  copy() {
    const selection = this.selectionManager.getSelection();
    this.clipboard = {
      nodes: Array.from(selection.nodes).map((id) =>
        this.nodeManager.getNode(id)
      ),
      edges: Array.from(selection.edges).map((id) =>
        this.edgeManager.getEdge(id)
      ),
      type: "copy",
    };
    this.eventBus.emit("clipboard:copied", this.clipboard);
  }

  cut() {
    this.copy();
    const selection = this.selectionManager.getSelection();
    this.clipboard.type = "cut";
    Array.from(selection.nodes).forEach((id) =>
      this.nodeManager.removeNode(id)
    );
    Array.from(selection.edges).forEach((id) =>
      this.edgeManager.removeEdge(id)
    );
  }

  paste(offsetX = 20, offsetY = 20) {
    if (!this.clipboard) return null;

    const newNodes = new Map();
    const newEdges = [];

    // Create new nodes
    this.clipboard.nodes.forEach((node) => {
      const newNode = this.nodeManager.createNode(
        node.type,
        node.x + offsetX,
        node.y + offsetY,
        {
          label: node.label,
          style: { ...node.style },
        }
      );
      newNodes.set(node.id, newNode);
    });

    // Create new edges (with remapped node IDs)
    this.clipboard.edges.forEach((edge) => {
      const newSourceId = newNodes.get(edge.sourceId)?.id;
      const newTargetId = newNodes.get(edge.targetId)?.id;
      if (newSourceId && newTargetId) {
        const newEdge = this.edgeManager.createEdge(newSourceId, newTargetId, {
          label: edge.label,
          type: edge.type,
          style: { ...edge.style },
        });
        newEdges.push(newEdge);
      }
    });

    this.selectionManager.selectNodes(
      Array.from(newNodes.values()).map((n) => n.id)
    );
    this.eventBus.emit("clipboard:pasted", {
      nodes: newNodes,
      edges: newEdges,
    });

    return { nodes: newNodes, edges: newEdges };
  }

  clear() {
    this.clipboard = null;
  }

  hasContent() {
    return (
      this.clipboard !== null &&
      (this.clipboard.nodes.length > 0 || this.clipboard.edges.length > 0)
    );
  }
}

// SnapManager
class SnapManager {
  constructor(eventBus) {
    this.eventBus = eventBus;
    this.gridSize = 20;
    this.snapThreshold = 5;
    this.snapToGrid = true;
    this.snapToNodes = true;
  }

  setGridSize(size) {
    this.gridSize = size;
    this.eventBus.emit("snap:gridSizeChanged", size);
  }

  setSnapThreshold(threshold) {
    this.snapThreshold = threshold;
  }

  snapToGrid(value) {
    if (!this.snapToGrid) return value;
    return Math.round(value / this.gridSize) * this.gridSize;
  }

  snapPoint(x, y) {
    return {
      x: this.snapToGrid(x),
      y: this.snapToGrid(y),
    };
  }
}

// ValidationManager
class ValidationManager {
  constructor(eventBus) {
    this.eventBus = eventBus;
    this.rules = new Map();
    this._initializeDefaultRules();
  }

  _initializeDefaultRules() {
    // Allow any connection by default
    this.rules.set("connection", () => true);
  }

  validateConnection(sourceId, targetId) {
    const rule = this.rules.get("connection");
    return rule ? rule(sourceId, targetId) : true;
  }

  validateNode(node) {
    // Check if node is valid
    return node && node.id && node.type;
  }

  addRule(name, validator) {
    this.rules.set(name, validator);
  }
}

// ThemeManager
class ThemeManager {
  constructor(eventBus) {
    this.eventBus = eventBus;
    this.currentTheme = "light";
    this.themes = {
      light: { background: "#ffffff", text: "#000000" },
      dark: { background: "#1e1e1e", text: "#ffffff" },
    };
  }

  setTheme(themeName) {
    if (this.themes[themeName]) {
      this.currentTheme = themeName;
      this.applyTheme(themeName);
      this.eventBus.emit("theme:changed", themeName);
    }
  }

  applyTheme(themeName) {
    const theme = this.themes[themeName];
    if (theme) {
      document.documentElement.style.setProperty(
        "--bg-color",
        theme.background
      );
      document.documentElement.style.setProperty("--text-color", theme.text);
    }
  }

  getTheme() {
    return this.currentTheme;
  }

  registerTheme(name, theme) {
    this.themes[name] = theme;
  }
}

// ExportManager
class ExportManager {
  constructor(nodeManager, edgeManager, editor, eventBus) {
    this.nodeManager = nodeManager;
    this.edgeManager = edgeManager;
    this.editor = editor;
    this.eventBus = eventBus;
  }

  exportAsJSON() {
    const nodes = Array.from(this.nodeManager.getAllNodes().values()).map(
      (n) => ({
        id: n.id,
        type: n.type,
        x: n.x,
        y: n.y,
        width: n.width,
        height: n.height,
        label: n.label,
        style: n.style,
      })
    );

    const edges = Array.from(this.edgeManager.getAllEdges().values()).map(
      (e) => ({
        id: e.id,
        sourceId: e.sourceId,
        targetId: e.targetId,
        type: e.type,
        label: e.label,
        style: e.style,
      })
    );

    return JSON.stringify({ nodes, edges }, null, 2);
  }

  exportAsSVG() {
    return this.editor.exportSVG();
  }

  async exportAsPNG() {
    return this.editor.exportImage("png");
  }

  importFromJSON(jsonString) {
    try {
      const data = JSON.parse(jsonString);

      // Clear existing
      this.nodeManager.clear();
      this.edgeManager.clear();

      // Create nodes
      const nodeMap = new Map();
      data.nodes.forEach((nodeData) => {
        const node = this.nodeManager.createNode(
          nodeData.type,
          nodeData.x,
          nodeData.y,
          {
            label: nodeData.label,
            style: nodeData.style,
          }
        );
        nodeMap.set(nodeData.id, node);
      });

      // Create edges
      data.edges.forEach((edgeData) => {
        const sourceNode = Array.from(nodeMap.values()).find(
          (n) => n.label === edgeData.sourceId
        );
        const targetNode = Array.from(nodeMap.values()).find(
          (n) => n.label === edgeData.targetId
        );

        if (sourceNode && targetNode) {
          this.edgeManager.createEdge(sourceNode.id, targetNode.id, {
            label: edgeData.label,
            type: edgeData.type,
            style: edgeData.style,
          });
        }
      });

      this.eventBus.emit("diagram:imported", {
        nodeCount: data.nodes.length,
        edgeCount: data.edges.length,
      });
      return true;
    } catch (error) {
      console.error("Import error:", error);
      return false;
    }
  }
}

// PluginManager
class PluginManager {
  constructor(eventBus) {
    this.eventBus = eventBus;
    this.plugins = new Map();
  }

  register(plugin) {
    if (plugin.name && plugin.execute) {
      this.plugins.set(plugin.name, plugin);
      this.eventBus.emit("plugin:registered", plugin.name);
      return true;
    }
    return false;
  }

  unregister(pluginName) {
    return this.plugins.delete(pluginName);
  }

  execute(pluginName, ...args) {
    const plugin = this.plugins.get(pluginName);
    if (plugin) {
      return plugin.execute(...args);
    }
    return null;
  }

  getPlugin(pluginName) {
    return this.plugins.get(pluginName);
  }

  getAllPlugins() {
    return new Map(this.plugins);
  }
}

// LayerManager
class LayerManager {
  constructor(nodeManager, edgeManager, stateManager, eventBus) {
    this.nodeManager = nodeManager;
    this.edgeManager = edgeManager;
    this.stateManager = stateManager;
    this.eventBus = eventBus;
    this.layers = [];
  }

  createLayer(name) {
    const layer = { id: Date.now(), name, visible: true, nodes: [], edges: [] };
    this.layers.push(layer);
    this.eventBus.emit("layer:created", layer);
    return layer;
  }

  removeLayer(layerId) {
    this.layers = this.layers.filter((l) => l.id !== layerId);
    this.eventBus.emit("layer:removed", layerId);
  }

  moveToLayer(elementId, layerId) {
    const layer = this.layers.find((l) => l.id === layerId);
    if (layer) {
      if (this.nodeManager.getNode(elementId)) {
        layer.nodes.push(elementId);
      } else if (this.edgeManager.getEdge(elementId)) {
        layer.edges.push(elementId);
      }
      this.eventBus.emit("layer:elementMoved", { elementId, layerId });
    }
  }

  toggleLayerVisibility(layerId) {
    const layer = this.layers.find((l) => l.id === layerId);
    if (layer) {
      layer.visible = !layer.visible;
      this.eventBus.emit("layer:visibilityChanged", {
        layerId,
        visible: layer.visible,
      });
    }
  }

  getAllLayers() {
    return [...this.layers];
  }
}

export {
  NodeManager,
  EdgeManager,
  SelectionManager,
  HistoryManager,
  ClipboardManager,
  SnapManager,
  ValidationManager,
  ThemeManager,
  ExportManager,
  PluginManager,
  LayerManager,
};
