/**
 * UI tools domain helpers.
 */
(function initUIToolsDomain() {
  const ALLOWED_GRID_SIZES = Object.freeze([5, 10, 20]);
  const DEFAULT_GRID_SIZE = 10;
  const normalizeToolType = (value) => String(value ?? "").trim().toUpperCase();
  const normalizeToolFilterQuery = (value) => String(value ?? "").trim().toLowerCase();

  const normalizeGridSize = (value) => {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) {
      return DEFAULT_GRID_SIZE;
    }
    if (ALLOWED_GRID_SIZES.includes(numeric)) {
      return numeric;
    }
    return ALLOWED_GRID_SIZES.reduce((best, candidate) =>
      Math.abs(candidate - numeric) < Math.abs(best - numeric) ? candidate : best,
    ALLOWED_GRID_SIZES[0]);
  };

  const shouldShowToolButton = (query, label, name) => {
    const normalizedQuery = normalizeToolFilterQuery(query);
    if (!normalizedQuery) {
      return true;
    }
    const labelText = normalizeToolFilterQuery(label);
    const nameText = normalizeToolFilterQuery(name);
    return labelText.includes(normalizedQuery) || nameText.includes(normalizedQuery);
  };

  const normalizeToolSettingsScopeEntry = (entry) => {
    const scopeType = normalizeToolType(entry?.scopeType);
    if (!scopeType) {
      return null;
    }
    const label = String(entry?.label ?? scopeType).trim() || scopeType;
    return {
      scopeType,
      label,
      supportsApply: entry?.supportsApply !== false,
      supportsReset: entry?.supportsReset !== false,
      toolTypes: []
    };
  };

  const buildToolSettingsCatalog = (toolEntries, options = {}) => {
    const entries = Array.isArray(toolEntries) ? toolEntries : [];
    const componentDefaultTypesRaw = Array.isArray(options?.componentDefaultTypes)
      ? options.componentDefaultTypes
      : [];
    const componentDefaultTypes = new Set(
      componentDefaultTypesRaw
        .map((entry) => normalizeToolType(entry))
        .filter(Boolean)
    );
    const scopes = [];
    const scopesByType = new Map();
    const toolToScope = {};

    const ensureScope = (entry) => {
      const normalized = normalizeToolSettingsScopeEntry(entry);
      if (!normalized) {
        return null;
      }
      const existing = scopesByType.get(normalized.scopeType);
      if (existing) {
        if (!existing.label && normalized.label) {
          existing.label = normalized.label;
        }
        if (normalized.supportsApply !== existing.supportsApply) {
          existing.supportsApply = normalized.supportsApply;
        }
        if (normalized.supportsReset !== existing.supportsReset) {
          existing.supportsReset = normalized.supportsReset;
        }
        return existing;
      }
      scopes.push(normalized);
      scopesByType.set(normalized.scopeType, normalized);
      return normalized;
    };

    entries.forEach((entry) => {
      const toolType = normalizeToolType(entry?.tool ?? entry?.type);
      if (!toolType) {
        return;
      }
      const toolLabel = String(entry?.name ?? entry?.label ?? toolType).trim() || toolType;
      const classification = String(entry?.classification ?? "").trim().toLowerCase();
      if (toolType === "SELECT") {
        const scope = ensureScope({
          scopeType: "SELECT",
          label: toolLabel,
          supportsApply: false,
          supportsReset: false
        });
        if (!scope) {
          return;
        }
        if (!scope.toolTypes.includes(toolType)) {
          scope.toolTypes.push(toolType);
        }
        toolToScope[toolType] = scope.scopeType;
        return;
      }
      if (toolType === "WIRE") {
        const scope = ensureScope({
          scopeType: "WIRE",
          label: toolLabel,
          supportsApply: true,
          supportsReset: true
        });
        if (!scope) {
          return;
        }
        if (!scope.toolTypes.includes(toolType)) {
          scope.toolTypes.push(toolType);
        }
        toolToScope[toolType] = scope.scopeType;
        return;
      }

      let scopeType = "";
      let scopeLabel = toolLabel;
      if (toolType === "GND") {
        scopeType = "GND";
        scopeLabel = "Ground";
      } else if (classification === "probe") {
        scopeType = "PROBE";
        scopeLabel = "Probe";
      } else if (componentDefaultTypes.has(toolType)) {
        scopeType = toolType;
      }
      if (!scopeType) {
        return;
      }
      const scope = ensureScope({
        scopeType,
        label: scopeLabel,
        supportsApply: true,
        supportsReset: true
      });
      if (!scope) {
        return;
      }
      if (!scope.toolTypes.includes(toolType)) {
        scope.toolTypes.push(toolType);
      }
      toolToScope[toolType] = scope.scopeType;
    });

    return Object.freeze({
      scopes: Object.freeze(scopes.map((entry) => Object.freeze({
        scopeType: entry.scopeType,
        label: entry.label,
        supportsApply: entry.supportsApply === true,
        supportsReset: entry.supportsReset === true,
        toolTypes: Object.freeze(entry.toolTypes.slice())
      }))),
      toolToScope: Object.freeze({ ...toolToScope })
    });
  };

  const resolveToolSettingsScopeType = (toolType, catalog) => {
    const normalized = normalizeToolType(toolType);
    if (!normalized) {
      return "";
    }
    const map = catalog && typeof catalog === "object" && catalog.toolToScope && typeof catalog.toolToScope === "object"
      ? catalog.toolToScope
      : {};
    const scopeType = normalizeToolType(map[normalized]);
    return scopeType || "";
  };

  const getToolSettingsScope = (scopeType, catalog) => {
    const normalized = normalizeToolType(scopeType);
    if (!normalized) {
      return null;
    }
    const scopes = Array.isArray(catalog?.scopes) ? catalog.scopes : [];
    return scopes.find((entry) => normalizeToolType(entry?.scopeType) === normalized) ?? null;
  };

  const domains = typeof self !== "undefined" ? (self.SpjutSimUIDomains ?? {}) : {};
  domains.tools = {
    ALLOWED_GRID_SIZES: ALLOWED_GRID_SIZES.slice(),
    DEFAULT_GRID_SIZE,
    normalizeToolType,
    normalizeGridSize,
    normalizeToolFilterQuery,
    shouldShowToolButton,
    buildToolSettingsCatalog,
    resolveToolSettingsScopeType,
    getToolSettingsScope
  };
  if (typeof self !== "undefined") {
    self.SpjutSimUIDomains = domains;
  }
})();
