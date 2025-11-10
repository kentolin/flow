// ============================================================================
// FILE: src/core/models/EdgeModel.js
// ============================================================================
export class EdgeModel {
  constructor(data = {}) {
    this.id =
      data.id ||
      `edge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.sourceId = data.sourceId;
    this.targetId = data.targetId;
    this.sourcePort = data.sourcePort || null;
    this.targetPort = data.targetPort || null;
    this.type = data.type || "straight"; // straight, bezier, orthogonal
    this.label = data.label || "";
    this.style = data.style || {};
    this.points = data.points || [];
    this.markerStart = data.markerStart || null;
    this.markerEnd = data.markerEnd || "arrow";
    this.data = data.data || {};
  }

  toJSON() {
    return {
      id: this.id,
      sourceId: this.sourceId,
      targetId: this.targetId,
      sourcePort: this.sourcePort,
      targetPort: this.targetPort,
      type: this.type,
      label: this.label,
      style: this.style,
      points: this.points,
      markerStart: this.markerStart,
      markerEnd: this.markerEnd,
      data: this.data,
    };
  }
}
