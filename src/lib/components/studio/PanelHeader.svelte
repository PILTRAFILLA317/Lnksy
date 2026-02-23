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
  <!-- Avatar upload -->
  <h3 class="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
    Avatar
  </h3>
  <form
    method="POST"
    action="?/uploadAvatar"
    enctype="multipart/form-data"
    use:enhance={enhanceAction('Avatar updated')}
    class="mb-6"
  >
    <div class="flex items-center gap-4">
      <!-- Preview -->
      <div class="w-16 h-16 rounded-full overflow-hidden bg-gray-100 shrink-0 ring-2 ring-gray-200">
        {#if profile.avatar_url}
          <img src={profile.avatar_url} alt="Avatar" class="w-full h-full object-cover" />
        {:else}
          <div class="w-full h-full flex items-center justify-center text-xl font-semibold text-gray-400">
            {(profile.name ?? profile.handle ?? '?')[0].toUpperCase()}
          </div>
        {/if}
      </div>
      <div class="flex-1 min-w-0">
        <label
          class="flex items-center justify-center gap-2 w-full py-2 px-3 rounded-lg
            border border-dashed border-gray-300 hover:border-indigo-400
            text-xs font-medium text-gray-500 hover:text-indigo-600
            bg-white hover:bg-indigo-50/40 cursor-pointer transition-all"
        >
          <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
          Change avatar
          <input
            type="file"
            name="avatar"
            accept="image/*"
            class="hidden"
            onchange={(e) => (e.currentTarget.form as HTMLFormElement)?.requestSubmit()}
          />
        </label>
        <p class="text-[10px] text-gray-400 mt-1.5 text-center">Max 2 MB · JPG, PNG, WebP</p>
      </div>
    </div>
  </form>

  <div class="border-t border-gray-100 mb-6"></div>

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
