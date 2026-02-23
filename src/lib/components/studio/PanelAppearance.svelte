<script lang="ts">
  import { enhance } from '$app/forms';
  import { invalidateAll, goto } from '$app/navigation';
  import PanelShell from './PanelShell.svelte';
  import UpgradeCTA from './UpgradeCTA.svelte';
  import { studio } from '$lib/stores/studio.svelte.js';
  import { isGradient } from '$lib/themes.js';
  import type { Profile, Theme, ThemeConfig, Background } from '$lib/types.js';

  interface Props {
    profile: Profile;
    themes: Theme[];
    backgrounds: Background[];
    isPro: boolean;
  }

  let { profile, themes, backgrounds, isPro }: Props = $props();

  // ── Theme picker ────────────────────────────────────────────
  let searchQuery = $state('');

  const sortedThemes = $derived(
    [...themes].sort((a, b) => {
      if (a.id === profile.theme_id) return -1;
      if (b.id === profile.theme_id) return 1;
      if (!a.is_pro && b.is_pro) return -1;
      if (a.is_pro && !b.is_pro) return 1;
      return a.name.localeCompare(b.name);
    }),
  );

  const filteredThemes = $derived(
    searchQuery.trim()
      ? sortedThemes.filter((t) =>
          t.name.toLowerCase().includes(searchQuery.toLowerCase()),
        )
      : sortedThemes,
  );

  // ── Background image state ───────────────────────────────────
  let overlayVal = $state(profile.background_overlay ?? 0);
  let blurVal = $state(profile.background_blur_px ?? 0);
  let settingsTimer: ReturnType<typeof setTimeout> | null = null;

  function scheduleSettingsUpdate() {
    if (settingsTimer) clearTimeout(settingsTimer);
    settingsTimer = setTimeout(() => {
      const fd = new FormData();
      fd.set('overlay', String(overlayVal));
      fd.set('blur', String(blurVal));
      fetch('/app?/updateBackgroundSettings', { method: 'POST', body: fd })
        .then(() => invalidateAll());
    }, 400);
  }

  function removeImage() {
    const fd = new FormData();
    fd.set('overlay', String(overlayVal));
    fd.set('blur', String(blurVal));
    fd.set('removeImage', '1');
    fetch('/app?/updateBackgroundSettings', { method: 'POST', body: fd })
      .then(() => {
        invalidateAll();
        studio.showToast('Background image removed');
      });
  }

  const hasBgImage = $derived(!!profile.background_image_url);
  const downgradeWarning = $derived(!isPro && hasBgImage);

  // ── Helpers ──────────────────────────────────────────────────
  function enhanceAction(successMsg: string) {
    return () => {
      return async ({ result }: { result: { type: string } }) => {
        if (result.type === 'success') {
          invalidateAll();
          studio.showToast(successMsg);
        } else if (result.type === 'failure') {
          studio.showToast('Action failed', 'error');
        }
      };
    };
  }

  function getCfg(theme: Theme): ThemeConfig {
    return theme.config as ThemeConfig;
  }
</script>

