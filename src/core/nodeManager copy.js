// src/core/nodeManager.js
import { state } from "./state.js";
import { edgeManager } from "./edgeManager.js";
import { history } from "./history.js";
import { contextMenu } from "../ui/contextMenu.js";

// ==============================
// Snap & Resize constants
// ==============================
const SNAP_DISTANCES = [8, 16, 24, 32, 40, 48, 56, 64];
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

  createNode(type, x = 150, y = 150, shape = "rect") {
    history.save();
    const snap = 8;
    const node = {
      id: "node_" + Date.now(),
      type,
      shape,
      x: Math.round(x / snap) * snap,
      y: Math.round(y / snap) * snap,
      width: this.NODE_W,
      height: this.NODE_H,
    };
    state.nodes.push(node);
    this.renderNode(node);
  },

  /**
   * Returns port and handle configuration based on node shape.
   */
  getShapeConfig(node) {
    const { width: w, height: h } = node;

    switch (node.shape) {
      case "circle":
        return {
          shape: { type: "circle", r: Math.min(w, h) / 2 },
          ports: [
            { name: "top", cx: w / 2, cy: 0 },
            { name: "bottom", cx: w / 2, cy: h },
            { name: "left", cx: 0, cy: h / 2 },
            { name: "right", cx: w, cy: h / 2 },
          ],
          handles: [{ name: "rotate", x: w / 2, y: -20 }],
        };

      case "diamond":
        return {
          shape: {
            type: "polygon",
            points: `${w / 2},0 ${w},${h / 2} ${w / 2},${h} 0,${h / 2}`,
          },
          ports: [
            { name: "top", cx: w / 2, cy: 0 },
            { name: "bottom", cx: w / 2, cy: h },
            { name: "left", cx: 0, cy: h / 2 },
            { name: "right", cx: w, cy: h / 2 },
          ],
          handles: [{ name: "rotate", x: w / 2, y: -20 }],
        };

      default: // rectangle
        const ports = [];
        const portSpacing = w / 4;
        // 3 ports per side + 4 corners
        for (let i = 1; i <= 3; i++)
          ports.push({ name: `top${i}`, cx: portSpacing * i, cy: 0 });
        for (let i = 1; i <= 3; i++)
          ports.push({ name: `bottom${i}`, cx: portSpacing * i, cy: h });
        for (let i = 1; i <= 3; i++)
          ports.push({ name: `left${i}`, cx: 0, cy: (h / 4) * i });
        for (let i = 1; i <= 3; i++)
          ports.push({ name: `right${i}`, cx: w, cy: (h / 4) * i });
        ports.push({ name: "top-left", cx: 0, cy: 0 });
        ports.push({ name: "top-right", cx: w, cy: 0 });
        ports.push({ name: "bottom-left", cx: 0, cy: h });
        ports.push({ name: "bottom-right", cx: w, cy: h });

        const handles = [
          { name: "top-left", x: 0, y: 0 },
          { name: "top-right", x: w, y: 0 },
          { name: "bottom-left", x: 0, y: h },
          { name: "bottom-right", x: w, y: h },
          { name: "left", x: 0, y: h / 2 },
          { name: "right", x: w, y: h / 2 },
          { name: "top", x: w / 2, y: 0 },
          { name: "bottom", x: w / 2, y: h },
          { name: "rotate", x: w / 2, y: -20 }, // 🔁 rotation handle
        ];

        return { shape: { type: "rect" }, ports, handles };
    }
  },

  renderNode(node) {
    const viewport = document.getElementById("viewport");
    const svg = document.getElementById("flowchart");

    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.classList.add("node");
    setTimeout(() => g.classList.add("node-visible"), 10);

    g.dataset.id = node.id;
    g.setAttribute("transform", `translate(${node.x},${node.y})`);

    // --- Rectangle ---
    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("width", node.width);
    rect.setAttribute("height", node.height);
    rect.setAttribute("rx", 6);
    rect.setAttribute("ry", 6);
    rect.classList.add("node-rect");
    rect.setAttribute("fill", node.color || "#ffffff");
    g.appendChild(rect);

    // --- Text ---
    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("x", node.width / 2);
    text.setAttribute("y", node.height / 2);
    text.setAttribute("dominant-baseline", "middle");
    text.setAttribute("text-anchor", "middle");
    text.style.pointerEvents = "none";
    text.textContent = node.type;
    g.appendChild(text);

    // double-click rename
    g.addEventListener("dblclick", (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.renameNode(node, text, g);
    });

    // --- Ports ---
    const ports = [
      { name: "top", cx: node.width / 2, cy: 0 },
      { name: "bottom", cx: node.width / 2, cy: node.height },
      { name: "left", cx: 0, cy: node.height / 2 },
      { name: "right", cx: node.width, cy: node.height / 2 },
    ];
    for (const p of ports) {
      const port = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "circle"
      );
      port.classList.add("port");
      port.dataset.port = p.name;
      port.setAttribute("cx", p.cx);
      port.setAttribute("cy", p.cy);
      port.setAttribute("r", 6);
      port.style.opacity = "0";
      g.appendChild(port);
    }

    // --- Resize handles ---
    const handles = [
      { name: "top-left", x: 0, y: 0 },
      { name: "top-right", x: node.width, y: 0 },
      { name: "bottom-left", x: 0, y: node.height },
      { name: "bottom-right", x: node.width, y: node.height },
    ];
    handles.forEach((h) => {
      const handle = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "rect"
      );
      handle.classList.add("resize-handle");
      handle.dataset.handle = h.name;
      handle.setAttribute("x", h.x - HANDLE_SIZE / 2);
      handle.setAttribute("y", h.y - HANDLE_SIZE / 2);
      handle.setAttribute("width", HANDLE_SIZE);
      handle.setAttribute("height", HANDLE_SIZE);
      g.appendChild(handle);
    });

    // show/hide ports and handles on hover
    g.addEventListener("mouseenter", () => {
      g.querySelectorAll(".port, .resize-handle").forEach(
        (p) => (p.style.opacity = "1")
      );
    });
    g.addEventListener("mouseleave", () => {
      g.querySelectorAll(".port, .resize-handle").forEach(
        (p) => (p.style.opacity = "0")
      );
    });

    // ------------------------------
    // Node dragging (supports multi-select)
    // ------------------------------
    let dragging = false;
    g.addEventListener("mousedown", (e) => {
      // don't start node move when clicking port or handle
      if (
        e.target.classList.contains("port") ||
        e.target.classList.contains("resize-handle")
      )
        return;
      e.preventDefault();
      history.save();
      dragging = true;

      const draggedNodes = new Set(this.multiSelect);
      if (!draggedNodes.has(node.id)) draggedNodes.add(node.id);

      const pt = this.svgPoint(svg, e.clientX, e.clientY);
      const offsets = {};
      draggedNodes.forEach((id) => {
        const n = this.getNode(id);
        offsets[id] = { dx: pt.x - n.x, dy: pt.y - n.y };
      });

      const hintLayer = document.getElementById("distance-hints");

      const onMouseMove = (eMove) => {
        if (!dragging) return;

        const movePt = this.svgPoint(svg, eMove.clientX, eMove.clientY);
        const snap = 8;

        draggedNodes.forEach((id) => {
          const n = this.getNode(id);
          const dx = offsets[id].dx;
          const dy = offsets[id].dy;

          // compute target position (snapped)
          const targetX = Math.round((movePt.x - dx) / snap) * snap;
          const targetY = Math.round((movePt.y - dy) / snap) * snap;

          const nodeG = document.querySelector(`.node[data-id="${id}"]`);
          if (!nodeG) return;

          // --- Smooth easing with interpolation ---
          const startX = n.x;
          const startY = n.y;
          const startTime = performance.now();
          const duration = 100; // ~100ms smooth slide

          const animate = (time) => {
            const t = Math.min((time - startTime) / duration, 1);
            const ease = t * (2 - t); // ease-out cubic
            const newX = startX + (targetX - startX) * ease;
            const newY = startY + (targetY - startY) * ease;

            nodeG.setAttribute("transform", `translate(${newX},${newY})`);

            if (t < 1) {
              requestAnimationFrame(animate);
            } else {
              n.x = targetX;
              n.y = targetY;
              nodeG.setAttribute("transform", `translate(${n.x},${n.y})`);
              //edgeManager.redrawAll();
              document
                .querySelectorAll(".edge")
                .forEach((edge) => edgeManager.updateEdgePath(edge));
            }
          };

          requestAnimationFrame(animate);
        });

        scheduleRedraw();
      };

      const onMouseUp = () => {
        if (!dragging) return;
        dragging = false;
        hintLayer.innerHTML = "";
        // edgeManager.redrawAll(); // ensure final accurate redraw
        document
          .querySelectorAll(".edge")
          .forEach((edge) => edgeManager.updateEdgePath(edge));
        document.dispatchEvent(new Event("flowchart:changed"));
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);
      };

      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
    });

    // ------------------------------
    // Resize handle logic
    // ------------------------------
    g.querySelectorAll(".resize-handle").forEach((handle) => {
      handle.addEventListener("mousedown", (e) => {
        e.stopPropagation();
        e.preventDefault();
        history.save();

        const handleName = handle.dataset.handle;
        const svgRect = svg.getBoundingClientRect();
        const startMouse = { x: e.clientX, y: e.clientY };
        const startSize = { w: node.width, h: node.height };
        const startPos = { x: node.x, y: node.y };

        const onMouseMove = (eMove) => {
          const dx =
            (eMove.clientX - startMouse.x) *
            (svg.viewBox.baseVal.width / svgRect.width);
          const dy =
            (eMove.clientY - startMouse.y) *
            (svg.viewBox.baseVal.height / svgRect.height);

          // 🔹 Compute target position & size
          const newSize = { w: node.width, h: node.height };
          const newPos = { x: node.x, y: node.y };

          // right / bottom expand
          if (handleName.includes("right"))
            newSize.w = Math.max(MIN_WIDTH, startSize.w + dx);
          if (handleName.includes("bottom"))
            newSize.h = Math.max(MIN_HEIGHT, startSize.h + dy);

          // left / top adjust
          if (handleName.includes("left")) {
            const nextW = Math.max(MIN_WIDTH, startSize.w - dx);
            newPos.x = startPos.x + (startSize.w - nextW);
            newSize.w = nextW;
          }
          if (handleName.includes("top")) {
            const nextH = Math.max(MIN_HEIGHT, startSize.h - dy);
            newPos.y = startPos.y + (startSize.h - nextH);
            newSize.h = nextH;
          }

          // 🔹 Animate towards new size and position
          const startW = node.width,
            startH = node.height;
          const startX = node.x,
            startY = node.y;
          const targetW = newSize.w,
            targetH = newSize.h;
          const targetX = newPos.x,
            targetY = newPos.y;
          const startTime = performance.now();
          const duration = 120; // ms

          const animate = (time) => {
            const t = Math.min((time - startTime) / duration, 1);
            const ease = t * (2 - t); // ease-out
            const currW = startW + (targetW - startW) * ease;
            const currH = startH + (targetH - startH) * ease;
            const currX = startX + (targetX - startX) * ease;
            const currY = startY + (targetY - startY) * ease;

            rect.setAttribute("width", currW);
            rect.setAttribute("height", currH);
            text.setAttribute("x", currW / 2);
            text.setAttribute("y", currH / 2);

            // update ports dynamically
            g.querySelectorAll(".port").forEach((p) => {
              switch (p.dataset.port) {
                case "top":
                  p.setAttribute("cx", currW / 2);
                  p.setAttribute("cy", 0);
                  break;
                case "bottom":
                  p.setAttribute("cx", currW / 2);
                  p.setAttribute("cy", currH);
                  break;
                case "left":
                  p.setAttribute("cx", 0);
                  p.setAttribute("cy", currH / 2);
                  break;
                case "right":
                  p.setAttribute("cx", currW);
                  p.setAttribute("cy", currH / 2);
                  break;
              }
            });

            // resize handles reposition
            g.querySelectorAll(".resize-handle").forEach((hEl) => {
              const pos = {
                "top-left": [0, 0],
                "top-right": [currW, 0],
                "bottom-left": [0, currH],
                "bottom-right": [currW, currH],
              }[hEl.dataset.handle];
              hEl.setAttribute("x", pos[0] - HANDLE_SIZE / 2);
              hEl.setAttribute("y", pos[1] - HANDLE_SIZE / 2);
            });

            g.setAttribute("transform", `translate(${currX},${currY})`);

            if (t < 1) {
              requestAnimationFrame(animate);
            } else {
              // finalize node data
              node.width = targetW;
              node.height = targetH;
              node.x = targetX;
              node.y = targetY;
              scheduleRedraw();
            }
          };

          requestAnimationFrame(animate);
        };

        const onMouseUp = () => {
          window.removeEventListener("mousemove", onMouseMove);
          window.removeEventListener("mouseup", onMouseUp);
          //edgeManager.redrawAll(); // final redraw after resizing
          document
            .querySelectorAll(".edge")
            .forEach((edge) => edgeManager.updateEdgePath(edge));
          document.dispatchEvent(new Event("flowchart:changed"));
        };

        window.addEventListener("mousemove", onMouseMove);
        window.addEventListener("mouseup", onMouseUp);
      });
    });

    // ------------------------------
    // Click selection & context menu
    // ------------------------------
    g.addEventListener("click", (e) => {
      e.stopPropagation();
      if (e.shiftKey) {
        if (this.multiSelect.has(node.id)) this.multiSelect.delete(node.id);
        else this.multiSelect.add(node.id);
        this.updateSelectionStyles();
      } else {
        this.setSelectedNode(node.id);
      }
    });

    g.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const nodeId = node.id;
      const items = [
        { label: "Rename", action: () => this.renameNode(node, text, g) },
        { label: "Delete", action: () => this.deleteNode(nodeId) },
        { label: "Duplicate", action: () => this.duplicateNode(node) },
        {
          label: "Change Color",
          action: () => {
            const color = prompt(
              "Enter node fill color (CSS):",
              node.color || "#ffffff"
            );
            if (color) {
              node.color = color;
              g.querySelector("rect").setAttribute("fill", color);
            }
          },
        },
      ];
      contextMenu.show(e.clientX, e.clientY, items);
    });

    viewport.appendChild(g);
  }, // end renderNode

  duplicateNode(node) {
    history.save();
    const newNode = {
      ...node,
      id: "node_" + Date.now(),
      x: node.x + 20,
      y: node.y + 20,
    };
    state.nodes.push(newNode);
    this.renderNode(newNode);
    // duplicate outgoing edges
    state.edges
      .filter((e) => e.from === node.id)
      .forEach((e) => edgeManager.addEdge(newNode.id, e.to));
    document.dispatchEvent(new Event("flowchart:changed"));
  },

  renameNode(node, textEl, g) {
    history.save();
    const input = document.createElement("input");
    input.type = "text";
    input.value = node.type;
    input.style.position = "absolute";
    input.style.zIndex = "9999";
    input.style.fontSize = "14px";
    input.style.padding = "2px";

    const svg = document.getElementById("flowchart");
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
      if (ok && input.value.trim() !== "") {
        node.type = input.value.trim();
        textEl.textContent = node.type;
        edgeManager.redrawAll();
        document.dispatchEvent(new Event("flowchart:changed"));
      }
      if (input.parentNode) input.parentNode.removeChild(input);
    };

    const keyHandler = (e) => {
      if (e.key === "Enter") finalize(true);
      if (e.key === "Escape") finalize(false);
    };
    const blurHandler = () => finalize(true);

    input.addEventListener("keydown", keyHandler);
    input.addEventListener("blur", blurHandler);
  },

  renderAll() {
    const viewport = document.getElementById("viewport");
    viewport.querySelectorAll(".node").forEach((n) => n.remove());
    for (const n of state.nodes) this.renderNode(n);
  },

  getNode(id) {
    return state.nodes.find((n) => n.id === id);
  },

  // live port coordinates based on node.x/node.y and width/height
  getPortCoords(nodeOrId, portName) {
    const node =
      typeof nodeOrId === "string" ? this.getNode(nodeOrId) : nodeOrId;
    if (!node) return null;
    switch (portName) {
      case "top":
        return { x: node.x + node.width / 2, y: node.y };
      case "bottom":
        return { x: node.x + node.width / 2, y: node.y + node.height };
      case "left":
        return { x: node.x, y: node.y + node.height / 2 };
      case "right":
        return { x: node.x + node.width, y: node.y + node.height / 2 };
      default:
        return { x: node.x + node.width / 2, y: node.y + node.height / 2 };
    }
  },

  svgPoint(svg, clientX, clientY) {
    const rect = svg.getBoundingClientRect();
    const vb = svg.viewBox.baseVal;
    return {
      x: (clientX - rect.left) * (vb.width / rect.width) + vb.x,
      y: (clientY - rect.top) * (vb.height / rect.height) + vb.y,
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
    const nodes = document.querySelectorAll(".node");
    nodes.forEach((g) => {
      const nodeId = g.dataset.id;
      const rect = g.querySelector("rect");

      if (nodeId === this.selectedNode || this.multiSelect.has(nodeId)) {
        rect.style.stroke = "#0080ff";
        rect.style.strokeWidth = "2.5";
        rect.classList.add("glow-pulse"); // ✨ add animated glow
      } else {
        rect.classList.remove("glow-pulse");
        rect.style.stroke = "#333";
        rect.style.strokeWidth = "1";
        rect.style.filter = "none";
      }
    });
  },
  // delete selected or multi-selected nodes and ALL attached edges reliably
  deleteNode(id) {
    history.save();

    // gather ids to delete
    const idsToDelete = new Set(this.multiSelect);
    if (id) idsToDelete.add(id);
    if (this.selectedNode) idsToDelete.add(this.selectedNode);
    if (idsToDelete.size === 0) return;

    // remove edges connected to deleted nodes
    state.edges = state.edges.filter(
      (e) => !idsToDelete.has(e.from) && !idsToDelete.has(e.to)
    );

    // remove nodes
    state.nodes = state.nodes.filter((n) => !idsToDelete.has(n.id));

    // clear selection
    this.selectedNode = null;
    this.multiSelect.clear();

    // re-render
    this.renderAll();
    edgeManager.redrawAll();
    document.dispatchEvent(new Event("flowchart:changed"));
  },
};
