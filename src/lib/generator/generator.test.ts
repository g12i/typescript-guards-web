import { describe, it, expect } from 'vitest';
import { generateTypeGuardForFile } from './generator';
import ts from 'typescript';

describe(generateTypeGuardForFile.name, () => {
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

		const result = await generateTypeGuardForFile(sourceFile, { plainObjectCheck: 'simple' }, true);

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

		const result = await generateTypeGuardForFile(sourceFile, { plainObjectCheck: 'simple' }, true);

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

		const result = await generateTypeGuardForFile(sourceFile, { plainObjectCheck: 'simple' }, true);

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

		const result = await generateTypeGuardForFile(sourceFile, { plainObjectCheck: 'simple' }, true);

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

		const result = await generateTypeGuardForFile(sourceFile, { plainObjectCheck: 'simple' }, true);

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

		const result = await generateTypeGuardForFile(sourceFile, { plainObjectCheck: 'simple' }, true);

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

		const result = await generateTypeGuardForFile(sourceFile, { plainObjectCheck: 'simple' }, true);

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

		const result = await generateTypeGuardForFile(sourceFile, { plainObjectCheck: 'simple' }, true);

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

		const result = await generateTypeGuardForFile(sourceFile, { plainObjectCheck: 'simple' }, true);

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

		const result = await generateTypeGuardForFile(sourceFile, { plainObjectCheck: 'simple' }, true);

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

		const result = await generateTypeGuardForFile(sourceFile, { plainObjectCheck: 'simple' }, true);

		expect(result).toMatchFileSnapshot('snapshots/functions.snapshot.ts');
	});

	it('should handle template literal types', async () => {
		const sourceFile = ts.createSourceFile(
			'template-literals.ts',
			`
type Status = \`\${string}_STATUS\`;
type HttpMethod = 'GET' | 'POST' | \`\${string}_METHOD\`;
`,
			ts.ScriptTarget.Latest,
			true
		);

		const result = await generateTypeGuardForFile(sourceFile, { plainObjectCheck: 'simple' }, true);

		expect(result).toMatchFileSnapshot('snapshots/template-literals.snapshot.ts');
	});
});
