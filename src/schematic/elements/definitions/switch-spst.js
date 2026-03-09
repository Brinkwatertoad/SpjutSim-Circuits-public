(function registerSpstSwitchElement() {
  const registry = typeof self !== "undefined" ? self.SpjutSimSchematicElementCatalog : null;
  if (!registry || typeof registry.registerElementDefinition !== "function") {
    throw new Error("Schematic element registry missing. Check src/schematic/elements/registry.js load order.");
  }
  registry.registerElementDefinition({
    type: "SPST",
    label: "SPST Switch",
    toolLabel: "SPST",
    toolName: "SPST Switch",
    shortcut: "4",
    showInToolbar: true,
    toolbarOrder: 61,
    catalogOrder: 61,
    classification: "electrical",
    help: {
      title: "SPST Switch (4)",
      summary: "Single Pole Single Throw switch with inline position/Ron/Roff controls.",
      definition: "Position A is connected (Ron). Position B is disconnected (Roff, or open if Roff is omitted)."
    },
    valueField: { label: "Position", unit: "", visible: true }
  });
})();
