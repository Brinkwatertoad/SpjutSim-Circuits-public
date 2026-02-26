/** @typedef {{ cwrap?: (name: string, returnType: string | null, argTypes: string[]) => (...args: unknown[]) => number, ccall?: (name: string, returnType: string | null, argTypes: string[], args: unknown[]) => number, locateFile?: (path: string, prefix: string) => string, noInitialRun?: boolean, onRuntimeInitialized?: () => void, print?: (text: string) => void, printErr?: (text: string) => void, HEAPU8?: Uint8Array, HEAPU16?: Uint16Array, HEAPU32?: Uint32Array, HEAPF64?: Float64Array, _malloc?: (size: number) => number, _free?: (ptr: number) => void, FS?: { writeFile: (path: string, data: string | Uint8Array) => void } }} NgspiceModule */
/** @typedef {(options: { print?: (text: string) => void, printErr?: (text: string) => void }) => Promise<NgspiceModule>} NgspiceFactory */

const SPICE_BASE = (() => {
  if (typeof self !== "undefined" && typeof self.SpjutSimSpiceBase === "string" && self.SpjutSimSpiceBase) {
    return self.SpjutSimSpiceBase.replace(/\/$/, "");
  }
  if (typeof self === "undefined" || !self.location) {
    return "/public/spice";
  }
  try {
    const url = new URL("../../public/spice/", self.location.href);
    return url.href.replace(/\/$/, "");
  } catch {
    return "/public/spice";
  }
})();
const textDecoder = new TextDecoder("utf-8");
const textEncoder = new TextEncoder();

/** @type {NgspiceModule | null} */
let moduleInstance = null;
/** @type {((command: string) => number) | null} */
let commandFn = null;
/** @type {((ptr: number) => number) | null} */
let circFn = null;
/** @type {((...args: number[]) => number) | null} */
let initFn = null;
/** @type {(() => number) | null} */
let curPlotFn = null;
/** @type {((plotName: string) => number) | null} */
let allVecsFn = null;
/** @type {(() => number) | null} */
let allPlotsFn = null;
/** @type {((vecName: string) => number) | null} */
let vecInfoFn = null;
/** @type {string[]} */
let logLines = [];
const bridgeCtx = typeof self !== "undefined" ? self : globalThis;

function decodeBase64(base64) {
  if (typeof atob === "function") {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index);
    }
    return bytes;
  }
  if (typeof Buffer !== "undefined") {
    return Uint8Array.from(Buffer.from(base64, "base64"));
  }
  return null;
}

/**
 * @param {{ ngspiceWasmBytes?: Uint8Array, ngspiceWasmBase64?: string, importScripts: (...urls: string[]) => void }} anyCtx
 */
function tryImportInline(anyCtx) {
  if (anyCtx.ngspiceWasmBytes || anyCtx.ngspiceWasmBase64) {
    return;
  }
  try {
    anyCtx.importScripts(`${SPICE_BASE}/ngspice-inline.js`);
  } catch {
  }
}

/**
 * @param {{ ngspiceWasmBytes?: Uint8Array, ngspiceWasmBase64?: string }} anyCtx
 * @returns {Uint8Array | null}
 */
function getEmbeddedWasmBytes(anyCtx) {
  if (anyCtx.ngspiceWasmBytes instanceof Uint8Array) {
    return anyCtx.ngspiceWasmBytes;
  }
  if (typeof anyCtx.ngspiceWasmBase64 === "string" && anyCtx.ngspiceWasmBase64.length) {
    const decoded = decodeBase64(anyCtx.ngspiceWasmBase64);
    if (decoded) {
      anyCtx.ngspiceWasmBytes = decoded;
      return decoded;
    }
  }
  return null;
}

/** @param {string} message */
function postLog(message) {
  if (bridgeCtx && typeof bridgeCtx.postMessage === "function") {
    bridgeCtx.postMessage({ type: "log", text: message });
  }
}

/** @param {string} text */
function handlePrint(text) {
  if (text.trim().length === 0) {
    return;
  }
  logLines.push(text);
}

/** @param {NgspiceModule} module */
function resolveCommand(module) {
  const exportFn = module._ngSpice_Command ?? (typeof bridgeCtx._ngSpice_Command === "function" ? bridgeCtx._ngSpice_Command : null);
  if (!exportFn) {
    return null;
  }
  if (typeof module.cwrap === "function") {
    return module.cwrap("ngSpice_Command", "number", ["string"]);
  }
  const ccallFn = module.ccall ?? (typeof bridgeCtx.ccall === "function" ? bridgeCtx.ccall : null);
  if (typeof ccallFn === "function") {
    return (command) => ccallFn("ngSpice_Command", "number", ["string"], [command]) ?? -1;
  }
  return null;
}

/**
 * @param {NgspiceModule} module
 * @param {string} name
 * @param {string | null} returnType
 * @param {string[]} argTypes
 */
function resolveExport(module, name, returnType, argTypes) {
  if (!module) {
    return null;
  }
  const exportName = `_${name}`;
  const exportFn = module[exportName] ?? (typeof bridgeCtx[exportName] === "function" ? bridgeCtx[exportName] : null);
  if (!exportFn) {
    return null;
  }
  if (typeof module.cwrap === "function") {
    return module.cwrap(name, returnType, argTypes);
  }
  const ccallFn = module.ccall ?? (typeof bridgeCtx.ccall === "function" ? bridgeCtx.ccall : null);
  if (typeof ccallFn === "function") {
    return (...args) => ccallFn(name, returnType, argTypes, args);
  }
  return (...args) => exportFn(...args);
}

/** @param {number} ptr */
function readCString(ptr) {
  if (!moduleInstance || !ptr) {
    return "";
  }
  if (typeof moduleInstance.UTF8ToString === "function") {
    return moduleInstance.UTF8ToString(ptr);
  }
  if (!moduleInstance.HEAPU8) {
    return "";
  }
  const heap = moduleInstance.HEAPU8;
  let end = ptr;
  while (heap[end] !== 0) {
    end += 1;
  }
  return textDecoder.decode(heap.subarray(ptr, end));
}

/** @param {number} ptr */
function readU32(ptr) {
  if (!moduleInstance || !ptr) {
    return 0;
  }
  if (moduleInstance.HEAPU32) {
    return moduleInstance.HEAPU32[ptr >>> 2];
  }
  if (typeof moduleInstance.getValue === "function") {
    return moduleInstance.getValue(ptr, "i32") >>> 0;
  }
  return 0;
}

/** @param {number} ptr */
function readU16(ptr) {
  if (!moduleInstance || !ptr) {
    return 0;
  }
  if (moduleInstance.HEAPU16) {
    return moduleInstance.HEAPU16[ptr >>> 1];
  }
  if (typeof moduleInstance.getValue === "function") {
    return moduleInstance.getValue(ptr, "i16") & 0xffff;
  }
  return 0;
}

/** @param {number} ptr */
function readF64(ptr) {
  if (!moduleInstance || !ptr) {
    return 0;
  }
  if (moduleInstance.HEAPF64) {
    return moduleInstance.HEAPF64[ptr >>> 3];
  }
  if (typeof moduleInstance.getValue === "function") {
    return moduleInstance.getValue(ptr, "double");
  }
  return 0;
}

