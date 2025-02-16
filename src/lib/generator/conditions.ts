export class Condition {
	expression: string;
	comment: string;
	and: Condition[];
	or: Condition[];

	constructor(opts: {
		expression?: string;
		comment?: string;
		and?: Condition[];
		or?: Condition[];
	}) {
		this.expression = opts.expression ?? '';
		this.comment = opts.comment ?? '';
		this.and = opts.and ?? [];
		this.or = opts.or ?? [];
	}

	collectComments(): Set<string> {
		const comments = new Set<string>();

		if (this.comment) {
			comments.add(this.comment);
		}

		for (const cond of this.and) {
			for (const comment of cond.collectComments()) {
				comments.add(comment);
			}
		}

		for (const cond of this.or) {
			for (const comment of cond.collectComments()) {
				comments.add(comment);
			}
		}

		return comments;
	}

	static expr(expression: string, comment?: string): Condition {
		return new Condition({ expression, comment });
	}

	static eq(path: string, expected: string): Condition {
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

	equals(condition: Condition): boolean {
		if (this.expression !== condition.expression) return false;

		if (this.and.length !== condition.and.length) return false;

		if (this.or.length !== condition.or.length) return false;

		if (this.and.length > 0 || this.or.length > 0) {
			for (let i = 0; i < this.and.length; i++) {
				if (!this.and[i].equals(condition.and[i])) return false;
			}

			for (let i = 0; i < this.or.length; i++) {
				if (!this.or[i].equals(condition.or[i])) return false;
			}
		}

		return true;
	}

	simplify(): Condition {
		const simplified = new Condition({
			expression: this.expression,
			comment: this.comment,
			and: this.and.map((c) => c.simplify()),
			or: this.or.map((c) => c.simplify())
		});

		return simplified.applyIdempotentLaw().applyAnnulmentLaw().applyIdentityLaw();
	}
	/**
	 * Idempotent Law: A AND A = A, A OR A = A
	 */
	private applyIdempotentLaw(): Condition {
		const uniqueAnd: Condition[] = [];
		const uniqueOr: Condition[] = [];

		for (const cond of this.and) {
			if (!uniqueAnd.some((c) => c.equals(cond))) {
				uniqueAnd.push(cond);
			}
		}

		for (const cond of this.or) {
			if (!uniqueOr.some((c) => c.equals(cond))) {
				uniqueOr.push(cond);
			}
		}

		return new Condition({
			expression: this.expression,
			comment: this.comment,
			and: uniqueAnd,
			or: uniqueOr
		});
	}

	/**
	 * Identity Law: A AND true = A, A OR false = A
	 */
	private applyIdentityLaw(): Condition {
		const trueCondition = Condition.expr('true');
		const falseCondition = Condition.expr('false');

		const newAnd = this.and.filter((c) => !c.equals(trueCondition));
		const newOr = this.or.filter((c) => !c.equals(falseCondition));

		return new Condition({
			expression: this.expression,
			comment: this.comment,
			and: newAnd,
			or: newOr
		});
	}

	/**
	 * Annulment Law: A AND false = false, A OR true = true
	 */
	private applyAnnulmentLaw(): Condition {
		const trueCondition = Condition.expr('true');
		const falseCondition = Condition.expr('false');

		if (this.and.some((c) => c.equals(falseCondition))) {
			return falseCondition; // A AND false = false
		}

		if (this.or.some((c) => c.equals(trueCondition))) {
			return trueCondition; // A OR true = true
		}

		return this;
	}

	flattenAnd(): Condition {
		if (this.and.length === 0) {
			return this;
		}

		const flattened: Condition[] = [];

		for (const cond of this.and) {
			if (cond.and.length > 0) {
				// Recursively flatten nested AND conditions
				flattened.push(...cond.flattenAnd().and);
			} else {
				flattened.push(cond);
			}
		}

		return new Condition({
			expression: this.expression,
			comment: this.comment,
			and: flattened,
			or: this.or
		});
	}

	toString(): string {
		const simplified = this.simplify();

		if (simplified.expression) {
			return simplified.expression;
		}

		if (simplified.or.length > 0) {
			const orExpressions = simplified.or.map((c) => c.toString()).filter(Boolean);

			if (orExpressions.length === 0) {
				return 'false';
			}

			return `(${orExpressions.join(' || ')})`;
		}

		if (simplified.and.length > 0) {
			const andExpressions = simplified.and.map((c) => c.toString()).filter(Boolean);

			if (andExpressions.length === 0) {
				return 'true'; // AND should resolve to true if empty
			}

			return `(${andExpressions.join(' && ')})`;
		}

		return 'true'; // Should not really happen
	}
}
