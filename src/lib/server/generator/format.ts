import prettier from 'prettier';

export async function formatTypeScript(code: string): Promise<string> {
	const res = await prettier.format(code, {
		parser: 'typescript'
	});

	return res;
}