/**
 * @param {number} ptr
 * @param {number} value
 */
function writeU32(ptr, value) {
  if (!moduleInstance || !ptr) {
    return false;
  }
  if (moduleInstance.HEAPU32) {
    moduleInstance.HEAPU32[ptr >>> 2] = value;
    return true;
  }
  if (typeof moduleInstance.setValue === "function") {
    moduleInstance.setValue(ptr, value, "i32");
    return true;
  }
  return false;
}

/** @param {number} ptr */
function readCStringArray(ptr) {
  if (!moduleInstance || !ptr) {
    return [];
  }
  const values = [];
  for (let index = 0; index < 4096; index += 1) {
    const entryPtr = readU32(ptr + index * 4);
    if (!entryPtr) {
      break;
    }
    values.push(readCString(entryPtr));
  }
  return values;
}

/** @param {string} netlist */
function splitNetlistLines(netlist) {
  return netlist.replace(/\r\n/g, "\n").split("\n");
}

/** @param {string} text */
function allocateCString(text) {
  if (!moduleInstance?._malloc || !moduleInstance.HEAPU8) {
    return 0;
  }
  const encoded = textEncoder.encode(`${text}\0`);
  const ptr = moduleInstance._malloc(encoded.length);
  if (!ptr) {
    return 0;
  }
  moduleInstance.HEAPU8.set(encoded, ptr);
  return ptr;
}

/**
 * @param {string[]} lines
 * @returns {{ arrayPtr: number, linePtrs: number[] } | null}
 */
function allocateNetlistArray(lines) {
  if (!moduleInstance?._malloc || !moduleInstance.HEAPU32) {
    return null;
  }
  const linePtrs = [];
  for (const line of lines) {
    const ptr = allocateCString(line);
    if (!ptr) {
      freeNetlistArray(0, linePtrs);
      return null;
    }
    linePtrs.push(ptr);
  }
  const arrayPtr = moduleInstance._malloc((linePtrs.length + 1) * 4);
  if (!arrayPtr) {
    freeNetlistArray(0, linePtrs);
    return null;
  }
  const base = arrayPtr >>> 2;
  for (let index = 0; index < linePtrs.length; index += 1) {
    moduleInstance.HEAPU32[base + index] = linePtrs[index];
  }
  moduleInstance.HEAPU32[base + linePtrs.length] = 0;
  return { arrayPtr, linePtrs };
}

/**
 * @param {number} arrayPtr
 * @param {number[]} linePtrs
 */
function freeNetlistArray(arrayPtr, linePtrs) {
  if (!moduleInstance?._free) {
    return;
  }
  linePtrs.forEach((ptr) => {
    if (ptr) {
      moduleInstance._free(ptr);
    }
  });
  if (arrayPtr) {
    moduleInstance._free(arrayPtr);
  }
}

/**
 * @param {string} netlist
 * @returns {number | null}
 */
function tryLoadNetlistWithCirc(netlist) {
  if (!moduleInstance || !circFn) {
    return null;
  }
  if (!moduleInstance._malloc || !moduleInstance._free || !moduleInstance.HEAPU8 || !moduleInstance.HEAPU32) {
    return null;
  }
  const lines = splitNetlistLines(netlist);
  const allocation = allocateNetlistArray(lines);
  if (!allocation) {
    return null;
  }
  try {
    return circFn(allocation.arrayPtr);
  } finally {
    freeNetlistArray(allocation.arrayPtr, allocation.linePtrs);
  }
}

/** @param {number} ptr */
function readVectorInfo(ptr) {
  if (!moduleInstance || !ptr) {
    return null;
  }
  const namePtr = readU32(ptr);
  const type = readU32(ptr + 4);
  const flags = readU16(ptr + 8);
  const realPtr = readU32(ptr + 12);
  const compPtr = readU32(ptr + 16);
  const length = readU32(ptr + 20);
  const name = readCString(namePtr);

  if (realPtr) {
    const data = [];
    for (let index = 0; index < length; index += 1) {
      data.push(readF64(realPtr + index * 8));
    }
    return { name, type, flags, length, isComplex: false, data };
  }

  if (compPtr) {
    const data = [];
    for (let index = 0; index < length; index += 1) {
      const base = compPtr + index * 16;
      data.push([readF64(base), readF64(base + 8)]);
    }
    return { name, type, flags, length, isComplex: true, data };
  }

  return { name, type, flags, length, isComplex: false, data: [] };
}

function collectVectors() {
  if (!curPlotFn || !allVecsFn || !vecInfoFn) {
    return { plot: "", vectors: {} };
  }
  const plotPtr = curPlotFn();
  const plotName = readCString(plotPtr);
  if (!plotName) {
    return { plot: "", vectors: {} };
  }
  return collectVectorsForPlot(plotName);
}

/**
 * @param {string} plotName
 */
function collectVectorsForPlot(plotName) {
  postLog(`ngspice: collecting vectors for plot '${plotName}'`);
  if (!allVecsFn || !vecInfoFn || !plotName) {
    return { plot: "", vectors: {} };
  }
  const vecListPtr = allVecsFn(plotName);
  const names = readCStringArray(vecListPtr);
  if (!names.length) {
    return { plot: plotName, vectors: {} };
  }
  const vectors = {};
  names.forEach((name) => {
    const infoPtr = vecInfoFn(name);
    if (!infoPtr) {
      return;
    }
    const info = readVectorInfo(infoPtr);
    if (info) {
      vectors[name] = info;
    }
  });
  return { plot: plotName, vectors };
}

function collectPlotNames() {
  if (!allPlotsFn) {
    return [];
  }
  const listPtr = allPlotsFn();
  if (!listPtr) {
    return [];
  }
  return readCStringArray(listPtr).filter(Boolean);
}

function hasSweepVectors(vectors) {
  return Object.values(vectors).some((info) => Array.isArray(info.data) && info.data.length > 1);
}

/**
 * @param {string | undefined} plotHint
 */
