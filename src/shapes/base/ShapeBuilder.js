// ============================================================================
// FILE: src/shapes/base/ShapeBuilder.js
// ============================================================================
export class ShapeBuilder {
  constructor(type) {
    this.config = {
      type,
      defaultWidth: 100,
      defaultHeight: 60,
      defaultPorts: [],
      defaultStyle: {},
    };
  }

  width(w) {
    this.config.defaultWidth = w;
    return this;
  }

  height(h) {
    this.config.defaultHeight = h;
    return this;
  }

  ports(ports) {
    this.config.defaultPorts = ports;
    return this;
  }

  style(style) {
    this.config.defaultStyle = { ...this.config.defaultStyle, ...style };
    return this;
  }

  renderer(rendererFunc) {
    this.config.renderer = rendererFunc;
    return this;
  }

  build() {
    return this.config;
  }
}
