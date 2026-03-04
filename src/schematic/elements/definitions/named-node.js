(function registerNamedNodeElement() {
  const registry = typeof self !== "undefined" ? self.SpjutSimSchematicElementCatalog : null;
  if (!registry || typeof registry.registerElementDefinition !== "function") {
    throw new Error("Schematic element registry missing. Check src/schematic/elements/registry.js load order.");
  }
  registry.registerElementDefinition({
    type: "NET",
    label: "Named Node",
    toolLabel: "NET",
    toolName: "Named Node",
    shortcut: "N",
    showInToolbar: true,
    toolbarOrder: 110,
    catalogOrder: 110,
    classification: "electrical",
    help: {
      title: "Named Node (N)",
      summary: "Places a named node label for simulation traces.",
      definition: "Click a wire node to place a label and edit its name immediately."
    },
    valueField: { label: "Value", unit: "", visible: false }
  });
})();