function collectVectorsWithFallback(plotHint) {
  const initial = collectVectors();
  const initialHasVectors = Object.keys(initial.vectors).length > 0;
  const preferSweep = typeof plotHint === "string" && plotHint.toLowerCase() === "dc";
  const initialHasSweep = initialHasVectors && hasSweepVectors(initial.vectors);

  if (initialHasVectors && (!preferSweep || initialHasSweep)) {
    postLog(`ngspice: initial plot '${initial.plot}' has vectors (sweep=${initialHasSweep}), using it.`);
    return initial;
  }

  const buildPlotCandidates = (hint) => {
    if (!hint || typeof hint !== "string") {
      return [];
    }
    const trimmed = hint.trim();
    if (!trimmed) {
      return [];
    }
    const candidates = [trimmed];
    if (!/\d$/.test(trimmed)) {
      for (let idx = 1; idx <= 5; idx += 1) {
        candidates.push(`${trimmed}${idx}`);
      }
    }
    return candidates;
  };

  const pickCandidate = (candidates) => {
    for (const name of candidates) {
      const hinted = collectVectorsForPlot(name);
      const hintedHasVectors = Object.keys(hinted.vectors).length > 0;
      if (hintedHasVectors && (!preferSweep || hasSweepVectors(hinted.vectors))) {
        return hinted;
      }
    }
    return null;
  };

  const hintedDirect = pickCandidate(buildPlotCandidates(plotHint));
  if (hintedDirect) {
    postLog(`ngspice: found hinted plot '${hintedDirect.plot}' directly.`);
    return hintedDirect;
  }

  const allPlotNames = collectPlotNames();
  postLog(`ngspice: all plots: ${JSON.stringify(allPlotNames)}`);
  if (allPlotNames.length) {
    const filtered = allPlotNames.filter((name) => name && name.toLowerCase() !== "const");
    const hintLower = typeof plotHint === "string" ? plotHint.toLowerCase() : "";
    const match = hintLower
      ? filtered.find((name) => name.toLowerCase().startsWith(hintLower))
      || filtered.find((name) => name.toLowerCase().includes(hintLower))
      : null;
    const candidate = match || filtered[0];
    if (candidate) {
      const vectors = collectVectorsForPlot(candidate);
      if (Object.keys(vectors.vectors).length && (!preferSweep || hasSweepVectors(vectors.vectors))) {
        return vectors;
      }
    }
  }

  if (!commandFn) {
    return initial;
  }

  if (plotHint) {
    const hinted = collectVectorsForPlot(plotHint);
    if (Object.keys(hinted.vectors).length && (!preferSweep || hasSweepVectors(hinted.vectors))) {
      postLog(`ngspice: switched to hinted plot '${plotHint}' (direct) and found vectors.`);
      return hinted;
    }
    // Fallback to setplot if direct access fails (unlikely, but consistent with old logic)
    commandFn(`setplot ${plotHint}`);
    const hintedViaSet = collectVectors();
    if (Object.keys(hintedViaSet.vectors).length && (!preferSweep || hasSweepVectors(hintedViaSet.vectors))) {
      postLog(`ngspice: switched to hinted plot '${plotHint}' (via setplot) and found vectors.`);
      return hintedViaSet;
    }
  }

  const logStart = logLines.length;
  commandFn("setplot");
  const newLines = logLines.slice(logStart);
  const plotNames = [];
  newLines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) {
      return;
    }
    const lower = trimmed.toLowerCase();
    if (lower.startsWith("list of plots")) {
      return;
    }
    const match = trimmed.match(/^(?:current plot:)?\s*([a-z0-9_.-]+)/i);
    if (match && match[1]) {
      plotNames.push(match[1]);
    }
  });

  const hintLower = typeof plotHint === "string" ? plotHint.toLowerCase() : "";
  if (hintLower) {
    const match = plotNames.find((name) => name.toLowerCase().startsWith(hintLower))
      || plotNames.find((name) => name.toLowerCase().includes(hintLower));
    if (match) {
      commandFn(`setplot ${match}`);
      const hinted = collectVectors();
      if (Object.keys(hinted.vectors).length && (!preferSweep || hasSweepVectors(hinted.vectors))) {
        return hinted;
      }
    }
  }

  const latest = plotNames[plotNames.length - 1];
  if (latest) {
    postLog(`ngspice: trying latest plot from log '${latest}'`);
    const latestVectors = collectVectorsForPlot(latest);
    if (Object.keys(latestVectors.vectors).length && (!preferSweep || hasSweepVectors(latestVectors.vectors))) {
      postLog(`ngspice: using latest plot '${latest}' (direct)`);
      return latestVectors;
    }
    // Fallback to setplot
    commandFn(`setplot ${latest}`);
    const latestViaSet = collectVectors();
    if (Object.keys(latestViaSet.vectors).length && (!preferSweep || hasSweepVectors(latestViaSet.vectors))) {
      postLog(`ngspice: using latest plot '${latest}' (via setplot)`);
      return latestViaSet;
    }
  }
  if (preferSweep && initialHasVectors && !initialHasSweep) {
    postLog(`ngspice: preferSweep but no sweep vectors found in '${initial.plot}', returning initial anyway as fallback.`);
    return { plot: initial.plot ?? "", vectors: {} };
  }
  return initial;
}

/** @param {unknown} entry */
function getRealValue(entry) {
  if (Array.isArray(entry)) {
    const real = Number(entry[0]);
    return Number.isFinite(real) ? real : null;
  }
  const value = Number(entry);
  return Number.isFinite(value) ? value : null;
}

function isAllSignalToken(value) {
  const token = String(value ?? "").trim().toLowerCase();
  return token === "all" || token === "*";
}

function normalizeTargetSignals(targetSignals, availableSignals) {
  const availableList = Array.isArray(availableSignals) ? availableSignals : [];
  const availableByKey = new Map();
  availableList.forEach((name) => {
    const key = String(name ?? "").trim().toLowerCase();
    if (key && !availableByKey.has(key)) {
      availableByKey.set(key, name);
    }
  });
  const resolveSignal = (value) => {
    if (typeof value !== "string") {
      return null;
    }
    const raw = value.trim();
    if (!raw) {
      return null;
    }
    const lower = raw.toLowerCase();
    const candidates = [raw];
    const differentialMatch = lower.match(/^v\(\s*([^(),\s]+)\s*,\s*([^(),\s]+)\s*\)$/);
    if (differentialMatch) {
      const pos = differentialMatch[1];
      const neg = differentialMatch[2];
      candidates.push(`v(${pos})-v(${neg})`);
      candidates.push(`v(${pos}) - v(${neg})`);
      if (neg === "0") {
        candidates.push(`v(${pos})`);
      }
    }
    const subtractionMatch = lower.match(/^v\(\s*([^()\s]+)\s*\)\s*-\s*v\(\s*([^()\s]+)\s*\)$/);
    if (subtractionMatch) {
      const pos = subtractionMatch[1];
      const neg = subtractionMatch[2];
      candidates.push(`v(${pos},${neg})`);
      if (neg === "0") {
        candidates.push(`v(${pos})`);
      }
    }
    if (!lower.startsWith("v(") && !lower.startsWith("i(")) {
      candidates.push(`v(${raw})`);
    } else if (lower.startsWith("v(") && lower.endsWith(")")) {
      candidates.push(raw.slice(2, -1));
    }
    for (const candidate of candidates) {
      const match = availableByKey.get(candidate.toLowerCase());
      if (match) {
        return match;
      }
    }
    return null;
  };
  if (typeof targetSignals === "string") {
    if (isAllSignalToken(targetSignals)) {
      return availableList.slice();
    }
    const match = resolveSignal(targetSignals);
    return match ? [match] : [];
  }
  if (Array.isArray(targetSignals)) {
    if (targetSignals.some((name) => isAllSignalToken(name))) {
      return availableList.slice();
    }
    const seen = new Set();
    const resolved = [];
    targetSignals.forEach((name) => {
      const match = resolveSignal(name);
      if (!match || seen.has(match)) {
        return;
      }
      seen.add(match);
      resolved.push(match);
    });
    return resolved;
  }
  return [];
}

