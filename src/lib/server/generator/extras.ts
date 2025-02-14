import type { Context } from './context';

export function generateExtras(context: Context) {
	if (context.flags.needIsPlainObject && context.flags.plainObjectCheck !== 'simple') {
		if (context.flags.plainObjectCheck === 'es-toolkit') {
			context.hooks.beforeCode += ts`import { isPlainObject } from 'es-toolkit'\n`;
		}

		if (context.flags.plainObjectCheck === 'lodash') {
			context.hooks.beforeCode += ts`import { isPlainObject } from 'lodash'\n`;
		}

		if (context.flags.plainObjectCheck === 'insert') {
			context.hooks.beforeCode += ts`
function isPlainObject(value: unknown): value is Record<PropertyKey, any> {
  if (!value || typeof value !== 'object') {
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

  return Object.prototype.toString.call(value) === '[object Object]';
}\n`;
		}
	}
}

const ts = (strings: TemplateStringsArray) => strings.raw[0];
