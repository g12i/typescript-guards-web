import { describe, it, expect } from 'vitest';
import { generateTypeGuardForFile } from './generator';
import ts from 'typescript';
import type { Flags } from './context';

type MatrixType = {
	[K in keyof Flags]: Record<Flags[K], boolean>;
};

const matrix: MatrixType = {
	plainObjectCheck: {
		'es-toolkit': true,
		insert: true,
		lodash: true,
		simple: true
	},
	hasOwnCheck: {
		hasOwn: true,
		in: true
	}
};

function generateFlagCombinations<T extends Record<string, Record<string, boolean>>>(
	matrix: T
): Array<{ [K in keyof T]: keyof T[K] }> {
	const entries = Object.entries(matrix);
	return entries.reduce(
		(combinations, [key, values], index) => {
			const valueKeys = Object.keys(values);
			if (index === 0) {
				return valueKeys.map((value) => ({ [key]: value }));
			}
			return combinations.flatMap((combination) =>
				valueKeys.map((value) => ({
					...combination,
					[key]: value
				}))
			);
		},
		[] as { [k: string]: string }[]
	) as { [K in keyof T]: keyof T[K] }[];
}

const allFlags = generateFlagCombinations(matrix);

describe(generateTypeGuardForFile.name, () => {
	describe('flag combinations', () => {
		it.each(allFlags)(
			'should generate with plainObjectCheck: $plainObjectCheck and hasOwnCheck: $hasOwnCheck',
			async (flags) => {
				const source = `
                    interface Simple {
                        str: string;
                        num?: number;
                        obj: {
                            value: boolean;
                        };
                    }
                `;
				const sourceFile = ts.createSourceFile('simple.ts', source, ts.ScriptTarget.Latest, true);

				const result = await generateTypeGuardForFile(sourceFile, flags, true);

				expect(result).toMatchFileSnapshot(
					`snapshots/flags/${flags.plainObjectCheck}.${flags.hasOwnCheck}.snapshot.ts`
				);
			}
		);
	});

	it('should generate a type guard for basic types', async () => {
		const sourceFile = ts.createSourceFile(
			'basic-types.ts',
			`
type BasicTypes = {
  str: string;
  any: any;
  num: number;
  bool: boolean;
  nil: null;
  undef: undefined;
  unknown: unknown;
}`,
			ts.ScriptTarget.Latest,
			true
		);

		const result = await generateTypeGuardForFile(
			sourceFile,
			{ plainObjectCheck: 'insert', hasOwnCheck: 'hasOwn' },
			true
		);

		expect(result).toMatchFileSnapshot('snapshots/basic-types.snapshot.ts');
	});

	it('should generate a type guard for union and intersection types', async () => {
		const sourceFile = ts.createSourceFile(
			'union-intersection.ts',
			`
type Union = string | number | boolean;
type Intersection = { id: number } & { name: string };
type ComplexUnion = { type: "a"; value: string } | { type: "b"; value: number };`,
			ts.ScriptTarget.Latest,
			true
		);

		const result = await generateTypeGuardForFile(
			sourceFile,
			{ plainObjectCheck: 'insert', hasOwnCheck: 'hasOwn' },
			true
		);

		expect(result).toMatchFileSnapshot('snapshots/union-intersection.snapshot.ts');
	});

	it('should generate a type guard for arrays and tuples', async () => {
		const sourceFile = ts.createSourceFile(
			'arrays-tuples.ts',
			`
type StringArray = string[];
type NumberArray = Array<number>;
type Tuple = [string, number, boolean];
type NestedArray = Array<Array<string>>;`,
			ts.ScriptTarget.Latest,
			true
		);

		const result = await generateTypeGuardForFile(
			sourceFile,
			{ plainObjectCheck: 'insert', hasOwnCheck: 'hasOwn' },
			true
		);

		expect(result).toMatchFileSnapshot('snapshots/arrays-tuples.snapshot.ts');
	});

	it('should generate a type guard for interfaces with optional properties', async () => {
		const sourceFile = ts.createSourceFile(
			'interfaces.ts',
			`
interface Person {
  name: string;
  age?: number;
  email?: string;
}

interface Employee extends Person {
  id: number;
  department?: string;
  roles: string[];
}`,
			ts.ScriptTarget.Latest,
			true
		);

		const result = await generateTypeGuardForFile(
			sourceFile,
			{ plainObjectCheck: 'insert', hasOwnCheck: 'hasOwn' },
			true
		);

		expect(result).toMatchFileSnapshot('snapshots/interfaces.snapshot.ts');
	});

	it('should generate a type guard for nested objects and literals', async () => {
		const sourceFile = ts.createSourceFile(
			'nested-objects.ts',
			`
type Config = {
  server: {
    port: number;
    host: string;
    settings: {
      timeout: number;
      mode: "development" | "production";
    };
  };
  database: {
    url: string;
    credentials?: {
      username: string;
      password: string;
    };
  };
}`,
			ts.ScriptTarget.Latest,
			true
		);

		const result = await generateTypeGuardForFile(
			sourceFile,
			{ plainObjectCheck: 'insert', hasOwnCheck: 'hasOwn' },
			true
		);

		expect(result).toMatchFileSnapshot('snapshots/nested-objects.snapshot.ts');
	});

	// Original test
	it('should generate a type guard for a user type', async () => {
		const sourceFile = ts.createSourceFile(
			'user.ts',
			`
type Id = string | number;

type User = {
  id: Id;
  name: string;
  email?: string;
  preferences: {
    theme: "light" | "dark";
  };
  roles: (string | number)[];
}`,
			ts.ScriptTarget.Latest,
			true
		);

		const result = await generateTypeGuardForFile(
			sourceFile,
			{ plainObjectCheck: 'insert', hasOwnCheck: 'hasOwn' },
			true
		);

		expect(result).toMatchFileSnapshot('snapshots/user.snapshot.ts');
	});

	it('should generate type guards for Record, Map and Set types', async () => {
		const sourceFile = ts.createSourceFile(
			'collections.ts',
			`
type StringRecord = Record<string, number>;
type NumberRecord = Record<number, string>;
type ComplexRecord = Record<string, { id: number; name: string }>;

type StringMap = Map<string, number>;
type ComplexMap = Map<string, { value: number }>;

type NumberSet = Set<number>;
type ComplexSet = Set<{ id: string }>;
`,
			ts.ScriptTarget.Latest,
			true
		);

		const result = await generateTypeGuardForFile(
			sourceFile,
			{ plainObjectCheck: 'insert', hasOwnCheck: 'hasOwn' },
			true
		);

		expect(result).toMatchFileSnapshot('snapshots/collections.snapshot.ts');
	});

	it('should generate type guards for error objects', async () => {
		const sourceFile = ts.createSourceFile(
			'error-objects.ts',
			`
type ErrorObject = {
			ok: false;
			error: Error;
};`,
			ts.ScriptTarget.Latest,
			true
		);

		const result = await generateTypeGuardForFile(
			sourceFile,
			{ plainObjectCheck: 'insert', hasOwnCheck: 'hasOwn' },
			true
		);

		expect(result).toMatchFileSnapshot('snapshots/error-objects.snapshot.ts');
	});

	// generator.test.ts
	it('should generate type guards for class types', async () => {
		const sourceFile = ts.createSourceFile(
			'class-types.ts',
			`
import { isOtherClass } from 'somewhere'

class MyClass {
  prop: string = '';
}

type WithClass = {
  instance: MyClass;
  constructor: typeof MyClass;
  unknownInstance: OtherClass;
  unknownConstructor: typeof OtherClass;
}`,
			ts.ScriptTarget.Latest,
			true
		);

		const result = await generateTypeGuardForFile(
			sourceFile,
			{ plainObjectCheck: 'insert', hasOwnCheck: 'hasOwn' },
			true
		);

		expect(result).toMatchFileSnapshot('snapshots/class-types.snapshot.ts');
	});

	it('should handle readonly modifiers correctly', async () => {
		const sourceFile = ts.createSourceFile(
			'readonly.ts',
			`
type ReadonlyStuff = {
  readonly id: number;
  readonly data: readonly string[];
};`,
			ts.ScriptTarget.Latest,
			true
		);

		const result = await generateTypeGuardForFile(
			sourceFile,
			{ plainObjectCheck: 'insert', hasOwnCheck: 'hasOwn' },
			true
		);

		expect(result).toMatchFileSnapshot('snapshots/readonly.snapshot.ts');
	});

	it('should handle function types', async () => {
		const sourceFile = ts.createSourceFile(
			'functions.ts',
			`
type WithFunction = {
  callback: (arg: string) => number;
  method(): void;
  multiArg(x: number, y: string): boolean;
};`,
			ts.ScriptTarget.Latest,
			true
		);

		const result = await generateTypeGuardForFile(
			sourceFile,
			{ plainObjectCheck: 'insert', hasOwnCheck: 'hasOwn' },
			true
		);

		expect(result).toMatchFileSnapshot('snapshots/functions.snapshot.ts');
	});

	it('should handle empty interface', async () => {
		const source = `interface Empty {}`;
		const sourceFile = ts.createSourceFile('empty.ts', source, ts.ScriptTarget.Latest, true);

		const result = await generateTypeGuardForFile(
			sourceFile,
			{ plainObjectCheck: 'insert', hasOwnCheck: 'hasOwn' },
			true
		);

		expect(result).toMatchFileSnapshot(`snapshots/empty.snapshot.ts`);
	});

	it('should handle index signatures with comments', async () => {
		const source = `
                interface WithIndex {
                    [key: string]: any;
                    [key: number]: string;
                    [key: symbol]: unknown;
                    normalProp: string;
                }
            `;
		const sourceFile = ts.createSourceFile('index.ts', source, ts.ScriptTarget.Latest, true);

		const result = await generateTypeGuardForFile(
			sourceFile,
			{ plainObjectCheck: 'insert', hasOwnCheck: 'hasOwn' },
			true
		);

		expect(result).toMatchFileSnapshot(`snapshots/index-signatures.snapshot.ts`);
	});

	it('should handle complex nested types', async () => {
		const source = `
                type Nested = {
                    a: {
                        b: {
                            c: string;
                        }[];
                    };
                };
            `;
		const sourceFile = ts.createSourceFile('nested.ts', source, ts.ScriptTarget.Latest, true);

		const result = await generateTypeGuardForFile(
			sourceFile,
			{ plainObjectCheck: 'insert', hasOwnCheck: 'hasOwn' },
			true
		);

		expect(result).toMatchFileSnapshot(`snapshots/nested.snapshot.ts`);
	});

	it('should handle circular references', async () => {
		const source = `
                interface Node {
                    value: string;
                    parent?: Node;
                    children: Node[];
                }
            `;

		const sourceFile = ts.createSourceFile('circular.ts', source, ts.ScriptTarget.Latest, true);

		const result = await generateTypeGuardForFile(
			sourceFile,
			{ plainObjectCheck: 'insert', hasOwnCheck: 'hasOwn' },
			true
		);

		expect(result).toMatchFileSnapshot(`snapshots/circular.snapshot.ts`);
	});

	it('should handle never type', async () => {
		const sourceFile = ts.createSourceFile(
			'never.ts',
			`
        type NeverType = string & number; // resolves to never
        type WithNever = {
            impossible: never;
        };`,
			ts.ScriptTarget.Latest,
			true
		);

		const result = await generateTypeGuardForFile(
			sourceFile,
			{ plainObjectCheck: 'insert', hasOwnCheck: 'hasOwn' },
			true
		);

		expect(result).toMatchFileSnapshot(`snapshots/never.snapshot.ts`);
	});

	it('should handle bigint type', async () => {
		const sourceFile = ts.createSourceFile(
			'bigint.ts',
			`
        type WithBigInt = {
            big: bigint;
            optional?: bigint;
            bigOrNumber: bigint | number;
        };`,
			ts.ScriptTarget.Latest,
			true
		);

		const result = await generateTypeGuardForFile(
			sourceFile,
			{ plainObjectCheck: 'insert', hasOwnCheck: 'hasOwn' },
			true
		);

		expect(result).toMatchFileSnapshot(`snapshots/bigint.snapshot.ts`);
	});
});
