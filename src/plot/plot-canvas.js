/** @typedef {{ x: number[], y: number[], color?: string, label?: string, signal?: string, highlighted?: boolean, selected?: boolean, hovered?: boolean }} PlotSeries */
/** @typedef {{ series?: PlotSeries[], grid?: boolean, yLabel?: string, xLabel?: string, xScale?: "linear" | "log", yScale?: "linear" | "log", fontScale?: number, lineWidth?: number }} PlotConfig */

(function initPlot() {
  /**
   * @param {HTMLCanvasElement} canvas
   * @param {PlotSeries | PlotConfig} config
   */
  function renderPlot(canvas, config) {
    const scaleApi = typeof self !== "undefined" ? self.SpjutSimScale : null;
    const rect = canvas.getBoundingClientRect();
    const computedStyle = typeof window !== "undefined" ? window.getComputedStyle(canvas) : null;
    const computedWidth = computedStyle ? parseFloat(computedStyle.width) : Number.NaN;
    const computedHeight = computedStyle ? parseFloat(computedStyle.height) : Number.NaN;
    const previousScale = canvas._plotState?.pixelRatio ?? 1;
    const overrideScale = Number(config?.pixelRatio);
    const globalScale = Number(typeof self !== "undefined" ? self.SpjutSimPlotScale : NaN);
    const deviceScale = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
    const fallbackScale = Math.max(2, Math.ceil(deviceScale));
    const pixelRatio = Number.isFinite(overrideScale) && overrideScale > 0
      ? overrideScale
      : (Number.isFinite(globalScale) && globalScale > 0 ? globalScale : fallbackScale);
    const hasConfigWidth = Number.isFinite(config?.width) && config.width > 0;
    const hasConfigHeight = Number.isFinite(config?.height) && config.height > 0;
    const measuredWidth = rect.width || canvas.clientWidth || (Number.isFinite(computedWidth) && computedWidth > 0 ? computedWidth : 0);
    const measuredHeight = rect.height || canvas.clientHeight || (Number.isFinite(computedHeight) && computedHeight > 0 ? computedHeight : 0);
    if (!hasConfigWidth && !hasConfigHeight && (!measuredWidth || !measuredHeight)) {
      return;
    }
    const rawWidth = hasConfigWidth
      ? config.width
      : (measuredWidth || (canvas.width ? canvas.width / previousScale : 600));
    const rawHeight = hasConfigHeight
      ? config.height
      : (measuredHeight || (canvas.height ? canvas.height / previousScale : 300));
    const width = Number.isFinite(rawWidth) && rawWidth > 0 ? rawWidth : 600;
    const height = Number.isFinite(rawHeight) && rawHeight > 0 ? rawHeight : 300;
    if (hasConfigHeight) {
      const cssHeight = `${height}px`;
      if (canvas.style.height !== cssHeight) {
        canvas.style.height = cssHeight;
      }
    } else if (canvas.style.height) {
      canvas.style.height = "";
    }
    const targetWidth = Math.max(1, Math.round(width * pixelRatio));
    const targetHeight = Math.max(1, Math.round(height * pixelRatio));
    if (canvas.width !== targetWidth) {
      canvas.width = targetWidth;
    }
    if (canvas.height !== targetHeight) {
      canvas.height = targetHeight;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }
    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#f6f4ef";
    ctx.fillRect(0, 0, width, height);

    const seriesList = Array.isArray(config?.series)
      ? config.series
      : (config && Array.isArray(config.x) && Array.isArray(config.y) ? [config] : []);

    const rawFontScale = Number(config?.fontScale);
    const fontScale = Number.isFinite(rawFontScale) && rawFontScale > 0
      ? Math.min(Math.max(rawFontScale, 0.6), 2)
      : 1;
    const rawLineWidth = Number(config?.lineWidth);
    const lineWidth = Number.isFinite(rawLineWidth) && rawLineWidth > 0
      ? Math.min(Math.max(rawLineWidth, 1), 6)
      : 1;

    if (!seriesList.length) {
      const emptyFontSize = Math.max(10, Math.round(12 * fontScale));
      ctx.fillStyle = "#666";
      ctx.font = `${emptyFontSize}px \"Segoe UI\", Tahoma, sans-serif`;
      ctx.fillText("No data", 12, 20);
      return;
    }

    const palette = ["#0f62fe", "#da1e28", "#198038", "#8a3ffc", "#ff832b", "#007d79"];
    const formatTick = (value) => {
      if (!Number.isFinite(value)) {
        return "";
      }
      const abs = Math.abs(value);
      if (abs !== 0 && (abs >= 1e6 || abs < 1e-3)) {
        return value.toExponential(2);
      }
      return value.toPrecision(4);
    };
    const formatAxisLabel = (label, unit) => {
      if (!label) {
        return label;
      }
      const base = label.replace(/\s*\([^)]*\)\s*$/, "");
      return unit ? `${base} (${unit})` : base;
    };
    let xMin = Infinity;
    let xMax = -Infinity;
    let yMin = Infinity;
    let yMax = -Infinity;
    seriesList.forEach((entry) => {
      const length = Math.min(entry.x.length, entry.y.length);
      for (let index = 0; index < length; index += 1) {
        const xValue = entry.x[index];
        const yValue = entry.y[index];
        if (!Number.isFinite(xValue) || !Number.isFinite(yValue)) {
          continue;
        }
        xMin = Math.min(xMin, xValue);
        xMax = Math.max(xMax, xValue);
        yMin = Math.min(yMin, yValue);
        yMax = Math.max(yMax, yValue);
      }
    });

    if (!Number.isFinite(xMin) || !Number.isFinite(yMin)) {
      ctx.fillStyle = "#666";
      ctx.fillText("No data", 12, 20);
      return;
    }

    const requestedXScale = config?.xScale === "log" ? "log" : "linear";
    const requestedYScale = config?.yScale === "log" ? "log" : "linear";
    const buildLinear = scaleApi?.buildLinearScale ?? ((min, max) => ({
      type: "linear",
      min,
      max,
      ticks: [min, max],
      step: max - min
    }));
    const buildLog = scaleApi?.buildLogScale ?? buildLinear;
    const xScale = requestedXScale === "log" ? buildLog(xMin, xMax) : buildLinear(xMin, xMax, 6);
    const yScale = requestedYScale === "log" ? buildLog(yMin, yMax) : buildLinear(yMin, yMax, 6);
    const timeFormatter = config?.xTickFormat === "time" && scaleApi?.buildTimeFormatter
      ? scaleApi.buildTimeFormatter(xScale.min ?? xMin, xScale.max ?? xMax)
      : null;
    const xTickUnit = timeFormatter?.unit ?? null;
    const xTickScale = timeFormatter?.scale ?? 1;
    const displayXLabel = timeFormatter ? formatAxisLabel(config?.xLabel, xTickUnit) : config?.xLabel;

    const axisTickSize = Math.max(10, Math.round(12 * fontScale));
    const axisLabelSize = Math.max(11, Math.round(14 * fontScale));
    const legendSize = Math.max(10, Math.round(12 * fontScale));
    const axisTickFont = `${axisTickSize}px \"Segoe UI\", Tahoma, sans-serif`;
    const axisLabelFont = `${axisLabelSize}px \"Segoe UI\", Tahoma, sans-serif`;
    const legendFont = `${legendSize}px \"Segoe UI\", Tahoma, sans-serif`;

    ctx.font = axisTickFont;
    const yTickLabels = Array.isArray(yScale.ticks) ? yScale.ticks.map((tick) => formatTick(tick)) : [];
    const xTickLabels = Array.isArray(xScale.ticks)
      ? xScale.ticks.map((tick) => (timeFormatter ? timeFormatter.format(tick) : formatTick(tick)))
      : [];
    let maxYTickWidth = 0;
    yTickLabels.forEach((label) => {
      const width = ctx.measureText(label).width;
      if (width > maxYTickWidth) {
        maxYTickWidth = width;
      }
    });

    const padding = {
      left: 16,
      right: 16,
      top: 8,
      bottom: 12
    };
    const leftMargin = padding.left + (maxYTickWidth ? maxYTickWidth + 6 : 0);
    const topMargin = padding.top + (config?.yLabel ? axisLabelSize + 6 : 0);
    const bottomMargin = padding.bottom
      + (xTickLabels.length ? axisTickSize + 6 : 0)
      + (displayXLabel ? axisLabelSize + 6 : 0);
    let plotLeft = leftMargin;
    let plotRight = width - padding.right;
    let plotTop = topMargin;
    let plotBottom = height - bottomMargin;
    const minPlotWidth = 60;
    const minPlotHeight = 50;
    if (plotRight - plotLeft < minPlotWidth) {
      plotLeft = Math.max(padding.left, plotRight - minPlotWidth);
    }
    if (plotBottom - plotTop < minPlotHeight) {
      plotTop = Math.max(padding.top, plotBottom - minPlotHeight);
    }
    if (plotLeft < padding.left) {
      plotLeft = padding.left;
    }
    if (plotTop < padding.top) {
      plotTop = padding.top;
    }
    if (plotRight <= plotLeft) {
      plotRight = plotLeft + 1;
    }
    if (plotBottom <= plotTop) {
      plotBottom = plotTop + 1;
    }

    const mapX = (value) => {
      if (!Number.isFinite(value)) {
        return null;
      }
      if (xScale.type === "log") {
        if (value <= 0 || !Number.isFinite(xScale.logMin) || !Number.isFinite(xScale.logMax)) {
          return null;
        }
        const t = (Math.log10(value) - xScale.logMin) / (xScale.logMax - xScale.logMin);
        return plotLeft + t * (plotRight - plotLeft);
      }
      const denom = xScale.max - xScale.min;
      const t = denom === 0 ? 0 : (value - xScale.min) / denom;
      return plotLeft + t * (plotRight - plotLeft);
    };

    const mapY = (value) => {
      if (!Number.isFinite(value)) {
        return null;
      }
      if (yScale.type === "log") {
        if (value <= 0 || !Number.isFinite(yScale.logMin) || !Number.isFinite(yScale.logMax)) {
          return null;
        }
        const t = (Math.log10(value) - yScale.logMin) / (yScale.logMax - yScale.logMin);
        return plotBottom - t * (plotBottom - plotTop);
      }
      const denom = yScale.max - yScale.min;
      const t = denom === 0 ? 0 : (value - yScale.min) / denom;
      return plotBottom - t * (plotBottom - plotTop);
    };

    ctx.lineWidth = 1;
    ctx.font = axisTickFont;
    ctx.fillStyle = "#4a463f";
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    if (Array.isArray(yScale.ticks)) {
      if (config?.grid) {
        ctx.strokeStyle = "#e0e0e0";
        ctx.beginPath();
      }
      yScale.ticks.forEach((tick, index) => {
        const yPos = mapY(tick);
        if (yPos === null) {
          return;
        }
        if (config?.grid) {
          ctx.moveTo(plotLeft, yPos);
          ctx.lineTo(plotRight, yPos);
        }
        const label = yTickLabels[index] ?? formatTick(tick);
        ctx.fillText(label, plotLeft - 6, yPos);
      });
      if (config?.grid) {
        ctx.stroke();
      }
    }

    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    const xTickLabelAnchors = [];
    if (Array.isArray(xScale.ticks)) {
      if (config?.grid) {
        ctx.strokeStyle = "#e0e0e0";
        ctx.beginPath();
      }
      xScale.ticks.forEach((tick, index) => {
        const xPos = mapX(tick);
        if (xPos === null) {
          return;
        }
        let align = "center";
        if (index === 0) {
          align = "left";
        } else if (index === xScale.ticks.length - 1) {
          align = "right";
        }
        ctx.textAlign = align;
        const label = xTickLabels[index] ?? (timeFormatter ? timeFormatter.format(tick) : formatTick(tick));
        if (config?.grid) {
          ctx.moveTo(xPos, plotTop);
          ctx.lineTo(xPos, plotBottom);
        }
        ctx.fillText(label, xPos, plotBottom + 6);
        xTickLabelAnchors.push({ value: tick, x: xPos, align });
      });
      if (config?.grid) {
        ctx.stroke();
      }
    }

    ctx.strokeStyle = "#1d1d1f";
    ctx.beginPath();
    ctx.moveTo(plotLeft, plotTop);
    ctx.lineTo(plotLeft, plotBottom);
    ctx.lineTo(plotRight, plotBottom);
    ctx.stroke();

    const hasSelectedSeries = seriesList.some((entry) => entry?.selected === true);
    const hasHoveredSeries = seriesList.some((entry) => entry?.hovered === true);
    const hasHighlightedSeries = hasSelectedSeries || hasHoveredSeries
      || seriesList.some((entry) => entry?.highlighted === true);
    seriesList.forEach((entry, index) => {
      const stroke = entry.color ?? palette[index % palette.length];
      const isSelected = entry?.selected === true;
      const isHovered = !isSelected && entry?.hovered === true;
      const isHighlighted = isSelected || isHovered || entry?.highlighted === true;
      const isDimmed = hasSelectedSeries
        ? !isSelected && !isHovered
        : (hasHighlightedSeries && !isHighlighted);
      ctx.strokeStyle = stroke;
      if (isSelected) {
        ctx.globalAlpha = 1;
      } else if (isHovered) {
        ctx.globalAlpha = 1;
      } else {
        ctx.globalAlpha = isDimmed ? 0.28 : 1;
      }
      if (isSelected) {
        ctx.lineWidth = Math.max(lineWidth + 1.5, lineWidth * 1.75);
      } else if (isHovered) {
        ctx.lineWidth = Math.max(lineWidth + 0.5, lineWidth * 1.35);
      } else {
        ctx.lineWidth = lineWidth;
      }
      ctx.beginPath();
      const length = Math.min(entry.x.length, entry.y.length);
      let started = false;
      for (let idx = 0; idx < length; idx += 1) {
        const xValue = entry.x[idx];
        const yValue = entry.y[idx];
        if (!Number.isFinite(xValue) || !Number.isFinite(yValue)) {
          continue;
        }
        const xPos = mapX(xValue);
        const yPos = mapY(yValue);
        if (xPos === null || yPos === null) {
          continue;
        }
        if (!started) {
          ctx.moveTo(xPos, yPos);
          started = true;
        } else {
          ctx.lineTo(xPos, yPos);
        }
      }
      ctx.stroke();
      ctx.globalAlpha = 1;
    });

    if (config?.yLabel) {
      ctx.fillStyle = "#333";
      ctx.font = axisLabelFont;
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText(config.yLabel, plotLeft, padding.top);
    }

    if (displayXLabel) {
      ctx.fillStyle = "#333";
      ctx.font = axisLabelFont;
      ctx.textAlign = "right";
      ctx.textBaseline = "top";
      const xLabelY = Math.max(padding.top, height - padding.bottom - axisLabelSize);
      ctx.fillText(displayXLabel, plotRight, xLabelY);
    }

    let legend = null;
    if (seriesList.length >= 1) {
      ctx.font = legendFont;
      const items = seriesList.map((entry, index) => {
        const label = entry.label ?? `Trace ${index + 1}`;
        const isSelected = entry?.selected === true;
        const isHovered = !isSelected && entry?.hovered === true;
        const color = entry.color ?? palette[index % palette.length];
        return {
          label,
          signal: entry.signal ?? label,
          color,
          selected: isSelected,
          hovered: isHovered,
          highlighted: entry?.highlighted === true
        };
      });
      const swatch = 10;
      const gap = 6;
      const lineHeight = 14;
      const padding = 6;
      const maxLabelWidth = Math.max(...items.map((item) => ctx.measureText(item.label).width));
      const legendWidth = padding * 2 + swatch + gap + maxLabelWidth;
      const legendHeight = padding * 2 + items.length * lineHeight;
      const legendX = plotRight - legendWidth;
      const legendY = plotTop;

      ctx.fillStyle = "rgba(246, 244, 239, 0.98)";
      ctx.strokeStyle = "#c7c3bb";
      ctx.lineWidth = 1;
      ctx.fillRect(legendX, legendY, legendWidth, legendHeight);
      ctx.strokeRect(legendX, legendY, legendWidth, legendHeight);

      items.forEach((item, idx) => {
        const y = legendY + padding + idx * lineHeight + lineHeight / 2;
        const rowY = legendY + padding + idx * lineHeight;
        item.bounds = {
          x: legendX + padding,
          y: rowY,
          width: legendWidth - padding * 2,
          height: lineHeight
        };
        const legendHighlight = item.selected || item.hovered || item.highlighted;
        if (item.selected) {
          ctx.globalAlpha = 1;
        } else if (item.hovered) {
          ctx.globalAlpha = 1;
        } else {
          ctx.globalAlpha = legendHighlight || !hasHighlightedSeries ? 1 : (hasSelectedSeries ? 0.28 : 0.45);
        }
        ctx.fillStyle = item.color;
        ctx.fillRect(legendX + padding, y - swatch / 2, swatch, swatch);
        ctx.fillStyle = "#1d1d1f";
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillText(item.label, legendX + padding + swatch + gap, y);
        ctx.globalAlpha = 1;
      });
      legend = {
        items,
        bounds: { x: legendX, y: legendY, width: legendWidth, height: legendHeight }
      };
    }

    canvas._plotState = {
      series: seriesList,
      xTicks: Array.isArray(xScale.ticks) ? xScale.ticks : [],
      yTicks: Array.isArray(yScale.ticks) ? yScale.ticks : [],
      xLabel: displayXLabel ?? "",
      yLabel: config?.yLabel ?? "",
      grid: Boolean(config?.grid),
      xTickFormat: config?.xTickFormat ?? null,
      xScaleType: xScale.type ?? "linear",
      yScaleType: yScale.type ?? "linear",
      xMin: xScale.min ?? xMin,
      xMax: xScale.max ?? xMax,
      yMin: yScale.min ?? yMin,
      yMax: yScale.max ?? yMax,
      xLogMin: xScale.logMin,
      xLogMax: xScale.logMax,
      yLogMin: yScale.logMin,
      yLogMax: yScale.logMax,
      plotLeft,
      plotRight,
      plotTop,
      plotBottom,
      legend,
      xTickLabels,
      xTickLabelAnchors,
      xTickUnit,
      xTickScale,
      axisTickFont,
      axisLabelFont,
      legendFont,
      fontScale,
      lineWidth,
      axisDrawnAfterGrid: Boolean(config?.grid),
      canvasWidth: width,
      canvasHeight: height,
      cssWidth: width,
      cssHeight: height,
      pixelRatio
    };
  }

  self.SpjutSimPlot = {
    renderPlot
  };
})();
