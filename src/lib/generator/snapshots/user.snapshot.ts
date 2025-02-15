type Id = string | number;

type User = {
  id: Id;
  name: string;
  email?: string;
  preferences: {
    theme: "light" | "dark";
  };
  roles: (string | number)[];
};

export function isId(value: unknown): value is Id {
  return typeof value === "string" || typeof value === "number";
}

export function isUser(value: unknown): value is User {
  return (
    value !== null &&
    typeof value === "object" &&
    "id" in value &&
    isId(value.id) &&
    "name" in value &&
    typeof value.name === "string" &&
    ("email" in value ? typeof value.email === "string" : true) &&
    "preferences" in value &&
    value.preferences !== null &&
    typeof value.preferences === "object" &&
    "theme" in value.preferences &&
    (value.preferences.theme === "light" ||
      value.preferences.theme === "dark") &&
    "roles" in value &&
    Array.isArray(value.roles) &&
    value.roles.every((el) => typeof el === "string" || typeof el === "number")
  );
}
