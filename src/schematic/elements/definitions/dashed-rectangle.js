(function registerDashedRectangleElement() {
  const registry = typeof self !== "undefined" ? self.SpjutSimSchematicElementCatalog : null;
  if (!registry || typeof registry.registerElementDefinition !== "function") {
    throw new Error("Schematic element registry missing. Check src/schematic/elements/registry.js load order.");
  }
  registry.registerElementDefinition({
    type: "DBOX",
    label: "Dashed Rectangle",
    toolLabel: "DBOX",
    toolName: "Dashed Rectangle",
    shortcut: "D",
    showInToolbar: false,
    toolbarOrder: 160,
    catalogOrder: 160,
    classification: "annotation",
    help: {
      title: "Dashed Rectangle (D)",
      summary: "Places a non-electrical dashed rectangle annotation.",
      definition: "Use dashed framing to mark optional blocks or measurement regions without changing simulation."
    },
    valueField: { label: "Thickness", unit: "px", visible: false }
  });
})();
