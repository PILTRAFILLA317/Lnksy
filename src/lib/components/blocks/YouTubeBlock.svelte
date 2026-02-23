<script lang="ts">
	interface Props {
		config: Record<string, any>;
		title?: string | null;
	}

	let { config, title }: Props = $props();

	const videoId = $derived(config?.videoId ?? "");
	const aspectRatio = $derived(config?.aspectRatio ?? "16:9");

	const paddingBottom = $derived(
		aspectRatio === "4:3"
			? "75%"
			: aspectRatio === "1:1"
				? "100%"
				: "56.25%",
	);
</script>

{#if videoId}
	<div class="w-full px-4 mt-3 mb-3">
		{#if title}
			<h2 class="mb-1.5 text-sm font-semibold opacity-70">{title}</h2>
		{/if}
		<div
			class="relative w-full overflow-hidden rounded-xl"
			style="padding-bottom: {paddingBottom};"
		>
			<iframe
				src="https://www.youtube.com/embed/{videoId}"
				title="YouTube video"
				frameborder="0"
				allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
				allowfullscreen
				class="absolute inset-0 w-full h-full"
				loading="lazy"
			></iframe>
		</div>
	</div>
{/if}
