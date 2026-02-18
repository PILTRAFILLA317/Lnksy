<script lang="ts">
  import { studio, SECTION_TO_PANEL } from '$lib/stores/studio.svelte.js';
  import { resolveThemeConfig, isGradient } from '$lib/themes.js';
  import { isLinkVisible } from '$lib/utils/helpers.js';
  import { resolveEffectiveProfile, resolveEffectiveSectionLayout } from '$lib/utils/plan.js';
  import HeaderMediaSection from '$lib/components/sections/HeaderMediaSection.svelte';
  import TitleSection from '$lib/components/sections/TitleSection.svelte';
  import ContactSection from '$lib/components/sections/ContactSection.svelte';
  import MainLinksSection from '$lib/components/sections/MainLinksSection.svelte';
  import type {
    Profile,
    Link,
    LinkSection,
    Theme,
    Font,
    Background,
    ProfileContact,
    ThemeConfig,
    LinkSectionWithLinks,
  } from '$lib/types.js';

  interface Props {
    profile: Profile;
    links: Link[];
    sections: LinkSection[];
    themes: Theme[];
    contacts: ProfileContact[];
    fonts: Font[];
    backgrounds: Background[];
    isPro: boolean;
  }

  let { profile, links, sections, themes, contacts, fonts, backgrounds, isPro }: Props =
    $props();

  const currentTheme = $derived(themes.find((t) => t.id === profile.theme_id));
  const themeConfig = $derived(
    currentTheme
      ? resolveThemeConfig(
          currentTheme.config as ThemeConfig,
          (profile.theme_overrides ?? {}) as Partial<ThemeConfig>,
        )
      : null,
  );

  const visibleLinks = $derived(links.filter((l: Link) => isLinkVisible(l)));
  const effective = $derived(resolveEffectiveProfile(profile));

  // Group visible links by section
  const sectionsWithLinks: LinkSectionWithLinks[] = $derived.by(() => {
    const linksBySection = new Map<string, Link[]>();
    for (const link of visibleLinks) {
      const existing = linksBySection.get(link.section_id) ?? [];
      existing.push(link);
      linksBySection.set(link.section_id, existing);
    }
    return sections.map((s) => ({
      ...s,
      layout: resolveEffectiveSectionLayout(profile.plan, s.layout),
      links: linksBySection.get(s.id) ?? [],
    }));
  });

  const currentFont = $derived(
    fonts.find((f) => f.id === profile.font_id) ?? null,
  );
  const currentBackground = $derived(
    backgrounds.find((b) => b.id === profile.background_id) ?? null,
  );

  const effectiveFont = $derived(
    currentFont && currentFont.is_pro && !isPro ? null : currentFont,
  );
  const effectiveBackground = $derived(
    currentBackground && currentBackground.is_pro && !isPro
      ? null
      : currentBackground,
  );

  const pageBg = $derived(
    effectiveBackground
      ? effectiveBackground.value
      : (themeConfig?.bg ?? '#ffffff'),
  );
  const pageFont = $derived(
    effectiveFont ? effectiveFont.family : (themeConfig?.font ?? 'system-ui'),
  );

  function handlePreviewClick(e: MouseEvent) {
    const target = e.target as HTMLElement;
    const section = target.closest<HTMLElement>('[data-studio-section]');
    if (section) {
      e.preventDefault();
      e.stopPropagation();
      const sectionId = section.dataset.studioSection;
      if (!sectionId) return;

      if (sectionId in SECTION_TO_PANEL) {
        studio.setPanel(SECTION_TO_PANEL[sectionId]);
      }
    }
  }
</script>

