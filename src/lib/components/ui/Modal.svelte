<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    open: boolean;
    onclose: () => void;
    title?: string;
    children: Snippet;
  }

  let { open, onclose, title, children }: Props = $props();

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') onclose();
  }
</script>

{#if open}
  <div
    class="fixed inset-0 z-50 flex items-end md:items-center
      justify-center"
    role="dialog"
    aria-modal="true"
  >
    <button
      class="fixed inset-0 bg-black/50 cursor-default"
      onclick={onclose}
      onkeydown={handleKeydown}
      aria-label="Close modal"
      tabindex="-1"
    ></button>
    <div
      class="relative w-full max-w-lg bg-white rounded-t-2xl
        md:rounded-2xl p-6 shadow-xl max-h-[90vh] overflow-y-auto"
    >
      {#if title}
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold text-gray-900">
            {title}
          </h2>
          <button
            onclick={onclose}
            class="text-gray-400 hover:text-gray-600 p-1"
            aria-label="Close"
          >
            <svg
              class="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      {/if}
      {@render children()}
    </div>
  </div>
{/if}
