// ============================================================================
// FILE: src/ui/dialogs/ExportDialog.js
// ============================================================================
export class ExportDialog {
  constructor(eventBus, exportManager) {
    this.eventBus = eventBus;
    this.exportManager = exportManager;
    this.element = null;
    this.isOpen = false;
    this.selectedFormat = "json";
    this.options = {
      filename: "flowchart",
      format: "json",
      includeTimestamp: true,
      quality: 1.0,
      scale: 1.0,
      background: "transparent",
    };
  }

  render() {
    this.element = document.createElement("div");
    this.element.className = "dialog-overlay";
    this.element.style.display = "none";

    const dialog = document.createElement("div");
    dialog.className = "dialog export-dialog";

    // Header
    const header = document.createElement("div");
    header.className = "dialog-header";

    const title = document.createElement("h3");
    title.textContent = "Export Diagram";

    const closeBtn = document.createElement("button");
    closeBtn.className = "dialog-close";
    closeBtn.textContent = "✕";
    closeBtn.addEventListener("click", () => this.close());

    header.appendChild(title);
    header.appendChild(closeBtn);
    dialog.appendChild(header);

    // Body
    const body = document.createElement("div");
    body.className = "dialog-body";

    // Format selection
    const formatSection = this.createFormatSection();
    body.appendChild(formatSection);

    // Options section
    const optionsSection = this.createOptionsSection();
    body.appendChild(optionsSection);

    // Preview section
    const previewSection = this.createPreviewSection();
    body.appendChild(previewSection);

    dialog.appendChild(body);

    // Footer
    const footer = document.createElement("div");
    footer.className = "dialog-footer";

    const cancelBtn = document.createElement("button");
    cancelBtn.className = "dialog-button dialog-button-secondary";
    cancelBtn.textContent = "Cancel";
    cancelBtn.addEventListener("click", () => this.close());

    const exportBtn = document.createElement("button");
    exportBtn.className = "dialog-button dialog-button-primary";
    exportBtn.textContent = "Export";
    exportBtn.addEventListener("click", () => this.handleExport());

    footer.appendChild(cancelBtn);
    footer.appendChild(exportBtn);
    dialog.appendChild(footer);

    this.element.appendChild(dialog);
    document.body.appendChild(this.element);

    return this.element;
  }

  createFormatSection() {
    const section = document.createElement("div");
    section.className = "export-section";

    const label = document.createElement("label");
    label.className = "export-label";
    label.textContent = "Export Format";
    section.appendChild(label);

    const formats = [
      {
        id: "json",
        name: "JSON",
        description: "Export as JSON file for later import",
        icon: "{ }",
      },
      {
        id: "svg",
        name: "SVG",
        description: "Scalable vector graphics for web and print",
        icon: "⬢",
      },
      {
        id: "png",
        name: "PNG",
        description: "Raster image with transparency support",
        icon: "🖼️",
      },
      {
        id: "pdf",
        name: "PDF",
        description: "Portable document format",
        icon: "📄",
      },
    ];

    const formatGrid = document.createElement("div");
    formatGrid.className = "format-grid";

    formats.forEach((format) => {
      const formatCard = this.createFormatCard(format);
      formatGrid.appendChild(formatCard);
    });

    section.appendChild(formatGrid);
    return section;
  }

  createFormatCard(format) {
    const card = document.createElement("div");
    card.className = "format-card";
    card.dataset.format = format.id;

    if (format.id === this.selectedFormat) {
      card.classList.add("selected");
    }

    const icon = document.createElement("div");
    icon.className = "format-icon";
    icon.textContent = format.icon;
    card.appendChild(icon);

    const name = document.createElement("div");
    name.className = "format-name";
    name.textContent = format.name;
    card.appendChild(name);

    const description = document.createElement("div");
    description.className = "format-description";
    description.textContent = format.description;
    card.appendChild(description);

    card.addEventListener("click", () => {
      this.selectFormat(format.id);
    });

    return card;
  }

  createOptionsSection() {
    const section = document.createElement("div");
    section.className = "export-section";

    const label = document.createElement("label");
    label.className = "export-label";
    label.textContent = "Export Options";
    section.appendChild(label);

    const optionsContainer = document.createElement("div");
    optionsContainer.className = "export-options";
    optionsContainer.id = "export-options-container";

    // Default options
    this.renderOptions(optionsContainer, this.selectedFormat);

    section.appendChild(optionsContainer);
    return section;
  }

