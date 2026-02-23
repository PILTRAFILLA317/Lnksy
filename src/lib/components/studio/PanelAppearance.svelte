<script lang="ts">
  import { enhance } from '$app/forms';
  import { invalidateAll, goto } from '$app/navigation';
  import PanelShell from './PanelShell.svelte';
  import { studio } from '$lib/stores/studio.svelte.js';
  import { isGradient } from '$lib/themes.js';
  import type { Profile, Theme, ThemeConfig } from '$lib/types.js';

  interface Props {
    profile: Profile;
    themes: Theme[];
    isPro: boolean;
  }

  let { profile, themes, isPro }: Props = $props();

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

<PanelShell title="Theme">
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

            {#if cfg.accent}
              <div class="absolute top-1.5 left-1.5 w-2 h-2 rounded-full opacity-80"
                style="background: {cfg.accent}"></div>
            {/if}

            {#if theme.is_pro && !selected}
              <span class="absolute top-1.5 right-1.5 text-[8px] font-bold px-1 py-0.5
                rounded bg-black/50 text-white backdrop-blur-sm">PRO</span>
            {/if}

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
</PanelShell>
