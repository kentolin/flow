```
Core Structure
---------------

core/
  ├── models/           # Data
  ├── views/            # Rendering
  ├── controllers/      # User interaction
  ├── managers/         # Business logic
  ├── state/            # Global editor state
  ├── events/           # Event bus
  ├── container/        # DI Container
  ├── Utilities/        # Helpers
  ├── Serializer/       # IO
  ├── Editor.js/        # Central orchestrator
  └── ...


├── core/
│   ├── container/
│   │   ├── ServiceContainer.js
│   │   ├── ServiceProvider.js
│   │   └── index.js
│   │
│   ├── events/
│   │   └── EventBus.js
│   │
│   ├── state/
│   │   └── EditorState.js
│   │
│   ├── managers/
│   │   ├── ClipboardManager.js
│   │   ├── EdgeManager.js
│   │   ├── ExportManager.js
│   │   ├── HistoryManager.js
│   │   ├── NodeManager.js
│   │   ├── PluginManager.js
│   │   ├── SelectionManager.js
│   │   ├── SnapManager.js
│   │   ├── StateManager.js
│   │   ├── ThemeManager.js
│   │   └── ValidationManager.js
│   │
│   ├── models/
│   │   ├── NodeModel.js
│   │   └── EdgeModel.js
│   │
│   ├── views/
│   │   ├── NodeView.js
│   │   ├── EdgeView.js
│   │   ├── PortView.js
│   │   └── HandleView.js
│   │
│   ├── controllers/
│   │   ├── NodeController.js
│   │   ├── EdgeController.js
│   │   ├── DragController.js
│   │   ├── ResizeController.js
│   │   └── PortController.js
│   │
│   ├── Editor.js                  # Main editor class
│   ├── Geometry.js                # Geometry utilities
│   ├── Serializer.js              # Import/export logic
│   └── Utils.js                   # General utilities
│
```
