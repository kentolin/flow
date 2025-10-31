// src/main.js
import { initToolbar } from './ui/toolbar.js';
import { enableZoomPan } from './ui/zoomPan.js';
import { initMiniMap } from './ui/minimap.js';
import { state } from './core/state.js';
import { contextMenu } from './ui/contextMenu.js';
import { EdgeDrag } from './core/edgeDrag.js';
import { nodeManager } from './core/nodeManager.js';
import { edgeManager } from './core/edgeManager.js';
import { history } from './core/history.js';

window.addEventListener('DOMContentLoaded', () => {
  // ============================
  // Initialize UI and Core
  // ============================
  initToolbar();
  contextMenu.init();

  const svg = document.getElementById('flowchart');
  enableZoomPan(svg);

  // Tooltip setup for edges
  edgeManager.initTooltip?.();

  // ============================
  // Initialize MiniMap
  // ============================
  const miniMap = initMiniMap();
  window.__miniMapInstance = miniMap; // for debugging

  // Edge drag interaction
  new EdgeDrag(svg);

  // ============================
  // Background click → clear selection
  // ============================
  let justSelected = false;
  svg.addEventListener('click', (e) => {
    if (justSelected) return;
    if (!e.target.closest('.node') && !e.target.closest('.edge')) {
      nodeManager.clearSelection();
      edgeManager.selectedEdges.clear();
      edgeManager.updateSelectionStyles();
    }
  });

  // ==================================================
  // SHIFT + Drag rectangle multi-selection
  // ==================================================
  let selecting = false;
  let selectStart = null;
  let selectBox = null;

  svg.addEventListener('mousedown', (e) => {
    if (!e.shiftKey) return;
    if (e.target.closest('.node') || e.target.closest('.edge')) return;

    e.preventDefault();
    e.stopPropagation();
    selecting = true;

    selectStart = nodeManager.svgPoint(svg, e.clientX, e.clientY);
    const viewport = document.getElementById('viewport');
    selectBox = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    selectBox.classList.add('select-box');
    selectBox.setAttribute('x', selectStart.x);
    selectBox.setAttribute('y', selectStart.y);
    selectBox.setAttribute('width', 0);
    selectBox.setAttribute('height', 0);
    viewport.appendChild(selectBox);
  });

  window.addEventListener('mousemove', (e) => {
    if (!selecting) return;
    const pt = nodeManager.svgPoint(svg, e.clientX, e.clientY);
    const x = Math.min(pt.x, selectStart.x);
    const y = Math.min(pt.y, selectStart.y);
    const w = Math.abs(pt.x - selectStart.x);
    const h = Math.abs(pt.y - selectStart.y);

    selectBox.setAttribute('x', x);
    selectBox.setAttribute('y', y);
    selectBox.setAttribute('width', w);
    selectBox.setAttribute('height', h);

    nodeManager.multiSelect.clear();
    edgeManager.selectedEdges.clear();

    // --- Nodes inside box ---
    state.nodes.forEach((node) => {
      const inside =
        node.x >= x &&
        node.x + node.width <= x + w &&
        node.y >= y &&
        node.y + node.height <= y + h;
      if (inside) nodeManager.multiSelect.add(node.id);
    });

    // --- Edges connecting selected nodes ---
    state.edges.forEach((edge) => {
      if (
        nodeManager.multiSelect.has(edge.from) &&
        nodeManager.multiSelect.has(edge.to)
      ) {
        edgeManager.selectedEdges.add(edgeManager.edgeKey(edge));
      }
    });

    nodeManager.updateSelectionStyles();
    edgeManager.updateSelectionStyles();
  });

  window.addEventListener('mouseup', () => {
    if (!selecting) return;
    selecting = false;
    if (selectBox) selectBox.remove();
    selectBox = null;

    justSelected = true;
    setTimeout(() => (justSelected = false), 50);
  });

  // ==================================================
  // Ctrl + Click toggle node / edge selection
  // ==================================================
  svg.addEventListener('click', (e) => {
    if (!e.ctrlKey) return;
    e.preventDefault();
    e.stopPropagation();

    const node = e.target.closest('.node');
    const edge = e.target.closest('.edge');

    if (node) {
      const id = node.dataset.id;
      if (nodeManager.multiSelect.has(id))
        nodeManager.multiSelect.delete(id);
      else nodeManager.multiSelect.add(id);
      nodeManager.updateSelectionStyles();
    }

    if (edge) {
      const key = edge.dataset.key;
      if (edgeManager.selectedEdges.has(key))
        edgeManager.selectedEdges.delete(key);
      else edgeManager.selectedEdges.add(key);
      edgeManager.updateSelectionStyles();
    }

    justSelected = true;
    setTimeout(() => (justSelected = false), 50);
  });

  // ==================================================
  // Alt + Drag duplication (Figma-style)
  // ==================================================
  svg.addEventListener('mousedown', (e) => {
    if (!e.altKey) return;
    const nodeEl = e.target.closest('.node');
    if (!nodeEl) return;

    e.preventDefault();
    e.stopPropagation();

    const selected = nodeManager.multiSelect.size
      ? [...nodeManager.multiSelect]
      : [nodeEl.dataset.id];
    const clones = [];

    history.save();
    selected.forEach((id) => {
      const n = nodeManager.getNode(id);
      if (!n) return;
      const clone = { ...n };
      clone.id = 'node_' + Date.now() + Math.floor(Math.random() * 1000);
      clone.x += 30;
      clone.y += 30;
      state.nodes.push(clone);
      nodeManager.renderNode(clone);
      clones.push({ old: id, new: clone.id });
    });

    // duplicate edges between cloned nodes
    state.edges.forEach((edge) => {
      const fromClone = clones.find((c) => c.old === edge.from);
      const toClone = clones.find((c) => c.old === edge.to);
      if (fromClone && toClone)
        edgeManager.addEdge(fromClone.new, toClone.new, edge.fromPort, edge.toPort);
    });

    nodeManager.multiSelect.clear();
    clones.forEach((c) => nodeManager.multiSelect.add(c.new));
    nodeManager.updateSelectionStyles();
  });

  // ==================================================
  // Clipboard: copy / paste / delete
  // ==================================================
  let clipboard = { nodes: [], edges: [] };

  window.addEventListener('keydown', (e) => {
    const selectedIds = new Set(nodeManager.multiSelect);
    if (nodeManager.selectedNode) selectedIds.add(nodeManager.selectedNode);

    // ==========================================================
    // 🗑️ DELETE — Remove selected nodes or edges
    // ==========================================================
    if ((e.key === "Delete" || e.key === "Backspace")) {
      // If nodes are selected — delete them
      if (selectedIds.size > 0) {
        nodeManager.deleteNode();
        e.preventDefault();
        return;
      }

      // If no nodes but edges are selected — delete edges
      if (edgeManager.selectedEdges.size > 0) {
        history.save();

        // Remove all selected edges from state
        state.edges = state.edges.filter(edge => {
          const key = edgeManager.edgeKey(edge);
          return !edgeManager.selectedEdges.has(key);
        });

        edgeManager.selectedEdges.clear();
        edgeManager.redrawAll();

        document.dispatchEvent(new Event('flowchart:changed'));
        e.preventDefault();
        return;
      }
    }


    // Copy
    if (e.ctrlKey && e.key.toLowerCase() === 'c' && selectedIds.size > 0) {
      clipboard.nodes = [];
      clipboard.edges = [];
      selectedIds.forEach((id) => {
        const node = nodeManager.getNode(id);
        if (node) clipboard.nodes.push({ ...node });
      });
      state.edges.forEach((edge) => {
        if (selectedIds.has(edge.from) && selectedIds.has(edge.to))
          clipboard.edges.push({ ...edge });
      });
      e.preventDefault();
      return;
    }

    // Paste
    if (e.ctrlKey && e.key.toLowerCase() === 'v' && clipboard.nodes.length > 0) {
      history.save();
      const idMap = new Map();
      clipboard.nodes.forEach((oldNode) => {
        const newNode = { ...oldNode };
        newNode.id = 'node_' + Date.now() + Math.floor(Math.random() * 1000);
        newNode.x += 20;
        newNode.y += 20;
        state.nodes.push(newNode);
        nodeManager.renderNode(newNode);
        idMap.set(oldNode.id, newNode.id);
      });
      clipboard.edges.forEach((oldEdge) => {
        const newFrom = idMap.get(oldEdge.from);
        const newTo = idMap.get(oldEdge.to);
        if (newFrom && newTo)
          edgeManager.addEdge(newFrom, newTo, oldEdge.fromPort, oldEdge.toPort);
      });
      nodeManager.multiSelect.clear();
      idMap.forEach((newId) => nodeManager.multiSelect.add(newId));
      nodeManager.updateSelectionStyles();
      e.preventDefault();
      return;
    }
  });
});
