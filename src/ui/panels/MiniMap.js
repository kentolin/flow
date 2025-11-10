// ============================================================================
// FILE: src/ui/panels/MiniMap.js
// ============================================================================
export class MiniMap {
  constructor(editor, nodeManager, edgeManager, eventBus) {
    this.editor = editor;
    this.nodeManager = nodeManager;
    this.edgeManager = edgeManager;
    this.eventBus = eventBus;
    this.element = null;
    this.canvas = null;
    this.ctx = null;
    this.scale = 0.1;
    this.viewportRect = { x: 0, y: 0, width: 0, height: 0 };
    this.isDragging = false;
    this.isVisible = true;
    this.canvasWidth = 200;
    this.canvasHeight = 150;
    this.padding = 10;
  }

  render() {
    this.element = document.createElement("div");
    this.element.className = "minimap";

    // Header
    const header = document.createElement("div");
    header.className = "minimap-header";

    const title = document.createElement("span");
    title.textContent = "Navigator";
    header.appendChild(title);

    const controls = document.createElement("div");
    controls.className = "minimap-controls";

    const refreshBtn = document.createElement("button");
    refreshBtn.className = "minimap-btn";
    refreshBtn.textContent = "↻";
    refreshBtn.title = "Refresh";
    refreshBtn.addEventListener("click", () => this.update());

    const closeBtn = document.createElement("button");
    closeBtn.className = "minimap-btn";
    closeBtn.textContent = "✕";
    closeBtn.title = "Close";
    closeBtn.addEventListener("click", () => this.hide());

    controls.appendChild(refreshBtn);
    controls.appendChild(closeBtn);
    header.appendChild(controls);

    this.element.appendChild(header);

    // Canvas
    this.canvas = document.createElement("canvas");
    this.canvas.width = this.canvasWidth;
    this.canvas.height = this.canvasHeight;
    this.canvas.className = "minimap-canvas";
    this.ctx = this.canvas.getContext("2d");

    this.element.appendChild(this.canvas);

    // Footer with zoom info
    const footer = document.createElement("div");
    footer.className = "minimap-footer";
    footer.id = "minimap-footer";
    footer.textContent = "Zoom: 100%";
    this.element.appendChild(footer);

    this.attachEventListeners();
    this.update();

    return this.element;
  }

  attachEventListeners() {
    // Node events
    this.eventBus.on("node:created", () => this.update());
    this.eventBus.on("node:updated", () => this.update());
    this.eventBus.on("node:removed", () => this.update());
    this.eventBus.on("node:drag:move", () => this.update());
    this.eventBus.on("node:drag:end", () => this.update());

    // Edge events
    this.eventBus.on("edge:created", () => this.update());
    this.eventBus.on("edge:updated", () => this.update());
    this.eventBus.on("edge:removed", () => this.update());

    // Viewport events
    this.eventBus.on("viewport:changed", (viewport) => {
      this.viewportRect = viewport;
      this.updateFooter(viewport);
      this.update();
    });

    // Mouse interaction for navigation
    this.canvas.addEventListener("mousedown", (e) => this.handleMouseDown(e));
    this.canvas.addEventListener("mousemove", (e) => this.handleMouseMove(e));
    this.canvas.addEventListener("mouseup", () => this.handleMouseUp());
    this.canvas.addEventListener("mouseleave", () => this.handleMouseUp());

    // Prevent context menu
    this.canvas.addEventListener("contextmenu", (e) => e.preventDefault());
  }

  handleMouseDown(e) {
    this.isDragging = true;
    this.canvas.style.cursor = "grabbing";
    this.handleNavigation(e);
  }

  handleMouseMove(e) {
    if (this.isDragging) {
      this.handleNavigation(e);
    } else {
      // Show cursor feedback
      this.canvas.style.cursor = "grab";
    }
  }

  handleMouseUp() {
    this.isDragging = false;
    this.canvas.style.cursor = "grab";
  }

  handleNavigation(e) {
    const rect = this.canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Convert canvas coordinates to world coordinates
    const bounds = this.calculateBounds();
    if (!bounds) return;

    const scaleX =
      (bounds.maxX - bounds.minX + this.padding * 2) / this.canvasWidth;
    const scaleY =
      (bounds.maxY - bounds.minY + this.padding * 2) / this.canvasHeight;

    const worldX = bounds.minX - this.padding + clickX * scaleX;
    const worldY = bounds.minY - this.padding + clickY * scaleY;

    // Emit navigation event
    this.eventBus.emit("minimap:navigate", {
      x: worldX,
      y: worldY,
    });
  }

