<script lang="ts">
  import { enhance } from '$app/forms';
  import { invalidateAll } from '$app/navigation';
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

<PanelShell title="Customize Colors">
  {#if isPro}
    <form
      method="POST"
      action="?/updateOverrides"
      use:enhance={enhanceAction('Customization saved')}
    >
      <div class="grid grid-cols-2 gap-4">
        <label class="space-y-1.5">
          <span class="text-xs text-gray-600">Background</span>
          <input
            type="color"
            name="override_bg"
            value={profile.theme_overrides?.bg ?? '#ffffff'}
            class="w-full h-10 rounded-lg cursor-pointer border border-gray-200"
          />
        </label>
        <label class="space-y-1.5">
          <span class="text-xs text-gray-600">Text color</span>
          <input
            type="color"
            name="override_text"
            value={profile.theme_overrides?.text ?? '#1a1a1a'}
            class="w-full h-10 rounded-lg cursor-pointer border border-gray-200"
          />
        </label>
        <label class="space-y-1.5">
          <span class="text-xs text-gray-600">Card background</span>
          <input
            type="color"
            name="override_cardBg"
            value={profile.theme_overrides?.cardBg ?? '#f3f4f6'}
            class="w-full h-10 rounded-lg cursor-pointer border border-gray-200"
          />
        </label>
        <label class="space-y-1.5">
          <span class="text-xs text-gray-600">Card text</span>
          <input
            type="color"
            name="override_cardText"
            value={profile.theme_overrides?.cardText ?? '#1a1a1a'}
            class="w-full h-10 rounded-lg cursor-pointer border border-gray-200"
          />
        </label>
      </div>
      <Button type="submit" variant="primary" size="sm" class="mt-4 w-full">
        Save customization
      </Button>
    </form>
  {:else}
    <UpgradeCTA message="Customize colors for your page with Pro." />
  {/if}
</PanelShell>
