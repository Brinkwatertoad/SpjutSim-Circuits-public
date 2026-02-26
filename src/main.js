const stateApi = self.SpjutSimState ?? null;
const uiApi = self.SpjutSimUI ?? null;
if (!stateApi || typeof stateApi.createState !== "function") {
  throw new Error("State module not available. Check src/app/state.js.");
}
if (!uiApi || typeof uiApi.createUI !== "function") {
  throw new Error("UI module not available. Check src/app/ui.js.");
}

const state = stateApi.createState();
const root = document.getElementById("app");
if (!root) {
  throw new Error("Missing #app container.");
}

let ui;
let lastStatus = state.status;
const setStatus = (status) => {
  lastStatus = status;
  state.status = status;
  if (ui && typeof ui.setStatus === "function") {
    ui.setStatus(status);
  }
};

const formatNumber = (value) => {
  if (!Number.isFinite(value)) {
    return "n/a";
  }
  const abs = Math.abs(value);
  if (abs !== 0 && (abs >= 1e6 || abs < 1e-3)) {
    return value.toExponential(3);
  }
  return value.toPrecision(4);
};

const formatScalarValue = (value) => {
  if (value === null || value === undefined) {
    return "n/a";
  }
  if (typeof value === "number") {
    return formatNumber(value);
  }
  if (typeof value === "object" && typeof value.real === "number" && typeof value.imag === "number") {
    const real = formatNumber(value.real);
    const imag = formatNumber(value.imag);
    if (value.imag === 0) {
      return real;
    }
    const sign = value.imag >= 0 ? "+" : "-";
    return `${real} ${sign} j${formatNumber(Math.abs(value.imag))}`;
  }
  return "n/a";
};

const extractScalarRaw = (value) => {
  if (typeof value === "number") {
    return value;
  }
  if (value && typeof value === "object" && typeof value.real === "number" && typeof value.imag === "number") {
    return value.real;
  }
  return null;
};

const formatVectorValue = (info) => {
  if (!info || !Array.isArray(info.data) || info.data.length === 0) {
    return "n/a";
  }
  const first = info.data[0];
  if (Array.isArray(first)) {
    return formatScalarValue({ real: first[0], imag: first[1] });
  }
  return formatScalarValue(first);
};

const parseOpResults = (payload) => {
  if (payload && Array.isArray(payload.nodes) && Array.isArray(payload.currents)) {
    return {
      plot: payload?.plot ?? "",
      nodes: payload.nodes.map((row) => ({
        name: row.name,
        value: formatScalarValue(row.value),
        raw: extractScalarRaw(row.value)
      })),
      currents: payload.currents.map((row) => ({
        name: row.name,
        value: formatScalarValue(row.value),
        raw: extractScalarRaw(row.value)
      }))
    };
  }
  const vectorMap = payload && payload.vectors ? payload.vectors : {};
  const nodes = [];
  const currents = [];
  const ignore = new Set(["time", "frequency", "v-sweep"]);
  Object.entries(vectorMap).forEach(([name, info]) => {
    const shortName = name.includes(".") ? name.split(".").pop() : name;
    const label = (shortName || name).toLowerCase();
    if (ignore.has(label)) {
      return;
    }
    const value = formatVectorValue(info);
    let raw = null;
    if (info && Array.isArray(info.data) && info.data.length > 0) {
      const first = info.data[0];
      if (Array.isArray(first) && typeof first[0] === "number") {
        raw = first[0];
      } else if (typeof first === "number") {
        raw = first;
      }
    }
    const isCurrent = label.includes("#branch") || label.startsWith("i(");
    const isVoltage = label.startsWith("v(")
      || (!isCurrent && !label.startsWith("@") && !label.includes("[") && !label.includes("#"));
    if (isCurrent) {
      currents.push({ name: shortName || name, value, raw });
    } else if (isVoltage) {
      nodes.push({ name: shortName || name, value, raw });
    }
  });
  nodes.sort((a, b) => a.name.localeCompare(b.name));
  currents.sort((a, b) => a.name.localeCompare(b.name));
  return {
    plot: payload?.plot ?? "",
    nodes,
    currents
  };
};

const parseTraceMap = (input) => {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return {};
  }
  return input;
};

const parseDcResults = (payload) => {
  if (!payload || !Array.isArray(payload.x)) {
    return { x: [], traces: {}, signals: [], selected: [] };
  }
  if (payload.traces) {
    const traces = parseTraceMap(payload.traces);
    const selected = Array.isArray(payload.selected) ? payload.selected : Object.keys(traces);
    const signals = Array.isArray(payload.signals) ? payload.signals : Object.keys(traces);
    return { x: payload.x, traces, signals, selected };
  }
  if (Array.isArray(payload.y)) {
    const label = payload.label ?? "trace";
    return {
      x: payload.x,
      traces: { [label]: payload.y },
      signals: Array.isArray(payload.signals) ? payload.signals : [label],
      selected: [label]
    };
  }
  return { x: payload.x, traces: {}, signals: [], selected: [] };
};

