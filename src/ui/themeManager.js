/**
 * themeManager.js
 * -------------------------------
 * Handles theme switching between Light / Dark modes.
 * Relies entirely on CSS classes (.light / .dark) for styles.
 * Emits "theme:changed" events and persists in localStorage.
 */

export const themeManager = (() => {
  const STORAGE_KEY = "flowchart-theme";
  const THEMES = ["light", "dark"];

  // Load saved theme or default
  let currentTheme = localStorage.getItem(STORAGE_KEY) || "light";

  /** Apply theme by toggling CSS class on <body> */
  function applyTheme(theme) {
    if (!THEMES.includes(theme)) return;
    document.body.classList.remove(...THEMES);
    document.body.classList.add(theme);
    currentTheme = theme;
    localStorage.setItem(STORAGE_KEY, theme);

    // Notify system
    document.dispatchEvent(
      new CustomEvent("theme:changed", { detail: { theme } })
    );
  }

  /** Toggle Light <-> Dark */
  function toggleTheme() {
    const next = currentTheme === "light" ? "dark" : "light";
    applyTheme(next);
  }

  /** Add a simple theme toggle button to the menubar */
  function createToggleButton() {
    const menubar = document.getElementById("menubar");
    if (!menubar) return;

    const btn = document.createElement("button");
    btn.id = "theme-toggle";
    btn.textContent = "🌓 Theme";
    Object.assign(btn.style, {
      marginLeft: "auto",
      background: "transparent",
      border: "none",
      color: "var(--text-subtle)",
      cursor: "pointer",
      fontSize: "13px",
      fontFamily: "inherit",
    });
    btn.addEventListener("click", toggleTheme);
    menubar.appendChild(btn);
  }

  function init() {
    applyTheme(currentTheme);
    createToggleButton();
  }

  document.addEventListener("DOMContentLoaded", init);

  return { apply: applyTheme, toggle: toggleTheme, current: () => currentTheme };
})();
