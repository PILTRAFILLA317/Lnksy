<script lang="ts">
	interface Props {
		config: Record<string, any>;
		textColor?: string;
		title?: string | null;
	}

	let { config, textColor = "inherit", title }: Props = $props();

	const content = $derived(config?.content ?? "");
	const align = $derived(config?.align ?? "center");
	const variant = $derived(config?.variant ?? "plain");
</script>

{#if content}
	<div class="w-full px-4 mt-3 mb-3">
		{#if title}
			<h2 class="mb-1.5 text-sm font-semibold opacity-70">{title}</h2>
		{/if}

		{#if variant === "callout"}
			<div
				class="rounded-xl px-4 py-3.5 border-l-4"
				style="
					background: color-mix(in srgb, {textColor} 8%, transparent);
					border-color: {textColor};
				"
			>
				<p
					class="text-sm leading-relaxed whitespace-pre-wrap font-medium"
					style="text-align: {align}; color: {textColor}; opacity: 0.9;"
				>
					{content}
				</p>
			</div>
		{:else if variant === "cta"}
			<div
				class="rounded-xl px-4 py-4 text-center"
				style="background: color-mix(in srgb, {textColor} 10%, transparent);"
			>
				<p
					class="text-base leading-snug whitespace-pre-wrap font-semibold"
					style="text-align: {align}; color: {textColor};"
				>
					{content}
				</p>
			</div>
		{:else}
			<p
				class="text-sm leading-relaxed whitespace-pre-wrap"
				style="text-align: {align}; color: {textColor}; opacity: 0.85;"
			>
				{content}
			</p>
		{/if}
	</div>
{/if}
