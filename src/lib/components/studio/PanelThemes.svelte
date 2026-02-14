<script lang="ts">
  import { enhance } from '$app/forms';
  import { invalidateAll, goto } from '$app/navigation';
  import PanelShell from './PanelShell.svelte';
  import { studio } from '$lib/stores/studio.svelte.js';
  import type { Theme, Profile } from '$lib/types.js';

  interface Props {
    themes: Theme[];
    profile: Profile;
    isPro: boolean;
  }

  let { themes, profile, isPro }: Props = $props();

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

<PanelShell title="Themes">
  <div class="grid grid-cols-2 gap-3">
    {#each themes as theme (theme.id)}
      {@const selected = profile.theme_id === theme.id}
      {@const locked = theme.is_pro && !isPro}
      <form
        method="POST"
        action="?/selectTheme"
        use:enhance={enhanceAction('Theme updated')}
      >
        <input type="hidden" name="themeId" value={theme.id} />
        <button
          type={locked ? 'button' : 'submit'}
          onclick={locked ? () => goto('/app/billing') : undefined}
          class="w-full text-left p-2.5 rounded-xl border-2 transition-all
            {selected
              ? 'border-indigo-600 ring-2 ring-indigo-200'
              : 'border-gray-200 hover:border-gray-300'}
            {locked ? 'opacity-50' : ''}"
        >
          <div
            class="h-12 rounded-lg mb-1.5"
            style="background: {(theme.config as unknown as Record<string, string>)?.bg ?? '#fff'}"
          ></div>
          <p class="text-xs font-medium text-gray-900 flex items-center gap-1">
            {theme.name}
            {#if theme.is_pro}
              <span class="text-[10px] bg-indigo-100 text-indigo-700
                px-1.5 py-0.5 rounded-full font-semibold">PRO</span>
            {/if}
          </p>
        </button>
      </form>
    {/each}
  </div>
</PanelShell>
