// ============================================================================
// FILE: src/shapes/library/flowchart/process/ProcessShape.js
// ============================================================================
import { RectShape } from "../../basic/rect/RectShape.js";

export class ProcessShape extends RectShape {
  constructor() {
    super();
    this.type = "process";
    this.defaultWidth = 120;
    this.defaultHeight = 60;
    this.defaultStyle = {
      fill: "#E3F2FD",
      stroke: "#1976D2",
      strokeWidth: 2,
      rx: 4,
    };
  }
}
