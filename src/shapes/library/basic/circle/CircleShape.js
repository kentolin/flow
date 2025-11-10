// ============================================================================
// FILE: src/shapes/library/basic/circle/CircleShape.js
// ============================================================================
import { BaseShape } from "../../../base/BaseShape.js";

export class CircleShape extends BaseShape {
  constructor() {
    super({
      type: "circle",
      defaultWidth: 80,
      defaultHeight: 80,
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
        const circle = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "ellipse"
        );
        circle.setAttribute("class", "shape circle-shape");
        circle.setAttribute("cx", model.width / 2);
        circle.setAttribute("cy", model.height / 2);
        circle.setAttribute("rx", model.width / 2);
        circle.setAttribute("ry", model.height / 2);
        circle.setAttribute("fill", model.style.fill || this.defaultStyle.fill);
        circle.setAttribute(
          "stroke",
          model.style.stroke || this.defaultStyle.stroke
        );
        circle.setAttribute(
          "stroke-width",
          model.style.strokeWidth || this.defaultStyle.strokeWidth
        );
        return circle;
      },
    };
  }
}
