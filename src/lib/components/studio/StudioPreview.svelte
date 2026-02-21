<script lang="ts">
  import { onMount } from "svelte";
  import { dev } from "$app/environment";
  import { page } from "$app/state";
  import { studio, SECTION_TO_PANEL } from "$lib/stores/studio.svelte.js";
  import { resolveThemeConfig, isGradient } from "$lib/themes.js";
  import { isLinkVisible } from "$lib/utils/helpers.js";
  import {
    resolveEffectiveProfile,
    resolveEffectiveSectionLayout,
  } from "$lib/utils/plan.js";
  import { createAutoFit, type PreviewSizeClass } from "./useAutoFit.js";
  import HeaderMediaSection from "$lib/components/sections/HeaderMediaSection.svelte";
  import TitleSection from "$lib/components/sections/TitleSection.svelte";
  import ContactSection from "$lib/components/sections/ContactSection.svelte";
  import MainLinksSection from "$lib/components/sections/MainLinksSection.svelte";
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
  } from "$lib/types.js";

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

  let {
    profile,
    links,
    sections,
    themes,
    contacts,
    fonts,
    backgrounds,
    isPro,
  }: Props = $props();

  let fitAreaEl = $state<HTMLElement | null>(null);
  let mobileSurfaceEl = $state<HTMLElement | null>(null);
  let viewportWidth = $state(0);
  let screenWidth = $state(390);
  let screenHeight = $state(Math.round(390 * (19.5 / 9)));
  let sizeClass = $state<PreviewSizeClass>("sm");

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
      : (themeConfig?.bg ?? "#ffffff"),
  );
  const pageFont = $derived(
    effectiveFont ? effectiveFont.family : (themeConfig?.font ?? "system-ui"),
  );

  const isMobileReal = $derived(viewportWidth < 768);
  const showDebugOverlay = $derived(
    dev && page.url.searchParams.get("debugPreview") === "1",
  );

  const autoFit = createAutoFit((size) => {
    screenWidth = size.width;
    screenHeight = size.height;
    sizeClass = size.sizeClass;
  });

  let cleanupFitObserver: (() => void) | null = null;
  let cleanupMobileObserver: (() => void) | null = null;

  function trackViewport() {
    if (typeof window === "undefined") return;
    viewportWidth = window.innerWidth;
  }

  function updateMobileMetrics() {
    if (!mobileSurfaceEl) return;
    const width = Math.round(mobileSurfaceEl.clientWidth);
    screenWidth = width;
    sizeClass =
      width <= 360 ? "xs" : width <= 400 ? "sm" : width <= 460 ? "md" : "lg";
    screenHeight = mobileSurfaceEl.clientHeight;
  }

  onMount(() => {
    trackViewport();
    window.addEventListener("resize", trackViewport);
    return () => {
      window.removeEventListener("resize", trackViewport);
    };
  });

  $effect(() => {
    if (!fitAreaEl) return;

    cleanupFitObserver?.();
    cleanupFitObserver = null;

    if (isMobileReal) return;

    cleanupFitObserver = autoFit.observe(fitAreaEl, () => ({
      orientation: "portrait",
      zoomMode: "100",
    }));

    return () => {
      cleanupFitObserver?.();
      cleanupFitObserver = null;
    };
  });

  $effect(() => {
    if (!fitAreaEl || isMobileReal) return;
    autoFit.recalculate(fitAreaEl, {
      orientation: "portrait",
      zoomMode: "100",
    });
  });

  $effect(() => {
    if (!mobileSurfaceEl) return;

    cleanupMobileObserver?.();
    cleanupMobileObserver = null;

    if (!isMobileReal) return;

    updateMobileMetrics();
    const observer = new ResizeObserver(() => {
      requestAnimationFrame(updateMobileMetrics);
    });
    observer.observe(mobileSurfaceEl);

    cleanupMobileObserver = () => observer.disconnect();

    return () => {
      cleanupMobileObserver?.();
      cleanupMobileObserver = null;
    };
  });

  function handlePreviewClick(e: MouseEvent) {
    const target = e.target as HTMLElement;
    const section = target.closest<HTMLElement>("[data-studio-section]");
    if (!section) return;

    e.preventDefault();
    e.stopPropagation();

    const sectionId = section.dataset.studioSection;
    if (!sectionId) return;
    if (sectionId in SECTION_TO_PANEL) {
      studio.setPanel(SECTION_TO_PANEL[sectionId]);
    }
  }
</script>

