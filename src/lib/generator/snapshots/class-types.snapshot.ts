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

export function isWithClass(value: unknown): value is WithClass {
  return (
    value !== null &&
    typeof value === "object" &&
    "instance" in value &&
    value.instance instanceof MyClass &&
    "constructor" in value &&
    typeof value.constructor === "function" &&
    value.constructor.name === "MyClass" &&
    "unknownInstance" in value &&
    isOtherClass(value.unknownInstance) &&
    "unknownConstructor" in value &&
    typeof value.unknownConstructor === "function" &&
    value.unknownConstructor.name === "OtherClass"
  );
}
