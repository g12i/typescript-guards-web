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

export function isId(value: unknown): value is Id {
  return typeof value === "string" || typeof value === "number";
}

export function isUser(value: unknown): value is User {
  return (
    isPlainObject(value) &&
    hasOwn(value, "id") &&
    isId(value.id) &&
    hasOwn(value, "name") &&
    typeof value.name === "string" &&
    (hasOwn(value, "email") ? typeof value.email === "string" : true) &&
    hasOwn(value, "preferences") &&
    isPlainObject(value.preferences) &&
    hasOwn(value.preferences, "theme") &&
    (value.preferences.theme === "light" ||
      value.preferences.theme === "dark") &&
    hasOwn(value, "roles") &&
    Array.isArray(value.roles) &&
    value.roles.every((el) => typeof el === "string" || typeof el === "number")
  );
}
