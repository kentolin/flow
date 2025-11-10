// ============================================================================
// FILE: src/shapes/library/flowchart/decision/DecisionShape.js
// ============================================================================
import { DiamondShape } from "../../basic/diamond/DiamondShape.js";

export class DecisionShape extends DiamondShape {
  constructor() {
    super();
    this.type = "decision";
    this.defaultWidth = 120;
    this.defaultHeight = 80;
    this.defaultStyle = {
      fill: "#FFF3E0",
      stroke: "#F57C00",
      strokeWidth: 2,
    };
  }
}
