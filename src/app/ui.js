/** @typedef {Record<string, number[]>} TraceMap */
/** @typedef {{ status: "idle" | "loading" | "ready" | "running" | "error", log: string[], netlist: string, error?: string, opResults?: { plot?: string, nodes: { name: string, value: string, raw?: number | null }[], currents: { name: string, value: string, raw?: number | null }[] }, dcResults?: { x: number[], traces: TraceMap, signals?: string[], selected?: string[] }, tranResults?: { x: number[], traces: TraceMap, signals?: string[], selected?: string[] }, acResults?: { freq: number[], magnitude: TraceMap, phase: TraceMap, signals?: string[], selected?: string[] } }} AppState */
/** @typedef {() => void} VoidHandler */
/** @typedef {(netlist: string, signals?: string[]) => void} RunOpHandler */
/** @typedef {(netlist: string, signals?: string[]) => void} RunHandler */
/** @typedef {{ onInit: VoidHandler, onRun: RunOpHandler, onRunDc: RunHandler, onRunTran: RunHandler, onRunAc: RunHandler, onReset: VoidHandler }} UIActions */
/** @typedef {{ setStatus: (status: AppState["status"]) => void, setError: (message?: string) => void, setLog: (lines: string[]) => void, appendLog: (line: string) => void, getNetlist: () => string, setNetlist: (netlist: string) => void, setOpResults: (results?: AppState["opResults"]) => void, setDcResults: (results?: AppState["dcResults"]) => void, setTranResults: (results?: AppState["tranResults"]) => void, setAcResults: (results?: AppState["acResults"]) => void }} UIHandle */
const getUIDomainsApi = () => (typeof self !== "undefined" ? (self.SpjutSimUIDomains ?? null) : null);
const requireUIDomain = (name) => {
  const domains = getUIDomainsApi();
  const domain = domains?.[name];
  if (!domain || typeof domain !== "object") {
    throw new Error(`UI domain '${name}' missing. Check src/app/ui/domains/${name}.js load order.`);
  }
  return domain;
};
const getUIInlineEditorPanelApi = () => (typeof self !== "undefined" ? (self.SpjutSimUIInlineEditorPanel ?? null) : null);
const requireUIInlineEditorPanelModule = () => {
  const api = getUIInlineEditorPanelApi();
  if (!api || typeof api.createInlineEditorPanel !== "function") {
    throw new Error("UI inline-editor panel module missing. Check src/app/ui/inline-editor-panel.js load order.");
  }
  return api;
};
const getUIInlineEditorPositioningApi = () => (typeof self !== "undefined" ? (self.SpjutSimUIInlineEditorPositioning ?? null) : null);
const requireUIInlineEditorPositioningModule = () => {
  const api = getUIInlineEditorPositioningApi();
  if (!api
    || typeof api.getComponentAnchor !== "function"
    || typeof api.toClientPoint !== "function"
    || typeof api.resolveInlineEditorPosition !== "function") {
    throw new Error("UI inline-editor positioning module missing. Check src/app/ui/inline-editor-positioning.js load order.");
  }
  return api;
};
const getUIInlineEditorInteractionsApi = () => (typeof self !== "undefined" ? (self.SpjutSimUIInlineEditorInteractions ?? null) : null);
const requireUIInlineEditorInteractionsModule = () => {
  const api = getUIInlineEditorInteractionsApi();
  if (!api || typeof api.bindInlineEditorCloseInteractions !== "function") {
    throw new Error("UI inline-editor interactions module missing. Check src/app/ui/inline-editor-interactions.js load order.");
  }
  return api;
};
const getUIInlineEditorBindingsApi = () => (typeof self !== "undefined" ? (self.SpjutSimUIInlineEditorBindings ?? null) : null);
const requireUIInlineEditorBindingsModule = () => {
  const api = getUIInlineEditorBindingsApi();
  if (!api
    || typeof api.setInlineSwitchActiveThrowState !== "function"
    || typeof api.bindInlineNameInput !== "function"
    || typeof api.bindInlineValueInput !== "function"
    || typeof api.bindInlineSwitchInputs !== "function"
    || typeof api.bindInlineProbeTypeSelect !== "function"
    || typeof api.bindInlineSelectInput !== "function"
    || typeof api.bindInlineToggleInput !== "function"
    || typeof api.bindInlineBoxStyleInputs !== "function") {
    throw new Error("UI inline-editor bindings module missing. Check src/app/ui/inline-editor-bindings.js load order.");
  }
  return api;
};
const getUIInlineEditorLifecycleApi = () => (typeof self !== "undefined" ? (self.SpjutSimUIInlineEditorLifecycle ?? null) : null);
const requireUIInlineEditorLifecycleModule = () => {
  const api = getUIInlineEditorLifecycleApi();
  if (!api
    || typeof api.closeInlineEditorPanel !== "function"
    || typeof api.prepareInlineEditorPanelForOpen !== "function"
    || typeof api.resolveActiveSwitchToggle !== "function"
    || typeof api.applyInlineEditorOpenFocus !== "function") {
    throw new Error("UI inline-editor lifecycle module missing. Check src/app/ui/inline-editor-lifecycle.js load order.");
  }
  return api;
};
const getUIInlineEditorWorkflowApi = () => (typeof self !== "undefined" ? (self.SpjutSimUIInlineEditorWorkflow ?? null) : null);
const requireUIInlineEditorWorkflowModule = () => {
  const api = getUIInlineEditorWorkflowApi();
  if (!api
    || typeof api.createGetModelComponent !== "function"
    || typeof api.applyValueFieldMetaToElements !== "function"
    || typeof api.updateSchematicPropsForInlineEditor !== "function"
    || typeof api.createInlineNetColorPickHandler !== "function"
    || typeof api.createInlinePatchHelpers !== "function"
    || typeof api.commitInlineSwitchStateForEditor !== "function"
    || typeof api.syncInlineEditorFromComponent !== "function"
    || typeof api.openInlineEditorForComponent !== "function") {
    throw new Error("UI inline-editor workflow module missing. Check src/app/ui/inline-editor-workflow.js load order.");
  }
  return api;
};
const getUIRunSignatureApi = () => (typeof self !== "undefined" ? (self.SpjutSimUIRunSignature ?? null) : null);
const requireUIRunSignatureModule = () => {
  const api = getUIRunSignatureApi();
  if (!api
    || typeof api.stripEndDirective !== "function"
    || typeof api.normalizeNetlistForSignature !== "function"
    || typeof api.computeNetlistSignature !== "function"
    || typeof api.normalizeRunRequestSignalsForSignature !== "function"
    || typeof api.computeRunRequestSignature !== "function"
    || typeof api.rememberRunRequestSignature !== "function"
    || typeof api.hasRunRequestChangedSinceLastRequest !== "function"
    || typeof api.applySourceOverride !== "function") {
    throw new Error("UI run-signature module missing. Check src/app/ui/run-signature.js load order.");
  }
  return api;
};
const getUIToolsUIApi = () => (typeof self !== "undefined" ? (self.SpjutSimUIToolsUI ?? null) : null);
const requireUIToolsUIModule = () => {
  const api = getUIToolsUIApi();
  if (!api
    || typeof api.createTooltipController !== "function"
    || typeof api.positionPopoverInViewport !== "function"
    || typeof api.createToolIcon !== "function"
    || typeof api.createActionIcon !== "function"
    || typeof api.normalizeToolbarElementDefinition !== "function"
    || typeof api.buildToolbarElementDefinitions !== "function"
    || typeof api.buildToolHelp !== "function") {
    throw new Error("UI tools-ui module missing. Check src/app/ui/tools-ui.js load order.");
  }
  return api;
};
const getUIHelpApi = () => (typeof self !== "undefined" ? (self.SpjutSimUIHelp ?? null) : null);
const requireUIHelpModule = () => {
  const api = getUIHelpApi();
  if (!api
    || typeof api.buildDefaultHelpEntries !== "function"
    || typeof api.buildConfigHelpMap !== "function"
    || typeof api.getConfigHelpEntry !== "function"
    || typeof api.createHelpInteractionController !== "function"
    || typeof api.applyHelpEntry !== "function") {
    throw new Error("UI help module missing. Check src/app/ui/help.js load order.");
  }
  return api;
};
const getUISimulationConfigApi = () => (typeof self !== "undefined" ? (self.SpjutSimUISimulationConfig ?? null) : null);
const requireUISimulationConfigModule = () => {
  const api = getUISimulationConfigApi();
  if (!api
    || typeof api.readAvailableSourceIds !== "function"
    || typeof api.syncSourceInputOptions !== "function"
    || typeof api.trimToken !== "function"
    || typeof api.buildSpiceFunction !== "function"
    || typeof api.buildPwlValue !== "function"
    || typeof api.buildTranSourceValue !== "function"
    || typeof api.updateTranWaveformVisibility !== "function"
    || typeof api.createConfigField !== "function"
    || typeof api.createSourceConfigField !== "function"
    || typeof api.createSimulationHeader !== "function"
    || typeof api.createConfigSections !== "function"
    || typeof api.createTranWaveGroup !== "function"
    || typeof api.createTranSourceModeField !== "function"
    || typeof api.createAcSweepField !== "function") {
    throw new Error("UI simulation-config module missing. Check src/app/ui/simulation-config.js load order.");
  }
  return api;
};
const getUIPlotControlsApi = () => (typeof self !== "undefined" ? (self.SpjutSimUIPlotControls ?? null) : null);
const requireUIPlotControlsModule = () => {
  const api = getUIPlotControlsApi();
  if (!api
    || typeof api.snapPlotOption !== "function"
    || typeof api.normalizePlotFontScale !== "function"
    || typeof api.normalizePlotLineWidth !== "function"
    || typeof api.syncPlotStyleControls !== "function"
    || typeof api.syncPlotDisplayControls !== "function"
    || typeof api.createPlotStyleControls !== "function"
    || typeof api.createPlotSettingsPopover !== "function"
    || typeof api.createPlotCanvasBundle !== "function"
    || typeof api.createSinglePlotSection !== "function") {
    throw new Error("UI plot-controls module missing. Check src/app/ui/plot-controls.js load order.");
  }
  return api;
};
const getUIResultsTableApi = () => (typeof self !== "undefined" ? (self.SpjutSimUIResultsTable ?? null) : null);
const requireUIResultsTableModule = () => {
  const api = getUIResultsTableApi();
  if (!api
    || typeof api.resolveOpResultDisplayName !== "function"
    || typeof api.formatRows !== "function"
    || typeof api.getResultRowSignalTokens !== "function"
    || typeof api.applyResultsSignalHighlights !== "function"
    || typeof api.bindSignalResultRow !== "function"
    || typeof api.renderTable !== "function") {
    throw new Error("UI results-table module missing. Check src/app/ui/results-table.js load order.");
  }
  return api;
};
const getUINetlistPanelApi = () => (typeof self !== "undefined" ? (self.SpjutSimUINetlistPanel ?? null) : null);
const requireUINetlistPanelModule = () => {
  const api = getUINetlistPanelApi();
  if (!api
    || typeof api.createSimulationNetlistPanel !== "function"
    || typeof api.buildNetlistSelectionLineIndex !== "function"
    || typeof api.getCachedNetlistSelectionLineIndex !== "function"
    || typeof api.resolveNetlistPreviewSelectionHighlights !== "function"
    || typeof api.syncNetlistPreviewHighlightsFromSelection !== "function"
    || typeof api.applyNetlistPreviewHighlights !== "function") {
    throw new Error("UI netlist-panel module missing. Check src/app/ui/netlist-panel.js load order.");
  }
  return api;
};

const uiToolsDomain = requireUIDomain("tools");
const uiInlineEditorDomain = requireUIDomain("inlineEditor");
const uiMeasurementsDomain = requireUIDomain("measurements");
const uiResultsPaneDomain = requireUIDomain("resultsPane");
const uiPlotDomain = requireUIDomain("plot");
const uiInlineEditorPanelModule = requireUIInlineEditorPanelModule();
const uiInlineEditorPositioningModule = requireUIInlineEditorPositioningModule();
const uiInlineEditorInteractionsModule = requireUIInlineEditorInteractionsModule();
const uiInlineEditorBindingsModule = requireUIInlineEditorBindingsModule();
const uiInlineEditorLifecycleModule = requireUIInlineEditorLifecycleModule();
const uiInlineEditorWorkflowModule = requireUIInlineEditorWorkflowModule();
const uiRunSignatureModule = requireUIRunSignatureModule();
const uiToolsUIModule = requireUIToolsUIModule();
const uiHelpModule = requireUIHelpModule();
const uiSimulationConfigModule = requireUISimulationConfigModule();
const uiPlotControlsModule = requireUIPlotControlsModule();
const uiResultsTableModule = requireUIResultsTableModule();
const uiNetlistPanelModule = requireUINetlistPanelModule();

let showGrid = uiPlotDomain.getDefaultShowGrid();
const ALLOWED_GRID_SIZES = Object.freeze(
  Array.isArray(uiToolsDomain.ALLOWED_GRID_SIZES) ? uiToolsDomain.ALLOWED_GRID_SIZES.slice() : [5, 10, 20]
);
const DEFAULT_GRID_SIZE = Number.isFinite(Number(uiToolsDomain.DEFAULT_GRID_SIZE))
  ? Number(uiToolsDomain.DEFAULT_GRID_SIZE)
  : 10;

const simulationKinds = [
  { id: "op", label: "Operating Point (.op)" },
  { id: "dc", label: "DC Sweep (.dc)" },
  { id: "tran", label: "Transient (.tran)" },
  { id: "ac", label: "AC Sweep (.ac)" }
];
const simulationKindIds = new Set(simulationKinds.map((entry) => entry.id));
const SOURCE_COMPONENT_TYPES = new Set(["V", "I"]);
const RESULTS_PANE_MODES = new Set(
  Array.isArray(uiResultsPaneDomain.RESULTS_PANE_MODES)
    ? uiResultsPaneDomain.RESULTS_PANE_MODES
    : ["hidden", "split", "expanded", "empty"]
);
const DEFAULT_RESULTS_PANE_MODE = String(uiResultsPaneDomain.DEFAULT_RESULTS_PANE_MODE ?? "hidden");
const DEFAULT_RESULTS_PANE_SPLIT_RATIO = Number.isFinite(Number(uiResultsPaneDomain.DEFAULT_RESULTS_PANE_SPLIT_RATIO))
  ? Number(uiResultsPaneDomain.DEFAULT_RESULTS_PANE_SPLIT_RATIO)
  : 0.5;
const MIN_RESULTS_PANE_SPLIT_RATIO = Number.isFinite(Number(uiResultsPaneDomain.MIN_RESULTS_PANE_SPLIT_RATIO))
  ? Number(uiResultsPaneDomain.MIN_RESULTS_PANE_SPLIT_RATIO)
  : 0.25;
const MAX_RESULTS_PANE_SPLIT_RATIO = Number.isFinite(Number(uiResultsPaneDomain.MAX_RESULTS_PANE_SPLIT_RATIO))
  ? Number(uiResultsPaneDomain.MAX_RESULTS_PANE_SPLIT_RATIO)
  : 0.75;
const RESULTS_PANE_STACK_WIDTH_THRESHOLD = Number.isFinite(Number(uiResultsPaneDomain.RESULTS_PANE_STACK_WIDTH_THRESHOLD))
  ? Number(uiResultsPaneDomain.RESULTS_PANE_STACK_WIDTH_THRESHOLD)
  : 900;
const RESULTS_PANE_COMPACT_WIDTH_THRESHOLD = Number.isFinite(Number(uiResultsPaneDomain.RESULTS_PANE_COMPACT_WIDTH_THRESHOLD))
  ? Number(uiResultsPaneDomain.RESULTS_PANE_COMPACT_WIDTH_THRESHOLD)
  : 600;
const DEFAULT_AUTO_SWITCH_TO_SELECT_ON_PLACE = true;
const DEFAULT_AUTO_SWITCH_TO_SELECT_ON_WIRE = false;
const DEFAULT_SCHEMATIC_TEXT_STYLE = Object.freeze({
  font: "Segoe UI",
  size: 12,
  bold: false,
  italic: false
});

const createSimulationConfig = () => ({
  activeKind: "op",
  op: {},
  dc: { source: "V1", start: "0", stop: "10", step: "1" },
  tran: {
    source: "V1",
    sourceMode: "pulse",
    sourceValue: "pulse(0 5 1m 1u 1u 5m 10m)",
    dcValue: "5",
    pulseLow: "0",
    pulseHigh: "5",
    pulseDelay: "1m",
    pulseRise: "1u",
    pulseFall: "1u",
    pulseWidth: "5m",
    pulsePeriod: "10m",
    sineOffset: "0",
    sineAmplitude: "1",
    sineFreq: "1k",
    sineDelay: "",
    sineDamping: "",
    sinePhase: "",
    pwlPoints: "0 0\n1m 5\n2m 0",
    customValue: "",
    start: "0",
    stop: "10m",
    step: "0.1m",
    maxStep: ""
  },
  ac: { source: "V1", sourceValue: "", sweep: "dec", points: "10", start: "1", stop: "100k" },
  save: { signals: [] }
});

let simulationConfig = createSimulationConfig();
let latestSchematicCompile = null;
const persistenceApi = typeof self !== "undefined" ? self.SpjutSimPersistence : null;

const ABOUT_DIALOG_CONTENT = Object.freeze([
  {
    kind: "text",
    text: "SpjutSim Circuits is a web-based electrical circuit schematic editor and simulator, aimed at students. This is an early version, so expect bugs, rough edges, and missing features."
  },
  {
    kind: "text",
    text: "I'm trying to make this program good, but it may be bad. Verify results independently; you're responsible for your designs and outcomes. Provided \"AS IS\" without warranties; no liability for damages. You use it at your own risk. Abandon hope, all ye who enter here."
  },
  {
    kind: "link-line",
    prefix: "",
    linkText: "Copyright (c) 2026 Jakob Spjut.",
    url: "https://github.com/Brinkwatertoad/SpjutSim-Circuits-public/blob/main/LICENSE.md",
    suffix: " All rights reserved."
  },
  {
    kind: "text",
    text: "No license is granted to use, copy, modify, or distribute this repository's contents, except as necessary to access and use the accompanying website via a web browser."
  },
  {
    kind: "link-line",
    prefix: "Circuit simulation uses ngspice, which is available under the ",
    linkText: "BSD-3-clause license",
    url: "https://github.com/Brinkwatertoad/SpjutSim-Circuits-public/blob/main/THIRD_PARTY_NOTICES.md",
    suffix: "."
  }
]);

const HOTKEY_SHORTCUTS = Object.freeze({
  open: "Ctrl+O",
  save: "Ctrl+S",
  saveAs: "Ctrl+Shift+S",
  settings: "Ctrl+,",
  toggleHelp: "H",
  runSimulation: "F5",
  edit: "Ctrl+E",
  selectAll: "Ctrl+A",
  delete: "Del",
  copy: "Ctrl+C",
  cut: "Ctrl+X",
  paste: "Ctrl+V",
  rotateCw: "Space",
  rotateCcw: "Shift+Space",
  flipH: "X",
  flipV: "Y",
  undo: "Ctrl+Z",
  redo: "Ctrl+Y",
  redoAlt: "Ctrl+Shift+Z",
  escape: "Escape"
});

const setDialogOpen = (dialog, isOpen) => {
  if (!(dialog instanceof HTMLElement)) {
    return;
  }
  const shouldOpen = Boolean(isOpen);
  dialog.hidden = !shouldOpen;
  dialog.classList.toggle("hidden", !shouldOpen);
};

const buildAboutDialog = (container) => {
  const aboutDialog = document.createElement("div");
  aboutDialog.className = "modal-backdrop hidden";
  aboutDialog.dataset.aboutDialog = "1";
  aboutDialog.setAttribute("role", "dialog");
  aboutDialog.setAttribute("aria-modal", "true");
  aboutDialog.hidden = true;
  const aboutPanel = document.createElement("div");
  aboutPanel.className = "modal-dialog about-modal-dialog";
  aboutPanel.dataset.aboutPanel = "1";
  const aboutTitle = document.createElement("div");
  aboutTitle.className = "modal-title";
  aboutTitle.dataset.aboutTitle = "1";
  aboutTitle.textContent = "About SpjutSim Circuits";
  const aboutBody = document.createElement("div");
  aboutBody.className = "modal-body about-modal-body";
  aboutBody.dataset.aboutBody = "1";
  ABOUT_DIALOG_CONTENT.forEach((entry) => {
    const paragraph = document.createElement("p");
    if (entry.kind === "link-line") {
      if (entry.prefix) {
        paragraph.append(document.createTextNode(entry.prefix));
      }
      const link = document.createElement("a");
      link.href = entry.url;
      link.textContent = entry.linkText;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      paragraph.append(link);
      if (entry.suffix) {
        paragraph.append(document.createTextNode(entry.suffix));
      }
    } else {
      paragraph.textContent = entry.text;
    }
    aboutBody.appendChild(paragraph);
  });
  const aboutActions = document.createElement("div");
  aboutActions.className = "modal-actions";
  const aboutClose = document.createElement("button");
  aboutClose.type = "button";
  aboutClose.textContent = "Close";
  aboutClose.dataset.aboutClose = "1";
  aboutActions.append(aboutClose);
  aboutPanel.append(aboutTitle, aboutBody, aboutActions);
  aboutDialog.append(aboutPanel);
  container.appendChild(aboutDialog);

  const openAboutDialog = () => setDialogOpen(aboutDialog, true);
  const closeAboutDialog = () => setDialogOpen(aboutDialog, false);

  aboutDialog.addEventListener("click", (event) => {
    if (event.target === aboutDialog) {
      closeAboutDialog();
    }
  });
  aboutClose.addEventListener("click", closeAboutDialog);

  return { aboutDialog, openAboutDialog, closeAboutDialog };
};

const buildHotkeysDialog = (container, config = {}) => {
  const listHotkeys = typeof config.listHotkeys === "function" ? config.listHotkeys : () => [];
  const hotkeysDialog = document.createElement("div");
  hotkeysDialog.className = "modal-backdrop hidden";
  hotkeysDialog.dataset.hotkeysDialog = "1";
  hotkeysDialog.setAttribute("role", "dialog");
  hotkeysDialog.setAttribute("aria-modal", "true");
  hotkeysDialog.hidden = true;

  const hotkeysPanel = document.createElement("div");
  hotkeysPanel.className = "modal-dialog hotkeys-modal-dialog";
  hotkeysPanel.dataset.hotkeysPanel = "1";
  const hotkeysTitle = document.createElement("div");
  hotkeysTitle.className = "modal-title";
  hotkeysTitle.textContent = "Hotkeys";
  hotkeysTitle.dataset.hotkeysTitle = "1";
  const hotkeysBody = document.createElement("div");
  hotkeysBody.className = "modal-body hotkeys-modal-body";
  hotkeysBody.dataset.hotkeysBody = "1";
  const hotkeysActions = document.createElement("div");
  hotkeysActions.className = "modal-actions";
  const hotkeysClose = document.createElement("button");
  hotkeysClose.type = "button";
  hotkeysClose.textContent = "Close";
  hotkeysClose.dataset.hotkeysClose = "1";
  hotkeysActions.append(hotkeysClose);
  hotkeysPanel.append(hotkeysTitle, hotkeysBody, hotkeysActions);
  hotkeysDialog.append(hotkeysPanel);
  container.appendChild(hotkeysDialog);

  const renderHotkeys = () => {
    hotkeysBody.innerHTML = "";
    const sectionsRaw = listHotkeys();
    const sections = Array.isArray(sectionsRaw) ? sectionsRaw : [];
    let entryCount = 0;
    sections.forEach((section, index) => {
      const label = String(section?.label ?? "").trim();
      const entriesRaw = Array.isArray(section?.entries) ? section.entries : [];
      const entries = entriesRaw.filter((entry) => {
        const shortcut = String(entry?.shortcut ?? "").trim();
        const description = String(entry?.description ?? "").trim();
        return shortcut.length > 0 && description.length > 0;
      });
      if (!entries.length) {
        return;
      }
      const sectionEl = document.createElement("section");
      sectionEl.className = "hotkeys-section";
      sectionEl.dataset.hotkeysSection = String(section?.id ?? label ?? index);
      if (label) {
        const heading = document.createElement("h3");
        heading.className = "hotkeys-section-title";
        heading.textContent = label;
        sectionEl.appendChild(heading);
      }
      const listEl = document.createElement("div");
      listEl.className = "hotkeys-list";
      entries.forEach((entry) => {
        const shortcut = String(entry.shortcut).trim();
        const description = String(entry.description).trim();
        const row = document.createElement("div");
        row.className = "hotkeys-entry";
        row.dataset.hotkeysEntry = "1";
        row.dataset.hotkeysEntryShortcut = shortcut;
        row.dataset.hotkeysEntryDescription = description;
        const shortcutEl = document.createElement("kbd");
        shortcutEl.className = "hotkeys-entry-shortcut";
        shortcutEl.textContent = shortcut;
        const descriptionEl = document.createElement("span");
        descriptionEl.className = "hotkeys-entry-description";
        descriptionEl.textContent = description;
        row.append(shortcutEl, descriptionEl);
        listEl.appendChild(row);
        entryCount += 1;
      });
      sectionEl.appendChild(listEl);
      hotkeysBody.appendChild(sectionEl);
    });
    if (!entryCount) {
      const empty = document.createElement("p");
      empty.className = "hotkeys-empty";
      empty.textContent = "No hotkeys available.";
      hotkeysBody.appendChild(empty);
    }
  };

  const openHotkeysDialog = () => {
    renderHotkeys();
    setDialogOpen(hotkeysDialog, true);
  };
  const closeHotkeysDialog = () => setDialogOpen(hotkeysDialog, false);

  hotkeysDialog.addEventListener("click", (event) => {
    if (event.target === hotkeysDialog) {
      closeHotkeysDialog();
    }
  });
  hotkeysClose.addEventListener("click", closeHotkeysDialog);

  return { hotkeysDialog, openHotkeysDialog, closeHotkeysDialog };
};

const buildSettingsDialog = (container, config = {}) => {
  const getAutoSwitchToSelectAfterToolUse = typeof config.getAutoSwitchToSelectAfterToolUse === "function"
    ? config.getAutoSwitchToSelectAfterToolUse
    : () => false;
  const onAutoSwitchToSelectAfterToolUseChange = typeof config.onAutoSwitchToSelectAfterToolUseChange === "function"
    ? config.onAutoSwitchToSelectAfterToolUseChange
    : () => { };
  const getAutoSwitchToSelectAfterWireUse = typeof config.getAutoSwitchToSelectAfterWireUse === "function"
    ? config.getAutoSwitchToSelectAfterWireUse
    : () => false;
  const onAutoSwitchToSelectAfterWireUseChange = typeof config.onAutoSwitchToSelectAfterWireUseChange === "function"
    ? config.onAutoSwitchToSelectAfterWireUseChange
    : () => { };
  const getSchematicTextStyle = typeof config.getSchematicTextStyle === "function"
    ? config.getSchematicTextStyle
    : () => ({ ...DEFAULT_SCHEMATIC_TEXT_STYLE });
  const getSchematicTextFontOptions = typeof config.getSchematicTextFontOptions === "function"
    ? config.getSchematicTextFontOptions
    : () => [DEFAULT_SCHEMATIC_TEXT_STYLE.font];
  const onSchematicTextStyleChange = typeof config.onSchematicTextStyleChange === "function"
    ? config.onSchematicTextStyleChange
    : () => { };
  const getComponentDefaultSpecs = typeof config.getComponentDefaultSpecs === "function"
    ? config.getComponentDefaultSpecs
    : () => [];
  const getComponentDefaults = typeof config.getComponentDefaults === "function"
    ? config.getComponentDefaults
    : () => ({});
  const onComponentDefaultChange = typeof config.onComponentDefaultChange === "function"
    ? config.onComponentDefaultChange
    : () => { };
  const onApplyComponentDefaultsToExisting = typeof config.onApplyComponentDefaultsToExisting === "function"
    ? config.onApplyComponentDefaultsToExisting
    : () => { };
  const onResetSettings = typeof config.onResetSettings === "function"
    ? config.onResetSettings
    : () => { };
  const getToolDisplayDefaults = typeof config.getToolDisplayDefaults === "function"
    ? config.getToolDisplayDefaults
    : () => ({ resistorStyle: "zigzag", groundVariant: "earth", groundColor: null, probeColor: null });
  const getResistorDisplayTypeOptions = typeof config.getResistorDisplayTypeOptions === "function"
    ? config.getResistorDisplayTypeOptions
    : () => [];
  const getGroundDisplayTypeOptions = typeof config.getGroundDisplayTypeOptions === "function"
    ? config.getGroundDisplayTypeOptions
    : () => [];
  const getWireDefaultColor = typeof config.getWireDefaultColor === "function"
    ? config.getWireDefaultColor
    : () => null;
  const onToolDisplayDefaultChange = typeof config.onToolDisplayDefaultChange === "function"
    ? config.onToolDisplayDefaultChange
    : () => { };
  const onWireDefaultColorChange = typeof config.onWireDefaultColorChange === "function"
    ? config.onWireDefaultColorChange
    : () => { };
  const parseSwitchComponentDefaultValue = typeof config.parseSwitchComponentDefaultValue === "function"
    ? config.parseSwitchComponentDefaultValue
    : () => ({ ron: "0", roff: "" });
  const isProbeComponentType = typeof config.isProbeComponentType === "function"
    ? config.isProbeComponentType
    : () => false;
  const onResetComponentTypeDefaults = typeof config.onResetComponentTypeDefaults === "function"
    ? config.onResetComponentTypeDefaults
    : () => { };
  const createNetColorPicker = typeof config.createNetColorPicker === "function"
    ? config.createNetColorPicker
    : null;
  const settingsDialog = document.createElement("div");
  settingsDialog.className = "modal-backdrop hidden";
  settingsDialog.dataset.settingsDialog = "1";
  settingsDialog.dataset.settingsScopeType = "";
  settingsDialog.setAttribute("role", "dialog");
  settingsDialog.setAttribute("aria-modal", "true");
  settingsDialog.hidden = true;
  const settingsPanel = document.createElement("div");
  settingsPanel.className = "modal-dialog settings-modal-dialog";
  settingsPanel.dataset.settingsPanel = "1";
  const settingsTitle = document.createElement("div");
  settingsTitle.className = "modal-title";
  settingsTitle.dataset.settingsTitle = "1";
  settingsTitle.textContent = "Settings";
  const settingsBody = document.createElement("div");
  settingsBody.className = "modal-body settings-modal-body";
  settingsBody.dataset.settingsBody = "1";
  const autoSwitchToolUseRow = document.createElement("label");
  autoSwitchToolUseRow.className = "modal-field";
  const autoSwitchToolUseToggle = document.createElement("input");
  autoSwitchToolUseToggle.type = "checkbox";
  autoSwitchToolUseToggle.dataset.settingsSetting = "autoswitch-select-tool-use";
  const autoSwitchToolUseLabel = document.createElement("span");
  autoSwitchToolUseLabel.textContent = "Autoswitch to Select after tool use";
  autoSwitchToolUseRow.append(autoSwitchToolUseToggle, autoSwitchToolUseLabel);
  const autoSwitchWireUseRow = document.createElement("label");
  autoSwitchWireUseRow.className = "modal-field";
  const autoSwitchWireUseToggle = document.createElement("input");
  autoSwitchWireUseToggle.type = "checkbox";
  autoSwitchWireUseToggle.dataset.settingsSetting = "autoswitch-select-wire-use";
  const autoSwitchWireUseLabel = document.createElement("span");
  autoSwitchWireUseLabel.textContent = "Autoswitch to Select after Wire use";
  autoSwitchWireUseRow.append(autoSwitchWireUseToggle, autoSwitchWireUseLabel);
  const schematicTextFontRow = document.createElement("label");
  schematicTextFontRow.className = "modal-field";
  const schematicTextFontLabel = document.createElement("span");
  schematicTextFontLabel.textContent = "Schematic text font";
  const schematicTextFontSelect = document.createElement("select");
  schematicTextFontSelect.dataset.settingsSetting = "schematic-text-font";
  const textFontOptionsRaw = getSchematicTextFontOptions();
  const textFontOptions = Array.isArray(textFontOptionsRaw)
    ? textFontOptionsRaw
    : [];
  textFontOptions.forEach((entry) => {
    const fontName = String(entry ?? "").trim();
    if (!fontName) {
      return;
    }
    const option = document.createElement("option");
    option.value = fontName;
    option.textContent = fontName;
    schematicTextFontSelect.appendChild(option);
  });
  if (!schematicTextFontSelect.options.length) {
    const fallbackOption = document.createElement("option");
    fallbackOption.value = DEFAULT_SCHEMATIC_TEXT_STYLE.font;
    fallbackOption.textContent = DEFAULT_SCHEMATIC_TEXT_STYLE.font;
    schematicTextFontSelect.appendChild(fallbackOption);
  }
  schematicTextFontRow.append(schematicTextFontLabel, schematicTextFontSelect);
  const schematicTextSizeRow = document.createElement("label");
  schematicTextSizeRow.className = "modal-field";
  const schematicTextSizeLabel = document.createElement("span");
  schematicTextSizeLabel.textContent = "Schematic text size";
  const schematicTextSizeInput = document.createElement("input");
  schematicTextSizeInput.type = "number";
  schematicTextSizeInput.min = "8";
  schematicTextSizeInput.max = "72";
  schematicTextSizeInput.step = "1";
  schematicTextSizeInput.dataset.settingsSetting = "schematic-text-size";
  schematicTextSizeRow.append(schematicTextSizeLabel, schematicTextSizeInput);
  const schematicTextBoldRow = document.createElement("label");
  schematicTextBoldRow.className = "modal-field";
  const schematicTextBoldToggle = document.createElement("input");
  schematicTextBoldToggle.type = "checkbox";
  schematicTextBoldToggle.dataset.settingsSetting = "schematic-text-bold";
  const schematicTextBoldLabel = document.createElement("span");
  schematicTextBoldLabel.textContent = "Schematic text bold";
  schematicTextBoldRow.append(schematicTextBoldToggle, schematicTextBoldLabel);
  const schematicTextItalicRow = document.createElement("label");
  schematicTextItalicRow.className = "modal-field";
  const schematicTextItalicToggle = document.createElement("input");
  schematicTextItalicToggle.type = "checkbox";
  schematicTextItalicToggle.dataset.settingsSetting = "schematic-text-italic";
  const schematicTextItalicLabel = document.createElement("span");
  schematicTextItalicLabel.textContent = "Schematic text italic";
  schematicTextItalicRow.append(schematicTextItalicToggle, schematicTextItalicLabel);
  const componentDefaultSpecsRaw = getComponentDefaultSpecs();
  const componentDefaultSpecs = Array.isArray(componentDefaultSpecsRaw)
    ? componentDefaultSpecsRaw
      .map((entry) => ({
        type: String(entry?.type ?? "").trim().toUpperCase(),
        label: String(entry?.label ?? "").trim(),
        valueLabel: String(entry?.valueLabel ?? "").trim(),
        unit: String(entry?.unit ?? "").trim(),
        valueControl: String(entry?.valueControl ?? "").trim().toLowerCase() === "select" ? "select" : "text",
        valueOptions: Array.isArray(entry?.valueOptions)
          ? entry.valueOptions
            .map((option) => ({
              value: String(option?.value ?? "").trim(),
              label: String(option?.label ?? "").trim()
            }))
            .filter((option) => option.value)
          : []
      }))
      .filter((entry) => entry.type)
    : [];
  const componentDefaultsTitle = document.createElement("div");
  componentDefaultsTitle.className = "modal-subtitle";
  componentDefaultsTitle.textContent = "Component defaults (new placements)";
  const resistorDisplayTypeSelect = document.createElement("select");
  resistorDisplayTypeSelect.dataset.settingsToolDisplayResistorStyle = "1";
  const resistorDisplayTypeOptions = Array.isArray(getResistorDisplayTypeOptions())
    ? getResistorDisplayTypeOptions()
    : [];
  resistorDisplayTypeOptions.forEach((entry) => {
    const value = String(entry?.value ?? "").trim().toLowerCase();
    if (!value) {
      return;
    }
    const option = document.createElement("option");
    option.value = value;
    option.textContent = String(entry?.label ?? value).trim() || value;
    resistorDisplayTypeSelect.appendChild(option);
  });
  const componentDefaultRows = componentDefaultSpecs.map((spec) => {
    const row = document.createElement("div");
    row.className = "modal-field settings-component-default-row";
    row.dataset.settingsComponentDefaultRow = spec.type;
    const typeLabel = document.createElement("span");
    typeLabel.dataset.settingsComponentDefaultLabel = spec.type;
    typeLabel.textContent = spec.label || spec.type;
    const valueInput = spec.valueControl === "select"
      ? document.createElement("select")
      : document.createElement("input");
    valueInput.className = "settings-short-value-input";
    valueInput.dataset.settingsComponentDefaultValue = spec.type;
    if (valueInput instanceof HTMLInputElement) {
      valueInput.type = "text";
      valueInput.placeholder = spec.valueLabel || "Value";
    } else if (valueInput instanceof HTMLSelectElement) {
      spec.valueOptions.forEach((optionEntry) => {
        const option = document.createElement("option");
        option.value = optionEntry.value;
        option.textContent = optionEntry.label || optionEntry.value;
        valueInput.appendChild(option);
      });
    }
    const valueLabel = document.createElement("span");
    valueLabel.textContent = `${spec.valueLabel || "Value"}:`;
    const valueUnit = document.createElement("span");
    valueUnit.className = "inline-edit-unit";
    valueUnit.dataset.settingsComponentDefaultUnit = spec.type;
    valueUnit.textContent = spec.unit || "";
    valueUnit.hidden = !spec.unit;
    const switchRonLabel = document.createElement("span");
    switchRonLabel.textContent = "Ron:";
    const switchRonInput = document.createElement("input");
    switchRonInput.type = "text";
    switchRonInput.className = "settings-short-value-input";
    switchRonInput.dataset.settingsComponentDefaultSwitchRon = spec.type;
    switchRonInput.placeholder = "0";
    const switchRonUnit = document.createElement("span");
    switchRonUnit.className = "inline-edit-unit";
    switchRonUnit.textContent = spec.unit || "\u03a9";
    const switchRoffLabel = document.createElement("span");
    switchRoffLabel.textContent = "Roff:";
    const switchRoffInput = document.createElement("input");
    switchRoffInput.type = "text";
    switchRoffInput.className = "settings-short-value-input";
    switchRoffInput.dataset.settingsComponentDefaultSwitchRoff = spec.type;
    switchRoffInput.placeholder = "open";
    const switchRoffUnit = document.createElement("span");
    switchRoffUnit.className = "inline-edit-unit";
    switchRoffUnit.textContent = spec.unit || "\u03a9";
    const isSwitchDefaults = spec.type === "SW";
    let colorPicker = null;
    if (typeof createNetColorPicker === "function") {
      colorPicker = createNetColorPicker({
        rowClassName: "schematic-net-color-row settings-component-default-color-picker",
        swatchAttribute: "data-settings-component-default-color-swatch",
        labelText: "Color:",
        decorateSwatch: (button) => {
          button.dataset.settingsComponentDefaultColorType = spec.type;
        },
        onPick: (color) => {
          const currentColor = String(colorClear.dataset.settingsComponentDefaultCurrentColor ?? "").trim().toLowerCase();
          const normalizedPick = String(color ?? "").trim().toLowerCase();
          const nextColor = currentColor === normalizedPick ? null : normalizedPick;
          onComponentDefaultChange(spec.type, { netColor: nextColor });
          colorClear.dataset.settingsComponentDefaultCurrentColor = nextColor ?? "";
          colorPicker?.setSelected(nextColor);
        }
      });
      colorPicker.row.dataset.settingsComponentDefaultColorRow = spec.type;
    }
    const colorClear = document.createElement("button");
    colorClear.type = "button";
    colorClear.className = "secondary settings-component-default-color-clear";
    colorClear.textContent = "Default";
    colorClear.dataset.settingsComponentDefaultColorClear = spec.type;
    colorClear.dataset.settingsComponentDefaultCurrentColor = "";
    colorClear.addEventListener("click", () => {
      onComponentDefaultChange(spec.type, { netColor: null });
      colorClear.dataset.settingsComponentDefaultCurrentColor = "";
      colorPicker?.setSelected(null);
    });
    row.append(typeLabel);
    if (isSwitchDefaults) {
      row.append(
        switchRonLabel,
        switchRonInput,
        switchRonUnit,
        switchRoffLabel,
        switchRoffInput,
        switchRoffUnit
      );
    } else {
      row.append(valueLabel, valueInput, valueUnit);
      if (spec.type === "R") {
        const resistorDisplayTypeLabel = document.createElement("span");
        resistorDisplayTypeLabel.textContent = "Type:";
        row.append(resistorDisplayTypeLabel, resistorDisplayTypeSelect);
      }
    }
    if (colorPicker?.row) {
      row.append(colorPicker.row);
    }
    row.append(colorClear);
    return {
      ...spec,
      row,
      valueInput,
      valueUnit,
      switchRonInput,
      switchRoffInput,
      colorPicker,
      colorClear
    };
  });
  const groundDefaultsRow = document.createElement("div");
  groundDefaultsRow.className = "modal-field settings-component-default-row";
  groundDefaultsRow.dataset.settingsComponentDefaultRow = "GND";
  const groundDefaultsLabel = document.createElement("span");
  groundDefaultsLabel.dataset.settingsComponentDefaultLabel = "GND";
  groundDefaultsLabel.textContent = "Ground";
  const groundDisplayTypeLabel = document.createElement("span");
  groundDisplayTypeLabel.textContent = "Type:";
  const groundDisplayTypeSelect = document.createElement("select");
  groundDisplayTypeSelect.dataset.settingsToolDisplayGroundVariant = "1";
  const groundDisplayTypeOptions = Array.isArray(getGroundDisplayTypeOptions())
    ? getGroundDisplayTypeOptions()
    : [];
  groundDisplayTypeOptions.forEach((entry) => {
    const value = String(entry?.value ?? "").trim().toLowerCase();
    if (!value) {
      return;
    }
    const option = document.createElement("option");
    option.value = value;
    option.textContent = String(entry?.label ?? value).trim() || value;
    groundDisplayTypeSelect.appendChild(option);
  });
  let groundColorPicker = null;
  if (typeof createNetColorPicker === "function") {
    groundColorPicker = createNetColorPicker({
      rowClassName: "schematic-net-color-row settings-component-default-color-picker",
      swatchAttribute: "data-settings-tool-display-ground-color-swatch",
      labelText: "Color:",
      onPick: (color) => {
        const currentColor = String(groundColorClear.dataset.settingsToolDisplayGroundColorCurrentColor ?? "").trim().toLowerCase();
        const normalizedPick = String(color ?? "").trim().toLowerCase();
        const nextColor = currentColor === normalizedPick ? null : normalizedPick;
        onToolDisplayDefaultChange("groundColor", nextColor);
        groundColorClear.dataset.settingsToolDisplayGroundColorCurrentColor = nextColor ?? "";
        groundColorPicker?.setSelected(nextColor);
      }
    });
  }
  if (groundColorPicker?.row) {
    groundColorPicker.row.dataset.settingsToolDisplayGroundColorRow = "1";
  }
  const groundColorClear = document.createElement("button");
  groundColorClear.type = "button";
  groundColorClear.className = "secondary settings-component-default-color-clear";
  groundColorClear.textContent = "Default";
  groundColorClear.dataset.settingsToolDisplayGroundColorClear = "1";
  groundColorClear.dataset.settingsToolDisplayGroundColorCurrentColor = "";
  groundColorClear.addEventListener("click", () => {
    onToolDisplayDefaultChange("groundColor", null);
    groundColorClear.dataset.settingsToolDisplayGroundColorCurrentColor = "";
    groundColorPicker?.setSelected(null);
  });
  let wireDefaultColorPicker = null;
  if (typeof createNetColorPicker === "function") {
    wireDefaultColorPicker = createNetColorPicker({
      rowClassName: "schematic-net-color-row settings-component-default-color-picker",
      swatchAttribute: "data-settings-wire-default-color-swatch",
      labelText: "Color:",
      onPick: (color) => {
        const currentColor = String(wireDefaultColorClear.dataset.settingsWireDefaultCurrentColor ?? "").trim().toLowerCase();
        const normalizedPick = String(color ?? "").trim().toLowerCase();
        const nextColor = currentColor === normalizedPick ? null : normalizedPick;
        onWireDefaultColorChange(nextColor);
        wireDefaultColorClear.dataset.settingsWireDefaultCurrentColor = nextColor ?? "";
        wireDefaultColorPicker?.setSelected(nextColor);
      }
    });
  }
  const wireDefaultColorClear = document.createElement("button");
  wireDefaultColorClear.type = "button";
  wireDefaultColorClear.className = "secondary settings-component-default-color-clear";
  wireDefaultColorClear.textContent = "Default";
  wireDefaultColorClear.dataset.settingsWireDefaultColorClear = "1";
  wireDefaultColorClear.dataset.settingsWireDefaultCurrentColor = "";
  wireDefaultColorClear.addEventListener("click", () => {
    onWireDefaultColorChange(null);
    wireDefaultColorClear.dataset.settingsWireDefaultCurrentColor = "";
    wireDefaultColorPicker?.setSelected(null);
  });
  let probeDefaultColorPicker = null;
  if (typeof createNetColorPicker === "function") {
    probeDefaultColorPicker = createNetColorPicker({
      rowClassName: "schematic-net-color-row settings-component-default-color-picker",
      swatchAttribute: "data-settings-tool-display-probe-color-swatch",
      labelText: "Color:",
      onPick: (color) => {
        const currentColor = String(probeDefaultColorClear.dataset.settingsToolDisplayProbeColorCurrentColor ?? "").trim().toLowerCase();
        const normalizedPick = String(color ?? "").trim().toLowerCase();
        const nextColor = currentColor === normalizedPick ? null : normalizedPick;
        onToolDisplayDefaultChange("probeColor", nextColor);
        probeDefaultColorClear.dataset.settingsToolDisplayProbeColorCurrentColor = nextColor ?? "";
        probeDefaultColorPicker?.setSelected(nextColor);
      }
    });
  }
  if (probeDefaultColorPicker?.row) {
    probeDefaultColorPicker.row.dataset.settingsToolDisplayProbeColorRow = "1";
  }
  const probeDefaultColorClear = document.createElement("button");
  probeDefaultColorClear.type = "button";
  probeDefaultColorClear.className = "secondary settings-component-default-color-clear";
  probeDefaultColorClear.textContent = "Default";
  probeDefaultColorClear.dataset.settingsToolDisplayProbeColorClear = "1";
  probeDefaultColorClear.dataset.settingsToolDisplayProbeColorCurrentColor = "";
  probeDefaultColorClear.addEventListener("click", () => {
    onToolDisplayDefaultChange("probeColor", null);
    probeDefaultColorClear.dataset.settingsToolDisplayProbeColorCurrentColor = "";
    probeDefaultColorPicker?.setSelected(null);
  });
  const wireDefaultsRow = document.createElement("div");
  wireDefaultsRow.className = "modal-field settings-component-default-row";
  wireDefaultsRow.dataset.settingsComponentDefaultRow = "WIRE";
  wireDefaultsRow.dataset.settingsWireDefaultColorRow = "1";
  const wireDefaultsLabel = document.createElement("span");
  wireDefaultsLabel.dataset.settingsComponentDefaultLabel = "WIRE";
  wireDefaultsLabel.textContent = "Wire";
  const probeDefaultsRow = document.createElement("div");
  probeDefaultsRow.className = "modal-field settings-component-default-row";
  probeDefaultsRow.dataset.settingsComponentDefaultRow = "PROBE";
  probeDefaultsRow.dataset.settingsToolDisplayProbeColorRow = "1";
  const probeDefaultsLabel = document.createElement("span");
  probeDefaultsLabel.dataset.settingsComponentDefaultLabel = "PROBE";
  probeDefaultsLabel.textContent = "Probe";
  groundDefaultsRow.append(groundDefaultsLabel, groundDisplayTypeLabel, groundDisplayTypeSelect);
  if (groundColorPicker?.row) {
    groundDefaultsRow.append(groundColorPicker.row);
  }
  groundDefaultsRow.append(groundColorClear);
  wireDefaultsRow.append(wireDefaultsLabel);
  if (wireDefaultColorPicker?.row) {
    wireDefaultsRow.append(wireDefaultColorPicker.row);
  }
  wireDefaultsRow.append(wireDefaultColorClear);
  probeDefaultsRow.append(probeDefaultsLabel);
  if (probeDefaultColorPicker?.row) {
    probeDefaultsRow.append(probeDefaultColorPicker.row);
  }
  probeDefaultsRow.append(probeDefaultColorClear);
  settingsBody.append(
    autoSwitchToolUseRow,
    autoSwitchWireUseRow,
    schematicTextFontRow,
    schematicTextSizeRow,
    schematicTextBoldRow,
    schematicTextItalicRow,
    componentDefaultsTitle,
    ...componentDefaultRows.map((entry) => entry.row),
    groundDefaultsRow,
    wireDefaultsRow,
    probeDefaultsRow
  );
  const settingsActions = document.createElement("div");
  settingsActions.className = "modal-actions";
  const settingsApplyComponentDefaults = document.createElement("button");
  settingsApplyComponentDefaults.type = "button";
  settingsApplyComponentDefaults.className = "secondary";
  settingsApplyComponentDefaults.textContent = "Apply display settings to existing";
  settingsApplyComponentDefaults.dataset.settingsApplyComponentDefaults = "1";
  settingsApplyComponentDefaults.hidden = componentDefaultRows.length < 1;
  const settingsDefaultComponentType = document.createElement("button");
  settingsDefaultComponentType.type = "button";
  settingsDefaultComponentType.className = "secondary";
  settingsDefaultComponentType.textContent = "Default";
  settingsDefaultComponentType.dataset.settingsDefaultComponentType = "1";
  settingsDefaultComponentType.hidden = true;
  const settingsReset = document.createElement("button");
  settingsReset.type = "button";
  settingsReset.className = "secondary";
  settingsReset.textContent = "Reset Settings";
  settingsReset.dataset.settingsReset = "1";
  const settingsClose = document.createElement("button");
  settingsClose.type = "button";
  settingsClose.textContent = "Close";
  settingsClose.dataset.settingsClose = "1";
  settingsActions.append(settingsApplyComponentDefaults, settingsDefaultComponentType, settingsReset, settingsClose);
  settingsPanel.append(settingsTitle, settingsBody, settingsActions);
  settingsDialog.append(settingsPanel);
  container.appendChild(settingsDialog);

  const componentDefaultRowByType = new Map(
    componentDefaultRows.map((entry) => [entry.type, entry])
  );
  const normalizeScopedSettingsType = (value) => {
    const type = String(value ?? "").trim().toUpperCase();
    if (!type) {
      return "";
    }
    if (componentDefaultRowByType.has(type)) {
      return type;
    }
    if (type === "GND" || type === "WIRE") {
      return type;
    }
    if (isProbeComponentType(type)) {
      return "PROBE";
    }
    return "";
  };
  const getScopedSettingsLabel = (type) => {
    if (!type) {
      return "Settings";
    }
    const defaultsRow = componentDefaultRowByType.get(type);
    if (defaultsRow) {
      return defaultsRow.label || defaultsRow.type;
    }
    if (type === "GND") {
      return "Ground";
    }
    if (type === "WIRE") {
      return "Wire";
    }
    if (type === "PROBE") {
      return "Probe";
    }
    return type;
  };
  let activeScopedSettingsType = "";
  let activeScopedSourceType = "";
  const syncDialogScopeState = () => {
    const scopedType = activeScopedSettingsType;
    const scoped = Boolean(scopedType);
    settingsDialog.dataset.settingsScopeType = scopedType;
    settingsTitle.textContent = scoped
      ? `${getScopedSettingsLabel(scopedType)} Defaults`
      : "Settings";
    autoSwitchToolUseRow.hidden = scoped;
    autoSwitchWireUseRow.hidden = scoped;
    schematicTextFontRow.hidden = scoped;
    schematicTextSizeRow.hidden = scoped;
    schematicTextBoldRow.hidden = scoped;
    schematicTextItalicRow.hidden = scoped;
    componentDefaultsTitle.hidden = scoped;
    componentDefaultRows.forEach((entry) => {
      entry.row.hidden = scoped && entry.type !== scopedType;
    });
    groundDefaultsRow.hidden = scoped && scopedType !== "GND";
    wireDefaultsRow.hidden = scoped && scopedType !== "WIRE";
    probeDefaultsRow.hidden = scoped && scopedType !== "PROBE";
    settingsDefaultComponentType.hidden = !scoped;
    settingsReset.hidden = scoped;
    settingsApplyComponentDefaults.hidden = scoped
      ? !scopedType
      : componentDefaultRows.length < 1;
  };
  const buildScopedApplyOptions = () => {
    if (!activeScopedSettingsType) {
      return null;
    }
    const options = {
      types: [],
      applyGroundDefaults: false,
      applyProbeDefaults: false,
      applyWireDefaults: false
    };
    if (activeScopedSettingsType === "GND") {
      options.applyGroundDefaults = true;
    } else if (activeScopedSettingsType === "PROBE") {
      options.applyProbeDefaults = true;
    } else if (activeScopedSettingsType === "WIRE") {
      options.applyWireDefaults = true;
    } else {
      options.types = [activeScopedSettingsType];
    }
    return options;
  };
  const syncSettingsState = () => {
    autoSwitchToolUseToggle.checked = Boolean(getAutoSwitchToSelectAfterToolUse());
    autoSwitchWireUseToggle.checked = Boolean(getAutoSwitchToSelectAfterWireUse());
    const textSettings = getSchematicTextStyle();
    const normalizedFont = String(textSettings?.font ?? "").trim();
    const hasMatchingOption = Array.from(schematicTextFontSelect.options).some((option) => option.value === normalizedFont);
    schematicTextFontSelect.value = hasMatchingOption
      ? normalizedFont
      : schematicTextFontSelect.options[0].value;
    const parsedSize = Number(textSettings?.size);
    schematicTextSizeInput.value = Number.isFinite(parsedSize)
      ? String(Math.round(parsedSize))
      : String(DEFAULT_SCHEMATIC_TEXT_STYLE.size);
    schematicTextBoldToggle.checked = textSettings?.bold === true;
    schematicTextItalicToggle.checked = textSettings?.italic === true;
    const componentDefaults = getComponentDefaults();
    componentDefaultRows.forEach((entry) => {
      const typeDefaults = componentDefaults && typeof componentDefaults === "object"
        ? componentDefaults[entry.type]
        : null;
      const normalizedValue = String(typeDefaults?.value ?? "");
      if (entry.type === "SW") {
        const parsedSwitchDefaults = parseSwitchComponentDefaultValue(normalizedValue);
        entry.switchRonInput.value = String(parsedSwitchDefaults?.ron ?? "0");
        entry.switchRoffInput.value = String(parsedSwitchDefaults?.roff ?? "");
      } else {
        if (entry.valueInput instanceof HTMLSelectElement) {
          const customOption = entry.valueInput.querySelector("option[data-settings-component-default-custom='1']");
          if (customOption) {
            customOption.remove();
          }
          const hasOption = Array.from(entry.valueInput.options).some((option) => option.value === normalizedValue);
          if (!hasOption && normalizedValue) {
            const option = document.createElement("option");
            option.value = normalizedValue;
            option.textContent = normalizedValue;
            option.dataset.settingsComponentDefaultCustom = "1";
            entry.valueInput.appendChild(option);
          }
        }
        entry.valueInput.value = normalizedValue;
      }
      const normalizedColor = String(typeDefaults?.netColor ?? "").trim().toLowerCase();
      entry.colorClear.dataset.settingsComponentDefaultCurrentColor = normalizedColor;
      entry.colorPicker?.setSelected(normalizedColor);
    });
    const displayDefaults = getToolDisplayDefaults();
    const normalizedResistorStyle = String(displayDefaults?.resistorStyle ?? "").trim().toLowerCase();
    const normalizedGroundVariant = String(displayDefaults?.groundVariant ?? "").trim().toLowerCase();
    const hasResistorStyleOption = Array.from(resistorDisplayTypeSelect.options)
      .some((option) => option.value === normalizedResistorStyle);
    const hasGroundVariantOption = Array.from(groundDisplayTypeSelect.options)
      .some((option) => option.value === normalizedGroundVariant);
    if (hasResistorStyleOption) {
      resistorDisplayTypeSelect.value = normalizedResistorStyle;
    }
    if (hasGroundVariantOption) {
      groundDisplayTypeSelect.value = normalizedGroundVariant;
    }
    const normalizedGroundColor = String(displayDefaults?.groundColor ?? "").trim().toLowerCase();
    groundColorClear.dataset.settingsToolDisplayGroundColorCurrentColor = normalizedGroundColor;
    groundColorPicker?.setSelected(normalizedGroundColor);
    const normalizedWireDefaultColor = String(getWireDefaultColor() ?? "").trim().toLowerCase();
    wireDefaultColorClear.dataset.settingsWireDefaultCurrentColor = normalizedWireDefaultColor;
    wireDefaultColorPicker?.setSelected(normalizedWireDefaultColor);
    const normalizedProbeDefaultColor = String(displayDefaults?.probeColor ?? "").trim().toLowerCase();
    probeDefaultColorClear.dataset.settingsToolDisplayProbeColorCurrentColor = normalizedProbeDefaultColor;
    probeDefaultColorPicker?.setSelected(normalizedProbeDefaultColor);
  };
  const openSettingsDialog = () => {
    activeScopedSettingsType = "";
    activeScopedSourceType = "";
    syncDialogScopeState();
    syncSettingsState();
    setDialogOpen(settingsDialog, true);
  };
  const openSettingsDialogForType = (type) => {
    const normalizedScopeType = normalizeScopedSettingsType(type);
    if (!normalizedScopeType) {
      return false;
    }
    activeScopedSettingsType = normalizedScopeType;
    activeScopedSourceType = String(type ?? "").trim().toUpperCase();
    syncDialogScopeState();
    syncSettingsState();
    setDialogOpen(settingsDialog, true);
    return true;
  };
  const closeSettingsDialog = () => setDialogOpen(settingsDialog, false);

  settingsDialog.addEventListener("click", (event) => {
    if (event.target === settingsDialog) {
      closeSettingsDialog();
    }
  });
  autoSwitchToolUseToggle.addEventListener("change", () => {
    onAutoSwitchToSelectAfterToolUseChange(autoSwitchToolUseToggle.checked);
  });
  autoSwitchWireUseToggle.addEventListener("change", () => {
    onAutoSwitchToSelectAfterWireUseChange(autoSwitchWireUseToggle.checked);
  });
  schematicTextFontSelect.addEventListener("change", () => {
    onSchematicTextStyleChange({ font: schematicTextFontSelect.value });
  });
  schematicTextSizeInput.addEventListener("change", () => {
    onSchematicTextStyleChange({ size: Number(schematicTextSizeInput.value) });
  });
  schematicTextBoldToggle.addEventListener("change", () => {
    onSchematicTextStyleChange({ bold: schematicTextBoldToggle.checked });
  });
  schematicTextItalicToggle.addEventListener("change", () => {
    onSchematicTextStyleChange({ italic: schematicTextItalicToggle.checked });
  });
  resistorDisplayTypeSelect.addEventListener("change", () => {
    onToolDisplayDefaultChange("resistorStyle", resistorDisplayTypeSelect.value);
  });
  groundDisplayTypeSelect.addEventListener("change", () => {
    onToolDisplayDefaultChange("groundVariant", groundDisplayTypeSelect.value);
  });
  componentDefaultRows.forEach((entry) => {
    if (entry.type === "SW") {
      entry.switchRonInput.addEventListener("change", () => {
        onComponentDefaultChange(entry.type, { switchRon: entry.switchRonInput.value });
      });
      entry.switchRoffInput.addEventListener("change", () => {
        onComponentDefaultChange(entry.type, { switchRoff: entry.switchRoffInput.value });
      });
      return;
    }
    entry.valueInput.addEventListener("change", () => {
      onComponentDefaultChange(entry.type, { value: entry.valueInput.value });
    });
  });
  settingsApplyComponentDefaults.addEventListener("click", () => {
    if (activeScopedSettingsType) {
      const scopedOptions = buildScopedApplyOptions();
      onApplyComponentDefaultsToExisting(scopedOptions ?? undefined);
      return;
    }
    onApplyComponentDefaultsToExisting(undefined);
  });
  settingsDefaultComponentType.addEventListener("click", () => {
    if (!activeScopedSettingsType) {
      return;
    }
    onResetComponentTypeDefaults(activeScopedSourceType || activeScopedSettingsType);
    syncSettingsState();
  });
  settingsReset.addEventListener("click", () => {
    onResetSettings();
    syncSettingsState();
  });
  settingsClose.addEventListener("click", closeSettingsDialog);
  syncDialogScopeState();
  syncSettingsState();

  return { settingsDialog, openSettingsDialog, openSettingsDialogForType, closeSettingsDialog };
};

/**
 * @param {HTMLElement} container
 * @param {AppState} state
 * @param {UIActions} actions
 * @returns {UIHandle}
 */
function createUI(container, state, actions) {
  let setActiveTab = () => { };
  let setActiveSimulationKind = () => { };
  let setResultsPaneMode = () => { };
  let setResultsPaneSplitRatio = () => { };
  let applyResultsPaneState = () => { };
  let openResultsPaneForRun = () => { };
  let setSchematicMode = () => { };
  let refreshSchematicNetlist = () => { };
  let updateConfigSectionVisibility = () => { };
  let queuePlotResize = () => { };
  let openSettingsDialog = () => { };
  let openSettingsDialogForType = () => false;
  let schematicMode = true;
  let workspace = null;
  let resultsPaneLayout = null;
  let resultsPaneDivider = null;
  let resultsPaneState = {
    mode: DEFAULT_RESULTS_PANE_MODE,
    splitRatio: DEFAULT_RESULTS_PANE_SPLIT_RATIO
  };
  let isDraggingResultsDivider = false;
  let resultsDividerPointerId = null;
  let resultsDividerDragStartX = 0;
  let resultsDividerDragStartRatio = DEFAULT_RESULTS_PANE_SPLIT_RATIO;
  let lastRunKind = simulationConfig.activeKind;
  const lastRequestedRunRequestSignaturesByKind = Object.create(null);
  let schematicModel = null;
  let schematicEditor = null;
  let schematicSelectionId = null;
  let schematicTool = "select";
  let autoSwitchToSelectOnPlace = DEFAULT_AUTO_SWITCH_TO_SELECT_ON_PLACE;
  let autoSwitchToSelectOnWire = DEFAULT_AUTO_SWITCH_TO_SELECT_ON_WIRE;
  let schematicTextStyle = { ...DEFAULT_SCHEMATIC_TEXT_STYLE };
  let componentDefaults = {};
  let wireDefaultColor = null;
  let toolDisplayDefaults = { resistorStyle: "zigzag", groundVariant: "earth", groundColor: null, probeColor: null };
  let activeTraceHighlightTokens = new Set();
  let activeTraceSelectionTokens = new Set();
  let activeTraceHoverTokens = new Set();
  let schematicTraceHighlightTokens = new Set();
  let hoverTraceHighlightTokens = new Set();
  let plotTraceSelectionTokens = new Set();
  let plotExternalHighlightTargets = { componentIds: [], wireIds: [], color: "" };
  let hoverExternalHighlightTargets = { componentIds: [], wireIds: [], color: "", entries: [] };
  let primaryTraceSelectionToken = "";
  let focusedTracePane = "schematic";
  let traceLinkIndexCache = null;
  let isApplyingPlotDrivenSchematicSelection = false;
  let refreshResultsTableHighlights = () => { };
  let handleResultsSignalClick = () => { };
  let handleResultsSignalHover = () => { };
  let openInlineComponentEditor = () => { };
  let closeInlineComponentEditor = () => { };
  let syncInlineComponentEditor = () => { };
  let inlineEditingComponentId = null;
  let probeSignalDisplayLabelMap = new Map();
  let powerSignalTokens = new Set();
  let autoRunTimer = null;
  let autosaveTimer = null;
  let isRestoringDocument = false;
  let netlistPreamble = "";
  const documentMeta = { title: "", createdAt: "", fileName: "" };
  let suggestedFileName = "";
  let saveFileHandle = null;
  let lastPickerHandle = null;
  let isDirty = true;
  let lastSavedAt = "";
  const urlParams = new URLSearchParams(window.location.search);
  const isUiTestMode = urlParams.get("uiTest") === "1" || urlParams.get("selftest") === "1";
  if (persistenceApi && typeof persistenceApi.getRecentInfo === "function") {
    const recent = persistenceApi.getRecentInfo();
    if (recent?.lastOpenedName) {
      suggestedFileName = recent.lastOpenedName;
    }
  }
  let schematicMeasurements = new Map();
  let schematicProbeLabels = new Map();
  const schematicGrid = { size: DEFAULT_GRID_SIZE, snap: true, visible: true };
  const selectionMenuActions = [
    { id: "edit", label: "Edit Properties", shortcut: HOTKEY_SHORTCUTS.edit },
    { id: "select-all", label: "Select All", shortcut: HOTKEY_SHORTCUTS.selectAll },
    { id: "delete", label: "Delete", shortcut: HOTKEY_SHORTCUTS.delete },
    { id: "copy", label: "Copy", shortcut: HOTKEY_SHORTCUTS.copy },
    { id: "cut", label: "Cut", shortcut: HOTKEY_SHORTCUTS.cut },
    { id: "paste", label: "Paste", shortcut: HOTKEY_SHORTCUTS.paste },
    { divider: true, id: "edit-after-paste" },
    { id: "rotate-cw", label: "Rotate CW", shortcut: HOTKEY_SHORTCUTS.rotateCw },
    { id: "rotate-ccw", label: "Rotate CCW", shortcut: HOTKEY_SHORTCUTS.rotateCcw },
    { id: "flip-h", label: "Flip Horizontal", shortcut: HOTKEY_SHORTCUTS.flipH },
    { id: "flip-v", label: "Flip Vertical", shortcut: HOTKEY_SHORTCUTS.flipV },
    { divider: true, id: "edit-after-flip-v" },
    { id: "simplify-wires", label: "Simplify Wires" },
    { id: "regrid-current-grid", label: "Regrid to Current Grid" },
    { divider: true, id: "edit-after-simplify" },
    { id: "undo", label: "Undo", shortcut: HOTKEY_SHORTCUTS.undo },
    { id: "redo", label: "Redo", shortcut: HOTKEY_SHORTCUTS.redo }
  ];
  const clipboard = { componentIds: [], wireIds: [] };

  const getSchematicApi = () => (typeof self !== "undefined" ? (self.SpjutSimSchematic ?? null) : null);
  const requirePersistenceMethod = (name) => {
    const method = persistenceApi?.[name];
    if (typeof method !== "function") {
      throw new Error(`Persistence API missing '${name}'. Check src/app/persistence.js.`);
    }
    return method.bind(persistenceApi);
  };
  const persistencePreferenceNames = (() => {
    const names = persistenceApi?.PREFERENCE_NAMES;
    if (!names || typeof names !== "object") {
      throw new Error("Persistence API missing 'PREFERENCE_NAMES'. Check src/app/persistence.js.");
    }
    return names;
  })();
  const persistencePreferences = Object.freeze({
    readNumberPreference: requirePersistenceMethod("readNumberPreference"),
    readStringPreference: requirePersistenceMethod("readStringPreference"),
    readBooleanPreference: requirePersistenceMethod("readBooleanPreference"),
    writePreference: requirePersistenceMethod("writePreference")
  });
  const normalizeResultsPaneMode = (value) => {
    return uiResultsPaneDomain.normalizeMode(value);
  };
  const clampResultsPaneSplitRatio = (value) => {
    return uiResultsPaneDomain.clampSplitRatio(value);
  };
  const normalizeResultsPaneState = (stateValue) => {
    return uiResultsPaneDomain.normalizeState(stateValue);
  };
  const requireSchematicMethod = (name) => {
    const api = getSchematicApi();
    const method = api?.[name];
    if (typeof method !== "function") {
      throw new Error(`Schematic API missing '${name}'. Check schematic module load order.`);
    }
    return method.bind(api);
  };

  const getNetColorPalette = () => {
    const api = getSchematicApi();
    if (!api || typeof api.getNetColorPalette !== "function") {
      return [];
    }
    const raw = api.getNetColorPalette();
    if (!Array.isArray(raw) || !raw.length) {
      return [];
    }
    return raw
      .map((entry) => String(entry ?? "").trim().toLowerCase())
      .filter((entry) => /^#[0-9a-f]{6}$/.test(entry));
  };

  const normalizeNetColorValue = (value) => {
    const api = getSchematicApi();
    if (!api || typeof api.normalizeNetColor !== "function") {
      return null;
    }
    return api.normalizeNetColor(value);
  };

  const textStyleApi = Object.freeze({
    getTextFontOptions: requireSchematicMethod("getTextFontOptions"),
    normalizeTextFont: requireSchematicMethod("normalizeTextFont"),
    normalizeTextSize: requireSchematicMethod("normalizeTextSize"),
    getDefaultTextStyle: requireSchematicMethod("getDefaultTextStyle")
  });
  const componentDefaultsApi = Object.freeze({
    listComponentDefaultTypes: requireSchematicMethod("listComponentDefaultTypes"),
    getBuiltInComponentDefaults: requireSchematicMethod("getBuiltInComponentDefaults"),
    normalizeComponentDefaults: requireSchematicMethod("normalizeComponentDefaults")
  });
  const componentDisplayApi = Object.freeze({
    normalizeResistorStyle: requireSchematicMethod("normalizeResistorStyle"),
    listResistorStyles: requireSchematicMethod("listResistorStyles"),
    normalizeGroundVariant: requireSchematicMethod("normalizeGroundVariant"),
    listGroundVariants: requireSchematicMethod("listGroundVariants")
  });
  const elementCatalogApi = Object.freeze({
    listElementDefinitions: requireSchematicMethod("listElementDefinitions"),
    listToolbarElementDefinitions: requireSchematicMethod("listToolbarElementDefinitions"),
    isProbeComponentType: requireSchematicMethod("isProbeComponentType"),
    getValueFieldMeta: requireSchematicMethod("getValueFieldMeta")
  });
  const boxAnnotationApi = Object.freeze({
    getDefaultBoxAnnotationStyle: requireSchematicMethod("getDefaultBoxAnnotationStyle"),
    parseBoxAnnotationStyle: requireSchematicMethod("parseBoxAnnotationStyle"),
    formatBoxAnnotationStyle: requireSchematicMethod("formatBoxAnnotationStyle")
  });
  const arrowAnnotationApi = Object.freeze({
    parseArrowAnnotationStyle: requireSchematicMethod("parseArrowAnnotationStyle"),
    formatArrowAnnotationStyle: requireSchematicMethod("formatArrowAnnotationStyle")
  });
  const textAnnotationApi = Object.freeze({
    parseTextAnnotationStyle: requireSchematicMethod("parseTextAnnotationStyle"),
    formatTextAnnotationStyle: requireSchematicMethod("formatTextAnnotationStyle")
  });
  const parseSpdtSwitchValue = requireSchematicMethod("parseSpdtSwitchValue");
  const buildAnalysisDirectivesForConfig = requireSchematicMethod("buildAnalysisDirectivesForConfig");

  const getSelectPropertyContract = ({
    type: rawType,
    key: rawKey,
    property: sourceProperty,
    propertyFieldPath: rawPropertyFieldPath,
    normalizeMethodName: rawNormalizeMethodName,
    normalizeValue
  } = {}) => {
    const source = {
      type: rawType,
      key: rawKey,
      property: sourceProperty,
      propertyFieldPath: rawPropertyFieldPath,
      normalizeMethodName: rawNormalizeMethodName,
      normalizeValue
    };
    const type = String(source.type ?? "").trim().toUpperCase();
    const key = String(source.key ?? "").trim();
    const normalizeMethodName = String(source.normalizeMethodName ?? "").trim();
    const propertyFieldPath = String(source.propertyFieldPath ?? `${type}.${key}`).trim();
    const property = source.property;
    if (!type || !key) {
      throw new Error(`Inline select property contract '${propertyFieldPath || "?"}' requires non-empty type/key.`);
    }
    if (!property) {
      throw new Error(`Missing property contract '${propertyFieldPath}' in element catalog definition list.`);
    }
    const control = String(property?.control ?? "").trim().toLowerCase();
    if (control !== "select") {
      throw new Error(`Property contract '${propertyFieldPath}' must use select control.`);
    }
    const normalizeMethod = String(property?.normalizeMethod ?? "").trim();
    if (normalizeMethod !== normalizeMethodName) {
      throw new Error(
        `Property contract '${propertyFieldPath}' normalize owner mismatch. Expected '${normalizeMethodName}', got '${normalizeMethod || "?"}'.`
      );
    }
    const label = String(property?.label ?? "").trim();
    if (!label) {
      throw new Error(`Property contract '${propertyFieldPath}' requires a non-empty label.`);
    }
    const optionsRaw = Array.isArray(property?.options) ? property.options : [];
    if (!optionsRaw.length) {
      throw new Error(`Property contract '${propertyFieldPath}' requires one or more options.`);
    }
    const seenValues = new Set();
    const options = optionsRaw.map((entry, index) => {
      const value = normalizeValue(entry?.value);
      const optionLabel = String(entry?.label ?? "").trim();
      if (typeof value !== "string" || !value.trim()) {
        throw new Error(`Property contract '${propertyFieldPath}' has invalid option value at index ${index}.`);
      }
      if (!optionLabel) {
        throw new Error(`Property contract '${propertyFieldPath}' has invalid option label at index ${index}.`);
      }
      if (seenValues.has(value)) {
        throw new Error(`Property contract '${propertyFieldPath}' contains duplicate option value '${value}'.`);
      }
      seenValues.add(value);
      return { value, label: optionLabel };
    });
    return Object.freeze({
      key,
      label,
      options: Object.freeze(options)
    });
  };
  const areInlineSelectContractsEqual = (left, right) => {
    if (!left || !right) {
      return false;
    }
    if (left.label !== right.label) {
      return false;
    }
    if (!Array.isArray(left.options) || !Array.isArray(right.options) || left.options.length !== right.options.length) {
      return false;
    }
    for (let index = 0; index < left.options.length; index += 1) {
      const leftOption = left.options[index];
      const rightOption = right.options[index];
      if (leftOption?.value !== rightOption?.value || leftOption?.label !== rightOption?.label) {
        return false;
      }
    }
    return true;
  };

  const inlineSelectNormalizeMethodCache = new Map();
  const resolveInlineSelectNormalizeValue = (normalizeMethod) => {
    const methodName = String(normalizeMethod ?? "").trim();
    if (!methodName) {
      throw new Error("Inline select property contract requires a non-empty normalize owner.");
    }
    const cachedNormalizeValue = inlineSelectNormalizeMethodCache.get(methodName);
    if (typeof cachedNormalizeValue === "function") {
      return cachedNormalizeValue;
    }
    const normalizeValue = requireSchematicMethod(methodName);
    inlineSelectNormalizeMethodCache.set(methodName, normalizeValue);
    return normalizeValue;
  };
  const buildInlineSelectPropertySpecs = () => {
    const definitions = elementCatalogApi.listElementDefinitions();
    if (!Array.isArray(definitions) || !definitions.length) {
      throw new Error("Schematic API listElementDefinitions() returned invalid data.");
    }
    const specsByKey = new Map();
    definitions.forEach((definition, definitionIndex) => {
      const type = String(definition?.type ?? "").trim().toUpperCase();
      if (!type) {
        throw new Error(`Schematic API listElementDefinitions() returned invalid type at index ${definitionIndex}.`);
      }
      const properties = Array.isArray(definition?.properties) ? definition.properties : [];
      properties.forEach((property, propertyIndex) => {
        const key = String(property?.key ?? "").trim();
        const control = String(property?.control ?? "").trim().toLowerCase();
        if (control !== "select" || property?.inlineEditVisible === false) {
          return;
        }
        if (!key) {
          throw new Error(
            `Inline select property contract '${type}' missing key at property index ${propertyIndex}.`
          );
        }
        const normalizeMethod = String(property?.normalizeMethod ?? "").trim();
        const normalizeValue = resolveInlineSelectNormalizeValue(normalizeMethod);
        const propertyFieldPath = `${type}.${key}`;
        const nextContract = getSelectPropertyContract({
          type,
          key,
          property,
          propertyFieldPath,
          normalizeMethodName: normalizeMethod,
          normalizeValue
        });
        const existingSpec = specsByKey.get(key);
        if (!existingSpec) {
          specsByKey.set(key, {
            key,
            normalizeMethod,
            normalizeValue,
            contract: nextContract,
            componentTypes: [type]
          });
          return;
        }
        if (existingSpec.normalizeMethod !== normalizeMethod) {
          throw new Error(
            `Inline select property '${key}' normalize owner mismatch across element definitions.`
          );
        }
        if (!areInlineSelectContractsEqual(existingSpec.contract, nextContract)) {
          throw new Error(`Inline select property '${key}' contract mismatch across element definitions.`);
        }
        if (!existingSpec.componentTypes.includes(type)) {
          existingSpec.componentTypes.push(type);
        }
      });
    });
    const specs = [];
    specsByKey.forEach((existingSpec) => {
      specs.push(Object.freeze({
        key: existingSpec.key,
        componentTypes: Object.freeze(existingSpec.componentTypes.slice()),
        normalizeMethod: existingSpec.normalizeMethod,
        normalizeValue: existingSpec.normalizeValue,
        contract: existingSpec.contract
      }));
    });
    if (!specs.length) {
      throw new Error("Inline select property contracts missing from element definitions.");
    }
    return Object.freeze(specs);
  };
  const INLINE_SELECT_PROPERTY_SPECS = buildInlineSelectPropertySpecs();
  const getInlineSelectPropertySpec = (key) => {
    const normalizedKey = String(key ?? "").trim();
    const spec = INLINE_SELECT_PROPERTY_SPECS.find((entry) => entry.key === normalizedKey) ?? null;
    if (!spec) {
      throw new Error(`Unsupported inline select property contract '${normalizedKey || "?"}'.`);
    }
    return spec;
  };
  const getInlineSelectPropertyContract = (key) => {
    const spec = getInlineSelectPropertySpec(key);
    return spec.contract;
  };
  const getTogglePropertyContract = ({
    type,
    key,
    source,
    propertyFieldPath,
    normalizeMethodName
  }) => {
    const property = source && typeof source === "object" && source.property
      ? source.property
      : null;
    if (!type || !key || typeof type !== "string" || typeof key !== "string") {
      throw new Error(`Inline toggle property contract '${propertyFieldPath || "?"}' requires non-empty type/key.`);
    }
    if (!property) {
      throw new Error(`Missing property contract '${propertyFieldPath}' in element catalog definition list.`);
    }
    const control = String(property?.control ?? "").trim().toLowerCase();
    if (control !== "toggle") {
      throw new Error(`Property contract '${propertyFieldPath}' must use toggle control.`);
    }
    const normalizeMethod = String(property?.normalizeMethod ?? "").trim();
    if (normalizeMethod !== normalizeMethodName) {
      throw new Error(
        `Property contract '${propertyFieldPath}' normalize owner mismatch. Expected '${normalizeMethodName}', got '${normalizeMethod || "?"}'.`
      );
    }
    const label = String(property?.label ?? "").trim();
    if (!label) {
      throw new Error(`Property contract '${propertyFieldPath}' requires a non-empty label.`);
    }
    return Object.freeze({
      key,
      label
    });
  };
  const areInlineToggleContractsEqual = (left, right) => {
    if (!left || !right) {
      return false;
    }
    return left.label === right.label;
  };
  const buildInlineTogglePropertySpecs = () => {
    const definitions = elementCatalogApi.listElementDefinitions();
    if (!Array.isArray(definitions) || !definitions.length) {
      throw new Error("Schematic API listElementDefinitions() returned invalid data.");
    }
    const specsByKey = new Map();
    definitions.forEach((definition, definitionIndex) => {
      const type = String(definition?.type ?? "").trim().toUpperCase();
      if (!type) {
        throw new Error(`Schematic API listElementDefinitions() returned invalid type at index ${definitionIndex}.`);
      }
      const properties = Array.isArray(definition?.properties) ? definition.properties : [];
      properties.forEach((property, propertyIndex) => {
        const key = String(property?.key ?? "").trim();
        const control = String(property?.control ?? "").trim().toLowerCase();
        if (control !== "toggle" || property?.inlineEditVisible === false) {
          return;
        }
        if (!key) {
          throw new Error(
            `Inline toggle property contract '${type}' missing key at property index ${propertyIndex}.`
          );
        }
        const normalizeMethod = String(property?.normalizeMethod ?? "").trim();
        const normalizeValue = resolveInlineSelectNormalizeValue(normalizeMethod);
        const propertyFieldPath = `${type}.${key}`;
        const nextContract = getTogglePropertyContract({
          type,
          key,
          source: { property },
          propertyFieldPath,
          normalizeMethodName: normalizeMethod
        });
        const existingSpec = specsByKey.get(key);
        if (!existingSpec) {
          specsByKey.set(key, {
            key,
            normalizeMethod,
            normalizeValue,
            contract: nextContract,
            componentTypes: [type]
          });
          return;
        }
        if (existingSpec.normalizeMethod !== normalizeMethod) {
          throw new Error(
            `Inline toggle property '${key}' normalize owner mismatch across element definitions.`
          );
        }
        if (!areInlineToggleContractsEqual(existingSpec.contract, nextContract)) {
          throw new Error(`Inline toggle property '${key}' contract mismatch across element definitions.`);
        }
        if (!existingSpec.componentTypes.includes(type)) {
          existingSpec.componentTypes.push(type);
        }
      });
    });
    const specs = [];
    specsByKey.forEach((existingSpec) => {
      specs.push(Object.freeze({
        key: existingSpec.key,
        componentTypes: Object.freeze(existingSpec.componentTypes.slice()),
        normalizeMethod: existingSpec.normalizeMethod,
        normalizeValue: existingSpec.normalizeValue,
        contract: existingSpec.contract
      }));
    });
    return Object.freeze(specs);
  };
  const INLINE_TOGGLE_PROPERTY_SPECS = buildInlineTogglePropertySpecs();
  const getInlineTogglePropertySpec = (key) => {
    const normalizedKey = String(key ?? "").trim();
    const spec = INLINE_TOGGLE_PROPERTY_SPECS.find((entry) => entry.key === normalizedKey) ?? null;
    if (!spec) {
      throw new Error(`Unsupported inline toggle property contract '${normalizedKey || "?"}'.`);
    }
    return spec;
  };
  const getInlineTogglePropertyContract = (key) => {
    const spec = getInlineTogglePropertySpec(key);
    return spec.contract;
  };
  const INLINE_INPUT_CONTROL_TYPES = new Set(["text", "number", "color"]);
  const normalizeInputContractMetadata = (propertyFieldPath, control, input) => {
    const normalizedInput = {};
    if (typeof input?.placeholder === "string") {
      normalizedInput.placeholder = input.placeholder;
    }
    if (Object.prototype.hasOwnProperty.call(input, "unit")) {
      normalizedInput.unit = String(input.unit ?? "").trim();
    }
    if (control === "number") {
      ["min", "max", "step"].forEach((name) => {
        if (!Object.prototype.hasOwnProperty.call(input, name)) return;
        const value = Number(input[name]);
        if (!Number.isFinite(value)) {
          throw new Error(`Property contract '${propertyFieldPath}.input.${name}' requires a finite number.`);
        }
        normalizedInput[name] = value;
      });
    }
    return normalizedInput;
  };
  const getInputPropertyContract = ({
    type, key, source, propertyFieldPath, normalizeMethodName
  }) => {
    const property = source && typeof source === "object" ? source.property : null;
    if (!type || !key || typeof type !== "string" || typeof key !== "string") {
      throw new Error(`Inline input property contract '${propertyFieldPath || "?"}' requires non-empty type/key.`);
    }
    if (!property) throw new Error(`Missing property contract '${propertyFieldPath}' in element catalog definition list.`);
    const control = String(property?.control ?? "").trim().toLowerCase();
    if (!INLINE_INPUT_CONTROL_TYPES.has(control)) {
      throw new Error(`Property contract '${propertyFieldPath}' must use text/number/color control.`);
    }
    const normalizeMethod = String(property?.normalizeMethod ?? "").trim();
    if (normalizeMethod !== normalizeMethodName) {
      throw new Error(`Property contract '${propertyFieldPath}' normalize owner mismatch. Expected '${normalizeMethodName}', got '${normalizeMethod || "?"}'.`);
    }
    const label = String(property?.label ?? "").trim();
    if (!label) throw new Error(`Property contract '${propertyFieldPath}' requires a non-empty label.`);
    const input = property?.input && typeof property.input === "object" && !Array.isArray(property.input) ? property.input : {};
    return Object.freeze({ key, label, control, input: Object.freeze(normalizeInputContractMetadata(propertyFieldPath, control, input)) });
  };
  const areInlineInputContractsEqual = (left, right) => {
    if (!left || !right || left.label !== right.label || left.control !== right.control) return false;
    const leftInput = left.input && typeof left.input === "object" ? left.input : {};
    const rightInput = right.input && typeof right.input === "object" ? right.input : {};
    return !Array.from(new Set([...Object.keys(leftInput), ...Object.keys(rightInput)])).some((entryKey) => leftInput[entryKey] !== rightInput[entryKey]);
  };
  const buildInlineInputPropertySpecs = () => {
    const definitions = elementCatalogApi.listElementDefinitions();
    if (!Array.isArray(definitions) || !definitions.length) {
      throw new Error("Schematic API listElementDefinitions() returned invalid data.");
    }
    const specsByKey = new Map();
    definitions.forEach((definition, definitionIndex) => {
      const type = String(definition?.type ?? "").trim().toUpperCase();
      if (!type) {
        throw new Error(`Schematic API listElementDefinitions() returned invalid type at index ${definitionIndex}.`);
      }
      const properties = Array.isArray(definition?.properties) ? definition.properties : [];
      properties.forEach((property, propertyIndex) => {
        const key = String(property?.key ?? "").trim();
        const control = String(property?.control ?? "").trim().toLowerCase();
        if (!INLINE_INPUT_CONTROL_TYPES.has(control) || property?.inlineEditVisible === false) return;
        if (!key) {
          throw new Error(`Inline input property contract '${type}' missing key at property index ${propertyIndex}.`);
        }
        const normalizeMethod = String(property?.normalizeMethod ?? "").trim();
        const normalizeValue = resolveInlineSelectNormalizeValue(normalizeMethod);
        const propertyFieldPath = `${type}.${key}`;
        const nextContract = getInputPropertyContract({ type, key, source: { property }, propertyFieldPath, normalizeMethodName: normalizeMethod });
        const existingSpec = specsByKey.get(key);
        if (!existingSpec) {
          specsByKey.set(key, { key, normalizeMethod, normalizeValue, contract: nextContract, componentTypes: [type] });
          return;
        }
        if (existingSpec.normalizeMethod !== normalizeMethod) {
          throw new Error(`Inline input property '${key}' normalize owner mismatch across element definitions.`);
        }
        if (!areInlineInputContractsEqual(existingSpec.contract, nextContract)) {
          throw new Error(`Inline input property '${key}' contract mismatch across element definitions.`);
        }
        if (!existingSpec.componentTypes.includes(type)) existingSpec.componentTypes.push(type);
      });
    });
    const specs = [];
    specsByKey.forEach((existingSpec) => specs.push(Object.freeze({
      key: existingSpec.key,
      componentTypes: Object.freeze(existingSpec.componentTypes.slice()),
      normalizeMethod: existingSpec.normalizeMethod,
      normalizeValue: existingSpec.normalizeValue,
      contract: existingSpec.contract
    })));
    return Object.freeze(specs);
  };
  const INLINE_INPUT_PROPERTY_SPECS = buildInlineInputPropertySpecs();
  const getInlineInputPropertySpec = (key) => {
    const normalizedKey = String(key ?? "").trim();
    const spec = INLINE_INPUT_PROPERTY_SPECS.find((entry) => entry.key === normalizedKey) ?? null;
    if (!spec) throw new Error(`Unsupported inline input property contract '${normalizedKey || "?"}'.`);
    return spec;
  };
  const getInlineInputPropertyContract = (key) => { const spec = getInlineInputPropertySpec(key); return spec.contract; };

  const getDefaultTextStyle = () => {
    const style = textStyleApi.getDefaultTextStyle();
    if (!style || typeof style !== "object") throw new Error("Schematic API getDefaultTextStyle() returned invalid payload.");
    return { font: textStyleApi.normalizeTextFont(style.font), size: textStyleApi.normalizeTextSize(style.size), bold: style.bold === true, italic: style.italic === true, underline: style.underline === true };
  };
  const normalizeSchematicTextStyle = (value, fallback = DEFAULT_SCHEMATIC_TEXT_STYLE) => {
    const base = fallback && typeof fallback === "object"
      ? fallback
      : DEFAULT_SCHEMATIC_TEXT_STYLE;
    const source = value && typeof value === "object"
      ? value
      : {};
    return {
      font: textStyleApi.normalizeTextFont(
        Object.prototype.hasOwnProperty.call(source, "font")
          ? source.font
          : base.font
      ),
      size: textStyleApi.normalizeTextSize(
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
  const listComponentDefaultTypes = () => {
    const raw = componentDefaultsApi.listComponentDefaultTypes();
    if (!Array.isArray(raw) || !raw.length) {
      throw new Error("Schematic API listComponentDefaultTypes() returned invalid payload.");
    }
    return raw
      .map((entry) => String(entry ?? "").trim().toUpperCase())
      .filter(Boolean);
  };
  const getBuiltInComponentDefaults = () => {
    return componentDefaultsApi.normalizeComponentDefaults(componentDefaultsApi.getBuiltInComponentDefaults());
  };
  const normalizeComponentDefaults = (value, fallback = getBuiltInComponentDefaults()) => {
    return componentDefaultsApi.normalizeComponentDefaults(value, fallback);
  };
  const getBuiltInToolDisplayDefaults = () => ({
    resistorStyle: componentDisplayApi.normalizeResistorStyle("zigzag"),
    groundVariant: componentDisplayApi.normalizeGroundVariant("earth"),
    groundColor: null,
    probeColor: null
  });
  const normalizeToolDisplayDefaults = (value, fallback = getBuiltInToolDisplayDefaults()) => {
    const source = value && typeof value === "object" ? value : {};
    const base = fallback && typeof fallback === "object" ? fallback : getBuiltInToolDisplayDefaults();
    return {
      resistorStyle: componentDisplayApi.normalizeResistorStyle(
        Object.prototype.hasOwnProperty.call(source, "resistorStyle")
          ? source.resistorStyle
          : base.resistorStyle
      ),
      groundVariant: componentDisplayApi.normalizeGroundVariant(
        Object.prototype.hasOwnProperty.call(source, "groundVariant")
          ? source.groundVariant
          : base.groundVariant
      ),
      groundColor: normalizeWireDefaultColor(
        Object.prototype.hasOwnProperty.call(source, "groundColor")
          ? source.groundColor
          : undefined,
        base.groundColor
      ),
      probeColor: normalizeWireDefaultColor(
        Object.prototype.hasOwnProperty.call(source, "probeColor")
          ? source.probeColor
          : undefined,
        base.probeColor
      )
    };
  };
  const normalizeWireDefaultColor = (value, fallback = null) => {
    if (value === undefined) {
      return normalizeNetColorValue(fallback) ?? null;
    }
    if (value === null || String(value ?? "").trim() === "") {
      return null;
    }
    const normalized = normalizeNetColorValue(value);
    if (normalized) {
      return normalized;
    }
    return normalizeNetColorValue(fallback) ?? null;
  };
  const getResistorDisplayTypeOptions = () => {
    const options = componentDisplayApi.listResistorStyles();
    return (Array.isArray(options) ? options : [])
      .map((value) => {
        const normalized = componentDisplayApi.normalizeResistorStyle(value);
        const label = normalized === "box" ? "Box" : "Zigzag";
        return { value: normalized, label };
      });
  };
  const getGroundDisplayTypeOptions = () => {
    const options = componentDisplayApi.listGroundVariants();
    return (Array.isArray(options) ? options : [])
      .map((value) => {
        const normalized = componentDisplayApi.normalizeGroundVariant(value);
        const label = normalized === "chassis"
          ? "Chassis"
          : (normalized === "signal" ? "Signal" : "Earth");
        return { value: normalized, label };
      });
  };
  const buildComponentDefaultSpecs = () => {
    const definitionMap = new Map(
      elementCatalogApi
        .listElementDefinitions()
        .map((definition) => [String(definition?.type ?? "").trim().toUpperCase(), definition])
    );
    return listComponentDefaultTypes().map((type) => {
      const definition = definitionMap.get(type) ?? null;
      const valueField = uiInlineEditorDomain.normalizeValueFieldMeta(elementCatalogApi.getValueFieldMeta(type));
      const defaultValueLabel = String(valueField?.label ?? "Value").trim() || "Value";
      const diodePresetProperty = Array.isArray(definition?.properties)
        ? definition.properties.find((property) => {
          const key = String(property?.key ?? "").trim();
          const control = String(property?.control ?? "").trim().toLowerCase();
          return key === "diodePreset" && control === "select";
        })
        : null;
      const diodeModelOptions = Array.isArray(diodePresetProperty?.options)
        ? diodePresetProperty.options
          .map((option) => ({
            value: String(option?.value ?? "").trim(),
            label: String(option?.label ?? "").trim()
          }))
          .filter((option) => option.value)
        : [];
      const isDiodeModelSelect = type === "D" && diodeModelOptions.length > 0;
      return Object.freeze({
        type,
        label: String(definition?.label ?? type).trim() || type,
        valueLabel: type === "D" ? "Model" : defaultValueLabel,
        valueControl: isDiodeModelSelect ? "select" : "text",
        valueOptions: isDiodeModelSelect ? Object.freeze(diodeModelOptions) : Object.freeze([]),
        unit: String(valueField?.unit ?? "").trim()
      });
    });
  };
  const COMPONENT_DEFAULT_SPECS = Object.freeze(buildComponentDefaultSpecs());
  const applySchematicTextStyleToEditor = () => {
    if (!schematicEditor || typeof schematicEditor.setSchematicTextStyle !== "function") {
      return;
    }
    schematicEditor.setSchematicTextStyle(schematicTextStyle);
  };
  const applyComponentDefaultsToEditor = () => {
    if (!schematicEditor || typeof schematicEditor.setComponentDefaults !== "function") {
      return;
    }
    schematicEditor.setComponentDefaults(componentDefaults);
  };
  const applyWireDefaultColorToEditor = () => {
    if (!schematicEditor || typeof schematicEditor.setWireDefaultColor !== "function") {
      return;
    }
    schematicEditor.setWireDefaultColor(wireDefaultColor);
  };
  const applyToolDisplayDefaultsToEditor = () => {
    if (!schematicEditor || typeof schematicEditor.setPlacementDefaults !== "function") {
      return;
    }
    schematicEditor.setPlacementDefaults(toolDisplayDefaults);
  };
  schematicTextStyle = normalizeSchematicTextStyle(schematicTextStyle);
  componentDefaults = normalizeComponentDefaults(componentDefaults);
  wireDefaultColor = normalizeWireDefaultColor(wireDefaultColor);
  toolDisplayDefaults = normalizeToolDisplayDefaults(toolDisplayDefaults);

  const normalizeSpdtThrow = (value) => uiInlineEditorDomain.normalizeSpdtThrow(value);
  const parseSpdtSwitchValueSafe = (value) => uiInlineEditorDomain.parseSpdtSwitchValueSafe(parseSpdtSwitchValue, value);
  const formatSpdtSwitchValue = (stateValue) => uiInlineEditorDomain.formatSpdtSwitchValue(stateValue);
  const parseSwitchComponentDefaultValue = (value) => {
    const parsed = parseSpdtSwitchValueSafe(value);
    return {
      ron: String(parsed?.ron ?? "0").trim() || "0",
      roff: String(parsed?.roff ?? "").trim()
    };
  };
  const formatSwitchComponentDefaultValue = (stateValue) => {
    const ron = String(stateValue?.ron ?? "").trim() || "0";
    const roff = String(stateValue?.roff ?? "").trim();
    const tokens = [];
    if (ron !== "0") {
      tokens.push(`ron=${ron}`);
    }
    if (roff) {
      tokens.push(`roff=${roff}`);
    }
    return tokens.join(" ");
  };
  const getDefaultBoxAnnotationStyle = (options) => {
    const style = boxAnnotationApi.getDefaultBoxAnnotationStyle(options);
    if (!style || typeof style !== "object") {
      throw new Error("Schematic API getDefaultBoxAnnotationStyle() returned invalid payload.");
    }
    return style;
  };
  const parseBoxAnnotationStyleValue = (value, options) => {
    const style = boxAnnotationApi.parseBoxAnnotationStyle(value, options);
    if (!style || typeof style !== "object") {
      throw new Error("Schematic API parseBoxAnnotationStyle() returned invalid payload.");
    }
    return style;
  };
  const formatBoxAnnotationStyleValue = (style, options) => {
    const text = String(boxAnnotationApi.formatBoxAnnotationStyle(style, options) ?? "").trim();
    if (!text) {
      throw new Error("Schematic API formatBoxAnnotationStyle() returned invalid payload.");
    }
    return text;
  };
  const parseArrowAnnotationStyleValue = (value, options) => {
    const style = arrowAnnotationApi.parseArrowAnnotationStyle(value, options);
    if (!style || typeof style !== "object") {
      throw new Error("Schematic API parseArrowAnnotationStyle() returned invalid payload.");
    }
    return style;
  };
  const formatArrowAnnotationStyleValue = (style, options) => {
    const text = String(arrowAnnotationApi.formatArrowAnnotationStyle(style, options) ?? "").trim();
    if (!text) {
      throw new Error("Schematic API formatArrowAnnotationStyle() returned invalid payload.");
    }
    return text;
  };
  const parseTextAnnotationStyleValue = (value, options) => {
    const style = textAnnotationApi.parseTextAnnotationStyle(value, options);
    if (!style || typeof style !== "object") {
      throw new Error("Schematic API parseTextAnnotationStyle() returned invalid payload.");
    }
    return style;
  };
  const formatTextAnnotationStyleValue = (style, options) => {
    const text = String(textAnnotationApi.formatTextAnnotationStyle(style, options) ?? "").trim();
    if (!text) {
      throw new Error("Schematic API formatTextAnnotationStyle() returned invalid payload.");
    }
    return text;
  };
  const createNetColorPicker = (input) => {
    const options = input && typeof input === "object" ? input : {};
    const rowAttribute = options.rowAttribute;
    const swatchAttribute = options.swatchAttribute;
    const onPick = options.onPick;
    const labelText = String(options.labelText ?? "Color:");
    const rowClassName = String(options.rowClassName ?? "inline-edit-row schematic-net-color-row").trim()
      || "inline-edit-row schematic-net-color-row";
    const decorateSwatch = typeof options.decorateSwatch === "function"
      ? options.decorateSwatch
      : () => { };
    const row = document.createElement("label");
    row.className = rowClassName;
    if (rowAttribute) {
      row.setAttribute(rowAttribute, "1");
    }
    const label = document.createElement("span");
    label.textContent = labelText;
    const swatchGrid = document.createElement("div");
    swatchGrid.className = "schematic-net-color-grid";
    const swatches = [];
    getNetColorPalette().forEach((color) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "schematic-net-color-swatch";
      button.style.setProperty("--swatch-color", color);
      button.setAttribute("aria-label", `NET color ${color}`);
      button.setAttribute("aria-pressed", "false");
      button.setAttribute("data-net-color-value", color);
      if (swatchAttribute) {
        button.setAttribute(swatchAttribute, color);
      }
      decorateSwatch(button, color);
      button.addEventListener("click", () => {
        if (typeof onPick === "function") {
          onPick(color);
        }
      });
      swatches.push(button);
      swatchGrid.appendChild(button);
    });
    row.append(label, swatchGrid);
    const setSelected = (value) => {
      const normalized = normalizeNetColorValue(value);
      swatches.forEach((button) => {
        const swatchColor = normalizeNetColorValue(
          swatchAttribute
            ? button.getAttribute(swatchAttribute)
            : button.getAttribute("data-net-color-value")
        );
        const selected = Boolean(normalized && swatchColor === normalized);
        button.classList.toggle("active", selected);
        button.setAttribute("aria-pressed", selected ? "true" : "false");
      });
    };
    return {
      row,
      swatches,
      setSelected
    };
  };

  const title = document.createElement("h1");
  title.textContent = "SpjutSim Circuits";
  title.className = "app-title";

  const titleBar = document.createElement("div");
  titleBar.className = "title-bar";
  titleBar.dataset.titleBar = "1";

  const statusEl = document.createElement("span");
  statusEl.className = "status";
  statusEl.textContent = state.status;
  statusEl.hidden = true;

  const menuBar = document.createElement("div");
  menuBar.className = "menu-bar";

  const fileStatus = document.createElement("div");
  fileStatus.className = "file-status";
  fileStatus.dataset.fileStatus = "1";
  const fileNameEl = document.createElement("span");
  fileNameEl.className = "file-name";
  fileNameEl.dataset.fileName = "1";
  fileStatus.append(fileNameEl);

  const titleBarLeft = document.createElement("div");
  titleBarLeft.className = "title-bar-left";
  titleBarLeft.append(title, menuBar);

  // fileStatus is appended to titleBarLeft (after menuBar) once menu groups are built

  titleBar.append(titleBarLeft, statusEl);

  const resetButton = document.createElement("button");
  resetButton.className = "secondary";
  resetButton.textContent = "Reset";
  resetButton.addEventListener("click", () => actions.onReset());

  const sampleEntryMap = new Map();
  const EXAMPLE_MENU_ACTION_PREFIX = "example-load-";
  const EXAMPLE_MENU_LOADING_ITEMS = [{ label: "Loading examples...", disabled: true }];
  const EXAMPLE_MENU_EMPTY_ITEMS = [{ label: "No examples available", disabled: true }];
  const EXAMPLE_MENU_ERROR_ITEMS = [{ label: "Failed to load examples", disabled: true }];
  let exampleMenuList = null;

  const normalizeExampleMenuEntry = (entry) => {
    const id = String(entry?.id ?? "").trim();
    if (!id) {
      return null;
    }
    const fallbackLabel = id.toUpperCase();
    const label = String(entry?.label ?? fallbackLabel).trim() || fallbackLabel;
    const file = String(entry?.file ?? "").trim();
    return {
      id,
      label,
      file
    };
  };

  const readSchematicExampleEntries = () => {
    const api = getSchematicApi();
    if (!api || typeof api.listSchematicExamples !== "function") {
      return [];
    }
    const rawEntries = api.listSchematicExamples();
    if (!Array.isArray(rawEntries)) {
      throw new Error("Schematic API listSchematicExamples() returned invalid data.");
    }
    return rawEntries
      .map((entry) => normalizeExampleMenuEntry(entry))
      .filter(Boolean);
  };

  const schematicPanel = document.createElement("div");
  schematicPanel.className = "workspace-panel schematic-panel";
  schematicPanel.dataset.schematicPanel = "1";
  schematicPanel.dataset.workspacePanel = "schematic";
  schematicPanel.classList.add("active");

  const schematicControls = document.createElement("div");
  schematicControls.className = "schematic-controls";

  const toolFilterWrap = document.createElement("div");
  toolFilterWrap.className = "controls schematic-tool-filter";
  const toolFilterLabel = document.createElement("span");
  toolFilterLabel.textContent = "Filter tools:";
  const toolFilterInput = document.createElement("input");
  toolFilterInput.type = "text";
  toolFilterInput.placeholder = "Search elements";
  toolFilterInput.className = "schematic-tool-filter-input";
  toolFilterInput.dataset.schematicToolFilter = "1";
  toolFilterWrap.append(toolFilterLabel, toolFilterInput);

  const schematicToolbar = document.createElement("div");
  schematicToolbar.className = "controls schematic-toolbar";

  let helpInteractions = null;
  const tooltipController = uiToolsUIModule.createTooltipController({
    container,
    getHelpEnabled: () => Boolean(helpInteractions?.isEnabled())
  });
  const tooltip = tooltipController.tooltip;
  const helpTooltip = tooltipController.helpTooltip;
  const showTooltipAt = tooltipController.showTooltipAt;
  const hideTooltip = tooltipController.hideTooltip;
  const showHelpTooltipAt = tooltipController.showHelpTooltipAt;
  const hideHelpTooltip = tooltipController.hideHelpTooltip;
  const attachTooltip = tooltipController.attachTooltip;
  const applyCustomTooltip = tooltipController.applyCustomTooltip;
  const positionPopoverInViewport = uiToolsUIModule.positionPopoverInViewport;
  const createToolIcon = (tool, isElement) => uiToolsUIModule.createToolIcon(tool, isElement);
  const createActionIcon = uiToolsUIModule.createActionIcon;
  const toolbarElementDefinitions = uiToolsUIModule.buildToolbarElementDefinitions(
    () => elementCatalogApi.listToolbarElementDefinitions()
  );
  const toolHelp = uiToolsUIModule.buildToolHelp(toolbarElementDefinitions);

  const helpEntries = uiHelpModule.buildDefaultHelpEntries();
  const applyHelpEntry = uiHelpModule.applyHelpEntry;

  const updateFileIndicators = () => {
    const name = documentMeta.fileName || "Untitled";
    const displayName = isDirty ? `${name} *` : name;
    fileNameEl.textContent = displayName;
    fileStatus.dataset.dirty = isDirty ? "1" : "0";
    fileStatus.dataset.saveState = isDirty ? "unsaved" : (lastSavedAt ? "saved" : "new");
  };

  const markDocumentDirty = () => {
    isDirty = true;
    updateFileIndicators();
  };

  const markDocumentSaved = () => {
    isDirty = false;
    lastSavedAt = new Date().toISOString();
    updateFileIndicators();
  };

  const resetSaveIndicators = (dirty = true) => {
    isDirty = dirty;
    if (dirty) {
      lastSavedAt = "";
    }
    updateFileIndicators();
  };

  const isProbeType = (type) => {
    const normalized = String(type ?? "").toUpperCase();
    return elementCatalogApi.isProbeComponentType(normalized);
  };

  const getValueFieldMeta = (type) => {
    return uiInlineEditorDomain.normalizeValueFieldMeta(elementCatalogApi.getValueFieldMeta(type));
  };
  const getInlineModeFlags = (input) => uiInlineEditorDomain.getInlineModeFlags(input);
  const getInlineFocusTarget = (input) => uiInlineEditorDomain.getInlineFocusTarget(input);
  const isInlineCloseCommitKey = (key) => uiInlineEditorDomain.isCloseCommitKey(key);

  const supportsComponentValueField = (type) => getValueFieldMeta(type).visible === true;

  const EXPORT_DIAGRAM_FORMATS = new Set(["png", "svg", "pdf", "jpeg"]);
  const normalizeExportFormat = (value) => {
    const fmt = String(value ?? "").trim().toLowerCase();
    return EXPORT_DIAGRAM_FORMATS.has(fmt) ? fmt : "png";
  };
  const exportDiagramPrefs = {
    format: normalizeExportFormat(
      persistencePreferences.readStringPreference(persistencePreferenceNames.EXPORT_DIAGRAM_FORMAT, "png")
    ),
    scale: persistencePreferences.readNumberPreference(persistencePreferenceNames.EXPORT_PNG_SCALE, 2),
    transparent: persistencePreferences.readBooleanPreference(
      persistencePreferenceNames.EXPORT_PNG_TRANSPARENT,
      false
    )
  };
  const clampPlotFontScale = (value) => uiPlotDomain.clampFontScale(value);
  const clampPlotLineWidth = (value) => uiPlotDomain.clampLineWidth(value);
  const PLOT_IP_DISPLAY_MODES = new Set(
    Array.isArray(uiPlotDomain.PLOT_IP_DISPLAY_MODES)
      ? uiPlotDomain.PLOT_IP_DISPLAY_MODES
      : ["same", "split"]
  );
  const normalizePlotIPDisplayMode = (value) => uiPlotDomain.normalizeIPDisplayMode(value);
  const plotPrefs = {
    fontScale: clampPlotFontScale(
      persistencePreferences.readNumberPreference(persistencePreferenceNames.PLOT_FONT_SCALE, 1)
    ),
    lineWidth: clampPlotLineWidth(
      persistencePreferences.readNumberPreference(persistencePreferenceNames.PLOT_LINE_WIDTH, 1)
    ),
    ipDisplay: normalizePlotIPDisplayMode(
      persistencePreferences.readStringPreference(persistencePreferenceNames.PLOT_IP_DISPLAY, "same")
    )
  };
  const EXPORT_PADDING = 16;
  const persistExportDiagramPrefs = () => {
    persistencePreferences.writePreference(persistencePreferenceNames.EXPORT_DIAGRAM_FORMAT, exportDiagramPrefs.format);
    persistencePreferences.writePreference(persistencePreferenceNames.EXPORT_PNG_SCALE, exportDiagramPrefs.scale);
    persistencePreferences.writePreference(
      persistencePreferenceNames.EXPORT_PNG_TRANSPARENT,
      exportDiagramPrefs.transparent
    );
  };
  const persistPlotPrefs = () => {
    persistencePreferences.writePreference(persistencePreferenceNames.PLOT_FONT_SCALE, plotPrefs.fontScale);
    persistencePreferences.writePreference(persistencePreferenceNames.PLOT_LINE_WIDTH, plotPrefs.lineWidth);
    persistencePreferences.writePreference(persistencePreferenceNames.PLOT_IP_DISPLAY, plotPrefs.ipDisplay);
  };
  const getExportScale = (displayScale) => {
    const safeDisplay = Number.isFinite(displayScale) && displayScale > 0 ? displayScale : 2;
    return safeDisplay * 2;
  };

  const schematicToolButtonEntries = [
    { tool: "select", label: "Select", name: "Select", shortcut: "S" },
    { tool: "wire", label: "Wire", name: "Wire", shortcut: "W" },
    ...toolbarElementDefinitions.map((entry) => ({
      tool: entry.type,
      label: entry.toolLabel,
      name: entry.toolName,
      shortcut: entry.shortcut,
      isElement: true
    }))
  ];
  const tooltipNameOnlyTools = new Set(["ARR", "BOX", "VM", "AM"]);
  const normalizeToolHotkeyKey = (value) => String(value ?? "").trim().toLowerCase();
  const normalizeShortcutToken = (value) => String(value ?? "").trim().toUpperCase();
  const parseShortcutMarker = (value) => {
    const title = String(value ?? "").trim();
    if (!title) {
      return "";
    }
    const match = title.match(/\(([^)]+)\)\s*$/);
    return match ? normalizeShortcutToken(match[1]) : "";
  };
  const buildSchematicToolHotkeyState = () => {
    const keyToTool = {};
    const shortcutByTool = {};
    const entries = [];
    const reservedKeys = new Set(["x", "y", "h"]);
    schematicToolButtonEntries.forEach((entry) => {
      const toolKey = normalizeToolHotkeyKey(entry.tool);
      const shortcutText = String(entry?.shortcut ?? "").trim();
      const key = shortcutText.toLowerCase();
      const normalizedTool = String(entry.tool ?? "").trim().toUpperCase();
      if (!/^[a-z0-9]$/.test(key)) {
        return;
      }
      if (reservedKeys.has(key)) {
        return;
      }
      if (tooltipNameOnlyTools.has(normalizedTool)) {
        return;
      }
      if (Object.prototype.hasOwnProperty.call(keyToTool, key)) {
        return;
      }
      keyToTool[key] = String(entry.tool ?? "");
      shortcutByTool[toolKey] = normalizeShortcutToken(shortcutText);
      entries.push({
        tool: String(entry.tool ?? ""),
        shortcut: normalizeShortcutToken(shortcutText),
        name: String(entry.name ?? entry.label ?? entry.tool ?? "").trim() || String(entry.tool ?? "")
      });
    });
    return Object.freeze({
      keyToTool: Object.freeze(keyToTool),
      shortcutByTool: Object.freeze(shortcutByTool),
      entries: Object.freeze(entries.map((entry) => Object.freeze(entry)))
    });
  };
  const schematicToolHotkeyState = buildSchematicToolHotkeyState();
  const getImplementedToolShortcut = (tool) => {
    return schematicToolHotkeyState.shortcutByTool[normalizeToolHotkeyKey(tool)] ?? "";
  };
  Object.entries(toolHelp).forEach(([toolKey, help]) => {
    const helpTitle = String(help?.title ?? "").trim();
    const marker = parseShortcutMarker(helpTitle);
    if (!marker) {
      return;
    }
    const implementedShortcut = getImplementedToolShortcut(toolKey);
    if (!implementedShortcut || marker !== implementedShortcut) {
      throw new Error(
        `Help title shortcut marker mismatch for tool '${toolKey}'. marker='${marker}' implemented='${implementedShortcut || "none"}'.`
      );
    }
  });

  const schematicToolButtons = schematicToolButtonEntries.map((entry) => {
    const button = document.createElement("button");
    button.className = "secondary";
    const icon = createToolIcon(entry.tool, entry.isElement);
    if (icon) {
      const labelSpan = document.createElement("span");
      labelSpan.className = "tool-label";
      labelSpan.textContent = entry.label;
      button.append(icon, labelSpan);
    } else {
      button.textContent = entry.label;
    }
    button.dataset.schematicTool = entry.tool;
    const shortcut = getImplementedToolShortcut(entry.tool);
    const toolName = entry.name ?? entry.label;
    button.setAttribute("aria-label", toolName);
    const normalizedTool = String(entry.tool ?? "").toUpperCase();
    const tooltipText = shortcut && !tooltipNameOnlyTools.has(normalizedTool)
      ? `${toolName} (${shortcut})`
      : toolName;
    attachTooltip(button, tooltipText);
    const help = toolHelp[entry.tool];
    if (help) {
      button.dataset.schematicHelpTitle = help.title;
      button.dataset.schematicHelpSummary = help.summary;
      button.dataset.schematicHelpDefinition = help.definition;
    }
    if (entry.isElement) {
      button.dataset.schematicElementTool = "1";
      button.dataset.schematicToolLabel = entry.label.toLowerCase();
      button.dataset.schematicToolName = String(entry.name ?? entry.label).toLowerCase();
    }
    return button;
  });
  const elementToolButtons = schematicToolButtons.filter((button) => button.dataset.schematicElementTool === "1");
  const listImplementedHotkeys = () => {
    const mapEntries = (entries) => {
      return entries
        .map((entry) => ({
          shortcut: String(entry?.shortcut ?? "").trim(),
          description: String(entry?.description ?? "").trim()
        }))
        .filter((entry) => entry.shortcut && entry.description);
    };
    return [
      {
        id: "file",
        label: "File",
        entries: mapEntries([
          { shortcut: HOTKEY_SHORTCUTS.open, description: "Open schematic" },
          { shortcut: HOTKEY_SHORTCUTS.save, description: "Save schematic" },
          { shortcut: HOTKEY_SHORTCUTS.saveAs, description: "Save schematic as..." },
          { shortcut: HOTKEY_SHORTCUTS.settings, description: "Open settings" }
        ])
      },
      {
        id: "edit",
        label: "Edit",
        entries: mapEntries([
          { shortcut: HOTKEY_SHORTCUTS.edit, description: "Edit selected component" },
          { shortcut: HOTKEY_SHORTCUTS.selectAll, description: "Select all components and wires" },
          { shortcut: HOTKEY_SHORTCUTS.delete, description: "Delete selection" },
          { shortcut: HOTKEY_SHORTCUTS.copy, description: "Copy selection" },
          { shortcut: HOTKEY_SHORTCUTS.cut, description: "Cut selection" },
          { shortcut: HOTKEY_SHORTCUTS.paste, description: "Paste selection" },
          { shortcut: HOTKEY_SHORTCUTS.rotateCw, description: "Rotate selection clockwise" },
          { shortcut: HOTKEY_SHORTCUTS.rotateCcw, description: "Rotate selection counter-clockwise" },
          { shortcut: HOTKEY_SHORTCUTS.flipH, description: "Flip selection horizontally" },
          { shortcut: HOTKEY_SHORTCUTS.flipV, description: "Flip selection vertically" },
          { shortcut: HOTKEY_SHORTCUTS.undo, description: "Undo" },
          { shortcut: HOTKEY_SHORTCUTS.redo, description: "Redo" },
          { shortcut: HOTKEY_SHORTCUTS.redoAlt, description: "Redo (alternate)" }
        ])
      },
      {
        id: "schematic",
        label: "Schematic",
        entries: mapEntries([
          { shortcut: HOTKEY_SHORTCUTS.runSimulation, description: "Run simulation" },
          { shortcut: HOTKEY_SHORTCUTS.escape, description: "Cancel wire step or return to Select tool" }
        ])
      },
      {
        id: "tools",
        label: "Tools",
        entries: mapEntries(
          schematicToolHotkeyState.entries.map((entry) => ({
            shortcut: entry.shortcut,
            description: `Select ${entry.name} tool`
          }))
        )
      },
      {
        id: "help",
        label: "Help",
        entries: mapEntries([
          { shortcut: HOTKEY_SHORTCUTS.toggleHelp, description: "Toggle hover info" }
        ])
      }
    ];
  };


  const normalizeGridSize = (value) => {
    return uiToolsDomain.normalizeGridSize(value);
  };
  const normalizeToolFilterQuery = (value) => {
    return uiToolsDomain.normalizeToolFilterQuery(value);
  };
  const shouldShowToolButton = (query, label, name) => {
    return uiToolsDomain.shouldShowToolButton(query, label, name);
  };

  const gridSizeInput = document.createElement("select");
  gridSizeInput.className = "schematic-grid-input";
  gridSizeInput.dataset.schematicGridSize = "1";
  gridSizeInput.dataset.schematicHelpTitle = helpEntries.gridSize.title;
  gridSizeInput.dataset.schematicHelpSummary = helpEntries.gridSize.summary;
  gridSizeInput.dataset.schematicHelpDefinition = helpEntries.gridSize.definition;
  ALLOWED_GRID_SIZES.forEach((size) => {
    const option = document.createElement("option");
    option.value = String(size);
    option.textContent = String(size);
    gridSizeInput.appendChild(option);
  });
  gridSizeInput.value = String(schematicGrid.size);

  const gridToggleButton = document.createElement("button");
  gridToggleButton.className = "secondary icon-button schematic-grid-toggle";
  gridToggleButton.dataset.schematicGrid = "1";
  gridToggleButton.setAttribute("aria-pressed", schematicGrid.visible ? "true" : "false");
  gridToggleButton.dataset.schematicHelpTitle = helpEntries.gridShow.title;
  gridToggleButton.dataset.schematicHelpSummary = helpEntries.gridShow.summary;
  gridToggleButton.dataset.schematicHelpDefinition = helpEntries.gridShow.definition;

  const zoomFitButton = document.createElement("button");
  zoomFitButton.className = "secondary icon-button schematic-zoom-fit";
  zoomFitButton.dataset.schematicZoomFit = "1";
  zoomFitButton.dataset.schematicHelpTitle = helpEntries.zoomFit.title;
  zoomFitButton.dataset.schematicHelpSummary = helpEntries.zoomFit.summary;
  zoomFitButton.dataset.schematicHelpDefinition = helpEntries.zoomFit.definition;

  const schematicCommandBar = document.createElement("div");
  schematicCommandBar.className = "schematic-command-bar";
  schematicCommandBar.dataset.schematicCommandBar = "1";
  const schematicCommandGlobal = document.createElement("div");
  schematicCommandGlobal.className = "schematic-command-group";
  const schematicCommandEdit = document.createElement("div");
  schematicCommandEdit.className = "schematic-command-group";

  const undoActionButton = document.createElement("button");
  undoActionButton.className = "secondary icon-button schematic-action-button";
  undoActionButton.dataset.schematicAction = "undo";
  undoActionButton.dataset.schematicCommand = "undo";
  undoActionButton.dataset.schematicHelpTitle = helpEntries.undo.title;
  undoActionButton.dataset.schematicHelpSummary = helpEntries.undo.summary;
  undoActionButton.dataset.schematicHelpDefinition = helpEntries.undo.definition;
  const redoActionButton = document.createElement("button");
  redoActionButton.className = "secondary icon-button schematic-action-button";
  redoActionButton.dataset.schematicAction = "redo";
  redoActionButton.dataset.schematicCommand = "redo";
  redoActionButton.dataset.schematicHelpTitle = helpEntries.redo.title;
  redoActionButton.dataset.schematicHelpSummary = helpEntries.redo.summary;
  redoActionButton.dataset.schematicHelpDefinition = helpEntries.redo.definition;
  const runActionButton = document.createElement("button");
  runActionButton.className = "secondary icon-button schematic-action-button";
  runActionButton.dataset.schematicCommand = "run";
  runActionButton.dataset.actionIntent = "run";
  runActionButton.dataset.schematicHelpTitle = helpEntries.runSimulation.title;
  runActionButton.dataset.schematicHelpSummary = helpEntries.runSimulation.summary;
  runActionButton.dataset.schematicHelpDefinition = helpEntries.runSimulation.definition;
  const exportActionButton = document.createElement("button");
  exportActionButton.className = "secondary icon-button schematic-action-button";
  exportActionButton.dataset.schematicCommand = "export";
  exportActionButton.dataset.schematicHelpTitle = helpEntries.exportPng.title;
  exportActionButton.dataset.schematicHelpSummary = helpEntries.exportPng.summary;
  exportActionButton.dataset.schematicHelpDefinition = helpEntries.exportPng.definition;
  const rotateCwButton = document.createElement("button");
  rotateCwButton.className = "secondary icon-button schematic-action-button";
  rotateCwButton.dataset.schematicAction = "rotate-cw";
  rotateCwButton.dataset.schematicHelpTitle = helpEntries.rotateCw.title;
  rotateCwButton.dataset.schematicHelpSummary = helpEntries.rotateCw.summary;
  rotateCwButton.dataset.schematicHelpDefinition = helpEntries.rotateCw.definition;
  const rotateCcwButton = document.createElement("button");
  rotateCcwButton.className = "secondary icon-button schematic-action-button";
  rotateCcwButton.dataset.schematicAction = "rotate-ccw";
  rotateCcwButton.dataset.schematicHelpTitle = helpEntries.rotateCcw.title;
  rotateCcwButton.dataset.schematicHelpSummary = helpEntries.rotateCcw.summary;
  rotateCcwButton.dataset.schematicHelpDefinition = helpEntries.rotateCcw.definition;
  const flipHButton = document.createElement("button");
  flipHButton.className = "secondary icon-button schematic-action-button";
  flipHButton.dataset.schematicAction = "flip-h";
  flipHButton.dataset.schematicHelpTitle = helpEntries.flipH.title;
  flipHButton.dataset.schematicHelpSummary = helpEntries.flipH.summary;
  flipHButton.dataset.schematicHelpDefinition = helpEntries.flipH.definition;
  const flipVButton = document.createElement("button");
  flipVButton.className = "secondary icon-button schematic-action-button";
  flipVButton.dataset.schematicAction = "flip-v";
  flipVButton.dataset.schematicHelpTitle = helpEntries.flipV.title;
  flipVButton.dataset.schematicHelpSummary = helpEntries.flipV.summary;
  flipVButton.dataset.schematicHelpDefinition = helpEntries.flipV.definition;
  const duplicateActionButton = document.createElement("button");
  duplicateActionButton.className = "secondary icon-button schematic-action-button";
  duplicateActionButton.dataset.schematicAction = "duplicate";
  duplicateActionButton.dataset.schematicHelpTitle = helpEntries.duplicate.title;
  duplicateActionButton.dataset.schematicHelpSummary = helpEntries.duplicate.summary;
  duplicateActionButton.dataset.schematicHelpDefinition = helpEntries.duplicate.definition;
  const deleteActionButton = document.createElement("button");
  deleteActionButton.className = "secondary icon-button schematic-action-button";
  deleteActionButton.dataset.schematicAction = "delete";
  deleteActionButton.dataset.actionIntent = "danger";
  deleteActionButton.dataset.schematicHelpTitle = helpEntries.delete.title;
  deleteActionButton.dataset.schematicHelpSummary = helpEntries.delete.summary;
  deleteActionButton.dataset.schematicHelpDefinition = helpEntries.delete.definition;
  const clearProbesActionButton = document.createElement("button");
  clearProbesActionButton.className = "secondary icon-button schematic-action-button";
  clearProbesActionButton.dataset.schematicAction = "clear-probes";
  clearProbesActionButton.dataset.actionIntent = "danger";
  clearProbesActionButton.dataset.schematicHelpTitle = helpEntries.clearProbes.title;
  clearProbesActionButton.dataset.schematicHelpSummary = helpEntries.clearProbes.summary;
  clearProbesActionButton.dataset.schematicHelpDefinition = helpEntries.clearProbes.definition;

  const applyActionButtonIcon = (button, actionId, tooltipText) => {
    if (!button) {
      return;
    }
    button.textContent = "";
    const icon = createActionIcon(actionId);
    if (icon) {
      button.appendChild(icon);
    }
    applyCustomTooltip(button, tooltipText);
  };
  applyActionButtonIcon(undoActionButton, "undo", `Undo (${HOTKEY_SHORTCUTS.undo})`);
  applyActionButtonIcon(redoActionButton, "redo", `Redo (${HOTKEY_SHORTCUTS.redo})`);
  applyActionButtonIcon(runActionButton, "run", `Run Simulation (${HOTKEY_SHORTCUTS.runSimulation})`);
  applyActionButtonIcon(exportActionButton, "export", "Export Diagram");
  applyActionButtonIcon(rotateCwButton, "rotate-cw", `Rotate CW (${HOTKEY_SHORTCUTS.rotateCw})`);
  applyActionButtonIcon(rotateCcwButton, "rotate-ccw", `Rotate CCW (${HOTKEY_SHORTCUTS.rotateCcw})`);
  applyActionButtonIcon(flipHButton, "flip-h", `Flip H (${HOTKEY_SHORTCUTS.flipH})`);
  applyActionButtonIcon(flipVButton, "flip-v", `Flip V (${HOTKEY_SHORTCUTS.flipV})`);
  applyActionButtonIcon(duplicateActionButton, "duplicate", "Duplicate");
  applyActionButtonIcon(deleteActionButton, "delete", "Delete (Del)");
  applyActionButtonIcon(clearProbesActionButton, "clear-probes", "Clear Probes");
  applyActionButtonIcon(gridToggleButton, "grid", "Toggle Grid");
  applyActionButtonIcon(zoomFitButton, "zoom-fit", "Zoom to Fit");

  const schematicStatusBar = document.createElement("div");
  schematicStatusBar.className = "schematic-status-bar";
  schematicStatusBar.dataset.schematicStatusBar = "1";

  schematicToolbar.append(
    ...schematicToolButtons
  );
  schematicCommandGlobal.append(
    undoActionButton,
    redoActionButton,
    runActionButton,
    exportActionButton
  );
  schematicCommandEdit.append(
    rotateCwButton,
    rotateCcwButton,
    flipHButton,
    flipVButton,
    duplicateActionButton,
    deleteActionButton,
    clearProbesActionButton
  );
  schematicCommandBar.append(
    schematicCommandGlobal,
    schematicCommandEdit
  );
  schematicStatusBar.append(
    gridToggleButton,
    gridSizeInput,
    zoomFitButton
  );

  const schematicCanvasWrap = document.createElement("div");
  schematicCanvasWrap.className = "schematic-canvas";

  const schematicSimulation = document.createElement("div");
  schematicSimulation.className = "schematic-simulation";

  const { simulationHeader, schematicRunButton } = uiSimulationConfigModule.createSimulationHeader({
    resetButton,
    applyHelpEntry,
    helpEntries
  });

  const { configContainer, configSections } = uiSimulationConfigModule.createConfigSections({
    simulationKinds,
    applyHelpEntry,
    helpEntries
  });
  const configInputs = { dc: {}, tran: {}, ac: {} };
  const configHelpMap = uiHelpModule.buildConfigHelpMap();
  const getConfigHelpEntry = (kind, key, labelText) => uiHelpModule.getConfigHelpEntry(configHelpMap, kind, key, labelText);

  const createConfigField = (kind, key, labelText, placeholder, options = {}) => uiSimulationConfigModule.createConfigField({
    kind,
    key,
    labelText,
    placeholder,
    options,
    configSections,
    configInputs,
    simulationConfig,
    getSimulationConfig: () => simulationConfig,
    applyHelpEntry,
    getConfigHelpEntry,
    refreshSchematicNetlist,
    getRefreshSchematicNetlist: () => refreshSchematicNetlist,
    queueAutosave
  });

  const sourceInputBindings = [];
  const sourceGuidanceNote = document.createElement("p");
  sourceGuidanceNote.className = "schematic-config-note";
  sourceGuidanceNote.dataset.schematicSourceGuidance = "1";
  sourceGuidanceNote.hidden = true;
  sourceGuidanceNote.textContent = "";

  const createSourceConfigField = (kind, key, labelText) => uiSimulationConfigModule.createSourceConfigField({
    kind,
    key,
    labelText,
    createConfigField,
    sourceInputBindings
  });

  const syncSourceInputOptions = (compileInfo) => uiSimulationConfigModule.syncSourceInputOptions({
    compileInfo,
    sourceInputBindings,
    simulationConfig,
    sourceComponentTypes: SOURCE_COMPONENT_TYPES,
    sourceGuidanceNote
  });

  const tranWaveGroups = {};

  const buildTranSourceValue = () => uiSimulationConfigModule.buildTranSourceValue(simulationConfig.tran);

  const updateTranSourceValue = () => {
    const next = buildTranSourceValue();
    simulationConfig.tran.sourceValue = next;
    const previewInput = configInputs.tran?.sourceValue;
    if (previewInput) {
      previewInput.value = next;
    }
    return next;
  };

  const refreshTranSource = () => {
    updateTranSourceValue();
    refreshSchematicNetlist();
  };

  const updateTranWaveformVisibility = () =>
    uiSimulationConfigModule.updateTranWaveformVisibility(tranWaveGroups, simulationConfig.tran.sourceMode);

  const opNote = document.createElement("p");
  opNote.className = "schematic-config-note";
  opNote.textContent = "Running OP will append a single `.op` command to the compiled circuit.";
  applyHelpEntry(opNote, {
    title: "Operating Point Analysis",
    summary: "Runs a DC operating point solve (`.op`).",
    definition: "Reports node voltages and source currents with no sweep or time-domain stepping."
  });
  configSections.op.append(opNote);

  createSourceConfigField("dc", "source", "Sweep source");
  createConfigField("dc", "start", "Start value", "0");
  createConfigField("dc", "stop", "Stop value", "10");
  createConfigField("dc", "step", "Step value", "1");

  createSourceConfigField("tran", "source", "Source");
  uiSimulationConfigModule.createTranSourceModeField({
    configSections,
    configInputs,
    simulationConfig,
    getSimulationConfig: () => simulationConfig,
    configHelpMap,
    applyHelpEntry,
    updateTranWaveformVisibility,
    refreshTranSource,
    queueAutosave
  });

  const createTranGroup = (mode) => uiSimulationConfigModule.createTranWaveGroup({
    mode,
    tranWaveGroups,
    configSections
  });

  const tranPulseGroup = createTranGroup("pulse");
  createConfigField("tran", "pulseLow", "Low", "0", { parent: tranPulseGroup, onInput: refreshTranSource });
  createConfigField("tran", "pulseHigh", "High", "5", { parent: tranPulseGroup, onInput: refreshTranSource });
  createConfigField("tran", "pulseDelay", "Delay", "1m", { parent: tranPulseGroup, onInput: refreshTranSource });
  createConfigField("tran", "pulseRise", "Rise", "1u", { parent: tranPulseGroup, onInput: refreshTranSource });
  createConfigField("tran", "pulseFall", "Fall", "1u", { parent: tranPulseGroup, onInput: refreshTranSource });
  createConfigField("tran", "pulseWidth", "Width", "5m", { parent: tranPulseGroup, onInput: refreshTranSource });
  createConfigField("tran", "pulsePeriod", "Period", "10m", { parent: tranPulseGroup, onInput: refreshTranSource });

  const tranDcGroup = createTranGroup("dc");
  createConfigField("tran", "dcValue", "DC value", "5", { parent: tranDcGroup, onInput: refreshTranSource });

  const tranSineGroup = createTranGroup("sine");
  createConfigField("tran", "sineOffset", "Offset", "0", { parent: tranSineGroup, onInput: refreshTranSource });
  createConfigField("tran", "sineAmplitude", "Amplitude", "1", { parent: tranSineGroup, onInput: refreshTranSource });
  createConfigField("tran", "sineFreq", "Frequency", "1k", { parent: tranSineGroup, onInput: refreshTranSource });
  createConfigField("tran", "sineDelay", "Delay", "0", { parent: tranSineGroup, onInput: refreshTranSource });
  createConfigField("tran", "sineDamping", "Damping", "0", { parent: tranSineGroup, onInput: refreshTranSource });
  createConfigField("tran", "sinePhase", "Phase", "0", { parent: tranSineGroup, onInput: refreshTranSource });

  const tranPwlGroup = createTranGroup("pwl");
  createConfigField("tran", "pwlPoints", "PWL points", "0 0\n1m 5\n2m 0", {
    parent: tranPwlGroup,
    tag: "textarea",
    rows: 3,
    className: "schematic-config-textarea",
    onInput: refreshTranSource
  });

  const tranCustomGroup = createTranGroup("custom");
  createConfigField("tran", "customValue", "Custom value", "pulse(0 5 1m 1u 1u 5m 10m)", {
    parent: tranCustomGroup,
    onInput: refreshTranSource
  });
  updateTranWaveformVisibility();
  updateTranSourceValue();
  createConfigField("tran", "step", "Time step", "0.1m");
  createConfigField("tran", "stop", "Stop time", "10m");
  createConfigField("tran", "start", "Start time", "0");
  createConfigField("tran", "maxStep", "Max step", "0.01m");

  uiSimulationConfigModule.createAcSweepField({
    configSections,
    configInputs,
    simulationConfig,
    getSimulationConfig: () => simulationConfig,
    configHelpMap,
    applyHelpEntry,
    refreshSchematicNetlist,
    getRefreshSchematicNetlist: () => refreshSchematicNetlist,
    queueAutosave
  });

  createSourceConfigField("ac", "source", "Source");
  createConfigField("ac", "sourceValue", "Source value", "ac 1");
  createConfigField("ac", "points", "Points per decade", "10");
  createConfigField("ac", "start", "Start freq", "1");
  createConfigField("ac", "stop", "Stop freq", "100k");
  configContainer.appendChild(sourceGuidanceNote);

  const {
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
  } = uiNetlistPanelModule.createSimulationNetlistPanel({
    applyHelpEntry,
    helpEntries,
    createActionIcon,
    applyCustomTooltip
  });

  schematicSimulation.append(
    simulationHeader,
    configContainer,
    saveRow,
    netlistPreambleLabel,
    netlistPreambleInput,
    netlistPreviewHeader,
    netlistPreviewView,
    netlistPreview,
    netlistWarnings
  );

  toolFilterInput.addEventListener("input", () => {
    const query = normalizeToolFilterQuery(toolFilterInput.value);
    elementToolButtons.forEach((button) => {
      const label = button.dataset.schematicToolLabel ?? "";
      const name = button.dataset.schematicToolName ?? "";
      button.hidden = !shouldShowToolButton(query, label, name);
    });
  });

  let workspaceHelpToggleButton = null;
  helpInteractions = uiHelpModule.createHelpInteractionController({
    showHelpTooltipAt,
    hideHelpTooltip,
    isHelpTooltipVisible: () => helpTooltip.style.display !== "none"
  });
  const isHelpEnabled = () => helpInteractions.isEnabled();
  const updateHelpMenuLabel = () => {
    helpInteractions.updateHelpMenuLabel();
  };
  const updateWorkspaceHelpToggleState = () => {
    helpInteractions.setWorkspaceHelpToggleButton(workspaceHelpToggleButton);
  };
  const setHelpEnabled = (next) => {
    helpInteractions.setEnabled(next);
  };
  const toggleHelpEnabled = () => {
    helpInteractions.toggleEnabled();
  };
  const setSelectedHelpTarget = (target) => {
    helpInteractions.setSelectedHelpTarget(target);
  };
  const registerHelpTarget = (target) => {
    helpInteractions.registerHelpTarget(target);
  };
  const registerAllHelpTargets = (root) => {
    helpInteractions.registerAllHelpTargets(root);
  };
  registerAllHelpTargets(schematicControls);
  registerAllHelpTargets(schematicSimulation);

  schematicControls.append(toolFilterWrap, schematicToolbar);
  const schematicWorkspace = document.createElement("div");
  schematicWorkspace.className = "workspace-split";
  const schematicTools = document.createElement("div");
  schematicTools.className = "workspace-tools";
  schematicTools.dataset.workspaceTools = "schematic";
  const schematicToolsPanel = document.createElement("div");
  schematicToolsPanel.className = "workspace-tools-panel workspace-tools-panel-schematic";
  schematicToolsPanel.dataset.workspaceToolsPanel = "schematic";
  schematicSimulation.hidden = true;
  const schematicMain = document.createElement("div");
  schematicMain.className = "workspace-main";
  const simPanel = document.createElement("div");
  simPanel.className = "workspace-sim-panel";
  simPanel.hidden = true;
  simPanel.append(schematicSimulation);
  schematicToolsPanel.append(schematicControls);
  schematicTools.append(schematicToolsPanel);
  schematicCanvasWrap.append(schematicStatusBar);
  schematicWorkspace.append(schematicTools, schematicMain, simPanel);
  schematicPanel.append(schematicWorkspace);

  const errorEl = document.createElement("div");
  errorEl.className = "section";
  errorEl.hidden = true;

  const plotFontOptions = [
    { value: 0.8, label: "80%" },
    { value: 1, label: "100%" },
    { value: 1.2, label: "120%" },
    { value: 1.4, label: "140%" },
    { value: 1.6, label: "160%" }
  ];
  const plotLineOptions = [
    { value: 1, label: "1px" },
    { value: 2, label: "2px" },
    { value: 3, label: "3px" },
    { value: 4, label: "4px" }
  ];
  const normalizePlotFontScale = (value) => uiPlotControlsModule.normalizePlotFontScale(
    value,
    clampPlotFontScale,
    plotFontOptions.map((option) => option.value),
    1
  );
  const normalizePlotLineWidth = (value) => uiPlotControlsModule.normalizePlotLineWidth(
    value,
    clampPlotLineWidth,
    plotLineOptions.map((option) => option.value),
    1
  );
  const normalizedFontScale = normalizePlotFontScale(plotPrefs.fontScale);
  const normalizedLineWidth = normalizePlotLineWidth(plotPrefs.lineWidth);
  if (normalizedFontScale !== plotPrefs.fontScale || normalizedLineWidth !== plotPrefs.lineWidth) {
    plotPrefs.fontScale = normalizedFontScale;
    plotPrefs.lineWidth = normalizedLineWidth;
    persistPlotPrefs();
  }
  let refreshPlotResults = () => {};
  const plotFontSelects = [];
  const plotLineSelects = [];
  const syncPlotStyleControls = () =>
    uiPlotControlsModule.syncPlotStyleControls(plotPrefs, plotFontSelects, plotLineSelects);
  const setPlotFontScale = (value) => {
    const next = normalizePlotFontScale(value);
    if (next === plotPrefs.fontScale) {
      syncPlotStyleControls();
      return;
    }
    plotPrefs.fontScale = next;
    persistPlotPrefs();
    syncPlotStyleControls();
    refreshPlotResults();
  };
  const setPlotLineWidth = (value) => {
    const next = normalizePlotLineWidth(value);
    if (next === plotPrefs.lineWidth) {
      syncPlotStyleControls();
      return;
    }
    plotPrefs.lineWidth = next;
    persistPlotPrefs();
    syncPlotStyleControls();
    refreshPlotResults();
  };
  const plotIPDisplayModeOptions = [
    { value: "same", label: "Same plot" },
    { value: "split", label: "Separate plots" }
  ];
  const plotIPDisplaySelects = [];
  const syncPlotDisplayControls = () =>
    uiPlotControlsModule.syncPlotDisplayControls(plotPrefs, plotIPDisplaySelects);
  const setPlotIPDisplay = (value) => {
    const next = normalizePlotIPDisplayMode(value);
    if (next === plotPrefs.ipDisplay) {
      return;
    }
    plotPrefs.ipDisplay = next;
    persistPlotPrefs();
    syncPlotDisplayControls();
    refreshPlotResults();
  };
  const createPlotStyleControls = () => uiPlotControlsModule.createPlotStyleControls({
    plotFontOptions,
    plotLineOptions,
    plotIPDisplayModeOptions,
    plotPrefs,
    plotFontSelects,
    plotLineSelects,
    plotIPDisplaySelects,
    setPlotFontScale,
    setPlotLineWidth,
    setPlotIPDisplay,
    syncPlotStyleControls,
    syncPlotDisplayControls
  });

  const createPlotSettingsPopover = (kind, contentNodes) => uiPlotControlsModule.createPlotSettingsPopover({
    kind,
    contentNodes,
    applyCustomTooltip,
    positionPopoverInViewport
  });

  const createPlotCanvasBundle = (plotKind, tooltipKind = plotKind, width = 720, height = 320) =>
    uiPlotControlsModule.createPlotCanvasBundle({
      plotKind,
      tooltipKind,
      width,
      height
    });

  const createSinglePlotSection = (options) => uiPlotControlsModule.createSinglePlotSection({
    options,
    showGrid,
    setShowGrid: (next) => {
      showGrid = next;
    },
    queueAutosave,
    dedupeSignalList: (signals) => uiMeasurementsDomain.dedupeSignalList(signals),
    getSelectedSignals: (select) => uiMeasurementsDomain.getSelectedSignals(select),
    setActiveTab,
    createPlotStyleControls,
    createPlotSettingsPopover,
    createPlotCanvasBundle,
    applyHelpEntry
  });

  const resultsSection = document.createElement("div");
  resultsSection.className = "section";
  const resultsTitle = document.createElement("h2");
  resultsTitle.className = "results-section-title";
  resultsTitle.textContent = "DC Results";
  const resultsMeta = document.createElement("div");
  resultsMeta.className = "results-meta";
  const opControls = document.createElement("div");
  opControls.className = "controls analysis-controls";
  const opExportCsvButton = document.createElement("button");
  opExportCsvButton.className = "secondary";
  opExportCsvButton.textContent = "Export CSV";
  opExportCsvButton.dataset.exportCsv = "op";
  applyHelpEntry(opExportCsvButton, helpEntries.exportCsvOp);
  opControls.append(opExportCsvButton);

  const resultsGrid = document.createElement("div");
  resultsGrid.className = "results-grid";

  const nodesCard = document.createElement("div");
  const nodesTitle = document.createElement("h3");
  nodesTitle.className = "results-subtitle";
  nodesTitle.textContent = "Node Voltages";
  const nodesTable = document.createElement("table");

  const currentsCard = document.createElement("div");
  const currentsTitle = document.createElement("h3");
  currentsTitle.className = "results-subtitle";
  currentsTitle.textContent = "Source Currents";
  const currentsTable = document.createElement("table");

  nodesCard.append(nodesTitle, nodesTable);
  currentsCard.append(currentsTitle, currentsTable);

  const measurementsSection = document.createElement("div");
  measurementsSection.className = "measurements-section";
  const measurementsHeader = document.createElement("div");
  measurementsHeader.className = "measurements-header";
  const measurementsTitle = document.createElement("h3");
  measurementsTitle.className = "results-subtitle";
  measurementsTitle.textContent = "Probes";
  const clearProbesButton = document.createElement("button");
  clearProbesButton.type = "button";
  clearProbesButton.className = "secondary measurement-clear-probes";
  clearProbesButton.dataset.probeClearAll = "1";
  clearProbesButton.dataset.actionIntent = "danger";
  clearProbesButton.textContent = "Clear Probes";
  clearProbesButton.hidden = true;
  const measurementsList = document.createElement("table");
  measurementsList.className = "measurements-list";
  measurementsHeader.append(measurementsTitle, clearProbesButton);
  measurementsSection.append(measurementsHeader, measurementsList);
  resultsGrid.append(nodesCard, currentsCard, measurementsSection);
  resultsSection.append(resultsTitle, opControls, resultsMeta, resultsGrid);

  const dcPlotSection = createSinglePlotSection({
    kind: "dc",
    metaClass: "dc-meta",
    exportCsvHelp: helpEntries.exportCsvDc,
    includeDisplayModeControls: true,
    onGridChange: () => {
      renderDcResults(state.dcResults);
    },
    onSignalChange: (selected) => {
      if (!state.dcResults || typeof state.dcResults !== "object") {
        return;
      }
      state.dcResults.selected = dedupeSignalList(selected);
      renderDcResults(state.dcResults);
      queueAutosave(false);
    }
  });
  const {
    section: dcSection,
    meta: dcMeta,
    gridCheck: gridCheckDc,
    signalSelect,
    exportButton: dcExportButton,
    exportCsvButton: dcExportCsvButton,
    canvas: dcCanvas,
    wrap: dcPlotWrap,
    overlay: dcOverlay,
    tooltip: dcTooltip,
    currentCanvas: dcCurrentCanvas,
    currentWrap: dcCurrentWrap,
    currentOverlay: dcCurrentOverlay,
    currentTooltip: dcCurrentTooltip,
    powerCanvas: dcPowerCanvas,
    powerWrap: dcPowerWrap,
    powerOverlay: dcPowerOverlay,
    powerTooltip: dcPowerTooltip
  } = dcPlotSection;

  const tranPlotSection = createSinglePlotSection({
    kind: "tran",
    metaClass: "tran-meta",
    exportCsvHelp: helpEntries.exportCsvTran,
    includeDisplayModeControls: true,
    onGridChange: () => {
      renderDcResults(state.dcResults);
      renderTranResults(state.tranResults);
    },
    onSignalChange: (selected) => {
      if (!state.tranResults || typeof state.tranResults !== "object") {
        return;
      }
      state.tranResults.selected = dedupeSignalList(selected);
      renderTranResults(state.tranResults);
      queueAutosave(false);
    }
  });
  const {
    section: tranSection,
    meta: tranMeta,
    gridCheck: gridCheckT,
    signalSelect: signalSelectT,
    exportButton: tranExportButton,
    exportCsvButton: tranExportCsvButton,
    canvas: tranCanvas,
    wrap: tranPlotWrap,
    overlay: tranOverlay,
    tooltip: tranTooltip,
    currentCanvas: tranCurrentCanvas,
    currentWrap: tranCurrentWrap,
    currentOverlay: tranCurrentOverlay,
    currentTooltip: tranCurrentTooltip,
    powerCanvas: tranPowerCanvas,
    powerWrap: tranPowerWrap,
    powerOverlay: tranPowerOverlay,
    powerTooltip: tranPowerTooltip
  } = tranPlotSection;

  // AC Section (dual plots: magnitude + phase)
  const acSection = document.createElement("div");
  acSection.className = "section ac-section";
  const acMeta = document.createElement("div");
  acMeta.className = "results-meta ac-meta";

  const acControls = document.createElement("div");
  acControls.className = "controls analysis-controls";

  // Grid for AC
  const gridLabelA = document.createElement("label");
  gridLabelA.className = "analysis-grid-toggle";
  const gridCheckA = document.createElement("input");
  gridCheckA.type = "checkbox";
  gridCheckA.checked = showGrid;
  gridCheckA.addEventListener("change", () => {
    showGrid = gridCheckA.checked;
    renderDcResults(state.dcResults);
    renderTranResults(state.tranResults);
    renderAcResults(state.acResults);
    queueAutosave();
  });
  gridLabelA.append(gridCheckA, " Show Grid");

  // Signal for AC
  const signalSelectA = document.createElement("select");
  signalSelectA.className = "sample-select analysis-signal-select";
  signalSelectA.multiple = true;
  signalSelectA.size = 4;
  signalSelectA.dataset.signalSelect = "ac";
  signalSelectA.hidden = true;
  signalSelectA.addEventListener("change", () => {
    const selected = dedupeSignalList(getSelectedSignals(signalSelectA));
    if (!selected.length) {
      return;
    }
    if (!state.acResults || typeof state.acResults !== "object") {
      return;
    }
    state.acResults.selected = selected;
    setActiveTab("ac");
    renderAcResults(state.acResults);
    queueAutosave(false);
  });

  const signalCheckboxListA = document.createElement("div");
  signalCheckboxListA.className = "signal-checkbox-list";
  signalCheckboxListA.dataset.signalCheckboxList = "ac";
  signalCheckboxListA.addEventListener("change", (e) => {
    if (e.target?.type !== "checkbox") {
      return;
    }
    const cb = e.target;
    const opt = Array.from(signalSelectA.options).find((o) => o.value === cb.value);
    if (opt) {
      opt.selected = cb.checked;
      signalSelectA.dispatchEvent(new Event("change"));
    }
  });
  const acPlotStyle = createPlotStyleControls();
  const acPlotSettings = createPlotSettingsPopover("ac", [
    gridLabelA,
    acPlotStyle.fontLabel,
    acPlotStyle.lineLabel
  ]);

  const acExportMagButton = document.createElement("button");
  acExportMagButton.className = "secondary";
  acExportMagButton.textContent = "Export Mag PNG";
  acExportMagButton.dataset.exportPlot = "ac-mag";
  const acExportPhaseButton = document.createElement("button");
  acExportPhaseButton.className = "secondary";
  acExportPhaseButton.textContent = "Export Phase PNG";
  acExportPhaseButton.dataset.exportPlot = "ac-phase";
  const acExportCsvButton = document.createElement("button");
  acExportCsvButton.className = "secondary";
  acExportCsvButton.textContent = "Export CSV";
  acExportCsvButton.dataset.exportCsv = "ac";
  applyHelpEntry(acExportCsvButton, helpEntries.exportCsvAc);

  acControls.append(
    signalCheckboxListA,
    signalSelectA,
    acPlotSettings.wrap,
    acExportMagButton,
    acExportPhaseButton,
    acExportCsvButton
  );

  const {
    canvas: acMagCanvas,
    wrap: acMagWrap,
    overlay: acMagOverlay,
    tooltip: acTooltip
  } = createPlotCanvasBundle("ac-mag", "ac", 720, 200);
  const {
    canvas: acPhaseCanvas,
    wrap: acPhaseWrap,
    overlay: acPhaseOverlay,
    tooltip: acPhaseTooltip
  } = createPlotCanvasBundle("ac-phase", "ac-phase", 720, 200);

  acSection.append(acControls, acMeta, acMagWrap, acPhaseWrap);

  const logSection = document.createElement("div");
  logSection.className = "section";
  const logEl = document.createElement("pre");
  logEl.className = "log";
  logEl.textContent = state.log.join("\n");
  logSection.append(logEl);

  const tabBar = document.createElement("div");
  tabBar.className = "tab-bar analysis-kind-bar";
  tabBar.dataset.analysisKindBar = "1";

  const tabPanels = document.createElement("div");
  tabPanels.className = "tab-panels";

  const tabs = [
    { id: "op", label: "DC", panel: resultsSection, help: helpEntries.simTabOp, analysisKind: "op" },
    { id: "dc", label: "DC Sweep", panel: dcSection, help: helpEntries.simTabDc, analysisKind: "dc" },
    { id: "tran", label: "Transient", panel: tranSection, help: helpEntries.simTabTran, analysisKind: "tran" },
    { id: "ac", label: "AC", panel: acSection, help: helpEntries.simTabAc, analysisKind: "ac" },
    { id: "log", label: "Log", panel: logSection, help: helpEntries.simTabLog }
  ];

  setActiveTab = (tabId) => {
    tabs.forEach((tab) => {
      const isActive = tab.id === tabId;
      tab.panel.classList.toggle("active", isActive);
      if (tab.button) {
        tab.button.classList.toggle("active", isActive);
        tab.button.setAttribute("aria-selected", isActive ? "true" : "false");
      }
    });
    queuePlotResize();
  };

  tabs.forEach((tab) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "tab-button";
    button.textContent = tab.label;
    button.dataset.tab = tab.id;
    if (tab.analysisKind) {
      button.dataset.analysisKind = tab.analysisKind;
    }
    applyHelpEntry(button, tab.help);
    button.addEventListener("click", () => {
      setSelectedHelpTarget(button);
      if (tab.analysisKind) {
        setActiveSimulationKind(tab.analysisKind);
      } else {
        setActiveTab(tab.id);
      }
    });
    tab.button = button;
    tabBar.appendChild(button);

    tab.panel.classList.add("tab-panel");
    tab.panel.dataset.tabPanel = tab.id;
    tabPanels.appendChild(tab.panel);
  });
  registerAllHelpTargets(tabBar);

  setActiveTab("op");
  simulationHeader.prepend(tabBar);

  const resultsPanel = document.createElement("div");
  resultsPanel.className = "results-panel";
  resultsPanel.dataset.resultsPanePanel = "1";
  const resultsMain = document.createElement("div");
  resultsMain.className = "workspace-main results-pane-main";
  resultsMain.append(errorEl, tabPanels);
  resultsMain.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) {
      return;
    }
    if (target.closest("[data-results-signal-token], [data-results-signal-tokens], .measurement-row")) {
      return;
    }
    if (target.closest("button, select, input, textarea, label, a")) {
      return;
    }
    if (target.closest("[data-plot-canvas], [data-plot-overlay]")) {
      return;
    }
    if (isAdditiveSelectionEvent(event)) {
      return;
    }
    focusedTracePane = "schematic";
    clearPlotTraceSelectionState({ skipRecompute: true });
    clearSchematicSelection();
    setHoverTraceHighlights([]);
  });
  resultsPanel.append(resultsMain);

  resultsPaneLayout = document.createElement("div");
  resultsPaneLayout.className = "results-pane-layout";
  resultsPaneLayout.dataset.resultsPane = "1";
  const schematicCanvasPane = document.createElement("div");
  schematicCanvasPane.className = "results-pane-schematic";
  schematicCanvasPane.dataset.resultsPaneSchematic = "1";
  schematicCanvasPane.append(schematicCanvasWrap);
  resultsPaneDivider = document.createElement("div");
  resultsPaneDivider.className = "results-pane-divider";
  resultsPaneDivider.dataset.resultsPaneDivider = "1";
  resultsPaneDivider.setAttribute("role", "separator");
  resultsPaneDivider.setAttribute("aria-orientation", "vertical");
  const resultsPaneContent = document.createElement("div");
  resultsPaneContent.className = "results-pane-content";
  resultsPaneContent.append(resultsPanel);
  const resultsPaneEmptyPlaceholder = document.createElement("div");
  resultsPaneEmptyPlaceholder.className = "results-pane-empty-placeholder";
  resultsPaneEmptyPlaceholder.textContent = "Select Schematic or Results to view.";
  resultsPaneLayout.append(schematicCanvasPane, resultsPaneDivider, resultsPaneContent, resultsPaneEmptyPlaceholder);
  schematicMain.prepend(resultsPaneLayout);

  const workspaceHeader = document.createElement("div");
  workspaceHeader.className = "workspace-header";
  workspaceHeader.dataset.workspaceHeader = "1";
  const workspacePrimaryStrip = document.createElement("div");
  workspacePrimaryStrip.className = "workspace-primary-strip";
  const workspaceTabs = document.createElement("div");
  workspaceTabs.className = "workspace-tabs";
  const toolsWorkspaceTab = document.createElement("button");
  toolsWorkspaceTab.type = "button";
  toolsWorkspaceTab.className = "workspace-tab workspace-tab-flat-right active";
  toolsWorkspaceTab.textContent = "Tools";
  toolsWorkspaceTab.dataset.workspaceTab = "schematic";
  toolsWorkspaceTab.setAttribute("aria-selected", "true");
  let workspaceToolsVisible = true;
  let simPanelVisible = false;
  const setWorkspaceToolsVisible = (visible) => {
    workspaceToolsVisible = visible;
    toolsWorkspaceTab.classList.toggle("active", visible);
    toolsWorkspaceTab.setAttribute("aria-selected", visible ? "true" : "false");
    schematicToolsPanel.hidden = !visible;
    schematicControls.hidden = !visible;
    schematicWorkspace.dataset.workspaceToolsVisible = visible ? "1" : "0";

  };
  const setSimPanelVisible = (visible) => {
    simPanelVisible = visible;
    simPanel.hidden = !visible;
    schematicSimulation.hidden = !visible;
    simToggleButton.classList.toggle("active", visible);
    simToggleButton.setAttribute("aria-selected", visible ? "true" : "false");
    schematicWorkspace.dataset.simPanelVisible = visible ? "1" : "0";
    queuePlotResize();

  };
  toolsWorkspaceTab.addEventListener("click", () => {
    const turningOn = !workspaceToolsVisible;
    setWorkspaceToolsVisible(turningOn);
    if (turningOn) {
      const responsiveState = resolveResultsPaneResponsiveState();
      const schematicVisible = uiResultsPaneDomain.isSchematicVisible(resultsPaneState.mode, responsiveState);
      if (!schematicVisible) {
        const narrow = !responsiveState.dockedAllowed;
        const resultsVisible = uiResultsPaneDomain.isResultsVisible(resultsPaneState.mode, responsiveState);
        // At narrow widths schematic and results are exclusive — showing schematic hides results
        setResultsPaneMode(uiResultsPaneDomain.deriveModeFromVisibility(true, !narrow && resultsVisible));
      }
    }
  });
  workspaceHelpToggleButton = document.createElement("button");
  workspaceHelpToggleButton.type = "button";
  workspaceHelpToggleButton.className = "secondary icon-button workspace-help-toggle";
  workspaceHelpToggleButton.dataset.workspaceHelpToggle = "1";
  applyActionButtonIcon(workspaceHelpToggleButton, "info-view", `Hover Info (${HOTKEY_SHORTCUTS.toggleHelp})`);
  workspaceHelpToggleButton.addEventListener("click", () => {
    toggleHelpEnabled();
  });
  const toggleResultsPaneSchematicButton = document.createElement("button");
  toggleResultsPaneSchematicButton.type = "button";
  toggleResultsPaneSchematicButton.className = "workspace-tab workspace-tab-flat-left";
  toggleResultsPaneSchematicButton.textContent = "Schematic";
  toggleResultsPaneSchematicButton.dataset.resultsPaneAction = "schematic";
  toggleResultsPaneSchematicButton.setAttribute("aria-pressed", "true");
  applyCustomTooltip(toggleResultsPaneSchematicButton, "Show/hide schematic");
  const schematicTabGroup = document.createElement("div");
  schematicTabGroup.className = "workspace-tab-group";
  schematicTabGroup.append(toolsWorkspaceTab, toggleResultsPaneSchematicButton);
  workspaceTabs.append(schematicTabGroup);
  updateWorkspaceHelpToggleState();
  const workspaceHeaderCommand = document.createElement("div");
  workspaceHeaderCommand.className = "workspace-header-command";
  workspaceHeaderCommand.dataset.workspaceHeaderCommand = "1";
  const resultsPaneActions = document.createElement("div");
  resultsPaneActions.className = "workspace-tab-group results-pane-actions";
  const toggleResultsPaneVisibilityButton = document.createElement("button");
  toggleResultsPaneVisibilityButton.type = "button";
  toggleResultsPaneVisibilityButton.className = "workspace-tab workspace-tab-flat-right";
  toggleResultsPaneVisibilityButton.textContent = "Results";
  toggleResultsPaneVisibilityButton.dataset.resultsPaneAction = "visibility";
  toggleResultsPaneVisibilityButton.setAttribute("aria-pressed", "false");
  applyCustomTooltip(toggleResultsPaneVisibilityButton, "Show/hide results");
  const simToggleButton = document.createElement("button");
  simToggleButton.type = "button";
  simToggleButton.className = "workspace-tab workspace-tab-flat-left";
  simToggleButton.textContent = "Sim";
  simToggleButton.dataset.workspaceTab = "sim";
  simToggleButton.setAttribute("aria-selected", "false");
  applyCustomTooltip(simToggleButton, "Simulation settings");
  simToggleButton.addEventListener("click", () => {
    setSimPanelVisible(!simPanelVisible);
  });
  resultsPaneActions.append(toggleResultsPaneVisibilityButton, simToggleButton);
  workspaceHeaderCommand.append(schematicCommandBar, resultsPaneActions);
  const syncWorkspaceHeaderResponsiveLayout = (responsiveState) => {
    const compactHeader = !(responsiveState?.dockedAllowed);
    workspacePrimaryStrip.dataset.workspaceHeaderCompact = compactHeader ? "1" : "0";
    if (compactHeader) {
      if (resultsPaneActions.parentElement !== workspaceTabs) {
        workspaceTabs.append(resultsPaneActions);
      }
      return;
    }
    if (resultsPaneActions.parentElement !== workspaceHeaderCommand) {
      workspaceHeaderCommand.append(resultsPaneActions);
    }
  };
  const workspacePanels = document.createElement("div");
  workspacePanels.className = "workspace-panels";
  workspacePanels.append(schematicPanel);

  const readResultsPaneResponsiveWidth = () => {
    const candidates = [
      Number(workspace?.getBoundingClientRect?.().width),
      Number(container?.getBoundingClientRect?.().width),
      Number(resultsPaneLayout?.getBoundingClientRect?.().width),
      Number(window.innerWidth)
    ];
    for (const candidate of candidates) {
      if (Number.isFinite(candidate) && candidate > 0) {
        return candidate;
      }
    }
    return 0;
  };

  const resolveResultsPaneResponsiveState = () => {
    const width = readResultsPaneResponsiveWidth();
    const responsive = uiResultsPaneDomain.getResponsiveState(width);
    return {
      width,
      dockedAllowed: responsive?.dockedAllowed === true,
      stacked: responsive?.stacked === true
    };
  };

  let resultsPaneLastVisibleMode = resultsPaneState.mode === "expanded" ? "expanded" : "split";

  applyResultsPaneState = (options = {}) => {
    if (!resultsPaneLayout) {
      return;
    }
    const responsiveState = resolveResultsPaneResponsiveState();
    syncWorkspaceHeaderResponsiveLayout(responsiveState);
    const normalized = normalizeResultsPaneState(resultsPaneState);
    resultsPaneState = normalized;
    const mode = normalized.mode;
    const effectiveMode = uiResultsPaneDomain.resolveEffectiveMode(mode, responsiveState);
    resultsPaneLayout.dataset.resultsPaneMode = effectiveMode;
    resultsPaneLayout.dataset.resultsPaneStacked = responsiveState.stacked ? "1" : "0";
    resultsPaneLayout.dataset.resultsPaneDockedAllowed = responsiveState.dockedAllowed ? "1" : "0";
    resultsPaneLayout.style.setProperty("--results-pane-split-ratio", String(normalized.splitRatio));
    if (workspace) {
      workspace.dataset.resultsPaneMode = effectiveMode;
      workspace.dataset.resultsPaneStacked = responsiveState.stacked ? "1" : "0";
      workspace.dataset.resultsPaneDockedAllowed = responsiveState.dockedAllowed ? "1" : "0";
    }
    if (mode !== "hidden" && mode !== "empty") {
      resultsPaneLastVisibleMode = mode === "expanded" ? "expanded" : "split";
    }
    if (!responsiveState.dockedAllowed && resultsPaneLastVisibleMode === "split") {
      resultsPaneLastVisibleMode = "expanded";
    }
    const resultsVisible = uiResultsPaneDomain.isResultsVisible(effectiveMode, responsiveState);
    toggleResultsPaneVisibilityButton.classList.toggle("active", resultsVisible);
    toggleResultsPaneVisibilityButton.setAttribute("aria-pressed", resultsVisible ? "true" : "false");
    applyCustomTooltip(toggleResultsPaneVisibilityButton, resultsVisible ? "Hide results" : "Show results");

    const schematicVisible = uiResultsPaneDomain.isSchematicVisible(effectiveMode, responsiveState);
    toggleResultsPaneSchematicButton.classList.toggle("active", schematicVisible);
    toggleResultsPaneSchematicButton.setAttribute("aria-pressed", schematicVisible ? "true" : "false");
    applyCustomTooltip(toggleResultsPaneSchematicButton, schematicVisible ? "Hide schematic" : "Show schematic");
    if (resultsPaneDivider) {
      resultsPaneDivider.setAttribute("aria-orientation", responsiveState.stacked ? "horizontal" : "vertical");
    }
    const skipResize = options.skipResize === true;
    if (!skipResize && effectiveMode !== "hidden" && effectiveMode !== "empty") {
      queuePlotResize();
    }
  };

  setResultsPaneMode = (mode, options = {}) => {
    const nextMode = normalizeResultsPaneMode(mode);
    const previousMode = resultsPaneState.mode;
    resultsPaneState = {
      ...resultsPaneState,
      mode: nextMode
    };
    applyResultsPaneState();
    const changed = previousMode !== resultsPaneState.mode;
    if (!changed) {
      return;
    }
    const shouldPersist = options.persist !== false;
    if (shouldPersist) {
      queueAutosave(false);
    }
  };

  setResultsPaneSplitRatio = (ratio, options = {}) => {
    const nextRatio = clampResultsPaneSplitRatio(ratio);
    if (Math.abs(resultsPaneState.splitRatio - nextRatio) < 1e-6) {
      return;
    }
    resultsPaneState = {
      ...resultsPaneState,
      splitRatio: nextRatio
    };
    applyResultsPaneState();
    const shouldPersist = options.persist !== false;
    if (shouldPersist) {
      queueAutosave(false);
    }
  };

  openResultsPaneForRun = () => {
    if (resultsPaneState.mode === "hidden") {
      const responsiveState = resolveResultsPaneResponsiveState();
      setResultsPaneMode(responsiveState.dockedAllowed ? "split" : "expanded");
      return;
    }
    if (resultsPaneState.mode === "empty") {
      setResultsPaneMode("expanded");
      return;
    }
    queuePlotResize();
  };

  toggleResultsPaneVisibilityButton.addEventListener("click", () => {
    const responsiveState = resolveResultsPaneResponsiveState();
    const nextMode = uiResultsPaneDomain.toggleResultsVisibilityMode(resultsPaneState.mode, responsiveState);
    setResultsPaneMode(nextMode);
  });
  toggleResultsPaneSchematicButton.addEventListener("click", () => {
    const responsiveState = resolveResultsPaneResponsiveState();
    const nextMode = uiResultsPaneDomain.toggleSchematicVisibilityMode(resultsPaneState.mode, responsiveState);
    setResultsPaneMode(nextMode);
  });

  const readResultsPaneDividerSize = (axis = "x") => {
    if (!resultsPaneLayout) {
      return 0;
    }
    const computed = window.getComputedStyle(resultsPaneLayout);
    const cssSize = Number.parseFloat(String(computed.getPropertyValue("--results-pane-divider-size") ?? "").trim());
    if (Number.isFinite(cssSize) && cssSize >= 0) {
      return cssSize;
    }
    const dividerRect = resultsPaneDivider?.getBoundingClientRect?.();
    const rectSize = axis === "y"
      ? Number(dividerRect?.height)
      : Number(dividerRect?.width);
    if (Number.isFinite(rectSize) && rectSize >= 0) {
      return rectSize;
    }
    return 10;
  };

  const resolveResultsPaneDragTarget = (clientX, clientY) => {
    if (!resultsPaneLayout) {
      return null;
    }
    const rect = resultsPaneLayout.getBoundingClientRect();
    const isStacked = resultsPaneLayout.dataset.resultsPaneStacked === "1";
    const layoutWidth = Number(rect?.width);
    const layoutHeight = Number(rect?.height);
    const dividerSize = readResultsPaneDividerSize(isStacked ? "y" : "x");
    return uiResultsPaneDomain.resolveDragTarget({
      stacked: isStacked,
      layoutWidth,
      layoutHeight,
      dividerSize,
      relativeCenterX: clientX - rect.left,
      relativeCenterY: clientY - rect.top
    });
  };

  const applyResultsPaneDragTarget = (target) => {
    if (!target || typeof target !== "object") {
      return;
    }
    const mode = normalizeResultsPaneMode(target.mode);
    if (mode === "split") {
      setResultsPaneMode("split", { persist: false });
      setResultsPaneSplitRatio(target.splitRatio, { persist: false });
      return;
    }
    setResultsPaneMode(mode, { persist: false });
  };

  resultsPaneDivider.addEventListener("pointerdown", (event) => {
    if (resultsPaneState.mode !== "split") {
      return;
    }
    if (event.button !== 0) {
      return;
    }
    isDraggingResultsDivider = true;
    resultsDividerPointerId = event.pointerId;
    resultsDividerDragStartX = event.clientX;
    resultsDividerDragStartRatio = resultsPaneState.splitRatio;
    if (resultsPaneLayout) {
      resultsPaneLayout.dataset.resultsPaneDragging = "1";
    }
    try {
      resultsPaneDivider.setPointerCapture(event.pointerId);
    } catch {
      // Headless/synthetic pointer events may not have an active pointer to capture.
    }
    event.preventDefault();
  });
  resultsPaneDivider.addEventListener("pointermove", (event) => {
    if (!isDraggingResultsDivider || event.pointerId !== resultsDividerPointerId || !resultsPaneLayout) {
      return;
    }
    const target = resolveResultsPaneDragTarget(event.clientX, event.clientY);
    applyResultsPaneDragTarget(target);
  });
  const finishResultsPaneDrag = (event) => {
    if (!isDraggingResultsDivider || event.pointerId !== resultsDividerPointerId) {
      return;
    }
    isDraggingResultsDivider = false;
    if (resultsPaneLayout && Object.prototype.hasOwnProperty.call(resultsPaneLayout.dataset, "resultsPaneDragging")) {
      delete resultsPaneLayout.dataset.resultsPaneDragging;
    }
    try {
      if (resultsPaneDivider.hasPointerCapture(event.pointerId)) {
        resultsPaneDivider.releasePointerCapture(event.pointerId);
      }
    } catch {
      // Ignore release errors for non-captured synthetic pointer events.
    }
    resultsDividerPointerId = null;
    queueAutosave(false);
  };
  resultsPaneDivider.addEventListener("pointerup", finishResultsPaneDrag);
  resultsPaneDivider.addEventListener("pointercancel", finishResultsPaneDrag);

  workspacePrimaryStrip.append(workspaceTabs, workspaceHeaderCommand);
  workspaceHeader.append(workspacePrimaryStrip);

  setSchematicMode = (enabled) => {
    schematicMode = Boolean(enabled);
    if (schematicMode) {
      ensureSchematicApi();
      updateConfigSectionVisibility();
      refreshSchematicNetlist();
    }
  };

  workspace = document.createElement("div");
  workspace.className = "workspace";
  workspace.append(workspaceHeader, workspacePanels);
  registerAllHelpTargets(workspace);
  setWorkspaceToolsVisible(true);
  applyResultsPaneState({ skipResize: true });

  container.append(titleBar, workspace);
  window.addEventListener("resize", () => {

    applyResultsPaneState({ skipResize: false });
  });

  const resolveOpResultDisplayName = (signalName, options = {}) =>
    uiResultsTableModule.resolveOpResultDisplayName({
      signalName,
      rowKind: options?.rowKind,
      signalCaseMap: options?.signalCaseMap,
      normalizeSignalToken,
      parseVoltageSignalToken,
      formatSignalLabel
    });

  const formatRows = (rows, options = {}) =>
    uiResultsTableModule.formatRows({
      rows,
      rowKind: options?.rowKind,
      signalCaseMap: options?.signalCaseMap,
      colorMap: options?.colorMap,
      resolveOpResultDisplayName: ({ signalName, rowKind, signalCaseMap }) =>
        resolveOpResultDisplayName(signalName, { rowKind, signalCaseMap }),
      normalizeSignalToken
    });

  const normalizeStoredRowToken = uiResultsPaneDomain.normalizeStoredRowToken;
  const normalizeStoredRowTokenList = uiResultsPaneDomain.normalizeStoredRowTokenList;

  const getResultRowSignalTokens = (row) => uiResultsTableModule.getResultRowSignalTokens({
    row,
    normalizeStoredRowToken,
    normalizeStoredRowTokenList
  });

  const rowMatchesSelectedSignals = (row) => uiResultsTableModule.rowMatchesSelectedSignals({
    row,
    normalizeStoredRowToken,
    normalizeStoredRowTokenList,
    activeTraceSelectionTokens
  });

  const rowMatchesHoverSignals = (row) => uiResultsTableModule.rowMatchesHoverSignals({
    row,
    normalizeStoredRowToken,
    normalizeStoredRowTokenList,
    activeTraceHoverTokens
  });

  const rowMatchesSelectedMeasurement = (row) => uiResultsTableModule.rowMatchesSelectedMeasurement({
    row,
    schematicSelectionId
  });

  const applyResultsSignalHighlights = () => {
    uiResultsTableModule.applyResultsSignalHighlights({
      root: document,
      normalizeStoredRowToken,
      normalizeStoredRowTokenList,
      activeTraceSelectionTokens,
      activeTraceHoverTokens,
      schematicSelectionId
    });
  };

  refreshResultsTableHighlights = () => {
    applyResultsSignalHighlights();
  };

  const formatResultsDisplayNumber = uiResultsPaneDomain.formatDisplayNumber;
  const formatResultsDisplayValue = uiResultsPaneDomain.formatDisplayValue;
  const normalizeHighlightColor = uiResultsPaneDomain.normalizeHighlightColor;
  const normalizeHighlightMode = uiResultsPaneDomain.normalizeHighlightMode;
  const normalizeHighlightEntries = uiResultsPaneDomain.normalizeHighlightEntries;
  const normalizeHighlightTargets = uiResultsPaneDomain.normalizeHighlightTargets;
  const highlightTargetsEqual = uiResultsPaneDomain.highlightTargetsEqual;
  const hasHighlightTargets = uiResultsPaneDomain.hasHighlightTargets;
  const buildHighlightTargetEntries = uiResultsPaneDomain.buildHighlightTargetEntries;
  const mergeExternalHighlightTargets = uiResultsPaneDomain.mergeExternalHighlightTargets;
  const normalizeNetlistHighlightLines = uiResultsPaneDomain.normalizeNetlistHighlightLines;
  const normalizeNetlistHighlightNodeSpans = uiResultsPaneDomain.normalizeNetlistHighlightNodeSpans;

  const bindSignalResultRow = (rowEl, signalTokens, options = {}) => uiResultsTableModule.bindSignalResultRow({
    rowEl,
    signalTokens,
    normalizeStoredRowTokenList,
    activeTraceSelectionTokens,
    activeTraceHoverTokens,
    isSelected: options?.isSelected,
    onHoverSignals: (signals) => {
      handleResultsSignalHover(signals);
    },
    onClick: options?.onClick
  });

  const renderTable = (table, rows, headers) => {
    uiResultsTableModule.renderTable({
      table,
      rows,
      headers,
      normalizeSignalToken,
      normalizeHexColor,
      formatResultsDisplayValue,
      bindSignalResultRow: ({ rowEl, signalTokens, onClick }) => bindSignalResultRow(rowEl, signalTokens, { onClick }),
      onSignalClick: (signals, event) => {
        handleResultsSignalClick(signals, event);
      }
    });
  };

  const sortMeasurementsForDisplay = uiMeasurementsDomain.sortMeasurementsForDisplay;
  const parseMetricInput = uiMeasurementsDomain.parseMetricInput;
  const formatMeasurementValue = uiMeasurementsDomain.formatMeasurementValue;
  const normalizeNodeName = uiMeasurementsDomain.normalizeNodeName;
  const normalizeCurrentName = uiMeasurementsDomain.normalizeCurrentName;
  const getSelectedSignals = uiMeasurementsDomain.getSelectedSignals;
  const parseVoltageSignalToken = uiMeasurementsDomain.parseVoltageSignalToken;
  const formatSignalLabel = (value) => resolveSignalDisplayLabel(value);
  const normalizeSignalToken = uiMeasurementsDomain.normalizeSignalToken;
  const normalizeTraceTokenValue = uiMeasurementsDomain.normalizeTraceTokenValue;
  const normalizeSignalTokenSet = uiMeasurementsDomain.normalizeSignalTokenSet;
  const formatCurrentSignalLabel = uiMeasurementsDomain.formatCurrentSignalLabel;

  const buildProbeSignalDisplayLabelMap = (compileInfo) => {
    const probeData = Array.isArray(compileInfo?.probeDescriptors)
      ? { descriptors: compileInfo.probeDescriptors }
      : buildProbeDescriptors(compileInfo ?? {});
    const descriptors = Array.isArray(probeData?.descriptors) ? probeData.descriptors : [];
    const map = new Map();
    descriptors.forEach((descriptor) => {
      const type = String(descriptor?.type ?? "").trim().toUpperCase();
      if (type !== "PI" && type !== "PP") {
        return;
      }
      const isPowerProbe = type === "PP";
      const label = String(descriptor?.label ?? "").trim();
      if (!label) {
        return;
      }
      const addSignal = (signal) => {
        const token = normalizeSignalToken(signal);
        if (!token || !token.startsWith("i:")) {
          return;
        }
        const existing = map.get(token);
        if (!existing || isPowerProbe) {
          map.set(token, label);
        }
      };
      (Array.isArray(descriptor?.currentSignals) ? descriptor.currentSignals : []).forEach((signal) => {
        addSignal(signal);
      });
      addSignal(descriptor?.signal);
    });
    return map;
  };

  const syncProbeSignalDisplayLabelMap = (compileInfo = latestSchematicCompile) => {
    probeSignalDisplayLabelMap = buildProbeSignalDisplayLabelMap(compileInfo ?? {});
    // Build power token set from probe descriptors directly (avoids label-cache staleness)
    const tokens = new Set();
    const descriptors = Array.isArray(compileInfo?.probeDescriptors)
      ? compileInfo.probeDescriptors
      : (buildProbeDescriptors(compileInfo ?? {})?.descriptors ?? []);
    for (const d of descriptors) {
      if (String(d?.type ?? "").trim().toUpperCase() !== "PP") continue;
      for (const s of (Array.isArray(d?.currentSignals) ? d.currentSignals : [])) {
        const t = normalizeSignalToken(s);
        if (t && t.startsWith("i:")) tokens.add(t);
      }
      const t = normalizeSignalToken(d?.signal);
      if (t && t.startsWith("i:")) tokens.add(t);
    }
    powerSignalTokens = tokens;
  };

  const resolveProbeMeasurementLabel = (descriptor, component) => {
    const type = String(descriptor?.type ?? component?.type ?? "").trim().toUpperCase();
    const signal = String(descriptor?.signal ?? "").trim();
    if ((type === "PV" || type === "PD") && signal) {
      return resolveSignalDisplayLabel(signal);
    }
    return String(descriptor?.label ?? component?.name ?? component?.id ?? "Probe").trim();
  };

  const resolveSignalDisplayLabel = (value) => {
    const token = normalizeSignalToken(value);
    if (token && token.startsWith("i:")) {
      const probeLabel = probeSignalDisplayLabelMap.get(token);
      if (probeLabel) {
        return probeLabel;
      }
    }
    const parsedVoltage = parseVoltageSignalToken(value, { preserveCase: true });
    if (parsedVoltage?.kind === "diff") {
      return `V(${parsedVoltage.pos})-V(${parsedVoltage.neg})`;
    }
    if (parsedVoltage?.kind === "single") {
      return `V(${parsedVoltage.node})`;
    }
    const currentLabel = formatCurrentSignalLabel(value);
    if (currentLabel) {
      return currentLabel;
    }
    return String(value ?? "").trim();
  };

  const dedupeSignalList = uiMeasurementsDomain.dedupeSignalList;
  const signalListsEqual = uiMeasurementsDomain.signalListsEqual;
  const buildSignalCaseMap = uiMeasurementsDomain.buildSignalCaseMap;
  const applySignalCaseMap = uiMeasurementsDomain.applySignalCaseMap;
  const applyTraceMapCaseMap = uiMeasurementsDomain.applyTraceMapCaseMap;
  const normalizeSignalTokens = uiMeasurementsDomain.normalizeSignalTokens;
  const isVoltageSignalToken = uiMeasurementsDomain.isVoltageSignalToken;
  const isCurrentSignalToken = uiMeasurementsDomain.isCurrentSignalToken;
  const classifySignalValue = uiMeasurementsDomain.classifySignalValue;
  const classifySignalToken = uiMeasurementsDomain.classifySignalToken;
  const classifySeriesSignalType = (signal) => uiMeasurementsDomain.classifySeriesSignalType(signal, {
    powerSignalTokens
  });
  const splitSeriesByType = (series) => uiMeasurementsDomain.splitSeriesByType(series, {
    powerSignalTokens
  });
  const prioritizeSignals = uiMeasurementsDomain.prioritizeSignals;
  const syncSignalCheckboxList = (listEl, selectEl) => uiMeasurementsDomain.syncSignalCheckboxList({
    listEl,
    selectEl
  });
  const updateSignalSelect = (select, signals, selected, options) => uiMeasurementsDomain.updateSignalSelect({
    select,
    signals,
    selected,
    preferredSignals: Array.isArray(options?.preferredSignals) ? options.preferredSignals : [],
    formatSignalLabel
  });

  const collectProbeDescriptorHighlightSignals = (descriptor) => {
    const type = String(descriptor?.type ?? "").trim().toUpperCase();
    const voltageSignals = [];
    const currentSignals = [];
    const addSignalByType = (signal) => {
      const text = String(signal ?? "").trim();
      if (!text) {
        return;
      }
      const classification = classifySignalValue(text);
      if (classification.isVoltage) {
        voltageSignals.push(text);
      } else if (classification.isCurrent) {
        currentSignals.push(text);
      }
    };
    const addVoltageSignal = (signal) => {
      const text = String(signal ?? "").trim();
      if (!text) {
        return;
      }
      if (classifySignalValue(text).isVoltage) {
        voltageSignals.push(text);
      }
    };
    const addCurrentSignal = (signal) => {
      const text = String(signal ?? "").trim();
      if (!text) {
        return;
      }
      if (classifySignalValue(text).isCurrent) {
        currentSignals.push(text);
      }
    };
    const addSignals = (signals) => {
      (Array.isArray(signals) ? signals : []).forEach((signal) => {
        addSignalByType(signal);
      });
    };
    const addVoltageSignals = (signals) => {
      (Array.isArray(signals) ? signals : []).forEach((signal) => {
        addVoltageSignal(signal);
      });
    };
    const addCurrentSignals = (signals) => {
      (Array.isArray(signals) ? signals : []).forEach((signal) => {
        addCurrentSignal(signal);
      });
    };
    if (type === "PV") {
      addVoltageSignal(descriptor?.signal);
      addVoltageSignal(descriptor?.voltageSignal);
      addVoltageSignals(descriptor?.saveSignals);
      if (descriptor?.netA) {
        addVoltageSignal(`v(${descriptor.netA})`);
      }
      return {
        type,
        voltageSignals: dedupeSignalList(voltageSignals),
        currentSignals: dedupeSignalList(currentSignals)
      };
    }
    if (type === "PD") {
      addVoltageSignal(descriptor?.signal);
      addVoltageSignal(descriptor?.voltageSignal);
      addVoltageSignals(descriptor?.saveSignals);
      if (descriptor?.netA && descriptor?.netB) {
        addVoltageSignal(`v(${descriptor.netA},${descriptor.netB})`);
      }
      return {
        type,
        voltageSignals: dedupeSignalList(voltageSignals),
        currentSignals: dedupeSignalList(currentSignals)
      };
    }
    if (type === "PI" || type === "PP") {
      addCurrentSignal(descriptor?.signal);
      addCurrentSignals(descriptor?.currentSignals);
      addCurrentSignals(descriptor?.saveSignals);
      return {
        type,
        voltageSignals: dedupeSignalList(voltageSignals),
        currentSignals: dedupeSignalList(currentSignals)
      };
    }
    addSignalByType(descriptor?.signal);
    addSignalByType(descriptor?.voltageSignal);
    addSignals(descriptor?.saveSignals);
    addSignals(descriptor?.currentSignals);
    return {
      type,
      voltageSignals: dedupeSignalList(voltageSignals),
      currentSignals: dedupeSignalList(currentSignals)
    };
  };

  const addToSetMap = (map, key, value) => {
    const normalizedKey = String(key ?? "").trim();
    const normalizedValue = String(value ?? "").trim();
    if (!normalizedKey || !normalizedValue) {
      return;
    }
    if (!map.has(normalizedKey)) {
      map.set(normalizedKey, new Set());
    }
    map.get(normalizedKey).add(normalizedValue);
  };

  const buildTraceLinkIndex = () => {
    const index = {
      netToComponentIds: new Map(),
      netToWireIds: new Map(),
      componentToNets: new Map(),
      wireToNet: new Map(),
      currentTokenToComponentIds: new Map(),
      componentToCurrentTokens: new Map(),
      componentToTraceTokens: new Map()
    };
    const model = schematicEditor?.getModel?.() ?? schematicModel ?? null;
    const canonicalComponentIds = new Map();
    (Array.isArray(model?.components) ? model.components : []).forEach((component) => {
      const id = String(component?.id ?? "").trim();
      if (!id) {
        return;
      }
      canonicalComponentIds.set(id.toLowerCase(), id);
    });
    const normalizeComponentId = (value) => {
      const id = String(value ?? "").trim();
      if (!id) {
        return "";
      }
      return canonicalComponentIds.get(id.toLowerCase()) ?? id;
    };
    const extractPinMapComponentId = (key) => {
      const raw = String(key ?? "").trim();
      if (!raw) {
        return "";
      }
      const doubleColon = raw.indexOf("::");
      if (doubleColon > 0) {
        return raw.slice(0, doubleColon);
      }
      const colon = raw.indexOf(":");
      if (colon > 0) {
        return raw.slice(0, colon);
      }
      const dot = raw.indexOf(".");
      if (dot > 0) {
        return raw.slice(0, dot);
      }
      return raw;
    };
    const compileInfo = latestSchematicCompile ?? {};
    const addComponentTraceToken = (componentIdRaw, signal) => {
      const componentId = normalizeComponentId(componentIdRaw);
      const token = normalizeSignalToken(signal);
      if (!componentId || !token) {
        return;
      }
      addToSetMap(index.componentToTraceTokens, componentId, token);
    };
    const addCurrentTokenTarget = (componentIdRaw, signal) => {
      const componentId = normalizeComponentId(componentIdRaw);
      const rawToken = String(signal ?? "").trim().toLowerCase().replace(/\s+/g, "");
      const token = (rawToken.startsWith("v:") || rawToken.startsWith("vd:") || rawToken.startsWith("i:"))
        ? rawToken
        : normalizeSignalToken(signal);
      if (!componentId || !token || !isCurrentSignalToken(token)) {
        return;
      }
      addToSetMap(index.currentTokenToComponentIds, token, componentId);
      addToSetMap(index.componentToCurrentTokens, componentId, token);
    };
    const probeComponentIds = new Set(
      (Array.isArray(model?.components) ? model.components : [])
        .filter((component) => isProbeType(String(component?.type ?? "").toUpperCase()))
        .map((component) => normalizeComponentId(component?.id))
        .filter(Boolean)
    );
    const pinNetMap = compileInfo && typeof compileInfo.pinNetMap === "object"
      ? compileInfo.pinNetMap
      : {};
    Object.entries(pinNetMap).forEach(([key, netName]) => {
      const componentId = normalizeComponentId(extractPinMapComponentId(key));
      const net = normalizeNodeName(netName);
      if (!componentId || !net) {
        return;
      }
      addToSetMap(index.netToComponentIds, net, componentId);
      addToSetMap(index.componentToNets, componentId, net);
      if (!probeComponentIds.has(componentId)) {
        addComponentTraceToken(componentId, `v(${net})`);
      }
    });

    const componentLines = compileInfo && typeof compileInfo.componentLines === "object"
      ? compileInfo.componentLines
      : {};
    Object.entries(componentLines).forEach(([componentId, lineInfo]) => {
      const id = normalizeComponentId(componentId);
      if (!id) {
        return;
      }
      const netlistId = String(lineInfo?.netlistId ?? id).trim();
      if (netlistId) {
        const currentToken = normalizeSignalToken(`i(${netlistId})`);
        if (currentToken) {
          addCurrentTokenTarget(id, currentToken);
          addToSetMap(index.componentToTraceTokens, id, currentToken);
        }
      }
      const behaviorToken = normalizeSignalToken(`@${id.toLowerCase()}[i]`);
      if (behaviorToken) {
        addCurrentTokenTarget(id, behaviorToken);
        addToSetMap(index.componentToTraceTokens, id, behaviorToken);
      }
    });

    const probeDescriptors = Array.isArray(compileInfo?.probeDescriptors)
      ? compileInfo.probeDescriptors
      : [];
    probeDescriptors.forEach((descriptor) => {
      const componentId = normalizeComponentId(descriptor?.id);
      if (!componentId) {
        return;
      }
      const probeSignals = collectProbeDescriptorHighlightSignals(descriptor);
      const netA = normalizeNodeName(descriptor?.netA);
      const netB = normalizeNodeName(descriptor?.netB);
      if (probeSignals.type === "PV" || probeSignals.type === "PD") {
        if (netA) {
          addToSetMap(index.netToComponentIds, netA, componentId);
          addToSetMap(index.componentToNets, componentId, netA);
        }
        if (netB) {
          addToSetMap(index.netToComponentIds, netB, componentId);
          addToSetMap(index.componentToNets, componentId, netB);
        }
      }
      probeSignals.voltageSignals.forEach((signal) => {
        addComponentTraceToken(componentId, signal);
      });
      probeSignals.currentSignals.forEach((signal) => {
        addCurrentTokenTarget(componentId, signal);
        addComponentTraceToken(componentId, signal);
      });
    });

    const api = getSchematicApi();
    const nets = api && typeof api.buildNets === "function" && model
      ? api.buildNets(model)
      : [];
    const netNames = compileInfo && typeof compileInfo.netNames === "object"
      ? compileInfo.netNames
      : {};
    const pointToNet = new Map();
    (Array.isArray(nets) ? nets : []).forEach((net) => {
      const netName = normalizeNodeName(netNames[net.id] ?? net.id);
      if (!netName) {
        return;
      }
      (Array.isArray(net?.nodes) ? net.nodes : []).forEach((node) => {
        if (!Number.isFinite(node?.x) || !Number.isFinite(node?.y)) {
          return;
        }
        pointToNet.set(`${node.x},${node.y}`, netName);
      });
    });
    const wires = Array.isArray(model?.wires) ? model.wires : [];
    wires.forEach((wire) => {
      const wireId = String(wire?.id ?? "").trim();
      if (!wireId) {
        return;
      }
      const points = Array.isArray(wire?.points) ? wire.points : [];
      let resolvedNet = "";
      points.forEach((point) => {
        if (resolvedNet) {
          return;
        }
        const key = `${Number(point?.x)},${Number(point?.y)}`;
        const net = pointToNet.get(key);
        if (net) {
          resolvedNet = net;
        }
      });
      if (!resolvedNet) {
        return;
      }
      index.wireToNet.set(wireId, resolvedNet);
      addToSetMap(index.netToWireIds, resolvedNet, wireId);
    });

    return index;
  };

  const getTraceLinkIndex = () => {
    if (!traceLinkIndexCache) {
      traceLinkIndexCache = buildTraceLinkIndex();
    }
    return traceLinkIndexCache;
  };

  const invalidateTraceLinkIndexCache = () => {
    traceLinkIndexCache = null;
  };

  const mergeHighlightTargets = (target, source) => {
    source.componentIds.forEach((id) => target.componentIds.add(id));
    source.wireIds.forEach((id) => target.wireIds.add(id));
  };

  const resolveSchematicTargetsForSignal = (signal, traceLinkIndex) => {
    const rawToken = String(signal ?? "").trim().toLowerCase().replace(/\s+/g, "");
    const token = (rawToken.startsWith("v:") || rawToken.startsWith("vd:") || rawToken.startsWith("i:"))
      ? rawToken
      : normalizeSignalToken(signal);
    const result = { componentIds: new Set(), wireIds: new Set() };
    if (!token) {
      return result;
    }
    const index = traceLinkIndex ?? getTraceLinkIndex();
    const addNetTargets = (netName) => {
      const net = normalizeNodeName(netName);
      if (!net) {
        return;
      }
      const componentIds = index.netToComponentIds.get(net);
      const wireIds = index.netToWireIds.get(net);
      componentIds?.forEach((id) => result.componentIds.add(id));
      wireIds?.forEach((id) => result.wireIds.add(id));
    };
    if (token.startsWith("v:")) {
      addNetTargets(token.slice(2));
      return result;
    }
    if (token.startsWith("vd:")) {
      const payload = token.slice(3);
      const [pos, neg] = payload.split(",");
      addNetTargets(pos);
      addNetTargets(neg);
      return result;
    }
    if (token.startsWith("i:")) {
      const componentIds = index.currentTokenToComponentIds.get(token);
      componentIds?.forEach((id) => result.componentIds.add(id));
      return result;
    }
    return result;
  };

  const resolveSchematicTargetsForSignals = (signals, options = {}) => {
    const index = getTraceLinkIndex();
    const merged = { componentIds: new Set(), wireIds: new Set() };
    (signals ?? []).forEach((signal) => {
      mergeHighlightTargets(merged, resolveSchematicTargetsForSignal(signal, index));
    });
    const allowFallback = options?.allowFallback !== false;
    if (allowFallback && !merged.componentIds.size && !merged.wireIds.size && Array.isArray(signals) && signals.length) {
      const model = schematicEditor?.getModel?.() ?? schematicModel ?? null;
      const fallbackComponent = (model?.components ?? []).find((component) => {
        const type = String(component?.type ?? "").toUpperCase();
        return Boolean(type && type !== "NET" && type !== "GND" && type !== "TEXT" && !isProbeType(type));
      });
      const fallbackId = String(fallbackComponent?.id ?? "").trim();
      if (fallbackId) {
        merged.componentIds.add(fallbackId);
      }
    }
    return {
      componentIds: Array.from(merged.componentIds),
      wireIds: Array.from(merged.wireIds)
    };
  };

  const isAdditiveSelectionEvent = (event) => Boolean(event?.shiftKey || event?.ctrlKey || event?.metaKey);

  const normalizeSchematicIdList = (values) => Array.from(new Set(
    (Array.isArray(values) ? values : [values])
      .map((entry) => String(entry ?? "").trim())
      .filter(Boolean)
  ));

  const isPowerSignalToken = (signal) => {
    const token = normalizeSignalToken(signal);
    if (!token || !token.startsWith("i:")) {
      return false;
    }
    return powerSignalTokens.has(token);
  };

  // Compute power probe traces in-place: P = V * I (call once after simulation)
  const computePowerTraces = (results) => {
    if (!results || typeof results !== "object") return;
    const traces = results.traces;
    if (!traces || typeof traces !== "object") return;
    const descriptors = Array.isArray(latestSchematicCompile?.probeDescriptors)
      ? latestSchematicCompile.probeDescriptors
      : [];
    descriptors.forEach((descriptor) => {
      if (String(descriptor?.type ?? "").trim().toUpperCase() !== "PP") return;
      const voltageSignal = descriptor?.voltageSignal;
      if (!voltageSignal) return;
      const currentSignals = Array.isArray(descriptor?.currentSignals) ? descriptor.currentSignals : [];
      // Find voltage trace
      let voltageY = null;
      for (const [key, values] of Object.entries(traces)) {
        if (normalizeSignalToken(key) === normalizeSignalToken(voltageSignal)) {
          voltageY = values;
          break;
        }
      }
      if (!voltageY || !Array.isArray(voltageY)) return;
      // For each current signal that is a power probe, replace with P = V * I
      currentSignals.forEach((currentSignal) => {
        for (const [key, values] of Object.entries(traces)) {
          if (normalizeSignalToken(key) !== normalizeSignalToken(currentSignal)) continue;
          if (!Array.isArray(values)) continue;
          if (!isPowerSignalToken(key)) continue;
          const power = new Array(values.length);
          for (let i = 0; i < values.length; i++) {
            power[i] = (i < voltageY.length ? voltageY[i] : 0) * values[i];
          }
          traces[key] = power;
        }
      });
    });
  };

  const collectComponentIdsByType = (componentIds, predicate) => {
    const normalizedIds = normalizeSchematicIdList(componentIds);
    if (!normalizedIds.length) {
      return [];
    }
    if (typeof predicate !== "function") {
      return [];
    }
    const model = schematicEditor?.getModel?.() ?? schematicModel ?? null;
    const typeById = new Map(
      (Array.isArray(model?.components) ? model.components : []).map((component) => [
        String(component?.id ?? "").trim(),
        String(component?.type ?? "").trim().toUpperCase()
      ])
    );
    return normalizedIds.filter((componentId) => predicate(typeById.get(componentId)));
  };

  const collectProbeOrNetComponentIds = (componentIds) => collectComponentIdsByType(
    componentIds,
    (type) => isProbeType(type) || type === "NET"
  );

  const normalizeVoltageSignalTargets = (targets) => {
    const wireIds = normalizeSchematicIdList(Array.from(targets?.wireIds ?? []));
    const componentIds = normalizeSchematicIdList(Array.from(targets?.componentIds ?? []));
    const preferredComponentIds = collectProbeOrNetComponentIds(componentIds);
    return {
      wireIds,
      componentIds: wireIds.length ? preferredComponentIds : componentIds
    };
  };

  const buildPlotExternalTargetsForSignals = (signals, traceIndex) => {
    const index = traceIndex ?? getTraceLinkIndex();
    const merged = { componentIds: new Set(), wireIds: new Set() };
    normalizeSignalTokenSet(signals).forEach((token) => {
      const classification = classifySignalToken(token);
      if (!classification.isVoltage) {
        return;
      }
      const targets = resolveSchematicTargetsForSignal(token, index);
      const normalizedTargets = normalizeVoltageSignalTargets(targets);
      normalizedTargets.wireIds.forEach((id) => merged.wireIds.add(id));
      normalizedTargets.componentIds.forEach((id) => merged.componentIds.add(id));
    });
    return {
      componentIds: Array.from(merged.componentIds),
      wireIds: Array.from(merged.wireIds)
    };
  };

  const buildPlotExternalEntriesForSignals = (signals, traceIndex, options = {}) => {
    const index = traceIndex ?? getTraceLinkIndex();
    const mode = normalizeHighlightMode(options?.mode);
    const entries = [];
    normalizeSignalTokenSet(signals).forEach((token) => {
      const classification = classifySignalToken(token);
      if (!classification.isVoltage) {
        return;
      }
      const targets = resolveSchematicTargetsForSignal(token, index);
      const normalizedTargets = normalizeVoltageSignalTargets(targets);
      const wireIds = normalizedTargets.wireIds;
      const componentIds = normalizedTargets.componentIds;
      if (!componentIds.length && !wireIds.length) {
        return;
      }
      entries.push({
        componentIds,
        wireIds,
        color: resolveHoverColorForSignalToken(token),
        mode
      });
    });
    return entries;
  };

  const buildPlotSelectionTargetsForSignals = (signals, traceIndex) => {
    const index = traceIndex ?? getTraceLinkIndex();
    const merged = { componentIds: new Set(), wireIds: new Set() };
    normalizeSignalTokenSet(signals).forEach((token) => {
      const classification = classifySignalToken(token);
      const targets = resolveSchematicTargetsForSignal(token, index);
      if (classification.isVoltage) {
        const normalizedTargets = normalizeVoltageSignalTargets(targets);
        normalizedTargets.componentIds.forEach((id) => merged.componentIds.add(id));
        normalizedTargets.wireIds.forEach((id) => merged.wireIds.add(id));
        return;
      }
      if (classification.isCurrent) {
        normalizeSchematicIdList(Array.from(targets.componentIds ?? [])).forEach((id) => merged.componentIds.add(id));
        normalizeSchematicIdList(Array.from(targets.wireIds ?? [])).forEach((id) => merged.wireIds.add(id));
      }
    });
    return {
      componentIds: Array.from(merged.componentIds),
      wireIds: Array.from(merged.wireIds)
    };
  };

  const buildPlotCurrentSelectionTargetsForSignals = (signals, traceIndex) => {
    const index = traceIndex ?? getTraceLinkIndex();
    const merged = { componentIds: new Set(), wireIds: new Set() };
    normalizeSignalTokenSet(signals).forEach((token) => {
      const classification = classifySignalToken(token);
      if (!classification.isCurrent) {
        return;
      }
      const targets = resolveSchematicTargetsForSignal(token, index);
      (targets.componentIds ?? []).forEach((id) => merged.componentIds.add(id));
      (targets.wireIds ?? []).forEach((id) => merged.wireIds.add(id));
    });
    return {
      componentIds: Array.from(merged.componentIds),
      wireIds: Array.from(merged.wireIds)
    };
  };

  const buildPlotCurrentEntriesForSignals = (signals, traceIndex, options = {}) => {
    const index = traceIndex ?? getTraceLinkIndex();
    const mode = normalizeHighlightMode(options?.mode);
    const entries = [];
    normalizeSignalTokenSet(signals).forEach((token) => {
      const classification = classifySignalToken(token);
      if (!classification.isCurrent) {
        return;
      }
      const targets = resolveSchematicTargetsForSignal(token, index);
      const componentIds = normalizeSchematicIdList(Array.from(targets.componentIds ?? []));
      const wireIds = normalizeSchematicIdList(Array.from(targets.wireIds ?? []));
      if (!componentIds.length && !wireIds.length) {
        return;
      }
      entries.push({
        componentIds,
        wireIds,
        color: resolveHoverColorForSignalToken(token),
        mode
      });
    });
    return entries;
  };

  const setPlotTraceSelectionState = (signals, externalTargets, options = {}) => {
    const nextTokens = normalizeSignalTokenSet(signals);
    const nextExternalTargets = normalizeHighlightTargets(externalTargets);
    const tokensChanged = !setsEqual(plotTraceSelectionTokens, nextTokens);
    const targetsChanged = !highlightTargetsEqual(plotExternalHighlightTargets, nextExternalTargets);
    const requestedPrimaryToken = normalizeTraceTokenValue(options?.primaryToken ?? "");
    const effectivePrimaryToken = requestedPrimaryToken && nextTokens.has(requestedPrimaryToken)
      ? requestedPrimaryToken
      : (nextTokens.size ? (primaryTraceSelectionToken && nextTokens.has(primaryTraceSelectionToken)
        ? primaryTraceSelectionToken
        : (nextTokens.values().next().value ?? ""))
        : "");
    if (!tokensChanged && !targetsChanged && effectivePrimaryToken === primaryTraceSelectionToken) {
      return;
    }
    plotTraceSelectionTokens = nextTokens;
    plotExternalHighlightTargets = nextExternalTargets;
    primaryTraceSelectionToken = effectivePrimaryToken;
    if (options.skipRecompute !== true) {
      recomputeTraceHighlightState();
    }
  };

  const clearPlotTraceSelectionState = (options = {}) => {
    setPlotTraceSelectionState([], { componentIds: [], wireIds: [] }, options);
  };

  const setHoverExternalHighlightState = (targets, options = {}) => {
    const nextTargets = normalizeHighlightTargets(targets);
    if (highlightTargetsEqual(hoverExternalHighlightTargets, nextTargets)) {
      return;
    }
    hoverExternalHighlightTargets = nextTargets;
    if (options.skipRecompute !== true) {
      recomputeTraceHighlightState();
    }
  };

  const getSchematicSelectionSnapshot = () => {
    if (!schematicEditor) {
      return {
        componentIds: [],
        wireIds: []
      };
    }
    const componentIds = normalizeSchematicIdList(
      typeof schematicEditor.getSelection === "function"
        ? schematicEditor.getSelection()
        : []
    );
    const wireIds = normalizeSchematicIdList([
      typeof schematicEditor.getWireSelection === "function"
        ? schematicEditor.getWireSelection()
        : null,
      ...(
        typeof schematicEditor.getWireSelections === "function"
          ? schematicEditor.getWireSelections()
          : []
      )
    ]);
    return { componentIds, wireIds };
  };

  const setSchematicSelectionTargets = (componentIds, wireIds, options = {}) => {
    if (!schematicEditor) {
      return false;
    }
    const normalizedComponentIds = normalizeSchematicIdList(componentIds);
    const normalizedWireIds = normalizeSchematicIdList(wireIds);
    if (typeof schematicEditor.setSelectionWithWires === "function") {
      schematicEditor.setSelectionWithWires(normalizedComponentIds, normalizedWireIds, {
        preserveComponents: options.preserveComponents !== false
      });
      return true;
    }
    if (typeof schematicEditor.setSelection === "function") {
      schematicEditor.setSelection(normalizedComponentIds);
    }
    if (typeof schematicEditor.selectWire === "function") {
      schematicEditor.selectWire(normalizedWireIds[0] ?? null);
    }
    return true;
  };

  const clearSchematicSelection = () => {
    setSchematicSelectionTargets([], [], { preserveComponents: true });
  };

  const applySchematicSelectionTargets = (targets, options = {}) => {
    const normalized = {
      componentIds: normalizeSchematicIdList(targets?.componentIds),
      wireIds: normalizeSchematicIdList(targets?.wireIds)
    };
    const additive = Boolean(options?.additive);
    const clearWhenEmpty = options?.clearWhenEmpty !== false;
    const hasTargets = normalized.componentIds.length > 0 || normalized.wireIds.length > 0;
    if (!hasTargets) {
      if (clearWhenEmpty && !additive) {
        clearSchematicSelection();
      }
      return false;
    }
    if (!additive) {
      setSchematicSelectionTargets(normalized.componentIds, normalized.wireIds, { preserveComponents: true });
      return true;
    }
    const current = getSchematicSelectionSnapshot();
    setSchematicSelectionTargets(
      normalizeSchematicIdList(current.componentIds.concat(normalized.componentIds)),
      normalizeSchematicIdList(current.wireIds.concat(normalized.wireIds)),
      { preserveComponents: true }
    );
    return true;
  };

  const applySchematicSelectionForSignals = (signals, options = {}) => {
    const tokens = normalizeSignalTokens(signals);
    const targets = tokens.length
      ? resolveSchematicTargetsForSignals(tokens)
      : { componentIds: [], wireIds: [] };
    return applySchematicSelectionTargets(targets, options);
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

  const setActiveTraceHighlightState = (selectionTokens, hoverTokens) => {
    const normalizeHighlightToken = (value) => {
      const token = String(value ?? "").trim().toLowerCase();
      if (!token) {
        return "";
      }
      if (token.startsWith("v:") || token.startsWith("vd:") || token.startsWith("i:")) {
        return token;
      }
      return normalizeSignalToken(token);
    };
    const nextSelection = new Set(
      Array.from(selectionTokens ?? [])
        .map((entry) => normalizeHighlightToken(entry))
        .filter(Boolean)
    );
    const rawHover = new Set(
      Array.from(hoverTokens ?? [])
        .map((entry) => normalizeHighlightToken(entry))
        .filter(Boolean)
    );
    const nextHover = new Set(
      Array.from(rawHover).filter((entry) => !nextSelection.has(entry))
    );
    const nextActive = new Set(
      Array.from(nextSelection).concat(Array.from(nextHover))
    );
    if (setsEqual(activeTraceSelectionTokens, nextSelection)
      && setsEqual(activeTraceHoverTokens, nextHover)
      && setsEqual(activeTraceHighlightTokens, nextActive)) {
      return;
    }
    activeTraceSelectionTokens = nextSelection;
    activeTraceHoverTokens = nextHover;
    activeTraceHighlightTokens = nextActive;
    refreshResultsTableHighlights();
    refreshPlotResults();
  };

  const recomputeTraceHighlightState = () => {
    const selectedSource = plotTraceSelectionTokens.size
      ? plotTraceSelectionTokens
      : schematicTraceHighlightTokens;
    setActiveTraceHighlightState(selectedSource, hoverTraceHighlightTokens);
    if (schematicEditor && typeof schematicEditor.setExternalHighlights === "function") {
      const mergedTargets = mergeExternalHighlightTargets(plotExternalHighlightTargets, hoverExternalHighlightTargets);
      if (hasHighlightTargets(mergedTargets)) {
        schematicEditor.setExternalHighlights(mergedTargets);
        return;
      }
      schematicEditor.setExternalHighlights(null);
      return;
    }
  };

  const setHoverTraceHighlights = (signals, options = {}) => {
    const nextTokens = new Set(
      (signals ?? [])
        .map((signal) => normalizeTraceTokenValue(signal))
        .filter(Boolean)
    );
    const tokensChanged = !setsEqual(hoverTraceHighlightTokens, nextTokens);
    hoverTraceHighlightTokens = nextTokens;
    const projectToSchematic = options?.projectToSchematic !== false;
    const traceIndex = getTraceLinkIndex();
    const normalizedSignals = Array.from(nextTokens);
    if (projectToSchematic) {
      const voltageTargets = normalizedSignals.length
        ? buildPlotExternalTargetsForSignals(normalizedSignals, traceIndex)
        : { componentIds: [], wireIds: [] };
      const currentTargets = normalizedSignals.length
        ? buildPlotCurrentSelectionTargetsForSignals(normalizedSignals, traceIndex)
        : { componentIds: [], wireIds: [] };
      const externalTargets = {
        componentIds: normalizeSchematicIdList((voltageTargets.componentIds ?? []).concat(currentTargets.componentIds ?? [])),
        wireIds: normalizeSchematicIdList((voltageTargets.wireIds ?? []).concat(currentTargets.wireIds ?? []))
      };
      const externalEntries = normalizedSignals.length
        ? buildPlotExternalEntriesForSignals(normalizedSignals, traceIndex, { mode: "hover" })
        : [];
      const currentEntries = normalizedSignals.length
        ? buildPlotCurrentEntriesForSignals(normalizedSignals, traceIndex, { mode: "hover" })
        : [];
      setHoverExternalHighlightState({
        ...externalTargets,
        color: resolveHoverColorForSignals(normalizedSignals),
        entries: externalEntries.concat(currentEntries)
      }, { skipRecompute: true });
    } else {
      setHoverExternalHighlightState({ componentIds: [], wireIds: [], color: "", entries: [] }, { skipRecompute: true });
    }
    if (tokensChanged || projectToSchematic || hasHighlightTargets(hoverExternalHighlightTargets) || !normalizedSignals.length) {
      recomputeTraceHighlightState();
    }
  };

  const collectTraceHighlightTokensFromSchematicTargets = (componentIds, wireIds) => {
    const index = getTraceLinkIndex();
    const model = schematicEditor?.getModel?.() ?? schematicModel ?? null;
    const componentsById = new Map(
      (Array.isArray(model?.components) ? model.components : []).map((component) => [
        String(component?.id ?? "").trim(),
        component
      ])
    );
    const tokens = new Set();
    normalizeSchematicIdList(componentIds).forEach((componentIdRaw) => {
      const componentId = String(componentIdRaw ?? "").trim();
      if (!componentId) {
        return;
      }
      const selectedComponent = componentsById.get(componentId);
      const selectedType = String(selectedComponent?.type ?? "").toUpperCase();
      const selectedIsProbe = isProbeType(selectedType);
      if (selectedIsProbe) {
        const probeLabel = String(schematicProbeLabels?.get?.(componentId) ?? selectedComponent?.name ?? "").trim();
        const probeToken = normalizeSignalToken(probeLabel);
        if (probeToken) {
          tokens.add(probeToken);
        }
      }
      const directTraceTokens = index.componentToTraceTokens.get(componentId);
      directTraceTokens?.forEach((token) => {
        if (token) {
          tokens.add(token);
        }
      });
      if (!selectedIsProbe) {
        const nets = index.componentToNets.get(componentId);
        nets?.forEach((net) => {
          const token = normalizeSignalToken(`v(${net})`);
          if (token) {
            tokens.add(token);
          }
        });
      }
      const currents = index.componentToCurrentTokens.get(componentId);
      currents?.forEach((token) => {
        if (token) {
          tokens.add(token);
        }
      });
    });
    normalizeSchematicIdList(wireIds).forEach((wireIdRaw) => {
      const wireId = String(wireIdRaw ?? "").trim();
      if (!wireId) {
        return;
      }
      const net = index.wireToNet.get(wireId);
      if (!net) {
        return;
      }
      const token = normalizeSignalToken(`v(${net})`);
      if (token) {
        tokens.add(token);
      }
    });
    return tokens;
  };

  const syncTraceHighlightsFromSchematicSelection = () => {
    const selectedComponentIds = typeof schematicEditor?.getSelection === "function"
      ? schematicEditor.getSelection()
      : [];
    const selectedWireIds = typeof schematicEditor?.getWireSelections === "function"
      ? schematicEditor.getWireSelections()
      : [];
    const tokens = collectTraceHighlightTokensFromSchematicTargets(selectedComponentIds, selectedWireIds);
    schematicTraceHighlightTokens = tokens;
    recomputeTraceHighlightState();
  };

  const getNetlistSelectionLineIndex = (compileInfo) => {
    return uiNetlistPanelModule.getCachedNetlistSelectionLineIndex({
      compileInfo,
      normalizeNodeName
    });
  };

  const applyNetlistPreviewHighlights = (lines, nodeSpans) => {
    uiNetlistPanelModule.applyNetlistPreviewHighlights({
      netlistPreview,
      netlistPreviewCode,
      lines,
      nodeSpans,
      normalizeNetlistHighlightLines,
      normalizeNetlistHighlightNodeSpans
    });
  };

  const syncNetlistPreviewHighlightsFromSchematicSelection = () => {
    if (!schematicEditor || typeof schematicEditor.getModel !== "function") {
      applyNetlistPreviewHighlights([], []);
      return;
    }
    const compileInfo = latestSchematicCompile ?? {};
    const lineMap = Array.isArray(compileInfo?.lineMap) ? compileInfo.lineMap : [];
    if (!lineMap.length) {
      applyNetlistPreviewHighlights([], []);
      return;
    }
    const selection = getSchematicSelectionSnapshot();
    const componentIds = normalizeSchematicIdList(selection.componentIds);
    const wireIds = normalizeSchematicIdList(selection.wireIds);
    if (!componentIds.length && !wireIds.length) {
      applyNetlistPreviewHighlights([], []);
      return;
    }
    const selectionLineIndex = getNetlistSelectionLineIndex(compileInfo);
    const traceIndex = wireIds.length ? getTraceLinkIndex() : null;
    uiNetlistPanelModule.syncNetlistPreviewHighlightsFromSelection({
      selectionLineIndex,
      componentIds,
      wireIds,
      normalizeNodeName,
      resolveWireNet: (wireId) => traceIndex?.wireToNet?.get(wireId),
      netlistPreview,
      netlistPreviewCode,
      normalizeNetlistHighlightLines,
      normalizeNetlistHighlightNodeSpans
    });
  };

  const buildPreferredAnalysisSignals = () => {
    const compileInfo = latestSchematicCompile ?? {};
    const probeSignals = Array.isArray(compileInfo.probeSignals)
      ? compileInfo.probeSignals.map((entry) => String(entry ?? "").trim()).filter(Boolean)
      : [];
    const requestedSignals = Array.isArray(simulationConfig.save.signals)
      ? simulationConfig.save.signals.map((entry) => String(entry ?? "").trim()).filter(Boolean)
      : [];
    const isAllSignalToken = (value) => {
      const token = String(value ?? "").trim().toLowerCase();
      return token === "all" || token === "*";
    };
    const wildcardOnly = requestedSignals.length > 0 && requestedSignals.every((token) => isAllSignalToken(token));
    if (requestedSignals.length && !wildcardOnly) {
      return dedupeSignalList(requestedSignals.concat(probeSignals));
    }
    const namedSignals = Array.isArray(compileInfo.namedNodeSignals)
      ? compileInfo.namedNodeSignals.map((entry) => String(entry ?? "").trim()).filter(Boolean)
      : [];
    return dedupeSignalList(namedSignals.concat(probeSignals));
  };

  const setActiveSchematicTool = (tool) => {
    const previousTool = schematicTool;
    schematicTool = tool;
    schematicToolButtons.forEach((button) => {
      const isActive = button.dataset.schematicTool === tool;
      button.classList.toggle("active", isActive);
      button.setAttribute("aria-pressed", isActive ? "true" : "false");
      if (isActive) {
        setSelectedHelpTarget(button);
      }
    });
    if (schematicEditor && typeof schematicEditor.setTool === "function") {
      if (previousTool !== tool) {
        if (typeof schematicEditor.setSelectionWithWires === "function") {
          schematicEditor.setSelectionWithWires([], []);
        } else {
          if (typeof schematicEditor.setSelection === "function") {
            schematicEditor.setSelection([]);
          }
          if (typeof schematicEditor.selectWire === "function") {
            schematicEditor.selectWire(null);
          }
        }
      }
      schematicEditor.setTool(tool);
    }
  };

  const syncSchematicGrid = () => {
    const size = normalizeGridSize(gridSizeInput.value);
    schematicGrid.size = size;
    schematicGrid.snap = true;
    gridSizeInput.value = String(size);
    if (schematicEditor && typeof schematicEditor.setGrid === "function") {
      schematicEditor.setGrid(schematicGrid);
    }
  };

  const applyValueFieldMeta = (type, labelEl, unitEl) => {
    uiInlineEditorWorkflowModule.applyValueFieldMetaToElements({
      type,
      labelEl,
      unitEl,
      getValueFieldMeta
    });
  };

  const updateSchematicProps = (component) => {
    uiInlineEditorWorkflowModule.updateSchematicPropsForInlineEditor({
      component,
      inlineEditingComponentId,
      onSetSelectionId: (id) => {
        schematicSelectionId = id || null;
      },
      onSyncEditor: (nextComponent) => syncInlineComponentEditor(nextComponent),
      onCloseEditor: () => closeInlineComponentEditor(),
      onRefreshMeasurements: () => refreshMeasurements()
    });
  };

  function ensureSchematicApi() {
    const api = typeof self !== "undefined" ? self.SpjutSimSchematic : null;
    if (!api || typeof api.createModel !== "function") {
      return null;
    }
    if (!schematicModel) {
      schematicModel = api.createModel();
    }
    if (!schematicEditor && typeof api.createEditor === "function") {
      schematicEditor = api.createEditor(schematicCanvasWrap, schematicModel, {
        schematicTextStyle,
        componentDefaults,
        wireDefaultColor,
        placementDefaults: toolDisplayDefaults,
        onSelectionChange: (component) => {
          updateSchematicProps(component);
          if (isApplyingPlotDrivenSchematicSelection) {
            syncNetlistPreviewHighlightsFromSchematicSelection();
            updateMenuActionState();
            queueAutosave(false);
            return;
          }
          focusedTracePane = "schematic";
          clearPlotTraceSelectionState({ skipRecompute: true });
          syncTraceHighlightsFromSchematicSelection();
          syncNetlistPreviewHighlightsFromSchematicSelection();
          updateMenuActionState();
          queueAutosave(false);
        },
        onHoverTargetsChange: (targets) => {
          const componentIds = normalizeSchematicIdList(targets?.componentIds);
          const wireIds = normalizeSchematicIdList(targets?.wireIds);
          const hoverTokens = collectTraceHighlightTokensFromSchematicTargets(componentIds, wireIds);
          if (hoverTokens.size) {
            focusedTracePane = "schematic";
          }
          setHoverTraceHighlights(Array.from(hoverTokens), { projectToSchematic: false });
        },
        onComponentEdit: (component) => {
          openInlineComponentEditor(component);
        },
        onViewChange: () => {
          queueAutosave(false);
        },
        onModelChange: () => {
          if (isRestoringDocument) {
            return;
          }
          const normalizeProbeSignals = (compileInfo) => {
            const probeSignals = Array.isArray(compileInfo?.probeSignals)
              ? compileInfo.probeSignals.map((entry) => String(entry ?? "").trim()).filter(Boolean)
              : [];
            return dedupeSignals(probeSignals).map((entry) => entry.toLowerCase()).sort();
          };
          const normalizeNamedSignals = (compileInfo) => {
            const namedSignals = Array.isArray(compileInfo?.namedNodeSignals)
              ? compileInfo.namedNodeSignals.map((entry) => String(entry ?? "").trim()).filter(Boolean)
              : [];
            return dedupeSignalList(namedSignals).sort((a, b) => {
              const tokenA = normalizeSignalToken(a);
              const tokenB = normalizeSignalToken(b);
              if (tokenA !== tokenB) {
                return tokenA.localeCompare(tokenB);
              }
              return String(a ?? "").localeCompare(String(b ?? ""));
            });
          };
          const previousCompile = latestSchematicCompile ?? {};
          const previousProbeSignals = normalizeProbeSignals(previousCompile);
          const previousNamedSignals = normalizeNamedSignals(previousCompile);
          refreshSchematicNetlist();
          const currentCompile = latestSchematicCompile ?? {};
          const currentProbeSignals = normalizeProbeSignals(currentCompile);
          const currentNamedSignals = normalizeNamedSignals(currentCompile);
          const probeSignalsChanged = previousProbeSignals.join("|") !== currentProbeSignals.join("|");
          const namedSignalsChanged = previousNamedSignals.join("|") !== currentNamedSignals.join("|");
          const shouldAutoRunOp = lastRunKind === "op" || simulationConfig.activeKind === "op";
          const shouldAutoRunAc = lastRunKind === "ac"
            && Array.isArray(state.acResults?.freq)
            && state.acResults.freq.length > 0;
          const hasDcResults = Array.isArray(state.dcResults?.x)
            && state.dcResults.x.length > 0
            && Object.keys(state.dcResults?.traces ?? {}).length > 0;
          const hasTranResults = Array.isArray(state.tranResults?.x)
            && state.tranResults.x.length > 0
            && Object.keys(state.tranResults?.traces ?? {}).length > 0;
          const hasAcResults = Array.isArray(state.acResults?.freq)
            && state.acResults.freq.length > 0
            && Object.keys(state.acResults?.magnitude ?? {}).length > 0;
          const hasWildcardSaveSignals = () => {
            const requestedSignals = Array.isArray(simulationConfig.save.signals)
              ? simulationConfig.save.signals.map((entry) => String(entry ?? "").trim()).filter(Boolean)
              : [];
            if (!requestedSignals.length) {
              return true;
            }
            return requestedSignals.every((value) => {
              const token = String(value ?? "").trim().toLowerCase();
              return token === "all" || token === "*";
            });
          };
          const preferredSignalsFromCompile = (compiled) => {
            const namedSignals = Array.isArray(compiled?.namedNodeSignals)
              ? compiled.namedNodeSignals.map((entry) => String(entry ?? "").trim()).filter(Boolean)
              : [];
            const probeSignals = Array.isArray(compiled?.probeSignals)
              ? compiled.probeSignals.map((entry) => String(entry ?? "").trim()).filter(Boolean)
              : [];
            return dedupeSignalList(namedSignals.concat(probeSignals));
          };
          const buildNamedSignalAliasMap = (previousInfo, nextInfo) => {
            const toDisplayNetName = (value) => {
              const text = String(value ?? "").trim();
              if (!text) {
                return "";
              }
              const parsed = parseVoltageSignalToken(text, { preserveCase: true });
              if (parsed?.kind === "single") {
                return parsed.node;
              }
              return text;
            };
            const previousNetNames = previousInfo && typeof previousInfo.netNames === "object"
              ? previousInfo.netNames
              : {};
            const nextNetNames = nextInfo && typeof nextInfo.netNames === "object"
              ? nextInfo.netNames
              : {};
            const netIds = new Set([
              ...Object.keys(previousNetNames),
              ...Object.keys(nextNetNames)
            ]);
            const aliases = new Map();
            netIds.forEach((netId) => {
              const previousName = toDisplayNetName(previousNetNames[netId] ?? netId);
              const nextName = toDisplayNetName(nextNetNames[netId] ?? netId);
              if (!previousName || !nextName || previousName === nextName) {
                return;
              }
              aliases.set(normalizeSignalToken(`v(${previousName})`), `v(${nextName})`);
            });
            return aliases;
          };
          const remapVoltageSignalValue = (value, aliasSignal) => {
            const alias = parseVoltageSignalToken(aliasSignal, { preserveCase: true });
            if (!alias || alias.kind !== "single") {
              return String(value ?? "").trim();
            }
            const nextNode = alias.node;
            const raw = String(value ?? "").trim();
            const token = raw.toLowerCase().replace(/\s+/g, "");
            if (!token) {
              return raw;
            }
            if (token.startsWith("v(") && token.endsWith(")")) {
              return `v(${nextNode})`;
            }
            if (token.startsWith("v:")) {
              return `v:${nextNode}`;
            }
            return nextNode;
          };
          const remapSignalListByAlias = (signals, aliases) => dedupeSignalList(
            (Array.isArray(signals) ? signals : []).map((signal) => {
              const aliasSignal = aliases.get(normalizeSignalToken(signal));
              if (!aliasSignal) {
                return signal;
              }
              return remapVoltageSignalValue(signal, aliasSignal);
            })
          );
          const remapTraceMapByAlias = (traceMap, aliases) => {
            const source = traceMap && typeof traceMap === "object" ? traceMap : {};
            const remapped = {};
            let changed = false;
            Object.entries(source).forEach(([name, values]) => {
              const aliasSignal = aliases.get(normalizeSignalToken(name));
              const nextName = aliasSignal
                ? remapVoltageSignalValue(name, aliasSignal)
                : name;
              if (nextName !== name) {
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
          const applyLiveSignalRefresh = () => {
            const aliases = buildNamedSignalAliasMap(previousCompile, currentCompile);
            const usePreferredSignals = hasWildcardSaveSignals();
            const previousPreferredSignals = preferredSignalsFromCompile(previousCompile);
            const preferredSignals = preferredSignalsFromCompile(currentCompile);
            const preferredSignalCaseMap = buildSignalCaseMap(preferredSignals);
            const shouldRetainImplicitPreferredSelection = (selectedSignals) => {
              if (!usePreferredSignals) {
                return false;
              }
              const previousPreferredTokens = normalizeSignalTokenSet(previousPreferredSignals);
              if (!previousPreferredTokens.size) {
                return true;
              }
              const selectedTokens = normalizeSignalTokenSet(selectedSignals);
              return setsEqual(selectedTokens, previousPreferredTokens);
            };
            let changed = false;
            const syncSingleAxisResults = (results, traceField) => {
              if (!results || typeof results !== "object") {
                return;
              }
              const traces = results[traceField];
              if (!traces || typeof traces !== "object") {
                return;
              }
              const remappedTraces = remapTraceMapByAlias(traces, aliases);
              const casedTraces = applyTraceMapCaseMap(remappedTraces.map, preferredSignalCaseMap);
              if (remappedTraces.changed || casedTraces.changed) {
                results[traceField] = casedTraces.map;
                changed = true;
              }
              const remappedSignals = applySignalCaseMap(
                remapSignalListByAlias(results.signals, aliases),
                preferredSignalCaseMap
              );
              const nextSignals = usePreferredSignals
                ? dedupeSignalList(preferredSignals.concat(remappedSignals))
                : remappedSignals;
              if (!signalListsEqual(results.signals, nextSignals)) {
                results.signals = nextSignals;
                changed = true;
              }
              const remappedSelected = applySignalCaseMap(
                remapSignalListByAlias(results.selected, aliases),
                preferredSignalCaseMap
              );
              const nextSelected = shouldRetainImplicitPreferredSelection(results.selected)
                ? dedupeSignalList(preferredSignals.concat(remappedSelected))
                : remappedSelected;
              if (!signalListsEqual(results.selected, nextSelected)) {
                results.selected = nextSelected;
                changed = true;
              }
            };
            syncSingleAxisResults(state.dcResults, "traces");
            syncSingleAxisResults(state.tranResults, "traces");
            if (state.acResults && typeof state.acResults === "object") {
              const remappedMagnitude = remapTraceMapByAlias(state.acResults.magnitude, aliases);
              const casedMagnitude = applyTraceMapCaseMap(remappedMagnitude.map, preferredSignalCaseMap);
              if (remappedMagnitude.changed || casedMagnitude.changed) {
                state.acResults.magnitude = casedMagnitude.map;
                changed = true;
              }
              const remappedPhase = remapTraceMapByAlias(state.acResults.phase, aliases);
              const casedPhase = applyTraceMapCaseMap(remappedPhase.map, preferredSignalCaseMap);
              if (remappedPhase.changed || casedPhase.changed) {
                state.acResults.phase = casedPhase.map;
                changed = true;
              }
              const remappedSignals = applySignalCaseMap(
                remapSignalListByAlias(state.acResults.signals, aliases),
                preferredSignalCaseMap
              );
              const nextSignals = usePreferredSignals
                ? dedupeSignalList(preferredSignals.concat(remappedSignals))
                : remappedSignals;
              if (!signalListsEqual(state.acResults.signals, nextSignals)) {
                state.acResults.signals = nextSignals;
                changed = true;
              }
              const remappedSelected = applySignalCaseMap(
                remapSignalListByAlias(state.acResults.selected, aliases),
                preferredSignalCaseMap
              );
              const nextSelected = shouldRetainImplicitPreferredSelection(state.acResults.selected)
                ? dedupeSignalList(preferredSignals.concat(remappedSelected))
                : remappedSelected;
              if (!signalListsEqual(state.acResults.selected, nextSelected)) {
                state.acResults.selected = nextSelected;
                changed = true;
              }
            }
            if (changed) {
              refreshPlotResults();
              syncTraceHighlightsFromSchematicSelection();
            }
          };
          if (namedSignalsChanged) {
            applyLiveSignalRefresh();
          }
          const buildAutoRunSignals = (kind, compiled) => {
            const requestedSignals = Array.isArray(simulationConfig.save.signals)
              ? simulationConfig.save.signals.map((entry) => String(entry ?? "").trim()).filter(Boolean)
              : [];
            const isAllSignalToken = (value) => {
              const token = String(value ?? "").trim().toLowerCase();
              return token === "all" || token === "*";
            };
            const namedSignals = Array.isArray(compiled.namedNodeSignals)
              ? compiled.namedNodeSignals.map((entry) => String(entry ?? "").trim()).filter(Boolean)
              : [];
            const probeSignals = Array.isArray(compiled.probeSignals)
              ? compiled.probeSignals.map((entry) => String(entry ?? "").trim()).filter(Boolean)
              : [];
            const wildcardOnly = requestedSignals.length > 0 && requestedSignals.every((token) => isAllSignalToken(token));
            if (kind === "op") {
              const opSignals = dedupeSignals(["all"].concat(requestedSignals, probeSignals));
              return opSignals.length ? opSignals : ["all"];
            }
            const preferredSignals = dedupeSignals(namedSignals.concat(probeSignals));
            const fallbackSignals = preferredSignals.length
              ? preferredSignals
              : ((kind === "dc" || kind === "tran" || kind === "ac") ? ["all"] : []);
            const runSignals = (!requestedSignals.length || wildcardOnly)
              ? fallbackSignals
              : dedupeSignals(requestedSignals.concat(probeSignals));
            return runSignals;
          };
          const queuedAutoRuns = new Map();
          const queueAutoRun = (kind, compiled) => {
            const hasErrors = (Array.isArray(compiled.compileErrors) && compiled.compileErrors.length > 0)
              || (Array.isArray(compiled.analysisErrors) && compiled.analysisErrors.length > 0);
            if (hasErrors) {
              return;
            }
            const signals = buildAutoRunSignals(kind, compiled);
            // Compare full request signatures (netlist + run signals) so probe-only
            // signal-set changes still trigger queued auto-runs under explicit save lists.
            if (!hasRunRequestChangedSinceLastRequest(kind, compiled, signals)) {
              return;
            }
            queuedAutoRuns.set(kind, { compiled, signals });
          };
          if (autoRunTimer) {
            clearTimeout(autoRunTimer);
          }
          if (shouldAutoRunOp) {
            const compiled = simulationConfig.activeKind === "op"
              ? currentCompile
              : buildSchematicNetlistForKind("op");
            queueAutoRun("op", compiled);
          }
          if (shouldAutoRunAc) {
            const compiled = simulationConfig.activeKind === "ac"
              ? currentCompile
              : buildSchematicNetlistForKind("ac");
            queueAutoRun("ac", compiled);
          }
          if (probeSignalsChanged) {
            if (hasDcResults) {
              const compiledDc = simulationConfig.activeKind === "dc"
                ? currentCompile
                : buildSchematicNetlistForKind("dc");
              queueAutoRun("dc", compiledDc);
            }
            if (hasTranResults) {
              const compiledTran = simulationConfig.activeKind === "tran"
                ? currentCompile
                : buildSchematicNetlistForKind("tran");
              queueAutoRun("tran", compiledTran);
            }
            if (hasAcResults) {
              const compiledAc = simulationConfig.activeKind === "ac"
                ? currentCompile
                : buildSchematicNetlistForKind("ac");
              queueAutoRun("ac", compiledAc);
            }
          }
          if (queuedAutoRuns.size) {
            autoRunTimer = setTimeout(() => {
              queuedAutoRuns.forEach((task, kind) => {
                rememberRunRequestSignature(kind, task.compiled, task.signals);
                switch (kind) {
                  case "op":
                    lastRunKind = "op";
                    actions.onRun(task.compiled.netlist ?? "", task.signals.length ? task.signals : undefined);
                    break;
                  case "dc":
                    actions.onRunDc(task.compiled.netlist ?? "", task.signals.length ? task.signals : undefined);
                    break;
                  case "tran":
                    actions.onRunTran(task.compiled.netlist ?? "", task.signals.length ? task.signals : undefined);
                    break;
                  case "ac":
                    actions.onRunAc(task.compiled.netlist ?? "", task.signals.length ? task.signals : undefined);
                    break;
                  default:
                    break;
                }
              });
            }, 200);
          }
          queueAutosave();
          if (
            autoSwitchToSelectOnPlace
            && schematicTool !== "select"
            && schematicTool !== "wire"
            && schematicEditor
            && typeof schematicEditor.getTool === "function"
            && schematicEditor.getTool()?.mode === "place"
          ) {
            setActiveSchematicTool("select");
          } else if (
            autoSwitchToSelectOnWire
            && schematicTool === "wire"
            && schematicEditor
            && typeof schematicEditor.getTool === "function"
            && schematicEditor.getTool()?.mode === "wire"
            && typeof schematicEditor.isWirePlacementActive === "function"
            && !schematicEditor.isWirePlacementActive()
          ) {
            setActiveSchematicTool("select");
          }
        }
      });
      schematicPanel._schematicEditor = schematicEditor;
      applySchematicTextStyleToEditor();
      applyToolDisplayDefaultsToEditor();
      setActiveSchematicTool(schematicTool);
      syncSchematicGrid();
    }
    return api;
  }


  const stripEndDirective = uiRunSignatureModule.stripEndDirective;
  const rememberRunRequestSignature = (kind, compileInfo, signals) => {
    uiRunSignatureModule.rememberRunRequestSignature({
      kind,
      compileInfo,
      signals,
      simulationKindIds,
      signaturesByKind: lastRequestedRunRequestSignaturesByKind
    });
  };
  const hasRunRequestChangedSinceLastRequest = (kind, compileInfo, signals) =>
    uiRunSignatureModule.hasRunRequestChangedSinceLastRequest({
      kind,
      compileInfo,
      signals,
      simulationKindIds,
      signaturesByKind: lastRequestedRunRequestSignaturesByKind
    });
  const applySourceOverride = uiRunSignatureModule.applySourceOverride;

  const buildAnalysisDirectives = (kind, fallbackSignals) => {
    return buildAnalysisDirectivesForConfig(kind, simulationConfig, fallbackSignals);
  };

  const getDifferentialProbePins = (component) => {
    const pins = Array.isArray(component?.pins) ? component.pins : [];
    if (pins.length < 2) {
      return null;
    }
    const findPin = (token) => pins.find((pin) =>
      String(pin?.id ?? pin?.name ?? "").trim().toUpperCase() === token);
    const pos = findPin("P+") ?? pins[0];
    const neg = findPin("P-") ?? pins[1];
    if (!pos || !neg || pos === neg) {
      return null;
    }
    return { pos, neg };
  };

  const pointOnOrthSegment = (point, start, end) => {
    if (!point || !start || !end) {
      return false;
    }
    if (start.x === end.x) {
      if (Math.abs(point.x - start.x) > 0.001) {
        return false;
      }
      const minY = Math.min(start.y, end.y) - 0.001;
      const maxY = Math.max(start.y, end.y) + 0.001;
      return point.y >= minY && point.y <= maxY;
    }
    if (start.y === end.y) {
      if (Math.abs(point.y - start.y) > 0.001) {
        return false;
      }
      const minX = Math.min(start.x, end.x) - 0.001;
      const maxX = Math.max(start.x, end.x) + 0.001;
      return point.x >= minX && point.x <= maxX;
    }
    return false;
  };

  const buildProbeNetResolver = (compileInfo) => {
    const api = getSchematicApi();
    const netNames = (compileInfo && typeof compileInfo.netNames === "object")
      ? compileInfo.netNames
      : {};
    let nets = [];
    if (api && typeof api.buildNets === "function" && schematicModel) {
      try {
        const built = api.buildNets(schematicModel);
        nets = Array.isArray(built) ? built : [];
      } catch {
        nets = [];
      }
    }
    const pointToNetName = new Map();
    nets.forEach((net) => {
      const netName = String(netNames[net.id] ?? net.id ?? "").trim();
      if (!netName) {
        return;
      }
      (net.nodes ?? []).forEach((node) => {
        pointToNetName.set(`${node.x},${node.y}`, netName);
      });
    });
    const resolveNetNameAtPoint = (point) => {
      if (!point) {
        return null;
      }
      const key = `${point.x},${point.y}`;
      const exact = pointToNetName.get(key);
      if (exact) {
        return exact;
      }
      const wires = Array.isArray(schematicModel?.wires) ? schematicModel.wires : [];
      for (const wire of wires) {
        const points = Array.isArray(wire?.points) ? wire.points : [];
        for (let index = 0; index < points.length - 1; index += 1) {
          const start = points[index];
          const end = points[index + 1];
          if (!pointOnOrthSegment(point, start, end)) {
            continue;
          }
          const startNet = pointToNetName.get(`${start.x},${start.y}`);
          const endNet = pointToNetName.get(`${end.x},${end.y}`);
          const resolved = startNet || endNet;
          if (resolved) {
            return resolved;
          }
        }
      }
      return null;
    };
    return {
      resolveNetNameAtPoint
    };
  };

  const dedupeSignals = (signals) => {
    const seen = new Set();
    const unique = [];
    (signals ?? []).forEach((entry) => {
      const signal = String(entry ?? "").trim();
      if (!signal) {
        return;
      }
      const key = signal.toLowerCase();
      if (seen.has(key)) {
        return;
      }
      seen.add(key);
      unique.push(signal);
    });
    return unique;
  };

  const buildProbeDescriptors = (compileInfo) => {
    const descriptors = [];
    const components = Array.isArray(schematicModel?.components) ? schematicModel.components : [];
    const componentsById = new Map(
      components.map((component) => [String(component?.id ?? "").trim(), component])
    );
    const componentLines = (compileInfo && typeof compileInfo.componentLines === "object")
      ? compileInfo.componentLines
      : {};
    const netResolver = buildProbeNetResolver(compileInfo);
    const getProbeTargetDistanceSq = (probeComponent, probePin, candidateId) => {
      if (!probePin) {
        return Infinity;
      }
      const normalizedId = String(candidateId ?? "").trim();
      if (!normalizedId || !componentLines[normalizedId]) {
        return Infinity;
      }
      const candidate = componentsById.get(normalizedId);
      if (!candidate || candidate === probeComponent) {
        return Infinity;
      }
      const candidateType = String(candidate?.type ?? "").toUpperCase();
      if (!candidateType || candidateType === "NET" || candidateType === "GND" || candidateType === "TEXT" || isProbeType(candidateType)) {
        return Infinity;
      }
      const candidatePins = Array.isArray(candidate?.pins) ? candidate.pins : [];
      if (candidatePins.length < 2) {
        return Infinity;
      }
      const pinA = candidatePins[0];
      const pinB = candidatePins[1];
      const centerX = (pinA.x + pinB.x) / 2;
      const centerY = (pinA.y + pinB.y) / 2;
      const dx = centerX - probePin.x;
      const dy = centerY - probePin.y;
      return dx * dx + dy * dy;
    };
    const resolveProbeTargetId = (probeComponent, requestedTargetId, probePin) => {
      const requested = String(requestedTargetId ?? "").trim();
      if (!probePin) {
        return requested && componentLines[requested] ? requested : "";
      }
      const requestedDist = getProbeTargetDistanceSq(probeComponent, probePin, requested);
      if (requested && requestedDist <= 1) {
        return requested;
      }
      let bestId = "";
      let bestDist = Infinity;
      components.forEach((candidate) => {
        if (!candidate || candidate === probeComponent) {
          return;
        }
        const candidateId = String(candidate?.id ?? "").trim();
        if (!candidateId) {
          return;
        }
        const dist = getProbeTargetDistanceSq(probeComponent, probePin, candidateId);
        if (!Number.isFinite(dist)) {
          return;
        }
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
    components.forEach((component) => {
      const type = String(component?.type ?? "").toUpperCase();
      if (!isProbeType(type)) {
        return;
      }
      const pins = Array.isArray(component?.pins) ? component.pins : [];
      const primaryPin = pins[0];
      if (!primaryPin && type !== "PD") {
        return;
      }
      const fallbackLabel = String(component?.name ?? component?.id ?? "").trim() || String(component?.id ?? "");
      const entry = {
        id: String(component.id ?? ""),
        type,
        label: fallbackLabel,
        component
      };
      if (type === "PV") {
        const net = netResolver.resolveNetNameAtPoint(primaryPin);
        if (net) {
          entry.netA = net;
          entry.signal = `v(${net})`;
          entry.label = `V(${net})`;
          entry.saveSignals = [entry.signal];
        } else {
          entry.saveSignals = [];
        }
      } else if (type === "PD") {
        const diffPins = getDifferentialProbePins(component);
        const netA = netResolver.resolveNetNameAtPoint(diffPins?.pos ?? null);
        const netB = netResolver.resolveNetNameAtPoint(diffPins?.neg ?? null);
        entry.netA = netA;
        entry.netB = netB;
        if (netA && netB) {
          entry.signal = `v(${netA},${netB})`;
          entry.label = `V(${netA},${netB})`;
          entry.saveSignals = [entry.signal];
        } else {
          entry.invalid = true;
          entry.label = "V(?)";
          entry.saveSignals = [];
        }
      } else if (type === "PI" || type === "PP") {
        const requestedTargetId = String(component?.value ?? "").trim();
        const targetId = resolveProbeTargetId(component, requestedTargetId, primaryPin);
        const lineInfo = targetId ? componentLines[targetId] : null;
        const netlistId = String(lineInfo?.netlistId ?? targetId).trim();
        const targetType = String(lineInfo?.type ?? "").toUpperCase();
        entry.targetId = targetId;
        entry.netA = lineInfo?.netA ?? null;
        entry.netB = lineInfo?.netB ?? null;
        if (netlistId) {
          entry.label = type === "PP" ? `P(${netlistId})` : `I(${netlistId})`;
        } else if (targetId) {
          entry.label = type === "PP" ? `P(${targetId})` : `I(${targetId})`;
        } else {
          entry.label = type === "PP" ? "P(?)" : "I(?)";
        }
        const currentSignals = [];
        if (netlistId && (targetType === "V" || targetType === "I" || targetType === "SW")) {
          currentSignals.push(`i(${netlistId})`);
        }
        if (targetId && targetType === "D") {
          currentSignals.push(`@${targetId.toLowerCase()}[id]`);
        }
        if (targetId && targetType && targetType !== "V" && targetType !== "I") {
          currentSignals.push(`@${targetId.toLowerCase()}[i]`);
        }
        if (!currentSignals.length && netlistId && lineInfo) {
          currentSignals.push(`i(${netlistId})`);
        }
        entry.currentSignals = dedupeSignals(currentSignals);
        const saveSignals = entry.currentSignals.slice();
        if (type === "PP" && entry.netA && entry.netB) {
          entry.voltageSignal = `v(${entry.netA},${entry.netB})`;
          saveSignals.push(entry.voltageSignal);
        }
        entry.saveSignals = dedupeSignals(saveSignals);
      }
      descriptors.push(entry);
    });
    const saveSignals = dedupeSignals(
      descriptors.flatMap((entry) => (Array.isArray(entry.saveSignals) ? entry.saveSignals : []))
    );
    return { descriptors, saveSignals };
  };

  const buildSchematicNetlistForKind = (kind) => {
    const api = ensureSchematicApi();
    if (!api || typeof api.compileNetlist !== "function" || !schematicModel) {
      return {
        netlist: "",
        warnings: ["Schematic API unavailable."],
        lineMap: [],
        netNames: {},
        analysisErrors: [],
        compileErrors: [],
        namedNodeSignals: []
      };
    }
    const compiled = api.compileNetlist(schematicModel);
    let baseNetlist = "";
    let compileWarnings = [];
    let compileErrors = [];
    let lineMap = [];
    let netNames = {};
    let pinNetMap = {};
    let componentLines = {};
    let namedNodeSignals = [];
    if (typeof compiled === "string") {
      baseNetlist = compiled;
    } else if (compiled && typeof compiled === "object") {
      baseNetlist = compiled.netlist ?? "";
      compileWarnings = Array.isArray(compiled.warnings) ? compiled.warnings.slice() : [];
      compileErrors = Array.isArray(compiled.compileErrors) ? compiled.compileErrors.slice() : [];
      lineMap = Array.isArray(compiled.lineMap) ? compiled.lineMap.slice() : [];
      netNames = compiled.netNames ?? {};
      pinNetMap = compiled.pinNetMap ?? {};
      componentLines = compiled.componentLines ?? {};
      namedNodeSignals = Array.isArray(compiled.namedNodeSignals)
        ? compiled.namedNodeSignals.map((entry) => String(entry ?? "").trim()).filter(Boolean)
        : [];
    }
    if (kind === "tran" || kind === "ac") {
      const config = simulationConfig[kind] ?? {};
      baseNetlist = applySourceOverride(baseNetlist, config.source, config.sourceValue);
    }
    const probeInfo = buildProbeDescriptors({
      netNames,
      componentLines
    });
    const analysisFallbackSignals = dedupeSignals(
      (namedNodeSignals ?? []).concat(probeInfo.saveSignals ?? [])
    );
    const stripped = stripEndDirective(baseNetlist);
    const analysis = buildAnalysisDirectives(kind, analysisFallbackSignals);
    const warnings = [...compileWarnings, ...compileErrors, ...analysis.errors];
    const core = stripped.trim() ? stripped : "* schematic";
    const preamble = stripEndDirective(netlistPreamble);
    const splitLines = (text) => (typeof text === "string" && text.length ? text.split(/\r?\n/) : []);
    const baseLines = splitLines(baseNetlist);
    const preambleLines = splitLines(preamble);
    const coreLines = splitLines(core);
    const filteredLineMap = lineMap.filter((entry) => {
      const lineText = baseLines[entry.line - 1] ?? "";
      return lineText.trim().toLowerCase() !== ".end";
    });
    const preambleOffset = preambleLines.length;
    const adjustedLineMap = filteredLineMap.map((entry) => ({
      ...entry,
      line: entry.line + preambleOffset
    }));
    const fullLineMap = [];
    preambleLines.forEach((line, index) => {
      if (!String(line ?? "").trim()) {
        return;
      }
      fullLineMap.push({
        line: index + 1,
        kind: "directive",
        source: "preamble"
      });
    });
    adjustedLineMap.forEach((entry) => fullLineMap.push(entry));
    const analysisStart = preambleOffset + coreLines.length + 1;
    analysis.lines.forEach((line, index) => {
      fullLineMap.push({
        line: analysisStart + index,
        kind: "directive",
        source: "analysis",
        analysisKind: kind
      });
    });
    const lines = [];
    if (preambleLines.length) {
      lines.push(...preambleLines);
    }
    if (coreLines.length) {
      lines.push(...coreLines);
    }
    if (analysis.lines.length) {
      lines.push(...analysis.lines);
    }
    lines.push(".end");
    return {
      netlist: lines.join("\n"),
      warnings,
      compileErrors,
      analysisErrors: analysis.errors,
      lineMap: fullLineMap,
      netNames,
      pinNetMap,
      componentLines,
      preamble,
      namedNodeSignals,
      probeSignals: probeInfo.saveSignals ?? [],
      probeDescriptors: probeInfo.descriptors ?? []
    };
  };

  refreshSchematicNetlist = () => {
    latestSchematicCompile = buildSchematicNetlistForKind(simulationConfig.activeKind);
    const sourceConfigChanged = syncSourceInputOptions(latestSchematicCompile);
    if (sourceConfigChanged) {
      latestSchematicCompile = buildSchematicNetlistForKind(simulationConfig.activeKind);
      if (!isRestoringDocument) {
        queueAutosave();
      }
    }
    invalidateTraceLinkIndexCache();
    rebuildTraceNetColorMap();
    renderOpResults(state.opResults);
    refreshPlotResults();
    netlistPreview.value = latestSchematicCompile.netlist ?? "";
    const warnings = Array.isArray(latestSchematicCompile.warnings) ? latestSchematicCompile.warnings : [];
    netlistWarnings.textContent = warnings.length ? warnings.join("\n") : "";
    syncNetlistPreviewHighlightsFromSchematicSelection();
    refreshMeasurements();
    recomputeTraceHighlightState();
  };

  const buildResultsCache = () => ({
    op: state.opResults ?? null,
    dc: state.dcResults ?? null,
    tran: state.tranResults ?? null,
    ac: state.acResults ?? null,
    history: []
  });

  const buildDocumentPayload = (includeResults) => {
    if (!persistenceApi || typeof persistenceApi.createDocument !== "function") {
      return null;
    }
    ensureSchematicApi();
    const model = schematicEditor?.getModel?.() ?? schematicModel ?? { components: [], wires: [] };
    const editorState = {
      view: schematicEditor?.getView?.() ?? null,
      selection: getValidSelection(),
      grid: schematicEditor?.getGrid?.() ?? schematicGrid
    };
    const simulation = {
      config: simulationConfig,
      preamble: netlistPreamble
    };
    const uiState = {
      plot: {
        showGrid
      },
      resultsPane: {
        mode: resultsPaneState.mode,
        splitRatio: resultsPaneState.splitRatio
      },
      settings: {
        autoSwitchToSelectOnPlace: Boolean(autoSwitchToSelectOnPlace),
        autoSwitchToSelectOnWire: Boolean(autoSwitchToSelectOnWire),
        schematicText: {
          font: schematicTextStyle.font,
          size: schematicTextStyle.size,
          bold: schematicTextStyle.bold === true,
          italic: schematicTextStyle.italic === true
        },
        componentDefaults,
        wireDefaultColor,
        toolDisplayDefaults
      }
    };
    const results = includeResults ? buildResultsCache() : null;
    const doc = persistenceApi.createDocument({
      meta: documentMeta,
      schematic: model,
      editor: editorState,
      simulation,
      ui: uiState,
      results,
      includeResults
    });
    if (doc?.createdAt && !documentMeta.createdAt) {
      documentMeta.createdAt = doc.createdAt;
    }
    if (typeof doc?.title === "string") {
      documentMeta.title = doc.title;
    }
    return doc;
  };

  const persistAutosave = async () => {
    if (!persistenceApi || typeof persistenceApi.saveAutosave !== "function") {
      return;
    }
    const doc = buildDocumentPayload(false);
    if (!doc) {
      return;
    }
    const ok = await persistenceApi.saveAutosave(doc);
    if (ok && typeof persistenceApi.setRecentInfo === "function") {
      persistenceApi.setRecentInfo({
        lastAutosaveKey: persistenceApi.AUTOSAVE_KEY,
        lastOpenedName: documentMeta.fileName || suggestedFileName
      });
    }
  };

  const persistAutosaveLocal = () => {
    if (!persistenceApi || typeof persistenceApi.saveAutosaveLocal !== "function") {
      return false;
    }
    const doc = buildDocumentPayload(false);
    if (!doc) {
      return false;
    }
    const ok = persistenceApi.saveAutosaveLocal(doc);
    if (ok && typeof persistenceApi.setRecentInfo === "function") {
      persistenceApi.setRecentInfo({
        lastAutosaveKey: persistenceApi.AUTOSAVE_KEY,
        lastOpenedName: documentMeta.fileName || suggestedFileName
      });
    }
    return ok;
  };

  function queueAutosave(markDirty = true) {
    if (isRestoringDocument) {
      return;
    }
    if (markDirty) {
      markDocumentDirty();
    }
    if (!persistenceApi || typeof persistenceApi.saveAutosave !== "function") {
      return;
    }
    if (autosaveTimer) {
      clearTimeout(autosaveTimer);
    }
    autosaveTimer = setTimeout(() => {
      autosaveTimer = null;
      persistAutosave();
    }, 350);
  }

  const flushAutosaveOnPageHide = () => {
    if (isRestoringDocument) {
      return;
    }
    if (autosaveTimer) {
      clearTimeout(autosaveTimer);
      autosaveTimer = null;
    }
    persistAutosaveLocal();
  };
  window.addEventListener("pagehide", flushAutosaveOnPageHide);
  window.addEventListener("beforeunload", flushAutosaveOnPageHide);

  updateConfigSectionVisibility = () => {
    Object.entries(configSections).forEach(([kind, section]) => {
      section.hidden = kind !== simulationConfig.activeKind;
    });
  };

  setActiveSimulationKind = (kind) => {
    if (!simulationKindIds.has(kind)) {
      return;
    }
    simulationConfig.activeKind = kind;
    updateConfigSectionVisibility();
    refreshSchematicNetlist();
    setActiveTab(kind);
    queueAutosave();
  };

  const applySimulationPreset = (preset) => {
    if (!preset || typeof preset !== "object") {
      return;
    }
    if (preset.activeKind) {
      simulationConfig.activeKind = preset.activeKind;
    }
    const updateField = (kind, key, value) => {
      const text = String(value ?? "");
      simulationConfig[kind][key] = text;
      const target = configInputs[kind]?.[key];
      if (target) {
        target.value = text;
      }
    };
    if (preset.dc) {
      Object.entries(preset.dc).forEach(([key, value]) => {
        updateField("dc", key, value);
      });
    }
    if (preset.tran) {
      Object.entries(preset.tran).forEach(([key, value]) => {
        updateField("tran", key, value);
      });
      if (!preset.tran.sourceMode && preset.tran.sourceValue) {
        simulationConfig.tran.sourceMode = "custom";
        simulationConfig.tran.customValue = String(preset.tran.sourceValue ?? "");
        if (configInputs.tran?.sourceMode) {
          configInputs.tran.sourceMode.value = simulationConfig.tran.sourceMode;
        }
        if (configInputs.tran?.customValue) {
          configInputs.tran.customValue.value = simulationConfig.tran.customValue;
        }
      }
      updateTranWaveformVisibility();
      updateTranSourceValue();
    }
    if (preset.ac) {
      Object.entries(preset.ac).forEach(([key, value]) => {
        updateField("ac", key, value);
      });
    }
    if (Array.isArray(preset.saveSignals)) {
      simulationConfig.save.signals = preset.saveSignals.slice();
      saveInput.value = simulationConfig.save.signals.join(", ");
    }
    if (typeof preset.preamble === "string") {
      netlistPreamble = preset.preamble;
      netlistPreambleInput.value = netlistPreamble;
    }
    updateConfigSectionVisibility();
    setActiveTab(simulationConfig.activeKind);
    queueAutosave();
  };

  const normalizeSimulationConfig = (config) => {
    const defaults = createSimulationConfig();
    if (!config || typeof config !== "object") {
      return defaults;
    }
    const mergeKind = (kind) => ({
      ...defaults[kind],
      ...(config[kind] ?? {})
    });
    const next = {
      ...defaults,
      ...config,
      dc: mergeKind("dc"),
      tran: mergeKind("tran"),
      ac: mergeKind("ac"),
      save: {
        signals: Array.isArray(config.save?.signals)
          ? config.save.signals.map((entry) => String(entry ?? "").trim()).filter(Boolean)
          : []
      }
    };
    if (!simulationKindIds.has(next.activeKind)) {
      next.activeKind = defaults.activeKind;
    }
    return next;
  };

  const applySimulationConfig = (config) => {
    const next = normalizeSimulationConfig(config);
    simulationConfig.activeKind = next.activeKind;
    simulationConfig.op = next.op && typeof next.op === "object" ? { ...next.op } : {};
    simulationConfig.dc = { ...next.dc };
    simulationConfig.tran = { ...next.tran };
    simulationConfig.ac = { ...next.ac };
    simulationConfig.save = {
      signals: Array.isArray(next.save?.signals) ? next.save.signals.slice() : []
    };
    const syncInputs = (kind, values) => {
      Object.entries(values).forEach(([key, value]) => {
        const target = configInputs[kind]?.[key];
        if (target) {
          target.value = String(value ?? "");
        }
      });
    };
    syncInputs("dc", next.dc);
    syncInputs("tran", next.tran);
    syncInputs("ac", next.ac);
    saveInput.value = next.save.signals.join(", ");
    updateTranWaveformVisibility();
    updateTranSourceValue();
    updateConfigSectionVisibility();
    setActiveTab(next.activeKind);
  };

  const applyResultsCache = (cache) => {
    const op = cache?.op ?? { plot: "", nodes: [], currents: [] };
    const dc = cache?.dc ?? { x: [], traces: {}, signals: [], selected: [] };
    const tran = cache?.tran ?? { x: [], traces: {}, signals: [], selected: [] };
    const ac = cache?.ac ?? { freq: [], magnitude: {}, phase: {}, signals: [], selected: [] };
    state.opResults = op;
    state.dcResults = dc;
    state.tranResults = tran;
    state.acResults = ac;
    renderOpResults(op);
    renderDcResults(dc);
    renderTranResults(tran);
    renderAcResults(ac);
    refreshMeasurements();
  };

  function applyDocument(doc, options = {}) {
    if (!persistenceApi || typeof persistenceApi.extractDocument !== "function") {
      netlistWarnings.textContent = "Persistence API unavailable.";
      return;
    }
    const extracted = persistenceApi.extractDocument(doc);
    if (!extracted) {
      netlistWarnings.textContent = "Invalid schematic file.";
      return;
    }
    isRestoringDocument = true;
    const api = ensureSchematicApi();
    if (!api || !schematicModel) {
      netlistWarnings.textContent = "Schematic model not initialized.";
      isRestoringDocument = false;
      return;
    }
    documentMeta.title = extracted.meta.title || documentMeta.title;
    if (extracted.meta.createdAt) {
      documentMeta.createdAt = extracted.meta.createdAt;
    }
    if (typeof options.fileName === "string" && options.fileName.trim()) {
      documentMeta.fileName = options.fileName.trim();
    }
    const addComponent = typeof api.addComponent === "function"
      ? api.addComponent
      : (model, component) => {
        model.components.push(component);
        return component;
      };
    const addWire = typeof api.addWire === "function"
      ? api.addWire
      : (model, wire) => {
        model.wires.push(wire);
        return wire;
      };
    if (!Array.isArray(schematicModel.components)) {
      schematicModel.components = [];
    }
    if (!Array.isArray(schematicModel.wires)) {
      schematicModel.wires = [];
    }
    schematicModel.components.length = 0;
    schematicModel.wires.length = 0;
    extracted.schematic.components.forEach((component) => {
      addComponent(schematicModel, component);
    });
    extracted.schematic.wires.forEach((wire) => {
      addWire(schematicModel, wire);
    });
    if (schematicEditor && typeof schematicEditor.render === "function") {
      schematicEditor.render();
    }
    if (extracted.editor.grid) {
      const grid = extracted.editor.grid;
      schematicGrid.size = normalizeGridSize(grid.size);
      schematicGrid.snap = true;
      schematicGrid.visible = Boolean(grid.visible);
      gridSizeInput.value = String(schematicGrid.size);
      gridToggleButton.setAttribute("aria-pressed", schematicGrid.visible ? "true" : "false");
      if (schematicEditor && typeof schematicEditor.setGrid === "function") {
        schematicEditor.setGrid(schematicGrid);
      }
    }
    if (typeof extracted.ui?.plot?.showGrid === "boolean") {
      showGrid = extracted.ui.plot.showGrid;
      gridCheckDc.checked = showGrid;
      gridCheckT.checked = showGrid;
      gridCheckA.checked = showGrid;
    }
    if (extracted.ui?.resultsPane) {
      const restoredPane = normalizeResultsPaneState(extracted.ui.resultsPane);
      resultsPaneState = restoredPane;
      applyResultsPaneState({ skipResize: true });
    }
    if (typeof extracted.ui?.settings?.autoSwitchToSelectOnPlace === "boolean") {
      autoSwitchToSelectOnPlace = extracted.ui.settings.autoSwitchToSelectOnPlace;
    }
    if (typeof extracted.ui?.settings?.autoSwitchToSelectOnWire === "boolean") {
      autoSwitchToSelectOnWire = extracted.ui.settings.autoSwitchToSelectOnWire;
    }
    componentDefaults = normalizeComponentDefaults(extracted.ui?.settings?.componentDefaults, getBuiltInComponentDefaults());
    applyComponentDefaultsToEditor();
    wireDefaultColor = normalizeWireDefaultColor(extracted.ui?.settings?.wireDefaultColor, null);
    applyWireDefaultColorToEditor();
    toolDisplayDefaults = normalizeToolDisplayDefaults(
      extracted.ui?.settings?.toolDisplayDefaults,
      getBuiltInToolDisplayDefaults()
    );
    applyToolDisplayDefaultsToEditor();
    const extractedSchematicText = extracted.ui?.settings?.schematicText;
    const hasSchematicTextOverride = extractedSchematicText
      && typeof extractedSchematicText === "object"
      && (
        extractedSchematicText.font !== null
        || extractedSchematicText.size !== null
        || extractedSchematicText.bold !== null
        || extractedSchematicText.italic !== null
      );
    if (hasSchematicTextOverride) {
      schematicTextStyle = normalizeSchematicTextStyle(extractedSchematicText, schematicTextStyle);
      applySchematicTextStyleToEditor();
    }
    if (schematicEditor && typeof schematicEditor.setView === "function" && extracted.editor.view) {
      schematicEditor.setView(extracted.editor.view, { preserveAspect: false });
    }
    if (schematicEditor && typeof schematicEditor.setSelectionWithWires === "function" && extracted.editor.selection) {
      const selection = extracted.editor.selection;
      const componentIds = Array.isArray(selection.componentIds) ? selection.componentIds : [];
      const wireIds = Array.isArray(selection.wireIds) ? selection.wireIds : [];
      schematicEditor.setSelectionWithWires(componentIds, wireIds, { preserveComponents: true });
    }
    syncTraceHighlightsFromSchematicSelection();
    applySimulationConfig(extracted.simulation.config);
    netlistPreamble = extracted.simulation.preamble ?? "";
    netlistPreambleInput.value = netlistPreamble;
    applyResultsCache(extracted.results);
    isRestoringDocument = false;
    refreshSchematicNetlist();
    const shouldMarkDirty = options.markDirty ?? true;
    if (shouldMarkDirty) {
      markDocumentDirty();
    } else {
      markDocumentSaved();
    }
  }
  schematicPanel._applyDocument = applyDocument;

  const hasResults = () => {
    const opNodes = state.opResults?.nodes ?? [];
    const opCurrents = state.opResults?.currents ?? [];
    const dcTraces = state.dcResults?.traces ?? {};
    const tranTraces = state.tranResults?.traces ?? {};
    const acMag = state.acResults?.magnitude ?? {};
    return Boolean(opNodes.length || opCurrents.length
      || (state.dcResults?.x?.length && Object.keys(dcTraces).length)
      || (state.tranResults?.x?.length && Object.keys(tranTraces).length)
      || (state.acResults?.freq?.length && Object.keys(acMag).length));
  };

  const isSimulationConfigDefault = () => {
    const defaults = createSimulationConfig();
    try {
      return JSON.stringify(simulationConfig) === JSON.stringify(defaults);
    } catch {
      return false;
    }
  };

  const hasSchematicDocumentContent = () => {
    const hasModel = (schematicModel?.components?.length ?? 0) > 0
      || (schematicModel?.wires?.length ?? 0) > 0;
    const hasPreamble = Boolean(netlistPreamble && netlistPreamble.trim().length);
    const hasConfigChanges = !isSimulationConfigDefault();
    return hasModel || hasPreamble || hasConfigChanges || hasResults();
  };

  const resetDocumentState = () => {
    const api = ensureSchematicApi();
    if (!api || !schematicModel) {
      netlistWarnings.textContent = "Schematic model not initialized.";
      return;
    }
    const hasAnything = hasSchematicDocumentContent();
    if (hasAnything && typeof window.confirm === "function") {
      const ok = window.confirm("Start a new schematic? Unsaved changes will be lost.");
      if (!ok) {
        return;
      }
    }
    isRestoringDocument = true;
    if (Array.isArray(schematicModel.components)) {
      schematicModel.components.length = 0;
    } else {
      schematicModel.components = [];
    }
    if (Array.isArray(schematicModel.wires)) {
      schematicModel.wires.length = 0;
    } else {
      schematicModel.wires = [];
    }
    if (schematicEditor) {
      if (typeof schematicEditor.setSelectionWithWires === "function") {
        schematicEditor.setSelectionWithWires([], [], { preserveComponents: true });
      } else if (typeof schematicEditor.setSelection === "function") {
        schematicEditor.setSelection([]);
      }
      if (typeof schematicEditor.resetView === "function") {
        schematicEditor.resetView();
      }
      if (typeof schematicEditor.render === "function") {
        schematicEditor.render();
      }
    }
    netlistPreamble = "";
    netlistPreambleInput.value = "";
    applySimulationConfig(createSimulationConfig());
    lastRunKind = simulationConfig.activeKind;
    applyResultsCache(null);
    documentMeta.title = "";
    documentMeta.createdAt = "";
    documentMeta.fileName = "";
    saveFileHandle = null;
    resetSaveIndicators(true);
    isRestoringDocument = false;
    refreshSchematicNetlist();
    queueAutosave();
  };

  const restoreAutosave = async () => {
    if (isUiTestMode) {
      return;
    }
    if (!persistenceApi || typeof persistenceApi.loadAutosave !== "function") {
      return;
    }
    try {
      const doc = await persistenceApi.loadAutosave();
      if (doc) {
        const fileName = suggestedFileName ? suggestedFileName : "";
        applyDocument(doc, { fileName, markDirty: true });
      }
    } catch (err) {
      console.error("Failed to load autosave.", err);
    }
  };

  const loadSchematicExample = (exampleId) => {
    const api = ensureSchematicApi();
    if (!api || typeof api.applySchematicExample !== "function") {
      netlistWarnings.textContent = "Schematic examples require a compiled editor.";
      return;
    }
    if (!schematicModel) {
      netlistWarnings.textContent = "Schematic model not initialized.";
      return;
    }
    const result = api.applySchematicExample(schematicModel, exampleId);
    if (!result) {
      netlistWarnings.textContent = `Sample "${exampleId}" not available.`;
      return;
    }
    const centerViewOnCurrentSchematic = () => {
      if (!schematicEditor
        || typeof schematicEditor.getModel !== "function"
        || typeof schematicEditor.getView !== "function"
        || typeof schematicEditor.setView !== "function") {
        return;
      }
      const model = schematicEditor.getModel();
      const points = [];
      (model?.components ?? []).forEach((component) => {
        (component?.pins ?? []).forEach((pin) => {
          if (Number.isFinite(pin.x) && Number.isFinite(pin.y)) {
            points.push({ x: pin.x, y: pin.y });
          }
        });
      });
      (model?.wires ?? []).forEach((wire) => {
        (wire?.points ?? []).forEach((point) => {
          if (Number.isFinite(point.x) && Number.isFinite(point.y)) {
            points.push({ x: point.x, y: point.y });
          }
        });
      });
      if (!points.length) {
        return;
      }
      const minX = Math.min(...points.map((point) => point.x));
      const maxX = Math.max(...points.map((point) => point.x));
      const minY = Math.min(...points.map((point) => point.y));
      const maxY = Math.max(...points.map((point) => point.y));
      const centerX = (minX + maxX) / 2;
      const centerY = (minY + maxY) / 2;
      const view = schematicEditor.getView();
      if (!view) {
        return;
      }
      schematicEditor.setView({
        x: centerX - view.width / 2,
        y: centerY - view.height / 2,
        width: view.width,
        height: view.height
      });
    };
    applySimulationPreset(result.config);
    netlistPreamble = "";
    netlistPreambleInput.value = "";
    saveFileHandle = null;
    resetSaveIndicators(true);
    if (schematicEditor && typeof schematicEditor.render === "function") {
      schematicEditor.render();
    }
    centerViewOnCurrentSchematic();
    refreshSchematicNetlist();
    queueAutosave();
  };

  const loadSampleSchematic = (exampleId) => {
    if (!exampleId) {
      return;
    }
    const key = String(exampleId);
    if (hasSchematicDocumentContent() && typeof window.confirm === "function") {
      const label = sampleEntryMap.get(key)?.label ?? key.toUpperCase();
      const ok = window.confirm(`Load example "${label}"? Unsaved changes will be lost.`);
      if (!ok) {
        return;
      }
    }
    setSchematicMode(true);
    loadSchematicExample(key);
  };

  const getActiveNetlist = () => {
    if (latestSchematicCompile?.netlist) {
      return latestSchematicCompile.netlist;
    }
    const compiled = buildSchematicNetlistForKind(simulationConfig.activeKind);
    latestSchematicCompile = compiled;
    return compiled.netlist ?? "";
  };

  const runSchematicAnalysis = () => {
    openResultsPaneForRun();
    const kind = simulationConfig.activeKind;
    lastRunKind = kind;
    const compiled = buildSchematicNetlistForKind(kind);
    latestSchematicCompile = compiled;
    if (!compiled.netlist) {
      netlistWarnings.textContent = "Unable to build netlist.";
      return;
    }
    if (compiled.compileErrors?.length) {
      netlistWarnings.textContent = compiled.compileErrors.join("\n");
      return;
    }
    if (compiled.analysisErrors?.length) {
      netlistWarnings.textContent = compiled.analysisErrors.join("\n");
      return;
    }
    const requestedSignals = Array.isArray(simulationConfig.save.signals)
      ? simulationConfig.save.signals.map((entry) => String(entry ?? "").trim()).filter(Boolean)
      : [];
    const isAllSignalToken = (value) => {
      const token = String(value ?? "").trim().toLowerCase();
      return token === "all" || token === "*";
    };
    const namedSignals = Array.isArray(compiled.namedNodeSignals)
      ? compiled.namedNodeSignals.map((entry) => String(entry ?? "").trim()).filter(Boolean)
      : [];
    const probeSignals = Array.isArray(compiled.probeSignals)
      ? compiled.probeSignals.map((entry) => String(entry ?? "").trim()).filter(Boolean)
      : [];
    const wildcardOnly = requestedSignals.length > 0 && requestedSignals.every((token) => isAllSignalToken(token));
    let runSignals = [];
    if (kind === "op") {
      runSignals = dedupeSignals(["all"].concat(requestedSignals, probeSignals));
      if (!runSignals.length) {
        runSignals = ["all"];
      }
    } else {
      const preferredSignals = dedupeSignals(namedSignals.concat(probeSignals));
      const fallbackSignals = preferredSignals.length ? preferredSignals : ["all"];
      runSignals = (!requestedSignals.length || wildcardOnly)
        ? fallbackSignals
        : dedupeSignals(requestedSignals.concat(probeSignals));
    }
    setActiveTab(kind);
    rememberRunRequestSignature(kind, compiled, runSignals);
    switch (kind) {
      case "op":
        actions.onRun(compiled.netlist, runSignals.length ? runSignals : undefined);
        break;
      case "dc":
        actions.onRunDc(compiled.netlist, runSignals.length ? runSignals : undefined);
        break;
      case "tran":
        actions.onRunTran(compiled.netlist, runSignals.length ? runSignals : undefined);
        break;
      case "ac":
        actions.onRunAc(compiled.netlist, runSignals.length ? runSignals : undefined);
        break;
      default:
        actions.onRun(compiled.netlist, runSignals.length ? runSignals : undefined);
        break;
    }
  };

  const compileSchematicNetlist = (kind) => {
    const info = buildSchematicNetlistForKind(kind);
    return info?.netlist ?? "";
  };

  let netlistCopyFeedbackTimer = null;
  const setNetlistCopyButtonState = (stateValue, copiedLength) => {
    const state = String(stateValue ?? "").trim().toLowerCase();
    const normalizedState = state === "success" || state === "error" ? state : "idle";
    const lengthValue = Number.isFinite(Number(copiedLength))
      ? Math.max(0, Number.parseInt(String(copiedLength), 10))
      : 0;
    netlistCopyButton.dataset.netlistCopyState = normalizedState;
    netlistCopyButton.dataset.netlistCopyLength = String(lengthValue);
  };

  const copyTextToClipboard = async (textValue) => {
    const text = String(textValue ?? "");
    const clipboardApi = self.navigator?.clipboard;
    if (clipboardApi && typeof clipboardApi.writeText === "function") {
      try {
        await clipboardApi.writeText(text);
        return true;
      } catch {
      }
    }
    let eventCopyHandled = false;
    const handleCopyEvent = (event) => {
      const clipboardData = event?.clipboardData;
      if (!clipboardData || typeof clipboardData.setData !== "function") {
        return;
      }
      clipboardData.setData("text/plain", text);
      event.preventDefault();
      eventCopyHandled = true;
    };
    self.document.addEventListener("copy", handleCopyEvent);
    let execCommandCopied = false;
    try {
      execCommandCopied = Boolean(self.document.execCommand("copy"));
    } catch {
      execCommandCopied = false;
    } finally {
      self.document.removeEventListener("copy", handleCopyEvent);
    }
    if (execCommandCopied || eventCopyHandled) {
      return true;
    }
    const fallback = self.document.createElement("textarea");
    fallback.className = "schematic-netlist-copy-fallback";
    fallback.value = text;
    fallback.setAttribute("aria-hidden", "true");
    fallback.setAttribute("readonly", "readonly");
    self.document.body.appendChild(fallback);
    fallback.focus();
    fallback.select();
    fallback.setSelectionRange(0, fallback.value.length);
    let copied = false;
    try {
      copied = Boolean(self.document.execCommand("copy"));
    } catch {
      copied = false;
    } finally {
      fallback.remove();
    }
    return copied;
  };

  setNetlistCopyButtonState("idle", 0);
  netlistCopyButton.addEventListener("click", async () => {
    const sourceText = String(netlistPreview.value ?? "");
    const copied = await copyTextToClipboard(sourceText);
    setNetlistCopyButtonState(copied ? "success" : "error", sourceText.length);
    if (netlistCopyFeedbackTimer) {
      self.clearTimeout(netlistCopyFeedbackTimer);
    }
    netlistCopyFeedbackTimer = self.setTimeout(() => {
      setNetlistCopyButtonState("idle", sourceText.length);
      netlistCopyFeedbackTimer = null;
    }, 1500);
  });

  saveInput.value = simulationConfig.save.signals.join(", ");
  saveInput.addEventListener("input", () => {
    simulationConfig.save.signals = saveInput.value
      .split(",")
      .map((value) => String(value ?? "").trim())
      .filter(Boolean);
    refreshSchematicNetlist();
    queueAutosave();
  });
  netlistPreambleInput.value = netlistPreamble;
  netlistPreambleInput.addEventListener("input", () => {
    netlistPreamble = netlistPreambleInput.value;
    refreshSchematicNetlist();
    queueAutosave();
  });
  schematicRunButton.addEventListener("click", () => {
    runSchematicAnalysis();
  });
  updateConfigSectionVisibility();

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

  const SCHEMATIC_HOVER_FALLBACK_COLOR = "#1d1d1f";

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

  function rebuildTraceNetColorMap() {
    const api = getSchematicApi();
    const model = schematicEditor?.getModel?.() ?? schematicModel ?? null;
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
    const traceIndex = getTraceLinkIndex();
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
  }

  const buildSeries = (xValues, traces, colorMap, selectedSignals) => {
    const classifySeriesHighlight = (signal) => {
      const token = normalizeTraceTokenValue(signal);
      const selected = token ? activeTraceSelectionTokens.has(token) : false;
      const hovered = !selected && token ? activeTraceHoverTokens.has(token) : false;
      return { selected, hovered, highlighted: selected || hovered };
    };
    const entries = Object.entries(traces ?? {});
    if (!Array.isArray(selectedSignals) || !selectedSignals.length) {
      return entries.map(([label, y]) => {
        const highlight = classifySeriesHighlight(label);
        return {
          x: xValues,
          y,
          signal: label,
          label: formatSignalLabel(label),
          color: colorMap?.get(label),
          selected: highlight.selected,
          hovered: highlight.hovered,
          highlighted: highlight.highlighted
        };
      });
    }
    const traceByKey = new Map();
    entries.forEach(([label, y]) => {
      const key = normalizeSignalToken(label);
      if (!key || traceByKey.has(key)) {
        return;
      }
      traceByKey.set(key, { label, y });
    });
    const series = [];
    const used = new Set();
    selectedSignals.forEach((signal) => {
      const key = normalizeSignalToken(signal);
      if (!key || used.has(key)) {
        return;
      }
      used.add(key);
      const trace = traceByKey.get(key);
      if (!trace) {
        return;
      }
      const highlight = classifySeriesHighlight(trace.label);
      series.push({
        x: xValues,
        y: trace.y,
        signal: trace.label,
        label: formatSignalLabel(trace.label),
        color: colorMap?.get(trace.label),
        selected: highlight.selected,
        hovered: highlight.hovered,
        highlighted: highlight.highlighted
      });
    });
    activeTraceHighlightTokens.forEach((token) => {
      if (!token || used.has(token)) {
        return;
      }
      const trace = traceByKey.get(token);
      if (!trace) {
        return;
      }
      used.add(token);
      const highlight = classifySeriesHighlight(trace.label);
      series.push({
        x: xValues,
        y: trace.y,
        signal: trace.label,
        label: formatSignalLabel(trace.label),
        color: colorMap?.get(trace.label),
        selected: highlight.selected,
        hovered: highlight.hovered,
        highlighted: highlight.highlighted
      });
    });
    return series;
  };

  const formatHoverNumber = (value) => {
    return formatResultsDisplayNumber(value);
  };

  const findNearestIndex = (values, target) => {
    if (!Array.isArray(values) || !values.length || !Number.isFinite(target)) {
      return -1;
    }
    let low = 0;
    let high = values.length - 1;
    const ascending = values[low] <= values[high];
    while (high - low > 1) {
      const mid = Math.floor((low + high) / 2);
      const midValue = values[mid];
      if (ascending) {
        if (midValue < target) {
          low = mid;
        } else {
          high = mid;
        }
      } else {
        if (midValue > target) {
          low = mid;
        } else {
          high = mid;
        }
      }
    }
    const lowDelta = Math.abs(values[low] - target);
    const highDelta = Math.abs(values[high] - target);
    return lowDelta <= highDelta ? low : high;
  };

  const attachPlotTooltip = (canvas, overlay, tooltip, options) => {
    if (!canvas || !tooltip) {
      return;
    }
    const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
    canvas._hoverSignals = [];
    const clearOverlay = () => {
      if (!overlay) {
        return;
      }
      const ctx = overlay.getContext("2d");
      if (!ctx) {
        return;
      }
      ctx.clearRect(0, 0, overlay.width, overlay.height);
      overlay._overlayState = { points: [], crosshairX: null };
    };
    const resolveHoverSignals = (matchedLegendItem, points, cssY) => {
      if (matchedLegendItem?.signal) {
        return [String(matchedLegendItem.signal).trim()].filter(Boolean);
      }
      if (!Array.isArray(points) || !points.length) {
        return [];
      }
      let nearestPoint = null;
      let nearestDist = Infinity;
      points.forEach((point) => {
        const y = Number(point?.screenY);
        if (!Number.isFinite(y)) {
          return;
        }
        const dist = Math.abs(y - cssY);
        if (dist < nearestDist) {
          nearestDist = dist;
          nearestPoint = point;
        }
      });
      if (!nearestPoint) {
        return [];
      }
      const signal = String(nearestPoint.signal ?? nearestPoint.label ?? "").trim();
      return signal ? [signal] : [];
    };
    const hide = () => {
      tooltip.style.opacity = "0";
      tooltip.textContent = "";
      canvas._hoverSignals = [];
      clearOverlay();
      if (typeof options?.onLeave === "function") {
        options.onLeave();
      }
    };
    const findLegendItemAtPoint = (plotState, cssX, cssY) => {
      if (!plotState?.legend?.items?.length) {
        return null;
      }
      return plotState.legend.items.find((item) => {
        const bounds = item?.bounds;
        if (!bounds) {
          return false;
        }
        return cssX >= bounds.x
          && cssX <= bounds.x + bounds.width
          && cssY >= bounds.y
          && cssY <= bounds.y + bounds.height;
      }) ?? null;
    };
    const show = (event) => {
      const state = canvas._plotState;
      if (!state || !Array.isArray(state.series) || !state.series.length) {
        hide();
        return;
      }
      const rect = canvas.getBoundingClientRect();
      const cssX = event.clientX - rect.left;
      const cssY = event.clientY - rect.top;
      const matchedLegendItem = findLegendItemAtPoint(state, cssX, cssY);
      if (cssX < state.plotLeft || cssX > state.plotRight || cssY < state.plotTop || cssY > state.plotBottom) {
        hide();
        return;
      }
      const xNorm = (cssX - state.plotLeft) / (state.plotRight - state.plotLeft);
      let xValue = 0;
      if (state.xScaleType === "log") {
        const logMin = Number.isFinite(state.xLogMin) ? state.xLogMin : Math.log10(Math.max(state.xMin, 1e-12));
        const logMax = Number.isFinite(state.xLogMax) ? state.xLogMax : Math.log10(Math.max(state.xMax, 1e-12));
        xValue = Math.pow(10, logMin + xNorm * (logMax - logMin));
      } else {
        xValue = state.xMin + xNorm * (state.xMax - state.xMin);
      }

      let snappedX = xValue;
      let bestDelta = Infinity;
      const allHoverSeries = state.series.slice();
      if (Array.isArray(state.rightAxes)) {
        state.rightAxes.forEach((ra) => {
          if (Array.isArray(ra?.series)) ra.series.forEach((s) => allHoverSeries.push(s));
        });
      }
      allHoverSeries.forEach((entry) => {
        const idx = findNearestIndex(entry.x, xValue);
        if (idx < 0 || idx >= entry.x.length) {
          return;
        }
        const candidate = entry.x[idx];
        const delta = Math.abs(candidate - xValue);
        if (delta < bestDelta) {
          bestDelta = delta;
          snappedX = candidate;
        }
      });

      const lines = [];
      let xLabel = options?.xLabel ?? "x";
      let xDisplay = snappedX;
      if (state.xTickUnit && Number.isFinite(state.xTickScale)) {
        xLabel = xLabel.replace(/\s*\([^)]*\)\s*$/, "");
        xLabel = `${xLabel} (${state.xTickUnit})`;
        xDisplay = snappedX / state.xTickScale;
      }
      lines.push(`${xLabel}: ${formatHoverNumber(xDisplay)}`);
      const points = [];
      const mapSeriesY = (value) => {
        if (!Number.isFinite(value)) {
          return null;
        }
        if (state.yScaleType === "log") {
          if (value <= 0 || !Number.isFinite(state.yLogMin) || !Number.isFinite(state.yLogMax)) {
            return null;
          }
          const t = (Math.log10(value) - state.yLogMin) / (state.yLogMax - state.yLogMin);
          return state.plotBottom - t * (state.plotBottom - state.plotTop);
        }
        const denom = state.yMax - state.yMin;
        const t = denom === 0 ? 0 : (value - state.yMin) / denom;
        return state.plotBottom - t * (state.plotBottom - state.plotTop);
      };
      state.series.forEach((entry, index) => {
        const idx = findNearestIndex(entry.x, snappedX);
        if (idx < 0 || idx >= entry.y.length) {
          return;
        }
        const label = entry.label ?? `Trace ${index + 1}`;
        const signal = entry.signal ?? label;
        const value = entry.y[idx];
        lines.push(`${label}: ${formatHoverNumber(value)}`);
        points.push({
          x: entry.x[idx],
          y: value,
          screenY: mapSeriesY(value),
          color: entry.color,
          label,
          signal
        });
      });
      if (Array.isArray(state.rightAxes)) {
        state.rightAxes.forEach((rightAxis) => {
          if (!Array.isArray(rightAxis?.series)) return;
          const raYMin = rightAxis.yMin;
          const raYMax = rightAxis.yMax;
          const mapRaY = (value) => {
            if (!Number.isFinite(value)) return null;
            const denom = raYMax - raYMin;
            const t = denom === 0 ? 0 : (value - raYMin) / denom;
            return state.plotBottom - t * (state.plotBottom - state.plotTop);
          };
          rightAxis.series.forEach((entry, index) => {
            const idx = findNearestIndex(entry.x, snappedX);
            if (idx < 0 || idx >= entry.y.length) return;
            const label = entry.label ?? `Trace ${index + 1}`;
            const signal = entry.signal ?? label;
            const value = entry.y[idx];
            lines.push(`${label}: ${formatHoverNumber(value)}`);
            points.push({
              x: entry.x[idx],
              y: value,
              screenY: mapRaY(value),
              color: entry.color,
              label,
              signal
            });
          });
        });
      }
      tooltip.textContent = lines.join("\n");

      const plotLeftCss = state.plotLeft;
      const plotRightCss = state.plotRight;
      const plotTopCss = state.plotTop;
      const plotBottomCss = state.plotBottom;
      const tooltipRect = tooltip.getBoundingClientRect();
      const tooltipWidth = tooltipRect.width || tooltip.offsetWidth || 0;
      const tooltipHeight = tooltipRect.height || tooltip.offsetHeight || 0;
      const tooltipHost = tooltip.offsetParent instanceof HTMLElement
        ? tooltip.offsetParent
        : (tooltip.parentElement instanceof HTMLElement ? tooltip.parentElement : null);
      const hostRect = tooltipHost?.getBoundingClientRect?.() ?? rect;
      const hostWidth = hostRect.width || rect.width || 0;
      const hostHeight = hostRect.height || rect.height || 0;
      const inset = 6;

      const plotMinLeft = plotLeftCss + inset;
      const plotMaxLeft = Math.max(plotMinLeft, plotRightCss - tooltipWidth - inset);
      const plotMinTop = plotTopCss + inset;
      const plotMaxTop = Math.max(plotMinTop, plotBottomCss - tooltipHeight - inset);
      let left = clamp(cssX + 12, plotMinLeft, plotMaxLeft);
      let top = clamp(cssY + 12, plotMinTop, plotMaxTop);

      const hostMinLeft = inset;
      const hostMaxLeft = Math.max(hostMinLeft, hostWidth - tooltipWidth - inset);
      const hostMinTop = inset;
      const hostMaxTop = Math.max(hostMinTop, hostHeight - tooltipHeight - inset);
      left = clamp(left, hostMinLeft, hostMaxLeft);

      const panelElement = canvas.closest(".tab-panel");
      let panelMinLeft = null;
      let panelMaxLeft = null;
      let panelMinTop = null;
      let panelMaxTop = null;
      if (panelElement instanceof HTMLElement) {
        const panelRect = panelElement.getBoundingClientRect();
        panelMinLeft = panelRect.left - hostRect.left + inset;
        panelMaxLeft = panelRect.right - hostRect.left - tooltipWidth - inset;
        panelMinTop = panelRect.top - hostRect.top + inset;
        panelMaxTop = panelRect.bottom - hostRect.top - tooltipHeight - inset;

        const boundedMinLeft = Math.max(hostMinLeft, panelMinLeft);
        const boundedMaxLeft = Math.max(
          boundedMinLeft,
          Math.min(hostMaxLeft, panelMaxLeft)
        );
        const boundedMinTop = panelMinTop;
        const boundedMaxTop = Math.max(boundedMinTop, panelMaxTop);
        left = clamp(left, boundedMinLeft, boundedMaxLeft);
        top = clamp(top, boundedMinTop, boundedMaxTop);
      } else {
        top = clamp(top, hostMinTop, hostMaxTop);
      }

      tooltip.style.left = `${left}px`;
      tooltip.style.top = `${top}px`;
      const placedRect = tooltip.getBoundingClientRect();
      const panelRect = panelElement instanceof HTMLElement
        ? panelElement.getBoundingClientRect()
        : null;
      const visibleRect = panelRect
        ? {
          left: Math.max(hostRect.left + inset, panelRect.left + inset),
          right: Math.min(hostRect.right - inset, panelRect.right - inset),
          top: Math.max(hostRect.top + inset, panelRect.top + inset),
          bottom: Math.min(hostRect.bottom - inset, panelRect.bottom - inset)
        }
        : {
          left: hostRect.left + inset,
          right: hostRect.right - inset,
          top: hostRect.top + inset,
          bottom: hostRect.bottom - inset
        };
      if (Number.isFinite(placedRect.right) && placedRect.right > visibleRect.right) {
        left -= placedRect.right - visibleRect.right;
      }
      if (Number.isFinite(placedRect.left) && placedRect.left < visibleRect.left) {
        left += visibleRect.left - placedRect.left;
      }
      if (Number.isFinite(placedRect.bottom) && placedRect.bottom > visibleRect.bottom) {
        top -= placedRect.bottom - visibleRect.bottom;
      }
      if (Number.isFinite(placedRect.top) && placedRect.top < visibleRect.top) {
        top += visibleRect.top - placedRect.top;
      }
      left = clamp(left, hostMinLeft, hostMaxLeft);
      if (panelElement instanceof HTMLElement
        && Number.isFinite(panelMinTop)
        && Number.isFinite(panelMaxTop)) {
        top = clamp(top, panelMinTop, Math.max(panelMinTop, panelMaxTop));
        if (Number.isFinite(panelMinLeft) && Number.isFinite(panelMaxLeft)) {
          const boundedMinLeft = Math.max(hostMinLeft, panelMinLeft);
          const boundedMaxLeft = Math.max(
            boundedMinLeft,
            Math.min(hostMaxLeft, panelMaxLeft)
          );
          left = clamp(left, boundedMinLeft, boundedMaxLeft);
        }
      } else {
        top = clamp(top, hostMinTop, hostMaxTop);
      }
      tooltip.style.left = `${left}px`;
      tooltip.style.top = `${top}px`;
      tooltip.style.opacity = "1";

      if (overlay) {
        if (overlay.width !== canvas.width || overlay.height !== canvas.height) {
          overlay.width = canvas.width;
          overlay.height = canvas.height;
        }
        const ctx = overlay.getContext("2d");
        if (ctx) {
          const scaleX = rect.width ? overlay.width / rect.width : 1;
          const scaleY = rect.height ? overlay.height / rect.height : 1;
          ctx.setTransform(scaleX, 0, 0, scaleY, 0, 0);
          ctx.clearRect(0, 0, rect.width, rect.height);
          const mapX = (value) => {
            if (!Number.isFinite(value)) {
              return null;
            }
            if (state.xScaleType === "log") {
              if (value <= 0 || !Number.isFinite(state.xLogMin) || !Number.isFinite(state.xLogMax)) {
                return null;
              }
              const t = (Math.log10(value) - state.xLogMin) / (state.xLogMax - state.xLogMin);
              return state.plotLeft + t * (state.plotRight - state.plotLeft);
            }
            const denom = state.xMax - state.xMin;
            const t = denom === 0 ? 0 : (value - state.xMin) / denom;
            return state.plotLeft + t * (state.plotRight - state.plotLeft);
          };
          const mapY = (value) => {
            if (!Number.isFinite(value)) {
              return null;
            }
            if (state.yScaleType === "log") {
              if (value <= 0 || !Number.isFinite(state.yLogMin) || !Number.isFinite(state.yLogMax)) {
                return null;
              }
              const t = (Math.log10(value) - state.yLogMin) / (state.yLogMax - state.yLogMin);
              return state.plotBottom - t * (state.plotBottom - state.plotTop);
            }
            const denom = state.yMax - state.yMin;
            const t = denom === 0 ? 0 : (value - state.yMin) / denom;
            return state.plotBottom - t * (state.plotBottom - state.plotTop);
          };
          ctx.lineWidth = 2;
          const crossValue = points.length ? points[0].x : snappedX;
          const crosshairX = mapX(crossValue);
          if (crosshairX !== null) {
            ctx.strokeStyle = "rgba(29, 29, 31, 0.35)";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(crosshairX, state.plotTop);
            ctx.lineTo(crosshairX, state.plotBottom);
            ctx.stroke();
          }

          ctx.lineWidth = 2;
          points.forEach((point, index) => {
            const x = mapX(point.x);
            const y = Number.isFinite(point.screenY) ? point.screenY : mapY(point.y);
            if (x === null || y === null) {
              return;
            }
            ctx.fillStyle = point.color ?? palette[index % palette.length];
            ctx.strokeStyle = "#f6f4ef";
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
          });
          overlay._overlayState = { points, crosshairX };
        }
      }
      const normalizedSignals = resolveHoverSignals(matchedLegendItem, points, cssY)
        .map((entry) => String(entry ?? "").trim())
        .filter(Boolean);
      canvas._hoverSignals = normalizedSignals;
      if (typeof options?.onHover === "function") {
        options.onHover(normalizedSignals);
      }
    };

    const handleClick = (event) => {
      if (typeof options?.onClick !== "function") {
        return;
      }
      const plotState = canvas._plotState;
      const rect = canvas.getBoundingClientRect();
      if (plotState?.legend?.items?.length && rect.width > 0 && rect.height > 0) {
        const cssX = event.clientX - rect.left;
        const cssY = event.clientY - rect.top;
        const matchedLegendItem = findLegendItemAtPoint(plotState, cssX, cssY);
        if (matchedLegendItem?.signal) {
          options.onClick([matchedLegendItem.signal], event);
          return;
        }
      }
      show(event);
      const signals = Array.isArray(canvas._hoverSignals)
        ? canvas._hoverSignals.slice()
        : [];
      options.onClick(signals, event);
    };

    canvas.addEventListener("mousemove", show);
    canvas.addEventListener("mouseleave", hide);
    canvas.addEventListener("click", handleClick);
  };

  const getPlotExportApi = () => {
    const api = typeof self !== "undefined" ? self.SpjutSimPlotExport : null;
    if (!api) {
      throw new Error("SpjutSimPlotExport not found. Ensure src/plot/export.js is loaded.");
    }
    return api;
  };

  const getPlotCssSize = (canvas) => getPlotExportApi().getPlotCssSize(canvas);
  const exportPlotPng = (canvas, filename) =>
    getPlotExportApi().exportPlotPng(canvas, filename, plotPrefs.fontScale, plotPrefs.lineWidth);
  const exportVisiblePlotPngs = (canvases, baseFilename) =>
    getPlotExportApi().exportVisiblePlotPngs(canvases, baseFilename, plotPrefs.fontScale, plotPrefs.lineWidth);

  const exportOpCsv = () => {
    const nodes = Array.isArray(state.opResults?.nodes) ? state.opResults.nodes : [];
    const currents = Array.isArray(state.opResults?.currents) ? state.opResults.currents : [];
    if (!nodes.length && !currents.length) {
      return;
    }
    const preferredSignals = buildPreferredAnalysisSignals();
    const preferredSignalCaseMap = buildSignalCaseMap(preferredSignals);
    const headers = ["Type", "Name", "Voltage (V)", "Current (A)"];
    const rows = [];
    nodes.forEach((row) => {
      const value = typeof row.raw === "number" ? row.raw : row.value ?? "";
      rows.push(["Node", resolveOpResultDisplayName(row?.name ?? "", {
        rowKind: "op-node",
        signalCaseMap: preferredSignalCaseMap
      }), value, ""]);
    });
    currents.forEach((row) => {
      const value = typeof row.raw === "number" ? row.raw : row.value ?? "";
      rows.push(["Current", resolveOpResultDisplayName(row?.name ?? "", {
        rowKind: "op-current",
        signalCaseMap: preferredSignalCaseMap
      }), "", value]);
    });
    const csv = buildCsvText(headers, rows);
    const filename = buildCsvFilename("op");
    downloadCsvFile(filename, csv);
    recordCsvExport("op", csv, headers, filename);
  };

  const exportSignalTraceCsv = ({ xValues, traces, selectedSignals, xHeader, suffix }) => {
    if (!xValues.length || !selectedSignals.length) {
      return;
    }
    const headers = [
      xHeader,
      ...selectedSignals.map((signal) => `${formatSignalLabel(signal)} (${getSignalUnit(signal)})`)
    ];
    const rows = xValues.map((value, index) => {
      const row = [value];
      selectedSignals.forEach((signal) => {
        const trace = Array.isArray(traces?.[signal]) ? traces[signal] : [];
        row.push(trace[index] ?? "");
      });
      return row;
    });
    const csv = buildCsvText(headers, rows);
    const filename = buildCsvFilename(suffix);
    downloadCsvFile(filename, csv);
    recordCsvExport(suffix, csv, headers, filename);
  };

  const exportDcCsv = () => {
    const x = Array.isArray(state.dcResults?.x) ? state.dcResults.x : [];
    const traces = state.dcResults?.traces ?? {};
    const selected = getSelectedSignals(signalSelect);
    const sweepUnit = getDcSweepUnit();
    exportSignalTraceCsv({
      xValues: x,
      traces,
      selectedSignals: selected,
      xHeader: `Sweep (${sweepUnit})`,
      suffix: "dc"
    });
  };

  const exportTranCsv = () => {
    const x = Array.isArray(state.tranResults?.x) ? state.tranResults.x : [];
    const traces = state.tranResults?.traces ?? {};
    const selected = getSelectedSignals(signalSelectT);
    exportSignalTraceCsv({
      xValues: x,
      traces,
      selectedSignals: selected,
      xHeader: "Time (s)",
      suffix: "tran"
    });
  };

  const exportAcCsv = () => {
    const freq = Array.isArray(state.acResults?.freq) ? state.acResults.freq : [];
    const magnitude = state.acResults?.magnitude ?? {};
    const phase = state.acResults?.phase ?? {};
    const selected = getSelectedSignals(signalSelectA);
    if (!freq.length || !selected.length) {
      return;
    }
    const headers = ["Frequency (Hz)"];
    selected.forEach((signal) => {
      const label = formatSignalLabel(signal);
      headers.push(`${label} Mag (dB)`);
      headers.push(`${label} Phase (deg)`);
    });
    const rows = freq.map((value, index) => {
      const row = [value];
      selected.forEach((signal) => {
        const magTrace = Array.isArray(magnitude?.[signal]) ? magnitude[signal] : [];
        const phaseTrace = Array.isArray(phase?.[signal]) ? phase[signal] : [];
        row.push(magTrace[index] ?? "");
        row.push(phaseTrace[index] ?? "");
      });
      return row;
    });
    const csv = buildCsvText(headers, rows);
    const filename = buildCsvFilename("ac");
    downloadCsvFile(filename, csv);
    recordCsvExport("ac", csv, headers, filename);
  };

  const exportActiveResultsCsv = () => {
    const activeTabId = tabs.find((tab) => tab.panel.classList.contains("active"))?.id ?? "";
    const preferredOrder = [
      activeTabId,
      simulationConfig.activeKind,
      lastRunKind,
      "op",
      "dc",
      "tran",
      "ac"
    ];
    const exportKind = preferredOrder.find((kind) => hasResultsForKind(kind));
    if (!exportKind) {
      return;
    }
    if (exportKind === "op") {
      exportOpCsv();
      return;
    }
    if (exportKind === "dc") {
      exportDcCsv();
      return;
    }
    if (exportKind === "tran") {
      exportTranCsv();
      return;
    }
    if (exportKind === "ac") {
      exportAcCsv();
    }
  };

  const exportSchematicSvg = (overrideFilename) => {
    const api = ensureSchematicApi();
    if (!api || typeof api.exportSvg !== "function") {
      return;
    }
    const svgText = api.exportSvg(schematicModel, {
      fit: true,
      padding: EXPORT_PADDING,
      measurements: schematicMeasurements,
      probeLabels: schematicProbeLabels,
      schematicTextStyle
    });
    if (!svgText) {
      return;
    }
    const blob = new Blob([svgText], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const filename = overrideFilename || buildSchematicFilename("svg");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
    schematicPanel._exportState = { type: "svg", size: svgText.length, filename };
  };

  const exportSchematicPng = async (scale = 2, transparent = false, filename = "") => {
    const api = ensureSchematicApi();
    if (!api || typeof api.exportPng !== "function") {
      return;
    }
    try {
      const safeScale = Number.isFinite(scale) && scale > 0 ? scale : 2;
      const result = await api.exportPng(schematicModel, {
        fit: true,
        padding: EXPORT_PADDING,
        scale: safeScale,
        transparent: Boolean(transparent),
        measurements: schematicMeasurements,
        probeLabels: schematicProbeLabels,
        schematicTextStyle
      });
      if (!result || !result.dataUrl) {
        return;
      }
      const normalizedFilename = normalizePngFilename(filename);
      const link = document.createElement("a");
      link.href = result.dataUrl;
      link.download = normalizedFilename;
      link.click();
      schematicPanel._exportState = {
        type: "png",
        width: result.width,
        height: result.height,
        scale: result.scale,
        transparent: Boolean(transparent),
        filename: normalizedFilename
      };
    } catch {
    }
  };

  const exportSchematicJpeg = async (scale = 2, filename = "") => {
    const api = ensureSchematicApi();
    if (!api || typeof api.exportJpeg !== "function") {
      return;
    }
    try {
      const safeScale = Number.isFinite(scale) && scale > 0 ? scale : 2;
      const result = await api.exportJpeg(schematicModel, {
        fit: true,
        padding: EXPORT_PADDING,
        scale: safeScale,
        measurements: schematicMeasurements,
        probeLabels: schematicProbeLabels,
        schematicTextStyle
      });
      if (!result || !result.dataUrl) {
        return;
      }
      const normalizedFilename = withFilenameExtension(filename, "jpeg", getBaseFilename());
      const link = document.createElement("a");
      link.href = result.dataUrl;
      link.download = normalizedFilename;
      link.click();
      schematicPanel._exportState = {
        type: "jpeg",
        width: result.width,
        height: result.height,
        scale: result.scale,
        size: String(result.dataUrl ?? "").length,
        filename: normalizedFilename
      };
    } catch {
    }
  };

  const exportSchematicPdf = async (filename = "") => {
    const api = ensureSchematicApi();
    if (!api || typeof api.exportPdf !== "function") {
      return;
    }
    try {
      const result = await api.exportPdf(schematicModel, {
        fit: true,
        padding: EXPORT_PADDING,
        scale: getExportScale(exportDiagramPrefs.scale),
        measurements: schematicMeasurements,
        probeLabels: schematicProbeLabels,
        schematicTextStyle
      });
      if (!result || !(result.bytes instanceof Uint8Array) || !result.bytes.length) {
        return;
      }
      const normalizedFilename = withFilenameExtension(filename, "pdf", getBaseFilename());
      const blob = new Blob([result.bytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = normalizedFilename;
      link.click();
      URL.revokeObjectURL(url);
      schematicPanel._exportState = {
        type: "pdf",
        size: result.bytes.length,
        width: result.width,
        height: result.height,
        pageWidth: result.pageWidth,
        pageHeight: result.pageHeight,
        filename: normalizedFilename
      };
    } catch {
    }
  };

  const handlePlotHoverSignals = (signals) => {
    focusedTracePane = "plot";
    setHoverTraceHighlights(signals);
  };
  const handlePlotLeave = () => {
    setHoverTraceHighlights([]);
  };
  const getCurrentPinnedTraceTokens = () => (
    plotTraceSelectionTokens.size
      ? new Set(plotTraceSelectionTokens)
      : new Set(schematicTraceHighlightTokens)
  );
  const handlePlotClickSignals = (signals, event) => {
    const additive = isAdditiveSelectionEvent(event);
    focusedTracePane = "plot";
    const clickedTokens = normalizeSignalTokenSet(Array.isArray(signals) ? signals : []);
    if (!clickedTokens.size) {
      if (!additive) {
        clearPlotTraceSelectionState({ skipRecompute: true });
        clearSchematicSelection();
      }
      setHoverTraceHighlights([]);
      primaryTraceSelectionToken = "";
      focusedTracePane = "schematic";
      recomputeTraceHighlightState();
      return;
    }
    const nextTokens = additive ? getCurrentPinnedTraceTokens() : new Set();
    if (additive) {
      clickedTokens.forEach((token) => {
        if (nextTokens.has(token)) {
          nextTokens.delete(token);
        } else {
          nextTokens.add(token);
        }
      });
    } else {
      clickedTokens.forEach((token) => nextTokens.add(token));
    }
    const nextSignals = Array.from(nextTokens);
    const clickedPrimary = Array.from(clickedTokens.values())[0] ?? "";
    if (!nextSignals.length) {
      clearPlotTraceSelectionState({ skipRecompute: true });
      clearSchematicSelection();
      setHoverTraceHighlights([]);
      primaryTraceSelectionToken = "";
      focusedTracePane = "schematic";
      recomputeTraceHighlightState();
      return;
    }
    const traceLinkIndex = getTraceLinkIndex();
    const selectionTargets = buildPlotSelectionTargetsForSignals(nextSignals, traceLinkIndex);
    setHoverTraceHighlights([]);
    setPlotTraceSelectionState(nextSignals, {
      componentIds: [],
      wireIds: [],
      color: "",
      entries: []
    }, {
      skipRecompute: true,
      primaryToken: clickedPrimary
    });
    isApplyingPlotDrivenSchematicSelection = true;
    try {
      if (selectionTargets.componentIds.length || selectionTargets.wireIds.length) {
        setSchematicSelectionTargets(selectionTargets.componentIds, selectionTargets.wireIds, {
          preserveComponents: true
        });
      } else {
        clearSchematicSelection();
      }
    } finally {
      isApplyingPlotDrivenSchematicSelection = false;
    }
    recomputeTraceHighlightState();
  };
  handleResultsSignalHover = (signals) => {
    focusedTracePane = "table";
    setHoverTraceHighlights(signals);
  };
  handleResultsSignalClick = (signals, event) => {
    focusedTracePane = "table";
    handlePlotClickSignals(signals, event);
  };

  attachPlotTooltip(dcCanvas, dcOverlay, dcTooltip, {
    xLabel: "Sweep (V)",
    onHover: handlePlotHoverSignals,
    onLeave: handlePlotLeave,
    onClick: handlePlotClickSignals
  });
  if (dcCurrentCanvas && dcCurrentOverlay && dcCurrentTooltip) {
    attachPlotTooltip(dcCurrentCanvas, dcCurrentOverlay, dcCurrentTooltip, {
      xLabel: "Sweep (V)",
      onHover: handlePlotHoverSignals,
      onLeave: handlePlotLeave,
      onClick: handlePlotClickSignals
    });
  }
  if (dcPowerCanvas && dcPowerOverlay && dcPowerTooltip) {
    attachPlotTooltip(dcPowerCanvas, dcPowerOverlay, dcPowerTooltip, {
      xLabel: "Sweep (V)",
      onHover: handlePlotHoverSignals,
      onLeave: handlePlotLeave,
      onClick: handlePlotClickSignals
    });
  }
  attachPlotTooltip(tranCanvas, tranOverlay, tranTooltip, {
    xLabel: "Time",
    onHover: handlePlotHoverSignals,
    onLeave: handlePlotLeave,
    onClick: handlePlotClickSignals
  });
  if (tranCurrentCanvas && tranCurrentOverlay && tranCurrentTooltip) {
    attachPlotTooltip(tranCurrentCanvas, tranCurrentOverlay, tranCurrentTooltip, {
      xLabel: "Time",
      onHover: handlePlotHoverSignals,
      onLeave: handlePlotLeave,
      onClick: handlePlotClickSignals
    });
  }
  if (tranPowerCanvas && tranPowerOverlay && tranPowerTooltip) {
    attachPlotTooltip(tranPowerCanvas, tranPowerOverlay, tranPowerTooltip, {
      xLabel: "Time",
      onHover: handlePlotHoverSignals,
      onLeave: handlePlotLeave,
      onClick: handlePlotClickSignals
    });
  }
  attachPlotTooltip(acMagCanvas, acMagOverlay, acTooltip, {
    xLabel: "Frequency (Hz)",
    onHover: handlePlotHoverSignals,
    onLeave: handlePlotLeave,
    onClick: handlePlotClickSignals
  });
  attachPlotTooltip(acPhaseCanvas, acPhaseOverlay, acPhaseTooltip, {
    xLabel: "Frequency (Hz)",
    onHover: handlePlotHoverSignals,
    onLeave: handlePlotLeave,
    onClick: handlePlotClickSignals
  });

  schematicToolButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const tool = button.dataset.schematicTool;
      if (tool) {
        setActiveSchematicTool(tool);
      }
      if (button.dataset.schematicElementTool === "1") {
        setSelectedHelpTarget(button);
      }
    });
    button.addEventListener("contextmenu", (event) => {
      if (button.dataset.schematicElementTool !== "1") {
        return;
      }
      const tool = String(button.dataset.schematicTool ?? "").trim().toUpperCase();
      if (!tool) {
        return;
      }
      const opened = typeof openSettingsDialogForType === "function"
        ? openSettingsDialogForType(tool)
        : false;
      if (!opened) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
    });
  });

  gridSizeInput.addEventListener("change", () => {
    syncSchematicGrid();
    queueAutosave();
  });
  gridToggleButton.addEventListener("click", () => {
    schematicGrid.visible = !schematicGrid.visible;
    gridToggleButton.setAttribute("aria-pressed", schematicGrid.visible ? "true" : "false");
    syncSchematicGrid();
    queueAutosave();
  });

  zoomFitButton.addEventListener("click", () => {
    if (!schematicEditor) {
      return;
    }
    if (typeof schematicEditor.setView !== "function" || typeof schematicEditor.getView !== "function") {
      return;
    }
    const bounds = typeof schematicEditor.getContentBounds === "function"
      ? schematicEditor.getContentBounds()
      : null;
    if (!bounds) {
      if (typeof schematicEditor.resetView === "function") {
        schematicEditor.resetView();
      }
      return;
    }
    const { minX, maxX, minY, maxY } = bounds;
    // Use the editor's current view to get the SVG's actual aspect ratio
    // (syncViewToViewport keeps height fixed and adjusts width to match the SVG element).
    const currentView = schematicEditor.getView();
    const svgRatio = (currentView.width && currentView.height)
      ? currentView.width / currentView.height
      : 1.5;
    const contentW = maxX - minX;
    const contentH = maxY - minY;
    const PAD_WORLD = 40;
    const heightForH = contentH + PAD_WORLD * 2;
    const heightForW = (contentW + PAD_WORLD * 2) / svgRatio;
    const viewH = Math.max(heightForH, heightForW, 1);
    const viewW = viewH * svgRatio;
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    schematicEditor.setView({
      x: centerX - viewW / 2,
      y: centerY - viewH / 2,
      width: viewW,
      height: viewH
    });
  });

  const clearAllProbes = () => {
    ensureSchematicApi();
    if (!schematicEditor || typeof schematicEditor.getModel !== "function") {
      return;
    }
    const model = schematicEditor.getModel();
    const probeIds = (model?.components ?? [])
      .filter((component) => isProbeType(component?.type))
      .map((component) => String(component.id ?? ""))
      .filter(Boolean);
    if (!probeIds.length || typeof schematicEditor.deleteSelection !== "function") {
      return;
    }
    if (typeof schematicEditor.setSelectionWithWires === "function") {
      schematicEditor.setSelectionWithWires(probeIds, []);
    } else if (typeof schematicEditor.setSelection === "function") {
      schematicEditor.setSelection(probeIds);
    }
    schematicEditor.deleteSelection();
  };

  const selectAllSchematicObjects = () => {
    ensureSchematicApi();
    if (!schematicEditor || typeof schematicEditor.getModel !== "function") {
      return;
    }
    const model = schematicEditor.getModel();
    const componentIds = (model?.components ?? [])
      .map((component) => String(component?.id ?? "").trim())
      .filter(Boolean);
    const wireIds = (model?.wires ?? [])
      .map((wire) => String(wire?.id ?? "").trim())
      .filter(Boolean);
    if (!componentIds.length && !wireIds.length) {
      return;
    }
    if (typeof schematicEditor.setSelectionWithWires === "function") {
      schematicEditor.setSelectionWithWires(componentIds, wireIds, { preserveComponents: true });
      return;
    }
    if (typeof schematicEditor.setSelection === "function") {
      schematicEditor.setSelection(componentIds);
    }
  };

  const runSchematicAction = (action) => {
    ensureSchematicApi();
    if (!schematicEditor) {
      return;
    }
    const toolState = typeof schematicEditor.getTool === "function"
      ? schematicEditor.getTool()
      : { mode: "select" };
    const selection = typeof schematicEditor.getSelection === "function"
      ? schematicEditor.getSelection()
      : [];
    const wireSelections = typeof schematicEditor.getWireSelections === "function"
      ? schematicEditor.getWireSelections()
      : [];
    const hasSelection = selection.length > 0 || (Array.isArray(wireSelections) && wireSelections.length > 0);
    const canTransformPlacement = toolState?.mode === "place" && !hasSelection;
    if (canTransformPlacement && action === "rotate-cw" && typeof schematicEditor.rotatePlacement === "function") {
      schematicEditor.rotatePlacement("cw");
      return;
    }
    if (canTransformPlacement && action === "rotate-ccw" && typeof schematicEditor.rotatePlacement === "function") {
      schematicEditor.rotatePlacement("ccw");
      return;
    }
    if (canTransformPlacement && action === "flip-h" && typeof schematicEditor.flipPlacement === "function") {
      schematicEditor.flipPlacement("h");
      return;
    }
    if (canTransformPlacement && action === "flip-v" && typeof schematicEditor.flipPlacement === "function") {
      schematicEditor.flipPlacement("v");
      return;
    }
    if (action === "undo" && typeof schematicEditor.undo === "function") {
      schematicEditor.undo();
    } else if (action === "redo" && typeof schematicEditor.redo === "function") {
      schematicEditor.redo();
    } else if (action === "rotate-cw" && typeof schematicEditor.rotateSelection === "function") {
      schematicEditor.rotateSelection("cw");
    } else if (action === "rotate-ccw" && typeof schematicEditor.rotateSelection === "function") {
      schematicEditor.rotateSelection("ccw");
    } else if (action === "flip-h" && typeof schematicEditor.flipSelection === "function") {
      schematicEditor.flipSelection("h");
    } else if (action === "flip-v" && typeof schematicEditor.flipSelection === "function") {
      schematicEditor.flipSelection("v");
    } else if (action === "simplify-wires") {
      if (typeof schematicEditor.simplifyWires === "function") {
        schematicEditor.simplifyWires("selection");
      }
    } else if (action === "regrid-current-grid") {
      if (typeof schematicEditor.regridToCurrentGrid === "function") {
        schematicEditor.regridToCurrentGrid("selection");
      }
    } else if (action === "duplicate") {
      if (typeof schematicEditor.startSelectionPlacement === "function") {
        schematicEditor.startSelectionPlacement();
      } else if (typeof schematicEditor.duplicateSelection === "function") {
        schematicEditor.duplicateSelection();
      }
    } else if (action === "select-all") {
      selectAllSchematicObjects();
    } else if (action === "delete" && typeof schematicEditor.deleteSelection === "function") {
      schematicEditor.deleteSelection();
    } else if (action === "clear-probes") {
      clearAllProbes();
    }
  };

  const getValidSelection = () => {
    if (!schematicEditor || typeof schematicEditor.getModel !== "function") {
      return { componentIds: [], wireIds: [] };
    }
    const model = schematicEditor.getModel();
    const componentSet = new Set((model?.components ?? []).map((component) => String(component.id)));
    const wireSet = new Set((model?.wires ?? []).map((wire) => String(wire.id)));
    const componentIds = (schematicEditor.getSelection?.() ?? [])
      .map((id) => String(id))
      .filter((id) => componentSet.has(id));
    const wireIds = [
      schematicEditor.getWireSelection?.(),
      ...(schematicEditor.getWireSelections?.() ?? [])
    ]
      .filter(Boolean)
      .map((id) => String(id))
      .filter((id) => wireSet.has(id));
    return { componentIds, wireIds };
  };

  const copySelectionToClipboard = () => {
    const { componentIds, wireIds } = getValidSelection();
    if (!componentIds.length && !wireIds.length) {
      return false;
    }
    clipboard.componentIds = componentIds;
    clipboard.wireIds = wireIds;
    return true;
  };

  const pasteClipboard = () => {
    if (!schematicEditor || (!clipboard.componentIds.length && !clipboard.wireIds.length)) {
      return;
    }
    const model = schematicEditor.getModel?.();
    const componentSet = new Set((model?.components ?? []).map((component) => String(component.id)));
    const wireSet = new Set((model?.wires ?? []).map((wire) => String(wire.id)));
    const componentIds = clipboard.componentIds.filter((id) => componentSet.has(String(id)));
    const wireIds = clipboard.wireIds.filter((id) => wireSet.has(String(id)));
    if (!componentIds.length && !wireIds.length) {
      return;
    }
    if (typeof schematicEditor.startSelectionPlacement === "function") {
      schematicEditor.startSelectionPlacement({ componentIds, wireIds });
      return;
    }
    if (typeof schematicEditor.setSelectionWithWires === "function") {
      schematicEditor.setSelectionWithWires(componentIds, wireIds, { preserveComponents: true });
    } else if (typeof schematicEditor.setSelection === "function") {
      schematicEditor.setSelection(componentIds);
      if (wireIds.length && typeof schematicEditor.selectWire === "function") {
        schematicEditor.selectWire(wireIds[0]);
      }
    }
    if (typeof schematicEditor.duplicateSelection === "function") {
      schematicEditor.duplicateSelection();
    }
  };

  const runMenuAction = (action) => {
    ensureSchematicApi();
    if (action && action.startsWith(EXAMPLE_MENU_ACTION_PREFIX)) {
      const exampleId = action.slice(EXAMPLE_MENU_ACTION_PREFIX.length);
      loadSampleSchematic(exampleId);
      return;
    }
    if (action === "toggle-help") {
      toggleHelpEnabled();
      return;
    }
    if (action === "about") {
      openAboutDialog();
      return;
    }
    if (action === "hotkeys") {
      openHotkeysDialog();
      return;
    }
    if (action === "settings") {
      openSettingsDialog();
      return;
    }
    if (action === "open") {
      void handleOpenAction();
      return;
    }
    if (action === "save") {
      void handleSaveAction(false);
      return;
    }
    if (action === "save-as") {
      void handleSaveAction(true);
      return;
    }
    if (action === "new") {
      resetDocumentState();
      return;
    }
    if (action === "export-diagram") {
      openExportDialog();
      return;
    }
    if (action === "export-results") {
      exportActiveResultsCsv();
      return;
    }
    if (action === "edit") {
      const component = getModelComponent(schematicSelectionId);
      if (component) {
        openInlineComponentEditor(component);
      }
      return;
    }
    if (action === "copy") {
      copySelectionToClipboard();
      updateMenuActionState();
      return;
    }
    if (action === "cut") {
      if (copySelectionToClipboard()) {
        runSchematicAction("delete");
      }
      updateMenuActionState();
      return;
    }
    if (action === "paste") {
      pasteClipboard();
      updateMenuActionState();
      return;
    }
    runSchematicAction(action);
  };

  undoActionButton.addEventListener("click", () => {
    runSchematicAction("undo");
  });
  redoActionButton.addEventListener("click", () => {
    runSchematicAction("redo");
  });
  runActionButton.addEventListener("click", () => {
    runSchematicAnalysis();
  });
  exportActionButton.addEventListener("click", () => {
    runMenuAction("export-diagram");
  });
  rotateCwButton.addEventListener("click", () => {
    runSchematicAction("rotate-cw");
  });
  rotateCcwButton.addEventListener("click", () => {
    runSchematicAction("rotate-ccw");
  });
  flipHButton.addEventListener("click", () => {
    runSchematicAction("flip-h");
  });
  flipVButton.addEventListener("click", () => {
    runSchematicAction("flip-v");
  });
  duplicateActionButton.addEventListener("click", () => {
    runSchematicAction("duplicate");
  });
  deleteActionButton.addEventListener("click", () => {
    runSchematicAction("delete");
  });
  clearProbesActionButton.addEventListener("click", () => {
    runSchematicAction("clear-probes");
  });
  clearProbesButton.addEventListener("click", () => {
    clearAllProbes();
  });

  const handleSchematicKey = (event) => {
    const rawKey = event.key || event.code || "";
    let key = String(rawKey).toLowerCase();
    if (key === " " || key === "spacebar") {
      key = "space";
    } else if (key === "esc") {
      key = "escape";
    }
    if (key.startsWith("key") && key.length === 4) {
      key = key.slice(3);
    }
    const modifierKey = event.ctrlKey || event.metaKey;
    if (modifierKey && key === "o") {
      event.preventDefault();
      runMenuAction("open");
      return;
    }
    if (modifierKey && key === "s") {
      event.preventDefault();
      if (event.shiftKey) {
        runMenuAction("save-as");
      } else {
        runMenuAction("save");
      }
      return;
    }
    if (modifierKey && !event.shiftKey && (key === "," || key === "comma")) {
      event.preventDefault();
      runMenuAction("settings");
      return;
    }
    if (key === "f5") {
      event.preventDefault();
      runSchematicAnalysis();
      return;
    }
    const target = event.target;
    const targetTag = target && target.tagName ? target.tagName.toLowerCase() : "";
    if (targetTag === "input" || targetTag === "textarea") {
      return;
    }
    const schematicActive = schematicMode || schematicPanel.classList.contains("active");
    if (!schematicActive) {
      return;
    }
    const keyCode = event.keyCode;
    if (modifierKey && key === "z") {
      event.preventDefault();
      if (event.shiftKey) {
        runSchematicAction("redo");
      } else {
        runSchematicAction("undo");
      }
      return;
    }
    if (modifierKey && key === "y") {
      event.preventDefault();
      runSchematicAction("redo");
      return;
    }
    if (modifierKey && key === "c") {
      event.preventDefault();
      runMenuAction("copy");
      return;
    }
    if (modifierKey && key === "x") {
      event.preventDefault();
      runMenuAction("cut");
      return;
    }
    if (modifierKey && key === "v") {
      event.preventDefault();
      runMenuAction("paste");
      return;
    }
    if (modifierKey && key === "e") {
      event.preventDefault();
      runMenuAction("edit");
      return;
    }
    if (modifierKey && key === "a") {
      event.preventDefault();
      runMenuAction("select-all");
      return;
    }
    if (modifierKey) {
      return;
    }
    if (key === "space") {
      event.preventDefault();
      runSchematicAction(event.shiftKey ? "rotate-ccw" : "rotate-cw");
      return;
    }
    if (key === "x") {
      event.preventDefault();
      runSchematicAction("flip-h");
      return;
    }
    if (key === "y") {
      event.preventDefault();
      runSchematicAction("flip-v");
      return;
    }
    if (key === "escape") {
      const activeTool = typeof schematicEditor?.getTool === "function"
        ? schematicEditor.getTool()
        : null;
      const isWireTool = activeTool?.mode === "wire";
      if (isWireTool && typeof schematicEditor?.cancelWirePlacement === "function") {
        const canceled = schematicEditor.cancelWirePlacement();
        if (canceled) {
          event.preventDefault();
          if (autoSwitchToSelectOnWire) {
            setActiveSchematicTool("select");
          }
          return;
        }
      }
      clearPlotTraceSelectionState({ skipRecompute: true });
      clearSchematicSelection();
      setHoverTraceHighlights([]);
      schematicTraceHighlightTokens = new Set();
      primaryTraceSelectionToken = "";
      focusedTracePane = "schematic";
      recomputeTraceHighlightState();
      event.preventDefault();
      setActiveSchematicTool("select");
      return;
    }
    if (key === "delete" || key === "backspace" || keyCode === 46 || keyCode === 8) {
      event.preventDefault();
      runSchematicAction("delete");
      return;
    }
    if (key === "h") {
      event.preventDefault();
      toggleHelpEnabled();
      return;
    }
    const tool = schematicToolHotkeyState.keyToTool[key];
    if (tool) {
      event.preventDefault();
      setActiveSchematicTool(tool);
    }
  };

  window.addEventListener("keydown", handleSchematicKey);

  const closeMenuGroups = () => {
    menuBar.querySelectorAll(".menu-group.open").forEach((group) => {
      group.classList.remove("open");
    });
  };

  const updateMenuActionState = () => {
    const { componentIds, wireIds } = getValidSelection();
    const hasSelection = componentIds.length > 0 || wireIds.length > 0;
    const hasClipboard = clipboard.componentIds.length > 0 || clipboard.wireIds.length > 0;
    const hasOpResults = Boolean((state.opResults?.nodes ?? []).length || (state.opResults?.currents ?? []).length);
    const hasDcResults = Boolean((state.dcResults?.x ?? []).length && Object.keys(state.dcResults?.traces ?? {}).length);
    const hasTranResults = Boolean((state.tranResults?.x ?? []).length && Object.keys(state.tranResults?.traces ?? {}).length);
    const hasAcResults = Boolean((state.acResults?.freq ?? []).length && Object.keys(state.acResults?.magnitude ?? {}).length);
    const hasAnyResults = hasOpResults || hasDcResults || hasTranResults || hasAcResults;
    const wireCount = (schematicEditor?.getModel?.()?.wires ?? []).length;
    const componentCount = (schematicEditor?.getModel?.()?.components ?? []).length;
    const shouldDisable = (action) => {
      if (action === "toggle-help") {
        return false;
      }
      if (
        action === "open"
        || action === "save"
        || action === "save-as"
        || action === "new"
        || action === "about"
        || action === "hotkeys"
        || action === "settings"
      ) {
        return false;
      }
      if (action && action.startsWith(EXAMPLE_MENU_ACTION_PREFIX)) {
        return false;
      }
      if (action === "export-diagram") {
        return false;
      }
      if (action === "export-results") {
        return !hasAnyResults;
      }
      if (action && action.startsWith("export-")) {
        return false;
      }
      if (action === "paste") {
        return !hasClipboard;
      }
      if (action === "undo" || action === "redo") {
        return false;
      }
      if (action === "simplify-wires") {
        return !hasSelection;
      }
      if (action === "regrid-current-grid") {
        return !hasSelection;
      }
      if (action === "select-all") {
        return componentCount + wireCount < 1;
      }
      return !hasSelection;
    };
    document.querySelectorAll("[data-menu-action]").forEach((item) => {
      const action = item.dataset.menuAction;
      item.disabled = shouldDisable(action);
    });
    document.querySelectorAll("[data-context-action]").forEach((item) => {
      const action = item.dataset.contextAction;
      item.disabled = shouldDisable(action);
    });
  };

  const buildMenuItem = (entry, options = {}) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "menu-item";
    const labelSpan = document.createElement("span");
    labelSpan.className = "menu-item-label";
    labelSpan.textContent = entry.label;
    button.appendChild(labelSpan);
    if (entry.shortcut && options.showShortcut) {
      const shortcutSpan = document.createElement("span");
      shortcutSpan.className = "menu-item-shortcut";
      shortcutSpan.textContent = entry.shortcut;
      shortcutSpan.setAttribute("aria-hidden", "true");
      button.appendChild(shortcutSpan);
    }
    if (options.actionAttribute && entry.id && !entry.disabled) {
      button.dataset[options.actionAttribute] = entry.id;
      button.addEventListener("click", (event) => {
        event.stopPropagation();
        runMenuAction(entry.id);
        if (typeof options.onAction === "function") {
          options.onAction();
        } else {
          closeMenuGroups();
        }
      });
    } else {
      button.disabled = Boolean(entry.disabled);
    }
    return button;
  };

  const renderExampleMenuItems = (items) => {
    if (!exampleMenuList) {
      return;
    }
    exampleMenuList.innerHTML = "";
    items.forEach((entry) => {
      if (entry && entry.divider) {
        const divider = document.createElement("div");
        divider.className = "menu-divider";
        if (entry.id) {
          divider.dataset.menuDivider = entry.id;
        }
        exampleMenuList.appendChild(divider);
        return;
      }
      const item = buildMenuItem(entry, {
        actionAttribute: "menuAction",
        showShortcut: false,
        onAction: closeMenuGroups
      });
      exampleMenuList.appendChild(item);
    });
    updateMenuActionState();
  };

  const setExampleEntries = (entries) => {
    sampleEntryMap.clear();
    entries.forEach((entry) => {
      sampleEntryMap.set(String(entry.id), entry);
    });
    const items = entries.length
      ? entries.map((entry) => ({
        id: `${EXAMPLE_MENU_ACTION_PREFIX}${entry.id}`,
        label: entry.label
      }))
      : EXAMPLE_MENU_EMPTY_ITEMS;
    renderExampleMenuItems(items);
  };

  const initializeExamplesMenu = async () => {
    const api = getSchematicApi();
    if (!api
      || typeof api.loadSchematicExamples !== "function"
      || typeof api.listSchematicExamples !== "function") {
      sampleEntryMap.clear();
      renderExampleMenuItems(EXAMPLE_MENU_ERROR_ITEMS);
      netlistWarnings.textContent = "Schematic examples loader unavailable.";
      return;
    }

    renderExampleMenuItems(EXAMPLE_MENU_LOADING_ITEMS);
    try {
      await api.loadSchematicExamples();
      setExampleEntries(readSchematicExampleEntries());
    } catch (err) {
      sampleEntryMap.clear();
      renderExampleMenuItems(EXAMPLE_MENU_ERROR_ITEMS);
      netlistWarnings.textContent = "Failed to load examples from /examples.";
      console.error("Failed to load examples from /examples.", err);
    }
  };

  const buildMenuGroup = (group) => {
    const wrapper = document.createElement("div");
    wrapper.className = "menu-group";
    const button = document.createElement("button");
    button.type = "button";
    button.className = "menu-button";
    button.textContent = group.label;
    button.dataset.menuButton = group.id;
    const list = document.createElement("div");
    list.className = "menu-list";
    list.dataset.menuList = group.id;
    if (group.id === "examples") {
      exampleMenuList = list;
    }
    group.items.forEach((entry) => {
      if (entry && entry.divider) {
        const divider = document.createElement("div");
        divider.className = "menu-divider";
        if (entry.id) {
          divider.dataset.menuDivider = entry.id;
        }
        list.appendChild(divider);
        return;
      }
      const item = buildMenuItem(entry, {
        actionAttribute: group.actionAttribute,
        showShortcut: group.showShortcuts,
        onAction: closeMenuGroups
      });
      list.appendChild(item);
    });
    const openThisMenu = () => {
      updateMenuActionState();
      wrapper.classList.add("open");
      positionPopoverInViewport(list, button.getBoundingClientRect(), {
        align: "start",
        gap: 0
      });
      requestAnimationFrame(() => {
        positionPopoverInViewport(list, button.getBoundingClientRect(), {
          align: "start",
          gap: 0
        });
      });
    };
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      const isOpen = wrapper.classList.contains("open");
      closeMenuGroups();
      if (!isOpen) {
        openThisMenu();
      }
    });
    button.addEventListener("mouseenter", () => {
      if (menuBar.querySelector(".menu-group.open") && !wrapper.classList.contains("open")) {
        closeMenuGroups();
        openThisMenu();
      }
    });
    const repositionList = () => {
      if (!wrapper.classList.contains("open")) {
        return;
      }
      positionPopoverInViewport(list, button.getBoundingClientRect(), {
        align: "start",
        gap: 0
      });
    };
    window.addEventListener("resize", repositionList);
    window.addEventListener("scroll", repositionList, true);
    wrapper.append(button, list);
    return wrapper;
  };

  const menuGroups = [
    {
      id: "file",
      label: "File",
      items: [
        { id: "new", label: "New" },
        { id: "open", label: "Open...", shortcut: HOTKEY_SHORTCUTS.open },
        { id: "save", label: "Save", shortcut: HOTKEY_SHORTCUTS.save },
        { id: "save-as", label: "Save As...", shortcut: HOTKEY_SHORTCUTS.saveAs },
        { divider: true, id: "exports" },
        { id: "export-diagram", label: "Export Diagram..." },
        { id: "export-results", label: "Export Results..." },
        { divider: true, id: "settings" },
        { id: "settings", label: "Settings...", shortcut: HOTKEY_SHORTCUTS.settings }
      ],
      actionAttribute: "menuAction",
      showShortcuts: true
    },
    {
      id: "examples",
      label: "Examples",
      items: EXAMPLE_MENU_LOADING_ITEMS,
      actionAttribute: "menuAction",
      showShortcuts: false
    },
    {
      id: "edit",
      label: "Edit",
      items: selectionMenuActions,
      actionAttribute: "menuAction",
      showShortcuts: true
    },
    {
      id: "help",
      label: "Help",
      items: [
        { id: "toggle-help", label: "Hover Info: On", shortcut: HOTKEY_SHORTCUTS.toggleHelp },
        { id: "hotkeys", label: "Hotkeys..." },
        { id: "about", label: "About" }
      ],
      actionAttribute: "menuAction",
      showShortcuts: true
    }
  ];

  menuGroups.forEach((group) => {
    menuBar.appendChild(buildMenuGroup(group));
  });
  applyHelpEntry(workspaceHelpToggleButton, helpEntries.hoverInfo);
  menuBar.appendChild(workspaceHelpToggleButton);
  menuBar.appendChild(fileStatus);
  registerHelpTarget(workspaceHelpToggleButton);
  updateHelpMenuLabel();
  void initializeExamplesMenu();

  const contextMenu = document.createElement("div");
  contextMenu.className = "context-menu";
  contextMenu.dataset.contextMenu = "selection";
  const contextList = document.createElement("div");
  contextList.className = "context-menu-list";
  selectionMenuActions.forEach((entry) => {
    if (entry && entry.divider) {
      const divider = document.createElement("div");
      divider.className = "menu-divider";
      if (entry.id) {
        divider.dataset.menuDivider = entry.id;
      }
      contextList.appendChild(divider);
      return;
    }
    const item = buildMenuItem(entry, {
      actionAttribute: "contextAction",
      showShortcut: true,
      onAction: () => contextMenu.classList.remove("open")
    });
    contextList.appendChild(item);
  });
  contextMenu.appendChild(contextList);
  container.appendChild(contextMenu);

  let inlineSync = false;
  const canEditInlineNetColor = () => !(inlineSync || !inlineEditingComponentId || !schematicEditor);
  const handleInlineNetColorPick = uiInlineEditorWorkflowModule.createInlineNetColorPickHandler({
    canEdit: canEditInlineNetColor,
    getEditingComponentId: () => inlineEditingComponentId,
    getEditor: () => schematicEditor
  });
  const inlineEditorPanel = uiInlineEditorPanelModule.createInlineEditorPanel({
    createNetColorPicker, getDefaultTextStyle,
    listInlineSelectPropertyKeys: () => INLINE_SELECT_PROPERTY_SPECS.map((spec) => spec.key), getSelectPropertyContract: getInlineSelectPropertyContract,
    listInlineTogglePropertyKeys: () => INLINE_TOGGLE_PROPERTY_SPECS.map((spec) => spec.key), getTogglePropertyContract: getInlineTogglePropertyContract,
    listInlineInputPropertyKeys: () => INLINE_INPUT_PROPERTY_SPECS.map((spec) => spec.key), getInputPropertyContract: getInlineInputPropertyContract,
    onPickNetColor: handleInlineNetColorPick
  });
  const {
    root: inlineEditor,
    inlineNameRow,
    inlineNameLabel,
    inlineNameInput,
    inlineValueRow,
    inlineValueLabel,
    inlineValueInput,
    inlineValueUnit,
    inlineSwitchPositionRow,
    inlineSwitchPositionLabel,
    inlineSwitchPositionA,
    inlineSwitchPositionB,
    inlineSwitchRonRow,
    inlineSwitchRonLabel,
    inlineSwitchRonInput,
    inlineSwitchRoffRow,
    inlineSwitchRoffLabel,
    inlineSwitchRoffInput,
    inlineSwitchShowRonRow,
    inlineSwitchShowRonLabel,
    inlineSwitchShowRonInput,
    inlineSwitchShowRoffRow,
    inlineSwitchShowRoffLabel,
    inlineSwitchShowRoffInput,
    inlineProbeTypeRow,
    inlineProbeTypeLabel,
    inlineProbeTypeSelect,
    inlineSelectControlsByKey,
    inlineToggleControlsByKey,
    inlineInputControlsByKey,
    inlineBoxThicknessRow,
    inlineBoxThicknessLabel,
    inlineBoxThicknessUnit,
    inlineBoxThicknessInput,
    inlineBoxLineTypeRow,
    inlineBoxLineTypeLabel,
    inlineBoxLineTypeSelect,
    inlineBoxFillEnabledRow,
    inlineBoxFillEnabledLabel,
    inlineBoxFillEnabledInput,
    inlineBoxFillColorRow,
    inlineBoxFillColorLabel,
    inlineBoxFillColorInput,
    inlineBoxOpacityRow,
    inlineBoxOpacityLabel,
    inlineBoxOpacityInput,
    inlineBoxOpacityValue,
    inlineNetColorPicker,
    syncInlineLabelColumnWidth
  } = inlineEditorPanel;
  workspace.appendChild(inlineEditor);

  const positionInlineEditor = (component) => {
    const anchor = uiInlineEditorPositioningModule.getComponentAnchor(component);
    if (!anchor) {
      return;
    }
    const svg = schematicCanvasWrap.querySelector(".schematic-editor");
    const client = uiInlineEditorPositioningModule.toClientPoint(svg, anchor.x, anchor.y);
    if (!workspace) {
      return;
    }
    const workspaceRect = workspace.getBoundingClientRect();
    const inlineBoundsRect = schematicCanvasWrap instanceof HTMLElement
      ? schematicCanvasWrap.getBoundingClientRect()
      : workspaceRect;
    const fallbackLeft = (inlineBoundsRect.left - workspaceRect.left) + 8;
    const fallbackTop = (inlineBoundsRect.top - workspaceRect.top) + 8;
    const maxPanelHeight = Math.floor(Number(inlineBoundsRect.height) - 16);
    if (Number.isFinite(maxPanelHeight) && maxPanelHeight > 0) {
      inlineEditor.style.maxHeight = `${maxPanelHeight}px`;
      inlineEditor.style.overflowY = "auto";
    }
    if (!client) {
      inlineEditor.style.left = `${fallbackLeft}px`;
      inlineEditor.style.top = `${fallbackTop}px`;
      return;
    }
    const panelRect = inlineEditor.getBoundingClientRect();
    const nextPosition = uiInlineEditorPositioningModule.resolveInlineEditorPosition({
      anchorClient: client,
      workspaceRect,
      panelRect,
      margin: 8,
      offset: 16
    });
    if (!nextPosition) {
      inlineEditor.style.left = `${fallbackLeft}px`;
      inlineEditor.style.top = `${fallbackTop}px`;
      return;
    }
    const clamp = (value, min, max) => {
      if (!Number.isFinite(value)) {
        return min;
      }
      if (!Number.isFinite(min)) {
        return value;
      }
      if (!Number.isFinite(max) || max < min) {
        return min;
      }
      return Math.min(Math.max(value, min), max);
    };
    const minLeft = fallbackLeft;
    const minTop = fallbackTop;
    const maxLeft = (inlineBoundsRect.right - workspaceRect.left) - panelRect.width - 8;
    const maxTop = (inlineBoundsRect.bottom - workspaceRect.top) - panelRect.height - 8;
    inlineEditor.style.left = `${clamp(nextPosition.left, minLeft, maxLeft)}px`;
    inlineEditor.style.top = `${clamp(nextPosition.top, minTop, maxTop)}px`;
  };
  const inlineEditorPanelRefs = {
    inlineEditor,
    inlineNameRow,
    inlineNameInput,
    inlineProbeTypeRow,
    inlineProbeTypeSelect,
    inlineBoxThicknessRow,
    inlineBoxThicknessLabel,
    inlineBoxThicknessUnit,
    inlineBoxThicknessInput,
    inlineBoxLineTypeRow,
    inlineBoxLineTypeSelect,
    inlineBoxFillEnabledRow,
    inlineBoxFillEnabledInput,
    inlineBoxFillColorRow,
    inlineBoxFillColorInput,
    inlineBoxOpacityRow,
    inlineBoxOpacityInput,
    inlineBoxOpacityValue,
    inlineValueInput,
    inlineValueRow,
    inlineSwitchPositionRow,
    inlineSwitchRonRow,
    inlineSwitchRoffRow,
    inlineSwitchShowRonRow,
    inlineSwitchShowRoffRow,
    inlineSwitchRonInput,
    inlineSwitchRoffInput,
    inlineSwitchShowRonInput,
    inlineSwitchShowRoffInput,
    inlineNetColorPicker,
    inlineValueLabel,
    inlineValueUnit,
    syncInlineLabelColumnWidth,
    inlineSwitchPositionA,
    inlineSwitchPositionB,
    inlineSelectControlsByKey,
    inlineToggleControlsByKey,
    inlineInputControlsByKey
  };
  const inlineSelectUiRefsByPropertyKey = (() => {
    if (!inlineSelectControlsByKey || typeof inlineSelectControlsByKey !== "object") {
      throw new Error("Inline editor panel must expose inlineSelectControlsByKey.");
    }
    const refsByPropertyKey = {};
    INLINE_SELECT_PROPERTY_SPECS.forEach((spec) => {
      const key = String(spec?.key ?? "").trim();
      const entry = inlineSelectControlsByKey[key];
      if (!entry || !(entry.row && entry.select)) {
        throw new Error(`Inline select control refs missing for property '${key || "?"}'.`);
      }
      refsByPropertyKey[key] = Object.freeze({
        row: entry.row,
        select: entry.select
      });
    });
    return Object.freeze(refsByPropertyKey);
  })();
  const getInlineSelectUiRefs = (spec) => {
    const refs = inlineSelectUiRefsByPropertyKey[String(spec?.key ?? "").trim()] ?? null;
    if (!refs || !(refs.row && refs.select)) {
      throw new Error(`Inline select UI refs missing for property '${String(spec?.key ?? "")}'.`);
    }
    return refs;
  };
  const inlineToggleUiRefsByPropertyKey = (() => {
    if (!inlineToggleControlsByKey || typeof inlineToggleControlsByKey !== "object") {
      throw new Error("Inline editor panel must expose inlineToggleControlsByKey.");
    }
    const refsByPropertyKey = {};
    INLINE_TOGGLE_PROPERTY_SPECS.forEach((spec) => {
      const key = String(spec?.key ?? "").trim();
      const entry = inlineToggleControlsByKey[key];
      if (!entry || !(entry.row && entry.input)) {
        throw new Error(`Inline toggle control refs missing for property '${key || "?"}'.`);
      }
      refsByPropertyKey[key] = Object.freeze({
        row: entry.row,
        input: entry.input
      });
    });
    return Object.freeze(refsByPropertyKey);
  })();
  const getInlineToggleUiRefs = (spec) => {
    const refs = inlineToggleUiRefsByPropertyKey[String(spec?.key ?? "").trim()] ?? null;
    if (!refs || !(refs.row && refs.input)) {
      throw new Error(`Inline toggle UI refs missing for property '${String(spec?.key ?? "")}'.`);
    }
    return refs;
  };
  const inlineInputUiRefsByPropertyKey = (() => {
    if (!inlineInputControlsByKey || typeof inlineInputControlsByKey !== "object") throw new Error("Inline editor panel must expose inlineInputControlsByKey.");
    const refsByPropertyKey = {};
    INLINE_INPUT_PROPERTY_SPECS.forEach((spec) => {
      const key = String(spec?.key ?? "").trim();
      const entry = inlineInputControlsByKey[key];
      if (!entry || !(entry.row && entry.input)) throw new Error(`Inline input control refs missing for property '${key || "?"}'.`);
      refsByPropertyKey[key] = Object.freeze({ row: entry.row, input: entry.input });
    });
    return Object.freeze(refsByPropertyKey);
  })();
  const getInlineInputUiRefs = (spec) => {
    const refs = inlineInputUiRefsByPropertyKey[String(spec?.key ?? "").trim()] ?? null;
    if (!refs || !(refs.row && refs.input)) throw new Error(`Inline input UI refs missing for property '${String(spec?.key ?? "")}'.`);
    return refs;
  };
  const inlineSelectUiEntries = INLINE_SELECT_PROPERTY_SPECS.map((spec) => ({ spec, refs: getInlineSelectUiRefs(spec) }));
  const inlineToggleUiEntries = INLINE_TOGGLE_PROPERTY_SPECS.map((spec) => ({ spec, refs: getInlineToggleUiRefs(spec) }));
  const inlineInputUiEntries = INLINE_INPUT_PROPERTY_SPECS.map((spec) => ({ spec, refs: getInlineInputUiRefs(spec) }));
  const INLINE_SELECT_SYNC_ENTRIES = Object.freeze([
    ...inlineSelectUiEntries.reduce((entries, entry) => {
      entry.spec.componentTypes.forEach((componentType) => {
        entries.push(Object.freeze({
          componentType,
          propertyKey: entry.spec.key,
          row: entry.refs.row,
          select: entry.refs.select,
          normalizeValue: entry.spec.normalizeValue
        }));
      });
      return entries;
    }, [])
  ]);
  const INLINE_TOGGLE_SYNC_ENTRIES = Object.freeze([
    ...inlineToggleUiEntries.reduce((entries, entry) => {
      entry.spec.componentTypes.forEach((componentType) => {
        entries.push(Object.freeze({
          componentType,
          propertyKey: entry.spec.key,
          row: entry.refs.row,
          input: entry.refs.input,
          normalizeValue: entry.spec.normalizeValue
        }));
      });
      return entries;
    }, [])
  ]);
  const INLINE_INPUT_SYNC_ENTRIES = Object.freeze([...inlineInputUiEntries.reduce((entries, entry) => {
    entry.spec.componentTypes.forEach((componentType) => entries.push(Object.freeze({
      componentType,
      propertyKey: entry.spec.key,
      row: entry.refs.row,
      input: entry.refs.input,
      normalizeValue: entry.spec.normalizeValue
    })));
    return entries;
  }, [])]);
  const getInlineSelectSyncEntries = () => INLINE_SELECT_SYNC_ENTRIES;
  const getInlineToggleSyncEntries = () => INLINE_TOGGLE_SYNC_ENTRIES;
  const getInlineInputSyncEntries = () => INLINE_INPUT_SYNC_ENTRIES;
  const inlineSelectCloseTargets = inlineSelectUiEntries.map((entry) => entry.refs.select);
  const inlineToggleCloseTargets = inlineToggleUiEntries.map((entry) => entry.refs.input);
  const inlineInputCloseTargets = inlineInputUiEntries.map((entry) => entry.refs.input);
  const resolveProbeTargetComponentIdAtPin = (probeComponent, probePin) => {
    if (!probePin || !schematicEditor || typeof schematicEditor.getModel !== "function") {
      return "";
    }
    const components = Array.isArray(schematicEditor.getModel()?.components)
      ? schematicEditor.getModel().components
      : [];
    return uiInlineEditorDomain.findNearestProbeTargetComponentId({
      probeComponent,
      probePin,
      components,
      isProbeComponentType: (type) => isProbeType(type)
    });
  };
  const buildInlineProbeTypeUpdate = (component, nextTypeRaw) => uiInlineEditorDomain.buildProbeTypeUpdate({
    component,
    nextType: nextTypeRaw,
    resolveTargetComponentId: (probeComponent, probePin) =>
      resolveProbeTargetComponentIdAtPin(probeComponent, probePin)
  });
  const inlineEditorHandlers = uiInlineEditorWorkflowModule.createInlineEditorHandlers({
    getModel: () => (schematicEditor && typeof schematicEditor.getModel === "function" ? schematicEditor.getModel() : null),
    getEditor: () => schematicEditor,
    getEditingComponentId: () => inlineEditingComponentId,
    setEditingComponentId: (componentId) => {
      inlineEditingComponentId = componentId || null;
    },
    getInlineSync: () => inlineSync,
    setInlineSync: (value) => {
      inlineSync = value === true;
    },
    panel: inlineEditorPanelRefs,
    buildProbeTypeUpdate: (component, nextType) => buildInlineProbeTypeUpdate(component, nextType),
    isProbeType,
    parseSpdtSwitchValueSafe,
    buildInlineSwitchState: (args) => uiInlineEditorDomain.buildInlineSwitchState(args),
    formatSpdtSwitchValue,
    getInlineModeFlags,
    supportsComponentValueField,
    getInlineSelectSyncEntries,
    getInlineToggleSyncEntries,
    getInlineInputSyncEntries,
    parseBoxAnnotationStyle: (value, options) => parseBoxAnnotationStyleValue(value, options),
    parseArrowAnnotationStyle: (value, options) => parseArrowAnnotationStyleValue(value, options),
    parseTextAnnotationStyle: (value, options) => parseTextAnnotationStyleValue(value, options),
    applyValueFieldMeta,
    setInlineSwitchActiveThrowState: (activeThrow) => {
      uiInlineEditorBindingsModule.setInlineSwitchActiveThrowState({
        inlineSwitchPositionA,
        inlineSwitchPositionB,
        activeThrow: normalizeSpdtThrow(activeThrow)
      });
    },
    positionInlineEditor,
    resolveFocusTargetForComponent: (component) => {
      const componentType = String(component?.type ?? "").toUpperCase();
      return getInlineFocusTarget({
        type: componentType,
        isProbe: isProbeType(componentType)
      });
    },
    applyInlineEditorOpenFocus: ({ focusTarget }) => {
      uiInlineEditorLifecycleModule.applyInlineEditorOpenFocus({
        focusTarget,
        inlineNameInput,
        inlineStyleInput: inlineBoxThicknessInput,
        inlineValueInput,
        inlineSwitchPositionA,
        inlineSwitchPositionB
      });
    },
    prepareInlineEditorPanelForOpen: () => {
      // Measure and hydrate while participating in layout so opening doesn't
      // visibly resize after the first interaction.
      uiInlineEditorLifecycleModule.prepareInlineEditorPanelForOpen({ inlineEditor });
    },
    closeInlineEditorPanel: (onClosed) => {
      uiInlineEditorLifecycleModule.closeInlineEditorPanel({
        inlineEditor,
        onClosed
      });
    },
    getFallbackComponent: () => getModelComponent(schematicSelectionId),
    requestAnimationFrameFn: (callback) => requestAnimationFrame(callback)
  });
  const getModelComponent = inlineEditorHandlers.getModelComponent;
  const buildProbeTypeUpdate = inlineEditorHandlers.buildProbeTypeUpdate;
  const setInlineSwitchActiveThrow = inlineEditorHandlers.setInlineSwitchActiveThrow;
  const commitInlineSwitchState = inlineEditorHandlers.commitInlineSwitchState;
  syncInlineComponentEditor = inlineEditorHandlers.syncInlineComponentEditor;
  closeInlineComponentEditor = inlineEditorHandlers.closeInlineComponentEditor;
  openInlineComponentEditor = inlineEditorHandlers.openInlineComponentEditor;
  const canEditInlineInputs = () => inlineEditorHandlers.canEditInlineInputs();

  // Diode preset map: element property key → SPICE model param key, in order.
  const DIODE_PROP_TO_PARAM = Object.freeze([
    ["diodeIS", "IS"], ["diodeN", "N"], ["diodeRS", "RS"], ["diodeTT", "TT"],
    ["diodeCJO", "CJO"], ["diodeVJ", "VJ"], ["diodeM", "M"], ["diodeEG", "EG"],
    ["diodeXTI", "XTI"], ["diodeTNOM", "TNOM"], ["diodeBV", "BV"], ["diodeIBV", "IBV"],
    ["diodeFC", "FC"]
  ]);
  const expandDiodePresetPatch = (patch) => {
    const presetKey = patch?.diodePreset;
    if (!presetKey || typeof presetKey !== "string") {
      return patch;
    }
    const schematicApi = typeof self !== "undefined" ? self.SpjutSimSchematic : null;
    if (!schematicApi || typeof schematicApi.getDiodeModelPresets !== "function") {
      return patch;
    }
    const presets = schematicApi.getDiodeModelPresets();
    const preset = presets[presetKey];
    if (!preset) {
      return patch;
    }
    const expanded = { ...patch, value: presetKey };
    DIODE_PROP_TO_PARAM.forEach(([propKey, paramKey]) => {
      expanded[propKey] = String(preset[paramKey] ?? "");
    });
    return expanded;
  };

  const applyInlinePatch = (patch) => {
    const componentType = String(getModelComponent(inlineEditingComponentId)?.type ?? "").toUpperCase();
    const resolved = componentType === "D" ? expandDiodePresetPatch(patch) : patch;
    inlineEditorHandlers.applyInlinePatch(resolved);
  };
  const getInlineEditingComponentType = () =>
    String(getModelComponent(inlineEditingComponentId)?.type ?? "").toUpperCase();
  const commitInlineBoxStyle = (stylePatch) => {
    if (!canEditInlineInputs()) {
      return;
    }
    const component = getModelComponent(inlineEditingComponentId);
    const componentType = String(component?.type ?? "").toUpperCase();
    if (componentType !== "BOX") {
      return;
    }
    const options = {
      type: componentType,
      defaultLineType: "solid"
    };
    const current = parseBoxAnnotationStyleValue(component?.value, options);
    const next = parseBoxAnnotationStyleValue({
      ...current,
      ...(stylePatch && typeof stylePatch === "object" ? stylePatch : {})
    }, options);
    applyInlinePatch({ value: formatBoxAnnotationStyleValue(next, options) });
    inlineBoxFillColorRow.hidden = next.fillEnabled !== true;
    inlineBoxOpacityValue.textContent = `${Math.round(Number(next.opacityPercent ?? 100))}%`;
  };
  const commitInlineArrowStyle = (stylePatch) => {
    if (!canEditInlineInputs()) {
      return;
    }
    const component = getModelComponent(inlineEditingComponentId);
    const componentType = String(component?.type ?? "").toUpperCase();
    if (componentType !== "ARR") {
      return;
    }
    const options = { type: componentType };
    const current = parseArrowAnnotationStyleValue(component?.value, options);
    const next = parseArrowAnnotationStyleValue({
      ...current,
      ...(stylePatch && typeof stylePatch === "object" ? stylePatch : {})
    }, options);
    applyInlinePatch({ value: formatArrowAnnotationStyleValue(next, options) });
    inlineBoxOpacityValue.textContent = `${Math.round(Number(next.opacityPercent ?? 100))}%`;
  };
  const commitInlineTextAnnotationStyle = (stylePatch) => {
    if (!canEditInlineInputs()) {
      return;
    }
    const component = getModelComponent(inlineEditingComponentId);
    const componentType = String(component?.type ?? "").toUpperCase();
    if (componentType !== "TEXT") {
      return;
    }
    const options = { type: componentType };
    const current = parseTextAnnotationStyleValue(component?.value, options);
    const next = parseTextAnnotationStyleValue({
      ...current,
      ...(stylePatch && typeof stylePatch === "object" ? stylePatch : {})
    }, options);
    applyInlinePatch({ value: formatTextAnnotationStyleValue(next, options) });
    inlineBoxOpacityValue.textContent = `${Math.round(Number(next.opacityPercent ?? 100))}%`;
  };

  uiInlineEditorBindingsModule.bindInlineNameInput({
    input: inlineNameInput,
    canEdit: canEditInlineInputs,
    onUpdate: (value) => applyInlinePatch({ name: value })
  });
  uiInlineEditorBindingsModule.bindInlineValueInput({
    input: inlineValueInput,
    canEdit: canEditInlineInputs,
    onUpdate: (value) => applyInlinePatch({ value })
  });
  uiInlineEditorBindingsModule.bindInlineSwitchInputs({
    inlineSwitchPositionA,
    inlineSwitchPositionB,
    inlineSwitchRonInput,
    inlineSwitchRoffInput,
    inlineSwitchShowRonInput,
    inlineSwitchShowRoffInput,
    canEditSwitchThrow: () => !inlineSync,
    onSetActiveThrow: (value) => setInlineSwitchActiveThrow(value),
    onCommitSwitchState: (patch, options) => commitInlineSwitchState(patch, options)
  });
  uiInlineEditorBindingsModule.bindInlineProbeTypeSelect({
    inlineProbeTypeSelect,
    canEdit: () => canEditInlineInputs() && typeof schematicEditor.updateComponent === "function",
    getCurrentComponent: () => getModelComponent(inlineEditingComponentId),
    isProbeType: (type) => isProbeType(type),
    buildProbeTypeUpdate: (component, nextType) => buildProbeTypeUpdate(component, nextType),
    onApplyProbeTypeUpdate: (updates) => {
      schematicEditor.updateComponent(inlineEditingComponentId, updates);
    },
    getUpdatedComponent: () => getModelComponent(inlineEditingComponentId),
    onResyncComponent: (component) => syncInlineComponentEditor(component)
  });
  inlineSelectUiEntries.forEach((entry) => {
    uiInlineEditorBindingsModule.bindInlineSelectInput({
      select: entry.refs.select,
      propertyKey: entry.spec.key,
      canEdit: canEditInlineInputs,
      onPatch: (patch) => applyInlinePatch(patch)
    });
  });
  inlineToggleUiEntries.forEach((entry) => {
    uiInlineEditorBindingsModule.bindInlineToggleInput({
      input: entry.refs.input,
      propertyKey: entry.spec.key,
      canEdit: canEditInlineInputs,
      onPatch: (patch) => applyInlinePatch(patch)
    });
  });
  uiInlineEditorBindingsModule.bindInlineBoxStyleInputs({
    inlineBoxThicknessInput,
    inlineBoxLineTypeSelect,
    inlineBoxFillEnabledInput,
    inlineBoxFillColorInput,
    inlineBoxFillColorRow,
    inlineBoxOpacityInput,
    inlineBoxOpacityValue,
    canEdit: canEditInlineInputs,
    onStyleChange: (style) => {
      const type = getInlineEditingComponentType();
      if (type === "ARR") {
        commitInlineArrowStyle(style);
        return;
      }
      commitInlineBoxStyle(style);
    }
  });
  const bindInlineAnnotationStyleInput = (target, eventName, handler) => {
    if (!target || typeof target.addEventListener !== "function") {
      return;
    }
    target.addEventListener(eventName, handler);
  };
  bindInlineAnnotationStyleInput(inlineBoxOpacityInput, "input", () => {
    const type = getInlineEditingComponentType();
    const opacityPercent = inlineBoxOpacityInput.value;
    if (type === "TEXT") {
      commitInlineTextAnnotationStyle({ opacityPercent });
    }
  });
  bindInlineAnnotationStyleInput(inlineBoxOpacityInput, "change", () => {
    const type = getInlineEditingComponentType();
    const opacityPercent = inlineBoxOpacityInput.value;
    if (type === "TEXT") {
      commitInlineTextAnnotationStyle({ opacityPercent });
    }
  });
  inlineInputUiEntries.forEach((entry) => {
    uiInlineEditorBindingsModule.bindInlineNameInput({
      input: entry.refs.input,
      propertyKey: entry.spec.key,
      canEdit: canEditInlineInputs,
      onUpdate: (value) => applyInlinePatch({ [entry.spec.key]: value })
    });
  });

  uiInlineEditorInteractionsModule.bindInlineEditorCloseInteractions({
    getInlineEditingComponentId: () => inlineEditingComponentId,
    inlineEditor,
    closeInlineComponentEditor,
    isCloseCommitKey: isInlineCloseCommitKey,
    closeKeyTargets: [
      inlineNameInput,
      inlineValueInput,
      inlineSwitchPositionA,
      inlineSwitchPositionB,
      inlineSwitchRonInput,
      inlineSwitchRoffInput,
      inlineSwitchShowRonInput,
      inlineSwitchShowRoffInput,
      inlineProbeTypeSelect,
      ...inlineSelectCloseTargets,
      ...inlineToggleCloseTargets,
      inlineBoxThicknessInput,
      inlineBoxLineTypeSelect,
      inlineBoxFillEnabledInput,
      inlineBoxFillColorInput,
      inlineBoxOpacityInput,
      ...inlineInputCloseTargets
    ],
    netColorSwatches: inlineNetColorPicker.swatches,
    documentRoot: document
  });

  const openFileInput = document.createElement("input");
  openFileInput.type = "file";
  openFileInput.accept = "application/json,.json";
  openFileInput.hidden = true;
  container.appendChild(openFileInput);

  const saveDialog = document.createElement("div");
  saveDialog.className = "modal-backdrop hidden";
  saveDialog.dataset.exportDialog = "json";
  saveDialog.setAttribute("role", "dialog");
  saveDialog.setAttribute("aria-modal", "true");
  saveDialog.hidden = true;
  const savePanel = document.createElement("div");
  savePanel.className = "modal-dialog";
  const saveTitle = document.createElement("div");
  saveTitle.className = "modal-title";
  saveTitle.textContent = "Export Schematic JSON";
  const saveBody = document.createElement("div");
  saveBody.className = "modal-body";
  const filenameRow = document.createElement("label");
  filenameRow.className = "modal-field";
  const filenameLabel = document.createElement("span");
  filenameLabel.textContent = "Filename";
  const filenameInput = document.createElement("input");
  filenameInput.type = "text";
  filenameInput.dataset.exportFilename = "1";
  filenameRow.append(filenameLabel, filenameInput);
  const includeRow = document.createElement("label");
  includeRow.className = "modal-field";
  const includeLabel = document.createElement("span");
  includeLabel.textContent = "Include results";
  const includeCheck = document.createElement("input");
  includeCheck.type = "checkbox";
  includeCheck.dataset.exportIncludeResults = "1";
  includeRow.append(includeCheck, includeLabel);
  saveBody.append(filenameRow, includeRow);
  const saveActions = document.createElement("div");
  saveActions.className = "modal-actions";
  const saveCancel = document.createElement("button");
  saveCancel.type = "button";
  saveCancel.className = "secondary";
  saveCancel.textContent = "Cancel";
  saveCancel.dataset.exportCancel = "1";
  const saveConfirm = document.createElement("button");
  saveConfirm.type = "button";
  saveConfirm.textContent = "Export";
  saveConfirm.dataset.exportConfirm = "1";
  saveActions.append(saveCancel, saveConfirm);
  savePanel.append(saveTitle, saveBody, saveActions);
  saveDialog.append(savePanel);
  container.appendChild(saveDialog);

  const exportDialog = document.createElement("div");
  exportDialog.className = "modal-backdrop hidden";
  exportDialog.dataset.exportDialog = "diagram";
  exportDialog.setAttribute("role", "dialog");
  exportDialog.setAttribute("aria-modal", "true");
  exportDialog.hidden = true;
  const exportPanel = document.createElement("div");
  exportPanel.className = "modal-dialog";
  const exportTitle = document.createElement("div");
  exportTitle.className = "modal-title";
  exportTitle.textContent = "Export Diagram";
  const exportBody = document.createElement("div");
  exportBody.className = "modal-body";
  const formatRow = document.createElement("label");
  formatRow.className = "modal-field";
  const formatLabel = document.createElement("span");
  formatLabel.textContent = "Format";
  const formatSelect = document.createElement("select");
  formatSelect.dataset.exportFormat = "1";
  [["png", "PNG"], ["svg", "SVG"], ["pdf", "PDF"], ["jpeg", "JPEG"]].forEach(([value, text]) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = text;
    formatSelect.appendChild(option);
  });
  formatRow.append(formatLabel, formatSelect);
  const exportFilenameRow = document.createElement("label");
  exportFilenameRow.className = "modal-field";
  const exportFilenameLabel = document.createElement("span");
  exportFilenameLabel.textContent = "Filename";
  const exportFilenameInput = document.createElement("input");
  exportFilenameInput.type = "text";
  exportFilenameInput.dataset.exportFilename = "1";
  exportFilenameRow.append(exportFilenameLabel, exportFilenameInput);
  const scaleRow = document.createElement("label");
  scaleRow.className = "modal-field";
  scaleRow.dataset.exportRasterOnly = "1";
  const scaleLabel = document.createElement("span");
  scaleLabel.textContent = "Resolution";
  const scaleSelect = document.createElement("select");
  scaleSelect.dataset.exportScale = "1";
  ["1", "2", "3", "4"].forEach((value) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = `${value}x`;
    scaleSelect.appendChild(option);
  });
  scaleRow.append(scaleLabel, scaleSelect);
  const transparentRow = document.createElement("label");
  transparentRow.className = "modal-field";
  transparentRow.dataset.exportPngOnly = "1";
  const transparentLabel = document.createElement("span");
  transparentLabel.textContent = "Transparent background";
  const transparentCheck = document.createElement("input");
  transparentCheck.type = "checkbox";
  transparentCheck.dataset.exportTransparent = "1";
  transparentRow.append(transparentCheck, transparentLabel);
  const updateExportDialogFieldVisibility = () => {
    const isPng = formatSelect.value === "png";
    const isRaster = isPng || formatSelect.value === "jpeg";
    exportDialog.querySelectorAll("[data-export-raster-only]").forEach((row) => {
      row.hidden = !isRaster;
    });
    exportDialog.querySelectorAll("[data-export-png-only]").forEach((row) => {
      row.hidden = !isPng;
    });
  };
  formatSelect.addEventListener("change", () => {
    updateExportDialogFieldVisibility();
    const base = stripFilenameExtension(exportFilenameInput.value);
    exportFilenameInput.value = withFilenameExtension(base, formatSelect.value, getBaseFilename());
  });
  exportBody.append(formatRow, exportFilenameRow, scaleRow, transparentRow);
  const exportActions = document.createElement("div");
  exportActions.className = "modal-actions";
  const exportCancel = document.createElement("button");
  exportCancel.type = "button";
  exportCancel.className = "secondary";
  exportCancel.textContent = "Cancel";
  exportCancel.dataset.exportCancel = "1";
  const exportConfirm = document.createElement("button");
  exportConfirm.type = "button";
  exportConfirm.textContent = "Export";
  exportConfirm.dataset.exportConfirm = "1";
  exportActions.append(exportCancel, exportConfirm);
  exportPanel.append(exportTitle, exportBody, exportActions);
  exportDialog.append(exportPanel);
  container.appendChild(exportDialog);

  const { openAboutDialog } = buildAboutDialog(container);
  const { openHotkeysDialog } = buildHotkeysDialog(container, {
    listHotkeys: () => listImplementedHotkeys()
  });
  ({
    openSettingsDialog,
    openSettingsDialogForType
  } = buildSettingsDialog(container, {
    getAutoSwitchToSelectAfterToolUse: () => autoSwitchToSelectOnPlace,
    onAutoSwitchToSelectAfterToolUseChange: (value) => {
      autoSwitchToSelectOnPlace = Boolean(value);
      queueAutosave();
    },
    getAutoSwitchToSelectAfterWireUse: () => autoSwitchToSelectOnWire,
    onAutoSwitchToSelectAfterWireUseChange: (value) => {
      autoSwitchToSelectOnWire = Boolean(value);
      queueAutosave();
    },
    getSchematicTextStyle: () => ({ ...schematicTextStyle }),
    getSchematicTextFontOptions: () => textStyleApi.getTextFontOptions(),
    onSchematicTextStyleChange: (updates) => {
      schematicTextStyle = normalizeSchematicTextStyle(updates, schematicTextStyle);
      applySchematicTextStyleToEditor();
      queueAutosave();
    },
    getComponentDefaultSpecs: () => COMPONENT_DEFAULT_SPECS.slice(),
    getComponentDefaults: () => normalizeComponentDefaults(componentDefaults, componentDefaults),
    getToolDisplayDefaults: () => normalizeToolDisplayDefaults(toolDisplayDefaults, toolDisplayDefaults),
    getWireDefaultColor: () => normalizeWireDefaultColor(wireDefaultColor, wireDefaultColor),
    getResistorDisplayTypeOptions,
    getGroundDisplayTypeOptions,
    parseSwitchComponentDefaultValue,
    isProbeComponentType: (type) => isProbeType(type),
    createNetColorPicker,
    onComponentDefaultChange: (type, updates) => {
      const key = String(type ?? "").trim().toUpperCase();
      const current = componentDefaults && typeof componentDefaults === "object"
        ? componentDefaults[key]
        : null;
      const hasSwitchRon = Object.prototype.hasOwnProperty.call(updates ?? {}, "switchRon");
      const hasSwitchRoff = Object.prototype.hasOwnProperty.call(updates ?? {}, "switchRoff");
      let nextValue = Object.prototype.hasOwnProperty.call(updates ?? {}, "value")
        ? updates.value
        : current?.value;
      if (key === "SW" && (hasSwitchRon || hasSwitchRoff)) {
        const currentSwitchDefaults = parseSwitchComponentDefaultValue(current?.value);
        nextValue = formatSwitchComponentDefaultValue({
          ron: hasSwitchRon ? updates.switchRon : currentSwitchDefaults.ron,
          roff: hasSwitchRoff ? updates.switchRoff : currentSwitchDefaults.roff
        });
      }
      const nextColor = Object.prototype.hasOwnProperty.call(updates ?? {}, "netColor")
        ? updates.netColor
        : current?.netColor;
      componentDefaults = normalizeComponentDefaults({
        ...componentDefaults,
        [key]: {
          value: nextValue,
          netColor: nextColor
        }
      }, componentDefaults);
      applyComponentDefaultsToEditor();
      queueAutosave();
    },
    onToolDisplayDefaultChange: (key, value) => {
      const normalizedKey = String(key ?? "").trim();
      if (normalizedKey !== "resistorStyle"
        && normalizedKey !== "groundVariant"
        && normalizedKey !== "groundColor"
        && normalizedKey !== "probeColor") {
        return;
      }
      toolDisplayDefaults = normalizeToolDisplayDefaults({
        ...toolDisplayDefaults,
        [normalizedKey]: value
      }, toolDisplayDefaults);
      applyToolDisplayDefaultsToEditor();
      queueAutosave();
    },
    onWireDefaultColorChange: (value) => {
      wireDefaultColor = normalizeWireDefaultColor(value, wireDefaultColor);
      applyWireDefaultColorToEditor();
      queueAutosave();
    },
    onApplyComponentDefaultsToExisting: (options) => {
      if (!schematicEditor || typeof schematicEditor.applyComponentDefaultsToExisting !== "function") {
        return;
      }
      const scopedOptions = options && typeof options === "object" ? options : {};
      const applyOptions = {
        displayDefaults: toolDisplayDefaults,
        wireDefaultColor,
        ...(Array.isArray(scopedOptions.types) ? { types: scopedOptions.types } : {})
      };
      if (Object.prototype.hasOwnProperty.call(scopedOptions, "applyGroundDefaults")) {
        applyOptions.applyGroundDefaults = scopedOptions.applyGroundDefaults;
      }
      if (Object.prototype.hasOwnProperty.call(scopedOptions, "applyProbeDefaults")) {
        applyOptions.applyProbeDefaults = scopedOptions.applyProbeDefaults;
      }
      if (Object.prototype.hasOwnProperty.call(scopedOptions, "applyWireDefaults")) {
        applyOptions.applyWireDefaults = scopedOptions.applyWireDefaults;
      }
      const result = schematicEditor.applyComponentDefaultsToExisting(componentDefaults, applyOptions);
      if (result && typeof result === "object"
        && (Number(result.updatedComponents) > 0 || Number(result.updatedWires) > 0)) {
        queueAutosave();
      }
    },
    onResetComponentTypeDefaults: (type) => {
      const key = String(type ?? "").trim().toUpperCase();
      if (!key) {
        return;
      }
      let changed = false;
      const builtInDefaults = getBuiltInComponentDefaults();
      const currentDefaults = componentDefaults && typeof componentDefaults === "object"
        ? componentDefaults
        : {};
      if (Object.prototype.hasOwnProperty.call(builtInDefaults, key)) {
        const nextDefaultsEntry = builtInDefaults[key];
        const currentDefaultsEntry = currentDefaults[key];
        const currentValue = String(currentDefaultsEntry?.value ?? "");
        const currentColor = String(currentDefaultsEntry?.netColor ?? "").trim().toLowerCase();
        const nextValue = String(nextDefaultsEntry?.value ?? "");
        const nextColor = String(nextDefaultsEntry?.netColor ?? "").trim().toLowerCase();
        if (currentValue !== nextValue || currentColor !== nextColor) {
          componentDefaults = normalizeComponentDefaults({
            ...currentDefaults,
            [key]: nextDefaultsEntry
          }, currentDefaults);
          changed = true;
        }
      }
      if (key === "R") {
        const builtInDisplayDefaults = getBuiltInToolDisplayDefaults();
        const nextStyle = String(builtInDisplayDefaults?.resistorStyle ?? "").trim().toLowerCase();
        const currentStyle = String(toolDisplayDefaults?.resistorStyle ?? "").trim().toLowerCase();
        if (nextStyle && nextStyle !== currentStyle) {
          toolDisplayDefaults = normalizeToolDisplayDefaults({
            ...toolDisplayDefaults,
            resistorStyle: nextStyle
          }, toolDisplayDefaults);
          changed = true;
        }
      } else if (key === "GND") {
        const builtInDisplayDefaults = getBuiltInToolDisplayDefaults();
        const nextVariant = String(builtInDisplayDefaults?.groundVariant ?? "").trim().toLowerCase();
        const nextGroundColor = normalizeWireDefaultColor(builtInDisplayDefaults?.groundColor, null);
        const currentVariant = String(toolDisplayDefaults?.groundVariant ?? "").trim().toLowerCase();
        const currentGroundColor = normalizeWireDefaultColor(toolDisplayDefaults?.groundColor, null);
        if ((nextVariant && nextVariant !== currentVariant) || nextGroundColor !== currentGroundColor) {
          toolDisplayDefaults = normalizeToolDisplayDefaults({
            ...toolDisplayDefaults,
            groundVariant: nextVariant || currentVariant,
            groundColor: nextGroundColor
          }, toolDisplayDefaults);
          changed = true;
        }
      } else if (key === "WIRE") {
        const currentWireColor = normalizeWireDefaultColor(wireDefaultColor, null);
        if (currentWireColor !== null) {
          wireDefaultColor = normalizeWireDefaultColor(null, null);
          changed = true;
        }
      } else if (isProbeType(key)) {
        const nextProbeColor = normalizeWireDefaultColor(getBuiltInToolDisplayDefaults()?.probeColor, null);
        const currentProbeColor = normalizeWireDefaultColor(toolDisplayDefaults?.probeColor, null);
        if (nextProbeColor !== currentProbeColor) {
          toolDisplayDefaults = normalizeToolDisplayDefaults({
            ...toolDisplayDefaults,
            probeColor: nextProbeColor
          }, toolDisplayDefaults);
          changed = true;
        }
      }
      if (!changed) {
        return;
      }
      applyComponentDefaultsToEditor();
      applyWireDefaultColorToEditor();
      applyToolDisplayDefaultsToEditor();
      queueAutosave();
    },
    onResetSettings: () => {
      autoSwitchToSelectOnPlace = DEFAULT_AUTO_SWITCH_TO_SELECT_ON_PLACE;
      autoSwitchToSelectOnWire = DEFAULT_AUTO_SWITCH_TO_SELECT_ON_WIRE;
      schematicTextStyle = { ...DEFAULT_SCHEMATIC_TEXT_STYLE };
      schematicTextStyle = normalizeSchematicTextStyle(schematicTextStyle);
      componentDefaults = getBuiltInComponentDefaults();
      wireDefaultColor = normalizeWireDefaultColor(null);
      toolDisplayDefaults = getBuiltInToolDisplayDefaults();
      applySchematicTextStyleToEditor();
      applyComponentDefaultsToEditor();
      applyWireDefaultColorToEditor();
      applyToolDisplayDefaultsToEditor();
      queueAutosave();
    }
  }));

  const toFilenameLeaf = (value) => getPlotExportApi().toFilenameLeaf(value);
  const withFilenameExtension = (value, extension, fallbackBase) =>
    getPlotExportApi().withFilenameExtension(value, extension, fallbackBase);
  const stripFilenameExtension = (value) => getPlotExportApi().stripFilenameExtension(value);
  const normalizeJsonFilename = (value) => withFilenameExtension(value, "json", "schematic");
  const downloadTextFile = (filename, text, mimeType) => getPlotExportApi().downloadTextFile(filename, text, mimeType);
  const downloadCsvFile = (filename, text) => getPlotExportApi().downloadCsvFile(filename, text);
  const csvEscape = (value) => getPlotExportApi().csvEscape(value);
  const buildCsvText = (headers, rows) => getPlotExportApi().buildCsvText(headers, rows);
  const signalTypeUnits = getPlotExportApi().signalTypeUnits;
  const getSignalUnit = (signal) => getPlotExportApi().getSignalUnit(signal, classifySeriesSignalType);

  const getDcSweepUnit = () => {
    const source = String(simulationConfig.dc?.source ?? "").trim().toUpperCase();
    return source.startsWith("I") ? "A" : "V";
  };

  const getBaseFilename = () => {
    const raw = documentMeta.fileName || suggestedFileName || "schematic";
    return stripFilenameExtension(raw) || "schematic";
  };

  const buildSchematicFilename = (extension) => withFilenameExtension(getBaseFilename(), extension, "schematic");
  const normalizePngFilename = (value) => withFilenameExtension(value, "png", getBaseFilename());
  const buildSimulationExportFilename = (analysisKey, artifact, extension) =>
    `${getBaseFilename()}-${analysisKey}-${artifact}.${extension}`;
  const buildCsvFilename = (analysisKey) => buildSimulationExportFilename(analysisKey, "results", "csv");
  const buildPlotPngFilename = (analysisKey) => buildSimulationExportFilename(analysisKey, "plot", "png");

  const recordCsvExport = (kind, csv, headers, filename) => {
    schematicPanel._exportState = {
      type: "csv",
      kind,
      headers,
      csv,
      size: csv.length,
      filename
    };
  };

  const canUseSavePicker = () =>
    !isUiTestMode && typeof window !== "undefined" && typeof window.showSaveFilePicker === "function";

  const canUseOpenPicker = () =>
    !isUiTestMode && typeof window !== "undefined" && typeof window.showOpenFilePicker === "function";

  const getDefaultJsonName = () =>
    normalizeJsonFilename(documentMeta.fileName || suggestedFileName || "schematic.json");
  const getDefaultExampleJsonName = () =>
    normalizeJsonFilename(`${getBaseFilename()}-example.json`);
  const recordJsonExport = (doc, includeResults, filename, json) => {
    schematicPanel._exportState = {
      type: "json",
      includeResults,
      payload: doc,
      size: json.length,
      filename
    };
  };

  const recordSaveSuccess = (doc, filename, json, handle) => {
    documentMeta.fileName = filename;
    suggestedFileName = filename;
    saveFileHandle = handle;
    if (handle) {
      lastPickerHandle = handle;
    }
    if (persistenceApi && typeof persistenceApi.setRecentInfo === "function") {
      persistenceApi.setRecentInfo({
        lastOpenedName: filename,
        lastAutosaveKey: persistenceApi.AUTOSAVE_KEY
      });
    }
    recordJsonExport(doc, false, filename, json);
    markDocumentSaved();
  };

  const requestHandlePermission = async (handle) => {
    if (!handle || typeof handle.queryPermission !== "function" || typeof handle.requestPermission !== "function") {
      return true;
    }
    try {
      const status = await handle.queryPermission({ mode: "readwrite" });
      if (status === "granted") {
        return true;
      }
      const requested = await handle.requestPermission({ mode: "readwrite" });
      return requested === "granted";
    } catch (err) {
      console.error("Failed to request file handle permission.", err);
      return false;
    }
  };

  const writeTextToHandle = async (handle, text) => {
    if (!handle || typeof handle.createWritable !== "function") {
      return false;
    }
    const hasPermission = await requestHandlePermission(handle);
    if (!hasPermission) {
      return false;
    }
    try {
      const writable = await handle.createWritable();
      await writable.write(text);
      await writable.close();
      return true;
    } catch (err) {
      console.error("Failed to write schematic file.", err);
      return false;
    }
  };

  const pickSaveHandle = async (suggestedName) => {
    if (!canUseSavePicker()) {
      return { handle: null, cancelled: false };
    }
    try {
      const options = {
        suggestedName,
        types: [{ description: "Schematic JSON", accept: { "application/json": [".json"] } }]
      };
      if (lastPickerHandle) {
        options.startIn = lastPickerHandle;
      }
      const handle = await window.showSaveFilePicker(options);
      return { handle, cancelled: false };
    } catch (err) {
      if (err && err.name === "AbortError") {
        return { handle: null, cancelled: true };
      }
      console.error("Failed to open save file picker.", err);
      return { handle: null, cancelled: false };
    }
  };

  const pickOpenHandle = async () => {
    if (!canUseOpenPicker()) {
      return { handle: null, cancelled: false };
    }
    try {
      const options = {
        multiple: false,
        types: [{ description: "Schematic JSON", accept: { "application/json": [".json"] } }]
      };
      if (lastPickerHandle) {
        options.startIn = lastPickerHandle;
      }
      const handles = await window.showOpenFilePicker(options);
      const handle = Array.isArray(handles) ? handles[0] : null;
      return { handle, cancelled: false };
    } catch (err) {
      if (err && err.name === "AbortError") {
        return { handle: null, cancelled: true };
      }
      console.error("Failed to open file picker.", err);
      return { handle: null, cancelled: false };
    }
  };

  const openJsonExportDialog = () => {
    filenameInput.value = getDefaultJsonName();
    includeCheck.checked = false;
    setDialogOpen(saveDialog, true);
  };

  const closeJsonExportDialog = () => {
    setDialogOpen(saveDialog, false);
  };

  const confirmJsonExportDialog = async () => {
    const includeResults = Boolean(includeCheck.checked);
    const doc = buildDocumentPayload(includeResults);
    if (!doc) {
      netlistWarnings.textContent = "Unable to serialize schematic.";
      return;
    }
    const filename = normalizeJsonFilename(filenameInput.value || getDefaultJsonName());
    const json = JSON.stringify(doc, null, 2);
    if (canUseSavePicker()) {
      const picker = await pickSaveHandle(filename);
      if (picker.cancelled) {
        return;
      }
      if (picker.handle) {
        const saved = await writeTextToHandle(picker.handle, json);
        if (saved) {
          const handleName = picker.handle.name || filename;
          lastPickerHandle = picker.handle;
          recordJsonExport(doc, includeResults, handleName, json);
          closeJsonExportDialog();
          return;
        }
      }
    }
    downloadTextFile(filename, json);
    recordJsonExport(doc, includeResults, filename, json);
    closeJsonExportDialog();
  };

  const buildSavePayload = () => {
    const doc = buildDocumentPayload(false);
    if (!doc) {
      netlistWarnings.textContent = "Unable to serialize schematic.";
      return null;
    }
    return { doc, json: JSON.stringify(doc, null, 2) };
  };

  const savePayloadToHandle = async (handle, payload) => {
    const saved = await writeTextToHandle(handle, payload.json);
    if (!saved) {
      return false;
    }
    const filename = handle.name || getDefaultJsonName();
    recordSaveSuccess(payload.doc, filename, payload.json, handle);
    return true;
  };

  const savePayloadWithDownload = (payload, filenameOverride) => {
    const filename = normalizeJsonFilename(filenameOverride || getDefaultJsonName());
    downloadTextFile(filename, payload.json);
    recordSaveSuccess(payload.doc, filename, payload.json, null);
  };

  const handleSaveAction = async (forceSaveAs = false) => {
    const payload = buildSavePayload();
    if (!payload) {
      return;
    }
    if (!forceSaveAs && saveFileHandle) {
      const saved = await savePayloadToHandle(saveFileHandle, payload);
      if (saved) {
        return;
      }
    }
    if (canUseSavePicker()) {
      const picker = await pickSaveHandle(getDefaultJsonName());
      if (picker.cancelled) {
        return;
      }
      if (picker.handle) {
        const saved = await savePayloadToHandle(picker.handle, payload);
        if (saved) {
          return;
        }
      }
    }
    savePayloadWithDownload(payload);
  };

  const handleOpenAction = async () => {
    if (canUseOpenPicker()) {
      const picker = await pickOpenHandle();
      if (picker.cancelled) {
        return;
      }
      if (!picker.handle) {
        return;
      }
      try {
        const file = await picker.handle.getFile();
        const text = await file.text();
        const doc = JSON.parse(text);
        applyDocument(doc, { fileName: file.name, markDirty: false });
        saveFileHandle = picker.handle;
        lastPickerHandle = picker.handle;
        suggestedFileName = file.name;
        if (persistenceApi && typeof persistenceApi.setRecentInfo === "function") {
          persistenceApi.setRecentInfo({
            lastOpenedName: file.name,
            lastAutosaveKey: persistenceApi.AUTOSAVE_KEY
          });
        }
      } catch (err) {
        netlistWarnings.textContent = "Failed to parse schematic file.";
        console.error("Failed to parse schematic file.", err);
      }
      return;
    }
    openFileInput.click();
  };

  const openExportDialog = () => {
    formatSelect.value = exportDiagramPrefs.format;
    const allowed = new Set(["1", "2", "3", "4"]);
    const scaleValue = allowed.has(String(exportDiagramPrefs.scale)) ? String(exportDiagramPrefs.scale) : "2";
    scaleSelect.value = scaleValue;
    transparentCheck.checked = Boolean(exportDiagramPrefs.transparent);
    exportFilenameInput.value = buildSchematicFilename(exportDiagramPrefs.format);
    updateExportDialogFieldVisibility();
    setDialogOpen(exportDialog, true);
  };

  const closeExportDialog = () => {
    setDialogOpen(exportDialog, false);
  };

  const closeActiveDialogs = () => {
    let closed = false;
    document.querySelectorAll(".modal-backdrop").forEach((dialog) => {
      const isHidden = dialog.hidden || dialog.classList.contains("hidden");
      if (!isHidden) {
        setDialogOpen(dialog, false);
        closed = true;
      }
    });
    return closed;
  };

  exportDialog.addEventListener("click", (event) => {
    if (event.target === exportDialog) {
      closeExportDialog();
    }
  });

  saveDialog.addEventListener("click", (event) => {
    if (event.target === saveDialog) {
      closeJsonExportDialog();
    }
  });
  exportCancel.addEventListener("click", closeExportDialog);
  exportConfirm.addEventListener("click", () => {
    const chosenFormat = normalizeExportFormat(formatSelect.value);
    exportDiagramPrefs.format = chosenFormat;
    const nextScale = Number(scaleSelect.value);
    exportDiagramPrefs.scale = Number.isFinite(nextScale) && nextScale > 0 ? nextScale : 2;
    exportDiagramPrefs.transparent = Boolean(transparentCheck.checked);
    const filename = withFilenameExtension(exportFilenameInput.value, chosenFormat, getBaseFilename());
    persistExportDiagramPrefs();
    closeExportDialog();
    if (chosenFormat === "svg") {
      exportSchematicSvg(filename);
    } else if (chosenFormat === "pdf") {
      void exportSchematicPdf(filename);
    } else if (chosenFormat === "jpeg") {
      void exportSchematicJpeg(getExportScale(exportDiagramPrefs.scale), filename);
    } else {
      void exportSchematicPng(getExportScale(exportDiagramPrefs.scale), exportDiagramPrefs.transparent, filename);
    }
  });

  saveCancel.addEventListener("click", closeJsonExportDialog);
  saveConfirm.addEventListener("click", () => {
    void confirmJsonExportDialog();
  });
  openFileInput.addEventListener("change", () => {
    const file = openFileInput.files?.[0];
    if (!file) {
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const text = typeof reader.result === "string" ? reader.result : "";
      try {
        const doc = JSON.parse(text);
        applyDocument(doc, { fileName: file.name, markDirty: false });
        saveFileHandle = null;
        suggestedFileName = file.name;
        if (persistenceApi && typeof persistenceApi.setRecentInfo === "function") {
          persistenceApi.setRecentInfo({
            lastOpenedName: file.name,
            lastAutosaveKey: persistenceApi.AUTOSAVE_KEY
          });
        }
      } catch (err) {
        netlistWarnings.textContent = "Failed to parse schematic file.";
        console.error("Failed to parse schematic file.", err);
      }
    };
    reader.readAsText(file);
    openFileInput.value = "";
  });

  const TOUCH_CONTEXT_LONG_PRESS_MS = 520;
  const TOUCH_CONTEXT_LONG_PRESS_MOVE_PX = 12;
  let contextMenuTouchPress = null;

  const getTouchPointerId = (event) => {
    const pointerId = Number(event?.pointerId);
    return Number.isFinite(pointerId) ? pointerId : null;
  };

  const clearTouchContextLongPress = (pointerId = null) => {
    if (!contextMenuTouchPress) {
      return;
    }
    if (pointerId !== null && contextMenuTouchPress.pointerId !== pointerId) {
      return;
    }
    if (contextMenuTouchPress.timerId !== null) {
      window.clearTimeout(contextMenuTouchPress.timerId);
    }
    contextMenuTouchPress = null;
  };

  const showContextMenu = (event) => {
    if (!schematicMode) {
      return;
    }
    clearTouchContextLongPress();
    event.preventDefault();
    if (schematicEditor) {
      const targetEl = event.target instanceof Element ? event.target : null;
      const componentId = targetEl?.closest?.("[data-component]")?.getAttribute("data-component")
        || targetEl?.closest?.("[data-component-id]")?.getAttribute("data-component-id");
      if (componentId && typeof schematicEditor.setSelection === "function") {
        schematicEditor.setSelection([componentId]);
      }
    }
    updateMenuActionState();
    contextMenu.classList.add("open");
    const placeContextMenu = () => {
      const wrapRect = schematicCanvasWrap.getBoundingClientRect();
      const maxHeight = Math.max(0, Math.floor(wrapRect.height - 2));
      contextMenu.style.maxHeight = `${maxHeight}px`;
      contextMenu.style.overflowY = "auto";
      let x = Number.isFinite(event.clientX) ? event.clientX : wrapRect.left;
      let y = Number.isFinite(event.clientY) ? event.clientY : wrapRect.top;
      const prevDisplay = contextMenu.style.display;
      const prevVisibility = contextMenu.style.visibility;
      contextMenu.style.display = "block";
      contextMenu.style.visibility = "hidden";
      contextMenu.style.left = `${Math.round(x)}px`;
      contextMenu.style.top = `${Math.round(y)}px`;
      const menuRect = contextMenu.getBoundingClientRect();
      const menuWidth = Math.max(
        menuRect.width,
        contextMenu.offsetWidth || 0,
        contextMenu.scrollWidth || 0,
        contextList.offsetWidth || 0,
        contextList.scrollWidth || 0
      );
      const menuHeight = Math.max(
        menuRect.height,
        contextMenu.offsetHeight || 0,
        contextMenu.scrollHeight || 0,
        contextList.offsetHeight || 0,
        contextList.scrollHeight || 0
      );
      contextMenu.style.visibility = prevVisibility;
      contextMenu.style.display = prevDisplay;
      if (x + menuWidth > wrapRect.right) {
        x -= (x + menuWidth) - wrapRect.right;
      }
      if (y + menuHeight > wrapRect.bottom) {
        y -= (y + menuHeight) - wrapRect.bottom;
      }
      x = Math.max(wrapRect.left, x);
      y = Math.max(wrapRect.top, y);
      contextMenu.style.left = `${Math.round(x)}px`;
      contextMenu.style.top = `${Math.round(y)}px`;
      for (let attempt = 0; attempt < 3; attempt += 1) {
        const positionedRect = contextMenu.getBoundingClientRect();
        let deltaX = 0;
        let deltaY = 0;
        if (positionedRect.right > wrapRect.right) {
          deltaX -= positionedRect.right - wrapRect.right;
        }
        if (positionedRect.bottom > wrapRect.bottom) {
          deltaY -= positionedRect.bottom - wrapRect.bottom;
        }
        if (positionedRect.left < wrapRect.left) {
          deltaX += wrapRect.left - positionedRect.left;
        }
        if (positionedRect.top < wrapRect.top) {
          deltaY += wrapRect.top - positionedRect.top;
        }
        if (Math.abs(deltaX) < 0.1 && Math.abs(deltaY) < 0.1) {
          break;
        }
        x = Math.max(wrapRect.left, x + deltaX);
        y = Math.max(wrapRect.top, y + deltaY);
        contextMenu.style.left = `${Math.round(x)}px`;
        contextMenu.style.top = `${Math.round(y)}px`;
      }
    };
    const runPlacementPass = (remaining) => {
      if (!contextMenu.classList.contains("open")) {
        return;
      }
      placeContextMenu();
      if (remaining > 0) {
        window.requestAnimationFrame(() => runPlacementPass(remaining - 1));
      }
    };
    runPlacementPass(2);
  };

  const hideContextMenu = () => {
    clearTouchContextLongPress();
    contextMenu.classList.remove("open");
  };

  const beginTouchContextLongPress = (event) => {
    if (!schematicMode) {
      return;
    }
    if (String(event?.pointerType ?? "").trim().toLowerCase() !== "touch") {
      return;
    }
    if (event.button !== 0) {
      return;
    }
    const pointerId = getTouchPointerId(event);
    if (pointerId === null) {
      return;
    }
    if (contextMenuTouchPress && contextMenuTouchPress.pointerId !== pointerId) {
      clearTouchContextLongPress();
      return;
    }
    clearTouchContextLongPress(pointerId);
    const startX = Number.isFinite(event.clientX) ? event.clientX : 0;
    const startY = Number.isFinite(event.clientY) ? event.clientY : 0;
    const startTarget = event.target;
    const timerId = window.setTimeout(() => {
      if (!contextMenuTouchPress || contextMenuTouchPress.pointerId !== pointerId) {
        return;
      }
      contextMenuTouchPress = null;
      showContextMenu({
        preventDefault: () => { },
        target: startTarget,
        clientX: startX,
        clientY: startY
      });
    }, TOUCH_CONTEXT_LONG_PRESS_MS);
    contextMenuTouchPress = {
      pointerId,
      startX,
      startY,
      timerId
    };
  };

  const cancelTouchContextLongPressOnMove = (event) => {
    if (!contextMenuTouchPress) {
      return;
    }
    const pointerId = getTouchPointerId(event);
    if (pointerId === null) {
      clearTouchContextLongPress();
      return;
    }
    if (pointerId !== contextMenuTouchPress.pointerId) {
      clearTouchContextLongPress();
      return;
    }
    const dx = Number(event.clientX) - contextMenuTouchPress.startX;
    const dy = Number(event.clientY) - contextMenuTouchPress.startY;
    if ((dx * dx) + (dy * dy) > TOUCH_CONTEXT_LONG_PRESS_MOVE_PX * TOUCH_CONTEXT_LONG_PRESS_MOVE_PX) {
      clearTouchContextLongPress(pointerId);
    }
  };

  const endTouchContextLongPress = (event) => {
    const pointerId = getTouchPointerId(event);
    if (pointerId === null) {
      clearTouchContextLongPress();
      return;
    }
    clearTouchContextLongPress(pointerId);
  };

  schematicCanvasWrap.addEventListener("contextmenu", showContextMenu);
  schematicCanvasWrap.addEventListener("pointerdown", beginTouchContextLongPress);
  schematicCanvasWrap.addEventListener("pointermove", cancelTouchContextLongPressOnMove);
  schematicCanvasWrap.addEventListener("pointerup", endTouchContextLongPress);
  schematicCanvasWrap.addEventListener("pointercancel", endTouchContextLongPress);
  schematicCanvasWrap.addEventListener("pointerleave", endTouchContextLongPress);
  document.addEventListener("click", (event) => {
    if (!contextMenu.contains(event.target)) {
      hideContextMenu();
    }
    const clickedMenuGroup = event.target?.closest?.(".menu-group");
    if (!clickedMenuGroup) {
      closeMenuGroups();
    }
  });
  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      const hadInlineEditor = Boolean(inlineEditingComponentId);
      closeInlineComponentEditor();
      const closedDialog = closeActiveDialogs();
      hideContextMenu();
      closeMenuGroups();
      if (closedDialog || hadInlineEditor) {
        event.preventDefault();
      }
    }
  });

  opExportCsvButton.addEventListener("click", exportOpCsv);
  dcExportButton.addEventListener("click", () => exportVisiblePlotPngs([
    { canvas: dcCanvas, suffix: "voltage" },
    { canvas: dcCurrentCanvas, wrap: dcCurrentWrap, suffix: "current" },
    { canvas: dcPowerCanvas, wrap: dcPowerWrap, suffix: "power" }
  ], buildPlotPngFilename("dc")));
  dcExportCsvButton.addEventListener("click", exportDcCsv);
  tranExportButton.addEventListener("click", () => exportVisiblePlotPngs([
    { canvas: tranCanvas, suffix: "voltage" },
    { canvas: tranCurrentCanvas, wrap: tranCurrentWrap, suffix: "current" },
    { canvas: tranPowerCanvas, wrap: tranPowerWrap, suffix: "power" }
  ], buildPlotPngFilename("tran")));
  tranExportCsvButton.addEventListener("click", exportTranCsv);
  acExportMagButton.addEventListener("click", () => exportPlotPng(acMagCanvas, buildPlotPngFilename("ac-magnitude")));
  acExportPhaseButton.addEventListener("click", () => exportPlotPng(acPhaseCanvas, buildPlotPngFilename("ac-phase")));
  acExportCsvButton.addEventListener("click", exportAcCsv);

  const renderOpResults = (results) => {
    const nodeRows = Array.isArray(results?.nodes) ? results.nodes : [];
    const currentRows = Array.isArray(results?.currents) ? results.currents : [];
    const preferredSignals = buildPreferredAnalysisSignals();
    const preferredSignalCaseMap = buildSignalCaseMap(preferredSignals);
    const signalNames = nodeRows
      .map((row) => String(row?.name ?? "").trim())
      .concat(currentRows.map((row) => String(row?.name ?? "").trim()))
      .filter(Boolean);
    ensureColorMap(colorMaps.op, signalNames);
    const nodes = formatRows(nodeRows, {
      rowKind: "op-node",
      colorMap: colorMaps.op,
      signalCaseMap: preferredSignalCaseMap
    });
    const currents = formatRows(currentRows, {
      rowKind: "op-current",
      colorMap: colorMaps.op,
      signalCaseMap: preferredSignalCaseMap
    });
    renderTable(nodesTable, nodes, ["Node", "Voltage (V)"]);
    renderTable(currentsTable, currents, ["Source", "Current (A)"]);
    const nodeCount = nodes.length;
    const currentCount = currents.length;
    resultsMeta.textContent = (nodeCount || currentCount)
      ? `${nodeCount} node voltages, ${currentCount} branch currents`
      : "";
  };

  renderOpResults(state.opResults);

  const renderSingleAxisPlotResults = ({
    results,
    signalSelectEl,
    colorMap,
    metaEl,
    canvasEl,
    currentCanvasEl,
    currentWrapEl,
    powerCanvasEl,
    powerWrapEl,
    xLabel,
    yLabel,
    xTickFormat
  }) => {
    const plot = typeof self !== "undefined" ? self.SpjutSimPlot : null;
    const xValues = results?.x ?? [];
    const preferredSignals = buildPreferredAnalysisSignals();
    const preferredSignalCaseMap = buildSignalCaseMap(preferredSignals);
    if (results && typeof results === "object") {
      const casedTraces = applyTraceMapCaseMap(results.traces, preferredSignalCaseMap);
      if (casedTraces.changed) {
        results.traces = casedTraces.map;
      }
      const nextSignals = applySignalCaseMap(results.signals, preferredSignalCaseMap);
      if (!signalListsEqual(results.signals, nextSignals)) {
        results.signals = nextSignals;
      }
      const nextSelected = applySignalCaseMap(results.selected, preferredSignalCaseMap);
      if (!signalListsEqual(results.selected, nextSelected)) {
        results.selected = nextSelected;
      }
    }
    const traces = results?.traces ?? {};
    const selected = updateSignalSelect(
      signalSelectEl,
      results?.signals,
      Array.isArray(results?.selected) && results.selected.length ? results.selected : preferredSignals,
      { preferredSignals }
    );
    if (results && typeof results === "object") {
      results.selected = dedupeSignalList(selected);
    }
    ensureColorMap(colorMap, results?.signals);
    const series = buildSeries(xValues, traces, colorMap, selected);
    metaEl.textContent = selected.length ? `Traces: ${selected.map((signal) => formatSignalLabel(signal)).join(", ")}` : "";

    const hasDisplayModeControls = Boolean(currentCanvasEl && currentWrapEl);
    if (!plot || typeof plot.renderPlot !== "function") {
      canvasEl.getContext("2d")?.clearRect(0, 0, canvasEl.width, canvasEl.height);
      if (currentCanvasEl) {
        currentCanvasEl.getContext("2d")?.clearRect(0, 0, currentCanvasEl.width, currentCanvasEl.height);
      }
      if (powerCanvasEl) {
        powerCanvasEl.getContext("2d")?.clearRect(0, 0, powerCanvasEl.width, powerCanvasEl.height);
      }
      if (currentWrapEl) {
        currentWrapEl.hidden = true;
      }
      if (powerWrapEl) {
        powerWrapEl.hidden = true;
      }
      return;
    }

    if (!hasDisplayModeControls) {
      // Simple mode: render all on one canvas (no display mode controls)
      plot.renderPlot(canvasEl, {
        series,
        grid: showGrid,
        fontScale: plotPrefs.fontScale,
        lineWidth: plotPrefs.lineWidth,
        xLabel,
        yLabel,
        ...(xTickFormat ? { xTickFormat } : {})
      });
      return;
    }

    // Split series by type
    const split = splitSeriesByType(series);
    const ipMode = plotPrefs.ipDisplay;

    // Count enabled trace types
    const enabledTypes = [];
    if (split.voltage.length > 0) enabledTypes.push("voltage");
    if (split.current.length > 0) enabledTypes.push("current");
    if (split.power.length > 0) enabledTypes.push("power");

    const typeColors = { voltage: "#0f62fe", current: "#ff832b", power: "#198038" };
    const typeLabels = { voltage: "Voltage", current: "Current", power: "Power" };
    const typeUnits = signalTypeUnits;
    const dashPatterns = [[], [8, 4], [2, 3], [8, 3, 2, 3]];

    // Priority order for left axis: voltage > current > power
    const typePriority = ["voltage", "current", "power"];

    const plotBase = {
      grid: showGrid,
      fontScale: plotPrefs.fontScale,
      lineWidth: plotPrefs.lineWidth,
      ...(xTickFormat ? { xTickFormat } : {})
    };

    // Single type or same-plot with only one type: render one plot, normal colors
    if (enabledTypes.length <= 1) {
      const type = enabledTypes[0] ?? "voltage";
      const typeSeries = split[type] ?? [];
      if (currentWrapEl) currentWrapEl.hidden = true;
      if (powerWrapEl) powerWrapEl.hidden = true;
      plot.renderPlot(canvasEl, {
        ...plotBase,
        series: typeSeries,
        xLabel,
        yLabel: `${typeLabels[type]} (${typeUnits[type]})`
      });
      return;
    }

    // Multiple types enabled
    if (ipMode === "same") {
      // Same plot mode: left axis = highest priority type, right axes = others
      // Apply type-based colors and dash patterns
      const applyTypeStyle = (seriesList, type) => {
        const color = typeColors[type];
        return seriesList.map((s, i) => ({
          ...s,
          color,
          dashPattern: dashPatterns[i % dashPatterns.length]
        }));
      };

      // Determine left axis type (highest priority present)
      const leftType = typePriority.find((t) => enabledTypes.includes(t)) ?? "voltage";
      const leftSeries = applyTypeStyle(split[leftType], leftType);

      // Build right axes for remaining types (in priority order)
      const rightAxes = [];
      typePriority.forEach((type) => {
        if (type === leftType || !enabledTypes.includes(type)) return;
        const styledSeries = applyTypeStyle(split[type], type);
        rightAxes.push({
          series: styledSeries,
          yLabel: `${typeLabels[type]} (${typeUnits[type]})`,
          color: typeColors[type]
        });
      });

      if (currentWrapEl) currentWrapEl.hidden = true;
      if (powerWrapEl) powerWrapEl.hidden = true;
      plot.renderPlot(canvasEl, {
        ...plotBase,
        series: leftSeries,
        rightAxes: rightAxes.length > 0 ? rightAxes : undefined,
        xLabel,
        yLabel: `${typeLabels[leftType]} (${typeUnits[leftType]})`,
        yAxisColor: typeColors[leftType]
      });
      return;
    }

    // Separate plots mode: render each type on its own canvas
    // Map types to canvases: first type → main canvas, second → current canvas, third → power canvas
    const canvases = [
      { canvas: canvasEl, wrap: null },
      { canvas: currentCanvasEl, wrap: currentWrapEl },
      { canvas: powerCanvasEl, wrap: powerWrapEl }
    ];

    // Set visibility for all wraps first so layout can settle
    if (currentWrapEl) currentWrapEl.hidden = enabledTypes.length < 2;
    if (powerWrapEl) powerWrapEl.hidden = enabledTypes.length < 3;

    // Render each enabled type
    enabledTypes.forEach((type, idx) => {
      const target = canvases[idx];
      if (!target?.canvas) return;
      plot.renderPlot(target.canvas, {
        ...plotBase,
        series: split[type],
        xLabel,
        yLabel: `${typeLabels[type]} (${typeUnits[type]})`
      });
    });
  };

  const renderDcResults = (results) => {
    renderSingleAxisPlotResults({
      results,
      signalSelectEl: signalSelect,
      colorMap: colorMaps.dc,
      metaEl: dcMeta,
      canvasEl: dcCanvas,
      currentCanvasEl: dcCurrentCanvas,
      currentWrapEl: dcCurrentWrap,
      powerCanvasEl: dcPowerCanvas,
      powerWrapEl: dcPowerWrap,
      xLabel: "Sweep (V)",
      yLabel: "Voltage (V)"
    });
  };

  renderDcResults(state.dcResults);

  const renderTranResults = (results) => {
    renderSingleAxisPlotResults({
      results,
      signalSelectEl: signalSelectT,
      colorMap: colorMaps.tran,
      metaEl: tranMeta,
      canvasEl: tranCanvas,
      currentCanvasEl: tranCurrentCanvas,
      currentWrapEl: tranCurrentWrap,
      powerCanvasEl: tranPowerCanvas,
      powerWrapEl: tranPowerWrap,
      xLabel: "Time",
      xTickFormat: "time",
      yLabel: "Voltage (V)"
    });
  };

  renderTranResults(state.tranResults);

  const renderAcResults = (results) => {
    const plot = typeof self !== "undefined" ? self.SpjutSimPlot : null;
    const freq = results?.freq ?? [];
    const preferredSignals = buildPreferredAnalysisSignals();
    const preferredSignalCaseMap = buildSignalCaseMap(preferredSignals);
    if (results && typeof results === "object") {
      const casedMagnitude = applyTraceMapCaseMap(results.magnitude, preferredSignalCaseMap);
      if (casedMagnitude.changed) {
        results.magnitude = casedMagnitude.map;
      }
      const casedPhase = applyTraceMapCaseMap(results.phase, preferredSignalCaseMap);
      if (casedPhase.changed) {
        results.phase = casedPhase.map;
      }
      const nextSignals = applySignalCaseMap(results.signals, preferredSignalCaseMap);
      if (!signalListsEqual(results.signals, nextSignals)) {
        results.signals = nextSignals;
      }
      const nextSelected = applySignalCaseMap(results.selected, preferredSignalCaseMap);
      if (!signalListsEqual(results.selected, nextSelected)) {
        results.selected = nextSelected;
      }
    }
    const magnitude = results?.magnitude ?? {};
    const phase = results?.phase ?? {};
    const selected = updateSignalSelect(
      signalSelectA,
      results?.signals,
      Array.isArray(results?.selected) && results.selected.length ? results.selected : preferredSignals,
      { preferredSignals }
    );
    if (results && typeof results === "object") {
      results.selected = dedupeSignalList(selected);
    }
    ensureColorMap(colorMaps.ac, results?.signals);
    const magSeries = buildSeries(freq, magnitude, colorMaps.ac, selected);
    const phaseSeries = buildSeries(freq, phase, colorMaps.ac, selected);

    acMeta.textContent = selected.length ? `Traces: ${selected.map((signal) => formatSignalLabel(signal)).join(", ")}` : "";
    if (!plot || typeof plot.renderPlot !== "function") {
      acMagCanvas.getContext("2d")?.clearRect(0, 0, acMagCanvas.width, acMagCanvas.height);
      acPhaseCanvas.getContext("2d")?.clearRect(0, 0, acPhaseCanvas.width, acPhaseCanvas.height);
      return;
    }
    // Magnitude plot (dB)
    plot.renderPlot(acMagCanvas, {
      series: magSeries,
      grid: showGrid,
      fontScale: plotPrefs.fontScale,
      lineWidth: plotPrefs.lineWidth,
      yLabel: "Magnitude (dB)",
      xLabel: "Frequency (Hz)",
      xScale: "log"
    });
    // Phase plot (degrees)
    plot.renderPlot(acPhaseCanvas, {
      series: phaseSeries,
      grid: showGrid,
      fontScale: plotPrefs.fontScale,
      lineWidth: plotPrefs.lineWidth,
      yLabel: "Phase (deg)",
      xLabel: "Frequency (Hz)",
      xScale: "log"
    });
  };

  refreshPlotResults = () => {
    renderDcResults(state.dcResults);
    renderTranResults(state.tranResults);
    renderAcResults(state.acResults);
  };

  renderAcResults(state.acResults);

  let plotResizeFrame = 0;
  queuePlotResize = () => {
    if (plotResizeFrame) {
      return;
    }
    plotResizeFrame = window.requestAnimationFrame(() => {
      plotResizeFrame = 0;
      renderDcResults(state.dcResults);
      renderTranResults(state.tranResults);
      renderAcResults(state.acResults);
    });
  };
  window.addEventListener("resize", queuePlotResize);
  if (typeof ResizeObserver !== "undefined") {
    const plotResizeObserver = new ResizeObserver(() => {
      queuePlotResize();
    });
    [dcPlotWrap, tranPlotWrap, acMagWrap, acPhaseWrap, dcCurrentWrap, dcPowerWrap, tranCurrentWrap, tranPowerWrap].forEach((wrap) => {
      if (wrap) {
        plotResizeObserver.observe(wrap);
      }
    });
  }

  const hasResultsForKind = (kind) => {
    switch (kind) {
      case "op": {
        const nodes = state.opResults?.nodes ?? [];
        const currents = state.opResults?.currents ?? [];
        return Boolean(nodes.length || currents.length);
      }
      case "dc": {
        const traces = state.dcResults?.traces ?? {};
        return Boolean(state.dcResults?.x?.length && Object.keys(traces).length);
      }
      case "tran": {
        const traces = state.tranResults?.traces ?? {};
        return Boolean(state.tranResults?.x?.length && Object.keys(traces).length);
      }
      case "ac": {
        const magnitude = state.acResults?.magnitude ?? {};
        return Boolean(state.acResults?.freq?.length && Object.keys(magnitude).length);
      }
      default:
        return false;
    }
  };

  const getActiveResultsKind = () => {
    if (hasResultsForKind(lastRunKind)) {
      return lastRunKind;
    }
    if (hasResultsForKind(simulationConfig.activeKind)) {
      return simulationConfig.activeKind;
    }
    return lastRunKind || simulationConfig.activeKind;
  };

  const getVoltageMap = (kind) => {
    const map = new Map();
    if (kind === "op") {
      (state.opResults?.nodes ?? []).forEach((row) => {
        const key = normalizeNodeName(row.name);
        if (key) {
          map.set(key, typeof row.raw === "number" ? row.raw : null);
        }
      });
      return map;
    }
    if (kind === "dc") {
      const traces = state.dcResults?.traces ?? {};
      Object.entries(traces).forEach(([name, values]) => {
        const key = normalizeNodeName(name);
        if (key && Array.isArray(values) && values.length) {
          map.set(key, values[values.length - 1]);
        }
      });
      return map;
    }
    if (kind === "tran") {
      const traces = state.tranResults?.traces ?? {};
      Object.entries(traces).forEach(([name, values]) => {
        const key = normalizeNodeName(name);
        if (key && Array.isArray(values) && values.length) {
          map.set(key, values[values.length - 1]);
        }
      });
      return map;
    }
    if (kind === "ac") {
      const traces = state.acResults?.magnitude ?? {};
      Object.entries(traces).forEach(([name, values]) => {
        const key = normalizeNodeName(name);
        if (key && Array.isArray(values) && values.length) {
          map.set(key, values[values.length - 1]);
        }
      });
      return map;
    }
    return map;
  };

  const canonicalSignalName = (name) =>
    String(name ?? "").trim().toLowerCase().replace(/\s+/g, "");

  const matchSignal = (availableSignal, candidateSignal) => {
    const availableToken = normalizeSignalToken(availableSignal);
    const candidateToken = normalizeSignalToken(candidateSignal);
    if (availableToken && candidateToken && availableToken === candidateToken) {
      return true;
    }
    const available = canonicalSignalName(availableSignal);
    const candidate = canonicalSignalName(candidateSignal);
    if (!available || !candidate) {
      return false;
    }
    if (available === candidate) {
      return true;
    }
    const availableCurrent = normalizeCurrentName(availableSignal);
    const candidateCurrent = normalizeCurrentName(candidateSignal);
    if (availableCurrent && candidateCurrent) {
      return availableCurrent === candidateCurrent || availableCurrent.endsWith(candidateCurrent);
    }
    return false;
  };

  const getTraceEntriesForKind = (kind) => {
    if (kind === "dc") {
      return Object.entries(state.dcResults?.traces ?? {});
    }
    if (kind === "tran") {
      return Object.entries(state.tranResults?.traces ?? {});
    }
    if (kind === "ac") {
      return Object.entries(state.acResults?.magnitude ?? {});
    }
    return [];
  };

  const getTraceValueByCandidates = (kind, candidates) => {
    const list = dedupeSignals(candidates);
    if (!list.length) {
      return null;
    }
    if (kind === "op") {
      const rows = [
        ...(state.opResults?.currents ?? []),
        ...(state.opResults?.nodes ?? [])
      ];
      for (const candidate of list) {
        for (const row of rows) {
          if (!matchSignal(row?.name, candidate)) {
            continue;
          }
          if (typeof row.raw === "number") {
            return row.raw;
          }
        }
      }
      return null;
    }
    const entries = getTraceEntriesForKind(kind);
    for (const candidate of list) {
      for (const [name, values] of entries) {
        if (!matchSignal(name, candidate)) {
          continue;
        }
        if (Array.isArray(values) && values.length) {
          return values[values.length - 1];
        }
      }
    }
    return null;
  };

  const getTraceSeriesByCandidates = (kind, candidates) => {
    const list = dedupeSignals(candidates);
    if (!list.length) {
      return null;
    }
    const entries = getTraceEntriesForKind(kind);
    for (const candidate of list) {
      for (const [name, values] of entries) {
        if (!matchSignal(name, candidate)) {
          continue;
        }
        if (Array.isArray(values) && values.length) {
          return values;
        }
      }
    }
    return null;
  };

  const getCurrentValue = (kind, netlistIdOrSignals) => {
    if (Array.isArray(netlistIdOrSignals)) {
      return getTraceValueByCandidates(kind, netlistIdOrSignals);
    }
    const target = String(netlistIdOrSignals ?? "").trim();
    if (!target) {
      return null;
    }
    return getTraceValueByCandidates(kind, [`i(${target})`, target]);
  };

  const resolveProbeCurrentValue = (kind, descriptor, componentLines, getNodeVoltage) => {
    if (!descriptor) {
      return null;
    }
    const measured = getCurrentValue(kind, descriptor.currentSignals ?? []);
    if (Number.isFinite(measured)) {
      return measured;
    }
    const targetId = String(descriptor.targetId ?? "").trim();
    if (!targetId) {
      return null;
    }
    const lineInfo = componentLines[targetId];
    if (!lineInfo || String(lineInfo.type ?? "").toUpperCase() !== "R") {
      return null;
    }
    const resistance = parseMetricInput(lineInfo.value);
    if (!Number.isFinite(resistance) || resistance === 0) {
      return null;
    }
    const vA = getNodeVoltage(lineInfo.netA);
    const vB = getNodeVoltage(lineInfo.netB);
    if (!Number.isFinite(vA) || !Number.isFinite(vB)) {
      return null;
    }
    return (vA - vB) / resistance;
  };

  function refreshMeasurements() {
    const measurements = [];
    const inlineMap = new Map();
    const probeLabelMap = new Map();
    const components = Array.isArray(schematicModel?.components) ? schematicModel.components : [];
    const compileInfo = latestSchematicCompile ?? {};
    syncProbeSignalDisplayLabelMap(compileInfo);
    const pinNetMap = compileInfo.pinNetMap ?? {};
    const componentLines = compileInfo.componentLines ?? {};
    const probeData = Array.isArray(compileInfo.probeDescriptors)
      ? { descriptors: compileInfo.probeDescriptors }
      : buildProbeDescriptors(compileInfo);
    const probeDescriptors = Array.isArray(probeData?.descriptors) ? probeData.descriptors : [];
    const probeById = new Map(probeDescriptors.map((entry) => [String(entry.id ?? ""), entry]));
    // Schematic-side measurement rows are OP-only by design; DC/TRAN/AC runs
    // must not overwrite these displayed values with sweep/timepoint samples.
    const kind = "op";
    const voltageMap = getVoltageMap(kind);
    const directSources = Object.values(componentLines)
      .filter((line) => line && line.type === "V" && line.netA && line.netB && line.value);
    const lookupDirectVoltage = (netA, netB) => {
      if (!netA || !netB) {
        return null;
      }
      for (const source of directSources) {
        const value = parseMetricInput(source.value);
        if (!Number.isFinite(value)) {
          continue;
        }
        if (source.netA === netA && source.netB === netB) {
          return value;
        }
        if (source.netA === netB && source.netB === netA) {
          return -value;
        }
      }
      return null;
    };
    const getNodeVoltage = (netName) => {
      if (!netName) {
        return null;
      }
      if (netName === "0") {
        return 0;
      }
      return voltageMap.get(normalizeNodeName(netName)) ?? null;
    };
    const buildMeasurementHighlightTokens = (signals) => normalizeSignalTokens(signals);

    components.forEach((component) => {
      const type = String(component?.type ?? "").toUpperCase();
      if (type === "VM" || type === "AM") {
        const pins = Array.isArray(component?.pins) ? component.pins : [];
        if (pins.length < 2) {
          return;
        }
        const keyA = `${component.id}::${pins[0].id}`;
        const keyB = `${component.id}::${pins[1].id}`;
        const netA = pinNetMap[keyA];
        const netB = pinNetMap[keyB];
        const meterSignals = [];
        if (netA) {
          meterSignals.push(`v(${netA})`);
        }
        if (netB) {
          meterSignals.push(`v(${netB})`);
        }
        if (netA && netB) {
          meterSignals.push(`v(${netA},${netB})`);
        }
        const vA = getNodeVoltage(netA);
        const vB = getNodeVoltage(netB);
        let value = null;
        let unit = "V";
        if (type === "VM") {
          if (Number.isFinite(vA) && Number.isFinite(vB)) {
            value = vA - vB;
          } else {
            const direct = lookupDirectVoltage(netA, netB);
            if (Number.isFinite(direct)) {
              value = direct;
            }
          }
          unit = "V";
        } else {
          unit = "A";
          const resistance = parseMetricInput(component.value);
          const lineInfo = componentLines[component.id];
          const netlistId = String(lineInfo?.netlistId ?? component.id ?? "").trim();
          if (netlistId) {
            meterSignals.push(`i(${netlistId})`);
          }
          const componentId = String(component?.id ?? "").trim().toLowerCase();
          if (componentId) {
            meterSignals.push(`@${componentId}[i]`);
          }
          if (Number.isFinite(resistance) && resistance !== 0 && Number.isFinite(vA) && Number.isFinite(vB)) {
            value = (vA - vB) / resistance;
          } else {
            const measured = getCurrentValue(kind, netlistId);
            if (Number.isFinite(measured)) {
              value = measured;
            }
          }
        }
        const display = formatMeasurementValue(value, unit);
        const label = type === "VM" ? "Voltmeter" : "Ammeter";
        measurements.push({
          id: component.id,
          label,
          value: display,
          measurementType: type === "VM" ? "voltage" : "current",
          isProbe: false,
          highlightTokens: buildMeasurementHighlightTokens(meterSignals),
          signalColor: resolveTraceColorForSignals(meterSignals)
        });
        inlineMap.set(component.id, display);
        return;
      }
      if (!isProbeType(type)) {
        return;
      }
      const descriptor = probeById.get(String(component.id ?? ""));
      const probeSignalGroups = collectProbeDescriptorHighlightSignals(descriptor);
      const probeSignals = probeSignalGroups.voltageSignals.concat(probeSignalGroups.currentSignals);
      let value = null;
      let unit = "V";
      if (type === "PV") {
        value = getNodeVoltage(descriptor?.netA);
        unit = "V";
      } else if (type === "PD") {
        const vA = getNodeVoltage(descriptor?.netA);
        const vB = getNodeVoltage(descriptor?.netB);
        if (Number.isFinite(vA) && Number.isFinite(vB)) {
          value = vA - vB;
        }
        unit = "V";
      } else if (type === "PI") {
        value = resolveProbeCurrentValue(kind, descriptor, componentLines, getNodeVoltage);
        unit = "A";
      } else if (type === "PP") {
        const current = resolveProbeCurrentValue(kind, descriptor, componentLines, getNodeVoltage);
        const vA = getNodeVoltage(descriptor?.netA);
        const vB = getNodeVoltage(descriptor?.netB);
        if (Number.isFinite(current) && Number.isFinite(vA) && Number.isFinite(vB)) {
          value = (vA - vB) * current;
        }
        unit = "W";
      }
      const display = formatMeasurementValue(value, unit);
      const label = resolveProbeMeasurementLabel(descriptor, component);
      probeLabelMap.set(component.id, label);
      measurements.push({
        id: component.id,
        label,
        value: display,
        measurementType: type === "PP"
          ? "power"
          : (type === "PI" ? "current" : "voltage"),
        isProbe: true,
        highlightTokens: buildMeasurementHighlightTokens(probeSignals),
        signalColor: resolveTraceColorForSignals(probeSignals)
      });
      inlineMap.set(component.id, display);
    });

    sortMeasurementsForDisplay(measurements);

    measurementsList.innerHTML = "";
    const probeCount = measurements.filter((entry) => entry.isProbe).length;
    clearProbesButton.hidden = probeCount === 0;
    clearProbesActionButton.disabled = probeCount === 0;
    const thead = document.createElement("thead");
    const headerRow = document.createElement("tr");
    ["Probe", "Value", "Clear"].forEach((labelText) => {
      const th = document.createElement("th");
      th.textContent = labelText;
      headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    const tbody = document.createElement("tbody");
    if (!measurements.length) {
      const emptyRow = document.createElement("tr");
      const emptyCell = document.createElement("td");
      emptyCell.className = "measurements-empty-cell";
      emptyCell.colSpan = 3;
      emptyCell.textContent = "No probes placed.";
      emptyRow.appendChild(emptyCell);
      tbody.appendChild(emptyRow);
    } else {
      measurements.forEach((entry) => {
        const row = document.createElement("tr");
        row.className = "measurement-row";
        row.dataset.measurementId = String(entry.id);
        row.dataset.measurementType = String(entry?.measurementType ?? "other");
        const highlightTokens = Array.isArray(entry?.highlightTokens) ? entry.highlightTokens : [];
        bindSignalResultRow(row, highlightTokens, {
          isSelected: () => schematicSelectionId && String(schematicSelectionId) === String(entry.id),
          onClick: (event) => {
            if (!schematicEditor) {
              return;
            }
            const additive = isAdditiveSelectionEvent(event);
            applySchematicSelectionTargets({
              componentIds: [entry.id],
              wireIds: []
            }, {
              additive,
              clearWhenEmpty: !additive
            });
          }
        });
        const labelCell = document.createElement("td");
        const rowColor = normalizeHexColor(entry?.signalColor);
        if (rowColor) {
          row.style.setProperty("--results-row-color", rowColor);
        }
        labelCell.className = "results-name-cell";
        const swatch = document.createElement("span");
        swatch.className = "results-row-swatch";
        labelCell.appendChild(swatch);
        const text = document.createElement("span");
        text.className = "measurement-row-text";
        const label = document.createElement("span");
        label.className = "measurement-row-label";
        label.textContent = uiMeasurementsDomain.formatMeasurementRowLabel(entry);
        text.appendChild(label);
        labelCell.appendChild(text);
        const valueCell = document.createElement("td");
        const value = document.createElement("span");
        value.className = "measurement-row-value";
        value.textContent = String(entry.value ?? "");
        valueCell.appendChild(value);
        const actionCell = document.createElement("td");
        if (entry.isProbe) {
          row.dataset.measurementProbe = "1";
          const removeButton = document.createElement("button");
          removeButton.type = "button";
          removeButton.className = "secondary measurement-row-remove";
          removeButton.dataset.probeRemove = String(entry.id);
          removeButton.textContent = "Remove";
          removeButton.addEventListener("click", (event) => {
            event.preventDefault();
            event.stopPropagation();
            if (!schematicEditor || typeof schematicEditor.deleteSelection !== "function") {
              return;
            }
            if (typeof schematicEditor.setSelectionWithWires === "function") {
              schematicEditor.setSelectionWithWires([entry.id], []);
            } else if (typeof schematicEditor.setSelection === "function") {
              schematicEditor.setSelection([entry.id]);
            }
            schematicEditor.deleteSelection();
          });
          actionCell.appendChild(removeButton);
        }
        row.append(labelCell, valueCell, actionCell);
        tbody.appendChild(row);
      });
    }
    measurementsList.append(thead, tbody);

    schematicMeasurements = inlineMap;
    schematicProbeLabels = probeLabelMap;

    if (schematicEditor && typeof schematicEditor.setMeasurements === "function") {
      schematicEditor.setMeasurements(inlineMap);
    }
    if (schematicEditor && typeof schematicEditor.setProbeLabels === "function") {
      schematicEditor.setProbeLabels(probeLabelMap);
    }
    refreshResultsTableHighlights();
  }

  setSchematicMode(true);
  resetSaveIndicators(true);
  refreshMeasurements();
  restoreAutosave();
  syncTraceHighlightsFromSchematicSelection();
  syncNetlistPreviewHighlightsFromSchematicSelection();

  return {
    setStatus: (status) => {
      statusEl.textContent = status;
    },
    setError: (message) => {
      const text = message ?? "";
      errorEl.textContent = text;
      errorEl.hidden = !text;
    },
    setLog: (lines) => {
      logEl.textContent = lines.join("\n");
    },
    appendLog: (line) => {
      logEl.textContent = [logEl.textContent, line].filter(Boolean).join("\n");
    },
    getNetlist: () => getActiveNetlist(),
    setNetlist: () => {
    },
    setOpResults: (results) => {
      state.opResults = results;
      lastRunKind = "op";
      syncProbeSignalDisplayLabelMap();
      renderOpResults(results);
      refreshMeasurements();
      syncTraceHighlightsFromSchematicSelection();
      queueAutosave(false);
    },
    setDcResults: (results) => {
      state.dcResults = results;
      lastRunKind = "dc";
      syncProbeSignalDisplayLabelMap();
      computePowerTraces(results);
      renderDcResults(results);
      refreshMeasurements();
      syncTraceHighlightsFromSchematicSelection();
      queueAutosave(false);
    },
    setTranResults: (results) => {
      state.tranResults = results;
      lastRunKind = "tran";
      syncProbeSignalDisplayLabelMap();
      computePowerTraces(results);
      renderTranResults(results);
      refreshMeasurements();
      syncTraceHighlightsFromSchematicSelection();
      queueAutosave(false);
    },
    setAcResults: (results) => {
      state.acResults = results;
      lastRunKind = "ac";
      syncProbeSignalDisplayLabelMap();
      renderAcResults(results);
      refreshMeasurements();
      syncTraceHighlightsFromSchematicSelection();
      queueAutosave(false);
    },
    exportCurrentDocument: (includeResults = false) => {
      const doc = buildDocumentPayload(Boolean(includeResults));
      if (!doc) {
        return null;
      }
      return {
        doc,
        json: JSON.stringify(doc, null, 2)
      };
    },
    getDefaultExampleFilename: () => getDefaultExampleJsonName(),
    setWarningMessage: (message) => {
      netlistWarnings.textContent = String(message ?? "");
    },
    refreshExamplesMenu: () => {
      setExampleEntries(readSchematicExampleEntries());
    },
    closeMenus: () => {
      closeMenuGroups();
    },
    getSchematicPanel: () => schematicPanel
  };

}

self.SpjutSimUI = {
  createUI
};
