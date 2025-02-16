interface Person {
  name: string;
  age?: number;
  email?: string;
}

interface Employee extends Person {
  id: number;
  department?: string;
  roles: string[];
}
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

export function isPerson(value: unknown): value is Person {
  return (
    isPlainObject(value) &&
    hasOwn(value, "name") &&
    typeof value.name === "string" &&
    (hasOwn(value, "age") ? typeof value.age === "number" : true) &&
    (hasOwn(value, "email") ? typeof value.email === "string" : true)
  );
}

export function isEmployee(value: unknown): value is Employee {
  return (
    isPlainObject(value) &&
    hasOwn(value, "id") &&
    typeof value.id === "number" &&
    (hasOwn(value, "department")
      ? typeof value.department === "string"
      : true) &&
    hasOwn(value, "roles") &&
    Array.isArray(value.roles) &&
    value.roles.every((el) => typeof el === "string")
  );
}
