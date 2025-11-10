// ============================================================================
// FILE: src/core/views/HandleView.js
// ============================================================================
export class HandleView {
  constructor(position, nodeModel) {
    this.position = position;
    this.nodeModel = nodeModel;
    this.element = null;
  }

  render() {
    const coords = this.calculatePosition();

    this.element = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "rect"
    );
    this.element.setAttribute("class", `handle handle-${this.position}`);
    this.element.setAttribute("data-handle", this.position);
    this.element.setAttribute("x", coords.x - 4);
    this.element.setAttribute("y", coords.y - 4);
    this.element.setAttribute("width", 8);
    this.element.setAttribute("height", 8);
    this.element.setAttribute("fill", "#4A90E2");
    this.element.setAttribute("stroke", "white");
    this.element.setAttribute("stroke-width", 1);

    return this.element;
  }

  calculatePosition() {
    const { width, height } = this.nodeModel;

    const positions = {
      nw: { x: 0, y: 0 },
      n: { x: width / 2, y: 0 },
      ne: { x: width, y: 0 },
      e: { x: width, y: height / 2 },
      se: { x: width, y: height },
      s: { x: width / 2, y: height },
      sw: { x: 0, y: height },
      w: { x: 0, y: height / 2 },
    };

    return positions[this.position];
  }

  update() {
    if (!this.element) return;
    const coords = this.calculatePosition();
    this.element.setAttribute("x", coords.x - 4);
    this.element.setAttribute("y", coords.y - 4);
  }
}
