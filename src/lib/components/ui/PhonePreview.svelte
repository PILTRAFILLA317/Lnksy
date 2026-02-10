<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    children: Snippet;
  }

  let { children }: Props = $props();
</script>

<div class="flex justify-center">
  <div
    class="relative w-[375px] h-[700px] rounded-[40px] border-4
      border-gray-800 bg-gray-800 shadow-2xl overflow-hidden"
  >
    <!-- Notch -->
    <div
      class="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6
        bg-gray-800 rounded-b-2xl z-10"
    ></div>
    <!-- Screen -->
    <div class="h-full w-full overflow-y-auto rounded-[36px] bg-white">
      {@render children()}
    </div>
  </div>
</div>
