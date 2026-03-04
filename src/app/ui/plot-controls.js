/**
 * UI plot-control helpers.
 */
(function initUIPlotControlsModule() {
  const snapPlotOption = (value, options, fallback) => {
    const list = Array.isArray(options) ? options : [];
    if (!list.length) {
      return fallback;
    }
    let best = list[0];
    let bestDelta = Math.abs(value - best);
    list.forEach((option) => {
      const delta = Math.abs(value - option);
      if (delta < bestDelta) {
        best = option;
        bestDelta = delta;
      }
    });
    return best;
  };

  const normalizePlotFontScale = (value, clampFn, optionValues, fallback = 1) => {
    const clamp = typeof clampFn === "function" ? clampFn : (v) => v;
    return snapPlotOption(clamp(value), optionValues, fallback);
  };

  const normalizePlotLineWidth = (value, clampFn, optionValues, fallback = 1) => {
    const clamp = typeof clampFn === "function" ? clampFn : (v) => v;
    return snapPlotOption(clamp(value), optionValues, fallback);
  };

  const syncPlotStyleControls = (plotPrefs, plotFontSelects, plotLineSelects) => {
    const fontValue = String(plotPrefs?.fontScale ?? "");
    const lineValue = String(plotPrefs?.lineWidth ?? "");
    (Array.isArray(plotFontSelects) ? plotFontSelects : []).forEach((select) => {
      if (select && select.value !== fontValue) {
        select.value = fontValue;
      }
    });
    (Array.isArray(plotLineSelects) ? plotLineSelects : []).forEach((select) => {
      if (select && select.value !== lineValue) {
        select.value = lineValue;
      }
    });
  };

  const syncPlotDisplayControls = (plotPrefs, plotIPDisplaySelects) => {
    const ipValue = String(plotPrefs?.ipDisplay ?? "");
    (Array.isArray(plotIPDisplaySelects) ? plotIPDisplaySelects : []).forEach((select) => {
      if (select && select.value !== ipValue) {
        select.value = ipValue;
      }
    });
  };

  const createPlotStyleControls = (input = {}) => {
    const plotFontOptions = Array.isArray(input.plotFontOptions) ? input.plotFontOptions : [];
    const plotLineOptions = Array.isArray(input.plotLineOptions) ? input.plotLineOptions : [];
    const plotIPDisplayModeOptions = Array.isArray(input.plotIPDisplayModeOptions) ? input.plotIPDisplayModeOptions : [];
    const plotPrefs = input.plotPrefs && typeof input.plotPrefs === "object" ? input.plotPrefs : {};
    const plotFontSelects = Array.isArray(input.plotFontSelects) ? input.plotFontSelects : [];
    const plotLineSelects = Array.isArray(input.plotLineSelects) ? input.plotLineSelects : [];
    const plotIPDisplaySelects = Array.isArray(input.plotIPDisplaySelects) ? input.plotIPDisplaySelects : [];
    const setPlotFontScale = typeof input.setPlotFontScale === "function" ? input.setPlotFontScale : () => {};
    const setPlotLineWidth = typeof input.setPlotLineWidth === "function" ? input.setPlotLineWidth : () => {};
    const setPlotIPDisplay = typeof input.setPlotIPDisplay === "function" ? input.setPlotIPDisplay : () => {};
    const syncPlotStyleControlsFn = typeof input.syncPlotStyleControls === "function"
      ? input.syncPlotStyleControls
      : () => {};
    const syncPlotDisplayControlsFn = typeof input.syncPlotDisplayControls === "function"
      ? input.syncPlotDisplayControls
      : () => {};

    const fontLabel = document.createElement("label");
    const fontSelect = document.createElement("select");
    fontSelect.dataset.plotFontScale = "1";
    plotFontOptions.forEach((option) => {
      const item = document.createElement("option");
      item.value = String(option.value);
      item.textContent = option.label;
      fontSelect.append(item);
    });
    fontSelect.addEventListener("change", () => {
      setPlotFontScale(Number(fontSelect.value));
    });
    plotFontSelects.push(fontSelect);
    fontLabel.append("Font size: ", fontSelect);

    const lineLabel = document.createElement("label");
    const lineSelect = document.createElement("select");
    lineSelect.dataset.plotLineWidth = "1";
    plotLineOptions.forEach((option) => {
      const item = document.createElement("option");
      item.value = String(option.value);
      item.textContent = option.label;
      lineSelect.append(item);
    });
    lineSelect.addEventListener("change", () => {
      setPlotLineWidth(Number(lineSelect.value));
    });
    plotLineSelects.push(lineSelect);
    lineLabel.append("Line width: ", lineSelect);

    const ipDisplayLabel = document.createElement("label");
    const ipDisplaySelect = document.createElement("select");
    ipDisplaySelect.dataset.plotIpDisplay = "1";
    plotIPDisplayModeOptions.forEach((option) => {
      const item = document.createElement("option");
      item.value = option.value;
      item.textContent = option.label;
      ipDisplaySelect.append(item);
    });
    ipDisplaySelect.value = String(plotPrefs.ipDisplay ?? "");
    ipDisplaySelect.addEventListener("change", () => {
      setPlotIPDisplay(ipDisplaySelect.value);
    });
    plotIPDisplaySelects.push(ipDisplaySelect);
    ipDisplayLabel.append("I/P traces: ", ipDisplaySelect);

    syncPlotStyleControlsFn();
    syncPlotDisplayControlsFn();
    return { fontLabel, lineLabel, ipDisplayLabel };
  };

  const createPlotSettingsPopover = (input = {}) => {
    const kind = String(input.kind ?? "");
    const contentNodes = Array.isArray(input.contentNodes) ? input.contentNodes : [];
    const applyCustomTooltip = typeof input.applyCustomTooltip === "function" ? input.applyCustomTooltip : () => {};
    const positionPopoverInViewport = typeof input.positionPopoverInViewport === "function"
      ? input.positionPopoverInViewport
      : () => {};

    const wrap = document.createElement("div");
    wrap.className = "plot-settings";
    const button = document.createElement("button");
    button.type = "button";
    button.className = "secondary icon-button plot-settings-button";
    button.dataset.plotSettingsToggle = kind;
    applyCustomTooltip(button, "Plot Settings");
    button.setAttribute("aria-haspopup", "true");
    button.setAttribute("aria-expanded", "false");
    button.textContent = "⚙";
    const popover = document.createElement("div");
    popover.className = "plot-settings-popover";
    popover.dataset.plotSettingsPopover = kind;
    popover.hidden = true;
    contentNodes.forEach((node) => {
      popover.append(node);
    });
    const close = () => {
      if (popover.hidden) {
        return;
      }
      popover.hidden = true;
      button.setAttribute("aria-expanded", "false");
    };
    const reposition = () => {
      if (popover.hidden) {
        return;
      }
      positionPopoverInViewport(popover, button.getBoundingClientRect(), {
        align: "start"
      });
    };
    const open = () => {
      if (!popover.hidden) {
        return;
      }
      popover.hidden = false;
      button.setAttribute("aria-expanded", "true");
      reposition();
      requestAnimationFrame(reposition);
    };
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (popover.hidden) {
        open();
      } else {
        close();
      }
    });
    document.addEventListener("pointerdown", (event) => {
      if (popover.hidden) {
        return;
      }
      const target = event.target;
      if (!(target instanceof Node)) {
        return;
      }
      if (wrap.contains(target)) {
        return;
      }
      close();
    });
    document.addEventListener("keydown", (event) => {
      if (event.key !== "Escape" || popover.hidden) {
        return;
      }
      close();
    });
    window.addEventListener("resize", reposition);
    window.addEventListener("scroll", reposition, true);
    wrap.append(button, popover);
    return { wrap, button, popover };
  };

  const createPlotCanvasBundle = (input = {}) => {
    const plotKind = String(input.plotKind ?? "");
    const tooltipKind = String(input.tooltipKind ?? plotKind);
    const width = Number.isFinite(Number(input.width)) ? Number(input.width) : 720;
    const height = Number.isFinite(Number(input.height)) ? Number(input.height) : 320;

    const canvas = document.createElement("canvas");
    canvas.className = "plot-canvas";
    canvas.width = width;
    canvas.height = height;
    canvas.dataset.plotCanvas = plotKind;

    const wrap = document.createElement("div");
    wrap.className = "plot-wrap";
    const overlay = document.createElement("canvas");
    overlay.className = "plot-overlay";
    overlay.dataset.plotOverlay = plotKind;
    const tooltip = document.createElement("div");
    tooltip.className = "plot-tooltip";
    tooltip.dataset.plotTooltip = tooltipKind;
    wrap.append(canvas, overlay, tooltip);
    return { canvas, wrap, overlay, tooltip };
  };

  const createSinglePlotSection = (input = {}) => {
    const options = input.options && typeof input.options === "object" ? input.options : {};
    const setShowGrid = typeof input.setShowGrid === "function" ? input.setShowGrid : () => {};
    const queueAutosave = typeof input.queueAutosave === "function" ? input.queueAutosave : () => {};
    const dedupeSignalList = typeof input.dedupeSignalList === "function" ? input.dedupeSignalList : (values) => values;
    const getSelectedSignals = typeof input.getSelectedSignals === "function"
      ? input.getSelectedSignals
      : () => [];
    const setActiveTab = typeof input.setActiveTab === "function" ? input.setActiveTab : () => {};
    const createPlotStyleControlsFn = typeof input.createPlotStyleControls === "function"
      ? input.createPlotStyleControls
      : () => ({
          fontLabel: document.createElement("label"),
          lineLabel: document.createElement("label"),
          ipDisplayLabel: document.createElement("label")
        });
    const createPlotSettingsPopoverFn = typeof input.createPlotSettingsPopover === "function"
      ? input.createPlotSettingsPopover
      : (kind, contentNodes) => createPlotSettingsPopover({ kind, contentNodes });
    const createPlotCanvasBundleFn = typeof input.createPlotCanvasBundle === "function"
      ? input.createPlotCanvasBundle
      : (plotKind, tooltipKind, width, height) => createPlotCanvasBundle({ plotKind, tooltipKind, width, height });
    const applyHelpEntry = typeof input.applyHelpEntry === "function" ? input.applyHelpEntry : () => {};

    const section = document.createElement("div");
    section.className = "section";
    const meta = document.createElement("div");
    meta.className = `results-meta ${String(options.metaClass ?? "")}`.trim();

    const controls = document.createElement("div");
    controls.className = "controls analysis-controls";

    const gridLabel = document.createElement("label");
    gridLabel.className = "analysis-grid-toggle";
    const gridCheck = document.createElement("input");
    gridCheck.type = "checkbox";
    gridCheck.checked = Boolean(input.showGrid);
    gridCheck.addEventListener("change", () => {
      setShowGrid(gridCheck.checked);
      if (typeof options.onGridChange === "function") {
        options.onGridChange();
      }
      queueAutosave();
    });
    gridLabel.append(gridCheck, " Show Grid");

    const signalSelect = document.createElement("select");
    signalSelect.className = "sample-select analysis-signal-select";
    signalSelect.multiple = true;
    signalSelect.size = 4;
    signalSelect.dataset.signalSelect = String(options.kind ?? "");
    signalSelect.hidden = true;
    signalSelect.addEventListener("change", () => {
      const selected = dedupeSignalList(getSelectedSignals(signalSelect));
      if (!selected.length) {
        return;
      }
      setActiveTab(options.kind);
      if (typeof options.onSignalChange === "function") {
        options.onSignalChange(selected);
      }
    });

    const signalCheckboxList = document.createElement("div");
    signalCheckboxList.className = "signal-checkbox-list";
    signalCheckboxList.dataset.signalCheckboxList = String(options.kind ?? "");
    signalCheckboxList.addEventListener("change", (event) => {
      if (event.target?.type !== "checkbox") {
        return;
      }
      const checkbox = event.target;
      const option = Array.from(signalSelect.options).find((entry) => entry.value === checkbox.value);
      if (option) {
        option.selected = checkbox.checked;
        signalSelect.dispatchEvent(new Event("change"));
      }
    });

    const plotStyle = createPlotStyleControlsFn();
    const settingsContentNodes = [
      gridLabel,
      plotStyle.fontLabel,
      plotStyle.lineLabel
    ];
    if (options.includeDisplayModeControls) {
      settingsContentNodes.push(plotStyle.ipDisplayLabel);
    }
    const plotSettings = createPlotSettingsPopoverFn(options.kind, settingsContentNodes);

    const exportButton = document.createElement("button");
    exportButton.className = "secondary";
    exportButton.textContent = "Export PNG";
    exportButton.dataset.exportPlot = String(options.kind ?? "");
    const exportCsvButton = document.createElement("button");
    exportCsvButton.className = "secondary";
    exportCsvButton.textContent = "Export CSV";
    exportCsvButton.dataset.exportCsv = String(options.kind ?? "");
    applyHelpEntry(exportCsvButton, options.exportCsvHelp);

    controls.append(
      signalCheckboxList,
      signalSelect,
      plotSettings.wrap,
      exportButton,
      exportCsvButton
    );

    const plotBundle = createPlotCanvasBundleFn(options.kind);
    const currentPlotBundle = options.includeDisplayModeControls
      ? createPlotCanvasBundleFn(`${options.kind}-current`, options.kind)
      : null;
    const powerPlotBundle = options.includeDisplayModeControls
      ? createPlotCanvasBundleFn(`${options.kind}-power`, options.kind)
      : null;
    if (currentPlotBundle) {
      currentPlotBundle.wrap.hidden = true;
    }
    if (powerPlotBundle) {
      powerPlotBundle.wrap.hidden = true;
    }

    const sectionChildren = [controls, meta, plotBundle.wrap];
    if (currentPlotBundle) {
      sectionChildren.push(currentPlotBundle.wrap);
    }
    if (powerPlotBundle) {
      sectionChildren.push(powerPlotBundle.wrap);
    }
    section.append(...sectionChildren);

    return {
      section,
      meta,
      gridCheck,
      signalSelect,
      exportButton,
      exportCsvButton,
      canvas: plotBundle.canvas,
      wrap: plotBundle.wrap,
      overlay: plotBundle.overlay,
      tooltip: plotBundle.tooltip,
      currentCanvas: currentPlotBundle?.canvas ?? null,
      currentWrap: currentPlotBundle?.wrap ?? null,
      currentOverlay: currentPlotBundle?.overlay ?? null,
      currentTooltip: currentPlotBundle?.tooltip ?? null,
      powerCanvas: powerPlotBundle?.canvas ?? null,
      powerWrap: powerPlotBundle?.wrap ?? null,
      powerOverlay: powerPlotBundle?.overlay ?? null,
      powerTooltip: powerPlotBundle?.tooltip ?? null
    };
  };

  if (typeof self !== "undefined") {
    self.SpjutSimUIPlotControls = {
      snapPlotOption,
      normalizePlotFontScale,
      normalizePlotLineWidth,
      syncPlotStyleControls,
      syncPlotDisplayControls,
      createPlotStyleControls,
      createPlotSettingsPopover,
      createPlotCanvasBundle,
      createSinglePlotSection
    };
  }
})();
