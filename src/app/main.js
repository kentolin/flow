/**
 * Flowchart Editor - Main Application Entry Point
 * Bootstraps the entire application with all services, layers, and components
 */

import { ServiceProvider, ServiceContainer } from "../core/container/index.js";
import { EventBus } from "../core/events/EventBus.js";
import { EditorState, StateManager } from "../core/state/index.js";
import { Editor } from "../core/Editor.js";
import { ShapeLoader } from "../shapes/shapeLoader.js";

// Managers
import {
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
} from "../core/managers/index.js";

// UI Components
import { ToolBar } from "../ui/bars/ToolBar.js";
import { MenuBar } from "../ui/bars/MenuBar.js";
import { StatusBar } from "../ui/bars/StatusBar.js";
import { LeftPalette } from "../ui/panels/LeftPalette.js";
import { RightInspector } from "../ui/panels/RightInspector.js";
import { LayersPanel } from "../ui/panels/LayersPanel.js";
import { MiniMap } from "../ui/panels/MiniMap.js";

class FlowchartApp {
  constructor() {
    this.container = null;
    this.services = null;
    this.eventBus = null;
    this.stateManager = null;
    this.editor = null;
    this.managers = {};
    this.ui = {};
  }

  /**
   * Initialize and bootstrap the entire application
   */
  async initialize() {
    console.log("🚀 Initializing Flowchart Editor...");

    // Step 1: Create DOM structure
    this._createDOMStructure();

    // Step 2: Setup dependency injection container
    this._setupServiceContainer();

    // Step 3: Load built-in shapes
    await this._loadShapes();

    // Step 4: Initialize UI components
    this._setupUI();

    // Step 5: Setup event handlers and connections
    this._setupEventHandlers();

    // Step 6: Initialize workspace
    this._initializeWorkspace();

    console.log("✅ Flowchart Editor initialized successfully");
    return this;
  }

  /**
   * Create the DOM structure for the application
   */
  _createDOMStructure() {
    const appContainer = document.getElementById("app");
    appContainer.innerHTML = `
      <div class="flowchart-editor-container">
        <!-- Menu Bar -->
        <div id="menu-bar" class="menu-bar"></div>

        <!-- Main Content Area -->
        <div class="main-content">
          <!-- Left Palette -->
          <div id="left-panel" class="side-panel left-panel">
            <div class="panel-header">Shapes</div>
            <div id="shape-palette" class="shape-palette"></div>
          </div>

          <!-- Editor Area -->
          <div class="editor-area">
            <!-- Tool Bar -->
            <div id="tool-bar" class="tool-bar"></div>

            <!-- Editor Canvas -->
            <div id="editor-container" class="editor-container">
              <svg id="editor-svg" class="editor-svg"></svg>
            </div>

            <!-- Mini Map -->
            <div id="mini-map" class="mini-map"></div>
          </div>

          <!-- Right Inspector -->
          <div id="right-panel" class="side-panel right-panel">
            <div class="panel-tabs">
              <button class="tab-button active" data-tab="inspector">Inspector</button>
              <button class="tab-button" data-tab="layers">Layers</button>
            </div>
            <div id="inspector-panel" class="panel-content inspector-panel"></div>
            <div id="layers-panel" class="panel-content layers-panel" style="display: none;"></div>
          </div>
        </div>

        <!-- Status Bar -->
        <div id="status-bar" class="status-bar"></div>

        <!-- Context Menu -->
        <div id="context-menu" class="context-menu" style="display: none;"></div>

        <!-- Dialogs -->
        <div id="dialogs-container" class="dialogs-container"></div>
      </div>
    `;
  }

  /**
   * Setup the dependency injection service container
   */
  _setupServiceContainer() {
    // Register all services
    ServiceProvider.register(ServiceContainer);

    // Get core services
    this.eventBus = ServiceContainer.get("eventBus");
    this.services = ServiceContainer;

    console.log("📦 Services registered");
  }

  /**
   * Load shapes into the registry
   */
  async _loadShapes() {
    const shapeRegistry = this.services.get("shapeRegistry");
    ShapeLoader.loadBuiltInShapes(shapeRegistry);
    console.log("📐 Shapes loaded");
  }

  /**
   * Setup all UI components
   */
  _setupUI() {
    // Create and initialize UI components
    this.ui.menuBar = new MenuBar(
      document.getElementById("menu-bar"),
      this.services,
      this.eventBus
    );

    this.ui.toolBar = new ToolBar(
      document.getElementById("tool-bar"),
      this.services,
      this.eventBus
    );

    this.ui.leftPalette = new LeftPalette(
      document.getElementById("shape-palette"),
      this.services,
      this.eventBus
    );

    this.ui.rightInspector = new RightInspector(
      document.getElementById("inspector-panel"),
      this.services,
      this.eventBus
    );

    this.ui.layersPanel = new LayersPanel(
      document.getElementById("layers-panel"),
      this.services,
      this.eventBus
    );

    this.ui.statusBar = new StatusBar(
      document.getElementById("status-bar"),
      this.services,
      this.eventBus
    );

    this.ui.miniMap = new MiniMap(
      document.getElementById("mini-map"),
      this.services,
      this.eventBus
    );

    // Initialize editors
    this.editor = this.services.get("editor");
    this.editor.initialize(document.getElementById("editor-svg"));

    // Get manager instances
    this.managers = {
      node: this.services.get("nodeManager"),
      edge: this.services.get("edgeManager"),
      selection: this.services.get("selectionManager"),
      history: this.services.get("historyManager"),
      clipboard: this.services.get("clipboardManager"),
      snap: this.services.get("snapManager"),
      validation: this.services.get("validationManager"),
      theme: this.services.get("themeManager"),
      export: this.services.get("exportManager"),
      plugin: this.services.get("pluginManager"),
      layer: this.services.get("layerManager"),
    };

    this.stateManager = this.services.get("stateManager");

    console.log("🎨 UI components initialized");
  }