function parseDifferentialSignal(value) {
  const token = String(value ?? "").trim().toLowerCase().replace(/\s+/g, "");
  if (!token) {
    return null;
  }
  let match = token.match(/^v\(([^(),]+),([^(),]+)\)$/);
  if (match) {
    return { pos: match[1], neg: match[2] };
  }
  match = token.match(/^v\(([^()]+)\)-v\(([^()]+)\)$/);
  if (match) {
    return { pos: match[1], neg: match[2] };
  }
  return null;
}

function buildDifferentialSignalLabel(pos, neg) {
  return `v(${pos})-v(${neg})`;
}

function collectRequestedDifferentials(targetSignals) {
  const requested = normalizeSaveSignals(targetSignals);
  const seen = new Set();
  const differentials = [];
  requested.forEach((signal) => {
    const parsed = parseDifferentialSignal(signal);
    if (!parsed?.pos || !parsed?.neg) {
      return;
    }
    const key = `${parsed.pos},${parsed.neg}`;
    if (seen.has(key)) {
      return;
    }
    seen.add(key);
    differentials.push(parsed);
  });
  return differentials;
}

function pickDefaultSignals(availableSignals) {
  if (!availableSignals.length) {
    return [];
  }
  const toShort = (name) => {
    const trimmed = typeof name === "string" ? name : "";
    const last = trimmed.includes(".") ? trimmed.split(".").pop() : trimmed;
    return last.toLowerCase();
  };
  const isCurrent = (short) => short.includes("#branch") || short.startsWith("i(");
  const isVoltage = (short) =>
    short.startsWith("v(")
    || (!isCurrent(short) && !short.startsWith("@") && !short.includes("[") && !short.includes("#"));
  const inSignal = availableSignals.find((name) => {
    const short = toShort(name);
    return short === "v(in)" || short === "in";
  });
  const outSignal = availableSignals.find((name) => {
    const short = toShort(name);
    return short === "v(out)" || short === "out";
  });
  if (inSignal && outSignal && inSignal !== outSignal) {
    return [inSignal, outSignal];
  }
  const voltages = availableSignals.filter((name) => isVoltage(toShort(name)));
  if (voltages.length >= 2) {
    return voltages.slice(0, 2);
  }
  if (voltages.length === 1) {
    return [voltages[0]];
  }
  const current = availableSignals.find((name) => toShort(name).startsWith("i("));
  if (current) {
    return [current];
  }
  return [availableSignals[0]];
}

/**
 * @param {{ plot?: string, vectors?: Record<string, { name: string, type: number, flags: number, length: number, isComplex: boolean, data: number[] | number[][] }> } | null} payload
 */
function parseSpiceNumber(raw) {
  if (typeof raw !== "string" || !raw.trim()) {
    return Number(raw);
  }
  const text = raw.trim();
  const match = text.match(/^([+-]?\d*\.?\d+(?:[eE][+-]?\d+)?)([a-zA-Z]+)?$/);
  if (!match) {
    return Number(text);
  }
  const value = Number(match[1]);
  if (!Number.isFinite(value)) {
    return value;
  }
  const suffix = match[2] ? match[2].toLowerCase() : "";
  if (!suffix) {
    return value;
  }
  if (suffix === "meg") {
    return value * 1e6;
  }
  const multipliers = {
    t: 1e12,
    g: 1e9,
    k: 1e3,
    m: 1e-3,
    u: 1e-6,
    n: 1e-9,
    p: 1e-12,
    f: 1e-15
  };
  if (suffix in multipliers) {
    return value * multipliers[suffix];
  }
  return value;
}

function buildLinearSweep(start, stop, step, maxCount) {
  if (!Number.isFinite(start) || !Number.isFinite(stop) || !Number.isFinite(step) || step === 0) {
    return [];
  }
  const values = [];
  const forward = step > 0;
  let current = start;
  while ((forward && current <= stop + Number.EPSILON) || (!forward && current >= stop - Number.EPSILON)) {
    values.push(current);
    if (maxCount && values.length >= maxCount) {
      break;
    }
    current += step;
  }
  return values;
}

/**
 * @param {string} netlist
 * @param {string} plotHint
 * @param {string[] | string | undefined} targetSignals
 * @returns {RunResult}
 */
function runTranNetlist(netlist, plotHint, targetSignals) {
  if (!moduleInstance || !commandFn) {
    throw new Error("ngspice is not initialized.");
  }

  resetLogs();

  const path = "/tmp/tran.cir";
  const preparedNetlist = ensureSaveSignals(netlist, targetSignals, ["v(in)", "v(out)"]);
  const loadResult = loadNetlist(preparedNetlist, path);
  const exitCode = loadResult.exitCode;
  const runCode = exitCode === 0 ? commandFn("run") : exitCode;

  postLog(`ngspice: run code=${runCode}, exit code=${exitCode}`);

  const vectors = collectVectorsWithFallback(plotHint);
  const plots = collectPlotNames();

  postLog(`ngspice: collected plots: ${JSON.stringify(plots)}, current vector plot: ${vectors.plot}`);

  return {
    ok: exitCode === 0 && runCode === 0,
    runCode,
    exitCode,
    log: getLogs(),
    vectors,
    plots,
    loadMethod: loadResult.loadMethod,
    usedDcCommand: false
  };
}

/**
 * @param {{ plot?: string, vectors?: Record<string, { name: string, type: number, flags: number, length: number, isComplex: boolean, data: number[] | number[][] }> } | null} payload
 * @param {string | undefined} netlist
 * @param {string[] | string | undefined} targetSignals
 */
