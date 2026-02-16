<script lang="ts">
  import { onMount } from 'svelte';
  import { resolveThemeConfig, isGradient } from '$lib/themes.js';
  import { generateAnonId } from '$lib/utils/helpers.js';
  import type {
    ThemeConfig,
    Link,
    Profile,
    Theme,
    Font,
    Background,
    ProfileContact,
    LinkSectionWithLinks,
  } from '$lib/types.js';
  import HeaderMediaSection from '$lib/components/sections/HeaderMediaSection.svelte';
  import TitleSection from '$lib/components/sections/TitleSection.svelte';
  import ContactSection from '$lib/components/sections/ContactSection.svelte';
  import MainLinksSection from '$lib/components/sections/MainLinksSection.svelte';

  let { data } = $props();

  const profile = $derived(data.profile as Profile);
  const effective = $derived(data.effective);
  const sections = $derived(data.sections as LinkSectionWithLinks[]);
  const theme = $derived(data.theme as Theme | null);
  const contacts = $derived(data.contacts as ProfileContact[]);
  const font = $derived(data.font as Font | null);
  const background = $derived(data.background as Background | null);

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
  {@const bgIsGradient = isGradient(bgValue)}
  <div
    class="min-h-screen flex flex-col items-center"
    style="
      {bgIsGradient
      ? `background: ${bgValue}`
      : `background-color: ${bgValue}`};
      color: {themeConfig.text};
      font-family: '{fontFamily}', system-ui, sans-serif;
    "
  >
    <div class="w-full max-w-md mx-auto flex flex-col items-center flex-1 pt-12">
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

      <!-- Section 4: Link Sections -->
      {#each sections as section (section.id)}
        {#if section.title}
          <h2 class="w-full px-4 mt-4 mb-1 text-sm font-semibold opacity-70">
            {section.title}
          </h2>
        {/if}
        <MainLinksSection
          links={section.links}
          layout={section.layout}
          {themeConfig}
        />
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
