export class Condition {
	expression: string = '';
	and: Condition[] = [];
	or: Condition[] = [];
	parent: Condition | null = null;

	constructor(opts: { expression: string; and: Condition[]; or: Condition[] }) {
		this.expression = opts.expression;
		this.and = opts.and;
		this.or = opts.or;
	}

	toString(): string {
		if (this.or.length > 0) {
			const expressions = this.or.map((c) => c.toString()).filter(Boolean);

			if (expressions.length === 0) return 'true';

			const unique = [...new Set(expressions)];

			return `(${unique.join(' || ')})`;
		}

		if (this.and.length > 0) {
			const expressions = this.and.map((c) => c.toString()).filter(Boolean);

			if (expressions.length === 0) return 'true';

			const unique = [...new Set(expressions)];

			return `(${unique.join(' && ')})`;
		}

		return this.expression;
	}
}

export const conditions = {
	equals: (path: string, expected: string): Condition =>
		new Condition({
			expression: `${path} === ${expected}`,
			and: [],
			or: []
		}),
	literal: (expression: string): Condition =>
		new Condition({
			expression,
			and: [],
			or: []
		}),
	typeof: (path: string, expected: string): Condition =>
		new Condition({
			expression: `typeof ${path} === '${expected}'`,
			and: [],
			or: []
		}),
	instanceof: (path: string, expected: string): Condition =>
		new Condition({
			expression: `${path} instanceof ${expected}`,
			and: [],
			or: []
		}),
	and: (conditions: Condition[]): Condition =>
		new Condition({
			expression: '',
			and: conditions,
			or: []
		}),
	or: (conditions: Condition[]): Condition =>
		new Condition({
			expression: '',
			and: [],
			or: conditions
		})
};
