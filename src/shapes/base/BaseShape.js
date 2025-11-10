// ============================================================================
// FILE: src/shapes/base/BaseShape.js
// ============================================================================
export class BaseShape {
  constructor(config = {}) {
    this.type = config.type || "base";
    this.defaultWidth = config.defaultWidth || 100;
    this.defaultHeight = config.defaultHeight || 60;
    this.defaultPorts = config.defaultPorts || [];
    this.defaultStyle = config.defaultStyle || {};
  }

  createRenderer() {
    throw new Error("createRenderer must be implemented by subclass");
  }

  render(model) {
    throw new Error("render must be implemented by subclass");
  }

  validate(model) {
    return {
      valid: true,
      errors: [],
    };
  }
}
