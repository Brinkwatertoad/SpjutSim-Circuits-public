/**
 * UI results-pane domain helpers.
 */
(function initUIResultsPaneDomain() {
  const RESULTS_PANE_MODES = Object.freeze(["hidden", "split", "expanded", "empty"]);
  const RESULTS_PANE_MODE_SET = new Set(RESULTS_PANE_MODES);
  const DEFAULT_RESULTS_PANE_MODE = "hidden";
  const DEFAULT_RESULTS_PANE_SPLIT_RATIO = 0.5;
  const MIN_RESULTS_PANE_SPLIT_RATIO = 0.25;
  const MAX_RESULTS_PANE_SPLIT_RATIO = 0.75;
  const RESULTS_PANE_STACK_WIDTH_THRESHOLD = 900;
  const RESULTS_PANE_COMPACT_WIDTH_THRESHOLD = 600;

  const normalizeMode = (value) => {
    const mode = String(value ?? "").trim().toLowerCase();
    return RESULTS_PANE_MODE_SET.has(mode) ? mode : DEFAULT_RESULTS_PANE_MODE;
  };

  const clampSplitRatio = (value) => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      return DEFAULT_RESULTS_PANE_SPLIT_RATIO;
    }
    return Math.min(MAX_RESULTS_PANE_SPLIT_RATIO, Math.max(MIN_RESULTS_PANE_SPLIT_RATIO, parsed));
  };

  const normalizeState = (stateValue) => {
    const raw = stateValue && typeof stateValue === "object" ? stateValue : {};
    return {
      mode: normalizeMode(raw.mode),
      splitRatio: clampSplitRatio(raw.splitRatio)
    };
  };

  const getResponsiveState = (width) => {
    const safeWidth = Number.isFinite(width) ? width : 0;
    const dockedAllowed = safeWidth >= RESULTS_PANE_COMPACT_WIDTH_THRESHOLD;
    const stacked = dockedAllowed && safeWidth <= RESULTS_PANE_STACK_WIDTH_THRESHOLD;
    return {
      dockedAllowed,
      stacked
    };
  };

  const deriveModeFromVisibility = (schematicVisible, resultsVisible) => {
    if (schematicVisible && resultsVisible) return "split";
    if (schematicVisible && !resultsVisible) return "hidden";
    if (!schematicVisible && resultsVisible) return "expanded";
    return "empty";
  };

  const resolveEffectiveMode = (mode, responsiveState) => {
    const normalized = normalizeMode(mode);
    const dockedAllowed = responsiveState?.dockedAllowed === true;
    if (!dockedAllowed && normalized === "split") {
      return "expanded";
    }
    return normalized;
  };

  const isResultsVisible = (mode, responsiveState) => {
    const effectiveMode = resolveEffectiveMode(mode, responsiveState);
    return effectiveMode === "split" || effectiveMode === "expanded";
  };

  const isSchematicVisible = (mode, responsiveState) => {
    const effectiveMode = resolveEffectiveMode(mode, responsiveState);
    return effectiveMode === "split" || effectiveMode === "hidden";
  };

  const toggleResultsVisibilityMode = (mode, responsiveState) => {
    const narrow = !(responsiveState?.dockedAllowed === true);
    const currentResults = isResultsVisible(mode, responsiveState);
    const currentSchematic = isSchematicVisible(mode, responsiveState);
    const nextResults = !currentResults;
    const nextSchematic = narrow && nextResults ? false : currentSchematic;
    return deriveModeFromVisibility(nextSchematic, nextResults);
  };

  const toggleSchematicVisibilityMode = (mode, responsiveState) => {
    const narrow = !(responsiveState?.dockedAllowed === true);
    const currentResults = isResultsVisible(mode, responsiveState);
    const currentSchematic = isSchematicVisible(mode, responsiveState);
    const nextSchematic = !currentSchematic;
    const nextResults = narrow && nextSchematic ? false : currentResults;
    return deriveModeFromVisibility(nextSchematic, nextResults);
  };

  const clampNumber = (value, min, max) => {
    if (!Number.isFinite(value)) {
      return min;
    }
    return Math.min(max, Math.max(min, value));
  };

  const requireMeasurementsDomain = () => {
    const domains = typeof self !== "undefined" ? (self.SpjutSimUIDomains ?? null) : null;
    const measurements = domains?.measurements;
    if (!measurements || typeof measurements.normalizeSignalToken !== "function") {
      throw new Error("UI measurements domain missing normalizeSignalToken for results-pane helpers.");
    }
    return measurements;
  };

  const normalizeStoredRowToken = (value) => {
    const token = String(value ?? "").trim().toLowerCase();
    if (!token) {
      return "";
    }
    if (token.startsWith("v:") || token.startsWith("vd:") || token.startsWith("i:")) {
      return token;
    }
    return requireMeasurementsDomain().normalizeSignalToken(token);
  };

  const normalizeStoredRowTokenList = (values) => {
    const tokens = [];
    const seen = new Set();
    (Array.isArray(values) ? values : []).forEach((entry) => {
      const token = normalizeStoredRowToken(entry);
      if (!token || seen.has(token)) {
        return;
      }
      seen.add(token);
      tokens.push(token);
    });
    return tokens;
  };

  const normalizeSchematicIdList = (values) => Array.from(new Set(
    (Array.isArray(values) ? values : [values])
      .map((entry) => String(entry ?? "").trim())
      .filter(Boolean)
  ));

  const formatDisplayNumber = (value) => {
    if (!Number.isFinite(value)) {
      return "n/a";
    }
    const abs = Math.abs(value);
    if (abs !== 0 && (abs >= 1e6 || abs < 1e-3)) {
      return value.toExponential(3);
    }
    return value.toPrecision(4);
  };

  const formatDisplayValue = (value) => {
    if (value === null || value === undefined) {
      return "n/a";
    }
    if (typeof value === "number") {
      return formatDisplayNumber(value);
    }
    if (typeof value === "object"
      && Number.isFinite(value.real)
      && Number.isFinite(value.imag)) {
      const real = formatDisplayNumber(value.real);
      const imagAbs = Math.abs(value.imag);
      if (imagAbs === 0) {
        return real;
      }
      const sign = value.imag >= 0 ? "+" : "-";
      return `${real} ${sign} j${formatDisplayNumber(imagAbs)}`;
    }
    return String(value);
  };

  const setsEqual = (a, b) => {
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

  const normalizeHighlightColor = (value) => String(value ?? "").trim().toLowerCase();

  const normalizeHighlightMode = (value) => {
    const mode = String(value ?? "").trim().toLowerCase();
    return mode === "hover" ? "hover" : "selection";
  };

  const normalizeHighlightEntries = (entries) => {
    if (!Array.isArray(entries)) {
      return [];
    }
    const deduped = new Map();
    entries.forEach((entry) => {
      if (!entry || typeof entry !== "object") {
        return;
      }
      const componentIds = normalizeSchematicIdList(entry.componentIds).sort();
      const wireIds = normalizeSchematicIdList(entry.wireIds).sort();
      if (!componentIds.length && !wireIds.length) {
        return;
      }
      const color = normalizeHighlightColor(entry.color);
      const mode = normalizeHighlightMode(entry.mode);
      const key = `${mode}|${color}|${componentIds.join(",")}|${wireIds.join(",")}`;
      if (!deduped.has(key)) {
        deduped.set(key, { componentIds, wireIds, color, mode });
      }
    });
    return Array.from(deduped.values()).sort((a, b) => {
      const aKey = `${a.mode}|${a.color}|${a.componentIds.join(",")}|${a.wireIds.join(",")}`;
      const bKey = `${b.mode}|${b.color}|${b.componentIds.join(",")}|${b.wireIds.join(",")}`;
      return aKey.localeCompare(bKey);
    });
  };

  const normalizeHighlightTargets = (targets) => ({
    componentIds: normalizeSchematicIdList(targets?.componentIds),
    wireIds: normalizeSchematicIdList(targets?.wireIds),
    color: normalizeHighlightColor(targets?.color),
    entries: normalizeHighlightEntries(targets?.entries)
  });

  const highlightTargetsEqual = (a, b) => {
    const aComponents = new Set(normalizeSchematicIdList(a?.componentIds));
    const bComponents = new Set(normalizeSchematicIdList(b?.componentIds));
    const aWires = new Set(normalizeSchematicIdList(a?.wireIds));
    const bWires = new Set(normalizeSchematicIdList(b?.wireIds));
    const aEntries = normalizeHighlightEntries(a?.entries);
    const bEntries = normalizeHighlightEntries(b?.entries);
    const entriesEqual = aEntries.length === bEntries.length && aEntries.every((entry, index) => {
      const other = bEntries[index];
      if (!other) {
        return false;
      }
      return entry.color === other.color
        && normalizeHighlightMode(entry.mode) === normalizeHighlightMode(other.mode)
        && entry.componentIds.join(",") === other.componentIds.join(",")
        && entry.wireIds.join(",") === other.wireIds.join(",");
    });
    return setsEqual(aComponents, bComponents)
      && setsEqual(aWires, bWires)
      && normalizeHighlightColor(a?.color) === normalizeHighlightColor(b?.color)
      && entriesEqual;
  };

  const hasHighlightTargets = (targets) => {
    const normalized = normalizeHighlightTargets(targets);
    if (normalized.componentIds.length > 0 || normalized.wireIds.length > 0) {
      return true;
    }
    return normalized.entries.some((entry) => entry.componentIds.length > 0 || entry.wireIds.length > 0);
  };

  const buildHighlightTargetEntries = (targets, mode) => {
    const normalized = normalizeHighlightTargets(targets);
    if (normalized.entries.length) {
      return normalized.entries.map((entry) => ({
        componentIds: entry.componentIds.slice(),
        wireIds: entry.wireIds.slice(),
        color: entry.color,
        mode: normalizeHighlightMode(entry.mode || mode)
      }));
    }
    if (!normalized.componentIds.length && !normalized.wireIds.length) {
      return [];
    }
    return [{
      componentIds: normalized.componentIds.slice(),
      wireIds: normalized.wireIds.slice(),
      color: normalized.color,
      mode: normalizeHighlightMode(mode)
    }];
  };

  const mergeExternalHighlightTargets = (selectionTargets, hoverTargets) => {
    const selectionEntries = buildHighlightTargetEntries(selectionTargets, "selection");
    const hoverEntries = buildHighlightTargetEntries(hoverTargets, "hover");
    const mergedEntries = normalizeHighlightEntries(selectionEntries.concat(hoverEntries));
    if (!mergedEntries.length) {
      return { componentIds: [], wireIds: [], color: "", entries: [] };
    }
    const mergedComponents = new Set();
    const mergedWires = new Set();
    mergedEntries.forEach((entry) => {
      entry.componentIds.forEach((id) => mergedComponents.add(id));
      entry.wireIds.forEach((id) => mergedWires.add(id));
    });
    const colorSource = mergedEntries.find((entry) => entry.mode === "selection")
      ?? mergedEntries[0];
    return {
      componentIds: Array.from(mergedComponents),
      wireIds: Array.from(mergedWires),
      color: colorSource?.color ?? "",
      entries: mergedEntries
    };
  };

  const normalizeNetlistHighlightLines = (lines) => {
    const unique = new Set();
    (Array.isArray(lines) ? lines : []).forEach((line) => {
      const parsed = Number.parseInt(String(line ?? "").trim(), 10);
      if (Number.isFinite(parsed) && parsed > 0) {
        unique.add(parsed);
      }
    });
    return Array.from(unique).sort((a, b) => a - b);
  };

  const normalizeNetlistHighlightNodeSpans = (spans) => {
    const deduped = new Map();
    (Array.isArray(spans) ? spans : []).forEach((entry) => {
      const line = Number.parseInt(String(entry?.line ?? "").trim(), 10);
      const start = Number.parseInt(String(entry?.start ?? "").trim(), 10);
      const length = Number.parseInt(String(entry?.length ?? "").trim(), 10);
      if (!Number.isFinite(line) || line < 1 || !Number.isFinite(start) || start < 0 || !Number.isFinite(length) || length < 1) {
        return;
      }
      const key = `${line}:${start}:${length}`;
      if (!deduped.has(key)) {
        deduped.set(key, { line, start, length });
      }
    });
    return Array.from(deduped.values()).sort((a, b) => {
      if (a.line !== b.line) {
        return a.line - b.line;
      }
      if (a.start !== b.start) {
        return a.start - b.start;
      }
      return a.length - b.length;
    });
  };

  const resolveDragTarget = (input) => {
    const args = input && typeof input === "object" ? input : {};
    const isStacked = args.stacked === true;
    const layoutWidth = Number(args.layoutWidth);
    const layoutHeight = Number(args.layoutHeight);
    const dividerSizeRaw = Number(args.dividerSize);
    const relativeCenterX = Number(args.relativeCenterX);
    const relativeCenterY = Number(args.relativeCenterY);

    if (isStacked) {
      if (!Number.isFinite(layoutHeight) || layoutHeight <= 0) {
        return null;
      }
      const dividerSize = clampNumber(dividerSizeRaw, 0, layoutHeight);
      const availableHeight = Math.max(1, layoutHeight - dividerSize);
      const centerY = clampNumber(relativeCenterY, 0, layoutHeight);
      const topHeight = clampNumber(centerY - (dividerSize / 2), 0, availableHeight);
      const bottomHeight = Math.max(0, availableHeight - topHeight);
      const minimumResultsHeight = availableHeight * (1 - MAX_RESULTS_PANE_SPLIT_RATIO);
      const minimumSchematicHeight = availableHeight * MIN_RESULTS_PANE_SPLIT_RATIO;
      if (bottomHeight <= (minimumResultsHeight * 0.5)) {
        return { mode: "hidden" };
      }
      if (topHeight <= (minimumSchematicHeight * 0.5)) {
        return { mode: "expanded" };
      }
      return {
        mode: "split",
        splitRatio: topHeight / availableHeight
      };
    }

    if (!Number.isFinite(layoutWidth) || layoutWidth <= 0) {
      return null;
    }
    const dividerSize = clampNumber(dividerSizeRaw, 0, layoutWidth);
    const availableWidth = Math.max(1, layoutWidth - dividerSize);
    const centerX = clampNumber(relativeCenterX, 0, layoutWidth);
    const leftWidth = clampNumber(centerX - (dividerSize / 2), 0, availableWidth);
    const rightWidth = Math.max(0, availableWidth - leftWidth);
    const minimumResultsWidth = availableWidth * (1 - MAX_RESULTS_PANE_SPLIT_RATIO);
    const minimumSchematicWidth = availableWidth * MIN_RESULTS_PANE_SPLIT_RATIO;
    if (rightWidth <= (minimumResultsWidth * 0.5)) {
      return { mode: "hidden" };
    }
    if (leftWidth <= (minimumSchematicWidth * 0.5)) {
      return { mode: "expanded" };
    }
    return {
      mode: "split",
      splitRatio: leftWidth / availableWidth
    };
  };

  const domains = typeof self !== "undefined" ? (self.SpjutSimUIDomains ?? {}) : {};
  domains.resultsPane = {
    RESULTS_PANE_MODES: RESULTS_PANE_MODES.slice(),
    DEFAULT_RESULTS_PANE_MODE,
    DEFAULT_RESULTS_PANE_SPLIT_RATIO,
    MIN_RESULTS_PANE_SPLIT_RATIO,
    MAX_RESULTS_PANE_SPLIT_RATIO,
    RESULTS_PANE_STACK_WIDTH_THRESHOLD,
    RESULTS_PANE_COMPACT_WIDTH_THRESHOLD,
    normalizeMode,
    clampSplitRatio,
    normalizeState,
    getResponsiveState,
    deriveModeFromVisibility,
    resolveEffectiveMode,
    isResultsVisible,
    isSchematicVisible,
    toggleResultsVisibilityMode,
    toggleSchematicVisibilityMode,
    clampNumber,
    resolveDragTarget,
    normalizeStoredRowToken,
    normalizeStoredRowTokenList,
    formatDisplayNumber,
    formatDisplayValue,
    normalizeHighlightColor,
    normalizeHighlightMode,
    normalizeHighlightEntries,
    normalizeHighlightTargets,
    highlightTargetsEqual,
    hasHighlightTargets,
    buildHighlightTargetEntries,
    mergeExternalHighlightTargets,
    normalizeNetlistHighlightLines,
    normalizeNetlistHighlightNodeSpans
  };
  if (typeof self !== "undefined") {
    self.SpjutSimUIDomains = domains;
  }
})();
