type Config = {
  server: {
    port: number;
    host: string;
    settings: {
      timeout: number;
      mode: "development" | "production";
    };
  };
  database: {
    url: string;
    credentials?: {
      username: string;
      password: string;
    };
  };
};
function isPlainObject(value: unknown): value is Record<PropertyKey, any> {
  if (!value || typeof value !== "object") {
    return false;
  }

  const proto = Object.getPrototypeOf(value) as typeof Object.prototype | null;

  const hasObjectPrototype =
    proto === null ||
    proto === Object.prototype ||
    // Required to support node:vm.runInNewContext({})
    Object.getPrototypeOf(proto) === null;

  if (!hasObjectPrototype) {
    return false;
  }

  return Object.prototype.toString.call(value) === "[object Object]";
}

function hasOwn<O extends object, P extends PropertyKey>(
  obj: O,
  prop: P,
): obj is O & Record<P, unknown> {
  return Object.hasOwn(obj, prop);
}

export function isConfig(value: unknown): value is Config {
  return (
    isPlainObject(value) &&
    hasOwn(value, "server") &&
    isPlainObject(value.server) &&
    hasOwn(value.server, "port") &&
    typeof value.server.port === "number" &&
    hasOwn(value.server, "host") &&
    typeof value.server.host === "string" &&
    hasOwn(value.server, "settings") &&
    isPlainObject(value.server.settings) &&
    hasOwn(value.server.settings, "timeout") &&
    typeof value.server.settings.timeout === "number" &&
    hasOwn(value.server.settings, "mode") &&
    (value.server.settings.mode === "development" ||
      value.server.settings.mode === "production") &&
    hasOwn(value, "database") &&
    isPlainObject(value.database) &&
    hasOwn(value.database, "url") &&
    typeof value.database.url === "string" &&
    (hasOwn(value.database, "credentials")
      ? isPlainObject(value.database.credentials) &&
        hasOwn(value.database.credentials, "username") &&
        typeof value.database.credentials.username === "string" &&
        hasOwn(value.database.credentials, "password") &&
        typeof value.database.credentials.password === "string"
      : true)
  );
}
