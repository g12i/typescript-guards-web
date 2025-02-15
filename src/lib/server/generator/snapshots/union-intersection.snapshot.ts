type Union = string | number | boolean;
type Intersection = { id: number } & { name: string };
type ComplexUnion = { type: "a"; value: string } | { type: "b"; value: number };

export function isUnion(value: unknown): value is Union {
  return (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  );
}

export function isIntersection(value: unknown): value is Intersection {
  return (
    value !== null &&
    typeof value === "object" &&
    "id" in value &&
    typeof value.id === "number" &&
    value !== null &&
    typeof value === "object" &&
    "name" in value &&
    typeof value.name === "string"
  );
}

export function isComplexUnion(value: unknown): value is ComplexUnion {
  return (
    (value !== null &&
      typeof value === "object" &&
      "type" in value &&
      value.type === "a" &&
      "value" in value &&
      typeof value.value === "string") ||
    (value !== null &&
      typeof value === "object" &&
      "type" in value &&
      value.type === "b" &&
      "value" in value &&
      typeof value.value === "number")
  );
}
