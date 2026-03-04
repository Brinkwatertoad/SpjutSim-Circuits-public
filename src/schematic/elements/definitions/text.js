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
    valueField: { label: "Value", unit: "", visible: false }
  });
})();
