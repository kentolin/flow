// ============================================================================
// FILE: src/core/managers/StateManager.js
// ============================================================================
export class StateManager {
  constructor(editorState) {
    this.editorState = editorState;
  }

  getState() {
    return this.editorState.getState();
  }

  setState(updates) {
    this.editorState.setState(updates);
  }

  setMode(mode) {
    this.setState({ mode });
  }

  setTool(tool) {
    this.setState({ tool });
  }

  setViewport(viewport) {
    this.editorState.setViewport(viewport);
  }

  getViewport() {
    return this.getState().viewport;
  }

  getMode() {
    return this.getState().mode;
  }

  getTool() {
    return this.getState().tool;
  }
}
