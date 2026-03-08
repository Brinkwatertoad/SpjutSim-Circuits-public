/**
 * Shared element catalog API built from registered element definitions.
 */
(function initSchematicElements() {
  const requireRegistryMethod = (name) => {
    const registry = typeof self !== "undefined" ? self.SpjutSimSchematicElementCatalog : null;
    const method = registry ? registry[name] : null;
    if (typeof method !== "function") {
      throw new Error(
        `Schematic element registry missing '${name}'. Check src/schematic/elements/registry.js and definitions load order.`
      );
    }
    return method;
  };

  const registryApi = {
    getRegisteredElementDefinition: requireRegistryMethod("getRegisteredElementDefinition"),
    listRegisteredElementDefinitions: requireRegistryMethod("listRegisteredElementDefinitions"),
    listRegisteredToolbarTypes: requireRegistryMethod("listRegisteredToolbarTypes")
  };

  const normalizeType = (type) => String(type ?? "").trim().toUpperCase();

  const normalizeClassification = (classification) => {
    const normalized = String(classification ?? "electrical").trim().toLowerCase();
    if (normalized === "probe" || normalized === "annotation") {
      return normalized;
    }
    return "electrical";
  };

  const cloneHelp = (help) => ({
    title: String(help?.title ?? ""),
    summary: String(help?.summary ?? ""),
    definition: String(help?.definition ?? "")
  });

  const cloneValueField = (valueField) => ({
    label: String(valueField?.label ?? "Value"),
    unit: String(valueField?.unit ?? ""),
    visible: valueField?.visible === true
  });

  const clonePropertyDefinition = (property) => ({
    key: String(property?.key ?? ""),
    label: String(property?.label ?? ""),
    control: String(property?.control ?? ""),
    defaultValue: property?.defaultValue,
    normalizeMethod: String(property?.normalizeMethod ?? ""),
    help: property?.help && typeof property.help === "object" && !Array.isArray(property.help)
      ? {
        title: String(property.help.title ?? ""),
        summary: String(property.help.summary ?? ""),
        definition: String(property.help.definition ?? "")
      }
      : null,
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

  const cloneElementDefinition = (entry) => ({
    type: String(entry?.type ?? ""),
    label: String(entry?.label ?? ""),
    toolLabel: String(entry?.toolLabel ?? ""),
    toolName: String(entry?.toolName ?? ""),
    shortcut: String(entry?.shortcut ?? ""),
    showInToolbar: entry?.showInToolbar === true,
    toolbarOrder: Number(entry?.toolbarOrder ?? Number.POSITIVE_INFINITY),
    catalogOrder: Number(entry?.catalogOrder ?? Number.POSITIVE_INFINITY),
    classification: normalizeClassification(entry?.classification),
    help: cloneHelp(entry?.help ?? {}),
    valueField: cloneValueField(entry?.valueField ?? {}),
    properties: Array.isArray(entry?.properties)
      ? entry.properties.map((property) => clonePropertyDefinition(property))
      : []
  });

  const compareCatalogOrder = (left, right) => {
    if (left.catalogOrder !== right.catalogOrder) {
      return left.catalogOrder - right.catalogOrder;
    }
    return left.type.localeCompare(right.type);
  };

  const getSortedDefinitions = () => {
    const raw = registryApi.listRegisteredElementDefinitions();
    if (!Array.isArray(raw) || !raw.length) {
      throw new Error("Schematic element registry returned no definitions.");
    }
    return raw.map((entry) => cloneElementDefinition(entry)).sort(compareCatalogOrder);
  };

  const getDefinitionsByType = () => {
    const map = new Map();
    const definitions = getSortedDefinitions();
    definitions.forEach((entry) => {
      map.set(entry.type, entry);
    });
    return map;
  };

  const getElementDefinition = (type) => {
    const normalized = normalizeType(type);
    const fromRegistry = registryApi.getRegisteredElementDefinition(normalized);
    return fromRegistry ? cloneElementDefinition(fromRegistry) : null;
  };

  const listElementDefinitions = () => getSortedDefinitions();

  const listToolbarElementDefinitions = () => {
    const toolbarTypes = registryApi.listRegisteredToolbarTypes();
    if (!Array.isArray(toolbarTypes)) {
      throw new Error("Schematic element registry returned invalid toolbar types payload.");
    }
    const definitionsByType = getDefinitionsByType();
    return toolbarTypes
      .map((type) => definitionsByType.get(normalizeType(type)) ?? null)
      .filter((entry) => entry && entry.showInToolbar === true)
      .map((entry) => cloneElementDefinition(entry));
  };

  const listProbeComponentTypes = () =>
    getSortedDefinitions()
      .filter((entry) => entry.classification === "probe")
      .map((entry) => entry.type);

  const isProbeComponentType = (type) => {
    const normalized = normalizeType(type);
    return listProbeComponentTypes().some((probeType) => probeType === normalized);
  };

  const isNonElectricalComponentType = (type) => {
    const definition = getElementDefinition(type);
    if (!definition) {
      return false;
    }
    return definition.classification !== "electrical";
  };

  const isElectricalComponentType = (type) => !isNonElectricalComponentType(type);

  const getValueFieldMeta = (type) => {
    const definition = getElementDefinition(type);
    if (!definition) {
      return { label: "Value", unit: "", visible: true };
    }
    return cloneValueField(definition.valueField);
  };

  const getElementPropertyDefinitions = (type) => {
    const definition = getElementDefinition(type);
    if (!definition || !Array.isArray(definition.properties)) {
      return [];
    }
    return definition.properties.map((property) => clonePropertyDefinition(property));
  };

  const api = typeof self !== "undefined" ? (self.SpjutSimSchematic ?? {}) : {};
  api.getElementDefinition = getElementDefinition;
  api.listElementDefinitions = listElementDefinitions;
  api.listToolbarElementDefinitions = listToolbarElementDefinitions;
  api.listProbeComponentTypes = listProbeComponentTypes;
  api.isProbeComponentType = isProbeComponentType;
  api.isNonElectricalComponentType = isNonElectricalComponentType;
  api.isElectricalComponentType = isElectricalComponentType;
  api.getValueFieldMeta = getValueFieldMeta;
  api.getElementPropertyDefinitions = getElementPropertyDefinitions;
  if (typeof self !== "undefined") {
    self.SpjutSimSchematic = api;
  }
})();
