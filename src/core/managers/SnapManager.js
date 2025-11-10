// ============================================================================
// FILE: src/core/managers/SnapManager.js
// ============================================================================
export class SnapManager {
  constructor(gridSize = 20, snapThreshold = 10) {
    this.gridSize = gridSize;
    this.snapThreshold = snapThreshold;
    this.enabled = true;
  }

  snapToGrid(x, y) {
    if (!this.enabled) return { x, y };

    return {
      x: Math.round(x / this.gridSize) * this.gridSize,
      y: Math.round(y / this.gridSize) * this.gridSize,
    };
  }

  snapToNode(node, otherNodes) {
    if (!this.enabled) return { x: node.x, y: node.y };

    let snappedX = node.x;
    let snappedY = node.y;

    for (const other of otherNodes) {
      if (other.id === node.id) continue;

      // Snap left edge
      if (Math.abs(node.x - other.x) < this.snapThreshold) {
        snappedX = other.x;
      }
      // Snap right edge
      if (
        Math.abs(node.x + node.width - (other.x + other.width)) <
        this.snapThreshold
      ) {
        snappedX = other.x + other.width - node.width;
      }
      // Snap top edge
      if (Math.abs(node.y - other.y) < this.snapThreshold) {
        snappedY = other.y;
      }
      // Snap bottom edge
      if (
        Math.abs(node.y + node.height - (other.y + other.height)) <
        this.snapThreshold
      ) {
        snappedY = other.y + other.height - node.height;
      }
    }

    return { x: snappedX, y: snappedY };
  }

  setEnabled(enabled) {
    this.enabled = enabled;
  }

  setGridSize(size) {
    this.gridSize = size;
  }
}
