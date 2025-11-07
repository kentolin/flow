/**
 * IconManager.js
 * -------------------------
 * Utility for creating SVG icons from the shared sprite sheet.
 * Example:
 *   import { createIcon } from './IconManager.js';
 *   const btn = createIcon('undo', 20);
 */
const ICON_PATH = "assets/icons/icons.svg?v=" + Date.now();

export function createIcon(name, size = 20, title = "") {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.classList.add("icon");
  svg.setAttribute("width", size);
  svg.setAttribute("height", size);
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("aria-hidden", "true");

  if (title) {
    const titleEl = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "title"
    );
    titleEl.textContent = title;
    svg.appendChild(titleEl);
  }

  const use = document.createElementNS("http://www.w3.org/2000/svg", "use");
  use.setAttributeNS(
    "http://www.w3.org/1999/xlink",
    "xlink:href",
    `${ICON_PATH}#${name}`
  );
  svg.appendChild(use);

  return svg;
}

/**
 * Helper for creating a toolbar button with an icon
 */
export function createIconButton(iconName, tooltip, onClick) {
  const btn = document.createElement("button");
  btn.classList.add("toolbar-btn");
  btn.title = tooltip;

  const icon = createIcon(iconName, 18, tooltip);
  btn.appendChild(icon);

  if (onClick) btn.addEventListener("click", onClick);

  return btn;
}
