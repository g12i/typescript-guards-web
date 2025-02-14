<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import type * as Monaco from 'monaco-editor/esm/vs/editor/editor.api';

	type Props = {
		initialValue: string;
		value?: string;
		onDidChangeContent?: (next: string) => void;
	} & Monaco.editor.IStandaloneEditorConstructionOptions;

	let { initialValue, value = $bindable(), onDidChangeContent, ...rest }: Props = $props();

	let editor: Monaco.editor.IStandaloneCodeEditor | undefined = $state();
	let monaco: typeof Monaco | undefined = $state();
	let editorContainer: HTMLElement;

	$effect(() => {
		const currentValue = value;
		console.log({
			currentValue,
			monaco,
			editor
		});
		if (currentValue && monaco && editor) {
			const model = monaco.editor.createModel(currentValue, 'typescript');
			editor.setModel(model);
		}
	});

	onMount(async () => {
		monaco = (await import('./monaco')).default;

		editor = monaco.editor.create(editorContainer, rest);
		const model = monaco.editor.createModel(initialValue, 'typescript');

		if (onDidChangeContent) {
			model.onDidChangeContent(() => {
				if (editor) {
					onDidChangeContent(editor.getValue());
				}
			});
		}

		editor.setModel(model);
	});

	onDestroy(() => {
		monaco?.editor.getModels().forEach((model) => model.dispose());
		editor?.dispose();
	});
</script>

<div class="h-full w-full" bind:this={editorContainer}></div>
