<script lang="ts">
  import { enhance } from '$app/forms';
  import { invalidateAll, goto } from '$app/navigation';
  import PanelShell from './PanelShell.svelte';
  import { studio } from '$lib/stores/studio.svelte.js';
  import type { Background, Profile } from '$lib/types.js';

  interface Props {
    backgrounds: Background[];
    profile: Profile;
    isPro: boolean;
  }

  let { backgrounds, profile, isPro }: Props = $props();

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

<PanelShell title="Background">
  <div class="grid grid-cols-3 gap-3">
    {#each backgrounds as bg (bg.id)}
      {@const selected = profile.background_id === bg.id}
      {@const locked = bg.is_pro && !isPro}
      <form
        method="POST"
        action="?/selectBackground"
        use:enhance={enhanceAction('Background updated')}
      >
        <input type="hidden" name="backgroundId" value={bg.id} />
        <button
          type={locked ? 'button' : 'submit'}
          onclick={locked ? () => goto('/app/billing') : undefined}
          class="w-full rounded-xl border-2 overflow-hidden transition-all
            {selected
              ? 'border-indigo-600 ring-2 ring-indigo-200'
              : 'border-gray-200 hover:border-gray-300'}
            {locked ? 'opacity-50' : ''}"
        >
          <div class="h-14 w-full" style="background: {bg.value};"></div>
          <p class="text-[11px] font-medium text-gray-700 py-1.5 px-1
            flex items-center justify-center gap-1">
            {bg.name}
            {#if bg.is_pro}
              <span class="text-[9px] bg-indigo-100 text-indigo-700
                px-1 py-0.5 rounded-full font-semibold">PRO</span>
            {/if}
          </p>
        </button>
      </form>
    {/each}
  </div>
</PanelShell>
