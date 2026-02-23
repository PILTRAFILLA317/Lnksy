<script lang="ts">
  import { studio, type EditorPanel, PANEL_LABELS } from '$lib/stores/studio.svelte.js';

  interface Props {
    /** 'desktop' = vertical rail, 'mobile' = horizontal chips */
    variant: 'desktop' | 'mobile';
  }

  let { variant }: Props = $props();

  type RailItem = {
    id: NonNullable<EditorPanel>;
    icon: string;
  };

  const editorItems: RailItem[] = [
    { id: 'components', icon: 'components' },
    { id: 'header', icon: 'header' },
    { id: 'title', icon: 'title' },
    { id: 'contacts', icon: 'contacts' },
  ];

  const appearanceItems: RailItem[] = [
    { id: 'theme', icon: 'appearance' },
    { id: 'background', icon: 'background' },
    { id: 'customize', icon: 'customize' },
    { id: 'fonts', icon: 'fonts' },
    { id: 'branding', icon: 'branding' },
  ];

  const items = $derived(
    studio.activeTab === 'editor'
      ? editorItems
      : studio.activeTab === 'appearance'
        ? appearanceItems
        : [],
  );
</script>

{#snippet railIcon(icon: string)}
  {#if icon === 'appearance'}
    <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24"
      stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round"
        d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c.55 0 1-.45 1-1v-.5c0-.28-.11-.53-.29-.71-.17-.17-.29-.42-.29-.71
           0-.55.45-1 1-1h1.5c2.76 0 5-2.24 5-5 0-4.42-4.03-8-9-8z" />
      <circle cx="6.5" cy="11.5" r="1.5" fill="currentColor" stroke="none"/>
      <circle cx="9.5" cy="7.5" r="1.5" fill="currentColor" stroke="none"/>
      <circle cx="14.5" cy="7.5" r="1.5" fill="currentColor" stroke="none"/>
      <circle cx="17.5" cy="11.5" r="1.5" fill="currentColor" stroke="none"/>
    </svg>
  {:else if icon === 'components'}
    <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24"
      stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round"
        d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0
           01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0
           01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0
           012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0
           012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  {:else if icon === 'header'}
    <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24"
      stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round"
        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2
           2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0
           002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2
           2 0 002 2z" />
    </svg>
  {:else if icon === 'title'}
    <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24"
      stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round"
        d="M4 6h16M4 12h16M4 18h7" />
    </svg>
  {:else if icon === 'contacts'}
    <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24"
      stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round"
        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10
           0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3
           3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0
           0a5.002 5.002 0 019.288 0M15 7a3 3 0
           11-6 0 3 3 0 016 0zm6 3a2 2 0
           11-4 0 2 2 0 014 0zM7 10a2 2 0
           11-4 0 2 2 0 014 0z" />
    </svg>
  {:else if icon === 'themes'}
    <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24"
      stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round"
        d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0
           012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0
           002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2
           2 0 012.828 0l2.829 2.829a2 2 0 010
           2.828l-8.486 8.485M7 17h.01" />
    </svg>
  {:else if icon === 'layout'}
    <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24"
      stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round"
        d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0
           01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0
           011-1h6a1 1 0 011 1v6a1 1 0
           01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0
           011-1h2a1 1 0 011 1v6a1 1 0
           01-1 1h-2a1 1 0 01-1-1v-6z" />
    </svg>
  {:else if icon === 'background'}
    <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24"
      stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round"
        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  {:else if icon === 'customize'}
    <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24"
      stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round"
        d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
    </svg>
  {:else if icon === 'fonts'}
    <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24"
      stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round"
        d="M4 7V4h16v3M9 20h6M12 4v16" />
    </svg>
  {:else if icon === 'colors'}
    <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24"
      stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round"
        d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0
           0012 21a9.003 9.003 0 008.354-5.646z" />
    </svg>
  {:else if icon === 'branding'}
    <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24"
      stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round"
        d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7
           7a2 2 0 010 2.828l-7 7a2 2 0
           01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4
           4 0 014-4z" />
    </svg>
  {/if}
{/snippet}

{#if items.length > 0}
  {#if variant === 'desktop'}
    <!-- Desktop vertical rail -->
    <div
      class="flex flex-col gap-1 p-2 bg-white border-r
        border-gray-200 w-[56px] shrink-0"
      role="toolbar"
      aria-label="Editor tools"
      aria-orientation="vertical"
    >
      {#each items as item (item.id)}
        {@const active = studio.openPanel === item.id}
        <button
          onclick={() => studio.togglePanel(item.id)}
          class="w-11 h-11 flex items-center justify-center rounded-xl
            transition-all relative group
            {active
              ? 'bg-indigo-100 text-indigo-700 ring-2 ring-indigo-200'
              : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'}"
          aria-label={PANEL_LABELS[item.id]}
          aria-pressed={active}
        >
          {@render railIcon(item.icon)}

          <!-- Tooltip -->
          <span
            class="absolute left-full ml-2 px-2 py-1 text-xs font-medium
              bg-gray-900 text-white rounded-md opacity-0
              group-hover:opacity-100 pointer-events-none transition-opacity
              whitespace-nowrap z-50 shadow-lg"
          >
            {PANEL_LABELS[item.id]}
          </span>
        </button>
      {/each}
    </div>
  {:else}
    <!-- Mobile horizontal chip strip -->
    <div
      class="flex gap-2 px-3 py-2 overflow-x-auto scrollbar-hide
        bg-white border-b border-gray-100 shrink-0"
      role="toolbar"
      aria-label="Editor tools"
    >
      {#each items as item (item.id)}
        {@const active = studio.openPanel === item.id}
        <button
          onclick={() => studio.togglePanel(item.id)}
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-full
            text-xs font-medium whitespace-nowrap shrink-0
            transition-all min-h-[36px]
            {active
              ? 'bg-indigo-100 text-indigo-700 ring-1 ring-indigo-200'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}"
          aria-pressed={active}
        >
          {PANEL_LABELS[item.id]}
        </button>
      {/each}
    </div>
  {/if}
{/if}
