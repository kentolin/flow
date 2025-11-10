// ============================================================================
// FILE: src/ui/dialogs/ShapePickerDialog.js
// ============================================================================
export class ShapePickerDialog {
  constructor(shapeRegistry, eventBus) {
    this.shapeRegistry = shapeRegistry;
    this.eventBus = eventBus;
    this.element = null;
    this.isOpen = false;
    this.selectedShape = null;
    this.callback = null;
    this.searchQuery = "";
    this.selectedCategory = "all";
  }

  render() {
    this.element = document.createElement("div");
    this.element.className = "dialog-overlay";
    this.element.style.display = "none";

    const dialog = document.createElement("div");
    dialog.className = "dialog shape-picker-dialog";

    // Header
    const header = document.createElement("div");
    header.className = "dialog-header";

    const title = document.createElement("h3");
    title.textContent = "Choose Shape";

    const closeBtn = document.createElement("button");
    closeBtn.className = "dialog-close";
    closeBtn.textContent = "✕";
    closeBtn.addEventListener("click", () => this.close());

    header.appendChild(title);
    header.appendChild(closeBtn);
    dialog.appendChild(header);

    // Body
    const body = document.createElement("div");
    body.className = "dialog-body shape-picker-body";

    // Search and filter section
    const controlsSection = this.createControlsSection();
    body.appendChild(controlsSection);

    // Categories sidebar
    const sidebar = this.createCategoriesSidebar();
    body.appendChild(sidebar);

    // Shapes grid
    const shapesGrid = this.createShapesGrid();
    body.appendChild(shapesGrid);

    dialog.appendChild(body);

    // Footer
    const footer = document.createElement("div");
    footer.className = "dialog-footer";

    const selectedInfo = document.createElement("div");
    selectedInfo.className = "selected-shape-info";
    selectedInfo.id = "selected-shape-info";
    selectedInfo.textContent = "No shape selected";
    footer.appendChild(selectedInfo);

    const buttonGroup = document.createElement("div");
    buttonGroup.className = "dialog-button-group";

    const cancelBtn = document.createElement("button");
    cancelBtn.className = "dialog-button dialog-button-secondary";
    cancelBtn.textContent = "Cancel";
    cancelBtn.addEventListener("click", () => this.close());

    const selectBtn = document.createElement("button");
    selectBtn.className = "dialog-button dialog-button-primary";
    selectBtn.id = "select-shape-btn";
    selectBtn.textContent = "Select";
    selectBtn.disabled = true;
    selectBtn.addEventListener("click", () => this.confirmSelection());

    buttonGroup.appendChild(cancelBtn);
    buttonGroup.appendChild(selectBtn);
    footer.appendChild(buttonGroup);

    dialog.appendChild(footer);

    this.element.appendChild(dialog);
    document.body.appendChild(this.element);

    return this.element;
  }

  createControlsSection() {
    const controls = document.createElement("div");
    controls.className = "shape-picker-controls";

    // Search input
    const searchContainer = document.createElement("div");
    searchContainer.className = "search-container";

    const searchIcon = document.createElement("span");
    searchIcon.className = "search-icon";
    searchIcon.textContent = "🔍";

    const searchInput = document.createElement("input");
    searchInput.type = "text";
    searchInput.className = "shape-search-input";
    searchInput.placeholder = "Search shapes...";
    searchInput.addEventListener("input", (e) => {
      this.searchQuery = e.target.value.toLowerCase();
      this.filterShapes();
    });

    searchContainer.appendChild(searchIcon);
    searchContainer.appendChild(searchInput);
    controls.appendChild(searchContainer);

    // View toggle
    const viewToggle = document.createElement("div");
    viewToggle.className = "view-toggle";

    const gridViewBtn = document.createElement("button");
    gridViewBtn.className = "view-toggle-btn active";
    gridViewBtn.dataset.view = "grid";
    gridViewBtn.textContent = "▦";
    gridViewBtn.title = "Grid View";
    gridViewBtn.addEventListener("click", () => this.setView("grid"));

    const listViewBtn = document.createElement("button");
    listViewBtn.className = "view-toggle-btn";
    listViewBtn.dataset.view = "list";
    listViewBtn.textContent = "☰";
    listViewBtn.title = "List View";
    listViewBtn.addEventListener("click", () => this.setView("list"));

    viewToggle.appendChild(gridViewBtn);
    viewToggle.appendChild(listViewBtn);
    controls.appendChild(viewToggle);

    return controls;
  }

