// ============================================================================
// FILE: src/core/views/PortView.js
// ============================================================================
export class PortView {
  constructor(port, nodeModel) {
    this.port = port;
    this.nodeModel = nodeModel;
    this.element = null;
  }

  render() {
    const position = this.calculatePosition();

    this.element = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "circle"
    );
    this.element.setAttribute("class", "port");
    this.element.setAttribute("data-port-id", this.port.id);
    this.element.setAttribute("cx", position.x);
    this.element.setAttribute("cy", position.y);
    this.element.setAttribute("r", this.port.radius || 4);
    this.element.setAttribute("fill", this.port.fill || "#4A90E2");

    return this.element;
  }

  calculatePosition() {
    const { width, height } = this.nodeModel;
    const side = this.port.side || "top";
    const offset = this.port.offset || 0.5;

    const positions = {
      top: { x: width * offset, y: 0 },
      right: { x: width, y: height * offset },
      bottom: { x: width * offset, y: height },
      left: { x: 0, y: height * offset },
    };

    return positions[side] || positions.top;
  }

  update() {
    if (!this.element) return;
    const position = this.calculatePosition();
    this.element.setAttribute("cx", position.x);
    this.element.setAttribute("cy", position.y);
  }

  getWorldPosition() {
    const position = this.calculatePosition();
    return {
      x: this.nodeModel.x + position.x,
      y: this.nodeModel.y + position.y,
    };
  }
}