  renderOptions(container, format) {
    container.innerHTML = "";

    // Filename
    const filenameGroup = document.createElement("div");
    filenameGroup.className = "option-group";

    const filenameLabel = document.createElement("label");
    filenameLabel.textContent = "Filename";
    filenameGroup.appendChild(filenameLabel);

    const filenameInput = document.createElement("input");
    filenameInput.type = "text";
    filenameInput.className = "option-input";
    filenameInput.value = this.options.filename;
    filenameInput.placeholder = "Enter filename";
    filenameInput.addEventListener("input", (e) => {
      this.options.filename = e.target.value;
    });
    filenameGroup.appendChild(filenameInput);

    container.appendChild(filenameGroup);

    // Include timestamp
    const timestampGroup = document.createElement("div");
    timestampGroup.className = "option-group option-checkbox";

    const timestampCheckbox = document.createElement("input");
    timestampCheckbox.type = "checkbox";
    timestampCheckbox.id = "include-timestamp";
    timestampCheckbox.checked = this.options.includeTimestamp;
    timestampCheckbox.addEventListener("change", (e) => {
      this.options.includeTimestamp = e.target.checked;
    });

    const timestampLabel = document.createElement("label");
    timestampLabel.htmlFor = "include-timestamp";
    timestampLabel.textContent = "Include timestamp in filename";

    timestampGroup.appendChild(timestampCheckbox);
    timestampGroup.appendChild(timestampLabel);
    container.appendChild(timestampGroup);

    // Format-specific options
    if (format === "png" || format === "pdf") {
      // Scale
      const scaleGroup = document.createElement("div");
      scaleGroup.className = "option-group";

      const scaleLabel = document.createElement("label");
      scaleLabel.textContent = "Scale";
      scaleGroup.appendChild(scaleLabel);

      const scaleInput = document.createElement("input");
      scaleInput.type = "range";
      scaleInput.className = "option-slider";
      scaleInput.min = "0.5";
      scaleInput.max = "3";
      scaleInput.step = "0.1";
      scaleInput.value = this.options.scale;

      const scaleValue = document.createElement("span");
      scaleValue.className = "option-value";
      scaleValue.textContent = `${this.options.scale}x`;

      scaleInput.addEventListener("input", (e) => {
        this.options.scale = parseFloat(e.target.value);
        scaleValue.textContent = `${this.options.scale}x`;
      });

      scaleGroup.appendChild(scaleInput);
      scaleGroup.appendChild(scaleValue);
      container.appendChild(scaleGroup);

      // Background
      const bgGroup = document.createElement("div");
      bgGroup.className = "option-group";

      const bgLabel = document.createElement("label");
      bgLabel.textContent = "Background";
      bgGroup.appendChild(bgLabel);

      const bgSelect = document.createElement("select");
      bgSelect.className = "option-select";

      const bgOptions = [
        { value: "transparent", label: "Transparent" },
        { value: "white", label: "White" },
        { value: "black", label: "Black" },
        { value: "custom", label: "Custom Color" },
      ];

      bgOptions.forEach((opt) => {
        const option = document.createElement("option");
        option.value = opt.value;
        option.textContent = opt.label;
        if (opt.value === this.options.background) {
          option.selected = true;
        }
        bgSelect.appendChild(option);
      });

      bgSelect.addEventListener("change", (e) => {
        this.options.background = e.target.value;
        if (e.target.value === "custom") {
          this.showColorPicker();
        }
      });

      bgGroup.appendChild(bgSelect);
      container.appendChild(bgGroup);
    }

    if (format === "png") {
      // Quality
      const qualityGroup = document.createElement("div");
      qualityGroup.className = "option-group";

      const qualityLabel = document.createElement("label");
      qualityLabel.textContent = "Quality";
      qualityGroup.appendChild(qualityLabel);

      const qualityInput = document.createElement("input");
      qualityInput.type = "range";
      qualityInput.className = "option-slider";
      qualityInput.min = "0.1";
      qualityInput.max = "1";
      qualityInput.step = "0.1";
      qualityInput.value = this.options.quality;

      const qualityValue = document.createElement("span");
      qualityValue.className = "option-value";
      qualityValue.textContent = `${Math.round(this.options.quality * 100)}%`;

      qualityInput.addEventListener("input", (e) => {
        this.options.quality = parseFloat(e.target.value);
        qualityValue.textContent = `${Math.round(this.options.quality * 100)}%`;
      });

      qualityGroup.appendChild(qualityInput);
      qualityGroup.appendChild(qualityValue);
      container.appendChild(qualityGroup);
    }

    if (format === "json") {
      // Pretty print
      const prettyGroup = document.createElement("div");
      prettyGroup.className = "option-group option-checkbox";

      const prettyCheckbox = document.createElement("input");
      prettyCheckbox.type = "checkbox";
      prettyCheckbox.id = "pretty-print";
      prettyCheckbox.checked = true;
      prettyCheckbox.addEventListener("change", (e) => {
        this.options.prettyPrint = e.target.checked;
      });

      const prettyLabel = document.createElement("label");
      prettyLabel.htmlFor = "pretty-print";
      prettyLabel.textContent = "Pretty print (formatted)";

      prettyGroup.appendChild(prettyCheckbox);
      prettyGroup.appendChild(prettyLabel);
      container.appendChild(prettyGroup);

      // Include metadata
      const metadataGroup = document.createElement("div");
      metadataGroup.className = "option-group option-checkbox";

      const metadataCheckbox = document.createElement("input");
      metadataCheckbox.type = "checkbox";
      metadataCheckbox.id = "include-metadata";
      metadataCheckbox.checked = true;
      metadataCheckbox.addEventListener("change", (e) => {
        this.options.includeMetadata = e.target.checked;
      });

      const metadataLabel = document.createElement("label");
      metadataLabel.htmlFor = "include-metadata";
      metadataLabel.textContent = "Include metadata";

      metadataGroup.appendChild(metadataCheckbox);
      metadataGroup.appendChild(metadataLabel);
      container.appendChild(metadataGroup);
    }
  }

