/**
 * UI inline-editor domain helpers.
 */
(function initUIInlineEditorDomain() {
  const PROBE_TYPE_UPDATES = new Set(["PV", "PI", "PP"]);

  const normalizeType = (type) => String(type ?? "").trim().toUpperCase();
  const normalizeSpdtThrow = (value) => (String(value ?? "").trim().toUpperCase() === "B" ? "B" : "A");

  const toOptionalToken = (value) => {
    const text = String(value ?? "").trim();
    return text || null;
  };

  const getDefaultSwitchState = () => ({
    activeThrow: "A",
    ron: "0",
    roff: null,
    showRon: false,
    showRoff: false
  });

  const normalizeValueFieldMeta = (meta) => {
    if (!meta || typeof meta !== "object") {
      throw new Error("Schematic API getValueFieldMeta() returned invalid payload.");
    }
    return {
      label: String(meta.label ?? "").trim() || "Value",
      unit: String(meta.unit ?? ""),
      visible: meta.visible === true
    };
  };

  const getInlineModeFlags = (input) => {
    const args = input && typeof input === "object" ? input : {};
    const type = normalizeType(args.type);
    const isSwitchComponent = type === "SW";
    const isProbeComponent = args.isProbe === true;
    const supportsValueField = args.supportsValueField === true;
    const isNamedNode = type === "NET";
    const isTextAnnotation = type === "TEXT";
    const isArrowAnnotation = type === "ARR";
    const isBoxAnnotation = type === "BOX";
    const showValueRow = supportsValueField && !isSwitchComponent && !isArrowAnnotation;
    return {
      type,
      isSwitchComponent,
      isProbeComponent,
      supportsValueField,
      showValueRow,
      isNamedNode,
      isTextAnnotation,
      isArrowAnnotation,
      isBoxAnnotation
    };
  };

  const getInlineFocusTarget = (input) => {
    const flags = getInlineModeFlags(input);
    if (flags.isBoxAnnotation || flags.isArrowAnnotation) {
      return "style";
    }
    if (flags.isProbeComponent) {
      return "probe-type";
    }
    if (flags.isNamedNode || flags.isTextAnnotation) {
      return "name";
    }
    if (flags.isSwitchComponent) {
      return "switch";
    }
    return "value";
  };

  const isCloseCommitKey = (key) => {
    const raw = String(key ?? "").trim().toLowerCase();
    return raw === "enter" || raw === "escape" || raw === "esc";
  };

  const parseSpdtSwitchValueSafe = (parseSwitchValue, value) => {
    if (typeof parseSwitchValue !== "function") {
      throw new Error("Inline editor parseSpdtSwitchValueSafe() requires a parser function.");
    }
    try {
      const parsed = parseSwitchValue(value);
      return {
        activeThrow: normalizeSpdtThrow(parsed?.activeThrow),
        ron: String(parsed?.ron ?? "0").trim() || "0",
        roff: toOptionalToken(parsed?.roff),
        showRon: parsed?.showRon === true,
        showRoff: parsed?.showRoff === true
      };
    } catch {
      return getDefaultSwitchState();
    }
  };

  const formatSpdtSwitchValue = (stateValue) => {
    const next = stateValue && typeof stateValue === "object" ? stateValue : {};
    const activeThrow = normalizeSpdtThrow(next.activeThrow);
    const ron = String(next.ron ?? "").trim() || "0";
    const roff = String(next.roff ?? "").trim();
    const showRon = next.showRon === true;
    const showRoff = next.showRoff === true;
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

  const buildInlineSwitchState = (input) => {
    const args = input && typeof input === "object" ? input : {};
    const baseState = args.baseState && typeof args.baseState === "object" ? args.baseState : getDefaultSwitchState();
    const overrides = args.overrides && typeof args.overrides === "object" ? args.overrides : {};
    const hasRoffOverride = Object.prototype.hasOwnProperty.call(overrides, "roff");
    const hasShowRonOverride = Object.prototype.hasOwnProperty.call(overrides, "showRon");
    const hasShowRoffOverride = Object.prototype.hasOwnProperty.call(overrides, "showRoff");
    const hasActiveThrowOverride = Object.prototype.hasOwnProperty.call(overrides, "activeThrow");
    const hasRonOverride = Object.prototype.hasOwnProperty.call(overrides, "ron");
    const hasShowRonChecked = Object.prototype.hasOwnProperty.call(args, "showRonChecked");
    const hasShowRoffChecked = Object.prototype.hasOwnProperty.call(args, "showRoffChecked");
    return {
      activeThrow: normalizeSpdtThrow(hasActiveThrowOverride ? overrides.activeThrow : baseState.activeThrow),
      ron: String(hasRonOverride ? overrides.ron : (args.ronInput ?? baseState.ron)).trim() || "0",
      roff: hasRoffOverride
        ? toOptionalToken(overrides.roff)
        : toOptionalToken(args.roffInput ?? baseState.roff),
      showRon: hasShowRonOverride
        ? overrides.showRon === true
        : ((hasShowRonChecked ? args.showRonChecked : baseState.showRon) === true),
      showRoff: hasShowRoffOverride
        ? overrides.showRoff === true
        : ((hasShowRoffChecked ? args.showRoffChecked : baseState.showRoff) === true)
    };
  };

  const extractProbeLabelToken = (name) => {
    const text = String(name ?? "").trim();
    const match = text.match(/\((.*)\)/);
    return match ? String(match[1] ?? "").trim() : "";
  };

  const getProbePrimaryPin = (component) => {
    const pins = Array.isArray(component?.pins) ? component.pins : [];
    const pin = pins[0];
    if (!pin || !Number.isFinite(pin.x) || !Number.isFinite(pin.y)) {
      return null;
    }
    return { x: pin.x, y: pin.y };
  };

  const findNearestProbeTargetComponentId = (input) => {
    const args = input && typeof input === "object" ? input : {};
    const probePin = args.probePin;
    if (!probePin || !Number.isFinite(probePin.x) || !Number.isFinite(probePin.y)) {
      return "";
    }
    const probeComponent = args.probeComponent;
    const probeId = String(probeComponent?.id ?? "").trim();
    const components = Array.isArray(args.components) ? args.components : [];
    const isProbeComponentType = typeof args.isProbeComponentType === "function"
      ? args.isProbeComponentType
      : (() => false);
    let bestId = "";
    let bestDist = Infinity;
    components.forEach((candidate) => {
      if (!candidate || candidate === probeComponent) {
        return;
      }
      const candidateId = String(candidate?.id ?? "").trim();
      if (!candidateId || (probeId && candidateId === probeId)) {
        return;
      }
      const candidateType = normalizeType(candidate?.type);
      if (!candidateType || candidateType === "NET" || candidateType === "GND" || candidateType === "TEXT" || isProbeComponentType(candidateType)) {
        return;
      }
      const candidatePins = Array.isArray(candidate?.pins) ? candidate.pins : [];
      if (candidatePins.length < 2) {
        return;
      }
      const pinA = candidatePins[0];
      const pinB = candidatePins[1];
      if (!pinA || !pinB || !Number.isFinite(pinA.x) || !Number.isFinite(pinA.y) || !Number.isFinite(pinB.x) || !Number.isFinite(pinB.y)) {
        return;
      }
      const centerX = (pinA.x + pinB.x) / 2;
      const centerY = (pinA.y + pinB.y) / 2;
      const dx = centerX - probePin.x;
      const dy = centerY - probePin.y;
      const dist = dx * dx + dy * dy;
      if (dist < bestDist) {
        bestDist = dist;
        bestId = candidateId;
      }
    });
    if (bestId && bestDist <= 1) {
      return bestId;
    }
    return "";
  };

  const buildProbeTypeUpdate = (input) => {
    const args = input && typeof input === "object" ? input : {};
    const component = args.component && typeof args.component === "object" ? args.component : {};
    const nextType = normalizeType(args.nextType);
    if (!PROBE_TYPE_UPDATES.has(nextType)) {
      return null;
    }
    const probePin = getProbePrimaryPin(component);
    const existingTarget = String(component?.value ?? "").trim();
    const fallbackToken = extractProbeLabelToken(component?.name) || "?";
    if (nextType === "PI" || nextType === "PP") {
      const resolvedTarget = typeof args.resolveTargetComponentId === "function"
        ? String(args.resolveTargetComponentId(component, probePin) ?? "").trim()
        : "";
      const targetId = existingTarget || resolvedTarget || "";
      const token = targetId || fallbackToken;
      return {
        type: nextType,
        name: `${nextType === "PP" ? "P" : "I"}(${token})`,
        value: targetId
      };
    }
    return {
      type: "PV",
      name: `V(${fallbackToken})`,
      value: ""
    };
  };

  const domains = typeof self !== "undefined" ? (self.SpjutSimUIDomains ?? {}) : {};
  domains.inlineEditor = {
    normalizeValueFieldMeta,
    getInlineModeFlags,
    getInlineFocusTarget,
    isCloseCommitKey,
    normalizeSpdtThrow,
    parseSpdtSwitchValueSafe,
    formatSpdtSwitchValue,
    buildInlineSwitchState,
    extractProbeLabelToken,
    getProbePrimaryPin,
    buildProbeTypeUpdate,
    findNearestProbeTargetComponentId
  };
  if (typeof self !== "undefined") {
    self.SpjutSimUIDomains = domains;
  }
})();
