(function registerProbeDifferentialElement() {
  const registry = typeof self !== "undefined" ? self.SpjutSimSchematicElementCatalog : null;
  if (!registry || typeof registry.registerElementDefinition !== "function") {
    throw new Error("Schematic element registry missing. Check src/schematic/elements/registry.js load order.");
  }
  registry.registerElementDefinition({
    type: "PD",
    label: "Differential Probe",
    toolLabel: "PD",
    toolName: "Differential Probe",
    shortcut: "PD",
    showInToolbar: false,
    toolbarOrder: 191,
    catalogOrder: 92,
    classification: "probe",
    help: {
      title: "Differential Probe",
      summary: "Two sequential node clicks measure V(pos,neg).",
      definition: "First click sets positive node; second click sets negative node."
    },
    valueField: { label: "Target", unit: "", visible: false }
  });
})();
