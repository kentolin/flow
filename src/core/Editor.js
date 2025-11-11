/**
 * Editor - Main SVG Canvas Manager
 * Manages SVG rendering, viewport, transforms, and canvas interactions
 */

class Editor {
  constructor(eventBus, stateManager) {
    this.eventBus = eventBus;
    this.stateManager = stateManager;

    this.svg = null;
    this.container = null;

    // SVG groups for layering
    this.gridLayer = null;
    this.edgeLayer = null;
    this.nodeLayer = null;
    this.selectionLayer = null;
    this.controlLayer = null;

    // Transform state
    this.viewport = { x: 0, y: 0, zoom: 1 };
    this.transform = null;

    // Element maps for quick lookup
    this.nodeElements = new Map(); // nodeId -> SVG element
    this.edgeElements = new Map(); // edgeId -> SVG element

    // Pan and zoom state
    this.isPanning = false;
    this.lastPanX = 0;
    this.lastPanY = 0;
  }

  /**
   * Initialize the SVG editor
   * @param {SVGElement} svgElement - The SVG element to use
   */
  initialize(svgElement) {
    this.svg = svgElement;
    this.container = svgElement.parentElement;

    // Setup SVG attributes
    this.svg.setAttribute("viewBox", "0 0 1920 1080");
    this.svg.setAttribute("preserveAspectRatio", "xMidYMid meet");

    // Create layer groups
    this._createLayers();

    // Setup event handlers
    this._setupEventHandlers();

    console.log("✅ Editor initialized");
  }

  /**
   * Create SVG layers for proper z-ordering
   */
  _createLayers() {
    // Grid layer
    this.gridLayer = this._createGroup("grid-layer");

    // Edge layer (connections)
    this.edgeLayer = this._createGroup("edge-layer");

    // Node layer (shapes)
    this.nodeLayer = this._createGroup("node-layer");

    // Selection/highlight layer
    this.selectionLayer = this._createGroup("selection-layer");

    // Control handles layer
    this.controlLayer = this._createGroup("control-layer");

    // Draw grid
    this._drawGrid();
  }

  /**
   * Create a group element
   */
  _createGroup(id, className = "") {
    const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
    group.id = id;
    if (className) group.setAttribute("class", className);
    this.svg.appendChild(group);
    return group;
  }

  /**
   * Draw the background grid
   */
  _drawGrid() {
    const gridSize = 20;
    const width = 1920;
    const height = 1080;

    for (let x = 0; x <= width; x += gridSize) {
      const line = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "line"
      );
      line.setAttribute("x1", x);
      line.setAttribute("y1", 0);
      line.setAttribute("x2", x);
      line.setAttribute("y2", height);
      line.setAttribute("stroke", "#f0f0f0");
      line.setAttribute("stroke-width", "1");
      this.gridLayer.appendChild(line);
    }