function extractTranResults(payload, netlist, targetSignals) {
  const vectorMap = payload?.vectors ?? {};
  const entries = Object.entries(vectorMap);
  if (!entries.length) {
    return { plot: payload?.plot ?? "", x: [], traces: {}, signals: [], selected: [] };
  }

  // Find time vector
  let timeEntry = entries.find(([name]) => name.toLowerCase() === "time");
  if (!timeEntry) {
    // Fallback: look for a vector that matches the length of others and has 'time' in name or is the first one
    timeEntry = entries.find(([name]) => name.toLowerCase().includes("time")) || entries[0];
  }

  if (timeEntry) {
    postLog(`ngspice: identified time vector as '${timeEntry[0]}' with ${timeEntry[1]?.data?.length} points`);
  } else {
    postLog("ngspice: failed to find time vector");
  }

  const [tName, tInfo] = timeEntry;
  const timeValues = Array.isArray(tInfo?.data) ? tInfo.data.map(getRealValue).filter((val) => val !== null) : [];

  const signals = entries
    .filter(([name]) => name !== tName)
    .map(([name]) => name)
    .sort();

  const selected = normalizeTargetSignals(targetSignals, signals);
  const traceNames = selected.length ? selected : pickDefaultSignals(signals);
  const traces = {};
  let minLen = timeValues.length || Infinity;

  traceNames.forEach((name) => {
    const info = vectorMap[name];
    const rawY = Array.isArray(info?.data) ? info.data.map(getRealValue).filter((val) => val !== null) : [];
    if (!rawY.length) {
      return;
    }
    traces[name] = rawY;
    minLen = Math.min(minLen, rawY.length);
  });

  const requestedDifferentials = collectRequestedDifferentials(targetSignals);
  requestedDifferentials.forEach(({ pos, neg }) => {
    const label = buildDifferentialSignalLabel(pos, neg);
    const existing = normalizeTargetSignals([`v(${pos},${neg})`, label], Object.keys(traces));
    if (existing.length) {
      return;
    }
    const posName = normalizeTargetSignals([`v(${pos})`, pos], signals)[0];
    if (!posName) {
      return;
    }
    const posValues = Array.isArray(vectorMap[posName]?.data)
      ? vectorMap[posName].data.map(getRealValue).filter((val) => val !== null)
      : [];
    if (!posValues.length) {
      return;
    }
    let diffValues = posValues.slice();
    if (neg !== "0") {
      const negName = normalizeTargetSignals([`v(${neg})`, neg], signals)[0];
      if (!negName) {
        return;
      }
      const negValues = Array.isArray(vectorMap[negName]?.data)
        ? vectorMap[negName].data.map(getRealValue).filter((val) => val !== null)
        : [];
      if (!negValues.length) {
        return;
      }
      const maxLen = Math.min(posValues.length, negValues.length);
      diffValues = Array.from({ length: maxLen }, (_, index) => posValues[index] - negValues[index]);
    }
    traces[label] = diffValues;
    minLen = Math.min(minLen, diffValues.length);
    if (!signals.includes(label)) {
      signals.push(label);
      signals.sort();
    }
    if (!traceNames.includes(label)) {
      traceNames.push(label);
    }
  });

  if (!Number.isFinite(minLen)) {
    minLen = 0;
  }

  let x = timeValues;
  if (!x.length && minLen > 0) {
    x = Array.from({ length: minLen }, (_, index) => index);
  }
  if (x.length) {
    minLen = Math.min(minLen, x.length);
    x = x.slice(0, minLen);
  }

  Object.keys(traces).forEach((name) => {
    traces[name] = traces[name].slice(0, minLen);
  });
  const resolvedSelected = traceNames.filter((name) => Object.prototype.hasOwnProperty.call(traces, name));

  return {
    plot: payload?.plot ?? "",
    x,
    traces,
    signals,
    selected: resolvedSelected
  };
}

/**
 * @param {string} netlist
 * @param {string} plotHint
 * @param {string[] | string | undefined} targetSignals
 * @returns {RunResult}
 */
function runAcNetlist(netlist, plotHint, targetSignals) {
  if (!moduleInstance || !commandFn) {
    throw new Error("ngspice is not initialized.");
  }

  resetLogs();

  const path = "/tmp/ac.cir";
  const preparedNetlist = ensureSaveSignals(netlist, targetSignals, ["all"]);
  const loadResult = loadNetlist(preparedNetlist, path);
  const exitCode = loadResult.exitCode;
  const runCode = exitCode === 0 ? commandFn("run") : exitCode;

  postLog(`ngspice: run code=${runCode}, exit code=${exitCode}`);

  const vectors = collectVectorsWithFallback(plotHint);
  const plots = collectPlotNames();

  postLog(`ngspice: collected plots: ${JSON.stringify(plots)}, current vector plot: ${vectors.plot}`);

  return {
    ok: exitCode === 0 && runCode === 0,
    runCode,
    exitCode,
    log: getLogs(),
    vectors,
    plots,
    loadMethod: loadResult.loadMethod,
    usedDcCommand: false
  };
}

/**
 * Extract AC results with magnitude (dB) and phase (degrees) from complex vectors.
 * @param {{ plot?: string, vectors?: Record<string, { name: string, type: number, flags: number, length: number, isComplex: boolean, data: number[] | number[][] }> } | null} payload
 * @param {string | undefined} netlist
 * @param {string[] | string | undefined} targetSignals
 */
function extractAcResults(payload, netlist, targetSignals) {
  const vectorMap = payload?.vectors ?? {};
  const entries = Object.entries(vectorMap);
  if (!entries.length) {
    return { plot: payload?.plot ?? "", freq: [], magnitude: {}, phase: {}, signals: [], selected: [] };
  }

  // Find frequency vector
  let freqEntry = entries.find(([name]) => name.toLowerCase() === "frequency");
  if (!freqEntry) {
    freqEntry = entries.find(([name]) => name.toLowerCase().includes("freq")) || entries[0];
  }

  if (freqEntry) {
    postLog(`ngspice: identified frequency vector as '${freqEntry[0]}' with ${freqEntry[1]?.data?.length} points`);
  } else {
    postLog("ngspice: failed to find frequency vector");
  }

  const [fName, fInfo] = freqEntry;
  const freqValues = Array.isArray(fInfo?.data) ? fInfo.data.map(getRealValue).filter((val) => val !== null) : [];

  const signals = entries
    .filter(([name]) => name !== fName)
    .map(([name]) => name)
    .sort();

  const selected = normalizeTargetSignals(targetSignals, signals);
  const traceNames = selected.length ? selected : pickDefaultSignals(signals);
  const magnitude = {};
  const phase = {};
  let minLen = freqValues.length || Infinity;

  traceNames.forEach((name) => {
    const info = vectorMap[name];
    if (!info || !Array.isArray(info.data)) {
      return;
    }
    const magValues = [];
    const phaseValues = [];
    for (const val of info.data) {
      if (Array.isArray(val) && val.length >= 2) {
        const re = val[0];
        const im = val[1];
        const mag = Math.sqrt(re * re + im * im);
        magValues.push(mag > 0 ? 20 * Math.log10(mag) : -Infinity);
        phaseValues.push(Math.atan2(im, re) * (180 / Math.PI));
      } else if (typeof val === "number") {
        magValues.push(val > 0 ? 20 * Math.log10(Math.abs(val)) : -Infinity);
        phaseValues.push(0);
      }
    }
    if (!magValues.length) {
      return;
    }
    magnitude[name] = magValues;
    phase[name] = phaseValues;
    minLen = Math.min(minLen, magValues.length);
  });

  const requestedDifferentials = collectRequestedDifferentials(targetSignals);
  const toComplex = (entry) => {
    if (Array.isArray(entry) && entry.length >= 2) {
      const re = Number(entry[0]);
      const im = Number(entry[1]);
      return [Number.isFinite(re) ? re : 0, Number.isFinite(im) ? im : 0];
    }
    const value = Number(entry);
    return [Number.isFinite(value) ? value : 0, 0];
  };
  requestedDifferentials.forEach(({ pos, neg }) => {
    const label = buildDifferentialSignalLabel(pos, neg);
    const existing = normalizeTargetSignals([`v(${pos},${neg})`, label], Object.keys(magnitude));
    if (existing.length) {
      return;
    }
    const posName = normalizeTargetSignals([`v(${pos})`, pos], signals)[0];
    if (!posName) {
      return;
    }
    const posData = Array.isArray(vectorMap[posName]?.data) ? vectorMap[posName].data : [];
    if (!posData.length) {
      return;
    }
    let magValues = [];
    let phaseValues = [];
    if (neg === "0") {
      posData.forEach((entry) => {
        const [re, im] = toComplex(entry);
        const mag = Math.sqrt(re * re + im * im);
        magValues.push(mag > 0 ? 20 * Math.log10(mag) : -Infinity);
        phaseValues.push(Math.atan2(im, re) * (180 / Math.PI));
      });
    } else {
      const negName = normalizeTargetSignals([`v(${neg})`, neg], signals)[0];
      if (!negName) {
        return;
      }
      const negData = Array.isArray(vectorMap[negName]?.data) ? vectorMap[negName].data : [];
      if (!negData.length) {
        return;
      }
      const maxLen = Math.min(posData.length, negData.length);
      for (let index = 0; index < maxLen; index += 1) {
        const [posRe, posIm] = toComplex(posData[index]);
        const [negRe, negIm] = toComplex(negData[index]);
        const re = posRe - negRe;
        const im = posIm - negIm;
        const mag = Math.sqrt(re * re + im * im);
        magValues.push(mag > 0 ? 20 * Math.log10(mag) : -Infinity);
        phaseValues.push(Math.atan2(im, re) * (180 / Math.PI));
      }
    }
    if (!magValues.length) {
      return;
    }
    magnitude[label] = magValues;
    phase[label] = phaseValues;
    minLen = Math.min(minLen, magValues.length);
    if (!signals.includes(label)) {
      signals.push(label);
      signals.sort();
    }
    if (!traceNames.includes(label)) {
      traceNames.push(label);
    }
  });

  if (!Number.isFinite(minLen)) {
    minLen = 0;
  }

  let freq = freqValues;
  if (!freq.length && minLen > 0) {
    freq = Array.from({ length: minLen }, (_, index) => index);
  }
  if (freq.length) {
    minLen = Math.min(minLen, freq.length);
    freq = freq.slice(0, minLen);
  }

  Object.keys(magnitude).forEach((name) => {
    magnitude[name] = magnitude[name].slice(0, minLen);
    phase[name] = phase[name].slice(0, minLen);
  });
  const resolvedSelected = traceNames.filter((name) => Object.prototype.hasOwnProperty.call(magnitude, name));

  return {
    plot: payload?.plot ?? "",
    freq,
    magnitude,
    phase,
    signals,
    selected: resolvedSelected
  };
}

