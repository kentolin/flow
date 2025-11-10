// ============================================================================
// FILE: src/ui/panels/LayersPanel.js
// ============================================================================
export class LayersPanel {
  constructor(nodeManager, edgeManager, eventBus) {
    this.nodeManager = nodeManager;
    this.edgeManager = edgeManager;
    this.eventBus = eventBus;
    this.element = null;
  }

  render() {
    this.element = document.createElement("div");
    this.element.className = "layers-panel";

    const header = document.createElement("div");
    header.className = "panel-header";

    const title = document.createElement("h3");
    title.textContent = "Layers";
    header.appendChild(title);

    const controls = document.createElement("div");
    controls.className = "layer-controls";

    const addBtn = this.createButton("+", "Add Layer");
    const deleteBtn = this.createButton("🗑", "Delete Layer");
    controls.appendChild(addBtn);
    controls.appendChild(deleteBtn);

    header.appendChild(controls);
    this.element.appendChild(header);

    const layerList = document.createElement("div");
    layerList.className = "layer-list";
    layerList.id = "layer-list";
    this.element.appendChild(layerList);

    this.updateLayerList();
    this.attachEventListeners();

    return this.element;
  }

  createButton(text, title) {
    const btn = document.createElement("button");
    btn.className = "layer-control-btn";
    btn.textContent = text;
    btn.title = title;
    return btn;
  }

  updateLayerList() {
    const layerList = this.element.querySelector("#layer-list");
    if (!layerList) return;

    layerList.innerHTML = "";

    const nodes = this.nodeManager.getAllNodes();
    const sortedNodes = nodes.sort((a, b) => (b.zIndex || 0) - (a.zIndex || 0));

    sortedNodes.forEach((node) => {
      const layerItem = this.createLayerItem(node);
      layerList.appendChild(layerItem);
    });

    if (sortedNodes.length === 0) {
      const empty = document.createElement("div");
      empty.className = "layer-empty";
      empty.textContent = "No layers";
      layerList.appendChild(empty);
    }
  }

  createLayerItem(node) {
    const item = document.createElement("div");
    item.className = "layer-item";
    item.dataset.nodeId = node.id;

    const visibility = document.createElement("span");
    visibility.className = "layer-visibility";
    visibility.textContent = "👁";
    visibility.addEventListener("click", (e) => {
      e.stopPropagation();
      this.toggleVisibility(node);
    });

    const icon = document.createElement("span");
    icon.className = "layer-icon";
    icon.textContent = this.getNodeIcon(node.type);

    const label = document.createElement("span");
    label.className = "layer-label";
    label.textContent = node.label || `${node.type} ${node.id.slice(-4)}`;

    const zIndex = document.createElement("span");
    zIndex.className = "layer-zindex";
    zIndex.textContent = node.zIndex || 0;

    item.appendChild(visibility);
    item.appendChild(icon);
    item.appendChild(label);
    item.appendChild(zIndex);

    item.addEventListener("click", () => {
      this.eventBus.emit("node:selected", node);
    });

    return item;
  }

  getNodeIcon(type) {
    const icons = {
      rect: "▭",
      circle: "◯",
      diamond: "◇",
      process: "▭",
      decision: "◇",
      terminator: "⬭",
    };
    return icons[type] || "▭";
  }

  toggleVisibility(node) {
    node.visible = !node.visible;
    const view = this.nodeManager.getView(node.id);
    if (view && view.element) {
      view.element.style.opacity = node.visible ? "1" : "0.3";
    }
  }

  attachEventListeners() {
    this.eventBus.on("node:created", () => this.updateLayerList());
    this.eventBus.on("node:removed", () => this.updateLayerList());
    this.eventBus.on("node:updated", () => this.updateLayerList());
  }
}
