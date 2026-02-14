<script lang="ts">
  import { enhance } from '$app/forms';
  import { invalidateAll, goto } from '$app/navigation';
  import PanelShell from './PanelShell.svelte';
  import { studio } from '$lib/stores/studio.svelte.js';
  import type { Profile, MainLinksLayout } from '$lib/types.js';

  interface Props {
    profile: Profile;
    isPro: boolean;
  }

  let { profile, isPro }: Props = $props();

  const LAYOUT_OPTIONS: {
    value: MainLinksLayout;
    label: string;
    desc: string;
    pro: boolean;
  }[] = [
    { value: 'LIST_ICON', label: 'List', desc: 'Full-width cards with icons', pro: false },
    { value: 'GRID_ICON', label: 'Grid', desc: '2-column grid with icons', pro: false },
    { value: 'GRID_IMAGE', label: 'Grid + Image', desc: '2-column with images', pro: true },
    { value: 'LIST_IMAGE', label: 'List + Image', desc: 'Cards with thumbnails', pro: true },
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

<PanelShell title="Layout">
  <p class="text-xs text-gray-500 mb-4">
    Choose how your links are displayed.
  </p>

  <div class="grid grid-cols-2 gap-3">
    {#each LAYOUT_OPTIONS as opt}
      {@const selected = profile.main_links_layout === opt.value}
      {@const locked = opt.pro && !isPro}
      <form
        method="POST"
        action="?/updateLayout"
        use:enhance={enhanceAction('Layout updated')}
      >
        <input type="hidden" name="layout" value={opt.value} />
        <button
          type={locked ? 'button' : 'submit'}
          onclick={locked ? () => goto('/app/billing') : undefined}
          class="w-full text-left p-3 rounded-xl border-2 transition-all
            min-h-[80px]
            {selected
              ? 'border-indigo-600 ring-2 ring-indigo-200'
              : 'border-gray-200 hover:border-gray-300'}
            {locked ? 'opacity-50' : ''}"
        >
          <p class="text-xs font-medium text-gray-900 flex items-center gap-1">
            {opt.label}
            {#if opt.pro}
              <span class="text-[10px] bg-indigo-100 text-indigo-700
                px-1.5 py-0.5 rounded-full font-semibold">PRO</span>
            {/if}
          </p>
          <p class="text-[11px] text-gray-500 mt-0.5">{opt.desc}</p>
        </button>
      </form>
    {/each}
  </div>
</PanelShell>
