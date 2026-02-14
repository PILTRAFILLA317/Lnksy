<script lang="ts">
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import { studio, type BottomTab } from '$lib/stores/studio.svelte.js';

  const tabs: { id: BottomTab; label: string; route?: string }[] = [
    { id: 'editor', label: 'Editor' },
    { id: 'appearance', label: 'Appearance' },
    { id: 'analytics', label: 'Analytics', route: '/app/analytics' },
    { id: 'billing', label: 'Billing', route: '/app/billing' },
    { id: 'settings', label: 'Settings', route: '/app/settings' },
  ];

  function isActive(tab: (typeof tabs)[0]): boolean {
    if (tab.route) return page.url.pathname === tab.route;
    return studio.activeTab === tab.id && page.url.pathname === '/app';
  }

  function handleClick(tab: (typeof tabs)[0]) {
    if (tab.route) {
      goto(tab.route);
    } else {
      if (page.url.pathname !== '/app') {
        goto('/app');
      }
      studio.setTab(tab.id);
    }
  }
</script>

{#snippet tabIcon(id: BottomTab)}
  {#if id === 'editor'}
    <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24"
      stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round"
        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0
           002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828
           15H9v-2.828l8.586-8.586z" />
    </svg>
  {:else if id === 'appearance'}
    <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24"
      stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round"
        d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0
           012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0
           002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2
           2 0 012.828 0l2.829 2.829a2 2 0 010
           2.828l-8.486 8.485M7 17h.01" />
    </svg>
  {:else if id === 'analytics'}
    <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24"
      stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round"
        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2
           0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2
           2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0
           002-2m0 0V5a2 2 0 012-2h2a2 2 0 012
           2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  {:else if id === 'billing'}
    <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24"
      stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round"
        d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0
           003-3V8a3 3 0 00-3-3H6a3 3 0 00-3
           3v8a3 3 0 003 3z" />
    </svg>
  {:else}
    <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24"
      stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round"
        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724
           1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37
           2.37a1.724 1.724 0 001.065 2.572c1.756.426
           1.756 2.924 0 3.35a1.724 1.724 0 00-1.066
           2.573c.94 1.543-.826 3.31-2.37 2.37a1.724
           1.724 0 00-2.572 1.065c-.426 1.756-2.924
           1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724
           1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924
           0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31
           2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path stroke-linecap="round" stroke-linejoin="round"
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  {/if}
{/snippet}

<!-- Mobile: full-width bar at the bottom -->
<nav
  class="lg:hidden flex items-center justify-around bg-white/80
    backdrop-blur-lg border-t border-gray-200/80 shrink-0"
  style="padding-bottom: env(safe-area-inset-bottom, 0px);"
  role="tablist"
  aria-label="Main navigation"
>
  {#each tabs as tab (tab.id)}
    {@const active = isActive(tab)}
    <button
      role="tab"
      aria-selected={active}
      onclick={() => handleClick(tab)}
      class="flex flex-col items-center gap-0.5 px-2 py-2.5 min-w-[56px]
        min-h-[48px] text-[11px] font-medium transition-colors
        focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500
        focus-visible:ring-offset-2 rounded-lg
        {active ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600'}"
    >
      {@render tabIcon(tab.id)}
      <span>{tab.label}</span>
    </button>
  {/each}
</nav>

<!-- Desktop: floating centered pill -->
<div class="hidden lg:flex justify-center pb-3 pt-1 shrink-0">
  <nav
    class="flex items-center gap-1 bg-white/90 backdrop-blur-lg
      border border-gray-200/80 rounded-2xl px-2 py-1.5
      shadow-lg shadow-black/5"
    role="tablist"
    aria-label="Main navigation"
  >
    {#each tabs as tab (tab.id)}
      {@const active = isActive(tab)}
      <button
        role="tab"
        aria-selected={active}
        onclick={() => handleClick(tab)}
        class="flex items-center gap-2 px-4 py-2 text-sm font-medium
          rounded-xl transition-all min-h-[40px]
          focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500
          {active
            ? 'bg-indigo-50 text-indigo-700'
            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}"
      >
        {@render tabIcon(tab.id)}
        <span>{tab.label}</span>
      </button>
    {/each}
  </nav>
</div>
