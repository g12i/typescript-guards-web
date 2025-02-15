import ts from 'typescript';
import { generateTypeGuardForFile } from './generator/generator';
import { isGenerateRequest } from './worker-types';
import type { GenerateResponse } from './worker-types';
import { attempt } from './attempt';
import { formatTypeScript } from './generator/format';

self.onmessage = async (e: MessageEvent) => {
	const [parseError, payload] = await attempt(Promise.resolve(JSON.parse(e.data)));

	if (parseError) {
		return self.postMessage({
			ok: false,
			code: 'JSON_PARSE_ERROR',
			error: new Error('Could not parse JSON')
		} satisfies GenerateResponse);
	}

	if (!isGenerateRequest(payload)) {
		return self.postMessage({
			ok: false,
			code: 'INVALID_INPUT',
			error: new Error('Schema validation')
		} satisfies GenerateResponse);
	}

	const [sourceFileErr, sourceFile] = await attempt(
		Promise.resolve(ts.createSourceFile('input.ts', payload.input, ts.ScriptTarget.Latest, true))
	);

	if (sourceFileErr) {
		return self.postMessage({
			ok: false,
			code: 'SOURCE_FILE_GEN_ERROR',
			error: sourceFileErr
		} satisfies GenerateResponse);
	}

	const [genError, generatedCode] = await attempt(
		generateTypeGuardForFile(sourceFile, payload.flags)
	);

	if (genError) {
		return self.postMessage({
			ok: false,
			code: 'CODE_GENERATION_ERROR',
			error: genError
		} satisfies GenerateResponse);
	}

	const [formatError, formattedCode] = await attempt(formatTypeScript(generatedCode));

	if (formatError) {
		return self.postMessage({
			ok: false,
			code: 'CODE_FORMATTER_ERROR',
			error: formatError
		} satisfies GenerateResponse);
	}

	return self.postMessage({ ok: true, output: formattedCode } satisfies GenerateResponse);
};
