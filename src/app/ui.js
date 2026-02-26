/** @typedef {Record<string, number[]>} TraceMap */
/** @typedef {{ status: "idle" | "loading" | "ready" | "running" | "error", log: string[], netlist: string, error?: string, opResults?: { plot?: string, nodes: { name: string, value: string, raw?: number | null }[], currents: { name: string, value: string, raw?: number | null }[] }, dcResults?: { x: number[], traces: TraceMap, signals?: string[], selected?: string[] }, tranResults?: { x: number[], traces: TraceMap, signals?: string[], selected?: string[] }, acResults?: { freq: number[], magnitude: TraceMap, phase: TraceMap, signals?: string[], selected?: string[] } }} AppState */
/** @typedef {() => void} VoidHandler */
/** @typedef {(netlist: string) => void} RunOpHandler */
/** @typedef {(netlist: string, signals?: string[]) => void} RunHandler */
/** @typedef {{ onInit: VoidHandler, onRun: RunOpHandler, onRunDc: RunHandler, onRunTran: RunHandler, onRunAc: RunHandler, onReset: VoidHandler }} UIActions */
/** @typedef {{ setStatus: (status: AppState["status"]) => void, setError: (message?: string) => void, setLog: (lines: string[]) => void, appendLog: (line: string) => void, getNetlist: () => string, setNetlist: (netlist: string) => void, setOpResults: (results?: AppState["opResults"]) => void, setDcResults: (results?: AppState["dcResults"]) => void, setTranResults: (results?: AppState["tranResults"]) => void, setAcResults: (results?: AppState["acResults"]) => void }} UIHandle */

let showGrid = false;
const ALLOWED_GRID_SIZES = Object.freeze([5, 10, 20]);
const DEFAULT_GRID_SIZE = 10;

