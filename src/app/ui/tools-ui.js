/**
 * UI tools/tooltip/icon helpers.
 */
(function initUIToolsUIModule() {
  const POPOVER_VIEWPORT_MARGIN = 8;
  const POPOVER_ANCHOR_GAP = 6;

  const clampNumber = (value, min, max) => Math.min(max, Math.max(min, value));

  const positionPopoverInViewport = (popover, anchorRect, options = {}) => {
    if (!(popover instanceof HTMLElement) || !anchorRect) {
      return;
    }
    const viewportWidth = window.innerWidth || document.documentElement.clientWidth || 0;
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;
    if (!viewportWidth || !viewportHeight) {
      return;
    }
    const margin = Number.isFinite(options.margin) ? Math.max(0, options.margin) : POPOVER_VIEWPORT_MARGIN;
    const gap = Number.isFinite(options.gap) ? Math.max(0, options.gap) : POPOVER_ANCHOR_GAP;
    const align = options.align === "end" ? "end" : "start";
    const maxWidth = Math.max(120, Math.floor(viewportWidth - (margin * 2)));
    const maxHeight = Math.max(120, Math.floor(viewportHeight - (margin * 2)));

    popover.style.position = "fixed";
    popover.style.maxWidth = `${maxWidth}px`;
    popover.style.maxHeight = `${maxHeight}px`;
    popover.style.overflowY = "auto";
    popover.style.overflowX = "auto";

    popover.style.left = `${margin}px`;
    popover.style.top = `${margin}px`;
    const rect = popover.getBoundingClientRect();
    const measuredWidth = rect.width || popover.offsetWidth || 0;
    const measuredHeight = rect.height || popover.offsetHeight || 0;

    let left = align === "end"
      ? anchorRect.right - measuredWidth
      : anchorRect.left;
    let top = anchorRect.bottom + gap;
    const aboveTop = anchorRect.top - gap - measuredHeight;
    if (top + measuredHeight > viewportHeight - margin && aboveTop >= margin) {
      top = aboveTop;
    }

    const maxLeft = Math.max(margin, viewportWidth - margin - measuredWidth);
    const maxTop = Math.max(margin, viewportHeight - margin - measuredHeight);
    left = clampNumber(left, margin, maxLeft);
    top = clampNumber(top, margin, maxTop);

    popover.style.left = `${Math.round(left)}px`;
    popover.style.top = `${Math.round(top)}px`;
  };

  const createTooltipController = (options = {}) => {
    const container = options?.container instanceof HTMLElement ? options.container : document.body;
    const getHelpEnabled = typeof options?.getHelpEnabled === "function"
      ? options.getHelpEnabled
      : () => false;

    const tooltip = document.createElement("div");
    tooltip.className = "tool-tooltip";
    tooltip.dataset.toolTooltip = "1";
    tooltip.style.display = "none";
    container.appendChild(tooltip);

    const helpTooltip = document.createElement("div");
    helpTooltip.className = "tool-tooltip tool-tooltip-expanded";
    helpTooltip.dataset.helpTooltip = "1";
    helpTooltip.style.display = "none";
    container.appendChild(helpTooltip);

    const positionTooltipAt = (node, x, y) => {
      const offset = 12;
      const inset = 4;
      const viewportWidth = window.innerWidth || document.documentElement.clientWidth || 0;
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;
      const nodeRect = node.getBoundingClientRect();
      const nodeWidth = nodeRect.width || node.offsetWidth || 0;
      const nodeHeight = nodeRect.height || node.offsetHeight || 0;
      const mouseX = Number.isFinite(x) ? x : 0;
      const mouseY = Number.isFinite(y) ? y : 0;
      const maxLeft = Math.max(inset, viewportWidth - nodeWidth - inset);
      const maxTop = Math.max(inset, viewportHeight - nodeHeight - inset);
      const left = Math.min(maxLeft, Math.max(inset, mouseX + offset));
      const top = Math.min(maxTop, Math.max(inset, mouseY + offset));
      node.style.left = `${left}px`;
      node.style.top = `${top}px`;
    };

    const showTooltipAt = (text, x, y) => {
      if (!text) {
        return;
      }
      tooltip.textContent = text;
      tooltip.style.display = "block";
      positionTooltipAt(tooltip, x, y);
    };

    const hideTooltip = () => {
      tooltip.style.display = "none";
    };

    const showHelpTooltipAt = (title, body, x, y) => {
      if (!title && !body) {
        return;
      }
      helpTooltip.innerHTML = "";
      if (title) {
        const titleEl = document.createElement("strong");
        titleEl.textContent = title;
        helpTooltip.appendChild(titleEl);
      }
      if (body) {
        const bodyEl = document.createElement("div");
        bodyEl.textContent = body;
        if (title) {
          bodyEl.style.marginTop = "4px";
        }
        helpTooltip.appendChild(bodyEl);
      }
      helpTooltip.style.display = "block";
      positionTooltipAt(helpTooltip, x, y);
    };

    const hideHelpTooltip = () => {
      helpTooltip.style.display = "none";
    };

    const attachTooltip = (el, text) => {
      if (!el) {
        return;
      }
      const tooltipText = String(text ?? "").trim();
      if (!tooltipText) {
        el.removeAttribute("data-tooltip");
        return;
      }
      el.dataset.tooltip = tooltipText;
      if (el.dataset.tooltipBound === "1") {
        return;
      }
      el.dataset.tooltipBound = "1";
      const readTooltipText = () => String(el.dataset.tooltip ?? "").trim();
      el.addEventListener("mouseenter", (event) => {
        if (getHelpEnabled() && el.dataset.schematicHelpTitle) {
          return;
        }
        const currentText = readTooltipText();
        if (!currentText) {
          return;
        }
        showTooltipAt(currentText, event.clientX, event.clientY);
      });
      el.addEventListener("mousemove", (event) => {
        if (getHelpEnabled() && el.dataset.schematicHelpTitle) {
          return;
        }
        if (tooltip.style.display === "none") {
          return;
        }
        const currentText = readTooltipText();
        if (!currentText) {
          return;
        }
        showTooltipAt(currentText, event.clientX, event.clientY);
      });
      el.addEventListener("mouseleave", hideTooltip);
      el.addEventListener("focus", () => {
        if (getHelpEnabled() && el.dataset.schematicHelpTitle) {
          return;
        }
        const currentText = readTooltipText();
        if (!currentText) {
          return;
        }
        const rect = el.getBoundingClientRect();
        showTooltipAt(currentText, rect.left + rect.width / 2, rect.top);
      });
      el.addEventListener("blur", hideTooltip);
    };

    const applyCustomTooltip = (el, text) => {
      if (!el) {
        return;
      }
      el.removeAttribute("title");
      const tooltipText = String(text ?? "").trim();
      if (!tooltipText) {
        el.removeAttribute("aria-label");
        el.removeAttribute("data-tooltip");
        return;
      }
      el.setAttribute("aria-label", tooltipText);
      attachTooltip(el, tooltipText);
    };

    return {
      tooltip,
      helpTooltip,
      showTooltipAt,
      hideTooltip,
      showHelpTooltipAt,
      hideHelpTooltip,
      attachTooltip,
      applyCustomTooltip
    };
  };

  const createToolIcon = (tool, isElement, schematicApiOverride = null) => {
    const schematicApi = schematicApiOverride || (typeof self !== "undefined" ? self.SpjutSimSchematic : null);
    if (isElement && schematicApi && typeof schematicApi.renderSymbolIcon === "function") {
      const svg = schematicApi.renderSymbolIcon(tool, { width: 36, height: 18, stroke: "currentColor", strokeWidth: 2 });
      if (svg) {
        svg.dataset.toolIcon = tool;
        return svg;
      }
    }
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 48 24");
    svg.setAttribute("width", "36");
    svg.setAttribute("height", "18");
    svg.classList.add("tool-icon");
    svg.dataset.toolIcon = tool;
    const stroke = { stroke: "currentColor", "stroke-width": "2", fill: "none", "stroke-linecap": "round", "stroke-linejoin": "round" };
    const line = (x1, y1, x2, y2) => {
      const el = document.createElementNS(svg.namespaceURI, "line");
      el.setAttribute("x1", x1);
      el.setAttribute("y1", y1);
      el.setAttribute("x2", x2);
      el.setAttribute("y2", y2);
      Object.entries(stroke).forEach(([key, value]) => el.setAttribute(key, value));
      svg.appendChild(el);
    };
    const path = (d) => {
      const el = document.createElementNS(svg.namespaceURI, "path");
      el.setAttribute("d", d);
      Object.entries(stroke).forEach(([key, value]) => el.setAttribute(key, value));
      svg.appendChild(el);
    };
    if (tool === "wire") {
      line(4, 12, 44, 12);
      return svg;
    }
    if (tool === "select") {
      path("M8 2 L21 15 L17 14 L14 22 L12 21 L13 15 L8 17 Z");
      return svg;
    }
    return null;
  };

  const createActionIcon = (action) => {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("width", "20");
    svg.setAttribute("height", "20");
    svg.classList.add("action-icon");
    svg.dataset.actionIcon = action;
    const strokeAttrs = {
      stroke: "currentColor",
      "stroke-width": "1.9",
      fill: "none",
      "stroke-linecap": "round",
      "stroke-linejoin": "round"
    };
    const line = (x1, y1, x2, y2) => {
      const el = document.createElementNS(svg.namespaceURI, "line");
      el.setAttribute("x1", String(x1));
      el.setAttribute("y1", String(y1));
      el.setAttribute("x2", String(x2));
      el.setAttribute("y2", String(y2));
      Object.entries(strokeAttrs).forEach(([key, value]) => el.setAttribute(key, value));
      svg.appendChild(el);
    };
    const polyline = (points) => {
      const el = document.createElementNS(svg.namespaceURI, "polyline");
      el.setAttribute("points", points);
      Object.entries(strokeAttrs).forEach(([key, value]) => el.setAttribute(key, value));
      svg.appendChild(el);
    };
    const path = (d) => {
      const el = document.createElementNS(svg.namespaceURI, "path");
      el.setAttribute("d", d);
      Object.entries(strokeAttrs).forEach(([key, value]) => el.setAttribute(key, value));
      svg.appendChild(el);
    };
    const rect = (x, y, width, height, rx = 0) => {
      const el = document.createElementNS(svg.namespaceURI, "rect");
      el.setAttribute("x", String(x));
      el.setAttribute("y", String(y));
      el.setAttribute("width", String(width));
      el.setAttribute("height", String(height));
      if (rx > 0) {
        el.setAttribute("rx", String(rx));
      }
      Object.entries(strokeAttrs).forEach(([key, value]) => el.setAttribute(key, value));
      svg.appendChild(el);
    };
    const polygon = (points, fill = "currentColor") => {
      const el = document.createElementNS(svg.namespaceURI, "polygon");
      el.setAttribute("points", points);
      el.setAttribute("fill", fill);
      el.setAttribute("stroke", "none");
      svg.appendChild(el);
    };
    const circle = (cx, cy, r) => {
      const el = document.createElementNS(svg.namespaceURI, "circle");
      el.setAttribute("cx", String(cx));
      el.setAttribute("cy", String(cy));
      el.setAttribute("r", String(r));
      Object.entries(strokeAttrs).forEach(([key, value]) => el.setAttribute(key, value));
      svg.appendChild(el);
    };

    switch (action) {
      case "undo":
        polyline("10 6 5 11 10 16");
        path("M6 11h8c3.5 0 5 2 5 5");
        break;
      case "redo":
        polyline("14 6 19 11 14 16");
        path("M18 11h-8c-3.5 0-5 2-5 5");
        break;
      case "run":
        polygon("8 6 18 12 8 18");
        break;
      case "export":
        path("M12 4v10");
        polyline("8 10 12 14 16 10");
        rect(5, 16, 14, 4, 1);
        break;
      case "rotate-cw":
        path("M17 8a7 7 0 1 0-2 9");
        polyline("17 4 17 8 13 8");
        break;
      case "rotate-ccw":
        path("M7 8a7 7 0 1 1 2 9");
        polyline("7 4 7 8 11 8");
        break;
      case "flip-h":
        line(12, 5, 12, 19);
        polyline("10 8 7 12 10 16");
        polyline("14 8 17 12 14 16");
        break;
      case "flip-v":
        line(5, 12, 19, 12);
        polyline("8 10 12 7 16 10");
        polyline("8 14 12 17 16 14");
        break;
      case "duplicate":
        rect(8, 8, 10, 10, 1);
        rect(5, 5, 10, 10, 1);
        break;
      case "delete":
        rect(8, 9, 8, 10, 1);
        line(7, 9, 17, 9);
        line(10, 6, 14, 6);
        line(11, 11, 11, 17);
        line(13, 11, 13, 17);
        break;
      case "clear-probes":
        path("M5 19h14");
        line(7, 15, 11, 9);
        line(11, 9, 14, 12);
        line(13, 7, 16, 10);
        line(10, 6, 14, 6);
        break;
      case "results-show":
        rect(4, 5, 16, 14, 1);
        line(12, 5, 12, 19);
        line(14.5, 10, 17.5, 10);
        line(16, 8.5, 16, 11.5);
        break;
      case "results-hide":
        rect(4, 5, 16, 14, 1);
        line(12, 5, 12, 19);
        line(14.5, 9.5, 17.5, 12.5);
        line(17.5, 9.5, 14.5, 12.5);
        break;
      case "results-expand":
        rect(4, 5, 16, 14, 1);
        line(9, 5, 9, 19);
        line(6, 12, 15, 12);
        polyline("11 9 15 12 11 15");
        break;
      case "results-split":
        rect(4, 5, 16, 14, 1);
        line(12, 5, 12, 19);
        line(8, 9, 8, 15);
        line(16, 9, 16, 15);
        break;
      case "schematic-show":
        rect(4, 5, 16, 14, 1);
        line(12, 5, 12, 19);
        line(8, 9, 8, 15);
        break;
      case "schematic-hide":
        rect(4, 5, 16, 14, 1);
        line(12, 5, 12, 19);
        line(6.5, 9.5, 9.5, 12.5);
        line(9.5, 9.5, 6.5, 12.5);
        break;
      case "info-view":
        circle(12, 6, 1.2);
        path("M12 10v6.4");
        path("M12 16.4c0 1.6 1 2.6 2.6 2.6");
        break;
      case "grid":
        rect(4, 4, 16, 16);
        line(9, 4, 9, 20);
        line(14, 4, 14, 20);
        line(4, 9, 20, 9);
        line(4, 14, 20, 14);
        break;
      case "zoom-fit":
        rect(3, 3, 18, 18, 1);
        polyline("9 7 7 7 7 9");
        polyline("7 15 7 17 9 17");
        polyline("15 7 17 7 17 9");
        polyline("17 15 17 17 15 17");
        break;
      default:
        return null;
    }
    return svg;
  };

  const normalizeToolbarElementDefinition = (entry) => {
    const type = String(entry?.type ?? "").trim().toUpperCase();
    const toolLabel = String(entry?.toolLabel ?? "").trim();
    const toolName = String(entry?.toolName ?? "").trim();
    const shortcut = String(entry?.shortcut ?? "").trim();
    if (!type || !toolLabel || !toolName || !shortcut) {
      throw new Error(`Schematic element catalog entry is missing required fields. type='${type || "?"}'`);
    }
    const help = entry?.help;
    const helpTitle = String(help?.title ?? "").trim();
    const helpSummary = String(help?.summary ?? "").trim();
    const helpDefinition = String(help?.definition ?? "").trim();
    if (!helpTitle || !helpSummary || !helpDefinition) {
      throw new Error(`Schematic element catalog help metadata is incomplete for '${type}'.`);
    }
    return {
      type,
      toolLabel,
      toolName,
      shortcut,
      help: {
        title: helpTitle,
        summary: helpSummary,
        definition: helpDefinition
      }
    };
  };

  const buildToolbarElementDefinitions = (readEntries) => {
    const raw = typeof readEntries === "function" ? readEntries() : [];
    if (!Array.isArray(raw) || !raw.length) {
      throw new Error("Schematic API listToolbarElementDefinitions() returned no entries.");
    }
    return raw.map((entry) => normalizeToolbarElementDefinition(entry));
  };

  const buildToolHelp = (toolbarElementDefinitions) => {
    const elementToolHelp = (Array.isArray(toolbarElementDefinitions) ? toolbarElementDefinitions : []).reduce((acc, entry) => {
      acc[entry.type] = entry.help;
      return acc;
    }, {});
    return {
      select: {
        title: "Select",
        summary: "Select and move components or wires.",
        definition: "Click to select; drag to move; shift-click to multi-select."
      },
      wire: {
        title: "Wire (W)",
        summary: "Draw orthogonal wires between nodes.",
        definition: "Click to start and click to finish a wire segment."
      },
      ...elementToolHelp
    };
  };

  if (typeof self !== "undefined") {
    self.SpjutSimUIToolsUI = {
      createTooltipController,
      positionPopoverInViewport,
      createToolIcon,
      createActionIcon,
      normalizeToolbarElementDefinition,
      buildToolbarElementDefinitions,
      buildToolHelp
    };
  }
})();
