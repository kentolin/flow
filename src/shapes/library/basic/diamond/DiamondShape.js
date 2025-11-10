// ============================================================================
// FILE: src/shapes/library/basic/diamond/DiamondShape.js
// ============================================================================
import { BaseShape } from "../../../base/BaseShape.js";

export class DiamondShape extends BaseShape {
  constructor() {
    super({
      type: "diamond",
      defaultWidth: 100,
      defaultHeight: 100,
      defaultPorts: [
        { id: "top", side: "top", offset: 0.5 },
        { id: "right", side: "right", offset: 0.5 },
        { id: "bottom", side: "bottom", offset: 0.5 },
        { id: "left", side: "left", offset: 0.5 },
      ],
      defaultStyle: {
        fill: "#ffffff",
        stroke: "#333333",
        strokeWidth: 2,
      },
    });
  }

  createRenderer() {
    return {
      render: (model) => {
        const w = model.width;
        const h = model.height;
        const points = `${w / 2},0 ${w},${h / 2} ${w / 2},${h} 0,${h / 2}`;

        const polygon = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "polygon"
        );
        polygon.setAttribute("class", "shape diamond-shape");
        polygon.setAttribute("points", points);
        polygon.setAttribute(
          "fill",
          model.style.fill || this.defaultStyle.fill
        );
        polygon.setAttribute(
          "stroke",
          model.style.stroke || this.defaultStyle.stroke
        );
        polygon.setAttribute(
          "stroke-width",
          model.style.strokeWidth || this.defaultStyle.strokeWidth
        );
        return polygon;
      },
    };
  }
}
