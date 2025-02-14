
export function isStringRecord(value: unknown): value is StringRecord {
  return (
      value !== null && typeof value === 'object' &&
      Object.entries(value).every(([key, value]) =>
        typeof key === "string" && (typeof value === "number")
      )
    );
}


export function isNumberRecord(value: unknown): value is NumberRecord {
  return (
      value !== null && typeof value === 'object' &&
      Object.entries(value).every(([key, value]) =>
        typeof key === "number" && (typeof value === "string")
      )
    );
}


export function isComplexRecord(value: unknown): value is ComplexRecord {
  return (
      value !== null && typeof value === 'object' &&
      Object.entries(value).every(([key, value]) =>
        typeof key === "string" && ((value !== null && typeof value === 'object' && ('id' in value && (typeof value.id === "number"))&& ('name' in value && (typeof value.name === "string"))))
      )
    );
}


export function isStringMap(value: unknown): value is StringMap {
  return (
      value instanceof Map &&
      Array.from(value.entries()).every(([key, value]) =>
        (typeof key === "string") && (typeof value === "number")
      )
    );
}


export function isComplexMap(value: unknown): value is ComplexMap {
  return (
      value instanceof Map &&
      Array.from(value.entries()).every(([key, value]) =>
        (typeof key === "string") && ((value !== null && typeof value === 'object' && ('value' in value && (typeof value.value === "number"))))
      )
    );
}


export function isNumberSet(value: unknown): value is NumberSet {
  return (
      value instanceof Set &&
      Array.from(value.values()).every(value => typeof value === "number")
    );
}


export function isComplexSet(value: unknown): value is ComplexSet {
  return (
      value instanceof Set &&
      Array.from(value.values()).every(value => (value !== null && typeof value === 'object' && ('id' in value && (typeof value.id === "string"))))
    );
}