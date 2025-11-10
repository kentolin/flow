// ============================================================================
// FILE: src/core/views/EdgeView.js
// ============================================================================
export class EdgeView {
  constructor(model, nodeManager) {
    this.model = model;
    this.nodeManager = nodeManager;
    this.element = null;
    this.pathElement = null;
    this.labelElement = null;
  }

  render() {
    this.element = document.createElementNS("http://www.w3.org/2000/svg", "g");
    this.element.setAttribute("class", "edge");
    this.element.setAttribute("data-edge-id", this.model.id);

    // Create path
    this.pathElement = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "path"
    );
    this.pathElement.setAttribute("class", "edge-path");
    this.pathElement.setAttribute("fill", "none");
    this.pathElement.setAttribute("stroke", this.model.style.stroke || "#666");
    this.pathElement.setAttribute(
      "stroke-width",
      this.model.style.strokeWidth || 2
    );

    if (this.model.markerEnd) {
      this.pathElement.setAttribute(
        "marker-end",
        `url(#arrow-${this.model.markerEnd})`
      );
    }

    this.element.appendChild(this.pathElement);

    // Create label if exists
    if (this.model.label) {
      this.labelElement = this.createLabel();
      this.element.appendChild(this.labelElement);
    }

    this.update();
    return this.element;
  }

  createLabel() {
    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("class", "edge-label");
    text.setAttribute("text-anchor", "middle");
    text.textContent = this.model.label;
    return text;
  }

  update() {
    if (!this.element) return;

    const sourceNode = this.nodeManager.getNode(this.model.sourceId);
    const targetNode = this.nodeManager.getNode(this.model.targetId);

    if (!sourceNode || !targetNode) return;

    const path = this.calculatePath(sourceNode, targetNode);
    this.pathElement.setAttribute("d", path);

    // Update label position
    if (this.labelElement) {
      const midPoint = this.getMidPoint(sourceNode, targetNode);
      this.labelElement.setAttribute("x", midPoint.x);
      this.labelElement.setAttribute("y", midPoint.y);
    }
  }

  calculatePath(sourceNode, targetNode) {
    const sourceCenter = sourceNode.getCenter();
    const targetCenter = targetNode.getCenter();

    switch (this.model.type) {
      case "bezier":
        return this.createBezierPath(sourceCenter, targetCenter);
      case "orthogonal":
        return this.createOrthogonalPath(sourceCenter, targetCenter);
      default:
        return this.createStraightPath(sourceCenter, targetCenter);
    }
  }

  createStraightPath(source, target) {
    return `M ${source.x} ${source.y} L ${target.x} ${target.y}`;
  }

  createBezierPath(source, target) {
    const dx = target.x - source.x;
    const dy = target.y - source.y;
    const offset = Math.abs(dx) * 0.5;

    return `M ${source.x} ${source.y} C ${source.x + offset} ${source.y}, ${
      target.x - offset
    } ${target.y}, ${target.x} ${target.y}`;
  }

  createOrthogonalPath(source, target) {
    const midX = (source.x + target.x) / 2;
    return `M ${source.x} ${source.y} L ${midX} ${source.y} L ${midX} ${target.y} L ${target.x} ${target.y}`;
  }

  getMidPoint(sourceNode, targetNode) {
    const sourceCenter = sourceNode.getCenter();
    const targetCenter = targetNode.getCenter();

    return {
      x: (sourceCenter.x + targetCenter.x) / 2,
      y: (sourceCenter.y + targetCenter.y) / 2,
    };
  }

  destroy() {
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
    this.element = null;
  }

  setSelected(selected) {
    if (!this.element) return;
    if (selected) {
      this.element.classList.add("selected");
    } else {
      this.element.classList.remove("selected");
    }
  }
}
