// ============================================================================
// FILE: src/core/managers/ThemeManager.js
// ============================================================================
export class ThemeManager {
  constructor(eventBus) {
    this.eventBus = eventBus;
    this.currentTheme = "light";
    this.themes = {
      light: {
        background: "#ffffff",
        foreground: "#000000",
        gridColor: "#e0e0e0",
        nodeStroke: "#333333",
        nodeFill: "#ffffff",
        edgeStroke: "#666666",
        selectionStroke: "#4A90E2",
      },
      dark: {
        background: "#1e1e1e",
        foreground: "#ffffff",
        gridColor: "#333333",
        nodeStroke: "#cccccc",
        nodeFill: "#2d2d2d",
        edgeStroke: "#999999",
        selectionStroke: "#4A90E2",
      },
    };
  }

  setTheme(themeName) {
    if (!this.themes[themeName]) {
      throw new Error(`Theme ${themeName} not found`);
    }

    this.currentTheme = themeName;
    this.applyTheme(this.themes[themeName]);
    this.eventBus.emit("theme:changed", {
      theme: themeName,
      colors: this.themes[themeName],
    });
  }

  applyTheme(theme) {
    const root = document.documentElement;
    Object.entries(theme).forEach(([key, value]) => {
      root.style.setProperty(`--${key}`, value);
    });
  }

  getTheme() {
    return this.currentTheme;
  }

  getThemeColors() {
    return this.themes[this.currentTheme];
  }

  registerTheme(name, colors) {
    this.themes[name] = colors;
  }
}
