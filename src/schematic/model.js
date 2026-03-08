/**
 * @typedef {{ id: string, name: string, x: number, y: number }} Pin
 * @typedef {{ id: string, name?: string, type: string, value?: string, groundVariant?: string, resistorStyle?: string, netColor?: string, textOnly?: boolean, textFont?: string, textSize?: number, textBold?: boolean, textItalic?: boolean, textUnderline?: boolean, rotation?: number, labelRotation?: number, probeDiffRotations?: { "P+"?: number, "P-"?: number }, pins: Pin[] }} Component
 * @typedef {{ id: string, points: { x: number, y: number }[], netColor?: string }} Wire
 * @typedef {{ components: Component[], wires: Wire[] }} SchematicModel
 * @typedef {{ id: string, nodes: { x: number, y: number }[], pins: { componentId: string, pinId: string, name: string, x: number, y: number }[] }} Net
 */

(function initSchematicModel() {
  const roundCoord = (value) => Math.round(value * 1e6) / 1e6;
  const NET_COLOR_PALETTE = Object.freeze([
    "#1d1d1f",
    "#808080",
    "#4d8bff",
    "#0043ce",
    "#104b22",
    "#24a148",
    "#007d79",
    "#139c9c",
    "#f1c21b",
    "#ff832b",
    "#8f4b00",
    "#da1e28",
    "#8a151b",
    "#ff7eb6",
    "#8a3ffc",
    "#5722a1"
  ]);
  const NET_COLOR_SET = new Set(NET_COLOR_PALETTE);
  const TEXT_FONT_OPTIONS = Object.freeze([
    "Segoe UI",
    "Arial",
    "Consolas",
    "Times New Roman",
    "Courier New"
  ]);
  const TEXT_FONT_SET = new Set(TEXT_FONT_OPTIONS.map((entry) => entry.toLowerCase()));
  const DEFAULT_TEXT_FONT = TEXT_FONT_OPTIONS[0];
  const DEFAULT_TEXT_SIZE = 14;
  const MIN_TEXT_SIZE = 8;
  const MAX_TEXT_SIZE = 72;
  const DEFAULT_MEASUREMENT_TEXT_WEIGHT = 400;
  const DEFAULT_COMPONENT_LABEL_LAYOUT = Object.freeze({
    lineHeight: 14,
    padding: 16,
    paddingBelow: 16
  });
  const DEFAULT_COMPONENT_TEXT_COLORS = Object.freeze({
    label: "#1d1d1f",
    value: "#5b5750"
  });
  const GROUND_VARIANTS = Object.freeze(["earth", "chassis", "signal"]);
  const GROUND_VARIANT_SET = new Set(GROUND_VARIANTS);
  const RESISTOR_STYLES = Object.freeze(["zigzag", "box"]);
  const RESISTOR_STYLE_SET = new Set(RESISTOR_STYLES);
  const DIODE_DISPLAY_TYPES = Object.freeze(["default", "schottky", "varicap"]);
  const DIODE_DISPLAY_TYPE_SET = new Set(DIODE_DISPLAY_TYPES);
  // SPICE model parameter keys used for .model line generation, in emit order.
  const DIODE_MODEL_PARAM_KEYS = Object.freeze(["IS", "N", "RS", "TT", "CJO", "VJ", "M", "EG", "XTI", "TNOM", "BV", "IBV", "FC"]);
  // Preset model parameter values. Empty string means "not specified" (use simulator default).
  // Keys match the SPICE model names used in netlist output.
  const DIODE_MODEL_PRESETS = Object.freeze({
    "Default":  Object.freeze({ IS: "1E-14", N: "1",     RS: "0",     TT: "0",     CJO: "0",     VJ: "1",    M: "0.5",   EG: "1.11", XTI: "3",  TNOM: "", BV: "",    IBV: "1m",  FC: "" }),
    "1N5711":   Object.freeze({ IS: "315n",  N: "2.03",  RS: "2.8",   TT: "1.44n", CJO: "2.00p", VJ: "",     M: "0.333", EG: "0.69", XTI: "2",  TNOM: "", BV: "70",  IBV: "10u", FC: "" }),
    "1N5712":   Object.freeze({ IS: "680p",  N: "1.003", RS: "12",    TT: "50p",   CJO: "1.0p",  VJ: "0.6",  M: "0.5",   EG: "0.69", XTI: "2",  TNOM: "", BV: "20",  IBV: "",    FC: "" }),
    "1N34":     Object.freeze({ IS: "200p",  N: "2.19",  RS: "84m",   TT: "144n",  CJO: "4.82p", VJ: "0.75", M: "0.333", EG: "0.67", XTI: "",   TNOM: "", BV: "60",  IBV: "15u", FC: "" }),
    "1N4148":   Object.freeze({ IS: "35p",   N: "1.24",  RS: "64m",   TT: "5.0n",  CJO: "4.0p",  VJ: "0.6",  M: "0.285", EG: "",     XTI: "",   TNOM: "", BV: "75",  IBV: "",    FC: "" }),
    "1N3891":   Object.freeze({ IS: "63n",   N: "2",     RS: "9.6m",  TT: "110n",  CJO: "114p",  VJ: "0.6",  M: "0.255", EG: "",     XTI: "",   TNOM: "", BV: "250", IBV: "",    FC: "" }),
    "10A04":    Object.freeze({ IS: "844n",  N: "2.06",  RS: "2.06m", TT: "4.32u", CJO: "277p",  VJ: "",     M: "0.333", EG: "",     XTI: "",   TNOM: "", BV: "400", IBV: "10u", FC: "" }),
    "1N4004":   Object.freeze({ IS: "76.9n", N: "1.45",  RS: "42.2m", TT: "4.32u", CJO: "39.8p", VJ: "",     M: "0.333", EG: "",     XTI: "",   TNOM: "", BV: "400", IBV: "5u",  FC: "" }),
    "1N4004ds": Object.freeze({ IS: "18.8n", N: "2",     RS: "",      TT: "",      CJO: "30p",   VJ: "",     M: "0.333", EG: "",     XTI: "",   TNOM: "", BV: "400", IBV: "5u",  FC: "" })
  });
  const DIODE_PRESET_KEYS = Object.freeze(Object.keys(DIODE_MODEL_PRESETS));
  const DIODE_PRESET_KEY_SET = new Set(DIODE_PRESET_KEYS);
  const COMPONENT_VALUE_UNITS = Object.freeze({
    R: "\u03a9",
    C: "F",
    L: "H",
    V: "V",
    I: "A",
    VM: "\u03a9",
    AM: "\u03a9",
    SW: "\u03a9"
  });
  const COMPONENT_DEFAULT_TYPES = Object.freeze(["R", "C", "L", "V", "I", "VM", "AM", "SW", "D"]);
  const COMPONENT_DEFAULT_TYPE_SET = new Set(COMPONENT_DEFAULT_TYPES);
  const BUILT_IN_COMPONENT_DEFAULTS = Object.freeze({
    R: Object.freeze({ value: "1k", netColor: null }),
    C: Object.freeze({ value: "1u", netColor: null }),
    L: Object.freeze({ value: "1m", netColor: null }),
    V: Object.freeze({ value: "1", netColor: null }),
    I: Object.freeze({ value: "1", netColor: null }),
    VM: Object.freeze({ value: "", netColor: null }),
    AM: Object.freeze({ value: "", netColor: null }),
    SW: Object.freeze({ value: "", netColor: null }),
    D: Object.freeze({ value: "1N4148", netColor: null })
  });
  const METRIC_PREFIXES = Object.freeze([
    { symbol: "T", exponent: 12 },
    { symbol: "G", exponent: 9 },
    { symbol: "M", exponent: 6 },
    { symbol: "k", exponent: 3 },
    { symbol: "", exponent: 0 },
    { symbol: "m", exponent: -3 },
    { symbol: "\u00b5", exponent: -6 },
    { symbol: "n", exponent: -9 },
    { symbol: "p", exponent: -12 }
  ]);
  const METRIC_MULTIPLIERS = Object.freeze({
    T: 1e12,
    G: 1e9,
    M: 1e6,
    k: 1e3,
    K: 1e3,
    m: 1e-3,
    u: 1e-6,
    "\u00b5": 1e-6,
    n: 1e-9,
    p: 1e-12
  });

  const normalizePoint = (point) => {
    const x = Number(point?.x);
    const y = Number(point?.y);
    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      return null;
    }
    return { x: roundCoord(x), y: roundCoord(y) };
  };

  const coordKey = (point) => `${point.x},${point.y}`;
  const normalizeNodeLabelKey = (value) => String(value ?? "").trim().toLowerCase();
  const normalizeGroundVariant = (value) => {
    const normalized = String(value ?? "").trim().toLowerCase();
    if (GROUND_VARIANT_SET.has(normalized)) {
      return normalized;
    }
    if (normalized === "signal-ground" || normalized === "signalground" || normalized === "signal_ground") {
      return "signal";
    }
    return "earth";
  };
  const listGroundVariants = () => GROUND_VARIANTS.slice();
  const normalizeResistorStyle = (value) => {
    const normalized = String(value ?? "").trim().toLowerCase();
    if (RESISTOR_STYLE_SET.has(normalized)) {
      return normalized;
    }
    if (normalized === "spring" || normalized === "zig-zag" || normalized === "zig_zag") {
      return "zigzag";
    }
    return "zigzag";
  };
  const listResistorStyles = () => RESISTOR_STYLES.slice();
  const normalizeDiodeDisplayType = (value) => {
    const normalized = String(value ?? "").trim().toLowerCase();
    return DIODE_DISPLAY_TYPE_SET.has(normalized) ? normalized : "default";
  };
  const listDiodeDisplayTypes = () => DIODE_DISPLAY_TYPES.slice();
  const normalizeDiodePreset = (value) => {
    const key = String(value ?? "").trim();
    return DIODE_PRESET_KEY_SET.has(key) ? key : "1N4148";
  };
  const getDiodeModelPresets = () => DIODE_MODEL_PRESETS;
  const getDiodePresetKeys = () => DIODE_PRESET_KEYS.slice();
  const getDiodeModelParamKeys = () => DIODE_MODEL_PARAM_KEYS.slice();
  const normalizeDiodeParamValue = (value) => String(value ?? "").trim();
  const normalizeTextOnly = (value) => {
    if (value === true) {
      return true;
    }
    const normalized = String(value ?? "").trim().toLowerCase();
    return normalized === "true" || normalized === "1" || normalized === "yes" || normalized === "on";
  };

  const normalizeNetColor = (value) => {
    if (typeof value !== "string") {
      return null;
    }
    const trimmed = value.trim().toLowerCase();
    if (!/^#[0-9a-f]{6}$/.test(trimmed)) {
      return null;
    }
    return NET_COLOR_SET.has(trimmed) ? trimmed : null;
  };

  const listComponentDefaultTypes = () => COMPONENT_DEFAULT_TYPES.slice();

  const getBuiltInComponentDefaults = () => {
    const clone = {};
    COMPONENT_DEFAULT_TYPES.forEach((type) => {
      const entry = BUILT_IN_COMPONENT_DEFAULTS[type];
      clone[type] = {
        value: String(entry?.value ?? ""),
        netColor: normalizeNetColor(entry?.netColor) ?? null
      };
    });
    return clone;
  };

  const normalizeComponentDefaultTypeKey = (value) => {
    const normalized = String(value ?? "").trim().toUpperCase();
    return COMPONENT_DEFAULT_TYPE_SET.has(normalized) ? normalized : "";
  };

  const normalizeComponentDefaultEntry = (entry, fallbackEntry) => {
    const fallbackValue = String(fallbackEntry?.value ?? "").trim();
    const fallbackColor = normalizeNetColor(fallbackEntry?.netColor) ?? null;
    let rawValue = undefined;
    let rawColor = undefined;
    if (entry && typeof entry === "object" && !Array.isArray(entry)) {
      if (Object.prototype.hasOwnProperty.call(entry, "value")) {
        rawValue = entry.value;
      }
      if (Object.prototype.hasOwnProperty.call(entry, "netColor")) {
        rawColor = entry.netColor;
      }
    } else if (entry !== undefined) {
      rawValue = entry;
    }
    const value = rawValue === undefined
      ? fallbackValue
      : String(rawValue ?? "").trim();
    let netColor = fallbackColor;
    if (rawColor !== undefined) {
      if (rawColor === null || String(rawColor).trim() === "") {
        netColor = null;
      } else {
        netColor = normalizeNetColor(rawColor) ?? fallbackColor;
      }
    }
    return { value, netColor };
  };

  const normalizeComponentDefaults = (value, fallback) => {
    const source = value && typeof value === "object" && !Array.isArray(value)
      ? value
      : {};
    const fallbackSource = fallback && typeof fallback === "object" && !Array.isArray(fallback)
      ? fallback
      : getBuiltInComponentDefaults();
    const sourceByType = {};
    Object.entries(source).forEach(([rawType, rawEntry]) => {
      const type = normalizeComponentDefaultTypeKey(rawType);
      if (!type) {
        return;
      }
      sourceByType[type] = rawEntry;
    });
    const normalized = {};
    COMPONENT_DEFAULT_TYPES.forEach((type) => {
      const fallbackEntry = normalizeComponentDefaultEntry(
        fallbackSource?.[type],
        BUILT_IN_COMPONENT_DEFAULTS[type]
      );
      normalized[type] = normalizeComponentDefaultEntry(sourceByType[type], fallbackEntry);
    });
    return normalized;
  };

  const requireElementClassificationMethod = (name) => {
    const api = typeof self !== "undefined" ? (self.SpjutSimSchematic ?? {}) : {};
    const method = api?.[name];
    if (typeof method !== "function"
      || method === isElectricalComponentType
      || method === isProbeComponentType) {
      throw new Error(`Schematic API missing '${name}'. Check src/schematic/elements.js load order.`);
    }
    return method.bind(api);
  };

  const isElectricalComponentType = (type) => {
    return requireElementClassificationMethod("isElectricalComponentType")(type);
  };

  const isProbeComponentType = (type) => {
    return requireElementClassificationMethod("isProbeComponentType")(type);
  };

  const normalizeTextFont = (value) => {
    if (typeof value !== "string") {
      return DEFAULT_TEXT_FONT;
    }
    const trimmed = value.trim();
    if (!trimmed) {
      return DEFAULT_TEXT_FONT;
    }
    const lowered = trimmed.toLowerCase();
    if (!TEXT_FONT_SET.has(lowered)) {
      return DEFAULT_TEXT_FONT;
    }
    const exact = TEXT_FONT_OPTIONS.find((entry) => entry.toLowerCase() === lowered);
    return exact ?? DEFAULT_TEXT_FONT;
  };

  const normalizeTextSize = (value) => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      return DEFAULT_TEXT_SIZE;
    }
    const rounded = Math.round(parsed);
    if (rounded < MIN_TEXT_SIZE) {
      return MIN_TEXT_SIZE;
    }
    if (rounded > MAX_TEXT_SIZE) {
      return MAX_TEXT_SIZE;
    }
    return rounded;
  };

  const normalizeTextStyleToggle = (value) => value === true;

  const escapeRegExp = (value) => String(value ?? "").replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");

  const stripUnitSuffix = (value, unit) => {
    if (!unit) {
      return value;
    }
    const pattern = new RegExp(`${escapeRegExp(unit)}$`, "i");
    return value.replace(pattern, "").trim();
  };

  const parseMetricValue = (raw, unit) => {
    if (!raw) {
      return null;
    }
    const trimmed = stripUnitSuffix(String(raw).trim(), unit);
    if (!trimmed) {
      return null;
    }
    const metricMatch = trimmed.match(
      /^([-+]?\d*\.?\d+(?:[eE][-+]?\d+)?)(?:\s*([TGMkKmunp\u00b5]))?$/
    );
    if (metricMatch) {
      const numeric = Number(metricMatch[1]);
      if (Number.isFinite(numeric)) {
        const prefixKey = metricMatch[2] || "";
        const multiplier = METRIC_MULTIPLIERS[prefixKey] ?? 1;
        return numeric * multiplier;
      }
    }
    const fallback = Number(trimmed);
    return Number.isFinite(fallback) ? fallback : null;
  };

  const formatMetricValue = (value) => {
    const formatMetricNumber = (numeric) => {
      const normalized = Number.parseFloat(Number(numeric).toPrecision(12));
      if (!Number.isFinite(normalized)) {
        return Number(numeric).toString();
      }
      if (Object.is(normalized, -0)) {
        return "0";
      }
      return normalized.toString();
    };
    if (!Number.isFinite(value)) {
      return null;
    }
    if (value === 0) {
      return { number: "0", prefix: "" };
    }
    const absValue = Math.abs(value);
    let selected = METRIC_PREFIXES[METRIC_PREFIXES.length - 1];
    for (const entry of METRIC_PREFIXES) {
      const threshold = Math.pow(10, entry.exponent);
      if (absValue >= threshold) {
        selected = entry;
        break;
      }
    }
    const factor = Math.pow(10, selected.exponent);
    const scaled = value / factor;
    return { number: formatMetricNumber(scaled), prefix: selected.symbol };
  };

  const formatWithUnit = (display, unit, prefix) => {
    const unitText = prefix ? `${prefix}${unit ?? ""}` : (unit ?? "");
    if (!unitText) {
      return display;
    }
    return `${display} ${unitText}`.trim();
  };

  const getComponentValueUnit = (type) => {
    const normalized = String(type ?? "").toUpperCase();
    return COMPONENT_VALUE_UNITS[normalized] ?? "";
  };

  const parseSwitchBooleanToken = (name, rawValue) => {
    const normalized = String(rawValue ?? "").trim().toLowerCase();
    if (!normalized) {
      throw new Error(`Switch token '${name}=' requires a boolean value.`);
    }
    if (normalized === "1" || normalized === "true" || normalized === "on" || normalized === "yes") {
      return true;
    }
    if (normalized === "0" || normalized === "false" || normalized === "off" || normalized === "no") {
      return false;
    }
    throw new Error(`Switch token '${name}=' must be true/false.`);
  };

  function parseSpdtSwitchValue(value) {
    const tokens = String(value ?? "")
      .split(/[\s,;]+/)
      .map((token) => token.trim())
      .filter(Boolean);
    let activeThrow = "A";
    let ron = "0";
    let roff = null;
    let showRon = false;
    let showRoff = false;
    for (const token of tokens) {
      const lowered = token.toLowerCase();
      if (lowered === "a") {
        activeThrow = "A";
        continue;
      }
      if (lowered === "b") {
        activeThrow = "B";
        continue;
      }
      if (lowered === "showron") {
        showRon = true;
        continue;
      }
      if (lowered === "hideron") {
        showRon = false;
        continue;
      }
      if (lowered === "showroff") {
        showRoff = true;
        continue;
      }
      if (lowered === "hideroff") {
        showRoff = false;
        continue;
      }
      const ronMatch = /^ron=(.*)$/i.exec(token);
      if (ronMatch) {
        const parsedRon = String(ronMatch[1] ?? "").trim();
        if (!parsedRon) {
          throw new Error("Switch token 'ron=' requires a value.");
        }
        ron = parsedRon;
        continue;
      }
      const roffMatch = /^roff=(.*)$/i.exec(token);
      if (roffMatch) {
        const parsedRoff = String(roffMatch[1] ?? "").trim();
        if (!parsedRoff) {
          throw new Error("Switch token 'roff=' requires a value.");
        }
        roff = parsedRoff;
        continue;
      }
      const showRonMatch = /^showron=(.*)$/i.exec(token);
      if (showRonMatch) {
        showRon = parseSwitchBooleanToken("showron", showRonMatch[1]);
        continue;
      }
      const showRoffMatch = /^showroff=(.*)$/i.exec(token);
      if (showRoffMatch) {
        showRoff = parseSwitchBooleanToken("showroff", showRoffMatch[1]);
        continue;
      }
      throw new Error(
        `Unknown switch token '${token}'. Allowed tokens: A, B, ron=<value>, roff=<value>, showron/showroff, hideron/hideroff.`
      );
    }
    return {
      activeThrow,
      ron,
      roff,
      showRon,
      showRoff
    };
  }

  const formatComponentDisplayValue = (component) => {
    const raw = String(component?.value ?? "");
    const trimmed = raw.trim();
    if (!trimmed) {
      return "";
    }
    if (String(component?.type ?? "").toUpperCase() === "SW") {
      const formatSwitchResistanceDisplay = (value) => {
        const unit = getComponentValueUnit("SW");
        const trimmedValue = String(value ?? "").trim();
        if (trimmedValue.toLowerCase() === "open") {
          return "open";
        }
        const numeric = parseMetricValue(trimmedValue, unit);
        if (numeric !== null) {
          const formatted = formatMetricValue(numeric);
          if (formatted) {
            return formatWithUnit(formatted.number, unit, formatted.prefix);
          }
        }
        const fallback = stripUnitSuffix(trimmedValue, unit);
        if (!fallback) {
          return unit;
        }
        return `${fallback} ${unit}`;
      };
      const fallbackValue = trimmed.replace(/\s+/g, " ").trim();
      try {
        const parsed = parseSpdtSwitchValue(component?.value);
        const parts = [String(parsed?.activeThrow ?? "A").toUpperCase() === "B" ? "B" : "A"];
        if (parsed?.showRon === true) {
          parts.push(`Ron=${formatSwitchResistanceDisplay(String(parsed?.ron ?? "0").trim() || "0")}`);
        }
        if (parsed?.showRoff === true) {
          const roffValue = parsed?.roff === null || parsed?.roff === undefined
            ? "open"
            : formatSwitchResistanceDisplay(String(parsed.roff).trim() || "open");
          parts.push(`Roff=${roffValue}`);
        }
        return parts.join(" ");
      } catch {
        return fallbackValue;
      }
    }
    const unit = getComponentValueUnit(component?.type);
    const numeric = parseMetricValue(trimmed, unit);
    if (numeric !== null) {
      const formatted = formatMetricValue(numeric);
      if (formatted) {
        return formatWithUnit(formatted.number, unit, formatted.prefix);
      }
    }
    const fallbackValue = trimmed.replace(/\s+/g, " ").trim();
    if (!unit) {
      return fallbackValue;
    }
    const withoutUnit = stripUnitSuffix(fallbackValue, unit);
    if (!withoutUnit) {
      return unit;
    }
    return `${withoutUnit} ${unit}`;
  };

  const getMeasurementTextWeight = () => DEFAULT_MEASUREMENT_TEXT_WEIGHT;
  const getDefaultComponentLabelLayout = () => ({
    lineHeight: DEFAULT_COMPONENT_LABEL_LAYOUT.lineHeight,
    padding: DEFAULT_COMPONENT_LABEL_LAYOUT.padding,
    paddingBelow: DEFAULT_COMPONENT_LABEL_LAYOUT.paddingBelow
  });
  const snapQuarterRotation = (angle) => {
    if (!Number.isFinite(angle)) {
      return 0;
    }
    const snapped = Math.round(angle / 90) * 90;
    return ((snapped % 360) + 360) % 360;
  };
  const normalizeProbeDiffRotations = (value, fallbackRotation) => {
    const fallback = snapQuarterRotation(Number(fallbackRotation));
    const source = value && typeof value === "object"
      ? value
      : null;
    const posRaw = source
      ? (source["P+"] ?? source.pos ?? source.plus)
      : null;
    const negRaw = source
      ? (source["P-"] ?? source.neg ?? source.minus)
      : null;
    return {
      "P+": Number.isFinite(Number(posRaw)) ? snapQuarterRotation(Number(posRaw)) : fallback,
      "P-": Number.isFinite(Number(negRaw)) ? snapQuarterRotation(Number(negRaw)) : fallback
    };
  };
  const getComponentLabelLayout = (midX, midY, angle, lineCount, labelRotation) => {
    const safeMidX = Number.isFinite(Number(midX)) ? Number(midX) : 0;
    const safeMidY = Number.isFinite(Number(midY)) ? Number(midY) : 0;
    const safeLineCount = Math.max(1, Math.round(Number(lineCount) || 1));
    const rotation = snapQuarterRotation((Number(angle) || 0) + (Number(labelRotation) || 0));
    const blockOffset = (safeLineCount - 1) * DEFAULT_COMPONENT_LABEL_LAYOUT.lineHeight;
    let x = safeMidX;
    let y = safeMidY;
    let anchor = "middle";
    if (rotation === 0) {
      x = safeMidX;
      y = safeMidY - DEFAULT_COMPONENT_LABEL_LAYOUT.padding - blockOffset;
      anchor = "middle";
    } else if (rotation === 90) {
      x = safeMidX + DEFAULT_COMPONENT_LABEL_LAYOUT.padding;
      y = safeMidY - blockOffset / 2;
      anchor = "start";
    } else if (rotation === 180) {
      x = safeMidX;
      y = safeMidY + DEFAULT_COMPONENT_LABEL_LAYOUT.padding;
      anchor = "middle";
    } else {
      x = safeMidX - DEFAULT_COMPONENT_LABEL_LAYOUT.padding;
      y = safeMidY - blockOffset / 2;
      anchor = "end";
    }
    return {
      x,
      y,
      anchor,
      lineHeight: DEFAULT_COMPONENT_LABEL_LAYOUT.lineHeight
    };
  };
  const getDefaultComponentTextColors = () => ({
    label: DEFAULT_COMPONENT_TEXT_COLORS.label,
    value: DEFAULT_COMPONENT_TEXT_COLORS.value
  });

  /** @returns {SchematicModel} */
  const createModel = () => ({
    components: [],
    wires: []
  });

  const COMPONENT_PROPERTY_NORMALIZERS = Object.freeze({
    normalizeGroundVariant,
    normalizeResistorStyle,
    normalizeDiodeDisplayType,
    normalizeDiodePreset,
    normalizeDiodeParamValue,
    normalizeTextOnly,
    normalizeTextFont,
    normalizeTextSize,
    normalizeTextStyleToggle
  });

  const getRegisteredElementProperties = (type) => {
    const catalog = typeof self !== "undefined" ? self.SpjutSimSchematicElementCatalog : null;
    if (!catalog || typeof catalog.getRegisteredElementDefinition !== "function") {
      return [];
    }
    const definition = catalog.getRegisteredElementDefinition(type);
    return Array.isArray(definition?.properties) ? definition.properties : [];
  };

  const applyRegisteredElementProperties = (target, source, type) => {
    const properties = getRegisteredElementProperties(type);
    if (!properties.length) {
      return;
    }
    properties.forEach((property) => {
      const key = String(property?.key ?? "");
      if (!key || Object.prototype.hasOwnProperty.call(target, key)) {
        return;
      }
      if (!Object.prototype.hasOwnProperty.call(source, key)) {
        return;
      }
      const normalizeMethod = String(property?.normalizeMethod ?? "");
      const normalizer = COMPONENT_PROPERTY_NORMALIZERS[normalizeMethod];
      if (typeof normalizer !== "function") {
        throw new Error(`Unsupported normalize method '${normalizeMethod}' for component property '${key}'.`);
      }
      const normalizedValue = normalizer(source[key]);
      if (String(property?.control ?? "").toLowerCase() === "toggle") {
        if (normalizedValue === true) {
          target[key] = true;
        }
        return;
      }
      if (normalizedValue === undefined || normalizedValue === null) {
        return;
      }
      target[key] = normalizedValue;
    });
  };

  /**
   * @param {SchematicModel} model
   * @param {Component} component
   * @returns {Component}
   */
  const addComponent = (model, component) => {
    if (!model || !component) {
      return component;
    }
    const pins = Array.isArray(component.pins) ? component.pins : [];
    const normalizedPins = pins.map((pin) => {
      const point = normalizePoint(pin);
      return {
        id: String(pin.id ?? ""),
        name: String(pin.name ?? pin.id ?? ""),
        x: point?.x ?? 0,
        y: point?.y ?? 0
      };
    });
    const type = String(component.type ?? "").toUpperCase();
    const isLegacyDashedBox = type === "DBOX";
    const normalizedType = isLegacyDashedBox ? "BOX" : String(component.type ?? "");
    const rawValue = Object.prototype.hasOwnProperty.call(component, "value")
      ? String(component.value ?? "")
      : (COMPONENT_DEFAULT_TYPE_SET.has(type)
        ? String(BUILT_IN_COMPONENT_DEFAULTS[type]?.value ?? "")
        : "");
    const normalizedValue = isLegacyDashedBox && !/\bline\s*=/.test(rawValue)
      ? (rawValue ? `${rawValue} line=dashed` : "line=dashed")
      : rawValue;
    const normalized = {
      id: String(component.id ?? ""),
      name: Object.prototype.hasOwnProperty.call(component, "name")
        ? String(component.name ?? "")
        : String(component.id ?? ""),
      type: normalizedType,
      value: normalizedValue,
      pins: normalizedPins
    };
    const rotation = Number(component.rotation);
    if (Number.isFinite(rotation)) {
      normalized.rotation = rotation;
    }
    const labelRotation = Number(component.labelRotation);
    if (Number.isFinite(labelRotation)) {
      normalized.labelRotation = labelRotation;
    }
    if (type === "PD") {
      normalized.probeDiffRotations = normalizeProbeDiffRotations(component.probeDiffRotations, rotation);
    }
    if (type === "GND") {
      normalized.groundVariant = normalizeGroundVariant(component.groundVariant);
    }
    if (type === "R") {
      normalized.resistorStyle = normalizeResistorStyle(component.resistorStyle);
    }
    const netColor = normalizeNetColor(component.netColor);
    if (netColor) {
      normalized.netColor = netColor;
    }
    if (normalizeTextOnly(component.textOnly)) {
      normalized.textOnly = true;
    }
    if (type === "TEXT") {
      normalized.textFont = normalizeTextFont(component.textFont);
      normalized.textSize = normalizeTextSize(component.textSize);
      if (normalizeTextStyleToggle(component.textBold)) {
        normalized.textBold = true;
      }
      if (normalizeTextStyleToggle(component.textItalic)) {
        normalized.textItalic = true;
      }
      if (normalizeTextStyleToggle(component.textUnderline)) {
        normalized.textUnderline = true;
      }
    }
    applyRegisteredElementProperties(normalized, component, type);
    model.components.push(normalized);
    return normalized;
  };

  /**
   * @param {SchematicModel} model
   * @param {Wire} wire
   * @returns {Wire}
   */
  const addWire = (model, wire) => {
    if (!model || !wire) {
      return wire;
    }
    const points = Array.isArray(wire.points) ? wire.points : [];
    const normalizedPoints = points.map(normalizePoint).filter(Boolean);
    const normalized = {
      id: String(wire.id ?? ""),
      points: normalizedPoints
    };
    const netColor = normalizeNetColor(wire.netColor);
    if (netColor) {
      normalized.netColor = netColor;
    }
    model.wires.push(normalized);
    return normalized;
  };

  /**
   * @param {SchematicModel} model
   * @returns {Net[]}
   */
  const buildNets = (model) => {
    const nodes = new Map();
    const edges = new Map();

    const ensureNode = (point) => {
      const key = coordKey(point);
      if (!nodes.has(key)) {
        nodes.set(key, { x: point.x, y: point.y, pins: [] });
      }
      if (!edges.has(key)) {
        edges.set(key, new Set());
      }
      return key;
    };

    const connect = (aKey, bKey) => {
      if (!aKey || !bKey) {
        return;
      }
      edges.get(aKey)?.add(bKey);
      edges.get(bKey)?.add(aKey);
    };

    (model?.wires ?? []).forEach((wire) => {
      const points = Array.isArray(wire.points) ? wire.points : [];
      for (let index = 0; index < points.length; index += 1) {
        const point = normalizePoint(points[index]);
        if (!point) {
          continue;
        }
        const key = ensureNode(point);
        if (index > 0) {
          const prev = normalizePoint(points[index - 1]);
          if (prev) {
            connect(key, ensureNode(prev));
          }
        }
      }
    });

    (model?.components ?? []).forEach((component) => {
      if (!isElectricalComponentType(component?.type)) {
        return;
      }
      (component.pins ?? []).forEach((pin) => {
        const point = normalizePoint(pin);
        if (!point) {
          return;
        }
        const key = ensureNode(point);
        const node = nodes.get(key);
        if (node) {
          node.pins.push({
            componentId: String(component.id ?? ""),
            pinId: String(pin.id ?? ""),
            name: String(pin.name ?? pin.id ?? ""),
            x: point.x,
            y: point.y
          });
        }
      });
    });

    const visited = new Set();
    const nets = [];
    for (const [key, node] of nodes.entries()) {
      if (visited.has(key)) {
        continue;
      }
      const stack = [key];
      const netNodes = [];
      const netPins = [];
      visited.add(key);
      while (stack.length) {
        const current = stack.pop();
        const currentNode = nodes.get(current);
        if (!currentNode) {
          continue;
        }
        netNodes.push({ x: currentNode.x, y: currentNode.y });
        if (currentNode.pins.length) {
          netPins.push(...currentNode.pins);
        }
        const neighbors = edges.get(current);
        if (neighbors) {
          neighbors.forEach((neighbor) => {
            if (!visited.has(neighbor)) {
              visited.add(neighbor);
              stack.push(neighbor);
            }
          });
        }
      }
      if (netPins.length) {
        nets.push({
          id: `N${nets.length + 1}`,
          nodes: netNodes,
          pins: netPins
        });
      }
    }
    return nets;
  };

  const resolveNetColors = (model) => {
    const nets = buildNets(model);
    if (!nets.length) {
      return {
        wireColors: {},
        netColors: {}
      };
    }
    const componentMap = new Map((model?.components ?? []).map((component) => [String(component?.id ?? ""), component]));
    const pointToNetIndex = new Map();
    nets.forEach((net, index) => {
      (net.nodes ?? []).forEach((node) => {
        const point = normalizePoint(node);
        if (!point) {
          return;
        }
        pointToNetIndex.set(coordKey(point), index);
      });
    });

    const parent = nets.map((_, index) => index);
    const findRoot = (index) => {
      let cursor = index;
      while (parent[cursor] !== cursor) {
        parent[cursor] = parent[parent[cursor]];
        cursor = parent[cursor];
      }
      return cursor;
    };
    const unionRoots = (first, second) => {
      const rootFirst = findRoot(first);
      const rootSecond = findRoot(second);
      if (rootFirst === rootSecond) {
        return;
      }
      parent[rootSecond] = rootFirst;
    };

    const labeledRootByKey = new Map();
    nets.forEach((net, index) => {
      const labels = new Set();
      (net.pins ?? []).forEach((pin) => {
        const component = componentMap.get(String(pin.componentId ?? ""));
        if (!component || String(component.type ?? "").toUpperCase() !== "NET") {
          return;
        }
        const labelKey = normalizeNodeLabelKey(
          Object.prototype.hasOwnProperty.call(component, "name")
            ? component.name
            : component.id
        );
        if (!labelKey) {
          return;
        }
        labels.add(labelKey);
      });
      labels.forEach((labelKey) => {
        const existing = labeledRootByKey.get(labelKey);
        if (Number.isFinite(existing)) {
          unionRoots(index, existing);
        } else {
          labeledRootByKey.set(labelKey, index);
        }
      });
    });

    const colorByRoot = new Map();
    (model?.components ?? []).forEach((component) => {
      if (!component || String(component.type ?? "").toUpperCase() !== "NET") {
        return;
      }
      const color = normalizeNetColor(component.netColor);
      if (!color) {
        return;
      }
      const pin = Array.isArray(component.pins) ? component.pins[0] : null;
      const point = normalizePoint(pin);
      if (!point) {
        return;
      }
      const netIndex = pointToNetIndex.get(coordKey(point));
      if (!Number.isFinite(netIndex)) {
        return;
      }
      const root = findRoot(netIndex);
      if (!colorByRoot.has(root)) {
        colorByRoot.set(root, color);
      }
    });

    const netColors = {};
    nets.forEach((net, index) => {
      const root = findRoot(index);
      const color = colorByRoot.get(root);
      if (!color) {
        return;
      }
      (net.pins ?? []).forEach((pin) => {
        const componentId = String(pin.componentId ?? "");
        const component = componentMap.get(componentId);
        if (!component || String(component.type ?? "").toUpperCase() !== "NET") {
          return;
        }
        netColors[componentId] = color;
      });
    });

    const wireColors = {};
    (model?.wires ?? []).forEach((wire) => {
      const points = Array.isArray(wire?.points) ? wire.points : [];
      let wireColor = null;
      for (let index = 0; index < points.length; index += 1) {
        const point = normalizePoint(points[index]);
        if (!point) {
          continue;
        }
        const netIndex = pointToNetIndex.get(coordKey(point));
        if (!Number.isFinite(netIndex)) {
          continue;
        }
        const root = findRoot(netIndex);
        const rootColor = colorByRoot.get(root);
        if (rootColor) {
          wireColor = rootColor;
          break;
        }
      }
      if (wireColor) {
        wireColors[String(wire.id ?? "")] = wireColor;
      }
    });

    return {
      wireColors,
      netColors
    };
  };

  self.SpjutSimSchematic = {
    createModel,
    addComponent,
    addWire,
    buildNets,
    isElectricalComponentType,
    isProbeComponentType,
    getNetColorPalette: () => NET_COLOR_PALETTE.slice(),
    normalizeNetColor,
    listComponentDefaultTypes,
    getBuiltInComponentDefaults,
    normalizeComponentDefaults,
    normalizeGroundVariant,
    listGroundVariants,
    normalizeResistorStyle,
    listResistorStyles,
    normalizeDiodeDisplayType,
    listDiodeDisplayTypes,
    normalizeDiodePreset,
    getDiodeModelPresets,
    getDiodePresetKeys,
    getDiodeModelParamKeys,
    normalizeDiodeParamValue,
    normalizeTextOnly,
    resolveNetColors,
    getTextFontOptions: () => TEXT_FONT_OPTIONS.slice(),
    normalizeTextFont,
    normalizeTextSize,
    normalizeTextStyleToggle,
    normalizeProbeDiffRotations,
    getDefaultComponentLabelLayout,
    getComponentLabelLayout,
    getDefaultComponentTextColors,
    getComponentValueUnit,
    formatComponentDisplayValue,
    parseSpdtSwitchValue,
    getMeasurementTextWeight,
    getDefaultTextStyle: () => ({
      font: DEFAULT_TEXT_FONT,
      size: DEFAULT_TEXT_SIZE,
      bold: false,
      italic: false,
      underline: false
    })
  };
})();
