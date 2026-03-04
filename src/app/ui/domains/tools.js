/**
 * UI tools domain helpers.
 */
(function initUIToolsDomain() {
  const ALLOWED_GRID_SIZES = Object.freeze([5, 10, 20]);
  const DEFAULT_GRID_SIZE = 10;
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

  const domains = typeof self !== "undefined" ? (self.SpjutSimUIDomains ?? {}) : {};
  domains.tools = {
    ALLOWED_GRID_SIZES: ALLOWED_GRID_SIZES.slice(),
    DEFAULT_GRID_SIZE,
    normalizeGridSize,
    normalizeToolFilterQuery,
    shouldShowToolButton
  };
  if (typeof self !== "undefined") {
    self.SpjutSimUIDomains = domains;
  }
})();
