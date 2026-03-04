(function registerVoltageSourceElement() {
  const registry = typeof self !== "undefined" ? self.SpjutSimSchematicElementCatalog : null;
  if (!registry || typeof registry.registerElementDefinition !== "function") {
    throw new Error("Schematic element registry missing. Check src/schematic/elements/registry.js load order.");
  }
  registry.registerElementDefinition({
    type: "V",
    label: "Voltage Source",
    toolLabel: "V",
    toolName: "Voltage Source",
    shortcut: "V",
    showInToolbar: true,
    toolbarOrder: 40,
    catalogOrder: 40,
    classification: "electrical",
    help: {
      title: "Voltage Source (V)",
      summary: "Forces a voltage between two nodes.",
      definition: "An ideal source that sets a voltage regardless of current draw."
    },
    valueField: { label: "Voltage", unit: "V", visible: true }
  });
})();
