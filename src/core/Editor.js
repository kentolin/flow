// ============================================================================
// FILE: src/core/Editor.js
// ============================================================================
export class Editor {
  constructor(container) {
    this.container = container;
    this.svg = null;
    this.edgeLayer = null;
    this.nodeLayer = null;
    this.viewport = { x: 0, y: 0, zoom: 1 };
    this.initialize();
  }

  initialize() {
    // Create SVG
    this.svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    this.svg.setAttribute("class", "editor-canvas");
    this.svg.setAttribute("width", "100%");
    this.svg.setAttribute("height", "100%");

    // Create layers
    this.edgeLayer = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "g"
    );
    this.edgeLayer.setAttribute("class", "edge-layer");

    this.nodeLayer = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "g"
    );
    this.nodeLayer.setAttribute("class", "node-layer");

    this.svg.appendChild(this.edgeLayer);
    this.svg.appendChild(this.nodeLayer);

    // Create defs for markers
    this.createMarkers();

    // Handle different container types
    let editorElement;

    // Check if container is a ServiceContainer (has .get method)
    if (this.container && typeof this.container.get === "function") {
      // Try to get editorElement from service container
      if (this.container.has && this.container.has("editorElement")) {
        editorElement = this.container.get("editorElement");
      } else {
        // Fallback: use default editor-container ID
        editorElement = document.getElementById("editor-container");
      }
    } else {
      // Container is a DOM element directly
      editorElement = this.container;
    }

    // Append SVG to the element
    if (editorElement && editorElement.appendChild) {
      editorElement.appendChild(this.svg);
    } else {
      console.error("Editor: No valid container element found");
    }
  }

  createMarkers() {
    const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");

    // Arrow marker
    const marker = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "marker"
    );
    marker.setAttribute("id", "arrow-arrow");
    marker.setAttribute("markerWidth", "10");
    marker.setAttribute("markerHeight", "10");
    marker.setAttribute("refX", "9");
    marker.setAttribute("refY", "3");
    marker.setAttribute("orient", "auto");
    marker.setAttribute("markerUnits", "strokeWidth");

    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", "M0,0 L0,6 L9,3 z");
    path.setAttribute("fill", "#666");

    marker.appendChild(path);
    defs.appendChild(marker);
    this.svg.insertBefore(defs, this.edgeLayer);
  }

  addNode(element) {
    this.nodeLayer.appendChild(element);
  }

  addEdge(element) {
    this.edgeLayer.appendChild(element);
  }

  setViewport(x, y, zoom) {
    this.viewport = { x, y, zoom };
    this.updateTransform();
  }

  updateTransform() {
    const transform = `translate(${this.viewport.x}, ${this.viewport.y}) scale(${this.viewport.zoom})`;
    this.edgeLayer.setAttribute("transform", transform);
    this.nodeLayer.setAttribute("transform", transform);
  }

  getSVG() {
    return this.svg;
  }

  clear() {
    while (this.nodeLayer.firstChild) {
      this.nodeLayer.removeChild(this.nodeLayer.firstChild);
    }
    while (this.edgeLayer.firstChild) {
      this.edgeLayer.removeChild(this.edgeLayer.firstChild);
    }
  }
}
