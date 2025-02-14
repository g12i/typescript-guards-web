import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { generateTypeGuardForFile } from '$lib/server/generator/generator';
import ts from 'typescript';
import { formatTypeScript } from '$lib/server/generator/format';

async function attempt<T>(promise: Promise<T>): Promise<[Error, null] | [null, T]> {
	try {
		const res: T = await promise;

		return [null, res];
	} catch (error) {
		const wrapped = error instanceof Error ? error : new Error('Unknown error', { cause: error });

		return [wrapped, null];
	}
}

export const POST: RequestHandler = async ({ request }) => {
	const { input } = await request.json();

	const [sourceFileErr, sourceFile] = await attempt(
		Promise.resolve(ts.createSourceFile('input.ts', input, ts.ScriptTarget.Latest, true))
	);

	if (sourceFileErr) {
		return json({ ok: false, code: 'SOURCE_FILE_GEN_ERROR', error: sourceFileErr });
	}

	const [genError, generatedCode] = await attempt(generateTypeGuardForFile(sourceFile));

	if (genError) {
		return json({ ok: false, code: 'CODE_GENERATION_ERROR', error: genError });
	}

	const [formatError, formattedCode] = await attempt(formatTypeScript(generatedCode));

	if (formatError) {
		return json({ ok: false, code: 'CODE_FORMATTER_ERROR', error: formatError });
	}

	return json({ ok: true, output: formattedCode });
};
