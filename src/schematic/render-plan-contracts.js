/**
 * Shared schematic render-plan contracts consumed by editor/export modules.
 */
(function initSchematicRenderPlanContractsModule() {
  const requireFunction = (value, name) => {
    if (typeof value !== "function") {
      throw new Error(`Schematic render-plan contracts require '${name}' function.`);
    }
    return value;
  };

  const getDifferentialProbeRotations = (component) => {
    if (!component || String(component?.type ?? "").toUpperCase() !== "PD") {
      return null;
    }
    return component.probeDiffRotations ?? null;
  };

  const createRenderPlanContracts = (input) => {
    const args = input && typeof input === "object" ? input : {};
    const schematicApi = args.schematicApi && typeof args.schematicApi === "object" ? args.schematicApi : null;
    if (!schematicApi) {
      throw new Error("Schematic render-plan contracts require schematicApi object.");
    }
    const contextName = String(args.contextName ?? "consumer").trim() || "consumer";

    const getHelper = (name, helperType) => {
      const helper = schematicApi?.[name];
      if (typeof helper !== "function") {
        throw new Error(`${helperType} helper '${name}' is unavailable. Ensure symbol-render.js loads before ${contextName}.`);
      }
      return helper;
    };
    const getProbeHelper = (name) => getHelper(name, "Probe");
    const getSpdtSwitchHelper = (name) => getHelper(name, "SPDT");
    const getTransformerHelper = (name) => getHelper(name, "Transformer");
    const getNamedNodeHelper = (name) => getHelper(name, "Named-node");
    const getGroundHelper = (name) => getHelper(name, "Ground");
    const getAnnotationHelper = (name) => getHelper(name, "Annotation");
    const getProbeStyle = () => {
      const style = getProbeHelper("getProbeStyle")();
      if (!style || typeof style !== "object") {
        throw new Error("Probe style helper returned invalid data.");
      }
      return style;
    };
    const getProbeLabelAnchor = (rotation) => {
      const anchor = getProbeHelper("getProbeLabelAnchor")(rotation, getProbeStyle());
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
      const extents = getProbeHelper("getProbeExtents")(rotation, getProbeStyle());
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
      const tip = getProbeHelper("getProbeTipPoint")(rotation, getProbeStyle());
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
      return Number(resolved);
    };

    const getNamedNodeLabelStyle = () => {
      const style = getNamedNodeHelper("getNamedNodeLabelStyle")();
      if (!style || typeof style !== "object") {
        throw new Error("Named-node style helper returned invalid data.");
      }
      return style;
    };

    const getNamedNodeGeometry = (textWidth, style) => {
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
        halfHeight: Number(geometry.halfHeight),
        slopeX: Number(geometry.slopeX),
        textX: Number(geometry.textX),
        endX: Number(geometry.endX)
      };
    };

    const getNamedNodeTextTransform = (rotation, style, options) => {
      const transform = getNamedNodeHelper("getNamedNodeTextTransform")(rotation, style, options);
      if (!transform || !Number.isFinite(transform.rotation) || !Number.isFinite(transform.y)) {
        throw new Error("Named-node text transform helper returned invalid data.");
      }
      return {
        rotation: Number(transform.rotation),
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

    const getNamedNodeExtents = (rotation, geometry, options) => {
      const extents = getNamedNodeHelper("getNamedNodeExtents")(rotation, geometry, options);
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
        maxY: Number(extents.maxY)
      };
    };

    const normalizeGroundVariant = (value) => {
      const normalized = getGroundHelper("normalizeGroundVariant")(value);
      if (typeof normalized !== "string" || !normalized.trim()) {
        throw new Error("Ground variant helper returned invalid data.");
      }
      return normalized;
    };

    const getGroundExtents = (rotation, groundVariant) => {
      const extents = getGroundHelper("getGroundSymbolExtents")(rotation, groundVariant);
      if (
        !extents
        || !Number.isFinite(extents.minX)
        || !Number.isFinite(extents.maxX)
        || !Number.isFinite(extents.minY)
        || !Number.isFinite(extents.maxY)
      ) {
        throw new Error("Ground extents helper returned invalid data.");
      }
      return {
        minX: Number(extents.minX),
        maxX: Number(extents.maxX),
        minY: Number(extents.minY),
        maxY: Number(extents.maxY)
      };
    };

    const getAnnotationSymbolName = (type) => {
      const symbol = getAnnotationHelper("getAnnotationSymbolName")(type);
      if (symbol === null || symbol === undefined || symbol === "") {
        return null;
      }
      return String(symbol);
    };

    const getAnnotationExtents = (type, rotation) => {
      const extents = getAnnotationHelper("getAnnotationExtents")(type, rotation);
      if (
        !extents
        || !Number.isFinite(extents.minX)
        || !Number.isFinite(extents.maxX)
        || !Number.isFinite(extents.minY)
        || !Number.isFinite(extents.maxY)
      ) {
        throw new Error("Annotation extents helper returned invalid data.");
      }
      return {
        minX: Number(extents.minX),
        maxX: Number(extents.maxX),
        minY: Number(extents.minY),
        maxY: Number(extents.maxY)
      };
    };

    const getArrowAnnotationStyle = (value, options) => {
      const style = getAnnotationHelper("parseArrowAnnotationStyle")(value, options);
      if (
        !style
        || !Number.isFinite(Number(style.thickness))
        || typeof style.lineType !== "string"
        || !Number.isFinite(Number(style.opacity))
        || !Number.isFinite(Number(style.opacityPercent))
      ) {
        throw new Error("Arrow annotation style helper returned invalid data.");
      }
      return {
        thickness: Number(style.thickness),
        lineType: String(style.lineType),
        opacity: Number(style.opacity),
        opacityPercent: Number(style.opacityPercent)
      };
    };

    const getArrowAnnotationDasharray = (lineType, thickness) => {
      const dash = getAnnotationHelper("getArrowAnnotationDasharray")(lineType, thickness);
      return String(dash ?? "");
    };

    const getTextAnnotationStyle = (value, options) => {
      const style = getAnnotationHelper("parseTextAnnotationStyle")(value, options);
      if (
        !style
        || !Number.isFinite(Number(style.opacity))
        || !Number.isFinite(Number(style.opacityPercent))
      ) {
        throw new Error("Text annotation style helper returned invalid data.");
      }
      return {
        opacity: Number(style.opacity),
        opacityPercent: Number(style.opacityPercent)
      };
    };
    const resolveAnnotationOpacity = (baseOpacity, previewOpacity) => {
      const normalizedBaseOpacity = Number.isFinite(Number(baseOpacity))
        ? Math.max(0, Math.min(1, Number(baseOpacity)))
        : 1;
      const normalizedPreviewOpacity = Number.isFinite(Number(previewOpacity))
        ? Math.max(0, Math.min(1, Number(previewOpacity)))
        : null;
      if (normalizedPreviewOpacity === null) {
        return normalizedBaseOpacity;
      }
      return Math.max(0, Math.min(1, normalizedBaseOpacity * normalizedPreviewOpacity));
    };

    const buildTextAnnotationRenderAttributes = (style, input) => {
      if (!style || typeof style !== "object") {
        throw new Error("Text annotation render attributes require style object.");
      }
      const args = input && typeof input === "object" ? input : {};
      return {
        opacity: resolveAnnotationOpacity(style.opacity, args.previewOpacity),
        opacityPercent: Number(style.opacityPercent)
      };
    };

    const buildArrowAnnotationRenderAttributes = (style, input) => {
      if (!style || typeof style !== "object") {
        throw new Error("Arrow annotation render attributes require style object.");
      }
      const args = input && typeof input === "object" ? input : {};
      const thickness = Number.isFinite(Number(args.thickness))
        ? Math.max(0.5, Number(args.thickness))
        : Number(style.thickness);
      const lineType = String(style.lineType ?? "").trim() || "solid";
      return {
        thickness,
        lineType,
        opacity: resolveAnnotationOpacity(style.opacity, args.previewOpacity),
        opacityPercent: Number(style.opacityPercent),
        dasharray: getArrowAnnotationDasharray(lineType, thickness)
      };
    };

    const getDefaultBoxAnnotationStyle = (options) => {
      const style = getAnnotationHelper("getDefaultBoxAnnotationStyle")(options);
      if (!style || typeof style !== "object") {
        throw new Error("Box annotation style helper returned invalid defaults.");
      }
      return style;
    };

    const getBoxAnnotationStyle = (value, options) => {
      const style = getAnnotationHelper("parseBoxAnnotationStyle")(value, options);
      if (
        !style
        || !Number.isFinite(Number(style.thickness))
        || typeof style.lineType !== "string"
        || typeof style.fillEnabled !== "boolean"
        || typeof style.fillColor !== "string"
        || !Number.isFinite(Number(style.opacity))
        || !Number.isFinite(Number(style.opacityPercent))
      ) {
        throw new Error("Box annotation style helper returned invalid data.");
      }
      return {
        thickness: Number(style.thickness),
        lineType: String(style.lineType),
        fillEnabled: style.fillEnabled === true,
        fillColor: String(style.fillColor),
        opacity: Number(style.opacity),
        opacityPercent: Number(style.opacityPercent)
      };
    };

    const buildBoxAnnotationRenderAttributes = (style, input) => {
      if (!style || typeof style !== "object") {
        throw new Error("Box annotation render attributes require style object.");
      }
      const args = input && typeof input === "object" ? input : {};
      const thickness = Number.isFinite(Number(args.thickness))
        ? Math.max(0.5, Number(args.thickness))
        : Number(style.thickness);
      const lineType = String(style.lineType ?? "").trim() || "solid";
      return {
        thickness,
        lineType,
        fillEnabled: style.fillEnabled === true,
        fillColor: String(style.fillColor ?? ""),
        opacity: resolveAnnotationOpacity(style.opacity, args.previewOpacity),
        opacityPercent: Number(style.opacityPercent),
        dasharray: getBoxAnnotationDasharray(lineType, thickness)
      };
    };

    const buildArrowAnnotationGeometry = (component) => {
      const pins = Array.isArray(component?.pins) ? component.pins : [];
      if (pins.length < 2) {
        return null;
      }
      const startX = Number(pins[0]?.x);
      const startY = Number(pins[0]?.y);
      const endX = Number(pins[1]?.x);
      const endY = Number(pins[1]?.y);
      if (
        !Number.isFinite(startX)
        || !Number.isFinite(startY)
        || !Number.isFinite(endX)
        || !Number.isFinite(endY)
      ) {
        return null;
      }
      const dx = endX - startX;
      const dy = endY - startY;
      const length = Math.hypot(dx, dy);
      if (!Number.isFinite(length) || length <= 0) {
        return null;
      }
      const angle = Math.atan2(dy, dx) * (180 / Math.PI);
      return {
        start: { x: startX, y: startY },
        end: { x: endX, y: endY },
        length,
        angle,
        transform: `translate(${startX} ${startY}) rotate(${angle})`
      };
    };

    const buildBoxAnnotationGeometry = (component) => {
      const pins = Array.isArray(component?.pins) ? component.pins : [];
      if (pins.length < 2) {
        return null;
      }
      const cornerAX = Number(pins[0]?.x);
      const cornerAY = Number(pins[0]?.y);
      const cornerBX = Number(pins[1]?.x);
      const cornerBY = Number(pins[1]?.y);
      if (
        !Number.isFinite(cornerAX)
        || !Number.isFinite(cornerAY)
        || !Number.isFinite(cornerBX)
        || !Number.isFinite(cornerBY)
      ) {
        return null;
      }
      const minX = Math.min(cornerAX, cornerBX);
      const minY = Math.min(cornerAY, cornerBY);
      const width = Math.abs(cornerBX - cornerAX);
      const height = Math.abs(cornerBY - cornerAY);
      return {
        minX,
        minY,
        width,
        height,
        transform: `translate(${minX} ${minY})`
      };
    };

    const formatBoxAnnotationStyle = (style, options) => {
      const text = String(getAnnotationHelper("formatBoxAnnotationStyle")(style, options) ?? "").trim();
      if (!text) {
        throw new Error("Box annotation style formatter returned invalid data.");
      }
      return text;
    };

    const getBoxAnnotationDasharray = (lineType, thickness) => {
      const dash = getAnnotationHelper("getBoxAnnotationDasharray")(lineType, thickness);
      return String(dash ?? "");
    };

    const getDifferentialProbeGeometry = (component) => {
      const helper = getProbeHelper("getDifferentialProbeGeometry");
      const geometry = helper(
        component?.pins,
        Number(component?.rotation ?? 0),
        getProbeStyle(),
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
        style: getProbeStyle(),
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

    const getTransformerRenderPlan = (component) => {
      const helper = getTransformerHelper("getTransformerRenderPlan");
      const plan = helper(component?.pins, component?.xfmrPolarity);
      if (
        !plan
        || !plan.center
        || !plan.extents
        || !plan.coils
        || !Number.isFinite(plan.center.x)
        || !Number.isFinite(plan.center.y)
        || !Number.isFinite(plan.angle)
        || !Number.isFinite(plan.extents.minX)
        || !Number.isFinite(plan.extents.maxX)
        || !Number.isFinite(plan.extents.minY)
        || !Number.isFinite(plan.extents.maxY)
      ) {
        throw new Error("Transformer render plan helper returned invalid data.");
      }
      return {
        ...plan,
        center: {
          x: Number(plan.center.x),
          y: Number(plan.center.y)
        },
        angle: Number(plan.angle),
        extents: {
          minX: Number(plan.extents.minX),
          maxX: Number(plan.extents.maxX),
          minY: Number(plan.extents.minY),
          maxY: Number(plan.extents.maxY)
        }
      };
    };

    const getTransformerExtents = (component) => {
      const helper = getTransformerHelper("getTransformerExtents");
      const extents = helper(component?.pins, component?.xfmrPolarity);
      if (
        !extents
        || !Number.isFinite(extents.minX)
        || !Number.isFinite(extents.maxX)
        || !Number.isFinite(extents.minY)
        || !Number.isFinite(extents.maxY)
      ) {
        throw new Error("Transformer extents helper returned invalid data.");
      }
      return {
        minX: Number(extents.minX),
        maxX: Number(extents.maxX),
        minY: Number(extents.minY),
        maxY: Number(extents.maxY)
      };
    };

    const getTransformerLabelGeometry = (component, plan) => {
      const helper = getTransformerHelper("getTransformerLabelGeometry");
      const geometry = helper(component?.pins, component?.xfmrPolarity, plan);
      if (
        !geometry
        || !Number.isFinite(geometry.midX)
        || !Number.isFinite(geometry.midY)
        || !Number.isFinite(geometry.angle)
      ) {
        throw new Error("Transformer label geometry helper returned invalid data.");
      }
      return {
        midX: Number(geometry.midX),
        midY: Number(geometry.midY),
        angle: Number(geometry.angle)
      };
    };

    const snapQuarterRotation = (angle) => {
      if (!Number.isFinite(angle)) {
        return 0;
      }
      const snapped = Math.round(angle / 90) * 90;
      return ((snapped % 360) + 360) % 360;
    };

    const estimateMiddleBaselineHalfHeight = (size, fallback) => {
      const numeric = Number(size);
      if (!Number.isFinite(numeric) || numeric <= 0) {
        const fallbackValue = Number.isFinite(Number(fallback))
          ? Number(fallback)
          : 7;
        return Math.max(1, fallbackValue);
      }
      return Math.max(1, numeric * 0.6);
    };

    const getTwoPinVisualHalfExtent = (type, length, options) => {
      const normalized = String(type ?? "").trim().toUpperCase();
      const safeLength = Number.isFinite(Number(length)) && Number(length) > 0
        ? Number(length)
        : 0;
      if (normalized === "R") {
        const normalizeResistorStyle = schematicApi?.normalizeResistorStyle;
        const resistorStyle = typeof normalizeResistorStyle === "function"
          ? String(normalizeResistorStyle(options?.resistorStyle) ?? "zigzag").toLowerCase()
          : String(options?.resistorStyle ?? "zigzag").trim().toLowerCase();
        const lead = Math.max(6, Math.min(12, safeLength * 0.2));
        const bodyLength = Math.max(8, safeLength - (lead * 2));
        if (resistorStyle === "box") {
          return Math.max(0, Math.min(6, bodyLength * 0.175));
        }
        return Math.max(0, Math.min(6, bodyLength * 0.25));
      }
      if (normalized === "C") {
        return 8;
      }
      if (normalized === "L") {
        const lead = Math.max(6, Math.min(12, safeLength * 0.2));
        const coilSpan = Math.max(0, safeLength - (lead * 2));
        const coilCount = 4;
        return Math.max(0, Math.min(6, coilSpan / (coilCount * 2)));
      }
      if (normalized === "D") {
        const lead = Math.max(6, Math.min(10, safeLength * 0.2));
        const bodyLength = Math.max(8, safeLength - (lead * 2));
        // Keep in sync with drawDiodeSymbol() in src/schematic/symbol-render.js.
        const triBase = Math.min(20, bodyLength * 0.6);
        return Math.max(0, triBase / 2);
      }
      if (normalized === "V" || normalized === "VAC" || normalized === "I" || normalized === "VM" || normalized === "AM") {
        return Math.max(0, Math.min(12, safeLength * 0.25));
      }
      return 0;
    };

    const resolveTwoPinLabelPosition = (layout, options = {}) => {
      const sourceLayout = layout && typeof layout === "object"
        ? layout
        : {};
      const sourceDefaults = options.labelLayoutDefaults && typeof options.labelLayoutDefaults === "object"
        ? options.labelLayoutDefaults
        : {};
      const layoutLineHeight = Number(sourceDefaults.lineHeight);
      const fallbackLineHeight = Number(options.labelLineHeight);
      const safeLabelLineHeight = Number.isFinite(fallbackLineHeight) && fallbackLineHeight > 0
        ? fallbackLineHeight
        : (Number.isFinite(layoutLineHeight) && layoutLineHeight > 0 ? layoutLineHeight : 14);
      const layoutPadding = Number(sourceDefaults.padding);
      const safePadding = Number.isFinite(layoutPadding) ? layoutPadding : 16;
      const labelEdgeMargin = Math.max(2, safePadding - (safeLabelLineHeight * 0.9));
      const midX = Number(options.midX);
      const midY = Number(options.midY);
      const rotation = snapQuarterRotation((Number(options.angle) || 0) + (Number(options.labelRotation) || 0));
      const lineCount = Math.max(1, Math.round(Number(options.lineCount) || 1));
      const lineHeight = Number(options.lineHeight);
      const safeLineHeight = Number.isFinite(lineHeight) && lineHeight > 0
        ? lineHeight
        : safeLabelLineHeight;
      const trailingOffset = safeLineHeight * Math.max(0, lineCount - 1);
      const labelHalf = estimateMiddleBaselineHalfHeight(options.labelSize, safeLabelLineHeight * 0.5);
      const valueHalf = estimateMiddleBaselineHalfHeight(options.valueSize, labelHalf);
      const trailingHalf = lineCount > 1 ? valueHalf : labelHalf;
      const topPerceptionCompensation = Math.max(0, (labelHalf - valueHalf) * 2);
      const topMargin = Math.max(1, labelEdgeMargin - topPerceptionCompensation);
      const symbolHalf = Number(options.symbolHalfExtent);
      const safeSymbolHalf = Number.isFinite(symbolHalf) && symbolHalf > 0
        ? symbolHalf
        : 0;
      let x = Number(sourceLayout.x);
      let y = Number(sourceLayout.y);
      if (!Number.isFinite(x)) {
        x = Number.isFinite(midX) ? midX : 0;
      }
      if (!Number.isFinite(y)) {
        y = Number.isFinite(midY) ? midY : 0;
      }

      if (Number.isFinite(midY)) {
        if (rotation === 0) {
          y = midY - safeSymbolHalf - topMargin - trailingHalf - trailingOffset;
        } else if (rotation === 180) {
          y = midY + safeSymbolHalf + labelEdgeMargin + labelHalf;
        } else if (rotation === 90 || rotation === 270) {
          y = midY - (trailingOffset * 0.5);
        }
      }
      if (Number.isFinite(midX)) {
        if (rotation === 90) {
          x = midX + safeSymbolHalf + labelEdgeMargin;
        } else if (rotation === 270) {
          x = midX - safeSymbolHalf - labelEdgeMargin;
        }
      }
      return { x, y };
    };

    return Object.freeze({
      getNamedNodeLabelStyle,
      getNamedNodeGeometry,
      getNamedNodeTextTransform,
      getNamedNodeTextAnchorX,
      getNamedNodeExtents,
      normalizeGroundVariant,
      getGroundExtents,
      getProbeLabelAnchor,
      getProbeExtents,
      getProbeTipPoint,
      getProbeFlippedRotation,
      getAnnotationSymbolName,
      getAnnotationExtents,
      getArrowAnnotationStyle,
      getArrowAnnotationDasharray,
      getTextAnnotationStyle,
      resolveAnnotationOpacity,
      buildTextAnnotationRenderAttributes,
      buildArrowAnnotationRenderAttributes,
      buildArrowAnnotationGeometry,
      getDefaultBoxAnnotationStyle,
      getBoxAnnotationStyle,
      buildBoxAnnotationRenderAttributes,
      buildBoxAnnotationGeometry,
      formatBoxAnnotationStyle,
      getBoxAnnotationDasharray,
      getDifferentialProbeRotations,
      getDifferentialProbeGeometry,
      getDifferentialProbeRenderPlan,
      getDifferentialPolarityColor,
      getSpdtSwitchRenderPlan,
      getSpdtSwitchExtents,
      getSpdtLabelGeometry,
      getTransformerRenderPlan,
      getTransformerExtents,
      getTransformerLabelGeometry,
      getTwoPinVisualHalfExtent,
      resolveTwoPinLabelPosition
    });
  };

  if (typeof self !== "undefined") {
    self.SpjutSimSchematicRenderPlanContracts = {
      createRenderPlanContracts: requireFunction(createRenderPlanContracts, "createRenderPlanContracts")
    };
  }
})();
