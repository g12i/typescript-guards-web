import { isFlags } from '$lib/generator/context';
import type { Flags } from '$lib/generator/context';

export type GenerateRequest = {
	type: 'generate';
	id: string;
	input: string;
	flags: Flags;
};

export type GenerateResponse =
	| { id: string; ok: true; output: string }
	| {
			id?: string;
			ok: false;
			code: string;
			error: {
				message?: string;
				stack?: string;
			};
	  };

export function isGenerateRequest(value: unknown): value is GenerateRequest {
	return (
		value !== null &&
		typeof value === 'object' &&
		'type' in value &&
		value.type === 'generate' &&
		'id' in value &&
		typeof value.id === 'string' &&
		'input' in value &&
		typeof value.input === 'string' &&
		'flags' in value &&
		isFlags(value.flags)
	);
}

export function isGenerateResponse(value: unknown): value is GenerateResponse {
	return (
		(value !== null &&
			typeof value === 'object' &&
			'id' in value &&
			typeof value.id === 'string' &&
			'ok' in value &&
			value.ok === true &&
			'output' in value &&
			typeof value.output === 'string') ||
		(value !== null &&
			typeof value === 'object' &&
			('id' in value ? typeof value.id === 'string' : true) &&
			'ok' in value &&
			value.ok === false &&
			'code' in value &&
			typeof value.code === 'string' &&
			'error' in value &&
			value.error !== null &&
			typeof value.error === 'object' &&
			('message' in value.error ? typeof value.error.message === 'string' : true) &&
			('stack' in value.error ? typeof value.error.stack === 'string' : true))
	);
}
