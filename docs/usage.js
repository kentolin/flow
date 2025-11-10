// ============================================================================
// USAGE EXAMPLE
// ============================================================================
import { FlowchartApp } from '../src/FlowchartApp.js';

// Creating a simple flowchart programmatically:

const app = new FlowchartApp();

// Create nodes
const start = app.nodeManager.createNode('terminator', 100, 50, { label: 'Start' });
const process1 = app.nodeManager.createNode('process', 100, 150, { label: 'Process 1' });
const decision = app.nodeManager.createNode('decision', 100, 250, { label: 'Decision?' });
const process2 = app.nodeManager.createNode('process', 50, 350, { label: 'Yes' });
const process3 = app.nodeManager.createNode('process', 200, 350, { label: 'No' });
const end = app.nodeManager.createNode('terminator', 100, 450, { label: 'End' });

// Create edges
app.edgeManager.createEdge(start.id, process1.id);
app.edgeManager.createEdge(process1.id, decision.id);
app.edgeManager.createEdge(decision.id, process2.id, { label: 'Yes' });
app.edgeManager.createEdge(decision.id, process3.id, { label: 'No' });
app.edgeManager.createEdge(process2.id, end.id);
app.edgeManager.createEdge(process3.id, end.id);

// Save diagram
const json = app.save();
console.log(json);

// Load diagram
app.load(json);

// Export as SVG
const svg = app.export('svg');

// Export as PNG
app.export('png').then(blob => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'flowchart.png';
  a.click();
});

*mousemove', this.handleMouseMove);
    document.removeEventListener('mouseup', this.handleMouseUp);

    this.eventBus.emit('node:drag:end', this.model);
  }

  destroy() {
    document.removeEventListener('mousemove', this.handleMouseMove);
    document.removeEventListener('mouseup', this.handleMouseUp);
  }
}