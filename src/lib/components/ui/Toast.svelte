<script lang="ts">
  interface Props {
    message: string;
    type?: 'success' | 'error' | 'info';
    visible: boolean;
  }

  let { message, type = 'info', visible }: Props = $props();

  const colors: Record<string, string> = {
    success: 'bg-green-600',
    error: 'bg-red-600',
    info: 'bg-gray-800',
  };
</script>

{#if visible}
  <div
    class="fixed bottom-4 left-1/2 -translate-x-1/2 z-[60]
      px-4 py-2.5 rounded-xl text-white text-sm font-medium
      shadow-lg animate-slide-up {colors[type]}"
    role="status"
    aria-live="polite"
  >
    {message}
  </div>
{/if}

<style>
  @keyframes slide-up {
    from {
      opacity: 0;
      transform: translate(-50%, 1rem);
    }
    to {
      opacity: 1;
      transform: translate(-50%, 0);
    }
  }
  .animate-slide-up {
    animation: slide-up 0.2s ease-out;
  }
</style>
