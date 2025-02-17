type Foo = {
  ["dash-value"]: "dash-value";
  [0]: "number-value";
  ["some-computed"]: () => void;
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

export function isFoo(value: unknown): value is Foo {
  return (
    isPlainObject(value) &&
    hasOwn(value, "dash-value") &&
    value["dash-value"] === "dash-value" &&
    hasOwn(value, 0) &&
    value[0] === "number-value" &&
    hasOwn(value, "some-computed") &&
    typeof value["some-computed"] === "function"
  );
}
