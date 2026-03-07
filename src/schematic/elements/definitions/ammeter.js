(function registerAmmeterElement() {
  const registry = typeof self !== "undefined" ? self.SpjutSimSchematicElementCatalog : null;
  if (!registry || typeof registry.registerElementDefinition !== "function") {
    throw new Error("Schematic element registry missing. Check src/schematic/elements/registry.js load order.");
  }
  registry.registerElementDefinition({
    type: "AM",
    label: "Ammeter",
    toolLabel: "AM",
    toolName: "Ammeter",
    shortcut: "AM",
    showInToolbar: true,
    toolbarOrder: 80,
    catalogOrder: 80,
    classification: "electrical",
    help: {
      title: "Ammeter",
      summary: "Measures current through a branch.",
      definition: "A probe for observing current without affecting the circuit."
    },
    valueField: { label: "Resistance", unit: "Ω", visible: true }
  });
})();
