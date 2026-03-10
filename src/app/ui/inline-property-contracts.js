/**
 * UI inline property contract builders: select, toggle, and input.
 * Factory receives deps and returns eagerly-built specs + accessors.
 */
(function initUIInlinePropertyContractsModule() {
  const createInlinePropertyContracts = (config) => {
    const listElementDefinitions = config.listElementDefinitions;
    const resolveNormalizeValue = config.resolveNormalizeValue;

    if (typeof listElementDefinitions !== "function") {
      throw new Error("Inline property contracts require a listElementDefinitions function.");
    }
    if (typeof resolveNormalizeValue !== "function") {
      throw new Error("Inline property contracts require a resolveNormalizeValue function.");
    }

    const normalizePropertyHelpContract = (propertyFieldPath, help) => {
      if (help === null || help === undefined) {
        return null;
      }
      if (!help || typeof help !== "object" || Array.isArray(help)) {
        throw new Error(`Property contract '${propertyFieldPath}.help' requires an object when provided.`);
      }
      const title = String(help.title ?? "").trim();
      const summary = String(help.summary ?? "").trim();
      const definition = String(help.definition ?? "").trim();
      if (!title || !summary || !definition) {
        throw new Error(`Property contract '${propertyFieldPath}.help' requires non-empty title, summary, and definition.`);
      }
      return Object.freeze({ title, summary, definition });
    };

    const arePropertyHelpContractsEqual = (left, right) => {
      if (left === null && right === null) {
        return true;
      }
      if (!left || !right) {
        return false;
      }
      return left.title === right.title
        && left.summary === right.summary
        && left.definition === right.definition;
    };

    const getSelectPropertyContract = ({
      type: rawType,
      key: rawKey,
      property: sourceProperty,
      propertyFieldPath: rawPropertyFieldPath,
      normalizeMethodName: rawNormalizeMethodName,
      normalizeValue
    } = {}) => {
      const source = {
        type: rawType,
        key: rawKey,
        property: sourceProperty,
        propertyFieldPath: rawPropertyFieldPath,
        normalizeMethodName: rawNormalizeMethodName,
        normalizeValue
      };
      const type = String(source.type ?? "").trim().toUpperCase();
      const key = String(source.key ?? "").trim();
      const normalizeMethodName = String(source.normalizeMethodName ?? "").trim();
      const propertyFieldPath = String(source.propertyFieldPath ?? `${type}.${key}`).trim();
      const property = source.property;
      if (!type || !key) {
        throw new Error(`Inline select property contract '${propertyFieldPath || "?"}' requires non-empty type/key.`);
      }
      if (!property) {
        throw new Error(`Missing property contract '${propertyFieldPath}' in element catalog definition list.`);
      }
      const control = String(property?.control ?? "").trim().toLowerCase();
      if (control !== "select") {
        throw new Error(`Property contract '${propertyFieldPath}' must use select control.`);
      }
      const normalizeMethod = String(property?.normalizeMethod ?? "").trim();
      if (normalizeMethod !== normalizeMethodName) {
        throw new Error(
          `Property contract '${propertyFieldPath}' normalize owner mismatch. Expected '${normalizeMethodName}', got '${normalizeMethod || "?"}'.`
        );
      }
      const label = String(property?.label ?? "").trim();
      if (!label) {
        throw new Error(`Property contract '${propertyFieldPath}' requires a non-empty label.`);
      }
      const optionsRaw = Array.isArray(property?.options) ? property.options : [];
      if (!optionsRaw.length) {
        throw new Error(`Property contract '${propertyFieldPath}' requires one or more options.`);
      }
      const seenValues = new Set();
      const options = optionsRaw.map((entry, index) => {
        const value = normalizeValue(entry?.value);
        const optionLabel = String(entry?.label ?? "").trim();
        if (typeof value !== "string" || !value.trim()) {
          throw new Error(`Property contract '${propertyFieldPath}' has invalid option value at index ${index}.`);
        }
        if (!optionLabel) {
          throw new Error(`Property contract '${propertyFieldPath}' has invalid option label at index ${index}.`);
        }
        if (seenValues.has(value)) {
          throw new Error(`Property contract '${propertyFieldPath}' contains duplicate option value '${value}'.`);
        }
        seenValues.add(value);
        return { value, label: optionLabel };
      });
      return Object.freeze({
        key,
        label,
        help: normalizePropertyHelpContract(propertyFieldPath, property?.help),
        options: Object.freeze(options)
      });
    };

    const areInlineSelectContractsEqual = (left, right) => {
      if (!left || !right) {
        return false;
      }
      if (left.label !== right.label) {
        return false;
      }
      if (!arePropertyHelpContractsEqual(left.help ?? null, right.help ?? null)) {
        return false;
      }
      if (!Array.isArray(left.options) || !Array.isArray(right.options) || left.options.length !== right.options.length) {
        return false;
      }
      for (let index = 0; index < left.options.length; index += 1) {
        const leftOption = left.options[index];
        const rightOption = right.options[index];
        if (leftOption?.value !== rightOption?.value || leftOption?.label !== rightOption?.label) {
          return false;
        }
      }
      return true;
    };

    const normalizeMethodCache = new Map();
    const resolveNormalizeMethodValue = (normalizeMethod) => {
      const methodName = String(normalizeMethod ?? "").trim();
      if (!methodName) {
        throw new Error("Inline select property contract requires a non-empty normalize owner.");
      }
      const cachedNormalizeValue = normalizeMethodCache.get(methodName);
      if (typeof cachedNormalizeValue === "function") {
        return cachedNormalizeValue;
      }
      const normalizedValue = resolveNormalizeValue(methodName);
      normalizeMethodCache.set(methodName, normalizedValue);
      return normalizedValue;
    };

    const buildInlineSelectPropertySpecs = () => {
      const definitions = listElementDefinitions();
      if (!Array.isArray(definitions) || !definitions.length) {
        throw new Error("Schematic API listElementDefinitions() returned invalid data.");
      }
      const specsByKey = new Map();
      definitions.forEach((definition, definitionIndex) => {
        const type = String(definition?.type ?? "").trim().toUpperCase();
        if (!type) {
          throw new Error(`Schematic API listElementDefinitions() returned invalid type at index ${definitionIndex}.`);
        }
        const properties = Array.isArray(definition?.properties) ? definition.properties : [];
        properties.forEach((property, propertyIndex) => {
          const key = String(property?.key ?? "").trim();
          const control = String(property?.control ?? "").trim().toLowerCase();
          if (control !== "select" || property?.inlineEditVisible === false) {
            return;
          }
          if (!key) {
            throw new Error(
              `Inline select property contract '${type}' missing key at property index ${propertyIndex}.`
            );
          }
          const normalizeMethod = String(property?.normalizeMethod ?? "").trim();
          const normalizeValue = resolveNormalizeMethodValue(normalizeMethod);
          const propertyFieldPath = `${type}.${key}`;
          const nextContract = getSelectPropertyContract({
            type,
            key,
            property,
            propertyFieldPath,
            normalizeMethodName: normalizeMethod,
            normalizeValue
          });
          const existingSpec = specsByKey.get(key);
          if (!existingSpec) {
            specsByKey.set(key, {
              key,
              normalizeMethod,
              normalizeValue,
              contract: nextContract,
              componentTypes: [type]
            });
            return;
          }
          if (existingSpec.normalizeMethod !== normalizeMethod) {
            throw new Error(
              `Inline select property '${key}' normalize owner mismatch across element definitions.`
            );
          }
          if (!areInlineSelectContractsEqual(existingSpec.contract, nextContract)) {
            throw new Error(`Inline select property '${key}' contract mismatch across element definitions.`);
          }
          if (!existingSpec.componentTypes.includes(type)) {
            existingSpec.componentTypes.push(type);
          }
        });
      });
      const specs = [];
      specsByKey.forEach((existingSpec) => {
        specs.push(Object.freeze({
          key: existingSpec.key,
          componentTypes: Object.freeze(existingSpec.componentTypes.slice()),
          normalizeMethod: existingSpec.normalizeMethod,
          normalizeValue: existingSpec.normalizeValue,
          contract: existingSpec.contract
        }));
      });
      if (!specs.length) {
        throw new Error("Inline select property contracts missing from element definitions.");
      }
      return Object.freeze(specs);
    };

    const getTogglePropertyContract = ({
      type,
      key,
      source,
      propertyFieldPath,
      normalizeMethodName
    }) => {
      const property = source && typeof source === "object" && source.property
        ? source.property
        : null;
      if (!type || !key || typeof type !== "string" || typeof key !== "string") {
        throw new Error(`Inline toggle property contract '${propertyFieldPath || "?"}' requires non-empty type/key.`);
      }
      if (!property) {
        throw new Error(`Missing property contract '${propertyFieldPath}' in element catalog definition list.`);
      }
      const control = String(property?.control ?? "").trim().toLowerCase();
      if (control !== "toggle") {
        throw new Error(`Property contract '${propertyFieldPath}' must use toggle control.`);
      }
      const normalizeMethod = String(property?.normalizeMethod ?? "").trim();
      if (normalizeMethod !== normalizeMethodName) {
        throw new Error(
          `Property contract '${propertyFieldPath}' normalize owner mismatch. Expected '${normalizeMethodName}', got '${normalizeMethod || "?"}'.`
        );
      }
      const label = String(property?.label ?? "").trim();
      if (!label) {
        throw new Error(`Property contract '${propertyFieldPath}' requires a non-empty label.`);
      }
      return Object.freeze({
        key,
        label,
        help: normalizePropertyHelpContract(propertyFieldPath, property?.help)
      });
    };

    const areInlineToggleContractsEqual = (left, right) => {
      if (!left || !right) {
        return false;
      }
      if (left.label !== right.label) {
        return false;
      }
      return arePropertyHelpContractsEqual(left.help ?? null, right.help ?? null);
    };

    const buildInlineTogglePropertySpecs = () => {
      const definitions = listElementDefinitions();
      if (!Array.isArray(definitions) || !definitions.length) {
        throw new Error("Schematic API listElementDefinitions() returned invalid data.");
      }
      const specsByKey = new Map();
      definitions.forEach((definition, definitionIndex) => {
        const type = String(definition?.type ?? "").trim().toUpperCase();
        if (!type) {
          throw new Error(`Schematic API listElementDefinitions() returned invalid type at index ${definitionIndex}.`);
        }
        const properties = Array.isArray(definition?.properties) ? definition.properties : [];
        properties.forEach((property, propertyIndex) => {
          const key = String(property?.key ?? "").trim();
          const control = String(property?.control ?? "").trim().toLowerCase();
          if (control !== "toggle" || property?.inlineEditVisible === false) {
            return;
          }
          if (!key) {
            throw new Error(
              `Inline toggle property contract '${type}' missing key at property index ${propertyIndex}.`
            );
          }
          const normalizeMethod = String(property?.normalizeMethod ?? "").trim();
          const normalizeValue = resolveNormalizeMethodValue(normalizeMethod);
          const propertyFieldPath = `${type}.${key}`;
          const nextContract = getTogglePropertyContract({
            type,
            key,
            source: { property },
            propertyFieldPath,
            normalizeMethodName: normalizeMethod
          });
          const existingSpec = specsByKey.get(key);
          if (!existingSpec) {
            specsByKey.set(key, {
              key,
              normalizeMethod,
              normalizeValue,
              contract: nextContract,
              componentTypes: [type]
            });
            return;
          }
          if (existingSpec.normalizeMethod !== normalizeMethod) {
            throw new Error(
              `Inline toggle property '${key}' normalize owner mismatch across element definitions.`
            );
          }
          if (!areInlineToggleContractsEqual(existingSpec.contract, nextContract)) {
            throw new Error(`Inline toggle property '${key}' contract mismatch across element definitions.`);
          }
          if (!existingSpec.componentTypes.includes(type)) {
            existingSpec.componentTypes.push(type);
          }
        });
      });
      const specs = [];
      specsByKey.forEach((existingSpec) => {
        specs.push(Object.freeze({
          key: existingSpec.key,
          componentTypes: Object.freeze(existingSpec.componentTypes.slice()),
          normalizeMethod: existingSpec.normalizeMethod,
          normalizeValue: existingSpec.normalizeValue,
          contract: existingSpec.contract
        }));
      });
      return Object.freeze(specs);
    };

    const INLINE_INPUT_CONTROL_TYPES = new Set(["text", "number", "color"]);

    const normalizeInputContractMetadata = (propertyFieldPath, control, input) => {
      const normalizedInput = {};
      if (typeof input?.placeholder === "string") {
        normalizedInput.placeholder = input.placeholder;
      }
      if (Object.prototype.hasOwnProperty.call(input, "unit")) {
        normalizedInput.unit = String(input.unit ?? "").trim();
      }
      if (Object.prototype.hasOwnProperty.call(input, "readOnly")) {
        normalizedInput.readOnly = input.readOnly === true;
      }
      if (control === "number") {
        ["min", "max", "step"].forEach((name) => {
          if (!Object.prototype.hasOwnProperty.call(input, name)) return;
          const value = Number(input[name]);
          if (!Number.isFinite(value)) {
            throw new Error(`Property contract '${propertyFieldPath}.input.${name}' requires a finite number.`);
          }
          normalizedInput[name] = value;
        });
      }
      return normalizedInput;
    };

    const getInputPropertyContract = ({
      type, key, source, propertyFieldPath, normalizeMethodName
    }) => {
      const property = source && typeof source === "object" ? source.property : null;
      if (!type || !key || typeof type !== "string" || typeof key !== "string") {
        throw new Error(`Inline input property contract '${propertyFieldPath || "?"}' requires non-empty type/key.`);
      }
      if (!property) throw new Error(`Missing property contract '${propertyFieldPath}' in element catalog definition list.`);
      const control = String(property?.control ?? "").trim().toLowerCase();
      if (!INLINE_INPUT_CONTROL_TYPES.has(control)) {
        throw new Error(`Property contract '${propertyFieldPath}' must use text/number/color control.`);
      }
      const normalizeMethod = String(property?.normalizeMethod ?? "").trim();
      if (normalizeMethod !== normalizeMethodName) {
        throw new Error(`Property contract '${propertyFieldPath}' normalize owner mismatch. Expected '${normalizeMethodName}', got '${normalizeMethod || "?"}'.`);
      }
      const label = String(property?.label ?? "").trim();
      if (!label) throw new Error(`Property contract '${propertyFieldPath}' requires a non-empty label.`);
      const input = property?.input && typeof property.input === "object" && !Array.isArray(property.input) ? property.input : {};
      return Object.freeze({
        key,
        label,
        help: normalizePropertyHelpContract(propertyFieldPath, property?.help),
        control,
        input: Object.freeze(normalizeInputContractMetadata(propertyFieldPath, control, input))
      });
    };

    const areInlineInputContractsEqual = (left, right) => {
      if (!left || !right || left.label !== right.label || left.control !== right.control) return false;
      if (!arePropertyHelpContractsEqual(left.help ?? null, right.help ?? null)) {
        return false;
      }
      const leftInput = left.input && typeof left.input === "object" ? left.input : {};
      const rightInput = right.input && typeof right.input === "object" ? right.input : {};
      return !Array.from(new Set([...Object.keys(leftInput), ...Object.keys(rightInput)])).some((entryKey) => leftInput[entryKey] !== rightInput[entryKey]);
    };

    const buildInlineInputPropertySpecs = () => {
      const definitions = listElementDefinitions();
      if (!Array.isArray(definitions) || !definitions.length) {
        throw new Error("Schematic API listElementDefinitions() returned invalid data.");
      }
      const specsByKey = new Map();
      definitions.forEach((definition, definitionIndex) => {
        const type = String(definition?.type ?? "").trim().toUpperCase();
        if (!type) {
          throw new Error(`Schematic API listElementDefinitions() returned invalid type at index ${definitionIndex}.`);
        }
        const properties = Array.isArray(definition?.properties) ? definition.properties : [];
        properties.forEach((property, propertyIndex) => {
          const key = String(property?.key ?? "").trim();
          const control = String(property?.control ?? "").trim().toLowerCase();
          if (!INLINE_INPUT_CONTROL_TYPES.has(control) || property?.inlineEditVisible === false) return;
          if (!key) {
            throw new Error(`Inline input property contract '${type}' missing key at property index ${propertyIndex}.`);
          }
          const normalizeMethod = String(property?.normalizeMethod ?? "").trim();
          const normalizeValue = resolveNormalizeMethodValue(normalizeMethod);
          const propertyFieldPath = `${type}.${key}`;
          const nextContract = getInputPropertyContract({ type, key, source: { property }, propertyFieldPath, normalizeMethodName: normalizeMethod });
          const existingSpec = specsByKey.get(key);
          if (!existingSpec) {
            specsByKey.set(key, { key, normalizeMethod, normalizeValue, contract: nextContract, componentTypes: [type] });
            return;
          }
          if (existingSpec.normalizeMethod !== normalizeMethod) {
            throw new Error(`Inline input property '${key}' normalize owner mismatch across element definitions.`);
          }
          if (!areInlineInputContractsEqual(existingSpec.contract, nextContract)) {
            throw new Error(`Inline input property '${key}' contract mismatch across element definitions.`);
          }
          if (!existingSpec.componentTypes.includes(type)) existingSpec.componentTypes.push(type);
        });
      });
      const specs = [];
      specsByKey.forEach((existingSpec) => specs.push(Object.freeze({
        key: existingSpec.key,
        componentTypes: Object.freeze(existingSpec.componentTypes.slice()),
        normalizeMethod: existingSpec.normalizeMethod,
        normalizeValue: existingSpec.normalizeValue,
        contract: existingSpec.contract
      })));
      return Object.freeze(specs);
    };

    const INLINE_SELECT_PROPERTY_SPECS = buildInlineSelectPropertySpecs();
    const INLINE_TOGGLE_PROPERTY_SPECS = buildInlineTogglePropertySpecs();
    const INLINE_INPUT_PROPERTY_SPECS = buildInlineInputPropertySpecs();

    const getInlineSelectPropertySpec = (key) => {
      const normalizedKey = String(key ?? "").trim();
      const spec = INLINE_SELECT_PROPERTY_SPECS.find((entry) => entry.key === normalizedKey) ?? null;
      if (!spec) {
        throw new Error(`Unsupported inline select property contract '${normalizedKey || "?"}'.`);
      }
      return spec;
    };
    const getInlineSelectPropertyContract = (key) => {
      const spec = getInlineSelectPropertySpec(key);
      return spec.contract;
    };

    const getInlineTogglePropertySpec = (key) => {
      const normalizedKey = String(key ?? "").trim();
      const spec = INLINE_TOGGLE_PROPERTY_SPECS.find((entry) => entry.key === normalizedKey) ?? null;
      if (!spec) {
        throw new Error(`Unsupported inline toggle property contract '${normalizedKey || "?"}'.`);
      }
      return spec;
    };
    const getInlineTogglePropertyContract = (key) => {
      const spec = getInlineTogglePropertySpec(key);
      return spec.contract;
    };

    const getInlineInputPropertySpec = (key) => {
      const normalizedKey = String(key ?? "").trim();
      const spec = INLINE_INPUT_PROPERTY_SPECS.find((entry) => entry.key === normalizedKey) ?? null;
      if (!spec) throw new Error(`Unsupported inline input property contract '${normalizedKey || "?"}'.`);
      return spec;
    };
    const getInlineInputPropertyContract = (key) => {
      const spec = getInlineInputPropertySpec(key);
      return spec.contract;
    };

    return Object.freeze({
      INLINE_SELECT_PROPERTY_SPECS,
      INLINE_TOGGLE_PROPERTY_SPECS,
      INLINE_INPUT_PROPERTY_SPECS,
      getInlineSelectPropertySpec,
      getInlineSelectPropertyContract,
      getInlineTogglePropertySpec,
      getInlineTogglePropertyContract,
      getInlineInputPropertySpec,
      getInlineInputPropertyContract,
    });
  };

  if (typeof self !== "undefined") {
    self.SpjutSimUIInlinePropertyContracts = { createInlinePropertyContracts };
  }
})();
