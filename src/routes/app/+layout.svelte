<script lang="ts">
  import type { Snippet } from 'svelte';
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import { studio } from '$lib/stores/studio.svelte.js';
  import BottomNav from '$lib/components/studio/BottomNav.svelte';

  interface Props {
    data: import('./$types.js').LayoutServerData;
    children: Snippet;
  }

  let { data, children }: Props = $props();

  const isOnboarding = $derived(
    page.url.pathname.startsWith('/app/onboarding'),
  );

  const isStudioPage = $derived(page.url.pathname === '/app');

  // Sync bottom tab with route (for non-studio routes)
  $effect(() => {
    const path = page.url.pathname;
    if (path === '/app/analytics') studio.setTab('analytics');
    else if (path === '/app/billing') studio.setTab('billing');
    else if (path === '/app/settings') studio.setTab('settings');
  });

  async function signOut() {
    await fetch('/auth/signout', { method: 'POST' });
    goto('/');
  }
</script>

{#if isOnboarding}
  {@render children()}
{:else}
  <div class="h-screen flex flex-col bg-gray-50 overflow-hidden">
    <!-- Top bar -->
    <header
      class="bg-white border-b border-gray-200 px-4 py-2.5 shrink-0 z-30"
    >
      <div class="flex items-center justify-between">
        <a href="/app" class="text-lg font-bold text-gray-900"> Lnksy </a>
        <div class="flex items-center gap-3">
          {#if data.profile}
            <a
              href="/{data.profile.handle}"
              target="_blank"
              class="text-xs text-gray-500 hover:text-indigo-600
                hidden sm:block transition-colors"
            >
              lnksy.com/{data.profile.handle}
            </a>
          {/if}
          <button
            onclick={signOut}
            class="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>

    <!-- Main content area -->
    <main
      class="flex-1 min-h-0 overflow-hidden
        {isStudioPage ? '' : 'overflow-y-auto'}"
    >
      {#if isStudioPage}
        <!-- Studio page gets full control of its space -->
        {@render children()}
      {:else}
        <!-- Other pages get standard padding -->
        <div class="max-w-4xl mx-auto p-4 md:p-6 pb-20">
          {@render children()}
        </div>
      {/if}
    </main>

    <!-- Bottom navigation -->
    <BottomNav />
  </div>
{/if}
