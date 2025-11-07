// src/ui/rightPanel.js
import { nodeProperties } from "./nodeProperties.js";
import { edgeProperties } from "./edgeProperties.js";
import { nodeManager } from "../core/nodeManager.js";
import { edgeManager } from "../core/edgeManager.js";

export function initRightPanel() {
  const panel = document.getElementById("right-panel");
  if (!panel) return;

  const collapsedState = JSON.parse(
    localStorage.getItem("propertiesPanelState") || "{}"
  );

  let selectedNodeId = null;
  let selectedEdgeId = null;

  // ✅ When typing inside input fields, block auto-refresh
  let typing = false;

  // ------------------------------------------------------------
  //  EVENT: properties:update (node or edge selected)
  // ------------------------------------------------------------
  document.addEventListener("properties:update", (e) => {
    if (typing) return;

    if (e.detail.type === "node") {
      selectedNodeId = e.detail.id;
      selectedEdgeId = null;
      renderNodeProperties(nodeManager.getNode(selectedNodeId));
    }

    if (e.detail.type === "edge") {
      selectedEdgeId = e.detail.id;
      selectedNodeId = null;
      renderEdgeProperties(edgeManager.getEdge(selectedEdgeId));
    }
  });

  // ------------------------------------------------------------
  // EVENT: flowchart:changed (keep inspector updated)
  // ------------------------------------------------------------
  document.addEventListener("flowchart:changed", () => {
    if (typing) return;

    if (selectedNodeId) {
      renderNodeProperties(nodeManager.getNode(selectedNodeId));
    } else if (selectedEdgeId) {
      renderEdgeProperties(edgeManager.getEdge(selectedEdgeId));
    }
  });

  // ------------------------------------------------------------
  // ✅ PROPERTY INPUT HTML
  // ------------------------------------------------------------
  function propertyHTML(prop, value) {
    switch (prop.type) {
      case "text":
        return `
        <div class="rp-input">
          <label>${prop.label}</label>
          <input type="text" data-bind="${prop.bind}" value="${value ?? ""}">
        </div>`;

      case "number":
        return `
        <div class="rp-input">
          <label>${prop.label}</label>
          <input type="number" data-bind="${prop.bind}" value="${value ?? 0}">
        </div>`;

      case "color":
        const safe = value || "#000000"; // ✅ Fix Chrome warning
        return `
        <div class="rp-input">
          <label>${prop.label}</label>
          <input type="color" data-bind="${prop.bind}" value="${safe}">
        </div>`;

      case "range":
        return `
        <div class="rp-input">
          <label>${prop.label} <span class="rp-range-val">${value}</span></label>
          <input type="range" min="${prop.min}" max="${prop.max}"
                 step="${prop.step}" data-bind="${prop.bind}" value="${value}">
        </div>`;

      case "select":
        return `
        <div class="rp-input">
          <label>${prop.label}</label>
          <select data-bind="${prop.bind}">
            ${prop.options
              .map(
                (o) =>
                  `<option value="${o.value}" ${
                    o.value == value ? "selected" : ""
                  }>${o.label}</option>`
              )
              .join("")}
          </select>
        </div>`;

      default:
        return "";
    }
  }

  // ------------------------------------------------------------
  // ✅ RENDER NODE INSPECTOR
  // ------------------------------------------------------------
  function renderNodeProperties(node) {
    panel.innerHTML = "";

    if (!node) {
      panel.innerHTML = `<div class="rp-empty">No node selected</div>`;
      return;
    }

    nodeProperties.forEach((cat) => {
      const section = document.createElement("div");
      section.className = "property-category";

      // --- Category Header ---
      const header = document.createElement("div");
      header.className = "category-header";
      header.innerHTML = `
      <span class="triangle ${collapsedState[cat.name] ? "" : "open"}"></span>${
        cat.name
      }
    `;

      // --- Property Grid ---
      const grid = document.createElement("div");
      grid.className = "property-grid";
      if (collapsedState[cat.name]) grid.classList.add("collapsed");

      cat.properties.forEach((prop) => {
        const item = document.createElement("div");
        item.className = "property-item";
        item.innerHTML = propertyHTML(prop, node[prop.bind]);
        grid.appendChild(item);
      });
      // --- Toggle collapse ---
      header.addEventListener("click", () => {
        const triangle = header.querySelector(".triangle");
        const isCollapsed = grid.classList.toggle("collapsed");
        triangle.classList.toggle("open", !isCollapsed);

        collapsedState[cat.name] = isCollapsed;
        localStorage.setItem(
          "propertiesPanelState",
          JSON.stringify(collapsedState)
        );
      });

      // --- Assemble Section ---
      section.appendChild(header);
      section.appendChild(grid);
      panel.appendChild(section);
    });

    bindNodeEvents(node);
  }

  // ------------------------------------------------------------
  // ✅ RENDER EDGE INSPECTOR
  // ------------------------------------------------------------
  function renderEdgeProperties(edge) {
    panel.innerHTML = "";

    if (!edge) {
      panel.innerHTML = `<div class="rp-empty">No edge selected</div>`;
      return;
    }

    edgeProperties.forEach((cat) => {
      const section = document.createElement("div");
      section.className = "property-category";

      // --- Category Header ---
      const header = document.createElement("div");
      header.className = "category-header";
      header.innerHTML = `
      <span class="triangle ${collapsedState[cat.name] ? "" : "open"}"></span>${
        cat.name
      }
    `;

      // --- Property Grid ---
      const grid = document.createElement("div");
      grid.className = "property-grid";
      if (collapsedState[cat.name]) grid.classList.add("collapsed");

      cat.properties.forEach((prop) => {
        const item = document.createElement("div");
        item.className = "property-item";
        item.innerHTML = propertyHTML(prop, edge[prop.bind]);
        grid.appendChild(item);
      });
      // --- Toggle collapse ---
      header.addEventListener("click", () => {
        const triangle = header.querySelector(".triangle");
        const isCollapsed = grid.classList.toggle("collapsed");
        triangle.classList.toggle("open", !isCollapsed);

        collapsedState[cat.name] = isCollapsed;
        localStorage.setItem(
          "propertiesPanelState",
          JSON.stringify(collapsedState)
        );
      });

      // --- Assemble Section ---
      section.appendChild(header);
      section.appendChild(grid);
      panel.appendChild(section);
    });

    bindEdgeEvents(edge);
  }

  // ------------------------------------------------------------
  // ✅ BIND NODE PROPERTY CHANGES (Safely)
  // ------------------------------------------------------------
  function bindNodeEvents(node) {
    panel.querySelectorAll("[data-bind]").forEach((input) => {
      input.addEventListener("focus", () => (typing = true));
      input.addEventListener("blur", () => (typing = false));

      input.addEventListener("input", () => {
        const key = input.dataset.bind;
        let val = input.value;

        if (input.type === "number") val = Number(val);

        // ✅ Update data model
        node[key] = val;

        // ✅ Update SVG visually
        updateNodeSVG(node, key, val);

        if (input.type !== "text") {
          typing = false;
          document.dispatchEvent(new Event("flowchart:changed"));
        }
      });
    });
  }

  // ------------------------------------------------------------
  // ✅ UPDATE NODE SVG
  // ------------------------------------------------------------
  function updateNodeSVG(node, key, val) {
    const el = document.querySelector(`.node[data-id="${node.id}"]`);
    if (!el) return;

    const rect = el.querySelector("rect");
    const text = el.querySelector("text");

    if (key === "type" || key === "label") text.textContent = val;
    if (key === "color") rect.setAttribute("fill", val);
    if (key === "stroke") rect.setAttribute("stroke", val);

    if (key === "radius") {
      rect.setAttribute("rx", val);
      rect.setAttribute("ry", val);
    }

    if (key === "width" || key === "height") {
      rect.setAttribute("width", node.width);
      rect.setAttribute("height", node.height);
      text.setAttribute("x", node.width / 2);
      text.setAttribute("y", node.height / 2);
    }

    if (key === "x" || key === "y") {
      el.setAttribute("transform", `translate(${node.x},${node.y})`);
    }
  }

  // ------------------------------------------------------------
  // ✅ BIND EDGE PROPERTY CHANGES
  // ------------------------------------------------------------
  function bindEdgeEvents(edge) {
    panel.querySelectorAll("[data-bind]").forEach((input) => {
      input.addEventListener("focus", () => (typing = true));
      input.addEventListener("blur", () => (typing = false));

      input.addEventListener("input", () => {
        const key = input.dataset.bind;
        let val = input.value;

        if (input.type === "number" || input.type === "range") {
          val = Number(val);
        }

        edge[key] = val;

        // ✅ Immediate live update
        edgeManager.redrawAll();

        if (input.type !== "text") {
          typing = false;
          document.dispatchEvent(new Event("flowchart:changed"));
        }
      });
    });
  }
}
