// ============================================================================
// FILE: src/shapes/library/basic/rect/RectShape.js
// ============================================================================
import { BaseShape } from "../../../base/BaseShape.js";

export class RectShape extends BaseShape {
  constructor() {
    super({
      type: "rect",
      defaultWidth: 120,
      defaultHeight: 60,
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
        rx: 4,
      },
    });
  }

  createRenderer() {
    return {
      render: (model) => {
        const rect = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "rect"
        );
        rect.setAttribute("class", "shape rect-shape");
        rect.setAttribute("width", model.width);
        rect.setAttribute("height", model.height);
        rect.setAttribute("fill", model.style.fill || this.defaultStyle.fill);
        rect.setAttribute(
          "stroke",
          model.style.stroke || this.defaultStyle.stroke
        );
        rect.setAttribute(
          "stroke-width",
          model.style.strokeWidth || this.defaultStyle.strokeWidth
        );
        rect.setAttribute("rx", model.style.rx || this.defaultStyle.rx);
        return rect;
      },
    };
  }
}