const parseTranResults = (payload) => {
  if (!payload || !Array.isArray(payload.x)) {
    return { x: [], traces: {}, signals: [], selected: [] };
  }
  if (payload.traces) {
    const traces = parseTraceMap(payload.traces);
    const selected = Array.isArray(payload.selected) ? payload.selected : Object.keys(traces);
    const signals = Array.isArray(payload.signals) ? payload.signals : Object.keys(traces);
    return { x: payload.x, traces, signals, selected };
  }
  if (Array.isArray(payload.y)) {
    const label = payload.label ?? "trace";
    return {
      x: payload.x,
      traces: { [label]: payload.y },
      signals: Array.isArray(payload.signals) ? payload.signals : [label],
      selected: [label]
    };
  }
  return { x: payload.x, traces: {}, signals: [], selected: [] };
};

const parseAcResults = (payload) => {
  if (!payload || !Array.isArray(payload.freq)) {
    return { freq: [], magnitude: {}, phase: {}, signals: [], selected: [] };
  }
  if (payload.magnitude && !Array.isArray(payload.magnitude)) {
    const magnitude = parseTraceMap(payload.magnitude);
    const phase = parseTraceMap(payload.phase);
    const selected = Array.isArray(payload.selected) ? payload.selected : Object.keys(magnitude);
    const signals = Array.isArray(payload.signals) ? payload.signals : Object.keys(magnitude);
    return { freq: payload.freq, magnitude, phase, signals, selected };
  }
  if (Array.isArray(payload.magnitude)) {
    const label = payload.label ?? "trace";
    return {
      freq: payload.freq,
      magnitude: { [label]: payload.magnitude },
      phase: Array.isArray(payload.phase) ? { [label]: payload.phase } : {},
      signals: Array.isArray(payload.signals) ? payload.signals : [label],
      selected: [label]
    };
  }
  return { freq: payload.freq, magnitude: {}, phase: {}, signals: [], selected: [] };
};

const params = new URLSearchParams(window.location.search);
const isSelftest = params.get("selftest") === "1";
const isUiTest = params.get("uiTest") === "1";
const selftestTimeoutOverride = Number(params.get("selftestTimeoutMs"));
const selftestTimeoutMs = Number.isFinite(selftestTimeoutOverride) && selftestTimeoutOverride > 0
  ? selftestTimeoutOverride
  : 20000;
let selftestRan = false;
let selftestStatusEl = null;
let selftestResolve = null;
const selftestPromise = isSelftest
  ? new Promise((resolve) => {
    selftestResolve = resolve;
  })
  : null;
let selftestDone = false;
let selftestTimeoutId = null;

if (isSelftest) {
  selftestStatusEl = document.createElement("div");
  selftestStatusEl.id = "selftest-status";
  selftestStatusEl.textContent = "selftest:pending";
  selftestStatusEl.style.display = "none";
  document.body.appendChild(selftestStatusEl);

  // Self-test Unit Tests
  try {
    const schematicApi = self.SpjutSimSchematic;
    if (schematicApi && typeof schematicApi.normalizeSpiceValue === "function") {
      const result = schematicApi.normalizeSpiceValue("1 M");
      if (result !== "1 Meg") {
        console.error(`Unit Test Fail: normalizeSpiceValue("1 M") returned "${result}", expected "1 Meg"`);
        setTimeout(() => finishSelftest("selftest:fail"), 100);
      } else {
        console.log("Unit Test Pass: normalizeSpiceValue('1 M') -> '1 Meg'");
      }
    }
  } catch (err) {
    console.error("Unit Test Error:", err);
  }
}

const workerScriptEl = document.getElementById("worker-script");
let worker = null;
if (workerScriptEl && workerScriptEl.textContent) {
  const workerBaseOverride = typeof window.SpjutSimWorkerBase === "string" ? window.SpjutSimWorkerBase : "";
  const spiceBaseOverride = typeof window.SpjutSimSpiceBase === "string" ? window.SpjutSimSpiceBase : "";
  const workerBase = (workerBaseOverride || new URL("./src/sim/", window.location.href).href).replace(/\/$/, "");
  const spiceBase = (spiceBaseOverride || new URL("./public/spice/", window.location.href).href).replace(/\/$/, "");
  const prelude = `self.SpjutSimWorkerBase = ${JSON.stringify(workerBase)};` +
    `self.SpjutSimSpiceBase = ${JSON.stringify(spiceBase)};`;
  const blob = new Blob([prelude, "\n", workerScriptEl.textContent], { type: "text/javascript" });
  const workerUrl = URL.createObjectURL(blob);
  worker = new Worker(workerUrl);
  URL.revokeObjectURL(workerUrl);
} else {
  worker = new Worker(`./src/sim/worker.js?v=${Date.now()}`);
}

