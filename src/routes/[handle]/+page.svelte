<script lang="ts">
  import { onMount } from 'svelte';
  import { resolveThemeConfig, isGradient } from '$lib/themes.js';
  import { generateAnonId } from '$lib/utils/helpers.js';
  import LinkCard from '$lib/components/ui/LinkCard.svelte';
  import type { ThemeConfig, Link, Profile, Theme } from '$lib/types.js';

  let { data } = $props();

  const profile = $derived(data.profile as Profile);
  const links = $derived(data.links as Link[]);
  const theme = $derived(data.theme as Theme | null);

  const themeConfig = $derived(
    theme
      ? resolveThemeConfig(
          theme.config as ThemeConfig,
          (profile.theme_overrides ?? {}) as Partial<ThemeConfig>
        )
      : null
  );

  onMount(() => {
    const anonId = generateAnonId();

    // Track page view
    fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'page_view',
        profileId: profile.id,
        anonId,
      }),
    });

    // Track link clicks via event delegation
    function handleClick(e: MouseEvent) {
      const link = (e.target as HTMLElement).closest<HTMLElement>(
        '[data-link-id]'
      );
      if (link) {
        fetch('/api/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'link_click',
            profileId: profile.id,
            linkId: link.dataset.linkId,
            anonId,
          }),
        });
      }
    }

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  });
</script>

<svelte:head>
  <title>
    {profile.name ?? profile.handle} — Lnksy
  </title>
  <meta
    name="description"
    content={profile.bio ?? `Check out ${profile.name ?? profile.handle}'s links`}
  />
  <!-- OG Tags -->
  <meta
    property="og:title"
    content={profile.name ?? profile.handle}
  />
  <meta
    property="og:description"
    content={profile.bio ?? `Links by ${profile.name ?? profile.handle}`}
  />
  {#if profile.avatar_url}
    <meta property="og:image" content={profile.avatar_url} />
  {/if}
  <meta property="og:type" content="profile" />
  <meta name="twitter:card" content="summary" />
</svelte:head>

{#if themeConfig}
  {@const bgIsGradient = isGradient(themeConfig.bg)}
  <div
    class="min-h-screen flex flex-col items-center px-4 py-8
      md:py-16"
    style="
      {bgIsGradient
      ? `background: ${themeConfig.bg}`
      : `background-color: ${themeConfig.bg}`};
      color: {themeConfig.text};
      font-family: {themeConfig.font};
    "
  >
    <div class="w-full max-w-md mx-auto flex flex-col items-center">
      <!-- Avatar -->
      {#if profile.avatar_url}
        <img
          src={profile.avatar_url}
          alt={profile.name ?? profile.handle}
          class="w-24 h-24 rounded-full object-cover mb-4
            ring-2 ring-white/20"
        />
      {:else}
        <div
          class="w-24 h-24 rounded-full mb-4 flex items-center
            justify-center text-3xl font-bold"
          style="background: rgba(255,255,255,0.15)"
        >
          {(profile.name ?? profile.handle)?.[0]?.toUpperCase()}
        </div>
      {/if}

      <!-- Name -->
      <h1 class="text-xl font-bold text-center">
        {profile.name ?? profile.handle}
      </h1>

      <!-- Bio -->
      {#if profile.bio}
        <p class="mt-2 text-sm text-center opacity-80 max-w-xs">
          {profile.bio}
        </p>
      {/if}

      <!-- Links -->
      <div class="w-full mt-8 space-y-3">
        {#each links as link (link.id)}
          <LinkCard {link} {themeConfig} />
        {/each}
      </div>

      <!-- Branding -->
      {#if profile.branding_enabled}
        <a
          href="/"
          class="mt-12 text-xs opacity-30 hover:opacity-60
            transition-opacity"
        >
          Made with Lnksy
        </a>
      {/if}
    </div>
  </div>
{/if}
