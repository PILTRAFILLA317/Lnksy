<script lang="ts">
	import type { ProfileComponentWithLinks, ThemeConfig } from "$lib/types.js";
	import MainLinksSection from "$lib/components/sections/MainLinksSection.svelte";

	interface Props {
		component: ProfileComponentWithLinks;
		themeConfig: ThemeConfig;
		isPro?: boolean;
	}

	let { component, themeConfig, isPro = false }: Props = $props();

	const layout = $derived(component.config?.layout ?? "LIST_ICON");
</script>

<div class="w-full px-2 mt-2 mb-2">
	{#if component.title}
		<h2 class="px-2 mb-1 text-sm font-semibold opacity-70">
			{component.title}
		</h2>
	{/if}
	<MainLinksSection links={component.links} {layout} {themeConfig} {isPro} />
</div>
