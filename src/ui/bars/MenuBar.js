// ============================================================================
// FILE: src/ui/bars/MenuBar.js
// ============================================================================
export class MenuBar {
  constructor(eventBus) {
    this.eventBus = eventBus;
    this.element = null;
    this.activeMenu = null;
  }

  render() {
    this.element = document.createElement("div");
    this.element.className = "menu-bar";

    const menus = [
      {
        id: "file",
        label: "File",
        items: [
          { id: "new", label: "New", shortcut: "Ctrl+N" },
          { id: "open", label: "Open...", shortcut: "Ctrl+O" },
          { id: "save", label: "Save", shortcut: "Ctrl+S" },
          { id: "save-as", label: "Save As...", shortcut: "Ctrl+Shift+S" },
          { type: "separator" },
          {
            id: "export",
            label: "Export",
            submenu: [
              { id: "export-json", label: "Export as JSON" },
              { id: "export-svg", label: "Export as SVG" },
              { id: "export-png", label: "Export as PNG" },
            ],
          },
          { type: "separator" },
          { id: "close", label: "Close", shortcut: "Ctrl+W" },
        ],
      },
      {
        id: "edit",
        label: "Edit",
        items: [
          { id: "undo", label: "Undo", shortcut: "Ctrl+Z" },
          { id: "redo", label: "Redo", shortcut: "Ctrl+Shift+Z" },
          { type: "separator" },
          { id: "cut", label: "Cut", shortcut: "Ctrl+X" },
          { id: "copy", label: "Copy", shortcut: "Ctrl+C" },
          { id: "paste", label: "Paste", shortcut: "Ctrl+V" },
          { id: "delete", label: "Delete", shortcut: "Delete" },
          { type: "separator" },
          { id: "select-all", label: "Select All", shortcut: "Ctrl+A" },
          { id: "deselect-all", label: "Deselect All", shortcut: "Ctrl+D" },
        ],
      },
      {
        id: "view",
        label: "View",
        items: [
          { id: "zoom-in", label: "Zoom In", shortcut: "Ctrl+Plus" },
          { id: "zoom-out", label: "Zoom Out", shortcut: "Ctrl+Minus" },
          { id: "zoom-reset", label: "Reset Zoom", shortcut: "Ctrl+0" },
          { id: "fit-to-screen", label: "Fit to Screen", shortcut: "Ctrl+1" },
          { type: "separator" },
          { id: "toggle-grid", label: "Show Grid", checked: true },
          { id: "toggle-snap", label: "Snap to Grid", checked: true },
          { type: "separator" },
          { id: "toggle-minimap", label: "Show Minimap", checked: true },
          { id: "toggle-rulers", label: "Show Rulers", checked: false },
        ],
      },
      {
        id: "insert",
        label: "Insert",
        items: [
          { id: "insert-rect", label: "Rectangle", shortcut: "R" },
          { id: "insert-circle", label: "Circle", shortcut: "C" },
          { id: "insert-diamond", label: "Diamond", shortcut: "D" },
          { type: "separator" },
          { id: "insert-process", label: "Process" },
          { id: "insert-decision", label: "Decision" },
          { id: "insert-terminator", label: "Terminator" },
          { type: "separator" },
          { id: "insert-text", label: "Text", shortcut: "T" },
          { id: "insert-image", label: "Image", shortcut: "I" },
        ],
      },
      {
        id: "arrange",
        label: "Arrange",
        items: [
          { id: "bring-to-front", label: "Bring to Front", shortcut: "Ctrl+]" },
          { id: "send-to-back", label: "Send to Back", shortcut: "Ctrl+[" },
          { id: "bring-forward", label: "Bring Forward", shortcut: "]" },
          { id: "send-backward", label: "Send Backward", shortcut: "[" },
          { type: "separator" },
          {
            id: "align",
            label: "Align",
            submenu: [
              { id: "align-left", label: "Align Left" },
              { id: "align-center", label: "Align Center" },
              { id: "align-right", label: "Align Right" },
              { type: "separator" },
              { id: "align-top", label: "Align Top" },
              { id: "align-middle", label: "Align Middle" },
              { id: "align-bottom", label: "Align Bottom" },
            ],
          },
          {
            id: "distribute",
            label: "Distribute",
            submenu: [
              { id: "distribute-horizontal", label: "Distribute Horizontally" },
              { id: "distribute-vertical", label: "Distribute Vertically" },
            ],
          },
          { type: "separator" },
          { id: "group", label: "Group", shortcut: "Ctrl+G" },
          { id: "ungroup", label: "Ungroup", shortcut: "Ctrl+Shift+G" },
        ],
      },
      {
        id: "help",
        label: "Help",
        items: [
          { id: "documentation", label: "Documentation", shortcut: "F1" },
          { id: "shortcuts", label: "Keyboard Shortcuts", shortcut: "Ctrl+/" },
          { id: "tutorial", label: "Interactive Tutorial" },
          { type: "separator" },
          { id: "report-issue", label: "Report an Issue" },
          { id: "check-updates", label: "Check for Updates" },
          { type: "separator" },
          { id: "about", label: "About Flowchart Editor" },
        ],
      },
    ];

    menus.forEach((menu) => {
      const menuItem = this.createMenuItem(menu);
      this.element.appendChild(menuItem);
    });

    this.attachGlobalListeners();
    return this.element;
  }

