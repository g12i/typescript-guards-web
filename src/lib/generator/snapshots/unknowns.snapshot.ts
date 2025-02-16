interface WithIndex {
  [key: string]: any;
  [key: number]: string;
  [key: symbol]: unknown;
  normalProp: string;
}

function hasOwn<O extends object, P extends PropertyKey>(
  obj: O,
  prop: P,
): obj is O & Record<P, unknown> {
  return Object.hasOwn(obj, prop);
}

export function isWithIndex(value: unknown): value is WithIndex {
  return (
    value !== null &&
    typeof value === "object" &&
    true /* Index signatures ([key: string]: T, [key: number]: T, [key: symbol]: T) are not supported */ &&
    true /* Index signatures ([key: string]: T, [key: number]: T, [key: symbol]: T) are not supported */ &&
    true /* Index signatures ([key: string]: T, [key: number]: T, [key: symbol]: T) are not supported */ &&
    hasOwn(value, "normalProp") &&
    typeof value.normalProp === "string"
  );
}
