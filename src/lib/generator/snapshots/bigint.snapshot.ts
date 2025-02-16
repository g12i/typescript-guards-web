type WithBigInt = {
  big: bigint;
  optional?: bigint;
  bigOrNumber: bigint | number;
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

export function isWithBigInt(value: unknown): value is WithBigInt {
  return (
    isPlainObject(value) &&
    hasOwn(value, "big") &&
    typeof value.big === "bigint" &&
    (hasOwn(value, "optional") ? typeof value.optional === "bigint" : true) &&
    hasOwn(value, "bigOrNumber") &&
    (typeof value.bigOrNumber === "bigint" ||
      typeof value.bigOrNumber === "number")
  );
}
