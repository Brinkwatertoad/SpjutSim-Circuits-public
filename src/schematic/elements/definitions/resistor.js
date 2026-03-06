(function registerResistorElement() {
  const registry = typeof self !== "undefined" ? self.SpjutSimSchematicElementCatalog : null;
  if (!registry || typeof registry.registerElementDefinition !== "function") {
    throw new Error("Schematic element registry missing. Check src/schematic/elements/registry.js load order.");
  }
  registry.registerElementDefinition({
    type: "R",
    label: "Resistor",
    toolLabel: "R",
    toolName: "Resistor",
    shortcut: "R",
    showInToolbar: true,
    toolbarOrder: 10,
    catalogOrder: 10,
    classification: "electrical",
    help: {
      title: "Resistor (R)",
      summary: "Limits current and drops voltage.",
      definition: "A passive element measured in ohms (\u03a9) that resists current flow."
    },
    valueField: { label: "Resistance", unit: "\u03a9", visible: true },
    properties: [
      {
        key: "resistorStyle",
        label: "Style",
        control: "select",
        defaultValue: "zigzag",
        normalizeMethod: "normalizeResistorStyle",
        inlineEditVisible: true,
        options: [
          { value: "zigzag", label: "Zigzag" },
          { value: "box", label: "Box" }
        ]
      }
    ]
  });
})();