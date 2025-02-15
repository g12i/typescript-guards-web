import prettier from 'prettier';
import * as parserTypeScript from 'prettier/parser-typescript';
import * as prettierPluginEstree from 'prettier/plugins/estree';

export async function formatTypeScript(code: string): Promise<string> {
	const res = await prettier.format(code, {
		parser: 'typescript',
		plugins: [parserTypeScript, prettierPluginEstree as prettier.Plugin]
	});

	return res;
}
