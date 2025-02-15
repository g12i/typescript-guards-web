import { formatTypeScript } from '$lib/server/generator/format';
import { generateTypeGuardForFile } from '$lib/server/generator/generator';
import { json } from '@sveltejs/kit';
import ts from 'typescript';
import type { RequestHandler } from './$types';
import { isGenerateRequest, type GenerateResponse } from './types';
import { attempt } from '$lib/attempt';

export const POST: RequestHandler = async ({ request }) => {
	const payload = await request.json();

	if (!isGenerateRequest(payload)) {
		return json({
			ok: false,
			code: 'INVALID_INPUT',
			error: new Error('Schema validation')
		} satisfies GenerateResponse);
	}

	const [sourceFileErr, sourceFile] = await attempt(
		Promise.resolve(ts.createSourceFile('input.ts', payload.input, ts.ScriptTarget.Latest, true))
	);

	if (sourceFileErr) {
		return json({
			ok: false,
			code: 'SOURCE_FILE_GEN_ERROR',
			error: sourceFileErr
		} satisfies GenerateResponse);
	}

	const [genError, generatedCode] = await attempt(
		generateTypeGuardForFile(sourceFile, payload.flags)
	);

	if (genError) {
		return json({
			ok: false,
			code: 'CODE_GENERATION_ERROR',
			error: genError
		} satisfies GenerateResponse);
	}

	const [formatError, formattedCode] = await attempt(formatTypeScript(generatedCode));

	if (formatError) {
		return json({
			ok: false,
			code: 'CODE_FORMATTER_ERROR',
			error: formatError
		} satisfies GenerateResponse);
	}

	return json({ ok: true, output: formattedCode } satisfies GenerateResponse);
};
