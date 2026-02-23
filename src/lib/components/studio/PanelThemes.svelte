<script lang="ts">
  import { enhance } from '$app/forms';
  import { invalidateAll, goto } from '$app/navigation';
  import PanelShell from './PanelShell.svelte';
  import { studio } from '$lib/stores/studio.svelte.js';
  import { isGradient } from '$lib/themes.js';
  import { ALL_THEME_TAGS } from '$lib/types.js';
  import type { Theme, Profile, ThemeConfig, ThemeTag } from '$lib/types.js';

  interface Props {
    themes: Theme[];
    profile: Profile;
    isPro: boolean;
  }

  let { themes, profile, isPro }: Props = $props();

  // ── Filters: multi-select ───────────────────────────────────

  const TAG_LABELS: Record<string, string> = {
    // classic
    dark: 'Dark', light: 'Light', gradient: 'Gradient', glass: 'Glass',
    pastel: 'Pastel', neon: 'Neon', minimal: 'Minimal', bold: 'Bold',
    warm: 'Warm', cool: 'Cool', nature: 'Nature', brutalist: 'Brutalist',
    // new
    pill: 'Pill', sharp: 'Sharp', 'soft-shadow': 'Soft Shadow',
    'no-shadow': 'No Shadow', 'high-contrast': 'High Contrast',
    monochrome: 'Mono', 'brand-icons': 'Brand Icons', outline: 'Outline',
    card: 'Card', flat: 'Flat', creator: 'Creator', business: 'Business',
  };

  // Sorted: show tags that exist in the loaded themes first
  const availableTags = $derived(
    ALL_THEME_TAGS.filter((tag) =>
      themes.some((t) => (t.tags ?? []).includes(tag))
    )
  );

  let activeTags = $state<Set<ThemeTag>>(new Set());
  let searchQuery = $state('');
  let sortMode = $state<'popular' | 'alpha'>('popular');

  function toggleTag(tag: ThemeTag) {
    const next = new Set(activeTags);
    if (next.has(tag)) next.delete(tag);
    else next.add(tag);
    activeTags = next;
  }

  function clearFilters() {
    activeTags = new Set();
    searchQuery = '';
  }

  const filteredThemes = $derived(() => {
    let result = themes.filter((t) => {
      const tags = t.tags ?? [];
      const matchesTags =
        activeTags.size === 0 ||
        [...activeTags].every((tag) => tags.includes(tag));
      const matchesSearch =
        !searchQuery ||
        t.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesTags && matchesSearch;
    });

    if (sortMode === 'alpha') {
      result = [...result].sort((a, b) => a.name.localeCompare(b.name));
    } else {
      // popular: free first (selected last), then pro locked
      result = [...result].sort((a, b) => {
        if (a.id === profile.theme_id) return -1;
        if (b.id === profile.theme_id) return 1;
        if (!a.is_pro && b.is_pro) return -1;
        if (a.is_pro && !b.is_pro) return 1;
        return a.name.localeCompare(b.name);
      });
    }
    return result;
  });

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

  const hasActiveFilters = $derived(activeTags.size > 0 || searchQuery.length > 0);
</script>

