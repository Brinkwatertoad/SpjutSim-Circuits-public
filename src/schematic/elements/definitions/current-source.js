(function registerCurrentSourceElement() {
  const registry = typeof self !== "undefined" ? self.SpjutSimSchematicElementCatalog : null;
  if (!registry || typeof registry.registerElementDefinition !== "function") {
    throw new Error("Schematic element registry missing. Check src/schematic/elements/registry.js load order.");
  }
  registry.registerElementDefinition({
    type: "I",
    label: "Current Source",
    toolLabel: "I",
    toolName: "Current Source",
    shortcut: "I",
    showInToolbar: true,
    toolbarOrder: 50,
    catalogOrder: 50,
    classification: "electrical",
    help: {
      title: "Current Source (I)",
      summary: "Forces a current through a branch.",
      definition: "An ideal source that sets current regardless of voltage across it."
    },
    valueField: { label: "Current", unit: "A", visible: true }
  });
})();
