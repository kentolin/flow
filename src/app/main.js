// ============================================================================
// FILE: src/app/main.js
// ============================================================================
import { ServiceContainer, ServiceProvider } from "../core/container/index.js";
import { ShapeLoader } from "../shapes/shapeLoader.js";
import { LeftPalette } from "../ui/panels/LeftPalette.js";
import { RightInspector } from "../ui/panels/RightInspector.js";
import { ToolBar } from "../ui/bars/ToolBar.js";
import { StatusBar } from "../ui/bars/StatusBar.js";

class FlowchartApp {
  constructor() {
    this.container = new ServiceContainer();
    this.initialize();
  }

  initialize() {
    // Step 1: Create DOM structure first
    this.createDOMStructure();

    // Step 2: Register all services
    ServiceProvider.register(this.container);

    // Step 3: Get core services
    this.eventBus = this.container.get("eventBus");
    this.shapeRegistry = this.container.get("shapeRegistry");

    // Step 4: Load built-in shapes
    ShapeLoader.loadBuiltInShapes(this.shapeRegistry);

    // Step 5: Setup UI components (now shapeRegistry has shapes)
    this.setupUI();

    // Step 6: Get remaining services
    this.editor = this.container.get("editor");
    this.nodeManager = this.container.get("nodeManager");
    this.edgeManager = this.container.get("edgeManager");
    this.selectionManager = this.container.get("selectionManager");
    this.historyManager = this.container.get("historyManager");

    // Step 7: Setup event handlers
    this.setupEventHandlers();

    console.log("Flowchart Editor initialized");
  }

  createDOMStructure() {
    const appContainer = document.getElementById("app");
    if (!appContainer) {
      console.error("App container not found");
      return;
    }

    // Create main layout
    appContainer.innerHTML = `
      <div class="app-layout">
        <div id="toolbar-container"></div>
        <div class="main-content">
          <div id="left-panel-container"></div>
          <div id="editor-container"></div>
          <div id="right-panel-container"></div>
        </div>
        <div id="statusbar-container"></div>
      </div>
    `;
  }

  setupUI() {
    // Render UI components
    const toolbar = new ToolBar(this.eventBus);
    document.getElementById("toolbar-container").appendChild(toolbar.render());

    const leftPalette = new LeftPalette(this.shapeRegistry, this.eventBus);
    document
      .getElementById("left-panel-container")
      .appendChild(leftPalette.render());

    const rightInspector = new RightInspector(this.eventBus);
    document
      .getElementById("right-panel-container")
      .appendChild(rightInspector.render());

    const statusBar = new StatusBar(this.eventBus);
    document
      .getElementById("statusbar-container")
      .appendChild(statusBar.render());
  }

