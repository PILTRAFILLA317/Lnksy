<script lang="ts">
  import { enhance } from '$app/forms';
  import { invalidateAll, goto } from '$app/navigation';
  import PanelShell from './PanelShell.svelte';
  import UpgradeCTA from './UpgradeCTA.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import { studio } from '$lib/stores/studio.svelte.js';
  import type { Profile, HeaderMode } from '$lib/types.js';

  interface Props {
    profile: Profile;
    isPro: boolean;
  }

  let { profile, isPro }: Props = $props();

  const HEADER_MODES: { value: HeaderMode; label: string; pro: boolean }[] = [
    { value: 'AVATAR', label: 'Avatar only', pro: false },
    { value: 'HERO', label: 'Hero banner', pro: true },
    { value: 'AVATAR_HERO', label: 'Avatar + Hero', pro: true },
  ];

  function enhanceAction(successMsg: string) {
    return () => {
      return async ({ result }: { result: { type: string } }) => {
        if (result.type === 'success') {
          invalidateAll();
          studio.showToast(successMsg);
        } else if (result.type === 'failure') {
          studio.showToast('Action failed', 'error');
        }
      };
    };
  }
</script>

<PanelShell title="Header">
  <!-- Header mode selector -->
  <h3 class="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
    Header Style
  </h3>
  <div class="flex gap-2 mb-6">
    {#each HEADER_MODES as mode}
      {@const selected = profile.header_mode === mode.value}
      {@const locked = mode.pro && !isPro}
      <form
        method="POST"
        action="?/updateHeaderMode"
        use:enhance={enhanceAction('Header updated')}
      >
        <input type="hidden" name="headerMode" value={mode.value} />
        <button
          type={locked ? 'button' : 'submit'}
          onclick={locked ? () => goto('/app/billing') : undefined}
          class="px-3 py-2 rounded-lg border-2 text-xs font-medium
            transition-all min-h-[44px]
            {selected
              ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
              : 'border-gray-200 text-gray-600 hover:border-gray-300'}
            {locked ? 'opacity-50' : ''}"
        >
          {mode.label}
          {#if mode.pro}
            <span class="ml-1 text-[10px] bg-indigo-100 text-indigo-700
              px-1 py-0.5 rounded-full font-semibold">PRO</span>
          {/if}
        </button>
      </form>
    {/each}
  </div>

  <!-- Hero upload (visible when HERO or AVATAR_HERO) -->
  {#if profile.header_mode === 'HERO' || profile.header_mode === 'AVATAR_HERO'}
    <h3 class="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
      Hero Image
    </h3>
    <form
      method="POST"
      action="?/uploadHero"
      enctype="multipart/form-data"
      use:enhance={enhanceAction('Hero uploaded')}
      class="mb-4"
    >
      {#if profile.hero_url}
        <div class="mb-3 rounded-lg overflow-hidden h-28 bg-gray-100">
          <img
            src={profile.hero_url}
            alt="Hero preview"
            class="w-full h-full object-cover"
          />
        </div>
      {/if}
      <div class="flex items-center gap-3">
        <input
          type="file"
          name="hero"
          accept="image/*"
          class="text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3
            file:rounded-lg file:border-0 file:text-xs file:font-medium
            file:bg-indigo-50 file:text-indigo-700 file:cursor-pointer
            hover:file:bg-indigo-100"
        />
        <Button type="submit" variant="primary" size="sm">Upload</Button>
      </div>
      <p class="text-xs text-gray-400 mt-1">Max 5 MB. Recommended 1200x400.</p>
    </form>
  {:else if !isPro}
    <UpgradeCTA message="Unlock hero banners and avatar + hero layouts with Pro." />
  {/if}
</PanelShell>
