// ============================================================================
// FILE: src/ui/overlays/ContextMenu.js
// ============================================================================
export class ContextMenu {
  constructor(eventBus) {
    this.eventBus = eventBus;
    this.element = null;
    this.isOpen = false;
  }

  render() {
    this.element = document.createElement("div");
    this.element.className = "context-menu";
    this.element.style.display = "none";
    document.body.appendChild(this.element);

    this.attachGlobalListeners();
    return this.element;
  }

  open(x, y, items, context = {}) {
    if (!this.element) this.render();

    this.element.innerHTML = "";
    this.element.style.display = "block";
    this.element.style.left = x + "px";
    this.element.style.top = y + "px";
    this.isOpen = true;
    this.context = context;

    items.forEach((item) => {
      if (item.type === "separator") {
        const separator = document.createElement("div");
        separator.className = "context-menu-separator";
        this.element.appendChild(separator);
      } else {
        const menuItem = this.createMenuItem(item);
        this.element.appendChild(menuItem);
      }
    });

    // Adjust position if menu goes off screen
    const rect = this.element.getBoundingClientRect();
    if (rect.right > window.innerWidth) {
      this.element.style.left = window.innerWidth - rect.width - 10 + "px";
    }
    if (rect.bottom > window.innerHeight) {
      this.element.style.top = window.innerHeight - rect.height - 10 + "px";
    }
  }

  createMenuItem(item) {
    const menuItem = document.createElement("div");
    menuItem.className = "context-menu-item";

    if (item.icon) {
      const icon = document.createElement("span");
      icon.className = "context-menu-icon";
      icon.textContent = item.icon;
      menuItem.appendChild(icon);
    }

    const label = document.createElement("span");
    label.className = "context-menu-label";
    label.textContent = item.label;
    menuItem.appendChild(label);

    if (item.shortcut) {
      const shortcut = document.createElement("span");
      shortcut.className = "context-menu-shortcut";
      shortcut.textContent = item.shortcut;
      menuItem.appendChild(shortcut);
    }

    if (item.disabled) {
      menuItem.classList.add("disabled");
    } else {
      menuItem.addEventListener("click", () => {
        if (item.action) {
          item.action(this.context);
        }
        this.close();
      });
    }

    return menuItem;
  }

  close() {
    if (this.element) {
      this.element.style.display = "none";
      this.isOpen = false;
    }
  }

  attachGlobalListeners() {
    document.addEventListener("click", (e) => {
      if (this.isOpen && !this.element.contains(e.target)) {
        this.close();
      }
    });

    document.addEventListener("contextmenu", (e) => {
      if (this.isOpen) {
        this.close();
      }
    });
  }
}
