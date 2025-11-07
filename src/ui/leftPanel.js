import { shapeCategories } from "./shapes.js";
import { nodeManager } from "../core/nodeManager.js";

/**
 * leftPanel.js
 * -------------------
 * Handles collapsible left sidebar with shape categories.
 * Supports click-to-add and drag-to-drop.
 */

export function initLeftPanel() {
  const panel = document.getElementById("left-panel");
  if (!panel) return;

  // Restore collapse state from localStorage
  const collapsedState = JSON.parse(
    localStorage.getItem("shapePanelState") || "{}"
  );

  panel.innerHTML = "";

  shapeCategories.forEach((cat) => {
    const section = document.createElement("div");
    section.className = "shape-category";

    // --- Category Header ---
    const header = document.createElement("div");
    header.className = "category-header";
    header.innerHTML = `
      <span class="triangle ${collapsedState[cat.name] ? "" : "open"}"></span>${
      cat.name
    }
    `;

    // --- Shape Grid ---
    const grid = document.createElement("div");
    grid.className = "shape-grid";
    if (collapsedState[cat.name]) grid.classList.add("collapsed");

    cat.shapes.forEach((shape) => {
      const item = document.createElement("div");
      item.className = "shape-item";
      item.innerHTML = `<svg viewBox="0 0 36 36">${shape.svg}</svg>`;

      // Click → add to center
      item.addEventListener("click", (e) => {
        e.stopPropagation();
        const editorRect = document
          .getElementById("flowchart")
          .getBoundingClientRect();
        const centerX = editorRect.width / 2;
        const centerY = editorRect.height / 2;
        nodeManager.createNode(shape.id, centerX, centerY, shape.label);
      });

      // Drag → drop anywhere
      // --- Drag & Drop with SVG Ghost Preview ---
      item.setAttribute("draggable", "true");
      item.addEventListener("dragstart", (e) => {
        e.dataTransfer.setData("shape-id", shape.id);
        e.dataTransfer.effectAllowed = "move";

        // Create ghost element
        const ghost = document.createElement("div");
        ghost.style.position = "absolute";
        ghost.style.top = "-9999px"; // hide original
        ghost.style.left = "-9999px";
        ghost.style.width = "40px";
        ghost.style.height = "40px";
        ghost.style.opacity = "0.7";
        ghost.style.pointerEvents = "none";
        ghost.innerHTML = ` <svg viewBox="0 0 36 36" width="48" height="48"
            style="fill:none;stroke:#0078d7;stroke-width:1.8;
            filter:drop-shadow(0 1px 2px rgba(0,0,0,0.25));">
            ${shape.svg}
        </svg>`;

        document.body.appendChild(ghost);
        e.dataTransfer.setDragImage(ghost, 20, 20);

        // Clean up ghost after a short delay
        setTimeout(() => ghost.remove(), 0);
      });

      grid.appendChild(item);
    });

    // --- Toggle collapse ---
    header.addEventListener("click", () => {
      const triangle = header.querySelector(".triangle");
      const isCollapsed = grid.classList.toggle("collapsed");
      triangle.classList.toggle("open", !isCollapsed);

      collapsedState[cat.name] = isCollapsed;
      localStorage.setItem("shapePanelState", JSON.stringify(collapsedState));
    });

    section.appendChild(header);
    section.appendChild(grid);
    panel.appendChild(section);
  });

  // --- Enable drop on editor ---
  // === Drop Shape onto Editor (Exact Position) ===
  const editor = document.getElementById("flowchart");

  editor.addEventListener("dragover", (e) => {
    e.preventDefault();
    e.dataTransfer.effectAllowed = "move";
  });

  editor.addEventListener("drop", (e) => {
    e.preventDefault();
    const shapeId = e.dataTransfer.getData("shape-id");
    if (!shapeId) return;

    const { x, y } = clientToViewport(e.clientX, e.clientY);
    const newNode = nodeManager.createNode(shapeId, x, y);

    // Animate only inner content!
    const content = document.querySelector(
      `.node[data-id="${newNode.id}"] .node-content`
    );

    if (content) {
      content.style.transform = "scale(0.4)";
      content.style.opacity = "0";
      content.style.transition = "none";

      requestAnimationFrame(() => {
        content.style.transition =
          "transform 200ms cubic-bezier(0.18, 1.4, 0.4, 1), opacity 200ms ease-out";
        content.style.transform = "scale(1)";
        content.style.opacity = "1";
      });

      setTimeout(() => (content.style.transition = ""), 240);
    }
  });

  function clientToViewport(clientX, clientY) {
    const viewport = document.getElementById("viewport");

    const pt = new DOMPoint(clientX, clientY);
    const local = pt.matrixTransform(viewport.getScreenCTM().inverse());
    return { x: local.x, y: local.y };
  }
}
