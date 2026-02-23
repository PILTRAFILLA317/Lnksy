<script lang="ts">
  import { onMount } from "svelte";
  import { dev } from "$app/environment";
  import { page } from "$app/state";
  import { studio, SECTION_TO_PANEL } from "$lib/stores/studio.svelte.js";
  import { resolveThemeConfig } from "$lib/themes.js";
  import { isLinkVisible } from "$lib/utils/helpers.js";
  import {
    resolveEffectiveProfile,
    resolveEffectiveSectionLayout,
  } from "$lib/utils/plan.js";
  import { createAutoFit, type PreviewSizeClass } from "./useAutoFit.js";
  import HeaderMediaSection from "$lib/components/sections/HeaderMediaSection.svelte";
  import TitleSection from "$lib/components/sections/TitleSection.svelte";
  import ContactSection from "$lib/components/sections/ContactSection.svelte";
  import LinksBlock from "$lib/components/blocks/LinksBlock.svelte";
  import YouTubeBlock from "$lib/components/blocks/YouTubeBlock.svelte";
  import SpotifyBlock from "$lib/components/blocks/SpotifyBlock.svelte";
  import TextBlock from "$lib/components/blocks/TextBlock.svelte";
  import DividerBlock from "$lib/components/blocks/DividerBlock.svelte";
  import type {
    Profile,
    Link,
    ProfileComponent,
    ProfileComponentWithLinks,
    Theme,
    Font,
    Background,
    ProfileContact,
    ThemeConfig,
  } from "$lib/types.js";

  interface Props {
    profile: Profile;
    links: Link[];
    components: ProfileComponent[];
    themes: Theme[];
    contacts: ProfileContact[];
    fonts: Font[];
    backgrounds: Background[];
    isPro: boolean;
  }

  let {
    profile,
    links,
    components,
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

  // Group visible links by component_id
  const componentsWithLinks: ProfileComponentWithLinks[] = $derived.by(() => {
    const linksByComponent = new Map<string, Link[]>();
    for (const link of visibleLinks) {
      if (!link.component_id) continue;
      const existing = linksByComponent.get(link.component_id) ?? [];
      existing.push(link);
      linksByComponent.set(link.component_id, existing);
    }

    return components
      .filter((c) => c.is_visible)
      .map((c) => ({
        ...c,
        // Apply plan-based layout gating for links components
        config:
          c.type === "links"
            ? {
                ...c.config,
                layout: resolveEffectiveSectionLayout(
                  profile.plan,
                  c.config?.layout ?? "LIST_ICON",
                ),
              }
            : c.config,
        links: c.type === "links" ? (linksByComponent.get(c.id) ?? []) : [],
      })) as ProfileComponentWithLinks[];
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

  // PRO background image (gated by plan)
  const bgImageUrl = $derived(
    isPro ? (profile.background_image_url ?? null) : null,
  );
  const bgOverlay = $derived(isPro ? (profile.background_overlay ?? 0) : 0);
  const bgBlurPx = $derived(isPro ? (profile.background_blur_px ?? 0) : 0);

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

{#snippet componentBlocks(cfg: { themeConfig: ThemeConfig })}
  {#each componentsWithLinks as comp (comp.id)}
    {#if comp.type === "links"}
      <div
        data-studio-section="main-links"
        class="studio-section w-full cursor-pointer"
        class:studio-section-active={studio.openPanel === "components"}
      >
        <LinksBlock component={comp} themeConfig={cfg.themeConfig} {isPro} />
      </div>
    {:else if comp.type === "youtube"}
      <div
        data-studio-section="main-links"
        class="studio-section w-full cursor-pointer"
        class:studio-section-active={studio.openPanel === "components"}
      >
        <YouTubeBlock config={comp.config} title={comp.title} />
      </div>
    {:else if comp.type === "spotify"}
      <div
        data-studio-section="main-links"
        class="studio-section w-full cursor-pointer"
        class:studio-section-active={studio.openPanel === "components"}
      >
        <SpotifyBlock config={comp.config} title={comp.title} />
      </div>
    {:else if comp.type === "text"}
      <div
        data-studio-section="main-links"
        class="studio-section w-full cursor-pointer"
        class:studio-section-active={studio.openPanel === "components"}
      >
        <TextBlock
          config={comp.config}
          title={comp.title}
          textColor={cfg.themeConfig.text}
        />
      </div>
    {:else if comp.type === "divider"}
      <DividerBlock config={comp.config} />
    {/if}
  {/each}
{/snippet}

<div class="studio-preview-shell">
  <div class="preview-fit-area" bind:this={fitAreaEl}>
    {#if themeConfig && effective}
      {#if isMobileReal}
        <div
          bind:this={mobileSurfaceEl}
          class="preview-mobile-surface"
          style="background: {pageBg};
            color: {themeConfig.text};
            font-family: '{pageFont}', system-ui, sans-serif;
            position: relative;"
        >
          {#if bgImageUrl}
            <div
              class="absolute inset-0 overflow-hidden pointer-events-none"
              style="z-index:0;"
            >
              <div
                class="absolute inset-0"
                style="background-image: url('{bgImageUrl}'); background-size: cover; background-position: center; {bgBlurPx >
                0
                  ? `filter: blur(${bgBlurPx}px); transform: scale(1.08);`
                  : ''}"
              ></div>
              {#if bgOverlay > 0}
                <div
                  class="absolute inset-0"
                  style="background: rgba(0,0,0,{bgOverlay});"
                ></div>
              {/if}
            </div>
          {/if}
          <!-- svelte-ignore a11y_click_events_have_key_events -->
          <!-- svelte-ignore a11y_no_static_element_interactions -->
          <div
            class="h-full overflow-y-auto overscroll-contain studio-preview"
            style="position: relative; z-index: 1;"
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

              {@render componentBlocks({ themeConfig })}

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
          <div
            class="mockup-phone-display studio-display"
            style="position: relative;"
          >
            {#if bgImageUrl}
              <div
                class="absolute inset-0 overflow-hidden pointer-events-none"
                style="z-index:0;"
              >
                <div
                  class="absolute inset-0"
                  style="background-image: url('{bgImageUrl}'); background-size: cover; background-position: center; {bgBlurPx >
                  0
                    ? `filter: blur(${bgBlurPx}px); transform: scale(1.08);`
                    : ''}"
                ></div>
                {#if bgOverlay > 0}
                  <div
                    class="absolute inset-0"
                    style="background: rgba(0,0,0,{bgOverlay});"
                  ></div>
                {/if}
              </div>
            {/if}
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <div
              class="h-full overflow-y-auto overscroll-contain studio-preview"
              onclick={handlePreviewClick}
              style="background: {pageBg};
                color: {themeConfig.text};
                font-family: '{pageFont}', system-ui, sans-serif;
                position: relative;"
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

                {@render componentBlocks({ themeConfig })}

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
    position: absolute;
    inset: 0;
  }

  .preview-fit-area {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }

  /* Padding only for phone mockup view (≥ 768px) */
  @media (min-width: 768px) {
    .preview-fit-area {
      padding: 1.25rem 1.5rem;
    }
  }

  @media (min-width: 1024px) {
    .preview-fit-area {
      padding: 1.5rem 2.5rem;
    }
  }

  .phone-status-bar {
    width: 100%;
    height: 54px;
    flex-shrink: 0;
  }

  .preview-mobile-surface {
    position: absolute;
    inset: 0;
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