<div class="studio-preview-shell">
  <div class="preview-fit-area" bind:this={fitAreaEl}>
    {#if themeConfig && effective}
      {@const bgIsGradient = isGradient(pageBg)}
      {#if isMobileReal}
        <div
          bind:this={mobileSurfaceEl}
          class="preview-mobile-surface"
          style="{bgIsGradient
            ? `background: ${pageBg}`
            : `background-color: ${pageBg}`};
            color: {themeConfig.text};
            font-family: '{pageFont}', system-ui, sans-serif;"
        >
          <!-- svelte-ignore a11y_click_events_have_key_events -->
          <!-- svelte-ignore a11y_no_static_element_interactions -->
          <div
            class="h-full overflow-y-auto overscroll-contain studio-preview"
            onclick={handlePreviewClick}
          >
            <div
              class="w-full max-w-md mx-auto min-h-full flex flex-col items-center pt-8 gap-0 pb-6"
            >
              <div
                data-studio-section="header-media"
                class="studio-section w-full cursor-pointer"
                class:studio-section-active={studio.openPanel === "header"}
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

              <div
                data-studio-section="title-bio"
                class="studio-section w-full cursor-pointer"
                class:studio-section-active={studio.openPanel === "title"}
              >
                <TitleSection
                  displayTitle={effective.displayTitle}
                  bio={profile.bio}
                />
              </div>

              <div
                data-studio-section="contacts"
                class="studio-section w-full cursor-pointer"
                class:studio-section-active={studio.openPanel === "contacts"}
              >
                <ContactSection
                  contacts={contacts.filter((c) => c.is_enabled)}
                  textColor={themeConfig.text}
                  profileId={profile.id}
                />
              </div>

              <div
                data-studio-section="main-links"
                class="studio-section w-full cursor-pointer"
                class:studio-section-active={studio.openPanel === "links"}
              >
                {#each sectionsWithLinks as section (section.id)}
                  {#if section.title}
                    <h2
                      class="w-full px-4 mt-3 mb-1 text-sm font-semibold opacity-70"
                    >
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
        </div>
      {:else}
        <div
          class="mockup-phone border-indigo-700"
          style="width:{screenWidth}px;height:{screenHeight}px;"
        >
          <div class="mockup-phone-camera"></div>
          <div class="mockup-phone-display studio-display">
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <div
              class="h-full overflow-y-auto overscroll-contain studio-preview"
              onclick={handlePreviewClick}
              style="{bgIsGradient
                ? `background: ${pageBg}`
                : `background-color: ${pageBg}`};
                color: {themeConfig.text};
                font-family: '{pageFont}', system-ui, sans-serif;"
            >
              <div
                class="w-full max-w-md mx-auto min-h-full flex flex-col items-center gap-0 pb-6"
              >
                <div class="phone-status-bar" aria-hidden="true"></div>

                <div
                  data-studio-section="header-media"
                  class="studio-section w-full cursor-pointer"
                  class:studio-section-active={studio.openPanel === "header"}
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

                <div
                  data-studio-section="title-bio"
                  class="studio-section w-full cursor-pointer"
                  class:studio-section-active={studio.openPanel === "title"}
                >
                  <TitleSection
                    displayTitle={effective.displayTitle}
                    bio={profile.bio}
                  />
                </div>

                <div
                  data-studio-section="contacts"
                  class="studio-section w-full cursor-pointer"
                  class:studio-section-active={studio.openPanel === "contacts"}
                >
                  <ContactSection
                    contacts={contacts.filter((c) => c.is_enabled)}
                    textColor={themeConfig.text}
                    profileId={profile.id}
                  />
                </div>

                <div
                  data-studio-section="main-links"
                  class="studio-section w-full cursor-pointer"
                  class:studio-section-active={studio.openPanel === "links"}
                >
                  {#each sectionsWithLinks as section (section.id)}
                    {#if section.title}
                      <h2
                        class="w-full px-4 mt-3 mb-1 text-sm font-semibold opacity-70"
                      >
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
          </div>
        </div>
      {/if}
    {/if}

    {#if showDebugOverlay}
      <div class="preview-debug-overlay">
        <span>w: {screenWidth}px</span>
        <span>class: {sizeClass}</span>
        <span>zoom: 100%</span>
      </div>
    {/if}
  </div>
</div>

<style>
  .studio-preview-shell {
    width: 100%;
    height: 100%;
    min-height: 0;
    display: block;
  }

  .preview-fit-area {
    position: relative;
    width: 100%;
    height: 100%;
    min-height: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }

  .phone-status-bar {
    width: 100%;
    height: 54px;
    flex-shrink: 0;
  }

  .preview-mobile-surface {
    width: 100%;
    height: 100%;
    max-width: 100%;
    border-radius: 0;
    overflow: hidden;
  }

  :global(.studio-display) {
    width: 100% !important;
    height: 100% !important;
  }

  .studio-preview :global(a) {
    pointer-events: none;
  }

  .studio-preview :global([data-studio-section]) {
    pointer-events: auto;
  }

  .studio-section {
    width: 100%;
    margin-block: 0.2rem;
    border-radius: 0.75rem;
    position: relative;
    transition: box-shadow 140ms ease;
  }

  .studio-section:hover {
    box-shadow: inset 0 0 0 2px rgb(129 140 248 / 0.35);
  }

  .studio-section-active {
    box-shadow: inset 0 0 0 2px rgb(99 102 241);
  }

  .preview-debug-overlay {
    position: absolute;
    top: 0.55rem;
    left: 0.55rem;
    z-index: 9;
    display: grid;
    gap: 0.2rem;
    padding: 0.45rem 0.55rem;
    border-radius: 0.6rem;
    background: rgb(17 24 39 / 0.78);
    color: white;
    font-size: 11px;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    pointer-events: none;
  }
</style>