  /**
   * Setup event handlers and inter-component communication
   */
  _setupEventHandlers() {
    // Handle shape selection from palette
    this.eventBus.on("shape:selected", (data) => {
      this.stateManager.setMode("draw");
      this.stateManager.setTool(data.type);
      console.log(`📌 Drawing mode: ${data.type}`);
    });

    // Handle node creation
    this.eventBus.on("node:created", (node) => {
      this.ui.layersPanel.addNodeLayer(node);
      this.ui.miniMap.updateCanvas();
      this.ui.statusBar.setMessage(`Node created: ${node.id}`);
    });

    // Handle node selection
    this.eventBus.on("node:selected", (node) => {
      this.ui.rightInspector.displayNodeProperties(node);
      this.ui.statusBar.updateSelectionCount(1);
    });

    // Handle edge creation
    this.eventBus.on("edge:created", (edge) => {
      this.ui.miniMap.updateCanvas();
      this.ui.statusBar.setMessage(`Connection created: ${edge.id}`);
    });

    // Handle selection changes
    this.eventBus.on("selection:changed", (selection) => {
      const count = selection.nodes.size + selection.edges.size;
      this.ui.statusBar.updateSelectionCount(count);
    });

    // Handle deletion
    this.eventBus.on("elements:deleted", () => {
      this.ui.miniMap.updateCanvas();
      this.ui.layersPanel.refresh();
    });

    // Handle pan/zoom changes
    this.eventBus.on("viewport:changed", (viewport) => {
      this.ui.statusBar.setZoom(viewport.zoom);
      this.ui.miniMap.updateViewport(viewport);
    });

    // Handle theme changes
    this.eventBus.on("theme:changed", (theme) => {
      this.managers.theme.applyTheme(theme);
      this.ui.miniMap.updateCanvas();
    });

    console.log("🔗 Event handlers connected");
  }

  /**
   * Initialize the workspace with default settings
   */
  _initializeWorkspace() {
    // Set default theme
    this.managers.theme.setTheme("light");

    // Setup grid and snap
    this.managers.snap.setGridSize(20);
    this.managers.snap.setSnapThreshold(5);

    // Initialize viewport
    this.editor.setViewport({
      x: 0,
      y: 0,
      zoom: 1,
    });

    // Setup keyboard shortcuts
    this._setupKeyboardShortcuts();

    console.log("⚙️ Workspace initialized");
  }

  /**
   * Setup global keyboard shortcuts
   */
  _setupKeyboardShortcuts() {
    document.addEventListener("keydown", (e) => {
      // Ctrl/Cmd + Z: Undo
      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        e.preventDefault();
        this.managers.history.undo();
      }

      // Ctrl/Cmd + Y: Redo
      if ((e.ctrlKey || e.metaKey) && e.key === "y") {
        e.preventDefault();
        this.managers.history.redo();
      }

      // Ctrl/Cmd + C: Copy
      if ((e.ctrlKey || e.metaKey) && e.key === "c") {
        e.preventDefault();
        this.managers.clipboard.copy();
      }

      // Ctrl/Cmd + X: Cut
      if ((e.ctrlKey || e.metaKey) && e.key === "x") {
        e.preventDefault();
        this.managers.clipboard.cut();
      }

      // Ctrl/Cmd + V: Paste
      if ((e.ctrlKey || e.metaKey) && e.key === "v") {
        e.preventDefault();
        this.managers.clipboard.paste();
      }

      // Delete: Remove selected
      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        const selection = this.stateManager.getState().selection;
        this.managers.node.removeNodes([...selection.nodes]);
        this.managers.edge.removeEdges([...selection.edges]);
      }

      // Ctrl/Cmd + A: Select all
      if ((e.ctrlKey || e.metaKey) && e.key === "a") {
        e.preventDefault();
        const nodes = this.managers.node.getAllNodes();
        const edges = this.managers.edge.getAllEdges();
        this.managers.selection.selectNodes([...nodes.values()]);
        this.managers.selection.selectEdges([...edges.values()]);
      }
    });
  }

  /**
   * Export current diagram
   */
  async exportDiagram(format = "json") {
    return this.managers.export.export(format);
  }

  /**
   * Import diagram from data
   */
  async importDiagram(data, format = "json") {
    return this.managers.export.import(data, format);
  }

  /**
   * Get the state manager
   */
  getStateManager() {
    return this.stateManager;
  }

  /**
   * Get a specific manager
   */
  getManager(name) {
    return this.managers[name];
  }

  /**
   * Get a service
   */
  getService(name) {
    return this.services.get(name);
  }

  /**
   * Register a plugin
   */
  registerPlugin(plugin) {
    return this.managers.plugin.register(plugin);
  }
}

// Initialize the application when DOM is ready
document.addEventListener("DOMContentLoaded", async () => {
  const app = new FlowchartApp();
  await app.initialize();
  window.flowchartApp = app; // Expose for debugging
});

export { FlowchartApp };
