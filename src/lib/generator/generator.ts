import ts from 'typescript';
import { type GeneratorContext, type Flags, defaultFlags } from '$lib/generator/context';
import { generateExtras } from './extras';
import { formatTypeScript } from './format';
import { Condition } from './conditions';

export async function generateTypeGuardForFile(
	sourceFile: ts.SourceFile,
	flags?: Flags,
	format = false
): Promise<string> {
	const declarations: (ts.TypeAliasDeclaration | ts.InterfaceDeclaration)[] = [];

	const context: GeneratorContext = {
		currentValuePath: 'value',
		runtime: {
			classes: new Set(),
			imports: new Set(),
			generatedTypeGuards: new Set()
		},
		flags: {
			...defaultFlags,
			...flags
		},
		hooks: {
			beforeAll: new Map(),
			afterGenerated: new Map(),
			beforeGenerated: new Map()
		}
	};

	const visit = (node: ts.Node) => {
		if (ts.isTypeAliasDeclaration(node) || ts.isInterfaceDeclaration(node)) {
			declarations.push(node);
		}
		if (ts.isClassDeclaration(node) && node.name) {
			context.runtime.classes.add(node.name.text);
		}
		if (ts.isImportDeclaration(node)) {
			if (node.importClause) {
				// Handle default imports
				if (node.importClause.name) {
					context.runtime.imports.add(node.importClause.name.text);
				}

				// Handle named imports
				if (node.importClause.namedBindings && ts.isNamedImports(node.importClause.namedBindings)) {
					node.importClause.namedBindings.elements.forEach((element) => {
						context.runtime.imports.add(element.name.text);
					});
				}
			}
		}
		ts.forEachChild(node, visit);
	};

	ts.forEachChild(sourceFile, visit);

	const code = declarations.map((d) => generateTypeGuardForDeclaration(d, context)).join('\n\n');

	generateExtras(context);

	let finalCode =
		printHooks(context.hooks.beforeAll) +
		sourceFile.getText() +
		printHooks(context.hooks.beforeGenerated) +
		code +
		printHooks(context.hooks.afterGenerated);

	if (format) {
		finalCode = await formatTypeScript(finalCode);
	}

	return finalCode;
}

function generateTypeGuardForDeclaration(
	decl: ts.TypeAliasDeclaration | ts.InterfaceDeclaration,
	context: GeneratorContext
) {
	let typeName = decl.name.text;
	const functionName = `is${typeName}`;
	const type = ts.isTypeAliasDeclaration(decl) ? decl.type : decl;

	context.runtime.generatedTypeGuards.add(typeName);

	if (decl.typeParameters && decl.typeParameters.length > 0) {
		const anys = Array.from({ length: decl.typeParameters.length }, () => 'any').join(', ');

		typeName += `<${anys}>`;
	}

	const condition = generateNodeCondition(type, context);

	const comments = condition.collectComments();

	return `
${comments.size > 0 ? `/* Warning:\n${[...comments].map((c) => `* - ${c}`).join('\n')}\n*/` : ''}
export function ${functionName}(value: unknown): value is ${typeName} {
  return ${condition};
}`;
}

function generateNodeCondition(node: ts.Node, context: GeneratorContext): Condition {
	if (ts.isUnionTypeNode(node)) {
		return generateUnionCondition(node, context);
	}

	if (ts.isIntersectionTypeNode(node)) {
		return generateIntersectionCondition(node, context);
	}

	if (ts.isArrayTypeNode(node)) {
		return generateArrayCondition(node, context);
	}

	if (ts.isParenthesizedTypeNode(node)) {
		return generateNodeCondition(node.type, context);
	}

	if (ts.isTypeLiteralNode(node) || ts.isInterfaceDeclaration(node)) {
		return generateDeclarationCondition(node, context);
	}

	if (ts.isTupleTypeNode(node)) {
		return generateTupleCondition(node, context);
	}

	if (ts.isLiteralTypeNode(node)) {
		return generateLiteralCondition(node, context);
	}

	if (ts.isTypeQueryNode(node)) {
		return generateTypeQueryCondition(node, context);
	}

	if (ts.isTypeReferenceNode(node)) {
		return generateReferenceCondition(node, context);
	}

	if (ts.isTypeOperatorNode(node) && node.operator === ts.SyntaxKind.ReadonlyKeyword) {
		return generateNodeCondition(node.type, context);
	}

	const valuePath = context.currentValuePath;

	if (ts.isFunctionTypeNode(node) || ts.isMethodSignature(node) || ts.isMethodDeclaration(node)) {
		return Condition.typeof(valuePath, 'function');
	}

	if (node.kind === ts.SyntaxKind.NeverKeyword) {
		return Condition.expr('false', 'Never type');
	}

	if (node.kind === ts.SyntaxKind.BigIntKeyword) {
		return Condition.typeof(valuePath, 'bigint');
	}

	if (node.kind === ts.SyntaxKind.StringKeyword || ts.isTemplateLiteralTypeNode(node)) {
		return Condition.typeof(valuePath, 'string');
	}

	if (node.kind === ts.SyntaxKind.NumberKeyword) {
		return Condition.typeof(valuePath, 'number');
	}

	if (node.kind === ts.SyntaxKind.BooleanKeyword) {
		return Condition.typeof(valuePath, 'boolean');
	}

	if (node.kind === ts.SyntaxKind.UndefinedKeyword) {
		return Condition.typeof(valuePath, 'undefined');
	}

	if (node.kind === ts.SyntaxKind.NullKeyword) {
		return Condition.eq(valuePath, 'null');
	}

	if (node.kind === ts.SyntaxKind.AnyKeyword || node.kind === ts.SyntaxKind.UnknownKeyword) {
		// Any type is always true
		return Condition.expr('true');
	}

	return Condition.expr('true', `Unsupported type: ${ts.SyntaxKind[node.kind]}`);
}

