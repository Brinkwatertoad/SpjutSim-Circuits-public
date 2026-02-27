/**
 * @typedef {{ id: string, name?: string, type: string, value?: string, netColor?: string, textOnly?: boolean, textFont?: string, textSize?: number, textBold?: boolean, textItalic?: boolean, textUnderline?: boolean, rotation?: number, labelRotation?: number, probeDiffRotations?: { "P+"?: number, "P-"?: number }, pins: { id: string, name: string, x: number, y: number }[] }} Component
 * @typedef {{ components: Component[], wires: { id: string, points: { x: number, y: number }[] }[] }} SchematicModel
 */

(function initSchematicEditor() {
  const SVG_NS = "http://www.w3.org/2000/svg";
  const STROKE = "#1d1d1f";
  const PROBE_INVALID_COLOR = "#da1e28";
  const DEFAULT_EXTERNAL_HIGHLIGHT_COLOR = "#ff832b";
  const STROKE_WIDTH = 2;
  const GRID_MINOR = "#ebe6dd";
  const GRID_MAJOR = "#d8d1c6";
  const CANVAS_BG = "#fbfaf7";
  const DEFAULT_VIEW = { x: 0, y: 0, width: 800, height: 500 };
  const MIN_VIEW_WIDTH = 200;
  const MAX_VIEW_WIDTH = 2000;
  const MIN_VIEW_HEIGHT = 120;
  const MAX_VIEW_HEIGHT = 1500;
  const DEFAULT_GRID = { size: 20, snap: true, visible: true };
  const PIN_HIT_RADIUS = 8;
  const WIRE_HIT_RADIUS = 10;
  const DRAG_DEADZONE_PX = 4;
  const DOUBLE_CLICK_INTERVAL_MS = 400;
  const DOUBLE_CLICK_DISTANCE_PX = 8;
  const TOUCH_PINCH_MIN_DISTANCE_PX = 12;
  const TOUCH_PINCH_DISTANCE_DEADZONE_PX = 4;
  const IDENTITY_TRANSFORM = { a: 1, b: 0, c: 0, d: 1 };
  const ROTATE_CW = { a: 0, b: -1, c: 1, d: 0 };
  const ROTATE_CCW = { a: 0, b: 1, c: -1, d: 0 };
  const FLIP_H = { a: -1, b: 0, c: 0, d: 1 };
  const FLIP_V = { a: 1, b: 0, c: 0, d: -1 };
  const SELECTION_PLACEMENT_TOOL = "__SELECTION_PLACEMENT__";
  const schematicApi = typeof self !== "undefined" ? (self.SpjutSimSchematic ?? {}) : {};

  const setAttrs = (el, attrs) => {
    Object.entries(attrs).forEach(([key, value]) => {
      el.setAttribute(key, String(value));
    });
    return el;
  };

  const ensureSvg = (container) => {
    let svg = container.querySelector(".schematic-editor");
    if (!svg) {
      svg = document.createElementNS(SVG_NS, "svg");
      svg.setAttribute("class", "schematic-editor");
      svg.setAttribute("width", "100%");
      svg.setAttribute("height", "420");
      container.appendChild(svg);
    }
    return svg;
  };

  const ensureGroup = (svg, className) => {
    let group = svg.querySelector(`.${className}`);
    if (!group) {
      group = document.createElementNS(SVG_NS, "g");
      group.setAttribute("class", className);
      svg.appendChild(group);
    }
    return group;
  };

  const clearGroup = (group) => {
    while (group.firstChild) {
      group.removeChild(group.firstChild);
    }
  };

  const appendLine = (group, x1, y1, x2, y2, options) => {
    const line = document.createElementNS(SVG_NS, "line");
    setAttrs(line, {
      x1,
      y1,
      x2,
      y2,
      stroke: options?.stroke ?? STROKE,
      "stroke-width": options?.width ?? STROKE_WIDTH,
      "stroke-linecap": options?.cap ?? "round"
    });
    group.appendChild(line);
    return line;
  };

  const appendCircle = (group, cx, cy, r, options) => {
    const circle = document.createElementNS(SVG_NS, "circle");
    setAttrs(circle, {
      cx,
      cy,
      r,
      stroke: options?.stroke ?? STROKE,
      "stroke-width": options?.width ?? STROKE_WIDTH,
      fill: options?.fill ?? "none"
    });
    group.appendChild(circle);
    return circle;
  };

  const appendPolyline = (group, points, options) => {
    const poly = document.createElementNS(SVG_NS, "polyline");
    setAttrs(poly, {
      points,
      fill: "none",
      stroke: options?.stroke ?? STROKE,
      "stroke-width": options?.width ?? STROKE_WIDTH,
      "stroke-linejoin": options?.join ?? "round"
    });
    group.appendChild(poly);
    return poly;
  };

  const appendPath = (group, d, options) => {
    const path = document.createElementNS(SVG_NS, "path");
    setAttrs(path, {
      d,
      fill: "none",
      stroke: options?.stroke ?? STROKE,
      "stroke-width": options?.width ?? STROKE_WIDTH,
      "stroke-linecap": options?.cap ?? "round",
      "stroke-linejoin": options?.join ?? "round"
    });
    group.appendChild(path);
    return path;
  };

  const appendText = (group, x, y, text, options) => {
    const label = document.createElementNS(SVG_NS, "text");
    const attrs = {
      x,
      y,
      "font-size": options?.size ?? 12,
      fill: options?.fill ?? STROKE,
      "text-anchor": options?.anchor ?? "start"
    };
    if (Number.isFinite(options?.weight)) {
      attrs["font-weight"] = options.weight;
    }
    if (options?.baseline) {
      attrs["dominant-baseline"] = options.baseline;
    }
    if (options?.transform) {
      attrs.transform = options.transform;
    }
    setAttrs(label, attrs);
    label.textContent = text;
    group.appendChild(label);
    return label;
  };

  const NET_LABEL_BOUNDS_PAD = 6;
  const requireSchematicMethod = (name) => {
    const method = schematicApi?.[name];
    if (typeof method !== "function") {
      throw new Error(`Schematic API missing '${name}'. Check src/schematic/model.js load order.`);
    }
    return method.bind(schematicApi);
  };

  const textStyleApi = Object.freeze({
    normalizeTextFont: requireSchematicMethod("normalizeTextFont"),
    normalizeTextSize: requireSchematicMethod("normalizeTextSize"),
    getDefaultTextStyle: requireSchematicMethod("getDefaultTextStyle"),
    getDefaultComponentTextColors: requireSchematicMethod("getDefaultComponentTextColors"),
    isElectricalComponentType: requireSchematicMethod("isElectricalComponentType"),
    isProbeComponentType: requireSchematicMethod("isProbeComponentType")
  });
  const valueFormatApi = Object.freeze({
    formatComponentDisplayValue: requireSchematicMethod("formatComponentDisplayValue"),
    getMeasurementTextWeight: requireSchematicMethod("getMeasurementTextWeight")
  });
  const labelLayoutApi = Object.freeze({
    getDefaultComponentLabelLayout: requireSchematicMethod("getDefaultComponentLabelLayout"),
    getComponentLabelLayout: requireSchematicMethod("getComponentLabelLayout")
  });
  const parseSpdtSwitchValue = requireSchematicMethod("parseSpdtSwitchValue");

  const normalizeTextFontValue = (value) => textStyleApi.normalizeTextFont(value);
  const normalizeTextSizeValue = (value) => textStyleApi.normalizeTextSize(value);
  const isElectricalComponentType = (type) => textStyleApi.isElectricalComponentType(type);
  const isProbeComponentType = (type) => textStyleApi.isProbeComponentType(type);

  const DEFAULT_TEXT_STYLE = (() => {
    const style = textStyleApi.getDefaultTextStyle();
    if (!style || typeof style !== "object") {
      throw new Error("Schematic API getDefaultTextStyle() returned invalid payload.");
    }
    return {
      font: normalizeTextFontValue(style.font),
      size: normalizeTextSizeValue(style.size),
      bold: style.bold === true,
      italic: style.italic === true,
      underline: style.underline === true
    };
  })();
  const DEFAULT_TEXT_FONT = DEFAULT_TEXT_STYLE.font;
  const DEFAULT_TEXT_SIZE = DEFAULT_TEXT_STYLE.size;
  const DEFAULT_COMPONENT_TEXT_COLORS = (() => {
    const colors = textStyleApi.getDefaultComponentTextColors();
    if (!colors || typeof colors !== "object") {
      throw new Error("Schematic API getDefaultComponentTextColors() returned invalid payload.");
    }
    const label = String(colors.label ?? "").trim();
    const value = String(colors.value ?? "").trim();
    if (!label || !value) {
      throw new Error("Schematic API getDefaultComponentTextColors() returned missing label/value colors.");
    }
    return { label, value };
  })();
  const COMPONENT_LABEL_LAYOUT_DEFAULTS = (() => {
    const layout = labelLayoutApi.getDefaultComponentLabelLayout();
    if (!layout || typeof layout !== "object") {
      throw new Error("Schematic API getDefaultComponentLabelLayout() returned invalid payload.");
    }
    const lineHeight = Number(layout.lineHeight);
    const padding = Number(layout.padding);
    const paddingBelow = Number(layout.paddingBelow);
    if (!Number.isFinite(lineHeight) || lineHeight <= 0 || !Number.isFinite(padding) || !Number.isFinite(paddingBelow)) {
      throw new Error("Schematic API getDefaultComponentLabelLayout() returned invalid geometry.");
    }
    return { lineHeight, padding, paddingBelow };
  })();
  const LABEL_LINE_HEIGHT = COMPONENT_LABEL_LAYOUT_DEFAULTS.lineHeight;
  const rawMeasurementTextWeight = Number(valueFormatApi.getMeasurementTextWeight());
  const MEASUREMENT_TEXT_WEIGHT = Number.isFinite(rawMeasurementTextWeight)
    ? rawMeasurementTextWeight
    : 400;

  const normalizeComponentColorValue = (value) => {
    if (typeof schematicApi?.normalizeNetColor !== "function") {
      return null;
    }
    return schematicApi.normalizeNetColor(value);
  };

  const snapRotation = (angle) => {
    if (!Number.isFinite(angle)) {
      return 0;
    }
    const snapped = Math.round(angle / 90) * 90;
    return ((snapped % 360) + 360) % 360;
  };

  const getLabelLayout = (midX, midY, angle, lineCount, labelRotation) =>
    labelLayoutApi.getComponentLabelLayout(midX, midY, angle, lineCount, labelRotation);

  const formatDisplayValue = (component) => valueFormatApi.formatComponentDisplayValue(component);

  const getDisplayName = (component) => {
    if (!component) {
      return "";
    }
    if (Object.prototype.hasOwnProperty.call(component, "name")) {
      return String(component.name ?? "");
    }
    return String(component.id ?? "");
  };

  const getTextAnnotationText = (component) => {
    const text = getDisplayName(component).trim();
    return text || "Text";
  };

  const getTextAnnotationStyle = (component, options) => {
    const forcedColor = options?.labelColor ?? options?.stroke ?? null;
    const font = normalizeTextFontValue(component?.textFont);
    const size = normalizeTextSizeValue(component?.textSize);
    const bold = component?.textBold === true;
    const italic = component?.textItalic === true;
    const underline = component?.textUnderline === true;
    const color = forcedColor ?? normalizeComponentColorValue(component?.netColor) ?? STROKE;
    return {
      font,
      size,
      bold,
      italic,
      underline,
      color
    };
  };

  const getTextAnchorPin = (component) => {
    const pins = Array.isArray(component?.pins) ? component.pins : [];
    return pins[0] ?? null;
  };

  const rotateQuarterLocalPoint = (x, y, rotation) => {
    const snapped = snapRotation(rotation);
    if (snapped === 90) {
      return { x: y, y: -x };
    }
    if (snapped === 180) {
      return { x: -x, y: -y };
    }
    if (snapped === 270) {
      return { x: -y, y: x };
    }
    return { x, y };
  };

  const getTextAnnotationLocalExtents = (component) => {
    const text = getTextAnnotationText(component);
    const style = getTextAnnotationStyle(component);
    const width = Math.max(1, measureTextWidth(text, style.size, style.bold ? 700 : 400, style.font));
    const halfHeight = Math.max(4, style.size * 0.5);
    const rotation = snapRotation(Number(component?.rotation ?? 0));
    const corners = [
      rotateQuarterLocalPoint(0, -halfHeight, rotation),
      rotateQuarterLocalPoint(width, -halfHeight, rotation),
      rotateQuarterLocalPoint(0, halfHeight, rotation),
      rotateQuarterLocalPoint(width, halfHeight, rotation)
    ];
    return {
      minX: Math.min(...corners.map((entry) => entry.x)),
      maxX: Math.max(...corners.map((entry) => entry.x)),
      minY: Math.min(...corners.map((entry) => entry.y)),
      maxY: Math.max(...corners.map((entry) => entry.y))
    };
  };

  const measureTextWidth = (() => {
    let ctx = null;
    const cache = new Map();
    return (text, size, weight, family) => {
      const normalized = String(text ?? "");
      if (!normalized) {
        return 0;
      }
      const safeSize = Number.isFinite(size) ? size : 12;
      const safeWeight = Number.isFinite(weight) ? weight : 400;
      const safeFamily = String(family ?? "sans-serif").trim() || "sans-serif";
      const cacheKey = `${safeSize}|${safeWeight}|${safeFamily}|${normalized}`;
      const cached = cache.get(cacheKey);
      if (Number.isFinite(cached)) {
        return cached;
      }
      if (!ctx) {
        const canvas = document.createElement("canvas");
        ctx = canvas.getContext("2d");
      }
      if (!ctx) {
        const fallback = normalized.length * safeSize * 0.6;
        cache.set(cacheKey, fallback);
        return fallback;
      }
      ctx.font = `${safeWeight} ${safeSize}px "${safeFamily}"`;
      const measured = ctx.measureText(normalized).width;
      cache.set(cacheKey, measured);
      return measured;
    };
  })();

  const getNamedNodeLabelText = (component) => {
    const text = getDisplayName(component).trim();
    return text || "NET";
  };

  const resolveNetLabelStyle = () => {
    const shared = getNamedNodeHelper("getNamedNodeLabelStyle")();
    if (!shared || typeof shared !== "object") {
      throw new Error("Named-node style helper returned invalid data.");
    }
    return shared;
  };

  const getNamedNodeHelper = (name) => {
    const helper = schematicApi?.[name];
    if (typeof helper !== "function") {
      throw new Error(`Named-node helper '${name}' is unavailable. Ensure symbol-render.js loads before editor.js.`);
    }
    return helper;
  };

  const getNamedNodeGeometry = (component) => {
    const text = getNamedNodeLabelText(component);
    const style = resolveNetLabelStyle();
    const textWidth = measureTextWidth(text, Number(style.fontSize), 400);
    const geometry = getNamedNodeHelper("getNamedNodeGeometry")(textWidth, style);
    if (
      !geometry
      || !Number.isFinite(geometry.halfHeight)
      || !Number.isFinite(geometry.slopeX)
      || !Number.isFinite(geometry.textX)
      || !Number.isFinite(geometry.endX)
    ) {
      throw new Error("Named-node geometry helper returned invalid data.");
    }
    return {
      text,
      halfHeight: Number(geometry.halfHeight),
      slopeX: Number(geometry.slopeX),
      textX: Number(geometry.textX),
      endX: Number(geometry.endX),
      style
    };
  };

  const getNamedNodeTextTransform = (rotation, style, options) => {
    const transform = getNamedNodeHelper("getNamedNodeTextTransform")(rotation, style, options);
    if (!transform || !Number.isFinite(transform.rotation) || !Number.isFinite(transform.y)) {
      throw new Error("Named-node text transform helper returned invalid data.");
    }
    return {
      rotation: snapRotation(transform.rotation),
      y: Number(transform.y)
    };
  };

  const getNamedNodeTextAnchorX = (rotation, geometry, options) => {
    const anchor = getNamedNodeHelper("getNamedNodeTextAnchorX")(rotation, geometry, options);
    if (!Number.isFinite(anchor)) {
      throw new Error("Named-node text anchor helper returned invalid data.");
    }
    return Number(anchor);
  };

  const getNamedNodeExtents = (component) => {
    const geometry = getNamedNodeGeometry(component);
    const rotation = snapRotation(Number(component?.rotation ?? 0));
    const textOnly = component?.textOnly === true;
    const extents = getNamedNodeHelper("getNamedNodeExtents")(rotation, geometry, { textOnly, style: geometry?.style });
    if (
      !extents
      || !Number.isFinite(extents.minX)
      || !Number.isFinite(extents.maxX)
      || !Number.isFinite(extents.minY)
      || !Number.isFinite(extents.maxY)
    ) {
      throw new Error("Named-node extents helper returned invalid data.");
    }
    return {
      minX: Number(extents.minX),
      maxX: Number(extents.maxX),
      minY: Number(extents.minY),
      maxY: Number(extents.maxY),
      geometry
    };
  };

  const appendNamedNodeLabelText = (group, component, rotation, options, geometry) => {
    const metrics = geometry ?? getNamedNodeGeometry(component);
    const labelColor = options?.labelColor ?? options?.stroke ?? STROKE;
    const textOnly = options?.textOnly === true || component?.textOnly === true;
    const textTransform = getNamedNodeTextTransform(rotation, metrics.style, { textOnly });
    const textX = getNamedNodeTextAnchorX(rotation, metrics, { textOnly });
    const fontSize = Number(metrics.style?.fontSize);
    const label = appendText(group, textX, textTransform.y, metrics.text, {
      size: Number.isFinite(fontSize) ? fontSize : 12,
      fill: labelColor,
      anchor: "middle",
      baseline: "middle"
    });
    if (textTransform.rotation !== 0) {
      label.setAttribute("transform", `rotate(${textTransform.rotation} ${textX} ${textTransform.y})`);
    }
    if (component?.id) {
      label.setAttribute("data-component-id", String(component.id));
    }
    if (options?.dataHighlight) {
      label.setAttribute("data-component-label-highlight", String(options.dataHighlight));
    }
    return label;
  };

  const getProbeHelper = (name) => {
    const helper = schematicApi?.[name];
    if (typeof helper !== "function") {
      throw new Error(`Probe helper '${name}' is unavailable. Ensure symbol-render.js loads before editor.js.`);
    }
    return helper;
  };

  const getProbeLabelAnchor = (rotation) => {
    const anchor = getProbeHelper("getProbeLabelAnchor")(rotation, getProbeHelper("getProbeStyle")());
    if (!anchor || !Number.isFinite(anchor.x) || !Number.isFinite(anchor.y)) {
      throw new Error("Probe label helper returned invalid data.");
    }
    return {
      x: Number(anchor.x),
      y: Number(anchor.y),
      anchor: anchor.anchor === "end"
        ? "end"
        : (anchor.anchor === "middle" ? "middle" : "start")
    };
  };

  const getProbeExtents = (rotation) => {
    const extents = getProbeHelper("getProbeExtents")(rotation, getProbeHelper("getProbeStyle")());
    if (
      !extents
      || !Number.isFinite(extents.minX)
      || !Number.isFinite(extents.maxX)
      || !Number.isFinite(extents.minY)
      || !Number.isFinite(extents.maxY)
    ) {
      throw new Error("Probe extents helper returned invalid data.");
    }
    return {
      minX: Number(extents.minX),
      maxX: Number(extents.maxX),
      minY: Number(extents.minY),
      maxY: Number(extents.maxY)
    };
  };

  const getProbeTipPoint = (rotation) => {
    const tip = getProbeHelper("getProbeTipPoint")(rotation, getProbeHelper("getProbeStyle")());
    if (!tip || !Number.isFinite(tip.x) || !Number.isFinite(tip.y)) {
      throw new Error("Probe tip helper returned invalid data.");
    }
    return {
      x: Number(tip.x),
      y: Number(tip.y)
    };
  };

  const getProbeFlippedRotation = (rotation, axis) => {
    const helper = getProbeHelper("getProbeFlippedRotation");
    const resolved = Number(helper(rotation, axis));
    if (!Number.isFinite(resolved)) {
      throw new Error("Probe flipped-rotation helper returned invalid data.");
    }
    return snapRotation(resolved);
  };

  const getGroundFlippedRotation = (rotation, axis) => {
    const snapped = snapRotation(rotation);
    const normalizedAxis = axis === "v" ? "v" : "h";
    if (normalizedAxis === "h") {
      if (snapped === 0 || snapped === 180) {
        return snapped;
      }
      return snapRotation(snapped + 180);
    }
    if (snapped === 90 || snapped === 270) {
      return snapped;
    }
    return snapRotation(snapped + 180);
  };

  const getDifferentialProbeRotations = (component) => {
    if (!component || String(component?.type ?? "").toUpperCase() !== "PD") {
      return null;
    }
    return component.probeDiffRotations ?? null;
  };

  const getDifferentialProbeGeometry = (component) => {
    const helper = getProbeHelper("getDifferentialProbeGeometry");
    const geometry = helper(
      component?.pins,
      Number(component?.rotation ?? 0),
      getProbeHelper("getProbeStyle")(),
      getDifferentialProbeRotations(component)
    );
    if (!geometry) {
      return null;
    }
    if (
      !geometry.pos
      || !geometry.neg
      || !geometry.labelAnchor
      || !geometry.extents
      || !Number.isFinite(geometry.pos.x)
      || !Number.isFinite(geometry.pos.y)
      || !Number.isFinite(geometry.neg.x)
      || !Number.isFinite(geometry.neg.y)
      || !geometry.posTip
      || !geometry.negTip
      || !Number.isFinite(geometry.posTip.x)
      || !Number.isFinite(geometry.posTip.y)
      || !Number.isFinite(geometry.negTip.x)
      || !Number.isFinite(geometry.negTip.y)
      || !Number.isFinite(geometry.labelAnchor.x)
      || !Number.isFinite(geometry.labelAnchor.y)
      || !Number.isFinite(geometry.extents.minX)
      || !Number.isFinite(geometry.extents.maxX)
      || !Number.isFinite(geometry.extents.minY)
      || !Number.isFinite(geometry.extents.maxY)
    ) {
      throw new Error("Differential probe geometry helper returned invalid data.");
    }
    return geometry;
  };

  const getDifferentialProbeRenderPlan = (component) => {
    const helper = getProbeHelper("getDifferentialProbeRenderPlan");
    const plan = helper(component?.pins, {
      rotation: Number(component?.rotation ?? 0),
      style: getProbeHelper("getProbeStyle")(),
      rotations: getDifferentialProbeRotations(component)
    });
    if (!plan) {
      return null;
    }
    const endpoints = Array.isArray(plan.endpoints) ? plan.endpoints : [];
    const link = plan.link;
    if (
      !plan.geometry
      || !link
      || !Number.isFinite(link.x1)
      || !Number.isFinite(link.y1)
      || !Number.isFinite(link.x2)
      || !Number.isFinite(link.y2)
      || typeof link.dash !== "string"
      || !link.dash.trim()
      || !Number.isFinite(Number(plan.headRadius))
      || endpoints.length < 2
    ) {
      throw new Error("Differential probe render plan helper returned invalid data.");
    }
    endpoints.forEach((endpoint) => {
      const polarity = endpoint?.polarityPosition;
      if (
        !endpoint
        || !endpoint.anchor
        || !endpoint.tip
        || !polarity
        || !Number.isFinite(endpoint.anchor.x)
        || !Number.isFinite(endpoint.anchor.y)
        || !Number.isFinite(endpoint.tip.x)
        || !Number.isFinite(endpoint.tip.y)
        || !Number.isFinite(polarity.x)
        || !Number.isFinite(polarity.y)
      ) {
        throw new Error("Differential probe render plan endpoint payload is invalid.");
      }
    });
    return plan;
  };

  const getDifferentialPolarityColor = (fillColor) => {
    const helper = getProbeHelper("getContrastPolarityColor");
    const resolved = String(helper(fillColor) ?? "").trim();
    if (!resolved) {
      throw new Error("Differential polarity color helper returned invalid data.");
    }
    return resolved;
  };

  const getSpdtSwitchHelper = (name) => {
    const helper = schematicApi?.[name];
    if (typeof helper !== "function") {
      throw new Error(`SPDT helper '${name}' is unavailable. Ensure symbol-render.js loads before editor.js.`);
    }
    return helper;
  };

  const getSpdtSwitchRenderPlan = (component) => {
    const helper = getSpdtSwitchHelper("getSpdtSwitchRenderPlan");
    const plan = helper(component?.pins, component?.value);
    if (
      !plan
      || !plan.pins
      || !plan.contacts
      || !plan.blade
      || !plan.labelCenter
      || !Number.isFinite(plan.labelCenter.x)
      || !Number.isFinite(plan.labelCenter.y)
      || !Number.isFinite(plan.labelAngle)
      || !Number.isFinite(plan.pins?.C?.x)
      || !Number.isFinite(plan.pins?.C?.y)
      || !Number.isFinite(plan.pins?.A?.x)
      || !Number.isFinite(plan.pins?.A?.y)
      || !Number.isFinite(plan.pins?.B?.x)
      || !Number.isFinite(plan.pins?.B?.y)
      || !Number.isFinite(plan.contacts?.A?.x)
      || !Number.isFinite(plan.contacts?.A?.y)
      || !Number.isFinite(plan.contacts?.B?.x)
      || !Number.isFinite(plan.contacts?.B?.y)
      || !Number.isFinite(plan.blade?.from?.x)
      || !Number.isFinite(plan.blade?.from?.y)
      || !Number.isFinite(plan.blade?.to?.x)
      || !Number.isFinite(plan.blade?.to?.y)
    ) {
      throw new Error("SPDT switch render plan helper returned invalid data.");
    }
    return {
      ...plan,
      labelCenter: {
        x: Number(plan.labelCenter.x),
        y: Number(plan.labelCenter.y)
      },
      labelAngle: Number(plan.labelAngle)
    };
  };

  const getSpdtSwitchExtents = (component) => {
    const helper = getSpdtSwitchHelper("getSpdtSwitchExtents");
    const extents = helper(component?.pins, component?.value);
    if (
      !extents
      || !Number.isFinite(extents.minX)
      || !Number.isFinite(extents.maxX)
      || !Number.isFinite(extents.minY)
      || !Number.isFinite(extents.maxY)
    ) {
      throw new Error("SPDT switch extents helper returned invalid data.");
    }
    return {
      minX: Number(extents.minX),
      maxX: Number(extents.maxX),
      minY: Number(extents.minY),
      maxY: Number(extents.maxY)
    };
  };

  const normalizeSpdtThrow = (value) =>
    String(value ?? "").trim().toUpperCase() === "B" ? "B" : "A";

  const parseSpdtSwitchValueSafe = (value) => {
    try {
      const parsed = parseSpdtSwitchValue(value);
      return {
        activeThrow: normalizeSpdtThrow(parsed?.activeThrow),
        ron: String(parsed?.ron ?? "0").trim() || "0",
        roff: parsed?.roff === null || parsed?.roff === undefined
          ? null
          : (String(parsed.roff).trim() || null),
        showRon: parsed?.showRon === true,
        showRoff: parsed?.showRoff === true
      };
    } catch {
      return {
        activeThrow: "A",
        ron: "0",
        roff: null,
        showRon: false,
        showRoff: false
      };
    }
  };

  const formatSpdtSwitchValue = (value) => {
    const stateValue = value && typeof value === "object" ? value : {};
    const activeThrow = normalizeSpdtThrow(stateValue.activeThrow);
    const ron = String(stateValue.ron ?? "").trim() || "0";
    const roff = String(stateValue.roff ?? "").trim();
    const showRon = stateValue.showRon === true;
    const showRoff = stateValue.showRoff === true;
    const tokens = [activeThrow];
    if (ron !== "0") {
      tokens.push(`ron=${ron}`);
    }
    if (roff) {
      tokens.push(`roff=${roff}`);
    }
    if (showRon) {
      tokens.push("showron");
    }
    if (showRoff) {
      tokens.push("showroff");
    }
    return tokens.join(" ");
  };

  const buildToggledSpdtSwitchValue = (currentValue) => {
    const parsed = parseSpdtSwitchValueSafe(currentValue);
    return formatSpdtSwitchValue({
      activeThrow: parsed.activeThrow === "A" ? "B" : "A",
      ron: parsed.ron,
      roff: parsed.roff,
      showRon: parsed.showRon,
      showRoff: parsed.showRoff
    });
  };

  const getProbeDisplayLabel = (component, options) =>
    String(options?.probeLabels?.get?.(component?.id) ?? getDisplayName(component) ?? "");

  const isInvalidDifferentialProbeLabel = (component, label) =>
    String(component?.type ?? "").toUpperCase() === "PD" && String(label ?? "").includes("?");

  const getTwoPinInfo = (component) => {
    const pins = Array.isArray(component?.pins) ? component.pins : [];
    if (pins.length < 2) {
      return null;
    }
    const start = pins[0];
    const end = pins[1];
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const length = Math.hypot(dx, dy);
    if (!Number.isFinite(length) || length <= 0) {
      return null;
    }
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);
    return {
      start,
      end,
      length,
      angle,
      midX: (start.x + end.x) / 2,
      midY: (start.y + end.y) / 2
    };
  };

  const strokeOptions = (style) => ({
    stroke: style?.stroke ?? STROKE,
    width: style?.width ?? STROKE_WIDTH
  });

  const symbolApi = schematicApi;
  const symbolCtx = {
    line: appendLine,
    circle: appendCircle,
    polyline: appendPolyline,
    path: appendPath,
    text: appendText,
    stroke: STROKE,
    width: STROKE_WIDTH,
    background: CANVAS_BG
  };

  const drawGroundSymbol = (svg, component, options) => {
    const pins = Array.isArray(component?.pins) ? component.pins : [];
    if (!pins.length) {
      return;
    }
    const pin = pins[0];
    const stroke = strokeOptions(options);
    const group = document.createElementNS(SVG_NS, "g");
    group.setAttribute("data-component", component.id);
    group.setAttribute("data-symbol", "ground");
    if (options?.className) {
      group.setAttribute("class", options.className);
    }
    if (options?.dataHighlight) {
      group.setAttribute("data-component-highlight", String(options.dataHighlight));
    }
    if (Number.isFinite(options?.opacity)) {
      group.setAttribute("opacity", String(options.opacity));
    }
    const rotation = Number(component?.rotation ?? 0);
    const rotate = Number.isFinite(rotation) && rotation % 360 !== 0
      ? ` rotate(${rotation})`
      : "";
    group.setAttribute("transform", `translate(${pin.x} ${pin.y})${rotate}`);
    const handled = typeof symbolApi?.drawShape === "function"
      ? symbolApi.drawShape(symbolCtx, "GND", group, { style: stroke })
      : false;
    if (!handled) {
      return;
    }
    svg.appendChild(group);
  };

  const drawNamedNodeSymbol = (svg, component, options) => {
    const pins = Array.isArray(component?.pins) ? component.pins : [];
    if (!pins.length) {
      return;
    }
    const pin = pins[0];
    const stroke = strokeOptions(options);
    const geometry = getNamedNodeGeometry(component);
    const group = document.createElementNS(SVG_NS, "g");
    group.setAttribute("data-component", component.id);
    group.setAttribute("data-symbol", "net");
    if (options?.className) {
      group.setAttribute("class", options.className);
    }
    if (options?.dataHighlight) {
      group.setAttribute("data-component-highlight", String(options.dataHighlight));
    }
    if (Number.isFinite(options?.opacity)) {
      group.setAttribute("opacity", String(options.opacity));
    }
    const rotation = snapRotation(Number(component?.rotation ?? 0));
    const rotate = rotation !== 0
      ? ` rotate(${rotation})`
      : "";
    group.setAttribute("transform", `translate(${pin.x} ${pin.y})${rotate}`);
    const textOnly = component?.textOnly === true;
    const handled = !textOnly && typeof symbolApi?.drawShape === "function"
      ? symbolApi.drawShape(symbolCtx, "NET", group, { geometry, style: stroke })
      : false;
    if (!textOnly && !handled) {
      return;
    }
    if (options?.showLabel !== false) {
      appendNamedNodeLabelText(group, component, rotation, {
        ...options,
        textOnly
      }, geometry);
    }
    svg.appendChild(group);
  };

  const drawTextAnnotationSymbol = (svg, component, options) => {
    const pin = getTextAnchorPin(component);
    if (!pin) {
      return;
    }
    const style = getTextAnnotationStyle(component, options);
    const text = getTextAnnotationText(component);
    const rotation = snapRotation(Number(component?.rotation ?? 0));
    const group = document.createElementNS(SVG_NS, "g");
    group.setAttribute("data-component", component.id);
    group.setAttribute("data-symbol", "text");
    if (options?.className) {
      group.setAttribute("class", options.className);
    }
    if (options?.dataHighlight) {
      group.setAttribute("data-component-highlight", String(options.dataHighlight));
    }
    if (Number.isFinite(options?.opacity)) {
      group.setAttribute("opacity", String(options.opacity));
    }
    const rotate = rotation !== 0 ? ` rotate(${rotation})` : "";
    group.setAttribute("transform", `translate(${pin.x} ${pin.y})${rotate}`);
    const label = appendText(group, 0, 0, text, {
      size: style.size,
      fill: style.color,
      anchor: "start",
      baseline: "middle"
    });
    label.setAttribute("font-family", style.font);
    label.setAttribute("font-style", style.italic ? "italic" : "normal");
    label.setAttribute("font-weight", style.bold ? "700" : "400");
    label.setAttribute("text-decoration", style.underline ? "underline" : "none");
    if (component?.id) {
      label.setAttribute("data-component-id", String(component.id));
    }
    if (options?.dataHighlight) {
      label.setAttribute("data-component-label-highlight", String(options.dataHighlight));
    }
    svg.appendChild(group);
  };

  const drawProbeLabel = (svg, component, options) => {
    const type = String(component?.type ?? "").toUpperCase();
    const probeLabel = getProbeDisplayLabel(component, options);
    let labelX = 0;
    let labelY = 0;
    let labelAnchor = { anchor: "start" };
    if (type === "PD") {
      const geometry = getDifferentialProbeGeometry(component);
      if (!geometry) {
        return null;
      }
      labelX = Number(geometry.labelAnchor.x);
      labelY = Number(geometry.labelAnchor.y);
      labelAnchor = {
        anchor: geometry.labelAnchor.anchor === "end"
          ? "end"
          : (geometry.labelAnchor.anchor === "middle" ? "middle" : "start")
      };
    } else {
      const pins = Array.isArray(component?.pins) ? component.pins : [];
      const pin = pins[0];
      if (!pin) {
        return null;
      }
      const rotation = snapRotation(Number(component?.rotation ?? 0));
      const anchor = getProbeLabelAnchor(rotation);
      labelX = pin.x + anchor.x;
      labelY = pin.y + anchor.y;
      labelAnchor = anchor;
    }
    const useInvalidColor = isInvalidDifferentialProbeLabel(component, probeLabel) && !options?.dataHighlight;
    const labelFill = useInvalidColor
      ? PROBE_INVALID_COLOR
      : (options?.labelColor ?? options?.stroke ?? DEFAULT_COMPONENT_TEXT_COLORS.label);
    const valueFill = useInvalidColor
      ? PROBE_INVALID_COLOR
      : (options?.valueColor ?? DEFAULT_COMPONENT_TEXT_COLORS.value);
    const label = appendText(svg, labelX, labelY, probeLabel, {
      size: 12,
      fill: labelFill,
      anchor: labelAnchor.anchor,
      baseline: "middle"
    });
    if (component?.id) {
      label.setAttribute("data-component-id", String(component.id));
    }
    if (options?.dataHighlight) {
      label.setAttribute("data-component-label-highlight", String(options.dataHighlight));
    }
    const measurementText = options?.measurements?.get?.(component.id);
    if (measurementText) {
      const valueLabel = appendText(
        svg,
        labelX,
        labelY + LABEL_LINE_HEIGHT,
        measurementText,
        {
          size: 11,
          fill: valueFill,
          anchor: labelAnchor.anchor,
          weight: MEASUREMENT_TEXT_WEIGHT
        }
      );
      if (component?.id) {
        valueLabel.setAttribute("data-component-id", String(component.id));
      }
      if (options?.dataHighlight) {
        valueLabel.setAttribute("data-component-label-highlight", String(options.dataHighlight));
      }
    }
    return label;
  };

  const drawDifferentialProbeSymbol = (svg, component, options) => {
    const plan = getDifferentialProbeRenderPlan(component);
    if (!plan) {
      return;
    }
    const probeLabel = getProbeDisplayLabel(component, options);
    const useInvalidColor = isInvalidDifferentialProbeLabel(component, probeLabel) && !options?.dataHighlight;
    const baseStroke = useInvalidColor
      ? PROBE_INVALID_COLOR
      : (options?.stroke ?? STROKE);
    const polarityFill = getDifferentialPolarityColor(baseStroke);
    const lineWidth = options?.width ?? STROKE_WIDTH;
    const group = document.createElementNS(SVG_NS, "g");
    group.setAttribute("data-component", component.id);
    group.setAttribute("data-symbol", "PD");
    if (options?.className) {
      group.setAttribute("class", options.className);
    }
    if (options?.dataHighlight) {
      group.setAttribute("data-component-highlight", String(options.dataHighlight));
    }
    if (Number.isFinite(options?.opacity)) {
      group.setAttribute("opacity", String(options.opacity));
    }
    const tipRadius = Number(plan.headRadius);
    const link = appendLine(group, plan.link.x1, plan.link.y1, plan.link.x2, plan.link.y2, {
      stroke: baseStroke,
      width: 1.25
    });
    link.setAttribute("data-probe-diff-link", "1");
    link.setAttribute("stroke-dasharray", plan.link.dash);
    plan.endpoints.forEach((endpoint) => {
      const lead = appendLine(group, endpoint.anchor.x, endpoint.anchor.y, endpoint.tip.x, endpoint.tip.y, {
        stroke: baseStroke,
        width: lineWidth
      });
      lead.setAttribute("data-probe-diff-lead", endpoint.side);
      const tipCircle = appendCircle(group, endpoint.tip.x, endpoint.tip.y, tipRadius, {
        stroke: baseStroke,
        width: lineWidth,
        fill: baseStroke
      });
      tipCircle.setAttribute("data-probe-diff-tip", endpoint.side);
      const polarity = appendText(
        group,
        endpoint.polarityPosition.x,
        endpoint.polarityPosition.y,
        endpoint.polarity,
        {
          size: 11,
          fill: polarityFill,
          anchor: "middle",
          baseline: "middle",
          weight: 600
        }
      );
      polarity.setAttribute("data-probe-diff-polarity", endpoint.side);
    });
    svg.appendChild(group);
    if (options?.showLabel !== false) {
      drawProbeLabel(svg, component, options);
    }
  };

  const drawProbeSymbol = (svg, component, options) => {
    const type = String(component?.type ?? "").toUpperCase();
    if (type === "PD") {
      drawDifferentialProbeSymbol(svg, component, options);
      return;
    }
    const pins = Array.isArray(component?.pins) ? component.pins : [];
    const pin = pins[0];
    if (!pin) {
      return;
    }
    const stroke = strokeOptions(options);
    const group = document.createElementNS(SVG_NS, "g");
    group.setAttribute("data-component", component.id);
    group.setAttribute("data-symbol", type);
    if (options?.className) {
      group.setAttribute("class", options.className);
    }
    if (options?.dataHighlight) {
      group.setAttribute("data-component-highlight", String(options.dataHighlight));
    }
    if (Number.isFinite(options?.opacity)) {
      group.setAttribute("opacity", String(options.opacity));
    }
    const rotation = snapRotation(Number(component?.rotation ?? 0));
    const rotate = rotation !== 0 ? ` rotate(${rotation})` : "";
    group.setAttribute("transform", `translate(${pin.x} ${pin.y})${rotate}`);
    const handled = typeof symbolApi?.drawShape === "function"
      ? symbolApi.drawShape(symbolCtx, type, group, { style: stroke })
      : false;
    if (!handled) {
      return;
    }
    svg.appendChild(group);
    if (options?.showLabel !== false) {
      drawProbeLabel(svg, component, options);
    }
  };

  const getSpdtLabelGeometry = (component, plan) => {
    const resolvedPlan = plan ?? getSpdtSwitchRenderPlan(component);
    return {
      midX: Number(resolvedPlan.labelCenter.x),
      midY: Number(resolvedPlan.labelCenter.y),
      angle: Number(resolvedPlan.labelAngle)
    };
  };

  const drawSpdtSwitchSymbol = (svg, component, options) => {
    const plan = getSpdtSwitchRenderPlan(component);
    const group = document.createElementNS(SVG_NS, "g");
    group.setAttribute("data-component", component.id);
    group.setAttribute("data-symbol", "SW");
    if (options?.className) {
      group.setAttribute("class", options.className);
    }
    if (options?.dataHighlight) {
      group.setAttribute("data-component-highlight", String(options.dataHighlight));
    }
    if (Number.isFinite(options?.opacity)) {
      group.setAttribute("opacity", String(options.opacity));
    }
    const style = {
      stroke: options?.stroke ?? STROKE,
      width: options?.width ?? STROKE_WIDTH,
      fill: options?.fill
    };
    const handled = typeof symbolApi?.drawShape === "function"
      ? symbolApi.drawShape(symbolCtx, "SW", group, {
        style,
        pins: component?.pins,
        value: component?.value,
        plan
      })
      : false;
    if (!handled) {
      return;
    }
    svg.appendChild(group);
    if (options?.showLabel !== false) {
      const measurementText = options?.measurements?.get?.(component.id);
      const labelGeometry = getSpdtLabelGeometry(component, plan);
      const labelInfo = drawComponentLabel(svg, component, {
        midX: labelGeometry.midX,
        midY: labelGeometry.midY,
        angle: labelGeometry.angle,
        labelColor: options?.labelColor,
        valueColor: options?.valueColor,
        dataHighlight: options?.dataHighlight,
        extraLines: measurementText ? 1 : 0
      });
      if (measurementText && labelInfo) {
        const measurementLabel = appendText(
          svg,
          labelInfo.layout.x,
          labelInfo.layout.y + labelInfo.layout.lineHeight * (labelInfo.lineCount - 1),
          measurementText,
          {
            size: 11,
            fill: options?.valueColor ?? DEFAULT_COMPONENT_TEXT_COLORS.value,
            anchor: labelInfo.layout.anchor,
            weight: MEASUREMENT_TEXT_WEIGHT
          }
        );
        if (component?.id) {
          measurementLabel.setAttribute("data-component-id", String(component.id));
        }
        if (options?.dataHighlight) {
          measurementLabel.setAttribute("data-component-label-highlight", String(options.dataHighlight));
        }
      }
    }
  };

  const drawDifferentialProbeOverlayLink = (svg, component, options) => {
    const plan = getDifferentialProbeRenderPlan(component);
    if (!plan) {
      return;
    }
    const color = options?.color ?? "#0f62fe";
    const lineWidth = Number.isFinite(options?.width) ? options.width : 1.25;
    const selectedSides = options?.selectedSides instanceof Set
      ? options.selectedSides
      : new Set(Array.isArray(options?.selectedSides) ? options.selectedSides : []);
    const tipRadius = Number.isFinite(options?.anchorRadius)
      ? options.anchorRadius
      : Number(plan.headRadius);
    const polarityFill = getDifferentialPolarityColor(color);
    const link = appendLine(svg, plan.link.x1, plan.link.y1, plan.link.x2, plan.link.y2, {
      stroke: color,
      width: lineWidth
    });
    link.setAttribute("data-probe-diff-overlay-link", "1");
    link.setAttribute("stroke-dasharray", plan.link.dash);
    plan.endpoints.forEach((endpoint) => {
      const isSelected = selectedSides.has(endpoint.side);
      const lead = appendLine(svg, endpoint.anchor.x, endpoint.anchor.y, endpoint.tip.x, endpoint.tip.y, {
        stroke: color,
        width: isSelected ? Math.max(2, lineWidth + 0.5) : lineWidth
      });
      lead.setAttribute("data-probe-diff-overlay-lead", endpoint.side);
      const circle = appendCircle(svg, endpoint.tip.x, endpoint.tip.y, isSelected ? tipRadius + 0.75 : tipRadius, {
        fill: color,
        stroke: color,
        width: 0
      });
      circle.setAttribute("data-probe-diff-overlay-anchor", endpoint.side);
      if (isSelected) {
        circle.setAttribute("data-probe-diff-overlay-selected-side", endpoint.side);
      }
      const polarity = appendText(svg, endpoint.polarityPosition.x, endpoint.polarityPosition.y, endpoint.polarity, {
        size: 11,
        fill: polarityFill,
        anchor: "middle",
        baseline: "middle",
        weight: 600
      });
      polarity.setAttribute("data-probe-diff-overlay-polarity", endpoint.side);
      if (isSelected) {
        polarity.setAttribute("data-probe-diff-overlay-selected-side", endpoint.side);
      }
    });
  };

  const drawComponentSymbol = (svg, component, options) => {
    const type = String(component?.type ?? "").toUpperCase();
    if (type === "GND") {
      drawGroundSymbol(svg, component, options);
      return;
    }
    if (type === "NET") {
      drawNamedNodeSymbol(svg, component, options);
      return;
    }
    if (type === "TEXT") {
      drawTextAnnotationSymbol(svg, component, options);
      return;
    }
    if (isProbeComponentType(type)) {
      drawProbeSymbol(svg, component, options);
      return;
    }
    if (type === "SW") {
      drawSpdtSwitchSymbol(svg, component, options);
      return;
    }
    const info = getTwoPinInfo(component);
    if (!info) {
      return;
    }
    const group = document.createElementNS(SVG_NS, "g");
    group.setAttribute("data-component", component.id);
    group.setAttribute("data-symbol", type);
    if (options?.className) {
      group.setAttribute("class", options.className);
    }
    if (options?.dataHighlight) {
      group.setAttribute("data-component-highlight", String(options.dataHighlight));
    }
    if (Number.isFinite(options?.opacity)) {
      group.setAttribute("opacity", String(options.opacity));
    }
    const style = {
      stroke: options?.stroke ?? STROKE,
      width: options?.width ?? STROKE_WIDTH,
      fill: options?.fill
    };
    group.setAttribute("transform", `translate(${info.start.x} ${info.start.y}) rotate(${info.angle})`);
    if (options?.showEndpoints) {
      const endpointFill = options?.endpointFill ?? style.stroke;
      const endpointStroke = options?.endpointStroke ?? style.stroke;
      const endpointWidth = options?.endpointWidth ?? 0;
      appendCircle(group, 0, 0, 2, { fill: endpointFill, stroke: endpointStroke, width: endpointWidth });
      appendCircle(group, info.length, 0, 2, { fill: endpointFill, stroke: endpointStroke, width: endpointWidth });
    }
    const drawShape = symbolApi?.drawShape;
    const handled = typeof drawShape === "function"
      ? drawShape(symbolCtx, type, group, { length: info.length, rotation: info.angle, style })
      : false;
    if (!handled) {
      appendLine(group, 0, 0, info.length, 0, style);
    }
    svg.appendChild(group);
    if (options?.showLabel !== false) {
      const measurementText = options?.measurements?.get?.(component.id);
      const labelInfo = drawComponentLabel(svg, component, {
        midX: info.midX,
        midY: info.midY,
        angle: info.angle,
        labelColor: options?.labelColor,
        valueColor: options?.valueColor,
        dataHighlight: options?.dataHighlight,
        extraLines: measurementText ? 1 : 0
      });
      if (measurementText && labelInfo) {
        const measurementLabel = appendText(svg, labelInfo.layout.x, labelInfo.layout.y + labelInfo.layout.lineHeight * (labelInfo.lineCount - 1), measurementText, {
          size: 11,
          fill: options?.valueColor ?? DEFAULT_COMPONENT_TEXT_COLORS.value,
          anchor: labelInfo.layout.anchor,
          weight: MEASUREMENT_TEXT_WEIGHT
        });
        if (component?.id) {
          measurementLabel.setAttribute("data-component-id", String(component.id));
        }
        if (options?.dataHighlight) {
          measurementLabel.setAttribute("data-component-label-highlight", String(options.dataHighlight));
        }
      }
    }
  };

  const drawComponentLabel = (svg, component, options) => {
    const displayValue = formatDisplayValue(component);
    const hasValue = Boolean(displayValue);
    const displayName = getDisplayName(component);
    const labelRotation = Number(component?.labelRotation ?? 0);
    const lineCount = (hasValue ? 2 : 1) + (options?.extraLines ?? 0);
    const layout = getLabelLayout(
      options?.midX ?? 0,
      options?.midY ?? 0,
      options?.angle ?? 0,
      lineCount,
      labelRotation
    );
    const labelColor = options?.labelColor ?? DEFAULT_COMPONENT_TEXT_COLORS.label;
    const valueColor = options?.valueColor ?? DEFAULT_COMPONENT_TEXT_COLORS.value;
    const label = appendText(svg, layout.x, layout.y, displayName, {
      size: 12,
      anchor: layout.anchor,
      fill: labelColor
    });
    if (component?.id) {
      label.setAttribute("data-component-id", String(component.id));
    }
    if (options?.dataHighlight) {
      label.setAttribute("data-component-label-highlight", String(options.dataHighlight));
    }
    if (hasValue) {
      const valueLabel = appendText(svg, layout.x, layout.y + layout.lineHeight, displayValue, {
        size: 11,
        fill: valueColor,
        anchor: layout.anchor
      });
      if (component?.id) {
        valueLabel.setAttribute("data-component-id", String(component.id));
      }
      if (options?.dataHighlight) {
        valueLabel.setAttribute("data-component-label-highlight", String(options.dataHighlight));
      }
    }
    return { layout, lineCount };
  };

  const renderSymbolIcon = (type, options = {}) => {
    const svg = document.createElementNS(SVG_NS, "svg");
    const width = Number.isFinite(options.width) ? options.width : 36;
    const height = Number.isFinite(options.height) ? options.height : 18;
    svg.setAttribute("viewBox", "0 0 48 24");
    svg.setAttribute("width", String(width));
    svg.setAttribute("height", String(height));
    svg.setAttribute("aria-hidden", "true");
    svg.classList.add("tool-icon");
    const stroke = options.stroke ?? "currentColor";
    const strokeWidth = Number.isFinite(options.strokeWidth) ? options.strokeWidth : 2;
    const normalized = String(type ?? "").toUpperCase();
    let component = null;
    if (normalized === "GND") {
      component = {
        id: "GND",
        type: "GND",
        value: "",
        rotation: 0,
        pins: [{ id: "0", name: "0", x: 24, y: 6 }]
      };
    } else if (normalized === "NET") {
      component = {
        id: "NET",
        type: "NET",
        name: "NET",
        value: "",
        rotation: 0,
        pins: [{ id: "1", name: "1", x: 10, y: 12 }]
      };
    } else if (normalized === "TEXT") {
      component = {
        id: "TEXT",
        type: "TEXT",
        name: "T",
        value: "",
        rotation: 0,
        textFont: DEFAULT_TEXT_FONT,
        textSize: 10,
        pins: [{ id: "A", name: "A", x: 6, y: 12 }]
      };
    } else if (normalized === "SW") {
      component = {
        id: "SW",
        type: "SW",
        value: "A",
        rotation: 0,
        pins: [
          { id: "C", name: "C", x: 8, y: 12 },
          { id: "A", name: "A", x: 40, y: 6 },
          { id: "B", name: "B", x: 40, y: 18 }
        ]
      };
    } else if (isProbeComponentType(normalized)) {
      const probePins = normalized === "PD"
        ? [
          { id: "P+", name: "P+", x: 8, y: 12 },
          { id: "P-", name: "P-", x: 40, y: 12 }
        ]
        : [{ id: "P", name: "P", x: 12, y: 12 }];
      component = {
        id: normalized || "P",
        type: normalized,
        name: normalized,
        value: "",
        rotation: 0,
        pins: probePins
      };
    } else {
      component = {
        id: normalized || "X",
        type: normalized,
        value: "",
        rotation: 0,
        pins: [
          { id: "1", name: "1", x: 4, y: 12 },
          { id: "2", name: "2", x: 44, y: 12 }
        ]
      };
    }
    drawComponentSymbol(svg, component, {
      stroke,
      width: strokeWidth,
      fill: options.fill,
      showLabel: false,
      showEndpoints: false,
      labelColor: stroke,
      valueColor: stroke
    });
    return svg;
  };

  const getComponentBounds = (component, padding, probeLabels) => {
    const pins = Array.isArray(component?.pins) ? component.pins : [];
    if (!pins.length) {
      return null;
    }
    const xs = pins.map((pin) => pin.x);
    const ys = pins.map((pin) => pin.y);
    let minX = Math.min(...xs) - padding;
    let maxX = Math.max(...xs) + padding;
    let minY = Math.min(...ys) - padding;
    let maxY = Math.max(...ys) + padding;
    if (String(component?.type ?? "").toUpperCase() === "GND") {
      const pinX = xs[0];
      const pinY = ys[0];
      const rotation = snapRotation(Number(component?.rotation ?? 0));
      const nearPad = 2;
      const farPad = 6;
      const crossPad = 3;
      let extents = { minX: -8, maxX: 8, minY: 0, maxY: 16 };
      if (rotation === 90) {
        extents = { minX: -16, maxX: 0, minY: -8, maxY: 8 };
      } else if (rotation === 180) {
        extents = { minX: -8, maxX: 8, minY: -16, maxY: 0 };
      } else if (rotation === 270) {
        extents = { minX: 0, maxX: 16, minY: -8, maxY: 8 };
      }
      let minPadX = crossPad;
      let maxPadX = crossPad;
      let minPadY = crossPad;
      let maxPadY = crossPad;
      if (extents.minX === 0 && extents.maxX > 0) {
        minPadX = nearPad;
        maxPadX = farPad;
      } else if (extents.maxX === 0 && extents.minX < 0) {
        minPadX = farPad;
        maxPadX = nearPad;
      }
      if (extents.minY === 0 && extents.maxY > 0) {
        minPadY = nearPad;
        maxPadY = farPad;
      } else if (extents.maxY === 0 && extents.minY < 0) {
        minPadY = farPad;
        maxPadY = nearPad;
      }
      minX = pinX + extents.minX - minPadX;
      maxX = pinX + extents.maxX + maxPadX;
      minY = pinY + extents.minY - minPadY;
      maxY = pinY + extents.maxY + maxPadY;
    } else if (String(component?.type ?? "").toUpperCase() === "NET") {
      const pinX = xs[0];
      const pinY = ys[0];
      const extents = getNamedNodeExtents(component);
      const rotation = snapRotation(Number(component?.rotation ?? 0));
      const verticalTextOnly = component?.textOnly === true && (rotation === 90 || rotation === 270);
      const pad = component?.textOnly === true
        ? (verticalTextOnly ? 8 : 3)
        : NET_LABEL_BOUNDS_PAD;
      minX = pinX + extents.minX - pad;
      maxX = pinX + extents.maxX + pad;
      minY = pinY + extents.minY - pad;
      maxY = pinY + extents.maxY + pad;
    } else if (String(component?.type ?? "").toUpperCase() === "TEXT") {
      const pinX = xs[0];
      const pinY = ys[0];
      const extents = getTextAnnotationLocalExtents(component);
      const pad = 4;
      minX = pinX + extents.minX - pad;
      maxX = pinX + extents.maxX + pad;
      minY = pinY + extents.minY - pad;
      maxY = pinY + extents.maxY + pad;
    } else if (String(component?.type ?? "").toUpperCase() === "SW") {
      const extents = getSpdtSwitchExtents(component);
      const pad = 6;
      minX = extents.minX - pad;
      maxX = extents.maxX + pad;
      minY = extents.minY - pad;
      maxY = extents.maxY + pad;
    } else if (isProbeComponentType(component?.type)) {
      const type = String(component?.type ?? "").toUpperCase();
      const shapePad = 6;
      let textX = xs[0];
      let textY = ys[0];
      let textAnchor = "start";
      if (type === "PD") {
        const geometry = getDifferentialProbeGeometry(component);
        if (!geometry) {
          return { minX, maxX, minY, maxY };
        }
        minX = geometry.extents.minX - shapePad;
        maxX = geometry.extents.maxX + shapePad;
        minY = geometry.extents.minY - shapePad;
        maxY = geometry.extents.maxY + shapePad;
        textX = geometry.labelAnchor.x;
        textY = geometry.labelAnchor.y;
        textAnchor = geometry.labelAnchor.anchor === "end"
          ? "end"
          : (geometry.labelAnchor.anchor === "middle" ? "middle" : "start");
      } else {
        const pinX = xs[0];
        const pinY = ys[0];
        const rotation = snapRotation(Number(component?.rotation ?? 0));
        const extents = getProbeExtents(rotation);
        const anchor = getProbeLabelAnchor(rotation);
        minX = pinX + extents.minX - shapePad;
        maxX = pinX + extents.maxX + shapePad;
        minY = pinY + extents.minY - shapePad;
        maxY = pinY + extents.maxY + shapePad;
        textX = pinX + anchor.x;
        textY = pinY + anchor.y;
        textAnchor = anchor.anchor;
      }
      const label = getProbeDisplayLabel(component, { probeLabels });
      if (label) {
        const textWidth = Math.max(1, measureTextWidth(label, 12, 400, DEFAULT_TEXT_FONT));
        let labelMinX = textX;
        let labelMaxX = textX + textWidth;
        if (textAnchor === "end") {
          labelMinX = textX - textWidth;
          labelMaxX = textX;
        } else if (textAnchor === "middle") {
          const halfWidth = textWidth / 2;
          labelMinX = textX - halfWidth;
          labelMaxX = textX + halfWidth;
        }
        const labelMinY = textY - 8;
        const labelMaxY = textY + 6;
        minX = Math.min(minX, labelMinX - 3);
        maxX = Math.max(maxX, labelMaxX + 3);
        minY = Math.min(minY, labelMinY - 3);
        maxY = Math.max(maxY, labelMaxY + 3);
      }
    }
    return { minX, maxX, minY, maxY };
  };

  const getWireBounds = (wire) => {
    const points = Array.isArray(wire?.points) ? wire.points : [];
    if (!points.length) {
      return null;
    }
    const xs = points.map((point) => point.x);
    const ys = points.map((point) => point.y);
    return {
      minX: Math.min(...xs),
      maxX: Math.max(...xs),
      minY: Math.min(...ys),
      maxY: Math.max(...ys)
    };
  };

  const buildOrthogonalWirePoints = (start, end) => {
    const points = [{ x: start.x, y: start.y }];
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    if (dx === 0 || dy === 0) {
      points.push({ x: end.x, y: end.y });
      return points;
    }
    if (Math.abs(dx) >= Math.abs(dy)) {
      points.push({ x: end.x, y: start.y });
    } else {
      points.push({ x: start.x, y: end.y });
    }
    points.push({ x: end.x, y: end.y });
    return points;
  };

  const createWirePoints = (start, end, gridSize, options) => {
    const points = buildOrthogonalWirePoints(start, end);
    if (gridSize > 0) {
      const snappedPoints = points.map((point) => ({
        x: Math.round(point.x / gridSize) * gridSize,
        y: Math.round(point.y / gridSize) * gridSize
      }));
      const preserveStart = options?.preserveStart === true;
      const preserveEnd = options?.preserveEnd === true;
      if (preserveStart && snappedPoints.length) {
        snappedPoints[0] = { x: start.x, y: start.y };
        if (snappedPoints.length > 1) {
          const originalNext = points[1];
          if (Math.abs((originalNext?.x ?? 0) - start.x) < 0.001) {
            snappedPoints[1].x = start.x;
          } else {
            snappedPoints[1].y = start.y;
          }
        }
      }
      if (preserveEnd && snappedPoints.length) {
        const lastIndex = snappedPoints.length - 1;
        snappedPoints[lastIndex] = { x: end.x, y: end.y };
        if (lastIndex > 0) {
          const prevIndex = lastIndex - 1;
          const originalPrev = points[prevIndex];
          if (Math.abs((originalPrev?.x ?? 0) - end.x) < 0.001) {
            snappedPoints[prevIndex].x = end.x;
          } else {
            snappedPoints[prevIndex].y = end.y;
          }
        }
      }
      return snappedPoints;
    }
    return points;
  };

  const createWirePreviewPoints = (start, end) => {
    if (!start || !end) {
      return [];
    }
    return buildOrthogonalWirePoints(start, end);
  };

  const createEditor = (container, model, options) => {
    if (!container) {
      return null;
    }
    const api = typeof self !== "undefined" ? (self.SpjutSimSchematic ?? {}) : {};
    const svg = ensureSvg(container);
    const gridGroup = ensureGroup(svg, "schematic-grid");
    const wireGroup = ensureGroup(svg, "schematic-wires");
    const componentGroup = ensureGroup(svg, "schematic-components");
    const overlayGroup = ensureGroup(svg, "schematic-overlay");
    svg.setAttribute("viewBox", `${DEFAULT_VIEW.x} ${DEFAULT_VIEW.y} ${DEFAULT_VIEW.width} ${DEFAULT_VIEW.height}`);

    const state = {
      model,
      tool: { mode: "select" },
      view: { ...DEFAULT_VIEW },
      grid: { ...DEFAULT_GRID },
      selectionIds: [],
      selectionBox: null,
      wireStart: null,
      wirePreview: null,
      probeDiffStart: null,
      probeDiffPreview: null,
      probeDiffEndpointSelection: null,
      probeDiffEndpointDrag: null,
      wireSelection: null,
      wireSelections: [],
      wireHandle: null,
      wireNode: null,
      preview: null,
      selectionPlacement: null,
      placeTransform: { ...IDENTITY_TRANSFORM },
      drag: null,
      pan: null,
      touchPointers: new Map(),
      touchPinch: null,
      touchCapturedPointerIds: new Set(),
      dragType: null,
      hoveredComponentId: null,
      hoveredWireId: null,
      lastSelectClick: null,
      measurements: new Map(),
      probeLabels: new Map(),
      externalHighlightComponentIds: new Set(),
      externalHighlightWireIds: new Set(),
      externalHighlightColor: DEFAULT_EXTERNAL_HIGHLIGHT_COLOR,
      externalHighlightEntries: [],
      refDesCounters: new Map(),
      wireCount: 0,
      history: {
        undo: [],
        redo: []
      },
      isRestoring: false,
      skipViewSyncOnce: false
    };
    let renderRequestId = null;
    let scheduleRender = null;

    const getComponent = (id) => (state.model?.components ?? []).find((entry) => entry.id === id) ?? null;
    const getWire = (id) => (state.model?.wires ?? []).find((entry) => entry.id === id) ?? null;
    const pointKey = (point) => `${point.x},${point.y}`;
    const getWirePriority = (wire) => {
      const id = String(wire?.id ?? "");
      if (id.startsWith("__")) {
        return { order: Number.MAX_SAFE_INTEGER, id };
      }
      const match = /^W(\d+)$/i.exec(id);
      const parsed = match ? Number(match[1]) : 0;
      const order = Number.isFinite(parsed) ? parsed : 0;
      return { order, id };
    };
    const isHigherPriority = (current, other) => {
      if (!other) {
        return true;
      }
      if (current.order !== other.order) {
        return current.order > other.order;
      }
      return current.id > other.id;
    };

    const syncCounters = (component) => {
      if (!component || !component.id) {
        return;
      }
      const match = /^([A-Za-z]+)(\d+)$/.exec(component.id);
      if (!match) {
        return;
      }
      const prefix = match[1].toUpperCase();
      const index = Number(match[2]);
      if (!Number.isFinite(index)) {
        return;
      }
      const current = state.refDesCounters.get(prefix) ?? 0;
      if (index > current) {
        state.refDesCounters.set(prefix, index);
      }
    };

    (state.model?.components ?? []).forEach(syncCounters);

    const getMaxRefIndex = (type) => {
      const key = String(type ?? "").toUpperCase();
      let maxIndex = 0;
      (state.model?.components ?? []).forEach((component) => {
        const id = String(component?.id ?? "");
        const match = /^([A-Za-z]+)(\d+)$/.exec(id);
        if (!match || match[1].toUpperCase() !== key) {
          return;
        }
        const index = Number(match[2]);
        if (Number.isFinite(index) && index > maxIndex) {
          maxIndex = index;
        }
      });
      return maxIndex;
    };

    const syncWireCount = (wire) => {
      if (!wire || !wire.id) {
        return;
      }
      const match = /^W(\d+)$/i.exec(String(wire.id));
      if (!match) {
        return;
      }
      const index = Number(match[1]);
      if (!Number.isFinite(index)) {
        return;
      }
      if (index > state.wireCount) {
        state.wireCount = index;
      }
    };

    (state.model?.wires ?? []).forEach(syncWireCount);

    const nextRefDes = (type) => {
      const key = String(type ?? "").toUpperCase();
      const current = state.refDesCounters.get(key) ?? 0;
      const maxExisting = getMaxRefIndex(key);
      const nextIndex = Math.max(current, maxExisting) + 1;
      state.refDesCounters.set(key, nextIndex);
      return `${key}${nextIndex}`;
    };

    const nextWireId = () => {
      state.wireCount += 1;
      return `W${state.wireCount}`;
    };

    const getPinKeySet = () => {
      const pins = new Set();
      (state.model?.components ?? []).forEach((component) => {
        if (!isElectricalComponentType(component?.type)) {
          return;
        }
        (component.pins ?? []).forEach((pin) => {
          pins.add(pointKey(pin));
        });
      });
      return pins;
    };

    const getWirePointCounts = () => {
      const counts = new Map();
      (state.model?.wires ?? []).forEach((wire) => {
        const points = Array.isArray(wire.points) ? wire.points : [];
        const unique = new Set();
        points.forEach((point) => {
          unique.add(pointKey(point));
        });
        unique.forEach((key) => {
          counts.set(key, (counts.get(key) ?? 0) + 1);
        });
      });
      return counts;
    };

    const getWirePointKeySet = () => {
      const keys = new Set();
      (state.model?.wires ?? []).forEach((wire) => {
        (wire.points ?? []).forEach((point) => {
          keys.add(pointKey(point));
        });
      });
      return keys;
    };

    const normalizeNetColorValue = (value) => {
      if (typeof api.normalizeNetColor !== "function") {
        return null;
      }
      return api.normalizeNetColor(value);
    };

    const resolveNetColorState = () => {
      if (typeof api.resolveNetColors !== "function") {
        return {
          wireColors: {},
          netColors: {}
        };
      }
      const resolved = api.resolveNetColors(state.model);
      return {
        wireColors: (resolved && typeof resolved.wireColors === "object") ? resolved.wireColors : {},
        netColors: (resolved && typeof resolved.netColors === "object") ? resolved.netColors : {}
      };
    };

    const getEquivalentNamedNodeIds = (componentId) => {
      const targetId = String(componentId ?? "");
      const component = getComponent(targetId);
      if (!component || String(component.type ?? "").toUpperCase() !== "NET") {
        return targetId ? [targetId] : [];
      }
      if (typeof api.buildNets !== "function") {
        return [targetId];
      }
      const targetPin = Array.isArray(component.pins) ? component.pins[0] : null;
      if (!targetPin) {
        return [targetId];
      }
      let nets = [];
      try {
        const built = api.buildNets(state.model);
        nets = Array.isArray(built) ? built : [];
      } catch {
        return [targetId];
      }
      if (!nets.length) {
        return [targetId];
      }
      const pointToNetIndex = new Map();
      nets.forEach((net, index) => {
        (net.nodes ?? []).forEach((node) => {
          pointToNetIndex.set(pointKey(node), index);
        });
      });
      const targetNetIndex = pointToNetIndex.get(pointKey(targetPin));
      if (!Number.isFinite(targetNetIndex)) {
        return [targetId];
      }
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
        if (rootFirst !== rootSecond) {
          parent[rootSecond] = rootFirst;
        }
      };
      const normalizeLabelKey = (value) => String(value ?? "").trim().toLowerCase();
      const labelNetIndexByKey = new Map();
      nets.forEach((net, index) => {
        const labels = new Set();
        (net.pins ?? []).forEach((pin) => {
          const netComponent = getComponent(pin.componentId);
          if (!netComponent || String(netComponent.type ?? "").toUpperCase() !== "NET") {
            return;
          }
          const labelKey = normalizeLabelKey(
            Object.prototype.hasOwnProperty.call(netComponent, "name")
              ? netComponent.name
              : netComponent.id
          );
          if (labelKey) {
            labels.add(labelKey);
          }
        });
        labels.forEach((labelKey) => {
          const existing = labelNetIndexByKey.get(labelKey);
          if (Number.isFinite(existing)) {
            unionRoots(index, existing);
          } else {
            labelNetIndexByKey.set(labelKey, index);
          }
        });
      });
      const targetRoot = findRoot(targetNetIndex);
      const ids = new Set();
      nets.forEach((net, index) => {
        if (findRoot(index) !== targetRoot) {
          return;
        }
        (net.pins ?? []).forEach((pin) => {
          const netComponent = getComponent(pin.componentId);
          if (!netComponent || String(netComponent.type ?? "").toUpperCase() !== "NET") {
            return;
          }
          ids.add(String(netComponent.id ?? ""));
        });
      });
      if (!ids.size) {
        ids.add(targetId);
      }
      return Array.from(ids);
    };

    const buildPinTopologySignature = (modelForSignature) => {
      const source = modelForSignature ?? state.model;
      if (typeof api.buildNets !== "function") {
        return null;
      }
      try {
        const nets = api.buildNets(source);
        if (!Array.isArray(nets)) {
          return "";
        }
        return nets
          .map((net) =>
            (net.pins ?? [])
              .map((pin) => `${String(pin.componentId ?? "")}::${String(pin.pinId ?? "")}`)
              .sort()
              .join("|"))
          .sort()
          .join("||");
      } catch {
        return null;
      }
    };

    const buildSimplifyStableSignature = (modelForSignature) => {
      const source = modelForSignature ?? state.model;
      const componentSignature = (source?.components ?? [])
        .map((component) => {
          const pins = (component?.pins ?? [])
            .map((pin) => `${String(pin?.id ?? "")}:${Number(pin?.x)}:${Number(pin?.y)}`)
            .join("|");
          return [
            String(component?.id ?? ""),
            String(component?.type ?? ""),
            String(component?.value ?? ""),
            String(component?.rotation ?? ""),
            String(component?.labelRotation ?? ""),
            pins
          ].join("~");
        })
        .sort()
        .join("||");
      const wireGeometrySignature = (source?.wires ?? [])
        .map((wire) =>
          (wire?.points ?? [])
            .map((point) => `${Number(point?.x)},${Number(point?.y)}`)
            .join(">")
        )
        .sort()
        .join("||");
      return `${componentSignature}@@${wireGeometrySignature}`;
    };

    const replaceModelFromSnapshot = (snapshot) => {
      const restored = cloneModel(snapshot);
      state.model.components.length = 0;
      restored.components.forEach((component) => state.model.components.push(component));
      state.model.wires.length = 0;
      restored.wires.forEach((wire) => state.model.wires.push(wire));
    };

    const pointsEqual = (first, second) =>
      first.length === second.length
      && first.every((point, index) => point.x === second[index]?.x && point.y === second[index]?.y);

    const buildRenderableNodeAxisIndex = (nodes) => {
      const rows = new Map();
      const cols = new Map();
      nodes.forEach((node) => {
        let row = rows.get(node.y);
        if (!row) {
          row = [];
          rows.set(node.y, row);
        }
        row.push(node);
        let col = cols.get(node.x);
        if (!col) {
          col = [];
          cols.set(node.x, col);
        }
        col.push(node);
      });
      rows.forEach((row) => {
        row.sort((a, b) => a.x - b.x);
      });
      cols.forEach((col) => {
        col.sort((a, b) => a.y - b.y);
      });
      return { rows, cols };
    };

    const collectRenderableJunctionInfo = (wires, components) => {
      const pinCounts = new Map();
      const nodeByKey = new Map();
      const safeWires = Array.isArray(wires) ? wires : [];
      const safeComponents = Array.isArray(components) ? components : [];

      safeWires.forEach((wire) => {
        const points = Array.isArray(wire?.points) ? wire.points : [];
        points.forEach((point) => {
          if (!point || !Number.isFinite(point.x) || !Number.isFinite(point.y)) {
            return;
          }
          const key = pointKey(point);
          if (!nodeByKey.has(key)) {
            nodeByKey.set(key, { key, x: point.x, y: point.y });
          }
        });
      });

      safeComponents.forEach((component) => {
        if (!isElectricalComponentType(component?.type)) {
          return;
        }
        const pins = Array.isArray(component?.pins) ? component.pins : [];
        pins.forEach((pin) => {
          if (!pin || !Number.isFinite(pin.x) || !Number.isFinite(pin.y)) {
            return;
          }
          const key = pointKey(pin);
          pinCounts.set(key, (pinCounts.get(key) ?? 0) + 1);
          if (!nodeByKey.has(key)) {
            nodeByKey.set(key, { key, x: pin.x, y: pin.y });
          }
        });
      });

      const { rows, cols } = buildRenderableNodeAxisIndex(Array.from(nodeByKey.values()));
      const degrees = new Map();
      const addDegree = (key) => {
        degrees.set(key, (degrees.get(key) ?? 0) + 1);
      };
      const addSegmentDegrees = (candidates) => {
        if (!Array.isArray(candidates) || candidates.length < 2) {
          return;
        }
        for (let index = 0; index < candidates.length - 1; index += 1) {
          const start = candidates[index];
          const end = candidates[index + 1];
          if (!start || !end) {
            continue;
          }
          if (start.x === end.x && start.y === end.y) {
            continue;
          }
          addDegree(start.key);
          addDegree(end.key);
        }
      };
      const collectHorizontalCandidates = (y, minX, maxX) => {
        const row = rows.get(y);
        if (!row?.length) {
          return [];
        }
        const candidates = [];
        row.forEach((node) => {
          if (node.x < minX) {
            return;
          }
          if (node.x > maxX) {
            return;
          }
          candidates.push(node);
        });
        return candidates;
      };
      const collectVerticalCandidates = (x, minY, maxY) => {
        const col = cols.get(x);
        if (!col?.length) {
          return [];
        }
        const candidates = [];
        col.forEach((node) => {
          if (node.y < minY) {
            return;
          }
          if (node.y > maxY) {
            return;
          }
          candidates.push(node);
        });
        return candidates;
      };

      safeWires.forEach((wire) => {
        const points = Array.isArray(wire?.points) ? wire.points : [];
        for (let index = 0; index < points.length - 1; index += 1) {
          const start = points[index];
          const end = points[index + 1];
          if (!start || !end) {
            continue;
          }
          if (start.x === end.x && start.y === end.y) {
            continue;
          }
          if (start.y === end.y) {
            const minX = Math.min(start.x, end.x);
            const maxX = Math.max(start.x, end.x);
            const candidates = collectHorizontalCandidates(start.y, minX, maxX);
            if (candidates.length >= 2) {
              addSegmentDegrees(candidates);
            } else {
              addDegree(pointKey(start));
              addDegree(pointKey(end));
            }
            continue;
          }
          if (start.x === end.x) {
            const minY = Math.min(start.y, end.y);
            const maxY = Math.max(start.y, end.y);
            const candidates = collectVerticalCandidates(start.x, minY, maxY);
            if (candidates.length >= 2) {
              addSegmentDegrees(candidates);
            } else {
              addDegree(pointKey(start));
              addDegree(pointKey(end));
            }
            continue;
          }
          addDegree(pointKey(start));
          addDegree(pointKey(end));
        }
      });

      const combinedDegrees = new Map(degrees);
      pinCounts.forEach((count, key) => {
        combinedDegrees.set(key, (combinedDegrees.get(key) ?? 0) + count);
      });
      return { pinCounts, combinedDegrees };
    };

    const getWirePointDegrees = () => {
      const degrees = new Map();
      (state.model?.wires ?? []).forEach((wire) => {
        const points = Array.isArray(wire.points) ? wire.points : [];
        for (let index = 0; index < points.length - 1; index += 1) {
          const start = points[index];
          const end = points[index + 1];
          if (!start || !end) {
            continue;
          }
          if (start.x === end.x && start.y === end.y) {
            continue;
          }
          const startKey = pointKey(start);
          const endKey = pointKey(end);
          degrees.set(startKey, (degrees.get(startKey) ?? 0) + 1);
          degrees.set(endKey, (degrees.get(endKey) ?? 0) + 1);
        }
      });
      return degrees;
    };

    const getJunctionKeySet = () => {
      const counts = getWirePointDegrees();
      const junctions = new Set();
      counts.forEach((degree, key) => {
        if (degree >= 3) {
          junctions.add(key);
        }
      });
      return junctions;
    };

    const getLockedJunctionKeySetForWireSelection = (selectedWireIds) => {
      const totalDegrees = getWirePointDegrees();
      const selectedIds = selectedWireIds instanceof Set
        ? selectedWireIds
        : null;
      if (!selectedIds || !selectedIds.size) {
        const allJunctions = new Set();
        totalDegrees.forEach((degree, key) => {
          if (degree >= 3) {
            allJunctions.add(key);
          }
        });
        return allJunctions;
      }
      const selectedDegrees = new Map();
      (state.model?.wires ?? []).forEach((wire) => {
        if (!selectedIds.has(String(wire?.id ?? ""))) {
          return;
        }
        const points = Array.isArray(wire?.points) ? wire.points : [];
        for (let index = 0; index < points.length - 1; index += 1) {
          const start = points[index];
          const end = points[index + 1];
          if (!start || !end || (start.x === end.x && start.y === end.y)) {
            continue;
          }
          const startKey = pointKey(start);
          const endKey = pointKey(end);
          selectedDegrees.set(startKey, (selectedDegrees.get(startKey) ?? 0) + 1);
          selectedDegrees.set(endKey, (selectedDegrees.get(endKey) ?? 0) + 1);
        }
      });
      const locked = new Set();
      totalDegrees.forEach((degree, key) => {
        if (degree < 3) {
          return;
        }
        if ((selectedDegrees.get(key) ?? 0) < degree) {
          locked.add(key);
        }
      });
      return locked;
    };

    const parsePointKey = (key) => {
      if (!key) {
        return null;
      }
      const parts = String(key).split(",");
      if (parts.length !== 2) {
        return null;
      }
      const x = Number(parts[0]);
      const y = Number(parts[1]);
      if (!Number.isFinite(x) || !Number.isFinite(y)) {
        return null;
      }
      return { x, y };
    };

    const getJunctionSlideInfo = (junctions) => {
      const info = new Map();
      if (!junctions || !junctions.size) {
        return info;
      }
      const ensureEntry = (key) => {
        let entry = info.get(key);
        if (!entry) {
          entry = {
            hCount: 0,
            vCount: 0,
            hWires: new Set(),
            vWires: new Set()
          };
          info.set(key, entry);
        }
        return entry;
      };
      (state.model?.wires ?? []).forEach((wire) => {
        const points = Array.isArray(wire?.points) ? wire.points : [];
        if (points.length < 2) {
          return;
        }
        const wireKey = String(wire.id);
        for (let i = 0; i < points.length - 1; i += 1) {
          const start = points[i];
          const end = points[i + 1];
          if (!start || !end) {
            continue;
          }
          if (start.x === end.x && start.y === end.y) {
            continue;
          }
          let orientation = null;
          if (start.x === end.x) {
            orientation = "v";
          } else if (start.y === end.y) {
            orientation = "h";
          }
          if (!orientation) {
            continue;
          }
          const markEndpoint = (point) => {
            const key = pointKey(point);
            if (!junctions.has(key)) {
              return;
            }
            const entry = ensureEntry(key);
            if (orientation === "h") {
              entry.hCount += 1;
              entry.hWires.add(wireKey);
            } else {
              entry.vCount += 1;
              entry.vWires.add(wireKey);
            }
          };
          markEndpoint(start);
          markEndpoint(end);
        }
      });
      const slideInfo = new Map();
      info.forEach((entry, key) => {
        const hasH = entry.hCount >= 2;
        const hasV = entry.vCount >= 2;
        if (hasH && !hasV) {
          slideInfo.set(key, { orientation: "h", wires: entry.hWires });
          return;
        }
        if (hasV && !hasH) {
          slideInfo.set(key, { orientation: "v", wires: entry.vWires });
          return;
        }
        slideInfo.set(key, { orientation: null, wires: new Set() });
      });
      return slideInfo;
    };

    const getPassThroughSpanAtJunction = (junctionKey, orientation, wireIds, previewWires) => {
      const origin = parsePointKey(junctionKey);
      if (!origin || !wireIds || !wireIds.size) {
        return null;
      }
      let min = Infinity;
      let max = -Infinity;
      const isHorizontal = orientation === "h";
      wireIds.forEach((wireId) => {
        const points = previewWires?.get(wireId) ?? getWire(wireId)?.points;
        if (!Array.isArray(points) || points.length < 2) {
          return;
        }
        for (let i = 0; i < points.length - 1; i += 1) {
          const start = points[i];
          const end = points[i + 1];
          if (!start || !end) {
            continue;
          }
          if (isHorizontal) {
            if (start.y !== end.y || start.y !== origin.y) {
              continue;
            }
            const segMin = Math.min(start.x, end.x);
            const segMax = Math.max(start.x, end.x);
            if (origin.x < segMin - 0.01 || origin.x > segMax + 0.01) {
              continue;
            }
            min = Math.min(min, segMin);
            max = Math.max(max, segMax);
          } else {
            if (start.x !== end.x || start.x !== origin.x) {
              continue;
            }
            const segMin = Math.min(start.y, end.y);
            const segMax = Math.max(start.y, end.y);
            if (origin.y < segMin - 0.01 || origin.y > segMax + 0.01) {
              continue;
            }
            min = Math.min(min, segMin);
            max = Math.max(max, segMax);
          }
        }
      });
      if (!Number.isFinite(min) || !Number.isFinite(max)) {
        return null;
      }
      return { origin, min, max };
    };

    const getAnchoredPointKeySet = () => {
      const anchored = getPinKeySet();
      const junctions = getJunctionKeySet();
      junctions.forEach((key) => anchored.add(key));
      return anchored;
    };

    const capturePinSnapshots = (componentIds) => {
      const snapshots = new Map();
      componentIds.forEach((id) => {
        const component = getComponent(id);
        if (!component) {
          return;
        }
        snapshots.set(id, component.pins.map((pin) => ({ x: pin.x, y: pin.y })));
      });
      return snapshots;
    };

    const attachPinsToWires = (componentIds, options) => {
      const ids = Array.isArray(componentIds) ? componentIds : [];
      if (!ids.length) {
        return false;
      }
      const wires = Array.isArray(state.model?.wires) ? state.model.wires : [];
      if (!wires.length) {
        return false;
      }
      const hasExplicitWireIds = options?.wireIds instanceof Set || Array.isArray(options?.wireIds);
      const wireIdSet = options?.wireIds instanceof Set
        ? new Set(Array.from(options.wireIds, (id) => String(id)))
        : (Array.isArray(options?.wireIds)
            ? new Set(options.wireIds.filter(Boolean).map((id) => String(id)))
            : null);
      if (hasExplicitWireIds && (!wireIdSet || !wireIdSet.size)) {
        return false;
      }
      let updated = false;
      ids.forEach((id) => {
        const component = getComponent(id);
        if (!component) {
          return;
        }
        if (!isElectricalComponentType(component?.type)) {
          return;
        }
        (component.pins ?? []).forEach((pin) => {
          if (!Number.isFinite(pin.x) || !Number.isFinite(pin.y)) {
            return;
          }
          wires.forEach((wire) => {
            if (wireIdSet && !wireIdSet.has(String(wire?.id ?? ""))) {
              return;
            }
            const points = Array.isArray(wire.points) ? wire.points : [];
            for (let index = 0; index < points.length - 1; index += 1) {
              const start = points[index];
              const end = points[index + 1];
              if (!start || !end) {
                continue;
              }
              if (start.x === end.x) {
                if (pin.x !== start.x) {
                  continue;
                }
                const minY = Math.min(start.y, end.y);
                const maxY = Math.max(start.y, end.y);
                if (pin.y < minY || pin.y > maxY) {
                  continue;
                }
              } else if (start.y === end.y) {
                if (pin.y !== start.y) {
                  continue;
                }
                const minX = Math.min(start.x, end.x);
                const maxX = Math.max(start.x, end.x);
                if (pin.x < minX || pin.x > maxX) {
                  continue;
                }
              } else {
                continue;
              }
              const existing = points.find((point) => point.x === pin.x && point.y === pin.y);
              if (!existing) {
                points.splice(index + 1, 0, { x: pin.x, y: pin.y });
                updated = true;
              }
              break;
            }
          });
        });
      });
      if (updated) {
        if (options?.normalize === false) {
          return true;
        }
        if (options?.excludeIds instanceof Set && options.excludeIds.size) {
          normalizeAllWiresExcluding(options.excludeIds);
        } else {
          normalizeAllWires();
        }
      }
      return updated;
    };

    const buildMoveMapFromOrigins = (componentIds, originsById) => {
      const moveMap = new Map();
      componentIds.forEach((id) => {
        const component = getComponent(id);
        const origins = originsById.get(id);
        if (!component || !origins) {
          return;
        }
        if (!isElectricalComponentType(component?.type)) {
          return;
        }
        component.pins.forEach((pin, index) => {
          const origin = origins[index];
          if (!origin) {
            return;
          }
          moveMap.set(pointKey(origin), { x: pin.x, y: pin.y });
        });
      });
      return moveMap;
    };

    const updateWiresFromMoveMap = (moveMap, options) => {
      if (!moveMap || !moveMap.size) {
        return false;
      }
      const hasExplicitWireIds = options?.wireIds instanceof Set || Array.isArray(options?.wireIds);
      const wireIdSet = options?.wireIds instanceof Set
        ? new Set(Array.from(options.wireIds, (id) => String(id)))
        : (Array.isArray(options?.wireIds)
            ? new Set(options.wireIds.filter(Boolean).map((id) => String(id)))
            : null);
      if (hasExplicitWireIds && (!wireIdSet || !wireIdSet.size)) {
        return false;
      }
      const touchedWires = new Set();
      (state.model?.wires ?? []).forEach((wire) => {
        if (wireIdSet && !wireIdSet.has(String(wire?.id ?? ""))) {
          return;
        }
        (wire.points ?? []).forEach((point) => {
          const next = moveMap.get(pointKey(point));
          if (next) {
            point.x = next.x;
            point.y = next.y;
            touchedWires.add(wire);
          }
        });
      });
      if (touchedWires.size) {
        if (options?.normalize === false) {
          return true;
        }
        if (options?.excludeIds instanceof Set && options.excludeIds.size) {
          normalizeAllWiresExcluding(options.excludeIds);
        } else {
          normalizeAllWires();
        }
        return true;
      }
      return false;
    };

    const applyPreviewWires = (previewWires, resnapMap) => {
      if (!previewWires || !previewWires.size) {
        return false;
      }
      let updated = false;
      previewWires.forEach((points, wireId) => {
        const wire = getWire(wireId);
        if (!wire || !Array.isArray(points)) {
          return;
        }
        wire.points.length = 0;
        points.forEach((point) => {
          const mapped = resnapMap?.get(pointKey(point));
          if (mapped) {
            wire.points.push({ x: mapped.x, y: mapped.y });
          } else {
            wire.points.push({ x: point.x, y: point.y });
          }
        });
        updated = true;
      });
      return updated;
    };

    const snapWirePoints = (wireIds) => {
      if (!state.grid.snap || state.grid.size <= 0) {
        return false;
      }
      const hasExplicitIds = wireIds instanceof Set || Array.isArray(wireIds);
      const idSet = wireIds instanceof Set
        ? new Set(Array.from(wireIds, (id) => String(id)))
        : (Array.isArray(wireIds) ? new Set(wireIds.filter(Boolean).map((id) => String(id))) : null);
      if (hasExplicitIds && (!idSet || !idSet.size)) {
        return false;
      }
      let updated = false;
      (state.model?.wires ?? []).forEach((wire) => {
        if (idSet && !idSet.has(String(wire?.id ?? ""))) {
          return;
        }
        (wire.points ?? []).forEach((point) => {
          const snappedX = snapCoord(point.x);
          const snappedY = snapCoord(point.y);
          if (snappedX !== point.x || snappedY !== point.y) {
            point.x = snappedX;
            point.y = snappedY;
            updated = true;
          }
        });
      });
      return updated;
    };

    const snapWirePointsNearGrid = (wireIds, tolerance) => {
      if (!state.grid.snap || state.grid.size <= 0) {
        return false;
      }
      const epsilon = Number.isFinite(tolerance) && tolerance > 0 ? tolerance : 0.001;
      const hasExplicitIds = wireIds instanceof Set || Array.isArray(wireIds);
      const idSet = wireIds instanceof Set
        ? new Set(Array.from(wireIds, (id) => String(id)))
        : (Array.isArray(wireIds) ? new Set(wireIds.filter(Boolean).map((id) => String(id))) : null);
      if (hasExplicitIds && (!idSet || !idSet.size)) {
        return false;
      }
      let updated = false;
      (state.model?.wires ?? []).forEach((wire) => {
        if (idSet && !idSet.has(String(wire?.id ?? ""))) {
          return;
        }
        (wire.points ?? []).forEach((point) => {
          const snappedX = snapCoord(point.x);
          const snappedY = snapCoord(point.y);
          if (Math.abs(snappedX - point.x) <= epsilon) {
            point.x = snappedX;
            updated = true;
          }
          if (Math.abs(snappedY - point.y) <= epsilon) {
            point.y = snappedY;
            updated = true;
          }
        });
      });
      return updated;
    };

    const buildWireAnchors = (componentIds, excludeWireIds) => {
      const pinMap = new Map();
      componentIds.forEach((id) => {
        const component = getComponent(id);
        if (!component) {
          return;
        }
        if (!isElectricalComponentType(component?.type)) {
          return;
        }
        (component.pins ?? []).forEach((pin) => {
          pinMap.set(pointKey(pin), pin);
        });
      });
      if (!pinMap.size) {
        return [];
      }
      const anchors = [];
      (state.model?.wires ?? []).forEach((wire) => {
        if (excludeWireIds && excludeWireIds.has(String(wire?.id ?? ""))) {
          return;
        }
        (wire.points ?? []).forEach((point, index) => {
          const pin = pinMap.get(pointKey(point));
          if (pin) {
            anchors.push({ wire, point, pin, index });
          }
        });
      });
      return anchors;
    };

    const buildSharedPinAnchors = (componentIds, pinSnapshots) => {
      if (!Array.isArray(componentIds) || !componentIds.length || !pinSnapshots) {
        return [];
      }
      const draggedIds = new Set(componentIds.map((id) => String(id)));
      const unselectedPins = new Set();
      (state.model?.components ?? []).forEach((component) => {
        if (draggedIds.has(String(component?.id ?? ""))) {
          return;
        }
        if (!isElectricalComponentType(component?.type)) {
          return;
        }
        (component.pins ?? []).forEach((pin) => {
          unselectedPins.add(pointKey(pin));
        });
      });
      if (!unselectedPins.size) {
        return [];
      }
      const wirePoints = getWirePointKeySet();
      const anchors = [];
      componentIds.forEach((id) => {
        const pins = pinSnapshots.get(id);
        if (!Array.isArray(pins)) {
          return;
        }
        pins.forEach((pin, index) => {
          const key = pointKey(pin);
          if (!unselectedPins.has(key)) {
            return;
          }
          if (wirePoints.has(key)) {
            return;
          }
          anchors.push({
            componentId: String(id),
            index,
            start: { x: pin.x, y: pin.y }
          });
        });
      });
      return anchors;
    };

    const getWireAnchorAxis = (anchor) => {
      if (!anchor || !anchor.wire || !Number.isFinite(anchor.index)) {
        return null;
      }
      const points = Array.isArray(anchor.wire.points) ? anchor.wire.points : [];
      const curr = points[anchor.index];
      const prev = points[anchor.index - 1];
      const next = points[anchor.index + 1];
      if (!curr || !prev || !next) {
        return null;
      }
      const prevHorizontal = prev.y === curr.y;
      const nextHorizontal = next.y === curr.y;
      if (prevHorizontal && nextHorizontal) {
        return "h";
      }
      const prevVertical = prev.x === curr.x;
      const nextVertical = next.x === curr.x;
      if (prevVertical && nextVertical) {
        return "v";
      }
      return null;
    };

    const getBranchAnchors = (anchors, dx, dy, lockedKeys) => {
      if (!anchors || !anchors.length) {
        return [];
      }
      const threshold = Math.max(2, Math.round((state.grid.size || 20) * 0.25));
      return anchors.filter((anchor) => {
        if (lockedKeys && lockedKeys.has(pointKey(anchor.point))) {
          return Math.abs(dx) >= threshold || Math.abs(dy) >= threshold;
        }
        const axis = getWireAnchorAxis(anchor);
        if (axis === "h") {
          return Math.abs(dy) >= threshold;
        }
        if (axis === "v") {
          return Math.abs(dx) >= threshold;
        }
        return false;
      });
    };

    const simplifyWirePoints = (points, anchoredKeys) => {
      const cleaned = [];
      points.forEach((point) => {
        const last = cleaned[cleaned.length - 1];
        if (!last || last.x !== point.x || last.y !== point.y) {
          cleaned.push(point);
        }
      });
      for (let index = 1; index < cleaned.length - 1;) {
        const prev = cleaned[index - 1];
        const curr = cleaned[index];
        const next = cleaned[index + 1];
        if (anchoredKeys && anchoredKeys.has(pointKey(curr))) {
          index += 1;
          continue;
        }
        if ((prev.x === curr.x && curr.x === next.x) || (prev.y === curr.y && curr.y === next.y)) {
          cleaned.splice(index, 1);
        } else {
          index += 1;
        }
      }
      return cleaned;
    };

    const getSegmentOrientation = (start, end) => {
      if (!start || !end) {
        return null;
      }
      if (start.x === end.x && start.y === end.y) {
        return null;
      }
      if (start.x === end.x) {
        return "v";
      }
      if (start.y === end.y) {
        return "h";
      }
      return null;
    };

    const countPathBends = (points) => {
      if (!Array.isArray(points) || points.length < 3) {
        return 0;
      }
      let bends = 0;
      let lastOrientation = getSegmentOrientation(points[0], points[1]);
      for (let index = 1; index < points.length - 1; index += 1) {
        const orientation = getSegmentOrientation(points[index], points[index + 1]);
        if (!orientation) {
          continue;
        }
        if (lastOrientation && orientation !== lastOrientation) {
          bends += 1;
        }
        lastOrientation = orientation;
      }
      return bends;
    };

    const getPathLength = (points) => {
      if (!Array.isArray(points) || points.length < 2) {
        return 0;
      }
      let length = 0;
      for (let index = 0; index < points.length - 1; index += 1) {
        const start = points[index];
        const end = points[index + 1];
        if (!start || !end) {
          continue;
        }
        length += Math.abs(end.x - start.x) + Math.abs(end.y - start.y);
      }
      return length;
    };

    const getPathDisplacement = (points, referencePoints) => {
      if (!Array.isArray(points) || !points.length || !Array.isArray(referencePoints) || !referencePoints.length) {
        return 0;
      }
      let displacement = 0;
      points.forEach((point) => {
        let bestDistance = Infinity;
        referencePoints.forEach((referencePoint) => {
          const distance = Math.abs(point.x - referencePoint.x) + Math.abs(point.y - referencePoint.y);
          if (distance < bestDistance) {
            bestDistance = distance;
          }
        });
        if (Number.isFinite(bestDistance)) {
          displacement += bestDistance;
        }
      });
      return displacement;
    };

    const getPathSignature = (points) =>
      (Array.isArray(points) ? points : []).map((point) => `${point.x},${point.y}`).join("|");

    const buildContextPath = (points, context) => {
      const path = [];
      const appendPoint = (point) => {
        if (!point) {
          return;
        }
        const next = { x: point.x, y: point.y };
        const last = path[path.length - 1];
        if (!last || last.x !== next.x || last.y !== next.y) {
          path.push(next);
        }
      };
      if (context?.prevPoint) {
        appendPoint(context.prevPoint);
      }
      (Array.isArray(points) ? points : []).forEach((point) => appendPoint(point));
      if (context?.nextPoint) {
        appendPoint(context.nextPoint);
      }
      return path;
    };

    const countEndpointAxisMismatches = (points, endpointAxes) => {
      if (!Array.isArray(points) || points.length < 2 || !endpointAxes) {
        return 0;
      }
      let mismatches = 0;
      const startAxis = endpointAxes.start;
      const endAxis = endpointAxes.end;
      const startOrientation = getSegmentOrientation(points[0], points[1]);
      if (startAxis && startOrientation && startAxis !== startOrientation) {
        mismatches += 1;
      }
      const lastIndex = points.length - 1;
      const endOrientation = getSegmentOrientation(points[lastIndex - 1], points[lastIndex]);
      if (endAxis && endOrientation && endAxis !== endOrientation) {
        mismatches += 1;
      }
      return mismatches;
    };

    const getPathScore = (points, referencePoints, endpointPenalty) => {
      const bends = countPathBends(points);
      const endpointBends = Number.isFinite(endpointPenalty) ? endpointPenalty : 0;
      const length = getPathLength(points);
      const displacement = getPathDisplacement(points, referencePoints);
      return (bends + endpointBends) * 100000000 + length * 10000 + displacement;
    };

    const buildSimpleManhattanCandidates = (start, end) => {
      if (!start || !end) {
        return [];
      }
      const source = { x: start.x, y: start.y };
      const target = { x: end.x, y: end.y };
      if (source.x === target.x || source.y === target.y) {
        return [[source, target]];
      }
      return [
        [source, { x: source.x, y: target.y }, target],
        [source, { x: target.x, y: source.y }, target]
      ];
    };

    const isOrthogonalPath = (points) => {
      if (!Array.isArray(points) || points.length < 2) {
        return false;
      }
      for (let index = 0; index < points.length - 1; index += 1) {
        if (!getSegmentOrientation(points[index], points[index + 1])) {
          return false;
        }
      }
      return true;
    };

    const chooseOptimizedSubpath = (subpath, obstacles, context) => {
      if (!Array.isArray(subpath) || subpath.length < 2) {
        return Array.isArray(subpath) ? subpath.map((point) => ({ x: point.x, y: point.y })) : [];
      }
      const start = subpath[0];
      const end = subpath[subpath.length - 1];
      const original = simplifyWirePoints(
        subpath.map((point) => ({ x: point.x, y: point.y })),
        null
      );
      const contextOriginal = buildContextPath(original, context);
      const endpointAxes = {
        start: context?.startAxis ?? null,
        end: context?.endAxis ?? null
      };
      let best = original;
      let bestScore = getPathScore(
        contextOriginal,
        contextOriginal,
        countEndpointAxisMismatches(original, endpointAxes)
      );
      let bestSignature = getPathSignature(best);
      const candidates = buildSimpleManhattanCandidates(start, end);
      candidates.forEach((candidate) => {
        const normalized = simplifyWirePoints(
          candidate.map((point) => ({ x: point.x, y: point.y })),
          null
        );
        if (!isOrthogonalPath(normalized)) {
          return;
        }
        if (obstacles?.length && pathIntersectsObstacles(normalized, obstacles)) {
          return;
        }
        const contextCandidate = buildContextPath(normalized, context);
        const score = getPathScore(
          contextCandidate,
          contextOriginal,
          countEndpointAxisMismatches(normalized, endpointAxes)
        );
        const signature = getPathSignature(normalized);
        if (score < bestScore || (score === bestScore && signature < bestSignature)) {
          best = normalized;
          bestScore = score;
          bestSignature = signature;
        }
      });
      return best.map((point) => ({ x: point.x, y: point.y }));
    };

    const optimizeWirePointsForSimplify = (points, anchoredKeys, obstacles, endpointAxisByPoint) => {
      const base = simplifyWirePoints(
        (points ?? []).map((point) => ({ x: point.x, y: point.y })),
        anchoredKeys
      );
      if (base.length < 3) {
        return base;
      }
      const anchorIndices = [0];
      for (let index = 1; index < base.length - 1; index += 1) {
        if (anchoredKeys?.has(pointKey(base[index]))) {
          anchorIndices.push(index);
        }
      }
      anchorIndices.push(base.length - 1);
      const optimized = [];
      for (let segment = 0; segment < anchorIndices.length - 1; segment += 1) {
        const startIndex = anchorIndices[segment];
        const endIndex = anchorIndices[segment + 1];
        if (endIndex <= startIndex) {
          continue;
        }
        const subpath = base.slice(startIndex, endIndex + 1);
        const startKey = pointKey(base[startIndex]);
        const endKey = pointKey(base[endIndex]);
        const context = {
          prevPoint: startIndex > 0 ? base[startIndex - 1] : null,
          nextPoint: endIndex < base.length - 1 ? base[endIndex + 1] : null,
          startAxis: endpointAxisByPoint?.get(startKey) ?? null,
          endAxis: endpointAxisByPoint?.get(endKey) ?? null
        };
        const improved = chooseOptimizedSubpath(subpath, obstacles, context);
        if (segment === 0) {
          optimized.push(...improved);
        } else {
          optimized.push(...improved.slice(1));
        }
      }
      return simplifyWirePoints(optimized, anchoredKeys);
    };

    const adjustWireSegment = (points, segmentIndex, orientation, target) => {
      const start = points[segmentIndex];
      const end = points[segmentIndex + 1];
      if (!start || !end) {
        return points.map((point) => ({ x: point.x, y: point.y }));
      }
      const anchoredIndices = getAnchoredPointKeySet();
      const startAnchored = anchoredIndices.has(pointKey(start));
      const endAnchored = anchoredIndices.has(pointKey(end));
      let insertAfterStart = null;
      let insertBeforeEnd = null;
      const startPoint = { x: start.x, y: start.y };
      const endPoint = { x: end.x, y: end.y };
      if (orientation === "h") {
        if (!startAnchored) {
          startPoint.y = target;
        }
        if (!endAnchored) {
          endPoint.y = target;
        }
        if (startAnchored && endAnchored) {
          insertAfterStart = { x: start.x, y: target };
          insertBeforeEnd = { x: end.x, y: target };
        } else if (startAnchored) {
          insertAfterStart = { x: start.x, y: target };
        } else if (endAnchored) {
          insertBeforeEnd = { x: end.x, y: target };
        }
      } else {
        if (!startAnchored) {
          startPoint.x = target;
        }
        if (!endAnchored) {
          endPoint.x = target;
        }
        if (startAnchored && endAnchored) {
          insertAfterStart = { x: target, y: start.y };
          insertBeforeEnd = { x: target, y: end.y };
        } else if (startAnchored) {
          insertAfterStart = { x: target, y: start.y };
        } else if (endAnchored) {
          insertBeforeEnd = { x: target, y: end.y };
        }
      }

      const nextPoints = [];
      points.forEach((point, index) => {
        if (index === segmentIndex) {
          nextPoints.push(startPoint);
          if (insertAfterStart) {
            nextPoints.push({ ...insertAfterStart });
          }
          if (insertBeforeEnd) {
            nextPoints.push({ ...insertBeforeEnd });
          }
          return;
        }
        if (index === segmentIndex + 1) {
          nextPoints.push(endPoint);
          return;
        }
        nextPoints.push({ x: point.x, y: point.y });
      });

      return simplifyWirePoints(nextPoints, anchoredIndices);
    };

    const snapCoord = (value) => {
      if (state.grid.snap && state.grid.size > 0) {
        return Math.round(value / state.grid.size) * state.grid.size;
      }
      return value;
    };

    const maybeSnapCoord = (value, snapEnabled) => (snapEnabled ? snapCoord(value) : value);

    const cloneTransform = (transform) => ({
      a: transform?.a ?? 1,
      b: transform?.b ?? 0,
      c: transform?.c ?? 0,
      d: transform?.d ?? 1
    });

    const isIdentityTransform = (transform) =>
      !transform || (transform.a === 1 && transform.b === 0 && transform.c === 0 && transform.d === 1);

    const multiplyTransform = (left, right) => ({
      a: left.a * right.a + left.b * right.c,
      b: left.a * right.b + left.b * right.d,
      c: left.c * right.a + left.d * right.c,
      d: left.c * right.b + left.d * right.d
    });

    const normalizeRotation = (value) => {
      const normalized = ((value % 360) + 360) % 360;
      return normalized;
    };

    const getTransformRotation = (transform) => {
      if (!transform) {
        return 0;
      }
      const angle = Math.atan2(transform.c, transform.a) * (180 / Math.PI);
      if (!Number.isFinite(angle)) {
        return 0;
      }
      const snapped = Math.round(angle / 90) * 90;
      return normalizeRotation(snapped);
    };

    const applyTransformToPins = (pins, transform, snapToGrid) => {
      if (!Array.isArray(pins) || !pins.length || isIdentityTransform(transform)) {
        return;
      }
      const center = pins.reduce(
        (acc, pin) => ({ x: acc.x + pin.x, y: acc.y + pin.y }),
        { x: 0, y: 0 }
      );
      const cx = center.x / pins.length;
      const cy = center.y / pins.length;
      pins.forEach((pin) => {
        const dx = pin.x - cx;
        const dy = pin.y - cy;
        const x = transform.a * dx + transform.b * dy;
        const y = transform.c * dx + transform.d * dy;
        pin.x = cx + x;
        pin.y = cy + y;
        if (snapToGrid) {
          pin.x = snapCoord(pin.x);
          pin.y = snapCoord(pin.y);
        }
      });
    };

    const applyTransformToComponent = (component, transform, snapToGrid) => {
      if (!component || !Array.isArray(component.pins) || !component.pins.length) {
        return component;
      }
      if (component.pins.length === 1 && !isIdentityTransform(transform)) {
        component.rotation = resolveSinglePinPlacementRotation(
          component.type,
          component.rotation,
          transform
        );
      }
      applyTransformToPins(component.pins, transform, snapToGrid);
      return component;
    };

    const alignPointToTarget = (points, pointIndex, targetIndex, snapEnabled) => {
      const point = points[pointIndex];
      const target = points[targetIndex];
      if (!point || !target) {
        return;
      }
      const snapValue = (value) => maybeSnapCoord(value, snapEnabled);
      const otherIndex = pointIndex - 1 === targetIndex
        ? pointIndex + 1
        : pointIndex - 1;
      const other = points[otherIndex];
      if (other) {
        if (other.x === point.x) {
          point.y = snapValue(target.y);
          return;
        }
        if (other.y === point.y) {
          point.x = snapValue(target.x);
          return;
        }
      }
      const dx = Math.abs(point.x - target.x);
      const dy = Math.abs(point.y - target.y);
      if (dx <= dy) {
        point.x = snapValue(target.x);
      } else {
        point.y = snapValue(target.y);
      }
    };

    const insertCornerBetween = (points, index, corner, snapEnabled) => {
      points.splice(index + 1, 0, {
        x: maybeSnapCoord(corner.x, snapEnabled),
        y: maybeSnapCoord(corner.y, snapEnabled)
      });
    };

    const chooseCorner = (start, end, prev, next) => {
      const optionA = { x: start.x, y: end.y };
      const optionB = { x: end.x, y: start.y };
      if (prev) {
        if (prev.x === start.x) {
          return optionA;
        }
        if (prev.y === start.y) {
          return optionB;
        }
      }
      if (next) {
        if (next.x === end.x) {
          return optionA;
        }
        if (next.y === end.y) {
          return optionB;
        }
      }
      return optionA;
    };

    const ensureWireOrthogonal = (wire, anchoredKeys, options) => {
      if (!wire || !Array.isArray(wire.points)) {
        return;
      }
      const points = wire.points;
      if (points.length < 2) {
        return;
      }
      const snapEnabled = options?.snap !== false;
      const maxIterations = points.length * 3;
      let iterations = 0;
      let index = 0;
      while (index < points.length - 1 && iterations < maxIterations) {
        iterations += 1;
        const start = points[index];
        const end = points[index + 1];
        if (!start || !end) {
          index += 1;
          continue;
        }
        if (start.x === end.x || start.y === end.y) {
          index += 1;
          continue;
        }
        const startAnchored = anchoredKeys?.has(pointKey(start));
        const endAnchored = anchoredKeys?.has(pointKey(end));
        if (startAnchored && endAnchored) {
          const corner = chooseCorner(start, end, points[index - 1], points[index + 2]);
          insertCornerBetween(points, index, corner, snapEnabled);
          continue;
        }
        if (!startAnchored && endAnchored) {
          alignPointToTarget(points, index, index + 1, snapEnabled);
          continue;
        }
        if (startAnchored && !endAnchored) {
          alignPointToTarget(points, index + 1, index, snapEnabled);
          continue;
        }
        alignPointToTarget(points, index + 1, index, snapEnabled);
      }
    };

    const getWireClearance = () => (state.grid.size > 0 ? state.grid.size : 20);

    const getWireJumpRadius = () => {
      const base = state.grid.size > 0 ? state.grid.size : 20;
      return Math.max(4, Math.min(10, Math.round(base * 0.3)));
    };

    const getWireObstacles = (excludeIds) => {
      const padding = Math.max(10, Math.round(getWireClearance() * 0.5));
      const obstacles = [];
      (state.model?.components ?? []).forEach((component) => {
        if (excludeIds && excludeIds.has(String(component?.id ?? ""))) {
          return;
        }
        if (isProbeComponentType(component?.type)) {
          return;
        }
        const bounds = getComponentBounds(component, padding, state.probeLabels);
        if (bounds) {
          obstacles.push(bounds);
        }
      });
      return obstacles;
    };

    const isPointInsideBounds = (point, bounds) =>
      point.x >= bounds.minX
      && point.x <= bounds.maxX
      && point.y >= bounds.minY
      && point.y <= bounds.maxY;

    const segmentIntersectsBounds = (start, end, bounds) => {
      if (!start || !end || !bounds) {
        return false;
      }
      const minTravel = Math.max(4, Math.round(getWireClearance() * 0.25));
      const startInside = isPointInsideBounds(start, bounds);
      const endInside = isPointInsideBounds(end, bounds);
      if (startInside && endInside) {
        return true;
      }
      if (start.y === end.y) {
        if (start.y < bounds.minY || start.y > bounds.maxY) {
          return false;
        }
        const minX = Math.min(start.x, end.x);
        const maxX = Math.max(start.x, end.x);
        const overlap = Math.min(maxX, bounds.maxX) - Math.max(minX, bounds.minX);
        if (overlap <= 0) {
          return false;
        }
        if (startInside || endInside) {
          return overlap > minTravel;
        }
        return true;
      }
      if (start.x === end.x) {
        if (start.x < bounds.minX || start.x > bounds.maxX) {
          return false;
        }
        const minY = Math.min(start.y, end.y);
        const maxY = Math.max(start.y, end.y);
        const overlap = Math.min(maxY, bounds.maxY) - Math.max(minY, bounds.minY);
        if (overlap <= 0) {
          return false;
        }
        if (startInside || endInside) {
          return overlap > minTravel;
        }
        return true;
      }
      return false;
    };

    const pathIntersectsObstacles = (points, obstacles) => {
      if (!Array.isArray(points) || points.length < 2 || !obstacles.length) {
        return false;
      }
      for (let index = 0; index < points.length - 1; index += 1) {
        const start = points[index];
        const end = points[index + 1];
        for (let obsIndex = 0; obsIndex < obstacles.length; obsIndex += 1) {
          if (segmentIntersectsBounds(start, end, obstacles[obsIndex])) {
            return true;
          }
        }
      }
      return false;
    };

    const buildDetourPoints = (start, end, bounds, obstacles, snapEnabled) => {
      const clearance = getWireClearance();
      const snapValue = (value) => maybeSnapCoord(value, snapEnabled);
      if (start.y === end.y) {
        const candidates = [
          snapValue(bounds.minY - clearance),
          snapValue(bounds.maxY + clearance)
        ].filter((value) => value !== start.y);
        candidates.sort((a, b) => Math.abs(a - start.y) - Math.abs(b - start.y));
        for (let index = 0; index < candidates.length; index += 1) {
          const targetY = candidates[index];
          const detour = [
            { x: start.x, y: start.y },
            { x: start.x, y: targetY },
            { x: end.x, y: targetY },
            { x: end.x, y: end.y }
          ];
          if (!pathIntersectsObstacles(detour, obstacles)) {
            return detour;
          }
        }
      } else if (start.x === end.x) {
        const candidates = [
          snapValue(bounds.minX - clearance),
          snapValue(bounds.maxX + clearance)
        ].filter((value) => value !== start.x);
        candidates.sort((a, b) => Math.abs(a - start.x) - Math.abs(b - start.x));
        for (let index = 0; index < candidates.length; index += 1) {
          const targetX = candidates[index];
          const detour = [
            { x: start.x, y: start.y },
            { x: targetX, y: start.y },
            { x: targetX, y: end.y },
            { x: end.x, y: end.y }
          ];
          if (!pathIntersectsObstacles(detour, obstacles)) {
            return detour;
          }
        }
      }
      return null;
    };

    const rerouteWirePoints = (points, obstacles, snapEnabled) => {
      if (!Array.isArray(points) || points.length < 2 || !obstacles.length) {
        return points.map((point) => ({ x: point.x, y: point.y }));
      }
      const routed = points.map((point) => ({ x: point.x, y: point.y }));
      const maxIterations = Math.max(6, routed.length * 2);
      for (let iteration = 0; iteration < maxIterations; iteration += 1) {
        let adjusted = false;
        for (let index = 0; index < routed.length - 1; index += 1) {
          const start = routed[index];
          const end = routed[index + 1];
          const hit = obstacles.find((bounds) => segmentIntersectsBounds(start, end, bounds));
          if (!hit) {
            continue;
          }
          const detour = buildDetourPoints(start, end, hit, obstacles, snapEnabled);
          if (detour) {
            routed.splice(index, 2, ...detour.map((point) => ({ x: point.x, y: point.y })));
            adjusted = true;
            break;
          }
        }
        if (!adjusted) {
          break;
        }
      }
      return routed;
    };

    const normalizeWirePoints = (wire, options) => {
      if (!wire || !Array.isArray(wire.points)) {
        return;
      }
      const snapEnabled = options?.snap !== false;
      const snapMode = String(options?.snapMode ?? "preserve").toLowerCase() === "force"
        ? "force"
        : "preserve";
      const anchoredKeys = options?.anchoredKeys ?? getAnchoredPointKeySet();
      let obstacles = options?.obstacles;
      if (!obstacles) {
        const pinComponentMap = buildPinComponentMap();
        const fullObstacles = getWireObstacles();
        obstacles = getWireObstaclesForWire(wire, pinComponentMap, fullObstacles);
      }
      ensureWireOrthogonal(wire, anchoredKeys, { snap: snapEnabled });
      if (obstacles.length) {
        const routed = rerouteWirePoints(wire.points, obstacles, snapEnabled);
        wire.points.length = 0;
        routed.forEach((point) => wire.points.push(point));
      }
      const simplified = simplifyWirePoints(wire.points, anchoredKeys);
      wire.points.length = 0;
      simplified.forEach((point) => wire.points.push(point));
      if (snapEnabled && snapMode === "force" && state.grid.snap && state.grid.size > 0) {
        const snapped = wire.points.map((point) => ({
          x: snapCoord(point.x),
          y: snapCoord(point.y)
        }));
        wire.points.length = 0;
        snapped.forEach((point) => wire.points.push(point));
        const resimplified = simplifyWirePoints(wire.points, anchoredKeys);
        wire.points.length = 0;
        resimplified.forEach((point) => wire.points.push(point));
      }
    };

    const mergeWirePair = (primary, primaryEnd, secondary, secondaryEnd) => {
      if (!primary || !secondary || primary === secondary) {
        return null;
      }
      const primaryPoints = (primary.points ?? []).map((point) => ({ x: point.x, y: point.y }));
      const secondaryPoints = (secondary.points ?? []).map((point) => ({ x: point.x, y: point.y }));
      if (!primaryPoints.length || !secondaryPoints.length) {
        return null;
      }
      if (primaryEnd === "start") {
        primaryPoints.reverse();
      }
      if (secondaryEnd === "end") {
        secondaryPoints.reverse();
      }
      const primaryEndPoint = primaryPoints[primaryPoints.length - 1];
      const secondaryStartPoint = secondaryPoints[0];
      if (!primaryEndPoint || !secondaryStartPoint) {
        return null;
      }
      if (primaryEndPoint.x !== secondaryStartPoint.x || primaryEndPoint.y !== secondaryStartPoint.y) {
        return null;
      }
      const mergedPoints = primaryPoints.concat(secondaryPoints.slice(1));
      return mergedPoints;
    };

    const mergeTwoWayJunctions = () => {
      const wires = Array.isArray(state.model?.wires) ? state.model.wires : [];
      if (wires.length < 2) {
        return false;
      }
      const degrees = getWirePointDegrees();
      const endpoints = new Map();
      wires.forEach((wire) => {
        const points = Array.isArray(wire.points) ? wire.points : [];
        if (points.length < 2) {
          return;
        }
        const start = points[0];
        const end = points[points.length - 1];
        const startKey = pointKey(start);
        const endKey = pointKey(end);
        if (!endpoints.has(startKey)) {
          endpoints.set(startKey, []);
        }
        endpoints.get(startKey).push({ wire, end: "start" });
        if (!endpoints.has(endKey)) {
          endpoints.set(endKey, []);
        }
        endpoints.get(endKey).push({ wire, end: "end" });
      });
      for (const [key, entries] of endpoints.entries()) {
        if (entries.length !== 2) {
          continue;
        }
        const degree = degrees.get(key) ?? 0;
        if (degree !== 2) {
          continue;
        }
        const [first, second] = entries;
        if (first.wire === second.wire) {
          continue;
        }
        const mergedPoints = mergeWirePair(first.wire, first.end, second.wire, second.end);
        if (!mergedPoints) {
          continue;
        }
        first.wire.points.length = 0;
        mergedPoints.forEach((point) => first.wire.points.push({ x: point.x, y: point.y }));
        const remaining = wires.filter((wire) => wire !== second.wire);
        state.model.wires.length = 0;
        remaining.forEach((wire) => state.model.wires.push(wire));
        if (state.wireSelection === second.wire.id) {
          state.wireSelection = first.wire.id;
        }
        normalizeWirePoints(first.wire, { snap: true });
        return true;
      }
      return false;
    };

    const mergeWires = () => {
      let merged = false;
      let guard = 0;
      do {
        merged = mergeTwoWayJunctions();
        guard += 1;
      } while (merged && guard < 20);
    };

    const segmentKeyForPoints = (start, end) => {
      if (!start || !end) {
        return "";
      }
      if (start.x === end.x) {
        const minY = Math.min(start.y, end.y);
        const maxY = Math.max(start.y, end.y);
        return `v:${start.x}:${minY}:${maxY}`;
      }
      const minX = Math.min(start.x, end.x);
      const maxX = Math.max(start.x, end.x);
      return `h:${start.y}:${minX}:${maxX}`;
    };

    const splitWiresAtOverlaps = () => {
      const wires = Array.isArray(state.model?.wires) ? state.model.wires : [];
      if (wires.length < 2) {
        return;
      }
      const segments = [];
      const endpoints = [];
      wires.forEach((wire) => {
        const points = Array.isArray(wire.points) ? wire.points : [];
        if (points.length >= 1) {
          endpoints.push({
            wireId: wire.id,
            x: points[0].x,
            y: points[0].y
          });
        }
        if (points.length >= 2) {
          const last = points[points.length - 1];
          endpoints.push({
            wireId: wire.id,
            x: last.x,
            y: last.y
          });
        }
        for (let i = 0; i < points.length - 1; i += 1) {
          const start = points[i];
          const end = points[i + 1];
          if (!start || !end) {
            continue;
          }
          if (start.x === end.x && start.y === end.y) {
            continue;
          }
          if (start.x === end.x) {
            segments.push({
              wire,
              index: i,
              orientation: "v",
              coord: start.x,
              min: Math.min(start.y, end.y),
              max: Math.max(start.y, end.y)
            });
          } else if (start.y === end.y) {
            segments.push({
              wire,
              index: i,
              orientation: "h",
              coord: start.y,
              min: Math.min(start.x, end.x),
              max: Math.max(start.x, end.x)
            });
          }
        }
      });
      if (!segments.length) {
        return;
      }
      const splitMap = new Map();
      const ensureSplitSet = (segment) => {
        const key = `${segment.wire.id}:${segment.index}`;
        let set = splitMap.get(key);
        if (!set) {
          set = new Set([segment.min, segment.max]);
          splitMap.set(key, set);
        }
        return set;
      };
      segments.forEach((segment) => {
        ensureSplitSet(segment);
      });
      if (endpoints.length) {
        segments.forEach((segment) => {
          endpoints.forEach((endpoint) => {
            if (endpoint.wireId === segment.wire.id) {
              return;
            }
            if (segment.orientation === "h") {
              if (endpoint.y !== segment.coord) {
                return;
              }
              if (endpoint.x < segment.min || endpoint.x > segment.max) {
                return;
              }
              ensureSplitSet(segment).add(endpoint.x);
              return;
            }
            if (endpoint.x !== segment.coord) {
              return;
            }
            if (endpoint.y < segment.min || endpoint.y > segment.max) {
              return;
            }
            ensureSplitSet(segment).add(endpoint.y);
          });
        });
      }
      for (let i = 0; i < segments.length; i += 1) {
        const a = segments[i];
        for (let j = i + 1; j < segments.length; j += 1) {
          const b = segments[j];
          if (a.orientation !== b.orientation || a.coord !== b.coord) {
            continue;
          }
          const overlapStart = Math.max(a.min, b.min);
          const overlapEnd = Math.min(a.max, b.max);
          if (overlapEnd <= overlapStart) {
            continue;
          }
          ensureSplitSet(a).add(overlapStart);
          ensureSplitSet(a).add(overlapEnd);
          ensureSplitSet(b).add(overlapStart);
          ensureSplitSet(b).add(overlapEnd);
        }
      }
      const newWires = [];
      const seenSegments = new Set();
      const selectionMap = new Map();
      wires.forEach((wire) => {
        const points = Array.isArray(wire.points) ? wire.points : [];
        if (points.length < 2) {
          return;
        }
        let currentPoints = [];
        let usedOriginalId = false;
        const pushWire = () => {
          if (currentPoints.length < 2) {
            currentPoints = [];
            return;
          }
          const id = usedOriginalId ? nextWireId() : wire.id;
          usedOriginalId = true;
          const created = {
            id,
            points: currentPoints.map((point) => ({ x: point.x, y: point.y }))
          };
          newWires.push(created);
          if (!selectionMap.has(wire.id)) {
            selectionMap.set(wire.id, []);
          }
          selectionMap.get(wire.id).push(created.id);
          currentPoints = [];
        };
        for (let i = 0; i < points.length - 1; i += 1) {
          const start = points[i];
          const end = points[i + 1];
          if (!start || !end) {
            continue;
          }
          if (start.x !== end.x && start.y !== end.y) {
            continue;
          }
          const segmentKey = `${wire.id}:${i}`;
          const splitSet = splitMap.get(segmentKey) ?? new Set([start.x === end.x ? start.y : start.x, start.x === end.x ? end.y : end.x]);
          const coords = Array.from(splitSet).sort((a, b) => a - b);
          const isVertical = start.x === end.x;
          const forward = isVertical ? start.y <= end.y : start.x <= end.x;
          if (!forward) {
            coords.reverse();
          }
          for (let idx = 0; idx < coords.length - 1; idx += 1) {
            const a = coords[idx];
            const b = coords[idx + 1];
            if (a === b) {
              continue;
            }
            const segStart = isVertical
              ? { x: start.x, y: a }
              : { x: a, y: start.y };
            const segEnd = isVertical
              ? { x: start.x, y: b }
              : { x: b, y: start.y };
            const key = segmentKeyForPoints(segStart, segEnd);
            if (!key) {
              continue;
            }
            if (seenSegments.has(key)) {
              if (currentPoints.length >= 2) {
                pushWire();
              }
              continue;
            }
            seenSegments.add(key);
            if (!currentPoints.length) {
              currentPoints.push(segStart);
            } else {
              const last = currentPoints[currentPoints.length - 1];
              if (last.x !== segStart.x || last.y !== segStart.y) {
                currentPoints.push(segStart);
              }
            }
            currentPoints.push(segEnd);
          }
        }
        pushWire();
      });
      if (!newWires.length) {
        return;
      }
      state.model.wires.length = 0;
      newWires.forEach((wire) => {
        state.model.wires.push(wire);
      });
      const anchoredKeys = getAnchoredPointKeySet();
      state.model.wires.forEach((wire) => {
        normalizeWirePoints(wire, { snap: true, anchoredKeys });
        syncWireCount(wire);
      });
      if (state.wireSelection && !state.model.wires.some((wire) => wire.id === state.wireSelection)) {
        const mapped = selectionMap.get(state.wireSelection);
        state.wireSelection = mapped?.[0] ?? null;
      }
      if (state.wireSelections.length) {
        state.wireSelections = state.wireSelections
          .flatMap((id) => selectionMap.get(id) ?? [id])
          .filter((id) => state.model.wires.some((wire) => wire.id === id));
        if (state.wireSelections.length !== 1) {
          state.wireSelection = state.wireSelections.length === 1 ? state.wireSelections[0] : null;
        }
      }
    };

    const splitWiresAtJunctions = () => {
      const wires = Array.isArray(state.model?.wires) ? state.model.wires : [];
      if (!wires.length) {
        return;
      }
      const junctions = getJunctionKeySet();
      if (!junctions.size) {
        return;
      }
      const newWires = [];
      const selectionMap = new Map();
      wires.forEach((wire) => {
        const points = Array.isArray(wire.points) ? wire.points : [];
        if (points.length < 2) {
          return;
        }
        let startIndex = 0;
        let usedOriginalId = false;
        const flush = (endIndex) => {
          if (endIndex <= startIndex) {
            return;
          }
          const segmentPoints = points.slice(startIndex, endIndex + 1);
          if (segmentPoints.length < 2) {
            return;
          }
          const id = usedOriginalId ? nextWireId() : wire.id;
          usedOriginalId = true;
          const created = {
            id,
            points: segmentPoints.map((point) => ({ x: point.x, y: point.y }))
          };
          newWires.push(created);
          if (!selectionMap.has(wire.id)) {
            selectionMap.set(wire.id, []);
          }
          selectionMap.get(wire.id).push(created.id);
        };
        for (let i = 1; i < points.length - 1; i += 1) {
          if (junctions.has(pointKey(points[i]))) {
            flush(i);
            startIndex = i;
          }
        }
        flush(points.length - 1);
      });
      if (!newWires.length) {
        return;
      }
      state.model.wires.length = 0;
      newWires.forEach((wire) => {
        state.model.wires.push(wire);
      });
      const anchoredKeys = getAnchoredPointKeySet();
      state.model.wires.forEach((wire) => {
        normalizeWirePoints(wire, { snap: true, anchoredKeys });
        syncWireCount(wire);
      });
      if (state.wireSelection && !state.model.wires.some((wire) => wire.id === state.wireSelection)) {
        const mapped = selectionMap.get(state.wireSelection);
        state.wireSelection = mapped?.[0] ?? null;
      }
      if (state.wireSelections.length) {
        state.wireSelections = state.wireSelections
          .flatMap((id) => selectionMap.get(id) ?? [id])
          .filter((id) => state.model.wires.some((wire) => wire.id === id));
        if (state.wireSelections.length !== 1) {
          state.wireSelection = state.wireSelections.length === 1 ? state.wireSelections[0] : null;
        }
      }
    };

    const removeComponentShorts = (componentIds) => {
      const wires = Array.isArray(state.model?.wires) ? state.model.wires : [];
      if (!wires.length) {
        return false;
      }
      const shorts = [];
      const idSet = Array.isArray(componentIds) && componentIds.length
        ? new Set(componentIds.map((id) => String(id)))
        : null;
      (state.model?.components ?? []).forEach((component) => {
        if (idSet && !idSet.has(String(component?.id ?? ""))) {
          return;
        }
        if (isProbeComponentType(component?.type)) {
          return;
        }
        const pins = Array.isArray(component?.pins) ? component.pins : [];
        if (pins.length !== 2) {
          return;
        }
        const a = pins[0];
        const b = pins[1];
        if (!a || !b) {
          return;
        }
        if (a.x === b.x && Number.isFinite(a.x)) {
          shorts.push({
            orientation: "v",
            coord: a.x,
            min: Math.min(a.y, b.y),
            max: Math.max(a.y, b.y),
            a: { x: a.x, y: a.y },
            b: { x: b.x, y: b.y }
          });
        } else if (a.y === b.y && Number.isFinite(a.y)) {
          shorts.push({
            orientation: "h",
            coord: a.y,
            min: Math.min(a.x, b.x),
            max: Math.max(a.x, b.x),
            a: { x: a.x, y: a.y },
            b: { x: b.x, y: b.y }
          });
        }
      });
      if (!shorts.length) {
        return false;
      }

      const removeSpanBetweenPins = (points, short) => {
        if (!Array.isArray(points) || points.length < 2 || !short?.a || !short?.b) {
          return null;
        }
        const aIndices = [];
        const bIndices = [];
        points.forEach((point, index) => {
          if (point.x === short.a.x && point.y === short.a.y) {
            aIndices.push(index);
          }
          if (point.x === short.b.x && point.y === short.b.y) {
            bIndices.push(index);
          }
        });
        if (!aIndices.length || !bIndices.length) {
          return null;
        }
        const withinRange = (value) => value >= short.min - 0.01 && value <= short.max + 0.01;
        let best = null;
        aIndices.forEach((aIndex) => {
          bIndices.forEach((bIndex) => {
            if (aIndex === bIndex) {
              return;
            }
            const step = aIndex < bIndex ? 1 : -1;
            let valid = true;
            for (let index = aIndex; index !== bIndex; index += step) {
              const start = points[index];
              const end = points[index + step];
              if (!start || !end) {
                valid = false;
                break;
              }
              if (short.orientation === "h") {
                if (start.y !== short.coord || end.y !== short.coord || start.x === end.x) {
                  valid = false;
                  break;
                }
                if (!withinRange(start.x) || !withinRange(end.x)) {
                  valid = false;
                  break;
                }
              } else {
                if (start.x !== short.coord || end.x !== short.coord || start.y === end.y) {
                  valid = false;
                  break;
                }
                if (!withinRange(start.y) || !withinRange(end.y)) {
                  valid = false;
                  break;
                }
              }
            }
            if (!valid) {
              return;
            }
            const diff = Math.abs(aIndex - bIndex);
            if (!best || diff < best.diff) {
              best = { startIndex: Math.min(aIndex, bIndex), endIndex: Math.max(aIndex, bIndex), diff };
            }
          });
        });
        if (!best) {
          return null;
        }
        const before = points.slice(0, best.startIndex + 1).map((point) => ({ x: point.x, y: point.y }));
        const after = points.slice(best.endIndex).map((point) => ({ x: point.x, y: point.y }));
        const segments = [];
        if (before.length >= 2) {
          segments.push(before);
        }
        if (after.length >= 2) {
          segments.push(after);
        }
        return segments;
      };

      let changed = false;
      const newWires = [];
      const selectionMap = new Map();
      wires.forEach((wire) => {
        let segments = [{ id: wire.id, points: (wire.points ?? []).map((point) => ({ x: point.x, y: point.y })) }];
        shorts.forEach((short) => {
          const nextSegments = [];
          segments.forEach((segment) => {
            const split = removeSpanBetweenPins(segment.points, short);
            if (!split) {
              nextSegments.push(segment);
              return;
            }
            changed = true;
            let usedOriginal = false;
            split.forEach((points) => {
              if (points.length < 2) {
                return;
              }
              const id = usedOriginal ? nextWireId() : segment.id;
              usedOriginal = true;
              nextSegments.push({ id, points });
              if (!selectionMap.has(segment.id)) {
                selectionMap.set(segment.id, []);
              }
              selectionMap.get(segment.id).push(id);
            });
          });
          segments = nextSegments;
        });
        segments.forEach((segment) => {
          if (segment.points.length >= 2) {
            newWires.push(segment);
          }
        });
      });

      if (!changed) {
        return false;
      }
      state.model.wires.length = 0;
      newWires.forEach((wire) => {
        normalizeWirePoints(wire, { snap: true });
        syncWireCount(wire);
        state.model.wires.push(wire);
      });
      if (state.wireSelection && selectionMap.has(state.wireSelection)) {
        state.wireSelection = selectionMap.get(state.wireSelection)?.[0] ?? null;
      }
      if (state.wireSelections.length) {
        state.wireSelections = state.wireSelections
          .flatMap((id) => selectionMap.get(id) ?? [id])
          .filter((id) => state.model.wires.some((wire) => wire.id === id));
        if (state.wireSelections.length !== 1) {
          state.wireSelection = state.wireSelections.length === 1 ? state.wireSelections[0] : null;
        }
      }
      return true;
    };

    const buildPinComponentMap = () => {
      const map = new Map();
      (state.model?.components ?? []).forEach((component) => {
        if (!isElectricalComponentType(component?.type)) {
          return;
        }
        const id = String(component?.id ?? "");
        if (!id) {
          return;
        }
        (component.pins ?? []).forEach((pin) => {
          const key = pointKey(pin);
          let set = map.get(key);
          if (!set) {
            set = new Set();
            map.set(key, set);
          }
          set.add(id);
        });
      });
      return map;
    };

    const buildPinExitAxisMap = () => {
      const axisSets = new Map();
      (state.model?.components ?? []).forEach((component) => {
        if (!isElectricalComponentType(component?.type)) {
          return;
        }
        const axisInfo = getAlignedPinAxisInfo(component);
        if (!axisInfo?.axis) {
          return;
        }
        const axis = axisInfo.axis;
        (component.pins ?? []).forEach((pin) => {
          const key = pointKey(pin);
          let set = axisSets.get(key);
          if (!set) {
            set = new Set();
            axisSets.set(key, set);
          }
          set.add(axis);
        });
      });
      const map = new Map();
      axisSets.forEach((axes, key) => {
        if (!axes || axes.size !== 1) {
          return;
        }
        const [axis] = Array.from(axes);
        if (axis === "h" || axis === "v") {
          map.set(key, axis);
        }
      });
      return map;
    };

    const getWireConnectedComponentIds = (wire, pinComponentMap) => {
      const ids = new Set();
      const points = Array.isArray(wire?.points) ? wire.points : [];
      points.forEach((point) => {
        const connected = pinComponentMap.get(pointKey(point));
        if (!connected) {
          return;
        }
        connected.forEach((id) => ids.add(id));
      });
      return ids;
    };

    const getAlignedPinAxisInfo = (component) => {
      const pins = Array.isArray(component?.pins) ? component.pins : [];
      if (pins.length < 2) {
        return null;
      }
      const first = pins[0];
      if (!first) {
        return null;
      }
      const sameX = pins.every((pin) => Math.abs(pin.x - first.x) < 0.01);
      const sameY = pins.every((pin) => Math.abs(pin.y - first.y) < 0.01);
      if (sameY && !sameX) {
        const xs = pins.map((pin) => pin.x);
        return {
          axis: "h",
          coord: first.y,
          min: Math.min(...xs),
          max: Math.max(...xs)
        };
      }
      if (sameX && !sameY) {
        const ys = pins.map((pin) => pin.y);
        return {
          axis: "v",
          coord: first.x,
          min: Math.min(...ys),
          max: Math.max(...ys)
        };
      }
      return null;
    };

    const wireSpansAxis = (points, axisInfo) => {
      if (!Array.isArray(points) || points.length < 2 || !axisInfo) {
        return false;
      }
      for (let i = 0; i < points.length - 1; i += 1) {
        const start = points[i];
        const end = points[i + 1];
        if (!start || !end) {
          continue;
        }
        if (axisInfo.axis === "h") {
          if (Math.abs(start.y - axisInfo.coord) > 0.01 || Math.abs(end.y - axisInfo.coord) > 0.01) {
            continue;
          }
          const segMin = Math.min(start.x, end.x);
          const segMax = Math.max(start.x, end.x);
          if (segMin <= axisInfo.min + 0.01 && segMax >= axisInfo.max - 0.01) {
            return true;
          }
        } else {
          if (Math.abs(start.x - axisInfo.coord) > 0.01 || Math.abs(end.x - axisInfo.coord) > 0.01) {
            continue;
          }
          const segMin = Math.min(start.y, end.y);
          const segMax = Math.max(start.y, end.y);
          if (segMin <= axisInfo.min + 0.01 && segMax >= axisInfo.max - 0.01) {
            return true;
          }
        }
      }
      return false;
    };

    const getPassThroughObstacleBounds = (axisInfo) => {
      if (!axisInfo) {
        return null;
      }
      const clearance = getWireClearance();
      const pad = Math.max(6, Math.round(clearance * 0.4));
      const innerPad = Math.max(2, Math.round(clearance * 0.2));
      if (axisInfo.axis === "h") {
        const minX = axisInfo.min + innerPad;
        const maxX = axisInfo.max - innerPad;
        if (minX >= maxX) {
          return null;
        }
        return {
          minX,
          maxX,
          minY: axisInfo.coord - pad,
          maxY: axisInfo.coord + pad
        };
      }
      const minY = axisInfo.min + innerPad;
      const maxY = axisInfo.max - innerPad;
      if (minY >= maxY) {
        return null;
      }
      return {
        minX: axisInfo.coord - pad,
        maxX: axisInfo.coord + pad,
        minY,
        maxY
      };
    };

    const getPassThroughObstaclesForWire = (wire, connectedIds, options) => {
      if (!wire || !connectedIds || !connectedIds.size) {
        return [];
      }
      const points = Array.isArray(wire.points) ? wire.points : [];
      if (points.length < 2) {
        return [];
      }
      const excludeIds = options?.excludeComponentIds ?? null;
      const junctions = options?.junctions ?? getJunctionKeySet();
      const hasJunctionAnchor = Boolean(junctions.size && points.some((point) => junctions.has(pointKey(point))));
      let hasExternalComponent = false;
      connectedIds.forEach((id) => {
        if (excludeIds && excludeIds.has(id)) {
          return;
        }
        hasExternalComponent = true;
      });
      if (!hasJunctionAnchor && !hasExternalComponent) {
        return [];
      }
      const obstacles = [];
      connectedIds.forEach((id) => {
        if (excludeIds && excludeIds.has(id)) {
          return;
        }
        const component = getComponent(id);
        if (!component) {
          return;
        }
        const axisInfo = getAlignedPinAxisInfo(component);
        if (!axisInfo) {
          return;
        }
        if (!wireSpansAxis(points, axisInfo)) {
          return;
        }
        const bounds = getPassThroughObstacleBounds(axisInfo);
        if (bounds) {
          obstacles.push(bounds);
        }
      });
      if (hasJunctionAnchor && obstacles.length === 0) {
        connectedIds.forEach((id) => {
          const component = getComponent(id);
          if (!component) {
            return;
          }
          const axisInfo = getAlignedPinAxisInfo(component);
          if (!axisInfo || !wireSpansAxis(points, axisInfo)) {
            return;
          }
          const bounds = getPassThroughObstacleBounds(axisInfo);
          if (bounds) {
            obstacles.push(bounds);
          }
        });
      }
      return obstacles;
    };

    const getWireObstaclesForWire = (wire, pinComponentMap, fullObstacles, options) => {
      const connectedIds = getWireConnectedComponentIds(wire, pinComponentMap);
      const obstacles = connectedIds.size ? getWireObstacles(connectedIds) : fullObstacles;
      const passThrough = getPassThroughObstaclesForWire(wire, connectedIds, options);
      if (passThrough.length) {
        return obstacles.concat(passThrough);
      }
      return obstacles;
    };

    const normalizeAllWires = (options) => {
      const wires = Array.isArray(state.model?.wires) ? state.model.wires : [];
      if (!wires.length) {
        return;
      }
      const snapMode = String(options?.snapMode ?? "preserve").toLowerCase() === "force"
        ? "force"
        : "preserve";
      const pinComponentMap = buildPinComponentMap();
      const fullObstacles = getWireObstacles();
      wires.forEach((wire) => {
        const obstacles = getWireObstaclesForWire(wire, pinComponentMap, fullObstacles);
        normalizeWirePoints(wire, { snap: true, snapMode, obstacles });
      });
      splitWiresAtOverlaps();
      mergeWires();
      splitWiresAtJunctions();
    };

    const simplifyAllWires = (options) => {
      const wires = Array.isArray(state.model?.wires) ? state.model.wires : [];
      if (!wires.length) {
        return false;
      }
      const beforeStableSignature = buildSimplifyStableSignature(state.model);
      const optimize = options?.optimize === true;
      const anchoredKeys = getAnchoredPointKeySet();
      const pinComponentMap = buildPinComponentMap();
      const endpointAxisByPoint = buildPinExitAxisMap();
      const fullObstacles = getWireObstacles();
      let changed = false;
      wires.forEach((wire) => {
        const points = Array.isArray(wire.points) ? wire.points : [];
        if (points.length < 2) {
          return;
        }
        const obstacles = getWireObstaclesForWire(wire, pinComponentMap, fullObstacles);
        const simplified = optimize
          ? optimizeWirePointsForSimplify(points, anchoredKeys, obstacles, endpointAxisByPoint)
          : simplifyWirePoints(points, anchoredKeys);
        if (!pointsEqual(points, simplified)) {
          changed = true;
          wire.points.length = 0;
          simplified.forEach((point) => wire.points.push({ x: point.x, y: point.y }));
        }
      });
      splitWiresAtOverlaps();
      mergeWires();
      splitWiresAtJunctions();
      const afterStableSignature = buildSimplifyStableSignature(state.model);
      return changed || afterStableSignature !== beforeStableSignature;
    };

    const getWireIdsConnectedToComponents = (componentIds) => {
      const ids = Array.isArray(componentIds) ? componentIds : [];
      if (!ids.length) {
        return new Set();
      }
      const pinKeys = new Set();
      ids.forEach((id) => {
        const component = getComponent(id);
        if (!component) {
          return;
        }
        if (!isElectricalComponentType(component?.type)) {
          return;
        }
        (component.pins ?? []).forEach((pin) => {
          pinKeys.add(pointKey(pin));
        });
      });
      if (!pinKeys.size) {
        return new Set();
      }
      const result = new Set();
      (state.model?.wires ?? []).forEach((wire) => {
        const points = Array.isArray(wire?.points) ? wire.points : [];
        if (points.some((point) => pinKeys.has(pointKey(point)))) {
          result.add(String(wire.id ?? ""));
        }
      });
      return result;
    };

    const resolveSimplifyWireIds = (scope) => {
      const mode = String(scope ?? "auto").toLowerCase();
      if (mode === "all") {
        return new Set((state.model?.wires ?? []).map((wire) => String(wire.id ?? "")));
      }
      const selectedWireIds = new Set(
        [state.wireSelection, ...(state.wireSelections ?? [])]
          .filter(Boolean)
          .map((id) => String(id))
      );
      if (selectedWireIds.size) {
        return selectedWireIds;
      }
      const fromComponents = getWireIdsConnectedToComponents(state.selectionIds);
      if (fromComponents.size) {
        return fromComponents;
      }
      if (mode === "selection") {
        return new Set();
      }
      return new Set((state.model?.wires ?? []).map((wire) => String(wire.id ?? "")));
    };

    const simplifyWireSet = (wireIds, options) => {
      if (!wireIds || !wireIds.size) {
        return false;
      }
      const idSet = new Set(Array.from(wireIds).map((id) => String(id)));
      const optimize = options?.optimize === true;
      const anchoredKeys = getAnchoredPointKeySet();
      const pinComponentMap = buildPinComponentMap();
      const endpointAxisByPoint = buildPinExitAxisMap();
      const fullObstacles = getWireObstacles();
      let changed = false;
      (state.model?.wires ?? []).forEach((wire) => {
        const wireId = String(wire?.id ?? "");
        if (!idSet.has(wireId)) {
          return;
        }
        const points = Array.isArray(wire?.points) ? wire.points : [];
        if (points.length < 2) {
          return;
        }
        const obstacles = getWireObstaclesForWire(wire, pinComponentMap, fullObstacles);
        const simplified = optimize
          ? optimizeWirePointsForSimplify(points, anchoredKeys, obstacles, endpointAxisByPoint)
          : simplifyWirePoints(points, anchoredKeys);
        if (!pointsEqual(points, simplified)) {
          changed = true;
          wire.points.length = 0;
          simplified.forEach((point) => wire.points.push({ x: point.x, y: point.y }));
        }
      });
      return changed;
    };

    const computeSimplifySnapshot = (scope) => {
      const mode = String(scope ?? "auto").toLowerCase();
      const targetWireIds = resolveSimplifyWireIds(mode);
      if (!targetWireIds.size) {
        return { ok: false, scope: mode, reason: "no-target-wires" };
      }

      const beforeSnapshot = cloneModel(state.model);
      const beforeSerialized = JSON.stringify(beforeSnapshot);
      const beforeStableSignature = buildSimplifyStableSignature(beforeSnapshot);
      const beforeTopologySignature = buildPinTopologySignature(beforeSnapshot);
      const maxSimplifyIterations = 8;
      let iteration = 0;
      let changed = false;
      do {
        changed = mode === "all"
          ? simplifyAllWires({ optimize: true })
          : simplifyWireSet(targetWireIds, { optimize: true });
        iteration += 1;
      } while (changed && iteration < maxSimplifyIterations);

      const afterSnapshot = cloneModel(state.model);
      const afterSerialized = JSON.stringify(afterSnapshot);
      const afterStableSignature = buildSimplifyStableSignature(afterSnapshot);
      replaceModelFromSnapshot(beforeSnapshot);
      if (afterSerialized === beforeSerialized || afterStableSignature === beforeStableSignature) {
        return { ok: false, scope: mode, reason: "no-change" };
      }

      const afterTopologySignature = buildPinTopologySignature(afterSnapshot);
      if (
        beforeTopologySignature !== null
        && afterTopologySignature !== null
        && beforeTopologySignature !== afterTopologySignature
      ) {
        return { ok: false, scope: mode, reason: "topology-mismatch" };
      }

      return {
        ok: true,
        scope: mode,
        reason: "ok",
        beforeSnapshot,
        afterSnapshot
      };
    };

    const simplifyWires = (scope) => {
      const result = computeSimplifySnapshot(scope);
      if (!result.ok) {
        svg._lastSimplifyWires = {
          applied: false,
          scope: result.scope,
          reason: result.reason
        };
        return false;
      }
      state.history.undo.push(cloneModel(result.beforeSnapshot));
      state.history.redo.length = 0;
      replaceModelFromSnapshot(result.afterSnapshot);
      render();
      notifySelection();
      notifyModelChange();
      svg._lastSimplifyWires = {
        applied: true,
        scope: result.scope,
        reason: "ok",
        beforeWireCount: result.beforeSnapshot.wires.length,
        afterWireCount: result.afterSnapshot.wires.length
      };
      return true;
    };

    const resolveRegridTargets = (scope) => {
      const mode = String(scope ?? "selection").toLowerCase() === "all" ? "all" : "selection";
      if (!(state.grid.size > 0)) {
        return { ok: false, scope: mode, reason: "grid-unavailable" };
      }
      const allComponentIds = (state.model?.components ?? [])
        .map((component) => String(component?.id ?? ""))
        .filter(Boolean);
      const allWireIds = (state.model?.wires ?? [])
        .map((wire) => String(wire?.id ?? ""))
        .filter(Boolean);
      if (mode === "all") {
        if (!allComponentIds.length && !allWireIds.length) {
          return { ok: false, scope: mode, reason: "no-targets" };
        }
        return {
          ok: true,
          scope: mode,
          componentIds: allComponentIds,
          wireIds: new Set(allWireIds)
        };
      }
      const componentIds = state.selectionIds.map((id) => String(id));
      const wireIds = new Set(
        [state.wireSelection, ...(state.wireSelections ?? [])]
          .filter(Boolean)
          .map((id) => String(id))
      );
      if (!componentIds.length && !wireIds.size) {
        return { ok: false, scope: mode, reason: "no-targets" };
      }
      return {
        ok: true,
        scope: mode,
        componentIds,
        wireIds
      };
    };

    const snapComponentPinsToGrid = (componentIds) => {
      const ids = Array.isArray(componentIds) ? componentIds : [];
      const moveMap = new Map();
      let changed = false;
      ids.forEach((id) => {
        const component = getComponent(id);
        if (!component) {
          return;
        }
        (component.pins ?? []).forEach((pin) => {
          if (!Number.isFinite(pin.x) || !Number.isFinite(pin.y)) {
            return;
          }
          const before = { x: pin.x, y: pin.y };
          const snapped = { x: snapCoord(pin.x), y: snapCoord(pin.y) };
          if (snapped.x === before.x && snapped.y === before.y) {
            return;
          }
          moveMap.set(pointKey(before), snapped);
          pin.x = snapped.x;
          pin.y = snapped.y;
          changed = true;
        });
      });
      return { changed, moveMap };
    };

    const applyRegridTargets = (targets) => {
      let changed = false;
      const allScope = targets.scope === "all";
      const targetWireIds = Array.from(targets.wireIds ?? []);
      const targetWireIdSet = new Set(targetWireIds.map((id) => String(id)));
      const snappedComponents = snapComponentPinsToGrid(targets.componentIds);
      if (snappedComponents.changed) {
        changed = true;
      }
      if (snappedComponents.moveMap.size) {
        const movedWires = updateWiresFromMoveMap(snappedComponents.moveMap, {
          normalize: false,
          ...(allScope ? {} : { wireIds: targetWireIdSet })
        });
        if (movedWires) {
          changed = true;
        }
      }
      const wiresChanged = allScope
        ? snapWirePoints()
        : snapWirePoints(targetWireIds);
      if (wiresChanged) {
        changed = true;
      }
      if (targets.componentIds.length) {
        const attached = attachPinsToWires(targets.componentIds, {
          normalize: false,
          ...(allScope ? {} : { wireIds: targetWireIdSet })
        });
        const shortsRemoved = allScope ? removeComponentShorts(targets.componentIds) : false;
        if (attached || shortsRemoved) {
          changed = true;
        }
      }
      if (changed) {
        if (allScope) {
          normalizeAllWires({ snapMode: "force" });
        } else {
          const pinComponentMap = buildPinComponentMap();
          const fullObstacles = getWireObstacles();
          targetWireIdSet.forEach((wireId) => {
            const wire = getWire(wireId);
            if (!wire) {
              return;
            }
            const obstacles = getWireObstaclesForWire(wire, pinComponentMap, fullObstacles);
            normalizeWirePoints(wire, { snap: true, snapMode: "force", obstacles });
          });
        }
      }
      return changed;
    };

    const computeRegridSnapshot = (scope) => {
      const targets = resolveRegridTargets(scope);
      if (!targets.ok) {
        return { ok: false, scope: targets.scope, reason: targets.reason };
      }
      const beforeSnapshot = cloneModel(state.model);
      const beforeSerialized = JSON.stringify(beforeSnapshot);
      const beforeTopologySignature = buildPinTopologySignature(beforeSnapshot);
      const changed = applyRegridTargets(targets);
      const afterSnapshot = cloneModel(state.model);
      const afterSerialized = JSON.stringify(afterSnapshot);
      replaceModelFromSnapshot(beforeSnapshot);
      if (!changed || afterSerialized === beforeSerialized) {
        return { ok: false, scope: targets.scope, reason: "no-change" };
      }
      const afterTopologySignature = buildPinTopologySignature(afterSnapshot);
      if (
        beforeTopologySignature !== null
        && afterTopologySignature !== null
        && beforeTopologySignature !== afterTopologySignature
      ) {
        return { ok: false, scope: targets.scope, reason: "topology-mismatch" };
      }
      return {
        ok: true,
        scope: targets.scope,
        reason: "ok",
        beforeSnapshot,
        afterSnapshot
      };
    };

    const regridToCurrentGrid = (scope) => {
      const result = computeRegridSnapshot(scope);
      if (!result.ok) {
        svg._lastRegrid = {
          applied: false,
          scope: result.scope,
          reason: result.reason
        };
        return false;
      }
      state.history.undo.push(cloneModel(result.beforeSnapshot));
      state.history.redo.length = 0;
      replaceModelFromSnapshot(result.afterSnapshot);
      render();
      notifySelection();
      notifyModelChange();
      svg._lastRegrid = {
        applied: true,
        scope: result.scope,
        reason: "ok",
        beforeWireCount: result.beforeSnapshot.wires.length,
        afterWireCount: result.afterSnapshot.wires.length
      };
      return true;
    };

    const normalizeAllWiresExcluding = (excludeIds, options) => {
      const wires = Array.isArray(state.model?.wires) ? state.model.wires : [];
      if (!wires.length) {
        return;
      }
      const snapMode = String(options?.snapMode ?? "preserve").toLowerCase() === "force"
        ? "force"
        : "preserve";
      const excluded = excludeIds && excludeIds.size ? excludeIds : null;
      if (!excluded) {
        normalizeAllWires({ snapMode });
        return;
      }
      const pinComponentMap = buildPinComponentMap();
      const fullObstacles = getWireObstacles();
      wires.forEach((wire) => {
        const obstacles = getWireObstaclesForWire(wire, pinComponentMap, fullObstacles, {
          excludeComponentIds: excluded
        });
        normalizeWirePoints(wire, { snap: true, snapMode, obstacles });
      });
      splitWiresAtOverlaps();
      mergeWires();
      splitWiresAtJunctions();
    };

    const moveWireSegment = (wireId, segmentIndex, delta) => {
      const wire = getWire(wireId);
      const index = Number(segmentIndex);
      if (!wire || !Number.isFinite(index)) {
        return false;
      }
      const points = Array.isArray(wire.points) ? wire.points : [];
      if (!points[index] || !points[index + 1]) {
        return false;
      }
      const start = points[index];
      const end = points[index + 1];
      const isHorizontal = start.y === end.y;
      const isVertical = start.x === end.x;
      if (!isHorizontal && !isVertical) {
        return false;
      }
      const baseCoord = isHorizontal ? start.y : start.x;
      const pointsMatch = (first, second) =>
        first.length === second.length
        && first.every((point, idx) => point.x === second[idx]?.x && point.y === second[idx]?.y);
      let target = baseCoord + delta;
      recordHistory();
      let nextPoints = adjustWireSegment(
        points.map((point) => ({ x: point.x, y: point.y })),
        index,
        isHorizontal ? "h" : "v",
        target
      );
      if (pointsMatch(points, nextPoints) && delta !== 0) {
        const bump = state.grid.size > 0 ? state.grid.size : 20;
        target = baseCoord + delta + bump;
        nextPoints = adjustWireSegment(
          points.map((point) => ({ x: point.x, y: point.y })),
          index,
          isHorizontal ? "h" : "v",
          target
        );
      }
      wire.points.length = 0;
      nextPoints.forEach((wirePoint) => wire.points.push({ x: wirePoint.x, y: wirePoint.y }));
      normalizeAllWires();
      render();
      notifyModelChange();
      return true;
    };

    const getViewBox = () => ({ ...state.view });

    const getView = () => ({ ...state.view });

    const setView = (next, options = {}) => {
      if (!next) {
        return;
      }
      const x = Number(next.x);
      const y = Number(next.y);
      const width = Number(next.width);
      const height = Number(next.height);
      if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(width) || !Number.isFinite(height)) {
        return;
      }
      if (width <= 0 || height <= 0) {
        return;
      }
      state.view.x = x;
      state.view.y = y;
      state.view.width = width;
      state.view.height = height;
      state.skipViewSyncOnce = options?.preserveAspect === false;
      render();
      notifyViewChange();
    };

    const resetView = () => {
      state.view = { ...DEFAULT_VIEW };
      render();
      notifyViewChange();
    };

    const applyViewBox = () => {
      svg.setAttribute("viewBox", `${state.view.x} ${state.view.y} ${state.view.width} ${state.view.height}`);
    };

    const syncViewToViewport = () => {
      const rect = svg.getBoundingClientRect();
      if (!rect.width || !rect.height) {
        return;
      }
      const targetRatio = rect.width / rect.height;
      const currentRatio = state.view.width / state.view.height;
      if (!Number.isFinite(targetRatio) || !Number.isFinite(currentRatio)) {
        return;
      }
      if (Math.abs(currentRatio - targetRatio) < 0.01) {
        return;
      }
      const centerX = state.view.x + state.view.width / 2;
      const centerY = state.view.y + state.view.height / 2;
      state.view.width = state.view.height * targetRatio;
      state.view.x = centerX - state.view.width / 2;
      state.view.y = centerY - state.view.height / 2;
    };

    const clientToWorld = (clientX, clientY) => {
      const ctm = typeof svg.getScreenCTM === "function" ? svg.getScreenCTM() : null;
      if (ctm) {
        if (typeof svg.createSVGPoint === "function") {
          const point = svg.createSVGPoint();
          point.x = clientX;
          point.y = clientY;
          const transformed = point.matrixTransform(ctm.inverse());
          return { x: transformed.x, y: transformed.y };
        }
        if (typeof DOMPoint === "function") {
          const transformed = new DOMPoint(clientX, clientY).matrixTransform(ctm.inverse());
          return { x: transformed.x, y: transformed.y };
        }
      }
      const rect = svg.getBoundingClientRect();
      if (!rect.width || !rect.height) {
        return null;
      }
      const view = state.view;
      const x = view.x + ((clientX - rect.left) / rect.width) * view.width;
      const y = view.y + ((clientY - rect.top) / rect.height) * view.height;
      return { x, y };
    };

    const snapPoint = (point) => {
      if (!point) {
        return null;
      }
      if (state.grid.snap && state.grid.size > 0) {
        return {
          x: Math.round(point.x / state.grid.size) * state.grid.size,
          y: Math.round(point.y / state.grid.size) * state.grid.size
        };
      }
      return { x: point.x, y: point.y };
    };

    const renderGrid = () => {
      clearGroup(gridGroup);
      if (!state.grid.visible || state.grid.size <= 0) {
        return;
      }
      const view = state.view;
      const size = state.grid.size;
      const startX = Math.floor(view.x / size) * size;
      const endX = view.x + view.width;
      const stopX = Math.ceil(endX / size) * size;
      const startY = Math.floor(view.y / size) * size;
      const endY = view.y + view.height;
      const stopY = Math.ceil(endY / size) * size;
      const majorEvery = 5;
      for (let x = startX; x <= stopX; x += size) {
        const index = Math.round(x / size);
        const major = Math.abs(index) % majorEvery === 0;
        appendLine(gridGroup, x, startY, x, endY, {
          stroke: major ? GRID_MAJOR : GRID_MINOR,
          width: 1,
          cap: "square"
        });
      }
      for (let y = startY; y <= stopY; y += size) {
        const index = Math.round(y / size);
        const major = Math.abs(index) % majorEvery === 0;
        appendLine(gridGroup, startX, y, endX, y, {
          stroke: major ? GRID_MAJOR : GRID_MINOR,
          width: 1,
          cap: "square"
        });
      }
    };

    const collectWireSegments = (wires) => {
      const segments = [];
      wires.forEach((wire) => {
        const points = Array.isArray(wire.points) ? wire.points : [];
        const priority = getWirePriority(wire);
        for (let index = 0; index < points.length - 1; index += 1) {
          const start = points[index];
          const end = points[index + 1];
          if (!start || !end) {
            continue;
          }
          if (start.x === end.x && start.y === end.y) {
            continue;
          }
          if (start.x === end.x) {
            segments.push({
              wireId: String(wire.id ?? ""),
              priority,
              orientation: "v",
              start,
              end,
              coord: start.x,
              min: Math.min(start.y, end.y),
              max: Math.max(start.y, end.y)
            });
          } else if (start.y === end.y) {
            segments.push({
              wireId: String(wire.id ?? ""),
              priority,
              orientation: "h",
              start,
              end,
              coord: start.y,
              min: Math.min(start.x, end.x),
              max: Math.max(start.x, end.x)
            });
          }
        }
      });
      return segments;
    };

    const getWireCrossings = (segment, verticalSegments, pointKeys, currentPriority) => {
      const crossings = [];
      const y = segment.coord;
      verticalSegments.forEach((vert) => {
        if (vert.wireId === segment.wireId) {
          return;
        }
        if (!isHigherPriority(currentPriority, vert.priority)) {
          return;
        }
        const x = vert.coord;
        if (x <= segment.min || x >= segment.max) {
          return;
        }
        if (y <= vert.min || y >= vert.max) {
          return;
        }
        const key = `${x},${y}`;
        if (pointKeys.has(key)) {
          return;
        }
        crossings.push(x);
      });
      return crossings;
    };

    const getWireCrossingsForVertical = (segment, horizontalSegments, pointKeys, currentPriority) => {
      const crossings = [];
      const x = segment.coord;
      horizontalSegments.forEach((horiz) => {
        if (horiz.wireId === segment.wireId) {
          return;
        }
        if (!isHigherPriority(currentPriority, horiz.priority)) {
          return;
        }
        const y = horiz.coord;
        if (y <= segment.min || y >= segment.max) {
          return;
        }
        if (x <= horiz.min || x >= horiz.max) {
          return;
        }
        const key = `${x},${y}`;
        if (pointKeys.has(key)) {
          return;
        }
        crossings.push(y);
      });
      return crossings;
    };

    const buildWirePath = (points, wireId, segments, pointKeys, options) => {
      if (!Array.isArray(points) || points.length < 2) {
        return { d: "", hasJump: false };
      }
      const verticalSegments = segments.filter((segment) => segment.orientation === "v");
      const horizontalSegments = segments.filter((segment) => segment.orientation === "h");
      const allowHorizontalJumps = options?.allowHorizontalJumps !== false;
      const allowVerticalJumps = options?.allowVerticalJumps === true;
      const currentPriority = options?.priority ?? getWirePriority({ id: wireId });
      const radius = options?.jumpRadius ?? getWireJumpRadius();
      const minSpacing = radius * 2 + 2;
      let hasJump = false;
      let d = `M ${points[0].x} ${points[0].y}`;
      for (let index = 0; index < points.length - 1; index += 1) {
        const start = points[index];
        const end = points[index + 1];
        if (!start || !end) {
          continue;
        }
        if (start.y === end.y) {
          if (allowHorizontalJumps) {
            const segment = {
              wireId,
              coord: start.y,
              min: Math.min(start.x, end.x),
              max: Math.max(start.x, end.x)
            };
            const rawCrossings = getWireCrossings(segment, verticalSegments, pointKeys, currentPriority);
            const dir = end.x >= start.x ? 1 : -1;
            const ordered = rawCrossings.sort((a, b) => (dir > 0 ? a - b : b - a));
            const filtered = [];
            ordered.forEach((x) => {
              if (Math.abs(x - start.x) <= radius || Math.abs(x - end.x) <= radius) {
                return;
              }
              if (filtered.length && Math.abs(x - filtered[filtered.length - 1]) < minSpacing) {
                return;
              }
              filtered.push(x);
            });
            if (filtered.length) {
              hasJump = true;
              let cursorX = start.x;
              filtered.forEach((x) => {
                const beforeX = x - dir * radius;
                const afterX = x + dir * radius;
                if (dir > 0 && beforeX <= cursorX) {
                  return;
                }
                if (dir < 0 && beforeX >= cursorX) {
                  return;
                }
                if (dir > 0 && afterX >= end.x) {
                  return;
                }
                if (dir < 0 && afterX <= end.x) {
                  return;
                }
                d += ` L ${beforeX} ${start.y}`;
                const sweep = dir > 0 ? 1 : 0;
                d += ` A ${radius} ${radius} 0 0 ${sweep} ${afterX} ${start.y}`;
                cursorX = afterX;
              });
            }
          }
          d += ` L ${end.x} ${end.y}`;
          continue;
        }
        if (start.x === end.x) {
          if (allowVerticalJumps) {
            const segment = {
              wireId,
              coord: start.x,
              min: Math.min(start.y, end.y),
              max: Math.max(start.y, end.y)
            };
            const rawCrossings = getWireCrossingsForVertical(segment, horizontalSegments, pointKeys, currentPriority);
            const dir = end.y >= start.y ? 1 : -1;
            const ordered = rawCrossings.sort((a, b) => (dir > 0 ? a - b : b - a));
            const filtered = [];
            ordered.forEach((y) => {
              if (Math.abs(y - start.y) <= radius || Math.abs(y - end.y) <= radius) {
                return;
              }
              if (filtered.length && Math.abs(y - filtered[filtered.length - 1]) < minSpacing) {
                return;
              }
              filtered.push(y);
            });
            if (filtered.length) {
              hasJump = true;
              let cursorY = start.y;
              filtered.forEach((y) => {
                const beforeY = y - dir * radius;
                const afterY = y + dir * radius;
                if (dir > 0 && beforeY <= cursorY) {
                  return;
                }
                if (dir < 0 && beforeY >= cursorY) {
                  return;
                }
                if (dir > 0 && afterY >= end.y) {
                  return;
                }
                if (dir < 0 && afterY <= end.y) {
                  return;
                }
                d += ` L ${start.x} ${beforeY}`;
                const sweep = dir > 0 ? 1 : 0;
                d += ` A ${radius} ${radius} 0 0 ${sweep} ${start.x} ${afterY}`;
                cursorY = afterY;
              });
            }
          }
          d += ` L ${end.x} ${end.y}`;
        }
      }
      return { d, hasJump };
    };

    const renderWirePath = (group, points, wireId, segments, pointKeys, options) => {
      const pathInfo = buildWirePath(points, wireId, segments, pointKeys, options);
      if (!pathInfo.d) {
        return null;
      }
      const path = appendPath(group, pathInfo.d, options);
      if (wireId) {
        path.setAttribute("data-wire-id", String(wireId));
      }
      if (options?.dash) {
        path.setAttribute("stroke-dasharray", options.dash);
      }
      if (options?.dataAttribute) {
        path.setAttribute(options.dataAttribute, "1");
      }
      if (options?.dataPoints) {
        const pointString = points.map((point) => `${point.x},${point.y}`).join(" ");
        path.setAttribute("data-wire-points", pointString);
      }
      if (pathInfo.hasJump) {
        path.setAttribute("data-wire-jump", "1");
      }
      return path;
    };

    const renderWires = (netColorState) => {
      clearGroup(wireGroup);
      const wires = Array.isArray(state.model?.wires) ? state.model.wires : [];
      const previewWires = state.drag?.previewWires;
      const skipIds = previewWires && previewWires.size
        ? new Set(previewWires.keys())
        : null;
      const displayWires = skipIds
        ? wires.filter((wire) => !skipIds.has(wire.id))
        : wires;
      const segments = collectWireSegments(displayWires);
      const pointKeys = new Set();
      const pointColorMap = new Map();
      displayWires.forEach((wire) => {
        (wire.points ?? []).forEach((point) => {
          pointKeys.add(pointKey(point));
          const color = netColorState?.wireColors?.[String(wire?.id ?? "")];
          if (!color) {
            return;
          }
          const key = pointKey(point);
          if (!pointColorMap.has(key)) {
            pointColorMap.set(key, color);
          }
        });
      });
      displayWires.forEach((wire) => {
        const points = Array.isArray(wire.points) ? wire.points : [];
        if (points.length < 2) {
          return;
        }
        const stroke = netColorState?.wireColors?.[String(wire?.id ?? "")] ?? STROKE;
        renderWirePath(wireGroup, points, wire.id, segments, pointKeys, {
          stroke,
          width: STROKE_WIDTH,
          cap: "round",
          join: "round",
          allowVerticalJumps: true,
          priority: getWirePriority(wire)
        });
      });
      const { pinCounts, combinedDegrees } = collectRenderableJunctionInfo(
        displayWires,
        state.model?.components ?? []
      );
      combinedDegrees.forEach((degree, key) => {
        if (degree < 3) {
          return;
        }
        const parts = key.split(",");
        if (parts.length !== 2) {
          return;
        }
        const x = Number(parts[0]);
        const y = Number(parts[1]);
        if (!Number.isFinite(x) || !Number.isFinite(y)) {
          return;
        }
        const dotColor = pointColorMap.get(key) ?? STROKE;
        const dot = appendCircle(wireGroup, x, y, 3, { fill: dotColor, width: 0 });
        if ((pinCounts.get(key) ?? 0) > 0) {
          dot.setAttribute("data-terminal-junction", "1");
        } else {
          dot.setAttribute("data-junction", "1");
        }
      });
    };

    const renderComponents = (netColorState) => {
      clearGroup(componentGroup);
      const components = Array.isArray(state.model?.components) ? state.model.components : [];
      components.forEach((component) => {
        const type = String(component?.type ?? "").toUpperCase();
        const netColor = type === "NET"
          ? normalizeNetColorValue(netColorState?.netColors?.[String(component?.id ?? "")])
          : null;
        const componentColor = normalizeNetColorValue(component?.netColor);
        const strokeColor = netColor ?? componentColor;
        drawComponentSymbol(componentGroup, component, {
          measurements: state.measurements,
          probeLabels: state.probeLabels,
          ...(strokeColor ? {
            stroke: strokeColor,
            labelColor: strokeColor,
            valueColor: strokeColor
          } : {})
        });
      });
    };

    const renderOverlay = (netColorStateArg) => {
      const netColorState = netColorStateArg ?? resolveNetColorState();
      clearGroup(overlayGroup);
      if (state.wireStart) {
        appendCircle(overlayGroup, state.wireStart.x, state.wireStart.y, 6, {
          stroke: "#0f62fe",
          width: 2,
          fill: "rgba(15, 98, 254, 0.15)"
        });
      }
      const overlayWires = [];
      if (state.wirePreview && Array.isArray(state.wirePreview.points) && state.wirePreview.points.length > 1) {
        overlayWires.push({
          id: "__preview__",
          points: state.wirePreview.points,
          dataAttribute: "data-wire-preview"
        });
      }
      if (state.drag?.previewWires && state.drag.previewWires.size) {
        let index = 0;
        state.drag.previewWires.forEach((points) => {
          if (!Array.isArray(points) || points.length < 2) {
            return;
          }
          overlayWires.push({
            id: `__drag__${index}`,
            points,
            dataAttribute: "data-wire-drag-preview"
          });
          index += 1;
        });
      }
      if (state.drag?.previewBranches && state.drag.previewBranches.length) {
        state.drag.previewBranches.forEach((points, index) => {
          if (!Array.isArray(points) || points.length < 2) {
            return;
          }
          overlayWires.push({
            id: `__drag_branch__${index}`,
            points,
            dataAttribute: "data-wire-drag-preview"
          });
        });
      }
      if (state.selectionPlacement?.wires?.length) {
        const placement = state.selectionPlacement;
        const position = resolvePlacementPosition(placement.position, false);
        const transform = cloneTransform(state.placeTransform);
        if (position) {
          placement.wires.forEach((template, index) => {
            if (!template || !Array.isArray(template.points) || template.points.length < 2) {
              return;
            }
            const points = template.points.map((point) =>
              mapSelectionPlacementPoint(point, position, transform, false)
            );
            overlayWires.push({
              id: `__selection_place_wire__${index}`,
              points,
              dataAttribute: "data-selection-placement-wire-preview",
              stroke: "#6f6f73",
              dash: "5 4"
            });
          });
        }
      }
      if (overlayWires.length) {
        const previewWires = state.drag?.previewWires;
        const skipIds = previewWires && previewWires.size
          ? new Set(previewWires.keys())
          : null;
        const baseWires = Array.isArray(state.model?.wires)
          ? state.model.wires.filter((wire) => !skipIds || !skipIds.has(wire.id))
          : [];
        const segments = collectWireSegments(baseWires);
        const pointKeys = new Set();
        baseWires.forEach((wire) => {
          (wire.points ?? []).forEach((point) => {
            pointKeys.add(pointKey(point));
          });
        });
        overlayWires.forEach((wire) => {
          renderWirePath(overlayGroup, wire.points, wire.id, segments, pointKeys, {
            stroke: wire.stroke ?? "#0f62fe",
            width: 1.5,
            join: "round",
            dataAttribute: wire.dataAttribute,
            dash: wire.dash ?? "6 4",
            dataPoints: true,
            allowVerticalJumps: true,
            priority: getWirePriority(wire)
          });
        });
      }
      if (state.wirePreview?.junctions?.length) {
        state.wirePreview.junctions.forEach((junction) => {
          const dot = appendCircle(overlayGroup, junction.x, junction.y, 5, {
            stroke: "#0f62fe",
            width: 2,
            fill: "rgba(15, 98, 254, 0.15)"
          });
          dot.setAttribute("data-junction-preview", "1");
        });
      }
      if (state.probeDiffStart && state.tool.mode === "place" && String(state.tool.type ?? "").toUpperCase() === "PV") {
        const start = state.probeDiffStart;
        const preview = state.probeDiffPreview ?? start;
        const previewPlan = getDifferentialProbeRenderPlan({
          type: "PD",
          pins: [
            { id: "P+", name: "P+", x: start.x, y: start.y },
            { id: "P-", name: "P-", x: preview.x, y: preview.y }
          ],
          probeDiffRotations: { "P+": 0, "P-": 0 }
        });
        if (previewPlan) {
          const previewColor = "#0f62fe";
          const tipRadius = Number(previewPlan.headRadius);
          const polarityFill = getDifferentialPolarityColor(previewColor);
          const previewLine = appendLine(
            overlayGroup,
            previewPlan.link.x1,
            previewPlan.link.y1,
            previewPlan.link.x2,
            previewPlan.link.y2,
            {
              stroke: previewColor,
              width: 1.5
            }
          );
          previewLine.setAttribute("data-probe-diff-preview", "1");
          previewLine.setAttribute("stroke-dasharray", previewPlan.link.dash);
          previewPlan.endpoints.forEach((endpoint) => {
            const lead = appendLine(overlayGroup, endpoint.anchor.x, endpoint.anchor.y, endpoint.tip.x, endpoint.tip.y, {
              stroke: previewColor,
              width: 1.5
            });
            lead.setAttribute("data-probe-diff-preview-lead", endpoint.side);
            const tipCircle = appendCircle(overlayGroup, endpoint.tip.x, endpoint.tip.y, tipRadius, {
              stroke: previewColor,
              width: 1.25,
              fill: previewColor
            });
            tipCircle.setAttribute("data-probe-diff-preview-tip", endpoint.side);
            const polarity = appendText(
              overlayGroup,
              endpoint.polarityPosition.x,
              endpoint.polarityPosition.y,
              endpoint.polarity,
              {
                size: 11,
                fill: polarityFill,
                anchor: "middle",
                baseline: "middle",
                weight: 700
              }
            );
            polarity.setAttribute("data-probe-diff-preview-polarity", endpoint.side);
          });
        }
      }
      if (state.preview) {
        const preview = state.preview;
        const previewComponent = typeof api.createComponentFromSymbol === "function"
          ? api.createComponentFromSymbol(preview.type, "PREVIEW", "", preview.position.x, preview.position.y)
          : null;
        if (previewComponent) {
          applyTransformToComponent(previewComponent, state.placeTransform, false);
          drawComponentSymbol(overlayGroup, previewComponent, {
            showLabel: false,
            opacity: 0.4,
            className: "schematic-preview"
          });
        }
      }
      if (state.selectionPlacement?.components?.length) {
        const placement = state.selectionPlacement;
        const position = resolvePlacementPosition(placement.position, false);
        const transform = cloneTransform(state.placeTransform);
        if (position) {
          placement.components.forEach((template, index) => {
            if (!template || !Array.isArray(template.pins) || !template.pins.length) {
              return;
            }
            const mappedPins = template.pins.map((pin) => mapSelectionPlacementPoint(pin, position, transform, false));
            const previewComponent = {
              id: `SELECTION_PREVIEW_${index + 1}`,
              name: String(template.name ?? ""),
              type: template.type,
              value: template.value ?? "",
              ...(Object.prototype.hasOwnProperty.call(template, "netColor")
                ? { netColor: template.netColor ?? "" }
                : {}),
              ...(Object.prototype.hasOwnProperty.call(template, "textOnly")
                ? { textOnly: template.textOnly === true }
                : {}),
              ...(Object.prototype.hasOwnProperty.call(template, "textFont")
                ? { textFont: String(template.textFont ?? "") }
                : {}),
              ...(Object.prototype.hasOwnProperty.call(template, "textSize")
                ? { textSize: Number(template.textSize) }
                : {}),
              ...(Object.prototype.hasOwnProperty.call(template, "textBold")
                ? { textBold: template.textBold === true }
                : {}),
              ...(Object.prototype.hasOwnProperty.call(template, "textItalic")
                ? { textItalic: template.textItalic === true }
                : {}),
              ...(Object.prototype.hasOwnProperty.call(template, "textUnderline")
                ? { textUnderline: template.textUnderline === true }
                : {}),
              ...(Object.prototype.hasOwnProperty.call(template, "probeDiffRotations")
                ? {
                  probeDiffRotations: {
                    "P+": Number(template?.probeDiffRotations?.["P+"]),
                    "P-": Number(template?.probeDiffRotations?.["P-"])
                  }
                }
                : {}),
              pins: template.pins.map((pin, pinIndex) => ({
                id: pin.id,
                name: pin.name,
                x: mappedPins[pinIndex]?.x ?? pin.x,
                y: mappedPins[pinIndex]?.y ?? pin.y
              })),
              rotation: template.rotation,
              labelRotation: template.labelRotation
            };
            if (previewComponent.pins.length === 1) {
              previewComponent.rotation = resolveSinglePinPlacementRotation(
                previewComponent.type,
                template.rotation,
                transform
              );
            }
            drawComponentSymbol(overlayGroup, previewComponent, {
              showLabel: false,
              opacity: 0.4,
              className: "schematic-preview schematic-selection-preview"
            });
          });
        }
      }
      if (state.selectionBox) {
        const box = state.selectionBox;
        const minX = Math.min(box.start.x, box.end.x);
        const minY = Math.min(box.start.y, box.end.y);
        const maxX = Math.max(box.start.x, box.end.x);
        const maxY = Math.max(box.start.y, box.end.y);
        const isTouch = box.mode === "touch";
        const strokeColor = isTouch ? "#198038" : "#0f62fe";
        const fillColor = isTouch ? "rgba(25, 128, 56, 0.08)" : "rgba(15, 98, 254, 0.08)";
        const rect = document.createElementNS(SVG_NS, "rect");
        setAttrs(rect, {
          x: minX,
          y: minY,
          width: maxX - minX,
          height: maxY - minY,
          fill: fillColor,
          stroke: strokeColor,
          "stroke-width": 1,
          "stroke-dasharray": "4 3"
        });
        overlayGroup.appendChild(rect);
      }
      if (state.drag?.componentIds?.length) {
        state.drag.componentIds.forEach((id) => {
          const component = getComponent(id);
          if (!isElectricalComponentType(component?.type)) {
            return;
          }
          if (!component?.pins?.length) {
            return;
          }
          component.pins.forEach((pin) => {
            const dot = appendCircle(overlayGroup, pin.x, pin.y, 3, { fill: "#0f62fe", width: 0 });
            dot.setAttribute("data-terminal-drag", "1");
          });
        });
      }
      if (state.hoveredWireId) {
        const wire = getWire(state.hoveredWireId);
        const points = Array.isArray(wire?.points) ? wire.points : [];
        if (points.length > 1) {
          const wires = Array.isArray(state.model?.wires) ? state.model.wires : [];
          const segments = collectWireSegments(wires);
          const pointKeys = new Set();
          wires.forEach((entryWire) => {
            (entryWire.points ?? []).forEach((point) => {
              pointKeys.add(pointKey(point));
            });
          });
          const wireColor = netColorState?.wireColors?.[String(wire?.id ?? "")] ?? STROKE;
          renderWirePath(overlayGroup, points, wire.id, segments, pointKeys, {
            stroke: wireColor,
            width: 3,
            join: "round",
            dataAttribute: "data-wire-hover-highlight",
            allowVerticalJumps: true,
            priority: getWirePriority(wire)
          });
        }
      }
      if (state.hoveredComponentId) {
        const component = getComponent(state.hoveredComponentId);
        if (component) {
          const type = String(component?.type ?? "").toUpperCase();
          const netColor = type === "NET"
            ? normalizeNetColorValue(netColorState?.netColors?.[String(component?.id ?? "")])
            : null;
          const componentColor = normalizeNetColorValue(component?.netColor);
          const hoverColor = netColor ?? componentColor ?? STROKE;
          drawComponentSymbol(overlayGroup, component, {
            showLabel: true,
            showEndpoints: false,
            stroke: hoverColor,
            width: 3,
            fill: "none",
            className: "schematic-component-hover-highlight",
            dataHighlight: `hover-${component.id}`,
            labelColor: hoverColor,
            valueColor: hoverColor,
            measurements: state.measurements,
            probeLabels: state.probeLabels
          });
        }
        if (component?.pins?.length && isElectricalComponentType(component?.type)) {
          const type = String(component?.type ?? "").toUpperCase();
          const netColor = type === "NET"
            ? normalizeNetColorValue(netColorState?.netColors?.[String(component?.id ?? "")])
            : null;
          const componentColor = normalizeNetColorValue(component?.netColor);
          const hoverColor = netColor ?? componentColor ?? STROKE;
          component.pins.forEach((pin) => {
            const dot = appendCircle(overlayGroup, pin.x, pin.y, 3, { fill: hoverColor, width: 0 });
            dot.setAttribute("data-terminal-hover", "1");
          });
        } else if (String(component?.type ?? "").toUpperCase() === "PD") {
          const componentColor = normalizeNetColorValue(component?.netColor);
          const hoverColor = componentColor ?? STROKE;
          drawDifferentialProbeOverlayLink(overlayGroup, component, {
            color: hoverColor,
            width: 1.25
          });
        }
      }
      if (state.selectionIds.length) {
        state.selectionIds.forEach((id) => {
          const component = getComponent(id);
          if (!component) {
            return;
          }
          const type = String(component?.type ?? "").toUpperCase();
          const selectedDiffSides = type === "PD" ? getProbeDiffSelectedSides(component.id) : new Set();
          if (!(type === "PD" && selectedDiffSides.size)) {
            drawComponentSymbol(overlayGroup, component, {
              showLabel: false,
              showEndpoints: false,
              stroke: "#0f62fe",
              width: 3,
              fill: "none",
              className: "schematic-component-highlight",
              dataHighlight: id
            });
          }
          const info = getTwoPinInfo(component);
          const labelGeometry = type === "SW"
            ? getSpdtLabelGeometry(component)
            : (info
              ? { midX: info.midX, midY: info.midY, angle: info.angle }
              : null);
          if (isProbeComponentType(type)) {
            drawProbeLabel(overlayGroup, component, {
              labelColor: "#0f62fe",
              valueColor: "#0f62fe",
              dataHighlight: 1,
              measurements: state.measurements,
              probeLabels: state.probeLabels
            });
            if (type === "PD") {
              drawDifferentialProbeOverlayLink(overlayGroup, component, {
                color: "#0f62fe",
                width: 1.25,
                selectedSides: selectedDiffSides
              });
            }
          } else if (labelGeometry) {
            const measurementText = state.measurements?.get?.(component.id);
            const labelInfo = drawComponentLabel(overlayGroup, component, {
              midX: labelGeometry.midX,
              midY: labelGeometry.midY,
              angle: labelGeometry.angle,
              extraLines: measurementText ? 1 : 0,
              labelColor: "#0f62fe",
              valueColor: "#0f62fe",
              dataHighlight: 1
            });
            if (measurementText && labelInfo) {
              const measurementLabel = appendText(
                overlayGroup,
                labelInfo.layout.x,
                labelInfo.layout.y + labelInfo.layout.lineHeight * (labelInfo.lineCount - 1),
                measurementText,
                {
                  size: 11,
                  fill: "#0f62fe",
                  anchor: labelInfo.layout.anchor,
                  weight: MEASUREMENT_TEXT_WEIGHT
                }
              );
              if (component?.id) {
                measurementLabel.setAttribute("data-component-id", String(component.id));
              }
              measurementLabel.setAttribute("data-component-label-highlight", "1");
            }
          } else if (type === "NET") {
            const pin = (component.pins ?? [])[0];
            if (pin) {
              const rotation = snapRotation(Number(component?.rotation ?? 0));
              const labelGroup = document.createElementNS(SVG_NS, "g");
              const rotate = rotation !== 0 ? ` rotate(${rotation})` : "";
              labelGroup.setAttribute("transform", `translate(${pin.x} ${pin.y})${rotate}`);
              appendNamedNodeLabelText(labelGroup, component, rotation, {
                labelColor: "#0f62fe",
                dataHighlight: 1
              });
              overlayGroup.appendChild(labelGroup);
            }
          }
        });
      }
      const externalHighlightEntries = Array.isArray(state.externalHighlightEntries) && state.externalHighlightEntries.length
        ? state.externalHighlightEntries
        : [{
          componentIds: state.externalHighlightComponentIds,
          wireIds: state.externalHighlightWireIds,
          color: state.externalHighlightColor,
          mode: "selection"
        }];
      const normalizeExternalHighlightMode = (value) =>
        String(value ?? "").trim().toLowerCase() === "hover" ? "hover" : "selection";
      const hoveredWireColorById = new Map();
      const hoverHighlightedWireIds = new Set();
      const hasExternalHighlights = externalHighlightEntries.some((entry) => {
        const componentIds = entry?.componentIds instanceof Set ? entry.componentIds : new Set();
        const wireIds = entry?.wireIds instanceof Set ? entry.wireIds : new Set();
        return componentIds.size > 0 || wireIds.size > 0;
      });
      if (hasExternalHighlights) {
        let wireSegments = null;
        let wirePointKeys = null;
        externalHighlightEntries.forEach((entry) => {
          const componentIds = entry?.componentIds instanceof Set ? entry.componentIds : new Set();
          const wireIds = entry?.wireIds instanceof Set ? entry.wireIds : new Set();
          if (!componentIds.size && !wireIds.size) {
            return;
          }
          const mode = normalizeExternalHighlightMode(entry?.mode);
          const baseColor = String(entry?.color ?? DEFAULT_EXTERNAL_HIGHLIGHT_COLOR).trim().toLowerCase() || DEFAULT_EXTERNAL_HIGHLIGHT_COLOR;
          const externalColor = baseColor;
          const externalWidth = 3;
          if (mode === "hover" && wireIds.size) {
            wireIds.forEach((wireIdValue) => {
              const wireId = String(wireIdValue ?? "");
              if (!wireId) {
                return;
              }
              hoveredWireColorById.set(wireId, externalColor);
              hoverHighlightedWireIds.add(wireId);
            });
          }
          componentIds.forEach((componentId) => {
            const id = String(componentId ?? "");
            if (!id) {
              return;
            }
            const component = getComponent(id);
            if (!component) {
              return;
            }
            drawComponentSymbol(overlayGroup, component, {
              showLabel: true,
              showEndpoints: false,
              stroke: externalColor,
              width: externalWidth,
              fill: "none",
              className: "schematic-component-external-highlight",
              dataHighlight: mode === "hover" ? `external-hover-${id}` : `external-${id}`,
              labelColor: externalColor,
              valueColor: externalColor,
              measurements: state.measurements,
              probeLabels: state.probeLabels
            });
          });
          if (!wireIds.size) {
            return;
          }
          if (!wireSegments || !wirePointKeys) {
            const wires = Array.isArray(state.model?.wires) ? state.model.wires : [];
            wireSegments = collectWireSegments(wires);
            wirePointKeys = new Set();
            wires.forEach((entryWire) => {
              (entryWire.points ?? []).forEach((point) => {
                wirePointKeys.add(pointKey(point));
              });
            });
          }
          wireIds.forEach((wireIdValue) => {
            const wireId = String(wireIdValue ?? "");
            if (!wireId) {
              return;
            }
            const wire = getWire(wireId);
            const points = Array.isArray(wire?.points) ? wire.points : [];
            if (points.length <= 1) {
              return;
            }
            renderWirePath(overlayGroup, points, wire.id, wireSegments, wirePointKeys, {
              stroke: externalColor,
              width: externalWidth,
              join: "round",
              dataAttribute: "data-wire-external-highlight",
              allowVerticalJumps: true,
              priority: getWirePriority(wire)
            });
          });
        });
        if (hoverHighlightedWireIds.size) {
          const degrees = getWirePointDegrees();
          const hoverPointKeys = new Set();
          const hoverPointColors = new Map();
          hoverHighlightedWireIds.forEach((wireId) => {
            const wire = getWire(wireId);
            const points = Array.isArray(wire?.points) ? wire.points : [];
            if (!points.length) {
              return;
            }
            const color = hoveredWireColorById.get(wireId) ?? STROKE;
            points.forEach((point) => {
              const key = pointKey(point);
              hoverPointKeys.add(key);
              if (!hoverPointColors.has(key)) {
                hoverPointColors.set(key, color);
              }
            });
          });
          if (hoverPointKeys.size) {
            const pinPointCounts = new Map();
            (state.model?.components ?? []).forEach((component) => {
              if (!isElectricalComponentType(component?.type)) {
                return;
              }
              (component.pins ?? []).forEach((pin) => {
                const key = pointKey(pin);
                if (hoverPointKeys.has(key)) {
                  pinPointCounts.set(key, (pinPointCounts.get(key) ?? 0) + 1);
                }
              });
            });
            hoverPointKeys.forEach((key) => {
              const parts = key.split(",");
              if (parts.length !== 2) {
                return;
              }
              const x = Number(parts[0]);
              const y = Number(parts[1]);
              if (!Number.isFinite(x) || !Number.isFinite(y)) {
                return;
              }
              const color = hoverPointColors.get(key) ?? STROKE;
              const degree = degrees.get(key) ?? 0;
              if (degree >= 3) {
                const junction = appendCircle(overlayGroup, x, y, 4, {
                  fill: color,
                  width: 0
                });
                junction.setAttribute("data-wire-junction-hover-highlight", "1");
              }
              if ((pinPointCounts.get(key) ?? 0) > 0) {
                const pinDot = appendCircle(overlayGroup, x, y, 3, {
                  fill: color,
                  width: 0
                });
                pinDot.setAttribute("data-terminal-hover-target", "1");
              }
            });
          }
        }
      }
      const wireIds = state.wireSelections.length
        ? state.wireSelections.slice()
        : (state.wireSelection ? [state.wireSelection] : []);
      const isDraggingWireSelection = Boolean(state.drag?.wireIds?.length);
      if (wireIds.length && !isDraggingWireSelection) {
        const wires = Array.isArray(state.model?.wires) ? state.model.wires : [];
        const segments = collectWireSegments(wires);
        const pointKeys = new Set();
        wires.forEach((entry) => {
          (entry.points ?? []).forEach((point) => {
            pointKeys.add(pointKey(point));
          });
        });
        const degrees = getWirePointDegrees();
        const nodeKeys = new Set();
        const nodeColors = new Map();
        const setNodeColor = (key, color, isHovered) => {
          if (!key) {
            return;
          }
          const existing = nodeColors.get(key);
          if (!existing || (isHovered && !existing.isHovered)) {
            nodeColors.set(key, { color, isHovered: Boolean(isHovered) });
          }
        };
        const uniqueWireIds = Array.from(new Set(wireIds.map(String)));
        uniqueWireIds.forEach((wireId) => {
          const wire = getWire(wireId);
          const points = Array.isArray(wire?.points) ? wire.points : [];
          if (points.length <= 1) {
            return;
          }
          const selectedWireColor = hoveredWireColorById.get(wire.id) ?? "#0f62fe";
          const isHoveredWire = hoveredWireColorById.has(wire.id);
          const start = points[0];
          const end = points[points.length - 1];
          if (start) {
            const key = pointKey(start);
            nodeKeys.add(key);
            setNodeColor(key, selectedWireColor, isHoveredWire);
          }
          if (end) {
            const key = pointKey(end);
            nodeKeys.add(key);
            setNodeColor(key, selectedWireColor, isHoveredWire);
          }
          points.forEach((point) => {
            const key = pointKey(point);
            const degree = degrees.get(key) ?? 0;
            if (degree >= 3) {
              nodeKeys.add(key);
              setNodeColor(key, selectedWireColor, isHoveredWire);
            }
          });
          renderWirePath(overlayGroup, points, wire.id, segments, pointKeys, {
            stroke: selectedWireColor,
            width: 3,
            join: "round",
            dataAttribute: "data-wire-highlight",
            allowVerticalJumps: true,
            priority: getWirePriority(wire)
          });
          const handleSize = 10;
          const halfHandle = handleSize / 2;
          for (let index = 0; index < points.length - 1; index += 1) {
            const startPoint = points[index];
            const endPoint = points[index + 1];
            if (!startPoint || !endPoint) {
              continue;
            }
            const isHorizontal = startPoint.y === endPoint.y && startPoint.x !== endPoint.x;
            const isVertical = startPoint.x === endPoint.x && startPoint.y !== endPoint.y;
            if (!isHorizontal && !isVertical) {
              continue;
            }
            const midX = (startPoint.x + endPoint.x) / 2;
            const midY = (startPoint.y + endPoint.y) / 2;
            const handle = document.createElementNS(SVG_NS, "rect");
            setAttrs(handle, {
              x: midX - halfHandle,
              y: midY - halfHandle,
              width: handleSize,
              height: handleSize,
              fill: "#f6f4ef",
              stroke: selectedWireColor,
              "stroke-width": 1.5
            });
            handle.setAttribute("data-wire-handle", String(index));
            handle.setAttribute("data-wire-id", wire.id);
            handle.setAttribute("data-wire-orient", isHorizontal ? "h" : "v");
            overlayGroup.appendChild(handle);
          }
        });
        nodeKeys.forEach((key) => {
          const parts = key.split(",");
          if (parts.length !== 2) {
            return;
          }
          const x = Number(parts[0]);
          const y = Number(parts[1]);
          if (!Number.isFinite(x) || !Number.isFinite(y)) {
            return;
          }
          const degree = degrees.get(key) ?? 0;
          const nodeColor = nodeColors.get(key)?.color ?? "#0f62fe";
          if (degree >= 3) {
            const junction = appendCircle(overlayGroup, x, y, 3, {
              fill: nodeColor,
              width: 0
            });
            junction.setAttribute("data-wire-junction-highlight", "1");
          }
          const node = appendCircle(overlayGroup, x, y, 4, {
            fill: "#f6f4ef",
            stroke: nodeColor,
            width: 1.5
          });
          node.setAttribute("data-wire-node", key);
        });
      }
      svg._previewState = state.preview
        ? {
          type: state.preview.type,
          position: { ...state.preview.position },
          transform: cloneTransform(state.placeTransform)
        }
        : (state.selectionPlacement
          ? {
            type: "selection-placement",
            position: resolvePlacementPosition(state.selectionPlacement.position, false),
            transform: cloneTransform(state.placeTransform),
            componentCount: Array.isArray(state.selectionPlacement.components) ? state.selectionPlacement.components.length : 0,
            wireCount: Array.isArray(state.selectionPlacement.wires) ? state.selectionPlacement.wires.length : 0
          }
          : null);
      svg._wirePreviewState = state.wirePreview
        ? { points: state.wirePreview.points.map((point) => ({ x: point.x, y: point.y })) }
        : null;
    };

    const render = () => {
      if (renderRequestId !== null) {
        cancelAnimationFrame(renderRequestId);
        renderRequestId = null;
      }
      const shouldSyncView = state.skipViewSyncOnce !== true;
      state.skipViewSyncOnce = false;
      if (shouldSyncView) {
        syncViewToViewport();
      }
      applyViewBox();
      renderGrid();
      const netColorState = resolveNetColorState();
      renderWires(netColorState);
      renderComponents(netColorState);
      renderOverlay(netColorState);
    };
    const renderDragFrame = () => {
      const netColorState = resolveNetColorState();
      renderComponents(netColorState);
      renderOverlay(netColorState);
    };
    scheduleRender = (mode) => {
      if (renderRequestId !== null) {
        return;
      }
      renderRequestId = requestAnimationFrame(() => {
        renderRequestId = null;
        if (mode === "drag") {
          renderDragFrame();
        } else {
          render();
        }
      });
    };

    const notifySelection = () => {
      if (typeof options?.onSelectionChange !== "function") {
        return;
      }
      const primaryId = state.selectionIds[0] ?? null;
      const component = primaryId ? getComponent(primaryId) : null;
      options.onSelectionChange(component, state.selectionIds.slice());
    };

    const notifyHoverTargets = () => {
      if (typeof options?.onHoverTargetsChange !== "function") {
        return;
      }
      const componentIds = state.hoveredComponentId ? [state.hoveredComponentId] : [];
      const wireIds = state.hoveredWireId ? [state.hoveredWireId] : [];
      options.onHoverTargetsChange({ componentIds, wireIds });
    };

    const notifyViewChange = () => {
      if (typeof options?.onViewChange !== "function") {
        return;
      }
      options.onViewChange({ ...state.view });
    };

    const notifyModelChange = () => {
      if (typeof options?.onModelChange === "function") {
        options.onModelChange(state.model);
      }
    };

    const cloneModel = (source) => ({
      components: (source?.components ?? []).map((component) => ({
        id: component.id,
        name: Object.prototype.hasOwnProperty.call(component, "name")
          ? String(component.name ?? "")
          : String(component.id ?? ""),
        type: component.type,
        value: component.value ?? "",
        ...(Object.prototype.hasOwnProperty.call(component, "netColor")
          ? { netColor: component.netColor ?? "" }
          : {}),
        ...(Object.prototype.hasOwnProperty.call(component, "textOnly")
          ? { textOnly: component.textOnly === true }
          : {}),
        ...(Object.prototype.hasOwnProperty.call(component, "textFont")
          ? { textFont: String(component.textFont ?? "") }
          : {}),
        ...(Object.prototype.hasOwnProperty.call(component, "textSize")
          ? { textSize: Number(component.textSize) }
          : {}),
        ...(Object.prototype.hasOwnProperty.call(component, "textBold")
          ? { textBold: component.textBold === true }
          : {}),
        ...(Object.prototype.hasOwnProperty.call(component, "textItalic")
          ? { textItalic: component.textItalic === true }
          : {}),
        ...(Object.prototype.hasOwnProperty.call(component, "textUnderline")
          ? { textUnderline: component.textUnderline === true }
          : {}),
        ...(Object.prototype.hasOwnProperty.call(component, "probeDiffRotations")
          ? {
            probeDiffRotations: {
              "P+": Number(component?.probeDiffRotations?.["P+"]),
              "P-": Number(component?.probeDiffRotations?.["P-"])
            }
          }
          : {}),
        rotation: component.rotation,
        labelRotation: component.labelRotation,
        pins: (component.pins ?? []).map((pin) => ({
          id: pin.id,
          name: pin.name,
          x: pin.x,
          y: pin.y
        }))
      })),
      wires: (source?.wires ?? []).map((wire) => ({
        id: wire.id,
        points: (wire.points ?? []).map((point) => ({
          x: point.x,
          y: point.y
        }))
      }))
    });

    const applySnapshot = (snapshot) => {
      if (!snapshot) {
        return;
      }
      state.isRestoring = true;
      state.model.components.length = 0;
      snapshot.components.forEach((component) => state.model.components.push(component));
      state.model.wires.length = 0;
      snapshot.wires.forEach((wire) => state.model.wires.push(wire));
      state.selectionIds = [];
      state.selectionBox = null;
      state.wireSelection = null;
      state.wireSelections = [];
      state.wireStart = null;
      state.wirePreview = null;
      state.wireHandle = null;
      state.wireNode = null;
      state.probeDiffEndpointSelection = null;
      state.probeDiffEndpointDrag = null;
      notifySelection();
      render();
      notifyModelChange();
      state.isRestoring = false;
    };

    const recordHistory = () => {
      if (state.isRestoring) {
        return;
      }
      state.history.undo.push(cloneModel(state.model));
      state.history.redo.length = 0;
    };

    const commitModelMutation = (mutate, options) => {
      if (typeof mutate !== "function") {
        return null;
      }
      const settings = options ?? {};
      if (settings.recordHistory !== false) {
        recordHistory();
      }
      const result = mutate();
      if (settings.render === "overlay") {
        renderOverlay();
      } else if (settings.render !== false) {
        render();
      }
      if (settings.notifySelection) {
        notifySelection();
      }
      if (settings.notifyModel !== false) {
        notifyModelChange();
      }
      return result;
    };

    const undo = () => {
      if (!state.history.undo.length) {
        return;
      }
      const snapshot = state.history.undo.pop();
      state.history.redo.push(cloneModel(state.model));
      applySnapshot(snapshot);
    };

    const redo = () => {
      if (!state.history.redo.length) {
        return;
      }
      const snapshot = state.history.redo.pop();
      state.history.undo.push(cloneModel(state.model));
      applySnapshot(snapshot);
    };

    const clearProbeDiffEndpointSelection = () => {
      if (!state.probeDiffEndpointSelection) {
        return false;
      }
      state.probeDiffEndpointSelection = null;
      return true;
    };

    const normalizeProbeDiffPinId = (pinId) => {
      const normalized = String(pinId ?? "").trim().toUpperCase();
      return normalized === "P-" ? "P-" : (normalized === "P+" ? "P+" : "");
    };

    const getProbeDiffSelectedPinIds = (componentId) => {
      const selected = state.probeDiffEndpointSelection;
      if (!selected || String(selected.componentId ?? "") !== String(componentId ?? "")) {
        return new Set();
      }
      const pinIds = Array.isArray(selected.pinIds)
        ? selected.pinIds
        : (selected.pinId ? [selected.pinId] : []);
      const normalized = pinIds
        .map((entry) => normalizeProbeDiffPinId(entry))
        .filter(Boolean);
      return new Set(normalized);
    };

    const getProbeDiffSelectedSides = (componentId) => {
      const pinIds = getProbeDiffSelectedPinIds(componentId);
      const sides = new Set();
      pinIds.forEach((pinId) => {
        sides.add(pinId === "P-" ? "minus" : "plus");
      });
      return sides;
    };

    const setProbeDiffEndpointSelection = (componentId, pinId, options) => {
      const nextComponentId = componentId ? String(componentId) : "";
      const normalizedPinId = normalizeProbeDiffPinId(pinId);
      if (!nextComponentId || !normalizedPinId) {
        return clearProbeDiffEndpointSelection();
      }
      const additive = options?.additive === true;
      const current = state.probeDiffEndpointSelection;
      const currentComponentId = String(current?.componentId ?? "");
      const nextPins = additive && currentComponentId === nextComponentId
        ? getProbeDiffSelectedPinIds(nextComponentId)
        : new Set();
      if (additive && currentComponentId === nextComponentId) {
        if (nextPins.has(normalizedPinId)) {
          nextPins.delete(normalizedPinId);
        } else {
          nextPins.add(normalizedPinId);
        }
      } else {
        nextPins.clear();
        nextPins.add(normalizedPinId);
      }
      if (!nextPins.size) {
        return clearProbeDiffEndpointSelection();
      }
      const nextPinIds = Array.from(nextPins).sort();
      const currentPins = currentComponentId === nextComponentId
        ? Array.from(getProbeDiffSelectedPinIds(nextComponentId)).sort()
        : [];
      const samePins = currentPins.length === nextPinIds.length
        && currentPins.every((entry, index) => entry === nextPinIds[index]);
      if (currentComponentId === nextComponentId && samePins) {
        return false;
      }
      state.probeDiffEndpointSelection = {
        componentId: nextComponentId,
        pinIds: nextPinIds
      };
      return true;
    };

    const setSelection = (componentIds) => {
      const next = Array.isArray(componentIds)
        ? componentIds.filter(Boolean)
        : (componentIds ? [componentIds] : []);
      const currentKey = state.selectionIds.join("|");
      const nextKey = next.join("|");
      let endpointChanged = false;
      if (!next.length) {
        endpointChanged = clearProbeDiffEndpointSelection();
      } else {
        const selected = state.probeDiffEndpointSelection;
        if (selected && !next.includes(selected.componentId)) {
          endpointChanged = clearProbeDiffEndpointSelection();
        }
      }
      if (currentKey !== nextKey) {
        state.selectionIds = next;
        state.wireSelection = null;
        state.wireSelections = [];
        notifySelection();
        renderOverlay();
      } else if (endpointChanged) {
        renderOverlay();
      }
    };

    const setWireSelection = (wireId) => {
      const next = wireId ? String(wireId) : null;
      if (state.wireSelection !== next) {
        state.wireSelection = next;
        state.wireSelections = next ? [next] : [];
        state.selectionIds = [];
        clearProbeDiffEndpointSelection();
        notifySelection();
        renderOverlay();
      }
    };

    const toggleWireSelection = (wireId, options) => {
      const nextId = wireId ? String(wireId) : null;
      if (!nextId) {
        setWireSelections([], options);
        return;
      }
      const next = state.wireSelections.slice();
      const index = next.indexOf(nextId);
      if (index >= 0) {
        next.splice(index, 1);
      } else {
        next.push(nextId);
      }
      setWireSelections(next, options);
    };

    const setWireSelections = (wireIds, options) => {
      const next = Array.isArray(wireIds) ? wireIds.filter(Boolean).map(String) : [];
      const same = next.length === state.wireSelections.length
        && next.every((id, index) => id === state.wireSelections[index]);
      if (same) {
        return;
      }
      state.wireSelections = next;
      state.wireSelection = next.length === 1 ? next[0] : null;
      if (!options?.preserveComponents) {
        state.selectionIds = [];
        clearProbeDiffEndpointSelection();
      }
      notifySelection();
      renderOverlay();
    };

    const setSelectionWithWires = (componentIds, wireIds, options) => {
      const nextComponents = Array.isArray(componentIds)
        ? componentIds.filter(Boolean)
        : (componentIds ? [componentIds] : []);
      const nextWires = Array.isArray(wireIds) ? wireIds.filter(Boolean).map(String) : [];
      const sameComponents = nextComponents.length === state.selectionIds.length
        && nextComponents.every((id, index) => id === state.selectionIds[index]);
      const sameWires = nextWires.length === state.wireSelections.length
        && nextWires.every((id, index) => id === state.wireSelections[index]);
      if (sameComponents && sameWires) {
        return;
      }
      state.selectionIds = nextComponents;
      state.wireSelections = nextWires;
      state.wireSelection = nextWires.length === 1 ? nextWires[0] : null;
      const selected = state.probeDiffEndpointSelection;
      if (!nextComponents.length || (selected && !nextComponents.includes(selected.componentId))) {
        clearProbeDiffEndpointSelection();
      }
      if (!options?.preserveComponents) {
        notifySelection();
      } else {
        notifySelection();
      }
      renderOverlay();
    };

    const setHoverTarget = (target) => {
      const nextComponentId = target?.componentId ? String(target.componentId) : null;
      const nextWireId = target?.wireId ? String(target.wireId) : null;
      if (state.hoveredComponentId === nextComponentId && state.hoveredWireId === nextWireId) {
        return;
      }
      state.hoveredComponentId = nextComponentId;
      state.hoveredWireId = nextWireId;
      renderOverlay();
      notifyHoverTargets();
    };

    const setHoverComponent = (componentId) => {
      setHoverTarget(componentId ? { componentId } : null);
    };

    const updateComponent = (componentId, updates) => {
      const component = getComponent(componentId);
      if (!component || !updates) {
        return;
      }
      const nextId = Object.prototype.hasOwnProperty.call(updates, "id")
        ? String(updates.id ?? "")
        : null;
      const nextValue = Object.prototype.hasOwnProperty.call(updates, "value")
        ? String(updates.value ?? "")
        : null;
      const nextName = Object.prototype.hasOwnProperty.call(updates, "name")
        ? String(updates.name ?? "")
        : null;
      const nextType = Object.prototype.hasOwnProperty.call(updates, "type")
        ? String(updates.type ?? "").toUpperCase()
        : null;
      const hasNetColorUpdate = Object.prototype.hasOwnProperty.call(updates, "netColor");
      const hasTextOnlyUpdate = Object.prototype.hasOwnProperty.call(updates, "textOnly");
      const hasTextFontUpdate = Object.prototype.hasOwnProperty.call(updates, "textFont");
      const hasTextSizeUpdate = Object.prototype.hasOwnProperty.call(updates, "textSize");
      const hasTextBoldUpdate = Object.prototype.hasOwnProperty.call(updates, "textBold");
      const hasTextItalicUpdate = Object.prototype.hasOwnProperty.call(updates, "textItalic");
      const hasTextUnderlineUpdate = Object.prototype.hasOwnProperty.call(updates, "textUnderline");
      const componentType = String(component.type ?? "").toUpperCase();
      const typeChanged = nextType !== null
        && nextType.length > 0
        && nextType !== componentType
        && isProbeComponentType(componentType)
        && isProbeComponentType(nextType);
      const isTextComponent = componentType === "TEXT";
      let nextNetColor = null;
      let netColorUpdateValid = false;
      let nextTextOnly = false;
      let textOnlyUpdateValid = false;
      let nextTextFont = DEFAULT_TEXT_FONT;
      let textFontUpdateValid = false;
      let nextTextSize = DEFAULT_TEXT_SIZE;
      let textSizeUpdateValid = false;
      let nextTextBold = false;
      let textBoldUpdateValid = false;
      let nextTextItalic = false;
      let textItalicUpdateValid = false;
      let nextTextUnderline = false;
      let textUnderlineUpdateValid = false;
      if (hasNetColorUpdate) {
        const rawNetColor = updates.netColor;
        if (rawNetColor === null || rawNetColor === undefined || String(rawNetColor).trim() === "") {
          nextNetColor = null;
          netColorUpdateValid = true;
        } else {
          const normalized = normalizeNetColorValue(rawNetColor);
          if (normalized) {
            nextNetColor = normalized;
            netColorUpdateValid = true;
          }
        }
      }
      if (hasTextOnlyUpdate) {
        const rawTextOnly = updates.textOnly;
        if (rawTextOnly === null || rawTextOnly === undefined) {
          nextTextOnly = false;
          textOnlyUpdateValid = true;
        } else if (typeof rawTextOnly === "boolean") {
          nextTextOnly = rawTextOnly;
          textOnlyUpdateValid = true;
        }
      }
      if (hasTextFontUpdate) {
        const rawTextFont = updates.textFont;
        if (rawTextFont === null || rawTextFont === undefined || String(rawTextFont).trim() === "") {
          nextTextFont = DEFAULT_TEXT_FONT;
          textFontUpdateValid = true;
        } else {
          nextTextFont = normalizeTextFontValue(rawTextFont);
          textFontUpdateValid = true;
        }
      }
      if (hasTextSizeUpdate) {
        const rawTextSize = updates.textSize;
        if (rawTextSize === null || rawTextSize === undefined || String(rawTextSize).trim?.() === "") {
          nextTextSize = DEFAULT_TEXT_SIZE;
          textSizeUpdateValid = true;
        } else {
          nextTextSize = normalizeTextSizeValue(rawTextSize);
          textSizeUpdateValid = true;
        }
      }
      if (hasTextBoldUpdate) {
        const rawTextBold = updates.textBold;
        if (rawTextBold === null || rawTextBold === undefined) {
          nextTextBold = false;
          textBoldUpdateValid = true;
        } else if (typeof rawTextBold === "boolean") {
          nextTextBold = rawTextBold;
          textBoldUpdateValid = true;
        }
      }
      if (hasTextItalicUpdate) {
        const rawTextItalic = updates.textItalic;
        if (rawTextItalic === null || rawTextItalic === undefined) {
          nextTextItalic = false;
          textItalicUpdateValid = true;
        } else if (typeof rawTextItalic === "boolean") {
          nextTextItalic = rawTextItalic;
          textItalicUpdateValid = true;
        }
      }
      if (hasTextUnderlineUpdate) {
        const rawTextUnderline = updates.textUnderline;
        if (rawTextUnderline === null || rawTextUnderline === undefined) {
          nextTextUnderline = false;
          textUnderlineUpdateValid = true;
        } else if (typeof rawTextUnderline === "boolean") {
          nextTextUnderline = rawTextUnderline;
          textUnderlineUpdateValid = true;
        }
      }
      const idChanged = nextId !== null && nextId !== component.id;
      const valueChanged = nextValue !== null && nextValue !== String(component.value ?? "");
      const currentName = Object.prototype.hasOwnProperty.call(component, "name")
        ? String(component.name ?? "")
        : String(component.id ?? "");
      const nameChanged = nextName !== null && nextName !== currentName;
      const currentNetColor = Object.prototype.hasOwnProperty.call(component, "netColor")
        ? normalizeNetColorValue(component.netColor)
        : null;
      const netColorChanged = hasNetColorUpdate && netColorUpdateValid && nextNetColor !== currentNetColor;
      const currentTextOnly = component.textOnly === true;
      const textOnlyChanged = hasTextOnlyUpdate
        && textOnlyUpdateValid
        && componentType === "NET"
        && nextTextOnly !== currentTextOnly;
      const currentTextFont = normalizeTextFontValue(component?.textFont);
      const currentTextSize = normalizeTextSizeValue(component?.textSize);
      const currentTextBold = component?.textBold === true;
      const currentTextItalic = component?.textItalic === true;
      const currentTextUnderline = component?.textUnderline === true;
      const textFontChanged = isTextComponent
        && hasTextFontUpdate
        && textFontUpdateValid
        && nextTextFont !== currentTextFont;
      const textSizeChanged = isTextComponent
        && hasTextSizeUpdate
        && textSizeUpdateValid
        && nextTextSize !== currentTextSize;
      const textBoldChanged = isTextComponent
        && hasTextBoldUpdate
        && textBoldUpdateValid
        && nextTextBold !== currentTextBold;
      const textItalicChanged = isTextComponent
        && hasTextItalicUpdate
        && textItalicUpdateValid
        && nextTextItalic !== currentTextItalic;
      const textUnderlineChanged = isTextComponent
        && hasTextUnderlineUpdate
        && textUnderlineUpdateValid
        && nextTextUnderline !== currentTextUnderline;
      if (
        !idChanged
        && !typeChanged
        && !valueChanged
        && !nameChanged
        && !netColorChanged
        && !textOnlyChanged
        && !textFontChanged
        && !textSizeChanged
        && !textBoldChanged
        && !textItalicChanged
        && !textUnderlineChanged
      ) {
        return;
      }
      commitModelMutation(() => {
        if (idChanged) {
          const oldId = component.id;
          component.id = nextId;
          syncCounters(component);
          state.selectionIds = state.selectionIds.map((entry) => (entry === oldId ? component.id : entry));
        }
        if (typeChanged) {
          component.type = nextType;
        }
        if (nameChanged) {
          component.name = nextName;
        }
        if (valueChanged) {
          component.value = nextValue;
        }
        if (netColorChanged) {
          const targetIds = String(component.type ?? "").toUpperCase() === "NET"
            ? getEquivalentNamedNodeIds(component.id)
            : [String(component.id ?? "")];
          targetIds.forEach((targetId) => {
            const targetComponent = getComponent(targetId);
            if (!targetComponent) {
              return;
            }
            if (nextNetColor) {
              targetComponent.netColor = nextNetColor;
            } else if (Object.prototype.hasOwnProperty.call(targetComponent, "netColor")) {
              delete targetComponent.netColor;
            }
          });
        }
        if (textOnlyChanged) {
          if (nextTextOnly) {
            component.textOnly = true;
          } else if (Object.prototype.hasOwnProperty.call(component, "textOnly")) {
            delete component.textOnly;
          }
        }
        if (textFontChanged) {
          component.textFont = nextTextFont;
        }
        if (textSizeChanged) {
          component.textSize = nextTextSize;
        }
        if (textBoldChanged) {
          if (nextTextBold) {
            component.textBold = true;
          } else if (Object.prototype.hasOwnProperty.call(component, "textBold")) {
            delete component.textBold;
          }
        }
        if (textItalicChanged) {
          if (nextTextItalic) {
            component.textItalic = true;
          } else if (Object.prototype.hasOwnProperty.call(component, "textItalic")) {
            delete component.textItalic;
          }
        }
        if (textUnderlineChanged) {
          if (nextTextUnderline) {
            component.textUnderline = true;
          } else if (Object.prototype.hasOwnProperty.call(component, "textUnderline")) {
            delete component.textUnderline;
          }
        }
      }, { notifySelection: true });
    };

    const rotateSelection = (direction) => {
      const ids = state.selectionIds.slice();
      if (!ids.length) {
        return;
      }
      const clockwise = direction !== "ccw";
      const delta = clockwise ? 90 : -90;
      const rotatableIds = ids.filter((id) => String(getComponent(id)?.type ?? "").toUpperCase() !== "PD");
      const pdIds = ids.filter((id) => String(getComponent(id)?.type ?? "").toUpperCase() === "PD");
      const hasPdEndpointRotation = pdIds.some((id) => getProbeDiffSelectedPinIds(id).size > 0);
      if (!rotatableIds.length && !hasPdEndpointRotation) {
        return;
      }
      recordHistory();
      rotatableIds.forEach((id) => {
        const component = getComponent(id);
        const pins = component?.pins ?? [];
        if (!pins.length) {
          return;
        }
        if (pins.length === 1) {
          const current = Number(component.rotation ?? 0);
          component.rotation = normalizeRotation((Number.isFinite(current) ? current : 0) + delta);
        }
        const center = pins.reduce(
          (acc, pin) => ({ x: acc.x + pin.x, y: acc.y + pin.y }),
          { x: 0, y: 0 }
        );
        const cx = center.x / pins.length;
        const cy = center.y / pins.length;
        pins.forEach((pin) => {
          const dx = pin.x - cx;
          const dy = pin.y - cy;
          const rotated = clockwise
            ? { x: cx - dy, y: cy + dx }
            : { x: cx + dy, y: cy - dx };
          pin.x = rotated.x;
          pin.y = rotated.y;
          if (state.grid.snap && state.grid.size > 0) {
            pin.x = Math.round(pin.x / state.grid.size) * state.grid.size;
            pin.y = Math.round(pin.y / state.grid.size) * state.grid.size;
          }
        });
      });
      pdIds.forEach((id) => {
        const component = getComponent(id);
        if (!component) {
          return;
        }
        const selectedPinIds = Array.from(getProbeDiffSelectedPinIds(id));
        if (!selectedPinIds.length) {
          return;
        }
        const existing = component.probeDiffRotations && typeof component.probeDiffRotations === "object"
          ? component.probeDiffRotations
          : {};
        const baseRotation = snapRotation(Number(component.rotation ?? 0));
        const nextRotations = {
          "P+": Number.isFinite(Number(existing["P+"])) ? snapRotation(Number(existing["P+"])) : baseRotation,
          "P-": Number.isFinite(Number(existing["P-"])) ? snapRotation(Number(existing["P-"])) : baseRotation
        };
        selectedPinIds.forEach((pinId) => {
          nextRotations[pinId] = normalizeRotation(nextRotations[pinId] + delta);
        });
        component.probeDiffRotations = nextRotations;
      });
      attachPinsToWires(rotatableIds);
      render();
      notifySelection();
      notifyModelChange();
    };

    const rotatePlacement = (direction) => {
      if (state.tool.mode !== "place") {
        return;
      }
      const op = direction === "ccw" ? ROTATE_CCW : ROTATE_CW;
      state.placeTransform = multiplyTransform(op, state.placeTransform);
      if (state.preview || state.selectionPlacement) {
        renderOverlay();
      }
    };

    const flipSelection = (axis) => {
      const normalizedAxis = axis === "v" ? "v" : "h";
      const ids = state.selectionIds.slice();
      const selectedWireIds = Array.from(
        new Set([state.wireSelection, ...(state.wireSelections ?? [])].filter(Boolean).map((id) => String(id)))
      );
      if (!ids.length && !selectedWireIds.length) {
        return;
      }
      const isGroupFlip = selectedWireIds.length > 0 || ids.length > 1;
      if (isGroupFlip) {
        const componentIds = ids.filter((id) => Boolean(getComponent(id)));
        const wireIds = selectedWireIds.filter((id) => Boolean(getWire(id)));
        const points = [];
        componentIds.forEach((id) => {
          const component = getComponent(id);
          (component?.pins ?? []).forEach((pin) => {
            if (Number.isFinite(pin.x) && Number.isFinite(pin.y)) {
              points.push({ x: pin.x, y: pin.y });
            }
          });
        });
        wireIds.forEach((wireId) => {
          const wire = getWire(wireId);
          (wire?.points ?? []).forEach((point) => {
            if (Number.isFinite(point.x) && Number.isFinite(point.y)) {
              points.push({ x: point.x, y: point.y });
            }
          });
        });
        if (!points.length) {
          return;
        }
        const minX = Math.min(...points.map((point) => point.x));
        const maxX = Math.max(...points.map((point) => point.x));
        const minY = Math.min(...points.map((point) => point.y));
        const maxY = Math.max(...points.map((point) => point.y));
        const axisValue = normalizedAxis === "v"
          ? (minY + maxY) / 2
          : (minX + maxX) / 2;
        const pinSnapshots = capturePinSnapshots(componentIds);
        recordHistory();
        componentIds.forEach((id) => {
          const component = getComponent(id);
          const pins = component?.pins ?? [];
          if (!pins.length) {
            return;
          }
          const type = String(component?.type ?? "").toUpperCase();
          if (type === "PD") {
            const existing = component.probeDiffRotations && typeof component.probeDiffRotations === "object"
              ? component.probeDiffRotations
              : {};
            const baseRotation = snapRotation(Number(component.rotation ?? 0));
            const nextRotations = {
              "P+": Number.isFinite(Number(existing["P+"])) ? snapRotation(Number(existing["P+"])) : baseRotation,
              "P-": Number.isFinite(Number(existing["P-"])) ? snapRotation(Number(existing["P-"])) : baseRotation
            };
            nextRotations["P+"] = getProbeFlippedRotation(nextRotations["P+"], normalizedAxis);
            nextRotations["P-"] = getProbeFlippedRotation(nextRotations["P-"], normalizedAxis);
            component.probeDiffRotations = nextRotations;
          } else {
            if (pins.length === 1) {
              const current = Number(component.rotation ?? 0);
              const base = Number.isFinite(current) ? current : 0;
              if (isProbeComponentType(type)) {
                component.rotation = getProbeFlippedRotation(base, normalizedAxis);
              } else if (type === "GND") {
                component.rotation = getGroundFlippedRotation(base, normalizedAxis);
              } else {
                component.rotation = normalizeRotation(base + 180);
              }
            }
            if (pins.length > 1 && component?.type !== "GND") {
              const current = Number(component.labelRotation ?? 0);
              const base = Number.isFinite(current) ? current : 0;
              component.labelRotation = normalizeRotation(base + 180);
            }
          }
          pins.forEach((pin) => {
            if (normalizedAxis === "v") {
              pin.y = 2 * axisValue - pin.y;
            } else {
              pin.x = 2 * axisValue - pin.x;
            }
            if (state.grid.snap && state.grid.size > 0) {
              pin.x = Math.round(pin.x / state.grid.size) * state.grid.size;
              pin.y = Math.round(pin.y / state.grid.size) * state.grid.size;
            }
          });
        });
        wireIds.forEach((wireId) => {
          const wire = getWire(wireId);
          const wirePoints = Array.isArray(wire?.points) ? wire.points : [];
          wirePoints.forEach((point) => {
            if (normalizedAxis === "v") {
              point.y = 2 * axisValue - point.y;
            } else {
              point.x = 2 * axisValue - point.x;
            }
            if (state.grid.snap && state.grid.size > 0) {
              point.x = Math.round(point.x / state.grid.size) * state.grid.size;
              point.y = Math.round(point.y / state.grid.size) * state.grid.size;
            }
          });
        });
        const moveMap = buildMoveMapFromOrigins(componentIds, pinSnapshots);
        const excludeIds = new Set(componentIds.map((entry) => String(entry)));
        const selectedWireIdSet = new Set(wireIds.map((id) => String(id)));
        const connectedWireIds = componentIds.length
          ? getWireIdsConnectedToComponents(componentIds)
          : new Set();
        let movedWires = false;
        if (moveMap.size) {
          if (selectedWireIdSet.size) {
            const boundaryWireIds = new Set();
            connectedWireIds.forEach((wireId) => {
              const normalizedWireId = String(wireId);
              if (!selectedWireIdSet.has(normalizedWireId)) {
                boundaryWireIds.add(normalizedWireId);
              }
            });
            movedWires = updateWiresFromMoveMap(moveMap, { normalize: false, wireIds: boundaryWireIds });
          } else {
            movedWires = updateWiresFromMoveMap(moveMap, { normalize: false, excludeIds });
          }
        }
        let attached = false;
        let shortsRemoved = false;
        if (componentIds.length) {
          if (selectedWireIdSet.size) {
            const touchedWireIds = new Set(selectedWireIdSet);
            connectedWireIds.forEach((wireId) => touchedWireIds.add(String(wireId)));
            attached = attachPinsToWires(componentIds, { normalize: false, wireIds: touchedWireIds });
          } else {
            attached = attachPinsToWires(componentIds, { normalize: false });
          }
          shortsRemoved = removeComponentShorts(componentIds);
        }
        if (selectedWireIdSet.size) {
          const touchedWireIds = new Set(selectedWireIdSet);
          connectedWireIds.forEach((wireId) => touchedWireIds.add(String(wireId)));
          snapWirePoints(touchedWireIds);
        } else if (movedWires || attached || shortsRemoved) {
          normalizeAllWiresExcluding(excludeIds);
        }
        render();
        notifySelection();
        notifyModelChange();
        return;
      }
      const flippableIds = ids.filter((id) => String(getComponent(id)?.type ?? "").toUpperCase() !== "PD");
      const pdIds = ids.filter((id) => String(getComponent(id)?.type ?? "").toUpperCase() === "PD");
      const hasPdEndpointFlip = pdIds.some((id) => getProbeDiffSelectedPinIds(id).size > 0);
      if (!flippableIds.length && !hasPdEndpointFlip) {
        return;
      }
      const pinSnapshots = capturePinSnapshots(flippableIds);
      recordHistory();
      flippableIds.forEach((id) => {
        const component = getComponent(id);
        const pins = component?.pins ?? [];
        const type = String(component?.type ?? "").toUpperCase();
        if (!pins.length) {
          return;
        }
        if (pins.length === 1) {
          const current = Number(component.rotation ?? 0);
          const base = Number.isFinite(current) ? current : 0;
          if (isProbeComponentType(type)) {
            component.rotation = getProbeFlippedRotation(base, normalizedAxis);
          } else if (type === "GND") {
            component.rotation = getGroundFlippedRotation(base, normalizedAxis);
          } else {
            component.rotation = normalizeRotation(base + 180);
          }
        }
        if (pins.length > 1 && component?.type !== "GND") {
          const current = Number(component.labelRotation ?? 0);
          const base = Number.isFinite(current) ? current : 0;
          component.labelRotation = normalizeRotation(base + 180);
        }
        const center = pins.reduce(
          (acc, pin) => ({ x: acc.x + pin.x, y: acc.y + pin.y }),
          { x: 0, y: 0 }
        );
        const cx = center.x / pins.length;
        const cy = center.y / pins.length;
        pins.forEach((pin) => {
          if (normalizedAxis === "v") {
            pin.y = 2 * cy - pin.y;
          } else {
            pin.x = 2 * cx - pin.x;
          }
          if (state.grid.snap && state.grid.size > 0) {
            pin.x = Math.round(pin.x / state.grid.size) * state.grid.size;
            pin.y = Math.round(pin.y / state.grid.size) * state.grid.size;
          }
        });
      });
      pdIds.forEach((id) => {
        const component = getComponent(id);
        if (!component) {
          return;
        }
        const selectedPinIds = Array.from(getProbeDiffSelectedPinIds(id));
        if (!selectedPinIds.length) {
          return;
        }
        const existing = component.probeDiffRotations && typeof component.probeDiffRotations === "object"
          ? component.probeDiffRotations
          : {};
        const baseRotation = snapRotation(Number(component.rotation ?? 0));
        const nextRotations = {
          "P+": Number.isFinite(Number(existing["P+"])) ? snapRotation(Number(existing["P+"])) : baseRotation,
          "P-": Number.isFinite(Number(existing["P-"])) ? snapRotation(Number(existing["P-"])) : baseRotation
        };
        selectedPinIds.forEach((pinId) => {
          nextRotations[pinId] = getProbeFlippedRotation(nextRotations[pinId], normalizedAxis);
        });
        component.probeDiffRotations = nextRotations;
      });
      const moveMap = buildMoveMapFromOrigins(flippableIds, pinSnapshots);
      const excludeIds = new Set(flippableIds.map((entry) => String(entry)));
      updateWiresFromMoveMap(moveMap, { normalize: false, excludeIds });
      const attached = attachPinsToWires(flippableIds, { normalize: false });
      const shortsRemoved = removeComponentShorts(flippableIds);
      if (attached || shortsRemoved) {
        normalizeAllWiresExcluding(excludeIds);
      }
      render();
      notifySelection();
      notifyModelChange();
    };

    const flipPlacement = (axis) => {
      if (state.tool.mode !== "place") {
        return;
      }
      const op = axis === "v" ? FLIP_V : FLIP_H;
      state.placeTransform = multiplyTransform(op, state.placeTransform);
      if (state.preview || state.selectionPlacement) {
        renderOverlay();
      }
    };

    const deleteSelection = () => {
      const ids = state.selectionIds.slice();
      const wireIds = new Set(
        [state.wireSelection, ...(state.wireSelections ?? [])].filter(Boolean).map(String)
      );
      if (!ids.length && !wireIds.size) {
        return;
      }
      commitModelMutation(() => {
        const wireCountBefore = (state.model?.wires ?? []).length;
        const deleteSet = new Set(ids);
        const deletePins = new Set();
        if (deleteSet.size) {
          (state.model?.components ?? []).forEach((component) => {
            if (!deleteSet.has(component.id)) {
              return;
            }
            const componentType = String(component?.type ?? "").toUpperCase();
            if (componentType === "NET" || isProbeComponentType(componentType)) {
              return;
            }
            (component.pins ?? []).forEach((pin) => {
              deletePins.add(`${pin.x},${pin.y}`);
            });
          });
          const remaining = (state.model?.components ?? []).filter((component) => !deleteSet.has(component.id));
          state.model.components.length = 0;
          remaining.forEach((component) => state.model.components.push(component));
        }
        let wires = (state.model?.wires ?? []).filter((wire) => {
          const points = Array.isArray(wire.points) ? wire.points : [];
          if (deletePins.size && points.some((point) => deletePins.has(`${point.x},${point.y}`))) {
            return false;
          }
          if (wireIds.size && wireIds.has(String(wire.id))) {
            return false;
          }
          return true;
        });
        if (wireIds.size && !deletePins.size) {
          wires = wires.filter((wire) => !wireIds.has(String(wire.id)));
        }
        state.model.wires.length = 0;
        wires.forEach((wire) => state.model.wires.push(wire));
        simplifyAllWires();
        svg._lastDeleteSelection = {
          wireId: wireIds.size ? Array.from(wireIds).join(",") : null,
          before: wireCountBefore,
          after: (state.model?.wires ?? []).length
        };
        setSelection([]);
      });
    };

    const duplicateWireIds = (wireIdList, offset) => {
      if (!Array.isArray(wireIdList) || !wireIdList.length) {
        return [];
      }
      const newWireIds = [];
      const unique = new Set(wireIdList.filter(Boolean).map(String));
      unique.forEach((wireId) => {
        const wire = getWire(wireId);
        if (!wire) {
          return;
        }
        const points = (wire.points ?? []).map((point) => ({
          x: point.x + offset,
          y: point.y + offset
        }));
        const normalized = addWireInternal({ points });
        if (!normalized) {
          return;
        }
        newWireIds.push(normalized.id);
      });
      return newWireIds;
    };

    const duplicateSelection = (options) => {
      const ids = state.selectionIds.slice();
      const wireSource = Array.isArray(options?.wireIds)
        ? options.wireIds
        : [state.wireSelection, ...(state.wireSelections ?? [])];
      const wireIds = new Set(
        wireSource.filter(Boolean).map(String)
      );
      if (!ids.length && !wireIds.size) {
        return null;
      }
      return commitModelMutation(() => {
        const offset = Number.isFinite(options?.offset)
          ? options.offset
          : (state.grid.size > 0 ? state.grid.size : 20);
        const newIds = [];
        ids.forEach((id) => {
          const component = getComponent(id);
          if (!component || typeof api.addComponent !== "function") {
            return;
          }
          const newId = nextRefDes(component.type);
          const newPins = (component.pins ?? []).map((pin) => ({
            id: pin.id,
            name: pin.name,
            x: pin.x + offset,
            y: pin.y + offset
          }));
          const clone = {
            id: newId,
            name: Object.prototype.hasOwnProperty.call(component, "name")
              ? String(component.name ?? "")
              : String(component.id ?? ""),
            type: component.type,
            value: component.value ?? "",
            ...(Object.prototype.hasOwnProperty.call(component, "netColor")
              ? { netColor: component.netColor ?? "" }
              : {}),
            ...(Object.prototype.hasOwnProperty.call(component, "textOnly")
              ? { textOnly: component.textOnly === true }
              : {}),
            ...(Object.prototype.hasOwnProperty.call(component, "textFont")
              ? { textFont: String(component.textFont ?? "") }
              : {}),
            ...(Object.prototype.hasOwnProperty.call(component, "textSize")
              ? { textSize: Number(component.textSize) }
              : {}),
            ...(Object.prototype.hasOwnProperty.call(component, "textBold")
              ? { textBold: component.textBold === true }
              : {}),
            ...(Object.prototype.hasOwnProperty.call(component, "textItalic")
              ? { textItalic: component.textItalic === true }
              : {}),
            ...(Object.prototype.hasOwnProperty.call(component, "textUnderline")
              ? { textUnderline: component.textUnderline === true }
              : {}),
            ...(Object.prototype.hasOwnProperty.call(component, "probeDiffRotations")
              ? {
                probeDiffRotations: {
                  "P+": Number(component?.probeDiffRotations?.["P+"]),
                  "P-": Number(component?.probeDiffRotations?.["P-"])
                }
              }
              : {}),
            pins: newPins,
            rotation: component.rotation,
            labelRotation: component.labelRotation
          };
          const normalized = api.addComponent(state.model, clone);
          syncCounters(normalized);
          newIds.push(normalized.id);
        });
        const newWireIds = duplicateWireIds(Array.from(wireIds), offset);
        setSelectionWithWires(newIds, newWireIds);
        return { componentIds: newIds.slice(), wireIds: newWireIds.slice() };
      }, { notifySelection: true });
    };

    const isSelectionPlacementToolType = (toolType) =>
      String(toolType ?? "").toUpperCase() === SELECTION_PLACEMENT_TOOL;

    const setTool = (tool) => {
      const previousPlaceType = state.tool?.mode === "place" ? state.tool.type : null;
      if (tool === "select" || tool === "wire") {
        state.tool = { mode: tool };
      } else if (typeof tool === "string") {
        state.tool = { mode: "place", type: tool };
      } else if (tool && tool.mode) {
        state.tool = tool;
      }
      if (state.tool.mode === "place") {
        if (state.tool.type !== previousPlaceType) {
          state.placeTransform = { ...IDENTITY_TRANSFORM };
        }
      } else {
        state.placeTransform = { ...IDENTITY_TRANSFORM };
      }
      if (state.tool.mode !== "wire") {
        state.wireStart = null;
        state.wirePreview = null;
      }
      if (!(state.tool.mode === "place" && isSelectionPlacementToolType(state.tool.type))) {
        state.selectionPlacement = null;
      }
      if (!(state.tool.mode === "place" && state.tool.type === "PV")) {
        state.probeDiffStart = null;
        state.probeDiffPreview = null;
      }
      if (state.tool.mode !== "select") {
        clearProbeDiffEndpointSelection();
        state.probeDiffEndpointDrag = null;
      }
      if (state.tool.mode !== "place") {
        clearPreview();
      }
      state.lastSelectClick = null;
      renderOverlay();
    };

    const setGrid = (settings) => {
      if (!settings) {
        return;
      }
      if (Number.isFinite(settings.size) && settings.size > 0) {
        state.grid.size = settings.size;
      }
      if (typeof settings.snap === "boolean") {
        state.grid.snap = settings.snap;
      }
      if (typeof settings.visible === "boolean") {
        state.grid.visible = settings.visible;
      }
      render();
    };

    const setMeasurements = (next) => {
      if (!next) {
        state.measurements = new Map();
        render();
        return;
      }
      if (next instanceof Map) {
        state.measurements = new Map(next);
      } else if (typeof next === "object") {
        state.measurements = new Map(Object.entries(next));
      }
      render();
    };

    const setProbeLabels = (next) => {
      if (!next) {
        state.probeLabels = new Map();
        render();
        return;
      }
      if (next instanceof Map) {
        state.probeLabels = new Map(next);
      } else if (typeof next === "object") {
        state.probeLabels = new Map(Object.entries(next));
      }
      render();
    };

    const setExternalHighlights = (next) => {
      const normalizeIdSet = (value) => {
        if (!Array.isArray(value)) {
          return new Set();
        }
        return new Set(
          value
            .map((entry) => String(entry ?? "").trim())
            .filter(Boolean)
        );
      };
      const normalizeColor = (value) => {
        const text = String(value ?? "").trim().toLowerCase();
        return text || DEFAULT_EXTERNAL_HIGHLIGHT_COLOR;
      };
      const normalizeMode = (value) => {
        const mode = String(value ?? "").trim().toLowerCase();
        return mode === "hover" ? "hover" : "selection";
      };
      const hasSameEntries = (a, b) => {
        if (a.size !== b.size) {
          return false;
        }
        for (const entry of a) {
          if (!b.has(entry)) {
            return false;
          }
        }
        return true;
      };
      const normalizeHighlightEntries = (value) => {
        if (!Array.isArray(value)) {
          return [];
        }
        const deduped = new Map();
        value.forEach((entry) => {
          if (!entry || typeof entry !== "object") {
            return;
          }
          const componentIds = normalizeIdSet(entry.componentIds);
          const wireIds = normalizeIdSet(entry.wireIds);
          if (!componentIds.size && !wireIds.size) {
            return;
          }
          const color = normalizeColor(entry.color);
          const mode = normalizeMode(entry.mode);
          const componentKey = Array.from(componentIds).sort().join(",");
          const wireKey = Array.from(wireIds).sort().join(",");
          const key = `${mode}|${color}|${componentKey}|${wireKey}`;
          if (deduped.has(key)) {
            return;
          }
          deduped.set(key, { componentIds, wireIds, color, mode });
        });
        return Array.from(deduped.entries())
          .sort((a, b) => a[0].localeCompare(b[0]))
          .map((entry) => entry[1]);
      };
      const hasSameHighlightEntryList = (a, b) => {
        if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) {
          return false;
        }
        for (let index = 0; index < a.length; index += 1) {
          const left = a[index];
          const right = b[index];
          if (!left || !right) {
            return false;
          }
          if (normalizeColor(left.color) !== normalizeColor(right.color)) {
            return false;
          }
          if (normalizeMode(left.mode) !== normalizeMode(right.mode)) {
            return false;
          }
          if (!hasSameEntries(left.componentIds, right.componentIds)) {
            return false;
          }
          if (!hasSameEntries(left.wireIds, right.wireIds)) {
            return false;
          }
        }
        return true;
      };
      const nextComponents = next && typeof next === "object"
        ? normalizeIdSet(next.componentIds)
        : new Set();
      const nextWires = next && typeof next === "object"
        ? normalizeIdSet(next.wireIds)
        : new Set();
      const nextColor = next && typeof next === "object"
        ? normalizeColor(next.color)
        : DEFAULT_EXTERNAL_HIGHLIGHT_COLOR;
      const nextEntries = next && typeof next === "object"
        ? normalizeHighlightEntries(next.entries)
        : [];
      if (hasSameEntries(state.externalHighlightComponentIds, nextComponents)
        && hasSameEntries(state.externalHighlightWireIds, nextWires)
        && normalizeColor(state.externalHighlightColor) === nextColor
        && hasSameHighlightEntryList(state.externalHighlightEntries, nextEntries)) {
        return;
      }
      state.externalHighlightComponentIds = nextComponents;
      state.externalHighlightWireIds = nextWires;
      state.externalHighlightColor = nextColor;
      state.externalHighlightEntries = nextEntries;
      renderOverlay();
    };

    const getGrid = () => ({ ...state.grid });

    const addComponent = (spec) => {
      if (!spec) {
        return null;
      }
      const transform = spec.transform ?? null;
      let component = spec;
      if (!Array.isArray(spec.pins) || !spec.pins.length) {
        const type = spec.type;
        const id = spec.id || nextRefDes(type);
        const baseX = Number.isFinite(spec.x) ? spec.x : state.view.x + state.view.width / 2;
        const baseY = Number.isFinite(spec.y) ? spec.y : state.view.y + state.view.height / 2;
        const snappedX = state.grid.snap ? Math.round(baseX / state.grid.size) * state.grid.size : baseX;
        const snappedY = state.grid.snap ? Math.round(baseY / state.grid.size) * state.grid.size : baseY;
        if (typeof api.createComponentFromSymbol === "function") {
          component = api.createComponentFromSymbol(type, id, spec.value, snappedX, snappedY);
        }
      }
      if (component && !String(component.id ?? "").trim()) {
        component = {
          ...component,
          id: nextRefDes(component.type)
        };
      }
      if (component && Object.prototype.hasOwnProperty.call(spec, "name")) {
        component.name = String(spec.name ?? "");
      }
      if (component && Object.prototype.hasOwnProperty.call(spec, "value")) {
        component.value = String(spec.value ?? "");
      }
      if (component && transform && !isIdentityTransform(transform)) {
        const cloned = {
          id: component.id,
          name: Object.prototype.hasOwnProperty.call(component, "name")
            ? String(component.name ?? "")
            : String(component.id ?? ""),
          type: component.type,
          value: component.value ?? "",
          ...(Object.prototype.hasOwnProperty.call(component, "netColor")
            ? { netColor: component.netColor ?? "" }
            : {}),
          ...(Object.prototype.hasOwnProperty.call(component, "textOnly")
            ? { textOnly: component.textOnly === true }
            : {}),
          ...(Object.prototype.hasOwnProperty.call(component, "textFont")
            ? { textFont: String(component.textFont ?? "") }
            : {}),
          ...(Object.prototype.hasOwnProperty.call(component, "textSize")
            ? { textSize: Number(component.textSize) }
            : {}),
          ...(Object.prototype.hasOwnProperty.call(component, "textBold")
            ? { textBold: component.textBold === true }
            : {}),
          ...(Object.prototype.hasOwnProperty.call(component, "textItalic")
            ? { textItalic: component.textItalic === true }
            : {}),
          ...(Object.prototype.hasOwnProperty.call(component, "textUnderline")
            ? { textUnderline: component.textUnderline === true }
            : {}),
          ...(Object.prototype.hasOwnProperty.call(component, "probeDiffRotations")
            ? {
              probeDiffRotations: {
                "P+": Number(component?.probeDiffRotations?.["P+"]),
                "P-": Number(component?.probeDiffRotations?.["P-"])
              }
            }
            : {}),
          pins: (component.pins ?? []).map((pin) => ({
            id: pin.id,
            name: pin.name,
            x: pin.x,
            y: pin.y
          }))
        };
        component = applyTransformToComponent(cloned, transform, true);
      }
      if (!component || typeof api.addComponent !== "function") {
        return null;
      }
      return commitModelMutation(() => {
        const normalized = api.addComponent(state.model, component);
        syncCounters(normalized);
        const excludeIds = new Set([normalized.id]);
        const attached = attachPinsToWires([normalized.id], { excludeIds, normalize: false });
        const shortsRemoved = removeComponentShorts([normalized.id]);
        if (attached || shortsRemoved) {
          normalizeAllWiresExcluding(excludeIds);
        }
        return normalized;
      });
    };

    const prepareWire = (wire, options) => {
      if (!wire) {
        return null;
      }
      const points = Array.isArray(wire.points) ? wire.points : [];
      const preserveStart = options?.preserveEndpoints?.start === true;
      const preserveEnd = options?.preserveEndpoints?.end === true;
      const snappedPoints = points.map((point, index) => {
        const preservePoint = (preserveStart && index === 0)
          || (preserveEnd && index === points.length - 1);
        if (preservePoint) {
          return { x: point.x, y: point.y };
        }
        if (!state.grid.snap || state.grid.size <= 0) {
          return { x: point.x, y: point.y };
        }
        return {
          x: Math.round(point.x / state.grid.size) * state.grid.size,
          y: Math.round(point.y / state.grid.size) * state.grid.size
        };
      });
      if (preserveStart && snappedPoints.length > 1 && points[0] && points[1]) {
        const start = points[0];
        const originalNext = points[1];
        if (Math.abs(originalNext.x - start.x) < 0.001) {
          snappedPoints[1].x = start.x;
        } else if (Math.abs(originalNext.y - start.y) < 0.001) {
          snappedPoints[1].y = start.y;
        }
      }
      if (preserveEnd && snappedPoints.length > 1) {
        const lastIndex = snappedPoints.length - 1;
        const end = points[lastIndex];
        const originalPrev = points[lastIndex - 1];
        if (end && originalPrev) {
          if (Math.abs(originalPrev.x - end.x) < 0.001) {
            snappedPoints[lastIndex - 1].x = end.x;
          } else if (Math.abs(originalPrev.y - end.y) < 0.001) {
            snappedPoints[lastIndex - 1].y = end.y;
          }
        }
      }
      const prepared = {
        id: wire.id || nextWireId(),
        points: snappedPoints.map((point) => ({ x: point.x, y: point.y }))
      };
      normalizeWirePoints(prepared, {
        snap: options?.snap !== false,
        snapMode: options?.snapMode,
        obstacles: options?.obstacles
      });
      return prepared;
    };

    const addWire = (wire, options) => {
      if (!wire || typeof api.addWire !== "function") {
        return null;
      }
      const prepared = prepareWire(wire, options);
      if (!prepared) {
        return null;
      }
      return commitModelMutation(() => {
        const normalized = api.addWire(state.model, prepared);
        syncWireCount(normalized);
        normalizeAllWires({ snapMode: options?.snapMode });
        return normalized;
      });
    };

    const addWireInternal = (wire, options) => {
      if (!wire || typeof api.addWire !== "function") {
        return null;
      }
      const prepared = prepareWire(wire, options);
      if (!prepared) {
        return null;
      }
      const normalized = api.addWire(state.model, prepared);
      syncWireCount(normalized);
      return normalized;
    };

    const hitTestComponent = (point, options) => {
      const components = Array.isArray(state.model?.components) ? state.model.components : [];
      const preferIds = Array.isArray(options?.preferIds) && options.preferIds.length
        ? new Set(options.preferIds.map((id) => String(id)))
        : null;
      const pickBest = (filter) => {
        let best = null;
        let bestDist = Infinity;
        components.forEach((component) => {
          if (filter && !filter(component)) {
            return;
          }
          const bounds = getComponentBounds(component, 10, state.probeLabels);
          if (!bounds) {
            return;
          }
          if (point.x < bounds.minX || point.x > bounds.maxX || point.y < bounds.minY || point.y > bounds.maxY) {
            return;
          }
          const cx = (bounds.minX + bounds.maxX) / 2;
          const cy = (bounds.minY + bounds.maxY) / 2;
          const dx = point.x - cx;
          const dy = point.y - cy;
          const dist = dx * dx + dy * dy;
          if (dist < bestDist) {
            bestDist = dist;
            best = component;
          }
        });
        return best;
      };
      if (preferIds) {
        const preferred = pickBest((component) => preferIds.has(String(component?.id ?? "")));
        if (preferred) {
          return preferred;
        }
      }
      return pickBest(null);
    };

    const hitTestDifferentialProbeEndpoint = (point, options) => {
      if (!point) {
        return null;
      }
      const components = Array.isArray(state.model?.components) ? state.model.components : [];
      const preferIds = Array.isArray(options?.preferIds) && options.preferIds.length
        ? new Set(options.preferIds.map((id) => String(id)))
        : null;
      const hitRadius = Math.max(PIN_HIT_RADIUS, 8);
      const hitRadiusSq = hitRadius * hitRadius;
      const pickBest = (filter) => {
        let best = null;
        let bestDist = Infinity;
        components.forEach((component) => {
          if (String(component?.type ?? "").toUpperCase() !== "PD") {
            return;
          }
          if (filter && !filter(component)) {
            return;
          }
          const geometry = getDifferentialProbeGeometry(component);
          if (!geometry) {
            return;
          }
          const checkHandle = (pinId, side, x, y) => {
            const dx = point.x - x;
            const dy = point.y - y;
            const dist = (dx * dx) + (dy * dy);
            if (dist > hitRadiusSq || dist >= bestDist) {
              return;
            }
            bestDist = dist;
            best = {
              component,
              pinId,
              side,
              point: { x, y }
            };
          };
          checkHandle("P+", "plus", geometry.posTip.x, geometry.posTip.y);
          checkHandle("P-", "minus", geometry.negTip.x, geometry.negTip.y);
          checkHandle("P+", "plus", geometry.pos.x, geometry.pos.y);
          checkHandle("P-", "minus", geometry.neg.x, geometry.neg.y);
        });
        return best;
      };
      if (preferIds) {
        const preferred = pickBest((component) => preferIds.has(String(component?.id ?? "")));
        if (preferred) {
          return preferred;
        }
      }
      return pickBest(null);
    };

    const hitTestNode = (point) => {
      const components = Array.isArray(state.model?.components) ? state.model.components : [];
      let best = null;
      let bestDist = Infinity;
      components.forEach((component) => {
        if (!isElectricalComponentType(component?.type)) {
          return;
        }
        (component.pins ?? []).forEach((pin) => {
          const dx = pin.x - point.x;
          const dy = pin.y - point.y;
          const dist = dx * dx + dy * dy;
          if (dist < bestDist && dist <= PIN_HIT_RADIUS * PIN_HIT_RADIUS) {
            bestDist = dist;
            best = { point: { x: pin.x, y: pin.y }, component, pin };
          }
        });
      });
      const wires = Array.isArray(state.model?.wires) ? state.model.wires : [];
      wires.forEach((wire) => {
        (wire.points ?? []).forEach((wirePoint) => {
          const dx = wirePoint.x - point.x;
          const dy = wirePoint.y - point.y;
          const dist = dx * dx + dy * dy;
          if (dist < bestDist && dist <= WIRE_HIT_RADIUS * WIRE_HIT_RADIUS) {
            bestDist = dist;
            best = { point: { x: wirePoint.x, y: wirePoint.y }, wire };
          }
        });
      });
      return best;
    };

    const hitTestWireSegment = (point) => {
      const wires = Array.isArray(state.model?.wires) ? state.model.wires : [];
      let best = null;
      let bestDist = Infinity;
      wires.forEach((wire) => {
        const points = Array.isArray(wire.points) ? wire.points : [];
        for (let index = 0; index < points.length - 1; index += 1) {
          const start = points[index];
          const end = points[index + 1];
          if (!start || !end) {
            continue;
          }
          const minX = Math.min(start.x, end.x);
          const maxX = Math.max(start.x, end.x);
          const minY = Math.min(start.y, end.y);
          const maxY = Math.max(start.y, end.y);
          let dist = Infinity;
          if (start.y === end.y) {
            if (point.x < minX - WIRE_HIT_RADIUS || point.x > maxX + WIRE_HIT_RADIUS) {
              continue;
            }
            dist = Math.abs(point.y - start.y);
          } else if (start.x === end.x) {
            if (point.y < minY - WIRE_HIT_RADIUS || point.y > maxY + WIRE_HIT_RADIUS) {
              continue;
            }
            dist = Math.abs(point.x - start.x);
          } else {
            continue;
          }
          if (dist <= WIRE_HIT_RADIUS && dist < bestDist) {
            bestDist = dist;
            best = {
              wire,
              segmentIndex: index,
              orientation: start.y === end.y ? "h" : "v"
            };
          }
        }
      });
      return best;
    };

    const isWireEndpoint = (wire, point) => {
      const points = Array.isArray(wire?.points) ? wire.points : [];
      if (!points.length || !point) {
        return false;
      }
      const start = points[0];
      const end = points[points.length - 1];
      return (start.x === point.x && start.y === point.y)
        || (end.x === point.x && end.y === point.y);
    };

    const getWireSegmentPoint = (wireHit, point) => {
      if (!wireHit || !point) {
        return null;
      }
      const wire = wireHit.wire;
      const points = Array.isArray(wire?.points) ? wire.points : [];
      const start = points[wireHit.segmentIndex];
      const end = points[wireHit.segmentIndex + 1];
      if (!start || !end) {
        return null;
      }
      const isOnCurrentGrid = (value) =>
        !state.grid.snap
        || state.grid.size <= 0
        || Math.abs(value - snapCoord(value)) < 0.001;
      const segmentOnGrid = isOnCurrentGrid(start.x)
        && isOnCurrentGrid(start.y)
        && isOnCurrentGrid(end.x)
        && isOnCurrentGrid(end.y);
      const sourcePoint = segmentOnGrid ? (snapPoint(point) ?? point) : point;
      let x = sourcePoint.x;
      let y = sourcePoint.y;
      if (wireHit.orientation === "h") {
        y = start.y;
        const minX = Math.min(start.x, end.x);
        const maxX = Math.max(start.x, end.x);
        x = Math.min(Math.max(x, minX), maxX);
      } else {
        x = start.x;
        const minY = Math.min(start.y, end.y);
        const maxY = Math.max(start.y, end.y);
        y = Math.min(Math.max(y, minY), maxY);
      }
      return { x, y, wire, segmentIndex: wireHit.segmentIndex };
    };

    const insertWirePoint = (wire, index, point) => {
      if (!wire || !Array.isArray(wire.points) || !point) {
        return null;
      }
      const existing = wire.points.find((entry) => entry.x === point.x && entry.y === point.y);
      if (existing) {
        return existing;
      }
      recordHistory();
      wire.points.splice(index, 0, { x: point.x, y: point.y });
      render();
      notifyModelChange();
      return wire.points[index];
    };

    const getProbeDiffPinById = (component, pinId) => {
      if (!component || String(component?.type ?? "").toUpperCase() !== "PD") {
        return null;
      }
      const normalizedId = String(pinId ?? "").trim().toUpperCase();
      return (component.pins ?? []).find((pin) => String(pin?.id ?? "").trim().toUpperCase() === normalizedId) ?? null;
    };

    const beginProbeDiffEndpointDrag = (component, pinId, options) => {
      const pin = getProbeDiffPinById(component, pinId);
      if (!component || !pin) {
        return;
      }
      const normalizedPrimaryPinId = normalizeProbeDiffPinId(pin.id);
      const startWorld = options?.startWorld;
      setHoverTarget(null);
      const selectionChanged = !state.selectionIds.includes(component.id);
      if (selectionChanged) {
        setSelection([component.id]);
      }
      const currentPinIds = getProbeDiffSelectedPinIds(component.id);
      const preserveExistingMultiSelection = options?.additive !== true
        && currentPinIds.size > 1
        && currentPinIds.has(normalizedPrimaryPinId);
      const endpointChanged = preserveExistingMultiSelection
        ? false
        : setProbeDiffEndpointSelection(component.id, pin.id, {
          additive: options?.additive === true
        });
      const selectedPinIds = Array.from(getProbeDiffSelectedPinIds(component.id));
      const pinIdsToMove = selectedPinIds.includes(normalizedPrimaryPinId)
        ? selectedPinIds
        : [normalizedPrimaryPinId];
      const hasStartWorld = startWorld
        && Number.isFinite(startWorld.x)
        && Number.isFinite(startWorld.y);
      const startPoint = hasStartWorld
        ? { x: Number(startWorld.x), y: Number(startWorld.y) }
        : { x: pin.x, y: pin.y };
      const pinOrigins = pinIdsToMove
        .map((entryPinId) => {
          const entryPin = getProbeDiffPinById(component, entryPinId);
          if (!entryPin) {
            return null;
          }
          return {
            pinId: entryPinId,
            x: entryPin.x,
            y: entryPin.y
          };
        })
        .filter(Boolean);
      if (!pinOrigins.length) {
        return;
      }
      state.probeDiffEndpointDrag = {
        componentId: String(component.id),
        pinId: normalizedPrimaryPinId,
        pinIds: pinIdsToMove.slice(),
        pinOrigins,
        collapseToPinOnClick: preserveExistingMultiSelection,
        start: startPoint,
        startClientX: Number.isFinite(options?.startClientX) ? options.startClientX : null,
        startClientY: Number.isFinite(options?.startClientY) ? options.startClientY : null,
        dragThresholdExceeded: false,
        moved: false,
        snapshot: cloneModel(state.model)
      };
      if (!selectionChanged && endpointChanged) {
        renderOverlay();
      }
    };

    const updateProbeDiffEndpointDrag = (point, event) => {
      if (!state.probeDiffEndpointDrag) {
        return;
      }
      const drag = state.probeDiffEndpointDrag;
      if (!drag.dragThresholdExceeded) {
        const hasClientStart = Number.isFinite(drag.startClientX) && Number.isFinite(drag.startClientY);
        if (hasClientStart && Number.isFinite(event?.clientX) && Number.isFinite(event?.clientY)) {
          const dxClient = event.clientX - drag.startClientX;
          const dyClient = event.clientY - drag.startClientY;
          if ((dxClient * dxClient) + (dyClient * dyClient) < DRAG_DEADZONE_PX * DRAG_DEADZONE_PX) {
            return;
          }
        }
        drag.dragThresholdExceeded = true;
      }
      const component = getComponent(drag.componentId);
      if (!component || !point) {
        return;
      }
      const dx = point.x - drag.start.x;
      const dy = point.y - drag.start.y;
      const moved = Math.abs(dx) > 0.0001 || Math.abs(dy) > 0.0001;
      if (moved) {
        drag.moved = true;
      }
      drag.pinOrigins.forEach((origin) => {
        const targetPin = getProbeDiffPinById(component, origin.pinId);
        if (!targetPin) {
          return;
        }
        targetPin.x = origin.x + dx;
        targetPin.y = origin.y + dy;
      });
      render();
    };

    const endProbeDiffEndpointDrag = (event) => {
      if (!state.probeDiffEndpointDrag) {
        return;
      }
      const drag = state.probeDiffEndpointDrag;
      const component = getComponent(drag.componentId);
      if (drag.moved && component) {
        (drag.pinIds ?? []).forEach((pinId) => {
          const pin = getProbeDiffPinById(component, pinId);
          if (!pin) {
            return;
          }
          const snappedToNode = resolveProbeNodePoint({ x: pin.x, y: pin.y });
          if (snappedToNode) {
            pin.x = snappedToNode.x;
            pin.y = snappedToNode.y;
            return;
          }
          if (state.grid.snap && state.grid.size > 0) {
            pin.x = snapCoord(pin.x);
            pin.y = snapCoord(pin.y);
          }
        });
        if (drag.snapshot) {
          state.history.undo.push(drag.snapshot);
          state.history.redo.length = 0;
        }
        render();
        notifyModelChange();
      } else {
        if (drag.collapseToPinOnClick) {
          setProbeDiffEndpointSelection(drag.componentId, drag.pinId);
        }
        if (
          state.tool.mode === "select"
          && !event?.altKey
          && !event?.shiftKey
          && !event?.ctrlKey
          && !event?.metaKey
          && isDoubleSelectClick(drag.componentId, event)
        ) {
          invokeComponentEdit(component);
        } else if (!event || event?.altKey || event?.shiftKey || event?.ctrlKey || event?.metaKey) {
          state.lastSelectClick = null;
        }
        renderOverlay();
      }
      if (drag.moved) {
        state.lastSelectClick = null;
      }
      state.probeDiffEndpointDrag = null;
    };

    const beginDrag = (component, point, options) => {
      if (!component) {
        return;
      }
      setHoverTarget(null);
      const ids = state.selectionIds.includes(component.id)
        ? state.selectionIds.slice()
        : [component.id];
      const shouldTrackWires = options?.trackWires !== false
        && ids.some((id) => isElectricalComponentType(getComponent(id)?.type));
      const hasExplicitWireIds = Array.isArray(options?.wireIds);
      let wireIds = hasExplicitWireIds
        ? options.wireIds.filter(Boolean).map(String)
        : (state.wireSelections.length
          ? state.wireSelections.slice()
          : (state.wireSelection ? [state.wireSelection] : []));
      if (!shouldTrackWires && !hasExplicitWireIds) {
        wireIds = [];
      }
      const components = Array.isArray(state.model?.components) ? state.model.components : [];
      const draggedIdSet = new Set(ids.map((id) => String(id)));
      if (wireIds.length && components.length && ids.length === components.length) {
        const allWireIds = (state.model?.wires ?? []).map((wire) => String(wire.id));
        wireIds = Array.from(new Set(wireIds.concat(allWireIds)));
      }
      if (!options?.ignoreWireLocks && wireIds.length && components.length && ids.length !== components.length) {
        const unselectedPins = new Set();
        components.forEach((entry) => {
          if (draggedIdSet.has(String(entry?.id ?? ""))) {
            return;
          }
          if (!isElectricalComponentType(entry?.type)) {
            return;
          }
          (entry.pins ?? []).forEach((pin) => {
            unselectedPins.add(pointKey(pin));
          });
        });
        if (unselectedPins.size) {
          wireIds = wireIds.filter((wireId) => {
            const wire = getWire(wireId);
            if (!wire) {
              return false;
            }
            return !(wire.points ?? []).some((point) => unselectedPins.has(pointKey(point)));
          });
        }
      }
      const isFullSelection = Boolean(ids.length && components.length && ids.length === components.length);
      const allWireIds = (state.model?.wires ?? []).map((wire) => String(wire?.id ?? ""));
      const isFullWireSelection = Boolean(isFullSelection && wireIds.length && wireIds.length === allWireIds.length);
      const wireIdSet = wireIds.length ? new Set(wireIds.map((id) => String(id))) : null;
      const dragWireAnchors = shouldTrackWires ? buildWireAnchors(ids, wireIdSet) : [];
      const wireSnapshots = new Map();
      if (wireIdSet) {
        wireIdSet.forEach((wireId) => {
          const wire = getWire(wireId);
          if (!wire) {
            return;
          }
          wireSnapshots.set(wireId, (wire.points ?? []).map((wirePoint) => ({
            x: wirePoint.x,
            y: wirePoint.y
          })));
        });
      }
      const pinsById = new Map();
      ids.forEach((id) => {
        const target = getComponent(id);
        if (!target) {
          return;
        }
        pinsById.set(id, target.pins.map((pin) => ({
          id: pin.id,
          name: pin.name,
          x: pin.x,
          y: pin.y
        })));
      });
      const sharedPinAnchors = shouldTrackWires ? buildSharedPinAnchors(ids, pinsById) : [];
      const lockedAnchorKeys = new Set();
      if (!options?.ignoreWireLocks) {
        components.forEach((entry) => {
          if (draggedIdSet.has(String(entry?.id ?? ""))) {
            return;
          }
          if (!isElectricalComponentType(entry?.type)) {
            return;
          }
          (entry.pins ?? []).forEach((pin) => {
            lockedAnchorKeys.add(pointKey(pin));
          });
        });
        if (!isFullWireSelection) {
          let coveredWireIds = wireIdSet;
          if ((!coveredWireIds || !coveredWireIds.size) && dragWireAnchors.length) {
            coveredWireIds = new Set(
              dragWireAnchors
                .map((anchor) => String(anchor?.wire?.id ?? ""))
                .filter(Boolean)
            );
          }
          getLockedJunctionKeySetForWireSelection(coveredWireIds).forEach((key) => lockedAnchorKeys.add(key));
        }
      }
      const lockedWirePoints = new Map();
      if (wireIdSet && lockedAnchorKeys.size) {
        wireIdSet.forEach((wireId) => {
          const snapshot = wireSnapshots.get(wireId);
          if (!snapshot) {
            return;
          }
          snapshot.forEach((point, index) => {
            if (!lockedAnchorKeys.has(pointKey(point))) {
              return;
            }
            let set = lockedWirePoints.get(wireId);
            if (!set) {
              set = new Set();
              lockedWirePoints.set(wireId, set);
            }
            set.add(index);
          });
        });
      }
      state.drag = {
        primaryComponentId: component.id,
        componentIds: ids,
        start: point,
        startClientX: Number.isFinite(options?.startClientX) ? options.startClientX : null,
        startClientY: Number.isFinite(options?.startClientY) ? options.startClientY : null,
        wasSelectedBeforePointerDown: options?.wasSelectedBeforePointerDown === true,
        dragThresholdExceeded: false,
        pinsById,
        moved: false,
        snapshot: cloneModel(state.model),
        wireAnchors: dragWireAnchors,
        wireIds: wireIds,
        wireSnapshots,
        lockedWirePoints,
        sharedPinAnchors,
        lockedAnchorKeys,
        allowAttach: shouldTrackWires,
        branchAnchors: [],
        previewBranches: null
      };
    };

    const updateDrag = (point, event) => {
      if (!state.drag) {
        return;
      }
      if (!state.drag.dragThresholdExceeded) {
        const hasClientStart = Number.isFinite(state.drag.startClientX) && Number.isFinite(state.drag.startClientY);
        if (hasClientStart && Number.isFinite(event?.clientX) && Number.isFinite(event?.clientY)) {
          const dxClient = event.clientX - state.drag.startClientX;
          const dyClient = event.clientY - state.drag.startClientY;
          if ((dxClient * dxClient) + (dyClient * dyClient) < DRAG_DEADZONE_PX * DRAG_DEADZONE_PX) {
            return;
          }
        }
        state.drag.dragThresholdExceeded = true;
      }
      const dxRaw = point.x - state.drag.start.x;
      const dyRaw = point.y - state.drag.start.y;
      const dx = dxRaw;
      const dy = dyRaw;
      if (dx !== 0 || dy !== 0) {
        state.drag.moved = true;
      }
      state.drag.componentIds.forEach((id) => {
        const component = getComponent(id);
        const origins = state.drag.pinsById.get(id);
        if (!component || !origins) {
          return;
        }
        component.pins.forEach((pin, index) => {
          const origin = origins[index];
          if (!origin) {
            return;
          }
          pin.x = origin.x + dx;
          pin.y = origin.y + dy;
        });
      });
      const hasWireSelection = Array.isArray(state.drag.wireIds) && state.drag.wireIds.length;
      const hasAnchors = state.drag.wireAnchors?.length;
      let previewWires = null;
      if (hasWireSelection || hasAnchors) {
        previewWires = new Map();
      }
      if (hasWireSelection) {
        state.drag.wireIds.forEach((wireId) => {
          const snapshot = state.drag.wireSnapshots?.get(wireId);
          if (!snapshot || !snapshot.length) {
            return;
          }
          const moved = snapshot.map((wirePoint) => ({
            x: wirePoint.x + dx,
            y: wirePoint.y + dy
          }));
          const locked = state.drag.lockedWirePoints?.get(wireId);
          if (locked) {
            locked.forEach((index) => {
              const original = snapshot[index];
              if (!original || !moved[index]) {
                return;
              }
              moved[index].x = original.x;
              moved[index].y = original.y;
            });
          }
          previewWires.set(wireId, moved);
        });
      }
      if (hasAnchors) {
        const moveMap = buildMoveMapFromOrigins(state.drag.componentIds, state.drag.pinsById);
        const branchAnchors = getBranchAnchors(state.drag.wireAnchors, dx, dy, state.drag.lockedAnchorKeys);
        state.drag.branchAnchors = branchAnchors;
        const branchKeys = new Set(
          branchAnchors.map((anchor) => `${anchor.wire?.id ?? ""}:${anchor.index}`)
        );
        state.drag.wireAnchors.forEach((anchor) => {
          const wire = anchor.wire;
          if (!wire) {
            return;
          }
          let previewPoints = previewWires.get(wire.id);
          if (!previewPoints) {
            previewPoints = (wire.points ?? []).map((wirePoint) => ({ x: wirePoint.x, y: wirePoint.y }));
            previewWires.set(wire.id, previewPoints);
          }
          if (branchKeys.has(`${wire.id}:${anchor.index}`)) {
            return;
          }
          const next = moveMap.get(pointKey(anchor.point)) ?? { x: anchor.pin.x, y: anchor.pin.y };
          if (Number.isFinite(anchor.index) && previewPoints[anchor.index]) {
            previewPoints[anchor.index].x = next.x;
            previewPoints[anchor.index].y = next.y;
          }
        });
        if (previewWires && previewWires.size) {
          const baseAnchoredKeys = getPinKeySet();
          branchAnchors.forEach((anchor) => {
            baseAnchoredKeys.add(pointKey(anchor.point));
          });
          const junctions = getJunctionKeySet();
          const slideInfo = getJunctionSlideInfo(junctions);
          const moveOrientation = Math.abs(dx) >= Math.abs(dy) ? "h" : "v";
          const slideTargets = new Map();
          if (junctions.size) {
            junctions.forEach((key) => {
              const slide = slideInfo.get(key);
              if (!slide || slide.orientation !== moveOrientation) {
                return;
              }
              const span = getPassThroughSpanAtJunction(key, slide.orientation, slide.wires, previewWires);
              if (!span) {
                return;
              }
              if (slide.orientation === "h") {
                const targetX = Math.min(Math.max(span.origin.x + dx, span.min), span.max);
                slideTargets.set(key, { x: targetX, y: span.origin.y });
              } else {
                const targetY = Math.min(Math.max(span.origin.y + dy, span.min), span.max);
                slideTargets.set(key, { x: span.origin.x, y: targetY });
              }
            });
          }
          previewWires.forEach((points, wireId) => {
            const anchoredKeys = new Set(baseAnchoredKeys);
            if (junctions.size) {
              const wireKey = String(wireId);
              junctions.forEach((key) => {
                const slide = slideInfo.get(key);
                const target = slideTargets.get(key);
                if (slide?.orientation && slide.orientation === moveOrientation && target && !slide.wires.has(wireKey)) {
                  let applied = false;
                  for (let i = 0; i < points.length; i += 1) {
                    if (pointKey(points[i]) === key) {
                      points[i].x = target.x;
                      points[i].y = target.y;
                      applied = true;
                    }
                  }
                  if (applied) {
                    anchoredKeys.add(pointKey(target));
                    return;
                  }
                }
                anchoredKeys.add(key);
              });
            }
            ensureWireOrthogonal({ points }, anchoredKeys, { snap: false });
          });
          const pinComponentMap = buildPinComponentMap();
          const fullObstacles = getWireObstacles();
          const excludeComponentIds = new Set(state.drag.componentIds.map((id) => String(id)));
          previewWires.forEach((points) => {
            const obstacles = getWireObstaclesForWire({ points }, pinComponentMap, fullObstacles, {
              excludeComponentIds,
              junctions
            });
            if (!obstacles || !obstacles.length) {
              return;
            }
            const routed = rerouteWirePoints(points, obstacles, false);
            points.length = 0;
            routed.forEach((point) => points.push({ x: point.x, y: point.y }));
          });
        }
      } else {
        state.drag.branchAnchors = [];
      }
      const previewBranches = [];
      if (state.drag.branchAnchors?.length) {
        state.drag.branchAnchors.forEach((anchor) => {
          const start = { x: anchor.point.x, y: anchor.point.y };
          const end = { x: anchor.pin.x, y: anchor.pin.y };
          if (start.x === end.x && start.y === end.y) {
            return;
          }
          previewBranches.push(buildOrthogonalWirePoints(start, end));
        });
      }
      if (state.drag.sharedPinAnchors?.length) {
        state.drag.sharedPinAnchors.forEach((anchor) => {
          const component = getComponent(anchor.componentId);
          const pin = component?.pins?.[anchor.index];
          if (!pin) {
            return;
          }
          const start = { x: anchor.start.x, y: anchor.start.y };
          const end = { x: pin.x, y: pin.y };
          if (start.x === end.x && start.y === end.y) {
            return;
          }
          previewBranches.push(buildOrthogonalWirePoints(start, end));
        });
      }
      state.drag.previewBranches = previewBranches.length ? previewBranches : null;
      state.drag.previewWires = previewWires && previewWires.size ? previewWires : null;
      const hasWireActivity = Boolean(
        state.drag.wireIds?.length
        || state.drag.wireAnchors?.length
        || state.drag.branchAnchors?.length
        || state.drag.sharedPinAnchors?.length
      );
      if (!hasWireActivity && scheduleRender) {
        scheduleRender("drag");
      } else {
        render();
      }
    };

    const endDrag = (event) => {
      if (!state.drag) {
        return;
      }
      const draggedIds = state.drag.componentIds.slice();
      const preSnapProbePoints = new Map();
      if (state.drag.moved && draggedIds.length) {
        draggedIds.forEach((id) => {
          const component = getComponent(id);
          if (!component) {
            return;
          }
          const type = String(component.type ?? "").toUpperCase();
          if (type !== "PV" && type !== "PI" && type !== "PP") {
            return;
          }
          const probePin = Array.isArray(component.pins) ? component.pins[0] : null;
          if (!probePin || !Number.isFinite(probePin.x) || !Number.isFinite(probePin.y)) {
            return;
          }
          preSnapProbePoints.set(String(id), { x: probePin.x, y: probePin.y });
        });
      }
      let resnapMap = null;
      if (state.drag.moved && state.grid.snap && state.grid.size > 0) {
        resnapMap = new Map();
        draggedIds.forEach((id) => {
          const component = getComponent(id);
          if (!component) {
            return;
          }
          component.pins.forEach((pin) => {
            const before = { x: pin.x, y: pin.y };
            const snapped = { x: snapCoord(pin.x), y: snapCoord(pin.y) };
            if (snapped.x !== before.x || snapped.y !== before.y) {
              resnapMap.set(pointKey(before), snapped);
            }
            pin.x = snapped.x;
            pin.y = snapped.y;
          });
        });
      }
      let previewApplied = false;
      if (state.drag.moved && state.drag.previewWires?.size) {
        previewApplied = applyPreviewWires(state.drag.previewWires, resnapMap);
      }
      if (state.drag.moved && state.drag.wireAnchors?.length && !previewApplied) {
        const moveMap = buildMoveMapFromOrigins(draggedIds, state.drag.pinsById);
        updateWiresFromMoveMap(moveMap, { normalize: false });
      }
      const excludeIds = state.drag.moved ? new Set(draggedIds.map((id) => String(id))) : null;
      const allComponents = Array.isArray(state.model?.components) ? state.model.components : [];
      const isFullSelection = draggedIds.length && allComponents.length && draggedIds.length === allComponents.length;
      const hasWireDrag = Array.isArray(state.drag.wireIds) && state.drag.wireIds.length > 0;
      const allowAttach = state.drag.allowAttach !== false;
      const hasWireWork = hasWireDrag
        || Boolean(state.drag.wireAnchors?.length)
        || Boolean(state.drag.branchAnchors?.length)
        || Boolean(state.drag.sharedPinAnchors?.length);
      const isFullWireSelection = Boolean(isFullSelection && hasWireDrag);
      const branchObstacles = excludeIds ? getWireObstacles(excludeIds) : null;
      if (state.drag.moved && state.drag.branchAnchors?.length) {
        state.drag.branchAnchors.forEach((anchor) => {
          const start = { x: anchor.point.x, y: anchor.point.y };
          const end = { x: anchor.pin.x, y: anchor.pin.y };
          if (start.x === end.x && start.y === end.y) {
            return;
          }
          const points = buildOrthogonalWirePoints(start, end);
          addWireInternal({ points }, { obstacles: branchObstacles });
        });
      }
      if (state.drag.moved && state.drag.sharedPinAnchors?.length) {
        state.drag.sharedPinAnchors.forEach((anchor) => {
          const component = getComponent(anchor.componentId);
          const pin = component?.pins?.[anchor.index];
          if (!pin) {
            return;
          }
          const start = { x: anchor.start.x, y: anchor.start.y };
          const end = { x: pin.x, y: pin.y };
          if (start.x === end.x && start.y === end.y) {
            return;
          }
          const points = buildOrthogonalWirePoints(start, end);
          addWireInternal({ points }, { obstacles: branchObstacles });
        });
      }
      if (state.drag.moved) {
        if (isFullWireSelection) {
          if (hasWireDrag) {
            snapWirePoints(state.drag.wireIds);
          }
          removeComponentShorts(draggedIds);
          simplifyAllWires();
        } else if (allowAttach || hasWireWork) {
          if (hasWireDrag) {
            const touchedWireIds = new Set(state.drag.wireIds.map((wireId) => String(wireId)));
            const connectedWireIds = getWireIdsConnectedToComponents(draggedIds);
            connectedWireIds.forEach((wireId) => touchedWireIds.add(String(wireId)));
            if (allowAttach) {
              attachPinsToWires(draggedIds, {
                normalize: false,
                wireIds: touchedWireIds
              });
            }
            snapWirePoints(touchedWireIds);
          } else {
            if (allowAttach) {
              attachPinsToWires(draggedIds, { normalize: false });
            }
            removeComponentShorts(draggedIds);
            normalizeAllWiresExcluding(excludeIds);
            snapWirePointsNearGrid();
          }
        }
      }
      if (state.drag.moved && draggedIds.length) {
        draggedIds.forEach((id) => {
          const component = getComponent(id);
          if (!component) {
            return;
          }
          const type = String(component.type ?? "").toUpperCase();
          if (type !== "PV" && type !== "PI" && type !== "PP") {
            return;
          }
          const probePin = Array.isArray(component.pins) ? component.pins[0] : null;
          if (!probePin || !Number.isFinite(probePin.x) || !Number.isFinite(probePin.y)) {
            return;
          }
          const probePoint = preSnapProbePoints.get(String(id))
            ?? { x: probePin.x, y: probePin.y };
          const probeTargets = resolveProbeTargets(probePoint);
          applyProbeTargetSelection(component, probePin, probeTargets, "closest");
        });
      }
      if (state.drag.moved && state.drag.snapshot) {
        state.history.undo.push(state.drag.snapshot);
        state.history.redo.length = 0;
      }
      if (
        !state.drag.moved
        && state.tool.mode === "select"
        && !event?.altKey
        && !event?.shiftKey
        && !event?.ctrlKey
        && !event?.metaKey
      ) {
        const primaryComponentId = state.drag.primaryComponentId;
        const primaryComponent = getComponent(primaryComponentId);
        const primaryType = String(primaryComponent?.type ?? "").toUpperCase();
        if (primaryType === "SW" && state.drag.wasSelectedBeforePointerDown) {
          const nextValue = buildToggledSpdtSwitchValue(primaryComponent?.value);
          state.lastSelectClick = null;
          state.drag = null;
          commitModelMutation(() => {
            primaryComponent.value = nextValue;
          });
          return;
        }
        if (isDoubleSelectClick(primaryComponentId, event)) {
          invokeComponentEdit(primaryComponent);
        }
      } else if (!event || state.drag.moved || event?.altKey || event?.shiftKey || event?.ctrlKey || event?.metaKey) {
        state.lastSelectClick = null;
      }
      state.drag = null;
      render();
      notifyModelChange();
    };

    const buildWireNodePoints = (points, index, target, anchoredKeys) => {
      if (!Array.isArray(points) || points.length < 2 || !target) {
        return Array.isArray(points) ? points.map((point) => ({ x: point.x, y: point.y })) : [];
      }
      const lastIndex = points.length - 1;
      const targetPoint = { x: target.x, y: target.y };
      if (index <= 0) {
        const next = points[1];
        if (!next) {
          return [targetPoint];
        }
        const path = createWirePreviewPoints(targetPoint, next);
        const merged = path.concat(points.slice(2).map((point) => ({ x: point.x, y: point.y })));
        return simplifyWirePoints(merged, anchoredKeys);
      }
      if (index >= lastIndex) {
        const prev = points[lastIndex - 1];
        if (!prev) {
          return [targetPoint];
        }
        const path = createWirePreviewPoints(prev, targetPoint);
        const merged = points
          .slice(0, lastIndex)
          .map((point) => ({ x: point.x, y: point.y }))
          .concat(path.slice(1));
        return simplifyWirePoints(merged, anchoredKeys);
      }
      const prev = points[index - 1];
      const next = points[index + 1];
      if (!prev || !next) {
        return points.map((point) => ({ x: point.x, y: point.y }));
      }
      const before = points.slice(0, index).map((point) => ({ x: point.x, y: point.y }));
      const pathA = createWirePreviewPoints(prev, targetPoint);
      const pathB = createWirePreviewPoints(targetPoint, next);
      const merged = before
        .concat(pathA.slice(1), pathB.slice(1))
        .concat(points.slice(index + 2).map((point) => ({ x: point.x, y: point.y })));
      return simplifyWirePoints(merged, anchoredKeys);
    };

    const beginWireNodeDrag = (nodeKeyValue, point) => {
      if (!nodeKeyValue) {
        return;
      }
      const key = String(nodeKeyValue);
      const parts = key.split(",");
      if (parts.length !== 2) {
        return;
      }
      const x = Number(parts[0]);
      const y = Number(parts[1]);
      if (!Number.isFinite(x) || !Number.isFinite(y)) {
        return;
      }
      const targets = new Map();
      const wires = Array.isArray(state.model?.wires) ? state.model.wires : [];
      wires.forEach((wire) => {
        const points = Array.isArray(wire.points) ? wire.points : [];
        const index = points.findIndex((wirePoint) => pointKey(wirePoint) === key);
        if (index < 0) {
          return;
        }
        targets.set(wire.id, {
          index,
          points: points.map((wirePoint) => ({ x: wirePoint.x, y: wirePoint.y }))
        });
      });
      if (!targets.size) {
        return;
      }
      const offset = point ? { x: x - point.x, y: y - point.y } : { x: 0, y: 0 };
      state.wireNode = {
        key,
        start: { x, y },
        offset,
        moved: false,
        snapshot: cloneModel(state.model),
        targets
      };
    };

    const updateWireNodeDrag = (point) => {
      if (!state.wireNode || !point) {
        return;
      }
      const target = {
        x: point.x + (state.wireNode.offset?.x ?? 0),
        y: point.y + (state.wireNode.offset?.y ?? 0)
      };
      const targetKey = pointKey(target);
      const anchoredKeys = getAnchoredPointKeySet();
      anchoredKeys.add(targetKey);
      state.wireNode.targets.forEach((entry, wireId) => {
        const wire = getWire(wireId);
        if (!wire) {
          return;
        }
        const nextPoints = buildWireNodePoints(entry.points, entry.index, target, anchoredKeys);
        wire.points.length = 0;
        nextPoints.forEach((wirePoint) => wire.points.push({ x: wirePoint.x, y: wirePoint.y }));
      });
      if (target.x !== state.wireNode.start.x || target.y !== state.wireNode.start.y) {
        state.wireNode.moved = true;
      }
      render();
    };

    const endWireNodeDrag = () => {
      if (!state.wireNode) {
        return;
      }
      if (state.wireNode.moved) {
        if (state.grid.snap && state.grid.size > 0) {
          state.wireNode.targets.forEach((entry, wireId) => {
            const wire = getWire(wireId);
            if (!wire) {
              return;
            }
            (wire.points ?? []).forEach((wirePoint) => {
              wirePoint.x = snapCoord(wirePoint.x);
              wirePoint.y = snapCoord(wirePoint.y);
            });
          });
        }
        normalizeAllWires();
      }
      if (state.wireNode.moved && state.wireNode.snapshot) {
        state.history.undo.push(state.wireNode.snapshot);
        state.history.redo.length = 0;
      }
      state.wireNode = null;
      render();
      notifyModelChange();
    };

    const beginWireHandleDrag = (wireId, segmentIndex, point) => {
      const wire = getWire(wireId);
      const index = Number(segmentIndex);
      if (!wire || !Number.isFinite(index)) {
        return;
      }
      const points = Array.isArray(wire.points) ? wire.points : [];
      if (!points[index] || !points[index + 1]) {
        return;
      }
      const start = points[index];
      const end = points[index + 1];
      const isHorizontal = start.y === end.y;
      const isVertical = start.x === end.x;
      if (!isHorizontal && !isVertical) {
        return;
      }
      const orientationValue = isHorizontal ? "h" : "v";
      const originalCoord = orientationValue === "h" ? start.y : start.x;
      state.wireHandle = {
        wireId: wire.id,
        segmentIndex: index,
        orientation: orientationValue,
        start: point,
        originalCoord,
        startPoints: points.map((wirePoint) => ({ x: wirePoint.x, y: wirePoint.y })),
        moved: false,
        snapshot: cloneModel(state.model)
      };
    };

    const updateWireHandleDrag = (point) => {
      if (!state.wireHandle) {
        return;
      }
      const wire = getWire(state.wireHandle.wireId);
      if (!wire) {
        return;
      }
      if (!point) {
        return;
      }
      const target = state.wireHandle.orientation === "h" ? point.y : point.x;
      const nextPoints = adjustWireSegment(
        state.wireHandle.startPoints,
        state.wireHandle.segmentIndex,
        state.wireHandle.orientation,
        target
      );
      wire.points.length = 0;
      nextPoints.forEach((wirePoint) => wire.points.push({ x: wirePoint.x, y: wirePoint.y }));
      if (target !== state.wireHandle.originalCoord) {
        state.wireHandle.moved = true;
      }
      render();
    };

    const endWireHandleDrag = () => {
      if (!state.wireHandle) {
        return;
      }
      if (state.wireHandle.moved) {
        const wire = getWire(state.wireHandle.wireId);
        if (wire) {
          if (state.grid.snap && state.grid.size > 0) {
            (wire.points ?? []).forEach((point) => {
              point.x = snapCoord(point.x);
              point.y = snapCoord(point.y);
            });
          }
          normalizeAllWires();
        }
      }
      if (state.wireHandle.moved && state.wireHandle.snapshot) {
        state.history.undo.push(state.wireHandle.snapshot);
        state.history.redo.length = 0;
      }
      state.wireHandle = null;
      render();
      notifyModelChange();
    };

    const getPointerId = (event) => {
      const pointerId = Number(event?.pointerId);
      return Number.isFinite(pointerId) ? pointerId : null;
    };

    const isTouchPointer = (event) =>
      String(event?.pointerType ?? "").trim().toLowerCase() === "touch";

    const trackTouchPointer = (event) => {
      if (!isTouchPointer(event)) {
        return;
      }
      const pointerId = getPointerId(event);
      if (pointerId === null) {
        return;
      }
      state.touchPointers.set(pointerId, {
        clientX: event.clientX,
        clientY: event.clientY
      });
    };

    const updateTrackedTouchPointer = (event) => {
      if (!isTouchPointer(event)) {
        return;
      }
      const pointerId = getPointerId(event);
      if (pointerId === null || !state.touchPointers.has(pointerId)) {
        return;
      }
      state.touchPointers.set(pointerId, {
        clientX: event.clientX,
        clientY: event.clientY
      });
    };

    const untrackTouchPointer = (event) => {
      if (!isTouchPointer(event)) {
        return;
      }
      const pointerId = getPointerId(event);
      if (pointerId === null) {
        return;
      }
      state.touchPointers.delete(pointerId);
    };

    const captureTouchPointer = (event) => {
      if (!isTouchPointer(event)) {
        return;
      }
      const pointerId = getPointerId(event);
      if (pointerId === null || state.touchCapturedPointerIds.has(pointerId)) {
        return;
      }
      try {
        if (typeof svg.setPointerCapture === "function") {
          svg.setPointerCapture(pointerId);
        }
        state.touchCapturedPointerIds.add(pointerId);
      } catch {
        // Ignore capture failures for synthetic/non-active pointers.
      }
    };

    const releaseTouchPointerCapture = (pointerId) => {
      if (!Number.isFinite(pointerId)) {
        return;
      }
      if (!state.touchCapturedPointerIds.has(pointerId)) {
        return;
      }
      try {
        if (typeof svg.releasePointerCapture === "function") {
          svg.releasePointerCapture(pointerId);
        }
      } catch {
        // Ignore release failures for synthetic/non-captured pointers.
      }
      state.touchCapturedPointerIds.delete(pointerId);
    };

    const beginPan = (event, options = {}) => {
      state.pan = {
        startX: event.clientX,
        startY: event.clientY,
        viewX: state.view.x,
        viewY: state.view.y,
        pointerId: getPointerId(event),
        moved: false,
        clearSelectionOnTap: options.clearSelectionOnTap === true
      };
    };

    const beginTouchPinchIfEligible = () => {
      if (state.touchPinch || state.touchPointers.size !== 2) {
        return false;
      }
      if (state.drag || state.selectionBox || state.wireNode || state.wireHandle || state.probeDiffEndpointDrag) {
        return false;
      }
      const entries = Array.from(state.touchPointers.entries());
      const first = entries[0];
      const second = entries[1];
      if (!first || !second) {
        return false;
      }
      const firstPoint = first[1];
      const secondPoint = second[1];
      const dx = secondPoint.clientX - firstPoint.clientX;
      const dy = secondPoint.clientY - firstPoint.clientY;
      const startDistance = Math.hypot(dx, dy);
      if (!Number.isFinite(startDistance) || startDistance < TOUCH_PINCH_MIN_DISTANCE_PX) {
        return false;
      }
      const midpointClientX = (firstPoint.clientX + secondPoint.clientX) / 2;
      const midpointClientY = (firstPoint.clientY + secondPoint.clientY) / 2;
      const anchorWorld = clientToWorld(midpointClientX, midpointClientY);
      if (!anchorWorld) {
        return false;
      }
      endPan();
      state.touchPinch = {
        pointerAId: first[0],
        pointerBId: second[0],
        startDistance,
        startMidpointClientX: midpointClientX,
        startMidpointClientY: midpointClientY,
        startView: { ...state.view },
        anchorWorld
      };
      state.wireStart = null;
      state.wirePreview = null;
      state.lastSelectClick = null;
      return true;
    };

    const updateTouchPinch = (event) => {
      if (!state.touchPinch) {
        return false;
      }
      const pointerId = getPointerId(event);
      if (pointerId === null) {
        return false;
      }
      if (pointerId !== state.touchPinch.pointerAId && pointerId !== state.touchPinch.pointerBId) {
        return false;
      }
      const firstPoint = state.touchPointers.get(state.touchPinch.pointerAId);
      const secondPoint = state.touchPointers.get(state.touchPinch.pointerBId);
      if (!firstPoint || !secondPoint) {
        state.touchPinch = null;
        return false;
      }
      const dx = secondPoint.clientX - firstPoint.clientX;
      const dy = secondPoint.clientY - firstPoint.clientY;
      const distance = Math.hypot(dx, dy);
      if (!Number.isFinite(distance) || distance < TOUCH_PINCH_MIN_DISTANCE_PX) {
        return true;
      }
      const midpointClientX = (firstPoint.clientX + secondPoint.clientX) / 2;
      const midpointClientY = (firstPoint.clientY + secondPoint.clientY) / 2;
      const midpointDx = midpointClientX - state.touchPinch.startMidpointClientX;
      const midpointDy = midpointClientY - state.touchPinch.startMidpointClientY;
      const midpointMovedEnough = (midpointDx * midpointDx) + (midpointDy * midpointDy)
        >= TOUCH_PINCH_DISTANCE_DEADZONE_PX * TOUCH_PINCH_DISTANCE_DEADZONE_PX;
      const distanceDelta = Math.abs(distance - state.touchPinch.startDistance);
      if (distanceDelta < TOUCH_PINCH_DISTANCE_DEADZONE_PX && !midpointMovedEnough) {
        return true;
      }
      const zoomFactor = distanceDelta < TOUCH_PINCH_DISTANCE_DEADZONE_PX
        ? 1
        : (state.touchPinch.startDistance / distance);
      const newWidth = Math.max(MIN_VIEW_WIDTH, Math.min(MAX_VIEW_WIDTH, state.touchPinch.startView.width * zoomFactor));
      const newHeight = Math.max(MIN_VIEW_HEIGHT, Math.min(MAX_VIEW_HEIGHT, state.touchPinch.startView.height * zoomFactor));
      const rect = svg.getBoundingClientRect();
      if (!rect.width || !rect.height) {
        return true;
      }
      const ratioX = Math.max(0, Math.min(1, (midpointClientX - rect.left) / rect.width));
      const ratioY = Math.max(0, Math.min(1, (midpointClientY - rect.top) / rect.height));
      state.view.width = newWidth;
      state.view.height = newHeight;
      state.view.x = state.touchPinch.anchorWorld.x - (ratioX * newWidth);
      state.view.y = state.touchPinch.anchorWorld.y - (ratioY * newHeight);
      notifyViewChange();
      render();
      return true;
    };

    const endTouchPinch = (event) => {
      if (!state.touchPinch) {
        return;
      }
      if (!event) {
        state.touchPinch = null;
        return;
      }
      const pointerId = getPointerId(event);
      if (pointerId === null) {
        state.touchPinch = null;
        return;
      }
      if (pointerId === state.touchPinch.pointerAId || pointerId === state.touchPinch.pointerBId) {
        state.touchPinch = null;
        return;
      }
      if (!state.touchPointers.has(state.touchPinch.pointerAId) || !state.touchPointers.has(state.touchPinch.pointerBId)) {
        state.touchPinch = null;
      }
    };

    const invokeComponentEdit = (component) => {
      if (!component) {
        return;
      }
      if (!state.selectionIds.includes(component.id)) {
        setSelection([component.id]);
      }
      if (typeof options?.onComponentEdit === "function") {
        options.onComponentEdit(component);
      }
    };

    const isDoubleSelectClick = (componentId, event) => {
      if (!componentId || !event) {
        return false;
      }
      const now = Date.now();
      const clientX = Number.isFinite(event.clientX) ? event.clientX : 0;
      const clientY = Number.isFinite(event.clientY) ? event.clientY : 0;
      const previous = state.lastSelectClick;
      let isDouble = false;
      if (previous && previous.componentId === componentId) {
        const dt = now - previous.time;
        const dx = clientX - previous.clientX;
        const dy = clientY - previous.clientY;
        isDouble = dt >= 0
          && dt <= DOUBLE_CLICK_INTERVAL_MS
          && (dx * dx) + (dy * dy) <= DOUBLE_CLICK_DISTANCE_PX * DOUBLE_CLICK_DISTANCE_PX;
      }
      state.lastSelectClick = { componentId, time: now, clientX, clientY };
      if (isDouble) {
        state.lastSelectClick = null;
      }
      return isDouble;
    };

    const handleDoubleClick = (event) => {
      if (state.tool.mode !== "select") {
        return;
      }
      const world = clientToWorld(event.clientX, event.clientY);
      if (!world) {
        return;
      }
      const labelComponentId = event.target?.getAttribute?.("data-component-id");
      const labelComponent = labelComponentId ? getComponent(labelComponentId) : null;
      const hit = labelComponent || hitTestComponent(world, { preferIds: state.selectionIds });
      if (!hit) {
        return;
      }
      state.lastSelectClick = null;
      invokeComponentEdit(hit);
      event.preventDefault();
    };

    const updatePan = (event) => {
      if (!state.pan) {
        return;
      }
      const panPointerId = Number(state.pan.pointerId);
      const eventPointerId = Number(event?.pointerId);
      if (Number.isFinite(panPointerId) && Number.isFinite(eventPointerId) && panPointerId !== eventPointerId) {
        return;
      }
      const clientDx = event.clientX - state.pan.startX;
      const clientDy = event.clientY - state.pan.startY;
      const movedEnough = (clientDx * clientDx) + (clientDy * clientDy) >= DRAG_DEADZONE_PX * DRAG_DEADZONE_PX;
      if (state.pan.clearSelectionOnTap && !state.pan.moved && !movedEnough) {
        return;
      }
      if (movedEnough) {
        state.pan.moved = true;
      }
      const rect = svg.getBoundingClientRect();
      if (!rect.width || !rect.height) {
        return;
      }
      const dx = ((event.clientX - state.pan.startX) / rect.width) * state.view.width;
      const dy = ((event.clientY - state.pan.startY) / rect.height) * state.view.height;
      state.view.x = state.pan.viewX - dx;
      state.view.y = state.pan.viewY - dy;
      notifyViewChange();
      render();
    };

    const endPan = (event) => {
      if (!state.pan) {
        return;
      }
      const panPointerId = Number(state.pan.pointerId);
      const eventPointerId = Number(event?.pointerId);
      if (Number.isFinite(panPointerId) && Number.isFinite(eventPointerId) && panPointerId !== eventPointerId) {
        return;
      }
      state.pan = null;
    };

    const pointOnWireSegment = (point, start, end) => {
      if (!point || !start || !end) {
        return false;
      }
      if (start.x === end.x) {
        if (Math.abs(point.x - start.x) > 0.001) {
          return false;
        }
        const minY = Math.min(start.y, end.y) - 0.001;
        const maxY = Math.max(start.y, end.y) + 0.001;
        return point.y >= minY && point.y <= maxY;
      }
      if (start.y === end.y) {
        if (Math.abs(point.y - start.y) > 0.001) {
          return false;
        }
        const minX = Math.min(start.x, end.x) - 0.001;
        const maxX = Math.max(start.x, end.x) + 0.001;
        return point.x >= minX && point.x <= maxX;
      }
      return false;
    };

    const buildPointNetMetadata = () => {
      if (typeof api.buildNets !== "function") {
        return { pointToNet: new Map(), netLabelById: new Map() };
      }
      let nets = [];
      try {
        const built = api.buildNets(state.model);
        nets = Array.isArray(built) ? built : [];
      } catch {
        nets = [];
      }
      const pointToNet = new Map();
      const netLabelById = new Map();
      nets.forEach((net) => {
        const netId = String(net?.id ?? "");
        if (!netId) {
          return;
        }
        const labels = [];
        (net.pins ?? []).forEach((pin) => {
          const component = getComponent(pin.componentId);
          if (!component || String(component.type ?? "").toUpperCase() !== "NET") {
            return;
          }
          const label = getDisplayName(component).trim();
          if (label) {
            labels.push(label);
          }
        });
        if (labels.length) {
          netLabelById.set(netId, labels[0]);
        }
        (net.nodes ?? []).forEach((node) => {
          pointToNet.set(pointKey(node), netId);
        });
      });
      return { pointToNet, netLabelById };
    };

    const resolveProbeNodeLabel = (point) => {
      if (!point) {
        return "";
      }
      const metadata = buildPointNetMetadata();
      const exactNetId = metadata.pointToNet.get(pointKey(point));
      if (exactNetId) {
        return metadata.netLabelById.get(exactNetId) ?? exactNetId;
      }
      const wires = Array.isArray(state.model?.wires) ? state.model.wires : [];
      for (const wire of wires) {
        const points = Array.isArray(wire?.points) ? wire.points : [];
        for (let index = 0; index < points.length - 1; index += 1) {
          const start = points[index];
          const end = points[index + 1];
          if (!pointOnWireSegment(point, start, end)) {
            continue;
          }
          const startNet = metadata.pointToNet.get(pointKey(start));
          const endNet = metadata.pointToNet.get(pointKey(end));
          const netId = startNet || endNet;
          if (netId) {
            return metadata.netLabelById.get(netId) ?? netId;
          }
        }
      }
      return `${Math.round(point.x)},${Math.round(point.y)}`;
    };

    const resolveProbeNodePoint = (world) => {
      const nodeHit = hitTestNode(world);
      const nodePoint = nodeHit?.point
        ? { x: nodeHit.point.x, y: nodeHit.point.y }
        : null;
      const wireHit = hitTestWireSegment(world);
      if (wireHit) {
        const projected = getWireSegmentPoint(wireHit, world);
        if (projected) {
          const wirePoint = { x: projected.x, y: projected.y };
          if (!nodePoint) {
            return wirePoint;
          }
          const nodeDx = nodePoint.x - world.x;
          const nodeDy = nodePoint.y - world.y;
          const nodeDistSq = (nodeDx * nodeDx) + (nodeDy * nodeDy);
          const wireDx = wirePoint.x - world.x;
          const wireDy = wirePoint.y - world.y;
          const wireDistSq = (wireDx * wireDx) + (wireDy * wireDy);
          if (wireDistSq < nodeDistSq) {
            return wirePoint;
          }
        }
      }
      if (nodePoint) {
        return nodePoint;
      }
      return null;
    };

    const isProbeTargetComponent = (component) => {
      if (!component) {
        return false;
      }
      const type = String(component.type ?? "").toUpperCase();
      if (!isElectricalComponentType(type)) {
        return false;
      }
      if (isProbeComponentType(type) || type === "NET" || type === "GND") {
        return false;
      }
      return Array.isArray(component.pins) && component.pins.length >= 2;
    };

    const getProbeTargetAnchor = (component) => {
      if (!component || !Array.isArray(component.pins) || !component.pins.length) {
        return null;
      }
      if (component.pins.length < 2) {
        return { x: component.pins[0].x, y: component.pins[0].y };
      }
      const pinA = component.pins[0];
      const pinB = component.pins[1];
      const center = {
        x: (pinA.x + pinB.x) / 2,
        y: (pinA.y + pinB.y) / 2
      };
      return snapPoint(center) ?? center;
    };

    const hasFinitePoint = (point) =>
      Boolean(point && Number.isFinite(point.x) && Number.isFinite(point.y));

    const distanceSqBetweenPoints = (a, b) => {
      if (!hasFinitePoint(a) || !hasFinitePoint(b)) {
        return Infinity;
      }
      const dx = a.x - b.x;
      const dy = a.y - b.y;
      return (dx * dx) + (dy * dy);
    };

    const resolveProbeTargets = (probePoint) => {
      if (!hasFinitePoint(probePoint)) {
        return {
          nodePoint: null,
          nodeLabel: "",
          component: null,
          componentAnchor: null,
          nodeDistanceSq: Infinity,
          componentDistanceSq: Infinity
        };
      }
      const nodePoint = resolveProbeNodePoint(probePoint);
      const nodeLabel = nodePoint ? resolveProbeNodeLabel(nodePoint) : "";
      const componentHit = hitTestComponent(probePoint);
      const component = isProbeTargetComponent(componentHit) ? componentHit : null;
      const componentAnchor = component ? getProbeTargetAnchor(component) : null;
      const nodeDistanceSq = distanceSqBetweenPoints(probePoint, nodePoint);
      const componentDistanceSq = distanceSqBetweenPoints(probePoint, componentAnchor);
      return {
        nodePoint,
        nodeLabel,
        component,
        componentAnchor,
        nodeDistanceSq,
        componentDistanceSq
      };
    };

    const pickProbeTarget = (targets, strategy) => {
      const mode = String(strategy ?? "closest").trim().toLowerCase();
      const hasNodeTarget = hasFinitePoint(targets?.nodePoint);
      const hasComponentTarget = Boolean(targets?.component && hasFinitePoint(targets?.componentAnchor));
      if (mode === "node-first") {
        if (hasNodeTarget) {
          return "node";
        }
        if (hasComponentTarget) {
          return "component";
        }
        return "";
      }
      if (hasNodeTarget && hasComponentTarget) {
        return targets.nodeDistanceSq <= targets.componentDistanceSq ? "node" : "component";
      }
      if (hasNodeTarget) {
        return "node";
      }
      if (hasComponentTarget) {
        return "component";
      }
      return "";
    };

    const applyProbeTargetSelection = (component, probePin, targets, strategy) => {
      if (!component || !probePin) {
        return false;
      }
      const type = String(component.type ?? "").toUpperCase();
      if (type !== "PV" && type !== "PI" && type !== "PP") {
        return false;
      }
      const selectedTarget = pickProbeTarget(targets, strategy);
      if (!selectedTarget) {
        return false;
      }
      if (type === "PV" && selectedTarget === "node") {
        if (!hasFinitePoint(targets?.nodePoint)) {
          return false;
        }
        const nodeLabel = String(targets?.nodeLabel ?? "");
        component.value = "";
        component.name = `V(${nodeLabel || "?"})`;
        probePin.x = targets.nodePoint.x;
        probePin.y = targets.nodePoint.y;
        return true;
      }
      if (type === "PV" && selectedTarget === "component") {
        if (!targets?.component || !hasFinitePoint(targets?.componentAnchor)) {
          return false;
        }
        const targetId = String(targets.component.id ?? "").trim();
        component.type = "PI";
        component.value = targetId;
        component.name = `I(${targetId || "?"})`;
        probePin.x = targets.componentAnchor.x;
        probePin.y = targets.componentAnchor.y;
        return true;
      }
      if ((type === "PI" || type === "PP") && selectedTarget === "node") {
        if (!hasFinitePoint(targets?.nodePoint)) {
          return false;
        }
        const nodeLabel = String(targets?.nodeLabel ?? "");
        component.type = "PV";
        component.value = "";
        component.name = `V(${nodeLabel || "?"})`;
        probePin.x = targets.nodePoint.x;
        probePin.y = targets.nodePoint.y;
        return true;
      }
      if ((type === "PI" || type === "PP") && selectedTarget === "component") {
        if (!targets?.component || !hasFinitePoint(targets?.componentAnchor)) {
          return false;
        }
        const targetId = String(targets.component.id ?? "").trim();
        const labelPrefix = type === "PP" ? "P" : "I";
        component.value = targetId;
        component.name = `${labelPrefix}(${targetId || "?"})`;
        probePin.x = targets.componentAnchor.x;
        probePin.y = targets.componentAnchor.y;
        return true;
      }
      return false;
    };

    const createProbeFromTool = (toolType, world) => {
      const type = String(toolType ?? "").toUpperCase();
      const resolveFreeProbePoint = (candidateWorld) =>
        resolveProbeNodePoint(candidateWorld)
        ?? snapPoint(candidateWorld)
        ?? { x: candidateWorld.x, y: candidateWorld.y };
      if (type === "PV") {
        const targets = resolveProbeTargets(world);
        const preferredTarget = pickProbeTarget(targets, "node-first");
        if (preferredTarget === "node" && hasFinitePoint(targets?.nodePoint)) {
          const nodeLabel = String(targets?.nodeLabel ?? "");
          return {
            type: "PV",
            x: targets.nodePoint.x,
            y: targets.nodePoint.y,
            name: `V(${nodeLabel})`
          };
        }
        if (preferredTarget === "component" && targets?.component && hasFinitePoint(targets?.componentAnchor)) {
          const targetId = String(targets.component.id ?? "").trim();
          return {
            type: "PI",
            x: targets.componentAnchor.x,
            y: targets.componentAnchor.y,
            name: `I(${targetId})`,
            value: targetId
          };
        }
        return null;
      }
      if (type === "PD") {
        const nodePoint = resolveFreeProbePoint(world);
        if (!state.probeDiffStart) {
          state.probeDiffStart = { x: nodePoint.x, y: nodePoint.y };
          state.probeDiffPreview = { x: nodePoint.x, y: nodePoint.y };
          renderOverlay();
          return null;
        }
        const start = state.probeDiffStart;
        state.probeDiffStart = null;
        state.probeDiffPreview = null;
        const posLabel = resolveProbeNodeLabel(start);
        const negLabel = resolveProbeNodeLabel(nodePoint);
        renderOverlay();
        return {
          id: nextRefDes("PD"),
          type: "PD",
          name: `V(${posLabel},${negLabel})`,
          probeDiffRotations: { "P+": 0, "P-": 0 },
          pins: [
            { id: "P+", name: "P+", x: start.x, y: start.y },
            { id: "P-", name: "P-", x: nodePoint.x, y: nodePoint.y }
          ]
        };
      }
      if (type === "PP") {
        const targets = resolveProbeTargets(world);
        if (!targets?.component || !hasFinitePoint(targets?.componentAnchor)) {
          return null;
        }
        const targetId = String(targets.component.id ?? "").trim();
        return {
          type: "PP",
          x: targets.componentAnchor.x,
          y: targets.componentAnchor.y,
          name: `P(${targetId})`,
          value: targetId
        };
      }
      return null;
    };

    const resolveProbePlacementType = (toolType, event) => {
      const normalized = String(toolType ?? "").toUpperCase();
      if (normalized !== "PV") {
        return normalized;
      }
      if (state.probeDiffStart) {
        return "PD";
      }
      if (event?.shiftKey) {
        return "PD";
      }
      if (event?.altKey) {
        return "PP";
      }
      return "PV";
    };

    const handlePointerDownPlaceMode = (world, event) => {
      if (isSelectionPlacementMode()) {
        commitSelectionPlacement(world);
        return;
      }
      const toolType = String(state.tool?.type ?? "").toUpperCase();
      const probeType = resolveProbePlacementType(toolType, event);
      const probePlacement = isProbeComponentType(toolType)
        ? createProbeFromTool(probeType, world)
        : null;
      if (isProbeComponentType(toolType) && !probePlacement) {
        return;
      }
      const placedSpec = probePlacement ?? {
        type: state.tool.type,
        x: world.x,
        y: world.y,
        transform: state.placeTransform
      };
      if (probePlacement) {
        const placedType = String(probePlacement?.type ?? "").toUpperCase();
        if (placedType !== "PD") {
          placedSpec.transform = state.placeTransform;
        }
      }
      const placed = addComponent(placedSpec);
      if (!placed) {
        return;
      }
      const latest = state.model.components[state.model.components.length - 1];
      if (latest) {
        setSelection(latest.id);
        const latestType = String(latest.type ?? "").toUpperCase();
        if (latestType === "NET" || latestType === "TEXT") {
          invokeComponentEdit(latest);
        }
      }
    };

    const handlePointerDownWireMode = (world) => {
      let hit = hitTestNode(world);
      if (!hit) {
        const wireHit = hitTestWireSegment(world);
        if (wireHit) {
          const junction = getWireSegmentPoint(wireHit, world);
          if (junction) {
            const inserted = insertWirePoint(junction.wire, junction.segmentIndex + 1, junction);
            if (inserted) {
              hit = { point: { x: inserted.x, y: inserted.y }, wire: junction.wire };
            }
          }
        }
      }
      const fallbackPoint = hit ? null : snapPoint(world);
      if (!hit && !fallbackPoint) {
        state.wireStart = null;
        state.wirePreview = null;
        renderOverlay();
        return;
      }
      const targetPoint = hit ? hit.point : fallbackPoint;
      const clickedEmptySpace = !hit;
      const preserveEndpoint = Boolean(hit);
      if (!state.wireStart) {
        state.wireStart = { ...targetPoint, preserveEndpoint };
        state.wirePreview = null;
        renderOverlay();
        return;
      }
      const points = createWirePoints(state.wireStart, targetPoint, state.grid.snap ? state.grid.size : 0, {
        preserveStart: state.wireStart.preserveEndpoint === true,
        preserveEnd: preserveEndpoint
      });
      addWire({ points }, {
        preserveEndpoints: {
          start: state.wireStart.preserveEndpoint === true,
          end: preserveEndpoint
        }
      });
      state.wireStart = clickedEmptySpace ? { ...targetPoint, preserveEndpoint: false } : null;
      state.wirePreview = null;
      renderOverlay();
    };

    const hasAdditiveSelectModifier = (event) => Boolean(event?.shiftKey || event?.ctrlKey || event?.metaKey);

    const handlePointerDownCtrlWireSelection = (event, world) => {
      if (!event.ctrlKey && !event.metaKey) {
        return false;
      }
      const wireHit = hitTestWireSegment(world);
      if (!wireHit) {
        return false;
      }
      state.lastSelectClick = null;
      if (event.shiftKey) {
        toggleWireSelection(wireHit.wire.id, { preserveComponents: true });
      } else if (event.ctrlKey || event.metaKey) {
        const nextWireIds = new Set(state.wireSelections ?? []);
        if (state.wireSelection) {
          nextWireIds.add(String(state.wireSelection));
        }
        nextWireIds.add(String(wireHit.wire.id));
        setSelectionWithWires(state.selectionIds, Array.from(nextWireIds), { preserveComponents: true });
      } else {
        setWireSelection(wireHit.wire.id);
      }
      return true;
    };

    const handlePointerDownSelectMode = (event, world, labelComponent) => {
      if (state.tool.mode !== "select") {
        return false;
      }
      const endpointHit = !labelComponent && !event.altKey && !event.ctrlKey && !event.metaKey
        ? hitTestDifferentialProbeEndpoint(world, { preferIds: state.selectionIds })
        : null;
      if (endpointHit?.component) {
        beginProbeDiffEndpointDrag(endpointHit.component, endpointHit.pinId, {
          additive: hasAdditiveSelectModifier(event),
          startWorld: world,
          startClientX: event.clientX,
          startClientY: event.clientY
        });
        return true;
      }
      const hit = labelComponent || hitTestComponent(world, { preferIds: state.selectionIds });
      if (hit) {
        const wasSelectedBeforePointerDown = state.selectionIds.includes(hit.id);
        const hitType = String(hit?.type ?? "").toUpperCase();
        if (hitType === "PD" && !event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey) {
          const selectedPinIds = getProbeDiffSelectedPinIds(hit.id);
          const hasBothSelected = selectedPinIds.has("P+") && selectedPinIds.has("P-");
          if (!hasBothSelected) {
            const geometry = getDifferentialProbeGeometry(hit);
            if (geometry) {
              const plusDx = world.x - geometry.posTip.x;
              const plusDy = world.y - geometry.posTip.y;
              const minusDx = world.x - geometry.negTip.x;
              const minusDy = world.y - geometry.negTip.y;
              const plusDist = (plusDx * plusDx) + (plusDy * plusDy);
              const minusDist = (minusDx * minusDx) + (minusDy * minusDy);
              const nearestPinId = minusDist < plusDist ? "P-" : "P+";
              beginProbeDiffEndpointDrag(hit, nearestPinId, {
                startWorld: world,
                startClientX: event.clientX,
                startClientY: event.clientY
              });
              return true;
            }
          }
        }
        if (event.altKey) {
          const selectedWireIds = [state.wireSelection, ...(state.wireSelections ?? [])].filter(Boolean);
          if (!state.selectionIds.includes(hit.id) || state.selectionIds.length === 0) {
            setSelectionWithWires([hit.id], state.wireSelections, { preserveComponents: true });
          }
          const duplicated = duplicateSelection({ offset: 0, wireIds: selectedWireIds });
          let dragWireIds = duplicated?.wireIds ?? [];
          if (selectedWireIds.length && !dragWireIds.length) {
            const fallbackWireIds = duplicateWireIds(selectedWireIds, 0);
            if (fallbackWireIds.length) {
              dragWireIds = fallbackWireIds;
              setSelectionWithWires(state.selectionIds, fallbackWireIds, { preserveComponents: true });
            }
          }
          const duplicate = getComponent(state.selectionIds[0]);
          if (duplicate) {
            beginDrag(duplicate, world, {
              startClientX: event.clientX,
              startClientY: event.clientY,
              trackWires: false,
              ignoreWireLocks: true,
              wireIds: dragWireIds
            });
          }
          return true;
        }
        if (hasAdditiveSelectModifier(event)) {
          const nextSelection = wasSelectedBeforePointerDown
            ? state.selectionIds.filter((id) => id !== hit.id)
            : [...state.selectionIds, hit.id];
          setSelectionWithWires(nextSelection, state.wireSelections, { preserveComponents: true });
        } else if (!wasSelectedBeforePointerDown) {
          setSelection([hit.id]);
        }
        beginDrag(hit, world, {
          startClientX: event.clientX,
          startClientY: event.clientY,
          wasSelectedBeforePointerDown
        });
        return true;
      }
      state.lastSelectClick = null;
      const wireNodeKey = event.target?.getAttribute?.("data-wire-node");
      if (wireNodeKey !== null && wireNodeKey !== undefined) {
        beginWireNodeDrag(wireNodeKey, world);
        return true;
      }
      const wireHandle = event.target?.getAttribute?.("data-wire-handle");
      if (wireHandle !== null && wireHandle !== undefined) {
        const wireId = event.target?.getAttribute?.("data-wire-id");
        beginWireHandleDrag(wireId, wireHandle, world);
        return true;
      }
      return false;
    };

    const handlePointerDownFallbackSelection = (event, world) => {
      const wireHit = hitTestWireSegment(world);
      if (wireHit) {
        state.lastSelectClick = null;
        if (hasAdditiveSelectModifier(event)) {
          toggleWireSelection(wireHit.wire.id, { preserveComponents: true });
        } else {
          setWireSelection(wireHit.wire.id);
        }
        return;
      }
      if (isTouchPointer(event) && state.tool.mode === "select" && !hasAdditiveSelectModifier(event)) {
        state.lastSelectClick = null;
        beginPan(event, { clearSelectionOnTap: true });
        return;
      }
      state.selectionBox = {
        start: world,
        end: world,
        additive: hasAdditiveSelectModifier(event),
        moved: false,
        mode: "contain"
      };
      state.lastSelectClick = null;
      if (!hasAdditiveSelectModifier(event)) {
        setWireSelection(null);
      }
      renderOverlay();
    };

    const handlePointerDown = (event) => {
      trackTouchPointer(event);
      captureTouchPointer(event);
      if (state.touchPinch && state.touchPointers.size !== 2) {
        state.touchPinch = null;
      }
      if (beginTouchPinchIfEligible()) {
        event.preventDefault();
        return;
      }
      if (event.button !== 0) {
        state.lastSelectClick = null;
        return;
      }
      const world = clientToWorld(event.clientX, event.clientY);
      if (!world) {
        return;
      }
      const labelComponentId = event.target?.getAttribute?.("data-component-id");
      const labelComponent = labelComponentId ? getComponent(labelComponentId) : null;
      if (state.tool.mode === "place") {
        state.lastSelectClick = null;
        handlePointerDownPlaceMode(world, event);
        return;
      }
      if (state.tool.mode === "wire") {
        state.lastSelectClick = null;
        handlePointerDownWireMode(world);
        return;
      }
      if (handlePointerDownCtrlWireSelection(event, world)) {
        return;
      }
      if (handlePointerDownSelectMode(event, world, labelComponent)) {
        return;
      }
      handlePointerDownFallbackSelection(event, world);
    };

    const handlePointerMoveActiveGesture = (event) => {
      if (updateTouchPinch(event)) {
        return true;
      }
      if (state.pan) {
        updatePan(event);
        return true;
      }
      if (state.probeDiffEndpointDrag) {
        const world = clientToWorld(event.clientX, event.clientY);
        if (!world) {
          return true;
        }
        updateProbeDiffEndpointDrag(world, event);
        return true;
      }
      if (state.wireNode) {
        const world = clientToWorld(event.clientX, event.clientY);
        if (!world) {
          return true;
        }
        updateWireNodeDrag(world);
        return true;
      }
      if (state.wireHandle) {
        const world = clientToWorld(event.clientX, event.clientY);
        if (!world) {
          return true;
        }
        updateWireHandleDrag(world);
        return true;
      }
      if (state.selectionBox) {
        const world = clientToWorld(event.clientX, event.clientY);
        if (!world) {
          return true;
        }
        state.selectionBox.end = world;
        state.selectionBox.moved = true;
        state.selectionBox.mode = world.x < state.selectionBox.start.x ? "touch" : "contain";
        renderOverlay();
        return true;
      }
      if (state.drag) {
        const world = clientToWorld(event.clientX, event.clientY);
        if (!world) {
          return true;
        }
        updateDrag(world, event);
        return true;
      }
      return false;
    };

    const handlePointerMoveToolMode = (event) => {
      if (state.tool.mode === "place") {
        const world = clientToWorld(event.clientX, event.clientY);
        if (!world) {
          return true;
        }
        if (isSelectionPlacementMode()) {
          setSelectionPlacementPosition(world);
          return true;
        }
        if (String(state.tool.type ?? "").toUpperCase() === "PV" && state.probeDiffStart) {
          const previewPoint = resolveProbeNodePoint(world) ?? snapPoint(world) ?? { x: world.x, y: world.y };
          state.probeDiffPreview = { x: previewPoint.x, y: previewPoint.y };
        } else if (state.probeDiffPreview) {
          state.probeDiffPreview = null;
        }
        setPreviewFromPoint(state.tool.type, world);
        return true;
      }
      if (state.tool.mode === "wire") {
        if (state.wireStart) {
          const world = clientToWorld(event.clientX, event.clientY);
          if (!world) {
            return true;
          }
          setWirePreviewFromPoint(world);
          return true;
        }
        clearWirePreview();
      }
      return false;
    };

    const updateHoverFromPointerMove = (event) => {
      clearPreview();
      const labelComponentId = event?.target?.getAttribute?.("data-component-id");
      if (state.tool.mode === "select" && labelComponentId) {
        const component = getComponent(labelComponentId);
        if (component) {
          setHoverTarget({ componentId: component.id });
          return;
        }
      }
      const hoverWorld = clientToWorld(event.clientX, event.clientY);
      if (state.tool.mode === "select" && hoverWorld) {
        const componentHit = hitTestComponent(hoverWorld);
        if (componentHit?.id) {
          setHoverTarget({ componentId: componentHit.id });
          return;
        }
        const wireHit = hitTestWireSegment(hoverWorld);
        if (wireHit?.wire?.id) {
          setHoverTarget({ wireId: wireHit.wire.id });
          return;
        }
        setHoverTarget(null);
      } else if (state.hoveredComponentId || state.hoveredWireId) {
        setHoverTarget(null);
      }
    };

    const handlePointerMove = (event) => {
      updateTrackedTouchPointer(event);
      if (handlePointerMoveActiveGesture(event)) {
        return;
      }
      if (handlePointerMoveToolMode(event)) {
        return;
      }
      updateHoverFromPointerMove(event);
    };

    const finalizeSelectionBox = () => {
      if (!state.selectionBox) {
        return;
      }
      const box = state.selectionBox;
      state.selectionBox = null;
      if (box.moved) {
        const minX = Math.min(box.start.x, box.end.x);
        const minY = Math.min(box.start.y, box.end.y);
        const maxX = Math.max(box.start.x, box.end.x);
        const maxY = Math.max(box.start.y, box.end.y);
        const pointInsideBox = (point) =>
          point
          && Number.isFinite(point.x)
          && Number.isFinite(point.y)
          && point.x >= minX
          && point.x <= maxX
          && point.y >= minY
          && point.y <= maxY;
        const selected = [];
        const selectedWires = [];
        const isTouch = box.mode === "touch";
        const components = Array.isArray(state.model?.components) ? state.model.components : [];
        components.forEach((component) => {
          const bounds = getComponentBounds(component, 10, state.probeLabels);
          if (!bounds) {
            return;
          }
          const contains = bounds.minX >= minX
            && bounds.maxX <= maxX
            && bounds.minY >= minY
            && bounds.maxY <= maxY;
          const intersects = bounds.minX <= maxX
            && bounds.maxX >= minX
            && bounds.minY <= maxY
            && bounds.maxY >= minY;
          if (isTouch ? intersects : contains) {
            selected.push(component.id);
          }
        });
        const wires = Array.isArray(state.model?.wires) ? state.model.wires : [];
        wires.forEach((wire) => {
          const bounds = getWireBounds(wire);
          if (!bounds) {
            return;
          }
          const contains = bounds.minX >= minX
            && bounds.maxX <= maxX
            && bounds.minY >= minY
            && bounds.maxY <= maxY;
          const intersects = bounds.minX <= maxX
            && bounds.maxX >= minX
            && bounds.minY <= maxY
            && bounds.maxY >= minY;
          if (isTouch ? intersects : contains) {
            selectedWires.push(wire.id);
          }
        });
        const applyDifferentialEndpointBoxSelection = (componentIds) => {
          const ids = Array.isArray(componentIds) ? componentIds : [];
          const selectedPd = ids
            .map((id) => getComponent(id))
            .filter((component) => String(component?.type ?? "").toUpperCase() === "PD");
          if (selectedPd.length !== 1) {
            if (!box.additive) {
              clearProbeDiffEndpointSelection();
            }
            return;
          }
          const target = selectedPd[0];
          const geometry = getDifferentialProbeGeometry(target);
          if (!geometry) {
            if (!box.additive) {
              clearProbeDiffEndpointSelection();
            }
            return;
          }
          if (!pointInsideBox(geometry.posTip) || !pointInsideBox(geometry.negTip)) {
            if (!box.additive) {
              clearProbeDiffEndpointSelection();
            }
            return;
          }
          setProbeDiffEndpointSelection(target.id, "P+");
          setProbeDiffEndpointSelection(target.id, "P-", { additive: true });
        };
        if (box.additive) {
          const merged = new Set(state.selectionIds);
          selected.forEach((id) => merged.add(id));
          const mergedWires = new Set(state.wireSelections);
          selectedWires.forEach((id) => mergedWires.add(id));
          const mergedComponentIds = Array.from(merged);
          setSelectionWithWires(mergedComponentIds, Array.from(mergedWires));
          applyDifferentialEndpointBoxSelection(mergedComponentIds);
        } else {
          setSelectionWithWires(selected, selectedWires);
          applyDifferentialEndpointBoxSelection(selected);
        }
      } else if (!box.additive) {
        setSelectionWithWires([], []);
      }
      renderOverlay();
    };

    const handlePointerUp = (event) => {
      releaseTouchPointerCapture(getPointerId(event));
      untrackTouchPointer(event);
      endTouchPinch(event);
      if (state.pan) {
        if (state.pan.clearSelectionOnTap && !state.pan.moved) {
          setSelectionWithWires([], []);
        }
        endPan(event);
      }
      if (state.probeDiffEndpointDrag) {
        endProbeDiffEndpointDrag(event);
      }
      if (state.drag) {
        endDrag(event);
      }
      if (state.wireNode) {
        endWireNodeDrag();
      }
      if (state.wireHandle) {
        endWireHandleDrag();
      }
      finalizeSelectionBox();
    };

    const handleWheel = (event) => {
      if (!event) {
        return;
      }
      event.preventDefault();
      const world = clientToWorld(event.clientX, event.clientY);
      if (!world) {
        return;
      }
      const zoomFactor = event.deltaY < 0 ? 0.9 : 1.1;
      const newWidth = Math.max(MIN_VIEW_WIDTH, Math.min(MAX_VIEW_WIDTH, state.view.width * zoomFactor));
      const newHeight = Math.max(MIN_VIEW_HEIGHT, Math.min(MAX_VIEW_HEIGHT, state.view.height * zoomFactor));
      const scaleX = newWidth / state.view.width;
      const scaleY = newHeight / state.view.height;
      state.view.x = world.x - (world.x - state.view.x) * scaleX;
      state.view.y = world.y - (world.y - state.view.y) * scaleY;
      state.view.width = newWidth;
      state.view.height = newHeight;
      notifyViewChange();
      render();
    };

    const resolveDragType = (event) => {
      const dataTransfer = event?.dataTransfer;
      const typeFromTransfer = dataTransfer?.getData("application/x-spjutsim-component")
        || dataTransfer?.getData("text/plain");
      const detailType = event?.detail?.type;
      const type = typeFromTransfer || detailType || state.dragType;
      return String(type || "").toUpperCase();
    };

    const clearPreview = () => {
      if (!state.preview) {
        return;
      }
      state.preview = null;
      renderOverlay();
    };

    const clearWirePreview = () => {
      if (!state.wirePreview) {
        return;
      }
      state.wirePreview = null;
      renderOverlay();
    };

    const cancelWirePlacement = () => {
      if (!state.wireStart && !state.wirePreview) {
        return false;
      }
      state.wireStart = null;
      state.wirePreview = null;
      renderOverlay();
      return true;
    };

    const setPreviewFromPoint = (type, world) => {
      if (!type || !world) {
        clearPreview();
        return;
      }
      const snapped = snapPoint(world);
      state.preview = {
        type,
        position: { x: world.x, y: world.y },
        snapped
      };
      renderOverlay();
    };

    const isSelectionPlacementMode = () =>
      state.tool.mode === "place" && isSelectionPlacementToolType(state.tool.type);

    const normalizeIdList = (values) => Array.from(new Set(
      (Array.isArray(values) ? values : [values])
        .map((entry) => String(entry ?? "").trim())
        .filter(Boolean)
    ));

    const clonePlacementComponentTemplate = (component, anchor) => {
      if (!component || !Array.isArray(component.pins) || !component.pins.length) {
        return null;
      }
      return {
        type: component.type,
        name: Object.prototype.hasOwnProperty.call(component, "name")
          ? String(component.name ?? "")
          : String(component.id ?? ""),
        value: component.value ?? "",
        ...(Object.prototype.hasOwnProperty.call(component, "netColor")
          ? { netColor: component.netColor ?? "" }
          : {}),
        ...(Object.prototype.hasOwnProperty.call(component, "textOnly")
          ? { textOnly: component.textOnly === true }
          : {}),
        ...(Object.prototype.hasOwnProperty.call(component, "textFont")
          ? { textFont: String(component.textFont ?? "") }
          : {}),
        ...(Object.prototype.hasOwnProperty.call(component, "textSize")
          ? { textSize: Number(component.textSize) }
          : {}),
        ...(Object.prototype.hasOwnProperty.call(component, "textBold")
          ? { textBold: component.textBold === true }
          : {}),
        ...(Object.prototype.hasOwnProperty.call(component, "textItalic")
          ? { textItalic: component.textItalic === true }
          : {}),
        ...(Object.prototype.hasOwnProperty.call(component, "textUnderline")
          ? { textUnderline: component.textUnderline === true }
          : {}),
        ...(Object.prototype.hasOwnProperty.call(component, "probeDiffRotations")
          ? {
            probeDiffRotations: {
              "P+": Number(component?.probeDiffRotations?.["P+"]),
              "P-": Number(component?.probeDiffRotations?.["P-"])
            }
          }
          : {}),
        rotation: component.rotation,
        labelRotation: component.labelRotation,
        pins: component.pins.map((pin) => ({
          id: pin.id,
          name: pin.name,
          x: pin.x - anchor.x,
          y: pin.y - anchor.y
        }))
      };
    };

    const clonePlacementWireTemplate = (wire, anchor) => {
      const points = Array.isArray(wire?.points) ? wire.points : [];
      if (points.length < 2) {
        return null;
      }
      return {
        points: points.map((point) => ({
          x: point.x - anchor.x,
          y: point.y - anchor.y
        }))
      };
    };

    const buildSelectionPlacementTemplates = (options) => {
      const componentIds = normalizeIdList(
        Array.isArray(options?.componentIds) ? options.componentIds : state.selectionIds
      );
      const wireIds = normalizeIdList(
        Array.isArray(options?.wireIds) ? options.wireIds : [state.wireSelection, ...(state.wireSelections ?? [])]
      );
      const components = componentIds
        .map((id) => getComponent(id))
        .filter((component) => Boolean(component));
      const wires = wireIds
        .map((id) => getWire(id))
        .filter((wire) => Boolean(wire));
      if (!components.length && !wires.length) {
        return null;
      }
      const points = [];
      components.forEach((component) => {
        (component.pins ?? []).forEach((pin) => {
          if (Number.isFinite(pin.x) && Number.isFinite(pin.y)) {
            points.push({ x: pin.x, y: pin.y });
          }
        });
      });
      wires.forEach((wire) => {
        (wire.points ?? []).forEach((point) => {
          if (Number.isFinite(point.x) && Number.isFinite(point.y)) {
            points.push({ x: point.x, y: point.y });
          }
        });
      });
      if (!points.length) {
        return null;
      }
      const minX = Math.min(...points.map((point) => point.x));
      const maxX = Math.max(...points.map((point) => point.x));
      const minY = Math.min(...points.map((point) => point.y));
      const maxY = Math.max(...points.map((point) => point.y));
      const anchor = {
        x: (minX + maxX) / 2,
        y: (minY + maxY) / 2
      };
      const componentTemplates = components
        .map((component) => clonePlacementComponentTemplate(component, anchor))
        .filter((component) => Boolean(component));
      const wireTemplates = wires
        .map((wire) => clonePlacementWireTemplate(wire, anchor))
        .filter((wire) => Boolean(wire));
      if (!componentTemplates.length && !wireTemplates.length) {
        return null;
      }
      return {
        components: componentTemplates,
        wires: wireTemplates
      };
    };

    const resolvePlacementPosition = (world, snapEnabled) => {
      if (!world || !Number.isFinite(world.x) || !Number.isFinite(world.y)) {
        return null;
      }
      if (snapEnabled && state.grid.snap && state.grid.size > 0) {
        const snapped = snapPoint(world);
        if (snapped) {
          return { x: snapped.x, y: snapped.y };
        }
      }
      return { x: world.x, y: world.y };
    };

    const transformPlacementOffset = (point, transform) => {
      const matrix = cloneTransform(transform);
      return {
        x: matrix.a * point.x + matrix.b * point.y,
        y: matrix.c * point.x + matrix.d * point.y
      };
    };

    const mapSelectionPlacementPoint = (point, position, transform, snapEnabled) => {
      const transformed = transformPlacementOffset(point, transform);
      let x = position.x + transformed.x;
      let y = position.y + transformed.y;
      if (snapEnabled && state.grid.snap && state.grid.size > 0) {
        x = snapCoord(x);
        y = snapCoord(y);
      }
      return { x, y };
    };

    const isExactTransform = (transform, matrix) =>
      transform
      && matrix
      && transform.a === matrix.a
      && transform.b === matrix.b
      && transform.c === matrix.c
      && transform.d === matrix.d;

    const resolveSinglePinPlacementRotation = (type, baseRotation, transform) => {
      const normalizedBase = snapRotation(Number(baseRotation ?? 0));
      if (isIdentityTransform(transform)) {
        return normalizedBase;
      }
      if (isProbeComponentType(type)) {
        const baseTip = getProbeTipPoint(normalizedBase);
        const transformedTip = {
          x: transform.a * baseTip.x + transform.b * baseTip.y,
          y: transform.c * baseTip.x + transform.d * baseTip.y
        };
        const probeRotations = [0, 90, 180, 270];
        let bestRotation = normalizedBase;
        let bestDistanceSq = Number.POSITIVE_INFINITY;
        probeRotations.forEach((candidate) => {
          const candidateTip = getProbeTipPoint(candidate);
          const dx = candidateTip.x - transformedTip.x;
          const dy = candidateTip.y - transformedTip.y;
          const distanceSq = (dx * dx) + (dy * dy);
          if (distanceSq < bestDistanceSq) {
            bestDistanceSq = distanceSq;
            bestRotation = candidate;
          }
        });
        if (bestDistanceSq <= 1e-6) {
          return bestRotation;
        }
        if (isExactTransform(transform, FLIP_H)) {
          return getProbeFlippedRotation(normalizedBase, "h");
        }
        if (isExactTransform(transform, FLIP_V)) {
          return getProbeFlippedRotation(normalizedBase, "v");
        }
      } else if (String(type ?? "").toUpperCase() === "GND") {
        if (isExactTransform(transform, FLIP_H)) {
          return getGroundFlippedRotation(normalizedBase, "h");
        }
        if (isExactTransform(transform, FLIP_V)) {
          return getGroundFlippedRotation(normalizedBase, "v");
        }
      } else if (isExactTransform(transform, FLIP_H) || isExactTransform(transform, FLIP_V)) {
        return normalizeRotation(normalizedBase + 180);
      }
      return normalizeRotation(normalizedBase + getTransformRotation(transform));
    };

    const setSelectionPlacementPosition = (world) => {
      if (!state.selectionPlacement || !world) {
        return;
      }
      state.selectionPlacement.position = {
        x: world.x,
        y: world.y
      };
      renderOverlay();
    };

    const startSelectionPlacement = (options) => {
      const templates = buildSelectionPlacementTemplates(options);
      if (!templates) {
        return null;
      }
      const defaultPosition = {
        x: state.view.x + state.view.width / 2,
        y: state.view.y + state.view.height / 2
      };
      const initialPosition = resolvePlacementPosition(options?.position ?? defaultPosition, false) ?? defaultPosition;
      state.tool = { mode: "place", type: SELECTION_PLACEMENT_TOOL };
      state.placeTransform = { ...IDENTITY_TRANSFORM };
      state.preview = null;
      state.selectionPlacement = {
        components: templates.components,
        wires: templates.wires,
        position: initialPosition
      };
      state.wireStart = null;
      state.wirePreview = null;
      state.probeDiffStart = null;
      state.probeDiffPreview = null;
      state.lastSelectClick = null;
      setSelectionWithWires([], []);
      renderOverlay();
      return {
        componentCount: templates.components.length,
        wireCount: templates.wires.length
      };
    };

    const commitSelectionPlacement = (world) => {
      const placement = state.selectionPlacement;
      if (!placement) {
        return null;
      }
      const position = resolvePlacementPosition(world, true)
        ?? resolvePlacementPosition(placement.position, true);
      if (!position) {
        return null;
      }
      const transform = cloneTransform(state.placeTransform);
      const result = commitModelMutation(() => {
        const newComponentIds = [];
        const newWireIds = [];
        (placement.components ?? []).forEach((template) => {
          if (!template || !Array.isArray(template.pins) || !template.pins.length || typeof api.addComponent !== "function") {
            return;
          }
          const pins = template.pins.map((pin) => {
            const mapped = mapSelectionPlacementPoint(pin, position, transform, true);
            return {
              id: pin.id,
              name: pin.name,
              x: mapped.x,
              y: mapped.y
            };
          });
          const clone = {
            id: nextRefDes(template.type),
            name: String(template.name ?? ""),
            type: template.type,
            value: template.value ?? "",
            ...(Object.prototype.hasOwnProperty.call(template, "netColor")
              ? { netColor: template.netColor ?? "" }
              : {}),
            ...(Object.prototype.hasOwnProperty.call(template, "textOnly")
              ? { textOnly: template.textOnly === true }
              : {}),
            ...(Object.prototype.hasOwnProperty.call(template, "textFont")
              ? { textFont: String(template.textFont ?? "") }
              : {}),
            ...(Object.prototype.hasOwnProperty.call(template, "textSize")
              ? { textSize: Number(template.textSize) }
              : {}),
            ...(Object.prototype.hasOwnProperty.call(template, "textBold")
              ? { textBold: template.textBold === true }
              : {}),
            ...(Object.prototype.hasOwnProperty.call(template, "textItalic")
              ? { textItalic: template.textItalic === true }
              : {}),
            ...(Object.prototype.hasOwnProperty.call(template, "textUnderline")
              ? { textUnderline: template.textUnderline === true }
              : {}),
            ...(Object.prototype.hasOwnProperty.call(template, "probeDiffRotations")
              ? {
                probeDiffRotations: {
                  "P+": Number(template?.probeDiffRotations?.["P+"]),
                  "P-": Number(template?.probeDiffRotations?.["P-"])
                }
              }
              : {}),
            pins,
            rotation: template.rotation,
            labelRotation: template.labelRotation
          };
          if (pins.length === 1) {
            clone.rotation = resolveSinglePinPlacementRotation(clone.type, template.rotation, transform);
          }
          const normalized = api.addComponent(state.model, clone);
          if (!normalized) {
            return;
          }
          syncCounters(normalized);
          newComponentIds.push(normalized.id);
        });
        (placement.wires ?? []).forEach((template) => {
          if (!template || !Array.isArray(template.points) || template.points.length < 2) {
            return;
          }
          const points = template.points.map((point) => mapSelectionPlacementPoint(point, position, transform, true));
          const normalized = addWireInternal({ points });
          if (!normalized) {
            return;
          }
          newWireIds.push(normalized.id);
        });
        setSelectionWithWires(newComponentIds, newWireIds);
        return {
          componentIds: newComponentIds.slice(),
          wireIds: newWireIds.slice()
        };
      }, { notifySelection: true });
      if (!result) {
        return null;
      }
      state.selectionPlacement = null;
      setTool("select");
      return result;
    };

    const setWirePreviewFromPoint = (world) => {
      if (!state.wireStart || !world) {
        clearWirePreview();
        return;
      }
      const degrees = getWirePointDegrees();
      const hit = hitTestNode(world);
      let target = null;
      let junctionPreview = null;
      if (hit) {
        target = hit.point;
        const degree = degrees.get(pointKey(target)) ?? 0;
        if (degree >= 2) {
          junctionPreview = [{ x: target.x, y: target.y }];
        }
      } else {
        const wireHit = hitTestWireSegment(world);
        if (wireHit) {
          const junction = getWireSegmentPoint(wireHit, world);
          if (junction) {
            target = { x: junction.x, y: junction.y };
            const degree = degrees.get(pointKey(target)) ?? 0;
            if (degree >= 2 || !isWireEndpoint(wireHit.wire, junction)) {
              junctionPreview = [{ x: target.x, y: target.y }];
            }
          }
        }
      }
      if (!target) {
        target = { x: world.x, y: world.y };
      }
      state.wirePreview = {
        points: createWirePreviewPoints(state.wireStart, target),
        junctions: junctionPreview
      };
      renderOverlay();
    };

    const updatePreview = (event) => {
      const type = resolveDragType(event);
      if (!type) {
        clearPreview();
        return;
      }
      const world = clientToWorld(event.clientX, event.clientY);
      setPreviewFromPoint(type, world);
    };

    const handleDragOver = (event) => {
      if (event) {
        event.preventDefault();
      }
      updatePreview(event);
    };

    const handleDrop = (event) => {
      if (!event) {
        return;
      }
      event.preventDefault();
      const type = resolveDragType(event);
      if (!type) {
        return;
      }
      const world = clientToWorld(event.clientX, event.clientY);
      if (!world) {
        return;
      }
      const placed = addComponent({ type, x: world.x, y: world.y, transform: state.placeTransform });
      if (placed) {
        setSelection(placed.id);
      }
      clearPreview();
    };

    svg.addEventListener("pointerdown", handlePointerDown);
    svg.addEventListener("pointermove", handlePointerMove);
    svg.addEventListener("pointerup", handlePointerUp);
    svg.addEventListener("pointercancel", handlePointerUp);
    svg.addEventListener("pointerleave", (event) => {
      handlePointerUp(event);
      clearPreview();
      clearWirePreview();
      setHoverTarget(null);
    });
    svg.addEventListener("wheel", handleWheel, { passive: false });
    svg.addEventListener("dblclick", handleDoubleClick);
    svg.addEventListener("dragover", handleDragOver);
    svg.addEventListener("drop", handleDrop);
    svg.addEventListener("dragleave", clearPreview);
    svg.addEventListener("contextmenu", (event) => event.preventDefault());

    if (typeof ResizeObserver !== "undefined") {
      const viewportResizeObserver = new ResizeObserver(() => {
        scheduleRender();
      });
      viewportResizeObserver.observe(container);
      viewportResizeObserver.observe(svg);
      svg._viewportResizeObserver = viewportResizeObserver;
    }

    render();

    return {
      addComponent,
      addWire,
      getModel: () => state.model,
      render,
      setTool,
      getTool: () => ({ ...state.tool }),
      getView,
      setView,
      resetView,
      setGrid,
      setMeasurements,
      setProbeLabels,
      setExternalHighlights,
      getGrid,
      setSelection,
      setSelectionWithWires,
      selectWire: (wireId) => {
        setWireSelection(wireId);
      },
      getWireSelection: () => state.wireSelection,
      getWireSelections: () => state.wireSelections.slice(),
      getSelection: () => state.selectionIds.slice(),
      updateComponent,
      rotateSelection,
      rotatePlacement,
      flipSelection,
      flipPlacement,
      deleteSelection,
      duplicateSelection,
      startSelectionPlacement,
      simplifyWires,
      regridToCurrentGrid,
      moveWireSegment,
      undo,
      redo,
      cancelWirePlacement,
      setDragType: (type) => {
        state.dragType = type ? String(type).toUpperCase() : null;
      }
    };
  };

  const api = typeof self !== "undefined" ? (self.SpjutSimSchematic ?? {}) : {};
  api.createEditor = createEditor;
  api.renderSymbolIcon = renderSymbolIcon;
  if (typeof self !== "undefined") {
    self.SpjutSimSchematic = api;
  }
})();

