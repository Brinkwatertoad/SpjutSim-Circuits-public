/** @typedef {{ x: number[], y: number[], color?: string, label?: string, signal?: string, highlighted?: boolean, selected?: boolean, hovered?: boolean, dashPattern?: number[] }} PlotSeries */
/** @typedef {{ series?: PlotSeries[], rightAxes?: { series: PlotSeries[], yLabel?: string, color?: string }[], grid?: boolean, yLabel?: string, yAxisColor?: string, xLabel?: string, xScale?: "linear" | "log", yScale?: "linear" | "log", fontScale?: number, lineWidth?: number }} PlotConfig */

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

    const rightAxes = Array.isArray(config?.rightAxes)
      ? config.rightAxes.filter((axis) => Array.isArray(axis?.series) && axis.series.length > 0)
      : [];

    const rawFontScale = Number(config?.fontScale);
    const fontScale = Number.isFinite(rawFontScale) && rawFontScale > 0
      ? Math.min(Math.max(rawFontScale, 0.6), 2)
      : 1;
    const rawLineWidth = Number(config?.lineWidth);
    const lineWidth = Number.isFinite(rawLineWidth) && rawLineWidth > 0
      ? Math.min(Math.max(rawLineWidth, 1), 6)
      : 1;

    // Collect all series for "no data" check and highlight state
    const allSeries = seriesList.slice();
    rightAxes.forEach((axis) => {
      axis.series.forEach((entry) => allSeries.push(entry));
    });

    if (!allSeries.length) {
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

    // Compute data bounds for main series
    let xMin = Infinity;
    let xMax = -Infinity;
    let yMin = Infinity;
    let yMax = -Infinity;
    const computeBounds = (entries) => {
      let bxMin = Infinity, bxMax = -Infinity, byMin = Infinity, byMax = -Infinity;
      entries.forEach((entry) => {
        const length = Math.min(entry.x.length, entry.y.length);
        for (let index = 0; index < length; index += 1) {
          const xValue = entry.x[index];
          const yValue = entry.y[index];
          if (!Number.isFinite(xValue) || !Number.isFinite(yValue)) {
            continue;
          }
          bxMin = Math.min(bxMin, xValue);
          bxMax = Math.max(bxMax, xValue);
          byMin = Math.min(byMin, yValue);
          byMax = Math.max(byMax, yValue);
        }
      });
      return { xMin: bxMin, xMax: bxMax, yMin: byMin, yMax: byMax };
    };

    // Main series bounds
    const mainBounds = computeBounds(seriesList);
    xMin = mainBounds.xMin;
    xMax = mainBounds.xMax;
    yMin = mainBounds.yMin;
    yMax = mainBounds.yMax;

    // Right axes bounds (they share x but have own y)
    const rightAxisBounds = rightAxes.map((axis) => computeBounds(axis.series));

    // Include right-axis x ranges in global x bounds
    rightAxisBounds.forEach((bounds) => {
      if (Number.isFinite(bounds.xMin)) {
        xMin = Math.min(xMin, bounds.xMin);
      }
      if (Number.isFinite(bounds.xMax)) {
        xMax = Math.max(xMax, bounds.xMax);
      }
    });

    // If main series is empty but right axes have data, we still need valid x bounds
    const hasMainData = Number.isFinite(mainBounds.yMin);
    const hasAnyData = Number.isFinite(xMin) && (hasMainData || rightAxisBounds.some((b) => Number.isFinite(b.yMin)));

    if (!hasAnyData) {
      ctx.fillStyle = "#666";
      ctx.fillText("No data", 12, 20);
      return;
    }

    const buildLinear = scaleApi?.buildLinearScale ?? ((min, max) => ({
      type: "linear",
      min,
      max,
      ticks: [min, max],
      step: max - min
    }));
    const buildLog = scaleApi?.buildLogScale ?? buildLinear;

    const requestedXScale = config?.xScale === "log" ? "log" : "linear";
    const requestedYScale = config?.yScale === "log" ? "log" : "linear";
    const xScale = requestedXScale === "log" ? buildLog(xMin, xMax) : buildLinear(xMin, xMax, 6);
    const yScale = hasMainData
      ? (requestedYScale === "log" ? buildLog(yMin, yMax) : buildLinear(yMin, yMax, 6))
      : null;
    const timeFormatter = config?.xTickFormat === "time" && scaleApi?.buildTimeFormatter
      ? scaleApi.buildTimeFormatter(xScale.min ?? xMin, xScale.max ?? xMax)
      : null;
    const xTickUnit = timeFormatter?.unit ?? null;
    const xTickScale = timeFormatter?.scale ?? 1;
    const displayXLabel = timeFormatter ? formatAxisLabel(config?.xLabel, xTickUnit) : config?.xLabel;

    // Build value formatter for main y-axis
    const yValueFormatter = yScale && scaleApi?.buildValueFormatter
      ? scaleApi.buildValueFormatter(yScale.min, yScale.max)
      : null;
    const displayYLabel = yValueFormatter && yValueFormatter.prefix
      ? formatAxisLabel(config?.yLabel, yValueFormatter.prefix + (config?.yLabel?.match(/\(([^)]*)\)\s*$/)?.[1] ?? ""))
      : config?.yLabel;

    // Build right-axis scales
    const rightAxisScales = rightAxisBounds.map((bounds) => {
      if (!Number.isFinite(bounds.yMin)) {
        return null;
      }
      return buildLinear(bounds.yMin, bounds.yMax, 6);
    });

    // Build value formatters for right axes
    const rightAxisValueFormatters = rightAxisScales.map((scale) => {
      if (!scale || !scaleApi?.buildValueFormatter) return null;
      return scaleApi.buildValueFormatter(scale.min, scale.max);
    });

    // Compute display labels for right axes with SI prefixes
    const rightAxisDisplayLabels = rightAxes.map((axis, i) => {
      const formatter = rightAxisValueFormatters[i];
      if (!formatter || !formatter.prefix) return axis?.yLabel ?? "";
      return formatAxisLabel(axis?.yLabel, formatter.prefix + (axis?.yLabel?.match(/\(([^)]*)\)\s*$/)?.[1] ?? ""));
    });

    const yAxisColor = typeof config?.yAxisColor === "string" && config.yAxisColor ? config.yAxisColor : null;
    const axisTickSize = Math.max(10, Math.round(12 * fontScale));
    const axisLabelSize = Math.max(11, Math.round(14 * fontScale));
    const legendSize = Math.max(10, Math.round(12 * fontScale));
    const axisTickFont = `${axisTickSize}px \"Segoe UI\", Tahoma, sans-serif`;
    const axisLabelFont = `${axisLabelSize}px \"Segoe UI\", Tahoma, sans-serif`;
    const legendFont = `${legendSize}px \"Segoe UI\", Tahoma, sans-serif`;

    ctx.font = axisTickFont;
    const yTickLabels = yScale && Array.isArray(yScale.ticks)
      ? yScale.ticks.map((tick) => yValueFormatter ? yValueFormatter.format(tick) : formatTick(tick))
      : [];
    const xTickLabels = Array.isArray(xScale.ticks)
      ? xScale.ticks.map((tick) => (timeFormatter ? timeFormatter.format(tick) : formatTick(tick)))
      : [];
    let maxYTickWidth = 0;
    yTickLabels.forEach((label) => {
      const w = ctx.measureText(label).width;
      if (w > maxYTickWidth) {
        maxYTickWidth = w;
      }
    });

    // Measure right-axis tick widths
    const rightAxisTickLabels = rightAxisScales.map((scale, i) => {
      if (!scale || !Array.isArray(scale.ticks)) {
        return [];
      }
      const formatter = rightAxisValueFormatters[i];
      return scale.ticks.map((tick) => formatter ? formatter.format(tick) : formatTick(tick));
    });
    const rightAxisTickWidths = rightAxisTickLabels.map((labels) => {
      let maxWidth = 0;
      labels.forEach((label) => {
        const w = ctx.measureText(label).width;
        if (w > maxWidth) {
          maxWidth = w;
        }
      });
      return maxWidth;
    });

    const outerPadding = {
      left: 16,
      right: 16,
      top: 8,
      bottom: 12
    };
    const leftMargin = outerPadding.left + (maxYTickWidth ? maxYTickWidth + 6 : 0);
    const topMargin = outerPadding.top + (displayYLabel ? axisLabelSize + Math.ceil(axisTickSize / 2) + 4 : 0);
    const bottomMargin = outerPadding.bottom
      + (xTickLabels.length ? axisTickSize + 6 : 0)
      + (displayXLabel ? axisLabelSize + 6 : 0);

    // Compute right margin: sum of right-axis tick columns + labels + spacing
    const rightAxisGap = 12; // gap between each right axis column
    let rightMarginExtra = 0;
    rightAxisScales.forEach((scale, i) => {
      if (!scale) {
        return;
      }
      const tickWidth = rightAxisTickWidths[i] || 0;
      const hasLabel = Boolean(rightAxisDisplayLabels[i] || rightAxes[i]?.yLabel);
      rightMarginExtra += rightAxisGap + tickWidth + 6 + (hasLabel ? axisLabelSize + 4 : 0);
    });

    let plotLeft = leftMargin;
    let plotRight = width - outerPadding.right - rightMarginExtra;
    let plotTop = topMargin;
    let plotBottom = height - bottomMargin;
    const minPlotWidth = 60;
    const minPlotHeight = 50;
    if (plotRight - plotLeft < minPlotWidth) {
      plotLeft = Math.max(outerPadding.left, plotRight - minPlotWidth);
    }
    if (plotBottom - plotTop < minPlotHeight) {
      plotTop = Math.max(outerPadding.top, plotBottom - minPlotHeight);
    }
    if (plotLeft < outerPadding.left) {
      plotLeft = outerPadding.left;
    }
    if (plotTop < outerPadding.top) {
      plotTop = outerPadding.top;
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

    const buildMapY = (scale) => {
      if (!scale) {
        return () => null;
      }
      return (value) => {
        if (!Number.isFinite(value)) {
          return null;
        }
        if (scale.type === "log") {
          if (value <= 0 || !Number.isFinite(scale.logMin) || !Number.isFinite(scale.logMax)) {
            return null;
          }
          const t = (Math.log10(value) - scale.logMin) / (scale.logMax - scale.logMin);
          return plotBottom - t * (plotBottom - plotTop);
        }
        const denom = scale.max - scale.min;
        const t = denom === 0 ? 0 : (value - scale.min) / denom;
        return plotBottom - t * (plotBottom - plotTop);
      };
    };

    const mapY = buildMapY(yScale);
    const rightAxisMapY = rightAxisScales.map((scale) => buildMapY(scale));

    // Draw left y-axis ticks and grid
    ctx.lineWidth = 1;
    ctx.font = axisTickFont;
    ctx.fillStyle = yAxisColor ?? "#4a463f";
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    if (yScale && Array.isArray(yScale.ticks)) {
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

    // Draw x-axis ticks
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

    // Draw axes lines (left axis uses yAxisColor if provided; bottom shared)
    ctx.beginPath();
    ctx.strokeStyle = yAxisColor ?? "#1d1d1f";
    ctx.moveTo(plotLeft, plotTop);
    ctx.lineTo(plotLeft, plotBottom);
    ctx.stroke();
    ctx.beginPath();
    ctx.strokeStyle = "#1d1d1f";
    ctx.moveTo(plotLeft, plotBottom);
    ctx.lineTo(plotRight, plotBottom);
    ctx.stroke();

    // Draw right-axis ticks and axis lines
    const rightAxisFallbackColors = ["#0077b6", "#e63946"];
    let rightAxisX = plotRight;
    const rightAxisPositions = [];
    const numActiveRightAxes = rightAxisScales.filter((s) => s !== null).length;
    let activeRightAxisIdx = 0;
    rightAxisScales.forEach((scale, i) => {
      if (!scale || !Array.isArray(scale.ticks)) {
        rightAxisPositions.push(null);
        return;
      }
      const axisX = rightAxisX + rightAxisGap;
      const tickWidth = rightAxisTickWidths[i] || 0;
      const axisColor = rightAxes[i]?.color ?? rightAxes[i]?.series?.[0]?.color ?? rightAxisFallbackColors[i % rightAxisFallbackColors.length];

      // Draw right axis line
      ctx.strokeStyle = axisColor;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(axisX, plotTop);
      ctx.lineTo(axisX, plotBottom);
      ctx.stroke();

      // Draw right-axis ticks
      ctx.font = axisTickFont;
      ctx.fillStyle = axisColor;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      const rMapY = rightAxisMapY[i];
      scale.ticks.forEach((tick, tickIdx) => {
        const yPos = rMapY(tick);
        if (yPos === null) {
          return;
        }
        const label = rightAxisTickLabels[i][tickIdx] ?? formatTick(tick);
        ctx.fillText(label, axisX + 6, yPos);
      });

      // Draw right-axis label (centered over axis line; shift apart when 2 axes present)
      const displayRightLabel = rightAxisDisplayLabels[i] || rightAxes[i]?.yLabel || "";
      const hasLabel = Boolean(displayRightLabel);
      if (hasLabel) {
        ctx.fillStyle = axisColor;
        ctx.font = axisLabelFont;
        ctx.textBaseline = "top";
        if (numActiveRightAxes >= 2) {
          ctx.textAlign = activeRightAxisIdx === 0 ? "right" : "center";
        } else {
          ctx.textAlign = "center";
        }
        ctx.fillText(displayRightLabel, axisX, outerPadding.top);
      }

      rightAxisPositions.push({ x: axisX, color: axisColor });
      rightAxisX = axisX + tickWidth + 6 + (hasLabel ? axisLabelSize + 4 : 0);
      activeRightAxisIdx++;
    });

    // Highlight state across all series
    const hasSelectedSeries = allSeries.some((entry) => entry?.selected === true);
    const hasHoveredSeries = allSeries.some((entry) => entry?.hovered === true);
    const hasHighlightedSeries = hasSelectedSeries || hasHoveredSeries
      || allSeries.some((entry) => entry?.highlighted === true);

    const drawSeriesList = (entries, mapYFn, paletteOffset) => {
      entries.forEach((entry, index) => {
        const stroke = entry.color ?? palette[(paletteOffset + index) % palette.length];
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
        ctx.setLineDash(entry.dashPattern ?? []);
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
          const yPos = mapYFn(yValue);
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
        ctx.setLineDash([]);
        ctx.globalAlpha = 1;
      });
    };

    // Draw main series
    drawSeriesList(seriesList, mapY, 0);

    // Draw right-axis series
    rightAxes.forEach((axis, i) => {
      if (!rightAxisScales[i]) {
        return;
      }
      drawSeriesList(axis.series, rightAxisMapY[i], seriesList.length);
    });

    // Draw left y-axis label (centered over y-axis)
    if (displayYLabel) {
      ctx.fillStyle = yAxisColor ?? "#333";
      ctx.font = axisLabelFont;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillText(displayYLabel, plotLeft, outerPadding.top);
    }

    // Draw x-axis label (centered under x-axis)
    if (displayXLabel) {
      ctx.fillStyle = "#333";
      ctx.font = axisLabelFont;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      const xLabelY = Math.max(outerPadding.top, height - outerPadding.bottom - axisLabelSize);
      ctx.fillText(displayXLabel, (plotLeft + plotRight) / 2, xLabelY);
    }

    // Legend (includes all series)
    let legend = null;
    if (allSeries.length >= 1) {
      ctx.font = legendFont;
      let globalIndex = 0;
      const items = allSeries.map((entry) => {
        const label = entry.label ?? `Trace ${globalIndex + 1}`;
        const isSelected = entry?.selected === true;
        const isHovered = !isSelected && entry?.hovered === true;
        const color = entry.color ?? palette[globalIndex % palette.length];
        const dashPattern = entry.dashPattern ?? [];
        globalIndex++;
        return {
          label,
          signal: entry.signal ?? label,
          color,
          dashPattern,
          selected: isSelected,
          hovered: isHovered,
          highlighted: entry?.highlighted === true
        };
      });
      const swatch = 10;
      const gap = 6;
      const lineHeight = 14;
      const legendPad = 6;
      const maxLabelWidth = Math.max(...items.map((item) => ctx.measureText(item.label).width));
      const legendWidth = legendPad * 2 + swatch + gap + maxLabelWidth;
      const legendHeight = legendPad * 2 + items.length * lineHeight;
      const legendX = plotRight - legendWidth;
      const legendY = plotTop;

      ctx.fillStyle = "rgba(246, 244, 239, 0.98)";
      ctx.strokeStyle = "#c7c3bb";
      ctx.lineWidth = 1;
      ctx.fillRect(legendX, legendY, legendWidth, legendHeight);
      ctx.strokeRect(legendX, legendY, legendWidth, legendHeight);

      items.forEach((item, idx) => {
        const y = legendY + legendPad + idx * lineHeight + lineHeight / 2;
        const rowY = legendY + legendPad + idx * lineHeight;
        item.bounds = {
          x: legendX + legendPad,
          y: rowY,
          width: legendWidth - legendPad * 2,
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
        if (item.dashPattern.length > 0) {
          ctx.strokeStyle = item.color;
          ctx.lineWidth = 2;
          ctx.setLineDash(item.dashPattern);
          ctx.beginPath();
          ctx.moveTo(legendX + legendPad, y);
          ctx.lineTo(legendX + legendPad + swatch, y);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.lineWidth = 1;
        } else {
          ctx.fillStyle = item.color;
          ctx.fillRect(legendX + legendPad, y - swatch / 2, swatch, swatch);
        }
        ctx.fillStyle = "#1d1d1f";
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillText(item.label, legendX + legendPad + swatch + gap, y);
        ctx.globalAlpha = 1;
      });
      legend = {
        items,
        bounds: { x: legendX, y: legendY, width: legendWidth, height: legendHeight }
      };
    }

    // Build right-axis state for _plotState
    const rightAxesState = rightAxisScales.map((scale, i) => {
      if (!scale) {
        return null;
      }
      return {
        series: rightAxes[i]?.series ?? [],
        yLabel: rightAxes[i]?.yLabel ?? "",
        yLabelRaw: rightAxes[i]?.yLabel ?? "",
        color: rightAxisPositions[i]?.color ?? rightAxes[i]?.color ?? "",
        yMin: scale.min,
        yMax: scale.max,
        yTicks: Array.isArray(scale.ticks) ? scale.ticks : [],
        position: rightAxisPositions[i]
      };
    }).filter(Boolean);

    canvas._plotState = {
      series: seriesList,
      rightAxes: rightAxesState,
      xTicks: Array.isArray(xScale.ticks) ? xScale.ticks : [],
      yTicks: yScale && Array.isArray(yScale.ticks) ? yScale.ticks : [],
      xLabel: displayXLabel ?? "",
      xLabelRaw: config?.xLabel ?? "",
      yLabel: displayYLabel ?? config?.yLabel ?? "",
      yLabelRaw: config?.yLabel ?? "",
      yAxisColor: yAxisColor ?? "",
      grid: Boolean(config?.grid),
      xTickFormat: config?.xTickFormat ?? null,
      xScaleType: xScale.type ?? "linear",
      yScaleType: yScale?.type ?? "linear",
      xMin: xScale.min ?? xMin,
      xMax: xScale.max ?? xMax,
      yMin: yScale?.min ?? yMin,
      yMax: yScale?.max ?? yMax,
      xLogMin: xScale.logMin,
      xLogMax: xScale.logMax,
      yLogMin: yScale?.logMin,
      yLogMax: yScale?.logMax,
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
