// ============================================================================
// FILE: src/ui/panels/LeftPalette.js
// ============================================================================
export class LeftPalette {
  constructor(shapeRegistry, eventBus) {
    this.shapeRegistry = shapeRegistry;
    this.eventBus = eventBus;
    this.element = null;
    this.searchInput = null;
    this.expandedCategories = new Set(["basic", "flowchart"]);
  }

  render() {
    this.element = document.createElement("div");
    this.element.className = "left-palette";

    // Header with search
    const header = document.createElement("div");
    header.className = "palette-header";

    const title = document.createElement("h3");
    title.textContent = "Shapes";
    header.appendChild(title);

    this.searchInput = document.createElement("input");
    this.searchInput.type = "text";
    this.searchInput.className = "palette-search";
    this.searchInput.placeholder = "Search shapes...";
    this.searchInput.addEventListener("input", (e) =>
      this.handleSearch(e.target.value)
    );
    header.appendChild(this.searchInput);

    this.element.appendChild(header);

    // Categories
    const categories = this.shapeRegistry.getAllCategories();
    const content = document.createElement("div");
    content.className = "palette-content";

    categories.forEach((category) => {
      const categorySection = this.createCategorySection(category);
      content.appendChild(categorySection);
    });

    this.element.appendChild(content);
    return this.element;
  }

  createCategorySection(category) {
    const section = document.createElement("div");
    section.className = "palette-category";
    section.dataset.category = category;

    const header = document.createElement("div");
    header.className = "category-header";

    const toggle = document.createElement("span");
    toggle.className = "category-toggle";
    toggle.textContent = this.expandedCategories.has(category) ? "▼" : "▶";

    const title = document.createElement("span");
    title.className = "category-title";
    title.textContent = this.formatCategoryName(category);

    header.appendChild(toggle);
    header.appendChild(title);
    header.addEventListener("click", () =>
      this.toggleCategory(section, category)
    );

    section.appendChild(header);

    const shapes = this.shapeRegistry.getCategory(category);
    const grid = document.createElement("div");
    grid.className = "shape-grid";

    if (this.expandedCategories.has(category)) {
      grid.classList.add("expanded");
    }

    shapes.forEach((type) => {
      const shapeItem = this.createShapeItem(type, category);
      grid.appendChild(shapeItem);
    });

    section.appendChild(grid);
    return section;
  }

  createShapeItem(type, category) {
    const item = document.createElement("div");
    item.className = "shape-item";
    item.dataset.shapeType = type;
    item.dataset.category = category;

    // Create preview SVG
    const preview = this.createShapePreview(type);
    item.appendChild(preview);

    const label = document.createElement("div");
    label.className = "shape-label";
    label.textContent = this.formatShapeName(type);
    item.appendChild(label);

    item.addEventListener("click", () => {
      this.eventBus.emit("shape:selected", { type });
      item.classList.add("selected");
      setTimeout(() => item.classList.remove("selected"), 200);
    });

    item.draggable = true;
    item.addEventListener("dragstart", (e) => {
      e.dataTransfer.setData("shape-type", type);
      e.dataTransfer.effectAllowed = "copy";
      item.classList.add("dragging");
    });

    item.addEventListener("dragend", () => {
      item.classList.remove("dragging");
    });

    return item;
  }

  createShapePreview(type) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", "shape-preview");
    svg.setAttribute("width", "60");
    svg.setAttribute("height", "40");
    svg.setAttribute("viewBox", "0 0 60 40");

    let shape;
    switch (type) {
      case "rect":
      case "process":
        shape = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        shape.setAttribute("x", "5");
        shape.setAttribute("y", "5");
        shape.setAttribute("width", "50");
        shape.setAttribute("height", "30");
        shape.setAttribute("rx", "3");
        break;
      case "circle":
        shape = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "ellipse"
        );
        shape.setAttribute("cx", "30");
        shape.setAttribute("cy", "20");
        shape.setAttribute("rx", "25");
        shape.setAttribute("ry", "15");
        break;
      case "diamond":
      case "decision":
        shape = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "polygon"
        );
        shape.setAttribute("points", "30,5 55,20 30,35 5,20");
        break;
      case "terminator":
        shape = document.createElementNS("http://www.w3.org/2000/svg", "path");
        shape.setAttribute(
          "d",
          "M 15,5 L 45,5 A 15,15 0 0 1 45,35 L 15,35 A 15,15 0 0 1 15,5 Z"
        );
        break;
      default:
        shape = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        shape.setAttribute("x", "5");
        shape.setAttribute("y", "5");
        shape.setAttribute("width", "50");
        shape.setAttribute("height", "30");
    }

    shape.setAttribute("fill", "var(--node-fill)");
    shape.setAttribute("stroke", "var(--node-stroke)");
    shape.setAttribute("stroke-width", "2");

    svg.appendChild(shape);
    return svg;
  }

  toggleCategory(section, category) {
    const grid = section.querySelector(".shape-grid");
    const toggle = section.querySelector(".category-toggle");

    if (this.expandedCategories.has(category)) {
      this.expandedCategories.delete(category);
      grid.classList.remove("expanded");
      toggle.textContent = "▶";
    } else {
      this.expandedCategories.add(category);
      grid.classList.add("expanded");
      toggle.textContent = "▼";
    }
  }

  handleSearch(query) {
    const items = this.element.querySelectorAll(".shape-item");
    const lowerQuery = query.toLowerCase();

    items.forEach((item) => {
      const type = item.dataset.shapeType;
      const label = item
        .querySelector(".shape-label")
        .textContent.toLowerCase();

      if (label.includes(lowerQuery) || type.includes(lowerQuery)) {
        item.style.display = "";
      } else {
        item.style.display = "none";
      }
    });

    // Auto-expand categories with matching items
    if (query) {
      const categories = this.element.querySelectorAll(".palette-category");
      categories.forEach((cat) => {
        const visibleItems = cat.querySelectorAll(
          '.shape-item:not([style*="display: none"])'
        );
        if (visibleItems.length > 0) {
          const categoryName = cat.dataset.category;
          const grid = cat.querySelector(".shape-grid");
          const toggle = cat.querySelector(".category-toggle");

          this.expandedCategories.add(categoryName);
          grid.classList.add("expanded");
          toggle.textContent = "▼";
        }
      });
    }
  }

  formatCategoryName(category) {
    return (
      category.charAt(0).toUpperCase() + category.slice(1).replace(/-/g, " ")
    );
  }

  formatShapeName(type) {
    return type
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }
}