const simulationKinds = [
  { id: "op", label: "Operating Point (.op)" },
  { id: "dc", label: "DC Sweep (.dc)" },
  { id: "tran", label: "Transient (.tran)" },
  { id: "ac", label: "AC Sweep (.ac)" }
];
const simulationKindIds = new Set(simulationKinds.map((entry) => entry.id));
const PROBE_COMPONENT_TYPES = new Set(["PV", "PI", "PD", "PP"]);
const RESULTS_PANE_MODES = new Set(["hidden", "split", "expanded"]);
const DEFAULT_RESULTS_PANE_MODE = "hidden";
const DEFAULT_RESULTS_PANE_SPLIT_RATIO = 0.5;
const MIN_RESULTS_PANE_SPLIT_RATIO = 0.25;
const MAX_RESULTS_PANE_SPLIT_RATIO = 0.75;

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
  let autoRunTimer = null;
  let autosaveTimer = null;
  let isRestoringDocument = false;
  let netlistPreamble = "";
  let netlistPreviewHighlightLinesKey = "";
  let netlistPreviewHighlightNodesKey = "";
  let netlistPreviewTextKey = "";
  let netlistSelectionLineIndexCache = null;
  let netlistSelectionLineIndexCacheSource = null;
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
    { id: "edit", label: "Edit", shortcut: "Ctrl+E" },
    { id: "delete", label: "Delete", shortcut: "Del" },
    { id: "copy", label: "Copy", shortcut: "Ctrl+C" },
    { id: "cut", label: "Cut", shortcut: "Ctrl+X" },
    { id: "paste", label: "Paste", shortcut: "Ctrl+V" },
    { divider: true, id: "edit-after-paste" },
    { id: "rotate-cw", label: "Rotate CW", shortcut: "Space" },
    { id: "rotate-ccw", label: "Rotate CCW", shortcut: "Shift+Space" },
    { id: "flip-h", label: "Flip Horizontal", shortcut: "X" },
    { id: "flip-v", label: "Flip Vertical", shortcut: "Y" },
    { divider: true, id: "edit-after-flip-v" },
    { id: "simplify-wires-selection", label: "Simplify Wires (Selection)" },
    { id: "simplify-wires-all", label: "Simplify Wires (All)" },
    { id: "regrid-selection", label: "Regrid to Current Grid (Selection)" },
    { id: "regrid-all", label: "Regrid to Current Grid (All)" },
    { divider: true, id: "edit-after-simplify" },
    { id: "undo", label: "Undo", shortcut: "Ctrl+Z" },
    { id: "redo", label: "Redo", shortcut: "Ctrl+Y" }
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
    readBooleanPreference: requirePersistenceMethod("readBooleanPreference"),
    writePreference: requirePersistenceMethod("writePreference")
  });
  const normalizeResultsPaneMode = (value) => {
    const mode = String(value ?? "").trim().toLowerCase();
    return RESULTS_PANE_MODES.has(mode) ? mode : DEFAULT_RESULTS_PANE_MODE;
  };
  const clampResultsPaneSplitRatio = (value) => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      return DEFAULT_RESULTS_PANE_SPLIT_RATIO;
    }
    return Math.min(MAX_RESULTS_PANE_SPLIT_RATIO, Math.max(MIN_RESULTS_PANE_SPLIT_RATIO, parsed));
  };
  const normalizeResultsPaneState = (stateValue) => {
    const raw = stateValue && typeof stateValue === "object" ? stateValue : {};
    return {
      mode: normalizeResultsPaneMode(raw.mode),
      splitRatio: clampResultsPaneSplitRatio(raw.splitRatio)
    };
  };
  const requireSchematicMethod = (name) => {
    const api = getSchematicApi();
    const method = api?.[name];
    if (typeof method !== "function") {
      throw new Error(`Schematic API missing '${name}'. Check src/schematic/model.js.`);
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
  const parseSpdtSwitchValue = requireSchematicMethod("parseSpdtSwitchValue");
  const buildAnalysisDirectivesForConfig = requireSchematicMethod("buildAnalysisDirectivesForConfig");

  const getTextFontOptions = () => {
    const raw = textStyleApi.getTextFontOptions();
    if (!Array.isArray(raw) || raw.length === 0) {
      throw new Error("Schematic API getTextFontOptions() returned no options.");
    }
    const normalized = raw
      .map((entry) => String(entry ?? "").trim())
      .filter((entry) => entry.length > 0);
    if (!normalized.length) {
      throw new Error("Schematic API getTextFontOptions() returned invalid options.");
    }
    return normalized;
  };

  const normalizeTextFontValue = (value) => textStyleApi.normalizeTextFont(value);
  const normalizeTextSizeValue = (value) => textStyleApi.normalizeTextSize(value);

  const getDefaultTextStyle = () => {
    const style = textStyleApi.getDefaultTextStyle();
    if (!style || typeof style !== "object") {
      throw new Error("Schematic API getDefaultTextStyle() returned invalid payload.");
    }
    return {
      font: normalizeTextFontValue(style.font),
      size: normalizeTextSizeValue(style.size),
      bold: style.bold === true,
      italic: style.italic === true,
      underline: style.underline === true
    };
  };

  const normalizeSpdtThrow = (value) =>
    String(value ?? "").trim().toUpperCase() === "B" ? "B" : "A";

  const parseSpdtSwitchValueSafe = (value) => {
    try {
      const parsed = parseSpdtSwitchValue(value);
      return {
        activeThrow: normalizeSpdtThrow(parsed?.activeThrow),
        ron: String(parsed?.ron ?? "0").trim() || "0",
        roff: parsed?.roff === null || parsed?.roff === undefined
          ? null
          : (String(parsed.roff).trim() || null),
        showRon: parsed?.showRon === true,
        showRoff: parsed?.showRoff === true
      };
    } catch {
      return {
        activeThrow: "A",
        ron: "0",
        roff: null,
        showRon: false,
        showRoff: false
      };
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

  const createNetColorPicker = ({ rowAttribute, swatchAttribute, onPick }) => {
    const row = document.createElement("label");
    row.className = "inline-edit-row schematic-net-color-row";
    if (rowAttribute) {
      row.setAttribute(rowAttribute, "1");
    }
    const label = document.createElement("span");
    label.textContent = "Color:";
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
      if (swatchAttribute) {
        button.setAttribute(swatchAttribute, color);
      }
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
        const swatchColor = normalizeNetColorValue(button.getAttribute(swatchAttribute || ""));
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

  const statusWrap = document.createElement("div");
  const statusLabel = document.createElement("span");
  statusLabel.textContent = "Status:";
  const statusEl = document.createElement("span");
  statusEl.className = "status";
  statusEl.textContent = state.status;
  const saveStatusEl = document.createElement("span");
  saveStatusEl.className = "status save-status";
  saveStatusEl.dataset.saveStatus = "1";
  statusWrap.append(statusLabel, statusEl, saveStatusEl);

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
  titleBarLeft.append(title, menuBar, fileStatus);

  const titleBarRight = document.createElement("div");
  titleBarRight.className = "title-bar-right";
  titleBarRight.append(statusWrap);

  titleBar.append(titleBarLeft, titleBarRight);

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

  const tooltip = document.createElement("div");
  tooltip.className = "tool-tooltip";
  tooltip.dataset.toolTooltip = "1";
  tooltip.style.display = "none";
  container.appendChild(tooltip);

  const showTooltipAt = (text, x, y) => {
    if (!text) {
      return;
    }
    tooltip.textContent = text;
    tooltip.style.display = "block";
    const offset = 12;
    const viewportWidth = window.innerWidth || document.documentElement.clientWidth || 0;
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;
    const tooltipRect = tooltip.getBoundingClientRect();
    const tooltipWidth = tooltipRect.width || tooltip.offsetWidth || 0;
    const tooltipHeight = tooltipRect.height || tooltip.offsetHeight || 0;
    const inset = 4;
    const mouseX = Number.isFinite(x) ? x : 0;
    const mouseY = Number.isFinite(y) ? y : 0;
    const maxLeft = Math.max(inset, viewportWidth - tooltipWidth - inset);
    const maxTop = Math.max(inset, viewportHeight - tooltipHeight - inset);
    const left = Math.min(maxLeft, Math.max(inset, mouseX + offset));
    const top = Math.min(maxTop, Math.max(inset, mouseY + offset));
    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
  };

  const hideTooltip = () => {
    tooltip.style.display = "none";
  };

  const POPOVER_VIEWPORT_MARGIN = 8;
  const POPOVER_ANCHOR_GAP = 6;
  const clampPopoverNumber = (value, min, max) => Math.min(max, Math.max(min, value));
  const positionPopoverInViewport = (popover, anchorRect, options = {}) => {
    if (!(popover instanceof HTMLElement) || !anchorRect) {
      return;
    }
    const viewportWidth = window.innerWidth || document.documentElement.clientWidth || 0;
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;
    if (!viewportWidth || !viewportHeight) {
      return;
    }
    const margin = Number.isFinite(options.margin) ? Math.max(0, options.margin) : POPOVER_VIEWPORT_MARGIN;
    const gap = Number.isFinite(options.gap) ? Math.max(0, options.gap) : POPOVER_ANCHOR_GAP;
    const align = options.align === "end" ? "end" : "start";
    const maxWidth = Math.max(120, Math.floor(viewportWidth - (margin * 2)));
    const maxHeight = Math.max(120, Math.floor(viewportHeight - (margin * 2)));

    popover.style.position = "fixed";
    popover.style.maxWidth = `${maxWidth}px`;
    popover.style.maxHeight = `${maxHeight}px`;
    popover.style.overflowY = "auto";
    popover.style.overflowX = "auto";

    // Prime the layout before final clamped placement.
    popover.style.left = `${margin}px`;
    popover.style.top = `${margin}px`;
    const rect = popover.getBoundingClientRect();
    const measuredWidth = rect.width || popover.offsetWidth || 0;
    const measuredHeight = rect.height || popover.offsetHeight || 0;

    let left = align === "end"
      ? anchorRect.right - measuredWidth
      : anchorRect.left;
    let top = anchorRect.bottom + gap;
    const aboveTop = anchorRect.top - gap - measuredHeight;
    if (top + measuredHeight > viewportHeight - margin && aboveTop >= margin) {
      top = aboveTop;
    }

    const maxLeft = Math.max(margin, viewportWidth - margin - measuredWidth);
    const maxTop = Math.max(margin, viewportHeight - margin - measuredHeight);
    left = clampPopoverNumber(left, margin, maxLeft);
    top = clampPopoverNumber(top, margin, maxTop);

    popover.style.left = `${Math.round(left)}px`;
    popover.style.top = `${Math.round(top)}px`;
  };

  const attachTooltip = (el, text) => {
    if (!el) {
      return;
    }
    const tooltipText = String(text ?? "").trim();
    if (!tooltipText) {
      el.removeAttribute("data-tooltip");
      return;
    }
    el.dataset.tooltip = tooltipText;
    if (el.dataset.tooltipBound === "1") {
      return;
    }
    el.dataset.tooltipBound = "1";
    const readTooltipText = () => String(el.dataset.tooltip ?? "").trim();
    el.addEventListener("mouseenter", (event) => {
      const currentText = readTooltipText();
      if (!currentText) {
        return;
      }
      showTooltipAt(currentText, event.clientX, event.clientY);
    });
    el.addEventListener("mousemove", (event) => {
      if (tooltip.style.display === "none") {
        return;
      }
      const currentText = readTooltipText();
      if (!currentText) {
        return;
      }
      showTooltipAt(currentText, event.clientX, event.clientY);
    });
    el.addEventListener("mouseleave", hideTooltip);
    el.addEventListener("focus", () => {
      const currentText = readTooltipText();
      if (!currentText) {
        return;
      }
      const rect = el.getBoundingClientRect();
      showTooltipAt(currentText, rect.left + rect.width / 2, rect.top);
    });
    el.addEventListener("blur", hideTooltip);
  };

  const applyCustomTooltip = (el, text) => {
    if (!el) {
      return;
    }
    // Use only shared custom tooltip behavior (no delayed native title tooltip).
    el.removeAttribute("title");
    const tooltipText = String(text ?? "").trim();
    if (!tooltipText) {
      el.removeAttribute("aria-label");
      el.removeAttribute("data-tooltip");
      return;
    }
    el.setAttribute("aria-label", tooltipText);
    attachTooltip(el, tooltipText);
  };

  const createToolIcon = (tool, isElement) => {
    const schematicApi = typeof self !== "undefined" ? self.SpjutSimSchematic : null;
    if (isElement && schematicApi && typeof schematicApi.renderSymbolIcon === "function") {
      const svg = schematicApi.renderSymbolIcon(tool, { width: 36, height: 18, stroke: "currentColor", strokeWidth: 2 });
      if (svg) {
        svg.dataset.toolIcon = tool;
        return svg;
      }
    }
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 48 24");
    svg.setAttribute("width", "36");
    svg.setAttribute("height", "18");
    svg.classList.add("tool-icon");
    svg.dataset.toolIcon = tool;
    const stroke = { stroke: "currentColor", "stroke-width": "2", fill: "none", "stroke-linecap": "round", "stroke-linejoin": "round" };
    const line = (x1, y1, x2, y2) => {
      const el = document.createElementNS(svg.namespaceURI, "line");
      el.setAttribute("x1", x1);
      el.setAttribute("y1", y1);
      el.setAttribute("x2", x2);
      el.setAttribute("y2", y2);
      Object.entries(stroke).forEach(([key, value]) => el.setAttribute(key, value));
      svg.appendChild(el);
    };
    const polyline = (points) => {
      const el = document.createElementNS(svg.namespaceURI, "polyline");
      el.setAttribute("points", points);
      Object.entries(stroke).forEach(([key, value]) => el.setAttribute(key, value));
      svg.appendChild(el);
    };
    const path = (d) => {
      const el = document.createElementNS(svg.namespaceURI, "path");
      el.setAttribute("d", d);
      Object.entries(stroke).forEach(([key, value]) => el.setAttribute(key, value));
      svg.appendChild(el);
    };
    const circle = (cx, cy, r) => {
      const el = document.createElementNS(svg.namespaceURI, "circle");
      el.setAttribute("cx", cx);
      el.setAttribute("cy", cy);
      el.setAttribute("r", r);
      Object.entries(stroke).forEach(([key, value]) => el.setAttribute(key, value));
      svg.appendChild(el);
    };
    const label = (x, y, text) => {
      const el = document.createElementNS(svg.namespaceURI, "text");
      el.setAttribute("x", x);
      el.setAttribute("y", y);
      el.setAttribute("fill", "currentColor");
      el.setAttribute("font-size", "8");
      el.setAttribute("text-anchor", "middle");
      el.setAttribute("dominant-baseline", "middle");
      el.textContent = text;
      svg.appendChild(el);
    };
    if (tool === "wire") {
      line(4, 12, 44, 12);
      return svg;
    }
    if (tool === "select") {
      path("M8 2 L21 15 L17 14 L14 22 L12 21 L13 15 L8 17 Z");
      return svg;
    }
    return null;
  };

  const createActionIcon = (action) => {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("width", "20");
    svg.setAttribute("height", "20");
    svg.classList.add("action-icon");
    svg.dataset.actionIcon = action;
    const strokeAttrs = {
      stroke: "currentColor",
      "stroke-width": "1.9",
      fill: "none",
      "stroke-linecap": "round",
      "stroke-linejoin": "round"
    };
    const line = (x1, y1, x2, y2) => {
      const el = document.createElementNS(svg.namespaceURI, "line");
      el.setAttribute("x1", String(x1));
      el.setAttribute("y1", String(y1));
      el.setAttribute("x2", String(x2));
      el.setAttribute("y2", String(y2));
      Object.entries(strokeAttrs).forEach(([key, value]) => el.setAttribute(key, value));
      svg.appendChild(el);
    };
    const polyline = (points) => {
      const el = document.createElementNS(svg.namespaceURI, "polyline");
      el.setAttribute("points", points);
      Object.entries(strokeAttrs).forEach(([key, value]) => el.setAttribute(key, value));
      svg.appendChild(el);
    };
    const path = (d) => {
      const el = document.createElementNS(svg.namespaceURI, "path");
      el.setAttribute("d", d);
      Object.entries(strokeAttrs).forEach(([key, value]) => el.setAttribute(key, value));
      svg.appendChild(el);
    };
    const rect = (x, y, width, height, rx = 0) => {
      const el = document.createElementNS(svg.namespaceURI, "rect");
      el.setAttribute("x", String(x));
      el.setAttribute("y", String(y));
      el.setAttribute("width", String(width));
      el.setAttribute("height", String(height));
      if (rx > 0) {
        el.setAttribute("rx", String(rx));
      }
      Object.entries(strokeAttrs).forEach(([key, value]) => el.setAttribute(key, value));
      svg.appendChild(el);
    };
    const polygon = (points, fill = "currentColor") => {
      const el = document.createElementNS(svg.namespaceURI, "polygon");
      el.setAttribute("points", points);
      el.setAttribute("fill", fill);
      el.setAttribute("stroke", "none");
      svg.appendChild(el);
    };
    const circle = (cx, cy, r) => {
      const el = document.createElementNS(svg.namespaceURI, "circle");
      el.setAttribute("cx", String(cx));
      el.setAttribute("cy", String(cy));
      el.setAttribute("r", String(r));
      Object.entries(strokeAttrs).forEach(([key, value]) => el.setAttribute(key, value));
      svg.appendChild(el);
    };

    switch (action) {
      case "undo":
        polyline("10 6 5 11 10 16");
        path("M6 11h8c3.5 0 5 2 5 5");
        break;
      case "redo":
        polyline("14 6 19 11 14 16");
        path("M18 11h-8c-3.5 0-5 2-5 5");
        break;
      case "run":
        polygon("8 6 18 12 8 18");
        break;
      case "export":
        path("M12 4v10");
        polyline("8 10 12 14 16 10");
        rect(5, 16, 14, 4, 1);
        break;
      case "rotate-cw":
        path("M17 8a7 7 0 1 0-2 9");
        polyline("17 4 17 8 13 8");
        break;
      case "rotate-ccw":
        path("M7 8a7 7 0 1 1 2 9");
        polyline("7 4 7 8 11 8");
        break;
      case "flip-h":
        line(12, 5, 12, 19);
        polyline("10 8 7 12 10 16");
        polyline("14 8 17 12 14 16");
        break;
      case "flip-v":
        line(5, 12, 19, 12);
        polyline("8 10 12 7 16 10");
        polyline("8 14 12 17 16 14");
        break;
      case "duplicate":
        rect(8, 8, 10, 10, 1);
        rect(5, 5, 10, 10, 1);
        break;
      case "delete":
        rect(8, 9, 8, 10, 1);
        line(7, 9, 17, 9);
        line(10, 6, 14, 6);
        line(11, 11, 11, 17);
        line(13, 11, 13, 17);
        break;
      case "clear-probes":
        path("M5 19h14");
        line(7, 15, 11, 9);
        line(11, 9, 14, 12);
        line(13, 7, 16, 10);
        line(10, 6, 14, 6);
        break;
      case "results-show":
        rect(4, 5, 16, 14, 1);
        line(12, 5, 12, 19);
        line(14.5, 10, 17.5, 10);
        line(16, 8.5, 16, 11.5);
        break;
      case "results-hide":
        rect(4, 5, 16, 14, 1);
        line(12, 5, 12, 19);
        line(14.5, 9.5, 17.5, 12.5);
        line(17.5, 9.5, 14.5, 12.5);
        break;
      case "results-expand":
        rect(4, 5, 16, 14, 1);
        line(9, 5, 9, 19);
        line(6, 12, 15, 12);
        polyline("11 9 15 12 11 15");
        break;
      case "results-split":
        rect(4, 5, 16, 14, 1);
        line(12, 5, 12, 19);
        line(8, 9, 8, 15);
        line(16, 9, 16, 15);
        break;
      case "info-view":
        circle(12, 6, 1.2);
        path("M12 10v6.4");
        path("M12 16.4c0 1.6 1 2.6 2.6 2.6");
        break;
      default:
        return null;
    }
    return svg;
  };

  const toolHelp = {
    select: {
      title: "Select",
      summary: "Select and move components or wires.",
      definition: "Click to select; drag to move; shift-click to multi-select."
    },
    wire: {
      title: "Wire",
      summary: "Draw orthogonal wires between nodes.",
      definition: "Click to start and click to finish a wire segment."
    },
    R: {
      title: "Resistor (R)",
      summary: "Limits current and drops voltage.",
      definition: "A passive element measured in ohms (Ω) that resists current flow."
    },
    C: {
      title: "Capacitor (C)",
      summary: "Stores energy in an electric field.",
      definition: "A passive element measured in farads (F) that stores charge between two nodes."
    },
    L: {
      title: "Inductor (L)",
      summary: "Stores energy in a magnetic field.",
      definition: "A passive element measured in henries (H) that opposes changes in current."
    },
    V: {
      title: "Voltage Source (V)",
      summary: "Forces a voltage between two nodes.",
      definition: "An ideal source that sets a voltage regardless of current draw."
    },
    I: {
      title: "Current Source (I)",
      summary: "Forces a current through a branch.",
      definition: "An ideal source that sets current regardless of voltage across it."
    },
    SW: {
      title: "3-Way Switch (SW)",
      summary: "SPDT switch with inline throw/Ron/Roff and label-visibility toggles.",
      definition: "Default Ron is 0 (short). Value tokens also support showron/showroff label toggles."
    },
    VM: {
      title: "Voltmeter (VM)",
      summary: "Measures voltage across two nodes.",
      definition: "A probe for observing voltage without affecting the circuit."
    },
    AM: {
      title: "Ammeter (AM)",
      summary: "Measures current through a branch.",
      definition: "A probe for observing current without affecting the circuit."
    },
    PV: {
      title: "Probe (P)",
      summary: "Click wires for voltage or component bodies for current.",
      definition: "Persistent measurement probe. Shift+click starts differential, Alt+click places power."
    },
    PD: {
      title: "Differential Probe",
      summary: "Two sequential node clicks measure V(pos,neg).",
      definition: "First click sets positive node; second click sets negative node."
    },
    PP: {
      title: "Power Probe",
      summary: "Measures component power using V*I.",
      definition: "Click a component body to place a persistent power probe."
    },
    GND: {
      title: "Ground (GND)",
      summary: "Defines the reference node (0 V).",
      definition: "The circuit reference used for all node voltages."
    },
    NET: {
      title: "Named Node (N)",
      summary: "Places a named node label for simulation traces.",
      definition: "Click a wire node to place a label and edit its name immediately."
    },
    TEXT: {
      title: "Text (T)",
      summary: "Places a non-electrical text annotation.",
      definition: "Use double-click to edit font, size, style, and color without affecting simulation."
    }
  };

  const helpEntries = {
    gridSize: {
      title: "Grid size",
      summary: "Sets the grid spacing for placement and snap.",
      definition: "Choose 5, 10, or 20 for finer or coarser spacing."
    },
    gridShow: {
      title: "Grid show",
      summary: "Toggle grid visibility.",
      definition: "Hide the grid without changing snap behavior."
    },
    undo: {
      title: "Undo (Ctrl+Z)",
      summary: "Revert the last action.",
      definition: "Step backward through edit history."
    },
    redo: {
      title: "Redo (Ctrl+Y)",
      summary: "Reapply the last undone action.",
      definition: "Step forward through edit history."
    },
    rotateCw: {
      title: "Rotate CW (Space)",
      summary: "Rotate selected components clockwise.",
      definition: "In placement mode, rotates the active preview."
    },
    rotateCcw: {
      title: "Rotate CCW (Shift+Space)",
      summary: "Rotate selected components counter-clockwise.",
      definition: "In placement mode, rotates the active preview counter-clockwise."
    },
    flipH: {
      title: "Flip H (X)",
      summary: "Flip selected components horizontally.",
      definition: "In placement mode, flips the active preview."
    },
    flipV: {
      title: "Flip V (Y)",
      summary: "Flip selected components vertically.",
      definition: "In placement mode, flips the active preview."
    },
    duplicate: {
      title: "Duplicate",
      summary: "Duplicate the current selection.",
      definition: "Starts a grayed-out placement preview. Left-click to place the copy."
    },
    delete: {
      title: "Delete (Del)",
      summary: "Remove the current selection.",
      definition: "Deletes selected components or wires."
    },
    clearProbes: {
      title: "Clear Probes",
      summary: "Remove all probe components from the schematic.",
      definition: "Deletes persistent probe objects without affecting circuit elements."
    },
    exportSvg: {
      title: "Export SVG",
      summary: "Export the schematic as SVG.",
      definition: "Creates a vector graphic of the current schematic."
    },
    exportPng: {
      title: "Export PNG",
      summary: "Export the schematic as PNG.",
      definition: "Creates a raster image of the current schematic."
    },
    exportCsvOp: {
      title: "Export CSV (OP)",
      summary: "Export operating-point results to a single CSV file.",
      definition: "Exports the tables in one file with units in the headers."
    },
    exportCsvDc: {
      title: "Export CSV (DC)",
      summary: "Export selected DC sweep signals to CSV.",
      definition: "Only selected signals are included, with units in column headers."
    },
    exportCsvTran: {
      title: "Export CSV (TRAN)",
      summary: "Export selected transient signals to CSV.",
      definition: "Only selected signals are included, with units in column headers."
    },
    exportCsvAc: {
      title: "Export CSV (AC)",
      summary: "Export selected AC signals (magnitude + phase) to CSV.",
      definition: "Only selected signals are included, with units in column headers."
    },
    simTabOp: {
      title: "DC (Operating Point)",
      summary: "View operating-point results.",
      definition: "Also selects OP (`.op`) as the active analysis for the Run Simulation button."
    },
    simTabDc: {
      title: "DC Sweep",
      summary: "View DC sweep results.",
      definition: "Also selects DC sweep (`.dc`) as the active analysis for the Run Simulation button."
    },
    simTabTran: {
      title: "Transient",
      summary: "View transient waveforms over time.",
      definition: "Also selects transient analysis (`.tran`) as the active analysis for the Run Simulation button."
    },
    simTabAc: {
      title: "AC",
      summary: "View AC magnitude and phase plots.",
      definition: "Also selects AC analysis (`.ac`) as the active analysis for the Run Simulation button."
    },
    simTabLog: {
      title: "Log",
      summary: "Inspect ngspice and app log output.",
      definition: "Use this tab to troubleshoot parse errors, warnings, and runtime issues."
    },
    runSimulation: {
      title: "Run Simulation (F5)",
      summary: "Run the currently selected analysis.",
      definition: "Compiles schematic + analysis settings into a netlist and executes it."
    },
    resetSimulation: {
      title: "Reset",
      summary: "Reset the simulator worker state.",
      definition: "Clears simulator state and re-initializes ngspice."
    },
    saveSignals: {
      title: "Save Signals",
      summary: "Optional signal filter for `.save` directives.",
      definition: "Comma-separated list such as `v(out), i(R1)`. Empty uses analysis defaults."
    },
    netlistPreamble: {
      title: "Netlist Preamble",
      summary: "Editable directives prepended to the generated netlist.",
      definition: "Use this area for global directives like `.include` or `.options`."
    },
    generatedNetlist: {
      title: "Generated Netlist",
      summary: "Preview of the netlist that will run.",
      definition: "Reflects schematic connectivity plus the currently active analysis settings. Selecting wires or circuit elements highlights matching netlist text."
    },
    copyNetlist: {
      title: "Copy Netlist",
      summary: "Copy the full generated netlist to the clipboard.",
      definition: "Copies the exact netlist text shown in the generated preview to the clipboard so it can be pasted into external tools."
    }
  };

  const applyHelpEntry = (target, entry) => {
    if (!target || !entry) {
      return;
    }
    target.dataset.schematicHelpTitle = entry.title ?? "";
    target.dataset.schematicHelpSummary = entry.summary ?? "";
    target.dataset.schematicHelpDefinition = entry.definition ?? "";
  };

  const updateFileIndicators = () => {
    const name = documentMeta.fileName || "Untitled";
    const displayName = isDirty ? `${name} *` : name;
    fileNameEl.textContent = displayName;
    fileStatus.dataset.dirty = isDirty ? "1" : "0";
  };

  const updateSaveStatus = () => {
    if (isDirty) {
      saveStatusEl.textContent = "Unsaved";
      saveStatusEl.dataset.state = "unsaved";
      return;
    }
    if (lastSavedAt) {
      saveStatusEl.textContent = "Saved";
      saveStatusEl.dataset.state = "saved";
      return;
    }
    saveStatusEl.textContent = "Not saved";
    saveStatusEl.dataset.state = "idle";
  };

  const markDocumentDirty = () => {
    isDirty = true;
    updateFileIndicators();
    updateSaveStatus();
  };

  const markDocumentSaved = () => {
    isDirty = false;
    lastSavedAt = new Date().toISOString();
    updateFileIndicators();
    updateSaveStatus();
  };

  const resetSaveIndicators = (dirty = true) => {
    isDirty = dirty;
    if (dirty) {
      lastSavedAt = "";
    }
    updateFileIndicators();
    updateSaveStatus();
  };

  const isProbeType = (type) => {
    const normalized = String(type ?? "").toUpperCase();
    if (PROBE_COMPONENT_TYPES.has(normalized)) {
      return true;
    }
    const api = getSchematicApi();
    if (!api || typeof api.isProbeComponentType !== "function") {
      return false;
    }
    return api.isProbeComponentType(normalized);
  };

  const getValueFieldMeta = (type) => {
    const normalized = String(type ?? "").toUpperCase();
    if (isProbeType(normalized)) {
      return { label: "Target", unit: "" };
    }
    if (normalized === "SW") {
      return { label: "Position", unit: "" };
    }
    if (normalized === "R" || normalized === "VM" || normalized === "AM") {
      return { label: "Resistance", unit: "Ω" };
    }
    if (normalized === "C") {
      return { label: "Capacitance", unit: "F" };
    }
    if (normalized === "L") {
      return { label: "Inductance", unit: "H" };
    }
    if (normalized === "V") {
      return { label: "Voltage", unit: "V" };
    }
    if (normalized === "I") {
      return { label: "Current", unit: "A" };
    }
    return { label: "Value", unit: "" };
  };

  const supportsComponentValueField = (type) => {
    const normalized = String(type ?? "").toUpperCase();
    return normalized !== "NET" && normalized !== "TEXT" && !isProbeType(normalized);
  };

  const exportPngPrefs = {
    scale: persistencePreferences.readNumberPreference(persistencePreferenceNames.EXPORT_PNG_SCALE, 2),
    transparent: persistencePreferences.readBooleanPreference(
      persistencePreferenceNames.EXPORT_PNG_TRANSPARENT,
      false
    )
  };
  const clampPlotFontScale = (value) => {
    if (!Number.isFinite(value) || value <= 0) {
      return 1;
    }
    return Math.min(Math.max(value, 0.6), 2);
  };
  const clampPlotLineWidth = (value) => {
    if (!Number.isFinite(value) || value <= 0) {
      return 1;
    }
    return Math.min(Math.max(Math.round(value), 1), 6);
  };
  const plotPrefs = {
    fontScale: clampPlotFontScale(
      persistencePreferences.readNumberPreference(persistencePreferenceNames.PLOT_FONT_SCALE, 1)
    ),
    lineWidth: clampPlotLineWidth(
      persistencePreferences.readNumberPreference(persistencePreferenceNames.PLOT_LINE_WIDTH, 1)
    )
  };
  const EXPORT_PADDING = 16;
  const persistExportPngPrefs = () => {
    persistencePreferences.writePreference(persistencePreferenceNames.EXPORT_PNG_SCALE, exportPngPrefs.scale);
    persistencePreferences.writePreference(
      persistencePreferenceNames.EXPORT_PNG_TRANSPARENT,
      exportPngPrefs.transparent
    );
  };
  const persistPlotPrefs = () => {
    persistencePreferences.writePreference(persistencePreferenceNames.PLOT_FONT_SCALE, plotPrefs.fontScale);
    persistencePreferences.writePreference(persistencePreferenceNames.PLOT_LINE_WIDTH, plotPrefs.lineWidth);
  };
  const getExportScale = (displayScale) => {
    const safeDisplay = Number.isFinite(displayScale) && displayScale > 0 ? displayScale : 2;
    return safeDisplay * 2;
  };

  const schematicToolButtons = [
    { tool: "select", label: "Select" },
    { tool: "wire", label: "Wire" },
    { tool: "R", label: "R", name: "Resistor", isElement: true },
    { tool: "C", label: "C", name: "Capacitor", isElement: true },
    { tool: "L", label: "L", name: "Inductor", isElement: true },
    { tool: "V", label: "V", name: "Voltage Source", isElement: true },
    { tool: "I", label: "I", name: "Current Source", isElement: true },
    { tool: "SW", label: "3W", name: "3-Way Switch", isElement: true, shortcut: "3" },
    { tool: "VM", label: "VM", name: "Voltmeter", isElement: true },
    { tool: "AM", label: "AM", name: "Ammeter", isElement: true },
    { tool: "PV", label: "P", name: "Probe", isElement: true, shortcut: "P" },
    { tool: "GND", label: "GND", name: "Ground", isElement: true },
    { tool: "NET", label: "NET", name: "Named Node", isElement: true },
    { tool: "TEXT", label: "TEXT", name: "Text", isElement: true }
  ].map((entry) => {
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
    const shortcut = entry.shortcut ?? (entry.tool === "select"
      ? "S"
      : entry.tool === "wire"
        ? "W"
        : entry.tool === "GND"
          ? "G"
          : entry.tool === "NET"
            ? "N"
            : entry.tool === "TEXT"
              ? "T"
          : entry.label ?? (entry.tool ?? ""));
    const toolName = entry.name ?? entry.label;
    button.setAttribute("aria-label", toolName);
    const tooltipText = shortcut ? `${toolName} (${shortcut})` : toolName;
    attachTooltip(button, tooltipText);
    if (entry.isElement) {
      button.dataset.schematicElementTool = "1";
      button.dataset.schematicToolLabel = entry.label.toLowerCase();
      button.dataset.schematicToolName = String(entry.name ?? entry.label).toLowerCase();
      const help = toolHelp[entry.tool];
      if (help) {
        button.dataset.schematicHelpTitle = help.title;
        button.dataset.schematicHelpSummary = help.summary;
        button.dataset.schematicHelpDefinition = help.definition;
      }
    }
    const extraHelp = toolHelp[entry.tool];
    if (extraHelp) {
      button.dataset.schematicHelpTitle = extraHelp.title;
      button.dataset.schematicHelpSummary = extraHelp.summary;
      button.dataset.schematicHelpDefinition = extraHelp.definition;
    }
    return button;
  });
  const elementToolButtons = schematicToolButtons.filter((button) => button.dataset.schematicElementTool === "1");

  const helpPanel = document.createElement("div");
  helpPanel.className = "schematic-help-panel workspace-help-panel";
  helpPanel.dataset.schematicHelpPanel = "1";
  const helpTitle = document.createElement("div");
  helpTitle.className = "schematic-help-title";
  helpTitle.dataset.schematicHelpPanelTitle = "1";
  const helpBody = document.createElement("div");
  helpBody.className = "schematic-help-body";
  helpBody.dataset.schematicHelpPanelBody = "1";
  helpPanel.append(helpTitle, helpBody);

  const schematicGridLabel = document.createElement("span");
  schematicGridLabel.className = "schematic-status-label";
  schematicGridLabel.textContent = "Grid:";

  const normalizeGridSize = (value) => {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) {
      return DEFAULT_GRID_SIZE;
    }
    if (ALLOWED_GRID_SIZES.includes(numeric)) {
      return numeric;
    }
    const nearest = ALLOWED_GRID_SIZES.reduce((best, candidate) =>
      Math.abs(candidate - numeric) < Math.abs(best - numeric) ? candidate : best,
    ALLOWED_GRID_SIZES[0]);
    return nearest;
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

  const gridVisibleLabel = document.createElement("label");
  gridVisibleLabel.className = "schematic-toggle";
  const gridVisibleCheck = document.createElement("input");
  gridVisibleCheck.type = "checkbox";
  gridVisibleCheck.checked = schematicGrid.visible;
  gridVisibleCheck.dataset.schematicGrid = "1";
  gridVisibleLabel.dataset.schematicHelpTitle = helpEntries.gridShow.title;
  gridVisibleLabel.dataset.schematicHelpSummary = helpEntries.gridShow.summary;
  gridVisibleLabel.dataset.schematicHelpDefinition = helpEntries.gridShow.definition;
  gridVisibleLabel.append(gridVisibleCheck, " Show");

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
  deleteActionButton.dataset.schematicHelpTitle = helpEntries.delete.title;
  deleteActionButton.dataset.schematicHelpSummary = helpEntries.delete.summary;
  deleteActionButton.dataset.schematicHelpDefinition = helpEntries.delete.definition;
  const clearProbesActionButton = document.createElement("button");
  clearProbesActionButton.className = "secondary icon-button schematic-action-button";
  clearProbesActionButton.dataset.schematicAction = "clear-probes";
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
  applyActionButtonIcon(undoActionButton, "undo", "Undo (Ctrl+Z)");
  applyActionButtonIcon(redoActionButton, "redo", "Redo (Ctrl+Y)");
  applyActionButtonIcon(runActionButton, "run", "Run (F5)");
  applyActionButtonIcon(exportActionButton, "export", "Export");
  applyActionButtonIcon(rotateCwButton, "rotate-cw", "Rotate CW (Space)");
  applyActionButtonIcon(rotateCcwButton, "rotate-ccw", "Rotate CCW (Shift+Space)");
  applyActionButtonIcon(flipHButton, "flip-h", "Flip H (X)");
  applyActionButtonIcon(flipVButton, "flip-v", "Flip V (Y)");
  applyActionButtonIcon(duplicateActionButton, "duplicate", "Duplicate");
  applyActionButtonIcon(deleteActionButton, "delete", "Delete (Del)");
  applyActionButtonIcon(clearProbesActionButton, "clear-probes", "Clear Probes");

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
    schematicGridLabel,
    gridSizeInput,
    gridVisibleLabel
  );

  const schematicCanvasWrap = document.createElement("div");
  schematicCanvasWrap.className = "schematic-canvas";

  const schematicSimulation = document.createElement("div");
  schematicSimulation.className = "schematic-simulation";

  const simulationHeader = document.createElement("div");
  simulationHeader.className = "schematic-simulation-header";
  const schematicRunButton = document.createElement("button");
  schematicRunButton.type = "button";
  schematicRunButton.className = "secondary";
  schematicRunButton.textContent = "Run Simulation";
  schematicRunButton.dataset.schematicAnalysisAction = "run";
  applyHelpEntry(schematicRunButton, helpEntries.runSimulation);
  resetButton.dataset.schematicAnalysisAction = "reset";
  applyHelpEntry(resetButton, helpEntries.resetSimulation);
  simulationHeader.append(schematicRunButton, resetButton);

  const configContainer = document.createElement("div");
  configContainer.className = "schematic-configs";
  const configSections = {};
  simulationKinds.forEach((entry) => {
    const section = document.createElement("div");
    section.className = "schematic-config-section";
    section.dataset.kind = entry.id;
    const heading = document.createElement("div");
    heading.className = "schematic-config-title";
    heading.textContent = entry.label;
    if (entry.id === "op") {
      applyHelpEntry(heading, helpEntries.simTabOp);
    } else if (entry.id === "dc") {
      applyHelpEntry(heading, helpEntries.simTabDc);
    } else if (entry.id === "tran") {
      applyHelpEntry(heading, helpEntries.simTabTran);
    } else if (entry.id === "ac") {
      applyHelpEntry(heading, helpEntries.simTabAc);
    }
    section.appendChild(heading);
    configContainer.appendChild(section);
    configSections[entry.id] = section;
  });
  const configInputs = { dc: {}, tran: {}, ac: {} };
  const configHelpMap = {
    "dc:source": {
      title: "DC Sweep Source",
      summary: "Independent source to sweep during `.dc` analysis.",
      definition: "Use a source name such as `V1` or `I1`."
    },
    "dc:start": {
      title: "DC Start Value",
      summary: "Starting value for the DC sweep.",
      definition: "Used as the first sweep point in the generated `.dc` directive."
    },
    "dc:stop": {
      title: "DC Stop Value",
      summary: "Ending value for the DC sweep.",
      definition: "Used as the final sweep point in the generated `.dc` directive."
    },
    "dc:step": {
      title: "DC Step Value",
      summary: "Increment between sweep points.",
      definition: "Controls DC sweep resolution and point count."
    },
    "tran:source": {
      title: "Transient Source",
      summary: "Source to override for transient runs.",
      definition: "Matches an independent source id in the compiled netlist, typically `V1`."
    },
    "tran:sourceMode": {
      title: "Transient Waveform",
      summary: "Waveform builder mode for transient source override.",
      definition: "Select Pulse, DC, Sine, PWL, or Custom value."
    },
    "tran:sourceValue": {
      title: "Transient Source Preview",
      summary: "Resolved source value used in the generated netlist.",
      definition: "Read-only preview assembled from waveform controls."
    },
    "tran:step": {
      title: "Transient Step",
      summary: "Suggested output time step.",
      definition: "First argument of `.tran` and affects waveform sample density."
    },
    "tran:stop": {
      title: "Transient Stop Time",
      summary: "Simulation stop time for transient analysis.",
      definition: "Second argument of `.tran`."
    },
    "tran:start": {
      title: "Transient Start Time",
      summary: "Optional start time for waveform output.",
      definition: "Third `.tran` argument; default is 0."
    },
    "tran:maxStep": {
      title: "Transient Max Step",
      summary: "Optional maximum internal timestep.",
      definition: "Fourth `.tran` argument for tighter accuracy control."
    },
    "ac:sweep": {
      title: "AC Sweep Mode",
      summary: "Frequency spacing mode for AC analysis.",
      definition: "LIN, DEC, or OCT in the generated `.ac` directive."
    },
    "ac:source": {
      title: "AC Source",
      summary: "Source to override for AC runs.",
      definition: "Matches an independent source id in the compiled netlist, typically `V1`."
    },
    "ac:sourceValue": {
      title: "AC Source Value",
      summary: "Value string applied to the selected AC source.",
      definition: "Typically `ac 1` to define small-signal magnitude."
    },
    "ac:points": {
      title: "AC Points",
      summary: "Points per decade/octave/linear step.",
      definition: "Second argument of `.ac` after sweep mode."
    },
    "ac:start": {
      title: "AC Start Frequency",
      summary: "Start frequency for AC sweep.",
      definition: "Third argument of `.ac`."
    },
    "ac:stop": {
      title: "AC Stop Frequency",
      summary: "Stop frequency for AC sweep.",
      definition: "Fourth argument of `.ac`."
    }
  };
  const getConfigHelpEntry = (kind, key, labelText) => {
    const mapped = configHelpMap[`${kind}:${key}`];
    if (mapped) {
      return mapped;
    }
    return {
      title: labelText,
      summary: `Configure ${labelText.toLowerCase()} for ${kind.toUpperCase()} analysis.`,
      definition: "This value is written directly into the generated analysis directives."
    };
  };

  const createConfigField = (kind, key, labelText, placeholder, options = {}) => {
    const row = document.createElement("div");
    row.className = "schematic-config-row";
    const fieldLabel = document.createElement("label");
    fieldLabel.textContent = labelText;
    const isTextarea = options.tag === "textarea";
    const input = document.createElement(isTextarea ? "textarea" : "input");
    if (!isTextarea) {
      input.type = options.type ?? "text";
    } else if (Number.isFinite(options.rows)) {
      input.rows = options.rows;
    }
    if (options.className) {
      input.classList.add(options.className);
    }
    input.value = simulationConfig[kind][key] ?? "";
    input.placeholder = placeholder;
    input.dataset.schematicConfig = `${kind}:${key}`;
    if (options.readOnly) {
      input.readOnly = true;
    }
    const helpEntry = options.help ?? getConfigHelpEntry(kind, key, labelText);
    applyHelpEntry(fieldLabel, helpEntry);
    applyHelpEntry(input, helpEntry);
    const eventName = options.event ?? "input";
    input.addEventListener(eventName, () => {
      simulationConfig[kind][key] = input.value;
      if (typeof options.onInput === "function") {
        options.onInput(input.value);
      } else {
        refreshSchematicNetlist();
      }
      queueAutosave();
    });
    row.append(fieldLabel, input);
    const parent = options.parent ?? configSections[kind];
    parent.appendChild(row);
    configInputs[kind] = configInputs[kind] ?? {};
    configInputs[kind][key] = input;
    return input;
  };

  const tranWaveGroups = {};

  const trimToken = (value) => String(value ?? "").trim();

  const buildSpiceFunction = (name, values, minCount) => {
    const tokens = values.map(trimToken);
    while (tokens.length && !tokens[tokens.length - 1]) {
      tokens.pop();
    }
    if (tokens.length < minCount) {
      return "";
    }
    return `${name}(${tokens.join(" ")})`;
  };

  const buildPwlValue = (raw) => {
    const lines = String(raw ?? "").split(/\r?\n/);
    const tokens = [];
    lines.forEach((line) => {
      const parts = line.trim().split(/[\s,]+/).filter(Boolean);
      if (parts.length >= 2) {
        tokens.push(parts[0], parts[1]);
      }
    });
    if (tokens.length < 2) {
      return "";
    }
    return `pwl(${tokens.join(" ")})`;
  };

  const buildTranSourceValue = () => {
    const tran = simulationConfig.tran;
    const mode = String(tran.sourceMode ?? "custom").toLowerCase();
    switch (mode) {
      case "dc":
        return trimToken(tran.dcValue);
      case "pulse":
        return buildSpiceFunction("pulse", [
          tran.pulseLow,
          tran.pulseHigh,
          tran.pulseDelay,
          tran.pulseRise,
          tran.pulseFall,
          tran.pulseWidth,
          tran.pulsePeriod
        ], 2);
      case "sine":
        return buildSpiceFunction("sin", [
          tran.sineOffset,
          tran.sineAmplitude,
          tran.sineFreq,
          tran.sineDelay,
          tran.sineDamping,
          tran.sinePhase
        ], 3);
      case "pwl":
        return buildPwlValue(tran.pwlPoints);
      case "custom":
        return trimToken(tran.customValue);
      default:
        return trimToken(tran.sourceValue);
    }
  };

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

  const updateTranWaveformVisibility = () => {
    const active = String(simulationConfig.tran.sourceMode ?? "custom").toLowerCase();
    Object.entries(tranWaveGroups).forEach(([mode, group]) => {
      group.hidden = mode !== active;
    });
  };

  const opNote = document.createElement("p");
  opNote.className = "schematic-config-note";
  opNote.textContent = "Running OP will append a single `.op` command to the compiled circuit.";
  applyHelpEntry(opNote, {
    title: "Operating Point Analysis",
    summary: "Runs a DC operating point solve (`.op`).",
    definition: "Reports node voltages and source currents with no sweep or time-domain stepping."
  });
  configSections.op.append(opNote);

  createConfigField("dc", "source", "Sweep source", "V1");
  createConfigField("dc", "start", "Start value", "0");
  createConfigField("dc", "stop", "Stop value", "10");
  createConfigField("dc", "step", "Step value", "1");

  createConfigField("tran", "source", "Source", "V1");
  const tranWaveRow = document.createElement("div");
  tranWaveRow.className = "schematic-config-row";
  const tranWaveLabel = document.createElement("label");
  tranWaveLabel.textContent = "Waveform";
  const tranWaveSelect = document.createElement("select");
  [
    { id: "pulse", label: "Pulse" },
    { id: "dc", label: "DC" },
    { id: "sine", label: "Sine" },
    { id: "pwl", label: "PWL" },
    { id: "custom", label: "Custom" }
  ].forEach((entry) => {
    const option = document.createElement("option");
    option.value = entry.id;
    option.textContent = entry.label;
    tranWaveSelect.appendChild(option);
  });
  tranWaveSelect.value = simulationConfig.tran.sourceMode;
  tranWaveSelect.dataset.schematicConfig = "tran:sourceMode";
  applyHelpEntry(tranWaveLabel, configHelpMap["tran:sourceMode"]);
  applyHelpEntry(tranWaveSelect, configHelpMap["tran:sourceMode"]);
  tranWaveSelect.addEventListener("change", () => {
    simulationConfig.tran.sourceMode = tranWaveSelect.value;
    updateTranWaveformVisibility();
    refreshTranSource();
    queueAutosave();
  });
  tranWaveRow.append(tranWaveLabel, tranWaveSelect);
  configSections.tran.appendChild(tranWaveRow);
  configInputs.tran.sourceMode = tranWaveSelect;

  const createTranGroup = (mode) => {
    const group = document.createElement("div");
    group.className = "schematic-config-group";
    group.dataset.tranWaveform = mode;
    tranWaveGroups[mode] = group;
    configSections.tran.appendChild(group);
    return group;
  };

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

  const sweepRow = document.createElement("div");
  sweepRow.className = "schematic-config-row";
  const sweepLabel = document.createElement("label");
  sweepLabel.textContent = "AC sweep";
  const sweepSelect = document.createElement("select");
  ["lin", "dec", "oct"].forEach((optionValue) => {
    const option = document.createElement("option");
    option.value = optionValue;
    option.textContent = optionValue.toUpperCase();
    sweepSelect.appendChild(option);
  });
  sweepSelect.value = simulationConfig.ac.sweep;
  sweepSelect.dataset.schematicConfig = "ac:sweep";
  applyHelpEntry(sweepLabel, configHelpMap["ac:sweep"]);
  applyHelpEntry(sweepSelect, configHelpMap["ac:sweep"]);
  sweepSelect.addEventListener("change", () => {
    simulationConfig.ac.sweep = sweepSelect.value;
    refreshSchematicNetlist();
    queueAutosave();
  });
  sweepRow.append(sweepLabel, sweepSelect);
  configSections.ac.appendChild(sweepRow);
  configInputs.ac.sweep = sweepSelect;

  createConfigField("ac", "source", "Source", "V1");
  createConfigField("ac", "sourceValue", "Source value", "ac 1");
  createConfigField("ac", "points", "Points per decade", "10");
  createConfigField("ac", "start", "Start freq", "1");
  createConfigField("ac", "stop", "Stop freq", "100k");

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
    const query = toolFilterInput.value.trim().toLowerCase();
    elementToolButtons.forEach((button) => {
      const label = button.dataset.schematicToolLabel ?? "";
      const name = button.dataset.schematicToolName ?? "";
      button.hidden = Boolean(query) && !label.includes(query) && !name.includes(query);
    });
  });

  let helpEnabled = true;
  let workspaceHelpToggleButton = null;
  let selectedHelpTarget = null;
  const updateHelpMenuLabel = () => {
    const menuItem = document.querySelector("[data-menu-action=\"toggle-help\"]");
    if (menuItem) {
      menuItem.textContent = helpEnabled ? "Info View: On" : "Info View: Off";
    }
  };
  const updateWorkspaceHelpToggleState = () => {
    if (!(workspaceHelpToggleButton instanceof HTMLButtonElement)) {
      return;
    }
    workspaceHelpToggleButton.classList.toggle("active", helpEnabled);
    workspaceHelpToggleButton.setAttribute("aria-pressed", helpEnabled ? "true" : "false");
  };
  const updateHelpOffset = () => {
    return;
  };
  const updateHelpPanelVisibility = () => {
    if (!helpEnabled) {
      helpPanel.hidden = true;
      workspaceHelp.hidden = true;
      updateHelpOffset();
      return;
    }
    helpPanel.hidden = false;
    workspaceHelp.hidden = false;
    updateHelpOffset();
  };
  const setHelpEnabled = (next) => {
    helpEnabled = Boolean(next);
    updateHelpMenuLabel();
    updateWorkspaceHelpToggleState();
    updateHelpPanelVisibility();
  };
  const toggleHelpEnabled = () => {
    setHelpEnabled(!helpEnabled);
  };
  const setHelpPanel = (target) => {
    if (!target) {
      helpTitle.textContent = "Info View";
      helpBody.textContent = "Hover or select a tool or control to see details.";
      updateHelpOffset();
      return;
    }
    const title = target.dataset.schematicHelpTitle;
    const summary = target.dataset.schematicHelpSummary;
    const definition = target.dataset.schematicHelpDefinition;
    if (!title && !summary && !definition) {
      return;
    }
    helpTitle.textContent = title ?? "Tool help";
    helpBody.textContent = [summary, definition].filter(Boolean).join(" ");
    updateHelpOffset();
  };
  setHelpPanel(null);

  const registerHelpTarget = (target) => {
    if (!target) {
      return;
    }
    if (target.dataset.schematicHelpRegistered === "1") {
      return;
    }
    target.dataset.schematicHelpRegistered = "1";
    const updateHelp = () => {
      if (!helpEnabled) {
        return;
      }
      setHelpPanel(target);
    };
    target.addEventListener("mouseenter", updateHelp);
    target.addEventListener("mouseover", updateHelp);
    target.addEventListener("focus", updateHelp);
    target.addEventListener("mouseleave", () => {
      if (!helpEnabled) {
        return;
      }
      if (selectedHelpTarget && selectedHelpTarget !== target) {
        setHelpPanel(selectedHelpTarget);
      }
    });
  };
  const registerAllHelpTargets = (root) => {
    if (!root) {
      return;
    }
    root.querySelectorAll("[data-schematic-help-title]").forEach((target) => {
      registerHelpTarget(target);
    });
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
  const analysisToolsPanel = document.createElement("div");
  analysisToolsPanel.className = "workspace-tools-panel workspace-tools-panel-analysis";
  analysisToolsPanel.dataset.workspaceToolsPanel = "analysis";
  analysisToolsPanel.hidden = true;
  schematicSimulation.hidden = true;
  const schematicMain = document.createElement("div");
  schematicMain.className = "workspace-main";
  schematicToolsPanel.append(schematicControls);
  analysisToolsPanel.append(schematicSimulation);
  schematicTools.append(schematicToolsPanel, analysisToolsPanel);
  schematicMain.append(schematicStatusBar);
  schematicWorkspace.append(schematicTools, schematicMain);
  schematicPanel.append(schematicWorkspace);

  const errorEl = document.createElement("div");
  errorEl.className = "section";

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
  const snapPlotOption = (value, options, fallback) => {
    if (!options.length) {
      return fallback;
    }
    let best = options[0];
    let bestDelta = Math.abs(value - best);
    options.forEach((option) => {
      const delta = Math.abs(value - option);
      if (delta < bestDelta) {
        best = option;
        bestDelta = delta;
      }
    });
    return best;
  };
  const normalizePlotFontScale = (value) => snapPlotOption(
    clampPlotFontScale(value),
    plotFontOptions.map((option) => option.value),
    1
  );
  const normalizePlotLineWidth = (value) => snapPlotOption(
    clampPlotLineWidth(value),
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
  const syncPlotStyleControls = () => {
    const fontValue = String(plotPrefs.fontScale);
    const lineValue = String(plotPrefs.lineWidth);
    plotFontSelects.forEach((select) => {
      if (select.value !== fontValue) {
        select.value = fontValue;
      }
    });
    plotLineSelects.forEach((select) => {
      if (select.value !== lineValue) {
        select.value = lineValue;
      }
    });
  };
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
  const createPlotStyleControls = () => {
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
    syncPlotStyleControls();
    return { fontLabel, lineLabel };
  };

  const createPlotSettingsPopover = (kind, contentNodes) => {
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

  const createPlotCanvasBundle = (plotKind, tooltipKind = plotKind, width = 720, height = 320) => {
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

  const createSinglePlotSection = (options) => {
    const section = document.createElement("div");
    section.className = "section";
    const meta = document.createElement("div");
    meta.className = `results-meta ${options.metaClass}`;

    const controls = document.createElement("div");
    controls.className = "controls analysis-controls";

    const gridLabel = document.createElement("label");
    gridLabel.className = "analysis-grid-toggle";
    const gridCheck = document.createElement("input");
    gridCheck.type = "checkbox";
    gridCheck.checked = showGrid;
    gridCheck.addEventListener("change", () => {
      showGrid = gridCheck.checked;
      options.onGridChange();
      queueAutosave();
    });
    gridLabel.append(gridCheck, " Show Grid");

    const signalLabel = document.createElement("span");
    signalLabel.textContent = "Signals: ";
    const signalSelect = document.createElement("select");
    signalSelect.className = "sample-select analysis-signal-select";
    signalSelect.multiple = true;
    signalSelect.size = 4;
    signalSelect.dataset.signalSelect = options.kind;
    signalSelect.addEventListener("change", () => {
      const selected = dedupeSignalList(getSelectedSignals(signalSelect));
      if (!selected.length) {
        return;
      }
      setActiveTab(options.kind);
      options.onSignalChange(selected);
    });

    const plotStyle = createPlotStyleControls();
    const plotSettings = createPlotSettingsPopover(options.kind, [
      gridLabel,
      plotStyle.fontLabel,
      plotStyle.lineLabel
    ]);
    const exportButton = document.createElement("button");
    exportButton.className = "secondary";
    exportButton.textContent = "Export PNG";
    exportButton.dataset.exportPlot = options.kind;
    const exportCsvButton = document.createElement("button");
    exportCsvButton.className = "secondary";
    exportCsvButton.textContent = "Export CSV";
    exportCsvButton.dataset.exportCsv = options.kind;
    applyHelpEntry(exportCsvButton, options.exportCsvHelp);

    controls.append(
      signalLabel,
      signalSelect,
      plotSettings.wrap,
      exportButton,
      exportCsvButton
    );

    const plotBundle = createPlotCanvasBundle(options.kind);
    section.append(controls, meta, plotBundle.wrap);

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
      tooltip: plotBundle.tooltip
    };
  };

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
    tooltip: dcTooltip
  } = dcPlotSection;

  const tranPlotSection = createSinglePlotSection({
    kind: "tran",
    metaClass: "tran-meta",
    exportCsvHelp: helpEntries.exportCsvTran,
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
    tooltip: tranTooltip
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
  const signalLabelA = document.createElement("span");
  signalLabelA.textContent = "Signals: ";
  const signalSelectA = document.createElement("select");
  signalSelectA.className = "sample-select analysis-signal-select";
  signalSelectA.multiple = true;
  signalSelectA.size = 4;
  signalSelectA.dataset.signalSelect = "ac";
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
    signalLabelA,
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
      selectedHelpTarget = button;
      if (helpEnabled) {
        setHelpPanel(button);
      }
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
  resultsPaneLayout.append(schematicCanvasPane, resultsPaneDivider, resultsPaneContent);
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
  toolsWorkspaceTab.className = "workspace-tab active";
  toolsWorkspaceTab.textContent = "Tools";
  toolsWorkspaceTab.dataset.workspaceTab = "schematic";
  toolsWorkspaceTab.setAttribute("aria-selected", "true");
  const analysisWorkspaceTab = document.createElement("button");
  analysisWorkspaceTab.type = "button";
  analysisWorkspaceTab.className = "workspace-tab";
  analysisWorkspaceTab.textContent = "Analysis";
  analysisWorkspaceTab.dataset.workspaceTab = "analysis";
  analysisWorkspaceTab.setAttribute("aria-selected", "false");
  const setWorkspaceToolsTab = (tabId) => {
    const nextTab = tabId === "analysis" ? "analysis" : "schematic";
    const isToolsActive = nextTab === "schematic";
    toolsWorkspaceTab.classList.toggle("active", isToolsActive);
    toolsWorkspaceTab.setAttribute("aria-selected", isToolsActive ? "true" : "false");
    analysisWorkspaceTab.classList.toggle("active", !isToolsActive);
    analysisWorkspaceTab.setAttribute("aria-selected", !isToolsActive ? "true" : "false");
    schematicToolsPanel.hidden = !isToolsActive;
    analysisToolsPanel.hidden = isToolsActive;
    schematicControls.hidden = !isToolsActive;
    schematicSimulation.hidden = isToolsActive;
    updateHelpOffset();
  };
  toolsWorkspaceTab.addEventListener("click", () => {
    setWorkspaceToolsTab("schematic");
  });
  analysisWorkspaceTab.addEventListener("click", () => {
    setWorkspaceToolsTab("analysis");
  });
  workspaceHelpToggleButton = document.createElement("button");
  workspaceHelpToggleButton.type = "button";
  workspaceHelpToggleButton.className = "secondary icon-button workspace-help-toggle";
  workspaceHelpToggleButton.dataset.workspaceHelpToggle = "1";
  applyActionButtonIcon(workspaceHelpToggleButton, "info-view", "Info View");
  workspaceHelpToggleButton.addEventListener("click", () => {
    toggleHelpEnabled();
  });
  workspaceTabs.append(toolsWorkspaceTab, analysisWorkspaceTab, workspaceHelpToggleButton);
  updateWorkspaceHelpToggleState();
  const workspaceHeaderCommand = document.createElement("div");
  workspaceHeaderCommand.className = "workspace-header-command";
  workspaceHeaderCommand.dataset.workspaceHeaderCommand = "1";
  const resultsPaneActions = document.createElement("div");
  resultsPaneActions.className = "results-pane-actions";
  const createResultsPaneActionButton = (actionId) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "secondary icon-button results-pane-action";
    button.dataset.resultsPaneAction = actionId;
    return button;
  };
  const toggleResultsPaneVisibilityButton = createResultsPaneActionButton("visibility");
  const toggleResultsPaneLayoutButton = createResultsPaneActionButton("layout");
  resultsPaneActions.append(toggleResultsPaneLayoutButton, toggleResultsPaneVisibilityButton);
  workspaceHeaderCommand.append(schematicCommandBar, resultsPaneActions);
  const workspacePanels = document.createElement("div");
  workspacePanels.className = "workspace-panels";
  workspacePanels.append(schematicPanel);
  const workspaceHelp = document.createElement("div");
  workspaceHelp.className = "workspace-help";
  workspaceHelp.dataset.workspaceHelp = "1";
  const workspaceHelpSpacer = document.createElement("div");
  workspaceHelpSpacer.className = "workspace-help-spacer";
  workspaceHelp.append(helpPanel, workspaceHelpSpacer);
  schematicWorkspace.append(workspaceHelp);

  let resultsPaneLastVisibleMode = resultsPaneState.mode === "expanded" ? "expanded" : "split";

  applyResultsPaneState = (options = {}) => {
    if (!resultsPaneLayout) {
      return;
    }
    const normalized = normalizeResultsPaneState(resultsPaneState);
    resultsPaneState = normalized;
    const mode = normalized.mode;
    resultsPaneLayout.dataset.resultsPaneMode = mode;
    resultsPaneLayout.style.setProperty("--results-pane-split-ratio", String(normalized.splitRatio));
    if (workspace) {
      workspace.dataset.resultsPaneMode = mode;
    }
    if (mode !== "hidden") {
      resultsPaneLastVisibleMode = mode === "expanded" ? "expanded" : "split";
    }
    const isHidden = mode === "hidden";
    const isExpanded = mode === "expanded";
    const visibilityTooltip = isHidden ? "Show Results" : "Hide Results";
    const visibilityIcon = isHidden ? "results-show" : "results-hide";
    applyActionButtonIcon(toggleResultsPaneVisibilityButton, visibilityIcon, visibilityTooltip);
    toggleResultsPaneVisibilityButton.classList.toggle("active", !isHidden);
    toggleResultsPaneVisibilityButton.setAttribute("aria-pressed", isHidden ? "false" : "true");

    const layoutTooltip = isExpanded ? "Docked Results" : "Full Results";
    const layoutIcon = isExpanded ? "results-split" : "results-expand";
    applyActionButtonIcon(toggleResultsPaneLayoutButton, layoutIcon, layoutTooltip);
    toggleResultsPaneLayoutButton.disabled = isHidden;
    toggleResultsPaneLayoutButton.classList.toggle("active", isExpanded);
    toggleResultsPaneLayoutButton.setAttribute("aria-pressed", isExpanded ? "true" : "false");
    toggleResultsPaneLayoutButton.setAttribute("aria-disabled", isHidden ? "true" : "false");
    const skipResize = options.skipResize === true;
    if (!skipResize && mode !== "hidden") {
      queuePlotResize();
    }
  };

  setResultsPaneMode = (mode, options = {}) => {
    const nextMode = normalizeResultsPaneMode(mode);
    const changed = resultsPaneState.mode !== nextMode;
    resultsPaneState = {
      ...resultsPaneState,
      mode: nextMode
    };
    applyResultsPaneState();
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
      setResultsPaneMode("split");
      return;
    }
    queuePlotResize();
  };

  toggleResultsPaneVisibilityButton.addEventListener("click", () => {
    if (resultsPaneState.mode === "hidden") {
      setResultsPaneMode(resultsPaneLastVisibleMode);
      return;
    }
    setResultsPaneMode("hidden");
  });
  toggleResultsPaneLayoutButton.addEventListener("click", () => {
    if (resultsPaneState.mode === "hidden") {
      return;
    }
    if (resultsPaneState.mode === "expanded") {
      setResultsPaneMode("split");
      return;
    }
    setResultsPaneMode("expanded");
  });

  const clampNumber = (value, min, max) => {
    if (!Number.isFinite(value)) {
      return min;
    }
    return Math.min(max, Math.max(min, value));
  };

  const readResultsPaneDividerSize = () => {
    if (!resultsPaneLayout) {
      return 0;
    }
    const computed = window.getComputedStyle(resultsPaneLayout);
    const cssSize = Number.parseFloat(String(computed.getPropertyValue("--results-pane-divider-size") ?? "").trim());
    if (Number.isFinite(cssSize) && cssSize >= 0) {
      return cssSize;
    }
    const dividerRect = resultsPaneDivider?.getBoundingClientRect?.();
    const rectSize = Number(dividerRect?.width);
    if (Number.isFinite(rectSize) && rectSize >= 0) {
      return rectSize;
    }
    return 10;
  };

  const resolveResultsPaneDragTarget = (clientX) => {
    if (!resultsPaneLayout) {
      return null;
    }
    const rect = resultsPaneLayout.getBoundingClientRect();
    const layoutWidth = Number(rect?.width);
    if (!Number.isFinite(layoutWidth) || layoutWidth <= 0) {
      return null;
    }
    const dividerSize = clampNumber(readResultsPaneDividerSize(), 0, layoutWidth);
    const availableWidth = Math.max(1, layoutWidth - dividerSize);
    const relativeCenterX = clampNumber(clientX - rect.left, 0, layoutWidth);
    const leftWidth = clampNumber(relativeCenterX - (dividerSize / 2), 0, availableWidth);
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
    const target = resolveResultsPaneDragTarget(event.clientX);
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
  setWorkspaceToolsTab("schematic");
  applyResultsPaneState({ skipResize: true });

  container.append(titleBar, workspace);
  window.addEventListener("resize", updateHelpOffset);

  const formatRows = (rows, options = {}) =>
    rows.map((row) => {
      const signalName = String(row?.name ?? "").trim();
      const rowKind = String(options?.rowKind ?? "").trim();
      return {
        name: resolveOpResultDisplayName(signalName, {
          rowKind,
          signalCaseMap: options?.signalCaseMap
        }),
        value: row?.value,
        signalToken: normalizeSignalToken(signalName),
        rowKind,
        signalColor: options?.colorMap?.get?.(signalName) ?? ""
      };
    });

  const resolveOpResultDisplayName = (signalName, options = {}) => {
    const rawName = String(signalName ?? "").trim();
    if (!rawName) {
      return "";
    }
    const rowKind = String(options?.rowKind ?? "").trim();
    const token = normalizeSignalToken(rawName);
    const casedName = token
      ? (options?.signalCaseMap?.get(token) ?? rawName)
      : rawName;
    if (rowKind === "op-node") {
      const parsed = parseVoltageSignalToken(casedName, { preserveCase: true });
      return parsed ? formatSignalLabel(casedName) : formatSignalLabel(`v(${casedName})`);
    }
    return formatSignalLabel(casedName);
  };

  const normalizeStoredRowToken = (value) => {
    const token = String(value ?? "").trim().toLowerCase();
    if (!token) {
      return "";
    }
    if (token.startsWith("v:") || token.startsWith("vd:") || token.startsWith("i:")) {
      return token;
    }
    return normalizeSignalToken(token);
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

  const getResultRowSignalTokens = (row) => {
    if (!(row instanceof HTMLElement)) {
      return [];
    }
    const multi = String(row.dataset.resultsSignalTokens ?? "").trim();
    if (multi) {
      return normalizeStoredRowTokenList(multi.split(/\s+/));
    }
    const single = String(row.dataset.resultsSignalToken ?? "").trim();
    if (!single) {
      return [];
    }
    const token = normalizeStoredRowToken(single);
    return token ? [token] : [];
  };

  const rowMatchesSelectedSignals = (row) => {
    const tokens = getResultRowSignalTokens(row);
    return tokens.some((token) => activeTraceSelectionTokens.has(token));
  };

  const rowMatchesHoverSignals = (row) => {
    const tokens = getResultRowSignalTokens(row);
    return tokens.some((token) => activeTraceHoverTokens.has(token));
  };

  const rowMatchesSelectedMeasurement = (row) => {
    if (!(row instanceof HTMLElement)) {
      return false;
    }
    const measurementId = String(row.dataset.measurementId ?? "").trim();
    return Boolean(
      measurementId
      && schematicSelectionId
      && String(schematicSelectionId) === measurementId
    );
  };

  const applyResultsSignalHighlights = () => {
    document
      .querySelectorAll("[data-results-signal-token], [data-results-signal-tokens], .measurement-row[data-measurement-id]")
      .forEach((row) => {
        if (!(row instanceof HTMLElement)) {
          return;
        }
        const isSelected = rowMatchesSelectedSignals(row) || rowMatchesSelectedMeasurement(row);
        const isHover = !isSelected && rowMatchesHoverSignals(row);
        row.classList.toggle("active", isSelected);
        row.classList.toggle("hover", isHover);
      });
  };

  refreshResultsTableHighlights = () => {
    applyResultsSignalHighlights();
  };

  const formatResultsDisplayNumber = (value) => {
    if (!Number.isFinite(value)) {
      return "n/a";
    }
    const abs = Math.abs(value);
    if (abs !== 0 && (abs >= 1e6 || abs < 1e-3)) {
      return value.toExponential(3);
    }
    return value.toPrecision(4);
  };

  const formatResultsDisplayValue = (value) => {
    if (value === null || value === undefined) {
      return "n/a";
    }
    if (typeof value === "number") {
      return formatResultsDisplayNumber(value);
    }
    if (typeof value === "object"
      && Number.isFinite(value.real)
      && Number.isFinite(value.imag)) {
      const real = formatResultsDisplayNumber(value.real);
      const imagAbs = Math.abs(value.imag);
      if (imagAbs === 0) {
        return real;
      }
      const sign = value.imag >= 0 ? "+" : "-";
      return `${real} ${sign} j${formatResultsDisplayNumber(imagAbs)}`;
    }
    return String(value);
  };

  const bindSignalResultRow = (rowEl, signalTokens, options = {}) => {
    if (!(rowEl instanceof HTMLElement)) {
      return [];
    }
    const tokens = normalizeStoredRowTokenList(signalTokens);
    if (tokens.length) {
      rowEl.dataset.resultsSignalTokens = tokens.join(" ");
      if (tokens.length === 1) {
        rowEl.dataset.resultsSignalToken = tokens[0];
      }
    } else {
      delete rowEl.dataset.resultsSignalTokens;
      delete rowEl.dataset.resultsSignalToken;
    }
    const isSelectedMatch = () => tokens.length && tokens.some((token) => activeTraceSelectionTokens.has(token));
    const isHoverMatch = () => tokens.length && tokens.some((token) => activeTraceHoverTokens.has(token));
    const isForcedSelected = () => {
      const selectedFn = typeof options.isSelected === "function" ? options.isSelected : null;
      return selectedFn ? Boolean(selectedFn()) : false;
    };
    const applyState = () => {
      const selected = isForcedSelected() || isSelectedMatch();
      const hover = !selected && isHoverMatch();
      rowEl.classList.toggle("active", selected);
      rowEl.classList.toggle("hover", hover);
    };
    applyState();
    if (tokens.length) {
      rowEl.addEventListener("mouseenter", () => {
        handleResultsSignalHover(tokens);
      });
      rowEl.addEventListener("mouseleave", () => {
        handleResultsSignalHover([]);
      });
    }
    if (typeof options.onClick === "function") {
      rowEl.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        options.onClick(event, tokens);
      });
    }
    return tokens;
  };

  const renderTable = (table, rows, headers) => {
    table.innerHTML = "";
    const [nameHeaderText, valueHeaderText] = Array.isArray(headers) && headers.length >= 2
      ? headers
      : ["Name", "Value"];
    const thead = document.createElement("thead");
    const headRow = document.createElement("tr");
    const nameHeader = document.createElement("th");
    nameHeader.textContent = nameHeaderText;
    const valueHeader = document.createElement("th");
    valueHeader.textContent = valueHeaderText;
    headRow.append(nameHeader, valueHeader);
    thead.appendChild(headRow);

    const tbody = document.createElement("tbody");
    if (!rows.length) {
      const emptyRow = document.createElement("tr");
      const emptyCell = document.createElement("td");
      emptyCell.colSpan = 2;
      emptyCell.textContent = "No data";
      emptyRow.appendChild(emptyCell);
      tbody.appendChild(emptyRow);
    } else {
      rows.forEach((row) => {
        const tr = document.createElement("tr");
        const signalToken = String(row?.signalToken ?? normalizeSignalToken(row?.name)).trim();
        const rowKind = String(row?.rowKind ?? "").trim();
        if (rowKind) {
          tr.dataset.resultsRowKind = rowKind;
        }
        if (signalToken) {
          bindSignalResultRow(tr, [signalToken], {
            onClick: (event, signals) => {
              if (!signals.length) {
                return;
              }
              handleResultsSignalClick(signals, event);
            }
          });
        }
        const nameCell = document.createElement("td");
        const rowColor = normalizeHexColor(row?.signalColor);
        if (rowColor) {
          tr.style.setProperty("--results-row-color", rowColor);
          const swatch = document.createElement("span");
          swatch.className = "results-row-swatch";
          const label = document.createElement("span");
          label.className = "results-row-name";
          label.textContent = String(row?.name ?? "");
          nameCell.className = "results-name-cell";
          nameCell.append(swatch, label);
        } else {
          nameCell.textContent = row.name;
        }
        const valueCell = document.createElement("td");
        valueCell.textContent = formatResultsDisplayValue(row?.value);
        tr.append(nameCell, valueCell);
        tbody.appendChild(tr);
      });
    }
    table.append(thead, tbody);
  };

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

  const formatSignalLabel = (value) => resolveSignalDisplayLabel(value);

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
      if (descriptor?.netA) {
        addVoltageSignal(`v(${descriptor.netA})`);
      }
      if (descriptor?.netB) {
        addVoltageSignal(`v(${descriptor.netB})`);
      }
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
      addComponentTraceToken(componentId, `v(${net})`);
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

  const normalizeSignalTokenList = (signals) => dedupeSignalList(
    (signals ?? [])
      .map((entry) => String(entry ?? "").trim())
      .filter(Boolean)
  );

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

  const normalizeSignalTokenSet = (signals) => new Set(
    normalizeSignalTokenList(signals)
      .map((signal) => normalizeTraceTokenValue(signal))
      .filter(Boolean)
  );

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
      if (isProbeType(selectedType)) {
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
      const nets = index.componentToNets.get(componentId);
      nets?.forEach((net) => {
        const token = normalizeSignalToken(`v(${net})`);
        if (token) {
          tokens.add(token);
        }
      });
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

  const buildNetlistSelectionLineIndex = (compileInfo) => {
    const lineMap = Array.isArray(compileInfo?.lineMap) ? compileInfo.lineMap : [];
    const netlistText = String(compileInfo?.netlist ?? "");
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

  const getNetlistSelectionLineIndex = (compileInfo) => {
    if (compileInfo && netlistSelectionLineIndexCacheSource === compileInfo && netlistSelectionLineIndexCache) {
      return netlistSelectionLineIndexCache;
    }
    netlistSelectionLineIndexCache = buildNetlistSelectionLineIndex(compileInfo);
    netlistSelectionLineIndexCacheSource = compileInfo ?? null;
    return netlistSelectionLineIndexCache;
  };

  const applyNetlistPreviewHighlights = (lines, nodeSpans) => {
    const normalizedLines = normalizeNetlistHighlightLines(lines);
    const normalizedNodeSpans = normalizeNetlistHighlightNodeSpans(nodeSpans);
    const lineKey = normalizedLines.join(",");
    const nodeKey = normalizedNodeSpans.map((entry) => `${entry.line}:${entry.start}:${entry.length}`).join(",");
    const sourceText = String(netlistPreview.value ?? "");
    if (
      netlistPreviewHighlightLinesKey === lineKey
      && netlistPreviewHighlightNodesKey === nodeKey
      && netlistPreviewTextKey === sourceText
    ) {
      return;
    }
    netlistPreviewHighlightLinesKey = lineKey;
    netlistPreviewHighlightNodesKey = nodeKey;
    netlistPreviewTextKey = sourceText;
    netlistPreview.dataset.netlistHighlightLines = lineKey;
    netlistPreview.dataset.netlistHighlightNodes = nodeKey;
    netlistPreview.style.backgroundImage = "";
    netlistPreview.style.backgroundSize = "";
    netlistPreview.style.backgroundPosition = "";
    netlistPreview.style.backgroundRepeat = "";

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

    const fragment = self.document.createDocumentFragment();
    linesToRender.forEach((lineTextRaw, index) => {
      const lineNumber = index + 1;
      const lineText = String(lineTextRaw ?? "");
      const lineElement = self.document.createElement("span");
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
              self.document.createTextNode(lineText.slice(cursor, safeStart))
            );
          }
          const highlightStart = Math.max(cursor, safeStart);
          if (safeEnd > highlightStart) {
            const nodeElement = self.document.createElement("span");
            nodeElement.className = "schematic-netlist-node-highlight";
            nodeElement.textContent = lineText.slice(highlightStart, safeEnd);
            lineElement.appendChild(nodeElement);
          }
          cursor = Math.max(cursor, safeEnd);
        });
        if (cursor < lineText.length) {
          lineElement.appendChild(
            self.document.createTextNode(lineText.slice(cursor))
          );
        }
      }
      fragment.appendChild(lineElement);
    });
    netlistPreviewCode.replaceChildren(fragment);
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
    const componentFallbackNets = new Set();
    const wireNets = new Set();
    const highlightedLines = new Set();
    componentIds.forEach((componentId) => {
      const componentLines = selectionLineIndex.componentToLines.get(componentId);
      if (componentLines && componentLines.size) {
        componentLines.forEach((line) => highlightedLines.add(line));
        return;
      }
      const nets = selectionLineIndex.componentToNets.get(componentId);
      nets?.forEach((netName) => {
        const net = normalizeNodeName(netName);
        if (net) {
          componentFallbackNets.add(net);
        }
      });
    });
    if (wireIds.length) {
      const traceIndex = getTraceLinkIndex();
      wireIds.forEach((wireId) => {
        const net = normalizeNodeName(traceIndex.wireToNet.get(wireId));
        if (net) {
          wireNets.add(net);
        }
      });
    }
    componentFallbackNets.forEach((net) => {
      const linesForNet = selectionLineIndex.netToLines.get(net);
      linesForNet?.forEach((line) => highlightedLines.add(line));
    });
    const highlightedNodeSpans = [];
    wireNets.forEach((net) => {
      const spans = selectionLineIndex.netToNodeSpans.get(net);
      if (Array.isArray(spans) && spans.length) {
        highlightedNodeSpans.push(...spans);
      }
    });
    applyNetlistPreviewHighlights(Array.from(highlightedLines), highlightedNodeSpans);
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

  const updateSignalSelect = (select, signals, selected, options) => {
    const preferredSignals = Array.isArray(options?.preferredSignals) ? options.preferredSignals : [];
    const nextSignals = prioritizeSignals(signals, preferredSignals);
    const nextSelected = dedupeSignalList(Array.isArray(selected) ? selected : []);
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
    return chosen;
  };

  const setActiveSchematicTool = (tool) => {
    const previousTool = schematicTool;
    schematicTool = tool;
    schematicToolButtons.forEach((button) => {
      const isActive = button.dataset.schematicTool === tool;
      button.classList.toggle("active", isActive);
      button.setAttribute("aria-pressed", isActive ? "true" : "false");
      if (isActive) {
        selectedHelpTarget = button;
        if (helpEnabled) {
          setHelpPanel(button);
        }
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
    schematicGrid.visible = gridVisibleCheck.checked;
    if (schematicEditor && typeof schematicEditor.setGrid === "function") {
      schematicEditor.setGrid(schematicGrid);
    }
  };

  const applyValueFieldMeta = (type, labelEl, unitEl) => {
    const meta = getValueFieldMeta(type);
    if (labelEl) {
      labelEl.textContent = `${meta.label}:`;
    }
    if (unitEl) {
      unitEl.textContent = meta.unit;
    }
  };

  const updateSchematicProps = (component) => {
    if (component) {
      schematicSelectionId = component.id;
    } else {
      schematicSelectionId = null;
    }
    if (!inlineEditingComponentId) {
      refreshMeasurements();
      return;
    }
    if (component && component.id === inlineEditingComponentId) {
      syncInlineComponentEditor(component);
    } else {
      closeInlineComponentEditor();
    }
    refreshMeasurements();
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
            if (kind === "op") {
              return [];
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
                    actions.onRun(task.compiled.netlist ?? "");
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
        }
      });
      schematicPanel._schematicEditor = schematicEditor;
      setActiveSchematicTool(schematicTool);
      syncSchematicGrid();
    }
    return api;
  }


  const stripEndDirective = (text) => {
    if (typeof text !== "string" || !text.trim()) {
      return "";
    }
    const lines = text.trim().split(/\r?\n/);
    if (lines.length && lines[lines.length - 1].trim().toLowerCase() === ".end") {
      lines.pop();
    }
    return lines.join("\n");
  };

  const normalizeNetlistForSignature = (netlist) => {
    if (typeof netlist !== "string") {
      return "";
    }
    return netlist
      .split(/\r?\n/)
      .map((line) => line.trim().replace(/\s+/g, " "))
      .filter((line) => line && line.toLowerCase() !== ".end")
      .join("\n");
  };

  const computeNetlistSignature = (netlist) => {
    const normalized = normalizeNetlistForSignature(netlist);
    let hash = 2166136261;
    for (let index = 0; index < normalized.length; index += 1) {
      hash ^= normalized.charCodeAt(index);
      hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
    }
    const unsigned = hash >>> 0;
    return `${normalized.length}:${unsigned.toString(16).padStart(8, "0")}`;
  };

  const normalizeRunRequestSignalsForSignature = (signals) => {
    if (!Array.isArray(signals) || !signals.length) {
      return [];
    }
    const seen = new Set();
    const normalized = [];
    signals.forEach((entry) => {
      const token = String(entry ?? "").trim().toLowerCase();
      if (!token || seen.has(token)) {
        return;
      }
      seen.add(token);
      normalized.push(token);
    });
    normalized.sort();
    return normalized;
  };

  const computeRunRequestSignature = (kind, compileInfo, signals) => {
    const normalizedKind = String(kind ?? "").trim().toLowerCase();
    const netlistSignature = computeNetlistSignature(String(compileInfo?.netlist ?? ""));
    if (normalizedKind === "dc" || normalizedKind === "tran" || normalizedKind === "ac") {
      const normalizedSignals = normalizeRunRequestSignalsForSignature(signals);
      return `${netlistSignature}|signals=${normalizedSignals.join(",")}`;
    }
    return netlistSignature;
  };

  const rememberRunRequestSignature = (kind, compileInfo, signals) => {
    const normalizedKind = String(kind ?? "").trim().toLowerCase();
    if (!simulationKindIds.has(normalizedKind)) {
      return;
    }
    const signature = computeRunRequestSignature(normalizedKind, compileInfo, signals);
    lastRequestedRunRequestSignaturesByKind[normalizedKind] = signature;
  };

  const hasRunRequestChangedSinceLastRequest = (kind, compileInfo, signals) => {
    const normalizedKind = String(kind ?? "").trim().toLowerCase();
    if (!simulationKindIds.has(normalizedKind)) {
      return true;
    }
    const netlist = String(compileInfo?.netlist ?? "");
    if (!netlist.trim()) {
      return false;
    }
    const nextSignature = computeRunRequestSignature(normalizedKind, compileInfo, signals);
    const previousSignature = lastRequestedRunRequestSignaturesByKind[normalizedKind];
    return previousSignature !== nextSignature;
  };

  const applySourceOverride = (netlist, sourceId, sourceValue) => {
    if (typeof netlist !== "string") {
      return netlist;
    }
    const id = String(sourceId ?? "").trim();
    const value = String(sourceValue ?? "").trim();
    if (!id || !value) {
      return netlist;
    }
    const idLower = id.toLowerCase();
    let replaced = false;
    const lines = netlist.split(/\r?\n/).map((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("*") || trimmed.startsWith(".")) {
        return line;
      }
      const tokens = trimmed.split(/\s+/);
      if (tokens.length < 3) {
        return line;
      }
      if (tokens[0].toLowerCase() !== idLower) {
        return line;
      }
      replaced = true;
      const prefix = tokens.slice(0, 3).join(" ");
      return `${prefix} ${value}`;
    });
    return replaced ? lines.join("\n") : netlist;
  };

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
    netlistSelectionLineIndexCache = null;
    netlistSelectionLineIndexCacheSource = null;
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
    simulationConfig = next;
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
      gridVisibleCheck.checked = schematicGrid.visible;
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
    if (schematicEditor && typeof schematicEditor.setView === "function" && extracted.editor.view) {
      schematicEditor.setView(extracted.editor.view);
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
    const preferredSignals = dedupeSignals(namedSignals.concat(probeSignals));
    const fallbackSignals = preferredSignals.length
      ? preferredSignals
      : ((kind === "dc" || kind === "tran" || kind === "ac") ? ["all"] : []);
    const runSignals = (!requestedSignals.length || wildcardOnly)
      ? fallbackSignals
      : dedupeSignals(requestedSignals.concat(probeSignals));
    setActiveTab(kind);
    rememberRunRequestSignature(kind, compiled, runSignals);
    switch (kind) {
      case "op":
        actions.onRun(compiled.netlist);
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
        actions.onRun(compiled.netlist);
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
      state.series.forEach((entry) => {
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
            const y = mapY(point.y);
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

  const getPlotExportScale = () => {
    const overrideScale = Number(self.SpjutSimExportScale);
    if (Number.isFinite(overrideScale) && overrideScale > 0) {
      return overrideScale;
    }
    const deviceScale = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
    return Math.max(2, deviceScale);
  };

  const getPlotCssSize = (canvas) => {
    if (!canvas) {
      return { width: 0, height: 0 };
    }
    const state = canvas._plotState;
    const rect = canvas.getBoundingClientRect();
    const fallbackScale = state?.pixelRatio ?? 1;
    const width = rect.width || canvas.clientWidth || (canvas.width ? canvas.width / fallbackScale : state?.cssWidth ?? 0);
    const height = rect.height || canvas.clientHeight || (canvas.height ? canvas.height / fallbackScale : state?.cssHeight ?? 0);
    return {
      width: Number.isFinite(width) ? width : 0,
      height: Number.isFinite(height) ? height : 0
    };
  };

  const buildPlotExportConfig = (canvas) => {
    const state = canvas?._plotState;
    if (!state) {
      return null;
    }
    return {
      series: state.series,
      grid: state.grid,
      xLabel: state.xLabel,
      yLabel: state.yLabel,
      xScale: state.xScaleType,
      yScale: state.yScaleType,
      xTickFormat: state.xTickFormat ?? null,
      fontScale: state.fontScale ?? plotPrefs.fontScale,
      lineWidth: state.lineWidth ?? plotPrefs.lineWidth
    };
  };

  const exportPlotPng = (canvas, filename) => {
    if (!canvas) {
      return;
    }
    const plot = typeof self !== "undefined" ? self.SpjutSimPlot : null;
    const config = buildPlotExportConfig(canvas);
    if (!plot || typeof plot.renderPlot !== "function" || !config) {
      return;
    }
    const { width, height } = getPlotCssSize(canvas);
    if (!width || !height) {
      return;
    }
    const scale = getPlotExportScale();
    const exportCanvasEl = document.createElement("canvas");
    plot.renderPlot(exportCanvasEl, {
      ...config,
      width,
      height,
      pixelRatio: scale
    });
    const link = document.createElement("a");
    canvas._exportState = {
      type: "plot-png",
      scale,
      width: exportCanvasEl.width,
      height: exportCanvasEl.height,
      hiDpi: scale > 1,
      filename
    };
    link.href = exportCanvasEl.toDataURL("image/png");
    link.download = filename;
    link.click();
  };

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

  const exportSchematicSvg = () => {
    const api = ensureSchematicApi();
    if (!api || typeof api.exportSvg !== "function") {
      return;
    }
    const svgText = api.exportSvg(schematicModel, {
      fit: true,
      padding: EXPORT_PADDING,
      measurements: schematicMeasurements,
      probeLabels: schematicProbeLabels
    });
    if (!svgText) {
      return;
    }
    const blob = new Blob([svgText], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const filename = buildSchematicFilename("svg");
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
        probeLabels: schematicProbeLabels
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
  attachPlotTooltip(tranCanvas, tranOverlay, tranTooltip, {
    xLabel: "Time",
    onHover: handlePlotHoverSignals,
    onLeave: handlePlotLeave,
    onClick: handlePlotClickSignals
  });
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
        setHelpPanel(button);
      }
    });
  });

  gridSizeInput.addEventListener("change", () => {
    syncSchematicGrid();
    queueAutosave();
  });
  gridVisibleCheck.addEventListener("change", () => {
    syncSchematicGrid();
    queueAutosave();
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
    } else if (action === "simplify-wires-selection") {
      if (typeof schematicEditor.simplifyWires === "function") {
        schematicEditor.simplifyWires("selection");
      }
    } else if (action === "simplify-wires-all") {
      if (typeof schematicEditor.simplifyWires === "function") {
        schematicEditor.simplifyWires("all");
      }
    } else if (action === "regrid-selection") {
      if (typeof schematicEditor.regridToCurrentGrid === "function") {
        schematicEditor.regridToCurrentGrid("selection");
      }
    } else if (action === "regrid-all") {
      if (typeof schematicEditor.regridToCurrentGrid === "function") {
        schematicEditor.regridToCurrentGrid("all");
      }
    } else if (action === "duplicate") {
      if (typeof schematicEditor.startSelectionPlacement === "function") {
        schematicEditor.startSelectionPlacement();
      } else if (typeof schematicEditor.duplicateSelection === "function") {
        schematicEditor.duplicateSelection();
      }
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
    if (action === "export-json") {
      openJsonExportDialog();
      return;
    }
    if (action === "new") {
      resetDocumentState();
      return;
    }
    if (action === "export-svg") {
      exportSchematicSvg();
      return;
    }
    if (action === "export-png") {
      openExportDialog();
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
    runMenuAction("export-png");
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
    const target = event.target;
    const targetTag = target && target.tagName ? target.tagName.toLowerCase() : "";
    if (targetTag === "input" || targetTag === "textarea") {
      return;
    }
    if (key === "f5") {
      event.preventDefault();
      runSchematicAnalysis();
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
    if (modifierKey) {
      return;
    }
    if (key === "p") {
      event.preventDefault();
      setActiveSchematicTool("PV");
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
    if (key === "w") {
      event.preventDefault();
      setActiveSchematicTool("wire");
      return;
    }
    if (key === "s") {
      event.preventDefault();
      setActiveSchematicTool("select");
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
    const toolMap = {
      r: "R",
      c: "C",
      l: "L",
      v: "V",
      i: "I",
      3: "SW",
      g: "GND",
      n: "NET",
      t: "TEXT"
    };
    const tool = toolMap[key];
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
    const wireCount = (schematicEditor?.getModel?.()?.wires ?? []).length;
    const componentCount = (schematicEditor?.getModel?.()?.components ?? []).length;
    const shouldDisable = (action) => {
      if (action === "toggle-help") {
        return false;
      }
      if (action === "open" || action === "save" || action === "save-as" || action === "new" || action === "about") {
        return false;
      }
      if (action && action.startsWith(EXAMPLE_MENU_ACTION_PREFIX)) {
        return false;
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
      if (action === "simplify-wires-all") {
        return wireCount < 1;
      }
      if (action === "simplify-wires-selection") {
        return !hasSelection;
      }
      if (action === "regrid-selection") {
        return !hasSelection;
      }
      if (action === "regrid-all") {
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
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      const isOpen = wrapper.classList.contains("open");
      closeMenuGroups();
      if (!isOpen) {
        updateMenuActionState();
        wrapper.classList.add("open");
        positionPopoverInViewport(list, button.getBoundingClientRect(), {
          align: "start"
        });
        requestAnimationFrame(() => {
          positionPopoverInViewport(list, button.getBoundingClientRect(), {
            align: "start"
          });
        });
      }
    });
    const repositionList = () => {
      if (!wrapper.classList.contains("open")) {
        return;
      }
      positionPopoverInViewport(list, button.getBoundingClientRect(), {
        align: "start"
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
        { id: "open", label: "Open...", shortcut: "Ctrl+O" },
        { id: "save", label: "Save", shortcut: "Ctrl+S" },
        { id: "save-as", label: "Save As...", shortcut: "Ctrl+Shift+S" },
        { divider: true, id: "exports" },
        { id: "export-json", label: "Export JSON..." },
        { id: "export-svg", label: "Export SVG" },
        { id: "export-png", label: "Export PNG..." }
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
        { id: "toggle-help", label: "Info View: On" },
        { id: "about", label: "About" }
      ],
      actionAttribute: "menuAction",
      showShortcuts: false
    }
  ];

  menuGroups.forEach((group) => {
    menuBar.appendChild(buildMenuGroup(group));
  });
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

  const inlineEditor = document.createElement("div");
  inlineEditor.className = "inline-edit hidden";
  inlineEditor.dataset.inlineEdit = "component";
  inlineEditor.hidden = true;
  const inlineNameRow = document.createElement("label");
  inlineNameRow.className = "inline-edit-row";
  const inlineNameLabel = document.createElement("span");
  inlineNameLabel.textContent = "Name:";
  const inlineNameInput = document.createElement("input");
  inlineNameInput.type = "text";
  inlineNameInput.className = "schematic-prop-input";
  inlineNameInput.dataset.inlineProp = "name";
  const inlineNameField = document.createElement("div");
  inlineNameField.className = "inline-edit-field";
  inlineNameField.dataset.inlineField = "name";
  inlineNameField.append(inlineNameInput);
  inlineNameRow.append(inlineNameLabel, inlineNameField);
  const inlineValueRow = document.createElement("label");
  inlineValueRow.className = "inline-edit-row";
  const inlineValueLabel = document.createElement("span");
  inlineValueLabel.dataset.inlineValueLabel = "1";
  inlineValueLabel.textContent = "Value:";
  const inlineValueInput = document.createElement("input");
  inlineValueInput.type = "text";
  inlineValueInput.className = "schematic-prop-input";
  inlineValueInput.dataset.inlineProp = "value";
  const inlineValueUnit = document.createElement("span");
  inlineValueUnit.dataset.inlineValueUnit = "1";
  inlineValueUnit.className = "inline-edit-unit";
  const inlineValueField = document.createElement("div");
  inlineValueField.className = "inline-edit-field";
  inlineValueField.dataset.inlineField = "value";
  inlineValueField.append(inlineValueInput, inlineValueUnit);
  inlineValueRow.append(inlineValueLabel, inlineValueField);
  const inlineSwitchPositionRow = document.createElement("label");
  inlineSwitchPositionRow.className = "inline-edit-row";
  inlineSwitchPositionRow.dataset.inlineSwitchPositionRow = "1";
  const inlineSwitchPositionLabel = document.createElement("span");
  inlineSwitchPositionLabel.textContent = "Position:";
  const inlineSwitchPositionField = document.createElement("div");
  inlineSwitchPositionField.className = "inline-edit-field inline-switch-position-field";
  const inlineSwitchPositionGroup = document.createElement("div");
  inlineSwitchPositionGroup.className = "inline-switch-position-group";
  const inlineSwitchPositionA = document.createElement("button");
  inlineSwitchPositionA.type = "button";
  inlineSwitchPositionA.className = "inline-switch-position-button";
  inlineSwitchPositionA.dataset.inlineSwitchPosition = "A";
  inlineSwitchPositionA.textContent = "A";
  inlineSwitchPositionA.setAttribute("aria-pressed", "false");
  const inlineSwitchPositionB = document.createElement("button");
  inlineSwitchPositionB.type = "button";
  inlineSwitchPositionB.className = "inline-switch-position-button";
  inlineSwitchPositionB.dataset.inlineSwitchPosition = "B";
  inlineSwitchPositionB.textContent = "B";
  inlineSwitchPositionB.setAttribute("aria-pressed", "false");
  inlineSwitchPositionGroup.append(inlineSwitchPositionA, inlineSwitchPositionB);
  inlineSwitchPositionField.append(inlineSwitchPositionGroup);
  inlineSwitchPositionRow.append(inlineSwitchPositionLabel, inlineSwitchPositionField);
  const inlineSwitchRonRow = document.createElement("label");
  inlineSwitchRonRow.className = "inline-edit-row";
  const inlineSwitchRonLabel = document.createElement("span");
  inlineSwitchRonLabel.textContent = "Ron:";
  const inlineSwitchRonField = document.createElement("div");
  inlineSwitchRonField.className = "inline-edit-field";
  const inlineSwitchRonInput = document.createElement("input");
  inlineSwitchRonInput.type = "text";
  inlineSwitchRonInput.className = "schematic-prop-input";
  inlineSwitchRonInput.dataset.inlineSwitchRon = "1";
  inlineSwitchRonField.append(inlineSwitchRonInput);
  inlineSwitchRonRow.append(inlineSwitchRonLabel, inlineSwitchRonField);
  const inlineSwitchRoffRow = document.createElement("label");
  inlineSwitchRoffRow.className = "inline-edit-row";
  const inlineSwitchRoffLabel = document.createElement("span");
  inlineSwitchRoffLabel.textContent = "Roff:";
  const inlineSwitchRoffField = document.createElement("div");
  inlineSwitchRoffField.className = "inline-edit-field";
  const inlineSwitchRoffInput = document.createElement("input");
  inlineSwitchRoffInput.type = "text";
  inlineSwitchRoffInput.className = "schematic-prop-input";
  inlineSwitchRoffInput.dataset.inlineSwitchRoff = "1";
  inlineSwitchRoffField.append(inlineSwitchRoffInput);
  inlineSwitchRoffRow.append(inlineSwitchRoffLabel, inlineSwitchRoffField);
  const inlineSwitchShowRonRow = document.createElement("label");
  inlineSwitchShowRonRow.className = "inline-edit-row";
  const inlineSwitchShowRonLabel = document.createElement("span");
  inlineSwitchShowRonLabel.textContent = "Show Ron:";
  const inlineSwitchShowRonField = document.createElement("div");
  inlineSwitchShowRonField.className = "inline-edit-field inline-edit-checkbox-field";
  const inlineSwitchShowRonInput = document.createElement("input");
  inlineSwitchShowRonInput.type = "checkbox";
  inlineSwitchShowRonInput.className = "inline-edit-checkbox-input";
  inlineSwitchShowRonInput.dataset.inlineSwitchShowRon = "1";
  inlineSwitchShowRonField.append(inlineSwitchShowRonInput);
  inlineSwitchShowRonRow.append(inlineSwitchShowRonLabel, inlineSwitchShowRonField);
  const inlineSwitchShowRoffRow = document.createElement("label");
  inlineSwitchShowRoffRow.className = "inline-edit-row";
  const inlineSwitchShowRoffLabel = document.createElement("span");
  inlineSwitchShowRoffLabel.textContent = "Show Roff:";
  const inlineSwitchShowRoffField = document.createElement("div");
  inlineSwitchShowRoffField.className = "inline-edit-field inline-edit-checkbox-field";
  const inlineSwitchShowRoffInput = document.createElement("input");
  inlineSwitchShowRoffInput.type = "checkbox";
  inlineSwitchShowRoffInput.className = "inline-edit-checkbox-input";
  inlineSwitchShowRoffInput.dataset.inlineSwitchShowRoff = "1";
  inlineSwitchShowRoffField.append(inlineSwitchShowRoffInput);
  inlineSwitchShowRoffRow.append(inlineSwitchShowRoffLabel, inlineSwitchShowRoffField);
  const inlineProbeTypeRow = document.createElement("label");
  inlineProbeTypeRow.className = "inline-edit-row";
  inlineProbeTypeRow.dataset.inlineProbeTypeRow = "1";
  const inlineProbeTypeLabel = document.createElement("span");
  inlineProbeTypeLabel.textContent = "Probe type:";
  const inlineProbeTypeField = document.createElement("div");
  inlineProbeTypeField.className = "inline-edit-field";
  const inlineProbeTypeSelect = document.createElement("select");
  inlineProbeTypeSelect.className = "schematic-prop-input";
  inlineProbeTypeSelect.dataset.inlineProbeType = "1";
  [
    { value: "PV", label: "Voltage" },
    { value: "PI", label: "Current" },
    { value: "PP", label: "Power" }
  ].forEach((entry) => {
    const option = document.createElement("option");
    option.value = entry.value;
    option.textContent = entry.label;
    inlineProbeTypeSelect.appendChild(option);
  });
  inlineProbeTypeField.append(inlineProbeTypeSelect);
  inlineProbeTypeRow.append(inlineProbeTypeLabel, inlineProbeTypeField);
  const inlineNetColorPicker = createNetColorPicker({
    rowAttribute: "data-inline-net-color-row",
    swatchAttribute: "data-inline-net-color",
    onPick: (color) => {
      if (inlineSync || !inlineEditingComponentId || !schematicEditor) {
        return;
      }
      if (typeof schematicEditor.updateComponent === "function") {
        schematicEditor.updateComponent(inlineEditingComponentId, { netColor: color });
      }
    }
  });
  const inlineTextOnlyRow = document.createElement("label");
  inlineTextOnlyRow.className = "inline-edit-row";
  inlineTextOnlyRow.dataset.inlineNetTextOnlyRow = "1";
  const inlineTextOnlyLabel = document.createElement("span");
  inlineTextOnlyLabel.textContent = "Text only:";
  const inlineTextOnlyField = document.createElement("div");
  inlineTextOnlyField.className = "inline-edit-field inline-edit-checkbox-field";
  const inlineTextOnlyInput = document.createElement("input");
  inlineTextOnlyInput.type = "checkbox";
  inlineTextOnlyInput.className = "inline-edit-checkbox-input";
  inlineTextOnlyInput.dataset.inlineNetTextOnly = "1";
  inlineTextOnlyField.append(inlineTextOnlyInput);
  inlineTextOnlyRow.append(inlineTextOnlyLabel, inlineTextOnlyField);
  const inlineTextFontRow = document.createElement("label");
  inlineTextFontRow.className = "inline-edit-row";
  inlineTextFontRow.dataset.inlineTextFontRow = "1";
  const inlineTextFontLabel = document.createElement("span");
  inlineTextFontLabel.textContent = "Font:";
  const inlineTextFontField = document.createElement("div");
  inlineTextFontField.className = "inline-edit-field";
  const inlineTextFontSelect = document.createElement("select");
  inlineTextFontSelect.className = "schematic-prop-input";
  inlineTextFontSelect.dataset.inlineTextFont = "1";
  getTextFontOptions().forEach((fontName) => {
    const option = document.createElement("option");
    option.value = fontName;
    option.textContent = fontName;
    inlineTextFontSelect.appendChild(option);
  });
  inlineTextFontField.append(inlineTextFontSelect);
  inlineTextFontRow.append(inlineTextFontLabel, inlineTextFontField);
  const inlineTextSizeRow = document.createElement("label");
  inlineTextSizeRow.className = "inline-edit-row";
  inlineTextSizeRow.dataset.inlineTextSizeRow = "1";
  const inlineTextSizeLabel = document.createElement("span");
  inlineTextSizeLabel.textContent = "Size:";
  const inlineTextSizeField = document.createElement("div");
  inlineTextSizeField.className = "inline-edit-field";
  const inlineTextSizeInput = document.createElement("input");
  inlineTextSizeInput.type = "number";
  inlineTextSizeInput.min = "8";
  inlineTextSizeInput.max = "72";
  inlineTextSizeInput.step = "1";
  inlineTextSizeInput.className = "schematic-prop-input";
  inlineTextSizeInput.dataset.inlineTextSize = "1";
  inlineTextSizeField.append(inlineTextSizeInput);
  inlineTextSizeRow.append(inlineTextSizeLabel, inlineTextSizeField);
  const inlineTextBoldRow = document.createElement("label");
  inlineTextBoldRow.className = "inline-edit-row";
  inlineTextBoldRow.dataset.inlineTextBoldRow = "1";
  const inlineTextBoldLabel = document.createElement("span");
  inlineTextBoldLabel.textContent = "Bold:";
  const inlineTextBoldField = document.createElement("div");
  inlineTextBoldField.className = "inline-edit-field inline-edit-checkbox-field";
  const inlineTextBoldInput = document.createElement("input");
  inlineTextBoldInput.type = "checkbox";
  inlineTextBoldInput.className = "inline-edit-checkbox-input";
  inlineTextBoldInput.dataset.inlineTextBold = "1";
  inlineTextBoldField.append(inlineTextBoldInput);
  inlineTextBoldRow.append(inlineTextBoldLabel, inlineTextBoldField);
  const inlineTextItalicRow = document.createElement("label");
  inlineTextItalicRow.className = "inline-edit-row";
  inlineTextItalicRow.dataset.inlineTextItalicRow = "1";
  const inlineTextItalicLabel = document.createElement("span");
  inlineTextItalicLabel.textContent = "Italic:";
  const inlineTextItalicField = document.createElement("div");
  inlineTextItalicField.className = "inline-edit-field inline-edit-checkbox-field";
  const inlineTextItalicInput = document.createElement("input");
  inlineTextItalicInput.type = "checkbox";
  inlineTextItalicInput.className = "inline-edit-checkbox-input";
  inlineTextItalicInput.dataset.inlineTextItalic = "1";
  inlineTextItalicField.append(inlineTextItalicInput);
  inlineTextItalicRow.append(inlineTextItalicLabel, inlineTextItalicField);
  const inlineTextUnderlineRow = document.createElement("label");
  inlineTextUnderlineRow.className = "inline-edit-row";
  inlineTextUnderlineRow.dataset.inlineTextUnderlineRow = "1";
  const inlineTextUnderlineLabel = document.createElement("span");
  inlineTextUnderlineLabel.textContent = "Underline:";
  const inlineTextUnderlineField = document.createElement("div");
  inlineTextUnderlineField.className = "inline-edit-field inline-edit-checkbox-field";
  const inlineTextUnderlineInput = document.createElement("input");
  inlineTextUnderlineInput.type = "checkbox";
  inlineTextUnderlineInput.className = "inline-edit-checkbox-input";
  inlineTextUnderlineInput.dataset.inlineTextUnderline = "1";
  inlineTextUnderlineField.append(inlineTextUnderlineInput);
  inlineTextUnderlineRow.append(inlineTextUnderlineLabel, inlineTextUnderlineField);
  const defaultTextStyle = getDefaultTextStyle();
  inlineTextFontSelect.value = defaultTextStyle.font;
  inlineTextSizeInput.value = String(defaultTextStyle.size);
  inlineTextBoldInput.checked = defaultTextStyle.bold;
  inlineTextItalicInput.checked = defaultTextStyle.italic;
  inlineTextUnderlineInput.checked = defaultTextStyle.underline;
  const inlineNetColorLabel = inlineNetColorPicker.row.querySelector("span");
  const syncInlineLabelColumnWidth = () => {
    if (!inlineEditor) {
      return;
    }
    const labels = [
      inlineNameLabel,
      inlineProbeTypeLabel,
      inlineValueLabel,
      inlineSwitchPositionLabel,
      inlineSwitchRonLabel,
      inlineSwitchRoffLabel,
      inlineSwitchShowRonLabel,
      inlineSwitchShowRoffLabel,
      inlineNetColorLabel,
      inlineTextOnlyLabel,
      inlineTextFontLabel,
      inlineTextSizeLabel,
      inlineTextBoldLabel,
      inlineTextItalicLabel,
      inlineTextUnderlineLabel
    ];
    let maxTextWidth = 0;
    labels.forEach((label) => {
      if (!(label instanceof HTMLElement)) {
        return;
      }
      const row = label.closest(".inline-edit-row");
      if (row instanceof HTMLElement && row.hidden) {
        return;
      }
      const range = document.createRange();
      range.selectNodeContents(label);
      const width = range.getBoundingClientRect().width;
      if (Number.isFinite(width) && width > maxTextWidth) {
        maxTextWidth = width;
      }
    });
    if (maxTextWidth <= 0) {
      inlineEditor.style.removeProperty("--inline-edit-label-width");
      return;
    }
    const columnWidth = Math.max(40, Math.ceil(maxTextWidth + 2));
    inlineEditor.style.setProperty("--inline-edit-label-width", `${columnWidth}px`);
  };
  inlineProbeTypeRow.hidden = true;
  inlineSwitchPositionRow.hidden = true;
  inlineSwitchRonRow.hidden = true;
  inlineSwitchRoffRow.hidden = true;
  inlineSwitchShowRonRow.hidden = true;
  inlineSwitchShowRoffRow.hidden = true;
  inlineNetColorPicker.row.hidden = true;
  inlineTextOnlyRow.hidden = true;
  inlineTextFontRow.hidden = true;
  inlineTextSizeRow.hidden = true;
  inlineTextBoldRow.hidden = true;
  inlineTextItalicRow.hidden = true;
  inlineTextUnderlineRow.hidden = true;
  inlineEditor.append(
    inlineNameRow,
    inlineProbeTypeRow,
    inlineValueRow,
    inlineSwitchPositionRow,
    inlineSwitchRonRow,
    inlineSwitchRoffRow,
    inlineSwitchShowRonRow,
    inlineSwitchShowRoffRow,
    inlineNetColorPicker.row,
    inlineTextOnlyRow,
    inlineTextFontRow,
    inlineTextSizeRow,
    inlineTextBoldRow,
    inlineTextItalicRow,
    inlineTextUnderlineRow
  );
  workspace.appendChild(inlineEditor);

  const getModelComponent = (componentId) => {
    if (!componentId || !schematicEditor || typeof schematicEditor.getModel !== "function") {
      return null;
    }
    const model = schematicEditor.getModel();
    return (model?.components ?? []).find((entry) => String(entry.id) === String(componentId)) ?? null;
  };

  const getComponentAnchor = (component) => {
    const pins = Array.isArray(component?.pins) ? component.pins : [];
    if (!pins.length) {
      return null;
    }
    const center = pins.reduce((acc, pin) => ({
      x: acc.x + pin.x,
      y: acc.y + pin.y
    }), { x: 0, y: 0 });
    return {
      x: center.x / pins.length,
      y: center.y / pins.length
    };
  };

  const toClientPoint = (x, y) => {
    const svg = schematicCanvasWrap.querySelector(".schematic-editor");
    if (!svg) {
      return null;
    }
    const ctm = typeof svg.getScreenCTM === "function" ? svg.getScreenCTM() : null;
    if (ctm) {
      if (typeof svg.createSVGPoint === "function") {
        const point = svg.createSVGPoint();
        point.x = x;
        point.y = y;
        const transformed = point.matrixTransform(ctm);
        return { x: transformed.x, y: transformed.y };
      }
      if (typeof DOMPoint === "function") {
        const transformed = new DOMPoint(x, y).matrixTransform(ctm);
        return { x: transformed.x, y: transformed.y };
      }
    }
    return null;
  };

  const positionInlineEditor = (component) => {
    const anchor = getComponentAnchor(component);
    if (!anchor) {
      return;
    }
    const client = toClientPoint(anchor.x, anchor.y);
    if (!client || !workspace) {
      return;
    }
    const workspaceRect = workspace.getBoundingClientRect();
    const box = inlineEditor.getBoundingClientRect();
    if (!workspaceRect.width || !workspaceRect.height || !box.width || !box.height) {
      return;
    }
    const margin = 8;
    const offset = 16;
    const anchorX = client.x - workspaceRect.left;
    const anchorY = client.y - workspaceRect.top;
    let left = anchorX + offset;
    let top = anchorY - (box.height / 2);
    if (left + box.width > workspaceRect.width - margin) {
      left = anchorX - box.width - offset;
    }
    left = Math.max(margin, Math.min(left, workspaceRect.width - box.width - margin));
    top = Math.max(margin, Math.min(top, workspaceRect.height - box.height - margin));
    inlineEditor.style.left = `${left}px`;
    inlineEditor.style.top = `${top}px`;
  };

  const getProbePrimaryPin = (component) => {
    const pins = Array.isArray(component?.pins) ? component.pins : [];
    const pin = pins[0];
    if (!pin || !Number.isFinite(pin.x) || !Number.isFinite(pin.y)) {
      return null;
    }
    return { x: pin.x, y: pin.y };
  };

  const resolveProbeTargetComponentIdAtPin = (probeComponent, probePin) => {
    if (!schematicEditor || typeof schematicEditor.getModel !== "function" || !probePin) {
      return "";
    }
    const components = Array.isArray(schematicEditor.getModel()?.components)
      ? schematicEditor.getModel().components
      : [];
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
      const candidateType = String(candidate?.type ?? "").toUpperCase();
      if (!candidateType || candidateType === "NET" || candidateType === "GND" || candidateType === "TEXT" || isProbeType(candidateType)) {
        return;
      }
      const candidatePins = Array.isArray(candidate?.pins) ? candidate.pins : [];
      if (candidatePins.length < 2) {
        return;
      }
      const pinA = candidatePins[0];
      const pinB = candidatePins[1];
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

  const extractProbeLabelToken = (name) => {
    const text = String(name ?? "").trim();
    const match = text.match(/\((.*)\)/);
    return match ? String(match[1] ?? "").trim() : "";
  };

  const buildProbeTypeUpdate = (component, nextTypeRaw) => {
    const nextType = String(nextTypeRaw ?? "").toUpperCase();
    if (!["PV", "PI", "PP"].includes(nextType)) {
      return null;
    }
    const probePin = getProbePrimaryPin(component);
    const existingTarget = String(component?.value ?? "").trim();
    const fallbackToken = extractProbeLabelToken(component?.name) || "?";
    if (nextType === "PI" || nextType === "PP") {
      const targetId = existingTarget || resolveProbeTargetComponentIdAtPin(component, probePin) || "";
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

  const setInlineSwitchActiveThrow = (activeThrow) => {
    const normalized = normalizeSpdtThrow(activeThrow);
    const isA = normalized === "A";
    inlineSwitchPositionA.setAttribute("aria-pressed", isA ? "true" : "false");
    inlineSwitchPositionB.setAttribute("aria-pressed", isA ? "false" : "true");
    inlineSwitchPositionA.classList.toggle("active", isA);
    inlineSwitchPositionB.classList.toggle("active", !isA);
  };

  const commitInlineSwitchState = (overrides, options) => {
    if (inlineSync || !inlineEditingComponentId || !schematicEditor) {
      return;
    }
    if (typeof schematicEditor.updateComponent !== "function") {
      return;
    }
    const component = getModelComponent(inlineEditingComponentId);
    if (String(component?.type ?? "").toUpperCase() !== "SW") {
      return;
    }
    const parsed = parseSpdtSwitchValueSafe(component.value);
    const patch = overrides && typeof overrides === "object" ? overrides : {};
    const hasRoffOverride = Object.prototype.hasOwnProperty.call(patch, "roff");
    const hasShowRonOverride = Object.prototype.hasOwnProperty.call(patch, "showRon");
    const hasShowRoffOverride = Object.prototype.hasOwnProperty.call(patch, "showRoff");
    const nextState = {
      activeThrow: normalizeSpdtThrow(
        Object.prototype.hasOwnProperty.call(patch, "activeThrow")
          ? patch.activeThrow
          : parsed.activeThrow
      ),
      ron: String(
        Object.prototype.hasOwnProperty.call(patch, "ron")
          ? patch.ron
          : inlineSwitchRonInput.value
      ).trim() || "0",
      roff: hasRoffOverride
        ? (String(patch.roff ?? "").trim() || null)
        : (String(inlineSwitchRoffInput.value ?? "").trim() || null),
      showRon: hasShowRonOverride
        ? patch.showRon === true
        : inlineSwitchShowRonInput.checked === true,
      showRoff: hasShowRoffOverride
        ? patch.showRoff === true
        : inlineSwitchShowRoffInput.checked === true
    };
    schematicEditor.updateComponent(
      inlineEditingComponentId,
      { value: formatSpdtSwitchValue(nextState) }
    );
    if (options?.resync) {
      const updated = getModelComponent(inlineEditingComponentId);
      if (updated) {
        syncInlineComponentEditor(updated);
      }
    }
  };

  let inlineSync = false;
  syncInlineComponentEditor = (component) => {
    if (!component) {
      return;
    }
    const type = String(component.type ?? "").toUpperCase();
    const isSwitchComponent = type === "SW";
    const isProbeComponent = isProbeType(type);
    const hasValueField = supportsComponentValueField(component.type);
    const isNamedNode = type === "NET";
    const isTextAnnotation = type === "TEXT";
    inlineSync = true;
    inlineNameInput.value = Object.prototype.hasOwnProperty.call(component, "name")
      ? String(component.name ?? "")
      : String(component.id ?? "");
    inlineProbeTypeRow.hidden = !isProbeComponent;
    if (isProbeComponent) {
      inlineProbeTypeSelect.value = ["PV", "PI", "PP"].includes(type) ? type : "PV";
    } else {
      inlineProbeTypeSelect.value = "PV";
    }
    inlineValueInput.value = hasValueField ? String(component.value ?? "") : "";
    inlineValueRow.hidden = !hasValueField || isSwitchComponent;
    inlineValueInput.disabled = !hasValueField || isSwitchComponent;
    inlineSwitchPositionRow.hidden = !isSwitchComponent;
    inlineSwitchRonRow.hidden = !isSwitchComponent;
    inlineSwitchRoffRow.hidden = !isSwitchComponent;
    inlineSwitchShowRonRow.hidden = !isSwitchComponent;
    inlineSwitchShowRoffRow.hidden = !isSwitchComponent;
    if (isSwitchComponent) {
      const switchValue = parseSpdtSwitchValueSafe(component.value);
      setInlineSwitchActiveThrow(switchValue.activeThrow);
      inlineSwitchRonInput.value = switchValue.ron;
      inlineSwitchRoffInput.value = switchValue.roff ?? "";
      inlineSwitchShowRonInput.checked = switchValue.showRon === true;
      inlineSwitchShowRoffInput.checked = switchValue.showRoff === true;
    }
    inlineNetColorPicker.row.hidden = false;
    inlineNetColorPicker.setSelected(component.netColor ?? "");
    inlineTextOnlyRow.hidden = !isNamedNode;
    inlineTextOnlyInput.checked = isNamedNode && component.textOnly === true;
    inlineTextFontRow.hidden = !isTextAnnotation;
    inlineTextSizeRow.hidden = !isTextAnnotation;
    inlineTextBoldRow.hidden = !isTextAnnotation;
    inlineTextItalicRow.hidden = !isTextAnnotation;
    inlineTextUnderlineRow.hidden = !isTextAnnotation;
    inlineTextFontSelect.value = normalizeTextFontValue(component.textFont);
    inlineTextSizeInput.value = String(normalizeTextSizeValue(component.textSize));
    inlineTextBoldInput.checked = isTextAnnotation && component.textBold === true;
    inlineTextItalicInput.checked = isTextAnnotation && component.textItalic === true;
    inlineTextUnderlineInput.checked = isTextAnnotation && component.textUnderline === true;
    applyValueFieldMeta(component.type, inlineValueLabel, inlineValueUnit);
    syncInlineLabelColumnWidth();
    inlineSync = false;
    requestAnimationFrame(() => positionInlineEditor(component));
  };

  closeInlineComponentEditor = () => {
    inlineEditingComponentId = null;
    inlineEditor.style.removeProperty("visibility");
    inlineEditor.hidden = true;
    inlineEditor.classList.add("hidden");
  };

  openInlineComponentEditor = (componentArg) => {
    const component = componentArg ?? getModelComponent(schematicSelectionId);
    if (!component) {
      return;
    }
    inlineEditingComponentId = component.id;
    // Measure and hydrate while participating in layout so opening doesn't
    // visibly resize after the first interaction.
    inlineEditor.hidden = false;
    inlineEditor.classList.remove("hidden");
    inlineEditor.style.visibility = "hidden";
    syncInlineComponentEditor(component);
    requestAnimationFrame(() => {
      const current = getModelComponent(inlineEditingComponentId);
      if (current) {
        positionInlineEditor(current);
      }
      inlineEditor.style.removeProperty("visibility");
      const componentType = String(component.type ?? "").toUpperCase();
      const shouldEditName = componentType === "NET" || componentType === "TEXT" || isProbeType(componentType);
      if (shouldEditName) {
        inlineNameInput.focus();
        inlineNameInput.select();
      } else if (componentType === "SW") {
        const activeToggle = inlineSwitchPositionA.getAttribute("aria-pressed") === "true"
          ? inlineSwitchPositionA
          : inlineSwitchPositionB;
        activeToggle.focus();
      } else {
        inlineValueInput.focus();
        inlineValueInput.select();
      }
    });
  };

  inlineNameInput.addEventListener("input", () => {
    if (inlineSync || !inlineEditingComponentId || !schematicEditor) {
      return;
    }
    if (typeof schematicEditor.updateComponent === "function") {
      schematicEditor.updateComponent(inlineEditingComponentId, { name: inlineNameInput.value });
    }
  });

  inlineValueInput.addEventListener("input", () => {
    if (inlineSync || !inlineEditingComponentId || !schematicEditor) {
      return;
    }
    if (typeof schematicEditor.updateComponent === "function") {
      schematicEditor.updateComponent(inlineEditingComponentId, { value: inlineValueInput.value });
    }
  });
  inlineSwitchPositionA.addEventListener("click", () => {
    if (inlineSync) {
      return;
    }
    setInlineSwitchActiveThrow("A");
    commitInlineSwitchState({ activeThrow: "A" }, { resync: true });
  });
  inlineSwitchPositionB.addEventListener("click", () => {
    if (inlineSync) {
      return;
    }
    setInlineSwitchActiveThrow("B");
    commitInlineSwitchState({ activeThrow: "B" }, { resync: true });
  });
  inlineSwitchRonInput.addEventListener("input", () => {
    commitInlineSwitchState({ ron: inlineSwitchRonInput.value });
  });
  inlineSwitchRoffInput.addEventListener("input", () => {
    commitInlineSwitchState({ roff: inlineSwitchRoffInput.value });
  });
  inlineSwitchShowRonInput.addEventListener("change", () => {
    commitInlineSwitchState({ showRon: inlineSwitchShowRonInput.checked });
  });
  inlineSwitchShowRoffInput.addEventListener("change", () => {
    commitInlineSwitchState({ showRoff: inlineSwitchShowRoffInput.checked });
  });
  inlineProbeTypeSelect.addEventListener("change", () => {
    if (inlineSync || !inlineEditingComponentId || !schematicEditor) {
      return;
    }
    if (typeof schematicEditor.updateComponent !== "function") {
      return;
    }
    const component = getModelComponent(inlineEditingComponentId);
    if (!component || !isProbeType(component.type)) {
      return;
    }
    const updates = buildProbeTypeUpdate(component, inlineProbeTypeSelect.value);
    if (!updates) {
      return;
    }
    schematicEditor.updateComponent(inlineEditingComponentId, updates);
    const next = getModelComponent(inlineEditingComponentId);
    if (next) {
      syncInlineComponentEditor(next);
    }
  });
  inlineTextOnlyInput.addEventListener("change", () => {
    if (inlineSync || !inlineEditingComponentId || !schematicEditor) {
      return;
    }
    if (typeof schematicEditor.updateComponent === "function") {
      schematicEditor.updateComponent(inlineEditingComponentId, { textOnly: inlineTextOnlyInput.checked });
    }
  });
  inlineTextFontSelect.addEventListener("change", () => {
    if (inlineSync || !inlineEditingComponentId || !schematicEditor) {
      return;
    }
    if (typeof schematicEditor.updateComponent === "function") {
      schematicEditor.updateComponent(inlineEditingComponentId, { textFont: inlineTextFontSelect.value });
    }
  });
  inlineTextSizeInput.addEventListener("input", () => {
    if (inlineSync || !inlineEditingComponentId || !schematicEditor) {
      return;
    }
    if (typeof schematicEditor.updateComponent === "function") {
      schematicEditor.updateComponent(inlineEditingComponentId, { textSize: inlineTextSizeInput.value });
    }
  });
  inlineTextBoldInput.addEventListener("change", () => {
    if (inlineSync || !inlineEditingComponentId || !schematicEditor) {
      return;
    }
    if (typeof schematicEditor.updateComponent === "function") {
      schematicEditor.updateComponent(inlineEditingComponentId, { textBold: inlineTextBoldInput.checked });
    }
  });
  inlineTextItalicInput.addEventListener("change", () => {
    if (inlineSync || !inlineEditingComponentId || !schematicEditor) {
      return;
    }
    if (typeof schematicEditor.updateComponent === "function") {
      schematicEditor.updateComponent(inlineEditingComponentId, { textItalic: inlineTextItalicInput.checked });
    }
  });
  inlineTextUnderlineInput.addEventListener("change", () => {
    if (inlineSync || !inlineEditingComponentId || !schematicEditor) {
      return;
    }
    if (typeof schematicEditor.updateComponent === "function") {
      schematicEditor.updateComponent(inlineEditingComponentId, { textUnderline: inlineTextUnderlineInput.checked });
    }
  });

  const handleInlineEditorCloseKey = (event) => {
    if (!inlineEditingComponentId) {
      return;
    }
    const raw = String(event.key || "").toLowerCase();
    if (raw !== "enter" && raw !== "escape" && raw !== "esc") {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    closeInlineComponentEditor();
  };
  inlineNameInput.addEventListener("keydown", handleInlineEditorCloseKey);
  inlineValueInput.addEventListener("keydown", handleInlineEditorCloseKey);
  inlineSwitchPositionA.addEventListener("keydown", handleInlineEditorCloseKey);
  inlineSwitchPositionB.addEventListener("keydown", handleInlineEditorCloseKey);
  inlineSwitchRonInput.addEventListener("keydown", handleInlineEditorCloseKey);
  inlineSwitchRoffInput.addEventListener("keydown", handleInlineEditorCloseKey);
  inlineSwitchShowRonInput.addEventListener("keydown", handleInlineEditorCloseKey);
  inlineSwitchShowRoffInput.addEventListener("keydown", handleInlineEditorCloseKey);
  inlineProbeTypeSelect.addEventListener("keydown", handleInlineEditorCloseKey);
  inlineTextOnlyInput.addEventListener("keydown", handleInlineEditorCloseKey);
  inlineTextFontSelect.addEventListener("keydown", handleInlineEditorCloseKey);
  inlineTextSizeInput.addEventListener("keydown", handleInlineEditorCloseKey);
  inlineTextBoldInput.addEventListener("keydown", handleInlineEditorCloseKey);
  inlineTextItalicInput.addEventListener("keydown", handleInlineEditorCloseKey);
  inlineTextUnderlineInput.addEventListener("keydown", handleInlineEditorCloseKey);
  inlineNetColorPicker.swatches.forEach((swatchButton) => {
    swatchButton.addEventListener("keydown", handleInlineEditorCloseKey);
  });

  document.addEventListener("pointerdown", (event) => {
    if (!inlineEditingComponentId) {
      return;
    }
    if (inlineEditor.contains(event.target)) {
      return;
    }
    closeInlineComponentEditor();
  }, true);

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
  exportDialog.dataset.exportDialog = "png";
  exportDialog.setAttribute("role", "dialog");
  exportDialog.setAttribute("aria-modal", "true");
  exportDialog.hidden = true;
  const exportPanel = document.createElement("div");
  exportPanel.className = "modal-dialog";
  const exportTitle = document.createElement("div");
  exportTitle.className = "modal-title";
  exportTitle.textContent = "Export PNG";
  const exportBody = document.createElement("div");
  exportBody.className = "modal-body";
  const exportFilenameRow = document.createElement("label");
  exportFilenameRow.className = "modal-field";
  const exportFilenameLabel = document.createElement("span");
  exportFilenameLabel.textContent = "Filename";
  const exportFilenameInput = document.createElement("input");
  exportFilenameInput.type = "text";
  exportFilenameInput.dataset.exportFilename = "png";
  exportFilenameRow.append(exportFilenameLabel, exportFilenameInput);
  const scaleRow = document.createElement("label");
  scaleRow.className = "modal-field";
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
  const transparentLabel = document.createElement("span");
  transparentLabel.textContent = "Transparent background";
  const transparentCheck = document.createElement("input");
  transparentCheck.type = "checkbox";
  transparentCheck.dataset.exportTransparent = "1";
  transparentRow.append(transparentCheck, transparentLabel);
  exportBody.append(exportFilenameRow, scaleRow, transparentRow);
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

  const toFilenameLeaf = (value) => {
    const raw = String(value ?? "").trim();
    if (!raw) {
      return "";
    }
    const pieces = raw.split(/[\\/]+/);
    return pieces[pieces.length - 1] || "";
  };

  const withFilenameExtension = (value, extension, fallbackBase = "schematic") => {
    const normalizedExtension = String(extension ?? "").trim().replace(/^\./, "").toLowerCase() || "txt";
    const safeFallbackBase = toFilenameLeaf(fallbackBase) || "schematic";
    const safeBase = toFilenameLeaf(value) || safeFallbackBase;
    const suffix = `.${normalizedExtension}`;
    return safeBase.toLowerCase().endsWith(suffix) ? safeBase : `${safeBase}${suffix}`;
  };

  const stripFilenameExtension = (value) => {
    const leaf = toFilenameLeaf(value);
    if (!leaf) {
      return "";
    }
    return leaf.replace(/\.[^./\\]+$/, "");
  };

  const normalizeJsonFilename = (value) => withFilenameExtension(value, "json", "schematic");

  const downloadTextFile = (filename, text, mimeType = "application/json") => {
    const blob = new Blob([text], { type: mimeType });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 0);
  };

  const downloadCsvFile = (filename, text) => {
    downloadTextFile(filename, text, "text/csv");
  };

  const csvEscape = (value) => {
    if (value === null || value === undefined) {
      return "";
    }
    let text = String(value);
    if (text.includes("\"")) {
      text = text.replace(/\"/g, "\"\"");
    }
    if (text.includes(",") || text.includes("\n")) {
      text = `"${text}"`;
    }
    return text;
  };

  const buildCsvText = (headers, rows) => {
    const lines = [];
    lines.push(headers.map(csvEscape).join(","));
    rows.forEach((row) => {
      lines.push(row.map(csvEscape).join(","));
    });
    return lines.join("\n");
  };

  const getSignalUnit = (signal) => {
    if (!signal) {
      return "";
    }
    const text = String(signal).trim().toLowerCase();
    if (text.startsWith("i(") || text.endsWith("#branch")) {
      return "A";
    }
    return "V";
  };

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
    const allowed = new Set(["1", "2", "3", "4"]);
    const scaleValue = allowed.has(String(exportPngPrefs.scale)) ? String(exportPngPrefs.scale) : "2";
    scaleSelect.value = scaleValue;
    transparentCheck.checked = Boolean(exportPngPrefs.transparent);
    exportFilenameInput.value = buildSchematicFilename("png");
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
    const nextScale = Number(scaleSelect.value);
    exportPngPrefs.scale = Number.isFinite(nextScale) && nextScale > 0 ? nextScale : 2;
    exportPngPrefs.transparent = Boolean(transparentCheck.checked);
    const filename = normalizePngFilename(exportFilenameInput.value);
    persistExportPngPrefs();
    closeExportDialog();
    exportSchematicPng(getExportScale(exportPngPrefs.scale), exportPngPrefs.transparent, filename);
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

  const showContextMenu = (event) => {
    if (!schematicMode) {
      return;
    }
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
    contextMenu.classList.remove("open");
  };

  schematicCanvasWrap.addEventListener("contextmenu", showContextMenu);
  document.addEventListener("click", (event) => {
    if (!contextMenu.contains(event.target)) {
      hideContextMenu();
    }
    if (!titleBar.contains(event.target)) {
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
  dcExportButton.addEventListener("click", () => exportPlotPng(dcCanvas, buildPlotPngFilename("dc")));
  dcExportCsvButton.addEventListener("click", exportDcCsv);
  tranExportButton.addEventListener("click", () => exportPlotPng(tranCanvas, buildPlotPngFilename("tran")));
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
    if (!plot || typeof plot.renderPlot !== "function") {
      canvasEl.getContext("2d")?.clearRect(0, 0, canvasEl.width, canvasEl.height);
      return;
    }
    plot.renderPlot(canvasEl, {
      series,
      grid: showGrid,
      fontScale: plotPrefs.fontScale,
      lineWidth: plotPrefs.lineWidth,
      xLabel,
      yLabel,
      ...(xTickFormat ? { xTickFormat } : {})
    });
  };

  const renderDcResults = (results) => {
    renderSingleAxisPlotResults({
      results,
      signalSelectEl: signalSelect,
      colorMap: colorMaps.dc,
      metaEl: dcMeta,
      canvasEl: dcCanvas,
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
    [dcPlotWrap, tranPlotWrap, acMagWrap, acPhaseWrap].forEach((wrap) => {
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
    const kind = getActiveResultsKind();
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
        label.textContent = entry.isProbe
          ? `${entry.label}: `
          : `${entry.id} (${entry.label}): `;
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
      errorEl.textContent = message ?? "";
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
      renderDcResults(results);
      refreshMeasurements();
      syncTraceHighlightsFromSchematicSelection();
      queueAutosave(false);
    },
    setTranResults: (results) => {
      state.tranResults = results;
      lastRunKind = "tran";
      syncProbeSignalDisplayLabelMap();
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