function parseDcDefinition(netlist, maxCount) {
  if (typeof netlist !== "string") {
    return null;
  }
  const lines = netlist.split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("*")) {
      continue;
    }
    if (!trimmed.toLowerCase().startsWith(".dc")) {
      continue;
    }
    const tokens = trimmed.split(/\s+/);
    if (tokens.length < 5) {
      continue;
    }
    const source = tokens[1];
    const startText = tokens[2];
    const stopText = tokens[3];
    const stepText = tokens[4];
    const start = parseSpiceNumber(startText);
    const stop = parseSpiceNumber(stopText);
    const step = parseSpiceNumber(stepText);
    const values = buildLinearSweep(start, stop, step, maxCount);
    return {
      source,
      startText,
      stopText,
      stepText,
      values
    };
  }
  return null;
}

function ensureSaveAll(netlist) {
  if (typeof netlist !== "string") {
    return netlist;
  }
  const lines = netlist.split(/\r?\n/);
  const hasSave = lines.some((line) => line.trim().toLowerCase().startsWith(".save"));
  if (hasSave) {
    return netlist;
  }
  const insertIndex = lines.findIndex((line) => line.trim().toLowerCase().startsWith(".end"));
  if (insertIndex >= 0) {
    lines.splice(insertIndex, 0, ".save all");
    return lines.join("\n");
  }
  return `${netlist.trimEnd()}\n.save all\n`;
}

function normalizeSaveSignals(signals) {
  const dedupe = (entries) => {
    const seen = new Set();
    const unique = [];
    entries.forEach((entry) => {
      const token = String(entry ?? "").trim();
      if (!token) {
        return;
      }
      const key = token.toLowerCase();
      if (seen.has(key)) {
        return;
      }
      seen.add(key);
      unique.push(token);
    });
    return unique;
  };
  const expandSignal = (value) => {
    const token = String(value ?? "").trim();
    if (!token) {
      return [];
    }
    const compact = token.toLowerCase().replace(/\s+/g, "");
    const differential = compact.match(/^v\(([^(),]+),([^(),]+)\)$/);
    if (differential) {
      const pos = differential[1];
      const neg = differential[2];
      if (neg === "0") {
        return dedupe([token, `v(${pos})`]);
      }
      return dedupe([token, `v(${pos})-v(${neg})`]);
    }
    const subtraction = compact.match(/^v\(([^()]+)\)-v\(([^()]+)\)$/);
    if (subtraction) {
      const pos = subtraction[1];
      const neg = subtraction[2];
      if (neg === "0") {
        return dedupe([token, `v(${pos})`]);
      }
      return dedupe([token, `v(${pos},${neg})`]);
    }
    return [token];
  };
  if (!signals) {
    return [];
  }
  if (typeof signals === "string") {
    const trimmed = signals.trim();
    return trimmed ? expandSignal(trimmed) : [];
  }
  if (Array.isArray(signals)) {
    const expanded = [];
    signals.forEach((signal) => {
      expanded.push(...expandSignal(signal));
    });
    return dedupe(expanded);
  }
  return [];
}

function ensureSaveSignals(netlist, signals, fallbackSignals) {
  if (typeof netlist !== "string") {
    return netlist;
  }
  const lines = netlist.split(/\r?\n/);
  const hasSave = lines.some((line) => line.trim().toLowerCase().startsWith(".save"));
  const primary = normalizeSaveSignals(signals);
  const fallback = normalizeSaveSignals(fallbackSignals);
  const chosen = primary.length ? primary : fallback;
  if (!chosen.length) {
    return netlist;
  }
  const saveLine = `.save ${chosen.join(" ")}`;
  let nextLines = lines.slice();
  if (hasSave && primary.length) {
    nextLines = nextLines.filter((line) => !line.trim().toLowerCase().startsWith(".save"));
  } else if (hasSave) {
    return netlist;
  }
  const insertIndex = nextLines.findIndex((line) => line.trim().toLowerCase().startsWith(".end"));
  if (insertIndex >= 0) {
    nextLines.splice(insertIndex, 0, saveLine);
  } else {
    nextLines.push(saveLine);
  }
  postLog(`ngspice: injected .save ${chosen.join(" ")}`);
  return nextLines.join("\n");
}

/**
 * @param {{ plot?: string, vectors?: Record<string, { name: string, type: number, flags: number, length: number, isComplex: boolean, data: number[] | number[][] }> } | null} payload
 * @param {string | undefined} netlist
 * @param {string[] | string | undefined} targetSignals
 */