<PanelShell title="Themes">
  <!-- Search -->
  <div class="mb-3">
    <div class="relative">
      <svg class="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none"
        fill="none" viewBox="0 0 24 24" stroke="currentColor">
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

  <!-- Sort row -->
  <div class="flex items-center justify-between mb-3">
    <div class="flex gap-1 bg-gray-100 rounded-lg p-0.5">
      <button
        onclick={() => (sortMode = 'popular')}
        class="px-2.5 py-1 text-[11px] font-medium rounded-md transition-all
          {sortMode === 'popular' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}"
      >Popular</button>
      <button
        onclick={() => (sortMode = 'alpha')}
        class="px-2.5 py-1 text-[11px] font-medium rounded-md transition-all
          {sortMode === 'alpha' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}"
      >A–Z</button>
    </div>
    {#if hasActiveFilters}
      <button
        onclick={clearFilters}
        class="text-[11px] text-indigo-600 font-medium hover:text-indigo-800"
      >Clear all</button>
    {/if}
  </div>

  <!-- Tag filter chips — scrollable row -->
  <div class="flex gap-1.5 overflow-x-auto pb-1 mb-4 -mx-1 px-1 scrollbar-none">
    {#each availableTags as tag (tag)}
      {@const active = activeTags.has(tag)}
      <button
        onclick={() => toggleTag(tag)}
        class="shrink-0 px-2.5 py-1 text-[11px] rounded-full font-medium transition-all border
          {active
            ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
            : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-100'}"
      >
        {TAG_LABELS[tag] ?? tag}
      </button>
    {/each}
  </div>

  <!-- Theme grid -->
  {#if filteredThemes().length === 0}
    <div class="flex flex-col items-center py-10 text-center">
      <p class="text-sm text-gray-500 mb-2">No themes match your filters.</p>
      <button onclick={clearFilters} class="text-xs text-indigo-600 font-medium hover:text-indigo-800">
        Reset filters
      </button>
    </div>
  {:else}
    <div class="grid grid-cols-2 gap-3">
      {#each filteredThemes() as theme (theme.id)}
        {@const cfg = getCfg(theme)}
        {@const selected = profile.theme_id === theme.id}
        {@const locked = theme.is_pro && !isPro}
        {@const bgIsGrad = isGradient(cfg.bg)}
        {@const hasGlass = cfg.surfaceVariant === 'glass' || cfg.backdropBlur}
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
              {locked ? 'opacity-60' : ''}"
            title={locked ? `${theme.name} — Pro plan required` : theme.name}
          >
            <!-- Thumbnail -->
            <div
              class="theme-thumb relative overflow-hidden"
              style="{bgIsGrad ? `background: ${cfg.bg}` : `background-color: ${cfg.bg}`}"
            >
              <!-- Mini card -->
              <div
                class="thumb-card"
                style="
                  background: {cfg.cardBg};
                  color: {cfg.cardText};
                  border: 1px solid {cfg.cardBorder};
                  border-radius: min(calc({cfg.cardRadius} * 0.5), 10px);
                  {hasGlass && cfg.backdropBlur ? `backdrop-filter: blur(${cfg.backdropBlur});` : ''}
                "
              >
                <!-- Icon slot -->
                {#if cfg.iconStyle === 'brand'}
                  <span class="thumb-brand-dot" style="background: #FF0000;"></span>
                {:else}
                  <span class="thumb-icon" style="background: {cfg.cardText}; opacity:0.5;"></span>
                {/if}
                <div class="thumb-lines">
                  <span class="thumb-link-bar" style="background: {cfg.cardText}; opacity: 0.7;"></span>
                  <span class="thumb-link-bar short" style="background: {cfg.cardText}; opacity: 0.35;"></span>
                </div>
              </div>

              <!-- Accent dot -->
              {#if cfg.accent}
                <div class="thumb-accent" style="background: {cfg.accent};"></div>
              {/if}

              <!-- PRO badge -->
              {#if theme.is_pro && !selected}
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

            <!-- Name + tags -->
            <div class="px-2 pt-1.5 pb-2">
              <div class="flex items-center justify-between gap-1 mb-1">
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
              <!-- Tag chips (show up to 2) -->
              <div class="flex gap-1 flex-wrap">
                {#each (theme.tags ?? []).slice(0, 2) as tag}
                  <span class="text-[9px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium">
                    {TAG_LABELS[tag] ?? tag}
                  </span>
                {/each}
              </div>
            </div>
          </button>
        </form>
      {/each}
    </div>
  {/if}
</PanelShell>

<style>
  .theme-thumb {
    height: 72px;
    width: 100%;
    display: flex;
    align-items: flex-end;
    padding: 6px;
  }

  .thumb-card {
    width: 100%;
    padding: 4px 5px;
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .thumb-icon {
    display: block;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    shrink: 0;
  }

  .thumb-brand-dot {
    display: block;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    shrink: 0;
  }

  .thumb-lines {
    flex: 1;
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

  .thumb-accent {
    position: absolute;
    top: 6px;
    right: 6px;
    width: 7px;
    height: 7px;
    border-radius: 50%;
    opacity: 0.85;
  }

  .thumb-pro-badge {
    position: absolute;
    top: 5px;
    left: 5px;
    font-size: 8px;
    font-weight: 700;
    letter-spacing: 0.04em;
    background: rgba(0, 0, 0, 0.5);
    color: #fff;
    padding: 1px 4px;
    border-radius: 4px;
    backdrop-filter: blur(2px);
  }

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

  .scrollbar-none {
    scrollbar-width: none;
    -ms-overflow-style: none;
  }
  .scrollbar-none::-webkit-scrollbar {
    display: none;
  }
</style>
