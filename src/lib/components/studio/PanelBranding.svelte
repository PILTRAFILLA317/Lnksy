<script lang="ts">
  import { enhance } from '$app/forms';
  import { invalidateAll, goto } from '$app/navigation';
  import PanelShell from './PanelShell.svelte';
  import UpgradeCTA from './UpgradeCTA.svelte';
  import { studio } from '$lib/stores/studio.svelte.js';
  import type { Profile } from '$lib/types.js';

  interface Props {
    profile: Profile;
    isPro: boolean;
  }

  let { profile, isPro }: Props = $props();

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

<PanelShell title="Branding">
  <div class="flex items-start gap-4">
    <div class="flex-1">
      <h3 class="text-sm font-medium text-gray-900">
        "Made with Lnksy" badge
      </h3>
      <p class="text-xs text-gray-500 mt-0.5">
        {isPro
          ? 'Toggle the Lnksy branding on your page.'
          : 'Remove branding with Pro.'}
      </p>
    </div>
    <form
      method="POST"
      action="?/toggleBranding"
      use:enhance={enhanceAction('Branding updated')}
    >
      <button
        type={isPro ? 'submit' : 'button'}
        onclick={!isPro ? () => goto('/app/billing') : undefined}
        class="relative w-11 h-6 rounded-full transition-colors shrink-0
          min-h-[24px]
          {profile.branding_enabled ? 'bg-indigo-600' : 'bg-gray-300'}
          {!isPro ? 'opacity-50' : ''}"
        aria-label="Toggle branding"
      >
        <div
          class="absolute top-0.5 left-0.5 w-5 h-5 rounded-full
            bg-white transition-transform shadow-sm
            {profile.branding_enabled ? 'translate-x-5' : 'translate-x-0'}"
        ></div>
      </button>
    </form>
  </div>

  {#if !isPro}
    <div class="mt-4">
      <UpgradeCTA message="Remove the Lnksy badge with Pro." />
    </div>
  {/if}
</PanelShell>
