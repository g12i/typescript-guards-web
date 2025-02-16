interface Simple {
  str: string;
  num?: number;
  obj: {
    value: boolean;
  };
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

export function isSimple(value: unknown): value is Simple {
  return (
    isPlainObject(value) &&
    hasOwn(value, "str") &&
    typeof value.str === "string" &&
    (hasOwn(value, "num") ? typeof value.num === "number" : true) &&
    hasOwn(value, "obj") &&
    isPlainObject(value.obj) &&
    hasOwn(value.obj, "value") &&
    typeof value.obj.value === "boolean"
  );
}
