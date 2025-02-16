import ts from 'typescript';
import type { GeneratorContext, Flags } from '$lib/generator/context';
import { generateExtras } from './extras';
import { formatTypeScript } from './format';

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
			plainObjectCheck: 'simple',
			hasOwnCheck: 'hasOwn',
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

	const checks = generateNodeChecks(type, context);

	return `
export function ${functionName}(value: unknown): value is ${typeName} {
  return ${checks};
}`;
}

function generateNodeChecks(node: ts.Node, context: GeneratorContext): string {
	if (ts.isUnionTypeNode(node)) {
		return generateUnionChecks(node, context);
	}

	if (ts.isIntersectionTypeNode(node)) {
		return generateIntersectionChecks(node, context);
	}

	if (ts.isArrayTypeNode(node)) {
		return generateArrayChecks(node, context);
	}

	if (ts.isParenthesizedTypeNode(node)) {
		return generateNodeChecks(node.type, context);
	}

	if (ts.isTypeLiteralNode(node) || ts.isInterfaceDeclaration(node)) {
		return generateDeclarationsChecks(node, context);
	}

	if (ts.isTupleTypeNode(node)) {
		return generateTupleCheck(node, context);
	}

	if (ts.isLiteralTypeNode(node)) {
		return generateLiteralCheck(node, context);
	}

	if (ts.isTypeQueryNode(node)) {
		return generateTypeQueryCheck(node, context);
	}

	if (ts.isTypeReferenceNode(node)) {
		return generateReferenceChecks(node, context);
	}

	if (ts.isTypeOperatorNode(node) && node.operator === ts.SyntaxKind.ReadonlyKeyword) {
		return generateNodeChecks(node.type, context);
	}

	if (ts.isFunctionTypeNode(node) || ts.isMethodSignature(node) || ts.isMethodDeclaration(node)) {
		return `typeof ${context.currentValuePath} === 'function'`;
	}

	const valuePath = context.currentValuePath;

	if (node.kind === ts.SyntaxKind.NeverKeyword) {
		return 'false /* never type cannot have values */';
	}

	if (node.kind === ts.SyntaxKind.BigIntKeyword) {
		return `typeof ${valuePath} === "bigint"`;
	}

	if (node.kind === ts.SyntaxKind.StringKeyword || ts.isTemplateLiteralTypeNode(node)) {
		return `typeof ${valuePath} === "string"`;
	}

	if (node.kind === ts.SyntaxKind.NumberKeyword) {
		return `typeof ${valuePath} === "number"`;
	}

	if (node.kind === ts.SyntaxKind.BooleanKeyword) {
		return `typeof ${valuePath} === "boolean"`;
	}

	if (node.kind === ts.SyntaxKind.UndefinedKeyword) {
		return `typeof ${valuePath} === "undefined"`;
	}

	if (node.kind === ts.SyntaxKind.NullKeyword) {
		return `${valuePath} === null`;
	}

	if (node.kind === ts.SyntaxKind.AnyKeyword || node.kind === ts.SyntaxKind.UnknownKeyword) {
		return 'true';
	}

	console.log(node.kind);

	return 'true';
}

function generateDeclarationsChecks(
	node: ts.TypeLiteralNode | ts.InterfaceDeclaration,
	context: GeneratorContext
) {
	const valuePath = context.currentValuePath;

	const members = ts.isTypeLiteralNode(node) ? node.members : node.members;

	const memberChecks = members.map((member) => generateMemberChecks(member, context));

	context.runtime.needIsPlainObject = true;

	return `(${$isObject(context, valuePath)} ${memberChecks.join('')})`;
}

function generateMemberChecks(member: ts.TypeElement, context: GeneratorContext) {
	const valuePath = context.currentValuePath;

	if (ts.isIndexSignatureDeclaration(member)) {
		return `&& true /* Index signatures ([key: string]: T, [key: number]: T, [key: symbol]: T) are not supported */`;
	}

	const propName = member.name?.getText();

	if (!propName) {
		return `&& true /* Unknown member type: ${ts.SyntaxKind[member.kind]} */`;
	}

	// Handle computed properties (like Symbol.iterator)
	if (ts.isPropertySignature(member) && ts.isComputedPropertyName(member.name)) {
		const symbolName = member.name.expression.getText();
		const newContext = {
			...context,
			currentValuePath: `${context.currentValuePath}[${symbolName}]`
		};

		const propertyChecks = generateNodeChecks(member.type!, newContext);

		return `&& (${propertyChecks})`;
	}

	if (ts.isMethodSignature(member)) {
		return `&& (${$hasOwn(context, valuePath, propName)} && typeof ${valuePath}.${propName} === 'function')`;
	}

	if (ts.isPropertySignature(member)) {
		const propType = member.type;

		if (!propType) {
			return `&& true /* Property signature without type */`;
		}

		const newContext = {
			...context,
			currentValuePath: `${context.currentValuePath}.${propName}`
		};

		const propertyChecks = generateNodeChecks(propType, newContext);

		// Handle optional properties
		const isOptional = member.questionToken !== undefined;

		return isOptional
			? `&& (${$hasOwn(context, valuePath, propName)} ? (${propertyChecks}) : true)`
			: `&& (${$hasOwn(context, valuePath, propName)} && (${propertyChecks}))`;
	}

	return `&& true /* Unsupported member type: ${ts.SyntaxKind[member.kind]} */`;
}

