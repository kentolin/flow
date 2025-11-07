// src/ui/minimap.js
import { state } from "../core/state.js";
import { nodeManager } from "../core/nodeManager.js";

/**
 * MiniMap Module
 * -----------------------------------
 * - Creates minimap panel (hidden by default)
 * - Auto-updates using MutationObserver
 * - Draws node rectangles + edge lines
 */

export function initMiniMap() {
  const editor = document.getElementById("editor-main");

  // ===============================
  // ✅ Panel container
  // ===============================
  const miniMap = document.createElement("div");
  miniMap.id = "minimap-panel";
  miniMap.className = "editor-popup-panel";
  miniMap.style.display = "none"; // hidden by default

  miniMap.innerHTML = `
    <div class="panel-title">MiniMap</div>
    <div id="minimap-body" style="flex:1;">
      <svg width="100%" height="100%">
        <g id="mm-viewport"></g>
      </svg>
    </div>
  `;

  editor.appendChild(miniMap);

  const mmViewport = miniMap.querySelector("#mm-viewport");

  // ================
  // ✅ Refresh
  // ================
  function refresh() {
    mmViewport.innerHTML = "";
    if (state.nodes.length === 0) return;

    // Compute bounding box
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;

    for (const n of state.nodes) {
      minX = Math.min(minX, n.x);
      minY = Math.min(minY, n.y);
      maxX = Math.max(maxX, n.x + (n.width || 120));
      maxY = Math.max(maxY, n.y + (n.height || 50));
    }

    const pad = 30;
    minX -= pad;
    minY -= pad;
    maxX += pad;
    maxY += pad;

    const rect = miniMap.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height - 22; // subtract title height

    const scale = Math.min(width / (maxX - minX), height / (maxY - minY));

    // Draw edges
    for (const e of state.edges) {
      const from = nodeManager.getNode(e.from);
      const to = nodeManager.getNode(e.to);
      if (!from || !to) continue;

      const p1 = nodeManager.getPortCoords(from, e.fromPort);
      const p2 = nodeManager.getPortCoords(to, e.toPort);

      const line = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "line"
      );
      line.setAttribute("x1", (p1.x - minX) * scale);
      line.setAttribute("y1", (p1.y - minY) * scale);
      line.setAttribute("x2", (p2.x - minX) * scale);
      line.setAttribute("y2", (p2.y - minY) * scale);
      line.setAttribute("stroke", "#666");
      line.setAttribute("stroke-width", 1);
      mmViewport.appendChild(line);
    }

    // Draw nodes
    for (const n of state.nodes) {
      const r = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      r.setAttribute("x", (n.x - minX) * scale);
      r.setAttribute("y", (n.y - minY) * scale);
      r.setAttribute("width", (n.width || 120) * scale);
      r.setAttribute("height", (n.height || 50) * scale);
      r.setAttribute("fill", n.color || "#fff");
      r.setAttribute("stroke", "#444");
      r.setAttribute("stroke-width", 0.5);
      mmViewport.appendChild(r);
    }
  }

  // Auto-update via MutationObserver
  const mainViewport = document.getElementById("viewport");
  new MutationObserver(refresh).observe(mainViewport, {
    childList: true,
    attributes: true,
    subtree: true,
  });

  refresh();

  return miniMap;
}
