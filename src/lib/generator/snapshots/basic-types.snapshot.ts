type BasicTypes = {
  str: string;
  any: any;
  num: number;
  bool: boolean;
  nil: null;
  undef: undefined;
  unknown: unknown;
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

export function isBasicTypes(value: unknown): value is BasicTypes {
  return (
    isPlainObject(value) &&
    hasOwn(value, "str") &&
    typeof value.str === "string" &&
    hasOwn(value, "any") &&
    hasOwn(value, "num") &&
    typeof value.num === "number" &&
    hasOwn(value, "bool") &&
    typeof value.bool === "boolean" &&
    hasOwn(value, "nil") &&
    value.nil === null &&
    hasOwn(value, "undef") &&
    typeof value.undef === "undefined" &&
    hasOwn(value, "unknown")
  );
}