function generateDeclarationCondition(
	node: ts.TypeLiteralNode | ts.InterfaceDeclaration,
	context: GeneratorContext
): Condition {
	const valuePath = context.currentValuePath;

	const members = ts.isTypeLiteralNode(node) ? node.members : node.members;

	const memberConditions = members.map((member) => generateMemberCondition(member, context));

	return Condition.and([Condition.expr($isObject(context, valuePath)), ...memberConditions]);
}

function generateMemberCondition(member: ts.TypeElement, context: GeneratorContext): Condition {
	const valuePath = context.currentValuePath;

	if (ts.isIndexSignatureDeclaration(member)) {
		return Condition.expr(
			`true`,
			`Index signatures ([key: string]: T, [key: number]: T, [key: symbol]: T) are not yet supported`
		);
	}

	const propName = member.name?.getText();

	if (!propName) {
		return Condition.expr('true', `Unknown member type: ${ts.SyntaxKind[member.kind]}`);
	}

	// Handle computed properties (like Symbol.iterator)
	if (ts.isPropertySignature(member) && ts.isComputedPropertyName(member.name)) {
		const symbolName = member.name.expression.getText();
		const newContext = {
			...context,
			currentValuePath: `${context.currentValuePath}[${symbolName}]`
		};

		return generateNodeCondition(member.type!, newContext);
	}

	if (ts.isMethodSignature(member)) {
		return Condition.and([
			Condition.expr($hasOwn(context, valuePath, propName)),
			Condition.typeof(`${valuePath}.${propName}`, 'function')
		]);
	}

	if (ts.isPropertySignature(member)) {
		const propType = member.type;

		if (!propType) {
			return Condition.expr('true', `Property signature without type`);
		}

		const newContext = {
			...context,
			currentValuePath: `${context.currentValuePath}.${propName}`
		};

		const propertyCondition = generateNodeCondition(propType, newContext);

		// Handle optional properties
		const isOptional = member.questionToken !== undefined;

		if (isOptional) {
			return Condition.expr(
				`(${$hasOwn(context, valuePath, propName)} ? (${propertyCondition}) : true)`
			);
		}

		return Condition.and([
			Condition.expr($hasOwn(context, valuePath, propName)),
			propertyCondition
		]);
	}

	return Condition.expr('true', `Unsupported member type: ${ts.SyntaxKind[member.kind]}`);
}

function generateReferenceCondition(
	node: ts.TypeReferenceNode,
	context: GeneratorContext
): Condition {
	const valuePath = context.currentValuePath;
	const typeName = node.typeName.getText();

	if (typeName === 'Record') {
		return generateRecordCondition(node, context);
	}

	if (typeName === 'Map') {
		return generateMapCondition(node, context);
	}

	if (typeName === 'Set') {
		return generateSetCondition(node, context);
	}

	if (typeName === 'Error') {
		return Condition.expr(`${valuePath} instanceof Error`);
	}

	if (typeName === 'Array') {
		if (!node.typeArguments || node.typeArguments.length !== 1) {
			return Condition.expr('true', `Invalid Array type`);
		}

		const elementType = node.typeArguments[0];

		return generateArrayCondition({ elementType }, context);
	}

	// Add this class handling:
	if (typeName.startsWith('typeof ')) {
		const className = typeName.replace('typeof ', '');
		if (context.runtime.classes.has(className)) {
			return Condition.and([
				Condition.typeof(valuePath, 'function'),
				Condition.eq(`${valuePath}.name`, `"${className}"`)
			]);
		}
	}

	if (context.runtime.classes.has(typeName)) {
		return Condition.expr(`(${valuePath} instanceof ${typeName})`);
	}

	if (
		context.runtime.generatedTypeGuards.has(typeName) ||
		context.runtime.imports.has(`is${typeName}`)
	) {
		return Condition.expr(`is${typeName}(${valuePath})`);
	}

	return Condition.expr($isObject(context, valuePath));
}

function generateLiteralCondition(node: ts.LiteralTypeNode, context: GeneratorContext): Condition {
	const literal = node.literal.getText();

	return Condition.eq(context.currentValuePath, literal);
}

