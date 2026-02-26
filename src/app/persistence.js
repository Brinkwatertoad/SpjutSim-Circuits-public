(function initPersistence() {
  const RECENT_KEY = "spjutsim:recent-info";
  const AUTOSAVE_KEY = "autosave";
  const LOCAL_AUTOSAVE_KEY = "spjutsim:autosave-doc";
  const PREFERENCE_NAMES = Object.freeze({
    EXPORT_PNG_SCALE: "exportPngScale",
    EXPORT_PNG_TRANSPARENT: "exportPngTransparent",
    PLOT_FONT_SCALE: "plotFontScale",
    PLOT_LINE_WIDTH: "plotLineWidth"
  });
  const PREFERENCE_KEY_BY_NAME = Object.freeze({
    [PREFERENCE_NAMES.EXPORT_PNG_SCALE]: "spjutsim:export-png-scale",
    [PREFERENCE_NAMES.EXPORT_PNG_TRANSPARENT]: "spjutsim:export-png-transparent",
    [PREFERENCE_NAMES.PLOT_FONT_SCALE]: "spjutsim:plot-font-scale",
    [PREFERENCE_NAMES.PLOT_LINE_WIDTH]: "spjutsim:plot-line-width"
  });
  const DB_NAME = "spjutsim";
  const DB_VERSION = 1;
  const STORE_NAME = "autosave";
  const RESULTS_PANE_MODES = new Set(["hidden", "split", "expanded"]);
  const DEFAULT_RESULTS_PANE_MODE = "hidden";
  const DEFAULT_RESULTS_PANE_SPLIT_RATIO = 0.5;
  const MIN_RESULTS_PANE_SPLIT_RATIO = 0.25;
  const MAX_RESULTS_PANE_SPLIT_RATIO = 0.75;

  const nowIso = () => new Date().toISOString();

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
    const showGrid = typeof uiPlot.showGrid === "boolean" ? uiPlot.showGrid : false;
    const resultsPaneMode = normalizeResultsPaneMode(uiResultsPane.mode);
    const resultsPaneSplitRatio = normalizeResultsPaneSplitRatio(uiResultsPane.splitRatio);
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
    readBooleanPreference,
    writePreference,
    setRecentInfo,
    getRecentInfo,
    clearRecentInfo
  };
})();
