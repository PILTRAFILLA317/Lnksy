<script lang="ts">
	interface Props {
		config: Record<string, any>;
		title?: string | null;
	}

	let { config, title }: Props = $props();

	const embedUri = $derived(config?.embedUri ?? "");
	const compact = $derived(config?.compact === true);
	const embedType = $derived(config?.embedType ?? "track");

	/**
	 * Build a clean Spotify embed URL from any supported input:
	 *   - https://open.spotify.com/track/{id}
	 *   - https://open.spotify.com/intl-es/track/{id}   (locale prefix)
	 *   - https://open.spotify.com/track/{id}?si=xxx     (?si= share param)
	 *   - spotify:track:{id}                             (URI)
	 */
	const embedUrl = $derived.by(() => {
		if (!embedUri) return "";
		const raw = embedUri.trim();

		// spotify: URI → extract type/id directly
		const uriMatch = raw.match(/^spotify:(track|album|playlist|episode|show):([a-zA-Z0-9]+)/);
		if (uriMatch) {
			return `https://open.spotify.com/embed/${uriMatch[1]}/${uriMatch[2]}`;
		}

		// Full URL → extract the first occurrence of /{type}/{id}, ignoring
		// locale prefixes (/intl-xx/), query params (?si=...) and fragments.
		const urlMatch = raw.match(/(track|album|playlist|episode|show)\/([a-zA-Z0-9]+)/);
		if (urlMatch) {
			return `https://open.spotify.com/embed/${urlMatch[1]}/${urlMatch[2]}`;
		}

		return "";
	});

	const height = $derived(
		compact ? "80" : embedType === "track" ? "152" : "352",
	);
</script>

{#if embedUrl}
	<div class="w-full px-4 mt-3 mb-3">
		{#if title}
			<h2 class="mb-1.5 text-sm font-semibold opacity-70">{title}</h2>
		{/if}
		<iframe
			src={embedUrl}
			width="100%"
			{height}
			frameborder="0"
			allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
			loading="lazy"
			class="rounded-xl"
			style="border: 0;"
			title="Spotify embed"
		></iframe>
	</div>
{/if}
