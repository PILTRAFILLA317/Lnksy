<script lang="ts">
  import './layout.css';
  import type { Snippet } from 'svelte';

  interface Props {
    data: import('./$types.js').LayoutServerData;
    children: Snippet;
  }

  let { data, children }: Props = $props();
</script>

<svelte:head>
  <title>Lnksy — Your links, your style</title>
</svelte:head>

{@render children()}
