(function registerProbePowerElement() {
  const registry = typeof self !== "undefined" ? self.SpjutSimSchematicElementCatalog : null;
  if (!registry || typeof registry.registerElementDefinition !== "function") {
    throw new Error("Schematic element registry missing. Check src/schematic/elements/registry.js load order.");
  }
  registry.registerElementDefinition({
    type: "PP",
    label: "Power Probe",
    toolLabel: "PP",
    toolName: "Power Probe",
    shortcut: "PP",
    showInToolbar: false,
    toolbarOrder: 192,
    catalogOrder: 93,
    classification: "probe",
    help: {
      title: "Power Probe",
      summary: "Measures component power using V*I.",
      definition: "Click a component body to place a persistent power probe."
    },
    valueField: { label: "Target", unit: "", visible: false }
  });
})();