  createCategoriesSidebar() {
    const sidebar = document.createElement("div");
    sidebar.className = "shape-categories-sidebar";

    const categoriesTitle = document.createElement("h4");
    categoriesTitle.className = "categories-title";
    categoriesTitle.textContent = "Categories";
    sidebar.appendChild(categoriesTitle);

    const categoriesList = document.createElement("div");
    categoriesList.className = "categories-list";
    categoriesList.id = "categories-list";

    // All category
    const allCategory = this.createCategoryItem("all", "All Shapes", "📦");
    categoriesList.appendChild(allCategory);

    // Get categories from registry
    const categories = this.shapeRegistry.getAllCategories();
    const categoryIcons = {
      basic: "⬜",
      flowchart: "🔄",
      network: "🌐",
      uml: "📊",
      custom: "⭐",
    };

    categories.forEach((category) => {
      const icon = categoryIcons[category] || "📁";
      const categoryItem = this.createCategoryItem(
        category,
        this.formatCategoryName(category),
        icon
      );
      categoriesList.appendChild(categoryItem);
    });

    sidebar.appendChild(categoriesList);
    return sidebar;
  }

  createCategoryItem(id, name, icon) {
    const item = document.createElement("div");
    item.className = "category-item";
    item.dataset.category = id;

    if (id === this.selectedCategory) {
      item.classList.add("active");
    }

    const iconSpan = document.createElement("span");
    iconSpan.className = "category-icon";
    iconSpan.textContent = icon;

    const nameSpan = document.createElement("span");
    nameSpan.className = "category-name";
    nameSpan.textContent = name;

    const countSpan = document.createElement("span");
    countSpan.className = "category-count";

    let count = 0;
    if (id === "all") {
      this.shapeRegistry.getAllCategories().forEach((cat) => {
        count += this.shapeRegistry.getCategory(cat).length;
      });
    } else {
      count = this.shapeRegistry.getCategory(id).length;
    }
    countSpan.textContent = count;

    item.appendChild(iconSpan);
    item.appendChild(nameSpan);
    item.appendChild(countSpan);

    item.addEventListener("click", () => {
      this.selectCategory(id);
    });

    return item;
  }

  createShapesGrid() {
    const container = document.createElement("div");
    container.className = "shapes-grid-container";

    const grid = document.createElement("div");
    grid.className = "shapes-grid";
    grid.id = "shapes-grid";

    this.populateShapesGrid(grid);

    container.appendChild(grid);
    return container;
  }

  populateShapesGrid(grid) {
    grid.innerHTML = "";

    const categories =
      this.selectedCategory === "all"
        ? this.shapeRegistry.getAllCategories()
        : [this.selectedCategory];

    categories.forEach((category) => {
      const shapes = this.shapeRegistry.getCategory(category);

      shapes.forEach((shapeType) => {
        if (this.searchQuery && !this.matchesSearch(shapeType, category)) {
          return;
        }

        const shapeCard = this.createShapeCard(shapeType, category);
        grid.appendChild(shapeCard);
      });
    });

    if (grid.children.length === 0) {
      const emptyState = document.createElement("div");
      emptyState.className = "empty-state";
      emptyState.textContent = "No shapes found";
      grid.appendChild(emptyState);
    }
  }

  createShapeCard(shapeType, category) {
    const card = document.createElement("div");
    card.className = "shape-card";
    card.dataset.shapeType = shapeType;
    card.dataset.category = category;

    if (this.selectedShape === shapeType) {
      card.classList.add("selected");
    }

    // Preview
    const preview = document.createElement("div");
    preview.className = "shape-card-preview";

    const svg = this.createShapePreview(shapeType);
    preview.appendChild(svg);
    card.appendChild(preview);

    // Info
    const info = document.createElement("div");
    info.className = "shape-card-info";

    const name = document.createElement("div");
    name.className = "shape-card-name";
    name.textContent = this.formatShapeName(shapeType);
    info.appendChild(name);

    const categoryTag = document.createElement("div");
    categoryTag.className = "shape-card-category";
    categoryTag.textContent = this.formatCategoryName(category);
    info.appendChild(categoryTag);

    card.appendChild(info);

    // Events
    card.addEventListener("click", () => {
      this.selectShape(shapeType);
    });

    card.addEventListener("dblclick", () => {
      this.selectShape(shapeType);
      this.confirmSelection();
    });

    return card;
  }

  createShapePreview(type) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", "shape-preview-svg");
    svg.setAttribute("width", "80");
    svg.setAttribute("height", "60");
    svg.setAttribute("viewBox", "0 0 80 60");

    let shape;

    switch (type) {
      case "rect":
      case "process":
        shape = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        shape.setAttribute("x", "10");
        shape.setAttribute("y", "10");
        shape.setAttribute("width", "60");
        shape.setAttribute("height", "40");
        shape.setAttribute("rx", "4");
        break;

      case "circle":
        shape = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "ellipse"
        );
        shape.setAttribute("cx", "40");
        shape.setAttribute("cy", "30");
        shape.setAttribute("rx", "30");
        shape.setAttribute("ry", "20");
        break;

