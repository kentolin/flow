```
Shapes Structure
------------------

shapes/
  ├── registry/          # Registration system
  ├── base/              # Abstract classes
  ├── library/           # All concrete shapes
  │   ├── basic/         # Organized by category
  │   ├── flowchart/
  │   ├── network/
  │   └── uml/
  ├── presets/           # Shared configs (renamed from "common")
  └── shapeLoader.js


├── shapes/
│   ├── registry/
│   │   ├── ShapeRegistry.js
│   │   └── ShapeDefinition.js
│   │
│   ├── base/
│   │   ├── BaseShape.js           # Abstract base class
│   │   └── ShapeBuilder.js        # Fluent builder API
│   │
│   ├── library/                   # Organized shape library
│   │   ├── basic/
│   │   │   ├── rect/
│   │   │   │   ├── RectShape.js
│   │   │   │   └── config.json
│   │   │   ├── circle/
│   │   │   │   ├── CircleShape.js
│   │   │   │   └── config.json
│   │   │   └── diamond/
│   │   │       ├── DiamondShape.js
│   │   │       └── config.json
│   │   │
│   │   ├── flowchart/
│   │   │   ├── process/
│   │   │   │   ├── ProcessShape.js
│   │   │   │   └── config.json
│   │   │   ├── decision/
│   │   │   │   ├── DecisionShape.js
│   │   │   │   └── config.json
│   │   │   └── terminator/
│   │   │       ├── TerminatorShape.js
│   │   │       └── config.json
│   │   │
│   │   ├── network/
│   │   │   ├── server/
│   │   │   ├── router/
│   │   │   ├── switch/
│   │   │   └── firewall/
│   │   │
│   │   ├── uml/
│   │   │   ├── class/
│   │   │   ├── interface/
│   │   │   └── actor/
│   │   │
│   │   └── custom/                # User custom shapes
│   │
│   ├── presets/                   # Shared configurations
│   │   ├── ports.json             # Common port configs
│   │   ├── handles.json           # Common handle configs
│   │   └── styles.json            # Common styles
│   │
│   └── shapeLoader.js             # Dynamic shape loading
│
```