function extractDcResults(payload, netlist, targetSignals) {
  const vectorMap = payload?.vectors ?? {};
  const entries = Object.entries(vectorMap);
  if (!entries.length) {
    return { plot: payload?.plot ?? "", x: [], traces: {}, signals: [], selected: [] };
  }
  const sweepEntry = entries.find(([name]) => name.toLowerCase().includes("sweep"));
  const primaryEntry = sweepEntry || entries.find(([, info]) => Array.isArray(info?.data) && info.data.length > 1) || entries[0];
  const [xName, xInfo] = primaryEntry;
  const xValues = Array.isArray(xInfo?.data) ? xInfo.data.map(getRealValue).filter((val) => val !== null) : [];

  const signals = entries
    .filter(([name]) => name !== xName)
    .map(([name]) => name)
    .sort();

  const selected = normalizeTargetSignals(targetSignals, signals);
  const traceNames = selected.length ? selected : pickDefaultSignals(signals);
  const traces = {};
  let minLen = xValues.length || Infinity;

  traceNames.forEach((name) => {
    const info = vectorMap[name];
    const rawY = Array.isArray(info?.data) ? info.data.map(getRealValue).filter((val) => val !== null) : [];
    if (!rawY.length) {
      return;
    }
    traces[name] = rawY;
    minLen = Math.min(minLen, rawY.length);
  });

  const requestedDifferentials = collectRequestedDifferentials(targetSignals);
  requestedDifferentials.forEach(({ pos, neg }) => {
    const label = buildDifferentialSignalLabel(pos, neg);
    const existing = normalizeTargetSignals([`v(${pos},${neg})`, label], Object.keys(traces));
    if (existing.length) {
      return;
    }
    const posName = normalizeTargetSignals([`v(${pos})`, pos], signals)[0];
    if (!posName) {
      return;
    }
    const posValues = Array.isArray(vectorMap[posName]?.data)
      ? vectorMap[posName].data.map(getRealValue).filter((val) => val !== null)
      : [];
    if (!posValues.length) {
      return;
    }
    let diffValues = posValues.slice();
    if (neg !== "0") {
      const negName = normalizeTargetSignals([`v(${neg})`, neg], signals)[0];
      if (!negName) {
        return;
      }
      const negValues = Array.isArray(vectorMap[negName]?.data)
        ? vectorMap[negName].data.map(getRealValue).filter((val) => val !== null)
        : [];
      if (!negValues.length) {
        return;
      }
      const maxLen = Math.min(posValues.length, negValues.length);
      diffValues = Array.from({ length: maxLen }, (_, index) => posValues[index] - negValues[index]);
    }
    traces[label] = diffValues;
    minLen = Math.min(minLen, diffValues.length);
    if (!signals.includes(label)) {
      signals.push(label);
      signals.sort();
    }
    if (!traceNames.includes(label)) {
      traceNames.push(label);
    }
  });

  if (!Number.isFinite(minLen)) {
    minLen = 0;
  }

  let x = xValues;
  if (!x.length && minLen > 0) {
    const derived = parseDcDefinition(netlist, minLen);
    x = derived?.values?.length ? derived.values : Array.from({ length: minLen }, (_, index) => index);
  }
  if (x.length) {
    minLen = Math.min(minLen, x.length);
    x = x.slice(0, minLen);
  }

  Object.keys(traces).forEach((name) => {
    traces[name] = traces[name].slice(0, minLen);
  });
  const resolvedSelected = traceNames.filter((name) => Object.prototype.hasOwnProperty.call(traces, name));

  return {
    plot: payload?.plot ?? "",
    x,
    traces,
    signals,
    selected: resolvedSelected
  };
}

/**
 * @param {{ plot?: string, vectors?: Record<string, { name: string, type: number, flags: number, length: number, isComplex: boolean, data: number[] | number[][] }> } | null} payload
 */
function extractOpResults(payload) {
  const vectorMap = payload?.vectors ?? {};
  const nodes = [];
  const currents = [];
  const ignore = new Set(["time", "frequency", "v-sweep"]);
  Object.entries(vectorMap).forEach(([name, info]) => {
    const shortName = name.includes(".") ? name.split(".").pop() : name;
    const label = (shortName || name).toLowerCase();
    if (ignore.has(label)) {
      return;
    }
    let value = null;
    if (info && Array.isArray(info.data) && info.data.length > 0) {
      const first = info.data[0];
      if (Array.isArray(first)) {
        value = { real: first[0], imag: first[1] };
      } else if (Number.isFinite(first)) {
        value = first;
      }
    }
    const isCurrent = label.includes("#branch") || label.startsWith("i(");
    const isVoltage = label.startsWith("v(")
      || (!isCurrent && !label.startsWith("@") && !label.includes("[") && !label.includes("#"));
    if (isCurrent) {
      currents.push({ name: shortName || name, value });
    } else if (isVoltage) {
      nodes.push({ name: shortName || name, value });
    }
  });
  nodes.sort((a, b) => a.name.localeCompare(b.name));
  currents.sort((a, b) => a.name.localeCompare(b.name));
  return {
    plot: payload?.plot ?? "",
    nodes,
    currents
  };
}

/**
 * @param {{ createNgspiceModule?: NgspiceFactory, NgspiceModule?: NgspiceFactory, importScripts: (...urls: string[]) => void }} anyCtx
 * @returns {Promise<NgspiceModule>}
 */
async function initWithFactory(anyCtx) {
  tryImportInline(anyCtx);
  if (!anyCtx.createNgspiceModule && !anyCtx.NgspiceModule) {
    anyCtx.importScripts(`${SPICE_BASE}/ngspice.js`);
  }

  const factory = anyCtx.createNgspiceModule ?? anyCtx.NgspiceModule;
  if (!factory) {
    throw new Error("ngspice module factory not found. Ensure ngspice.js exports createNgspiceModule or NgspiceModule.");
  }

  const options = {
    print: handlePrint,
    printErr: handlePrint,
    noInitialRun: true,
    locateFile: (path) => `${SPICE_BASE}/${path}`
  };
  const wasmBinary = getEmbeddedWasmBytes(anyCtx);
  if (wasmBinary) {
    options.wasmBinary = wasmBinary;
  }
  return factory(options);
}

/**
 * @param {{ Module?: NgspiceModule, importScripts: (...urls: string[]) => void }} anyCtx
 * @returns {Promise<NgspiceModule>}
 */
