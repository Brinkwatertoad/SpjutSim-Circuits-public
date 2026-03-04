(function registerArrowElement() {
  const registry = typeof self !== "undefined" ? self.SpjutSimSchematicElementCatalog : null;
  if (!registry || typeof registry.registerElementDefinition !== "function") {
    throw new Error("Schematic element registry missing. Check src/schematic/elements/registry.js load order.");
  }
  registry.registerElementDefinition({
    type: "ARR",
    label: "Arrow",
    toolLabel: "ARR",
    toolName: "Arrow",
    shortcut: "A",
    showInToolbar: true,
    toolbarOrder: 140,
    catalogOrder: 140,
    classification: "annotation",
    help: {
      title: "Arrow",
      summary: "Places a non-electrical arrow annotation.",
      definition: "Use arrows to call out signal flow and notes without changing simulation behavior."
    },
    valueField: { label: "Thickness", unit: "px", visible: true }
  });
})();

