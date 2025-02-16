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

export function isSimple(value: unknown): value is Simple {
  return (
    isPlainObject(value) &&
    "str" in value &&
    typeof value.str === "string" &&
    ("num" in value ? typeof value.num === "number" : true) &&
    "obj" in value &&
    isPlainObject(value.obj) &&
    "value" in value.obj &&
    typeof value.obj.value === "boolean"
  );
}
