## What is a "Service Container"?

A service container (also called a "dependency injection container") is a design pattern that manages the creation and lifecycle of objects your application needs. Instead of creating objects scattered throughout your code, you register them in one central place and request them when needed.
The term "service" here refers to any reusable component or object your application depends on—like a database connection, logger, authentication handler, API client, etc. It's just a generic term for "something your app needs."

## Three Maps

factories — Stores the functions that create services. When you call register('database', (container) => new Database()), the factory function is saved here.
singletons — Caches instances for services marked as singletons. If a service is registered with singleton = true, the first time you call get(), it creates the instance and caches it here. Subsequent calls return the same cached instance.
services — Appears to be unused in this code (it's cleared but never populated). This might be leftover from an earlier version or intended for future use.

## Are Singletons and Factories Not Services?

They are services, but they're stored differently based on how they're created:

Factories store the blueprint (the creation function)
Singletons store the actual instance (after it's been created once)

Think of it like this: the factory is the recipe, and the singleton is the cooked meal. You only cook it once and reuse it, rather than cooking a new meal every time someone asks for food.

## In Practice

```
const container = new ServiceContainer();

// Register a singleton (creates once, reuses forever)
container.register('logger', (c) => new Logger(), true);

// Register a factory (creates new instance every time)
container.register('request', (c) => new Request(), false);

const logger1 = container.get('logger');
const logger2 = container.get('logger');
console.log(logger1 === logger2); // true — same instance

const req1 = container.get('request');
const req2 = container.get('request');
console.log(req1 === req2); // false — different instances

The container lets you avoid "service sprawl" across your codebase and makes testing easier since you can swap out services with mocks.
```

## What ServiceProvider Does

ServiceProvider is a configuration module. It's responsible for wiring up all the dependencies and telling the container how to create each service. Notice the dependency chains:

```
container.register(
  "editorState",
  (c) => new EditorState(c.get("eventBus"))  // ← depends on eventBus
);

container.register(
  "stateManager",
  (c) => new StateManager(c.get("editorState"))  // ← depends on editorState
);

When you request a service, the container automatically resolves its dependencies:

const stateManager = container.get("stateManager");
// Behind the scenes:
// 1. Creates eventBus
// 2. Uses eventBus to create editorState
// 3. Uses editorState to create stateManager
// 4. Returns stateManager
```

## Why This Design?

This separation is clever because:

ServiceContainer = generic tool for managing services
ServiceProvider = specific configuration for your app

You can reuse ServiceContainer in any project, but ServiceProvider is custom to this editor application. If you needed to test or use the app differently, you could create an alternate provider without changing the container logic.

## Registration Order: Doesn't matter

Registration order doesnot matter during register or calling get. But, only matter is calling get but its dependent service was never registered before calling get.

```
const container = new ServiceContainer();

// Order A
container.register("stateManager", (c) => new StateManager(c.get("editorState")));
container.register("editorState", (c) => new EditorState(c.get("eventBus")));
container.register("eventBus", () => new EventBus());

// Order B (reverse)
container.register("eventBus", () => new EventBus());
container.register("editorState", (c) => new EditorState(c.get("eventBus")));
container.register("stateManager", (c) => new StateManager(c.get("editorState")));

// Both work identically ✅
```

## Call get() order: Doesnot matter

```
// Order A: Get in dependency order
const eventBus = container.get("eventBus");
const editorState = container.get("editorState");
const stateManager = container.get("stateManager");

// Order B: Get deepest dependency first
const stateManager = container.get("stateManager");  // Auto-resolves everything
const editorState = container.get("editorState");
const eventBus = container.get("eventBus");

// Both work identically ✅
```

## What does matter: Service must be registered

```
const container = new ServiceContainer();

// Forgot to register "eventBus"!
container.register("editorState", (c) => new EditorState(c.get("eventBus")));
container.register("stateManager", (c) => new StateManager(c.get("editorState")));

// Now when you call get()
const stateManager = container.get("stateManager");
// ❌ Error: Service eventBus not registered
```

## What FlowchartApp does steps in order

```
// Step 1
this.createDOMStructure();

// Step 2
ServiceProvider.register(this.container);  // ← All services registered here

// Step 3-7
this.eventBus = this.container.get("eventBus");
this.setupUI();
this.editor = this.container.get("editor");
this.setupEventHandlers();
```

The reason for this order isn't about service registration—it's about side effects and UI logic:

DOM must exist before UI renders
Shapes must be loaded before UI displays them
Services must be registered before calling get()
Event handlers must be last because they use everything above

But within the "registration and get()" part, you could shuffle it around and it would still work, as long as all services are registered before any get() call.
Perfect summary: The only hard rule is "register all services before calling get() on any of them." Everything else is flexibility and best practices for code organization.

## ServiceProvider Registration

ServiceProvider.register() is a static method that serves as a setup/configuration function. Let me explain why it exists:
Purpose of ServiceProvider.register()
It's a centralized place to configure all your services in one spot. Instead of scattering service registrations everywhere:

```
// ❌ BAD - scattered registrations
const container = new ServiceContainer();
container.register("eventBus", () => new EventBus());
container.register("editorState", (c) => new EditorState(c.get("eventBus")));
container.register("stateManager", (c) => new StateManager(c.get("editorState")));
// ... 20 more registrations in different files

// ✅ GOOD - centralized
const container = new ServiceContainer();
ServiceProvider.register(container);  // All services registered here
```

It's static because:

You don't need an instance of ServiceProvider to use it
It's a pure configuration function, not tied to any state
You call it once at startup: ServiceProvider.register(container)

## So in a DI container: Pattern (Registry, Factory, Singleton)

Registry tells you what to create (the mappings)
Factory tells you how to create it (the creation logic)
Singleton tells you when/how often to create it (once and cache it)

They work together—the registry looks up the factory, the factory creates the object, and the singleton pattern decides whether to cache it.
