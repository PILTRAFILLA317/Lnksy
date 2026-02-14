<script lang="ts">
  import type { Link, MainLinksLayout, ThemeConfig } from '$lib/types.js';
  import { detectPlatform } from '$lib/utils/platform.js';
  import PlatformBadge from './PlatformBadge.svelte';

  interface Props {
    links: Link[];
    layout: MainLinksLayout;
    themeConfig: ThemeConfig;
  }

  let { links, layout, themeConfig }: Props = $props();

  const tc = $derived(themeConfig);
  const variant = $derived(tc.buttonVariant);
</script>

{#if links.length === 0}
  <!-- nothing -->
{:else if layout === 'GRID_ICON'}
  <!-- 4.2 Grid 2-col with icon + title -->
  <div class="w-full mt-3 mb-3 px-4 grid grid-cols-2 gap-3">
    {#each links as link (link.id)}
      {@const platform = link.platform ?? detectPlatform(link.url)}
      <a
        href={link.url}
        target="_blank"
        rel="noopener noreferrer"
        data-link-id={link.id}
        class="flex flex-col items-center justify-center py-4 px-3
          text-center transition-all hover:scale-[1.02]
          active:scale-[0.98] min-h-[88px]
          {link.highlight ? 'ring-2 ring-offset-2 ring-yellow-400' : ''}"
        style="
          background: {variant === 'outline' ? 'transparent' : tc.cardBg};
          color: {tc.cardText};
          border: 1px solid {variant === 'outline' ? tc.cardText : tc.cardBorder};
          border-radius: {tc.cardRadius};
          {tc.backdropBlur ? `backdrop-filter: blur(${tc.backdropBlur});` : ''}
        "
      >
        {#if platform}
          <PlatformBadge {platform} size={20} color={tc.cardText} />
          <span class="text-xs font-medium mt-2 line-clamp-2">
            {link.title}
          </span>
        {:else}
          <span class="text-sm font-medium line-clamp-2">
            {link.title}
          </span>
        {/if}
      </a>
    {/each}
  </div>

{:else if layout === 'GRID_IMAGE'}
  <!-- 4.3 Grid 2-col with image + badge + title (PRO) -->
  <div class="w-full mt-3 mb-3 px-4 grid grid-cols-2 gap-3">
    {#each links as link (link.id)}
      {@const platform = link.platform ?? detectPlatform(link.url)}
      <a
        href={link.url}
        target="_blank"
        rel="noopener noreferrer"
        data-link-id={link.id}
        class="relative overflow-hidden transition-all
          hover:scale-[1.02] active:scale-[0.98]
          {link.highlight ? 'ring-2 ring-offset-2 ring-yellow-400' : ''}"
        style="border-radius: {tc.cardRadius};"
      >
        <!-- Image -->
        <div class="aspect-square bg-white/5">
          {#if link.image_url}
            <img
              src={link.image_url}
              alt={link.title}
              loading="lazy"
              class="w-full h-full object-cover"
            />
          {:else}
            <div
              class="w-full h-full flex items-center justify-center"
              style="background: {tc.cardBg};"
            >
              {#if platform}
                <PlatformBadge {platform} size={32} color={tc.cardText} />
              {:else}
                <span class="text-lg font-bold opacity-30"
                  style="color: {tc.cardText}">
                  {link.title[0]?.toUpperCase()}
                </span>
              {/if}
            </div>
          {/if}
        </div>
        <!-- Badge -->
        {#if platform && link.image_url}
          <div
            class="absolute bottom-10 left-2 w-6 h-6 rounded-full
              flex items-center justify-center shadow-md"
            style="background: {tc.cardBg};"
          >
            <PlatformBadge {platform} size={14} color={tc.cardText} />
          </div>
        {/if}
        <!-- Title overlay -->
        <div
          class="px-2 py-2 text-xs font-medium line-clamp-1"
          style="background: {tc.cardBg}; color: {tc.cardText};"
        >
          {link.title}
        </div>
      </a>
    {/each}
  </div>

{:else if layout === 'LIST_IMAGE'}
  <!-- 4.4 List full-width with image + badge + title (PRO) -->
  <div class="w-full mt-3 mb-3 px-4 space-y-3">
    {#each links as link (link.id)}
      {@const platform = link.platform ?? detectPlatform(link.url)}
      <a
        href={link.url}
        target="_blank"
        rel="noopener noreferrer"
        data-link-id={link.id}
        class="relative flex items-center gap-3 overflow-hidden
          transition-all hover:scale-[1.02] active:scale-[0.98]
          min-h-[72px]
          {link.highlight ? 'ring-2 ring-offset-2 ring-yellow-400' : ''}"
        style="
          background: {variant === 'outline' ? 'transparent' : tc.cardBg};
          color: {tc.cardText};
          border: 1px solid {variant === 'outline' ? tc.cardText : tc.cardBorder};
          border-radius: {tc.cardRadius};
          {tc.backdropBlur ? `backdrop-filter: blur(${tc.backdropBlur});` : ''}
        "
      >
        <!-- Thumbnail -->
        <div class="w-16 h-16 shrink-0 overflow-hidden"
          style="border-radius: {tc.cardRadius};">
          {#if link.image_url}
            <img
              src={link.image_url}
              alt={link.title}
              loading="lazy"
              class="w-full h-full object-cover"
            />
          {:else}
            <div
              class="w-full h-full flex items-center justify-center"
              style="background: rgba(255,255,255,0.05);"
            >
              {#if platform}
                <PlatformBadge {platform} size={22} color={tc.cardText} />
              {/if}
            </div>
          {/if}
        </div>
        <!-- Badge -->
        {#if platform && link.image_url}
          <div
            class="absolute bottom-1.5 left-1.5 w-5 h-5 rounded-full
              flex items-center justify-center shadow-sm"
            style="background: {tc.cardBg};"
          >
            <PlatformBadge {platform} size={12} color={tc.cardText} />
          </div>
        {/if}
        <!-- Text -->
        <div class="flex-1 min-w-0 py-3 pr-4">
          <span class="text-sm font-medium line-clamp-1">
            {link.title}
          </span>
          {#if link.subtitle}
            <span class="block text-xs opacity-60 mt-0.5 line-clamp-1">
              {link.subtitle}
            </span>
          {/if}
        </div>
      </a>
    {/each}
  </div>

{:else}
  <!-- 4.1 LIST_ICON — default column full-width cards -->
  <div class="w-full mt-3 mb-3 px-4 space-y-3">
    {#each links as link (link.id)}
      {@const platform = link.platform ?? detectPlatform(link.url)}
      <a
        href={link.url}
        target="_blank"
        rel="noopener noreferrer"
        data-link-id={link.id}
        class="flex items-center justify-center gap-3 w-full
          text-center py-3.5 px-4 font-medium min-h-[48px]
          transition-all hover:scale-[1.02] active:scale-[0.98]
          {link.highlight ? 'ring-2 ring-offset-2 ring-yellow-400' : ''}"
        style="
          background: {variant === 'outline' ? 'transparent' : tc.cardBg};
          color: {tc.cardText};
          border: 1px solid {variant === 'outline' ? tc.cardText : tc.cardBorder};
          border-radius: {tc.cardRadius};
          {tc.backdropBlur ? `backdrop-filter: blur(${tc.backdropBlur});` : ''}
        "
      >
        {#if platform}
          <PlatformBadge {platform} size={18} color={tc.cardText} />
        {/if}
        <span class="text-sm">{link.title}</span>
        {#if link.subtitle}
          <span class="text-xs opacity-60 ml-1">{link.subtitle}</span>
        {/if}
      </a>
    {/each}
  </div>
{/if}