  createPreviewSection() {
    const section = document.createElement("div");
    section.className = "export-section";

    const label = document.createElement("label");
    label.className = "export-label";
    label.textContent = "File Preview";
    section.appendChild(label);

    const preview = document.createElement("div");
    preview.className = "export-preview";
    preview.id = "export-preview";

    const previewIcon = document.createElement("div");
    previewIcon.className = "preview-icon";
    previewIcon.textContent = "📄";

    const previewName = document.createElement("div");
    previewName.className = "preview-name";
    previewName.id = "preview-filename";
    previewName.textContent = this.getFilename();

    const previewSize = document.createElement("div");
    previewSize.className = "preview-size";
    previewSize.id = "preview-size";
    previewSize.textContent = "Calculating...";

    preview.appendChild(previewIcon);
    preview.appendChild(previewName);
    preview.appendChild(previewSize);

    section.appendChild(preview);
    return section;
  }

  selectFormat(format) {
    this.selectedFormat = format;
    this.options.format = format;

    // Update selected card
    const cards = this.element.querySelectorAll(".format-card");
    cards.forEach((card) => {
      if (card.dataset.format === format) {
        card.classList.add("selected");
      } else {
        card.classList.remove("selected");
      }
    });

    // Update options
    const optionsContainer = this.element.querySelector(
      "#export-options-container"
    );
    if (optionsContainer) {
      this.renderOptions(optionsContainer, format);
    }

    // Update preview
    this.updatePreview();
  }

  updatePreview() {
    const previewName = this.element.querySelector("#preview-filename");
    const previewSize = this.element.querySelector("#preview-size");

    if (previewName) {
      previewName.textContent = this.getFilename();
    }

    if (previewSize) {
      // Simulate size calculation
      previewSize.textContent = this.estimateSize();
    }
  }

  getFilename() {
    let filename = this.options.filename || "flowchart";

    if (this.options.includeTimestamp) {
      const timestamp = new Date()
        .toISOString()
        .slice(0, 19)
        .replace(/:/g, "-");
      filename += `_${timestamp}`;
    }

    const extensions = {
      json: ".json",
      svg: ".svg",
      png: ".png",
      pdf: ".pdf",
    };

    return filename + extensions[this.selectedFormat];
  }

  estimateSize() {
    const estimates = {
      json: "5-20 KB",
      svg: "10-50 KB",
      png: "50-500 KB",
      pdf: "100-1000 KB",
    };

    return estimates[this.selectedFormat] || "Unknown";
  }

  showColorPicker() {
    // This would integrate with ColorPickerDialog
    this.eventBus.emit("color-picker:open", {
      color: "#ffffff",
      callback: (color) => {
        this.options.background = color;
      },
    });
  }

  open() {
    if (!this.element) this.render();

    this.element.style.display = "flex";
    this.isOpen = true;
    this.updatePreview();

    this.eventBus.emit("export-dialog:opened");
  }

  close() {
    if (this.element) {
      this.element.style.display = "none";
      this.isOpen = false;
      this.eventBus.emit("export-dialog:closed");
    }
  }

  async handleExport() {
    try {
      const filename = this.getFilename();

      this.eventBus.emit("export:started", {
        format: this.selectedFormat,
        filename: filename,
        options: this.options,
      });

      let data;

      switch (this.selectedFormat) {
        case "json":
          data = await this.exportManager.exportAsJSON();
          this.downloadFile(data, filename, "application/json");
          break;

        case "svg":
          data = await this.exportManager.exportAsSVG();
          this.downloadFile(data, filename, "image/svg+xml");
          break;

        case "png":
          const blob = await this.exportManager.exportAsPNG(
            this.options.scale,
            this.options.quality,
            this.options.background
          );
          this.downloadBlob(blob, filename);
          break;

        case "pdf":
          const pdfBlob = await this.exportManager.exportAsPDF(
            this.options.scale,
            this.options.background
          );
          this.downloadBlob(pdfBlob, filename);
          break;
      }

      this.eventBus.emit("export:completed", {
        format: this.selectedFormat,
        filename: filename,
      });

      this.close();
    } catch (error) {
      console.error("Export failed:", error);
      this.eventBus.emit("export:failed", { error: error.message });
      alert("Export failed: " + error.message);
    }
  }

  downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    this.downloadBlob(blob, filename);
  }

  downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  destroy() {
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
  }
}
