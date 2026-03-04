(function registerInductorElement() {
  const registry = typeof self !== "undefined" ? self.SpjutSimSchematicElementCatalog : null;
  if (!registry || typeof registry.registerElementDefinition !== "function") {
    throw new Error("Schematic element registry missing. Check src/schematic/elements/registry.js load order.");
  }
  registry.registerElementDefinition({
    type: "L",
    label: "Inductor",
    toolLabel: "L",
    toolName: "Inductor",
    shortcut: "L",
    showInToolbar: true,
    toolbarOrder: 30,
    catalogOrder: 30,
    classification: "electrical",
    help: {
      title: "Inductor (L)",
      summary: "Stores energy in a magnetic field.",
      definition: "A passive element measured in henries (H) that opposes changes in current."
    },
    valueField: { label: "Inductance", unit: "H", visible: true }
  });
})();
