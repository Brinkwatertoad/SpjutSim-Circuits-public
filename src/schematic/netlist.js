/**
 * @typedef {{ id: string, name?: string, type: string, value?: string, pins: { id: string, name: string, x: number, y: number }[] }} Component
 * @typedef {{ components: Component[], wires: { id: string, points: { x: number, y: number }[] }[] }} SchematicModel
 */

(function initSchematicNetlist() {
  const getSchematicApi = () => (typeof self !== "undefined" ? (self.SpjutSimSchematic ?? {}) : {});

  const requireSchematicMethod = (name) => {
    const api = getSchematicApi();
    const method = api?.[name];
    if (typeof method !== "function") {
      throw new Error(`Schematic API missing '${name}'. Check src/schematic/model.js load order.`);
    }
    return method.bind(api);
  };

  const toKey = (componentId, pinId) => `${componentId}::${pinId}`;

  const normalizeId = (value) => String(value ?? "").trim();

  const ensurePrefixedId = (prefix, value) => {
    const base = normalizeId(value);
    if (!base) {
      return prefix;
    }
    const upper = base.toUpperCase();
    const upperPrefix = prefix.toUpperCase();
    if (upper.startsWith(upperPrefix)) {
      return base;
    }
    return `${prefix}${base}`;
  };

  const normalizeSpiceValue = (value) => {
    if (typeof value !== "string") {
      return value;
    }
    // SPICE treats "M" as milli. If user specifically typed uppercase "M", they likely meant Mega.
    // We replace a trailing "M" with "Meg" to disambiguate.
    if (value.endsWith("M")) {
      return value.slice(0, -1) + "Meg";
    }
    return value;
  };

  const sortedNets = (nets) => {
    return nets.slice().sort((a, b) => {
      const aNode = a.nodes[0] ?? { x: 0, y: 0 };
      const bNode = b.nodes[0] ?? { x: 0, y: 0 };
      if (aNode.y !== bNode.y) {
        return aNode.y - bNode.y;
      }
      return aNode.x - bNode.x;
    });
  };

  const isGroundPin = (component, pin) => {
    if (!component) {
      return false;
    }
    if (String(component.type).toUpperCase() === "GND") {
      return true;
    }
    const pinName = String(pin?.name ?? pin?.id ?? "").toLowerCase();
    return pinName === "0" || pinName === "gnd";
  };

  const getComponentPins = (component) =>
    Array.isArray(component?.pins) ? component.pins : [];

  const normalizeSpdtPinToken = (pin) => String(pin?.id ?? pin?.name ?? "").trim().toUpperCase();

  const pickSpdtPinByToken = (pins, token, used) => {
    for (const pin of pins) {
      if (used.has(pin)) {
        continue;
      }
      if (normalizeSpdtPinToken(pin) !== token) {
        continue;
      }
      used.add(pin);
      return pin;
    }
    return null;
  };

  const pickNextSpdtPin = (pins, used) => {
    for (const pin of pins) {
      if (used.has(pin)) {
        continue;
      }
      used.add(pin);
      return pin;
    }
    return null;
  };

  const resolveSpdtPins = (component) => {
    const pins = getComponentPins(component);
    if (pins.length < 3) {
      return null;
    }
    const used = new Set();
    const center = pickSpdtPinByToken(pins, "C", used) ?? pickNextSpdtPin(pins, used);
    const throwA = pickSpdtPinByToken(pins, "A", used) ?? pickNextSpdtPin(pins, used);
    const throwB = pickSpdtPinByToken(pins, "B", used) ?? pickNextSpdtPin(pins, used);
    if (!center || !throwA || !throwB) {
      return null;
    }
    return {
      C: center,
      A: throwA,
      B: throwB
    };
  };

  const normalizeSpstPinToken = (pin) => String(pin?.id ?? pin?.name ?? "").trim().toUpperCase();

  const pickSpstPinByToken = (pins, token, used) => {
    for (const pin of pins) {
      if (used.has(pin)) {
        continue;
      }
      if (normalizeSpstPinToken(pin) !== token) {
        continue;
      }
      used.add(pin);
      return pin;
    }
    return null;
  };

  const pickNextSpstPin = (pins, used) => {
    for (const pin of pins) {
      if (used.has(pin)) {
        continue;
      }
      used.add(pin);
      return pin;
    }
    return null;
  };

  const resolveSpstPins = (component) => {
    const pins = getComponentPins(component);
    if (pins.length < 2) {
      return null;
    }
    const used = new Set();
    const pin1 = pickSpstPinByToken(pins, "1", used) ?? pickNextSpstPin(pins, used);
    const pin2 = pickSpstPinByToken(pins, "2", used) ?? pickNextSpstPin(pins, used);
    if (!pin1 || !pin2) {
      return null;
    }
    return {
      "1": pin1,
      "2": pin2
    };
  };

  const RESERVED_NODE_NAMES = new Set(["0", "gnd"]);

  const normalizeNodeLabel = (value) => String(value ?? "").trim();

  const normalizeNodeLabelKey = (value) => normalizeNodeLabel(value).toLowerCase();

  const resolveNetNames = (model, nets) => {
    const components = model?.components ?? [];
    const componentMap = new Map(components.map((component) => [component.id, component]));
    const orderedNets = sortedNets(nets);
    const defaultNetNames = new Map();
    const candidateByNet = new Map();
    const namedNodeSignals = [];
    const compileErrors = [];
    let netIndex = 1;

    orderedNets.forEach((net) => {
      const hasGround = net.pins.some((pin) => {
        const component = componentMap.get(pin.componentId);
        return isGroundPin(component, pin);
      });
      if (hasGround) {
        defaultNetNames.set(net.id, "0");
        return;
      }
      defaultNetNames.set(net.id, `N${netIndex}`);
      netIndex += 1;

      const labels = net.pins.reduce((acc, pin) => {
        const component = componentMap.get(pin.componentId);
        if (!component || String(component.type ?? "").toUpperCase() !== "NET") {
          return acc;
        }
        const label = normalizeNodeLabel(
          Object.prototype.hasOwnProperty.call(component, "name")
            ? component.name
            : component.id
        );
        if (!label) {
          return acc;
        }
        acc.push({
          label,
          key: normalizeNodeLabelKey(label),
          componentId: String(component.id ?? pin.componentId ?? "")
        });
        return acc;
      }, []);

      if (!labels.length) {
        return;
      }

      const distinctLabels = new Map();
      labels.forEach((entry) => {
        if (!distinctLabels.has(entry.key)) {
          distinctLabels.set(entry.key, entry);
        }
      });

      const reserved = Array.from(distinctLabels.values()).find((entry) => RESERVED_NODE_NAMES.has(entry.key));
      if (reserved) {
        compileErrors.push(
          `Named node label "${reserved.label}" is reserved; use a different label.`
        );
        return;
      }

      if (distinctLabels.size > 1) {
        const conflictNames = Array.from(distinctLabels.values()).map((entry) => entry.label).join(", ");
        compileErrors.push(
          `Named node conflict: one net has multiple labels (${conflictNames}).`
        );
        return;
      }

      const [chosen] = Array.from(distinctLabels.values());
      if (chosen) {
        candidateByNet.set(net.id, chosen);
      }
    });

    const netNames = new Map(defaultNetNames);
    const canonicalLabelByKey = new Map();
    orderedNets.forEach((net) => {
      const candidate = candidateByNet.get(net.id);
      if (!candidate) {
        return;
      }
      if (!canonicalLabelByKey.has(candidate.key)) {
        canonicalLabelByKey.set(candidate.key, candidate.label);
      }
      const canonicalLabel = canonicalLabelByKey.get(candidate.key) ?? candidate.label;
      netNames.set(net.id, canonicalLabel);
    });

    canonicalLabelByKey.forEach((label) => {
      namedNodeSignals.push(`v(${label})`);
    });

    return { netNames, compileErrors, namedNodeSignals };
  };

  const buildPinNetMap = (nets, netNames) => {
    const pinNetMap = new Map();
    nets.forEach((net) => {
      const netName = netNames.get(net.id);
      if (!netName) {
        return;
      }
      net.pins.forEach((pin) => {
        pinNetMap.set(toKey(pin.componentId, pin.pinId), netName);
      });
    });
    return pinNetMap;
  };

  const getNetForPin = (pinNetMap, componentId, pinId) => {
    return pinNetMap.get(toKey(componentId, pinId)) ?? null;
  };

  const buildLine = (component, pinNetMap, fallbackValue, prefix) => {
    const pins = getComponentPins(component);
    if (pins.length < 2) {
      return null;
    }
    const first = getNetForPin(pinNetMap, component.id, pins[0].id);
    const second = getNetForPin(pinNetMap, component.id, pins[1].id);
    if (!first || !second) {
      return null;
    }
    const value = component.value ? normalizeSpiceValue(String(component.value)) : fallbackValue;
    if (!value) {
      return null;
    }
    const baseId = normalizeId(component.id);
    const label = baseId || `${prefix}${first}`;
    return `${label} ${first} ${second} ${value}`;
  };

  const buildPrefixedLine = (component, pinNetMap, fallbackValue, prefix) => {
    const pins = getComponentPins(component);
    if (pins.length < 2) {
      return null;
    }
    const first = getNetForPin(pinNetMap, component.id, pins[0].id);
    const second = getNetForPin(pinNetMap, component.id, pins[1].id);
    if (!first || !second) {
      return null;
    }
    const value = component.value ? normalizeSpiceValue(String(component.value)) : fallbackValue;
    if (!value) {
      return null;
    }
    const baseId = normalizeId(component.id);
    const label = ensurePrefixedId(prefix, baseId || `${prefix}${first}`);
    return `${label} ${first} ${second} ${value}`;
  };

  const getComponentFallbackValue = (context, type, fallbackValue) => {
    const defaults = context?.componentDefaults;
    if (!defaults || typeof defaults !== "object") {
      return fallbackValue;
    }
    const key = String(type ?? "").trim().toUpperCase();
    const value = String(defaults?.[key]?.value ?? "").trim();
    return value || fallbackValue;
  };

  const buildComponentLineMetadata = (component, type, lineText) => {
    const text = String(lineText ?? "").trim();
    if (!text) {
      return {
        kind: "component",
        componentId: component?.id
      };
    }
    const segments = text.split(/\s+/);
    const netA = String(segments[1] ?? "").trim();
    const netB = String(segments[2] ?? "").trim();
    const nets = [];
    if (netA) {
      nets.push(netA);
    }
    if (netB) {
      nets.push(netB);
    }
    return {
      kind: "component",
      componentId: component?.id,
      type,
      netlistId: String(segments[0] ?? "").trim(),
      netA: netA || null,
      netB: netB || null,
      nets
    };
  };

  const getNetlistIdKey = (value) => normalizeId(value).toUpperCase();

  const allocateUniqueNetlistId = (candidateId, usedKeys, nextSuffixByBaseKey) => {
    const baseId = normalizeId(candidateId) || "X";
    const baseKey = getNetlistIdKey(baseId);
    if (!usedKeys.has(baseKey)) {
      usedKeys.add(baseKey);
      if (!nextSuffixByBaseKey.has(baseKey)) {
        nextSuffixByBaseKey.set(baseKey, 2);
      }
      return baseId;
    }
    let suffix = nextSuffixByBaseKey.get(baseKey) ?? 2;
    while (true) {
      const nextId = `${baseId}_${suffix}`;
      const nextKey = getNetlistIdKey(nextId);
      suffix += 1;
      if (usedKeys.has(nextKey)) {
        continue;
      }
      usedKeys.add(nextKey);
      nextSuffixByBaseKey.set(baseKey, suffix);
      return nextId;
    }
  };

  const withUniqueNetlistId = (lineText, usedKeys, nextSuffixByBaseKey) => {
    const text = String(lineText ?? "").trim();
    if (!text) {
      return "";
    }
    const segments = text.split(/\s+/);
    if (!segments.length) {
      return "";
    }
    segments[0] = allocateUniqueNetlistId(segments[0], usedKeys, nextSuffixByBaseKey);
    return segments.join(" ");
  };

  const buildSaveDirective = (saveSignals, fallbackTokens) => {
    const tokens = Array.isArray(saveSignals)
      ? saveSignals.map((entry) => String(entry ?? "").trim()).filter(Boolean)
      : [];
    const isAllSignalToken = (value) => {
      const token = String(value ?? "").trim().toLowerCase();
      return token === "all" || token === "*";
    };
    const wildcardOnly = tokens.length > 0 && tokens.every((token) => isAllSignalToken(token));
    const fallback = Array.isArray(fallbackTokens)
      ? fallbackTokens.map((entry) => String(entry ?? "").trim()).filter(Boolean)
      : [];
    const chosen = (!tokens.length || wildcardOnly) && fallback.length
      ? fallback
      : (tokens.length ? tokens : fallback);
    if (!chosen.length) {
      return "";
    }
    return `.save ${chosen.join(" ")}`;
  };

  const buildAnalysisDirectivesForConfig = (kind, simulationConfig, fallbackSignals) => {
    const config = simulationConfig && typeof simulationConfig === "object"
      ? simulationConfig
      : {};
    const analysisFallback = Array.isArray(fallbackSignals)
      ? fallbackSignals.map((entry) => String(entry ?? "").trim()).filter(Boolean)
      : [];
    const errors = [];
    const lines = [];
    const appendLine = (line) => {
      if (line) {
        lines.push(line);
      }
    };
    const appendSave = (fallbackTokens) => {
      const saveLine = buildSaveDirective(config?.save?.signals, fallbackTokens);
      if (saveLine) {
        appendLine(saveLine);
      }
    };
    switch (kind) {
      case "op":
        appendLine(".op");
        break;
      case "dc": {
        const dcConfig = config?.dc ?? {};
        const trimmedSource = String(dcConfig?.source ?? "").trim();
        const trimmedStart = String(dcConfig?.start ?? "").trim();
        const trimmedStop = String(dcConfig?.stop ?? "").trim();
        const trimmedStep = String(dcConfig?.step ?? "").trim();
        if (!trimmedSource) {
          errors.push("DC sweep requires a source (e.g., V1).");
        }
        if (!trimmedStart || !trimmedStop || !trimmedStep) {
          errors.push("DC sweep needs start, stop, and step values.");
        }
        if (!errors.length) {
          appendSave(analysisFallback);
          appendLine(`.dc ${trimmedSource} ${trimmedStart} ${trimmedStop} ${trimmedStep}`);
        }
        break;
      }
      case "tran": {
        const tranConfig = config?.tran ?? {};
        const trimmedStep = String(tranConfig?.step ?? "").trim();
        const trimmedStop = String(tranConfig?.stop ?? "").trim();
        if (!trimmedStep || !trimmedStop) {
          errors.push("TRAN analysis needs step and stop time.");
        }
        if (!errors.length) {
          const trimmedStart = String(tranConfig?.start ?? "0").trim() || "0";
          const trimmedMax = String(tranConfig?.maxStep ?? "").trim();
          appendSave(analysisFallback.length ? analysisFallback : ["all"]);
          appendLine(`.tran ${trimmedStep} ${trimmedStop} ${trimmedStart}${trimmedMax ? ` ${trimmedMax}` : ""}`);
        }
        break;
      }
      case "ac": {
        const acConfig = config?.ac ?? {};
        const trimmedPoints = String(acConfig?.points ?? "").trim();
        const trimmedStart = String(acConfig?.start ?? "").trim();
        const trimmedStop = String(acConfig?.stop ?? "").trim();
        if (!trimmedPoints || !trimmedStart || !trimmedStop) {
          errors.push("AC analysis needs sweep points, start freq, and stop freq.");
        }
        if (!errors.length) {
          const sweepMode = String(acConfig?.sweep ?? "dec").trim() || "dec";
          appendSave(analysisFallback.length ? analysisFallback : ["all"]);
          appendLine(`.ac ${sweepMode} ${trimmedPoints} ${trimmedStart} ${trimmedStop}`);
        }
        break;
      }
      default:
        appendLine(".op");
    }
    return { lines, errors };
  };

  const buildSwitchNetlistLines = (component, context) => {
    const pinNetMap = context?.pinNetMap;
    const parseSpdtSwitchValue = context?.parseSpdtSwitchValue;
    const compileErrors = Array.isArray(context?.compileErrors) ? context.compileErrors : [];
    const resolvedPins = resolveSpdtPins(component);
    if (!resolvedPins) {
      compileErrors.push(`Switch '${component.id}' is missing C/A/B pins.`);
      return null;
    }
    let parsedSwitch = null;
    try {
      parsedSwitch = parseSpdtSwitchValue(component.value);
    } catch (error) {
      const reason = String(error?.message ?? error ?? "Invalid switch value.");
      compileErrors.push(`Switch '${component.id}' value parse error: ${reason}`);
      return null;
    }
    const activeThrow = String(parsedSwitch?.activeThrow ?? "A").toUpperCase() === "B" ? "B" : "A";
    const inactiveThrow = activeThrow === "A" ? "B" : "A";
    const centerNet = getNetForPin(pinNetMap, component.id, resolvedPins.C.id);
    const activePin = resolvedPins[activeThrow];
    const inactivePin = resolvedPins[inactiveThrow];
    const activeNet = activePin ? getNetForPin(pinNetMap, component.id, activePin.id) : null;
    const inactiveNet = inactivePin ? getNetForPin(pinNetMap, component.id, inactivePin.id) : null;
    const baseId = normalizeId(component.id);
    const activeLineId = ensurePrefixedId("R", `${baseId}${activeThrow}` || activeThrow);
    const activeValue = normalizeSpiceValue(String(parsedSwitch?.ron ?? "0"));
    const line = (centerNet && activeNet && activeValue)
      ? `${activeLineId} ${centerNet} ${activeNet} ${activeValue}`
      : null;
    const additionalLines = [];
    const roffValueRaw = parsedSwitch?.roff;
    if (roffValueRaw !== null && roffValueRaw !== undefined) {
      const inactiveLineId = ensurePrefixedId("R", `${baseId}${inactiveThrow}` || inactiveThrow);
      const inactiveValue = normalizeSpiceValue(String(roffValueRaw));
      if (centerNet && inactiveNet && inactiveValue) {
        additionalLines.push(`${inactiveLineId} ${centerNet} ${inactiveNet} ${inactiveValue}`);
      }
    }
    return { line, additionalLines };
  };

  const buildSpstSwitchNetlistLines = (component, context) => {
    const pinNetMap = context?.pinNetMap;
    const parseSpdtSwitchValue = context?.parseSpdtSwitchValue;
    const compileErrors = Array.isArray(context?.compileErrors) ? context.compileErrors : [];
    const resolvedPins = resolveSpstPins(component);
    if (!resolvedPins) {
      compileErrors.push(`Switch '${component.id}' is missing 1/2 pins.`);
      return null;
    }
    let parsedSwitch = null;
    try {
      parsedSwitch = parseSpdtSwitchValue(component.value);
    } catch (error) {
      const reason = String(error?.message ?? error ?? "Invalid switch value.");
      compileErrors.push(`Switch '${component.id}' value parse error: ${reason}`);
      return null;
    }
    const activeThrow = String(parsedSwitch?.activeThrow ?? "A").toUpperCase() === "B" ? "B" : "A";
    const net1 = getNetForPin(pinNetMap, component.id, resolvedPins["1"].id);
    const net2 = getNetForPin(pinNetMap, component.id, resolvedPins["2"].id);
    const baseId = normalizeId(component.id);
    if (!net1 || !net2) {
      return { line: null, additionalLines: [] };
    }
    if (activeThrow === "A") {
      const lineId = ensurePrefixedId("R", `${baseId}A` || "A");
      const value = normalizeSpiceValue(String(parsedSwitch?.ron ?? "0"));
      const line = value ? `${lineId} ${net1} ${net2} ${value}` : null;
      return { line, additionalLines: [] };
    }
    const roffValueRaw = parsedSwitch?.roff;
    if (roffValueRaw === null || roffValueRaw === undefined) {
      return { line: null, additionalLines: [] };
    }
    const lineId = ensurePrefixedId("R", `${baseId}B` || "B");
    const value = normalizeSpiceValue(String(roffValueRaw));
    const line = value ? `${lineId} ${net1} ${net2} ${value}` : null;
    return { line, additionalLines: [] };
  };

  const normalizeTransformerPinToken = (pin) => String(pin?.id ?? pin?.name ?? "").trim().toUpperCase();

  const pickTransformerPinByToken = (pins, token, used) => {
    for (const pin of pins) {
      if (used.has(pin)) {
        continue;
      }
      if (normalizeTransformerPinToken(pin) !== token) {
        continue;
      }
      used.add(pin);
      return pin;
    }
    return null;
  };

  const pickNextTransformerPin = (pins, used) => {
    for (const pin of pins) {
      if (used.has(pin)) {
        continue;
      }
      used.add(pin);
      return pin;
    }
    return null;
  };

  const resolveTransformerPins = (component) => {
    const pins = getComponentPins(component);
    if (pins.length < 4) {
      return null;
    }
    const used = new Set();
    const p1 = pickTransformerPinByToken(pins, "P1", used) ?? pickNextTransformerPin(pins, used);
    const p2 = pickTransformerPinByToken(pins, "P2", used) ?? pickNextTransformerPin(pins, used);
    const s1 = pickTransformerPinByToken(pins, "S1", used) ?? pickNextTransformerPin(pins, used);
    const s2 = pickTransformerPinByToken(pins, "S2", used) ?? pickNextTransformerPin(pins, used);
    if (!p1 || !p2 || !s1 || !s2) {
      return null;
    }
    return {
      P1: p1,
      P2: p2,
      S1: s1,
      S2: s2
    };
  };

  const buildTransformerNetlistLines = (component, context) => {
    const compileErrors = Array.isArray(context?.compileErrors) ? context.compileErrors : [];
    const pinNetMap = context?.pinNetMap;
    const normalizeTransformerComponentState = context?.normalizeTransformerComponentState;
    if (typeof normalizeTransformerComponentState !== "function") {
      throw new Error("Transformer netlist builder requires normalizeTransformerComponentState helper.");
    }
    const resolvedPins = resolveTransformerPins(component);
    if (!resolvedPins) {
      compileErrors.push(`Transformer '${component?.id ?? "?"}' is missing P1/P2/S1/S2 pins.`);
      return null;
    }
    const normalized = normalizeTransformerComponentState(component);
    const polarity = String(normalized?.polarity ?? "subtractive").trim().toLowerCase();
    const secondaryFromPin = polarity === "additive" ? resolvedPins.S2 : resolvedPins.S1;
    const secondaryToPin = polarity === "additive" ? resolvedPins.S1 : resolvedPins.S2;
    const primaryA = getNetForPin(pinNetMap, component.id, resolvedPins.P1.id);
    const primaryB = getNetForPin(pinNetMap, component.id, resolvedPins.P2.id);
    const secondaryA = getNetForPin(pinNetMap, component.id, secondaryFromPin.id);
    const secondaryB = getNetForPin(pinNetMap, component.id, secondaryToPin.id);
    if (!primaryA || !primaryB || !secondaryA || !secondaryB) {
      return null;
    }
    const primaryInductance = normalizeSpiceValue(String(normalized?.primaryInductance ?? "1"));
    const secondaryInductance = normalizeSpiceValue(String(normalized?.secondaryInductance ?? "1"));
    const coupling = normalizeSpiceValue(String(normalized?.coupling ?? "1"));
    const primaryResistance = normalizeSpiceValue(String(normalized?.primaryResistance ?? "0"));
    const secondaryResistance = normalizeSpiceValue(String(normalized?.secondaryResistance ?? "0"));
    const primaryResistanceNum = Number(primaryResistance);
    const secondaryResistanceNum = Number(secondaryResistance);
    const hasPrimaryResistance = Number.isFinite(primaryResistanceNum) && primaryResistanceNum > 0;
    const hasSecondaryResistance = Number.isFinite(secondaryResistanceNum) && secondaryResistanceNum > 0;
    const baseId = normalizeId(component.id);
    const primaryInductorId = ensurePrefixedId("L", `${baseId}P` || "LP");
    const secondaryInductorId = ensurePrefixedId("L", `${baseId}S` || "LS");
    const couplingId = ensurePrefixedId("K", baseId || "K");
    const primaryResistorId = ensurePrefixedId("R", `${baseId}P` || "RP");
    const secondaryResistorId = ensurePrefixedId("R", `${baseId}S` || "RS");
    const primaryInternalNode = hasPrimaryResistance ? `${primaryInductorId}_IN` : primaryA;
    const secondaryInternalNode = hasSecondaryResistance ? `${secondaryInductorId}_IN` : secondaryA;
    const line = `${primaryInductorId} ${primaryInternalNode} ${primaryB} ${primaryInductance}`;
    const additionalLines = [];
    if (hasPrimaryResistance) {
      additionalLines.push(`${primaryResistorId} ${primaryA} ${primaryInternalNode} ${primaryResistance}`);
    }
    if (hasSecondaryResistance) {
      additionalLines.push(`${secondaryResistorId} ${secondaryA} ${secondaryInternalNode} ${secondaryResistance}`);
    }
    additionalLines.push(`${secondaryInductorId} ${secondaryInternalNode} ${secondaryB} ${secondaryInductance}`);
    additionalLines.push(`${couplingId} ${primaryInductorId} ${secondaryInductorId} ${coupling}`);
    return { line, additionalLines };
  };

  // Maps diode element property keys to SPICE .model parameter names.
  const DIODE_MODEL_PARAM_MAP = Object.freeze([
    ["diodeIS",   "IS"],
    ["diodeN",    "N"],
    ["diodeRS",   "RS"],
    ["diodeTT",   "TT"],
    ["diodeCJO",  "CJO"],
    ["diodeVJ",   "VJ"],
    ["diodeM",    "M"],
    ["diodeEG",   "EG"],
    ["diodeXTI",  "XTI"],
    ["diodeTNOM", "TNOM"],
    ["diodeBV",   "BV"],
    ["diodeIBV",  "IBV"],
    ["diodeFC",   "FC"]
  ]);

  const buildDiodeModelLine = (component, modelName) => {
    const params = [];
    DIODE_MODEL_PARAM_MAP.forEach(([propKey, spiceName]) => {
      const val = String(component?.[propKey] ?? "").trim();
      if (val) {
        params.push(`${spiceName}=${val}`);
      }
    });
    const extra = String(component?.diodeExtra ?? "").trim();
    if (extra) {
      params.push(extra);
    }
    const paramStr = params.length ? `(${params.join(" ")})` : "";
    return `.model ${modelName} D${paramStr}`;
  };

  const buildDiodeInstanceSuffix = (component) => {
    const parts = [];
    const area = String(component?.diodeArea ?? "").trim();
    if (area) {
      parts.push(`AREA=${area}`);
    }
    const temp = String(component?.diodeTEMP ?? "").trim();
    if (temp) {
      parts.push(`TEMP=${temp}`);
    }
    const dtemp = String(component?.diodeDTEMP ?? "").trim();
    if (dtemp) {
      parts.push(`DTEMP=${dtemp}`);
    }
    const ic = String(component?.diodeIC ?? "").trim();
    if (ic) {
      parts.push(`IC=${ic}`);
    }
    if (component?.diodeOFF === true || String(component?.diodeOFF ?? "").toLowerCase() === "true") {
      parts.push("OFF");
    }
    return parts.length ? ` ${parts.join(" ")}` : "";
  };

  const buildAcVoltageSourceNetlistLine = (component, context) => {
    const buildAcVoltageSourceSpiceValue = context?.buildAcVoltageSourceSpiceValue;
    if (typeof buildAcVoltageSourceSpiceValue !== "function") {
      throw new Error("AC voltage source netlist builder requires buildAcVoltageSourceSpiceValue helper.");
    }
    const fallbackValue = buildAcVoltageSourceSpiceValue(component);
    if (!String(fallbackValue ?? "").trim()) {
      return null;
    }
    return buildLine({ ...component, value: "" }, context?.pinNetMap, fallbackValue, "V");
  };

  const COMPONENT_NETLIST_LINE_BUILDERS = Object.freeze({
    R: (component, context) => ({
      line: buildLine(component, context?.pinNetMap, getComponentFallbackValue(context, "R", "1k"), "R"),
      additionalLines: []
    }),
    C: (component, context) => ({
      line: buildLine(component, context?.pinNetMap, getComponentFallbackValue(context, "C", "1u"), "C"),
      additionalLines: []
    }),
    L: (component, context) => ({
      line: buildLine(component, context?.pinNetMap, getComponentFallbackValue(context, "L", "1m"), "L"),
      additionalLines: []
    }),
    V: (component, context) => ({
      line: buildLine(component, context?.pinNetMap, getComponentFallbackValue(context, "V", "1"), "V"),
      additionalLines: []
    }),
    VAC: (component, context) => ({
      line: buildAcVoltageSourceNetlistLine(component, context),
      additionalLines: []
    }),
    I: (component, context) => ({
      line: buildLine(component, context?.pinNetMap, getComponentFallbackValue(context, "I", "1"), "I"),
      additionalLines: []
    }),
    VM: (component, context) => ({
      line: component?.value
        ? buildPrefixedLine(component, context?.pinNetMap, "1M", "R")
        : null,
      additionalLines: []
    }),
    AM: (component, context) => ({
      line: component?.value
        ? buildPrefixedLine(component, context?.pinNetMap, "0", "R")
        : buildPrefixedLine(component, context?.pinNetMap, "0", "V"),
      additionalLines: []
    }),
    SW: (component, context) => buildSwitchNetlistLines(component, context),
    SPST: (component, context) => buildSpstSwitchNetlistLines(component, context),
    XFMR: (component, context) => buildTransformerNetlistLines(component, context),
    D: (component, context) => {
      const modelName = component.value
        ? normalizeSpiceValue(String(component.value))
        : getComponentFallbackValue(context, "D", "1N4148");
      const baseLine = buildPrefixedLine(component, context?.pinNetMap, modelName, "D");
      if (!baseLine) {
        return { line: null, additionalLines: [], modelDefinitions: {} };
      }
      const suffix = buildDiodeInstanceSuffix(component);
      const line = suffix ? `${baseLine}${suffix}` : baseLine;
      const modelLine = buildDiodeModelLine(component, modelName);
      return {
        line,
        additionalLines: [],
        modelDefinitions: { [modelName]: modelLine }
      };
    }
  });

  /**
   * @param {SchematicModel} model
   * @param {{ title?: string }} [options]
   * @returns {string}
   */
  const compileNetlist = (model, options) => {
    const buildNets = requireSchematicMethod("buildNets");
    const isElectricalComponentType = requireSchematicMethod("isElectricalComponentType");
    const parseSpdtSwitchValue = requireSchematicMethod("parseSpdtSwitchValue");
    const normalizeTransformerComponentState = requireSchematicMethod("normalizeTransformerComponentState");
    const buildAcVoltageSourceSpiceValue = requireSchematicMethod("buildAcVoltageSourceSpiceValue");
    const getBuiltInComponentDefaults = requireSchematicMethod("getBuiltInComponentDefaults");
    const componentDefaults = getBuiltInComponentDefaults();
    const nets = buildNets(model);
    const netResolution = resolveNetNames(model, nets);
    const netNames = netResolution.netNames;
    const compileErrors = Array.isArray(netResolution.compileErrors) ? netResolution.compileErrors.slice() : [];
    const namedNodeSignals = Array.isArray(netResolution.namedNodeSignals)
      ? netResolution.namedNodeSignals.slice()
      : [];
    const pinNetMap = buildPinNetMap(nets, netNames);
    const netNamesRecord = Object.fromEntries(Array.from(netNames.entries()));
    const pinNetRecord = Object.fromEntries(Array.from(pinNetMap.entries()));
    const lines = [];
    const lineMap = [];
    const warnings = [];
    const componentLines = {};
    const modelDefinitions = new Map(); // key → ".model ..." line, deduped
    const usedNetlistIdKeys = new Set();
    const nextNetlistIdSuffixByBaseKey = new Map();
    const pushLine = (text, metadata) => {
      lines.push(text);
      if (metadata) {
        lineMap.push({
          line: lines.length,
          ...metadata
        });
      }
    };

    pushLine(`* ${options?.title ?? "schematic"}`, { kind: "directive" });

    const components = model?.components ?? [];
    components.forEach((component) => {
      const type = String(component?.type ?? "").toUpperCase();
      const isElectrical = isElectricalComponentType(type);
      if (!isElectrical || type === "GND" || type === "NET") {
        return;
      }
      const builder = COMPONENT_NETLIST_LINE_BUILDERS[type];
      if (typeof builder !== "function") {
        return;
      }
      const built = builder(component, {
        pinNetMap,
        parseSpdtSwitchValue,
        normalizeTransformerComponentState,
        buildAcVoltageSourceSpiceValue,
        compileErrors,
        componentDefaults
      });
      if (!built) {
        return;
      }
      const line = String(built?.line ?? "");
      const additionalLines = Array.isArray(built?.additionalLines) ? built.additionalLines : [];
      if (line && line.trim()) {
        const trimmedLine = withUniqueNetlistId(line, usedNetlistIdKeys, nextNetlistIdSuffixByBaseKey);
        pushLine(trimmedLine, buildComponentLineMetadata(component, type, trimmedLine));
        const segments = trimmedLine.split(/\s+/);
        componentLines[component.id] = {
          type,
          netlistId: segments[0] ?? null,
          netA: segments[1] ?? null,
          netB: segments[2] ?? null,
          value: segments[segments.length - 1] ?? null
        };
      }
      additionalLines.forEach((extraLine) => {
        if (!extraLine || !extraLine.trim()) {
          return;
        }
        const trimmedExtraLine = withUniqueNetlistId(extraLine, usedNetlistIdKeys, nextNetlistIdSuffixByBaseKey);
        pushLine(trimmedExtraLine, buildComponentLineMetadata(component, type, trimmedExtraLine));
      });
      const builtModelDefs = built?.modelDefinitions;
      if (builtModelDefs && typeof builtModelDefs === "object") {
        Object.entries(builtModelDefs).forEach(([name, modelLine]) => {
          const key = String(name ?? "").toLowerCase();
          if (key && !modelDefinitions.has(key)) {
            modelDefinitions.set(key, String(modelLine));
          }
        });
      }
    });

    modelDefinitions.forEach((modelLine) => {
      if (modelLine && modelLine.trim()) {
        pushLine(modelLine, { kind: "directive" });
      }
    });

    pushLine(".end", { kind: "directive" });

    const hasGround = Object.values(netNamesRecord).some((value) => value === "0");
    if (!hasGround) {
      warnings.push("No ground reference found; add a GND symbol.");
    }

    return {
      netlist: lines.join("\n"),
      lineMap,
      netNames: netNamesRecord,
      pinNetMap: pinNetRecord,
      componentLines,
      warnings,
      compileErrors,
      namedNodeSignals
    };
  };

  const api = typeof self !== "undefined" ? (self.SpjutSimSchematic ?? {}) : {};
  api.compileNetlist = compileNetlist;
  api.normalizeSpiceValue = normalizeSpiceValue;
  api.buildSaveDirective = buildSaveDirective;
  api.buildAnalysisDirectivesForConfig = buildAnalysisDirectivesForConfig;
  if (typeof self !== "undefined") {
    self.SpjutSimSchematic = api;
  }
})();
