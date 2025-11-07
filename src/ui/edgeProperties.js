export const edgeProperties = [
  {
    name: "General",
    properties: [{ id: "label", label: "Label", type: "text", bind: "label" }],
  },

  {
    name: "Style",
    properties: [
      { id: "stroke", label: "Line Color", type: "color", bind: "color" },
      {
        id: "width",
        label: "Line Width",
        type: "range",
        min: 1,
        max: 8,
        step: 1,
        bind: "strokeWidth",
      },
      {
        id: "dash",
        label: "Dash",
        type: "select",
        options: [
          { value: "", label: "Solid" },
          { value: "4,4", label: "Dashed" },
          { value: "2,2", label: "Dotted" },
        ],
        bind: "dash",
      },
    ],
  },
];
