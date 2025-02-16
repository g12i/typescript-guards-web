type RedundantUnion =
  | { type: "a"; value: string }
  | { type: "a"; other: number };
type RedundantIntersection = { id: number; name: string } & {
  id: number;
  age: number;
};
type UnionWithSameChecks = string | string | number | number;

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

export function isRedundantUnion(value: unknown): value is RedundantUnion {
  return (
    (isPlainObject(value) &&
      hasOwn(value, "type") &&
      value.type === "a" &&
      hasOwn(value, "value") &&
      typeof value.value === "string") ||
    (isPlainObject(value) &&
      hasOwn(value, "type") &&
      value.type === "a" &&
      hasOwn(value, "other") &&
      typeof value.other === "number")
  );
}

export function isRedundantIntersection(
  value: unknown,
): value is RedundantIntersection {
  return (
    isPlainObject(value) &&
    hasOwn(value, "id") &&
    typeof value.id === "number" &&
    hasOwn(value, "name") &&
    typeof value.name === "string" &&
    hasOwn(value, "age") &&
    typeof value.age === "number"
  );
}

export function isUnionWithSameChecks(
  value: unknown,
): value is UnionWithSameChecks {
  return typeof value === "string" || typeof value === "number";
}