<PanelShell title="Appearance">
  <!-- ── THEMES ─────────────────────────────────────────────── -->
  <section class="mb-5">
    <p class="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2.5">Theme</p>

    <!-- Search -->
    <div class="relative mb-3">
      <svg class="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none"
        fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
          d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
      </svg>
      <input
        type="search"
        placeholder="Search themes…"
        bind:value={searchQuery}
        class="w-full pl-8 pr-3 py-1.5 text-sm bg-gray-50 border border-gray-200
          rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300
          focus:border-indigo-400 placeholder-gray-400"
      />
    </div>

    <!-- Theme grid -->
    <div class="grid grid-cols-2 gap-2.5">
      {#each filteredThemes as theme (theme.id)}
        {@const cfg = getCfg(theme)}
        {@const selected = profile.theme_id === theme.id}
        {@const locked = theme.is_pro && !isPro}
        {@const bgIsGrad = isGradient(cfg.bg)}
        <form
          method="POST"
          action="?/selectTheme"
          use:enhance={enhanceAction('Theme updated')}
        >
          <input type="hidden" name="themeId" value={theme.id} />
          <button
            type={locked ? 'button' : 'submit'}
            onclick={locked ? () => goto('/app/billing') : undefined}
            class="w-full text-left rounded-xl border-2 transition-all relative overflow-hidden
              {selected
                ? 'border-indigo-600 ring-2 ring-indigo-200 shadow-md'
                : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'}
              {locked ? 'opacity-55' : ''}"
            title={locked ? `${theme.name} — Pro required` : theme.name}
          >
            <!-- Thumbnail -->
            <div
              class="h-[60px] w-full relative overflow-hidden flex items-end p-1.5"
              style="{bgIsGrad ? `background: ${cfg.bg}` : `background-color: ${cfg.bg}`}"
            >
              <!-- Mini button preview -->
              <div
                class="w-full px-1.5 py-1 flex items-center gap-1.5"
                style="
                  background: {cfg.cardBg};
                  border: 1px solid {cfg.cardBorder};
                  border-radius: min(calc({cfg.buttonRadius ?? cfg.cardRadius} * 0.55), 10px);
                  color: {cfg.cardText};
                  {cfg.backdropBlur ? `backdrop-filter: blur(${cfg.backdropBlur})` : ''}
                "
              >
                <span
                  class="block w-2 h-2 shrink-0 rounded-full opacity-60"
                  style="background: {cfg.cardText}"
                ></span>
                <div class="flex-1 space-y-0.5">
                  <span class="block h-[3px] w-full rounded-full opacity-70"
                    style="background: {cfg.cardText}"></span>
                  <span class="block h-[3px] w-3/5 rounded-full opacity-35"
                    style="background: {cfg.cardText}"></span>
                </div>
              </div>

              <!-- Accent dot -->
              {#if cfg.accent}
                <div class="absolute top-1.5 left-1.5 w-2 h-2 rounded-full opacity-80"
                  style="background: {cfg.accent}"></div>
              {/if}

              <!-- PRO badge -->
              {#if theme.is_pro && !selected}
                <span class="absolute top-1.5 right-1.5 text-[8px] font-bold px-1 py-0.5
                  rounded bg-black/50 text-white backdrop-blur-sm">PRO</span>
              {/if}

              <!-- Selected check -->
              {#if selected}
                <span class="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-indigo-600
                  flex items-center justify-center shadow">
                  <svg class="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24"
                    stroke="currentColor" stroke-width="3">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </span>
              {/if}
            </div>

            <!-- Name -->
            <div class="px-2 py-1.5 flex items-center justify-between">
              <p class="text-xs font-semibold text-gray-800 truncate leading-tight">
                {theme.name}
              </p>
              {#if selected}
                <span class="text-[9px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5
                  rounded-full font-bold uppercase tracking-wide shrink-0">
                  On
                </span>
              {/if}
            </div>
          </button>
        </form>
      {/each}

      {#if filteredThemes.length === 0}
        <p class="col-span-2 text-center text-sm text-gray-400 py-4">No themes found</p>
      {/if}
    </div>
  </section>

  <div class="border-t border-gray-100 my-4"></div>

  <!-- ── BACKGROUND ─────────────────────────────────────────── -->
  <section>
    <p class="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Background</p>

    <!-- PRO: Background Image -->
    {#if isPro}
      <div class="mb-4">
        {#if hasBgImage}
          <!-- Preview + controls -->
          <div class="relative mb-3 rounded-xl overflow-hidden h-24 bg-gray-100">
            <img
              src={profile.background_image_url}
              alt="Background"
              class="w-full h-full object-cover"
            />
            <div
              class="absolute inset-0"
              style="background: rgba(0,0,0,{overlayVal}); backdrop-filter: blur({blurVal}px);"
            ></div>
            <button
              onclick={removeImage}
              class="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 text-white
                flex items-center justify-center hover:bg-black/80 transition-colors"
              aria-label="Remove background image"
            >
              <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <div class="mb-2">
            <div class="flex justify-between mb-1">
              <label class="text-[11px] font-medium text-gray-500">Overlay darkness</label>
              <span class="text-[11px] text-gray-400">{Math.round(overlayVal * 100)}%</span>
            </div>
            <input
              type="range" min="0" max="0.85" step="0.05"
              bind:value={overlayVal}
              oninput={scheduleSettingsUpdate}
              class="w-full h-1.5 rounded-full accent-indigo-600"
            />
          </div>
          <div class="mb-4">
            <div class="flex justify-between mb-1">
              <label class="text-[11px] font-medium text-gray-500">Background blur</label>
              <span class="text-[11px] text-gray-400">{blurVal}px</span>
            </div>
            <input
              type="range" min="0" max="24" step="1"
              bind:value={blurVal}
              oninput={scheduleSettingsUpdate}
              class="w-full h-1.5 rounded-full accent-indigo-600"
            />
          </div>
        {:else}
          <!-- Upload -->
          <form
            method="POST"
            action="?/uploadBackgroundImage"
            enctype="multipart/form-data"
            use:enhance={enhanceAction('Background image uploaded')}
            class="mb-4"
          >
            <label
              class="flex flex-col items-center justify-center gap-2 w-full py-4 rounded-xl
                border-2 border-dashed border-gray-200 hover:border-indigo-300
                text-sm text-gray-400 hover:text-indigo-600 cursor-pointer
                bg-gray-50/60 hover:bg-indigo-50/30 transition-all"
            >
              <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round"
                  d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M13.5 12h.008v.008H13.5V12z"/>
                <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"/>
              </svg>
              <span class="text-xs font-medium">Upload background image</span>
              <span class="text-[10px] text-gray-400">Max 8 MB · JPG, PNG, WebP</span>
              <input type="file" name="bgImage" accept="image/*" class="hidden"
                onchange={(e) => (e.currentTarget.form as HTMLFormElement)?.requestSubmit()}
              />
            </label>
          </form>
        {/if}
      </div>
    {:else if downgradeWarning}
      <div class="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200">
        <p class="text-xs text-amber-700 font-medium">
          Your background image is hidden (PRO feature). Upgrade to show it again.
        </p>
        <button
          onclick={() => goto('/app/billing')}
          class="mt-2 text-xs text-amber-700 font-semibold underline hover:text-amber-900"
        >Upgrade to PRO</button>
      </div>
    {:else if !isPro}
      <div class="mb-4">
        <UpgradeCTA message="Upload a custom background image with overlay and blur controls." />
      </div>
    {/if}

    <!-- Color presets -->
    <p class="text-[11px] font-medium text-gray-500 uppercase tracking-wide mb-2">Color presets</p>
    <div class="grid grid-cols-3 gap-2">
      {#each backgrounds as bg (bg.id)}
        {@const selected = profile.background_id === bg.id}
        {@const locked = bg.is_pro && !isPro}
        <form
          method="POST"
          action="?/selectBackground"
          use:enhance={enhanceAction('Background updated')}
        >
          <input type="hidden" name="backgroundId" value={bg.id} />
          <button
            type={locked ? 'button' : 'submit'}
            onclick={locked ? () => goto('/app/billing') : undefined}
            class="w-full rounded-xl border-2 overflow-hidden transition-all
              {selected
                ? 'border-indigo-600 ring-2 ring-indigo-200'
                : 'border-gray-200 hover:border-gray-300'}
              {locked ? 'opacity-50' : ''}"
          >
            <div class="h-10 w-full" style="background: {bg.value};"></div>
            <p class="text-[10px] font-medium text-gray-700 py-1.5 px-1
              flex items-center justify-center gap-1 leading-tight">
              {bg.name}
              {#if bg.is_pro}
                <span class="text-[8px] bg-indigo-100 text-indigo-700
                  px-1 py-0.5 rounded-full font-semibold">PRO</span>
              {/if}
            </p>
          </button>
        </form>
      {/each}
    </div>
  </section>
</PanelShell>
