// ============================================================================
// FILE: src/core/container/ServiceContainer.js
// ============================================================================
export class ServiceContainer {
  constructor() {
    this.services = new Map();
    this.singletons = new Map();
    this.factories = new Map();
  }

  register(name, factory, singleton = true) {
    this.factories.set(name, factory);
    if (singleton) {
      this.singletons.set(name, null);
    }
    return this;
  }

  get(name) {
    if (this.singletons.has(name)) {
      if (!this.singletons.get(name)) {
        const factory = this.factories.get(name);
        if (!factory) throw new Error(`Service ${name} not registered`);
        this.singletons.set(name, factory(this));
      }
      return this.singletons.get(name);
    }

    const factory = this.factories.get(name);
    if (!factory) throw new Error(`Service ${name} not registered`);
    return factory(this);
  }

  has(name) {
    return this.factories.has(name);
  }

  clear() {
    this.services.clear();
    this.singletons.clear();
    this.factories.clear();
  }
}
