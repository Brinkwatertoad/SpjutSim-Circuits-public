(function registerCapacitorElement() {
  const registry = typeof self !== "undefined" ? self.SpjutSimSchematicElementCatalog : null;
  if (!registry || typeof registry.registerElementDefinition !== "function") {
    throw new Error("Schematic element registry missing. Check src/schematic/elements/registry.js load order.");
  }
  registry.registerElementDefinition({
    type: "C",
    label: "Capacitor",
    toolLabel: "C",
    toolName: "Capacitor",
    shortcut: "C",
    showInToolbar: true,
    toolbarOrder: 20,
    catalogOrder: 20,
    classification: "electrical",
    help: {
      title: "Capacitor (C)",
      summary: "Stores energy in an electric field.",
      definition: "A passive element measured in farads (F) that stores charge between two nodes."
    },
    valueField: { label: "Capacitance", unit: "F", visible: true }
  });
})();
