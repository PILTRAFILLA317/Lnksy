<script lang="ts">
	interface Props {
		config: Record<string, any>;
		textColor?: string;
		title?: string | null;
	}

	let { config, textColor = "inherit", title }: Props = $props();

	const content = $derived(config?.content ?? "");
	const align = $derived(config?.align ?? "center");
</script>

{#if content}
	<div class="w-full px-4 mt-3 mb-3">
		{#if title}
			<h2 class="mb-1.5 text-sm font-semibold opacity-70">{title}</h2>
		{/if}
		<p
			class="text-sm leading-relaxed whitespace-pre-wrap"
			style="text-align: {align}; color: {textColor}; opacity: 0.85;"
		>
			{content}
		</p>
	</div>
{/if}