  createMenuItem(menu) {
    const menuItem = document.createElement("div");
    menuItem.className = "menu-item";
    menuItem.textContent = menu.label;
    menuItem.dataset.menuId = menu.id;

    const dropdown = this.createDropdown(menu.items);
    menuItem.appendChild(dropdown);

    menuItem.addEventListener("click", (e) => {
      e.stopPropagation();
      this.toggleMenu(menuItem);
    });

    menuItem.addEventListener("mouseenter", () => {
      if (this.activeMenu && this.activeMenu !== menuItem) {
        this.closeAllMenus();
        this.toggleMenu(menuItem);
      }
    });

    return menuItem;
  }

  createDropdown(items) {
    const dropdown = document.createElement("div");
    dropdown.className = "menu-dropdown";

    items.forEach((item) => {
      if (item.type === "separator") {
        const separator = document.createElement("div");
        separator.className = "menu-separator";
        dropdown.appendChild(separator);
      } else if (item.submenu) {
        const submenuItem = this.createSubmenuItem(item);
        dropdown.appendChild(submenuItem);
      } else {
        const menuOption = this.createMenuOption(item);
        dropdown.appendChild(menuOption);
      }
    });

    return dropdown;
  }

  createMenuOption(item) {
    const option = document.createElement("div");
    option.className = "menu-option";
    option.dataset.actionId = item.id;

    if (item.checked !== undefined) {
      const checkbox = document.createElement("span");
      checkbox.className = "menu-option-checkbox";
      checkbox.textContent = item.checked ? "✓" : "";
      option.appendChild(checkbox);
    }

    const label = document.createElement("span");
    label.className = "menu-option-label";
    label.textContent = item.label;
    option.appendChild(label);

    if (item.shortcut) {
      const shortcut = document.createElement("span");
      shortcut.className = "menu-option-shortcut";
      shortcut.textContent = item.shortcut;
      option.appendChild(shortcut);
    }

    if (item.disabled) {
      option.classList.add("disabled");
    }

    option.addEventListener("click", (e) => {
      e.stopPropagation();

      if (!item.disabled) {
        // Toggle checkbox if it's a checkable item
        if (item.checked !== undefined) {
          item.checked = !item.checked;
          const checkbox = option.querySelector(".menu-option-checkbox");
          checkbox.textContent = item.checked ? "✓" : "";
        }

        this.handleMenuAction(item.id, item);
        this.closeAllMenus();
      }
    });

    return option;
  }

  createSubmenuItem(item) {
    const submenuContainer = document.createElement("div");
    submenuContainer.className = "menu-option submenu-container";

    const label = document.createElement("span");
    label.className = "menu-option-label";
    label.textContent = item.label;
    submenuContainer.appendChild(label);

    const arrow = document.createElement("span");
    arrow.className = "submenu-arrow";
    arrow.textContent = "▶";
    submenuContainer.appendChild(arrow);

    const submenu = this.createDropdown(item.submenu);
    submenu.classList.add("submenu");
    submenuContainer.appendChild(submenu);

    return submenuContainer;
  }

  toggleMenu(menuItem) {
    const wasActive = menuItem.classList.contains("active");
    this.closeAllMenus();

    if (!wasActive) {
      menuItem.classList.add("active");
      this.activeMenu = menuItem;
    }
  }

  closeAllMenus() {
    const activeMenus = this.element.querySelectorAll(".menu-item.active");
    activeMenus.forEach((menu) => menu.classList.remove("active"));
    this.activeMenu = null;
  }

  attachGlobalListeners() {
    document.addEventListener("click", (e) => {
      if (!this.element.contains(e.target)) {
        this.closeAllMenus();
      }
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.activeMenu) {
        this.closeAllMenus();
      }
    });
  }

  handleMenuAction(actionId, item) {
    this.eventBus.emit("menu:action", {
      action: actionId,
      item: item,
    });

    console.log("Menu action:", actionId);
  }

  destroy() {
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
  }
}
