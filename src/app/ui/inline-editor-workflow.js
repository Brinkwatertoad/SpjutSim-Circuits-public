/**
 * UI inline editor workflow/orchestration helpers.
 */
(function initUIInlineEditorWorkflowModule() {
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
    const getValueFieldMeta = typeof args.getValueFieldMeta === "function" ? args.getValueFieldMeta : () => ({ label: "Value", unit: "" });
    const meta = getValueFieldMeta(args.type);
    if (args.labelEl) {
      args.labelEl.textContent = `${String(meta?.label ?? "Value")}:`;
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
      : (type) => String(type ?? "").toUpperCase() === "SW";
    if (!isSwitchComponentType(component?.type)) {
      return;
    }
    const parseSpdtSwitchValueSafe = typeof args.parseSpdtSwitchValueSafe === "function" ? args.parseSpdtSwitchValueSafe : () => null;
    const buildInlineSwitchState = typeof args.buildInlineSwitchState === "function" ? args.buildInlineSwitchState : () => null;
    const formatSpdtSwitchValue = typeof args.formatSpdtSwitchValue === "function" ? args.formatSpdtSwitchValue : () => "";
    const readSwitchInputs = typeof args.readSwitchInputs === "function" ? args.readSwitchInputs : () => ({ ron: "", roff: "", showRon: false, showRoff: false });
    const updateComponent = typeof args.updateComponent === "function" ? args.updateComponent : () => { };
    const onResync = typeof args.onResync === "function" ? args.onResync : () => { };
    const parsed = parseSpdtSwitchValueSafe(component.value);
    const switchInputs = readSwitchInputs();
    const overrides = args.overrides && typeof args.overrides === "object" ? args.overrides : {};
    const nextState = buildInlineSwitchState({
      baseState: parsed,
      overrides,
      ronInput: switchInputs.ron,
      roffInput: switchInputs.roff,
      showRonChecked: switchInputs.showRon,
      showRoffChecked: switchInputs.showRoff
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
    const normalizeGroundVariantValue = typeof args.normalizeGroundVariantValue === "function"
      ? args.normalizeGroundVariantValue
      : (value) => String(value ?? "").trim().toLowerCase() || "earth";
    const normalizeResistorStyleValue = typeof args.normalizeResistorStyleValue === "function"
      ? args.normalizeResistorStyleValue
      : (value) => String(value ?? "").trim().toLowerCase() || "zigzag";
    const parseBoxAnnotationStyle = typeof args.parseBoxAnnotationStyle === "function"
      ? args.parseBoxAnnotationStyle
      : () => ({
        thickness: 2,
        lineType: "solid",
        fillEnabled: false,
        fillColor: "#d8d1c6",
        opacityPercent: 100
      });
    const parseArrowAnnotationStyle = typeof args.parseArrowAnnotationStyle === "function"
      ? args.parseArrowAnnotationStyle
      : () => ({
        thickness: 2,
        lineType: "solid",
        opacityPercent: 100
      });
    const parseTextAnnotationStyle = typeof args.parseTextAnnotationStyle === "function"
      ? args.parseTextAnnotationStyle
      : () => ({
        opacityPercent: 100
      });
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
    panel.inlineValueInput.value = inlineModeFlags.supportsValueField ? String(component.value ?? "") : "";
    panel.inlineValueRow.hidden = !inlineModeFlags.showValueRow;
    panel.inlineValueInput.disabled = !inlineModeFlags.showValueRow;
    const isGroundComponent = type === "GND";
    panel.inlineGroundVariantRow.hidden = !isGroundComponent;
    if (isGroundComponent) {
      panel.inlineGroundVariantSelect.value = normalizeGroundVariantValue(component.groundVariant);
    }
    const isResistorComponent = type === "R";
    panel.inlineResistorStyleRow.hidden = !isResistorComponent;
    if (isResistorComponent) {
      panel.inlineResistorStyleSelect.value = normalizeResistorStyleValue(component.resistorStyle);
    }
    const isBoxComponent = inlineModeFlags.isBoxAnnotation === true;
    const isArrowComponent = type === "ARR";
    const isTextComponent = inlineModeFlags.isTextAnnotation === true;
    setRowHidden(panel.inlineNameRow, isBoxComponent || isArrowComponent);
    const boxStyle = isBoxComponent
      ? parseBoxAnnotationStyle(component.value, {
        type,
        defaultLineType: type === "DBOX" ? "dashed" : "solid"
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
    panel.inlineSwitchShowRonRow.hidden = !inlineModeFlags.isSwitchComponent;
    panel.inlineSwitchShowRoffRow.hidden = !inlineModeFlags.isSwitchComponent;

    const parseSpdtSwitchValueSafe = typeof args.parseSpdtSwitchValueSafe === "function" ? args.parseSpdtSwitchValueSafe : () => null;
    const setInlineSwitchActiveThrow = typeof args.setInlineSwitchActiveThrow === "function" ? args.setInlineSwitchActiveThrow : () => { };
    if (inlineModeFlags.isSwitchComponent) {
      const switchValue = parseSpdtSwitchValueSafe(component.value);
      setInlineSwitchActiveThrow(switchValue?.activeThrow);
      panel.inlineSwitchRonInput.value = String(switchValue?.ron ?? "0");
      panel.inlineSwitchRoffInput.value = String(switchValue?.roff ?? "");
      panel.inlineSwitchShowRonInput.checked = switchValue?.showRon === true;
      panel.inlineSwitchShowRoffInput.checked = switchValue?.showRoff === true;
    }

    panel.inlineNetColorPicker.row.hidden = false;
    if (typeof panel.inlineNetColorPicker.setSelected === "function") {
      panel.inlineNetColorPicker.setSelected(component.netColor ?? "");
    }
    panel.inlineTextOnlyRow.hidden = !inlineModeFlags.isNamedNode;
    panel.inlineTextOnlyInput.checked = inlineModeFlags.isNamedNode && component.textOnly === true;
    panel.inlineTextFontRow.hidden = !inlineModeFlags.isTextAnnotation;
    panel.inlineTextSizeRow.hidden = !inlineModeFlags.isTextAnnotation;
    panel.inlineTextBoldRow.hidden = !inlineModeFlags.isTextAnnotation;
    panel.inlineTextItalicRow.hidden = !inlineModeFlags.isTextAnnotation;
    panel.inlineTextUnderlineRow.hidden = !inlineModeFlags.isTextAnnotation;

    const normalizeTextFontValue = typeof args.normalizeTextFontValue === "function" ? args.normalizeTextFontValue : (value) => String(value ?? "");
    const normalizeTextSizeValue = typeof args.normalizeTextSizeValue === "function" ? args.normalizeTextSizeValue : (value) => Number(value);
    panel.inlineTextFontSelect.value = normalizeTextFontValue(component.textFont);
    panel.inlineTextSizeInput.value = String(normalizeTextSizeValue(component.textSize));
    panel.inlineTextBoldInput.checked = inlineModeFlags.isTextAnnotation && component.textBold === true;
    panel.inlineTextItalicInput.checked = inlineModeFlags.isTextAnnotation && component.textItalic === true;
    panel.inlineTextUnderlineInput.checked = inlineModeFlags.isTextAnnotation && component.textUnderline === true;

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
    const findNearestProbeTargetComponentId = typeof args.findNearestProbeTargetComponentId === "function"
      ? args.findNearestProbeTargetComponentId
      : () => "";
    const buildProbeTypeUpdateFromDomain = typeof args.buildProbeTypeUpdateFromDomain === "function"
      ? args.buildProbeTypeUpdateFromDomain
      : () => null;
    const isProbeType = typeof args.isProbeType === "function" ? args.isProbeType : () => false;
    const parseSpdtSwitchValueSafe = typeof args.parseSpdtSwitchValueSafe === "function" ? args.parseSpdtSwitchValueSafe : () => null;
    const buildInlineSwitchState = typeof args.buildInlineSwitchState === "function" ? args.buildInlineSwitchState : () => null;
    const formatSpdtSwitchValue = typeof args.formatSpdtSwitchValue === "function" ? args.formatSpdtSwitchValue : () => "";
    const getInlineModeFlags = typeof args.getInlineModeFlags === "function" ? args.getInlineModeFlags : () => ({});
    const supportsComponentValueField = typeof args.supportsComponentValueField === "function" ? args.supportsComponentValueField : () => false;
    const normalizeTextFontValue = typeof args.normalizeTextFontValue === "function" ? args.normalizeTextFontValue : (value) => value;
    const normalizeTextSizeValue = typeof args.normalizeTextSizeValue === "function" ? args.normalizeTextSizeValue : (value) => value;
    const normalizeGroundVariantValue = typeof args.normalizeGroundVariantValue === "function"
      ? args.normalizeGroundVariantValue
      : (value) => String(value ?? "").trim().toLowerCase() || "earth";
    const normalizeResistorStyleValue = typeof args.normalizeResistorStyleValue === "function"
      ? args.normalizeResistorStyleValue
      : (value) => String(value ?? "").trim().toLowerCase() || "zigzag";
    const parseBoxAnnotationStyle = typeof args.parseBoxAnnotationStyle === "function"
      ? args.parseBoxAnnotationStyle
      : () => ({
        thickness: 2,
        lineType: "solid",
        fillEnabled: false,
        fillColor: "#d8d1c6",
        opacityPercent: 100
      });
    const parseArrowAnnotationStyle = typeof args.parseArrowAnnotationStyle === "function"
      ? args.parseArrowAnnotationStyle
      : () => ({
        thickness: 2,
        lineType: "solid",
        opacityPercent: 100
      });
    const parseTextAnnotationStyle = typeof args.parseTextAnnotationStyle === "function"
      ? args.parseTextAnnotationStyle
      : () => ({
        opacityPercent: 100
      });
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

    const resolveProbeTargetComponentIdAtPin = (probeComponent, probePin) => {
      const editor = getEditor();
      if (!editor || typeof editor.getModel !== "function" || !probePin) {
        return "";
      }
      const components = Array.isArray(editor.getModel()?.components) ? editor.getModel().components : [];
      return findNearestProbeTargetComponentId({
        probeComponent,
        probePin,
        components,
        isProbeComponentType: (type) => isProbeType(type)
      });
    };

    const buildProbeTypeUpdate = (component, nextTypeRaw) => buildProbeTypeUpdateFromDomain({
      component,
      nextType: nextTypeRaw,
      resolveTargetComponentId: (probeComponent, probePin) =>
        resolveProbeTargetComponentIdAtPin(probeComponent, probePin)
    });

    const setInlineSwitchActiveThrow = (activeThrow) => {
      setInlineSwitchActiveThrowState(activeThrow);
    };

    let syncInlineComponentEditor = () => { };
    const commitInlineSwitchState = (overrides, options) => {
      commitInlineSwitchStateForEditor({
        canCommit: canEditInlineInputs,
        getEditingComponentId,
        getModelComponent,
        isSwitchComponentType: (type) => String(type ?? "").toUpperCase() === "SW",
        parseSpdtSwitchValueSafe,
        buildInlineSwitchState,
        readSwitchInputs: () => ({
          ron: panel.inlineSwitchRonInput?.value,
          roff: panel.inlineSwitchRoffInput?.value,
          showRon: panel.inlineSwitchShowRonInput?.checked === true,
          showRoff: panel.inlineSwitchShowRoffInput?.checked === true
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
        normalizeTextFontValue,
        normalizeTextSizeValue,
        normalizeGroundVariantValue,
        normalizeResistorStyleValue,
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
