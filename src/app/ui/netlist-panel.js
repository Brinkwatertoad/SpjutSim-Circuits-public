/**
 * UI helpers for schematic netlist panel controls.
 */
(function initUINetlistPanelModule() {
  const previewHighlightCacheByTextarea = new WeakMap();
  const selectionLineIndexCacheByCompileInfo = new WeakMap();

  const buildNetlistSelectionLineIndex = (input = {}) => {
    const compileInfo = input.compileInfo && typeof input.compileInfo === "object"
      ? input.compileInfo
      : {};
    const normalizeNodeName = typeof input.normalizeNodeName === "function"
      ? input.normalizeNodeName
      : null;
    if (!normalizeNodeName) {
      throw new Error("UI netlist-panel buildNetlistSelectionLineIndex requires normalizeNodeName().");
    }

    const lineMap = Array.isArray(compileInfo.lineMap) ? compileInfo.lineMap : [];
    const netlistText = String(compileInfo.netlist ?? "");
    const netlistLines = netlistText.split(/\r?\n/);
    const componentToLines = new Map();
    const netToLines = new Map();
    const netToNodeSpans = new Map();
    const componentToNets = new Map();
    const addLine = (map, key, line) => {
      const normalizedKey = String(key ?? "").trim();
      const parsedLine = Number.parseInt(String(line ?? "").trim(), 10);
      if (!normalizedKey || !Number.isFinite(parsedLine) || parsedLine < 1) {
        return;
      }
      if (!map.has(normalizedKey)) {
        map.set(normalizedKey, new Set());
      }
      map.get(normalizedKey).add(parsedLine);
    };
    const addNet = (map, key, netName) => {
      const normalizedKey = String(key ?? "").trim();
      const normalizedNet = normalizeNodeName(netName);
      if (!normalizedKey || !normalizedNet) {
        return;
      }
      if (!map.has(normalizedKey)) {
        map.set(normalizedKey, new Set());
      }
      map.get(normalizedKey).add(normalizedNet);
    };
    const addNodeSpan = (map, netName, span) => {
      const net = normalizeNodeName(netName);
      if (!net || !span || typeof span !== "object") {
        return;
      }
      if (!map.has(net)) {
        map.set(net, []);
      }
      map.get(net).push({
        line: span.line,
        start: span.start,
        length: span.length
      });
    };
    const extractPinMapComponentId = (key) => {
      const raw = String(key ?? "").trim();
      if (!raw) {
        return "";
      }
      const separator = raw.indexOf("::");
      if (separator > 0) {
        return raw.slice(0, separator);
      }
      return raw;
    };
    const getLineTokenSpans = (lineTextRaw) => {
      const lineText = String(lineTextRaw ?? "");
      const spans = [];
      const tokenRegex = /\S+/g;
      let match = tokenRegex.exec(lineText);
      while (match) {
        spans.push({
          text: String(match[0] ?? ""),
          start: match.index,
          length: String(match[0] ?? "").length
        });
        match = tokenRegex.exec(lineText);
      }
      return spans;
    };
    lineMap.forEach((entry) => {
      if (!entry || entry.kind !== "component") {
        return;
      }
      const line = Number.parseInt(String(entry.line ?? "").trim(), 10);
      if (!Number.isFinite(line) || line < 1) {
        return;
      }
      const componentId = String(entry.componentId ?? "").trim();
      if (componentId) {
        addLine(componentToLines, componentId, line);
      }
      const nets = Array.isArray(entry.nets)
        ? entry.nets
        : [entry.netA, entry.netB];
      const normalizedComponentNetsByColumn = nets.map((netName) => normalizeNodeName(netName));
      normalizedComponentNetsByColumn.forEach((net) => {
        if (!net) {
          return;
        }
        addLine(netToLines, net, line);
        if (componentId) {
          addNet(componentToNets, componentId, net);
        }
      });
      if (normalizedComponentNetsByColumn.some(Boolean)) {
        const lineText = String(netlistLines[line - 1] ?? "");
        const lineTokenSpans = getLineTokenSpans(lineText);
        // SPICE component lines are "<id> <node...> <value...>"; only node columns are highlightable.
        normalizedComponentNetsByColumn.forEach((net, netIndex) => {
          if (!net) {
            return;
          }
          const nodeToken = lineTokenSpans[netIndex + 1];
          if (!nodeToken) {
            return;
          }
          const normalizedToken = normalizeNodeName(nodeToken.text);
          if (!normalizedToken || normalizedToken !== net) {
            return;
          }
          addNodeSpan(netToNodeSpans, net, {
            line,
            start: nodeToken.start,
            length: nodeToken.length
          });
        });
      }
    });
    const pinNetMap = compileInfo && typeof compileInfo.pinNetMap === "object"
      ? compileInfo.pinNetMap
      : {};
    Object.entries(pinNetMap).forEach(([key, netName]) => {
      const componentId = extractPinMapComponentId(key);
      if (componentId) {
        addNet(componentToNets, componentId, netName);
      }
    });
    return { componentToLines, netToLines, netToNodeSpans, componentToNets };
  };

  const resolveNetlistPreviewSelectionHighlights = (input = {}) => {
    const selectionLineIndex = input.selectionLineIndex && typeof input.selectionLineIndex === "object"
      ? input.selectionLineIndex
      : null;
    const normalizeNodeName = typeof input.normalizeNodeName === "function"
      ? input.normalizeNodeName
      : null;
    if (!selectionLineIndex || !normalizeNodeName) {
      throw new Error("UI netlist-panel resolveNetlistPreviewSelectionHighlights requires selection index and normalizeNodeName().");
    }
    const resolveWireNet = typeof input.resolveWireNet === "function"
      ? input.resolveWireNet
      : (() => "");
    const normalizeIdList = (values) => Array.from(new Set(
      (Array.isArray(values) ? values : [values])
        .map((entry) => String(entry ?? "").trim())
        .filter(Boolean)
    ));

    const componentIds = normalizeIdList(input.componentIds);
    const wireIds = normalizeIdList(input.wireIds);
    const componentFallbackNets = new Set();
    const wireNets = new Set();
    const highlightedLines = new Set();

    componentIds.forEach((componentId) => {
      const componentLines = selectionLineIndex.componentToLines?.get(componentId);
      if (componentLines && componentLines.size) {
        componentLines.forEach((line) => highlightedLines.add(line));
        return;
      }
      const nets = selectionLineIndex.componentToNets?.get(componentId);
      nets?.forEach((netName) => {
        const net = normalizeNodeName(netName);
        if (net) {
          componentFallbackNets.add(net);
        }
      });
    });

    wireIds.forEach((wireId) => {
      const net = normalizeNodeName(resolveWireNet(wireId));
      if (net) {
        wireNets.add(net);
      }
    });

    componentFallbackNets.forEach((net) => {
      const linesForNet = selectionLineIndex.netToLines?.get(net);
      linesForNet?.forEach((line) => highlightedLines.add(line));
    });

    const highlightedNodeSpans = [];
    wireNets.forEach((net) => {
      const spans = selectionLineIndex.netToNodeSpans?.get(net);
      if (Array.isArray(spans) && spans.length) {
        highlightedNodeSpans.push(...spans);
      }
    });

    return {
      lines: Array.from(highlightedLines),
      nodeSpans: highlightedNodeSpans
    };
  };

  const getCachedNetlistSelectionLineIndex = (input = {}) => {
    const compileInfo = input.compileInfo;
    const canUseWeakCache = Boolean(compileInfo && typeof compileInfo === "object");
    if (canUseWeakCache && selectionLineIndexCacheByCompileInfo.has(compileInfo)) {
      return selectionLineIndexCacheByCompileInfo.get(compileInfo);
    }
    const index = buildNetlistSelectionLineIndex(input);
    if (canUseWeakCache) {
      selectionLineIndexCacheByCompileInfo.set(compileInfo, index);
    }
    return index;
  };

  const applyNetlistPreviewHighlights = (input = {}) => {
    const netlistPreview = input.netlistPreview;
    const netlistPreviewCode = input.netlistPreviewCode;
    if (!(netlistPreview instanceof HTMLTextAreaElement) || !(netlistPreviewCode instanceof HTMLElement)) {
      throw new Error("UI netlist-panel applyNetlistPreviewHighlights requires netlist preview elements.");
    }
    const normalizeNetlistHighlightLines = typeof input.normalizeNetlistHighlightLines === "function"
      ? input.normalizeNetlistHighlightLines
      : null;
    const normalizeNetlistHighlightNodeSpans = typeof input.normalizeNetlistHighlightNodeSpans === "function"
      ? input.normalizeNetlistHighlightNodeSpans
      : null;
    if (!normalizeNetlistHighlightLines || !normalizeNetlistHighlightNodeSpans) {
      throw new Error("UI netlist-panel applyNetlistPreviewHighlights requires highlight normalizers.");
    }
    const normalizedLines = normalizeNetlistHighlightLines(input.lines);
    const normalizedNodeSpans = normalizeNetlistHighlightNodeSpans(input.nodeSpans);
    if (!Array.isArray(normalizedLines) || !Array.isArray(normalizedNodeSpans)) {
      throw new Error("UI netlist-panel highlight normalizers must return arrays.");
    }
    const lineKey = normalizedLines.join(",");
    const nodeKey = normalizedNodeSpans.map((entry) => `${entry.line}:${entry.start}:${entry.length}`).join(",");
    const sourceText = String(netlistPreview.value ?? "");
    const cached = previewHighlightCacheByTextarea.get(netlistPreview) ?? {
      lineKey: "",
      nodeKey: "",
      sourceText: ""
    };
    if (
      cached.lineKey === lineKey
      && cached.nodeKey === nodeKey
      && cached.sourceText === sourceText
    ) {
      return false;
    }
    previewHighlightCacheByTextarea.set(netlistPreview, {
      lineKey,
      nodeKey,
      sourceText
    });
    netlistPreview.dataset.netlistHighlightLines = lineKey;
    netlistPreview.dataset.netlistHighlightNodes = nodeKey;
    netlistPreview.style.backgroundImage = "";
    netlistPreview.style.backgroundSize = "";
    netlistPreview.style.backgroundPosition = "";
    netlistPreview.style.backgroundRepeat = "";

    const doc = netlistPreviewCode.ownerDocument ?? (typeof document !== "undefined" ? document : null);
    if (!doc) {
      throw new Error("UI netlist-panel applyNetlistPreviewHighlights could not resolve ownerDocument.");
    }

    const linesToRender = sourceText.split(/\r?\n/);
    const highlightedLineSet = new Set(normalizedLines);
    const nodeSpansByLine = new Map();
    normalizedNodeSpans.forEach((entry) => {
      if (!nodeSpansByLine.has(entry.line)) {
        nodeSpansByLine.set(entry.line, []);
      }
      nodeSpansByLine.get(entry.line).push(entry);
    });
    nodeSpansByLine.forEach((entries) => {
      entries.sort((a, b) => {
        if (a.start !== b.start) {
          return a.start - b.start;
        }
        return b.length - a.length;
      });
    });

    const fragment = doc.createDocumentFragment();
    linesToRender.forEach((lineTextRaw, index) => {
      const lineNumber = index + 1;
      const lineText = String(lineTextRaw ?? "");
      const lineElement = doc.createElement("span");
      lineElement.className = "schematic-netlist-line";
      lineElement.dataset.netlistLineNumber = String(lineNumber);
      if (highlightedLineSet.has(lineNumber)) {
        lineElement.classList.add("schematic-netlist-line-highlight");
      }
      const lineSpans = nodeSpansByLine.get(lineNumber) ?? [];
      if (!lineSpans.length) {
        lineElement.textContent = lineText;
      } else {
        let cursor = 0;
        lineSpans.forEach((span) => {
          const safeStart = Math.max(0, Math.min(span.start, lineText.length));
          const safeEnd = Math.max(
            safeStart,
            Math.min(lineText.length, safeStart + Math.max(1, span.length))
          );
          if (safeStart > cursor) {
            lineElement.appendChild(
              doc.createTextNode(lineText.slice(cursor, safeStart))
            );
          }
          const highlightStart = Math.max(cursor, safeStart);
          if (safeEnd > highlightStart) {
            const nodeElement = doc.createElement("span");
            nodeElement.className = "schematic-netlist-node-highlight";
            nodeElement.textContent = lineText.slice(highlightStart, safeEnd);
            lineElement.appendChild(nodeElement);
          }
          cursor = Math.max(cursor, safeEnd);
        });
        if (cursor < lineText.length) {
          lineElement.appendChild(
            doc.createTextNode(lineText.slice(cursor))
          );
        }
      }
      fragment.appendChild(lineElement);
    });
    netlistPreviewCode.replaceChildren(fragment);
    return true;
  };

  const syncNetlistPreviewHighlightsFromSelection = (input = {}) => {
    const resolved = resolveNetlistPreviewSelectionHighlights({
      selectionLineIndex: input.selectionLineIndex,
      componentIds: input.componentIds,
      wireIds: input.wireIds,
      normalizeNodeName: input.normalizeNodeName,
      resolveWireNet: input.resolveWireNet
    });
    return applyNetlistPreviewHighlights({
      netlistPreview: input.netlistPreview,
      netlistPreviewCode: input.netlistPreviewCode,
      lines: resolved.lines,
      nodeSpans: resolved.nodeSpans,
      normalizeNetlistHighlightLines: input.normalizeNetlistHighlightLines,
      normalizeNetlistHighlightNodeSpans: input.normalizeNetlistHighlightNodeSpans
    });
  };

  const createSimulationNetlistPanel = (input = {}) => {
    const applyHelpEntry = typeof input.applyHelpEntry === "function" ? input.applyHelpEntry : () => {};
    const helpEntries = input.helpEntries && typeof input.helpEntries === "object" ? input.helpEntries : {};
    const createActionIcon = typeof input.createActionIcon === "function" ? input.createActionIcon : () => null;
    const applyCustomTooltip = typeof input.applyCustomTooltip === "function" ? input.applyCustomTooltip : () => {};

    const saveRow = document.createElement("div");
    saveRow.className = "schematic-config-row";
    const saveLabel = document.createElement("label");
    saveLabel.textContent = "Save signals";
    const saveInput = document.createElement("input");
    saveInput.type = "text";
    saveInput.placeholder = "comma separated (e.g., v(out), i(R1))";
    saveInput.dataset.schematicConfig = "save:signals";
    applyHelpEntry(saveLabel, helpEntries.saveSignals);
    applyHelpEntry(saveInput, helpEntries.saveSignals);
    saveRow.append(saveLabel, saveInput);

    const netlistPreambleLabel = document.createElement("span");
    netlistPreambleLabel.textContent = "Netlist preamble:";
    const netlistPreambleInput = document.createElement("textarea");
    netlistPreambleInput.className = "schematic-netlist-preamble";
    netlistPreambleInput.dataset.netlistPreamble = "1";
    netlistPreambleInput.placeholder = "Optional directives (e.g., .include, .options)";
    applyHelpEntry(netlistPreambleLabel, helpEntries.netlistPreamble);
    applyHelpEntry(netlistPreambleInput, helpEntries.netlistPreamble);

    const netlistPreviewLabel = document.createElement("span");
    netlistPreviewLabel.textContent = "Generated netlist:";
    const netlistPreviewHeader = document.createElement("div");
    netlistPreviewHeader.className = "schematic-netlist-preview-header";
    netlistPreviewHeader.dataset.netlistPreviewHeader = "1";
    const netlistPreview = document.createElement("textarea");
    netlistPreview.className = "schematic-netlist-preview";
    netlistPreview.readOnly = true;
    netlistPreview.hidden = true;
    netlistPreview.setAttribute("aria-hidden", "true");
    netlistPreview.tabIndex = -1;

    const netlistPreviewActions = document.createElement("div");
    netlistPreviewActions.className = "schematic-netlist-preview-actions";
    const netlistCopyButton = document.createElement("button");
    netlistCopyButton.type = "button";
    netlistCopyButton.className = "secondary icon-button schematic-netlist-copy-button";
    netlistCopyButton.dataset.netlistCopy = "1";
    const netlistCopyIcon = createActionIcon("duplicate");
    if (netlistCopyIcon) {
      netlistCopyButton.appendChild(netlistCopyIcon);
    }
    applyCustomTooltip(netlistCopyButton, "Copy Netlist");
    netlistPreviewActions.appendChild(netlistCopyButton);
    netlistPreviewHeader.append(netlistPreviewLabel, netlistPreviewActions);

    const netlistPreviewView = document.createElement("pre");
    netlistPreviewView.className = "schematic-netlist-preview-view";
    netlistPreviewView.dataset.netlistPreviewView = "1";
    const netlistPreviewCode = document.createElement("code");
    netlistPreviewCode.dataset.netlistPreviewCode = "1";
    netlistPreviewView.appendChild(netlistPreviewCode);

    applyHelpEntry(netlistPreviewLabel, helpEntries.generatedNetlist);
    applyHelpEntry(netlistPreviewView, helpEntries.generatedNetlist);
    applyHelpEntry(netlistCopyButton, helpEntries.copyNetlist);
    applyHelpEntry(netlistPreview, helpEntries.generatedNetlist);

    const netlistWarnings = document.createElement("div");
    netlistWarnings.className = "schematic-netlist-warnings";

    return {
      saveRow,
      saveInput,
      netlistPreambleLabel,
      netlistPreambleInput,
      netlistPreviewHeader,
      netlistPreview,
      netlistPreviewView,
      netlistPreviewCode,
      netlistWarnings,
      netlistCopyButton
    };
  };

  if (typeof self !== "undefined") {
    self.SpjutSimUINetlistPanel = {
      createSimulationNetlistPanel,
      buildNetlistSelectionLineIndex,
      getCachedNetlistSelectionLineIndex,
      resolveNetlistPreviewSelectionHighlights,
      syncNetlistPreviewHighlightsFromSelection,
      applyNetlistPreviewHighlights
    };
  }
})();