<div class="studio-phone-wrapper">
  <div
    class="mockup-phone border-indigo-700
      {studio.openPanel ? 'studio-phone-panel-open' : ''}"
  >
    <div class="mockup-phone-camera"></div>
    <div class="mockup-phone-display studio-display">
      {#if themeConfig && effective}
        {@const bgIsGradient = isGradient(pageBg)}
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div
          class="h-full overflow-y-auto overscroll-contain studio-preview"
          onclick={handlePreviewClick}
          style="
            {bgIsGradient
              ? `background: ${pageBg}`
              : `background-color: ${pageBg}`};
            color: {themeConfig.text};
            font-family: '{pageFont}', system-ui, sans-serif;
          "
        >
            <div
              class="w-full max-w-md mx-auto min-h-full flex flex-col items-center pt-8 gap-0 pb-6"
            >
              <!-- Header section (click-to-edit) -->
              <div
                data-studio-section="header-media"
                class="w-full cursor-pointer studio-section
                  {studio.openPanel === 'header' ? 'studio-section-active' : ''}"
              >
                <HeaderMediaSection
                  headerMode={effective.headerMode}
                  avatarUrl={profile.avatar_url}
                  heroUrl={profile.hero_url}
                  heroPosition={profile.hero_position}
                  displayTitle={effective.displayTitle}
                  bgColor={pageBg}
                />
              </div>

              <!-- Title & Bio section (click-to-edit) -->
              <div
                data-studio-section="title-bio"
                class="w-full cursor-pointer studio-section
                  {studio.openPanel === 'title' ? 'studio-section-active' : ''}"
              >
                <TitleSection
                  displayTitle={effective.displayTitle}
                  bio={profile.bio}
                />
              </div>

              <!-- Contact section (click-to-edit) -->
              <div
                data-studio-section="contacts"
                class="w-full cursor-pointer studio-section
                  {studio.openPanel === 'contacts' ? 'studio-section-active' : ''}"
              >
                <ContactSection
                  contacts={contacts.filter((c) => c.is_enabled)}
                  textColor={themeConfig.text}
                  profileId={profile.id}
                />
              </div>

              <!-- All link sections (single selectable block) -->
              <div
                data-studio-section="main-links"
                class="w-full cursor-pointer studio-section
                  {studio.openPanel === 'links' ? 'studio-section-active' : ''}"
              >
                {#each sectionsWithLinks as section (section.id)}
                  {#if section.title}
                    <h2 class="w-full px-4 mt-3 mb-1 text-sm font-semibold opacity-70">
                      {section.title}
                    </h2>
                  {/if}
                  <MainLinksSection
                    links={section.links}
                    layout={section.layout}
                    {themeConfig}
                  />
                {/each}
              </div>

            {#if profile.branding_enabled}
              <p class="mt-auto pt-10 pb-6 text-xs opacity-30">
                Made with Lnksy
              </p>
            {/if}
            </div>
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  .studio-phone-wrapper {
    width: 100%;
    display: flex;
    justify-content: center;
  }

  /*
   * Normalize mockup sizing so the display sits centered vertically
   * instead of floating upward. Keep a realistic mobile width while
   * clamping height to the viewport.
   */
  .studio-phone-wrapper :global(.mockup-phone) {
    width: min(375px, 100%, calc((100dvh - 10rem) * (462 / 978)));
    height: auto;
    aspect-ratio: 462 / 978;
  }

  @media (min-width: 1024px) {
    .studio-phone-wrapper :global(.mockup-phone) {
      width: min(375px, 100%, calc((100dvh - 8rem) * (462 / 978)));
    }

    .studio-phone-wrapper :global(.mockup-phone.studio-phone-panel-open) {
      width: min(340px, 100%, calc((100dvh - 8rem) * (462 / 978)));
    }
  }

  .studio-phone-wrapper :global(.studio-display) {
    width: 100% !important;
    height: 100% !important;
  }

  /* Prevent actual link navigation inside preview */
  .studio-preview :global(a) {
    pointer-events: none;
  }

  .studio-preview :global([data-studio-section]) {
    pointer-events: auto;
  }

  /* Click-to-edit section highlights */
  .studio-section {
    margin-top: 0.3rem;
    margin-bottom: 0.3rem;
    position: relative;
    border-radius: 0.75rem;
    transition: box-shadow 150ms ease;
  }

  .studio-section:hover {
    box-shadow: inset 0 0 0 2px rgba(129, 140, 248, 0.4);
  }

  .studio-section-active {
    box-shadow: inset 0 0 0 2px rgb(99, 102, 241);
  }
</style>
