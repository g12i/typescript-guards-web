interface WithIndex {
  [key: string]: any;
  [key: number]: string;
  [key: symbol]: unknown;
  normalProp: string;
}

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

/* Warning:
 * - Index signatures ([key: string]: T, [key: number]: T, [key: symbol]: T) are not yet supported
 */
export function isWithIndex(value: unknown): value is WithIndex {
  return (
    isPlainObject(value) &&
    hasOwn(value, "normalProp") &&
    typeof value.normalProp === "string"
  );
}
