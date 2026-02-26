/**
 * Shared symbol rendering helpers for both editor and export.
 */
(function initSymbolRender() {
  const DEFAULT_STROKE = "#1d1d1f";
  const DEFAULT_WIDTH = 2;
  const DEFAULT_NET_LABEL_STYLE = Object.freeze({
    fontSize: 11,
    marginLeft: 1,
    marginRight: 3,
    marginY: 2,
    minTextWidth: 8,
    textOffsetY: 1,
    textOnlyOffsetY: 6
  });
  const DEFAULT_PROBE_STYLE = Object.freeze({
    leadDx: 20,
    leadDy: -20,
    tipRadius: 3,
    labelOffsetX: 6,
    labelOffsetY: 0
  });
  const DIFFERENTIAL_PROBE_LINK_DASH = "5 3";
  const PROBE_FLIP_ROTATION_MAP = Object.freeze({
    h: Object.freeze({
      0: 270,
      90: 180,
      180: 90,
      270: 0
    }),
    v: Object.freeze({
      0: 90,
      90: 0,
      180: 270,
      270: 180
    })
  });

  const snapQuarterTurn = (angle) => {
    if (!Number.isFinite(angle)) {
      return 0;
    }
    const snapped = Math.round(angle / 90) * 90;
    return ((snapped % 360) + 360) % 360;
  };

  const resolveNamedNodeLabelStyle = (style) => {
    const base = style ?? DEFAULT_NET_LABEL_STYLE;
    const resolved = {
      fontSize: Number(base.fontSize),
      marginLeft: Number(base.marginLeft),
      marginRight: Number(base.marginRight),
      marginY: Number(base.marginY),
      minTextWidth: Number(base.minTextWidth),
      textOffsetY: Number(base.textOffsetY),
      textOnlyOffsetY: Number(base.textOnlyOffsetY)
    };
    if (!Number.isFinite(resolved.fontSize)) {
      resolved.fontSize = DEFAULT_NET_LABEL_STYLE.fontSize;
    }
    if (!Number.isFinite(resolved.marginLeft)) {
      resolved.marginLeft = DEFAULT_NET_LABEL_STYLE.marginLeft;
    }
    if (!Number.isFinite(resolved.marginRight)) {
      resolved.marginRight = DEFAULT_NET_LABEL_STYLE.marginRight;
    }
    if (!Number.isFinite(resolved.marginY)) {
      resolved.marginY = DEFAULT_NET_LABEL_STYLE.marginY;
    }
    if (!Number.isFinite(resolved.minTextWidth)) {
      resolved.minTextWidth = DEFAULT_NET_LABEL_STYLE.minTextWidth;
    }
    if (!Number.isFinite(resolved.textOffsetY)) {
      resolved.textOffsetY = DEFAULT_NET_LABEL_STYLE.textOffsetY;
    }
    if (!Number.isFinite(resolved.textOnlyOffsetY)) {
      resolved.textOnlyOffsetY = DEFAULT_NET_LABEL_STYLE.textOnlyOffsetY;
    }
    return resolved;
  };

  const getNamedNodeLabelStyle = () => ({ ...DEFAULT_NET_LABEL_STYLE });

  const getNamedNodeGeometry = (textWidth, style) => {
    const resolvedStyle = resolveNamedNodeLabelStyle(style);
    const safeTextWidth = Math.max(
      resolvedStyle.minTextWidth,
      Math.ceil(Number.isFinite(textWidth) ? textWidth : 0)
    );
    const halfHeight = Math.max(6, Math.ceil((resolvedStyle.fontSize / 2) + resolvedStyle.marginY));
    const slopeX = halfHeight;
    const textX = slopeX + resolvedStyle.marginLeft + (safeTextWidth / 2);
    const endX = slopeX + resolvedStyle.marginLeft + safeTextWidth + resolvedStyle.marginRight;
    return {
      halfHeight,
      slopeX,
      textX,
      endX
    };
  };

  const getNamedNodeTextTransform = (rotation, style, options) => {
    const resolvedStyle = resolveNamedNodeLabelStyle(style);
    const snapped = snapQuarterTurn(rotation);
    const localRotation = (snapped === 90 || snapped === 180) ? 180 : 0;
    const textOnly = Boolean(options?.textOnly);
    let baseOffset = textOnly ? resolvedStyle.textOnlyOffsetY : resolvedStyle.textOffsetY;
    if (textOnly && (snapped === 90 || snapped === 180)) {
      baseOffset += 2;
    }
    const y = textOnly
      ? -baseOffset
      : (localRotation === 180 ? -baseOffset : baseOffset);
    return {
      rotation: localRotation,
      y
    };
  };

  const getNamedNodeTextAnchorX = (rotation, geometry, options) => {
    const snapped = snapQuarterTurn(rotation);
    const textOnly = Boolean(options?.textOnly);
    const baseX = Number(geometry?.textX);
    const safeBaseX = Number.isFinite(baseX) ? baseX : 0;
    if (textOnly && (snapped === 180 || snapped === 270)) {
      return -safeBaseX;
    }
    return safeBaseX;
  };

  const rotateQuarterPoint = (x, y, rotation) => {
    const snapped = snapQuarterTurn(rotation);
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

  const rotateProbePoint = (x, y, rotation) => {
    const snapped = snapQuarterTurn(rotation);
    if (snapped === 90) {
      return { x: -y, y: x };
    }
    if (snapped === 180) {
      return { x: -x, y: -y };
    }
    if (snapped === 270) {
      return { x: y, y: -x };
    }
    return { x, y };
  };

  const resolveProbeStyle = (style) => {
    const base = style ?? DEFAULT_PROBE_STYLE;
    const resolved = {
      leadDx: Number(base.leadDx),
      leadDy: Number(base.leadDy),
      tipRadius: Number(base.tipRadius),
      labelOffsetX: Number(base.labelOffsetX),
      labelOffsetY: Number(base.labelOffsetY)
    };
    if (!Number.isFinite(resolved.leadDx)) {
      resolved.leadDx = DEFAULT_PROBE_STYLE.leadDx;
    }
    if (!Number.isFinite(resolved.leadDy)) {
      resolved.leadDy = DEFAULT_PROBE_STYLE.leadDy;
    }
    if (!Number.isFinite(resolved.tipRadius) || resolved.tipRadius <= 0) {
      resolved.tipRadius = DEFAULT_PROBE_STYLE.tipRadius;
    }
    if (!Number.isFinite(resolved.labelOffsetX)) {
      resolved.labelOffsetX = DEFAULT_PROBE_STYLE.labelOffsetX;
    }
    if (!Number.isFinite(resolved.labelOffsetY)) {
      resolved.labelOffsetY = DEFAULT_PROBE_STYLE.labelOffsetY;
    }
    return resolved;
  };

  const getProbeStyle = () => ({ ...DEFAULT_PROBE_STYLE });

  const getProbeTipPoint = (rotation, style) => {
    const probeStyle = resolveProbeStyle(style);
    return rotateProbePoint(probeStyle.leadDx, probeStyle.leadDy, rotation);
  };

  const getProbeLabelAnchor = (rotation, style) => {
    const probeStyle = resolveProbeStyle(style);
    const tip = getProbeTipPoint(rotation, probeStyle);
    const snapped = snapQuarterTurn(rotation);
    const horizontalDistance = Math.abs(probeStyle.labelOffsetX);
    const placeRightOfTip = snapped === 0 || snapped === 90;
    const offset = {
      x: (placeRightOfTip ? 1 : -1) * horizontalDistance,
      y: probeStyle.labelOffsetY
    };
    let anchor = "middle";
    if (horizontalDistance > 0.001 && offset.x > 0.001) {
      anchor = "start";
    } else if (horizontalDistance > 0.001 && offset.x < -0.001) {
      anchor = "end";
    }
    return {
      x: tip.x + offset.x,
      y: tip.y + offset.y,
      anchor
    };
  };

  const getProbeExtents = (rotation, style) => {
    const probeStyle = resolveProbeStyle(style);
    const tip = getProbeTipPoint(rotation, probeStyle);
    const radius = probeStyle.tipRadius;
    return {
      minX: Math.min(0, tip.x - radius),
      maxX: Math.max(0, tip.x + radius),
      minY: Math.min(0, tip.y - radius),
      maxY: Math.max(0, tip.y + radius)
    };
  };

  const getProbeFlippedRotation = (rotation, axis) => {
    const snapped = snapQuarterTurn(rotation);
    const normalizedAxis = String(axis ?? "").trim().toLowerCase() === "v" ? "v" : "h";
    const next = PROBE_FLIP_ROTATION_MAP[normalizedAxis]?.[snapped];
    return Number.isFinite(next) ? next : snapped;
  };

  const resolveDifferentialProbePins = (pins) => {
    const entries = Array.isArray(pins) ? pins : [];
    if (entries.length < 2) {
      return null;
    }
    const findPin = (token) => entries.find((pin) =>
      String(pin?.id ?? pin?.name ?? "").trim().toUpperCase() === token);
    const posSource = findPin("P+") ?? entries[0];
    const negSource = findPin("P-") ?? entries[1];
    if (!posSource || !negSource || posSource === negSource) {
      return null;
    }
    const posX = Number(posSource.x);
    const posY = Number(posSource.y);
    const negX = Number(negSource.x);
    const negY = Number(negSource.y);
    if (!Number.isFinite(posX) || !Number.isFinite(posY) || !Number.isFinite(negX) || !Number.isFinite(negY)) {
      return null;
    }
    return {
      pos: { x: posX, y: posY },
      neg: { x: negX, y: negY }
    };
  };

  const resolveDifferentialProbeRotations = (rotations, fallbackRotation) => {
    const fallback = snapQuarterTurn(fallbackRotation);
    const source = rotations && typeof rotations === "object"
      ? rotations
      : null;
    const posRaw = source
      ? (source["P+"] ?? source.pos ?? source.plus)
      : null;
    const negRaw = source
      ? (source["P-"] ?? source.neg ?? source.minus)
      : null;
    return {
      pos: Number.isFinite(Number(posRaw)) ? snapQuarterTurn(Number(posRaw)) : fallback,
      neg: Number.isFinite(Number(negRaw)) ? snapQuarterTurn(Number(negRaw)) : fallback
    };
  };

  const getDifferentialProbeGeometry = (pins, rotation, style, rotations) => {
    const resolvedPins = resolveDifferentialProbePins(pins);
    if (!resolvedPins) {
      return null;
    }
    const probeStyle = resolveProbeStyle(style);
    const resolvedRotations = resolveDifferentialProbeRotations(rotations, rotation);
    const posRotation = resolvedRotations.pos;
    const negRotation = resolvedRotations.neg;
    const posTipOffset = getProbeTipPoint(posRotation, probeStyle);
    const negTipOffset = getProbeTipPoint(negRotation, probeStyle);
    const posTip = {
      x: resolvedPins.pos.x + posTipOffset.x,
      y: resolvedPins.pos.y + posTipOffset.y
    };
    const negTip = {
      x: resolvedPins.neg.x + negTipOffset.x,
      y: resolvedPins.neg.y + negTipOffset.y
    };
    const posLabelAnchor = getProbeLabelAnchor(posRotation, probeStyle);
    const labelAnchor = {
      x: resolvedPins.pos.x + posLabelAnchor.x,
      y: resolvedPins.pos.y + posLabelAnchor.y,
      anchor: posLabelAnchor.anchor
    };
    const anchorRadius = Math.max(2, Math.min(4, probeStyle.tipRadius - 0.5));
    const minX = Math.min(
      resolvedPins.pos.x - anchorRadius,
      resolvedPins.neg.x - anchorRadius,
      posTip.x - probeStyle.tipRadius,
      negTip.x - probeStyle.tipRadius
    );
    const maxX = Math.max(
      resolvedPins.pos.x + anchorRadius,
      resolvedPins.neg.x + anchorRadius,
      posTip.x + probeStyle.tipRadius,
      negTip.x + probeStyle.tipRadius
    );
    const minY = Math.min(
      resolvedPins.pos.y - anchorRadius,
      resolvedPins.neg.y - anchorRadius,
      posTip.y - probeStyle.tipRadius,
      negTip.y - probeStyle.tipRadius
    );
    const maxY = Math.max(
      resolvedPins.pos.y + anchorRadius,
      resolvedPins.neg.y + anchorRadius,
      posTip.y + probeStyle.tipRadius,
      negTip.y + probeStyle.tipRadius
    );
    return {
      pos: resolvedPins.pos,
      neg: resolvedPins.neg,
      posRotation,
      negRotation,
      posTip,
      negTip,
      posTipOffset,
      negTipOffset,
      labelAnchor,
      anchorRadius,
      extents: {
        minX,
        maxX,
        minY,
        maxY
      }
    };
  };

  const parseHexColor = (value) => {
    const text = String(value ?? "").trim().toLowerCase();
    if (!/^#[0-9a-f]{6}$/.test(text)) {
      return null;
    }
    return {
      r: Number.parseInt(text.slice(1, 3), 16),
      g: Number.parseInt(text.slice(3, 5), 16),
      b: Number.parseInt(text.slice(5, 7), 16)
    };
  };

  const getContrastPolarityColor = (fillColor) => {
    const rgb = parseHexColor(fillColor);
    if (!rgb) {
      return "#fbfaf7";
    }
    const luminance = (0.299 * rgb.r) + (0.587 * rgb.g) + (0.114 * rgb.b);
    return luminance >= 150 ? "#1d1d1f" : "#fbfaf7";
  };

  const getDifferentialProbeRenderPlan = (pins, options) => {
    const settings = options ?? {};
    const geometry = getDifferentialProbeGeometry(
      pins,
      settings.rotation,
      settings.style,
      settings.rotations
    );
    if (!geometry) {
      return null;
    }
    const headRadius = Math.max(3, Number(geometry.anchorRadius) + 1.25);
    return {
      geometry,
      headRadius,
      link: {
        x1: geometry.posTip.x,
        y1: geometry.posTip.y,
        x2: geometry.negTip.x,
        y2: geometry.negTip.y,
        dash: DIFFERENTIAL_PROBE_LINK_DASH
      },
      endpoints: [
        {
          side: "plus",
          pinId: "P+",
          polarity: "+",
          anchor: geometry.pos,
          tip: geometry.posTip,
          rotation: geometry.posRotation,
          polarityPosition: {
            x: geometry.posTip.x,
            y: geometry.posTip.y
          }
        },
        {
          side: "minus",
          pinId: "P-",
          polarity: "-",
          anchor: geometry.neg,
          tip: geometry.negTip,
          rotation: geometry.negRotation,
          polarityPosition: {
            x: geometry.negTip.x,
            y: geometry.negTip.y
          }
        }
      ]
    };
  };

  const normalizePinToken = (pin) => String(pin?.id ?? pin?.name ?? "").trim().toUpperCase();

  const toPinPoint = (pin) => {
    const x = Number(pin?.x);
    const y = Number(pin?.y);
    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      return null;
    }
    return { x, y };
  };

  const pickSpdtPinByToken = (entries, token, used) => {
    for (const pin of entries) {
      if (used.has(pin)) {
        continue;
      }
      if (normalizePinToken(pin) !== token) {
        continue;
      }
      used.add(pin);
      return pin;
    }
    return null;
  };

  const pickNextSpdtPin = (entries, used) => {
    for (const pin of entries) {
      if (used.has(pin)) {
        continue;
      }
      used.add(pin);
      return pin;
    }
    return null;
  };

  const resolveSpdtSwitchPins = (pins) => {
    const entries = Array.isArray(pins) ? pins : [];
    if (entries.length < 3) {
      return null;
    }
    const used = new Set();
    const centerSource = pickSpdtPinByToken(entries, "C", used) ?? pickNextSpdtPin(entries, used);
    const throwASource = pickSpdtPinByToken(entries, "A", used) ?? pickNextSpdtPin(entries, used);
    const throwBSource = pickSpdtPinByToken(entries, "B", used) ?? pickNextSpdtPin(entries, used);
    const center = toPinPoint(centerSource);
    const throwA = toPinPoint(throwASource);
    const throwB = toPinPoint(throwBSource);
    if (!center || !throwA || !throwB) {
      return null;
    }
    return {
      C: center,
      A: throwA,
      B: throwB
    };
  };

  const movePointToward = (from, to, distance) => {
    const dx = Number(to?.x) - Number(from?.x);
    const dy = Number(to?.y) - Number(from?.y);
    const length = Math.hypot(dx, dy);
    if (!Number.isFinite(length) || length <= 0) {
      return { x: Number(from?.x) || 0, y: Number(from?.y) || 0 };
    }
    const safeDistance = Number.isFinite(distance) ? distance : 0;
    const ratio = Math.max(0, Math.min(1, safeDistance / length));
    return {
      x: Number(from?.x) + dx * ratio,
      y: Number(from?.y) + dy * ratio
    };
  };

  const getSpdtSwitchParser = () => {
    const api = typeof self !== "undefined" ? (self.SpjutSimSchematic ?? {}) : {};
    const parser = api?.parseSpdtSwitchValue;
    if (typeof parser !== "function") {
      throw new Error("Schematic API missing 'parseSpdtSwitchValue'. Check src/schematic/model.js load order.");
    }
    return parser;
  };

  const getSpdtSwitchRenderPlan = (pins, value) => {
    const resolvedPins = resolveSpdtSwitchPins(pins);
    if (!resolvedPins) {
      return null;
    }
    const parser = getSpdtSwitchParser();
    let parsed = null;
    let parseError = null;
    try {
      parsed = parser(value);
    } catch (error) {
      parseError = error;
      parsed = {
        activeThrow: "A",
        ron: "1u",
        roff: null
      };
    }
    const activeThrow = String(parsed?.activeThrow ?? "A").toUpperCase() === "B" ? "B" : "A";
    const inactiveThrow = activeThrow === "A" ? "B" : "A";
    const center = resolvedPins.C;
    const throwA = resolvedPins.A;
    const throwB = resolvedPins.B;
    const throwMid = {
      x: (throwA.x + throwB.x) / 2,
      y: (throwA.y + throwB.y) / 2
    };
    const towardThrowsDx = throwMid.x - center.x;
    const towardThrowsDy = throwMid.y - center.y;
    const towardThrowsLength = Math.hypot(towardThrowsDx, towardThrowsDy);
    const towardThrowsUnit = towardThrowsLength > 0
      ? { x: towardThrowsDx / towardThrowsLength, y: towardThrowsDy / towardThrowsLength }
      : { x: 1, y: 0 };
    const pivotOffset = Math.max(4, Math.min(16, towardThrowsLength * 0.55));
    const pivot = {
      x: center.x + towardThrowsUnit.x * pivotOffset,
      y: center.y + towardThrowsUnit.y * pivotOffset
    };
    const pivotToA = Math.hypot(throwA.x - pivot.x, throwA.y - pivot.y);
    const pivotToB = Math.hypot(throwB.x - pivot.x, throwB.y - pivot.y);
    const contactInset = Math.max(2.5, Math.min(10, Math.min(pivotToA, pivotToB) * 0.35));
    const contactA = movePointToward(throwA, pivot, contactInset);
    const contactB = movePointToward(throwB, pivot, contactInset);
    const activeContact = activeThrow === "A" ? contactA : contactB;
    const inactiveContact = activeThrow === "A" ? contactB : contactA;
    const labelAngle = Math.atan2(towardThrowsDy, towardThrowsDx) * (180 / Math.PI);
    const labelCenter = {
      x: (center.x + throwMid.x) / 2,
      y: (center.y + throwMid.y) / 2
    };
    return {
      pins: {
        C: { ...center },
        A: { ...throwA },
        B: { ...throwB }
      },
      activeThrow,
      inactiveThrow,
      pivot,
      contacts: {
        A: contactA,
        B: contactB
      },
      activeContact,
      inactiveContact,
      leads: [
        { from: center, to: pivot, pinId: "C" },
        { from: throwA, to: contactA, pinId: "A" },
        { from: throwB, to: contactB, pinId: "B" }
      ],
      blade: {
        from: pivot,
        to: activeContact
      },
      labelCenter,
      labelAngle,
      parsed,
      parseError
    };
  };

  const getSpdtSwitchExtents = (pins, value) => {
    const plan = getSpdtSwitchRenderPlan(pins, value);
    if (!plan) {
      return null;
    }
    const points = [
      plan.pins.C,
      plan.pins.A,
      plan.pins.B,
      plan.pivot,
      plan.contacts.A,
      plan.contacts.B
    ];
    const xs = points.map((point) => Number(point?.x));
    const ys = points.map((point) => Number(point?.y));
    if (!xs.every(Number.isFinite) || !ys.every(Number.isFinite)) {
      return null;
    }
    const radiusPad = 3;
    return {
      minX: Math.min(...xs) - radiusPad,
      maxX: Math.max(...xs) + radiusPad,
      minY: Math.min(...ys) - radiusPad,
      maxY: Math.max(...ys) + radiusPad
    };
  };

  const getNamedNodeTextExtents = (rotation, geometry, style, options) => {
    const resolvedStyle = resolveNamedNodeLabelStyle(style ?? geometry?.style);
    const slopeX = Number(geometry?.slopeX);
    const endX = Number(geometry?.endX);
    const derivedWidth = Number.isFinite(endX) && Number.isFinite(slopeX)
      ? (endX - slopeX - resolvedStyle.marginLeft - resolvedStyle.marginRight)
      : resolvedStyle.minTextWidth;
    const textWidth = Math.max(
      1,
      resolvedStyle.minTextWidth,
      Number.isFinite(derivedWidth) ? derivedWidth : resolvedStyle.minTextWidth
    );
    const halfWidth = textWidth / 2;
    const halfHeight = Math.max(1, resolvedStyle.fontSize / 2);
    const transform = getNamedNodeTextTransform(rotation, resolvedStyle, options);
    const centerX = getNamedNodeTextAnchorX(rotation, geometry, options);
    const centerY = Number.isFinite(transform?.y) ? transform.y : 0;
    const corners = [
      rotateQuarterPoint(centerX - halfWidth, centerY - halfHeight, rotation),
      rotateQuarterPoint(centerX - halfWidth, centerY + halfHeight, rotation),
      rotateQuarterPoint(centerX + halfWidth, centerY - halfHeight, rotation),
      rotateQuarterPoint(centerX + halfWidth, centerY + halfHeight, rotation)
    ];
    const xs = corners.map((point) => point.x);
    const ys = corners.map((point) => point.y);
    return {
      minX: Math.min(...xs),
      maxX: Math.max(...xs),
      minY: Math.min(...ys),
      maxY: Math.max(...ys)
    };
  };

  const getNamedNodeExtents = (rotation, geometry, options) => {
    if (options?.textOnly) {
      return getNamedNodeTextExtents(rotation, geometry, options?.style, options);
    }
    if (!geometry) {
      return { minX: -2, maxX: 2, minY: -2, maxY: 2 };
    }
    const corners = [
      rotateQuarterPoint(-2, -geometry.halfHeight, rotation),
      rotateQuarterPoint(-2, geometry.halfHeight, rotation),
      rotateQuarterPoint(geometry.endX, -geometry.halfHeight, rotation),
      rotateQuarterPoint(geometry.endX, geometry.halfHeight, rotation)
    ];
    const xs = corners.map((point) => point.x);
    const ys = corners.map((point) => point.y);
    return {
      minX: Math.min(...xs),
      maxX: Math.max(...xs),
      minY: Math.min(...ys),
      maxY: Math.max(...ys)
    };
  };

  const resolveStroke = (style, ctx) => ({
    stroke: style?.stroke ?? ctx?.stroke ?? DEFAULT_STROKE,
    width: style?.width ?? ctx?.width ?? DEFAULT_WIDTH,
    cap: style?.cap,
    join: style?.join
  });

  const resolveFill = (style, ctx) =>
    style?.fill ?? ctx?.background ?? "none";

  const resolveTextFill = (style, ctx) =>
    style?.stroke ?? ctx?.stroke ?? DEFAULT_STROKE;

  const drawGroundShape = (ctx, group, style) => {
    if (!ctx || !group || typeof ctx.line !== "function") {
      return false;
    }
    const stroke = resolveStroke(style, ctx);
    ctx.line(group, 0, 0, 0, 8, stroke);
    ctx.line(group, -8, 8, 8, 8, stroke);
    ctx.line(group, -6, 12, 6, 12, stroke);
    ctx.line(group, -4, 16, 4, 16, stroke);
    return true;
  };

  const drawNamedNodeShape = (ctx, group, geometry, style) => {
    if (!ctx || !group || typeof ctx.line !== "function") {
      return false;
    }
    const slopeX = Number(geometry?.slopeX);
    const halfHeight = Number(geometry?.halfHeight);
    const endX = Number(geometry?.endX);
    if (!Number.isFinite(slopeX) || !Number.isFinite(halfHeight) || !Number.isFinite(endX)) {
      return false;
    }
    const stroke = resolveStroke(style, ctx);
    const frameSegments = [
      [0, 0, slopeX, -halfHeight],
      [0, 0, slopeX, halfHeight],
      [slopeX, -halfHeight, endX, -halfHeight],
      [slopeX, halfHeight, endX, halfHeight],
      [endX, -halfHeight, endX, halfHeight]
    ];
    frameSegments.forEach(([x1, y1, x2, y2]) => {
      ctx.line(group, x1, y1, x2, y2, stroke);
    });
    return true;
  };

  const drawSpdtSwitchShape = (ctx, group, plan, style) => {
    if (!ctx || !group || typeof ctx.line !== "function" || typeof ctx.circle !== "function") {
      return false;
    }
    if (!plan || !plan.pins || !plan.contacts || !plan.blade || !Array.isArray(plan.leads)) {
      return false;
    }
    const stroke = resolveStroke(style, ctx);
    const openFill = resolveFill(style, ctx);
    const closedFill = resolveTextFill(style, ctx);
    plan.leads.forEach((segment) => {
      if (!segment || !segment.from || !segment.to) {
        return;
      }
      ctx.line(
        group,
        segment.from.x,
        segment.from.y,
        segment.to.x,
        segment.to.y,
        stroke
      );
    });
    ctx.line(
      group,
      plan.blade.from.x,
      plan.blade.from.y,
      plan.blade.to.x,
      plan.blade.to.y,
      stroke
    );
    const contactRadius = 2.25;
    ["A", "B"].forEach((token) => {
      const contact = plan.contacts[token];
      if (!contact) {
        return;
      }
      const active = plan.activeThrow === token;
      ctx.circle(group, contact.x, contact.y, contactRadius, {
        ...stroke,
        fill: active ? closedFill : openFill
      });
    });
    ctx.circle(group, plan.pivot.x, plan.pivot.y, 2.1, {
      ...stroke,
      fill: closedFill
    });
    return true;
  };

  const drawResistorSymbol = (ctx, group, length, style) => {
    const stroke = resolveStroke(style, ctx);
    const lead = Math.max(6, Math.min(12, length * 0.2));
    const bodyLength = Math.max(8, length - lead * 2);
    const start = lead;
    const end = start + bodyLength;
    const segments = 7;
    const step = bodyLength / segments;
    const amplitude = Math.min(6, bodyLength * 0.25);
    ctx.line(group, 0, 0, start, 0, stroke);
    ctx.line(group, end, 0, length, 0, stroke);
    const points = [];
    for (let i = 0; i <= segments; i += 1) {
      const x = start + step * i;
      let y = 0;
      if (i !== 0 && i !== segments) {
        y = (i % 2 === 1 ? -1 : 1) * amplitude;
      }
      points.push(`${x},${y}`);
    }
    ctx.polyline(group, points.join(" "), stroke);
  };

  const drawCapacitorSymbol = (ctx, group, length, style) => {
    const stroke = resolveStroke(style, ctx);
    const gap = Math.min(8, length * 0.2);
    const plateHalf = 8;
    const center = length / 2;
    const plate1 = center - gap / 2;
    const plate2 = center + gap / 2;
    ctx.line(group, 0, 0, plate1, 0, stroke);
    ctx.line(group, plate2, 0, length, 0, stroke);
    ctx.line(group, plate1, -plateHalf, plate1, plateHalf, stroke);
    ctx.line(group, plate2, -plateHalf, plate2, plateHalf, stroke);
  };

  const drawInductorSymbol = (ctx, group, length, style) => {
    const stroke = resolveStroke(style, ctx);
    const lead = Math.max(6, Math.min(12, length * 0.2));
    const coilSpan = Math.max(0, length - 2 * lead);
    const coilCount = 4;
    const radius = Math.min(6, coilSpan / (coilCount * 2));
    const start = lead;
    const end = length - lead;
    ctx.line(group, 0, 0, start, 0, stroke);
    ctx.line(group, end, 0, length, 0, stroke);
    if (radius < 1) {
      ctx.line(group, start, 0, end, 0, stroke);
      return;
    }
    let d = `M ${start} 0`;
    for (let i = 0; i < coilCount; i += 1) {
      const arcEnd = start + (i + 1) * radius * 2;
      d += ` A ${radius} ${radius} 0 0 1 ${arcEnd} 0`;
    }
    ctx.path(group, d, stroke);
  };

  const drawVoltageSourceSymbol = (ctx, group, length, style) => {
    const stroke = resolveStroke(style, ctx);
    const radius = Math.min(12, length * 0.25);
    const center = length / 2;
    ctx.line(group, 0, 0, center - radius, 0, stroke);
    ctx.line(group, center + radius, 0, length, 0, stroke);
    ctx.circle(group, center, 0, radius, { ...stroke, fill: resolveFill(style, ctx) });
    const offset = Math.max(2, Math.min(radius - 2, radius * 0.55));
    const symbolFill = resolveTextFill(style, ctx);
    ctx.text(group, center - offset, 3, "+", { size: 10, anchor: "middle", fill: symbolFill });
    ctx.text(group, center + offset, 3, "-", { size: 10, anchor: "middle", fill: symbolFill });
  };

  const drawCurrentSourceSymbol = (ctx, group, length, style) => {
    const stroke = resolveStroke(style, ctx);
    const radius = Math.min(12, length * 0.25);
    const center = length / 2;
    ctx.line(group, 0, 0, center - radius, 0, stroke);
    ctx.line(group, center + radius, 0, length, 0, stroke);
    ctx.circle(group, center, 0, radius, { ...stroke, fill: resolveFill(style, ctx) });
    const arrowStart = center - 6;
    const arrowEnd = center + 6;
    ctx.line(group, arrowStart, 0, arrowEnd, 0, stroke);
    const arrowPath = `M ${arrowEnd - 3} -3 L ${arrowEnd} 0 L ${arrowEnd - 3} 3`;
    ctx.path(group, arrowPath, stroke);
  };

  const drawVoltmeterSymbol = (ctx, group, length, style) => {
    const stroke = resolveStroke(style, ctx);
    const radius = Math.min(12, length * 0.25);
    const center = length / 2;
    ctx.line(group, 0, 0, center - radius, 0, stroke);
    ctx.line(group, center + radius, 0, length, 0, stroke);
    ctx.circle(group, center, 0, radius, { ...stroke, fill: resolveFill(style, ctx) });
    ctx.text(group, center, 2, "V", { size: 10, anchor: "middle", fill: resolveTextFill(style, ctx) });
  };

  const drawAmmeterSymbol = (ctx, group, length, style) => {
    const stroke = resolveStroke(style, ctx);
    const radius = Math.min(12, length * 0.25);
    const center = length / 2;
    ctx.line(group, 0, 0, center - radius, 0, stroke);
    ctx.line(group, center + radius, 0, length, 0, stroke);
    ctx.circle(group, center, 0, radius, { ...stroke, fill: resolveFill(style, ctx) });
    ctx.text(group, center, 2, "A", { size: 10, anchor: "middle", fill: resolveTextFill(style, ctx) });
  };

  const drawProbeSymbol = (ctx, group, style) => {
    if (!ctx || !group || typeof ctx.line !== "function" || typeof ctx.circle !== "function") {
      return false;
    }
    const stroke = resolveStroke(style, ctx);
    const probeStyle = resolveProbeStyle(style?.probeStyle);
    ctx.line(group, 0, 0, probeStyle.leadDx, probeStyle.leadDy, stroke);
    ctx.circle(group, probeStyle.leadDx, probeStyle.leadDy, probeStyle.tipRadius, {
      ...stroke,
      fill: resolveTextFill(style, ctx)
    });
    return true;
  };

  const drawSymbol = (ctx, type, group, length, style) => {
    if (!ctx || !group || !Number.isFinite(length)) {
      return false;
    }
    const normalized = String(type ?? "").toUpperCase();
    switch (normalized) {
      case "R":
        drawResistorSymbol(ctx, group, length, style);
        return true;
      case "C":
        drawCapacitorSymbol(ctx, group, length, style);
        return true;
      case "L":
        drawInductorSymbol(ctx, group, length, style);
        return true;
      case "V":
        drawVoltageSourceSymbol(ctx, group, length, style);
        return true;
      case "I":
        drawCurrentSourceSymbol(ctx, group, length, style);
        return true;
      case "VM":
        drawVoltmeterSymbol(ctx, group, length, style);
        return true;
      case "AM":
        drawAmmeterSymbol(ctx, group, length, style);
        return true;
      case "PV":
      case "PI":
      case "PD":
      case "PP":
        return drawProbeSymbol(ctx, group, style);
      default:
        return false;
    }
  };

  const drawShape = (ctx, type, group, options) => {
    if (!ctx || !group) {
      return false;
    }
    const normalized = String(type ?? "").toUpperCase();
    if (normalized === "GND") {
      return drawGroundShape(ctx, group, options?.style);
    }
    if (normalized === "NET") {
      return drawNamedNodeShape(ctx, group, options?.geometry, options?.style);
    }
    if (normalized === "PV"
      || normalized === "PI"
      || normalized === "PD"
      || normalized === "PP") {
      return drawSymbol(ctx, normalized, group, 0, options?.style);
    }
    if (normalized === "SW") {
      const plan = options?.plan ?? getSpdtSwitchRenderPlan(options?.pins, options?.value);
      return drawSpdtSwitchShape(ctx, group, plan, options?.style);
    }
    const length = Number(options?.length);
    if (!Number.isFinite(length)) {
      return false;
    }
    return drawSymbol(ctx, normalized, group, length, options?.style);
  };

  const api = typeof self !== "undefined" ? (self.SpjutSimSchematic ?? {}) : {};
  api.drawShape = drawShape;
  api.drawSymbol = drawSymbol;
  api.drawGroundShape = drawGroundShape;
  api.drawNamedNodeShape = drawNamedNodeShape;
  api.getNamedNodeLabelStyle = getNamedNodeLabelStyle;
  api.getNamedNodeGeometry = getNamedNodeGeometry;
  api.getNamedNodeTextTransform = getNamedNodeTextTransform;
  api.getNamedNodeTextAnchorX = getNamedNodeTextAnchorX;
  api.getNamedNodeTextExtents = getNamedNodeTextExtents;
  api.getNamedNodeExtents = getNamedNodeExtents;
  api.getProbeStyle = getProbeStyle;
  api.getProbeTipPoint = getProbeTipPoint;
  api.getProbeLabelAnchor = getProbeLabelAnchor;
  api.getProbeExtents = getProbeExtents;
  api.getProbeFlippedRotation = getProbeFlippedRotation;
  api.resolveDifferentialProbeRotations = resolveDifferentialProbeRotations;
  api.getDifferentialProbeGeometry = getDifferentialProbeGeometry;
  api.getDifferentialProbeRenderPlan = getDifferentialProbeRenderPlan;
  api.getDifferentialProbeLinkDash = () => DIFFERENTIAL_PROBE_LINK_DASH;
  api.getSpdtSwitchRenderPlan = getSpdtSwitchRenderPlan;
  api.getSpdtSwitchExtents = getSpdtSwitchExtents;
  api.getContrastPolarityColor = getContrastPolarityColor;
  if (typeof self !== "undefined") {
    self.SpjutSimSchematic = api;
  }
})();
