/*export function initContextMenu(){
  document.addEventListener('contextmenu',e=>e.preventDefault());
}*/

export const contextMenu = {
  menuEl: null,
  init() {
    // Create menu container
    this.menuEl = document.createElement("div");
    this.menuEl.id = "contextMenu";
    this.menuEl.style.position = "absolute";
    this.menuEl.style.display = "none";
    this.menuEl.style.background = "#fff";
    this.menuEl.style.border = "1px solid #ccc";
    this.menuEl.style.boxShadow = "0 2px 6px rgba(0,0,0,0.2)";
    this.menuEl.style.zIndex = "9999";
    this.menuEl.style.padding = "4px 0";
    this.menuEl.style.fontFamily = "sans-serif";
    document.body.appendChild(this.menuEl);

    // Hide menu on click outside
    window.addEventListener("click", () => this.hide());
  },

  show(x, y, items) {
    this.menuEl.innerHTML = "";
    items.forEach(item => {
      const el = document.createElement("div");
      el.textContent = item.label;
      el.style.padding = "4px 12px";
      el.style.cursor = "pointer";
      el.addEventListener("click", () => {
        item.action();
        this.hide();
      });
      el.addEventListener("mouseenter", () => el.style.background = "#f0f0f0");
      el.addEventListener("mouseleave", () => el.style.background = "#fff");
      this.menuEl.appendChild(el);
    });

    this.menuEl.style.left = x + "px";
    this.menuEl.style.top = y + "px";
    this.menuEl.style.display = "block";
  },

  hide() {
    this.menuEl.style.display = "none";
  }
};

