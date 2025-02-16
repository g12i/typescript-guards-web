type Status = `${string}_STATUS`;
type HttpMethod = "GET" | "POST" | `${string}_METHOD`;

export function isStatus(value: unknown): value is Status {
  return typeof value === "string";
}

export function isHttpMethod(value: unknown): value is HttpMethod {
  return value === "GET" || value === "POST" || typeof value === "string";
}
