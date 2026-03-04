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
    }
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
      valueField: Object.freeze(normalizeValueField(definition?.valueField ?? {}))
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
