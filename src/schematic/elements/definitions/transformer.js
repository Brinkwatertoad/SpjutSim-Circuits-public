(function registerTransformerElement() {
  const registry = typeof self !== "undefined" ? self.SpjutSimSchematicElementCatalog : null;
  if (!registry || typeof registry.registerElementDefinition !== "function") {
    throw new Error("Schematic element registry missing. Check src/schematic/elements/registry.js load order.");
  }
  registry.registerElementDefinition({
    type: "XFMR",
    label: "Transformer",
    toolLabel: "XFMR",
    toolName: "Transformer",
    shortcut: "Shift+L",
    showInToolbar: true,
    toolbarOrder: 65,
    catalogOrder: 65,
    classification: "electrical",
    help: {
      title: "Transformer (Shift+L)",
      summary: "Couples AC energy between primary and secondary windings.",
      definition: "Ideal model with turns ratio N=Ns/Np, primary inductance Lp, derived secondary inductance Ls=Lp*N^2, and coupling K."
    },
    valueField: { label: "Turns ratio", unit: "", visible: true },
    properties: [
      {
        key: "xfmrLp",
        label: "Primary inductance (Lp)",
        control: "text",
        defaultValue: "1",
        normalizeMethod: "normalizeTransformerPrimaryInductance",
        input: { unit: "H" },
        help: {
          title: "Primary inductance (Lp)",
          summary: "Base inductance of the primary winding in henries.",
          definition: "Choose a convenient large value for ideal-transformer modeling."
        }
      },
      {
        key: "xfmrSolveBy",
        label: "Solve for",
        control: "select",
        defaultValue: "ratio",
        normalizeMethod: "normalizeTransformerSolveBy",
        options: [
          { value: "ratio", label: "Turns ratio (N)" },
          { value: "secondary", label: "Secondary inductance (Ls)" }
        ],
        help: {
          title: "Solve for",
          summary: "Chooses which transformer field drives the derived value.",
          definition: "Ratio mode uses N to compute Ls; secondary mode uses Ls to compute N while Lp remains user-specified."
        }
      },
      {
        key: "xfmrLs",
        label: "Secondary inductance (Ls)",
        control: "text",
        defaultValue: "1",
        normalizeMethod: "normalizeTransformerSecondaryInductance",
        input: { unit: "H" },
        help: {
          title: "Secondary inductance (Ls)",
          summary: "Secondary winding inductance in henries.",
          definition: "Editable when Solve by is Secondary inductance (Ls); otherwise computed from Lp and N."
        }
      },
      {
        key: "xfmrK",
        label: "Coupling coefficient (K)",
        control: "text",
        defaultValue: "1",
        normalizeMethod: "normalizeTransformerCouplingCoefficient",
        input: {},
        help: {
          title: "Coupling coefficient (K)",
          summary: "Magnetic coupling between primary and secondary windings.",
          definition: "Ideal transformers use K = 1.0."
        }
      },
      {
        key: "xfmrRpri",
        label: "Primary winding resistance (R_PRI)",
        control: "text",
        defaultValue: "0",
        normalizeMethod: "normalizeTransformerWindingResistance",
        input: { unit: "\u03a9" },
        help: {
          title: "Primary winding resistance (R_PRI)",
          summary: "Series resistance on the primary winding.",
          definition: "Ideal transformers use R_PRI = 0."
        }
      },
      {
        key: "xfmrRsec",
        label: "Secondary winding resistance (R_SEC)",
        control: "text",
        defaultValue: "0",
        normalizeMethod: "normalizeTransformerWindingResistance",
        input: { unit: "\u03a9" },
        help: {
          title: "Secondary winding resistance (R_SEC)",
          summary: "Series resistance on the secondary winding.",
          definition: "Ideal transformers use R_SEC = 0."
        }
      },
      {
        key: "xfmrPolarity",
        label: "Polarity",
        control: "select",
        defaultValue: "subtractive",
        normalizeMethod: "normalizeTransformerPolarity",
        options: [
          { value: "subtractive", label: "In-phase (dots on top)" },
          { value: "additive", label: "Reversed (dots on opposite corners)" }
        ],
        help: {
          title: "Polarity",
          summary: "Sets transformer dot convention and secondary winding orientation.",
          definition: "In-phase keeps both polarity dots at the top terminals; reversed swaps secondary winding orientation so dots are on opposite corners."
        }
      }
    ]
  });
})();
