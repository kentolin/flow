// ============================================================================
// FILE: src/core/controllers/PortController.js
// ============================================================================
export class PortController {
  constructor(eventBus) {
    this.eventBus = eventBus;
    this.isConnecting = false;
    this.sourceNode = null;
    this.sourcePort = null;
    this.tempEdge = null;
  }

  startConnection(data) {
    this.isConnecting = true;
    this.sourceNode = data.nodeId;
    this.sourcePort = data.portId;

    // Create temporary visual edge
    this.eventBus.emit("connection:started", data);
  }

  updateConnection(position) {
    if (!this.isConnecting) return;
    this.eventBus.emit("connection:update", position);
  }

  endConnection(targetData) {
    if (!this.isConnecting) return;

    if (targetData && targetData.nodeId !== this.sourceNode) {
      this.eventBus.emit("connection:complete", {
        sourceId: this.sourceNode,
        sourcePort: this.sourcePort,
        targetId: targetData.nodeId,
        targetPort: targetData.portId,
      });
    } else {
      this.eventBus.emit("connection:cancelled");
    }

    this.isConnecting = false;
    this.sourceNode = null;
    this.sourcePort = null;
  }
}
