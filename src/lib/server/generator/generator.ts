import ts from 'typescript';
import type { Context } from './context';
import { generateExtras } from './extras';

export async function generateTypeGuardForFile(sourceFile: ts.SourceFile): Promise<string> {
	const declarations: (ts.TypeAliasDeclaration | ts.InterfaceDeclaration)[] = [];

	const visit = (node: ts.Node) => {
		if (ts.isTypeAliasDeclaration(node) || ts.isInterfaceDeclaration(node)) {
			declarations.push(node);
		}
		ts.forEachChild(node, visit);
	};

	ts.forEachChild(sourceFile, visit);

	const context: Context = {
		currentValuePath: 'value',
		flags: {
			plainObjectCheck: 'simple'
		},
		hooks: {
			afterCode: '',
			beforeCode: ''
		}
	};

	const code = declarations.map((d) => generateTypeGuardForDeclaration(d, context)).join('\n\n');

	generateExtras(context);

	return context.hooks.beforeCode + code + context.hooks.afterCode;
}

function generateTypeGuardForDeclaration(
	decl: ts.TypeAliasDeclaration | ts.InterfaceDeclaration,
	context: Context
) {
	const typeName = decl.name.text;
	const functionName = `is${typeName}`;
	const type = ts.isTypeAliasDeclaration(decl) ? decl.type : decl;

	const checks = generateNodeChecks(type, context);

	return `
export function ${functionName}(value: unknown): value is ${typeName} {
  return ${checks};
}`;
}

function generateNodeChecks(node: ts.Node, context: Context): string {
	if (ts.isUnionTypeNode(node)) {
		const unionChecks = node.types.map((type) => generateNodeChecks(type, context));

		return unionChecks.join(' || ');
	}

	if (ts.isIntersectionTypeNode(node)) {
		const intersectionChecks = node.types.map((type) => generateNodeChecks(type, context));

		return intersectionChecks.join(' && ');
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

	if (ts.isTypeReferenceNode(node)) {
		return generateReferenceChecks(node, context);
	}

	const valuePath = context.currentValuePath;

	if (node.kind === ts.SyntaxKind.StringKeyword) {
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
	context: Context
) {
	const valuePath = context.currentValuePath;

	const members = ts.isTypeLiteralNode(node) ? node.members : node.members;

	const memberChecks = members.map((member) => {
		if (!ts.isPropertySignature(member)) {
			return '';
		}

		const propType = member.type;

		if (!propType) {
			return '';
		}

		const propName = member.name.getText();

		const newContext = {
			...context,
			currentValuePath: `${context.currentValuePath}.${propName}`
		};

		const propertyChecks = generateNodeChecks(propType, newContext);

		// Handle optional properties
		const isOptional = member.questionToken !== undefined;

		return isOptional
			? `&& ('${propName}' in ${valuePath} ? (${propertyChecks}) : true)`
			: `&& ('${propName}' in ${valuePath} && (${propertyChecks}))`;
	});

	context.flags.needIsPlainObject = true;

	return `(${generateIsPlainObjectCheck(context, valuePath)} ${memberChecks.join('')})`;
}

function generateReferenceChecks(node: ts.TypeReferenceNode, context: Context) {
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

	if (typeName === 'Array') {
		if (!node.typeArguments || node.typeArguments.length !== 1) {
			return 'true /* Invalid Array<> */';
		}

		const elementType = node.typeArguments[0];

		return generateArrayChecks({ elementType }, context);
	}

	return `is${typeName}(${valuePath})`;
}

function generateLiteralCheck(node: ts.LiteralTypeNode, context: Context) {
	const literal = node.literal.getText();

	return `${context.currentValuePath} === ${literal}`;
}

function generateArrayChecks(node: Pick<ts.ArrayTypeNode, 'elementType'>, context: Context) {
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

function generateTupleCheck(node: ts.TupleTypeNode, context: Context): string {
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

function generateRecordChecks(node: ts.TypeReferenceNode, context: Context): string {
	const valuePath = context.currentValuePath;

	if (node.typeArguments && node.typeArguments.length === 2) {
		const [keyType, valueType] = node.typeArguments;

		const keyTypeString = keyType.kind === ts.SyntaxKind.StringKeyword ? 'string' : 'number';

		const valueContext: Context = {
			...context,
			currentValuePath: 'value'
		};

		const valueChecks = generateNodeChecks(valueType, valueContext);

		context.flags.needIsPlainObject = true;

		return `(
      ${generateIsPlainObjectCheck(context, valuePath)} &&
      Object.entries(${valuePath}).every(([key, value]) =>
        typeof key === "${keyTypeString}" && (${valueChecks})
      )
    )`;
	}

	return 'false';
}

function generateMapChecks(node: ts.TypeReferenceNode, context: Context): string {
	const valuePath = context.currentValuePath;

	if (node.typeArguments && node.typeArguments.length === 2) {
		const [keyType, valueType] = node.typeArguments;

		const keyContext: Context = {
			...context,
			currentValuePath: 'key'
		};

		const valueContext: Context = {
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

function generateSetChecks(node: ts.TypeReferenceNode, context: Context): string {
	const valuePath = context.currentValuePath;

	if (node.typeArguments && node.typeArguments.length === 1) {
		const [valueType] = node.typeArguments;

		const valueContext: Context = {
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

function generateIsPlainObjectCheck(context: Context, valuePath: string) {
	if (context.flags.plainObjectCheck === 'simple') {
		return `${valuePath} !== null && typeof ${valuePath} === 'object'`;
	}

	return `isPlainObject(${valuePath})`;
}
