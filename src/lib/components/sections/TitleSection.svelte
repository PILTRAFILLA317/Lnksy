<script lang="ts">
  interface Props {
    displayTitle: string;
    bio: string | null;
  }

  let { displayTitle, bio }: Props = $props();
</script>

<div class="text-center px-4 mt-2 mb-2">
  <h1 class="text-xl font-bold break-words">{displayTitle}</h1>
  {#if bio}
    <p class="mt-2 text-sm opacity-80 max-w-xs mx-auto break-words">
      {bio}
    </p>
  {/if}
</div>
