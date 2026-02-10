<script lang="ts">
  import type { Link } from '$lib/types.js';

  interface Props {
    link: Link;
    editable?: boolean;
    onEdit?: () => void;
    onToggle?: () => void;
    onDelete?: () => void;
    onDuplicate?: () => void;
    themeConfig?: {
      cardBg: string;
      cardText: string;
      cardBorder: string;
      cardRadius: string;
      buttonVariant: string;
      backdropBlur?: string;
    };
  }

  let {
    link,
    editable = false,
    onEdit,
    onToggle,
    onDelete,
    onDuplicate,
    themeConfig,
  }: Props = $props();
</script>

{#if editable}
  <!-- Editor mode -->
  <div
    class="group flex items-center gap-3 p-3 rounded-xl border
      border-gray-200 bg-white hover:border-gray-300 transition-colors
      {link.is_active ? '' : 'opacity-50'}"
  >
    <button
      class="cursor-grab text-gray-400 hover:text-gray-600
        touch-none shrink-0"
      aria-label="Drag to reorder"
    >
      <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24"
        stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round"
          stroke-width="2"
          d="M4 8h16M4 16h16" />
      </svg>
    </button>

    <div class="flex-1 min-w-0">
      <p class="text-sm font-medium text-gray-900 truncate">
        {link.title}
      </p>
      <p class="text-xs text-gray-500 truncate">{link.url}</p>
    </div>

    <div class="flex items-center gap-1">
      <button
        onclick={onToggle}
        class="p-1.5 rounded-lg hover:bg-gray-100"
        aria-label={link.is_active ? 'Disable link' : 'Enable link'}
      >
        <div
          class="w-8 h-5 rounded-full transition-colors flex
            items-center px-0.5
            {link.is_active ? 'bg-indigo-600' : 'bg-gray-300'}"
        >
          <div
            class="w-4 h-4 rounded-full bg-white transition-transform
              {link.is_active ? 'translate-x-3' : 'translate-x-0'}"
          ></div>
        </div>
      </button>

      <button
        onclick={onEdit}
        class="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
        aria-label="Edit link"
      >
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24"
          stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round"
            stroke-width="2"
            d="M11 5H6a2 2 0 00-2 2v11a2 2 0
               002 2h11a2 2 0 002-2v-5m-1.414-9.414a2
               2 0 112.828 2.828L11.828
               15H9v-2.828l8.586-8.586z" />
        </svg>
      </button>

      <button
        onclick={onDuplicate}
        class="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
        aria-label="Duplicate link"
      >
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24"
          stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round"
            stroke-width="2"
            d="M8 16H6a2 2 0 01-2-2V6a2 2 0
               012-2h8a2 2 0 012 2v2m-6
               12h8a2 2 0 002-2v-8a2 2 0
               00-2-2h-8a2 2 0 00-2 2v8a2
               2 0 002 2z" />
        </svg>
      </button>

      <button
        onclick={onDelete}
        class="p-1.5 rounded-lg hover:bg-red-50 text-gray-500
          hover:text-red-600"
        aria-label="Delete link"
      >
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24"
          stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round"
            stroke-width="2"
            d="M19 7l-.867 12.142A2 2 0
               0116.138 21H7.862a2 2 0
               01-1.995-1.858L5 7m5
               4v6m4-6v6m1-10V4a1 1 0
               00-1-1h-4a1 1 0 00-1
               1v3M4 7h16" />
        </svg>
      </button>
    </div>
  </div>
{:else}
  <!-- Public mode -->
  {@const bg = themeConfig?.cardBg ?? '#f3f4f6'}
  {@const text = themeConfig?.cardText ?? '#1a1a1a'}
  {@const border = themeConfig?.cardBorder ?? 'transparent'}
  {@const radius = themeConfig?.cardRadius ?? '12px'}
  {@const variant = themeConfig?.buttonVariant ?? 'filled'}
  {@const blur = themeConfig?.backdropBlur}
  <a
    href={link.url}
    target="_blank"
    rel="noopener noreferrer"
    data-link-id={link.id}
    class="block w-full text-center py-3.5 px-4 font-medium
      transition-all hover:scale-[1.02] active:scale-[0.98]
      {link.highlight ? 'ring-2 ring-offset-2 ring-yellow-400' : ''}"
    style="
      background: {variant === 'outline' ? 'transparent' : bg};
      color: {text};
      border: 1px solid {variant === 'outline' ? text : border};
      border-radius: {radius};
      {blur ? `backdrop-filter: blur(${blur});` : ''}
    "
  >
    <span class="text-sm">{link.title}</span>
    {#if link.subtitle}
      <span class="block text-xs opacity-70 mt-0.5">
        {link.subtitle}
      </span>
    {/if}
  </a>
{/if}
