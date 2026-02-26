/** @typedef {\"idle\" | \"loading\" | \"ready\" | \"running\" | \"error\"} AppStatus */
/** @typedef {{ name: string, value: string }} ResultRow */
/** @typedef {{ plot?: string, nodes: ResultRow[], currents: ResultRow[] }} OpResults */
/** @typedef {Record<string, number[]>} TraceMap */
/** @typedef {{ x: number[], traces: TraceMap, signals?: string[], selected?: string[] }} DcResults */
/** @typedef {{ x: number[], traces: TraceMap, signals?: string[], selected?: string[] }} TranResults */
/** @typedef {{ freq: number[], magnitude: TraceMap, phase: TraceMap, signals?: string[], selected?: string[] }} AcResults */
/** @typedef {{ status: AppStatus, log: string[], netlist: string, error?: string, opResults?: OpResults, dcResults?: DcResults, tranResults?: TranResults, acResults?: AcResults }} AppState */

const DEFAULT_NETLIST = `* voltage divider
V1 in 0 10
R1 in out 10k
R2 out 0 10k
.op
.end
`;

/** @returns {AppState} */
function createState() {
  return {
    status: "idle",
    log: [],
    netlist: DEFAULT_NETLIST,
    opResults: { plot: "", nodes: [], currents: [] },
    dcResults: { x: [], traces: {}, signals: [], selected: [] },
    tranResults: { x: [], traces: {}, signals: [], selected: [] },
    acResults: { freq: [], magnitude: {}, phase: {}, signals: [], selected: [] }
  };
}

self.SpjutSimState = {
  DEFAULT_NETLIST,
  createState
};
