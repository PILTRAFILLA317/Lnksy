<script lang="ts">
	interface Props {
		config: Record<string, any>;
	}

	let { config }: Props = $props();

	const style = $derived(config?.style ?? "line");
	const height = $derived(config?.height ?? 1);
</script>

<div
	class="w-full px-4"
	style="margin-top: {8 + height * 4}px; margin-bottom: {4 + height * 4}px;"
>
	{#if style === "line"}
		<hr
			class="border-0"
			style="height: {height}px; background: currentColor; opacity: 0.12; border-radius: 1px;"
		/>
	{:else if style === "dots"}
		<div class="flex justify-center gap-1.5" style="opacity: 0.25;">
			{#each [0, 1, 2] as _}
				<div class="w-1 h-1 rounded-full bg-current"></div>
			{/each}
		</div>
	{:else}
		<!-- space: just the margins -->
	{/if}
</div>
