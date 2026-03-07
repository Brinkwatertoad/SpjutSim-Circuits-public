(function initPersistence() {
  const RECENT_KEY = "spjutsim:recent-info";
  const AUTOSAVE_KEY = "autosave";
  const LOCAL_AUTOSAVE_KEY = "spjutsim:autosave-doc";
  const PREFERENCE_NAMES = Object.freeze({
    EXPORT_PNG_SCALE: "exportPngScale",
    EXPORT_PNG_TRANSPARENT: "exportPngTransparent",
    EXPORT_DIAGRAM_FORMAT: "exportDiagramFormat",
    PLOT_FONT_SCALE: "plotFontScale",
    PLOT_LINE_WIDTH: "plotLineWidth",
    PLOT_IP_DISPLAY: "plotIpDisplay"
  });
  const PREFERENCE_KEY_BY_NAME = Object.freeze({
    [PREFERENCE_NAMES.EXPORT_PNG_SCALE]: "spjutsim:export-png-scale",
    [PREFERENCE_NAMES.EXPORT_PNG_TRANSPARENT]: "spjutsim:export-png-transparent",
    [PREFERENCE_NAMES.EXPORT_DIAGRAM_FORMAT]: "spjutsim:export-diagram-format",
    [PREFERENCE_NAMES.PLOT_FONT_SCALE]: "spjutsim:plot-font-scale",
    [PREFERENCE_NAMES.PLOT_LINE_WIDTH]: "spjutsim:plot-line-width",
    [PREFERENCE_NAMES.PLOT_IP_DISPLAY]: "spjutsim:plot-ip-display"
  });
  const DB_NAME = "spjutsim";
  const DB_VERSION = 1;
  const STORE_NAME = "autosave";
  const RESULTS_PANE_MODES = new Set(["hidden", "split", "expanded", "empty"]);
  const DEFAULT_RESULTS_PANE_MODE = "hidden";
  const DEFAULT_RESULTS_PANE_SPLIT_RATIO = 0.5;
  const MIN_RESULTS_PANE_SPLIT_RATIO = 0.25;
  const MAX_RESULTS_PANE_SPLIT_RATIO = 0.75;
  const DEFAULT_AUTO_SWITCH_TO_SELECT_ON_PLACE = true;
  const DEFAULT_AUTO_SWITCH_TO_SELECT_ON_WIRE = false;
  const DEFAULT_SCHEMATIC_TEXT_STYLE = Object.freeze({
    font: "Segoe UI",
    size: 12,
    bold: false,
    italic: false
  });
  const MIN_SCHEMATIC_TEXT_SIZE = 8;
  const MAX_SCHEMATIC_TEXT_SIZE = 72;

  const nowIso = () => new Date().toISOString();
  const getSchematicApi = () => (typeof self !== "undefined" ? (self.SpjutSimSchematic ?? null) : null);
  const requireSchematicMethod = (name) => {
    const api = getSchematicApi();
    const method = api?.[name];
    if (typeof method !== "function") {
      throw new Error(`Schematic API missing '${name}'. Check src/schematic/model.js load order.`);
    }
    return method.bind(api);
  };
  const normalizeComponentDefaults = (value, fallback) => {
    return requireSchematicMethod("normalizeComponentDefaults")(value, fallback);
  };
  const normalizeNetColor = (value) => {
    return requireSchematicMethod("normalizeNetColor")(value);
  };
  const normalizeResistorStyle = (value) => {
    return requireSchematicMethod("normalizeResistorStyle")(value);
  };
  const normalizeGroundVariant = (value) => {
    return requireSchematicMethod("normalizeGroundVariant")(value);
  };
  const normalizeToolDisplayDefaults = (value, fallback) => {
    const source = value && typeof value === "object" ? value : {};
    const base = fallback && typeof fallback === "object"
      ? fallback
      : { resistorStyle: "zigzag", groundVariant: "earth", groundColor: null };
    return {
      resistorStyle: normalizeResistorStyle(
        Object.prototype.hasOwnProperty.call(source, "resistorStyle")
          ? source.resistorStyle
          : base.resistorStyle
      ),
      groundVariant: normalizeGroundVariant(
        Object.prototype.hasOwnProperty.call(source, "groundVariant")
          ? source.groundVariant
          : base.groundVariant
      ),
      groundColor: normalizeWireDefaultColor(
        Object.prototype.hasOwnProperty.call(source, "groundColor")
          ? source.groundColor
          : undefined,
        base.groundColor
      )
    };
  };
  const normalizeWireDefaultColor = (value, fallback = null) => {
    if (value === undefined) {
      return normalizeNetColor(fallback) ?? null;
    }
    if (value === null || String(value ?? "").trim() === "") {
      return null;
    }
    const normalized = normalizeNetColor(value);
    if (normalized) {
      return normalized;
    }
    return normalizeNetColor(fallback) ?? null;
  };

  const resolvePreferenceKey = (name) => {
    const normalized = String(name ?? "").trim();
    if (!normalized || !Object.prototype.hasOwnProperty.call(PREFERENCE_KEY_BY_NAME, normalized)) {
      throw new Error(`Unknown preference name '${normalized}'.`);
    }
    return PREFERENCE_KEY_BY_NAME[normalized];
  };

  const readPreferenceRaw = (name) => {
    const key = resolvePreferenceKey(name);
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  };

  const readNumberPreference = (name, fallback) => {
    const raw = readPreferenceRaw(name);
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : fallback;
  };

  const readStringPreference = (name, fallback) => {
    const raw = readPreferenceRaw(name);
    return typeof raw === "string" ? raw : fallback;
  };

  const readBooleanPreference = (name, fallback) => {
    const raw = readPreferenceRaw(name);
    if (raw === null) {
      return fallback;
    }
    return raw === "true";
  };

  const writePreference = (name, value) => {
    const key = resolvePreferenceKey(name);
    try {
      localStorage.setItem(key, String(value));
      return true;
    } catch {
      return false;
    }
  };

  const clone = (value) => {
    try {
      return JSON.parse(JSON.stringify(value));
    } catch {
      return null;
    }
  };

  const normalizeResultsPaneMode = (value) => {
    const mode = String(value ?? "").trim().toLowerCase();
    return RESULTS_PANE_MODES.has(mode) ? mode : DEFAULT_RESULTS_PANE_MODE;
  };

  const normalizeResultsPaneSplitRatio = (value) => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      return DEFAULT_RESULTS_PANE_SPLIT_RATIO;
    }
    return Math.min(MAX_RESULTS_PANE_SPLIT_RATIO, Math.max(MIN_RESULTS_PANE_SPLIT_RATIO, parsed));
  };
  const normalizeSchematicTextFont = (value) => {
    if (typeof value !== "string") {
      return DEFAULT_SCHEMATIC_TEXT_STYLE.font;
    }
    const trimmed = value.trim();
    return trimmed || DEFAULT_SCHEMATIC_TEXT_STYLE.font;
  };
  const normalizeSchematicTextSize = (value) => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      return DEFAULT_SCHEMATIC_TEXT_STYLE.size;
    }
    const rounded = Math.round(parsed);
    if (rounded < MIN_SCHEMATIC_TEXT_SIZE) {
      return MIN_SCHEMATIC_TEXT_SIZE;
    }
    if (rounded > MAX_SCHEMATIC_TEXT_SIZE) {
      return MAX_SCHEMATIC_TEXT_SIZE;
    }
    return rounded;
  };
  const normalizeSchematicTextStyle = (value) => {
    const source = value && typeof value === "object" ? value : {};
    return {
      font: normalizeSchematicTextFont(source.font),
      size: normalizeSchematicTextSize(source.size),
      bold: source.bold === true,
      italic: source.italic === true
    };
  };

  const createDocument = (options) => {
    const meta = options?.meta ?? {};
    const createdAt = meta.createdAt || nowIso();
    const updatedAt = nowIso();
    const title = typeof meta.title === "string" ? meta.title : "";
    const schematic = options?.schematic ?? {};
    const editor = options?.editor ?? {};
    const simulation = options?.simulation ?? {};
    const results = options?.results;
    const ui = options?.ui ?? {};
    const uiPlot = ui?.plot ?? {};
    const uiResultsPane = ui?.resultsPane ?? {};
    const uiSettings = ui?.settings ?? {};
    const showGrid = typeof uiPlot.showGrid === "boolean" ? uiPlot.showGrid : false;
    const resultsPaneMode = normalizeResultsPaneMode(uiResultsPane.mode);
    const resultsPaneSplitRatio = normalizeResultsPaneSplitRatio(uiResultsPane.splitRatio);
    const autoSwitchToSelectOnPlace = typeof uiSettings.autoSwitchToSelectOnPlace === "boolean"
      ? uiSettings.autoSwitchToSelectOnPlace
      : DEFAULT_AUTO_SWITCH_TO_SELECT_ON_PLACE;
    const autoSwitchToSelectOnWire = typeof uiSettings.autoSwitchToSelectOnWire === "boolean"
      ? uiSettings.autoSwitchToSelectOnWire
      : DEFAULT_AUTO_SWITCH_TO_SELECT_ON_WIRE;
    const schematicText = normalizeSchematicTextStyle(uiSettings.schematicText);
    const componentDefaults = normalizeComponentDefaults(uiSettings.componentDefaults);
    const toolDisplayDefaults = normalizeToolDisplayDefaults(uiSettings.toolDisplayDefaults);
    const wireDefaultColor = normalizeWireDefaultColor(uiSettings.wireDefaultColor);
    const doc = {
      schema: "spjutsim/schematic",
      version: 1,
      title,
      createdAt,
      updatedAt,
      schematic: {
        components: clone(schematic.components ?? []) ?? [],
        wires: clone(schematic.wires ?? []) ?? []
      },
      editor: {
        view: clone(editor.view ?? null),
        selection: clone(editor.selection ?? { componentIds: [], wireIds: [] }),
        grid: clone(editor.grid ?? null)
      },
      simulation: {
        config: clone(simulation.config ?? null),
        preamble: typeof simulation.preamble === "string" ? simulation.preamble : ""
      },
      ui: {
        plot: {
          showGrid
        },
        resultsPane: {
          mode: resultsPaneMode,
          splitRatio: resultsPaneSplitRatio
        },
        settings: {
          autoSwitchToSelectOnPlace,
          autoSwitchToSelectOnWire,
          schematicText,
          componentDefaults,
          toolDisplayDefaults,
          wireDefaultColor
        }
      }
    };
    if (options?.includeResults) {
      doc.results = clone(results ?? null);
    }
    return doc;
  };

  const extractDocument = (doc) => {
    if (!doc || typeof doc !== "object") {
      return null;
    }
    if (doc.schema !== "spjutsim/schematic") {
      return null;
    }
    const version = Number(doc.version);
    if (!Number.isFinite(version) || version !== 1) {
      return null;
    }
    const showGrid = doc.ui?.plot?.showGrid;
    const resultsPaneMode = normalizeResultsPaneMode(doc.ui?.resultsPane?.mode);
    const resultsPaneSplitRatio = normalizeResultsPaneSplitRatio(doc.ui?.resultsPane?.splitRatio);
    const autoSwitchToSelectOnPlace = doc.ui?.settings?.autoSwitchToSelectOnPlace;
    const autoSwitchToSelectOnWire = doc.ui?.settings?.autoSwitchToSelectOnWire;
    const rawSchematicText = doc.ui?.settings?.schematicText;
    const schematicText = rawSchematicText && typeof rawSchematicText === "object"
      ? {
        font: typeof rawSchematicText.font === "string"
          ? normalizeSchematicTextFont(rawSchematicText.font)
          : null,
        size: Number.isFinite(Number(rawSchematicText.size))
          ? normalizeSchematicTextSize(rawSchematicText.size)
          : null,
        bold: typeof rawSchematicText.bold === "boolean"
          ? rawSchematicText.bold
          : null,
        italic: typeof rawSchematicText.italic === "boolean"
          ? rawSchematicText.italic
          : null
      }
      : {
        font: null,
        size: null,
        bold: null,
        italic: null
      };
    const componentDefaults = normalizeComponentDefaults(doc.ui?.settings?.componentDefaults);
    const toolDisplayDefaults = normalizeToolDisplayDefaults(doc.ui?.settings?.toolDisplayDefaults);
    const wireDefaultColor = normalizeWireDefaultColor(doc.ui?.settings?.wireDefaultColor);
    return {
      meta: {
        title: typeof doc.title === "string" ? doc.title : "",
        createdAt: typeof doc.createdAt === "string" ? doc.createdAt : "",
        updatedAt: typeof doc.updatedAt === "string" ? doc.updatedAt : ""
      },
      schematic: {
        components: Array.isArray(doc.schematic?.components) ? doc.schematic.components : [],
        wires: Array.isArray(doc.schematic?.wires) ? doc.schematic.wires : []
      },
      editor: {
        view: doc.editor?.view ?? null,
        selection: doc.editor?.selection ?? null,
        grid: doc.editor?.grid ?? null
      },
      simulation: {
        config: doc.simulation?.config ?? null,
        preamble: typeof doc.simulation?.preamble === "string" ? doc.simulation.preamble : ""
      },
      ui: {
        plot: {
          showGrid: typeof showGrid === "boolean" ? showGrid : null
        },
        resultsPane: {
          mode: resultsPaneMode,
          splitRatio: resultsPaneSplitRatio
        },
        settings: {
          autoSwitchToSelectOnPlace: typeof autoSwitchToSelectOnPlace === "boolean" ? autoSwitchToSelectOnPlace : null,
          autoSwitchToSelectOnWire: typeof autoSwitchToSelectOnWire === "boolean" ? autoSwitchToSelectOnWire : null,
          schematicText,
          componentDefaults,
          toolDisplayDefaults,
          wireDefaultColor
        }
      },
      results: doc.results ?? null
    };
  };

  const openDb = () => new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB unavailable"));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("IndexedDB open failed"));
  });

  const withStore = async (mode, fn) => {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      let result;
      let request;
      const tx = db.transaction(STORE_NAME, mode);
      const store = tx.objectStore(STORE_NAME);
      try {
        request = fn(store);
      } catch (err) {
        db.close();
        reject(err);
        return;
      }
      if (request && typeof request.onsuccess === "function") {
        request.onsuccess = () => {
          result = request.result;
        };
        request.onerror = () => {
          tx.abort();
        };
      }
      tx.oncomplete = () => {
        db.close();
        resolve(result);
      };
      tx.onabort = () => {
        db.close();
        reject(request?.error || new Error("IndexedDB transaction aborted"));
      };
      tx.onerror = () => {
        db.close();
        reject(request?.error || new Error("IndexedDB transaction failed"));
      };
    });
  };

  const saveAutosaveFallback = (doc) => {
    try {
      localStorage.setItem(LOCAL_AUTOSAVE_KEY, JSON.stringify(doc));
      return true;
    } catch {
      return false;
    }
  };

  const loadAutosaveFallback = () => {
    try {
      const raw = localStorage.getItem(LOCAL_AUTOSAVE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  };

  const parseUpdatedAt = (doc) => {
    const stamp = Date.parse(doc?.updatedAt ?? "");
    return Number.isFinite(stamp) ? stamp : 0;
  };

  const saveAutosave = async (doc) => {
    if (!doc) {
      return false;
    }
    let idbOk = false;
    try {
      await withStore("readwrite", (store) => store.put(doc, AUTOSAVE_KEY));
      idbOk = true;
    } catch {
      idbOk = false;
    }
    const localOk = saveAutosaveFallback(doc);
    return idbOk || localOk;
  };

  const loadAutosave = async () => {
    let idbDoc = null;
    try {
      idbDoc = await withStore("readonly", (store) => store.get(AUTOSAVE_KEY));
    } catch {
      idbDoc = null;
    }
    const localDoc = loadAutosaveFallback();
    if (idbDoc && localDoc) {
      const idbTime = parseUpdatedAt(idbDoc);
      const localTime = parseUpdatedAt(localDoc);
      if (idbTime && localTime) {
        return idbTime >= localTime ? idbDoc : localDoc;
      }
      if (idbTime) {
        return idbDoc;
      }
      if (localTime) {
        return localDoc;
      }
      return idbDoc;
    }
    return idbDoc || localDoc;
  };

  const setRecentInfo = (info) => {
    const payload = {
      lastOpenedName: typeof info?.lastOpenedName === "string" ? info.lastOpenedName : "",
      lastAutosaveKey: typeof info?.lastAutosaveKey === "string" ? info.lastAutosaveKey : AUTOSAVE_KEY,
      updatedAt: nowIso()
    };
    try {
      localStorage.setItem(RECENT_KEY, JSON.stringify(payload));
    } catch {
    }
    return payload;
  };

  const getRecentInfo = () => {
    try {
      const raw = localStorage.getItem(RECENT_KEY);
      if (!raw) {
        return {
          lastOpenedName: "",
          lastAutosaveKey: AUTOSAVE_KEY,
          updatedAt: ""
        };
      }
      const parsed = JSON.parse(raw);
      return {
        lastOpenedName: typeof parsed?.lastOpenedName === "string" ? parsed.lastOpenedName : "",
        lastAutosaveKey: typeof parsed?.lastAutosaveKey === "string" ? parsed.lastAutosaveKey : AUTOSAVE_KEY,
        updatedAt: typeof parsed?.updatedAt === "string" ? parsed.updatedAt : ""
      };
    } catch {
      return {
        lastOpenedName: "",
        lastAutosaveKey: AUTOSAVE_KEY,
        updatedAt: ""
      };
    }
  };

  const clearRecentInfo = () => {
    try {
      localStorage.removeItem(RECENT_KEY);
    } catch {
    }
  };

  self.SpjutSimPersistence = {
    AUTOSAVE_KEY,
    PREFERENCE_NAMES,
    createDocument,
    extractDocument,
    saveAutosave,
    loadAutosave,
    readNumberPreference,
    readStringPreference,
    readBooleanPreference,
    writePreference,
    setRecentInfo,
    getRecentInfo,
    clearRecentInfo
  };
})();
