/**
 * UI inline editor positioning helpers.
 */
(function initUIInlineEditorPositioningModule() {
  const getComponentAnchor = (component) => {
    const pins = Array.isArray(component?.pins) ? component.pins : [];
    if (!pins.length) {
      return null;
    }
    const center = pins.reduce((acc, pin) => ({
      x: acc.x + pin.x,
      y: acc.y + pin.y
    }), { x: 0, y: 0 });
    return {
      x: center.x / pins.length,
      y: center.y / pins.length
    };
  };

  const toClientPoint = (svg, x, y) => {
    if (!svg) {
      return null;
    }
    const ctm = typeof svg.getScreenCTM === "function" ? svg.getScreenCTM() : null;
    if (!ctm) {
      return null;
    }
    if (typeof svg.createSVGPoint === "function") {
      const point = svg.createSVGPoint();
      point.x = x;
      point.y = y;
      const transformed = point.matrixTransform(ctm);
      return { x: transformed.x, y: transformed.y };
    }
    if (typeof DOMPoint === "function") {
      const transformed = new DOMPoint(x, y).matrixTransform(ctm);
      return { x: transformed.x, y: transformed.y };
    }
    return null;
  };

  const resolveInlineEditorPosition = (input) => {
    const args = input && typeof input === "object" ? input : {};
    const anchorClient = args.anchorClient;
    const workspaceRect = args.workspaceRect;
    const panelRect = args.panelRect;
    if (!anchorClient || !workspaceRect || !panelRect) {
      return null;
    }
    const workspaceWidth = Number(workspaceRect.width);
    const workspaceHeight = Number(workspaceRect.height);
    const panelWidth = Number(panelRect.width);
    const panelHeight = Number(panelRect.height);
    const workspaceLeft = Number(workspaceRect.left);
    const workspaceTop = Number(workspaceRect.top);
    const clientX = Number(anchorClient.x);
    const clientY = Number(anchorClient.y);
    if (!Number.isFinite(workspaceWidth)
      || !Number.isFinite(workspaceHeight)
      || !Number.isFinite(panelWidth)
      || !Number.isFinite(panelHeight)
      || !Number.isFinite(workspaceLeft)
      || !Number.isFinite(workspaceTop)
      || !Number.isFinite(clientX)
      || !Number.isFinite(clientY)
      || workspaceWidth <= 0
      || workspaceHeight <= 0
      || panelWidth <= 0
      || panelHeight <= 0) {
      return null;
    }
    const margin = Number.isFinite(Number(args.margin)) ? Number(args.margin) : 8;
    const offset = Number.isFinite(Number(args.offset)) ? Number(args.offset) : 16;
    const anchorX = clientX - workspaceLeft;
    const anchorY = clientY - workspaceTop;
    let left = anchorX + offset;
    let top = anchorY - (panelHeight / 2);
    if (left + panelWidth > workspaceWidth - margin) {
      left = anchorX - panelWidth - offset;
    }
    left = Math.max(margin, Math.min(left, workspaceWidth - panelWidth - margin));
    top = Math.max(margin, Math.min(top, workspaceHeight - panelHeight - margin));
    return { left, top };
  };

  if (typeof self !== "undefined") {
    self.SpjutSimUIInlineEditorPositioning = {
      getComponentAnchor,
      toClientPoint,
      resolveInlineEditorPosition
    };
  }
})();