    for (let y = 0; y <= height; y += gridSize) {
      const line = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "line"
      );
      line.setAttribute("x1", 0);
      line.setAttribute("y1", y);
      line.setAttribute("x2", width);
      line.setAttribute("y2", y);
      line.setAttribute("stroke", "#f0f0f0");
      line.setAttribute("stroke-width", "1");
      this.gridLayer.appendChild(line);
    }
  }

  /**
   * Setup event handlers for canvas interactions
   */
  _setupEventHandlers() {
    // Mouse wheel for zoom
    this.svg.addEventListener("wheel", (e) => this._handleZoom(e));

    // Pan with middle mouse button or space + drag
    this.svg.addEventListener("mousedown", (e) => this._handlePanStart(e));
    document.addEventListener("mousemove", (e) => this._handlePan(e));
    document.addEventListener("mouseup", (e) => this._handlePanEnd(e));

    // Click on canvas
    this.svg.addEventListener("click", (e) => this._handleCanvasClick(e));

    // Drag over canvas
    this.svg.addEventListener("dragover", (e) => this._handleDragOver(e));
    this.svg.addEventListener("drop", (e) => this._handleDrop(e));
  }

  /**
   * Handle zoom with mouse wheel
   */
  _handleZoom(e) {
    e.preventDefault();

    const zoomSpeed = 0.1;
    const newZoom =
      e.deltaY > 0
        ? this.viewport.zoom - zoomSpeed
        : this.viewport.zoom + zoomSpeed;

    // Clamp zoom between 0.1 and 5
    const clampedZoom = Math.max(0.1, Math.min(5, newZoom));

    this.setViewport({ ...this.viewport, zoom: clampedZoom });
  }

  /**
   * Handle pan start
   */
  _handlePanStart(e) {
    if (e.button === 1 || e.button === 2 || (e.button === 0 && e.spaceKey)) {
      this.isPanning = true;
      this.lastPanX = e.clientX;
      this.lastPanY = e.clientY;
    }
  }

  /**
   * Handle pan movement
   */
  _handlePan(e) {
    if (!this.isPanning) return;

    const dx = (e.clientX - this.lastPanX) / this.viewport.zoom;
    const dy = (e.clientY - this.lastPanY) / this.viewport.zoom;

    this.viewport.x += dx;
    this.viewport.y += dy;

    this.updateTransform();

    this.lastPanX = e.clientX;
    this.lastPanY = e.clientY;
  }

  /**
   * Handle pan end
   */
  _handlePanEnd() {
    this.isPanning = false;
  }

  /**
   * Handle canvas click
   */
  _handleCanvasClick(e) {
    if (e.target === this.svg) {
      this.eventBus.emit("canvas:clicked", { x: e.clientX, y: e.clientY });
    }
  }

  /**
   * Handle drag over canvas
   */
  _handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  }

  /**
   * Handle drop on canvas
   */
  _handleDrop(e) {
    e.preventDefault();
    const data = e.dataTransfer.getData("application/json");
    const coords = this.getCanvasCoordinates(e.clientX, e.clientY);

    if (data) {
      this.eventBus.emit("shape:dropped", {
        data: JSON.parse(data),
        x: coords.x,
        y: coords.y,
      });
    }
  }

  /**
   * Convert client coordinates to canvas coordinates
   */
  getCanvasCoordinates(clientX, clientY) {
    const rect = this.svg.getBoundingClientRect();
    const x = (clientX - rect.left) / this.viewport.zoom - this.viewport.x;
    const y = (clientY - rect.top) / this.viewport.zoom - this.viewport.y;
    return { x, y };
  }

  /**
   * Set viewport and update transform
   */
  setViewport(viewport) {
    this.viewport = { ...this.viewport, ...viewport };
    this.updateTransform();
    this.stateManager.setViewport(this.viewport);
    this.eventBus.emit("viewport:changed", this.viewport);
  }

  /**
   * Update SVG transform based on viewport
   */
  updateTransform() {
    const transformStr = `translate(${this.viewport.x}, ${this.viewport.y}) scale(${this.viewport.zoom})`;
    this.nodeLayer.setAttribute("transform", transformStr);
    this.edgeLayer.setAttribute("transform", transformStr);
    this.selectionLayer.setAttribute("transform", transformStr);
    this.controlLayer.setAttribute("transform", transformStr);
  }

  /**
   * Add a node element to the canvas
   */
  addNodeElement(nodeId, svgElement) {
    this.nodeElements.set(nodeId, svgElement);
    this.nodeLayer.appendChild(svgElement);
  }

  /**
   * Remove a node element from the canvas
   */
  removeNodeElement(nodeId) {
    const element = this.nodeElements.get(nodeId);
    if (element) {
      element.remove();
      this.nodeElements.delete(nodeId);
    }
  }

  /**
   * Add an edge element to the canvas
   */
  addEdgeElement(edgeId, svgElement) {
    this.edgeElements.set(edgeId, svgElement);
    this.edgeLayer.appendChild(svgElement);
  }

  /**
   * Remove an edge element from the canvas
   */
  removeEdgeElement(edgeId) {
    const element = this.edgeElements.get(edgeId);
    if (element) {
      element.remove();
      this.edgeElements.delete(edgeId);
    }
  }

  /**
   * Clear all elements from canvas
   */
  clear() {
    this.nodeLayer.innerHTML = "";
    this.edgeLayer.innerHTML = "";
    this.selectionLayer.innerHTML = "";
    this.controlLayer.innerHTML = "";
    this.nodeElements.clear();
    this.edgeElements.clear();
  }

  /**
   * Get the SVG element
   */
  getSVG() {
    return this.svg;
  }

  /**
   * Export canvas as SVG string
   */
  exportSVG() {
    const clonedSvg = this.svg.cloneNode(true);
    return new XMLSerializer().serializeToString(clonedSvg);
  }

  /**
   * Export canvas as image data
   */
  async exportImage(format = "png") {
    const svgString = this.exportSVG();
    const blob = new Blob([svgString], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);

    if (format === "svg") {
      return url;
    }

    // For PNG, would need canvas rendering library
    // This is a placeholder
    return url;
  }

  /**
   * Fit canvas to view all elements
   */
  fitToView(padding = 20) {
    const bbox = this.svg.getBBox();
    const containerWidth = this.container.clientWidth;
    const containerHeight = this.container.clientHeight;

    const scale = Math.min(
      (containerWidth - padding * 2) / bbox.width,
      (containerHeight - padding * 2) / bbox.height
    );

    this.setViewport({
      x: -bbox.x + padding,
      y: -bbox.y + padding,
      zoom: scale,
    });
  }
}

export { Editor };
