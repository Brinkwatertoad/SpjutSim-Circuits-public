/**
 * @typedef {{ id: string, name?: string, type: string, value?: string, netColor?: string, textOnly?: boolean, textFont?: string, textSize?: number, textBold?: boolean, textItalic?: boolean, textUnderline?: boolean, rotation?: number, labelRotation?: number, probeDiffRotations?: { "P+"?: number, "P-"?: number }, pins: { id: string, name: string, x: number, y: number }[] }} Component
 * @typedef {{ components: Component[], wires: { id: string, points: { x: number, y: number }[] }[] }} SchematicModel
 */

(function initSchematicExport() {
  const SVG_NS = "http://www.w3.org/2000/svg";
  const STROKE = "#1d1d1f";
  const PROBE_INVALID_COLOR = "#da1e28";
  const STROKE_WIDTH = 2;
  const CANVAS_BG = "#fbfaf7";
  const DEFAULT_EXPORT_WIDTH = 400;
  const DEFAULT_EXPORT_HEIGHT = 260;
  const DEFAULT_EXPORT_PADDING = 16;
  const WIRE_PADDING = 4;
  const FONT_FAMILY = "\"Segoe UI\", Tahoma, sans-serif";
  const schematicApi = typeof self !== "undefined" ? (self.SpjutSimSchematic ?? {}) : {};

  const normalizeNetColorValue = (value) => {
    if (typeof schematicApi?.normalizeNetColor !== "function") {
      return null;
    }
    return schematicApi.normalizeNetColor(value);
  };

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

  const setAttrs = (el, attrs) => {
    Object.entries(attrs).forEach(([key, value]) => {
      el.setAttribute(key, String(value));
    });
    return el;
  };

  const expandBounds = (bounds, minX, minY, maxX, maxY) => {
    if (!bounds) {
      return { minX, minY, maxX, maxY };
    }
    return {
      minX: Math.min(bounds.minX, minX),
      minY: Math.min(bounds.minY, minY),
      maxX: Math.max(bounds.maxX, maxX),
      maxY: Math.max(bounds.maxY, maxY)
    };
  };

  const padBounds = (bounds, padding) => {
    if (!bounds) {
      return null;
    }
    const pad = Number.isFinite(padding) ? padding : 0;
    return {
      minX: bounds.minX - pad,
      minY: bounds.minY - pad,
      maxX: bounds.maxX + pad,
      maxY: bounds.maxY + pad
    };
  };

  const measureTextWidth = (() => {
    let ctx = null;
    return (text, size, weight, family) => {
      if (!text) {
        return 0;
      }
      if (!ctx) {
        const canvas = document.createElement("canvas");
        ctx = canvas.getContext("2d");
      }
      if (!ctx) {
        return text.length * size * 0.6;
      }
      const safeWeight = Number.isFinite(weight) ? weight : 400;
      const safeFamily = String(family ?? FONT_FAMILY).trim() || FONT_FAMILY;
      const familyToken = safeFamily.includes(",") ? safeFamily : `"${safeFamily}"`;
      ctx.font = `${safeWeight} ${size}px ${familyToken}`;
      return ctx.measureText(text).width;
    };
  })();

  const getTextBounds = (x, y, text, size, anchor, weight) => {
    if (!text) {
      return null;
    }
    const width = measureTextWidth(text, size, weight);
    let minX = x;
    let maxX = x;
    if (anchor === "middle") {
      minX = x - width / 2;
      maxX = x + width / 2;
    } else if (anchor === "end") {
      minX = x - width;
      maxX = x;
    } else {
      minX = x;
      maxX = x + width;
    }
    const minY = y - size;
    const maxY = y + Math.max(2, size * 0.2);
    return { minX, minY, maxX, maxY };
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
      "font-family": options?.family ?? FONT_FAMILY,
      "font-weight": options?.weight ?? 400,
      fill: options?.fill ?? STROKE,
      "text-anchor": options?.anchor ?? "start"
    };
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

  const getProbeDisplayName = (component, probeLabels) => {
    const componentId = String(component?.id ?? "");
    const override = probeLabels?.get?.(componentId);
    if (typeof override === "string" && override.trim()) {
      return override.trim();
    }
    return getDisplayName(component);
  };

  const isInvalidDifferentialProbeLabel = (component, label) =>
    String(component?.type ?? "").toUpperCase() === "PD" && String(label ?? "").includes("?");

  const getTextAnnotationText = (component) => {
    const text = getDisplayName(component).trim();
    return text || "Text";
  };

  const getTextAnchorPin = (component) => {
    const pins = Array.isArray(component?.pins) ? component.pins : [];
    return pins[0] ?? null;
  };

  const getTextAnnotationStyle = (component, color) => {
    const font = normalizeTextFontValue(component?.textFont ?? DEFAULT_TEXT_STYLE.font);
    const size = normalizeTextSizeValue(component?.textSize ?? DEFAULT_TEXT_STYLE.size);
    const bold = component?.textBold === true || DEFAULT_TEXT_STYLE.bold;
    const italic = component?.textItalic === true || DEFAULT_TEXT_STYLE.italic;
    const underline = component?.textUnderline === true || DEFAULT_TEXT_STYLE.underline;
    const textColor = normalizeNetColorValue(color) ?? normalizeNetColorValue(component?.netColor) ?? STROKE;
    return {
      font,
      size,
      bold,
      italic,
      underline,
      color: textColor
    };
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
      throw new Error(`Named-node helper '${name}' is unavailable. Ensure symbol-render.js loads before export.js.`);
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

  const appendNamedNodeLabelText = (group, component, rotation, geometry, labelColor) => {
    const metrics = geometry ?? getNamedNodeGeometry(component);
    const textOnly = component?.textOnly === true;
    const textTransform = getNamedNodeTextTransform(rotation, metrics.style, { textOnly });
    const textX = getNamedNodeTextAnchorX(rotation, metrics, { textOnly });
    const fontSize = Number(metrics.style?.fontSize);
    const label = appendText(group, textX, textTransform.y, metrics.text, {
      size: Number.isFinite(fontSize) ? fontSize : 12,
      fill: labelColor ?? STROKE,
      anchor: "middle",
      baseline: "middle"
    });
    if (textTransform.rotation !== 0) {
      label.setAttribute("transform", `rotate(${textTransform.rotation} ${textX} ${textTransform.y})`);
    }
    if (component?.id) {
      label.setAttribute("data-component-id", String(component.id));
    }
    return label;
  };

  const getProbeHelper = (name) => {
    const helper = schematicApi?.[name];
    if (typeof helper !== "function") {
      throw new Error(`Probe helper '${name}' is unavailable. Ensure symbol-render.js loads before export.js.`);
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
      throw new Error(`SPDT helper '${name}' is unavailable. Ensure symbol-render.js loads before export.js.`);
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

  const getSpdtLabelGeometry = (component, plan) => {
    const resolvedPlan = plan ?? getSpdtSwitchRenderPlan(component);
    return {
      midX: Number(resolvedPlan.labelCenter.x),
      midY: Number(resolvedPlan.labelCenter.y),
      angle: Number(resolvedPlan.labelAngle)
    };
  };

  const createSvg = (width, height, viewBox) => {
    const svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("xmlns", SVG_NS);
    svg.setAttribute("id", "schematic-export");
    svg.setAttribute("width", String(width));
    svg.setAttribute("height", String(height));
    svg.setAttribute("viewBox", viewBox ?? `0 0 ${width} ${height}`);
    return svg;
  };

  const pointKey = (point) => `${point.x},${point.y}`;

  const getWirePointDegrees = (wires) => {
    const degrees = new Map();
    (wires ?? []).forEach((wire) => {
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

  const getTerminalJunctionKeys = (components, wires) => {
    const degrees = getWirePointDegrees(wires);
    const terminals = new Set();
    (components ?? []).forEach((component) => {
      const isElectrical = isElectricalComponentType(component?.type);
      if (!isElectrical) {
        return;
      }
      (component.pins ?? []).forEach((pin) => {
        const key = pointKey(pin);
        if ((degrees.get(key) ?? 0) >= 2) {
          terminals.add(key);
        }
      });
    });
    return terminals;
  };

  const getWireBounds = (wire) => {
    const points = Array.isArray(wire?.points) ? wire.points : [];
    if (!points.length) {
      return null;
    }
    let bounds = null;
    points.forEach((point) => {
      if (!point) {
        return;
      }
      bounds = expandBounds(bounds, point.x, point.y, point.x, point.y);
    });
    if (!bounds) {
      return null;
    }
    return padBounds(bounds, WIRE_PADDING);
  };

  const getSymbolPadding = (type) => {
    switch (type) {
      case "V":
      case "I":
      case "VM":
      case "AM":
        return 12;
      case "C":
        return 8;
      case "R":
      case "L":
      default:
        return 6;
    }
  };

  const getComponentBounds = (component, measurements, probeLabels) => {
    const type = String(component?.type ?? "").toUpperCase();
    if (type === "GND") {
      const pins = Array.isArray(component?.pins) ? component.pins : [];
      if (!pins.length) {
        return null;
      }
      const pin = pins[0];
      return expandBounds(null, pin.x - 8, pin.y, pin.x + 8, pin.y + 16);
    }
    if (type === "NET") {
      const pins = Array.isArray(component?.pins) ? component.pins : [];
      if (!pins.length) {
        return null;
      }
      const pin = pins[0];
      const extents = getNamedNodeExtents(component);
      const rotation = snapRotation(Number(component?.rotation ?? 0));
      const verticalTextOnly = component?.textOnly === true && (rotation === 90 || rotation === 270);
      const pad = component?.textOnly === true
        ? (verticalTextOnly ? 8 : 3)
        : NET_LABEL_BOUNDS_PAD;
      return expandBounds(
        null,
        pin.x + extents.minX - pad,
        pin.y + extents.minY - pad,
        pin.x + extents.maxX + pad,
        pin.y + extents.maxY + pad
      );
    }
    if (type === "TEXT") {
      const pin = getTextAnchorPin(component);
      if (!pin) {
        return null;
      }
      const extents = getTextAnnotationLocalExtents(component);
      const pad = 4;
      return expandBounds(
        null,
        pin.x + extents.minX - pad,
        pin.y + extents.minY - pad,
        pin.x + extents.maxX + pad,
        pin.y + extents.maxY + pad
      );
    }
    if (type === "SW") {
      const extents = getSpdtSwitchExtents(component);
      const pad = 6;
      let bounds = expandBounds(
        null,
        extents.minX - pad,
        extents.minY - pad,
        extents.maxX + pad,
        extents.maxY + pad
      );
      const displayValue = formatDisplayValue(component);
      const hasValue = Boolean(displayValue);
      const measurementText = measurements?.get?.(component.id);
      const lineCount = (hasValue ? 2 : 1) + (measurementText ? 1 : 0);
      const labelRotation = Number(component?.labelRotation ?? 0);
      const labelGeometry = getSpdtLabelGeometry(component);
      const layout = getLabelLayout(
        labelGeometry.midX,
        labelGeometry.midY,
        labelGeometry.angle,
        lineCount,
        labelRotation
      );
      const idBounds = getTextBounds(layout.x, layout.y, getDisplayName(component), 12, layout.anchor, 400);
      if (idBounds) {
        bounds = expandBounds(bounds, idBounds.minX, idBounds.minY, idBounds.maxX, idBounds.maxY);
      }
      if (hasValue) {
        const valueBounds = getTextBounds(
          layout.x,
          layout.y + layout.lineHeight,
          displayValue,
          11,
          layout.anchor,
          400
        );
        if (valueBounds) {
          bounds = expandBounds(bounds, valueBounds.minX, valueBounds.minY, valueBounds.maxX, valueBounds.maxY);
        }
      }
      if (measurementText) {
        const measurementBounds = getTextBounds(
          layout.x,
          layout.y + layout.lineHeight * (lineCount - 1),
          measurementText,
          11,
          layout.anchor,
          MEASUREMENT_TEXT_WEIGHT
        );
        if (measurementBounds) {
          bounds = expandBounds(
            bounds,
            measurementBounds.minX,
            measurementBounds.minY,
            measurementBounds.maxX,
            measurementBounds.maxY
          );
        }
      }
      return bounds;
    }
    if (isProbeComponentType(type)) {
      const shapePad = 6;
      let bounds = null;
      let labelX = 0;
      let labelY = 0;
      let labelAnchor = "start";
      if (type === "PD") {
        const geometry = getDifferentialProbeGeometry(component);
        if (!geometry) {
          return null;
        }
        bounds = expandBounds(
          null,
          geometry.extents.minX - shapePad,
          geometry.extents.minY - shapePad,
          geometry.extents.maxX + shapePad,
          geometry.extents.maxY + shapePad
        );
        labelX = geometry.labelAnchor.x;
        labelY = geometry.labelAnchor.y;
        labelAnchor = geometry.labelAnchor.anchor === "end"
          ? "end"
          : (geometry.labelAnchor.anchor === "middle" ? "middle" : "start");
      } else {
        const pins = Array.isArray(component?.pins) ? component.pins : [];
        const pin = pins[0];
        if (!pin) {
          return null;
        }
        const rotation = snapRotation(Number(component?.rotation ?? 0));
        const extents = getProbeExtents(rotation);
        bounds = expandBounds(
          null,
          pin.x + extents.minX - shapePad,
          pin.y + extents.minY - shapePad,
          pin.x + extents.maxX + shapePad,
          pin.y + extents.maxY + shapePad
        );
        const anchor = getProbeLabelAnchor(rotation);
        labelX = pin.x + anchor.x;
        labelY = pin.y + anchor.y;
        labelAnchor = anchor.anchor;
      }
      const labelText = getProbeDisplayName(component, probeLabels);
      const measurementText = measurements?.get?.(component.id);
      const labelBounds = getTextBounds(labelX, labelY, labelText, 12, labelAnchor, 400);
      if (labelBounds) {
        bounds = expandBounds(bounds, labelBounds.minX, labelBounds.minY, labelBounds.maxX, labelBounds.maxY);
      }
      if (measurementText) {
        const valueBounds = getTextBounds(
          labelX,
          labelY + LABEL_LINE_HEIGHT,
          measurementText,
          11,
          labelAnchor,
          MEASUREMENT_TEXT_WEIGHT
        );
        if (valueBounds) {
          bounds = expandBounds(bounds, valueBounds.minX, valueBounds.minY, valueBounds.maxX, valueBounds.maxY);
        }
      }
      return bounds;
    }
    const info = getTwoPinInfo(component);
    if (!info) {
      return null;
    }
    const symbolPad = getSymbolPadding(type) + 4;
    let bounds = expandBounds(
      null,
      Math.min(info.start.x, info.end.x) - symbolPad,
      Math.min(info.start.y, info.end.y) - symbolPad,
      Math.max(info.start.x, info.end.x) + symbolPad,
      Math.max(info.start.y, info.end.y) + symbolPad
    );

    const displayValue = formatDisplayValue(component);
    const displayName = getDisplayName(component);
    const hasValue = Boolean(displayValue);
    const measurementText = measurements?.get?.(component.id);
    const labelRotation = Number(component?.labelRotation ?? 0);
    const lineCount = (hasValue ? 2 : 1) + (measurementText ? 1 : 0);
    const layout = getLabelLayout(info.midX, info.midY, info.angle, lineCount, labelRotation);
    const idText = displayName;
    const idBounds = getTextBounds(layout.x, layout.y, idText, 12, layout.anchor, 400);
    if (idBounds) {
      bounds = expandBounds(bounds, idBounds.minX, idBounds.minY, idBounds.maxX, idBounds.maxY);
    }
    if (hasValue) {
      const valueBounds = getTextBounds(
        layout.x,
        layout.y + layout.lineHeight,
        displayValue,
        11,
        layout.anchor,
        400
      );
      if (valueBounds) {
        bounds = expandBounds(bounds, valueBounds.minX, valueBounds.minY, valueBounds.maxX, valueBounds.maxY);
      }
    }
    if (measurementText) {
      const measurementBounds = getTextBounds(
        layout.x,
        layout.y + layout.lineHeight * (lineCount - 1),
        measurementText,
        11,
        layout.anchor,
        MEASUREMENT_TEXT_WEIGHT
      );
      if (measurementBounds) {
        bounds = expandBounds(
          bounds,
          measurementBounds.minX,
          measurementBounds.minY,
          measurementBounds.maxX,
          measurementBounds.maxY
        );
      }
    }
    return bounds;
  };

  const getContentBounds = (model, options) => {
    let bounds = null;
    const measurements = options?.measurements;
    const probeLabels = options?.probeLabels;
    const wires = Array.isArray(model?.wires) ? model.wires : [];
    const components = Array.isArray(model?.components) ? model.components : [];
    wires.forEach((wire) => {
      const wireBounds = getWireBounds(wire);
      if (wireBounds) {
        bounds = expandBounds(bounds, wireBounds.minX, wireBounds.minY, wireBounds.maxX, wireBounds.maxY);
      }
    });
    components.forEach((component) => {
      const componentBounds = getComponentBounds(component, measurements, probeLabels);
      if (componentBounds) {
        bounds = expandBounds(bounds, componentBounds.minX, componentBounds.minY, componentBounds.maxX, componentBounds.maxY);
      }
    });
    return bounds;
  };

  const resolveExportBox = (model, options) => {
    const fit = options?.fit === true;
    const widthOpt = Number.isFinite(options?.width) ? options.width : null;
    const heightOpt = Number.isFinite(options?.height) ? options.height : null;
    if (!fit) {
      const width = widthOpt ?? DEFAULT_EXPORT_WIDTH;
      const height = heightOpt ?? DEFAULT_EXPORT_HEIGHT;
      return {
        width,
        height,
        viewBox: `0 0 ${width} ${height}`
      };
    }
    const padding = Number.isFinite(options?.padding) ? options.padding : DEFAULT_EXPORT_PADDING;
    const rawBounds = getContentBounds(model, options);
    if (!rawBounds) {
      const width = widthOpt ?? DEFAULT_EXPORT_WIDTH;
      const height = heightOpt ?? DEFAULT_EXPORT_HEIGHT;
      return {
        width,
        height,
        viewBox: `0 0 ${width} ${height}`
      };
    }
    const padded = padBounds(rawBounds, padding);
    const width = Math.max(1, padded.maxX - padded.minX);
    const height = Math.max(1, padded.maxY - padded.minY);
    return {
      width,
      height,
      viewBox: `${padded.minX} ${padded.minY} ${width} ${height}`
    };
  };

  const drawWire = (svg, wire, color) => {
    const points = Array.isArray(wire.points) ? wire.points : [];
    if (points.length < 2) {
      return;
    }
    const poly = document.createElementNS(SVG_NS, "polyline");
    const pointString = points.map((pt) => `${pt.x},${pt.y}`).join(" ");
    poly.setAttribute("points", pointString);
    poly.setAttribute("fill", "none");
    poly.setAttribute("stroke", color ?? STROKE);
    poly.setAttribute("stroke-width", String(STROKE_WIDTH));
    if (wire?.id) {
      poly.setAttribute("data-wire-id", String(wire.id));
    }
    svg.appendChild(poly);
  };

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

  const drawGroundSymbol = (svg, component, color) => {
    const pins = Array.isArray(component?.pins) ? component.pins : [];
    if (!pins.length) {
      return;
    }
    const pin = pins[0];
    const group = document.createElementNS(SVG_NS, "g");
    group.setAttribute("data-component", component.id);
    group.setAttribute("data-symbol", "ground");
    group.setAttribute("transform", `translate(${pin.x} ${pin.y})`);
    const strokeColor = normalizeNetColorValue(color) ?? STROKE;
    const handled = typeof symbolApi?.drawShape === "function"
      ? symbolApi.drawShape(symbolCtx, "GND", group, { style: { stroke: strokeColor, width: STROKE_WIDTH } })
      : false;
    if (!handled) {
      return;
    }
    svg.appendChild(group);
  };

  const drawNamedNodeSymbol = (svg, component, color) => {
    const pins = Array.isArray(component?.pins) ? component.pins : [];
    if (!pins.length) {
      return;
    }
    const pin = pins[0];
    const rotation = snapRotation(Number(component?.rotation ?? 0));
    const geometry = getNamedNodeGeometry(component);
    const group = document.createElementNS(SVG_NS, "g");
    group.setAttribute("data-component", component.id);
    group.setAttribute("data-symbol", "net");
    const rotate = rotation !== 0 ? ` rotate(${rotation})` : "";
    group.setAttribute("transform", `translate(${pin.x} ${pin.y})${rotate}`);
    const strokeColor = normalizeNetColorValue(color) ?? STROKE;
    const textOnly = component?.textOnly === true;
    const handled = !textOnly && typeof symbolApi?.drawShape === "function"
      ? symbolApi.drawShape(symbolCtx, "NET", group, {
        geometry,
        style: { stroke: strokeColor, width: STROKE_WIDTH }
      })
      : false;
    if (!textOnly && !handled) {
      return;
    }
    appendNamedNodeLabelText(group, component, rotation, geometry, strokeColor);
    svg.appendChild(group);
  };

  const drawTextAnnotationSymbol = (svg, component, color) => {
    const pin = getTextAnchorPin(component);
    if (!pin) {
      return;
    }
    const style = getTextAnnotationStyle(component, color);
    const text = getTextAnnotationText(component);
    const rotation = snapRotation(Number(component?.rotation ?? 0));
    const group = document.createElementNS(SVG_NS, "g");
    group.setAttribute("data-component", component.id);
    group.setAttribute("data-symbol", "text");
    const rotate = rotation !== 0 ? ` rotate(${rotation})` : "";
    group.setAttribute("transform", `translate(${pin.x} ${pin.y})${rotate}`);
    const label = appendText(group, 0, 0, text, {
      size: style.size,
      fill: style.color,
      family: style.font,
      weight: style.bold ? 700 : 400,
      anchor: "start",
      baseline: "middle"
    });
    label.setAttribute("font-style", style.italic ? "italic" : "normal");
    label.setAttribute("text-decoration", style.underline ? "underline" : "none");
    if (component?.id) {
      label.setAttribute("data-component-id", String(component.id));
    }
    svg.appendChild(group);
  };

  const drawProbeLabel = (svg, component, options) => {
    const type = String(component?.type ?? "").toUpperCase();
    const probeLabel = getProbeDisplayName(component, options?.probeLabels);
    let labelX = 0;
    let labelY = 0;
    let anchor = { anchor: "start" };
    if (type === "PD") {
      const geometry = getDifferentialProbeGeometry(component);
      if (!geometry) {
        return;
      }
      labelX = geometry.labelAnchor.x;
      labelY = geometry.labelAnchor.y;
      anchor = {
        anchor: geometry.labelAnchor.anchor === "end"
          ? "end"
          : (geometry.labelAnchor.anchor === "middle" ? "middle" : "start")
      };
    } else {
      const pins = Array.isArray(component?.pins) ? component.pins : [];
      const pin = pins[0];
      if (!pin) {
        return;
      }
      const rotation = snapRotation(Number(component?.rotation ?? 0));
      const singleAnchor = getProbeLabelAnchor(rotation);
      labelX = pin.x + singleAnchor.x;
      labelY = pin.y + singleAnchor.y;
      anchor = singleAnchor;
    }
    const invalidColor = isInvalidDifferentialProbeLabel(component, probeLabel) ? PROBE_INVALID_COLOR : null;
    const label = appendText(svg, labelX, labelY, probeLabel, {
      size: 12,
      fill: invalidColor ?? options?.labelColor ?? DEFAULT_COMPONENT_TEXT_COLORS.label,
      anchor: anchor.anchor,
      baseline: "middle"
    });
    if (component?.id) {
      label.setAttribute("data-component-id", String(component.id));
    }
    const measurementText = options?.measurements?.get?.(component.id);
    if (measurementText) {
      appendText(svg, labelX, labelY + LABEL_LINE_HEIGHT, measurementText, {
        size: 11,
        fill: invalidColor ?? options?.valueColor ?? DEFAULT_COMPONENT_TEXT_COLORS.value,
        anchor: anchor.anchor,
        weight: MEASUREMENT_TEXT_WEIGHT
      });
    }
  };

  const drawDifferentialProbeSymbol = (svg, component, color, measurements, probeLabels) => {
    const plan = getDifferentialProbeRenderPlan(component);
    if (!plan) {
      return;
    }
    const probeLabel = getProbeDisplayName(component, probeLabels);
    const invalidColor = isInvalidDifferentialProbeLabel(component, probeLabel) ? PROBE_INVALID_COLOR : null;
    const strokeColor = invalidColor ?? normalizeNetColorValue(color) ?? STROKE;
    const polarityFill = getDifferentialPolarityColor(strokeColor);
    const group = document.createElementNS(SVG_NS, "g");
    group.setAttribute("data-component", component.id);
    group.setAttribute("data-symbol", "PD");
    const lineWidth = STROKE_WIDTH;
    const tipRadius = Number(plan.headRadius);
    const link = appendLine(group, plan.link.x1, plan.link.y1, plan.link.x2, plan.link.y2, {
      stroke: strokeColor,
      width: 1.25
    });
    link.setAttribute("data-probe-diff-link", "1");
    link.setAttribute("stroke-dasharray", plan.link.dash);
    plan.endpoints.forEach((endpoint) => {
      const lead = appendLine(group, endpoint.anchor.x, endpoint.anchor.y, endpoint.tip.x, endpoint.tip.y, {
        stroke: strokeColor,
        width: lineWidth
      });
      lead.setAttribute("data-probe-diff-lead", endpoint.side);
      const tipCircle = appendCircle(group, endpoint.tip.x, endpoint.tip.y, tipRadius, {
        stroke: strokeColor,
        width: lineWidth,
        fill: strokeColor
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
    drawProbeLabel(svg, component, {
      labelColor: invalidColor ?? normalizeNetColorValue(color) ?? undefined,
      valueColor: invalidColor ?? normalizeNetColorValue(color) ?? undefined,
      measurements,
      probeLabels
    });
  };

  const drawProbeSymbol = (svg, component, color, measurements, probeLabels) => {
    const type = String(component?.type ?? "").toUpperCase();
    if (type === "PD") {
      drawDifferentialProbeSymbol(svg, component, color, measurements, probeLabels);
      return;
    }
    const pins = Array.isArray(component?.pins) ? component.pins : [];
    const pin = pins[0];
    if (!pin) {
      return;
    }
    const rotation = snapRotation(Number(component?.rotation ?? 0));
    const group = document.createElementNS(SVG_NS, "g");
    group.setAttribute("data-component", component.id);
    group.setAttribute("data-symbol", type);
    const rotate = rotation !== 0 ? ` rotate(${rotation})` : "";
    group.setAttribute("transform", `translate(${pin.x} ${pin.y})${rotate}`);
    const strokeColor = normalizeNetColorValue(color) ?? STROKE;
    const handled = typeof symbolApi?.drawShape === "function"
      ? symbolApi.drawShape(symbolCtx, type, group, { style: { stroke: strokeColor, width: STROKE_WIDTH } })
      : false;
    if (!handled) {
      return;
    }
    svg.appendChild(group);
    const textColor = normalizeNetColorValue(color);
    drawProbeLabel(svg, component, {
      labelColor: textColor ?? undefined,
      valueColor: textColor ?? undefined,
      measurements,
      probeLabels
    });
  };

  const drawSpdtSwitchSymbol = (svg, component, componentColor, measurements) => {
    const plan = getSpdtSwitchRenderPlan(component);
    const group = document.createElementNS(SVG_NS, "g");
    group.setAttribute("data-component", component.id);
    group.setAttribute("data-symbol", "SW");
    const strokeColor = componentColor ?? STROKE;
    const handled = typeof symbolApi?.drawShape === "function"
      ? symbolApi.drawShape(symbolCtx, "SW", group, {
        style: { stroke: strokeColor, width: STROKE_WIDTH },
        pins: component?.pins,
        value: component?.value,
        plan
      })
      : false;
    if (!handled) {
      return;
    }
    svg.appendChild(group);
    const displayValue = formatDisplayValue(component);
    const hasValue = Boolean(displayValue);
    const measurementText = measurements?.get?.(component.id);
    const lineCount = (hasValue ? 2 : 1) + (measurementText ? 1 : 0);
    const labelRotation = Number(component?.labelRotation ?? 0);
    const labelGeometry = getSpdtLabelGeometry(component, plan);
    const layout = getLabelLayout(
      labelGeometry.midX,
      labelGeometry.midY,
      labelGeometry.angle,
      lineCount,
      labelRotation
    );
    appendText(svg, layout.x, layout.y, getDisplayName(component), {
      size: 12,
      anchor: layout.anchor,
      fill: componentColor ?? STROKE
    });
    if (hasValue) {
      appendText(svg, layout.x, layout.y + layout.lineHeight, displayValue, {
        size: 11,
        fill: componentColor ?? DEFAULT_COMPONENT_TEXT_COLORS.value,
        anchor: layout.anchor
      });
    }
    if (measurementText) {
      appendText(
        svg,
        layout.x,
        layout.y + layout.lineHeight * (lineCount - 1),
        measurementText,
        {
          size: 11,
          fill: componentColor ?? DEFAULT_COMPONENT_TEXT_COLORS.value,
          anchor: layout.anchor,
          weight: MEASUREMENT_TEXT_WEIGHT
        }
      );
    }
  };

  const drawComponent = (svg, component, options) => {
    const type = String(component?.type ?? "").toUpperCase();
    const componentColor = normalizeNetColorValue(options?.componentColor);
    if (type === "GND") {
      drawGroundSymbol(svg, component, componentColor);
      return;
    }
    if (type === "NET") {
      drawNamedNodeSymbol(svg, component, options?.netColor ?? componentColor);
      return;
    }
    if (type === "TEXT") {
      drawTextAnnotationSymbol(svg, component, componentColor);
      return;
    }
    if (isProbeComponentType(type)) {
      drawProbeSymbol(svg, component, componentColor, options?.measurements, options?.probeLabels);
      return;
    }
    if (type === "SW") {
      drawSpdtSwitchSymbol(svg, component, componentColor, options?.measurements);
      return;
    }
    const info = getTwoPinInfo(component);
    if (!info) {
      return;
    }
    const group = document.createElementNS(SVG_NS, "g");
    group.setAttribute("data-component", component.id);
    group.setAttribute("data-symbol", type);
    group.setAttribute("transform", `translate(${info.start.x} ${info.start.y}) rotate(${info.angle})`);
    const terminalKeys = options?.terminalKeys;
    if (terminalKeys && terminalKeys.has(pointKey(info.start))) {
      appendCircle(group, 0, 0, 2);
    }
    if (terminalKeys && terminalKeys.has(pointKey(info.end))) {
      appendCircle(group, info.length, 0, 2);
    }
    const drawShape = symbolApi?.drawShape;
    const handled = typeof drawShape === "function"
      ? drawShape(symbolCtx, type, group, {
        length: info.length,
        rotation: info.angle,
        style: { stroke: componentColor ?? STROKE, width: STROKE_WIDTH }
      })
      : false;
    if (!handled) {
      appendLine(group, 0, 0, info.length, 0);
    }
    svg.appendChild(group);
    const displayValue = formatDisplayValue(component);
    const hasValue = Boolean(displayValue);
    const labelRotation = Number(component?.labelRotation ?? 0);
    const measurementText = options?.measurements?.get?.(component.id);
    const lineCount = (hasValue ? 2 : 1) + (measurementText ? 1 : 0);
    const layout = getLabelLayout(info.midX, info.midY, info.angle, lineCount, labelRotation);
    appendText(svg, layout.x, layout.y, getDisplayName(component), {
      size: 12,
      anchor: layout.anchor,
      fill: componentColor ?? STROKE
    });
    if (hasValue) {
      appendText(svg, layout.x, layout.y + layout.lineHeight, displayValue, {
        size: 11,
        fill: componentColor ?? DEFAULT_COMPONENT_TEXT_COLORS.value,
        anchor: layout.anchor
      });
    }
    if (measurementText) {
      appendText(
        svg,
        layout.x,
        layout.y + layout.lineHeight * (lineCount - 1),
        measurementText,
        { size: 11, fill: componentColor ?? DEFAULT_COMPONENT_TEXT_COLORS.value, anchor: layout.anchor, weight: MEASUREMENT_TEXT_WEIGHT }
      );
    }
  };

  const renderSvgWithBox = (model, box, options) => {
    const svg = createSvg(box.width, box.height, box.viewBox);
    const wires = Array.isArray(model?.wires) ? model.wires : [];
    const components = Array.isArray(model?.components) ? model.components : [];
    const netColorState = typeof schematicApi.resolveNetColors === "function"
      ? schematicApi.resolveNetColors(model)
      : { wireColors: {}, netColors: {} };
    const wireColors = (netColorState && typeof netColorState.wireColors === "object")
      ? netColorState.wireColors
      : {};
    const netColors = (netColorState && typeof netColorState.netColors === "object")
      ? netColorState.netColors
      : {};
    const terminalKeys = getTerminalJunctionKeys(components, wires);
    wires.forEach((wire) => {
      const wireColor = normalizeNetColorValue(wireColors[String(wire?.id ?? "")]);
      drawWire(svg, wire, wireColor);
    });
    components.forEach((component) => drawComponent(svg, component, {
      terminalKeys,
      measurements: options?.measurements,
      probeLabels: options?.probeLabels,
      netColor: normalizeNetColorValue(netColors[String(component?.id ?? "")]),
      componentColor: normalizeNetColorValue(component?.netColor)
    }));
    return svg;
  };

  const renderSvg = (model, options) => {
    const box = resolveExportBox(model, options);
    return renderSvgWithBox(model, box, options);
  };

  const exportSvg = (model, options) => {
    const svg = renderSvg(model, options);
    return new XMLSerializer().serializeToString(svg);
  };

  const exportPng = (model, options) => {
    const scale = Number.isFinite(options?.scale) && options.scale > 0 ? options.scale : 2;
    const transparent = options?.transparent !== false;
    const box = resolveExportBox(model, options);
    const svg = renderSvgWithBox(model, box, options);
    const svgText = new XMLSerializer().serializeToString(svg);
    const svgUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgText)}`;
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(box.width * scale);
        canvas.height = Math.round(box.height * scale);
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas context unavailable."));
          return;
        }
        if (!transparent) {
          ctx.fillStyle = CANVAS_BG;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        ctx.setTransform(scale, 0, 0, scale, 0, 0);
        ctx.drawImage(image, 0, 0);
        resolve({
          dataUrl: canvas.toDataURL("image/png"),
          width: canvas.width,
          height: canvas.height,
          scale
        });
      };
      image.onerror = () => reject(new Error("Failed to render schematic PNG."));
      image.src = svgUrl;
    });
  };

  const api = typeof self !== "undefined" ? (self.SpjutSimSchematic ?? {}) : {};
  api.exportSvg = exportSvg;
  api.exportPng = exportPng;
  if (typeof self !== "undefined") {
    self.SpjutSimSchematic = api;
  }
})();
