(function registerTextElement() {
  const registry = typeof self !== "undefined" ? self.SpjutSimSchematicElementCatalog : null;
  if (!registry || typeof registry.registerElementDefinition !== "function") {
    throw new Error("Schematic element registry missing. Check src/schematic/elements/registry.js load order.");
  }
  registry.registerElementDefinition({
    type: "TEXT",
    label: "Text",
    toolLabel: "TEXT",
    toolName: "Text",
    shortcut: "T",
    showInToolbar: true,
    toolbarOrder: 120,
    catalogOrder: 120,
    classification: "annotation",
    help: {
      title: "Text (T)",
      summary: "Places a non-electrical text annotation.",
      definition: "Use double-click to edit font, size, style, and color without affecting simulation."
    },
    valueField: { label: "Value", unit: "", visible: false },
    properties: [
      {
        key: "textFont",
        label: "Font",
        control: "select",
        defaultValue: "Segoe UI",
        normalizeMethod: "normalizeTextFont",
        inlineEditVisible: true,
        options: [
          { value: "Segoe UI", label: "Segoe UI" },
          { value: "Arial", label: "Arial" },
          { value: "Consolas", label: "Consolas" },
          { value: "Times New Roman", label: "Times New Roman" },
          { value: "Courier New", label: "Courier New" }
        ]
      },
      {
        key: "textSize",
        label: "Size",
        control: "number",
        defaultValue: 14,
        normalizeMethod: "normalizeTextSize",
        inlineEditVisible: true,
        input: {
          min: 8,
          max: 72,
          step: 1
        }
      },
      {
        key: "textBold",
        label: "Bold",
        control: "toggle",
        defaultValue: false,
        normalizeMethod: "normalizeTextStyleToggle",
        inlineEditVisible: true
      },
      {
        key: "textItalic",
        label: "Italic",
        control: "toggle",
        defaultValue: false,
        normalizeMethod: "normalizeTextStyleToggle",
        inlineEditVisible: true
      },
      {
        key: "textUnderline",
        label: "Underline",
        control: "toggle",
        defaultValue: false,
        normalizeMethod: "normalizeTextStyleToggle",
        inlineEditVisible: true
      }
    ]
  });
})();
