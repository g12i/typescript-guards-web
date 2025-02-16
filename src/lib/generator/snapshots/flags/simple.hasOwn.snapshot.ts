interface Simple {
  str: string;
  num?: number;
  obj: {
    value: boolean;
  };
}

function hasOwn<O extends object, P extends PropertyKey>(
  obj: O,
  prop: P,
): obj is O & Record<P, unknown> {
  return Object.hasOwn(obj, prop);
}

export function isSimple(value: unknown): value is Simple {
  return (
    value !== null &&
    typeof value === "object" &&
    hasOwn(value, "str") &&
    typeof value.str === "string" &&
    (hasOwn(value, "num") ? typeof value.num === "number" : true) &&
    hasOwn(value, "obj") &&
    value.obj !== null &&
    typeof value.obj === "object" &&
    hasOwn(value.obj, "value") &&
    typeof value.obj.value === "boolean"
  );
}
