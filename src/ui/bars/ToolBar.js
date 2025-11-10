// ============================================================================
// FILE: src/ui/bars/ToolBar.js (ENHANCED)
// ============================================================================
export class ToolBar {
  constructor(eventBus) {
    this.eventBus = eventBus;
    this.element = null;
    this.activeTool = "select";
  }

  render() {
    this.element = document.createElement("div");
    this.element.className = "toolbar";

    const toolGroups = [
      {
        name: "Selection",
        tools: [
          { id: "select", icon: "⬚", title: "Select (V)" },
          { id: "pan", icon: "✋", title: "Pan (H)" },
        ],
      },
      {
        name: "Zoom",
        tools: [
          { id: "zoom-in", icon: "🔍+", title: "Zoom In (Ctrl +)" },
          { id: "zoom-out", icon: "🔍-", title: "Zoom Out (Ctrl -)" },
          { id: "zoom-reset", icon: "⟲", title: "Reset Zoom (Ctrl 0)" },
        ],
      },
      {
        name: "History",
        tools: [
          { id: "undo", icon: "↶", title: "Undo (Ctrl Z)" },
          { id: "redo", icon: "↷", title: "Redo (Ctrl Shift Z)" },
        ],
      },
      {
        name: "Alignment",
        tools: [
          { id: "align-left", icon: "⫴", title: "Align Left" },
          { id: "align-center", icon: "⫶", title: "Align Center" },
          { id: "align-right", icon: "⫵", title: "Align Right" },
          { id: "align-top", icon: "⬆", title: "Align Top" },
          { id: "align-middle", icon: "⬌", title: "Align Middle" },
          { id: "align-bottom", icon: "⬇", title: "Align Bottom" },
        ],
      },
    ];

    toolGroups.forEach((group, index) => {
      const groupElement = document.createElement("div");
      groupElement.className = "tool-group";

      group.tools.forEach((tool) => {
        const button = this.createToolButton(tool);
        groupElement.appendChild(button);
      });

      this.element.appendChild(groupElement);

      if (index < toolGroups.length - 1) {
        const separator = document.createElement("div");
        separator.className = "toolbar-separator";
        this.element.appendChild(separator);
      }
    });

    return this.element;
  }

  createToolButton(tool) {
    const button = document.createElement("button");
    button.className = "tool-button";
    button.dataset.tool = tool.id;
    button.textContent = tool.icon;
    button.title = tool.title;

    if (tool.id === this.activeTool) {
      button.classList.add("active");
    }

    button.addEventListener("click", () => {
      this.setActiveTool(tool.id);
      this.eventBus.emit("tool:selected", { tool: tool.id });
    });

    return button;
  }

  setActiveTool(toolId) {
    // Remove active class from all buttons
    const buttons = this.element.querySelectorAll(".tool-button");
    buttons.forEach((btn) => btn.classList.remove("active"));

    // Add active class to selected button
    const button = this.element.querySelector(`[data-tool="${toolId}"]`);
    if (button) {
      button.classList.add("active");
    }

    this.activeTool = toolId;
  }
}