ui = uiApi.createUI(root, state, {
  onInit: () => {
    setStatus("loading");
    const message = { type: "init" };
    worker.postMessage(message);
  },
  onRun: (netlist) => {
    setStatus("running");
    ui.setError(undefined);
    const message = { type: "run", kind: "op", netlist };
    worker.postMessage(message);
  },
  onRunDc: (netlist, signals) => {
    setStatus("running");
    ui.setError(undefined);
    const message = { type: "run", kind: "dc", netlist, signals };
    worker.postMessage(message);
  },
  onRunTran: (netlist, signals) => {
    setStatus("running");
    ui.setError(undefined);
    const message = { type: "run", kind: "tran", netlist, signals };
    worker.postMessage(message);
  },
  onRunAc: (netlist, signals) => {
    setStatus("running");
    ui.setError(undefined);
    const message = { type: "run", kind: "ac", netlist, signals };
    worker.postMessage(message);
  },
  onReset: () => {
    const shouldReinit = lastStatus === "error";
    ui.setError(undefined);
    ui.setLog([]);
    ui.setOpResults({ plot: "", nodes: [], currents: [] });
    ui.setDcResults({ x: [], traces: {}, signals: [], selected: [] });
    ui.setTranResults({ x: [], traces: {}, signals: [], selected: [] });
    ui.setAcResults({ freq: [], magnitude: {}, phase: {}, signals: [], selected: [] });
    if (shouldReinit) {
      setStatus("loading");
    } else {
      setStatus("ready");
    }
    worker.postMessage({ type: "reset" });
    if (shouldReinit) {
      worker.postMessage({ type: "init" });
    }
  }
});

if (typeof self !== "undefined") {
  const app = self.SpjutSimApp && typeof self.SpjutSimApp === "object" ? self.SpjutSimApp : {};
  app.ui = ui;
  app.state = state;
  self.SpjutSimApp = app;
  if (typeof self.dispatchEvent === "function" && typeof CustomEvent === "function") {
    self.dispatchEvent(new CustomEvent("spjutsim:ui-ready"));
  }
}

const reportSelftest = (status, details) => {
  if (!isSelftest) {
    return;
  }
  const payload = {
    status,
    details: details ?? {}
  };
  fetch("/__selftest__/report", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload),
    keepalive: true
  }).catch(() => { });
};

const finishSelftest = (status) => {
  if (!isSelftest || selftestDone) {
    return;
  }
  selftestDone = true;
  if (selftestTimeoutId) {
    clearTimeout(selftestTimeoutId);
    selftestTimeoutId = null;
  }
  if (selftestStatusEl) {
    selftestStatusEl.textContent = status;
  }
  const logText = document.querySelector(".log")?.textContent ?? "";
  const errorText = document.querySelector(".section")?.textContent?.trim() ?? "";
  reportSelftest(status, { log: logText, error: errorText });
  if (selftestResolve) {
    selftestResolve();
  }
};

worker.onerror = (event) => {
  setStatus("error");
  ui.setError("Worker failed to load. Check console for details.");
  ui.appendLog(`Worker error: ${event.message || "unknown error"}`);
  finishSelftest("selftest:fail");
};

worker.onmessageerror = () => {
  setStatus("error");
  ui.setError("Worker message error.");
  ui.appendLog("Worker message error.");
  finishSelftest("selftest:fail");
};

if (isSelftest) {
  ui.setLog([]);
  ui.setError(undefined);
  setStatus("loading");
  worker.postMessage({ type: "init" });
  selftestTimeoutId = setTimeout(() => {
    setStatus("error");
    ui.setError("Selftest timed out.");
    finishSelftest("selftest:fail");
  }, selftestTimeoutMs);
}

worker.onmessage = (event) => {
  const message = event.data;
  if (!message) {
    return;
  }

  if (message.type === "ready") {
    setStatus("ready");
    if (isSelftest && !selftestRan) {
      selftestRan = true;
      setStatus("running");
      worker.postMessage({ type: "run", kind: "op", netlist: ui.getNetlist() });
    }
    return;
  }

  if (message.type === "log") {
    ui.appendLog(message.text);
    return;
  }

  if (message.type === "result") {
    setStatus("ready");
    if (message.kind === "op" && message.data) {
      const opResults = parseOpResults(message.data);
      ui.setOpResults(opResults);
    }
    if (message.kind === "dc" && message.data) {
      ui.setDcResults(parseDcResults(message.data));
    }
    if (message.kind === "tran" && message.data) {
      ui.setTranResults(parseTranResults(message.data));
    }
    if (message.kind === "ac" && message.data) {
      ui.setAcResults(parseAcResults(message.data));
    }
    finishSelftest("selftest:pass");
    return;
  }

  if (message.type === "error") {
    setStatus("error");
    ui.setError(message.message);
    if (message.log) {
      ui.appendLog(message.log);
    }
    finishSelftest("selftest:fail");
  }
};

if (!isSelftest) {
  setStatus("loading");
  worker.postMessage({ type: "init" });
}

if (isSelftest && selftestPromise) {
  selftestPromise.then(() => { }).catch(() => { });
}
