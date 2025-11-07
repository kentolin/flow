/**
 * menuManager.js
 * ------------------------------------
 * Dynamically builds multi-level menus.
 */

export function initMenuBar() {
  const menubar = document.getElementById("menubar");
  if (!menubar) return;

  // === Define Menu Hierarchy ===
  const menus = [
    {
      label: "File",
      items: [
        { label: "New", action: () => console.log("New File") },
        { label: "Open", action: () => console.log("Open File") },
        {
          label: "Export",
          submenu: [
            {
              label: "Export as JSON",
              action: () => console.log("Export JSON"),
            },
            {
              label: "Export as Image",
              action: () => console.log("Export Image"),
            },
          ],
        },
        "separator",
        { label: "Exit", action: () => console.log("Exit App") },
      ],
    },
    {
      label: "Edit",
      items: [
        { label: "Undo", action: () => console.log("Undo") },
        { label: "Redo", action: () => console.log("Redo") },
        "separator",
        {
          label: "Preferences",
          submenu: [
            {
              label: "Theme",
              submenu: [
                { label: "Light", action: () => console.log("Light Theme") },
                { label: "Dark", action: () => console.log("Dark Theme") },
              ],
            },
          ],
        },
      ],
    },
    {
      label: "View",
      items: [
        { label: "Zoom In", action: () => console.log("Zoom In") },
        { label: "Zoom Out", action: () => console.log("Zoom Out") },
        {
          label: "MiniMap",
          action: () => {
            document.dispatchEvent(new Event("ui:toggleMiniMap"));
          },
        },
        {
          label: "Action Log",
          action: () => {
            document.dispatchEvent(new Event("ui:toggleActionLog"));
          },
        },
      ],
    },
    {
      label: "Help",
      items: [{ label: "About", action: () => alert("Flowchart Editor v1.0") }],
    },
  ];

  // === Build Menu Structure ===
  menubar.innerHTML = "";
  menus.forEach((menu) => {
    const item = document.createElement("div");
    item.className = "menu-item";
    item.textContent = menu.label;

    const dropdown = buildDropdown(menu.items);
    item.appendChild(dropdown);

    item.addEventListener("mouseenter", () => {
      closeAllMenus();
      item.classList.add("open");
    });
    item.addEventListener("mouseleave", () => {
      item.classList.remove("open");
    });

    menubar.appendChild(item);
  });

  document.addEventListener("click", closeAllMenus);
}

/* Auto-adjust submenu position if near right edge */

function adjustSubmenuPosition(submenu) {
  const rect = submenu.getBoundingClientRect();
  const vw = window.innerWidth;

  if (rect.right > vw - 10) {
    submenu.style.left = "auto";
    submenu.style.right = "100%";
  }
}
/* Recursive builder for dropdowns and submenus */

function buildDropdown(items = []) {
  const container = document.createElement("div");
  container.className = "menu-dropdown";

  items.forEach((it) => {
    if (it === "separator") {
      const sep = document.createElement("div");
      sep.className = "menu-separator";
      container.appendChild(sep);
      return;
    }

    const el = document.createElement("div");
    el.textContent = it.label;

    if (it.submenu) {
      el.classList.add("submenu");
      const sub = buildDropdown(it.submenu);
      sub.classList.add("submenu-dropdown");
      el.appendChild(sub);

      el.addEventListener("mouseenter", () => adjustSubmenuPosition(sub));
    } else if (it.action) {
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        closeAllMenus();
        it.action();
      });
    }

    container.appendChild(el);
  });

  return container;
}

/* Closes all open menus */
function closeAllMenus() {
  document
    .querySelectorAll(".menu-item.open")
    .forEach((el) => el.classList.remove("open"));
}

document.addEventListener("ui:toggleMiniMap", () => {
  const p = document.getElementById("minimap-panel");
  p.style.display = p.style.display === "none" ? "block" : "none";
});

document.addEventListener("ui:toggleActionLog", () => {
  const p = document.getElementById("log-panel");
  p.style.display = p.style.display === "none" ? "block" : "none";
});
