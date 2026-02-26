/**
 * @typedef {{ id: string, type: string, value?: string, pins: { id: string, name: string, x: number, y: number }[] }} Component
 * @typedef {{ components: Component[], wires: { id: string, points: { x: number, y: number }[] }[] }} SchematicModel
 * @typedef {{ code: string, message: string, componentId?: string, pinId?: string }} ErcIssue
 * @typedef {{ errors: ErcIssue[], warnings: ErcIssue[] }} ErcReport
 */

(function initSchematicErc() {
  const isGroundPin = (component, pin) => {
    if (!component) {
      return false;
    }
    if (String(component.type).toUpperCase() === "GND") {
      return true;
    }
    const pinName = String(pin?.name ?? pin?.id ?? "").toLowerCase();
    return pinName === "0" || pinName === "gnd";
  };

  /**
   * @param {SchematicModel} model
   * @returns {ErcReport}
   */
  const runErc = (model) => {
    const api = typeof self !== "undefined" ? (self.SpjutSimSchematic ?? {}) : {};
    const buildNets = api.buildNets;
    const nets = typeof buildNets === "function" ? buildNets(model) : [];
    const components = model?.components ?? [];
    const componentMap = new Map(components.map((component) => [component.id, component]));
    const errors = [];
    const warnings = [];

    let hasGround = false;
    nets.forEach((net) => {
      if (net.pins.some((pin) => isGroundPin(componentMap.get(pin.componentId), pin))) {
        hasGround = true;
      }
    });

    if (!hasGround) {
      errors.push({
        code: "erc:missing-ground",
        message: "Missing ground reference."
      });
    }

    nets.forEach((net) => {
      if (!Array.isArray(net.pins) || net.pins.length !== 1) {
        return;
      }
      const pin = net.pins[0];
      const component = componentMap.get(pin.componentId);
      if (isGroundPin(component, pin)) {
        return;
      }
      warnings.push({
        code: "erc:unconnected-pin",
        message: "Unconnected pin.",
        componentId: pin.componentId,
        pinId: pin.pinId
      });
    });

    return { errors, warnings };
  };

  const api = typeof self !== "undefined" ? (self.SpjutSimSchematic ?? {}) : {};
  api.runErc = runErc;
  if (typeof self !== "undefined") {
    self.SpjutSimSchematic = api;
  }
})();
