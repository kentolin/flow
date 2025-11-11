/**
 * StateManager - Provides mutations for EditorState
 * Implements immutable updates and event emissions
 */
class StateManager {
  constructor(editorState) {
    this.state = editorState;
  }

  /**
   * Get current state
   */
  getState() {
    return this.state.getState();
  }

  /**
   * Set editor mode
   */
  setMode(mode) {
    this.state.setProperty("mode", mode);
  }

  /**
   * Set drawing tool
   */
  setTool(tool) {
    this.state.setProperty("tool", tool);
  }

  /**
   * Set viewport
   */
  setViewport(viewport) {
    this.state.setViewport(viewport);
  }

  /**
   * Set theme
   */
  setTheme(theme) {
    this.state.setProperty("theme", theme);
  }

  /**
   * Set grid settings
   */
  setGrid(enabled, size, visible) {
    this.state.setProperty("grid", { enabled, size, visible });
  }

  /**
   * Set clipboard
   */
  setClipboard(data, type) {
    this.state.setProperty("clipboard", { data, type });
  }

  /**
   * Add to undo stack
   */
  pushUndo(command) {
    this.getState().history.undoStack.push(command);
    this.getState().history.redoStack = []; // Clear redo on new action
  }

  /**
   * Set metadata
   */
  setMetadata(metadata) {
    this.state.setProperty("metadata", {
      ...this.getState().metadata,
      ...metadata,
    });
  }
}
export { StateManager };
