<script lang="ts">
  import { enhance } from '$app/forms';
  import { invalidateAll, goto } from '$app/navigation';
  import PanelShell from './PanelShell.svelte';
  import { studio } from '$lib/stores/studio.svelte.js';
  import type { Font, Profile } from '$lib/types.js';

  interface Props {
    fonts: Font[];
    profile: Profile;
    isPro: boolean;
  }

  let { fonts, profile, isPro }: Props = $props();

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

<PanelShell title="Fonts">
  <div class="space-y-2">
    {#each fonts as font (font.id)}
      {@const selected = profile.font_id === font.id}
      {@const locked = font.is_pro && !isPro}
      <form
        method="POST"
        action="?/selectFont"
        use:enhance={enhanceAction('Font updated')}
      >
        <input type="hidden" name="fontId" value={font.id} />
        <button
          type={locked ? 'button' : 'submit'}
          onclick={locked ? () => goto('/app/billing') : undefined}
          class="w-full text-left p-3 rounded-xl border-2 transition-all
            {selected
              ? 'border-indigo-600 ring-2 ring-indigo-200'
              : 'border-gray-200 hover:border-gray-300'}
            {locked ? 'opacity-50' : ''}"
        >
          <p
            class="text-sm mb-0.5 text-gray-900"
            style="font-family: {font.family}, sans-serif;"
          >
            {font.name}
          </p>
          <p
            class="text-xs text-gray-400"
            style="font-family: {font.family}, sans-serif;"
          >
            Aa Bb Cc 123
          </p>
          {#if font.is_pro}
            <span class="text-[10px] bg-indigo-100 text-indigo-700
              px-1.5 py-0.5 rounded-full font-semibold mt-1 inline-block">
              PRO
            </span>
          {/if}
        </button>
      </form>
    {/each}
  </div>
</PanelShell>
