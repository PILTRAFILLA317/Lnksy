<script lang="ts">
  import { enhance } from '$app/forms';
  import { invalidateAll } from '$app/navigation';
  import Button from '$lib/components/ui/Button.svelte';
  import Card from '$lib/components/ui/Card.svelte';
  import Toast from '$lib/components/ui/Toast.svelte';
  import type { Theme } from '$lib/types.js';

  let { data } = $props();

  let toast = $state({ message: '', type: 'success' as const, visible: false });

  const profile = $derived(data.profile);
  const isPro = $derived(profile?.plan === 'PRO');
  const themes = $derived((data.themes ?? []) as Theme[]);

  function showToast(message: string) {
    toast = { message, type: 'success', visible: true };
    setTimeout(() => { toast.visible = false; }, 3000);
  }
</script>

<svelte:head>
  <title>Appearance — Lnksy</title>
</svelte:head>

<Toast message={toast.message} type={toast.type} visible={toast.visible} />

<h1 class="text-lg font-semibold text-gray-900 mb-6">Appearance</h1>

<!-- Themes grid -->
<Card class="mb-6">
  <h2 class="text-sm font-medium text-gray-900 mb-4">Themes</h2>
  <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
    {#each themes as theme (theme.id)}
      {@const selected = profile?.theme_id === theme.id}
      {@const locked = theme.is_pro && !isPro}
      <form
        method="POST"
        action="?/selectTheme"
        use:enhance={() => {
          return async ({ result }) => {
            if (result.type === 'success') {
              invalidateAll();
              showToast('Theme updated');
            }
          };
        }}
      >
        <input type="hidden" name="themeId" value={theme.id} />
        <button
          type="submit"
          disabled={locked}
          class="w-full text-left p-3 rounded-xl border-2
            transition-all
            {selected
            ? 'border-indigo-600 ring-2 ring-indigo-200'
            : 'border-gray-200 hover:border-gray-300'}
            {locked ? 'opacity-50 cursor-not-allowed' : ''}"
        >
          <div
            class="h-16 rounded-lg mb-2"
            style="background: {(theme.config as Record<string,string>)?.bg ?? '#fff'}"
          ></div>
          <p class="text-xs font-medium text-gray-900 flex
            items-center gap-1">
            {theme.name}
            {#if theme.is_pro}
              <span class="text-[10px] bg-indigo-100 text-indigo-700
                px-1.5 py-0.5 rounded-full font-semibold">
                PRO
              </span>
            {/if}
          </p>
        </button>
      </form>
    {/each}
  </div>
</Card>

<!-- Customization (Pro only) -->
<Card class="mb-6">
  <h2 class="text-sm font-medium text-gray-900 mb-4">
    Customize
    {#if !isPro}
      <span class="text-[10px] bg-indigo-100 text-indigo-700
        px-1.5 py-0.5 rounded-full font-semibold ml-1">PRO</span>
    {/if}
  </h2>

  {#if isPro}
    <form
      method="POST"
      action="?/updateOverrides"
      use:enhance={() => {
        return async ({ result }) => {
          if (result.type === 'success') {
            invalidateAll();
            showToast('Customization saved');
          }
        };
      }}
    >
      <div class="grid grid-cols-2 gap-4">
        <label class="space-y-1">
          <span class="text-xs text-gray-600">Background</span>
          <input
            type="color"
            name="override_bg"
            value={profile?.theme_overrides?.bg ?? '#ffffff'}
            class="w-full h-10 rounded-lg cursor-pointer"
          />
        </label>
        <label class="space-y-1">
          <span class="text-xs text-gray-600">Text color</span>
          <input
            type="color"
            name="override_text"
            value={profile?.theme_overrides?.text ?? '#1a1a1a'}
            class="w-full h-10 rounded-lg cursor-pointer"
          />
        </label>
        <label class="space-y-1">
          <span class="text-xs text-gray-600">Card background</span>
          <input
            type="color"
            name="override_cardBg"
            value={profile?.theme_overrides?.cardBg ?? '#f3f4f6'}
            class="w-full h-10 rounded-lg cursor-pointer"
          />
        </label>
        <label class="space-y-1">
          <span class="text-xs text-gray-600">Card text</span>
          <input
            type="color"
            name="override_cardText"
            value={profile?.theme_overrides?.cardText ?? '#1a1a1a'}
            class="w-full h-10 rounded-lg cursor-pointer"
          />
        </label>
      </div>
      <Button type="submit" variant="primary" size="sm" class="mt-4">
        Save customization
      </Button>
    </form>
  {:else}
    <p class="text-sm text-gray-500">
      Customize colors, fonts, and more with Pro.
      <a href="/app/billing" class="text-indigo-600 underline">
        Upgrade
      </a>
    </p>
  {/if}
</Card>

<!-- Branding toggle -->
<Card>
  <div class="flex items-center justify-between">
    <div>
      <h2 class="text-sm font-medium text-gray-900">
        "Made with Lnksy" badge
      </h2>
      <p class="text-xs text-gray-500 mt-0.5">
        {isPro ? 'Toggle the Lnksy branding on your page'
          : 'Remove branding with Pro'}
      </p>
    </div>
    <form
      method="POST"
      action="?/toggleBranding"
      use:enhance={() => {
        return async ({ result }) => {
          if (result.type === 'success') {
            invalidateAll();
            showToast('Branding updated');
          }
        };
      }}
    >
      <button
        type="submit"
        disabled={!isPro}
        class="relative w-11 h-6 rounded-full transition-colors
          {profile?.branding_enabled
          ? 'bg-indigo-600'
          : 'bg-gray-300'}
          {!isPro ? 'opacity-50 cursor-not-allowed' : ''}"
      >
        <div
          class="absolute top-0.5 left-0.5 w-5 h-5 rounded-full
            bg-white transition-transform shadow-sm
            {profile?.branding_enabled
            ? 'translate-x-5'
            : 'translate-x-0'}"
        ></div>
      </button>
    </form>
  </div>
</Card>
