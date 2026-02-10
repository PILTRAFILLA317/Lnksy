<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    class?: string;
    children: Snippet;
  }

  let { class: className = '', children }: Props = $props();
</script>

<div
  class="rounded-2xl border border-gray-200 bg-white p-4
    md:p-6 {className}"
>
  {@render children()}
</div>
