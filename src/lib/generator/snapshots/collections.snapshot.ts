type StringRecord = Record<string, number>;
type NumberRecord = Record<number, string>;
type ComplexRecord = Record<string, { id: number; name: string }>;

type StringMap = Map<string, number>;
type ComplexMap = Map<string, { value: number }>;

type NumberSet = Set<number>;
type ComplexSet = Set<{ id: string }>;

function isPlainObject(value: unknown): value is Record<PropertyKey, any> {
  if (!value || typeof value !== "object") {
    return false;
  }

  const proto = Object.getPrototypeOf(value) as typeof Object.prototype | null;

  const hasObjectPrototype =
    proto === null ||
    proto === Object.prototype ||
    // Required to support node:vm.runInNewContext({})
    Object.getPrototypeOf(proto) === null;

  if (!hasObjectPrototype) {
    return false;
  }

  return Object.prototype.toString.call(value) === "[object Object]";
}

function hasOwn<O extends object, P extends PropertyKey>(
  obj: O,
  prop: P,
): obj is O & Record<P, unknown> {
  return Object.hasOwn(obj, prop);
}

export function isStringRecord(value: unknown): value is StringRecord {
  return (
    isPlainObject(value) &&
    Object.entries(value).every(
      ([key, value]) => typeof key === "string" && typeof value === "number",
    )
  );
}

export function isNumberRecord(value: unknown): value is NumberRecord {
  return (
    isPlainObject(value) &&
    Object.entries(value).every(
      ([key, value]) => typeof key === "number" && typeof value === "string",
    )
  );
}

export function isComplexRecord(value: unknown): value is ComplexRecord {
  return (
    isPlainObject(value) &&
    Object.entries(value).every(
      ([key, value]) =>
        typeof key === "string" &&
        isPlainObject(value) &&
        hasOwn(value, "id") &&
        typeof value.id === "number" &&
        hasOwn(value, "name") &&
        typeof value.name === "string",
    )
  );
}

export function isStringMap(value: unknown): value is StringMap {
  return (
    value instanceof Map &&
    Array.from(value.entries()).every(
      ([key, value]) => typeof key === "string" && typeof value === "number",
    )
  );
}

export function isComplexMap(value: unknown): value is ComplexMap {
  return (
    value instanceof Map &&
    Array.from(value.entries()).every(
      ([key, value]) =>
        typeof key === "string" &&
        isPlainObject(value) &&
        hasOwn(value, "value") &&
        typeof value.value === "number",
    )
  );
}

export function isNumberSet(value: unknown): value is NumberSet {
  return (
    value instanceof Set &&
    Array.from(value.values()).every((value) => typeof value === "number")
  );
}

export function isComplexSet(value: unknown): value is ComplexSet {
  return (
    value instanceof Set &&
    Array.from(value.values()).every(
      (value) =>
        isPlainObject(value) &&
        hasOwn(value, "id") &&
        typeof value.id === "string",
    )
  );
}
