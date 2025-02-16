interface Node {
  value: string;
  parent?: Node;
  children: Node[];
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

export function isNode(value: unknown): value is Node {
  return (
    isPlainObject(value) &&
    hasOwn(value, "value") &&
    typeof value.value === "string" &&
    (hasOwn(value, "parent") ? isNode(value.parent) : true) &&
    hasOwn(value, "children") &&
    Array.isArray(value.children) &&
    value.children.every((el) => isNode(el))
  );
}
