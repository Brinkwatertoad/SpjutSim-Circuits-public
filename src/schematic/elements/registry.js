/**
 * Shared registry for schematic element definitions.
 */
(function initSchematicElementRegistry() {
  const globalScope = typeof self !== "undefined" ? self : null;
  if (!globalScope) {
    return;
  }

  const existing = globalScope.SpjutSimSchematicElementCatalog ?? {};
  const definitionMap = existing.__definitionMap instanceof Map ? existing.__definitionMap : new Map();

  const normalizeType = (value) => String(value ?? "").trim().toUpperCase();

  const assertNonEmptyString = (value, label) => {
    const text = String(value ?? "").trim();
    if (!text) {
      throw new Error(`Element registry requires non-empty '${label}'.`);
    }
    return text;
  };

  const normalizeHelp = (help) => ({
    title: assertNonEmptyString(help?.title, "help.title"),
    summary: assertNonEmptyString(help?.summary, "help.summary"),
    definition: assertNonEmptyString(help?.definition, "help.definition")
  });

  const normalizeValueField = (valueField) => ({
    label: assertNonEmptyString(valueField?.label, "valueField.label"),
    unit: String(valueField?.unit ?? ""),
    visible: valueField?.visible === true
  });

  const normalizeClassification = (classification) => {
    const normalized = String(classification ?? "electrical").trim().toLowerCase();
    if (normalized === "electrical" || normalized === "probe" || normalized === "annotation") {
      return normalized;
    }
    throw new Error(`Element registry received invalid classification '${classification ?? ""}'.`);
  };

  const normalizeOrderNumber = (value, label) => {
    const num = Number(value);
    if (!Number.isFinite(num)) {
      throw new Error(`Element registry requires finite numeric '${label}'.`);
    }
    return num;
  };

  const PROPERTY_CONTROL_TYPES = new Set(["select", "toggle", "text", "number", "color"]);

  const normalizePropertyOption = (option, fieldPath) => ({
    value: assertNonEmptyString(option?.value, `${fieldPath}.value`),
    label: assertNonEmptyString(option?.label, `${fieldPath}.label`)
  });
  const normalizePropertyInput = (control, input, fieldPath) => {
    if (input === null || input === undefined) {
      return {};
    }
    if (!input || typeof input !== "object" || Array.isArray(input)) {
      throw new Error(`Element registry property '${fieldPath}' requires object input metadata when provided.`);
    }
    const normalized = {};
    if (Object.prototype.hasOwnProperty.call(input, "placeholder")) {
      normalized.placeholder = String(input.placeholder ?? "");
    }
    if (control === "number") {
      ["min", "max", "step"].forEach((key) => {
        if (!Object.prototype.hasOwnProperty.call(input, key)) {
          return;
        }
        const value = Number(input[key]);
        if (!Number.isFinite(value)) {
          throw new Error(`Element registry property '${fieldPath}.input.${key}' requires a finite number.`);
        }
        normalized[key] = value;
      });
    }
    return normalized;
  };

  const normalizePropertyDefinitions = (properties) => {
    if (properties === null || properties === undefined) {
      return [];
    }
    if (!Array.isArray(properties)) {
      throw new Error("Element registry requires 'properties' to be an array when provided.");
    }
    const seenKeys = new Set();
    return properties.map((property, index) => {
      const fieldPath = `properties[${index}]`;
      const key = assertNonEmptyString(property?.key, `${fieldPath}.key`);
      if (seenKeys.has(key)) {
        throw new Error(`Element registry requires unique property keys. Duplicate '${key}'.`);
      }
      seenKeys.add(key);
      const control = String(property?.control ?? "").trim().toLowerCase();
      if (!PROPERTY_CONTROL_TYPES.has(control)) {
        throw new Error(`Element registry property '${key}' has invalid control '${property?.control ?? ""}'.`);
      }
      const normalizeMethod = assertNonEmptyString(property?.normalizeMethod, "properties.normalizeMethod");
      const options = Array.isArray(property?.options)
        ? property.options.map((option, optionIndex) => normalizePropertyOption(option, `${fieldPath}.options[${optionIndex}]`))
        : [];
      if (control === "select" && options.length < 1) {
        throw new Error(`Element registry property '${key}' requires one or more options for select control.`);
      }
      const defaultValue = property?.defaultValue;
      if (control === "select") {
        const defaultToken = assertNonEmptyString(defaultValue, `${fieldPath}.defaultValue`);
        const allowed = new Set(options.map((option) => option.value));
        if (!allowed.has(defaultToken)) {
          throw new Error(`Element registry property '${key}' default '${defaultToken}' is not in options.`);
        }
      }
      return {
        key,
        label: assertNonEmptyString(property?.label, `${fieldPath}.label`),
        control,
        defaultValue,
        normalizeMethod,
        inlineEditVisible: property?.inlineEditVisible !== false,
        options,
        input: normalizePropertyInput(control, property?.input, fieldPath)
      };
    });
  };

  const clonePropertyDefinition = (property) => ({
    key: String(property?.key ?? ""),
    label: String(property?.label ?? ""),
    control: String(property?.control ?? ""),
    defaultValue: property?.defaultValue,
    normalizeMethod: String(property?.normalizeMethod ?? ""),
    inlineEditVisible: property?.inlineEditVisible !== false,
    options: Array.isArray(property?.options)
      ? property.options.map((option) => ({
        value: String(option?.value ?? ""),
        label: String(option?.label ?? "")
      }))
      : [],
    input: property?.input && typeof property.input === "object" && !Array.isArray(property.input)
      ? { ...property.input }
      : {}
  });

  const cloneDefinition = (entry) => ({
    type: String(entry?.type ?? ""),
    label: String(entry?.label ?? ""),
    toolLabel: String(entry?.toolLabel ?? ""),
    toolName: String(entry?.toolName ?? ""),
    shortcut: String(entry?.shortcut ?? ""),
    showInToolbar: entry?.showInToolbar === true,
    toolbarOrder: Number(entry?.toolbarOrder ?? Number.POSITIVE_INFINITY),
    catalogOrder: Number(entry?.catalogOrder ?? Number.POSITIVE_INFINITY),
    classification: String(entry?.classification ?? "electrical"),
    help: {
      title: String(entry?.help?.title ?? ""),
      summary: String(entry?.help?.summary ?? ""),
      definition: String(entry?.help?.definition ?? "")
    },
    valueField: {
      label: String(entry?.valueField?.label ?? "Value"),
      unit: String(entry?.valueField?.unit ?? ""),
      visible: entry?.valueField?.visible === true
    },
    properties: Array.isArray(entry?.properties)
      ? entry.properties.map((property) => clonePropertyDefinition(property))
      : []
  });

  const registerElementDefinition = (definition) => {
    const type = normalizeType(definition?.type);
    if (!type) {
      throw new Error("Element registry requires definition.type.");
    }
    if (definitionMap.has(type)) {
      throw new Error(`Element registry already contains '${type}'.`);
    }

    const normalized = Object.freeze({
      type,
      label: assertNonEmptyString(definition?.label, "label"),
      toolLabel: assertNonEmptyString(definition?.toolLabel, "toolLabel"),
      toolName: assertNonEmptyString(definition?.toolName, "toolName"),
      shortcut: assertNonEmptyString(definition?.shortcut, "shortcut"),
      showInToolbar: definition?.showInToolbar === true,
      toolbarOrder: normalizeOrderNumber(definition?.toolbarOrder ?? Number.POSITIVE_INFINITY, "toolbarOrder"),
      catalogOrder: normalizeOrderNumber(definition?.catalogOrder ?? Number.POSITIVE_INFINITY, "catalogOrder"),
      classification: normalizeClassification(definition?.classification),
      help: Object.freeze(normalizeHelp(definition?.help ?? {})),
      valueField: Object.freeze(normalizeValueField(definition?.valueField ?? {})),
      properties: Object.freeze(
        normalizePropertyDefinitions(definition?.properties).map((property) => Object.freeze({
          ...property,
          options: Object.freeze(property.options.map((option) => Object.freeze({ ...option })))
        }))
      )
    });

    definitionMap.set(type, normalized);
    return cloneDefinition(normalized);
  };

  const getRegisteredElementDefinition = (type) => {
    const entry = definitionMap.get(normalizeType(type));
    return entry ? cloneDefinition(entry) : null;
  };

  const listRegisteredElementDefinitions = () => Array.from(definitionMap.values()).map((entry) => cloneDefinition(entry));

  const listRegisteredToolbarTypes = () => {
    const toolbarDefinitions = Array.from(definitionMap.values())
      .filter((entry) => entry.showInToolbar === true)
      .sort((left, right) => {
        if (left.toolbarOrder !== right.toolbarOrder) {
          return left.toolbarOrder - right.toolbarOrder;
        }
        if (left.catalogOrder !== right.catalogOrder) {
          return left.catalogOrder - right.catalogOrder;
        }
        return left.type.localeCompare(right.type);
      });
    return toolbarDefinitions.map((entry) => entry.type);
  };

  const api = existing;
  api.__definitionMap = definitionMap;
  api.registerElementDefinition = registerElementDefinition;
  api.getRegisteredElementDefinition = getRegisteredElementDefinition;
  api.listRegisteredElementDefinitions = listRegisteredElementDefinitions;
  api.listRegisteredToolbarTypes = listRegisteredToolbarTypes;

  globalScope.SpjutSimSchematicElementCatalog = api;
})();
