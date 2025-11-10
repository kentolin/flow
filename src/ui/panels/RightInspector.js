// ============================================================================
// FILE: src/ui/panels/RightInspector.js
// ============================================================================
export class RightInspector {
  constructor(eventBus) {
    this.eventBus = eventBus;
    this.element = null;
    this.selectedNode = null;
    this.selectedEdge = null;
  }

  render() {
    this.element = document.createElement("div");
    this.element.className = "right-inspector";

    const header = document.createElement("div");
    header.className = "inspector-header";
    header.textContent = "Properties";
    this.element.appendChild(header);

    const content = document.createElement("div");
    content.className = "inspector-content";
    content.innerHTML =
      '<div class="inspector-empty">Select an element to edit properties</div>';
    this.element.appendChild(content);

    this.attachEventListeners();
    return this.element;
  }

  attachEventListeners() {
    this.eventBus.on("node:selected", (node) => {
      this.selectedNode = node;
      this.selectedEdge = null;
      this.updateContent();
    });

    this.eventBus.on("edge:selected", (edge) => {
      this.selectedEdge = edge;
      this.selectedNode = null;
      this.updateContent();
    });

    this.eventBus.on("selection:cleared", () => {
      this.selectedNode = null;
      this.selectedEdge = null;
      this.updateContent();
    });
  }

  updateContent() {
    const content = this.element.querySelector(".inspector-content");

    if (this.selectedNode) {
      content.innerHTML = this.renderNodeProperties(this.selectedNode);
    } else if (this.selectedEdge) {
      content.innerHTML = this.renderEdgeProperties(this.selectedEdge);
    } else {
      content.innerHTML =
        '<div class="inspector-empty">Select an element to edit properties</div>';
    }
  }

  renderNodeProperties(node) {
    return `
      <div class="property-group">
        <label>Label</label>
        <input type="text" value="${node.label || ""}" data-property="label">
      </div>
      <div class="property-group">
        <label>Position</label>
        <div class="property-row">
          <input type="number" value="${
            node.x
          }" data-property="x" placeholder="X">
          <input type="number" value="${
            node.y
          }" data-property="y" placeholder="Y">
        </div>
      </div>
      <div class="property-group">
        <label>Size</label>
        <div class="property-row">
          <input type="number" value="${
            node.width
          }" data-property="width" placeholder="Width">
          <input type="number" value="${
            node.height
          }" data-property="height" placeholder="Height">
        </div>
      </div>
      <div class="property-group">
        <label>Fill Color</label>
        <input type="color" value="${
          node.style.fill || "#ffffff"
        }" data-property="style.fill">
      </div>
      <div class="property-group">
        <label>Stroke Color</label>
        <input type="color" value="${
          node.style.stroke || "#333333"
        }" data-property="style.stroke">
      </div>
    `;
  }

  renderEdgeProperties(edge) {
    return `
      <div class="property-group">
        <label>Label</label>
        <input type="text" value="${edge.label || ""}" data-property="label">
      </div>
      <div class="property-group">
        <label>Type</label>
        <select data-property="type">
          <option value="straight" ${
            edge.type === "straight" ? "selected" : ""
          }>Straight</option>
          <option value="bezier" ${
            edge.type === "bezier" ? "selected" : ""
          }>Bezier</option>
          <option value="orthogonal" ${
            edge.type === "orthogonal" ? "selected" : ""
          }>Orthogonal</option>
        </select>
      </div>
      <div class="property-group">
        <label>Stroke Color</label>
        <input type="color" value="${
          edge.style.stroke || "#666666"
        }" data-property="style.stroke">
      </div>
    `;
  }
}
