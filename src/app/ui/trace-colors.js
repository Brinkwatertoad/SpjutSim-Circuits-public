/**
 * Trace color management: palette assignment, shared color maps, net-color
 * resolution, and hover/trace color helpers for simulation result plots.
 */
(function initUITraceColorsModule() {
  const createTraceColorManager = (config) => {
    const normalizeTraceTokenValue = typeof config?.normalizeTraceTokenValue === "function"
      ? config.normalizeTraceTokenValue
      : (v) => String(v ?? "").trim().toLowerCase();
    const normalizeSignalTokenSet = typeof config?.normalizeSignalTokenSet === "function"
      ? config.normalizeSignalTokenSet
      : (signals) => (Array.isArray(signals) ? signals : []).map((s) => String(s ?? "").trim().toLowerCase()).filter(Boolean);

    const palette = ["#0f62fe", "#da1e28", "#198038", "#8a3ffc", "#ff832b", "#007d79"];
    const colorMaps = {
      op: new Map(),
      dc: new Map(),
      tran: new Map(),
      ac: new Map()
    };
    const sharedTraceColorMap = new Map();
    let nextSharedPaletteColorIndex = 0;
    const TRACE_COLOR_MODE_AUTO = "auto";
    const TRACE_COLOR_MODE_PALETTE = "palette";
    const TRACE_COLOR_MODE_FORCE_NET = "force-net";
    let traceColorMode = TRACE_COLOR_MODE_AUTO;
    let netSignalColorMap = new Map();
    const SCHEMATIC_HOVER_FALLBACK_COLOR = "#1d1d1f";

    const normalizeHexColor = (value) => {
      const text = String(value ?? "").trim().toLowerCase();
      if (!text) {
        return "";
      }
      if (/^#[0-9a-f]{3}$/i.test(text)) {
        return `#${text[1]}${text[1]}${text[2]}${text[2]}${text[3]}${text[3]}`;
      }
      if (/^#[0-9a-f]{6}$/i.test(text)) {
        return text;
      }
      const rgb = text.match(/^rgb\(\s*(\d+),\s*(\d+),\s*(\d+)\s*\)$/i);
      if (!rgb) {
        return text.replace(/\s+/g, "");
      }
      const toHex = (channel) => Number(channel).toString(16).padStart(2, "0");
      return `#${toHex(rgb[1])}${toHex(rgb[2])}${toHex(rgb[3])}`;
    };

    const resolveNetColorForTraceToken = (traceToken) => {
      const token = normalizeTraceTokenValue(traceToken);
      if (!token) {
        return "";
      }
      if (traceColorMode === TRACE_COLOR_MODE_PALETTE) {
        return "";
      }
      if (token.startsWith("v:")) {
        return netSignalColorMap.get(token) ?? "";
      }
      if (traceColorMode === TRACE_COLOR_MODE_FORCE_NET && token.startsWith("vd:")) {
        const [pos, neg] = token.slice(3).split(",");
        const posColor = pos ? netSignalColorMap.get(`v:${pos}`) : "";
        const negColor = neg ? netSignalColorMap.get(`v:${neg}`) : "";
        return posColor || negColor || "";
      }
      return "";
    };

    const syncTokenColorAcrossAnalysisMaps = (token, color) => {
      const normalizedToken = normalizeTraceTokenValue(token);
      const normalizedColor = normalizeHexColor(color);
      if (!normalizedToken || !normalizedColor) {
        return;
      }
      [colorMaps.op, colorMaps.dc, colorMaps.tran, colorMaps.ac].forEach((map) => {
        if (!(map instanceof Map)) {
          return;
        }
        for (const [signal] of map.entries()) {
          if (normalizeTraceTokenValue(signal) !== normalizedToken) {
            continue;
          }
          map.set(signal, normalizedColor);
        }
      });
    };

    const assignSharedTraceColor = (signal, preferredColor = "") => {
      const token = normalizeTraceTokenValue(signal);
      const preferred = normalizeHexColor(preferredColor);
      if (!token) {
        return preferred;
      }
      if (preferred) {
        const current = normalizeHexColor(sharedTraceColorMap.get(token));
        if (current !== preferred) {
          sharedTraceColorMap.set(token, preferred);
          syncTokenColorAcrossAnalysisMaps(token, preferred);
        }
        return preferred;
      }
      const existing = normalizeHexColor(sharedTraceColorMap.get(token));
      if (existing) {
        return existing;
      }
      const fallback = normalizeHexColor(palette[nextSharedPaletteColorIndex % palette.length]);
      nextSharedPaletteColorIndex += 1;
      if (fallback) {
        sharedTraceColorMap.set(token, fallback);
        return fallback;
      }
      return "";
    };

    const ensureColorMap = (map, signals) => {
      if (!map || !Array.isArray(signals)) {
        return;
      }
      signals.forEach((signal, index) => {
        const preferred = normalizeHexColor(resolveNetColorForTraceToken(signal));
        const sharedColor = assignSharedTraceColor(signal, preferred);
        if (sharedColor) {
          map.set(signal, sharedColor);
          return;
        }
        if (!map.has(signal)) {
          map.set(signal, palette[index % palette.length]);
        }
      });
    };

    const resolveTraceColorForSignalToken = (signalToken) => {
      const normalizedToken = normalizeTraceTokenValue(signalToken);
      if (!normalizedToken) {
        return "";
      }
      const sharedColor = normalizeHexColor(sharedTraceColorMap.get(normalizedToken));
      if (sharedColor) {
        return sharedColor;
      }
      const maps = [colorMaps.op, colorMaps.dc, colorMaps.tran, colorMaps.ac];
      for (const map of maps) {
        if (!(map instanceof Map)) {
          continue;
        }
        for (const [signal, color] of map.entries()) {
          if (normalizeTraceTokenValue(signal) !== normalizedToken) {
            continue;
          }
          const normalizedColor = normalizeHexColor(color);
          if (normalizedColor) {
            return normalizedColor;
          }
        }
      }
      return "";
    };

    const resolveHoverColorForSignalToken = (signalToken) => {
      const traceColor = resolveTraceColorForSignalToken(signalToken);
      if (traceColor) {
        return traceColor;
      }
      const netColor = normalizeHexColor(resolveNetColorForTraceToken(signalToken));
      if (netColor) {
        return netColor;
      }
      return SCHEMATIC_HOVER_FALLBACK_COLOR;
    };

    const resolveHoverColorForSignals = (signals) => {
      const tokens = normalizeSignalTokenSet(signals);
      for (const token of tokens) {
        const color = resolveHoverColorForSignalToken(token);
        if (color) {
          return color;
        }
      }
      return SCHEMATIC_HOVER_FALLBACK_COLOR;
    };

    const resolveTraceColorForSignals = (signals) => {
      const tokens = normalizeSignalTokenSet(signals);
      for (const token of tokens) {
        const color = resolveTraceColorForSignalToken(token);
        if (color) {
          return color;
        }
      }
      return "";
    };

    const rebuildTraceNetColorMap = (deps) => {
      const api = typeof deps?.getSchematicApi === "function" ? deps.getSchematicApi() : null;
      const model = deps?.getModel?.() ?? null;
      if (!api || typeof api.resolveNetColors !== "function" || !model) {
        netSignalColorMap = new Map();
        return;
      }
      let resolvedColors = null;
      try {
        resolvedColors = api.resolveNetColors(model);
      } catch {
        resolvedColors = null;
      }
      const wireColors = resolvedColors && typeof resolvedColors.wireColors === "object"
        ? resolvedColors.wireColors
        : {};
      const netLabelColors = resolvedColors && typeof resolvedColors.netColors === "object"
        ? resolvedColors.netColors
        : {};
      const normalizeNodeName = typeof deps?.normalizeNodeName === "function"
        ? deps.normalizeNodeName
        : (v) => String(v ?? "").trim().toLowerCase();
      const traceIndex = typeof deps?.getTraceLinkIndex === "function"
        ? deps.getTraceLinkIndex()
        : { wireToNet: new Map(), componentToNets: new Map() };
      const nextMap = new Map();
      Object.entries(wireColors).forEach(([wireIdRaw, colorRaw]) => {
        const wireId = String(wireIdRaw ?? "").trim();
        if (!wireId) {
          return;
        }
        const netName = normalizeNodeName(traceIndex.wireToNet.get(wireId));
        const color = normalizeHexColor(colorRaw);
        if (!netName || !color) {
          return;
        }
        const key = `v:${netName}`;
        if (!nextMap.has(key)) {
          nextMap.set(key, color);
        }
      });
      Object.entries(netLabelColors).forEach(([componentIdRaw, colorRaw]) => {
        const componentId = String(componentIdRaw ?? "").trim();
        const color = normalizeHexColor(colorRaw);
        if (!componentId || !color) {
          return;
        }
        const nets = traceIndex.componentToNets.get(componentId);
        nets?.forEach((netNameRaw) => {
          const netName = normalizeNodeName(netNameRaw);
          if (!netName) {
            return;
          }
          const key = `v:${netName}`;
          if (!nextMap.has(key)) {
            nextMap.set(key, color);
          }
        });
      });
      netSignalColorMap = nextMap;
    };

    return Object.freeze({
      palette,
      TRACE_COLOR_MODE_AUTO,
      TRACE_COLOR_MODE_PALETTE,
      TRACE_COLOR_MODE_FORCE_NET,
      SCHEMATIC_HOVER_FALLBACK_COLOR,
      getTraceColorMode: () => traceColorMode,
      setTraceColorMode: (mode) => { traceColorMode = mode; },
      getNetSignalColorMap: () => netSignalColorMap,
      setNetSignalColorMap: (map) => { netSignalColorMap = map; },
      getColorMap: (kind) => colorMaps[kind],
      resolveNetColorForTraceToken,
      syncTokenColorAcrossAnalysisMaps,
      assignSharedTraceColor,
      ensureColorMap,
      normalizeHexColor,
      resolveTraceColorForSignalToken,
      resolveHoverColorForSignalToken,
      resolveHoverColorForSignals,
      resolveTraceColorForSignals,
      rebuildTraceNetColorMap,
    });
  };

  if (typeof self !== "undefined") {
    self.SpjutSimUITraceColors = { createTraceColorManager };
  }
})();
