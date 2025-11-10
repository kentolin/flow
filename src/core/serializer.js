// ============================================================================
// FILE: src/core/Serializer.js
// ============================================================================
export class Serializer {
  static serialize(nodes, edges, viewport) {
    return {
      version: "1.0",
      timestamp: Date.now(),
      viewport,
      nodes: nodes.map((n) => n.toJSON()),
      edges: edges.map((e) => e.toJSON()),
    };
  }

  static deserialize(data) {
    return {
      viewport: data.viewport || { x: 0, y: 0, zoom: 1 },
      nodes: data.nodes || [],
      edges: data.edges || [],
    };
  }

  static toJSON(data) {
    return JSON.stringify(data, null, 2);
  }

  static fromJSON(jsonString) {
    return JSON.parse(jsonString);
  }
}
