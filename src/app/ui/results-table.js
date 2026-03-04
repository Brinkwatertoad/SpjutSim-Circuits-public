/**
 * UI helpers for results table formatting, rendering, and highlight interactions.
 */
(function initUIResultsTableModule() {
  const resolveOpResultDisplayName = (input = {}) => {
    const rawName = String(input.signalName ?? "").trim();
    if (!rawName) {
      return "";
    }
    const normalizeSignalToken = typeof input.normalizeSignalToken === "function"
      ? input.normalizeSignalToken
      : null;
    const formatSignalLabel = typeof input.formatSignalLabel === "function"
      ? input.formatSignalLabel
      : null;
    const parseVoltageSignalToken = typeof input.parseVoltageSignalToken === "function"
      ? input.parseVoltageSignalToken
      : null;
    if (!normalizeSignalToken || !formatSignalLabel || !parseVoltageSignalToken) {
      throw new Error("UI results-table resolveOpResultDisplayName requires signal helpers.");
    }
    const rowKind = String(input.rowKind ?? "").trim();
    const token = normalizeSignalToken(rawName);
    const casedName = token
      ? (input.signalCaseMap?.get?.(token) ?? rawName)
      : rawName;
    if (rowKind === "op-node") {
      const parsed = parseVoltageSignalToken(casedName, { preserveCase: true });
      return parsed ? formatSignalLabel(casedName) : formatSignalLabel(`v(${casedName})`);
    }
    return formatSignalLabel(casedName);
  };

  const formatRows = (input = {}) => {
    const rows = Array.isArray(input.rows) ? input.rows : [];
    const normalizeSignalToken = typeof input.normalizeSignalToken === "function"
      ? input.normalizeSignalToken
      : null;
    const resolveDisplayName = typeof input.resolveOpResultDisplayName === "function"
      ? input.resolveOpResultDisplayName
      : null;
    if (!normalizeSignalToken || !resolveDisplayName) {
      throw new Error("UI results-table formatRows requires normalizeSignalToken and resolveOpResultDisplayName.");
    }
    const rowKind = String(input.rowKind ?? "").trim();
    return rows.map((row) => {
      const signalName = String(row?.name ?? "").trim();
      return {
        name: resolveDisplayName({
          signalName,
          rowKind,
          signalCaseMap: input.signalCaseMap
        }),
        value: row?.value,
        signalToken: normalizeSignalToken(signalName),
        rowKind,
        signalColor: input.colorMap?.get?.(signalName) ?? ""
      };
    });
  };

  const getResultRowSignalTokens = (input = {}) => {
    const row = input.row;
    const normalizeStoredRowToken = typeof input.normalizeStoredRowToken === "function"
      ? input.normalizeStoredRowToken
      : null;
    const normalizeStoredRowTokenList = typeof input.normalizeStoredRowTokenList === "function"
      ? input.normalizeStoredRowTokenList
      : null;
    if (!(row instanceof HTMLElement)) {
      return [];
    }
    if (!normalizeStoredRowToken || !normalizeStoredRowTokenList) {
      throw new Error("UI results-table getResultRowSignalTokens requires row-token normalizers.");
    }
    const multi = String(row.dataset.resultsSignalTokens ?? "").trim();
    if (multi) {
      return normalizeStoredRowTokenList(multi.split(/\s+/));
    }
    const single = String(row.dataset.resultsSignalToken ?? "").trim();
    if (!single) {
      return [];
    }
    const token = normalizeStoredRowToken(single);
    return token ? [token] : [];
  };

  const rowMatchesSelectedSignals = (input = {}) => {
    const tokens = getResultRowSignalTokens(input);
    const active = input.activeTraceSelectionTokens instanceof Set
      ? input.activeTraceSelectionTokens
      : new Set();
    return tokens.some((token) => active.has(token));
  };

  const rowMatchesHoverSignals = (input = {}) => {
    const tokens = getResultRowSignalTokens(input);
    const active = input.activeTraceHoverTokens instanceof Set
      ? input.activeTraceHoverTokens
      : new Set();
    return tokens.some((token) => active.has(token));
  };

  const rowMatchesSelectedMeasurement = (input = {}) => {
    const row = input.row;
    if (!(row instanceof HTMLElement)) {
      return false;
    }
    const measurementId = String(row.dataset.measurementId ?? "").trim();
    const schematicSelectionId = input.schematicSelectionId;
    return Boolean(
      measurementId
      && schematicSelectionId
      && String(schematicSelectionId) === measurementId
    );
  };

  const applyResultsSignalHighlights = (input = {}) => {
    const root = input.root && typeof input.root.querySelectorAll === "function"
      ? input.root
      : (typeof document !== "undefined" ? document : null);
    if (!root) {
      throw new Error("UI results-table applyResultsSignalHighlights requires a DOM root.");
    }
    const rows = root.querySelectorAll("[data-results-signal-token], [data-results-signal-tokens], .measurement-row[data-measurement-id]");
    rows.forEach((row) => {
      if (!(row instanceof HTMLElement)) {
        return;
      }
      const rowArgs = {
        row,
        normalizeStoredRowToken: input.normalizeStoredRowToken,
        normalizeStoredRowTokenList: input.normalizeStoredRowTokenList
      };
      const isSelected = rowMatchesSelectedSignals({
        ...rowArgs,
        activeTraceSelectionTokens: input.activeTraceSelectionTokens
      }) || rowMatchesSelectedMeasurement({
        row,
        schematicSelectionId: input.schematicSelectionId
      });
      const isHover = !isSelected && rowMatchesHoverSignals({
        ...rowArgs,
        activeTraceHoverTokens: input.activeTraceHoverTokens
      });
      row.classList.toggle("active", isSelected);
      row.classList.toggle("hover", isHover);
    });
  };

  const bindSignalResultRow = (input = {}) => {
    const rowEl = input.rowEl;
    const normalizeStoredRowTokenList = typeof input.normalizeStoredRowTokenList === "function"
      ? input.normalizeStoredRowTokenList
      : null;
    if (!(rowEl instanceof HTMLElement)) {
      return [];
    }
    if (!normalizeStoredRowTokenList) {
      throw new Error("UI results-table bindSignalResultRow requires normalizeStoredRowTokenList.");
    }
    const tokens = normalizeStoredRowTokenList(input.signalTokens);
    if (tokens.length) {
      rowEl.dataset.resultsSignalTokens = tokens.join(" ");
      if (tokens.length === 1) {
        rowEl.dataset.resultsSignalToken = tokens[0];
      }
    } else {
      delete rowEl.dataset.resultsSignalTokens;
      delete rowEl.dataset.resultsSignalToken;
    }
    const activeSelection = input.activeTraceSelectionTokens instanceof Set
      ? input.activeTraceSelectionTokens
      : new Set();
    const activeHover = input.activeTraceHoverTokens instanceof Set
      ? input.activeTraceHoverTokens
      : new Set();
    const isSelectedMatch = () => tokens.length && tokens.some((token) => activeSelection.has(token));
    const isHoverMatch = () => tokens.length && tokens.some((token) => activeHover.has(token));
    const isForcedSelected = () => {
      const selectedFn = typeof input.isSelected === "function" ? input.isSelected : null;
      return selectedFn ? Boolean(selectedFn()) : false;
    };
    const applyState = () => {
      const selected = isForcedSelected() || isSelectedMatch();
      const hover = !selected && isHoverMatch();
      rowEl.classList.toggle("active", selected);
      rowEl.classList.toggle("hover", hover);
    };
    applyState();
    if (tokens.length) {
      rowEl.addEventListener("mouseenter", () => {
        if (typeof input.onHoverSignals === "function") {
          input.onHoverSignals(tokens);
        }
      });
      rowEl.addEventListener("mouseleave", () => {
        if (typeof input.onHoverSignals === "function") {
          input.onHoverSignals([]);
        }
      });
    }
    if (typeof input.onClick === "function") {
      rowEl.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        input.onClick(event, tokens);
      });
    }
    return tokens;
  };

  const renderTable = (input = {}) => {
    const table = input.table;
    if (!(table instanceof HTMLTableElement)) {
      throw new Error("UI results-table renderTable requires table.");
    }
    const normalizeSignalToken = typeof input.normalizeSignalToken === "function"
      ? input.normalizeSignalToken
      : null;
    const formatResultsDisplayValue = typeof input.formatResultsDisplayValue === "function"
      ? input.formatResultsDisplayValue
      : null;
    const normalizeHexColor = typeof input.normalizeHexColor === "function"
      ? input.normalizeHexColor
      : (() => "");
    const bindRow = typeof input.bindSignalResultRow === "function"
      ? input.bindSignalResultRow
      : null;
    if (!normalizeSignalToken || !formatResultsDisplayValue || !bindRow) {
      throw new Error("UI results-table renderTable requires normalizeSignalToken, formatResultsDisplayValue, and bindSignalResultRow.");
    }
    const rows = Array.isArray(input.rows) ? input.rows : [];
    const [nameHeaderText, valueHeaderText] = Array.isArray(input.headers) && input.headers.length >= 2
      ? input.headers
      : ["Name", "Value"];
    const doc = table.ownerDocument ?? (typeof document !== "undefined" ? document : null);
    if (!doc) {
      throw new Error("UI results-table renderTable could not resolve ownerDocument.");
    }
    table.innerHTML = "";
    const thead = doc.createElement("thead");
    const headRow = doc.createElement("tr");
    const nameHeader = doc.createElement("th");
    nameHeader.textContent = nameHeaderText;
    const valueHeader = doc.createElement("th");
    valueHeader.textContent = valueHeaderText;
    headRow.append(nameHeader, valueHeader);
    thead.appendChild(headRow);

    const tbody = doc.createElement("tbody");
    if (!rows.length) {
      const emptyRow = doc.createElement("tr");
      const emptyCell = doc.createElement("td");
      emptyCell.colSpan = 2;
      emptyCell.textContent = "No data";
      emptyRow.appendChild(emptyCell);
      tbody.appendChild(emptyRow);
    } else {
      rows.forEach((row) => {
        const tr = doc.createElement("tr");
        const signalToken = String(row?.signalToken ?? normalizeSignalToken(row?.name)).trim();
        const rowKind = String(row?.rowKind ?? "").trim();
        if (rowKind) {
          tr.dataset.resultsRowKind = rowKind;
        }
        if (signalToken) {
          bindRow({
            rowEl: tr,
            signalTokens: [signalToken],
            onClick: (event, signals) => {
              if (!signals.length) {
                return;
              }
              if (typeof input.onSignalClick === "function") {
                input.onSignalClick(signals, event);
              }
            }
          });
        }
        const nameCell = doc.createElement("td");
        const rowColor = normalizeHexColor(row?.signalColor);
        if (rowColor) {
          tr.style.setProperty("--results-row-color", rowColor);
          const swatch = doc.createElement("span");
          swatch.className = "results-row-swatch";
          const label = doc.createElement("span");
          label.className = "results-row-name";
          label.textContent = String(row?.name ?? "");
          nameCell.className = "results-name-cell";
          nameCell.append(swatch, label);
        } else {
          nameCell.textContent = String(row?.name ?? "");
        }
        const valueCell = doc.createElement("td");
        valueCell.textContent = formatResultsDisplayValue(row?.value);
        tr.append(nameCell, valueCell);
        tbody.appendChild(tr);
      });
    }
    table.append(thead, tbody);
  };

  if (typeof self !== "undefined") {
    self.SpjutSimUIResultsTable = {
      resolveOpResultDisplayName,
      formatRows,
      getResultRowSignalTokens,
      rowMatchesSelectedSignals,
      rowMatchesHoverSignals,
      rowMatchesSelectedMeasurement,
      applyResultsSignalHighlights,
      bindSignalResultRow,
      renderTable
    };
  }
})();
