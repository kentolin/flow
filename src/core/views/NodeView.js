// ============================================================================
// FILE: src/core/views/NodeView.js
// ============================================================================

import { PortView } from "./PortView.js";
import { HandleView } from "./HandleView.js";

export class NodeView {
  constructor(model, shapeRenderer) {
    this.model = model;
    this.shapeRenderer = shapeRenderer;
    this.element = null;
    this.handles = [];
    this.ports = [];
  }

  render() {
    // Create main group
    this.element = document.createElementNS("http://www.w3.org/2000/svg", "g");
    this.element.setAttribute("class", "node");
    this.element.setAttribute("data-node-id", this.model.id);
    this.element.setAttribute(
      "transform",
      `translate(${this.model.x}, ${this.model.y})`
    );

    // Render shape
    const shapeElement = this.shapeRenderer.render(this.model);
    this.element.appendChild(shapeElement);

    // Render label
    if (this.model.label) {
      const label = this.createLabel();
      this.element.appendChild(label);
    }

    // Render ports
    this.renderPorts();

    // Render resize handles
    this.renderHandles();

    return this.element;
  }

  createLabel() {
    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("class", "node-label");
    text.setAttribute("x", this.model.width / 2);
    text.setAttribute("y", this.model.height / 2);
    text.setAttribute("text-anchor", "middle");
    text.setAttribute("dominant-baseline", "middle");
    text.textContent = this.model.label;
    return text;
  }

  renderPorts() {
    // Ports will be rendered by PortView
    this.model.ports.forEach((port) => {
      const portView = new PortView(port, this.model);
      const portElement = portView.render();
      this.element.appendChild(portElement);
      this.ports.push(portView);
    });
  }

  renderHandles() {
    const positions = ["nw", "ne", "se", "sw", "n", "e", "s", "w"];
    positions.forEach((pos) => {
      const handle = new HandleView(pos, this.model);
      const handleElement = handle.render();
      this.element.appendChild(handleElement);
      this.handles.push(handle);
    });
  }

  update() {
    if (!this.element) return;
    this.element.setAttribute(
      "transform",
      `translate(${this.model.x}, ${this.model.y})`
    );

    // Update shape
    const shapeElement = this.element.querySelector(".shape");
    if (shapeElement) {
      shapeElement.setAttribute("width", this.model.width);
      shapeElement.setAttribute("height", this.model.height);
    }

    // Update label position
    const label = this.element.querySelector(".node-label");
    if (label) {
      label.setAttribute("x", this.model.width / 2);
      label.setAttribute("y", this.model.height / 2);
      label.textContent = this.model.label;
    }

    // Update ports and handles
    this.ports.forEach((port) => port.update());
    this.handles.forEach((handle) => handle.update());
  }

  destroy() {
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
    this.element = null;
    this.handles = [];
    this.ports = [];
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
