/**
 * headerManager.js
 * -------------------------
 * Controls editable filename and updates tab title.
 */

export function initHeader() {
  const fileNameEl = document.getElementById("file-name");
  if (!fileNameEl) return;

  // Load previous name from localStorage
  const savedName =
    localStorage.getItem("flowchart-filename") || "Untitled Diagram";
  fileNameEl.textContent = savedName;
  document.title = `Flowchart Editor – ${savedName}`;

  // Double-click to edit
  fileNameEl.addEventListener("dblclick", () => {
    fileNameEl.contentEditable = "true";
    fileNameEl.classList.add("editing");
    fileNameEl.focus();
    selectAllText(fileNameEl);
  });

  // Save on blur or Enter
  fileNameEl.addEventListener("blur", () => finalizeRename(fileNameEl));
  fileNameEl.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      fileNameEl.blur();
    } else if (e.key === "Escape") {
      cancelRename(fileNameEl);
    }
  });
}

function finalizeRename(el) {
  const newName = el.textContent.trim() || "Untitled Diagram";
  el.textContent = newName;
  el.contentEditable = "false";
  el.classList.remove("editing");
  document.title = `Flowchart Editor – ${newName}`;
  localStorage.setItem("flowchart-filename", newName);
}

function cancelRename(el) {
  const stored =
    localStorage.getItem("flowchart-filename") || "Untitled Diagram";
  el.textContent = stored;
  el.contentEditable = "false";
  el.classList.remove("editing");
}

function selectAllText(el) {
  const range = document.createRange();
  range.selectNodeContents(el);
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
}
