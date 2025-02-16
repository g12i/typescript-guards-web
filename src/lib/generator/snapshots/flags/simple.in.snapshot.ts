interface Simple {
  str: string;
  num?: number;
  obj: {
    value: boolean;
  };
}

export function isSimple(value: unknown): value is Simple {
  return (
    value !== null &&
    typeof value === "object" &&
    "str" in value &&
    typeof value.str === "string" &&
    ("num" in value ? typeof value.num === "number" : true) &&
    "obj" in value &&
    value.obj !== null &&
    typeof value.obj === "object" &&
    "value" in value.obj &&
    typeof value.obj.value === "boolean"
  );
}
