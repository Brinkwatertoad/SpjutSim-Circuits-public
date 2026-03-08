/**
 * @typedef {{ id: string, name?: string, type: string, value?: string, groundVariant?: string, resistorStyle?: string, netColor?: string, textOnly?: boolean, textFont?: string, textSize?: number, textBold?: boolean, textItalic?: boolean, textUnderline?: boolean, rotation?: number, labelRotation?: number, probeDiffRotations?: { "P+"?: number, "P-"?: number }, pins: { id: string, name: string, x: number, y: number }[] }} Component
 * @typedef {{ components: Component[], wires: { id: string, points: { x: number, y: number }[], netColor?: string }[] }} SchematicModel
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
  const wireRender = typeof self !== "undefined" ? (self.SpjutSimWireRender ?? null) : null;
  if (!wireRender || typeof wireRender.buildWirePath !== "function") {
    throw new Error("Wire render module unavailable. Check src/schematic/wire-render.js load order.");
  }
  const renderPlanContractsModule = typeof self !== "undefined"
    ? (self.SpjutSimSchematicRenderPlanContracts ?? null)
    : null;
  if (!renderPlanContractsModule || typeof renderPlanContractsModule.createRenderPlanContracts !== "function") {
    throw new Error("Schematic render-plan contracts module unavailable. Check src/schematic/render-plan-contracts.js load order.");
  }
  const renderPlanContracts = renderPlanContractsModule.createRenderPlanContracts({
    schematicApi,
    contextName: "export.js"
  });

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
    normalizeResistorStyle: requireSchematicMethod("normalizeResistorStyle"),
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
  const normalizeResistorStyleValue = (value) => textStyleApi.normalizeResistorStyle(value);
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
  const DEFAULT_SCHEMATIC_TEXT_STYLE = Object.freeze({
    font: DEFAULT_TEXT_STYLE.font,
    size: 12,
    bold: false,
    italic: false
  });
  const DEFAULT_INCLUDE_SCHEMATIC_VALUE_UNIT_SPACE = true;
  const normalizeSchematicTextStyle = (value, fallback = DEFAULT_SCHEMATIC_TEXT_STYLE) => {
    const base = fallback && typeof fallback === "object"
      ? fallback
      : DEFAULT_SCHEMATIC_TEXT_STYLE;
    const source = value && typeof value === "object"
      ? value
      : {};
    return {
      font: normalizeTextFontValue(
        Object.prototype.hasOwnProperty.call(source, "font")
          ? source.font
          : base.font
      ),
      size: normalizeTextSizeValue(
        Object.prototype.hasOwnProperty.call(source, "size")
          ? source.size
          : base.size
      ),
      bold: Object.prototype.hasOwnProperty.call(source, "bold")
        ? source.bold === true
        : base.bold === true,
      italic: Object.prototype.hasOwnProperty.call(source, "italic")
        ? source.italic === true
        : base.italic === true
    };
  };
  const resolveSchematicTextStyle = (value) => normalizeSchematicTextStyle(value);
  const normalizeSchematicValueUnitSpacing = (
    value,
    fallback = DEFAULT_INCLUDE_SCHEMATIC_VALUE_UNIT_SPACE
  ) => {
    if (typeof value === "boolean") {
      return value;
    }
    return fallback !== false;
  };
  const getSchematicTextValueSize = (style) => {
    const size = Number(style?.size);
    if (!Number.isFinite(size)) {
      return 11;
    }
    return Math.max(8, Math.round(size) - 1);
  };
  const getSchematicTextLineHeight = (style, fallbackLineHeight = LABEL_LINE_HEIGHT) => {
    const baseLineHeight = Number.isFinite(Number(fallbackLineHeight))
      ? Number(fallbackLineHeight)
      : LABEL_LINE_HEIGHT;
    const textSize = Number(style?.size);
    if (!Number.isFinite(textSize)) {
      return baseLineHeight;
    }
    return Math.max(8, Math.round(textSize) + 2);
  };
  const getSchematicFontFamily = (font) => {
    const normalized = normalizeTextFontValue(font);
    return `"${normalized}", Tahoma, sans-serif`;
  };
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

  const getTextBounds = (x, y, text, size, anchor, weight, baseline) => {
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
    const baselineMode = String(baseline ?? "").trim().toLowerCase();
    const middleBaseline = baselineMode === "middle";
    const minY = middleBaseline
      ? y - (size * 0.6)
      : y - size;
    const maxY = middleBaseline
      ? y + (size * 0.6)
      : y + Math.max(2, size * 0.2);
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
  const resolveComponentLabelPosition = (layout, options = {}) => {
    const resolver = renderPlanContracts?.resolveTwoPinLabelPosition;
    if (typeof resolver !== "function") {
      throw new Error("Schematic render-plan contracts missing two-pin label position helper.");
    }
    return resolver(layout, {
      ...options,
      labelLineHeight: LABEL_LINE_HEIGHT,
      labelLayoutDefaults: COMPONENT_LABEL_LAYOUT_DEFAULTS
    });
  };

  const formatDisplayValue = (component, options) => {
    const rawValue = valueFormatApi.formatComponentDisplayValue(component);
    const text = String(rawValue ?? "").trim();
    if (!text) {
      return "";
    }
    if (normalizeSchematicValueUnitSpacing(options?.includeSchematicValueUnitSpace)) {
      return text;
    }
    return text.replace(
      /([+-]?(?:\d+(?:\.\d+)?|\.\d+))\s+([pnumkMGTµμ]?[A-Za-zΩΩ°]+)/g,
      "$1$2"
    );
  };

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
    return renderPlanContracts.getNamedNodeLabelStyle();
  };

  const normalizeGroundVariantValue = (value) => {
    return renderPlanContracts.normalizeGroundVariant(value);
  };

  const getGroundExtents = (component) => {
    const rotation = snapRotation(Number(component?.rotation ?? 0));
    return renderPlanContracts.getGroundExtents(rotation, component?.groundVariant);
  };

  const getNamedNodeGeometry = (component, schematicTextStyle) => {
    const text = getNamedNodeLabelText(component);
    const baseStyle = resolveNetLabelStyle();
    const resolvedTextStyle = resolveSchematicTextStyle(schematicTextStyle);
    const style = {
      ...baseStyle,
      fontSize: getSchematicTextValueSize(resolvedTextStyle)
    };
    const resolvedFontSize = Number(style.fontSize);
    const textWidth = measureTextWidth(
      text,
      Number.isFinite(resolvedFontSize) ? resolvedFontSize : Number(baseStyle.fontSize),
      resolvedTextStyle.bold ? 700 : 400,
      resolvedTextStyle.font
    );
    const geometry = renderPlanContracts.getNamedNodeGeometry(textWidth, style);
    return {
      text,
      halfHeight: Number(geometry.halfHeight),
      slopeX: Number(geometry.slopeX),
      textX: Number(geometry.textX),
      endX: Number(geometry.endX),
      style,
      schematicTextStyle: resolvedTextStyle
    };
  };

  const getNamedNodeTextTransform = (rotation, style, options) => {
    const transform = renderPlanContracts.getNamedNodeTextTransform(rotation, style, options);
    return {
      rotation: snapRotation(transform.rotation),
      y: Number(transform.y)
    };
  };

  const getNamedNodeTextAnchorX = (rotation, geometry, options) => {
    return renderPlanContracts.getNamedNodeTextAnchorX(rotation, geometry, options);
  };

  const getNamedNodeExtents = (component, schematicTextStyle) => {
    const geometry = getNamedNodeGeometry(component, schematicTextStyle);
    const rotation = snapRotation(Number(component?.rotation ?? 0));
    const textOnly = component?.textOnly === true;
    const extents = renderPlanContracts.getNamedNodeExtents(rotation, geometry, { textOnly, style: geometry?.style });
    return {
      minX: Number(extents.minX),
      maxX: Number(extents.maxX),
      minY: Number(extents.minY),
      maxY: Number(extents.maxY),
      geometry
    };
  };

  const appendNamedNodeLabelText = (group, component, rotation, geometry, labelColor, schematicTextStyle) => {
    const resolvedTextStyle = resolveSchematicTextStyle(schematicTextStyle);
    const metrics = geometry ?? getNamedNodeGeometry(component, resolvedTextStyle);
    const textOnly = component?.textOnly === true;
    const textTransform = getNamedNodeTextTransform(rotation, metrics.style, { textOnly });
    const textX = getNamedNodeTextAnchorX(rotation, metrics, { textOnly });
    const fontSize = Number(metrics.style?.fontSize);
    const fallbackFontSize = getSchematicTextValueSize(resolvedTextStyle);
    const label = appendText(group, textX, textTransform.y, metrics.text, {
      size: Number.isFinite(fontSize) ? fontSize : fallbackFontSize,
      fill: labelColor ?? STROKE,
      anchor: "middle",
      baseline: "middle",
      family: getSchematicFontFamily(resolvedTextStyle.font),
      weight: resolvedTextStyle.bold ? 700 : 400,
      style: resolvedTextStyle.italic ? "italic" : "normal"
    });
    if (textTransform.rotation !== 0) {
      label.setAttribute("transform", `rotate(${textTransform.rotation} ${textX} ${textTransform.y})`);
    }
    if (component?.id) {
      label.setAttribute("data-component-id", String(component.id));
    }
    return label;
  };

  const getAnnotationSymbolName = (type) => {
    return renderPlanContracts.getAnnotationSymbolName(type);
  };

  const getAnnotationExtents = (component) => {
    const type = String(component?.type ?? "").toUpperCase();
    const rotation = snapRotation(Number(component?.rotation ?? 0));
    return renderPlanContracts.getAnnotationExtents(type, rotation);
  };

  const getArrowAnnotationStyle = (value, options) => {
    return renderPlanContracts.getArrowAnnotationStyle(value, options);
  };

  const getArrowThickness = (value) => getArrowAnnotationStyle(value).thickness;

  const getArrowAnnotationDasharray = (lineType, thickness) => {
    return renderPlanContracts.getArrowAnnotationDasharray(lineType, thickness);
  };

  const getTextAnnotationStyleValue = (value, options) => {
    return renderPlanContracts.getTextAnnotationStyle(value, options);
  };

  const getBoxAnnotationStyle = (value, options) => {
    return renderPlanContracts.getBoxAnnotationStyle(value, options);
  };

  const getBoxAnnotationDasharray = (lineType, thickness) => {
    return renderPlanContracts.getBoxAnnotationDasharray(lineType, thickness);
  };

  const getProbeLabelAnchor = (rotation) => {
    return renderPlanContracts.getProbeLabelAnchor(rotation);
  };

  const getProbeExtents = (rotation) => {
    return renderPlanContracts.getProbeExtents(rotation);
  };

  const getDifferentialProbeRotations = (component) =>
    renderPlanContracts.getDifferentialProbeRotations(component);

  const getDifferentialProbeGeometry = (component) =>
    renderPlanContracts.getDifferentialProbeGeometry(component);

  const getDifferentialProbeRenderPlan = (component) =>
    renderPlanContracts.getDifferentialProbeRenderPlan(component);

  const getDifferentialPolarityColor = (fillColor) =>
    renderPlanContracts.getDifferentialPolarityColor(fillColor);

  const getSpdtSwitchRenderPlan = (component) =>
    renderPlanContracts.getSpdtSwitchRenderPlan(component);

  const getSpdtSwitchExtents = (component) =>
    renderPlanContracts.getSpdtSwitchExtents(component);

  const getSpdtLabelGeometry = (component, plan) => {
    return renderPlanContracts.getSpdtLabelGeometry(component, plan);
  };

  const getTransformerRenderPlan = (component) =>
    renderPlanContracts.getTransformerRenderPlan(component);

  const getTransformerExtents = (component) =>
    renderPlanContracts.getTransformerExtents(component);

  const getTransformerLabelGeometry = (component, plan) => {
    return renderPlanContracts.getTransformerLabelGeometry(component, plan);
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

  const getComponentBounds = (
    component,
    measurements,
    probeLabels,
    schematicTextStyle,
    includeSchematicValueUnitSpace
  ) => {
    const resolvedTextStyle = resolveSchematicTextStyle(schematicTextStyle);
    const valueTextSize = getSchematicTextValueSize(resolvedTextStyle);
    const textLineHeight = getSchematicTextLineHeight(resolvedTextStyle);
    const textWeight = resolvedTextStyle.bold ? 700 : 400;
    const measurementWeight = resolvedTextStyle.bold ? 700 : MEASUREMENT_TEXT_WEIGHT;
    const type = String(component?.type ?? "").toUpperCase();
    if (type === "GND") {
      const pins = Array.isArray(component?.pins) ? component.pins : [];
      if (!pins.length) {
        return null;
      }
      const pin = pins[0];
      const extents = getGroundExtents(component);
      const nearPad = 2;
      const farPad = 6;
      const crossPad = 3;
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
      return expandBounds(
        null,
        pin.x + extents.minX - minPadX,
        pin.y + extents.minY - minPadY,
        pin.x + extents.maxX + maxPadX,
        pin.y + extents.maxY + maxPadY
      );
    }
    if (type === "NET") {
      const pins = Array.isArray(component?.pins) ? component.pins : [];
      if (!pins.length) {
        return null;
      }
      const pin = pins[0];
      const extents = getNamedNodeExtents(component, schematicTextStyle);
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
    if (getAnnotationSymbolName(type)) {
      const pins = Array.isArray(component?.pins) ? component.pins : [];
      const pin = pins[0];
      if (!pin) {
        return null;
      }
      if (type === "ARR" && pins.length >= 2) {
        const xs = pins.map((entry) => Number(entry?.x));
        const ys = pins.map((entry) => Number(entry?.y));
        if (!xs.every(Number.isFinite) || !ys.every(Number.isFinite)) {
          return null;
        }
        const thickness = getArrowThickness(component?.value);
        const pad = Math.max(4, Math.ceil(thickness) + 2);
        return expandBounds(
          null,
          Math.min(...xs) - pad,
          Math.min(...ys) - pad,
          Math.max(...xs) + pad,
          Math.max(...ys) + pad
        );
      }
      if (type === "BOX" && pins.length >= 2) {
        const xs = pins.map((entry) => Number(entry?.x));
        const ys = pins.map((entry) => Number(entry?.y));
        if (!xs.every(Number.isFinite) || !ys.every(Number.isFinite)) {
          return null;
        }
        const style = getBoxAnnotationStyle(component?.value, {
          type,
          defaultLineType: "solid"
        });
        const pad = Math.max(4, Math.ceil(style.thickness) + 2);
        return expandBounds(
          null,
          Math.min(...xs) - pad,
          Math.min(...ys) - pad,
          Math.max(...xs) + pad,
          Math.max(...ys) + pad
        );
      }
      const extents = getAnnotationExtents(component);
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
      return expandBounds(
        null,
        extents.minX - pad,
        extents.minY - pad,
        extents.maxX + pad,
        extents.maxY + pad
      );
    }
    if (type === "XFMR") {
      const extents = getTransformerExtents(component);
      const pad = 6;
      let bounds = expandBounds(
        null,
        extents.minX - pad,
        extents.minY - pad,
        extents.maxX + pad,
        extents.maxY + pad
      );
      const geometry = getTransformerLabelGeometry(component);
      const displayValue = formatDisplayValue(component, { includeSchematicValueUnitSpace });
      const hasValue = Boolean(displayValue);
      const measurementText = measurements?.get?.(component.id);
      const labelRotation = Number(component?.labelRotation ?? 0);
      const lineCount = (hasValue ? 2 : 1) + (measurementText ? 1 : 0);
      const layout = getLabelLayout(geometry.midX, geometry.midY, geometry.angle, lineCount, labelRotation);
      const symbolHalfExtent = Math.max(0, (Math.max(extents.maxX - extents.minX, extents.maxY - extents.minY) / 2));
      const resolvedPosition = resolveComponentLabelPosition(layout, {
        midX: geometry.midX,
        midY: geometry.midY,
        angle: geometry.angle,
        labelRotation,
        lineCount,
        lineHeight: textLineHeight,
        labelSize: resolvedTextStyle.size,
        valueSize: valueTextSize,
        symbolHalfExtent
      });
      const resolvedY = resolvedPosition.y;
      const resolvedX = resolvedPosition.x;
      const labelBaseline = "middle";
      const nameBounds = getTextBounds(
        resolvedX,
        resolvedY,
        getDisplayName(component),
        resolvedTextStyle.size,
        layout.anchor,
        textWeight,
        labelBaseline
      );
      if (nameBounds) {
        bounds = expandBounds(bounds, nameBounds.minX, nameBounds.minY, nameBounds.maxX, nameBounds.maxY);
      }
      if (hasValue) {
        const valueBounds = getTextBounds(
          resolvedX,
          resolvedY + textLineHeight,
          displayValue,
          valueTextSize,
          layout.anchor,
          textWeight,
          labelBaseline
        );
        if (valueBounds) {
          bounds = expandBounds(bounds, valueBounds.minX, valueBounds.minY, valueBounds.maxX, valueBounds.maxY);
        }
      }
      if (measurementText) {
        const measurementBounds = getTextBounds(
          resolvedX,
          resolvedY + textLineHeight * (lineCount - 1),
          measurementText,
          valueTextSize,
          layout.anchor,
          measurementWeight,
          labelBaseline
        );
        if (measurementBounds) {
          bounds = expandBounds(bounds, measurementBounds.minX, measurementBounds.minY, measurementBounds.maxX, measurementBounds.maxY);
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
      const primaryLabelY = measurementText
        ? (labelY - (textLineHeight * 0.5))
        : labelY;
      const labelBounds = getTextBounds(
        labelX,
        primaryLabelY,
        labelText,
        resolvedTextStyle.size,
        labelAnchor,
        textWeight,
        "middle"
      );
      if (labelBounds) {
        bounds = expandBounds(bounds, labelBounds.minX, labelBounds.minY, labelBounds.maxX, labelBounds.maxY);
      }
      if (measurementText) {
        const valueBounds = getTextBounds(
          labelX,
          primaryLabelY + textLineHeight,
          measurementText,
          valueTextSize,
          labelAnchor,
          measurementWeight,
          "middle"
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

    const displayValue = formatDisplayValue(component, { includeSchematicValueUnitSpace });
    const displayName = getDisplayName(component);
    const hasValue = Boolean(displayValue);
    const measurementText = measurements?.get?.(component.id);
    const labelRotation = Number(component?.labelRotation ?? 0);
    const lineCount = (hasValue ? 2 : 1) + (measurementText ? 1 : 0);
    const layout = getLabelLayout(info.midX, info.midY, info.angle, lineCount, labelRotation);
    const symbolHalfExtent = getTwoPinSymbolHalfExtent(component, info);
    const resolvedPosition = resolveComponentLabelPosition(layout, {
      midX: info.midX,
      midY: info.midY,
      angle: info.angle,
      labelRotation,
      lineCount,
      lineHeight: textLineHeight,
      labelSize: resolvedTextStyle.size,
      valueSize: valueTextSize,
      symbolHalfExtent
    });
    const resolvedY = resolvedPosition.y;
    const resolvedX = resolvedPosition.x;
    const labelBaseline = "middle";
    const idText = displayName;
    const idBounds = getTextBounds(
      resolvedX,
      resolvedY,
      idText,
      resolvedTextStyle.size,
      layout.anchor,
      textWeight,
      labelBaseline
    );
    if (idBounds) {
      bounds = expandBounds(bounds, idBounds.minX, idBounds.minY, idBounds.maxX, idBounds.maxY);
    }
    if (hasValue) {
      const valueBounds = getTextBounds(
        resolvedX,
        resolvedY + textLineHeight,
        displayValue,
        valueTextSize,
        layout.anchor,
        textWeight,
        labelBaseline
      );
      if (valueBounds) {
        bounds = expandBounds(bounds, valueBounds.minX, valueBounds.minY, valueBounds.maxX, valueBounds.maxY);
      }
    }
    if (measurementText) {
      const measurementBounds = getTextBounds(
        resolvedX,
        resolvedY + textLineHeight * (lineCount - 1),
        measurementText,
        valueTextSize,
        layout.anchor,
        measurementWeight,
        labelBaseline
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
      const componentBounds = getComponentBounds(
        component,
        measurements,
        probeLabels,
        options?.schematicTextStyle,
        options?.includeSchematicValueUnitSpace
      );
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

  const EXPORT_JUMP_RADIUS = 6;

  const drawWire = (svg, wire, color, segments, pointKeys) => {
    const points = Array.isArray(wire.points) ? wire.points : [];
    if (points.length < 2) {
      return;
    }
    const pathInfo = wireRender.buildWirePath(points, wire.id, segments, pointKeys, {
      allowHorizontalJumps: true,
      allowVerticalJumps: true,
      priority: wireRender.getWirePriority(wire),
      jumpRadius: EXPORT_JUMP_RADIUS
    });
    if (!pathInfo.d) {
      return;
    }
    const path = appendPath(svg, pathInfo.d, {
      stroke: color ?? STROKE,
      width: STROKE_WIDTH,
      cap: "round",
      join: "round"
    });
    if (wire?.id) {
      path.setAttribute("data-wire-id", String(wire.id));
    }
    if (pathInfo.hasJump) {
      path.setAttribute("data-wire-jump", "1");
    }
  };

  const isBackgroundAnnotationComponent = (component) => {
    const type = String(component?.type ?? "").toUpperCase();
    return type === "BOX";
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
  const getTwoPinSymbolHalfExtent = (component, info) => {
    if (!info || !Number.isFinite(info.length)) {
      return 0;
    }
    const type = String(component?.type ?? "").toUpperCase();
    const helper = renderPlanContracts?.getTwoPinVisualHalfExtent;
    if (typeof helper !== "function") {
      return 0;
    }
    const value = helper(type, info.length, {
      resistorStyle: component?.resistorStyle,
      diodeDisplayType: component?.diodeDisplayType
    });
    return Number.isFinite(value) && value > 0 ? value : 0;
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
    const variant = normalizeGroundVariantValue(component?.groundVariant);
    group.setAttribute("data-ground-variant", variant);
    const rotation = snapRotation(Number(component?.rotation ?? 0));
    const rotate = rotation !== 0
      ? ` rotate(${rotation})`
      : "";
    group.setAttribute("transform", `translate(${pin.x} ${pin.y})${rotate}`);
    const strokeColor = normalizeNetColorValue(color) ?? STROKE;
    const handled = typeof symbolApi?.drawShape === "function"
      ? symbolApi.drawShape(symbolCtx, "GND", group, {
        style: { stroke: strokeColor, width: STROKE_WIDTH },
        groundVariant: variant
      })
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
    const rotation = snapRotation(Number(component?.rotation ?? 0));
    const geometry = getNamedNodeGeometry(component, options?.schematicTextStyle);
    const group = document.createElementNS(SVG_NS, "g");
    group.setAttribute("data-component", component.id);
    group.setAttribute("data-symbol", "net");
    const rotate = rotation !== 0 ? ` rotate(${rotation})` : "";
    group.setAttribute("transform", `translate(${pin.x} ${pin.y})${rotate}`);
    const strokeColor = normalizeNetColorValue(options?.netColor) ?? STROKE;
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
    appendNamedNodeLabelText(group, component, rotation, geometry, strokeColor, options?.schematicTextStyle);
    svg.appendChild(group);
  };

  const drawTextAnnotationSymbol = (svg, component, color) => {
    const pin = getTextAnchorPin(component);
    if (!pin) {
      return;
    }
    const style = getTextAnnotationStyle(component, color);
    const annotationStyle = getTextAnnotationStyleValue(component?.value, { type: "TEXT" });
    const annotationRenderStyle = renderPlanContracts.buildTextAnnotationRenderAttributes(annotationStyle, {
    });
    const text = getTextAnnotationText(component);
    const rotation = snapRotation(Number(component?.rotation ?? 0));
    const group = document.createElementNS(SVG_NS, "g");
    group.setAttribute("data-component", component.id);
    group.setAttribute("data-symbol", "text");
    if (annotationRenderStyle.opacity < 0.9999) {
      group.setAttribute("opacity", String(annotationRenderStyle.opacity));
    }
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

  const drawAnnotationSymbol = (svg, component, color) => {
    const type = String(component?.type ?? "").toUpperCase();
    const symbolName = getAnnotationSymbolName(type);
    if (!symbolName) {
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
    group.setAttribute("data-symbol", symbolName);
    if (type === "ARR") {
      const arrowGeometry = renderPlanContracts.buildArrowAnnotationGeometry(component);
      if (arrowGeometry) {
        const style = getArrowAnnotationStyle(component?.value, { type: "ARR" });
        const arrowRenderStyle = renderPlanContracts.buildArrowAnnotationRenderAttributes(style, {
          thickness: style.thickness
        });
        group.setAttribute("transform", arrowGeometry.transform);
        group.setAttribute("data-arrow-line-type", arrowRenderStyle.lineType);
        if (arrowRenderStyle.opacity < 0.9999) {
          group.setAttribute("opacity", String(arrowRenderStyle.opacity));
        }
        const strokeColor = normalizeNetColorValue(color) ?? STROKE;
        const handledArrow = typeof symbolApi?.drawShape === "function"
          ? symbolApi.drawShape(symbolCtx, type, group, {
            length: arrowGeometry.length,
            style: {
              stroke: strokeColor,
              width: arrowRenderStyle.thickness,
              arrowThickness: arrowRenderStyle.thickness,
              lineType: arrowRenderStyle.lineType,
              line: arrowRenderStyle.lineType,
              opacityPercent: arrowRenderStyle.opacityPercent,
              opacity: arrowRenderStyle.opacity,
              dasharray: arrowRenderStyle.dasharray
            }
          })
          : false;
        if (!handledArrow) {
          return;
        }
        svg.appendChild(group);
        return;
      }
    }
    if (type === "BOX") {
      const boxGeometry = renderPlanContracts.buildBoxAnnotationGeometry(component);
      if (boxGeometry) {
        const style = getBoxAnnotationStyle(component?.value, {
          type,
          defaultLineType: "solid"
        });
        const boxRenderStyle = renderPlanContracts.buildBoxAnnotationRenderAttributes(style, {
          thickness: style.thickness
        });
        const strokeColor = normalizeNetColorValue(color) ?? STROKE;
        const strokeLineCap = boxRenderStyle.lineType === "dotted" ? "round" : "square";
        const fill = boxRenderStyle.fillEnabled ? boxRenderStyle.fillColor : "none";
        group.setAttribute("transform", boxGeometry.transform);
        group.setAttribute("data-box-line-type", boxRenderStyle.lineType);
        if (boxRenderStyle.opacity < 0.9999) {
          group.setAttribute("opacity", String(boxRenderStyle.opacity));
        }
        const outline = appendPath(group, `M 0 0 L ${boxGeometry.width} 0 L ${boxGeometry.width} ${boxGeometry.height} L 0 ${boxGeometry.height} Z`, {
          stroke: strokeColor,
          width: boxRenderStyle.thickness,
          cap: strokeLineCap,
          join: "round"
        });
        outline.setAttribute("fill", fill);
        if (boxRenderStyle.dasharray) {
          outline.setAttribute("stroke-dasharray", boxRenderStyle.dasharray);
        }
        svg.appendChild(group);
        return;
      }
    }
    const rotate = rotation !== 0 ? ` rotate(${rotation})` : "";
    group.setAttribute("transform", `translate(${pin.x} ${pin.y})${rotate}`);
    const strokeColor = normalizeNetColorValue(color) ?? STROKE;
    const handled = typeof symbolApi?.drawShape === "function"
      ? symbolApi.drawShape(symbolCtx, type, group, {
        style: {
          stroke: strokeColor,
          width: STROKE_WIDTH
        }
      })
      : false;
    if (!handled) {
      return;
    }
    svg.appendChild(group);
  };

  const drawProbeLabel = (svg, component, options) => {
    const type = String(component?.type ?? "").toUpperCase();
    const resolvedTextStyle = resolveSchematicTextStyle(options?.schematicTextStyle);
    const valueTextSize = getSchematicTextValueSize(resolvedTextStyle);
    const textLineHeight = getSchematicTextLineHeight(resolvedTextStyle);
    const textWeight = resolvedTextStyle.bold ? 700 : 400;
    const measurementWeight = resolvedTextStyle.bold ? 700 : MEASUREMENT_TEXT_WEIGHT;
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
    const measurementText = options?.measurements?.get?.(component.id);
    const primaryLabelY = measurementText
      ? (labelY - (textLineHeight * 0.5))
      : labelY;
    const label = appendText(svg, labelX, primaryLabelY, probeLabel, {
      size: resolvedTextStyle.size,
      fill: invalidColor ?? options?.labelColor ?? DEFAULT_COMPONENT_TEXT_COLORS.label,
      anchor: anchor.anchor,
      baseline: "middle",
      family: getSchematicFontFamily(resolvedTextStyle.font),
      weight: textWeight,
      style: resolvedTextStyle.italic ? "italic" : "normal"
    });
    if (component?.id) {
      label.setAttribute("data-component-id", String(component.id));
    }
    if (measurementText) {
      appendText(svg, labelX, primaryLabelY + textLineHeight, measurementText, {
        size: valueTextSize,
        fill: invalidColor ?? options?.valueColor ?? DEFAULT_COMPONENT_TEXT_COLORS.value,
        anchor: anchor.anchor,
        baseline: "middle",
        family: getSchematicFontFamily(resolvedTextStyle.font),
        style: resolvedTextStyle.italic ? "italic" : "normal",
        weight: measurementWeight
      });
    }
  };

  const drawDifferentialProbeSymbol = (svg, component, color, measurements, probeLabels, schematicTextStyle) => {
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
      probeLabels,
      schematicTextStyle
    });
  };

  const drawProbeSymbol = (svg, component, color, measurements, probeLabels, schematicTextStyle) => {
    const type = String(component?.type ?? "").toUpperCase();
    if (type === "PD") {
      drawDifferentialProbeSymbol(svg, component, color, measurements, probeLabels, schematicTextStyle);
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
      probeLabels,
      schematicTextStyle
    });
  };

  const drawSpdtSwitchSymbol = (svg, component, componentColor, measurements, schematicTextStyle) => {
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
  };

  const drawTransformerSymbol = (svg, component, componentColor, measurements, schematicTextStyle, includeSchematicValueUnitSpace) => {
    const plan = getTransformerRenderPlan(component);
    const group = document.createElementNS(SVG_NS, "g");
    group.setAttribute("data-component", component.id);
    group.setAttribute("data-symbol", "XFMR");
    const strokeColor = componentColor ?? STROKE;
    const handled = typeof symbolApi?.drawShape === "function"
      ? symbolApi.drawShape(symbolCtx, "XFMR", group, {
        style: { stroke: strokeColor, width: STROKE_WIDTH },
        pins: component?.pins,
        plan
      })
      : false;
    if (!handled) {
      return;
    }
    svg.appendChild(group);

    const geometry = getTransformerLabelGeometry(component, plan);
    const extents = getTransformerExtents(component);
    const displayValue = formatDisplayValue(component, { includeSchematicValueUnitSpace });
    const hasValue = Boolean(displayValue);
    const labelRotation = Number(component?.labelRotation ?? 0);
    const measurementText = measurements?.get?.(component.id);
    const lineCount = (hasValue ? 2 : 1) + (measurementText ? 1 : 0);
    const layout = getLabelLayout(geometry.midX, geometry.midY, geometry.angle, lineCount, labelRotation);
    const symbolHalfExtent = extents
      ? Math.max(0, (Math.max(extents.maxX - extents.minX, extents.maxY - extents.minY) / 2))
      : 0;
    const resolvedPosition = resolveComponentLabelPosition(layout, {
      midX: geometry.midX,
      midY: geometry.midY,
      angle: geometry.angle,
      labelRotation,
      lineCount,
      lineHeight: getSchematicTextLineHeight(schematicTextStyle),
      labelSize: schematicTextStyle.size,
      valueSize: getSchematicTextValueSize(schematicTextStyle),
      symbolHalfExtent
    });
    const resolvedY = resolvedPosition.y;
    const resolvedX = resolvedPosition.x;
    const labelBaseline = "middle";
    const textFamily = getSchematicFontFamily(schematicTextStyle.font);
    const textWeight = schematicTextStyle.bold ? 700 : 400;
    const valueTextSize = getSchematicTextValueSize(schematicTextStyle);
    const textLineHeight = getSchematicTextLineHeight(schematicTextStyle);
    const measurementWeight = schematicTextStyle.bold ? 700 : MEASUREMENT_TEXT_WEIGHT;
    appendText(svg, resolvedX, resolvedY, getDisplayName(component), {
      size: schematicTextStyle.size,
      anchor: layout.anchor,
      baseline: labelBaseline,
      fill: componentColor ?? STROKE,
      family: textFamily,
      weight: textWeight,
      style: schematicTextStyle.italic ? "italic" : "normal"
    });
    if (hasValue) {
      appendText(svg, resolvedX, resolvedY + textLineHeight, displayValue, {
        size: valueTextSize,
        fill: componentColor ?? DEFAULT_COMPONENT_TEXT_COLORS.value,
        anchor: layout.anchor,
        baseline: labelBaseline,
        family: textFamily,
        weight: textWeight,
        style: schematicTextStyle.italic ? "italic" : "normal"
      });
    }
    if (measurementText) {
      const measurementY = resolvedY + textLineHeight * (lineCount - 1);
      appendText(svg, resolvedX, measurementY, measurementText, {
        size: valueTextSize,
        fill: componentColor ?? DEFAULT_COMPONENT_TEXT_COLORS.value,
        anchor: layout.anchor,
        baseline: labelBaseline,
        family: textFamily,
        weight: measurementWeight,
        style: schematicTextStyle.italic ? "italic" : "normal"
      });
    }
  };

  const drawComponent = (svg, component, options) => {
    const type = String(component?.type ?? "").toUpperCase();
    const componentColor = normalizeNetColorValue(options?.componentColor);
    const resolvedTextStyle = resolveSchematicTextStyle(options?.schematicTextStyle);
    const valueTextSize = getSchematicTextValueSize(resolvedTextStyle);
    const textLineHeight = getSchematicTextLineHeight(resolvedTextStyle);
    const textWeight = resolvedTextStyle.bold ? 700 : 400;
    const measurementWeight = resolvedTextStyle.bold ? 700 : MEASUREMENT_TEXT_WEIGHT;
    const textFamily = getSchematicFontFamily(resolvedTextStyle.font);
    if (type === "GND") {
      drawGroundSymbol(svg, component, componentColor);
      return;
    }
    if (type === "NET") {
      drawNamedNodeSymbol(svg, component, {
        netColor: options?.netColor ?? componentColor,
        schematicTextStyle: resolvedTextStyle
      });
      return;
    }
    if (type === "TEXT") {
      drawTextAnnotationSymbol(svg, component, componentColor);
      return;
    }
    if (getAnnotationSymbolName(type)) {
      drawAnnotationSymbol(svg, component, componentColor);
      return;
    }
    if (isProbeComponentType(type)) {
      drawProbeSymbol(
        svg,
        component,
        componentColor,
        options?.measurements,
        options?.probeLabels,
        resolvedTextStyle
      );
      return;
    }
    if (type === "SW") {
      drawSpdtSwitchSymbol(svg, component, componentColor, options?.measurements, resolvedTextStyle);
      return;
    }
    if (type === "XFMR") {
      drawTransformerSymbol(
        svg,
        component,
        componentColor,
        options?.measurements,
        resolvedTextStyle,
        options?.includeSchematicValueUnitSpace
      );
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
        style: { stroke: componentColor ?? STROKE, width: STROKE_WIDTH },
        resistorStyle: normalizeResistorStyleValue(component?.resistorStyle),
        diodeDisplayType: component?.diodeDisplayType
      })
      : false;
    if (!handled) {
      appendLine(group, 0, 0, info.length, 0);
    }
    svg.appendChild(group);
    const displayValue = formatDisplayValue(component, {
      includeSchematicValueUnitSpace: options?.includeSchematicValueUnitSpace
    });
    const hasValue = Boolean(displayValue);
    const labelRotation = Number(component?.labelRotation ?? 0);
    const measurementText = options?.measurements?.get?.(component.id);
    const lineCount = (hasValue ? 2 : 1) + (measurementText ? 1 : 0);
    const layout = getLabelLayout(info.midX, info.midY, info.angle, lineCount, labelRotation);
    const symbolHalfExtent = getTwoPinSymbolHalfExtent(component, info);
    const resolvedPosition = resolveComponentLabelPosition(layout, {
      midX: info.midX,
      midY: info.midY,
      angle: info.angle,
      labelRotation,
      lineCount,
      lineHeight: textLineHeight,
      labelSize: resolvedTextStyle.size,
      valueSize: valueTextSize,
      symbolHalfExtent
    });
    const resolvedY = resolvedPosition.y;
    const resolvedX = resolvedPosition.x;
    const labelBaseline = "middle";
    appendText(svg, resolvedX, resolvedY, getDisplayName(component), {
      size: resolvedTextStyle.size,
      anchor: layout.anchor,
      baseline: labelBaseline,
      fill: componentColor ?? STROKE,
      family: textFamily,
      weight: textWeight,
      style: resolvedTextStyle.italic ? "italic" : "normal"
    });
    if (hasValue) {
      appendText(svg, resolvedX, resolvedY + textLineHeight, displayValue, {
        size: valueTextSize,
        fill: componentColor ?? DEFAULT_COMPONENT_TEXT_COLORS.value,
        anchor: layout.anchor,
        baseline: labelBaseline,
        family: textFamily,
        weight: textWeight,
        style: resolvedTextStyle.italic ? "italic" : "normal"
      });
    }
    if (measurementText) {
      appendText(
        svg,
        resolvedX,
        resolvedY + textLineHeight * (lineCount - 1),
        measurementText,
        {
          size: valueTextSize,
          fill: componentColor ?? DEFAULT_COMPONENT_TEXT_COLORS.value,
          anchor: layout.anchor,
          baseline: labelBaseline,
          family: textFamily,
          style: resolvedTextStyle.italic ? "italic" : "normal",
          weight: measurementWeight
        }
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
    const backgroundAnnotations = [];
    const foregroundComponents = [];
    components.forEach((component) => {
      if (isBackgroundAnnotationComponent(component)) {
        backgroundAnnotations.push(component);
        return;
      }
      foregroundComponents.push(component);
    });
    const drawComponentWithResolvedColors = (component) => drawComponent(svg, component, {
      terminalKeys,
      measurements: options?.measurements,
      probeLabels: options?.probeLabels,
      schematicTextStyle: options?.schematicTextStyle,
      includeSchematicValueUnitSpace: options?.includeSchematicValueUnitSpace,
      netColor: normalizeNetColorValue(netColors[String(component?.id ?? "")]),
      componentColor: normalizeNetColorValue(component?.netColor)
    });
    backgroundAnnotations.forEach((component) => drawComponentWithResolvedColors(component));
    const segments = wireRender.collectWireSegments(wires);
    const pointKeys = new Set();
    const pointColorMap = new Map();
    wires.forEach((wire) => {
      const wireColor = normalizeNetColorValue(wireColors[String(wire?.id ?? "")])
        ?? normalizeNetColorValue(wire?.netColor);
      (wire.points ?? []).forEach((point) => {
        const key = wireRender.pointKey(point);
        pointKeys.add(key);
        if (wireColor) {
          if (!pointColorMap.has(key)) {
            pointColorMap.set(key, wireColor);
          }
        }
      });
      drawWire(svg, wire, wireColor, segments, pointKeys);
    });
    const { pinCounts, combinedDegrees } = wireRender.collectJunctionInfo(
      wires,
      components,
      isElectricalComponentType
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
      const dot = appendCircle(svg, x, y, 3, { fill: dotColor, width: 0 });
      if ((pinCounts.get(key) ?? 0) > 0) {
        dot.setAttribute("data-terminal-junction", "1");
      } else {
        dot.setAttribute("data-junction", "1");
      }
    });
    foregroundComponents.forEach((component) => drawComponentWithResolvedColors(component));
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

  const dataUrlToUint8Array = (dataUrl) => {
    const text = String(dataUrl ?? "");
    const commaIndex = text.indexOf(",");
    if (commaIndex < 0) {
      return new Uint8Array();
    }
    const encoded = text.slice(commaIndex + 1);
    const binary = self.atob(encoded);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index);
    }
    return bytes;
  };

  const renderJpegDataUrl = (pngDataUrl, width, height) => (
    new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(width));
        canvas.height = Math.max(1, Math.round(height));
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas context unavailable."));
          return;
        }
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.92));
      };
      image.onerror = () => reject(new Error("Failed to convert schematic image to JPEG."));
      image.src = pngDataUrl;
    })
  );

  const exportJpeg = async (model, options) => {
    const pngResult = await exportPng(model, { ...options, transparent: false });
    if (!pngResult || !pngResult.dataUrl) {
      throw new Error("Failed to render schematic JPEG image.");
    }
    const jpegDataUrl = await renderJpegDataUrl(
      pngResult.dataUrl,
      pngResult.width,
      pngResult.height
    );
    return {
      dataUrl: jpegDataUrl,
      width: pngResult.width,
      height: pngResult.height,
      scale: pngResult.scale
    };
  };

  const buildSinglePagePdfFromJpeg = (jpegDataUrl, imageWidthPx, imageHeightPx) => {
    const jpegBytes = dataUrlToUint8Array(jpegDataUrl);
    if (!jpegBytes.length) {
      throw new Error("JPEG payload is empty.");
    }
    const ptsPerPx = 72 / 96;
    const pageWidth = Math.max(1, imageWidthPx * ptsPerPx);
    const pageHeight = Math.max(1, imageHeightPx * ptsPerPx);
    const imageName = "Im0";
    const contentStream = `q\n${pageWidth.toFixed(3)} 0 0 ${pageHeight.toFixed(3)} 0 0 cm\n/${imageName} Do\nQ\n`;

    const textEncoder = new TextEncoder();
    const chunks = [];
    let totalLength = 0;
    const appendText = (text) => {
      const bytes = textEncoder.encode(text);
      chunks.push(bytes);
      totalLength += bytes.length;
    };
    const appendBytes = (bytes) => {
      chunks.push(bytes);
      totalLength += bytes.length;
    };

    const objects = [];
    objects.push("<< /Type /Catalog /Pages 2 0 R >>");
    objects.push("<< /Type /Pages /Kids [3 0 R] /Count 1 >>");
    objects.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth.toFixed(3)} ${pageHeight.toFixed(3)}] ` +
      `/Resources << /XObject << /${imageName} 4 0 R >> >> /Contents 5 0 R >>`
    );
    objects.push(
      `<< /Type /XObject /Subtype /Image /Width ${Math.max(1, Math.round(imageWidthPx))} ` +
      `/Height ${Math.max(1, Math.round(imageHeightPx))} /ColorSpace /DeviceRGB /BitsPerComponent 8 ` +
      `/Filter /DCTDecode /Length ${jpegBytes.length} >>\nstream\n__BINARY_JPEG__\nendstream`
    );
    const contentLength = textEncoder.encode(contentStream).length;
    objects.push(`<< /Length ${contentLength} >>\nstream\n${contentStream}endstream`);

    appendText("%PDF-1.4\n");
    appendBytes(new Uint8Array([0x25, 0xff, 0xff, 0xff, 0xff, 0x0a]));
    const objectOffsets = [];

    objects.forEach((body, index) => {
      const objectId = index + 1;
      objectOffsets.push(totalLength);
      appendText(`${objectId} 0 obj\n`);
      if (body.includes("__BINARY_JPEG__")) {
        const [prefix, suffix] = body.split("__BINARY_JPEG__");
        appendText(prefix);
        appendBytes(jpegBytes);
        appendText(suffix);
      } else {
        appendText(body);
      }
      appendText("\nendobj\n");
    });

    const xrefOffset = totalLength;
    appendText(`xref\n0 ${objects.length + 1}\n`);
    appendText("0000000000 65535 f \n");
    objectOffsets.forEach((offset) => {
      appendText(`${String(offset).padStart(10, "0")} 00000 n \n`);
    });
    appendText(`trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\n`);
    appendText(`startxref\n${xrefOffset}\n%%EOF\n`);

    const pdfBytes = new Uint8Array(totalLength);
    let cursor = 0;
    chunks.forEach((chunk) => {
      pdfBytes.set(chunk, cursor);
      cursor += chunk.length;
    });
    return {
      bytes: pdfBytes,
      widthPx: Math.max(1, Math.round(imageWidthPx)),
      heightPx: Math.max(1, Math.round(imageHeightPx)),
      pageWidth,
      pageHeight
    };
  };

  const exportPdf = async (model, options) => {
    const jpegResult = await exportJpeg(model, options);
    if (!jpegResult || !jpegResult.dataUrl) {
      throw new Error("Failed to render schematic PDF image.");
    }
    const pdf = buildSinglePagePdfFromJpeg(
      jpegResult.dataUrl,
      jpegResult.width,
      jpegResult.height
    );
    return {
      bytes: pdf.bytes,
      width: pdf.widthPx,
      height: pdf.heightPx,
      pageWidth: pdf.pageWidth,
      pageHeight: pdf.pageHeight
    };
  };

  const api = typeof self !== "undefined" ? (self.SpjutSimSchematic ?? {}) : {};
  api.exportSvg = exportSvg;
  api.exportPng = exportPng;
  api.exportJpeg = exportJpeg;
  api.exportPdf = exportPdf;
  if (typeof self !== "undefined") {
    self.SpjutSimSchematic = api;
  }
})();
