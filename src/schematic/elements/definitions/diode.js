(function registerDiodeElement() {
  const registry = typeof self !== "undefined" ? self.SpjutSimSchematicElementCatalog : null;
  if (!registry || typeof registry.registerElementDefinition !== "function") {
    throw new Error("Schematic element registry missing. Check src/schematic/elements/registry.js load order.");
  }

  const schematic = typeof self !== "undefined" ? self.SpjutSimSchematic : null;
  if (!schematic || typeof schematic.getDiodePresetKeys !== "function") {
    throw new Error("Schematic model missing diode API. Check src/schematic/model.js load order.");
  }

  const PRESET_LABELS = {
    "Default":  "Default",
    "1N5711":   "1N5711 (Schottky)",
    "1N5712":   "1N5712 (Schottky)",
    "1N34":     "1N34 (Germanium)",
    "1N4148":   "1N4148",
    "1N3891":   "1N3891",
    "10A04":    "10A04 (10A)",
    "1N4004":   "1N4004 (1A)",
    "1N4004ds": "1N4004 (DS)"
  };
  const presetOptions = schematic.getDiodePresetKeys().map((key) => ({
    value: key,
    label: PRESET_LABELS[key] ?? key
  }));

  registry.registerElementDefinition({
    type: "D",
    label: "Diode",
    toolLabel: "D",
    toolName: "Diode",
    shortcut: "D",
    showInToolbar: true,
    toolbarOrder: 35,
    catalogOrder: 35,
    classification: "electrical",
    help: {
      title: "Diode (D)",
      summary: "Allows current to flow in one direction only.",
      definition: "A nonlinear two-terminal semiconductor device. Current flows from anode (A) to cathode (K) when forward-biased; blocks in reverse. The SPICE model captures DC, charge storage, temperature, and breakdown behavior."
    },
    valueField: { label: "Label", unit: "", visible: true },
    properties: [
      // --- Display ---
      {
        key: "diodeDisplayType",
        label: "Symbol",
        control: "select",
        defaultValue: "default",
        normalizeMethod: "normalizeDiodeDisplayType",
        inlineEditVisible: true,
        options: [
          { value: "default",  label: "Default (PN)" },
          { value: "schottky", label: "Schottky" },
          { value: "varicap",  label: "Varicap" }
        ]
      },
      // --- Model preset ---
      {
        key: "diodePreset",
        label: "Model",
        control: "select",
        defaultValue: "1N4148",
        normalizeMethod: "normalizeDiodePreset",
        inlineEditVisible: true,
        options: presetOptions
      },
      // --- DC parameters ---
      {
        key: "diodeIS",
        label: "IS",
        control: "text",
        defaultValue: "35p",
        normalizeMethod: "normalizeDiodeParamValue",
        inlineEditVisible: true,
        input: { placeholder: "e.g. 35p", unit: "A" }
      },
      {
        key: "diodeN",
        label: "N",
        control: "text",
        defaultValue: "1.24",
        normalizeMethod: "normalizeDiodeParamValue",
        inlineEditVisible: true,
        input: { placeholder: "e.g. 1.24" }
      },
      {
        key: "diodeRS",
        label: "RS",
        control: "text",
        defaultValue: "64m",
        normalizeMethod: "normalizeDiodeParamValue",
        inlineEditVisible: true,
        input: { placeholder: "e.g. 64m", unit: "\u03a9" }
      },
      // --- Charge & capacitance ---
      {
        key: "diodeTT",
        label: "TT",
        control: "text",
        defaultValue: "5.0n",
        normalizeMethod: "normalizeDiodeParamValue",
        inlineEditVisible: true,
        input: { placeholder: "e.g. 5n", unit: "s" }
      },
      {
        key: "diodeCJO",
        label: "CJO",
        control: "text",
        defaultValue: "4.0p",
        normalizeMethod: "normalizeDiodeParamValue",
        inlineEditVisible: true,
        input: { placeholder: "e.g. 4p", unit: "F" }
      },
      {
        key: "diodeVJ",
        label: "VJ",
        control: "text",
        defaultValue: "0.6",
        normalizeMethod: "normalizeDiodeParamValue",
        inlineEditVisible: true,
        input: { placeholder: "e.g. 0.6", unit: "V" }
      },
      {
        key: "diodeM",
        label: "M",
        control: "text",
        defaultValue: "0.285",
        normalizeMethod: "normalizeDiodeParamValue",
        inlineEditVisible: true,
        input: { placeholder: "e.g. 0.5" }
      },
      {
        key: "diodeFC",
        label: "FC",
        control: "text",
        defaultValue: "",
        normalizeMethod: "normalizeDiodeParamValue",
        inlineEditVisible: true,
        input: { placeholder: "e.g. 0.5" }
      },
      // --- Temperature ---
      {
        key: "diodeEG",
        label: "EG",
        control: "text",
        defaultValue: "",
        normalizeMethod: "normalizeDiodeParamValue",
        inlineEditVisible: true,
        input: { placeholder: "e.g. 1.11", unit: "eV" }
      },
      {
        key: "diodeXTI",
        label: "XTI",
        control: "text",
        defaultValue: "",
        normalizeMethod: "normalizeDiodeParamValue",
        inlineEditVisible: true,
        input: { placeholder: "e.g. 3" }
      },
      {
        key: "diodeTNOM",
        label: "TNOM",
        control: "text",
        defaultValue: "",
        normalizeMethod: "normalizeDiodeParamValue",
        inlineEditVisible: true,
        input: { placeholder: "e.g. 27", unit: "\u00b0C" }
      },
      // --- Breakdown ---
      {
        key: "diodeBV",
        label: "BV",
        control: "text",
        defaultValue: "75",
        normalizeMethod: "normalizeDiodeParamValue",
        inlineEditVisible: true,
        input: { placeholder: "e.g. 75", unit: "V" }
      },
      {
        key: "diodeIBV",
        label: "IBV",
        control: "text",
        defaultValue: "",
        normalizeMethod: "normalizeDiodeParamValue",
        inlineEditVisible: true,
        input: { placeholder: "e.g. 1m", unit: "A" }
      },
      // --- Extra model params passthrough ---
      {
        key: "diodeExtra",
        label: "Extra",
        control: "text",
        defaultValue: "",
        normalizeMethod: "normalizeDiodeParamValue",
        inlineEditVisible: true,
        input: { placeholder: "e.g. KF=1e-12 AF=1" }
      },
      // --- Instance parameters ---
      {
        key: "diodeArea",
        label: "AREA",
        control: "text",
        defaultValue: "",
        normalizeMethod: "normalizeDiodeParamValue",
        inlineEditVisible: true,
        input: { placeholder: "e.g. 1" }
      },
      {
        key: "diodeTEMP",
        label: "TEMP",
        control: "text",
        defaultValue: "",
        normalizeMethod: "normalizeDiodeParamValue",
        inlineEditVisible: true,
        input: { placeholder: "e.g. 27", unit: "\u00b0C" }
      },
      {
        key: "diodeDTEMP",
        label: "DTEMP",
        control: "text",
        defaultValue: "",
        normalizeMethod: "normalizeDiodeParamValue",
        inlineEditVisible: true,
        input: { placeholder: "e.g. 0", unit: "\u00b0C" }
      },
      {
        key: "diodeIC",
        label: "IC",
        control: "text",
        defaultValue: "",
        normalizeMethod: "normalizeDiodeParamValue",
        inlineEditVisible: true,
        input: { placeholder: "e.g. 0", unit: "V" }
      },
      // --- Instance toggle ---
      {
        key: "diodeOFF",
        label: "OFF",
        control: "toggle",
        defaultValue: false,
        normalizeMethod: "normalizeTextOnly",
        inlineEditVisible: true
      }
    ]
  });
})();
