// src/core/edgeDrag.js
import { state } from './state.js';
import { edgeManager } from './edgeManager.js';
import { nodeManager } from './nodeManager.js';

/**
 * EdgeDrag: handles interactive drag-from-port to create edges.
 * - dropping on a port connects to that port
 * - dropping anywhere on a node connects to the nearest port of that node
 * - dropping on empty space cancels
 */
export class EdgeDrag {
  constructor(svg) {
    this.svg = svg;
    this.viewport = svg.querySelector('#viewport');
    this.tempPath = null;
    this.sourceNode = null;
    this.sourcePort = null;
    this.radius = 22; // magnetic radius
    this.pullStrength = 0.28;
    this.bind();
  }

  bind() {
    this.viewport.addEventListener('mousedown', (e) => this.onDown(e));
    window.addEventListener('mousemove', (e) => this.onMove(e));
    window.addEventListener('mouseup', (e) => this.onUp(e));
  }

  onDown(e) {
    if (!e.target.classList.contains('port')) return;
    e.preventDefault();
    this.sourceNode = e.target.closest('.node').dataset.id;
    this.sourcePort = e.target.dataset.port;
    const start = nodeManager.getPortCoords(this.sourceNode, this.sourcePort);

    // create temp path
    this.tempPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    this.tempPath.setAttribute('stroke', '#f39c12');
    this.tempPath.setAttribute('stroke-width', 2);
    this.tempPath.setAttribute('fill', 'none');
    this.tempPath.setAttribute('stroke-dasharray', '4 2');
    this.tempPath.setAttribute('pointer-events', 'none');
    this.viewport.appendChild(this.tempPath);
  }

  onMove(e) {
    if (!this.tempPath) return;
    const pt = nodeManager.svgPoint(this.svg, e.clientX, e.clientY);

    // magnet to nearest port if close
    let tx = pt.x, ty = pt.y;
    let nearest = null;

    // find nearest port across all nodes except source
    this.viewport.querySelectorAll('.port').forEach(port => {
      const nodeId = port.closest('.node').dataset.id;
      if (nodeId === this.sourceNode) return;
      const pos = nodeManager.getPortCoords(nodeId, port.dataset.port);
      const d = Math.hypot(pos.x - pt.x, pos.y - pt.y);
      if (d < (nearest?.dist ?? Infinity)) nearest = { x: pos.x, y: pos.y, dist: d, portEl: port };
    });

    if (nearest && nearest.dist < this.radius) {
      tx = nearest.x * this.pullStrength + pt.x * (1 - this.pullStrength);
      ty = nearest.y * this.pullStrength + pt.y * (1 - this.pullStrength);
      // highlight port
      nearest.portEl.classList.add('magnet-highlight');
    } else {
      // clear previous highlights
      this.viewport.querySelectorAll('.magnet-highlight').forEach(p => p.classList.remove('magnet-highlight'));
    }

    const start = nodeManager.getPortCoords(this.sourceNode, this.sourcePort);
    const midX = (start.x + tx) / 2;
    const d = `M ${start.x},${start.y} C ${midX},${start.y} ${midX},${ty} ${tx},${ty}`;
    this.tempPath.setAttribute('d', d);
  }

  onUp(e) {
    if (!this.tempPath) return;

    // If dropped directly on a port — use that
    const targetPortEl = e.target.classList && e.target.classList.contains('port') ? e.target : null;
    if (targetPortEl) {
      const targetNode = targetPortEl.closest('.node').dataset.id;
      const targetPort = targetPortEl.dataset.port;
      if (targetNode && targetNode !== this.sourceNode) {
        edgeManager.addEdge(this.sourceNode, targetNode, this.sourcePort, targetPort);
      }
    } else {
      // If dropped on a node body (but not on port), find nearest port on that node and connect
      const nodeEl = e.target.closest('.node');
      if (nodeEl) {
        const targetNodeId = nodeEl.dataset.id;
        if (targetNodeId && targetNodeId !== this.sourceNode) {
          // compute mouse point in svg coords
          const pt = nodeManager.svgPoint(this.svg, e.clientX, e.clientY);
          const node = nodeManager.getNode(targetNodeId);
          const nearest = edgeManager.nearestPort(node, pt);
          if (nearest) {
            edgeManager.addEdge(this.sourceNode, targetNodeId, this.sourcePort, nearest.port);
          }
        }
      }
    }

    // cleanup
    this.tempPath.remove();
    this.tempPath = null;
    this.viewport.querySelectorAll('.magnet-highlight').forEach(p => p.classList.remove('magnet-highlight'));
    this.sourceNode = null;
    this.sourcePort = null;
  }
}
