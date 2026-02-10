<script lang="ts">
  import type { Snippet } from 'svelte';
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import { createClient } from '$lib/supabase.js';

  interface Props {
    data: import('./$types.js').LayoutServerData;
    children: Snippet;
  }

  let { data, children }: Props = $props();

  const isOnboarding = $derived(
    page.url.pathname.startsWith('/app/onboarding')
  );

  const navItems = [
    { href: '/app', label: 'Editor', icon: 'edit' },
    { href: '/app/appearance', label: 'Appearance', icon: 'palette' },
    { href: '/app/analytics', label: 'Analytics', icon: 'chart' },
    { href: '/app/billing', label: 'Billing', icon: 'card' },
    { href: '/app/settings', label: 'Settings', icon: 'settings' },
  ];

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    goto('/');
  }
</script>

{#if isOnboarding}
  {@render children()}
{:else}
  <div class="min-h-screen bg-gray-50">
    <!-- Top bar -->
    <header class="bg-white border-b border-gray-200 px-4 py-3">
      <div class="max-w-7xl mx-auto flex items-center justify-between">
        <a href="/app" class="text-lg font-bold text-gray-900">
          Lnksy
        </a>
        <div class="flex items-center gap-3">
          {#if data.profile}
            <a
              href="/{data.profile.handle}"
              target="_blank"
              class="text-xs text-gray-500 hover:text-indigo-600
                hidden md:block"
            >
              lnksy.com/{data.profile.handle}
            </a>
          {/if}
          <button
            onclick={signOut}
            class="text-sm text-gray-500 hover:text-gray-700"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>

    <!-- Mobile bottom nav -->
    <nav class="fixed bottom-0 left-0 right-0 bg-white border-t
      border-gray-200 z-40 md:hidden">
      <div class="flex justify-around py-2">
        {#each navItems as item}
          {@const active = page.url.pathname === item.href}
          <a
            href={item.href}
            class="flex flex-col items-center gap-0.5 px-2 py-1
              text-xs {active
              ? 'text-indigo-600'
              : 'text-gray-500'}"
          >
            {#if item.icon === 'edit'}
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24"
                stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round"
                  stroke-width="2"
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0
                     002 2h11a2 2 0 002-2v-5m-1.414-9.414a2
                     2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            {:else if item.icon === 'palette'}
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24"
                stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round"
                  stroke-width="2"
                  d="M7 21a4 4 0 01-4-4V5a2 2 0
                     012-2h4a2 2 0 012 2v12a4
                     4 0 01-4 4zm0 0h12a2 2 0
                     002-2v-4a2 2 0 00-2-2h-2.343" />
              </svg>
            {:else if item.icon === 'chart'}
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24"
                stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0
                     00-2 2v6a2 2 0 002 2h2a2 2 0
                     002-2zm0 0V9a2 2 0 012-2h2a2
                     2 0 012 2v10m-6 0a2 2 0 002
                     2h2a2 2 0 002-2m0 0V5a2 2 0
                     012-2h2a2 2 0 012 2v14a2 2 0
                     01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            {:else if item.icon === 'card'}
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24"
                stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round"
                  stroke-width="2"
                  d="M3 10h18M7 15h1m4 0h1m-7
                     4h12a3 3 0 003-3V8a3 3 0
                     00-3-3H6a3 3 0 00-3 3v8a3 3
                     0 003 3z" />
              </svg>
            {:else}
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24"
                stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round"
                  stroke-width="2"
                  d="M10.325 4.317c.426-1.756
                     2.924-1.756 3.35 0a1.724 1.724 0
                     002.573 1.066c1.543-.94 3.31.826
                     2.37 2.37a1.724 1.724 0 001.065
                     2.572c1.756.426 1.756 2.924 0
                     3.35a1.724 1.724 0 00-1.066
                     2.573c.94 1.543-.826 3.31-2.37
                     2.37a1.724 1.724 0 00-2.572
                     1.065c-.426 1.756-2.924 1.756-3.35
                     0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724
                     1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924
                     0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31
                     2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path stroke-linecap="round" stroke-linejoin="round"
                  stroke-width="2"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            {/if}
            <span>{item.label}</span>
          </a>
        {/each}
      </div>
    </nav>

    <!-- Desktop sidebar + content -->
    <div class="max-w-7xl mx-auto flex">
      <!-- Desktop sidebar -->
      <aside class="hidden md:block w-56 shrink-0 border-r
        border-gray-200 bg-white min-h-[calc(100vh-57px)]">
        <nav class="p-4 space-y-1">
          {#each navItems as item}
            {@const active = page.url.pathname === item.href}
            <a
              href={item.href}
              class="flex items-center gap-3 px-3 py-2 rounded-lg
                text-sm font-medium transition-colors
                {active
                ? 'bg-indigo-50 text-indigo-700'
                : 'text-gray-600 hover:bg-gray-50'}"
            >
              {item.label}
            </a>
          {/each}
        </nav>
      </aside>

      <!-- Main content -->
      <main class="flex-1 p-4 md:p-6 pb-20 md:pb-6 min-h-[calc(100vh-57px)]">
        {@render children()}
      </main>
    </div>
  </div>
{/if}
