// ============================================================================
// FILE: src/core/Geometry.js
// ============================================================================
export class Geometry {
  static distance(p1, p2) {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  static midpoint(p1, p2) {
    return {
      x: (p1.x + p2.x) / 2,
      y: (p1.y + p2.y) / 2,
    };
  }

  static angle(p1, p2) {
    return Math.atan2(p2.y - p1.y, p2.x - p1.x);
  }

  static rotate(point, center, angle) {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const dx = point.x - center.x;
    const dy = point.y - center.y;

    return {
      x: center.x + dx * cos - dy * sin,
      y: center.y + dx * sin + dy * cos,
    };
  }

  static intersectRectLine(rect, p1, p2) {
    const edges = [
      { x1: rect.x, y1: rect.y, x2: rect.x + rect.width, y2: rect.y },
      {
        x1: rect.x + rect.width,
        y1: rect.y,
        x2: rect.x + rect.width,
        y2: rect.y + rect.height,
      },
      {
        x1: rect.x + rect.width,
        y1: rect.y + rect.height,
        x2: rect.x,
        y2: rect.y + rect.height,
      },
      { x1: rect.x, y1: rect.y + rect.height, x2: rect.x, y2: rect.y },
    ];

    for (const edge of edges) {
      const intersection = this.intersectLines(
        p1.x,
        p1.y,
        p2.x,
        p2.y,
        edge.x1,
        edge.y1,
        edge.x2,
        edge.y2
      );
      if (intersection) return intersection;
    }
    return null;
  }

  static intersectLines(x1, y1, x2, y2, x3, y3, x4, y4) {
    const denom = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);
    if (denom === 0) return null;

    const ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denom;
    const ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denom;

    if (ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1) {
      return {
        x: x1 + ua * (x2 - x1),
        y: y1 + ua * (y2 - y1),
      };
    }
    return null;
  }

  static rectContainsPoint(rect, point) {
    return (
      point.x >= rect.x &&
      point.x <= rect.x + rect.width &&
      point.y >= rect.y &&
      point.y <= rect.y + rect.height
    );
  }

  static rectsIntersect(rect1, rect2) {
    return !(
      rect2.x > rect1.x + rect1.width ||
      rect2.x + rect2.width < rect1.x ||
      rect2.y > rect1.y + rect1.height ||
      rect2.y + rect2.height < rect1.y
    );
  }
}
