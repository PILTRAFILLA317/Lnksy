<script lang="ts">
  import { goto } from '$app/navigation';
  import Button from '$lib/components/ui/Button.svelte';
  import { validateHandle } from '$lib/utils/handle.js';
  import { debounce } from '$lib/utils/helpers.js';

  let { data } = $props();

  let handle = $state('');
  let error = $state('');
  let checking = $state(false);
  let available = $state<boolean | null>(null);

  const checkAvailability = debounce(async (h: string) => {
    const validation = validateHandle(h);
    if (!validation.valid) {
      error = validation.error!;
      available = null;
      checking = false;
      return;
    }

    checking = true;
    error = '';

    try {
      const res = await fetch(
        `/api/handle/check?handle=${encodeURIComponent(h)}`
      );
      const json = await res.json();
      available = json.available;
      if (!json.available) {
        error = 'This handle is taken';
      }
    } catch {
      error = 'Error checking availability';
    } finally {
      checking = false;
    }
  }, 300);

  function onInput(e: Event) {
    const input = e.target as HTMLInputElement;
    handle = input.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
    available = null;
    error = '';

    if (handle.length > 0) {
      checkAvailability(handle);
    }
  }

  function handleStart() {
    const validation = validateHandle(handle);
    if (!validation.valid || !available) return;

    if (data.user) {
      goto(`/app/onboarding/confirm?handle=${handle}`);
    } else {
      goto(`/auth?handle=${handle}`);
    }
  }
</script>

<svelte:head>
  <title>Lnksy — Your links, your style</title>
  <meta
    name="description"
    content="Create a beautiful link-in-bio page in seconds. Share all your links with one URL."
  />
</svelte:head>

<div class="min-h-screen bg-white">
  <!-- Nav -->
  <nav class="px-4 py-4 md:px-8">
    <div class="max-w-6xl mx-auto flex items-center justify-between">
      <a href="/" class="text-xl font-bold text-gray-900">
        Lnksy
      </a>
      <div class="flex items-center gap-3">
        {#if data.user}
          <Button
            variant="primary"
            size="sm"
            onclick={() => goto('/app')}
          >
            Dashboard
          </Button>
        {:else}
          <Button
            variant="ghost"
            size="sm"
            onclick={() => goto('/auth')}
          >
            Sign in
          </Button>
          <Button
            variant="primary"
            size="sm"
            onclick={() => goto('/auth')}
          >
            Get started
          </Button>
        {/if}
      </div>
    </div>
  </nav>

  <!-- Hero -->
  <main class="px-4 md:px-8">
    <div class="max-w-2xl mx-auto pt-16 pb-24 md:pt-28 md:pb-32
      text-center">
      <h1 class="text-4xl md:text-6xl font-bold text-gray-900
        tracking-tight leading-tight">
        Your links,<br />your style.
      </h1>
      <p class="mt-4 text-lg md:text-xl text-gray-600 max-w-md
        mx-auto">
        Create a beautiful link-in-bio page in seconds. Share
        everything with one URL.
      </p>

      <!-- Handle input -->
      <div class="mt-10 max-w-md mx-auto">
        <div class="flex rounded-xl border border-gray-300
          focus-within:ring-2 focus-within:ring-indigo-500
          focus-within:border-indigo-500 transition-all
          overflow-hidden bg-white">
          <span class="inline-flex items-center pl-4 pr-1 text-gray-400
            text-sm font-medium whitespace-nowrap select-none">
            lnksy.com/
          </span>
          <input
            type="text"
            value={handle}
            oninput={onInput}
            placeholder="tu-nombre"
            maxlength="24"
            class="flex-1 py-3 pr-4 text-sm text-gray-900
              placeholder-gray-400 focus:outline-none bg-transparent"
          />
        </div>

        <!-- Validation feedback -->
        <div class="h-6 mt-2 text-sm">
          {#if checking}
            <span class="text-gray-400">Checking...</span>
          {:else if error}
            <span class="text-red-500">{error}</span>
          {:else if available === true}
            <span class="text-green-600">Available!</span>
          {/if}
        </div>

        <p class="text-xs text-gray-400 mb-4">
          This name cannot be changed later.
        </p>

        <Button
          variant="primary"
          size="lg"
          class="w-full"
          disabled={!available || checking}
          onclick={handleStart}
        >
          Get started
        </Button>
      </div>
    </div>

    <!-- Features -->
    <div class="max-w-5xl mx-auto pb-24">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="p-6 rounded-2xl bg-gray-50">
          <div class="w-10 h-10 rounded-xl bg-indigo-100
            flex items-center justify-center mb-4">
            <svg class="w-5 h-5 text-indigo-600" fill="none"
              viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round"
                stroke-width="2"
                d="M13.828 10.172a4 4 0 00-5.656 0l-4
                   4a4 4 0 105.656 5.656l1.102-1.101" />
              <path stroke-linecap="round" stroke-linejoin="round"
                stroke-width="2"
                d="M10.172 13.828a4 4 0 005.656 0l4-4a4
                   4 0 00-5.656-5.656l-1.102 1.101" />
            </svg>
          </div>
          <h3 class="font-semibold text-gray-900">
            Unlimited links
          </h3>
          <p class="mt-1 text-sm text-gray-600">
            Add all your links in one place. Social, shop, music —
            everything.
          </p>
        </div>

        <div class="p-6 rounded-2xl bg-gray-50">
          <div class="w-10 h-10 rounded-xl bg-indigo-100
            flex items-center justify-center mb-4">
            <svg class="w-5 h-5 text-indigo-600" fill="none"
              viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round"
                stroke-width="2"
                d="M7 21a4 4 0 01-4-4V5a2 2 0
                   012-2h4a2 2 0 012 2v12a4 4
                   0 01-4 4zm0 0h12a2 2 0
                   002-2v-4a2 2 0 00-2-2h-2.343" />
            </svg>
          </div>
          <h3 class="font-semibold text-gray-900">
            Beautiful themes
          </h3>
          <p class="mt-1 text-sm text-gray-600">
            Pick from curated themes or customize every detail with
            Pro.
          </p>
        </div>

        <div class="p-6 rounded-2xl bg-gray-50">
          <div class="w-10 h-10 rounded-xl bg-indigo-100
            flex items-center justify-center mb-4">
            <svg class="w-5 h-5 text-indigo-600" fill="none"
              viewBox="0 0 24 24" stroke="currentColor">
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
          </div>
          <h3 class="font-semibold text-gray-900">Analytics</h3>
          <p class="mt-1 text-sm text-gray-600">
            Track views, clicks, and know which links perform best.
          </p>
        </div>
      </div>
    </div>

    <!-- Agency CTA -->
    <div class="max-w-2xl mx-auto pb-20 text-center">
      <p class="text-gray-500 text-sm">
        Managing multiple brands?
        <button
          class="text-indigo-600 hover:text-indigo-700 font-medium
            underline underline-offset-2"
        >
          Join the agency waitlist
        </button>
      </p>
    </div>
  </main>

  <!-- Footer -->
  <footer class="border-t border-gray-100 px-4 py-8 text-center">
    <p class="text-sm text-gray-400">
      &copy; {new Date().getFullYear()} Lnksy. All rights reserved.
    </p>
  </footer>
</div>
