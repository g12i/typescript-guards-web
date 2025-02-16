import { isOtherClass } from "somewhere";

class MyClass {
  prop: string = "";
}

type WithClass = {
  instance: MyClass;
  constructor: typeof MyClass;
  unknownInstance: OtherClass;
  unknownConstructor: typeof OtherClass;
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

export function isWithClass(value: unknown): value is WithClass {
  return (
    isPlainObject(value) &&
    hasOwn(value, "instance") &&
    value.instance instanceof MyClass &&
    hasOwn(value, "constructor") &&
    typeof value.constructor === "function" &&
    value.constructor.name === "MyClass" &&
    hasOwn(value, "unknownInstance") &&
    isOtherClass(value.unknownInstance) &&
    hasOwn(value, "unknownConstructor") &&
    typeof value.unknownConstructor === "function" &&
    value.unknownConstructor.name === "OtherClass"
  );
}
