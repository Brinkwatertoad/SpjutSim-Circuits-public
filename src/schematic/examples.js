/**
 * Schematic example loader.
 * Examples are persisted as regular schematic save files under /examples/*.json.
 */

(function initSchematicExamples() {
  const api = typeof self !== "undefined" ? (self.SpjutSimSchematic ?? {}) : {};
  const persistenceApi = typeof self !== "undefined" ? (self.SpjutSimPersistence ?? null) : null;
  const EXAMPLE_LIST_ENDPOINT = "/__examples__/list";
  const EXAMPLES_BASE_PATH = "./examples/";
  const EXAMPLES_INDEX_PATH = `${EXAMPLES_BASE_PATH}index.json`;
  const SCHEMATIC_EXAMPLES = {};
  const exampleEntries = [];
  const listeners = new Set();
  let examplesLoaded = false;
  let exampleLoadError = null;
  let loadPromise = null;

  const clone = (value) => JSON.parse(JSON.stringify(value));

  const clearExampleStore = () => {
    Object.keys(SCHEMATIC_EXAMPLES).forEach((key) => {
      delete SCHEMATIC_EXAMPLES[key];
    });
    exampleEntries.length = 0;
  };

  const toLabelFromId = (id) => {
    const clean = String(id ?? "").replace(/[_-]+/g, " ").trim();
    if (!clean) {
      return "";
    }
    return clean.replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const getExampleIdFromFile = (fileName) => String(fileName ?? "").replace(/\.json$/i, "").trim();

  const normalizeDiscoveredExampleFile = (entry) => {
    const raw = String(entry ?? "").trim();
    if (!raw) {
      return "";
    }
    const withoutQuery = raw.split(/[?#]/)[0];
    let decoded = withoutQuery;
    try {
      decoded = decodeURIComponent(withoutQuery);
    } catch {
      decoded = withoutQuery;
    }
    const normalizedPath = decoded.replace(/\\/g, "/");
    const fileName = normalizedPath.includes("/")
      ? normalizedPath.split("/").pop()
      : normalizedPath;
    const clean = String(fileName ?? "").trim();
    if (!/^[^/\\]+\.json$/i.test(clean)) {
      return "";
    }
    if (clean.toLowerCase() === "index.json") {
      return "";
    }
    return clean;
  };

  const normalizeExampleFileName = (fileName) => {
    const normalized = normalizeDiscoveredExampleFile(fileName);
    if (!normalized) {
      throw new Error(`Invalid example filename '${String(fileName ?? "")}'. Expected *.json`);
    }
    return normalized;
  };

  const readEmbeddedExampleDocuments = () => {
    const embedded = typeof self !== "undefined" ? self.SpjutSimEmbeddedExamples : null;
    const docs = Array.isArray(embedded?.documents) ? embedded.documents : [];
    const normalized = [];
    docs.forEach((entry) => {
      const fileName = normalizeDiscoveredExampleFile(entry?.file);
      if (!fileName) {
        return;
      }
      const doc = entry?.doc;
      if (!doc || typeof doc !== "object") {
        return;
      }
      normalized.push({
        file: fileName,
        doc: clone(doc)
      });
    });
    return normalized;
  };

  const listUniqueFiles = (...fileLists) => {
    const set = new Set();
    fileLists.forEach((files) => {
      if (!Array.isArray(files)) {
        return;
      }
      files.forEach((fileName) => {
        const normalized = normalizeDiscoveredExampleFile(fileName);
        if (normalized) {
          set.add(normalized);
        }
      });
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  };

  const parseExampleFileList = (payload) => {
    const files = Array.isArray(payload?.files) ? payload.files : [];
    const normalized = files
      .map((entry) => normalizeDiscoveredExampleFile(entry))
      .filter(Boolean);
    return Array.from(new Set(normalized)).sort((a, b) => a.localeCompare(b));
  };

  const parseExampleFileListFromDirectoryHtml = (html) => {
    const text = String(html ?? "");
    const matches = text.matchAll(/href\s*=\s*["']([^"']+)["']/gi);
    const files = [];
    for (const match of matches) {
      const candidate = normalizeDiscoveredExampleFile(match?.[1] ?? "");
      if (candidate) {
        files.push(candidate);
      }
    }
    return Array.from(new Set(files)).sort((a, b) => a.localeCompare(b));
  };

  const fetchExampleFileList = async () => {
    const protocol = typeof self !== "undefined" && self.location ? self.location.protocol : "";
    const embeddedDocs = readEmbeddedExampleDocuments();
    if (protocol === "file:") {
      if (embeddedDocs.length) {
        return embeddedDocs.map((entry) => entry.file);
      }
    }

    const discoveryErrors = [];

    try {
      const response = await fetch(EXAMPLE_LIST_ENDPOINT, { cache: "no-store" });
      if (response.ok) {
        const payload = await response.json();
        return listUniqueFiles(parseExampleFileList(payload));
      }
      discoveryErrors.push(`list-endpoint:${response.status}`);
    } catch (error) {
      discoveryErrors.push(`list-endpoint:${error instanceof Error ? error.message : String(error ?? "error")}`);
    }

    try {
      const response = await fetch(EXAMPLES_INDEX_PATH, { cache: "no-store" });
      if (response.ok) {
        const payload = await response.json();
        const files = parseExampleFileList(payload);
        if (files.length) {
          return listUniqueFiles(files);
        }
      } else {
        discoveryErrors.push(`index-manifest:${response.status}`);
      }
    } catch (error) {
      discoveryErrors.push(`index-manifest:${error instanceof Error ? error.message : String(error ?? "error")}`);
    }

    try {
      const response = await fetch(EXAMPLES_BASE_PATH, { cache: "no-store" });
      if (response.ok) {
        const html = await response.text();
        const files = parseExampleFileListFromDirectoryHtml(html);
        if (files.length) {
          return listUniqueFiles(files);
        }
      } else {
        discoveryErrors.push(`directory-listing:${response.status}`);
      }
    } catch (error) {
      discoveryErrors.push(`directory-listing:${error instanceof Error ? error.message : String(error ?? "error")}`);
    }

    if (embeddedDocs.length) {
      return embeddedDocs.map((entry) => entry.file);
    }

    throw new Error(`Example discovery failed (${discoveryErrors.join("; ")}).`);
  };

  const normalizeExampleDocument = (doc, fileName) => {
    if (!persistenceApi || typeof persistenceApi.extractDocument !== "function") {
      throw new Error("Persistence API missing extractDocument().");
    }
    const extracted = persistenceApi.extractDocument(doc);
    if (!extracted) {
      throw new Error(`Invalid schematic example document: ${fileName}`);
    }
    const id = getExampleIdFromFile(fileName);
    if (!id) {
      throw new Error(`Example filename must resolve to an id: ${fileName}`);
    }
    const title = String(extracted.meta?.title ?? "").trim();
    const label = title || toLabelFromId(id) || id.toUpperCase();
    const description = typeof doc?.description === "string" ? doc.description.trim() : "";
    const simulationConfig = extracted.simulation?.config && typeof extracted.simulation.config === "object"
      ? clone(extracted.simulation.config)
      : {};
    if (Array.isArray(simulationConfig.save?.signals)) {
      simulationConfig.saveSignals = simulationConfig.save.signals.slice();
    }
    const preamble = typeof extracted.simulation?.preamble === "string"
      ? extracted.simulation.preamble
      : "";
    if (preamble) {
      simulationConfig.preamble = preamble;
    }
    return {
      id,
      label,
      description,
      file: fileName,
      components: clone(extracted.schematic?.components ?? []),
      wires: clone(extracted.schematic?.wires ?? []),
      simulation: simulationConfig
    };
  };

  const fetchExampleDocument = async (fileName) => {
    const encodedName = encodeURIComponent(fileName);
    const url = `${EXAMPLES_BASE_PATH}${encodedName}`;
    try {
      const response = await fetch(url, { cache: "no-store" });
      if (response.ok) {
        const doc = await response.json();
        return normalizeExampleDocument(doc, fileName);
      }
    } catch {
      // Fall back to embedded examples when network fetch is unavailable.
    }
    const knownDocs = readEmbeddedExampleDocuments();
    const knownMatch = knownDocs.find((entry) => entry.file === fileName);
    if (knownMatch) {
      return normalizeExampleDocument(knownMatch.doc, fileName);
    }
    throw new Error(`Failed to fetch example file '${fileName}'.`);
  };

  const upsertEmbeddedSchematicExampleDocument = (fileName, doc) => {
    if (!doc || typeof doc !== "object") {
      throw new Error("Example document payload must be an object.");
    }
    const normalizedFile = normalizeExampleFileName(fileName);
    const docs = readEmbeddedExampleDocuments().filter((entry) => entry.file !== normalizedFile);
    docs.push({
      file: normalizedFile,
      doc: clone(doc)
    });
    docs.sort((a, b) => String(a.file).localeCompare(String(b.file)));
    const payload = {
      generatedAt: new Date().toISOString(),
      documents: docs.map((entry) => ({
        file: entry.file,
        doc: clone(entry.doc)
      }))
    };
    if (typeof self !== "undefined") {
      self.SpjutSimEmbeddedExamples = payload;
    }
    return payload;
  };

  const buildEmbeddedSchematicExamplesBundle = () => {
    const docs = readEmbeddedExampleDocuments().sort((a, b) => String(a.file).localeCompare(String(b.file)));
    const payload = {
      generatedAt: new Date().toISOString(),
      documents: docs.map((entry) => ({
        file: entry.file,
        doc: clone(entry.doc)
      }))
    };
    if (typeof self !== "undefined") {
      self.SpjutSimEmbeddedExamples = payload;
    }
    const json = JSON.stringify(payload, null, 2);
    return [
      "/* Auto-generated from examples/*.json for file:// fallback. */",
      "(function initEmbeddedExamples() {",
      `  self.SpjutSimEmbeddedExamples = ${json};`,
      "})();",
      ""
    ].join("\n");
  };

  const notifyListeners = () => {
    const snapshot = exampleEntries.map((entry) => ({
      id: entry.id,
      label: entry.label,
      file: entry.file
    }));
    listeners.forEach((listener) => {
      try {
        listener(snapshot);
      } catch (error) {
        console.error("Schematic examples listener error.", error);
      }
    });
  };

  const replaceExamples = (entries) => {
    clearExampleStore();
    entries.forEach((entry) => {
      if (SCHEMATIC_EXAMPLES[entry.id]) {
        throw new Error(`Duplicate schematic example id '${entry.id}'.`);
      }
      SCHEMATIC_EXAMPLES[entry.id] = entry;
      exampleEntries.push({
        id: entry.id,
        label: entry.label,
        file: entry.file
      });
    });
    exampleEntries.sort((a, b) => String(a.file).localeCompare(String(b.file)));
  };

  const upsertLoadedExample = (entry) => {
    SCHEMATIC_EXAMPLES[entry.id] = entry;
    const summary = {
      id: entry.id,
      label: entry.label,
      file: entry.file
    };
    const index = exampleEntries.findIndex((item) => String(item.id) === String(entry.id));
    if (index >= 0) {
      exampleEntries[index] = summary;
    } else {
      exampleEntries.push(summary);
    }
    exampleEntries.sort((a, b) => String(a.file).localeCompare(String(b.file)));
  };

  const listSchematicExamples = () => exampleEntries.map((entry) => ({
    id: entry.id,
    label: entry.label,
    file: entry.file
  }));

  const loadSchematicExamples = async ({ force = false } = {}) => {
    if (examplesLoaded && !force) {
      return listSchematicExamples();
    }
    if (loadPromise && !force) {
      return loadPromise;
    }
    loadPromise = (async () => {
      const files = await fetchExampleFileList();
      const entries = await Promise.all(files.map((fileName) => fetchExampleDocument(fileName)));
      replaceExamples(entries);
      examplesLoaded = true;
      exampleLoadError = null;
      notifyListeners();
      return listSchematicExamples();
    })()
      .catch((error) => {
        clearExampleStore();
        examplesLoaded = false;
        exampleLoadError = error instanceof Error ? error : new Error(String(error ?? "Unknown error"));
        notifyListeners();
        throw exampleLoadError;
      })
      .finally(() => {
        loadPromise = null;
      });
    return loadPromise;
  };

  const applySchematicExample = (model, exampleId) => {
    if (!model) {
      return null;
    }
    const key = String(exampleId ?? "").trim();
    const example = SCHEMATIC_EXAMPLES[key];
    if (!example) {
      return null;
    }
    const addComponent = typeof api.addComponent === "function" ? api.addComponent : null;
    const addWire = typeof api.addWire === "function" ? api.addWire : null;
    if (!addComponent || !addWire) {
      return null;
    }
    if (!Array.isArray(model.components)) {
      model.components = [];
    }
    if (!Array.isArray(model.wires)) {
      model.wires = [];
    }
    model.components.length = 0;
    model.wires.length = 0;
    example.components.forEach((component) => {
      addComponent(model, clone(component));
    });
    example.wires.forEach((wire) => {
      addWire(model, clone(wire));
    });
    return {
      exampleId: key,
      example,
      file: example.file,
      config: clone(example.simulation ?? null)
    };
  };

  const getSchematicExample = (exampleId) => {
    const key = String(exampleId ?? "").trim();
    return SCHEMATIC_EXAMPLES[key] ?? null;
  };

  const registerSchematicExampleDocument = (fileName, doc) => {
    const normalizedFile = normalizeExampleFileName(fileName);
    const entry = normalizeExampleDocument(doc, normalizedFile);
    upsertLoadedExample(entry);
    examplesLoaded = true;
    exampleLoadError = null;
    notifyListeners();
    return {
      id: entry.id,
      label: entry.label,
      file: entry.file
    };
  };

  const removeSchematicExample = (exampleId) => {
    const key = String(exampleId ?? "").trim();
    if (!key || !SCHEMATIC_EXAMPLES[key]) {
      return null;
    }
    const removed = SCHEMATIC_EXAMPLES[key];
    delete SCHEMATIC_EXAMPLES[key];
    const index = exampleEntries.findIndex((entry) => String(entry.id) === key);
    if (index >= 0) {
      exampleEntries.splice(index, 1);
    }
    notifyListeners();
    return {
      id: removed.id,
      label: removed.label,
      file: removed.file
    };
  };

  const removeEmbeddedSchematicExampleDocument = (fileName) => {
    const normalizedFile = normalizeExampleFileName(fileName);
    const docs = readEmbeddedExampleDocuments();
    const filtered = docs.filter((entry) => entry.file !== normalizedFile);
    const removed = filtered.length !== docs.length;
    const payload = {
      generatedAt: new Date().toISOString(),
      documents: filtered.map((entry) => ({
        file: entry.file,
        doc: clone(entry.doc)
      }))
    };
    if (typeof self !== "undefined") {
      self.SpjutSimEmbeddedExamples = payload;
    }
    return removed;
  };

  const onSchematicExamplesChanged = (listener) => {
    if (typeof listener !== "function") {
      return () => { };
    }
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  };

  api.SCHEMATIC_EXAMPLES = SCHEMATIC_EXAMPLES;
  api.loadSchematicExamples = loadSchematicExamples;
  api.listSchematicExamples = listSchematicExamples;
  api.areSchematicExamplesLoaded = () => examplesLoaded;
  api.getSchematicExamplesError = () => exampleLoadError;
  api.registerSchematicExampleDocument = registerSchematicExampleDocument;
  api.removeSchematicExample = removeSchematicExample;
  api.upsertEmbeddedSchematicExampleDocument = upsertEmbeddedSchematicExampleDocument;
  api.removeEmbeddedSchematicExampleDocument = removeEmbeddedSchematicExampleDocument;
  api.buildEmbeddedSchematicExamplesBundle = buildEmbeddedSchematicExamplesBundle;
  api.applySchematicExample = applySchematicExample;
  api.getSchematicExample = getSchematicExample;
  api.onSchematicExamplesChanged = onSchematicExamplesChanged;

  if (typeof self !== "undefined") {
    self.SpjutSimSchematic = api;
  }

  void loadSchematicExamples().catch((error) => {
    console.error("Failed to load schematic examples.", error);
  });
})();
