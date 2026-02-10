<script lang="ts">
  interface Tab {
    id: string;
    label: string;
  }

  interface Props {
    tabs: Tab[];
    active: string;
    onchange: (id: string) => void;
  }

  let { tabs, active, onchange }: Props = $props();
</script>

<div
  class="flex border-b border-gray-200 overflow-x-auto
    scrollbar-hide"
>
  {#each tabs as tab}
    <button
      class="px-4 py-2.5 text-sm font-medium whitespace-nowrap
        transition-colors border-b-2 -mb-px
        {active === tab.id
        ? 'border-indigo-600 text-indigo-600'
        : 'border-transparent text-gray-500 hover:text-gray-700'}"
      onclick={() => onchange(tab.id)}
    >
      {tab.label}
    </button>
  {/each}
</div>
