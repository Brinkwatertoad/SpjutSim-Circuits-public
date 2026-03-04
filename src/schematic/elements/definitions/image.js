(function registerImageElement() {
  const registry = typeof self !== "undefined" ? self.SpjutSimSchematicElementCatalog : null;
  if (!registry || typeof registry.registerElementDefinition !== "function") {
    throw new Error("Schematic element registry missing. Check src/schematic/elements/registry.js load order.");
  }
  registry.registerElementDefinition({
    type: "IMG",
    label: "Image",
    toolLabel: "IMG",
    toolName: "Image",
    shortcut: "M",
    showInToolbar: false,
    toolbarOrder: 130,
    catalogOrder: 130,
    classification: "annotation",
    help: {
      title: "Image (M)",
      summary: "Places a non-electrical image annotation.",
      definition: "Use for schematic callouts and references that should persist and export without affecting simulation."
    },
    valueField: { label: "Value", unit: "", visible: false }
  });
})();
