type PlainObjectCheck = 'simple' | 'insert' | 'lodash' | 'es-toolkit';

export type Context = {
	currentValuePath: string;
	flags: {
		needIsPlainObject?: boolean;
		plainObjectCheck: PlainObjectCheck;
	};
	hooks: {
		beforeCode: string;
		afterCode: string;
	};
};
