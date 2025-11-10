// ============================================================================
// FILE: src/shapes/registry/ShapeDefinition.js
// ============================================================================
export class ShapeDefinition {
  constructor(config) {
    this.type = config.type;
    this.name = config.name || config.type;
    this.category = config.category || "basic";
    this.defaultWidth = config.defaultWidth || 100;
    this.defaultHeight = config.defaultHeight || 60;
    this.defaultPorts = config.defaultPorts || [];
    this.defaultStyle = config.defaultStyle || {};
    this.icon = config.icon || null;
    this.description = config.description || "";
  }

  createInstance(data = {}) {
    return {
      type: this.type,
      width: data.width || this.defaultWidth,
      height: data.height || this.defaultHeight,
      ports: data.ports || [...this.defaultPorts],
      style: { ...this.defaultStyle, ...data.style },
    };
  }
}
