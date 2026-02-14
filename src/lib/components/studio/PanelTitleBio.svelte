<script lang="ts">
  import { enhance } from '$app/forms';
  import { invalidateAll, goto } from '$app/navigation';
  import PanelShell from './PanelShell.svelte';
  import UpgradeCTA from './UpgradeCTA.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import { studio } from '$lib/stores/studio.svelte.js';
  import type { Profile } from '$lib/types.js';

  interface Props {
    profile: Profile;
    isPro: boolean;
  }

  let { profile, isPro }: Props = $props();

  let displayTitle = $state('');
  let bio = $state('');

  $effect(() => {
    displayTitle = profile.display_title ?? '';
  });
  $effect(() => {
    bio = profile.bio ?? '';
  });

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

<PanelShell title="Title & Bio">
  <!-- Display title -->
  <div class="mb-6">
    <label class="text-xs font-medium text-gray-700 mb-1.5 flex items-center gap-1">
      Display title
      {#if !isPro}
        <span class="text-[10px] bg-indigo-100 text-indigo-700
          px-1.5 py-0.5 rounded-full font-semibold">PRO</span>
      {/if}
    </label>
    {#if isPro}
      <form
        method="POST"
        action="?/updateDisplayTitle"
        use:enhance={enhanceAction('Title updated')}
      >
        <div class="flex gap-2">
          <input
            type="text"
            name="displayTitle"
            bind:value={displayTitle}
            maxlength={60}
            placeholder={profile.handle}
            class="flex-1 px-3 py-2 text-sm border border-gray-300
              rounded-lg text-gray-900 focus:ring-2 focus:ring-indigo-500
              focus:border-indigo-500"
          />
          <Button type="submit" variant="primary" size="sm">Save</Button>
        </div>
        <p class="text-xs text-gray-400 mt-1 text-right">
          {displayTitle.length}/60
        </p>
      </form>
    {:else}
      <button
        type="button"
        onclick={() => goto('/app/billing')}
        class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg
          text-left text-gray-400 opacity-50 min-h-[44px]"
      >
        {profile.handle}
      </button>
      <div class="mt-3">
        <UpgradeCTA message="Set a custom display title with Pro." />
      </div>
    {/if}
  </div>

  <!-- Bio / Description -->
  <div>
    <label for="bio-input" class="text-xs font-medium text-gray-700 mb-1.5 block">
      Description
    </label>
    <form
      method="POST"
      action="?/updateBio"
      use:enhance={enhanceAction('Description updated')}
    >
      <textarea
        id="bio-input"
        name="bio"
        bind:value={bio}
        maxlength={300}
        rows={3}
        placeholder="Tell visitors about yourself..."
        class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg
          text-gray-900 focus:ring-2 focus:ring-indigo-500
          focus:border-indigo-500 resize-none"
      ></textarea>
      <div class="flex items-center justify-between mt-1">
        <p class="text-xs text-gray-400">{bio.length}/300</p>
        <Button type="submit" variant="primary" size="sm">Save</Button>
      </div>
    </form>
  </div>
</PanelShell>
