(function initPlotExport() {
  const signalTypeUnits = Object.freeze({ voltage: "V", current: "A", power: "W" });

  const getSignalUnit = (signal, classifyFn) => {
    if (!signal) {
      return "";
    }
    return signalTypeUnits[classifyFn(signal)] ?? "V";
  };

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

  const buildPlotExportConfig = (canvas, defaultFontScale, defaultLineWidth) => {
    const state = canvas?._plotState;
    if (!state) {
      return null;
    }
    const config = {
      series: state.series,
      grid: state.grid,
      xLabel: state.xLabelRaw ?? state.xLabel,
      yLabel: state.yLabelRaw ?? state.yLabel,
      xScale: state.xScaleType,
      yScale: state.yScaleType,
      xTickFormat: state.xTickFormat ?? null,
      fontScale: state.fontScale ?? defaultFontScale,
      lineWidth: state.lineWidth ?? defaultLineWidth
    };
    if (Array.isArray(state.rightAxes) && state.rightAxes.length > 0) {
      config.rightAxes = state.rightAxes.map((ra) => ({
        series: ra.series,
        yLabel: ra.yLabelRaw ?? ra.yLabel,
        color: ra.color || undefined
      }));
    }
    if (state.yAxisColor) {
      config.yAxisColor = state.yAxisColor;
    }
    return config;
  };

  const getPlotExportScale = () => {
    const overrideScale = Number(self.SpjutSimExportScale);
    if (Number.isFinite(overrideScale) && overrideScale > 0) {
      return overrideScale;
    }
    const deviceScale = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
    return Math.max(2, deviceScale);
  };

  const exportPlotPng = (canvas, filename, defaultFontScale, defaultLineWidth) => {
    if (!canvas) {
      return;
    }
    const plot = typeof self !== "undefined" ? self.SpjutSimPlot : null;
    const config = buildPlotExportConfig(canvas, defaultFontScale, defaultLineWidth);
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

  const exportVisiblePlotPngs = (canvases, baseFilename, defaultFontScale, defaultLineWidth) => {
    const visibleCanvases = canvases.filter((entry) => {
      if (!entry.canvas) return false;
      if (entry.wrap && entry.wrap.hidden) return false;
      return Boolean(entry.canvas._plotState);
    });
    if (visibleCanvases.length === 1) {
      exportPlotPng(visibleCanvases[0].canvas, baseFilename, defaultFontScale, defaultLineWidth);
      return;
    }
    visibleCanvases.forEach((entry) => {
      const suffix = entry.suffix ? `-${entry.suffix}` : "";
      const filename = baseFilename.replace(/\.png$/i, `${suffix}.png`);
      exportPlotPng(entry.canvas, filename, defaultFontScale, defaultLineWidth);
    });
  };

  self.SpjutSimPlotExport = {
    signalTypeUnits,
    getSignalUnit,
    toFilenameLeaf,
    withFilenameExtension,
    stripFilenameExtension,
    downloadTextFile,
    downloadCsvFile,
    csvEscape,
    buildCsvText,
    getPlotCssSize,
    buildPlotExportConfig,
    getPlotExportScale,
    exportPlotPng,
    exportVisiblePlotPngs
  };
})();
