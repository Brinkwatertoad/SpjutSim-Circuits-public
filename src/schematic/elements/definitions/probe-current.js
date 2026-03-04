(function registerProbeCurrentElement() {
  const registry = typeof self !== "undefined" ? self.SpjutSimSchematicElementCatalog : null;
  if (!registry || typeof registry.registerElementDefinition !== "function") {
    throw new Error("Schematic element registry missing. Check src/schematic/elements/registry.js load order.");
  }
  registry.registerElementDefinition({
    type: "PI",
    label: "Current Probe",
    toolLabel: "PI",
    toolName: "Current Probe",
    shortcut: "PI",
    showInToolbar: false,
    toolbarOrder: 190,
    catalogOrder: 91,
    classification: "probe",
    help: {
      title: "Current Probe",
      summary: "Measures current through a targeted component.",
      definition: "Usually created by placing or converting the main probe tool over a component body."
    },
    valueField: { label: "Target", unit: "", visible: false }
  });
})();