async function initWithGlobalModule(anyCtx) {
  /** @type {NgspiceModule} */
  const moduleConfig = anyCtx.Module ?? {};
  let runtimeReadyResolve = null;
  let runtimeReadyReject = null;
  const runtimeReady = new Promise((resolve, reject) => {
    runtimeReadyResolve = resolve;
    runtimeReadyReject = reject;
  });
  const previousOnRuntimeInitialized = moduleConfig.onRuntimeInitialized;
  moduleConfig.onRuntimeInitialized = () => {
    if (typeof previousOnRuntimeInitialized === "function") {
      previousOnRuntimeInitialized();
    }
    if (runtimeReadyResolve) {
      runtimeReadyResolve();
    }
  };
  const previousOnAbort = moduleConfig.onAbort;
  moduleConfig.onAbort = (reason) => {
    if (typeof previousOnAbort === "function") {
      previousOnAbort(reason);
    }
    if (runtimeReadyReject) {
      const message = reason ? `ngspice aborted: ${String(reason)}` : "ngspice aborted.";
      runtimeReadyReject(new Error(message));
    }
  };

  moduleConfig.print = handlePrint;
  moduleConfig.printErr = handlePrint;
  moduleConfig.noInitialRun = true;
  moduleConfig.locateFile = (path) => `${SPICE_BASE}/${path}`;

  tryImportInline(anyCtx);
  const embedded = getEmbeddedWasmBytes(anyCtx);
  if (embedded) {
    moduleConfig.wasmBinary = embedded;
    postLog("ngspice: using embedded wasm");
  } else {
    const wasmUrl = `${SPICE_BASE}/ngspice.wasm`;
    postLog("ngspice: fetching wasm");
    if (typeof XMLHttpRequest !== "undefined") {
      moduleConfig.wasmBinary = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("GET", wasmUrl, true);
        xhr.responseType = "arraybuffer";
        xhr.timeout = 15000;
        xhr.onload = () => {
          if (xhr.status !== 200 && xhr.status !== 0) {
            reject(new Error(`ngspice wasm xhr failed: ${xhr.status}`));
            return;
          }
          resolve(new Uint8Array(xhr.response));
        };
        xhr.onerror = () => reject(new Error("ngspice wasm xhr failed: network error"));
        xhr.ontimeout = () => reject(new Error("ngspice wasm xhr failed: timeout"));
        xhr.send(null);
      });
    } else {
      const wasmResponse = await fetch(wasmUrl);
      if (!wasmResponse.ok) {
        throw new Error(`ngspice wasm fetch failed: ${wasmResponse.status}`);
      }
      moduleConfig.wasmBinary = new Uint8Array(await wasmResponse.arrayBuffer());
    }
    postLog("ngspice: wasm loaded");
  }

  anyCtx.Module = moduleConfig;
  postLog("ngspice: loading ngspice.js");
  anyCtx.importScripts(`${SPICE_BASE}/ngspice.js`);
  postLog("ngspice: ngspice.js loaded");
  await Promise.race([
    runtimeReady,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error("ngspice runtime init timed out.")), 15000);
    })
  ]);
  if (!moduleConfig.HEAPU8) {
    throw new Error("ngspice module failed to initialize (missing HEAPU8).");
  }
  postLog("ngspice: runtime ready");
  return moduleConfig;
}

async function initNgspice() {
  if (moduleInstance) {
    return;
  }
  const ctx = self;
  /** @type {any} */
  const anyCtx = ctx;

  postLog("ngspice: init start");
  try {
    moduleInstance = await initWithFactory(anyCtx);
  } catch (error) {
    postLog("ngspice: factory init failed, trying global module");
    moduleInstance = await initWithGlobalModule(anyCtx);
  }
  postLog("ngspice: module ready");
  commandFn = resolveCommand(moduleInstance);
  initFn = resolveExport(moduleInstance, "ngSpice_Init", "number", [
    "number",
    "number",
    "number",
    "number",
    "number",
    "number",
    "number"
  ]);
  circFn = resolveExport(moduleInstance, "ngSpice_Circ", "number", ["number"]);
  curPlotFn = resolveExport(moduleInstance, "ngSpice_CurPlot", "number", []);
  allPlotsFn = resolveExport(moduleInstance, "ngSpice_AllPlots", "number", []);
  allVecsFn = resolveExport(moduleInstance, "ngSpice_AllVecs", "number", ["string"]);
  vecInfoFn = resolveExport(moduleInstance, "ngGet_Vec_Info", "number", ["string"]);

  if (!commandFn) {
    throw new Error("ngspice ngSpice_Command export not found. This wasm build does not expose the ngSpice_* API; use a build compiled with EXPORTED_FUNCTIONS and EXPORTED_RUNTIME_METHODS (ccall/cwrap).");
  }
  postLog("ngspice: command binding ready");

  if (initFn) {
    postLog("ngspice: calling ngSpice_Init");
    initFn(0, 0, 0, 0, 0, 0, 0);
    postLog("ngspice: ngSpice_Init done");
  }
}

function resetLogs() {
  logLines = [];
}

function getLogs() {
  return logLines.join("\n");
}

function resolveFs() {
  if (moduleInstance?.FS) {
    return moduleInstance.FS;
  }
  if (bridgeCtx && typeof bridgeCtx.FS === "object") {
    return bridgeCtx.FS;
  }
  return null;
}

/**
 * @param {string} netlist
 * @param {string} path
 */
function loadNetlist(netlist, path) {
  const circResult = tryLoadNetlistWithCirc(netlist);
  if (typeof circResult === "number") {
    return { exitCode: circResult, loadMethod: "circ" };
  }
  const fs = resolveFs();
  if (!fs?.writeFile) {
    throw new Error("ngspice FS is not available; cannot write netlist.");
  }
  fs.writeFile(path, netlist);
  return { exitCode: commandFn(`source ${path}`), loadMethod: "source" };
}

function resetSimulator() {
  resetLogs();
  if (!commandFn) {
    return;
  }
  commandFn("reset");
}

/**
 * @param {string} netlist
 * @returns {{ ok: boolean, log: string, vectors: { plot: string, vectors: Record<string, { name: string, type: number, flags: number, length: number, isComplex: boolean, data: number[] | number[][] }> } }}
 */
function runOpNetlist(netlist, plotHint) {
  if (!moduleInstance || !commandFn) {
    throw new Error("ngspice is not initialized.");
  }

  resetLogs();

  const path = "/tmp/op.cir";
  const loadResult = loadNetlist(netlist, path);
  const exitCode = loadResult.exitCode;
  const runCode = exitCode === 0 ? commandFn("run") : exitCode;
  const vectors = collectVectorsWithFallback(plotHint);
  const plots = collectPlotNames();

  return {
    ok: exitCode === 0 && runCode === 0,
    log: getLogs(),
    vectors,
    plots,
    exitCode,
    runCode,
    loadMethod: loadResult.loadMethod
  };
}

/**
 * @param {string} netlist
 * @param {string} [plotHint]
 */
function runDcNetlist(netlist, plotHint, targetSignals) {
  if (!moduleInstance || !commandFn) {
    throw new Error("ngspice is not initialized.");
  }

  resetLogs();

  const path = "/tmp/dc.cir";
  const preparedNetlist = ensureSaveSignals(netlist, targetSignals, ["all"]);
  const loadResult = loadNetlist(preparedNetlist, path);
  const exitCode = loadResult.exitCode;
  let runCode = exitCode;
  let usedDcCommand = false;
  if (exitCode === 0) {
    // Always use 'run' command which respects the .dc card in the netlist.
    // Manual 'dc' command invocation is brittle in the WASM environment.
    runCode = commandFn("run");
  }
  postLog(`ngspice: run code=${runCode}, exit code=${exitCode}`);
  const vectors = collectVectorsWithFallback(plotHint);
  const plots = collectPlotNames();
  postLog(`ngspice: collected plots: ${JSON.stringify(plots)}, current vector plot: ${vectors.plot}`);

  return {
    ok: exitCode === 0 && runCode === 0,
    log: getLogs(),
    vectors,
    plots,
    exitCode,
    runCode,
    usedDcCommand,
    loadMethod: loadResult.loadMethod
  };
}

bridgeCtx.ngspiceBridge = {
  initNgspice,
  resetLogs,
  getLogs,
  resetSimulator,
  runOpNetlist,
  runDcNetlist,
  runTranNetlist,
  runAcNetlist,
  extractOpResults,
  extractDcResults,
  extractTranResults,
  extractAcResults
};
