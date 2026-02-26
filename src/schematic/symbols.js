/**
 * @typedef {{ id: string, name: string, x: number, y: number }} SymbolPin
 * @typedef {{ type: string, label: string, pins: SymbolPin[] }} SymbolDef
 */

(function initSchematicSymbols() {
  const SYMBOLS = {
    R: {
      type: "R",
      label: "Resistor",
      pins: [
        { id: "1", name: "1", x: -20, y: 0 },
        { id: "2", name: "2", x: 20, y: 0 }
      ]
    },
    C: {
      type: "C",
      label: "Capacitor",
      pins: [
        { id: "1", name: "1", x: -20, y: 0 },
        { id: "2", name: "2", x: 20, y: 0 }
      ]
    },
    L: {
      type: "L",
      label: "Inductor",
      pins: [
        { id: "1", name: "1", x: -20, y: 0 },
        { id: "2", name: "2", x: 20, y: 0 }
      ]
    },
    V: {
      type: "V",
      label: "Voltage Source",
      pins: [
        { id: "+", name: "+", x: 0, y: -20 },
        { id: "-", name: "-", x: 0, y: 20 }
      ]
    },
    I: {
      type: "I",
      label: "Current Source",
      pins: [
        { id: "+", name: "+", x: 0, y: -20 },
        { id: "-", name: "-", x: 0, y: 20 }
      ]
    },
    SW: {
      type: "SW",
      label: "3-Way Switch",
      pins: [
        { id: "C", name: "C", x: -20, y: 0 },
        { id: "A", name: "A", x: 20, y: -10 },
        { id: "B", name: "B", x: 20, y: 10 }
      ]
    },
    VM: {
      type: "VM",
      label: "Voltmeter",
      pins: [
        { id: "1", name: "1", x: -20, y: 0 },
        { id: "2", name: "2", x: 20, y: 0 }
      ]
    },
    AM: {
      type: "AM",
      label: "Ammeter",
      pins: [
        { id: "1", name: "1", x: -20, y: 0 },
        { id: "2", name: "2", x: 20, y: 0 }
      ]
    },
    PV: {
      type: "PV",
      label: "Voltage Probe",
      pins: [
        { id: "P", name: "P", x: 0, y: 0 }
      ]
    },
    PI: {
      type: "PI",
      label: "Current Probe",
      pins: [
        { id: "P", name: "P", x: 0, y: 0 }
      ]
    },
    PD: {
      type: "PD",
      label: "Differential Probe",
      pins: [
        { id: "P+", name: "P+", x: 0, y: 0 },
        { id: "P-", name: "P-", x: 20, y: 0 }
      ]
    },
    PP: {
      type: "PP",
      label: "Power Probe",
      pins: [
        { id: "P", name: "P", x: 0, y: 0 }
      ]
    },
    GND: {
      type: "GND",
      label: "Ground",
      pins: [
        { id: "0", name: "0", x: 0, y: 0 }
      ]
    },
    NET: {
      type: "NET",
      label: "Named Node",
      pins: [
        { id: "1", name: "1", x: 0, y: 0 }
      ]
    },
    TEXT: {
      type: "TEXT",
      label: "Text",
      pins: [
        { id: "A", name: "A", x: 0, y: 0 }
      ]
    }
  };

  const cloneSymbol = (symbol) => ({
    type: symbol.type,
    label: symbol.label,
    pins: symbol.pins.map((pin) => ({
      id: pin.id,
      name: pin.name,
      x: pin.x,
      y: pin.y
    }))
  });

  const getSymbol = (type) => {
    const key = String(type || "").toUpperCase();
    const symbol = SYMBOLS[key];
    return symbol ? cloneSymbol(symbol) : null;
  };

  const listSymbols = () => Object.keys(SYMBOLS);

  const createComponentFromSymbol = (type, id, value, x, y) => {
    const symbol = getSymbol(type);
    if (!symbol) {
      return null;
    }
    const baseX = Number.isFinite(x) ? x : 0;
    const baseY = Number.isFinite(y) ? y : 0;
    const hasValue = value !== undefined && value !== null;
    const resolvedValue = hasValue
      ? String(value)
      : (symbol.type === "SW" ? "A" : "");
    return {
      id: String(id ?? ""),
      name: symbol.type === "TEXT"
        ? "Text"
        : String(id ?? ""),
      type: symbol.type,
      value: resolvedValue,
      rotation: 0,
      pins: symbol.pins.map((pin) => ({
        id: pin.id,
        name: pin.name,
        x: baseX + pin.x,
        y: baseY + pin.y
      }))
    };
  };

  const api = typeof self !== "undefined" ? (self.SpjutSimSchematic ?? {}) : {};
  api.getSymbol = getSymbol;
  api.listSymbols = listSymbols;
  api.createComponentFromSymbol = createComponentFromSymbol;
  if (typeof self !== "undefined") {
    self.SpjutSimSchematic = api;
  }
})();
