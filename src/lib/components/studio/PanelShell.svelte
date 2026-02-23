<script lang="ts">
  import type { Snippet } from 'svelte';
  import { studio } from '$lib/stores/studio.svelte.js';

  interface Props {
    title: string;
    children: Snippet;
    footer?: Snippet;
  }

  let { title, children, footer }: Props = $props();

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      e.preventDefault();
      studio.closePanel();
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<div
  class="flex flex-col flex-1 min-h-0 overflow-hidden"
  role="dialog"
  aria-label={title}
>
  <!-- Header -->
  <div class="flex items-center justify-between px-4 py-3
    border-b border-gray-200 shrink-0">
    <!-- Drag handle (mobile only) -->
    <div class="absolute top-2 left-1/2 -translate-x-1/2 w-8 h-1
      rounded-full bg-gray-300 lg:hidden"></div>
    <h2 class="text-sm font-semibold text-gray-900">{title}</h2>
    <button
      onclick={() => studio.closePanel()}
      class="w-8 h-8 flex items-center justify-center rounded-lg
        hover:bg-gray-100 text-gray-500 transition-colors
        focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
      aria-label="Close panel"
    >
      <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
          d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  </div>

  <!-- Scrollable content -->
  <div class="flex-1 min-h-0 overflow-y-auto px-4 py-4 overscroll-contain">
    {@render children()}
  </div>

  <!-- Optional footer -->
  {#if footer}
    <div class="px-4 py-3 border-t border-gray-200 shrink-0">
      {@render footer()}
    </div>
  {/if}
</div>
