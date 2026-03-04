(function registerVoltmeterElement() {
  const registry = typeof self !== "undefined" ? self.SpjutSimSchematicElementCatalog : null;
  if (!registry || typeof registry.registerElementDefinition !== "function") {
    throw new Error("Schematic element registry missing. Check src/schematic/elements/registry.js load order.");
  }
  registry.registerElementDefinition({
    type: "VM",
    label: "Voltmeter",
    toolLabel: "VM",
    toolName: "Voltmeter",
    shortcut: "VM",
    showInToolbar: true,
    toolbarOrder: 70,
    catalogOrder: 70,
    classification: "electrical",
    help: {
      title: "Voltmeter (VM)",
      summary: "Measures voltage across two nodes.",
      definition: "A probe for observing voltage without affecting the circuit."
    },
    valueField: { label: "Resistance", unit: "Ω", visible: true }
  });
})();
