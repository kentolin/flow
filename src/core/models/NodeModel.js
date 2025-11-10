// ============================================================================
// FILE: src/core/models/NodeModel.js
// ============================================================================
export class NodeModel {
  constructor(data = {}) {
    this.id =
      data.id ||
      `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.type = data.type || "rect";
    this.x = data.x || 0;
    this.y = data.y || 0;
    this.width = data.width || 100;
    this.height = data.height || 60;
    this.label = data.label || "";
    this.style = data.style || {};
    this.ports = data.ports || [];
    this.data = data.data || {};
    this.zIndex = data.zIndex || 0;
  }

  getBounds() {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
    };
  }

  getCenter() {
    return {
      x: this.x + this.width / 2,
      y: this.y + this.height / 2,
    };
  }

  contains(x, y) {
    return (
      x >= this.x &&
      x <= this.x + this.width &&
      y >= this.y &&
      y <= this.y + this.height
    );
  }

  clone() {
    return new NodeModel({
      ...this,
      id: `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    });
  }

  toJSON() {
    return {
      id: this.id,
      type: this.type,
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
      label: this.label,
      style: this.style,
      ports: this.ports,
      data: this.data,
      zIndex: this.zIndex,
    };
  }
}
