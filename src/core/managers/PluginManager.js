// ============================================================================
// FILE: src/core/managers/PluginManager.js
// ============================================================================
export class PluginManager {
  constructor(container) {
    this.container = container;
    this.plugins = new Map();
  }

  register(name, plugin) {
    if (this.plugins.has(name)) {
      throw new Error(`Plugin ${name} already registered`);
    }

    this.plugins.set(name, plugin);

    if (typeof plugin.install === "function") {
      plugin.install(this.container);
    }
  }

  unregister(name) {
    const plugin = this.plugins.get(name);
    if (!plugin) return;

    if (typeof plugin.uninstall === "function") {
      plugin.uninstall(this.container);
    }

    this.plugins.delete(name);
  }

  getPlugin(name) {
    return this.plugins.get(name);
  }

  hasPlugin(name) {
    return this.plugins.has(name);
  }
}
