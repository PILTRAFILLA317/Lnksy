<script lang="ts">
	interface Props {
		config: Record<string, any>;
		title?: string | null;
	}

	let { config, title }: Props = $props();

	const url = $derived(config?.url ?? "");
	const platform = $derived(config?.platform ?? "twitch");
	const label = $derived(config?.label ?? "Watch Live");

	const PLATFORM_COLORS: Record<string, string> = {
		twitch: "#9146FF",
		kick: "#53FC18",
		other: "#6366F1",
	};

	const PLATFORM_TEXT: Record<string, string> = {
		twitch: "#ffffff",
		kick: "#000000",
		other: "#ffffff",
	};

	const bgColor = $derived(
		PLATFORM_COLORS[platform] ?? PLATFORM_COLORS.other,
	);
	const textColor = $derived(
		PLATFORM_TEXT[platform] ?? PLATFORM_TEXT.other,
	);
</script>

{#if url}
	<div class="w-full px-4 mt-3 mb-3">
		{#if title}
			<h2 class="mb-2 text-sm font-semibold opacity-70">{title}</h2>
		{/if}
		<a
			href={url}
			target="_blank"
			rel="noopener noreferrer"
			class="flex items-center gap-3 w-full px-5 py-4 rounded-xl
				transition-all duration-150 hover:opacity-90 active:scale-[0.98]
				shadow-md"
			style="background-color: {bgColor}; color: {textColor};"
		>
			<!-- Platform icon -->
			{#if platform === "twitch"}
				<svg
					class="w-5 h-5 shrink-0"
					viewBox="0 0 24 24"
					fill="currentColor"
					aria-hidden="true"
				>
					<path
						d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z"
					/>
				</svg>
			{:else if platform === "kick"}
				<svg
					class="w-5 h-5 shrink-0"
					viewBox="0 0 400 400"
					fill="currentColor"
					aria-hidden="true"
				>
					<path
						d="M0 0v400h400V0H0zm320 280H240l-80-80v80H80V120h80v80l80-80h80L320 200z"
					/>
				</svg>
			{:else}
				<!-- Generic broadcast icon -->
				<svg
					class="w-5 h-5 shrink-0"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					aria-hidden="true"
				>
					<circle cx="12" cy="12" r="2" />
					<path
						stroke-linecap="round"
						d="M4.93 4.93a10 10 0 0114.14 0M7.76 7.76a6 6 0 018.49 0M10.6 10.6a2 2 0 012.83 0"
					/>
				</svg>
			{/if}

			<span class="font-semibold flex-1 text-sm">{label}</span>

			<!-- Live badge -->
			<span
				class="flex items-center gap-1 text-[11px] font-bold
					px-2.5 py-1 rounded-full shrink-0"
				style="background: rgba(0,0,0,0.2);"
			>
				<span
					class="w-1.5 h-1.5 rounded-full bg-current animate-pulse"
				></span>
				LIVE
			</span>
		</a>
	</div>
{/if}
