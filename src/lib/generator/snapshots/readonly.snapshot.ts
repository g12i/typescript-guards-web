type ReadonlyStuff = {
  readonly id: number;
  readonly data: readonly string[];
};
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

export function isReadonlyStuff(value: unknown): value is ReadonlyStuff {
  return (
    isPlainObject(value) &&
    hasOwn(value, "id") &&
    typeof value.id === "number" &&
    hasOwn(value, "data") &&
    Array.isArray(value.data) &&
    value.data.every((el) => typeof el === "string")
  );
}
