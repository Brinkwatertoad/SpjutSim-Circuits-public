/**
 * Plot tooltip: hover number formatting, nearest-index binary search, and
 * canvas tooltip attachment for simulation result plots.
 */
(function initUIPlotTooltipModule() {
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
    const formatHoverNumber = typeof options?.formatNumber === "function"
      ? options.formatNumber
      : (v) => String(v);
    const fallbackPalette = Array.isArray(options?.palette) && options.palette.length
      ? options.palette
      : ["#333"];
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
      const allHoverSeries = state.series.slice();
      if (Array.isArray(state.rightAxes)) {
        state.rightAxes.forEach((ra) => {
          if (Array.isArray(ra?.series)) ra.series.forEach((s) => allHoverSeries.push(s));
        });
      }
      allHoverSeries.forEach((entry) => {
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
      if (Array.isArray(state.rightAxes)) {
        state.rightAxes.forEach((rightAxis) => {
          if (!Array.isArray(rightAxis?.series)) return;
          const raYMin = rightAxis.yMin;
          const raYMax = rightAxis.yMax;
          const mapRaY = (value) => {
            if (!Number.isFinite(value)) return null;
            const denom = raYMax - raYMin;
            const t = denom === 0 ? 0 : (value - raYMin) / denom;
            return state.plotBottom - t * (state.plotBottom - state.plotTop);
          };
          rightAxis.series.forEach((entry, index) => {
            const idx = findNearestIndex(entry.x, snappedX);
            if (idx < 0 || idx >= entry.y.length) return;
            const label = entry.label ?? `Trace ${index + 1}`;
            const signal = entry.signal ?? label;
            const value = entry.y[idx];
            lines.push(`${label}: ${formatHoverNumber(value)}`);
            points.push({
              x: entry.x[idx],
              y: value,
              screenY: mapRaY(value),
              color: entry.color,
              label,
              signal
            });
          });
        });
      }
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
            const y = Number.isFinite(point.screenY) ? point.screenY : mapY(point.y);
            if (x === null || y === null) {
              return;
            }
            ctx.fillStyle = point.color ?? fallbackPalette[index % fallbackPalette.length];
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

  if (typeof self !== "undefined") {
    self.SpjutSimUIPlotTooltip = { findNearestIndex, attachPlotTooltip };
  }
})();
