(function registerThreeWaySwitchElement() {
  const registry = typeof self !== "undefined" ? self.SpjutSimSchematicElementCatalog : null;
  if (!registry || typeof registry.registerElementDefinition !== "function") {
    throw new Error("Schematic element registry missing. Check src/schematic/elements/registry.js load order.");
  }
  registry.registerElementDefinition({
    type: "SW",
    label: "3-Way Switch",
    toolLabel: "3W",
    toolName: "3-Way Switch",
    shortcut: "3",
    showInToolbar: true,
    toolbarOrder: 60,
    catalogOrder: 60,
    classification: "electrical",
    help: {
      title: "3-Way Switch (SW)",
      summary: "SPDT switch with inline throw/Ron/Roff and label-visibility toggles.",
      definition: "Default Ron is 0 (short). Value tokens also support showron/showroff label toggles."
    },
    valueField: { label: "Position", unit: "", visible: true }
  });
})();
