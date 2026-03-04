(function registerGroundElement() {
  const registry = typeof self !== "undefined" ? self.SpjutSimSchematicElementCatalog : null;
  if (!registry || typeof registry.registerElementDefinition !== "function") {
    throw new Error("Schematic element registry missing. Check src/schematic/elements/registry.js load order.");
  }
  registry.registerElementDefinition({
    type: "GND",
    label: "Ground",
    toolLabel: "GND",
    toolName: "Ground",
    shortcut: "G",
    showInToolbar: true,
    toolbarOrder: 100,
    catalogOrder: 100,
    classification: "electrical",
    help: {
      title: "Ground (GND)",
      summary: "Defines the reference node (0 V).",
      definition: "The circuit reference used for all node voltages."
    },
    valueField: { label: "Value", unit: "", visible: false }
  });
})();
