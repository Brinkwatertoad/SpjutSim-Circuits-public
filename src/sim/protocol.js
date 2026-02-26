/** @typedef {"op" | "dc" | "tran" | "ac"} SimKind */
/** @typedef {{ id?: string }} RequestMeta */
/** @typedef {{ type: "init" } & RequestMeta} InitRequest */
/** @typedef {{ type: "run", kind: SimKind, netlist: string, signals?: string[] } & RequestMeta} RunRequest */
/** @typedef {{ type: "reset" } & RequestMeta} ResetRequest */
/** @typedef {InitRequest | RunRequest | ResetRequest} SimRequest */
/** @typedef {{ id?: string, kind?: SimKind }} ResponseMeta */
/** @typedef {{ type: "ready" } & ResponseMeta} ReadyMessage */
/** @typedef {{ type: "log", text: string } & ResponseMeta} LogMessage */
/** @typedef {{ real: number, imag: number }} ComplexValue */
/** @typedef {number | ComplexValue | null} ScalarValue */
/** @typedef {{ name: string, value: ScalarValue }} OpVector */
/** @typedef {{ plot?: string, nodes: OpVector[], currents: OpVector[] }} OpResult */
/** @typedef {{ plot?: string, x: number[], traces: Record<string, number[]>, signals?: string[], selected?: string[] }} DcResult */
/** @typedef {{ plot?: string, x: number[], traces: Record<string, number[]>, signals?: string[], selected?: string[] }} TranResult */
/** @typedef {{ plot?: string, freq: number[], magnitude: Record<string, number[]>, phase: Record<string, number[]>, signals?: string[], selected?: string[] }} AcResult */
/** @typedef {{ type: "result", kind: SimKind, data?: unknown } & ResponseMeta} ResultMessage */
/** @typedef {{ type: "error", message: string, log?: string } & ResponseMeta} ErrorMessage */
/** @typedef {ReadyMessage | LogMessage | ResultMessage | ErrorMessage} SimResponse */

export {};
