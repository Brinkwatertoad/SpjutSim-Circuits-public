/**
 * UI inline editor panel construction helpers.
 */
(function initUIInlineEditorPanelModule() {
  const requireFunction = (value, name) => {
    if (typeof value !== "function") {
      throw new Error(`Inline editor panel module requires function '${name}'.`);
    }
    return value;
  };

  const requireSelectPropertyContract = (readProperty, key, name) => {
    const property = readProperty(key);
    if (!property || typeof property !== "object") {
      throw new Error(`Inline editor panel module requires '${name}(${key})' to return a property contract object.`);
    }
    const label = String(property.label ?? "").trim();
    if (!label) {
      throw new Error(`Inline editor panel module property contract '${name}' requires a non-empty label.`);
    }
    const rawOptions = Array.isArray(property.options) ? property.options : [];
    if (!rawOptions.length) {
      throw new Error(`Inline editor panel module property contract '${name}' requires one or more options.`);
    }
    const seenValues = new Set();
    const options = rawOptions.map((option, index) => {
      const fieldPath = `${name}.options[${index}]`;
      const value = String(option?.value ?? "").trim();
      const optionLabel = String(option?.label ?? "").trim();
      if (!value) {
        throw new Error(`Inline editor panel module property contract '${fieldPath}' requires a non-empty value.`);
      }
      if (!optionLabel) {
        throw new Error(`Inline editor panel module property contract '${fieldPath}' requires a non-empty label.`);
      }
      if (seenValues.has(value)) {
        throw new Error(`Inline editor panel module property contract '${name}' contains duplicate option value '${value}'.`);
      }
      seenValues.add(value);
      return { value, label: optionLabel };
    });
    return {
      key: String(property.key ?? "").trim(),
      label,
      options
    };
  };

  const createInlineSelectRow = (property, rowDatasetKey, selectDatasetKey) => {
    const row = document.createElement("label");
    row.className = "inline-edit-row";
    row.dataset[rowDatasetKey] = "1";
    const label = document.createElement("span");
    label.textContent = `${property.label}:`;
    const field = document.createElement("div");
    field.className = "inline-edit-field";
    const select = document.createElement("select");
    select.className = "schematic-prop-input";
    select.dataset[selectDatasetKey] = "1";
    property.options.forEach((entry) => {
      const option = document.createElement("option");
      option.value = entry.value;
      option.textContent = entry.label;
      select.appendChild(option);
    });
    field.append(select);
    row.append(label, field);
    return { row, label, select };
  };

  const requireTogglePropertyContract = (readProperty, key, name) => {
    const property = readProperty(key);
    if (!property || typeof property !== "object") {
      throw new Error(`Inline editor panel module requires '${name}(${key})' to return a property contract object.`);
    }
    const label = String(property.label ?? "").trim();
    if (!label) {
      throw new Error(`Inline editor panel module property contract '${name}' requires a non-empty label.`);
    }
    return {
      key: String(property.key ?? "").trim(),
      label
    };
  };

  const createInlineToggleRow = (property, rowDatasetKey, inputDatasetKey) => {
    const row = document.createElement("label");
    row.className = "inline-edit-row";
    row.dataset[rowDatasetKey] = "1";
    const label = document.createElement("span");
    label.textContent = `${property.label}:`;
    const field = document.createElement("div");
    field.className = "inline-edit-field inline-edit-checkbox-field";
    const input = document.createElement("input");
    input.type = "checkbox";
    input.className = "inline-edit-checkbox-input";
    input.dataset[inputDatasetKey] = "1";
    field.append(input);
    row.append(label, field);
    return { row, label, input };
  };
  const INPUT_PROPERTY_CONTROL_TYPES = Object.freeze({
    text: "text",
    number: "number",
    color: "color"
  });
  const requireInputPropertyContract = (readProperty, key, name) => {
    const property = readProperty(key);
    if (!property || typeof property !== "object") {
      throw new Error(`Inline editor panel module requires '${name}(${key})' to return a property contract object.`);
    }
    const label = String(property.label ?? "").trim();
    if (!label) {
      throw new Error(`Inline editor panel module property contract '${name}' requires a non-empty label.`);
    }
    const control = String(property.control ?? "").trim().toLowerCase();
    const inputType = INPUT_PROPERTY_CONTROL_TYPES[control];
    if (!inputType) {
      throw new Error(`Inline editor panel module property contract '${name}' requires a supported input control.`);
    }
    const input = property.input && typeof property.input === "object" && !Array.isArray(property.input)
      ? { ...property.input }
      : {};
    return {
      key: String(property.key ?? "").trim(),
      label,
      control,
      input
    };
  };
  const createInlineInputRow = (property, rowDatasetKey, inputDatasetKey) => {
    const row = document.createElement("label");
    row.className = "inline-edit-row";
    row.dataset[rowDatasetKey] = "1";
    const label = document.createElement("span");
    label.textContent = `${property.label}:`;
    const field = document.createElement("div");
    field.className = "inline-edit-field";
    const input = document.createElement("input");
    input.type = INPUT_PROPERTY_CONTROL_TYPES[property.control];
    input.className = "schematic-prop-input";
    input.dataset[inputDatasetKey] = "1";
    if (typeof property.input.placeholder === "string") {
      input.placeholder = property.input.placeholder;
    }
    if (property.control === "number") {
      const min = Number(property.input.min);
      const max = Number(property.input.max);
      const step = Number(property.input.step);
      if (Number.isFinite(min)) {
        input.min = String(min);
      }
      if (Number.isFinite(max)) {
        input.max = String(max);
      }
      if (Number.isFinite(step)) {
        input.step = String(step);
      }
    }
    field.append(input);
    row.append(label, field);
    return { row, label, input };
  };

  const normalizeInlineSelectPropertyKeys = (rawKeys) => {
    if (!Array.isArray(rawKeys) || !rawKeys.length) {
      throw new Error("Inline editor panel module requires one or more inline select property keys.");
    }
    const seen = new Set();
    return rawKeys.map((entry, index) => {
      const key = String(entry ?? "").trim();
      if (!key) {
        throw new Error(`Inline editor panel module received invalid inline select property key at index ${index}.`);
      }
      if (seen.has(key)) {
        throw new Error(`Inline editor panel module received duplicate inline select property key '${key}'.`);
      }
      seen.add(key);
      return key;
    });
  };

  const normalizeInlineTogglePropertyKeys = (rawKeys) => {
    if (!Array.isArray(rawKeys) || !rawKeys.length) {
      return [];
    }
    const seen = new Set();
    return rawKeys.map((entry, index) => {
      const key = String(entry ?? "").trim();
      if (!key) {
        throw new Error(`Inline editor panel module received invalid inline toggle property key at index ${index}.`);
      }
      if (seen.has(key)) {
        throw new Error(`Inline editor panel module received duplicate inline toggle property key '${key}'.`);
      }
      seen.add(key);
      return key;
    });
  };
  const normalizeInlineInputPropertyKeys = (rawKeys) => {
    if (!Array.isArray(rawKeys) || !rawKeys.length) {
      return [];
    }
    const seen = new Set();
    return rawKeys.map((entry, index) => {
      const key = String(entry ?? "").trim();
      if (!key) {
        throw new Error(`Inline editor panel module received invalid inline input property key at index ${index}.`);
      }
      if (seen.has(key)) {
        throw new Error(`Inline editor panel module received duplicate inline input property key '${key}'.`);
      }
      seen.add(key);
      return key;
    });
  };

  const getInlineSelectDatasetKeys = (key) => {
    const token = String(key ?? "").trim();
    if (!/^[A-Za-z][A-Za-z0-9]*$/.test(token)) {
      throw new Error(`Inline editor panel module cannot derive dataset keys from inline select property key '${token || "?"}'.`);
    }
    const suffix = `${token.charAt(0).toUpperCase()}${token.slice(1)}`;
    return {
      rowDatasetKey: `inline${suffix}Row`,
      selectDatasetKey: `inline${suffix}`
    };
  };

  const getInlineToggleDatasetKeys = (key) => {
    const token = String(key ?? "").trim();
    if (!/^[A-Za-z][A-Za-z0-9]*$/.test(token)) {
      throw new Error(`Inline editor panel module cannot derive dataset keys from inline toggle property key '${token || "?"}'.`);
    }
    const suffix = `${token.charAt(0).toUpperCase()}${token.slice(1)}`;
    return {
      rowDatasetKey: `inline${suffix}Row`,
      inputDatasetKey: `inline${suffix}`
    };
  };
  const getInlineInputDatasetKeys = (key) => {
    const token = String(key ?? "").trim();
    if (!/^[A-Za-z][A-Za-z0-9]*$/.test(token)) {
      throw new Error(`Inline editor panel module cannot derive dataset keys from inline input property key '${token || "?"}'.`);
    }
    const suffix = `${token.charAt(0).toUpperCase()}${token.slice(1)}`;
    return {
      rowDatasetKey: `inline${suffix}Row`,
      inputDatasetKey: `inline${suffix}`
    };
  };

  const createInlineEditorPanel = (input) => {
    const args = input && typeof input === "object" ? input : {};
    const createNetColorPicker = requireFunction(args.createNetColorPicker, "createNetColorPicker");
    const getDefaultTextStyle = requireFunction(args.getDefaultTextStyle, "getDefaultTextStyle");
    const listInlineSelectPropertyKeys = requireFunction(args.listInlineSelectPropertyKeys, "listInlineSelectPropertyKeys");
    const getSelectPropertyContract = requireFunction(args.getSelectPropertyContract, "getSelectPropertyContract");
    const listInlineTogglePropertyKeys = typeof args.listInlineTogglePropertyKeys === "function"
      ? args.listInlineTogglePropertyKeys
      : () => [];
    const getTogglePropertyContract = typeof args.getTogglePropertyContract === "function"
      ? args.getTogglePropertyContract
      : () => null;
    const listInlineInputPropertyKeys = typeof args.listInlineInputPropertyKeys === "function"
      ? args.listInlineInputPropertyKeys
      : () => [];
    const getInputPropertyContract = typeof args.getInputPropertyContract === "function"
      ? args.getInputPropertyContract
      : () => null;
    const inlineSelectPropertyKeys = normalizeInlineSelectPropertyKeys(listInlineSelectPropertyKeys());
    const inlineTogglePropertyKeys = normalizeInlineTogglePropertyKeys(listInlineTogglePropertyKeys());
    const inlineInputPropertyKeys = normalizeInlineInputPropertyKeys(listInlineInputPropertyKeys());
    const inlineSelectControlsByKey = Object.freeze(
      inlineSelectPropertyKeys.reduce((accumulator, key) => {
        const datasetKeys = getInlineSelectDatasetKeys(key);
        const property = requireSelectPropertyContract(
          getSelectPropertyContract,
          key,
          "getSelectPropertyContract"
        );
        const controls = createInlineSelectRow(property, datasetKeys.rowDatasetKey, datasetKeys.selectDatasetKey);
        accumulator[key] = Object.freeze({
          property,
          row: controls.row,
          label: controls.label,
          select: controls.select
        });
        return accumulator;
      }, {})
    );
    const inlineToggleControlsByKey = Object.freeze(
      inlineTogglePropertyKeys.reduce((accumulator, key) => {
        const datasetKeys = getInlineToggleDatasetKeys(key);
        const property = requireTogglePropertyContract(
          getTogglePropertyContract,
          key,
          "getTogglePropertyContract"
        );
        const controls = createInlineToggleRow(property, datasetKeys.rowDatasetKey, datasetKeys.inputDatasetKey);
        accumulator[key] = Object.freeze({
          property,
          row: controls.row,
          label: controls.label,
          input: controls.input
        });
        return accumulator;
      }, {})
    );
    const inlineInputControlsByKey = Object.freeze(
      inlineInputPropertyKeys.reduce((accumulator, key) => {
        const datasetKeys = getInlineInputDatasetKeys(key);
        const property = requireInputPropertyContract(
          getInputPropertyContract,
          key,
          "getInputPropertyContract"
        );
        const controls = createInlineInputRow(property, datasetKeys.rowDatasetKey, datasetKeys.inputDatasetKey);
        accumulator[key] = Object.freeze({
          property,
          row: controls.row,
          label: controls.label,
          input: controls.input
        });
        return accumulator;
      }, {})
    );
    Object.entries(inlineSelectControlsByKey).forEach(([key, entry]) => {
      if (!(entry?.row instanceof HTMLElement)) {
        throw new Error(`Inline editor panel module requires inline select row for property '${key || "?"}'.`);
      }
      if (!(entry?.select instanceof HTMLSelectElement)) {
        throw new Error(`Inline editor panel module requires inline select input for property '${key || "?"}'.`);
      }
    });
    Object.entries(inlineToggleControlsByKey).forEach(([key, entry]) => {
      if (!(entry?.row instanceof HTMLElement)) {
        throw new Error(`Inline editor panel module requires inline toggle row for property '${key || "?"}'.`);
      }
      if (!(entry?.input instanceof HTMLInputElement) || entry.input.type !== "checkbox") {
        throw new Error(`Inline editor panel module requires inline toggle checkbox input for property '${key || "?"}'.`);
      }
    });
    Object.values(inlineInputControlsByKey).forEach((entry) => {
      if (!(entry?.row instanceof HTMLElement)) {
        throw new Error("Inline editor panel module requires inline input row element.");
      }
      if (!(entry?.input instanceof HTMLInputElement)) {
        throw new Error("Inline editor panel module requires inline input element.");
      }
    });
    const onPickNetColor = typeof args.onPickNetColor === "function" ? args.onPickNetColor : () => { };

    const inlineEditor = document.createElement("div");
    inlineEditor.className = "inline-edit hidden";
    inlineEditor.dataset.inlineEdit = "component";
    inlineEditor.hidden = true;

    const inlineNameRow = document.createElement("label");
    inlineNameRow.className = "inline-edit-row";
    const inlineNameLabel = document.createElement("span");
    inlineNameLabel.textContent = "Name:";
    const inlineNameInput = document.createElement("input");
    inlineNameInput.type = "text";
    inlineNameInput.className = "schematic-prop-input";
    inlineNameInput.dataset.inlineProp = "name";
    const inlineNameField = document.createElement("div");
    inlineNameField.className = "inline-edit-field";
    inlineNameField.dataset.inlineField = "name";
    inlineNameField.append(inlineNameInput);
    inlineNameRow.append(inlineNameLabel, inlineNameField);

    const inlineValueRow = document.createElement("label");
    inlineValueRow.className = "inline-edit-row";
    const inlineValueLabel = document.createElement("span");
    inlineValueLabel.dataset.inlineValueLabel = "1";
    inlineValueLabel.textContent = "Value:";
    const inlineValueInput = document.createElement("input");
    inlineValueInput.type = "text";
    inlineValueInput.className = "schematic-prop-input";
    inlineValueInput.dataset.inlineProp = "value";
    const inlineValueUnit = document.createElement("span");
    inlineValueUnit.dataset.inlineValueUnit = "1";
    inlineValueUnit.className = "inline-edit-unit";
    const inlineValueField = document.createElement("div");
    inlineValueField.className = "inline-edit-field";
    inlineValueField.dataset.inlineField = "value";
    inlineValueField.append(inlineValueInput, inlineValueUnit);
    inlineValueRow.append(inlineValueLabel, inlineValueField);

    const inlineSwitchPositionRow = document.createElement("label");
    inlineSwitchPositionRow.className = "inline-edit-row";
    inlineSwitchPositionRow.dataset.inlineSwitchPositionRow = "1";
    const inlineSwitchPositionLabel = document.createElement("span");
    inlineSwitchPositionLabel.textContent = "Position:";
    const inlineSwitchPositionField = document.createElement("div");
    inlineSwitchPositionField.className = "inline-edit-field inline-switch-position-field";
    const inlineSwitchPositionGroup = document.createElement("div");
    inlineSwitchPositionGroup.className = "inline-switch-position-group";
    const inlineSwitchPositionA = document.createElement("button");
    inlineSwitchPositionA.type = "button";
    inlineSwitchPositionA.className = "inline-switch-position-button";
    inlineSwitchPositionA.dataset.inlineSwitchPosition = "A";
    inlineSwitchPositionA.textContent = "A";
    inlineSwitchPositionA.setAttribute("aria-pressed", "false");
    const inlineSwitchPositionB = document.createElement("button");
    inlineSwitchPositionB.type = "button";
    inlineSwitchPositionB.className = "inline-switch-position-button";
    inlineSwitchPositionB.dataset.inlineSwitchPosition = "B";
    inlineSwitchPositionB.textContent = "B";
    inlineSwitchPositionB.setAttribute("aria-pressed", "false");
    inlineSwitchPositionGroup.append(inlineSwitchPositionA, inlineSwitchPositionB);
    inlineSwitchPositionField.append(inlineSwitchPositionGroup);
    inlineSwitchPositionRow.append(inlineSwitchPositionLabel, inlineSwitchPositionField);

    const inlineSwitchRonRow = document.createElement("label");
    inlineSwitchRonRow.className = "inline-edit-row";
    const inlineSwitchRonLabel = document.createElement("span");
    inlineSwitchRonLabel.textContent = "Ron:";
    const inlineSwitchRonField = document.createElement("div");
    inlineSwitchRonField.className = "inline-edit-field";
    const inlineSwitchRonInput = document.createElement("input");
    inlineSwitchRonInput.type = "text";
    inlineSwitchRonInput.className = "schematic-prop-input";
    inlineSwitchRonInput.dataset.inlineSwitchRon = "1";
    const inlineSwitchRonUnit = document.createElement("span");
    inlineSwitchRonUnit.className = "inline-edit-unit";
    inlineSwitchRonUnit.dataset.inlineSwitchRonUnit = "1";
    inlineSwitchRonUnit.textContent = "\u03a9";
    inlineSwitchRonField.append(inlineSwitchRonInput, inlineSwitchRonUnit);
    inlineSwitchRonRow.append(inlineSwitchRonLabel, inlineSwitchRonField);

    const inlineSwitchRoffRow = document.createElement("label");
    inlineSwitchRoffRow.className = "inline-edit-row";
    const inlineSwitchRoffLabel = document.createElement("span");
    inlineSwitchRoffLabel.textContent = "Roff:";
    const inlineSwitchRoffField = document.createElement("div");
    inlineSwitchRoffField.className = "inline-edit-field";
    const inlineSwitchRoffInput = document.createElement("input");
    inlineSwitchRoffInput.type = "text";
    inlineSwitchRoffInput.className = "schematic-prop-input";
    inlineSwitchRoffInput.dataset.inlineSwitchRoff = "1";
    const inlineSwitchRoffUnit = document.createElement("span");
    inlineSwitchRoffUnit.className = "inline-edit-unit";
    inlineSwitchRoffUnit.dataset.inlineSwitchRoffUnit = "1";
    inlineSwitchRoffUnit.textContent = "\u03a9";
    inlineSwitchRoffField.append(inlineSwitchRoffInput, inlineSwitchRoffUnit);
    inlineSwitchRoffRow.append(inlineSwitchRoffLabel, inlineSwitchRoffField);

    const inlineSwitchShowRonRow = document.createElement("label");
    inlineSwitchShowRonRow.className = "inline-edit-row";
    const inlineSwitchShowRonLabel = document.createElement("span");
    inlineSwitchShowRonLabel.textContent = "Show Ron:";
    const inlineSwitchShowRonField = document.createElement("div");
    inlineSwitchShowRonField.className = "inline-edit-field inline-edit-checkbox-field";
    const inlineSwitchShowRonInput = document.createElement("input");
    inlineSwitchShowRonInput.type = "checkbox";
    inlineSwitchShowRonInput.className = "inline-edit-checkbox-input";
    inlineSwitchShowRonInput.dataset.inlineSwitchShowRon = "1";
    inlineSwitchShowRonField.append(inlineSwitchShowRonInput);
    inlineSwitchShowRonRow.append(inlineSwitchShowRonLabel, inlineSwitchShowRonField);

    const inlineSwitchShowRoffRow = document.createElement("label");
    inlineSwitchShowRoffRow.className = "inline-edit-row";
    const inlineSwitchShowRoffLabel = document.createElement("span");
    inlineSwitchShowRoffLabel.textContent = "Show Roff:";
    const inlineSwitchShowRoffField = document.createElement("div");
    inlineSwitchShowRoffField.className = "inline-edit-field inline-edit-checkbox-field";
    const inlineSwitchShowRoffInput = document.createElement("input");
    inlineSwitchShowRoffInput.type = "checkbox";
    inlineSwitchShowRoffInput.className = "inline-edit-checkbox-input";
    inlineSwitchShowRoffInput.dataset.inlineSwitchShowRoff = "1";
    inlineSwitchShowRoffField.append(inlineSwitchShowRoffInput);
    inlineSwitchShowRoffRow.append(inlineSwitchShowRoffLabel, inlineSwitchShowRoffField);

    const inlineProbeTypeRow = document.createElement("label");
    inlineProbeTypeRow.className = "inline-edit-row";
    inlineProbeTypeRow.dataset.inlineProbeTypeRow = "1";
    const inlineProbeTypeLabel = document.createElement("span");
    inlineProbeTypeLabel.textContent = "Probe type:";
    const inlineProbeTypeField = document.createElement("div");
    inlineProbeTypeField.className = "inline-edit-field";
    const inlineProbeTypeSelect = document.createElement("select");
    inlineProbeTypeSelect.className = "schematic-prop-input";
    inlineProbeTypeSelect.dataset.inlineProbeType = "1";
    [
      { value: "PV", label: "Voltage" },
      { value: "PI", label: "Current" },
      { value: "PP", label: "Power" }
    ].forEach((entry) => {
      const option = document.createElement("option");
      option.value = entry.value;
      option.textContent = entry.label;
      inlineProbeTypeSelect.appendChild(option);
    });
    inlineProbeTypeField.append(inlineProbeTypeSelect);
    inlineProbeTypeRow.append(inlineProbeTypeLabel, inlineProbeTypeField);

    const inlineSelectRows = inlineSelectPropertyKeys.map((key) => inlineSelectControlsByKey[key].row);
    const inlineToggleRows = inlineTogglePropertyKeys.map((key) => inlineToggleControlsByKey[key].row);
    const inlineInputRows = inlineInputPropertyKeys.map((key) => inlineInputControlsByKey[key].row);

    const inlineBoxThicknessRow = document.createElement("label");
    inlineBoxThicknessRow.className = "inline-edit-row";
    inlineBoxThicknessRow.dataset.inlineBoxThicknessRow = "1";
    const inlineBoxThicknessLabel = document.createElement("span");
    inlineBoxThicknessLabel.textContent = "Thickness:";
    const inlineBoxThicknessField = document.createElement("div");
    inlineBoxThicknessField.className = "inline-edit-field";
    const inlineBoxThicknessInput = document.createElement("input");
    inlineBoxThicknessInput.type = "number";
    inlineBoxThicknessInput.min = "1";
    inlineBoxThicknessInput.max = "12";
    inlineBoxThicknessInput.step = "1";
    inlineBoxThicknessInput.className = "schematic-prop-input";
    inlineBoxThicknessInput.dataset.inlineBoxThickness = "1";
    const inlineBoxThicknessUnit = document.createElement("span");
    inlineBoxThicknessUnit.className = "inline-edit-unit";
    inlineBoxThicknessUnit.dataset.inlineBoxThicknessUnit = "1";
    inlineBoxThicknessUnit.textContent = "";
    inlineBoxThicknessField.append(inlineBoxThicknessInput, inlineBoxThicknessUnit);
    inlineBoxThicknessRow.append(inlineBoxThicknessLabel, inlineBoxThicknessField);

    const inlineBoxLineTypeRow = document.createElement("label");
    inlineBoxLineTypeRow.className = "inline-edit-row";
    inlineBoxLineTypeRow.dataset.inlineBoxLineTypeRow = "1";
    const inlineBoxLineTypeLabel = document.createElement("span");
    inlineBoxLineTypeLabel.textContent = "Line:";
    const inlineBoxLineTypeField = document.createElement("div");
    inlineBoxLineTypeField.className = "inline-edit-field";
    const inlineBoxLineTypeSelect = document.createElement("select");
    inlineBoxLineTypeSelect.className = "schematic-prop-input";
    inlineBoxLineTypeSelect.dataset.inlineBoxLineType = "1";
    [
      { value: "solid", label: "Solid" },
      { value: "dashed", label: "Dashed" },
      { value: "dotted", label: "Dotted" }
    ].forEach((entry) => {
      const option = document.createElement("option");
      option.value = entry.value;
      option.textContent = entry.label;
      inlineBoxLineTypeSelect.appendChild(option);
    });
    inlineBoxLineTypeField.append(inlineBoxLineTypeSelect);
    inlineBoxLineTypeRow.append(inlineBoxLineTypeLabel, inlineBoxLineTypeField);

    const inlineBoxFillEnabledRow = document.createElement("label");
    inlineBoxFillEnabledRow.className = "inline-edit-row";
    inlineBoxFillEnabledRow.dataset.inlineBoxFillEnabledRow = "1";
    const inlineBoxFillEnabledLabel = document.createElement("span");
    inlineBoxFillEnabledLabel.textContent = "Fill:";
    const inlineBoxFillEnabledField = document.createElement("div");
    inlineBoxFillEnabledField.className = "inline-edit-field inline-edit-checkbox-field";
    const inlineBoxFillEnabledInput = document.createElement("input");
    inlineBoxFillEnabledInput.type = "checkbox";
    inlineBoxFillEnabledInput.className = "inline-edit-checkbox-input";
    inlineBoxFillEnabledInput.dataset.inlineBoxFillEnabled = "1";
    inlineBoxFillEnabledField.append(inlineBoxFillEnabledInput);
    inlineBoxFillEnabledRow.append(inlineBoxFillEnabledLabel, inlineBoxFillEnabledField);

    const inlineBoxFillColorRow = document.createElement("label");
    inlineBoxFillColorRow.className = "inline-edit-row";
    inlineBoxFillColorRow.dataset.inlineBoxFillColorRow = "1";
    const inlineBoxFillColorLabel = document.createElement("span");
    inlineBoxFillColorLabel.textContent = "Fill color:";
    const inlineBoxFillColorField = document.createElement("div");
    inlineBoxFillColorField.className = "inline-edit-field";
    const inlineBoxFillColorInput = document.createElement("input");
    inlineBoxFillColorInput.type = "color";
    inlineBoxFillColorInput.className = "schematic-prop-input";
    inlineBoxFillColorInput.dataset.inlineBoxFillColor = "1";
    inlineBoxFillColorInput.value = "#d8d1c6";
    inlineBoxFillColorField.append(inlineBoxFillColorInput);
    inlineBoxFillColorRow.append(inlineBoxFillColorLabel, inlineBoxFillColorField);

    const inlineBoxOpacityRow = document.createElement("label");
    inlineBoxOpacityRow.className = "inline-edit-row";
    inlineBoxOpacityRow.dataset.inlineBoxOpacityRow = "1";
    const inlineBoxOpacityLabel = document.createElement("span");
    inlineBoxOpacityLabel.textContent = "Opacity:";
    const inlineBoxOpacityField = document.createElement("div");
    inlineBoxOpacityField.className = "inline-edit-field";
    const inlineBoxOpacityInput = document.createElement("input");
    inlineBoxOpacityInput.type = "range";
    inlineBoxOpacityInput.min = "0";
    inlineBoxOpacityInput.max = "100";
    inlineBoxOpacityInput.step = "1";
    inlineBoxOpacityInput.className = "schematic-prop-input";
    inlineBoxOpacityInput.dataset.inlineBoxOpacity = "1";
    inlineBoxOpacityInput.value = "100";
    const inlineBoxOpacityValue = document.createElement("span");
    inlineBoxOpacityValue.className = "inline-edit-unit";
    inlineBoxOpacityValue.dataset.inlineBoxOpacityValue = "1";
    inlineBoxOpacityValue.textContent = "100%";
    inlineBoxOpacityField.append(inlineBoxOpacityInput, inlineBoxOpacityValue);
    inlineBoxOpacityRow.append(inlineBoxOpacityLabel, inlineBoxOpacityField);

    const inlineNetColorPicker = createNetColorPicker({
      rowAttribute: "data-inline-net-color-row",
      swatchAttribute: "data-inline-net-color",
      onPick: (color) => {
        onPickNetColor(color);
      }
    });

    const inlineTextFontControls = inlineSelectControlsByKey.textFont;
    if (!inlineTextFontControls
      || !(inlineTextFontControls.row instanceof HTMLElement)
      || !(inlineTextFontControls.label instanceof HTMLElement)
      || !(inlineTextFontControls.select instanceof HTMLSelectElement)) {
      throw new Error("Inline editor panel module requires inline textFont select controls.");
    }
    const inlineTextBoldControls = inlineToggleControlsByKey.textBold;
    if (!inlineTextBoldControls
      || !(inlineTextBoldControls.row instanceof HTMLElement)
      || !(inlineTextBoldControls.label instanceof HTMLElement)
      || !(inlineTextBoldControls.input instanceof HTMLInputElement)
      || inlineTextBoldControls.input.type !== "checkbox") {
      throw new Error("Inline editor panel module requires inline textBold toggle controls.");
    }
    const inlineTextItalicControls = inlineToggleControlsByKey.textItalic;
    if (!inlineTextItalicControls
      || !(inlineTextItalicControls.row instanceof HTMLElement)
      || !(inlineTextItalicControls.label instanceof HTMLElement)
      || !(inlineTextItalicControls.input instanceof HTMLInputElement)
      || inlineTextItalicControls.input.type !== "checkbox") {
      throw new Error("Inline editor panel module requires inline textItalic toggle controls.");
    }
    const inlineTextUnderlineControls = inlineToggleControlsByKey.textUnderline;
    if (!inlineTextUnderlineControls
      || !(inlineTextUnderlineControls.row instanceof HTMLElement)
      || !(inlineTextUnderlineControls.label instanceof HTMLElement)
      || !(inlineTextUnderlineControls.input instanceof HTMLInputElement)
      || inlineTextUnderlineControls.input.type !== "checkbox") {
      throw new Error("Inline editor panel module requires inline textUnderline toggle controls.");
    }
    const inlineTextFontRow = inlineTextFontControls.row;
    const inlineTextFontLabel = inlineTextFontControls.label;
    const inlineTextFontSelect = inlineTextFontControls.select;
    const inlineTextBoldRow = inlineTextBoldControls.row;
    const inlineTextBoldLabel = inlineTextBoldControls.label;
    const inlineTextBoldInput = inlineTextBoldControls.input;
    const inlineTextItalicRow = inlineTextItalicControls.row;
    const inlineTextItalicLabel = inlineTextItalicControls.label;
    const inlineTextItalicInput = inlineTextItalicControls.input;
    const inlineTextUnderlineRow = inlineTextUnderlineControls.row;
    const inlineTextUnderlineLabel = inlineTextUnderlineControls.label;
    const inlineTextUnderlineInput = inlineTextUnderlineControls.input;
    const inlineTextSizeControls = inlineInputControlsByKey.textSize;
    if (!inlineTextSizeControls
      || !(inlineTextSizeControls.row instanceof HTMLElement)
      || !(inlineTextSizeControls.label instanceof HTMLElement)
      || !(inlineTextSizeControls.input instanceof HTMLInputElement)
      || inlineTextSizeControls.input.type !== "number") {
      throw new Error("Inline editor panel module requires inline textSize input controls.");
    }
    const inlineTextSizeRow = inlineTextSizeControls.row;
    const inlineTextSizeLabel = inlineTextSizeControls.label;
    const inlineTextSizeInput = inlineTextSizeControls.input;

    const defaultTextStyle = getDefaultTextStyle();
    inlineTextFontSelect.value = defaultTextStyle.font;
    inlineTextSizeInput.value = String(defaultTextStyle.size);
    inlineTextBoldInput.checked = defaultTextStyle.bold;
    inlineTextItalicInput.checked = defaultTextStyle.italic;
    inlineTextUnderlineInput.checked = defaultTextStyle.underline;

    const inlineNetColorLabel = inlineNetColorPicker.row.querySelector("span");
    const inlineSelectLabels = Object.values(inlineSelectControlsByKey).map((entry) => entry.label);
    const inlineToggleLabels = Object.values(inlineToggleControlsByKey).map((entry) => entry.label);
    const inlineInputLabels = Object.values(inlineInputControlsByKey).map((entry) => entry.label);
    const syncInlineLabelColumnWidth = () => {
      const labels = [
        inlineNameLabel,
        inlineProbeTypeLabel,
        inlineValueLabel,
        inlineSwitchPositionLabel,
        inlineSwitchRonLabel,
        inlineSwitchRoffLabel,
        inlineSwitchShowRonLabel,
        inlineSwitchShowRoffLabel,
        ...inlineSelectLabels,
        ...inlineToggleLabels,
        ...inlineInputLabels,
        inlineBoxThicknessLabel,
        inlineBoxLineTypeLabel,
        inlineBoxFillEnabledLabel,
        inlineBoxFillColorLabel,
        inlineBoxOpacityLabel,
        inlineNetColorLabel
      ];
      let maxTextWidth = 0;
      labels.forEach((label) => {
        if (!(label instanceof HTMLElement)) {
          return;
        }
        const row = label.closest(".inline-edit-row");
        if (row instanceof HTMLElement && row.hidden) {
          return;
        }
        const range = document.createRange();
        range.selectNodeContents(label);
        const width = range.getBoundingClientRect().width;
        if (Number.isFinite(width) && width > maxTextWidth) {
          maxTextWidth = width;
        }
      });
      if (maxTextWidth <= 0) {
        inlineEditor.style.removeProperty("--inline-edit-label-width");
        return;
      }
      const columnWidth = Math.max(40, Math.ceil(maxTextWidth + 2));
      inlineEditor.style.setProperty("--inline-edit-label-width", `${columnWidth}px`);
    };

    inlineProbeTypeRow.hidden = true;
    Object.values(inlineSelectControlsByKey).forEach((entry) => {
      entry.row.hidden = true;
    });
    Object.values(inlineToggleControlsByKey).forEach((entry) => {
      entry.row.hidden = true;
    });
    Object.values(inlineInputControlsByKey).forEach((entry) => {
      entry.row.hidden = true;
    });
    inlineSwitchPositionRow.hidden = true;
    inlineSwitchRonRow.hidden = true;
    inlineSwitchRoffRow.hidden = true;
    inlineSwitchShowRonRow.hidden = true;
    inlineSwitchShowRoffRow.hidden = true;
    inlineBoxThicknessRow.hidden = true;
    inlineBoxLineTypeRow.hidden = true;
    inlineBoxFillEnabledRow.hidden = true;
    inlineBoxFillColorRow.hidden = true;
    inlineBoxOpacityRow.hidden = true;
    inlineNetColorPicker.row.hidden = true;

    inlineEditor.append(
      inlineNameRow,
      inlineProbeTypeRow,
      ...inlineSelectRows,
      inlineValueRow,
      inlineBoxThicknessRow,
      inlineBoxLineTypeRow,
      inlineBoxFillEnabledRow,
      inlineBoxFillColorRow,
      inlineBoxOpacityRow,
      inlineSwitchPositionRow,
      inlineSwitchRonRow,
      inlineSwitchRoffRow,
      inlineSwitchShowRonRow,
      inlineSwitchShowRoffRow,
      inlineNetColorPicker.row,
      ...inlineToggleRows,
      ...inlineInputRows
    );

    return {
      root: inlineEditor,
      inlineNameRow,
      inlineNameLabel,
      inlineNameInput,
      inlineValueRow,
      inlineValueLabel,
      inlineValueInput,
      inlineValueUnit,
      inlineSwitchPositionRow,
      inlineSwitchPositionLabel,
      inlineSwitchPositionA,
      inlineSwitchPositionB,
      inlineSwitchRonRow,
      inlineSwitchRonLabel,
      inlineSwitchRonInput,
      inlineSwitchRonUnit,
      inlineSwitchRoffRow,
      inlineSwitchRoffLabel,
      inlineSwitchRoffInput,
      inlineSwitchRoffUnit,
      inlineSwitchShowRonRow,
      inlineSwitchShowRonLabel,
      inlineSwitchShowRonInput,
      inlineSwitchShowRoffRow,
      inlineSwitchShowRoffLabel,
      inlineSwitchShowRoffInput,
      inlineProbeTypeRow,
      inlineProbeTypeLabel,
      inlineProbeTypeSelect,
      inlineSelectControlsByKey,
      inlineToggleControlsByKey,
      inlineInputControlsByKey,
      inlineBoxThicknessRow,
      inlineBoxThicknessLabel,
      inlineBoxThicknessUnit,
      inlineBoxThicknessInput,
      inlineBoxLineTypeRow,
      inlineBoxLineTypeLabel,
      inlineBoxLineTypeSelect,
      inlineBoxFillEnabledRow,
      inlineBoxFillEnabledLabel,
      inlineBoxFillEnabledInput,
      inlineBoxFillColorRow,
      inlineBoxFillColorLabel,
      inlineBoxFillColorInput,
      inlineBoxOpacityRow,
      inlineBoxOpacityLabel,
      inlineBoxOpacityInput,
      inlineBoxOpacityValue,
      inlineNetColorPicker,
      inlineTextFontRow,
      inlineTextFontLabel,
      inlineTextFontSelect,
      inlineTextSizeRow,
      inlineTextSizeLabel,
      inlineTextSizeInput,
      inlineTextBoldRow,
      inlineTextBoldLabel,
      inlineTextBoldInput,
      inlineTextItalicRow,
      inlineTextItalicLabel,
      inlineTextItalicInput,
      inlineTextUnderlineRow,
      inlineTextUnderlineLabel,
      inlineTextUnderlineInput,
      syncInlineLabelColumnWidth
    };
  };

  if (typeof self !== "undefined") {
    self.SpjutSimUIInlineEditorPanel = {
      createInlineEditorPanel
    };
  }
})();
