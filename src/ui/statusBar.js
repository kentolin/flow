/**
 * statusBar.js
 * -----------------------------------
 * VS Code–style status bar for the flowchart editor.
 * Auto-updates on layout, graph, and theme changes.
 */

import { state } from "../core/state.js";

export const statusBar = (() => {
  // 🟦 Create status bar
  const bar = document.createElement("div");
  bar.id = "statusbar";
  Object.assign(bar.style, {
    position: "fixed",
    bottom: "0",
    left: "0",
    right: "0",
    height: "26px",
    background: "var(--bg-statusbar, #f3f3f3)",
    borderTop: "1px solid var(--border-splitter, #dadada)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0 10px",
    fontSize: "12px",
    fontFamily: "var(--font-ui, 'Segoe UI', sans-serif)",
    color: "var(--text-subtle, #555)",
    zIndex: 9999,
    userSelect: "none",
  });

  // 🟩 Left and right info areas
  const leftStatus = document.createElement("span");
  const rightStatus = document.createElement("span");

  leftStatus.textContent = "Flowchart Editor Ready";
  rightStatus.textContent = "Theme: Light | Nodes: 0 | Edges: 0";

  bar.append(leftStatus, rightStatus);
  document.body.appendChild(bar);

  // ==============================
  // 🧭 Event Reactivity
  // ==============================

  // 🔹 On layout change (panel collapse/expand)
  document.addEventListener("flowchart:layoutChanged", (e) => {
    const { leftCollapsed, rightCollapsed } = e.detail;
    let msg = "Both panels visible";
    if (leftCollapsed && rightCollapsed) msg = "Both panels hidden";
    else if (leftCollapsed) msg = "Left panel hidden";
    else if (rightCollapsed) msg = "Right panel hidden";
    leftStatus.textContent = msg;
  });

  // 🔹 On graph change (nodes/edges added/deleted)
  document.addEventListener("flowchart:changed", () => {
    const nodes = state.nodes.length;
    const edges = state.edges.length;
    updateRightStatus({ nodes, edges });
  });

  // 🔹 On theme change
  document.addEventListener("theme:changed", (e) => {
    const themeName = e.detail?.theme || "Light";
    updateRightStatus({ theme: themeName });
  });

  // ==============================
  // 🔧 Helpers
  // ==============================
  let currentTheme = "Light";
  let currentNodes = 0;
  let currentEdges = 0;

  function updateRightStatus({ theme, nodes, edges }) {
    if (theme !== undefined) currentTheme = theme;
    if (nodes !== undefined) currentNodes = nodes;
    if (edges !== undefined) currentEdges = edges;

    rightStatus.textContent = `Theme: ${currentTheme} | Nodes: ${currentNodes} | Edges: ${currentEdges}`;
  }

  // ==============================
  // 🔹 Public API
  // ==============================
  return {
    setLeft: (text) => (leftStatus.textContent = text),
    setRight: (text) => (rightStatus.textContent = text),
    update: updateRightStatus,
  };
})();