function generateReferenceChecks(node: ts.TypeReferenceNode, context: GeneratorContext) {
	const valuePath = context.currentValuePath;
	const typeName = node.typeName.getText();

	if (typeName === 'Record') {
		return generateRecordChecks(node, context);
	}

	if (typeName === 'Map') {
		return generateMapChecks(node, context);
	}

	if (typeName === 'Set') {
		return generateSetChecks(node, context);
	}

	if (typeName === 'Error') {
		return `${valuePath} instanceof Error`;
	}

	if (typeName === 'Array') {
		if (!node.typeArguments || node.typeArguments.length !== 1) {
			return 'true /* Invalid Array<> */';
		}

		const elementType = node.typeArguments[0];

		return generateArrayChecks({ elementType }, context);
	}

	// Add this class handling:
	if (typeName.startsWith('typeof ')) {
		const className = typeName.replace('typeof ', '');
		if (context.runtime.classes.has(className)) {
			return `(typeof ${valuePath} === 'function' && ${valuePath}.name === '${className}')`;
		}
	}

	if (context.runtime.classes.has(typeName)) {
		return `(${valuePath} instanceof ${typeName})`;
	}

	if (context.runtime.generatedTypeGuards.has(typeName)) {
		return `is${typeName}(${valuePath})`;
	}

	if (context.runtime.imports.has(`is${typeName}`)) {
		return `is${typeName}(${valuePath})`;
	}

	return `(${$isObject(context, valuePath)})`;
}

function generateLiteralCheck(node: ts.LiteralTypeNode, context: GeneratorContext) {
	const literal = node.literal.getText();

	return `${context.currentValuePath} === ${literal}`;
}

function generateArrayChecks(
	node: Pick<ts.ArrayTypeNode, 'elementType'>,
	context: GeneratorContext
) {
	const valuePath = context.currentValuePath;
	const elementType = node.elementType;
	const elementContext = {
		...context,
		currentValuePath: 'el'
	};

	const elementChecks = generateNodeChecks(elementType, elementContext);

	return [
		`(`,
		`Array.isArray(${valuePath})`,
		`&& ${valuePath}.every(el => ${elementChecks})`,
		`)`
	].join('\n');
}

function generateTupleCheck(node: ts.TupleTypeNode, context: GeneratorContext): string {
	const valuePath = context.currentValuePath;

	const elementTypes = node.elements;

	const tupleChecks = elementTypes.map((type, index) => {
		const elementContext = {
			...context,
			currentValuePath: `${context.currentValuePath}[${index}]`
		};

		return generateNodeChecks(type, elementContext);
	});

	return `Array.isArray(${valuePath}) && ${valuePath}.length === ${elementTypes.length} && ${tupleChecks.map((check) => `(${check})`).join(`&&`)}`;
}

function generateUnionChecks(node: ts.UnionTypeNode, context: GeneratorContext) {
	const unionChecks = node.types.map((type) => generateNodeChecks(type, context));

	return unionChecks.join(' || ');
}

function generateIntersectionChecks(node: ts.IntersectionTypeNode, context: GeneratorContext) {
	
	const intersectionChecks = node.types.map((type) => generateNodeChecks(type, context));

	return intersectionChecks.join(' && ');
}

function generateRecordChecks(node: ts.TypeReferenceNode, context: GeneratorContext): string {
	const valuePath = context.currentValuePath;

	if (node.typeArguments && node.typeArguments.length === 2) {
		const [keyType, valueType] = node.typeArguments;

		const keyTypeString = keyType.kind === ts.SyntaxKind.StringKeyword ? 'string' : 'number';

		const valueContext: GeneratorContext = {
			...context,
			currentValuePath: 'value'
		};

		const valueChecks = generateNodeChecks(valueType, valueContext);

		context.runtime.needIsPlainObject = true;

		return `(
      ${$isObject(context, valuePath)} &&
      Object.entries(${valuePath}).every(([key, value]) =>
        typeof key === "${keyTypeString}" && (${valueChecks})
      )
    )`;
	}

	return 'false';
}

function generateMapChecks(node: ts.TypeReferenceNode, context: GeneratorContext): string {
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

		const keyChecks = generateNodeChecks(keyType, keyContext);
		const valueChecks = generateNodeChecks(valueType, valueContext);

		return `(
      ${valuePath} instanceof Map &&
      Array.from(${valuePath}.entries()).every(([key, value]) =>
        (${keyChecks}) && (${valueChecks})
      )
    )`;
	}

	return 'false';
}

function generateSetChecks(node: ts.TypeReferenceNode, context: GeneratorContext): string {
	const valuePath = context.currentValuePath;

	if (node.typeArguments && node.typeArguments.length === 1) {
		const [valueType] = node.typeArguments;

		const valueContext: GeneratorContext = {
			...context,
			currentValuePath: 'value'
		};

		const valueChecks = generateNodeChecks(valueType, valueContext);

		return `(
      ${valuePath} instanceof Set &&
      Array.from(${valuePath}.values()).every(value => ${valueChecks})
    )`;
	}

	return 'false';
}

function generateTypeQueryCheck(node: ts.TypeQueryNode, context: GeneratorContext) {
	const typeName = node.exprName.getText();

	return `(typeof ${context.currentValuePath} === 'function' && ${context.currentValuePath}.name === '${typeName}')`;
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

	return `isPlainObject(${valuePath})`;
}

function $hasOwn(context: GeneratorContext, valuePath: string, propName: string) {
	if (context.flags.hasOwnCheck === 'in') {
		return `'${propName}' in ${valuePath}`;
	}

	context.runtime.needHasOwn = true;

	return `hasOwn(${valuePath}, '${propName}')`;
}
