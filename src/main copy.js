// src/main.js
import { initHeader } from "./ui/headerManager.js";
import { initToolbar } from "./ui/toolbarManager.js";
import { enableZoomPan } from "./ui/zoomPan.js";
import { initMiniMap } from "./ui/minimap.js";
import { state } from "./core/state.js";
import { contextMenu } from "./ui/contextMenu.js";
import { EdgeDrag } from "./core/edgeDrag.js";
import { nodeManager } from "./core/nodeManager.js";
import { edgeManager } from "./core/edgeManager.js";
import { history } from "./core/history.js";
import { panelManager } from "./ui/panelManager.js";
import { themeManager } from "./ui/themeManager.js";
import { initMenuBar } from "./ui/menuManager.js";
import { statusBar } from "./ui/statusBar.js";
import { initLeftPanel } from "./ui/leftPanel.js";
import { initRightPanel } from "./ui/rightPanel.js";

window.addEventListener("DOMContentLoaded", () => {
  // ============================
  // Initialize UI and Core
  // ============================
  initHeader();
  initMenuBar();
  initToolbar();
  initLeftPanel();
  initRightPanel();

  contextMenu.init();

  const svg = document.getElementById("flowchart");
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
  svg.addEventListener("click", (e) => {
    if (justSelected) return;
    if (!e.target.closest(".node") && !e.target.closest(".edge")) {
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

  svg.addEventListener("mousedown", (e) => {
    if (!e.shiftKey) return;
    if (e.target.closest(".node") || e.target.closest(".edge")) return;

    e.preventDefault();
    e.stopPropagation();
    selecting = true;

    selectStart = nodeManager.svgPoint(svg, e.clientX, e.clientY);
    const viewport = document.getElementById("viewport");
    selectBox = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    selectBox.classList.add("select-box");
    selectBox.setAttribute("x", selectStart.x);
    selectBox.setAttribute("y", selectStart.y);
    selectBox.setAttribute("width", 0);
    selectBox.setAttribute("height", 0);
    viewport.appendChild(selectBox);
  });

  window.addEventListener("mousemove", (e) => {
    if (!selecting) return;
    const pt = nodeManager.svgPoint(svg, e.clientX, e.clientY);
    const x = Math.min(pt.x, selectStart.x);
    const y = Math.min(pt.y, selectStart.y);
    const w = Math.abs(pt.x - selectStart.x);
    const h = Math.abs(pt.y - selectStart.y);

    selectBox.setAttribute("x", x);
    selectBox.setAttribute("y", y);
    selectBox.setAttribute("width", w);
    selectBox.setAttribute("height", h);

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

  window.addEventListener("mouseup", () => {
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
  svg.addEventListener("click", (e) => {
    if (!e.ctrlKey) return;
    e.preventDefault();
    e.stopPropagation();

    const node = e.target.closest(".node");
    const edge = e.target.closest(".edge");

    if (node) {
      const id = node.dataset.id;
      if (nodeManager.multiSelect.has(id)) nodeManager.multiSelect.delete(id);
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
  svg.addEventListener("mousedown", (e) => {
    if (!e.altKey) return;
    const nodeEl = e.target.closest(".node");
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
      clone.id = "node_" + Date.now() + Math.floor(Math.random() * 1000);
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
        edgeManager.addEdge(
          fromClone.new,
          toClone.new,
          edge.fromPort,
          edge.toPort
        );
    });

    nodeManager.multiSelect.clear();
    clones.forEach((c) => nodeManager.multiSelect.add(c.new));
    nodeManager.updateSelectionStyles();
  });

  // ==================================================
  // Clipboard operations: Copy, Paste, Delete, Select All
  // ==================================================
  let clipboard = { nodes: [], edges: [] };

  window.addEventListener("keydown", (e) => {
    // ✅ Prevent DELETE/BACKSPACE from deleting nodes while typing in inputs
    const active = document.activeElement;
    const isTyping =
      active &&
      (active.tagName === "INPUT" ||
        active.tagName === "TEXTAREA" ||
        active.isContentEditable);

    if (isTyping) return; // <-- ✅ STOP HERE. Do NOT delete nodes.

    const selectedIds = new Set(nodeManager.multiSelect);
    if (nodeManager.selectedNode) selectedIds.add(nodeManager.selectedNode);

    // ==========================================================
    // 🗑️ DELETE — Remove selected nodes or edges
    // ==========================================================

    if (e.key === "Delete" || e.key === "Backspace") {
      const selectedNodeIds = new Set(nodeManager.multiSelect);
      if (nodeManager.selectedNode)
        selectedNodeIds.add(nodeManager.selectedNode);
      const selectedEdgeKeys = new Set(edgeManager.selectedEdges);

      // 🧠 CASE 1 — Nodes selected
      if (selectedNodeIds.size > 0) {
        const count = selectedNodeIds.size;
        nodeManager.deleteNode();
        showToast(`Deleted ${count} node${count > 1 ? "s" : ""}`, "error");
        e.preventDefault();
        return;
      }

      // 🧠 CASE 2 — Edges selected
      if (selectedEdgeKeys.size > 0) {
        const count = selectedEdgeKeys.size;
        history.save();

        // Remove all selected edges from state
        state.edges = state.edges.filter((edge) => {
          const key = edgeManager.edgeKey(edge);
          return !edgeManager.selectedEdges.has(key);
        });

        edgeManager.selectedEdges.clear();
        edgeManager.redrawAll();

        showToast(`Deleted ${count} edge${count > 1 ? "s" : ""}`, "error");

        document.dispatchEvent(new Event("flowchart:changed"));
        e.preventDefault();
        return;
      }

      // 🧠 CASE 3 — Nothing selected
      showToast("Nothing to delete", "warn");
      e.preventDefault();
      return;
    }

    // ==========================================================
    // 📋 COPY — Copy selected nodes + edges
    // ==========================================================
    if (e.ctrlKey && e.key.toLowerCase() === "c" && selectedIds.size > 0) {
      clipboard.nodes = [];
      clipboard.edges = [];

      selectedIds.forEach((id) => {
        const node = nodeManager.getNode(id);
        if (node) clipboard.nodes.push({ ...node });
      });

      state.edges.forEach((edge) => {
        if (selectedIds.has(edge.from) && selectedIds.has(edge.to)) {
          clipboard.edges.push({ ...edge });
        }
      });

      e.preventDefault();

      showToast("Copied selection", "success");

      return;
    }

    // ==========================================================
    // 📥 PASTE — Duplicate nodes + edges
    // ==========================================================
    if (
      e.ctrlKey &&
      e.key.toLowerCase() === "v" &&
      clipboard.nodes.length > 0
    ) {
      history.save();
      const idMap = new Map();

      clipboard.nodes.forEach((oldNode) => {
        const newNode = { ...oldNode };
        newNode.id = "node_" + Date.now() + Math.floor(Math.random() * 1000);
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

      showToast("Pasted nodes and edges", "success");

      return;
    }

    // ==========================================================
    // 🧩 SELECT ALL — Ctrl + A
    // ==========================================================
    if (e.ctrlKey && !e.shiftKey && e.key.toLowerCase() === "a") {
      e.preventDefault();

      // Select all nodes
      nodeManager.multiSelect.clear();
      state.nodes.forEach((node) => nodeManager.multiSelect.add(node.id));

      // Select all edges
      edgeManager.selectedEdges.clear();
      state.edges.forEach((edge) => {
        edgeManager.selectedEdges.add(edgeManager.edgeKey(edge));
      });

      // Update styles
      nodeManager.updateSelectionStyles();
      edgeManager.updateSelectionStyles();

      // 🔔 Visual feedback
      showToast(
        `Selected ${state.nodes.length} nodes and ${state.edges.length} edges`,
        "info"
      );

      return;
    }

    // ==========================================================
    // ❌ DESELECT ALL — Ctrl + Shift + A  (NEW)
    // ==========================================================
    if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "a") {
      e.preventDefault();

      nodeManager.clearSelection(); // clears both single + multi node selection
      edgeManager.selectedEdges.clear();
      edgeManager.updateSelectionStyles();

      document.dispatchEvent(new Event("flowchart:changed"));

      // 🔔 Visual feedback
      showToast("Selection cleared", "warn");

      return;
    }

    // -------------------------------
    // ⬅️➡️⬆️⬇️ Move selected nodes (Soft Pull Animation)
    // -------------------------------
    const arrowKeys = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];
    if (arrowKeys.includes(e.key)) {
      e.preventDefault();

      const MOVE_STEP = e.shiftKey ? 32 : 8; // 🔹 Shift = faster move
      if (selectedIds.size === 0) return;

      history.save();

      const dx =
        e.key === "ArrowLeft"
          ? -MOVE_STEP
          : e.key === "ArrowRight"
          ? MOVE_STEP
          : 0;
      const dy =
        e.key === "ArrowUp"
          ? -MOVE_STEP
          : e.key === "ArrowDown"
          ? MOVE_STEP
          : 0;

      selectedIds.forEach((id) => {
        const node = nodeManager.getNode(id);
        if (!node) return;

        // target position
        const targetX = node.x + dx;
        const targetY = node.y + dy;

        const nodeEl = document.querySelector(`.node[data-id="${id}"]`);
        if (!nodeEl) return;

        // --- smooth interpolation ---
        const startX = node.x;
        const startY = node.y;
        const startTime = performance.now();
        const duration = 150; // ms

        const animate = (time) => {
          const t = Math.min((time - startTime) / duration, 1);
          const ease = t * (2 - t); // ease-out cubic
          const newX = startX + (targetX - startX) * ease;
          const newY = startY + (targetY - startY) * ease;

          nodeEl.setAttribute("transform", `translate(${newX},${newY})`);

          if (t < 1) {
            requestAnimationFrame(animate);
          } else {
            // finalize
            node.x = targetX;
            node.y = targetY;
            nodeEl.setAttribute("transform", `translate(${node.x},${node.y})`);
            edgeManager.redrawAll();
          }
        };
        requestAnimationFrame(animate);
      });

      nodeManager.updateSelectionStyles();
      showToast(`Moved ${selectedIds.size} node(s)`, "info");
      return;
    }

    // -------------------------------
    // ⤺ Undo / ⤼ Redo
    // -------------------------------
    if (e.ctrlKey && e.key.toLowerCase() === "z") {
      history.undo();
      nodeManager.renderAll();
      edgeManager.redrawAll();
      showToast("⤺ Undo", "warn");
      e.preventDefault();
      return;
    }

    if (e.ctrlKey && e.key.toLowerCase() === "y") {
      history.redo();
      nodeManager.renderAll();
      edgeManager.redrawAll();
      showToast("⤼ Redo", "warn");
      e.preventDefault();
      return;
    }
  });
});
/**
 * 📢 showToast(message, [type])
 * ------------------------------------------------------
 * Smart toast notifications with auto color detection.
 * Supports stacking, click-to-dismiss, fade animation,
 * and auto color theme based on message keywords.
 *
 * @param {string} message - Text content to show.
 * @param {'info'|'success'|'warn'|'error'} [type] - Optional manual override.
 */
function showToast(message, type = null) {
  // 🔹 1. Create container if not exists
  let container = document.getElementById("toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "toast-container";
    Object.assign(container.style, {
      position: "fixed",
      bottom: "20px",
      right: "20px",
      display: "flex",
      flexDirection: "column",
      gap: "8px",
      zIndex: 9999,
      pointerEvents: "none",
    });
    document.body.appendChild(container);
  }

  // 🔹 2. Auto-detect type if not provided
  const lowerMsg = message.toLowerCase();
  if (!type) {
    if (lowerMsg.includes("error") || lowerMsg.includes("fail")) type = "error";
    else if (lowerMsg.includes("delete") || lowerMsg.includes("removed"))
      type = "error";
    else if (
      lowerMsg.includes("copy") ||
      lowerMsg.includes("paste") ||
      lowerMsg.includes("saved")
    )
      type = "success";
    else if (lowerMsg.includes("clear") || lowerMsg.includes("empty"))
      type = "warn";
    else if (lowerMsg.includes("select") || lowerMsg.includes("highlight"))
      type = "info";
    else type = "info";
  }

  // 🔹 3. Create toast element
  const toast = document.createElement("div");
  toast.className = "flowchart-toast";
  Object.assign(toast.style, {
    minWidth: "180px",
    maxWidth: "280px",
    padding: "10px 14px",
    borderRadius: "6px",
    fontSize: "13px",
    color: "#fff",
    boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
    opacity: "0",
    transform: "translateY(20px)",
    transition: "all 0.3s ease",
    pointerEvents: "auto",
    cursor: "pointer",
    fontFamily: "system-ui, sans-serif",
    letterSpacing: "0.2px",
  });

  // 🎨 4. Themes (color + glow)
  const themes = {
    info: {
      bg: "linear-gradient(135deg,#007bff,#3399ff)",
      glow: "0 0 6px rgba(0,123,255,0.4)",
    },
    success: {
      bg: "linear-gradient(135deg,#28a745,#66bb6a)",
      glow: "0 0 6px rgba(40,167,69,0.4)",
    },
    warn: {
      bg: "linear-gradient(135deg,#ffc107,#ffb347)",
      glow: "0 0 6px rgba(255,193,7,0.4)",
    },
    error: {
      bg: "linear-gradient(135deg,#dc3545,#f26a6a)",
      glow: "0 0 6px rgba(220,53,69,0.4)",
    },
  };

  const theme = themes[type] || themes.info;
  toast.style.background = theme.bg;
  toast.style.boxShadow = theme.glow;

  // 🔹 5. Add message & insert into container
  toast.textContent = message;
  container.appendChild(toast);

  // 🔹 6. Animate in
  requestAnimationFrame(() => {
    toast.style.opacity = "1";
    toast.style.transform = "translateY(0)";
  });

  // 🔹 7. Auto-remove after 2s
  const duration = 2000;
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(20px)";
    setTimeout(() => toast.remove(), 400);
  }, duration);

  // 🔹 8. Allow click-to-dismiss
  toast.addEventListener("click", () => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(20px)";
    setTimeout(() => toast.remove(), 300);
  });
  // 🔹 Notify the action log
  window.dispatchEvent(
    new CustomEvent("toast:shown", { detail: { message, type } })
  );
}

// =====================================================
// 🧾 UNIVERSAL ACTION LOG PANEL (Event-based, Minimal)
// =====================================================
(function initActionLog() {
  // 🔹 Create toggle button
  const logToggle = document.createElement("button");
  logToggle.id = "log-toggle";
  logToggle.textContent = "🧾 Log";
  Object.assign(logToggle.style, {
    position: "fixed",
    bottom: "20px",
    left: "20px",
    padding: "6px 12px",
    fontSize: "13px",
    background: "#444",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
    zIndex: 10000,
    fontFamily: "system-ui, sans-serif",
    transition: "background 0.3s ease",
  });

  // 🔹 Create log panel
  const logPanel = document.createElement("div");
  logPanel.id = "action-log";
  Object.assign(logPanel.style, {
    position: "fixed",
    bottom: "60px",
    left: "20px",
    width: "260px",
    height: "0",
    overflow: "hidden",
    background: "#1f1f1f",
    borderRadius: "8px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
    color: "#ddd",
    fontSize: "12px",
    fontFamily: "system-ui, sans-serif",
    transition: "all 0.3s ease",
    zIndex: 9999,
    padding: "0 10px",
  });

  // 🔹 Log content container
  const logList = document.createElement("div");
  logList.id = "log-list";
  Object.assign(logList.style, {
    display: "flex",
    flexDirection: "column-reverse",
    gap: "6px",
    maxHeight: "280px",
    overflowY: "auto",
    margin: "10px 0",
  });

  logPanel.appendChild(logList);
  document.body.appendChild(logToggle);
  document.body.appendChild(logPanel);

  // 🔹 Toggle open/close
  let open = false;
  logToggle.addEventListener("click", () => {
    open = !open;
    logPanel.style.height = open ? "300px" : "0";
    logToggle.style.background = open ? "#007bff" : "#444";
  });

  // 🔹 Listen for toast events
  window.addEventListener("toast:shown", (e) => {
    const { message, type } = e.detail || {};
    if (!message) return;

    const now = new Date();
    const time = now.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    const color =
      {
        info: "#3399ff",
        success: "#28a745",
        warn: "#ffc107",
        error: "#ff4444",
      }[type] || "#aaa";

    const entry = document.createElement("div");
    entry.innerHTML = `<span style="color:${color}">●</span> <b>${time}</b> — ${message}`;
    entry.style.opacity = "0";
    entry.style.transition = "opacity 0.3s ease";
    logList.appendChild(entry);

    requestAnimationFrame(() => (entry.style.opacity = "1"));

    // Limit number of log entries
    const maxEntries = 20;
    while (logList.children.length > maxEntries) {
      logList.removeChild(logList.firstChild);
    }
  });
  // ===========================
  // MiniMap Toggle
  // ===========================
  document.addEventListener("ui:toggleMiniMap", () => {
    const mini = document.getElementById("minimap-panel");
    if (!mini) return;
    mini.style.display = mini.style.display === "none" ? "block" : "none";
  });

  // ===========================
  // Action Log Toggle
  // ===========================
  document.addEventListener("ui:toggleActionLog", () => {
    const log = document.getElementById("log-panel");
    if (!log) return;
    log.style.display = log.style.display === "none" ? "block" : "none";
  });
})();
