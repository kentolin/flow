// ============================================================================
// FILE: src/core/managers/ExportManager.js
// ============================================================================
export class ExportManager {
  exportAsJSON(nodes, edges) {
    return JSON.stringify(
      {
        version: "1.0",
        nodes: nodes.map((n) => n.toJSON()),
        edges: edges.map((e) => e.toJSON()),
      },
      null,
      2
    );
  }

  importFromJSON(jsonString, nodeManager, edgeManager) {
    const data = JSON.parse(jsonString);

    const idMap = new Map();

    // Import nodes
    data.nodes.forEach((nodeData) => {
      const node = nodeManager.createNode(
        nodeData.type,
        nodeData.x,
        nodeData.y,
        nodeData
      );
      idMap.set(nodeData.id, node.id);
    });

    // Import edges
    data.edges.forEach((edgeData) => {
      const newSourceId = idMap.get(edgeData.sourceId);
      const newTargetId = idMap.get(edgeData.targetId);

      if (newSourceId && newTargetId) {
        edgeManager.createEdge(newSourceId, newTargetId, edgeData);
      }
    });
  }

  exportAsSVG(svgElement) {
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svgElement);
    return svgString;
  }

  exportAsPNG(svgElement, width, height) {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");

      const svgString = this.exportAsSVG(svgElement);
      const blob = new Blob([svgString], { type: "image/svg+xml" });
      const url = URL.createObjectURL(blob);

      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
        canvas.toBlob((blob) => {
          URL.revokeObjectURL(url);
          resolve(blob);
        });
      };
      img.onerror = reject;
      img.src = url;
    });
  }
}
