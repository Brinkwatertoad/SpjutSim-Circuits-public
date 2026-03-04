/**
 * UI run-signature helpers.
 */
(function initUIRunSignatureModule() {
  const normalizeKind = (kind) => String(kind ?? "").trim().toLowerCase();

  const normalizeInput = (inputOrKind, compileInfo, signals) => {
    if (inputOrKind && typeof inputOrKind === "object" && !Array.isArray(inputOrKind)) {
      return {
        kind: inputOrKind.kind,
        compileInfo: inputOrKind.compileInfo,
        signals: inputOrKind.signals,
        simulationKindIds: inputOrKind.simulationKindIds,
        signaturesByKind: inputOrKind.signaturesByKind
      };
    }
    return {
      kind: inputOrKind,
      compileInfo,
      signals,
      simulationKindIds: undefined,
      signaturesByKind: undefined
    };
  };

  const stripEndDirective = (text) => {
    if (typeof text !== "string" || !text.trim()) {
      return "";
    }
    const lines = text.trim().split(/\r?\n/);
    if (lines.length && lines[lines.length - 1].trim().toLowerCase() === ".end") {
      lines.pop();
    }
    return lines.join("\n");
  };

  const normalizeNetlistForSignature = (netlist) => {
    if (typeof netlist !== "string") {
      return "";
    }
    return netlist
      .split(/\r?\n/)
      .map((line) => line.trim().replace(/\s+/g, " "))
      .filter((line) => line && line.toLowerCase() !== ".end")
      .join("\n");
  };

  const computeNetlistSignature = (netlist) => {
    const normalized = normalizeNetlistForSignature(netlist);
    let hash = 2166136261;
    for (let index = 0; index < normalized.length; index += 1) {
      hash ^= normalized.charCodeAt(index);
      hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
    }
    const unsigned = hash >>> 0;
    return `${normalized.length}:${unsigned.toString(16).padStart(8, "0")}`;
  };

  const normalizeRunRequestSignalsForSignature = (signals) => {
    if (!Array.isArray(signals) || !signals.length) {
      return [];
    }
    const seen = new Set();
    const normalized = [];
    signals.forEach((entry) => {
      const token = String(entry ?? "").trim().toLowerCase();
      if (!token || seen.has(token)) {
        return;
      }
      seen.add(token);
      normalized.push(token);
    });
    normalized.sort();
    return normalized;
  };

  const computeRunRequestSignature = (inputOrKind, compileInfo, signals) => {
    const args = normalizeInput(inputOrKind, compileInfo, signals);
    const normalizedKind = normalizeKind(args.kind);
    const netlistSignature = computeNetlistSignature(String(args.compileInfo?.netlist ?? ""));
    if (normalizedKind === "dc" || normalizedKind === "tran" || normalizedKind === "ac") {
      const normalizedSignals = normalizeRunRequestSignalsForSignature(args.signals);
      return `${netlistSignature}|signals=${normalizedSignals.join(",")}`;
    }
    return netlistSignature;
  };

  const rememberRunRequestSignature = (input) => {
    const args = normalizeInput(input);
    const normalizedKind = normalizeKind(args.kind);
    if (!args.signaturesByKind || typeof args.signaturesByKind !== "object") {
      return;
    }
    if (!(args.simulationKindIds instanceof Set) || !args.simulationKindIds.has(normalizedKind)) {
      return;
    }
    const signature = computeRunRequestSignature(normalizedKind, args.compileInfo, args.signals);
    args.signaturesByKind[normalizedKind] = signature;
  };

  const hasRunRequestChangedSinceLastRequest = (input) => {
    const args = normalizeInput(input);
    const normalizedKind = normalizeKind(args.kind);
    if (!(args.simulationKindIds instanceof Set) || !args.simulationKindIds.has(normalizedKind)) {
      return true;
    }
    const netlist = String(args.compileInfo?.netlist ?? "");
    if (!netlist.trim()) {
      return false;
    }
    const nextSignature = computeRunRequestSignature(normalizedKind, args.compileInfo, args.signals);
    const previousSignature = args.signaturesByKind?.[normalizedKind];
    return previousSignature !== nextSignature;
  };

  const applySourceOverride = (netlist, sourceId, sourceValue) => {
    if (typeof netlist !== "string") {
      return netlist;
    }
    const id = String(sourceId ?? "").trim();
    const value = String(sourceValue ?? "").trim();
    if (!id || !value) {
      return netlist;
    }
    const idLower = id.toLowerCase();
    let replaced = false;
    const lines = netlist.split(/\r?\n/).map((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("*") || trimmed.startsWith(".")) {
        return line;
      }
      const tokens = trimmed.split(/\s+/);
      if (tokens.length < 3) {
        return line;
      }
      if (tokens[0].toLowerCase() !== idLower) {
        return line;
      }
      replaced = true;
      const prefix = tokens.slice(0, 3).join(" ");
      return `${prefix} ${value}`;
    });
    return replaced ? lines.join("\n") : netlist;
  };

  if (typeof self !== "undefined") {
    self.SpjutSimUIRunSignature = {
      stripEndDirective,
      normalizeNetlistForSignature,
      computeNetlistSignature,
      normalizeRunRequestSignalsForSignature,
      computeRunRequestSignature,
      rememberRunRequestSignature,
      hasRunRequestChangedSinceLastRequest,
      applySourceOverride
    };
  }
})();
