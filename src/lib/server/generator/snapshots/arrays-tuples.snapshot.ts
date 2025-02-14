
export function isStringArray(value: unknown): value is StringArray {
  return (
Array.isArray(value)
&& value.every(el => typeof el === "string")
);
}


export function isNumberArray(value: unknown): value is NumberArray {
  return (
Array.isArray(value)
&& value.every(el => typeof el === "number")
);
}


export function isTuple(value: unknown): value is Tuple {
  return Array.isArray(value) && value.length === 3 && (typeof value[0] === "string")&&(typeof value[1] === "number")&&(typeof value[2] === "boolean");
}


export function isNestedArray(value: unknown): value is NestedArray {
  return (
Array.isArray(value)
&& value.every(el => (
Array.isArray(el)
&& el.every(el => typeof el === "string")
))
);
}