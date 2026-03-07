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
      title: "3-Way Switch (3)",
      summary: "3-way SPDT (Single Pole Double Throw) switch with inline throw/Ron/Roff and label-visibility toggles.",
      definition: "Default Ron is 0 (short); Default Roff is infinite (open)."
    },
    valueField: { label: "Position", unit: "", visible: true }
  });
})();
