import { state } from './state.js';
import { nodeManager } from './nodeManager.js';
import { edgeManager } from './edgeManager.js';

function cloneState() {
  return {
    nodes: JSON.parse(JSON.stringify(state.nodes)),
    edges: JSON.parse(JSON.stringify(state.edges))
  };
}

export const history = {
  undoStack: [], redoStack: [],
  save() { this.undoStack.push(cloneState()); this.redoStack = []; },
  canUndo() { return this.undoStack.length>0; },
  canRedo() { return this.redoStack.length>0; },
  undo() { if(!this.canUndo()) return; this.redoStack.push(cloneState()); const prev=this.undoStack.pop(); state.nodes=prev.nodes; state.edges=prev.edges; nodeManager.renderAll(); edgeManager.redrawAll(); },
  redo() { if(!this.canRedo()) return; this.undoStack.push(cloneState()); const next=this.redoStack.pop(); state.nodes=next.nodes; state.edges=next.edges; nodeManager.renderAll(); edgeManager.redrawAll(); },
  reset() { this.undoStack=[]; this.redoStack=[]; }
};
