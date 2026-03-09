/**
 * UI simulation config helpers.
 */
(function initUISimulationConfigModule() {
  const trimToken = (value) => String(value ?? "").trim();

  const readAvailableSourceIds = (compileInfo, sourceComponentTypes) => {
    const componentLines = compileInfo && typeof compileInfo.componentLines === "object"
      ? compileInfo.componentLines
      : null;
    if (!componentLines) {
      return [];
    }
    const sourceTypes = sourceComponentTypes instanceof Set
      ? sourceComponentTypes
      : new Set(["V", "VAC", "I"]);
    const sourceIds = [];
    Object.values(componentLines).forEach((lineInfo) => {
      const type = String(lineInfo?.type ?? "").trim().toUpperCase();
      if (!sourceTypes.has(type)) {
        return;
      }
      const netlistId = String(lineInfo?.netlistId ?? "").trim();
      if (!netlistId) {
        return;
      }
      sourceIds.push(netlistId);
    });
    return Array.from(new Set(sourceIds));
  };

  const syncSourceInputOptions = (input = {}) => {
    const compileInfo = input.compileInfo;
    const sourceInputBindings = Array.isArray(input.sourceInputBindings) ? input.sourceInputBindings : [];
    const fallbackSimulationConfig = input.simulationConfig && typeof input.simulationConfig === "object"
      ? input.simulationConfig
      : {};
    const getSimulationConfig = typeof input.getSimulationConfig === "function"
      ? input.getSimulationConfig
      : () => fallbackSimulationConfig;
    const sourceGuidanceNote = input.sourceGuidanceNote;
    const sourceIds = readAvailableSourceIds(compileInfo, input.sourceComponentTypes);
    let configChanged = false;
    sourceInputBindings.forEach(({ kind, key, select }) => {
      if (!(select instanceof HTMLSelectElement)) {
        return;
      }
      const simulationConfig = getSimulationConfig();
      if (!simulationConfig || typeof simulationConfig !== "object") {
        return;
      }
      const previousValue = String(simulationConfig?.[kind]?.[key] ?? "").trim();
      const nextValue = sourceIds.includes(previousValue) ? previousValue : (sourceIds[0] ?? "");
      select.innerHTML = "";
      if (sourceIds.length) {
        sourceIds.forEach((sourceId) => {
          const option = document.createElement("option");
          option.value = sourceId;
          option.textContent = sourceId;
          select.appendChild(option);
        });
      } else {
        const option = document.createElement("option");
        option.value = "";
        option.textContent = "No sources available";
        select.appendChild(option);
      }
      select.disabled = sourceIds.length === 0;
      select.value = nextValue;
      if (simulationConfig?.[kind] && simulationConfig[kind][key] !== nextValue) {
        simulationConfig[kind][key] = nextValue;
        configChanged = true;
      }
    });

    if (sourceGuidanceNote instanceof HTMLElement) {
      sourceGuidanceNote.hidden = sourceIds.length > 0;
      sourceGuidanceNote.textContent = sourceIds.length
        ? ""
        : "No source components are available. Add a Voltage Source (V), AC Voltage Source (VAC), or Current Source (I) from the Tools panel.";
    }
    return configChanged;
  };

  const buildSpiceFunction = (name, values, minCount) => {
    const tokens = values.map(trimToken);
    while (tokens.length && !tokens[tokens.length - 1]) {
      tokens.pop();
    }
    if (tokens.length < minCount) {
      return "";
    }
    return `${name}(${tokens.join(" ")})`;
  };

  const buildPwlValue = (raw) => {
    const lines = String(raw ?? "").split(/\r?\n/);
    const tokens = [];
    lines.forEach((line) => {
      const parts = line.trim().split(/[\s,]+/).filter(Boolean);
      if (parts.length >= 2) {
        tokens.push(parts[0], parts[1]);
      }
    });
    if (tokens.length < 2) {
      return "";
    }
    return `pwl(${tokens.join(" ")})`;
  };

  const buildTranSourceValue = (tranConfig = {}) => {
    const tran = tranConfig && typeof tranConfig === "object" ? tranConfig : {};
    const mode = String(tran.sourceMode ?? "custom").toLowerCase();
    switch (mode) {
      case "dc":
        return trimToken(tran.dcValue);
      case "pulse":
        return buildSpiceFunction("pulse", [
          tran.pulseLow,
          tran.pulseHigh,
          tran.pulseDelay,
          tran.pulseRise,
          tran.pulseFall,
          tran.pulseWidth,
          tran.pulsePeriod
        ], 2);
      case "sine":
        return buildSpiceFunction("sin", [
          tran.sineOffset,
          tran.sineAmplitude,
          tran.sineFreq,
          tran.sineDelay,
          tran.sineDamping,
          tran.sinePhase
        ], 3);
      case "pwl":
        return buildPwlValue(tran.pwlPoints);
      case "custom":
        return trimToken(tran.customValue);
      default:
        return trimToken(tran.sourceValue);
    }
  };

  const updateTranWaveformVisibility = (tranWaveGroups, activeMode) => {
    const groups = tranWaveGroups && typeof tranWaveGroups === "object" ? tranWaveGroups : {};
    const active = String(activeMode ?? "custom").toLowerCase();
    Object.entries(groups).forEach(([mode, group]) => {
      if (group && typeof group === "object") {
        group.hidden = mode !== active;
      }
    });
  };

  const createConfigField = (input = {}) => {
    const kind = String(input.kind ?? "").trim();
    const key = String(input.key ?? "").trim();
    const labelText = String(input.labelText ?? "");
    const placeholder = String(input.placeholder ?? "");
    const options = input.options && typeof input.options === "object" ? input.options : {};
    const configSections = input.configSections && typeof input.configSections === "object"
      ? input.configSections
      : {};
    const configInputs = input.configInputs && typeof input.configInputs === "object"
      ? input.configInputs
      : {};
    const fallbackSimulationConfig = input.simulationConfig && typeof input.simulationConfig === "object"
      ? input.simulationConfig
      : {};
    const getSimulationConfig = typeof input.getSimulationConfig === "function"
      ? input.getSimulationConfig
      : () => fallbackSimulationConfig;
    const applyHelpEntry = typeof input.applyHelpEntry === "function" ? input.applyHelpEntry : () => {};
    const getConfigHelpEntry = typeof input.getConfigHelpEntry === "function" ? input.getConfigHelpEntry : () => null;
    const refreshSchematicNetlistFallback = typeof input.refreshSchematicNetlist === "function"
      ? input.refreshSchematicNetlist
      : () => {};
    const getRefreshSchematicNetlist = typeof input.getRefreshSchematicNetlist === "function"
      ? input.getRefreshSchematicNetlist
      : () => refreshSchematicNetlistFallback;
    const queueAutosave = typeof input.queueAutosave === "function" ? input.queueAutosave : () => {};

    if (!kind || !key) {
      throw new Error("createConfigField requires non-empty kind/key.");
    }
    const row = document.createElement("div");
    row.className = "schematic-config-row";
    const fieldLabel = document.createElement("label");
    fieldLabel.textContent = labelText;
    const isTextarea = options.tag === "textarea";
    const isSelect = options.tag === "select";
    const fieldInput = document.createElement(isTextarea ? "textarea" : (isSelect ? "select" : "input"));
    if (!isTextarea && !isSelect) {
      fieldInput.type = options.type ?? "text";
    } else if (Number.isFinite(options.rows)) {
      fieldInput.rows = options.rows;
    }
    if (isSelect) {
      const selectOptions = Array.isArray(options.selectOptions) ? options.selectOptions : [];
      selectOptions.forEach((entry) => {
        const option = document.createElement("option");
        option.value = String(entry?.value ?? "");
        option.textContent = String(entry?.label ?? entry?.value ?? "");
        fieldInput.appendChild(option);
      });
    }
    if (options.className) {
      fieldInput.classList.add(options.className);
    }
    const ensureKindConfig = () => {
      const simulationConfig = getSimulationConfig();
      if (!simulationConfig || typeof simulationConfig !== "object") {
        throw new Error("createConfigField requires simulationConfig object.");
      }
      if (!simulationConfig[kind] || typeof simulationConfig[kind] !== "object") {
        simulationConfig[kind] = {};
      }
      return simulationConfig[kind];
    };
    fieldInput.value = ensureKindConfig()[key] ?? "";
    if (!isSelect) {
      fieldInput.placeholder = placeholder;
    }
    fieldInput.dataset.schematicConfig = `${kind}:${key}`;
    if (options.readOnly) {
      fieldInput.readOnly = true;
    }
    const helpEntry = options.help ?? getConfigHelpEntry(kind, key, labelText);
    applyHelpEntry(fieldLabel, helpEntry);
    applyHelpEntry(fieldInput, helpEntry);
    const eventName = options.event ?? (isSelect ? "change" : "input");
    fieldInput.addEventListener(eventName, () => {
      ensureKindConfig()[key] = fieldInput.value;
      if (typeof options.onInput === "function") {
        options.onInput(fieldInput.value);
      } else {
        const refreshSchematicNetlist = getRefreshSchematicNetlist();
        if (typeof refreshSchematicNetlist === "function") {
          refreshSchematicNetlist();
        }
      }
      queueAutosave();
    });
    row.append(fieldLabel, fieldInput);
    const parent = options.parent ?? configSections[kind];
    if (!(parent instanceof HTMLElement)) {
      throw new Error(`createConfigField missing parent for ${kind}:${key}.`);
    }
    parent.appendChild(row);
    configInputs[kind] = configInputs[kind] ?? {};
    configInputs[kind][key] = fieldInput;
    return fieldInput;
  };

  const createSourceConfigField = (input = {}) => {
    const kind = String(input.kind ?? "").trim();
    const key = String(input.key ?? "").trim();
    const labelText = String(input.labelText ?? "");
    const createConfigFieldImpl = typeof input.createConfigField === "function" ? input.createConfigField : null;
    if (!createConfigFieldImpl) {
      throw new Error("createSourceConfigField requires createConfigField callback.");
    }
    const select = createConfigFieldImpl(kind, key, labelText, "", {
      tag: "select",
      event: "change",
      selectOptions: []
    });
    const sourceInputBindings = Array.isArray(input.sourceInputBindings) ? input.sourceInputBindings : null;
    if (sourceInputBindings) {
      sourceInputBindings.push({ kind, key, select });
    }
    return select;
  };

  const createSimulationHeader = (input = {}) => {
    const resetButton = input.resetButton instanceof HTMLButtonElement ? input.resetButton : document.createElement("button");
    const applyHelpEntry = typeof input.applyHelpEntry === "function" ? input.applyHelpEntry : () => {};
    const helpEntries = input.helpEntries && typeof input.helpEntries === "object" ? input.helpEntries : {};

    const simulationHeader = document.createElement("div");
    simulationHeader.className = "schematic-simulation-header";
    const schematicRunButton = document.createElement("button");
    schematicRunButton.type = "button";
    schematicRunButton.className = "secondary";
    schematicRunButton.textContent = "Run Simulation";
    schematicRunButton.dataset.schematicAnalysisAction = "run";
    schematicRunButton.dataset.actionIntent = "run";
    applyHelpEntry(schematicRunButton, helpEntries.runSimulation);

    resetButton.dataset.schematicAnalysisAction = "reset";
    applyHelpEntry(resetButton, helpEntries.resetSimulation);
    simulationHeader.append(schematicRunButton, resetButton);
    return { simulationHeader, schematicRunButton };
  };

  const createConfigSections = (input = {}) => {
    const simulationKinds = Array.isArray(input.simulationKinds) ? input.simulationKinds : [];
    const applyHelpEntry = typeof input.applyHelpEntry === "function" ? input.applyHelpEntry : () => {};
    const helpEntries = input.helpEntries && typeof input.helpEntries === "object" ? input.helpEntries : {};
    const helpKeyByKind = Object.freeze({
      op: "simTabOp",
      dc: "simTabDc",
      tran: "simTabTran",
      ac: "simTabAc"
    });

    const configContainer = document.createElement("div");
    configContainer.className = "schematic-configs";
    const configSections = {};
    simulationKinds.forEach((entry) => {
      const section = document.createElement("div");
      section.className = "schematic-config-section";
      section.dataset.kind = entry.id;
      const heading = document.createElement("div");
      heading.className = "schematic-config-title";
      heading.textContent = String(entry?.label ?? "");
      const helpKey = helpKeyByKind[String(entry?.id ?? "").toLowerCase()] ?? "";
      if (helpKey && helpEntries[helpKey]) {
        applyHelpEntry(heading, helpEntries[helpKey]);
      }
      section.appendChild(heading);
      configContainer.appendChild(section);
      configSections[entry.id] = section;
    });
    return { configContainer, configSections };
  };

  const createTranWaveGroup = (input = {}) => {
    const mode = String(input.mode ?? "").trim().toLowerCase();
    const tranWaveGroups = input.tranWaveGroups && typeof input.tranWaveGroups === "object"
      ? input.tranWaveGroups
      : {};
    const configSections = input.configSections && typeof input.configSections === "object"
      ? input.configSections
      : {};
    const tranSection = configSections.tran;
    if (!mode || !(tranSection instanceof HTMLElement)) {
      throw new Error("createTranWaveGroup requires mode and tran config section.");
    }
    const group = document.createElement("div");
    group.className = "schematic-config-group";
    group.dataset.tranWaveform = mode;
    tranWaveGroups[mode] = group;
    tranSection.appendChild(group);
    return group;
  };

  const createTranSourceModeField = (input = {}) => {
    const configSections = input.configSections && typeof input.configSections === "object"
      ? input.configSections
      : {};
    const configInputs = input.configInputs && typeof input.configInputs === "object"
      ? input.configInputs
      : {};
    const fallbackSimulationConfig = input.simulationConfig && typeof input.simulationConfig === "object"
      ? input.simulationConfig
      : {};
    const getSimulationConfig = typeof input.getSimulationConfig === "function"
      ? input.getSimulationConfig
      : () => fallbackSimulationConfig;
    const configHelpMap = input.configHelpMap && typeof input.configHelpMap === "object"
      ? input.configHelpMap
      : {};
    const applyHelpEntry = typeof input.applyHelpEntry === "function" ? input.applyHelpEntry : () => {};
    const updateTranWaveformVisibility = typeof input.updateTranWaveformVisibility === "function"
      ? input.updateTranWaveformVisibility
      : () => {};
    const refreshTranSource = typeof input.refreshTranSource === "function" ? input.refreshTranSource : () => {};
    const queueAutosave = typeof input.queueAutosave === "function" ? input.queueAutosave : () => {};
    const tranSection = configSections.tran;
    if (!(tranSection instanceof HTMLElement)) {
      throw new Error("createTranSourceModeField requires tran config section.");
    }
    const ensureTranConfig = () => {
      const simulationConfig = getSimulationConfig();
      if (!simulationConfig || typeof simulationConfig !== "object") {
        throw new Error("createTranSourceModeField requires simulationConfig object.");
      }
      if (!simulationConfig.tran || typeof simulationConfig.tran !== "object") {
        simulationConfig.tran = {};
      }
      return simulationConfig.tran;
    };
    const sourceModeOptions = Array.isArray(input.sourceModeOptions) && input.sourceModeOptions.length
      ? input.sourceModeOptions
      : [
          { id: "pulse", label: "Pulse" },
          { id: "dc", label: "DC" },
          { id: "sine", label: "Sine" },
          { id: "pwl", label: "PWL" },
          { id: "custom", label: "Custom" }
        ];
    const row = document.createElement("div");
    row.className = "schematic-config-row";
    const label = document.createElement("label");
    label.textContent = "Waveform";
    const select = document.createElement("select");
    sourceModeOptions.forEach((entry) => {
      const option = document.createElement("option");
      option.value = String(entry?.id ?? "");
      option.textContent = String(entry?.label ?? entry?.id ?? "");
      select.appendChild(option);
    });
    const initialSourceMode = String(ensureTranConfig().sourceMode ?? sourceModeOptions[0]?.id ?? "custom");
    select.value = initialSourceMode;
    ensureTranConfig().sourceMode = select.value;
    select.dataset.schematicConfig = "tran:sourceMode";
    const helpEntry = configHelpMap["tran:sourceMode"] ?? null;
    applyHelpEntry(label, helpEntry);
    applyHelpEntry(select, helpEntry);
    select.addEventListener("change", () => {
      ensureTranConfig().sourceMode = select.value;
      updateTranWaveformVisibility();
      refreshTranSource();
      queueAutosave();
    });
    row.append(label, select);
    tranSection.appendChild(row);
    configInputs.tran = configInputs.tran ?? {};
    configInputs.tran.sourceMode = select;
    return select;
  };

  const createAcSweepField = (input = {}) => {
    const configSections = input.configSections && typeof input.configSections === "object"
      ? input.configSections
      : {};
    const configInputs = input.configInputs && typeof input.configInputs === "object"
      ? input.configInputs
      : {};
    const fallbackSimulationConfig = input.simulationConfig && typeof input.simulationConfig === "object"
      ? input.simulationConfig
      : {};
    const getSimulationConfig = typeof input.getSimulationConfig === "function"
      ? input.getSimulationConfig
      : () => fallbackSimulationConfig;
    const configHelpMap = input.configHelpMap && typeof input.configHelpMap === "object"
      ? input.configHelpMap
      : {};
    const applyHelpEntry = typeof input.applyHelpEntry === "function" ? input.applyHelpEntry : () => {};
    const refreshSchematicNetlistFallback = typeof input.refreshSchematicNetlist === "function"
      ? input.refreshSchematicNetlist
      : () => {};
    const getRefreshSchematicNetlist = typeof input.getRefreshSchematicNetlist === "function"
      ? input.getRefreshSchematicNetlist
      : () => refreshSchematicNetlistFallback;
    const queueAutosave = typeof input.queueAutosave === "function" ? input.queueAutosave : () => {};
    const acSection = configSections.ac;
    if (!(acSection instanceof HTMLElement)) {
      throw new Error("createAcSweepField requires ac config section.");
    }
    const ensureAcConfig = () => {
      const simulationConfig = getSimulationConfig();
      if (!simulationConfig || typeof simulationConfig !== "object") {
        throw new Error("createAcSweepField requires simulationConfig object.");
      }
      if (!simulationConfig.ac || typeof simulationConfig.ac !== "object") {
        simulationConfig.ac = {};
      }
      return simulationConfig.ac;
    };
    const row = document.createElement("div");
    row.className = "schematic-config-row";
    const label = document.createElement("label");
    label.textContent = "AC sweep";
    const select = document.createElement("select");
    ["lin", "dec", "oct"].forEach((optionValue) => {
      const option = document.createElement("option");
      option.value = optionValue;
      option.textContent = optionValue.toUpperCase();
      select.appendChild(option);
    });
    const initialSweep = String(ensureAcConfig().sweep ?? "dec");
    select.value = initialSweep;
    ensureAcConfig().sweep = select.value;
    select.dataset.schematicConfig = "ac:sweep";
    const helpEntry = configHelpMap["ac:sweep"] ?? null;
    applyHelpEntry(label, helpEntry);
    applyHelpEntry(select, helpEntry);
    select.addEventListener("change", () => {
      ensureAcConfig().sweep = select.value;
      const refreshSchematicNetlist = getRefreshSchematicNetlist();
      if (typeof refreshSchematicNetlist === "function") {
        refreshSchematicNetlist();
      }
      queueAutosave();
    });
    row.append(label, select);
    acSection.appendChild(row);
    configInputs.ac = configInputs.ac ?? {};
    configInputs.ac.sweep = select;
    return select;
  };

  if (typeof self !== "undefined") {
    self.SpjutSimUISimulationConfig = {
      readAvailableSourceIds,
      syncSourceInputOptions,
      trimToken,
      buildSpiceFunction,
      buildPwlValue,
      buildTranSourceValue,
      updateTranWaveformVisibility,
      createConfigField,
      createSourceConfigField,
      createSimulationHeader,
      createConfigSections,
      createTranWaveGroup,
      createTranSourceModeField,
      createAcSweepField
    };
  }
})();