      case "diamond":
      case "decision":
        shape = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "polygon"
        );
        shape.setAttribute("points", "40,5 70,30 40,55 10,30");
        break;

      case "terminator":
        shape = document.createElementNS("http://www.w3.org/2000/svg", "path");
        shape.setAttribute(
          "d",
          "M 30,10 L 50,10 A 20,20 0 0 1 50,50 L 30,50 A 20,20 0 0 1 30,10 Z"
        );
        break;

      default:
        shape = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        shape.setAttribute("x", "10");
        shape.setAttribute("y", "10");
        shape.setAttribute("width", "60");
        shape.setAttribute("height", "40");
        shape.setAttribute("rx", "4");
    }

    shape.setAttribute("fill", "#E3F2FD");
    shape.setAttribute("stroke", "#1976D2");
    shape.setAttribute("stroke-width", "2");

    svg.appendChild(shape);
    return svg;
  }

  selectCategory(categoryId) {
    this.selectedCategory = categoryId;

    // Update category items
    const categoryItems = this.element.querySelectorAll(".category-item");
    categoryItems.forEach((item) => {
      if (item.dataset.category === categoryId) {
        item.classList.add("active");
      } else {
        item.classList.remove("active");
      }
    });

    // Update shapes grid
    const grid = this.element.querySelector("#shapes-grid");
    if (grid) {
      this.populateShapesGrid(grid);
    }
  }

  selectShape(shapeType) {
    this.selectedShape = shapeType;

    // Update shape cards
    const shapeCards = this.element.querySelectorAll(".shape-card");
    shapeCards.forEach((card) => {
      if (card.dataset.shapeType === shapeType) {
        card.classList.add("selected");
      } else {
        card.classList.remove("selected");
      }
    });

    // Update footer info
    const selectedInfo = this.element.querySelector("#selected-shape-info");
    if (selectedInfo) {
      selectedInfo.textContent = `Selected: ${this.formatShapeName(shapeType)}`;
    }

    // Enable select button
    const selectBtn = this.element.querySelector("#select-shape-btn");
    if (selectBtn) {
      selectBtn.disabled = false;
    }
  }

  setView(viewType) {
    const grid = this.element.querySelector("#shapes-grid");
    const buttons = this.element.querySelectorAll(".view-toggle-btn");

    buttons.forEach((btn) => {
      if (btn.dataset.view === viewType) {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    });

    if (grid) {
      if (viewType === "list") {
        grid.classList.add("list-view");
      } else {
        grid.classList.remove("list-view");
      }
    }
  }

  filterShapes() {
    const grid = this.element.querySelector("#shapes-grid");
    if (grid) {
      this.populateShapesGrid(grid);
    }
  }

  matchesSearch(shapeType, category) {
    if (!this.searchQuery) return true;

    const shapeName = this.formatShapeName(shapeType).toLowerCase();
    const categoryName = this.formatCategoryName(category).toLowerCase();

    return (
      shapeName.includes(this.searchQuery) ||
      categoryName.includes(this.searchQuery) ||
      shapeType.includes(this.searchQuery)
    );
  }

  formatShapeName(type) {
    return type
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  formatCategoryName(category) {
    return (
      category.charAt(0).toUpperCase() + category.slice(1).replace(/-/g, " ")
    );
  }

  open(callback) {
    if (!this.element) this.render();

    this.callback = callback;
    this.selectedShape = null;
    this.searchQuery = "";
    this.selectedCategory = "all";

    // Reset UI
    const searchInput = this.element.querySelector(".shape-search-input");
    if (searchInput) searchInput.value = "";

    const selectedInfo = this.element.querySelector("#selected-shape-info");
    if (selectedInfo) selectedInfo.textContent = "No shape selected";

    const selectBtn = this.element.querySelector("#select-shape-btn");
    if (selectBtn) selectBtn.disabled = true;

    // Refresh grid
    const grid = this.element.querySelector("#shapes-grid");
    if (grid) {
      this.populateShapesGrid(grid);
    }

    this.element.style.display = "flex";
    this.isOpen = true;

    this.eventBus.emit("shape-picker:opened");
  }

  close() {
    if (this.element) {
      this.element.style.display = "none";
      this.isOpen = false;
      this.eventBus.emit("shape-picker:closed");
    }
  }

  confirmSelection() {
    if (!this.selectedShape) return;

    if (this.callback) {
      this.callback(this.selectedShape);
    }

    this.eventBus.emit("shape:selected", {
      type: this.selectedShape,
    });

    this.close();
  }

  destroy() {
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
  }
}
