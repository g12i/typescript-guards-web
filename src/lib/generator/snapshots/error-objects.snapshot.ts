type ErrorObject = {
  ok: false;
  error: Error;
};

export function isErrorObject(value: unknown): value is ErrorObject {
  return (
    value !== null &&
    typeof value === "object" &&
    "ok" in value &&
    value.ok === false &&
    "error" in value &&
    value.error instanceof Error
  );
}
