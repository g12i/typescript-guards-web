type WithFunction = {
  callback: (arg: string) => number;
  method(): void;
  multiArg(x: number, y: string): boolean;
};

export function isWithFunction(value: unknown): value is WithFunction {
  return (
    value !== null &&
    typeof value === "object" &&
    "callback" in value &&
    typeof value.callback === "function" &&
    "method" in value &&
    typeof value.method === "function" &&
    "multiArg" in value &&
    typeof value.multiArg === "function"
  );
}
