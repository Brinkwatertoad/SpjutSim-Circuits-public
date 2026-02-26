/**
 * @typedef {{ id: string, name: string, x: number, y: number }} Pin
 * @typedef {{ id: string, name?: string, type: string, value?: string, netColor?: string, textOnly?: boolean, textFont?: string, textSize?: number, textBold?: boolean, textItalic?: boolean, textUnderline?: boolean, rotation?: number, labelRotation?: number, probeDiffRotations?: { "P+"?: number, "P-"?: number }, pins: Pin[] }} Component
 * @typedef {{ id: string, points: { x: number, y: number }[] }} Wire
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
  const PROBE_COMPONENT_TYPES = new Set(["PV", "PI", "PD", "PP"]);
  const NON_ELECTRICAL_COMPONENT_TYPES = new Set(["TEXT", ...PROBE_COMPONENT_TYPES]);
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
    paddingBelow: 24
  });
  const DEFAULT_COMPONENT_TEXT_COLORS = Object.freeze({
    label: "#1d1d1f",
    value: "#5b5750"
  });
  const COMPONENT_VALUE_UNITS = Object.freeze({
    R: "\u03a9",
    C: "F",
    L: "H",
    V: "V",
    I: "A",
    VM: "\u03a9",
    AM: "\u03a9"
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

  const isElectricalComponentType = (type) => {
    const normalized = String(type ?? "").toUpperCase();
    return !NON_ELECTRICAL_COMPONENT_TYPES.has(normalized);
  };

  const isProbeComponentType = (type) => {
    const normalized = String(type ?? "").toUpperCase();
    return PROBE_COMPONENT_TYPES.has(normalized);
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
    return { number: scaled.toString(), prefix: selected.symbol };
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
      const fallbackValue = trimmed.replace(/\s+/g, " ").trim();
      try {
        const parsed = parseSpdtSwitchValue(component?.value);
        const parts = [String(parsed?.activeThrow ?? "A").toUpperCase() === "B" ? "B" : "A"];
        if (parsed?.showRon === true) {
          parts.push(`Ron=${String(parsed?.ron ?? "0").trim() || "0"}`);
        }
        if (parsed?.showRoff === true) {
          const roffValue = parsed?.roff === null || parsed?.roff === undefined
            ? "open"
            : (String(parsed.roff).trim() || "open");
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
      y = safeMidY + DEFAULT_COMPONENT_LABEL_LAYOUT.paddingBelow;
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
    const normalized = {
      id: String(component.id ?? ""),
      name: Object.prototype.hasOwnProperty.call(component, "name")
        ? String(component.name ?? "")
        : String(component.id ?? ""),
      type: String(component.type ?? ""),
      value: component.value ? String(component.value) : "",
      pins: normalizedPins
    };
    const type = String(component.type ?? "").toUpperCase();
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
    const netColor = normalizeNetColor(component.netColor);
    if (netColor) {
      normalized.netColor = netColor;
    }
    if (component.textOnly === true) {
      normalized.textOnly = true;
    }
    if (type === "TEXT") {
      normalized.textFont = normalizeTextFont(component.textFont);
      normalized.textSize = normalizeTextSize(component.textSize);
      if (component.textBold === true) {
        normalized.textBold = true;
      }
      if (component.textItalic === true) {
        normalized.textItalic = true;
      }
      if (component.textUnderline === true) {
        normalized.textUnderline = true;
      }
    }
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
    resolveNetColors,
    getTextFontOptions: () => TEXT_FONT_OPTIONS.slice(),
    normalizeTextFont,
    normalizeTextSize,
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
