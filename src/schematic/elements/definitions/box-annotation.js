(function registerBoxAnnotationElement() {
  const registry = typeof self !== "undefined" ? self.SpjutSimSchematicElementCatalog : null;
  if (!registry || typeof registry.registerElementDefinition !== "function") {
    throw new Error("Schematic element registry missing. Check src/schematic/elements/registry.js load order.");
  }
  registry.registerElementDefinition({
    type: "BOX",
    label: "Box",
    toolLabel: "BOX",
    toolName: "Box",
    shortcut: "B",
    showInToolbar: true,
    toolbarOrder: 150,
    catalogOrder: 150,
    classification: "annotation",
    help: {
      title: "Box",
      summary: "Places a non-electrical box annotation.",
      definition: "Use boxes to frame and group schematic regions without affecting connectivity."
    },
    valueField: { label: "Thickness", unit: "px", visible: false }
  });
})();

