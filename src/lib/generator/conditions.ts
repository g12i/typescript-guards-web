export class Condition {
	expression: string;
	and: Condition[];
	or: Condition[];

	constructor(opts: { expression?: string; and?: Condition[]; or?: Condition[] }) {
		this.expression = opts.expression ?? '';
		this.and = opts.and ?? [];
		this.or = opts.or ?? [];
	}

	static expr(expression: string, comment?: string): Condition {
		return new Condition({ expression: expression + (comment ? ` /* ${comment} */` : '') });
	}

	static equals(path: string, expected: string): Condition {
		return new Condition({ expression: `${path} === ${expected}` });
	}

	static typeof(path: string, expected: string): Condition {
		return new Condition({ expression: `typeof ${path} === '${expected}'` });
	}

	static iof(path: string, expected: string): Condition {
		return new Condition({ expression: `${path} instanceof ${expected}` });
	}

	static and(conditions: Condition[]): Condition {
		return new Condition({ and: conditions });
	}

	static or(conditions: Condition[]): Condition {
		return new Condition({ or: conditions });
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
