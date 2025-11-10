// ============================================================================
// FILE: src/ui/overlays/Tooltip.js
// ============================================================================
export class Tooltip {
  constructor() {
    this.element = null;
    this.timeout = null;
  }

  render() {
    this.element = document.createElement("div");
    this.element.className = "tooltip";
    this.element.style.display = "none";
    document.body.appendChild(this.element);
    return this.element;
  }

  show(text, x, y, delay = 500) {
    if (!this.element) this.render();

    clearTimeout(this.timeout);

    this.timeout = setTimeout(() => {
      this.element.textContent = text;
      this.element.style.display = "block";
      this.element.style.left = x + "px";
      this.element.style.top = y + 20 + "px";

      // Adjust if tooltip goes off screen
      const rect = this.element.getBoundingClientRect();
      if (rect.right > window.innerWidth) {
        this.element.style.left = window.innerWidth - rect.width - 10 + "px";
      }
      if (rect.bottom > window.innerHeight) {
        this.element.style.top = y - rect.height - 10 + "px";
      }
    }, delay);
  }

  hide() {
    clearTimeout(this.timeout);
    if (this.element) {
      this.element.style.display = "none";
    }
  }
}
