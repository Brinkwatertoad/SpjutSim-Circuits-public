/**
 * UI inline editor workflow/orchestration helpers.
 */
(function initUIInlineEditorWorkflowModule() {
  const requireFunction = (value, name) => {
    if (typeof value !== "function") {
      throw new Error(`Inline editor workflow requires '${name}' helper function.`);
    }
    return value;
  };
  const INLINE_SELECT_SYNC_ENTRIES_NORMALIZED = Symbol("inlineSelectSyncEntriesNormalized");
  const INLINE_TOGGLE_SYNC_ENTRIES_NORMALIZED = Symbol("inlineToggleSyncEntriesNormalized");
  const INLINE_INPUT_SYNC_ENTRIES_NORMALIZED = Symbol("inlineInputSyncEntriesNormalized");

  const normalizeInlineSelectSyncEntries = (rawEntries) => {
    if (!Array.isArray(rawEntries)) {
      throw new Error("Inline editor workflow requires inline select sync entries array.");
    }
    const normalizedEntries = rawEntries.map((entry, index) => {
      const fieldPath = `inlineSelectSyncEntries[${index}]`;
      const componentType = String(entry?.componentType ?? "").trim().toUpperCase();
      if (!componentType) {
        throw new Error(`Inline editor workflow ${fieldPath} requires non-empty componentType.`);
      }
      const propertyKey = String(entry?.propertyKey ?? "").trim();
      if (!propertyKey) {
        throw new Error(`Inline editor workflow ${fieldPath} requires non-empty propertyKey.`);
      }
      if (!(entry?.row && typeof entry.row === "object")) {
        throw new Error(`Inline editor workflow ${fieldPath} requires row element.`);
      }
      if (!(entry?.select && typeof entry.select === "object")) {
        throw new Error(`Inline editor workflow ${fieldPath} requires select element.`);
      }
      const normalizeValue = requireFunction(entry?.normalizeValue, `${fieldPath}.normalizeValue`);
      return {
        componentType,
        propertyKey,
        row: entry.row,
        select: entry.select,
        normalizeValue
      };
    });
    Object.defineProperty(normalizedEntries, INLINE_SELECT_SYNC_ENTRIES_NORMALIZED, {
      value: true,
      writable: false,
      enumerable: false,
      configurable: false
    });
    return normalizedEntries;
  };
  const requireInlineSelectSyncEntries = (args) => {
    const inlineSelectSyncEntries = args?.inlineSelectSyncEntries;
    if (Array.isArray(inlineSelectSyncEntries) && inlineSelectSyncEntries[INLINE_SELECT_SYNC_ENTRIES_NORMALIZED] === true) {
      return inlineSelectSyncEntries;
    }
    return normalizeInlineSelectSyncEntries(inlineSelectSyncEntries);
  };
  const normalizeInlineToggleSyncEntries = (rawEntries) => {
    if (!Array.isArray(rawEntries)) {
      throw new Error("Inline editor workflow requires inline toggle sync entries array.");
    }
    const normalizedEntries = rawEntries.map((entry, index) => {
      const fieldPath = `inlineToggleSyncEntries[${index}]`;
      const componentType = String(entry?.componentType ?? "").trim().toUpperCase();
      if (!componentType) {
        throw new Error(`Inline editor workflow ${fieldPath} requires non-empty componentType.`);
      }
      const propertyKey = String(entry?.propertyKey ?? "").trim();
      if (!propertyKey) {
        throw new Error(`Inline editor workflow ${fieldPath} requires non-empty propertyKey.`);
      }
      if (!(entry?.row && typeof entry.row === "object")) {
        throw new Error(`Inline editor workflow ${fieldPath} requires row element.`);
      }
      if (!(entry?.input && typeof entry.input === "object")) {
        throw new Error(`Inline editor workflow ${fieldPath} requires input element.`);
      }
      const normalizeValue = requireFunction(entry?.normalizeValue, `${fieldPath}.normalizeValue`);
      return {
        componentType,
        propertyKey,
        row: entry.row,
        input: entry.input,
        normalizeValue
      };
    });
    Object.defineProperty(normalizedEntries, INLINE_TOGGLE_SYNC_ENTRIES_NORMALIZED, {
      value: true,
      writable: false,
      enumerable: false,
      configurable: false
    });
    return normalizedEntries;
  };
  const requireInlineToggleSyncEntries = (args) => {
    const inlineToggleSyncEntries = args?.inlineToggleSyncEntries;
    if (Array.isArray(inlineToggleSyncEntries) && inlineToggleSyncEntries[INLINE_TOGGLE_SYNC_ENTRIES_NORMALIZED] === true) {
      return inlineToggleSyncEntries;
    }
    return normalizeInlineToggleSyncEntries(inlineToggleSyncEntries);
  };
  const normalizeInlineInputSyncEntries = (rawEntries) => {
    if (!Array.isArray(rawEntries)) {
      throw new Error("Inline editor workflow requires inline input sync entries array.");
    }
    const normalizedEntries = rawEntries.map((entry, index) => {
      const fieldPath = `inlineInputSyncEntries[${index}]`;
      const componentType = String(entry?.componentType ?? "").trim().toUpperCase();
      if (!componentType) {
        throw new Error(`Inline editor workflow ${fieldPath} requires non-empty componentType.`);
      }
      const propertyKey = String(entry?.propertyKey ?? "").trim();
      if (!propertyKey) {
        throw new Error(`Inline editor workflow ${fieldPath} requires non-empty propertyKey.`);
      }
      if (!(entry?.row && typeof entry.row === "object")) {
        throw new Error(`Inline editor workflow ${fieldPath} requires row element.`);
      }
      if (!(entry?.input && typeof entry.input === "object")) {
        throw new Error(`Inline editor workflow ${fieldPath} requires input element.`);
      }
      const normalizeValue = requireFunction(entry?.normalizeValue, `${fieldPath}.normalizeValue`);
      const defaultReadOnly = entry?.defaultReadOnly === true;
      return {
        componentType,
        propertyKey,
        row: entry.row,
        input: entry.input,
        readOnlyChip: entry?.readOnlyChip && typeof entry.readOnlyChip === "object" ? entry.readOnlyChip : null,
        readOnlyLock: entry?.readOnlyLock && typeof entry.readOnlyLock === "object" ? entry.readOnlyLock : null,
        defaultReadOnly,
        normalizeValue
      };
    });
    Object.defineProperty(normalizedEntries, INLINE_INPUT_SYNC_ENTRIES_NORMALIZED, {
      value: true,
      writable: false,
      enumerable: false,
      configurable: false
    });
    return normalizedEntries;
  };
  const requireInlineInputSyncEntries = (args) => {
    const inlineInputSyncEntries = args?.inlineInputSyncEntries;
    if (Array.isArray(inlineInputSyncEntries) && inlineInputSyncEntries[INLINE_INPUT_SYNC_ENTRIES_NORMALIZED] === true) {
      return inlineInputSyncEntries;
    }
    return normalizeInlineInputSyncEntries(inlineInputSyncEntries);
  };

  const createGetModelComponent = (input) => {
    const args = input && typeof input === "object" ? input : {};
    const getModel = typeof args.getModel === "function" ? args.getModel : () => null;
    return (componentId) => {
      if (!componentId) {
        return null;
      }
      const model = getModel();
      const components = Array.isArray(model?.components) ? model.components : [];
      return components.find((entry) => String(entry?.id ?? "") === String(componentId)) ?? null;
    };
  };

  const applyValueFieldMetaToElements = (input) => {
    const args = input && typeof input === "object" ? input : {};
    const getValueFieldMeta = requireFunction(args.getValueFieldMeta, "getValueFieldMeta");
    const meta = getValueFieldMeta(args.type);
    const setLabelTextPreservingReadOnlyChip = (labelEl, text) => {
      if (!labelEl || typeof labelEl !== "object") {
        return;
      }
      const readOnlyChip = typeof labelEl.querySelector === "function"
        ? labelEl.querySelector(":scope > [data-inline-readonly-chip=\"1\"]")
        : null;
      if (!(readOnlyChip && typeof readOnlyChip === "object")) {
        labelEl.textContent = text;
        return;
      }
      const textNode = labelEl.ownerDocument?.createTextNode
        ? labelEl.ownerDocument.createTextNode(text)
        : null;
      if (!textNode) {
        labelEl.textContent = text;
        return;
      }
      const toRemove = [];
      labelEl.childNodes.forEach((node) => {
        if (node !== readOnlyChip) {
          toRemove.push(node);
        }
      });
      toRemove.forEach((node) => node.parentNode?.removeChild(node));
      labelEl.insertBefore(textNode, readOnlyChip);
    };
    if (args.labelEl) {
      setLabelTextPreservingReadOnlyChip(args.labelEl, `${String(meta?.label ?? "Value")}:`);
    }
    if (args.unitEl) {
      args.unitEl.textContent = String(meta?.unit ?? "");
    }
  };

  const updateSchematicPropsForInlineEditor = (input) => {
    const args = input && typeof input === "object" ? input : {};
    const component = args.component ?? null;
    const onSetSelectionId = typeof args.onSetSelectionId === "function" ? args.onSetSelectionId : () => { };
    const onSyncEditor = typeof args.onSyncEditor === "function" ? args.onSyncEditor : () => { };
    const onCloseEditor = typeof args.onCloseEditor === "function" ? args.onCloseEditor : () => { };
    const onRefreshMeasurements = typeof args.onRefreshMeasurements === "function" ? args.onRefreshMeasurements : () => { };
    onSetSelectionId(component ? component.id : null);
    const inlineEditingComponentId = args.inlineEditingComponentId;
    if (!inlineEditingComponentId) {
      onRefreshMeasurements();
      return;
    }
    if (component && component.id === inlineEditingComponentId) {
      onSyncEditor(component);
    } else {
      onCloseEditor();
    }
    onRefreshMeasurements();
  };

  const createInlineNetColorPickHandler = (input) => {
    const args = input && typeof input === "object" ? input : {};
    const canEdit = typeof args.canEdit === "function" ? args.canEdit : () => false;
    const getEditingComponentId = typeof args.getEditingComponentId === "function" ? args.getEditingComponentId : () => "";
    const getEditor = typeof args.getEditor === "function" ? args.getEditor : () => null;
    return (color) => {
      if (!canEdit()) {
        return;
      }
      const componentId = String(getEditingComponentId() ?? "").trim();
      if (!componentId) {
        return;
      }
      const editor = getEditor();
      if (!editor || typeof editor.updateComponent !== "function") {
        return;
      }
      editor.updateComponent(componentId, { netColor: color });
    };
  };

  const createInlinePatchHelpers = (input) => {
    const args = input && typeof input === "object" ? input : {};
    const canEdit = typeof args.canEdit === "function" ? args.canEdit : () => false;
    const getEditingComponentId = typeof args.getEditingComponentId === "function" ? args.getEditingComponentId : () => "";
    const getEditor = typeof args.getEditor === "function" ? args.getEditor : () => null;

    const canEditInlineInputs = () => canEdit() === true;
    const applyInlinePatch = (patch) => {
      if (!canEditInlineInputs()) {
        return;
      }
      const editor = getEditor();
      const componentId = String(getEditingComponentId() ?? "").trim();
      if (!editor || typeof editor.updateComponent !== "function" || !componentId) {
        return;
      }
      editor.updateComponent(componentId, patch);
    };

    return {
      canEditInlineInputs,
      applyInlinePatch
    };
  };

  const commitInlineSwitchStateForEditor = (input) => {
    const args = input && typeof input === "object" ? input : {};
    const canCommit = typeof args.canCommit === "function" ? args.canCommit : () => false;
    if (!canCommit()) {
      return;
    }
    const getEditingComponentId = typeof args.getEditingComponentId === "function" ? args.getEditingComponentId : () => "";
    const componentId = String(getEditingComponentId() ?? "").trim();
    if (!componentId) {
      return;
    }
    const getModelComponent = typeof args.getModelComponent === "function" ? args.getModelComponent : () => null;
    const component = getModelComponent(componentId);
    const isSwitchComponentType = typeof args.isSwitchComponentType === "function"
      ? args.isSwitchComponentType
      : (type) => {
        const normalized = String(type ?? "").toUpperCase();
        return normalized === "SW" || normalized === "SPST";
      };
    if (!isSwitchComponentType(component?.type)) {
      return;
    }
    const parseSpdtSwitchValueSafe = typeof args.parseSpdtSwitchValueSafe === "function" ? args.parseSpdtSwitchValueSafe : () => null;
    const buildInlineSwitchState = typeof args.buildInlineSwitchState === "function" ? args.buildInlineSwitchState : () => null;
    const formatSpdtSwitchValue = typeof args.formatSpdtSwitchValue === "function" ? args.formatSpdtSwitchValue : () => "";
    const readSwitchInputs = typeof args.readSwitchInputs === "function" ? args.readSwitchInputs : () => ({ ron: "", roff: "" });
    const updateComponent = typeof args.updateComponent === "function" ? args.updateComponent : () => { };
    const onResync = typeof args.onResync === "function" ? args.onResync : () => { };
    const parsed = parseSpdtSwitchValueSafe(component.value);
    const switchInputs = readSwitchInputs();
    const overrides = args.overrides && typeof args.overrides === "object" ? args.overrides : {};
    const nextState = buildInlineSwitchState({
      baseState: parsed,
      overrides,
      ronInput: switchInputs.ron,
      roffInput: switchInputs.roff
    });
    updateComponent(componentId, { value: formatSpdtSwitchValue(nextState) });
    if (args.options?.resync) {
      onResync(componentId);
    }
  };

  const syncInlineEditorFromComponent = (input) => {
    const args = input && typeof input === "object" ? input : {};
    const component = args.component;
    if (!component) {
      return;
    }
    const panel = args.panel && typeof args.panel === "object" ? args.panel : {};
    const type = String(component.type ?? "").toUpperCase();
    const getInlineModeFlags = typeof args.getInlineModeFlags === "function" ? args.getInlineModeFlags : () => ({ supportsValueField: false });
    const isProbeType = typeof args.isProbeType === "function" ? args.isProbeType : () => false;
    const supportsComponentValueField = typeof args.supportsComponentValueField === "function" ? args.supportsComponentValueField : () => false;
    const parseBoxAnnotationStyle = requireFunction(args.parseBoxAnnotationStyle, "parseBoxAnnotationStyle");
    const parseArrowAnnotationStyle = requireFunction(args.parseArrowAnnotationStyle, "parseArrowAnnotationStyle");
    const parseTextAnnotationStyle = requireFunction(args.parseTextAnnotationStyle, "parseTextAnnotationStyle");
    const setInputReadOnlyState = (entry) => {
      const options = entry && typeof entry === "object" ? entry : {};
      const row = options.row && typeof options.row === "object" ? options.row : null;
      const inputEl = options.input && typeof options.input === "object" ? options.input : null;
      const readOnlyChip = options.readOnlyChip && typeof options.readOnlyChip === "object"
        ? options.readOnlyChip
        : null;
      const readOnlyLock = options.readOnlyLock && typeof options.readOnlyLock === "object"
        ? options.readOnlyLock
        : null;
      const isReadOnly = options.readOnly === true;
      const reason = String(options.reason ?? "").trim();
      if (row && typeof row.classList?.toggle === "function") {
        row.classList.toggle("inline-edit-row-readonly", isReadOnly);
      }
      if (readOnlyChip && typeof readOnlyChip.hidden === "boolean") {
        readOnlyChip.hidden = !isReadOnly;
      }
      if (readOnlyLock && typeof readOnlyLock.hidden === "boolean") {
        readOnlyLock.hidden = !isReadOnly;
      }
      if (isReadOnly) {
        if (inputEl) {
          inputEl.readOnly = true;
          if (typeof inputEl.setAttribute === "function") {
            inputEl.setAttribute("tabindex", "-1");
            inputEl.setAttribute("aria-readonly", "true");
            if (reason) {
              inputEl.setAttribute("data-inline-readonly-reason", reason);
            } else {
              inputEl.removeAttribute("data-inline-readonly-reason");
            }
          }
        }
        if (readOnlyChip && typeof readOnlyChip.setAttribute === "function") {
          if (reason) {
            readOnlyChip.setAttribute("title", reason);
          } else {
            readOnlyChip.removeAttribute("title");
          }
        }
        if (readOnlyLock && typeof readOnlyLock.setAttribute === "function") {
          if (reason) {
            readOnlyLock.setAttribute("title", reason);
          } else {
            readOnlyLock.removeAttribute("title");
          }
        }
        return;
      }
      if (inputEl) {
        inputEl.readOnly = false;
        if (typeof inputEl.removeAttribute === "function") {
          inputEl.removeAttribute("tabindex");
          inputEl.removeAttribute("aria-readonly");
          inputEl.removeAttribute("data-inline-readonly-reason");
        }
      }
      if (readOnlyChip && typeof readOnlyChip.removeAttribute === "function") {
        readOnlyChip.removeAttribute("title");
      }
      if (readOnlyLock && typeof readOnlyLock.removeAttribute === "function") {
        readOnlyLock.removeAttribute("title");
      }
    };
    const setRowHidden = (row, hidden) => {
      if (row && typeof row === "object") {
        row.hidden = hidden;
      }
    };
    const inlineModeFlags = getInlineModeFlags({
      type,
      isProbe: isProbeType(type),
      supportsValueField: supportsComponentValueField(component.type)
    });
    if (typeof args.onBeforeSync === "function") {
      args.onBeforeSync();
    }
    panel.inlineNameInput.value = Object.prototype.hasOwnProperty.call(component, "name")
      ? String(component.name ?? "")
      : String(component.id ?? "");
    panel.inlineProbeTypeRow.hidden = !inlineModeFlags.isProbeComponent;
    panel.inlineProbeTypeSelect.value = inlineModeFlags.isProbeComponent && ["PV", "PI", "PP"].includes(type) ? type : "PV";
    const transformerSolveBy = type === "XFMR"
      ? String(component?.xfmrSolveBy ?? "").trim().toLowerCase()
      : "";
    const transformerSolveBySecondary = transformerSolveBy === "secondary";
    panel.inlineValueInput.value = inlineModeFlags.supportsValueField ? String(component.value ?? "") : "";
    panel.inlineValueRow.hidden = !inlineModeFlags.showValueRow;
    panel.inlineValueInput.disabled = !inlineModeFlags.showValueRow;
    setInputReadOnlyState({
      row: panel.inlineValueRow,
      input: panel.inlineValueInput,
      readOnlyChip: panel.inlineValueReadOnlyChip,
      readOnlyLock: panel.inlineValueReadOnlyLock,
      readOnly: type === "XFMR" && !transformerSolveBySecondary,
      reason: type === "XFMR" && !transformerSolveBySecondary
        ? "Computed from Lp and Ls in Turns ratio mode."
        : ""
    });
    const inlineSelectSyncEntries = requireInlineSelectSyncEntries(args);
    inlineSelectSyncEntries.forEach((entry) => {
      const isMatch = type === entry.componentType;
      setRowHidden(entry.row, !isMatch);
      if (isMatch) {
        entry.select.value = entry.normalizeValue(component?.[entry.propertyKey]);
      }
    });
    const inlineToggleSyncEntries = requireInlineToggleSyncEntries(args);
    inlineToggleSyncEntries.forEach((entry) => {
      const isMatch = type === entry.componentType;
      setRowHidden(entry.row, !isMatch);
      if (isMatch) {
        entry.input.checked = entry.normalizeValue(component?.[entry.propertyKey]) === true;
      }
    });
    const inlineInputSyncEntries = requireInlineInputSyncEntries(args);
    inlineInputSyncEntries.forEach((entry) => {
      const isMatch = type === entry.componentType;
      setRowHidden(entry.row, !isMatch);
      if (isMatch) {
        const hasValue = component && Object.prototype.hasOwnProperty.call(component, entry.propertyKey);
        const rawValue = hasValue ? component[entry.propertyKey] : "";
        entry.input.value = rawValue === undefined || rawValue === null ? "" : String(rawValue);
        let readOnly = entry.defaultReadOnly === true;
        let reason = readOnly ? "Read-only property." : "";
        if (type === "XFMR" && entry.propertyKey === "xfmrLs") {
          readOnly = transformerSolveBySecondary;
          reason = readOnly ? "Computed from Lp and N in Secondary inductance mode." : "";
        }
        setInputReadOnlyState({
          row: entry.row,
          input: entry.input,
          readOnlyChip: entry.readOnlyChip,
          readOnlyLock: entry.readOnlyLock,
          readOnly,
          reason
        });
      }
    });
    const isBoxComponent = inlineModeFlags.isBoxAnnotation === true;
    const isArrowComponent = type === "ARR";
    const isTextComponent = inlineModeFlags.isTextAnnotation === true;
    setRowHidden(panel.inlineNameRow, isBoxComponent || isArrowComponent || inlineModeFlags.isProbeComponent === true);
    const boxStyle = isBoxComponent
      ? parseBoxAnnotationStyle(component.value, {
        type,
        defaultLineType: "solid"
      })
      : null;
    const arrowStyle = isArrowComponent
      ? parseArrowAnnotationStyle(component.value, { type })
      : null;
    const textStyle = isTextComponent
      ? parseTextAnnotationStyle(component.value, { type })
      : null;
    setRowHidden(panel.inlineBoxThicknessRow, !(isBoxComponent || isArrowComponent));
    setRowHidden(panel.inlineBoxLineTypeRow, !(isBoxComponent || isArrowComponent));
    setRowHidden(panel.inlineBoxFillEnabledRow, !isBoxComponent);
    setRowHidden(panel.inlineBoxFillColorRow, !isBoxComponent || !(boxStyle?.fillEnabled === true));
    setRowHidden(panel.inlineBoxOpacityRow, !(isBoxComponent || isArrowComponent || isTextComponent));
    if (isBoxComponent) {
      if (panel.inlineBoxThicknessInput) {
        panel.inlineBoxThicknessInput.value = String(Math.round(Number(boxStyle?.thickness ?? 2)));
      }
      if (panel.inlineBoxLineTypeSelect) {
        panel.inlineBoxLineTypeSelect.value = String(boxStyle?.lineType ?? "solid");
      }
      if (panel.inlineBoxFillEnabledInput) {
        panel.inlineBoxFillEnabledInput.checked = boxStyle?.fillEnabled === true;
      }
      if (panel.inlineBoxFillColorInput) {
        panel.inlineBoxFillColorInput.value = String(boxStyle?.fillColor ?? "#d8d1c6");
      }
      if (panel.inlineBoxOpacityInput) {
        panel.inlineBoxOpacityInput.value = String(Math.round(Number(boxStyle?.opacityPercent ?? 100)));
      }
      if (panel.inlineBoxOpacityValue) {
        panel.inlineBoxOpacityValue.textContent = `${Math.round(Number(boxStyle?.opacityPercent ?? 100))}%`;
      }
    }
    if (isArrowComponent) {
      if (panel.inlineBoxThicknessInput) {
        panel.inlineBoxThicknessInput.value = String(Math.round(Number(arrowStyle?.thickness ?? 2)));
      }
      if (panel.inlineBoxLineTypeSelect) {
        panel.inlineBoxLineTypeSelect.value = String(arrowStyle?.lineType ?? "solid");
      }
      if (panel.inlineBoxOpacityInput) {
        panel.inlineBoxOpacityInput.value = String(Math.round(Number(arrowStyle?.opacityPercent ?? 100)));
      }
      if (panel.inlineBoxOpacityValue) {
        panel.inlineBoxOpacityValue.textContent = `${Math.round(Number(arrowStyle?.opacityPercent ?? 100))}%`;
      }
    }
    if (isTextComponent) {
      if (panel.inlineBoxOpacityInput) {
        panel.inlineBoxOpacityInput.value = String(Math.round(Number(textStyle?.opacityPercent ?? 100)));
      }
      if (panel.inlineBoxOpacityValue) {
        panel.inlineBoxOpacityValue.textContent = `${Math.round(Number(textStyle?.opacityPercent ?? 100))}%`;
      }
    }
    panel.inlineSwitchPositionRow.hidden = !inlineModeFlags.isSwitchComponent;
    panel.inlineSwitchRonRow.hidden = !inlineModeFlags.isSwitchComponent;
    panel.inlineSwitchRoffRow.hidden = !inlineModeFlags.isSwitchComponent;
    panel.inlineSwitchShowRonRow.hidden = true;
    panel.inlineSwitchShowRoffRow.hidden = true;

    const parseSpdtSwitchValueSafe = typeof args.parseSpdtSwitchValueSafe === "function" ? args.parseSpdtSwitchValueSafe : () => null;
    const setInlineSwitchActiveThrow = typeof args.setInlineSwitchActiveThrow === "function" ? args.setInlineSwitchActiveThrow : () => { };
    if (inlineModeFlags.isSwitchComponent) {
      const switchValue = parseSpdtSwitchValueSafe(component.value);
      setInlineSwitchActiveThrow(switchValue?.activeThrow);
      panel.inlineSwitchRonInput.value = String(switchValue?.ron ?? "0");
      panel.inlineSwitchRoffInput.value = String(switchValue?.roff ?? "");
    }

    panel.inlineNetColorPicker.row.hidden = false;
    if (typeof panel.inlineNetColorPicker.setSelected === "function") {
      panel.inlineNetColorPicker.setSelected(component.netColor ?? "");
    }
    const inlineEditorRoot = panel.inlineEditor && typeof panel.inlineEditor === "object"
      ? panel.inlineEditor
      : null;
    if (inlineEditorRoot && typeof inlineEditorRoot.appendChild === "function") {
      const transformerPolarityRow = panel.inlineSelectControlsByKey?.xfmrPolarity?.row;
      const transformerSolveByRow = panel.inlineSelectControlsByKey?.xfmrSolveBy?.row;
      if (type === "XFMR"
        && transformerPolarityRow
        && transformerSolveByRow
        && transformerPolarityRow.parentNode === inlineEditorRoot
        && transformerSolveByRow.parentNode === inlineEditorRoot
        && typeof inlineEditorRoot.insertBefore === "function") {
        inlineEditorRoot.insertBefore(transformerPolarityRow, transformerSolveByRow);
      }
      const netColorRow = panel.inlineNetColorPicker?.row;
      const netColorDefaultAnchor = panel.inlineNetColorDefaultAnchor;
      if (netColorRow && netColorRow.parentNode === inlineEditorRoot) {
        if (type === "D" || type === "XFMR") {
          inlineEditorRoot.appendChild(netColorRow);
        } else if (netColorDefaultAnchor
          && netColorDefaultAnchor.parentNode === inlineEditorRoot
          && typeof inlineEditorRoot.insertBefore === "function") {
          inlineEditorRoot.insertBefore(netColorRow, netColorDefaultAnchor);
        }
      }
    }

    if (typeof args.applyValueFieldMeta === "function") {
      args.applyValueFieldMeta(component.type, panel.inlineValueLabel, panel.inlineValueUnit);
      if ((isBoxComponent || isArrowComponent) && panel.inlineBoxThicknessLabel) {
        args.applyValueFieldMeta(component.type, panel.inlineBoxThicknessLabel, panel.inlineBoxThicknessUnit);
      }
    }
    if (typeof panel.syncInlineLabelColumnWidth === "function") {
      panel.syncInlineLabelColumnWidth();
    }
    if (typeof args.onAfterSync === "function") {
      args.onAfterSync();
    }
    if (typeof args.onPositionComponent === "function") {
      args.onPositionComponent(component);
    }
  };

  const openInlineEditorForComponent = (input) => {
    const args = input && typeof input === "object" ? input : {};
    const component = args.componentArg ?? (typeof args.getFallbackComponent === "function" ? args.getFallbackComponent() : null);
    if (!component) {
      return;
    }
    if (typeof args.setEditingComponentId === "function") {
      args.setEditingComponentId(component.id);
    }
    if (typeof args.prepareInlineEditorPanelForOpen === "function") {
      args.prepareInlineEditorPanelForOpen();
    }
    if (typeof args.syncInlineComponentEditor === "function") {
      args.syncInlineComponentEditor(component);
    }
    const requestAnimationFrameFn = typeof args.requestAnimationFrameFn === "function"
      ? args.requestAnimationFrameFn
      : (cb) => cb();
    requestAnimationFrameFn(() => {
      const current = typeof args.getCurrentComponent === "function" ? args.getCurrentComponent() : null;
      if (current && typeof args.positionInlineEditor === "function") {
        args.positionInlineEditor(current);
      }
      if (typeof args.clearInlinePanelVisibility === "function") {
        args.clearInlinePanelVisibility();
      }
      const resolveFocusTargetForComponent = typeof args.resolveFocusTargetForComponent === "function"
        ? args.resolveFocusTargetForComponent
        : () => "value";
      const focusTarget = resolveFocusTargetForComponent(component);
      if (typeof args.applyInlineEditorOpenFocus === "function") {
        args.applyInlineEditorOpenFocus({ focusTarget, component });
      }
    });
  };

  const createInlineEditorHandlers = (input) => {
    const args = input && typeof input === "object" ? input : {};
    const getModelComponent = createGetModelComponent({
      getModel: typeof args.getModel === "function" ? args.getModel : () => null
    });
    const getEditor = typeof args.getEditor === "function" ? args.getEditor : () => null;
    const getEditingComponentId = typeof args.getEditingComponentId === "function" ? args.getEditingComponentId : () => "";
    const setEditingComponentId = typeof args.setEditingComponentId === "function" ? args.setEditingComponentId : () => { };
    const getInlineSync = typeof args.getInlineSync === "function" ? args.getInlineSync : () => false;
    const setInlineSync = typeof args.setInlineSync === "function" ? args.setInlineSync : () => { };
    const panel = args.panel && typeof args.panel === "object" ? args.panel : {};
    const buildProbeTypeUpdate = typeof args.buildProbeTypeUpdate === "function"
      ? args.buildProbeTypeUpdate
      : () => null;
    const isProbeType = typeof args.isProbeType === "function" ? args.isProbeType : () => false;
    const parseSpdtSwitchValueSafe = typeof args.parseSpdtSwitchValueSafe === "function" ? args.parseSpdtSwitchValueSafe : () => null;
    const buildInlineSwitchState = typeof args.buildInlineSwitchState === "function" ? args.buildInlineSwitchState : () => null;
    const formatSpdtSwitchValue = typeof args.formatSpdtSwitchValue === "function" ? args.formatSpdtSwitchValue : () => "";
    const getInlineModeFlags = typeof args.getInlineModeFlags === "function" ? args.getInlineModeFlags : () => ({});
    const supportsComponentValueField = typeof args.supportsComponentValueField === "function" ? args.supportsComponentValueField : () => false;
    const getInlineSelectSyncEntries = requireFunction(args.getInlineSelectSyncEntries, "getInlineSelectSyncEntries");
    const getInlineToggleSyncEntries = requireFunction(args.getInlineToggleSyncEntries, "getInlineToggleSyncEntries");
    const getInlineInputSyncEntries = requireFunction(args.getInlineInputSyncEntries, "getInlineInputSyncEntries");
    const inlineSelectSyncEntries = normalizeInlineSelectSyncEntries(getInlineSelectSyncEntries());
    const inlineToggleSyncEntries = normalizeInlineToggleSyncEntries(getInlineToggleSyncEntries());
    const inlineInputSyncEntries = normalizeInlineInputSyncEntries(getInlineInputSyncEntries());
    const parseBoxAnnotationStyle = requireFunction(args.parseBoxAnnotationStyle, "parseBoxAnnotationStyle");
    const parseArrowAnnotationStyle = requireFunction(args.parseArrowAnnotationStyle, "parseArrowAnnotationStyle");
    const parseTextAnnotationStyle = requireFunction(args.parseTextAnnotationStyle, "parseTextAnnotationStyle");
    const applyValueFieldMeta = typeof args.applyValueFieldMeta === "function" ? args.applyValueFieldMeta : () => { };
    const setInlineSwitchActiveThrowState = typeof args.setInlineSwitchActiveThrowState === "function"
      ? args.setInlineSwitchActiveThrowState
      : () => { };
    const positionInlineEditor = typeof args.positionInlineEditor === "function" ? args.positionInlineEditor : () => { };
    const resolveFocusTargetForComponent = typeof args.resolveFocusTargetForComponent === "function"
      ? args.resolveFocusTargetForComponent
      : () => "value";
    const applyInlineEditorOpenFocus = typeof args.applyInlineEditorOpenFocus === "function"
      ? args.applyInlineEditorOpenFocus
      : () => { };
    const prepareInlineEditorPanelForOpen = typeof args.prepareInlineEditorPanelForOpen === "function"
      ? args.prepareInlineEditorPanelForOpen
      : () => { };
    const closeInlineEditorPanel = typeof args.closeInlineEditorPanel === "function"
      ? args.closeInlineEditorPanel
      : () => { };
    const getFallbackComponent = typeof args.getFallbackComponent === "function" ? args.getFallbackComponent : () => null;
    const requestAnimationFrameFn = typeof args.requestAnimationFrameFn === "function" ? args.requestAnimationFrameFn : (cb) => cb();

    const canEditInlineInputs = () => {
      return !(getInlineSync() || !getEditingComponentId() || !getEditor());
    };
    const inlinePatchHelpers = createInlinePatchHelpers({
      canEdit: canEditInlineInputs,
      getEditingComponentId,
      getEditor
    });
    const applyInlinePatch = (patch) => inlinePatchHelpers.applyInlinePatch(patch);

    const setInlineSwitchActiveThrow = (activeThrow) => {
      setInlineSwitchActiveThrowState(activeThrow);
    };

    let syncInlineComponentEditor = () => { };
    const commitInlineSwitchState = (overrides, options) => {
      commitInlineSwitchStateForEditor({
        canCommit: canEditInlineInputs,
        getEditingComponentId,
        getModelComponent,
        isSwitchComponentType: (type) => {
          const normalized = String(type ?? "").toUpperCase();
          return normalized === "SW" || normalized === "SPST";
        },
        parseSpdtSwitchValueSafe,
        buildInlineSwitchState,
        readSwitchInputs: () => ({
          ron: panel.inlineSwitchRonInput?.value,
          roff: panel.inlineSwitchRoffInput?.value
        }),
        overrides,
        formatSpdtSwitchValue,
        updateComponent: (componentId, patch) => {
          const editor = getEditor();
          if (editor && typeof editor.updateComponent === "function") {
            editor.updateComponent(componentId, patch);
          }
        },
        options,
        onResync: (componentId) => {
          const updated = getModelComponent(componentId);
          if (updated) {
            syncInlineComponentEditor(updated);
          }
        }
      });
    };

    syncInlineComponentEditor = (component) => {
      syncInlineEditorFromComponent({
        component,
        isProbeType,
        supportsComponentValueField,
        getInlineModeFlags,
        panel,
        parseSpdtSwitchValueSafe,
        setInlineSwitchActiveThrow,
        inlineSelectSyncEntries,
        inlineToggleSyncEntries,
        inlineInputSyncEntries,
        parseBoxAnnotationStyle,
        parseArrowAnnotationStyle,
        parseTextAnnotationStyle,
        applyValueFieldMeta,
        onBeforeSync: () => setInlineSync(true),
        onAfterSync: () => setInlineSync(false),
        onPositionComponent: (nextComponent) => {
          requestAnimationFrameFn(() => positionInlineEditor(nextComponent));
        }
      });
    };

    const closeInlineComponentEditor = () => {
      closeInlineEditorPanel(() => {
        setEditingComponentId(null);
      });
    };

    const openInlineComponentEditor = (componentArg) => {
      openInlineEditorForComponent({
        componentArg,
        getFallbackComponent,
        setEditingComponentId,
        prepareInlineEditorPanelForOpen,
        syncInlineComponentEditor,
        requestAnimationFrameFn,
        getCurrentComponent: () => getModelComponent(getEditingComponentId()),
        positionInlineEditor,
        clearInlinePanelVisibility: () => {
          if (panel.inlineEditor && typeof panel.inlineEditor.style?.removeProperty === "function") {
            panel.inlineEditor.style.removeProperty("visibility");
          }
        },
        resolveFocusTargetForComponent,
        applyInlineEditorOpenFocus
      });
    };

    return {
      getModelComponent,
      buildProbeTypeUpdate,
      setInlineSwitchActiveThrow,
      commitInlineSwitchState,
      syncInlineComponentEditor,
      closeInlineComponentEditor,
      openInlineComponentEditor,
      canEditInlineInputs,
      applyInlinePatch
    };
  };

  if (typeof self !== "undefined") {
    self.SpjutSimUIInlineEditorWorkflow = {
      createGetModelComponent,
      applyValueFieldMetaToElements,
      updateSchematicPropsForInlineEditor,
      createInlineNetColorPickHandler,
      createInlinePatchHelpers,
      commitInlineSwitchStateForEditor,
      syncInlineEditorFromComponent,
      openInlineEditorForComponent,
      createInlineEditorHandlers
    };
  }
})();
