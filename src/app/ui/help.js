/**
 * UI help metadata helpers.
 */
(function initUIHelpModule() {
  const buildDefaultHelpEntries = () => ({
    gridSize: {
      title: "Grid size",
      summary: "Sets the grid spacing for placement and snap.",
      definition: "Choose 5, 10, or 20 for finer or coarser spacing."
    },
    gridShow: {
      title: "Grid show",
      summary: "Toggle grid visibility.",
      definition: "Hide the grid without changing snap behavior."
    },
    zoomFit: {
      title: "Zoom to fit",
      summary: "Fit all circuit elements into view.",
      definition: "Recenters and resizes the view so all placed components are visible."
    },
    undo: {
      title: "Undo (Ctrl+Z)",
      summary: "Revert the last action.",
      definition: "Step backward through edit history."
    },
    redo: {
      title: "Redo (Ctrl+Y)",
      summary: "Reapply the last undone action.",
      definition: "Step forward through edit history."
    },
    rotateCw: {
      title: "Rotate CW (Space)",
      summary: "Rotate selected components clockwise.",
      definition: "In placement mode, rotates the active preview."
    },
    rotateCcw: {
      title: "Rotate CCW (Shift+Space)",
      summary: "Rotate selected components counter-clockwise.",
      definition: "In placement mode, rotates the active preview counter-clockwise."
    },
    flipH: {
      title: "Flip H (X)",
      summary: "Flip selected components horizontally.",
      definition: "In placement mode, flips the active preview."
    },
    flipV: {
      title: "Flip V (Y)",
      summary: "Flip selected components vertically.",
      definition: "In placement mode, flips the active preview."
    },
    duplicate: {
      title: "Duplicate",
      summary: "Duplicate the current selection.",
      definition: "Starts a grayed-out placement preview. Left-click to place the copy."
    },
    delete: {
      title: "Delete (Del)",
      summary: "Remove the current selection.",
      definition: "Deletes selected components or wires."
    },
    clearProbes: {
      title: "Clear Probes",
      summary: "Remove all probe components from the schematic.",
      definition: "Deletes persistent probe objects without affecting circuit elements."
    },
    exportSvg: {
      title: "Export SVG",
      summary: "Export the schematic as SVG.",
      definition: "Creates a vector graphic of the current schematic."
    },
    exportPng: {
      title: "Export Diagram",
      summary: "Export the schematic as PNG or SVG.",
      definition: "Opens the Export Diagram dialog to choose format, resolution, and filename."
    },
    exportCsvOp: {
      title: "Export CSV (OP)",
      summary: "Export operating-point results to a single CSV file.",
      definition: "Exports the tables in one file with units in the headers."
    },
    exportCsvDc: {
      title: "Export CSV (DC)",
      summary: "Export selected DC sweep signals to CSV.",
      definition: "Only selected signals are included, with units in column headers."
    },
    exportCsvTran: {
      title: "Export CSV (TRAN)",
      summary: "Export selected transient signals to CSV.",
      definition: "Only selected signals are included, with units in column headers."
    },
    exportCsvAc: {
      title: "Export CSV (AC)",
      summary: "Export selected AC signals (magnitude + phase) to CSV.",
      definition: "Only selected signals are included, with units in column headers."
    },
    simTabOp: {
      title: "DC (Operating Point)",
      summary: "View operating-point results.",
      definition: "Also selects OP (`.op`) as the active analysis for the Run Simulation button."
    },
    simTabDc: {
      title: "DC Sweep",
      summary: "View DC sweep results.",
      definition: "Also selects DC sweep (`.dc`) as the active analysis for the Run Simulation button."
    },
    simTabTran: {
      title: "Transient",
      summary: "View transient waveforms over time.",
      definition: "Also selects transient analysis (`.tran`) as the active analysis for the Run Simulation button."
    },
    simTabAc: {
      title: "AC",
      summary: "View AC magnitude and phase plots.",
      definition: "Also selects AC analysis (`.ac`) as the active analysis for the Run Simulation button."
    },
    simTabLog: {
      title: "Log",
      summary: "Inspect ngspice and app log output.",
      definition: "Use this tab to troubleshoot parse errors, warnings, and runtime issues."
    },
    runSimulation: {
      title: "Run Simulation (F5)",
      summary: "Run the currently selected analysis.",
      definition: "Compiles schematic + analysis settings into a netlist and executes it."
    },
    resetSimulation: {
      title: "Reset",
      summary: "Reset the simulator worker state.",
      definition: "Clears simulator state and re-initializes ngspice."
    },
    saveSignals: {
      title: "Save Signals",
      summary: "Optional signal filter for `.save` directives.",
      definition: "Comma-separated list such as `v(out), i(R1)`. Empty uses analysis defaults."
    },
    netlistPreamble: {
      title: "Netlist Preamble",
      summary: "Editable directives prepended to the generated netlist.",
      definition: "Use this area for global directives like `.include` or `.options`."
    },
    generatedNetlist: {
      title: "Generated Netlist",
      summary: "Preview of the netlist that will run.",
      definition: "Reflects schematic connectivity plus the currently active analysis settings. Selecting wires or circuit elements highlights matching netlist text."
    },
    copyNetlist: {
      title: "Copy Netlist",
      summary: "Copy the full generated netlist to the clipboard.",
      definition: "Copies the exact netlist text shown in the generated preview to the clipboard so it can be pasted into external tools."
    },
    hoverInfo: {
      title: "Hover Info (H)",
      summary: "Show more descriptive hover explanations.",
      definition: ""
    }
  });

  const applyHelpEntry = (target, entry) => {
    if (!target || !entry) {
      return;
    }
    target.dataset.schematicHelpTitle = entry.title ?? "";
    target.dataset.schematicHelpSummary = entry.summary ?? "";
    target.dataset.schematicHelpDefinition = entry.definition ?? "";
  };

  const buildConfigHelpMap = () => ({
    "dc:source": {
      title: "DC Sweep Source",
      summary: "Independent source to sweep during `.dc` analysis.",
      definition: "Use a source name such as `V1` or `I1`."
    },
    "dc:start": {
      title: "DC Start Value",
      summary: "Starting value for the DC sweep.",
      definition: "Used as the first sweep point in the generated `.dc` directive."
    },
    "dc:stop": {
      title: "DC Stop Value",
      summary: "Ending value for the DC sweep.",
      definition: "Used as the final sweep point in the generated `.dc` directive."
    },
    "dc:step": {
      title: "DC Step Value",
      summary: "Increment between sweep points.",
      definition: "Controls DC sweep resolution and point count."
    },
    "tran:source": {
      title: "Transient Source",
      summary: "Source to override for transient runs.",
      definition: "Matches an independent source id in the compiled netlist, typically `V1`."
    },
    "tran:sourceMode": {
      title: "Transient Waveform",
      summary: "Waveform builder mode for transient source override.",
      definition: "Select Pulse, DC, Sine, PWL, or Custom value."
    },
    "tran:sourceValue": {
      title: "Transient Source Preview",
      summary: "Resolved source value used in the generated netlist.",
      definition: "Read-only preview assembled from waveform controls."
    },
    "tran:step": {
      title: "Transient Step",
      summary: "Suggested output time step.",
      definition: "First argument of `.tran` and affects waveform sample density."
    },
    "tran:stop": {
      title: "Transient Stop Time",
      summary: "Simulation stop time for transient analysis.",
      definition: "Second argument of `.tran`."
    },
    "tran:start": {
      title: "Transient Start Time",
      summary: "Optional start time for waveform output.",
      definition: "Third `.tran` argument; default is 0."
    },
    "tran:maxStep": {
      title: "Transient Max Step",
      summary: "Optional maximum internal timestep.",
      definition: "Fourth `.tran` argument for tighter accuracy control."
    },
    "ac:sweep": {
      title: "AC Sweep Mode",
      summary: "Frequency spacing mode for AC analysis.",
      definition: "LIN, DEC, or OCT in the generated `.ac` directive."
    },
    "ac:source": {
      title: "AC Source",
      summary: "Source to override for AC runs.",
      definition: "Matches an independent source id in the compiled netlist, typically `V1`."
    },
    "ac:sourceValue": {
      title: "AC Source Value",
      summary: "Value string applied to the selected AC source.",
      definition: "Typically `ac 1` to define small-signal magnitude."
    },
    "ac:points": {
      title: "AC Points",
      summary: "Points per decade/octave/linear step.",
      definition: "Second argument of `.ac` after sweep mode."
    },
    "ac:start": {
      title: "AC Start Frequency",
      summary: "Start frequency for AC sweep.",
      definition: "Third argument of `.ac`."
    },
    "ac:stop": {
      title: "AC Stop Frequency",
      summary: "Stop frequency for AC sweep.",
      definition: "Fourth argument of `.ac`."
    }
  });

  const getConfigHelpEntry = (configHelpMap, kind, key, labelText) => {
    const map = configHelpMap && typeof configHelpMap === "object" ? configHelpMap : {};
    const mapped = map[`${kind}:${key}`];
    if (mapped) {
      return mapped;
    }
    return {
      title: labelText,
      summary: `Configure ${String(labelText ?? "").toLowerCase()} for ${String(kind ?? "").toUpperCase()} analysis.`,
      definition: "This value is written directly into the generated analysis directives."
    };
  };

  const createHelpInteractionController = (options = {}) => {
    const showHelpTooltipAt = typeof options.showHelpTooltipAt === "function" ? options.showHelpTooltipAt : () => {};
    const hideHelpTooltip = typeof options.hideHelpTooltip === "function" ? options.hideHelpTooltip : () => {};
    const isHelpTooltipVisible = typeof options.isHelpTooltipVisible === "function"
      ? options.isHelpTooltipVisible
      : () => false;
    const findToggleMenuItem = typeof options.findToggleMenuItem === "function"
      ? options.findToggleMenuItem
      : () => document.querySelector("[data-menu-action=\"toggle-help\"]");
    const onHelpEnabledChanged = typeof options.onHelpEnabledChanged === "function"
      ? options.onHelpEnabledChanged
      : () => {};

    let enabled = true;
    let workspaceHelpToggleButton = null;
    let selectedHelpTarget = null;
    let currentHelpTitle = "";
    let currentHelpBody = "";

    const setHelpPanel = (target) => {
      if (!target) {
        currentHelpTitle = "";
        currentHelpBody = "";
        return;
      }
      const title = target.dataset.schematicHelpTitle;
      const summary = target.dataset.schematicHelpSummary;
      const definition = target.dataset.schematicHelpDefinition;
      if (!title && !summary && !definition) {
        return;
      }
      currentHelpTitle = title ?? "";
      currentHelpBody = [summary, definition].filter(Boolean).join(" ");
    };

    const updateHelpMenuLabel = () => {
      const menuItem = findToggleMenuItem();
      if (!menuItem) {
        return;
      }
      const labelSpan = menuItem.querySelector(".menu-item-label");
      if (labelSpan) {
        labelSpan.textContent = enabled ? "Hover Info: On" : "Hover Info: Off";
      } else {
        menuItem.textContent = enabled ? "Hover Info: On" : "Hover Info: Off";
      }
    };

    const updateWorkspaceHelpToggleState = () => {
      if (!(workspaceHelpToggleButton instanceof HTMLButtonElement)) {
        return;
      }
      workspaceHelpToggleButton.classList.toggle("active", enabled);
      workspaceHelpToggleButton.setAttribute("aria-pressed", enabled ? "true" : "false");
    };

    const setEnabled = (next) => {
      enabled = Boolean(next);
      updateHelpMenuLabel();
      updateWorkspaceHelpToggleState();
      if (!enabled) {
        hideHelpTooltip();
      }
      onHelpEnabledChanged(enabled);
    };

    const toggleEnabled = () => {
      setEnabled(!enabled);
    };

    const registerHelpTarget = (target) => {
      if (!target) {
        return;
      }
      if (target.dataset.schematicHelpRegistered === "1") {
        return;
      }
      target.dataset.schematicHelpRegistered = "1";
      target.addEventListener("mouseenter", (event) => {
        if (!enabled) {
          return;
        }
        setHelpPanel(target);
        showHelpTooltipAt(currentHelpTitle, currentHelpBody, event.clientX, event.clientY);
      });
      target.addEventListener("mousemove", (event) => {
        if (!enabled || !isHelpTooltipVisible()) {
          return;
        }
        showHelpTooltipAt(currentHelpTitle, currentHelpBody, event.clientX, event.clientY);
      });
      target.addEventListener("mouseleave", () => {
        hideHelpTooltip();
        if (!enabled) {
          return;
        }
        if (selectedHelpTarget && selectedHelpTarget !== target) {
          setHelpPanel(selectedHelpTarget);
        }
      });
      target.addEventListener("focus", () => {
        if (!enabled) {
          return;
        }
        setHelpPanel(target);
        const rect = target.getBoundingClientRect();
        showHelpTooltipAt(currentHelpTitle, currentHelpBody, rect.left + rect.width / 2, rect.top);
      });
      target.addEventListener("blur", () => {
        hideHelpTooltip();
      });
    };

    const registerAllHelpTargets = (root) => {
      if (!root) {
        return;
      }
      root.querySelectorAll("[data-schematic-help-title]").forEach((target) => {
        registerHelpTarget(target);
      });
    };

    return {
      isEnabled: () => enabled,
      setEnabled,
      toggleEnabled,
      setWorkspaceHelpToggleButton: (button) => {
        workspaceHelpToggleButton = button instanceof HTMLButtonElement ? button : null;
        updateWorkspaceHelpToggleState();
      },
      setSelectedHelpTarget: (target) => {
        selectedHelpTarget = target ?? null;
      },
      getSelectedHelpTarget: () => selectedHelpTarget,
      updateHelpMenuLabel,
      registerHelpTarget,
      registerAllHelpTargets
    };
  };

  if (typeof self !== "undefined") {
    self.SpjutSimUIHelp = {
      buildDefaultHelpEntries,
      buildConfigHelpMap,
      getConfigHelpEntry,
      createHelpInteractionController,
      applyHelpEntry
    };
  }
})();
