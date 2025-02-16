<script lang="ts">
	import Editor from '$lib/components/editor.svelte';
	import * as Resizable from '$lib/components/ui/resizable/index.js';

	import type { Flags } from '$lib/generator/context';
	import { onMount } from 'svelte';
	import { isGenerateResponse } from '$lib/worker-types';
	import type { GenerateRequest } from '$lib/worker-types';
	import { isFlags } from '$lib/generator/context';
	import { storage } from '$lib/storage';
	import Menu from '$lib/components/menu.svelte';
	let worker: Worker | undefined = $state();
	let latestRequestId: string | undefined = $state();

	let debounceTimeout: ReturnType<typeof setTimeout> | undefined;
	let input = $state('');
	let debouncedInput = $state('');

	let updateInput = (nextInput: string) => {
		input = nextInput;

		storage.setItem('generator:input', input);

		clearTimeout(debounceTimeout);

		debounceTimeout = setTimeout(() => {
			debouncedInput = nextInput;
		}, 300);
	};

	let flags: Flags = $state({ plainObjectCheck: 'simple' });

	$effect(() => {
		storage.setItem('generator:flags', flags);
	});

	let output = $state('');

	onMount(async () => {
		storage.ifPresent<string>('generator:input', (val) => {
			input = val;
			debouncedInput = val;
		});

		storage.ifPresent('generator:flags', (val) => {
			if (isFlags(val)) {
				flags = val;
			}
		});

		const GeneratorWorker = (await import('$lib/worker?worker')).default;

		worker = new GeneratorWorker();

		worker.addEventListener('message', (res) => {
			if (!isGenerateResponse(res.data)) {
				// TODO error handling
				return;
			}

			if (!res.data.ok) {
				output = res.data.error.message + '\n' + res.data.error.stack;
			} else if (res.data.id === latestRequestId) {
				output = res.data.output;
			}
		});
	});

	$effect(() => {
		const requestId = crypto.randomUUID();
		latestRequestId = requestId;

		worker?.postMessage(
			JSON.stringify({
				type: 'generate',
				id: requestId,
				input: debouncedInput,
				flags
			} satisfies GenerateRequest)
		);
	});
</script>

<div class="h-dvh w-dvw">
	<div class="flex h-full flex-col">
		<Menu bind:flags />
		<div class="flex h-full w-full flex-1 flex-col md:flex-row">
			<Resizable.PaneGroup direction="horizontal">
				<Resizable.Pane>
					<Editor
						initialValue={input}
						onDidChangeContent={updateInput}
						minimap={{ enabled: false }}
						automaticLayout
						contextmenu={false}
					/>
				</Resizable.Pane>
				<Resizable.Handle />
				<Resizable.Pane>
					<Editor
						value={output}
						minimap={{ enabled: false }}
						theme="vs-dark"
						readOnly
						automaticLayout
						contextmenu={false}
					/>
				</Resizable.Pane>
			</Resizable.PaneGroup>
		</div>
	</div>
</div>
