<script lang="ts">
  import { enhance } from '$app/forms';
  import { invalidateAll, goto } from '$app/navigation';
  import PanelShell from './PanelShell.svelte';
  import { studio } from '$lib/stores/studio.svelte.js';
  import { isGradient } from '$lib/themes.js';
  import type { Theme, Profile, ThemeConfig, ThemeTag } from '$lib/types.js';

  interface Props {
    themes: Theme[];
    profile: Profile;
    isPro: boolean;
  }

  let { themes, profile, isPro }: Props = $props();

  // ── Filters ────────────────────────────────────────────────

  const TAG_FILTERS: { label: string; value: ThemeTag | 'all' }[] = [
    { label: 'All', value: 'all' },
    { label: 'Dark', value: 'dark' },
    { label: 'Light', value: 'light' },
    { label: 'Gradient', value: 'gradient' },
    { label: 'Glass', value: 'glass' },
    { label: 'Pastel', value: 'pastel' },
    { label: 'Neon', value: 'neon' },
    { label: 'Minimal', value: 'minimal' },
    { label: 'Bold', value: 'bold' },
    { label: 'Warm', value: 'warm' },
    { label: 'Cool', value: 'cool' },
  ];

  let activeFilter = $state<ThemeTag | 'all'>('all');
  let searchQuery = $state('');

  const filteredThemes = $derived(
    themes.filter((t) => {
      const matchesTag =
        activeFilter === 'all' || (t.tags ?? []).includes(activeFilter);
      const matchesSearch =
        !searchQuery ||
        t.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesTag && matchesSearch;
    }),
  );

  // ── Helpers ────────────────────────────────────────────────

  function getCfg(theme: Theme): ThemeConfig {
    return theme.config as ThemeConfig;
  }

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
</script>

<PanelShell title="Themes">
  <!-- Search -->
  <div class="mb-3">
    <div class="relative">
      <svg
        class="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
        fill="none" viewBox="0 0 24 24" stroke="currentColor"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
          d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
      </svg>
      <input
        type="search"
        placeholder="Search themes…"
        bind:value={searchQuery}
        class="w-full pl-8 pr-3 py-2 text-sm bg-gray-50 border border-gray-200
          rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300
          focus:border-indigo-400 placeholder-gray-400"
      />
    </div>
  </div>

  <!-- Tag filter chips -->
  <div class="flex gap-1.5 flex-wrap mb-4">
    {#each TAG_FILTERS as filter (filter.value)}
      <button
        onclick={() => (activeFilter = filter.value)}
        class="px-2.5 py-1 text-xs rounded-full font-medium transition-all border
          {activeFilter === filter.value
            ? 'bg-indigo-600 text-white border-indigo-600'
            : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-100'}"
      >
        {filter.label}
      </button>
    {/each}
  </div>

  <!-- Theme grid -->
  {#if filteredThemes.length === 0}
    <p class="text-center text-sm text-gray-400 py-8">No themes match your filters.</p>
  {:else}
    <div class="grid grid-cols-2 gap-3">
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
            class="w-full text-left p-2 rounded-xl border-2 transition-all relative overflow-hidden
              {selected
                ? 'border-indigo-600 ring-2 ring-indigo-200 shadow-md'
                : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'}
              {locked ? 'opacity-60' : ''}"
            title={locked ? `${theme.name} — Pro plan required` : theme.name}
          >
            <!-- Thumbnail: background + mini card + accent dot -->
            <div
              class="theme-thumb rounded-lg mb-2 relative overflow-hidden"
              style="{bgIsGrad ? `background: ${cfg.bg}` : `background-color: ${cfg.bg}`}"
            >
              <!-- Mini card -->
              <div
                class="thumb-card"
                style="
                  background: {cfg.cardBg};
                  color: {cfg.cardText};
                  border: 1px solid {cfg.cardBorder};
                  border-radius: min(calc({cfg.cardRadius} * 0.5), 8px);
                  {cfg.backdropBlur ? `backdrop-filter: blur(${cfg.backdropBlur}); -webkit-backdrop-filter: blur(${cfg.backdropBlur});` : ''}
                "
              >
                <span class="thumb-link-bar" style="background: {cfg.cardText}; opacity: 0.7;"></span>
                <span class="thumb-link-bar short" style="background: {cfg.cardText}; opacity: 0.4;"></span>
              </div>

              <!-- Accent dot -->
              {#if cfg.accent}
                <div
                  class="thumb-accent"
                  style="background: {cfg.accent};"
                ></div>
              {/if}

              <!-- PRO badge overlay -->
              {#if theme.is_pro}
                <span class="thumb-pro-badge">PRO</span>
              {/if}

              <!-- Selected checkmark -->
              {#if selected}
                <span class="thumb-check">
                  <svg class="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </span>
              {/if}
            </div>

            <!-- Name row -->
            <div class="flex items-center justify-between gap-1 px-0.5">
              <p class="text-xs font-semibold text-gray-800 truncate leading-tight">
                {theme.name}
              </p>
              {#if selected}
                <span class="shrink-0 text-[9px] bg-indigo-100 text-indigo-700
                  px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wide">
                  Active
                </span>
              {/if}
            </div>
          </button>
        </form>
      {/each}
    </div>
  {/if}
</PanelShell>

<style>
  /* Thumbnail container */
  .theme-thumb {
    height: 64px;
    width: 100%;
    display: flex;
    align-items: flex-end;
    padding: 6px;
  }

  /* Mini card inside thumbnail */
  .thumb-card {
    width: 100%;
    padding: 4px 5px;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .thumb-link-bar {
    display: block;
    height: 3px;
    border-radius: 2px;
    width: 100%;
  }

  .thumb-link-bar.short {
    width: 60%;
  }

  /* Accent dot — top-right corner */
  .thumb-accent {
    position: absolute;
    top: 6px;
    right: 6px;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    opacity: 0.85;
  }

  /* PRO badge */
  .thumb-pro-badge {
    position: absolute;
    top: 5px;
    left: 5px;
    font-size: 8px;
    font-weight: 700;
    letter-spacing: 0.04em;
    background: rgba(0, 0, 0, 0.55);
    color: #fff;
    padding: 1px 4px;
    border-radius: 4px;
    backdrop-filter: blur(2px);
  }

  /* Selected checkmark */
  .thumb-check {
    position: absolute;
    top: 5px;
    right: 5px;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #4f46e5;
    display: flex;
    align-items: center;
    justify-content: center;
  }
</style>
