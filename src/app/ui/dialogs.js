/**
 * UI dialog builders: about, hotkeys, settings.
 */
(function initUIDialogsModule() {
  const ABOUT_DIALOG_CONTENT = Object.freeze([
    {
      kind: "text",
      text: "SpjutSim Circuits is a web-based electrical circuit schematic editor and simulator, aimed at students. This is an early version, so expect bugs, rough edges, and missing features."
    },
    {
      kind: "text",
      text: "I'm trying to make this program good, but it may be bad. Verify results independently; you're responsible for your designs and outcomes. Provided \"AS IS\" without warranties; no liability for damages. You use it at your own risk. Abandon hope, all ye who enter here."
    },
    {
      kind: "link-line",
      prefix: "",
      linkText: "Copyright (c) 2026 Jakob Spjut.",
      url: "https://github.com/Brinkwatertoad/SpjutSim-Circuits-public/blob/main/LICENSE.md",
      suffix: " All rights reserved."
    },
    {
      kind: "text",
      text: "No license is granted to use, copy, modify, or distribute this repository's contents, except as necessary to access and use the accompanying website via a web browser."
    },
    {
      kind: "link-line",
      prefix: "Circuit simulation uses ngspice, which is available under the ",
      linkText: "BSD-3-clause license",
      url: "https://github.com/Brinkwatertoad/SpjutSim-Circuits-public/blob/main/THIRD_PARTY_NOTICES.md",
      suffix: "."
    }
  ]);

  const HOTKEY_SHORTCUTS = Object.freeze({
    open: "Ctrl+O",
    save: "Ctrl+S",
    saveAs: "Ctrl+Shift+S",
    settings: "Ctrl+,",
    toggleHelp: "H",
    runSimulation: "F5",
    edit: "Ctrl+E",
    selectAll: "Ctrl+A",
    delete: "Del",
    copy: "Ctrl+C",
    cut: "Ctrl+X",
    paste: "Ctrl+V",
    rotateCw: "Space",
    rotateCcw: "Shift+Space",
    flipH: "X",
    flipV: "Y",
    undo: "Ctrl+Z",
    redo: "Ctrl+Y",
    redoAlt: "Ctrl+Shift+Z",
    escape: "Escape"
  });

  const setDialogOpen = (dialog, isOpen) => {
    if (!(dialog instanceof HTMLElement)) {
      return;
    }
    const shouldOpen = Boolean(isOpen);
    dialog.hidden = !shouldOpen;
    dialog.classList.toggle("hidden", !shouldOpen);
  };

  const buildAboutDialog = (container) => {
    const aboutDialog = document.createElement("div");
    aboutDialog.className = "modal-backdrop hidden";
    aboutDialog.dataset.aboutDialog = "1";
    aboutDialog.setAttribute("role", "dialog");
    aboutDialog.setAttribute("aria-modal", "true");
    aboutDialog.hidden = true;
    const aboutPanel = document.createElement("div");
    aboutPanel.className = "modal-dialog about-modal-dialog";
    aboutPanel.dataset.aboutPanel = "1";
    const aboutTitle = document.createElement("div");
    aboutTitle.className = "modal-title";
    aboutTitle.dataset.aboutTitle = "1";
    aboutTitle.textContent = "About SpjutSim Circuits";
    const aboutBody = document.createElement("div");
    aboutBody.className = "modal-body about-modal-body";
    aboutBody.dataset.aboutBody = "1";
    ABOUT_DIALOG_CONTENT.forEach((entry) => {
      const paragraph = document.createElement("p");
      if (entry.kind === "link-line") {
        if (entry.prefix) {
          paragraph.append(document.createTextNode(entry.prefix));
        }
        const link = document.createElement("a");
        link.href = entry.url;
        link.textContent = entry.linkText;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        paragraph.append(link);
        if (entry.suffix) {
          paragraph.append(document.createTextNode(entry.suffix));
        }
      } else {
        paragraph.textContent = entry.text;
      }
      aboutBody.appendChild(paragraph);
    });
    const aboutActions = document.createElement("div");
    aboutActions.className = "modal-actions";
    const aboutClose = document.createElement("button");
    aboutClose.type = "button";
    aboutClose.textContent = "Close";
    aboutClose.dataset.aboutClose = "1";
    aboutActions.append(aboutClose);
    aboutPanel.append(aboutTitle, aboutBody, aboutActions);
    aboutDialog.append(aboutPanel);
    container.appendChild(aboutDialog);

    const openAboutDialog = () => setDialogOpen(aboutDialog, true);
    const closeAboutDialog = () => setDialogOpen(aboutDialog, false);

    aboutDialog.addEventListener("click", (event) => {
      if (event.target === aboutDialog) {
        closeAboutDialog();
      }
    });
    aboutClose.addEventListener("click", closeAboutDialog);

    return { aboutDialog, openAboutDialog, closeAboutDialog };
  };

  const buildHotkeysDialog = (container, config = {}) => {
    const listHotkeys = typeof config.listHotkeys === "function" ? config.listHotkeys : () => [];
    const hotkeysDialog = document.createElement("div");
    hotkeysDialog.className = "modal-backdrop hidden";
    hotkeysDialog.dataset.hotkeysDialog = "1";
    hotkeysDialog.setAttribute("role", "dialog");
    hotkeysDialog.setAttribute("aria-modal", "true");
    hotkeysDialog.hidden = true;

    const hotkeysPanel = document.createElement("div");
    hotkeysPanel.className = "modal-dialog hotkeys-modal-dialog";
    hotkeysPanel.dataset.hotkeysPanel = "1";
    const hotkeysTitle = document.createElement("div");
    hotkeysTitle.className = "modal-title";
    hotkeysTitle.textContent = "Hotkeys";
    hotkeysTitle.dataset.hotkeysTitle = "1";
    const hotkeysBody = document.createElement("div");
    hotkeysBody.className = "modal-body hotkeys-modal-body";
    hotkeysBody.dataset.hotkeysBody = "1";
    const hotkeysActions = document.createElement("div");
    hotkeysActions.className = "modal-actions";
    const hotkeysClose = document.createElement("button");
    hotkeysClose.type = "button";
    hotkeysClose.textContent = "Close";
    hotkeysClose.dataset.hotkeysClose = "1";
    hotkeysActions.append(hotkeysClose);
    hotkeysPanel.append(hotkeysTitle, hotkeysBody, hotkeysActions);
    hotkeysDialog.append(hotkeysPanel);
    container.appendChild(hotkeysDialog);

    const renderHotkeys = () => {
      hotkeysBody.innerHTML = "";
      const sectionsRaw = listHotkeys();
      const sections = Array.isArray(sectionsRaw) ? sectionsRaw : [];
      let entryCount = 0;
      sections.forEach((section, index) => {
        const label = String(section?.label ?? "").trim();
        const entriesRaw = Array.isArray(section?.entries) ? section.entries : [];
        const entries = entriesRaw.filter((entry) => {
          const shortcut = String(entry?.shortcut ?? "").trim();
          const description = String(entry?.description ?? "").trim();
          return shortcut.length > 0 && description.length > 0;
        });
        if (!entries.length) {
          return;
        }
        const sectionEl = document.createElement("section");
        sectionEl.className = "hotkeys-section";
        sectionEl.dataset.hotkeysSection = String(section?.id ?? label ?? index);
        if (label) {
          const heading = document.createElement("h3");
          heading.className = "hotkeys-section-title";
          heading.textContent = label;
          sectionEl.appendChild(heading);
        }
        const listEl = document.createElement("div");
        listEl.className = "hotkeys-list";
        entries.forEach((entry) => {
          const shortcut = String(entry.shortcut).trim();
          const description = String(entry.description).trim();
          const row = document.createElement("div");
          row.className = "hotkeys-entry";
          row.dataset.hotkeysEntry = "1";
          row.dataset.hotkeysEntryShortcut = shortcut;
          row.dataset.hotkeysEntryDescription = description;
          const shortcutEl = document.createElement("kbd");
          shortcutEl.className = "hotkeys-entry-shortcut";
          shortcutEl.textContent = shortcut;
          const descriptionEl = document.createElement("span");
          descriptionEl.className = "hotkeys-entry-description";
          descriptionEl.textContent = description;
          row.append(shortcutEl, descriptionEl);
          listEl.appendChild(row);
          entryCount += 1;
        });
        sectionEl.appendChild(listEl);
        hotkeysBody.appendChild(sectionEl);
      });
      if (!entryCount) {
        const empty = document.createElement("p");
        empty.className = "hotkeys-empty";
        empty.textContent = "No hotkeys available.";
        hotkeysBody.appendChild(empty);
      }
    };

    const openHotkeysDialog = () => {
      renderHotkeys();
      setDialogOpen(hotkeysDialog, true);
    };
    const closeHotkeysDialog = () => setDialogOpen(hotkeysDialog, false);

    hotkeysDialog.addEventListener("click", (event) => {
      if (event.target === hotkeysDialog) {
        closeHotkeysDialog();
      }
    });
    hotkeysClose.addEventListener("click", closeHotkeysDialog);

    return { hotkeysDialog, openHotkeysDialog, closeHotkeysDialog };
  };

  const DEFAULT_FALLBACK_TEXT_STYLE = Object.freeze({
    font: "Segoe UI",
    size: 12,
    bold: false,
    italic: false
  });

  const buildSettingsDialog = (container, config = {}) => {
    const defaultTextStyle = config.defaultTextStyle && typeof config.defaultTextStyle === "object"
      ? config.defaultTextStyle
      : DEFAULT_FALLBACK_TEXT_STYLE;
    const defaultIncludeValueUnitSpace = config.defaultIncludeValueUnitSpace !== undefined
      ? config.defaultIncludeValueUnitSpace
      : true;
    const getAutoSwitchToSelectAfterToolUse = typeof config.getAutoSwitchToSelectAfterToolUse === "function"
      ? config.getAutoSwitchToSelectAfterToolUse
      : () => false;
    const onAutoSwitchToSelectAfterToolUseChange = typeof config.onAutoSwitchToSelectAfterToolUseChange === "function"
      ? config.onAutoSwitchToSelectAfterToolUseChange
      : () => { };
    const getAutoSwitchToSelectAfterWireUse = typeof config.getAutoSwitchToSelectAfterWireUse === "function"
      ? config.getAutoSwitchToSelectAfterWireUse
      : () => false;
    const onAutoSwitchToSelectAfterWireUseChange = typeof config.onAutoSwitchToSelectAfterWireUseChange === "function"
      ? config.onAutoSwitchToSelectAfterWireUseChange
      : () => { };
    const getSchematicTextStyle = typeof config.getSchematicTextStyle === "function"
      ? config.getSchematicTextStyle
      : () => ({ ...defaultTextStyle });
    const getSchematicTextFontOptions = typeof config.getSchematicTextFontOptions === "function"
      ? config.getSchematicTextFontOptions
      : () => [defaultTextStyle.font];
    const onSchematicTextStyleChange = typeof config.onSchematicTextStyleChange === "function"
      ? config.onSchematicTextStyleChange
      : () => { };
    const getSchematicValueUnitSpacing = typeof config.getSchematicValueUnitSpacing === "function"
      ? config.getSchematicValueUnitSpacing
      : () => defaultIncludeValueUnitSpace;
    const onSchematicValueUnitSpacingChange = typeof config.onSchematicValueUnitSpacingChange === "function"
      ? config.onSchematicValueUnitSpacingChange
      : () => { };
    const getComponentDefaultSpecs = typeof config.getComponentDefaultSpecs === "function"
      ? config.getComponentDefaultSpecs
      : () => [];
    const getComponentDefaults = typeof config.getComponentDefaults === "function"
      ? config.getComponentDefaults
      : () => ({});
    const onComponentDefaultChange = typeof config.onComponentDefaultChange === "function"
      ? config.onComponentDefaultChange
      : () => { };
    const onApplyComponentDefaultsToExisting = typeof config.onApplyComponentDefaultsToExisting === "function"
      ? config.onApplyComponentDefaultsToExisting
      : () => { };
    const onResetSettings = typeof config.onResetSettings === "function"
      ? config.onResetSettings
      : () => { };
    const getToolDisplayDefaults = typeof config.getToolDisplayDefaults === "function"
      ? config.getToolDisplayDefaults
      : () => ({ resistorStyle: "zigzag", groundVariant: "earth", groundColor: null, probeColor: null });
    const getResistorDisplayTypeOptions = typeof config.getResistorDisplayTypeOptions === "function"
      ? config.getResistorDisplayTypeOptions
      : () => [];
    const getGroundDisplayTypeOptions = typeof config.getGroundDisplayTypeOptions === "function"
      ? config.getGroundDisplayTypeOptions
      : () => [];
    const getWireDefaultColor = typeof config.getWireDefaultColor === "function"
      ? config.getWireDefaultColor
      : () => null;
    const onToolDisplayDefaultChange = typeof config.onToolDisplayDefaultChange === "function"
      ? config.onToolDisplayDefaultChange
      : () => { };
    const onWireDefaultColorChange = typeof config.onWireDefaultColorChange === "function"
      ? config.onWireDefaultColorChange
      : () => { };
    const parseSwitchComponentDefaultValue = typeof config.parseSwitchComponentDefaultValue === "function"
      ? config.parseSwitchComponentDefaultValue
      : () => ({ ron: "0", roff: "" });
    const onResetComponentTypeDefaults = typeof config.onResetComponentTypeDefaults === "function"
      ? config.onResetComponentTypeDefaults
      : () => { };
    const getToolSettingsCatalog = typeof config.getToolSettingsCatalog === "function"
      ? config.getToolSettingsCatalog
      : () => ({ scopes: [], toolToScope: {} });
    const createNetColorPicker = typeof config.createNetColorPicker === "function"
      ? config.createNetColorPicker
      : null;
    const settingsDialog = document.createElement("div");
    settingsDialog.className = "modal-backdrop hidden";
    settingsDialog.dataset.settingsDialog = "1";
    settingsDialog.dataset.settingsScopeType = "";
    settingsDialog.setAttribute("role", "dialog");
    settingsDialog.setAttribute("aria-modal", "true");
    settingsDialog.hidden = true;
    const settingsPanel = document.createElement("div");
    settingsPanel.className = "modal-dialog settings-modal-dialog";
    settingsPanel.dataset.settingsPanel = "1";
    const settingsTitle = document.createElement("div");
    settingsTitle.className = "modal-title";
    settingsTitle.dataset.settingsTitle = "1";
    settingsTitle.textContent = "Settings";
    const settingsBody = document.createElement("div");
    settingsBody.className = "modal-body settings-modal-body";
    settingsBody.dataset.settingsBody = "1";
    const autoSwitchToolUseRow = document.createElement("label");
    autoSwitchToolUseRow.className = "modal-field";
    const autoSwitchToolUseToggle = document.createElement("input");
    autoSwitchToolUseToggle.type = "checkbox";
    autoSwitchToolUseToggle.dataset.settingsSetting = "autoswitch-select-tool-use";
    const autoSwitchToolUseLabel = document.createElement("span");
    autoSwitchToolUseLabel.textContent = "Autoswitch to Select after tool use";
    autoSwitchToolUseRow.append(autoSwitchToolUseToggle, autoSwitchToolUseLabel);
    const autoSwitchWireUseRow = document.createElement("label");
    autoSwitchWireUseRow.className = "modal-field";
    const autoSwitchWireUseToggle = document.createElement("input");
    autoSwitchWireUseToggle.type = "checkbox";
    autoSwitchWireUseToggle.dataset.settingsSetting = "autoswitch-select-wire-use";
    const autoSwitchWireUseLabel = document.createElement("span");
    autoSwitchWireUseLabel.textContent = "Autoswitch to Select after Wire use";
    autoSwitchWireUseRow.append(autoSwitchWireUseToggle, autoSwitchWireUseLabel);
    const schematicTextFontRow = document.createElement("label");
    schematicTextFontRow.className = "modal-field";
    const schematicTextFontLabel = document.createElement("span");
    schematicTextFontLabel.textContent = "Schematic text font";
    const schematicTextFontSelect = document.createElement("select");
    schematicTextFontSelect.dataset.settingsSetting = "schematic-text-font";
    const textFontOptionsRaw = getSchematicTextFontOptions();
    const textFontOptions = Array.isArray(textFontOptionsRaw)
      ? textFontOptionsRaw
      : [];
    textFontOptions.forEach((entry) => {
      const fontName = String(entry ?? "").trim();
      if (!fontName) {
        return;
      }
      const option = document.createElement("option");
      option.value = fontName;
      option.textContent = fontName;
      schematicTextFontSelect.appendChild(option);
    });
    if (!schematicTextFontSelect.options.length) {
      const fallbackOption = document.createElement("option");
      fallbackOption.value = defaultTextStyle.font;
      fallbackOption.textContent = defaultTextStyle.font;
      schematicTextFontSelect.appendChild(fallbackOption);
    }
    schematicTextFontRow.append(schematicTextFontLabel, schematicTextFontSelect);
    const schematicTextSizeRow = document.createElement("label");
    schematicTextSizeRow.className = "modal-field";
    const schematicTextSizeLabel = document.createElement("span");
    schematicTextSizeLabel.textContent = "Schematic text size";
    const schematicTextSizeInput = document.createElement("input");
    schematicTextSizeInput.type = "number";
    schematicTextSizeInput.min = "8";
    schematicTextSizeInput.max = "72";
    schematicTextSizeInput.step = "1";
    schematicTextSizeInput.dataset.settingsSetting = "schematic-text-size";
    schematicTextSizeRow.append(schematicTextSizeLabel, schematicTextSizeInput);
    const schematicTextBoldRow = document.createElement("label");
    schematicTextBoldRow.className = "modal-field";
    const schematicTextBoldToggle = document.createElement("input");
    schematicTextBoldToggle.type = "checkbox";
    schematicTextBoldToggle.dataset.settingsSetting = "schematic-text-bold";
    const schematicTextBoldLabel = document.createElement("span");
    schematicTextBoldLabel.textContent = "Schematic text bold";
    schematicTextBoldRow.append(schematicTextBoldToggle, schematicTextBoldLabel);
    const schematicTextItalicRow = document.createElement("label");
    schematicTextItalicRow.className = "modal-field";
    const schematicTextItalicToggle = document.createElement("input");
    schematicTextItalicToggle.type = "checkbox";
    schematicTextItalicToggle.dataset.settingsSetting = "schematic-text-italic";
    const schematicTextItalicLabel = document.createElement("span");
    schematicTextItalicLabel.textContent = "Schematic text italic";
    schematicTextItalicRow.append(schematicTextItalicToggle, schematicTextItalicLabel);
    const schematicValueUnitSpacingRow = document.createElement("label");
    schematicValueUnitSpacingRow.className = "modal-field";
    const schematicValueUnitSpacingToggle = document.createElement("input");
    schematicValueUnitSpacingToggle.type = "checkbox";
    schematicValueUnitSpacingToggle.dataset.settingsSetting = "schematic-value-unit-spacing";
    const schematicValueUnitSpacingLabel = document.createElement("span");
    schematicValueUnitSpacingLabel.textContent = "Include space between value and unit on schematic";
    schematicValueUnitSpacingRow.append(schematicValueUnitSpacingToggle, schematicValueUnitSpacingLabel);
    const componentDefaultSpecsRaw = getComponentDefaultSpecs();
    const componentDefaultSpecs = Array.isArray(componentDefaultSpecsRaw)
      ? componentDefaultSpecsRaw
        .map((entry) => ({
          type: String(entry?.type ?? "").trim().toUpperCase(),
          label: String(entry?.label ?? "").trim(),
          valueLabel: String(entry?.valueLabel ?? "").trim(),
          unit: String(entry?.unit ?? "").trim(),
          valueControl: String(entry?.valueControl ?? "").trim().toLowerCase() === "select" ? "select" : "text",
          valueOptions: Array.isArray(entry?.valueOptions)
            ? entry.valueOptions
              .map((option) => ({
                value: String(option?.value ?? "").trim(),
                label: String(option?.label ?? "").trim()
              }))
              .filter((option) => option.value)
            : [],
          xfmrPolarityControl: entry?.xfmrPolarityControl === true,
          xfmrPolarityOptions: Array.isArray(entry?.xfmrPolarityOptions)
            ? entry.xfmrPolarityOptions
              .map((option) => ({
                value: String(option?.value ?? "").trim(),
                label: String(option?.label ?? "").trim()
              }))
              .filter((option) => option.value)
            : [],
          xfmrSolveByControl: entry?.xfmrSolveByControl === true,
          xfmrSolveByOptions: Array.isArray(entry?.xfmrSolveByOptions)
            ? entry.xfmrSolveByOptions
              .map((option) => ({
                value: String(option?.value ?? "").trim(),
                label: String(option?.label ?? "").trim()
              }))
              .filter((option) => option.value)
            : []
        }))
        .filter((entry) => entry.type)
      : [];
    const toolSettingsCatalogRaw = getToolSettingsCatalog();
    const toolSettingsCatalog = toolSettingsCatalogRaw && typeof toolSettingsCatalogRaw === "object"
      ? toolSettingsCatalogRaw
      : { scopes: [], toolToScope: {} };
    const toolSettingsScopes = Array.isArray(toolSettingsCatalog.scopes)
      ? toolSettingsCatalog.scopes
        .map((entry) => ({
          scopeType: String(entry?.scopeType ?? "").trim().toUpperCase(),
          label: String(entry?.label ?? "").trim(),
          supportsApply: entry?.supportsApply !== false,
          supportsReset: entry?.supportsReset !== false
        }))
        .filter((entry) => entry.scopeType)
      : [];
    const toolSettingsScopeByType = new Map(
      toolSettingsScopes.map((entry) => [entry.scopeType, entry])
    );
    const toolSettingsScopeByToolType = (() => {
      const map = new Map();
      const source = toolSettingsCatalog.toolToScope && typeof toolSettingsCatalog.toolToScope === "object"
        ? toolSettingsCatalog.toolToScope
        : {};
      Object.entries(source).forEach(([toolTypeRaw, scopeTypeRaw]) => {
        const toolType = String(toolTypeRaw ?? "").trim().toUpperCase();
        const scopeType = String(scopeTypeRaw ?? "").trim().toUpperCase();
        if (!toolType || !scopeType) {
          return;
        }
        if (!toolSettingsScopeByType.has(scopeType)) {
          return;
        }
        map.set(toolType, scopeType);
      });
      return map;
    })();
    const componentDefaultsTitle = document.createElement("div");
    componentDefaultsTitle.className = "modal-subtitle";
    componentDefaultsTitle.textContent = "Component defaults (new placements)";
    const resistorDisplayTypeSelect = document.createElement("select");
    resistorDisplayTypeSelect.dataset.settingsToolDisplayResistorStyle = "1";
    const resistorDisplayTypeOptions = Array.isArray(getResistorDisplayTypeOptions())
      ? getResistorDisplayTypeOptions()
      : [];
    resistorDisplayTypeOptions.forEach((entry) => {
      const value = String(entry?.value ?? "").trim().toLowerCase();
      if (!value) {
        return;
      }
      const option = document.createElement("option");
      option.value = value;
      option.textContent = String(entry?.label ?? value).trim() || value;
      resistorDisplayTypeSelect.appendChild(option);
    });
    const componentDefaultRows = componentDefaultSpecs.map((spec) => {
      const row = document.createElement("div");
      row.className = "modal-field settings-component-default-row";
      row.dataset.settingsComponentDefaultRow = spec.type;
      const typeLabel = document.createElement("span");
      typeLabel.dataset.settingsComponentDefaultLabel = spec.type;
      typeLabel.textContent = spec.label || spec.type;
      const valueInput = spec.valueControl === "select"
        ? document.createElement("select")
        : document.createElement("input");
      valueInput.className = "settings-short-value-input";
      valueInput.dataset.settingsComponentDefaultValue = spec.type;
      if (valueInput instanceof HTMLInputElement) {
        valueInput.type = "text";
        valueInput.placeholder = spec.valueLabel || "Value";
      } else if (valueInput instanceof HTMLSelectElement) {
        spec.valueOptions.forEach((optionEntry) => {
          const option = document.createElement("option");
          option.value = optionEntry.value;
          option.textContent = optionEntry.label || optionEntry.value;
          valueInput.appendChild(option);
        });
      }
      const valueLabel = document.createElement("span");
      valueLabel.textContent = `${spec.valueLabel || "Value"}:`;
      const valueUnit = document.createElement("span");
      valueUnit.className = "inline-edit-unit";
      valueUnit.dataset.settingsComponentDefaultUnit = spec.type;
      valueUnit.textContent = spec.unit || "";
      valueUnit.hidden = !spec.unit;
      const switchRonLabel = document.createElement("span");
      switchRonLabel.textContent = "Ron:";
      const switchRonInput = document.createElement("input");
      switchRonInput.type = "text";
      switchRonInput.className = "settings-short-value-input";
      switchRonInput.dataset.settingsComponentDefaultSwitchRon = spec.type;
      switchRonInput.placeholder = "0";
      const switchRonUnit = document.createElement("span");
      switchRonUnit.className = "inline-edit-unit";
      switchRonUnit.textContent = spec.unit || "\u03a9";
      const switchRoffLabel = document.createElement("span");
      switchRoffLabel.textContent = "Roff:";
      const switchRoffInput = document.createElement("input");
      switchRoffInput.type = "text";
      switchRoffInput.className = "settings-short-value-input";
      switchRoffInput.dataset.settingsComponentDefaultSwitchRoff = spec.type;
      switchRoffInput.placeholder = "open";
      const switchRoffUnit = document.createElement("span");
      switchRoffUnit.className = "inline-edit-unit";
      switchRoffUnit.textContent = spec.unit || "\u03a9";
      const isSwitchDefaults = spec.type === "SW";
      const isTransformerDefaults = spec.type === "XFMR"
        && (spec.xfmrPolarityControl === true || spec.xfmrSolveByControl === true);
      const xfmrPolarityLabel = document.createElement("span");
      xfmrPolarityLabel.textContent = "Polarity:";
      const xfmrPolaritySelect = document.createElement("select");
      xfmrPolaritySelect.className = "settings-short-value-input";
      xfmrPolaritySelect.dataset.settingsComponentDefaultXfmrPolarity = spec.type;
      (Array.isArray(spec.xfmrPolarityOptions) ? spec.xfmrPolarityOptions : []).forEach((optionEntry) => {
        const option = document.createElement("option");
        option.value = optionEntry.value;
        option.textContent = optionEntry.label || optionEntry.value;
        xfmrPolaritySelect.appendChild(option);
      });
      const xfmrSolveByLabel = document.createElement("span");
      xfmrSolveByLabel.textContent = "Solve for:";
      const xfmrSolveBySelect = document.createElement("select");
      xfmrSolveBySelect.className = "settings-short-value-input";
      xfmrSolveBySelect.dataset.settingsComponentDefaultXfmrSolveBy = spec.type;
      (Array.isArray(spec.xfmrSolveByOptions) ? spec.xfmrSolveByOptions : []).forEach((optionEntry) => {
        const option = document.createElement("option");
        option.value = optionEntry.value;
        option.textContent = optionEntry.label || optionEntry.value;
        xfmrSolveBySelect.appendChild(option);
      });
      let colorPicker = null;
      if (typeof createNetColorPicker === "function") {
        colorPicker = createNetColorPicker({
          rowClassName: "schematic-net-color-row settings-component-default-color-picker",
          swatchAttribute: "data-settings-component-default-color-swatch",
          labelText: "Color:",
          decorateSwatch: (button) => {
            button.dataset.settingsComponentDefaultColorType = spec.type;
          },
          onPick: (color) => {
            const currentColor = String(colorClear.dataset.settingsComponentDefaultCurrentColor ?? "").trim().toLowerCase();
            const normalizedPick = String(color ?? "").trim().toLowerCase();
            const nextColor = currentColor === normalizedPick ? null : normalizedPick;
            onComponentDefaultChange(spec.type, { netColor: nextColor });
            colorClear.dataset.settingsComponentDefaultCurrentColor = nextColor ?? "";
            colorPicker?.setSelected(nextColor);
          }
        });
        colorPicker.row.dataset.settingsComponentDefaultColorRow = spec.type;
      }
      const colorClear = document.createElement("button");
      colorClear.type = "button";
      colorClear.className = "secondary settings-component-default-color-clear";
      colorClear.textContent = "Default";
      colorClear.dataset.settingsComponentDefaultColorClear = spec.type;
      colorClear.dataset.settingsComponentDefaultCurrentColor = "";
      colorClear.addEventListener("click", () => {
        onComponentDefaultChange(spec.type, { netColor: null });
        colorClear.dataset.settingsComponentDefaultCurrentColor = "";
        colorPicker?.setSelected(null);
      });
      row.append(typeLabel);
      if (isSwitchDefaults) {
        row.append(
          switchRonLabel,
          switchRonInput,
          switchRonUnit,
          switchRoffLabel,
          switchRoffInput,
          switchRoffUnit
        );
      } else {
        row.append(valueLabel, valueInput, valueUnit);
        if (isTransformerDefaults) {
          if (spec.xfmrPolarityControl === true) {
            row.append(xfmrPolarityLabel, xfmrPolaritySelect);
          }
          if (spec.xfmrSolveByControl === true) {
            row.append(xfmrSolveByLabel, xfmrSolveBySelect);
          }
        }
        if (spec.type === "R") {
          const resistorDisplayTypeLabel = document.createElement("span");
          resistorDisplayTypeLabel.textContent = "Type:";
          row.append(resistorDisplayTypeLabel, resistorDisplayTypeSelect);
        }
      }
      if (colorPicker?.row) {
        row.append(colorPicker.row);
      }
      row.append(colorClear);
      return {
        ...spec,
        row,
        valueInput,
        valueUnit,
        xfmrPolaritySelect,
        xfmrSolveBySelect,
        switchRonInput,
        switchRoffInput,
        colorPicker,
        colorClear
      };
    });
    const groundDefaultsRow = document.createElement("div");
    groundDefaultsRow.className = "modal-field settings-component-default-row";
    groundDefaultsRow.dataset.settingsComponentDefaultRow = "GND";
    const groundDefaultsLabel = document.createElement("span");
    groundDefaultsLabel.dataset.settingsComponentDefaultLabel = "GND";
    groundDefaultsLabel.textContent = "Ground";
    const groundDisplayTypeLabel = document.createElement("span");
    groundDisplayTypeLabel.textContent = "Type:";
    const groundDisplayTypeSelect = document.createElement("select");
    groundDisplayTypeSelect.dataset.settingsToolDisplayGroundVariant = "1";
    const groundDisplayTypeOptions = Array.isArray(getGroundDisplayTypeOptions())
      ? getGroundDisplayTypeOptions()
      : [];
    groundDisplayTypeOptions.forEach((entry) => {
      const value = String(entry?.value ?? "").trim().toLowerCase();
      if (!value) {
        return;
      }
      const option = document.createElement("option");
      option.value = value;
      option.textContent = String(entry?.label ?? value).trim() || value;
      groundDisplayTypeSelect.appendChild(option);
    });
    let groundColorPicker = null;
    if (typeof createNetColorPicker === "function") {
      groundColorPicker = createNetColorPicker({
        rowClassName: "schematic-net-color-row settings-component-default-color-picker",
        swatchAttribute: "data-settings-tool-display-ground-color-swatch",
        labelText: "Color:",
        onPick: (color) => {
          const currentColor = String(groundColorClear.dataset.settingsToolDisplayGroundColorCurrentColor ?? "").trim().toLowerCase();
          const normalizedPick = String(color ?? "").trim().toLowerCase();
          const nextColor = currentColor === normalizedPick ? null : normalizedPick;
          onToolDisplayDefaultChange("groundColor", nextColor);
          groundColorClear.dataset.settingsToolDisplayGroundColorCurrentColor = nextColor ?? "";
          groundColorPicker?.setSelected(nextColor);
        }
      });
    }
    if (groundColorPicker?.row) {
      groundColorPicker.row.dataset.settingsToolDisplayGroundColorRow = "1";
    }
    const groundColorClear = document.createElement("button");
    groundColorClear.type = "button";
    groundColorClear.className = "secondary settings-component-default-color-clear";
    groundColorClear.textContent = "Default";
    groundColorClear.dataset.settingsToolDisplayGroundColorClear = "1";
    groundColorClear.dataset.settingsToolDisplayGroundColorCurrentColor = "";
    groundColorClear.addEventListener("click", () => {
      onToolDisplayDefaultChange("groundColor", null);
      groundColorClear.dataset.settingsToolDisplayGroundColorCurrentColor = "";
      groundColorPicker?.setSelected(null);
    });
    let wireDefaultColorPicker = null;
    if (typeof createNetColorPicker === "function") {
      wireDefaultColorPicker = createNetColorPicker({
        rowClassName: "schematic-net-color-row settings-component-default-color-picker",
        swatchAttribute: "data-settings-wire-default-color-swatch",
        labelText: "Color:",
        onPick: (color) => {
          const currentColor = String(wireDefaultColorClear.dataset.settingsWireDefaultCurrentColor ?? "").trim().toLowerCase();
          const normalizedPick = String(color ?? "").trim().toLowerCase();
          const nextColor = currentColor === normalizedPick ? null : normalizedPick;
          onWireDefaultColorChange(nextColor);
          wireDefaultColorClear.dataset.settingsWireDefaultCurrentColor = nextColor ?? "";
          wireDefaultColorPicker?.setSelected(nextColor);
        }
      });
    }
    const wireDefaultColorClear = document.createElement("button");
    wireDefaultColorClear.type = "button";
    wireDefaultColorClear.className = "secondary settings-component-default-color-clear";
    wireDefaultColorClear.textContent = "Default";
    wireDefaultColorClear.dataset.settingsWireDefaultColorClear = "1";
    wireDefaultColorClear.dataset.settingsWireDefaultCurrentColor = "";
    wireDefaultColorClear.addEventListener("click", () => {
      onWireDefaultColorChange(null);
      wireDefaultColorClear.dataset.settingsWireDefaultCurrentColor = "";
      wireDefaultColorPicker?.setSelected(null);
    });
    let probeDefaultColorPicker = null;
    if (typeof createNetColorPicker === "function") {
      probeDefaultColorPicker = createNetColorPicker({
        rowClassName: "schematic-net-color-row settings-component-default-color-picker",
        swatchAttribute: "data-settings-tool-display-probe-color-swatch",
        labelText: "Color:",
        onPick: (color) => {
          const currentColor = String(probeDefaultColorClear.dataset.settingsToolDisplayProbeColorCurrentColor ?? "").trim().toLowerCase();
          const normalizedPick = String(color ?? "").trim().toLowerCase();
          const nextColor = currentColor === normalizedPick ? null : normalizedPick;
          onToolDisplayDefaultChange("probeColor", nextColor);
          probeDefaultColorClear.dataset.settingsToolDisplayProbeColorCurrentColor = nextColor ?? "";
          probeDefaultColorPicker?.setSelected(nextColor);
        }
      });
    }
    if (probeDefaultColorPicker?.row) {
      probeDefaultColorPicker.row.dataset.settingsToolDisplayProbeColorRow = "1";
    }
    const probeDefaultColorClear = document.createElement("button");
    probeDefaultColorClear.type = "button";
    probeDefaultColorClear.className = "secondary settings-component-default-color-clear";
    probeDefaultColorClear.textContent = "Default";
    probeDefaultColorClear.dataset.settingsToolDisplayProbeColorClear = "1";
    probeDefaultColorClear.dataset.settingsToolDisplayProbeColorCurrentColor = "";
    probeDefaultColorClear.addEventListener("click", () => {
      onToolDisplayDefaultChange("probeColor", null);
      probeDefaultColorClear.dataset.settingsToolDisplayProbeColorCurrentColor = "";
      probeDefaultColorPicker?.setSelected(null);
    });
    const wireDefaultsRow = document.createElement("div");
    wireDefaultsRow.className = "modal-field settings-component-default-row";
    wireDefaultsRow.dataset.settingsComponentDefaultRow = "WIRE";
    wireDefaultsRow.dataset.settingsWireDefaultColorRow = "1";
    const wireDefaultsLabel = document.createElement("span");
    wireDefaultsLabel.dataset.settingsComponentDefaultLabel = "WIRE";
    wireDefaultsLabel.textContent = "Wire";
    const probeDefaultsRow = document.createElement("div");
    probeDefaultsRow.className = "modal-field settings-component-default-row";
    probeDefaultsRow.dataset.settingsComponentDefaultRow = "PROBE";
    probeDefaultsRow.dataset.settingsToolDisplayProbeColorRow = "1";
    const probeDefaultsLabel = document.createElement("span");
    probeDefaultsLabel.dataset.settingsComponentDefaultLabel = "PROBE";
    probeDefaultsLabel.textContent = "Probe";
    const selectDefaultsRow = document.createElement("div");
    selectDefaultsRow.className = "modal-field settings-component-default-row";
    selectDefaultsRow.dataset.settingsComponentDefaultRow = "SELECT";
    const selectDefaultsLabel = document.createElement("span");
    selectDefaultsLabel.dataset.settingsComponentDefaultLabel = "SELECT";
    selectDefaultsLabel.textContent = "Select";
    const selectDefaultsDescription = document.createElement("span");
    selectDefaultsDescription.textContent = "No configurable defaults";
    selectDefaultsRow.append(selectDefaultsLabel, selectDefaultsDescription);
    groundDefaultsRow.append(groundDefaultsLabel, groundDisplayTypeLabel, groundDisplayTypeSelect);
    if (groundColorPicker?.row) {
      groundDefaultsRow.append(groundColorPicker.row);
    }
    groundDefaultsRow.append(groundColorClear);
    wireDefaultsRow.append(wireDefaultsLabel);
    if (wireDefaultColorPicker?.row) {
      wireDefaultsRow.append(wireDefaultColorPicker.row);
    }
    wireDefaultsRow.append(wireDefaultColorClear);
    probeDefaultsRow.append(probeDefaultsLabel);
    if (probeDefaultColorPicker?.row) {
      probeDefaultsRow.append(probeDefaultColorPicker.row);
    }
    probeDefaultsRow.append(probeDefaultColorClear);
    const settingsRowByScopeType = new Map(
      componentDefaultRows.map((entry) => [entry.type, entry.row])
    );
    settingsRowByScopeType.set("SELECT", selectDefaultsRow);
    settingsRowByScopeType.set("GND", groundDefaultsRow);
    settingsRowByScopeType.set("WIRE", wireDefaultsRow);
    settingsRowByScopeType.set("PROBE", probeDefaultsRow);
    const settingsRowsOrdered = [];
    const seenRows = new Set();
    const appendSettingsRow = (row) => {
      if (!(row instanceof HTMLElement) || seenRows.has(row)) {
        return;
      }
      seenRows.add(row);
      settingsRowsOrdered.push(row);
    };
    toolSettingsScopes.forEach((entry) => {
      appendSettingsRow(settingsRowByScopeType.get(entry.scopeType));
    });
    componentDefaultRows.forEach((entry) => appendSettingsRow(entry.row));
    appendSettingsRow(selectDefaultsRow);
    appendSettingsRow(groundDefaultsRow);
    appendSettingsRow(wireDefaultsRow);
    appendSettingsRow(probeDefaultsRow);
    settingsBody.append(
      autoSwitchToolUseRow,
      autoSwitchWireUseRow,
      schematicTextFontRow,
      schematicTextSizeRow,
      schematicTextBoldRow,
      schematicTextItalicRow,
      schematicValueUnitSpacingRow,
      componentDefaultsTitle,
      ...settingsRowsOrdered
    );
    const settingsActions = document.createElement("div");
    settingsActions.className = "modal-actions";
    const settingsApplyComponentDefaults = document.createElement("button");
    settingsApplyComponentDefaults.type = "button";
    settingsApplyComponentDefaults.className = "secondary";
    settingsApplyComponentDefaults.textContent = "Apply display settings to existing";
    settingsApplyComponentDefaults.dataset.settingsApplyComponentDefaults = "1";
    settingsApplyComponentDefaults.hidden = componentDefaultRows.length < 1;
    const settingsDefaultComponentType = document.createElement("button");
    settingsDefaultComponentType.type = "button";
    settingsDefaultComponentType.className = "secondary";
    settingsDefaultComponentType.textContent = "Default";
    settingsDefaultComponentType.dataset.settingsDefaultComponentType = "1";
    settingsDefaultComponentType.hidden = true;
    const settingsReset = document.createElement("button");
    settingsReset.type = "button";
    settingsReset.className = "secondary";
    settingsReset.textContent = "Reset Settings";
    settingsReset.dataset.settingsReset = "1";
    const settingsClose = document.createElement("button");
    settingsClose.type = "button";
    settingsClose.textContent = "Close";
    settingsClose.dataset.settingsClose = "1";
    settingsActions.append(settingsApplyComponentDefaults, settingsDefaultComponentType, settingsReset, settingsClose);
    settingsPanel.append(settingsTitle, settingsBody, settingsActions);
    settingsDialog.append(settingsPanel);
    container.appendChild(settingsDialog);

    const componentDefaultRowByType = new Map(
      componentDefaultRows.map((entry) => [entry.type, entry])
    );
    const normalizeScopedSettingsType = (value) => {
      const type = String(value ?? "").trim().toUpperCase();
      if (!type) {
        return "";
      }
      const mappedScopeType = toolSettingsScopeByToolType.get(type);
      if (mappedScopeType) {
        return mappedScopeType;
      }
      if (toolSettingsScopeByType.has(type)) {
        return type;
      }
      return "";
    };
    const getScopedSettingsLabel = (type) => {
      if (!type) {
        return "Settings";
      }
      const settingsScope = toolSettingsScopeByType.get(String(type ?? "").trim().toUpperCase());
      if (settingsScope && settingsScope.label) {
        return settingsScope.label;
      }
      const componentDefaultRow = componentDefaultRowByType.get(type);
      if (componentDefaultRow) {
        return componentDefaultRow.label || componentDefaultRow.type;
      }
      return type;
    };
    let activeScopedSettingsType = "";
    let activeScopedSourceType = "";
    const syncDialogScopeState = () => {
      const scopedType = activeScopedSettingsType;
      const scoped = Boolean(scopedType);
      const scopedSettings = scoped
        ? (toolSettingsScopeByType.get(scopedType) ?? null)
        : null;
      const supportsScopedApply = scopedSettings?.supportsApply === true;
      const supportsScopedReset = scopedSettings?.supportsReset === true;
      settingsDialog.dataset.settingsScopeType = scopedType;
      settingsTitle.textContent = scoped
        ? `${getScopedSettingsLabel(scopedType)} Defaults`
        : "Settings";
      autoSwitchToolUseRow.hidden = scoped;
      autoSwitchWireUseRow.hidden = scoped;
      schematicTextFontRow.hidden = scoped;
      schematicTextSizeRow.hidden = scoped;
      schematicTextBoldRow.hidden = scoped;
      schematicTextItalicRow.hidden = scoped;
      schematicValueUnitSpacingRow.hidden = scoped;
      componentDefaultsTitle.hidden = scoped;
      componentDefaultRows.forEach((entry) => {
        entry.row.hidden = scoped && entry.type !== scopedType;
      });
      groundDefaultsRow.hidden = scoped && scopedType !== "GND";
      wireDefaultsRow.hidden = scoped && scopedType !== "WIRE";
      probeDefaultsRow.hidden = scoped && scopedType !== "PROBE";
      selectDefaultsRow.hidden = scoped && scopedType !== "SELECT";
      settingsDefaultComponentType.hidden = !scoped || !supportsScopedReset;
      settingsReset.hidden = scoped;
      settingsApplyComponentDefaults.hidden = scoped
        ? !supportsScopedApply
        : componentDefaultRows.length < 1;
    };
    const buildScopedApplyOptions = () => {
      if (!activeScopedSettingsType) {
        return null;
      }
      const scopedSettings = toolSettingsScopeByType.get(activeScopedSettingsType) ?? null;
      if (scopedSettings?.supportsApply !== true) {
        return null;
      }
      const options = {
        types: [],
        applyGroundDefaults: false,
        applyProbeDefaults: false,
        applyWireDefaults: false
      };
      if (activeScopedSettingsType === "GND") {
        options.applyGroundDefaults = true;
      } else if (activeScopedSettingsType === "PROBE") {
        options.applyProbeDefaults = true;
      } else if (activeScopedSettingsType === "WIRE") {
        options.applyWireDefaults = true;
      } else {
        options.types = [activeScopedSettingsType];
      }
      return options;
    };
    const syncSettingsState = () => {
      autoSwitchToolUseToggle.checked = Boolean(getAutoSwitchToSelectAfterToolUse());
      autoSwitchWireUseToggle.checked = Boolean(getAutoSwitchToSelectAfterWireUse());
      const textSettings = getSchematicTextStyle();
      const normalizedFont = String(textSettings?.font ?? "").trim();
      const hasMatchingOption = Array.from(schematicTextFontSelect.options).some((option) => option.value === normalizedFont);
      schematicTextFontSelect.value = hasMatchingOption
        ? normalizedFont
        : schematicTextFontSelect.options[0].value;
      const parsedSize = Number(textSettings?.size);
      schematicTextSizeInput.value = Number.isFinite(parsedSize)
        ? String(Math.round(parsedSize))
        : String(defaultTextStyle.size);
      schematicTextBoldToggle.checked = textSettings?.bold === true;
      schematicTextItalicToggle.checked = textSettings?.italic === true;
      schematicValueUnitSpacingToggle.checked = getSchematicValueUnitSpacing() !== false;
      const componentDefaults = getComponentDefaults();
      componentDefaultRows.forEach((entry) => {
        const typeDefaults = componentDefaults && typeof componentDefaults === "object"
          ? componentDefaults[entry.type]
          : null;
        const normalizedValue = String(typeDefaults?.value ?? "");
        if (entry.type === "SW") {
          const parsedSwitchDefaults = parseSwitchComponentDefaultValue(normalizedValue);
          entry.switchRonInput.value = String(parsedSwitchDefaults?.ron ?? "0");
          entry.switchRoffInput.value = String(parsedSwitchDefaults?.roff ?? "");
        } else {
          if (entry.valueInput instanceof HTMLSelectElement) {
            const customOption = entry.valueInput.querySelector("option[data-settings-component-default-custom='1']");
            if (customOption) {
              customOption.remove();
            }
            const hasOption = Array.from(entry.valueInput.options).some((option) => option.value === normalizedValue);
            if (!hasOption && normalizedValue) {
              const option = document.createElement("option");
              option.value = normalizedValue;
              option.textContent = normalizedValue;
              option.dataset.settingsComponentDefaultCustom = "1";
              entry.valueInput.appendChild(option);
            }
          }
          entry.valueInput.value = normalizedValue;
          if (entry.type === "XFMR" && entry.xfmrPolaritySelect instanceof HTMLSelectElement) {
            const normalizedPolarity = String(typeDefaults?.xfmrPolarity ?? "subtractive").trim().toLowerCase();
            entry.xfmrPolaritySelect.value = normalizedPolarity === "additive" ? "additive" : "subtractive";
          }
          if (entry.type === "XFMR" && entry.xfmrSolveBySelect instanceof HTMLSelectElement) {
            const normalizedSolveBy = String(typeDefaults?.xfmrSolveBy ?? "ratio").trim().toLowerCase();
            entry.xfmrSolveBySelect.value = normalizedSolveBy === "secondary" ? "secondary" : "ratio";
          }
        }
        const normalizedColor = String(typeDefaults?.netColor ?? "").trim().toLowerCase();
        entry.colorClear.dataset.settingsComponentDefaultCurrentColor = normalizedColor;
        entry.colorPicker?.setSelected(normalizedColor);
      });
      const displayDefaults = getToolDisplayDefaults();
      const normalizedResistorStyle = String(displayDefaults?.resistorStyle ?? "").trim().toLowerCase();
      const normalizedGroundVariant = String(displayDefaults?.groundVariant ?? "").trim().toLowerCase();
      const hasResistorStyleOption = Array.from(resistorDisplayTypeSelect.options)
        .some((option) => option.value === normalizedResistorStyle);
      const hasGroundVariantOption = Array.from(groundDisplayTypeSelect.options)
        .some((option) => option.value === normalizedGroundVariant);
      if (hasResistorStyleOption) {
        resistorDisplayTypeSelect.value = normalizedResistorStyle;
      }
      if (hasGroundVariantOption) {
        groundDisplayTypeSelect.value = normalizedGroundVariant;
      }
      const normalizedGroundColor = String(displayDefaults?.groundColor ?? "").trim().toLowerCase();
      groundColorClear.dataset.settingsToolDisplayGroundColorCurrentColor = normalizedGroundColor;
      groundColorPicker?.setSelected(normalizedGroundColor);
      const normalizedWireDefaultColor = String(getWireDefaultColor() ?? "").trim().toLowerCase();
      wireDefaultColorClear.dataset.settingsWireDefaultCurrentColor = normalizedWireDefaultColor;
      wireDefaultColorPicker?.setSelected(normalizedWireDefaultColor);
      const normalizedProbeDefaultColor = String(displayDefaults?.probeColor ?? "").trim().toLowerCase();
      probeDefaultColorClear.dataset.settingsToolDisplayProbeColorCurrentColor = normalizedProbeDefaultColor;
      probeDefaultColorPicker?.setSelected(normalizedProbeDefaultColor);
    };
    const openSettingsDialog = () => {
      activeScopedSettingsType = "";
      activeScopedSourceType = "";
      syncDialogScopeState();
      syncSettingsState();
      setDialogOpen(settingsDialog, true);
    };
    const openSettingsDialogForType = (type) => {
      const normalizedScopeType = normalizeScopedSettingsType(type);
      if (!normalizedScopeType) {
        return false;
      }
      activeScopedSettingsType = normalizedScopeType;
      activeScopedSourceType = String(type ?? "").trim().toUpperCase();
      syncDialogScopeState();
      syncSettingsState();
      setDialogOpen(settingsDialog, true);
      return true;
    };
    const closeSettingsDialog = () => setDialogOpen(settingsDialog, false);

    settingsDialog.addEventListener("click", (event) => {
      if (event.target === settingsDialog) {
        closeSettingsDialog();
      }
    });
    autoSwitchToolUseToggle.addEventListener("change", () => {
      onAutoSwitchToSelectAfterToolUseChange(autoSwitchToolUseToggle.checked);
    });
    autoSwitchWireUseToggle.addEventListener("change", () => {
      onAutoSwitchToSelectAfterWireUseChange(autoSwitchWireUseToggle.checked);
    });
    schematicTextFontSelect.addEventListener("change", () => {
      onSchematicTextStyleChange({ font: schematicTextFontSelect.value });
    });
    schematicTextSizeInput.addEventListener("change", () => {
      onSchematicTextStyleChange({ size: Number(schematicTextSizeInput.value) });
    });
    schematicTextBoldToggle.addEventListener("change", () => {
      onSchematicTextStyleChange({ bold: schematicTextBoldToggle.checked });
    });
    schematicTextItalicToggle.addEventListener("change", () => {
      onSchematicTextStyleChange({ italic: schematicTextItalicToggle.checked });
    });
    schematicValueUnitSpacingToggle.addEventListener("change", () => {
      onSchematicValueUnitSpacingChange(schematicValueUnitSpacingToggle.checked);
    });
    resistorDisplayTypeSelect.addEventListener("change", () => {
      onToolDisplayDefaultChange("resistorStyle", resistorDisplayTypeSelect.value);
    });
    groundDisplayTypeSelect.addEventListener("change", () => {
      onToolDisplayDefaultChange("groundVariant", groundDisplayTypeSelect.value);
    });
    componentDefaultRows.forEach((entry) => {
      if (entry.type === "SW") {
        entry.switchRonInput.addEventListener("change", () => {
          onComponentDefaultChange(entry.type, { switchRon: entry.switchRonInput.value });
        });
        entry.switchRoffInput.addEventListener("change", () => {
          onComponentDefaultChange(entry.type, { switchRoff: entry.switchRoffInput.value });
        });
        return;
      }
      entry.valueInput.addEventListener("change", () => {
        onComponentDefaultChange(entry.type, { value: entry.valueInput.value });
      });
      if (entry.type === "XFMR" && entry.xfmrPolaritySelect instanceof HTMLSelectElement) {
        entry.xfmrPolaritySelect.addEventListener("change", () => {
          onComponentDefaultChange(entry.type, { xfmrPolarity: entry.xfmrPolaritySelect.value });
        });
      }
      if (entry.type === "XFMR" && entry.xfmrSolveBySelect instanceof HTMLSelectElement) {
        entry.xfmrSolveBySelect.addEventListener("change", () => {
          onComponentDefaultChange(entry.type, { xfmrSolveBy: entry.xfmrSolveBySelect.value });
        });
      }
    });
    settingsApplyComponentDefaults.addEventListener("click", () => {
      if (activeScopedSettingsType) {
        const scopedOptions = buildScopedApplyOptions();
        if (!scopedOptions) {
          return;
        }
        onApplyComponentDefaultsToExisting(scopedOptions ?? undefined);
        return;
      }
      onApplyComponentDefaultsToExisting(undefined);
    });
    settingsDefaultComponentType.addEventListener("click", () => {
      if (!activeScopedSettingsType) {
        return;
      }
      const scopedSettings = toolSettingsScopeByType.get(activeScopedSettingsType) ?? null;
      if (scopedSettings?.supportsReset !== true) {
        return;
      }
      onResetComponentTypeDefaults(activeScopedSourceType || activeScopedSettingsType);
      syncSettingsState();
    });
    settingsReset.addEventListener("click", () => {
      onResetSettings();
      syncSettingsState();
    });
    settingsClose.addEventListener("click", closeSettingsDialog);
    syncDialogScopeState();
    syncSettingsState();

    return { settingsDialog, openSettingsDialog, openSettingsDialogForType, closeSettingsDialog };
  };

  if (typeof self !== "undefined") {
    self.SpjutSimUIDialogs = {
      ABOUT_DIALOG_CONTENT,
      HOTKEY_SHORTCUTS,
      setDialogOpen,
      buildAboutDialog,
      buildHotkeysDialog,
      buildSettingsDialog
    };
  }
})();