function generateArrayCondition(
	node: Pick<ts.ArrayTypeNode, 'elementType'>,
	context: GeneratorContext
): Condition {
	const valuePath = context.currentValuePath;
	const elementType = node.elementType;
	const elementContext = {
		...context,
		currentValuePath: 'el'
	};

	const elementCondition = generateNodeCondition(elementType, elementContext);

	return Condition.and([
		Condition.expr(`Array.isArray(${valuePath})`),
		Condition.expr(`${valuePath}.every(el => ${elementCondition})`)
	]);
}

function generateTupleCondition(node: ts.TupleTypeNode, context: GeneratorContext): Condition {
	const valuePath = context.currentValuePath;

	const elementTypes = node.elements;

	const tupleConditions = elementTypes.map((type, index) => {
		const elementContext = {
			...context,
			currentValuePath: `${context.currentValuePath}[${index}]`
		};

		return generateNodeCondition(type, elementContext);
	});

	return Condition.and([
		Condition.expr(`Array.isArray(${valuePath})`),
		Condition.expr(`${valuePath}.length === ${elementTypes.length}`),
		...tupleConditions
	]);
}

function generateUnionCondition(node: ts.UnionTypeNode, context: GeneratorContext): Condition {
	return Condition.or(node.types.map((type) => generateNodeCondition(type, context)));
}

function generateIntersectionCondition(
	node: ts.IntersectionTypeNode,
	context: GeneratorContext
): Condition {
	return Condition.and(node.types.map((type) => generateNodeCondition(type, context))).flattenAnd();
}

function generateRecordCondition(node: ts.TypeReferenceNode, context: GeneratorContext): Condition {
	const valuePath = context.currentValuePath;

	if (node.typeArguments && node.typeArguments.length === 2) {
		const [keyType, valueType] = node.typeArguments;

		const keyTypeString = keyType.kind === ts.SyntaxKind.StringKeyword ? 'string' : 'number';

		const valueContext: GeneratorContext = {
			...context,
			currentValuePath: 'value'
		};

		const valueCondition = generateNodeCondition(valueType, valueContext);

		return Condition.and([
			Condition.expr($isObject(context, valuePath)),
			Condition.expr(`Object.entries(${valuePath}).every(([key, value]) =>
        typeof key === "${keyTypeString}" && (${valueCondition})
      )`)
		]);
	}

	return Condition.expr('true', `Invalid generic arguments for Record. Expected Record<K, V>`);
}

function generateMapCondition(node: ts.TypeReferenceNode, context: GeneratorContext): Condition {
	const valuePath = context.currentValuePath;

	if (node.typeArguments && node.typeArguments.length === 2) {
		const [keyType, valueType] = node.typeArguments;

		const keyContext: GeneratorContext = {
			...context,
			currentValuePath: 'key'
		};

		const valueContext: GeneratorContext = {
			...context,
			currentValuePath: 'value'
		};

		const keyCondition = generateNodeCondition(keyType, keyContext);
		const valueCondition = generateNodeCondition(valueType, valueContext);

		return Condition.and([
			Condition.iof(valuePath, 'Map'),
			Condition.expr(`Array.from(${valuePath}.entries()).every(([key, value]) =>
        (${keyCondition}) && (${valueCondition})
      )`)
		]);
	}

	return Condition.expr('true', 'Invalid generic arguments for Map. Expected Map<K, V>');
}

function generateSetCondition(node: ts.TypeReferenceNode, context: GeneratorContext): Condition {
	const valuePath = context.currentValuePath;

	if (node.typeArguments && node.typeArguments.length === 1) {
		const [valueType] = node.typeArguments;

		const valueContext: GeneratorContext = {
			...context,
			currentValuePath: 'value'
		};

		const valueCondition = generateNodeCondition(valueType, valueContext);

		return Condition.and([
			Condition.iof(valuePath, 'Set'),
			Condition.expr(`Array.from(${valuePath}.values()).every(value => ${valueCondition})`)
		]);
	}

	return Condition.expr('true', 'Invalid generic arguments for Set. Expected Set<T>');
}

function generateTypeQueryCondition(node: ts.TypeQueryNode, context: GeneratorContext): Condition {
	const typeName = node.exprName.getText();

	return Condition.and([
		Condition.typeof(context.currentValuePath, 'function'),
		Condition.eq(`${context.currentValuePath}.name`, `"${typeName}"`)
	]);
}

function printHooks(map: Map<string, string>): string {
	let parts = '';

	for (const [, value] of map) {
		parts += value + '\n';
	}

	return parts;
}

function $isObject(context: GeneratorContext, valuePath: string) {
	if (context.flags.plainObjectCheck === 'simple') {
		return `${valuePath} !== null && typeof ${valuePath} === 'object'`;
	}

	context.runtime.needIsPlainObject = true;

	return `isPlainObject(${valuePath})`;
}

function $hasOwn(context: GeneratorContext, valuePath: string, propName: string) {
	if (context.flags.hasOwnCheck === 'in') {
		return `'${propName}' in ${valuePath}`;
	}

	context.runtime.needHasOwn = true;

	return `hasOwn(${valuePath}, '${propName}')`;
}
