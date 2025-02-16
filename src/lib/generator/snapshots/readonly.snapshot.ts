type ReadonlyStuff = {
  readonly id: number;
  readonly data: readonly string[];
};

export function isReadonlyStuff(value: unknown): value is ReadonlyStuff {
  return (
    value !== null &&
    typeof value === "object" &&
    "id" in value &&
    typeof value.id === "number" &&
    "data" in value &&
    Array.isArray(value.data) &&
    value.data.every((el) => typeof el === "string")
  );
}
