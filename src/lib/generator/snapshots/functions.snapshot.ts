type WithFunction = {
  callback: (arg: string) => number;
  method(): void;
  multiArg(x: number, y: string): boolean;
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

export function isWithFunction(value: unknown): value is WithFunction {
  return (
    isPlainObject(value) &&
    hasOwn(value, "callback") &&
    typeof value.callback === "function" &&
    hasOwn(value, "method") &&
    typeof value.method === "function" &&
    hasOwn(value, "multiArg") &&
    typeof value.multiArg === "function"
  );
}
