/**
 * panelManager.js
 * -------------------------
 * Controls collapsible left/right panels in a grid layout editor.
 * Works with layout.css (VS Code-style grid).
 * Includes smooth transitions, hover effects, and grip-based toggling.
 */

export const panelManager = (() => {
  const container = document.getElementById("editor-container");
  const leftToggle = document.getElementById("left-toggle");
  const rightToggle = document.getElementById("right-toggle");
  const leftPanel = document.getElementById("left-panel");
  const rightPanel = document.getElementById("right-panel");

  if (!container || !leftToggle || !rightToggle) {
    console.warn("[panelManager] Missing layout elements.");
    return;
  }

  // State
  let leftCollapsed = false;
  let rightCollapsed = false;

  /**
   * Apply grid column adjustments based on collapse state
   */
  const updateLayout = () => {
    if (leftCollapsed && rightCollapsed) {
      container.classList.add("both-collapsed");
      container.classList.remove("left-collapsed", "right-collapsed");
    } else if (leftCollapsed) {
      container.classList.add("left-collapsed");
      container.classList.remove("both-collapsed", "right-collapsed");
    } else if (rightCollapsed) {
      container.classList.add("right-collapsed");
      container.classList.remove("both-collapsed", "left-collapsed");
    } else {
      container.classList.remove("left-collapsed", "right-collapsed", "both-collapsed");
    }

    // Optional visual feedback (status bar event)
    document.dispatchEvent(
      new CustomEvent("flowchart:layoutChanged", {
        detail: {
          leftCollapsed,
          rightCollapsed,
        },
      })
    );
  };

  /**
   * Toggle panel with animation and visual grip feedback
   */
  const togglePanel = (side) => {
    if (side === "left") {
      leftCollapsed = !leftCollapsed;
      leftToggle.classList.toggle("active", !leftCollapsed);
      leftPanel.style.pointerEvents = leftCollapsed ? "none" : "auto";
    } else if (side === "right") {
      rightCollapsed = !rightCollapsed;
      rightToggle.classList.toggle("active", !rightCollapsed);
      rightPanel.style.pointerEvents = rightCollapsed ? "none" : "auto";
    }
    updateLayout();
  };
/**
 * Initialize a panel grip handle (toggle bar)
 * Adds hover-line glow, click toggle, and smooth feedback
 */
const initGrip = (bar, side) => {
  if (!bar) return;

  // Hover feedback: show blue line (CSS-driven)
  bar.addEventListener("mouseenter", () => bar.classList.add("hover-line"));
  bar.addEventListener("mouseleave", () => bar.classList.remove("hover-line"));

  // Click collapse/expand
  bar.addEventListener("click", () => togglePanel(side));

  // Optional subtle visual feedback pulse
  bar.addEventListener("mousedown", () => {
    bar.style.transform = "scaleY(0.96)";
  });
  bar.addEventListener("mouseup", () => {
    bar.style.transform = "scaleY(1)";
  });
};


  initGrip(leftToggle, "left");
  initGrip(rightToggle, "right");

  // Public API
  return {
    toggleLeft: () => togglePanel("left"),
    toggleRight: () => togglePanel("right"),
    collapseAll: () => {
      leftCollapsed = rightCollapsed = true;
      updateLayout();
    },
    expandAll: () => {
      leftCollapsed = rightCollapsed = false;
      updateLayout();
    },
    isCollapsed: () => ({ left: leftCollapsed, right: rightCollapsed }),
  };
})();
