// ============================================================================
// FILE: src/shapes/registry/ShapeRegistry.js
// ============================================================================
export class ShapeRegistry {
  constructor() {
    this.shapes = new Map();
    this.categories = new Map();
  }

  register(type, shapeClass, category = "basic") {
    this.shapes.set(type, shapeClass);

    if (!this.categories.has(category)) {
      this.categories.set(category, []);
    }
    this.categories.get(category).push(type);
  }

  getShape(type) {
    return this.shapes.get(type);
  }

  hasShape(type) {
    return this.shapes.has(type);
  }

  getCategory(category) {
    return this.categories.get(category) || [];
  }

  getAllCategories() {
    return Array.from(this.categories.keys());
  }

  getAllShapes() {
    return Array.from(this.shapes.entries());
  }

  unregister(type) {
    this.shapes.delete(type);

    // Remove from categories
    for (const [category, types] of this.categories) {
      const index = types.indexOf(type);
      if (index > -1) {
        types.splice(index, 1);
      }
    }
  }
}
