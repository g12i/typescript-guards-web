import { isFlags } from '$lib/generator/context';
import type { Flags } from '$lib/generator/context';

export type GenerateRequest = {
	input: string;
	flags: Flags;
};

export function isGenerateRequest(value: unknown): value is GenerateRequest {
	return (
		value !== null &&
		typeof value === 'object' &&
		'input' in value &&
		typeof value.input === 'string' &&
		'flags' in value &&
		isFlags(value.flags)
	);
}

export type GenerateResponse =
	| { ok: true; output: string }
	| { ok: false; code: string; error: { message: string } };

export function isGenerateResponse(value: unknown): value is GenerateResponse {
	return (
		(value !== null &&
			typeof value === 'object' &&
			'ok' in value &&
			value.ok === true &&
			'output' in value &&
			typeof value.output === 'string') ||
		(value !== null &&
			typeof value === 'object' &&
			'ok' in value &&
			value.ok === false &&
			'code' in value &&
			typeof value.code === 'string' &&
			'error' in value &&
			value.error !== null &&
			typeof value.error === 'object' &&
			'message' in value.error &&
			typeof value.error.message === 'string')
	);
}
