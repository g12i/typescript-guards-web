export type Flags = {
	plainObjectCheck: 'simple' | 'insert' | 'lodash' | 'es-toolkit';
	hasOwnCheck: 'in' | 'hasOwn';
};

export const defaultFlags: Flags = {
	plainObjectCheck: 'simple',
	hasOwnCheck: 'in'
};

export function isFlags(value: unknown): value is Flags {
	return (
		value !== null &&
		typeof value === 'object' &&
		'plainObjectCheck' in value &&
		(value.plainObjectCheck === 'simple' ||
			value.plainObjectCheck === 'insert' ||
			value.plainObjectCheck === 'lodash' ||
			value.plainObjectCheck === 'es-toolkit') &&
		'hasOwnCheck' in value &&
		(value.hasOwnCheck === 'in' || value.hasOwnCheck === 'hasOwn')
	);
}

export type GeneratorContext = {
	currentValuePath: string;
	runtime: {
		needIsPlainObject?: boolean;
		needHasOwn?: boolean;
		classes: Set<string>;
		imports: Set<string>;
		generatedTypeGuards: Set<string>;
	};
	flags: Flags;
	hooks: {
		beforeAll: Map<string, string>;
		beforeGenerated: Map<string, string>;
		afterGenerated: Map<string, string>;
	};
};
