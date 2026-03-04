/**
 * UI inline editor input/change binding helpers.
 */
(function initUIInlineEditorBindingsModule() {
  const setInlineSwitchActiveThrowState = (input) => {
    const args = input && typeof input === "object" ? input : {};
    const inlineSwitchPositionA = args.inlineSwitchPositionA;
    const inlineSwitchPositionB = args.inlineSwitchPositionB;
    const activeThrow = String(args.activeThrow ?? "").trim().toUpperCase() === "B" ? "B" : "A";
    if (!inlineSwitchPositionA || !inlineSwitchPositionB) {
      return;
    }
    const isA = activeThrow === "A";
    inlineSwitchPositionA.setAttribute("aria-pressed", isA ? "true" : "false");
    inlineSwitchPositionB.setAttribute("aria-pressed", isA ? "false" : "true");
    inlineSwitchPositionA.classList.toggle("active", isA);
    inlineSwitchPositionB.classList.toggle("active", !isA);
  };

  const bindInlineNameInput = (input) => {
    const args = input && typeof input === "object" ? input : {};
    const target = args.input;
    const canEdit = typeof args.canEdit === "function" ? args.canEdit : () => false;
    const onUpdate = typeof args.onUpdate === "function" ? args.onUpdate : () => { };
    if (!target || typeof target.addEventListener !== "function") {
      return () => { };
    }
    const onInput = () => {
      if (!canEdit()) {
        return;
      }
      onUpdate(target.value);
    };
    target.addEventListener("input", onInput);
    return () => target.removeEventListener("input", onInput);
  };

  const bindInlineValueInput = (input) => {
    const args = input && typeof input === "object" ? input : {};
    const target = args.input;
    const canEdit = typeof args.canEdit === "function" ? args.canEdit : () => false;
    const onUpdate = typeof args.onUpdate === "function" ? args.onUpdate : () => { };
    if (!target || typeof target.addEventListener !== "function") {
      return () => { };
    }
    const onInput = () => {
      if (!canEdit()) {
        return;
      }
      onUpdate(target.value);
    };
    target.addEventListener("input", onInput);
    return () => target.removeEventListener("input", onInput);
  };

  const bindInlineSwitchInputs = (input) => {
    const args = input && typeof input === "object" ? input : {};
    const inlineSwitchPositionA = args.inlineSwitchPositionA;
    const inlineSwitchPositionB = args.inlineSwitchPositionB;
    const inlineSwitchRonInput = args.inlineSwitchRonInput;
    const inlineSwitchRoffInput = args.inlineSwitchRoffInput;
    const inlineSwitchShowRonInput = args.inlineSwitchShowRonInput;
    const inlineSwitchShowRoffInput = args.inlineSwitchShowRoffInput;
    const canEditSwitchThrow = typeof args.canEditSwitchThrow === "function" ? args.canEditSwitchThrow : () => true;
    const onSetActiveThrow = typeof args.onSetActiveThrow === "function" ? args.onSetActiveThrow : () => { };
    const onCommitSwitchState = typeof args.onCommitSwitchState === "function" ? args.onCommitSwitchState : () => { };
    const cleanups = [];

    if (inlineSwitchPositionA && typeof inlineSwitchPositionA.addEventListener === "function") {
      const onClickA = () => {
        if (!canEditSwitchThrow()) {
          return;
        }
        onSetActiveThrow("A");
        onCommitSwitchState({ activeThrow: "A" }, { resync: true });
      };
      inlineSwitchPositionA.addEventListener("click", onClickA);
      cleanups.push(() => inlineSwitchPositionA.removeEventListener("click", onClickA));
    }

    if (inlineSwitchPositionB && typeof inlineSwitchPositionB.addEventListener === "function") {
      const onClickB = () => {
        if (!canEditSwitchThrow()) {
          return;
        }
        onSetActiveThrow("B");
        onCommitSwitchState({ activeThrow: "B" }, { resync: true });
      };
      inlineSwitchPositionB.addEventListener("click", onClickB);
      cleanups.push(() => inlineSwitchPositionB.removeEventListener("click", onClickB));
    }

    if (inlineSwitchRonInput && typeof inlineSwitchRonInput.addEventListener === "function") {
      const onRonInput = () => onCommitSwitchState({ ron: inlineSwitchRonInput.value });
      inlineSwitchRonInput.addEventListener("input", onRonInput);
      cleanups.push(() => inlineSwitchRonInput.removeEventListener("input", onRonInput));
    }

    if (inlineSwitchRoffInput && typeof inlineSwitchRoffInput.addEventListener === "function") {
      const onRoffInput = () => onCommitSwitchState({ roff: inlineSwitchRoffInput.value });
      inlineSwitchRoffInput.addEventListener("input", onRoffInput);
      cleanups.push(() => inlineSwitchRoffInput.removeEventListener("input", onRoffInput));
    }

    if (inlineSwitchShowRonInput && typeof inlineSwitchShowRonInput.addEventListener === "function") {
      const onShowRonChange = () => onCommitSwitchState({ showRon: inlineSwitchShowRonInput.checked });
      inlineSwitchShowRonInput.addEventListener("change", onShowRonChange);
      cleanups.push(() => inlineSwitchShowRonInput.removeEventListener("change", onShowRonChange));
    }

    if (inlineSwitchShowRoffInput && typeof inlineSwitchShowRoffInput.addEventListener === "function") {
      const onShowRoffChange = () => onCommitSwitchState({ showRoff: inlineSwitchShowRoffInput.checked });
      inlineSwitchShowRoffInput.addEventListener("change", onShowRoffChange);
      cleanups.push(() => inlineSwitchShowRoffInput.removeEventListener("change", onShowRoffChange));
    }

    return () => cleanups.forEach((cleanup) => cleanup());
  };

  const bindInlineProbeTypeSelect = (input) => {
    const args = input && typeof input === "object" ? input : {};
    const inlineProbeTypeSelect = args.inlineProbeTypeSelect;
    const canEdit = typeof args.canEdit === "function" ? args.canEdit : () => false;
    const getCurrentComponent = typeof args.getCurrentComponent === "function" ? args.getCurrentComponent : () => null;
    const isProbeType = typeof args.isProbeType === "function" ? args.isProbeType : () => false;
    const buildProbeTypeUpdate = typeof args.buildProbeTypeUpdate === "function" ? args.buildProbeTypeUpdate : () => null;
    const onApplyProbeTypeUpdate = typeof args.onApplyProbeTypeUpdate === "function" ? args.onApplyProbeTypeUpdate : () => { };
    const getUpdatedComponent = typeof args.getUpdatedComponent === "function" ? args.getUpdatedComponent : () => null;
    const onResyncComponent = typeof args.onResyncComponent === "function" ? args.onResyncComponent : () => { };
    if (!inlineProbeTypeSelect || typeof inlineProbeTypeSelect.addEventListener !== "function") {
      return () => { };
    }
    const onChange = () => {
      if (!canEdit()) {
        return;
      }
      const component = getCurrentComponent();
      if (!component || !isProbeType(component.type)) {
        return;
      }
      const updates = buildProbeTypeUpdate(component, inlineProbeTypeSelect.value);
      if (!updates) {
        return;
      }
      onApplyProbeTypeUpdate(updates);
      const next = getUpdatedComponent();
      if (next) {
        onResyncComponent(next);
      }
    };
    inlineProbeTypeSelect.addEventListener("change", onChange);
    return () => inlineProbeTypeSelect.removeEventListener("change", onChange);
  };

  const bindInlineGroundVariantSelect = (input) => {
    const args = input && typeof input === "object" ? input : {};
    const inlineGroundVariantSelect = args.inlineGroundVariantSelect;
    const canEdit = typeof args.canEdit === "function" ? args.canEdit : () => false;
    const onPatch = typeof args.onPatch === "function" ? args.onPatch : () => { };
    if (!inlineGroundVariantSelect || typeof inlineGroundVariantSelect.addEventListener !== "function") {
      return () => { };
    }
    const onChange = () => {
      if (!canEdit()) {
        return;
      }
      onPatch({ groundVariant: inlineGroundVariantSelect.value });
    };
    inlineGroundVariantSelect.addEventListener("change", onChange);
    return () => inlineGroundVariantSelect.removeEventListener("change", onChange);
  };

  const bindInlineResistorStyleSelect = (input) => {
    const args = input && typeof input === "object" ? input : {};
    const inlineResistorStyleSelect = args.inlineResistorStyleSelect;
    const canEdit = typeof args.canEdit === "function" ? args.canEdit : () => false;
    const onPatch = typeof args.onPatch === "function" ? args.onPatch : () => { };
    if (!inlineResistorStyleSelect || typeof inlineResistorStyleSelect.addEventListener !== "function") {
      return () => { };
    }
    const onChange = () => {
      if (!canEdit()) {
        return;
      }
      onPatch({ resistorStyle: inlineResistorStyleSelect.value });
    };
    inlineResistorStyleSelect.addEventListener("change", onChange);
    return () => inlineResistorStyleSelect.removeEventListener("change", onChange);
  };

  const bindInlineBoxStyleInputs = (input) => {
    const args = input && typeof input === "object" ? input : {};
    const inlineBoxThicknessInput = args.inlineBoxThicknessInput;
    const inlineBoxLineTypeSelect = args.inlineBoxLineTypeSelect;
    const inlineBoxFillEnabledInput = args.inlineBoxFillEnabledInput;
    const inlineBoxFillColorInput = args.inlineBoxFillColorInput;
    const inlineBoxFillColorRow = args.inlineBoxFillColorRow;
    const inlineBoxOpacityInput = args.inlineBoxOpacityInput;
    const inlineBoxOpacityValue = args.inlineBoxOpacityValue;
    const canEdit = typeof args.canEdit === "function" ? args.canEdit : () => false;
    const onStyleChange = typeof args.onStyleChange === "function" ? args.onStyleChange : () => { };
    const cleanups = [];

    const clampOpacityPercent = (value) => {
      const parsed = Number.parseFloat(String(value ?? "").trim());
      if (!Number.isFinite(parsed)) {
        return 100;
      }
      const rounded = Math.round(parsed);
      return Math.max(0, Math.min(100, rounded));
    };

    const readStyle = () => ({
      thickness: inlineBoxThicknessInput?.value,
      lineType: inlineBoxLineTypeSelect?.value,
      fillEnabled: inlineBoxFillEnabledInput?.checked === true,
      fillColor: inlineBoxFillColorInput?.value,
      opacityPercent: clampOpacityPercent(inlineBoxOpacityInput?.value)
    });

    const syncFillColorRowVisibility = () => {
      if (!inlineBoxFillColorRow || typeof inlineBoxFillColorRow !== "object") {
        return;
      }
      inlineBoxFillColorRow.hidden = inlineBoxFillEnabledInput?.checked !== true;
    };

    const syncOpacityLabel = () => {
      if (!inlineBoxOpacityValue) {
        return;
      }
      inlineBoxOpacityValue.textContent = `${clampOpacityPercent(inlineBoxOpacityInput?.value)}%`;
    };

    const commitStyle = () => {
      if (!canEdit()) {
        return;
      }
      onStyleChange(readStyle());
    };

    const bind = (target, eventName, handler) => {
      if (!target || typeof target.addEventListener !== "function") {
        return;
      }
      target.addEventListener(eventName, handler);
      cleanups.push(() => target.removeEventListener(eventName, handler));
    };

    bind(inlineBoxThicknessInput, "input", commitStyle);
    bind(inlineBoxThicknessInput, "change", commitStyle);
    bind(inlineBoxLineTypeSelect, "change", commitStyle);
    bind(inlineBoxFillEnabledInput, "change", () => {
      syncFillColorRowVisibility();
      commitStyle();
    });
    bind(inlineBoxFillColorInput, "input", commitStyle);
    bind(inlineBoxFillColorInput, "change", commitStyle);
    bind(inlineBoxOpacityInput, "input", () => {
      syncOpacityLabel();
      commitStyle();
    });
    bind(inlineBoxOpacityInput, "change", () => {
      syncOpacityLabel();
      commitStyle();
    });

    syncFillColorRowVisibility();
    syncOpacityLabel();

    return () => cleanups.forEach((cleanup) => cleanup());
  };

  const bindInlineTextInputs = (input) => {
    const args = input && typeof input === "object" ? input : {};
    const inlineTextOnlyInput = args.inlineTextOnlyInput;
    const inlineTextFontSelect = args.inlineTextFontSelect;
    const inlineTextSizeInput = args.inlineTextSizeInput;
    const inlineTextBoldInput = args.inlineTextBoldInput;
    const inlineTextItalicInput = args.inlineTextItalicInput;
    const inlineTextUnderlineInput = args.inlineTextUnderlineInput;
    const canEdit = typeof args.canEdit === "function" ? args.canEdit : () => false;
    const onPatch = typeof args.onPatch === "function" ? args.onPatch : () => { };
    const cleanups = [];

    const bind = (target, eventName, factory) => {
      if (!target || typeof target.addEventListener !== "function") {
        return;
      }
      const handler = () => {
        if (!canEdit()) {
          return;
        }
        onPatch(factory());
      };
      target.addEventListener(eventName, handler);
      cleanups.push(() => target.removeEventListener(eventName, handler));
    };

    bind(inlineTextOnlyInput, "change", () => ({ textOnly: inlineTextOnlyInput.checked }));
    bind(inlineTextFontSelect, "change", () => ({ textFont: inlineTextFontSelect.value }));
    bind(inlineTextSizeInput, "input", () => ({ textSize: inlineTextSizeInput.value }));
    bind(inlineTextBoldInput, "change", () => ({ textBold: inlineTextBoldInput.checked }));
    bind(inlineTextItalicInput, "change", () => ({ textItalic: inlineTextItalicInput.checked }));
    bind(inlineTextUnderlineInput, "change", () => ({ textUnderline: inlineTextUnderlineInput.checked }));

    return () => cleanups.forEach((cleanup) => cleanup());
  };

  if (typeof self !== "undefined") {
    self.SpjutSimUIInlineEditorBindings = {
      setInlineSwitchActiveThrowState,
      bindInlineNameInput,
      bindInlineValueInput,
      bindInlineSwitchInputs,
      bindInlineProbeTypeSelect,
      bindInlineGroundVariantSelect,
      bindInlineResistorStyleSelect,
      bindInlineBoxStyleInputs,
      bindInlineTextInputs
    };
  }
})();
