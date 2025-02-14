
export function isBasicTypes(value: unknown): value is BasicTypes {
  return (value !== null && typeof value === 'object' && ('str' in value && (typeof value.str === "string"))&& ('num' in value && (typeof value.num === "number"))&& ('bool' in value && (typeof value.bool === "boolean"))&& ('nil' in value && (value.nil === null))&& ('undef' in value && (typeof value.undef === "undefined"))&& ('any' in value && (true))&& ('unknown' in value && (true)));
}