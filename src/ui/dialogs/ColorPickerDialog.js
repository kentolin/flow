// ============================================================================
// FILE: src/ui/dialogs/ColorPickerDialog.js
// ============================================================================
export class ColorPickerDialog {
  constructor(eventBus) {
    this.eventBus = eventBus;
    this.element = null;
    this.isOpen = false;
    this.currentColor = "#ffffff";
    this.callback = null;
  }

  render() {
    this.element = document.createElement("div");
    this.element.className = "dialog-overlay";
    this.element.style.display = "none";

    const dialog = document.createElement("div");
    dialog.className = "dialog color-picker-dialog";

    const header = document.createElement("div");
    header.className = "dialog-header";

    const title = document.createElement("h3");
    title.textContent = "Choose Color";

    const closeBtn = document.createElement("button");
    closeBtn.className = "dialog-close";
    closeBtn.textContent = "✕";
    closeBtn.addEventListener("click", () => this.close());

    header.appendChild(title);
    header.appendChild(closeBtn);
    dialog.appendChild(header);

    const body = document.createElement("div");
    body.className = "dialog-body";

    // Color presets
    const presets = document.createElement("div");
    presets.className = "color-presets";

    const presetColors = [
      "#ffffff",
      "#f0f0f0",
      "#d0d0d0",
      "#a0a0a0",
      "#606060",
      "#000000",
      "#ff0000",
      "#ff8800",
      "#ffff00",
      "#00ff00",
      "#00ffff",
      "#0000ff",
      "#ff00ff",
      "#E3F2FD",
      "#E8F5E9",
      "#FFF3E0",
      "#FFEBEE",
      "#F3E5F5",
    ];

    presetColors.forEach((color) => {
      const preset = document.createElement("div");
      preset.className = "color-preset";
      preset.style.backgroundColor = color;
      preset.addEventListener("click", () => this.selectColor(color));
      presets.appendChild(preset);
    });

    body.appendChild(presets);

    // Color input
    const inputGroup = document.createElement("div");
    inputGroup.className = "color-input-group";

    const colorInput = document.createElement("input");
    colorInput.type = "color";
    colorInput.className = "color-input";
    colorInput.value = this.currentColor;
    colorInput.addEventListener(
      "input",
      (e) => (this.currentColor = e.target.value)
    );

    const hexInput = document.createElement("input");
    hexInput.type = "text";
    hexInput.className = "hex-input";
    hexInput.value = this.currentColor;
    hexInput.placeholder = "#ffffff";
    hexInput.addEventListener("input", (e) => {
      this.currentColor = e.target.value;
      colorInput.value = e.target.value;
    });

    colorInput.addEventListener("input", (e) => {
      hexInput.value = e.target.value;
    });

    inputGroup.appendChild(colorInput);
    inputGroup.appendChild(hexInput);
    body.appendChild(inputGroup);

    dialog.appendChild(body);

    // Footer
    const footer = document.createElement("div");
    footer.className = "dialog-footer";

    const cancelBtn = document.createElement("button");
    cancelBtn.className = "dialog-button dialog-button-secondary";
    cancelBtn.textContent = "Cancel";
    cancelBtn.addEventListener("click", () => this.close());

    const okBtn = document.createElement("button");
    okBtn.className = "dialog-button dialog-button-primary";
    okBtn.textContent = "OK";
    okBtn.addEventListener("click", () => this.confirm());

    footer.appendChild(cancelBtn);
    footer.appendChild(okBtn);
    dialog.appendChild(footer);

    this.element.appendChild(dialog);
    document.body.appendChild(this.element);

    return this.element;
  }

  open(color = "#ffffff", callback) {
    if (!this.element) this.render();

    this.currentColor = color;
    this.callback = callback;
    this.element.style.display = "flex";
    this.isOpen = true;

    const colorInput = this.element.querySelector(".color-input");
    const hexInput = this.element.querySelector(".hex-input");
    if (colorInput) colorInput.value = color;
    if (hexInput) hexInput.value = color;
  }

  close() {
    this.element.style.display = "none";
    this.isOpen = false;
  }

  confirm() {
    if (this.callback) {
      this.callback(this.currentColor);
    }
    this.close();
  }

  selectColor(color) {
    this.currentColor = color;
    const colorInput = this.element.querySelector(".color-input");
    const hexInput = this.element.querySelector(".hex-input");
    if (colorInput) colorInput.value = color;
    if (hexInput) hexInput.value = color;
  }
}
