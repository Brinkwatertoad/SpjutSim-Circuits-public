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

  const createInlineEditorPanel = (input) => {
    const args = input && typeof input === "object" ? input : {};
    const createNetColorPicker = requireFunction(args.createNetColorPicker, "createNetColorPicker");
    const getTextFontOptions = requireFunction(args.getTextFontOptions, "getTextFontOptions");
    const getDefaultTextStyle = requireFunction(args.getDefaultTextStyle, "getDefaultTextStyle");
    const listGroundVariantValues = requireFunction(args.listGroundVariantValues, "listGroundVariantValues");
    const listResistorStyleValues = requireFunction(args.listResistorStyleValues, "listResistorStyleValues");
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
    inlineSwitchRonField.append(inlineSwitchRonInput);
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
    inlineSwitchRoffField.append(inlineSwitchRoffInput);
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

    const inlineGroundVariantRow = document.createElement("label");
    inlineGroundVariantRow.className = "inline-edit-row";
    inlineGroundVariantRow.dataset.inlineGroundVariantRow = "1";
    const inlineGroundVariantLabel = document.createElement("span");
    inlineGroundVariantLabel.textContent = "Ground:";
    const inlineGroundVariantField = document.createElement("div");
    inlineGroundVariantField.className = "inline-edit-field";
    const inlineGroundVariantSelect = document.createElement("select");
    inlineGroundVariantSelect.className = "schematic-prop-input";
    inlineGroundVariantSelect.dataset.inlineGroundVariant = "1";
    const groundVariantLabelByValue = Object.freeze({
      earth: "Earth",
      chassis: "Chassis",
      signal: "Signal Ground"
    });
    listGroundVariantValues().forEach((variant) => {
      const option = document.createElement("option");
      option.value = variant;
      option.textContent = groundVariantLabelByValue[variant] ?? variant;
      inlineGroundVariantSelect.appendChild(option);
    });
    inlineGroundVariantField.append(inlineGroundVariantSelect);
    inlineGroundVariantRow.append(inlineGroundVariantLabel, inlineGroundVariantField);

    const inlineResistorStyleRow = document.createElement("label");
    inlineResistorStyleRow.className = "inline-edit-row";
    inlineResistorStyleRow.dataset.inlineResistorStyleRow = "1";
    const inlineResistorStyleLabel = document.createElement("span");
    inlineResistorStyleLabel.textContent = "Style:";
    const inlineResistorStyleField = document.createElement("div");
    inlineResistorStyleField.className = "inline-edit-field";
    const inlineResistorStyleSelect = document.createElement("select");
    inlineResistorStyleSelect.className = "schematic-prop-input";
    inlineResistorStyleSelect.dataset.inlineResistorStyle = "1";
    const resistorStyleLabelByValue = Object.freeze({
      zigzag: "Zigzag",
      box: "Box"
    });
    listResistorStyleValues().forEach((style) => {
      const option = document.createElement("option");
      option.value = style;
      option.textContent = resistorStyleLabelByValue[style] ?? style;
      inlineResistorStyleSelect.appendChild(option);
    });
    inlineResistorStyleField.append(inlineResistorStyleSelect);
    inlineResistorStyleRow.append(inlineResistorStyleLabel, inlineResistorStyleField);

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

    const inlineTextOnlyRow = document.createElement("label");
    inlineTextOnlyRow.className = "inline-edit-row";
    inlineTextOnlyRow.dataset.inlineNetTextOnlyRow = "1";
    const inlineTextOnlyLabel = document.createElement("span");
    inlineTextOnlyLabel.textContent = "Text only:";
    const inlineTextOnlyField = document.createElement("div");
    inlineTextOnlyField.className = "inline-edit-field inline-edit-checkbox-field";
    const inlineTextOnlyInput = document.createElement("input");
    inlineTextOnlyInput.type = "checkbox";
    inlineTextOnlyInput.className = "inline-edit-checkbox-input";
    inlineTextOnlyInput.dataset.inlineNetTextOnly = "1";
    inlineTextOnlyField.append(inlineTextOnlyInput);
    inlineTextOnlyRow.append(inlineTextOnlyLabel, inlineTextOnlyField);

    const inlineTextFontRow = document.createElement("label");
    inlineTextFontRow.className = "inline-edit-row";
    inlineTextFontRow.dataset.inlineTextFontRow = "1";
    const inlineTextFontLabel = document.createElement("span");
    inlineTextFontLabel.textContent = "Font:";
    const inlineTextFontField = document.createElement("div");
    inlineTextFontField.className = "inline-edit-field";
    const inlineTextFontSelect = document.createElement("select");
    inlineTextFontSelect.className = "schematic-prop-input";
    inlineTextFontSelect.dataset.inlineTextFont = "1";
    getTextFontOptions().forEach((fontName) => {
      const option = document.createElement("option");
      option.value = fontName;
      option.textContent = fontName;
      inlineTextFontSelect.appendChild(option);
    });
    inlineTextFontField.append(inlineTextFontSelect);
    inlineTextFontRow.append(inlineTextFontLabel, inlineTextFontField);

    const inlineTextSizeRow = document.createElement("label");
    inlineTextSizeRow.className = "inline-edit-row";
    inlineTextSizeRow.dataset.inlineTextSizeRow = "1";
    const inlineTextSizeLabel = document.createElement("span");
    inlineTextSizeLabel.textContent = "Size:";
    const inlineTextSizeField = document.createElement("div");
    inlineTextSizeField.className = "inline-edit-field";
    const inlineTextSizeInput = document.createElement("input");
    inlineTextSizeInput.type = "number";
    inlineTextSizeInput.min = "8";
    inlineTextSizeInput.max = "72";
    inlineTextSizeInput.step = "1";
    inlineTextSizeInput.className = "schematic-prop-input";
    inlineTextSizeInput.dataset.inlineTextSize = "1";
    inlineTextSizeField.append(inlineTextSizeInput);
    inlineTextSizeRow.append(inlineTextSizeLabel, inlineTextSizeField);

    const inlineTextBoldRow = document.createElement("label");
    inlineTextBoldRow.className = "inline-edit-row";
    inlineTextBoldRow.dataset.inlineTextBoldRow = "1";
    const inlineTextBoldLabel = document.createElement("span");
    inlineTextBoldLabel.textContent = "Bold:";
    const inlineTextBoldField = document.createElement("div");
    inlineTextBoldField.className = "inline-edit-field inline-edit-checkbox-field";
    const inlineTextBoldInput = document.createElement("input");
    inlineTextBoldInput.type = "checkbox";
    inlineTextBoldInput.className = "inline-edit-checkbox-input";
    inlineTextBoldInput.dataset.inlineTextBold = "1";
    inlineTextBoldField.append(inlineTextBoldInput);
    inlineTextBoldRow.append(inlineTextBoldLabel, inlineTextBoldField);

    const inlineTextItalicRow = document.createElement("label");
    inlineTextItalicRow.className = "inline-edit-row";
    inlineTextItalicRow.dataset.inlineTextItalicRow = "1";
    const inlineTextItalicLabel = document.createElement("span");
    inlineTextItalicLabel.textContent = "Italic:";
    const inlineTextItalicField = document.createElement("div");
    inlineTextItalicField.className = "inline-edit-field inline-edit-checkbox-field";
    const inlineTextItalicInput = document.createElement("input");
    inlineTextItalicInput.type = "checkbox";
    inlineTextItalicInput.className = "inline-edit-checkbox-input";
    inlineTextItalicInput.dataset.inlineTextItalic = "1";
    inlineTextItalicField.append(inlineTextItalicInput);
    inlineTextItalicRow.append(inlineTextItalicLabel, inlineTextItalicField);

    const inlineTextUnderlineRow = document.createElement("label");
    inlineTextUnderlineRow.className = "inline-edit-row";
    inlineTextUnderlineRow.dataset.inlineTextUnderlineRow = "1";
    const inlineTextUnderlineLabel = document.createElement("span");
    inlineTextUnderlineLabel.textContent = "Underline:";
    const inlineTextUnderlineField = document.createElement("div");
    inlineTextUnderlineField.className = "inline-edit-field inline-edit-checkbox-field";
    const inlineTextUnderlineInput = document.createElement("input");
    inlineTextUnderlineInput.type = "checkbox";
    inlineTextUnderlineInput.className = "inline-edit-checkbox-input";
    inlineTextUnderlineInput.dataset.inlineTextUnderline = "1";
    inlineTextUnderlineField.append(inlineTextUnderlineInput);
    inlineTextUnderlineRow.append(inlineTextUnderlineLabel, inlineTextUnderlineField);

    const defaultTextStyle = getDefaultTextStyle();
    inlineTextFontSelect.value = defaultTextStyle.font;
    inlineTextSizeInput.value = String(defaultTextStyle.size);
    inlineTextBoldInput.checked = defaultTextStyle.bold;
    inlineTextItalicInput.checked = defaultTextStyle.italic;
    inlineTextUnderlineInput.checked = defaultTextStyle.underline;

    const inlineNetColorLabel = inlineNetColorPicker.row.querySelector("span");
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
        inlineGroundVariantLabel,
        inlineResistorStyleLabel,
        inlineBoxThicknessLabel,
        inlineBoxLineTypeLabel,
        inlineBoxFillEnabledLabel,
        inlineBoxFillColorLabel,
        inlineBoxOpacityLabel,
        inlineNetColorLabel,
        inlineTextOnlyLabel,
        inlineTextFontLabel,
        inlineTextSizeLabel,
        inlineTextBoldLabel,
        inlineTextItalicLabel,
        inlineTextUnderlineLabel
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
    inlineGroundVariantRow.hidden = true;
    inlineResistorStyleRow.hidden = true;
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
    inlineTextOnlyRow.hidden = true;
    inlineTextFontRow.hidden = true;
    inlineTextSizeRow.hidden = true;
    inlineTextBoldRow.hidden = true;
    inlineTextItalicRow.hidden = true;
    inlineTextUnderlineRow.hidden = true;

    inlineEditor.append(
      inlineNameRow,
      inlineProbeTypeRow,
      inlineGroundVariantRow,
      inlineResistorStyleRow,
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
      inlineTextOnlyRow,
      inlineTextFontRow,
      inlineTextSizeRow,
      inlineTextBoldRow,
      inlineTextItalicRow,
      inlineTextUnderlineRow
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
      inlineSwitchRoffRow,
      inlineSwitchRoffLabel,
      inlineSwitchRoffInput,
      inlineSwitchShowRonRow,
      inlineSwitchShowRonLabel,
      inlineSwitchShowRonInput,
      inlineSwitchShowRoffRow,
      inlineSwitchShowRoffLabel,
      inlineSwitchShowRoffInput,
      inlineProbeTypeRow,
      inlineProbeTypeLabel,
      inlineProbeTypeSelect,
      inlineGroundVariantRow,
      inlineGroundVariantLabel,
      inlineGroundVariantSelect,
      inlineResistorStyleRow,
      inlineResistorStyleLabel,
      inlineResistorStyleSelect,
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
      inlineTextOnlyRow,
      inlineTextOnlyLabel,
      inlineTextOnlyInput,
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
