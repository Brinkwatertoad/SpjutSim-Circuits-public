/**
 * UI plot domain helpers.
 */
(function initUIPlotDomain() {
  const DEFAULT_SHOW_GRID = false;
  const PLOT_IP_DISPLAY_MODES = Object.freeze(["same", "split"]);
  const PLOT_IP_DISPLAY_MODE_SET = new Set(PLOT_IP_DISPLAY_MODES);

  const clampFontScale = (value) => {
    if (!Number.isFinite(value) || value <= 0) {
      return 1;
    }
    return Math.min(Math.max(value, 0.6), 2);
  };

  const clampLineWidth = (value) => {
    if (!Number.isFinite(value) || value <= 0) {
      return 1;
    }
    return Math.min(Math.max(Math.round(value), 1), 6);
  };

  const normalizeIPDisplayMode = (value) => {
    const mode = String(value ?? "").trim().toLowerCase();
    return PLOT_IP_DISPLAY_MODE_SET.has(mode) ? mode : "same";
  };

  const getDefaultShowGrid = () => DEFAULT_SHOW_GRID;

  const domains = typeof self !== "undefined" ? (self.SpjutSimUIDomains ?? {}) : {};
  domains.plot = {
    DEFAULT_SHOW_GRID,
    PLOT_IP_DISPLAY_MODES: PLOT_IP_DISPLAY_MODES.slice(),
    clampFontScale,
    clampLineWidth,
    normalizeIPDisplayMode,
    getDefaultShowGrid
  };
  if (typeof self !== "undefined") {
    self.SpjutSimUIDomains = domains;
  }
})();
