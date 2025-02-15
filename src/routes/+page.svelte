<script lang="ts">
	import Editor from '$lib/components/editor.svelte';
	import * as Resizable from '$lib/components/ui/resizable/index.js';
	import * as Menubar from '$lib/components/ui/menubar/index.js';
	import type { Flags } from '$lib/generator-context';
	import { onMount } from 'svelte';
	import { isGenerateResponse } from './api/generate/types';
	import type { GenerateRequest } from './api/generate/types';
	import { isFlags } from '$lib/generator-context';

	let debouncedInput = $state('');
	let timer: ReturnType<typeof setTimeout> | undefined;

	let input = $state('');
	let updateInput = (nextInput: string) => {
		input = nextInput;

		clearTimeout(timer);

		timer = setTimeout(() => {
			debouncedInput = nextInput;
		}, 300);

		localStorage.setItem('generator:input', nextInput);
	};

	let flags: Flags = $state({ plainObjectCheck: 'simple' });
	let updateFlags =
		<TKey extends keyof Flags>(prop: TKey) =>
		(next: Flags[TKey]) => {
			flags[prop] = next;

			localStorage.setItem('generator:flags', JSON.stringify(flags));
		};

	let output = $state('');

	onMount(() => {
		try {
			const cachedFlags = localStorage.getItem(`generator:flags`);

			const parsed = cachedFlags ? JSON.parse(cachedFlags) : undefined;

			if (isFlags(parsed)) {
				flags = parsed;
			}
		} catch {
			// do nothnig
		}

		const cachedInput = localStorage.getItem(`generator:input`);

		if (cachedInput) {
			input = cachedInput;
			debouncedInput = cachedInput;
		}
	});

	let ctrl = new AbortController();

	$effect(() => {
		if (!debouncedInput.length) {
			return;
		}

		ctrl.abort();

		ctrl = new AbortController();

		fetch('/api/generate', {
			method: 'POST',
			body: JSON.stringify({ input: debouncedInput, flags } satisfies GenerateRequest),
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
				if (!isGenerateResponse(resBody)) {
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
			<Menubar.Root>
				<Menubar.Menu>
					<Menubar.Trigger>Options</Menubar.Trigger>
					<Menubar.Content>
						<Menubar.Sub>
							<Menubar.SubTrigger>Plain object generation</Menubar.SubTrigger>
							<Menubar.SubContent>
								<Menubar.RadioGroup
									value={flags.plainObjectCheck}
									onValueChange={updateFlags('plainObjectCheck')}
								>
									<Menubar.RadioItem value="simple">Simple check</Menubar.RadioItem>
									<Menubar.RadioItem value="insert">Inline check</Menubar.RadioItem>
									<Menubar.RadioItem value="es-toolkit">
										Import from <code>es-toolkit</code>
									</Menubar.RadioItem>
									<Menubar.RadioItem value="lodash">
										Import from <code>lodash</code>
									</Menubar.RadioItem>
								</Menubar.RadioGroup>
							</Menubar.SubContent>
						</Menubar.Sub>
					</Menubar.Content>
				</Menubar.Menu>
			</Menubar.Root>
		</div>
		<div class="flex h-full w-full flex-1 flex-col md:flex-row">
			<Resizable.PaneGroup direction="horizontal">
				<Resizable.Pane>
					<Editor
						initialValue={input}
						onDidChangeContent={updateInput}
						minimap={{ enabled: false }}
					/>
				</Resizable.Pane>
				<Resizable.Handle />
				<Resizable.Pane>
					<Editor value={output} minimap={{ enabled: false }} theme="vs-dark" readOnly />
				</Resizable.Pane>
			</Resizable.PaneGroup>
		</div>
	</div>
</div>