  update() {
    if (!this.ctx || !this.isVisible) return;

    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);

    // Background
    this.ctx.fillStyle = "#fafafa";
    this.ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);

    // Get all nodes and edges
    const nodes = this.nodeManager.getAllNodes();
    const edges = this.edgeManager.getAllEdges();

    if (nodes.length === 0) {
      this.drawEmptyState();
      return;
    }

    // Calculate bounds
    const bounds = this.calculateBounds();
    if (!bounds) return;

    // Calculate scale to fit all content
    const contentWidth = bounds.maxX - bounds.minX + this.padding * 2;
    const contentHeight = bounds.maxY - bounds.minY + this.padding * 2;

    const scaleX = this.canvasWidth / contentWidth;
    const scaleY = this.canvasHeight / contentHeight;
    this.scale = Math.min(scaleX, scaleY);

    // Center the content
    const scaledWidth = contentWidth * this.scale;
    const scaledHeight = contentHeight * this.scale;
    const offsetX = (this.canvasWidth - scaledWidth) / 2;
    const offsetY = (this.canvasHeight - scaledHeight) / 2;

    this.ctx.save();
    this.ctx.translate(offsetX, offsetY);

    // Draw grid
    this.drawGrid(bounds);

    // Draw edges
    this.drawEdges(edges, bounds);

    // Draw nodes
    this.drawNodes(nodes, bounds);

    // Draw viewport indicator
    this.drawViewport(bounds);

    this.ctx.restore();
  }

  drawEmptyState() {
    this.ctx.fillStyle = "#9e9e9e";
    this.ctx.font = "12px sans-serif";
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "middle";
    this.ctx.fillText(
      "No content",
      this.canvasWidth / 2,
      this.canvasHeight / 2
    );
  }

  drawGrid(bounds) {
    const gridSize = 20;
    const minX = bounds.minX - this.padding;
    const minY = bounds.minY - this.padding;
    const maxX = bounds.maxX + this.padding;
    const maxY = bounds.maxY + this.padding;

    this.ctx.strokeStyle = "#e0e0e0";
    this.ctx.lineWidth = 0.5;

    // Vertical lines
    for (let x = minX; x <= maxX; x += gridSize) {
      const canvasX = (x - minX) * this.scale;
      this.ctx.beginPath();
      this.ctx.moveTo(canvasX, 0);
      this.ctx.lineTo(canvasX, (maxY - minY) * this.scale);
      this.ctx.stroke();
    }

    // Horizontal lines
    for (let y = minY; y <= maxY; y += gridSize) {
      const canvasY = (y - minY) * this.scale;
      this.ctx.beginPath();
      this.ctx.moveTo(0, canvasY);
      this.ctx.lineTo((maxX - minX) * this.scale, canvasY);
      this.ctx.stroke();
    }
  }

  drawNodes(nodes, bounds) {
    const minX = bounds.minX - this.padding;
    const minY = bounds.minY - this.padding;

    nodes.forEach((node) => {
      const x = (node.x - minX) * this.scale;
      const y = (node.y - minY) * this.scale;
      const w = node.width * this.scale;
      const h = node.height * this.scale;

      // Fill
      this.ctx.fillStyle = node.style.fill || "#ffffff";
      this.ctx.fillRect(x, y, w, h);

      // Stroke
      this.ctx.strokeStyle = node.style.stroke || "#333333";
      this.ctx.lineWidth = 1;
      this.ctx.strokeRect(x, y, w, h);

      // Add label indicator if node has label
      if (node.label) {
        this.ctx.fillStyle = "#666666";
        this.ctx.font = "8px sans-serif";
        this.ctx.textAlign = "center";
        this.ctx.textBaseline = "middle";

        // Only draw if big enough
        if (w > 10 && h > 10) {
          const labelText =
            node.label.length > 3
              ? node.label.substring(0, 3) + "..."
              : node.label;
          this.ctx.fillText(labelText, x + w / 2, y + h / 2);
        }
      }
    });
  }

  drawEdges(edges, bounds) {
    const minX = bounds.minX - this.padding;
    const minY = bounds.minY - this.padding;

    this.ctx.strokeStyle = "#999999";
    this.ctx.lineWidth = 1;

    edges.forEach((edge) => {
      const sourceNode = this.nodeManager.getNode(edge.sourceId);
      const targetNode = this.nodeManager.getNode(edge.targetId);

      if (!sourceNode || !targetNode) return;

      const sourceCenter = sourceNode.getCenter();
      const targetCenter = targetNode.getCenter();

      const x1 = (sourceCenter.x - minX) * this.scale;
      const y1 = (sourceCenter.y - minY) * this.scale;
      const x2 = (targetCenter.x - minX) * this.scale;
      const y2 = (targetCenter.y - minY) * this.scale;

      this.ctx.beginPath();
      this.ctx.moveTo(x1, y1);
      this.ctx.lineTo(x2, y2);
      this.ctx.stroke();
    });
  }

  drawViewport(bounds) {
    if (!this.viewportRect) return;

    const minX = bounds.minX - this.padding;
    const minY = bounds.minY - this.padding;

    // Calculate viewport rectangle in minimap coordinates
    const vpX = (this.viewportRect.x - minX) * this.scale;
    const vpY = (this.viewportRect.y - minY) * this.scale;
    const vpW = this.viewportRect.width * this.scale;
    const vpH = this.viewportRect.height * this.scale;

    // Draw semi-transparent overlay outside viewport
    this.ctx.fillStyle = "rgba(0, 0, 0, 0.2)";

    const totalWidth =
      (bounds.maxX - bounds.minX + this.padding * 2) * this.scale;
    const totalHeight =
      (bounds.maxY - bounds.minY + this.padding * 2) * this.scale;

    // Top
    this.ctx.fillRect(0, 0, totalWidth, Math.max(0, vpY));
    // Bottom
    this.ctx.fillRect(0, vpY + vpH, totalWidth, totalHeight - (vpY + vpH));
    // Left
    this.ctx.fillRect(0, vpY, Math.max(0, vpX), vpH);
    // Right
    this.ctx.fillRect(vpX + vpW, vpY, totalWidth - (vpX + vpW), vpH);

    // Draw viewport border
    this.ctx.strokeStyle = "#4A90E2";
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(vpX, vpY, vpW, vpH);

    // Draw grab handles at corners
    const handleSize = 4;
    this.ctx.fillStyle = "#4A90E2";

    // Top-left
    this.ctx.fillRect(
      vpX - handleSize / 2,
      vpY - handleSize / 2,
      handleSize,
      handleSize
    );
    // Top-right
    this.ctx.fillRect(
      vpX + vpW - handleSize / 2,
      vpY - handleSize / 2,
      handleSize,
      handleSize
    );
    // Bottom-left
    this.ctx.fillRect(
      vpX - handleSize / 2,
      vpY + vpH - handleSize / 2,
      handleSize,
      handleSize
    );
    // Bottom-right
    this.ctx.fillRect(
      vpX + vpW - handleSize / 2,
      vpY + vpH - handleSize / 2,
      handleSize,
      handleSize
    );
  }

  calculateBounds() {
    const nodes = this.nodeManager.getAllNodes();

    if (nodes.length === 0) {
      return null;
    }

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    nodes.forEach((node) => {
      minX = Math.min(minX, node.x);
      minY = Math.min(minY, node.y);
      maxX = Math.max(maxX, node.x + node.width);
      maxY = Math.max(maxY, node.y + node.height);
    });

    // Ensure minimum size
    const minSize = 100;
    if (maxX - minX < minSize) {
      const center = (minX + maxX) / 2;
      minX = center - minSize / 2;
      maxX = center + minSize / 2;
    }
    if (maxY - minY < minSize) {
      const center = (minY + maxY) / 2;
      minY = center - minSize / 2;
      maxY = center + minSize / 2;
    }

    return { minX, minY, maxX, maxY };
  }

  updateFooter(viewport) {
    const footer = this.element?.querySelector("#minimap-footer");
    if (footer && viewport) {
      const zoomPercent = Math.round((viewport.zoom || 1) * 100);
      footer.textContent = `Zoom: ${zoomPercent}%`;
    }
  }

  show() {
    if (this.element) {
      this.element.style.display = "block";
      this.isVisible = true;
      this.update();
      this.eventBus.emit("minimap:shown");
    }
  }

  hide() {
    if (this.element) {
      this.element.style.display = "none";
      this.isVisible = false;
      this.eventBus.emit("minimap:hidden");
    }
  }

  toggle() {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  setSize(width, height) {
    this.canvasWidth = width;
    this.canvasHeight = height;

    if (this.canvas) {
      this.canvas.width = width;
      this.canvas.height = height;
      this.update();
    }
  }

  fitToView() {
    const bounds = this.calculateBounds();
    if (!bounds) return;

    // Emit event to fit viewport to all content
    this.eventBus.emit("viewport:fit-to-content", bounds);
  }

  destroy() {
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
    this.canvas = null;
    this.ctx = null;
  }
}
