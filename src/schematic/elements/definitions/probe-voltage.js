(function registerProbeVoltageElement() {
  const registry = typeof self !== "undefined" ? self.SpjutSimSchematicElementCatalog : null;
  if (!registry || typeof registry.registerElementDefinition !== "function") {
    throw new Error("Schematic element registry missing. Check src/schematic/elements/registry.js load order.");
  }
  registry.registerElementDefinition({
    type: "PV",
    label: "Probe",
    toolLabel: "P",
    toolName: "Probe",
    shortcut: "P",
    showInToolbar: true,
    toolbarOrder: 90,
    catalogOrder: 90,
    classification: "probe",
    help: {
      title: "Probe (P)",
      summary: "Click wires for voltage or component bodies for current.",
      definition: "Persistent measurement probe. Shift+click starts differential, Alt+click places power."
    },
    valueField: { label: "Target", unit: "", visible: false }
  });
})();
