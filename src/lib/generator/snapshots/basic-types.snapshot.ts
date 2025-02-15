type BasicTypes = {
  str: string;
  any: any;
  num: number;
  bool: boolean;
  nil: null;
  undef: undefined;
  unknown: unknown;
};

export function isBasicTypes(value: unknown): value is BasicTypes {
  return (
    value !== null &&
    typeof value === "object" &&
    "str" in value &&
    typeof value.str === "string" &&
    "any" in value &&
    true &&
    "num" in value &&
    typeof value.num === "number" &&
    "bool" in value &&
    typeof value.bool === "boolean" &&
    "nil" in value &&
    value.nil === null &&
    "undef" in value &&
    typeof value.undef === "undefined" &&
    "unknown" in value &&
    true
  );
}
