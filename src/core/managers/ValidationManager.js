// ============================================================================
// FILE: src/core/managers/ValidationManager.js
// ============================================================================
export class ValidationManager {
  constructor() {
    this.rules = new Map();
  }

  addRule(name, validator) {
    this.rules.set(name, validator);
  }

  validateConnection(sourceNode, targetNode, sourcePort, targetPort) {
    const errors = [];

    // Prevent self-connection
    if (sourceNode.id === targetNode.id) {
      errors.push("Cannot connect node to itself");
    }

    // Check port compatibility
    if (sourcePort && targetPort) {
      if (
        sourcePort.type &&
        targetPort.type &&
        sourcePort.type !== targetPort.type
      ) {
        errors.push("Port types are incompatible");
      }
    }

    // Run custom rules
    for (const [name, validator] of this.rules) {
      const result = validator(sourceNode, targetNode, sourcePort, targetPort);
      if (result !== true) {
        errors.push(result);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  validateNode(node) {
    const errors = [];

    if (!node.type) {
      errors.push("Node must have a type");
    }

    if (node.width <= 0 || node.height <= 0) {
      errors.push("Node dimensions must be positive");
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
