// ============================================================================
// FILE: src/shapes/library/flowchart/terminator/TerminatorShape.js
// ============================================================================
import { BaseShape } from "../../../base/BaseShape.js";

export class TerminatorShape extends BaseShape {
  constructor() {
    super({
      type: "terminator",
      defaultWidth: 120,
      defaultHeight: 60,
      defaultPorts: [
        { id: "top", side: "top", offset: 0.5 },
        { id: "bottom", side: "bottom", offset: 0.5 },
      ],
      defaultStyle: {
        fill: "#E8F5E9",
        stroke: "#388E3C",
        strokeWidth: 2,
      },
    });
  }

  createRenderer() {
    return {
      render: (model) => {
        const w = model.width;
        const h = model.height;
        const r = h / 2;

        const path = `M ${r} 0 L ${w - r} 0 A ${r} ${r} 0 0 1 ${
          w - r
        } ${h} L ${r} ${h} A ${r} ${r} 0 0 1 ${r} 0 Z`;

        const pathElement = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "path"
        );
        pathElement.setAttribute("class", "shape terminator-shape");
        pathElement.setAttribute("d", path);
        pathElement.setAttribute(
          "fill",
          model.style.fill || this.defaultStyle.fill
        );
        pathElement.setAttribute(
          "stroke",
          model.style.stroke || this.defaultStyle.stroke
        );
        pathElement.setAttribute(
          "stroke-width",
          model.style.strokeWidth || this.defaultStyle.strokeWidth
        );
        return pathElement;
      },
    };
  }
}
