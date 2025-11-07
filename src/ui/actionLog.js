// src/ui/actionLog.js

/**
 * Action Log Panel
 * ------------------------------
 * Captures all toast messages and stores them in a scrollable panel.
 * Hidden by default — toggled via MenuBar → View → Action Log.
 */

export function initActionLogPanel() {
  const editor = document.getElementById("editor-main");

  // ===============================
  // ✅ Create Log Panel
  // ===============================
  const panel = document.createElement("div");
  panel.id = "log-panel";
  panel.className = "editor-popup-panel";
  panel.style.display = "none";

  panel.innerHTML = `
    <div class="panel-title">Action Log</div>
    <div id="log-list" class="log-scroll"></div>
  `;

  editor.appendChild(panel);

  const list = panel.querySelector("#log-list");

  // ===============================
  // ✅ Listen to toast events
  // ===============================
  window.addEventListener("toast:shown", (e) => {
    const { message, type } = e.detail;
    const time = new Date().toLocaleTimeString([], {
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

    const item = document.createElement("div");
    item.className = "log-entry";
    item.innerHTML = `
      <span style="color:${color};margin-right:6px">●</span>
      <b>${time}</b> — ${message}
    `;

    list.appendChild(item);

    while (list.children.length > 80) {
      list.removeChild(list.firstChild);
    }
  });

  return panel;
}
