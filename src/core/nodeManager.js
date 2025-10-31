// src/core/nodeManager.js
import { state } from './state.js';
import { edgeManager } from './edgeManager.js';
import { history } from './history.js';
import { contextMenu } from '../ui/contextMenu.js';

// ==============================
// Snap & Resize constants
// ==============================
const SNAP_DISTANCES = [20, 40, 60, 80, 100];
const SNAP_THRESHOLD = 5;

const MIN_WIDTH = 60;
const MIN_HEIGHT = 30;
const HANDLE_SIZE = 8;

// Small debounce to keep edge redraw smooth while dragging/resizing
const scheduleRedraw = (() => {
  let timer = null;
  return () => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      edgeManager.redrawAll();
      timer = null;
    }, 16); // ~60fps
  };
})();

export const nodeManager = {
  NODE_W: 120,
  NODE_H: 50,
  selectedNode: null,
  multiSelect: new Set(),

  createNode(type, x = 150, y = 150) {
    history.save();
    const snap = 20;
    const node = {
      id: 'node_' + Date.now(),
      type,
      x: Math.round(x / snap) * snap,
      y: Math.round(y / snap) * snap,
      width: this.NODE_W,
      height: this.NODE_H
    };
    state.nodes.push(node);
    this.renderNode(node);
  },

  renderNode(node) {
    const viewport = document.getElementById('viewport');
    const svg = document.getElementById('flowchart');

    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.classList.add('node');
    g.dataset.id = node.id;
    g.setAttribute('transform', `translate(${node.x},${node.y})`);

    // --- Rectangle ---
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('width', node.width);
    rect.setAttribute('height', node.height);
    rect.setAttribute('rx', 6);
    rect.setAttribute('ry', 6);
    rect.classList.add('node-rect');
    rect.setAttribute('fill', node.color || '#ffffff');
    g.appendChild(rect);

    // --- Text ---
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', node.width / 2);
    text.setAttribute('y', node.height / 2);
    text.setAttribute('dominant-baseline', 'middle');
    text.setAttribute('text-anchor', 'middle');
    text.style.pointerEvents = 'none';
    text.textContent = node.type;
    g.appendChild(text);

    // double-click rename
    g.addEventListener('dblclick', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.renameNode(node, text, g);
    });

    // --- Ports ---
    const ports = [
      { name: 'top', cx: node.width / 2, cy: 0 },
      { name: 'bottom', cx: node.width / 2, cy: node.height },
      { name: 'left', cx: 0, cy: node.height / 2 },
      { name: 'right', cx: node.width, cy: node.height / 2 }
    ];
    for (const p of ports) {
      const port = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      port.classList.add('port');
      port.dataset.port = p.name;
      port.setAttribute('cx', p.cx);
      port.setAttribute('cy', p.cy);
      port.setAttribute('r', 6);
      port.style.opacity = '0';
      g.appendChild(port);
    }

    // --- Resize handles ---
    const handles = [
      { name: 'top-left', x: 0, y: 0 },
      { name: 'top-right', x: node.width, y: 0 },
      { name: 'bottom-left', x: 0, y: node.height },
      { name: 'bottom-right', x: node.width, y: node.height }
    ];
    handles.forEach(h => {
      const handle = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      handle.classList.add('resize-handle');
      handle.dataset.handle = h.name;
      handle.setAttribute('x', h.x - HANDLE_SIZE / 2);
      handle.setAttribute('y', h.y - HANDLE_SIZE / 2);
      handle.setAttribute('width', HANDLE_SIZE);
      handle.setAttribute('height', HANDLE_SIZE);
      g.appendChild(handle);
    });

    // show/hide ports and handles on hover
    g.addEventListener('mouseenter', () => {
      g.querySelectorAll('.port, .resize-handle').forEach(p => (p.style.opacity = '1'));
    });
    g.addEventListener('mouseleave', () => {
      g.querySelectorAll('.port, .resize-handle').forEach(p => (p.style.opacity = '0'));
    });

    // ------------------------------
    // Node dragging (supports multi-select)
    // ------------------------------
    let dragging = false;
    g.addEventListener('mousedown', (e) => {
      // don't start node move when clicking port or handle
      if (e.target.classList.contains('port') || e.target.classList.contains('resize-handle')) return;
      e.preventDefault();
      history.save();
      dragging = true;

      const draggedNodes = new Set(this.multiSelect);
      if (!draggedNodes.has(node.id)) draggedNodes.add(node.id);

      const pt = this.svgPoint(svg, e.clientX, e.clientY);
      const offsets = {};
      draggedNodes.forEach(id => {
        const n = this.getNode(id);
        offsets[id] = { dx: pt.x - n.x, dy: pt.y - n.y };
      });

      const hintLayer = document.getElementById('distance-hints');

      const onMouseMove = (eMove) => {
        if (!dragging) return;
        const movePt = this.svgPoint(svg, eMove.clientX, eMove.clientY);
        const snap = 20;

        // move each dragged node
        draggedNodes.forEach(id => {
          const n = this.getNode(id);
          const dx = offsets[id].dx;
          const dy = offsets[id].dy;

          n.x = Math.round((movePt.x - dx) / snap) * snap;
          n.y = Math.round((movePt.y - dy) / snap) * snap;

          const nodeG = document.querySelector(`.node[data-id="${id}"]`);
          if (nodeG) nodeG.setAttribute('transform', `translate(${n.x},${n.y})`);
        });

        // distance hints + snap-to-distance (keeps existing logic)
        hintLayer.innerHTML = '';
        draggedNodes.forEach(id => {
          const n = this.getNode(id);
          if (!n) return;

          let closestH = null, closestV = null;
          let closestHVal = Infinity, closestVVal = Infinity;

          state.nodes.forEach(other => {
            if (other.id === n.id || draggedNodes.has(other.id)) return;

            const rightGap = other.x - (n.x + n.width);
            const leftGap = n.x - (other.x + other.width);
            const bottomGap = other.y - (n.y + n.height);
            const topGap = n.y - (other.y + other.height);

            const hGap = Math.min(Math.abs(rightGap), Math.abs(leftGap));
            const vGap = Math.min(Math.abs(bottomGap), Math.abs(topGap));

            if (hGap < closestHVal && hGap > 0 && hGap < 200) {
              closestHVal = hGap;
              closestH = { n, other, value: hGap, side: rightGap < leftGap ? 'right' : 'left' };
            }
            if (vGap < closestVVal && vGap > 0 && vGap < 200) {
              closestVVal = vGap;
              closestV = { n, other, value: vGap, side: bottomGap < topGap ? 'bottom' : 'top' };
            }
          });

          // snap to preferred distances
          if (closestH) {
            for (const ideal of SNAP_DISTANCES) {
              if (Math.abs(closestH.value - ideal) < SNAP_THRESHOLD) {
                const offset = closestH.value - ideal;
                if (closestH.side === 'right') n.x -= offset;
                else n.x += offset;
                n.x = Math.round(n.x / 10) * 10;
                closestH.value = ideal;
                break;
              }
            }
          }

          if (closestV) {
            for (const ideal of SNAP_DISTANCES) {
              if (Math.abs(closestV.value - ideal) < SNAP_THRESHOLD) {
                const offset = closestV.value - ideal;
                if (closestV.side === 'bottom') n.y -= offset;
                else n.y += offset;
                n.y = Math.round(n.y / 10) * 10;
                closestV.value = ideal;
                break;
              }
            }
          }

          // update transform for dragged node (after snap)
          const nodeG = document.querySelector(`.node[data-id="${n.id}"]`);
          if (nodeG) nodeG.setAttribute('transform', `translate(${n.x},${n.y})`);
        });

        // schedule redraw of edges (debounced)
        scheduleRedraw();
      };

      const onMouseUp = () => {
        if (!dragging) return;
        dragging = false;
        hintLayer.innerHTML = '';
        edgeManager.redrawAll(); // ensure final accurate redraw
        document.dispatchEvent(new Event('flowchart:changed'));
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
      };

      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    });

    // ------------------------------
    // Resize handle logic
    // ------------------------------
    g.querySelectorAll('.resize-handle').forEach(handle => {
      handle.addEventListener('mousedown', (e) => {
        e.stopPropagation();
        e.preventDefault();
        history.save();

        const handleName = handle.dataset.handle;
        const svgRect = svg.getBoundingClientRect();
        const startMouse = { x: e.clientX, y: e.clientY };
        const startSize = { w: node.width, h: node.height };
        const startPos = { x: node.x, y: node.y };

        const onMouseMove = (eMove) => {
          const dx = (eMove.clientX - startMouse.x) * (svg.viewBox.baseVal.width / svgRect.width);
          const dy = (eMove.clientY - startMouse.y) * (svg.viewBox.baseVal.height / svgRect.height);

          // right / bottom expand
          if (handleName.includes('right')) node.width = Math.max(MIN_WIDTH, startSize.w + dx);
          if (handleName.includes('bottom')) node.height = Math.max(MIN_HEIGHT, startSize.h + dy);

          // left/top modify position + size
          if (handleName.includes('left')) {
            const newWidth = Math.max(MIN_WIDTH, startSize.w - dx);
            node.x = startPos.x + (startSize.w - newWidth);
            node.width = newWidth;
          }
          if (handleName.includes('top')) {
            const newHeight = Math.max(MIN_HEIGHT, startSize.h - dy);
            node.y = startPos.y + (startSize.h - newHeight);
            node.height = newHeight;
          }

          // update visuals
          rect.setAttribute('width', node.width);
          rect.setAttribute('height', node.height);
          text.setAttribute('x', node.width / 2);
          text.setAttribute('y', node.height / 2);

          // update ports positions
          g.querySelectorAll('.port').forEach(p => {
            switch (p.dataset.port) {
              case 'top': p.setAttribute('cx', node.width / 2); p.setAttribute('cy', 0); break;
              case 'bottom': p.setAttribute('cx', node.width / 2); p.setAttribute('cy', node.height); break;
              case 'left': p.setAttribute('cx', 0); p.setAttribute('cy', node.height / 2); break;
              case 'right': p.setAttribute('cx', node.width); p.setAttribute('cy', node.height / 2); break;
            }
          });

          // update handles position
          g.querySelectorAll('.resize-handle').forEach(hEl => {
            const pos = {
              'top-left': [0, 0],
              'top-right': [node.width, 0],
              'bottom-left': [0, node.height],
              'bottom-right': [node.width, node.height]
            }[hEl.dataset.handle];
            hEl.setAttribute('x', pos[0] - HANDLE_SIZE / 2);
            hEl.setAttribute('y', pos[1] - HANDLE_SIZE / 2);
          });

          g.setAttribute('transform', `translate(${node.x},${node.y})`);

          // schedule redraw of edges (debounced)
          scheduleRedraw();
        };

        const onMouseUp = () => {
          window.removeEventListener('mousemove', onMouseMove);
          window.removeEventListener('mouseup', onMouseUp);
          edgeManager.redrawAll(); // final redraw after resizing
          document.dispatchEvent(new Event('flowchart:changed'));
        };

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
      });
    });

    // ------------------------------
    // Click selection & context menu
    // ------------------------------
    g.addEventListener('click', (e) => {
      e.stopPropagation();
      if (e.shiftKey) {
        if (this.multiSelect.has(node.id)) this.multiSelect.delete(node.id);
        else this.multiSelect.add(node.id);
        this.updateSelectionStyles();
      } else {
        this.setSelectedNode(node.id);
      }
    });

    g.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const nodeId = node.id;
      const items = [
        { label: 'Rename', action: () => this.renameNode(node, text, g) },
        { label: 'Delete', action: () => this.deleteNode(nodeId) },
        { label: 'Duplicate', action: () => this.duplicateNode(node) },
        {
          label: 'Change Color',
          action: () => {
            const color = prompt('Enter node fill color (CSS):', node.color || '#ffffff');
            if (color) {
              node.color = color;
              g.querySelector('rect').setAttribute('fill', color);
            }
          }
        }
      ];
      contextMenu.show(e.clientX, e.clientY, items);
    });

    viewport.appendChild(g);
  }, // end renderNode

  duplicateNode(node) {
    history.save();
    const newNode = {
      ...node,
      id: 'node_' + Date.now(),
      x: node.x + 20,
      y: node.y + 20
    };
    state.nodes.push(newNode);
    this.renderNode(newNode);
    // duplicate outgoing edges
    state.edges.filter(e => e.from === node.id)
      .forEach(e => edgeManager.addEdge(newNode.id, e.to));
    document.dispatchEvent(new Event('flowchart:changed'));
  },

  renameNode(node, textEl, g) {
    history.save();
    const input = document.createElement('input');
    input.type = 'text';
    input.value = node.type;
    input.style.position = 'absolute';
    input.style.zIndex = '9999';
    input.style.fontSize = '14px';
    input.style.padding = '2px';

    const svg = document.getElementById('flowchart');
    const rect = svg.getBoundingClientRect();
    const centerX = node.x + node.width / 2;
    const centerY = node.y + node.height / 2;
    input.style.left = `${rect.left + centerX}px`;
    input.style.top = `${rect.top + centerY - 8}px`;

    document.body.appendChild(input);
    input.focus();
    input.select();

    let finalized = false;
    const finalize = (ok) => {
      if (finalized) return;
      finalized = true;
      if (ok && input.value.trim() !== '') {
        node.type = input.value.trim();
        textEl.textContent = node.type;
        edgeManager.redrawAll();
        document.dispatchEvent(new Event('flowchart:changed'));
      }
      if (input.parentNode) input.parentNode.removeChild(input);
    };

    const keyHandler = (e) => {
      if (e.key === 'Enter') finalize(true);
      if (e.key === 'Escape') finalize(false);
    };
    const blurHandler = () => finalize(true);

    input.addEventListener('keydown', keyHandler);
    input.addEventListener('blur', blurHandler);
  },

  renderAll() {
    const viewport = document.getElementById('viewport');
    viewport.querySelectorAll('.node').forEach(n => n.remove());
    for (const n of state.nodes) this.renderNode(n);
  },

  getNode(id) {
    return state.nodes.find(n => n.id === id);
  },

  // live port coordinates based on node.x/node.y and width/height
  getPortCoords(nodeOrId, portName) {
    const node = typeof nodeOrId === 'string' ? this.getNode(nodeOrId) : nodeOrId;
    if (!node) return null;
    switch (portName) {
      case 'top': return { x: node.x + node.width / 2, y: node.y };
      case 'bottom': return { x: node.x + node.width / 2, y: node.y + node.height };
      case 'left': return { x: node.x, y: node.y + node.height / 2 };
      case 'right': return { x: node.x + node.width, y: node.y + node.height / 2 };
      default: return { x: node.x + node.width / 2, y: node.y + node.height / 2 };
    }
  },

  svgPoint(svg, clientX, clientY) {
    const rect = svg.getBoundingClientRect();
    const vb = svg.viewBox.baseVal;
    return {
      x: (clientX - rect.left) * (vb.width / rect.width) + vb.x,
      y: (clientY - rect.top) * (vb.height / rect.height) + vb.y
    };
  },

  setSelectedNode(id) {
    this.selectedNode = id;
    this.updateSelectionStyles();
  },

  clearSelection() {
    this.selectedNode = null;
    this.multiSelect.clear();
    this.updateSelectionStyles();
  },

  /**
   * Update visual styles for selected / highlighted nodes.
   * Adds soft glow to selected or multi-selected nodes.
   */
  updateSelectionStyles() {
    const nodes = document.querySelectorAll('.node');
    nodes.forEach(g => {
      const nodeId = g.dataset.id;
      const rect = g.querySelector('rect');

      if (nodeId === this.selectedNode || this.multiSelect.has(nodeId)) {
        rect.style.stroke = "#0080ff";
        rect.style.strokeWidth = "2.5";
        rect.style.filter = "drop-shadow(0 0 6px rgba(0,128,255,0.6))"; // ✅ glow
        rect.style.transition = "filter 0.2s ease";
      } else {
        rect.style.stroke = "#333";
        rect.style.strokeWidth = "1";
        rect.style.filter = "none";
      }
    });
  }
  ,

  // delete selected or multi-selected nodes and ALL attached edges reliably
  deleteNode(id) {
    history.save();

    // gather ids to delete
    const idsToDelete = new Set(this.multiSelect);
    if (id) idsToDelete.add(id);
    if (this.selectedNode) idsToDelete.add(this.selectedNode);
    if (idsToDelete.size === 0) return;

    // remove edges connected to deleted nodes
    state.edges = state.edges.filter(e => !idsToDelete.has(e.from) && !idsToDelete.has(e.to));

    // remove nodes
    state.nodes = state.nodes.filter(n => !idsToDelete.has(n.id));

    // clear selection
    this.selectedNode = null;
    this.multiSelect.clear();

    // re-render
    this.renderAll();
    edgeManager.redrawAll();
    document.dispatchEvent(new Event('flowchart:changed'));
  }
};
