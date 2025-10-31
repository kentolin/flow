// src/ui/minimap.js
import { state } from '../core/state.js';
import { nodeManager } from '../core/nodeManager.js';

/**
 * MiniMap Module
 * ==============
 * Provides a live, auto-updating miniature version of the flowchart.
 * Features:
 *  - Reflects all node and edge positions.
 *  - Reacts automatically to DOM mutations (no manual refresh needed).
 *  - Synchronizes hover and selection highlighting.
 */
export function initMiniMap() {
  // ------------------------------------------
  // 🔧 1. Create minimap container if missing
  // ------------------------------------------
  let miniMap = document.getElementById('minimap');
  if (!miniMap) {
    miniMap = document.createElement('div');
    miniMap.id = 'minimap';
    Object.assign(miniMap.style, {
      position: 'absolute',
      right: '10px',
      bottom: '10px',
      width: '200px',
      height: '140px',
      background: '#f9f9f9',
      border: '1px solid #bbb',
      borderRadius: '4px',
      overflow: 'hidden',
      boxShadow: '0 0 4px rgba(0,0,0,0.1)'
    });
    document.body.appendChild(miniMap);
  }

  // ------------------------------------------
  // 🧱 2. Prepare SVG inside minimap container
  // ------------------------------------------
  miniMap.innerHTML = `<svg width="100%" height="100%"><g id="mm-viewport"></g></svg>`;
  const mmViewport = miniMap.querySelector('#mm-viewport');

  /**
   * 🔄 refresh()
   * Redraws minimap content from current state.
   * Called automatically by MutationObserver whenever DOM changes occur.
   */
  function refresh() {
    mmViewport.innerHTML = '';
    if (state.nodes.length === 0) return;

    // Compute bounds of all nodes
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const n of state.nodes) {
      minX = Math.min(minX, n.x);
      minY = Math.min(minY, n.y);
      maxX = Math.max(maxX, n.x + (n.width || 120));
      maxY = Math.max(maxY, n.y + (n.height || 50));
    }

    const pad = 20;
    minX -= pad; minY -= pad; maxX += pad; maxY += pad;

    const mmRect = miniMap.getBoundingClientRect();
    const scale = Math.min(mmRect.width / (maxX - minX), mmRect.height / (maxY - minY));

    // ------------------------------------------
    // 🧩 Draw all edges (lines)
    // ------------------------------------------
    for (const e of state.edges) {
      const fromNode = nodeManager.getNode(e.from);
      const toNode = nodeManager.getNode(e.to);
      if (!fromNode || !toNode) continue;

      const start = nodeManager.getPortCoords(fromNode, e.fromPort);
      const end = nodeManager.getPortCoords(toNode, e.toPort);

      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.dataset.mmEdge = `${e.from}_${e.to}`;
      line.setAttribute('x1', (start.x - minX) * scale);
      line.setAttribute('y1', (start.y - minY) * scale);
      line.setAttribute('x2', (end.x - minX) * scale);
      line.setAttribute('y2', (end.y - minY) * scale);
      line.setAttribute('stroke', e.color || '#666');
      line.setAttribute('stroke-width', 1);
      line.style.opacity = 0;
      mmViewport.appendChild(line);
      requestAnimationFrame(() => (line.style.opacity = 1)); // Fade-in effect
    }

    // ------------------------------------------
    // 🔲 Draw all nodes (rectangles)
    // ------------------------------------------
    for (const n of state.nodes) {
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.dataset.mmId = n.id;
      rect.setAttribute('x', (n.x - minX) * scale);
      rect.setAttribute('y', (n.y - minY) * scale);
      rect.setAttribute('width', (n.width || 120) * scale);
      rect.setAttribute('height', (n.height || 50) * scale);
      rect.setAttribute('fill', n.color || '#fff');
      rect.setAttribute('stroke', '#444');
      rect.setAttribute('stroke-width', 0.5);
      rect.style.opacity = 0;
      mmViewport.appendChild(rect);
      requestAnimationFrame(() => (rect.style.opacity = 1));
    }
  }

  // ------------------------------------------
  // 👁 3. Observe mutations in main viewport
  // ------------------------------------------
  const viewport = document.getElementById('viewport');
  const observer = new MutationObserver(() => refresh());
  observer.observe(viewport, {
    childList: true,
    attributes: true,
    subtree: true
  });

  // Initial draw
  refresh();
  return { refresh };
}
