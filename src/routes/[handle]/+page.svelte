<script lang="ts">
  import { onMount } from 'svelte';
  import { resolveThemeConfig } from '$lib/themes.js';
  import { generateAnonId } from '$lib/utils/helpers.js';
  import type {
    ThemeConfig,
    Profile,
    Theme,
    Font,
    Background,
    ProfileContact,
    ProfileComponentWithLinks,
  } from '$lib/types.js';
  import HeaderMediaSection from '$lib/components/sections/HeaderMediaSection.svelte';
  import TitleSection from '$lib/components/sections/TitleSection.svelte';
  import ContactSection from '$lib/components/sections/ContactSection.svelte';
  import LinksBlock from '$lib/components/blocks/LinksBlock.svelte';
  import YouTubeBlock from '$lib/components/blocks/YouTubeBlock.svelte';
  import SpotifyBlock from '$lib/components/blocks/SpotifyBlock.svelte';
  import TextBlock from '$lib/components/blocks/TextBlock.svelte';
  import DividerBlock from '$lib/components/blocks/DividerBlock.svelte';
  import LiveBlock from '$lib/components/blocks/LiveBlock.svelte';

  let { data } = $props();

  const profile = $derived(data.profile as Profile);
  const effective = $derived(data.effective);
  const components = $derived(data.components as ProfileComponentWithLinks[]);
  const theme = $derived(data.theme as Theme | null);
  const contacts = $derived(data.contacts as ProfileContact[]);
  const font = $derived(data.font as Font | null);
  const background = $derived(data.background as Background | null);
  const isPro = $derived((data.profile as Profile)?.plan === 'PRO');

  const themeConfig = $derived(
    theme
      ? resolveThemeConfig(
          theme.config as ThemeConfig,
          (profile.theme_overrides ?? {}) as Partial<ThemeConfig>
        )
      : null
  );

  // Resolve background: custom background > theme bg
  const pageBg = $derived(() => {
    if (background) return background.value;
    return themeConfig?.bg ?? '#ffffff';
  });

  // Resolve font: custom font > theme font
  const pageFont = $derived(() => {
    if (font) return font.family;
    return themeConfig?.font ?? 'system-ui';
  });

  // PRO: background image (gated server-side; only present if plan === PRO)
  const bgImageUrl = $derived(data.bgImageUrl as string | null ?? null);
  const bgOverlay = $derived(data.bgOverlay as number ?? 0);
  const bgBlurPx = $derived(data.bgBlurPx as number ?? 0);

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
            componentId: link.dataset.componentId,
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
    {effective.displayTitle} — Lnksy
  </title>
  <meta
    name="description"
    content={profile.bio ?? `Check out ${effective.displayTitle}'s links`}
  />
  <meta property="og:title" content={effective.displayTitle} />
  <meta
    property="og:description"
    content={profile.bio ?? `Links by ${effective.displayTitle}`}
  />
  {#if profile.avatar_url}
    <meta property="og:image" content={profile.avatar_url} />
  {/if}
  <meta property="og:type" content="profile" />
  <meta name="twitter:card" content="summary" />
  {#if font?.url}
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link
      rel="preconnect"
      href="https://fonts.gstatic.com"
      crossorigin="anonymous"
    />
    <link rel="stylesheet" href={font.url} />
  {/if}
</svelte:head>

{#if themeConfig}
  {@const bgValue = pageBg()}
  {@const fontFamily = pageFont()}

  <div
    class="relative min-h-screen flex flex-col items-center overflow-x-hidden"
    style="
      background: {bgValue};
      color: {themeConfig.text};
      font-family: '{fontFamily}', system-ui, sans-serif;
    "
  >
    <!-- PRO: Background image layer (fixed behind content) -->
    {#if bgImageUrl}
      <div class="fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
        <!-- Image with blur (scale-up prevents edge artifacts) -->
        <div
          class="absolute inset-0"
          style="
            background-image: url('{bgImageUrl}');
            background-size: cover;
            background-position: center;
            {bgBlurPx > 0 ? `filter: blur(${bgBlurPx}px); transform: scale(1.08);` : ''}
          "
        ></div>
        <!-- Darkness overlay -->
        {#if bgOverlay > 0}
          <div
            class="absolute inset-0"
            style="background: rgba(0,0,0,{bgOverlay});"
          ></div>
        {/if}
      </div>
    {/if}

    <div class="w-full max-w-md mx-auto flex flex-col items-center flex-1 pt-5">
      <!-- Section 1: Header Media -->
      <HeaderMediaSection
        headerMode={effective.headerMode}
        avatarUrl={profile.avatar_url}
        heroUrl={profile.hero_url}
        heroPosition={profile.hero_position}
        displayTitle={effective.displayTitle}
        bgColor={bgValue}
      />

      <!-- Section 2: Title & Bio -->
      <TitleSection
        displayTitle={effective.displayTitle}
        bio={profile.bio}
      />

      <!-- Section 3: Contact Icons -->
      <ContactSection
        {contacts}
        textColor={themeConfig.text}
        profileId={profile.id}
      />

      <!-- Section 4: Components -->
      {#each components as comp (comp.id)}
        {#if comp.type === 'links'}
          <LinksBlock component={comp} themeConfig={themeConfig} {isPro} />
        {:else if comp.type === 'youtube'}
          <YouTubeBlock config={comp.config} title={comp.title} />
        {:else if comp.type === 'spotify'}
          <SpotifyBlock config={comp.config} title={comp.title} />
        {:else if comp.type === 'text'}
          <TextBlock config={comp.config} title={comp.title} textColor={themeConfig.text} />
        {:else if comp.type === 'divider'}
          <DividerBlock config={comp.config} />
        {:else if comp.type === 'live'}
          <LiveBlock config={comp.config} title={comp.title} />
        {/if}
      {/each}

      <!-- Branding -->
      {#if profile.branding_enabled}
        <a
          href="/"
          class="mt-auto pt-12 pb-8 text-xs opacity-30 hover:opacity-60
            transition-opacity"
        >
          Made with Lnksy
        </a>
      {:else}
        <div class="mt-auto h-8"></div>
      {/if}
    </div>
  </div>
{/if}
