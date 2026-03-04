/**
 * UI measurements domain helpers.
 */
(function initUIMeasurementsDomain() {
  const MEASUREMENT_PREFIXES = [
    { symbol: "T", exponent: 12 },
    { symbol: "G", exponent: 9 },
    { symbol: "M", exponent: 6 },
    { symbol: "k", exponent: 3 },
    { symbol: "", exponent: 0 },
    { symbol: "m", exponent: -3 },
    { symbol: "u", exponent: -6 },
    { symbol: "n", exponent: -9 },
    { symbol: "p", exponent: -12 }
  ];

  const MEASUREMENT_MULTIPLIERS = {
    T: 1e12,
    G: 1e9,
    M: 1e6,
    k: 1e3,
    K: 1e3,
    m: 1e-3,
    u: 1e-6,
    n: 1e-9,
    p: 1e-12
  };

  const MEASUREMENT_TYPE_ORDER = Object.freeze({
    voltage: 0,
    current: 1,
    power: 2,
    other: 3
  });

  const formatMeasurementRowLabel = (entry) => {
    const label = String(entry?.label ?? "");
    if (entry?.isProbe) {
      return `${label}: `;
    }
    const id = String(entry?.id ?? "");
    return `${id} (${label}): `;
  };

  const measurementTypeRank = (value) => {
    const key = String(value ?? "").trim().toLowerCase();
    if (Object.prototype.hasOwnProperty.call(MEASUREMENT_TYPE_ORDER, key)) {
      return MEASUREMENT_TYPE_ORDER[key];
    }
    return MEASUREMENT_TYPE_ORDER.other;
  };

  const sortMeasurementsForDisplay = (measurements) => {
    measurements.sort((left, right) => {
      const rankDelta = measurementTypeRank(left?.measurementType) - measurementTypeRank(right?.measurementType);
      if (rankDelta !== 0) {
        return rankDelta;
      }
      const labelDelta = String(left?.label ?? "").localeCompare(String(right?.label ?? ""));
      if (labelDelta !== 0) {
        return labelDelta;
      }
      return String(left?.id ?? "").localeCompare(String(right?.id ?? ""));
    });
  };

  const parseMetricInput = (raw) => {
    if (!raw) {
      return null;
    }
    const trimmed = String(raw).trim();
    if (!trimmed) {
      return null;
    }
    const match = trimmed.match(/^([-+]?\d*\.?\d+(?:[eE][-+]?\d+)?)(?:\s*([TGMkKmunp]))?$/);
    if (!match) {
      return null;
    }
    const value = Number(match[1]);
    if (!Number.isFinite(value)) {
      return null;
    }
    const prefix = match[2] || "";
    const multiplier = MEASUREMENT_MULTIPLIERS[prefix] ?? 1;
    return value * multiplier;
  };

  const formatMeasurementValue = (value, unit) => {
    if (!Number.isFinite(value)) {
      return "n/a";
    }
    if (value === 0) {
      return `0.000 ${unit}`;
    }
    const absValue = Math.abs(value);
    let selected = MEASUREMENT_PREFIXES[MEASUREMENT_PREFIXES.length - 1];
    for (const entry of MEASUREMENT_PREFIXES) {
      const threshold = Math.pow(10, entry.exponent);
      if (absValue >= threshold) {
        selected = entry;
        break;
      }
    }
    const factor = Math.pow(10, selected.exponent);
    const scaled = value / factor;
    const text = Number(scaled).toPrecision(4);
    return `${text} ${selected.symbol}${unit}`;
  };

  const normalizeNodeName = (name) => {
    if (!name) {
      return "";
    }
    let text = String(name).trim().toLowerCase();
    if (text.startsWith("v(") && text.endsWith(")")) {
      text = text.slice(2, -1);
    }
    return text;
  };

  const normalizeCurrentName = (name) => {
    if (!name) {
      return "";
    }
    let text = String(name).trim().toLowerCase();
    if (text.startsWith("i(") && text.endsWith(")")) {
      text = text.slice(2, -1);
    }
    if (text.endsWith("#branch")) {
      text = text.replace(/#branch$/, "");
    }
    return text;
  };

  const getSelectedSignals = (select) =>
    Array.from(select.selectedOptions).map((option) => option.value);

  const parseVoltageSignalToken = (value, options = {}) => {
    const preserveCase = options?.preserveCase === true;
    const compact = String(value ?? "").trim().replace(/\s+/g, "");
    const token = preserveCase ? compact : compact.toLowerCase();
    if (!token) {
      return null;
    }
    let match = token.match(/^v\(([^(),]+),([^(),]+)\)$/i);
    if (match) {
      return { kind: "diff", pos: match[1], neg: match[2] };
    }
    match = token.match(/^v\(([^()]+)\)-v\(([^()]+)\)$/i);
    if (match) {
      return { kind: "diff", pos: match[1], neg: match[2] };
    }
    match = token.match(/^v\(([^(),]+)\)$/i);
    if (match) {
      return { kind: "single", node: match[1] };
    }
    return null;
  };

  const normalizeSignalToken = (value) => {
    const token = String(value ?? "").trim().toLowerCase().replace(/\s+/g, "");
    if (!token) {
      return "";
    }
    const parsedVoltage = parseVoltageSignalToken(token);
    if (parsedVoltage?.kind === "diff") {
      if (parsedVoltage.neg === "0") {
        return `v:${parsedVoltage.pos}`;
      }
      return `vd:${parsedVoltage.pos},${parsedVoltage.neg}`;
    }
    if (parsedVoltage?.kind === "single") {
      return `v:${parsedVoltage.node}`;
    }
    if (token.startsWith("i(") && token.endsWith(")")) {
      return `i:${token.slice(2, -1).replace(/#branch$/, "")}`;
    }
    if (token.endsWith("#branch")) {
      return `i:${token.replace(/#branch$/, "")}`;
    }
    if (token.startsWith("@") && token.endsWith("[i]")) {
      return `i:${token.slice(1, -3)}`;
    }
    return `v:${token}`;
  };

  const formatCurrentSignalLabel = (value) => {
    const raw = String(value ?? "").trim();
    if (!raw) {
      return "";
    }
    const formatTarget = (target) => {
      const text = String(target ?? "").trim();
      return text ? text.toUpperCase() : "";
    };
    const directToken = raw.toLowerCase();
    if (directToken.startsWith("i:")) {
      const target = formatTarget(raw.slice(2));
      return target ? `I(${target})` : "";
    }
    let match = raw.match(/^i\((.+)\)$/i);
    if (match) {
      const target = formatTarget(match[1]);
      return target ? `I(${target})` : "";
    }
    match = raw.match(/^@(.+)\[i\]$/i);
    if (match) {
      const target = formatTarget(match[1]);
      return target ? `I(${target})` : "";
    }
    match = raw.match(/^(.+)#branch$/i);
    if (match) {
      const target = formatTarget(match[1]);
      return target ? `I(${target})` : "";
    }
    return "";
  };

  const normalizeTraceTokenValue = (value) => {
    const raw = String(value ?? "").trim().toLowerCase().replace(/\s+/g, "");
    if (!raw) {
      return "";
    }
    if (raw.startsWith("v:") || raw.startsWith("vd:") || raw.startsWith("i:")) {
      return raw;
    }
    return normalizeSignalToken(raw);
  };

  const dedupeSignalList = (signals) => {
    const seen = new Set();
    const unique = [];
    (signals ?? []).forEach((entry) => {
      const signal = String(entry ?? "").trim();
      if (!signal) {
        return;
      }
      const key = normalizeSignalToken(signal);
      if (seen.has(key)) {
        return;
      }
      seen.add(key);
      unique.push(signal);
    });
    return unique;
  };

  const signalListsEqual = (a, b) => {
    const left = dedupeSignalList(Array.isArray(a) ? a : []);
    const right = dedupeSignalList(Array.isArray(b) ? b : []);
    return left.length === right.length && left.every((entry, index) => entry === right[index]);
  };

  const buildSignalCaseMap = (signals) => {
    const map = new Map();
    (Array.isArray(signals) ? signals : []).forEach((entry) => {
      const signal = String(entry ?? "").trim();
      if (!signal) {
        return;
      }
      const token = normalizeSignalToken(signal);
      if (!token || map.has(token)) {
        return;
      }
      map.set(token, signal);
    });
    return map;
  };

  const applySignalCaseMap = (signals, caseMap) => dedupeSignalList(
    (Array.isArray(signals) ? signals : []).map((entry) => {
      const signal = String(entry ?? "").trim();
      if (!signal) {
        return signal;
      }
      const token = normalizeSignalToken(signal);
      if (!token) {
        return signal;
      }
      return caseMap?.get(token) ?? signal;
    })
  );

  const applyTraceMapCaseMap = (traceMap, caseMap) => {
    const source = traceMap && typeof traceMap === "object" ? traceMap : {};
    const remapped = {};
    let changed = false;
    Object.entries(source).forEach(([name, values]) => {
      const signal = String(name ?? "").trim();
      const token = normalizeSignalToken(signal);
      const nextName = token ? (caseMap?.get(token) ?? signal) : signal;
      if (nextName !== signal) {
        changed = true;
      }
      if (Object.prototype.hasOwnProperty.call(remapped, nextName)) {
        changed = true;
        return;
      }
      remapped[nextName] = values;
    });
    return { map: remapped, changed };
  };

  const normalizeSignalTokens = (signals) => {
    const tokens = new Set();
    (signals ?? []).forEach((entry) => {
      const token = normalizeSignalToken(entry);
      if (token) {
        tokens.add(token);
      }
    });
    return Array.from(tokens);
  };

  const normalizeSignalTokenSet = (signals) => new Set(
    dedupeSignalList(
      (signals ?? [])
        .map((entry) => String(entry ?? "").trim())
        .filter(Boolean)
    )
      .map((signal) => normalizeTraceTokenValue(signal))
      .filter(Boolean)
  );

  const isVoltageSignalToken = (token) => {
    const normalized = String(token ?? "").trim().toLowerCase();
    return normalized.startsWith("v:") || normalized.startsWith("vd:");
  };

  const isCurrentSignalToken = (token) => {
    const normalized = String(token ?? "").trim().toLowerCase();
    return normalized.startsWith("i:");
  };

  const classifySignalValue = (signal) => {
    const token = normalizeSignalToken(signal);
    if (!token) {
      return { token: "", isVoltage: false, isCurrent: false };
    }
    return {
      token,
      isVoltage: isVoltageSignalToken(token),
      isCurrent: isCurrentSignalToken(token)
    };
  };

  const classifySignalToken = (signal) => {
    const token = normalizeTraceTokenValue(signal);
    if (!token) {
      return { token: "", isVoltage: false, isCurrent: false };
    }
    return {
      token,
      isVoltage: token.startsWith("v:") || token.startsWith("vd:"),
      isCurrent: token.startsWith("i:")
    };
  };

  const classifySeriesSignalType = (signal, options = {}) => {
    const classification = classifySignalToken(signal);
    if (!classification.token) {
      return "voltage";
    }
    if (classification.isVoltage) {
      return "voltage";
    }
    if (classification.isCurrent) {
      const powerSignalTokens = options?.powerSignalTokens instanceof Set ? options.powerSignalTokens : null;
      const isPowerSignalToken = typeof options?.isPowerSignalToken === "function"
        ? options.isPowerSignalToken
        : null;
      const isPower = isPowerSignalToken
        ? Boolean(isPowerSignalToken(signal, classification.token))
        : Boolean(powerSignalTokens?.has(classification.token));
      return isPower ? "power" : "current";
    }
    return "voltage";
  };

  const splitSeriesByType = (series, options = {}) => {
    const voltage = [];
    const current = [];
    const power = [];
    (Array.isArray(series) ? series : []).forEach((entry) => {
      const type = classifySeriesSignalType(entry?.signal ?? "", options);
      if (type === "current") {
        current.push(entry);
      } else if (type === "power") {
        power.push(entry);
      } else {
        voltage.push(entry);
      }
    });
    return { voltage, current, power };
  };

  const prioritizeSignals = (signals, preferredSignals) => {
    const orderedSignals = dedupeSignalList(Array.isArray(signals) ? signals : []);
    const preferred = dedupeSignalList(Array.isArray(preferredSignals) ? preferredSignals : []);
    if (!preferred.length || !orderedSignals.length) {
      return orderedSignals;
    }
    const byKey = new Map();
    orderedSignals.forEach((signal) => {
      byKey.set(normalizeSignalToken(signal), signal);
    });
    const used = new Set();
    const prioritized = [];
    preferred.forEach((signal) => {
      const match = byKey.get(normalizeSignalToken(signal));
      if (!match) {
        return;
      }
      const key = normalizeSignalToken(match);
      if (used.has(key)) {
        return;
      }
      used.add(key);
      prioritized.push(match);
    });
    orderedSignals.forEach((signal) => {
      const key = normalizeSignalToken(signal);
      if (used.has(key)) {
        return;
      }
      used.add(key);
      prioritized.push(signal);
    });
    return prioritized;
  };

  const syncSignalCheckboxList = (input = {}) => {
    const listEl = input.listEl;
    const selectEl = input.selectEl;
    if (!(listEl instanceof HTMLElement) || !(selectEl instanceof HTMLSelectElement)) {
      throw new Error("UI measurements syncSignalCheckboxList requires listEl and selectEl.");
    }
    const optionValues = Array.from(selectEl.options).map((o) => o.value);
    const currentValues = Array.from(listEl.querySelectorAll("input[type='checkbox']")).map((cb) => cb.value);
    if (optionValues.join("|") !== currentValues.join("|")) {
      listEl.innerHTML = "";
      Array.from(selectEl.options).forEach((option) => {
        const label = document.createElement("label");
        label.className = "signal-checkbox-item";
        const cb = document.createElement("input");
        cb.type = "checkbox";
        cb.value = option.value;
        cb.checked = option.selected;
        label.append(cb, " ", option.textContent);
        listEl.append(label);
      });
    } else {
      const inputs = listEl.querySelectorAll("input[type='checkbox']");
      Array.from(selectEl.options).forEach((option, index) => {
        if (inputs[index]) {
          inputs[index].checked = option.selected;
        }
      });
    }
  };

  const updateSignalSelect = (input = {}) => {
    const select = input.select;
    if (!(select instanceof HTMLSelectElement)) {
      throw new Error("UI measurements updateSignalSelect requires select.");
    }
    const signals = Array.isArray(input.signals) ? input.signals : [];
    const selected = Array.isArray(input.selected) ? input.selected : [];
    const preferredSignals = Array.isArray(input.preferredSignals) ? input.preferredSignals : [];
    const formatSignalLabel = typeof input.formatSignalLabel === "function"
      ? input.formatSignalLabel
      : ((value) => String(value ?? ""));
    const nextSignals = prioritizeSignals(signals, preferredSignals);
    const nextSelected = dedupeSignalList(selected);
    const existing = Array.from(select.options).map((option) => option.value);
    if (existing.join("|") !== nextSignals.join("|")) {
      select.innerHTML = "";
      nextSignals.forEach((signal) => {
        const opt = document.createElement("option");
        opt.value = signal;
        opt.textContent = formatSignalLabel(signal);
        select.appendChild(opt);
      });
    }
    const availableByKey = new Map(nextSignals.map((signal) => [normalizeSignalToken(signal), signal]));
    const filtered = nextSelected
      .map((name) => availableByKey.get(normalizeSignalToken(name)))
      .filter(Boolean);
    const preferredFallback = preferredSignals
      .map((name) => availableByKey.get(normalizeSignalToken(name)))
      .filter(Boolean);
    const preferred = preferredFallback.length
      ? dedupeSignalList(preferredFallback)
      : (nextSignals.length ? [nextSignals[0]] : []);
    const chosen = filtered.length
      ? dedupeSignalList(filtered)
      : preferred;
    const chosenKeys = new Set(chosen.map((entry) => normalizeSignalToken(entry)));
    Array.from(select.options).forEach((option) => {
      option.selected = chosenKeys.has(normalizeSignalToken(option.value));
    });
    const checkboxList = select.parentElement?.querySelector(`[data-signal-checkbox-list="${select.dataset.signalSelect}"]`);
    if (checkboxList) {
      syncSignalCheckboxList({
        listEl: checkboxList,
        selectEl: select
      });
    }
    return chosen;
  };

  const domains = typeof self !== "undefined" ? (self.SpjutSimUIDomains ?? {}) : {};
  domains.measurements = {
    formatMeasurementRowLabel,
    measurementTypeRank,
    sortMeasurementsForDisplay,
    parseMetricInput,
    formatMeasurementValue,
    normalizeNodeName,
    normalizeCurrentName,
    getSelectedSignals,
    parseVoltageSignalToken,
    normalizeSignalToken,
    normalizeTraceTokenValue,
    normalizeSignalTokenSet,
    formatCurrentSignalLabel,
    dedupeSignalList,
    signalListsEqual,
    buildSignalCaseMap,
    applySignalCaseMap,
    applyTraceMapCaseMap,
    normalizeSignalTokens,
    isVoltageSignalToken,
    isCurrentSignalToken,
    classifySignalValue,
    classifySignalToken,
    classifySeriesSignalType,
    splitSeriesByType,
    prioritizeSignals,
    syncSignalCheckboxList,
    updateSignalSelect
  };
  if (typeof self !== "undefined") {
    self.SpjutSimUIDomains = domains;
  }
})();
