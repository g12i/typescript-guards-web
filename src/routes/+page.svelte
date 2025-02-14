<script lang="ts">
	import Editor from '$lib/components/editor.svelte';
	import * as Select from '$lib/components/ui/select';
	import { onMount } from 'svelte';

	type ApiResponse = { ok: true; output: string } | { ok: false; code: string; error: any };

	function isApiResponse(value: unknown): value is ApiResponse {
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
				true)
		);
	}

	let input = $state('');
	let debouncedInput = $state(input);
	let timer: ReturnType<typeof setTimeout> | undefined;

	let output = $state('');

	const onDidChangeContent = (next: string) => {
		input = next;
	};

	onMount(() => {
		const cached = localStorage.getItem(`generator:input`);

		if (cached) {
			input = cached;
		}
	});

	$effect(() => {
		const currentInput = input;

		localStorage.setItem(`generator:input`, currentInput);

		clearTimeout(timer);

		timer = setTimeout(() => {
			debouncedInput = currentInput;
		}, 300);
	});

	let ctrl = new AbortController();

	$effect(() => {
		if (!debouncedInput.length) {
			return;
		}

		ctrl.abort();

		ctrl = new AbortController();

		console.log('fetch', debouncedInput);
		fetch('/api/generate', {
			method: 'POST',
			body: JSON.stringify({ input: debouncedInput }),
			headers: { 'content-type': 'application/json' },
			signal: ctrl.signal
		})
			.then((res) => {
				if (!res.ok) {
					throw new Error(`HTTP Error ${res.status}`);
				}
				return res.json();
			})
			.then((resBody) => {
				if (!isApiResponse(resBody)) {
					throw new Error('Unknown response');
				}

				if (resBody.ok) {
					output = resBody.output;
				}
			})
			.catch((err) => {
				console.error(err);
				if (err.name === 'AbortError') {
					return;
				}
			});
	});
</script>

<div class="h-dvh w-dvw">
	<div class="flex h-full flex-col px-8 py-4">
		<div>
			<Select.Root type="single">
				<Select.Trigger class="w-[180px]">Yo</Select.Trigger>
				<Select.Content>
					<Select.Item value="light">Light</Select.Item>
					<Select.Item value="dark">Dark</Select.Item>
					<Select.Item value="system">System</Select.Item>
				</Select.Content>
			</Select.Root>
		</div>
		<div class="flex h-full w-full flex-1 flex-col md:flex-row">
			<div
				class="flex h-1/2 flex-col border-b border-zinc-300 p-4 md:h-auto md:w-1/2 md:border-r md:border-b-0"
			>
				<Editor initialValue={input} {onDidChangeContent} minimap={{ enabled: false }} />
			</div>
			<div class="h-1/2 md:h-auto md:w-1/2">
				<Editor value={output} minimap={{ enabled: false }} theme="vs-dark" readOnly />
			</div>
		</div>
	</div>
</div>
