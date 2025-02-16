import type { GeneratorContext } from '$lib/generator/context';

const ts = (strings: TemplateStringsArray) => strings.raw[0];

const isPlainObject = ts`
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
}`;

const hasOwn = ts`
function hasOwn<O extends object, P extends PropertyKey>(obj: O, prop: P): obj is O & Record<P, unknown> {
  return Object.hasOwn(obj, prop);
}
`;

export function generateExtras(context: GeneratorContext) {
	if (context.runtime.needIsPlainObject) {
		if (context.flags.plainObjectCheck === 'es-toolkit') {
			context.hooks.beforeAll.set(
				'planObjectCheck',
				ts`import { isPlainObject } from 'es-toolkit'` + '\n'
			);
		}

		if (context.flags.plainObjectCheck === 'lodash') {
			context.hooks.beforeAll.set(
				'plainObjectCheck',
				ts`import { isPlainObject } from 'lodash'` + '\n'
			);
		}

		if (context.flags.plainObjectCheck === 'insert') {
			context.hooks.beforeGenerated.set('plainObjectCheck', isPlainObject + '\n');
		}
	}

	if (context.runtime.needHasOwn) {
		context.hooks.beforeGenerated.set('hasOwn', hasOwn);
	}
}
