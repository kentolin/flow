// src/ui/toolbar.js
import { nodeManager } from "../core/nodeManager.js";
import { history } from "../core/history.js";
import { createIconButton } from "./iconManager.js";

export function initToolbar() {
  const toolbar = document.getElementById("toolbar");
  toolbar.appendChild(
    createIconButton("new-file", "New File", () => console.log("New File"))
  );
  toolbar.appendChild(
    createIconButton("copy", "Copy", () => console.log("Copy"))
  );
  toolbar.appendChild(
    createIconButton("paste", "Paste", () => console.log("Paste"))
  );
  toolbar.appendChild(
    createIconButton("zoom-in", "Zoom In", () => console.log("Zoom In"))
  );
  toolbar.appendChild(
    createIconButton("zoom-out", "Zoom Out", () => console.log("Zoom Out"))
  );
  toolbar.appendChild(createIconButton("undo", "Undo", () => history.undo()));
  toolbar.appendChild(createIconButton("redo", "Redo", () => history.redo()));
  toolbar.appendChild(
    createIconButton("delete", "Delete Selected", () =>
      nodeManager.deleteNode()
    )
  ).dataset.type = "delete";
}
