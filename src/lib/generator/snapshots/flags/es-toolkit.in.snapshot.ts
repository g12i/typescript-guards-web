import { isPlainObject } from "es-toolkit";

interface Simple {
  str: string;
  num?: number;
  obj: {
    value: boolean;
  };
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
