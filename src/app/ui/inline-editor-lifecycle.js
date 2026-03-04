/**
 * UI inline editor lifecycle helpers.
 */
(function initUIInlineEditorLifecycleModule() {
  const closeInlineEditorPanel = (input) => {
    const args = input && typeof input === "object" ? input : {};
    const inlineEditor = args.inlineEditor;
    if (!(inlineEditor instanceof HTMLElement)) {
      return;
    }
    if (typeof args.onClosed === "function") {
      args.onClosed();
    }
    inlineEditor.style.removeProperty("visibility");
    inlineEditor.hidden = true;
    inlineEditor.classList.add("hidden");
  };

  const prepareInlineEditorPanelForOpen = (input) => {
    const args = input && typeof input === "object" ? input : {};
    const inlineEditor = args.inlineEditor;
    if (!(inlineEditor instanceof HTMLElement)) {
      return;
    }
    inlineEditor.hidden = false;
    inlineEditor.classList.remove("hidden");
    inlineEditor.style.visibility = "hidden";
  };

  const resolveActiveSwitchToggle = (input) => {
    const args = input && typeof input === "object" ? input : {};
    const inlineSwitchPositionA = args.inlineSwitchPositionA;
    const inlineSwitchPositionB = args.inlineSwitchPositionB;
    if (!inlineSwitchPositionA || !inlineSwitchPositionB) {
      return null;
    }
    return inlineSwitchPositionA.getAttribute("aria-pressed") === "true"
      ? inlineSwitchPositionA
      : inlineSwitchPositionB;
  };

  const applyInlineEditorOpenFocus = (input) => {
    const args = input && typeof input === "object" ? input : {};
    const focusTarget = String(args.focusTarget ?? "").trim().toLowerCase();
    const inlineNameInput = args.inlineNameInput;
    const inlineValueInput = args.inlineValueInput;
    const inlineStyleInput = args.inlineStyleInput;
    if (focusTarget === "style") {
      if (inlineStyleInput && typeof inlineStyleInput.focus === "function") {
        inlineStyleInput.focus();
      }
      if (inlineStyleInput && typeof inlineStyleInput.select === "function") {
        inlineStyleInput.select();
      }
      return;
    }
    if (focusTarget === "name") {
      if (inlineNameInput && typeof inlineNameInput.focus === "function") {
        inlineNameInput.focus();
      }
      if (inlineNameInput && typeof inlineNameInput.select === "function") {
        inlineNameInput.select();
      }
      return;
    }
    if (focusTarget === "switch") {
      const target = resolveActiveSwitchToggle(args);
      if (target && typeof target.focus === "function") {
        target.focus();
      }
      return;
    }
    if (inlineValueInput && typeof inlineValueInput.focus === "function") {
      inlineValueInput.focus();
    }
    if (inlineValueInput && typeof inlineValueInput.select === "function") {
      inlineValueInput.select();
    }
  };

  if (typeof self !== "undefined") {
    self.SpjutSimUIInlineEditorLifecycle = {
      closeInlineEditorPanel,
      prepareInlineEditorPanelForOpen,
      resolveActiveSwitchToggle,
      applyInlineEditorOpenFocus
    };
  }
})();
