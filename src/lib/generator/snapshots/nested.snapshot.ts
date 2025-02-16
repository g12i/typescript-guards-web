type Nested = {
  a: {
    b: {
      c: string;
    }[];
  };
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

export function isNested(value: unknown): value is Nested {
  return (
    isPlainObject(value) &&
    hasOwn(value, "a") &&
    isPlainObject(value.a) &&
    hasOwn(value.a, "b") &&
    Array.isArray(value.a.b) &&
    value.a.b.every(
      (el) => isPlainObject(el) && hasOwn(el, "c") && typeof el.c === "string",
    )
  );
}
