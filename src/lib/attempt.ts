export async function attempt<T>(promise: Promise<T>): Promise<[Error, null] | [null, T]> {
	try {
		const res: T = await promise;

		return [null, res];
	} catch (error) {
		const wrapped = error instanceof Error ? error : new Error('Unknown error', { cause: error });

		return [wrapped, null];
	}
}
