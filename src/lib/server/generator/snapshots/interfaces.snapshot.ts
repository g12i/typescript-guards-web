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

export function isPerson(value: unknown): value is Person {
  return (
    value !== null &&
    typeof value === "object" &&
    "name" in value &&
    typeof value.name === "string" &&
    ("age" in value ? typeof value.age === "number" : true) &&
    ("email" in value ? typeof value.email === "string" : true)
  );
}

export function isEmployee(value: unknown): value is Employee {
  return (
    value !== null &&
    typeof value === "object" &&
    "id" in value &&
    typeof value.id === "number" &&
    ("department" in value ? typeof value.department === "string" : true) &&
    "roles" in value &&
    Array.isArray(value.roles) &&
    value.roles.every((el) => typeof el === "string")
  );
}
