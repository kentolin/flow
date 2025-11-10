// ============================================================================
// FILE: src/core/managers/HistoryManager.js
// ============================================================================
export class HistoryManager {
  constructor(eventBus) {
    this.eventBus = eventBus;
    this.undoStack = [];
    this.redoStack = [];
    this.maxStackSize = 100;
  }

  execute(command) {
    command.execute();
    this.undoStack.push(command);
    this.redoStack = [];

    if (this.undoStack.length > this.maxStackSize) {
      this.undoStack.shift();
    }

    this.eventBus.emit("history:changed", {
      canUndo: this.canUndo(),
      canRedo: this.canRedo(),
    });
  }

  undo() {
    if (!this.canUndo()) return;

    const command = this.undoStack.pop();
    command.undo();
    this.redoStack.push(command);

    this.eventBus.emit("history:changed", {
      canUndo: this.canUndo(),
      canRedo: this.canRedo(),
    });
  }

  redo() {
    if (!this.canRedo()) return;

    const command = this.redoStack.pop();
    command.execute();
    this.undoStack.push(command);

    this.eventBus.emit("history:changed", {
      canUndo: this.canUndo(),
      canRedo: this.canRedo(),
    });
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
    this.eventBus.emit("history:changed", {
      canUndo: false,
      canRedo: false,
    });
  }
}
