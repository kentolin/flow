// ============================================================================
// FILE: src/core/container/ServiceProvider.js
// ============================================================================

import { EventBus } from "../events/EventBus.js";
import { EditorState } from "../state/EditorState.js";
import { StateManager } from "../managers/StateManager.js";
import { HistoryManager } from "../managers/HistoryManager.js";
import { SelectionManager } from "../managers/SelectionManager.js";
import { ClipboardManager } from "../managers/ClipboardManager.js";
import { SnapManager } from "../managers/SnapManager.js";
import { ValidationManager } from "../managers/ValidationManager.js";
import { ThemeManager } from "../managers/ThemeManager.js";
import { ExportManager } from "../managers/ExportManager.js";
import { PluginManager } from "../managers/PluginManager.js";

import { ShapeRegistry } from "../../shapes/registry/ShapeRegistry.js";

import { Editor } from "../Editor.js";
import { NodeManager } from "../managers/NodeManager.js";
import { EdgeManager } from "../managers/EdgeManager.js";

export class ServiceProvider {
  static register(container) {
    // Core services
    container.register("eventBus", () => new EventBus());
    container.register(
      "editorState",
      (c) => new EditorState(c.get("eventBus"))
    );

    // Managers
    container.register(
      "stateManager",
      (c) => new StateManager(c.get("editorState"))
    );
    container.register(
      "historyManager",
      (c) => new HistoryManager(c.get("eventBus"))
    );
    container.register(
      "selectionManager",
      (c) => new SelectionManager(c.get("eventBus"))
    );
    container.register(
      "clipboardManager",
      (c) => new ClipboardManager(c.get("selectionManager"))
    );
    container.register("snapManager", () => new SnapManager());
    container.register("validationManager", () => new ValidationManager());
    container.register(
      "themeManager",
      (c) => new ThemeManager(c.get("eventBus"))
    );
    container.register("exportManager", () => new ExportManager());
    container.register("pluginManager", (c) => new PluginManager(c));

    // Shape System
    container.register("shapeRegistry", () => new ShapeRegistry());

    // Editor and entity managers
    container.register("editor", (c) => new Editor(c));

    container.register(
      "nodeManager",
      (c) =>
        new NodeManager(
          c.get("editor"),
          c.get("shapeRegistry"),
          c.get("eventBus")
        )
    );

    container.register(
      "edgeManager",
      (c) =>
        new EdgeManager(
          c.get("editor"),
          c.get("nodeManager"),
          c.get("eventBus")
        )
    );
  }
}
