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

export function isConfig(value: unknown): value is Config {
  return (
    value !== null &&
    typeof value === "object" &&
    "server" in value &&
    value.server !== null &&
    typeof value.server === "object" &&
    "port" in value.server &&
    typeof value.server.port === "number" &&
    "host" in value.server &&
    typeof value.server.host === "string" &&
    "settings" in value.server &&
    value.server.settings !== null &&
    typeof value.server.settings === "object" &&
    "timeout" in value.server.settings &&
    typeof value.server.settings.timeout === "number" &&
    "mode" in value.server.settings &&
    (value.server.settings.mode === "development" ||
      value.server.settings.mode === "production") &&
    "database" in value &&
    value.database !== null &&
    typeof value.database === "object" &&
    "url" in value.database &&
    typeof value.database.url === "string" &&
    ("credentials" in value.database
      ? value.database.credentials !== null &&
        typeof value.database.credentials === "object" &&
        "username" in value.database.credentials &&
        typeof value.database.credentials.username === "string" &&
        "password" in value.database.credentials &&
        typeof value.database.credentials.password === "string"
      : true)
  );
}
