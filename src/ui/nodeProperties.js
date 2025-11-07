export const nodeProperties = [
  {
    name: "General",
    properties: [{ id: "label", label: "Label", type: "text", bind: "label" }],
  },

  {
    name: "Geometry",
    properties: [
      { id: "x", label: "X Position", type: "number", bind: "x" },
      { id: "y", label: "Y Position", type: "number", bind: "y" },
      { id: "width", label: "Width", type: "number", bind: "width" },
      { id: "height", label: "Height", type: "number", bind: "height" },
    ],
  },

  {
    name: "Style",
    properties: [
      { id: "fill", label: "Fill Color", type: "color", bind: "color" },
      { id: "stroke", label: "Stroke Color", type: "color", bind: "stroke" },
      {
        id: "radius",
        label: "Corner Radius",
        type: "range",
        min: 0,
        max: 20,
        step: 1,
        bind: "radius",
      },
    ],
  },
];
