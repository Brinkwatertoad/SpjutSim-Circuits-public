(function registerAcVoltageSourceElement() {
  const registry = typeof self !== "undefined" ? self.SpjutSimSchematicElementCatalog : null;
  if (!registry || typeof registry.registerElementDefinition !== "function") {
    throw new Error("Schematic element registry missing. Check src/schematic/elements/registry.js load order.");
  }
  registry.registerElementDefinition({
    type: "VAC",
    label: "AC Voltage Source",
    toolLabel: "VAC",
    toolName: "AC Voltage Source",
    shortcut: "Shift+V",
    showInToolbar: true,
    toolbarOrder: 45,
    catalogOrder: 45,
    classification: "electrical",
    help: {
      title: "AC Voltage Source (Shift+V)",
      summary: "Sinusoidal or periodic voltage source with DC offset and phase.",
      definition: "Provides configurable AC excitation for transient and AC sweep analyses with selectable waveform shape."
    },
    valueField: { label: "Source", unit: "", visible: false },
    properties: [
      {
        key: "vacAmplitude",
        label: "Amplitude",
        control: "text",
        defaultValue: "1",
        normalizeMethod: "normalizeAcSourceAmplitude",
        input: { unit: "V" },
        help: {
          title: "Amplitude",
          summary: "Peak amplitude of the AC waveform.",
          definition: "For sine, this is the peak value around the DC offset; square/triangle/sawtooth use ±Amplitude around offset."
        }
      },
      {
        key: "vacFrequency",
        label: "Frequency",
        control: "text",
        defaultValue: "1k",
        normalizeMethod: "normalizeAcSourceFrequency",
        input: { unit: "Hz" },
        help: {
          title: "Frequency",
          summary: "Waveform frequency in hertz.",
          definition: "Supports metric prefixes such as k, M, m, u, n, and p."
        }
      },
      {
        key: "vacPhase",
        label: "Phase",
        control: "text",
        defaultValue: "0",
        normalizeMethod: "normalizeAcSourcePhase",
        input: { unit: "deg" },
        help: {
          title: "Phase",
          summary: "Phase offset in degrees.",
          definition: "Positive values advance the waveform relative to time origin."
        }
      },
      {
        key: "vacDcOffset",
        label: "DC offset",
        control: "text",
        defaultValue: "0",
        normalizeMethod: "normalizeAcSourceDcOffset",
        input: { unit: "V" },
        help: {
          title: "DC offset",
          summary: "DC component of the source.",
          definition: "Center value around which waveform excursions occur."
        }
      },
      {
        key: "vacWaveform",
        label: "Waveform",
        control: "select",
        defaultValue: "sine",
        normalizeMethod: "normalizeAcSourceWaveform",
        options: [
          { value: "sine", label: "Sine" },
          { value: "triangle", label: "Triangle" },
          { value: "sawtooth", label: "Sawtooth" },
          { value: "square", label: "Square" }
        ],
        help: {
          title: "Waveform",
          summary: "Time-domain waveform shape for transient analysis.",
          definition: "Sine uses SPICE SIN; triangle, sawtooth, and square are generated from periodic pulse parameters."
        }
      }
    ]
  });
})();