  setupEventHandlers() {
    // Shape selection from palette
    this.eventBus.on("shape:selected", (data) => {
      console.log("Shape selected:", data.type);
      // Set mode to drawing
      this.container.get("stateManager").setMode("draw");
      this.container.get("stateManager").setTool(data.type);
    });

    // Canvas click to create node
    const editorContainer = document.getElementById("editor-container");
    if (editorContainer) {
      editorContainer.addEventListener("click", (e) => {
        const mode = this.container.get("stateManager").getMode();
        const tool = this.container.get("stateManager").getTool();

        if (mode === "draw" && tool) {
          const rect = editorContainer.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;

          this.nodeManager.createNode(tool, x, y);

          // Reset to select mode
          this.container.get("stateManager").setMode("select");
          this.container.get("stateManager").setTool(null);
        }
      });

      // Handle drag and drop from palette
      editorContainer.addEventListener("dragover", (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "copy";
      });

      editorContainer.addEventListener("drop", (e) => {
        e.preventDefault();
        const shapeType = e.dataTransfer.getData("shape-type");
        if (shapeType) {
          const rect = editorContainer.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;

          this.nodeManager.createNode(shapeType, x, y);
        }
      });
    }

    // Tool selection
    this.eventBus.on("tool:selected", (data) => {
      switch (data.tool) {
        case "select":
          this.container.get("stateManager").setMode("select");
          break;
        case "pan":
          this.container.get("stateManager").setMode("pan");
          break;
        case "zoom-in":
          this.zoomIn();
          break;
        case "zoom-out":
          this.zoomOut();
          break;
        case "undo":
          this.historyManager.undo();
          break;
        case "redo":
          this.historyManager.redo();
          break;
      }
    });

    // Node events
    this.eventBus.on("node:created", (node) => {
      console.log("Node created:", node.id);
    });

    this.eventBus.on("node:drag:move", (node) => {
      // Update connected edges
      this.edgeManager.updateEdgesForNode(node.id);
    });

    // Connection events
    this.eventBus.on("connection:complete", (data) => {
      this.edgeManager.createEdge(data.sourceId, data.targetId, {
        sourcePort: data.sourcePort,
        targetPort: data.targetPort,
      });
    });

    // Keyboard shortcuts
    document.addEventListener("keydown", (e) => {
      // Ctrl/Cmd + Z for undo
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        this.historyManager.undo();
      }
      // Ctrl/Cmd + Shift + Z for redo
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && e.shiftKey) {
        e.preventDefault();
        this.historyManager.redo();
      }
      // Ctrl/Cmd + C for copy
      if ((e.ctrlKey || e.metaKey) && e.key === "c") {
        e.preventDefault();
        this.copy();
      }
      // Ctrl/Cmd + V for paste
      if ((e.ctrlKey || e.metaKey) && e.key === "v") {
        e.preventDefault();
        this.paste();
      }
      // Ctrl/Cmd + X for cut
      if ((e.ctrlKey || e.metaKey) && e.key === "x") {
        e.preventDefault();
        this.cut();
      }
      // Delete key
      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        this.deleteSelected();
      }
      // Ctrl/Cmd + A for select all
      if ((e.ctrlKey || e.metaKey) && e.key === "a") {
        e.preventDefault();
        this.selectAll();
      }
    });
  }

  zoomIn() {
    const viewport = this.container.get("stateManager").getViewport();
    const newZoom = Math.min(viewport.zoom * 1.2, 3);
    this.editor.setViewport(viewport.x, viewport.y, newZoom);
    this.container
      .get("stateManager")
      .setViewport({ ...viewport, zoom: newZoom });
  }

  zoomOut() {
    const viewport = this.container.get("stateManager").getViewport();
    const newZoom = Math.max(viewport.zoom / 1.2, 0.1);
    this.editor.setViewport(viewport.x, viewport.y, newZoom);
    this.container
      .get("stateManager")
      .setViewport({ ...viewport, zoom: newZoom });
  }

  copy() {
    const clipboardManager = this.container.get("clipboardManager");
    const nodes = this.nodeManager.getAllNodes();
    const edges = this.edgeManager.getAllEdges();
    clipboardManager.copy(nodes, edges);
    console.log("Copied to clipboard");
  }

  paste() {
    const clipboardManager = this.container.get("clipboardManager");
    if (clipboardManager.hasClipboard()) {
      clipboardManager.paste(this.nodeManager, this.edgeManager);
      console.log("Pasted from clipboard");
    }
  }

  cut() {
    const clipboardManager = this.container.get("clipboardManager");
    const nodes = this.nodeManager.getAllNodes();
    const edges = this.edgeManager.getAllEdges();
    clipboardManager.cut(nodes, edges, this.nodeManager, this.edgeManager);
    console.log("Cut to clipboard");
  }

  deleteSelected() {
    const selection = this.selectionManager.getSelection();

    // Delete edges first
    selection.edges.forEach((edgeId) => {
      this.edgeManager.removeEdge(edgeId);
    });

    // Then delete nodes
    selection.nodes.forEach((nodeId) => {
      // Also delete connected edges
      const connectedEdges = this.edgeManager.getEdgesForNode(nodeId);
      connectedEdges.forEach((edge) => {
        this.edgeManager.removeEdge(edge.id);
      });
      this.nodeManager.removeNode(nodeId);
    });

    this.selectionManager.clearSelection();
    console.log("Deleted selected elements");
  }

  selectAll() {
    const nodes = this.nodeManager.getAllNodes();
    const edges = this.edgeManager.getAllEdges();
    this.selectionManager.selectAll(nodes, edges);
    console.log("Selected all elements");
  }

  // Public API methods
  save() {
    const exportManager = this.container.get("exportManager");
    const nodes = this.nodeManager.getAllNodes();
    const edges = this.edgeManager.getAllEdges();
    const json = exportManager.exportAsJSON(nodes, edges);
    return json;
  }

  load(jsonString) {
    const exportManager = this.container.get("exportManager");

    // Clear current diagram
    this.nodeManager.clear();
    this.edgeManager.clear();

    // Import from JSON
    exportManager.importFromJSON(
      jsonString,
      this.nodeManager,
      this.edgeManager
    );
  }

  export(format = "json") {
    const exportManager = this.container.get("exportManager");
    const nodes = this.nodeManager.getAllNodes();
    const edges = this.edgeManager.getAllEdges();

    switch (format) {
      case "json":
        return exportManager.exportAsJSON(nodes, edges);
      case "svg":
        return exportManager.exportAsSVG(this.editor.getSVG());
      case "png":
        return exportManager.exportAsPNG(this.editor.getSVG(), 1920, 1080);
      default:
        throw new Error(`Unknown export format: ${format}`);
    }
  }

  clear() {
    this.nodeManager.clear();
    this.edgeManager.clear();
    this.selectionManager.clearSelection();
    this.historyManager.clear();
  }
}

// Initialize app when DOM is ready
if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      window.flowchartApp = new FlowchartApp();
    });
  } else {
    window.flowchartApp = new FlowchartApp();
  }
}

export default FlowchartApp;
