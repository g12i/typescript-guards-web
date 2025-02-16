type Union = string | number | boolean;
type Intersection = { id: number } & { name: string };
type ComplexUnion = { type: "a"; value: string } | { type: "b"; value: number };
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

export function isUnion(value: unknown): value is Union {
  return (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  );
}

export function isIntersection(value: unknown): value is Intersection {
  return (
    isPlainObject(value) &&
    hasOwn(value, "id") &&
    typeof value.id === "number" &&
    isPlainObject(value) &&
    hasOwn(value, "name") &&
    typeof value.name === "string"
  );
}

export function isComplexUnion(value: unknown): value is ComplexUnion {
  return (
    (isPlainObject(value) &&
      hasOwn(value, "type") &&
      value.type === "a" &&
      hasOwn(value, "value") &&
      typeof value.value === "string") ||
    (isPlainObject(value) &&
      hasOwn(value, "type") &&
      value.type === "b" &&
      hasOwn(value, "value") &&
      typeof value.value === "number")
  );
}
