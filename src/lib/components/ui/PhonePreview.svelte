<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    children: Snippet;
  }

  let { children }: Props = $props();
</script>

<div class="mockup-phone border-indigo-700">
  <div class="mockup-phone-camera"></div>
  <div class="mockup-phone-display overflow-y-auto">
    {@render children()}
  </div>
</div>
