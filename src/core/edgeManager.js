// src/core/edgeManager.js
import { state } from './state.js';
import { history } from './history.js';
import { nodeManager } from './nodeManager.js';
import { contextMenu } from '../ui/contextMenu.js';

/**
 * edgeManager — Manages all edges (add, render, update, color, delete, selection, tooltip)
 */
export const edgeManager = {
  tooltip: null,
  selectedEdges: new Set(),

  /** Initialize tooltip for edge hover info */
  initTooltip() {
    if (this.tooltip) return;
    this.tooltip = document.createElement('div');
    this.tooltip.className = 'edge-tooltip';
    this.tooltip.style.position = 'fixed';
    this.tooltip.style.padding = '4px 8px';
    this.tooltip.style.background = '#333';
    this.tooltip.style.color = '#fff';
    this.tooltip.style.fontSize = '12px';
    this.tooltip.style.borderRadius = '4px';
    this.tooltip.style.pointerEvents = 'none';
    this.tooltip.style.opacity = '0';
    document.body.appendChild(this.tooltip);
  },

  /**
   * Add a new edge between nodes and ports.
   * @param {string} fromId
   * @param {string} toId
   * @param {string} fromPort
   * @param {string} toPort
   */
  addEdge(fromId, toId, fromPort = 'right', toPort = 'left') {
    // Prevent duplicates
    if (state.edges.find(e =>
      e.from === fromId && e.to === toId &&
      e.fromPort === fromPort && e.toPort === toPort
    )) return;

    history.save();
    state.edges.push({
      from: fromId,
      to: toId,
      fromPort,
      toPort,
      color: '#666'
    });
    this.renderEdge(fromId, toId, fromPort, toPort);
  },

  /**
   * Render a single SVG polyline edge with event bindings.
   */
  renderEdge(fromId, toId, fromPort = 'right', toPort = 'left') {
    const svg = document.getElementById('flowchart');
    const viewport = svg.querySelector('#viewport');
    const fromNode = nodeManager.getNode(fromId);
    const toNode = nodeManager.getNode(toId);
    if (!fromNode || !toNode) return;

    const start = nodeManager.getPortCoords(fromNode, fromPort);
    const end = nodeManager.getPortCoords(toNode, toPort);
    if (!start || !end) return;

    const points = this.routeEdge(start, end);
    const edgeObj = state.edges.find(e =>
      e.from === fromId && e.to === toId &&
      e.fromPort === fromPort && e.toPort === toPort
    );

    const polyline = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
    polyline.setAttribute('data-from', fromId);
    polyline.setAttribute('data-to', toId);
    polyline.setAttribute('data-from-port', fromPort);
    polyline.setAttribute('data-to-port', toPort);
    polyline.setAttribute('points', points.map(p => `${p.x},${p.y}`).join(' '));
    polyline.style.stroke = edgeObj?.color || '#666'; // inline style wins over CSS
    polyline.style.strokeWidth = 2;
    polyline.setAttribute('fill', 'none');
    polyline.setAttribute('marker-end', 'url(#arrowhead)');
    polyline.classList.add('edge');

    // Hover
    polyline.addEventListener('mouseenter', (e) => this.onHoverStart(e));
    polyline.addEventListener('mousemove', (e) => this.onHoverMove(e));
    polyline.addEventListener('mouseleave', (e) => this.onHoverEnd(e));

    // Click (select edge)
    polyline.addEventListener('click', (e) => {
      e.stopPropagation();
      const key = this.edgeKey(polyline);
      if (e.shiftKey) {
        if (this.selectedEdges.has(key)) this.selectedEdges.delete(key);
        else this.selectedEdges.add(key);
      } else {
        this.selectedEdges.clear();
        this.selectedEdges.add(key);
      }
      this.updateSelectionStyles();
    });

    // Right-click context menu
    polyline.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      e.stopPropagation();

      const edgeData = {
        from: fromId,
        to: toId,
        fromPort,
        toPort,
        el: polyline
      };
      const items = [
        { label: 'Delete Edge', action: () => this.removeEdge(fromId, toId) },
        { label: 'Reverse Direction', action: () => this.reverseEdge(edgeData) },
        { label: 'Change Color', action: () => this.changeEdgeColor(edgeData) }
      ];
      contextMenu.show(e.clientX, e.clientY, items);
    });

    viewport.appendChild(polyline);
  },

  /** Build unique key for edge (for Set comparison) */
  edgeKey(edgeElOrObj) {
    const from = edgeElOrObj.dataset?.from || edgeElOrObj.from;
    const to = edgeElOrObj.dataset?.to || edgeElOrObj.to;
    const fp = edgeElOrObj.dataset?.fromPort || edgeElOrObj.fromPort;
    const tp = edgeElOrObj.dataset?.toPort || edgeElOrObj.toPort;
    return `${from}_${fp}_${to}_${tp}`;
  },

  /** Update selection visuals for edges */
  updateSelectionStyles() {
    document.querySelectorAll('.edge').forEach(edge => {
      const key = this.edgeKey(edge);
      if (this.selectedEdges.has(key)) {
        edge.style.stroke = '#ff8800';
        edge.style.strokeWidth = 3;
        edge.classList.add('selected');
      } else {
        const eObj = state.edges.find(obj => this.edgeKey(obj) === key);
        edge.style.stroke = eObj?.color || '#666';
        edge.style.strokeWidth = 2;
        edge.classList.remove('selected');
      }
    });
  },

  /** Change edge color persistently */
  changeEdgeColor(edgeData) {
    const color = prompt('Enter new edge color (CSS):', '#00aaff');
    if (!color) return;
    const edge = state.edges.find(e =>
      e.from === edgeData.from && e.to === edgeData.to &&
      e.fromPort === edgeData.fromPort && e.toPort === edgeData.toPort
    );
    if (!edge) return;

    edge.color = color;
    if (edgeData.el) edgeData.el.style.stroke = color;
  },

  /** Reverse edge direction */
  reverseEdge(edgeData) {
    history.save();
    const edge = state.edges.find(e =>
      e.from === edgeData.from && e.to === edgeData.to &&
      e.fromPort === edgeData.fromPort && e.toPort === edgeData.toPort
    );
    if (!edge) return;
    [edge.from, edge.to] = [edge.to, edge.from];
    [edge.fromPort, edge.toPort] = [edge.toPort, edge.fromPort];
    this.redrawAll();
  },

  /** Redraw all edges from state */
  redrawAll() {
    const svg = document.getElementById('flowchart');
    const viewport = svg.querySelector('#viewport');
    viewport.querySelectorAll('.edge').forEach(l => l.remove());
    for (const e of state.edges) {
      this.renderEdge(e.from, e.to, e.fromPort, e.toPort);
    }
    this.updateSelectionStyles();
  },

  /** Route edges as simple L-shapes */
  routeEdge(start, end) {
    const points = [start];
    const midX = (start.x + end.x) / 2;
    points.push({ x: midX, y: start.y });
    points.push({ x: midX, y: end.y });
    points.push(end);
    return points;
  },

  /** Remove specific edge */
  removeEdge(fromId, toId) {
    history.save();
    state.edges = state.edges.filter(e => !(e.from === fromId && e.to === toId));
    this.redrawAll();
  },

  /**
   * Find the nearest port on a node to a given point (used when dropping edges on body).
   * @param {Object} node
   * @param {{x: number, y: number}} targetPoint
   * @returns {{x: number, y: number, port: string}|null}
   */
  nearestPort(node, targetPoint) {
    if (!node || !targetPoint) return null;

    const ports = ['top', 'bottom', 'left', 'right'];
    let closest = null;
    let minDist = Infinity;

    ports.forEach(port => {
      const coords = nodeManager.getPortCoords(node, port);
      const dx = coords.x - targetPoint.x;
      const dy = coords.y - targetPoint.y;
      const dist = Math.hypot(dx, dy);
      if (dist < minDist) {
        minDist = dist;
        closest = { ...coords, port };
      }
    });

    return closest;
  },

  // Tooltip handlers
  onHoverStart(e) {
    const edge = e.target;
    const fromNode = nodeManager.getNode(edge.dataset.from);
    const toNode = nodeManager.getNode(edge.dataset.to);
    const fp = edge.dataset.fromPort;
    const tp = edge.dataset.toPort;
    const text = `From: ${fromNode?.type || 'Unknown'} (${fp}) → To: ${toNode?.type || 'Unknown'} (${tp})`;
    this.tooltip.style.display = 'block';
    this.tooltip.style.opacity = '1';
    this.tooltip.textContent = text;
    this.moveTooltip(e.clientX, e.clientY);
  },

  onHoverMove(e) {
    this.moveTooltip(e.clientX, e.clientY);
  },

  onHoverEnd() {
    this.tooltip.style.opacity = '0';
  },

  moveTooltip(x, y) {
    if (!this.tooltip) return;
    this.tooltip.style.left = `${x + 10}px`;
    this.tooltip.style.top = `${y + 10}px`;
  }
};
