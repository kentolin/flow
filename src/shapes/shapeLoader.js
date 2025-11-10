// ============================================================================
// FILE: src/shapes/shapeLoader.js
// ============================================================================
import { RectShape } from "./library/basic/rect/RectShape.js";
import { CircleShape } from "./library/basic/circle/CircleShape.js";
import { DiamondShape } from "./library/basic/diamond/DiamondShape.js";
import { ProcessShape } from "./library/flowchart/process/ProcessShape.js";
import { DecisionShape } from "./library/flowchart/decision/DecisionShape.js";
import { TerminatorShape } from "./library/flowchart/terminator/TerminatorShape.js";

export class ShapeLoader {
  static loadBuiltInShapes(registry) {
    // Basic shapes
    registry.register("rect", new RectShape(), "basic");
    registry.register("circle", new CircleShape(), "basic");
    registry.register("diamond", new DiamondShape(), "basic");

    // Flowchart shapes
    registry.register("process", new ProcessShape(), "flowchart");
    registry.register("decision", new DecisionShape(), "flowchart");
    registry.register("terminator", new TerminatorShape(), "flowchart");
  }

  static async loadCustomShape(registry, shapePath) {
    try {
      const module = await import(shapePath);
      const ShapeClass = module.default || module[Object.keys(module)[0]];
      const shape = new ShapeClass();
      registry.register(shape.type, shape, "custom");
      return shape;
    } catch (error) {
      console.error(`Failed to load shape from ${shapePath}:`, error);
      return null;
    }
  }
}

// ============================================================================
// FILE: src/ui/panels/LeftPalette.js
// ============================================================================
export class LeftPalette {
  constructor(shapeRegistry, eventBus) {
    this.shapeRegistry = shapeRegistry;
    this.eventBus = eventBus;
    this.element = null;
  }

  render() {
    this.element = document.createElement("div");
    this.element.className = "left-palette";

    const header = document.createElement("div");
    header.className = "palette-header";
    header.textContent = "Shapes";
    this.element.appendChild(header);

    const categories = this.shapeRegistry.getAllCategories();

    categories.forEach((category) => {
      const categorySection = this.createCategorySection(category);
      this.element.appendChild(categorySection);
    });

    return this.element;
  }

  createCategorySection(category) {
    const section = document.createElement("div");
    section.className = "palette-category";

    const header = document.createElement("div");
    header.className = "category-header";
    header.textContent = category.charAt(0).toUpperCase() + category.slice(1);
    section.appendChild(header);

    const shapes = this.shapeRegistry.getCategory(category);
    const grid = document.createElement("div");
    grid.className = "shape-grid";

    shapes.forEach((type) => {
      const shapeItem = this.createShapeItem(type);
      grid.appendChild(shapeItem);
    });

    section.appendChild(grid);
    return section;
  }

  createShapeItem(type) {
    const item = document.createElement("div");
    item.className = "shape-item";
    item.dataset.shapeType = type;
    item.textContent = type;

    item.addEventListener("click", () => {
      this.eventBus.emit("shape:selected", { type });
    });

    item.draggable = true;
    item.addEventListener("dragstart", (e) => {
      e.dataTransfer.setData("shape-type", type);
      e.dataTransfer.effectAllowed = "copy";
    });

    return item;
  }
}
