<script lang="ts">
  import type { HeaderMode, HeroPosition } from '$lib/types.js';

  interface Props {
    headerMode: HeaderMode;
    avatarUrl: string | null;
    heroUrl: string | null;
    heroPosition: HeroPosition;
    displayTitle: string;
    bgColor: string;
  }

  let {
    headerMode,
    avatarUrl,
    heroUrl,
    heroPosition,
    displayTitle,
    bgColor,
  }: Props = $props();

  const initial = $derived(displayTitle?.[0]?.toUpperCase() ?? '?');
</script>

{#if headerMode === 'HERO' || headerMode === 'AVATAR_HERO'}
  <!-- Hero image -->
  <div class="relative w-full" style="min-height: clamp(180px, 35vh, 320px)">
    {#if heroUrl}
      <img
        src={heroUrl}
        alt="Header"
        loading="eager"
        class="absolute inset-0 w-full h-full object-cover"
        style="object-position: {heroPosition};"
      />
    {:else}
      <div class="absolute inset-0 bg-white/5"></div>
    {/if}
    <!-- Fade overlay -->
    <div
      class="absolute inset-x-0 bottom-0 h-1/2"
      style="background: linear-gradient(to bottom, transparent, {bgColor});"
    ></div>
  </div>
{/if}

<!-- Avatar -->
{#if headerMode === 'AVATAR' || headerMode === 'AVATAR_HERO'}
  <div
    class="flex justify-center
      {headerMode === 'AVATAR_HERO' ? '-mt-12 relative z-10' : 'pt-4 pb-4'}"
  >
    {#if avatarUrl}
      <img
        src={avatarUrl}
        alt={displayTitle}
        class="w-24 h-24 rounded-full object-cover ring-4
          ring-white/20 shadow-lg"
      />
    {:else}
      <div
        class="w-24 h-24 rounded-full flex items-center justify-center
          text-3xl font-bold ring-4 ring-white/20 shadow-lg"
        style="background: rgba(255,255,255,0.15)"
      >
        {initial}
      </div>
    {/if}
  </div>
{/if}
