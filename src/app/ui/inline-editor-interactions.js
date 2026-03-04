/**
 * UI inline editor interaction binding helpers.
 */
(function initUIInlineEditorInteractionsModule() {
  const bindInlineEditorCloseInteractions = (input) => {
    const args = input && typeof input === "object" ? input : {};
    const getInlineEditingComponentId = typeof args.getInlineEditingComponentId === "function"
      ? args.getInlineEditingComponentId
      : () => null;
    const closeInlineComponentEditor = typeof args.closeInlineComponentEditor === "function"
      ? args.closeInlineComponentEditor
      : () => { };
    const isCloseCommitKey = typeof args.isCloseCommitKey === "function"
      ? args.isCloseCommitKey
      : () => false;
    const inlineEditor = args.inlineEditor instanceof HTMLElement ? args.inlineEditor : null;
    const closeKeyTargets = Array.isArray(args.closeKeyTargets)
      ? args.closeKeyTargets.filter((target) => target && typeof target.addEventListener === "function")
      : [];
    const netColorSwatches = Array.isArray(args.netColorSwatches)
      ? args.netColorSwatches.filter((target) => target && typeof target.addEventListener === "function")
      : [];
    const defaultDocument = typeof document !== "undefined" ? document : null;
    const documentRoot = args.documentRoot && typeof args.documentRoot.addEventListener === "function"
      ? args.documentRoot
      : defaultDocument;

    const handleInlineEditorCloseKey = (event) => {
      if (!getInlineEditingComponentId()) {
        return;
      }
      if (!isCloseCommitKey(event?.key)) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      closeInlineComponentEditor();
    };

    closeKeyTargets.forEach((target) => {
      target.addEventListener("keydown", handleInlineEditorCloseKey);
    });
    netColorSwatches.forEach((target) => {
      target.addEventListener("keydown", handleInlineEditorCloseKey);
    });

    const handleDocumentPointerDown = (event) => {
      if (!getInlineEditingComponentId()) {
        return;
      }
      if (inlineEditor && inlineEditor.contains(event.target)) {
        return;
      }
      closeInlineComponentEditor();
    };

    if (documentRoot) {
      documentRoot.addEventListener("pointerdown", handleDocumentPointerDown, true);
    }

    return () => {
      closeKeyTargets.forEach((target) => {
        target.removeEventListener("keydown", handleInlineEditorCloseKey);
      });
      netColorSwatches.forEach((target) => {
        target.removeEventListener("keydown", handleInlineEditorCloseKey);
      });
      if (documentRoot) {
        documentRoot.removeEventListener("pointerdown", handleDocumentPointerDown, true);
      }
    };
  };

  if (typeof self !== "undefined") {
    self.SpjutSimUIInlineEditorInteractions = {
      bindInlineEditorCloseInteractions
    };
  }
})();
