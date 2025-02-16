type NeverType = string & number; // resolves to never
type WithNever = {
  impossible: never;
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

export function isNeverType(value: unknown): value is NeverType {
  return typeof value === "string" && typeof value === "number";
}

/* Warning:
 * - Never type
 */
export function isWithNever(value: unknown): value is WithNever {
  return false;
}
